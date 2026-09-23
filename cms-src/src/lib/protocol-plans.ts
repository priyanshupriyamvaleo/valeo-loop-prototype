// ── The plan store, the page rules, and the bridge from the steps ──────────
//
// A plan is the patient-facing page of a protocol. This file holds three
// things, and nothing about React layout:
//
//   1. THE STORE    a prototype store in localStorage, keyed by protocol id.
//   2. THE RULES    what stops a page going live. Draft is never blocked.
//   3. THE BRIDGE   the steps are the source of truth for what is delivered,
//                   so the page can be built from them and checked against
//                   them. That is what makes "steps first" useful instead of
//                   merely enforced.
//
// WHY THE PLAN LIVES IN ITS OWN STORE: protocols are served by mockFetch and
// they do not persist, so a draft would vanish on a reload. The plan is new
// work, so it gets a store that survives one. A content-service endpoint
// replaces this file and no screen changes.

import { useMemo, useSyncExternalStore } from "react"
import { BLOCK_LABELS } from "@/lib/content-audit"
import { actorLabel } from "@/lib/protocol-chain"
import type {
    PageBlock, PageBlockItem, PlanSeoFolder, PlanSeoHandling, Protocol, ProtocolPlan,
    ProtocolStep,
} from "@/types"

const KEY = "valeo_cms_protocol_plans_v1"

export const SEO_HANDLING: { id: PlanSeoHandling; label: string }[] = [
    { id: "country", label: "Country" },
    { id: "city", label: "City" },
    { id: "global", label: "Global" },
]

/**
 * ONE FOLDER. Every protocol page sits under /protocols/, so the list holds one
 * entry and the dropdown offers one choice.
 */
export const SEO_FOLDERS: { id: PlanSeoFolder; label: string; path: string }[] = [
    { id: "protocols", label: "protocols", path: "protocols/" },
]

/**
 * The folder a plan resolves to, which falls back to the only entry rather than
 * to an empty path. A plan saved before this change carries the old value
 * `"programs"`, which the list no longer holds — without the fallback that plan
 * would lose its folder from its url, and its dropdown would render blank.
 */
export const folderOf = (plan: ProtocolPlan) =>
    SEO_FOLDERS.find(f => f.id === plan.seoFolder) ?? SEO_FOLDERS[0]

export const SITE_ROOT = "valeo.health/"

const rid = () => Math.random().toString(36).slice(2, 9)

