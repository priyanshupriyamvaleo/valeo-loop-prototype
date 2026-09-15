// ── Read the server's copy back into the editor ────────────────
//
// Until this existed the editor was WRITE-ONLY: every section PUT, nothing ever
// read back, so a reload showed the local store's copy and a PUT that silently
// failed looked identical to one that worked.
//
// The content service is the system of record for the sections it owns, so on
// load its values WIN. That is the point rather than a side effect: if the two
// disagree, the local copy is the stale one.
//
// Drift is reported rather than swallowed. A field the service returns
// differently from what the editor held is the single most useful signal
// available about whether writes are actually landing, and overwriting it
// quietly would destroy exactly that signal.

import type { CatalogCountryConfig, Listing, ProductCityConfig, VariantOption } from "@/types"
import type { LocalizedText, VariantAxesResponse, VariantResponse } from "./types"
import {
    getAvailability, getClassification, getCommerce, getContent, getContentBlocks, getFaqs,
    getIdentity, getProductDocument, getSubscription, getVariantAxes,
    type PriceRowResponse, type ProductDocumentRead, type SubscriptionMarketRead,
} from "./products"
import {
    countryFromId, fromComparison, fromCustomerReviews, fromHowToUse, fromInfluencerVideos,
    fromStats, fromWhySuperior, subDepartmentLocalId,
    type CountryLookup, type SubDeptLookup,
} from "./mapper"
import { departmentOf } from "./taxonomy"
import { ApiError } from "./client"

export interface DriftedField {
    section: "identity" | "classification"
    field: string
    /** What the editor held. */
    local: string
    /** What the service returned — the value now in the form. */
    server: string
}

export interface HydrateResult {
    patch: Partial<Listing>
    /** Axis codes the family requires — empty when unknown or none. */
    mandatoryAxisCodes?: string[]
    /** The variants the service holds, unmapped — the page turns these into its own shape. */
    serverVariants?: VariantResponse[]
    /** Price rows per variantId. The page folds these into regionalData[].cityPrices. */
    /** null = the fetch FAILED (preserve the sheet); {} / absent keys = truth (no rows). */
    serverPrices?: Record<number, PriceRowResponse[]> | null
    drift: DriftedField[]
    /** Sections that could not be read, with the reason. */
    failed: { section: string; error: string }[]
}

const text = (v: unknown): string =>
    v === null || v === undefined ? "" : typeof v === "string" ? v : String(v)

const localized = (v: unknown): string => {
    if (!v) return ""
    if (typeof v === "string") return v
    const o = v as { en?: string | null }
    return o.en ?? ""
}

const describe = (e: unknown) =>
    e instanceof ApiError ? `${e.code}: ${e.message}` : e instanceof Error ? e.message : "Unexpected error"

/**
 * Reads the server's whole copy of a product that exists server-side — ONE
 * GET /products/{id}, every section key shaped as its own endpoint answers.
 *
 * Failure is whole-document: the read is one transaction server-side, so sections
 * cannot fail independently the way eight parallel GETs could. `failed` keeps its
 * per-section shape because the CALLER reports per section either way.
 */
