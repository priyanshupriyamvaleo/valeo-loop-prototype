// ── The hand-off: three artefacts, one generator ──────────────
//
// THE CMS CANNOT EMIT AN IMPLEMENTATION. It can emit three things, and most
// hand-offs emit only the first — then the team discovers the other two in
// sprint three:
//
//   A CONTRACT     what to subscribe to, and what to do when it fires
//   THE CLAIMS     what we have assumed about the existing system
//   THE GAPS       what does not exist yet and has to be built
//
// So three artefacts, because three different people read them and no one
// format serves all three. The JSON is the contract, the table is the review
// surface, and the questions are the risk register. The questions are the one
// that saves the project: "are Month 1, 2 and 3 three orders or one order
// shipped three times" is the difference between a two-week task and a
// two-month one, and no JSON can ask it.

import { resolveProtocol } from "@/lib/protocol-chain"
import {
    fieldExists, fieldLabel, pathOfFulfilment, runtimeFindings, statusDef, statusLabel,
} from "@/lib/protocol-runtime"
import type { Listing, Protocol, ProtocolFulfilment, StatusField } from "@/types"

// ── A · the contract ─────────────────────────────────────────

/**
 * The reverse index is the point of the whole artefact.
 *
 * The consumer is a handler that receives `(childOrderId, field, newStatus)`
 * and has to answer "what advances?". Precomputing that here makes the handler
 * a lookup with nothing to derive, and nothing to get wrong.
 */
export interface ContractIndex {
    [fulfilmentId: string]: {
        [field: string]: {
            [status: string]: { completes: string[]; retries: string[] }
        }
    }
}

export interface RuntimeContract {
    protocol: string
    protocolCode: string
    path: string
    emittedAt: string
    entry: { on: string; note: string }
    fulfilments: {
        id: string
        label: string
        unit?: { listingId: string; kind: string; unitId: string }
        fulfilmentPath?: string
    }[]
    steps: {
        id: string
        order: number
        title: string
        actor: string
        type: string
        requires?: string
        produces?: string
        advance: {
            fulfilmentId?: string
            field: string
            /** UPPER_SNAKE keys. The wire values are on `statusWire`. */
            completesOn: string[]
            retriesOn: string[]
            /** The value the API actually sends, per key, so nobody has to guess. */
            statusWire: Record<string, string>
            manualOverride: boolean
        } | null
        waiting?: string
        unlocks: string[]
    }[]
    halt: { anyFulfilmentReaches: string[]; note: string }
    index: ContractIndex
    assumptions: string[]
    gaps: string[]
}

const wireOf = (field: StatusField, id: string) => statusDef(field, id)?.wire ?? id

export function runtimeContract(
    protocol: Protocol, listings: Listing[], pathId?: string,
): RuntimeContract {
    /* Resolved FIRST. A contract with branches in it describes nobody, which is
       the same discipline every consumer downstream of the resolver keeps. */
    const resolved = resolveProtocol(protocol, pathId)
    const steps = [...resolved.steps].sort((a, b) => a.order - b.order)
    const fulfilments = protocol.fulfilments ?? []
    const findings = runtimeFindings(protocol, listings)

    const index: ContractIndex = {}
    const put = (fid: string, field: string, status: string, into: "completes" | "retries", stepId: string) => {
        index[fid] ??= {}
        index[fid][field] ??= {}
        index[fid][field][status] ??= { completes: [], retries: [] }
        index[fid][field][status][into].push(stepId)
    }

    steps.forEach(s => {
        const a = s.advance
        if (!a?.fulfilmentId) return
        a.completesOn.forEach(id => put(a.fulfilmentId!, a.field, id, "completes", s.id))
        ;(a.retriesOn ?? []).forEach(id => put(a.fulfilmentId!, a.field, id, "retries", s.id))
    })

    return {
        protocol: protocol.id,
        protocolCode: protocol.code,
        path: pathId ?? "all",
        emittedAt: new Date().toISOString(),
        entry: {
            on: "PACKAGE_PURCHASED",
            note: "Being on step one IS having bought the package. There is no separate flag.",
        },
        fulfilments: fulfilments.map(f => ({
            id: f.id,
            label: f.label,
            ...(f.unit ? { unit: { listingId: f.unit.listingId, kind: f.unit.kind, unitId: f.unit.unitId } } : {}),
            ...(pathOfFulfilment(f, listings) ? { fulfilmentPath: pathOfFulfilment(f, listings) } : {}),
        })),
        steps: steps.map((s, i) => ({
            id: s.id,
            order: i,
            title: s.titleEn,
            actor: s.actor,
            type: s.type,
            ...(s.requires ? { requires: s.requires } : {}),
            ...(s.produces ? { produces: s.produces } : {}),
            advance: s.advance
                ? {
                    ...(s.advance.fulfilmentId ? { fulfilmentId: s.advance.fulfilmentId } : {}),
                    field: s.advance.field,
                    completesOn: s.advance.completesOn,
                    retriesOn: s.advance.retriesOn ?? [],
                    statusWire: Object.fromEntries(
                        [...s.advance.completesOn, ...(s.advance.retriesOn ?? [])]
                            .map(id => [id, wireOf(s.advance!.field, id)]),
                    ),
                    manualOverride: !!s.advance.manualOverride,
                }
                : null,
            ...(s.waitingEn?.trim() ? { waiting: s.waitingEn.trim() } : {}),
            unlocks: steps[i + 1] ? [steps[i + 1].id] : [],
        })),
        halt: {
            anyFulfilmentReaches: ["CANCELLED"],
            note: "Any watched order reaching CANCELLED halts the protocol. One rule, not a "
                + "cancel field on every step.",
        },
        index,
        assumptions: assumptionsFor(protocol, listings),
        gaps: findings.errors.map(g => `${g.what}. ${g.why}`),
    }
}

