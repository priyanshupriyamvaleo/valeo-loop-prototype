// ── A protocol's daily tasks ──────────────────────────────────
//
// THE SMALL REPEATED ACTS a patient does after buying: take the pen, log a
// meal, weigh in, score the pain. Not steps.
//
// A STEP MOVES THE PATIENT FORWARD. A TASK ONLY RECORDS SOMETHING. So a task
// never unlocks a step, and that is enforced by the shape rather than by this
// comment: `ProtocolTask` has no `produces` field, and `chainFindings` only
// ever reads `ProtocolStep.produces`.
//
// THERE IS NO TIME IN HERE EITHER. A task rule cannot say "after day 30", for
// the same reason a step cannot: the patient starts when they buy, and every
// step takes as long as it takes.
//
// So a task's life has two ends, and each one names an output some STEP
// produces — the same closed vocabulary the chain already uses:
//
//   SHOWS AFTER   absent, or a `delivery` from a `medication` step
//   HIDES AFTER   absent, an output the same way, or the end of the protocol
//
// THE STEP TYPE IS NOT DECORATION. In `prot-glp1-wl`, step 6 issues a
// supplement voucher and step 7 dispatches the pen. Both put goods in the
// patient's hands, so `delivery` alone would start "Take your medication" one
// step early, against a voucher.
//
// AND THE GATE PROVES ITSELF. `proveGate` names the step that satisfies it, so
// the board reads "step 7 · Month 1 dispatched" rather than "delivery", and a
// gate nothing can satisfy is a refusal instead of a task that never appears.
// That is `chainFindings` for tasks, and it needs no dates.

import { useMemo, useSyncExternalStore } from "react"
import { ALL_PATHS, pathsOf, resolveProtocol } from "@/lib/protocol-chain"
import type { PlanGap } from "@/lib/protocol-plans"
import type {
    Protocol, ProtocolStep, ProtocolStepType, ProtocolTask, ProtocolTaskGate,
    TaskCapture, TaskIcon, TaskReset,
} from "@/types"

const KEY = "valeo_cms_protocol_tasks_v1"

// ── Vocabularies, with the words an author reads ─────────────

export const CAPTURES: { id: TaskCapture; label: string; blurb: string }[] = [
    { id: "tick", label: "Ticks it off", blurb: "Done or not done. A walk works this way." },
    { id: "number", label: "Records a number", blurb: "One figure, with a unit. A weight works this way." },
    { id: "entry", label: "Adds entries", blurb: "A list, so the count matters. A meal log works this way." },
    { id: "scale", label: "Scores it", blurb: "A figure between two bounds. Pain, 0 to 10." },
]

export const RESETS: { id: TaskReset; label: string; blurb: string }[] = [
    { id: "daily", label: "Every day", blurb: "The tick clears overnight and it is asked again." },
    { id: "weekly", label: "Every week", blurb: "Once a week is enough. It clears at the week's end." },
    { id: "never", label: "Once", blurb: "It is asked once. The tick stays for good." },
]

/**
 * A CLOSED LIST, because the app draws from a fixed icon set. A free-text icon
 * would look identical in this builder and render as an empty box on a phone.
 */
export const TASK_ICONS: { id: TaskIcon; label: string; blurb: string }[] = [
    { id: "pill", label: "Pill", blurb: "Medicine, a pen, a supplement." },
    { id: "meal", label: "Meal", blurb: "Food and drink." },
    { id: "scale", label: "Scale", blurb: "A weight or a measurement." },
    { id: "walk", label: "Walk", blurb: "Movement and exercise." },
    { id: "drop", label: "Drop", blurb: "Water, and anything taken by volume." },
    { id: "note", label: "Note", blurb: "Anything written down." },
    { id: "heart", label: "Heart", blurb: "How somebody feels, and vital signs." },
]

/** The step kinds, with the words an author reads beside a gate. */
export const STEP_TYPES: { id: ProtocolStepType; label: string }[] = [
    { id: "consultation", label: "a consultation step" },
    { id: "lab_test", label: "a lab step" },
    { id: "medication", label: "a medication step" },
    { id: "lifestyle", label: "a lifestyle step" },
    { id: "follow_up", label: "a follow-up step" },
]

export const captureLabel = (c: TaskCapture) =>
    CAPTURES.find(x => x.id === c)?.label ?? c
export const resetLabel = (r: TaskReset) =>
    RESETS.find(x => x.id === r)?.label ?? r
