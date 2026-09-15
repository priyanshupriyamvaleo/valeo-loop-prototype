"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash, AlertTriangle, ChevronRight, Undo2, Layers } from "lucide-react"
import { City, Country, MultiBuyTier, ProductVariant, VariantOption } from "@/types"
import { allTiers, comboLabel, variantsAnsweringInactive } from "@/lib/catalogue"
import { MONEY } from "@/lib/composition"
import { NumCell } from "@/components/catalogue/NumCell"

/**
 * ── Multi-buy tiers ───────────────────────────────────────────────────────────
 *
 * `variant_multi_buy_tiers (variant_id, country_id, city_id, min_qty, discount_value)`.
 *
 * ⚠️ EXACT MATCH, NO FALLBACK — D-C58, widened by D-C63 (2026-08-31) and NOT repealed by it.
 * A tier is read at the same scope the PRICE row was found at: supplements and medicines
 * price by country and carry `city_id IS NULL`; treatments price by city and carry a city.
 * The two never overlap, so there is no resolution rule and nothing inherits.
 *
 * D-C58's actual rule is the part that survived: absence is the off switch. No rows for a
 * country means no tiers there, and now no row for a CITY means none in that city — which
 * is why there is still deliberately no enabled toggle, at either grain. An override chain
 * would have needed a tombstone row meaning "no discount here", which is the
 * `multi_buy_blocked` flag D-C58 refused, under another name.
 *
 * ── A LADDER IS A SET OF THRESHOLDS, NOT A SET OF (threshold, percent) PAIRS ───
 *
 * It was the pairs until 2026-08-31, which was right while a percent was one number per
 * country. Once D-C63 let Dubai charge 5% off and Al Ain 8% off at the same `min_qty`,
 * grouping on the pair split every ladder into one-variant-one-city fragments and the
 * screen stopped having any structure at all.
 *
 * So the ladder is its `min_qty` shape — the thing that is genuinely shared — and the
 * percent is what you tune per city underneath it. That also matches how the rows read:
 * `min_qty` is the ladder, `discount_value` is the number.
 *
 * Three grains, coarsest first, exactly as Session Packs does it:
 *
 *   ladder    — the thresholds, and a percent that writes to EVERY member and city at once
 *   variant   — a summary, and one fill that writes every city of that variant
 *   city      — the individual `variant_multi_buy_tiers` row, edited in place
 *
 * ⚠️ A PACK VARIANT'S LADDER IS ITS OWN (D-C59 governance): "a TIER on a pack variant is
 * permitted and ALWAYS DELIBERATE — tiers are per variant, so the base's ladder never
 * leaks onto its packs". IV's recorded case is "Duo × Pack of 3" (2 × 2,022 × 0.95). So
 * packs are listed apart from bases and are never pre-ticked when a base is tiered.
 *
 * ⚠️ A LADDER STORED AT THE WRONG SCOPE IS DEAD, NOT INHERITED. Every treatment tier written
 * before 2026-08-31 is country-scoped against city-grain prices, so it no longer applies.
 * Those are surfaced in place with a way to move them, never silently dropped.
 *
 * No labels: the table has no label column and `translations.entity_type` has no tier
 * value, so "Buy 2, save 5%" renders from `min_qty` and `discount_value`, where it cannot
 * disagree with them.
 */

interface Props {
    variants: ProductVariant[]
    variantOptions: VariantOption[]
    countries: Country[]
    /** Needed to name a city in the per-city breakdown. */
    cities: City[]
    onReplaceVariants: (variants: ProductVariant[]) => void
}

const money = (n?: number) => (n === undefined ? "—" : n.toLocaleString())
/** A ladder's identity: its thresholds, ascending. Percents are deliberately not in it. */
const qtyKey = (qs: number[]) => [...new Set(qs)].sort((a, b) => a - b).join("|")
/** `cityPricesOf` uses "" for the country row; the stored column uses undefined. */
const scopeOf = (cityId: string) => (cityId === "" ? undefined : cityId)

