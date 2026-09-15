// ── Practitioner availability ─────────────────────────────────
// Validation and derivation for a bookable calendar. The rules here are the
// ones a booking service will otherwise discover at runtime, when a customer is
// already looking at a broken slot list.

import type {
    AvailabilityWindow, Practitioner, PractitionerAvailability, Weekday,
} from "@/types"
import { WEEKDAYS } from "@/types"

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/

export const toMinutes = (t: string): number => {
    const m = t.match(HHMM)
    if (!m) return NaN
    return Number(m[1]) * 60 + Number(m[2])
}

export const isValidTime = (t: string) => HHMM.test(t)

/** Sorted copy — overlap checking and display both want windows in order. */
const sorted = (ws: AvailabilityWindow[]) =>
    [...ws].sort((a, b) => toMinutes(a.start) - toMinutes(b.start))

/**
 * Problems with one day's windows. Legacy compared "HH:MM" strings for overlap,
 * which works only because the format is fixed-width — we compare minutes so a
 * malformed time is caught rather than silently mis-sorted.
 */
export function windowErrors(windows: AvailabilityWindow[]): string[] {
    const errs: string[] = []
    windows.forEach((w, i) => {
        if (!isValidTime(w.start) || !isValidTime(w.end)) {
            errs.push(`Window ${i + 1}: use HH:MM (24-hour)`)
            return
        }
        if (toMinutes(w.end) <= toMinutes(w.start)) {
            errs.push(`Window ${i + 1}: ends at or before it starts`)
        }
    })
    // Overlaps, on the sorted list, so "14:00–16:00" then "09:00–15:00" is caught.
    const ok = sorted(windows.filter(w => isValidTime(w.start) && isValidTime(w.end)))
    for (let i = 1; i < ok.length; i++) {
        if (toMinutes(ok[i].start) < toMinutes(ok[i - 1].end)) {
            errs.push(`${ok[i - 1].start}–${ok[i - 1].end} overlaps ${ok[i].start}–${ok[i].end}`)
        }
    }
    return errs
}

/** Total bookable minutes in a week — the fastest way to spot an empty calendar. */
export function weeklyMinutes(a?: PractitionerAvailability): number {
    if (!a?.weekly) return 0
    return WEEKDAYS.reduce((total, d) => {
        const ws = a.weekly?.[d.id] ?? []
        return total + ws.reduce((sum, w) => {
            const mins = toMinutes(w.end) - toMinutes(w.start)
            return sum + (Number.isFinite(mins) && mins > 0 ? mins : 0)
        }, 0)
    }, 0)
}

/** How many sessions of `length` minutes fit in a week, allowing for the buffer. */
export function weeklyCapacity(
    a: PractitionerAvailability | undefined, sessionMinutes?: number, bufferMinutes = 0,
): number | undefined {
    if (!sessionMinutes || sessionMinutes <= 0 || !a?.weekly) return undefined
    const per = sessionMinutes + Math.max(0, bufferMinutes)
    return WEEKDAYS.reduce((total, d) => {
        const ws = a.weekly?.[d.id] ?? []
        return total + ws.reduce((sum, w) => {
            const mins = toMinutes(w.end) - toMinutes(w.start)
            return sum + (Number.isFinite(mins) && mins > 0 ? Math.floor(mins / per) : 0)
        }, 0)
    }, 0)
}

/** Everything wrong with a practitioner's calendar, in operator language. */
export function availabilityGaps(p: Practitioner): string[] {
    const a = p.availability
    const g: string[] = []

    if (!a || weeklyMinutes(a) === 0) {
        g.push("No bookable hours set — nothing can be booked with them")
        return g
    }
    if (!a.timezone) {
        g.push("No timezone — hours are ambiguous across UAE (+4) and KSA (+3)")
    }
    // Legacy gated submission on adv_booking_days >= 1; a zero horizon means the
    // calendar is open but nothing is ever offered.
    if (a.advanceBookingDays !== undefined && a.advanceBookingDays < 1) {
        g.push("Booking opens 0 days ahead, so no slot is ever offered")
    }
    if (a.leadTimeHours !== undefined && a.leadTimeHours < 0) {
        g.push("Lead time cannot be negative")
    }
    // Lead time longer than the horizon closes the calendar entirely — legacy
    // validated each bound alone and never compared them.
    if (a.leadTimeHours !== undefined && a.advanceBookingDays !== undefined
        && a.advanceBookingDays >= 1 && a.leadTimeHours >= a.advanceBookingDays * 24) {
        g.push(`Lead time (${a.leadTimeHours}h) is longer than the booking window (${a.advanceBookingDays}d) — no slot can ever qualify`)
    }

    WEEKDAYS.forEach(d => {
        windowErrors(a.weekly?.[d.id] ?? []).forEach(e => g.push(`${d.label}: ${e}`))
    })

    ;(a.blackoutDates ?? []).forEach(dt => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dt)) g.push(`Blackout date "${dt}" is not YYYY-MM-DD`)
    })

    const links = a.bookingLinks ?? []
    if (links.length > 0 && !links.some(l => l.isDefault && l.isActive !== false)) {
        g.push("Booking links exist but none is the active default")
    }
    return g
}

export const hasBookableHours = (p: Practitioner) => weeklyMinutes(p.availability) > 0

/** Blank week, for seeding the editor. */
export function emptyWeek(): Partial<Record<Weekday, AvailabilityWindow[]>> {
    return {}
}
