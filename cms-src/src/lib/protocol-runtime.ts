// ── How a step advances: the signals, and the checks ──────────
//
// A protocol holds no time, and the order is the dependency. What the order
// cannot say is HOW THE SYSTEM LEARNS A STEP IS FINISHED. Without that, every
// protocol stalls at step one and no screen says so.
//
// ── EVERY VOCABULARY HERE IS A MIRROR, AND IT SAYS SO ──
//
// Mirrored from the live Valeo admin panel at
// `Valeo_UI/Admin-Panel-master-e54bdab7f-2026-08-14`:
//
//   the 16 child-order statuses  src/pages/Orders/orderConstants.js:19
//                                `CHILD_ORDER_STATUS_DEFINITIONS`
//   the log-only legacy keys     src/pages/Orders/orderConstants.js:92
//                                `LEGACY_STATUS_LOG_META`
//   the nurse-assigned set       src/pages/Orders/orderConstants.js:5
//                                `NURSE_REQUIRED_STATUSES`
//   the home-visit ladder        src/pages/HomeCarePortal/bookingStatus.js:1
//   the prescription statuses    src/pages/Orders/OrdersDashboardDetails.jsx:2860, :4478
//
// TWO THINGS THE MIRROR MUST CARRY, or it lies by omission:
//
//   `settable`  Some statuses render in the audit log and are written by
//               NOTHING. `NURSE_AT_LOCATION` is one, which is why "Nurse
//               Reached" cannot be a step today. A step waiting on one waits
//               for ever, and nothing on a phone would say why.
//   `on`        The 16 are a UNION ACROSS ITEM TYPES. A medicine order never
//               reaches `SAMPLE RECEIVED`. So the useful question is not "is
//               this status real" but "is it reachable on an order of this
//               kind", and `Listing.fulfilmentPath` already answers it.
//
// AND THE REACHABILITY MAP IS A CLAIM, NOT A FACT. The transition graph lives
// behind the API — the console reads the allowed set per child order and
// renders it. So the map goes into the hand-off's Confirm list, out loud,
// rather than sitting in here as though it were settled.

import { pathsOf, resolveProtocol } from "@/lib/protocol-chain"
import { unitLabel } from "@/lib/composition"
import type { PlanGap } from "@/lib/protocol-plans"
import type {
    FulfilmentPath, Listing, Protocol, ProtocolFulfilment,
    ProtocolStep, StatusField, StepAdvance,
} from "@/types"

// ── The four fields ──────────────────────────────────────────

export const STATUS_FIELDS: {
    id: StatusField
    label: string
    blurb: string
    /** Whether anything in the live system writes this field at all. */
    exists: boolean
}[] = [
    {
        id: "child_order_status", label: "The order's status", exists: true,
        blurb: "The 16 statuses on a child order. Most steps advance on one of these.",
    },
    {
        id: "booking_status", label: "The home visit's status", exists: true,
        blurb: "The nurse ladder. Eight positions, and it only moves forward.",
    },
    {
        id: "prescription_status", label: "The prescription's status", exists: true,
        blurb: "Approved or rejected, on a medicine order. A separate field, not an order status.",
    },
    {
        id: "app_event", label: "The patient does something", exists: false,
        blurb: "They view a report, or confirm. NOTHING WRITES THIS YET — it has to be built.",
    },
]

export const fieldLabel = (f: StatusField) =>
    STATUS_FIELDS.find(x => x.id === f)?.label ?? f
export const fieldExists = (f: StatusField) =>
    !!STATUS_FIELDS.find(x => x.id === f)?.exists

// ── The 16, plus the ones nothing can set ────────────────────

export interface StatusDef {
    /** Canonical UPPER_SNAKE. Reads arrive space-separated; one write is snake. */
    id: string
    /** The value the API actually sends. "SAMPLE COLLECTED BY HOMECARE". */
    wire: string
    label: string
    /** The fulfilment paths an order can reach it on. Empty = any. */
    on: FulfilmentPath[]
    /** Whether ANYTHING in the live system can set it. */
    settable: boolean
    /** Set on a status that ends the protocol or re-opens a step. */
    kind?: "halt" | "retry"
}

const ALL: FulfilmentPath[] = []

