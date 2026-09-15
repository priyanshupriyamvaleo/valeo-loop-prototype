import type { MediaRowWrite } from "./products"
// ── Listing ↔ content-service mapping ─────────────────────────
// The prototype and the API disagree in three structural ways, and every
// conversion below is one of them:
//   1. localised text  — flat `xxxEn`/`xxxAr` keys here, `{ en, ar }` there
//   2. countries       — string enum ("UAE") here, numeric id (1) there
//   3. sub-departments — slug id ("sd-prod-supp") here, numeric id (2) there
// Ids 2/3 are resolved at runtime from /departments and /countries, never hardcoded.

import type { Country, Listing } from "@/types"
import { SUB_DEPARTMENT_CODES } from "@/lib/taxonomy"
import type {
    AvailabilityRequest,
    ClassificationRequest,
    ComparisonWire,
    ContentRequest,
    CustomerReviewsWire,
    FaqsRequest,
    FrequencyType,
    HowToUseWire,
    IdentityRequest,
    InfluencerVideosWire,
    LocalizedText,
    RecommendationsRequest,
    StatsWire,
    Status,
    SubscriptionPlanInput,
    SubscriptionRequest,
    VariantAxesRequest,
    VariantMarketRequest,
    WhySuperiorWire,
} from "./types"

// ── Primitives ────────────────────────────────────────────────

/** Flat EN/AR pair → { en, ar }. Omits the key entirely when both are blank. */
export function loc(en?: string, ar?: string): LocalizedText | undefined {
    const e = (en ?? "").trim()
    const a = (ar ?? "").trim()
    if (!e && !a) return undefined
    const out: LocalizedText = {}
    if (e) out.en = e
    if (a) out.ar = a
    return out
}

/** { en, ar } → flat pair, for reading a section back into the editor. */
export const unloc = (t?: LocalizedText | null) => ({ en: t?.en ?? "", ar: t?.ar ?? "" })

/** Local lowercase status → the API's uppercase enum. */
export const toStatus = (s?: string): Status => (s === "active" ? "ACTIVE" : "INACTIVE")
export const fromStatus = (s?: Status): "active" | "inactive" => (s === "ACTIVE" ? "active" : "inactive")

/** ISO code per local country enum — the join key against /countries. */
const COUNTRY_ISO: Record<string, string> = {
    UAE: "AE", KSA: "SA", QATAR: "QA", KUWAIT: "KW", OTHERS: "Others",
}

export type CountryLookup = { id: number; code: string }[]

export function countryId(country: Country, countries: CountryLookup): number | undefined {
    const iso = COUNTRY_ISO[country as string]
    return countries.find(c => c.code === iso)?.id
}

export function countryFromId(id: number, countries: CountryLookup): Country | undefined {
    const iso = countries.find(c => c.id === id)?.code
    const entry = Object.entries(COUNTRY_ISO).find(([, v]) => v === iso)
    return entry?.[0] as Country | undefined
}

/**
 * Local sub-department slug id → `departments.code`, the join with the API.
 *
 * Derived from src/lib/taxonomy.ts rather than written out here. The hand-written
 * map this replaces had THREE entries and all three slugs were stale
 * ("sd-prod-supp", "sd-prod-medicine", "sd-prod-wearable"; the real ids are
 * "sd-health_products-supplements" and friends), so subDepartmentId() returned
 * undefined for every sub-department, toClassification() returned null, and every
 * save failed with "Choose a sub-department before saving." A second copy of a
 * list is how that happens; there is now one copy.
 */
const SUBDEPT_CODE: Record<string, string> = SUB_DEPARTMENT_CODES

export type SubDeptLookup = { id: number; code: string }[]

export function subDepartmentId(localId: string, subs: SubDeptLookup): number | undefined {
    const code = SUBDEPT_CODE[localId]
    return code ? subs.find(s => s.code === code)?.id : undefined
}

export function subDepartmentLocalId(apiId: number, subs: SubDeptLookup): string | undefined {
    const code = subs.find(s => s.id === apiId)?.code
    return Object.entries(SUBDEPT_CODE).find(([, v]) => v === code)?.[0]
}

// ── Section builders (Listing → API request) ──────────────────

