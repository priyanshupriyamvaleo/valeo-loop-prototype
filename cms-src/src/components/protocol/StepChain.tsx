"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    AlertTriangle, ArrowDown, ArrowUp, Check, Plus, Trash, X,
} from "lucide-react"
import { MONEY, pricedUnitsOf, unitPrice } from "@/lib/composition"
import {
    ACTORS, ALL_PATHS, OUTPUTS, actorLabel, chainFindings, defaultUnitOf,
    emptyStep, needsLabel, producesLabel, satisfiedBy, stepOnPath, unitForPath,
} from "@/lib/protocol-chain"
import type { ProtocolPath } from "@/lib/protocol-chain"
import { advanceSummary } from "@/lib/protocol-runtime"
import { AdvanceFields } from "@/components/protocol/runtime/AdvanceFields"
import type {
    Listing, PricedUnitRef, Protocol, ProtocolActor, ProtocolOutput, ProtocolStep,
    ProtocolStepType, ProtocolVariantAxis,
} from "@/types"

const STEP_TYPES: { id: ProtocolStepType; label: string }[] = [
    { id: "consultation", label: "Consultation" },
    { id: "lab_test", label: "Lab test" },
    { id: "medication", label: "Medication" },
    { id: "lifestyle", label: "Lifestyle" },
    { id: "follow_up", label: "Follow-up" },
]

/**
 * THE CHAIN, READ TOP TO BOTTOM.
 *
 * The old editor was a stack of identical cards, each with a Cadence box. That
 * shape hid the only thing that matters — whether the sequence holds together —
 * and it asked for a week nobody can honestly give.
 *
 * This reads as a chain instead. Each row states who acts, what the step needs
 * and what it leaves behind, and a tick says which step above satisfies the
 * need. A cross is the one real error a linear order can have: the thing exists
 * and it exists too late.
 *
 * MOVING A STEP IS EDITING THE DEPENDENCY, so the arrows are the reorder AND
 * the chain edit, and the ticks answer immediately.
 */
