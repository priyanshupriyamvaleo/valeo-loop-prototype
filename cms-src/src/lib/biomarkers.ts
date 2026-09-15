// ── Biomarker authoring, panels and reference bands ───────────
// The clinical spine. Everything here is prototype-local: the content service
// publishes Health Products and Treatments only, and has no biomarker, panel,
// range or code endpoint of any kind (see section-sync).
//
// One rule shapes the whole file: a biomarker is a CLINICAL FACT, not a
// product. Nothing below returns a price. Build-your-own pricing lives in
// `lib/cyot.ts`, one layer out, because a component price is a property of the
// channel and not of the analyte.

import type {
    Biomarker, BiomarkerCode, BiomarkerPanel, BiomarkerRange, CodeScheme, Country,
    RangeGrade, SampleKind, TubeType,
} from "@/types"

// ── Display vocabularies ──────────────────────────────────────

export const LIFECYCLES: { id: NonNullable<Biomarker["lifecycle"]>; label: string; blurb: string }[] = [
    { id: "draft", label: "Draft", blurb: "Being authored. Never resolvable in a package or a basket." },
    { id: "active", label: "Active", blurb: "Curated and usable. This is not a sellability flag." },
    { id: "deprecated", label: "Deprecated", blurb: "Kept for historical results; cannot be newly selected." },
]

/** Cap colours are how labs actually name tubes, so the UI uses them too. */
export const TUBE_TYPES: { id: TubeType; label: string; swatch: string }[] = [
    { id: "sst_gold", label: "SST — gold", swatch: "#C6A22B" },
    { id: "edta_lavender", label: "EDTA — lavender", swatch: "#9186C2" },
    { id: "citrate_blue", label: "Citrate — blue", swatch: "#3C79B4" },
    { id: "fluoride_grey", label: "Fluoride — grey", swatch: "#7F8A91" },
    { id: "heparin_green", label: "Heparin — green", swatch: "#4A9366" },
    { id: "none", label: "No tube (non-blood)", swatch: "#CBD5D8" },
]

/** Ordered low → high. The order is the scale, so never re-sort this. */
export const GRADES: { id: RangeGrade; label: string; tone: string }[] = [
    { id: "critical_low", label: "Critical low", tone: "#7C3F5E" },
    { id: "low", label: "Low", tone: "#B4703A" },
    { id: "suboptimal", label: "Suboptimal", tone: "#C79A38" },
    { id: "normal", label: "Normal", tone: "#3F8763" },
    { id: "optimal", label: "Optimal", tone: "#0C6B72" },
    { id: "high", label: "High", tone: "#B4703A" },
    { id: "critical_high", label: "Critical high", tone: "#9C3232" },
]

export const CODE_SCHEMES: { id: CodeScheme; label: string; scope: string }[] = [
    { id: "loinc", label: "LOINC", scope: "Global lab vocabulary" },
    { id: "cpt", label: "CPT", scope: "The one scheme already populated in live lab data" },
    { id: "valeo_uae", label: "Valeo UAE", scope: "Legacy VB#### series — kept so old codes resolve" },
    { id: "valeo_ksa", label: "Valeo KSA", scope: "Legacy VK#### series" },
    { id: "nabidh", label: "NABIDH", scope: "Dubai — DHA" },
    { id: "riayati", label: "Riayati", scope: "Northern Emirates — MOHAP" },
    { id: "nphies", label: "NPHIES", scope: "KSA — claims plus observations" },
]

export const gradeOf = (g: RangeGrade) => GRADES.find(x => x.id === g)
export const tubeOf = (t?: TubeType) => TUBE_TYPES.find(x => x.id === t)

/** A tube is meaningless without blood — absence is an answer, not missing data. */
export const tubeApplies = (kind: SampleKind) => kind === "blood"

// ── Panels ────────────────────────────────────────────────────

/**
 * The panel names an analyte belongs to, joined for display.
 *
 * `panelGroup` used to BE the panel — a free-text string. It is now derived
 * from membership so the two can never drift, which is what lets
 * `groupBiomarkers()` and the package mapping UI keep working untouched.
 */
export function derivePanelGroup(b: Biomarker, panels: BiomarkerPanel[]): string | undefined {
    const names = panels.filter(p => p.memberIds.includes(b.id)).map(p => p.nameEn)
    return names.length ? names.join(" · ") : b.panelGroup
}

