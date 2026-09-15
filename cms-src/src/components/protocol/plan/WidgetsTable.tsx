"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertTriangle, ArrowDown, ArrowUp, LayoutList, Plus, Search, Trash, Wand2,
} from "lucide-react"
import { BLOCK_ORDER, BLOCK_REGISTRY } from "@/components/catalogue/page-builder/registry"
import { copyGaps, planDrift } from "@/lib/protocol-plans"
import type { Listing, PageBlock, PageBlockType, Protocol, ProtocolPlan } from "@/types"

const rid = () => Math.random().toString(36).slice(2, 9)

/**
 * WIDGETS — the list, the shape of the live screen's Manage view.
 *
 *   ID · Widget Selected · Widget Internal Name · Widget Rank · Status · Edit
 *
 * A page carries many widgets of the same type — the live Peptide page has
 * seven PRODUCT_LISTs — so the TYPE and the INTERNAL NAME are two columns and
 * not one. That is the whole reason a table beats a stack of cards here: you
 * scan eleven rows by rank and status in one look.
 *
 * THREE THINGS ARE ADDED, and each one replaces a trip somewhere else:
 *
 *   Up and down arrows   the live screen changes rank inside the drawer, one
 *                        widget at a time. Reordering eleven widgets that way
 *                        is eleven drawers.
 *   "no Arabic" marker   on the row that needs a translation, which is where
 *                        somebody would act on it.
 *   Drift line           only when the page sells something the steps do not
 *                        deliver. When they match, this says nothing.
 */
