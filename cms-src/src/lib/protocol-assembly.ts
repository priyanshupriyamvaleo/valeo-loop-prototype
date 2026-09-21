/**
 * ASSEMBLING A PROTOCOL FROM ORDER TYPES.
 *
 * A protocol is not a seventh order type. It is a BUNDLE — a parent order that
 * fans out into child orders of the other five types. The fulfilment model
 * already says so:
 *
 *     Bundle · "A parent wrapper that fans out into child orders"
 *     Built? NO — stages defined, nothing runs them.
 *
 * So the author does not write steps. The author picks the child orders, and
 * every internal state of each child order becomes a step. The copy is then
 * written on those steps.
 *
 * ── WHERE THIS COMES FROM, AND WHAT IS STILL TRUE TODAY ────────────────────
 *
 * This file mirrors the TARGET model: six fulfilment journeys, ten customer
 * phases, the internal states beneath them. The source says plainly that the
 * model is built in OrderService and SWITCHED OFF in every environment, and
 * that live orders still run on the legacy single-status field.
 *
 * The legacy field is mirrored separately in `protocol-runtime.ts`, with its
 * own provenance from the admin panel. Neither file replaces the other:
 *   · protocol-runtime.ts  — what production runs TODAY
 *   · protocol-assembly.ts — what a protocol will run on
 *
 * Nothing here is invented. Where the source and my count disagree, or where
 * the source contradicts itself, it is recorded in OPEN_QUESTIONS below rather
 * than quietly corrected.
 */

import { pricedUnitsOf } from "@/lib/composition"
import type { Listing, PricedUnitRef } from "@/types"

/* ─────────────────────────── The ten customer phases ─────────────────────── */

export type PhaseId =
    | "scheduling" | "assigned" | "in_progress" | "handoff" | "processing"
    | "completing" | "completed" | "failed" | "cancelled" | "rescheduled"

/**
 * TWO LEVELS, and this is the whole reason the model exists. Ops needs to know
 * which lab and which nurse. A patient needs a sense of progress. So every
 * internal state rolls up into one of ten phases.
 */
export const PHASES: { id: PhaseId; label: string; blurb: string }[] = [
    { id: "scheduling", label: "Scheduling", blurb: "Booking taken, waiting on a slot, a lab, or a warehouse sync" },
    { id: "assigned", label: "Assigned", blurb: "A nurse, professional or coach is locked in" },
    { id: "in_progress", label: "In progress", blurb: "Someone is travelling, picking stock, or mid-session" },
    { id: "handoff", label: "Handoff", blurb: "Passing to the next party — to the lab, to the courier" },
    { id: "processing", label: "Processing", blurb: "Out of our hands: lab testing, delivery hub" },
    { id: "completing", label: "Completing", blurb: "Last steps — results up, notes filed, on the van" },
    { id: "completed", label: "Completed", blurb: "Delivered or done" },
    { id: "failed", label: "Failed", blurb: "Returned, or a prescription was rejected" },
    { id: "cancelled", label: "Cancelled", blurb: "Stopped before completion" },
    { id: "rescheduled", label: "Rescheduled", blurb: "Closed out and replaced by a fresh booking" },
]

export const phase = (id: PhaseId) => PHASES.find(p => p.id === id)!

/* ──────────────────────────────── One stage ──────────────────────────────── */

/**
 * WHO REPORTS IT. Three answers, and they are not alike.
 *
 * `order`  — the fulfilment system reports it about a child order.
 * `user`   — the patient did something, on the account, payment or app.
 * `coach`  — a coach or doctor did something, and NO ORDER REPORTS IT.
 * `system` — the protocol service itself moves the step on.
 *
 * A coach can also move an order status: COACH_REVIEWED and NOTES_UPLOADED are
 * a coach's work, and they stay `order` because the order carries them. The
 * kind answers where the signal comes FROM, not who did the work.
 */
export type SignalKind = "order" | "user" | "coach" | "system"

export interface Stage {
    /** The internal state name. Ops, CS and engineering all use this word. */
    state: string
    /** Absent means `order`, which is nearly all of them. */
    kind?: Exclude<SignalKind, "order">
    /** What a customer would be shown. Empty on a state no customer sees. */
    label: string
    phase: PhaseId
    /** Who or what moves the order to this state. */
    trigger: string
    /** False = the source marks it Internal. The customer never sees it. */
    seen: boolean
    optional?: boolean
    /** Nothing follows it. The order is closed here. */
    terminal?: boolean
    /** Off the straight path: a gate at the front, or a failure branch. */
    branch?: "gate" | "failure"
    /** A failure state the order can come back from, and to which state. */
    retryTo?: string
    /** Anything the source says about this state that an author must know. */
    note?: string
}

/* ───────────────────────────── The six journeys ──────────────────────────── */

export type TypeId =
    | "blood" | "supplement" | "medicine" | "home_service" | "consultation" | "bundle"

export interface FulfilmentType {
    id: TypeId
    label: string
    fulfils: string
    products: string
    movedBy: string
    /** Does anything run this journey today? Bundle is the one that does not. */
    built: boolean
    /** The stage count the source states. Compare it with stages.length. */
    claimedStages: number
    startsAt: string
    blurb: string
    /**
     * Can the order jump a state? Blood, home service and consultation enforce
     * every step, because a person physically does each one. Supplement and
     * medicine allow jumps, because we poll the warehouse and read snapshots.
     *
     * THIS IS NOT A DETAIL. A step gated on a skippable state may never fire.
     */
    skips: boolean
    /**
     * Does this type come round again in one protocol? A refill ships monthly
     * and a coach reviews at intervals, so those carry a due week. A baseline
     * blood panel and a home visit happen once, and asking for a week there
     * would be asking an author to invent a fact — see `Block.week`.
     */
    repeats?: boolean
    stages: Stage[]
}