/** Applies the derivation across a master list, leaving everything else alone. */
export function withDerivedPanelGroups(list: Biomarker[], panels: BiomarkerPanel[]): Biomarker[] {
    return list.map(b => ({ ...b, panelGroup: derivePanelGroup(b, panels) }))
}

export function panelsOf(b: Biomarker, panels: BiomarkerPanel[]): BiomarkerPanel[] {
    return panels.filter(p => p.memberIds.includes(b.id))
}

/**
 * Every analyte a selection resolves to.
 *
 * Two expansions, and the order matters: panels expand to their members, then
 * derived analytes pull their inputs — because an input may itself sit inside a
 * chosen panel, and the result is a SET either way. Returned as a set so
 * "charge the union" has something well-defined to charge.
 *
 * `derivedKept` is reported separately: a derived value is not drawn, so it
 * must never reach a lab requisition even though it is legitimately in the
 * basket.
 */
export function expandToAnalytes(
    selection: { biomarkerIds?: string[]; panelIds?: string[] },
    biomarkers: Biomarker[],
    panels: BiomarkerPanel[],
): { assayed: string[]; derived: string[]; all: string[]; addedByExpansion: string[] } {
    const byId = new Map(biomarkers.map(b => [b.id, b]))
    const chosen = new Set(selection.biomarkerIds ?? [])
    const directly = new Set(chosen)

    for (const pid of selection.panelIds ?? []) {
        const panel = panels.find(p => p.id === pid)
        for (const m of panel?.memberIds ?? []) chosen.add(m)
    }

    // Derived inputs, resolved transitively — a ratio of ratios is legal.
    const seen = new Set<string>()
    const pullInputs = (id: string) => {
        if (seen.has(id)) return
        seen.add(id)
        const b = byId.get(id)
        if (!b?.isDerived) return
        for (const input of b.inputIds ?? []) { chosen.add(input); pullInputs(input) }
    }
    for (const id of [...chosen]) pullInputs(id)

    const all = [...chosen]
    return {
        all,
        assayed: all.filter(id => !byId.get(id)?.isDerived),
        derived: all.filter(id => byId.get(id)?.isDerived),
        addedByExpansion: all.filter(id => !directly.has(id)),
    }
}

// ── Derived package card fields ───────────────────────────────
// Typed by hand today, on every package, in two languages. Derived here so
// editing one analyte silently corrects every package that contains it.

/** A package's fasting requirement is the MAX over its set, never typed. */
export function fastingHoursFor(ids: string[], biomarkers: Biomarker[]): number | undefined {
    const hours = ids
        .map(id => biomarkers.find(b => b.id === id)?.fastingHours)
        .filter((h): h is number => typeof h === "number")
    return hours.length ? Math.max(...hours) : undefined
}

/** Same shape for turnaround. A lab mapping may raise it per lab. */
export function tatHoursFor(ids: string[], biomarkers: Biomarker[]): number | undefined {
    const hours = ids
        .map(id => biomarkers.find(b => b.id === id)?.tatHours)
        .filter((h): h is number => typeof h === "number")
    return hours.length ? Math.max(...hours) : undefined
}

/** The specimens a set requires — drives courier and tube consolidation. */
export function specimensFor(ids: string[], biomarkers: Biomarker[]): SampleKind[] {
    return [...new Set(ids.map(id => biomarkers.find(b => b.id === id)?.sampleKind).filter(Boolean) as SampleKind[])]
}

/** Tubes a phlebotomist must actually carry, deduplicated. */
export function tubesFor(ids: string[], biomarkers: Biomarker[]): TubeType[] {
    return [...new Set(ids
        .map(id => biomarkers.find(b => b.id === id))
        .filter(b => b && tubeApplies(b.sampleKind) && b.tubeType)
        .map(b => b!.tubeType!))]
}

/** A hard sex restriction anywhere in the set — drives the card's icons. */
export function sexRestrictionFor(ids: string[], biomarkers: Biomarker[]): "any" | "male_only" | "female_only" | "conflict" {
    const set = new Set(ids
        .map(id => biomarkers.find(b => b.id === id)?.sexApplicability)
        .filter(s => s && s !== "any"))
    if (!set.size) return "any"
    if (set.size > 1) return "conflict"
    return [...set][0] as "male_only" | "female_only"
}

