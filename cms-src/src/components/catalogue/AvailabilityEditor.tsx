"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Plus, Trash, AlertTriangle, Clock } from "lucide-react"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    AvailabilityWindow, Practitioner, PractitionerAvailability, WEEKDAYS, Weekday,
} from "@/types"
import { availabilityGaps, weeklyCapacity, weeklyMinutes, windowErrors } from "@/lib/availability"

/**
 * When a practitioner can be booked.
 *
 * Authored on the person, not per consultation, because that is what it is —
 * and it is how the legacy admin has it (`coach-slot-selection` is keyed by
 * coach). The slot LENGTH stays on the consultation: the same doctor can offer a
 * 15-minute follow-up and a 45-minute first visit from one calendar.
 */

/** GCC zones, plus the two the rest of the business runs in. */
const TIMEZONES = [
    { id: "Asia/Dubai", label: "Asia/Dubai — UAE (+4)" },
    { id: "Asia/Riyadh", label: "Asia/Riyadh — KSA, Qatar, Kuwait (+3)" },
    { id: "Asia/Qatar", label: "Asia/Qatar (+3)" },
    { id: "Asia/Kuwait", label: "Asia/Kuwait (+3)" },
]

const DEFAULT_WINDOW: AvailabilityWindow = { start: "09:00", end: "17:00" }