export const stepTypeLabel = (t: ProtocolStepType) =>
    STEP_TYPES.find(x => x.id === t)?.label ?? t

/** A capture that carries a unit and bounds. The drawer hides those fields otherwise. */
export const takesUnit = (c: TaskCapture) => c === "number" || c === "scale"

/** A task key is what the app reads. Lower case, and it uses underscores. */
export function toTaskKey(v: string) {
    return v.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
}

const rid = () => Math.random().toString(36).slice(2, 9)

export function emptyTask(sortOrder: number): ProtocolTask {
    return {
        id: `t-${rid()}`,
        key: "",
        sortOrder,
        titleEn: "", titleAr: "",
        subtitleEn: "", subtitleAr: "",
        icon: "note",
        capture: "tick",
        resets: "daily",
        coachMayRecommend: false,
        isActive: true,
    }
}

// ── The proof ────────────────────────────────────────────────

export interface GateProof {
    stepId: string
    /** 0-based, as the resolved steps are. The label prints it 1-based. */
    order: number
    titleEn: string
    /** "step 7 · Month 1 dispatched" */
    label: string
}

/**
 * The step that satisfies a gate. The FIRST one, by order.
 *
 * First rather than last, deliberately. "Take your medication" starts when
 * month 1 arrives, not when month 3 does. An output produced more than once
 * cannot distinguish the two ends, and where a task genuinely needs the last
 * one — returning a sharps bin, say — `hidesAfter: "protocol_ends"` says it
 * without a second field. Nobody has asked for more.
 */
export function proveGate(
    gate: ProtocolTaskGate, steps: ProtocolStep[],
): GateProof | null {
    const at = [...steps]
        .sort((a, b) => a.order - b.order)
        .find(s => s.produces === gate.needs
            && (!gate.fromType || s.type === gate.fromType))
    if (!at) return null
    return {
        stepId: at.id,
        order: at.order,
        titleEn: at.titleEn,
        label: `step ${at.order + 1} · ${at.titleEn || "an untitled step"}`,
    }
}

/** A gate in words, for the line under the proof. */
export function gateWords(gate: ProtocolTaskGate): string {
    const out = gate.needs === "prescription" ? "a prescription"
        : gate.needs === "assessment" ? "an assessment"
        : `a ${gate.needs}`
    return gate.fromType ? `${out} from ${stepTypeLabel(gate.fromType)}` : `${out} from any step`
}

// ── The resolver ─────────────────────────────────────────────

export interface ResolvedTask {
    task: ProtocolTask
    /** Null where the task has no `showsAfter`, so it shows from the day they buy. */
    showsProof: GateProof | null
    /** True where a `showsAfter` exists and NO step satisfies it. The refusal case. */
    showsBroken: boolean
    hidesProof: GateProof | null
    hidesBroken: boolean
    hidesAtEnd: boolean
    /** Whether the patient sees it on the day they buy. */
    onDayOne: boolean
}

/**
 * Every task with its two proofs, on ONE path.
 *
 * It resolves the protocol first, so this works on a plain linear step list
 * and never learns that variants exist — the same contract every other screen
 * downstream of `resolveProtocol` keeps.
 */
export function resolveTasks(
    tasks: ProtocolTask[], protocol: Protocol, pathId?: string,
): ResolvedTask[] {
    const path = pathId ?? ALL_PATHS
    const steps = resolveProtocol(protocol, path).steps

    return [...tasks]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .filter(t => !t.appliesTo?.length || path === ALL_PATHS || t.appliesTo.includes(path))
        .map(task => {
            const showsProof = task.showsAfter ? proveGate(task.showsAfter, steps) : null
            const showsBroken = !!task.showsAfter && !showsProof

            const hidesAtEnd = task.hidesAfter === "protocol_ends"
            const hidesGate = !hidesAtEnd && task.hidesAfter
                ? (task.hidesAfter as ProtocolTaskGate) : null
            const hidesProof = hidesGate ? proveGate(hidesGate, steps) : null
            const hidesBroken = !!hidesGate && !hidesProof

            return {
                task, showsProof, showsBroken, hidesProof, hidesBroken, hidesAtEnd,
                onDayOne: !task.showsAfter,
            }
        })
}

/** How many tasks a patient sees on the day they buy, on this path. */
export const dayOneCount = (rows: ResolvedTask[]) =>
    rows.filter(r => r.onDayOne).length

// ── The refusals ─────────────────────────────────────────────

const empty = (v?: string) => !v || !v.trim()

