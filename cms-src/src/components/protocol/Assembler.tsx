"use client"

import { Fragment, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ArrowDown, ArrowUp, ChevronDown, ChevronRight, CornerDownRight, Cog, Flag, Lock, Package, Plus, Stethoscope, User, X,
} from "lucide-react"
import {
    CHILD_TYPES, expand, fulfilmentType, handoff, kindOf, newBlock,
    newClause, newStep, optionsFor, packagesFor, refKey, spentOn, stageOf,
    startsOf, statesOf, summarise, unitOnPath, unmapped,
} from "@/lib/protocol-assembly"
import type {
    Block, Condition, Derived, Join, SignalKind, Step, TypeId,
} from "@/lib/protocol-assembly"
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
    /* Closed, not open, so a protocol of six orders is still one screen. The
       right column carries every step of every order whatever is closed. */
    const [closed, setClosed] = useState<string[]>([])
    const setBlocks = (f: Block[] | ((b: Block[]) => Block[])) =>
        onChange(typeof f === "function" ? f(blocks) : f)
    const s = summarise(blocks)

    const setBlock = (id: string, f: (b: Block) => Block) =>
        setBlocks(bs => bs.map(b => b.id === id ? f(b) : b))

    const setStep = (bid: string, sid: string, p: Partial<Step>) =>
        setBlock(bid, b => ({ ...b, steps: b.steps.map(x => x.id === sid ? { ...x, ...p } : x) }))

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
                        const free = unmapped(b)
                        const hand = handoff(blocks, i)
                        const open = !closed.includes(b.id)
                        return (
                            <Card key={b.id} className="overflow-hidden p-0">
                                <div className={`flex flex-wrap items-center gap-3 px-4 py-3 ${open ? "border-b" : ""}`}>
                                    <button
                                        onClick={() => setClosed(c =>
                                            c.includes(b.id) ? c.filter(x => x !== b.id) : [...c, b.id])}
                                        className="-ml-1 shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                                        {open ? <ChevronDown className="h-4 w-4" />
                                            : <ChevronRight className="h-4 w-4" />}
                                    </button>
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

                                {open && (
                                <>
                                <div className="divide-y">
                                    {b.steps.map((st, si) => (
                                        <StepRow key={st.id} blocks={blocks} block={b} step={st}
                                            blockIndex={i} index={si} opening={i === 0 && si === 0}
                                            onPatch={p => setStep(b.id, st.id, p)}
                                            onDelete={() => setBlock(b.id, x =>
                                                ({ ...x, steps: x.steps.filter(y => y.id !== st.id) }))} />
                                    ))}
                                </div>

                                {/* WHERE IT HANDS OVER. The question this page
                                    kept raising — what completes the last step
                                    of an order — is answered by reading the two
                                    ends, not by authoring a third thing. */}
                                {hand && (
                                    <div className="flex flex-wrap items-center gap-2 border-t bg-muted/20 px-4 py-2">
                                        {hand.to
                                            ? <CornerDownRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                            : <Flag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                                        <span className="text-xs text-muted-foreground">
                                            {hand.to ? `Starts the ${hand.to} order` : "Ends the protocol"}
                                        </span>
                                        {hand.on.length
                                            ? hand.on.map(x => (
                                                <code key={x} className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                                                    {x}
                                                </code>
                                            ))
                                            : <span className="text-xs text-amber-600">
                                                once its last step completes on something
                                            </span>}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-2.5">
                                    <Button variant="ghost" size="sm" className="h-7"
                                        onClick={() => setBlock(b.id, x =>
                                            ({ ...x, steps: [...x.steps, newStep()] }))}>
                                        <Plus className="mr-1.5 h-3.5 w-3.5" /> step
                                    </Button>
                                    {free.length > 0 && (
                                        <>
                                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
                                                unmapped
                                            </span>
                                            {free.map(f => (
                                                <code key={f.state} className="font-mono text-[10px] text-muted-foreground/50">
                                                    {f.state}
                                                </code>
                                            ))}
                                        </>
                                    )}
                                </div>
                                </>
                                )}
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

/* ────────────────────────── One step, and its two sides ──────────────────── */

function StepRow({
    blocks, block, step, blockIndex, index, opening, onPatch, onDelete,
}: {
    /** Every order, because a user action is spent across the whole protocol. */
    blocks: Block[]
    block: Block
    step: Step
    /** Position of this order, and of this step inside it. */
    blockIndex: number
    index: number
    /** The very first step of the protocol. */
    opening: boolean
    onPatch: (p: Partial<Step>) => void
    onDelete: () => void
}) {
    return (
        <div className="px-4 py-4">
            <div className="flex items-start gap-3">
                <div className="grid flex-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Title (EN)</Label>
                        <Input value={step.title} onChange={e => onPatch({ title: e.target.value })}
                            placeholder="Name this step" className="h-11 text-base" />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Title (AR)</Label>
                        <Input dir="rtl" value={step.titleAr ?? ""}
                            onChange={e => onPatch({ titleAr: e.target.value })}
                            placeholder="اسم الخطوة" className="h-11 text-base" />
                    </div>
                </div>
                <Button variant="ghost" size="icon"
                    className="mt-6 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={onDelete}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid gap-5 pt-4 lg:grid-cols-2">
                <Side label="Starts on" lead="Step will start when the following conditions are met."
                    empty={opening ? "When the protocol starts." : "When the step above completes."}
                    block={block} cond={step.starts}
                    derived={startsOf(blocks, blockIndex, index).derived}
                    spent={spentOn(blocks, block, "starts", step.id)}
                    onChange={c => onPatch({ starts: c })} />
                <Side label="Completes on" lead="Step will complete when the following conditions are met."
                    empty="Nothing finishes this step."
                    block={block} cond={step.completes}
                    spent={spentOn(blocks, block, "completes", step.id)}
                    onChange={c => onPatch({ completes: c })}
                    className="lg:border-l lg:pl-5" />
            </div>
        </div>
    )
}

function Side({
    label, lead, empty, block, cond, spent, derived = [], onChange, className = "",
}: {
    label: string
    lead: string
    /** What an unmapped side means. Not a hint — it is the behaviour. */
    empty: string
    block: Block
    cond: Condition
    /** States the other steps of this order already spend on this side. */
    spent: string[]
    /**
     * What the completion above already contributes. Shown locked, above the
     * author's own conditions, and never editable here. Each one carries the
     * journey it came from, which is not this one when it crossed an order.
     */
    derived?: Derived[]
    onChange: (c: Condition) => void
    className?: string
}) {
    const def = fulfilmentType(block.type)
    const taken = statesOf(cond)
    /* SPENT ELSEWHERE, OR NAMED HERE ALREADY. Both are gone, so an author reads
       down a shrinking set instead of re-reading all thirteen states and
       remembering which are used. */
    const free = optionsFor(block.type)
        .filter(s => !spent.includes(s.state) && !taken.includes(s.state))

    const set = (clauses: Condition["clauses"]) => onChange({ ...cond, clauses })

    return (
        <div className={className}>
            <div className="flex items-center gap-3">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                {derived.length > 0 && (
                    <span className="flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        <Lock className="h-2.5 w-2.5" />
                        {/* THE SOURCE ORDER, when it is not this one. A blood
                            status starting a consultation step reads as a
                            mistake without it. */}
                        {derived[0].from
                            ? `from the ${derived[0].from} order above`
                            : "from the step above"}
                    </span>
                )}
                {def.skips && (
                    <button onClick={() => onChange({ ...cond, orLater: !cond.orLater })}
                        title="Also satisfied by any later state. The warehouse skips states."
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                            cond.orLater ? "bg-emerald-100 text-emerald-800"
                                : "text-muted-foreground/50 hover:bg-muted"
                        }`}>
                        or later{cond.orLater && taken.length
                            ? ` ·${expand(block.type, cond).length}` : ""}
                    </button>
                )}
            </div>
            <p className="pt-1 text-[13px] text-muted-foreground">
                {derived.length || cond.clauses.length ? lead : empty}
            </p>

            <div className="space-y-1.5 pt-3">
                {/* LOCKED, BUT NOT THE WHOLE SIDE. What completed the step
                    above cannot be changed here, because there is one place to
                    author that transition. Anything else is added underneath. */}
                {derived.map((d, n) => (
                    <div key={d.clause.id} className="space-y-1.5">
                        {n > 0 && (
                            <div className="border-l pl-3">
                                <span className="inline-flex h-8 items-center rounded-md border border-dashed bg-muted/40 px-3 text-xs font-medium text-muted-foreground">
                                    {(d.clause.join ?? "and").toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="flex h-10 items-center gap-1.5 rounded-md border border-dashed bg-muted/40 px-3">
                            <Lock className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                            <KindMark kind={kindOf(d.type, d.clause.state)} />
                            <span className="font-mono text-xs text-muted-foreground">{d.clause.state}</span>
                            <span className="truncate text-xs text-muted-foreground/70">
                                {stageOf(d.type, d.clause.state)?.label}
                            </span>
                        </div>
                    </div>
                ))}

                {cond.clauses.map((cl, n) => {
                    /* ITS OWN VALUE IS ALWAYS AN OPTION, spent or not, so a
                       control never renders empty and looks deleted. */
                    const options = [
                        ...optionsFor(block.type).filter(o => o.state === cl.state),
                        ...free,
                    ]
                    const stage = stageOf(block.type, cl.state)
                    const dead = stage?.trigger.startsWith("NOTHING")
                    return (
                        <div key={cl.id} className="space-y-1.5">
                            {(n > 0 || derived.length > 0) && (
                                <div className="border-l pl-3">
                                    <Select value={cl.join ?? "and"}
                                        onValueChange={v => set(cond.clauses.map(x =>
                                            x.id === cl.id ? { ...x, join: v as Join } : x))}>
                                        <SelectTrigger className="h-8 w-[92px] text-xs font-medium">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="and" className="text-xs">AND</SelectItem>
                                            <SelectItem value="or" className="text-xs">OR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="flex items-center gap-1.5">
                                <Select value={cl.state}
                                    onValueChange={v => set(cond.clauses.map(x =>
                                        x.id === cl.id ? { ...x, state: v } : x))}>
                                    <SelectTrigger
                                        className={`h-10 flex-1 font-mono text-xs ${
                                            dead ? "border-rose-300 text-rose-700"
                                                : !cl.state ? "border-dashed" : ""
                                        }`}>
                                        <SelectValue placeholder={
                                            <span className="font-sans text-[13px] text-muted-foreground">
                                                Choose a status
                                            </span>
                                        } />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <Options options={options} type={block.type} typeLabel={def.label} />
                                    </SelectContent>
                                </Select>
                                <Button variant="ghost" size="icon"
                                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => set(cond.clauses
                                        .filter(x => x.id !== cl.id)
                                        .map((x, i) => i === 0 && !derived.length
                                            ? { ...x, join: undefined } : x))}>
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    )
                })}

                {free.length > 0 && (
                    <button
                        /* EMPTY, NOT A GUESS. Filling it with the first free
                           option put a user action into every new condition,
                           because those head the list. */
                        onClick={() => set([...cond.clauses,
                            newClause("", (cond.clauses.length || derived.length) ? "and" : undefined)])}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-md border border-dashed text-[13px] text-muted-foreground transition hover:border-primary/40 hover:bg-accent/40 hover:text-foreground">
                        <Plus className="h-4 w-4" /> Add condition
                    </button>
                )}
            </div>
        </div>
    )
}

/**
 * TWO VOCABULARIES, MARKED. A user action sits on the account, the payment or
 * the app; an order status is reported by the fulfilment system. The mark is
 * an icon rather than a word, because this page is read by a team that does
 * not share one first language.
 */
/**
 * THE SAME MARK EVERYWHERE, so the option, the control and the summary agree.
 * An icon rather than a word, because this page is read by a team that does
 * not share one first language.
 */
const KindMark = ({ kind }: { kind: SignalKind }) =>
    kind === "user" ? <User className="h-3 w-3 shrink-0 text-violet-500" />
        : kind === "coach" ? <Stethoscope className="h-3 w-3 shrink-0 text-teal-600" />
            : kind === "system" ? <Cog className="h-3 w-3 shrink-0 text-amber-500" />
                : <Package className="h-3 w-3 shrink-0 text-slate-400" />

/** Three groups, in the order a protocol meets them. */
function Options({ options, type, typeLabel }: {
    options: { state: string; label: string }[]
    type: TypeId
    typeLabel: string
}) {
    const groups: { kind: SignalKind; label: string }[] = [
        { kind: "user", label: "User action" },
        { kind: "coach", label: "Coach action" },
        { kind: "system", label: "Protocol service" },
        { kind: "order", label: `${typeLabel} order status` },
    ]
    return (
        <>
            {groups.map(g => {
                const rows = options.filter(o => kindOf(type, o.state) === g.kind)
                if (!rows.length) return null
                return (
                    <SelectGroup key={g.kind}>
                        <SelectLabel className="flex items-center gap-1.5 text-[10px] font-normal text-muted-foreground">
                            <KindMark kind={g.kind} /> {g.label}
                        </SelectLabel>
                        {rows.map(o => (
                            <SelectItem key={o.state} value={o.state} className="text-xs">
                                <span className="flex items-center gap-1.5">
                                    <KindMark kind={g.kind} />
                                    <span className="font-mono text-[11px]">{o.state}</span>
                                    <span className="text-muted-foreground">{o.label}</span>
                                    {/* NOTHING FOLLOWS IT. An author who cannot
                                        see this builds a step past the end of
                                        the journey and then has nothing to
                                        complete it with. */}
                                    {stageOf(type, o.state)?.terminal && (
                                        <span className="ml-1 rounded bg-muted px-1 text-[9px] text-muted-foreground">
                                            ends the order
                                        </span>
                                    )}
                                </span>
                            </SelectItem>
                        ))}
                    </SelectGroup>
                )
            })}
        </>
    )
}
