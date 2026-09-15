// ── Chat store, rules and the backend contract ────────────────
//
// A prototype store, held in localStorage. It is not the content service.
//
// Why it is here at all: the point of "Save as draft" is that you can set up a
// mapping, leave the screen, and come back to check it. A status field on
// component state cannot do that, because a reload clears it. So the store is
// the smallest thing that makes draft and publish testable. One file, one
// key, and a real service replaces it without touching a screen.

import { useMemo, useSyncExternalStore } from "react"
import type {
    Chat, ChatAnswerPayload, ChatKind, ChatOption, ChatQuestion, ChatQuestionKind,
    ChatRoutingMode, ChatSubmission, ChatSurface,
} from "@/types"

const KEY = "valeo_cms_chats_v2"

export const SURFACES: { id: ChatSurface; label: string; blurb: string }[] = [
    { id: "website", label: "Website", blurb: "Opened from a page on the marketing site." },
    { id: "app", label: "App", blurb: "Opened from a screen in the consumer app." },
    { id: "pdp", label: "Product page", blurb: "Opened from a listing's own page." },
    { id: "landing_page", label: "Landing page", blurb: "Opened from a campaign page." },
]

export const QUESTION_KINDS: { id: ChatQuestionKind; label: string; blurb: string }[] = [
    { id: "single_choice", label: "One answer", blurb: "The person picks one option." },
    { id: "multi_choice", label: "Many answers", blurb: "The person picks one or more options." },
    { id: "text", label: "Free text", blurb: "The person types an answer." },
    { id: "number", label: "Number", blurb: "The person types a number." },
]

/**
 * The three routing modes, with the words an author reads in the builder.
 *
 * "signal" is the mode that matters most, and it is the one a builder usually
 * cannot express. Age is a factor in the decision, and no single age picks a
 * goal. So the question feeds the engine, and it names no goal.
 */
export const ROUTING_MODES: { id: ChatRoutingMode; label: string; blurb: string }[] = [
    {
        id: "off", label: "Not used for routing",
        blurb: "The answer is stored and it plays no part in the decision.",
    },
    {
        id: "signal", label: "A factor for the engine",
        blurb: "The answer counts, and on its own it names no goal. Age and weight work this way.",
    },
    {
        id: "mapped", label: "Mapped to goals",
        blurb: "You name the goal behind every answer. The engine reads it as a hint.",
    },
]

export const takesOptions = (k: ChatQuestionKind) =>
    k === "single_choice" || k === "multi_choice"