export function toClassification(l: Listing, subs: SubDeptLookup): ClassificationRequest | null {
    const sdId = subDepartmentId(l.subDepartmentId, subs)
    if (!sdId) return null
    const internal = Number(l.internalCategoryId)
    return {
        subDepartmentId: sdId,
        isVisibleApp: l.visibleOn === "both" || l.visibleOn === "app",
        isVisibleWeb: l.visibleOn === "both" || l.visibleOn === "web",
        internalCategoryId: Number.isFinite(internal) && internal > 0 ? internal : null,
    }
}

export function toIdentity(l: Listing): IdentityRequest {
    const brandId = Number(l.brandId)
    return {
        internalName: l.internalName?.slice(0, 100) || undefined,
        name: loc(l.displayNameEn, l.displayNameAr),
        brandId: Number.isFinite(brandId) && brandId > 0 ? brandId : null,
    }
}

export function toContent(l: Listing): ContentRequest {
    return {
        shortDescription: loc(l.shortDescriptionEn, l.shortDescriptionAr),
        description: loc(l.descriptionEn, l.descriptionAr),
        keyIngredients: loc(l.keyIngredientsEn, l.keyIngredientsAr),
        keyHighlights: loc(l.keyHighlightsEn, l.keyHighlightsAr),
        disclaimer: loc(l.disclaimerEn, l.disclaimerAr),
        mechanism: loc(l.mechanismEn, l.mechanismAr),
        // Science / Research is its own attribute, not an alias of mechanism. Mechanism is "how
        // it works"; this is the evidence behind it, and collapsing them lost the distinction.
        science: loc(l.scienceBlockEn, l.scienceBlockAr),
        usageInstructions: loc(l.usageInstructionsEn, l.usageInstructionsAr),
        storageInstructions: loc(l.storageInstructionsEn, l.storageInstructionsAr),
        benefits: (l.benefits ?? []).map(b => ({
            icon: b.iconKey?.slice(0, 40) || undefined,
            label: loc(b.labelEn, b.labelAr),
            desc: loc(b.descriptionEn, b.descriptionAr),
        })),
        ingredients: (l.ingredients ?? []).map(i => ({
            name: loc(i.nameEn, i.nameAr),
            amount: Number.isFinite(i.amount) ? i.amount : null,
            unit: i.unit?.slice(0, 20) || undefined,
            dvPercent: i.dailyValuePct ?? null,
        })),
    }
}

export function toFaqs(l: Listing): FaqsRequest {
    return {
        items: (l.faq ?? []).map(f => ({
            faqId: f.faqId,
            question: loc(f.questionEn, f.questionAr),
            answer: loc(f.answerEn, f.answerAr),
            status: "ACTIVE" as Status,
        })),
    }
}

export function toVariantAxes(l: Listing): VariantAxesRequest {
    return {
        axes: (l.variantOptions ?? []).map(o => ({
            axisId: o.axisId,
            code: o.kind,
            name: loc(o.nameEn, o.nameAr),
            status: "ACTIVE" as Status,
            values: (o.values ?? []).map(v => ({
                valueId: v.valueId,
                name: loc(v.valueEn, v.valueAr),
                status: v.isActive === false ? ("INACTIVE" as Status) : ("ACTIVE" as Status),
            })),
        })),
    }
}

/** Per-country availability. The API splits coupon handling into two flags. */
export function toAvailability(cfg: {
    status?: string
    isCodEligible?: boolean
    isCouponDiscountBlocked?: boolean
    isCouponThresholdExcluded?: boolean
    isSubscriptionEnabled?: boolean
    isSubscriptionAutoSelected?: boolean
    subscriptionMinCycles?: number
}): AvailabilityRequest {
    return {
        status: toStatus(cfg.status),
        isCodEligible: !!cfg.isCodEligible,
        isCouponDiscountBlocked: !!cfg.isCouponDiscountBlocked,
        isCouponThresholdExcluded: !!cfg.isCouponThresholdExcluded,
        // Both are @NotNull server-side, so they must be SENT, not merely typed. Coerced
        // rather than passed through: undefined would serialise as an absent key and fail
        // validation on a country whose row predates these fields.
        isSubscriptionEnabled: !!cfg.isSubscriptionEnabled,
        // Never true while the previous flag is false — the service refuses that pair with a
        // 422, and sending it would turn a UI state the operator cannot even reach into an error.
        isSubscriptionAutoSelected: !!cfg.isSubscriptionEnabled && !!cfg.isSubscriptionAutoSelected,
        // absent = leave the stored commitment alone; the five flags stay total statements
        subscriptionMinCycles: cfg.subscriptionMinCycles ?? undefined,
    }
}