/** The delivery tail. One warehouse integration serves supplement and medicine. */
const DELIVERY_TAIL: Stage[] = [
    /* A USER ACTION SCOPED TO ONE JOURNEY, not to the whole protocol. Both
       warehouse orders carry it, because both put a document in front of the
       patient before anything is picked. It sits here rather than in
       USER_ACTIONS so it stays off a blood or consultation order, and so a
       protocol with two medicine orders can watch each one separately.

       Nothing records it today, the same gap as REPORT_VIEWED. */
    { state: "RX_VIEWED", kind: "user", label: "User viewed Rx", phase: "scheduling", trigger: "NOTHING RECORDS THIS TODAY", seen: true },

    { state: "ORDER_SYNCED", label: "Order Placed", phase: "scheduling", trigger: "Order lands in the warehouse", seen: true },
    { state: "PICKING", label: "Processing", phase: "processing", trigger: "Warehouse picks the items", seen: true },
    { state: "PACKED", label: "Processing", phase: "processing", trigger: "Warehouse packs the parcel", seen: true },
    { state: "SHIPPED", label: "Shipped", phase: "completing", trigger: "Handed to the courier", seen: true },
    { state: "AT_DELIVERY_HUB", label: "Shipped", phase: "completing", trigger: "Courier hub scan", seen: true },
    { state: "OUT_FOR_DELIVERY", label: "Out for Delivery", phase: "completing", trigger: "On the van", seen: true },
    { state: "DELIVERED", label: "Delivered", phase: "completed", trigger: "Courier confirms handover", seen: true, terminal: true },
]

/** The same failure path on both warehouse journeys. */
const DELIVERY_FAILURE: Stage[] = [
    {
        state: "DELIVERY_ATTEMPTED", label: "Delivery Failed", phase: "failed",
        trigger: "Courier", seen: true, branch: "failure", retryTo: "OUT_FOR_DELIVERY",
        note: "The only state in the whole model that can go back. It returns to Out for Delivery.",
    },
    {
        state: "RETURN_INITIATED", label: "Return in Progress", phase: "failed",
        trigger: "Ops or courier gives up on delivery", seen: true, branch: "failure",
        note: "Counts as closed, so ops cannot cancel out of it — even with one step left to run.",
    },
    {
        state: "RETURNED", label: "Returned", phase: "failed",
        trigger: "Parcel back at the warehouse", seen: true, terminal: true, branch: "failure",
    },
]

