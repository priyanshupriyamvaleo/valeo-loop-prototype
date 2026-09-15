// ── Biomarker persistence ─────────────────────────────────────
// Real Postgres, so an analyte someone authors survives a reload. Everything
// here is server-only: it is imported by route handlers, never by a component.

import { getSql } from "./client"
import type {
    Biomarker, BiomarkerCode, BiomarkerPanel, Country, CyotComponentPrice, SampleKind,
} from "@/types"

type Row = Record<string, unknown>

const toBiomarker = (r: Row): Biomarker => ({
    id: r.id as string,
    internalName: (r.internal_name as string) ?? undefined,
    nameEn: r.name_en as string,
    nameAr: (r.name_ar as string) ?? undefined,
    sampleKind: r.sample_kind as SampleKind,
    tubeType: (r.tube_type as Biomarker["tubeType"]) ?? undefined,
    unitUcum: (r.unit_ucum as string) ?? undefined,
    analyticalMethod: (r.analytical_method as string) ?? undefined,
    fastingHours: r.fasting_hours == null ? undefined : Number(r.fasting_hours),
    tatHours: r.tat_hours == null ? undefined : Number(r.tat_hours),
    sexApplicability: r.sex_applicability as Biomarker["sexApplicability"],
    isDerived: !!r.is_derived,
    inputIds: (r.input_ids as string[]) ?? [],
    lifecycle: r.lifecycle as Biomarker["lifecycle"],
    isActive: !!r.is_active,
    countryAvailability: (r.country_availability as Country[]) ?? [],
    descriptionEn: (r.description_en as string) ?? undefined,
    descriptionAr: (r.description_ar as string) ?? undefined,
    causesEn: (r.causes_en as string) ?? undefined,
    whatToDoEn: (r.what_to_do_en as string) ?? undefined,
    imageUrl: (r.image_url as string) ?? undefined,
    legacyId: r.legacy_id == null ? undefined : Number(r.legacy_id),
})

export async function listBiomarkers(): Promise<Biomarker[]> {
    const sql = getSql()
    const rows = await sql`SELECT * FROM biomarkers ORDER BY name_en` as Row[]
    return rows.map(toBiomarker)
}

export async function getBiomarker(id: string): Promise<Biomarker | null> {
    const sql = getSql()
    const rows = await sql`SELECT * FROM biomarkers WHERE id = ${id}` as Row[]
    return rows.length ? toBiomarker(rows[0]) : null
}

/**
 * Insert or update in one statement.
 *
 * `updated_at` is stamped here rather than by a trigger so the write is the one
 * place that decides it, and a backfill can choose not to touch it.
 */
export async function upsertBiomarker(b: Biomarker): Promise<Biomarker> {
    const sql = getSql()
    const rows = await sql`
        INSERT INTO biomarkers (
            id, internal_name, name_en, name_ar, sample_kind, tube_type, unit_ucum,
            analytical_method, fasting_hours, tat_hours, sex_applicability, is_derived,
            input_ids, lifecycle, is_active, country_availability, description_en,
            description_ar, causes_en, what_to_do_en, image_url, legacy_id
        ) VALUES (
            ${b.id}, ${b.internalName ?? null}, ${b.nameEn}, ${b.nameAr ?? null},
            ${b.sampleKind}, ${b.tubeType ?? null}, ${b.unitUcum ?? null},
            ${b.analyticalMethod ?? null}, ${b.fastingHours ?? null}, ${b.tatHours ?? null},
            ${b.sexApplicability ?? "any"}, ${!!b.isDerived}, ${b.inputIds ?? []},
            ${b.lifecycle ?? "draft"}, ${b.isActive ?? true}, ${b.countryAvailability ?? []},
            ${b.descriptionEn ?? null}, ${b.descriptionAr ?? null}, ${b.causesEn ?? null},
            ${b.whatToDoEn ?? null}, ${b.imageUrl ?? null}, ${b.legacyId ?? null}
        )
        ON CONFLICT (id) DO UPDATE SET
            internal_name = EXCLUDED.internal_name, name_en = EXCLUDED.name_en,
            name_ar = EXCLUDED.name_ar, sample_kind = EXCLUDED.sample_kind,
            tube_type = EXCLUDED.tube_type, unit_ucum = EXCLUDED.unit_ucum,
            analytical_method = EXCLUDED.analytical_method,
            fasting_hours = EXCLUDED.fasting_hours, tat_hours = EXCLUDED.tat_hours,
            sex_applicability = EXCLUDED.sex_applicability, is_derived = EXCLUDED.is_derived,
            input_ids = EXCLUDED.input_ids, lifecycle = EXCLUDED.lifecycle,
            is_active = EXCLUDED.is_active,
            country_availability = EXCLUDED.country_availability,
            description_en = EXCLUDED.description_en, description_ar = EXCLUDED.description_ar,
            causes_en = EXCLUDED.causes_en, what_to_do_en = EXCLUDED.what_to_do_en,
            image_url = EXCLUDED.image_url, updated_at = now()
        RETURNING *` as Row[]
    return toBiomarker(rows[0])
}

