// ── Which editor sections reach the content service ───────────
// Re-verified against contentservice-dev on 2026-09-02.
//
// CORRECTION to the 2026-08-30 pass: it recorded clinician-reviews, influencer-videos and
// how-to-use as "declared but not implemented". They are implemented and deployed. The 400s
// that pass saw were OUR payloads — all three DTOs are @JsonValue records over a List, so the
// wire shape is a BARE ARRAY, and the mappers were sending `{items: [...]}` with the wrong
// field names. A 400 means "wrong shape" at least as often as it means "no endpoint"; this
// file treated one as the other and the client then stopped trying for three days.
//
// Originally verified against contentservice-dev on 2026-08-30 by round-tripping every
// endpoint (PUT then GET). Four states, because "does it save?" genuinely has
// four different answers here and collapsing them would hide real breakage.
//
//   synced       — PUT accepted and the value reads back
//   partial      — part of the section saves; the rest is blocked upstream
//   upstream     — the endpoint exists but is not implemented (400, GET {})
//   local        — no endpoint exists at all; the prototype owns this data
//
// `local` is not a defect. It marks content the service has no home for yet,
// so an operator can tell "not saved to the service" from "lost".

export type SyncState = "synced" | "partial" | "upstream" | "local"

export interface SectionSync {
    state: SyncState
    /** Endpoint or reason — shown in the section banner. */
    detail: string
}

