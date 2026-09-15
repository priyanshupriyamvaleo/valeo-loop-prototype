# Valeo catalogue — composition, pricing, programs, sales

> **Partly superseded.** The combo/freebie **scope, mapping and country/city pricing**
> sections are replaced by `SPEC-combos-freebies.md`, which is implemented and verified
> (`npx tsx .cleanup/verify-compositions.ts`). Read that one first for anything about
> `Composition.scopes`, attach eligibility, or bundle pricing. What is still live here:
> **programs** and the **flash-sale rework**.

> **Provenance, stated plainly.** Two multi-agent runs were used. The first produced
> detailed designs for flash sales, combos and freebies (recovered to
> `.cleanup/wf_recovered.json`) but stalled on Programs and the ops questions. The
> second run's design agents stalled again, and its synthesis agent received EMPTY
> inputs because of a bad argument on my side — it said so rather than inventing
> substitutes, and reconstructed this plan from the actual types instead
> (`src/types/index.ts`, `src/lib/flash-sales.ts`, `treatments.ts`, `catalogue.ts`,
> `listing-status.ts`). That makes it grounded in code rather than in the earlier
> tracks; the recovered track designs are kept alongside for cross-checking.


> The six track payloads arrived empty (`RECOVERED TRACKS: {}`, `PROGRAMS: null`, `OPS: null`). Nothing has been invented to stand in for them. This plan is reconstructed from the code that actually exists — `src/types/index.ts`, `src/lib/flash-sales.ts`, `src/lib/treatments.ts`, `src/lib/catalogue.ts`, `src/lib/listing-status.ts`, `src/lib/schema-map.ts` — and from the nine established decisions. The conflicts resolved below are real conflicts **in the current types**, not reported disagreements between tracks.

## The one decision that shapes the rest

**Nothing composes listings. Everything composes priced units.**

Decision 3 already says a listing has no single price: money lives on `ProductVariant.regionalData[].price`, on `DiagnosticsServiceOption.pricing`, and on `TreatmentPlan.pricing`. A combo that references a *listing* therefore cannot be priced, cannot be stocked, and cannot be fulfilled — it has referenced a folder, not a thing you can sell. Every existing composition-shaped type in the repo gets this wrong in the same way: `BundleItem { productId, variantId, quantity }` (types:676) and `ProductRef { productId, variantId }` (types:695) both hard-assume a variant, which means neither can express a combo containing a blood panel or an IV plan. That is why Diagnostics grew its own private add-on mechanism (`biomarkerPackages`, `DiagnosticsConfig.allowMiniPackageAddition`) and Treatments grew a freebie that is just a string (`TreatmentPlan.giftEn`).

So the primitive is a reference to a priced unit:

```ts
// types/index.ts — the vocabulary already exists as FlashSalePricedUnit (types:209)
export type PricedUnitKind = Exclude<FlashSalePricedUnit, "all">   // "variant" | "service_option" | "plan"

export interface PricedUnitRef {
    listingId: string
    kind: PricedUnitKind
    unitId: string        // ProductVariant.id | DiagnosticsServiceOption.id | TreatmentPlan.id
}
```

`FlashSalePricedUnit` is already this union plus `"all"`. The codebase converged on the vocabulary before it converged on the primitive; this just finishes the job. Every consequence below — one composition entity, the resolution order, the cache key, what an add-on is — falls out of this single sentence.

## 1. Composition primitive (combos · programs · freebies · add-ons)

**One primitive. Combos, programs, freebies and add-ons are the same entity with a different rule kind. Flash sales and multi-buy are NOT — they stay outside it.**

The discriminator, stated once so it can be applied mechanically: **does the thing produce an order line from a member reference, or does it only modify the price of lines that already exist?**

| | produces lines from members | verdict |
|---|---|---|
| Combo | yes — the members are what you receive | in the primitive |
| Program | yes — sessions, panels, supplements | in the primitive |
| Freebie | yes — a real unit at zero | in the primitive |
| Add-on | yes — the add-on is a line | in the primitive |
| Flash sale | no — it has no members, only a scope | stays `FlashSale` |
| `MultiByTier` multi-buy | no — quantity rule on one line | stays a listing field |

