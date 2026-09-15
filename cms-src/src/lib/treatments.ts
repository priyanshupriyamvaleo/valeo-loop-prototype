import {
    Country, DripSpeed, TreatmentPlan, TreatmentPlanPrice, TreatmentsConfig, Listing,
} from "@/types"

export function isTreatments(l: Pick<Listing, "department">): boolean {
    return l.department === "treatments"
}

/** Group sessions and slow drips only make sense for an infusion. */
export function isIv(cfg: TreatmentsConfig | undefined): boolean {
    return cfg?.administrationMethod === "iv_drip"
}

export function planPrice(
    plan: TreatmentPlan | undefined, country: Country, cityId?: string,
): TreatmentPlanPrice | undefined {
    if (!plan) return undefined
    const city = cityId ? plan.pricing.find(p => p.country === country && p.cityId === cityId) : undefined
    const base = plan.pricing.find(p => p.country === country && !p.cityId)
    if (!city) return base
    return { ...(base ?? { country }), ...city }
}

/** Slow infusion adds the configured surcharge on top of the plan price. */
export function finalPlanPrice(
    p: TreatmentPlanPrice | undefined, dripSpeed: DripSpeed | undefined, surcharge?: number,
): number | undefined {
    if (!p || p.price === undefined) return undefined
    let v = p.price
    if (p.discountType === "percent" && p.discountValue) v = v * (1 - p.discountValue / 100)
    else if (p.discountType === "fixed" && p.discountValue) v = Math.max(0, v - p.discountValue)
    if (dripSpeed === "slow" && surcharge) v += surcharge
    return Math.round(v * 100) / 100
}

/** Discount to show against the compare-at price, derived so it cannot disagree. */
export function planDiscountPct(p: TreatmentPlanPrice | undefined): number | undefined {
    if (!p?.price || !p.compareAtPrice || p.compareAtPrice <= p.price) return undefined
    return Math.round((1 - p.price / p.compareAtPrice) * 100)
}

/** What a Treatments listing still needs. Kept out of the generic activation gate. */
export function treatmentsGaps(l: Listing): string[] {
    if (!isTreatments(l)) return []
    const cfg = l.treatments
    const gaps: string[] = []
    if (!cfg?.administrationMethod) gaps.push("Administration method (IV drip or injection shot)")
    const plans = (cfg?.plans ?? []).filter(p => p.isActive)
    // A vaccine is administered but never sold as a course, so it needs no plans.
    if (!cfg?.isVaccine && plans.length === 0) gaps.push("At least one active treatment plan")
    const countries = (l.countryConfig ?? []).map(c => c.country)
    countries.forEach(c => {
        if (plans.length > 0 && !plans.some(p => (planPrice(p, c)?.price ?? 0) > 0)) {
            gaps.push(`${c}: no priced plan`)
        }
    })
    plans.filter(p => p.kind === "course" && !p.sessionCount)
        .forEach(p => gaps.push(`"${p.labelEn}": session count not set`))
    plans.filter(p => p.kind === "group" && !p.bagCount)
        .forEach(p => gaps.push(`"${p.labelEn}": bag count not set`))
    if (cfg?.slowDripAvailable && !cfg.slowDripSurcharge) {
        gaps.push("Slow drip is offered but has no surcharge")
    }
    return gaps
}

/**
 * The sub-department decides the treatment flow, so an operator cannot put drip
 * speed on a vaccine or bags on an intramuscular shot. Derived, not chosen.
 */
/**
 * The axis kinds a family REQUIRES before combinations can be generated — the panel's mirror of the
 * server's `FamilyCommercePolicy.mandatoryAxisCodes`.
 *
 * <p>This is the ONLY per-family input the axis question needs, and that is deliberate. Every
 * listing in every department gets the same "does this vary?" choice; what varies by family is
 * whether "sold as one item" is even available, and a non-empty list here is exactly what makes it
 * unavailable. IV must declare Volume (D-C27), so a drip cannot be a single item — but nothing
 * hardcodes which families are allowed to be single, because that turned out to foreclose real
 * cases: physio has zero axes TODAY (D-C30 measured it), while D-C62 §6 already parks two axes it
 * may plausibly gain — a duration that differs between variants, and at-home versus at-clinic.
 */
/**
 * ⚠️ FALLBACK ONLY. The authority is the service — `VariantAxesResponse.mandatoryAxisCodes`,
 * computed from the family policy (`TreatmentsCommercePolicy.mandatoryAxisCodes`), and it is what
 * `generate()` actually enforces. This copy is used solely for a product that does not exist
 * server-side yet, where there are no axes to ask about but the panel still has to know whether
 * "sold as one item" is offered at all.
 *
 * Keep the two in step or delete this one; a frontend that disagrees with the policy shows a
 * complete stepper over a state the server rejects.
 */
export function mandatoryAxisKindsFor(slug?: string): string[] {
    // A drip always varies on volume, single-size included (one value, pre-selected).
    if (slug?.includes("iv")) return ["volume"]
    // Home & personal care always varies on the shift length (HomeCareCommercePolicy):
    // the day is the base variant, plan lengths are session packs — never an axis.
    if (slug?.includes("babysitting") || slug?.includes("elderly")) return ["hours_per_day"]
    // Everything else — physio, injections, supplements, medicines — is the operator's call.
    return []
}

export function flowForSubDepartment(slug?: string): {
    method?: "iv_drip" | "injection_shot"; isVaccine: boolean
    allowBags: boolean; allowDripSpeed: boolean; allowPlans: boolean; note: string
} {
    if (slug?.includes("vaccin")) {
        return {
            method: "injection_shot", isVaccine: true,
            allowBags: false, allowDripSpeed: false, allowPlans: false,
            note: "Vaccines are administered, not sold as a course — no plans, no bags, no drip speed. Dose schedule and eligibility are what matter.",
        }
    }
    if (slug?.includes("injection")) {
        return {
            method: "injection_shot", isVaccine: false,
            allowBags: false, allowDripSpeed: false, allowPlans: true,
            note: "An injection is a single shot: no bags and no drip speed. Courses and couple sessions still apply.",
        }
    }
    if (slug?.includes("iv")) {
        return {
            method: "iv_drip", isVaccine: false,
            allowBags: true, allowDripSpeed: true, allowPlans: true,
            note: "An infusion: bags, drip speed and group sessions all apply.",
        }
    }
    return { isVaccine: false, allowBags: true, allowDripSpeed: true, allowPlans: true, note: "" }
}