export const TYPES: FulfilmentType[] = [
    {
        id: "blood", label: "Blood",
        fulfils: "Home blood draw, lab testing, coach-reviewed results",
        products: "Blood packages, lab custom packages",
        movedBy: "Ops, nurse app, labs, coach",
        built: true, claimedStages: 12, startsAt: "Booking Confirmed", skips: false,
        blurb: "The longest journey, because four parties touch it in sequence. Ops books the "
            + "homecare centre and the lab. A nurse collects the sample. The lab processes it. "
            + "A coach reviews the results before the order closes.",
        stages: [
            { state: "SCHEDULED", label: "Booking Confirmed", phase: "scheduling", trigger: "Customer books a slot", seen: true },
            { state: "HOMECARE_ASSIGNED", label: "Booking Confirmed", phase: "scheduling", trigger: "Ops picks the homecare centre", seen: false },
            { state: "LAB_ASSIGNED", label: "Booking Confirmed", phase: "scheduling", trigger: "Ops confirms the lab", seen: false, note: "The order is enforced: no lab before a homecare centre, no nurse before a lab." },
            { state: "PROFESSIONAL_ASSIGNED", label: "Nurse Assigned", phase: "assigned", trigger: "Homecare centre assigns a nurse", seen: true, note: "A nurse can be reassigned at this state." },
            { state: "ARRIVED_AT_LOCATION", label: "Nurse On The Way", phase: "in_progress", trigger: "Nurse app", seen: true, note: "The label and the state disagree. Home service uses IN_TRANSIT for On The Way and ARRIVED_AT_LOCATION for Arrived. Blood has no IN_TRANSIT." },
            { state: "SAMPLE_COLLECTED", label: "Sample Collected", phase: "in_progress", trigger: "Nurse app", seen: true },
            { state: "IN_TRANSIT_TO_LAB", label: "On Way to Lab", phase: "handoff", trigger: "Nurse hands the sample to transport", seen: true },
            { state: "LAB_RECEIVED", label: "At Laboratory", phase: "processing", trigger: "Lab acknowledges the sample", seen: true },
            { state: "REPORT_READY", label: "Processing Results", phase: "processing", trigger: "Lab finishes testing", seen: false },
            { state: "PARTIAL_RESULTS_UPLOADED", label: "Processing Results", phase: "processing", trigger: "Lab returns some panels early", seen: false, optional: true },
            { state: "RESULTS_UPLOADED", label: "Results Ready", phase: "completing", trigger: "System publishes the report to the app", seen: true },
            { state: "COACH_REVIEWED", label: "Review Complete", phase: "completing", trigger: "Coach reviews and annotates", seen: true },
            { state: "COMPLETED", label: "Order Complete", phase: "completed", trigger: "System closes the order", seen: true, terminal: true, note: "On a draw split across several labs the customer sees the slowest lab, and the order completes only when every lab is in." },
        ],
    },
    {
        id: "supplement", label: "Supplement",
        fulfils: "Supplements picked, packed and delivered from the warehouse",
        products: "Supplement SKUs",
        movedBy: "Unicommerce warehouse feed",
        built: true, claimedStages: 9, startsAt: "Order Placed", skips: true, repeats: true,
        blurb: "Driven entirely by the Unicommerce warehouse feed, which we poll. We see only "
            + "whatever status the warehouse reports at poll time, so states can be skipped. An "
            + "order can jump from Order Placed straight to Shipped.",
        stages: [...DELIVERY_TAIL, ...DELIVERY_FAILURE],
    },
    {
        id: "medicine", label: "Medicine",
        fulfils: "Prescription-gated medicines, then the same delivery path",
        products: "Prescription medicine SKUs",
        movedBy: "Pharmacist, then Unicommerce",
        built: true, claimedStages: 13, startsAt: "Prescription Under Review", skips: true, repeats: true,
        blurb: "A prescription gate in front of the supplement journey. Until a pharmacist "
            + "approves, the item is held at the warehouse and we get no status back at all. "
            + "After approval the two journeys are identical.",
        stages: [
            { state: "PRESCRIPTION_PENDING", label: "Prescription Under Review", phase: "scheduling", trigger: "Customer uploads a prescription", seen: true, branch: "gate", note: "While the gate is shut the warehouse holds the item and reports nothing." },
            { state: "RX_APPROVED", label: "Prescription Approved", phase: "scheduling", trigger: "Pharmacist approves — warehouse hold released", seen: true, branch: "gate" },
            { state: "RX_REJECTED", label: "Prescription Rejected", phase: "failed", trigger: "Pharmacist rejects", seen: true, terminal: true, branch: "gate", note: "The order ends here. A protocol that depends on this medicine stops with it." },
            ...DELIVERY_TAIL, ...DELIVERY_FAILURE,
        ],
    },
    {
        id: "home_service", label: "Home service",
        fulfils: "IV drips, injections, vaccines, physio, babysitting",
        products: "IV, Injection, Vaccines, Physio, Babysitter",
        movedBy: "Ops, nurse and professional app",
        built: true, claimedStages: 6, startsAt: "Booking Confirmed", skips: false,
        blurb: "A nurse visit with no lab and no sample. The professional arrives, performs the "
            + "service and closes it on the spot. It shares its first states with blood, which is "
            + "why the two are easy to confuse.",
        stages: [
            { state: "SCHEDULED", label: "Booking Confirmed", phase: "scheduling", trigger: "Customer books a slot", seen: true },
            { state: "PROFESSIONAL_ASSIGNED", label: "Professional Assigned", phase: "assigned", trigger: "Ops assigns — no lab gate to clear first", seen: true },
            { state: "IN_TRANSIT", label: "On The Way", phase: "in_progress", trigger: "Professional sets off", seen: true },
            { state: "ARRIVED_AT_LOCATION", label: "Professional Arrived", phase: "in_progress", trigger: "Professional app", seen: true },
            { state: "SERVICE_IN_PROGRESS", label: "Service In Progress", phase: "in_progress", trigger: "Professional starts the service", seen: true },
            { state: "COMPLETED", label: "Service Complete", phase: "completed", trigger: "Professional ends the service", seen: true, terminal: true },
        ],
    },
    {
        id: "consultation", label: "Consultation",
        fulfils: "Coach and paid doctor sessions",
        products: "Coach packages, paid doctor consultations",
        movedBy: "Coach, BookMyDoc slot booking",
        built: true, claimedStages: 5, startsAt: "Booking Confirmed", skips: false, repeats: true,
        blurb: "The only journey where every state is a person's action. Nobody ships anything "
            + "and no lab is involved. Filing the session notes is what completes it. Two of its "
            + "states are the consult outcome, which the live system does not record at all.",
        stages: [
            { state: "SCHEDULED", label: "Booking Confirmed", phase: "scheduling", trigger: "Slot booked at checkout or through BookMyDoc", seen: true },
            { state: "PROFESSIONAL_ASSIGNED", label: "Coach Assigned", phase: "assigned", trigger: "Coach or doctor allocated", seen: true },
            { state: "SERVICE_IN_PROGRESS", label: "Session In Progress", phase: "in_progress", trigger: "NOTHING MARKS A SESSION AS STARTED", seen: true, note: "This state has no trigger. A step that waits for it waits for ever." },

            /* ── THE CONSULT OUTCOME ────────────────────────────────────────
               NOT IN THE FULFILMENT MODEL. Named by the product team, and it
               is the answer to the gap this page has reported from the start:
               the live system records that a call happened and never what was
               decided in it.

               A protocol cannot be built without this. Every step after a
               consultation depends on the decision, not on the call, and
               COMPLETED only says the call took place. */
            { state: "PROTOCOL_APPROVED", kind: "coach", label: "Protocol approved, continue as planned", phase: "completing", trigger: "NOTHING RECORDS THIS TODAY", seen: true, note: "The coach or doctor confirms the protocol goes ahead. No consult outcome exists anywhere in the live system, so this has to be built." },
            { state: "PRESCRIPTION_GENERATED", kind: "coach", label: "Prescription generated", phase: "completing", trigger: "NOTHING RECORDS THIS TODAY", seen: true, note: "The doctor issues the prescription. Not the same event as the medicine gate's PRESCRIPTION_PENDING, which the artifact triggers on a CUSTOMER uploading one. Whether the two meet is a question for the tech team." },

            { state: "NOTES_UPLOADED", label: "Notes Ready", phase: "completing", trigger: "Coach uploads session notes", seen: true, note: "This is the real completion signal for a consultation. Notes filed, not a call held." },
            { state: "COMPLETED", label: "Complete", phase: "completed", trigger: "System closes the consultation", seen: true, terminal: true },
        ],
    },
    {
        id: "bundle", label: "Bundle",
        fulfils: "A parent wrapper that fans out into child orders",
        products: "Bundles, treatment plans",
        movedBy: "The system, at order creation",
        built: false, claimedStages: 5, startsAt: "Bundle Received", skips: false,
        blurb: "Not a journey a customer follows. It is a parent record that unpacks a multi-item "
            + "purchase into child orders of the other five types, then counts how many are done. "
            + "THIS IS WHAT A PROTOCOL IS. The states exist on paper and nothing executes them.",
        stages: [
            { state: "BUNDLE_RECEIVED", label: "Bundle Received", phase: "scheduling", trigger: "Multi-item order created", seen: false },
            { state: "BUNDLE_EXPANDING", label: "Expanding", phase: "in_progress", trigger: "System splits the bundle", seen: false },
            { state: "CHILDREN_CREATED", label: "Child Orders Created", phase: "in_progress", trigger: "One child per item, each with its own journey", seen: false },
            { state: "BUNDLE_PARTIALLY_COMPLETE", label: "Partially Complete", phase: "processing", trigger: "Some children finished", seen: false },
            { state: "COMPLETED", label: "Complete", phase: "completed", trigger: "All children finished", seen: true, terminal: true },
        ],
    },
]