// ── Reference band resolution ─────────────────────────────────

export interface RangeContext {
    country?: Country
    labId?: string
    sex?: "male" | "female"
    ageYears?: number
    pregnant?: boolean
    /** The SAMPLE date, never today — that is the whole point of versioning. */
    sampleDate?: string
}

const withinWindow = (r: BiomarkerRange, on?: string) => {
    if (!on) return !r.effectiveTo
    return r.effectiveFrom <= on && (!r.effectiveTo || r.effectiveTo > on)
}

const matchesPatient = (r: BiomarkerRange, ctx: RangeContext) => {
    if (r.sex !== "any" && ctx.sex && r.sex !== ctx.sex) return false
    if (typeof ctx.ageYears === "number") {
        if (typeof r.ageMinYears === "number" && ctx.ageYears < r.ageMinYears) return false
        if (typeof r.ageMaxYears === "number" && ctx.ageYears > r.ageMaxYears) return false
    }
    if (r.pregnancy && r.pregnancy !== "any" && typeof ctx.pregnant === "boolean") {
        if (r.pregnancy === "pregnant" && !ctx.pregnant) return false
        if (r.pregnancy === "not_pregnant" && ctx.pregnant) return false
    }
    return true
}

/**
 * The bands that apply, resolved by a FIXED ladder, first rung that has rows:
 *
 *   1. the lab that actually ran it   — method-dependent bands are real
 *   2. the market                     — health authorities differ on thresholds
 *   3. the Valeo default
 *
 * Lab beats country because a method-dependent band is a property of the assay,
 * not the jurisdiction: applying a country default over it would mark healthy
 * patients abnormal. Every rung is additionally filtered to the window
 * containing the SAMPLE date, so a report re-rendered years later resolves the
 * band that was live when the blood was drawn.
 *
 * A rung is taken all-or-nothing. Mixing a lab's low band with a country's high
 * band would produce a scale no one authored.
 */
export function resolveRanges(
    ranges: BiomarkerRange[],
    biomarkerId: string,
    ctx: RangeContext = {},
): { bands: BiomarkerRange[]; rung: "lab" | "country" | "default" | "none" } {
    const mine = ranges.filter(r =>
        r.biomarkerId === biomarkerId && withinWindow(r, ctx.sampleDate) && matchesPatient(r, ctx))

    if (ctx.labId) {
        const lab = mine.filter(r => r.labId === ctx.labId)
        if (lab.length) return { bands: sortBands(lab), rung: "lab" }
    }
    if (ctx.country) {
        const country = mine.filter(r => !r.labId && r.country === ctx.country)
        if (country.length) return { bands: sortBands(country), rung: "country" }
    }
    const def = mine.filter(r => !r.labId && !r.country)
    return def.length
        ? { bands: sortBands(def), rung: "default" }
        : { bands: [], rung: "none" }
}

const GRADE_ORDER = GRADES.map(g => g.id)
const sortBands = (b: BiomarkerRange[]) =>
    [...b].sort((x, y) => GRADE_ORDER.indexOf(x.grade) - GRADE_ORDER.indexOf(y.grade))

/** Grade a value against the resolved bands. Open-ended bands are honoured. */
export function gradeValue(value: number, bands: BiomarkerRange[]): BiomarkerRange | undefined {
    return bands.find(b =>
        (b.low === undefined || value >= b.low) && (b.high === undefined || value <= b.high))
}

// ── Authoring gates ───────────────────────────────────────────

/**
 * What blocks this analyte from going ACTIVE.
 *
 * Blocking is reserved for states that would fail at fulfilment or produce a
 * clinically wrong report. An unmapped EMR code stops nobody from being tested,
 * so that is a warning in `biomarkerWarnings()` and never a block — making it a
 * block would freeze the catalogue behind an integration backlog we do not own.
 */
