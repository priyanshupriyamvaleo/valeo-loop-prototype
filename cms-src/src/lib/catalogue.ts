import { Country, Department, FulfilmentPath, MedicineForm, Listing, MultiBuyTier, ProductVariant, RegionalData, VariantOption, VariantType, ZohoBook, VisibleOn
} from "@/types"

// ── Department (L1) metadata ──────────────────────────────────
// The 5 departments replace the old generic "pillars".
export interface DepartmentMeta {
    id: Department
    labelEn: string
    labelAr: string
    /** lucide-react icon name (resolved in the UI) */
    icon: string
    blurb: string
}

export const DEPARTMENTS: DepartmentMeta[] = [
    { id: "diagnostics", labelEn: "Diagnostics & Testing", labelAr: "التشخيص والفحوصات", icon: "TestTube", blurb: "Blood panels, genetic and lab testing." },
    { id: "treatments", labelEn: "Treatments & Therapies", labelAr: "العلاجات", icon: "Syringe", blurb: "IV therapy, injections, in-clinic and at-home procedures." },
    { id: "consultations", labelEn: "Doctors & Health Coaches", labelAr: "الأطباء ومدربو الصحة", icon: "Stethoscope", blurb: "Consultations, coached programs, and doctor visits — on call, at home, at your hotel." },
    { id: "home_personal", labelEn: "Home & Personal Care", labelAr: "الرعاية المنزلية والشخصية", icon: "HeartPulse", blurb: "Babysitting and elderly care. Physiotherapy sits under Treatments." },
    { id: "health_products", labelEn: "Health Products", labelAr: "المنتجات الصحية", icon: "Package", blurb: "Supplements, medicines, wearables and gift cards." },
]

export const DEPARTMENT_LABELS: Record<Department, string> =
    DEPARTMENTS.reduce((acc, d) => ({ ...acc, [d.id]: d.labelEn }), {} as Record<Department, string>)

export function departmentLabel(id: Department): string {
    return DEPARTMENT_LABELS[id] ?? id
}

// ── Fulfilment path (axis 2) metadata ─────────────────────────
export const FULFILMENT_PATHS: { id: FulfilmentPath; label: string; hint: string }[] = [
    { id: "blood", label: "Blood", hint: "Phlebotomy → lab → report" },
    { id: "home_service", label: "Home Service", hint: "At-home nurse / therapist visit" },
    { id: "consultation", label: "Consultation", hint: "Doctor / coach session" },
    { id: "supplement", label: "Supplement", hint: "Shipped product (incl. oral/pen medicine, devices)" },
    { id: "digital_instant", label: "Digital / Instant", hint: "Gift cards, digital goods — liability until redeemed" },
]

export const FULFILMENT_LABELS: Record<FulfilmentPath, string> =
    FULFILMENT_PATHS.reduce((acc, f) => ({ ...acc, [f.id]: f.label }), {} as Record<FulfilmentPath, string>)

export function fulfilmentLabel(id: FulfilmentPath): string {
    return FULFILMENT_LABELS[id] ?? id
}

// ── Zoho Books entities ───────────────────────────────────────
// The 6 books that matter for invoicing. Routing is country × product type ×
// clinical class — see /development › "Zoho Books — entity & routing rules".
export const ZOHO_BOOKS: { id: ZohoBook; label: string; note: string }[] = [
    { id: "dmcc", label: "DMCC / KUA (UAE)", note: "UAE default for everything" },
    { id: "shifa", label: "Shifa (UAE)", note: "UAE GLP-1 / weight-loss supplements & medicine only" },
    { id: "ksa_vhit", label: "Value Health IT (KSA)", note: "KSA service packages" },
    { id: "saha", label: "Saha (KSA)", note: "KSA supplements (trading account)" },
    { id: "integrative", label: "Integrative (Kuwait)", note: "All Kuwait" },
    { id: "none", label: "No invoicing", note: "Qatar creates no invoices at all" },
]