/**
 * THE SECOND VOCABULARY. Two things move a protocol, and they are not alike.
 *
 * An ORDER STATUS is reported by the fulfilment system about a child order.
 * A USER ACTION is something the patient did. It sits on the account, the
 * payment or the app, not on any order, so it belongs to no journey and can
 * happen at any point in one.
 *
 * THAT IS WHY THEY ARE OFFERED ON EVERY STEP. Report viewed lands in the
 * middle of a blood order, not before it, so no rule about the first step can
 * hold them.
 *
 * ONE OF THE THREE IS REAL. `payment.paymentStatus` carries PAID / COMPLETED /
 * FAILED and the orders list already colours on it (ordersListUtils.js:380).
 * Nothing in the admin panel records that a patient finished onboarding, and
 * nothing records that a patient opened a report. Those two have to be built,
 * and the page says so wherever they are used.
 */
export const USER_ACTIONS: Stage[] = [
    {
        state: "ONBOARDING_COMPLETE", kind: "user", label: "Onboarding complete",
        phase: "scheduling", trigger: "NOTHING RECORDS THIS TODAY", seen: true,
    },
    {
        state: "PAID", kind: "user", label: "Paid", phase: "scheduling",
        trigger: "Checkout — payment.paymentStatus", seen: true,
    },
    {
        state: "REPORT_VIEWED", kind: "user", label: "Report viewed", phase: "completing",
        trigger: "NOTHING RECORDS THIS TODAY", seen: true,
    },
]

/**
 * THE PROTOCOL SERVICE ITSELF. Available on every order type, and the ONE
 * signal that is never spent — it is meant to be used in many places.
 *
 * It says a step needs no outside report: once whatever sits beside it holds,
 * the protocol moves on by itself. Its most common use is the last step of an
 * order, where the journey has no status left to give.
 *
 * IT IS NOT FREE. Nothing runs a protocol today. The fulfilment model creates
 * every child of a bundle at once and runs them in parallel, so a protocol
 * that advances itself needs a service that holds the next child order and
 * releases it — the general form of the prescription gate, which already
 * holds a medicine order at the warehouse until a pharmacist releases it.
 * That service is the build task this signal names, and it is in the open
 * questions below.
 */
export const SYSTEM_ACTIONS: Stage[] = [
    {
        state: "BACKEND_DRIVEN", kind: "system", label: "Backend driven",
        phase: "in_progress", seen: true,
        trigger: "The protocol service, once the conditions beside it hold",
        note: "No service runs a protocol today. This names the one that has to be built.",
    },
]

export const isSystemAction = (state: string) => SYSTEM_ACTIONS.some(p => p.state === state)

export const fulfilmentType = (id: TypeId) => TYPES.find(t => t.id === id)!

/**
 * The types an author may put INSIDE a protocol.
 *
 * A bundle cannot hold a bundle. Home service is out too: Valeo sells four
 * packages — blood, supplement, medicine and the coach consult — and a fifth
 * on the palette is a journey nobody would ever author steps for. Its states
 * stay in the model, because an order of that type still exists in the live
 * system; a protocol just cannot create one.
 */
export const CHILD_TYPES = TYPES.filter(t => t.id !== "bundle" && t.id !== "home_service")

/**
 * Available to all six types from any state that has not finished, so they are
 * not drawn into any journey. They hang off every state.
 */
export const UNIVERSAL: Stage[] = [
    { state: "CANCELLED", label: "Cancelled", phase: "cancelled", trigger: "Ops or the customer", seen: true, terminal: true },
    { state: "RESCHEDULED", label: "Rescheduled", phase: "rescheduled", trigger: "Ops closes this order and opens a fresh one", seen: true, terminal: true, note: "There is no path back from it to a booking." },
]

/* ─────────────────────────── What the author writes ──────────────────────── */

/**
 * ANY ONE, OR EVERY ONE. The author chooses per gap, because both are real.
 *
 * `or` — one of the two is enough. Two states of one order cannot hold at the
 * same moment, so alternatives is what they usually mean.
 *
 * `and` — both have to have held. On one order that reads as HAS PASSED
 * THROUGH, not IS AT, and it is only answerable because journeys are forward
 * only and every stage change is recorded. Across fields it is the ordinary
 * reading: paid AND onboarded are two facts that can both be true.
 */
