"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    ArrowLeft, Save, ExternalLink, Plus, Repeat, Sparkles, CheckCircle2, AlertTriangle, XCircle,
} from "lucide-react"
import { ApiService } from "@/services/api"
import {
    Journey, Listing, Country, PageBlock,
    RetentionTemplate,
    CataloguePartner, PartnerAccessEntry, City,
} from "@/types"
import { PageBuilder } from "@/components/catalogue/page-builder/PageBuilder"
import { BLOCK_REGISTRY } from "@/components/catalogue/page-builder/registry"
import { PartnerAccessSection } from "@/components/catalogue/PartnerAccessSection"
import { auditJourneyPage, type AuditResult, type AuditFinding } from "@/lib/content-audit"

// A HERO_SECTION is mandatory on every journey page. Normalize the block list so
// one always exists (seeded from the registry default at rank 0), then rerank.
// Idempotent — same input always yields the same output (stable seed id).
function ensureHero(blocks: PageBlock[]): PageBlock[] {
    const sorted = [...blocks].sort((a, b) => a.rank - b.rank)
    const withHero = sorted.some(b => b.type === "HERO_SECTION")
        ? sorted
        : [
            {
                id: "seed-hero",
                type: "HERO_SECTION" as const,
                internalName: BLOCK_REGISTRY.HERO_SECTION.label,
                rank: 0,
                isActive: true,
                config: { ...BLOCK_REGISTRY.HERO_SECTION.defaultConfig },
            },
            ...sorted,
        ]
    return withHero.map((b, i) => ({ ...b, rank: i }))
}

const KIND_BADGE: Record<Journey["kind"], { label: string; className: string }> = {
    program: { label: "Program", className: "bg-violet-100 text-violet-700 border-violet-200" },
    direct: { label: "Direct", className: "bg-slate-100 text-slate-600 border-slate-200" },
}

const COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT", "OTHERS"]