// ── B · the subscription table ───────────────────────────────

export interface SubscriptionRow {
    n: number
    step: string
    watches: string
    field: string
    completesOn: string
    retriesOn: string
    patientReads: string
}

/** One row per step. The review surface: "is this row right?", asked N times. */
export function subscriptionRows(
    protocol: Protocol, listings: Listing[], pathId?: string,
): SubscriptionRow[] {
    const steps = [...resolveProtocol(protocol, pathId).steps].sort((a, b) => a.order - b.order)
    const byId = new Map((protocol.fulfilments ?? []).map(f => [f.id, f]))

    return steps.map((s, i) => {
        const a = s.advance
        return {
            n: i + 1,
            step: s.titleEn || "Untitled step",
            watches: a?.fulfilmentId ? (byId.get(a.fulfilmentId)?.label ?? "— unknown order") : "—",
            field: a ? fieldLabel(a.field) : "—",
            completesOn: a?.completesOn.length
                ? a.completesOn.map(id => statusLabel(a.field, id)).join(" or ")
                : "— nothing",
            retriesOn: a?.retriesOn?.length
                ? a.retriesOn.map(id => statusLabel(a.field, id)).join(" or ")
                : "—",
            patientReads: s.waitingEn?.trim() || "— nothing written",
        }
    })
}

export function subscriptionTsv(rows: SubscriptionRow[]): string {
    const head = ["#", "Step", "Watches", "Field", "Completes on", "Retries on", "Patient reads"]
    return [head, ...rows.map(r => [
        String(r.n), r.step, r.watches, r.field, r.completesOn, r.retriesOn, r.patientReads,
    ])].map(cells => cells.join("\t")).join("\n")
}

// ── C · the open questions ───────────────────────────────────

/** The claims the CMS has made about the live system. It cannot verify any of them. */
function assumptionsFor(protocol: Protocol, listings: Listing[]): string[] {
    const out = [
        "Statuses are read space-separated (\"SAMPLE RECEIVED\") and at least one write path "
        + "sends UPPER_SNAKE (\"RESULTS_UPLOADED_TO_APP\"). Every key here is UPPER_SNAKE and "
        + "each step carries `statusWire` beside it. Confirm both directions.",
        "PARTIAL RESULTS UPLOADED TO APP and RESULTS UPLOADED TO APP are ALTERNATIVES, not a "
        + "sequence. Nothing here treats one as following the other.",
        "The reachable-status map per order kind is our reading of the console, not a documented "
        + "contract. The transition graph lives behind the API — the console reads the allowed "
        + "set per child order and renders it.",
        "Any watched order reaching CANCELLED halts the protocol.",
    ]
    const paths = new Set(
        (protocol.fulfilments ?? []).map(f => pathOfFulfilment(f, listings)).filter(Boolean),
    )
    if (paths.size) {
        out.push(`This protocol's orders are of ${[...paths].join(", ")} kind. We assume the `
            + "settable set differs per kind and have filtered the pickers accordingly.")
    }
    return out
}