export type Join = "and" | "or"

/** One condition in a stack. `join` says how it attaches to the one above. */
export interface Clause {
    id: string
    /** A state id, or a pre-order signal on the first step of the first order. */
    state: string
    /** Absent on the first clause, because nothing sits above it. */
    join?: Join
}

export interface Condition {
    clauses: Clause[]
    /**
     * Also satisfied by any state AFTER a named one, failures excluded.
     *
     * NOT A CONVENIENCE. Supplement and medicine are read from warehouse
     * snapshots and skip states, so a step waiting only on PICKING can be
     * stepped straight over and wait for ever.
     */
    orLater?: boolean
}

/**
 * A STEP IS AUTHORED, THEN MAPPED. The states are not the steps. A blood order
 * has thirteen states and nobody reads thirteen lines on a phone.
 *
 * TWO SIDES, because they answer different questions. `completes` moves the
 * patient forward. `starts` makes the step appear, and it is OPTIONAL: an
 * empty one means the step starts when the step above it completes, which is
 * what an author wants nearly every time.
 */
export interface Step {
    id: string
    title: string
    /** Arabic. The app draws one language per patient, so both are authored. */
    titleAr?: string
    /**
     * ONLY THE AUTHOR'S OWN EXTRAS. What completes the step above always
     * starts this one, and that part is DERIVED — never stored, never edited,
     * so it can never drift from the completion it came from.
     *
     * Anything here is added ON TOP of it, and joins to it with AND or OR.
     */
    starts: Condition
    completes: Condition
}

export interface Block {
    id: string
    type: TypeId
    /** The exact package. A unit, not a listing — money lives on the unit. */
    unit?: PricedUnitRef
    /**
     * A DIFFERENT PACKAGE PER PATH, where the protocol splits. A male and a
     * female panel are two products with different markers and prices, so the
     * split has to reach the package and not stop at the step list.
     *
     * Overrides `unit` on every path it names.
     */
    unitByValue?: Record<string, PricedUnitRef>
    /**
     * WHICH REFILL THIS IS. Weeks from the purchase, on the warehouse orders
     * only, because only they ship again and again: week 1, week 5, week 9.
     *
     * THIS DOES NOT BREAK "THERE IS NO TIME IN A PROTOCOL". That rule bans a
     * week on a STEP, and for a good reason — a lab is slow, a courier is
     * late, so "Week 6" is wrong for almost every patient who reads it. This
     * is not a step. It says when the ORDER IS DUE TO BE PLACED, which the
     * plan really does decide, and weeks from a purchase are known exactly.
     *
     * IT IS NOT A CONDITION. Nothing on this page completes on a week. The
     * order still runs its own journey once it exists, and every step still
     * waits on a reported status.
     */
    week?: number
    steps: Step[]
}

let seq = 0
const uid = (p: string) => `${p}-${(seq++).toString(36)}-${Date.now().toString(36)}`

export const emptyCondition = (): Condition => ({ clauses: [] })

export const newClause = (state: string, join?: Join): Clause =>
    ({ id: uid("cl"), state, join })

export const newBlock = (type: TypeId): Block => ({ id: uid("blk"), type, steps: [] })

export const newStep = (title = ""): Step => ({
    id: uid("stp"), title, starts: emptyCondition(), completes: emptyCondition(),
})

/** The package this order uses on one path, falling back to the single one. */
export const unitOnPath = (b: Block, value?: string) =>
    (value ? b.unitByValue?.[value] : undefined) ?? b.unit

/**
 * A DERIVED CONDITION CARRIES ITS SOURCE ORDER. Across an order boundary the
 * state belongs to another journey — a consultation step can be started by
 * COACH_REVIEWED, which no consultation ever reports — so the type it came
 * from has to travel with it or the label and the icon are read off the wrong
 * vocabulary.
 */
export interface Derived {
    clause: Clause
    /** The journey the state belongs to, which may not be this block's. */
    type: TypeId
    /** Set only when it crossed an order boundary. */
    from?: string
}

/**
 * WHAT COMPLETES ONE STEP STARTS THE NEXT. Computed, never copied.
 *
 * ACROSS ORDERS TOO. The first step of an order is started by the last step of
 * the order above it, because a protocol runs its orders in the order they are
 * listed. Empty orders are stepped over, so an order with no steps yet does
 * not break the chain behind it.
 *
 * `derived` is frozen on screen — no dropdown, no delete — because there is
 * one place to author a transition and it is the completion it comes from.
 * `extra` is whatever the author adds on top.
 *
 * The very first step of the protocol derives nothing. Its whole start is
 * authored, and it is where the user actions belong.
 */
export function startsOf(
    blocks: Block[], bi: number, si: number,
): { derived: Derived[]; extra: Clause[] } {
    const b = blocks[bi]
    const extra = b.steps[si].starts.clauses

    if (si > 0) {
        return {
            derived: b.steps[si - 1].completes.clauses.map(c => ({ clause: c, type: b.type })),
            extra,
        }
    }

    for (let j = bi - 1; j >= 0; j--) {
        const prev = blocks[j]
        if (!prev.steps.length) continue
        const last = prev.steps[prev.steps.length - 1]
        return {
            derived: last.completes.clauses.map(c => ({
                clause: c, type: prev.type, from: fulfilmentType(prev.type).label,
            })),
            extra,
        }
    }
    return { derived: [], extra }
}

/** Everything that starts this step: what it derived, plus what was added. */
export function effectiveStarts(blocks: Block[], bi: number, si: number): Derived[] {
    const { derived, extra } = startsOf(blocks, bi, si)
    return [...derived, ...extra.map(c => ({ clause: c, type: blocks[bi].type }))]
}

