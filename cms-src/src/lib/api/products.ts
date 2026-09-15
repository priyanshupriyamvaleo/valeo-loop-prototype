// ── Health Products endpoints ─────────────────────────────────
// One function per API section. The editor saves tab-by-tab, which is exactly
// how the service is shaped: create returns a DRAFT, then each tab PUTs itself.

import { api } from "./client"
import { fetchDepartments } from "./taxonomy"
import type {
    AvailabilityRequest,
    Brand,
    ClassificationRequest,
    ClassificationResponse,
    ComparisonWire,
    ContentBlock,
    ContentRequest,
    Country,
    CreateProductResponse,
    CustomerReviewsWire,
    Department,
    FaqsRequest,
    HowToUseWire,
    IdentityRequest,
    IdentityResponse,
    InfluencerVideosWire,
    MasterContentResponse,
    RecommendationType,
    RecommendationsRequest,
    StatsWire,
    SubscriptionRequest,
    VariantAxesRequest,
    VariantAxesResponse,
    VariantMarketRequest,
    VariantRequest,
    VariantResponse,
    WhySuperiorWire,
} from "./types"

// ── Reference data ────────────────────────────────────────────
export const getDepartments = () => api.get<Department[]>("departments")
export const getCountries = () => api.get<Country[]>("countries")
export const getBrands = () => api.get<Brand[]>("brands")
/**
 * FLIP-READY, NOT LIVE. The service's OpenAPI exposes exactly ONE brand route —
 * GET /brands — so this POST answers 404 ("No endpoint matches this request")
 * today. It exists so brand creation starts working the day the endpoint ships,
 * with no frontend change. Callers must treat the 404 as "not built yet", never
 * as success and never by inventing a brand id: a locally-invented id saved as
 * IdentityRequest.brandId is a dangling reference on a real product.
 */
export const createBrand = (b: { name: string; logo?: string }) => api.post<Brand>("brands", b)

/** ACTIVE cities by default; the service filters. 34 rows, so unpaginated. */
export const getCities = (includeInactive = false) =>
    api.get<CityApiDto[]>(`cities${includeInactive ? "?includeInactive=true" : ""}`)

export interface CityApiDto {
    id: number
    code: string
    name: { en: string | null; ar: string | null }
    countryId: number
    isDefault: boolean
    isActive: boolean
}

export const HEALTH_PRODUCTS_CODE = "HP"

/**
 * Every sub-department the service knows, flattened, from every department.
 *
 * Was HP-only, which made the whole save path unreachable for anything else —
 * a Treatments listing could not resolve its sub-department id and failed with
 * "Choose a sub-department before saving." Now that TREAT/IV/PHYSIO are seeded
 * (alters/036), the lookup has to span the tree; nothing here is HP-specific.
 */
export async function getAllSubDepartments() {
    // Through fetchDepartments, NOT getDepartments: that shared cache is what stops
    // the tree being fetched a second time on every editor open.
    const departments = await fetchDepartments()
    return departments.flatMap(d => d.subDepartments ?? [])
}

/** @deprecated Use {@link getAllSubDepartments} — kept so no caller breaks silently. */
export const getHealthProductSubDepartments = getAllSubDepartments

// ── Create ────────────────────────────────────────────────────
/** First save of the Classification tab — creates the DRAFT and returns its id. */
export const createProduct = (body: ClassificationRequest) =>
    api.post<CreateProductResponse>("products", body)

// ── Sections ──────────────────────────────────────────────────
const p = (id: number, suffix = "") => `products/${id}${suffix}`

export const getIdentity = (id: number) => api.get<IdentityResponse>(p(id, "/identity"))
export const putIdentity = (id: number, body: IdentityRequest) => api.put<IdentityResponse>(p(id, "/identity"), body)

export const getClassification = (id: number) => api.get<ClassificationResponse>(p(id, "/classification"))
export const putClassification = (id: number, body: ClassificationRequest) => api.put<unknown>(p(id, "/classification"), body)

export const getContent = (id: number) => api.get<MasterContentResponse>(p(id, "/content"))
export const putContent = (id: number, body: ContentRequest) => api.put<ContentRequest>(p(id, "/content"), body)

/**
 * The whole content document, one call — each field null when its block was never saved. The
 * five @JsonValue blocks arrive as their bare item arrays, which is exactly the wire shape the
 * per-block GETs already produce, so the from* mappers are reused unchanged.
 */
