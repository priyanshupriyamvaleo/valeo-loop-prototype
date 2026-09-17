"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, MapPin, Plus, RotateCcw, ShieldCheck, X } from "lucide-react"
import {
    City, Composition, CompositionScope, Country, Listing, SubDepartment,
} from "@/types"
import {
    MONEY, RULE_ROW_FIELDS, compositionNotes, fromMarketInstant, marketOffset,
    memberCityCoverage, resolveComposition, subDeptRouting, toMarketInstant, unitLabel,
} from "@/lib/composition"

/**
 * Scope row ids, minted outside the component.
 *
 * `Date.now()` in a component body trips react-hooks/purity — the rule is right
 * even though these run from handlers, because an id read during render would
 * change on every pass. A counter is stable and needs no clock.
 */
let scopeSeq = 0
const scopeId = (parts: string[]) => `sc-${parts.join("-")}-${(scopeSeq++).toString(36)}`

/**
 * ONE market at a time, and one row table behind it.
 *
 * The old editor had three controls that each half-answered "where does this sell":
 * a row of country toggles, a four-input price grid, and a global date window. City
 * rows existed in the type and were unreachable from the UI. This edits the single
 * `Composition.scopes` table instead — and shows only the selected market, because a
 * four-country × many-city grid is exactly how the legacy `package_cities` table
 * reached 698 rows nobody maintained.
 *
 * City rows are therefore a DELIBERATE affordance, never a demanded one: no gap ever
 * asks for one. Coverage is shown beside them as derived information.
 */