export function StepChain({
    steps, axis, path, listings, country, protocol, onChange,
}: {
    steps: ProtocolStep[]
    axis?: ProtocolVariantAxis
    /** Which path is on screen. `ALL_PATHS` when the protocol has no axis. */
    path: ProtocolPath
    listings: Listing[]
    country: "UAE" | "KSA" | "QATAR" | "KUWAIT"
    /** The whole protocol, so a step can name one of its orders. */
    protocol: Protocol
    onChange: (next: ProtocolStep[]) => void
}) {
    const [openId, setOpenId] = useState<string | null>(null)

    /* Order is reassigned on every change, so it stays contiguous 0..n-1. */
    const set = (next: ProtocolStep[]) => onChange(next.map((s, i) => ({ ...s, order: i })))
    const sorted = useMemo(() => [...steps].sort((a, b) => a.order - b.order), [steps])

    /* The chain is checked against the path on screen, because a step that
       only some values run changes what is above every step below it. */
    const onPath = useMemo(
        () => sorted.filter(s => stepOnPath(s, path.id)),
        [sorted, path.id])
    const findings = useMemo(() => chainFindings(onPath), [onPath])
    const findingFor = (id: string) => findings.find(f => f.stepId === id)

    const upd = (id: string, p: Partial<ProtocolStep>) =>
        set(sorted.map(s => (s.id === id ? { ...s, ...p } : s)))
    const del = (id: string) => set(sorted.filter(s => s.id !== id))
    const move = (i: number, dir: -1 | 1) => {
        const to = i + dir
        if (to < 0 || to >= sorted.length) return
        const next = [...sorted]
        const [item] = next.splice(i, 1)
        next.splice(to, 0, item)
        set(next)
    }
    const add = () => {
        const s = emptyStep(sorted.length)
        set([...sorted, s])
        setOpenId(s.id)
    }

    const money = MONEY[country]
    const unitLine = (ref?: PricedUnitRef) => {
        if (!ref) return undefined
        const l = listings.find(x => x.id === ref.listingId)
        if (!l) return { name: ref.listingId, price: undefined }
        const u = pricedUnitsOf(l).find(x => x.ref.unitId === ref.unitId)
        return {
            name: `${l.displayNameEn || l.internalName}${u ? ` — ${u.label}` : ""}`,
            price: unitPrice(ref, listings, country),
        }
    }

    return (
        <div className="space-y-4">
            {/* ── What the chain is, said once ── */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium">The sequence</p>
                    <p className="max-w-2xl text-xs text-muted-foreground">
                        A step unlocks when the one above it is done. There are no weeks and no
                        days: a patient starts when they buy, and every step takes as long as it
                        takes. What each step states instead is who acts, what it needs, and what
                        it leaves behind — so the order can be checked.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={add}>
                    <Plus className="mr-2 h-3.5 w-3.5" /> Add step
                </Button>
            </div>

            {findings.length > 0 && (
                <Card className="flex flex-wrap items-start gap-2.5 border-rose-200 bg-rose-50/70 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div className="min-w-0 flex-1 space-y-1 text-xs text-rose-900">
                        <p className="font-medium">
                            {findings.length} step{findings.length === 1 ? "" : "s"} cannot run where
                            {findings.length === 1 ? " it is" : " they are"}
                        </p>
                        {findings.map(f => {
                            const at = onPath.findIndex(s => s.id === f.stepId)
                            return (
                                <p key={f.stepId}>
                                    Step {at + 1},{" "}
                                    {onPath[at]?.titleEn || "untitled"} — {f.message}.
                                </p>
                            )
                        })}
                    </div>
                </Card>
            )}

            {sorted.length === 0 ? (
                <Card className="border-dashed p-10 text-center">
                    <p className="text-sm font-medium">No steps yet</p>
                    <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                        The first step is usually a booking or a consultation. Add it, then say who
                        acts and what it leaves behind.
                    </p>
                </Card>
            ) : (
                <div className="space-y-0">
                    {sorted.map((s, i) => {
                        const open = openId === s.id
                        const off = !stepOnPath(s, path.id)
                        const finding = findingFor(s.id)
                        const satisfier = satisfiedBy(onPath, s)
                        const ref = unitForPath(s, path.id)
                        const line = unitLine(ref)
                        const varies = !!s.unitByValue && Object.keys(s.unitByValue).length > 0
                        const posOnPath = onPath.findIndex(x => x.id === s.id) + 1

                        return (
                            <div key={s.id}>
                                {i > 0 && (
                                    /* The link. It carries no duration, because none is knowable. */
                                    <div className="ml-[27px] h-4 border-l" />
                                )}

                                <Card className={`overflow-hidden p-0 ${off ? "opacity-50" : ""} ${
                                    finding ? "border-rose-300" : ""}`}>
                                    <div className="flex cursor-pointer items-start gap-3 p-3"
                                        onClick={() => setOpenId(open ? null : s.id)}>
                                        <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                                            off ? "text-muted-foreground" : ""}`}>
                                            {off ? "—" : posOnPath}
                                        </span>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium">
                                                {s.titleEn || <span className="text-muted-foreground">Untitled step</span>}
                                            </p>

                                            {/* The chain, as a sentence. */}
                                            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                                                <span>{actorLabel(s.actor)}</span>
                                                {s.requires && (
                                                    <>
                                                        <span>·</span>
                                                        <span className={finding ? "text-rose-700" : ""}>
                                                            needs {needsLabel(s.requires)}
                                                        </span>
                                                        {satisfier !== undefined ? (
                                                            <span className="inline-flex items-center gap-0.5 text-emerald-700">
                                                                <Check className="h-3 w-3" /> step {satisfier}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-0.5 text-rose-700">
                                                                <X className="h-3 w-3" />
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                                {s.produces && (
                                                    <>
                                                        <span>·</span>
                                                        <span>produces {producesLabel(s.produces)}</span>
                                                    </>
                                                )}
                                                {s.dosing && (
                                                    <>
                                                        <span>·</span>
                                                        <span>{s.dosing}</span>
                                                    </>
                                                )}
                                            </div>

                                            {/* WHAT FINISHES IT. The one thing the chain could
                                                not say, and the reason every protocol stalled:
                                                the order is the dependency, and nothing said how
                                                the system learns a step is done. */}
                                            <div className="mt-1 text-xs">
                                                {advanceSummary(s) ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700">
                                                        <Check className="h-3 w-3" />
                                                        advances on {advanceSummary(s)}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                                                        <X className="h-3 w-3" />
                                                        nothing advances it
                                                    </span>
                                                )}
                                            </div>

                                            {/* The money this step puts in the package. */}
                                            {line && (
                                                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                                                    <Badge variant="outline" className="text-[10px]">
                                                        {ref?.kind.replace("_", " ")}
                                                    </Badge>
                                                    <span>{line.name}</span>
                                                    <span className="font-mono text-muted-foreground">
                                                        {line.price === undefined
                                                            ? `no ${country} price`
                                                            : `${money.code} ${line.price.toLocaleString()}`}
                                                    </span>
                                                    {varies && (
                                                        <Badge variant="outline"
                                                            className="border-violet-200 bg-violet-50 text-[10px] text-violet-700">
                                                            differs by {axis?.attribute}
                                                        </Badge>
                                                    )}
                                                </div>
                                            )}

                                            {off && (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Not on this path.
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex shrink-0 items-center gap-0.5"
                                            onClick={e => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                                disabled={i === 0} onClick={() => move(i, -1)}
                                                title="Move up — it changes what this step can rely on">
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                                disabled={i === sorted.length - 1} onClick={() => move(i, 1)}
                                                title="Move down">
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                                onClick={() => del(s.id)}>
                                                <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {open && (
                                        <StepEditor
                                            step={s}
                                            axis={axis}
                                            listings={listings}
                                            country={country}
                                            protocol={protocol}
                                            onChange={p => upd(s.id, p)}
                                        />
                                    )}
                                </Card>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

/** One step's fields. Nothing here asks for a date. */
function StepEditor({
    step, axis, listings, country, protocol, onChange,
}: {
    step: ProtocolStep
    axis?: ProtocolVariantAxis
    listings: Listing[]
    country: "UAE" | "KSA" | "QATAR" | "KUWAIT"
    protocol: Protocol
    onChange: (p: Partial<ProtocolStep>) => void
}) {
    const units = useMemo(() => {
        const l = listings.find(x => x.id === step.linkedUnit?.listingId)
        return l ? pricedUnitsOf(l) : []
    }, [listings, step.linkedUnit?.listingId])

    /* The listing picker only offers what has a priced unit: a content-only row
       is a folder with nothing sellable inside it. */
    const sellable = useMemo(
        () => listings.filter(l => pricedUnitsOf(l).length > 0),
        [listings])

    const pickListing = (listingId: string) => {
        if (listingId === "none") {
            onChange({ linkedUnit: undefined, unitByValue: undefined })
            return
        }
        const l = listings.find(x => x.id === listingId)
        onChange({ linkedUnit: l ? defaultUnitOf(l) : undefined })
    }

    return (
        <div className="space-y-4 border-t bg-muted/20 p-4">
            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label className="text-xs">Title (EN)</Label>
                    <Input value={step.titleEn}
                        placeholder="Nurse draws the blood sample"
                        onChange={e => onChange({ titleEn: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Title (AR)</Label>
                    <Input dir="rtl" value={step.titleAr ?? ""}
                        onChange={e => onChange({ titleAr: e.target.value })} />
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label className="text-xs">Kind of step</Label>
                    <Select value={step.type}
                        onValueChange={v => onChange({ type: v as ProtocolStepType })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {STEP_TYPES.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">Who does it</Label>
                    <Select value={step.actor}
                        onValueChange={v => onChange({ actor: v as ProtocolActor })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {ACTORS.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {ACTORS.find(a => a.id === step.actor)?.blurb}
                    </p>
                </div>
            </div>

            <Separator />

            {/* ── The dependency, and it is not a time ── */}
            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label className="text-xs">It needs</Label>
                    <Select value={step.requires ?? "none"}
                        onValueChange={v => onChange({
                            requires: v === "none" ? undefined : v as ProtocolOutput,
                        })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nothing — the step above is enough</SelectItem>
                            {OUTPUTS.map(o => (
                                <SelectItem key={o.id} value={o.id}>{o.needs}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        A step above has to produce it. The chain says which one.
                    </p>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">It leaves behind</Label>
                    <Select value={step.produces ?? "none"}
                        onValueChange={v => onChange({
                            produces: v === "none" ? undefined : v as ProtocolOutput,
                        })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nothing — a call, a review</SelectItem>
                            {OUTPUTS.map(o => (
                                <SelectItem key={o.id} value={o.id}>{o.produces}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {step.produces
                            ? OUTPUTS.find(o => o.id === step.produces)?.blurb
                            : "Most steps leave nothing behind, and that is normal."}
                    </p>
                </div>
            </div>

            {step.type === "medication" && (
                <div className="space-y-1.5">
                    <Label className="text-xs">Dose</Label>
                    <Input value={step.dosing ?? ""}
                        placeholder="0.25 mg weekly, rising to 1.0 mg"
                        onChange={e => onChange({ dosing: e.target.value })} />
                    <p className="text-xs text-muted-foreground">
                        The amount AND how often, in one sentence. How often is part of a dose and
                        it is true whenever the patient starts — unlike a week, which is not.
                    </p>
                </div>
            )}

            <div className="space-y-1.5">
                <Label className="text-xs">Note</Label>
                <Input value={step.note ?? ""}
                    placeholder="Anything a clinician or a coach needs told"
                    onChange={e => onChange({ note: e.target.value })} />
            </div>

            <Separator />

            {/* ── HOW IT ADVANCES ──
                After the words and before the money, because it is the step's
                own rule rather than something the catalogue supplies. It is the
                one thing the chain could never say: the order is the
                dependency, and nothing said how the system learns a step is
                done. */}
            <AdvanceFields step={step} protocol={protocol} listings={listings}
                onChange={onChange} />

            <Separator />

            {/* ── What this step puts in the package ── */}
            <div className="space-y-3">
                <div>
                    <Label className="text-xs">What it delivers</Label>
                    <p className="text-xs text-muted-foreground">
                        The package is read off these. One step that links an item puts one unit in
                        the package, so three dispatch steps mean three months of medicine.
                    </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <Select value={step.linkedUnit?.listingId ?? "none"} onValueChange={pickListing}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Nothing" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nothing — it is work, not an item</SelectItem>
                            {sellable.map(l => (
                                <SelectItem key={l.id} value={l.id}>
                                    {l.displayNameEn || l.internalName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* A listing is a folder. Which unit is a real decision, and it
                        only has to be made when there is more than one. */}
                    {units.length > 1 && step.linkedUnit && (
                        <Select value={step.linkedUnit.unitId}
                            onValueChange={v => {
                                const u = units.find(x => x.ref.unitId === v)
                                if (u) onChange({ linkedUnit: u.ref })
                            }}>
                            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {units.map(u => (
                                    <SelectItem key={u.ref.unitId} value={u.ref.unitId}>
                                        {u.label}
                                        {(() => {
                                            const p = unitPrice(u.ref, listings, country)
                                            return p === undefined ? "" : ` · ${MONEY[country].code} ${p.toLocaleString()}`
                                        })()}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* ── The variant overrides, only where an axis exists ── */}
            {axis && (
                <>
                    <Separator />
                    <VariantOverrides
                        step={step} axis={axis} listings={listings}
                        country={country} onChange={onChange}
                    />
                </>
            )}
        </div>
    )
}

/**
 * The two things a step may do differently per path, and nothing more.
 *
 * A different UNIT covers the case that exists: one panel for a man, another
 * for a woman. WHICH PATHS covers everything else — a step only women have —
 * and it doubles as the escape hatch, because two steps with different
 * `appliesTo` can say anything a per-value title could.
 */
function VariantOverrides({
    step, axis, listings, country, onChange,
}: {
    step: ProtocolStep
    axis: ProtocolVariantAxis
    listings: Listing[]
    country: "UAE" | "KSA" | "QATAR" | "KUWAIT"
    onChange: (p: Partial<ProtocolStep>) => void
}) {
    const on = step.appliesTo ?? axis.values
    const sellable = useMemo(
        () => listings.filter(l => pricedUnitsOf(l).length > 0),
        [listings])

    const toggle = (v: string) => {
        const next = on.includes(v) ? on.filter(x => x !== v) : [...on, v]
        /* All of them is the same as no restriction, and the absent field says
           it more plainly than a list that happens to be complete. */
        onChange({
            appliesTo: next.length === axis.values.length ? undefined : next,
        })
    }

    const setUnit = (value: string, listingId: string) => {
        const next = { ...(step.unitByValue ?? {}) }
        if (listingId === "none") delete next[value]
        else {
            const l = listings.find(x => x.id === listingId)
            const u = l ? defaultUnitOf(l) : undefined
            if (u) next[value] = u
        }
        onChange({ unitByValue: Object.keys(next).length ? next : undefined })
    }

    return (
        <div className="space-y-3">
            <div>
                <Label className="text-xs">By {axis.attribute}</Label>
                <p className="text-xs text-muted-foreground">
                    The sequence is written once. This step may run for only some values, or
                    deliver a different item for each.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">Runs for</span>
                {axis.values.map(v => (
                    <Button key={v} variant={on.includes(v) ? "secondary" : "outline"} size="sm"
                        className="h-7 text-xs" onClick={() => toggle(v)}>
                        {on.includes(v) && <Check className="mr-1 h-3 w-3" />}{v}
                    </Button>
                ))}
                {!step.appliesTo && (
                    <span className="text-xs text-muted-foreground">— everybody</span>
                )}
            </div>

            {step.linkedUnit && (
                <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">
                        A different item per value. Leave one empty to use the item above.
                    </span>
                    {axis.values.filter(v => on.includes(v)).map(v => {
                        const ref = step.unitByValue?.[v]
                        const price = ref ? unitPrice(ref, listings, country) : undefined
                        return (
                            <div key={v} className="flex flex-wrap items-center gap-2">
                                <span className="w-16 shrink-0 text-xs font-medium">{v}</span>
                                <div className="min-w-0 flex-1">
                                    <Select value={ref?.listingId ?? "none"}
                                        onValueChange={id => setUnit(v, id)}>
                                        <SelectTrigger className="h-8 text-xs">
                                            <SelectValue placeholder="Same as above" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Same as above</SelectItem>
                                            {sellable.map(l => (
                                                <SelectItem key={l.id} value={l.id}>
                                                    {l.displayNameEn || l.internalName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <span className="w-24 shrink-0 text-right font-mono text-xs text-muted-foreground">
                                    {price === undefined ? "" : `${MONEY[country].code} ${price.toLocaleString()}`}
                                </span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

export { ALL_PATHS }