export const ZOHO_BOOK_LABELS: Record<ZohoBook, string> =
    ZOHO_BOOKS.reduce((acc, b) => ({ ...acc, [b.id]: b.label }), {} as Record<ZohoBook, string>)

export function zohoBookLabel(id: ZohoBook): string {
    return ZOHO_BOOK_LABELS[id] ?? id
}

// ── Attribute helpers (axis 3) ────────────────────────────────
export const MEDICINE_FORMS: MedicineForm[] = ["oral", "pen", "injectable", "iv", "topical"]

/** ORAL/PEN/TOPICAL → Supplement path · INJECTABLE/IV → Home Service. */
export function fulfilmentForMedicineForm(form: MedicineForm): FulfilmentPath {
    return form === "injectable" || form === "iv" ? "home_service" : "supplement"
}

// ── Activation gate ───────────────────────────────────────────
// A draft can always be saved partially (that's the point of incremental
// save). These are the requirements that must ALL be met before a listing
// may transition to `active`. Single source of truth for both the gated
// status control and the activation checklist UI.
export interface ActivationRequirement {
    key: string
    label: string
    met: boolean
    /** editor section id to jump to when the requirement is unmet */
    section: string
    /**
     * Route to send the operator to instead, when the thing cannot be authored
     * in this editor at all. Without this a requirement can be unmeetable: the
     * chip navigates to a section that has no control for it.
     */
    href?: string
    /** Shown under the label when the fix is somewhere else. */
    hint?: string
}

export function listingActivationRequirements(l: Listing): ActivationRequirement[] {
    // For treatments a variant is priced by a CITY row (product_pricing at city grain),
    // and its country row is never authored — so checking r.price alone would leave the
    // requirement permanently unmet no matter how many cities were priced.
    const hasPricedVariant = (l.variants ?? []).some(v =>
        (v.regionalData ?? []).some(r =>
            (r.price ?? 0) > 0 || (r.cityPrices ?? []).some(c => (c.price ?? 0) > 0)))
    const hasImage =
        (l.mediaGallery ?? []).length > 0 ||
        (l.variants ?? []).some(v => !!v.imageUrl || (v.mediaGallery ?? []).length > 0)
    return [
        { key: "internalName", label: "Internal name", met: !!l.internalName?.trim(), section: "identity" },
        { key: "displayNameEn", label: "Display name (EN)", met: !!l.displayNameEn?.trim(), section: "identity" },
        { key: "subDepartmentId", label: "Sub-department", met: !!l.subDepartmentId, section: "classification" },
        { key: "fulfilmentPath", label: "Fulfilment path", met: !!l.fulfilmentPath, section: "classification" },
        // Sub-category placement is deliberately NOT a gate. Placement is
        // merchandising — where a listing shows up in browse — while activation is
        // identity: the canonical page under its sub-department works with zero
        // placements. Gating Active on it blocked every real listing for a
        // marketing decision (and the field has no service persistence yet, so the
        // requirement was unsatisfiable). An unplaced Active listing is a
        // dashboard visibility item, never a publish blocker.
        // Treatments authors money in Pricing & Availability, so the chip has to navigate
        // THERE — pointing it at "variants" would send the operator to a tab that no
        // longer holds prices, which is the unactivatable dead end in reverse.
        {
            key: "variant", label: "At least one variant with a price", met: hasPricedVariant,
            section: l.department === "treatments" ? "pricingSheet" : "variants",
        },
        { key: "image", label: "At least one image", met: hasImage, section: "media" },
        // `!!l.visibleOn` was always true — the enum has no empty value, so this gate could
        // never fail. With two flags it can say something real: a listing visible on
        // neither surface appears in no listing page, which is a deliberate state but not
        // one to reach Active by accident.
        {
            key: "visibleOn", label: "Visible on at least one surface",
            met: flagsOf(l).app || flagsOf(l).web, section: "classification",
        },
        // Matrix-only gates. Appended only in matrix mode so the ~1,420 legacy
        // single-axis listings keep exactly the requirement list they had before.
        ...(usesVariantMatrix(l) ? [
            {
                key: "comboUnique",
                label: "No two variants share the same option combination",
                met: duplicateComboVariantIds(l.variants ?? []).length === 0,
                section: "variants",
            },
            {
                key: "comboComplete",
                label: "Every variant answers every option axis",
                met: (l.variants ?? []).every(v => unsetAxes(v, l.variantOptions ?? []).length === 0),
                section: "variants",
            },
        ] : []),
        /**
         * `product_variants.is_default` needs EXACTLY ONE holder per product — it is what the PDP
         * preselects — and nothing checked it. Deleting the default was a plain filter with no
         * re-homing, so a listing could reach ACTIVE with no default at all and nothing would say so.
         *
         * Not gated on `usesVariantMatrix` like the two above: a zero-axis sellable (D-C30) has
         * exactly one variant and still needs it flagged, so this applies wherever variants exist.
         */
        ...((l.variants ?? []).length > 0 ? [{
            key: "oneDefaultVariant",
            label: "Exactly one variant marked default",
            met: (l.variants ?? []).filter(v => v.isDefault).length === 1,
            section: "variants",
        }] : []),
    ]
}