```ts
export type CompositionKind = "combo" | "program" | "freebie" | "addon"

/** CLOSED enum. Adding a rule kind is a code change — see decision 9. */
export type CompositionRuleKind =
    | "bundle_price"        // one total per country (combo, program fee)
    | "percent_off_members" // % off the resolved member subtotal (combo, attach discount)
    | "member_sum"          // no discount; total = Σ resolved members (program wrapper, plain add-on)
    | "grant_free"          // named member at zero (freebie)

/** CLOSED enum. `cart_threshold` is deliberately absent from phase one — see §6. */
export type CompositionTriggerKind = "always" | "attach_to"

export interface PriceRow { country: Country; cityId?: string; price: number }

export interface CompositionMember {
    id: string
    ref: PricedUnitRef
    quantity: number
    /** false = an optional module; it drops out silently and the total recomputes. */
    required: boolean
    /** Ops swap list for combo-part failure (§8). Same kind, same country. */
    substitutable?: PricedUnitRef[]
    /** Program only: when this member is delivered/redeemable. */
    dayOffset?: number
    sortOrder: number
}

export interface Composition extends Entity {
    kind: CompositionKind
    nameEn: string
    nameAr?: string
    members: CompositionMember[]
    /** The member whose sub-department the combo/program listing inherits (§3). */
    primaryMemberId?: string
    rule: {
        kind: CompositionRuleKind
        prices?: PriceRow[]        // bundle_price
        percent?: number           // percent_off_members
        grantMemberId?: string     // grant_free
    }
    trigger: {
        kind: CompositionTriggerKind
        /** attach_to: the parents this offer appears on. Tag scope preferred — same
         *  reason flash sales prefer it: adding a product is one tag, not an edit. */
        parentUnits?: PricedUnitRef[]
        parentListingIds?: string[]
        parentTagId?: string
    }
    /** Presentation slot only. Never affects price. */
    surface?: "own_page" | "pdp_addon" | "pdp_fbt" | "cart"
    countries: Country[]
    /** Reuses the four listing states — Draft/Published/Inactive/Archived, nothing deletes. */
    status: ProductStatus
    /** Freebie caps; counted by Order Service, declared here. */
    maxGrantsPerOrder?: number
    maxGrantsTotal?: number
    startsAt?: string
    endsAt?: string
}
```

Two guard rails, both required to keep decision 9 (no attribute-rule engine) intact:

1. **Members are enumerated, never predicated.** There is no "all listings where X". The only indirection allowed is `trigger.parentTagId`, which resolves to a listing set exactly the way `listingInSale()` already does in `src/lib/flash-sales.ts:24`. A tag is a curated, governed vocabulary (decision 6), not a predicate language.
2. **`CompositionRuleKind` and `CompositionTriggerKind` are closed enums.** Four rule kinds, two trigger kinds. Adding one is a PR, reviewable, auditable.

**A Composition never carries merchandising.** It has no slug, no SEO, no media, no category placement, no landing page. Anything sold on its own page is a `Listing` (decisions 1 and 2 leave no room for a second sellable entity), linked by one new field:

```ts
// Listing
/** Set on combo and program listings. Absent on everything else. */
compositionId?: string
```

Combos and programs get a Listing (`compositionId` set, `trigger.kind = "always"`). Add-ons and freebies get **no** Listing of their own — they render on the parent's PDP and are pure relations.

## 2. Price resolution order

Stages 0–8 are a pure function of `(PricedUnitRef, PriceContext)` and are cacheable. Stage 9 is cart-time and is not.

**Stage 0 — availability gate (not price).** `CatalogCountryConfig` row exists for the country and `status === "active"`; `Listing.status` per `src/lib/listing-status.ts`; `VariantStatus`; `RegionalData.isAvailable`. No row = not sold there. A unit that fails the gate has no price at all — it does not have a price that is then hidden.

**Stage 1 — base.** The unit's own price row, in its own department's home (decision 3), with the city override merged over the country row:
- Health Products → `variant.regionalData[country].price`, then `regionalData.cityPrices[cityId]`.
- Diagnostics → `DiagnosticsServiceOption.pricing` (country row, then `cityId` row).
- Treatments → `TreatmentPlan.pricing` via the existing `planPrice()` in `src/lib/treatments.ts:14`.

Then apply the **stored per-unit discount that already lives in those same rows** — `DiagnosticsServicePrice.discountType/discountValue` (types:441), `TreatmentPlanPrice.discountType/discountValue` (types:296). These are *not* promotions; they produce base. `compareAtPrice`, `retailPrice`, `compareAtPriceOverride`, `Listing.heroDiscountType/heroDiscountValue` are **strike-through display only and are never inputs to any stage** — otherwise a merchandising badge silently moves money.

Subscription selects a *different base* here (`RegionalData.subscriptionPrice*`), it is not a downstream discount.

**Stage 2 — scheduled price change.** New entity; replaces base from its instant.

```ts
export interface ScheduledPriceChange extends Entity {
    unit: PricedUnitRef
    country: Country
    cityId?: string
    newPrice: number
    effectiveAt: string      // absolute ISO instant
    appliedAt?: string       // set by the write-through job — this is what makes it idempotent
    reason?: string
    createdByName?: string
}
```
A scheduled change is *permanent* and writes through to the canonical row at its boundary; a flash sale is *temporary* and never writes. That distinction is the whole reason both exist, and it is why decision 4's "listings stay untouched" is not violated: the write-through changes the base price, which is a base-price edit, audited via `AuditLogEntry`.

**Stage 3 — contracted/partner substitution.** `PartnerAccessEntry.pricing: PartnerPrice[]` (types:1160) at variant × country × city. It **substitutes** base, and it is **terminal**: stages 4–6 do not run on a contracted price. A negotiated B2B rate is a contract, not a starting point for further discounting.

