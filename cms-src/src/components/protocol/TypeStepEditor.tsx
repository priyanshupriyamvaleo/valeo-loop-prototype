"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronDown, ChevronRight, Plus } from "lucide-react"
import { fulfilmentType, kindOf, newStep, statesOf, unmapped } from "@/lib/protocol-assembly"
import { KindMark, StepRow } from "@/components/protocol/StepEditor"
import { stepMapStore } from "@/lib/step-mapping-store"
import type { Block, Step, TypeId } from "@/lib/protocol-assembly"

/* ══ ONE ORDER TYPE'S STEPS ════════════════════════════════════════════════
 *
 * The same editor the protocol used to carry, with one list instead of many.
 *
 * A PSEUDO-BLOCK, because `StepRow` and `spentOn` both key off `block.type`
 * and nothing else. Building one here rather than reworking their signatures
 * keeps the two screens on exactly the same code — the moment they diverge,
 * a condition rule fixed in one place stops being fixed in the other.
 *
 * WHAT THIS SCREEN CANNOT KNOW is what runs before this order. That is the
 * protocol's business and it is answered there: the first step's start reads
 * "when the order before it completes", and the protocol screen shows the real
 * state it derives.
 */
export function TypeStepEditor({
    type, steps, open, onToggle,
}: {
    type: TypeId
    steps: Step[]
    open: boolean
    onToggle: () => void
}) {
    const def = fulfilmentType(type)
    const block = useMemo<Block>(() => ({ id: `map-${type}`, type, steps }), [type, steps])
    const free = unmapped(block)

    const set = (next: Step[]) => stepMapStore.save(type, next)
    const patch = (id: string, p: Partial<Step>) =>
        set(steps.map(x => (x.id === id ? { ...x, ...p } : x)))

    return (
        <Card className="overflow-hidden p-0">
            <button onClick={onToggle}
                className={`flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left ${open ? "border-b" : ""}`}>
                {open ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                <span className="text-base font-semibold">{def.label} package</span>
                <span className="text-xs text-muted-foreground">{def.fulfils}</span>
                <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                    {/* The two counts a reader wants: how many steps a patient
                        sees, against how many states the journey reports. They
                        are never equal — thirteen states do not make thirteen
                        lines on a phone. */}
                    <span className="font-medium text-foreground">
                        {steps.length} step{steps.length === 1 ? "" : "s"}
                    </span>
                    <span>{def.stages.length} states</span>
                    {free.length > 0 && <span>{free.length} unmapped</span>}
                </span>
            </button>

            {open && (
                <>
                    <div className="divide-y">
                        {steps.length === 0 && (
                            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                                No steps yet. Every protocol that orders a {def.label.toLowerCase()}{" "}
                                package will show whatever is written here.
                            </p>
                        )}
                        {steps.map((st, i) => (
                            <StepRow key={st.id} blocks={[block]} block={block} step={st}
                                blockIndex={0} index={i}
                                opening="When the order before it completes."
                                onPatch={p => patch(st.id, p)}
                                onDelete={() => set(steps.filter(x => x.id !== st.id))} />
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t px-4 py-2.5">
                        <Button variant="ghost" size="sm" className="h-7"
                            onClick={() => set([...steps, newStep()])}>
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

            {/* Closed, the card still says what it holds. A collapsed section
                that shows nothing is one an author has to open to check. */}
            {!open && steps.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-4 py-2">
                    {steps.map((st, n) => {
                        const first = statesOf(st.completes)[0]
                        return (
                            <span key={st.id} className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] text-muted-foreground/60">{n + 1}</span>
                                {first
                                    ? <KindMark kind={kindOf(type, first)} />
                                    : <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />}
                                <span className="text-[12px]">
                                    {st.title || <span className="text-muted-foreground/60">untitled</span>}
                                </span>
                            </span>
                        )
                    })}
                </div>
            )}
        </Card>
    )
}
