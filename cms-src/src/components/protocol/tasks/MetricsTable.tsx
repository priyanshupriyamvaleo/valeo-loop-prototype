"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowDown, ArrowUp, Gauge, Plus, Trash } from "lucide-react"
import {
    METRICS, SHOWN_ON_PHONE, activeMetrics, emptyMetric, metricLabel, metricSpec,
} from "@/lib/protocol-metrics"
import type { MetricSource, ProtocolMetric, ProtocolTask } from "@/types"

/**
 * THE ROW OF TILES ABOVE THE TASK LIST.
 *
 * EDITED WHERE IT STANDS, with no drawer. A metric is three things — which
 * source, what it is called, and whether it is on — and a drawer for three
 * fields is a drawer for nothing. The name is the only free text, so it is a
 * cell.
 *
 * THE APP DRAWS THREE. So the first three rows are marked as the ones a patient
 * sees, and anything below the line says plainly that nobody sees it. Authoring
 * a fourth is allowed — it is how you keep one ready to swap in — but it should
 * never be a surprise.
 */
export function MetricsTable({
    metrics, tasks, onChange,
}: {
    metrics: ProtocolMetric[]
    /** For the one check that matters: does anything write what a tile reads? */
    tasks: ProtocolTask[]
    onChange: (list: ProtocolMetric[]) => void
}) {
    const sorted = [...metrics].sort((a, b) => a.sortOrder - b.sortOrder)
    const rerank = (list: ProtocolMetric[]) => list.map((m, i) => ({ ...m, sortOrder: i }))
    const shownIds = new Set(activeMetrics(metrics).slice(0, SHOWN_ON_PHONE).map(m => m.id))

    const move = (id: string, dir: -1 | 1) => {
        const at = sorted.findIndex(m => m.id === id)
        const to = at + dir
        if (to < 0 || to >= sorted.length) return
        const next = [...sorted]
        const [item] = next.splice(at, 1)
        next.splice(to, 0, item)
        onChange(rerank(next))
    }

    const patch = (id: string, p: Partial<ProtocolMetric>) =>
        onChange(sorted.map(m => (m.id === id ? { ...m, ...p } : m)))

    const add = (source: MetricSource) =>
        onChange(rerank([...sorted, emptyMetric(source, sorted.length)]))

    const remove = (id: string) => onChange(rerank(sorted.filter(m => m.id !== id)))

    /* One source per row. Two tiles reading one number is not a layout. */
    const used = new Set(sorted.map(m => m.source))
    const offer = METRICS.filter(m => !used.has(m.id))

    const written = new Set(
        tasks.filter(t => t.isActive && t.signalKey).map(t => t.signalKey as string),
    )

    return (
        <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                    Metrics · the row above their tasks
                </p>
                <Badge variant="outline" className="text-[10px]">
                    the app draws {SHOWN_ON_PHONE}
                </Badge>
                <div className="ml-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" disabled={!offer.length}>
                                <Plus className="mr-2 h-3.5 w-3.5" /> Add a metric
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            {offer.map(m => (
                                <DropdownMenuItem key={m.id} onClick={() => add(m.id)}
                                    className="flex-col items-start gap-0.5">
                                    <span className="text-xs font-medium">{m.label}</span>
                                    <span className="text-[10px] text-muted-foreground">{m.reads}</span>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {sorted.length === 0 ? (
                <Card className="flex flex-col items-center gap-2 border-dashed p-10 text-center">
                    <Gauge className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">No metrics on this protocol</p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                        The row above the patient&rsquo;s task list would be empty. Add up to{" "}
                        {SHOWN_ON_PHONE}.
                    </p>
                </Card>
            ) : (
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="w-32 text-xs">Order</TableHead>
                                    <TableHead className="text-xs">What it reads</TableHead>
                                    <TableHead className="text-xs">Its name · English</TableHead>
                                    <TableHead className="text-xs">Its name · العربية</TableHead>
                                    <TableHead className="w-36 text-xs">On the phone</TableHead>
                                    <TableHead className="w-12 text-right" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sorted.map((m, i) => {
                                    const spec = metricSpec(m.source)
                                    const seen = shownIds.has(m.id)
                                    const starved = !!spec?.needsSignal && !written.has(spec.needsSignal)
                                    return (
                                        <TableRow key={m.id}
                                            className={starved ? "bg-red-50/50" : "hover:bg-muted/20"}>
                                            <TableCell className="py-2.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="w-5 text-sm tabular-nums">{i + 1}</span>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"
                                                        disabled={i === 0} onClick={() => move(m.id, -1)}
                                                        aria-label="Move up">
                                                        <ArrowUp className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7"
                                                        disabled={i === sorted.length - 1}
                                                        onClick={() => move(m.id, 1)} aria-label="Move down">
                                                        <ArrowDown className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-2.5">
                                                <span className="block text-sm font-medium">{spec?.label}</span>
                                                <span className="block max-w-sm text-[11px] text-muted-foreground">
                                                    {spec?.reads}
                                                </span>
                                                {/* What the tile will look like, so nobody has to
                                                    open a phone to picture it. */}
                                                <span className="mt-1 inline-flex items-baseline gap-1.5 rounded bg-muted/60 px-1.5 py-0.5">
                                                    <span className="text-xs font-semibold">{spec?.egValue}</span>
                                                    <span className="text-[10px] text-muted-foreground">{spec?.egSub}</span>
                                                </span>
                                                {starved && (
                                                    <span className="mt-1 block text-[11px] font-medium text-destructive">
                                                        Nothing writes {spec?.needsSignal}. The tile would read a dash.
                                                    </span>
                                                )}
                                            </TableCell>

                                            <TableCell className="py-2.5">
                                                <Input value={m.labelEn ?? ""}
                                                    onChange={e => patch(m.id, { labelEn: e.target.value })}
                                                    placeholder={spec?.label}
                                                    className="h-8 text-sm" />
                                            </TableCell>

                                            <TableCell className="py-2.5">
                                                <Input dir="rtl" value={m.labelAr ?? ""}
                                                    onChange={e => patch(m.id, { labelAr: e.target.value })}
                                                    className="h-8 text-sm" />
                                            </TableCell>

                                            <TableCell className="py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <Switch checked={m.isActive}
                                                        onCheckedChange={v => patch(m.id, { isActive: v })} />
                                                    {m.isActive ? (
                                                        seen ? (
                                                            <Badge variant="outline"
                                                                className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                                                                shown
                                                            </Badge>
                                                        ) : (
                                                            /* On, and below the line the app draws. Said
                                                               plainly: it is authored and never seen. */
                                                            <Badge variant="outline"
                                                                className="border-amber-200 bg-amber-50 text-[10px] text-amber-800">
                                                                nobody sees it
                                                            </Badge>
                                                        )
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">off</span>
                                                    )}
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-2.5 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8"
                                                    onClick={() => remove(m.id)} aria-label="Delete">
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

            {/* What the patient will actually see, in one line. */}
            {activeMetrics(metrics).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/50 px-3 py-2">
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Their row reads
                    </span>
                    {activeMetrics(metrics).slice(0, SHOWN_ON_PHONE).map(m => (
                        <span key={m.id} className="inline-flex items-baseline gap-1.5 rounded border bg-background px-2 py-1">
                            <span className="text-[11px] font-medium">{metricLabel(m)}</span>
                            <span className="text-[10px] text-muted-foreground">
                                {metricSpec(m.source)?.egValue}
                            </span>
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}