**Stage 4 — flash sale.** `effectivePrice()` in `src/lib/flash-sales.ts:48`, with three fixes (§5). Best-of across overlapping sales; floors from `FlashSaleRule.floorPrice` and `Listing.priceFloors` take the `Math.max`; `Listing.discountable === false` excludes the unit entirely.

**Stage 5 — combo rule.** Applies only when the unit is bought as part of a Composition. `percent_off_members` and `member_sum` consume the stage-4 price (a sale flows through into a combo). `bundle_price` **replaces** the member subtotal, and when it does, member-level flash sales do not also apply — see §5. The combo total must honour the same guards a sale does: it may not price below `Σ` member `priceFloors` for that country, and members with `discountable === false` enter the sum at base and are excluded from the discount arithmetic.

**Stage 6 — freebie grant.** Emits an additional line at zero for `grantMemberId`. It is **not** a discount on the parent, so it does not touch the parent's floor — floors constrain what a unit may be *sold* for, and the parent is still sold for its floored price. The granted unit itself must pass Stage 0 in that country and must not be `discountable === false` (a unit that may never be discounted may certainly not be given away — GLP-1, MOH-regulated, partner-contracted).

**Stage 7 — surcharges, never discounted.** `TreatmentsConfig.slowDripSurcharge` (types:339) and `DiagnosticsConfig.coupleBookingSurcharge` (types:474) are added here, after every promotion. A slow infusion costs the same nurse-hour whether or not there is a sale. This is a **behaviour change**: `finalPlanPrice()` in `src/lib/treatments.ts:25` currently applies the stored discount and then adds the surcharge inside one function, so any caller passing its output into `effectivePrice()` lets a flash sale discount the surcharge. Split it into `basePlanPrice()` (stage 1) and `applySurcharges()` (stage 7).

**Stage 8 — VAT.** `SubDepartmentCountryConfig.vat` / `vatMode` with the `medicineClass` override (types:1004), gated by `CatalogCountryConfig.isVatExcluded`. **Round once, here.** Stages 1–7 carry full precision. `src/lib/flash-sales.ts:71` currently rounds inside every sale evaluation; four stages each rounding to 2dp drifts. Move the rounding to the presentation edge.

**Stage 9 — cart-time only, never cached.** `MultiByTier` multi-buy (types:669); coupons, gated by `FlashSale.stacksWithCoupons` and `CatalogCountryConfig.isCouponEligible`; `PromoBanner.couponCode`. These depend on cart contents and customer identity, so they cannot be a property of a unit.

**What is idempotent.** Stages 0–8 are pure and write nothing. No stage ever writes a resolved price back onto a listing — that rule was established for flash sales and now covers combos, programs and freebies too. The one write in the system is the scheduled-change job, made idempotent by `appliedAt`. Stage 6 returns a **set keyed by `(compositionId, memberId, parentUnitRef)`**, so re-running resolution cannot double-grant.

**Cache key** (`src/lib/pricing.ts`):

```
listingId | unitKind | unitId | country | cityId | audience(partnerId|"public")
         | purchaseMode(one_off|subscription:<freq>) | vatContext(subDepartmentId)
         | priceEpoch
```

- **Language is not in the key.** Copy is not price.
- **Coupon is not in the key.** It is stage 9.
- `priceEpoch` is a counter bumped by any write to a price row, Composition, FlashSale or ScheduledPriceChange touching the unit — so an operator edit invalidates immediately instead of waiting out a TTL.
- **TTL must not outlive the next boundary**: `expiresAt = min(startsAt/endsAt of every applicable sale, effectiveAt of every pending scheduled change, startsAt/endsAt of every applicable composition)`. Never a fixed duration — a fixed TTL is how a sale keeps discounting after it ends.

## 3. Combos

A combo is **a Listing with `compositionId` set**, plus `Composition{ kind: "combo", trigger: { kind: "always" } }`.

- **What it is (decision 2):** the combo listing takes the department and sub-department of `primaryMemberId`. There is deliberately **no "Bundles" sub-department** — "bundle" is a commercial shape, not what the thing *is*, and a sub-department is the WHAT axis. "Bundles & Offers" is a `Category` / `SubCategory` — the WHERE axis — exactly like the flash-sale landing page already is (types:245).
- **Cross-department combos are allowed and are the point** (a panel + a consultation + a supplement). Each member keeps its own `FulfilmentPath`, so the order splits into one fulfilment line per member. The combo is one commercial promise across several operational ones.
- **Rules:** `bundle_price` (per-country `PriceRow[]`, optional city override) or `percent_off_members`. Nothing else in phase one.
- **Zoho (decision 8):** a KSA combo can legitimately cross books — a supplement routes to Saha, a service to Value Health IT. Therefore **the invoice is one line per member, each routed by its own member's sub-department × country**, and the combo discount is **allocated pro rata by base price share**: `memberAllocated = comboTotal × memberBase / Σ memberBase`. Qatar still creates no invoices at all.
- **Activation:** `listingActivationRequirements()` in `src/lib/catalogue.ts:85` currently requires "At least one variant with a price". A combo listing has no variants of its own and would be permanently un-activatable. Branch on `l.compositionId` and swap that requirement for `compositionGaps()` (new, `src/lib/composition.ts`): ≥2 members, every required member sellable in every declared country, a price rule for every declared country, total ≥ Σ member floors, `primaryMemberId` set.
- **Derive, never store (decision 5):** member count, "you save X", discount %, combo availability. None of them are fields.

