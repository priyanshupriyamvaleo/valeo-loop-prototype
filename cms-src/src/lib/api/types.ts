// ── Content-service DTOs ──────────────────────────────────────
// Mirrors https://contentservice-dev.feelvaleo.com/swagger-ui — Health Products.
// Field names match the wire exactly; do not rename without changing the mapper.

export interface LocalizedText { en?: string; ar?: string }

export type Status = "ACTIVE" | "INACTIVE"
export type ProductStatus = "DRAFT" | "ACTIVE" | "INACTIVE"

/** The block keys the API accepts on /content-blocks/{block}. */
export const CONTENT_BLOCKS = [
    "why-superior", "stats", "comparison", "clinician-reviews",
    "customer-reviews", "influencer-videos", "how-to-use",
] as const
export type ContentBlock = (typeof CONTENT_BLOCKS)[number]

export const RECOMMENDATION_TYPES = ["frequently-bought", "also-viewed"] as const
export type RecommendationType = (typeof RECOMMENDATION_TYPES)[number]

export type FrequencyType = "DAILY" | "WEEKLY" | "MONTHLY"
export type DiscountType = "FIXED" | "PERCENTAGE"

// ── Reference data ────────────────────────────────────────────
export interface SubDepartment { id: number; code: string; name: LocalizedText; status: Status; sortOrder?: number }
export interface Department { id: number; code: string; name: LocalizedText; status?: Status; sortOrder?: number; subDepartments?: SubDepartment[] }
export interface Country { id: number; code: string; name: LocalizedText; currencyCode: string; flagUrl?: string; isDefault?: boolean }
/**
 * ⚠️ `name` is a PLAIN STRING here, not a LocalizedText — the Java record is
 * `BrandDto(Long id, String name, String logo)`. It is the ONE exception in this API;
 * every other name comes back as {en, ar}. This type declared LocalizedText, so reading
 * `.en` type-checked cleanly and silently produced undefined at runtime — the brand
 * dropdown rendered "Brand 1" instead of "Valeo". The union keeps the door open if the
 * DTO is ever localised, and forces callers to handle both.
 */
export interface Brand {
    id: number
    name?: string | LocalizedText
    logo?: string | null
    status?: Status
    [k: string]: unknown
}

// ── Product sections ──────────────────────────────────────────
export interface ClassificationRequest {
    subDepartmentId: number
    isVisibleApp: boolean
    isVisibleWeb: boolean
    internalCategoryId?: number | null
}

export interface CreateProductResponse {
    productId: number
    uid: string
    status: ProductStatus
    classification?: {
        productId: number
        subDepartment: SubDepartment
        department: Pick<Department, "id" | "code" | "name">
        isVisibleApp: boolean
        isVisibleWeb: boolean
    }
}

export interface IdentityRequest { internalName?: string; name?: LocalizedText; brandId?: number | null }
/**
 * ⚠️ `brand` is an OBJECT, not a brandId. The Java record is
 * IdentityResponse(productId, uid, internalName, name, BrandDto brand, status) —
 * this type declared `brandId?: number` until hydration first called getIdentity()
 * and the mismatch surfaced. The request side does take a bare id (IdentityRequest
 * .brandId), so the asymmetry is real and deliberate: you send an id, you read back
 * the resolved brand.
 */
export interface IdentityResponse {
    productId: number
    uid: string
    internalName?: string
    name: LocalizedText
    brand?: { id: number; name?: LocalizedText | string; logo?: string } | null
    status: ProductStatus
}

/** GET /products/{id}/classification. */
export interface ClassificationResponse {
    productId: number
    subDepartment?: { id: number; code: string; name?: LocalizedText; status?: string } | null
    department?: { id: number; code: string; name?: LocalizedText } | null
    isVisibleApp: boolean
    isVisibleWeb: boolean
    internalCategory?: { id: number; name?: LocalizedText } | null
    /** Always null today — country-scoped, and this endpoint has no country. */
    providerPool?: string | null
}

