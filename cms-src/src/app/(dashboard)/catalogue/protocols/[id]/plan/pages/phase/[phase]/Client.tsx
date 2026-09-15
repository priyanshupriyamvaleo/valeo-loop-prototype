"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { ApiService } from "@/services/api"
import { planStore, useHydrated, usePlan } from "@/lib/protocol-plans"
import {
    buildPhase, phaseGaps, phaseRanges, phasesOf,
} from "@/lib/protocol-journey"
import { JourneyWidgets } from "@/components/protocol/journey/JourneyWidgets"
import { JourneyBlockDrawer } from "@/components/protocol/journey/JourneyBlockDrawer"
import type { JourneyBlock, JourneyPhase, Protocol } from "@/types"

/**
 * MANAGE — the sections of ONE phase page.
 *
 * The same screen as the plan page's widgets, for a different widget set. It
 * is reached the same way too: Manage on the row, from the pages list.
 *
 * WRITES ARE IMMEDIATE, as they are there. A section cannot make a phase
 * Active on its own, so add, delete, reorder and every field write straight
 * through and nothing is lost by closing the drawer.
 */
export default function PhaseWidgetsPage() {
    const params = useParams()
    const protocolId = typeof params.id === "string" ? params.id : ""
    const raw = typeof params.phase === "string" ? Number(params.phase) : 1
    const phaseNo = (raw === 2 || raw === 3 ? raw : 1) as 1 | 2 | 3

    const hydrated = useHydrated()
    const plan = usePlan(protocolId)

    const [protocol, setProtocol] = useState<Protocol | null>(null)
    const [loading, setLoading] = useState(true)
    const [openId, setOpenId] = useState<string | null>(null)

    useEffect(() => {
        ApiService.catalogue.protocols()
            .then(list => setProtocol(list.find(p => p.id === protocolId) ?? null))
            .catch(() => setProtocol(null))
            .finally(() => setLoading(false))
    }, [protocolId])

    if (loading || !hydrated) {
        return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
    }

    /* No plan, no journey. A phase page belongs to a plan, the way a widget
       belongs to a page. */
    if (!plan) {
        return (
            <div className="py-16 text-center">
                <p className="text-sm font-medium">This protocol has no plan yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Add the plan page first. The weekly journey belongs to it.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href={`/catalogue/protocols/${protocolId}/plan/pages`}>
                        Back to the Page Builder
                    </Link>
                </Button>
            </div>
        )
    }

    const ranges = phaseRanges(plan)
    const range = ranges[phaseNo - 1]
    const phases = phasesOf(plan)
    const phase = phases[phaseNo - 1]
    const gaps = phaseGaps(phase, range)

    const savePhase = (next: JourneyPhase) => {
        planStore.save(protocolId, {
            ...plan,
            phases: phases.map(p => (p.phase === phaseNo ? next : p)),
        })
    }

    const setBlocks = (blocks: JourneyBlock[]) => savePhase({ ...phase, blocks })

    const build = () => {
        const built = buildPhase(phaseNo, range)
        /* The name is the author's if they have set one. Only the sections are
           laid out, because that is what was asked for. */
        savePhase({ ...built, pageName: phase.pageName || built.pageName, status: phase.status })
        toast.success("Laid out.", {
            description: "Five sections in the designed order, worded for this phase. Edit any of them.",
        })
    }

    const block = phase.blocks.find(b => b.id === openId) ?? null
    const patchBlock = (patch: Partial<JourneyBlock>) => {
        if (!openId) return
        setBlocks(phase.blocks.map(b => (b.id === openId ? { ...b, ...patch } : b)))
    }

    const live = phase.status === "published"

    return (
        <div className="space-y-5">
            <div>
                <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-7 text-muted-foreground" asChild>
                    <Link href={`/catalogue/protocols/${protocolId}/plan/pages`}>
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Page Builder
                    </Link>
                </Button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold">
                            {phase.pageName || `Phase ${phaseNo}`}
                        </h2>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            {protocol?.nameEn} · the weekly journey page a patient opens from Today
                            in {range.label}.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className={live
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"}>
                            {live ? "Active" : "Inactive"}
                        </Badge>
                        {/* The other two phases, one click away: the words only make
                            sense read against each other. */}
                        {ranges.filter(r => r.phase !== phaseNo).map(r => (
                            <Button key={r.phase} variant="outline" size="sm" asChild>
                                <Link href={`/catalogue/protocols/${protocolId}/plan/pages/phase/${r.phase}`}>
                                    Phase {r.phase} · {r.label}
                                </Link>
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {gaps.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/60 p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        {gaps.length === 1
                            ? "One thing stops this page being Active"
                            : `${gaps.length} things stop this page being Active`}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-amber-900">
                        {gaps.map((g, i) => (
                            <li key={i}><b>{g.what}.</b> <span className="text-amber-800">{g.why}</span></li>
                        ))}
                    </ul>
                </Card>
            )}

            <JourneyWidgets phase={phase} range={range}
                onChange={setBlocks} onOpen={setOpenId} onBuild={build} />

            <JourneyBlockDrawer block={block} range={range}
                onChange={patchBlock}
                onSave={() => { setOpenId(null); toast.success("Saved.") }}
                onClose={() => setOpenId(null)} />
        </div>
    )
}

