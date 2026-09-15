// ── The weekly journey: three phases, one widget set ──────────
//
// The page a patient opens from Today, week after week. It is NOT the plan
// page: the plan page sells the protocol before anybody buys, and this one
// tells somebody already on it what their body is doing. Different job,
// different widgets, and authored three times over.
//
// THE THREE RANGES ARE DERIVED, never typed three times. The author sets the
// length and the two break points; `phaseRanges` turns those into 1-4, 5-8,
// 9-12. Typing six numbers instead would let week five fall into two phases,
// or into none, and neither is catchable by looking at the screen.
//
// WEEKS ARE ALLOWED HERE and nowhere near a step. A step's timing is decided
// by a lab or a courier, so it names no week. How long ago somebody bought is
// known exactly, and that is the only thing this page is keyed to.

import { useMemo, useSyncExternalStore } from "react"
import type { PlanGap } from "@/lib/protocol-plans"
import type {
    JourneyBlock, JourneyBlockType, JourneyItem, JourneyItemIcon, JourneyPhase,
    ProtocolPlan,
} from "@/types"

/** A journey is three phases. It is not a setting. */
export const PHASES: (1 | 2 | 3)[] = [1, 2, 3]

export const DEFAULT_WEEKS = 12
export const DEFAULT_BREAKS: [number, number] = [4, 8]

// ── The week ranges ──────────────────────────────────────────

export interface PhaseRange {
    phase: 1 | 2 | 3
    from: number
    to: number
    /** "Week 1-4", or "Week 12" where a phase is one week long. */
    label: string
}

/**
 * The three ranges, from the length and the two breaks.
 *
 * IT ALWAYS RETURNS THREE, and they always tile 1..weeks with no gap and no
 * overlap, whatever nonsense the stored numbers hold. A half-typed break of 0
 * or 99 is a thing to WARN about, not a reason for the screen to draw a phase
 * that runs from week 9 to week 4.
 */
export function phaseRanges(plan: ProtocolPlan | null): PhaseRange[] {
    const weeks = Math.max(3, plan?.journeyWeeks ?? DEFAULT_WEEKS)
    const raw = plan?.phaseBreaks ?? DEFAULT_BREAKS

    /* Clamped so every phase is at least one week long. */
    const b1 = Math.min(Math.max(1, raw[0]), weeks - 2)
    const b2 = Math.min(Math.max(b1 + 1, raw[1]), weeks - 1)

    const bounds: [number, number][] = [[1, b1], [b1 + 1, b2], [b2 + 1, weeks]]
    return PHASES.map((phase, i) => {
        const [from, to] = bounds[i]
        return { phase, from, to, label: from === to ? `Week ${from}` : `Week ${from}-${to}` }
    })
}

export const rangeOf = (plan: ProtocolPlan | null, phase: 1 | 2 | 3) =>
    phaseRanges(plan)[phase - 1]

/**
 * The two breaks that split a length into three as evenly as it goes.
 *
 * It exists because changing the length must NOT silently rewrite breaks
 * somebody chose — a 12-week journey cut at 4 and 8 that becomes 9 weeks keeps
 * its cuts, and phase three quietly becomes one week. The screen shows that,
 * and this is the one press that fixes it.
 */
export function evenBreaks(weeks: number): [number, number] {
    const w = Math.max(3, Math.round(weeks))
    return [Math.floor(w / 3), Math.floor((w * 2) / 3)]
}

// ── The widget vocabulary ────────────────────────────────────