export interface ContentBlocksRead {
    whySuperior?: WhySuperiorWire | null
    stats?: StatsWire | null
    comparison?: ComparisonWire | null
    customerReviews?: CustomerReviewsWire | null
    howToUse?: HowToUseWire | null
    influencerVideos?: InfluencerVideosWire | null
}
export const getContentBlocks = (id: number) => api.get<ContentBlocksRead>(p(id, "/content-blocks"))

export const getContentBlock = <T>(id: number, block: ContentBlock) => api.get<T>(p(id, `/content-blocks/${block}`))
export const putContentBlock = <T>(id: number, block: ContentBlock, body: T) => api.put<T>(p(id, `/content-blocks/${block}`), body)

export const getFaqs = (id: number) => api.get<FaqsRequest>(p(id, "/faqs"))
export const putFaqs = (id: number, body: FaqsRequest) => api.put<FaqsRequest>(p(id, "/faqs"), body)

export const getRecommendations = (id: number, type: RecommendationType) =>
    api.get<RecommendationsRequest>(p(id, `/recommendations/${type}`))
export const putRecommendations = (id: number, type: RecommendationType, body: RecommendationsRequest) =>
    api.put<RecommendationsRequest>(p(id, `/recommendations/${type}`), body)

// ── Variants ──────────────────────────────────────────────────
/**
 * The declared axes, their values, and the grid's counts.
 *
 * ⚠️ Also carries `mandatoryAxisCodes` — the axis codes this product's FAMILY requires
 * (IV mandates `volume`, D-C27). generate() checks them BEFORE anything else, so a screen
 * that does not show them lets an operator complete every visible step and then meet a 422.
 */
export const getVariantAxes = (id: number) => api.get<VariantAxesResponse>(p(id, "/variant-axes"))
export const putVariantAxes = (id: number, body: VariantAxesRequest) => api.put<VariantAxesResponse>(p(id, "/variant-axes"), body)

/** Builds the variant rows for any axis combination that doesn't have one yet. */
export const generateVariants = (id: number) => api.post<VariantResponse[]>(p(id, "/variants"))
export const getVariants = (id: number) => api.get<VariantResponse[]>(p(id, "/variants"))
export const putVariant = (id: number, variantId: number, body: VariantRequest) =>
    api.put<VariantResponse>(p(id, `/variants/${variantId}`), body)

/**
 * Every variant's own fields in ONE request — the bulk twin of putVariant, per-row tolerant:
 * a refused row comes back beside the saved echo instead of failing the batch. The editor's
 * variant wave was one PUT per variant (~17 on a two-axis listing with packs).
 */
export interface RejectedVariantRow { index: number; variantId: number; code: string; message: string }
export const putVariantsBulk = (id: number, rows: (VariantRequest & { variantId: number })[]) =>
    api.put<{ saved: VariantResponse[]; rejected: RejectedVariantRow[] }>(p(id, "/variants"), rows)

// ── Markets (per-country) ─────────────────────────────────────
export interface AvailabilityRow {
    productId: number
    country: { id: number; code: string; name?: { en: string | null; ar: string | null } } | null
    status: string
    isCodEligible: boolean
    isCouponDiscountBlocked: boolean
    isCouponThresholdExcluded: boolean
    isSubscriptionEnabled: boolean
    isSubscriptionAutoSelected: boolean
    subscriptionMinCycles?: number
}

export const getAvailability = (id: number) => api.get<AvailabilityRow[]>(p(id, "/availability"))

// ── City availability (product x city, D-C48) ─────────────────
// Unlike countries, cities DO have a DELETE — and the screen relies on it: turning a
// city off removes the row rather than leaving an INACTIVE one. That is D-C29 read
// strictly: a missing row means not offered, and for cities there is no third state
// worth recording.

export interface CityAvailabilityRow {
    productId: number
    city: { id: number; code: string; name?: { en: string | null; ar: string | null }; countryId?: number } | null
    status: string
    isCustomerSlotBookEnabled: boolean
}

export interface CityAvailabilityRequest {
    status: "ACTIVE" | "INACTIVE"
    /** D-C62: 1 = the customer picks their slot, 0 = ops schedules it. */
    isCustomerSlotBookEnabled: boolean
}

// ── Session packs (variant_session_packs, D-C59) ──────────────
// A pack IS a variant: minting one creates a product_variants row whose axis_signature is
// the base's plus "|S:{sessions}", so it is distinct under uk_variant_axes while recording
// exactly which combination it packs. That is also what makes DUPLICATE_PACK catchable.

