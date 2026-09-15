"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AlertCircle, ArrowLeft, RotateCcw } from "lucide-react"
import { ApiService } from "@/services/api"
import { ALL_PATHS, pathsOf, resolveProtocol } from "@/lib/protocol-chain"
import {
    boardGaps, emptyTask, taskGaps, taskStore, useAllTasks, useHydrated, useProtocolTasks,
} from "@/lib/protocol-tasks"
import { TaskBoardTable } from "@/components/protocol/tasks/TaskBoardTable"
import { MetricsTable } from "@/components/protocol/tasks/MetricsTable"
import {
    compileMetrics, metricGaps, metricStore, useProtocolMetrics,
} from "@/lib/protocol-metrics"
import { TaskDrawer } from "@/components/protocol/tasks/TaskDrawer"
import type { Protocol, ProtocolMetric, ProtocolTask } from "@/types"

/**
 * TASKS — what a patient does, once they have bought.
 *
 * The third door of the Plan Builder. The page is what they READ, the package
 * is what they BUY, and this is what they DO.
 *
 * IT IS AUTHORED HERE AND NOWHERE ELSE. A task's words, the way the patient
 * finishes it, and the two gates that decide when it is on their card all live
 * on this protocol, because a protocol's daily asks are part of its clinical
 * shape. There is no shared library to visit first.
 *
 * WRITES ARE IMMEDIATE, as they are on the widget screen. A task cannot make
 * anything Active, so add, reorder, edit and delete write straight through and
 * nothing is lost by closing the drawer. Publish is a separate act, and it is
 * the only thing the refusals hold up.
 *
 * IT IS LIVE WHEN THE PROTOCOL IS LIVE, not when the page is published.
 * Somebody who has bought needs their tasks whether or not the marketing page
 * is out.
 */