/**
 * What stops one task going live. It is a separate function so the drawer can
 * show a task's own faults without the whole board's.
 */
export function taskGaps(t: ProtocolTask, siblings: ProtocolTask[]): PlanGap[] {
    const out: PlanGap[] = []

    if (empty(t.titleEn)) out.push({
        section: "tasks", blocksDraft: true,
        what: "The task has no name",
        why: "It is the line the patient reads, and the line this list shows.",
    })

    if (empty(t.key)) out.push({
        section: "tasks", blocksDraft: true,
        what: "The task has no key",
        why: "The app stores every reading against the key. Without one nothing can be logged.",
    })

    if (t.key && siblings.some(x => x.id !== t.id && x.key === t.key)) out.push({
        section: "tasks", blocksDraft: true,
        what: `Another task on this protocol already uses the key ${t.key}`,
        why: "Two tasks on one key share one log series, so neither reading can be read back.",
    })

    if (takesUnit(t.capture) && empty(t.unit)) out.push({
        section: "tasks",
        what: `${t.titleEn || "A number"} has no unit`,
        why: "\"78\" on its own is not a weight. The unit is shown beside the figure.",
    })

    if (takesUnit(t.capture) && t.min != null && t.max != null && t.min >= t.max) out.push({
        section: "tasks",
        what: `${t.titleEn || "A task"}: the least is not below the most`,
        why: `The patient could enter nothing between ${t.min} and ${t.max}.`,
    })

    return out
}

/**
 * What stops a board going live.
 *
 * CHECKED ON EVERY PATH, the way the Step Builder checks the chain. A step
 * some values skip changes what every task can be gated on, so a board that is
 * sound for a man can be broken for a woman.
 *
 * The third rule is the one `chainFindings` taught: the thing exists, and it
 * exists too late. A task that appears and disappears at the same step was
 * never on screen at all.
 */
export function boardGaps(
    tasks: ProtocolTask[], protocol: Protocol, otherBoards?: Record<string, ProtocolTask[]>,
): PlanGap[] {
    const out: PlanGap[] = []
    const paths = pathsOf(protocol)

    if (!tasks.length) {
        out.push({
            section: "tasks", blocksDraft: true,
            what: "The protocol has no daily task",
            why: "The patient's home screen would carry an empty card.",
        })
        return out
    }

    tasks.forEach(t => out.push(...taskGaps(t, tasks)))

    /* Two tasks writing one series. Both counters land on one key, so neither
       reading can be read back. */
    const seen = new Map<string, string>()
    tasks.forEach(t => {
        if (!t.signalKey) return
        const first = seen.get(t.signalKey)
        if (first && first !== t.titleEn) out.push({
            section: "tasks",
            what: `${first} and ${t.titleEn} both write ${t.signalKey}`,
            why: "Two rows logging one number. Neither reading can be read back on its own.",
        })
        if (!first) seen.set(t.signalKey, t.titleEn)
    })

    /**
     * THE COST OF AUTHORING PER PROTOCOL, made visible.
     *
     * The key is the name the app stores every reading against. Typed per
     * protocol, two protocols can call one reading by two names, and a patient
     * who moves protocol then has two series where they should have one. This
     * is a NOTE and not a refusal: sometimes two protocols genuinely mean
     * different things by the same word, and only a person can tell.
     */
    if (otherBoards) {
        tasks.forEach(t => {
            if (!t.key) return
            Object.entries(otherBoards).forEach(([id, rows]) => {
                if (id === protocol.id) return
                const clash = rows.find(x => x.key === t.key && x.titleEn !== t.titleEn)
                if (clash) out.push({
                    section: "tasks",
                    what: `Another protocol uses the key ${t.key} for "${clash.titleEn}"`,
                    why: "One key, two meanings. A patient on both protocols gets one muddled "
                        + "series. Rename one, or leave it if they really are the same reading.",
                })
            })
        })
    }

    paths.forEach(p => {
        const rows = resolveTasks(tasks, protocol, p.id)
        const where = paths.length > 1 ? ` on the ${p.label.toLowerCase()} path` : ""

        rows.forEach(r => {
            const name = r.task.titleEn || r.task.key || "A task"

            if (r.showsBroken && r.task.showsAfter) out.push({
                section: "tasks", blocksDraft: true,
                what: `${name} can never appear${where}`,
                why: `It waits for ${gateWords(r.task.showsAfter)}, and no step produces one.`,
            })

            if (r.hidesBroken && r.task.hidesAfter && r.task.hidesAfter !== "protocol_ends") out.push({
                section: "tasks",
                what: `${name} can never go away${where}`,
                why: `It ends on ${gateWords(r.task.hidesAfter)}, and no step produces one.`,
            })

            if (r.showsProof && r.hidesProof && r.hidesProof.order <= r.showsProof.order) out.push({
                section: "tasks", blocksDraft: true,
                what: `${name} appears and disappears at the same point${where}`,
                why: `It shows after ${r.showsProof.label} and hides after ${r.hidesProof.label}, `
                    + "so the patient never sees it.",
            })
        })

        if (!dayOneCount(rows)) out.push({
            section: "tasks",
            what: `Nothing is on the card on day one${where}`,
            why: `Every task is gated. The first one arrives at ${
                rows.map(r => r.showsProof?.label).find(Boolean) ?? "a step that does not exist"}.`,
        })
    })

    return out
}