/** A slug is lower case, and uses hyphens. It is a path, so it holds no spaces. */
export function toSlug(v: string) {
    return v.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

/** The address a patient would type, printed the way the page list prints it. */
export function planUrl(plan: ProtocolPlan): string {
    return `${SITE_ROOT}${folderOf(plan).path}${plan.slug || "…"}`
}

export function emptyPlan(): ProtocolPlan {
    return {
        status: "draft",
        pageName: "",
        watermarkUrl: "",
        slug: "",
        seoFolder: "protocols",
        seoHandling: "country",
        seoTitleEn: "", seoTitleAr: "",
        seoDescriptionEn: "", seoDescriptionAr: "",
        isIndexable: true,
        isFollowable: true,
        blocks: [],
    }
}

// ── What stops a page going live ─────────────────────────────
//
// The same shape the chat builder uses, so a refusal reads the same way in
// both builders: what is missing, why it matters, and which section fixes it.

/**
 * `blocksDraft` marks the one rule that holds even for an Inactive page.
 *
 * It exists because "which rules apply to a draft" is a property of the RULE
 * and not of the tab it lives on. Inferring it from the section put the
 * protocol-status rule, which sits on Template, in front of every draft save.
 */
export interface PlanGap {
    what: string
    why: string
    section: string
    blocksDraft?: boolean
    /**
     * Where to send the operator when the fix is NOT on this screen — a missing
     * city price is authored in the listing, not here.
     *
     * The listing editor already learned this on `ActivationRequirement`
     * (catalogue.ts): without it a refusal can be unmeetable, because its chip
     * navigates to a section that has no control for the thing it names.
     */
    href?: string
}

/** The rules that apply whatever the status. Only the name is one of them. */
export const draftGaps = (gaps: PlanGap[]) => gaps.filter(g => g.blocksDraft)

export function planPublishGaps(plan: ProtocolPlan, protocol: Protocol): PlanGap[] {
    const out: PlanGap[] = []
    const empty = (v?: string) => !v || !v.trim()

    /* The only rule an Inactive page cannot escape: the list shows a name. */
    if (empty(plan.pageName)) out.push({
        section: "template",
        blocksDraft: true,
        what: "The page has no name",
        why: "Staff find the page by name in the list. Without one the row is blank.",
    })

    if (empty(plan.slug)) out.push({
        section: "seo",
        what: "There is no SEO url",
        why: "The url is the address. Without it nothing can link to the page.",
    })
    if (empty(plan.seoTitleEn)) out.push({
        section: "seo",
        what: "There is no meta title",
        why: "A search result shows the meta title. Without one the entry is blank.",
    })
    if (empty(plan.seoTitleAr)) out.push({
        section: "seo",
        what: "There is no Arabic meta title",
        why: "The Arabic site indexes on this field. It is required on the live screen.",
    })
    if (empty(plan.seoDescriptionEn)) out.push({
        section: "seo",
        what: "There is no meta description",
        why: "A search result shows the description under the title.",
    })
    if (empty(plan.seoDescriptionAr)) out.push({
        section: "seo",
        what: "There is no Arabic meta description",
        why: "It is required on the live screen, beside the English one.",
    })

    const active = plan.blocks.filter(b => b.isActive)
    if (!active.length) out.push({
        section: "widgets",
        what: "The page has no active widget",
        why: "An empty page opens and shows nothing.",
    })
    const heroes = active.filter(b => b.type === "HERO_SECTION")
    if (heroes.length !== 1) out.push({
        section: "widgets",
        what: heroes.length ? `There are ${heroes.length} hero widgets` : "There is no hero widget",
        why: "A live page needs exactly one hero, because the hero carries the page H1.",
    })

    /* The page describes what the steps deliver. With no steps it describes
       nothing, so this rule points back at the first stage. */
    if (!protocol.steps.length) out.push({
        section: "widgets",
        what: "The protocol has no steps",
        why: "The page sells what the steps deliver. Build the steps first.",
    })

    /**
     * ONE DIRECTION ONLY.
     *
     * A protocol may be live while its page is a draft: a coach can run a
     * programme that has no shop window. The reverse is a sale of something
     * nobody signed off, so the page waits for the protocol.
     *
     * This costs an author nothing. A finished page that waits for clinical
     * sign-off is exactly what a draft is, and the draft survives a reload.
     */
    if (protocol.status !== "active") out.push({
        section: "template",
        what: `The protocol is a ${protocol.status}, and it is not live`,
        why: "A live page sells this programme. Publish the protocol first, or the page offers something nobody signed off.",
    })

    return out
}

// ── The bridge: the steps are the source of truth ────────────

/** Every listing the steps link, in step order and without repeats. */
export function stepListingIds(steps: ProtocolStep[]): string[] {
    const out: string[] = []
    ;[...steps].sort((a, b) => a.order - b.order).forEach(s => {
        const id = s.linkedUnit?.listingId
        if (id && !out.includes(id)) out.push(id)
    })
    return out
}

/**
 * DRIFT: what the steps deliver, against what the page sells.
 *
 * This is the check that earns its place. A page that sells a listing no step
 * delivers takes money for nothing, and a step whose listing the page never
 * names is work the patient did not buy.
 */
export interface PlanDrift {
    /** Linked by a step, and named by no product list on the page. */
    missingFromPage: string[]
    /** Named by a product list, and linked by no step. */
    extraOnPage: string[]
    stepsWithNoListing: ProtocolStep[]
}

export function planDrift(plan: ProtocolPlan, steps: ProtocolStep[]): PlanDrift {
    const fromSteps = stepListingIds(steps)
    const onPage = [...new Set(plan.blocks
        .filter(b => b.isActive && b.type === "PRODUCT_LIST")
        .flatMap(b => b.config.listingIds ?? []))]

    return {
        missingFromPage: fromSteps.filter(id => !onPage.includes(id)),
        extraOnPage: onPage.filter(id => !fromSteps.includes(id)),
        stepsWithNoListing: steps.filter(s => !s.linkedUnit),
    }
}

/**
 * Builds the three blocks the steps can fill in on their own, and leaves every
 * other block alone.
 *
 *   HERO_SECTION      created empty when the page has none, because a page
 *                     needs exactly one and the words are a human's job.
 *   STEPS_TO_FOLLOW   one item per step: the step title, and who does it.
 *                     Not a week — a patient starts when they buy, so a page
 *                     that promises "Week 6" is wrong for almost all of them.
 *   PRODUCT_LIST      every listing the steps link, so the page sells what the
 *                     plan delivers and nothing else.
 *
 * It REPLACES the content of those two derived blocks rather than merging,
 * because a half-updated list of steps is worse than a rebuilt one.
 */
export function buildFromSteps(plan: ProtocolPlan, protocol: Protocol): ProtocolPlan {
    const steps = [...protocol.steps].sort((a, b) => a.order - b.order)
    let blocks = [...plan.blocks]

    const add = (block: PageBlock) => { blocks = [...blocks, block] }
    const nextRank = () => blocks.length

    if (!blocks.some(b => b.type === "HERO_SECTION")) {
        add({
            id: rid(), type: "HERO_SECTION", internalName: "Hero",
            rank: nextRank(), isActive: true,
            config: {
                headingEn: protocol.nameEn,
                headingAr: protocol.nameAr,
                subheadingEn: "", subheadingAr: "",
                ctaType: "REDIRECTION",
                ctaLabelEn: "", ctaLabelAr: "", ctaHref: "",
                ctaSideTextEn: "", ctaSideTextAr: "",
                priceLabel: "", priceLabelAr: "",
                imageUrl: "", imageAltEn: "", imageAltAr: "",
            },
        })
    }

    const items: PageBlockItem[] = steps.map((s, i) => ({
        id: rid(),
        titleEn: s.titleEn,
        titleAr: s.titleAr ?? "",
        /* Who does it, which is true for every patient. */
        textEn: actorLabel(s.actor),
        textAr: "",
        rank: i,
    }))

    const stepsBlock = blocks.find(b => b.type === "STEPS_TO_FOLLOW")
    if (stepsBlock) {
        blocks = blocks.map(b => b.id === stepsBlock.id
            ? { ...b, config: { ...b.config, items } } : b)
    } else {
        add({
            id: rid(), type: "STEPS_TO_FOLLOW", internalName: "How it works",
            rank: nextRank(), isActive: true,
            config: { headingEn: "How it works", headingAr: "", items },
        })
    }

    const listingIds = stepListingIds(steps)
    const listBlock = blocks.find(b => b.type === "PRODUCT_LIST")
    if (listBlock) {
        blocks = blocks.map(b => b.id === listBlock.id
            ? { ...b, config: { ...b.config, listingIds } } : b)
    } else {
        add({
            id: rid(), type: "PRODUCT_LIST", internalName: "What is included",
            rank: nextRank(), isActive: true,
            config: { headingEn: "What is included", headingAr: "", listingIds },
        })
    }

    return { ...plan, blocks: blocks.map((b, i) => ({ ...b, rank: i })) }
}

// ── Copy coverage ────────────────────────────────────────────
//
// The words inside a component belong to that component, so there is no second
// place to edit them. What a copywriter needs in ONE place is the list of what
// is still empty, and the list of what English has and Arabic does not.

export interface CopyGap {
    blockId: string
    blockLabel: string
    field: string
    kind: "empty" | "untranslated"
}

/** The page-level and per-component text pairs, named the way an author reads them. */
export function copyGaps(plan: ProtocolPlan): CopyGap[] {
    const out: CopyGap[] = []

    const check = (
        blockId: string, blockLabel: string, field: string, en?: string, ar?: string,
    ) => {
        const hasEn = !!en?.trim()
        const hasAr = !!ar?.trim()
        if (!hasEn) out.push({ blockId, blockLabel, field, kind: "empty" })
        else if (!hasAr) out.push({ blockId, blockLabel, field, kind: "untranslated" })
    }

    plan.blocks.filter(b => b.isActive).forEach(b => {
        const label = b.internalName?.trim() || BLOCK_LABELS[b.type]
        const c = b.config
        if (b.type === "HERO_SECTION") {
            check(b.id, label, "Heading", c.headingEn, c.headingAr)
            check(b.id, label, "CTA label", c.ctaLabelEn, c.ctaLabelAr)
        } else {
            check(b.id, label, "Heading", c.headingEn, c.headingAr)
        }
        if (c.subheadingEn !== undefined || c.subheadingAr !== undefined) {
            if (c.subheadingEn?.trim() && !c.subheadingAr?.trim()) {
                out.push({ blockId: b.id, blockLabel: label, field: "Subheading", kind: "untranslated" })
            }
        }
        ;(c.items ?? []).forEach((it, i) => {
            check(b.id, label, `Item ${i + 1} title`, it.titleEn, it.titleAr)
        })
        ;(c.faq ?? []).forEach((f, i) => {
            check(b.id, label, `Question ${i + 1}`, f.questionEn, f.questionAr)
            check(b.id, label, `Answer ${i + 1}`, f.answerEn, f.answerAr)
        })
        ;(c.testimonials ?? []).forEach((t, i) => {
            check(b.id, label, `Testimonial ${i + 1} quote`, t.quoteEn, t.quoteAr)
        })
    })

    return out
}

// ── The store ────────────────────────────────────────────────
//
// One record per protocol id. localStorage is external state, so it is read
// through useSyncExternalStore and never copied into state inside an effect.
// The snapshot is cached, because useSyncExternalStore compares by reference.

type PlanMap = Record<string, ProtocolPlan>

let cache: PlanMap | null = null
const EMPTY: PlanMap = {}

function read(): PlanMap {
    if (typeof window === "undefined") return EMPTY
    if (cache) return cache
    try {
        const raw = window.localStorage.getItem(KEY)
        if (!raw) { cache = SEED; return cache }
        const parsed = JSON.parse(raw)
        cache = (parsed && typeof parsed === "object") ? (parsed as PlanMap) : SEED
    } catch {
        cache = SEED
    }
    return cache
}

const listeners = new Set<() => void>()

function write(next: PlanMap) {
    cache = next
    try { window.localStorage.setItem(KEY, JSON.stringify(next)) } catch { /* quota */ }
    listeners.forEach(fn => fn())
}

export const planStore = {
    subscribe(fn: () => void) {
        listeners.add(fn)
        return () => { listeners.delete(fn) }
    },
    getSnapshot(): PlanMap { return read() },
    getServerSnapshot(): PlanMap { return EMPTY },
    get(protocolId: string): ProtocolPlan | null {
        return read()[protocolId] ?? null
    },
    save(protocolId: string, plan: ProtocolPlan) {
        write({ ...read(), [protocolId]: plan })
    },
    remove(protocolId: string) {
        const next = { ...read() }
        delete next[protocolId]
        write(next)
    },
    reset() { write(SEED) },
}

// ── The React readers ────────────────────────────────────────

/** The stored plan for one protocol, or null when nothing is stored yet. */
export function usePlan(protocolId: string): ProtocolPlan | null {
    const all = useSyncExternalStore(
        planStore.subscribe, planStore.getSnapshot, planStore.getServerSnapshot,
    )
    return useMemo(() => all[protocolId] ?? null, [all, protocolId])
}

/** Every stored plan, for the list screen. */
export function usePlans(): PlanMap {
    return useSyncExternalStore(
        planStore.subscribe, planStore.getSnapshot, planStore.getServerSnapshot,
    )
}

/**
 * True only after hydration. localStorage does not exist on the server, so a
 * screen that reads the store shows its waiting state until this turns true.
 */
const noopSubscribe = () => () => {}
export function useHydrated(): boolean {
    return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

// ── Seed ─────────────────────────────────────────────────────
// One published page, for the GLP-1 protocol, so the screens are not empty on
// a first visit and the bridge from the steps is visible. Its product list
// names the four listings that protocol's steps link.

const SEED: PlanMap = {
    "prot-glp1-wl": {
        status: "published",
        publishedAt: "2026-08-25T09:00:00.000Z",
        pageName: "Weight Loss GLP-1 Programme",
        watermarkUrl: "",
        slug: "weight-loss-glp1-programme",
        seoFolder: "protocols",
        seoHandling: "country",
        seoTitleEn: "Doctor-led GLP-1 weight loss programme in the UAE | Valeo",
        seoTitleAr: "برنامج خسارة الوزن GLP-1 بإشراف طبي في الإمارات | فاليو",
        seoDescriptionEn: "A clinician builds your titration plan from your own blood work, and a coach follows it with you for twelve weeks.",
        seoDescriptionAr: "يبني الطبيب خطة العلاج من تحاليل دمك، ويتابعها معك المدرب لمدة اثني عشر أسبوعاً.",
        isIndexable: true,
        isFollowable: true,
        blocks: [
            {
                id: "pb-hero", type: "HERO_SECTION", internalName: "Hero", rank: 0, isActive: true,
                config: {
                    headingEn: "Doctor-led weight loss with GLP-1",
                    headingAr: "خسارة الوزن بإشراف طبي مع GLP-1",
                    subheadingEn: "Your titration plan comes from your own blood work, not from a template.",
                    subheadingAr: "خطة العلاج من تحاليل دمك، لا من قالب جاهز.",
                    ctaType: "REDIRECTION",
                    ctaLabelEn: "Book your consultation",
                    ctaLabelAr: "احجز استشارتك",
                    ctaHref: "/chat/website-protocols-onboarding",
                    ctaSideTextEn: "Consultation fee waived",
                    ctaSideTextAr: "بدون رسوم استشارة",
                    priceLabel: "From AED 1,200 / month",
                    priceLabelAr: "من 1,200 درهم / شهرياً",
                    imageUrl: "", imageAltEn: "", imageAltAr: "",
                },
            },
            {
                id: "pb-steps", type: "STEPS_TO_FOLLOW", internalName: "How it works", rank: 1, isActive: true,
                config: {
                    headingEn: "How it works", headingAr: "كيف يعمل",
                    items: [
                        { id: "pi-1", titleEn: "Initial doctor consultation", titleAr: "استشارة الطبيب الأولية", textEn: "Once", textAr: "مرة واحدة", rank: 0 },
                        { id: "pi-2", titleEn: "Baseline metabolic blood panel", titleAr: "تحليل الدم الأيضي الأساسي", textEn: "Once", textAr: "مرة واحدة", rank: 1 },
                        { id: "pi-3", titleEn: "Semaglutide (GLP-1) titration", titleAr: "معايرة سيماغلوتيد", textEn: "Weekly × 12", textAr: "أسبوعياً × 12", rank: 2 },
                        { id: "pi-4", titleEn: "Monthly progress review", titleAr: "مراجعة التقدم الشهرية", textEn: "Monthly × 3", textAr: "شهرياً × 3", rank: 3 },
                    ],
                },
            },
            {
                id: "pb-list", type: "PRODUCT_LIST", internalName: "What is included", rank: 2, isActive: true,
                config: {
                    headingEn: "What is included", headingAr: "ما يتضمنه البرنامج",
                    /* The same items the steps deliver, so the page and the
                       package cannot describe different programmes. */
                    listingIds: [
                        "demo-panel-recovery", "demo-consult-peptide",
                        "demo-voucher-supp", "demo-med-bpc",
                        "demo-consult-gp", "demo-followup-review",
                    ],
                },
            },
            {
                id: "pb-faq", type: "FAQ", internalName: "FAQ", rank: 3, isActive: true,
                config: {
                    headingEn: "Questions people ask", headingAr: "أسئلة شائعة",
                    faq: [
                        {
                            sortOrder: 0,
                            questionEn: "Do I need a prescription?",
                            questionAr: "هل أحتاج وصفة طبية؟",
                            answerEn: "Yes. The doctor writes it after the consultation and the blood work.",
                            answerAr: "نعم. يكتبها الطبيب بعد الاستشارة والتحاليل.",
                        },
                    ],
                },
            },
        ],
    },
}
