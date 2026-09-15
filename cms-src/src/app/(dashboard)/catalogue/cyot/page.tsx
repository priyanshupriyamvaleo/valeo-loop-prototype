"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    AlertTriangle, Layers, Sigma, FlaskConical, Beaker, CheckCircle2, Info, X,
} from "lucide-react"
import { ApiService } from "@/services/api"
import type {
    Biomarker, BiomarkerLabMapping, BiomarkerPanel, City, Country, CyotComponentPrice, CyotConfig,
    DiagnosticsLab, TubeType,
} from "@/types"
import { priceBasket, routeBasket, routedCost, basketMargin, cyotConfigGaps } from "@/lib/cyot"
import { tubeOf } from "@/lib/biomarkers"
import { ComponentPriceSheet } from "@/components/catalogue/ComponentPriceSheet"
import { SectionHelp } from "@/components/catalogue/SectionHelp"
import { toast } from "sonner"

/**
 * Create Your Own Test.
 *
 * The selection unit here is the ANALYTE. Today it is a mini package — a wrapper
 * around a set of tests — and the total is a plain sum over the selected
 * wrappers with no deduplication, so two selections sharing a test are both
 * charged in full. This screen exists to make that difference visible per
 * basket, because it is the change that moves revenue at cutover.
 */
export default function CyotPage() {
    const [biomarkers, setBiomarkers] = useState<Biomarker[]>([])
    const [panels, setPanels] = useState<BiomarkerPanel[]>([])
    const [prices, setPrices] = useState<CyotComponentPrice[]>([])
    const [mappings, setMappings] = useState<BiomarkerLabMapping[]>([])
    const [configs, setConfigs] = useState<CyotConfig[]>([])
    const [labs, setLabs] = useState<DiagnosticsLab[]>([])
    const [cities, setCities] = useState<City[]>([])

    const [country, setCountry] = useState<Country>("UAE")
    const [cityId, setCityId] = useState<string>("city-1")
    const [pickedBiomarkers, setPickedBiomarkers] = useState<string[]>([])
    const [pickedPanels, setPickedPanels] = useState<string[]>([])
    const [query, setQuery] = useState("")

    useEffect(() => {
        Promise.all([
            ApiService.catalogue.biomarkers(),
            ApiService.catalogue.biomarkerPanels(),
            ApiService.catalogue.cyotComponentPrices(),
            ApiService.catalogue.biomarkerLabMappings(),
            ApiService.catalogue.cyotConfig(),
            ApiService.catalogue.diagnosticsLabs(),
            ApiService.catalogue.cities(),
        ]).then(([b, p, pr, m, c, l, ci]) => {
            setBiomarkers(b); setPanels(p); setPrices(pr); setMappings(m)
            setConfigs(c); setLabs(l); setCities(ci)
        })
    }, [])

    const config = configs.find(c => c.country === country)
    const countryCities = useMemo(
        () => cities.filter(c => c.country === country && c.isActive), [cities, country])

    // Switching market re-points the city in the same render rather than in an
    // effect — an effect would price one frame against a city in another country.
    const effectiveCityId = countryCities.some(c => c.id === cityId)
        ? cityId
        : countryCities[0]?.id ?? ""
    const activeScope = useMemo(() => ({ country, cityId: effectiveCityId }), [country, effectiveCityId])

    const basket = useMemo(() => priceBasket(
        { biomarkerIds: pickedBiomarkers, panelIds: pickedPanels },
        activeScope, biomarkers, panels, prices, config,
    ), [pickedBiomarkers, pickedPanels, activeScope, biomarkers, panels, prices, config])

    const routing = useMemo(() => routeBasket(basket, activeScope, biomarkers, mappings),
        [basket, activeScope, biomarkers, mappings])

    const cost = routedCost(routing, activeScope, mappings)
    const margin = basketMargin(basket, cost)
    const gaps = config ? cyotConfigGaps(config, prices, biomarkers) : []
    const labName = (id: string) => labs.find(l => l.id === id)?.nameEn ?? id

    const selectable = useMemo(() => biomarkers.filter(b =>
        b.isActive && b.lifecycle !== "deprecated" && (b.countryAvailability ?? []).includes(country)),
        [biomarkers, country])

    const shown = useMemo(() => {
        const q = query.trim().toLowerCase()
        return q ? selectable.filter(b => b.nameEn.toLowerCase().includes(q)) : selectable
    }, [selectable, query])

    const inBasket = new Set(basket.lines.map(l => l.biomarkerId))
    const clear = () => { setPickedBiomarkers([]); setPickedPanels([]) }

    /** The sheet owns the whole set, so a write replaces it and persists in one go. */
    const savePrices = async (next: CyotComponentPrice[]) => {
        setPrices(next)
        await ApiService.catalogue.saveCyotComponentPrices(next)
    }

    return (
        <div className="space-y-5">
            <div>
                <h1 className="text-2xl font-semibold tracking-tight">Create Your Own Test</h1>
                <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                    The customer picks biomarkers, and the basket is charged as the deduplicated union of
                    everything those picks resolve to. An biomarker becomes selectable without becoming a
                    product: the price belongs to this channel, not to the biomarker.
                </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
                <div className="w-36">
                    <Label className="text-xs">Market</Label>
                    <Select value={country} onValueChange={v => { setCountry(v as Country); clear() }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {(["UAE", "KSA", "QATAR", "KUWAIT"] as Country[]).map(c =>
                                <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-48">
                    <Label className="text-xs">City</Label>
                    <Select value={effectiveCityId} onValueChange={setCityId}>
                        <SelectTrigger><SelectValue placeholder="No cities" /></SelectTrigger>
                        <SelectContent>
                            {countryCities.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {config
                    ? <Badge variant="outline" className="mb-1.5">
                        {config.minSelections ?? "–"}–{config.maxSelections ?? "–"} biomarkers
                        {config.assemblyFee ? ` · ${config.assemblyFee} assembly fee` : ""}
                      </Badge>
                    : <Badge variant="outline" className="mb-1.5 border-amber-200 bg-amber-50 text-amber-700">
                        Not configured in {country}
                      </Badge>}
            </div>

            {gaps.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="space-y-1 p-4 text-sm text-amber-900">
                        <p className="flex items-center gap-2 font-medium text-amber-700">
                            <Info className="h-4 w-4" /> Channel readiness in {country}
                        </p>
                        {gaps.map((g, i) => <p key={i}>{g}</p>)}
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="basket">
                <TabsList>
                    <TabsTrigger value="basket">Basket simulator</TabsTrigger>
                    <TabsTrigger value="prices">Component prices</TabsTrigger>
                </TabsList>

                <TabsContent value="prices" className="space-y-3 pt-2">
                    <SectionHelp sectionId="cyot" />
                    <ComponentPriceSheet
                        biomarkers={biomarkers}
                        cities={cities}
                        countries={(["UAE", "KSA", "QATAR", "KUWAIT"] as Country[])}
                        prices={prices}
                        onChange={savePrices}
                    />
                </TabsContent>

                <TabsContent value="basket" className="pt-2">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_400px]">
                {/* ── Picker ────────────────────────────────── */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Layers className="h-4 w-4" /> Panels
                            </CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Choosing a panel selects every member. A panel is not sellable itself — it
                                expands, and the union is what gets charged.
                            </p>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {panels.filter(p => p.isActive).map(p => {
                                const on = pickedPanels.includes(p.id)
                                return (
                                    <button key={p.id}
                                        onClick={() => setPickedPanels(cur =>
                                            on ? cur.filter(x => x !== p.id) : [...cur, p.id])}
                                        className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                                            on ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                                        <span className="font-medium">{p.nameEn}</span>
                                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                            {p.memberIds.length} biomarkers
                                            {p.labPanelCode ? ` · ${p.labPanelCode}` : " · no lab code"}
                                        </span>
                                    </button>
                                )
                            })}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <FlaskConical className="h-4 w-4" /> Biomarkers
                                </CardTitle>
                                <Input className="h-8 w-56" placeholder="Search biomarkers"
                                    value={query} onChange={e => setQuery(e.target.value)} />
                            </div>
                            <p className="mt-1 text-xs text-muted-foreground">
                                {selectable.length} offered in {country}. Greyed rows are already covered by
                                a panel or pulled in as a calculated value&rsquo;s input — picking one again would
                                not charge twice.
                            </p>
                        </CardHeader>
                        <Separator />
                        <CardContent className="max-h-[420px] overflow-y-auto p-3">
                            <div className="grid gap-1.5 sm:grid-cols-2">
                                {shown.map(b => {
                                    const picked = pickedBiomarkers.includes(b.id)
                                    const covered = inBasket.has(b.id) && !picked
                                    const price = prices.find(p =>
                                        p.biomarkerId === b.id && p.country === country && p.cityId === effectiveCityId)
                                        ?? prices.find(p => p.biomarkerId === b.id && p.country === country && !p.cityId)
                                    return (
                                        <button key={b.id}
                                            onClick={() => setPickedBiomarkers(cur =>
                                                picked ? cur.filter(x => x !== b.id) : [...cur, b.id])}
                                            className={`flex items-center justify-between gap-2 rounded border px-2.5 py-2 text-left text-sm transition ${
                                                picked ? "border-primary bg-primary/5"
                                                    : covered ? "border-dashed opacity-55"
                                                    : "hover:bg-muted/50"}`}>
                                            <span className="min-w-0">
                                                <span className="block truncate font-medium">{b.nameEn}</span>
                                                <span className="block text-[10px] text-muted-foreground">
                                                    {covered ? "already included" : b.isDerived ? "calculated" : b.unitUcum ?? "no unit"}
                                                </span>
                                            </span>
                                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                                                {price ? price.price : <span className="text-red-600">—</span>}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Basket ────────────────────────────────── */}
                <div className="space-y-4">
                    <Card className="lg:sticky lg:top-4">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-base">Basket</CardTitle>
                                {basket.lines.length > 0 && (
                                    <Button variant="ghost" size="sm" onClick={clear}>
                                        <X className="mr-1 h-3.5 w-3.5" /> Clear
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <Separator />
                        <CardContent className="space-y-3 pt-4">
                            {!basket.lines.length && (
                                <p className="py-6 text-center text-sm text-muted-foreground">
                                    Pick a panel or an biomarker.
                                </p>
                            )}

                            {basket.lines.length > 0 && (
                                <>
                                    <div className="max-h-56 space-y-1 overflow-y-auto">
                                        {basket.lines.map(l => (
                                            <div key={l.biomarkerId} className="flex items-baseline justify-between gap-2 text-sm">
                                                <span className="min-w-0">
                                                    <span className="truncate">{l.nameEn}</span>
                                                    {l.addedByExpansion && (
                                                        <span className="ml-1.5 text-[10px] text-muted-foreground">
                                                            {l.reason}
                                                        </span>
                                                    )}
                                                    {l.isDerived && <Sigma className="ml-1 inline h-3 w-3 text-violet-600" />}
                                                </span>
                                                <span className="shrink-0 tabular-nums">
                                                    {l.price !== undefined
                                                        ? l.price
                                                        : <span className="text-xs text-red-600">unpriced</span>}
                                                    {l.grain === "city" && (
                                                        <span className="ml-1 text-[10px] text-muted-foreground">city</span>
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />
                                    <div className="space-y-1.5 text-sm">
                                        <Row k={`Components (${basket.analyteCount})`} v={basket.componentTotal} />
                                        {basket.assemblyFee !== undefined && (
                                            <Row k="Assembly fee" v={basket.assemblyFee} />
                                        )}
                                        <div className="flex justify-between pt-1 text-base font-semibold">
                                            <span>Total</span><span className="tabular-nums">{basket.total}</span>
                                        </div>
                                    </div>

                                    {basket.dedupedAway.length > 0 && (
                                        <div className="rounded-md border-l-2 border-emerald-400 bg-emerald-50/60 px-3 py-2 text-xs text-emerald-900">
                                            <p className="font-medium">Charged once, not twice</p>
                                            <p className="mt-0.5">
                                                {basket.dedupedAway.map(d => `${d.nameEn} (×${d.times})`).join(", ")} appear
                                                in more than one selection. Today&rsquo;s plain sum would charge{" "}
                                                <strong className="tabular-nums">{basket.legacyStyleTotal}</strong> for
                                                this basket — {basket.legacyStyleTotal - basket.componentTotal} more.
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                        <Fact k="Fasting" v={basket.fastingHours ? `${basket.fastingHours} h` : "none"} />
                                        <Fact k="Turnaround" v={basket.tatHours ? `${basket.tatHours} h` : "—"} />
                                        <Fact k="Specimens" v={basket.specimens.join(", ") || "—"} />
                                        <Fact k="Tubes" v={basket.tubes.map(t => tubeOf(t)?.label.split(" — ")[0]).join(", ") || "—"} />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        All four are derived from the set — none is typed anywhere.
                                    </p>

                                    {basket.errors.map((e, i) => (
                                        <p key={i} className="rounded-md border-l-2 border-red-400 bg-red-50/60 px-3 py-2 text-xs text-red-900">{e}</p>
                                    ))}
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {basket.lines.length > 0 && (
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Beaker className="h-4 w-4" /> Fulfilment
                                </CardTitle>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Checked here, at selection — not discovered after the order is placed.
                                    Only drawn biomarkers are routed; a calculated value consumes no specimen.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                {routing.singleLabId && (
                                    <p className="flex items-center gap-2 text-emerald-700">
                                        <CheckCircle2 className="h-4 w-4" />
                                        One requisition — {labName(routing.singleLabId)}
                                    </p>
                                )}
                                {!routing.singleLabId && routing.split.length > 0 && (
                                    <div className="space-y-1">
                                        {routing.split.map(s => (
                                            <p key={s.labId} className="text-xs">
                                                <span className="font-medium">{labName(s.labId)}</span>
                                                {" — "}{s.biomarkerIds.length} biomarkers
                                            </p>
                                        ))}
                                    </div>
                                )}
                                {routing.errors.map((e, i) => (
                                    <p key={i} className="flex gap-2 rounded-md border-l-2 border-red-400 bg-red-50/60 px-3 py-2 text-xs text-red-900">
                                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{e}
                                    </p>
                                ))}
                                {(routing.prescriptionRequired || routing.consentRequired) && (
                                    <p className="rounded-md border-l-2 border-amber-400 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
                                        This basket needs{" "}
                                        {[routing.prescriptionRequired && "a prescription",
                                          routing.consentRequired && "written consent"].filter(Boolean).join(" and ")}
                                        {" "}— the customer has to be told before they pay, not after.
                                    </p>
                                )}
                                {margin && (
                                    <div className="flex items-baseline justify-between border-t pt-2 text-xs">
                                        <span className="text-muted-foreground">Lab cost {margin.cost}</span>
                                        <span className={margin.margin < 0 ? "font-medium text-red-600" : "font-medium"}>
                                            margin {margin.margin} ({margin.pct.toFixed(0)}%)
                                        </span>
                                    </div>
                                )}
                                {margin && (
                                    <p className="text-[10px] text-muted-foreground">
                                        Reported, never enforced. Nothing in the model compares cost to price at
                                        authoring time, and who owns that gate is still an open decision.
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

                </TabsContent>
            </Tabs>

            <p className="text-xs text-muted-foreground">
                Base prices can also be set one biomarker at a time on the{" "}
                <Link href="/catalogue/biomarkers" className="underline">biomarker</Link> screens;
                the sheet above is the same rows, with every city visible at once.
            </p>
        </div>
    )
}

const Row = ({ k, v }: { k: string; v: number }) => (
    <div className="flex justify-between text-muted-foreground">
        <span>{k}</span><span className="tabular-nums">{v}</span>
    </div>
)

const Fact = ({ k, v }: { k: string; v: string }) => (
    <div className="rounded border px-2 py-1.5">
        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">{k}</span>
        <span className="block truncate capitalize">{v}</span>
    </div>
)
