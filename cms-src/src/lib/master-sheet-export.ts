/**
 * ── Master Sheet → .xlsx ──────────────────────────────────────────────────────
 *
 * The file was a CSV and then had to stop being one. CSV carries values and nothing
 * else: no merged city headers, no colour, no grouping, no frozen panes. The point of
 * this export is that the team opens it and recognises the screen, so the structure IS
 * the deliverable, not decoration on top of it.
 *
 * What each piece of the screen becomes:
 *
 *   sticky header row        → frozen panes below the two header rows
 *   sticky variant column    → frozen panes right of the identity columns
 *   city column group        → a merged city header over its SP / RP / thresholds,
 *                              tinted, with a heavy rule at each city boundary
 *   pack rows indented       → Excel outline grouping, collapsible, one level down
 *   a variant and its packs  → one banded block, alternating tint per base variant
 *   the second line in a cell→ its own column, carrying a LIVE FORMULA
 *
 * ⚠️ DERIVED COLUMNS ARE FORMULAS, NOT VALUES. Every reading the screen computes — the %
 * off, a pack's retail, what a threshold comes to — is written as an Excel formula
 * referring to the cells it derives from. Change an SP in the workbook and its % off,
 * its tier prices and any pack retail built on it all move, exactly as they do on screen.
 *
 * They were baked into each cell's `numFmt` first, which kept the value numeric but made
 * the reading a frozen literal: edit the price and the little "(-16.67%)" beside it went
 * quietly stale, which is worse than not showing it. A formula cannot go stale.
 *
 * Every formula carries a precomputed `result` so viewers that do not recalculate (Google
 * Sheets preview, Numbers' quick look, most mobile viewers) still show the right number.
 *
 * ⚠️ PERCENTS USE EXCEL'S REAL PERCENT TYPE — the cell holds 0.05 and displays 5.00%.
 *
 * They were plain numbers where 5 meant 5%, to match `discount_value`, with the sign
 * supplied by a `0.##"%"` format. That broke on import: Google Sheets reads a quoted `%`
 * in a number format as a PERCENT format, so the 5 rendered as 500% and clicking the cell
 * showed 500%. A literal `%` inside a number format is therefore never used here — the
 * value carries the type and the header says the unit.
 *
 * The consequence to know: a tier cell reads 0.05 in the formula bar where the app and the
 * database both say 5. That is the cost of the file looking right everywhere, and it is
 * only paid because nothing is uploaded back.
 *
 * ⚠️ NO NUMBER FORMAT USES `0.##`. Excel treats the `.` as a literal and prints it even
 * when there are no decimals, which is where `242.` and `10.%` came from. Money uses the
 * country's own minor units instead.
 *
 * ⚠️ TIER COLUMNS CARRY THE STORED PERCENT. `discount_value` has no currency, only a
 * scope, and a percent stays comparable down a column where a price does not — every
 * city charges something different. The money it comes to rides along in the format.
 *
 * One country per workbook: the manager who prices UAE is not the one who prices KSA.
 */

export interface SheetCell {
    cityId: string
    /** `selling_price` — stored, and the cell every formula in this city hangs off. */
    sp?: number
    /** `retail_price`. Stored for a base; for a pack it is the formula's RESULT. */
    rp?: number
    /** % off, from RP vs SP. Formula result only — never stored. */
    offPct?: number
    /** Stored percent per threshold, aligned to `steps`. */
    tiers: (number | undefined)[]
    /** What each threshold comes to. Formula results, aligned to `steps`. */
    tierEach: (number | undefined)[]
}

export interface SheetRow {
    id: string
    label: string
    /** One entry per axis, aligned to `axisNames`. */
    axes: string[]
    sessions?: number
    baseLabel?: string
    intervalDays?: number
    validityDays?: number
    intendedPct?: number
    status: string
    isPack: boolean
    /** For a pack: the id of the variant its retail is N × of, so the formula can point
     *  at that row's SP cell rather than freezing a number copied out of it. */
    baseId?: string
    cells: SheetCell[]
}