**Legacy `Bundle` (types:682-693) is deleted.** `bundlePriceUae/bundlePriceKsa/bundlePriceQatar/bundlePriceKuwait/bundlePriceOthers` are five hardcoded country columns — they cannot express a city override, cannot express a new market, and are a fourth price home in violation of decision 3. Migration: `Bundle.items[]` → `CompositionMember[]` with `PricedUnitRef{kind:"variant"}`; the five columns → `PriceRow[]`; `compareAtBundlePrice` → dropped (derived from Σ member base). `Product.bundles` and `Listing.bundles` become read-only during migration, then removed.

## 4. Programs (reworked) — and how Journey / Programs sub-department / TreatmentPlan `course` relate

Four things in this repo currently mean "program". They are four different things and all four survive, discriminated by **what is sold**:

| Thing | Where | Priced? | In an order? | Role |
|---|---|---|---|---|
| `Journey{ kind: "program" }` (types:1441) | `catalogue/journeys` | never | never | Context + landing page: `pageBlocks`, `retentionAttachments`, M:M `listingIds`. It is the marketing home. |
| `Protocol` (types:1274) | `catalogue/protocols` | never | never | Clinically-distinct sequence with a `clinicianAuthor`, `ProtocolStep.gating`, `linkedListingId`. Clinical truth, not commerce. |
| Listing in `sd-consultations-programs` | Doctors & Health Coaches | **yes** | **yes** | **The sellable program.** Carries `compositionId`. |
| `TreatmentPlan{ kind: "course" }` (types:269) | inside a Treatments listing | **yes** | **yes** | Multi-session unit of *one* treatment; price on `TreatmentPlan.pricing` per decision 3. |

**The discriminator between the last two, stated once so nobody has to guess:** if every session is the same treatment from one listing → `TreatmentPlan.kind = "course"`, priced where Treatments prices things. If the sessions span more than one listing or more than one department → a program Listing with `Composition{ kind: "program" }`. "8 NAD+ infusions" is a course. "12 weeks of coaching + a baseline panel + a follow-up panel + 3 months of supplement" is a program.

Program-specific mechanics:
- Members carry `dayOffset` and the composition carries `startsAt/endsAt`; `validityDays` and `sessionCount` are expressed per member (`quantity`) rather than duplicated at composition level — `TreatmentPlan.sessionCount`/`validityDays` stay where they are for courses.
- Rule is normally `bundle_price` (a program fee) or `member_sum` (a pure wrapper). Never `grant_free`.
- **Entitlements** (what the customer may still redeem, and until when) belong to Order Service. The CMS *declares* the entitlement shape via the members; it does not track consumption. Same boundary as `Biomarker` creation staying in the Admin Portal.
- A program Listing usually sits in exactly one `Journey` (`journeyIds`), and that Journey owns the landing page. `Protocol.journeyId` links the clinical sequence to the same Journey. So: Journey = the page, Protocol = the clinical sequence, Listing+Composition = the thing with a price. Three concerns, three homes, no overlap.
- **Retention:** programs use `Journey.retentionAttachments` (the reusable `RetentionTemplate`, types:1433). `Journey.retention` — the legacy four fixed slots, types:1384 — is read-only for migration and then removed; two retention models on one entity is exactly the drift decision 5 exists to prevent.

## 5. Flash sales (rethought — what changed and why)

The entity is right and stays: a sale is its own entity, never a price written onto a listing; state is derived from the window; the landing page is a category page. Five concrete changes:

1. **`sale.pricedUnit` is declared but never enforced.** `activeSalesFor()` / `effectivePrice()` (`src/lib/flash-sales.ts:31,48`) take no unit kind, so a sale scoped to `"plan"` will discount a variant. **This is a live bug**, not a design preference. Thread `PricedUnitKind` through both and filter: `sale.pricedUnit === "all" || sale.pricedUnit === unit.kind`.
2. **`sale.timezone` is declared and never read.** `saleState()` (`flash-sales.ts:8`) compares `new Date(sale.startsAt)` against `new Date()`. Pin the semantics rather than adding timezone maths: **`startsAt`/`endsAt` are absolute, offset-bearing ISO instants; `timezone` is authoring and display only** ("this sale runs 09:00–23:59 Riyadh time" is how it is *entered and shown*). Decision 8's four clocks stay coherent because the operator always sees their own; the comparison is never ambiguous.
3. **No double-dipping with a fixed bundle price.** If the resolved combo rule is `bundle_price`, member-level sales do not apply to the members — the bundle price *is* the deal, and applying a sale underneath it is how a combo silently sells below cost. The combo itself may be sale-scoped only via the combo *listing's* own tag. For `percent_off_members` and `member_sum`, the member's stage-4 price flows through normally.
4. **Rounding moves out** (see stage 8) and **contracted prices are terminal** (stage 3): `effectivePrice()` gains a `contracted: boolean` short-circuit so a partner rate is never re-discounted.
5. **`FlashSaleRule` is country-level only** — no city dimension, and none is being added in phase one. Stated explicitly so nobody assumes symmetry with `PriceRow`.

