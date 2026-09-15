"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { ApiService } from "@/services/api"
import {
    buildFromSteps, planStore, planUrl, useHydrated, usePlan,
} from "@/lib/protocol-plans"
import { DEMO_LISTINGS } from "@/lib/package-demo-catalogue"
import { WidgetsTable } from "@/components/protocol/plan/WidgetsTable"
import { WidgetDrawer } from "@/components/protocol/plan/WidgetDrawer"
import type { Listing, PageBlock, Protocol } from "@/types"

/**
 * MANAGE — the widget screen, a screen of its own, the way the live one is.
 *
 * WRITES ARE IMMEDIATE HERE, and that is deliberate. On the pages list a Save
 * has to exist, because Active means a patient can open the page and the rules
 * run at that moment. A widget cannot make a page Active, so add, delete,
 * reorder and every field write straight through. Nothing is lost by closing
 * the drawer, and there is no second state to keep in step.
 */
export default function PlanWidgetsPage() {
    const params = useParams()
    const protocolId = typeof params.id === "string" ? params.id : ""

    const hydrated = useHydrated()
    const plan = usePlan(protocolId)

    const [protocol, setProtocol] = useState<Protocol | null>(null)
    const [serviceListings, setServiceListings] = useState<Listing[]>([])
    const [loading, setLoading] = useState(true)
    const [openId, setOpenId] = useState<string | null>(null)

    useEffect(() => {
        ApiService.catalogue.protocols()
            .then(list => setProtocol(list.find(p => p.id === protocolId) ?? null))
            .catch(() => setProtocol(null))
            .finally(() => setLoading(false))
        /* The catalogue reaches the real content service, which answers 401
           without a session. Caught on its own, so it never blanks the screen. */
        ApiService.catalogue.listings().then(setServiceListings).catch(() => setServiceListings([]))
    }, [protocolId])

    /**
     * The same catalogue the Package Builder prices against, so a product list
     * on the page can name the items the package sells. `listings()` returns
     * list rows with no prices; the snapshot fills them in and is never a
     * fallback inside that call.
     */
    const listings = useMemo(() => [...serviceListings, ...DEMO_LISTINGS], [serviceListings])

    const setBlocks = (blocks: PageBlock[]) => {
        if (!plan) return
        planStore.save(protocolId, { ...plan, blocks })
    }

    const buildFromProtocolSteps = () => {
        if (!plan || !protocol) return
        planStore.save(protocolId, buildFromSteps(plan, protocol))
        toast.success("Built from the steps.", {
            description: "The how-it-works widget and the included widget now match the steps.",
        })
    }

    /* Rank is set from the drawer as well as from the row arrows. */
    const setRank = (blockId: string, rank: number) => {
        if (!plan) return
        const sorted = [...plan.blocks].sort((a, b) => a.rank - b.rank)
        const at = sorted.findIndex(b => b.id === blockId)
        if (at === -1) return
        const to = Math.max(0, Math.min(sorted.length - 1, rank))
        const [item] = sorted.splice(at, 1)
        sorted.splice(to, 0, item)
        setBlocks(sorted.map((b, i) => ({ ...b, rank: i })))
    }

    if (loading || !hydrated) {
        return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
    }

    /* No page, no widgets. Send the person to the step that comes first. */
    if (!plan) {
        return (
            <div className="py-16 text-center">
                <p className="text-sm font-medium">This protocol has no page yet</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Add the page first. Widgets belong to a page.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href={`/catalogue/protocols/${protocolId}/plan/pages`}>
                        Back to the Page Builder
                    </Link>
                </Button>
            </div>
        )
    }

    const openBlock = plan.blocks.find(b => b.id === openId) ?? null

    return (
        <div className="space-y-5">
            <div>
                <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-7 text-muted-foreground" asChild>
                    <Link href={`/catalogue/protocols/${protocolId}/plan/pages`}>
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Page Builder
                    </Link>
                </Button>
                <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-semibold">{plan.pageName || "Untitled page"}</h2>
                    <Badge variant="outline" className={plan.status === "published"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-amber-200 bg-amber-50 text-amber-700"}>
                        {plan.status === "published" ? "Active" : "Inactive"}
                    </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                    The widgets of <code className="font-mono text-xs">{planUrl(plan)}</code>.
                    Order and status save at once.
                </p>
            </div>

            <WidgetsTable
                plan={plan}
                protocol={protocol}
                listings={listings}
                onChange={setBlocks}
                onOpen={setOpenId}
                onBuildFromSteps={buildFromProtocolSteps}
            />

            <WidgetDrawer
                block={openBlock}
                count={plan.blocks.length}
                listings={listings}
                onChange={patch => setBlocks(plan.blocks.map(b =>
                    b.id === openId ? { ...b, ...patch } : b))}
                onRank={rank => openId && setRank(openId, rank)}
                onSave={() => {
                    setOpenId(null)
                    toast.success("Saved.")
                }}
                onClose={() => setOpenId(null)}
            />
        </div>
    )
}