export const CHILD_ORDER_STATUSES: StatusDef[] = [
    { id: "CREATED", wire: "CREATED", label: "Order Created", on: ALL, settable: true },
    { id: "ASSIGNED", wire: "ASSIGNED", label: "Agent Assigned", on: ["blood", "home_service"], settable: true },
    { id: "ORDER_CONFIRMED", wire: "ORDER CONFIRMED", label: "Appointment Confirmed", on: ALL, settable: true },
    { id: "LAB_CONFIRMED", wire: "LAB CONFIRMED", label: "Lab Confirmed", on: ["blood"], settable: true },
    {
        id: "SAMPLE_COLLECTED_BY_HOMECARE", wire: "SAMPLE COLLECTED BY HOMECARE",
        label: "Sample Collected By Homecare", on: ["blood", "home_service"], settable: true,
    },
    { id: "SAMPLE_DROPPED_TO_LAB", wire: "SAMPLE DROPPED TO LAB", label: "Sample Dropped To Lab", on: ["blood"], settable: true },
    { id: "SAMPLE_RECEIVED", wire: "SAMPLE RECEIVED", label: "Sample Received", on: ["blood"], settable: true },
    { id: "REPORT_RECEIVED", wire: "REPORT RECEIVED", label: "Report Received", on: ["blood"], settable: true },
    {
        id: "PARTIAL_RESULTS_UPLOADED_TO_APP", wire: "PARTIAL RESULTS UPLOADED TO APP",
        label: "Partial Results Uploaded To App", on: ["blood"], settable: true,
    },
    {
        id: "RESULTS_UPLOADED_TO_APP", wire: "RESULTS UPLOADED TO APP",
        label: "Results Uploaded To App", on: ["blood"], settable: true,
    },
    { id: "COACH_REVIEWED", wire: "COACH REVIEWED", label: "Coach Reviewed", on: ["blood", "consultation"], settable: true },
    { id: "PROCESSING", wire: "PROCESSING", label: "Processing", on: ["supplement", "digital_instant", "blood"], settable: true },
    { id: "SHIPPED", wire: "SHIPPED", label: "Order Shipped", on: ["supplement"], settable: true },
    { id: "COMPLETED", wire: "COMPLETED", label: "Order Completed", on: ALL, settable: true },
    { id: "RECOLLECTION", wire: "RECOLLECTION", label: "Recollection", on: ["blood"], settable: true, kind: "retry" },
    { id: "CANCELLED", wire: "CANCELLED", label: "Cancelled", on: ALL, settable: true, kind: "halt" },

    /* ── RENDERABLE, AND WRITTEN BY NOTHING ──
       These live in `LEGACY_STATUS_LOG_META`. They draw in the audit log and no
       screen, app or service sets them. They are offered here ON PURPOSE, so an
       author reaching for "Nurse Reached" is told why it cannot be a step
       rather than finding an empty dropdown and assuming the mirror is
       incomplete. */
    { id: "NURSE_AT_LOCATION", wire: "NURSE_AT_LOCATION", label: "Nurse at Location", on: ["blood", "home_service"], settable: false },
    { id: "ON_HOLD", wire: "ON_HOLD", label: "On Hold", on: ALL, settable: false },
    { id: "ACTION_REQUIRED", wire: "ACTION_REQUIRED", label: "Action Required", on: ALL, settable: false },
    { id: "REFUNDED", wire: "REFUNDED", label: "Refunded", on: ALL, settable: false },
    { id: "NURSE_ASSIGNED", wire: "NURSE_ASSIGNED", label: "Nurse Assigned", on: ["blood", "home_service"], settable: false },
    { id: "BROADCASTING", wire: "BROADCASTING", label: "Broadcasting", on: ["blood", "home_service"], settable: false },
]

/** The home-visit ladder. Ordered, and the live panel refuses to move backwards. */
export const BOOKING_STATUSES: (StatusDef & { position: number })[] = [
    { id: "CREATED", wire: "Created", label: "New Order", position: 1, on: ["blood", "home_service"], settable: true },
    { id: "NURSE_APPOINTED", wire: "Nurse Appointed", label: "Assigned to a nurse", position: 2, on: ["blood", "home_service"], settable: true },
    { id: "NURSE_ACKNOWLEDGED", wire: "Nurse Acknowledged", label: "Nurse acknowledged", position: 3, on: ["blood", "home_service"], settable: true },
    { id: "CHANGE_NURSE", wire: "Change Nurse", label: "Change nurse", position: 4, on: ["blood", "home_service"], settable: true, kind: "retry" },
    { id: "SAMPLE_COLLECTED", wire: "Sample Collected", label: "Sample collected", position: 5, on: ["blood", "home_service"], settable: true },
    { id: "SAMPLE_DELIVERED", wire: "Sample Delivered", label: "Dropped at the lab", position: 6, on: ["blood"], settable: true },
    { id: "COMPLETED", wire: "Completed", label: "Order completed", position: 7, on: ["blood", "home_service"], settable: true },
    { id: "CANCELLED", wire: "CANCELLED", label: "Order cancelled", position: 8, on: ALL, settable: true, kind: "halt" },
]

