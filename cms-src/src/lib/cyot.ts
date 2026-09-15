// ── Create Your Own Test — selection, union pricing, routing ──
// This is the layer that makes an analyte SELECTABLE without making it a
// product, and it is where the model earns its keep or doesn't.
//
// How it differs from what runs today, in one line each:
//   · selection unit  — an analyte, not a mini package wrapping a set of tests
//   · price           — the deduplicated UNION, not a plain sum over sets
//   · routing         — checked at selection time, not discovered at fulfilment
//
// ⚠️ Today's total is `for (id of miniPackages) total += price` with NO
// deduplication: two selections sharing a test are both charged in full. So
// baskets move in BOTH directions at cutover — dedup lowers overlapping ones,
// while pulling a derived value's inputs adds components. There is no price
// parity to preserve, because there is no analyte price today to preserve it
// against.

import type {
    Biomarker, BiomarkerLabMapping, BiomarkerPanel, Country, CyotComponentPrice, CyotConfig,
    SampleKind, TubeType,
} from "@/types"
import { expandToAnalytes, specimensFor, tubesFor, fastingHoursFor, tatHoursFor } from "@/lib/biomarkers"

export interface CyotSelection {
    biomarkerIds?: string[]
    panelIds?: string[]
}

export interface CyotScope {
    country: Country
    /** Undefined = pricing at the country row only. */
    cityId?: string
}

// ── Component pricing ─────────────────────────────────────────

/**
 * The component price for one analyte in one place.
 *
 * ⚠️ A city row OVERRIDES the country row here — which is the opposite of how
 * the treatments pricing grid behaves, and the difference is deliberate.
 *
 * In the treatments sheet the sparse grid IS the availability answer: no
 * (variant, city) row means NOT SOLD THERE, so a fallback would invent a sale.
 * Here availability is already answered by two other things — the analyte's
 * market list and whether any lab can actually run it in that city — so the
 * price grid does not have to carry it too. Making city a strict peer would
 * instead demand a row for every analyte in every city (400 × 33 ≈ 13,000
 * hand-authored prices) before a single basket could be priced anywhere.
 */
export function componentPrice(
    biomarkerId: string, scope: CyotScope, prices: CyotComponentPrice[],
): { price?: number; grain: "city" | "country" | "none" } {
    const mine = prices.filter(p => p.biomarkerId === biomarkerId && p.country === scope.country)
    if (scope.cityId) {
        const city = mine.find(p => p.cityId === scope.cityId)
        if (city) return { price: city.price, grain: "city" }
    }
    const country = mine.find(p => !p.cityId)
    return country ? { price: country.price, grain: "country" } : { grain: "none" }
}

// ── The basket ────────────────────────────────────────────────

export interface CyotLine {
    biomarkerId: string
    nameEn: string
    /** What the customer is charged for this analyte. */
    price?: number
    grain: "city" | "country" | "none"
    /** True when the customer never picked this — a panel member or a derived input. */
    addedByExpansion: boolean
    /** Why it is in the basket, for the "already included" affordance. */
    reason: "chosen" | "panel member" | "derived input"
    /** Computed, not drawn — must never reach a requisition. */
    isDerived: boolean
}

export interface CyotBasket {
    lines: CyotLine[]
    /** Analytes charged once that a plain sum would have charged more than once. */
    dedupedAway: { nameEn: string; times: number }[]
    componentTotal: number
    assemblyFee?: number
    total: number
    /** What a plain sum over the same selection would have charged today. */
    legacyStyleTotal: number
    unpriced: string[]
    /** Derived card facts, so nothing here is typed by hand. */
    analyteCount: number
    fastingHours?: number
    tatHours?: number
    specimens: SampleKind[]
    tubes: TubeType[]
    errors: string[]
}

/**
 * Price a selection as the deduplicated union.
 *
 * The charged set is the union of everything the selection resolves to, so an
 * analyte already covered — picked directly, arriving via a chosen panel, or
 * pulled in as a derived value's input — is charged exactly ONCE. The UI is
 * expected to say "already included" rather than silently charge twice, which
 * is why `dedupedAway` reports what a plain sum would have double-charged.
 */
