"use client"

/* ══ ONE STEP, AND ITS TWO SIDES ═══════════════════════════════════════════
 *
 * Lifted out of the Assembler, because a step is no longer a property of a
 * protocol. It belongs to an ORDER TYPE and is authored once, in Step Mapping,
 * for every protocol that places an order of that type.
 *
 * Nothing in here had to change to move. `Side` only ever took a block for
 * `block.type`, and `optionsFor`, `expand`, `stageOf` and `kindOf` are all
 * journey-scoped already — which is the evidence that a step was always a
 * property of the journey and had only been stored in the wrong place.
 */

import { Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Cog, Lock, Package, Plus, Stethoscope, User, X } from "lucide-react"
import {
    expand, fulfilmentType, kindOf, newClause, optionsFor, stageOf, startsOf, statesOf, spentOn,
} from "@/lib/protocol-assembly"
import type {
    Block, Condition, Derived, Join, SignalKind, Step, TypeId,
} from "@/lib/protocol-assembly"

/* ────────────────────────── One step, and its two sides ──────────────────── */

export function StepRow({
    blocks, block, step, blockIndex, index, opening, onPatch, onDelete,
}: {
    /** Every order this step's own list belongs to. One, in Step Mapping. */
    blocks: Block[]
    block: Block
    step: Step
    /** Position of this order, and of this step inside it. */
    blockIndex: number
    index: number
    /**
     * What starts the FIRST step, in words, because only the caller knows.
     * In Step Mapping nothing sits above the list, so it is whatever order the
     * protocol puts before this one; in a protocol it is the protocol itself.
     */
    opening: string
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
                    empty={index === 0 ? opening : "When the step above completes."}
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

export function Side({
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
export const KindMark = ({ kind }: { kind: SignalKind }) =>
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
