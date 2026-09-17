"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ExternalLink, Trash, Wand2 } from "lucide-react"
import { NumCell } from "@/components/catalogue/NumCell"
import {
    MONEY, fmtMoney, pricedUnitsOf, resolveComposition, unitLabel,
    unitOutOfStock,
} from "@/lib/composition"
import { cellPrice, packageDrift, stepUnits } from "@/lib/protocol-package"
import { isDemoListing } from "@/lib/package-demo-catalogue"
import type { CompositionResolution } from "@/lib/composition"
import type {
    City, Composition, CompositionMember, Country, Listing, Protocol,
} from "@/types"

/**
 * ONE SHEET: what the package is made of, and what it costs in every market.
 *
 * The screen it replaces could only ever describe ONE market. Country and city
 * were pills, one selected at a time, and every other city was disabled behind
 * "Not selling here yet" — so the day somebody enabled Abu Dhabi they found the
 * holes one cell at a time. Cities are columns here for exactly that reason:
 * adding one is a column that fills or does not, read in a glance.
 *
 * THE FOOTER IS THE POINT. Items are what the package costs at list; the
 * discount is the only number authored; "would sell for" is the arithmetic. The
 * three sit in one column so the sum can be checked by eye, per city.
 */
export function PackageSheet({
    pkg, protocol, listings, cities, country, countries, onCountry,
    selected, onSelect, onChange, onBuildFromSteps, overallPercent,
}: {
    pkg: Composition
    protocol: Protocol
    listings: Listing[]
    cities: City[]
    country: Country
    /** Every country the package has a row for, and the tab that changes it. */
    countries: Country[]
    onCountry: (c: Country) => void
    /** Which column the invoice below describes. `undefined` = country-wide. */
    selected?: string
    onSelect: (cityId?: string) => void
    onChange: (next: Composition) => void
    onBuildFromSteps: () => void
    /**
     * ONE DISCOUNT FOR THE WHOLE PACKAGE, read here and authored below.
     *
     * The sheet used to carry an editable percent PER COLUMN, so the same
     * package could be 15% off in Dubai and 10% in Abu Dhabi. That is a per
     * market price, not a package discount, and it is not what is wanted: the
     * discount is one commercial decision and the columns only show what it
     * takes off each market's own subtotal.
     */
    overallPercent?: number
}) {
    const money = MONEY[country]
    const fmt = (n: number) => fmtMoney(country, n)

    const countryRow = pkg.scopes.find(s => s.country === country && !s.cityId)
    /* A RETIRED CITY IS NOT A COLUMN. It keeps its row and its baseline, but
       effectiveScope sends it back to the country row — so a column for it
       would just repeat the country column while implying it is its own
       market. Restore it in the panel above and it comes back. */
    const cityRows = pkg.scopes.filter(s =>
        s.country === country && s.cityId && s.isActive !== false)

    /**
     * A column is a country OR a city and never a string that could be either.
     *
     * The sibling sheets use `cityId: ""` for their country column, which is
     * safe there because it is display-only. Here it would be written into a
     * CompositionScope, and `effectiveScope` classifies rows by `!r.cityId` —
     * so an empty string mints a SECOND country row, trips the duplicate guard,
     * and kills every price in the market.
     */
    const columns = useMemo(() => {
        const out: { key: string; label: string; cityId?: string }[] = []
        /* "Listed cities only" says the parent does not sell country-wide, and
           effectiveScope closes the cityless lookup to match. No column for it. */
        if (countryRow && countryRow.coverage !== "cities_only") {
            out.push({ key: "__country", label: `${country} · country-wide` })
        }
        cityRows.forEach(r => out.push({
            key: r.cityId!,
            label: cities.find(c => c.id === r.cityId)?.name ?? r.cityId!,
            cityId: r.cityId,
        }))
        return out
    }, [countryRow, cityRows, cities, country])

    /** One resolution per column, computed once — not inline in the JSX. */
    const resolved = useMemo(() => {
        const map: Record<string, CompositionResolution> = {}
        columns.forEach(col => {
            map[col.key] = resolveComposition(pkg, listings, country, { cityId: col.cityId })
        })
        return map
    }, [columns, pkg, listings, country])

    const drift = useMemo(() => packageDrift(pkg, protocol.steps), [pkg, protocol.steps])
    const notes = useMemo(() => {
        const by = new Map(stepUnits(protocol.steps).map(u => [
            `${u.ref.listingId}:${u.ref.kind}:${u.ref.unitId}`, u.note,
        ]))
        return by
    }, [protocol.steps])

    const patch = (id: string, p: Partial<CompositionMember>) =>
        onChange({ ...pkg, members: pkg.members.map(m => (m.id === id ? { ...m, ...p } : m)) })

    const remove = (id: string) => onChange({
        ...pkg,
        members: pkg.members.filter(m => m.id !== id).map((m, i) => ({ ...m, sortOrder: i })),
    })

    const members = [...pkg.members].sort((a, b) => a.sortOrder - b.sortOrder)

    return (
        <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-base font-semibold">Pricing Sheet</p>
                    <p className="mt-0.5 max-w-3xl text-xs text-muted-foreground">
                        One row per package item, one column per market, one country at a time.
                        Where Country Availability offers cities the columns are those{" "}
                        <b className="text-foreground">cities</b>; where it offers none the package
                        is priced <b className="text-foreground">country-wide</b> in a single
                        column. Prices are read from each item&rsquo;s own listing and are not typed
                        here. {members.length} item{members.length === 1 ? "" : "s"} from{" "}
                        {protocol.steps.length} steps.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={onBuildFromSteps}>
                    <Wand2 className="mr-2 h-3.5 w-3.5" /> Build from the steps
                </Button>
            </div>

            {/* ── WHAT THE STEPS SAY AND THE PACKAGE DOES NOT ── */}
            {(drift.missingFromPackage.length > 0 || drift.extraInPackage.length > 0
                || drift.wrongQuantity.length > 0) && (
                <div className="rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
                    <p className="font-medium">The steps and this package disagree</p>
                    <ul className="mt-1 space-y-0.5">
                        {drift.missingFromPackage.map(u => (
                            <li key={`m-${u.ref.unitId}`}>
                                {unitLabel(u.ref, listings)} — in the steps, not in the package
                            </li>
                        ))}
                        {drift.extraInPackage.map(m => (
                            <li key={`e-${m.id}`}>
                                {unitLabel(m.ref, listings)} — in the package, no step asks for it
                            </li>
                        ))}
                        {drift.wrongQuantity.map(w => (
                            <li key={`q-${w.member.id}`}>
                                {unitLabel(w.member.ref, listings)} — {w.member.quantity} here,
                                {" "}{w.steps} step{w.steps === 1 ? "" : "s"}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ONE COUNTRY AT A TIME, chosen here rather than above the card.
                The tab carries its currency, so no cell in the column repeats
                it, and the counter says how many of this market's cells are
                priced — the number that says whether a new city is ready. */}
            {countries.length > 0 && (
                <div className="flex overflow-hidden rounded border">
                    {countries.map(ct => (
                        <button key={ct} type="button"
                            className={`px-2.5 py-1 text-[11px] ${ct === country
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted"}`}
                            onClick={() => onCountry(ct)}>
                            {ct} <span className="font-mono opacity-70">{MONEY[ct].code}</span>
                        </button>
                    ))}
                </div>
            )}

            {columns.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center">
                    <p className="text-sm font-medium">{country} has no market yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Switch it on above. A package with no row for a market does not sell there,
                        and that is deliberate — nothing is live somewhere by default.
                    </p>
                </div>
            ) : (
                <div className="max-h-[60vh] overflow-auto rounded-md border">
                    <table className="w-full min-w-[640px] border-collapse text-sm">
                        {/* ══ TWO BARS, AS IN THE LISTING SHEET ══
                            Country first with its currency, then the cities inside
                            it. Reading down a column is reading one market; the
                            country bar says which currency the whole column is in,
                            so no cell has to repeat it. */}
                        <thead className="sticky top-0 z-20">
                            <tr>
                                <th rowSpan={2}
                                    className="sticky left-0 z-30 border-b border-r-2 bg-muted/40 px-2 py-1.5 text-left align-bottom text-xs font-medium">
                                    Service
                                </th>
                                <th rowSpan={2}
                                    className="border-b border-r-2 bg-muted/40 px-2 py-1.5 text-left align-bottom text-xs font-medium">
                                    Qty
                                </th>
                                <th colSpan={columns.length}
                                    className="border-b border-r-2 bg-muted/40 px-2 py-1 text-center text-xs font-medium">
                                    {country}{" "}
                                    <span className="font-mono text-[10px] text-muted-foreground">
                                        {money.code}
                                    </span>
                                </th>
                                <th rowSpan={2} className="w-10 border-b bg-muted/40" />
                            </tr>
                            <tr>
                                {columns.map((col, i, arr) => (
                                    <th key={col.key}
                                        className={`border-b border-l bg-muted/20 px-2 py-1 text-center text-xs font-normal ${
                                            i === arr.length - 1 ? "border-r-2" : ""} ${
                                            col.cityId === selected || (!col.cityId && !selected)
                                                ? "text-foreground" : "text-muted-foreground"}`}>
                                        <button type="button" onClick={() => onSelect(col.cityId)}
                                            title="Show the invoice split for this market"
                                            className="hover:underline">
                                            {col.cityId
                                                ? col.label
                                                : <span className="italic">country-wide</span>}
                                        </button>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {members.map(m => {
                                const l = listings.find(x => x.id === m.ref.listingId)
                                const units = l ? pricedUnitsOf(l) : []
                                const note = notes.get(
                                    `${m.ref.listingId}:${m.ref.kind}:${m.ref.unitId}`)
                                return (
                                    <tr key={m.id} className="border-b align-top last:border-0">
                                        <td className="sticky left-0 z-10 border-r-2 bg-background px-2 py-3">
                                            <p className="font-medium">{unitLabel(m.ref, listings)}</p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {m.ref.kind.replace("_", " ")}
                                                </Badge>
                                                {isDemoListing(m.ref.listingId)
                                                    ? <Badge variant="outline"
                                                        className="border-sky-200 bg-sky-50 text-[10px] text-sky-700"
                                                        title="Priced from the prototype snapshot in this repo, not the live service">
                                                        snapshot
                                                    </Badge>
                                                    : <Badge variant="outline"
                                                        className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                                                        live
                                                    </Badge>}
                                                {!m.required && (
                                                    <Badge variant="outline" className="text-[10px]">optional</Badge>
                                                )}
                                                {unitOutOfStock(m.ref, listings, country) && (
                                                    <Badge variant="outline"
                                                        className="border-amber-200 bg-amber-50 text-[10px] text-amber-800">
                                                        out of stock
                                                    </Badge>
                                                )}
                                            </div>
                                            {note && (
                                                <p className="mt-1 text-xs text-muted-foreground">{note}</p>
                                            )}
                                            {units.length > 1 && (
                                                <div className="mt-2 w-56">
                                                    <Select value={m.ref.unitId}
                                                        onValueChange={v =>
                                                            patch(m.id, { ref: { ...m.ref, unitId: v } })}>
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {units.map(u => (
                                                                <SelectItem key={u.ref.unitId} value={u.ref.unitId}
                                                                    className="text-xs">
                                                                    {u.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </td>

                                        <td className="border-r-2 px-2 py-3">
                                            <NumCell value={m.quantity}
                                                onCommit={raw => patch(m.id, {
                                                    quantity: Math.max(1, Math.round(Number(raw) || 1)),
                                                })} />
                                        </td>

                                        {columns.map(col => {
                                            const c = cellPrice(m.ref, listings, country, col.cityId)
                                            if (c.price === undefined) {
                                                return (
                                                    <td key={col.key}
                                                        className="border-l px-2 py-3 text-right text-muted-foreground/50"
                                                        title={`Not sold in ${col.label}. Price it on the listing, or switch this city off.`}>
                                                        ·
                                                    </td>
                                                )
                                            }
                                            const inherited = c.level !== "city"
                                            return (
                                                <td key={col.key}
                                                    className={`border-l px-2 py-3 text-right tabular-nums ${
                                                        inherited ? "text-muted-foreground" : ""}`}
                                                    title={c.level === "country"
                                                        ? `Priced country-wide, so it is the same everywhere in ${country}.`
                                                        : c.level === "inherited"
                                                            ? `No ${col.label} row — this is the ${country} price.`
                                                            : undefined}>
                                                    {c.was !== undefined && (
                                                        <span className="mr-1.5 text-xs text-muted-foreground line-through">
                                                            {fmt(c.was * m.quantity)}
                                                        </span>
                                                    )}
                                                    {fmt(c.price * m.quantity)}
                                                </td>
                                            )
                                        })}

                                        <td className="border-l py-3 text-right">
                                            <span className="inline-flex flex-col items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                                    title="Remove from the package"
                                                    onClick={() => remove(m.id)}>
                                                    <Trash className="h-3.5 w-3.5" />
                                                </Button>
                                                {l && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild
                                                        title="Open the catalogue item — its own price is authored there">
                                                        <Link href={`/catalogue/listings/${l.id}`}>
                                                            <ExternalLink className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>

                        {/* ══ THE THREE LINES THE WHOLE SCREEN EXISTS FOR ══ */}
                        <tfoot className="border-t-2">
                            <tr className="border-b">
                                <td colSpan={2} className="border-r-2 px-2 py-2.5 text-xs font-medium text-muted-foreground">
                                    Components at their own list price
                                </td>
                                {columns.map(col => {
                                    const r = resolved[col.key]
                                    /* memberSubtotal is computed BEFORE the refusals and
                                       survives every one of them, so a column that cannot
                                       sell would otherwise print a confident partial sum
                                       that silently excludes the items it is missing. */
                                    const partial = r.blocking.length > 0
                                    return (
                                        <td key={col.key} className="border-l px-2 py-2.5 text-right text-sm tabular-nums">
                                            {partial
                                                ? <span className="text-muted-foreground/60"
                                                    title={`${r.blocking.length} item(s) have no price here, so there is no subtotal.`}>
                                                    —
                                                </span>
                                                : fmt(r.memberSubtotal)}
                                        </td>
                                    )
                                })}
                                <td />
                            </tr>

                            <tr className="border-b">
                                <td colSpan={2} className="border-r-2 px-2 py-2.5 text-xs font-medium text-muted-foreground">
                                    Overall discount
                                    {overallPercent ? ` — ${overallPercent}%` : ""}
                                </td>
                                {columns.map(col => {
                                    const r = resolved[col.key]
                                    /* What the one discount takes off THIS market's own
                                       subtotal. The percent is the same everywhere; the
                                       money is not, because the subtotals are not. */
                                    const off = r.blocking.length > 0 || r.total === undefined
                                        ? undefined
                                        : r.memberSubtotal - r.total
                                    return (
                                        <td key={col.key}
                                            className="border-l py-2.5 px-2 text-right text-sm tabular-nums text-muted-foreground">
                                            {off === undefined || off <= 0
                                                ? <span className="text-muted-foreground/50">·</span>
                                                : `−${fmt(off)}`}
                                        </td>
                                    )
                                })}
                                <td />
                            </tr>

                            <tr>
                                <td colSpan={2} className="border-r-2 px-2 py-3 text-sm font-medium">
                                    Would sell for
                                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                        {money.code}
                                    </span>
                                </td>
                                {columns.map(col => {
                                    const r = resolved[col.key]
                                    return (
                                        <td key={col.key}
                                            className="border-l px-2 py-3 text-right text-base font-semibold tabular-nums">
                                            {r.total === undefined
                                                ? <span className="text-sm font-normal text-muted-foreground/60">
                                                    no price
                                                </span>
                                                : fmt(r.total)}
                                        </td>
                                    )
                                })}
                                <td />
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                <b className="text-foreground">Would sell for</b>, not sells for. This is the
                arithmetic — it does not check the live window, the audience or the package status,
                so a draft and a market whose dates have not opened both still show a number here.
                A dot is an item with no price in that city: price it on the listing, or switch the
                city off. A grey number came from the country row, not from that city. The discount
                is one number for the whole package, typed below — the money it takes off differs
                per column only because the subtotals do.
            </p>
        </Card>
    )
}
