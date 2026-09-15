"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Plus, Search, FlaskConical, AlertTriangle, Sigma, Layers, ChevronRight, Database, Download,
} from "lucide-react"
import { ApiService } from "@/services/api"
import type { Biomarker, BiomarkerCode, BiomarkerPanel, BiomarkerRange, SampleKind } from "@/types"
import { SAMPLE_KINDS } from "@/lib/diagnostics"
import { biomarkerGaps, biomarkerWarnings, panelsOf, tubeOf, LIFECYCLES } from "@/lib/biomarkers"
import { LoincSearch } from "@/components/catalogue/LoincSearch"
import { toast } from "sonner"

/**
 * The biomarker master. This is the tier the legacy admin hid behind a test: its
 * biomarker screen exists but is `display: false` in navigation, and a biomarker
 * there is the child of exactly one test.
 */
export default function BiomarkersPage() {
    const router = useRouter()
    const [list, setList] = useState<Biomarker[]>([])
    const [panels, setPanels] = useState<BiomarkerPanel[]>([])
    const [ranges, setRanges] = useState<BiomarkerRange[]>([])
    const [codes, setCodes] = useState<BiomarkerCode[]>([])
    const [query, setQuery] = useState("")
    const [kind, setKind] = useState<SampleKind | "all">("all")
    const [readiness, setReadiness] = useState<"all" | "blocked" | "warned" | "ready">("all")
    const [creating, setCreating] = useState(false)
    const [loincOpen, setLoincOpen] = useState(false)
    const [importing, setImporting] = useState(false)
    const [draft, setDraft] = useState<{ nameEn: string; sampleKind: SampleKind; isDerived: boolean }>(
        { nameEn: "", sampleKind: "blood", isDerived: false })

    const reload = () => Promise.all([
        ApiService.catalogue.biomarkers(),
        ApiService.catalogue.biomarkerPanels(),
        ApiService.catalogue.biomarkerRanges(),
        ApiService.catalogue.biomarkerCodes(),
    ]).then(([b, p, r, c]) => { setList(b); setPanels(p); setRanges(r); setCodes(c) })

    useEffect(() => { reload() }, [])

    const rows = useMemo(() => list.map(b => ({
        b,
        gaps: biomarkerGaps(b, list),
        warnings: biomarkerWarnings(b, codes, ranges),
        panels: panelsOf(b, panels),
        bands: ranges.filter(r => r.biomarkerId === b.id && !r.effectiveTo).length,
    })), [list, panels, ranges, codes])

    const filtered = useMemo(() => rows.filter(r => {
        const q = query.trim().toLowerCase()
        if (q && !`${r.b.nameEn} ${r.b.internalName ?? ""} ${r.b.panelGroup ?? ""}`.toLowerCase().includes(q)) return false
        if (kind !== "all" && r.b.sampleKind !== kind) return false
        if (readiness === "blocked" && !r.gaps.length) return false
        if (readiness === "warned" && (r.gaps.length || !r.warnings.length)) return false
        if (readiness === "ready" && (r.gaps.length || r.warnings.length)) return false
        return true
    }), [rows, query, kind, readiness])

    const stats = useMemo(() => ({
        total: rows.length,
        blocked: rows.filter(r => r.gaps.length).length,
        warned: rows.filter(r => !r.gaps.length && r.warnings.length).length,
        ready: rows.filter(r => !r.gaps.length && !r.warnings.length).length,
        derived: rows.filter(r => r.b.isDerived).length,
        graded: rows.filter(r => r.bands > 0).length,
    }), [rows])

    const create = async () => {
        if (!draft.nameEn.trim()) { toast.error("Name it first."); return }
        const created = await ApiService.catalogue.createBiomarker({
            nameEn: draft.nameEn.trim(),
            sampleKind: draft.sampleKind,
            isDerived: draft.isDerived,
            lifecycle: "draft",
            internalName: draft.nameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        })
        setCreating(false)
        setDraft({ nameEn: "", sampleKind: "blood", isDerived: false })
        toast.success(`${created.nameEn} created as a draft.`)
        router.push(`/catalogue/biomarkers/${created.id}`)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Biomarkers</h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        One row per biomarker, worldwide. A biomarker is a clinical fact — it carries no
                        price and no SKU, and selling one is the job of a package or the build-your-own
                        channel.
                    </p>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Database className="h-3.5 w-3.5" />
                        Stored in Postgres, so what you author here survives a reload. Codes are
                        looked up against LOINC live.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setLoincOpen(true)}>
                        <Search className="mr-2 h-4 w-4" /> Create from LOINC
                    </Button>
                    <Button onClick={() => setCreating(true)}>
                        <Plus className="mr-2 h-4 w-4" /> New biomarker
                    </Button>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {[
                    { k: "Biomarkers", v: stats.total, tone: "" },
                    { k: "Blocked", v: stats.blocked, tone: "text-red-600" },
                    { k: "Warnings only", v: stats.warned, tone: "text-amber-600" },
                    { k: "Ready", v: stats.ready, tone: "text-emerald-600" },
                    { k: "Derived", v: stats.derived, tone: "" },
                    { k: "Gradeable", v: stats.graded, tone: "" },
                ].map(s => (
                    <Card key={s.k}>
                        <CardContent className="p-4">
                            <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{s.k}</div>
                            <div className={`mt-1 text-2xl font-semibold tabular-nums ${s.tone}`}>{s.v}</div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="min-w-[220px] flex-1">
                            <Label className="text-xs">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input className="pl-8" placeholder="Name, internal name or panel"
                                    value={query} onChange={e => setQuery(e.target.value)} />
                            </div>
                        </div>
                        <div className="w-[170px]">
                            <Label className="text-xs">Specimen</Label>
                            <Select value={kind} onValueChange={v => setKind(v as SampleKind | "all")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All specimens</SelectItem>
                                    {SAMPLE_KINDS.map(k => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[190px]">
                            <Label className="text-xs">Readiness</Label>
                            <Select value={readiness} onValueChange={v => setReadiness(v as typeof readiness)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Everything</SelectItem>
                                    <SelectItem value="blocked">Blocked from going active</SelectItem>
                                    <SelectItem value="warned">Warnings only</SelectItem>
                                    <SelectItem value="ready">Ready</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                                    <th className="px-4 py-2.5 font-medium">Biomarker</th>
                                    <th className="px-4 py-2.5 font-medium">Unit</th>
                                    <th className="px-4 py-2.5 font-medium">Specimen · tube</th>
                                    <th className="px-4 py-2.5 font-medium">Panels</th>
                                    <th className="px-4 py-2.5 font-medium">Bands</th>
                                    <th className="px-4 py-2.5 font-medium">State</th>
                                    <th className="px-4 py-2.5" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(({ b, gaps, warnings, panels: mine, bands }) => {
                                    const tube = tubeOf(b.tubeType)
                                    return (
                                        <tr key={b.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="px-4 py-2.5">
                                                <Link href={`/catalogue/biomarkers/${b.id}`}
                                                    className="font-medium hover:underline">
                                                    {b.nameEn}
                                                </Link>
                                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                                    <span className="font-mono">{b.internalName ?? "—"}</span>
                                                    {b.isDerived && (
                                                        <Badge variant="outline" className="h-4 gap-1 border-violet-200 bg-violet-50 px-1.5 text-[10px] text-violet-700">
                                                            <Sigma className="h-2.5 w-2.5" /> derived
                                                        </Badge>
                                                    )}
                                                    {b.sexApplicability && b.sexApplicability !== "any" && (
                                                        <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
                                                            {b.sexApplicability === "male_only" ? "male only" : "female only"}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 font-mono text-xs">
                                                {b.unitUcum ?? <span className="text-red-600">not set</span>}
                                            </td>
                                            <td className="px-4 py-2.5 text-xs">
                                                <span className="capitalize">{b.sampleKind}</span>
                                                {tube && tube.id !== "none" && (
                                                    <span className="ml-2 inline-flex items-center gap-1.5 text-muted-foreground">
                                                        <span className="inline-block h-2 w-2 rounded-full"
                                                            style={{ background: tube.swatch }} />
                                                        {tube.label}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {mine.length ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {mine.map(p => (
                                                            <Badge key={p.id} variant="outline" className="h-5 gap-1 px-1.5 text-[10px]">
                                                                <Layers className="h-2.5 w-2.5" />{p.nameEn}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : <span className="text-xs text-muted-foreground">—</span>}
                                            </td>
                                            <td className="px-4 py-2.5 tabular-nums text-xs">
                                                {bands || <span className="text-amber-600">none</span>}
                                            </td>
                                            <td className="px-4 py-2.5">
                                                {gaps.length ? (
                                                    <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-red-700">
                                                        <AlertTriangle className="h-3 w-3" />{gaps.length} blocking
                                                    </Badge>
                                                ) : warnings.length ? (
                                                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                                        {warnings.length} warning{warnings.length > 1 ? "s" : ""}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                                        ready
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-right">
                                                <Link href={`/catalogue/biomarkers/${b.id}`}>
                                                    <Button variant="ghost" size="sm"><ChevronRight className="h-4 w-4" /></Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {!filtered.length && (
                                    <tr><td colSpan={7} className="px-4 py-12 text-center">
                                        <FlaskConical className="mx-auto mb-2 h-6 w-6 opacity-40" />
                                        {list.length === 0 ? (
                                            <div className="mx-auto max-w-lg space-y-3">
                                                <p className="text-sm font-medium">No biomarkers yet.</p>
                                                <p className="text-xs leading-relaxed text-muted-foreground">
                                                    The database starts empty on purpose. The prototype used to
                                                    ship invented units, tube types, reference bands, component
                                                    prices and lab costs to make these screens demonstrable —
                                                    none of it from Valeo&rsquo;s catalogue — and a clinical value
                                                    nobody decided is worse than an absent one, because it reads
                                                    as a decision.
                                                </p>
                                                <p className="text-xs leading-relaxed text-muted-foreground">
                                                    You can start from LOINC, or bring in the{" "}
                                                    <strong>51 biomarker names</strong> the prototype already
                                                    carried — names, specimen and legacy id only, each as a draft
                                                    with its gaps intact.
                                                </p>
                                                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                                                    <Button size="sm" variant="outline" onClick={() => setLoincOpen(true)}>
                                                        <Search className="mr-1.5 h-3.5 w-3.5" /> Create from LOINC
                                                    </Button>
                                                    <Button size="sm" variant="outline" disabled={importing}
                                                        onClick={async () => {
                                                            setImporting(true)
                                                            try {
                                                                const r = await ApiService.catalogue.importPrototypeAnalytes()
                                                                await reload()
                                                                toast.success(`${r.inserted} biomarker name(s) imported as drafts.`)
                                                            } catch (e) {
                                                                toast.error(e instanceof Error ? e.message : "Import failed")
                                                            } finally { setImporting(false) }
                                                        }}>
                                                        <Download className="mr-1.5 h-3.5 w-3.5" />
                                                        {importing ? "Importing…" : "Import the 51 names"}
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Nothing matches those filters.</p>
                                        )}
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <LoincSearch open={loincOpen} onOpenChange={setLoincOpen}
                onCreated={id => { reload(); router.push(`/catalogue/biomarkers/${id}`) }} />

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New biomarker</DialogTitle>
                        <DialogDescription>
                            It starts as a draft. A draft is never resolvable in a package or a basket,
                            so it is safe to author over several sittings.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Display name</Label>
                            <Input value={draft.nameEn} autoFocus
                                placeholder="e.g. Apolipoprotein A1"
                                onChange={e => setDraft({ ...draft, nameEn: e.target.value })} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Specimen</Label>
                            <Select value={draft.sampleKind}
                                onValueChange={v => setDraft({ ...draft, sampleKind: v as SampleKind })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {SAMPLE_KINDS.map(k => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <label className="flex cursor-pointer items-start gap-2.5 rounded-md border p-3">
                            <input type="checkbox" className="mt-0.5" checked={draft.isDerived}
                                onChange={e => setDraft({ ...draft, isDerived: e.target.checked })} />
                            <span className="text-sm">
                                <span className="font-medium">This is a calculated value</span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                    A ratio or index — computed from other biomarkers, never drawn. It will need
                                    its inputs named, and it can never be sent to a lab.
                                </span>
                            </span>
                        </label>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                        <Button onClick={create}>Create draft</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
