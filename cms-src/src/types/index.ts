// Core Entity
export interface Entity {
    id: string
    createdAt?: string
    updatedAt?: string
}

// Pillar 1: Content
export interface ContentItem extends Entity {
    title: string
    slug: string
    type: "landing_page" | "article" | "static_page"
    status: "draft" | "review" | "published" | "archived"
    author: string
}

export interface ContentCategory extends Entity {
    name: string
    slug: string
}

export interface Banner extends Entity {
    title: string
    location: string
    status: "active" | "inactive"
}

export interface DeliveryConfig {
    city: string
    deliveryTime: string
    isAvailable: boolean
}

// Pillar 2: Products

export type ProductType = "package" | "supplement" | "medicine" | "wearable" | "gift_card"
export type ProductStatus = "draft" | "active" | "inactive" | "archived"
export type ProductVisibility = "public" | "unlisted" | "hidden"
export type VariantStatus = "active" | "inactive" | "out_of_stock"
// `kind` is a RENDER HINT (swatch / pill / dropdown), not the axis's identity — the
// identity is its name. `volume` and `speed` added 2026-08-28 for IV: VOLUME (mL) is
// declared by every drip (D-C27) and INFUSION_SPEED carries the slow-drip price
// difference, following D-C9 which removed `is_fast_track` because "it IS the
// TURNAROUND axis". Both are per-product `variant_axes` rows like any other (D-C21).
export type VariantType = "size" | "flavour" | "quantity" | "dosage" | "denomination" | "colour" | "volume" | "speed"
    // ── consultation axes ──
    // A consultation varies by how you meet, whether it is your first time,
    // and how many sessions you buy. Legacy expressed all three as separate
    // listings, which is why one practitioner has three of them.
    | "visit" | "mode" | "sessions"
    // ── home & personal care ──
    // The single mandatory axis of BBS / ELC (HomeCareCommercePolicy): a 9-hour
    // shift and a 24-hour live-in are different provider allocations. The kind
    // string IS the axis code the service receives (mapper sends `code: o.kind`),
    // so it must match the policy's `hours_per_day` exactly.
    | "hours_per_day"

/**
 * ── Programs ──────────────────────────────────────────────────────────────────
 * A program is a LISTING carrying a Composition (its deliverables) plus this
 * schedule and its policies.
 *
 * THE BOUNDARY THAT MATTERS: the CMS authors the TEMPLATE and the RULES. Pausing,
 * cancelling or refunding one customer's enrolment is an ops action on an order —
 * it does not belong here and no screen in this CMS performs it. What the CMS
 * decides is whether a pause is permitted at all, for how long, how often, and
 * what happens to the schedule when ops applies one. Authoring policy here and
 * executing it there is what keeps one customer's exception from silently becoming
 * everybody's rule.
 *
 * Four things mean "program" and all four survive, discriminated by what is SOLD:
 *   · Journey            — context and landing page, never priced
 *   · Protocol           — clinical truth, never priced
 *   · THIS (a Listing in Doctors & Health Coaches ▸ Programs) — the sellable thing
 *   · TreatmentPlan kind "course" — multi-session within ONE treatment
 * Same treatment repeated = a course. Spanning listings or departments = a program.
 */
export type ProgramStartMode = "rolling" | "cohort"

export interface ProgramMilestone {
    id: string
    /** Days from enrolment. Deliverables reference this via CompositionMember.dayOffset. */
    dayOffset: number
    titleEn: string
    titleAr?: string
    descriptionEn?: string
    /** Optional: the deliverable that becomes redeemable at this milestone. */
    memberId?: string
    /** A milestone the customer must complete before later ones unlock. */
    isGate?: boolean
}

export interface ProgramPausePolicy {
    /** false = ops cannot pause an enrolment at all; the CMS decides, not ops. */
    allowed: boolean
    maxDaysPerPause?: number
    maxPausesPerEnrolment?: number
    /** Does the end date move out by the paused days, or stay fixed? */
    extendsEndDate: boolean
    /** Below this many days remaining, a pause is refused. */
    minDaysRemaining?: number
    /** Shown to ops at the moment they pause, so the rule travels with the action. */
    opsNoteEn?: string
}

export interface ProgramCancellationPolicy {
    /** Full refund window from enrolment. */
    coolingOffDays?: number
    /** After cooling off: nothing, pro-rata on undelivered items, or a fixed fee. */
    afterCoolingOff: "no_refund" | "pro_rata_undelivered" | "fee"
    feeAmount?: number
    /** Does a delivered physical item (shipped supplement) block a pro-rata refund? */
    deliveredItemsNonRefundable: boolean
}

export interface ProgramConfig {
    durationWeeks?: number
    startMode: ProgramStartMode
    /** cohort only: the fixed intake dates. */
    cohortStartDates?: string[]
    milestones?: ProgramMilestone[]
    /** Health Team profiles who may be assigned; the actual assignment is per enrolment. */
    coachPractitionerIds?: string[]
    requiresCoachAssignment?: boolean
    autoRenews?: boolean
    /** Renewal often differs from the acquisition price. Per country. */
    renewalPrices?: { country: Country; price: number }[]
    pausePolicy?: ProgramPausePolicy
    cancellationPolicy?: ProgramCancellationPolicy
    /** Can an enrolment be handed to another person? */
    transferable?: boolean
}

/**
 * ── Composition: the one primitive ────────────────────────────────────────────
 * NOTHING COMPOSES LISTINGS. EVERYTHING COMPOSES PRICED UNITS.
 *
 * A listing has no single price — money lives on variants (Health Products), on
 * service options (Diagnostics) and on plans (Treatments). A combo that references
 * a *listing* has referenced a folder, not something sellable. The older
 * BundleItem and ProductRef types both hard-assume a variantId, which is exactly
 * why they cannot express a combo containing a blood panel or an IV plan — and why
 * Diagnostics grew a private add-on mechanism and Treatments' freebie is only a
 * string (TreatmentPlan.giftEn).
 *
 * Combos, programs, freebies and add-ons are therefore ONE entity with different
 * rules. Flash sales and multi-buy stay outside it, by a discriminator that can be
 * applied mechanically: does it PRODUCE an order line from a member, or does it
 * only MODIFY lines that already exist?
 */
export type PricedUnitKind = "variant" | "service_option" | "plan"

export interface PricedUnitRef {
    listingId: string
    kind: PricedUnitKind
    /** ProductVariant.id | DiagnosticsServiceOption.id | TreatmentPlan.id */
    unitId: string
}

export type CompositionKind = "combo" | "program" | "freebie" | "addon"

/** CLOSED enum — adding a rule kind is a code change, never a runtime edit. */
export type CompositionRuleKind =
    | "bundle_price"          // one total per country (combo, program fee)
    | "percent_off_members"   // % off the resolved member subtotal
    | "member_sum"            // no discount; total = sum of resolved members
    | "grant_free"            // a named member at zero (freebie)

/** CLOSED enum. Cart-threshold triggers are deliberately out of phase one. */
export type CompositionTriggerKind = "always" | "attach_to"

/**
 * ── One row table, one key ────────────────────────────────────────────────────
 * A composition used to say WHERE it sells in three places that could disagree:
 * `countries: Country[]`, `rule.prices[]` (its own country/city rows) and a global
 * `startsAt`/`endsAt`. Nothing said which one won, so "is this offer live for this
 * customer right now" had three answers.
 *
 * There is now exactly ONE place: `Composition.scopes`, keyed `(country, cityId?)`.
 * A row says the offer sells there, for how much, when, and to whom. The shape
 * follows the four row tables already shipped — DiagnosticsServicePrice,
 * TreatmentPlanPrice, DiagnosticsSlotMapping, RegionalData.cityPrices — and copies
 * `id` + `isActive` from DiagnosticsSlotMapping, the only one that can retire a row
 * without deleting it, because nothing deletes.
 *
 * The payload is all-optional so a city row can override the window and INHERIT the
 * price. Merge is field-level, city over country, `undefined` = inherit — the
 * explicit undefined-stripping of effectiveSlot(), never a `{...base, ...city}`
 * spread, which turns a present-but-undefined key into a real override.
 *
 * What a row must NEVER carry: members, quantities, grantMemberId, or trigger
 * scope. The moment those go per-row this stops being an auditable document and
 * becomes an attribute-rule engine.
 */
export interface CompositionScope {
    id: string
    country: Country
    cityId?: string
    /** Retires the row without deleting it. On a country row this CASCADES to its cities. */
    isActive: boolean
    /**
     * Country rows only. Two booleans cannot express three states, so this is the
     * third: "cities_only" = a priced payload parent that does not sell country-wide,
     * only in its city rows. Default "country".
     */
    coverage?: "country" | "cities_only"
    /** bundle_price only. */
    price?: number
    /** percent_off_members only. */
    percent?: number
    /** ISO instant WITH offset — "2026-09-01T09:00:00+04:00". Never a wall clock: KSA, */
    startsAt?: string
    /** Qatar and Kuwait sit at +03 while UAE is +04, so a bare local time is silently wrong. */
    endsAt?: string
    visibleOn?: VisibleOn
    /** undefined = inherit; undefined on the country row = public. */
    audience?: CompositionAudience
    /** A CAP only. Consumption is order state and is never stored in the catalogue. */
    maxGrantsTotal?: number
    /**
     * Drift baseline — past state, not recoverable from present data. `basisSubtotal`
     * is what the members cost when `price` was last confirmed, and `basisMemberIds`
     * is WHICH members that was, so adding a member never reads as a price rise.
     */
    basisSubtotal?: number
    basisMemberIds?: string[]
    setAt?: string
}

export type CompositionAudience =
    | { kind: "public" }
    | { kind: "partner_exclusive"; partnerIds: string[] }

export interface CompositionMember {
    id: string
    ref: PricedUnitRef
    quantity: number
    /** false = an optional module: it drops out silently and the total recomputes. */
    required: boolean
    /** Ops swap list used when a part fails — same kind, same country. */
    substitutable?: PricedUnitRef[]
    /** Programs: when this member becomes deliverable, in days from start. */
    dayOffset?: number
    sortOrder: number
}

export interface Composition {
    id: string
    kind: CompositionKind
    nameEn: string
    nameAr?: string
    members: CompositionMember[]
    /** The member whose sub-department a combo/program listing inherits. */
    primaryMemberId?: string
    rule: {
        kind: CompositionRuleKind
        /**
         * Money and percent live on the scope row, not here — a rule is the same
         * arithmetic in every market; only the numbers differ.
         */
        grantMemberId?: string
        /**
         * Who invoices which part of ONE bundle price. Undefined until finance rules
         * on the four open questions in the cleanup spec; the resolver refuses a
         * cross-book bundle rather than guessing a split.
         */
        allocation?: "pro_rata_list" | "per_member"
    }
    trigger: {
        kind: CompositionTriggerKind
        /** attach_to: tag scope preferred — adding a product is one tag, not an edit. */
        parentUnits?: PricedUnitRef[]
        parentListingIds?: string[]
        parentTagId?: string
        /** Prunes a tag-scoped campaign without rewriting it as an id list. */
        exclude?: string[]
    }
    /** Presentation slot only. Never affects price, and never the app/web axis. */
    surface?: "own_page" | "pdp_addon" | "pdp_fbt" | "cart"
    /** THE one place scope lives. Empty = sells nowhere; it is never "everywhere". */
    scopes: CompositionScope[]
    /** Reuses the four listing states; nothing deletes. */
    status: ProductStatus
    /** How many free units one order may take — offer identity, not a market fact. */
    maxGrantsPerOrder?: number
}

/**
 * ── Health Team ───────────────────────────────────────────────────────────────
 * Practitioners are PROFILES, not products. The legacy data modelled 36 packages
 * named after people ("Coach Jamie Richards", "Dr Rayan…"); here the person is a
 * directory entry with their own landing page, and listings in Doctors & Health
 * Coaches MAP profiles rather than duplicating people per package.
 * Landing-page behaviour reuses the four listing states (Draft = URL dead,
 * Published, Inactive = URL live but delisted, Archived).
 */
/**
 * Health regulators are per JURISDICTION, not per country — the UAE alone has
 * three. A profile collects one licence per jurisdiction it practises in, and the
 * jurisdiction decides the authority name and what the field is called.
 */
export interface RegulatorJurisdiction {
    id: string
    country: Country
    /** Emirate/region label, or the country itself where there is one authority. */
    regionEn: string
    /** The authority a licence number belongs to. */
    authority: string
    authorityFullEn: string
}

export const REGULATOR_JURISDICTIONS: RegulatorJurisdiction[] = [
    { id: "ae-dubai", country: "UAE", regionEn: "Dubai", authority: "DHA", authorityFullEn: "Dubai Health Authority" },
    { id: "ae-abudhabi", country: "UAE", regionEn: "Abu Dhabi", authority: "DoH", authorityFullEn: "Department of Health – Abu Dhabi" },
    { id: "ae-northern", country: "UAE", regionEn: "Sharjah & Northern Emirates", authority: "MOHAP", authorityFullEn: "Ministry of Health and Prevention" },
    { id: "sa", country: "KSA", regionEn: "Saudi Arabia", authority: "SCFHS", authorityFullEn: "Saudi Commission for Health Specialties" },
    { id: "qa", country: "QATAR", regionEn: "Qatar", authority: "QCHP", authorityFullEn: "Qatar Council for Healthcare Practitioners" },
    { id: "kw", country: "KUWAIT", regionEn: "Kuwait", authority: "MOH Kuwait", authorityFullEn: "Ministry of Health – Kuwait" },
]

/** "HH:MM", 24-hour. Legacy stored windows as "HH:MM-HH:MM" strings. */
export type TimeOfDay = string

export interface AvailabilityWindow { start: TimeOfDay; end: TimeOfDay }

export type Weekday =
    | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday"

/** Sunday first — the working week across the GCC. */
export const WEEKDAYS: { id: Weekday; label: string; short: string }[] = [
    { id: "sunday", label: "Sunday", short: "Sun" },
    { id: "monday", label: "Monday", short: "Mon" },
    { id: "tuesday", label: "Tuesday", short: "Tue" },
    { id: "wednesday", label: "Wednesday", short: "Wed" },
    { id: "thursday", label: "Thursday", short: "Thu" },
    { id: "friday", label: "Friday", short: "Fri" },
    { id: "saturday", label: "Saturday", short: "Sat" },
]

/**
 * When a practitioner can actually be booked.
 *
 * This lives on the PERSON, not on each consultation they deliver — which is
 * how the legacy admin has it too (`coach-slot-selection` is keyed by coach).
 * Putting it on the listing would mean re-authoring one calendar per product.
 *
 * The slot LENGTH is not here: that belongs to the consultation
 * (`sessionMinutes` + `bufferMinutes`), because two different consultations by
 * the same doctor can legitimately be 15 and 45 minutes.
 */
export interface PractitionerAvailability {
    /** Weekday → bookable windows. Legacy `availability`, same weekday keys. */
    weekly?: Partial<Record<Weekday, AvailabilityWindow[]>>
    /**
     * Days off as ISO `YYYY-MM-DD`.
     *
     * Legacy stored `holiday` as month name → day-of-month numbers, which has no
     * year: "January: [1]" means every 1 January forever, and a one-off closure
     * silently becomes annual. Full dates instead.
     */
    blackoutDates?: string[]
    /** Legacy `lead_time` — hours of notice required before a slot is bookable. */
    leadTimeHours?: number
    /** Legacy `adv_booking_days` — how far ahead the calendar opens. */
    advanceBookingDays?: number
    /**
     * IANA zone, e.g. "Asia/Dubai". Legacy rendered this read-only and never let
     * anyone set it — which does not work for a business spanning UAE (+4) and
     * KSA (+3), where an unset zone silently means the server's.
     */
    timezone?: string
    /** Legacy Calendly links, kept because bookings still resolve through them. */
    bookingLinks?: PractitionerBookingLink[]
}

export interface PractitionerBookingLink {
    id: string
    /** Legacy `eventSubname`. */
    label?: string
    url: string
    /** Legacy `calendlyCoachMail` — the calendar the invite comes from. */
    calendarEmail?: string
    isDefault?: boolean
    isActive?: boolean
    /** Legacy `isNonCalendlyLink` — not every link is Calendly. */
    isExternal?: boolean
}