Unchanged and worth restating: overlapping sales give the customer the best price (deterministic, and the only choice that never looks like a bug from outside); `flashSaleGaps()` already blocks a sale that resolves to zero listings and one with no landing page.

## 6. Freebies

Today's freebie is `TreatmentPlan.giftEn?: string` (types:320) — "Free Marine Collagen supplement" as prose. It has no linked unit, so it decrements no stock, books no slot, appears on no invoice, and cannot be turned off without editing every plan that mentions it.

Replacement: `Composition{ kind: "freebie", rule: { kind: "grant_free", grantMemberId }, trigger: { kind: "attach_to", … } }`.

- The granted member is a **real `PricedUnitRef`**. It therefore decrements `variant.stockQuantity`, consumes a slot if it is a service, invoices as a zero-value line under **its own** member routing (decision 8), and must pass Stage 0 in the buyer's country. That is the entire point of the change.
- `TreatmentPlan.giftEn` stays as a field but becomes **derived display copy** from the attached freebie composition — never hand-typed. Same treatment as `readMinutes` and every other derived value under decision 5.
- **Floors:** a grant is a separate zero-priced line, not a discount on the parent, so `Listing.priceFloors` and `FlashSaleRule.floorPrice` are untouched and no exemption is needed. But the granted unit's own `discountable === false` **blocks the grant** — "may never be discounted" means "may never be given away".
- Caps: `maxGrantsPerOrder`, `maxGrantsTotal` (budget stop). Counted by Order Service; declared here.
- **Deferred out of phase one:** `cart_threshold` triggers ("free X over AED 500") and a `cheapest_free` rule. Both are cart-time and would break the "stages 0–8 are a pure function of one unit" property that the whole cache design rests on. When they land, they land in stage 9 next to coupons, not in the PDP price.

## 7. Add-ons

**An add-on is a listing-to-listing relation. There is no add-on entity.** The legacy `CustomTestAddons` module made add-ons a parallel entity duplicating name, description, image, category, city pricing and SLAs from listings — six fields that then drift, so the add-on shown at checkout is a stale copy of the product on its own page. Every one of those already has a single home: `Listing.displayNameEn/Ar`, `descriptionEn/Ar`, `mediaGallery`, `subCategoryIds`, the department's price home, and `DiagnosticsSlotMapping.orderSlaHours/coachSlaHours/operationsSlaHours`.

The existence proof that this works is already in the repo: `DiagnosticsConfig.allowMiniPackageAddition`, `allowNonBloodBiomarkerAddition`, `excludedMiniPackageIds`, `miniCategoryId` (types:476-483) store *eligibility policy plus a relation* — no duplicated content — and Diagnostics minis have worked that way from the start. That policy stays exactly as it is and becomes the eligibility check for Diagnostics add-on compositions.

**Five parallel add-on mechanisms currently sit on `Listing`. All five collapse into `Composition{ kind: "addon" }`:**

| Legacy field | Becomes |
|---|---|
| `enhancements: ProductRef[]` (types:1566) | `Composition{ kind:"addon", rule:"member_sum" \\| "percent_off_members", surface:"pdp_addon" }` |
| `frequentlyBoughtTogether: ProductRef[]` (1567) + `frequentlyBought{ couponDiscount, discountType, listingIds }` (1637) | one composition, `surface:"pdp_fbt"`, `rule:"percent_off_members"` — two fields expressing the same feature is itself the bug |
| `biomarkerPackages: ProductRef[]` (1568) | `addon` whose members are mini `service_option` units; eligibility from `DiagnosticsConfig` as above |
| `consultationAddonEnabled/Price/ListingId` (1569-71) | `addon` with the consultation's `plan`/`service_option` as member. **`consultationAddonPrice` is deleted** — it retypes a price outside the three sanctioned homes and is the single clearest proof that add-on-as-entity is wrong |
| `giftWrappingEnabled/Price` (1572-73) | gift wrapping becomes a **real Health Products listing** (its price then lives in `variant.regionalData`, gets per-country VAT and Zoho routing like everything else) referenced by one global `addon` composition |
| `extendedDeliveryEnabled` (1574) | not a catalogue concept — a fulfilment option owned by Order Service. Removed from `Listing`. |

