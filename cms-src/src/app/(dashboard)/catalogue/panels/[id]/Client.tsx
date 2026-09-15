"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Trash2, AlertTriangle, Info } from "lucide-react"
import { ApiService } from "@/services/api"
import type { Biomarker, BiomarkerPanel, Country, CyotComponentPrice } from "@/types"
import { panelGaps, hasCountryOverrides, emptyMappedMarkets } from "@/lib/biomarkers"
import { ListingEditorShell, type EditorSection } from "@/components/catalogue/ListingEditorShell"
import { SectionHelp } from "@/components/catalogue/SectionHelp"
import { PanelCoverage } from "@/components/catalogue/PanelCoverage"
import { PanelPricing } from "@/components/catalogue/PanelPricing"
import { DiagnosticsBiomarkerMap } from "@/components/catalogue/DiagnosticsBiomarkerMap"
import { toast } from "sonner"

/** Markets a panel is mapped and measured against. */
const COVERAGE_COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT"]

/**
 * Panel editor, on the same chrome as every other catalogue editor.
 *
 * One section per screen rather than one long column: a panel carries identity,
 * a base member list, per-market maps, coverage and a derived price view, and
 * scrolling past four of them to reach the fifth is how the old single-column
 * version made the per-market mapping invisible.
 */