export function toVariantMarket(r: {
    sku?: string
    price?: number
    retailPrice?: number
    isAvailable?: boolean
}, tiers: { minQuantity: number; discountPct: number }[] = []): VariantMarketRequest {
    return {
        sku: (r.sku ?? "").slice(0, 100),
        price: Number(r.price) || 0,
        retailPrice: Number.isFinite(r.retailPrice as number) ? Number(r.retailPrice) : null,
        status: r.isAvailable === false ? "INACTIVE" : "ACTIVE",
        multiBuyTiers: tiers
            .filter(t => t.minQuantity > 0)
            .map(t => ({ minQty: t.minQuantity, discountValue: t.discountPct })),
    }
}

/**
 * Plans only.
 *
 * `isEnabled` / `isAutoSelected` are GONE from this payload — they moved to Country
 * Availability, which owns every flag on `product_country_config`. The service rejects
 * unknown properties, so still sending them is a 400 on every subscription save, not a
 * field quietly ignored.
 */
export function toSubscription(l: Listing, plans: SubscriptionRequest["plans"] = []): SubscriptionRequest {
    return {
        plans,
        // The market's copy rides the market's save (D-C66). One product-level pair of fields in
        // this editor still, so every market receives the same copy — per-market divergence is a
        // storage capability now, an editor capability later.
        savingsLabel: loc(l.subscriptionSavingsLabelEn, l.subscriptionSavingsLabelAr),
        termsCopy: loc(l.subscriptionTermsEn, l.subscriptionTermsAr),
    }
}

export function toRecommendations(ids: number[]): RecommendationsRequest {
    return { items: ids.filter(Boolean).map(id => ({ relatedProductId: id, status: "ACTIVE" as Status })) }
}

// ── Content blocks ────────────────────────────────────────────
// Seven PDP blocks live behind PUT /content-blocks/{block}. Four have declared
// schemas; clinician-reviews, influencer-videos and how-to-use are undeclared
// in the spec, so we send the same { items: [...] } shape and keep the local
// field names — the service stores them as-authored.

export function toWhySuperior(l: Listing) {
    const b = l.superiorityBlock
    if (!b) return null
    return {
        headline: loc(b.headlineEn, b.headlineAr),
        // Media carries its TYPE and poster as well as the url. Without the type a video saved
        // as an image — the read had nothing to go on and inferred one from the url's presence.
        media: b.mediaUrl
            ? {
                url: b.mediaUrl,
                type: b.mediaType ?? undefined,
                thumbnailUrl: b.thumbnailUrl || undefined,
            }
            : undefined,
        points: (b.points ?? []).slice(0, 8).map(p => ({
            label: loc(p.titleEn, p.titleAr),
            description: loc(p.descriptionEn, p.descriptionAr),
        })),
    }
}

export function toStats(l: Listing) {
    if (!l.stats) return null
    return {
        title: loc(l.stats.titleEn, l.stats.titleAr),
        items: (l.stats.items ?? []).map(i => ({ value: i.value, label: loc(i.labelEn, i.labelAr) })),
    }
}

export function toComparison(l: Listing) {
    const c = l.comparison
    if (!c) return null
    // Rows carry a map keyed by column key — not a positional array.
    return {
        title: loc(c.valeoTitleEn, c.valeoTitleAr),
        columns: [
            { key: "valeo", label: loc(c.valeoTitleEn, c.valeoTitleAr) ?? { en: "Valeo" }, isSelf: true },
            { key: "other", label: loc(c.otherTitleEn, c.otherTitleAr) ?? { en: "Others" }, isSelf: false },
        ],
        rows: (c.rows ?? []).map(r => ({
            attribute: loc(r.textEn, r.textAr),
            values: { valeo: !!r.valeo, other: !!r.other },
        })),
    }
}

export function toCustomerReviews(l: Listing) {
    const items = l.reviews ?? []
    if (!items.length) return null
    const rated = items.filter(r => typeof r.rating === "number")
    return {
        averageRating: rated.length ? Number((rated.reduce((s, r) => s + r.rating, 0) / rated.length).toFixed(2)) : undefined,
        totalRatings: items.length,
        items: items.map(r => ({
            reviewer: r.reviewerName,
            rating: r.rating,
            verified: !!r.isVerified,
            text: loc(r.reviewTextEn, r.reviewTextAr),
        })),
    }
}

