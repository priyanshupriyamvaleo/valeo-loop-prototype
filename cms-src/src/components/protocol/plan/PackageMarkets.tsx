"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { MapPin } from "lucide-react"
import { MONEY } from "@/lib/composition"
import type { City, Composition, CompositionScope, Country } from "@/types"

/**
 * WHERE A PACKAGE SELLS, IN TWO CARDS.
 *
 * The catalogue's ScopeMatrix used to do this job here, and it carried far more
 * than a package needs: an invoicing-entity panel, an audience picker, a live
 * window, a drift baseline and two money inputs. Those belong to a listing.
 * A package needs one question per country and one per city.
 *
 * NOTHING IS DELETED. A market that stops selling is switched off and keeps its
 * row, so the history of having offered it survives. That is the listing
 * editor's rule and it is repeated here on purpose.
 */

/** Row ids minted outside the render, so no id is read from a clock. */
let seq = 0
const scopeId = (parts: string[]) => `sc-${parts.join("-")}-${(seq++).toString(36)}`

const ALL: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT"]

/* ══════════════════════════════════════════════════════════════════════════ */

/**
 * COUNTRY AVAILABILITY.
 *
 * Two answers per country. Active says whether it sells at all. Coverage says
 * whether the country price stands on its own, or whether only the listed
 * cities sell — `effectiveScope` closes the cityless lookup for the second, so
 * the choice is what removes the country-wide column from the sheet.
 */