export function listingUnmetRequirements(l: Listing): ActivationRequirement[] {
    return listingActivationRequirements(l).filter(r => !r.met)
}

export function canActivateListing(l: Listing): boolean {
    return listingUnmetRequirements(l).length === 0
}

// ── Shared listing baseline ───────────────────────────────────
// The single source of default field values for a listing. Spread into BOTH
// the editor's emptyListing() and the api.ts seed literals so a before/after
// diff shares one baseline (untouched defaults cancel → no phantom changes in
// the audit log).
export function listingDefaults(): Omit<Listing, "id"> {
    return {
        department: "health_products", subDepartmentId: "", internalName: "",
        displayNameEn: "", displayNameAr: "", brand: "",
        fulfilmentPath: "supplement", categoryManagerId: "", internalCategoryId: undefined,
        attributes: { isMedicine: false, isRxRequired: false, isControlledSubstance: false, isDevice: false },
        subCategoryIds: [], primarySubCategoryId: undefined,
        visibleOn: "both", isVisibleApp: true, isVisibleWeb: true, journeyIds: [],
        status: "draft", visibility: "public",
        type: "supplement", category: "", subCategory: "",
        isPrescriptionRequired: false, isOtc: false, requiresConsultation: false, regulatoryBadges: [],
        descriptionEn: "", descriptionAr: "", shortDescriptionEn: "", shortDescriptionAr: "",
        usageInstructionsEn: "", usageInstructionsAr: "", storageInstructionsEn: "", scienceBlockEn: "",
        benefits: [], ingredients: [], trustBadges: [],
        mediaGallery: [], deliveryConfig: [],
        variants: [],
        // In listingDefaults so a first save cannot show a phantom audit diff.
        variantOptions: [],
        subscriptionEnabled: false, subscriptionAutoSelected: true, subscriptionFrequencies: [],
        subscriptionDiscountPct: {}, subscriptionMinCycles: 1,
        subscriptionSavingsLabelEn: "", subscriptionTermsEn: "",
        multiBuyTiers: [],
        enhancements: [], frequentlyBoughtTogether: [], biomarkerPackages: [],
        consultationAddonEnabled: false, consultationAddonPrice: 0,
        giftWrappingEnabled: false, giftWrappingPrice: 0, extendedDeliveryEnabled: false,
        upsellBannerTextEn: "", upsellBannerTextAr: "",
        instructionTextEn: "", instructionTextAr: "", instructionPlacement: "banner",
        seoTitleEn: "", seoTitleAr: "", seoDescriptionEn: "", seoDescriptionAr: "",
        seoCanonicalUrl: "", ogImageUrl: "", slugEn: "", slugAr: "",
        hideVariantsOnConsultationLink: false, forceVariantDisplay: false,
        variantVisibilityUrlOverrideEnabled: true, subscriptionAutoSelectOverride: null,
        showCompareAtPrice: true, showStockIndicator: true, showDeliveryEstimate: true,
        consultationLinkSuppressesAddons: true,
        faq: [], reviews: [], influencerVideos: [],
        superiorityBlock: { headlineEn: "", headlineAr: "", mediaType: null, mediaUrl: "", thumbnailUrl: "", points: [] },
    }
}