export interface PractitionerLicence {
    jurisdictionId: string
    licenceNumber?: string
    /** Scope of practice as printed on the licence. */
    titleEn?: string
    titleAr?: string
    expiresOn?: string
    /** Uploaded certificate. */
    documentUrl?: string
}

export type PractitionerKind = "doctor" | "health_coach" | "dietitian" | "nutritionist" | "physiotherapist"

/**
 * ── Consultation, against the real schema ─────────────────────────────────────
 * Three tables define this surface and nothing else does:
 *
 *   coach_role_mapping         (user_id, role) UNIQUE, + coach_follow_up_package_id
 *   valeo_professional_details user_id PK: gender, years_of_exp, photo, rating, counts
 *   questionnaires             internal_name UNIQUE, country_id, display_order, status
 *
 * Two consequences worth stating, because both are easy to model wrongly:
 *
 * 1. `coach_role_mapping.role` is a CLOSED two-value DB enum and is NOT the same
 *    thing as PractitionerKind. Kind is what someone IS professionally (five values,
 *    shown in the directory); role is the operational hat they wear in the
 *    consultation system. A dietitian can hold WEIGHTLOSS_COACH. They stay separate.
 *
 * 2. The follow-up package hangs off (user, role) — so it is a property of the
 *    PERSON'S ROLE, not of the consultation listing. It is authored on the Health
 *    Team profile, and the listing only reads it.
 *
 * No En/Ar pairs are declared below: the schema keeps every string in `translations`
 * ("the reason no other table has English and Arabic columns"), so new types must not
 * reintroduce the columns it exists to remove.
 */
export type CoachRole = "DOCTOR" | "WEIGHTLOSS_COACH"

export const COACH_ROLES: { id: CoachRole; label: string; blurb: string }[] = [
    { id: "DOCTOR", label: "Doctor", blurb: "Clinician-delivered consultation. Requires a licence in every market they practise in." },
    { id: "WEIGHTLOSS_COACH", label: "Weight-loss coach", blurb: "Coach-delivered. No regulator licence, but a follow-up package is expected." },
]

/** One row per (person, role) — a person may hold both, never the same one twice. */
/**
 * One coach on a consultation listing.
 *
 * `Listing.practitionerIds` was a flat unordered array, which cannot express a
 * MASTER COACH PACKAGE: several coaches deliver it, one owns its commercial
 * terms, and a booking has to choose between them. A flat list left three
 * questions unanswerable — who leads, whose follow-up the customer gets, and
 * who is actually bookable versus merely named on the page.
 */
export interface ListingCoach {
    practitionerId: string
    /**
     * The master coach. Exactly one per listing, and they own the commercial
     * terms — price and the default follow-up package.
     */
    isPrimary?: boolean
    /**
     * Overrides the primary's follow-up for THIS coach only.
     *
     * Undefined means "use the primary's", which is the answer for almost every
     * coach. Note this is a listing-level override: it beats the coach's own
     * `CoachRoleMapping.followUpListingId`, because what is sold after a session
     * is a property of the package the customer bought, not of the person's
     * general profile.
     */
    followUpListingId?: string
    /**
     * Whether a customer can book this coach on this package.
     *
     * Defaults to true. False is for a coach named on the page for credibility —
     * a supervising clinician, say — who does not take the sessions. Without
     * this the page and the booking calendar disagree, and the customer finds
     * out at checkout.
     */
    isBookable?: boolean
    /** Display order on the package page. */
    sortOrder?: number
}

export interface CoachRoleMapping {
    role: CoachRole
    /** coach_follow_up_package_id — the listing sold as the follow-up after a session. */
    followUpListingId?: string
}

/**
 * A questionnaire is its OWN entity (its questions, options and fact cards hang off
 * it). The CMS references one here; it is authored in Clinical → Questionnaires, the
 * same way a practitioner is authored in Health Team and only referenced by a listing.
 */
export interface Questionnaire {
    id: string
    /** questionnaires.internal_name — UNIQUE. */
    internalName: string
    /** questionnaires.country_id. Absent = available in every market. */
    country?: Country
    displayOrder: number
    status: "ACTIVE" | "INACTIVE"
    /** Derived from `questions`, never typed here. */
    questionCount?: number
}

/** Consultation sub-department config on a listing. */
/**
 * Legacy `CONSULATATION_TYPE_OPTIONS` (the typo is theirs). Kept as a closed
 * enum because it drives which fields the legacy form shows, and the migration
 * has to land somewhere.
 */
export type ConsultationKind = "PROGRAM" | "COACH_CONSULTATION" | "WEIGHTLOSS"

export const CONSULTATION_KINDS: { id: ConsultationKind; label: string; blurb: string }[] = [
    { id: "COACH_CONSULTATION", label: "Consultation", blurb: "A single booked session with a practitioner." },
    { id: "PROGRAM", label: "Program", blurb: "A multi-week coached programme rather than one session." },
    { id: "WEIGHTLOSS", label: "Weight loss", blurb: "Clinical weight-loss consultation. Carries a disclaimer and a licence line." },
]

/**
 * How the session is delivered. 34 of the 135 migrated listings encode this in
 * their NAME ("Online Weight Loss Consultation with …") — it belongs in a field,
 * or nothing can filter, price or report on it.
 */
export type ConsultationMode = "ONLINE" | "IN_CLINIC" | "AT_HOME"

export const CONSULTATION_MODES: { id: ConsultationMode; label: string }[] = [
    { id: "ONLINE", label: "Online" },
    { id: "IN_CLINIC", label: "In clinic" },
    { id: "AT_HOME", label: "At home" },
]

/** Initial vs follow-up. 14 migrated listings say "Follow-up …" in the title. */
export type ConsultationVisit = "INITIAL" | "FOLLOW_UP"

/**
 * Who may buy it. 13 migrated listings say "(for New Users only)" in the title,
 * which is an eligibility rule the storefront cannot act on as prose.
 */
export type ConsultationEligibility = "ANYONE" | "NEW_CUSTOMERS" | "EXISTING_CUSTOMERS"

export interface ConsultationConfig {
    /** Which coach role delivers it — constrains which Health Team members qualify. */
    requiredRole?: CoachRole
    /** Legacy consultationType. Required in the legacy form, so required here. */
    consultationType?: ConsultationKind
    /** Online / in clinic / at home — was trapped in the listing name. */
    mode?: ConsultationMode
    /** Initial or follow-up — was trapped in the listing name. */
    visitType?: ConsultationVisit
    /** Who can buy — was trapped in "(for New Users only)". */
    eligibility?: ConsultationEligibility
    /**
     * Legacy `isPaidConsultation`. A free consultation is a real product with a
     * zero price, not an absent price — the distinction matters at checkout.
     */
    isPaid?: boolean
    /**
     * Sessions included. Legacy has no such field, yet "Mahmoud Musa - 4
     * Sessions" exists as a listing name, so the concept is already in use.
     * 1 (or unset) is a single session.
     */
    sessionCount?: number
    /**
     * Minutes of padding after a session. Legacy `bufferDuration`, required
     * there and consumed by the booking service alongside the slot length.
     */
    bufferMinutes?: number
    /** Legacy cancellationNote / cancellationNoteAr. */
    cancellationNoteEn?: string
    cancellationNoteAr?: string
    /**
     * Which questionnaire gates booking, per market. Per country because
     * `questionnaires.country_id` is per country: one consultation legitimately asks
     * different questions in KSA than in UAE.
     */
    questionnaires?: { country: Country; questionnaireId: string }[]
    /** Minutes. Drives the slot length the Order Service books. */
    sessionMinutes?: number
    /** Whether a follow-up is included, or sold separately as the role's package. */
    followUpIncluded?: boolean
}

export interface Practitioner {
    id: string
    kind: PractitionerKind
    /**
     * 1:1 with the User Service — every Health Team member IS a user (the legacy
     * Wellbeing coaches screen even collected email + password). Blog authorship,
     * coach assignment and login all resolve through this one identity.
     */
    userServiceId?: string
    email?: string
    nameEn: string
    nameAr?: string
    /** e.g. "General Physician" — shown on plan cards and the landing page. */
    jobTitleEn?: string
    jobTitleAr?: string
    photoUrl?: string
    overviewEn?: string
    overviewAr?: string
    // ── credentials (Wellbeing coaches parity; EN + AR throughout) ──
    degreeEn?: string
    degreeAr?: string
    institutionEn?: string
    institutionAr?: string
    specializationEn?: string
    specializationAr?: string
    trainingAndCertificatesEn?: string
    trainingAndCertificatesAr?: string
    nationalityEn?: string
    nationalityAr?: string
    /** valeo_professional_details.gender — present in the schema, absent here until now. */
    gender?: string
    /** valeo_professional_details.years_of_exp is decimal(4,1), so halves are valid. */
    yearsOfExperience?: number
    languages?: string[]
    /**
     * coach_role_mapping. Separate from `kind`: this is the operational role, and it
     * carries the follow-up package because the DB hangs it off (user_id, role).
     */
    coachRoles?: CoachRoleMapping[]
    /**
     * Where they practise. This DRIVES which licences are asked for — a single
     * "DHA licence" field is wrong, because the regulator is per jurisdiction:
     * Dubai is DHA, Abu Dhabi DoH, the other emirates MOHAP, KSA is SCFHS,
     * Qatar QCHP, Kuwait MOH. Practising in a jurisdiction without its licence
     * on file is what a GCC advertising review actually objects to.
     */
    countries?: Country[]
    licences?: PractitionerLicence[]
    /** When they can be booked. Authored on the Health Team profile. */
    availability?: PractitionerAvailability
    // ── social proof: counts are DERIVED from orders/reviews, never typed ──
    starRating?: number
    reviewCount?: number
    consultationCount?: number
    // ── booking (calendly in the legacy system) ──
    calendlyLink?: string
    calendlyEmail?: string
    /** Landing page URL key; status decides whether the page resolves. */
    slug: string
    status: ProductStatus
    sortOrder: number
}

/**
 * ── Articles (the blog) ───────────────────────────────────────────────────────
 * Article categories are their OWN tree, deliberately not the product categories:
 * "Weight Loss" the blog topic and "Weight Loss" the merchandising category are
 * different things with different owners, and sharing one node is how a taxonomy
 * rots.
 *
 * Articles reuse the catalogue's four-state model (ProductStatus) rather than
 * inventing a second publishing vocabulary — Draft (URL dead) / Published /
 * Inactive (URL live, delisted) / Archived.
 */
export interface ArticleCategory {
    id: string
    nameEn: string
    nameAr?: string
    slug: string
    descriptionEn?: string
    sortOrder: number
    isActive: boolean
}

export interface Article {
    id: string
    titleEn: string
    titleAr?: string
    slug: string
    categoryIds: string[]
    /** Rich text, stored as HTML. */
    bodyEn?: string
    bodyAr?: string
    excerptEn?: string
    heroImageUrl?: string
    heroImageAltEn?: string
    /** Blog authors can ONLY be Health Team members — one identity across CMS, blog and User Service. */
    authorPractitionerId?: string
    /** Denormalised display copy of the practitioner's name at publish time. */
    authorName?: string
    /** Derived from body length at save time; never hand-typed. */
    readMinutes?: number
    status: ProductStatus
    publishedAt?: string
    tagIds?: string[]
    /**
     * Listings this article points at — "shop the article". A reference, never a
     * copy: the listing keeps owning its price, stock and status, so an article
     * can never advertise a product that has been archived or delisted.
     */
    relatedListingIds?: string[]
    seoTitleEn?: string
    seoDescriptionEn?: string
    visibleOn?: VisibleOn
    updatedAt?: string
}

/**
 * ── Flash sales ───────────────────────────────────────────────────────────────
 * A flash sale is its OWN entity, never a price written onto a listing. A listing
 * is permanent; a sale is hours or days. Writing the sale price onto the listing
 * loses the original, needs N edits to launch and N to end, and relies on somebody
 * remembering to clean up — which is exactly how "50% OFF" and "Under 99 AED"
 * became permanent CATEGORIES in the legacy catalogue.
 *
 * Listings stay untouched. The read path resolves the effective price per request,
 * and the sale expires on its own.
 */
export type FlashSaleScopeKind = "tag" | "listing"

/** Which priced unit the discount applies to — a listing no longer has one price. */
export type FlashSalePricedUnit = "all" | "variant" | "service_option" | "plan"

export type FlashSaleState = "draft" | "scheduled" | "live" | "ended"

export interface FlashSaleRule {
    country: Country
    discountType: "percent" | "fixed"
    discountValue: number
    /** Never sell below this, whatever the percentage works out to. */
    floorPrice?: number
}

export interface FlashSale {
    id: string
    name: string
    /** Draft holds it back regardless of the window; the rest is derived from time. */
    isDraft: boolean
    startsAt: string
    endsAt: string
    /** UAE and KSA do not share a clock, so the window needs one. */
    timezone: string
    scopeKind: FlashSaleScopeKind
    /** Scope by tag so adding a product to a live sale is one tag, not a sale edit. */
    tagId?: string
    listingIds?: string[]
    pricedUnit: FlashSalePricedUnit
    rules: FlashSaleRule[]
    /** Can a coupon be applied on top of the sale price? */
    stacksWithCoupons: boolean
    promoBannerId?: string
    /**
     * The sale's landing page IS a category page — same layout, hero, SEO and
     * surfaces as any other category. The sale only drives its MEMBERSHIP, so a
     * discount never becomes a taxonomy node and merchandisers get the tools they
     * already know.
     */
    landingCategoryId?: string
    /** Fallback slug when no category has been linked yet. */
    landingSlug?: string
    createdByName?: string
}

/**
 * ── Treatments: administration, dosage and plans ──────────────────────────────
 * An IV or injection is not sold as a plain SKU. Three things vary independently:
 *
 *   1. HOW it is administered — an IV drip or an injection shot. Vaccines are
 *      excluded from plans entirely: nobody buys a course of flu shots.
 *   2. WHAT DOSE — 250mg vs 500mg. This is the variant axis.
 *   3. HOW MANY / FOR WHOM — one session, a couple, a group sharing bags, or a
 *      multi-session course. This is the PLAN, and price lives on it.
 *
 * Plans are not variants: "8 sessions with a coach and free consultation" is a
 * different commercial package, not a different SKU of the same thing.
 */
export type AdministrationMethod = "iv_drip" | "injection_shot"

/** Slow infusion takes a nurse longer, so it carries a surcharge. IV only. */
export type DripSpeed = "normal" | "slow"

export type TreatmentPlanKind = "single" | "couple" | "group" | "course"

export const TREATMENT_PLAN_KINDS: {
    id: TreatmentPlanKind; label: string; blurb: string; ivOnly?: boolean
}[] = [
        { id: "single", label: "Single session", blurb: "One session delivered at home." },
        { id: "couple", label: "Couple session", blurb: "Two people treated in the same visit." },
        { id: "group", label: "Group session", blurb: "Several bags in one visit.", ivOnly: true },
        { id: "course", label: "Multi-session plan", blurb: "A course of sessions sold together, usually with a coach." },
    ]

/** The dosage axis — 250mg / 500mg on the product page. */
export interface TreatmentDosageOption {
    id: string
    labelEn: string
    labelAr?: string
    /** Bag volume, shown as "Standard — 500 ml". */
    volumeMl?: number
    isActive: boolean
}

export interface TreatmentPlanPrice {
    country: Country
    /** undefined = the country price; set = a city override. */
    cityId?: string
    price?: number
    compareAtPrice?: number
    discountType?: "percent" | "fixed"
    discountValue?: number
}

