"use client"

import { AlertCircle, AlertTriangle, Check, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { FieldRow, PlanField } from "@/components/protocol/plan/fields"
import { OUTPUTS, pathsOf } from "@/lib/protocol-chain"
import {
    CAPTURES, RESETS, STEP_TYPES, TASK_ICONS, gateWords, proveGate, takesUnit, toTaskKey,
} from "@/lib/protocol-tasks"
import type { GateProof } from "@/lib/protocol-tasks"
import type { PlanGap } from "@/lib/protocol-plans"
import type {
    Protocol, ProtocolOutput, ProtocolStep, ProtocolStepType, ProtocolTask,
    ProtocolTaskGate,
} from "@/types"

/** The proof line under a gate, or the refusal. It is the point of the screen. */
function Proof({ proof, gate }: { proof: GateProof | null; gate?: ProtocolTaskGate }) {
    if (!gate) {
        return <p className="text-xs text-muted-foreground">It shows from the day they buy.</p>
    }
    if (!proof) {
        return (
            <p className="flex items-start gap-1.5 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                <span>No step on this path produces {gateWords(gate)}.</span>
            </p>
        )
    }
    return (
        <p className="flex items-start gap-1.5 text-xs text-emerald-700">
            <Check className="mt-0.5 h-3 w-3 shrink-0" />
            <span><b>{proof.label}</b> · {gateWords(gate)}</span>
        </p>
    )
}

/**
 * ONE TASK, AUTHORED IN ONE PLACE.
 *
 * Its words, how the patient finishes it, and the two gates that decide when it
 * is on their card. It was two drawers over two screens — a global library and
 * a board that pointed at it — and that split cost an author a round trip for
 * every new task while giving nothing back, because a protocol's daily asks are
 * part of that protocol.
 *
 * The KEY carries a warning rather than a hint, because it reaches outside this
 * screen: the app stores every reading against it, so renaming it orphans the
 * readings already logged.
 */
export function TaskDrawer({
    task, isNew, siblings, gaps, showErrors, protocol, steps, onChange, onSave, onClose,
}: {
    task: ProtocolTask | null
    isNew: boolean
    /** The protocol's other tasks, so a clashing key is caught before the save. */
    siblings: ProtocolTask[]
    gaps: PlanGap[]
    showErrors: boolean
    protocol: Protocol
    /** Already resolved for the path on screen. */
    steps: ProtocolStep[]
    onChange: (patch: Partial<ProtocolTask>) => void
    onSave: () => void
    onClose: () => void
}) {
    if (!task) return null

    const clash = !!task.key && siblings.some(x => x.id !== task.id && x.key === task.key)
    const paths = pathsOf(protocol)
    const hasAxis = !!protocol.variantAxis

    const shows = task.showsAfter
    const hidesAtEnd = task.hidesAfter === "protocol_ends"
    const hides = !hidesAtEnd && task.hidesAfter
        ? (task.hidesAfter as ProtocolTaskGate) : undefined

    const setShowsNeeds = (v: string) => onChange({
        showsAfter: v === "none" ? undefined
            : { needs: v as ProtocolOutput, fromType: shows?.fromType },
    })
    const setShowsType = (v: string) => onChange({
        showsAfter: shows
            ? { needs: shows.needs, fromType: v === "any" ? undefined : v as ProtocolStepType }
            : undefined,
    })
    const setHidesNeeds = (v: string) => onChange({
        hidesAfter: v === "none" ? undefined
            : v === "protocol_ends" ? "protocol_ends"
            : { needs: v as ProtocolOutput, fromType: hides?.fromType },
    })
    const setHidesType = (v: string) => onChange({
        hidesAfter: hides
            ? { needs: hides.needs, fromType: v === "any" ? undefined : v as ProtocolStepType }
            : task.hidesAfter,
    })

    return (
        <Sheet open={!!task} onOpenChange={o => { if (!o) onClose() }}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
                <SheetHeader className="flex-row items-center justify-between gap-3 border-b px-5 py-4">
                    <SheetTitle className="text-base">
                        {isNew ? "New task" : task.titleEn || "Untitled task"}
                    </SheetTitle>
                    <Button size="sm" onClick={onSave} className="mr-8">
                        <Save className="mr-2 h-3.5 w-3.5" /> Save
                    </Button>
                </SheetHeader>

                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                    {/* The refusals, once Save has been pressed and turned down. */}
                    {showErrors && gaps.length > 0 && (
                        <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/60 p-3">
                            <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
                                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                {gaps.length === 1 ? gaps[0].what : `${gaps.length} things are missing`}
                            </p>
                            <ul className="space-y-1 text-xs text-amber-900">
                                {gaps.map((g, i) => (
                                    <li key={i}><b>{g.what}.</b> <span className="text-amber-800">{g.why}</span></li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        What the patient reads
                    </p>

                    <FieldRow>
                        <PlanField label="Title · English" required
                            hint="What the patient reads on the row.">
                            <Input value={task.titleEn}
                                onChange={e => {
                                    const titleEn = e.target.value
                                    /* A new task fills its own key from the title, which is
                                       what the author would type anyway. An existing key is
                                       never rewritten: the app stores readings against it. */
                                    onChange(isNew && !task.key
                                        ? { titleEn, key: toTaskKey(titleEn) }
                                        : { titleEn })
                                }}
                                placeholder="Take your medication" />
                        </PlanField>
                        <PlanField label="Title · العربية">
                            <Input dir="rtl" value={task.titleAr ?? ""}
                                onChange={e => onChange({ titleAr: e.target.value })}
                                placeholder="تناول دواءك" />
                        </PlanField>
                    </FieldRow>

                    <FieldRow>
                        <PlanField label="The line under it · English"
                            hint="Say what to do. Never how it will feel.">
                            <Input value={task.subtitleEn ?? ""}
                                onChange={e => onChange({ subtitleEn: e.target.value })}
                                placeholder="Track your nutrition today" />
                        </PlanField>
                        <PlanField label="The line under it · العربية">
                            <Input dir="rtl" value={task.subtitleAr ?? ""}
                                onChange={e => onChange({ subtitleAr: e.target.value })} />
                        </PlanField>
                    </FieldRow>

                    <Separator />

                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        How it is finished
                    </p>

                    <FieldRow>
                        <PlanField label="What the patient does"
                            hint={CAPTURES.find(c => c.id === task.capture)?.blurb}>
                            <Select value={task.capture}
                                onValueChange={v => onChange({ capture: v as ProtocolTask["capture"] })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CAPTURES.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </PlanField>
                        <PlanField label="Comes back"
                            hint={RESETS.find(r => r.id === task.resets)?.blurb}>
                            <Select value={task.resets}
                                onValueChange={v => onChange({ resets: v as ProtocolTask["resets"] })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {RESETS.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </PlanField>
                    </FieldRow>

                    {/* A unit and bounds belong to a figure. A tick has neither. */}
                    {takesUnit(task.capture) && (
                        <div className="grid gap-4 md:grid-cols-3">
                            <PlanField label="Unit" required hint="Shown beside the figure.">
                                <Input value={task.unit ?? ""}
                                    onChange={e => onChange({ unit: e.target.value })}
                                    placeholder="kg" />
                            </PlanField>
                            <PlanField label="Least">
                                <Input type="number" value={task.min ?? ""}
                                    onChange={e => onChange({
                                        min: e.target.value === "" ? undefined : Number(e.target.value),
                                    })}
                                    placeholder="30" />
                            </PlanField>
                            <PlanField label="Most">
                                <Input type="number" value={task.max ?? ""}
                                    onChange={e => onChange({
                                        max: e.target.value === "" ? undefined : Number(e.target.value),
                                    })}
                                    placeholder="300" />
                            </PlanField>
                        </div>
                    )}

                    <FieldRow>
                        <PlanField label="Icon">
                            <Select value={task.icon}
                                onValueChange={v => onChange({ icon: v as ProtocolTask["icon"] })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {TASK_ICONS.map(i => (
                                        <SelectItem key={i.id} value={i.id}>
                                            <span className="text-xs font-medium">{i.label}</span>
                                            <span className="ml-2 text-[10px] text-muted-foreground">{i.blurb}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </PlanField>
                        <PlanField label="Key" required
                            hint={clash
                                ? "Another task on this protocol already uses this key."
                                : isNew
                                    ? "Lower case with underscores. The app stores every reading against it."
                                    : "Changing it orphans every reading already logged under the old key."}>
                            <Input value={task.key}
                                onChange={e => onChange({ key: toTaskKey(e.target.value) })}
                                className={clash ? "border-destructive font-mono text-sm" : "font-mono text-sm"}
                                placeholder="take_medication" />
                        </PlanField>
                    </FieldRow>

                    <PlanField label="Writes into"
                        hint="The series this fills. Leave it empty where nothing plots the readings.">
                        <Input value={task.signalKey ?? ""}
                            onChange={e => onChange({ signalKey: toTaskKey(e.target.value) })}
                            className="font-mono text-sm" placeholder="weight_kg" />
                    </PlanField>

                    {task.signalKey === "weight_kg" && (
                        <p className="rounded-md border border-sky-200 bg-sky-50/60 px-3 py-2 text-xs text-sky-900">
                            The onboarding chat already asks for <b>weight_kg</b>. The answer at
                            signup and every daily reading land in one series, which is what draws
                            the weight trend on the patient&rsquo;s home screen.
                        </p>
                    )}

                    <Separator />

                    <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                        When it is on their card
                    </p>

                    <div className="space-y-2.5">
                        <PlanField label="Shows after">
                            <Select value={shows ? shows.needs : "none"} onValueChange={setShowsNeeds}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">From the day they buy</SelectItem>
                                    {OUTPUTS.map(o => (
                                        <SelectItem key={o.id} value={o.id}>
                                            <span className="text-xs font-medium">{o.produces}</span>
                                            <span className="ml-2 text-[10px] text-muted-foreground">{o.blurb}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </PlanField>
                        {shows && (
                            <Select value={shows.fromType ?? "any"} onValueChange={setShowsType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">from any step</SelectItem>
                                    {STEP_TYPES.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Proof proof={shows ? proveGate(shows, steps) : null} gate={shows} />
                        {shows?.needs === "delivery" && !shows.fromType && (
                            <p className="rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
                                A supplement voucher is a delivery too. Name <b>a medication step</b>
                                {" "}where the task is about a medicine, or it starts one step early.
                            </p>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        <PlanField label="Hides after">
                            <Select
                                value={hidesAtEnd ? "protocol_ends" : hides ? hides.needs : "none"}
                                onValueChange={setHidesNeeds}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Never · it stays</SelectItem>
                                    <SelectItem value="protocol_ends">When the protocol finishes</SelectItem>
                                    {OUTPUTS.map(o => (
                                        <SelectItem key={o.id} value={o.id}>{o.produces}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </PlanField>
                        {hides && (
                            <Select value={hides.fromType ?? "any"} onValueChange={setHidesType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">from any step</SelectItem>
                                    {STEP_TYPES.map(t => (
                                        <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        {hidesAtEnd ? (
                            <p className="text-xs text-muted-foreground">
                                It stays to the last step. Nothing in the protocol revokes it.
                            </p>
                        ) : (
                            <Proof proof={hides ? proveGate(hides, steps) : null} gate={hides} />
                        )}
                        <p className="text-xs text-muted-foreground">
                            Nothing here is a date. A ticked task also stays on screen, with a tick —
                            finishing a task never removes it.
                        </p>
                    </div>

                    {hasAxis && (
                        <PlanField label="Runs for"
                            hint="Leave every box ticked and it runs on all paths, as a step does.">
                            <div className="flex flex-wrap gap-4 pt-1">
                                {paths.map(p => {
                                    const all = !task.appliesTo?.length
                                    const on = all || task.appliesTo!.includes(p.id)
                                    return (
                                        <label key={p.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox checked={on} onCheckedChange={v => {
                                                const current = all ? paths.map(x => x.id) : [...task.appliesTo!]
                                                const next = v
                                                    ? [...new Set([...current, p.id])]
                                                    : current.filter(x => x !== p.id)
                                                /* All of them means no restriction at all, which is
                                                   how a step says it. */
                                                onChange({
                                                    appliesTo: next.length === paths.length ? undefined : next,
                                                })
                                            }} />
                                            {p.label}
                                        </label>
                                    )
                                })}
                            </div>
                        </PlanField>
                    )}

                    <Separator />

                    <div className="space-y-3">
                        <label className="flex items-center gap-3 rounded-md border p-3">
                            <Switch checked={task.coachMayRecommend}
                                onCheckedChange={v => onChange({ coachMayRecommend: v })} />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">A coach may put this on one patient</span>
                                <span className="block text-xs text-muted-foreground">
                                    On, and it appears on the coach&rsquo;s menu for a single patient,
                                    above the protocol&rsquo;s own. Off, and only this board decides
                                    who sees it.
                                </span>
                            </span>
                        </label>

                        <label className="flex items-center gap-3 rounded-md border p-3">
                            <Switch checked={task.isActive}
                                onCheckedChange={v => onChange({ isActive: v })} />
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-medium">Active</span>
                                <span className="block text-xs text-muted-foreground">
                                    Off, and no patient is asked for it. Their own readings are kept.
                                </span>
                            </span>
                        </label>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
