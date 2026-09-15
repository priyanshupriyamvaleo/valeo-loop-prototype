"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Coins, LayoutTemplate, ListChecks } from "lucide-react"
import { ApiService } from "@/services/api"
import { MONEY, resolveComposition } from "@/lib/composition"
import { ALL_PATHS, pathsOf } from "@/lib/protocol-chain"
import type { ProtocolPath } from "@/lib/protocol-chain"
import { planUrl, useHydrated, usePlan } from "@/lib/protocol-plans"
import { boardGaps, dayOneCount, resolveTasks, useProtocolTasks } from "@/lib/protocol-tasks"
import { DEMO_LISTINGS } from "@/lib/package-demo-catalogue"
import type { Composition, Listing, Protocol } from "@/types"

/**
 * PLAN BUILDER — the door.
 *
 * A plan is two things, and they are made by different people:
 *
 *   THE PAGE     what a patient reads before buying. Words, an address, and
 *                ranked widgets.
 *   THE PACKAGE  what a patient buys. Items read off the steps, a quantity per
 *                item, and a price per market.
 *
 * They were one screen and that was the confusion. A page has no price and a
 * package has no copy, so one screen meant one of the two was always in the
 * way. Two doors, and each one says what is behind it.
 */
export default function PlanBuilderDoor() {
    const params = useParams()
    const protocolId = typeof params.id === "string" ? params.id : ""

    const hydrated = useHydrated()
    const plan = usePlan(protocolId)
    const tasks = useProtocolTasks(protocolId)

    const [protocol, setProtocol] = useState<Protocol | null>(null)
    const [listings, setListings] = useState<Listing[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        ApiService.catalogue.protocols()
            .then(list => setProtocol(list.find(p => p.id === protocolId) ?? null))
            .catch(() => setProtocol(null))
            .finally(() => setLoading(false))
        ApiService.catalogue.listings().then(setListings).catch(() => setListings([]))
    }, [protocolId])

    if (loading || !hydrated) {
        return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
    }

    if (!protocol) {
        return (
            <div className="py-16 text-center">
                <p className="text-sm font-medium">That protocol is not in the catalogue</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/catalogue/protocols">Back to protocols</Link>
                </Button>
            </div>
        )
    }

    /* Every path's package, priced in UAE purely so the card can state one.
       The Package Builder is where a market and a path are chosen.

       In the PROTOCOL's path order, not the order they happened to be saved
       in, and under the path's own label rather than its raw value. */
    const pool = [...listings, ...DEMO_LISTINGS]
    const built = (protocol ? pathsOf(protocol) : [])
        .map(pp => ({ path: pp, pkg: plan?.packages?.[pp.id] }))
        .filter((x): x is { path: ProtocolPath; pkg: Composition } =>
            !!x.pkg && x.pkg.members.length > 0)
        .map(x => ({ ...x, res: resolveComposition(x.pkg, pool, "UAE") }))

    const pageLive = plan?.status === "published"

    /** Minor units only where there are any, so a price never reads "3,814.8". */
    const money = (n: number) => n.toLocaleString(undefined, {
        minimumFractionDigits: Math.abs(n % 1) < 1e-9 ? 0 : MONEY.UAE.minorUnits,
        maximumFractionDigits: MONEY.UAE.minorUnits,
    })

    const taskGaps = boardGaps(tasks, protocol)

    const CARDS = [
        {
            href: `/catalogue/protocols/${protocolId}/plan/pages`,
            icon: LayoutTemplate,
            title: "Page Builder",
            blurb: "What a patient reads before buying. The words, the address, and the widgets the page is made of.",
            state: !plan
                ? { text: "No page yet", tone: "muted" as const }
                : {
                    text: `${plan.pageName || "Untitled page"} · ${plan.blocks.length} widget${plan.blocks.length === 1 ? "" : "s"}`,
                    tone: pageLive ? "live" as const : "draft" as const,
                    badge: pageLive ? "Active" : "Inactive",
                    url: planUrl(plan),
                },
        },
        {
            href: `/catalogue/protocols/${protocolId}/plan/package`,
            icon: Coins,
            title: "Package Builder",
            blurb: "What a patient buys, and what it costs. The items come off the steps; the price is set per market.",
            state: built.length === 0
                ? { text: "No package yet", tone: "muted" as const }
                : {
                    /* One line per path, because a male package and a female
                       package are two different sets of items and two prices. */
                    text: built.map(b => {
                        const label = b.path.id === ALL_PATHS ? "" : `${b.path.label} · `
                        return `${label}${b.pkg.members.length} item${b.pkg.members.length === 1 ? "" : "s"}${
                            b.res.total !== undefined
                                ? ` · ${MONEY.UAE.code} ${money(b.res.total)}`
                                : " · no UAE price"}`
                    }).join("   |   "),
                    /* A Composition's status is the catalogue's ProductStatus, so
                       "active" is the live word here, not "published". */
                    tone: built.some(b => b.pkg.status === "active") ? "live" as const : "draft" as const,
                    badge: built.every(b => b.pkg.status === "active") ? "Active"
                        : built.some(b => b.pkg.status === "active") ? "Part active" : "Inactive",
                },
        },
        {
            href: `/catalogue/protocols/${protocolId}/plan/tasks`,
            icon: ListChecks,
            title: "Tasks and metrics",
            blurb: "What a patient does every day, and the row of figures above it. Each task shows and hides on a step, never on a date.",
            state: tasks.length === 0
                ? { text: "No tasks yet", tone: "muted" as const }
                : {
                    text: `${tasks.length} task${tasks.length === 1 ? "" : "s"} \u00b7 ${
                        dayOneCount(resolveTasks(tasks, protocol))} visible on day one`,
                    /* A broken gate is a task that never reaches a patient, so
                       the door says so rather than the board alone. */
                    tone: taskGaps.length ? "draft" as const : "live" as const,
                    badge: taskGaps.length
                        ? `${taskGaps.length} to fix`
                        : "Live with the protocol",
                },
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-7 text-muted-foreground" asChild>
                    <Link href={`/catalogue/protocols/${protocolId}`}>
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                        {protocol.nameEn} · Step Builder
                    </Link>
                </Button>
                <h2 className="text-xl font-semibold">Plan Builder</h2>
                <p className="max-w-3xl text-sm text-muted-foreground">
                    Everything a patient meets before they start{" "}
                    <span className="font-medium">{protocol.nameEn}</span>. The Step Builder
                    decides what is delivered; these three decide what a patient reads, what
                    they pay, and what they do afterwards.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {CARDS.map(c => {
                    const Icon = c.icon
                    return (
                        <Link key={c.href} href={c.href} className="group">
                            <Card className="flex h-full flex-col gap-3 p-5 transition-colors hover:border-primary/40 hover:bg-muted/30">
                                <div className="flex items-start gap-3">
                                    <span className="rounded-md border bg-muted/50 p-2">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium">{c.title}</p>
                                        <p className="text-xs text-muted-foreground">{c.blurb}</p>
                                    </div>
                                    <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                </div>

                                <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-3">
                                    {"badge" in c.state && c.state.badge && (
                                        <Badge variant="outline" className={c.state.tone === "live"
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : "border-amber-200 bg-amber-50 text-amber-700"}>
                                            {c.state.badge}
                                        </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">{c.state.text}</span>
                                    {"url" in c.state && c.state.url && (
                                        <code className="ml-auto font-mono text-[10px] text-muted-foreground">
                                            {c.state.url}
                                        </code>
                                    )}
                                </div>
                            </Card>
                        </Link>
                    )
                })}
            </div>

            <Card className="bg-muted/30 p-4">
                <p className="text-sm font-medium">How the three fit together</p>
                <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    <li><b>1.</b> The Step Builder decides what the protocol delivers, and in what order.</li>
                    <li><b>2.</b> The Package Builder reads those steps. One step that links an item puts one unit in the package.</li>
                    <li><b>3.</b> The Page Builder describes it, and links to the catalogue items the steps already name.</li>
                    <li><b>4.</b> Tasks read the steps too, and only to answer one question per task: which step turns it on, and which one turns it off.</li>
                    <li><b>5.</b> Each one goes live on its own: a package can be priced while the page is still being written. Tasks are live when the protocol is, because somebody who has bought needs them either way.</li>
                </ol>
            </Card>
        </div>
    )
}