export interface TreatmentPlan {
    id: string
    kind: TreatmentPlanKind
    labelEn: string
    labelAr?: string
    /** e.g. "Standard — 500 ml" */
    subtitleEn?: string
    /** Which dose this plan is sold at. Unset = any active dose. */
    dosageOptionId?: string
    /** couple = 2; group = however many share the visit. */
    attendees?: number
    /** Group sessions buy multiple bags in one visit. IV only. */
    bagCount?: number
    /** Course: how many sessions, and how long the customer has to use them. */
    sessionCount?: number
    validityDays?: number
    dripSpeed?: DripSpeed
    // ── merchandising shown on the plan card ──
    imageUrl?: string
    benefitsEn?: string[]
    /** A bundled freebie, e.g. "Free Marine Collagen supplement". */
    giftEn?: string
    coachRecommended?: boolean
    clinicianName?: string
    clinicianRole?: string
    /** "1000+ users benefited" — stored as the number, rendered with the copy. */
    socialProofCount?: number
    includesConsultation?: boolean
    flexibleRescheduling?: boolean
    isActive: boolean
    sortOrder: number
    pricing: TreatmentPlanPrice[]
}

export interface TreatmentsConfig {
    administrationMethod?: AdministrationMethod
    /** Vaccines are administered but never sold as a plan. */
    isVaccine?: boolean
    slowDripAvailable?: boolean
    slowDripSurcharge?: number
    sessionDurationMinutes?: number
    dosageOptions?: TreatmentDosageOption[]
    plans?: TreatmentPlan[]
}

/**
 * ── Diagnostics packages ──────────────────────────────────────────────────────
 * Diagnostics is created two ways, and the distinction is behavioural, not
 * cosmetic:
 *
 *   · MINI    — an a-la-carte test (often a single marker) that can be ADDED to
 *               a proper package at checkout. Carries its own mini category.
 *   · PROPER  — a full panel. Its sub-department says which kind it is (Blood
 *               Tests / Non-Blood Tests / Genomics), and it decides whether mini
 *               packages may be added to it.
 *
 * Note the package KIND is not a new taxonomy — Blood / Non-Blood / Genomics are
 * already Diagnostics sub-departments. Only the mini/proper tier is new.
 */
export type DiagnosticsTier = "mini" | "proper"

/** What is physically collected. Drives courier, lab routing and fasting copy. */
export type SampleKind = "blood" | "urine" | "stool" | "saliva" | "swab" | "breath" | "other"

/**
 * A biomarker — one ANALYTE, worldwide.
 *
 * ⚠️ REVERSAL (2026-09-02). This comment previously read "the CMS MAPS
 * biomarkers onto packages; it never creates them — creation stays in the Admin
 * Portal, by prior decision." That decision is reversed: authoring moves here,
 * because the fields an analyte actually needs (a real unit, specimen and tube,
 * versioned reference bands, EMR codes, derived-vs-measured) have no home in
 * the legacy screen at all, and a mapping-only CMS can never add them.
 *
 * The one thing the legacy system got structurally right is preserved: this
 * list is the ANALYTE tier. Haemoglobin, LDL Cholesterol and TSH are rows here;
 * "Complete Blood Count" is not. In the LEGACY admin the atom is a *test* and
 * the biomarker is its child, which is why no biomarker id appears in any
 * legacy commerce row — but that break stops at this list.
 *
 * A biomarker is a CLINICAL FACT, not a product: no price, no SKU, and no
 * status beyond `lifecycle`. Sellability always belongs to a wrapper listing,
 * and the build-your-own component price belongs to the CHANNEL
 * (`CyotComponentPrice`), never to the analyte.
 */
export interface Biomarker {
    id: string
    /** Legacy numeric marker id, kept because every package maps by it. */
    legacyId?: number
    nameEn: string
    nameAr?: string
    sampleKind: SampleKind
    /**
     * @deprecated The panel name as free text — the vestigial panel tier.
     * Superseded by `BiomarkerPanel` + `panelIds`, and now DERIVED from panel
     * membership so the two can never disagree. Kept because
     * `groupBiomarkers()` and the package mapping UI still read it.
     */
    panelGroup?: string
    isActive: boolean

    // ── Authoring, added with creation (all optional: 100+ seeded rows predate it)
    /** Admin-facing handle, unique, EN, e.g. `vitamin_b12`. */
    internalName?: string
    /** `DRAFT | ACTIVE | DEPRECATED` — curation state. NOT sellability. */
    lifecycle?: BiomarkerLifecycle
    /** The tube its specimen is drawn into. Undefined for non-blood specimens. */
    tubeType?: TubeType
    /** A real UCUM code (`ng/mL`, `%`, `10*9/L`), not free text. */
    unitUcum?: string
    /** e.g. CLIA, HPLC. Free text until lab partners agree a vocabulary. */
    analyticalMethod?: string
    /** Per analyte. Undefined = no fasting. A package's requirement is the MAX over its set. */
    fastingHours?: number
    /** Analyte-level turnaround. A package's is the MAX over its set for the routed lab. */
    tatHours?: number
    /** A HARD restriction (PSA, Beta-HCG) — distinct from having different bands per sex. */
    sexApplicability?: "any" | "male_only" | "female_only"
    /**
     * Computed, never drawn — HOMA-IR, eGFR, TG/HDL, ApoB/ApoA1. A derived
     * analyte MUST have `inputIds` and MUST NOT have a lab mapping; both are
     * enforced in `biomarkerGaps()` rather than left as convention.
     */
    isDerived?: boolean
    /** The analytes a derived value is computed from. */
    inputIds?: string[]
    /** Panels this analyte belongs to. Many-to-many — the legacy single parent was the defect. */
    panelIds?: string[]
    /** Search, SEO and lab-report synonyms. */
    aliases?: BiomarkerAlias[]
    /** Markets that offer it. No row for a country = not offered there. */
    countryAvailability?: Country[]
    descriptionEn?: string
    descriptionAr?: string
    /** What a high result means, what to do — the legacy `cause_test`/`control_test`. */
    causesEn?: string
    whatToDoEn?: string
    imageUrl?: string
}

export type BiomarkerLifecycle = "draft" | "active" | "deprecated"

/** Blood collection tubes, by cap colour — the vernacular labs actually use. */
export type TubeType =
    | "sst_gold" | "edta_lavender" | "citrate_blue" | "fluoride_grey" | "heparin_green" | "none"

export interface BiomarkerAlias {
    alias: string
    language: "en" | "ar"
    kind: "search" | "seo" | "lab_synonym"
}

/**
 * A panel — CBC, Lipid Profile. A clinical grouping that exists whether or not
 * anyone sells it, so it lives beside the analytes and is NOT sellable: no
 * price, no SKU, no product row.
 *
 * This replaces `Biomarker.panelGroup`, a string. Two things the string could
 * not express and this can: an analyte in MORE THAN ONE panel (normal), and a
 * panel with an ordered membership.
 *
 * ⚠️ Membership is NOT country-scoped, deliberately. CBC is CBC in Riyadh. The
 * country variance that genuinely exists in the live data — 19 of 32
 * cross-country packages carry different marker sets — is a property of the
 * PACKAGE's set, and it stays on `BiomarkerCountryMap` where it already is.
 * Putting it on panel membership instead would multiply every panel by every
 * market for no clinical reason.
 */
export interface BiomarkerPanel {
    id: string
    nameEn: string
    nameAr?: string
    /**
     * DERIVED — the union of every market's map, never authored.
     *
     * Membership is per market only (see `countryMembers`), so a panel has no
     * global list to edit. This exists because everything downstream needs a
     * flat set: build-your-own expansion, the report, the biomarker count on a
     * package card. Deriving it means the flat view and the market maps can
     * never disagree, which two authored lists always eventually do.
     */
    memberIds: string[]
    /**
     * Per-market member sets, when a market genuinely differs.
     *
     * Deliberately the SAME shape the diagnostics package mapping uses
     * (`BiomarkerCountryMap`), so the per-country mapping screen is the very
     * same component rather than a second one that drifts from it.
     *
     * ⚠️ THE ONLY AUTHORED MEMBERSHIP. A market with no map here has no
     * biomarkers in this panel at all — there is no global list to fall back on,
     * because lab availability and registration genuinely differ per market and
     * a silent fallback is how a package ends up advertising a biomarker that
     * market cannot run.
     */
    countryMembers?: BiomarkerCountryMap[]
    /**
     * Labs contract and bill a panel under ONE code, not one per member. Without
     * this a build-your-own basket containing CBC cannot produce a requisition.
     */
    labPanelCode?: string
    isActive: boolean
    note?: string
}

/** The seven graded bands. The enum drives logic; the label is display only. */
export type RangeGrade =
    | "critical_low" | "low" | "suboptimal" | "normal" | "optimal" | "high" | "critical_high"

/**
 * One graded reference band, scoped and effective-dated.
 *
 * Versioning is the point: a band is the difference between "you are fine" and
 * "see a doctor", so when it moves, every report already issued under the old
 * band must stay explicable. `effectiveTo` closes a row; nothing is deleted.
 */
export interface BiomarkerRange {
    id: string
    biomarkerId: string
    /** Undefined = the default band. A market row wins over it. */
    country?: Country
    /** Undefined = any lab. A lab row wins over a country row — method-dependent bands are real. */
    labId?: string
    sex: "any" | "male" | "female"
    ageMinYears?: number
    ageMaxYears?: number
    pregnancy?: "any" | "pregnant" | "not_pregnant"
    grade: RangeGrade
    /** Either side may be undefined — an open-ended band ("> 400") is first-class. */
    low?: number
    high?: number
    /** The clinician-facing label. The legacy free text ("Minimal", "Diabetic Range") lands here. */
    labelEn?: string
    effectiveFrom: string
    effectiveTo?: string
}

/** EMR / billing code systems. Kept as rows so a new market is an insert. */
export type CodeScheme = "loinc" | "cpt" | "valeo_uae" | "valeo_ksa" | "nabidh" | "nphies" | "riayati"

/**
 * One code, for one scheme, optionally for one market.
 *
 * `status` carries the distinction a nullable column cannot: "no LOINC match
 * exists" is finished mapping work (`unmapped_confirmed`), while NO ROW is a
 * to-do. Collapsing the two makes the integration backlog unmeasurable.
 */
export interface BiomarkerCode {
    id: string
    biomarkerId: string
    scheme: CodeScheme
    country?: Country
    code?: string
    display?: string
    /** A full LOINC may be method-dependent, so a part code on the master is legitimate. */
    codeKind?: "full" | "part"
    status: "mapped" | "unmapped_confirmed" | "pending_review"
    effectiveFrom?: string
}

/**
 * The build-your-own component price.
 *
 * ⚠️ This is a price of the CHANNEL, not of the biomarker. It has no SKU, it
 * raises no invoice line of its own, and it resolves only inside an assembly —
 * which is how an analyte becomes selectable without becoming a product (and
 * without minting the one-wrapper-per-analyte the legacy system needed).
 *
 * A city row is a PEER of the country row, not an override: no row for a city
 * means not sold there, matching how every other price table here behaves.
 */
export interface CyotComponentPrice {
    biomarkerId: string
    country: Country
    /** Undefined = the country row. */
    cityId?: string
    price: number
    effectiveFrom?: string
}

/**
 * Which lab runs which analyte, where, at what cost — and under whose rules.
 *
 * ⚠️ CITY-SCOPED, deliberately. A country-only mapping cannot answer the
 * question a basket actually asks: "this analyte is priced in Al Ain, but does
 * any lab we use actually run it there?" With fulfilment scoped coarser than
 * pricing, "priced here, no lab here" is undetectable — so `cityIds` is here
 * from the start rather than added after the first stranded order.
 *
 * `prescriptionRequired` and `consentRequired` are the lab's own rules, and
 * they are the reason routing cannot wait until after payment: they change what
 * the customer must be told BEFORE they pay.
 */
export interface BiomarkerLabMapping {
    id: string
    biomarkerId: string
    labId: string
    country: Country
    /** Empty = the whole country. Otherwise only these cities. */
    cityIds?: string[]
    labTestCode?: string
    /** What the lab charges us. The sell side lives on CyotComponentPrice. */
    b2bCost?: number
    tatHours?: number
    prescriptionRequired?: boolean
    consentRequired?: boolean
    isActive: boolean
    effectiveFrom?: string
    effectiveTo?: string
}

/** Per-market build-your-own guardrails. Ops policy, so it lives in config. */
export interface CyotConfig {
    country: Country
    minSelections?: number
    maxSelections?: number
    /** Charged once per assembly on top of the component sum, if finance wants one. */
    assemblyFee?: number
    isActive: boolean
}

/**
 * Which markers this package actually includes IN THIS COUNTRY. Country-level by
 * necessity, not convenience: in the live data 19 of 32 cross-country packages
 * carry different marker sets per country (YPO Longevity Women is UAE 73 vs KSA
 * 68, only 61 shared). One global list cannot describe that.
 */
export interface BiomarkerCountryMap {
    country: Country
    biomarkerIds: string[]
    /** Non-blood tests, for Non-Blood Sample Test packages. */
    nonBiomarkerTestIds?: string[]
    /** Set when this country is deliberately different, so drift reads as intent. */
    intentionalNote?: string
}

/**
 * Nurse-booking slots and the money that travels with them. Mapped at package
 * level and overridable per country and per city — slot groups are city-scoped
 * in the Order Service (`api/v1/slots/groups?cityId=`), so a city row is the
 * only place a real group id can be pinned.
 */
export interface DiagnosticsSlotMapping {
    id: string
    country: Country
    /** undefined = the country-level default; set = a city override. */
    cityId?: string
    slotGroupId?: string
    slotGroupName?: string
    leadTimeMinutes?: number
    /** Ops promises, from Package Management's city rows. */
    orderSlaHours?: number
    coachSlaHours?: number
    operationsSlaHours?: number
    defaultLabId?: string
    reportDaysMin?: number
    reportDaysMax?: number
    deliveryTimeEn?: string
    deliveryTimeAr?: string
    specialTagEn?: string
    specialTagAr?: string
    isActive: boolean
}

/**
 * Standard vs Fast Track is a SERVICE OPTION, not a variant — Diagnostics has no
 * variant flow. It is the same panel delivered on a different turnaround, and
 * price is defined per option.
 *
 * The live data shows Fast Track is usually the identical marker set (Advanced
 * Male Blood Test: 62 markers both ways) but sometimes drops markers (Complete
 * Blood Count UAE: 20 standard vs 15 fast-track, 5 dropped), so the option can
 * record what it omits rather than pretending the panels are always equal.
 */
export type DiagnosticsServiceKind = "standard" | "fast_track"

export interface DiagnosticsServicePrice {
    country: Country
    /** undefined = the country price; set = a city override. */
    cityId?: string
    price?: number
    retailPrice?: number
    discountType?: "percent" | "fixed"
    discountValue?: number
}

export interface DiagnosticsServiceOption {
    id: string
    kind: DiagnosticsServiceKind
    labelEn: string
    labelAr?: string
    isActive: boolean
    /** The reason Fast Track exists — a shorter report turnaround. */
    reportDaysMin?: number
    reportDaysMax?: number
    /** Markers this option omits versus the mapped set. Empty = identical. */
    droppedBiomarkerIds?: string[]
    pricing: DiagnosticsServicePrice[]
}

/** Everything Diagnostics needs that the generic listing does not carry. */
export interface DiagnosticsConfig {
    tier: DiagnosticsTier
    // ── collection & lab (Package Management parity) ──
    fastingRequired?: boolean
    fastingHours?: number
    sampleTypes?: { kind: SampleKind; units?: number }[]
    providerTag?: string
    defaultLabId?: string
    reportDaysMin?: number
    reportDaysMax?: number
    homeAppointment?: boolean
    durationHours?: number
    /** Two people sampled in one visit — asked for in Diagnostics as well as Treatments. */
    allowCoupleBooking?: boolean
    coupleBookingSurcharge?: number
    // ── mini only ──
    miniCategoryId?: string
    dosesEn?: string
    dosesAr?: string
    // ── proper only ──
    allowMiniPackageAddition?: boolean
    allowNonBloodBiomarkerAddition?: boolean
    /** Minis that must NOT be offered alongside this panel (duplicate markers). */
    excludedMiniPackageIds?: string[]
    // ── the two country/city-scoped structures ──
    biomarkerCountryMaps?: BiomarkerCountryMap[]
    slotMappings?: DiagnosticsSlotMapping[]
    /** Standard / Fast Track. Pricing lives here, not on the slot rows. */
    serviceOptions?: DiagnosticsServiceOption[]
}