export default function PanelEditorPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    const [panel, setPanel] = useState<BiomarkerPanel | null>(null)
    const [master, setMaster] = useState<Biomarker[]>([])
    const [prices, setPrices] = useState<CyotComponentPrice[]>([])
    const [active, setActive] = useState("identity")
    const [confirmDelete, setConfirmDelete] = useState(false)

    useEffect(() => {
        Promise.all([
            ApiService.catalogue.biomarkerPanels(),
            ApiService.catalogue.biomarkers(),
            ApiService.catalogue.cyotComponentPrices(),
        ]).then(([ps, bs, pr]) => {
            setPanel(ps.find(p => p.id === id) ?? null)
            setMaster(bs)
            setPrices(pr)
        })
    }, [id])

    const save = async (patch: Partial<BiomarkerPanel>) => {
        if (!panel) return
        const saved = await ApiService.catalogue.savePanel({ ...panel, ...patch })
        setPanel(saved)
    }

    const gaps = useMemo(() => (panel ? panelGaps(panel, master) : []), [panel, master])

    const sections: EditorSection[] = useMemo(() => {
        if (!panel) return []
        const mapped = hasCountryOverrides(panel)
        return [
            { id: "identity", label: "Identity", group: "Foundation", hasError: !panel.nameEn?.trim() },
            {
                id: "markets", label: "Biomarkers per market", group: "Composition",
                badge: (panel.countryMembers ?? []).length || undefined,
                hasError: !mapped,
            },
            { id: "coverage", label: "Market coverage", group: "Insight" },
            { id: "pricing", label: "What it adds to a basket", group: "Insight" },
        ]
    }, [panel])

    if (!panel) {
        return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
    }

    const remove = async () => {
        await ApiService.catalogue.deletePanel(panel.id)
        toast.success(`${panel.nameEn} deleted. No biomarker was touched — only the grouping.`)
        router.push("/catalogue/panels")
    }

    return (
        <>
            <ListingEditorShell
                backHref="/catalogue/panels"
                title={panel.nameEn || "Untitled panel"}
                subtitle={`${(panel.countryMembers ?? []).length} market${
                    (panel.countryMembers ?? []).length === 1 ? "" : "s"} mapped · ${
                    panel.memberIds.length} biomarker${panel.memberIds.length === 1 ? "" : "s"} in total${
                    panel.labPanelCode ? ` · lab code ${panel.labPanelCode}` : " · no lab code"}`}
                titleBadge={
                    panel.isActive
                        ? <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">Active</Badge>
                        : <Badge variant="outline">Inactive</Badge>
                }
                headerActions={
                    <Button variant="ghost" size="sm" className="text-destructive"
                        onClick={() => setConfirmDelete(true)}>
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                    </Button>
                }
                saveLabel="Saved"
                sections={sections}
                activeSection={active}
                onSectionChange={setActive}
            >
                {gaps.length > 0 && (
                    <Card className="border-red-200 bg-red-50/50">
                        <CardContent className="space-y-1 p-4 text-sm text-red-900">
                            <p className="flex items-center gap-2 font-medium text-red-700">
                                <AlertTriangle className="h-4 w-4" /> Blocks use
                            </p>
                            {gaps.map((g, i) => <p key={i}>{g}</p>)}
                        </CardContent>
                    </Card>
                )}

                {/* ── Identity ───────────────────────────────── */}
                {active === "identity" && (
                    <div className="space-y-4">
                        <SectionHelp sectionId="biomarkerPanels" />
                        <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-base">Identity</CardTitle></CardHeader>
                            <CardContent className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Name (EN)</Label>
                                    <Input value={panel.nameEn} onChange={e => save({ nameEn: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Name (AR)</Label>
                                    <Input dir="rtl" value={panel.nameAr ?? ""}
                                        onChange={e => save({ nameAr: e.target.value })} />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Lab panel code</Label>
                                    <Input className="font-mono text-sm" placeholder="e.g. CBC-01"
                                        value={panel.labPanelCode ?? ""}
                                        onChange={e => save({ labPanelCode: e.target.value || undefined })} />
                                    <p className="text-[11px] leading-snug text-muted-foreground">
                                        Labs bill a panel under <strong>one</strong> code. Without it a basket
                                        containing this panel has to be split biomarker by biomarker.
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Active</Label>
                                    <div className="flex h-9 items-center gap-3">
                                        <Switch checked={panel.isActive}
                                            onCheckedChange={v => save({ isActive: v })} />
                                        <span className="text-xs text-muted-foreground">
                                            {panel.isActive
                                                ? "Selectable in packages and build-your-own."
                                                : "Hidden from pickers. Existing uses are unaffected."}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <Label className="text-xs">Note</Label>
                                    <Textarea rows={2} value={panel.note ?? ""}
                                        placeholder="Why this grouping exists, or what makes it unusual."
                                        onChange={e => save({ note: e.target.value || undefined })} />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── Per-market mapping ─────────────────────── */}
                {active === "markets" && (
                    <div className="space-y-4">
                        {emptyMappedMarkets(panel).length > 0 && (
                            <p className="flex gap-2 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                <span>
                                    {emptyMappedMarkets(panel).join(", ")} {emptyMappedMarkets(panel).length === 1 ? "is" : "are"} added
                                    but empty. Add biomarkers below, or remove the market — an empty map
                                    means this panel resolves to nothing there.
                                </span>
                            </p>
                        )}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">Biomarkers — per market</CardTitle>
                                <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                                    Membership is per market — there is no global list. A market with no
                                    map has no biomarkers in this panel at all, and the drift badge says
                                    when two mapped markets have diverged.
                                </p>
                            </CardHeader>
                            <CardContent>
                                {/* The SAME component the diagnostics listing uses — not a copy. */}
                                <DiagnosticsBiomarkerMap
                                    countries={COVERAGE_COUNTRIES}
                                    config={{ tier: "mini", biomarkerCountryMaps: panel.countryMembers ?? [] }}
                                    onChange={patch => save({ countryMembers: patch.biomarkerCountryMaps })}
                                />
                            </CardContent>
                        </Card>
                    </div>
                )}

                {active === "coverage" && (
                    <PanelCoverage panel={panel} biomarkers={master} countries={COVERAGE_COUNTRIES} />
                )}

                {active === "pricing" && (
                    <PanelPricing panel={panel} biomarkers={master} prices={prices}
                        countries={COVERAGE_COUNTRIES} />
                )}
            </ListingEditorShell>

            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete {panel.nameEn}?</DialogTitle>
                        <DialogDescription>
                            This removes the grouping only — every biomarker in it stays in the master and
                            keeps its bands, codes and prices. Any package or basket that referenced this
                            panel loses the reference, so check those first.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={remove}>Delete panel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