`consultationLinkSuppressesAddons` and `hideVariantsOnConsultationLink` survive as surface flags: they hide addon compositions on a given entry path. They control display, never price.

## 8. Ops questions answered (slots · OOS · combo-part failure · off-days)

**Slots.** A combo or program whose members are services must not book four separate visits. Rule: members sharing `fulfilmentPath` **and** city collapse into one appointment; the appointment's lead time is `max(DiagnosticsSlotMapping.leadTimeMinutes)` across members and its duration is the sum of `sessionDurationMinutes` / `durationHours`; the bookable slot group is the **strictest** member's (`slotMappings` are city-scoped, so the city row is the only place a real `slotGroupId` exists — types:401). Free and add-on services consume capacity exactly like paid ones; a freebie that books a nurse is a booking.

**Out of stock.** Derived at read time, never stored: a **required** member failing Stage 0 (`VariantStatus.out_of_stock`, `stockQuantity <= 0`, `RegionalData.isAvailable === false`, no `CatalogCountryConfig` row, no slot in the city) makes the combo unbuyable — shown as unavailable, never silently substituted, and the combo listing keeps its own status untouched (a data condition must not mutate a curated state). An **optional** member simply drops out and the total recomputes — which is why `member_sum` and `percent_off_members` degrade safely and `bundle_price` requires every required member present.

**Combo-part failure after the order.** Atomic at order level, because the combo was one commercial promise. In order: (1) substitute from `CompositionMember.substitutable[]` at no price change; (2) if no substitute, cancel the whole combo line and refund the combo total. Never partial-refund at member list price — the discount was allocated pro rata, so the refund uses the allocated amounts: `memberRefund = comboTotal × memberBase / Σ memberBase`, the same formula the invoice split uses. Re-pricing a partial member set would re-run resolution against a set the customer never bought, which breaks the idempotency defined in §2.

**Off-days.** Nothing in the repo models these — grepping for `off.?day|holiday|blackout` returns only `LogisticCenter.capacity`. So this is new, and it is **explicitly not a catalogue concept**:

```ts
export interface ServiceCalendar {
    id: string
    country: Country
    cityId?: string
    serviceProviderId?: string          // ServiceProvider.id (types:1122)
    closedDates: string[]               // ISO dates
    weekdayWindows?: { weekday: 0|1|2|3|4|5|6; openTime: string; closeTime: string }[]
    note?: string                       // "Ramadan hours", "National Day"
    isActive: boolean
}
```
It lives under Operations and is read by the slot resolver, which subtracts it from `SlotGroup` availability. Putting off-days on a listing would make an ops calendar into a listing field and, worse, invite "Ramadan hours" to become a tag or a taxonomy node — decisions 2 and 6 both forbid it. Ramadan *merchandising* is still a `campaign` tag; Ramadan *opening hours* are a calendar. Different things, different homes.

## 9. What ships in phase one

1. **`PricedUnitRef` + `src/lib/pricing.ts`** — `resolveUnitPrice(ref, ctx)` implementing stages 0–8, the cache key, and `expiresAt`. Everything else depends on this; it ships first.
2. **`src/lib/flash-sales.ts` fixes** — enforce `pricedUnit`, pin timezone semantics, `contracted` short-circuit, rounding moved out. Small, self-contained, fixes a live mispricing bug.
3. **`Composition` + `src/lib/composition.ts`** — `compositionGaps()`, `resolveComposition()`, `allocatePro Rata()`; `Listing.compositionId`; `listingActivationRequirements()` branch in `src/lib/catalogue.ts`.
4. **Add-ons as relations** — migrate all five legacy mechanisms; delete `consultationAddonPrice` and `extendedDeliveryEnabled`; gift wrapping becomes a listing.
5. **Combos** — `bundle_price` + `percent_off_members`, own Listing, pro-rata invoice split, `Bundle` migrated and removed.
6. **Freebies** — `attach_to` + `grant_free` only; `TreatmentPlan.giftEn` becomes derived.
7. **`ScheduledPriceChange`** + the idempotent write-through job.
8. **Programs** — `sd-consultations-programs` listing + `Composition{kind:"program"}` with `dayOffset`; `Journey` and `Protocol` untouched; `Journey.retention` frozen.
9. **`ServiceCalendar`** under Operations, read by the slot resolver.
10. **Schema map** — add `catalog_compositions`, `catalog_composition_members`, `catalog_scheduled_price_changes`, `service_calendars` to `src/lib/schema-map.ts`; mark `catalog_bundles` as the legacy home being migrated out of.

New UI: `src/app/(dashboard)/catalogue/compositions/page.tsx` and `[id]/page.tsx` (one editor, four kinds — the kind switches which rule fields show, exactly as `DiagnosticsPackageFields` / `TreatmentPlans` already switch by department).

**Explicitly deferred:** `cart_threshold` freebies, `cheapest_free`, `MultiByTier` inside the resolver, partner-priced combos, subscriptions as composition members, city-level flash-sale rules.