// ── Codes ─────────────────────────────────────────────────────

const toCode = (r: Row): BiomarkerCode => ({
    id: r.id as string,
    biomarkerId: r.biomarker_id as string,
    scheme: r.scheme as BiomarkerCode["scheme"],
    country: (r.country as Country) ?? undefined,
    code: (r.code as string) ?? undefined,
    display: (r.display as string) ?? undefined,
    codeKind: (r.code_kind as BiomarkerCode["codeKind"]) ?? undefined,
    status: r.status as BiomarkerCode["status"],
    effectiveFrom: r.effective_from ? String(r.effective_from).slice(0, 10) : undefined,
})

export async function listCodes(biomarkerId?: string): Promise<BiomarkerCode[]> {
    const sql = getSql()
    const rows = biomarkerId
        ? await sql`SELECT * FROM biomarker_codes WHERE biomarker_id = ${biomarkerId} ORDER BY scheme`
        : await sql`SELECT * FROM biomarker_codes ORDER BY biomarker_id, scheme`
    return (rows as Row[]).map(toCode)
}

/** Whole-set replace for one analyte — mirrors how the editor holds them. */
export async function replaceCodes(biomarkerId: string, codes: BiomarkerCode[]): Promise<void> {
    const sql = getSql()
    await sql`DELETE FROM biomarker_codes WHERE biomarker_id = ${biomarkerId}`
    for (const c of codes) {
        await sql`
            INSERT INTO biomarker_codes (id, biomarker_id, scheme, country, code, display, code_kind, status, effective_from)
            VALUES (${c.id}, ${biomarkerId}, ${c.scheme}, ${c.country ?? null}, ${c.code ?? null},
                    ${c.display ?? null}, ${c.codeKind ?? null}, ${c.status}, ${c.effectiveFrom ?? null})
            ON CONFLICT (id) DO NOTHING`
    }
}

/** Is this LOINC code already mapped? Stops two analytes claiming one term. */
export async function findByLoinc(code: string): Promise<{ biomarkerId: string; nameEn: string } | null> {
    const sql = getSql()
    const rows = await sql`
        SELECT c.biomarker_id, b.name_en
        FROM biomarker_codes c JOIN biomarkers b ON b.id = c.biomarker_id
        WHERE c.scheme = 'loinc' AND c.code = ${code} LIMIT 1` as Row[]
    return rows.length ? { biomarkerId: rows[0].biomarker_id as string, nameEn: rows[0].name_en as string } : null
}

// ── Panels ────────────────────────────────────────────────────

export async function listPanels(): Promise<BiomarkerPanel[]> {
    const sql = getSql()
    const panels = await sql`SELECT * FROM biomarker_panels ORDER BY name_en` as Row[]
    const members = await sql`
        SELECT panel_id, biomarker_id, country FROM biomarker_panel_members
        ORDER BY panel_id, sort_order` as Row[]

    // NULL country is the base list; a value is that market's own list.
    const base = new Map<string, string[]>()
    const perCountry = new Map<string, Map<string, string[]>>()
    for (const m of members) {
        const panelId = m.panel_id as string
        const bid = m.biomarker_id as string
        const country = (m.country as string | null) ?? null
        if (country === null) {
            base.set(panelId, [...(base.get(panelId) ?? []), bid])
        } else {
            const forPanel = perCountry.get(panelId) ?? new Map<string, string[]>()
            forPanel.set(country, [...(forPanel.get(country) ?? []), bid])
            perCountry.set(panelId, forPanel)
        }
    }

    return panels.map(p => {
        const id = p.id as string
        const maps = [...(perCountry.get(id) ?? new Map()).entries()]
            .map(([country, biomarkerIds]) => ({ country: country as Country, biomarkerIds }))
        return {
            id,
            nameEn: p.name_en as string,
            nameAr: (p.name_ar as string) ?? undefined,
            labPanelCode: (p.lab_panel_code as string) ?? undefined,
            isActive: !!p.is_active,
            note: (p.note as string) ?? undefined,
            // Derived, never stored: the union of every market's map. Two
            // authored lists would eventually disagree; one cannot.
            memberIds: [...new Set(maps.flatMap(m => m.biomarkerIds))],
            ...(maps.length ? { countryMembers: maps } : {}),
        }
    })
}