export function biomarkerGaps(b: Biomarker, all: Biomarker[] = []): string[] {
    const gaps: string[] = []
    if (!b.nameEn?.trim()) gaps.push("Give it a display name.")
    if (!b.internalName?.trim()) gaps.push("Give it an internal name — it is how admins find it.")
    if (!b.unitUcum?.trim()) {
        gaps.push("Set a UCUM unit. A free-text unit is what made conversions hand-maintained.")
    }
    if (tubeApplies(b.sampleKind) && !b.tubeType) {
        gaps.push("Blood analytes need a tube type — it drives what the phlebotomist carries.")
    }
    if (!tubeApplies(b.sampleKind) && b.tubeType && b.tubeType !== "none") {
        gaps.push(`A ${b.sampleKind} specimen has no tube, but one is set.`)
    }
    if (b.isDerived) {
        if (!(b.inputIds ?? []).length) {
            gaps.push("A derived value must name the analytes it is computed from.")
        } else {
            const missing = (b.inputIds ?? []).filter(id => !all.some(x => x.id === id))
            if (missing.length) gaps.push(`${missing.length} input analyte(s) no longer exist.`)
            if ((b.inputIds ?? []).includes(b.id)) gaps.push("A derived value cannot be its own input.")
        }
    }
    if (!b.descriptionEn?.trim()) gaps.push("Write the English description — it renders on the report.")
    if (!(b.countryAvailability ?? []).length) {
        gaps.push("Choose at least one market. No market means it is offered nowhere.")
    }
    return gaps
}

/** Real but non-blocking — work that is genuinely incomplete and breaks nothing. */
export function biomarkerWarnings(
    b: Biomarker, codes: BiomarkerCode[] = [], ranges: BiomarkerRange[] = [],
): string[] {
    const out: string[] = []
    const mine = codes.filter(c => c.biomarkerId === b.id)
    if (!mine.length) {
        out.push("No EMR code recorded. Nobody has looked yet — which is different from there being no match.")
    } else if (mine.every(c => c.status === "pending_review")) {
        out.push("Every code is still pending review.")
    }
    if (!ranges.some(r => r.biomarkerId === b.id)) {
        out.push("No reference band, so a result cannot be graded.")
    }
    if (!b.descriptionAr?.trim()) out.push("Arabic description missing — the report will fall back to English.")
    if (b.isDerived === true && b.fastingHours) {
        out.push("A derived value is computed, not drawn, so its own fasting rule never applies.")
    }
    return out
}

/**
 * Bands that overlap within one scope and one window — a publish gate.
 *
 * Overlap is not a style problem: two bands claiming the same value means the
 * grade a patient sees depends on row order.
 */
export function overlappingBands(ranges: BiomarkerRange[], biomarkerId: string): string[] {
    const scopeKey = (r: BiomarkerRange) =>
        [r.country ?? "-", r.labId ?? "-", r.sex, r.pregnancy ?? "any",
         r.ageMinYears ?? "-", r.ageMaxYears ?? "-", r.effectiveFrom].join("|")
    const groups = new Map<string, BiomarkerRange[]>()
    for (const r of ranges.filter(x => x.biomarkerId === biomarkerId && !x.effectiveTo)) {
        const k = scopeKey(r)
        groups.set(k, [...(groups.get(k) ?? []), r])
    }
    const issues: string[] = []
    for (const [, rows] of groups) {
        const sorted = [...rows].sort((a, b) => (a.low ?? -Infinity) - (b.low ?? -Infinity))
        for (let i = 1; i < sorted.length; i++) {
            const prev = sorted[i - 1], cur = sorted[i]
            if (prev.high !== undefined && cur.low !== undefined && cur.low < prev.high) {
                issues.push(`${gradeOf(prev.grade)?.label} and ${gradeOf(cur.grade)?.label} overlap at ${cur.low}–${prev.high}.`)
            }
        }
    }
    return issues
}

/**
 * Markets that are mapped but carry nothing.
 *
 * NOT a gap: adding a market is the first half of a two-step action, and
 * flagging it red before anyone could add a biomarker to it makes the flow look
 * broken at the exact moment it is working. It is worth saying, quietly, once
 * something else is wrong or the panel is being reviewed.
 */
export function emptyMappedMarkets(
    panel: Pick<BiomarkerPanel, "countryMembers">,
): Country[] {
    return (panel.countryMembers ?? []).filter(m => !m.biomarkerIds.length).map(m => m.country)
}