export default function JourneyEditorRoute() {
    const params = useParams()
    const id = typeof params.id === "string" ? params.id : ""

    const [journey, setJourney] = useState<Journey | null>(null)
    const [listings, setListings] = useState<Listing[]>([])
    const [partners, setPartners] = useState<CataloguePartner[]>([])
    const [cities, setCities] = useState<City[]>([])
    const [retentionTemplates, setRetentionTemplates] = useState<RetentionTemplate[]>([])
    const [loading, setLoading] = useState(true)

    const [country, setCountry] = useState<Country>("UAE")

    // ── AI go-live audit (mock, deterministic) ──
    const [auditOpen, setAuditOpen] = useState(false)
    const [auditResult, setAuditResult] = useState<AuditResult | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                const [journeys, allListings, allPartners, allCities, allTemplates] = await Promise.all([
                    ApiService.catalogue.journeys(),
                    ApiService.catalogue.listings(),
                    ApiService.catalogue.partners(),
                    ApiService.catalogue.cities(),
                    ApiService.catalogue.retentionTemplates(),
                ])
                setJourney(journeys.find(j => j.id === id) ?? null)
                setListings(allListings)
                setPartners(allPartners)
                setCities(allCities)
                setRetentionTemplates(allTemplates)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    // Always present a page-block list that contains a mandatory HERO_SECTION.
    const pageBlocks = useMemo(() => ensureHero(journey?.pageBlocks ?? []), [journey?.pageBlocks])

    if (loading) {
        return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading journey…</div>
    }

    if (!journey) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
                <p>Journey not found.</p>
                <Button variant="outline" asChild><Link href="/catalogue/journeys">Back to journeys</Link></Button>
            </div>
        )
    }

    const kindMeta = KIND_BADGE[journey.kind]
    const blockCount = pageBlocks.length

    const handleSave = () => {
        // Mock only — not persisted.
        console.log("Saving journey", journey.id, journey)
    }

    const runAudit = () => {
        setAuditResult(auditJourneyPage(pageBlocks))
        setAuditOpen(true)
    }

    const handlePublish = () => {
        // Prototype: flip the journey Active (mock, not persisted) and close.
        setJourney(j => (j ? { ...j, isActive: true } : j))
        setAuditOpen(false)
    }

    // ── Retention attachment helpers (per-country template attachment) ──
    const attachedTemplateId = journey.retentionAttachments?.find(a => a.country === country)?.templateId
    const attachedTemplate = retentionTemplates.find(t => t.id === attachedTemplateId)

    const setAttachment = (templateId: string | undefined) => {
        setJourney(j => {
            if (!j) return j
            const existing = j.retentionAttachments ?? []
            const nextEntry = { country, templateId }
            const nextAttachments = existing.some(a => a.country === country)
                ? existing.map(a => (a.country === country ? nextEntry : a))
                : [...existing, nextEntry]
            return { ...j, retentionAttachments: nextAttachments }
        })
    }

    return (
        <div className="flex h-[calc(100vh-80px)] flex-col">
            {/* Header */}
            <div className="mb-4 flex shrink-0 items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/catalogue/journeys"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold">{journey.nameEn}</h2>
                            <Badge variant="outline" className={kindMeta.className}>{kindMeta.label}</Badge>
                            {journey.isActive && (
                                <Badge variant="outline" className="border-emerald-200 bg-emerald-100 text-emerald-700">Live</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Journey editor · {blockCount} page block{blockCount === 1 ? "" : "s"}
                        </p>
                    </div>
                </div>
                <Button size="sm" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Save
                </Button>
            </div>

            {/* Tabbed editor */}
            <Tabs defaultValue="page" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="shrink-0">
                    <TabsTrigger value="page">Page</TabsTrigger>
                    <TabsTrigger value="retention">Retention</TabsTrigger>
                    <TabsTrigger value="partners">Partner Access</TabsTrigger>
                </TabsList>

                {/* ── Page ── */}
                <TabsContent value="page" className="mt-4 flex min-h-0 flex-1 flex-col">
                    <div className="mb-3 flex shrink-0 items-center justify-end">
                        <Button variant="outline" size="sm" onClick={runAudit}>
                            <Sparkles className="mr-2 h-4 w-4" /> AI go-live audit
                        </Button>
                    </div>
                    <div className="min-h-0 flex-1">
                        <PageBuilder
                            blocks={pageBlocks}
                            onChange={b => setJourney(j => (j ? { ...j, pageBlocks: b } : j))}
                            listings={listings}
                        />
                    </div>
                </TabsContent>

                {/* ── Retention ── */}
                <TabsContent value="retention" className="mt-4 min-h-0 flex-1 overflow-y-auto">
                    <div className="max-w-2xl space-y-5 pb-8">
                        <div className="flex items-end gap-3">
                            <div className="space-y-1.5">
                                <Label>Country</Label>
                                <Select value={country} onValueChange={v => setCountry(v as Country)}>
                                    <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {COUNTRIES.map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <p className="pb-2 text-xs text-muted-foreground">
                                Attach a reusable retention page for <span className="font-medium">{country}</span>.
                            </p>
                        </div>

                        <div className="space-y-2 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                <Repeat className="h-4 w-4 text-muted-foreground" />
                                <Label>Retention page</Label>
                            </div>
                            <Select
                                value={attachedTemplateId ?? "__none"}
                                onValueChange={v => setAttachment(v === "__none" ? undefined : v)}
                            >
                                <SelectTrigger className="h-9"><SelectValue placeholder="Select a retention page…" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none">— None —</SelectItem>
                                    {retentionTemplates.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {attachedTemplate ? (
                                <p className="text-xs text-muted-foreground">
                                    <span className="font-medium text-foreground">{attachedTemplate.name}</span>
                                    {" · "}{attachedTemplate.sections.length} section{attachedTemplate.sections.length === 1 ? "" : "s"}
                                    {" · "}{attachedTemplate.sections.filter(s => s.enabled).length} active
                                </p>
                            ) : (
                                <p className="text-xs text-muted-foreground">No retention page attached for {country}.</p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 pt-1">
                                {attachedTemplateId && (
                                    <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                                        <Link href={`/catalogue/retention/${attachedTemplateId}`}>
                                            <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Edit / build retention
                                        </Link>
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                                    <Link href="/catalogue/retention">
                                        <Plus className="mr-1.5 h-3.5 w-3.5" /> New retention page
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                {/* ── Partner Access ── */}
                <TabsContent value="partners" className="mt-4 min-h-0 flex-1 overflow-y-auto">
                    <div className="max-w-2xl space-y-4 pb-8">
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <div>
                                <Label className="text-sm font-medium">Partner-exclusive journey</Label>
                                <p className="text-xs text-muted-foreground">Hide from Valeo's master search — only the assigned partner(s) can surface it.</p>
                            </div>
                            <Switch
                                checked={!!journey.partnerExclusive}
                                onCheckedChange={v => setJourney(j => (j ? { ...j, partnerExclusive: v } : j))}
                            />
                        </div>
                        <PartnerAccessSection
                            partners={partners}
                            value={journey.partnerAccess ?? []}
                            onChange={(v: PartnerAccessEntry[]) => setJourney(j => (j ? { ...j, partnerAccess: v } : j))}
                            enableOverrides
                            cities={cities}
                        />
                    </div>
                </TabsContent>
            </Tabs>

            {/* ── AI go-live audit dialog ── */}
            <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
                <DialogContent className="max-h-[85vh] max-w-lg overflow-hidden">
                    {auditResult && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    {auditResult.canPublish ? (
                                        <>
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                                            Ready to publish
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="h-5 w-5 text-red-600" />
                                            {auditResult.findings.filter(f => f.blocking).length} blocking issue
                                            {auditResult.findings.filter(f => f.blocking).length === 1 ? "" : "s"}
                                        </>
                                    )}
                                </DialogTitle>
                                <DialogDescription>
                                    Audited on the fully-composed page, as a search crawler would see it.
                                </DialogDescription>
                            </DialogHeader>

                            {/* Page-level metrics */}
                            <div className="flex gap-2 text-xs">
                                <span className="rounded-md border px-2 py-1">
                                    H1 count: <span className="font-semibold text-foreground">{auditResult.h1Count}</span>
                                </span>
                                <span className="rounded-md border px-2 py-1">
                                    Word count: <span className="font-semibold text-foreground">{auditResult.wordCount}</span>
                                </span>
                                <span className="rounded-md border px-2 py-1">
                                    Findings: <span className="font-semibold text-foreground">{auditResult.findings.length}</span>
                                </span>
                            </div>

                            {/* Findings, grouped by severity */}
                            <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                                {auditResult.findings.length === 0 ? (
                                    <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                                        No issues found — the page looks clean.
                                    </p>
                                ) : (
                                    [...auditResult.findings]
                                        .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "error" ? -1 : 1))
                                        .map(f => <AuditRow key={f.id} finding={f} />)
                                )}
                            </div>

                            <DialogFooter>
                                <Button variant="ghost" size="sm" onClick={() => setAuditOpen(false)}>Close</Button>
                                <Button
                                    size="sm"
                                    disabled={!auditResult.canPublish}
                                    onClick={handlePublish}
                                >
                                    Publish (Go Live)
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

// A single audit finding row: severity badge, category, message, component.
function AuditRow({ finding }: { finding: AuditFinding }) {
    const isError = finding.severity === "error"
    return (
        <div className="rounded-md border p-2.5">
            <div className="flex items-start gap-2">
                {isError ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                )}
                <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                            variant="outline"
                            className={isError
                                ? "border-red-200 bg-red-100 text-red-700"
                                : "border-amber-200 bg-amber-100 text-amber-700"}
                        >
                            {isError ? "Error" : "Warning"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{finding.category}</Badge>
                        {finding.componentLabel && (
                            <span className="text-xs text-muted-foreground">· {finding.componentLabel}</span>
                        )}
                    </div>
                    <p className="text-sm">{finding.message}</p>
                </div>
            </div>
        </div>
    )
}