export const PRESCRIPTION_STATUSES: StatusDef[] = [
    { id: "PENDING", wire: "PENDING", label: "Waiting on a clinician", on: ["supplement"], settable: true },
    { id: "APPROVED", wire: "APPROVED", label: "Approved", on: ["supplement"], settable: true },
    { id: "REJECTED", wire: "REJECTED", label: "Rejected", on: ["supplement"], settable: true, kind: "halt" },
]

/** The vocabulary for one field. `app_event` has none, because nothing writes it. */
export function statusesFor(field: StatusField): StatusDef[] {
    if (field === "booking_status") return BOOKING_STATUSES
    if (field === "prescription_status") return PRESCRIPTION_STATUSES
    if (field === "child_order_status") return CHILD_ORDER_STATUSES
    return []
}

export function statusDef(field: StatusField, id: string): StatusDef | undefined {
    return statusesFor(field).find(s => s.id === id)
}

export const statusLabel = (field: StatusField, id: string) =>
    statusDef(field, id)?.label ?? id

/** Which field a status belongs to, so a status on the wrong field is catchable. */
export function fieldOfStatus(id: string): StatusField | undefined {
    if (PRESCRIPTION_STATUSES.some(s => s.id === id)
        && !CHILD_ORDER_STATUSES.some(s => s.id === id)) return "prescription_status"
    if (CHILD_ORDER_STATUSES.some(s => s.id === id)) return "child_order_status"
    if (BOOKING_STATUSES.some(s => s.id === id)) return "booking_status"
    return undefined
}

// ── Fulfilments ──────────────────────────────────────────────

const rid = () => Math.random().toString(36).slice(2, 9)

export function emptyFulfilment(label = ""): ProtocolFulfilment {
    return { id: `f-${rid()}`, label, unit: undefined }
}

export function emptyAdvance(): StepAdvance {
    return { fulfilmentId: undefined, field: "child_order_status", completesOn: [] }
}

/**
 * A DRAFT ORDER LIST, READ OFF THE STEPS. It is a starting point, not a truth.
 *
 * It EXPANDS where the package builder groups: `stepUnits()` collapses three
 * dispatch steps into one line with a quantity of three, because that is what
 * a price needs. An order list needs the opposite — three dispatches are three
 * orders, arriving on three days, each with its own status. So one fulfilment
 * per step that links a unit.
 *
 * A step that links nothing gets no fulfilment of its own. The nurse draw and
 * the lab run are statuses of the panel order that step one placed, and the
 * author points them at it.
 */
export function buildFulfilments(protocol: Protocol, listings: Listing[]): ProtocolFulfilment[] {
    const steps = [...protocol.steps].sort((a, b) => a.order - b.order)
    const seen = new Map<string, number>()

    return steps.flatMap(s => {
        const unit = s.linkedUnit
        if (!unit) return []
        const key = `${unit.listingId}:${unit.kind}:${unit.unitId}`
        const nth = (seen.get(key) ?? 0) + 1
        seen.set(key, nth)
        const name = unitLabel(unit, listings) || s.titleEn || "An order"
        /* The second and third order for one unit are named apart, because
           "Month 1" and "Month 3" are the whole point of them being separate. */
        const label = nth === 1 ? name : `${name} · ${nth}`
        return [{ id: `f-${rid()}`, label, unit }]
    })
}

/** The fulfilment path of a fulfilment's own listing, for the reachability check. */
export function pathOfFulfilment(
    f: ProtocolFulfilment | undefined, listings: Listing[],
): FulfilmentPath | undefined {
    if (!f?.unit) return undefined
    return listings.find(l => l.id === f.unit!.listingId)?.fulfilmentPath
}