export function rid(prefix = "id") {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

/** A slug is lower case, and uses hyphens. It is a path, so it holds no spaces. */
export function toSlug(v: string) {
    return v.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

/** A signal key is what the engine reads. Lower case, and it uses underscores. */
export function toKey(v: string) {
    return v.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
}

export function emptyQuestion(order: number): ChatQuestion {
    return {
        id: rid("q"), order, promptEn: "",
        kind: "single_choice", required: true, helpEn: "", options: [],
        routing: "off",
    }
}

export function emptyOption(): ChatOption {
    return { id: rid("o"), labelEn: "" }
}

export function emptyChat(kind: ChatKind): Chat {
    return {
        id: "", kind,
        nameEn: "",
        slug: "",
        surfaces: kind === "onboarding" ? ["website"] : ["app"],
        questions: [],
        status: "draft",
        goalId: undefined,
        target: kind === "goal" ? { kind: "protocol" } : undefined,
    }
}

export const modeOf = (q: ChatQuestion): ChatRoutingMode => q.routing ?? "off"

/** Every question that feeds the engine. There is no limit on how many. */
export const routingQuestions = (c: Chat) =>
    c.questions.filter(q => modeOf(q) !== "off")

/** The routing questions that name a goal per answer. */
export const mappedQuestions = (c: Chat) =>
    c.questions.filter(q => modeOf(q) === "mapped")

// ── What stops a chat going live ──────────────────────────────
//
// A draft may be incomplete. That is what a draft is for. These rules only
// block PUBLISH, and each one says what is missing and why it matters, because
// a refusal an author cannot act on reads as a broken button.
export interface ChatGap { what: string; why: string; section: string }

export function publishGaps(c: Chat): ChatGap[] {
    const out: ChatGap[] = []
    const empty = (v?: string) => !v || !v.trim()
    /* A goal chat has no routing section, so its routing gaps point at the
       questions, which is where an author would fix them. */
    const routeSection = c.kind === "onboarding" ? "routing" : "questions"

    if (empty(c.nameEn)) out.push({
        section: "identity",
        what: "The chat has no name",
        why: "Staff find it by name in the list. Without one the row is blank.",
    })

    /* Both kinds have a slug. A goal chat opens on its own from a landing
       page, from a campaign, or from a link a coach sends. */
    if (empty(c.slug)) out.push({
        section: "identity",
        what: "There is no slug",
        why: "The slug is what opens the chat. Without it nothing can link to it.",
    })
    if (!c.surfaces.length) out.push({
        section: "identity",
        what: "No surface is selected",
        why: "A chat that opens nowhere cannot be reached by a person.",
    })

    if (c.kind === "goal") {
        if (!c.goalId) out.push({
            section: "identity",
            what: "No goal is selected",
            why: "A goal chat belongs to one goal. The engine picks the goal, and the goal leads here.",
        })
        if (!c.target?.id) out.push({
            section: "destination",
            what: "No protocol is linked",
            why: "The chat ends without a destination, so the person answers questions and then stops.",
        })
    }

    if (!c.questions.length) out.push({
        section: "questions",
        what: "There are no questions",
        why: "An empty chat opens and closes. It collects nothing.",
    })

    c.questions.forEach((q, i) => {
        if (empty(q.promptEn)) out.push({
            section: "questions",
            what: `Question ${i + 1} has no text`,
            why: "The person would see an empty bubble.",
        })
        if (takesOptions(q.kind) && !q.options.length) out.push({
            section: "questions",
            what: `Question ${i + 1} has no answers`,
            why: "A choice question with no options cannot be answered, so the chat stops there.",
        })
        q.options.forEach((o, oi) => {
            if (empty(o.labelEn)) out.push({
                section: "questions",
                what: `Question ${i + 1}, answer ${oi + 1} has no text`,
                why: "The person would see an empty button.",
            })
        })

        const mode = modeOf(q)
        if (mode !== "off" && empty(q.signalKey)) out.push({
            section: routeSection,
            what: `Question ${i + 1} feeds the engine and has no key`,
            why: "The engine reads the key, not the question text. Without it the answer arrives unnamed.",
        })
        if (mode === "mapped") {
            const loose = q.options.filter(o => !o.goalId)
            if (loose.length) out.push({
                section: routeSection,
                what: `Question ${i + 1} is mapped and ${loose.length} answer${loose.length === 1 ? "" : "s"} name${loose.length === 1 ? "s" : ""} no goal`,
                why: "A mapped question states the goal behind every answer. Make it a factor instead, or fill the gaps.",
            })
        }
    })

    /* An onboarding chat exists to help the engine pick a goal. If nothing
       feeds the engine, the post carries answers and no factors. */
    if (c.kind === "onboarding" && c.questions.length && !routingQuestions(c).length) out.push({
        section: "routing",
        what: "Nothing feeds the recommendation engine",
        why: "Mark at least one question as a factor, or as mapped to goals.",
    })

    return out
}

// ── The contract ─────────────────────────────────────────────
//
// The consumer app collects the answers and posts one object. The engine reads
// it and picks the goal. The builder never picks the goal, because a goal
// often follows from several answers together and from no single answer alone.
//
// A worked example, from the seeded chat: a man of 24, at 50 kg, on a GLP-1
// medicine, and a man of 34 with the same three answers. The builder cannot
// state a goal for "age = 24". It states that age is a factor, and it sends
// the number. The engine holds the rule that separates the two people.

/** What the person picked. Option ids for a choice, typed text for the rest. */
export type ChatPicks = Record<string, string[]>

export function buildSubmission(
    chat: Chat,
    picks: ChatPicks,
    surface?: ChatSurface,
    at: string = new Date().toISOString(),
): ChatSubmission {
    const answers: ChatAnswerPayload[] = chat.questions.map(q => {
        const picked = picks[q.id] ?? []
        const choice = takesOptions(q.kind)
        const chosen = choice ? q.options.filter(o => picked.includes(o.id)) : []
        const mode = modeOf(q)

        const a: ChatAnswerPayload = {
            questionId: q.id,
            promptEn: q.promptEn,
            kind: q.kind,
            optionIds: chosen.map(o => o.id),
            values: choice ? chosen.map(o => o.labelEn) : picked,
            routing: mode,
        }
        if (mode !== "off" && q.signalKey) a.signalKey = q.signalKey
        if (mode === "mapped") {
            a.goalHints = chosen.map(o => o.goalId).filter((g): g is string => !!g)
        }
        return a
    })

    /* The hints are a tally and not a decision. Two answers naming the same
       goal say more than one, and the engine weighs that against the rest. */
    const tally = new Map<string, number>()
    answers.forEach(a => (a.goalHints ?? []).forEach(g =>
        tally.set(g, (tally.get(g) ?? 0) + 1)))

    return {
        chatId: chat.id || "(unsaved)",
        chatKind: chat.kind,
        chatSlug: chat.slug || undefined,
        surface: surface ?? chat.surfaces[0],
        goalId: chat.kind === "goal" ? chat.goalId : undefined,
        answers,
        goalHints: [...tally.entries()]
            .map(([goalId, hits]) => ({ goalId, hits }))
            .sort((x, y) => y.hits - x.hits),
        submittedAt: at,
    }
}

/**
 * One plausible run through the chat, so the author can read the real post.
 *
 * The number samples read the key, so a weight does not arrive as 24. It
 * shapes the PREVIEW only, and it has no part in the contract.
 */
function sampleNumber(q: ChatQuestion): string {
    const k = `${q.signalKey ?? ""} ${q.promptEn}`.toLowerCase()
    if (k.includes("weight") || k.includes("kg")) return "82"
    if (k.includes("height") || k.includes("cm")) return "175"
    return "24"
}

export function samplePicks(chat: Chat): ChatPicks {
    const out: ChatPicks = {}
    chat.questions.forEach(q => {
        if (takesOptions(q.kind)) {
            const first = q.options[0]
            if (first) out[q.id] = [first.id]
        } else if (q.kind === "number") {
            out[q.id] = [sampleNumber(q)]
        } else {
            out[q.id] = ["what the person typed"]
        }
    })
    return out
}

// ── The store ────────────────────────────────────────────────
//
// localStorage is external state, so components read it through
// useSyncExternalStore and not through an effect that copies it into state.
// That is the pattern SectionHelp already uses in this codebase, and the lint
// rules enforce it.
//
// The snapshot is CACHED. useSyncExternalStore compares the snapshot by
// reference, so a getSnapshot that parses JSON on every call returns a new
// array every time and renders for ever.

let cache: Chat[] | null = null
const EMPTY: Chat[] = []

function read(): Chat[] {
    if (typeof window === "undefined") return EMPTY
    if (cache) return cache
    try {
        const raw = window.localStorage.getItem(KEY)
        if (!raw) { cache = SEED; return cache }
        const parsed = JSON.parse(raw)
        cache = Array.isArray(parsed) ? (parsed as Chat[]) : SEED
    } catch {
        cache = SEED
    }
    return cache
}

const listeners = new Set<() => void>()

function write(list: Chat[]) {
    cache = list
    try { window.localStorage.setItem(KEY, JSON.stringify(list)) } catch { /* quota */ }
    listeners.forEach(fn => fn())
}

export const chatStore = {
    subscribe(fn: () => void) {
        listeners.add(fn)
        return () => { listeners.delete(fn) }
    },
    /** Stable reference until a write, which is what useSyncExternalStore needs. */
    getSnapshot(): Chat[] {
        return read()
    },
    /** The server has no localStorage. One stable empty array, never a new one. */
    getServerSnapshot(): Chat[] {
        return EMPTY
    },
    list(kind?: ChatKind): Chat[] {
        const all = read()
        return kind ? all.filter(c => c.kind === kind) : all
    },
    get(id: string): Chat | null {
        return read().find(c => c.id === id) ?? null
    },
    /** Saves and returns the stored record, so the caller learns the new id. */
    save(chat: Chat): Chat {
        const list = [...read()]
        const next: Chat = {
            ...chat,
            id: chat.id || rid(chat.kind === "onboarding" ? "onb" : "goal"),
            updatedAt: new Date().toISOString(),
            createdAt: chat.createdAt ?? new Date().toISOString(),
        }
        const at = list.findIndex(c => c.id === next.id)
        if (at === -1) list.push(next); else list[at] = next
        write(list)
        return next
    },
    remove(id: string) {
        write(read().filter(c => c.id !== id))
    },
    reset() {
        write(SEED)
    },
}

// ── Seed ─────────────────────────────────────────────────────
// One onboarding chat and one goal chat, both published, so the two lists are
// not empty on a first visit and the mapping between them is visible.
//
// The onboarding chat carries all three routing modes on purpose: one mapped
// question, four factors, and one question that plays no part. The four
// factors are the case the engine exists for.

const SEED: Chat[] = [
    {
        id: "onb-website-protocols",
        kind: "onboarding",
        nameEn: "Website protocols onboarding",
        slug: "website-protocols-onboarding",
        surfaces: ["website", "app"],
        status: "published",
        publishedAt: "2026-08-20T09:00:00.000Z",
        createdAt: "2026-08-18T09:00:00.000Z",
        questions: [
            {
                id: "q-open", order: 0, kind: "single_choice", required: true,
                promptEn: "What made you open this today?",
                helpEn: "The clearest hint in the chat, so keep the options far apart.",
                routing: "mapped", signalKey: "primary_concern",
                options: [
                    { id: "o-hurt", labelEn: "Something hurts, or will not heal", goalId: "jr-longevity" },
                    { id: "o-weight", labelEn: "The weight is not moving", goalId: "jr-weightloss" },
                    { id: "o-ahead", labelEn: "I want to get ahead of it", goalId: "jr-longevity" },
                ],
            },
            {
                id: "q-sex", order: 1, kind: "single_choice", required: true,
                promptEn: "What is your sex?",
                routing: "signal", signalKey: "sex",
                options: [
                    { id: "o-male", labelEn: "Male" },
                    { id: "o-female", labelEn: "Female" },
                ],
            },
            {
                id: "q-age", order: 2, kind: "number", required: true,
                promptEn: "How old are you?",
                helpEn: "A factor, and no single age picks a goal.",
                routing: "signal", signalKey: "age",
                options: [],
            },
            {
                id: "q-weight", order: 3, kind: "number", required: true,
                promptEn: "What do you weigh, in kilograms?",
                routing: "signal", signalKey: "weight_kg",
                options: [],
            },
            {
                id: "q-meds", order: 4, kind: "multi_choice", required: false,
                promptEn: "Are you taking any of these now?",
                routing: "signal", signalKey: "current_medicine",
                options: [
                    { id: "o-glp1", labelEn: "A GLP-1 medicine" },
                    { id: "o-bp", labelEn: "A blood pressure medicine" },
                    { id: "o-none", labelEn: "None of these" },
                ],
            },
            {
                id: "q-tried", order: 5, kind: "multi_choice", required: false,
                promptEn: "What have you already tried?",
                helpEn: "Useful for the coach. It plays no part in the decision.",
                routing: "off",
                options: [
                    { id: "o-nothing", labelEn: "Nothing yet" },
                    { id: "o-rest", labelEn: "Rest and time" },
                    { id: "o-supps", labelEn: "Supplements" },
                    { id: "o-doctor", labelEn: "A doctor, with no clear answer" },
                ],
            },
        ],
    },
    {
        id: "goal-weightloss",
        kind: "goal",
        nameEn: "Weight loss triage",
        slug: "weight-loss-triage",
        surfaces: ["app", "website"],
        goalId: "jr-weightloss",
        target: { kind: "protocol", id: "prot-glp1-wl" },
        status: "published",
        publishedAt: "2026-08-21T09:00:00.000Z",
        createdAt: "2026-08-19T09:00:00.000Z",
        questions: [
            {
                id: "q-wl-1", order: 0, kind: "single_choice", required: true,
                promptEn: "Have you taken a GLP-1 medicine before?",
                routing: "off",
                options: [
                    { id: "o-yes", labelEn: "Yes" },
                    { id: "o-no", labelEn: "No" },
                ],
            },
            {
                id: "q-wl-2", order: 1, kind: "multi_choice", required: false,
                promptEn: "Which of these apply to you?",
                routing: "off",
                options: [
                    { id: "o-t2d", labelEn: "Type 2 diabetes" },
                    { id: "o-bp2", labelEn: "High blood pressure" },
                    { id: "o-none2", labelEn: "None of these" },
                ],
            },
        ],
    },
]

// ── The React readers ────────────────────────────────────────

/**
 * Every chat, or every chat of one kind. It re-renders on a write from
 * anywhere, including another screen, because the store notifies its
 * subscribers rather than each screen holding a copy.
 */
export function useChats(kind?: ChatKind): Chat[] {
    const all = useSyncExternalStore(
        chatStore.subscribe, chatStore.getSnapshot, chatStore.getServerSnapshot,
    )
    return useMemo(() => (kind ? all.filter(c => c.kind === kind) : all), [all, kind])
}

/** One chat by id, or null while the id is unknown or the record is gone. */
export function useChat(id: string): Chat | null {
    const all = useSyncExternalStore(
        chatStore.subscribe, chatStore.getSnapshot, chatStore.getServerSnapshot,
    )
    return useMemo(() => all.find(c => c.id === id) ?? null, [all, id])
}

/**
 * True only after hydration. It exists because localStorage does not exist on
 * the server: the first client render has to match the server HTML, so a
 * screen that reads the store must render its waiting state until this turns
 * true. It is read as external state, so it never sets state inside an effect.
 */
const noopSubscribe = () => () => {}
export function useHydrated(): boolean {
    return useSyncExternalStore(noopSubscribe, () => true, () => false)
}