export const SECTION_SYNC: Record<string, SectionSync> = {
    // ── Reaches the service ───────────────────────────────────
    classification: { state: "synced", detail: "POST /products · PUT /classification · reads back" },
    identity: { state: "synced", detail: "PUT /identity" },
    content: { state: "synced", detail: "PUT /content" },
    faq: { state: "synced", detail: "PUT /faqs" },
    countryConfig: { state: "synced", detail: "PUT /availability/{country}" },
    subscription: { state: "synced", detail: "PUT /subscription/{country}" },
    superiority: { state: "synced", detail: "PUT /content-blocks/why-superior · reads back" },
    stats: { state: "synced", detail: "PUT /content-blocks/stats · reads back" },
    comparison: { state: "synced", detail: "PUT /content-blocks/comparison · reads back" },
    influencers: { state: "synced", detail: "Syncs to PUT /content-blocks/influencer-videos. Caption is NOT localised upstream — only the English caption is stored." },
    howToUse: { state: "synced", detail: "Syncs to PUT /content-blocks/how-to-use — the authored steps only. Usage/Dosage/Timing and Storage are separate prose fields on Master Content now; folding them in here collided with Step #1 and Step #3." },
    reviews: { state: "synced", detail: "PUT /content-blocks/customer-reviews · reads back" },
    frequentlyBought: { state: "synced", detail: "PUT /recommendations/frequently-bought" },
    recommendations: { state: "synced", detail: "PUT /recommendations/also-viewed" },

    variants: {
        state: "synced",
        detail: "PUT /variant-axes · POST /variants · PUT /variants/{id} · PUT /variants/{id}/markets/{country}",
    },

    // ── Endpoint exists, but nothing can be sent ──────────────
    clinicianReviews: { state: "upstream", detail: "The endpoint IS implemented, but the two models disagree: ClinicianReviewsDto needs a coachId — a reference to a Health Team member — and this editor collects free text (name, designation, years, image). There is nothing to send until either the editor picks a coach or the DTO takes the free-text fields." },

    // ── No endpoint at all ────────────────────────────────────
    commercial: { state: "local", detail: "The service has no hero/merchandising endpoint. Rating, hero discount, delivery time and price-per-serving stay in the prototype." },
    media: { state: "synced", detail: "POST /media (S3/GCS behind the service) · PUT /products/{id}/media, atomic — one image may serve many variants; reads back on the product document. Needs NEXT_PUBLIC_MEDIA_UPLOAD_PATH=media at build time and the D-C69 backend deployed; against an older service uploads stay preview-only." },
    seo: { state: "local", detail: "The service has no SEO endpoint. Slugs, meta tags and per-market SEO stay in the prototype." },
    flags: { state: "local", detail: "The service has no display-flags or add-ons endpoint." },
    partners: { state: "local", detail: "The service has no partner-access endpoint." },
    schemaMap: { state: "local", detail: "Reference view — no data of its own." },
    // ── Sections that had no entry, so rendered no badge ──────
    tiers: {
        state: "synced",
        detail: "Multi-buy tiers ride the price row they belong to (D-C63), so they save with the price rather than separately. A tier is read at the same scope its price row was found at — all-country or all-city, never both.",
    },
    consultation: {
        state: "local",
        detail: "The content service has no consultations department, so nothing on this section reaches it. Practitioner mapping, session length and the follow-up package are prototype-only.",
    },
    program: {
        state: "local",
        detail: "No programme endpoint. The week-by-week structure is prototype-only.",
    },
    dxPackage: {
        state: "local",
        detail: "The content service has no diagnostics department. Tier, fasting and result-time stay in the prototype.",
    },
    dxBiomarkers: {
        state: "local",
        detail: "No endpoint for a package's biomarker set. Mapped per country in the prototype, which the live data requires: 19 of 32 cross-country packages carry different marker sets.",
    },
    dxSlots: {
        state: "local",
        detail: "No endpoint for nurse slots. Slot groups are city-scoped in the Order Service, so a real group id can only be pinned on a city row — that mapping is prototype-only for now.",
    },
    // ── Treatments: city grain, prices and packs ──────────────
    // Restored: these were dropped when PR #2 was reconciled — I took his
    // section-sync wholesale and only re-added the biomarker rows, so three
    // sections that DO reach the service were rendering no badge at all.
    cityConfig: {
        state: "synced",
        detail: "PUT /products/{id}/cities/{city}. Write this BEFORE any city price — the service refuses a price for a city that is not switched on (CITY_NOT_OFFERED). The customer-slot flag is stamped from the sub-department at row creation, so it is only sent when an admin changes it.",
    },
    pricingSheet: {
        state: "synced",
        detail: "One bulk PUT /products/{id}/prices for every price row, plus a DELETE per cleared cell. An empty tier ladder clears it; omitting it leaves it untouched.",
    },
    sessionPacks: {
        state: "synced",
        detail: "POST /variants/{base}/packs mints the pack and its satellite together. Sessions is immutable, so changing a session count is delete + create.",
    },
    masterSheet: {
        state: "synced",
        detail: "GET /products/{id}/commerce — variants, every price row and city availability in one read.",
    },
    // ── Biomarker model — prototype-local in full ─────────────
    biomarkers: { state: "local", detail: "The content service publishes Health Products and Treatments only — it has no biomarker endpoint. The analyte master is authored here and stored in our own Postgres (Neon), so it persists; it is not in the content service. Codes are looked up against LOINC live via the public NLM terminology service." },
    biomarkerPanels: { state: "local", detail: "No panel endpoint on the content service. Panels replace the free-text panel name and are stored in our Postgres with ordered membership. Member cardinality (required vs optional) has a column ready for LOINC\u2019s Panels and Forms file, which needs a LOINC account." },
    referenceBands: { state: "local", detail: "No range endpoint anywhere \u2014 and LOINC does not carry ranges either: it identifies what was measured, not what is normal, which is why it has a code for the CONCEPT of a reference range that a lab fills in itself. So every band is authored by us: graded, scoped and effective-dated, with closed generations kept rather than overwritten." },
    biomarkerCodes: { state: "partial", detail: "No coding endpoint on the content service, so codes live in our Postgres. LOINC itself IS live: terms are searched against the public NLM service and a chosen term is written as mapped. What that source cannot give \u2014 example UCUM units, SYSTEM, CLASS, STATUS and the common-test rank \u2014 needs the licensed LOINC release." },
    cyot: { state: "local", detail: "No build-your-own endpoint. Component prices, selection, union pricing and lab routing are all prototype-local — and every component price is new authored data, since a legacy mini package priced a whole set of tests rather than an analyte." },
}

export const syncOf = (sectionId: string): SectionSync | undefined => SECTION_SYNC[sectionId]

export const SYNC_LABEL: Record<SyncState, string> = {
    synced: "Syncs",
    partial: "Partly blocked",
    upstream: "Not built upstream",
    local: "Prototype only",
}

export const SYNC_CLASS: Record<SyncState, string> = {
    synced: "border-emerald-200 bg-emerald-50 text-emerald-700",
    partial: "border-amber-200 bg-amber-50 text-amber-700",
    upstream: "border-red-200 bg-red-50 text-red-700",
    local: "border-slate-200 bg-slate-50 text-slate-600",
}