export const JOURNEY_BLOCKS: {
    id: JourneyBlockType
    label: string
    blurb: string
    /** Whether the block carries a list, and what one line of it is called. */
    itemWord?: string
    /** The plural. Carried, not guessed: "thing to expect" does not take an s. */
    itemWordPlural?: string
    /** Whether a list line has a title of its own as well as a body. */
    itemHasTitle?: boolean
    /** Whether a list line carries an icon. */
    itemHasIcon?: boolean
    /** At most one per page, because the page has one of them. */
    once?: boolean
}[] = [
    {
        id: "PHASE_HERO", label: "Phase hero", once: true,
        blurb: "The green card at the top. The phase's own heading and the paragraph under it.",
    },
    {
        id: "YOU_MAY_NOTICE", label: "You may notice",
        blurb: "What to expect in this phase, two across, each with an icon.",
        itemWord: "thing to expect", itemWordPlural: "things to expect",
        itemHasTitle: true, itemHasIcon: true,
    },
    {
        id: "FOCUS_THIS_WEEK", label: "Focus this week",
        blurb: "A ticked list of what to concentrate on. One line each, no titles.",
        itemWord: "focus point", itemWordPlural: "focus points",
    },
    {
        id: "COMING_NEXT", label: "Coming next",
        blurb: "A numbered look ahead, so nothing arrives as a surprise.",
        itemWord: "step ahead", itemWordPlural: "steps ahead", itemHasTitle: true,
    },
    {
        id: "CARE_TEAM", label: "Message your care team", once: true,
        blurb: "The card at the foot. It carries the words on the button.",
    },
]

export const blockSpec = (t: JourneyBlockType) =>
    JOURNEY_BLOCKS.find(b => b.id === t)
export const blockLabel = (t: JourneyBlockType) =>
    blockSpec(t)?.label ?? t
export const takesItems = (t: JourneyBlockType) => !!blockSpec(t)?.itemWord

/** One of them, or many. */
export function itemWord(t: JourneyBlockType, n: number) {
    const spec = blockSpec(t)
    if (n === 1) return spec?.itemWord ?? "line"
    return spec?.itemWordPlural ?? `${spec?.itemWord ?? "line"}s`
}

export const JOURNEY_ICONS: { id: JourneyItemIcon; label: string }[] = [
    { id: "appetite", label: "Appetite" },
    { id: "fatigue", label: "Fatigue" },
    { id: "scale", label: "Weight" },
    { id: "digestion", label: "Digestion" },
    { id: "energy", label: "Energy" },
    { id: "wellbeing", label: "Wellbeing" },
    { id: "sleep", label: "Sleep" },
    { id: "mood", label: "Mood" },
]

const rid = () => Math.random().toString(36).slice(2, 9)

export function emptyItem(rank: number): JourneyItem {
    return { id: `ji-${rid()}`, rank, titleEn: "", textEn: "" }
}

export function emptyBlock(type: JourneyBlockType, rank: number): JourneyBlock {
    return {
        id: `jb-${rid()}`,
        type,
        rank,
        isActive: true,
        config: { headingEn: "", blurbEn: "", items: takesItems(type) ? [] : undefined },
    }
}

export function emptyPhase(phase: 1 | 2 | 3): JourneyPhase {
    return { phase, pageName: "", status: "draft", blocks: [] }
}

/** The three phases, filled in where they are missing. Always three. */
export function phasesOf(plan: ProtocolPlan | null): JourneyPhase[] {
    return PHASES.map(n => plan?.phases?.find(p => p.phase === n) ?? emptyPhase(n))
}

/**
 * A PAGE IN THE SHAPE OF THE DESIGN, ready to be reworded.
 *
 * Nobody should have to add five widgets and remember the order before they
 * can start writing. This lays out the page as designed and fills it with the
 * words for that phase, which is a starting point an author edits rather than
 * a template they have to assemble.
 */