## Conflicts resolved

| # | Conflict as it exists in the code | Resolution |
|---|---|---|
| 1 | Combos/add-ons reference `{productId, variantId}` (`BundleItem`, `ProductRef`) — unrepresentable for Diagnostics and Treatments | Everything composes `PricedUnitRef{listingId, kind, unitId}`. Decision 3 made this inevitable. |
| 2 | Are combos/programs/freebies/add-ons one thing or four? | **One** — all four produce order lines from member refs. Flash sales and multi-buy have no members and stay out. |
| 3 | `Bundle.bundlePriceUae/Ksa/Qatar/Kuwait/Others` = a fourth price home with hardcoded countries | Deleted → `PriceRow[]` as a *rule parameter over enumerated units*, never a unit price. Decision 3 intact. |
| 4 | Five parallel add-on mechanisms on `Listing`; `consultationAddonPrice` types a price outside the three homes | All five → `Composition{kind:"addon"}`. `consultationAddonPrice` deleted. |
| 5 | Legacy `CustomTestAddons` duplicated name/image/category/city-price/SLA | Add-on is a relation; every duplicated field already has one home. `DiagnosticsConfig.allowMiniPackageAddition` is the existence proof and becomes the eligibility rule. |
| 6 | `TreatmentPlan.giftEn` is a freebie with no unit, stock, slot or invoice line | Freebie composition granting a real unit; `giftEn` becomes derived copy. |
| 7 | Flash sale % vs combo bundle price — both discount the same money | `bundle_price` suppresses member-level sales; `percent_off_members`/`member_sum` let the sale flow through. Deterministic, no flag. |
| 8 | Freebie (100% off) vs `priceFloors` (`Math.max` of floors caps discounting) | A grant is a separate zero line, not a discount — floors untouched. But `discountable === false` blocks being granted. |
| 9 | Do combos honour `discountable`/`priceFloors` the way sales do? Silence = they wouldn't | Yes, identically. Combo total ≥ Σ member floors; non-discountable members enter at base and are excluded from the discount arithmetic. Enforced in `compositionGaps()`. |
| 10 | Four things mean "program" | Journey = page (never priced) · Protocol = clinical sequence (never priced) · `sd-consultations-programs` listing = sold · `course` plan = sold within one Treatments listing. Discriminator: one listing → `course`; multi-listing → program. |
| 11 | `finalPlanPrice()` discounts then surcharges, so a sale can discount a surcharge | Surcharges move to stage 7, post-promotion, never discounted. `finalPlanPrice()` splits into `basePlanPrice()` + `applySurcharges()`. |
| 12 | Rounding at 2dp inside `effectivePrice()` (line 71) plus again in `finalPlanPrice()` | Full precision through stages 1–7; round once at stage 8. |
| 13 | `sale.pricedUnit` declared, never enforced — a plan-scoped sale discounts variants | Thread `PricedUnitKind` through `activeSalesFor`/`effectivePrice`. Live bug. |
| 14 | `sale.timezone` declared, never read; decision 8 says four clocks | `startsAt`/`endsAt` are absolute instants; `timezone` is authoring/display only. |
| 15 | `PartnerAccessEntry.pricing` vs flash sale vs combo — no stated precedence | Contracted price substitutes base and is **terminal**. |
| 16 | `SubscriptionPlan.finalPrice`/`discountPct` stored (violates decision 5); `heroDiscountValue`, `compareAtPrice` could be read as inputs | All derived / display-only. Never inputs to any stage. |
| 17 | Combo listing blocked forever by "at least one variant with a price" | `listingActivationRequirements()` branches on `compositionId` → `compositionGaps()`. |
| 18 | A cross-book combo (KSA supplement + service) has no invoice routing | One invoice line per member routed by its own sub-department × country; combo discount allocated pro rata. Qatar still invoices nothing. |
| 19 | Two retention models on `Journey` (`retention` vs `retentionAttachments`) | `retentionAttachments` (reusable `RetentionTemplate`) wins; the four fixed slots are frozen then removed. |
| 20 | Off-days have no home and would land on a listing or a tag | New `ServiceCalendar` under Operations, country × city × provider. Not a catalogue concept. |

## Open questions for the team (each answerable yes/no or with one value)