/**
 * The prose artefact, and the only one that asks rather than states.
 *
 * Three lists on purpose. CONFIRM is cheap and someone can answer it in a
 * morning. BUILD is a cost. DECIDE is the one that changes the shape of the
 * work, and it has to be asked before anybody writes a migration.
 */
export function openQuestions(
    protocol: Protocol, listings: Listing[], pathId?: string,
): string {
    const resolved = resolveProtocol(protocol, pathId)
    const steps = [...resolved.steps].sort((a, b) => a.order - b.order)
    const fulfilments = protocol.fulfilments ?? []
    const findings = runtimeFindings(protocol, listings)

    /* The repeated-unit count is the Month 1/2/3 question, computed rather than
       asserted, so the question names the real orders. */
    const byUnit = new Map<string, ProtocolFulfilment[]>()
    fulfilments.forEach(f => {
        if (!f.unit) return
        const k = `${f.unit.listingId}:${f.unit.kind}:${f.unit.unitId}`
        byUnit.set(k, [...(byUnit.get(k) ?? []), f])
    })
    const repeated = [...byUnit.values()].filter(g => g.length > 1)

    const onlyCompleted = steps.filter(s =>
        s.advance?.completesOn.length === 1 && s.advance.completesOn[0] === "COMPLETED")

    const notWritten = steps.filter(s => s.advance && !fieldExists(s.advance.field))

    const L = (xs: string[]) => xs.map((x, i) => `${i + 1}. ${x}`).join("\n\n")

    return `# ${protocol.nameEn} · open questions

Generated from the Step Builder on ${new Date().toISOString().slice(0, 10)} for path \
\`${pathId ?? "all"}\`. ${steps.length} steps, ${fulfilments.length} orders.

This is not a specification. It is the list of things the specification ASSUMES, and the things it
cannot describe because they do not exist. Answer these before anybody writes a migration.

## 1 · Confirm

${L(assumptionsFor(protocol, listings))}

## 2 · Build — these do not exist today

${L([
    ...(onlyCompleted.length
        ? [`**A consultation outcome.** ${onlyCompleted.length} of ${steps.length} steps can only \
complete on \`COMPLETED\`${onlyCompleted.length ? ` — ${onlyCompleted.map(s => s.titleEn).join(", ")}` : ""}. \
\`COMPLETED\` records that the call happened, not what was decided. There is no consult-outcome \
enum anywhere in the admin panel: no consultation status, no eligibility field, nothing that says \
"continue as planned" or "not suitable". Until it exists, a step that depends on the DECISION \
cannot be gated on it.`]
        : []),
    ...(notWritten.length
        ? [`**A patient-event feed.** ${notWritten.length} step${notWritten.length === 1 ? "" : "s"} \
wait${notWritten.length === 1 ? "s" : ""} on something the patient does — \
${notWritten.map(s => s.titleEn).join(", ")}. Nothing writes it. "The report was viewed once" is \
not recorded anywhere today.`]
        : []),
    `**A status a nurse arriving can set.** \`NURSE_AT_LOCATION\` exists in the audit-log \
metadata and is written by nothing — no screen, no app, no service. So "Nurse reached" cannot be \
a step. If the journey needs it, the nurse app has to report it.`,
])}

## 3 · Decide — the answer changes the shape of the work

${L([
    ...(repeated.length
        ? repeated.map(g => `**Are these ${g.length} orders, or one order fulfilled ${g.length} \
times?** The Step Builder has authored ${g.length} separate orders for the same item: \
${g.map(f => f.label).join(", ")}. If the live system creates ONE child order and ships it \
${g.length} times, then ${g.length} steps need a shipment ordinal and the contract above is \
wrong. This is the single biggest fork in the work.`)
        : []),
    `**Who owns the advance?** The contract assumes the order service pushes a status change and \
something subscribes. If instead the app polls, the \`index\` is still the right lookup but the \
latency budget is different and a patient may sit on a finished step.`,
    `**What happens to a step mid-flight when a protocol is re-published?** A patient on step 4 \
of the old wording, when step 4's completion rule changes. The CMS does not version protocols per \
patient today.`,
])}

## 4 · What the Step Builder already refuses

${findings.errors.length
    ? L(findings.errors.map(g => `${g.what}. ${g.why}`))
    : "Nothing. Every step names a signal that finishes it."}

## 5 · What it warns about, and allows

${findings.notes.length
    ? L(findings.notes.map(g => `${g.what}. ${g.why}`))
    : "Nothing."}
`
}