// NOT IMPLEMENTED SERVER-SIDE (verified 2026-08-30): clinician-reviews,
// influencer-videos and how-to-use are in the block enum but have no schema,
// reject most payloads with 400, and always GET back {}. Kept here so they
// light up the moment the service implements them.
/**
 * ⚠️ NOT SENT — the two models disagree structurally, not cosmetically.
 *
 * ClinicianReviewsDto is a bare array of `{coachId (REQUIRED), review}` — the service models a
 * clinician as a REFERENCE to a Health Team member. The editor models one as free text: name,
 * designation, years of experience, image.
 *
 * So this cannot be mapped: there is no coachId to send, and inventing one would attach a review
 * to the wrong clinician. Fixing it means either the editor picks a coach from the Health Team
 * (which has no endpoint yet) or the DTO gains the free-text fields. That is a decision, not a
 * mapper change — see pdp/content-service/CONTENT_FE_INTEGRATION_PLAN.md §2b.
 */
export function toClinicianReviews(l: Listing) {
    const items = l.clinicianReviews ?? []
    if (!items.length) return null
    return {
        items: items.map(c => ({
            name: c.name,
            designation: c.designation,
            experienceYears: c.experienceYears ?? undefined,
            imageUrl: c.imageUrl || undefined,
            text: loc(c.reviewEn, c.reviewAr),
        })),
    }
}

/**
 * Influencer videos — a BARE ARRAY, with the URLs nested as assets.
 *
 * ⚠️ Three corrections from the previous shape: no `{items:...}` wrapper (@JsonValue),
 * `videoUrl`/`thumbnailUrl` become `video:{url}` / `thumbnail:{url}`, and `caption` is a PLAIN
 * STRING — it is the one text field in these blocks that is not localised.
 */
export function toInfluencerVideos(l: Listing) {
    const items = l.influencerVideos ?? []
    if (!items.length) return null
    return items.map(v => ({
        handle: v.handle,
        platform: v.platform,
        caption: v.captionEn || undefined,
        video: v.videoUrl ? { url: v.videoUrl } : undefined,
        thumbnail: v.thumbnailUrl ? { url: v.thumbnailUrl } : undefined,
    }))
}

/**
 * How to Use — a BARE ARRAY of steps, not `{items: [...]}`.
 *
 * ⚠️ Two corrections live here. First, HowToUseDto is a `@JsonValue` record over a List, so the
 * wire shape is the array itself and its fields are `title` / `detail`; the old `{items:[{icon,
 * text, subText}]}` was a 400, which is how this block came to be recorded as "not implemented".
 *
 * Second, this mapper briefly folded the Master Content prose fields (Usage/Dosage/Timing,
 * Storage) in as synthetic steps with icons `dosage` and `storage`. That made Master Content and
 * the How to Use section write ONE key through ONE mapper, colliding with the operator's own
 * Step #1 and Step #3. The prose now has its own attributes upstream, so this mapper carries the
 * authored steps and nothing else.
 */
export function toHowToUse(l: Listing) {
    // A step with no DETAIL is scaffolding, not content. Clicking "Add Step" on an empty list
    // inserts three prefilled rows (dosage / timing / storage, titles only) as a template, so
    // saving without filling them would persist three empty sections to the PDP — and once reads
    // are wired, that template would be indistinguishable from data an operator actually entered.
    const steps = (l.howToUse ?? [])
        .filter(h => (h.subTextEn ?? "").trim() !== "" || (h.subTextAr ?? "").trim() !== "")
        .map(h => ({
        icon: h.iconKey?.slice(0, 40) || undefined,   // @Size(max = 40) upstream
        title: loc(h.textEn, h.textAr),
        detail: loc(h.subTextEn, h.subTextAr),
    }))
    return steps.length ? steps : null
}

/** Local listing ids are strings ("lst-xyz"); the API wants numeric product ids. */
export const numericIds = (ids: string[] = []) =>
    ids.map(v => Number(v)).filter(n => Number.isFinite(n) && n > 0)

// ── Variants (unblocked once POST /variants was fixed) ────────

/** The per-variant row itself — name, unit count, status, default flag. */
export function toVariantUpdate(v: {
    nameEn?: string; nameAr?: string; servings?: number
    status?: string; isDefault?: boolean
}) {
    return {
        name: loc(v.nameEn, v.nameAr),
        unitCount: Number.isFinite(v.servings as number) ? Number(v.servings) : null,
        status: v.status === "active" ? ("ACTIVE" as Status) : ("INACTIVE" as Status),
        isDefault: !!v.isDefault,
    }
}

