"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    AlertTriangle, ArrowDown, ArrowUp, Check, ClipboardCopy, ListChecks, Plus, Trash,
} from "lucide-react"
import {
    captureLabel, compileTaskBoard, dayOneCount, gateWords, resetLabel, resolveTasks, takesUnit,
} from "@/lib/protocol-tasks"
import type { ResolvedTask } from "@/lib/protocol-tasks"
import type { Protocol, ProtocolTask } from "@/types"

/** The proof cell. A step, or the reason there is none. */
function GateCell({ r, end }: { r: ResolvedTask; end: "shows" | "hides" }) {
    const gate = end === "shows" ? r.task.showsAfter : r.task.hidesAfter
    const proof = end === "shows" ? r.showsProof : r.hidesProof
    const broken = end === "shows" ? r.showsBroken : r.hidesBroken

    if (end === "hides" && r.hidesAtEnd) {
        return <span className="text-xs text-muted-foreground">when the protocol finishes</span>
    }
    if (!gate) {
        return (
            <span className="text-xs text-muted-foreground">
                {end === "shows" ? "from the day they buy" : "never · it stays"}
            </span>
        )
    }
    if (broken) {
        return (
            <div>
                <div className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertTriangle className="h-3 w-3 shrink-0" /> no step produces one
                </div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {gateWords(gate as never)}
                </div>
            </div>
        )
    }
    return (
        <div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
                <Check className="h-3 w-3 shrink-0 text-emerald-600" />
                <span className="font-mono text-[11px]">step {proof!.order + 1}</span>
                <span className="text-xs text-muted-foreground">{proof!.titleEn}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
                {gateWords(gate as never)}
            </div>
        </div>
    )
}

/**
 * THIS PROTOCOL'S DAILY TASKS, in the order the patient sees them.
 *
 * Two columns carry the work: each task PROVES its own gate against the
 * protocol's own steps, so the screen reads "step 7 · Month 1 dispatched"
 * rather than "delivery". A gate nothing satisfies turns red here and refuses
 * at Publish, which is `chainFindings` pointed at tasks.
 *
 * Up and down arrows rather than dragging, the way the widget list does it:
 * the repo carries no drag library and a rank field inside a drawer means one
 * drawer per move.
 */
