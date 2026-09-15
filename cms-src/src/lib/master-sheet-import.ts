/**
 * ── .xlsx → Master Sheet ──────────────────────────────────────────────────────
 *
 * Reads back a workbook this app produced and reports what it WOULD change. It never
 * applies anything itself — the caller shows the diff and someone confirms it.
 *
 * ⚠️ A BLANK CELL IS IGNORED, NEVER A DELETION. This is the rule the whole import hangs
 * on. D-C29 makes an absent `(variant, city)` row mean NOT SOLD THERE, so "clear the cell"
 * and "delete the offer" would be the same keystroke — and a spreadsheet cannot tell a
 * deliberate blank from a stray Backspace, a filtered copy-paste, or a column someone
 * dragged over. So the import UPDATES and INSERTS only. Removing a city stays a UI action,
 * where it is one row, visible, and undoable.
 *
 * ⚠️ DERIVED COLUMNS ARE READ, REPORTED, AND NEVER WRITTEN BACK. `% off`, `≥N each` and a
 * pack's `RP` are formulas in the file. Honouring them would let a stale cached result
 * overwrite the fact it was computed from — a workbook opened in a viewer that does not
 * recalculate would write yesterday's numbers back as today's.
 *
 * But they are no longer ignored in SILENCE. A derived cell whose value disagrees with what
 * it derives from was typed into, and that is reported: someone who puts 220 into `≥2 each`
 * expecting the tier to move should hear that it did not, here, rather than from a customer.
 * A cell still agreeing with its inputs is just the formula's own result and says nothing.
 *
 * ⚠️ PACK SETTINGS ARE NOT IMPORTED. `sessions`, `interval_days`, `validity_days` and
 * `intended_pct` belong to `variant_session_packs`, one row per pack — but the file repeats
 * them on every city line, so nine cities can disagree about one fact and there is no
 * honest way to pick a winner. They are authored in Session Packs.
 *
 * So exactly two things come back in: `selling_price` / `retail_price`, and tier percents.
 */

export interface ImportedCell {
    cityName: string
    sp?: number
    rp?: number
    /** minQty → percent, already converted from the file's 0.05 to the stored 5. */
    tiers: Map<number, number>
}

export interface ImportedRow {
    variantId: string
    label: string
    cells: ImportedCell[]
    /**
     * The read-only columns AS THEY APPEAR IN THE FILE, so the caller can notice they were
     * edited and say so. They are still not imported — the point is that "ignored" and
     * "silently discarded" are different things, and someone who retyped a validity period
     * should hear that it did not take rather than find out months later.
     */
    readOnly: {
        sessions?: number
        baseLabel?: string
        intervalDays?: number
        validityDays?: number
        intendedPct?: number
        status?: string
        /**
         * Every identity column that is not one of the reserved names above, keyed by its
         * header — which is to say the AXES, without this module needing to know what axes a
         * treatment has. The caller checks them against the variant they matched.
         */
        axes: Record<string, string>
    }
}

/** A value that will NOT be applied, and why. Listed, never silently corrected. */
export interface Reject {
    label: string
    cityName: string
    field: string
    value: number | string
    reason: string
}

export interface ParsedSheet {
    /** From the title row, so a KSA file cannot be applied to the UAE tab by accident. */
    country?: string
    /** The `≥N` thresholds the file has columns for, so the caller can refuse unknown ones. */
    thresholds: number[]
    rows: ImportedRow[]
    /** Structural problems that stop the import outright. */
    errors: string[]
    /** Values excluded from the import, each with a reason. */
    rejects: Reject[]
    /** Things skipped but survivable, reported so nothing is silently dropped. */
    warnings: string[]
}

