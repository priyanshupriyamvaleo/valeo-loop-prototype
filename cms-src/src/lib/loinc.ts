// ── LOINC, live ───────────────────────────────────────────────
// Source: the NLM Clinical Table Search Service (`clinicaltables.nlm.nih.gov`)
// — public, no key, ~112,000 LOINC records. Queried live rather than imported,
// so there is no stale copy to re-sync and no redistribution question.
//
// ⚠️ WHAT THIS SOURCE DOES AND DOES NOT CARRY. It reliably returns LOINC_NUM,
// LONG_COMMON_NAME, COMPONENT, PROPERTY, METHOD_TYP and SHORTNAME. It does NOT
// expose SYSTEM, SCALE_TYP, CLASS, STATUS or EXAMPLE_UCUM_UNITS — those come
// back null. So:
//   · specimen is PARSED out of the long common name ("… in Serum or Plasma"),
//     which is derived rather than authoritative, and is offered as a
//     suggestion the author confirms
//   · the UCUM unit is NOT guessed. PROPERTY says what KIND of quantity it is
//     (MCnc = mass concentration) but not the unit, and inventing "ng/mL"
//     because something is a mass concentration is exactly the kind of
//     plausible-but-wrong value that a clinical field must not acquire silently.
//
// The authoritative fields, plus LOINC's Panels and Forms file (which carries
// panel hierarchy, SEQUENCE and member cardinality), require a free LOINC
// account. See `loincFullSourceGap()`.

import type { SampleKind } from "@/types"

const BASE = "https://clinicaltables.nlm.nih.gov/api/loinc_items/v3/search"

/** The fields this endpoint actually returns. Asking for more yields nulls. */
const FIELDS = ["LOINC_NUM", "LONG_COMMON_NAME", "COMPONENT", "PROPERTY", "METHOD_TYP", "SHORTNAME"] as const

export interface LoincHit {
    loincNum: string
    longCommonName: string
    component: string
    property?: string
    method?: string
    shortName?: string
    /** Parsed from the long common name — a suggestion, not an assertion. */
    specimenGuess?: SampleKind
    /** The text the specimen guess came from, so an author can judge it. */
    specimenPhrase?: string
    /** What kind of quantity PROPERTY names, in words. Never a unit. */
    propertyMeaning?: string
    /** True when the term names a panel rather than a single analyte. */
    looksLikePanel: boolean
}

/**
 * PROPERTY codes, expanded. Deliberately stops at the KIND of quantity: the
 * unit is a lab-and-method fact that LOINC's own example units carry, and this
 * endpoint does not return them.
 */
const PROPERTY_MEANING: Record<string, string> = {
    MCnc: "Mass concentration — a mass per volume",
    SCnc: "Substance concentration — moles per volume",
    NCnc: "Number concentration — a count per volume",
    CCnc: "Catalytic concentration — enzyme activity per volume",
    ACnc: "Arbitrary concentration — units per volume",
    MRat: "Mass rate", SRat: "Substance rate",
    Titr: "Titre", Ratio: "A ratio — dimensionless",
    MFr: "Mass fraction — often a percent",
    NFr: "Number fraction — often a percent",
    Vol: "Volume", Len: "Length", Mass: "Mass", Temp: "Temperature",
    Time: "Time", Pres: "Pressure", Angle: "Angle",
    Num: "A plain count", Prid: "An identifier, not a quantity",
    Type: "A type, not a quantity", Imp: "An interpretation",
}

/** Specimen phrases in a long common name, longest-first so "Serum or Plasma" wins. */
const SPECIMEN_PHRASES: [RegExp, SampleKind][] = [
    [/\bin\s+Serum\s+or\s+Plasma\b/i, "blood"],
    [/\bin\s+(Serum|Plasma|Blood|Bld|Whole blood|Arterial blood|Venous blood|Capillary blood|RBC|Platelet rich plasma)\b/i, "blood"],
    [/\bin\s+(Urine|24 hour Urine)\b/i, "urine"],
    [/\bin\s+(Stool|Feces)\b/i, "stool"],
    [/\bin\s+Saliva\b/i, "saliva"],
    [/\bin\s+(Nasopharynx|Nose|Throat|Genital|Cervix|Vaginal|Swab)\b/i, "swab"],
    [/\bin\s+(Exhaled gas|Breath)\b/i, "breath"],
]

function parseSpecimen(longName: string): { kind?: SampleKind; phrase?: string } {
    for (const [re, kind] of SPECIMEN_PHRASES) {
        const m = re.exec(longName)
        if (m) return { kind, phrase: m[0].replace(/^in\s+/i, "") }
    }
    return {}
}

const PANEL_RE = /\b(panel|battery)\b/i

/**
 * Search LOINC live.
 *
 * `onlyPanels` filters to terms whose name says panel or battery — the closest
 * this endpoint gets to LOINC's CLASSTYPE, which it does not return.
 */
export async function searchLoinc(
    terms: string, opts: { max?: number; onlyPanels?: boolean } = {},
): Promise<LoincHit[]> {
    const q = terms.trim()
    if (!q) return []
    const url = `${BASE}?terms=${encodeURIComponent(q)}&maxList=${opts.max ?? 25}&df=${FIELDS.join(",")}`
    const res = await fetch(url, { headers: { accept: "application/json" }, next: { revalidate: 3600 } })
    if (!res.ok) throw new Error(`LOINC search failed (${res.status})`)

    // Shape: [total, [codes], extraFields|null, [[df values…], …]]
    const body = (await res.json()) as [number, string[], unknown, string[][]]
    const rows = body[3] ?? []

    const hits = rows.map(cols => {
        const get = (f: (typeof FIELDS)[number]) => cols[FIELDS.indexOf(f)] ?? ""
        const longCommonName = get("LONG_COMMON_NAME")
        const { kind, phrase } = parseSpecimen(longCommonName)
        const property = get("PROPERTY") || undefined
        return {
            loincNum: get("LOINC_NUM"),
            longCommonName,
            component: get("COMPONENT"),
            property,
            method: get("METHOD_TYP") || undefined,
            shortName: get("SHORTNAME") || undefined,
            specimenGuess: kind,
            specimenPhrase: phrase,
            propertyMeaning: property ? PROPERTY_MEANING[property] : undefined,
            looksLikePanel: PANEL_RE.test(longCommonName) || PANEL_RE.test(get("COMPONENT")),
        } satisfies LoincHit
    }).filter(h => h.loincNum)

    return opts.onlyPanels ? hits.filter(h => h.looksLikePanel) : hits
}

/**
 * What a LOINC term can and cannot fill in, stated once so the UI does not have
 * to imply more than the source gives.
 */
export const LOINC_FILLS = {
    from: ["Display name", "Internal name", "Specimen (parsed, needs confirming)", "Analytical method", "The LOINC code itself"],
    notFrom: ["Tube type", "Fasting hours", "Turnaround", "Reference bands", "Arabic and patient copy", "Component price", "Lab mappings and cost", "Derived-value inputs"],
} as const

/** Why the full field set and the panel members are not available yet. */
export function loincFullSourceGap(): string {
    return "SYSTEM, example UCUM units, CLASS and STATUS — and LOINC's Panels and Forms file, "
        + "which carries panel hierarchy, member order and required-vs-optional cardinality — "
        + "are only in the licensed LOINC release. Both need a free LOINC account; the public "
        + "NLM service does not expose them."
}