// ── Variant option matrix ─────────────────────────────────────
// Axes live on the listing; a variant is one combination of axis values, and the
// variant is what carries SKU / price / stock. See VariantOption in @/types.

/**
 * Practical ceiling on generated combinations. Colour(8) × Size(5) × Flavour(6)
 * is 240 rows — every one needing a SKU and a price per country. Beyond ~100 the
 * grid stops being editable by a human and the listing should be split.
 */
export const MAX_VARIANT_COMBOS = 100

/** A listing is in matrix mode once it declares at least one axis with a value. */
export function usesVariantMatrix(l: Pick<Listing, "variantOptions">): boolean {
    return (l.variantOptions ?? []).some(o => o.values.length > 0)
}

/**
 * Stable identity of a combination, independent of axis ordering, so the same
 * combo always produces the same key across regenerations and reorders.
 */
/**
 * `product_variants.axis_signature` — sorted `axisId:valueId` pairs.
 *
 * `sessions` appends the presentation suffix `|S:N` the database uses (D-C59), because
 * a pack shares EVERY axis answer with its base and would otherwise collide with it on
 * `uk_variant_axes (product_id, axis_signature)`. The suffix is NEVER PARSED anywhere —
 * `variant_session_packs` is the sole truth for what a pack is; this only keeps the two
 * rows distinguishable.
 */
export function comboKey(
    optionValues: Record<string, string> | undefined,
    sessions?: number,
): string {
    const axes = optionValues
        ? Object.entries(optionValues)
            .filter(([, v]) => v)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([o, v]) => `${o}:${v}`)
            .join("|")
        : ""
    // A pack with no axes still needs a signature, or two packs of one axis-less
    // product would both key to "" and read as duplicates of each other.
    if (sessions && sessions >= 2) return axes ? `${axes}|S:${sessions}` : `S:${sessions}`
    return axes
}

/** Human label for a combination: "Chocolate / 500g", in axis position order. */
/**
 * An hours_per_day value reads as a DURATION, so a bare number gains its unit:
 * "6" → "6 hours". Applied at entry (the panel normalizes on blur, and the
 * normalized string is what the server stores as the label) and at render (so
 * values saved before this rule still read right in every sheet).
 */
export function withAxisUnit(kind: VariantType, valueEn: string): string {
    const v = (valueEn ?? "").trim()
    if (kind === "hours_per_day" && /^\d+(\.\d+)?$/.test(v)) return `${v} hours`
    return valueEn
}

export function comboLabel(
    optionValues: Record<string, string> | undefined,
    options: VariantOption[],
    lang: "en" | "ar" = "en",
): string {
    if (!optionValues) return ""
    return [...options]
        .sort((a, b) => a.position - b.position)
        .map(o => {
            const val = o.values.find(v => v.id === optionValues[o.id])
            if (!val) return null
            return lang === "ar" ? val.valueAr || val.valueEn : withAxisUnit(o.kind, val.valueEn)
        })
        .filter(Boolean)
        .join(" / ")
}

