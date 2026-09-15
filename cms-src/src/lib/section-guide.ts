// ── Per-section guidance ──────────────────────────────────────
// "What do I do here, how, and when" for one section of the editor.
//
// Two rules keep this from becoming decorative:
//
//   1. It is keyed on the SAME section ids as SECTION_SYNC, and whether a
//      section reaches a real API is read from there rather than repeated here.
//      One source of truth for "does this persist upstream", so guidance can
//      never claim a section saves when section-sync says it does not.
//
//   2. `before` lists prerequisites that are REAL and PROVEN — every one below
//      was hit against the live service, not imagined. Pricing a city the
//      product is not offered in genuinely returns CITY_NOT_OFFERED; a price
//      row genuinely names a variant id that has to exist first. Guidance that
//      invents plausible-sounding order is worse than none, because people
//      follow it.

export interface SectionGuide {
    /** One line: what this section is for. */
    what: string
    /** The order to fill it in. Short imperatives, not prose. */
    how: string[]
    /** What must already exist. Empty when the section stands alone. */
    before?: string[]
    /** The trap — something that has actually caught someone. */
    gotcha?: string
}

export const SECTION_GUIDE: Record<string, SectionGuide> = {
    // ── Spine ────────────────────────────────────────────────
    classification: {
        what: "Where the listing sits: department, sub-department, and who can see it.",
        how: [
            "Pick the sub-department — it decides which fields the rest of the editor shows.",
            "Set whether it appears on app, web, or both.",
            "Save. This is what creates the product and gives it an id.",
        ],
        gotcha: "Saving here FIRST is what makes every other section saveable — they all write against the product id this creates. A sub-department the content service does not publish cannot be saved at all.",
    },
    identity: {
        what: "The names this listing is known by, internally and to customers.",
        how: ["Give it an internal name for admins.", "Give it the customer-facing name in English and Arabic."],
        before: ["The listing exists (save Classification first)."],
    },
    content: {
        what: "The descriptive copy that renders on the product page.",
        how: ["Fill the English fields.", "Fill the Arabic siblings — a blank one falls back to English on the storefront."],
        before: ["The listing exists."],
    },
    faq: {
        what: "Questions and answers shown in the page's FAQ accordion.",
        how: ["Add a question and its answer.", "Repeat for each. Order here is the order shown."],
        before: ["The listing exists."],
    },

    // ── Variants and money ───────────────────────────────────
    variants: {
        what: "What the listing varies on — dose, volume, session count — and the rows those combinations produce.",
        how: [
            "Declare each axis and its values.",
            "Generate the variant rows from those combinations.",
            "Set each row's own details.",
        ],
        before: ["The listing exists."],
        gotcha: "Some sub-departments require a specific axis before variants can be generated at all — IV therapy will refuse without a `volume` axis. The error names which one.",
    },
    countryConfig: {
        what: "Which markets sell this, and the commercial terms per market.",
        how: ["Add each market you sell in.", "Set its terms — COD, coupon eligibility, VAT."],
        before: ["The listing exists."],
        gotcha: "A market that is off here makes every city inside it unreachable, however the city is set.",
    },
    cityConfig: {
        what: "Which cities the listing is actually offered in.",
        how: ["Switch on each city you serve.", "Leave the rest off — off means not offered, not 'unset'."],
        before: ["The market that city belongs to is on in Country Availability."],
        gotcha: "Do this BEFORE pricing. Pricing a city that is not switched on is refused outright — the service answers CITY_NOT_OFFERED and the price is not saved.",
    },
    pricingSheet: {
        what: "The price of each variant in each city, one market at a time.",
        how: [
            "Pick the market.",
            "Type the selling price in each city you sell that variant in.",
            "Leave retail blank unless something is struck through.",
        ],
        before: [
            "Variants exist — a price row names a variant.",
            "The cities are switched on in City Availability.",
        ],
        gotcha: "A blank cell is not zero and not 'unset' — it means NOT SOLD in that city. Clearing a selling price deletes the row.",
    },
    sessionPacks: {
        what: "Multi-session packs sold over a single-session variant.",
        how: ["Pick the base variant.", "Set the session count and its interval and validity."],
        before: ["The base variant exists."],
        gotcha: "The session count is part of the pack's identity, so it cannot be edited. A different count is a different pack — delete and create.",
    },
    subscription: {
        what: "Whether this can be bought on a recurring schedule, and at what discount.",
        how: ["Turn subscription on.", "Choose the frequencies.", "Set the discount per frequency."],
        before: ["Variants exist — a plan is keyed to a variant."],
    },

    // ── Content blocks ───────────────────────────────────────
    superiority: {
        what: "The 'why this is better' block on the product page.",
        how: ["Write the headline.", "Add the comparison points."],
        before: ["The listing exists."],
    },
    stats: {
        what: "Headline numbers — trial results, satisfaction figures.",
        how: ["Add each stat as a value and its label."],
        before: ["The listing exists."],
        gotcha: "A blank scaffold row is saved as an empty stat. Delete rows you did not fill.",
    },
    comparison: {
        what: "A comparison table against alternatives.",
        how: ["Name the columns.", "Add a row per attribute and fill each column."],
        before: ["The listing exists."],
    },
    reviews: {
        what: "Customer reviews shown on the page.",
        how: ["Add each review with its rating.", "Mark the ones that are verified."],
        before: ["The listing exists."],
    },

    // ── Biomarker model ──────────────────────────────────────
    biomarkers: {
        what: "The biomarker master — one row per biomarker, worldwide.",
        how: [
            "Create from LOINC to get the name, specimen and code in one step.",
            "Add what LOINC has no answer for: unit, tube, fasting, turnaround.",
            "Choose the markets it is offered in.",
        ],
        gotcha: "LOINC carries no reference ranges and no units through the public service — it identifies what was measured, not what is normal. Those are always authored here.",
    },
    biomarkerPanels: {
        what: "Clinical groupings — CBC, Lipid Profile. A panel is not sellable.",
        how: ["Create the panel.", "Add its biomarkers, in the order they should read.", "Set the lab panel code."],
        before: ["The biomarkers exist in the master."],
        gotcha: "Without a lab panel code a basket containing this panel cannot become one requisition — labs bill a panel under a single code, not one per member.",
    },
    referenceBands: {
        what: "The graded bands a result is read against.",
        how: ["Add a band per grade.", "Leave a bound blank for an open-ended band.", "Scope by market, lab, sex or age only where it genuinely differs."],
        before: ["The biomarker has a unit set — a band without one cannot be interpreted."],
        gotcha: "Editing never rewrites history. Closing a generation opens a new row, so an old result still resolves the band that was live when the sample was taken.",
    },
    biomarkerCodes: {
        what: "EMR and billing codes — LOINC, CPT, and the market schemes.",
        how: ["Search LOINC live and pick the term.", "Add market schemes as separate rows."],
        gotcha: "'No match exists' and 'nobody has looked yet' are different facts. Mark a confirmed no-match rather than leaving the row absent.",
    },
    cyot: {
        what: "Build-your-own: which biomarkers are selectable, and what each costs.",
        how: [
            "Set the base price per market for each biomarker.",
            "Override a city only where it differs.",
            "Set the min and max selections per market.",
        ],
        before: ["Biomarkers exist and have their markets set."],
        gotcha: "Unlike the variant pricing sheet, a blank city here means INHERIT the market price, not 'not sold'. Availability is answered by the biomarker's markets and by lab coverage instead.",
    },

    // ── Money, continued ─────────────────────────────────────
    tiers: {
        what: "Buy-more-save-more rungs on a variant's price.",
        how: ["Set the minimum quantity for the rung.", "Set the percentage off at that quantity."],
        before: ["The variant has a price in this market."],
        gotcha: "A ladder is all-country or all-city, never both — a tier is read at the same scope its price row was found at. Writing no rungs is how you turn the ladder off; there is no separate switch.",
    },
    masterSheet: {
        what: "Everything priced and offered, in one read-only view.",
        how: ["Pick the market.", "Read across to spot gaps — a variant with no price, a city with no row."],
        before: ["Variants, cities and prices exist."],
        gotcha: "Read-only on purpose. Edit in the section that owns the field, or two screens end up disagreeing about who wrote last.",
    },

    // ── Merchandising ────────────────────────────────────────
    commercial: {
        what: "The hero: rating shown, headline discount, delivery promise, price-per-serving.",
        how: ["Fill only what the card should actually claim.", "Leave the rest blank rather than guessing."],
        before: ["The listing exists."],
        gotcha: "These are display claims, not calculations — nothing here checks them against a real price or a real delivery time.",
    },
    media: {
        what: "The images and video on the product page.",
        how: ["Upload each asset.", "Order them — the first is the one the card uses."],
        before: ["The listing exists."],
        gotcha: "Uploads preview locally but are not stored yet: the agreed flow is upload → backend → S3 → a stored link, and the service has no upload endpoint. Treat anything here as unsaved.",
    },
    seo: {
        what: "Slug, title and meta description, per market and language.",
        how: ["Set the slug — it is the page's URL.", "Write the title and description.", "Repeat per market only where they genuinely differ."],
        before: ["The listing exists."],
        gotcha: "A blank field inherits: city falls back to country, country to the master. Filling every field with the same text loses that.",
    },
    flags: {
        what: "Display toggles and the add-ons offered alongside this listing.",
        how: ["Switch on the flags that apply.", "Attach the add-ons that can be bought with it."],
        before: ["The listing exists."],
    },
    partners: {
        what: "Which B2B partners can see this listing, and on what terms.",
        how: ["Add the partner.", "Set whether they own it or only view it."],
        before: ["The partner exists in Partners."],
    },

    // ── Content blocks ───────────────────────────────────────
    howToUse: {
        what: "The step-by-step usage instructions on the product page.",
        how: ["Add each step in order.", "Delete any blank scaffold rows before saving."],
        before: ["The listing exists."],
    },
    influencers: {
        what: "Influencer video embeds shown on the page.",
        how: ["Add the video and who it is by."],
        before: ["The listing exists."],
    },
    clinicianReviews: {
        what: "Reviews attributed to a named clinician.",
        how: ["Add the review and the clinician it is from."],
        before: ["The listing exists."],
        gotcha: "This one does NOT save. The service wants a Health Team coach id and this editor collects free text, so the two cannot be reconciled without a decision on which it should be. Anything typed here is lost on reload.",
    },
    frequentlyBought: {
        what: "Products offered together with this one.",
        how: ["Pick each product to bundle.", "Order them by how likely they are to be taken."],
        before: ["The other products exist as listings."],
    },
    recommendations: {
        what: "The 'customers also viewed' rail.",
        how: ["Pick the products to show."],
        before: ["The other products exist as listings."],
    },

    // ── Consultations ────────────────────────────────────────
    consultation: {
        what: "Who delivers this consultation, for how long, and what is sold after it.",
        how: [
            "Choose the practitioner type.",
            "Set the session length and what the session covers.",
            "Choose the follow-up package sold after the session.",
        ],
        before: ["The practitioner exists in Health Team, with a User Service link."],
        gotcha: "A practitioner with no User Service link cannot be mapped here — they would have no identity to assign a booking to.",
    },
    program: {
        what: "The week-by-week structure of a coaching programme.",
        how: ["Add each week.", "Put the sessions and check-ins in it."],
        before: ["The consultation details are set."],
    },

    // ── Diagnostics ──────────────────────────────────────────
    dxPackage: {
        what: "What kind of test package this is — tier, fasting, when results land.",
        how: ["Pick the tier.", "Set whether fasting is required and the result turnaround."],
        before: ["The listing exists."],
        gotcha: "Fasting and turnaround are typed here today. Where the biomarker master has them per biomarker they can be derived instead — the maximum over the set — which is why the two can disagree.",
    },
    dxBiomarkers: {
        what: "Which biomarkers this package includes, per market.",
        how: ["Pick the market.", "Add the biomarkers or whole panels it covers.", "Copy from another market, then adjust."],
        before: ["The markets are set in Country Availability."],
        gotcha: "Per market on purpose, not for convenience: 19 of 32 cross-country packages genuinely carry different marker sets. The screen shows the drift so a deliberate difference never looks like an accident.",
    },
    dxSlots: {
        what: "Nurse booking slots and the fees that travel with them.",
        how: ["Set the default slot group.", "Override per city where the group differs."],
        before: ["The cities are on in City Availability."],
        gotcha: "Slot groups are city-scoped in the Order Service, so only a city row can pin a real group id.",
    },
}

export const guideFor = (sectionId: string): SectionGuide | undefined => SECTION_GUIDE[sectionId]
