"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Undo2, AlertTriangle } from "lucide-react"
import { City, Country, ProductCityConfig, ProductVariant, RegionalData, VariantOption } from "@/types"
import {
    comboLabel, discountFromPrices, retailFor, variantsAnsweringInactive,
} from "@/lib/catalogue"
import { MONEY } from "@/lib/composition"
import { NumCell } from "@/components/catalogue/NumCell"

/**
 * ── Pricing, as a sheet ───────────────────────────────────────────────────────
 *
 * The same `product_pricing` rows as the price-list view, laid out as variants ×
 * cities. Built ALONGSIDE that view, not replacing it — the two win different halves
 * of the job:
 *
 *   · sheet — the cold start. Type across, compare cities, see every gap at once.
 *   · lists — the edit. 33% of IV packages carry ONE price across all their cities and
 *             68% at most two, so "these five are 250, Al Ain is 300" is one action
 *             there and five cells here.
 *
 * The earlier research argument against a grid does not apply at this size: Shopify's
 * bulk editor chokes past ~100 ROWS, where a row is a variant with many columns. Nine
 * variants across six offered cities is 54 cells, which is what a sheet is for.
 *
 * ⚠️ BLANK IS AMBIGUOUS IN A SPREADSHEET AND MEANINGFUL HERE. D-C29 makes a missing
 * (variant, city) row mean NOT SOLD THERE — so an unpriced cell renders an explicit `·`
 * rather than emptiness, and clearing a cell DELETES the row rather than storing a zero.
 *
 * PACKS ARE NOT ROWS. A pack is a variant, but its price derives from its base and is
 * authored in Session Packs; listing packs here would double the rows in order to edit a
 * number that is set somewhere else.
 */

interface Props {
    variants: ProductVariant[]
    variantOptions: VariantOption[]
    countries: Country[]
    cities: City[]
    cityConfig: ProductCityConfig[]
    onReplaceVariants: (variants: ProductVariant[]) => void
    onGoToCities?: () => void
}