/** Cartesian product of the ACTIVE values of every axis. */
export function comboMatrix(options: VariantOption[]): Record<string, string>[] {
    const axes = [...options]
        .sort((a, b) => a.position - b.position)
        .map(o => ({ id: o.id, values: o.values.filter(v => v.isActive) }))
    /**
     * ⚠️ A HALF-DECLARED GRID DECLARES NOTHING. If any declared axis has no active value yet, there
     * are no COMPLETE combinations, so there is nothing to generate — D-C7 requires every declared
     * axis to be answered, and this is that rule applied at generation time instead of at save time.
     *
     * It used to `.filter(a => a.values.length > 0)`, i.e. treat an empty axis as absent. That is how
     * `IV NAD — Normal` came to exist: a treatments listing opens with Volume declared and EMPTY plus
     * Infusion speed carrying Normal, so the matrix was one combination — `{speed: Normal}` — and
     * generating minted a variant answering no Volume and no Dosage. It then took `is_default`
     * legitimately, by the "first variant a listing ever gets is the default" rule, and kept it when
     * the eight real combinations arrived. The seed for a treatments listing exists precisely to
     * remove the hand-added-variant route (D-C27 makes VOLUME mandatory on every drip); the filter
     * defeated that on the first render.
     *
     * The visible cost, and it reaches every department: while an axis sits empty the combination
     * count reads 0 rather than silently pricing the axes that happen to be filled in. That is the
     * honest number — you cannot build combinations of an axis with no values.
     */
    if (axes.length === 0 || axes.some(a => a.values.length === 0)) return []
    return axes.reduce<Record<string, string>[]>(
        (acc, axis) => acc.flatMap(row => axis.values.map(v => ({ ...row, [axis.id]: v.id }))),
        [{}],
    )
}

/**
 * Which combinations are declared by the axes but have no variant yet.
 * ADDITIVE BY DESIGN: existing variants are matched by combo key and left
 * untouched — their IDs are referenced by partner pricing (variant × country ×
 * city) and by bundles via ProductRef, so re-minting an ID would orphan both.
 */
export function missingCombos(
    options: VariantOption[],
    variants: Pick<ProductVariant, "optionValues">[],
): Record<string, string>[] {
    const have = new Set(variants.map(v => comboKey(v.optionValues)))
    return comboMatrix(options).filter(c => !have.has(comboKey(c)))
}

/**
 * Variant ids sharing a combination. Two variants holding the same value set is
 * a hard error everywhere in the industry — it makes selection→variant
 * resolution ambiguous on the PDP. Enforced in the DB by a UNIQUE constraint on
 * the sorted value set per catalog.
 */
export function duplicateComboVariantIds(
    variants: Pick<ProductVariant, "id" | "optionValues" | "sessionPack">[],
): string[] {
    const seen = new Map<string, string[]>()
    variants.forEach(v => {
        // Pack-aware: without the sessions suffix a "Pack of 3" would key identically
        // to the single it is a pack OF and both would be reported as duplicates.
        const k = comboKey(v.optionValues, v.sessionPack?.sessions)
        // The EMPTY key is a real key, not a missing one. D-C30 defines the "zero-axis
        // sellable" — a single-SKU product writes `axis_signature = ''` — so two
        // axis-less variants of one product COLLIDE on uk_variant_axes (product_id,
        // axis_signature) and the second INSERT fails. Skipping '' here let the UI
        // permit exactly what the database rejects, which is the defect the index's own
        // comment warns about: "Without this, duplicates insert cleanly — exactly what
        // product_bundles allowed until a UNIQUE was added 2026-08-05."
        seen.set(k, [...(seen.get(k) ?? []), v.id])
    })
    return [...seen.values()].filter(ids => ids.length > 1).flat()
}

/** Axes a variant has not answered — an incomplete combination cannot be sold. */
export function unsetAxes(
    v: Pick<ProductVariant, "optionValues">,
    options: VariantOption[],
): VariantOption[] {
    return options.filter(o => o.values.some(val => val.isActive) && !v.optionValues?.[o.id])
}

// ── Price arithmetic for one (variant, country) row ──────────────────────────
//
// `product_pricing` stores THREE money facts plus an intent:
//   retail_price   — the struck-through "was"
//   selling_price  — the CHARGED price and the SOURCE OF TRUTH (D-C1)
//   discount_type  — FIXED | PERCENTAGE, stored because display intent is NOT
//                    derivable: "20% off" vs "AED 50 off" is a decision
//   discount_value — the number shown, in percent or currency per the type
//
// The three numbers are linked, so an editor that lets you type any of them has to
// keep the others honest. These helpers do exactly that and nothing else: they are
// used at EDIT time to fill the other boxes, never at read time to reconstitute a
// price. D-C1 is about not recomputing a stored price on the way out; typing 10%
// and seeing the selling price update is authoring, not reading.