/** A formula cell reads back as `{ formula, result }`; a plain one as a number. */
const num = (v: unknown): number | undefined => {
    const raw = v !== null && typeof v === "object" && "result" in (v as object)
        ? (v as { result?: unknown }).result
        : v
    if (typeof raw === "number" && Number.isFinite(raw)) return raw
    if (typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw))) return Number(raw)
    return undefined
}
const text = (v: unknown): string => {
    if (v === null || v === undefined) return ""
    if (typeof v === "object") {
        const o = v as { result?: unknown; richText?: { text: string }[]; text?: string }
        if (Array.isArray(o.richText)) return o.richText.map(r => r.text).join("")
        if (o.text !== undefined) return String(o.text)
        if (o.result !== undefined) return String(o.result)
        return ""
    }
    return String(v)
}

export async function parseMasterSheet(file: File): Promise<ParsedSheet> {
    const errors: string[] = []
    const warnings: string[] = []
    const rejects: Reject[] = []
    const thresholds: number[] = []
    const ExcelJS = (await import("exceljs")).default
    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await file.arrayBuffer())

    /**
     * The sheet is found by its TITLE, not by index. Adding a tab in front of it — a working
     * copy, a pivot, a scratch pad — would otherwise make `worksheets[0]` the wrong sheet,
     * and the import would read someone's scratch pad as a price list.
     */
    const titled = wb.worksheets.filter(w => /Master Sheet —/.test(text(w.getCell(1, 1).value)))
    const ws = titled[0] ?? wb.worksheets[0]
    if (!ws) return { rows: [], thresholds, errors: ["The workbook has no sheets."], rejects, warnings }
    if (titled.length > 1) {
        errors.push(`${titled.length} sheets look like a Master Sheet. Keep one per workbook so there is no question which prices are meant.`)
    }
    if (wb.worksheets.length > 1 && titled.length <= 1) {
        warnings.push(`Only the "${ws.name}" sheet was read; the workbook has ${wb.worksheets.length} tabs. Anything on the others is ignored.`)
    }

    // The title carries the country, because it stopped being a column when the file was
    // pivoted. Applying a KSA file to the UAE tab would silently reprice a whole market.
    const title = text(ws.getCell(1, 1).value)
    const country = /Master Sheet — ([A-Z]+)/.exec(title)?.[1]
    if (!country) {
        errors.push("No 'Master Sheet — COUNTRY' title in cell A1. This is not a file this screen produced.")
    }

    // ── header ────────────────────────────────────────────────────────────────
    // Row 3 holds every column's label; row 2 holds the city over each block, written once
    // on the merged cell, so it is carried forward across the block's remaining columns.
    const lastCol = ws.columnCount
    const labels: string[] = []
    const cityOf: (string | undefined)[] = []
    let carried: string | undefined
    for (let c = 1; c <= lastCol; c++) {
        labels[c] = text(ws.getCell(3, c).value).trim()
        const own = text(ws.getCell(2, c).value).trim()
        if (own) carried = own
        cityOf[c] = carried
    }

    const idCol = labels.findIndex(l => l === "variant_id")
    const labelCol = labels.findIndex(l => l === "variant")
    const at = (h: string) => labels.findIndex(l => l === h)
    /** Present in older exports, absent from newer ones — read either way. */
    const cellAt = (r: number, h: string) => {
        const i = at(h)
        return i >= 1 ? ws.getCell(r, i).value : undefined
    }
    const RESERVED = new Set([
        "variant_id", "variant", "sessions", "base_variant",
        "interval_days", "validity_days", "intended_pct", "status",
    ])
    if (idCol < 1) errors.push("No 'variant_id' column found in row 3.")

    /** Columns that carry something importable, grouped by the city they sit under. */
    type Target =
        | { kind: "sp"; city: string }
        | { kind: "rp"; city: string }
        | { kind: "tier"; city: string; qty: number }
        /**
         * Read so it can be REPORTED, never to be written back. A derived column is a
         * formula; honouring one would let a stale cached result overwrite the fact it was
         * computed from. But ignoring an edit in silence is the failure this module spent
         * the rest of its length removing — someone who types 220 into `≥2 each` expecting
         * the tier to move gets nothing, and hears nothing.
         */
        | { kind: "derived"; city: string; what: string }
    const targets = new Map<number, Target>()
    for (let c = 1; c <= lastCol; c++) {
        const l = labels[c]
        const city = cityOf[c]
        if (!l || !city) continue
        // Only the city band has a city above it; the identity columns do not.
        if (c <= Math.max(idCol, labelCol)) continue
        if (l === "SP") targets.set(c, { kind: "sp", city })
        else if (l === "RP") targets.set(c, { kind: "rp", city })
        else {
            const m = /^≥\s*(\d+)\s*%$/.exec(l)
            if (m) {
                const qty = Number(m[1])
                targets.set(c, { kind: "tier", city, qty })
                if (!thresholds.includes(qty)) thresholds.push(qty)
            }
            else if (l === "% off") targets.set(c, { kind: "derived", city, what: "% off" })
            else {
                const e = /^≥\s*(\d+)\s*each$/.exec(l)
                if (e) targets.set(c, { kind: "derived", city, what: `≥${e[1]} each` })
            }
        }
    }
    if (targets.size === 0) {
        errors.push("No SP / RP / ≥N % columns found. Row 3 does not look like this sheet's header.")
    }
    /** Everything left of the first measure column: the identity block. */
    const firstMeasure = targets.size > 0 ? Math.min(...targets.keys()) : lastCol + 1
    const identityCols: number[] = []
    for (let c = 1; c < firstMeasure; c++) if (labels[c]) identityCols.push(c)
    if (errors.length > 0) return { country, thresholds, rows: [], errors, rejects, warnings }

    // ── rows ──────────────────────────────────────────────────────────────────
    const rows: ImportedRow[] = []
    for (let r = 4; r <= ws.rowCount; r++) {
        const variantId = text(ws.getCell(r, idCol).value).trim()
        if (!variantId) {
            // The legend lines at the bottom have no id, which is how the data ends — but a
            // row someone TYPED has no id either, and skipping it silently loses their work.
            // A hand-added row is reported; an empty or legend one is not.
            const hasValues = [...targets.keys()].some(c => num(ws.getCell(r, c).value) !== undefined)
            if (hasValues) {
                warnings.push(`Row ${r} has prices but no variant_id, so there is nothing to match it to. A new variant is created in Variants & Axes, not by adding a row here.`)
            }
            continue
        }
        const label = text(ws.getCell(r, labelCol > 0 ? labelCol : idCol).value).trim()

        const touchedDerived: { field: string; city: string; value: number }[] = []
        const byCity = new Map<string, ImportedCell>()
        const cell = (city: string) => {
            const hit = byCity.get(city)
            if (hit) return hit
            const made: ImportedCell = { cityName: city, tiers: new Map() }
            byCity.set(city, made)
            return made
        }
        // Two rows claiming one variant is unresolvable: applying both means the later
        // silently wins, and there is no way to know which the author meant.
        if (rows.some(x => x.variantId === variantId)) {
            errors.push(`variant_id ${variantId} appears on more than one row (row ${r}). Every row must be a distinct variant.`)
            continue
        }

        targets.forEach((t, c) => {
            const v = num(ws.getCell(r, c).value)
            if (v === undefined) return                       // blank: ignored, never a delete
            const rej = (field: string, reason: string) =>
                rejects.push({ label: label || variantId, cityName: t.city, field, value: v, reason })
            if (t.kind === "sp") {
                // `selling_price` is NOT NULL and a row that exists says "sold, at this" —
                // so 0 or negative is not "unpriced", it is a row that cannot mean anything.
                if (v <= 0) return rej("SP", "A selling price must be above 0. Clear the cell instead — a blank is left alone, and removing a city is done in the app.")
                cell(t.city).sp = v
            } else if (t.kind === "rp") {
                if (v <= 0) return rej("RP", "A retail price must be above 0.")
                cell(t.city).rp = v
            } else if (t.kind === "derived") {
                // Reported, not applied. The value is only interesting because someone typed
                // it — a formula cell that still holds its formula reads back as the computed
                // result and is caught by the equality check at the call site, not here.
                touchedDerived.push({ field: t.what, city: t.city, value: v })
            } else {
                // The file stores 5% as 0.05 (the spreadsheet's percent type). Two decimals
                // matches DECIMAL(5,2), and > 1 is read as someone typing "5" into a
                // percent-formatted cell rather than as a 500% tier.
                const pct = v <= 1 ? v * 100 : v
                // ck_vmbt_pct — CHECK (0 < v <= 100).
                if (!(pct > 0 && pct <= 100)) {
                    return rej(`≥${t.qty}`, `${pct}% is not a discount between 0 and 100. Clear the cell to remove the tier — a 0% tier is not a tier.`)
                }
                cell(t.city).tiers.set(t.qty, Math.round(pct * 100) / 100)
            }
        })

        // retail_price >= selling_price. Checked per city AFTER both are read, because
        // either one alone tells you nothing about the pair.
        byCity.forEach(c => {
            if (c.sp !== undefined && c.rp !== undefined && c.rp < c.sp) {
                rejects.push({
                    label: label || variantId, cityName: c.cityName, field: "RP", value: c.rp,
                    reason: `Retail ${c.rp} is below the selling price ${c.sp}. A was-price under the charged price is not a discount — both are left unchanged.`,
                })
                c.rp = undefined
                c.sp = undefined
            }
        })
        const isPack = /pack of \d+/i.test(label)
        // A pack's RP is `sessions × the base's SP`, so it arrives as a formula and must not
        // be written back — the base is the only place that number is authored.
        if (isPack) byCity.forEach(c => { c.rp = undefined })

        // A derived cell whose value no longer matches what it derives from was EDITED. One
        // that still matches is just the formula's own result arriving as a number, which is
        // every untouched row — reporting those would be noise nobody reads.
        touchedDerived.forEach(d => {
            const c = byCity.get(d.city)
            const expected = d.field === "% off"
                ? (c?.sp !== undefined && c?.rp ? Math.round((1 - c.sp / c.rp) * 10000) / 100 : undefined)
                : (() => {
                    const q = Number(/≥\s*(\d+)/.exec(d.field)?.[1])
                    const pct = c?.tiers.get(q)
                    return pct !== undefined && c?.sp ? Math.round(c.sp * (1 - pct / 100) * 100) / 100 : undefined
                })()
            const shown = d.field === "% off" && d.value <= 1 ? d.value * 100 : d.value
            if (expected === undefined || Math.abs(shown - expected) > 0.01) {
                warnings.push(`${label || variantId} · ${d.city}: "${d.field}" reads ${shown} but works out to ${expected ?? "nothing"}. Derived columns are calculated, not imported — change the SP, RP or tier percent it comes from.`)
            }
        })

        rows.push({
            variantId, label, cells: [...byCity.values()],
            readOnly: {
                sessions: num(cellAt(r, "sessions")),
                baseLabel: text(cellAt(r, "base_variant")).trim() || undefined,
                intervalDays: num(cellAt(r, "interval_days")),
                validityDays: num(cellAt(r, "validity_days")),
                intendedPct: num(cellAt(r, "intended_pct")),
                status: text(cellAt(r, "status")).trim() || undefined,
                axes: Object.fromEntries(
                    identityCols
                        .filter(c => !RESERVED.has(labels[c]))
                        .map(c => [labels[c], text(ws.getCell(r, c).value).trim()])
                        .filter(([, v]) => v !== ""),
                ),
            },
        })
    }

    if (rows.length === 0) errors.push("No data rows found below the header.")
    return { country, thresholds, rows, errors, rejects, warnings }
}