export function MultiBuyTiers({ variants, variantOptions, countries, cities, onReplaceVariants }: Props) {
    const [openCountry, setOpenCountry] = useState<Country | null>(countries[0] ?? null)
    const [undo, setUndo] = useState<{ label: string; snapshot: ProductVariant[] } | null>(null)
    /** The ladder being composed, per country. Nothing is written until Create. */
    const [draft, setDraft] = useState<Record<string, { qty: string; pct: string; ids: string[] }>>({})

    const commit = (next: ProductVariant[], label: string) => {
        setUndo({ label, snapshot: variants })
        onReplaceVariants(next)
    }

    const inactiveAxis = variantsAnsweringInactive(variants, variantOptions)
    const sellable = variants.filter(v => !inactiveAxis.includes(v.id))
    const bases = sellable.filter(v => !v.sessionPack)
    const packs = sellable.filter(v => v.sessionPack)

    const label = (v: ProductVariant) => {
        const base = comboLabel(v.optionValues, variantOptions) || v.variantLabelEn || v.nameEn || "Unnamed"
        return v.sessionPack ? `${base} · pack of ${v.sessionPack.sessions}` : base
    }

    /**
     * Every priced city for a variant in one country. A tier is a PERCENT, so it lands on
     * whatever each city charges — a variant at 250 in Dubai and 300 in Al Ain discounts
     * to two different numbers. Showing one figure (this used to take the MINIMUM) made
     * the readout true in one city and wrong in the rest.
     *
     * Health Products price at country grain, so they come back as a single row with an
     * empty city id — which is also the scope their tier rows must use. The two grains
     * therefore render through one code path instead of two.
     */
    const cityPricesOf = (v: ProductVariant, c: Country) => {
        const r = (v.regionalData ?? []).find(x => x.country === c)
        const cp = (r?.cityPrices ?? []).filter(x => x.price > 0)
        if (cp.length > 0) {
            return cp.map(x => ({
                cityId: x.cityId,
                name: cities.find(y => y.id === x.cityId)?.name ?? x.cityId,
                price: x.price,
            })).sort((a, b) => a.price - b.price)
        }
        return r?.price ? [{ cityId: "", name: c as string, price: r.price }] : []
    }
    const priceOf = (v: ProductVariant, c: Country) => {
        const cp = cityPricesOf(v, c)
        return cp.length > 0 ? cp[0].price : undefined
    }
    const thresholdsOf = (v: ProductVariant, c: Country) =>
        [...new Set(allTiers(v, c).map(t => t.minQuantity))].sort((a, b) => a - b)
    const pctAt = (v: ProductVariant, c: Country, cityId: string, qty: number) =>
        allTiers(v, c).find(t => t.minQuantity === qty && t.cityId === scopeOf(cityId))?.discountPct

    // ── writes ────────────────────────────────────────────────────────────────
    //
    // All three grains funnel through ONE writer taking an explicit list of (variant,
    // city, qty) cells. Two writes in one tick would both read this render's `variants`
    // and the second would discard the first — the bug that made "Fill at 10% off" fill
    // only the last city — so a bulk action must be one call, never a loop of calls.

    type Cell = { variantId: string; cityId: string; qty: number }

    /**
     * Set or clear a set of cells. `pct === null` deletes those rows; a function resolves
     * the percent per cell, which is what lets one call write a whole ladder whose
     * thresholds carry DIFFERENT percents — necessary because a second call in the same
     * tick would read this render's `variants` and discard the first.
     */
    const writeCells = (
        cells: Cell[], c: Country, pct: number | null | ((cell: Cell) => number), note: string,
    ) => {
        const byVariant = new Map<string, Cell[]>()
        cells.forEach(x => byVariant.set(x.variantId, [...(byVariant.get(x.variantId) ?? []), x]))
        commit(variants.map(v => {
            const mine = byVariant.get(v.id)
            if (!mine) return v
            const rows = [...(v.regionalData ?? [])]
            const i = rows.findIndex(r => r.country === c)
            const existing = i === -1 ? [] : (rows[i].multiBuyTiers ?? [])
            const hit = (t: MultiBuyTier) =>
                mine.some(m => m.qty === t.minQuantity && scopeOf(m.cityId) === t.cityId)
            const kept = existing.filter(t => !hit(t))
            const added = pct === null ? [] : mine.map(m => ({
                minQuantity: m.qty,
                discountPct: typeof pct === "function" ? pct(m) : pct,
                cityId: scopeOf(m.cityId),
            }))
            const next = [...kept, ...added].sort((a, b) => a.minQuantity - b.minQuantity)
            if (i === -1) {
                if (next.length === 0) return v
                rows.push({ country: c, sku: "", zohoId: "", price: 0, isAvailable: true, multiBuyTiers: next })
            } else {
                // An EMPTY ladder must not persist as []: no rows is the off switch (D-C58),
                // so "tiers, configured, none" has to stay unrepresentable.
                rows[i] = { ...rows[i], multiBuyTiers: next.length ? next : undefined }
            }
            return { ...v, regionalData: rows }
        }), note)
    }

    /**
     * Remove every row at these thresholds, whatever scope it is stored at.
     *
     * Deliberately NOT built on `cellsFor`: that enumerates a variant's PRICED scopes, and
     * a ladder can outlive the prices it was written against — a stranded pre-D-C63 row, or
     * a variant whose city prices were cleared. Removal that depends on the prices would
     * silently do nothing on exactly the rows most in need of deleting.
     */
    const clearSteps = (ids: string[], c: Country, qtys: number[], note: string) =>
        commit(variants.map(v => {
            if (!ids.includes(v.id)) return v
            const rows = [...(v.regionalData ?? [])]
            const i = rows.findIndex(r => r.country === c)
            if (i === -1) return v
            const next = (rows[i].multiBuyTiers ?? []).filter(t => !qtys.includes(t.minQuantity))
            rows[i] = { ...rows[i], multiBuyTiers: next.length ? next : undefined }
            return { ...v, regionalData: rows }
        }), note)

    /** Every cell of a threshold across a set of variants — each in its own priced scopes. */
    const cellsFor = (ids: string[], c: Country, qtys: number[]): Cell[] =>
        ids.flatMap(id => {
            const v = sellable.find(x => x.id === id)
            if (!v) return []
            return cityPricesOf(v, c).flatMap(cp =>
                qtys.map(q => ({ variantId: id, cityId: cp.cityId, qty: q })))
        })

    /** Move a threshold — rewrite `min_qty` on every row of it, keeping each percent. */
    const renameStep = (ids: string[], c: Country, from: number, to: number, note: string) =>
        commit(variants.map(v => {
            if (!ids.includes(v.id)) return v
            const rows = [...(v.regionalData ?? [])]
            const i = rows.findIndex(r => r.country === c)
            if (i === -1) return v
            const cur = rows[i].multiBuyTiers ?? []
            // uk_vmbt makes two rows at one (variant, scope, min_qty) unrepresentable —
            // refuse the collision here rather than on save.
            if (cur.some(t => t.minQuantity === to)) return v
            rows[i] = {
                ...rows[i],
                multiBuyTiers: cur.map(t => t.minQuantity === from ? { ...t, minQuantity: to } : t)
                    .sort((a, b) => a.minQuantity - b.minQuantity),
            }
            return { ...v, regionalData: rows }
        }), note)

    /**
     * Rehome country-scoped rows onto every priced city, in ONE pass. Two calls would
     * lose the first; and a country row left behind would be a second home for the same
     * fact, which is the drift D-C63 exists to prevent.
     */
    const moveToCities = (ids: string[], c: Country, note: string) =>
        commit(variants.map(v => {
            if (!ids.includes(v.id)) return v
            const rows = [...(v.regionalData ?? [])]
            const i = rows.findIndex(r => r.country === c)
            if (i === -1) return v
            const cur = rows[i].multiBuyTiers ?? []
            const cityIds = cityPricesOf(v, c).map(x => x.cityId).filter(Boolean)
            if (cityIds.length === 0) return v
            const orphaned = cur.filter(t => t.cityId === undefined)
            const moved = orphaned.flatMap(t => cityIds.map(cid => ({ ...t, cityId: cid })))
            rows[i] = {
                ...rows[i],
                multiBuyTiers: [...cur.filter(t => t.cityId !== undefined), ...moved]
                    .sort((a, b) => a.minQuantity - b.minQuantity),
            }
            return { ...v, regionalData: rows }
        }), note)

    if (countries.length === 0) {
        return (
            <div className="rounded-md border border-amber-200 bg-amber-50/60 p-3 text-[11px] text-amber-900">
                No countries configured. A tier belongs to one market, so there is nowhere to put
                one yet.
            </div>
        )
    }

    return (
        <div className="space-y-3">
            {undo && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5">
                    <span className="text-[11px] text-muted-foreground">{undo.label}</span>
                    <Button size="sm" variant="outline" className="ml-auto h-6 px-2 text-[10px]"
                        onClick={() => { onReplaceVariants(undo.snapshot); setUndo(null) }}>
                        <Undo2 className="mr-1 h-3 w-3" /> Undo
                    </Button>
                </div>
            )}

            {countries.map(country => {
                const isOpen = openCountry === country
                const cur = MONEY[country].code

                // Ladders are the distinct THRESHOLD SETS in use, each with its members.
                // Percents live per (variant, city) underneath and are not part of the key.
                const groups = new Map<string, { qtys: number[]; ids: string[] }>()
                sellable.forEach(v => {
                    const qs = thresholdsOf(v, country)
                    if (qs.length === 0) return
                    const k = qtyKey(qs)
                    const e = groups.get(k)
                    if (e) e.ids.push(v.id)
                    else groups.set(k, { qtys: qs, ids: [v.id] })
                })
                const ladders = [...groups.values()]
                const tiered = new Set(ladders.flatMap(l => l.ids))

                return (
                    <Card key={country}>
                        <CardHeader className="cursor-pointer py-2.5"
                            onClick={() => setOpenCountry(isOpen ? null : country)}>
                            <div className="flex items-center gap-2">
                                <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                                <CardTitle className="text-sm">{country}</CardTitle>
                                <span className="rounded bg-muted px-1.5 py-px font-mono text-[10px]">{cur}</span>
                                <span className="ml-auto text-[11px] text-muted-foreground">
                                    {ladders.length === 0
                                        ? "no tiers — quantity is priced flat here"
                                        : `${ladders.length} ladder${ladders.length === 1 ? "" : "s"} · ${tiered.size} of ${sellable.length} variants`}
                                </span>
                            </div>
                        </CardHeader>

                        {isOpen && (
                            <CardContent className="space-y-3 pt-0">
                                {ladders.map((l, li) => {
                                    const qtys = l.qtys
                                    /** The percent at a threshold across every member and scope —
                                     *  a number when they all agree, `"mixed"` when they do not. */
                                    const commonPct = (q: number): number | "mixed" | undefined => {
                                        const seen = new Set<number>()
                                        let missing = false
                                        l.ids.forEach(id => {
                                            const v = sellable.find(x => x.id === id)
                                            if (!v) return
                                            const scopes = cityPricesOf(v, country)
                                            if (scopes.length === 0) missing = true
                                            scopes.forEach(cp => {
                                                const p = pctAt(v, country, cp.cityId, q)
                                                if (p === undefined) missing = true
                                                else seen.add(p)
                                            })
                                        })
                                        if (seen.size === 0) return undefined
                                        return seen.size === 1 && !missing ? [...seen][0] : "mixed"
                                    }
                                    // Members priced by city but still storing a country row: the
                                    // pre-D-C63 shape, which no longer applies to anything.
                                    const strandedIds = l.ids.filter(id => {
                                        const v = sellable.find(x => x.id === id)
                                        if (!v) return false
                                        const hasCity = cityPricesOf(v, country).some(x => x.cityId !== "")
                                        return hasCity && allTiers(v, country).some(t => t.cityId === undefined)
                                    })

                                    return (
                                        <div key={li} className="rounded-md border p-2.5">
                                            {/* ── the ladder: its thresholds ───────────────── */}
                                            <div className="flex flex-wrap items-center gap-2">
                                                {qtys.map(q => {
                                                    const common = commonPct(q)
                                                    return (
                                                        <span key={q} className="flex items-center gap-1 rounded border bg-muted/30 px-1.5 py-1">
                                                            <span className="text-[10px] text-muted-foreground">buy</span>
                                                            <NumCell value={q}
                                                                className="h-6 w-14 rounded border bg-white px-1 text-right text-xs tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                                                                onCommit={raw => {
                                                                    // ck_vmbt_qty — CHECK (min_qty >= 2).
                                                                    const to = Math.max(2, Number(raw) || 2)
                                                                    if (to === q) return
                                                                    renameStep(l.ids, country, q, to,
                                                                        `Threshold moved from ${q} to ${to} on ${l.ids.length} variant${l.ids.length === 1 ? "" : "s"}`)
                                                                }} />
                                                            <span className="text-[10px] text-muted-foreground">→</span>
                                                            {/* The GROUP percent. It shows one number only when
                                                                every member and every city agree; otherwise it
                                                                reads "mixed" and typing overwrites them all,
                                                                which is stated rather than implied. */}
                                                            <NumCell
                                                                value={typeof common === "number" ? common : undefined}
                                                                placeholder={common === "mixed" ? "mixed" : "—"}
                                                                className={`h-6 w-16 rounded border bg-white px-1 text-right text-xs tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 ${common === "mixed" ? "placeholder:text-amber-700" : ""}`}
                                                                onCommit={txt => {
                                                                    if (txt === "") {
                                                                        clearSteps(l.ids, country, [q],
                                                                            `Removed the buy-${q} threshold everywhere on this ladder`)
                                                                        return
                                                                    }
                                                                    // ck_vmbt_pct — CHECK (0 < v <= 100). Checked on
                                                                    // COMMIT: rejecting per keystroke made "0.5"
                                                                    // impossible, since it is refused at "0".
                                                                    const raw = Number(txt)
                                                                    if (!(raw > 0 && raw <= 100)) return
                                                                    writeCells(cellsFor(l.ids, country, [q]), country, raw,
                                                                        `buy-${q} set to ${raw}% on every city of ${l.ids.length} variant${l.ids.length === 1 ? "" : "s"}`)
                                                                }} />
                                                            <span className="text-[10px] text-muted-foreground">%</span>
                                                            <button type="button" className="text-muted-foreground hover:text-destructive"
                                                                title={`Remove the buy-${q} threshold from this ladder entirely`}
                                                                onClick={() => clearSteps(l.ids, country, [q],
                                                                    `Removed the buy-${q} step`)}>×</button>
                                                        </span>
                                                    )
                                                })}
                                                {/* "step" was jargon. What it adds is another
                                                    quantity threshold on the same ladder — buy 2 save
                                                    5%, buy 4 save 10% — which is what makes it a
                                                    ladder rather than a single discount. */}
                                                <Button size="sm" variant="outline" className="h-7 text-[10px]"
                                                    title={`Another "buy N, save M%" on this ladder — e.g. buy ${Math.max(...qtys) + 1} for a bigger discount`}
                                                    onClick={() => {
                                                        const next = Math.max(...qtys) + 1
                                                        const tops = qtys.map(commonPct).filter((x): x is number => typeof x === "number")
                                                        // Seed a bigger discount than the step below it: a ladder
                                                        // whose higher threshold saves LESS would never be reached,
                                                        // since the highest qualifying threshold wins (D-C26).
                                                        const seed = Math.min((tops.length ? Math.max(...tops) : 5) + 5, 100)
                                                        writeCells(cellsFor(l.ids, country, [next]), country, seed,
                                                            `Added a buy-${next} threshold at ${seed}%`)
                                                    }}>
                                                    <Plus className="mr-1 h-3 w-3" /> add a quantity
                                                </Button>
                                                <Button variant="ghost" size="sm"
                                                    className="ml-auto h-7 px-2 text-[10px] text-destructive"
                                                    onClick={() => clearSteps(l.ids, country, qtys,
                                                        `Removed the ladder from ${l.ids.length} variant${l.ids.length === 1 ? "" : "s"}`)}>
                                                    <Trash className="mr-1 h-3 w-3" /> Delete ladder
                                                </Button>
                                            </div>
                                            <p className="mt-1 text-[10px] text-muted-foreground">
                                                Buy {qtys[0]} or more, save {(() => { const c0 = commonPct(qtys[0]); return typeof c0 === "number" ? `${c0}%` : "a percent that differs by city" })()}.
                                                {qtys.length > 1 && " Add quantities for bigger discounts higher up."}{" "}
                                                The highest quantity at or below what is in the cart wins. The
                                                label is derived from these numbers, never stored.
                                            </p>

                                            {strandedIds.length > 0 && (
                                                <div className="mt-2 flex items-start gap-2 rounded border border-amber-300 bg-amber-50/60 px-2 py-1.5">
                                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                                                    <p className="flex-1 text-[10px] text-amber-900">
                                                        <strong>{strandedIds.length} member{strandedIds.length === 1 ? "" : "s"}</strong> still
                                                        store this ladder country-wide while being priced by city, so it is not read
                                                        at all. Every ladder written before 2026-08-31 looks like this — it is
                                                        shown rather than deleted, because dropping rows that used to affect money is
                                                        worse than surfacing them.
                                                    </p>
                                                    <Button size="sm" variant="outline" className="h-6 shrink-0 px-2 text-[10px]"
                                                        onClick={() => moveToCities(strandedIds, country,
                                                            `Moved ${strandedIds.length} ladder${strandedIds.length === 1 ? "" : "s"} onto their cities`)}>
                                                        Move onto cities
                                                    </Button>
                                                </div>
                                            )}

                                            {/* ── the members, as a sheet ───────────────────────
                                                Rows are the ladder's members, columns are the cities
                                                they are priced in, and each city carries one
                                                sub-column per threshold — the same shape as the
                                                Master Sheet's tier band, scoped to one ladder.

                                                It was a collapsible block per variant opening to a
                                                line per city, so comparing what ≥2 costs in Dubai
                                                against Al Ain meant opening two blocks and scrolling
                                                between them. A percent is only judgeable next to the
                                                money it makes in each city, and that is the whole
                                                reason D-C63 exists.

                                                A tier stores ONLY a percent — `discount_value` is
                                                "PERCENT, so it needs no currency, only a scope", and
                                                there is no amount column. So the box takes MONEY and
                                                back-computes: you type what N+ should cost in that
                                                city and the percent it produces is what persists. */}
                                            {(() => {
                                                const cols = (() => {
                                                    const seen = new Map<string, string>()
                                                    l.ids.forEach(id => {
                                                        const v = sellable.find(x => x.id === id)
                                                        if (v) cityPricesOf(v, country).forEach(cp => seen.set(cp.cityId, cp.name))
                                                    })
                                                    return [...seen.entries()].map(([cityId, name]) => ({ cityId, name }))
                                                })()
                                                if (cols.length === 0) {
                                                    return (
                                                        <p className="mt-2 rounded border border-dashed p-2.5 text-[10px] text-muted-foreground">
                                                            None of these is priced in {country} yet. A tier is a percent off a
                                                            price row and is stored at that row&rsquo;s scope, so there
                                                            is nothing to attach one to.
                                                        </p>
                                                    )
                                                }
                                                return (
                                                    <div className="mt-2 max-h-[46vh] overflow-auto rounded border">
                                                        <table className="border-collapse text-[11px]">
                                                            <thead>
                                                                <tr>
                                                                    <th rowSpan={2}
                                                                        className="sticky left-0 top-0 z-30 border-b border-r-2 bg-muted px-2 py-1 text-left align-bottom font-medium">
                                                                        Variant
                                                                    </th>
                                                                    <th rowSpan={2}
                                                                        className="sticky top-0 z-20 border-b border-r-2 bg-muted px-1 py-1 text-center text-[9px] font-normal align-bottom text-muted-foreground">
                                                                        all
                                                                    </th>
                                                                    {cols.map((c, i) => (
                                                                        <th key={c.cityId || "country"} colSpan={qtys.length}
                                                                            className={`sticky top-0 z-20 border-b border-l bg-muted px-2 py-1 text-center font-normal text-muted-foreground ${i === cols.length - 1 ? "border-r-2" : ""}`}>
                                                                            {c.name}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                                <tr>
                                                                    {cols.flatMap((c, i) => qtys.map((q, qi) => (
                                                                        <th key={`${c.cityId}-${q}`}
                                                                            title={`What ${c.name} charges each at ${q} or more — typed as money, stored as the percent it works out to`}
                                                                            className={`sticky top-6 z-20 border-b border-l border-dashed bg-muted px-1 py-0.5 text-center text-[9px] font-medium text-muted-foreground ${i === cols.length - 1 && qi === qtys.length - 1 ? "border-r-2" : ""}`}>
                                                                            ≥{q}
                                                                        </th>
                                                                    )))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {l.ids.map(id => {
                                                                    const v = sellable.find(x => x.id === id)
                                                                    if (!v) return null
                                                                    const priceIn = (cityId: string) =>
                                                                        cityPricesOf(v, country).find(x => x.cityId === cityId)?.price
                                                                    return (
                                                                        <tr key={id} className="border-b last:border-0">
                                                                            <td className="sticky left-0 z-10 whitespace-nowrap border-r-2 bg-background px-2 py-1 font-medium">
                                                                                {label(v)}
                                                                            </td>
                                                                            <td className="border-r-2 px-1 py-0.5 text-center">
                                                                                <button type="button"
                                                                                    className="rounded border border-primary/40 bg-primary/10 px-1.5 py-1 text-[9px] font-medium text-primary hover:bg-primary/20 disabled:opacity-40"
                                                                                    disabled={!qtys.some(q => cols.some(c => pctAt(v, country, c.cityId, q) !== undefined))}
                                                                                    title="Copy each threshold's first percent across every city on this row"
                                                                                    onClick={() => {
                                                                                        // One call: a per-cell resolver keeps each
                                                                                        // threshold at its own percent. A loop would
                                                                                        // write ≥2 then ≥3 off the same stale
                                                                                        // `variants` and only the last would land.
                                                                                        const seed = new Map<number, number>()
                                                                                        qtys.forEach(q => {
                                                                                            const first = cols.map(c => pctAt(v, country, c.cityId, q))
                                                                                                .find(x => x !== undefined)
                                                                                            if (first !== undefined) seed.set(q, first)
                                                                                        })
                                                                                        const use = qtys.filter(q => seed.has(q))
                                                                                        if (use.length === 0) return
                                                                                        writeCells(cellsFor([id], country, use), country,
                                                                                            cell => seed.get(cell.qty)!,
                                                                                            `${label(v)} filled across ${cols.length} ${cols.length === 1 ? "row" : "cities"}`)
                                                                                    }}>
                                                                                    fill →
                                                                                </button>
                                                                            </td>
                                                                            {cols.flatMap((c, i) => qtys.map((q, qi) => {
                                                                                const unit = priceIn(c.cityId)
                                                                                const pct = pctAt(v, country, c.cityId, q)
                                                                                const each = pct !== undefined && unit
                                                                                    ? Math.round(unit * (1 - pct / 100) * 100) / 100
                                                                                    : undefined
                                                                                const edge = i === cols.length - 1 && qi === qtys.length - 1
                                                                                return (
                                                                                    <td key={`${c.cityId}-${q}`}
                                                                                        className={`border-l border-dashed px-0.5 py-0.5 text-right align-top ${edge ? "border-r-2" : ""}`}>
                                                                                        <div className="ml-auto w-16"
                                                                                            title={each !== undefined
                                                                                                ? `${q}+ at ${each} ${cur} each in ${c.name} — ${pct}% off ${unit}`
                                                                                                : unit ? `What ${q}+ should cost in ${c.name}` : undefined}>
                                                                                            {unit ? (
                                                                                                <NumCell value={each} placeholder="—"
                                                                                                    className="w-full rounded border bg-white px-1 py-0.5 text-right tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                                                                                                    onCommit={txt => {
                                                                                                        const cell = [{ variantId: id, cityId: c.cityId, qty: q }]
                                                                                                        if (txt === "") {
                                                                                                            // An explicit one-cell list, so this does NOT
                                                                                                            // go through `cellsFor` and cannot be defeated
                                                                                                            // by the variant having lost its prices.
                                                                                                            writeCells(cell, country, null,
                                                                                                                `${label(v)} · ≥${q} removed in ${c.name}`)
                                                                                                            return
                                                                                                        }
                                                                                                        // At or above the single price it is not a
                                                                                                        // discount, and ck_vmbt_pct — CHECK
                                                                                                        // (0 < v <= 100) — would refuse the row.
                                                                                                        const target = Number(txt)
                                                                                                        if (!(target > 0) || target >= unit) return
                                                                                                        const back = Math.round((1 - target / unit) * 10000) / 100
                                                                                                        if (!(back > 0 && back <= 100)) return
                                                                                                        writeCells(cell, country, back,
                                                                                                            `${label(v)} · ≥${q} set to ${target} in ${c.name} (${back}% off)`)
                                                                                                    }} />
                                                                                            ) : (
                                                                                                <div className="w-full border border-transparent px-1 py-0.5 text-right text-muted-foreground"
                                                                                                    title={`Not sold in ${c.name} — price it first`}>·</div>
                                                                                            )}
                                                                                            <div className="border border-transparent px-1 text-right text-[9px] leading-tight text-muted-foreground">
                                                                                                {pct === undefined ? "\u00a0" : `${pct}% off`}
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                )
                                                                            }))}
                                                                        </tr>
                                                                    )
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                )
                                            })()}

                                            <div className="mt-2 border-t pt-2">
                                                <MemberPicker
                                                    country={country} ladderIds={l.ids}
                                                    bases={bases} packs={packs} label={label}
                                                    thresholdsOf={thresholdsOf} priceOf={priceOf}
                                                    onToggle={(v, on) => {
                                                        if (on) {
                                                            clearSteps([v.id], country, thresholdsOf(v, country),
                                                                `${label(v)} removed from the ladder`)
                                                        } else {
                                                            // Join at each threshold's common percent where
                                                            // there is one; otherwise at that threshold's LOWEST,
                                                            // the only choice that cannot silently discount more
                                                            // than an existing member already does.
                                                            const seeds = qtys.map(q => {
                                                                const c0 = commonPct(q)
                                                                if (typeof c0 === "number") return { q, pct: c0 }
                                                                const all = l.ids.flatMap(id => {
                                                                    const m = sellable.find(x => x.id === id)
                                                                    return m ? cityPricesOf(m, country).map(cp => pctAt(m, country, cp.cityId, q)) : []
                                                                }).filter((x): x is number => x !== undefined)
                                                                return { q, pct: all.length ? Math.min(...all) : 5 }
                                                            })
                                                            // ONE call: a per-cell resolver keeps each threshold
                                                            // at its own percent. Looping instead would write
                                                            // ≥2 and then ≥5 off the same stale `variants`, and
                                                            // only the last would survive.
                                                            const seedByQty = new Map(seeds.map(sd => [sd.q, sd.pct]))
                                                            writeCells(
                                                                cellsFor([v.id], country, qtys), country,
                                                                cell => seedByQty.get(cell.qty) ?? 5,
                                                                `${label(v)} added to the ladder at ${seeds.map(sd => `≥${sd.q} ${sd.pct}%`).join(", ")}`)
                                                        }
                                                    }} />
                                            </div>
                                        </div>
                                    )
                                })}

                                {/* An explicit form. Before this, "Add a ladder" picked the first
                                    untiered variant and wrote a row immediately — because a ladder is
                                    DERIVED from tier rows and cannot exist with no members. That is
                                    true, but it made the button look like it had selected a variant
                                    on its own. Nothing is written until Create. */}
                                {(() => {
                                    const dk = `${country}`
                                    const d = draft[dk]
                                    const free = sellable.filter(v => thresholdsOf(v, country).length === 0)
                                    if (!d) {
                                        // Distinguished from "+ add a quantity", which extends THIS ladder
                                        // for the SAME variants. A second ladder exists only when a
                                        // different set of variants needs a different set of quantities —
                                        // and since a ladder is just "the variants sharing these
                                        // thresholds", that is the only thing it can mean.
                                        return (
                                            <div className="flex items-center gap-2">
                                                <Button size="sm" variant="outline" disabled={free.length === 0}
                                                    onClick={() => setDraft({ ...draft, [dk]: { qty: "2", pct: "5", ids: [] } })}>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    {free.length === 0 ? "Every variant is on a ladder" : "Different quantities for other variants"}
                                                </Button>
                                                {free.length > 0 && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {free.length} variant{free.length === 1 ? "" : "s"} not on any ladder.
                                                        To extend this one instead, use <strong>add a quantity</strong> above.
                                                    </span>
                                                )}
                                            </div>
                                        )
                                    }
                                    const setD = (patch: Partial<typeof d>) => setDraft({ ...draft, [dk]: { ...d, ...patch } })
                                    const ok = Number(d.qty) >= 2 && Number(d.pct) > 0 && Number(d.pct) <= 100 && d.ids.length > 0
                                    return (
                                        <div className="space-y-2 rounded-md border border-dashed p-2.5">
                                            <p className="text-[11px] font-semibold">
                                                A different set of quantities
                                                <span className="ml-1.5 font-normal text-muted-foreground">
                                                    for variants that should not use the discounts above
                                                </span>
                                            </p>
                                            <div className="flex flex-wrap items-end gap-2">
                                                <div className="space-y-0.5">
                                                    <Label className="text-[10px] text-muted-foreground">Buy at least</Label>
                                                    <Input type="number" min={2} className="h-7 w-20 text-xs" value={d.qty}
                                                        onChange={e => setD({ qty: e.target.value })} />
                                                </div>
                                                <div className="space-y-0.5">
                                                    <Label className="text-[10px] text-muted-foreground">Discount %</Label>
                                                    <Input type="number" className="h-7 w-20 text-xs" value={d.pct}
                                                        onChange={e => setD({ pct: e.target.value })} />
                                                </div>
                                                <Button size="sm" className="h-7 text-xs" disabled={!ok}
                                                    onClick={() => {
                                                        // Written to every scope each picked variant is PRICED at
                                                        // — city rows for a treatment, the country row for a
                                                        // supplement. Tune individual cities afterwards; the
                                                        // starting point is deliberately uniform.
                                                        writeCells(cellsFor(d.ids, country, [Number(d.qty)]), country, Number(d.pct),
                                                            `Created a ladder on ${d.ids.length} variant${d.ids.length === 1 ? "" : "s"} in ${country}`)
                                                        setDraft(prev => {
                                                            const next = { ...prev }
                                                            delete next[dk]
                                                            return next
                                                        })
                                                    }}>
                                                    Create on {d.ids.length} variant{d.ids.length === 1 ? "" : "s"}
                                                </Button>
                                                {d.ids.length > 0 && d.ids.every(id => {
                                                    const v = sellable.find(x => x.id === id)
                                                    const u = v ? priceOf(v, country) : undefined
                                                    return u === undefined || u <= 0
                                                }) && (
                                                    <span className="pb-1.5 text-[10px] text-muted-foreground">
                                                        none of these is priced in {country} yet — a tier needs a price row
                                                        to attach to, so there is nothing to write against
                                                    </span>
                                                )}
                                                <Button size="sm" variant="ghost" className="h-7 text-xs"
                                                    onClick={() => setDraft(prev => {
                                                        const next = { ...prev }
                                                        delete next[dk]
                                                        return next
                                                    })}>
                                                    Cancel
                                                </Button>
                                            </div>
                                            {/* EVERY variant is listed. Showing only the free ones
                                                made the others simply vanish, which reads as options
                                                disappearing rather than as "that one is already on a
                                                ladder" — a variant can be on at most one ladder per
                                                country, since a ladder IS its threshold set. */}
                                            <div className="flex flex-wrap gap-1.5 border-t pt-2">
                                                {sellable.map(v => {
                                                    const taken = thresholdsOf(v, country).length > 0
                                                    const on = d.ids.includes(v.id)
                                                    return (
                                                        <button key={v.id} type="button" disabled={taken}
                                                            title={taken ? `Already on a ladder in ${country} — remove it there first` : undefined}
                                                            className={`rounded border px-2 py-1 text-[10px] ${
                                                                on ? "border-primary bg-primary text-primary-foreground"
                                                                    : taken ? "cursor-not-allowed border-dashed text-muted-foreground/50"
                                                                        : "text-muted-foreground hover:bg-muted"}`}
                                                            onClick={() => setD({ ids: on ? d.ids.filter(x => x !== v.id) : [...d.ids, v.id] })}>
                                                            {label(v)}
                                                            {taken
                                                                ? <span className="ml-1">· on a ladder</span>
                                                                : (() => {
                                                                    // Say what it costs BEFORE it is picked. A tier is a
                                                                    // percent off a price, so a variant with no price in
                                                                    // this country produces a ladder with nothing to show.
                                                                    const u = priceOf(v, country)
                                                                    return u === undefined || u <= 0
                                                                        ? <span className="ml-1 opacity-60">not priced</span>
                                                                        : <span className="ml-1 opacity-60">{money(u)}</span>
                                                                })()}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })()}

                                <p className="text-[10px] text-muted-foreground">
                                    No rows for a country means <strong>no tiers there</strong>, and
                                    no row for a <strong>city</strong> means none in that city. Absence is the off
                                    switch at both grains, which is why there is no enable toggle at
                                    either. A tier is read at the same scope its price row was found at, so
                                    nothing falls back from a city to its country.
                                </p>
                            </CardContent>
                        )}
                    </Card>
                )
            })}
        </div>
    )
}

/** Membership, with packs kept visually apart — they never inherit (D-C59). */
function MemberPicker({
    country, ladderIds, bases, packs, label, thresholdsOf, priceOf, onToggle,
}: {
    country: Country
    ladderIds: string[]
    bases: ProductVariant[]
    packs: ProductVariant[]
    label: (v: ProductVariant) => string
    thresholdsOf: (v: ProductVariant, c: Country) => number[]
    priceOf: (v: ProductVariant, c: Country) => number | undefined
    onToggle: (v: ProductVariant, on: boolean) => void
}) {
    const chip = (v: ProductVariant) => {
        const on = ladderIds.includes(v.id)
        const other = !on && thresholdsOf(v, country).length > 0
        /**
         * A tier is a percent OFF A PRICE ROW, and since D-C63 it is stored at the same
         * scope that price row uses — so an unpriced variant offers no scope to write to.
         * It is disabled and says why: adding it used to look like it worked and quietly
         * wrote nothing, because there were no (variant, city) cells to write.
         *
         * Removal is never blocked by this — a variant already on the ladder can always
         * come off, whatever happened to its prices since.
         */
        const unpriced = (priceOf(v, country) ?? 0) <= 0 && !on
        const blocked = other || unpriced
        return (
            <button key={v.id} type="button" disabled={blocked}
                title={other ? "Already on another ladder in this country"
                    : unpriced ? `Not priced in ${country}. A tier is a percent off a price row and is stored at that row's scope, so there is nothing to attach it to yet — price it first.`
                        : undefined}
                className={`rounded border px-2 py-1 text-[10px] ${
                    on ? "border-primary bg-primary text-primary-foreground"
                        : blocked ? "cursor-not-allowed border-dashed text-muted-foreground/50"
                            : "text-muted-foreground hover:bg-muted"}`}
                onClick={() => onToggle(v, on)}>
                {label(v)}
                {unpriced && <span className="ml-1 opacity-70">· not priced</span>}
                {other && <span className="ml-1 opacity-70">· on another ladder</span>}
            </button>
        )
    }
    return (
        <div className="space-y-1.5">
            <div>
                <Label className="text-[10px] text-muted-foreground">Variants</Label>
                <div className="mt-1 flex flex-wrap gap-1.5">{bases.map(chip)}</div>
            </div>
            {packs.length > 0 && (
                <div>
                    <Label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                        <Layers className="h-3 w-3 text-violet-600" /> Session packs
                    </Label>
                    <div className="mt-1 flex flex-wrap gap-1.5">{packs.map(chip)}</div>
                    <p className="mt-1 flex items-start gap-1 text-[10px] text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                        A pack never inherits its base&rsquo;s ladder — tick one only if you mean
                        it. <span className="ml-1">qty 2 of a pack of 3 is two packs, not a 6-pack.</span>
                    </p>
                </div>
            )}
        </div>
    )
}