/** A lab that can run the panel, per country. */
export interface DiagnosticsLab {
    id: string
    nameEn: string
    country: Country
    isActive: boolean
}
/** Slot group as the Order Service returns it. */
export interface SlotGroup {
    groupId: string
    groupName: string
    cityId?: string
    leadTimeMinutes?: number
    isActive: boolean
}

/**
 * ── Tags ──────────────────────────────────────────────────────────────────────
 * A flat, cross-cutting labelling layer. Deliberately NOT a third taxonomy.
 *
 * The bright line, and the only rule that keeps tags from rotting into a shadow
 * taxonomy:
 *   · it changes which FIELDS a listing needs      → sub-department
 *   · it changes WHERE the listing appears in nav  → category / sub-category
 *   · it is a cross-cutting attribute you want to
 *     filter, merchandise or operate on            → tag
 *
 * "Cold-chain", "ramadan-2026" and "suitable for pregnancy" are tags: they cut
 * across departments and would each need a nonsense taxonomy node otherwise.
 */
export type TagNamespace = "goal" | "audience" | "condition" | "campaign" | "ops" | "clinical"

/**
 * Namespaces are a CLOSED enum on purpose. If operators can invent namespaces,
 * the sprawl problem just moves up a level. Adding one is a code change.
 */
export const TAG_NAMESPACES: { id: TagNamespace; label: string; blurb: string; example: string }[] = [
    { id: "goal", label: "Goal", blurb: "What the customer is trying to achieve.", example: "weight-loss, better-sleep" },
    { id: "audience", label: "Audience", blurb: "Who it is for.", example: "women, over-50, athletes" },
    { id: "condition", label: "Condition", blurb: "Clinical context it relates to.", example: "diabetes, pcos" },
    { id: "campaign", label: "Campaign", blurb: "Time-boxed merchandising. Expires.", example: "ramadan-2026, summer-sale" },
    { id: "ops", label: "Ops", blurb: "Fulfilment & handling. Never shown to customers.", example: "cold-chain, fragile" },
    { id: "clinical", label: "Clinical", blurb: "Safety flags surfaced on the PDP.", example: "not-in-pregnancy" },
]

/** proposed = requested by a category manager, awaiting an admin's approval. */
export type TagStatus = "active" | "inactive" | "proposed"

export interface Tag {
    id: string
    namespace: TagNamespace
    /** Unique within the namespace. The stable key the storefront filters on. */
    slug: string
    nameEn: string
    nameAr?: string
    descriptionEn?: string
    status: TagStatus
    /** Ops and clinical tags are internal; they must never reach the storefront. */
    customerFacing: boolean
    createdByName?: string
    createdAt?: string
}

/**
 * ── Variant options (axes) ────────────────────────────────────────────────────
 * Industry-standard shape, shared by Shopify, WooCommerce, BigCommerce,
 * commercetools and Saleor: the *axes* are declared once on the PRODUCT, and a
 * VARIANT is one unique combination of exactly one value per axis. The variant —
 * not the axis — is the unit that carries SKU, price and stock.
 *
 * This is what makes "Colour × Size, each combo → SKU" work without hand-adding
 * every row: declare Colour [Black, Silver] and Size [S, M, L], and the six
 * combinations are generated. It is also the correct reading of "variant type
 * can be multi-select" — the multi-select belongs on the LISTING (this listing
 * varies by Flavour AND Quantity), not on each individual variant.
 *
 * The matrix is deliberately SPARSE: declaring an axis value does not oblige a
 * variant to exist for it (Black/S may simply not be manufactured).
 */
export interface VariantOptionValue {
    /** Server id — the API merges axis values by this. */
    valueId?: number
    id: string
    valueEn: string
    valueAr?: string
    /** Colour axes render as a swatch — hex is all the FE needs to paint it. */
    swatchHex?: string
    /** Per-value media, e.g. the watch shot in Rose Gold. FE swaps the gallery on select. */
    imageUrl?: string
    position: number
    /** No-delete policy: retired values deactivate, they are never spliced out. */
    isActive: boolean
}
/**
 * `variant_session_packs` mirrored onto the variant that IS the pack (D-C59).
 * PRESENCE of this object is the fact that a variant is a pack — there is no
 * `isPack` flag, per D-C58's absence-is-the-mechanism rule.
 *
 * A pack shares every axis answer with its base (same dose, same volume, same
 * speed), so it would collide with it on `uk_variant_axes (product_id,
 * axis_signature)`. The database resolves that with a presentation suffix
 * `|S:3` on the signature that is NEVER PARSED — this satellite is the sole
 * truth. `comboKey` mirrors that suffix so the duplicate-combination check does
 * not flag a pack as a duplicate of its own base.
 */
export interface VariantSessionPack {
    /** The single-session variant this is a pack OF. `base_variant_id`, NOT NULL. */
    baseVariantId: string
    /** `CHECK (sessions >= 2)` — a 1-pack is just the base, so it has no row at all. */
    sessions: number
    /**
     * Days between visits, PER PACK (D-C61). `undefined` MEANS the customer books
     * each session (D-C30 §4) — it is not missing data, and it never inherits from
     * the product: the column exists in exactly one place (D-C13/D-C29).
     */
    sessionIntervalDays?: number
    /** How long the customer has to use the sessions. */
    validityDays?: number
    /** Provenance of the intended ladder (physio prices by an exact 10/15%) — NEVER a price. */
    intendedDiscountPct?: number
}

export interface VariantOption {
    /** Server id — the API merges axes by this. */
    axisId?: number
    id: string
    /** Drives how the FE renders the selector (swatch / pill / dropdown). */
    kind: VariantType
    nameEn: string
    nameAr?: string
    position: number
    values: VariantOptionValue[]
}
export type SubscriptionFrequency = "weekly" | "monthly" | "quarterly" | "bi_annual"
export type Country = "UAE" | "KSA" | "QATAR" | "KUWAIT" | "OTHERS"

/** One `product_city_config` row. */
export interface ProductCityConfig {
    cityId: string
    /** `status` ENUM('ACTIVE','INACTIVE') NOT NULL DEFAULT 'INACTIVE' — fails closed (D-C43). */
    status: "active" | "inactive"
    /**
     * `is_customer_slot_book_enabled` (D-C62, 2026-08-28). 1 = the customer picks their
     * own slot; 0 = ops schedules. Product × CITY, and this is its ONLY home — nothing
     * on product_master, product_variants or product_country_config carries it.
     *
     * ⚠️ Stamped at WRITE time from the product's sub-department, never inherited at read
     * (D-C62 §4). A missing city row reads as 0 — absence is an answer (D-C29), failing
     * closed — and there is deliberately no default column anywhere to COALESCE against.
     *
     * The booking side must treat this as PERMISSION, not promise: show the picker only
     * when the slot service also returns real slots (D-C62 §7).
     */
    isCustomerSlotBookEnabled?: boolean
}

export interface MediaAsset {
    assetId: string
    /**
     * Which variants this asset is ASSIGNED to — absent/empty = product-level (all
     * variants). ONE image may serve MANY variants (D-C69): the service stores a
     * placement row per assigned variant, sharing the URL; this list is the grouped
     * view it reads back. The Media Gallery section is the ONE door for both grains.
     */
    variantIds?: string[]
    type: "image" | "video"
    url: string
    thumbnailUrl?: string   // required when type = "video"
    altTextEn: string
    altTextAr: string
    sortOrder: number
    isHero: boolean
}

export interface CustomerReview {
    id: string
    reviewerName: string
    rating: 1 | 2 | 3 | 4 | 5
    reviewTextEn: string
    reviewTextAr?: string
    isVerified: boolean
    photoUrl?: string           // lifestyle / before-after photo
    videoUrl?: string           // optional review video
    videoThumbnailUrl?: string  // required if videoUrl is set
    date?: string
    sortOrder: number
}

export interface InfluencerVideo {
    id: string
    handle: string              // e.g. @mathilde_heather
    platform: "tiktok" | "instagram" | "youtube" | "other"
    videoUrl: string
    thumbnailUrl: string        // always required
    captionEn?: string
    sortOrder: number
}

export interface SuperiorityPoint {
    titleEn: string
    titleAr: string
    descriptionEn: string
    descriptionAr: string
}

export interface SuperiorityBlock {
    headlineEn: string
    headlineAr: string
    mediaType: "video" | "image" | null
    mediaUrl: string
    thumbnailUrl?: string       // required when mediaType = "video"
    points: SuperiorityPoint[]
}

export interface Benefit {
    iconKey: string
    labelEn: string
    labelAr: string
    descriptionEn: string
    descriptionAr: string
}

export interface Ingredient {
    nameEn: string
    nameAr: string
    amount: number
    unit: string
    dailyValuePct: number | null
}

export interface FAQItem {
    /** Server id — the API merges the FAQ list by this. */
    faqId?: number
    questionEn: string
    questionAr: string
    answerEn: string
    answerAr: string
    sortOrder: number
}

/**
 * One step of a `variant_multi_buy_tiers` ladder.
 *
 * ⚠️ Grain is (variant_id, country_id, min_qty) — which is why this lives on
 * `RegionalData`, already the (variant × country) row. `Listing.multiBuyTiers` was wrong
 * on BOTH axes and could not express D-C59's rule that a pack variant's ladder is its own.
 *
 * `labelEn`/`labelAr` are GONE: the table has no label column and `translations.entity_type`
 * has no tier value, so they had nowhere to persist. "Buy 2, save 5%" renders from the
 * numbers, where it cannot disagree with them.
 */
export interface MultiBuyTier {
    /** `ck_vmbt_qty` — CHECK (min_qty >= 2). A tier at 1 is just the price. */
    minQuantity: number
    /** `ck_vmbt_pct` — PERCENT, CHECK (0 < v <= 100). No currency, only a scope. */
    discountPct: number
    /**
     * `variant_multi_buy_tiers.city_id` (D-C63, 2026-08-31). `undefined` is the
     * COUNTRY-scoped row — `city_id IS NULL` — which is how supplements and medicines are
     * tiered; a value scopes the row to that city, which is how treatments are.
     *
     * ⚠️ NOT AN OVERRIDE, AND NOTHING FALLS BACK. A tier is read at the SAME scope the
     * price row was found at, so a variant's ladder is all-country or all-city and the two
     * never shadow each other. Turning a ladder off in one city is writing no row for that
     * city — the same mechanism D-C58 chose so "off in one country" needed no
     * `multi_buy_blocked` flag. An override chain would need a tombstone row to say "no
     * discount here", which is that flag under another name.
     *
     * The table mirrors `product_pricing`: a nullable country/city pair with the
     * NULL-uniqueness hole closed by a functional index on `COALESCE(...,0)`.
     */
    cityId?: string
}

/** @deprecated Misspelled and at listing grain. Kept only until callers move. */
export type MultiByTier = MultiBuyTier

export interface BundleItem {
    productId: string
    variantId: string
    quantity: number
}

export interface Bundle {
    bundleId: string
    labelEn: string
    labelAr: string
    items: BundleItem[]
    bundlePriceUae: number
    bundlePriceKsa: number
    bundlePriceQatar: number
    bundlePriceKuwait: number
    bundlePriceOthers: number
    compareAtBundlePrice: number | null
}

export interface ProductRef {
    productId: string
    variantId: string
}

export interface RegionalData {
    country: Country
    sku: string
    zohoId: string
    /**
     * `product_pricing.selling_price` — the CHARGED price and the SOURCE OF TRUTH
     * (D-C1). Renamed from `final_price` at D-C32. Never recomputed at read.
     */
    price: number
    /**
     * `product_pricing.retail_price` — the sticker / struck-through "was". NOT a
     * synonym of the selling price: for a pack VARIANT (D-C59) it is the PACK total,
     * and IV pack prices are deliberately non-linear, so it is authored, not N × unit.
     */
    retailPrice?: number
    /**
     * `product_pricing.discount_type` — FIXED | PERCENTAGE. Stored because it is
     * DISPLAY INTENT and not derivable: whether the PDP reads "20% off" or "AED 50
     * off" is a decision, not arithmetic.
     */
    discountType?: "PERCENTAGE" | "FIXED"
    /** `product_pricing.discount_value`, in percent or currency per `discountType`. */
    discountValue?: number
    /**
     * `variant_multi_buy_tiers` for this (variant, country). Ascending by `minQuantity`;
     * the highest `min_qty <= qty` wins (D-C26).
     *
     * ⚠️ NO ROWS MEANS NO TIERS IN THIS COUNTRY, and that is the mechanism — D-C58 chose
     * `country_id NOT NULL` with exact match precisely so "off in one country" needs no
     * `multi_buy_blocked` flag. Never add an "enabled" toggle beside this.
     *
     * ⚠️ A PACK VARIANT'S LADDER IS ITS OWN (D-C59): "tiers are per variant, so the base's
     * ladder never leaks onto its packs" — permitted and ALWAYS DELIBERATE.
     */
    multiBuyTiers?: MultiBuyTier[]
    vat?: number                 // VAT % — set per country (folded-in change)
    warehouse?: string           // fulfilling warehouse for this country
    warehouseStock?: number      // SKU/stock count in this warehouse (variant master stock = sum across warehouses)
    /**
     * `product_pricing` rows at the CITY grain — the table is keyed
     * (variant_id, partner_id, country_id, city_id), so a city row is a peer of the
     * country row, not a modifier of it.
     *
     * ⚠️ NOT "overrides". D-C29 makes the sparse grid ITSELF the availability answer:
     * a missing (variant, city) row means NOT SOLD THERE, never "fall back to the
     * country price". `composition.ts` still reads these with `?? r.price`, which is
     * that defect and is tracked separately.
     *
     * Carries the same three money facts as the country row, because a city row IS a
     * price row: retail, selling (the charged truth, D-C1) and the display intent.
     */
    cityPrices?: {
        cityId: string
        price: number
        retailPrice?: number
        discountType?: "PERCENTAGE" | "FIXED"
        discountValue?: number
    }[]
    subscriptionPriceWeekly?: number
    subscriptionPriceMonthly?: number
    subscriptionPriceQuarterly?: number
    subscriptionPriceBiAnnual?: number
    isAvailable: boolean
}

export interface ProductVariant {
    id: string
    /**
     * Set when this variant IS a session pack (D-C59). Presence is the fact; there
     * is no `isPack` flag (D-C58). Authored in Session Packs, never hand-added
     * here — a pack needs a base variant to point at.
     */
    sessionPack?: VariantSessionPack
    slugEn: string
    slugAr: string
    nameEn: string
    nameAr: string
    shortDescriptionEn?: string
    shortDescriptionAr?: string
    /**
     * LEGACY single-axis field. Kept because ~1,420 migrated listings carry it and
     * it still drives the FE for single-axis products. When the parent listing
     * declares `variantOptions`, `optionValues` is authoritative and this holds
     * the primary axis only.
     */
    variantType: VariantType
    /**
     * The combination this variant IS: optionId → valueId, one entry per declared
     * axis. Unique across the listing — two variants may not hold the same set.
     */
    optionValues?: Record<string, string>
    /** Derived from `optionValues` ("Chocolate / 500g") unless hand-overridden. */
    variantLabelEn: string
    variantLabelAr: string
    imageUrl?: string
    vat: number
    isDefault: boolean
    sortOrder: number
    status: VariantStatus
    stockQuantity: number
    lowStockThreshold?: number
    compareAtPriceOverride?: number
    customFields: Record<string, string>
    regionalData: RegionalData[]
    // Folded-in changes: media, SEO & name now live at the variant level.
    /**
     * @deprecated Read-only legacy grain. Variant media is authored in the LISTING's
     * mediaGallery now, each asset naming its variantId — foldVariantMedia() migrates
     * old drafts on load. Kept so stored data still parses; never write to it.
     */
    mediaGallery?: MediaAsset[]
    seoTitleEn?: string
    seoTitleAr?: string
    seoDescriptionEn?: string
    seoDescriptionAr?: string
    // FE PDP contract (Health Products / supplement variants)
    weight?: string                       // e.g. "280 gm"
    servings?: number
    pricePerServing?: number
    subscriptionPlans?: SubscriptionPlan[]
}

