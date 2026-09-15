"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowDown, ArrowUp, LayoutList, Plus, Trash, Wand2 } from "lucide-react"
import {
    JOURNEY_BLOCKS, blockLabel, blockSpec, emptyBlock, takesItems,
} from "@/lib/protocol-journey"
import type { PhaseRange } from "@/lib/protocol-journey"
import type { JourneyBlock, JourneyBlockType, JourneyPhase } from "@/types"

/**
 * THE SECTIONS OF ONE PHASE PAGE, ranked.
 *
 * The same mechanics as the plan page's widget list, because it is the same
 * job and staff should not have to learn it twice: sort on read, rerank on
 * every write, and up and down arrows rather than a rank field buried in a
 * drawer — reordering five sections that way is five drawers.
 *
 * The set is closed and small. Two of the five exist once per page (the hero
 * and the care-team card), so the menu stops offering them once they are
 * there, rather than letting somebody add a second hero and wonder which one
 * the patient sees.
 */
export function JourneyWidgets({
    phase, range, onChange, onOpen, onBuild,
}: {
    phase: JourneyPhase
    range: PhaseRange
    onChange: (blocks: JourneyBlock[]) => void
    onOpen: (id: string) => void
    /** Lay the page out as designed, with this phase's words in it. */
    onBuild: () => void
}) {
    const sorted = [...phase.blocks].sort((a, b) => a.rank - b.rank)
    const rerank = (list: JourneyBlock[]) => list.map((b, i) => ({ ...b, rank: i }))

    const move = (id: string, dir: -1 | 1) => {
        const at = sorted.findIndex(b => b.id === id)
        const to = at + dir
        if (to < 0 || to >= sorted.length) return
        const next = [...sorted]
        const [item] = next.splice(at, 1)
        next.splice(to, 0, item)
        onChange(rerank(next))
    }

    const add = (type: JourneyBlockType) => {
        const block = emptyBlock(type, sorted.length)
        onChange(rerank([...sorted, block]))
        onOpen(block.id)
    }

    const remove = (id: string) => onChange(rerank(sorted.filter(b => b.id !== id)))

    /* A section that exists once per page is spent once it is on the page. */
    const spent = (t: JourneyBlockType) =>
        !!blockSpec(t)?.once && sorted.some(b => b.type === t)

    const offer = JOURNEY_BLOCKS.filter(b => !spent(b.id))

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                    {sorted.length} section{sorted.length === 1 ? "" : "s"} · {range.label}
                </p>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    {sorted.length === 0 && (
                        <Button variant="outline" size="sm" onClick={onBuild}>
                            <Wand2 className="mr-2 h-3.5 w-3.5" /> Lay out the page
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" disabled={!offer.length}>
                                <Plus className="mr-2 h-3.5 w-3.5" /> Add a section
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72">
                            {offer.map(b => (
                                <DropdownMenuItem key={b.id} onClick={() => add(b.id)}
                                    className="flex-col items-start gap-0.5">
                                    <span className="text-xs font-medium">{b.label}</span>
                                    <span className="text-[10px] text-muted-foreground">{b.blurb}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {sorted.length === 0 ? (
                <Card className="flex flex-col items-center gap-2 border-dashed p-12 text-center">
                    <LayoutList className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">This phase page is empty</p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                        A patient reading {range.label} would open nothing. Lay the
                        page out as designed and reword it, or add the sections one at a time.
                    </p>
                    <Button size="sm" className="mt-3" onClick={onBuild}>
                        <Wand2 className="mr-2 h-3.5 w-3.5" /> Lay out the page
                    </Button>
                </Card>
            ) : (
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="w-32 text-xs">Rank</TableHead>
                                    <TableHead className="text-xs">Section</TableHead>
                                    <TableHead className="text-xs">What it says</TableHead>
                                    <TableHead className="w-24 text-xs text-center">Lines</TableHead>
                                    <TableHead className="w-24 text-xs">Status</TableHead>
                                    <TableHead className="w-12 text-right" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sorted.map((b, i) => (
                                    <TableRow key={b.id} className="hover:bg-muted/20">
                                        <TableCell className="py-2.5">
                                            <div className="flex items-center gap-1">
                                                <span className="w-5 text-sm tabular-nums">{b.rank + 1}</span>
                                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                                    disabled={i === 0} onClick={() => move(b.id, -1)}
                                                    aria-label="Move up">
                                                    <ArrowUp className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                                    disabled={i === sorted.length - 1}
                                                    onClick={() => move(b.id, 1)} aria-label="Move down">
                                                    <ArrowDown className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-2.5">
                                            <button className="text-left font-medium hover:underline"
                                                onClick={() => onOpen(b.id)}>
                                                {blockLabel(b.type)}
                                            </button>
                                            <span className="block font-mono text-[10px] text-muted-foreground">
                                                {b.type}
                                            </span>
                                        </TableCell>

                                        <TableCell className="py-2.5">
                                            <span className="block text-sm">
                                                {b.config.headingEn || (
                                                    <span className="text-muted-foreground italic">no heading</span>
                                                )}
                                            </span>
                                            <span className="block max-w-md truncate text-[11px] text-muted-foreground">
                                                {b.config.blurbEn || "—"}
                                            </span>
                                        </TableCell>

                                        <TableCell className="py-2.5 text-center text-sm tabular-nums">
                                            {takesItems(b.type)
                                                ? (b.config.items?.length ?? 0)
                                                : <span className="text-muted-foreground">—</span>}
                                        </TableCell>

                                        <TableCell className="py-2.5">
                                            <Badge variant="outline" className={b.isActive
                                                ? "border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700"
                                                : "border-slate-200 bg-slate-50 text-[10px] text-slate-600"}>
                                                {b.isActive ? "On" : "Off"}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="py-2.5 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8"
                                                onClick={() => remove(b.id)} aria-label="Delete">
                                                <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}
        </div>
    )
}