export function panelGaps(panel: BiomarkerPanel, biomarkers: Biomarker[]): string[] {
    const gaps: string[] = []
    if (!panel.nameEn?.trim()) gaps.push("Name the panel.")
    if (!(panel.countryMembers ?? []).some(m => m.biomarkerIds.length)) {
        gaps.push("No market has any biomarkers mapped, so this panel resolves to nothing anywhere.")
    }

    const missing = panel.memberIds.filter(id => !biomarkers.some(b => b.id === id))
    if (missing.length) gaps.push(`${missing.length} member analyte(s) no longer exist.`)
    const derived = panel.memberIds.filter(id => biomarkers.find(b => b.id === id)?.isDerived)
    if (derived.length && !panel.labPanelCode) {
        gaps.push("This panel contains derived values, so it cannot be routed to a lab as a whole without a panel code.")
    }
    return gaps
}

// ── Panel coverage across markets ─────────────────────────────

export interface PanelMarketCoverage {
    country: Country
    offered: string[]
    missing: string[]
}

export interface PanelCoverageResult {
    perCountry: PanelMarketCoverage[]
    /** Members offered in EVERY market that offers anything. */
    shared: string[]
    /** How many members are not universally offered. */
    differBy: number
    severity: DriftSeverity
}

export type DriftSeverity = "none" | "minor" | "moderate" | "severe"

/**
 * How a panel resolves in each market.
 *
 * ⚠️ ONE member list, resolved per market — NOT a member list per market. A
 * panel is a clinical grouping: CBC is CBC in Riyadh. What differs is which of
 * its members a market actually offers, and that difference is real rather than
 * hypothetical — the master splits 296 UAE-only / 58 KSA-only / 140 both, so
 * the same panel legitimately resolves to fewer biomarkers in one market.
 *
 * Storing membership per country would say the same thing twice and let the two
 * drift into disagreeing about what a CBC contains. Resolving one list against
 * availability cannot.
 *
 * A biomarker with NO market list counts as missing everywhere: that is an
 * unfinished record, not a market decision, and passing it silently is how a
 * package ends up advertising a biomarker nobody can order.
 */
export function panelCoverage(
    panel: Pick<BiomarkerPanel, "memberIds">,
    biomarkers: Biomarker[],
    countries: Country[],
): PanelCoverageResult {
    const byId = new Map(biomarkers.map(b => [b.id, b]))
    const perCountry = countries.map(country => {
        const offered: string[] = []
        const missing: string[] = []
        for (const id of panel.memberIds) {
            const b = byId.get(id)
            if (!b) { missing.push(id); continue }
            ;((b.countryAvailability ?? []).includes(country) ? offered : missing).push(id)
        }
        return { country, offered, missing }
    })

    // Only markets that offer something can drift against each other; a single
    // live market has nothing to differ from.
    const live = perCountry.filter(p => p.offered.length > 0)
    const shared = live.length
        ? panel.memberIds.filter(id => live.every(p => p.offered.includes(id)))
        : []
    const differBy = panel.memberIds.length - shared.length

    return {
        perCountry, shared, differBy,
        severity: live.length < 2 ? "none" : coverageSeverity(differBy),
    }
}

/** Same thresholds the diagnostics drift badge uses, so the two agree. */
export function coverageSeverity(differBy: number): DriftSeverity {
    if (differBy === 0) return "none"
    if (differBy <= 3) return "minor"
    if (differBy <= 10) return "moderate"
    return "severe"
}


/**
 * The members that apply in one market.
 *
 * A country map wins over the base list when it exists; otherwise the base list
 * answers. That order is what lets a panel be authored once and still express a
 * real market difference — rather than forcing four copies so that one of them
 * can differ.
 */
export function membersForCountry(
    panel: Pick<BiomarkerPanel, "countryMembers">,
    country: Country,
): string[] {
    return (panel.countryMembers ?? []).find(m => m.country === country)?.biomarkerIds ?? []
}

/**
 * The flat set, derived from every market's map.
 *
 * There is no authored global list, so anything that needs "the biomarkers in
 * this panel" without a market in hand asks for the union. Order follows first
 * appearance across the maps, which keeps it stable between reads.
 */
export function derivedMemberIds(
    panel: Pick<BiomarkerPanel, "countryMembers">,
): string[] {
    const seen = new Set<string>()
    for (const m of panel.countryMembers ?? []) {
        for (const id of m.biomarkerIds) seen.add(id)
    }
    return [...seen]
}

/** True when any market has been given its own list. */
export const hasCountryOverrides = (
    panel: Pick<BiomarkerPanel, "countryMembers">,
): boolean => (panel.countryMembers ?? []).some(m => m.biomarkerIds.length > 0)
