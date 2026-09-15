// ── AI go-live content audit (prototype, deterministic mock) ──────────────────
// A pure, framework-free module that inspects a composed journey page the way a
// search crawler would see it: enabled blocks in rank order, RTE fields expanded
// to plain text, concatenated for whole-page checks. No real model is called —
// the "AI" is a small set of deterministic checks (spelling map + SEO/structure
// heuristics) so the result is stable and testable.

import type { PageBlock, PageBlockType } from "@/types"

export interface AuditFinding {
    id: string
    severity: "error" | "warning"
    category: "spelling" | "seo" | "structure"
    message: string
    componentLabel?: string
    blocking: boolean
}

export interface AuditResult {
    findings: AuditFinding[]
    h1Count: number
    wordCount: number
    canPublish: boolean
}

// Human-readable labels, mirrored from the page-builder registry. Kept local so
// this module stays pure (the registry is a "use client" module full of React).
export const BLOCK_LABELS: Record<PageBlockType, string> = {
    HERO_SECTION: "Hero",
    USP: "USPs",
    TRUST_SECTION: "Trust",
    STEPS_TO_FOLLOW: "Steps to follow",
    PRODUCT_LIST: "Product list",
    FAQ: "FAQ",
    CONTACT_US: "Contact us",
    COMPARISON_WIDGET: "Comparison",
    IMAGE_TESTIMONIALS: "Image testimonials",
    BMI: "BMI calculator",
    FEATURE_LIST: "Feature list",
    CUSTOMER_PROFILE: "Customer profile",
}

// A small, illustrative dictionary. Real build would swap in a proper checker.
const COMMON_MISSPELLINGS: Record<string, string> = {
    recieve: "receive",
    seperate: "separate",
    occured: "occurred",
    definately: "definitely",
    wich: "which",
    teh: "the",
    accomodate: "accommodate",
    thier: "their",
}

// Strip HTML tags from an RTE field to the plain text a crawler indexes.
function stripHtml(value: string | undefined): string {
    if (!value) return ""
    return value
        .replace(/<[^>]*>/g, " ")   // drop tags
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim()
}

// Collect the human-readable text a single block contributes to the page, in the
// primary (EN) language a crawler reads. RTE/body fields are HTML-stripped.
function collectBlockText(block: PageBlock): string {
    const c = block.config
    const parts: (string | undefined)[] = [
        c.headingEn,
        c.subheadingEn,
        stripHtml(c.bodyEn),
        c.priceLabel,
        c.ctaLabelEn,
        c.statsTitleEn,
        c.contactHoursEn,
        c.disclaimerEn,
    ]

    for (const it of c.items ?? []) {
        parts.push(it.titleEn, stripHtml(it.textEn))
    }
    for (const f of c.faq ?? []) {
        parts.push(f.questionEn, stripHtml(f.answerEn))
    }
    for (const t of c.testimonials ?? []) {
        parts.push(t.nameEn, t.quoteEn)
    }
    for (const s of c.stats ?? []) {
        parts.push(s.value, s.labelEn)
    }
    if (c.comparison) {
        parts.push(c.comparison.valeoTitleEn, c.comparison.otherTitleEn)
        for (const r of c.comparison.rows ?? []) parts.push(r.textEn)
    }

    return parts
        .filter((p): p is string => !!p && p.trim().length > 0)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim()
}

function countWords(text: string): number {
    const trimmed = text.trim()
    if (!trimmed) return 0
    return trimmed.split(/\s+/).length
}

/**
 * Audit a composed journey page.
 *
 * Enabled blocks (isActive) are read in rank order; each block's human text is
 * collected (RTE stripped to plain text) and concatenated for whole-page checks.
 * The single-H1 rule is enforced: the page H1 is the enabled Hero section.
 */
export function auditJourneyPage(blocks: PageBlock[]): AuditResult {
    const findings: AuditFinding[] = []

    // Enabled blocks, crawler order.
    const enabled = [...blocks]
        .filter(b => b.isActive)
        .sort((a, b) => a.rank - b.rank)

    // Per-block text + the fully-composed page text.
    const blockText = new Map<string, string>()
    for (const b of enabled) blockText.set(b.id, collectBlockText(b))
    const composed = enabled.map(b => blockText.get(b.id) ?? "").join(" ").replace(/\s+/g, " ").trim()
    const wordCount = countWords(composed)

    const labelOf = (b: PageBlock) => b.internalName?.trim() || BLOCK_LABELS[b.type]

    // ── Structure: single-H1 rule (enforced, blocking) ──
    const heroes = enabled.filter(b => b.type === "HERO_SECTION")
    const h1Count = heroes.length
    if (h1Count !== 1) {
        findings.push({
            id: "structure-h1-count",
            severity: "error",
            category: "structure",
            message: `A live page must have exactly one H1 — provided by a single enabled Hero section. Found ${h1Count}.`,
            componentLabel: BLOCK_LABELS.HERO_SECTION,
            blocking: true,
        })
    }

    // ── SEO: hero heading + hero image ──
    const hero = heroes[0]
    if (hero) {
        if (!hero.config.headingEn?.trim()) {
            findings.push({
                id: "seo-hero-heading",
                severity: "warning",
                category: "seo",
                message: "Hero has no heading text — the page H1 is empty.",
                componentLabel: labelOf(hero),
                blocking: false,
            })
        }
        if (!hero.config.imageUrl?.trim()) {
            findings.push({
                id: "seo-hero-image",
                severity: "warning",
                category: "seo",
                message: "Hero image is missing — crawlers and social previews have no lead image.",
                componentLabel: labelOf(hero),
                blocking: false,
            })
        }
    }

    // ── Structure: thin (empty) blocks ──
    for (const b of enabled) {
        const text = blockText.get(b.id) ?? ""
        if (text.length === 0) {
            findings.push({
                id: `structure-thin-${b.id}`,
                severity: "warning",
                category: "structure",
                message: `Thin content in ${labelOf(b)} — this enabled block contributes no readable text.`,
                componentLabel: labelOf(b),
                blocking: false,
            })
        }
    }

    // ── SEO: thin whole page ──
    if (wordCount < 40) {
        findings.push({
            id: "seo-thin-page",
            severity: "warning",
            category: "seo",
            message: `Thin page — crawlers may see little content (${wordCount} words). Aim for richer copy.`,
            blocking: false,
        })
    }

    // ── Spelling: scan each block's text against the misspelling map ──
    for (const b of enabled) {
        const text = blockText.get(b.id) ?? ""
        if (!text) continue
        const seen = new Set<string>()
        const words = text.toLowerCase().match(/[a-z']+/g) ?? []
        for (const w of words) {
            if (COMMON_MISSPELLINGS[w] && !seen.has(w)) {
                seen.add(w)
                findings.push({
                    id: `spelling-${b.id}-${w}`,
                    severity: "warning",
                    category: "spelling",
                    message: `Possible misspelling "${w}" → "${COMMON_MISSPELLINGS[w]}".`,
                    componentLabel: labelOf(b),
                    blocking: false,
                })
            }
        }
    }

    const canPublish = !findings.some(f => f.blocking)

    return { findings, h1Count, wordCount, canPublish }
}
