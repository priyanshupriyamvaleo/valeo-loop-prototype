// ── The Design Model spine ────────────────────────────────────────────────────
//
// Single source of truth for Department → Sub-department, transcribed from the
// published artifact "Valeo Catalog — Design Model by Sub-Department"
// (5f436313-888c-4788-b63d-3a302d712565), whose authored source is
// pdp/artifact/build_flows.py → DEPARTMENTS / SUBS.
//
// The Design Model defines 5 departments and 15 sub-departments. Three
// deliberate frontend divergences are KEPT here and are due to be pushed UP
// into the Design Model (build_flows.py → regenerate → republish) rather than
// reverted out of the frontend:
//
//   · Injections and Vaccines are two sub-departments here, one ("Injections &
//     vaccines") in the Design Model — commit f18207b split them so the flow
//     follows the taxonomy.
//   · Consultations is three sub-departments here (Consultations · Programs ·
//     Doctor Visits), two in the Design Model (Clinical consultations ·
//     Lifestyle coaching).
//   · The consultations DEPARTMENT is labelled "Doctors & Health Coaches" here,
//     "Consultations & Coaching" in the Design Model — commit 698a6b5.
//
// Two Design Model corrections applied in the other direction:
//
//   · Physiotherapy & rehab sits under TREATMENTS, not Home & Personal Care.
//     api.ts had it under home_personal; the generated package data already
//     had it under treatments, so api.ts was the outlier.
//   · Mini / CYOT added — a Design Model sub-department that existed in neither
//     the frontend nor the content-service SubDepartment enum.
//   · Home & Personal Care is TWO service sub-departments — Babysitting ·
//     Elderly Care — since 2026-09-06 (product directive), superseding the
//     Design Model's "Duration care" and "Nursing-on-call" tabs; both rows
//     trace to the "duration" tab until the artifact is re-issued.
//
// Before this file, ApiService.catalogue.subDepartments() concatenated 10
// hand-written rows with 16 generated ones and returned 26, of which two ids
// (sd-treatments-iv-therapy, sd-consultations-clinical) were returned TWICE
// with different names. This module owns the list; nothing concatenates.

import { AttributeKey, Department, SubDepartment, SubDepartmentCountryConfig } from "@/types"

// ── Departments (L1) ─────────────────────────────────────────────────────────
// Keys match the Design Model's five. `health_products` was `products_devices`
// until this pass: the Design Model's department is "Health Products", and the
// frontend already labelled it that everywhere — only the key lagged.
export const DEPARTMENT_IDS: Department[] = [
    "diagnostics",
    "treatments",
    "consultations",
    "home_personal",
    "health_products",
]

// ── Country config presets ───────────────────────────────────────────────────
// Zoho routing is country × sub-department. Two presets cover every row below;
// they are the values the generated package data carried, which is the fuller
// of the two sets that existed (it has paymentMethods and OTHERS; the
// hand-written rows in api.ts did not).
//
// ⚠️ zohoOrgId is blank in every row — the ids were never confirmed by finance,
// and a blank is honest where a guess would be quoted back as fact.

const PAY_UAE = ["Paymob", "Credit Card", "COD", "Tabby", "Tamara"]
const PAY_KSA = ["Credit Card", "COD", "Tabby", "Tamara"]

/** Clinical services: DMCC in the UAE, Value Health IT in KSA. */
const SERVICE_ROUTING: SubDepartmentCountryConfig[] = [
    { country: "UAE", zohoBook: "dmcc", vat: 5, vatMode: "exclusive", invoicingEnabled: true, paymentMethods: PAY_UAE },
    { country: "KSA", zohoBook: "ksa_vhit", vat: 15, vatMode: "exclusive", invoicingEnabled: true, paymentMethods: PAY_KSA },
    { country: "KUWAIT", zohoBook: "integrative", vat: 0, vatMode: "exclusive", invoicingEnabled: true, paymentMethods: PAY_KSA },
    { country: "QATAR", zohoBook: "none", vat: 0, vatMode: "exclusive", invoicingEnabled: false, paymentMethods: ["Credit Card", "COD"] },
]