export function PricingSheet({
    variants, variantOptions, countries, cities, cityConfig, onReplaceVariants, onGoToCities,
}: Props) {
    const [undo, setUndo] = useState<{ label: string; snapshot: ProductVariant[] } | null>(null)
    /**
     * ONE COUNTRY AT A TIME. Country is the seam everywhere else — `product_pricing` keys
     * on it, tiers exact-match it (D-C58), currency is a pure function of it — and the
     * sheet was the only screen flattening across it, at 9 UAE + 20 KSA columns side by
     * side. It is also the ops boundary: a UAE manager prices in AED and should not be
     * scrolling past SAR columns, still less able to mistype into them.
     *
     * ⚠️ This is a VIEW scope, not access control. Restricting a manager to their market
     * is a permissions feature the prototype does not have — this is the shape it would
     * take, not the enforcement.
     */
    const [country, setCountry] = useState<Country | null>(null)

    const commit = (next: ProductVariant[], label: string) => {
        setUndo({ label, snapshot: variants })
        onReplaceVariants(next)
    }

    const inactiveAxis = variantsAnsweringInactive(variants, variantOptions)
    const bases = variants.filter(v => !v.sessionPack)
    const label = (v: ProductVariant) =>
        comboLabel(v.optionValues, variantOptions) || v.variantLabelEn || v.nameEn || "Unnamed"

    /** City Availability decides where the product is offered — not this screen. */
    const offeredCities = (c: Country) => cities.filter(x =>
        x.country === c && cityConfig.some(r => r.cityId === x.id && r.status === "active"))
    const liveCountries = countries.filter(c => offeredCities(c).length > 0)
    const active = country && liveCountries.includes(country) ? country : liveCountries[0]
    const shown = active ? [active] : []
    const columns = liveCountries.flatMap(c => offeredCities(c).map(city => ({ country: c, city })))

    const rowFor = (v: ProductVariant, cityId: string) => {
        for (const r of v.regionalData ?? []) {
            const hit = r.cityPrices?.find(p => p.cityId === cityId)
            if (hit) return hit
        }
        return undefined
    }

    /** Write or remove one (variant, city) price row. `null` removes it. */
    const write = (
        v: ProductVariant, country: Country, cityId: string,
        money: { price: number; retailPrice: number } | null,
    ): ProductVariant => {
        const rows = [...(v.regionalData ?? [])]
        const i = rows.findIndex(r => r.country === country)
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
            rows.push({ country, sku: "", zohoId: "", price: 0, isAvailable: true, cityPrices: next([]) })
        } else {
            rows[i] = { ...rows[i], cityPrices: next(rows[i].cityPrices ?? []) }
        }
        return { ...v, regionalData: rows }
    }

    const setCell = (
        v: ProductVariant, country: Country, cityId: string, raw: string, cityName: string,
        field: "price" | "retail",
    ) => {
        const row = rowFor(v, cityId)
        if (raw === "") {
            // Clearing SELLING removes the row entirely — absence is how "not sold there"
            // is said (D-C29). Clearing RETAIL cannot leave a hole: the column is NOT NULL,
            // so it drops back to the selling price — nothing struck out.
            if (field === "price") {
                commit(variants.map(x => x.id === v.id ? write(x, country, cityId, null) : x),
                    `${cityName} removed from sale`)
            } else if (row) {
                commit(variants.map(x => x.id === v.id
                    ? write(x, country, cityId, { price: row.price, retailPrice: row.price }) : x),
                    `${cityName} retail cleared`)
            }
            return
        }
        const num = Number(raw)
        if (!(num > 0)) return
        const price = field === "price" ? num : (row?.price ?? num)
        const retailPrice = retailFor(price, field === "retail" ? num : row?.retailPrice)
        commit(variants.map(x => x.id === v.id ? write(x, country, cityId, { price, retailPrice }) : x),
            `${label(v)} · ${cityName} ${field === "price" ? "price" : "retail"} set`)
    }

    /** Copy the first priced cell of a row across every other city in the same country. */
    const fillRow = (v: ProductVariant, country: Country) => {
        const cs = offeredCities(country)
        const seed = cs.map(c => rowFor(v, c.id)).find(r => r && r.price > 0)
        if (!seed) return
        let out = v
        cs.forEach(c => {
            out = write(out, country, c.id, {
                price: seed.price, retailPrice: seed.retailPrice ?? seed.price,
            })
        })
        commit(variants.map(x => x.id === v.id ? out : x),
            `${label(v)} filled across ${cs.length} ${country} ${cs.length === 1 ? "city" : "cities"}`)
    }

    if (bases.length === 0) {
        return (
            <div className="rounded-lg border-2 border-dashed bg-muted/10 py-10 text-center">
                <p className="text-sm font-medium text-muted-foreground">No variants to price.</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Generate them from the axes first — a price row names a variant.
                </p>
            </div>
        )
    }

    if (columns.length === 0) {
        return (
            <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50/60 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-900">No cities offered yet.</p>
                    <p className="mt-0.5 text-[11px] text-amber-900">
                        The sheet&rsquo;s columns are the cities this product is offered in, which City
                        Availability decides. Enable the ones you serve and they appear here.
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

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex overflow-hidden rounded border">
                    {liveCountries.map(c => {
                        const cs = offeredCities(c)
                        const priced = bases.reduce((n, v) =>
                            n + cs.filter(x => (rowFor(v, x.id)?.price ?? 0) > 0).length, 0)
                        const total = bases.length * cs.length
                        return (
                            <button key={c} type="button"
                                className={`px-2.5 py-1 text-[11px] ${active === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                                onClick={() => setCountry(c)}>
                                {c} <span className="font-mono opacity-70">{MONEY[c].code}</span>
                                <span className="ml-1 opacity-70">{priced}/{total}</span>
                            </button>
                        )
                    })}
                </div>
                <span className="text-[10px] text-muted-foreground">
                    <strong>SP</strong> selling · <strong>RP</strong> retail (the struck-through
                    was-price). Tab across, Shift+Tab back. <strong>·</strong> means not sold there —
                    clearing SP removes the row.
                </span>
                {undo && (
                    <Button size="sm" variant="outline" className="ml-auto h-6 px-2 text-[10px]"
                        onClick={() => { onReplaceVariants(undo.snapshot); setUndo(null) }}>
                        <Undo2 className="mr-1 h-3 w-3" /> Undo — {undo.label}
                    </Button>
                )}
            </div>

            {/* Scrolls INSIDE its own box, both ways, with the variant column and the
                header pinned — a nine-by-six grid otherwise pushes the page furniture off
                screen and you lose track of which row you are typing into. */}
            <div className="max-h-[60vh] overflow-auto rounded-md border">
                <table className="border-collapse text-[11px]">
                    <thead className="sticky top-0 z-20">
                        <tr>
                            <th rowSpan={2}
                                className="sticky left-0 z-30 border-b border-r-2 bg-muted/40 px-2 py-1.5 text-left align-bottom font-medium">
                                Variant
                            </th>
                            {shown.map(c => (
                                <th key={c} colSpan={offeredCities(c).length * 2 + 1}
                                    className="border-b border-r-2 bg-muted/40 px-2 py-1 text-center font-medium">
                                    {c} <span className="font-mono text-[10px] text-muted-foreground">{MONEY[c].code}</span>
                                </th>
                            ))}
                        </tr>
                        <tr>
                            {shown.flatMap(c => [
                                <th key={`${c}-fill`} className="border-b border-l bg-muted/20 px-1 py-1 text-center text-[9px] font-normal text-muted-foreground">
                                    all
                                </th>,
                                ...offeredCities(c).map((city, i, arr) => (
                                    <th key={city.id} colSpan={2}
                                        className={`border-b border-l bg-muted/20 px-2 py-1 text-center font-normal text-muted-foreground ${i === arr.length - 1 ? "border-r-2" : ""}`}>
                                        {city.name}
                                    </th>
                                )),
                            ])}
                        </tr>
                        <tr className="sticky top-0">
                            <th className="sticky left-0 z-30 border-b border-r-2 bg-muted/10" />
                            {shown.flatMap(c => [
                                <th key={`${c}-fillh`} className="border-b border-l bg-muted/10" />,
                                ...offeredCities(c).flatMap(city => [
                                    <th key={`${city.id}-s`}
                                        title="Selling price — what is charged (product_pricing.selling_price)"
                                        className="border-b border-l bg-muted/10 px-1 py-0.5 text-center text-[9px] font-medium tracking-wide text-muted-foreground">
                                        SP
                                    </th>,
                                    <th key={`${city.id}-r`}
                                        title="Retail price — the struck-through was-price (product_pricing.retail_price)"
                                        className="border-b bg-muted/10 px-1 py-0.5 text-center text-[9px] font-medium tracking-wide text-muted-foreground">
                                        RP
                                    </th>,
                                ]),
                            ])}
                        </tr>
                    </thead>
                    <tbody>
                        {bases.map(v => (
                            <tr key={v.id} className="border-b last:border-0">
                                <td className="sticky left-0 z-10 whitespace-nowrap border-r-2 bg-background px-2 py-1 font-medium">
                                    {label(v)}
                                    {(v.status === "inactive" || inactiveAxis.includes(v.id)) && (
                                        <span className="ml-1 text-[9px] text-muted-foreground">inactive</span>
                                    )}
                                </td>
                                {shown.flatMap(c => [
                                    // Fill sits at the FRONT of its country, not after the last
                                    // city — nine UAE columns put it off-screen, so the one control
                                    // that saves the most typing was the one you had to scroll to find.
                                    <td key={`${c}-fill`} className="border-l px-1 py-0.5 text-center">
                                        <button type="button"
                                            className="rounded border border-primary/40 bg-primary/10 px-1.5 py-1 text-[9px] font-medium text-primary hover:bg-primary/20 disabled:opacity-40"
                                            disabled={!offeredCities(c).some(x => (rowFor(v, x.id)?.price ?? 0) > 0)}
                                            title={`Copy this row's first ${c} price across all ${offeredCities(c).length} ${c} cities`}
                                            onClick={() => fillRow(v, c)}>
                                            fill →
                                        </button>
                                    </td>,
                                    ...offeredCities(c).flatMap((city, ci, arr) => {
                                        const row = rowFor(v, city.id)
                                        const last = ci === arr.length - 1
                                        return [
                                            <td key={`${city.id}-s`} className="border-l px-0.5 py-0.5 text-right">
                                                <NumCell value={row?.price} placeholder="·"
                                                    onCommit={raw => setCell(v, c, city.id, raw, city.name, "price")} />
                                            </td>,
                                            <td key={`${city.id}-r`}
                                                className={`px-0.5 py-0.5 text-right ${last ? "border-r-2" : ""}`}>
                                                {/* A retail equal to the selling price is NOT an entered
                                                    value — it means nothing is struck out. Showing it as
                                                    a number made the field look pre-filled, so typing
                                                    appended to it. */}
                                                <NumCell muted
                                                    value={row && row.retailPrice !== undefined && row.retailPrice !== row.price
                                                        ? row.retailPrice : undefined}
                                                    placeholder={row ? "same" : "·"}
                                                    onCommit={raw => setCell(v, c, city.id, raw, city.name, "retail")} />
                                            </td>,
                                        ]
                                    }),
                                ])}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rounded-md border bg-muted/10 p-3 text-[11px] text-muted-foreground">
                <p>
                    Same rows as the price-list view — one <code>product_pricing</code> row per
                    (variant, city). A <strong>·</strong> is not an empty cell but a missing row, which
                    is how &ldquo;not sold in that city&rdquo; is said; clearing a selling price
                    deletes the row rather than storing a zero.
                </p>
                <p className="mt-1.5">
                    Retail is <strong>NOT NULL</strong>, so clearing it sets it equal to the selling
                    price — nothing struck out — rather than leaving the row without one. Session packs
                    are not listed: a pack&rsquo;s price derives from its base and is authored there.
                </p>
            </div>
        </div>
    )
}