export function AvailabilityEditor({ practitioner, onChange, sessionMinutes, bufferMinutes }: {
    practitioner: Practitioner
    onChange: (a: PractitionerAvailability) => void
    /** Optional — lets the panel show how many sessions actually fit. */
    sessionMinutes?: number
    bufferMinutes?: number
}) {
    const a: PractitionerAvailability = practitioner.availability ?? {}
    const weekly = a.weekly ?? {}
    const gaps = useMemo(() => availabilityGaps(practitioner), [practitioner])
    const minutes = weeklyMinutes(a)
    const capacity = weeklyCapacity(a, sessionMinutes, bufferMinutes)

    const setWeekly = (day: Weekday, windows: AvailabilityWindow[]) => {
        const next = { ...weekly }
        if (windows.length === 0) delete next[day]
        else next[day] = windows
        onChange({ ...a, weekly: next })
    }

    const addWindow = (day: Weekday) =>
        setWeekly(day, [...(weekly[day] ?? []), { ...DEFAULT_WINDOW }])

    const patchWindow = (day: Weekday, i: number, p: Partial<AvailabilityWindow>) =>
        setWeekly(day, (weekly[day] ?? []).map((w, idx) => (idx === i ? { ...w, ...p } : w)))

    const removeWindow = (day: Weekday, i: number) =>
        setWeekly(day, (weekly[day] ?? []).filter((_, idx) => idx !== i))

    /** Copies the first configured day across the rest of the week. */
    const applyToAll = () => {
        const source = WEEKDAYS.map(d => weekly[d.id]).find(w => w && w.length > 0)
        if (!source) return
        const next: PractitionerAvailability["weekly"] = {}
        WEEKDAYS.forEach(d => { next[d.id] = source.map(w => ({ ...w })) })
        onChange({ ...a, weekly: next })
    }

    const blackouts = a.blackoutDates ?? []

    return (
        <Card>
            <CardHeader className="py-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">Availability</span>
                    <Badge variant="outline" className="text-[10px]">
                        <Clock className="mr-1 h-2.5 w-2.5" />
                        {minutes === 0 ? "nothing bookable" : `${Math.round(minutes / 60)}h / week`}
                    </Badge>
                    {capacity !== undefined && capacity > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                            ≈ {capacity} sessions / week
                        </Badge>
                    )}
                    <Button size="sm" variant="ghost" className="ml-auto h-7 text-[10px]"
                        onClick={applyToAll} disabled={minutes === 0}>
                        Copy first day to all
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                    Hours only. Session length comes from the consultation, so one calendar
                    serves a 15-minute follow-up and a 45-minute first visit.
                </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-0">
                {/* ── weekly grid ── */}
                <div className="space-y-1.5">
                    {WEEKDAYS.map(d => {
                        const windows = weekly[d.id] ?? []
                        const errs = windowErrors(windows)
                        return (
                            <div key={d.id} className="rounded-md border p-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-16 shrink-0 text-xs font-medium">{d.label}</span>
                                    {windows.length === 0 && (
                                        <span className="text-[10px] text-muted-foreground">Closed</span>
                                    )}
                                    <Button size="sm" variant="ghost" className="ml-auto h-6 px-2 text-[10px]"
                                        onClick={() => addWindow(d.id)}>
                                        <Plus className="mr-1 h-3 w-3" /> Window
                                    </Button>
                                </div>
                                {windows.map((w, i) => (
                                    <div key={i} className="mt-1.5 flex items-center gap-2">
                                        <Input type="time" className="h-7 w-28 text-xs" value={w.start}
                                            onChange={e => patchWindow(d.id, i, { start: e.target.value })} />
                                        <span className="text-[10px] text-muted-foreground">to</span>
                                        <Input type="time" className="h-7 w-28 text-xs" value={w.end}
                                            onChange={e => patchWindow(d.id, i, { end: e.target.value })} />
                                        <Button size="sm" variant="ghost"
                                            className="h-7 w-7 p-0 text-destructive"
                                            onClick={() => removeWindow(d.id, i)}>
                                            <Trash className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                                {errs.map(e => (
                                    <p key={e} className="mt-1 text-[10px] text-destructive">{e}</p>
                                ))}
                            </div>
                        )
                    })}
                </div>

                {/* ── booking rules ── */}
                <div className="grid gap-3 sm:grid-cols-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Timezone</Label>
                        <Select value={a.timezone ?? ""} onValueChange={v => onChange({ ...a, timezone: v })}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Pick a zone" /></SelectTrigger>
                            <SelectContent>
                                {TIMEZONES.map(t => (
                                    <SelectItem key={t.id} value={t.id} className="text-xs">{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground">
                            Required — UAE is +4 and KSA is +3, so unset hours are ambiguous.
                        </p>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Notice required (hours)</Label>
                        <Input type="number" min={0} className="h-9 text-xs" value={a.leadTimeHours ?? ""}
                            placeholder="e.g. 4"
                            onChange={e => onChange({
                                ...a, leadTimeHours: e.target.value === "" ? undefined : Number(e.target.value),
                            })} />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-xs">Booking opens (days ahead)</Label>
                        <Input type="number" min={1} className="h-9 text-xs" value={a.advanceBookingDays ?? ""}
                            placeholder="e.g. 30"
                            onChange={e => onChange({
                                ...a, advanceBookingDays: e.target.value === "" ? undefined : Number(e.target.value),
                            })} />
                    </div>
                </div>

                {/* ── blackout dates ── */}
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                        <Label className="text-xs">Days off</Label>
                        <Button size="sm" variant="ghost" className="ml-auto h-6 px-2 text-[10px]"
                            onClick={() => onChange({ ...a, blackoutDates: [...blackouts, ""] })}>
                            <Plus className="mr-1 h-3 w-3" /> Date
                        </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        Full dates, not day-of-month. Legacy stored a month and a day, so a
                        one-off closure silently repeated every year.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {blackouts.map((dt, i) => (
                            <div key={i} className="flex items-center gap-1">
                                <Input type="date" className="h-7 w-36 text-xs" value={dt}
                                    onChange={e => onChange({
                                        ...a,
                                        blackoutDates: blackouts.map((x, idx) => (idx === i ? e.target.value : x)),
                                    })} />
                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive"
                                    onClick={() => onChange({
                                        ...a, blackoutDates: blackouts.filter((_, idx) => idx !== i),
                                    })}>
                                    <Trash className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                        {blackouts.length === 0 && (
                            <span className="text-[10px] text-muted-foreground">None</span>
                        )}
                    </div>
                </div>

                {/* ── what is wrong ── */}
                {gaps.length > 0 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800">
                            <AlertTriangle className="h-3 w-3" /> {gaps.length} to fix before bookings work
                        </p>
                        <ul className="mt-1 space-y-0.5">
                            {gaps.map(g => (
                                <li key={g} className="text-[10px] text-amber-800">· {g}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