/** Supplements and other trading goods: DMCC in the UAE, Saha in KSA. */
const GOODS_ROUTING: SubDepartmentCountryConfig[] = [
    {
        country: "UAE", zohoBook: "dmcc", vat: 5, vatMode: "exclusive", invoicingEnabled: true, paymentMethods: PAY_UAE,
        overrides: [{ medicineClass: "glp1", zohoBook: "shifa", vat: 0, note: "GLP-1 / weight-loss → Shifa, zero-rated" }],
    },
    { country: "KSA", zohoBook: "saha", vat: 15, vatMode: "exclusive", invoicingEnabled: true, paymentMethods: PAY_KSA },
    { country: "KUWAIT", zohoBook: "integrative", vat: 0, vatMode: "exclusive", invoicingEnabled: true, paymentMethods: PAY_KSA },
    { country: "QATAR", zohoBook: "none", vat: 0, vatMode: "exclusive", invoicingEnabled: false, paymentMethods: ["Credit Card", "COD"] },
]

/**
 * Medicine: Shifa invoices the UAE.
 *
 * ⚠️ UNRESOLVED CONFLICT, carried forward as 5% — the two pre-existing sources
 * disagreed on the UAE base rate. api.ts had `vat: 5` with a GLP-1 override to
 * 0; the generated package data had `vat: 0` outright. 5% is the safe reading
 * (zero-rating is the documented exception for GLP-1, not the rule) but this is
 * a finance question, not a code one. 77 medicine listings depend on it.
 */
const MEDICINE_ROUTING: SubDepartmentCountryConfig[] = [
    {
        country: "UAE", zohoBook: "shifa", vat: 5, vatMode: "exclusive", invoicingEnabled: true, paymentMethods: PAY_UAE,
        overrides: [{ medicineClass: "glp1", zohoBook: "shifa", vat: 0, note: "GLP-1 / weight-loss → Shifa, zero-rated" }],
    },
    { country: "KSA", zohoBook: "saha", vat: 15, vatMode: "exclusive", invoicingEnabled: true, paymentMethods: PAY_KSA },
    { country: "QATAR", zohoBook: "none", vat: 0, vatMode: "exclusive", invoicingEnabled: false, paymentMethods: ["Credit Card", "COD"] },
]

// ── Sub-departments (L2) ─────────────────────────────────────────────────────
// `designModelKey` is the key in build_flows.py's SUBS, so a row here can be
// traced back to the artifact that governs it. Rows with no key are the
// carve-outs and quarantines described in the header.

interface SubDepartmentSeed {
    id: string
    department: Department
    nameEn: string
    nameAr: string
    slug: string
    /** SUBS key in pdp/artifact/build_flows.py, when the Design Model defines it. */
    designModelKey?: string
    attributeKeys?: AttributeKey[]
    countryConfig?: SubDepartmentCountryConfig[]
    /**
     * True when the rows pointing here have no Design Model home yet and the
     * placement is a business decision, not a mapping. Surfaced in the CMS so
     * the decision is visible rather than silently resolved.
     */
    needsDecision?: boolean
    /**
     * The `departments.code` that becomes the uid PREFIX (D-C53): a product's
     * `uid` is `{departments.code}-{product_id}` with ids from 10001, e.g.
     * `IV-10001`. Values are transcribed from `prod_migration/02_migrate.sql`'s
     * departments seed — the authoritative list — NOT invented here.
     *
     * Two seeds carry no code, deliberately:
     *   · the two `-unplaced` rows have no `departments` row at all, so no
     *     prefix can exist until their placement is decided.
     * Three seeds SHARE a code with a sibling, because the frontend splits a
     * node the database keeps whole (see the divergences at the top of this
     * file): vaccines shares INJ with injections, doctor-visits shares CLIN
     * with clinical, and mini/CYOT uses BT because D-C6 makes a mini a blood
     * package carrying `is_standalone = 0` rather than a family of its own
     * ("NOT seeded, deliberately: there is no MINI or CYOT node" — 02_migrate).
     * Sharing is CORRECT: the prefix comes from the database node, so two
     * frontend sub-departments mapping to one node must mint the same prefix.
     */
    code?: string
}

