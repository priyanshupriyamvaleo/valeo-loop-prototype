import {
    Biomarker, BiomarkerCountryMap, Country, DiagnosticsConfig, DiagnosticsServiceKind,
    DiagnosticsServiceOption, DiagnosticsServicePrice, DiagnosticsSlotMapping,
    DiagnosticsTier, Listing, SampleKind,
} from "@/types"

// ── The two creation types ────────────────────────────────────
export const DIAGNOSTICS_TIERS: {
    id: DiagnosticsTier; label: string; blurb: string; detail: string
}[] = [
        {
            id: "mini",
            label: "Mini Package",
            blurb: "A single test or small group, sold à la carte.",
            detail: "Can be added on top of a proper package at checkout. Has its own mini category and usually one sample type.",
        },
        {
            id: "proper",
            label: "Proper Package",
            blurb: "A full panel — Blood Test, Non-Blood Sample Test or Genomic Testing.",
            detail: "The sub-department decides which kind it is. Decides whether mini packages may be added alongside it.",
        },
    ]

export function tierLabel(t: DiagnosticsTier | undefined): string {
    return DIAGNOSTICS_TIERS.find(x => x.id === t)?.label ?? "—"
}

export const SAMPLE_KINDS: { id: SampleKind; label: string }[] = [
    { id: "blood", label: "Blood" },
    { id: "urine", label: "Urine" },
    { id: "stool", label: "Stool" },
    { id: "saliva", label: "Saliva" },
    { id: "swab", label: "Swab" },
    { id: "breath", label: "Breath" },
    { id: "other", label: "Other" },
]

/** Diagnostics is the only department that carries this block. */
export function isDiagnostics(l: Pick<Listing, "department">): boolean {
    return l.department === "diagnostics"
}

// ── Country biomarker drift ───────────────────────────────────
// Same package, different markers per country is the norm, not the exception:
// 19 of 32 cross-country packages in BLOOD_DRIFT differ. The CMS therefore shows
// drift rather than hiding it, so an operator can tell deliberate localisation
// from an unnoticed divergence.

export type DriftSeverity = "none" | "minor" | "moderate" | "severe"

export interface BiomarkerDrift {
    /** Markers present in EVERY mapped country. */
    shared: string[]
    /** Markers present in at least one country. */
    union: string[]
    /** union − shared: markers that are not everywhere. */
    differBy: number
    severity: DriftSeverity
    /** Per country: what it has, and what it is missing versus the union. */
    perCountry: { country: Country; count: number; missing: string[] }[]
}

/**
 * Thresholds are taken from the live workbook's own verdicts, so the CMS agrees
 * with the reconciliation sheet rather than inventing a second scale: differ ≥ 10
 * was SEVERE there, 4–9 moderate, 1–3 minor. Matches all 19 drifting rows.
 */
export function driftSeverity(differBy: number): DriftSeverity {
    if (differBy === 0) return "none"
    if (differBy >= 10) return "severe"
    if (differBy >= 4) return "moderate"
    return "minor"
}

export function biomarkerDrift(maps: BiomarkerCountryMap[]): BiomarkerDrift {
    const live = maps.filter(m => m.biomarkerIds.length > 0)
    if (live.length === 0) {
        return { shared: [], union: [], differBy: 0, severity: "none", perCountry: [] }
    }
    const sets = live.map(m => new Set(m.biomarkerIds))
    const union = [...new Set(live.flatMap(m => m.biomarkerIds))]
    const shared = union.filter(id => sets.every(s => s.has(id)))
    const differBy = union.length - shared.length
    return {
        shared, union, differBy,
        // A single mapped country cannot drift against anything.
        severity: live.length < 2 ? "none" : driftSeverity(differBy),
        perCountry: live.map((m, i) => ({
            country: m.country,
            count: m.biomarkerIds.length,
            missing: union.filter(id => !sets[i].has(id)),
        })),
    }
}

/**
 * The marker count for a country, DERIVED from the mapping and never typed.
 * In the legacy data hand-written marketing notes overstated the real count by up
 * to 30 markers ("100 biomarkers" on a package with 70), which is exactly what a
 * derived number prevents.
 */
export function biomarkerCount(cfg: DiagnosticsConfig | undefined, country: Country): number {
    const m = (cfg?.biomarkerCountryMaps ?? []).find(x => x.country === country)
    return (m?.biomarkerIds.length ?? 0) + (m?.nonBiomarkerTestIds?.length ?? 0)
}

/** Marketing copy built from the mapping, so it cannot drift from the truth. */
export function derivedMarkerNote(cfg: DiagnosticsConfig | undefined, country: Country): string {
    const n = biomarkerCount(cfg, country)
    return n === 0 ? "—" : `${n} biomarker${n === 1 ? "" : "s"}`
}

export function groupBiomarkers(list: Biomarker[]): Map<string, Biomarker[]> {
    const m = new Map<string, Biomarker[]>()
    list.forEach(b => {
        const k = b.panelGroup || "Other"
        m.set(k, [...(m.get(k) ?? []), b])
    })
    return m
}

// ── Slots ─────────────────────────────────────────────────────
/** Country-level rows are the default; city rows override them. */
export function countryDefaultSlot(cfg: DiagnosticsConfig | undefined, country: Country) {
    return (cfg?.slotMappings ?? []).find(s => s.country === country && !s.cityId)
}
export function citySlots(cfg: DiagnosticsConfig | undefined, country: Country) {
    return (cfg?.slotMappings ?? []).filter(s => s.country === country && s.cityId)
}

