"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Undo2, AlertTriangle, ChevronDown, ChevronRight, Download, Upload } from "lucide-react"
import {
    City, Country, MultiBuyTier, ProductCityConfig, ProductVariant, RegionalData, VariantOption,
} from "@/types"
import {
    comboLabel, discountFromPrices, retailFor, strandedTiers, variantsAnsweringInactive,
} from "@/lib/catalogue"
import { exportMasterSheet } from "@/lib/master-sheet-export"
import { parseMasterSheet, Reject } from "@/lib/master-sheet-import"
import { MONEY } from "@/lib/composition"
import { NumCell } from "@/components/catalogue/NumCell"

/**
 * ── The master sheet ──────────────────────────────────────────────────────────
 *
 * Everything a priced listing charges for, in one grid, for EDITING a listing that
 * already exists. Built alongside Pricing Sheet / Session Packs / Multi-buy Tiers, not
 * in place of them: those three author STRUCTURE, this edits VALUES.
 *
 *   structure — which axes exist, which packs exist and their sessions/interval, which
 *               ladder steps the country uses. Rare, consequential, needs explaining.
 *   values    — every selling_price, retail_price and discount percent. Frequent,
 *               repetitive, and only judgeable by comparison with its neighbours.
 *
 * So this screen deliberately has NO create or delete controls. You cannot mint a pack
 * or invent a ladder step here, which is what stops a dense grid from being a place
 * structure gets destroyed while tabbing through numbers.
 *
 * ── Why the three fit in one grid at all ──────────────────────────────────────
 *
 * Two of the three share a grain, and the third is at the sheet's own scope:
 *
 *   product_pricing         (variant × city)               → the city band, left
 *   variant_session_packs   (variant)                      → a pack IS a variant, so it
 *                                                            is a ROW, with its own
 *                                                            product_pricing city rows
 *   variant_multi_buy_tiers (variant × country × min_qty)   → the tier band, right
 *
 * A pack is not *like* a priced variant, it IS one (D-C59) — `variant_session_packs` is
 * a PK=FK satellite on a `product_variants` row, so "Pack of 3" already owns one
 * product_pricing row per city exactly as its base does. Listing packs as indented rows
 * is not a design choice about layout; it is what the tables say.
 *
 * ⚠️ TIERS SIT INSIDE THE CITY GROUPS, and did not always. Until D-C63 (2026-08-31)
 * `variant_multi_buy_tiers` had `country_id NOT NULL` and no `city_id`, so they were drawn
 * as a country-wide band on the right and a city cell would have invited a variation the
 * table could not store. The column exists now, and a tier is read at the SAME scope its
 * price row was found at — so for a city-priced product every ladder is a city ladder, and
 * a `≥N` cell belongs beside the SP it discounts.
 *
 * ⚠️ A COUNTRY-SCOPED ROW ON A CITY-PRICED VARIANT IS DEAD, not inherited. Every treatment
 * ladder written before D-C63 is exactly that, so it is reported at the top rather than
 * quietly omitted — the grid cannot show it without pretending it applies somewhere.
 *
 * ⚠️ BLANK IS AMBIGUOUS IN A SPREADSHEET AND MEANINGFUL HERE. D-C29 makes a missing
 * (variant, city) row mean NOT SOLD THERE, so an unpriced cell shows `·` rather than
 * emptiness, and clearing a selling price DELETES the row rather than storing a zero.
 */

/**
 * The one input box every cell uses.
 *
 * ⚠️ THE WIDTH IS FIXED HERE AND MUST STAY THAT WAY. It was `w-full`, which worked only
 * while a fixed-width wrapper supplied the size. With that wrapper gone the inputs had no
 * intrinsic width at all, and an auto-layout table gives such a column nothing — it hands
 * the space to the neighbours that do carry text, so every SP and ≥N box collapsed to a
 * sliver while the `% off` readings beside them looked fine.
 */
const BOX = "w-[68px] rounded border bg-white px-1 py-0.5 text-right tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
/** Same metrics, no interaction — for a derived number that must line up with typed ones. */
const GHOST = "ml-auto w-[68px] rounded border border-transparent px-1 py-0.5 text-right tabular-nums"
/** A reading: never typed, so it carries no box — only the same text inset as one. */
const READ = "ml-auto w-[56px] border border-transparent px-1 py-0.5 text-right text-[10px] italic tabular-nums text-muted-foreground"
/**
 * Two tints, alternating per city. A single heavy rule between blocks was the only thing
 * saying where one city ended, which stops working the moment a city owns more than two
 * columns. Applied to the HEADER only: the body already bands per variant, and a second
 * background there would fight the pack rows for the same pixels.
 */
const CITY_TINT = ["bg-sky-50", "bg-stone-100"]

interface Props {
    variants: ProductVariant[]
    variantOptions: VariantOption[]
    countries: Country[]
    cities: City[]
    cityConfig: ProductCityConfig[]
    onReplaceVariants: (variants: ProductVariant[]) => void
    onGoToCities?: () => void
    onGoToPacks?: () => void
    onGoToTiers?: () => void
}