export interface Benefit { icon?: string; label?: LocalizedText; desc?: LocalizedText }
export interface Ingredient { name?: LocalizedText; amount?: number | null; unit?: string; dvPercent?: number | null }

/**
 * `GET /content` mirrors the request exactly, plus productId.
 *
 * `benefits` and `ingredients` are bare ARRAYS on the wire despite being BenefitsDto /
 * IngredientsDto server-side — both are `@JsonValue` records delegating to a List, so the
 * JSON is a plain array. The array type here is right, not a mismatch.
 */
export interface MasterContentResponse extends ContentRequest {
    productId: number
}

export interface ContentRequest {
    shortDescription?: LocalizedText
    description?: LocalizedText
    keyIngredients?: LocalizedText
    keyHighlights?: LocalizedText
    disclaimer?: LocalizedText
    mechanism?: LocalizedText
    /**
     * Prose, and deliberately NOT the how_to_use block.
     *
     * <p>These three were briefly folded into how-to-use as synthetic steps, which put Master
     * Content and the How to Use section on the same key with colliding icon keys. They are
     * separate ContentAttributes upstream (translations rows), so they ride GET/PUT /content —
     * the path hydrate already reads, which is why they round-trip without a block read.
     */
    usageInstructions?: LocalizedText
    storageInstructions?: LocalizedText
    science?: LocalizedText
    benefits?: Benefit[]
    ingredients?: Ingredient[]
}

export interface FaqInput { faqId?: number; question?: LocalizedText; answer?: LocalizedText; status: Status }
export interface FaqsRequest { items: FaqInput[] }

export interface AxisValueInput { valueId?: number; name?: LocalizedText; status: Status }
export interface AxisInput { axisId?: number; code: string; name?: LocalizedText; status: Status; values?: AxisValueInput[] }
export interface VariantAxesRequest { axes: AxisInput[] }
/**
 * ⚠️ `combinations` is a COUNT, not a list — the Java record is
 * `(productId, axes, int combinations, int built, int missing, List<String> mandatoryAxisCodes)`.
 * It was typed `unknown[]` here, and `mandatoryAxisCodes` was missing entirely.
 */
export interface VariantAxesResponse {
    productId: number
    axes: AxisResponse[]
    combinations: number
    built: number
    missing: number
    /** Axis codes this product's family requires before variants can be generated. */
    mandatoryAxisCodes: string[]
}

export interface AxisResponse {
    axisId: number
    code: string
    name?: LocalizedText
    status: Status
    sortOrder?: number | null
    values?: AxisValueResponse[]
}

export interface AxisValueResponse {
    valueId: number
    name?: LocalizedText
    status: Status
    sortOrder?: number | null
}

export interface VariantRequest { name?: LocalizedText; unitCount?: number | null; status: Status; isDefault?: boolean }
/**
 * ⚠️ `selections` was typed `unknown[]`. It is the variant's COMBINATION — one entry per axis,
 * carrying both ids — and it is the only reliable way to map a server variant back onto a row of
 * the grid. Matching by label or by array index (what matchVariant falls back to) pairs the wrong
 * variant with the wrong combination the moment an axis value is renamed or reordered.
 */
export interface VariantResponse {
    variantId: number
    uid?: string
    label?: string
    name?: LocalizedText
    unitCount?: number | null
    status: Status
    isDefault?: boolean
    totalStock?: number
    selections?: VariantSelection[]
    /**
     * Present when this variant IS a session pack (D-C59). Its presence is the fact — there is
     * no isPack flag (D-C58).
     *
     * `intendedDiscountPct` was missing from this type while the Java record
     * `Pack(baseVariantId, sessions, intervalDays, validityDays, intendedDiscountPct)` has
     * always returned it — so the ladder's intended % read back as undefined and every save
     * re-sent it as absent.
     */
    pack?: {
        baseVariantId: number
        sessions?: number
        intervalDays?: number | null
        validityDays?: number | null
        intendedDiscountPct?: number | null
    } | null
}

export interface VariantSelection {
    axisId: number
    axisCode?: string
    axisName?: LocalizedText
    valueId: number
    valueName?: LocalizedText
}

