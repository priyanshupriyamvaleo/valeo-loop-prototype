// ── Metrics: the three tiles above the task list ──────────────
//
// THE NUMBER IS NEVER AUTHORED. "78 kg" is a reading somebody logged and "25%"
// is counted off the steps. Neither is a thing a person types into a
// catalogue, so what is authored here is WHICH tiles a protocol shows, in what
// order, and what they are called.
//
// WHICH IS WHY THE SOURCE IS A CLOSED LIST. Every source names a place the app
// already knows how to read. A free-text metric would be a tile with nothing
// behind it, and the catalogue could not tell you that.
//
// THE WEIGHT TILE READS THE WEIGHT TASK'S OWN SERIES. So a protocol that shows
// it and asks nobody to weigh in has a tile with no data. That is the reason
// tasks and metrics are managed on one screen, and it is checked rather than
// left as a thing somebody notices on a phone.

import { useMemo, useSyncExternalStore } from "react"
import type { PlanGap } from "@/lib/protocol-plans"
import type { MetricSource, ProtocolMetric, ProtocolTask } from "@/types"

const KEY = "valeo_cms_protocol_metrics_v1"

/** The app draws three. More than that is authored and never seen. */
export const SHOWN_ON_PHONE = 3

export const METRICS: {
    id: MetricSource
    /** The default name. An author may override it per protocol. */
    label: string
    /** What the app reads to fill it in. */
    reads: string
    /** What one looks like, so an author can picture the tile. */
    egValue: string
    egSub: string
    /**
     * The task series this tile reads. Where it is set and no task on the
     * protocol writes it, the tile has no data — and that is a refusal.
     */
    needsSignal?: string
}[] = [
    {
        id: "weight", label: "Weight",
        reads: "The most recent weight the patient logged.",
        egValue: "78 kg", egSub: "Since 1 Mar 2026",
        needsSignal: "weight_kg",
    },
    {
        id: "weight_change", label: "Weight change",
        reads: "The move between the first reading and the latest.",
        egValue: "−6.5 kg", egSub: "Since you started",
        needsSignal: "weight_kg",
    },
    {
        id: "protocol_progress", label: "Protocol progress",
        reads: "Steps completed, over the steps the protocol has.",
        egValue: "25%", egSub: "Week 3 of 12",
    },
    {
        id: "latest_reports", label: "Latest reports",
        reads: "Whether a lab report exists, and how long ago it landed.",
        egValue: "View", egSub: "2 days ago",
    },
    {
        id: "next_visit", label: "Next visit",
        reads: "The next booked appointment on the plan.",
        egValue: "Wed 08:30", egSub: "Nurse, at home",
    },
    {
        id: "medication_taken", label: "Doses taken",
        reads: "How many times the medication task has been ticked.",
        egValue: "22", egSub: "Since Month 1",
        needsSignal: "medication_taken",
    },
    {
        id: "days_logged", label: "Days logged",
        reads: "Days that carry any log at all.",
        egValue: "18", egSub: "Out of 21",
    },
    {
        id: "task_streak", label: "Streak",
        reads: "Consecutive days with every task done.",
        egValue: "5 days", egSub: "Keep it going",
    },
]

export const metricSpec = (s: MetricSource) => METRICS.find(m => m.id === s)
export const metricLabel = (m: ProtocolMetric) =>
    m.labelEn?.trim() || metricSpec(m.source)?.label || m.source

const rid = () => Math.random().toString(36).slice(2, 9)

export function emptyMetric(source: MetricSource, sortOrder: number): ProtocolMetric {
    return { id: `m-${rid()}`, source, sortOrder, labelEn: "", labelAr: "", isActive: true }
}

/** In order, actives only — what the app would draw. */
export const activeMetrics = (list: ProtocolMetric[]) =>
    [...list].filter(m => m.isActive).sort((a, b) => a.sortOrder - b.sortOrder)

/** The ones a patient actually sees. The app draws three. */
export const shownMetrics = (list: ProtocolMetric[]) =>
    activeMetrics(list).slice(0, SHOWN_ON_PHONE)

// ── The refusals ─────────────────────────────────────────────

/**
 * What stops the metrics being sound.
 *
 * The interesting one is the last: a tile whose series nothing writes. The
 * weight tile reads what `record_weight` logs, so a protocol showing the tile
 * and asking nobody to weigh in has a tile that will read as a dash on every
 * patient's home screen. Nothing on a phone would say why.
 */
