// ── The steps of an order type, authored once ────────────────
//
// WHY GLOBAL, WHEN TASKS ARE NOT. A protocol's daily asks are part of that
// protocol's clinical shape, which is why the shared Task Library was built
// and then deleted. Steps are the opposite: a blood draw runs the same
// thirteen states whichever protocol ordered it, and the words a patient reads
// while it runs are a property of the journey, not of the prescription. Two
// protocols describing one blood draw differently was a defect nothing caught.
//
// So a protocol no longer authors steps. It maps packages, in order, and the
// steps come with the type.
//
// ONE CONSEQUENCE, STATED PLAINLY. A protocol that places the same type twice
// — three GLP-1 refills — gets identical steps and identical words all three
// times. They are told apart by position and by the order's own week, and that
// is the intended reading: the same package always runs the same journey.

import { useMemo, useSyncExternalStore } from "react"
import { newClause, newStep } from "@/lib/protocol-assembly"
import type { Step, TypeId } from "@/lib/protocol-assembly"

const KEY = "valeo_cms_step_mapping_v1"

export type StepMap = Partial<Record<TypeId, Step[]>>

/**
 * A CACHED SNAPSHOT, because `useSyncExternalStore` compares by identity. A
 * `read()` that parsed the JSON on every call would return a new object every
 * time and re-render for ever.
 */
let cache: StepMap | null = null
const EMPTY: StepMap = {}
const NONE: Step[] = []

/* ── THE SEED ──
   Lifted from the demo protocol, so the screen opens on a worked example
   rather than four empty cards. An author reading it learns the shape — a
   handful of steps per journey, not one per state — faster than any hint
   could teach it.

   `newStep`/`newClause` mint the ids, so the seed carries no hand-written
   ones and cannot collide with a step added later. */
const step = (title: string, completes: string[], starts: string[] = []): Step => ({
    ...newStep(title),
    starts: { clauses: starts.map((x, i) => newClause(x, i ? "and" : undefined)) },
    completes: { clauses: completes.map((x, i) => newClause(x, i ? "or" : undefined)) },
})

const SEED: StepMap = {
    blood: [
        step("Book your blood test", ["HOMECARE_ASSIGNED", "LAB_ASSIGNED"]),
        step("Your nurse visit", ["SAMPLE_COLLECTED"]),
        step("Your results are ready", ["RESULTS_UPLOADED"]),
        step("Your coach reads them", ["COACH_REVIEWED"]),
    ],
    supplement: [
        step("On its way", ["SHIPPED"]),
        step("Delivered", ["DELIVERED"]),
    ],
    medicine: [
        step("Prescription check", ["RX_APPROVED"]),
        step("On its way", ["SHIPPED"]),
        step("Delivered", ["DELIVERED"]),
    ],
    consultation: [
        step("Book your call", ["SCHEDULED"]),
        step("Your call", ["NOTES_UPLOADED"]),
    ],
}

function read(): StepMap {
    if (typeof window === "undefined") return EMPTY
    if (cache) return cache
    try {
        const raw = window.localStorage.getItem(KEY)
        if (!raw) { cache = SEED; return cache }
        const parsed = JSON.parse(raw)
        cache = (parsed && typeof parsed === "object") ? (parsed as StepMap) : SEED
    } catch {
        cache = SEED
    }
    return cache
}

const listeners = new Set<() => void>()

function write(map: StepMap) {
    cache = map
    try { window.localStorage.setItem(KEY, JSON.stringify(map)) } catch { /* quota */ }
    listeners.forEach(fn => fn())
}

export const stepMapStore = {
    subscribe(fn: () => void) {
        listeners.add(fn)
        return () => { listeners.delete(fn) }
    },
    getSnapshot(): StepMap { return read() },
    getServerSnapshot(): StepMap { return EMPTY },
    get(type: TypeId): Step[] { return read()[type] ?? NONE },
    save(type: TypeId, steps: Step[]) {
        write({ ...read(), [type]: steps })
    },
    reset() { write(SEED) },
}

/** Every type's steps. The protocol screen needs the whole map at once. */
export function useStepMap(): StepMap {
    return useSyncExternalStore(
        stepMapStore.subscribe, stepMapStore.getSnapshot, stepMapStore.getServerSnapshot,
    )
}

/** One type's steps, for the editor. */
export function useTypeSteps(type: TypeId): Step[] {
    const all = useStepMap()
    return useMemo(() => all[type] ?? NONE, [all, type])
}