export function priceBasket(
    selection: CyotSelection,
    scope: CyotScope,
    biomarkers: Biomarker[],
    panels: BiomarkerPanel[],
    prices: CyotComponentPrice[],
    config?: CyotConfig,
): CyotBasket {
    const byId = new Map(biomarkers.map(b => [b.id, b]))
    const expanded = expandToAnalytes(selection, biomarkers, panels)

    // How many times a plain sum would have counted each analyte — the legacy
    // behaviour, kept explicit so the cutover delta is visible per basket.
    const occurrences = new Map<string, number>()
    const bump = (id: string) => occurrences.set(id, (occurrences.get(id) ?? 0) + 1)
    for (const id of selection.biomarkerIds ?? []) bump(id)
    for (const pid of selection.panelIds ?? []) {
        for (const m of panels.find(p => p.id === pid)?.memberIds ?? []) bump(m)
    }

    const directly = new Set(selection.biomarkerIds ?? [])
    const panelMembers = new Set((selection.panelIds ?? [])
        .flatMap(pid => panels.find(p => p.id === pid)?.memberIds ?? []))

    const lines: CyotLine[] = expanded.all.map(id => {
        const b = byId.get(id)
        const { price, grain } = componentPrice(id, scope, prices)
        const reason: CyotLine["reason"] =
            directly.has(id) ? "chosen" : panelMembers.has(id) ? "panel member" : "derived input"
        return {
            biomarkerId: id,
            nameEn: b?.nameEn ?? id,
            price, grain,
            addedByExpansion: !directly.has(id),
            reason,
            isDerived: !!b?.isDerived,
        }
    })

    const componentTotal = lines.reduce((n, l) => n + (l.price ?? 0), 0)
    const legacyStyleTotal = [...occurrences.entries()].reduce((n, [id, times]) => {
        const { price } = componentPrice(id, scope, prices)
        return n + (price ?? 0) * times
    }, 0)

    const dedupedAway = [...occurrences.entries()]
        .filter(([, times]) => times > 1)
        .map(([id, times]) => ({ nameEn: byId.get(id)?.nameEn ?? id, times }))

    const unpriced = lines.filter(l => l.grain === "none").map(l => l.nameEn)
    const assayed = expanded.assayed

    const errors: string[] = []
    if (unpriced.length) {
        errors.push(`${unpriced.length} analyte(s) have no component price in this market: ${unpriced.slice(0, 4).join(", ")}${unpriced.length > 4 ? "…" : ""}.`)
    }
    const notOffered = expanded.all.filter(id => {
        const avail = byId.get(id)?.countryAvailability
        return avail && !avail.includes(scope.country)
    })
    if (notOffered.length) {
        errors.push(`${notOffered.length} analyte(s) are not offered in ${scope.country}.`)
    }
    if (config?.minSelections && lines.length < config.minSelections) {
        errors.push(`Pick at least ${config.minSelections} — this basket has ${lines.length}.`)
    }
    if (config?.maxSelections && lines.length > config.maxSelections) {
        errors.push(`At most ${config.maxSelections} allowed — this basket resolves to ${lines.length}.`)
    }

    const fee = config?.assemblyFee
    return {
        lines, dedupedAway, componentTotal,
        assemblyFee: fee,
        total: componentTotal + (fee ?? 0),
        legacyStyleTotal,
        unpriced,
        analyteCount: lines.length,
        fastingHours: fastingHoursFor(assayed, biomarkers),
        tatHours: tatHoursFor(assayed, biomarkers),
        specimens: specimensFor(assayed, biomarkers),
        tubes: tubesFor(assayed, biomarkers),
        errors,
    }
}

// ── Routing ───────────────────────────────────────────────────

export interface CyotRouting {
    /** A single lab covering the whole assayed set, when one exists. */
    singleLabId?: string
    /** Lab → the analytes it would run, when the basket has to be split. */
    split: { labId: string; biomarkerIds: string[] }[]
    /** Analytes no active lab covers here. These BLOCK the basket. */
    uncovered: { biomarkerId: string; nameEn: string }[]
    prescriptionRequired: boolean
    consentRequired: boolean
    errors: string[]
}

const covers = (m: BiomarkerLabMapping, scope: CyotScope) =>
    m.isActive
    && m.country === scope.country
    && (!m.cityIds?.length || !scope.cityId || m.cityIds.includes(scope.cityId))

/**
 * Can this basket actually be fulfilled here, and by whom.
 *
 * Only the ASSAYED set is routed — a derived value consumes no specimen and
 * must never appear on a requisition, so asking a lab to run TG/HDL would be
 * asking for a test that does not physically exist.
 *
 * A single covering lab is preferred: it is one requisition, one draw, one
 * turnaround. A split is reported rather than silently accepted, because two
 * labs means two draws unless the specimens consolidate.
 */