export interface SheetSpec {
    country: string
    currency: string
    /** 2 for AED/SAR/QAR, 3 for KWD — decides the money format, so KWD keeps its fils. */
    minorUnits: number
    axisNames: string[]
    cities: { id: string; name: string }[]
    steps: number[]
    rows: SheetRow[]
}

const INK = "FF1F2430"
const MUTED = "FF6B7280"
const RULE = "FFD4D8DE"
const TITLE_BG = "FFE7EAF0"
/** Two tints so neighbouring cities are told apart at a glance, as the FE's rules do. */
const CITY_BG = ["FFE4ECF6", "FFF3EBE3"]
/**
 * Locked columns get a wash of their own, so "grey is not yours to type in" is readable at a
 * glance and does not depend on protection surviving the trip.
 *
 * ⚠️ IT HAS TO BE VISUAL, because it cannot be enforced. Google Sheets DISCARDS xlsx sheet
 * protection on import — a file locked in Excel opens fully editable there. The real
 * guarantee is that the importer ignores these columns and reports when they were changed;
 * this is what stops someone typing into them in the first place.
 */
const LOCK_BG = "FFEDEDEF"

/**
 * A custom validation rule of `FALSE`, which no entry can satisfy.
 *
 * Sheets DOES import xlsx data validation even though it ignores sheet protection, so this is
 * the only mechanism with a real chance of refusing a keystroke there. Paste can still bypass
 * it, and the actual guarantee is still the IMPORT refusing any row whose identity disagrees
 * with the catalogue — this only saves someone the wasted effort of typing.
 */
const NO_ENTRY = (where: string) => ({
    type: "custom" as const,
    allowBlank: false,
    formulae: ["FALSE"],
    showErrorMessage: true,
    errorStyle: "stop" as const,
    errorTitle: "Read-only",
    error: `This column is not imported — edits here are refused on upload. ${where}`,
})
/** Banding per base variant: a variant and its packs read as one block. */
const BAND = [
    { base: "FFFFFFFF", pack: "FFF4F5F7" },
    { base: "FFF7F8FA", pack: "FFEDEEF2" },
]