export default function PlanTasksPage() {
    const params = useParams()
    const protocolId = typeof params.id === "string" ? params.id : ""

    const hydrated = useHydrated()
    const tasks = useProtocolTasks(protocolId)
    const metrics = useProtocolMetrics(protocolId)
    const allBoards = useAllTasks()

    const [protocol, setProtocol] = useState<Protocol | null>(null)
    const [loading, setLoading] = useState(true)
    const [pathId, setPathId] = useState<string>(ALL_PATHS)
    const [openId, setOpenId] = useState<string | null>(null)
    const [adding, setAdding] = useState<ProtocolTask | null>(null)
    const [showErrors, setShowErrors] = useState(false)

    useEffect(() => {
        ApiService.catalogue.protocols()
            .then(list => setProtocol(list.find(p => p.id === protocolId) ?? null))
            .catch(() => setProtocol(null))
            .finally(() => setLoading(false))
    }, [protocolId])

    const paths = useMemo(() => (protocol ? pathsOf(protocol) : []), [protocol])

    /* The path on screen. A protocol with an axis opens on its first value,
       because a screen showing a template with branches drawn on it shows
       nobody's actual journey. */
    const path = paths.some(p => p.id === pathId) ? pathId : (paths[0]?.id ?? ALL_PATHS)

    const steps = useMemo(
        () => (protocol ? resolveProtocol(protocol, path).steps : []),
        [protocol, path],
    )

    const gaps = useMemo(
        () => (protocol ? boardGaps(tasks, protocol, allBoards) : []),
        [tasks, protocol, allBoards],
    )
    /* Metrics are checked against the TASKS, because a tile reads what a task
       writes. That cross-check is why the two live on one screen. */
    const mGaps = useMemo(() => metricGaps(metrics, tasks), [metrics, tasks])
    const allGaps = useMemo(() => [...gaps, ...mGaps], [gaps, mGaps])

    const setTasks = (next: ProtocolTask[]) => taskStore.save(protocolId, next)
    const setMetrics = (next: ProtocolMetric[]) => metricStore.save(protocolId, next)

    /* The task being edited: one on the board, or one not yet added. The unsaved
       one is held apart so a cancelled New leaves no empty row behind. */
    const editing = adding ?? tasks.find(t => t.id === openId) ?? null
    const drawerGaps = useMemo(
        () => (editing ? taskGaps(editing, tasks) : []),
        [editing, tasks],
    )

    const saveTask = () => {
        if (!editing) return
        setShowErrors(true)
        const blocking = drawerGaps.filter(g => g.blocksDraft)
        if (blocking.length) {
            toast.error(
                blocking.length === 1 ? blocking[0].what : `${blocking.length} things are missing`,
                { description: "A task the patient can read needs a name and a key." },
            )
            return
        }
        const at = tasks.findIndex(t => t.id === editing.id)
        const next = at === -1 ? [...tasks, editing] : tasks.map(t => (t.id === editing.id ? editing : t))
        setTasks(next.map((t, i) => ({ ...t, sortOrder: i })))
        setAdding(null)
        setOpenId(null)
        setShowErrors(false)
        toast.success(at === -1 ? "Task added." : "Saved.")
    }

    const patchTask = (patch: Partial<ProtocolTask>) => {
        if (adding) { setAdding({ ...adding, ...patch }); return }
        if (!openId) return
        setTasks(tasks.map(t => (t.id === openId ? { ...t, ...patch } : t)))
    }

    const publish = () => {
        if (allGaps.length) {
            toast.error(allGaps.length === 1 ? allGaps[0].what : `${allGaps.length} things are wrong`, {
                description: "A live screen runs every rule, on every path.",
            })
            return
        }
        toast.success("The tasks and metrics are live.", {
            description: `Their row reads ${compileMetrics(metrics).map(m => m.label).join(", ")}.`,
        })
    }

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

    return (
        <div className="space-y-5">
            <div>
                <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-7 text-muted-foreground" asChild>
                    <Link href={`/catalogue/protocols/${protocolId}/plan`}>
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Plan Builder
                    </Link>
                </Button>
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-semibold">Tasks and metrics</h2>
                        <p className="max-w-2xl text-sm text-muted-foreground">
                            {protocol.nameEn} · {steps.length} step{steps.length === 1 ? "" : "s"}.
                            {" "}What a patient is asked to do every day, and the row of figures
                            above it. A task only records something, so it never unlocks a step;
                            a metric only reads, so it is never typed.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                            taskStore.reset()
                            metricStore.reset()
                            toast.success("Reset to the seeded tasks and metrics.")
                        }}>
                            <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset
                        </Button>
                        <Button size="sm" onClick={publish}>Publish</Button>
                    </div>
                </div>
            </div>

            {paths.length > 1 && (
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Path
                    </span>
                    <Select value={path} onValueChange={setPathId}>
                        <SelectTrigger className="h-9 w-44 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {paths.map(p => (
                                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Badge variant="outline" className="text-[10px]">
                        every gate is checked on both paths
                    </Badge>
                </div>
            )}

            {/* The refusals. Shown always, not behind a pressed Save: a gate that
                cannot be satisfied is wrong the moment it is typed, and nobody
                should have to press Publish to find out. */}
            {allGaps.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/60 p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        {allGaps.length === 1
                            ? "One thing stops this going live"
                            : `${allGaps.length} things stop this going live`}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-amber-900">
                        {allGaps.map((g, i) => (
                            <li key={i}>
                                <span className="mr-1.5 font-mono text-[10px] tracking-wider uppercase opacity-60">
                                    {g.section}
                                </span>
                                <b>{g.what}.</b> <span className="text-amber-800">{g.why}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            <MetricsTable metrics={metrics} tasks={tasks} onChange={setMetrics} />

            <Separator />

            <TaskBoardTable tasks={tasks} protocol={protocol} pathId={path}
                onChange={setTasks}
                onOpen={id => { setAdding(null); setShowErrors(false); setOpenId(id) }}
                onAdd={() => {
                    setOpenId(null); setShowErrors(false); setAdding(emptyTask(tasks.length))
                }} />

            <TaskDrawer task={editing} isNew={!!adding} siblings={tasks} gaps={drawerGaps}
                showErrors={showErrors} protocol={protocol} steps={steps}
                onChange={patchTask}
                onSave={saveTask}
                onClose={() => { setAdding(null); setOpenId(null); setShowErrors(false) }} />

            <p className="text-xs text-muted-foreground">
                Tasks are held in a prototype store in this browser. The words and the rules are
                authored here; the coach panel and the phone are a separate app, so they reach it
                through <b>Copy the compiled board</b> rather than a live feed.
            </p>
        </div>
    )
}