export interface PackRequest {
    /** >= 2. A one-session pack is just the base variant, so it has no row at all. */
    sessions: number
    /** undefined MEANS the customer books each session (D-C30 §4) — not missing data. */
    intervalDays?: number
    validityDays?: number
    /** Provenance of the intended ladder. NEVER a price. */
    intendedDiscountPct?: number
}

/** Sessions is absent on purpose: it defines the pack's identity, so it cannot be edited. */
export type PackSettingsRequest = Omit<PackRequest, "sessions">

export interface PackResponse {
    variantId: number
    uid?: string
    baseVariantId: number
    sessions: number
    intervalDays?: number | null
    validityDays?: number | null
    intendedDiscountPct?: number | null
}

export const createPack = (id: number, baseVariantId: number, body: PackRequest) =>
    api.post<PackResponse>(p(id, `/variants/${baseVariantId}/packs`), body)

export const updatePack = (id: number, packVariantId: number, body: PackSettingsRequest) =>
    api.put<PackResponse>(p(id, `/packs/${packVariantId}`), body)

/** Removes the pack variant and its price rows. Refused if it is commercialised. */
export const deletePack = (id: number, packVariantId: number) =>
    api.del<void>(p(id, `/packs/${packVariantId}`))

// ── Pricing (product_pricing) ─────────────────────────────────
// A price row is (variant, city) or (variant, country) — never both, never neither.
// For treatments the family policy says CITY, so a country-scoped write is refused with
// PRICE_SCOPE_MISMATCH.

export interface BulkPriceRow {
    variantId: number
    /** Exactly ONE of these. cityId for a CITY-scoped family (treatments). */
    countryId?: number
    cityId?: number
    price: number
    /** NOT NULL in the table; omitted means "same as price" — nothing struck out. */
    retailPrice?: number
    multiBuyTiers?: { minQty: number; discountValue: number }[]
}

export interface PriceRowResponse {
    variantId: number
    countryId?: number | null
    cityId?: number | null
    price: number
    retailPrice: number
    multiBuyTiers?: { minQty: number; discountValue: number; label?: string }[]
}

export interface RejectedPriceRow {
    /** Index into the array YOU submitted — this is what maps a rejection back to a cell. */
    index: number
    variantId?: number
    countryId?: number | null
    cityId?: number | null
    code: string
    message: string
    field?: string
}

export interface BulkPriceResponse {
    saved: PriceRowResponse[]
    rejected: RejectedPriceRow[]
}

/** The whole sheet in one call. Rows are accepted or rejected individually. */
export const putPricesBulk = (id: number, rows: BulkPriceRow[]) =>
    api.put<BulkPriceResponse>(p(id, "/prices"), rows)

/**
 * Everything the commerce sheets render, ONE call — variants (packs riding each block), every
 * price row, and city availability. Shipped by the backend's D-C65 work and unadopted until the
 * editor was measured paying 17 per-variant price GETs on load, again on every save's diff
 * baseline, and again on generate. Same row shapes as the per-surface GETs: the endpoint reuses
 * their services verbatim.
 */
export interface CommerceRead {
    variants: VariantResponse[]
    prices: PriceRowResponse[]
    cityAvailability: CityAvailabilityRow[]
}
export const getCommerce = (id: number) => api.get<CommerceRead>(p(id, "/commerce"))

// ── Media gallery (D-C69) ─────────────────────────────────────
// The GROUPED shape both ways: one row per ASSET; the service fans placements out
// (per assigned variant, per language) and groups them back. The PUT is the WHOLE
// gallery, atomic — a bad row 400s naming rows[i].
export interface MediaAssetRead {
    mediaId: number
    type: string
    url: string
    thumbnailUrl?: string | null
    alt?: { en?: string | null; ar?: string | null } | null
    sortOrder: number
    isHero: boolean
    variantIds?: number[] | null
}
export interface MediaRowWrite {
    type: "IMAGE" | "VIDEO"
    url: string
    thumbnailUrl?: string
    alt?: Record<string, string>
    isHero?: boolean
    variantIds?: number[]
}
export const putProductMedia = (id: number, rows: MediaRowWrite[]) =>
    api.put<MediaAssetRead[]>(p(id, "/media"), rows)