const SEEDS: SubDepartmentSeed[] = [
    // ── Diagnostics & Testing ────────────────────────────────────────────────
    {
        code: "BT", id: "sd-diagnostics-blood", department: "diagnostics", designModelKey: "blood",
        nameEn: "Blood test", nameAr: "تحليل الدم", slug: "blood-test",
        attributeKeys: ["fasting"], countryConfig: SERVICE_ROUTING,
    },
    {
        code: "NBT", id: "sd-diagnostics-non-blood", department: "diagnostics", designModelKey: "nonblood",
        nameEn: "Non-blood test", nameAr: "فحص غير دموي", slug: "non-blood-test",
        countryConfig: SERVICE_ROUTING,
    },
    {
        code: "GENO", id: "sd-diagnostics-genomics", department: "diagnostics", designModelKey: "genomics",
        nameEn: "Genomics", nameAr: "الجينوم", slug: "genomics",
        countryConfig: SERVICE_ROUTING,
    },
    {
        // Added by this pass — in the Design Model, in neither the frontend nor
        // the content-service enum. No listings yet.
        code: "BT", id: "sd-diagnostics-mini-cyot", department: "diagnostics", designModelKey: "mini",
        nameEn: "Mini / CYOT", nameAr: "الفحوصات المصغرة", slug: "mini-cyot",
        countryConfig: SERVICE_ROUTING,
    },

    // ── Treatments & Therapies ───────────────────────────────────────────────
    {
        code: "IV", id: "sd-treatments-iv-therapy", department: "treatments", designModelKey: "iv",
        nameEn: "IV therapy", nameAr: "العلاج الوريدي", slug: "iv-therapy",
        countryConfig: SERVICE_ROUTING,
    },
    {
        // Carve-out: the Design Model has one "Injections & vaccines".
        code: "INJ", id: "sd-treatments-injections", department: "treatments", designModelKey: "injections",
        nameEn: "Injections", nameAr: "الحقن", slug: "injections",
        countryConfig: SERVICE_ROUTING,
    },
    {
        // Carve-out: the other half of the Design Model's "Injections & vaccines".
        code: "INJ", id: "sd-treatments-vaccines", department: "treatments",
        nameEn: "Vaccines", nameAr: "التطعيمات", slug: "vaccines",
        countryConfig: SERVICE_ROUTING,
    },
    {
        // Design Model correction: TREATMENTS, not home_personal.
        code: "PHYSIO", id: "sd-treatments-physio-rehab", department: "treatments", designModelKey: "physio",
        nameEn: "Physiotherapy & rehab", nameAr: "العلاج الطبيعي والتأهيل", slug: "physio-rehab",
        countryConfig: SERVICE_ROUTING,
    },
    {
        // QUARANTINE — 35 rows, mostly peptide capsules / nasal sprays / topical
        // serums, plus one actual vaccine (gardasil 9). They were pointing at
        // `sd-tx-injection`, which was never defined anywhere: a dangling
        // reference, not a sub-department. Most are physical SKUs and probably
        // belong under Health Products › Medicine (MedicineClass "peptide"),
        // which would move them to another DEPARTMENT — a classification call
        // per row, so they are parked here rather than guessed.
        id: "sd-treatments-peptides-unplaced", department: "treatments",
        nameEn: "Peptides & injectables — awaiting classification", nameAr: "الببتيدات — في انتظار التصنيف",
        slug: "peptides-unplaced", needsDecision: true, countryConfig: SERVICE_ROUTING,
    },

    // ── Doctors & Health Coaches ─────────────────────────────────────────────
    {
        // Carve-out: the Design Model has "Clinical consultations".
        code: "CLIN", id: "sd-consultations-clinical", department: "consultations", designModelKey: "clinical",
        nameEn: "Consultations", nameAr: "الاستشارات", slug: "consultations",
        countryConfig: SERVICE_ROUTING,
    },
    {
        // Carve-out: closest Design Model row is "Lifestyle coaching".
        code: "LIFE", id: "sd-consultations-programs", department: "consultations", designModelKey: "lifestyle",
        nameEn: "Programs", nameAr: "البرامج", slug: "programs",
        countryConfig: SERVICE_ROUTING,
    },
    {
        // Carve-out: no Design Model equivalent.
        code: "CLIN", id: "sd-consultations-doctor-visits", department: "consultations",
        nameEn: "Doctor Visits", nameAr: "زيارات الطبيب", slug: "doctor-visits",
        countryConfig: SERVICE_ROUTING,
    },

    // ── Home & Personal Care ─────────────────────────────────────────────────
    // Product directive 2026-09-06: exactly TWO sub-departments, split by
    // SERVICE. The babysitting/elderly distinction that previously survived
    // only in listing names is the sub-department again — superseding the
    // merged "Duration care" node and the "Nursing-on-call" node.
    // departments.code seed: CARE root with BBS · ELC (staging ids 8/9/10; pdp plan 17/18/19)
    // (prod_migration/02_migrate.sql). Both rows trace to the Design Model's
    // "duration" tab until the artifact is re-issued.
    {
        code: "BBS", id: "sd-home_personal-babysitting", department: "home_personal", designModelKey: "duration",
        nameEn: "Babysitting", nameAr: "مجالسة الأطفال", slug: "babysitting",
        countryConfig: SERVICE_ROUTING,
    },
    {
        code: "ELC", id: "sd-home_personal-elderly-care", department: "home_personal", designModelKey: "duration",
        nameEn: "Elderly Care", nameAr: "رعاية المسنين", slug: "elderly-care",
        countryConfig: SERVICE_ROUTING,
    },
    // No third node, per the same directive: the 9 rows that carried the old
    // nursing/uncategorised ids were filed INTO the two services by content —
    // mother/new-born visits under Babysitting, nurse-on-call and clinical
    // home nursing under Elderly Care (scripts/remap-home-personal-subdepartments.py).

    // ── Health Products ──────────────────────────────────────────────────────
    {
        code: "SUPP", id: "sd-health_products-supplements", department: "health_products", designModelKey: "supplements",
        nameEn: "Supplements", nameAr: "المكملات الغذائية", slug: "supplements",
        countryConfig: GOODS_ROUTING,
    },
    {
        code: "MED", id: "sd-health_products-medicine", department: "health_products", designModelKey: "medicine",
        nameEn: "Medicine", nameAr: "الأدوية", slug: "medicine",
        attributeKeys: ["isMedicine", "isRxRequired", "isControlledSubstance", "medicineForm"],
        countryConfig: MEDICINE_ROUTING,
    },
    {
        code: "WEAR", id: "sd-health_products-wearables", department: "health_products", designModelKey: "wearables",
        nameEn: "Wearables", nameAr: "الأجهزة القابلة للارتداء", slug: "wearables",
        attributeKeys: ["isDevice"], countryConfig: GOODS_ROUTING,
    },
    {
        code: "GIFT", id: "sd-health_products-gift-cards", department: "health_products", designModelKey: "giftcards",
        nameEn: "Gift cards", nameAr: "بطاقات الهدايا", slug: "gift-cards",
        countryConfig: GOODS_ROUTING,
    },
    {
        // QUARANTINE — 82 rows of topical skincare and derm products (sunscreens,
        // cleansers, serums, but also Acretin 0.05% and Benzac AC, which are
        // drugs). They were pointing at `sd-prod-skincare`, never defined
        // anywhere. Health Products has four Design Model sub-departments and
        // none of them is skincare; splitting these between Supplements and
        // Medicine is a per-row clinical call, so they are parked here.
        id: "sd-health_products-skincare-unplaced", department: "health_products",
        nameEn: "Skincare — awaiting classification", nameAr: "العناية بالبشرة — في انتظار التصنيف",
        slug: "skincare-unplaced", needsDecision: true, countryConfig: GOODS_ROUTING,
    },
]