export const statesOf = (c: Condition) => c.clauses.map(x => x.state).filter(Boolean)

export const stageOf = (type: TypeId, state: string): Stage | undefined =>
    fulfilmentType(type).stages.find(s => s.state === state)
    ?? USER_ACTIONS.find(s => s.state === state)
    ?? SYSTEM_ACTIONS.find(s => s.state === state)

/**
 * What a step may name.
 *
 * NO USER ACTIONS. Onboarding complete, Paid and Report viewed are facts about
 * a PROTOCOL, not about an order, and steps are now authored once per order
 * type and reused by every protocol. A blood map that said "starts on Paid"
 * would say it in every protocol, including the ones where blood is third —
 * and nothing could catch that. They stay in the model, because the fulfilment
 * spec names them and `findings` still reports a stored step that waits on
 * one; they are simply no longer offered.
 *
 * BACKEND_DRIVEN stays. It belongs to no journey either, but it says "the
 * protocol service moves this on" — which is true wherever the step is used.
 */
export const optionsFor = (type: TypeId): Stage[] =>
    [...SYSTEM_ACTIONS, ...fulfilmentType(type).stages]

/**
 * IS IT ONE OF THE THREE PROTOCOL-WIDE PATIENT SIGNALS?
 *
 * NOT the same question as `kindOf(...) === "user"`. A patient signal that
 * belongs to one journey — RX_VIEWED on the warehouse orders — is marked as a
 * user action and is spent PER ORDER, because two medicine orders each put
 * their own prescription in front of the patient.
 *
 * Kept for `ordinal`, which must still refuse to place one of the three on a
 * journey's line, and for `findings`, which still reports a stored step that
 * waits on one. Nothing offers them any more — see `optionsFor`.
 */
export const isUserAction = (state: string) => USER_ACTIONS.some(p => p.state === state)

export const kindOf = (type: TypeId, state: string): SignalKind =>
    stageOf(type, state)?.kind ?? "order"

/**
 * Where a state sits in its journey, or NaN when the question does not apply.
 *
 * A USER ACTION IS NOT ON THE LINE. It sits on a different field, so its
 * position among an order's states is unknown and every ordering check has to
 * skip it rather than guess. Failures are off the line for the same reason:
 * -1 would read as the position just before the first state, and a delivery
 * that failed has not moved past one that was out for delivery.
 */
export function ordinal(type: TypeId, state: string): number {
    if (isUserAction(state) || isSystemAction(state)) return NaN
    const line = fulfilmentType(type).stages.filter(s => s.phase !== "failed")
    const i = line.findIndex(s => s.state === state)
    return i < 0 ? NaN : i
}

/** Every state that would satisfy this condition, once `orLater` is applied. */
export function expand(type: TypeId, c: Condition): string[] {
    const on = statesOf(c)
    if (!c.orLater || !on.length) return on
    const line = fulfilmentType(type).stages.filter(s => s.phase !== "failed")
    const at = on.map(x => ordinal(type, x)).filter(i => Number.isFinite(i) && i >= 0)
    if (!at.length) return on
    return [...new Set([...on, ...line.slice(Math.min(...at)).map(s => s.state)])]
}

/** The furthest point a condition reaches. NaN when it names nothing on the line. */
export function reachOf(type: TypeId, c: Condition): number {
    const at = statesOf(c).map(x => ordinal(type, x)).filter(Number.isFinite)
    return at.length ? Math.max(...at) : NaN
}

/**
 * What this condition may no longer offer, because something else spends it.
 *
 * ONE POOL PER ORDER. A status chosen anywhere in an order is done. It does
 * not come back on the next step, on the other side, or anywhere else. An
 * order passes a status once, so a second step hanging off it would fire in
 * the same instant as the first.
 *
 * A FOLLOWED START SPENDS NOTHING. It is a mirror of the completion above it,
 * not a choice, and the completion it mirrors already spent the status. Making
 * the mirror spend it too would take the status away from the one step allowed
 * to name it — and it is the mechanism the whole page runs on. Override that
 * start and it becomes a real choice, and then it spends.
 *
 * ONE POOL, AND IT IS THIS ORDER'S. There used to be a second, protocol-wide
 * pool for the three patient signals that belong to no order — a patient pays
 * once and finishes onboarding once, so a second step naming one would fire
 * with the first. Those three are no longer authorable at all (see
 * `optionsFor`), so the pool that protected them has nothing left to hold.
 * `blocks` stays in the signature: a caller passes the whole protocol, and a
 * narrower one would have to be widened again the day a second pool returns.
 */
export function spentOn(
    blocks: Block[], b: Block, side: "starts" | "completes", stepId: string,
): string[] {
    /* The condition being edited never spends against itself — its own values
       are kept by the caller so a control can always show what it holds. */
    /* A derived start is not stored in `starts` at all, so it cannot be counted
       here — and it must not be. The completion it comes from already spent it. */
    const chosen = (s: Step, sd: "starts" | "completes") =>
        (s.id === stepId && sd === side) ? [] : statesOf(s[sd])

    const of = (steps: Step[]) =>
        steps.flatMap(s => [...chosen(s, "starts"), ...chosen(s, "completes")])

    /* BACKEND_DRIVEN IS NEVER SPENT. Every other signal happens once, so using
       it once takes it off the list. This one is a statement that no outside
       report is needed, and a protocol needs to say that in many places. */
    void blocks
    return [...new Set(of(b.steps))].filter(x => !isSystemAction(x))
}