export function TaskBoardTable({
    tasks, protocol, pathId, onChange, onOpen, onAdd,
}: {
    tasks: ProtocolTask[]
    protocol: Protocol
    pathId: string
    onChange: (tasks: ProtocolTask[]) => void
    onOpen: (id: string) => void
    onAdd: () => void
}) {
    /* The compiled JSON, held only while the fallback dialog is open. */
    const [compiled, setCompiled] = useState<string | null>(null)

    const sorted = [...tasks].sort((a, b) => a.sortOrder - b.sortOrder)
    const rerank = (list: ProtocolTask[]) => list.map((t, i) => ({ ...t, sortOrder: i }))
    const rows = resolveTasks(tasks, protocol, pathId)

    const move = (id: string, dir: -1 | 1) => {
        const at = sorted.findIndex(t => t.id === id)
        const to = at + dir
        if (to < 0 || to >= sorted.length) return
        const next = [...sorted]
        const [item] = next.splice(at, 1)
        next.splice(to, 0, item)
        onChange(rerank(next))
    }

    const remove = (id: string) => onChange(rerank(sorted.filter(t => t.id !== id)))

    /**
     * THE HAND-OFF, and it has to work every time.
     *
     * The clipboard needs a secure context and the browser's permission, and
     * it is refused often enough that a button which only tries it is a button
     * that sometimes does nothing. So a refusal opens the JSON in a box the
     * person can read and select by hand. Seeing what you are about to paste
     * into a seed file is no loss.
     */
    const copy = () => {
        const json = JSON.stringify(compileTaskBoard(tasks, protocol), null, 2)
        if (!navigator.clipboard) { setCompiled(json); return }
        navigator.clipboard.writeText(json).then(
            () => toast.success("Copied.", {
                description: "Every gate is frozen to the step that satisfies it, ready to paste "
                    + "into the prototype's seed.",
            }),
            () => setCompiled(json),
        )
    }

    const onDayOne = dayOneCount(rows)

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                    {sorted.length} task{sorted.length === 1 ? "" : "s"} on this protocol
                </p>
                <Badge variant="outline" className={onDayOne
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-800"}>
                    {onDayOne} visible on day one
                </Badge>
                {sorted.some(t => t.coachMayRecommend) && (
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                        {sorted.filter(t => t.coachMayRecommend).length} open to a coach
                    </Badge>
                )}
                <div className="ml-auto flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={copy} disabled={!sorted.length}>
                        <ClipboardCopy className="mr-2 h-3.5 w-3.5" /> Copy the compiled board
                    </Button>
                    <Button size="sm" onClick={onAdd}>
                        <Plus className="mr-2 h-3.5 w-3.5" /> New task
                    </Button>
                </div>
            </div>

            {sorted.length === 0 ? (
                <Card className="flex flex-col items-center gap-2 border-dashed p-12 text-center">
                    <ListChecks className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">No daily tasks on this protocol</p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                        The patient&rsquo;s home screen would carry an empty card. Write at least
                        one task, and leave at least one of them ungated.
                    </p>
                    <Button size="sm" className="mt-3" onClick={onAdd}>
                        <Plus className="mr-2 h-3.5 w-3.5" /> Write the first one
                    </Button>
                </Card>
            ) : (
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="w-32 text-xs">Order</TableHead>
                                    <TableHead className="text-xs">Task</TableHead>
                                    <TableHead className="text-xs">Finished by</TableHead>
                                    <TableHead className="text-xs">Shows after</TableHead>
                                    <TableHead className="text-xs">Hides after</TableHead>
                                    <TableHead className="text-xs">Runs for</TableHead>
                                    <TableHead className="w-12 text-right" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((r, i) => {
                                    const t = r.task
                                    const bad = r.showsBroken || r.hidesBroken
                                        || (!!r.showsProof && !!r.hidesProof
                                            && r.hidesProof.order <= r.showsProof.order)
                                    return (
                                        <TableRow key={t.id}
                                            className={bad ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-muted/20"}>
                                            <TableCell className="py-2.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="w-5 text-sm tabular-nums">{i + 1}</span>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"
                                                        disabled={i === 0} onClick={() => move(t.id, -1)}
                                                        aria-label="Move up">
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"
                                                        disabled={i === rows.length - 1}
                                                        onClick={() => move(t.id, 1)} aria-label="Move down">
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-2.5">
                                                <button className="text-left font-medium hover:underline"
                                                    onClick={() => onOpen(t.id)}>
                                                    {t.titleEn || "Untitled task"}
                                                </button>
                                                <span className="block text-xs text-muted-foreground">
                                                    {t.subtitleEn || "— no line under it"}
                                                </span>
                                                <span className="mt-0.5 flex flex-wrap items-center gap-1">
                                                    <span className="font-mono text-[10px] text-muted-foreground">
                                                        {t.key || "— no key"}
                                                    </span>
                                                    {t.coachMayRecommend && (
                                                        <Badge variant="outline"
                                                            className="border-amber-200 bg-amber-50 text-[10px] text-amber-800">
                                                            a coach may add it
                                                        </Badge>
                                                    )}
                                                    {!t.isActive && (
                                                        <Badge variant="outline"
                                                            className="border-slate-200 bg-slate-50 text-[10px] text-slate-600">
                                                            off
                                                        </Badge>
                                                    )}
                                                </span>
                                            </TableCell>

                                            <TableCell className="py-2.5">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {captureLabel(t.capture)}
                                                    {takesUnit(t.capture) && t.unit ? ` · ${t.unit}` : ""}
                                                </Badge>
                                                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                                    {resetLabel(t.resets).toLowerCase()}
                                                    {t.signalKey ? ` · ${t.signalKey}` : ""}
                                                </span>
                                            </TableCell>

                                            <TableCell className="py-2.5"><GateCell r={r} end="shows" /></TableCell>
                                            <TableCell className="py-2.5"><GateCell r={r} end="hides" /></TableCell>

                                            <TableCell className="py-2.5">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {t.appliesTo?.length
                                                        ? t.appliesTo.join(" · ")
                                                        : protocol.variantAxis ? "both paths" : "everybody"}
                                                </Badge>
                                            </TableCell>

                                            <TableCell className="py-2.5 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8"
                                                    onClick={() => remove(t.id)} aria-label="Delete">
                                                    <Trash className="h-3.5 w-3.5" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            )}

            <Dialog open={!!compiled} onOpenChange={o => { if (!o) setCompiled(null) }}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>The compiled board</DialogTitle>
                        <DialogDescription>
                            This browser refused the clipboard, so here it is. Select it all and
                            copy it by hand. Every gate is frozen to the step that satisfies it,
                            which is how the prototype reads a gate — it holds step ids, not
                            outputs.
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea readOnly value={compiled ?? ""} rows={16}
                        className="font-mono text-[11px] leading-relaxed"
                        onFocus={e => e.currentTarget.select()} />
                    <DialogFooter>
                        <Button variant="outline" size="sm" onClick={() => setCompiled(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <p className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span aria-hidden>▲</span>
                <span>
                    A coach may add a task for one patient, and it sits <b>above</b> all of these
                    on that patient&rsquo;s screen. Those belong to the patient and not to the
                    protocol, so this screen cannot see them.
                </span>
            </p>
        </div>
    )
}
