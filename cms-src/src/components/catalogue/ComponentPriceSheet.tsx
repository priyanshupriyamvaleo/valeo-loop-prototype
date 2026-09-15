"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Undo2, Search, AlertTriangle } from "lucide-react"
import { NumCell } from "@/components/catalogue/NumCell"
import type { Biomarker, City, Country, CyotComponentPrice } from "@/types"

/**
 * Build-your-own component prices, as a sheet.
 *
 * Deliberately the same instrument as the variant PricingSheet — one country at a
 * time, cities across, `·` for an unset cell, fill-across, tab between cells,
 * NumCell reused verbatim so typing behaves identically. Ops should not have to
 * learn a second grid.
 *
 * ⚠️ ONE RULE DIFFERS, AND IT MATTERS. In the variant sheet a blank cell is a
 * MISSING ROW meaning "not sold in that city" (D-C29) — the sparse grid IS the
 * availability answer. Here it is not:
 *
 *   · the COUNTRY cell is the base. No country price = this biomarker cannot be
 *     sold in that market at all.
 *   · a CITY cell OVERRIDES the country price. Blank means "inherit", never
 *     "not sold here".
 *
 * The reason is that availability is already answered twice elsewhere — by the
 * biomarker's own market list, and by whether any lab can actually run it in that
 * city — so the price grid does not have to carry it a third time. Making city a
 * strict peer would instead demand a row for every biomarker in every city
 * (~350 × 33 ≈ 11,500) before a single basket could be priced anywhere.
 */