export function MasterSheet({
    variants, variantOptions, countries, cities, cityConfig,
    onReplaceVariants, onGoToCities, onGoToPacks, onGoToTiers,
}: Props) {
    const [undo, setUndo] = useState<{ label: string; snapshot: ProductVariant[] } | null>(null)
    /**
     * Why a cell refused a value.
     *
     * The tier commit used to `return` on a rejected number, so the cell took nothing and
     * said nothing — indistinguishable from a locked cell, which is what an operator
     * reasonably concludes. Cleared on the next successful commit.
     */
    const [rejection, setRejection] = useState<string | null>(null)
    const setToast = (m: string) => setRejection(m)
    /** ONE COUNTRY AT A TIME — the same ops boundary Pricing Sheet uses, and here it is
     *  load-bearing twice over: the tier band only means anything within one country. */
    const [country, setCountry] = useState<Country | null>(null)
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
    const fileInput = useRef<HTMLInputElement>(null)
    /** A parsed upload waiting to be confirmed. Nothing is written until Apply. */
    const [pending, setPending] = useState<Pending | null>(null)
    /** Readings on by default: they are the reason the grid is readable, not a debug view. */
    const [showReadings, setShowReadings] = useState(true)

    /**
     * Where header rows 2 and 3 stick, MEASURED rather than assumed.
     *
     * They were hard-coded to 28px and 52px, from the `h-7`/`h-6` classes above them. A
     * table cell treats `height` as a MINIMUM — the row takes whatever its tallest cell
     * needs, and the `rowSpan={3}` Variant cell has its own padding pushing into that — so
     * the real heights were bigger than the classes claimed and the rows stuck a few pixels
     * short of each other. The seams showed the body scrolling through, which is what a
     * "gap" in a sticky header always is: two sticky rows that do not tile.
     *
     * A ResizeObserver keeps it right when a city name wraps or the font metrics shift.
     */
    // Measured on a cell that does NOT span rows. Row 1 also holds the `rowSpan={3}`
    // Variant cell, and a <tr> carrying one can report the spanned height rather than its
    // own — which would put row 2 below the whole header instead of below row 1.
    const row1 = useRef<HTMLTableCellElement>(null)
    const row2 = useRef<HTMLTableCellElement>(null)
    const [tops, setTops] = useState<[number, number]>([0, 0])
    useLayoutEffect(() => {
        const measure = () => {
            const h1 = row1.current?.getBoundingClientRect().height ?? 0
            const h2 = row2.current?.getBoundingClientRect().height ?? 0
            setTops(prev => {
                const next: [number, number] = [Math.round(h1), Math.round(h1 + h2)]
                return prev[0] === next[0] && prev[1] === next[1] ? prev : next
            })
        }
        measure()
        if (typeof ResizeObserver === "undefined") return
        const ro = new ResizeObserver(measure)
        if (row1.current) ro.observe(row1.current)
        if (row2.current) ro.observe(row2.current)
        return () => ro.disconnect()
    })

    const commit = (next: ProductVariant[], label: string) => {
        setRejection(null)
        setUndo({ label, snapshot: variants })
        onReplaceVariants(next)
    }

    const inactiveAxis = variantsAnsweringInactive(variants, variantOptions)
    const baseLabel = (v: ProductVariant) =>
        comboLabel(v.optionValues, variantOptions) || v.variantLabelEn || v.nameEn || "Unnamed"
    const label = (v: ProductVariant) =>
        v.sessionPack ? `×${v.sessionPack.sessions}` : baseLabel(v)

    /** City Availability decides where the product is offered — not this screen (D-C48). */
    const offeredCities = (c: Country) => cities.filter(x =>
        x.country === c && cityConfig.some(r => r.cityId === x.id && r.status === "active"))
    const liveCountries = countries.filter(c => offeredCities(c).length > 0)
    const active = country && liveCountries.includes(country) ? country : liveCountries[0]

    // ── Rows ──────────────────────────────────────────────────────────────────
    // Each base, then its packs directly beneath it. A pack whose base has been deleted
    // still has price rows of its own, so it is shown rather than hidden — orphaned, at
    // the end, where it is obvious something needs resolving in Session Packs.
    const allBases = variants.filter(v => !v.sessionPack)
    const allPacks = variants.filter(v => v.sessionPack)
    const packsOf = (baseId: string) => allPacks
        .filter(p => p.sessionPack!.baseVariantId === baseId)
        .sort((a, b) => a.sessionPack!.sessions - b.sessionPack!.sessions)
    const orphans = allPacks.filter(p => !allBases.some(b => b.id === p.sessionPack!.baseVariantId))

    type Row = { v: ProductVariant; base?: ProductVariant; depth: 0 | 1; last?: boolean }
    /**
     * Every row, ignoring collapse — which is VIEW state. Import and export both need it:
     * a hidden pack is still a priced row, and looking one up in the rendered list gave a
     * fallback with no `base`, so `packCeiling` returned undefined and an imported pack
     * price skipped its D-C59 clamp whenever packs happened to be collapsed.
     */
    const allRows: Row[] = []
    allBases.forEach(b => {
        allRows.push({ v: b, depth: 0 })
        packsOf(b.id).forEach(p => allRows.push({ v: p, base: b, depth: 1 }))
    })
    orphans.forEach(p => allRows.push({ v: p, depth: 0 }))

    const rows: Row[] = []
    allBases.forEach(b => {
        const ps = packsOf(b.id)
        rows.push({ v: b, depth: 0, last: ps.length === 0 || collapsed.has(b.id) })
        if (!collapsed.has(b.id)) {
            ps.forEach((p, i) => rows.push({ v: p, base: b, depth: 1, last: i === ps.length - 1 }))
        }
    })
    orphans.forEach(p => rows.push({ v: p, depth: 0, last: true }))

    const rowFor = (v: ProductVariant, cityId: string) => {
        for (const r of v.regionalData ?? []) {
            const hit = r.cityPrices?.find(p => p.cityId === cityId)
            if (hit) return hit
        }
        return undefined
    }

    /**
     * A pack's retail is `sessions × the base's SELLING price` in that same city — the
     * undiscounted cost of buying the visits one at a time, which is exactly what the
     * struck-through number is claiming. It is derived, never typed, so pack rows have
     * half the inputs of a base row.
     *
     * It is also the D-C59 write-time ceiling: a pack selling for MORE than its sessions
     * bought singly is a 422 on the server, so the cell clamps to it here.
     */
    const packCeiling = (r: Row, cityId: string): number | undefined => {
        if (!r.v.sessionPack || !r.base) return undefined
        const single = rowFor(r.base, cityId)?.price
        if (!single || single <= 0) return undefined
        return Math.round(single * r.v.sessionPack.sessions * 100) / 100
    }

    // ── Writes ────────────────────────────────────────────────────────────────

    /** Write or remove one (variant, city) `product_pricing` row. `null` removes it. */
    const writeMoney = (
        v: ProductVariant, c: Country, cityId: string,
        money: { price: number; retailPrice: number } | null,
    ): ProductVariant => {
        const list = [...(v.regionalData ?? [])]
        const i = list.findIndex(r => r.country === c)
        const next = (cp: NonNullable<RegionalData["cityPrices"]>) =>
            money === null
                ? cp.filter(x => x.cityId !== cityId)
                : [...cp.filter(x => x.cityId !== cityId), {
                    cityId, price: money.price, retailPrice: money.retailPrice,
                    discountType: money.retailPrice > money.price ? ("PERCENTAGE" as const) : undefined,
                    discountValue: discountFromPrices(money.retailPrice, money.price, "PERCENTAGE"),
                }]
        if (i === -1) {
            if (!money) return v
            list.push({ country: c, sku: "", zohoId: "", price: 0, isAvailable: true, cityPrices: next([]) })
        } else {
            list[i] = { ...list[i], cityPrices: next(list[i].cityPrices ?? []) }
        }
        return { ...v, regionalData: list }
    }

    /**
     * Set or clear ONE step of a variant's ladder for a country. `null` removes the step,
     * and a ladder left with no steps drops to `undefined` rather than an empty array —
     * no rows in `variant_multi_buy_tiers` for a country IS the off switch (D-C58), so an
     * empty ladder must not read as "tiers, configured, none".
     */
    const writeTier = (
        v: ProductVariant, c: Country, cityId: string, minQty: number, pct: number | null,
    ): ProductVariant => {
        const list = [...(v.regionalData ?? [])]
        const i = list.findIndex(r => r.country === c)
        const step = (cur: MultiBuyTier[]) => {
            // Only this CITY's row at this threshold is touched. Another city's ≥2 is a
            // different row in `variant_multi_buy_tiers` and must survive untouched.
            const without = cur.filter(t => !(t.minQuantity === minQty && t.cityId === cityId))
            return pct === null
                ? without
                : [...without, { minQuantity: minQty, discountPct: pct, cityId }]
                    .sort((a, b) => a.minQuantity - b.minQuantity)
        }
        if (i === -1) {
            if (pct === null) return v
            list.push({ country: c, sku: "", zohoId: "", price: 0, isAvailable: true, multiBuyTiers: step([]) })
        } else {
            const s = step(list[i].multiBuyTiers ?? [])
            list[i] = { ...list[i], multiBuyTiers: s.length ? s : undefined }
        }
        return { ...v, regionalData: list }
    }

    const setCell = (r: Row, c: Country, city: City, raw: string, field: "price" | "retail") => {
        const cur = rowFor(r.v, city.id)
        if (raw === "") {
            if (field === "price") {
                commit(variants.map(x => x.id === r.v.id ? writeMoney(x, c, city.id, null) : x),
                    `${label(r.v)} · ${city.name} removed from sale`)
            } else if (cur) {
                commit(variants.map(x => x.id === r.v.id
                    ? writeMoney(x, c, city.id, { price: cur.price, retailPrice: cur.price }) : x),
                    `${label(r.v)} · ${city.name} retail cleared`)
            }
            return
        }
        const num = Number(raw)
        if (!(num > 0)) return
        const ceiling = packCeiling(r, city.id)
        // The pack ceiling is a server-side 422 (D-C59). Clamping here rather than
        // rejecting keeps the typed intent — you meant "as high as it goes".
        const price = field === "price"
            ? (ceiling !== undefined ? Math.min(num, ceiling) : num)
            : (cur?.price ?? num)
        const retailPrice = r.v.sessionPack
            ? (ceiling ?? price)                       // derived for packs, never typed
            : retailFor(price, field === "retail" ? num : cur?.retailPrice)
        const clamped = field === "price" && ceiling !== undefined && num > ceiling
        commit(variants.map(x => x.id === r.v.id ? writeMoney(x, c, city.id, { price, retailPrice }) : x),
            clamped
                ? `${label(r.v)} · ${city.name} capped at ${ceiling} — a pack cannot cost more than its sessions bought singly`
                : `${label(r.v)} · ${city.name} ${field === "price" ? "price" : "retail"} set`)
    }

    /** Copy the row's first priced city across every other offered city in the country. */
    const fillRow = (r: Row, c: Country) => {
        const cs = offeredCities(c)
        const seed = cs.map(x => rowFor(r.v, x.id)).find(p => p && p.price > 0)
        if (!seed) return
        let out = r.v
        cs.forEach(x => {
            out = writeMoney(out, c, x.id, {
                price: seed.price, retailPrice: seed.retailPrice ?? seed.price,
            })
        })
        commit(variants.map(x => x.id === r.v.id ? out : x),
            `${label(r.v)} filled across ${cs.length} ${c} ${cs.length === 1 ? "city" : "cities"}`)
    }

    /**
     * Seed a pack row from its base, city by city: retail = sessions × that city's single,
     * selling = retail less the pack's `intendedDiscountPct` if it declares one. The
     * intended discount is PROVENANCE, never a stored price (D-C59) — it seeds the number
     * and then the number is the truth, which is why this is a button and not a formula.
     */
    const seedPack = (r: Row, c: Country) => {
        if (!r.v.sessionPack) return
        const off = r.v.sessionPack.intendedDiscountPct
        let out = r.v
        let n = 0
        offeredCities(c).forEach(x => {
            const ceiling = packCeiling(r, x.id)
            if (ceiling === undefined) return          // base not sold there — nothing to derive from
            const price = off ? Math.round(ceiling * (1 - off / 100) * 100) / 100 : ceiling
            out = writeMoney(out, c, x.id, { price, retailPrice: ceiling })
            n++
        })
        if (n === 0) return
        commit(variants.map(x => x.id === r.v.id ? out : x),
            `${baseLabel(r.base!)} ×${r.v.sessionPack.sessions} seeded in ${n} ${c} ${n === 1 ? "city" : "cities"}`
            + (off ? ` at ${off}% off` : " at the linear price"))
    }

    // ── Guards ────────────────────────────────────────────────────────────────

    if (allBases.length === 0 && allPacks.length === 0) {
        return (
            <div className="rounded-lg border-2 border-dashed bg-muted/10 py-10 text-center">
                <p className="text-sm font-medium text-muted-foreground">Nothing to price yet.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Generate variants from the axes first — every row in this sheet is a variant.
                </p>
            </div>
        )
    }

    if (!active) {
        return (
            <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50/60 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-900">No cities offered yet.</p>
                    <p className="mt-0.5 text-[11px] text-amber-900">
                        The columns are the cities this product is offered in, which City Availability
                        decides. Enable the ones you serve and they appear here.
                    </p>
                </div>
                {onGoToCities && (
                    <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={onGoToCities}>
                        City Availability
                    </Button>
                )}
            </div>
        )
    }

    const cs = offeredCities(active)
    const cur = MONEY[active].code

    /**
     * The ladder steps this COUNTRY uses, pooled across every variant. A step becomes a
     * column once any variant has it, so extending it to a second variant is typing a
     * percent into the empty cell rather than rebuilding the ladder — but a step that
     * exists NOWHERE has no column, because minting one is structure and lives in
     * Multi-buy Tiers.
     */
    const steps = Array.from(new Set(
        variants.flatMap(v => (v.regionalData ?? [])
            .filter(r => r.country === active)
            // City-scoped rows only. A country-scoped row is not read at this grain, so
            // giving it a column would draw a discount that does not apply.
            .flatMap(r => (r.multiBuyTiers ?? []).filter(t => t.cityId).map(t => t.minQuantity))),
    )).sort((a, b) => a - b)

    const tierOf = (v: ProductVariant, cityId: string, minQty: number) =>
        (v.regionalData ?? []).find(r => r.country === active)
            ?.multiBuyTiers?.find(t => t.minQuantity === minQty && t.cityId === cityId)?.discountPct

    /** Pre-D-C63 rows: stored country-wide on a variant priced by city, so no longer read. */
    const dead = rows
        .map(r => ({ v: r.v, rows: strandedTiers(r.v, active) }))
        .filter(x => x.rows.length > 0)

    // ── Import ────────────────────────────────────────────────────────────────
    //
    // A round trip, with one hard rule: a BLANK CELL IS IGNORED, never a deletion. D-C29
    // makes an absent (variant, city) row mean NOT SOLD THERE, so "clear the cell" and
    // "pull the product from that market" would be the same keystroke — and a spreadsheet
    // cannot tell a deliberate blank from a stray Backspace or a dragged column. Removing
    // a city stays a UI action, where it is one row, visible and undoable.
    //
    // Nothing is written on upload. The file is parsed into a list of changes, shown, and
    // applied only on Apply — in ONE pass, so the whole import is a single undo step.

    type Change = {
        variantId: string
        label: string
        cityId: string
        cityName: string
        kind: "sp" | "rp" | "tier"
        qty?: number
        from?: number
        to: number
        note?: string
    }
    type Pending = {
        fileName: string
        changes: Change[]
        /** Values that will not be applied, each with a reason. Shown, never swallowed. */
        rejects: Reject[]
        /** Structural faults. Any one of these blocks the whole file. */
        errors: string[]
        warnings: string[]
    }

    const readFile = async (file: File) => {
        const parsed = await parseMasterSheet(file)
        const errors = [...parsed.errors]
        const warnings = [...parsed.warnings]
        const rejects: Reject[] = [...parsed.rejects]
        if (parsed.country && active && parsed.country !== active) {
            // Refused rather than remapped: the columns are city names, and applying KSA's
            // to the UAE tab would reprice a market nobody opened.
            errors.push(`This file is for ${parsed.country}; the open tab is ${active}. Switch tabs or export ${active} again.`)
        }
        // A `≥N` column for a threshold nobody uses would MINT a ladder step, and minting
        // is structure — the same reason this screen has no "+ add a quantity". Refused
        // whole-file rather than per cell, because the column IS the author's intent.
        const unknown = parsed.thresholds.filter(q => !steps.includes(q))
        if (unknown.length > 0) {
            errors.push(`The file has ≥${unknown.join(", ≥")} column${unknown.length === 1 ? "" : "s"}, which ${unknown.length === 1 ? "is" : "are"} not a threshold in use in ${active}. Add the step in Multi-buy Tiers first — a sheet does not create ladders.`)
        }
        // Not one id matches: another listing's file. Every row would be reported as
        // "skipped" while the import claimed success.
        if (errors.length === 0 && !parsed.rows.some(ir => allRows.some(x => x.v.id === ir.variantId))) {
            errors.push("None of the variant_ids in this file belong to this listing. It looks like an export of a different product.")
        }
        const changes: Change[] = []
        if (errors.length === 0 && active) {
            parsed.rows.forEach(ir => {
                const r = allRows.find(x => x.v.id === ir.variantId)
                if (!r) {
                    // A REFUSAL, not a footnote: this row's prices did not apply. Buried in a
                    // collapsed "N skipped" summary, that is indistinguishable from success.
                    rejects.push({
                        label: ir.label || ir.variantId, cityName: "every city",
                        field: "variant_id", value: ir.variantId,
                        reason: "No variant with this id in this listing. Nothing on this row was applied — if the id was edited, re-export rather than repairing it by hand.",
                    })
                    return
                }
                /**
                 * Read-only columns that were EDITED. Not imported — pack settings live one
                 * per pack while the file repeats them on every city line, so nine cities can
                 * disagree and there is no honest winner — but saying nothing is worse. A
                 * manager who retyped a validity period should hear that it did not take,
                 * here, rather than discover it from a customer.
                 */
                const ro = ir.readOnly
                const pk = r.v.sessionPack

                /**
                 * ── the identity checksum ──────────────────────────────────────────
                 *
                 * The sheet is for PRICING. The only legitimate edit in the file is a number
                 * in SP, RP or a tier percent — so if the file's description of a row
                 * disagrees with the app's, the row is not trusted and none of its money is
                 * applied.
                 *
                 * This is the one rule that catches editing an axis (the prices would land on
                 * the variant the id points at, not the one the words now describe) AND
                 * swapping two ids (each row's id then disagrees with its own axes, so both
                 * refuse). Neither needs its own special case.
                 *
                 * Only IDENTIFYING facts count. A variant IS its combination — `axis_signature`
                 * and `uk_variant_axes` — plus, for a pack, its sessions and base. The label is
                 * derived from the axes, and status is not identity at all: making those
                 * refusals would let any unrelated edit in the app invalidate an outstanding
                 * export, and people would stop reading the refusals.
                 */
                const mismatch: string[] = []
                variantOptions.forEach(ax => {
                    const inFile = ro.axes[ax.nameEn]
                    if (!inFile) return
                    const valueId = r.v.optionValues?.[ax.id]
                    const inApp = ax.values.find(x => x.id === valueId)?.valueEn ?? ""
                    if (inFile.toLowerCase() !== inApp.toLowerCase()) {
                        mismatch.push(`${ax.nameEn} reads "${inFile}" but this variant is "${inApp || "unset"}"`)
                    }
                })
                if (ro.sessions !== undefined && ro.sessions !== pk?.sessions) {
                    mismatch.push(`sessions reads ${ro.sessions} but this variant is ${pk?.sessions ?? "not a pack"}`)
                }
                if (ro.baseLabel !== undefined && r.base && ro.baseLabel !== label(r.base)) {
                    mismatch.push(`base_variant reads "${ro.baseLabel}" but this pack is over "${label(r.base)}"`)
                }
                if (mismatch.length > 0) {
                    rejects.push({
                        label: label(r.v), cityName: "every city", field: "identity",
                        value: ir.variantId,
                        reason: `${mismatch.join("; ")}. Nothing on this row was applied. Identity columns are read-only — to price a different combination, use its own row; if the catalogue changed, re-export.`,
                    })
                    return
                }
                // Cosmetic only: the label is DERIVED from the axes, which just matched.
                if (ir.label && ir.label !== label(r.v) + (pk ? ` · pack of ${pk.sessions}` : "")) {
                    warnings.push(`${label(r.v)}: the variant column was edited to "${ir.label}". The label is derived from the axes and is not imported — the axes matched, so the prices were applied.`)
                }
                const stale: [string, unknown, unknown][] = [
                    ["sessions", ro.sessions, pk?.sessions],
                    ["interval_days", ro.intervalDays, pk?.sessionIntervalDays],
                    ["validity_days", ro.validityDays, pk?.validityDays],
                    ["intended_pct", ro.intendedPct, pk?.intendedDiscountPct],
                    ["status", ro.status, r.v.status],
                ]
                stale.forEach(([field, inFile, inApp]) => {
                    if (inFile !== undefined && inFile !== inApp) {
                        warnings.push(`${ir.label}: ${field} reads ${inFile} in the file and ${inApp ?? "nothing"} here. Locked columns are not imported — change it in ${field === "status" ? "Variants & Axes" : "Session Packs"}.`)
                    }
                })

                ir.cells.forEach(c => {
                    const city = cs.find(x => x.name === c.cityName)
                    if (!city) {
                        warnings.push(`${ir.label}: "${c.cityName}" is not a city this product is offered in — skipped.`)
                        return
                    }
                    const cur = rowFor(r.v, city.id)
                    const ceiling = packCeiling(r, city.id)
                    if (c.sp !== undefined) {
                        // D-C59's ceiling. REFUSED, not clamped: charging a different number
                        // than the one someone typed into a price sheet is worse than telling
                        // them the number was wrong.
                        if (ceiling !== undefined && c.sp > ceiling) {
                            rejects.push({
                                label: label(r.v), cityName: city.name, field: "SP", value: c.sp,
                                reason: `Above the ${ceiling} ceiling — ${r.v.sessionPack!.sessions} × the base's ${city.name} selling price. A pack cannot cost more than its sessions bought one at a time.`,
                            })
                        } else if (c.sp !== cur?.price) {
                            changes.push({
                                variantId: r.v.id, label: label(r.v), cityId: city.id, cityName: city.name,
                                kind: "sp", from: cur?.price, to: c.sp,
                            })
                        }
                    }
                    if (c.rp !== undefined) {
                        const from = cur?.retailPrice ?? cur?.price
                        if (c.rp !== from) {
                            changes.push({
                                variantId: r.v.id, label: label(r.v), cityId: city.id, cityName: city.name,
                                kind: "rp", from, to: c.rp,
                            })
                        }
                    }
                    c.tiers.forEach((pct, qty) => {
                        // A percent needs a price to come off, and D-C63 stores the tier at
                        // the scope of that price row — with no row in this city there is no
                        // scope to write to. Same rule that greys the chip in Multi-buy Tiers.
                        const spHere = c.sp ?? cur?.price
                        if (!spHere || spHere <= 0) {
                            rejects.push({
                                label: label(r.v), cityName: city.name, field: `≥${qty}`, value: pct,
                                reason: `Not priced in ${city.name}. A tier is a percent off a price row and is stored at that row's scope, so there is nothing to attach it to.`,
                            })
                            return
                        }
                        const from = tierOf(r.v, city.id, qty)
                        if (pct !== from) {
                            changes.push({
                                variantId: r.v.id, label: label(r.v), cityId: city.id, cityName: city.name,
                                kind: "tier", qty, from, to: pct,
                            })
                        }
                    })
                    // A higher threshold saving LESS can never be reached, since the highest
                    // qualifying one wins (D-C26). Not refused — the DB permits it and someone
                    // may mean it — but it is almost always a transposition.
                    const ladder = [...c.tiers.entries()].sort((a, b) => a[0] - b[0])
                    ladder.forEach(([q, pct], li) => {
                        if (li > 0 && pct < ladder[li - 1][1]) {
                            warnings.push(`${ir.label} · ${city.name}: ≥${q} saves ${pct}% but ≥${ladder[li - 1][0]} already saves ${ladder[li - 1][1]}% — the higher threshold would never be reached.`)
                        }
                    })
                })
            })
        }
        setPending({ fileName: file.name, changes, rejects, errors, warnings })
    }

    /** Apply every change in ONE pass, so the import is a single undo step. */
    const applyPending = () => {
        if (!pending || !active) return
        const byVariant = new Map<string, Change[]>()
        pending.changes.forEach(ch =>
            byVariant.set(ch.variantId, [...(byVariant.get(ch.variantId) ?? []), ch]))

        const next = variants.map(v => {
            const mine = byVariant.get(v.id)
            if (!mine) return v
            let out = v
            // Money first, and per city: SP and RP land on ONE product_pricing row, so they
            // have to be resolved together or the second write reverts the first.
            const cities = new Set(mine.filter(c => c.kind !== "tier").map(c => c.cityId))
            cities.forEach(cityId => {
                const cur = rowFor(out, cityId)
                const sp = mine.find(c => c.cityId === cityId && c.kind === "sp")?.to ?? cur?.price
                if (sp === undefined) return
                const rpChange = mine.find(c => c.cityId === cityId && c.kind === "rp")?.to
                out = writeMoney(out, active, cityId, {
                    price: sp,
                    retailPrice: retailFor(sp, rpChange ?? cur?.retailPrice),
                })
            })
            mine.filter(c => c.kind === "tier").forEach(c => {
                out = writeTier(out, active, c.cityId, c.qty!, c.to)
            })
            return out
        })
        commit(next, `Imported ${pending.changes.length} change${pending.changes.length === 1 ? "" : "s"} from ${pending.fileName}`)
        setPending(null)
    }

    /**
     * ── Export ────────────────────────────────────────────────────────────────
     *
     * This builds the SPEC; `master-sheet-export.ts` turns it into the workbook. It was a
     * CSV twice — long, then pivoted — and the shape was right the second time but the
     * format could not carry it: no merged city headers, no colour, no grouping, no frozen
     * panes. The team is meant to open the file and recognise the screen, so the structure
     * is the deliverable rather than decoration on it.
     *
     * Collapse and Hide packs are VIEW state. A hidden pack is still a priced row, so this
     * walks its own list rather than the one the table happens to be rendering — and packs
     * arrive grouped under their base, which is the same idea expressed in Excel's outline.
     */
    const downloadXlsx = async () => {
        if (!active) return
        const axes = [...variantOptions].sort((a, b) => a.position - b.position)
        await exportMasterSheet({
            country: active,
            currency: cur,
            minorUnits: MONEY[active].minorUnits,
            axisNames: axes.map(a => a.nameEn),
            cities: cs.map(c => ({ id: c.id, name: c.name })),
            steps,
            rows: allRows.map(r => {
                const pack = r.v.sessionPack
                return {
                    id: r.v.id,
                    label: label(r.v) + (pack ? ` · pack of ${pack.sessions}` : ""),
                    axes: axes.map(a => {
                        const valueId = r.v.optionValues?.[a.id]
                        return a.values.find(x => x.id === valueId)?.valueEn ?? ""
                    }),
                    sessions: pack?.sessions,
                    baseLabel: r.base ? label(r.base) : undefined,
                    intervalDays: pack?.sessionIntervalDays,
                    validityDays: pack?.validityDays,
                    intendedPct: pack?.intendedDiscountPct,
                    status: r.v.status,
                    isPack: !!pack,
                    baseId: pack?.baseVariantId,
                    cells: cs.map(city => {
                        const priceRow = rowFor(r.v, city.id)
                        const ceiling = packCeiling(r, city.id)
                        const retail = pack ? ceiling : priceRow?.retailPrice
                        return {
                            cityId: city.id,
                            sp: priceRow?.price,
                            rp: retail,
                            offPct: priceRow
                                ? discountFromPrices(retail, priceRow.price, "PERCENTAGE")
                                : undefined,
                            tiers: steps.map(q => tierOf(r.v, city.id, q)),
                            tierEach: steps.map(q => {
                                const tp = tierOf(r.v, city.id, q)
                                return tp !== undefined && priceRow && priceRow.price > 0
                                    ? Math.round(priceRow.price * (1 - tp / 100) * 100) / 100
                                    : undefined
                            }),
                        }
                    }),
                }
            }),
        })
    }

    /**
     * One city's columns, defined once and consumed by the header AND the body — three
     * header rows and a cell renderer reading two different lists is how a sheet ends up
     * with a `≥3` heading over a `% off` value.
     *
     * `derived` marks a reading: not typed, not stored, and styled so that is obvious
     * before anyone clicks. Hiding them is what keeps the everyday view narrow — at four
     * cities the readings are the difference between 16 and 28 measure columns.
     */
    const measures: {
        key: "sp" | "rp" | "off" | "tier" | "tierPct"
        label: string
        derived: boolean
        qty?: number
        title: (city: string) => string
    }[] = [
        {
            key: "sp", label: "SP", derived: false,
            title: c => `Selling price in ${c} — what is charged (product_pricing.selling_price)`,
        },
        {
            key: "rp", label: "RP", derived: false,
            title: c => `Retail in ${c} — the struck-through was-price. A pack's is derived: sessions × the base's SP`,
        },
        ...(showReadings ? [{
            key: "off" as const, label: "% off", derived: true,
            title: (c: string) => `What ${c}'s SP is off its RP. Read from the pair, never stored`,
        }] : []),
        ...steps.flatMap(q => [
            {
                key: "tier" as const, label: `≥${q}`, derived: false, qty: q,
                title: (c: string) => `What ${c} charges each at ${q} or more. Typed as money, stored as the percent it works out to`,
            },
            ...(showReadings ? [{
                key: "tierPct" as const, label: "% off", derived: true, qty: q,
                title: (c: string) => `The stored discount_value for ≥${q} in ${c}`,
            }] : []),
        ]),
    ]
    const perCity = measures.length

    const priced = rows.reduce((n, r) => n + cs.filter(x => (rowFor(r.v, x.id)?.price ?? 0) > 0).length, 0)
    const packCount = allPacks.length

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex overflow-hidden rounded border">
                    {liveCountries.map(c => {
                        const n = offeredCities(c)
                        const p = rows.reduce((acc, r) =>
                            acc + n.filter(x => (rowFor(r.v, x.id)?.price ?? 0) > 0).length, 0)
                        return (
                            <button key={c} type="button"
                                className={`px-2.5 py-1 text-[11px] ${active === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                                onClick={() => setCountry(c)}>
                                {c} <span className="font-mono opacity-70">{MONEY[c].code}</span>
                                <span className="ml-1 opacity-70">{p}/{rows.length * n.length}</span>
                            </button>
                        )
                    })}
                </div>
                <span className="text-[10px] text-muted-foreground">
                    {rows.length} rows · {priced}/{rows.length * cs.length} priced in {active}
                </span>
                <Button size="sm" variant={showReadings ? "secondary" : "outline"}
                    className="h-6 px-2 text-[10px]"
                    title="The % off and per-tier percent columns. Hiding them halves the width when you only want to type prices."
                    onClick={() => setShowReadings(!showReadings)}>
                    {showReadings ? "Hide readings" : "Show readings"}
                </Button>
                {packCount > 0 && (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
                        onClick={() => setCollapsed(collapsed.size > 0
                            ? new Set()
                            : new Set(allBases.filter(b => packsOf(b.id).length > 0).map(b => b.id)))}>
                        {collapsed.size > 0 ? "Show packs" : "Hide packs"}
                    </Button>
                )}
                <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
                    title={`This table as a workbook, for ${active} only — merged city headers, packs `
                        + `grouped under their base, frozen headers and variant column. Tier columns carry the `
                        + `stored percent. A blank SP is a missing row, i.e. not sold there.`}
                    onClick={downloadXlsx}>
                    <Download className="mr-1 h-3 w-3" /> {active} .xlsx
                </Button>
                {/* CSV/XLSX UPLOAD — REMOVED (commented out, not deleted).
                    The import half of the master sheet is disabled: the Upload
                    button, its file input and the pending-changes review panel
                    are all commented out below. Export (.xlsx download) still
                    works. The parsing code in lib/master-sheet-import.ts is
                    left in place so this can be switched back on by
                    uncommenting these three blocks. */}
                {/*                 <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]"
                    title={`Upload an edited ${active} workbook. Prices and tier percents are read; `
                        + `blanks are ignored, never treated as a deletion. Nothing is written until you confirm.`}
                    onClick={() => fileInput.current?.click()}>
                    <Upload className="mr-1 h-3 w-3" /> Upload
                </Button>
                <input ref={fileInput} type="file" className="hidden"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={e => {
                        const f = e.target.files?.[0]
                        // Cleared so re-picking the SAME file fires onChange again — otherwise
                        // a corrected re-upload of one filename silently does nothing.
                        e.target.value = ""
                        if (f) void readFile(f)
                    }} />
                */}
                {rejection && (
                    <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span className="flex-1">{rejection}</span>
                        <button type="button" className="underline" onClick={() => setRejection(null)}>dismiss</button>
                    </div>
                )}

                {undo && (
                    <Button size="sm" variant="outline" className="ml-auto h-6 px-2 text-[10px]"
                        onClick={() => { onReplaceVariants(undo.snapshot); setUndo(null) }}>
                        <Undo2 className="mr-1 h-3 w-3" /> Undo — {undo.label}
                    </Button>
                )}
            </div>

                {/*             {pending && (
                <div className="rounded-md border-2 border-primary/40 bg-primary/5 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold">{pending.fileName}</span>
                        <span className="text-[11px] text-muted-foreground">
                            {pending.errors.length > 0
                                ? "rejected — the file cannot be applied"
                                : pending.changes.length === 0 && pending.rejects.length === 0
                                    ? "nothing to change — every value already matches"
                                    : `${pending.changes.length} change${pending.changes.length === 1 ? "" : "s"}`}
                        </span>
                        {pending.rejects.length > 0 && pending.errors.length === 0 && (
                            <span className="rounded bg-destructive/10 px-1.5 py-px text-[10px] font-medium text-destructive">
                                {pending.rejects.length} value{pending.rejects.length === 1 ? "" : "s"} refused
                            </span>
                        )}
                        <div className="ml-auto flex gap-2">
                            {pending.errors.length === 0 && pending.changes.length > 0 && (
                                <Button size="sm" className="h-7 text-xs" onClick={applyPending}>
                                    Apply {pending.changes.length}
                                    {pending.rejects.length > 0 && ` of ${pending.changes.length + pending.rejects.length}`}
                                </Button>
                            )}
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => setPending(null)}>
                                {pending.errors.length > 0 || pending.changes.length === 0 ? "Close" : "Discard"}
                            </Button>
                        </div>
                    </div>

                    {pending.errors.map((e, i) => (
                        <p key={i} className="mt-1.5 flex items-start gap-1.5 text-[11px] font-medium text-destructive">
                            <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> {e}
                        </p>
                    ))}

                    {/* ── refused values ───────────────────────────────────────────
                        ABOVE the accepted changes, and never folded into a "N skipped"
                        summary. A refusal means someone typed a number that will not take
                        effect — if that is only discoverable by expanding a details element,
                        they will find out from a customer instead.

                        Refused, not corrected. Clamping a price sheet to a legal value
                        silently charges a different number than the one that was typed. *\/}
                    {pending.rejects.length > 0 && (
                        <div className="mt-2 rounded border border-destructive/40 bg-destructive/5">
                            <p className="border-b border-destructive/20 px-2 py-1 text-[10px] font-semibold text-destructive">
                                {pending.rejects.length} value{pending.rejects.length === 1 ? "" : "s"} will NOT be applied
                            </p>
                            <div className="max-h-40 overflow-auto">
                                <table className="w-full border-collapse text-[10px]">
                                    <tbody>
                                        {pending.rejects.map((rj, i) => (
                                            <tr key={i} className="border-b border-destructive/10 last:border-0">
                                                <td className="px-2 py-0.5 font-medium">{rj.label}</td>
                                                <td className="px-2 py-0.5 text-muted-foreground">{rj.cityName}</td>
                                                <td className="px-2 py-0.5 text-muted-foreground">{rj.field}</td>
                                                <td className="px-2 py-0.5 text-right tabular-nums font-medium">{rj.value}</td>
                                                <td className="px-2 py-0.5 text-destructive">{rj.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Every change, listed. A count alone would ask you to trust an import
                        with the prices — and the one thing a diff is for is being read. *\/}
                    {pending.changes.length > 0 && (
                        <div className="mt-2 max-h-52 overflow-auto rounded border bg-background">
                            <table className="w-full border-collapse text-[10px]">
                                <tbody>
                                    {pending.changes.map((c, i) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="px-2 py-0.5 font-medium">{c.label}</td>
                                            <td className="px-2 py-0.5 text-muted-foreground">{c.cityName}</td>
                                            <td className="px-2 py-0.5 text-muted-foreground">
                                                {c.kind === "tier" ? `≥${c.qty}` : c.kind.toUpperCase()}
                                            </td>
                                            <td className="px-2 py-0.5 text-right tabular-nums text-muted-foreground">
                                                {c.from === undefined ? "—" : c.from}
                                            </td>
                                            <td className="px-1 py-0.5 text-muted-foreground">→</td>
                                            <td className="px-2 py-0.5 text-right font-medium tabular-nums">{c.to}</td>
                                            <td className="px-2 py-0.5 text-amber-700">{c.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {pending.warnings.length > 0 && (
                        <details className="mt-1.5">
                            <summary className="cursor-pointer text-[10px] text-muted-foreground">
                                {pending.warnings.length} row{pending.warnings.length === 1 ? "" : "s"} skipped
                            </summary>
                            <ul className="mt-1 space-y-0.5">
                                {pending.warnings.map((w, i) => (
                                    <li key={i} className="text-[10px] text-muted-foreground">· {w}</li>
                                ))}
                            </ul>
                        </details>
                    )}

                    <p className="mt-2 text-[10px] text-muted-foreground">
                        <strong>Blank cells were ignored, not treated as deletions.</strong> A missing
                        price row is how &ldquo;not sold in that city&rdquo; is said, so removing a
                        city stays a change you make here, where it is one row and undoable. Derived
                        columns (<em>% off</em>, <em>≥N each</em>, a pack&rsquo;s <em>RP</em>) and pack
                        settings are not imported — but if any of them were <em>changed</em> in the file,
                        that is reported above rather than passed over, and so is a row added by hand or a
                        second tab.
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                        Checked on the way in: <strong>SP &gt; 0</strong>, <strong>RP ≥ SP</strong>, a
                        pack&rsquo;s SP at or under <strong>sessions × its base&rsquo;s SP</strong>,
                        tiers <strong>0 &lt; % ≤ 100</strong> (<code>ck_vmbt_pct</code>) and only against a
                        city that has a price. The workbook carries the same rules as cell validation, but
                        Google Sheets drops some of them and paste bypasses all of them — so these are the
                        ones that decide.
                    </p>
                </div>
            )}
                */}

            {dead.length > 0 && (
                <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50/60 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <div className="flex-1">
                        <p className="text-xs font-semibold text-amber-900">
                            {dead.length} variant{dead.length === 1 ? " has" : "s have"} a ladder stored
                            country-wide, which {active}&rsquo;s city prices do not read.
                        </p>
                        <p className="mt-0.5 text-[11px] text-amber-900">
                            A tier is read at the scope its price row was found at, and these are
                            city-priced. Ladders written before 2026-08-31 are all country-scoped, so they need
                            moving onto cities — the grid below cannot show them without implying they apply.
                            {" "}
                            <span className="font-medium">
                                {dead.map(d => label(d.v)).join(", ")}
                            </span>
                        </p>
                    </div>
                    {onGoToTiers && (
                        <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={onGoToTiers}>
                            Move them
                        </Button>
                    )}
                </div>
            )}

            {/* ── the grid ──────────────────────────────────────────────────────
                SINGLE-LINE ROWS. Every derived reading used to sit on a second line inside
                its cell, which cost three rounds of alignment work — a shared width shell, a
                transparent border to match the input's text inset, measured sticky offsets —
                all of it the price of that second line, and it still read like data rather
                than like a note. The readings are columns now, which is also what the
                workbook does, so the screen and the file describe themselves the same way.

                CITY BANDS ARE EXPLICIT. A single `border-r-2` was the only thing saying where
                Dubai ended, which at four cities and seven columns each is not enough. Each
                city carries an alternating tint through its header and a heavy rule down its
                leading edge. */}
            <div className="max-h-[62vh] overflow-auto rounded-md border">
                <table className="border-collapse text-[11px]">
                    <thead>
                        <tr>
                            <th rowSpan={3}
                                className="sticky left-0 top-0 z-30 border-b border-r-2 bg-muted px-2 py-1.5 text-left align-bottom font-medium">
                                Variant
                            </th>
                            <th ref={row1} colSpan={cs.length * perCity + 1}
                                className="sticky top-0 z-20 border-b border-r-2 bg-muted px-2 py-1 text-center font-medium">
                                {active} <span className="font-mono text-[10px] text-muted-foreground">{cur}</span>
                                <span className="ml-1.5 text-[9px] font-normal text-muted-foreground">
                                    per city — product_pricing
                                    {steps.length > 0 && " + variant_multi_buy_tiers"}
                                </span>
                            </th>
                        </tr>
                        <tr>
                            <th ref={row2} style={{ top: tops[0] }}
                                className="sticky z-20 border-b border-l bg-muted px-1 py-1 text-center text-[9px] font-normal text-muted-foreground">
                                all
                            </th>
                            {cs.map((city, i) => (
                                <th key={city.id} colSpan={perCity} style={{ top: tops[0] }}
                                    className={`sticky z-20 border-b border-l-2 border-l-muted-foreground/30 px-2 py-1 text-center font-medium ${CITY_TINT[i % 2]} ${i === cs.length - 1 ? "border-r-2" : ""}`}>
                                    {city.name}
                                </th>
                            ))}
                        </tr>
                        <tr>
                            <th style={{ top: tops[1] }} className="sticky z-20 border-b border-l bg-muted" />
                            {/* `qty` is part of the key because `m.key` is "tier"/"tierPct" for
                                EVERY ladder step. Two thresholds in one country therefore produced
                                DUPLICATE sibling keys, and React could not reconcile the column list
                                across a country switch: header cells from the previous country
                                survived while others vanished, so the labels no longer sat over
                                their data and SP/RP appeared to disappear. */}
                            {cs.flatMap((city, i) => measures.map((m, mi) => (
                                <th key={`${city.id}-${m.key}-${m.qty ?? ""}`} style={{ top: tops[1] }}
                                    title={m.title(city.name)}
                                    className={`sticky z-20 border-b px-1 py-0.5 text-center text-[9px] ${CITY_TINT[i % 2]} ${
                                        mi === 0 ? "border-l-2 border-l-muted-foreground/30" : "border-l border-dashed"} ${
                                        m.derived ? "font-normal italic text-muted-foreground" : "font-semibold text-foreground"} ${
                                        i === cs.length - 1 && mi === measures.length - 1 ? "border-r-2" : ""}`}>
                                    {m.label}
                                </th>
                            )))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => {
                            const pack = r.v.sessionPack
                            const kids = r.depth === 0 ? packsOf(r.v.id) : []
                            const dead = r.v.status === "inactive" || inactiveAxis.includes(r.v.id)
                            return (
                                <tr key={r.v.id}
                                    className={`${r.last ? "border-b-2" : "border-b"} last:border-0 ${pack ? "bg-muted" : ""}`}>
                                    {/* Opaque, not a tint: this cell is sticky, so anything
                                        translucent lets the columns scrolling beneath it show
                                        through — the defect the header had. */}
                                    <td className={`sticky left-0 z-10 whitespace-nowrap border-r-2 px-2 py-1 ${pack ? "bg-muted" : "bg-background"}`}>
                                        {kids.length > 0 && (
                                            <button type="button"
                                                className="mr-1 align-middle text-muted-foreground hover:text-foreground"
                                                title={collapsed.has(r.v.id) ? "Show packs" : "Hide packs"}
                                                onClick={() => {
                                                    const next = new Set(collapsed)
                                                    if (next.has(r.v.id)) next.delete(r.v.id)
                                                    else next.add(r.v.id)
                                                    setCollapsed(next)
                                                }}>
                                                {collapsed.has(r.v.id)
                                                    ? <ChevronRight className="inline h-3 w-3" />
                                                    : <ChevronDown className="inline h-3 w-3" />}
                                            </button>
                                        )}
                                        <span className={r.depth === 1 ? "ml-5 text-muted-foreground" : "font-medium"}>
                                            {label(r.v)}
                                        </span>
                                        {pack && (
                                            <span className="ml-1.5 text-[9px] text-muted-foreground">
                                                {pack.sessions} sessions
                                                {pack.intendedDiscountPct ? ` · ${pack.intendedDiscountPct}% intended` : ""}
                                            </span>
                                        )}
                                        {kids.length > 0 && collapsed.has(r.v.id) && (
                                            <span className="ml-1.5 text-[9px] text-muted-foreground">
                                                +{kids.length} {kids.length === 1 ? "pack" : "packs"}
                                            </span>
                                        )}
                                        {!r.base && pack && (
                                            <span className="ml-1.5 text-[9px] font-medium text-amber-700"
                                                title="This pack's base variant no longer exists — resolve it in Session Packs">
                                                orphaned
                                            </span>
                                        )}
                                        {dead && <span className="ml-1.5 text-[9px] text-muted-foreground">inactive</span>}
                                    </td>

                                    {/* Fill at the FRONT of the city band: with nine cities the one
                                        control that saves the most typing was the one you had to
                                        scroll to find. On a pack it seeds from the base instead. */}
                                    <td className="border-l px-1 py-0.5 text-center">
                                        {pack ? (
                                            <button type="button"
                                                className="rounded border border-primary/40 bg-primary/10 px-1 py-1 text-[9px] font-medium text-primary hover:bg-primary/20 disabled:opacity-40"
                                                disabled={!cs.some(x => packCeiling(r, x.id) !== undefined)}
                                                title={`Set every city from the base: retail = ${pack.sessions} × that city's single`
                                                    + (pack.intendedDiscountPct ? `, selling = ${pack.intendedDiscountPct}% off it` : ", selling = the same")}
                                                onClick={() => seedPack(r, active)}>
                                                = ×{pack.sessions}
                                            </button>
                                        ) : (
                                            <button type="button"
                                                className="rounded border border-primary/40 bg-primary/10 px-1.5 py-1 text-[9px] font-medium text-primary hover:bg-primary/20 disabled:opacity-40"
                                                disabled={!cs.some(x => (rowFor(r.v, x.id)?.price ?? 0) > 0)}
                                                title={`Copy this row's first ${active} price across all ${cs.length} cities`}
                                                onClick={() => fillRow(r, active)}>
                                                fill →
                                            </button>
                                        )}
                                    </td>

                                    {cs.flatMap((city, i) => {
                                        const priceRow = rowFor(r.v, city.id)
                                        const ceiling = packCeiling(r, city.id)
                                        const retail = pack ? ceiling : priceRow?.retailPrice
                                        const off = priceRow
                                            ? discountFromPrices(retail, priceRow.price, "PERCENTAGE")
                                            : undefined
                                        const lastCity = i === cs.length - 1
                                        const edge = (mi: number) =>
                                            `${mi === 0 ? "border-l-2 border-l-muted-foreground/30" : "border-l border-dashed"} ${
                                                lastCity && mi === measures.length - 1 ? "border-r-2" : ""}`
                                        const sp = priceRow?.price

                                        return measures.map((m, mi) => {
                                            const wrap = (inner: React.ReactNode) => (
                                                <td key={`${city.id}-${m.key}-${m.qty ?? ""}`}
                                                    className={`px-0.5 py-0.5 text-right ${edge(mi)}`}>
                                                    {inner}
                                                </td>
                                            )
                                            if (m.key === "sp") {
                                                return wrap(
                                                    <NumCell value={sp} placeholder="·" className={BOX}
                                                        onCommit={raw => setCell(r, active, city, raw, "price")} />)
                                            }
                                            if (m.key === "rp") {
                                                return wrap(pack
                                                    ? (
                                                        /* Derived: sessions × the base's selling price in THIS
                                                           city. Text in an input-shaped box so it lines up with
                                                           the typed retails above and below it. */
                                                        <div className={`${GHOST} text-muted-foreground`}
                                                            title={ceiling !== undefined
                                                                ? `${pack.sessions} × ${Math.round((ceiling / pack.sessions) * 100) / 100} — the base's ${city.name} selling price`
                                                                : `${r.base ? "The base is not sold in " + city.name : "No base variant"} — nothing to derive a retail from`}>
                                                            {ceiling !== undefined ? ceiling : "·"}
                                                        </div>
                                                    )
                                                    : (
                                                        /* A retail EQUAL to the selling price is not an entered
                                                           value — it means nothing is struck out. Shown as a
                                                           number it looked pre-filled, so typing appended to it. */
                                                        <NumCell className={`${BOX} text-muted-foreground`}
                                                            value={priceRow && priceRow.retailPrice !== undefined && priceRow.retailPrice !== priceRow.price
                                                                ? priceRow.retailPrice : undefined}
                                                            placeholder={priceRow ? "same" : "·"}
                                                            onCommit={raw => setCell(r, active, city, raw, "retail")} />
                                                    ))
                                            }
                                            if (m.key === "off") {
                                                return wrap(
                                                    <div className={READ} title={off !== undefined
                                                        ? `${sp} charged against a ${retail} retail`
                                                        : undefined}>
                                                        {off === undefined ? "—" : `−${off}%`}
                                                    </div>)
                                            }
                                            const q = m.qty!
                                            const tp = tierOf(r.v, city.id, q)
                                            const each = tp !== undefined && sp && sp > 0
                                                ? Math.round(sp * (1 - tp / 100) * 100) / 100
                                                : undefined
                                            if (m.key === "tierPct") {
                                                // EDITABLE, because the percent is what the column actually
                                                // stores (discount_value DECIMAL(5,2), percent-only by D-C56).
                                                //
                                                // The ≥N price cell converts a typed price INTO a percent, so a
                                                // price that is not an exact percentage of the row's SP cannot
                                                // round-trip — 240 on a 667.50 pack becomes 64.04% and reads back
                                                // 240.03. Typing the percent here has no such loss: the value
                                                // entered IS the value stored.
                                                if (!(sp && sp > 0)) {
                                                    return wrap(<div className={READ}>{tp === undefined ? "—" : `${tp}% off`}</div>)
                                                }
                                                return wrap(
                                                    <NumCell value={tp} placeholder="—" muted className={BOX}
                                                        title={`The percent is what is stored. ${tp !== undefined ? `≥${q} at ${tp}% off gives ${each}.` : "Type a percent, or type a price in the cell to its left."}`}
                                                        onCommit={raw => {
                                                            if (raw === "") {
                                                                commit(variants.map(x => x.id === r.v.id ? writeTier(x, active, city.id, q, null) : x),
                                                                    `${label(r.v)} · ≥${q} removed in ${city.name}`)
                                                                return
                                                            }
                                                            const pct = Math.round(Number(raw) * 100) / 100
                                                            // ck_vmbt_pct — CHECK (discount_value > 0 AND <= 100).
                                                            if (!(pct > 0) || pct > 100) {
                                                                setToast(`≥${q} needs a percent between 0 and 100 — ${raw} is outside what the column stores.`)
                                                                return
                                                            }
                                                            commit(variants.map(x => x.id === r.v.id ? writeTier(x, active, city.id, q, pct) : x),
                                                                `${label(r.v)} · ≥${q} set to ${pct}% off in ${city.name}`)
                                                        }} />)
                                            }
                                            // ≈ because the stored value is the PERCENT, not this price.
                                            // discount_value is DECIMAL(5,2) — percent-only by D-C56, so a
                                            // ladder applies across AED and SAR without a price per market —
                                            // and 0.01% of a 667.50 pack is ~7 fils. So a typed 240 stores
                                            // 64.04% and reads back 240.03: the remainder has nowhere to live.
                                            // Showing it as an exact figure made that look like a bug in the
                                            // cell rather than the precision of what is stored.
                                            const drifted = each !== undefined && tp !== undefined
                                            return wrap(sp && sp > 0
                                                ? (
                                                    <NumCell value={each} placeholder="—" className={BOX}
                                                        title={drifted
                                                            ? `${tp}% off is what is stored; ${each} is computed from it. A percent has two decimals, so the price it works out to can sit a few fils from the one you typed.`
                                                            : undefined}
                                                        onCommit={raw => {
                                                            if (raw === "") {
                                                                commit(variants.map(x => x.id === r.v.id ? writeTier(x, active, city.id, q, null) : x),
                                                                    `${label(r.v)} · ≥${q} removed in ${city.name}`)
                                                                return
                                                            }
                                                            // At or above the single price it is not a discount, and
                                                            // ck_vmbt_pct — CHECK (0 < v <= 100) — would refuse the
                                                            // row it computes to.
                                                            const target = Number(raw)
                                                            // Was a bare `return`: the cell took nothing and said
                                                            // nothing, which is indistinguishable from a locked
                                                            // cell. A tier is entered as the PRICE at that
                                                            // quantity, so it has to be below this row's own
                                                            // selling price — and on a pack row that price is the
                                                            // pack's, not its base's, which is the easy mistake.
                                                            if (!(target > 0) || target >= sp) {
                                                                setToast(target >= sp
                                                                    ? `≥${q} must be BELOW this row's ${city.name} price of ${sp} — type the discounted price, not a percentage.`
                                                                    : `≥${q} needs a price above 0.`)
                                                                return
                                                            }
                                                            const n = Math.round((1 - target / sp) * 10000) / 100
                                                            if (!(n > 0) || n > 100) {
                                                                setToast(`≥${q} at ${target} works out to ${n}% off, which the column cannot store (0–100%).`)
                                                                return
                                                            }
                                                            commit(variants.map(x => x.id === r.v.id ? writeTier(x, active, city.id, q, n) : x),
                                                                `${label(r.v)} · ≥${q} set to ${target} in ${city.name} (${n}% off)`)
                                                        }} />
                                                )
                                                : (
                                                    <div className={`${GHOST} text-muted-foreground`}
                                                        title={`Not sold in ${city.name} — price it first`}>·</div>
                                                ))
                                        })
                                    })}
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
                <div className="rounded-md border bg-muted/10 p-3 text-[11px] text-muted-foreground">
                    <p className="font-medium text-foreground">What this sheet does not do</p>
                    <p className="mt-1">
                        No pack is created or deleted here, and a <strong>≥N</strong> column exists only
                        because some variant in {active} already uses that threshold in some city. Typing
                        into an empty one extends that threshold to another (variant, city); it cannot
                        invent a new threshold. That is what keeps a dense grid from being somewhere
                        structure gets lost while tabbing.
                    </p>
                    <div className="mt-2 flex gap-2">
                        {onGoToPacks && (
                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={onGoToPacks}>
                                Session Packs
                            </Button>
                        )}
                        {onGoToTiers && (
                            <Button size="sm" variant="outline" className="h-6 px-2 text-[10px]" onClick={onGoToTiers}>
                                Multi-buy Tiers
                            </Button>
                        )}
                    </div>
                </div>
                <div className="rounded-md border bg-muted/10 p-3 text-[11px] text-muted-foreground">
                    <p className="font-medium text-foreground">Reading the grid</p>
                    <p className="mt-1">
                        <strong>·</strong> is a missing <code>product_pricing</code> row, which is how
                        &ldquo;not sold in that city&rdquo; is said — clearing SP deletes the row
                        rather than storing a zero. A pack&rsquo;s <strong>RP</strong> is not typed: it is
                        its sessions × the base&rsquo;s selling price in that same city, and it doubles as
                        the ceiling the server enforces.
                    </p>
                    <p className="mt-1.5">
                        <strong>Every top line is money; the grey line under it is the reading.</strong>{" "}
                        Only one of each pair is stored, and it is not always the one you type. A price row
                        stores its amount, so the <strong>% off</strong> under SP is derived from RP. A tier
                        stores a <em>percent</em> — <code>discount_value</code> has no currency, only a
                        scope — so the amount typed into a <strong>≥N</strong> box is back-computed against
                        that city&rsquo;s SP, and the percent is what persists.
                    </p>
                    <p className="mt-1.5">
                        A <strong>≥N</strong> cell is that city&rsquo;s own tier row, so the same
                        threshold can be worth different percents in different cities — and a blank one is
                        no row, not 0%. A pack carries its own ladder if it has one: the base&rsquo;s never
                        leaks onto it, and that is deliberate.
                    </p>
                </div>
            </div>
        </div>
    )
}