/** Whether a status can occur on an order of this kind. Empty `on` = anywhere. */
export function reachable(def: StatusDef, path: FulfilmentPath | undefined) {
    if (!def.on.length) return true
    if (!path) return true
    return def.on.includes(path)
}

// ── The checks ───────────────────────────────────────────────

/**
 * TWO LISTS, NOT ONE FLAG.
 *
 * `PlanGap.blocksDraft` discriminates draft from publish, which is a different
 * question from error against note. Overloading it would make the name lie, so
 * the walker returns the two lists apart: `errors` refuse a publish, `notes`
 * are advice a sound protocol may still carry.
 */
export interface RuntimeFindings {
    errors: PlanGap[]
    notes: PlanGap[]
}

/**
 * What stops a protocol running, and what merely reads badly.
 *
 * THE FIRST RULE IS THE WHOLE POINT. A step with no `advance` stops every
 * patient for good, and today nothing anywhere says so.
 *
 * CHECKED ON EVERY PATH, the way the chain is: a step some values skip changes
 * what every step below it can rely on.
 */
export function runtimeFindings(protocol: Protocol, listings: Listing[]): RuntimeFindings {
    const errors: PlanGap[] = []
    const notes: PlanGap[] = []
    const err = (what: string, why: string) => errors.push({ section: "runtime", what, why })
    const note = (what: string, why: string) => notes.push({ section: "runtime", what, why })

    const fulfilments = protocol.fulfilments ?? []
    const byId = new Map(fulfilments.map(f => [f.id, f]))
    const paths = pathsOf(protocol)

    paths.forEach(p => {
        const steps = resolveProtocol(protocol, p.id).steps
        const where = paths.length > 1 ? ` on the ${p.label.toLowerCase()} path` : ""
        const nameOf = (s: ProtocolStep, i: number) =>
            `Step ${i + 1}${s.titleEn ? `, ${s.titleEn},` : ""}`

        steps.forEach((s, i) => {
            const a = s.advance
            const label = nameOf(s, i)

            if (!a || !a.completesOn.length) {
                err(`${label} never completes${where}`,
                    "Nothing tells the system this step is done, so every patient stops here "
                    + "for good.")
                return
            }

            const f = a.fulfilmentId ? byId.get(a.fulfilmentId) : undefined

            if (a.field !== "app_event" && !f) {
                err(`${label} watches a status and names no order${where}`,
                    "Three months of dispatch are three orders. Which one this step waits on "
                    + "has to be said, not guessed.")
            }

            if (!fieldExists(a.field)) {
                err(`${label} waits on something nothing writes${where}`,
                    `${fieldLabel(a.field)} does not exist in the live system yet. It has to be `
                    + "built before this step can advance.")
            }

            const path = pathOfFulfilment(f, listings)

            a.completesOn.forEach(id => {
                const def = statusDef(a.field, id)

                if (!def) {
                    /* The status may be real and on another field. That is the
                       mistake worth naming precisely. */
                    const other = fieldOfStatus(id)
                    err(
                        other
                            ? `${id} is not ${fieldLabel(a.field).toLowerCase()}${where}`
                            : `${label} waits on ${id}, which is not a status${where}`,
                        other
                            ? `It lives on ${fieldLabel(other).toLowerCase()}. Watch that field instead.`
                            : "Nothing in the live system reports it.",
                    )
                    return
                }

                if (!def.settable) {
                    err(`${def.label} is never set by anything${where}`,
                        "It renders in the audit log, and no screen, app or service can set it. "
                        + `${label} would wait for ever.`)
                }

                if (!reachable(def, path)) {
                    err(`${def.label} never happens on ${f?.label ?? "that order"}${where}`,
                        `That order is a ${path} order, and this status only occurs on `
                        + `${def.on.join(" or ")}.`)
                }
            })

            /* A retry nothing can reach is the same fault one step removed: the
               recovery path is authored and dead. */
            const retries = a.retriesOn ?? []
            retries.forEach(id => {
                const def = statusDef(a.field, id)
                if (def && !reachable(def, path)) {
                    err(`${def.label} cannot happen on ${f?.label ?? "that order"}${where}`,
                        "The retry is authored and can never fire, so a failure here stalls the "
                        + "patient anyway.")
                }
            })

            const available = retryFor(a.field, path)
            if (!retries.length && available.length) {
                note(`${label} has no retry status${where}`,
                    `If this fails, ops sets ${available[0].label} and the patient waits behind `
                    + "a step that already looked finished.")
            }

            /* COMPLETED says a thing happened. It does not say what was decided,
               and several of the seeded steps have nothing better available.
               Worth saying once per step, because it is the gap the tech team
               most needs to hear about. */
            if (a.completesOn.length === 1 && a.completesOn[0] === "COMPLETED") {
                note(`${label} completes on Order Completed, and nothing else${where}`,
                    "That records that it happened, not what was decided. Where the next step "
                    + "depends on the decision, this is not enough.")
            }

            if (!s.waitingEn?.trim()) {
                note(`${label} has no waiting line${where}`,
                    "The app shows the step's own title while it is pending, and \""
                    + `${s.titleEn || "Untitled step"}" is not written to a patient.`)
            }
        })

        /* TWO STEPS ON ONE SIGNAL. Scoped to the same order AND the same field:
           two dispatch steps both watching SHIPPED on DIFFERENT orders is
           correct and normal. */
        const seen = new Map<string, number>()
        steps.forEach((s, i) => {
            const a = s.advance
            if (!a?.fulfilmentId) return
            a.completesOn.forEach(id => {
                const key = `${a.fulfilmentId}|${a.field}|${id}`
                const at = seen.get(key)
                if (at !== undefined) {
                    err(`Step ${at + 1} and step ${i + 1} both complete on `
                        + `${statusLabel(a.field, id)} of `
                        + `${byId.get(a.fulfilmentId!)?.label ?? "one order"}${where}`,
                        "One order reaches it once, so both steps finish in the same instant "
                        + "and one of them means nothing.")
                } else seen.set(key, i)
            })
        })

        /* THE LAST STEP ON THE FIRST ORDER. The protocol would finish the moment
           its first order does, with everything between still open. */
        const firstF = steps[0]?.advance?.fulfilmentId
        const lastF = steps[steps.length - 1]?.advance?.fulfilmentId
        if (steps.length > 2 && firstF && lastF && firstF === lastF) {
            err(`The last step completes on the same order as step 1${where}`,
                `The protocol would finish the moment ${byId.get(firstF)?.label ?? "that order"} `
                + `does, with ${steps.length - 2} steps still open.`)
        }

        /* AN ORDER NOBODY WATCHES. Paid for, and then unobserved. */
        const watched = new Set(steps.map(s => s.advance?.fulfilmentId).filter(Boolean))
        fulfilments.forEach(f => {
            if (watched.has(f.id)) return
            err(`${f.label} is on the order list and no step watches it${where}`,
                "A fulfilment nothing watches is paid for and then unobserved.")
        })

        /* THE LADDER, BACKWARDS. A NOTE, not a refusal: positions are known for
           the eight-value home-visit ladder only. The CMS has no ordering for
           the sixteen, and blocking publish on a belief it cannot defend is how
           a gate loses its credibility. */
        let high = 0
        steps.forEach((s, i) => {
            if (s.advance?.field !== "booking_status") return
            s.advance.completesOn.forEach(id => {
                const pos = BOOKING_STATUSES.find(b => b.id === id)?.position ?? 0
                if (pos && pos < high) {
                    note(`Step ${i + 1} completes on a home-visit status the order passes before `
                        + `an earlier step's${where}`,
                        "Inside the nurse ladder the positions are known, and these two are the "
                        + "wrong way round.")
                }
                high = Math.max(high, pos)
            })
        })
    })

    return { errors, notes }
}

/** The retry statuses available on this field and order kind. */
export function retryFor(field: StatusField, path: FulfilmentPath | undefined) {
    return statusesFor(field).filter(s => s.kind === "retry" && reachable(s, path))
}

/** Where the protocol stops, if it does. The one-line answer for the banner. */
export function stallsAt(protocol: Protocol, pathId?: string): { at: number; step: ProtocolStep } | null {
    const steps = resolveProtocol(protocol, pathId).steps
    const at = steps.findIndex(s => !s.advance?.completesOn.length)
    return at === -1 ? null : { at, step: steps[at] }
}

/** One line for the step row: what advances it, or that nothing does. */
export function advanceSummary(s: ProtocolStep): string | null {
    const a = s.advance
    if (!a || !a.completesOn.length) return null
    return a.completesOn.map(id => statusLabel(a.field, id)).join(" or ")
}