/** What actually applies in a city: the city row, falling back to the country row. */
export function effectiveSlot(
    cfg: DiagnosticsConfig | undefined, country: Country, cityId: string,
): DiagnosticsSlotMapping | undefined {
    const city = (cfg?.slotMappings ?? []).find(s => s.country === country && s.cityId === cityId)
    const base = countryDefaultSlot(cfg, country)
    if (!city) return base
    // undefined on the city row means "inherit", not "zero"
    if (!base) return city
    const merged = { ...base, ...city } as unknown as Record<string, unknown>
    const baseRec = base as unknown as Record<string, unknown>
    Object.keys(city).forEach(k => {
        if ((city as unknown as Record<string, unknown>)[k] === undefined) merged[k] = baseRec[k]
    })
    // identity always comes from the city row itself
    merged.id = city.id
    merged.cityId = city.cityId
    return merged as unknown as DiagnosticsSlotMapping
}

// ── Readiness ─────────────────────────────────────────────────
/**
 * What a Diagnostics package still needs. Deliberately separate from
 * listingActivationRequirements so no other department inherits these.
 */
export function diagnosticsGaps(l: Listing): string[] {
    if (!isDiagnostics(l)) return []
    const cfg = l.diagnostics
    const gaps: string[] = []
    if (!cfg?.tier) gaps.push("Package type (Mini or Proper)")
    const countries = (l.countryConfig ?? []).map(c => c.country)
    const maps = cfg?.biomarkerCountryMaps ?? []
    countries.forEach(c => {
        if (biomarkerCount(cfg, c) === 0) gaps.push(`${c}: no biomarkers mapped`)
    })
    if (countries.length === 0) gaps.push("No country enabled — add one before mapping biomarkers")
    countries.forEach(c => {
        if (!countryDefaultSlot(cfg, c)?.slotGroupId) gaps.push(`${c}: no nurse slot group`)
    })
    if ((cfg?.sampleTypes ?? []).length === 0) gaps.push("Sample type")
    // Every country needs at least one active, priced service option — that is what
    // makes the package buyable now that pricing lives on Standard / Fast Track.
    const opts = withDefaultServiceOptions(cfg ?? { tier: "proper" }).filter(o => o.isActive)
    countries.forEach(c => {
        if (!opts.some(o => (servicePrice(o, c)?.price ?? 0) > 0)) {
            gaps.push(`${c}: no priced service option (Standard or Fast Track)`)
        }
    })
    // Severe drift is only a gap while it is UNEXPLAINED. Once the countries that
    // differ carry a reason, the difference is a recorded decision, not a smell —
    // which is what makes writing the note worth doing.
    if (maps.length > 1 && biomarkerDrift(maps).severity === "severe") {
        const drift = biomarkerDrift(maps)
        const unexplained = drift.perCountry
            .filter(pc => pc.missing.length > 0)
            .filter(pc => !maps.find(m => m.country === pc.country)?.intentionalNote?.trim())
            .map(pc => pc.country)
        if (unexplained.length > 0) {
            gaps.push(`Severe biomarker drift not explained for ${unexplained.join(", ")} — record why it differs`)
        }
    }
    return gaps
}

// ── Service options: Standard vs Fast Track ───────────────────
// Not a variant — Diagnostics has no variant flow. It is the same panel on a
// different turnaround, and price is defined per option per country.
export const SERVICE_KINDS: { id: DiagnosticsServiceKind; label: string; blurb: string }[] = [
    { id: "standard", label: "Standard", blurb: "Normal lab turnaround." },
    { id: "fast_track", label: "Fast Track", blurb: "Prioritised — faster report, priced higher." },
]

export function serviceKindLabel(k: DiagnosticsServiceKind): string {
    return SERVICE_KINDS.find(s => s.id === k)?.label ?? k
}

/** Both options always exist so pricing has somewhere to live from the outset. */
export function withDefaultServiceOptions(cfg: DiagnosticsConfig): DiagnosticsServiceOption[] {
    const have = cfg.serviceOptions ?? []
    return SERVICE_KINDS.map(k => have.find(o => o.kind === k.id) ?? {
        id: `so-${k.id}`,
        kind: k.id,
        labelEn: k.label,
        // Standard is on by default; Fast Track is opt-in per package.
        isActive: k.id === "standard",
        pricing: [],
        droppedBiomarkerIds: [],
    })
}

/** The price row that applies: the city override, else the country row. */
export function servicePrice(
    opt: DiagnosticsServiceOption | undefined, country: Country, cityId?: string,
): DiagnosticsServicePrice | undefined {
    if (!opt) return undefined
    const city = cityId ? opt.pricing.find(p => p.country === country && p.cityId === cityId) : undefined
    const base = opt.pricing.find(p => p.country === country && !p.cityId)
    if (!city) return base
    return { ...(base ?? { country }), ...city }
}

export function finalServicePrice(p: DiagnosticsServicePrice | undefined): number | undefined {
    if (!p || p.price === undefined) return undefined
    if (!p.discountType || !p.discountValue) return p.price
    return p.discountType === "percent"
        ? Math.round(p.price * (1 - p.discountValue / 100) * 100) / 100
        : Math.max(0, p.price - p.discountValue)
}