// ── The hand-off to the prototype ────────────────────────────

/**
 * THE BOARD, FROZEN AGAINST THE STEPS.
 *
 * The prototype that runs the coach panel and the phone has no
 * `produces`/`requires` on its steps — its builder refused such flags on
 * purpose — and its patient record holds `done`, an array of STEP IDS. So a
 * gate reaches it as the step that satisfies it, and the test there is
 * `done.includes(stepId)`. It never learns the word "delivery".
 *
 * This is not a second model. The CMS has to evaluate the gate anyway, to
 * print the proof and to refuse a broken one. This freezes that result.
 *
 * IT IS COPIED BY HAND, and that is honest. The two apps are separate, with
 * separate stores, holding genuinely different protocols, so no id
 * correspondence exists to automate. A button and a paste says so; a pipe
 * would pretend.
 */
export function compileTaskBoard(tasks: ProtocolTask[], protocol: Protocol) {
    const freeze = (g?: ProtocolTaskGate | "protocol_ends", steps?: ProtocolStep[]) => {
        if (!g) return null
        if (g === "protocol_ends") return "protocol_ends"
        const p = steps ? proveGate(g, steps) : null
        return p ? { stepId: p.stepId, order: p.order, titleEn: p.titleEn } : null
    }

    return {
        protocol: protocol.code,
        compiledAt: new Date().toISOString(),
        paths: pathsOf(protocol).map(p => {
            const steps = resolveProtocol(protocol, p.id).steps
            return {
                path: p.id,
                tasks: resolveTasks(tasks, protocol, p.id).map(r => ({
                    key: r.task.key,
                    sortOrder: r.task.sortOrder,
                    t: r.task.titleEn,
                    sub: r.task.subtitleEn,
                    icon: r.task.icon,
                    capture: r.task.capture,
                    ...(r.task.unit ? { unit: r.task.unit } : {}),
                    ...(r.task.min != null ? { min: r.task.min } : {}),
                    ...(r.task.max != null ? { max: r.task.max } : {}),
                    resets: r.task.resets,
                    ...(r.task.signalKey ? { signalKey: r.task.signalKey } : {}),
                    coachMayRecommend: r.task.coachMayRecommend,
                    showsAfter: freeze(r.task.showsAfter, steps),
                    hidesAfter: freeze(r.task.hidesAfter, steps),
                })),
            }
        }),
    }
}

// ── The store ────────────────────────────────────────────────
//
// Keyed by protocol id, the shape `planStore` already uses. Same reasons: the
// snapshot is cached because useSyncExternalStore compares by reference, and
// the server has no localStorage so it gets one stable empty map.

type TaskMap = Record<string, ProtocolTask[]>

let cache: TaskMap | null = null
const EMPTY: TaskMap = {}
const NO_TASKS: ProtocolTask[] = []

function read(): TaskMap {
    if (typeof window === "undefined") return EMPTY
    if (cache) return cache
    try {
        const raw = window.localStorage.getItem(KEY)
        if (!raw) { cache = SEED; return cache }
        const parsed = JSON.parse(raw)
        cache = (parsed && typeof parsed === "object") ? (parsed as TaskMap) : SEED
    } catch {
        cache = SEED
    }
    return cache
}

const listeners = new Set<() => void>()

function write(map: TaskMap) {
    cache = map
    try { window.localStorage.setItem(KEY, JSON.stringify(map)) } catch { /* quota */ }
    listeners.forEach(fn => fn())
}