export const SUB_DEPARTMENTS: SubDepartment[] = SEEDS.map((s, i) => ({
    id: s.id,
    department: s.department,
    nameEn: s.nameEn,
    nameAr: s.nameAr,
    slug: s.slug,
    sortOrder: i,
    isActive: true,
    attributeKeys: s.attributeKeys ?? [],
    countryConfig: s.countryConfig,
}))

/**
 * `departments.code` -> sub-department id, the join with the content service.
 *
 * Both sides already carry this vocabulary and agree on it (IV, PHYSIO, SUPP,
 * MED, WEAR, BT, NBT, INJ, GENO...), which is what lets the service own WHICH
 * sub-departments exist while this file keeps owning how each one behaves.
 *
 * ⚠️ CODES ARE NOT UNIQUE, so this map is lossy and first-wins:
 *   · BT   — sd-diagnostics-blood AND sd-diagnostics-mini-cyot
 *   · INJ  — sd-treatments-injections AND sd-treatments-vaccines
 *   · CLIN — sd-treatments-peptides-unplaced AND sd-consultations-programs
 * A code feeding the uid prefix may repeat harmlessly; a code used as a JOIN KEY
 * may not. Resolving that is a taxonomy decision, not something to patch here —
 * until it is resolved, a server row carrying a duplicated code resolves to
 * whichever sub-department appears first in SEEDS, which is a guess.
 */