/**
 * The gallery as the service's grouped rows (D-C69). Three quiet rules, all deliberate:
 * preview-only assets (no stored URL) are EXCLUDED — a not-uploaded image must never
 * persist; a row whose variant assignments are all local-only ids is excluded rather
 * than silently DEMOTED to product-level (which would show it on every variant); and
 * duplicate (url, type, thumbnail) assets merge into one row with their variantIds
 * united, because the service refuses the duplicate the grouped echo could never show.
 */
export function toMediaRows(l: Listing, resolveVariantId?: (localId: string) => number | undefined): MediaRowWrite[] {
    const out: MediaRowWrite[] = []
    const seen = new Map<string, MediaRowWrite>()
    for (const a of l.mediaGallery ?? []) {
        if (!(a.url ?? "").trim()) continue
        const wanted = (a.variantIds ?? [])
            .map(id => {
                const n = Number(id)
                if (Number.isFinite(n) && n > 0) return n
                return resolveVariantId?.(id)
            })
            .filter((n): n is number => n != null)
        if ((a.variantIds ?? []).length > 0 && wanted.length === 0) continue
        const alt: Record<string, string> = {}
        if ((a.altTextEn ?? "").trim()) alt.en = a.altTextEn.trim()
        if ((a.altTextAr ?? "").trim()) alt.ar = a.altTextAr.trim()
        const row: MediaRowWrite = {
            type: a.type === "video" ? "VIDEO" : "IMAGE",
            url: a.url.trim(),
            ...(a.thumbnailUrl?.trim() ? { thumbnailUrl: a.thumbnailUrl.trim() } : {}),
            ...(Object.keys(alt).length ? { alt } : {}),
            ...(a.isHero && wanted.length === 0 ? { isHero: true } : {}),
            variantIds: wanted,
        }
        const key = `${row.url}\u0000${row.type}\u0000${row.thumbnailUrl ?? ""}`
        const existing = seen.get(key)
        if (existing) {
            // The WIDEST grain wins the merge: if either copy is product-level, the merged
            // asset stays product-level — a union would silently variant-scope an image the
            // operator meant to show product-wide, and a product-level hero merged with a
            // variant copy would emit the hero+variantIds shape the service rightly 400s.
            existing.variantIds = (existing.variantIds ?? []).length === 0 || wanted.length === 0
                ? []
                : [...new Set([...(existing.variantIds ?? []), ...wanted])]
            if (row.isHero && existing.variantIds.length === 0) existing.isHero = true
            // Alt from the copy that has it — the merge must not drop either side's text.
            if (row.alt) existing.alt = { ...row.alt, ...(existing.alt ?? {}) }
        } else {
            seen.set(key, row)
            out.push(row)
        }
    }
    return out
}

/** Matches a local variant to a server variant by axis label, then by order. */
export function matchVariant<T extends { variantLabelEn?: string }>(
    local: T, index: number, server: { variantId: number; label?: string }[],
): number | undefined {
    const label = (local.variantLabelEn ?? "").trim().toLowerCase()
    if (label) {
        const hit = server.find(sv => (sv.label ?? "").trim().toLowerCase() === label)
        if (hit) return hit.variantId
    }
    return server[index]?.variantId
}

/** Subscription plans need real server variant ids, so they build after variants exist. */
export function toSubscriptionPlans(
    freqs: string[] = [],
    discountByFreq: Record<string, number | undefined> = {},
    variantIds: number[] = [],
) {
    const FREQ: Record<string, { type: FrequencyType; value: number }> = {
        weekly: { type: "WEEKLY", value: 1 },
        monthly: { type: "MONTHLY", value: 1 },
        quarterly: { type: "MONTHLY", value: 3 },
        bi_annual: { type: "MONTHLY", value: 6 },
    }
    const plans: SubscriptionPlanInput[] = []
    for (const vid of variantIds) {
        for (const f of freqs) {
            const spec = FREQ[f]
            if (!spec) continue
            plans.push({
                variantId: vid,
                frequencyType: spec.type,
                frequencyValue: spec.value,
                discountType: "PERCENTAGE",
                discountAmount: Number(discountByFreq[f]) || 0,
                status: "ACTIVE",
            })
        }
    }
    return plans
}

