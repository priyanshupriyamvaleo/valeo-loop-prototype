// ══════════════════════════════════════════════════════════════════════════
// A PRICED CATALOGUE SNAPSHOT, FOR THE PROTOCOL PACKAGE BUILDER ONLY
// ══════════════════════════════════════════════════════════════════════════
//
// WHAT THIS IS. Six catalogue rows with real prices on them, so the Package
// Builder can be used and checked without a signed-in session.
//
// WHY IT EXISTS. `ApiService.catalogue.listings()` is a REAL call: it reads
// `GET /products`, and `toListingRow` maps eight fields, none of which is a
// price. Prices arrive from `GET /products/{id}/commerce`, which answers 401
// without a session. So offline every unit price is `undefined`, every line
// reads "—", and nothing about the arithmetic can be seen at all.
//
// WHAT THIS IS NOT. It is NOT a fallback inside `listings()`. That function
// stays pure, and the rule it protects is written at src/services/api.ts:27 —
// "a REAL function must NEVER fall back to mock rows on failure. A picker
// silently offering invented items is how an invented id gets saved against a
// real product." So this set is read SEPARATELY, every id carries a `demo-`
// prefix, and every row that comes from here is badged "snapshot" on screen.
//
// WHAT IT DEMONSTRATES. One row of each of the three priced-unit kinds the
// catalogue has, and both price grains:
//
//   variant          a consultation, priced per country AND per city, with a
//                    `retailPrice` above the charged price
//   service_option   the full body panels, Standard and Fast Track, priced per
//                    country and per city, Fast Track carrying its own percent
//                    discount. TWO of them, male and female, because that is
//                    the pair the protocol's variant axis switches between.
//   plan             a peptide course, priced per country with a compare-at
//
// THREE CITIES, THREE ANSWERS, on purpose:
//
//   Dubai        every item has a row. A full city price.
//   Abu Dhabi    every item has a row and two of them cost more. A DIFFERENT
//                city price, which is the reason city rows exist.
//   Sharjah      no variant has a row. A variant with no city row is NOT SOLD
//                THERE and `unitPrice` returns undefined rather than borrowing
//                the country price (D-C29) — while a service option and a plan
//                DO fall back, because those two grids resolve city over
//                country by a field-level merge. That divergence is the
//                repo's, it is deliberate, and the screen names it.
//
// The Supplement voucher is UAE-only, so switching the market to KSA shows
// what one required item with no price there does to a whole package.

import type { City, Listing } from "@/types"

/** Cities the snapshot prices against, used when the real call cannot answer. */
export const DEMO_CITIES: City[] = [
    { id: "city-1", name: "Dubai", nameAr: "دبي", country: "UAE", isActive: true },
    { id: "city-2", name: "Abu Dhabi", nameAr: "أبو ظبي", country: "UAE", isActive: true },
    { id: "city-3", name: "Sharjah", nameAr: "الشارقة", country: "UAE", isActive: true },
    { id: "city-4", name: "Riyadh", nameAr: "الرياض", country: "KSA", isActive: true },
]

/** True when a listing came from this file rather than the content service. */
export const isDemoListing = (id: string) => id.startsWith("demo-")

/** Every flag ListingAttributes requires, all false. Rows override what they need. */
const PLAIN = {
    isMedicine: false, isRxRequired: false,
    isControlledSubstance: false, isDevice: false,
}

const base = {
    displayNameAr: "",
    categoryManagerId: "cm1",
    subCategoryIds: [] as string[],
    visibleOn: "both" as const,
    journeyIds: [] as string[],
    status: "active" as const,
    visibility: "public" as const,
}