// ── The whole product, one read ───────────────────────────────
// GET /products/{id}: every key shaped exactly as its own section GET answers, built by the
// same services server-side. Hydration's eight parallel GETs (plus the follow-up subscription
// read) become this one request. Writes stay per section.
export interface RelationRead {
    items?: { relatedProductId: number; status?: string }[] | null
}
export interface SubscriptionMarketRead {
    country?: { id: number } | null
    isEnabled?: boolean
    savingsLabel?: { en?: string | null; ar?: string | null } | null
    termsCopy?: { en?: string | null; ar?: string | null } | null
    plans?: { frequencyType?: string; frequencyValue?: number; discountAmount?: number }[] | null
}
export interface ProductDocumentRead {
    identity: IdentityResponse
    classification: ClassificationResponse
    availability: AvailabilityRow[]
    variantAxes: VariantAxesResponse
    masterContent: MasterContentResponse
    faqs: FaqsRequest
    commerce: CommerceRead
    contentBlocks: ContentBlocksRead
    subscription: SubscriptionMarketRead[]
    recommendations: { frequentlyBought?: RelationRead | null; alsoViewed?: RelationRead | null }
    /** Absent on an older service (the per-section fallback) — absence must not touch local media. */
    media?: MediaAssetRead[]
}
export const getProductDocument = (id: number) => api.get<ProductDocumentRead>(p(id))

/**
 * Clears many price cells in ONE transaction. The body is the EXPLICIT list of cells — the
 * endpoint cannot infer deletions from absence, by design, so the client-side tripwire in
 * syncPrices stays: it guards intent, this guards transport.
 */
export const deletePricesBatch = (id: number, cells: { variantId: number; cityId: number }[]) =>
    api.post<{ deleted: number }>(p(id, "/prices/delete-batch"), cells)

export const getVariantPrices = (id: number, variantId: number) =>
    api.get<PriceRowResponse[]>(p(id, `/variants/${variantId}/prices`))

/** Clearing a cell REMOVES the row — "not sold there" is the absence of a row, not a zero. */
export const deleteCityPrice = (id: number, variantId: number, cityId: number) =>
    api.del<void>(p(id, `/variants/${variantId}/prices/city/${cityId}`))

export const getCityAvailability = (id: number) =>
    api.get<CityAvailabilityRow[]>(p(id, "/cities"))

/**
 * Every city in one transaction — per-row tolerant like the price bulk. Turning a market's
 * cities on used to cost one round trip per city (33 at worst, ~4 queries each server-side).
 */
export const putCitiesBulk = (id: number,
        rows: { cityId: number; status: "ACTIVE" | "INACTIVE"; isCustomerSlotBookEnabled?: boolean }[]) =>
    api.put<{ saved: number; rejected: { index: number; cityId: number; code: string; message: string }[] }>(
        p(id, "/cities"), rows)

/** Switches many cities off in one transaction; each row's delivery-time translations go with it. */
export const deleteCitiesBatch = (id: number, cityIds: number[]) =>
    api.post<{ deleted: number }>(p(id, "/cities/delete-batch"), cityIds)

export const putCityAvailability = (id: number, cityId: number, body: CityAvailabilityRequest) =>
    api.put<CityAvailabilityRow>(p(id, `/cities/${cityId}`), body)

export const deleteCityAvailability = (id: number, cityId: number) =>
    api.del<void>(p(id, `/cities/${cityId}`))
export const getAvailabilityFor = (id: number, countryId: number) => api.get<AvailabilityRequest>(p(id, `/availability/${countryId}`))
export const putAvailability = (id: number, countryId: number, body: AvailabilityRequest) =>
    api.put<AvailabilityRequest>(p(id, `/availability/${countryId}`), body)

export const getVariantMarkets = (id: number, variantId: number) =>
    api.get<unknown[]>(p(id, `/variants/${variantId}/markets`))
export const putVariantMarket = (id: number, variantId: number, countryId: number, body: VariantMarketRequest) =>
    api.put<unknown>(p(id, `/variants/${variantId}/markets/${countryId}`), body)

// ── Subscription ──────────────────────────────────────────────
export const getSubscription = (id: number, countryId: number) =>
    api.get<SubscriptionRequest>(p(id, `/subscription/${countryId}`))
export const putSubscription = (id: number, countryId: number, body: SubscriptionRequest) =>
    api.put<SubscriptionRequest>(p(id, `/subscription/${countryId}`), body)
