// ── Recovering structure from legacy consultation names ───────
// 135 consultation listings migrated from the legacy admin carrying almost
// nothing but a title. 64 of those titles encode facts that belong in fields:
//
//   "Free Online Weight Loss Consultation with Dr. Mahmoud (for New Users only)"
//    ^price ^mode      ^kind                    ^practitioner  ^eligibility
//
// Five structured facts in one string. Nothing can filter, price or report on
// prose, so this reads the title and proposes field values.
//
// It PROPOSES. Every inference is returned with the evidence that produced it
// so an operator confirms rather than trusts — a regex that silently mis-prices
// a clinical product is worse than an empty field.

import type {
    ConsultationEligibility, ConsultationKind, ConsultationMode, ConsultationVisit,
} from "@/types"

export interface Inference<T> {
    value: T
    /** The substring that triggered it — shown to the operator. */
    evidence: string
}

export interface ParsedConsultationName {
    /** Name with the recognised markers stripped, as a starting display name. */
    cleanName: string
    consultationType?: Inference<ConsultationKind>
    mode?: Inference<ConsultationMode>
    visitType?: Inference<ConsultationVisit>
    eligibility?: Inference<ConsultationEligibility>
    isPaid?: Inference<boolean>
    sessionCount?: Inference<number>
    /** Practitioner named in the title, for matching against the Health Team. */
    practitionerName?: Inference<string>
    /** True when nothing was recognised — the title is just a person's name. */
    isBareName: boolean
}

const match = (name: string, re: RegExp) => name.match(re)?.[0]?.trim()

export function parseConsultationName(raw: string): ParsedConsultationName {
    const name = raw.trim()
    const out: ParsedConsultationName = { cleanName: name, isBareName: false }

    // ── Delivery mode ─────────────────────────────────────────
    const online = match(name, /\bonline\b/i)
    const atHome = match(name, /\bat[- ]home\b/i)
    const inClinic = match(name, /\bin[- ]clinic\b|\bclinic visit\b/i)
    if (online) out.mode = { value: "ONLINE", evidence: online }
    else if (atHome) out.mode = { value: "AT_HOME", evidence: atHome }
    else if (inClinic) out.mode = { value: "IN_CLINIC", evidence: inClinic }

    // ── Initial vs follow-up ──────────────────────────────────
    const follow = match(name, /follow[- ]?up/i)
    if (follow) out.visitType = { value: "FOLLOW_UP", evidence: follow }

    // ── Eligibility ───────────────────────────────────────────
    const newUsers = match(name, /\(?\s*for\s+new\s+users?\s+only\s*\)?/i)
    if (newUsers) out.eligibility = { value: "NEW_CUSTOMERS", evidence: newUsers.trim() }

    // ── Free vs paid ──────────────────────────────────────────
    // Only a leading "Free" counts. "Free" mid-sentence is usually marketing
    // copy about the outcome, not the price.
    const free = match(name, /^\s*free\b/i)
    if (free) out.isPaid = { value: false, evidence: free }

    // ── Session count ─────────────────────────────────────────
    const sessions = name.match(/(\d+)\s*sessions?\b/i)
    if (sessions) out.sessionCount = { value: Number(sessions[1]), evidence: sessions[0] }

    // ── Kind ──────────────────────────────────────────────────
    const weightLoss = match(name, /weight[- ]?loss/i)
    const programme = match(name, /\b(program|programme|plan)\b/i)
    if (weightLoss) out.consultationType = { value: "WEIGHTLOSS", evidence: weightLoss }
    else if (programme) out.consultationType = { value: "PROGRAM", evidence: programme }
    else if (/consultation|consult\b/i.test(name)) {
        out.consultationType = { value: "COACH_CONSULTATION", evidence: "Consultation" }
    }

    // ── Practitioner ──────────────────────────────────────────
    // Two shapes in the data: "… with Dr. Mahmoud" and "May Chalhoub: Online …".
    const withWho = name.match(/\bwith\s+((?:dr\.?\s+)?[A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)?)/i)
    const beforeColon = name.match(/^((?:dr\.?\s+)?[A-Z][\w'-]+(?:\s+[A-Z][\w'-]+)?)\s*:/i)
    const who = withWho?.[1] ?? beforeColon?.[1]
    if (who) out.practitionerName = { value: who.trim(), evidence: who.trim() }

    // ── Clean name ────────────────────────────────────────────
    let clean = name
    for (const ev of [out.eligibility?.evidence, out.isPaid?.evidence, out.mode?.evidence]) {
        if (ev) clean = clean.replace(ev, " ")
    }
    out.cleanName = clean.replace(/\s{2,}/g, " ").replace(/\s*\(\s*\)\s*/g, "").trim()

    // A title that is only a person's name told us nothing about the product.
    const recognised = !!(out.mode || out.visitType || out.eligibility || out.isPaid
        || out.sessionCount || out.consultationType)
    out.isBareName = !recognised

    return out
}

/** Everything the parser inferred, as operator-readable lines. */
export function describeInferences(p: ParsedConsultationName): string[] {
    const lines: string[] = []
    if (p.consultationType) lines.push(`Type → ${p.consultationType.value} (from "${p.consultationType.evidence}")`)
    if (p.mode) lines.push(`Mode → ${p.mode.value} (from "${p.mode.evidence}")`)
    if (p.visitType) lines.push(`Visit → ${p.visitType.value} (from "${p.visitType.evidence}")`)
    if (p.eligibility) lines.push(`Eligibility → ${p.eligibility.value} (from "${p.eligibility.evidence}")`)
    if (p.isPaid) lines.push(`Paid → ${p.isPaid.value ? "yes" : "no — free"} (from "${p.isPaid.evidence}")`)
    if (p.sessionCount) lines.push(`Sessions → ${p.sessionCount.value} (from "${p.sessionCount.evidence}")`)
    if (p.practitionerName) lines.push(`Practitioner → "${p.practitionerName.value}" — match against the Health Team`)
    if (p.isBareName) lines.push("Nothing recognised — this title is only a person's name.")
    return lines
}