// ══ Reading content blocks back ═══════════════════════════════════════════════
// The inverse of the to* functions above. These exist because every block was
// integrated write-first: six sections saved correctly and came back empty on
// reload, which looks exactly like a failed save from the editor.
//
// Each returns `undefined` for "the service has nothing", never an empty object —
// hydrate's put() treats undefined as "leave what the operator has", so an
// unsaved block cannot wipe unsaved local edits.
//
// Where a write is lossy the read cannot undo it. Review photos/videos and
// Arabic influencer captions are still never sent, so they come back blank.
// Those are gaps in the write shape, not in these mappers. (Superiority point
// descriptions and media type/poster WERE such gaps and are now carried.)

export function fromWhySuperior(w?: WhySuperiorWire | null): Listing["superiorityBlock"] | undefined {
    if (!w) return undefined
    const type = w.media?.type === "video" ? "video" : w.media?.url ? "image" : null
    return {
        headlineEn: w.headline?.en ?? "",
        headlineAr: w.headline?.ar ?? "",
        // Falls back to "image" only for documents saved BEFORE media carried a type.
        mediaType: type,
        mediaUrl: w.media?.url ?? "",
        thumbnailUrl: w.media?.thumbnailUrl ?? "",
        points: (w.points ?? []).map(p => ({
            titleEn: p.label?.en ?? "",
            titleAr: p.label?.ar ?? "",
            descriptionEn: p.description?.en ?? "",
            descriptionAr: p.description?.ar ?? "",
        })),
    }
}

export function fromStats(w?: StatsWire | null): Listing["stats"] | undefined {
    if (!w) return undefined
    const items = (w.items ?? []).map(i => ({
        value: i.value ?? "",
        labelEn: i.label?.en ?? "",
        labelAr: i.label?.ar ?? undefined,
    }))
    if (!items.length && !w.title?.en && !w.title?.ar) return undefined
    return { titleEn: w.title?.en ?? undefined, titleAr: w.title?.ar ?? undefined, items }
}

export function fromComparison(w?: ComparisonWire | null): Listing["comparison"] | undefined {
    if (!w) return undefined
    // Columns are keyed, not positional — read them by key rather than by index.
    const labelOf = (key: string) => w.columns?.find(c => c.key === key)?.label
    const rows = (w.rows ?? []).map(r => ({
        textEn: r.attribute?.en ?? "",
        textAr: r.attribute?.ar ?? undefined,
        valeo: !!r.values?.valeo,
        other: !!r.values?.other,
    }))
    if (!rows.length) return undefined
    const valeo = labelOf("valeo")
    const other = labelOf("other")
    return {
        valeoTitleEn: valeo?.en ?? undefined, valeoTitleAr: valeo?.ar ?? undefined,
        otherTitleEn: other?.en ?? undefined, otherTitleAr: other?.ar ?? undefined,
        rows,
    }
}

export function fromCustomerReviews(w?: CustomerReviewsWire | null): Listing["reviews"] | undefined {
    if (!w?.items?.length) return undefined
    return w.items.map((r, i) => ({
        // The service stores no per-review id, so one is derived from position. Stable across
        // loads of the same document, which is all the editor's list keys need.
        id: `review-${i}`,
        reviewerName: r.reviewer ?? "",
        rating: (r.rating ?? 5) as 1 | 2 | 3 | 4 | 5,
        reviewTextEn: r.text?.en ?? "",
        reviewTextAr: r.text?.ar ?? undefined,
        isVerified: !!r.verified,
        sortOrder: i,
    }))
}

export function fromHowToUse(w?: HowToUseWire | null): Listing["howToUse"] | undefined {
    if (!w?.length) return undefined
    return w.map(s => ({
        iconKey: s.icon ?? "",
        textEn: s.title?.en ?? "",
        textAr: s.title?.ar ?? undefined,
        subTextEn: s.detail?.en ?? "",
        subTextAr: s.detail?.ar ?? undefined,
    }))
}

export function fromInfluencerVideos(w?: InfluencerVideosWire | null): Listing["influencerVideos"] | undefined {
    if (!w?.length) return undefined
    const platforms = ["tiktok", "instagram", "youtube"] as const
    return w.map((v, i) => ({
        id: `video-${i}`,
        handle: v.handle ?? "",
        // Upstream platform is a free string; the editor's is a union, so anything
        // unrecognised lands on "other" rather than breaking the select.
        platform: (platforms as readonly string[]).includes(v.platform ?? "")
            ? (v.platform as (typeof platforms)[number])
            : "other",
        videoUrl: v.video?.url ?? "",
        thumbnailUrl: v.thumbnail?.url ?? "",
        captionEn: v.caption ?? undefined,
        sortOrder: i,
    }))
}