/** A single-variant priced row. Most of the six are this shape. */
function variantRow(o: {
    id: string
    name: string
    internal: string
    department: Listing["department"]
    subDepartmentId: string
    fulfilmentPath: Listing["fulfilmentPath"]
    uae: number
    /** The struck-through "was". Absent = no discount to show. */
    uaeRetail?: number
    ksa?: number
    /** City rows. A city absent from this list is NOT SOLD there. */
    cityPrices?: { cityId: string; price: number; retailPrice?: number }[]
}): Listing {
    return {
        ...base,
        id: o.id,
        department: o.department,
        subDepartmentId: o.subDepartmentId,
        internalName: o.internal,
        displayNameEn: o.name,
        fulfilmentPath: o.fulfilmentPath,
        attributes: { ...PLAIN },
        variants: [{
            id: `${o.id}-v1`,
            slugEn: o.internal, slugAr: "",
            nameEn: o.name, nameAr: "",
            variantType: "quantity",
            variantLabelEn: "Standard", variantLabelAr: "",
            vat: 5,
            isDefault: true,
            sortOrder: 0,
            status: "active",
            stockQuantity: 100,
            customFields: {},
            regionalData: [
                {
                    country: "UAE", sku: `${o.id}-UAE`, zohoId: "",
                    price: o.uae, retailPrice: o.uaeRetail,
                    vat: 5, isAvailable: true,
                    cityPrices: o.cityPrices,
                },
                ...(o.ksa !== undefined ? [{
                    country: "KSA" as const, sku: `${o.id}-KSA`, zohoId: "",
                    price: o.ksa, vat: 15, isAvailable: true,
                }] : []),
            ],
        }],
    } as Listing
}

/** A full body panel for one sex: Standard, and a Fast Track that discounts. */
function panel(id: string, sex: string, standard: number, fast: number): Listing {
    return {
        ...base,
        id: `demo-panel-${id}`,
        department: "diagnostics",
        subDepartmentId: "sd-diagnostics-blood",
        internalName: `full-body-panel-${id}`,
        displayNameEn: `Full Body Panel — ${sex}`,
        fulfilmentPath: "blood",
        attributes: { ...PLAIN },
        diagnostics: {
            tier: "proper",
            fastingRequired: true,
            fastingHours: 10,
            homeAppointment: true,
            /* The lab's turnaround lives HERE, which is why a step never has to
               say how many days anything takes. */
            reportDaysMin: 2,
            reportDaysMax: 3,
            serviceOptions: [
                {
                    id: "so-standard", kind: "standard",
                    labelEn: "Standard", isActive: true,
                    reportDaysMin: 2, reportDaysMax: 3,
                    pricing: [
                        /* The charged price with a sticker above it, so the line
                           shows a "was" without a second discount lever. */
                        { country: "UAE", price: standard, retailPrice: standard + 100 },
                        { country: "UAE", cityId: "city-1", price: standard, retailPrice: standard + 100 },
                        { country: "UAE", cityId: "city-2", price: standard + 50, retailPrice: standard + 100 },
                        { country: "KSA", price: standard + 30 },
                        { country: "KSA", cityId: "city-4", price: standard + 30 },
                    ],
                },
                {
                    id: "so-fast", kind: "fast_track",
                    labelEn: "Fast Track", isActive: true,
                    reportDaysMin: 1, reportDaysMax: 1,
                    pricing: [
                        /* Its own percent discount, applied by finalServicePrice. */
                        { country: "UAE", price: fast, retailPrice: fast, discountType: "percent", discountValue: 10 },
                        { country: "KSA", price: fast + 50, discountType: "percent", discountValue: 10 },
                    ],
                },
            ],
        },
    } as Listing
}