/** The discount implied by a retail/selling pair, expressed in the given type. */
export function discountFromPrices(
    retail: number | undefined, selling: number | undefined,
    type: "PERCENTAGE" | "FIXED",
): number | undefined {
    if (!retail || selling === undefined || retail <= 0) return undefined
    const off = retail - selling
    if (off <= 0) return undefined                       // no discount is not a 0% discount
    return type === "FIXED"
        ? Math.round(off * 100) / 100
        : Math.round((off / retail) * 10000) / 100        // 2dp, matching DECIMAL(5,2)
}

/** The selling price implied by a retail price and a discount. */
export function sellingFromDiscount(
    retail: number | undefined, value: number | undefined,
    type: "PERCENTAGE" | "FIXED",
): number | undefined {
    if (!retail || value === undefined || retail <= 0) return undefined
    const selling = type === "FIXED" ? retail - value : retail * (1 - value / 100)
    if (selling < 0) return 0
    return Math.round(selling * 100) / 100
}

/**
 * What is wrong with one price row. Mirrors the constraints the DB would enforce,
 * so a bad row is caught at type time instead of on INSERT.
 */
export function priceRowErrors(r: {
    price?: number; retailPrice?: number
    discountType?: "PERCENTAGE" | "FIXED"; discountValue?: number
}): string[] {
    const e: string[] = []
    // selling_price is NOT NULL in product_pricing, and D-C29 makes the row's
    // existence the availability answer — a row with no price says "sold, at nothing".
    if (r.price === undefined || r.price <= 0) e.push("Selling price")
    // retail_price is NOT NULL too. It is not optional: a product with no "was" price
    // still has a retail price, and it equals the selling price — nothing is struck out.
    // The write path defaults it rather than asking, so this only fires on a stored row
    // that somehow lacks one.
    if (r.retailPrice === undefined || r.retailPrice <= 0) e.push("Retail price")
    if (r.retailPrice !== undefined && r.price !== undefined && r.retailPrice < r.price) {
        e.push("Retail below selling")
    }
    if (r.discountType === "PERCENTAGE" && r.discountValue !== undefined
        && (r.discountValue <= 0 || r.discountValue > 100)) {
        e.push("Discount % out of range")
    }
    if (r.discountType === "FIXED" && r.discountValue !== undefined
        && r.retailPrice !== undefined && r.discountValue > r.retailPrice) {
        e.push("Discount exceeds retail")
    }
    return e
}

/**
 * Variants that answer an axis value which is no longer ACTIVE.
 *
 * Deactivating a value does NOT delete the variants built from it, deliberately — that
 * would destroy their price rows, and `variant_axis_values` is under a no-delete policy
 * precisely so retiring a value is reversible. But `comboMatrix` filters inactive values,
 * so those variants stop being part of the declared grid while still existing: sellable
 * rows answering an option the product no longer offers.
 *
 * The schema's way to say a variant is not sellable is `product_variants.status`, so the
 * resolution is to deactivate the VARIANT, not to remove it. This finds the ones that
 * need that call.
 */
export function variantsAnsweringInactive(
    variants: Pick<ProductVariant, "id" | "optionValues" | "status">[],
    options: VariantOption[],
): string[] {
    const dead = new Set<string>()
    options.forEach(o => o.values.forEach(v => { if (!v.isActive) dead.add(v.id) }))
    if (dead.size === 0) return []
    return variants
        .filter(v => Object.values(v.optionValues ?? {}).some(val => dead.has(val)))
        .map(v => v.id)
}

/**
 * The retail price to store for a row. `retail_price` is NOT NULL, so a blank box is
 * not "no retail" — it means nothing is struck out, and retail equals selling.
 * Never below selling: a "was" price under the charged price is not a discount.
 */
export function retailFor(selling: number, entered?: number): number {
    if (entered === undefined || entered <= 0) return selling
    return Math.max(entered, selling)
}