export function buildPhase(phase: 1 | 2 | 3, range: PhaseRange): JourneyPhase {
    const hero = [
        {
            h: "Your journey begins.",
            b: "During these first few weeks, your body is adjusting to the medication and new "
                + "habits. Changes may feel gradual — and that's completely normal. You're laying "
                + "the foundation for long-term success.",
        },
        {
            h: "Your habits are making a difference.",
            b: "In this phase, your body is becoming more responsive to the medication and "
                + "lifestyle changes. You may start to notice more consistent progress. Keep going "
                + "— you're right on track.",
        },
        {
            h: "You've made incredible progress.",
            b: "In this final phase, we focus on maintaining your results, strengthening healthy "
                + "habits and setting you up for long-term success. Your body is now more "
                + "responsive, and the changes you've made are becoming your new normal.",
        },
    ][phase - 1]

    const notice: { icon: JourneyItemIcon; t: string; x: string }[] = phase === 3
        ? [
            { icon: "energy", t: "Consistent energy", x: "You may feel energetic throughout the day." },
            { icon: "appetite", t: "Improved appetite", x: "Hunger and cravings often more manageable." },
            { icon: "scale", t: "Steady weight loss", x: "Most patients see continued, steady progress in this phase." },
            { icon: "wellbeing", t: "Better wellbeing", x: "Improved sleep, mood and confidence." },
        ]
        : [
            { icon: "appetite", t: "Changes in appetite", x: "You may feel less hungry or fuller sooner." },
            { icon: "fatigue", t: "Mild fatigue", x: "Your body is adjusting. Rest helps." },
            { icon: "scale", t: "Weight may vary", x: "It's normal for your weight to go up or down initially." },
            { icon: "digestion", t: "Digestive changes", x: "You may experience constipation or mild nausea." },
        ]

    const item = (rank: number, titleEn: string, textEn: string, icon?: JourneyItemIcon): JourneyItem =>
        ({ id: `ji-${rid()}`, rank, titleEn, textEn, ...(icon ? { icon } : {}) })

    const block = (
        type: JourneyBlockType, rank: number,
        headingEn: string, blurbEn: string, items?: JourneyItem[], extra?: object,
    ): JourneyBlock => ({
        id: `jb-${rid()}`, type, rank, isActive: true,
        config: { headingEn, blurbEn, ...(items ? { items } : {}), ...(extra ?? {}) },
    })

    return {
        phase,
        pageName: `Phase ${phase} · ${range.label}`,
        status: "draft",
        blocks: [
            block("PHASE_HERO", 0, hero.h, hero.b),
            block("YOU_MAY_NOTICE", 1, "You may notice",
                phase === 3
                    ? "In this stage, many people experience continued improvements and greater stability."
                    : "These are common in the early stages and usually settle as your body adapts.",
                notice.map((n, i) => item(i, n.t, n.x, n.icon))),
            block("FOCUS_THIS_WEEK", 2, "Focus this week",
                "These small steps help you build consistency and set yourself up for success.", [
                    item(0, "", "Take your medication as prescribed"),
                    item(1, "", "Stay hydrated (2–3L water)"),
                    item(2, "", "Log your meals in the app"),
                    item(3, "", "Complete your daily walk"),
                    item(4, "", "Get good sleep"),
                ]),
            block("COMING_NEXT", 3, "Coming next",
                "Here's what to expect in the next few weeks.", [
                    item(0, "Continue adaptation", "Your body keeps adjusting to the medication."),
                    item(1, "First review", "We'll check in on your progress and how you're feeling."),
                    item(2, "Building momentum",
                        `Most patients start seeing more consistent changes from week ${range.to + 1} onwards.`),
                ]),
            block("CARE_TEAM", 4, "Message your care team",
                "Have questions or need support? Our team is here for you.", undefined,
                { ctaLabelEn: "Message Now" }),
        ],
    }
}

// ── The refusals ─────────────────────────────────────────────

const empty = (v?: string) => !v || !v.trim()

/** What stops the journey's SHAPE being sound. It is shared by all three phases. */
export function journeyShapeGaps(plan: ProtocolPlan | null): PlanGap[] {
    const out: PlanGap[] = []
    const weeks = plan?.journeyWeeks ?? DEFAULT_WEEKS
    const breaks = plan?.phaseBreaks ?? DEFAULT_BREAKS

    if (weeks < 3) out.push({
        section: "journey", blocksDraft: true,
        what: "The journey is shorter than three weeks",
        why: "It is split into three phases, so it needs at least one week in each.",
    })
    if (breaks[0] < 1 || breaks[0] >= weeks) out.push({
        section: "journey", blocksDraft: true,
        what: `Phase one cannot end at week ${breaks[0]}`,
        why: `It has to end inside the journey, so between week 1 and week ${weeks - 2}.`,
    })
    if (breaks[1] <= breaks[0] || breaks[1] >= weeks) out.push({
        section: "journey", blocksDraft: true,
        what: `Phase two cannot end at week ${breaks[1]}`,
        why: `It has to end after phase one and before week ${weeks}.`,
    })
    return out
}