// FE PDP contract sub-types (Health Products).
export interface SubscriptionPlan {
    id: string
    titleEn: string          // "Single" | "Pack of 2" | …
    titleAr?: string
    frequency: string        // "Monthly" | "Every 2 months" | …
    discountPct?: number
    finalPrice?: number
    recommended: boolean
}
export interface HowToUseItem {
    iconKey?: string
    textEn: string           // "Dosage" | "Timing" | "Storage"
    textAr?: string
    subTextEn: string        // "Take 2 softgels daily"
    subTextAr?: string
}
export interface ComparisonRow {
    textEn: string
    textAr?: string
    valeo: boolean
    other: boolean
}
export interface StatItem {
    value: string            // "94%"
    labelEn: string
    labelAr?: string
}
export interface ClinicianReview {
    id: string
    name: string
    designation: string
    reviewEn: string
    reviewAr?: string
    imageUrl?: string
    experienceYears?: number
}

export interface Product extends Entity {
    // Identity & Classification
    internalName: string
    displayNameEn: string
    displayNameAr: string
    type: ProductType
    subCategory?: string
    category: string
    brand?: string
    status: ProductStatus
    visibility: ProductVisibility

    // Regulatory
    isPrescriptionRequired: boolean
    isOtc: boolean
    requiresConsultation: boolean
    isControlledSubstance: boolean
    regulatoryBadges: string[]

    // Type-conditional: Wearable
    wearableManufacturer?: string
    wearableConnectivity?: string
    wearableCompatibility?: string
    wearableWarrantyMonths?: number
    wearableSpecs?: Record<string, string>

    // Type-conditional: Gift Card
    giftCardValidity?: string
    giftCardRedemptionType?: "digital" | "physical" | "both"
    giftCardTermsEn?: string
    giftCardTermsAr?: string
    giftCardRedemptionScope?: string[]

    // Type-conditional: Medicine
    medicineGenericName?: string
    medicineDisclaimerEn?: string
    medicineDisclaimerAr?: string
    medicineContraindications?: string
    medicineMechanismEn?: string
    medicineMechanismAr?: string

    // Master Content
    descriptionEn: string
    descriptionAr: string
    shortDescriptionEn?: string
    shortDescriptionAr?: string
    benefits: Benefit[]
    ingredients: Ingredient[]
    usageInstructionsEn?: string
    usageInstructionsAr?: string
    storageInstructionsEn?: string
    storageInstructionsAr?: string
    trustBadges: string[]
    scienceBlockEn?: string
    scienceBlockAr?: string

    // Media
    mediaGallery: MediaAsset[]

    // Delivery
    deliveryConfig: DeliveryConfig[]

    // Subscription
    subscriptionEnabled: boolean
    subscriptionAutoSelected: boolean
    subscriptionFrequencies: SubscriptionFrequency[]
    subscriptionDiscountPct: Partial<Record<SubscriptionFrequency, number>>
    subscriptionSavingsLabelEn?: string
    subscriptionSavingsLabelAr?: string
    subscriptionTermsEn?: string
    subscriptionTermsAr?: string
    subscriptionMinCycles: number

    // Multi-buy
    multiBuyTiers: MultiByTier[]

    // Bundles
    bundles: Bundle[]

    // Add-ons
    enhancements: ProductRef[]
    frequentlyBoughtTogether: ProductRef[]
    biomarkerPackages: ProductRef[]
    consultationAddonEnabled: boolean
    consultationAddonPrice: number
    giftWrappingEnabled: boolean
    giftWrappingPrice: number
    extendedDeliveryEnabled: boolean
    upsellBannerTextEn?: string
    upsellBannerTextAr?: string

    // SEO
    seoTitleEn: string
    seoTitleAr: string
    seoDescriptionEn: string
    seoDescriptionAr: string
    seoCanonicalUrl?: string
    ogImageUrl?: string
    slugEn: string
    slugAr: string

    // Feature Flags
    hideVariantsOnConsultationLink: boolean
    forceVariantDisplay: boolean
    variantVisibilityUrlOverrideEnabled: boolean
    subscriptionAutoSelectOverride: boolean | null
    showCompareAtPrice: boolean
    showStockIndicator: boolean
    showDeliveryEstimate: boolean
    consultationLinkSuppressesAddons: boolean

    // FAQ
    faq: FAQItem[]

    // Customer Reviews (Real Stories, Real Results)
    reviews: CustomerReview[]

    // Influencer / UGC Videos (Loved by our community)
    influencerVideos: InfluencerVideo[]

    // Why [Product] is Superior block
    superiorityBlock: SuperiorityBlock

    // Variants
    /** Axes this product varies by. Absent/empty = legacy single-axis mode. */
    variantOptions?: VariantOption[]
    variants: ProductVariant[]
}

// ─────────────────────────────────────────────────────────────
// Catalogue Spine (finalised model — "Valeo Catalogue & CMS Rebuild")
// TWO taxonomies:
//   • Department → Sub-department = "what it is"  (canonical home; ONE each per listing)
//   • Category   → Sub-category   = "where it appears" (web/app merchandising;
//                                    listing↔sub-category M:M with ONE ★ Primary)
// The Listing is the hub. Everything sits under a top-level Journey.
// Filters are a derived read-side projection — never modelled/entered by hand.
// ─────────────────────────────────────────────────────────────

// The Design Model's five departments — artifact 5f436313, authored in
// pdp/artifact/build_flows.py. `health_products` was `health_products` until
// the Design Model alignment pass; the Design Model's department is "Health
// Products" and every label in this app already said so.
export type Department =
    | "diagnostics"        // Diagnostics & Testing
    | "treatments"         // Treatments & Therapies
    | "consultations"      // Doctors & Health Coaches (Design Model: Consultations & Coaching)
    | "home_personal"      // Home & Personal Care
    | "health_products"    // Health Products

export type FulfilmentPath =
    | "blood"
    | "home_service"
    | "consultation"
    | "supplement"
    | "digital_instant"

export type MedicineForm = "oral" | "pen" | "injectable" | "iv" | "topical"
// Clinical class (product_config.medicine_type). NULL = ordinary supplement.
export type MedicineClass = "glp1" | "peptide" | "hair_loss" | "antibiotic" | "vitamin" | "general_rx"

// Per-listing, per-country config (catalog_country_config). No row = not available there.
/**
 * One row of `product_country_config` — the five flags the service actually stores,
 * and nothing else.
 *
 * `isVatExcluded` and `isCouponEligible` were REMOVED. Neither had a column:
 *   · VAT lives at sub-department x country (`sub_department_country_config.vat_percent`,
 *     D-C54) after D-C33 took it out of the catalog — it is not a per-product fact.
 *   · "Coupon eligible" sat beside `isCouponDiscountBlocked` with no stated relationship;
 *     if it was the inverse, storing both is the D-C1 failure class.
 * Both were editable and silently discarded on save, which is the one outcome worth
 * removing: a toggle that looks saved and is not.
 */
export interface CatalogCountryConfig {
    country: Country
    status: "active" | "inactive"
    isCodEligible: boolean
    /** Blocks coupon discounts entirely for this market. */
    isCouponDiscountBlocked?: boolean
    /** Excludes this product from coupon minimum-spend thresholds. */
    isCouponThresholdExcluded?: boolean
    /** Moved here from the Subscription tab — one screen owns the whole row. */
    isSubscriptionEnabled: boolean
    /** Pre-selects the subscription option. Only valid while `isSubscriptionEnabled`. */
    isSubscriptionAutoSelected?: boolean
    /** Commitment floor for THIS market (D-C67). 1 = cancel any time — the backend default. */
    subscriptionMinCycles?: number
}

// Which surface a category / listing renders on. One entry serves both.
export type VisibleOn = "app" | "web" | "both"

// Attribute keys a sub-department exposes on its listings (controls which
// attribute switches are visible in the listing editor).
export type AttributeKey =
    | "isMedicine" | "medicineForm" | "isRxRequired" | "isControlledSubstance"
    | "isDevice" | "fasting"

// ── Zoho Books entities ───────────────────────────────────────
// Valeo runs 7 Zoho Books entities; 6 matter for invoicing. Routing is
// country × product type × clinical class:
//   UAE      → DMCC / KUA (default) · Shifa for GLP-1 / weight-loss only
//   KSA      → Value Health IT (service packages) · Saha (supplements, trading)
//   KUWAIT   → Integrative (everything)
//   QATAR    → no invoices are created at all
// (A holding company book and an India cost-centre book exist but have no
// integrations — documented on /development, not modelled here.)
export type ZohoBook = "dmcc" | "shifa" | "ksa_vhit" | "saha" | "integrative" | "none"

// Per-country config for a sub-department (VAT, payments and Zoho routing).
// VAT is set per country only (UAE is 5% across all Emirates, KSA 15%).
// `overrides` re-routes a single clinical class — e.g. UAE GLP-1 → Shifa, zero-rated.
export interface SubDepartmentCountryConfig {
    country: Country
    vat?: number
    zohoOrgId?: string
    paymentMethods?: string[]
    /** Which Zoho Books entity invoices this country × sub-department. */
    zohoBook?: ZohoBook
    /** false = no invoices are created for this country (Qatar). Defaults to true. */
    invoicingEnabled?: boolean
    /** VAT currently sent exclusive of price. Defaults to "exclusive". */
    vatMode?: "exclusive" | "inclusive"
    /** Zoho chart-of-accounts id (erp_mappings.erp_account_id). */
    zohoAccountId?: string
    /** Clinical-class exceptions to the country default. */
    overrides?: { medicineClass: MedicineClass; zohoBook?: ZohoBook; vat?: number; note?: string }[]
}

// "What it is" — canonical classification. A listing has exactly one sub-department.
export interface SubDepartment extends Entity {
    department: Department
    nameEn: string
    nameAr: string
    slug: string
    sortOrder: number
    isActive: boolean
    // Attributes are controlled at the sub-department level; only these show on a listing.
    attributeKeys?: AttributeKey[]
    // VAT %, the Zoho ORGANISATION id and the Zoho Books entity are set per
    // country at the sub-department level (not per variant). One entry per
    // country; all fields optional. See SubDepartmentCountryConfig.
    countryConfig?: SubDepartmentCountryConfig[]
}

// Landing-page content a Category / Sub-category renders on web & app (from Figma).
// All optional so existing rows stay valid; authored in the create/edit dialog.
export interface CategoryStat {
    value: string        // e.g. "60 min", "AED 400", "13K+"
    labelEn: string      // e.g. "Duration", "From", "Booked"
    labelAr?: string
}
export interface CategoryContent {
    // Hero
    heroTitleEn?: string
    heroTitleAr?: string
    heroSubtitleEn?: string
    heroSubtitleAr?: string
    heroImageUrl?: string
    heroStats?: CategoryStat[]
    // Promo strip
    promoTextEn?: string
    promoTextAr?: string
    promoCode?: string
    // Body / intro
    descriptionEn?: string
    descriptionAr?: string
    // Education / info block (title + rich body + media, e.g. "How NAD+ works")
    infoTitleEn?: string
    infoTitleAr?: string
    infoBodyEn?: string
    infoBodyAr?: string
    infoMediaUrl?: string
    // Lead capture ("Get in touch")
    showLeadForm?: boolean
    // FAQ
    faq?: FAQItem[]
    // Trust badges shown on the page (e.g. iso, gdpr, secure_payment)
    trustBadges?: string[]
    // SEO
    seoTitleEn?: string
    seoTitleAr?: string
    seoDescriptionEn?: string
    seoDescriptionAr?: string
    seoCanonicalUrl?: string
    ogImageUrl?: string
    // Alt text (EN/AR) for image slots — SEO/AEO + accessibility.
    heroImageAltEn?: string
    heroImageAltAr?: string
    infoMediaAltEn?: string
    infoMediaAltAr?: string
    ogImageAltEn?: string
    ogImageAltAr?: string
}

// "Where it appears" — web/app merchandising taxonomy (shared across surfaces).
// Extends CategoryContent so each renders a full landing page.
export interface Category extends Entity, CategoryContent {
    nameEn: string
    nameAr: string
    slug: string
    visibleOn: VisibleOn
    sortOrder: number
    isActive: boolean
    // Authored from the Category side: the sub-categories mapped into this category.
    subCategoryIds?: string[]
    partnerAccess?: PartnerAccessEntry[]   // B2B partner access at category level
    partnerExclusive?: boolean             // hidden from Valeo master search — partner-only
    promoBannerId?: string                 // attached reusable promo banner
}

export interface SubCategory extends Entity, CategoryContent {
    categoryId?: string          // parent category (derivable from Category.subCategoryIds)
    nameEn: string
    nameAr: string
    slug: string
    visibleOn: VisibleOn
    sortOrder: number
    isActive: boolean
    // Authored from the Sub-category side: the listings mapped into this sub-category.
    listingIds?: string[]
    partnerAccess?: PartnerAccessEntry[]   // B2B partner access at sub-category level
    partnerExclusive?: boolean             // hidden from Valeo master search — partner-only
    promoBannerId?: string                 // attached reusable promo banner
}

// Attributes / Features (was "Internal Category") — describe the listing and pick the
// Service-Provider pool (M:1). Ops-facing (fasting/non-fasting, at-home/clinic…).
export interface InternalCategory extends Entity {
    nameEn: string
    nameAr: string
    fulfilmentPath: FulfilmentPath
    serviceProviderIds: string[]
    isActive?: boolean
}

// Owner / Category Manager — owns the listing; credited at sale (source attribution).
export interface CategoryManager extends Entity {
    name: string
    email: string
    department: Department
}

// Who provides / fulfils (M:1 to a feature / Internal Category).
export interface ServiceProvider extends Entity {
    name: string
    type: "lab" | "homecare" | "clinic" | "pharmacy" | "logistics"
    internalCategoryId: string
    isActive: boolean
}

// ── B2B Partners (catalog_partner_access / partners) ──
// Named CataloguePartner to avoid clashing with the Growth-pillar `Partner` (referrals).
export type PartnerType = "b2b_client" | "corporate" | "external"
export type PartnerAccessType = "owner" | "viewer"
export interface CataloguePartner extends Entity {
    code: string
    name: string
    email?: string
    contactPerson?: string
    partnerType: PartnerType
    countries?: Country[]     // markets the partner operates in (empty/undefined = all); may be a single country
    isActive: boolean
}
// Partner-specific price override — at variant / city / country granularity.
export interface PartnerPrice {
    variantId?: string        // undefined = whole listing
    country?: Country
    cityId?: string
    price: number
    discountType?: "percentage" | "fixed"
    discountValue?: number
}
// Assigned on catalog entities (listing/category/sub-category/journey) — who can access, and how.
// On listings it also carries partner-specific pricing + image override + exclusivity.
export interface PartnerAccessEntry {
    partnerId: string
    accessType: PartnerAccessType
    exclusive?: boolean            // this partner is the exclusive audience (see Listing.partnerExclusive)
    imageOverrideUrl?: string      // partner-specific image
    imageOverrideAltEn?: string
    imageOverrideAltAr?: string
    pricing?: PartnerPrice[]       // partner-specific pricing (variant/city/country)
}

// Cities (for per-city partner/listing pricing).
/**
 * EXTERNAL — mirrors `labslot_city`, which the catalog references softly
 * (`product_pricing.city_id`, `product_city_config.city_id`) and never owns. The rows
 * are transcribed from `pdp/packages/blood/table data/labslot_city_202608201508.csv`;
 * ids are `city-{labslot id}` so they trace back to the dump one-to-one.
 */
export interface City {
    id: string
    name: string
    nameAr?: string
    country: Country
    /** `labslot_city.is_active`. Qassim is the one inactive row of 34. */
    isActive?: boolean
}

// ── SEO localisation ──────────────────────────────────────────
// Valeo sells across countries AND cities, so search-facing content localises
// while product/clinical content only translates. One row here = one `seo_meta`
// row, keyed (entity_id, country_id, language_code); city rows are
// entity_type='CITY_PAGE'. Blank field = inherit (city → country → master).
export type SeoLang = "en" | "ar"