// ── Surfaces ─────────────────────────────────────────────────────────────────
//
// `product_master` carries `is_visible_app` and `is_visible_web`, and its own comment
// says why: "split from visible_on enum for clean surface filters". The enum cannot
// express HIDDEN ON BOTH — active, but reachable only by direct link or API — which two
// NOT NULL DEFAULT 1 columns can. These helpers keep the legacy enum readers working
// without letting the two representations drift: the booleans are authored, the enum is
// derived, and nothing writes the enum by hand.

/** The flags a legacy `visibleOn` value stands for. */
export function flagsOf(l: { visibleOn?: VisibleOn; isVisibleApp?: boolean; isVisibleWeb?: boolean }) {
    if (l.isVisibleApp !== undefined || l.isVisibleWeb !== undefined) {
        return { app: l.isVisibleApp ?? false, web: l.isVisibleWeb ?? false }
    }
    return {
        app: l.visibleOn === "app" || l.visibleOn === "both",
        web: l.visibleOn === "web" || l.visibleOn === "both",
    }
}

/**
 * The enum a pair of flags stands for. `both off` has no enum value — it degrades to
 * "web", which is why the enum was split: the state exists and the enum cannot hold it.
 * Readers that care must use `flagsOf`.
 */
export function surfaceOf(l: { visibleOn?: VisibleOn; isVisibleApp?: boolean; isVisibleWeb?: boolean }): VisibleOn {
    const f = flagsOf(l)
    if (f.app && f.web) return "both"
    if (f.app) return "app"
    return "web"
}

// ── Multi-buy scope (D-C63) ──────────────────────────────────────────────────
//
// A tier row discounts a PRICE row, so it is stored at the same grain as the price it
// discounts: `variant_multi_buy_tiers` carries a nullable country/city pair exactly like
// `product_pricing`. Supplements and medicines price by country and are tiered by country;
// treatments price by city and are tiered by city. The two cases never overlap, which is
// what lets the read rule be an EXACT match with no fallback in either direction.

/**
 * The grain a variant's prices use in one country — and therefore the grain its tiers must
 * use. City rows if it has any, otherwise the country row.
 *
 * ⚠️ Derived from the price rows rather than from the department, deliberately: the rule is
 * "follow the price", and a department is only a good proxy for that until it isn't.
 */
export function priceScopeOf(
    v: { regionalData?: RegionalData[] }, country: Country,
): "city" | "country" {
    const r = (v.regionalData ?? []).find(x => x.country === country)
    return (r?.cityPrices ?? []).some(c => c.price > 0) ? "city" : "country"
}

/**
 * Tier rows at ONE exact scope, ascending. `cityId` undefined asks for the country-scoped
 * rows (`city_id IS NULL`); a value asks for that city's, and gets only that city's.
 * Nothing here falls back to the other scope — that is the whole point of D-C63.
 */
export function tiersAt(
    v: { regionalData?: RegionalData[] }, country: Country, cityId?: string,
): MultiBuyTier[] {
    return ((v.regionalData ?? []).find(x => x.country === country)?.multiBuyTiers ?? [])
        .filter(t => t.cityId === cityId)
        .sort((a, b) => a.minQuantity - b.minQuantity)
}

/** Every tier row for a (variant, country), whatever its scope. */
export function allTiers(
    v: { regionalData?: RegionalData[] }, country: Country,
): MultiBuyTier[] {
    return (v.regionalData ?? []).find(x => x.country === country)?.multiBuyTiers ?? []
}

/**
 * Rows stored at a scope the variant is no longer priced at, which therefore no longer
 * apply. This is the D-C63 migration hazard made visible: every treatment tier written
 * before 2026-08-31 is country-scoped, and a city-priced variant does not read those.
 * They are not deleted — silently dropping money-affecting rows is worse than showing them.
 */
export function strandedTiers(
    v: { regionalData?: RegionalData[] }, country: Country,
): MultiBuyTier[] {
    const want = priceScopeOf(v, country)
    return allTiers(v, country).filter(t => (t.cityId === undefined ? "country" : "city") !== want)
}