export async function hydrateFromService(
    productId: number,
    listing: Listing,
    subs: SubDeptLookup,
    /** Needed to turn the service's numeric countryId back into the frontend's Country key. */
    countries: CountryLookup,
    /**
     * Whether the editor already held a real copy of this product.
     *
     * FALSE when it was opened straight from the Listings screen by product id: the
     * form is a blank placeholder, so every value the service returns "differs" from
     * it and reporting that is meaningless — it is a LOAD, not a disagreement. A
     * banner on every open is noise, and noise is how a real drift warning gets
     * ignored the one time it matters.
     *
     * TRUE when re-reading a product the editor already had, which is the only
     * situation where two stores can genuinely disagree.
     */
    compare = true,
): Promise<HydrateResult> {
    const patch: Partial<Listing> = {}
    let mandatoryAxisCodes: string[] = []
    let serverVariants: VariantResponse[] = []
    const drift: DriftedField[] = []
    const failed: HydrateResult["failed"] = []

    const note = (section: DriftedField["section"], field: string, local: string, server: string) => {
        // A first load has nothing to disagree with — see the `compare` parameter.
        if (!compare) return
        if (local.trim() === server.trim()) return
        // The editor holding NOTHING is not a conflict: the service is simply supplying
        // a value the form did not have. The reverse IS worth reporting — a local value
        // against an empty server one means the write never landed.
        if (local.trim() === "") return
        drift.push({ section, field, local, server })
    }

    // ONE read replaces the eight parallel section GETs and the follow-up subscription
    // read. Same keys, same shapes, from the same services server-side — the data was
    // small and the round trips were the cost. Failure is whole-document now: inside one
    // read-only transaction the sections cannot fail independently the way eight network
    // calls could, so the settled-result plumbing this used to carry is gone with them.
    let doc: ProductDocumentRead
    try {
        doc = await getProductDocument(productId)
    } catch (e) {
        // 404/405 can mean an OLDER SERVICE that has no whole-product read yet (the dev
        // flag-day: FE deployed ahead of BE) — fall back to the per-section GETs it does
        // have. A product that genuinely does not exist 404s those too, so the truth
        // still comes out; anything else (500, network, timeout) is a real failure.
        const routeMissing = e instanceof ApiError && (e.status === 404 || e.status === 405)
        if (!routeMissing) {
            return { patch: {}, drift: [], failed: [{ section: "product", error: describe(e) }],
                     mandatoryAxisCodes: [], serverVariants: [], serverPrices: null }
        }
        try {
            doc = await documentFromSections(productId)
        } catch (e2) {
            return { patch: {}, drift: [], failed: [{ section: "product", error: describe(e2) }],
                     mandatoryAxisCodes: [], serverVariants: [], serverPrices: null }
        }
    }

    // Prices ride the commerce key — flat rows grouped here by variant. Every variant is
    // seeded with [] FIRST: an empty list is a real answer ("no rows"), and a variant absent
    // from the map would read as "unknown". A failed read returns above with null — {} would
    // let toLocalVariants CLEAR every cell, and the next save's diff would delete the rows
    // server-side: the axis-wipe incident, kept impossible.
    const serverPrices: Record<number, PriceRowResponse[]> = {}
    for (const v of doc.commerce?.variants ?? []) serverPrices[v.variantId] = []
    for (const row of doc.commerce?.prices ?? []) {
        (serverPrices[row.variantId] ??= []).push(row)
    }

    // ── identity ──────────────────────────────────────────────
    {
        const d = doc.identity
        // The uid is generated once and never rewritten (D-C53), so it is the one
        // field here that cannot drift — it can only be absent locally.
        if (d.uid) patch.apiUid = d.uid

        note("identity", "internalName", text(listing.internalName), text(d.internalName))
        if (d.internalName !== undefined && d.internalName !== null) {
            patch.internalName = d.internalName
        }

        const serverEn = localized(d.name)
        const serverAr = (d.name as { ar?: string | null } | undefined)?.ar ?? ""
        note("identity", "displayNameEn", text(listing.displayNameEn), serverEn)
        note("identity", "displayNameAr", text(listing.displayNameAr), serverAr)
        if (serverEn) patch.displayNameEn = serverEn
        if (serverAr) patch.displayNameAr = serverAr

        // `brand` is an object here, not a brandId — see IdentityResponse.
        const serverBrand = d.brand?.id
        note("identity", "brandId", text(listing.brandId), text(serverBrand))
        if (serverBrand !== undefined) patch.brandId = serverBrand
    }

    // ── classification ────────────────────────────────────────
    {
        const d = doc.classification

        // ── the ROOT department, and it is not optional ────────────────────────
        // `department` and `subDepartmentId` are two separate fields on Listing, and the
        // Sub-department dropdown is filtered by `s.department === listing.department`.
        // Patching only the sub-department left `department` at emptyListing()'s default
        // of health_products, so an IV product opened from the Listings screen showed
        // "Health Products" with an EMPTY Sub-department select: the right slug was in
        // state but absent from the filtered options, so it rendered as nothing chosen.
        // Set the root first — the sub-department is meaningless without it.
        if (d.department?.code) {
            const key = departmentOf(d.department.code)
            note("classification", "department", text(listing.department), text(key))
            patch.department = key
        }

        // Map the numeric sub-department back to the slug the editor keys on.
        const slug = d.subDepartment?.id ? subDepartmentLocalId(d.subDepartment.id, subs) : undefined
        note("classification", "subDepartmentId", text(listing.subDepartmentId), text(slug ?? d.subDepartment?.code))
        // Only overwrite when the slug RESOLVED. An unmapped code would blank the
        // field and take every slug-keyed behaviour with it — worse than stale.
        if (slug) patch.subDepartmentId = slug

        const serverSurface = d.isVisibleApp && d.isVisibleWeb ? "both"
            : d.isVisibleApp ? "app" : d.isVisibleWeb ? "web" : "none"
        note("classification", "visibleOn", text(listing.visibleOn), serverSurface)
        patch.isVisibleApp = d.isVisibleApp
        patch.isVisibleWeb = d.isVisibleWeb
        if (serverSurface !== "none") patch.visibleOn = serverSurface as Listing["visibleOn"]

        const serverFeature = d.internalCategory?.id
        note("classification", "internalCategoryId", text(listing.internalCategoryId), text(serverFeature))
        if (serverFeature !== undefined && serverFeature !== null) {
            // String, to match Listing.internalCategoryId — the same conversion the
            // Feature picker makes, in the same direction.
            patch.internalCategoryId = String(serverFeature)
        }
    }

    // ── country availability ──────────────────────────────────────────────
    // Hydrated because the screen cannot express removal: with no DELETE on
    // availability, a country taken off the local list stays on the server, and
    // without reading the rows back the two never reconcile — the card would show a
    // market gone while the product went on selling there.
    {
        const rows = doc.availability ?? []
        const mapped = rows
            .map(r => {
                const key = r.country?.id ? countryFromId(r.country.id, countries) : undefined
                if (!key) return null   // a market this frontend cannot name — see fetchAvailableCountries
                return {
                    country: key,
                    status: (r.status ?? "").toUpperCase() === "ACTIVE" ? "active" : "inactive",
                    isCodEligible: !!r.isCodEligible,
                    isCouponDiscountBlocked: !!r.isCouponDiscountBlocked,
                    isCouponThresholdExcluded: !!r.isCouponThresholdExcluded,
                    isSubscriptionEnabled: !!r.isSubscriptionEnabled,
                    isSubscriptionAutoSelected: !!r.isSubscriptionAutoSelected,
                    // D-C67: the commitment floor is a term of THIS market. Older deploys omit the
                    // field; leaving it undefined (not defaulting to 1) keeps a save from claiming
                    // an opinion the server never stated.
                    subscriptionMinCycles: r.subscriptionMinCycles,
                } as CatalogCountryConfig
            })
            .filter((c): c is CatalogCountryConfig => c !== null)

        const localCountries = (listing.countryConfig ?? []).map(c => c.country).sort().join(",")
        const serverCountries = mapped.map(c => c.country).sort().join(",")
        note("classification", "countries", localCountries, serverCountries)
        patch.countryConfig = mapped
    }

    // ── subscription (D-C66/67: per market; the editor's fields are product-level) ────────
    // The document carries every configured market. Copy is read from the FIRST one — saves
    // write identical copy to every market, so any row is representative. The enabled flag,
    // frequencies and discounts hydrate too now (they never did before this read existed:
    // the tab rendered blanks over saved plans). Assigned only when the service HAS a value —
    // an empty read must not overwrite something typed but not saved.
    {
        const markets = doc.subscription ?? []
        const sub = markets[0]
        if (sub?.savingsLabel?.en) patch.subscriptionSavingsLabelEn = sub.savingsLabel.en
        if (sub?.savingsLabel?.ar) patch.subscriptionSavingsLabelAr = sub.savingsLabel.ar
        if (sub?.termsCopy?.en) patch.subscriptionTermsEn = sub.termsCopy.en
        if (sub?.termsCopy?.ar) patch.subscriptionTermsAr = sub.termsCopy.ar
        if (markets.length) patch.subscriptionEnabled = markets.some(m => !!m.isEnabled)

        // The exact inverse of toSubscriptionPlans' FREQ table. Plans repeat per variant;
        // frequency and discount are product-level in the editor, so dedupe by key.
        const KEY: Record<string, string> = {
            "WEEKLY:1": "weekly", "MONTHLY:1": "monthly", "MONTHLY:3": "quarterly", "MONTHLY:6": "bi_annual",
        }
        const freqs: string[] = []
        const discounts: Record<string, number> = {}
        for (const plan of markets.flatMap(m => m.plans ?? [])) {
            const key = KEY[`${plan.frequencyType}:${plan.frequencyValue}`]
            if (!key) continue
            if (!freqs.includes(key)) freqs.push(key)
            if (plan.discountAmount != null) discounts[key] = Number(plan.discountAmount)
        }
        if (freqs.length) {
            patch.subscriptionFrequencies = freqs as Listing["subscriptionFrequencies"]
            patch.subscriptionDiscountPct = discounts as Listing["subscriptionDiscountPct"]
        }
    }

    // ── recommendations — the other section that never read back ──────────────────────────
    {
        const ids = (rel?: { items?: { relatedProductId: number }[] | null } | null) =>
            (rel?.items ?? []).map(i => String(i.relatedProductId))
        const fb = ids(doc.recommendations?.frequentlyBought)
        if (fb.length) patch.frequentlyBought = { ...(listing.frequentlyBought ?? {}), listingIds: fb }
        const av = ids(doc.recommendations?.alsoViewed)
        if (av.length) patch.recommendationIds = av
    }

    // ── city availability ─────────────────────────────────────────────────
    // Read back for the same reason as countries, and with more force: the save DELETEs
    // rows for cities switched off, so the editor must know what is currently on the
    // server before it can diff against it. Hydrating here is what makes that diff right
    // rather than a guess.
    {
        const rows = (doc.commerce?.cityAvailability ?? [])
            .filter(r => r.city?.id)
            .map(r => ({
                cityId: String(r.city!.id),
                status: (r.status ?? "").toUpperCase() === "ACTIVE" ? "active" : "inactive",
                isCustomerSlotBookEnabled: !!r.isCustomerSlotBookEnabled,
            } as ProductCityConfig))

        const localCities = (listing.cityConfig ?? [])
            .filter(c => c.status === "active").map(c => c.cityId).sort().join(",")
        const serverCities = rows.filter(c => c.status === "active").map(c => c.cityId).sort().join(",")
        note("classification", "cities offered", localCities, serverCities)
        patch.cityConfig = rows
    }

    // ── variant axes ──────────────────────────────────────────────────────
    // The most load-bearing hydration of the four, and the reason is not obvious:
    // toVariantAxes() sends axisId and valueId back, and the API MERGES on them —
    // present means update, absent means create. Those ids only exist locally if
    // something read them, and nothing did. So every save was silently creating a
    // FRESH set of axes, generating variants under new signatures and detaching them
    // from the prices attached to the old ones.
    {
        const res = doc.variantAxes
        const options = axesToOptions(res)

        const localAxes = (listing.variantOptions ?? []).map(o => o.kind).sort().join(",")
        const serverAxes = options.map(o => o.kind).sort().join(",")
        note("classification", "axes", localAxes, serverAxes)

        patch.variantOptions = options
        // Carried so the screen can say WHY generate will refuse, instead of showing a
        // completed stepper and then a 422 (MANDATORY_AXIS_MISSING names the code).
        mandatoryAxisCodes = res.mandatoryAxisCodes ?? []
    }

    // ── variants ──────────────────────────────────────────────────────────
    // Carried raw. The mapping into the editor's ProductVariant shape needs
    // emptyVariant(), which is local to the listing page, so the page does it — but
    // the READ belongs here beside the axes it is keyed on. Without this a reload
    // showed "0 built" over variants that exist, which is what the generate button
    // was doing until the rows were plumbed through.
    serverVariants = doc.commerce?.variants ?? []

    // ── master content ────────────────────────────────────────────────────
    // Read BEFORE this section's writes were trusted, deliberately. Six sections were
    // built write-first today and every one had a read-back bug, because an empty screen
    // after a save is indistinguishable from an unloaded one.
    {
        const c = doc.masterContent
        const en = (t?: LocalizedText | null) => t?.en ?? undefined
        const ar = (t?: LocalizedText | null) => t?.ar ?? undefined

        // Only assigned when the service HAS a value: an undefined here must not overwrite
        // something the operator has typed but not yet saved.
        const put = <K extends keyof Listing>(k: K, v: Listing[K] | undefined) => {
            if (v !== undefined && v !== null && v !== "") patch[k] = v
        }
        put("shortDescriptionEn", en(c.shortDescription) as Listing["shortDescriptionEn"])
        put("shortDescriptionAr", ar(c.shortDescription) as Listing["shortDescriptionAr"])
        put("descriptionEn", en(c.description) as Listing["descriptionEn"])
        put("descriptionAr", ar(c.description) as Listing["descriptionAr"])
        put("keyIngredientsEn", en(c.keyIngredients) as Listing["keyIngredientsEn"])
        put("keyIngredientsAr", ar(c.keyIngredients) as Listing["keyIngredientsAr"])
        put("keyHighlightsEn", en(c.keyHighlights) as Listing["keyHighlightsEn"])
        put("keyHighlightsAr", ar(c.keyHighlights) as Listing["keyHighlightsAr"])
        put("disclaimerEn", en(c.disclaimer) as Listing["disclaimerEn"])
        put("disclaimerAr", ar(c.disclaimer) as Listing["disclaimerAr"])
        put("mechanismEn", en(c.mechanism) as Listing["mechanismEn"])
        put("mechanismAr", ar(c.mechanism) as Listing["mechanismAr"])
        // Prose attributes, so they arrive on /content and round-trip here — unlike the content
        // blocks, which this function still does not read at all.
        put("usageInstructionsEn", en(c.usageInstructions) as Listing["usageInstructionsEn"])
        put("usageInstructionsAr", ar(c.usageInstructions) as Listing["usageInstructionsAr"])
        put("storageInstructionsEn", en(c.storageInstructions) as Listing["storageInstructionsEn"])
        put("storageInstructionsAr", ar(c.storageInstructions) as Listing["storageInstructionsAr"])
        put("scienceBlockEn", en(c.science) as Listing["scienceBlockEn"])
        put("scienceBlockAr", ar(c.science) as Listing["scienceBlockAr"])

        // Arrays on the wire (@JsonValue), so no `.items` unwrapping.
        const benefits = (c.benefits ?? []).map(b => ({
            iconKey: b.icon ?? "",
            labelEn: b.label?.en ?? "", labelAr: b.label?.ar ?? "",
            descriptionEn: b.desc?.en ?? "", descriptionAr: b.desc?.ar ?? "",
        }))
        if (benefits.length) patch.benefits = benefits as Listing["benefits"]

        const ingredients = (c.ingredients ?? []).map(i => ({
            nameEn: i.name?.en ?? "", nameAr: i.name?.ar ?? "",
            amount: i.amount ?? undefined,
            unit: i.unit ?? "",
            dailyValuePct: i.dvPercent ?? undefined,
        }))
        if (ingredients.length) patch.ingredients = ingredients as Listing["ingredients"]

        const localShort = text(listing.shortDescriptionEn)
        note("identity", "shortDescription", localShort, text(en(c.shortDescription)))
    }

    // ── FAQs ──────────────────────────────────────────────────────────────
    {
        const items = (doc.faqs?.items ?? []).map((f, i) => ({
            sortOrder: i,
            questionEn: f.question?.en ?? "", questionAr: f.question?.ar ?? "",
            answerEn: f.answer?.en ?? "", answerAr: f.answer?.ar ?? "",
            // faqId is carried so a save UPDATES rather than duplicating — PUT /faqs
            // merges by faqId, exactly as variant axes merge by axisId.
            faqId: f.faqId,
        }))
        if (items.length) patch.faq = items as Listing["faq"]
    }

    // ── content blocks ────────────────────────────────────────────────────
    // ONE document read serves all six sections (it was six GETs, and before that they were
    // write-only entirely). A block never saved arrives null and each from* maps that to
    // undefined, so nothing here can overwrite an edit the operator has typed but not saved.
    // One failure now costs the whole document rather than one section — the trade the bulk
    // read makes, and the server names the block that drifted when it refuses.
    //
    // clinician-reviews is deliberately absent: ClinicianReviewsDto requires a coachId — a
    // Health Team reference — and this editor collects free text, so there is nothing to read
    // into and nothing to write out.
    {
        const blocks = doc.contentBlocks
        const superiority = fromWhySuperior(blocks?.whySuperior)
        if (superiority) patch.superiorityBlock = superiority
        const statsBlock = fromStats(blocks?.stats)
        if (statsBlock) patch.stats = statsBlock
        const comparisonBlock = fromComparison(blocks?.comparison)
        if (comparisonBlock) patch.comparison = comparisonBlock
        const reviews = fromCustomerReviews(blocks?.customerReviews)
        if (reviews) patch.reviews = reviews
        const steps = fromHowToUse(blocks?.howToUse)
        if (steps) patch.howToUse = steps
        const videos = fromInfluencerVideos(blocks?.influencerVideos)
        if (videos) patch.influencerVideos = videos
    }

    // ── media gallery — the document's media key ──────────────────────────
    // Patched ONLY when the key is PRESENT: the old-service fallback carries no media and
    // must leave the local gallery untouched; a present-but-empty [] is the truth "none
    // stored". Grouped rows map one-to-one onto the editor's assets; positions are the
    // list order the service already sorted (masters first, hero leading).
    if (doc.media !== undefined) {
        patch.mediaGallery = (doc.media ?? []).map((m, i) => ({
            assetId: String(m.mediaId),
            type: (m.type ?? "IMAGE").toUpperCase() === "VIDEO" ? "video" : "image",
            url: m.url,
            thumbnailUrl: m.thumbnailUrl ?? undefined,
            altTextEn: m.alt?.en ?? "",
            altTextAr: m.alt?.ar ?? "",
            sortOrder: i,
            isHero: !!m.isHero,
            variantIds: (m.variantIds ?? []).map(String),
        })) as Listing["mediaGallery"]
    }

    return { patch, drift, failed, mandatoryAxisCodes, serverVariants, serverPrices }
}