export function metricGaps(list: ProtocolMetric[], tasks: ProtocolTask[]): PlanGap[] {
    const out: PlanGap[] = []
    const active = activeMetrics(list)

    if (!active.length) {
        out.push({
            section: "metrics",
            what: "No metric is switched on",
            why: "The row above the patient's task list would be empty.",
        })
        return out
    }

    /* Authored and never seen. It is a note rather than a refusal: somebody may
       be keeping a fourth ready to swap in. */
    if (active.length > SHOWN_ON_PHONE) {
        out.push({
            section: "metrics",
            what: `${active.length} metrics are on, and the app draws ${SHOWN_ON_PHONE}`,
            why: `A patient never sees ${active.slice(SHOWN_ON_PHONE).map(metricLabel).join(" or ")}. `
                + "Move it up, or switch it off.",
        })
    }

    /* One source twice is two tiles carrying one number. */
    const seen = new Set<MetricSource>()
    active.forEach(m => {
        if (seen.has(m.source)) out.push({
            section: "metrics",
            what: `${metricLabel(m)} is on the row twice`,
            why: "Two tiles reading one number. Take one of them off.",
        })
        seen.add(m.source)
    })

    const written = new Set(
        tasks.filter(t => t.isActive && t.signalKey).map(t => t.signalKey as string),
    )
    active.forEach(m => {
        const need = metricSpec(m.source)?.needsSignal
        if (!need || written.has(need)) return
        out.push({
            section: "metrics",
            what: `${metricLabel(m)} has nothing to read`,
            why: `It reads ${need}, and no task on this protocol writes it. The tile would `
                + "show a dash on every patient's home screen.",
        })
    })

    return out
}

// ── The hand-off to the prototype ────────────────────────────

/**
 * The row, frozen. The app needs the order, the words and the source — never a
 * value, because the value is the patient's.
 */
export function compileMetrics(list: ProtocolMetric[]) {
    return shownMetrics(list).map((m, i) => ({
        source: m.source,
        sortOrder: i,
        label: metricLabel(m),
        ...(m.labelAr?.trim() ? { labelAr: m.labelAr.trim() } : {}),
    }))
}

// ── The store ────────────────────────────────────────────────
//
// Keyed by protocol id, the shape `planStore` already uses.

type MetricMap = Record<string, ProtocolMetric[]>

let cache: MetricMap | null = null
const EMPTY: MetricMap = {}
const NONE: ProtocolMetric[] = []

function read(): MetricMap {
    if (typeof window === "undefined") return EMPTY
    if (cache) return cache
    try {
        const raw = window.localStorage.getItem(KEY)
        if (!raw) { cache = SEED; return cache }
        const parsed = JSON.parse(raw)
        cache = (parsed && typeof parsed === "object") ? (parsed as MetricMap) : SEED
    } catch {
        cache = SEED
    }
    return cache
}

const listeners = new Set<() => void>()

function write(map: MetricMap) {
    cache = map
    try { window.localStorage.setItem(KEY, JSON.stringify(map)) } catch { /* quota */ }
    listeners.forEach(fn => fn())
}

export const metricStore = {
    subscribe(fn: () => void) {
        listeners.add(fn)
        return () => { listeners.delete(fn) }
    },
    getSnapshot(): MetricMap {
        return read()
    },
    getServerSnapshot(): MetricMap {
        return EMPTY
    },
    get(protocolId: string): ProtocolMetric[] {
        return read()[protocolId] ?? NONE
    },
    save(protocolId: string, list: ProtocolMetric[]) {
        write({ ...read(), [protocolId]: list })
    },
    reset() {
        write(SEED)
    },
}

export function useProtocolMetrics(protocolId: string): ProtocolMetric[] {
    const all = useSyncExternalStore(
        metricStore.subscribe, metricStore.getSnapshot, metricStore.getServerSnapshot,
    )
    return useMemo(() => all[protocolId] ?? NONE, [all, protocolId])
}

// ── Seed ─────────────────────────────────────────────────────
//
// The three from the design, in that order. "Protocols progress" is the
// author's own wording over the source's default, which is the whole point of
// the label being editable.

const SEED: MetricMap = {
    "prot-glp1-wl": [
        { id: "m-weight", source: "weight", sortOrder: 0, isActive: true },
        {
            id: "m-progress", source: "protocol_progress", sortOrder: 1,
            labelEn: "Protocols progress", isActive: true,
        },
        { id: "m-reports", source: "latest_reports", sortOrder: 2, isActive: true },
    ],
}
