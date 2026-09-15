"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    ArrowLeft, Plus, Trash2, AlertTriangle, CheckCircle2, Info, Sigma, Save, FlaskConical, Layers,
} from "lucide-react"
import { ApiService } from "@/services/api"
import type {
    Biomarker, BiomarkerCode, BiomarkerPanel, BiomarkerRange, CodeScheme, Country,
    DiagnosticsLab, RangeGrade, SampleKind,
} from "@/types"
import { SAMPLE_KINDS } from "@/lib/diagnostics"
import {
    biomarkerGaps, biomarkerWarnings, overlappingBands, resolveRanges, gradeValue,
    GRADES, TUBE_TYPES, CODE_SCHEMES, LIFECYCLES, tubeApplies, gradeOf,
} from "@/lib/biomarkers"
import { SectionHelp } from "@/components/catalogue/SectionHelp"
import { toast } from "sonner"

const COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT"]

export default function BiomarkerEditorPage() {
    const { id } = useParams<{ id: string }>()
    const [b, setB] = useState<Biomarker | null>(null)
    const [all, setAll] = useState<Biomarker[]>([])
    const [panels, setPanels] = useState<BiomarkerPanel[]>([])
    const [ranges, setRanges] = useState<BiomarkerRange[]>([])
    const [codes, setCodes] = useState<BiomarkerCode[]>([])
    const [labs, setLabs] = useState<DiagnosticsLab[]>([])
    const [dirty, setDirty] = useState(false)

    useEffect(() => {
        Promise.all([
            ApiService.catalogue.biomarkers(),
            ApiService.catalogue.biomarkerPanels(),
            ApiService.catalogue.biomarkerRanges(id),
            ApiService.catalogue.biomarkerCodes(id),
            ApiService.catalogue.diagnosticsLabs(),
        ]).then(([bs, ps, rs, cs, ls]) => {
            setAll(bs); setPanels(ps); setRanges(rs); setCodes(cs)
            setLabs(ls)
            setB(bs.find(x => x.id === id) ?? null)
        })
    }, [id])

    const patch = (p: Partial<Biomarker>) => { setB(cur => cur ? { ...cur, ...p } : cur); setDirty(true) }

    const gaps = useMemo(() => (b ? biomarkerGaps(b, all) : []), [b, all])
    const warnings = useMemo(() => (b ? biomarkerWarnings(b, codes, ranges) : []), [b, codes, ranges])
    const overlaps = useMemo(() => (b ? overlappingBands(ranges, b.id) : []), [ranges, b])
    const myPanels = useMemo(() => panels.filter(p => b && p.memberIds.includes(b.id)), [panels, b])

    const save = async () => {
        if (!b) return
        await ApiService.catalogue.updateBiomarker(b.id, b)
        await ApiService.catalogue.saveBiomarkerRanges(b.id, ranges)
        await ApiService.catalogue.saveBiomarkerCodes(b.id, codes)
        setDirty(false)
        toast.success("Saved to the prototype store.")
    }

    const goActive = async () => {
        if (gaps.length) { toast.error("Clear the blocking gaps first."); return }
        patch({ lifecycle: "active" })
        toast.success("Marked active. That is a curation state, not a price or a sale.")
    }

    if (!b) return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                    <Link href="/catalogue/biomarkers"
                        className="mb-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="h-3.5 w-3.5" /> Biomarkers
                    </Link>
                    <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        {b.nameEn || "Untitled biomarker"}
                        {b.isDerived && (
                            <Badge variant="outline" className="gap-1 border-violet-200 bg-violet-50 text-violet-700">
                                <Sigma className="h-3 w-3" /> calculated
                            </Badge>
                        )}
                    </h1>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{b.internalName ?? "no internal name"}</p>
                </div>
                <div className="flex items-center gap-2">
                    {b.lifecycle !== "active" && (
                        <Button variant="outline" onClick={goActive} disabled={!!gaps.length}>
                            <CheckCircle2 className="mr-2 h-4 w-4" /> Mark active
                        </Button>
                    )}
                    <Button onClick={save} disabled={!dirty}>
                        <Save className="mr-2 h-4 w-4" /> {dirty ? "Save" : "Saved"}
                    </Button>
                </div>
            </div>

            {(gaps.length > 0 || warnings.length > 0) && (
                <div className="grid gap-3 lg:grid-cols-2">
                    {gaps.length > 0 && (
                        <Card className="border-red-200 bg-red-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm text-red-700">
                                    <AlertTriangle className="h-4 w-4" /> Blocks going active
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ul className="space-y-1.5 text-sm text-red-900">
                                    {gaps.map((g, i) => <li key={i} className="flex gap-2"><span>·</span>{g}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                    {warnings.length > 0 && (
                        <Card className="border-amber-200 bg-amber-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-sm text-amber-700">
                                    <Info className="h-4 w-4" /> Incomplete, but nothing breaks
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <ul className="space-y-1.5 text-sm text-amber-900">
                                    {warnings.map((w, i) => <li key={i} className="flex gap-2"><span>·</span>{w}</li>)}
                                </ul>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            <Tabs defaultValue="clinical">
                <TabsList>
                    <TabsTrigger value="clinical">Clinical</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="panels">Panels</TabsTrigger>
                    <TabsTrigger value="bands">Reference bands</TabsTrigger>
                    <TabsTrigger value="codes">EMR codes</TabsTrigger>
                    <TabsTrigger value="markets">Markets</TabsTrigger>
                </TabsList>

                {/* ── Clinical ─────────────────────────────────── */}
                <TabsContent value="clinical" className="space-y-4">
                    <SectionHelp sectionId="biomarkers" />
                    <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">Identity</CardTitle></CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field label="Display name (EN)">
                                <Input value={b.nameEn} onChange={e => patch({ nameEn: e.target.value })} />
                            </Field>
                            <Field label="Display name (AR)">
                                <Input dir="rtl" value={b.nameAr ?? ""} onChange={e => patch({ nameAr: e.target.value })} />
                            </Field>
                            <Field label="Internal name" hint="How admins find it. Unique, English, no spaces.">
                                <Input className="font-mono text-sm" value={b.internalName ?? ""}
                                    onChange={e => patch({ internalName: e.target.value })} />
                            </Field>
                            <Field label="Lifecycle" hint="Curation state only — never a sellability flag.">
                                <Select value={b.lifecycle ?? "draft"}
                                    onValueChange={v => patch({ lifecycle: v as Biomarker["lifecycle"] })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {LIFECYCLES.map(l => (
                                            <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                    {LIFECYCLES.find(l => l.id === (b.lifecycle ?? "draft"))?.blurb}
                                </p>
                            </Field>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Specimen &amp; measurement</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field label="Specimen">
                                <Select value={b.sampleKind}
                                    onValueChange={v => patch({
                                        sampleKind: v as SampleKind,
                                        // A tube is meaningless without blood — absence is an answer.
                                        tubeType: tubeApplies(v as SampleKind) ? b.tubeType : "none",
                                    })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {SAMPLE_KINDS.map(k => <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Tube" hint={tubeApplies(b.sampleKind)
                                ? "Cap colour — what the phlebotomist actually carries."
                                : "Not applicable: this specimen has no tube."}>
                                <Select value={b.tubeType ?? "none"} disabled={!tubeApplies(b.sampleKind)}
                                    onValueChange={v => patch({ tubeType: v as Biomarker["tubeType"] })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {TUBE_TYPES.map(t => (
                                            <SelectItem key={t.id} value={t.id}>
                                                <span className="flex items-center gap-2">
                                                    <span className="inline-block h-2.5 w-2.5 rounded-full"
                                                        style={{ background: t.swatch }} />
                                                    {t.label}
                                                </span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </Field>
                            <Field label="Unit (UCUM)" hint="A real UCUM code — ng/mL, %, 10*9/L. Free text is what made conversions hand-maintained.">
                                <Input className="font-mono text-sm" placeholder="ng/mL"
                                    value={b.unitUcum ?? ""} onChange={e => patch({ unitUcum: e.target.value })} />
                            </Field>
                            <Field label="Analytical method" hint="CLIA, HPLC… free text until labs agree a vocabulary.">
                                <Input value={b.analyticalMethod ?? ""}
                                    onChange={e => patch({ analyticalMethod: e.target.value })} />
                            </Field>
                            <Field label="Fasting hours" hint="Blank = no fasting. A package's requirement is the MAX over its set — never typed on the package.">
                                <Input type="number" min={0} value={b.fastingHours ?? ""}
                                    onChange={e => patch({ fastingHours: e.target.value === "" ? undefined : Number(e.target.value) })} />
                            </Field>
                            <Field label="Turnaround (hours)" hint="A lab mapping may raise it. Package TAT is the MAX over the set.">
                                <Input type="number" min={0} value={b.tatHours ?? ""}
                                    onChange={e => patch({ tatHours: e.target.value === "" ? undefined : Number(e.target.value) })} />
                            </Field>
                            <Field label="Sex applicability" hint="A HARD restriction (PSA, Beta-HCG) — different from having different bands per sex.">
                                <Select value={b.sexApplicability ?? "any"}
                                    onValueChange={v => patch({ sexApplicability: v as Biomarker["sexApplicability"] })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="any">Applies to anyone</SelectItem>
                                        <SelectItem value="male_only">Male only</SelectItem>
                                        <SelectItem value="female_only">Female only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </Field>
                        </CardContent>
                    </Card>

                    <Card className={b.isDerived ? "border-violet-200" : undefined}>
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="text-base">Calculated value</CardTitle>
                                    <p className="mt-1 max-w-xl text-xs text-muted-foreground">
                                        Computed from other biomarkers, never drawn. It must name its inputs
                                        and is never sent to a lab.
                                    </p>
                                </div>
                                <Switch checked={!!b.isDerived}
                                    onCheckedChange={v => patch({ isDerived: v, tubeType: v ? "none" : b.tubeType })} />
                            </div>
                        </CardHeader>
                        {b.isDerived && (
                            <CardContent className="space-y-3">
                                <Label className="text-xs">Computed from</Label>
                                <div className="flex flex-wrap gap-1.5">
                                    {(b.inputIds ?? []).map(inputId => {
                                        const input = all.find(x => x.id === inputId)
                                        return (
                                            <Badge key={inputId} variant="outline" className="gap-1.5 py-1">
                                                {input?.nameEn ?? <span className="text-red-600">{inputId} (missing)</span>}
                                                <button className="text-muted-foreground hover:text-foreground"
                                                    onClick={() => patch({ inputIds: (b.inputIds ?? []).filter(x => x !== inputId) })}>
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        )
                                    })}
                                    {!(b.inputIds ?? []).length && (
                                        <span className="text-xs text-red-600">No inputs — this value cannot be computed.</span>
                                    )}
                                </div>
                                <Select value="" onValueChange={v => patch({ inputIds: [...new Set([...(b.inputIds ?? []), v])] })}>
                                    <SelectTrigger className="w-[320px]"><SelectValue placeholder="Add an input biomarker" /></SelectTrigger>
                                    <SelectContent>
                                        {all.filter(x => x.id !== b.id && !x.isDerived && !(b.inputIds ?? []).includes(x.id))
                                            .map(x => <SelectItem key={x.id} value={x.id}>{x.nameEn}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground">
                                    In a build-your-own basket, choosing this pulls its inputs in automatically
                                    and the union is charged once — so a customer who already picked an input
                                    is never billed for it twice.
                                </p>
                            </CardContent>
                        )}
                    </Card>
                </TabsContent>

                {/* ── Content ──────────────────────────────────── */}
                <TabsContent value="content" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Report copy</CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Renders in the report and on the package page.
                            </p>
                        </CardHeader>
                        <CardContent className="grid gap-4 sm:grid-cols-2">
                            <Field label="Description (EN)">
                                <Textarea rows={4} value={b.descriptionEn ?? ""}
                                    onChange={e => patch({ descriptionEn: e.target.value })} />
                            </Field>
                            <Field label="Description (AR)">
                                <Textarea rows={4} dir="rtl" value={b.descriptionAr ?? ""}
                                    onChange={e => patch({ descriptionAr: e.target.value })} />
                            </Field>
                            <Field label="What causes a high or low result">
                                <Textarea rows={3} value={b.causesEn ?? ""}
                                    onChange={e => patch({ causesEn: e.target.value })} />
                            </Field>
                            <Field label="What to do about it">
                                <Textarea rows={3} value={b.whatToDoEn ?? ""}
                                    onChange={e => patch({ whatToDoEn: e.target.value })} />
                            </Field>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Panels ───────────────────────────────────── */}
                <TabsContent value="panels" className="space-y-4">
                    <SectionHelp sectionId="biomarkerPanels" />
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Panel membership</CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Which panels this biomarker belongs to. An biomarker can be in several.
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {!panels.length && (
                                <div className="rounded-md border border-dashed px-4 py-6 text-center">
                                    <p className="text-sm font-medium">No panels exist yet.</p>
                                    <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                                        Panels are created on the Panels screen. This tab only joins a
                                        biomarker to panels that already exist.
                                    </p>
                                    <Link href="/catalogue/panels">
                                        <Button size="sm" variant="outline" className="mt-3">
                                            <Layers className="mr-1.5 h-3.5 w-3.5" /> Go to Panels
                                        </Button>
                                    </Link>
                                </div>
                            )}
                            <div className="flex flex-wrap gap-2">
                                {panels.map(p => {
                                    const inIt = p.memberIds.includes(b.id)
                                    return (
                                        <button key={p.id}
                                            onClick={async () => {
                                                const memberIds = inIt
                                                    ? p.memberIds.filter(x => x !== b.id)
                                                    : [...p.memberIds, b.id]
                                                const saved = await ApiService.catalogue.savePanel({ ...p, memberIds })
                                                setPanels(cur => cur.map(x => x.id === saved.id ? saved : x))
                                            }}
                                            className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                                                inIt ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}>
                                            <span className="font-medium">{p.nameEn}</span>
                                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                                {p.memberIds.length} biomarkers
                                                {p.labPanelCode
                                                    ? ` · lab code ${p.labPanelCode}`
                                                    : " · no lab code"}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                            {myPanels.some(p => !p.labPanelCode) && (
                                <p className="rounded-md border-l-2 border-amber-400 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
                                    {myPanels.filter(p => !p.labPanelCode).map(p => p.nameEn).join(", ")} has no lab
                                    panel code. Labs bill a panel under one code, not one per member, so a basket
                                    containing it cannot become a single requisition until that code exists.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── Reference bands ──────────────────────────── */}
                <TabsContent value="bands" className="space-y-4">
                    <SectionHelp sectionId="referenceBands" />
                    <BandsEditor
                        biomarker={b} ranges={ranges} labs={labs} overlaps={overlaps}
                        onChange={rows => { setRanges(rows); setDirty(true) }} />
                </TabsContent>

                {/* ── Codes ────────────────────────────────────── */}
                <TabsContent value="codes" className="space-y-4">
                    <SectionHelp sectionId="biomarkerCodes" />
                    <CodesEditor biomarkerId={b.id} codes={codes}
                        onChange={rows => { setCodes(rows); setDirty(true) }} />
                </TabsContent>

                {/* ── Markets & price ──────────────────────────── */}
                <TabsContent value="markets" className="space-y-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Markets</CardTitle>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Where this biomarker is offered. None selected means nowhere.
                            </p>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-2">
                            {COUNTRIES.map(c => {
                                const on = (b.countryAvailability ?? []).includes(c)
                                return (
                                    <button key={c}
                                        onClick={() => patch({
                                            countryAvailability: on
                                                ? (b.countryAvailability ?? []).filter(x => x !== c)
                                                : [...(b.countryAvailability ?? []), c],
                                        })}
                                        className={`rounded-md border px-4 py-2 text-sm transition ${
                                            on ? "border-primary bg-primary/5 font-medium" : "hover:bg-muted/50"}`}>
                                        {c}
                                    </button>
                                )
                            })}
                        </CardContent>
                    </Card>

                    <p className="text-xs text-muted-foreground">
                        A biomarker carries no price. The build-your-own component price is a price of
                        the <strong>channel</strong>, and it is set on{" "}
                        <Link href="/catalogue/cyot" className="underline">Create Your Own Test → Component prices</Link>,
                        where every market and city is visible at once.
                    </p>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            {children}
            {hint && <p className="text-[11px] leading-snug text-muted-foreground">{hint}</p>}
        </div>
    )
}

/**
 * The graded band editor.
 *
 * Bands are scoped and effective-dated, and a closed row is shown read-only
 * rather than hidden: versioning only means something if the person editing can
 * see that history exists and that they are not allowed to rewrite it.
 */
function BandsEditor({ biomarker, ranges, labs, overlaps, onChange }: {
    biomarker: Biomarker
    ranges: BiomarkerRange[]
    labs: DiagnosticsLab[]
    overlaps: string[]
    onChange: (rows: BiomarkerRange[]) => void
}) {
    const [test, setTest] = useState("")
    const [ctxCountry, setCtxCountry] = useState<Country | "default">("default")
    const [ctxSex, setCtxSex] = useState<"male" | "female" | "any">("any")

    const live = ranges.filter(r => !r.effectiveTo)
    const closed = ranges.filter(r => r.effectiveTo)

    const resolved = useMemo(() => resolveRanges(ranges, biomarker.id, {
        country: ctxCountry === "default" ? undefined : ctxCountry,
        sex: ctxSex === "any" ? undefined : ctxSex,
    }), [ranges, biomarker.id, ctxCountry, ctxSex])

    const graded = test.trim() === "" ? undefined : gradeValue(Number(test), resolved.bands)

    const add = () => onChange([...ranges, {
        id: `rng-new-${ranges.length + 1}`,
        biomarkerId: biomarker.id,
        sex: "any", grade: "normal",
        effectiveFrom: new Date().toISOString().slice(0, 10),
    }])

    const upd = (id: string, p: Partial<BiomarkerRange>) =>
        onChange(ranges.map(r => r.id === id ? { ...r, ...p } : r))

    return (
        <div className="space-y-4">
            {overlaps.length > 0 && (
                <Card className="border-red-200 bg-red-50/50">
                    <CardContent className="space-y-1 p-4 text-sm text-red-900">
                        <p className="flex items-center gap-2 font-medium text-red-700">
                            <AlertTriangle className="h-4 w-4" /> Overlapping bands
                        </p>
                        {overlaps.map((o, i) => <p key={i}>{o}</p>)}
                        <p className="pt-1 text-xs">
                            Two bands claiming the same value means the grade a patient sees depends on row
                            order. This blocks publishing.
                        </p>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <CardTitle className="text-base">Current bands</CardTitle>
                            <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                                One row per graded band. Either bound may be blank — an open-ended band
                                (&ldquo;&gt; 400&rdquo;) is first-class rather than parsed out of a string. Editing here
                                never rewrites history: closing a generation opens a new row.
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={add}>
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add band
                        </Button>
                    </div>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[840px] text-sm">
                            <thead>
                                <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                                    <th className="px-3 py-2 font-medium">Grade</th>
                                    <th className="px-3 py-2 font-medium">Low</th>
                                    <th className="px-3 py-2 font-medium">High</th>
                                    <th className="px-3 py-2 font-medium">Label</th>
                                    <th className="px-3 py-2 font-medium">Sex</th>
                                    <th className="px-3 py-2 font-medium">Market</th>
                                    <th className="px-3 py-2 font-medium">Lab</th>
                                    <th className="px-3 py-2" />
                                </tr>
                            </thead>
                            <tbody>
                                {live.map(r => (
                                    <tr key={r.id} className="border-b last:border-0">
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="inline-block h-3 w-1 rounded"
                                                    style={{ background: gradeOf(r.grade)?.tone }} />
                                                <Select value={r.grade} onValueChange={v => upd(r.id, { grade: v as RangeGrade })}>
                                                    <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        {GRADES.map(g => <SelectItem key={g.id} value={g.id}>{g.label}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <Input className="h-8 w-24" type="number" placeholder="—" value={r.low ?? ""}
                                                onChange={e => upd(r.id, { low: e.target.value === "" ? undefined : Number(e.target.value) })} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Input className="h-8 w-24" type="number" placeholder="—" value={r.high ?? ""}
                                                onChange={e => upd(r.id, { high: e.target.value === "" ? undefined : Number(e.target.value) })} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Input className="h-8 w-40" value={r.labelEn ?? ""}
                                                onChange={e => upd(r.id, { labelEn: e.target.value })} />
                                        </td>
                                        <td className="px-3 py-2">
                                            <Select value={r.sex} onValueChange={v => upd(r.id, { sex: v as BiomarkerRange["sex"] })}>
                                                <SelectTrigger className="h-8 w-[92px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="any">Any</SelectItem>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-3 py-2">
                                            <Select value={r.country ?? "default"}
                                                onValueChange={v => upd(r.id, { country: v === "default" ? undefined : v as Country })}>
                                                <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="default">Default</SelectItem>
                                                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-3 py-2">
                                            <Select value={r.labId ?? "any"}
                                                onValueChange={v => upd(r.id, { labId: v === "any" ? undefined : v })}>
                                                <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="any">Any lab</SelectItem>
                                                    {labs.map(l => <SelectItem key={l.id} value={l.id}>{l.nameEn}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <Button variant="ghost" size="sm"
                                                onClick={() => onChange(ranges.filter(x => x.id !== r.id))}>
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {!live.length && (
                                    <tr><td colSpan={8} className="px-3 py-10 text-center text-sm text-muted-foreground">
                                        No bands, so a result for this biomarker cannot be graded.
                                    </td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Resolve a value</CardTitle>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Resolution order: lab, then market, then default.
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-32">
                            <Label className="text-xs">Value</Label>
                            <Input type="number" value={test} onChange={e => setTest(e.target.value)}
                                placeholder={biomarker.unitUcum ?? "value"} />
                        </div>
                        <div className="w-36">
                            <Label className="text-xs">Market</Label>
                            <Select value={ctxCountry} onValueChange={v => setCtxCountry(v as Country | "default")}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="default">Default</SelectItem>
                                    {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-32">
                            <Label className="text-xs">Sex</Label>
                            <Select value={ctxSex} onValueChange={v => setCtxSex(v as typeof ctxSex)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">Unspecified</SelectItem>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Badge variant="outline" className="mb-1">
                            resolved at: {resolved.rung}
                        </Badge>
                    </div>

                    {resolved.bands.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {resolved.bands.map(band => {
                                const hit = graded?.id === band.id
                                return (
                                    <span key={band.id}
                                        className={`rounded border px-2 py-1 text-xs ${hit ? "font-medium" : "opacity-60"}`}
                                        style={hit ? { borderColor: gradeOf(band.grade)?.tone, color: gradeOf(band.grade)?.tone } : undefined}>
                                        {band.labelEn || gradeOf(band.grade)?.label}
                                        <span className="ml-1.5 font-mono text-[10px]">
                                            {band.low ?? "−∞"}–{band.high ?? "∞"}
                                        </span>
                                    </span>
                                )
                            })}
                        </div>
                    )}
                    {test.trim() !== "" && (
                        <p className="text-sm">
                            {graded
                                ? <>Grades as <strong style={{ color: gradeOf(graded.grade)?.tone }}>
                                    {graded.labelEn || gradeOf(graded.grade)?.label}</strong>.</>
                                : <span className="text-amber-700">
                                    No band covers that value — the scale has a gap, and the report would say nothing.
                                </span>}
                        </p>
                    )}
                </CardContent>
            </Card>

            {closed.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base">Closed generations</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Read-only. Kept so an old result still resolves the band that was live then.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                        {closed.map(r => (
                            <div key={r.id} className="flex flex-wrap items-center gap-3 rounded border bg-muted/30 px-3 py-2 text-xs">
                                <span className="inline-block h-3 w-1 rounded" style={{ background: gradeOf(r.grade)?.tone }} />
                                <span className="font-medium">{r.labelEn || gradeOf(r.grade)?.label}</span>
                                <span className="font-mono">{r.low ?? "−∞"}–{r.high ?? "∞"}</span>
                                <span className="text-muted-foreground">
                                    {r.effectiveFrom} → {r.effectiveTo}
                                </span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

/**
 * Codes. The status field carries the distinction a nullable column cannot:
 * &ldquo;confirmed no match&rdquo; is finished work, while no row at all is a to-do.
 */
function CodesEditor({ biomarkerId, codes, onChange }: {
    biomarkerId: string
    codes: BiomarkerCode[]
    onChange: (rows: BiomarkerCode[]) => void
}) {
    const add = () => onChange([...codes, {
        id: `code-new-${codes.length + 1}`, biomarkerId, scheme: "loinc", status: "pending_review",
    }])
    const upd = (id: string, p: Partial<BiomarkerCode>) =>
        onChange(codes.map(c => c.id === id ? { ...c, ...p } : c))

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <CardTitle className="text-base">EMR &amp; billing codes</CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                            A missing code never blocks going active, but it is tracked.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={add}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" /> Add code
                    </Button>
                </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                        <thead>
                            <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                                <th className="px-3 py-2 font-medium">Scheme</th>
                                <th className="px-3 py-2 font-medium">Code</th>
                                <th className="px-3 py-2 font-medium">Display</th>
                                <th className="px-3 py-2 font-medium">Market</th>
                                <th className="px-3 py-2 font-medium">Status</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {codes.map(c => (
                                <tr key={c.id} className="border-b last:border-0">
                                    <td className="px-3 py-2">
                                        <Select value={c.scheme} onValueChange={v => upd(c.id, { scheme: v as CodeScheme })}>
                                            <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {CODE_SCHEMES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                                            {CODE_SCHEMES.find(s => s.id === c.scheme)?.scope}
                                        </p>
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input className="h-8 w-32 font-mono text-xs" value={c.code ?? ""}
                                            placeholder="—" onChange={e => upd(c.id, { code: e.target.value })} />
                                    </td>
                                    <td className="px-3 py-2">
                                        <Input className="h-8 w-56" value={c.display ?? ""}
                                            onChange={e => upd(c.id, { display: e.target.value })} />
                                    </td>
                                    <td className="px-3 py-2">
                                        <Select value={c.country ?? "global"}
                                            onValueChange={v => upd(c.id, { country: v === "global" ? undefined : v as Country })}>
                                            <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="global">Global</SelectItem>
                                                {COUNTRIES.map(x => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="px-3 py-2">
                                        <Select value={c.status} onValueChange={v => upd(c.id, { status: v as BiomarkerCode["status"] })}>
                                            <SelectTrigger className="h-8 w-[180px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mapped">Mapped</SelectItem>
                                                <SelectItem value="unmapped_confirmed">No match exists (confirmed)</SelectItem>
                                                <SelectItem value="pending_review">Pending review</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                        <Button variant="ghost" size="sm" onClick={() => onChange(codes.filter(x => x.id !== c.id))}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            {!codes.length && (
                                <tr><td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
                                    <FlaskConical className="mx-auto mb-2 h-5 w-5 opacity-40" />
                                    No codes recorded. That means nobody has looked yet.
                                </td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}