1. Do combos need a **city-level** `bundle_price` override in phase one, or is country-level enough? (yes/no)
2. Is `percent_off_members` needed at launch, or does `bundle_price` alone cover every combo merchandising wants? (yes/no)
3. Can a **program** span departments in phase one (coaching + diagnostics + supplement), or is it Doctors & Health Coaches only? (cross-department: yes/no)
4. When a partner-contracted price exists, may a flash sale ever apply on top? (yes/no — plan assumes **no**)
5. Should a **freebie's granted unit** appear on the Zoho invoice as a zero-value line, or be omitted entirely? (line-at-zero / omit)
6. Maximum members in one combo before the editor refuses? (one number — `MAX_VARIANT_COMBOS = 100` is the existing precedent)
7. Does `Listing.discountable === false` also block that listing from being a **combo member** at all, or only from being discounted inside one? (block-entirely / discount-only — plan assumes discount-only)
8. On combo-part failure with no substitute: cancel-and-refund the whole combo line, or ship what is available and refund the pro-rata allocation? (whole / partial — plan assumes **whole**)
9. Who owns `ServiceCalendar` off-days — Operations or the country GM? (one role)
10. Default cache TTL ceiling when no sale or scheduled change is pending? (one value, e.g. 300s)
11. Does the scheduled-price-change job need an approval step before write-through, or is scheduling itself the approval? (yes/no)
12. Should `giftWrappingEnabled/Price` become a real Health Products listing in phase one, or stay an order-level fee until phase two? (listing / fee)"
  },
  "workflowProgress": [
    {
      "type": "workflow_phase",
      "index": 1,
      "title": "Design"
    },
    {
      "type": "workflow_phase",
      "index": 2,
      "title": "Synthesise"
    },
    {
      "type": "workflow_agent",
      "index": 1,
      "label": "design:programs (retry 5)",
      "phaseIndex": 1,
      "phaseTitle": "Design",
      "agentId": "ac7d1a5b16c5b77ef",
      "model": "claude-opus-5[1m]",
      "state": "error",
      "startedAt": 1786668444897,
      "queuedAt": 1786668384880,
      "attempt": 6,
      "lastAttemptReason": "stalled",
      "promptPreview": "Valeo Catalogue & CMS prototype at /Users/ritwik/valeo-projects/Admin-Panel/headless-cms-frontend (Next.js App Router, TS strict, mock stores in src/services/api.ts).

Read only what you need — src/types/index.ts and the relevant src/lib/*.ts. Do not attempt to read the whole repo.

ESTABLISHED DECISIONS — build on these, never contradict:
1. Departments: Diagnostics & Testing · Treatments & Thera…",
      "lastProgressAt": 1786673788184,
      "error": "stalled — no progress for 180000ms",
      "tokens": 39092,
      "toolCalls": 14,
      "durationMs": 5343286
    },
    {
      "type": "workflow_agent",
      "index": 2,
      "label": "design:ops-questions (retry 5)",
      "phaseIndex": 1,
      "phaseTitle": "Design",
      "agentId": "aa90a9f0ef7c49ade",
      "model": "claude-opus-5[1m]",
      "state": "error",
      "startedAt": 1786668406957,
      "queuedAt": 1786668384880,
      "attempt": 6,
      "lastAttemptReason": "stalled",
      "promptPreview": "Valeo Catalogue & CMS prototype at /Users/ritwik/valeo-projects/Admin-Panel/headless-cms-frontend (Next.js App Router, TS strict, mock stores in src/services/api.ts).

Read only what you need — src/types/index.ts and the relevant src/lib/*.ts. Do not attempt to read the whole repo.

ESTABLISHED DECISIONS — build on these, never contradict:
1. Departments: Diagnostics & Testing · Treatments & Thera…",
      "lastProgressAt": 1786673788183,
      "error": "stalled — no progress for 180000ms",
      "tokens": 56665,
      "toolCalls": 23,
      "durationMs": 5381222
    },
    {
      "type": "workflow_agent",
      "index": 3,
      "label": "synthesise:plan",
      "phaseIndex": 2,
      "phaseTitle": "Synthesise",
      "agentId": "aafa9f2f0816ac3a3",
      "model": "claude-opus-5[1m]",
      "state": "done",
      "startedAt": 1786673824784,
      "queuedAt": 1786673788211,
      "attempt": 1,
      "lastToolName": "Bash",
      "lastToolSummary": "grep -rniE "off.?day|holiday|blackout|capacity|out.?of.?sto…",
      "promptPreview": "Valeo Catalogue & CMS prototype at /Users/ritwik/valeo-projects/Admin-Panel/headless-cms-frontend (Next.js App Router, TS strict, mock stores in src/services/api.ts).

Read only what you need — src/types/index.ts and the relevant src/lib/*.ts. Do not attempt to read the whole repo.

ESTABLISHED DECISIONS — build on these, never contradict:
1. Departments: Diagnostics & Testing · Treatments & Thera…",
      "lastProgressAt": 1786674376693,
      "tokens": 83496,
      "toolCalls": 19,
      "durationMs": 551908,
      "resultPreview": "# Valeo catalogue — composition, pricing, programs, sales

> The six track payloads arrived empty (`RECOVERED TRACKS: {}`, `PROGRAMS: null`, `OPS: null`). Nothing has been invented to stand in for them. This plan is reconstructed from the code that actually exists — `src/types/index.ts`, `src/lib/flash-sales.ts`, `src/lib/treatments.ts`, `src/lib/catalogue.ts`, `src/lib/listing-status.ts`, `src/li…"
    }
  ],
  "totalTokens": 179253,
  "totalToolCalls": 56
}