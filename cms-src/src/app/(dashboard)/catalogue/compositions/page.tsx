"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, Boxes, ChevronRight, AlertTriangle, Info } from "lucide-react"
import { ApiService } from "@/services/api"
import { City, Composition, Country, Listing, ProductStatus, SubDepartment, Tag } from "@/types"
import {
    COMPOSITION_KINDS, MONEY, RULE_LABELS, compositionGaps, pricedUnitsOf, resolveComposition,
    unitLabel, unitPrice,
} from "@/lib/composition"
import { LISTING_STATUSES, statusMeta } from "@/lib/listing-status"
import { CountrySwitcher } from "@/components/catalogue/CountrySwitcher"
import { ScopeMatrix } from "@/components/catalogue/ScopeMatrix"
import { EntityHistory } from "@/components/audit/EntityHistory"
import { toast } from "sonner"

const COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT"]

/**
 * Combos, programs, add-ons and freebies are one entity with different rules,
 * because they answer the same question: which priced units come together, and
 * what do they cost as a set. Flash sales are deliberately NOT here — a sale has
 * no members, it only modifies lines that already exist.
 */
export default function CompositionsPage() {
    const [comps, setComps] = useState<Composition[]>([])
    const [listings, setListings] = useState<Listing[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
    const [loading, setLoading] = useState(true)
    const [openId, setOpenId] = useState<string | null>(null)
    const [country, setCountry] = useState<Country>("UAE")
    const [pick, setPick] = useState("")

    useEffect(() => {
        Promise.allSettled([
            ApiService.catalogue.compositions(),
            ApiService.catalogue.listings(),
            ApiService.catalogue.tags(),
            ApiService.catalogue.cities(),
            ApiService.catalogue.subDepartments(),
        ]).then(([c, l, t, ci, sd]) => {
            if (c.status === "fulfilled") setComps(c.value)
            if (l.status === "fulfilled") setListings(l.value)
            if (t.status === "fulfilled") setTags(t.value)
            if (ci.status === "fulfilled") setCities(ci.value)
            if (sd.status === "fulfilled") setSubDepartments(sd.value)
            setLoading(false)
        })
    }, [])

    const patch = async (id: string, p: Partial<Composition>) => {
        const next = await ApiService.catalogue.updateComposition(id, p)
        setComps(prev => prev.map(c => (c.id === id ? next : c)))
    }
    const create = async (kind: Composition["kind"]) => {
        const meta = COMPOSITION_KINDS.find(k => k.id === kind)!
        const c = await ApiService.catalogue.createComposition({
            kind, nameEn: `New ${meta.label.toLowerCase()}`,
            rule: { kind: meta.defaultRule },
            trigger: { kind: kind === "combo" || kind === "program" ? "always" : "attach_to" },
            scopes: [{ id: `sc-new-${Date.now().toString(36)}`, country: "UAE", isActive: true, coverage: "country" }],
        })
        setComps(prev => [c, ...prev]); setOpenId(c.id)
        toast.success(`${meta.label} created`)
    }

    /** Every priced unit across every listing — the pool members are chosen from. */
    const pool = useMemo(() => listings.flatMap(l =>
        pricedUnitsOf(l).map(u => ({ ...u, listing: l }))), [listings])
    const poolFiltered = useMemo(() => {
        const q = pick.trim().toLowerCase()
        return pool.filter(u => !q
            || (u.listing.displayNameEn ?? "").toLowerCase().includes(q)
            || u.label.toLowerCase().includes(q)).slice(0, 40)
    }, [pool, pick])

    const kindBadge = (k: Composition["kind"]) =>
        ({ combo: "bg-blue-100 text-blue-700 border-blue-200",
           program: "bg-violet-100 text-violet-700 border-violet-200",
           addon: "bg-teal-100 text-teal-700 border-teal-200",
           freebie: "bg-amber-100 text-amber-700 border-amber-200" }[k])

    return (
        <div className="space-y-5 pb-16">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl space-y-1">
                    <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <Boxes className="h-5 w-5 text-primary" /> Compositions
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Combos, programs, add-ons and freebies are the same thing with different rules: a set of
                        priced units and what they cost together.
                    </p>
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" className="h-9"><Plus className="mr-2 h-4 w-4" /> New</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel className="text-xs">What are you composing?</DropdownMenuLabel>
                        {COMPOSITION_KINDS.map(k => (
                            <DropdownMenuItem key={k.id} className="flex-col items-start gap-0.5 py-1.5"
                                onClick={() => create(k.id)}>
                                <span className="text-xs font-medium">{k.label}</span>
                                <span className="text-[10px] text-muted-foreground">{k.blurb}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Card className="border-l-4 border-l-blue-500 p-3">
                <p className="text-xs font-semibold">Nothing composes listings — everything composes priced units</p>
                <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                    <p>A listing has <strong>no single price</strong>: money lives on variants, on Diagnostics
                        service options, and on Treatment plans.</p>
                    <p>So a member is a <strong>priced unit</strong> — a specific variant, service option or plan.
                        That is what makes a combo spanning three departments possible.</p>
                    <p>Flash sales are <strong>not</strong> here: a sale has no members, it only modifies lines that
                        already exist. Compositions produce lines.</p>
                </div>
            </Card>

            <CountrySwitcher countries={COUNTRIES} value={country} onChange={setCountry} />

            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : comps.map(c => {
                const isOpen = openId === c.id
                const st = statusMeta(c.status)
                const res = resolveComposition(c, listings, country)
                const gaps = compositionGaps(c, listings, subDepartments)
                const scopeRow = (c.scopes ?? []).find(r => r.country === country && !r.cityId)
                const meta = COMPOSITION_KINDS.find(k => k.id === c.kind)!
                return (
                    <Card key={c.id} className="overflow-hidden">
                        <button type="button" onClick={() => setOpenId(isOpen ? null : c.id)}
                            className="flex w-full flex-wrap items-center gap-2 border-b bg-muted/20 px-3 py-2 text-left">
                            <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                            <span className="text-sm font-medium">{c.nameEn}</span>
                            <Badge variant="outline" className={`text-[10px] ${kindBadge(c.kind)}`}>{meta.label}</Badge>
                            <Badge variant="outline" className={`text-[10px] ${st.className}`}>{st.label}</Badge>
                            <span className="text-[11px] text-muted-foreground">
                                {c.members.length} member{c.members.length === 1 ? "" : "s"} · {RULE_LABELS[c.rule.kind]}
                            </span>
                            <span className="ml-auto text-[11px]">
                                {/* three distinct states — the old readout printed one string for all of them */}
                                {res.total !== undefined ? (
                                    <>
                                        <strong>{MONEY[country].code} {res.total}</strong>
                                        {res.savings ? (
                                            <>
                                                <span className="ml-1 text-muted-foreground line-through">{res.memberSubtotal}</span>
                                                <span className="ml-1 text-green-700">save {res.savings}</span>
                                            </>
                                        ) : null}
                                    </>
                                ) : !scopeRow ? (
                                    <span className="text-muted-foreground">not sold in {country}</span>
                                ) : scopeRow.isActive === false ? (
                                    <span className="text-muted-foreground">{country} retired</span>
                                ) : res.blocking.length > 0 ? (
                                    <span className="text-amber-700">
                                        blocked in {country} — {unitLabel(res.blocking[0].member.ref, listings)}
                                    </span>
                                ) : (
                                    <span className="text-amber-700">no price set in {country}</span>
                                )}
                            </span>
                        </button>

                        {isOpen && (
                            <CardContent className="space-y-4 p-3">
                                {gaps.length > 0 && (
                                    <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3">
                                        <p className="text-xs font-semibold text-amber-900">Before this can go live</p>
                                        <ul className="mt-1 space-y-0.5">
                                            {gaps.slice(0, 8).map(g => (
                                                <li key={g} className="text-[11px] text-amber-900">· {g}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Name</Label>
                                        <Input className="h-8 text-xs" value={c.nameEn}
                                            onChange={e => patch(c.id, { nameEn: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Pricing rule</Label>
                                        <Select value={c.rule.kind}
                                            onValueChange={v => patch(c.id, { rule: { ...c.rule, kind: v as Composition["rule"]["kind"] } })}>
                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(RULE_LABELS).map(([k, label]) => (
                                                    <SelectItem key={k} value={k}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Status</Label>
                                        <Select value={c.status}
                                            onValueChange={v => patch(c.id, { status: v as ProductStatus })}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <span className="truncate">{st.label}</span>
                                            </SelectTrigger>
                                            <SelectContent className="w-80">
                                                {LISTING_STATUSES.map(s => (
                                                    <SelectItem key={s.id} value={s.id}
                                                        disabled={s.id === "active" && gaps.length > 0}
                                                        className="flex-col items-start gap-0.5 py-1.5">
                                                        <span className="text-xs font-medium">
                                                            {s.label}{s.id === "active" && gaps.length > 0 && " — fix the gaps first"}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">{s.blurb}</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* ── members ── */}
                                <div className="rounded-md border bg-muted/10 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-[11px] font-semibold">Members — priced units</p>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                                    <Plus className="mr-1 h-3 w-3" /> Add member
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-96">
                                                <div className="p-2">
                                                    <Input value={pick} onChange={e => setPick(e.target.value)}
                                                        placeholder="Search listings and units…" className="h-8 text-xs" />
                                                </div>
                                                <div className="max-h-72 overflow-y-auto">
                                                    {poolFiltered.map(u => (
                                                        <DropdownMenuItem key={`${u.ref.listingId}-${u.ref.unitId}`}
                                                            className="flex-col items-start gap-0.5 text-xs"
                                                            onClick={() => patch(c.id, {
                                                                members: [...c.members, {
                                                                    id: Math.random().toString(36).slice(2, 9),
                                                                    ref: u.ref, quantity: 1, required: true,
                                                                    sortOrder: c.members.length,
                                                                }],
                                                            })}>
                                                            <span>{u.listing.displayNameEn || u.listing.internalName}</span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {u.ref.kind.replace("_", " ")} · {u.label}
                                                            </span>
                                                        </DropdownMenuItem>
                                                    ))}
                                                    {poolFiltered.length === 0 && (
                                                        <p className="px-3 py-4 text-center text-[11px] text-muted-foreground">
                                                            No priced unit matches. A listing with no variant, service
                                                            option or plan has nothing sellable to compose.
                                                        </p>
                                                    )}
                                                </div>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {c.members.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground">No members yet.</p>
                                    ) : c.members.map(m => {
                                        const price = unitPrice(m.ref, listings, country)
                                        const isGrant = c.rule.kind === "grant_free" && c.rule.grantMemberId === m.id
                                        return (
                                            <div key={m.id} className="mb-1.5 flex flex-wrap items-center gap-2 rounded border bg-background px-2 py-1.5">
                                                <span className="text-[11px]">{unitLabel(m.ref, listings)}</span>
                                                <Badge variant="outline" className="text-[9px]">{m.ref.kind.replace("_", " ")}</Badge>
                                                {isGrant && (
                                                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[9px] text-amber-700">
                                                        granted free
                                                    </Badge>
                                                )}
                                                <span className={`text-[11px] ${price === undefined ? "text-amber-700" : "text-muted-foreground"}`}>
                                                    {price === undefined ? `unavailable in ${country}` : price}
                                                </span>
                                                <label className="ml-auto flex items-center gap-1 text-[10px]">
                                                    <input type="checkbox" checked={m.required}
                                                        onChange={e => patch(c.id, {
                                                            members: c.members.map(x => x.id === m.id ? { ...x, required: e.target.checked } : x),
                                                        })} />
                                                    required
                                                </label>
                                                {c.rule.kind === "grant_free" && (
                                                    <Button size="sm" variant="ghost" className="h-6 text-[10px]"
                                                        onClick={() => patch(c.id, { rule: { ...c.rule, grantMemberId: m.id } })}>
                                                        make free
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                                    onClick={() => patch(c.id, { members: c.members.filter(x => x.id !== m.id) })}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        )
                                    })}

                                    {/* the honest maths, shown rather than asserted */}
                                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t pt-2 text-[11px]">
                                        <span className="text-muted-foreground">
                                            Members separately <strong className="text-foreground">{res.memberSubtotal}</strong>
                                        </span>
                                        <span className="text-muted-foreground">
                                            This {COMPOSITION_KINDS.find(k => k.id === c.kind)!.label.toLowerCase()}{" "}
                                            <strong className="text-foreground">{res.total ?? "—"}</strong>
                                        </span>
                                        {res.savings ? <span className="text-green-700">saves {res.savings}</span> : null}
                                        {res.dropped.length > 0 && (
                                            <span className="text-muted-foreground">
                                                {res.dropped.length} optional member(s) dropped in {country}
                                            </span>
                                        )}
                                        {res.blocking.length > 0 && (
                                            <span className="flex items-center gap-1 text-amber-700">
                                                <AlertTriangle className="h-3 w-3" />
                                                required member unavailable — not sellable here
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* ── scope: one market at a time, one row table ── */}
                                <ScopeMatrix c={c} country={country} cities={cities} listings={listings}
                                    subDepartments={subDepartments}
                                    onChange={scopes => patch(c.id, { scopes })}
                                    onAllocationChange={a => patch(c.id, { rule: { ...c.rule, allocation: a } })} />
                                <div className="flex flex-wrap items-center gap-1.5">
                                    <Label className="text-[10px] text-muted-foreground">Sells in</Label>
                                    {COUNTRIES.map(ct => {
                                        const row = (c.scopes ?? []).find(r => r.country === ct && !r.cityId)
                                        const tone = !row ? "bg-muted text-muted-foreground"
                                            : row.isActive === false ? "bg-slate-100 text-slate-600 line-through"
                                                : "bg-green-100 text-green-800"
                                        return (
                                            <button key={ct} type="button" onClick={() => setCountry(ct)}
                                                className={`rounded px-2 py-0.5 text-[10px] ${tone} ${ct === country ? "ring-1 ring-primary" : ""}`}>
                                                {ct}
                                            </button>
                                        )
                                    })}
                                </div>

                                {/* ── where it appears ── */}
                                <div className="rounded-md border bg-muted/10 p-3">
                                    <p className="mb-2 text-[11px] font-semibold">Where it appears</p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-[11px]">Trigger</Label>
                                            <Select value={c.trigger.kind}
                                                onValueChange={v => patch(c.id, { trigger: { ...c.trigger, kind: v as "always" | "attach_to" } })}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="always">Own page — always offered</SelectItem>
                                                    <SelectItem value="attach_to">Attached to a parent listing</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {c.trigger.kind === "attach_to" && (
                                            <div className="space-y-1">
                                                <Label className="text-[11px]">Attach by campaign tag (preferred)</Label>
                                                <Select value={c.trigger.parentTagId ?? ""}
                                                    onValueChange={v => patch(c.id, { trigger: { ...c.trigger, parentTagId: v } })}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Pick a tag, or use listings below" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {tags.filter(t => t.status === "active").map(t => (
                                                            <SelectItem key={t.id} value={t.id}>
                                                                {t.namespace}:{t.nameEn}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Tag scope means adding a product to a live offer is one tag on the
                                                    listing, not an edit here.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    {c.trigger.kind === "attach_to" && (c.trigger.parentListingIds ?? []).length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {(c.trigger.parentListingIds ?? []).map(id => (
                                                <Badge key={id} variant="outline" className="text-[10px]">
                                                    {listings.find(l => l.id === id)?.displayNameEn ?? id}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {c.kind === "freebie" && (
                                    <>
                                        <Separator />
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Label className="text-[11px]">Max grants per order</Label>
                                            <Input type="number" className="h-7 w-24 text-xs" value={c.maxGrantsPerOrder ?? ""}
                                                onChange={e => patch(c.id, {
                                                    maxGrantsPerOrder: e.target.value === "" ? undefined : Number(e.target.value),
                                                })} />
                                            <p className="text-[10px] text-muted-foreground">
                                                How many free units one order may take is offer identity, so it stays
                                                whole-composition. The <strong>total</strong> cap is per market and lives on
                                                the scope row above — a Kuwait grant and a UAE grant are not worth the same
                                                money and must not share one budget.
                                            </p>
                                        </div>
                                    </>
                                )}

                                <EntityHistory entityType="composition" entityId={c.id} />
                            </CardContent>
                        )}
                    </Card>
                )
            })}

            <div className="flex gap-2 text-xs text-muted-foreground">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <p>A freebie is a <strong>real unit at zero</strong>, not a note — it still ships, still consumes
                    stock, and a free consultation still books a practitioner. That is why it is a member here rather
                    than a line of text on a plan.</p>
            </div>
        </div>
    )
}