export function routeBasket(
    basket: Pick<CyotBasket, "lines">,
    scope: CyotScope,
    biomarkers: Biomarker[],
    mappings: BiomarkerLabMapping[],
): CyotRouting {
    const byId = new Map(biomarkers.map(b => [b.id, b]))
    const assayed = basket.lines.filter(l => !l.isDerived).map(l => l.biomarkerId)
    const usable = mappings.filter(m => covers(m, scope))

    const labsFor = (id: string) => usable.filter(m => m.biomarkerId === id).map(m => m.labId)

    const uncovered = assayed
        .filter(id => !labsFor(id).length)
        .map(id => ({ biomarkerId: id, nameEn: byId.get(id)?.nameEn ?? id }))

    const covered = assayed.filter(id => labsFor(id).length)
    const allLabs = [...new Set(covered.flatMap(labsFor))]
    const singleLabId = allLabs.find(lab => covered.every(id => labsFor(id).includes(lab)))

    // Greedy split — the lab covering the most first. Good enough to show the
    // shape of the problem; a real allocator would weigh cost and turnaround.
    const split: CyotRouting["split"] = []
    if (!singleLabId && covered.length) {
        const remaining = new Set(covered)
        while (remaining.size) {
            const best = allLabs
                .map(lab => ({ lab, ids: [...remaining].filter(id => labsFor(id).includes(lab)) }))
                .sort((a, b) => b.ids.length - a.ids.length)[0]
            if (!best?.ids.length) break
            split.push({ labId: best.lab, biomarkerIds: best.ids })
            best.ids.forEach(id => remaining.delete(id))
        }
    }

    const chosenLabs = singleLabId ? [singleLabId] : split.map(s => s.labId)
    const relevant = usable.filter(m => chosenLabs.includes(m.labId) && assayed.includes(m.biomarkerId))

    const errors: string[] = []
    if (uncovered.length) {
        errors.push(`No lab runs ${uncovered.map(u => u.nameEn).slice(0, 3).join(", ")}${uncovered.length > 3 ? ` and ${uncovered.length - 3} more` : ""} in ${scope.cityId ?? scope.country}. Remove them or change the city.`)
    }
    if (!singleLabId && split.length > 1) {
        errors.push(`This basket needs ${split.length} labs, so it cannot be one requisition.`)
    }

    return {
        singleLabId,
        split,
        uncovered,
        prescriptionRequired: relevant.some(m => m.prescriptionRequired),
        consentRequired: relevant.some(m => m.consentRequired),
        errors,
    }
}

/** Summed lab cost for what would actually be run — the margin input. */
export function routedCost(
    routing: CyotRouting, scope: CyotScope, mappings: BiomarkerLabMapping[],
): number | undefined {
    const labs = routing.singleLabId ? [routing.singleLabId] : routing.split.map(s => s.labId)
    const ids = routing.singleLabId
        ? undefined
        : new Set(routing.split.flatMap(s => s.biomarkerIds))
    const rows = mappings.filter(m =>
        covers(m, scope) && labs.includes(m.labId) && (!ids || ids.has(m.biomarkerId)))
    const costs = rows.map(m => m.b2bCost).filter((c): c is number => typeof c === "number")
    return costs.length ? costs.reduce((a, b) => a + b, 0) : undefined
}

/**
 * Margin on a basket. Reported, never enforced — nothing in the model compares
 * cost to price at authoring time, and who owns that gate is an open decision.
 */
export function basketMargin(basket: CyotBasket, cost?: number) {
    if (cost === undefined) return undefined
    const margin = basket.total - cost
    return { cost, margin, pct: basket.total ? (margin / basket.total) * 100 : 0 }
}

export function cyotConfigGaps(
    config: CyotConfig, prices: CyotComponentPrice[], biomarkers: Biomarker[],
): string[] {
    const gaps: string[] = []
    const selectable = biomarkers.filter(b =>
        b.isActive
        && b.lifecycle !== "deprecated"
        && (b.countryAvailability ?? []).includes(config.country))
    const priced = new Set(prices.filter(p => p.country === config.country).map(p => p.biomarkerId))
    const missing = selectable.filter(b => !priced.has(b.id))
    if (missing.length) {
        gaps.push(`${missing.length} of ${selectable.length} selectable analytes have no component price in ${config.country}.`)
    }
    if (!config.minSelections) gaps.push("No minimum selection set.")
    if (!config.maxSelections) gaps.push("No maximum selection set.")
    return gaps
}
