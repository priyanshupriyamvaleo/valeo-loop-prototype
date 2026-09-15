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
import { Plus, Search, Layers, ChevronRight, AlertTriangle } from "lucide-react"
import { ApiService } from "@/services/api"
import type { Biomarker, BiomarkerPanel, Country } from "@/types"
import { panelGaps } from "@/lib/biomarkers"
import { toast } from "sonner"

const MARKETS: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT"]

/**
 * Panels index. A list that opens an editor, matching Listings — the editing
 * itself lives on the section-per-screen editor rather than in a side panel,
 * because a panel now carries identity, per-market maps, coverage and a derived
 * price view and none of that fits beside a list.
 */
export default function PanelsPage() {
    const router = useRouter()
    const [panels, setPanels] = useState<BiomarkerPanel[]>([])
    const [master, setMaster] = useState<Biomarker[]>([])
    const [query, setQuery] = useState("")
    const [creating, setCreating] = useState(false)
    const [draftName, setDraftName] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            ApiService.catalogue.biomarkerPanels(),
            ApiService.catalogue.biomarkers(),
        ]).then(([p, b]) => { setPanels(p); setMaster(b) }).finally(() => setLoading(false))
    }, [])

    const rows = useMemo(() => {
        const q = query.trim().toLowerCase()
        return panels
            .filter(p => !q || p.nameEn.toLowerCase().includes(q) || (p.labPanelCode ?? "").toLowerCase().includes(q))
            .map(p => ({ panel: p, gaps: panelGaps(p, master) }))
    }, [panels, master, query])

    const create = async () => {
        const name = draftName.trim()
        if (!name) { toast.error("Name it first."); return }
        const saved = await ApiService.catalogue.savePanel({ nameEn: name, memberIds: [], isActive: true })
        setCreating(false); setDraftName("")
        toast.success(`${saved.nameEn} created. Map its biomarkers per market next.`)
        router.push(`/catalogue/panels/${saved.id}`)
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Panels</h1>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                        Clinical groupings — CBC, Lipid Profile. A panel is not sellable: it has no price
                        and no SKU. It is what a package or a build-your-own basket composes, and it
                        expands to its biomarkers wherever it is used.
                    </p>
                </div>
                <Button onClick={() => setCreating(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New panel
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Search by name or lab code"
                    value={query} onChange={e => setQuery(e.target.value)} />
            </div>

            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
                <Card className="overflow-hidden">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm">
                            {rows.length} panel{rows.length === 1 ? "" : "s"}
                        </CardTitle>
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-0">
                        {rows.map(({ panel, gaps }) => (
                            <Link key={panel.id} href={`/catalogue/panels/${panel.id}`}
                                className="flex items-center gap-3 border-b px-4 py-3 transition last:border-0 hover:bg-muted/30">
                                <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <span className="flex items-center gap-2 text-sm font-medium">
                                        {panel.nameEn}
                                        {!panel.isActive && (
                                            <Badge variant="outline" className="h-4 px-1.5 text-[9px]">inactive</Badge>
                                        )}
                                    </span>
                                    <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                                        <span>{panel.memberIds.length} biomarker{panel.memberIds.length === 1 ? "" : "s"}</span>
                                        <span>
                                            {MARKETS.map(m => {
                                                const n = (panel.countryMembers ?? [])
                                                    .find(x => x.country === m)?.biomarkerIds.length
                                                return (
                                                    <span key={m} className={n ? "" : "opacity-40"}>
                                                        {m} {n ?? "—"}{m === "KUWAIT" ? "" : " · "}
                                                    </span>
                                                )
                                            })}
                                        </span>
                                        {panel.labPanelCode
                                            ? <span className="font-mono">{panel.labPanelCode}</span>
                                            : <span className="text-amber-600">no lab code</span>}
                                    </span>
                                </div>
                                {gaps.length > 0 && (
                                    <Badge variant="outline" className="gap-1 border-red-200 bg-red-50 text-red-700">
                                        <AlertTriangle className="h-3 w-3" />{gaps.length}
                                    </Badge>
                                )}
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </Link>
                        ))}
                        {!rows.length && (
                            <div className="px-4 py-12 text-center">
                                <Layers className="mx-auto mb-2 h-6 w-6 opacity-40" />
                                <p className="text-sm text-muted-foreground">
                                    {query ? "Nothing matches." : "No panels yet."}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Dialog open={creating} onOpenChange={setCreating}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New panel</DialogTitle>
                        <DialogDescription>
                            A clinical grouping. It carries no price and no market of its own — those
                            belong to whatever sells it. You map its biomarkers per market next.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-1.5">
                        <Label>Name</Label>
                        <Input autoFocus value={draftName} placeholder="e.g. Iron Studies"
                            onChange={e => setDraftName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") create() }} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
                        <Button onClick={create}>Create</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