/**
 * The document assembled from the per-section GETs — the fallback for a service that does
 * not serve GET /products/{id} yet. All-or-nothing on the eight core reads (a healthy old
 * service answers all of them); subscription copy is best-effort exactly as the old
 * hydration was, and recommendations simply do not hydrate — the old behaviour.
 */
async function documentFromSections(productId: number): Promise<ProductDocumentRead> {
    const [identity, classification, availability, variantAxes, masterContent, faqs,
           commerce, contentBlocks] = await Promise.all([
        getIdentity(productId),
        getClassification(productId),
        getAvailability(productId),
        getVariantAxes(productId),
        getContent(productId),
        getFaqs(productId),
        getCommerce(productId),
        getContentBlocks(productId),
    ])

    let subscription: SubscriptionMarketRead[] = []
    const firstMarket = (availability ?? [])[0]?.country?.id
    if (firstMarket) {
        try {
            subscription = [await getSubscription(productId, firstMarket) as SubscriptionMarketRead]
        } catch {
            // the copy just doesn't hydrate — same as before the whole-product read existed
        }
    }

    return { identity, classification, availability, variantAxes, masterContent, faqs,
             commerce, contentBlocks, subscription, recommendations: {} }
}

/**
 * The service's axes in the editor's own VariantOption shape.
 *
 * Exported because TWO callers need it and they must agree: hydration on load, and the save
 * path immediately after create (the server seeds axes from the family policy, so a brand-new
 * product has axes the client has never seen). A second copy of this mapping is exactly the
 * kind of drift this whole change is removing.
 *
 * ⚠️ axisId and valueId are carried through deliberately. toVariantAxes() sends them back and
 * the API MERGES on them — present means update, absent means create. Dropping them here makes
 * every save orphan the old axes and regenerate variants under new signatures, detaching them
 * from their prices.
 */
export function axesToOptions(res: VariantAxesResponse): VariantOption[] {
    return (res.axes ?? []).map((a, i) => ({
        axisId: a.axisId,
        id: `axis-${a.axisId}`,
        kind: a.code as VariantOption["kind"],
        nameEn: a.name?.en ?? a.code,
        nameAr: a.name?.ar ?? undefined,
        position: a.sortOrder ?? i,
        values: (a.values ?? []).map((v, vi) => ({
            valueId: v.valueId,
            id: `val-${v.valueId}`,
            valueEn: v.name?.en ?? "",
            valueAr: v.name?.ar ?? undefined,
            position: v.sortOrder ?? vi,
            isActive: (v.status ?? "").toUpperCase() === "ACTIVE",
        })),
    }))
}