/**
 * WHERE THIS ORDER HANDS OVER. Not a thing to author — a thing to read.
 *
 * There is no fourth kind of signal for "the backend moves it on". The
 * transition is already fully stated by the two ends it joins: the last step
 * of an order completes on a status, and the first step of the next order is
 * derived from that same status. Nothing is left for an author to say, and
 * nothing about it can be got wrong.
 *
 * What the BACKEND has to do at that point is release the next child order.
 * The fulfilment model creates every child of a bundle at once and runs them
 * in parallel, so a protocol that must run in sequence needs a hold — the
 * general form of the prescription gate, which already holds a medicine order
 * at the warehouse until a pharmacist releases it. That is a build task in the
 * contract, not a condition on this page.
 */
export function handoff(blocks: Block[], bi: number): {
    to?: string
    on: string[]
} | undefined {
    const b = blocks[bi]
    if (!b.steps.length) return undefined
    const on = statesOf(b.steps[b.steps.length - 1].completes)
    for (let j = bi + 1; j < blocks.length; j++) {
        if (blocks[j].steps.length) return { to: fulfilmentType(blocks[j].type).label, on }
    }
    return { on }
}

/** States in this order that no step names, on either side. */
export function unmapped(b: Block): Stage[] {
    /* A start derived from ANOTHER order names a state this order never
       reports, so it maps nothing here even when the two names coincide. */
    const taken = new Set(b.steps.flatMap(st => [...statesOf(st.starts), ...statesOf(st.completes)]))
    return fulfilmentType(b.type).stages.filter(s => !taken.has(s.state))
}

/* ──────────────────────── Which packages fit which order ─────────────────── */

/**
 * A LISTING ALREADY KNOWS ITS JOURNEY. `fulfilmentPath` is on every listing and
 * it drives ops, finance and the order states, so the order type is read from
 * it and never asked for twice.
 *
 * ONE SPLIT IS NOT ON THE PATH. Supplement and medicine share the warehouse
 * journey and arrive as the same line item. The prescription flag is what
 * separates them, and it is what switches the gate on.
 */
export function typeOfListing(l: Listing): TypeId | undefined {
    switch (l.fulfilmentPath) {
        case "blood": return "blood"
        case "home_service": return "home_service"
        case "consultation": return "consultation"
        case "supplement": return l.attributes?.isRxRequired ? "medicine" : "supplement"
        /* digital_instant has no fulfilment journey. A voucher is issued, not
           fulfilled, so it cannot be a step in a protocol. */
        default: return undefined
    }
}

export function packagesFor(type: TypeId, listings: Listing[]) {
    return listings
        .filter(l => typeOfListing(l) === type)
        .flatMap(l => pricedUnitsOf(l).map(u => ({
            ref: u.ref,
            label: `${l.displayNameEn || l.internalName} — ${u.label}`,
        })))
}

export const refKey = (r?: PricedUnitRef) =>
    r ? `${r.listingId}::${r.kind}::${r.unitId}` : ""

/* ──────────────────────────────── The counts ─────────────────────────────── */

export interface Summary {
    orders: number
    steps: number
    /** Every state across every order. What the order service reports. */
    states: number
    /** States no step maps. Not an error — most states are progress. */
    unmapped: number
    unpriced: number
}

export function summarise(blocks: Block[]): Summary {
    return {
        orders: blocks.length,
        steps: blocks.reduce((n, b) => n + b.steps.length, 0),
        states: blocks.reduce((n, b) => n + fulfilmentType(b.type).stages.length, 0),
        unmapped: blocks.reduce((n, b) => n + unmapped(b).length, 0),
        unpriced: blocks.filter(b => !b.unit && !Object.keys(b.unitByValue ?? {}).length).length,
    }
}

/* ────────────────────────────── What is wrong ────────────────────────────── */

export interface Finding { level: "error" | "note"; text: string }

/**
 * ONLY WHAT THE CMS CAN DEFEND. Every check reads data this file holds. The
 * things it cannot know — whether orders run in sequence, what a coach decided
 * — are questions for the tech team, not gates on an author.
 */
