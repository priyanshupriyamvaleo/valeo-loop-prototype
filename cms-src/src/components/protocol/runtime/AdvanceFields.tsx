"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, Check, X } from "lucide-react"
import {
    STATUS_FIELDS, emptyAdvance, fieldExists, pathOfFulfilment, reachable,
    retryFor, statusDef, statusesFor,
} from "@/lib/protocol-runtime"
import type { Listing, Protocol, ProtocolStep, StatusField, StepAdvance } from "@/types"

/**
 * HOW THIS STEP ADVANCES.
 *
 * The one thing the Step Builder could not say. `requires` is a precondition
 * and the order is the dependency; neither says how the system LEARNS a step
 * is finished. Without this every protocol stalls at step one.
 *
 * WHAT IS DELIBERATELY ABSENT: any ordering of the statuses. The CMS holds no
 * transition graph — the live console reads the allowed set off the API per
 * child order and renders it — so `completesOn` is ANY-OF. Inventing an order
 * here would be a second truth that drifts from the server's.
 *
 * WHAT IS DELIBERATELY PRESENT: statuses nothing can set. They are offered and
 * marked, so an author reaching for "Nurse reached" is told why it cannot be a
 * step, rather than finding a short dropdown and assuming the list is stale.
 */
export function AdvanceFields({
    step, protocol, listings, onChange,
}: {
    step: ProtocolStep
    protocol: Protocol
    listings: Listing[]
    onChange: (p: Partial<ProtocolStep>) => void
}) {
    const a = step.advance
    const fulfilments = protocol.fulfilments ?? []
    const f = a?.fulfilmentId ? fulfilments.find(x => x.id === a.fulfilmentId) : undefined
    const path = pathOfFulfilment(f, listings)

    const set = (p: Partial<StepAdvance>) =>
        onChange({ advance: { ...(a ?? emptyAdvance()), ...p } })

    const options = a ? statusesFor(a.field) : []
    const retries = a ? retryFor(a.field, path) : []

    /* A status is added and removed from the list, not selected — a step may
       finish on either of two, and "results uploaded" comes in two forms that
       are alternatives rather than a sequence. */
    const toggle = (key: "completesOn" | "retriesOn", id: string) => {
        if (!a) return
        const cur = (key === "completesOn" ? a.completesOn : a.retriesOn) ?? []
        const next = cur.includes(id) ? cur.filter(x => x !== id) : [...cur, id]
        set({ [key]: key === "retriesOn" && !next.length ? undefined : next } as Partial<StepAdvance>)
    }

    if (!a) {
        return (
            <div className="space-y-2">
                <div>
                    <Label className="text-xs">How it advances</Label>
                    <p className="text-xs text-muted-foreground">
                        What tells the system this step is finished. Without it the protocol stops
                        here for every patient, for good.
                    </p>
                </div>
                <div className="flex items-center gap-3 rounded-md border border-rose-200 bg-rose-50/70 p-3">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                    <p className="flex-1 text-xs text-rose-900">
                        Nothing advances this step.
                    </p>
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => onChange({ advance: emptyAdvance() })}>
                        Say what finishes it
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div>
                <Label className="text-xs">How it advances</Label>
                <p className="text-xs text-muted-foreground">
                    Which order to watch, which field on it, and any one of the statuses that
                    finishes the step. Nothing here is a date.
                </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label className="text-xs">The order it watches</Label>
                    <Select value={a.fulfilmentId ?? "none"}
                        onValueChange={v => set({ fulfilmentId: v === "none" ? undefined : v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">
                                {a.field === "app_event" ? "No order — the patient does it" : "Not named yet"}
                            </SelectItem>
                            {fulfilments.map(x => (
                                <SelectItem key={x.id} value={x.id}>{x.label || "Untitled order"}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {fulfilments.length === 0 && (
                        <p className="text-xs text-amber-700">
                            No orders on this protocol yet. Add them above the chain first.
                        </p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs">The field that holds the status</Label>
                    <Select value={a.field}
                        onValueChange={v => set({ field: v as StatusField, completesOn: [], retriesOn: undefined })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {STATUS_FIELDS.map(x => (
                                <SelectItem key={x.id} value={x.id}>
                                    <span className="text-xs font-medium">{x.label}</span>
                                    {!x.exists && (
                                        <span className="ml-2 text-[10px] text-rose-700">does not exist yet</span>
                                    )}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                        {STATUS_FIELDS.find(x => x.id === a.field)?.blurb}
                    </p>
                </div>
            </div>

            {!fieldExists(a.field) && (
                <p className="rounded-md border border-rose-200 bg-rose-50/70 px-3 py-2 text-xs text-rose-900">
                    Nothing in the live system writes this field. The step cannot advance until it
                    is built, and the hand-off lists it under &ldquo;Build&rdquo;.
                </p>
            )}

            {options.length > 0 && (
                <div className="space-y-1.5">
                    <Label className="text-xs">It is finished when the status becomes</Label>
                    <p className="text-xs text-muted-foreground">
                        Any one of these. Not a sequence — the allowed order lives behind the order
                        service, so this screen does not pretend to know it.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {options.filter(o => o.kind !== "retry" && o.kind !== "halt").map(o => {
                            const on = a.completesOn.includes(o.id)
                            const bad = !o.settable || !reachable(o, path)
                            return (
                                <Button key={o.id} size="sm"
                                    variant={on ? "secondary" : "outline"}
                                    className={`h-7 text-xs ${on && bad ? "border-rose-300 text-rose-800" : ""}`}
                                    onClick={() => toggle("completesOn", o.id)}>
                                    {on && (bad
                                        ? <X className="mr-1 h-3 w-3" />
                                        : <Check className="mr-1 h-3 w-3" />)}
                                    {o.label}
                                    {!o.settable && (
                                        <span className="ml-1.5 text-[9px] text-rose-700">nothing sets it</span>
                                    )}
                                    {o.settable && !reachable(o, path) && (
                                        <span className="ml-1.5 text-[9px] text-amber-700">
                                            not on a {path} order
                                        </span>
                                    )}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            )}

            {retries.length > 0 && (
                <div className="space-y-1.5">
                    <Label className="text-xs">It re-opens when the status becomes</Label>
                    <p className="text-xs text-muted-foreground">
                        A recollection or a nurse change is a normal event. Without one of these the
                        patient waits for ever behind a step the system thinks is finished.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {retries.map(o => {
                            const on = (a.retriesOn ?? []).includes(o.id)
                            return (
                                <Button key={o.id} size="sm"
                                    variant={on ? "secondary" : "outline"}
                                    className="h-7 text-xs"
                                    onClick={() => toggle("retriesOn", o.id)}>
                                    {on && <Check className="mr-1 h-3 w-3" />}
                                    {o.label}
                                </Button>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                    <Label className="text-xs">What the patient reads while it is pending</Label>
                    <Input value={step.waitingEn ?? ""} className="h-9"
                        onChange={e => onChange({ waitingEn: e.target.value })}
                        placeholder="Your nurse is on the way" />
                    <p className="text-xs text-muted-foreground">
                        Leave it empty and the app shows the step&rsquo;s own title, which is
                        written for staff.
                    </p>
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs">While it is pending · العربية</Label>
                    <Input dir="rtl" value={step.waitingAr ?? ""} className="h-9"
                        onChange={e => onChange({ waitingAr: e.target.value })} />
                </div>
            </div>

            <label className="flex items-center gap-3 rounded-md border p-2.5">
                <Switch checked={!!a.manualOverride}
                    onCheckedChange={v => set({ manualOverride: v })} />
                <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium">Ops may force it through</span>
                    <span className="block text-xs text-muted-foreground">
                        On, and somebody in the console can advance this step without the signal.
                        Off, and only the signal moves it.
                    </span>
                </span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                    {a.completesOn.length
                        ? a.completesOn.map(id => statusDef(a.field, id)?.wire ?? id).join(" · ")
                        : "no status chosen"}
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                    the value the order service actually sends
                </span>
                <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs"
                    onClick={() => onChange({ advance: undefined })}>
                    Clear
                </Button>
            </div>
        </div>
    )
}