export function WidgetsTable({
    plan, protocol, listings, onChange, onOpen, onBuildFromSteps,
}: {
    plan: ProtocolPlan
    protocol: Protocol | null
    listings: Listing[]
    onChange: (blocks: PageBlock[]) => void
    onOpen: (id: string) => void
    onBuildFromSteps: () => void
}) {
    const [query, setQuery] = useState("")

    const sorted = useMemo(
        () => [...plan.blocks].sort((a, b) => a.rank - b.rank),
        [plan.blocks],
    )
    const rerank = (list: PageBlock[]) => list.map((b, i) => ({ ...b, rank: i }))

    /** Which widgets still need Arabic, so the marker sits on the right row. */
    const needsArabic = useMemo(() => {
        const set = new Set<string>()
        copyGaps(plan).forEach(g => { if (g.kind === "untranslated") set.add(g.blockId) })
        return set
    }, [plan])

    const drift = useMemo(
        () => planDrift(plan, protocol?.steps ?? []),
        [plan, protocol],
    )
    const listingName = (id: string) => {
        const l = listings.find(x => x.id === id)
        return l ? (l.displayNameEn || l.internalName) : id
    }
    const hasDrift = drift.missingFromPage.length > 0 || drift.extraOnPage.length > 0

    const add = (type: PageBlockType) => {
        const entry = BLOCK_REGISTRY[type]
        const block: PageBlock = {
            id: rid(), type, internalName: entry.label,
            rank: sorted.length, isActive: true,
            config: { ...entry.defaultConfig },
        }
        onChange(rerank([...sorted, block]))
        onOpen(block.id)
    }

    const move = (id: string, dir: -1 | 1) => {
        const at = sorted.findIndex(b => b.id === id)
        const to = at + dir
        if (to < 0 || to >= sorted.length) return
        const next = [...sorted]
        const [item] = next.splice(at, 1)
        next.splice(to, 0, item)
        onChange(rerank(next))
    }

    /* The sole instance of a mandatory type cannot go: a page needs its hero. */
    const isProtected = (b: PageBlock) => {
        const entry = BLOCK_REGISTRY[b.type]
        return !!entry.mandatory && sorted.filter(x => x.type === b.type).length <= 1
    }
    const remove = (id: string) => {
        const target = sorted.find(b => b.id === id)
        if (target && isProtected(target)) return
        onChange(rerank(sorted.filter(b => b.id !== id)))
    }

    const filtered = sorted.filter(b => {
        const needle = query.trim().toLowerCase()
        if (!needle) return true
        return `${b.type} ${b.internalName ?? ""}`.toLowerCase().includes(needle)
    })

    return (
        <div className="space-y-4">
            {/* ── Drift. Silent when the page matches the steps. ── */}
            {hasDrift && (
                <Card className="flex flex-wrap items-start gap-3 border-amber-200 bg-amber-50/70 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="min-w-0 flex-1 space-y-1 text-xs">
                        <p className="font-medium text-amber-900">
                            The page and the steps do not agree
                        </p>
                        {drift.missingFromPage.length > 0 && (
                            <p className="text-amber-800">
                                The steps deliver {drift.missingFromPage.map(listingName).join(", ")},
                                and no widget on the page names it.
                            </p>
                        )}
                        {drift.extraOnPage.length > 0 && (
                            <p className="text-rose-800">
                                The page sells {drift.extraOnPage.map(listingName).join(", ")},
                                and no step delivers it.
                            </p>
                        )}
                    </div>
                </Card>
            )}

            {/* ── The toolbar of the live screen: search, then add. ── */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search widgets…" className="h-9 w-56 pl-8 text-sm" />
                </div>

                <div className="ml-auto flex items-center gap-2">
                    {(protocol?.steps.length ?? 0) > 0 && (
                        <Button variant="outline" size="sm" onClick={onBuildFromSteps}>
                            <Wand2 className="mr-2 h-3.5 w-3.5" /> Build from the steps
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" /> Add New Widget
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[340px]">
                            {BLOCK_ORDER.filter(type => {
                                const entry = BLOCK_REGISTRY[type]
                                return !(entry.singleton && sorted.some(b => b.type === type))
                            }).map(type => {
                                const entry = BLOCK_REGISTRY[type]
                                const Icon = entry.icon
                                return (
                                    <DropdownMenuItem key={type} onClick={() => add(type)}
                                        className="flex items-start gap-3 py-2">
                                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div>
                                            <p className="font-mono text-xs">{type}</p>
                                            <p className="text-xs text-muted-foreground">{entry.description}</p>
                                        </div>
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card className="overflow-hidden p-0">
                {filtered.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 p-12 text-center">
                        <LayoutList className="h-6 w-6 text-muted-foreground" />
                        <p className="text-sm font-medium">
                            {sorted.length === 0 ? "This page has no widgets yet" : "Nothing matches that search"}
                        </p>
                        {sorted.length === 0 && (
                            <p className="max-w-sm text-xs text-muted-foreground">
                                Every page starts with a hero. Add one, or build the page from
                                the protocol&rsquo;s steps.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="w-20 text-xs">ID</TableHead>
                                    <TableHead className="text-xs">Widget Selected</TableHead>
                                    <TableHead className="text-xs">Widget Internal Name</TableHead>
                                    <TableHead className="w-32 text-xs">Widget Rank</TableHead>
                                    <TableHead className="w-24 text-xs">Status</TableHead>
                                    <TableHead className="w-40 text-right text-xs">Edit</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(b => {
                                    const i = sorted.findIndex(x => x.id === b.id)
                                    const entry = BLOCK_REGISTRY[b.type]
                                    const locked = isProtected(b)
                                    return (
                                        <TableRow key={b.id} className="hover:bg-muted/20">
                                            <TableCell className="py-2.5">
                                                <span className="font-mono text-[11px] text-muted-foreground">
                                                    {b.id.slice(0, 6)}
                                                </span>
                                            </TableCell>

                                            <TableCell className="py-2.5">
                                                <span className="font-mono text-xs">{b.type}</span>
                                            </TableCell>

                                            <TableCell className="py-2.5">
                                                <button className="text-left text-sm font-medium hover:underline"
                                                    onClick={() => onOpen(b.id)}>
                                                    {b.internalName || entry.label}
                                                </button>
                                                {needsArabic.has(b.id) && (
                                                    <Badge variant="outline"
                                                        className="ml-2 border-sky-200 bg-sky-50 text-[10px] text-sky-700">
                                                        no Arabic
                                                    </Badge>
                                                )}
                                            </TableCell>

                                            <TableCell className="py-2.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="w-5 text-sm">{b.rank + 1}</span>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"
                                                        disabled={i === 0} onClick={() => move(b.id, -1)}
                                                        aria-label="Move up">
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"
                                                        disabled={i === sorted.length - 1} onClick={() => move(b.id, 1)}
                                                        aria-label="Move down">
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-2.5">
                                                <Badge variant="outline" className={`text-[10px] ${b.isActive
                                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                    : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                                                    {b.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="py-2.5 text-right">
                                                <Button variant="outline" size="sm" className="h-8"
                                                    onClick={() => onOpen(b.id)}>
                                                    View
                                                </Button>
                                                <Button variant="ghost" size="icon" className="ml-1 h-8 w-8"
                                                    disabled={locked} onClick={() => remove(b.id)}
                                                    title={locked ? "A page needs its hero" : "Delete this widget"}>
                                                    <Trash className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    )
}
