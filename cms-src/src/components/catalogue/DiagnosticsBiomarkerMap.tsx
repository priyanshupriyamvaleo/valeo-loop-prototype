"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, ChevronRight, Search, AlertTriangle, Copy, FlaskConical, Info } from "lucide-react"
import { ApiService } from "@/services/api"
import { Biomarker, BiomarkerCountryMap, Country, DiagnosticsConfig } from "@/types"
import { biomarkerDrift, derivedMarkerNote, groupBiomarkers, SAMPLE_KINDS } from "@/lib/diagnostics"
import { CountrySwitcher } from "@/components/catalogue/CountrySwitcher"
import { PackageCompositionFacts } from "@/components/catalogue/PackageCompositionFacts"

const SEVERITY: Record<string, { label: string; cls: string }> = {
    none: { label: "identical", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    minor: { label: "minor drift", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    moderate: { label: "moderate drift", cls: "bg-orange-100 text-orange-700 border-orange-200" },
    severe: { label: "SEVERE drift", cls: "bg-red-100 text-red-700 border-red-200" },
}

/**
 * Map biomarkers per country. Country-level is mandatory, not a nicety: in the
 * live blood data 19 of 32 cross-country packages carry different marker sets,
 * and the worst (YPO Longevity) is UAE 73 vs KSA 68 with only 61 shared.
 */
export function DiagnosticsBiomarkerMap({ config, onChange, countries }: {
    config: DiagnosticsConfig
    onChange: (patch: Partial<DiagnosticsConfig>) => void
    countries: Country[]
}) {
    const [master, setMaster] = useState<Biomarker[]>([])
    const [active, setActive] = useState<Country | null>(countries[0] ?? null)
    const [query, setQuery] = useState("")

    useEffect(() => { ApiService.catalogue.biomarkers().then(setMaster) }, [])
    useEffect(() => {
        if (!active || !countries.includes(active)) setActive(countries[0] ?? null)
    }, [countries, active])

    const maps = config.biomarkerCountryMaps ?? []
    const byId = useMemo(() => new Map(master.map(b => [b.id, b])), [master])
    const drift = useMemo(() => biomarkerDrift(maps), [maps])
    const unmapped = countries.filter(c => !maps.some(m => m.country === c))
    const biomarkerCountFor = (c: Country) => {
        const m = maps.find(x => x.country === c)
        return m ? m.biomarkerIds.length : "—"
    }

    const setMaps = (next: BiomarkerCountryMap[]) => onChange({ biomarkerCountryMaps: next })
    const patchMap = (country: Country, patch: Partial<BiomarkerCountryMap>) =>
        setMaps(maps.map(m => (m.country === country ? { ...m, ...patch } : m)))
    const addCountry = (country: Country) =>
        setMaps([...maps, { country, biomarkerIds: [], nonBiomarkerTestIds: [] }])
    const toggle = (country: Country, id: string) => {
        const m = maps.find(x => x.country === country)
        if (!m) return
        patchMap(country, {
            biomarkerIds: m.biomarkerIds.includes(id)
                ? m.biomarkerIds.filter(x => x !== id)
                : [...m.biomarkerIds, id],
        })
    }
    /** Copying a country is how most packages actually start life. */
    const copyFrom = (target: Country, source: Country) => {
        const src = maps.find(m => m.country === source)
        if (src) patchMap(target, { biomarkerIds: [...src.biomarkerIds] })
    }

    const q = query.trim().toLowerCase()
    const grouped = useMemo(() => groupBiomarkers(
        master.filter(b => !q || b.nameEn.toLowerCase().includes(q) || String(b.legacyId ?? "").includes(q))
    ), [master, q])

    return (
        <Card className="border-l-4 border-l-rose-500">
            <CardHeader className="py-3">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <FlaskConical className="h-4 w-4 text-rose-600" />
                            <span className="text-sm font-semibold">Biomarkers — mapped per country</span>
                            {maps.length > 1 && (
                                <Badge variant="outline" className={`text-[10px] ${SEVERITY[drift.severity].cls}`}>
                                    {SEVERITY[drift.severity].label}
                                </Badge>
                            )}
                        </div>
                        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                            The same package legitimately runs different markers in different countries — lab
                            availability and registration differ. Map each country separately; the CMS shows you the
                            drift so a deliberate difference never looks the same as an accident.
                        </p>
                    </div>
                    {unmapped.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs">
                                    <Plus className="mr-1 h-3.5 w-3.5" /> Add country
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel className="text-xs">Map biomarkers for…</DropdownMenuLabel>
                                {unmapped.map(c => (
                                    <DropdownMenuItem key={c} className="text-xs" onClick={() => addCountry(c)}>
                                        {c}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
                {countries.length === 0 && (
                    <div className="flex gap-2 rounded-md border border-dashed bg-muted/10 p-3 text-xs">
                        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <p>Enable a country in <strong>Country Availability &amp; Config</strong> first — biomarkers
                            are mapped against the countries this package is actually sold in.</p>
                    </div>
                )}

                {/* Drift summary — the number that matters is how many markers are NOT everywhere. */}
                {maps.length > 1 && (
                    <div className={`rounded-md border p-3 ${drift.severity === "severe" ? "border-red-200 bg-red-50/50" : "bg-muted/20"}`}>
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                            {drift.severity === "severe" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                            <span><strong>{drift.shared.length}</strong> shared by all</span>
                            <span><strong>{drift.union.length}</strong> in the union</span>
                            <span className={drift.differBy > 0 ? "text-amber-700" : ""}>
                                <strong>{drift.differBy}</strong> not in every country
                            </span>
                            {drift.perCountry.map(pc => (
                                <span key={pc.country} className="text-muted-foreground">
                                    {pc.country} <strong className="text-foreground">{pc.count}</strong>
                                </span>
                            ))}
                        </div>
                        {drift.differBy > 0 && (
                            <p className="mt-2 text-[11px] text-muted-foreground">
                                {drift.perCountry.filter(pc => pc.missing.length > 0).map(pc => (
                                    <span key={pc.country} className="mr-3">
                                        {pc.country} is missing {pc.missing.length}: {pc.missing.slice(0, 5)
                                            .map(id => byId.get(id)?.nameEn ?? id).join(", ")}
                                        {pc.missing.length > 5 && ` +${pc.missing.length - 5} more`}
                                    </span>
                                ))}
                            </p>
                        )}
                    </div>
                )}

                {countries.length > 0 && active && (
                    <CountrySwitcher countries={countries} value={active} onChange={setActive}
                        counts={Object.fromEntries(countries.map(c => [c, biomarkerCountFor(c)])) as Partial<Record<Country, string | number>>} />
                )}

                {maps.filter(m => m.country === active).map(m => {
                    const isOpen = true
                    const selected = m.biomarkerIds
                    return (
                        <div key={m.country} className="overflow-hidden rounded-md border">
                            <div className="flex items-center gap-2 bg-muted/20 px-3 py-2">
                                <div className="flex flex-1 items-center gap-2">
                                    <span className="text-xs font-medium">{m.country}</span>
                                    {/* Derived, never typed — legacy notes overstated counts by up to 30. */}
                                    <Badge variant="outline" className="text-[10px]">
                                        {derivedMarkerNote({ ...config, biomarkerCountryMaps: maps }, m.country)}
                                    </Badge>
                                    {selected.length === 0 && (
                                        <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-700">
                                            none mapped
                                        </Badge>
                                    )}
                                    {m.intentionalNote && (
                                        <Badge variant="outline" className="text-[10px]">difference is intentional</Badge>
                                    )}
                                </div>
                                {maps.length > 1 && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 text-[10px]">
                                                <Copy className="mr-1 h-3 w-3" /> Copy from
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {maps.filter(x => x.country !== m.country).map(x => (
                                                <DropdownMenuItem key={x.country} className="text-xs"
                                                    onClick={() => copyFrom(m.country, x.country)}>
                                                    {x.country} ({x.biomarkerIds.length})
                                                </DropdownMenuItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                    onClick={() => setMaps(maps.filter(x => x.country !== m.country))}
                                    title="Stop mapping this country">
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            {isOpen && (
                                <div className="space-y-3 p-3">
                                    {/* What this set implies, and what it blocks — all derived. */}
                                    <PackageCompositionFacts
                                        country={m.country}
                                        selectedIds={selected}
                                        onAdd={ids => patchMap(m.country, {
                                            biomarkerIds: [...new Set([...selected, ...ids])],
                                        })}
                                        onRemove={ids => patchMap(m.country, {
                                            biomarkerIds: selected.filter(x => !ids.includes(x)),
                                        })}
                                    />
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                        <Input value={query} onChange={e => setQuery(e.target.value)}
                                            placeholder="Search biomarkers by name or legacy id…"
                                            className="h-8 pl-8 text-xs" />
                                    </div>

                                    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                                        {[...grouped.entries()].map(([group, rows]) => (
                                            <div key={group}>
                                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    {group}
                                                    <span className="ml-2 font-normal normal-case">
                                                        {rows.filter(b => selected.includes(b.id)).length}/{rows.length}
                                                    </span>
                                                </p>
                                                <div className="grid gap-1 sm:grid-cols-2">
                                                    {rows.map(b => {
                                                        const on = selected.includes(b.id)
                                                        return (
                                                            <button key={b.id} type="button"
                                                                onClick={() => toggle(m.country, b.id)}
                                                                className={`flex items-center gap-2 rounded border px-2 py-1 text-left text-[11px] ${on ? "border-rose-500/30 bg-rose-500/10" : "hover:bg-muted/40"}`}>
                                                                <span className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${on ? "bg-rose-600 text-white" : ""}`}>
                                                                    {on && "✓"}
                                                                </span>
                                                                <span className="flex-1">{b.nameEn}</span>
                                                                <code className="text-[9px] text-muted-foreground">
                                                                    #{b.legacyId}
                                                                </code>
                                                                {b.sampleKind !== "blood" && (
                                                                    <Badge variant="outline" className="text-[9px]">
                                                                        {SAMPLE_KINDS.find(s => s.id === b.sampleKind)?.label}
                                                                    </Badge>
                                                                )}
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Separator />
                                    <div className="space-y-1">
                                        <Label className="text-xs">Why does this country differ? (optional)</Label>
                                        <Input className="h-8 text-xs" value={m.intentionalNote ?? ""}
                                            onChange={e => patchMap(m.country, { intentionalNote: e.target.value })}
                                            placeholder="e.g. Lp(a) is not registered with the KSA lab — deliberate omission" />
                                        <p className="text-[10px] text-muted-foreground">
                                            Recording the reason is what separates deliberate localisation from an
                                            unnoticed divergence when someone reviews this in six months.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                <p className="text-[11px] text-muted-foreground">
                    Biomarkers are authored in the <strong>Admin Portal</strong> (<code>tests_tests</code>) — this
                    screen maps existing markers onto the package and never creates them. The customer-facing count
                    is <strong>derived from this mapping</strong>, so a package can no longer advertise 100 markers
                    while carrying 70.
                </p>
            </CardContent>
        </Card>
    )
}
