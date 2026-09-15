// ── Consultation variants ─────────────────────────────────────
// A consultation varies along three axes, and the legacy admin expressed every
// one of them by creating another listing — which is why one practitioner ends
// up with three:
//
//   Follow-up Weight Loss Consultation with Dr. Mahmoud
//   Online Weight Loss Consultation with Dr. Mahmoud (for New Users only)
//   Free Online Weight Loss Consultation with Dr. Mahmoud (for New Users Only)
//
// One product, three variants. Modelled as axes, pricing becomes a grid: the
// PricingSheet reads variants × cities, so "the follow-up is 150 in Dubai and
// 200 in Riyadh" is a cell rather than a new listing.
//
// Only 9 of the 135 migrated listings actually collapse this way, so this is
// not a mass-merge tool. It matters because it stops the NEXT hundred being
// created the same way.

import type { ConsultationConfig, VariantOption, VariantOptionValue, VariantType } from "@/types"

const rid = () => Math.random().toString(36).slice(2, 9)

function value(en: string, ar: string, position: number): VariantOptionValue {
    return { id: rid(), valueEn: en, valueAr: ar, position, isActive: true }
}

function axis(kind: VariantType, nameEn: string, nameAr: string, position: number,
              values: [string, string][]): VariantOption {
    return {
        id: rid(), kind, nameEn, nameAr, position,
        values: values.map(([en, ar], i) => value(en, ar, i)),
    }
}

/** The default session-pack sizes offered when a package sells more than one. */
export const SESSION_PACKS = [1, 4, 8, 12]

/**
 * Proposes the axes a consultation needs, reading what the config already says.
 * Returns only axes that are actually warranted — a single-session, online-only,
 * initial-visit consultation has no variation and should stay a plain product
 * rather than acquire three one-value axes.
 */
export function proposeConsultationAxes(cfg?: ConsultationConfig): VariantOption[] {
    const axes: VariantOption[] = []
    let pos = 0

    // Visit. Offered whenever a follow-up exists at all — either included here
    // or sold as its own thing, which is what the legacy titles were splitting on.
    if (cfg?.followUpIncluded || cfg?.visitType === "FOLLOW_UP") {
        axes.push(axis("visit", "Visit", "الزيارة", pos++, [
            ["First visit", "الزيارة الأولى"],
            ["Follow-up", "متابعة"],
        ]))
    }

    // Delivery. Only an axis if it genuinely varies; a purely online service
    // should not carry an in-clinic option nobody can book.
    if (cfg?.mode === "IN_CLINIC" || cfg?.mode === "AT_HOME") {
        axes.push(axis("mode", "Delivered", "طريقة التقديم", pos++, [
            ["Online", "عبر الإنترنت"],
            [cfg.mode === "AT_HOME" ? "At home" : "In clinic",
             cfg.mode === "AT_HOME" ? "في المنزل" : "في العيادة"],
        ]))
    }

    // Session packs. Legacy had no field for this, yet "Mahmoud Musa - 4
    // Sessions" exists as a listing, so the concept is already being sold.
    const count = cfg?.sessionCount ?? 1
    if (count > 1) {
        const packs = SESSION_PACKS.includes(count) ? SESSION_PACKS.filter(n => n <= count) : [1, count]
        axes.push(axis("sessions", "Sessions", "الجلسات", pos++,
            packs.map(n => [
                n === 1 ? "1 session" : `${n} sessions`,
                n === 1 ? "جلسة واحدة" : `${n} جلسات`,
            ] as [string, string])))
    }

    return axes
}

/** Human explanation of why each axis was proposed — shown before applying. */
export function explainProposedAxes(cfg?: ConsultationConfig): string[] {
    const out: string[] = []
    if (cfg?.followUpIncluded || cfg?.visitType === "FOLLOW_UP") {
        out.push("Visit — a follow-up exists, so first visit and follow-up price differently")
    }
    if (cfg?.mode === "IN_CLINIC" || cfg?.mode === "AT_HOME") {
        out.push(`Delivered — this is not online-only, so online and ${cfg.mode === "AT_HOME" ? "at home" : "in clinic"} are separate prices`)
    }
    if ((cfg?.sessionCount ?? 1) > 1) {
        out.push(`Sessions — ${cfg?.sessionCount} sessions are sold, so the pack sizes are variants`)
    }
    if (out.length === 0) {
        out.push("No variation warranted — one session, online, first visit only. Keep it a plain product.")
    }
    return out
}
