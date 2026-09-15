"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Search, Loader2, Info, ExternalLink } from "lucide-react"
import type { SampleKind } from "@/types"
import { toast } from "sonner"

export interface LoincHit {
    loincNum: string
    longCommonName: string
    component: string
    property?: string
    method?: string
    shortName?: string
    specimenGuess?: SampleKind
    specimenPhrase?: string
    propertyMeaning?: string
    looksLikePanel: boolean
}

/**
 * Search LOINC live and create an biomarker from a term.
 *
 * The source is the NLM Clinical Table Search Service — public, no key, and
 * queried live rather than imported, so there is no stale copy to re-sync.
 *
 * The dialog is explicit about what a term does and does not supply, because
 * the tempting version of this feature quietly invents the missing half. LOINC
 * gives identity and a code; it has no unit, no tube, no fasting rule and no
 * reference band, so the record lands as a draft with its gaps intact.
 */
export function LoincSearch({ open, onOpenChange, onCreated }: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: (biomarkerId: string) => void
}) {
    const [terms, setTerms] = useState("")
    const [onlyPanels, setOnlyPanels] = useState(false)
    const [hits, setHits] = useState<LoincHit[]>([])
    const [loading, setLoading] = useState(false)
    const [creating, setCreating] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const seq = useRef(0)

    useEffect(() => {
        if (!open) return
        const q = terms.trim()
        if (q.length < 2) { setHits([]); setError(null); return }
        const mine = ++seq.current
        setLoading(true)
        const t = setTimeout(async () => {
            try {
                const res = await fetch(
                    `/api/loinc/search?terms=${encodeURIComponent(q)}&max=25${onlyPanels ? "&panels=1" : ""}`)
                const body = await res.json()
                // Ignore a response that a later keystroke has already superseded.
                if (mine !== seq.current) return
                if (!res.ok) { setError(body.error ?? "LOINC lookup failed"); setHits([]) }
                else { setError(null); setHits(body.hits ?? []) }
            } catch {
                if (mine === seq.current) { setError("Could not reach the LOINC service."); setHits([]) }
            } finally {
                if (mine === seq.current) setLoading(false)
            }
        }, 250)
        return () => clearTimeout(t)
    }, [terms, onlyPanels, open])

    const create = async (hit: LoincHit) => {
        setCreating(hit.loincNum)
        try {
            const res = await fetch("/api/biomarkers/from-loinc", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(hit),
            })
            const body = await res.json()
            if (!res.ok) { toast.error(body.error ?? "Could not create it."); return }
            toast.success(`${hit.component} created as a draft, with ${hit.loincNum} mapped.`)
            onOpenChange(false)
            onCreated(body.biomarker.id)
        } finally {
            setCreating(null)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Create from LOINC</DialogTitle>
                    <DialogDescription>
                        Searching LOINC live — no local copy, so it is never stale. Picking a term
                        writes the biomarker and maps its code in one step.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <Label className="text-xs">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input autoFocus className="pl-8" value={terms}
                                    placeholder="Biomarker name, or a LOINC number"
                                    onChange={e => setTerms(e.target.value)} />
                            </div>
                        </div>
                        <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-xs">
                            <input type="checkbox" checked={onlyPanels}
                                onChange={e => setOnlyPanels(e.target.checked)} />
                            Panels only
                        </label>
                    </div>

                    <div className="rounded-md border-l-2 border-primary/40 bg-muted/30 px-3 py-2">
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                            <strong className="text-foreground">A LOINC term supplies</strong> the name, an
                            internal name, the analytical method, the specimen (parsed from the term&rsquo;s
                            own name, so confirm it) and the code itself.{" "}
                            <strong className="text-foreground">It does not supply</strong> the UCUM unit,
                            tube, fasting rule, turnaround, reference bands, Arabic or patient copy,
                            component price or lab mappings — so the record arrives as a draft and the
                            authoring gates still ask for those. The unit is deliberately not guessed from
                            the property code.
                        </p>
                    </div>

                    <Separator />

                    <div className="max-h-[46vh] space-y-1.5 overflow-y-auto">
                        {loading && (
                            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Searching LOINC…
                            </p>
                        )}
                        {error && (
                            <p className="rounded-md border-l-2 border-red-400 bg-red-50/60 px-3 py-2 text-xs text-red-900">
                                {error}
                            </p>
                        )}
                        {!loading && !error && terms.trim().length >= 2 && !hits.length && (
                            <p className="py-6 text-center text-sm text-muted-foreground">
                                No LOINC term matches that.
                            </p>
                        )}
                        {!loading && hits.map(h => (
                            <div key={h.loincNum}
                                className="flex items-start justify-between gap-3 rounded-md border px-3 py-2">
                                <div className="min-w-0">
                                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                        {h.component}
                                        <span className="font-mono text-[10px] text-muted-foreground">{h.loincNum}</span>
                                        {h.looksLikePanel && (
                                            <Badge variant="outline" className="h-4 px-1.5 text-[9px]">panel</Badge>
                                        )}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">{h.longCommonName}</p>
                                    <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
                                        {h.specimenGuess
                                            ? <span>specimen <strong className="capitalize">{h.specimenGuess}</strong>
                                                {h.specimenPhrase ? ` (from “${h.specimenPhrase}”)` : ""}</span>
                                            : <span className="text-amber-600">specimen not stated in the name</span>}
                                        {h.method && <span>method {h.method}</span>}
                                        {h.propertyMeaning && <span>{h.propertyMeaning}</span>}
                                    </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-1.5">
                                    <a href={`https://loinc.org/${h.loincNum}/`} target="_blank" rel="noreferrer"
                                        className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                                        title="Open on loinc.org">
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </a>
                                    <Button size="sm" disabled={creating !== null}
                                        onClick={() => create(h)}>
                                        {creating === h.loincNum
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : "Create"}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="items-center justify-between sm:justify-between">
                    <p className="flex items-start gap-1.5 text-[10px] leading-snug text-muted-foreground">
                        <Info className="mt-0.5 h-3 w-3 shrink-0" />
                        <span>
                            LOINC is used under its licence, which permits commercial use with
                            attribution. Results are ranked by the public NLM service, which does not
                            expose LOINC&rsquo;s own common-test rank — so a rarer term can outrank the
                            one you want. Check the code before creating.
                        </span>
                    </p>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