export interface SeoLocaleEntry {
    id: string
    country: Country
    /** undefined = country-level row; set = city-level override */
    cityId?: string
    language: SeoLang
    slug?: string
    metaTitle?: string
    metaDescription?: string
    h1?: string
    canonicalUrl?: string
    /** city-level local copy, e.g. "Same-day delivery in Dubai" */
    deliveryPromise?: string
}

/** Language-agnostic, per-country crawl + social settings. */
export interface SeoCountrySettings {
    country: Country
    /** MUST be false where the listing is not sold — stops indexing a dead page. */
    isIndexable?: boolean
    isFollowable?: boolean
    sitemapInclude?: boolean
    ogImageUrl?: string
    ogImageAltEn?: string
    ogImageAltAr?: string
}

// ── Promo Banner ──────────────────────────────────────────────
// A standalone, reusable promotional banner with an attached coupon code.
// Built once in the catalogue and selected on listings / categories /
// sub-categories via `promoBannerId`.
export interface PromoBanner {
    id: string
    name: string
    titleEn: string
    titleAr?: string
    subtitleEn?: string
    subtitleAr?: string
    imageUrl?: string
    imageAltEn?: string
    imageAltAr?: string
    couponCode?: string
    discountType?: "percentage" | "fixed"
    discountValue?: number
    ctaLabelEn?: string
    ctaLabelAr?: string
    ctaHref?: string
    isActive: boolean
}

// ── Compliance / audit log ────────────────────────────────────
// Records who changed what, when — with a before→after diff per entry.
// Generalises across catalogue entities (listing first).
export type AuditAction = "create" | "update" | "status_change" | "delete"
export type AuditEntityType = "listing" | "category" | "journey" | "protocol" | "partner" | "subDepartment" | "internalCategory" | "tag" | "flashSale" | "article" | "practitioner" | "composition" | "promoBanner" | "retentionTemplate" | "biomarker" | "biomarkerPanel"
export interface AuditActor { id: string; name: string; email?: string; role?: string }
/**
 * old/new are pre-formatted human strings; "—" means empty/absent — renderers rely
 * on that exact sentinel to tell an addition from a removal from a change.
 *
 * `path` carries the same information as `label` but pre-split, so a renderer can
 * group "Variants › 60 Capsules › Regional data › UAE › Price" under its parent
 * instead of repeating the parent on every row. Last element is the leaf. Absent on
 * flat, top-level changes.
 */
export interface AuditChange {
    field: string
    label: string
    oldValue: string
    newValue: string
    path?: string[]
}
export interface AuditLogEntry {
    id: string
    entityType: AuditEntityType
    entityId: string
    entityName: string      // snapshot of the display name at save time
    action: AuditAction
    actor: AuditActor        // snapshot
    timestamp: string        // ISO 8601
    changes: AuditChange[]
}
export interface AuditFilter {
    entityType?: AuditEntityType
    entityId?: string
    actorId?: string
    action?: AuditAction
    since?: string
    until?: string
    limit?: number
}

// ── Protocol — a clinically-distinct care sequence ──────────────────────────
//
// THERE IS NO TIME IN A PROTOCOL. Not a week, not a day, not a cadence.
//
// A patient starts when they buy, and every step takes as long as it takes:
// a lab is slow, a courier is late, somebody goes on holiday. So a step that
// says "Week 6" is wrong for almost every patient who ever reads it, and a
// builder that asks for one is asking the author to invent a fact.
//
// THE ORDER IS THE DEPENDENCY. Step N unlocks when step N−1 is done. That is
// the whole rule and it needs no field.
//
// WHAT THE ORDER CANNOT DO is prove itself. So each step states two facts, and
// neither is a time: what it PRODUCES, and what it REQUIRES. Both draw on one
// vocabulary, so the chain is readable and a wrong order is catchable —
// "step 3 needs a prescription, and the only step that produces one is step 7".
//
// Where a duration genuinely matters it already lives on the catalogue item:
// `DiagnosticsConfig.reportDaysMin` / `reportDaysMax` is the lab's turnaround.
// A step never has to repeat it.

export type ProtocolStatus = "draft" | "active" | "archived"
export type ProtocolStepType = "consultation" | "lab_test" | "medication" | "lifestyle" | "follow_up"

/**
 * WHO does a step. Not derivable from the type: a concierge call and a
 * physician reassessment are both `follow_up` and are done by different
 * people, and the coach console needs to know whose turn it is.
 */
export type ProtocolActor =
    | "patient"    // the person does it themselves
    | "nurse"      // a home visit
    | "doctor"     // a clinician
    | "lab"        // the laboratory
    | "coach"      // a health coach or concierge
    | "ops"        // pharmacy, logistics, scheduling
    | "system"     // automatic, nobody touches it

/**
 * WHAT a step leaves behind, and WHAT a step needs. One closed vocabulary,
 * produced by some steps and required by others, so the two can be matched.
 *
 * It replaces `ProtocolGating`, which said the same things ("lab_result",
 * "consultation_approval", "prescription") as a flag nothing could verify.
 */
export type ProtocolOutput =
    | "booking"       // a visit is on the calendar
    | "sample"        // a specimen has been collected
    | "report"        // results exist and can be read
    | "assessment"    // a clinician has read something and decided
    | "prescription"  // an Rx exists
    | "delivery"      // goods have reached the patient

/**
 * ONE PROTOCOL, ONE AXIS, MANY PATHS.
 *
 * A full body panel differs for a man and a woman, and the SEQUENCE does not.
 * So the sequence is authored once and one axis splits it into paths. A step
 * may link a different priced unit per value, or apply to only some values.
 *
 * The axis names an attribute the system already holds, so a patient's path is
 * known rather than chosen by hand: the onboarding chat already sends `sex` as
 * a routing signal. The attribute list is closed, and adding to it is a code
 * change — a free-text axis could not be matched to any patient.
 *
 * At most one axis, deliberately. Two axes multiply: sex by age band is four
 * paths, four packages and four prices per market, and nobody has asked for it.
 */
export type ProtocolVariantAttribute = "sex"

export interface ProtocolVariantAxis {
    attribute: ProtocolVariantAttribute
    /** The values this protocol splits on. A subset of the attribute's own. */
    values: string[]
}

// ── How a step advances ─────────────────────────────────────────────────────
//
// THE ORDER IS THE DEPENDENCY, and `chainFindings` catches a wrong order. What
// the order cannot say is HOW THE SYSTEM LEARNS THAT A STEP IS FINISHED.
// `requires` is a precondition. Without a completion rule every protocol
// stalls at step one, and nothing on any screen says so.
//
// SO EACH STEP NAMES THE SIGNAL THAT FINISHES IT. And a signal is only real if
// something writes it, which is why every vocabulary here is mirrored from the
// live admin panel with a note saying whether anything can set it.
//
// ── FOUR STATE MACHINES, NOT ONE ──
//
// The live system carries four, and they are separate fields with separate
// vocabularies. The reporter is NOT a useful axis — the same 16-value list is
// written by four different code paths in two different formats — so the axis
// is the FIELD, because a field has exactly one vocabulary.
//
// ── AND NO ORDERING ──
//
// The CMS must not invent a transition graph. Neither repo holds one: the
// console reads the allowed set off the API per child order and renders it. So
// `completesOn` is ANY-OF and unordered, the same discipline as "there is no
// time in a protocol" — there is no transition graph in a protocol either.

export type StatusField =
    | "child_order_status"   // the 16 on a child order. The workhorse.
    | "booking_status"       // the home-visit ladder. 8 positions, forward only.
    | "prescription_status"  // PENDING | APPROVED | REJECTED, on a medicine order
    | "app_event"            // the patient did something. NOTHING WRITES THIS YET.

/**
 * ONE CHILD ORDER this protocol expects.
 *
 * AUTHORED, BECAUSE IT CANNOT BE DERIVED. A step's `linkedUnit` looks like it
 * names the order and does not: in the seeded 14-step protocol, steps 1 and 14
 * share one unit, steps 7/11/13 share one, steps 8/9/12 share one, and steps 2
 * and 3 link nothing while being the two most order-driven steps in it.
 * Fourteen steps, eleven orders, six units — no two of those numbers are equal.
 *
 * Deriving would also collide with the package: `stepUnits()` DEPENDS on three
 * dispatch steps collapsing to one unit, because that is how the package gets
 * three pens. One derivation cannot serve both.
 */
export interface ProtocolFulfilment {
    id: string
    /** What staff call it. "Baseline panel", "Month 1 pen". */
    label: string
    /** The priced unit it is an order for. Its listing gives the fulfilment path. */
    unit?: PricedUnitRef
}

/** What finishes a step. Absent = nothing does, and every patient stops here. */
export interface StepAdvance {
    /** → `ProtocolFulfilment.id`. Absent on an `app_event`. */
    fulfilmentId?: string
    field: StatusField
    /**
     * ANY ONE of these finishes the step. Not a sequence: the CMS holds no
     * transition graph, and two "results uploaded" statuses are alternatives
     * rather than an order.
     */
    completesOn: string[]
    /**
     * Any one of these RE-OPENS a step that already looked finished.
     *
     * NOT OPTIONAL IN PRACTICE. A recollection or a nurse change is a normal
     * event, and without this the patient waits for ever behind a step the
     * system thinks is done — which is the bug this whole field exists to fix.
     */
    retriesOn?: string[]
    /** Ops may force it through without the signal. */
    manualOverride?: boolean
}

export interface ProtocolStep {
    id: string
    /** The position, and therefore the dependency. Contiguous, 0..n-1. */
    order: number
    titleEn: string
    titleAr?: string
    type: ProtocolStepType
    actor: ProtocolActor
    /** What exists once it is done. Absent = it leaves no artefact behind. */
    produces?: ProtocolOutput
    /** What must already exist. Absent = nothing does. */
    requires?: ProtocolOutput
    /** Medication only: the dose AND how often, in one sentence. */
    dosing?: string
    /** Anything a clinician or a coach needs told. Never a date. */
    note?: string
    /**
     * The priced unit this step delivers.
     *
     * A UNIT, not a listing. A listing is a folder with no price — money lives
     * on a variant, a service option or a plan — so a step that named a
     * listing left the package builder guessing which one, and Standard
     * against Fast Track is a clinical decision made here.
     */
    linkedUnit?: PricedUnitRef
    /** Variant only: a different unit per axis value. Overrides `linkedUnit`. */
    unitByValue?: Record<string, PricedUnitRef>
    /** Variant only: the axis values this step applies to. Absent = all. */
    appliesTo?: string[]
    /**
     * What tells the system this step is finished.
     *
     * Absent = nothing does. The protocol stops here for every patient, for
     * good, and `runtimeGaps` refuses to publish it.
     */
    advance?: StepAdvance
    /** What the patient reads while this step is still pending. Never a date. */
    waitingEn?: string
    waitingAr?: string
}

// ── Health tasks — the small repeated acts, not steps ───────────────────────
//
// A STEP MOVES THE PATIENT FORWARD. A TASK ONLY RECORDS SOMETHING.
//
// That is the whole line between the two builders. "Book the nurse visit" is a
// step: it has an actor, a place in the chain, and it drives the big card at
// the top of the patient's screen. "Take your medication" is a task: the
// patient takes the pen whether or not they tick the box.
//
// SO A TASK NEVER UNLOCKS A STEP, and that is enforced by the shape rather
// than by this comment. `ProtocolTask` has no `produces` field, and `chainFindings`
// only ever reads `ProtocolStep.produces`, so a task cannot be named as
// something a step requires. A patient who forgets to tick a box must never be
// blocked from care.
//
// ONE TYPE, PER PROTOCOL. A task carries its own words, its own way of being
// finished, and the two gates that decide when it is on the patient's card.
// It lives on the protocol because a protocol's daily asks are part of its
// clinical shape, not a catalogue everybody draws from.

/**
 * How a patient finishes a task. Four, and each one is earned by a real row:
 * a tick for a walk, a number for a weight, an entry for a meal log because a
 * meal log is a list, and a scale for pain because pain is 0 to 10.
 */
export type TaskCapture = "tick" | "number" | "entry" | "scale"

/**
 * How often the tick clears. It is NOT a schedule and it does not break the
 * "no time in a protocol" rule: it predicts nothing about when a step happens,
 * it only says when a completed task is asked for again.
 */
export type TaskReset = "daily" | "weekly" | "never"

/** Closed, because the app draws from a fixed icon set. */
export type TaskIcon = "pill" | "meal" | "scale" | "walk" | "drop" | "note" | "heart"

/**
 * One end of a task's life, in the vocabulary the STEPS already use.
 *
 * A protocol holds no time, so this cannot say "after day 30". It names an
 * output some step produces, and optionally the kind of step that must produce
 * it — because a supplement voucher and a medicine dispatch are both a
 * `delivery`, and only one of them means "start taking it".
 */
export interface ProtocolTaskGate {
    needs: ProtocolOutput
    /** Absent = any step will do. */
    fromType?: ProtocolStepType
}

/**
 * ONE TASK, ON ONE PROTOCOL. It carries its own words and its own two gates.
 *
 * It is authored HERE and not in a shared library, because a protocol's daily
 * tasks are part of that protocol's clinical shape: the GLP-1 programme asks
 * for a weight every day and the recovery programme asks for a pain score, and
 * neither is a fact about the other.
 *
 * THE ONE COST, said out loud: `key` is the name the app stores every reading
 * against, and it is now typed per protocol. Two protocols can call one
 * reading by two names, and the board says so where it can see it happening.
 */
export interface ProtocolTask {
    id: string
    /** The app's id for the log series. Lower case with underscores. */
    key: string
    sortOrder: number

    // ── What the patient reads and does ──
    titleEn: string
    titleAr?: string
    /** The line under the title. "Track your nutrition today". */
    subtitleEn?: string
    subtitleAr?: string
    icon: TaskIcon
    capture: TaskCapture
    /** Number only. "kg". */
    unit?: string
    /** Bounds for a number or a scale. */
    min?: number
    max?: number
    /**
     * The series this writes into, in the chat builder's own convention.
     * `record_weight` writes `weight_kg`, which the onboarding chat already
     * asks for under the same name, so the answer at signup and every daily
     * reading land in one series.
     */
    signalKey?: string
    resets: TaskReset
    /** Whether a coach may put this on one patient. The product team's control. */
    coachMayRecommend: boolean
    isActive: boolean

    // ── When it is on the patient's card ──
    /** Absent = it shows from the day they buy. */
    showsAfter?: ProtocolTaskGate
    /** Absent = it stays. `"protocol_ends"` = it goes when the last step is done. */
    hidesAfter?: ProtocolTaskGate | "protocol_ends"
    /** The variant paths this task runs on, as on a step. Absent = all. */
    appliesTo?: string[]
}

// ── Metrics — the three tiles above the task list ──────────────────────────
//
// THE VALUE IS NEVER AUTHORED. "78 kg" is a reading, "25%" is counted off the
// steps, and neither is a thing a person types into a catalogue. What IS
// authored is WHICH tiles a protocol shows, in what order, and what they are
// called.
//
// SO THE SOURCE IS A CLOSED LIST. Each one names a place the app already knows
// how to read. A free-text metric would be a tile with nothing behind it, and
// nobody could tell that by looking at the catalogue.
//
// A metric and a task can depend on each other, which is why they are managed
// on one screen: the weight tile reads the series the `record_weight` task
// writes, so a protocol with the tile and no task has a tile with no data.
// That is checkable, and it is checked.

export type MetricSource =
    | "weight"              // the latest reading, and when it started
    | "weight_change"       // the move since the first reading
    | "protocol_progress"   // steps done, as a percentage
    | "latest_reports"      // a link, and how long ago
    | "next_visit"          // what is booked, and when
    | "medication_taken"    // how many doses are ticked
    | "days_logged"         // how many days carry any log at all
    | "task_streak"         // consecutive days with every task done

export interface ProtocolMetric {
    id: string
    source: MetricSource
    sortOrder: number
    /** Overrides the source's own name. "Protocols progress" rather than "Progress". */
    labelEn?: string
    labelAr?: string
    isActive: boolean
}