export function PackageCountries({
    pkg, onChange,
}: {
    pkg: Composition
    onChange: (scopes: CompositionScope[]) => void
}) {
    const [adding, setAdding] = useState("")
    const rows = pkg.scopes ?? []
    const countryRows = rows.filter(r => !r.cityId)
    const missing = ALL.filter(c => !countryRows.some(r => r.country === c))

    const setRow = (id: string, p: Partial<CompositionScope>) =>
        onChange(rows.map(r => (r.id === id ? { ...r, ...p } : r)))

    const add = (country: Country) => onChange([...rows, {
        id: scopeId([pkg.id, country.toLowerCase()]),
        country, isActive: true, coverage: "country",
    }])

    return (
        <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="flex items-center gap-2 text-base font-semibold">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        Country Availability
                    </p>
                    <p className="mt-0.5 max-w-3xl text-xs text-muted-foreground">
                        One row per country. A market added here can be switched Inactive to stop
                        selling — rows are not deleted, so the history of having offered it
                        survives.
                    </p>
                </div>
                <Select value={adding}
                    onValueChange={v => { add(v as Country); setAdding("") }}>
                    <SelectTrigger className="h-9 w-[170px]">
                        <SelectValue placeholder={missing.length ? "Add country" : "All markets added"} />
                    </SelectTrigger>
                    <SelectContent>
                        {missing.map(c => (
                            <SelectItem key={c} value={c}>
                                {c} <span className="text-muted-foreground">{MONEY[c].code}</span>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {countryRows.length === 0 ? (
                <div className="rounded-md border border-dashed p-6 text-center">
                    <p className="text-sm font-medium">This package sells nowhere yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Add a country above. Nothing is live somewhere by default — with four
                        regulators and four clocks, that is deliberate.
                    </p>
                </div>
            ) : countryRows.map(r => {
                const off = r.isActive === false
                return (
                    <div key={r.id} className="rounded-md border p-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-sm font-medium">{r.country}</p>
                            <span className="font-mono text-xs text-muted-foreground">
                                {MONEY[r.country].code}
                            </span>
                            {off && (
                                <Badge variant="outline"
                                    className="border-slate-300 bg-slate-100 text-[10px] text-slate-700">
                                    every city here is closed too
                                </Badge>
                            )}
                            <div className="ml-auto flex items-center gap-2">
                                <Select value={off ? "inactive" : "active"}
                                    onValueChange={v => setRow(r.id, { isActive: v === "active" })}>
                                    <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={r.coverage ?? "country"}
                                    onValueChange={v => setRow(r.id, {
                                        coverage: v as CompositionScope["coverage"],
                                    })}>
                                    <SelectTrigger className="h-9 w-[180px]"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="country">Whole country</SelectItem>
                                        <SelectItem value="cities_only">Listed cities only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            {r.coverage === "cities_only"
                                ? "Only the cities switched on below sell. The sheet has no country-wide column for this market."
                                : "The country price sells everywhere in this market. A city switched on below gets its own column and its own price."}
                        </p>
                    </div>
                )
            })}
        </Card>
    )
}

/* ══════════════════════════════════════════════════════════════════════════ */

/**
 * CITY AVAILABILITY.
 *
 * One switch per city and nothing else. The listing editor carries a second
 * toggle here for who books the slot; a package books nothing, so it is absent.
 *
 * WHAT THE SWITCH MEANS DEPENDS ON COVERAGE, and the label follows it rather
 * than pretending otherwise:
 *
 *   · Whole country   — the country price already reaches every city, so the
 *                       switch adds a column of its own for one city.
 *   · Listed cities only — the country-wide lookup is closed, so the switch is
 *                       literally whether the package is offered there.
 *
 * Switching off keeps the row. A retired city row falls back to the country
 * row, which is what `effectiveScope` does, so under Whole country the city
 * still sells at the country price.
 */
export function PackageCities({
    pkg, cities, onChange,
}: {
    pkg: Composition
    cities: City[]
    onChange: (scopes: CompositionScope[]) => void
}) {
    const rows = pkg.scopes ?? []
    const countryRows = rows.filter(r => !r.cityId)

    const toggle = (country: Country, cityId: string, on: boolean) => {
        const existing = rows.find(r => r.country === country && r.cityId === cityId)
        if (existing) {
            onChange(rows.map(r => (r.id === existing.id ? { ...r, isActive: on } : r)))
            return
        }
        if (!on) return
        onChange([...rows, {
            id: scopeId([pkg.id, cityId]),
            country, cityId, isActive: true,
        }])
    }

    return (
        <Card className="space-y-4 p-5">
            <div>
                <p className="flex items-center gap-2 text-base font-semibold">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    City Availability
                </p>
                <p className="mt-0.5 max-w-3xl text-xs text-muted-foreground">
                    The cities switched on here are the columns of the Pricing Sheet below.
                    Switching one off keeps its row and its price history.
                </p>
            </div>

            {countryRows.length === 0 ? (
                <p className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                    Add a country above first. A city belongs to a market.
                </p>
            ) : countryRows.map(cr => {
                const inCountry = cities.filter(x => x.country === cr.country)
                const on = (cityId: string) => {
                    const r = rows.find(x => x.country === cr.country && x.cityId === cityId)
                    return !!r && r.isActive !== false
                }
                const listed = cr.coverage === "cities_only"
                const closed = cr.isActive === false
                return (
                    <div key={cr.id} className="rounded-md border">
                        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2.5">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-sm font-medium">{cr.country}</p>
                            {closed && (
                                <Badge variant="outline"
                                    className="border-slate-300 bg-slate-100 text-[10px] text-slate-700">
                                    country Inactive
                                </Badge>
                            )}
                            <span className="ml-auto text-xs text-muted-foreground">
                                {inCountry.filter(x => on(x.id)).length} of {inCountry.length} cities
                                {listed ? " offered" : " priced separately"}
                            </span>
                        </div>
                        {inCountry.length === 0 ? (
                            <p className="px-4 py-3 text-xs text-muted-foreground">
                                No cities are recorded for {cr.country}.
                            </p>
                        ) : inCountry.map(x => (
                            <div key={x.id}
                                className="flex items-center gap-3 border-b px-4 py-2.5 last:border-0">
                                <span className="text-sm">{x.name}</span>
                                {x.isActive === false && (
                                    <Badge variant="outline" className="text-[10px]">city inactive</Badge>
                                )}
                                <span className="ml-auto flex items-center gap-2">
                                    <Switch checked={on(x.id)} disabled={closed || x.isActive === false}
                                        onCheckedChange={v => toggle(cr.country, x.id, v)} />
                                    <span className="w-36 text-xs text-muted-foreground">
                                        {listed
                                            ? (on(x.id) ? "offered" : "not offered")
                                            : (on(x.id) ? "own price" : "country price")}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                )
            })}
        </Card>
    )
}