export const CODE_TO_SUB_DEPARTMENT_ID: Record<string, string> =
    SEEDS.reduce<Record<string, string>>(
        (acc, s) => (s.code && !(s.code in acc) ? { ...acc, [s.code]: s.id } : acc), {})

/** Sub-department id -> code, for the uid prefix and the service join. */
export const SUB_DEPARTMENT_CODES: Record<string, string> =
    SEEDS.reduce<Record<string, string>>(
        (acc, s) => (s.code ? { ...acc, [s.id]: s.code } : acc), {})

/** Sub-departments whose membership is still a business decision. */
export const SUB_DEPARTMENTS_NEEDING_DECISION: string[] =
    SEEDS.filter(s => s.needsDecision).map(s => s.id)

/** Design Model SUBS key for a sub-department id, when the artifact defines one. */
export const DESIGN_MODEL_KEYS: Record<string, string> =
    SEEDS.reduce((acc, s) => (s.designModelKey ? { ...acc, [s.id]: s.designModelKey } : acc), {})

/**
 * The write-time default for `is_customer_slot_book_enabled` (D-C62 §4).
 *
 * What decides who books is HOW THE SERVICE IS DELIVERED: a dispatched rota (a
 * phlebotomist routed by zone, a carer sent to a home) means ops assigns the visit,
 * because the slot does not exist until routing decides it. A dedicated calendar (a
 * named coach, a therapist with published slots) means the customer picks.
 *
 * ⚠️ This is a DEFAULT STAMPED ON INSERT, never a fallback read at query time. The
 * authoritative value lives on the `product_city_config` row once written, and an editor
 * can override any city. There is deliberately NO default column on `departments` or
 * anywhere else — D-C62 §4: "it would be COALESCE'd into a read query within a month,
 * and that is the read-time inheritance D-C13/D-C29 forbid."
 *
 * 33 active cities against ~1.5k products cannot be hand-ticked, and that is exactly how
 * the legacy drift happened: KSA babysitting has `Weekly plan: 10 hours` = 1 beside
 * `11 hours` = 0, and one duplicate row disagreeing with itself.
 *
 * Successor: `service_delivery_models` (D-C62 §6) replaces the sub-department as this
 * default's SOURCE. No stored data moves when it lands, because the default lives here
 * in the write path rather than in a column.
 */
export function defaultSlotBookingFor(subDepartmentId: string): boolean {
    const id = canonicalSubDepartmentId(subDepartmentId)
    // Calendar-delivered: the resource publishes slots, so the customer picks.
    if (id === "sd-treatments-physio-rehab") return true
    if (id.startsWith("sd-consultations-")) return true
    // Everything else is dispatched — blood, IV, injections, babysitting, elderly care.
    return false
}