export interface Protocol extends Entity {
    code: string
    nameEn: string
    nameAr: string
    descriptionEn?: string
    descriptionAr?: string
    clinicianAuthor: string     // authoring clinician (clinical authorship)
    targetCondition?: string
    journeyId?: string          // optional parent journey/program
    status: ProtocolStatus
    isActive: boolean
    /** At most one. Absent = one path, for everybody. */
    variantAxis?: ProtocolVariantAxis
    /**
     * The child orders this protocol expects, one per order — so three months
     * of dispatch are three entries. A step's `advance` names one of them.
     *
     * HALTING IS NOT AUTHORED. Any watched order reaching `CANCELLED` halts the
     * protocol. One fixed rule beats a cancel field on all fourteen steps.
     */
    fulfilments?: ProtocolFulfilment[]
    steps: ProtocolStep[]
    /** Draft is authored but not live. Publish is a separate, deliberate act. */
    publishedAt?: string
    /** The patient-facing page for this protocol. Built after the steps. */
    plan?: ProtocolPlan
}

// ── The plan: the patient-facing page of a protocol ─────────────────────────
//
// TWO STAGES, ONE PROTOCOL.
//
//   STEP BUILDER  the clinical sequence. Internal. It decides what is
//                 delivered, in what order, and what gates each step.
//   PLAN BUILDER  the page a patient reads before buying. It describes what
//                 the steps deliver, so the steps come first.
//
// The page is a web page like any other Valeo landing page, so it carries the
// same three things: an ADDRESS (a slug, a folder, crawl settings), WORDS (the
// public name and the search copy), and COMPONENTS (ranked, typed widgets).
// Pricing is the fourth and it is not built yet.
//
// It has its OWN status. A protocol can be live for a coach while its page is
// still a draft, so one status could not serve both.

export type PlanStatus = "draft" | "published"

/**
 * Where the page sits under the site root. It mirrors the "SEO Folder" field
 * of the existing landing-page screen, so the resulting path is the same.
 */
export type PlanSeoFolder = "none" | "programs" | "protocols" | "treatments"

/** Mirrors "SEO Handling" on the existing screen. Country is the normal case. */
export type PlanSeoHandling = "country" | "city" | "global"

/**
 * ONE PAGE, TWO TABS AND A WIDGET LIST.
 *
 * The field names and the grouping come from the landing-page screen Valeo
 * already runs, because that is the screen this team knows:
 *
 *   TEMPLATE   what the page is called, and whether it is on.
 *   SEO        the address, and what a search result shows.
 *   WIDGETS    the ranked, typed sections the page is made of.
 *
 * NOTE ON THE PAGE NAME: it is the name in the pages list, and it is not the
 * heading a patient reads. The heading is the hero widget's own header text,
 * exactly as it works today.
 *
 * OPEN POINT: the live screen keeps ONE PAGE PER COUNTRY, chosen by the
 * country selector above the list. A protocol carries no country yet, so this
 * is one page for every market and `seoHandling` only records the intent.
 */
// ── The weekly journey — what a patient reads once they are on the protocol ──
//
// A SECOND PAGE, WITH A DIFFERENT JOB. The plan page sells the protocol before
// anybody buys. The journey page is what they open from Today, week after week,
// to be told what their body is doing and what to concentrate on. So it carries
// a different widget set, and it is authored in three versions.
//
// THREE PHASES, WHATEVER THE LENGTH. A twelve-week programme reads Week 1-4,
// 5-8, 9-12. A nine-week one reads 1-3, 4-6, 7-9. The author sets the length
// and the two break points, and the three ranges are DERIVED — which is the
// only way to guarantee that no week falls into two phases or into none.
//
// ── AND WHY WEEKS ARE ALLOWED HERE ──
//
// A STEP still has no week, and it never will: a lab is slow, a courier is
// late, so a step that names a week is wrong for almost everybody. What IS
// known exactly is how long ago the patient bought. This page is keyed to that
// and to nothing else. It never says a step happens in a week — it says what
// weeks one to four of the medicine feel like, which is true of everybody on
// it.
//
// That is why the length lives HERE, on the plan, beside the copy it belongs
// to, and not on `Protocol`. The protocol is the clinical sequence and it
// stays timeless.

/** The five sections a weekly journey page is made of. A closed set. */
export type JourneyBlockType =
    | "PHASE_HERO"       // the green card: heading, body, illustration
    | "YOU_MAY_NOTICE"   // a grid of what to expect, each with an icon
    | "FOCUS_THIS_WEEK"  // a ticked list of what to concentrate on
    | "COMING_NEXT"      // a numbered look ahead
    | "CARE_TEAM"        // the message-us card at the foot

/**
 * The icons the app draws beside a "you may notice" item. Closed, because the
 * app holds the drawings — a typed name would render as an empty box.
 */
export type JourneyItemIcon =
    | "appetite" | "fatigue" | "scale" | "digestion"
    | "energy" | "wellbeing" | "sleep" | "mood"

/** One line of a journey list. Which fields are read depends on the block. */
export interface JourneyItem {
    id: string
    rank: number
    titleEn?: string
    titleAr?: string
    textEn?: string
    textAr?: string
    /** YOU_MAY_NOTICE only. */
    icon?: JourneyItemIcon
}

/** Loose per-type config. Only the fields a block's own type reads are used. */
export interface JourneyBlockConfig {
    headingEn?: string
    headingAr?: string
    /** The line under the heading. */
    blurbEn?: string
    blurbAr?: string
    items?: JourneyItem[]
    /** CARE_TEAM only. */
    ctaLabelEn?: string
    ctaLabelAr?: string
    /** PHASE_HERO only. The illustration beside the words. */
    imageUrl?: string
}

export interface JourneyBlock {
    id: string
    type: JourneyBlockType
    internalName?: string
    rank: number
    isActive: boolean
    config: JourneyBlockConfig
}

/**
 * ONE PHASE. It holds only the copy: the week range is derived from the plan's
 * length and its two break points, so a phase cannot disagree with its
 * neighbours about where it starts.
 *
 * It carries its OWN status, so phase three can still be a draft while a
 * patient in week two reads phase one.
 */
export interface JourneyPhase {
    /** 1, 2 or 3. There are always exactly three. */
    phase: 1 | 2 | 3
    /** The name in the pages list. It is not the heading a patient reads. */
    pageName?: string
    status: PlanStatus
    publishedAt?: string
    blocks: JourneyBlock[]
}

export interface ProtocolPlan {
    status: PlanStatus
    publishedAt?: string

    // ── Template ──
    pageName?: string
    watermarkUrl?: string

    // ── SEO ──
    /** "Seo Url" on the live screen. */
    slug?: string
    seoFolder?: PlanSeoFolder
    seoHandling?: PlanSeoHandling
    breadcrumb?: string
    seoTitleEn?: string
    seoTitleAr?: string
    seoDescriptionEn?: string
    seoDescriptionAr?: string
    altImageTagEn?: string
    altImageTagAr?: string
    keywordsEn?: string
    keywordsAr?: string
    isIndexable?: boolean
    isFollowable?: boolean
    seoCanonicalUrl?: string

    // ── Widgets ──
    blocks: PageBlock[]

    // ── The weekly journey ──
    //
    // What a patient opens from Today, in three phases. The LENGTH and the two
    // BREAK POINTS live here and the three week ranges are derived from them,
    // so no week can fall into two phases or into none.
    /** How many weeks the programme is sold as. 12 unless somebody says otherwise. */
    journeyWeeks?: number
    /** The last week of phase one, then of phase two. Phase three runs to the end. */
    phaseBreaks?: [number, number]
    /** Exactly three, in order. Blank until somebody writes them. */
    phases?: JourneyPhase[]

    // ── The packages ──
    //
    // What a patient BUYS, where the page is what they READ. Each one is a
    // `Composition` — this repo's own bundling primitive — of kind "program",
    // so the members, the quantities, the four discount rules and the
    // per-country / per-city scope rows are the catalogue's model and not a
    // second one invented here. `resolveComposition()` prices them.
    //
    // ONE PER PATH, keyed by the protocol's variant value ("male", "female"),
    // or by "all" where the protocol has no axis. A male path and a female
    // path hold different items, so one line-item list could not describe
    // both — and pretending otherwise is how a package bills for something it
    // never delivers.
    packages?: Record<string, Composition>

    /**
     * The one line of regulated copy on the package.
     * "Prepared by a fully licensed UAE compounding pharmacy regulated by MOH
     * and EDE." It never names a doctor or the pharmacy.
     */
    providerLine?: string
}

// ── Chat — a scripted conversation that ends in a decision ──────────────────
//
// One primitive, two kinds. It is NOT part of a protocol. A chat opens on a
// surface, asks questions, and hands the person to one destination. Protocols
// are only the first destination we support, so the same builder can later put
// a chat on a PDP or a landing page.
//
//   ONBOARDING CHAT  runs before a goal is known. Its job is to collect the
//                    answers the recommendation engine needs to pick the goal.
//   GOAL CHAT        runs after the goal is known. Its job is to hand the
//                    person to a protocol.
//
// Both kinds have a slug. A goal chat opens on its own from a campaign page,
// from a product page, or from a link a coach sends.
export type ChatKind = "onboarding" | "goal"
export type ChatStatus = "draft" | "published"

/** Where a chat can open. A chat is global, so this is a list, not one value. */
export type ChatSurface = "website" | "app" | "pdp" | "landing_page"

export type ChatQuestionKind = "single_choice" | "multi_choice" | "text" | "number"

/**
 * How much a question tells the recommendation engine.
 *
 *   off      The answer is collected. It plays no part in the decision.
 *   signal   The answer is a factor. On its own it names no goal. Age works
 *            this way: 24 does not pick a goal, but 24 with a weight and a
 *            medicine does.
 *   mapped   The author names the goal behind every answer. It is a direct
 *            hint, and the engine reads it as one input among the signals.
 *
 * Any number of questions can feed the engine. The engine decides, and the
 * builder never decides. That is why a mapped answer is a hint and not a rule.
 */
export type ChatRoutingMode = "off" | "signal" | "mapped"

export interface ChatOption {
    id: string
    labelEn: string
    /** Set on a "mapped" question. The goal this answer points at. */
    goalId?: string
}

export interface ChatQuestion {
    id: string
    order: number
    promptEn: string
    kind: ChatQuestionKind
    required: boolean
    helpEn?: string
    options: ChatOption[]
    /** How this question feeds the engine. Absent means "off". */
    routing?: ChatRoutingMode
    /**
     * A stable name the engine reads, such as "age" or "current_medicine".
     * It travels with the answer, so the engine never parses question text.
     * Set it on every question that feeds the engine.
     */
    signalKey?: string
}

/**
 * What a goal chat hands the person to. Only "protocol" is built today. The
 * other two are declared so the extension is visible in the type rather than
 * discovered later.
 */
export type ChatTargetKind = "protocol" | "landing_page" | "listing"

export interface ChatTarget {
    kind: ChatTargetKind
    id?: string
}

export interface Chat extends Entity {
    kind: ChatKind
    nameEn: string
    /** The path that opens this chat. Both kinds have one. */
    slug?: string
    surfaces: ChatSurface[]
    questions: ChatQuestion[]
    status: ChatStatus
    publishedAt?: string
    /** Goal chat only. The goal this chat belongs to. */
    goalId?: string
    /** Goal chat only. Where it hands the person next. */
    target?: ChatTarget
}

// ── What the chat posts when it ends ─────────────────────────
//
// THE CONTRACT. The consumer app collects answers and posts this object. The
// recommendation engine reads it and picks the goal. The builder never picks
// the goal, because a goal often follows from several answers together and
// from no single answer alone.

/** One answer, with the metadata the engine needs to weigh it. */
export interface ChatAnswerPayload {
    questionId: string
    /** The engine's name for this factor. Absent on a question that is "off". */
    signalKey?: string
    promptEn: string
    kind: ChatQuestionKind
    /** Option ids the person picked. Empty for a text or a number answer. */
    optionIds: string[]
    /** The same answer in words, so a person can read the log. */
    values: string[]
    routing: ChatRoutingMode
    /**
     * Only on a "mapped" question: the goal behind each answer the person
     * picked. The engine reads it as a hint and it may set it aside.
     */
    goalHints?: string[]
}

/** The whole post. One chat, one person, one moment. */
export interface ChatSubmission {
    chatId: string
    chatKind: ChatKind
    chatSlug?: string
    /** Which surface the chat opened on, when the app knows it. */
    surface?: ChatSurface
    /** Set on a goal chat, where the goal is known before the chat opens. */
    goalId?: string
    answers: ChatAnswerPayload[]
    /** Every goal a mapped answer named, and how many answers named it. */
    goalHints: { goalId: string; hits: number }[]
    submittedAt: string
}

// ── Page Builder (block-based journey/landing pages) ──
// Flat array of typed blocks (mirrors the Admin-Panel widget model: type + rank +
// isActive + one typed config), driven by a config registry + live preview.
export type PageBlockType =
    | "HERO_SECTION" | "USP" | "TRUST_SECTION" | "STEPS_TO_FOLLOW"
    | "PRODUCT_LIST" | "FAQ" | "CONTACT_US" | "COMPARISON_WIDGET"
    | "IMAGE_TESTIMONIALS" | "BMI" | "FEATURE_LIST" | "CUSTOMER_PROFILE"

export interface PageBlockItem {
    id: string
    titleEn?: string
    titleAr?: string
    textEn?: string
    textAr?: string
    iconUrl?: string
    imageUrl?: string
    included?: boolean          // FEATURE_LIST check/cross (ignored by usp/steps/trust)
    rank: number
}
export interface PageBlockTestimonial {
    id: string
    nameEn?: string
    nameAr?: string
    quoteEn?: string
    quoteAr?: string
    rating?: number
    imageUrl?: string           // IMAGE_TESTIMONIALS person image
    imageAltEn?: string
    imageAltAr?: string
}
// COMPARISON_WIDGET — Valeo-vs-others table (reuses ComparisonRow rows).
export interface PageBlockComparison {
    valeoTitleEn?: string
    valeoTitleAr?: string
    otherTitleEn?: string
    otherTitleAr?: string
    rows: ComparisonRow[]
}
// Loose per-type config (optional fields; additive/prototype-friendly).
export interface PageBlockConfig {
    headingEn?: string
    headingAr?: string
    subheadingEn?: string
    subheadingAr?: string
    bodyEn?: string
    bodyAr?: string
    imageUrl?: string
    imageAltEn?: string
    imageAltAr?: string
    ctaLabelEn?: string
    ctaLabelAr?: string
    ctaHref?: string
    /** HERO_SECTION — what the CTA does. "CTA Type" on the live drawer. */
    ctaType?: "REDIRECTION" | "CHAT" | "SCROLL" | "NONE"
    /** The small line beside the CTA, e.g. "Peptide Consultation Fee". */
    ctaSideTextEn?: string
    ctaSideTextAr?: string
    /** A separate Arabic target, where the Arabic site uses another path. */
    ctaHrefAr?: string
    /** A separate Arabic master image, where the artwork carries Arabic text. */
    imageUrlAr?: string
    priceLabel?: string         // HERO_SECTION price (treated as EN)
    priceLabelAr?: string       // HERO_SECTION price (AR)
    backgroundColor?: string
    listingIds?: string[]       // PRODUCT_LIST — catalog references by ID
    items?: PageBlockItem[]     // USP / STEPS_TO_FOLLOW / TRUST_SECTION / FEATURE_LIST / CUSTOMER_PROFILE
    faq?: FAQItem[]             // FAQ
    testimonials?: PageBlockTestimonial[]  // IMAGE_TESTIMONIALS
    // TRUST_SECTION — stats strip
    stats?: StatItem[]
    statsTitleEn?: string
    statsTitleAr?: string
    // CONTACT_US — locale-neutral contact details + bilingual hours
    contactPhone?: string
    contactEmail?: string
    contactWhatsapp?: string
    contactHoursEn?: string
    contactHoursAr?: string
    // COMPARISON_WIDGET
    comparison?: PageBlockComparison
    // BMI
    bmiUnitSystem?: "metric" | "imperial" | "both"
    // BMI / reusable disclaimer
    disclaimerEn?: string
    disclaimerAr?: string
}
export interface PageBlock {
    id: string
    type: PageBlockType
    internalName?: string
    rank: number
    isActive: boolean
    config: PageBlockConfig
}