export function findings(blocks: Block[]): Finding[] {
    const out: Finding[] = []
    const err = (text: string) => out.push({ level: "error", text })
    const note = (text: string) => out.push({ level: "note", text })

    blocks.forEach((b, bi) => {
        const def = fulfilmentType(b.type)

        b.steps.forEach((st, i) => {
            const name = st.title || "an untitled step"
            const cs = statesOf(st.completes)

            if (!cs.length) err(`${name} completes on nothing, so nothing finishes it`)

            /* AN EMPTY CONDITION. Add condition opens one, and an author who
               walks away from it leaves a row that reads as a rule and is not. */
            const blanks = [...st.starts.clauses, ...st.completes.clauses]
                .filter(c => !c.state).length
            if (blanks) err(`${name} has ${blanks === 1 ? "a condition" : blanks + " conditions"} with no status chosen`)

            const starts = effectiveStarts(blocks, bi, i).filter(d => d.clause.state)
            /* Only what belongs to THIS journey can be measured against it. A
               condition that crossed an order boundary sits on another one. */
            const ss = starts.filter(d => d.type === b.type).map(d => d.clause.state)

            ;[...starts.map(d => ({ t: d.type, x: d.clause.state })),
              ...cs.map(x => ({ t: b.type, x }))].forEach(({ t, x }) => {
                if (stageOf(t, x)?.trigger.startsWith("NOTHING")) {
                    err(`${name} waits for ${x}, which nothing can set`)
                }
            })

            /* MIXED JOINS HAVE NO PRECEDENCE HERE. "A and B or C" is read left
               to right, because an author is not writing an expression and a
               silent precedence rule is how a gate stops being trusted. */
            ;([st.starts, st.completes] as Condition[]).forEach(c => {
                const joins = new Set(c.clauses.slice(1).map(x => x.join ?? "and"))
                if (joins.size > 1) {
                    note(`${name} mixes and with or, which is read from the top down`)
                }
            })

            /* THE SAME STATE ON BOTH SIDES. The two sides keep separate pools,
               so nothing stops an author naming one state twice. It would
               finish the step in the instant it started it. */
            const both = ss.filter(x => cs.includes(x))
            both.forEach(x => err(`${name} starts and completes on ${x}, so it finishes at once`))

            /* STARTS AFTER IT COMPLETES. Both sides sit on one journey whose
               order is known, so this is a fact and not an opinion. */
            const sr = reachOf(b.type, { clauses: ss.map(x => newClause(x)) })
            const cr = reachOf(b.type, st.completes)
            if (Number.isFinite(sr) && Number.isFinite(cr) && sr > cr) {
                err(`${name} completes before it starts`)
            }

            /* AND over one order means HAS PASSED THROUGH, which needs history.
               A backend reading only the current status cannot answer it. */
            const ands = st.completes.clauses.slice(1)
                .filter(x => (x.join ?? "and") === "and" && !isUserAction(x.state))
            if (ands.length && cs.filter(x => !isUserAction(x)).length > 1) {
                note(`${name} needs every state passed, so it needs the status history`)
            }

            if (def.skips && !st.completes.orLater) {
                note(`${name} is on a journey that skips states — turn on "or later"`)
            }
        })

        for (let i = 1; i < b.steps.length; i++) {
            const prev = b.steps[i - 1], cur = b.steps[i]
            const p = reachOf(b.type, prev.completes), c = reachOf(b.type, cur.completes)
            if (Number.isFinite(p) && Number.isFinite(c) && c < p) {
                err(`${cur.title || "a step"} finishes before ${prev.title || "the step above it"}`)
            }
        }

        /* `summarise().unpriced` checks both and this checked one, so an order
           split per sex — which has `unitByValue` and no `unit` — was reported
           as having no package while the counter beside it said it had one. */
        if (!b.unit && !Object.keys(b.unitByValue ?? {}).length) {
            note(`${def.label} has no package`)
        }
        if (!b.steps.length) note(`${def.label} has no steps`)
    })

    return out
}

/* ──────────────────────── What the tech team must answer ─────────────────── */

/**
 * FIVE FROM THE SOURCE, TWO OF MINE. The source lists five things that need a
 * product decision rather than a build. Two more come from reading it against
 * itself. None of these are bugs in this page; all of them are questions the
 * protocol cannot answer alone.
 */
export const OPEN_QUESTIONS: { area: string; q: string; why: string; mine?: boolean }[] = [
    {
        area: "Bundle",
        q: "Is a bundle in scope, or does a multi-item order simply become several independent orders?",
        why: "A protocol IS a bundle. Its states are defined and no code executes them, and they map "
            + "to no customer-visible status. This one question decides whether a protocol is a "
            + "record or only a list.",
    },
    {
        area: "Consultation",
        q: "What marks a session as started, and what happens on a no-show?",
        why: "SERVICE_IN_PROGRESS has no trigger. CONSULTATION_DONE and CLIENT_NO_SHOW are drafted "
            + "and not agreed. A no-show today has nowhere to go.",
    },
    {
        area: "Protocol service",
        q: "What holds a child order, and what releases it?",
        mine: true,
        why: "BACKEND_DRIVEN says the protocol advances itself, and nothing does that today. "
            + "A bundle creates every child at once and runs them in parallel, so a pharmacist "
            + "can approve a prescription before the blood is drawn. Sequence needs a hold and a "
            + "release, which is the prescription gate generalised.",
    },
    {
        area: "Consultation",
        q: "Build PROTOCOL_APPROVED and PRESCRIPTION_GENERATED on the consultation order.",
        mine: true,
        why: "The product team has named the consult outcome this page reported missing. Neither "
            + "state exists in the fulfilment model or in the live panel, and no protocol can run "
            + "without them: every step after a consultation depends on what was decided, and "
            + "COMPLETED only says the call took place.",
    },
    {
        area: "Returns",
        q: "Should ops be able to cancel a return?",
        why: "Once an order enters Return in Progress it counts as closed, so ops cannot cancel out "
            + "of it, even though one step is left before Returned.",
    },
    {
        area: "Reschedule",
        q: "Does rescheduling always create a brand-new order?",
        why: "Rescheduled has no path back to a booking. The model only works if the answer is yes.",
    },
    {
        area: "Medicine",
        q: "Can the two unused prescription states be dropped?",
        why: "A pharmacist-review state and a hold-release state exist and nothing triggers either. "
            + "Dropping both leaves a clean approve-or-reject gate.",
    },
    {
        area: "Blood",
        q: "Does blood need its own IN_TRANSIT state?",
        mine: true,
        why: "Blood shows the customer label \"Nurse On The Way\" on the state ARRIVED_AT_LOCATION. "
            + "Home service uses IN_TRANSIT for On The Way and ARRIVED_AT_LOCATION for Arrived. One "
            + "of the two is wrong, and a patient is told the nurse is travelling after arrival.",
    },
    {
        area: "Counts",
        q: "Are the failure and optional states counted as stages?",
        mine: true,
        why: "The source states 12 blood stages and 9 supplement stages. Listing every state gives "
            + "13 and 10. The difference is one optional state on blood and one retry state on "
            + "supplement. Medicine, home service, consultation and bundle all agree exactly.",
    },
]