/**
 * The uid prefix for a sub-department — `departments.code` (D-C53).
 * `undefined` means this sub-department has no `departments` row yet (the two
 * `-unplaced` seeds), so no uid can be minted for it.
 */
export function uidPrefixFor(subDepartmentId: string): string | undefined {
    const id = canonicalSubDepartmentId(subDepartmentId)
    return SEEDS.find(s => s.id === id)?.code
}

/**
 * A product's `uid`, as the database generates it: `{departments.code}-{id}`
 * with product ids from 10001 (D-C53). GENERATED, never typed — a write is
 * rejected — so this exists to DISPLAY the value, never to author it.
 */
export function buildInternalCode(subDepartmentId: string, productId: number): string | undefined {
    const prefix = uidPrefixFor(subDepartmentId)
    return prefix ? `${prefix}-${productId}` : undefined
}

export function subDepartmentsOf(department: Department): SubDepartment[] {
    return SUB_DEPARTMENTS.filter(s => s.department === department)
}

// ── Legacy id map ────────────────────────────────────────────────────────────
// Every sub-department id that existed before this pass, mapped onto the
// canonical row above. Two of these keys were never defined as sub-departments
// at all — they were dangling references on 117 listings.
//
// Kept as a named export so a remap can be re-run and reviewed rather than
// being a one-off edit nobody can retrace.
export const LEGACY_SUB_DEPARTMENT_IDS: Record<string, string> = {
    // diagnostics
    "sd-dx-blood": "sd-diagnostics-blood",                                  // 0 listings, held the `fasting` attribute
    "sd-diagnostics-blood-tests": "sd-diagnostics-blood",                   // 491
    "sd-diagnostics-non-blood-tests": "sd-diagnostics-non-blood",           // 25
    "sd-diagnostics-functional-tests": "sd-diagnostics-non-blood",          // 52 — Design Model folds functional tests into non-blood
    "sd-dx-genetic": "sd-diagnostics-genomics",                             // 0
    // treatments
    "sd-home-physio": "sd-treatments-physio-rehab",                         // 0 — was mis-filed under home_personal
    "sd-treatments-physio-rehab": "sd-treatments-physio-rehab",             // 77
    "sd-tx-injection": "sd-treatments-peptides-unplaced",                   // 35 — DANGLING, never defined
    // home & personal care — re-split by service 2026-09-06 (BABY / ELDER).
    // The 106 listing rows were re-pointed by NAME in the same pass
    // (scripts/remap-home-personal-subdepartments.py); these id-level entries
    // are the majority mapping for any STALE reference (89/99 duration-care
    // rows were babysitting; 6/7 nursing rows landed in elderly care).
    "sd-home-care": "sd-home_personal-babysitting",                         // 0
    "sd-home_personal-childcare": "sd-home_personal-babysitting",           // 89
    "sd-home_personal-duration-care": "sd-home_personal-babysitting",       // was the merged node
    "sd-home_personal-nursing": "sd-home_personal-elderly-care",            // 7
    "sd-home_personal-care-unplaced": "sd-home_personal-elderly-care",      // short-lived quarantine, removed same day (6/9 rows were nursing → elder)
    // health products
    "sd-prod-supp": "sd-health_products-supplements",                       // 212
    "sd-products_devices-supplements": "sd-health_products-supplements",    // 2
    "sd-prod-medicine": "sd-health_products-medicine",                      // 14
    "sd-products_devices-medicine": "sd-health_products-medicine",          // 63
    "sd-prod-wearable": "sd-health_products-wearables",                     // 8
    "sd-prod-giftcard": "sd-health_products-gift-cards",                    // 5
    "sd-prod-skincare": "sd-health_products-skincare-unplaced",             // 82 — DANGLING, never defined
}

/** Canonical id for a possibly-legacy sub-department id. */
export function canonicalSubDepartmentId(id: string): string {
    return LEGACY_SUB_DEPARTMENT_IDS[id] ?? id
}