export interface AvailabilityRequest {
    status: Status
    isCodEligible: boolean
    isCouponDiscountBlocked: boolean
    isCouponThresholdExcluded: boolean
    /** Moved here from the subscription payload — Country Availability owns the whole row. */
    isSubscriptionEnabled: boolean
    /** Only valid while `isSubscriptionEnabled`; the service 422s the contradictory pair. */
    isSubscriptionAutoSelected: boolean
    /**
     * Commitment floor for THIS market (D-C67). The one optional field on this request:
     * absent leaves the stored value alone; a new market row starts at 1 (cancel any time).
     */
    subscriptionMinCycles?: number
}

export interface TierInput { minQty: number; discountValue: number }
export interface VariantMarketRequest {
    sku: string
    price: number
    retailPrice?: number | null
    status: Status
    multiBuyTiers?: TierInput[]
}

export interface SubscriptionPlanInput {
    variantId: number
    frequencyType: FrequencyType
    frequencyValue: number
    discountType: DiscountType
    discountAmount: number
    status: Status
}
export interface SubscriptionRequest {
    plans?: SubscriptionPlanInput[]
    /**
     * The market's subscription copy (D-C66) — a savings label is only true where the discount it
     * describes applies. Optional; absent fields leave stored copy untouched. The service 422s
     * (MARKET_NOT_CONFIGURED) if this market has no availability row yet.
     */
    savingsLabel?: LocalizedText
    termsCopy?: LocalizedText
}

export interface RecommendationInput { relatedProductId: number; status: Status }
export interface RecommendationsRequest { items: RecommendationInput[] }

// ── Content-block payloads ────────────────────────────────────
export interface WhySuperiorDto { headline?: LocalizedText; media?: unknown; points?: unknown[] }
export interface StatItem { value?: string; label?: LocalizedText }
export interface StatsDto { title?: LocalizedText; items?: StatItem[] }
export interface ComparisonDto { title?: LocalizedText; columns?: unknown[]; rows?: unknown[] }
export interface CustomerReview { reviewer?: string; rating?: number; verified?: boolean; text?: LocalizedText }
export interface CustomerReviewsDto { averageRating?: number; totalRatings?: number; items?: CustomerReview[] }

// ── Content-block wire shapes ───────────────────────────────────────────────
// What the service actually returns from GET /content-blocks/{block}. Declared
// because reading these back needs the real shape, and three of them publish an
// EMPTY schema in Swagger (@JsonValue records over a List resolve to nothing),
// so the document cannot be the reference — the DTOs and their tests are.
//
// Note where these are LOSSIER than the editor: a write drops superiority point
// descriptions, review photos and videos, and Arabic captions. Reading cannot
// invent them back, so those fields come back empty by necessity, not by bug.

export interface WhySuperiorWire {
    headline?: LocalizedText
    /** url and thumbnailUrl are plain strings — an S3 link once uploads land, a pasted one today. */
    media?: { url?: string; type?: string; thumbnailUrl?: string }
    points?: { label?: LocalizedText; description?: LocalizedText }[]
}

export interface StatsWire {
    title?: LocalizedText
    items?: { value?: string; label?: LocalizedText }[]
}

export interface ComparisonWire {
    title?: LocalizedText
    columns?: { key?: string; label?: LocalizedText; isSelf?: boolean }[]
    rows?: { attribute?: LocalizedText; values?: Record<string, boolean> }[]
}

export interface CustomerReviewsWire {
    averageRating?: number
    totalRatings?: number
    items?: { reviewer?: string; rating?: number; verified?: boolean; text?: LocalizedText }[]
}

/** A BARE ARRAY on the wire — @JsonValue over List<Step>. */
export type HowToUseWire = { icon?: string; title?: LocalizedText; detail?: LocalizedText }[]

/** Also a bare array. `caption` is a plain string: the one text field here that is not localised. */
export type InfluencerVideosWire = {
    handle?: string
    platform?: string
    caption?: string
    video?: { url?: string }
    thumbnail?: { url?: string }
}[]