export async function upsertPanel(p: BiomarkerPanel & { loincNum?: string }): Promise<void> {
    const sql = getSql()
    await sql`
        INSERT INTO biomarker_panels (id, name_en, name_ar, lab_panel_code, loinc_num, is_active, note)
        VALUES (${p.id}, ${p.nameEn}, ${p.nameAr ?? null}, ${p.labPanelCode ?? null},
                ${p.loincNum ?? null}, ${p.isActive}, ${p.note ?? null})
        ON CONFLICT (id) DO UPDATE SET
            name_en = EXCLUDED.name_en, name_ar = EXCLUDED.name_ar,
            lab_panel_code = EXCLUDED.lab_panel_code, is_active = EXCLUDED.is_active,
            note = EXCLUDED.note, updated_at = now()`
    // Membership is replaced wholesale — the editor owns the order, and a diff
    // would have to reconcile sort_order anyway. That covers the base list AND
    // every market map in one go, so a market whose row was removed in the UI
    // actually loses it rather than lingering.
    await sql`DELETE FROM biomarker_panel_members WHERE panel_id = ${p.id}`
    // No base rows are written — membership is per market only, so a NULL
    // country row would be a global list nobody authored.
    for (const map of p.countryMembers ?? []) {
        for (let i = 0; i < map.biomarkerIds.length; i++) {
            await sql`
                INSERT INTO biomarker_panel_members (panel_id, biomarker_id, sort_order, country)
                VALUES (${p.id}, ${map.biomarkerIds[i]}, ${i}, ${map.country})`
        }
    }
}

export async function deletePanel(id: string): Promise<void> {
    const sql = getSql()
    await sql`DELETE FROM biomarker_panels WHERE id = ${id}`
}

/** Row counts, for the empty-state copy to be honest about what is there. */
export async function counts(): Promise<{ biomarkers: number; panels: number; codes: number }> {
    const sql = getSql()
    const r = await sql`
        SELECT (SELECT count(*) FROM biomarkers)::int      AS biomarkers,
               (SELECT count(*) FROM biomarker_panels)::int AS panels,
               (SELECT count(*) FROM biomarker_codes)::int  AS codes` as Row[]
    return {
        biomarkers: Number(r[0].biomarkers),
        panels: Number(r[0].panels),
        codes: Number(r[0].codes),
    }
}

// ── Build-your-own component prices ───────────────────────────

/**
 * ⚠️ `city_id` comes back from Postgres as NULL, not undefined. Every consumer
 * compares with `=== cityId` where the base row's cityId is `undefined`, and
 * `null === undefined` is false — so a base row read straight from the database
 * would never match its own cell and the sheet would show every market as
 * unpriced. Normalising here, at the boundary, rather than asking each caller
 * to remember.
 */
const toPrice = (r: Row): CyotComponentPrice => ({
    biomarkerId: r.biomarker_id as string,
    country: r.country as Country,
    cityId: (r.city_id as string | null) ?? undefined,
    price: Number(r.price),
    effectiveFrom: r.effective_from ? String(r.effective_from).slice(0, 10) : undefined,
})

export async function listComponentPrices(country?: Country): Promise<CyotComponentPrice[]> {
    const sql = getSql()
    const rows = country
        ? await sql`SELECT * FROM cyot_component_prices WHERE country = ${country}`
        : await sql`SELECT * FROM cyot_component_prices`
    return (rows as Row[]).map(toPrice)
}

/**
 * Whole-set replace. The sheet owns the entire grid — a cleared cell is the
 * ABSENCE of a row, so a patch-style write could never express a deletion
 * without a tombstone, and a tombstone is the flag D-C58 exists to avoid.
 */
export async function replaceComponentPrices(rows: CyotComponentPrice[]): Promise<CyotComponentPrice[]> {
    const sql = getSql()
    await sql`DELETE FROM cyot_component_prices`
    for (const r of rows) {
        if (!Number.isFinite(r.price)) continue
        await sql`
            INSERT INTO cyot_component_prices (biomarker_id, country, city_id, price, effective_from)
            VALUES (${r.biomarkerId}, ${r.country}, ${r.cityId ?? null}, ${r.price}, ${r.effectiveFrom ?? null})`
    }
    return listComponentPrices()
}