export const taskStore = {
    subscribe(fn: () => void) {
        listeners.add(fn)
        return () => { listeners.delete(fn) }
    },
    getSnapshot(): TaskMap {
        return read()
    },
    getServerSnapshot(): TaskMap {
        return EMPTY
    },
    get(protocolId: string): ProtocolTask[] {
        return read()[protocolId] ?? NO_TASKS
    },
    save(protocolId: string, tasks: ProtocolTask[]) {
        write({ ...read(), [protocolId]: tasks })
    },
    remove(protocolId: string) {
        const next = { ...read() }
        delete next[protocolId]
        write(next)
    },
    reset() {
        write(SEED)
    },
}

export function useProtocolTasks(protocolId: string): ProtocolTask[] {
    const all = useSyncExternalStore(
        taskStore.subscribe, taskStore.getSnapshot, taskStore.getServerSnapshot,
    )
    return useMemo(() => all[protocolId] ?? NO_TASKS, [all, protocolId])
}

export function useAllTasks(): TaskMap {
    return useSyncExternalStore(
        taskStore.subscribe, taskStore.getSnapshot, taskStore.getServerSnapshot,
    )
}

/**
 * True only after hydration. localStorage does not exist on the server, so the
 * first client render has to match the server HTML: a screen that reads the
 * store renders its waiting state until this turns true. Read as external
 * state, so it never sets state inside an effect.
 */
const noopSubscribe = () => () => {}
export function useHydrated(): boolean {
    return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

// ── Seed ─────────────────────────────────────────────────────
//
// The GLP-1 protocol's five tasks, each carrying its own words and its own
// gates.
//
// THE LAST ONE IS DELIBERATELY WRONG. It waits for a report from a
// consultation step, and the only report on either path comes from step 3,
// which is a lab step. It is here so the refusal is visible on a first visit
// rather than something you have to break the board to see.

const SEED: TaskMap = {
    "prot-glp1-wl": [
        {
            id: "t-med", key: "take_medication", sortOrder: 0,
            titleEn: "Take your medication", titleAr: "تناول دواءك",
            subtitleEn: "Tick it once you have taken today's dose",
            subtitleAr: "ضع علامة بعد تناول جرعة اليوم",
            icon: "pill", capture: "tick", resets: "daily",
            signalKey: "medication_taken",
            coachMayRecommend: false, isActive: true,
            showsAfter: { needs: "delivery", fromType: "medication" },
            hidesAfter: "protocol_ends",
        },
        {
            id: "t-meals", key: "log_meals", sortOrder: 1,
            titleEn: "Log your meals", titleAr: "سجل وجباتك",
            subtitleEn: "Track your nutrition today", subtitleAr: "تابع تغذيتك اليوم",
            icon: "meal", capture: "entry", resets: "daily",
            signalKey: "meals_logged",
            coachMayRecommend: false, isActive: true,
        },
        {
            id: "t-weight", key: "record_weight", sortOrder: 2,
            titleEn: "Record your weight", titleAr: "سجل وزنك",
            subtitleEn: "A quick update goes a long way", subtitleAr: "تحديث سريع يفيد كثيرًا",
            icon: "scale", capture: "number", unit: "kg", min: 30, max: 300,
            resets: "daily",
            /* The onboarding chat already asks for this under the same name, so
               signup and every daily reading land in one series. That series is
               what draws "78 kg, down 6.5 kg since 1 March" on the phone. */
            signalKey: "weight_kg",
            coachMayRecommend: false, isActive: true,
        },
        {
            id: "t-fast", key: "fast_before_draw", sortOrder: 3,
            titleEn: "Fast for 10 hours", titleAr: "امتنع عن الطعام 10 ساعات",
            subtitleEn: "Water is fine. No food before the draw.",
            subtitleAr: "الماء مسموح. لا طعام قبل سحب الدم.",
            icon: "note", capture: "tick", resets: "never",
            coachMayRecommend: false, isActive: true,
            showsAfter: { needs: "booking" },
            hidesAfter: { needs: "sample" },
        },
        {
            id: "t-feel", key: "log_symptoms", sortOrder: 4,
            titleEn: "Log how you feel", titleAr: "سجل شعورك",
            subtitleEn: "Pain and capacity, 0 to 10", subtitleAr: "الألم والقدرة، من 0 إلى 10",
            icon: "heart", capture: "scale", unit: "score", min: 0, max: 10,
            resets: "daily",
            signalKey: "pain_score",
            coachMayRecommend: true, isActive: true,
            showsAfter: { needs: "report", fromType: "consultation" },
        },
    ],
}