export async function exportMasterSheet(spec: SheetSpec): Promise<void> {
    const ExcelJS = (await import("exceljs")).default
    const wb = new ExcelJS.Workbook()
    wb.creator = "Valeo Catalogue"
    wb.created = new Date()

    const ws = wb.addWorksheet(spec.country, {
        properties: {
            defaultRowHeight: 16,
            // The summary sits ABOVE its detail: a base variant with its packs grouped
            // under it, which is the order the screen shows and the opposite of Excel's
            // default.
            //
            // ⚠️ MUST be passed here. Assigning `ws.properties.outlineProperties` after the
            // worksheet exists is accepted, reads back correctly, and writes NO <outlinePr>
            // element at all — verified by unzipping the file.
            outlineProperties: { summaryBelow: false, summaryRight: false },
        },
    })

    // ── columns ───────────────────────────────────────────────────────────────
    const idCols = [
        { header: "variant_id", width: 12 },
        { header: "variant", width: 30 },
        ...spec.axisNames.map(n => ({ header: n, width: 15 })),
        { header: "sessions", width: 10 },
        { header: "base_variant", width: 22 },
        /**
         * `interval_days`, `validity_days` and `intended_pct` are KEPT, though read-only and
         * never imported. They were briefly removed on the reasoning that a column nobody can
         * save is only a temptation — which missed that `intended_pct` is the number a pack
         * price is DECIDED against, and that interval and validity are the context for whether
         * a 5-pack earns its discount. Reference is not the same as noise.
         *
         * They are authored in Session Packs, where one pack is one row and there is no
         * question which of nine city lines is the real one.
         */
        { header: "interval_days", width: 14 },
        { header: "validity_days", width: 14 },
        { header: "intended_pct", width: 14 },
        { header: "status", width: 10 },
    ]
    /**
     * Per city: two stored money columns, then the reading, then a stored/derived PAIR per
     * threshold. Splitting them out is what lets each derived one be a formula — a value
     * crammed beside another value can only ever be a frozen literal.
     */
    const measure = [
        { label: "SP", derived: false },
        { label: "RP", derived: false },
        { label: "% off", derived: true },
        ...spec.steps.flatMap(q => [
            { label: `≥${q} %`, derived: false },
            { label: `≥${q} each`, derived: true },
        ]),
    ]
    const perCity = measure.length
    const totalCols = idCols.length + spec.cities.length * perCity

    ws.columns = [
        ...idCols.map(c => ({ width: c.width })),
        ...spec.cities.flatMap(() => measure.map(m => ({ width: m.derived ? 11 : 12 }))),
    ]
    /**
     * Derived columns are one COLUMN outline level down, so the whole workbook collapses to
     * just the stored figures. Splitting the readings out of their cells tripled the width
     * — nine cities at two thresholds is sixty-three measure columns — and this is the
     * price of that being usable: the readings are there when wanted and one click away
     * from gone. `summaryRight: false` puts the toggle to the LEFT of its group, over the
     * column it belongs to.
     */
    measure.forEach((m, mi) => {
        if (!m.derived) return
        spec.cities.forEach((_, ci) => {
            ws.getColumn(idCols.length + ci * perCity + mi + 1).outlineLevel = 1
        })
    })

    const MONEY_FMT = spec.minorUnits > 0
        ? `#,##0.${"0".repeat(spec.minorUnits)}`
        : "#,##0"
    const PCT_FMT = "0.00%"

    /** 1 → "A", 27 → "AA". Formulas need A1 refs; ExcelJS will not build them for us. */
    const col = (n: number) => {
        let s = ""
        while (n > 0) {
            const m = (n - 1) % 26
            s = String.fromCharCode(65 + m) + s
            n = Math.floor((n - 1) / 26)
        }
        return s
    }

    // ── row 1: title — where the country and currency live now they are not columns ──
    ws.mergeCells(1, 1, 1, totalCols)
    const title = ws.getCell(1, 1)
    title.value = `Master Sheet — ${spec.country} (${spec.currency}) — ${new Date().toISOString().slice(0, 10)}`
    title.font = { bold: true, size: 13, color: { argb: INK } }
    title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TITLE_BG } }
    title.alignment = { vertical: "middle" }
    ws.getRow(1).height = 22

    // ── rows 2–3: identity headers span both; each city spans its measures ─────
    idCols.forEach((c, i) => {
        ws.mergeCells(2, i + 1, 3, i + 1)
        const cell = ws.getCell(2, i + 1)
        // The padlock is not decoration: it is the only lock signal that survives every
        // importer, and it sits in the header where it is read before the column is typed in.
        cell.value = `🔒 ${c.header}`
        cell.font = { bold: true, size: 10, color: { argb: MUTED } }
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LOCK_BG } }
        cell.alignment = { vertical: "bottom", wrapText: true }
    })
    spec.cities.forEach((city, ci) => {
        const from = idCols.length + ci * perCity + 1
        ws.mergeCells(2, from, 2, from + perCity - 1)
        const head = ws.getCell(2, from)
        head.value = city.name
        head.font = { bold: true, size: 11, color: { argb: INK } }
        head.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CITY_BG[ci % 2] } }
        head.alignment = { horizontal: "center", vertical: "middle" }
        measure.forEach((m, mi) => {
            const cell = ws.getCell(3, from + mi)
            cell.value = m.label
            // Derived headers are greyed and italic, so what is typed and what is computed
            // are told apart before anyone clicks a cell.
            cell.font = m.derived
                ? { italic: true, size: 9, color: { argb: MUTED } }
                : { bold: true, size: 9, color: { argb: INK } }
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CITY_BG[ci % 2] } }
            cell.alignment = { horizontal: "center" }
        })
    })
    ws.getRow(2).height = 20
    ws.getRow(3).height = 16

    // ── data ──────────────────────────────────────────────────────────────────
    // A pack's retail points at its base's SP CELL, so the row a base landed on has to be
    // known before its packs are written. Bases always precede their packs in `rows`.
    const rowOf = new Map<string, number>()
    let band = -1

    spec.rows.forEach(r => {
        if (!r.isPack) band++
        const tone = BAND[Math.max(band, 0) % 2]
        const bg = r.isPack ? tone.pack : tone.base

        const values: (string | number | null)[] = [
            r.id,
            r.isPack ? `    ${r.label}` : r.label,
            ...r.axes,
            r.sessions ?? null,
            r.baseLabel ?? null,
            r.intervalDays ?? null,
            r.validityDays ?? null,
            r.intendedPct ?? null,
            r.status,
        ]
        const row = ws.addRow(values)
        const n = row.number
        rowOf.set(r.id, n)
        row.height = 16
        // A pack is one outline level under its base, so the block collapses to the base
        // variant — the screen's "Hide packs", per variant and native to Excel.
        if (r.isPack) {
            row.outlineLevel = 1
            // Not the thing that keeps it visible — see OUTLINE_DEPTH below — but stated
            // anyway so nothing downstream has to infer it.
            row.hidden = false
        }

        for (let c = 1; c <= totalCols; c++) {
            const cell = row.getCell(c)
            // Identity columns keep the lock wash through every row, so the boundary between
            // "read this" and "type here" is a vertical edge rather than something you have to
            // remember. Banding resumes at the first money column.
            const locked = c <= idCols.length
            if (locked) {
                cell.dataValidation = NO_ENTRY(
                    ["sessions", "base_variant", "interval_days", "validity_days", "intended_pct"]
                        .includes(idCols[c - 1].header)
                        ? "Set it in Session Packs."
                        : "It identifies the row — a differing value refuses the whole row on upload. Change it in Variants & Axes.")
            }
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: locked ? LOCK_BG : bg } }
            cell.font = { size: 10, color: { argb: locked || r.isPack ? MUTED : INK } }
            cell.border = {
                top: { style: "hair", color: { argb: RULE } },
                bottom: { style: "hair", color: { argb: RULE } },
                left: { style: "hair", color: { argb: RULE } },
                right: { style: "hair", color: { argb: RULE } },
            }
        }

        r.cells.forEach((c, ci) => {
            const from = idCols.length + ci * perCity + 1
            const SP = `${col(from)}${n}`
            const RP = `${col(from + 1)}${n}`
            const baseRow = r.baseId ? rowOf.get(r.baseId) : undefined

            const sp = row.getCell(from)
            sp.value = c.sp ?? null
            sp.numFmt = MONEY_FMT
            sp.alignment = { horizontal: "right" }
            sp.protection = { locked: false }
            /**
             * ⚠️ ONE RULE COVERS TWO. `SP <= RP` is the ordinary "a was-price cannot be
             * under the charged price" — and on a PACK row, RP is `sessions × the base's
             * SP`, so the same comparison is the D-C59 ceiling: a pack cannot cost more
             * than its sessions bought singly.
             *
             * `OR(RP="")` lets an unpriced row stay unpriced rather than demanding a
             * retail before a selling price can be typed.
             */
            sp.dataValidation = {
                type: "custom",
                allowBlank: true,
                formulae: [`AND(${SP}>0,OR(${RP}="",${SP}<=${RP}))`],
                showErrorMessage: true,
                errorStyle: "stop",
                errorTitle: "Selling price",
                error: r.isPack
                    ? `Must be above 0 and at or below RP (${r.sessions} × the base's selling price in this city). A pack cannot cost more than its sessions bought one at a time.`
                    : "Must be above 0 and at or below RP. A retail under the charged price is not a discount.",
            }

            const rp = row.getCell(from + 1)
            if (r.isPack && r.sessions && baseRow !== undefined) {
                // LIVE: N × the base's selling price in this same city. Edit the base and
                // every pack retail built on it follows, which is the D-C59 ceiling
                // expressed as arithmetic rather than as a number copied out of it.
                const baseSP = `${col(from)}${baseRow}`
                rp.value = {
                    formula: `IF(N(${baseSP})=0,"",${r.sessions}*${baseSP})`,
                    result: c.rp ?? "",
                }
                rp.font = { size: 10, color: { argb: MUTED }, italic: true }
                rp.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LOCK_BG } }
                rp.dataValidation = NO_ENTRY(`It is ${r.sessions} × the base's SP in this city — reprice the base.`)
            } else {
                rp.value = c.rp ?? null
                // A base's retail is typed, so it is unlocked and guarded. A pack's is a
                // formula and stays locked — it is authored by repricing the base.
                rp.protection = { locked: false }
                rp.dataValidation = {
                    type: "custom",
                    allowBlank: true,
                    formulae: [`OR(${SP}="",${RP}>=${SP})`],
                    showErrorMessage: true,
                    errorStyle: "stop",
                    errorTitle: "Retail price",
                    error: "Must be at or above SP. A was-price under the charged price is not a discount — leave it blank to strike nothing out.",
                }
            }
            rp.numFmt = MONEY_FMT
            rp.alignment = { horizontal: "right" }

            const off = row.getCell(from + 2)
            // No *100: the percent TYPE scales the display, so the formula returns the
            // fraction it naturally computes.
            off.value = {
                formula: `IF(OR(N(${RP})=0,N(${SP})=0),"",(${RP}-${SP})/${RP})`,
                result: c.offPct !== undefined ? c.offPct / 100 : "",
            }
            off.numFmt = PCT_FMT
            off.font = { size: 9, italic: true, color: { argb: MUTED } }
            off.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LOCK_BG } }
            off.dataValidation = NO_ENTRY("It is calculated from SP and RP — change one of those.")
            off.alignment = { horizontal: "right" }

            spec.steps.forEach((q, qi) => {
                const pctCol = from + 3 + qi * 2
                const pct = row.getCell(pctCol)
                // 5% is stored as 0.05 here — see the percent-type note at the top.
                pct.value = c.tiers[qi] !== undefined ? c.tiers[qi]! / 100 : null
                pct.numFmt = PCT_FMT
                pct.alignment = { horizontal: "right" }
                pct.protection = { locked: false }
                // ck_vmbt_pct — CHECK (0 < v <= 100). Expressed in the percent type's own
                // terms: 0 < v <= 1. Blank is allowed and means no tier at this threshold.
                pct.dataValidation = {
                    type: "decimal",
                    operator: "between",
                    allowBlank: true,
                    formulae: [0.0001, 1],
                    showErrorMessage: true,
                    errorStyle: "stop",
                    errorTitle: `≥${q} discount`,
                    error: "Must be a percent above 0 and at or below 100%. Clear the cell to remove the tier — a 0% tier is not a tier.",
                }

                const PCT = `${col(pctCol)}${n}`
                const each = row.getCell(pctCol + 1)
                each.value = {
                    formula: `IF(OR(N(${SP})=0,N(${PCT})=0),"",${SP}*(1-${PCT}))`,
                    result: c.tierEach[qi] ?? "",
                }
                each.numFmt = MONEY_FMT
                each.font = { size: 9, italic: true, color: { argb: MUTED } }
                each.fill = { type: "pattern", pattern: "solid", fgColor: { argb: LOCK_BG } }
                each.dataValidation = NO_ENTRY(`It is SP less the ≥${q} percent — change either of those.`)
                each.alignment = { horizontal: "right" }
            })

            // A heavy rule where one city ends and the next begins, matching the FE.
            row.getCell(from).border = {
                ...row.getCell(from).border,
                left: { style: "medium", color: { argb: RULE } },
            }
        })
        row.getCell(idCols.length).border = {
            ...row.getCell(idCols.length).border,
            right: { style: "medium", color: { argb: RULE } },
        }
    })

    // Freeze below the headers AND right of the identity columns — the two sticky edges
    // the screen has, which are why it stays readable at nine cities wide.
    ws.views = [{ state: "frozen", xSplit: idCols.length, ySplit: 3, activeCell: "A4" }]

    /**
     * ⚠️ ONE MORE THAN THE DEEPEST LEVEL, and this is the whole reason the session packs
     * kept arriving hidden.
     *
     * ExcelJS derives a row's `collapsed` attribute rather than taking it from you:
     * `outlineLevel >= worksheet.properties.outlineLevelRow`. Packs sit at level 1, so
     * anything at or below 1 — including the default 0 — makes that true and stamps
     * `collapsed="1"` on every pack row. Google Sheets honours it and hides them, so the
     * file shipped without a third of its rows. Setting it to 1 to mean "show level 1"
     * reads correctly and guarantees the bug.
     *
     * Verified by unzipping the output: at 2 the row carries `outlineLevel="1"` and no
     * `collapsed` attribute at all.
     */
    const OUTLINE_DEPTH = 2
    ws.properties.outlineLevelRow = OUTLINE_DEPTH
    // Same derivation, same trap, for the grouped derived columns.
    ws.properties.outlineLevelCol = OUTLINE_DEPTH

    // ── legend ────────────────────────────────────────────────────────────────
    const notes = [
        "",
        "Grey italic columns are FORMULAS — % off, ≥N each, and a pack's RP. Edit an SP and they follow.",
        "A blank SP is a missing product_pricing row — not sold in that city, not a zero.",
        "A pack's RP is N x its base's SP in the same city, so it moves when the base is repriced.",
        "Percent cells use the spreadsheet's percent type: 5% is stored as 0.05 and shown as 5.00%.",
        "Packs are grouped under their base variant — use the outline controls in the left margin.",
        "The derived columns are grouped too: collapse them from the controls above the headers.",
        "GREY cells are read-only: identity columns, the derived readings, and a pack's RP.",
        "Only SP, a base's RP and the tier percents are yours to type in. 0 < SP <= RP, tiers 0 < % <= 100%.",
        "Google Sheets ignores the file's locking, so grey is the signal. Edits to grey cells are NOT imported.",
        "An edited identity column (variant_id, the axes, sessions, base_variant) REFUSES that whole row on",
        "upload — none of its prices are applied. To price a different combination, use its own row.",
    ]
    notes.forEach(text => {
        const row = ws.addRow([text])
        row.getCell(1).font = { size: 9, italic: true, color: { argb: MUTED } }
    })

    /**
     * ⚠️ A GUARDRAIL, NOT A GATE. Protection and validation stop honest mistakes in Excel:
     * they cannot be relied on. Google Sheets drops xlsx sheet protection on import and
     * honours only some validation types, paste overwrites validation in every app, and
     * anyone may unprotect from the menu — the empty password is deliberate so they can.
     *
     * Every rule here is therefore re-checked on upload, where it can actually be enforced.
     * If the two ever disagree, the import is the one that decides.
     */
    await ws.protect("", {
        selectLockedCells: true,
        selectUnlockedCells: true,
        // Left alone on purpose: reading a 70-column sheet means resizing and sorting it.
        formatCells: true,
        formatColumns: true,
        formatRows: true,
        sort: true,
        autoFilter: true,
        // Structure is not editable here, the same as on screen: rows ARE variants and
        // columns ARE cities, and neither is minted in a spreadsheet.
        insertRows: false,
        insertColumns: false,
        deleteRows: false,
        deleteColumns: false,
    })

    const buf = await wb.xlsx.writeBuffer()
    const blob = new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `master-sheet_${spec.country}_${new Date().toISOString().slice(0, 10)}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
}