export const DEMO_LISTINGS: Listing[] = [
    // ── service_option: the blood panels, Standard and Fast Track ──
    //
    // TWO ROWS, because a full body panel really is two products: the markers
    // differ and so does the price. That is the case the protocol's variant
    // axis exists for — one sequence, and this one step points at a different
    // panel per path.
    panel("male", "Male", 890, 1200),
    panel("female", "Female", 940, 1260),

    // ── plan: a peptide course ──
    {
        ...base,
        id: "demo-med-bpc",
        department: "treatments",
        subDepartmentId: "sd-treatments-peptides-unplaced",
        internalName: "bpc-157-pen-one-month",
        displayNameEn: "BPC-157 pen, one month",
        fulfilmentPath: "home_service",
        attributes: {
            ...PLAIN, isMedicine: true, isRxRequired: true,
            medicineForm: "pen", medicineType: "peptide",
        },
        treatments: {
            plans: [{
                id: "tp-month", kind: "single",
                labelEn: "One month", subtitleEn: "Cold chain, delivered",
                isActive: true, sortOrder: 0,
                pricing: [
                    { country: "UAE", price: 1400, compareAtPrice: 1600 },
                    { country: "KSA", price: 1450, compareAtPrice: 1600 },
                ],
            }],
        },
    } as Listing,

    // ── variant: the four remaining rows ──
    /* A GLP-1 pen: medicine, not a clinical service, so it invoices from a
       DIFFERENT Zoho entity at a DIFFERENT rate. `medicineType: "glp1"` hits the
       documented override — Shifa, zero-rated — which is why the tax table has
       two entities in it and why the discount has to be split. */
    {
        ...base,
        id: "demo-med-glp1",
        department: "health_products",
        subDepartmentId: "sd-health_products-medicine",
        internalName: "semaglutide-pen-one-month",
        displayNameEn: "Semaglutide pen, one month",
        fulfilmentPath: "supplement",
        attributes: {
            ...PLAIN, isMedicine: true, isRxRequired: true,
            medicineForm: "pen", medicineType: "glp1",
        },
        variants: [{
            id: "demo-med-glp1-v1",
            slugEn: "semaglutide-pen-one-month", slugAr: "",
            nameEn: "Semaglutide pen, one month", nameAr: "",
            variantType: "quantity",
            variantLabelEn: "One month", variantLabelAr: "",
            vat: 0, isDefault: true, sortOrder: 0,
            status: "active", stockQuantity: 100, customFields: {},
            regionalData: [
                {
                    country: "UAE", sku: "demo-med-glp1-UAE", zohoId: "",
                    price: 1400, retailPrice: 1600, vat: 0, isAvailable: true,
                    cityPrices: [
                        { cityId: "city-1", price: 1400, retailPrice: 1600 },
                        { cityId: "city-2", price: 1400, retailPrice: 1600 },
                    ],
                },
                {
                    country: "KSA", sku: "demo-med-glp1-KSA", zohoId: "",
                    price: 1450, retailPrice: 1600, vat: 15, isAvailable: true,
                },
            ],
        }],
    } as Listing,

    variantRow({
        id: "demo-consult-peptide",
        name: "Peptide Therapy Consultation",
        internal: "peptide-therapy-consultation",
        department: "consultations",
        subDepartmentId: "sd-consultations-clinical",
        fulfilmentPath: "consultation",
        uae: 350, uaeRetail: 450, ksa: 385,
        /* Dubai and Abu Dhabi only. Sharjah has no row, so it is not sold there. */
        cityPrices: [
            { cityId: "city-1", price: 350, retailPrice: 450 },
            { cityId: "city-2", price: 375, retailPrice: 450 },
        ],
    }),
    variantRow({
        id: "demo-consult-gp",
        name: "General Physician Consultation",
        internal: "general-physician-consultation",
        department: "consultations",
        subDepartmentId: "sd-consultations-doctor-visits",
        fulfilmentPath: "consultation",
        uae: 150, ksa: 165,
        cityPrices: [
            { cityId: "city-1", price: 150 },
            { cityId: "city-2", price: 150 },
        ],
    }),
    variantRow({
        id: "demo-followup-review",
        name: "Follow-up Review",
        internal: "follow-up-review",
        department: "consultations",
        subDepartmentId: "sd-consultations-clinical",
        fulfilmentPath: "consultation",
        uae: 200, ksa: 220,
        cityPrices: [
            { cityId: "city-1", price: 200 },
            { cityId: "city-2", price: 200 },
        ],
    }),
    variantRow({
        id: "demo-voucher-supp",
        name: "Supplement voucher",
        internal: "supplement-voucher",
        department: "health_products",
        subDepartmentId: "sd-health_products-gift-cards",
        fulfilmentPath: "digital_instant",
        /* UAE only, on purpose: switching the market to KSA shows what a
           required item with no price there does to a package. */
        uae: 150,
        cityPrices: [
            { cityId: "city-1", price: 150 },
            { cityId: "city-2", price: 150 },
        ],
    }),
]