/** What stops ONE phase page going live. */
export function phaseGaps(ph: JourneyPhase, range: PhaseRange): PlanGap[] {
    const out: PlanGap[] = []

    if (empty(ph.pageName)) out.push({
        section: "journey", blocksDraft: true,
        what: `Phase ${ph.phase} has no name`,
        why: "Staff find the page by name in the list. Without one the row is blank.",
    })

    if (!ph.blocks.length) out.push({
        section: "journey",
        what: `Phase ${ph.phase} has no sections`,
        why: `A patient in ${range.label} would open an empty page.`,
    })

    const hero = ph.blocks.find(b => b.type === "PHASE_HERO" && b.isActive)
    if (ph.blocks.length && !hero) out.push({
        section: "journey",
        what: `Phase ${ph.phase} has no phase hero`,
        why: "It is the card that says which weeks these are and what is happening.",
    })
    if (hero && empty(hero.config.headingEn)) out.push({
        section: "journey",
        what: `Phase ${ph.phase}'s hero has no heading`,
        why: "It is the first line a patient reads on the page.",
    })

    ph.blocks.filter(b => b.isActive).forEach(b => {
        if (empty(b.config.headingEn) && b.type !== "PHASE_HERO") out.push({
            section: "journey",
            what: `A ${blockLabel(b.type).toLowerCase()} section has no heading`,
            why: "The section would render with a blank title above it.",
        })
        if (takesItems(b.type) && !(b.config.items ?? []).length) out.push({
            section: "journey",
            what: `${blockLabel(b.type)} has no ${itemWord(b.type, 0)}`,
            why: "The heading would sit above nothing.",
        })
        /* A line with neither a title nor a body draws as an empty row. Which of
           the two matters depends on the block, so accept either. */
        ;(b.config.items ?? []).forEach(it => {
            if (empty(it.titleEn) && empty(it.textEn)) out.push({
                section: "journey",
                what: `${blockLabel(b.type)} has an empty line`,
                why: "It would draw as a blank row with an icon beside it.",
            })
        })
    })

    return out
}

/** Every refusal across the shape and all three phases. */
export function journeyGaps(plan: ProtocolPlan | null): PlanGap[] {
    const ranges = phaseRanges(plan)
    return [
        ...journeyShapeGaps(plan),
        ...phasesOf(plan).flatMap((ph, i) => (
            /* An untouched phase is not a fault. It is a page nobody has
               written yet, and the list already says so. */
            ph.blocks.length || ph.pageName ? phaseGaps(ph, ranges[i]) : []
        )),
    ]
}

// ── Reading a phase, the way the app will ─────────────────────

/** Which phase a patient in this week is in. Used by the preview and the app. */
export function phaseForWeek(plan: ProtocolPlan | null, week: number): PhaseRange {
    const ranges = phaseRanges(plan)
    return ranges.find(r => week >= r.from && week <= r.to) ?? ranges[ranges.length - 1]
}

/**
 * The blocks a patient sees, in order, actives only.
 *
 * One function, so the CMS preview and the app agree about what is on the
 * page. Nothing here reads a patient: a phase page says the same thing to
 * everybody in those weeks, which is the whole reason it can be authored.
 */
export function resolvePhase(ph: JourneyPhase): JourneyBlock[] {
    return [...ph.blocks]
        .filter(b => b.isActive)
        .sort((a, b) => a.rank - b.rank)
        .map(b => ({
            ...b,
            config: {
                ...b.config,
                items: b.config.items
                    ? [...b.config.items].sort((x, y) => x.rank - y.rank)
                    : undefined,
            },
        }))
}

/** The store lives with the plan, so this only re-exports the hydration flag. */
const noopSubscribe = () => () => {}
export function useHydrated(): boolean {
    return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

/** The three phases and their ranges together, which is what a screen needs. */
export function usePhases(plan: ProtocolPlan | null) {
    return useMemo(() => {
        const ranges = phaseRanges(plan)
        return phasesOf(plan).map((ph, i) => ({ phase: ph, range: ranges[i] }))
    }, [plan])
}