// ── Retention (per-journey, per-country; the 4 fixed slots from the legacy screen) ──
export type RetentionSlotKey = "free_coach" | "top_picks" | "support_beyond_medication" | "recommended_tests"
export interface RetentionSlot {
    key: RetentionSlotKey
    titleEn: string
    titleAr?: string
    listingIds: string[]   // mapped packages/listings for this slot
    note?: string
    isActive: boolean
}
export interface JourneyRetention {
    country: Country
    slots: RetentionSlot[]  // exactly the 4 fixed slots
}

// ── Retention (new model) — a central, reusable, ranked Section Manager ──
// A RetentionTemplate is built once in the catalogue and attached to journeys
// per-country. Replaces the legacy 4-fixed-slot per-journey retention.
export type RetentionSectionType =
    | "banner" | "package" | "messages" | "video" | "content"
    | "symptoms" | "onboarding" | "nextdose" | "simpletitle"

// Loose optional config bag — only the fields relevant to a section's type are used.
// A single scheduled care-team message (Weekly Doctor Messages section).
export interface RetentionMessage {
    id: string
    week: number                // 1–16, grouped into 4 months (weeks 1-4, 5-8, 9-12, 13-16)
    titleEn: string
    titleAr?: string
    bodyEn: string
    bodyAr?: string
    status: "draft" | "published"
}

export interface RetentionSectionConfig {
    bannerImageUrl?: string
    bannerAltEn?: string
    bannerAltAr?: string
    linkedListingId?: string    // package → single listing
    listingIds?: string[]       // content → multiple listings
    scheduleNoteEn?: string
    noteEn?: string
    sectionKey?: string         // simpletitle → the section-title config key
    messages?: RetentionMessage[]   // messages → the full weekly doctor-message schedule
}

export interface RetentionSection {
    id: string
    rank: number
    type: RetentionSectionType
    titleEn: string
    titleAr?: string
    descriptionEn?: string
    descriptionAr?: string
    enabled: boolean
    itemCount?: number
    config?: RetentionSectionConfig
}

export interface RetentionTemplate {
    id: string
    name: string
    descriptionEn?: string
    sections: RetentionSection[]
}

// Top-level context (Programs & Bundles; "Direct" = default). listing↔journey M:M.
export interface Journey extends Entity {
    nameEn: string
    nameAr: string
    slug: string
    kind: "program" | "direct"
    isActive: boolean
    listingIds: string[]
    // Block-based landing page for this journey (built in the Page Builder).
    pageBlocks?: PageBlock[]
    // Per-country retention config (4 fixed slots), mapped to this journey.
    retention?: JourneyRetention[]
    // Per-country attachment of a reusable RetentionTemplate (new model).
    retentionAttachments?: { country: Country; templateId?: string }[]
    partnerAccess?: PartnerAccessEntry[]   // B2B partner access at journey level
    partnerExclusive?: boolean             // hidden from Valeo master search — partner-only
}

// Attributes / Features — "what it's like".
export interface ListingAttributes {
    isMedicine: boolean            // Treatments flag (IV/vaccine administering a medicine)
    medicineForm?: MedicineForm    // Products→Medicine physical form / path selector
    medicineType?: MedicineClass   // clinical class: GLP-1, peptide, hair-loss, …
    isRxRequired: boolean          // prescription gate
    isControlledSubstance: boolean
    isDevice: boolean              // wearables / devices
    fasting?: boolean
}

// The Listing is the hub. A Product is the health_products instance of a Listing;
// other departments reuse the same spine + the shared editor scaffold.
export interface Listing extends Entity {
    // What it is (one each)
    department: Department
    subDepartmentId: string
    internalName: string
    /**
     * `product_master.uid` — `{departments.code}-{product_id}`, ids from 10001,
     * e.g. `IV-10001` (D-C53). GENERATED at first save, never typed: the schema
     * comment is "on write: REJECTED — read-only". It seeds every variant uid as
     * `{master.uid}-NN` (D-C37), which is what lands on an invoice line — so it
     * is DISPLAYED, not editable, and absent on a draft never yet saved.
     */
    internalCode?: string
    displayNameEn: string
    displayNameAr: string
    brand?: string
    // How delivered (M:1 — drives ops, finance, order states)
    fulfilmentPath: FulfilmentPath
    // Who owns / attribution
    categoryManagerId: string
    // Feature set → service-provider pool
    internalCategoryId?: string
    attributes: ListingAttributes
    // Where it appears (M:M merchandising; exactly one ★ Primary)
    subCategoryIds: string[]
    primarySubCategoryId?: string
    /**
     * Surfaces. TWO booleans, because that is what the schema has:
     * `product_master.is_visible_app` / `is_visible_web`, whose own comment records the
     * reason — "split from visible_on enum for clean surface filters".
     *
     * The enum could not express **hidden on both** (active, but reachable only by direct
     * link or API), which two `TINYINT NOT NULL DEFAULT 1` columns can.
     *
     * `visibleOn` below is DERIVED from these for the readers that still take an enum —
     * use `surfaceOf()`, never author it.
     */
    isVisibleApp?: boolean
    isVisibleWeb?: boolean
    /** @deprecated Derived from `isVisibleApp` / `isVisibleWeb`. Read via `surfaceOf()`. */
    visibleOn: VisibleOn
    // Context
    journeyIds: string[]
    partnerAccess?: PartnerAccessEntry[]   // B2B partner access at listing level
    countryConfig?: CatalogCountryConfig[] // per-country availability & flags (catalog_country_config)
    /**
     * `product_city_config` — per city, at PRODUCT grain. D-C48 (2026-08-17) removed its
     * `variant_id`: a VARIANT's city availability is the existence of a `product_pricing`
     * row for (variant, city) and nothing else (D-C29), so a variant-scoped status row
     * "said the same thing twice". This table answers the different question of whether
     * the PRODUCT is offered in a city at all.
     *
     * Services only. The schema note is explicit: "Supplements do not use this table
     * (country-grain only)" — a shipped product answers at country grain.
     */
    cityConfig?: ProductCityConfig[]
    status: ProductStatus
    visibility: ProductVisibility
    // ── Commercial depth (optional; the generalized editor fills these) ──
    descriptionEn?: string
    descriptionAr?: string
    variants?: ProductVariant[]
    // Subscription config lives at listing level; per-country PRICES live on each
    // variant's RegionalData (subscriptionPrice*). Folded-in change.
    subscriptionEnabled?: boolean
    subscriptionFrequencies?: SubscriptionFrequency[]
    subscriptionDiscountPct?: Partial<Record<SubscriptionFrequency, number>>
    // Instruction / coupon text (folded-in change) — banner, PDP, or both.
    instructionTextEn?: string
    instructionTextAr?: string
    instructionPlacement?: "banner" | "pdp" | "both"

    // ── Full product-creation field set (restored; all optional) ──
    type?: ProductType
    category?: string
    subCategory?: string
    // Regulatory
    isPrescriptionRequired?: boolean
    isOtc?: boolean
    requiresConsultation?: boolean
    isControlledSubstance?: boolean
    regulatoryBadges?: string[]
    // Type-conditional: Wearable
    wearableManufacturer?: string
    wearableConnectivity?: string
    wearableCompatibility?: string
    wearableWarrantyMonths?: number
    // Type-conditional: Gift Card
    giftCardValidity?: string
    giftCardRedemptionType?: "digital" | "physical" | "both"
    giftCardTermsEn?: string
    giftCardTermsAr?: string
    // Type-conditional: Medicine
    medicineGenericName?: string
    medicineDisclaimerEn?: string
    medicineDisclaimerAr?: string
    medicineMechanismEn?: string
    medicineMechanismAr?: string
    medicineContraindications?: string
    // Master content
    /** Set by the content service on first save — the real product id. */
    apiProductId?: number
    /** Service-generated uid, e.g. "SUPP-10005". Read-only. */
    apiUid?: string
    /** FK to the brands endpoint. Replaces the old free-text `brand`. */
    brandId?: number
    shortDescriptionEn?: string
    shortDescriptionAr?: string
    // ── API content fields (added for the content-service integration) ──
    keyIngredientsEn?: string
    keyIngredientsAr?: string
    keyHighlightsEn?: string
    keyHighlightsAr?: string
    /** General product disclaimer (the API's `disclaimer`, not medicine-only). */
    disclaimerEn?: string
    disclaimerAr?: string
    /** How it works (the API's `mechanism`, not medicine-only). */
    mechanismEn?: string
    mechanismAr?: string
    usageInstructionsEn?: string
    usageInstructionsAr?: string
    storageInstructionsEn?: string
    storageInstructionsAr?: string
    scienceBlockEn?: string
    scienceBlockAr?: string
    benefits?: Benefit[]
    ingredients?: Ingredient[]
    trustBadges?: string[]
    // Product-level media (hero/gallery)
    mediaGallery?: MediaAsset[]
    // Delivery
    deliveryConfig?: DeliveryConfig[]
    // Subscription extras
    subscriptionAutoSelected?: boolean
    subscriptionSavingsLabelEn?: string
    subscriptionSavingsLabelAr?: string
    subscriptionTermsEn?: string
    subscriptionTermsAr?: string
    subscriptionMinCycles?: number
    // Multi-buy
    /**
     * @deprecated LISTING grain, which the table does not have. Tiers are keyed
     * (variant_id, country_id, min_qty) and live on `RegionalData.multiBuyTiers`. Kept
     * only because ~1,420 migrated listings and the legacy /products editor still carry
     * it; nothing in the catalogue editor reads it since 2026-08-30.
     */
    multiBuyTiers?: MultiByTier[]
    // Add-ons
    enhancements?: ProductRef[]
    frequentlyBoughtTogether?: ProductRef[]
    biomarkerPackages?: ProductRef[]
    consultationAddonEnabled?: boolean
    consultationAddonPrice?: number
    consultationAddonListingId?: string   // linked doctor-consultation listing offered as the add-on
    giftWrappingEnabled?: boolean
    giftWrappingPrice?: number
    extendedDeliveryEnabled?: boolean
    upsellBannerTextEn?: string
    upsellBannerTextAr?: string
    // SEO (product-level) — the MASTER / fallback used when a market has no override.
    seoTitleEn?: string
    seoTitleAr?: string
    seoDescriptionEn?: string
    seoDescriptionAr?: string
    seoCanonicalUrl?: string
    ogImageUrl?: string
    slugEn?: string
    slugAr?: string
    // SEO localisation — per country × language, and per city (seo_meta rows).
    /**
     * Variant axes for this listing. Empty/absent = legacy single-axis mode, where
     * each variant carries its own `variantType` and a hand-typed label.
     */
    variantOptions?: VariantOption[]
    /** Cross-cutting labels. Applied here; the vocabulary is curated in Administration. */
    tagIds?: string[]
    /** Set on combo and program listings; absent on everything else. */
    compositionId?: string
    /** Programs only: schedule and the policies ops must follow. */
    program?: ProgramConfig
    /** Health Team profiles delivering this listing (Doctors & Health Coaches). */
    /**
     * DERIVED from `coaches` — the flat list every existing reader already uses.
     * Kept so nothing downstream had to change; same pattern as a panel's
     * memberIds. Authoring happens on `coaches`.
     */
    practitionerIds?: string[]
    /**
     * The coaches on this listing, with who leads and who is bookable. This is
     * what is authored; `practitionerIds` follows from it.
     */
    coaches?: ListingCoach[]
    /** Diagnostics-only. Absent on every other department's listings. */
    diagnostics?: DiagnosticsConfig
    /** Treatments-only: administration method, dosage axis and treatment plans. */
    treatments?: TreatmentsConfig
    /** Consultation sub-department only: delivering role and the gating questionnaire. */
    consultation?: ConsultationConfig
    /**
     * Permanent truth about the listing, unlike a sale price: some things may never
     * be discounted (GLP-1, MOH-regulated items, partner-contracted pricing).
     * Absent = discountable.
     */
    discountable?: boolean
    /** Hard floor a sale may never price below, per country. */
    priceFloors?: { country: Country; amount: number }[]
    seoLocales?: SeoLocaleEntry[]
    seoCountrySettings?: SeoCountrySettings[]
    // Feature flags
    hideVariantsOnConsultationLink?: boolean
    forceVariantDisplay?: boolean
    variantVisibilityUrlOverrideEnabled?: boolean
    subscriptionAutoSelectOverride?: boolean | null
    showCompareAtPrice?: boolean
    showStockIndicator?: boolean
    showDeliveryEstimate?: boolean
    consultationLinkSuppressesAddons?: boolean
    // Rich content blocks
    faq?: FAQItem[]
    reviews?: CustomerReview[]
    influencerVideos?: InfluencerVideo[]
    superiorityBlock?: SuperiorityBlock
    // ── FE PDP contract (Health Products) — additive ──
    subTitleEn?: string
    subTitleAr?: string
    rating?: number
    totalRatings?: number
    heroDiscountType?: "percentage" | "fixed"
    heroDiscountValue?: number
    deliveryTime?: string
    pricePerServing?: number
    howToUse?: HowToUseItem[]                      // structured Dosage/Timing/Storage
    comparison?: { valeoTitleEn?: string; valeoTitleAr?: string; otherTitleEn?: string; otherTitleAr?: string; rows: ComparisonRow[] }
    stats?: { titleEn?: string; titleAr?: string; items: StatItem[] }
    clinicianReviews?: ClinicianReview[]
    frequentlyBought?: { couponDiscount?: number; discountType?: "percentage" | "fixed"; listingIds: string[] }
    recommendationIds?: string[]                   // "Customers Also Viewed"
    // Partner exclusivity — if true, hidden from Valeo master search (partner-only listing)
    partnerExclusive?: boolean
    // Attached reusable promo banner (with coupon).
    promoBannerId?: string
}

// Pillar 3: Clinical
export interface Survey extends Entity {
    title: string
    type: "medical" | "lifestyle" | "feedback" | "specialized"
    questionCount: number
    status: "draft" | "published"
}

export interface Question {
    id: number
    text: string
    type: "text" | "long_text" | "single_choice" | "multiple_choice"
    required: boolean
    options?: string[]
}

export interface HealthProfile extends Entity {
    userName: string
    completionRate: number
    lastAssessment: string
    biotype?: string
    longevityScore?: number
}

export interface ScoringRule extends Entity {
    name: string
    category: "biomarker" | "survey" | "lifestyle"
    weight: number
    thresholds: string
}

// Pillar 4: Operations
export interface Order extends Entity {
    orderNumber: string
    customerName: string
    customerEmail?: string
    customerPhone?: string
    total: number
    items: Array<{ name: string; type: string }>
    status: "pending" | "scheduled" | "completed" | "cancelled"
    scheduling?: {
        date: string
        time: string
        status: "unassigned" | "assigned" | "completed"
    }
}

export interface LogisticCenter extends Entity {
    name: string
    region: string
    capacity: "low" | "medium" | "high"
    activeNurses: number
}

export interface Region extends Entity {
    name: string
    countryCode: string
    isActive: boolean
}

// Pillar 5: Growth
export interface Campaign extends Entity {
    name: string
    type: "discount" | "email" | "content"
    reach: number | string
    startDate: string
    endDate?: string
    status: "active" | "draft" | "ended"
}

export interface Partner extends Entity {
    name: string
    type: "clinic" | "gym" | "corporate"
    status: "active" | "pending"
    referralCode?: string
}

export interface Expert extends Entity {
    name: string
    specialization: string
    rating: number
    consultCount: number
}

export interface SocialProof extends Entity {
    author: string
    role: string
    content: string
    rating: number
    status: "pending" | "approved"
}

// Administration
export interface User extends Entity {
    name: string
    email: string
    role: "admin" | "product_manager" | "nutritionist" | "content_editor" | "lab" | "external_nutritionist" | "b2b_partner" | "crm" | "client"
    status: "active" | "inactive" | "pending"
    lastLogin?: string
}
