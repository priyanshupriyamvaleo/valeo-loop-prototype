"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react"
import {
    CHILD_TYPES, fulfilmentType, kindOf, newBlock, packagesFor, refKey,
    statesOf, summarise, unitOnPath,
} from "@/lib/protocol-assembly"
import { KindMark } from "@/components/protocol/StepEditor"
import type { Block } from "@/lib/protocol-assembly"
import type { Listing } from "@/types"

export function Assembler({
    blocks, onChange, listings, paths,
}: {
    blocks: Block[]
    onChange: (next: Block[]) => void
    listings: Listing[]
    /**
     * The values a step MAY split into. Not a declaration that this protocol
     * does: each step decides for itself, with the tick beside its picker.
     * Empty where a surface offers no split at all.
     */
    paths: { id: string; label: string }[]
}) {
    const setBlocks = (f: Block[] | ((b: Block[]) => Block[])) =>
        onChange(typeof f === "function" ? f(blocks) : f)
    const s = summarise(blocks)

    const setBlock = (id: string, f: (b: Block) => Block) =>
        setBlocks(bs => bs.map(b => b.id === id ? f(b) : b))


    const move = (i: number, d: -1 | 1) => setBlocks(bs => {
        const n = [...bs], j = i + d
        if (j < 0 || j >= n.length) return bs
        ;[n[i], n[j]] = [n[j], n[i]]
        return n
    })

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
                {CHILD_TYPES.map(t => (
                    <Button key={t.id} variant="outline" className="h-10"
                        onClick={() => setBlocks(bs => [...bs, newBlock(t.id)])}>
                        <Plus className="mr-1.5 h-4 w-4" /> {t.label}
                    </Button>
                ))}
            </div>

            <div className="grid gap-5 xl:grid-cols-[1fr_220px]">
                <div className="space-y-4">
                    {blocks.map((b, i) => {
                        const def = fulfilmentType(b.type)
                        const opts = packagesFor(b.type, listings)
                        return (
                            /* ── ONE ROW, AND IT IS THE PACKAGE ──
                               Nothing expands any more. The card used to open
                               on the order's steps, its hand-over and its
                               unmapped states — all three read-only, none of
                               them editable here, and together twice the height
                               of the thing this screen is for. The steps are
                               authored in Step Mapping and read there; the
                               right-hand column still lists every one of them. */
                            <Card key={b.id} className="overflow-hidden p-0">
                                <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                                    <span className="shrink-0 font-mono text-sm text-muted-foreground">
                                        {i + 1}
                                    </span>
                                    <span className="shrink-0 text-base font-semibold">{def.label}</span>

                                    {/* ── ONE PICKER, OR ONE PER SEX ──
                                        A male and a female full body panel are two
                                        products with different markers and different
                                        prices; a GLP-1 pen is one product. So the split
                                        is a property of THIS step, ticked here, and not
                                        a shape the author had to commit the whole
                                        protocol to before writing a single step.

                                        The tick IS `unitByValue`. An empty object means
                                        ticked and nothing chosen yet, which is a real
                                        state and needs no second field to record. */}
                                    <span className="flex flex-col gap-1.5">
                                        {paths.length > 0 && (
                                            <label className="flex w-fit cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                                                <input type="checkbox"
                                                    className="h-3.5 w-3.5 accent-primary"
                                                    checked={b.unitByValue !== undefined}
                                                    onChange={e => setBlock(b.id, x => (e.target.checked
                                                        /* Seeded from the single pick, so ticking
                                                           the box does not throw away the package
                                                           already chosen — it becomes both paths
                                                           until one is changed. */
                                                        ? { ...x, unitByValue: Object.fromEntries(
                                                            paths.map(pp => [pp.id, x.unit])
                                                                .filter(([, u]) => u)) as Block["unitByValue"] }
                                                        /* Untick keeps the first path's pick as the
                                                           single one, rather than clearing the row. */
                                                        : { ...x, unit: x.unit ?? x.unitByValue?.[paths[0].id],
                                                            unitByValue: undefined }))} />
                                                Different item per sex
                                            </label>
                                        )}
                                        {(b.unitByValue !== undefined ? paths : [undefined]).map(path => {
                                            const value = path?.id
                                            return (
                                            <span key={value ?? "one"} className="flex items-center gap-2">
                                                {path && (
                                                    <span className="w-14 shrink-0 text-xs text-muted-foreground">
                                                        {path.label.toLowerCase()}
                                                    </span>
                                                )}
                                                <Select value={refKey(unitOnPath(b, value))}
                                                    onValueChange={v => setBlock(b.id, x => {
                                                        const ref = opts.find(o => refKey(o.ref) === v)?.ref
                                                        return value
                                                            ? { ...x, unitByValue: { ...x.unitByValue, ...(ref ? { [value]: ref } : {}) } }
                                                            : { ...x, unit: ref }
                                                    })}>
                                                    <SelectTrigger className="h-10 w-[300px] text-sm" disabled={!opts.length}>
                                                        <SelectValue placeholder={opts.length ? "Choose a package" : "No package in the catalogue"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {opts.map(o => (
                                                            <SelectItem key={refKey(o.ref)} value={refKey(o.ref)} className="text-sm">
                                                                {o.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </span>
                                            )
                                        })}
                                    </span>

                                    {/* THE DUE WEEK, on the repeating orders only. Not a
                                        condition — it says when the order is placed, and
                                        the order still runs its own journey after that. */}
                                    {def.repeats && (
                                        <span className="flex shrink-0 items-center gap-1.5">
                                            <span className="text-xs text-muted-foreground">Week</span>
                                            <Input type="number" min={1} value={b.week ?? ""}
                                                placeholder="—"
                                                onChange={e => setBlock(b.id, x => ({
                                                    ...x,
                                                    week: e.target.value ? Number(e.target.value) : undefined,
                                                }))}
                                                className="h-9 w-16 text-center text-sm" />
                                        </span>
                                    )}

                                    <span className="ml-auto flex shrink-0 items-center gap-1">
                                        {def.skips && (
                                            <span className="mr-2 text-xs text-amber-600" title="States can be skipped">
                                                skips
                                            </span>
                                        )}
                                        <span className="mr-2 font-mono text-xs text-muted-foreground">
                                            {b.steps.length} / {def.stages.length}
                                        </span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"
                                            disabled={i === 0} onClick={() => move(i, -1)}>
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"
                                            disabled={i === blocks.length - 1} onClick={() => move(i, 1)}>
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => setBlocks(bs => bs.filter(x => x.id !== b.id))}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </span>
                                </div>

                            </Card>
                        )
                    })}
                </div>

                <div className="space-y-3 xl:sticky xl:top-6 xl:self-start">
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>{s.orders} orders</span>
                        <span className="font-medium text-foreground">{s.steps} steps</span>
                        <span>{s.states} states</span>
                        <span>{s.unmapped} unmapped</span>
                        {s.unpriced > 0 && <span className="text-amber-600">{s.unpriced} no package</span>}
                    </div>

                    <Card className="overflow-hidden p-0">
                        {blocks.filter(b => b.steps.length).map(b => (
                            <div key={b.id}>
                                <div className="flex items-center gap-1.5 border-b bg-muted/30 px-2.5 py-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                                    {fulfilmentType(b.type).label}
                                    {b.week ? <span className="text-muted-foreground/70">wk {b.week}</span> : null}
                                </div>
                                {b.steps.map((st, n) => {
                                    const first = statesOf(st.completes)[0]
                                    return (
                                        <div key={st.id} className="flex items-center gap-2 px-2.5 py-[5px]">
                                            <span className="w-3 shrink-0 text-right font-mono text-[10px] text-muted-foreground/60">
                                                {n + 1}
                                            </span>
                                            {first
                                                ? <KindMark kind={kindOf(b.type, first)} />
                                                : <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />}
                                            <span className="truncate text-[12px]">
                                                {st.title || <span className="text-muted-foreground/60">untitled</span>}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        ))}
                        {s.steps === 0 && (
                            <p className="p-6 text-center text-xs text-muted-foreground">No steps yet.</p>
                        )}
                    </Card>

                </div>
            </div>
        </div>
    )
}