export function ComponentPriceSheet({
    biomarkers, cities, countries, prices, onChange,
}: {
    biomarkers: Biomarker[]
    cities: City[]
    countries: Country[]
    prices: CyotComponentPrice[]
    onChange: (next: CyotComponentPrice[]) => void
}) {
    const [country, setCountry] = useState<Country | null>(null)
    const [query, setQuery] = useState("")
    const [undo, setUndo] = useState<{ label: string; snapshot: CyotComponentPrice[] } | null>(null)

    const active = country && countries.includes(country) ? country : countries[0]
    const cols = useMemo(
        () => cities.filter(c => c.country === active && c.isActive),
        [cities, active])

    /** Only biomarkers the market actually offers — the master is 350+ rows. */
    const rows = useMemo(() => {
        if (!active) return []
        const q = query.trim().toLowerCase()
        return biomarkers
            .filter(b => b.isActive && b.lifecycle !== "deprecated")
            .filter(b => (b.countryAvailability ?? []).includes(active))
            .filter(b => !q || b.nameEn.toLowerCase().includes(q) || (b.internalName ?? "").includes(q))
    }, [biomarkers, active, query])

    const commit = (next: CyotComponentPrice[], label: string) => {
        setUndo({ label, snapshot: prices })
        onChange(next)
    }

    const cell = (biomarkerId: string, cityId?: string) =>
        prices.find(p => p.biomarkerId === biomarkerId && p.country === active && p.cityId === cityId)

    const write = (biomarkerId: string, cityId: string | undefined, raw: string, what: string) => {
        if (!active) return
        const rest = prices.filter(p =>
            !(p.biomarkerId === biomarkerId && p.country === active && p.cityId === cityId))
        if (raw === "") {
            commit(rest, cityId ? `${what} back to the ${active} price` : `${what} unpriced in ${active}`)
            return
        }
        const price = Number(raw)
        if (!(price >= 0)) return
        commit([...rest, { biomarkerId, country: active, cityId, price }], `${what} set`)
    }

    /** Copy the country price into every city — the common case for a flat market. */
    const fillRow = (b: Biomarker) => {
        if (!active) return
        const base = cell(b.id)?.price
        if (base === undefined) return
        const rest = prices.filter(p =>
            !(p.biomarkerId === b.id && p.country === active && p.cityId))
        commit(
            [...rest, ...cols.map(c => ({ biomarkerId: b.id, country: active, cityId: c.id, price: base }))],
            `${b.nameEn} filled across ${cols.length} ${active} ${cols.length === 1 ? "city" : "cities"}`)
    }

    /** Clear every city override on a row, leaving the country base to apply. */
    const clearRow = (b: Biomarker) => {
        if (!active) return
        commit(
            prices.filter(p => !(p.biomarkerId === b.id && p.country === active && p.cityId)),
            `${b.nameEn} overrides cleared`)
    }

    if (!active) {
        return (
            <div className="rounded-lg border-2 border-dashed bg-muted/10 py-10 text-center">
                <p className="text-sm font-medium text-muted-foreground">No markets configured.</p>
            </div>
        )
    }

    const unpriced = rows.filter(b => cell(b.id) === undefined)

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex overflow-hidden rounded border">
                    {countries.map(c => {
                        const offered = biomarkers.filter(b =>
                            b.isActive && (b.countryAvailability ?? []).includes(c))
                        const priced = offered.filter(b =>
                            prices.some(p => p.biomarkerId === b.id && p.country === c && !p.cityId)).length
                        return (
                            <button key={c} type="button"
                                className={`px-2.5 py-1 text-[11px] ${active === c
                                    ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                                onClick={() => setCountry(c)}>
                                {c} <span className="ml-1 opacity-70">{priced}/{offered.length}</span>
                            </button>
                        )
                    })}
                </div>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input className="h-8 w-52 pl-8 text-xs" placeholder="Search biomarkers"
                        value={query} onChange={e => setQuery(e.target.value)} />
                </div>
                <span className="text-[10px] text-muted-foreground">
                    <strong>{active}</strong> is the base price. A city cell overrides it;
                    <strong> ·</strong> means it inherits.
                </span>
                {undo && (
                    <Button size="sm" variant="outline" className="ml-auto h-6 px-2 text-[10px]"
                        onClick={() => { onChange(undo.snapshot); setUndo(null) }}>
                        <Undo2 className="mr-1 h-3 w-3" /> Undo — {undo.label}
                    </Button>
                )}
            </div>

            {unpriced.length > 0 && (
                <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                    <p className="text-[11px] text-amber-900">
                        <strong>{unpriced.length}</strong> of {rows.length} biomarkers offered in {active} have
                        no base price, so they cannot be selected in a basket:{" "}
                        {unpriced.slice(0, 6).map(b => b.nameEn).join(", ")}
                        {unpriced.length > 6 ? ` and ${unpriced.length - 6} more` : ""}.
                    </p>
                </div>
            )}

            <div className="max-h-[60vh] overflow-auto rounded-md border">
                <table className="border-collapse text-[11px]">
                    <thead className="sticky top-0 z-20">
                        <tr>
                            <th className="sticky left-0 z-30 border-b border-r-2 bg-muted/40 px-2 py-1.5 text-left font-medium">
                                Biomarker
                            </th>
                            <th className="border-b border-l bg-muted/20 px-1 py-1 text-center text-[9px] font-normal text-muted-foreground">
                                all
                            </th>
                            <th className="border-b border-l border-r-2 bg-muted/40 px-2 py-1 text-center font-medium">
                                {active}
                                <span className="ml-1 text-[9px] font-normal text-muted-foreground">base</span>
                            </th>
                            {cols.map(c => (
                                <th key={c.id}
                                    className="border-b border-l bg-muted/20 px-2 py-1 text-center font-normal text-muted-foreground">
                                    {c.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(b => {
                            const base = cell(b.id)
                            const overrides = cols.filter(c => cell(b.id, c.id)).length
                            return (
                                <tr key={b.id} className="border-b last:border-0">
                                    <td className="sticky left-0 z-10 whitespace-nowrap border-r-2 bg-background px-2 py-1">
                                        <span className="font-medium">{b.nameEn}</span>
                                        {b.isDerived && (
                                            <span className="ml-1.5 text-[9px] text-violet-600">calculated</span>
                                        )}
                                        {overrides > 0 && (
                                            <span className="ml-1.5 text-[9px] text-muted-foreground">
                                                {overrides} override{overrides > 1 ? "s" : ""}
                                            </span>
                                        )}
                                    </td>
                                    <td className="border-l px-1 py-0.5 text-center">
                                        <button type="button"
                                            className="rounded border border-primary/40 bg-primary/10 px-1.5 py-1 text-[9px] font-medium text-primary hover:bg-primary/20 disabled:opacity-40"
                                            disabled={base === undefined}
                                            title={overrides
                                                ? `Clear ${overrides} city override(s) so the ${active} price applies everywhere`
                                                : `Copy the ${active} price into all ${cols.length} cities`}
                                            onClick={() => overrides ? clearRow(b) : fillRow(b)}>
                                            {overrides ? "clear" : "fill →"}
                                        </button>
                                    </td>
                                    <td className="border-l border-r-2 px-0.5 py-0.5 text-right">
                                        <NumCell value={base?.price} placeholder="·"
                                            title={`Base price for ${b.nameEn} in ${active}`}
                                            onCommit={raw => write(b.id, undefined, raw, b.nameEn)} />
                                    </td>
                                    {cols.map(c => {
                                        const row = cell(b.id, c.id)
                                        return (
                                            <td key={c.id} className="border-l px-0.5 py-0.5 text-right">
                                                <NumCell muted={!row} value={row?.price}
                                                    placeholder={base !== undefined ? "·" : "—"}
                                                    title={row
                                                        ? `${c.name} overrides the ${active} price`
                                                        : `Inherits the ${active} price`}
                                                    onCommit={raw => write(b.id, c.id, raw, `${b.nameEn} · ${c.name}`)} />
                                            </td>
                                        )
                                    })}
                                </tr>
                            )
                        })}
                        {!rows.length && (
                            <tr><td colSpan={cols.length + 3} className="px-3 py-10 text-center text-muted-foreground">
                                {query
                                    ? "Nothing matches."
                                    : `No biomarkers are offered in ${active}. Open the market on a biomarker first.`}
                            </td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="rounded-md border bg-muted/10 p-3 text-[11px] text-muted-foreground">
                <p>
                    One <code>cyot_biomarker_pricing</code> row per (biomarker, market) plus one per city
                    override. This is a price of the <strong>channel</strong>, not of the biomarker: it
                    raises no invoice line of its own and resolves only inside a basket, which is how an
                    biomarker becomes selectable without becoming a product.
                </p>
                <p className="mt-1.5">
                    Unlike the variant pricing sheet, a blank city cell here means{" "}
                    <strong>inherit</strong>, not &ldquo;not sold there&rdquo; — availability is answered
                    by the biomarker&rsquo;s market list and by lab coverage, so the grid does not carry it
                    as well. Every price here is new authored data: a legacy mini package priced a whole
                    set of tests, so no per-biomarker price existed to migrate.
                </p>
            </div>
        </div>
    )
}