export function ScopeMatrix({
    c, country, cities, listings, subDepartments, onChange, onAllocationChange,
    hideMoney = false,
}: {
    c: Composition
    country: Country
    cities: City[]
    listings: Listing[]
    subDepartments: SubDepartment[]
    onChange: (scopes: CompositionScope[]) => void
    onAllocationChange?: (a: "pro_rata_list" | "per_member") => void
    /**
     * Drop the price and percent inputs and keep only availability.
     *
     * The Package Builder authors ONE overall discount for the whole package,
     * so a per-row percent here would be a second place to type the same
     * number — and the two would disagree the moment either is used.
     */
    hideMoney?: boolean
}) {
    const [adding, setAdding] = useState("")
    const rows = c.scopes ?? []
    const countryRow = rows.find(r => r.country === country && !r.cityId)
    const cityRows = rows.filter(r => r.country === country && r.cityId)
    const reads: ("price" | "percent")[] = hideMoney ? [] : RULE_ROW_FIELDS[c.rule.kind]
    const money = MONEY[country]
    const inCountry = cities.filter(x => x.country === country)

    const res = useMemo(() => resolveComposition(c, listings, country), [c, listings, country])
    const notes = useMemo(
        () => compositionNotes(c, listings, subDepartments).filter(n => n.startsWith(country)),
        [c, listings, subDepartments, country])
    /** Distinct invoicing entities actually involved in this market. */
    const books = useMemo(() => new Set(
        c.members
            .map(m => subDeptRouting(m, listings, subDepartments, country))
            .filter(r => r.configured && !r.countryMissing && r.invoicingEnabled)
            .map(r => r.zohoBook)
            .filter(Boolean)), [c, listings, subDepartments, country])

    const write = (next: CompositionScope[]) => onChange(next)
    const setRow = (id: string, p: Partial<CompositionScope>) =>
        write(rows.map(r => (r.id === id ? { ...r, ...p } : r)))

    const addCountry = () => write([...rows, {
        id: scopeId([c.id, country.toLowerCase()]),
        country, isActive: true, coverage: "country",
    }])

    const addCity = (cityId: string) => write([...rows, {
        id: scopeId([c.id, cityId]),
        country, cityId, isActive: true,
    }])

    /**
     * Confirming a price records WHAT the members cost and WHICH members they were.
     * Without the membership half, adding one optional member reads as a 40% price
     * rise — a false positive in the only drift instrument there is.
     */
    const confirm = (id: string) => setRow(id, {
        basisSubtotal: res.memberSubtotal,
        basisMemberIds: c.members.map(m => m.id),
        setAt: new Date().toISOString(),
    })

    if (!countryRow) {
        return (
            <div className="rounded-md border border-dashed bg-muted/10 p-3">
                <p className="text-[11px] font-semibold">Not sold in {country}</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                    A composition with no row for a market does not sell there. That is deliberate — with four
                    regulators, four clocks and a Qatar that issues no invoices, an offer is never live somewhere
                    by default.
                </p>
                <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={addCountry}>
                    <Plus className="mr-1.5 h-3 w-3" /> Sell in {country}
                </Button>
            </div>
        )
    }

    const retired = countryRow.isActive === false
    const drift = res.driftPct
    const inverted = c.rule.kind === "bundle_price" && res.total !== undefined
        && res.total >= res.memberSubtotal

    return (
        <div className="space-y-2 rounded-md border bg-muted/10 p-3">
            <div className="flex flex-wrap items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[11px] font-semibold">{country} · {money.code}</p>
                {retired && (
                    <Badge variant="outline" className="border-slate-300 bg-slate-100 text-[10px] text-slate-700">
                        retired — cities below are closed too
                    </Badge>
                )}
                {res.priceSource === "city" && (
                    <Badge variant="outline" className="border-blue-200 bg-blue-50 text-[10px] text-blue-700">
                        city override in force
                    </Badge>
                )}
                <span className="ml-auto flex items-center gap-2">
                    <Label className="text-[10px] text-muted-foreground">Live here</Label>
                    <Switch checked={!retired}
                        onCheckedChange={v => setRow(countryRow.id, { isActive: v })} />
                </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
                {reads.includes("price") && (
                    <div className="space-y-1">
                        <Label className="text-[10px]">Bundle price ({money.code})</Label>
                        <Input type="number" className="h-8 text-xs" value={countryRow.price ?? ""}
                            onChange={e => setRow(countryRow.id, {
                                price: e.target.value === "" ? undefined : Number(e.target.value),
                            })} />
                    </div>
                )}
                {reads.includes("percent") && (
                    <div className="space-y-1">
                        <Label className="text-[10px]">Percent off members</Label>
                        <Input type="number" min={0} max={100} className="h-8 text-xs"
                            value={countryRow.percent ?? ""}
                            onChange={e => setRow(countryRow.id, {
                                /* A stored 0 reads as falsy in resolveComposition and yields
                                   NO PRICE, not a zero discount. Empty and zero both clear. */
                                percent: Number(e.target.value) > 0 ? Number(e.target.value) : undefined,
                            })} />
                    </div>
                )}
                <div className="space-y-1">
                    <Label className="text-[10px]">Coverage</Label>
                    <Select value={countryRow.coverage ?? "country"}
                        onValueChange={v => setRow(countryRow.id, { coverage: v as "country" | "cities_only" })}>
                        <SelectTrigger className="h-8 text-xs">
                            <span className="truncate">
                                {countryRow.coverage === "cities_only" ? "Listed cities only" : "Whole country"}
                            </span>
                        </SelectTrigger>
                        <SelectContent className="w-72">
                            <SelectItem value="country" className="flex-col items-start gap-0.5 py-1.5">
                                <span className="text-xs font-medium">Whole country</span>
                                <span className="text-[10px] text-muted-foreground">Sells anywhere in {country}.</span>
                            </SelectItem>
                            <SelectItem value="cities_only" className="flex-col items-start gap-0.5 py-1.5">
                                <span className="text-xs font-medium">Listed cities only</span>
                                <span className="text-[10px] text-muted-foreground">
                                    This row is a priced parent; only its city rows sell.
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px]">Shown on</Label>
                    <Select value={countryRow.visibleOn ?? "both"}
                        onValueChange={v => setRow(countryRow.id, { visibleOn: v as "app" | "web" | "both" })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="both">App and web</SelectItem>
                            <SelectItem value="app">App only</SelectItem>
                            <SelectItem value="web">Web only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* ── window, in the market's own clock ── */}
            <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1">
                    <Label className="text-[10px]">
                        Starts — {country} time (UTC{marketOffset(country)})
                    </Label>
                    <Input type="datetime-local" className="h-8 text-xs"
                        value={fromMarketInstant(countryRow.startsAt ?? "", country)}
                        onChange={e => setRow(countryRow.id, {
                            startsAt: e.target.value ? toMarketInstant(e.target.value, country) : undefined,
                        })} />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px]">Ends — {country} time</Label>
                    <Input type="datetime-local" className="h-8 text-xs"
                        value={fromMarketInstant(countryRow.endsAt ?? "", country)}
                        onChange={e => setRow(countryRow.id, {
                            endsAt: e.target.value ? toMarketInstant(e.target.value, country) : undefined,
                        })} />
                </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
                Stored as an instant with its offset, not a wall clock — KSA, Qatar and Kuwait sit at +03 while UAE
                is +04, so &ldquo;9am&rdquo; alone is silently wrong in three of the four markets.
            </p>

            {/* ── audience, per market ── */}
            <div className="flex flex-wrap items-center gap-2 border-t pt-2">
                <Label className="text-[10px]">Audience in {country}</Label>
                <Select value={countryRow.audience?.kind ?? "public"}
                    onValueChange={v => setRow(countryRow.id, {
                        audience: v === "public" ? { kind: "public" } : { kind: "partner_exclusive", partnerIds: [] },
                    })}>
                    <SelectTrigger className="h-7 w-48 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="partner_exclusive">Partner exclusive</SelectItem>
                    </SelectContent>
                </Select>
                {c.kind === "freebie" && (
                    <span className="ml-auto flex items-center gap-2">
                        <Label className="text-[10px]">Grant cap in {country}</Label>
                        <Input type="number" className="h-7 w-24 text-xs" value={countryRow.maxGrantsTotal ?? ""}
                            onChange={e => setRow(countryRow.id, {
                                maxGrantsTotal: e.target.value === "" ? undefined : Number(e.target.value),
                            })} />
                    </span>
                )}
            </div>

            {/* ── derived maths ── */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-[11px]">
                <span className="text-muted-foreground">
                    Members separately <strong className="text-foreground">{money.code} {res.memberSubtotal}</strong>
                </span>
                <span className="text-muted-foreground">
                    This offer <strong className="text-foreground">
                        {res.total !== undefined ? `${money.code} ${res.total}` : "—"}
                    </strong>
                </span>
                {res.savings ? <span className="text-green-700">saves {res.savings}</span> : null}
                {res.grantedValue !== undefined && (
                    <span className="text-amber-700">gives away {money.code} {res.grantedValue}</span>
                )}
                {inverted && (
                    <span className="flex items-center gap-1 font-medium text-red-700">
                        <AlertTriangle className="h-3 w-3" /> no saving — the bundle costs at least its parts
                    </span>
                )}
                {res.membershipChanged && (
                    <span className="text-amber-700">membership changed since the price was set — re-confirm</span>
                )}
                {drift !== undefined && !res.membershipChanged && Math.abs(drift) >= 5 && (
                    <span className={`font-medium ${drift > 0 ? "text-amber-700" : "text-blue-700"}`}>
                        members moved {drift > 0 ? "+" : ""}{drift}% since{" "}
                        {countryRow.setAt ? new Date(countryRow.setAt).toLocaleDateString() : "the price was set"}
                    </span>
                )}
                {reads.includes("price") && countryRow.price !== undefined && (
                    <Button size="sm" variant="ghost" className="ml-auto h-6 px-2 text-[10px]"
                        onClick={() => confirm(countryRow.id)}>
                        <ShieldCheck className="mr-1 h-3 w-3" /> Confirm price at today&apos;s subtotal
                    </Button>
                )}
            </div>

            {/* ── routing: who invoices, per member ── */}
            {subDepartments.length > 0 && (
                <div className="space-y-1 border-t pt-2">
                    <p className="text-[10px] font-semibold text-muted-foreground">Who invoices this in {country}</p>
                    {c.members.map(m => {
                        const r = subDeptRouting(m, listings, subDepartments, country)
                        return (
                            <div key={m.id} className="flex flex-wrap items-center gap-1.5 text-[10px]">
                                <span className="text-muted-foreground">{unitLabel(m.ref, listings)}</span>
                                {!r.configured ? (
                                    <Badge variant="outline" className="text-[9px]">routing not configured</Badge>
                                ) : r.countryMissing ? (
                                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[9px] text-amber-800">
                                        no {country} invoicing entity
                                    </Badge>
                                ) : !r.invoicingEnabled ? (
                                    <Badge variant="outline" className="text-[9px]">priced, no invoice issued</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[9px]">
                                        {r.zohoBook} · VAT {r.vat ?? 0}% {r.vatMode}
                                    </Badge>
                                )}
                            </div>
                        )
                    })}
                    <p className="text-[10px] text-muted-foreground">
                        One bundle price spanning two invoicing entities is <strong>refused until the basis is
                        declared</strong> — which entity gets which share is a finance decision, so it is chosen here
                        rather than guessed by the resolver.
                    </p>
                    {onAllocationChange && books.size > 1 && c.rule.kind === "bundle_price" && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                            <Label className="text-[10px]">Split basis</Label>
                            <Select value={c.rule.allocation ?? ""}
                                onValueChange={v => onAllocationChange(v as "pro_rata_list" | "per_member")}>
                                <SelectTrigger className="h-7 w-64 text-[10px]">
                                    <SelectValue placeholder="Not declared — blocks publishing" />
                                </SelectTrigger>
                                <SelectContent className="w-80">
                                    <SelectItem value="pro_rata_list" className="flex-col items-start gap-0.5 py-1.5">
                                        <span className="text-xs font-medium">Pro rata on member list prices</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            Each entity takes the share its member contributes to the subtotal.
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="per_member" className="flex-col items-start gap-0.5 py-1.5">
                                        <span className="text-xs font-medium">Negotiated per member</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            Finance types each entity&apos;s amount. Not yet wired.
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            )}

            {/* ── city overrides ── */}
            <div className="space-y-1.5 border-t pt-2">
                <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[10px] font-semibold text-muted-foreground">
                        City overrides in {country} ({cityRows.length})
                    </p>
                    <Select value={adding} onValueChange={v => { addCity(v); setAdding("") }}>
                        <SelectTrigger className="h-7 w-56 text-[10px]">
                            <SelectValue placeholder="Add a city override…" />
                        </SelectTrigger>
                        <SelectContent>
                            {inCountry.filter(x => !cityRows.some(r => r.cityId === x.id)).map(x => (
                                <SelectItem key={x.id} value={x.id}>{x.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                {cityRows.length === 0 && (
                    <p className="text-[10px] text-muted-foreground">
                        None — and nothing will ever ask for one. A city row is for a price that genuinely differs
                        there; serviceability is derived from the members, never typed here.
                    </p>
                )}
                {cityRows.map(r => {
                    const city = cities.find(x => x.id === r.cityId)
                    const blocked = c.members
                        .map(m => ({ m, s: memberCityCoverage(m, listings, country, r.cityId!) }))
                        .filter(x => x.s === "not_serviceable")
                    const noop = r.price !== undefined && r.price === countryRow.price
                    return (
                        <div key={r.id} className="flex flex-wrap items-center gap-2 rounded border bg-background/60 px-2 py-1.5">
                            <span className="text-[11px] font-medium">{city?.name ?? r.cityId}</span>
                            {reads.includes("price") && (
                                <Input type="number" className="h-7 w-28 text-xs"
                                    placeholder={`inherits ${countryRow.price ?? "—"}`}
                                    value={r.price ?? ""}
                                    onChange={e => setRow(r.id, {
                                        price: e.target.value === "" ? undefined : Number(e.target.value),
                                    })} />
                            )}
                            {reads.includes("percent") && (
                                /* A percent_off_members composition prices by percent, so a
                                   city that needs its own number needs this box. Without it
                                   the row could be created and retired but never say
                                   anything, which is what a protocol package needs most. */
                                <Input type="number" min={0} max={100} className="h-7 w-32 text-xs"
                                    placeholder={`inherits ${countryRow.percent ?? "—"}%`}
                                    value={r.percent ?? ""}
                                    onChange={e => setRow(r.id, {
                                        /* Empty AND zero both mean "inherit". A stored 0 is
                                           read as falsy by resolveComposition, which yields no
                                           price at all rather than no discount — a silently
                                           dead city. */
                                        percent: Number(e.target.value) > 0 ? Number(e.target.value) : undefined,
                                    })} />
                            )}
                            {noop && (
                                <Badge variant="outline" className="text-[9px]">same as country — no override</Badge>
                            )}
                            {r.isActive === false && (
                                <Badge variant="outline" className="text-[9px]">retired — inherits the country row</Badge>
                            )}
                            {blocked.map(b => (
                                <Badge key={b.m.id} variant="outline"
                                    className="border-amber-200 bg-amber-50 text-[9px] text-amber-800">
                                    {unitLabel(b.m.ref, listings)} not serviceable here
                                </Badge>
                            ))}
                            <span className="ml-auto flex items-center gap-1">
                                <Button size="sm" variant="ghost" className="h-6 px-1.5 text-[10px]"
                                    onClick={() => setRow(r.id, { isActive: r.isActive === false })}>
                                    {r.isActive === false
                                        ? <><RotateCcw className="mr-1 h-3 w-3" /> restore</>
                                        : <><X className="mr-1 h-3 w-3" /> retire</>}
                                </Button>
                            </span>
                        </div>
                    )
                })}
                <p className="text-[10px] text-muted-foreground">
                    Retiring keeps the row and its baseline. Nothing deletes — a market paused for a quarter comes
                    back with its price history intact instead of looking brand new.
                </p>
            </div>

            {notes.length > 0 && (
                <div className="space-y-0.5 border-t pt-2">
                    {notes.map(n => (
                        <p key={n} className="text-[10px] text-muted-foreground">· {n}</p>
                    ))}
                </div>
            )}
        </div>
    )
}
