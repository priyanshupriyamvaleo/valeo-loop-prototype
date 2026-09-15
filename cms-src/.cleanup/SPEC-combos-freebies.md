# Combos & freebies — scope, mapping, country/city pricing

**Status:** implemented. Supersedes the combo/freebie and pricing sections of
`DESIGN-composition-pricing.md` (whose synthesis agent received empty inputs and said
so). Programs and the flash-sale rework still live in that document.

**Verification:** `npx tsx .cleanup/verify-compositions.ts` — 36 checks. Every one of
them exists because it caught something real.

> **Provenance.** Four agents designed and attacked this: one ground read, three design
> tracks (scope / mapping / pricing), three adversarial verifiers. **All three verifiers
> returned `holds: false`** with concrete, line-referenced breaks, and the automated
> synthesis only ever saw one of the three verdicts — so this document was written from
> the raw tracks in `subagents/workflows/wf_fac49b9a-e1c/journal.jsonl`, not from that
> synthesis. Where the verifiers disagreed with each other, the reconciliation is stated
> rather than papered over.

---

## 0. The problem, in one paragraph

A composition said *where it sells* in three places that could disagree —
`countries: Country[]`, its own `rule.prices[]` country/city rows, and a global
`startsAt`/`endsAt`. Nothing said which one won, so "is this offer live for this
customer right now" had three answers. Money was on the rule, so the same
`percent_off_members` could not be 20% in UAE and 15% in KSA without a second
composition. City rows existed in the type and were **unreachable from the UI**.
And the resolver's own promises — flash sale passed in, nothing deletes, derive
never store — were contradicted by its code in five places.

---

## 1. Scope: one keyed row table

`Composition.countries`, `rule.prices` and the global window are **gone**. There is
one table:

```ts
Composition.scopes: CompositionScope[]      // keyed (country, cityId?)
```

Each row says: it sells here · for how much · when · to whom. Shape follows the four
row tables already shipped (`DiagnosticsServicePrice`, `TreatmentPlanPrice`,
`DiagnosticsSlotMapping`, `RegionalData.cityPrices`) and copies `id` + `isActive` from
`DiagnosticsSlotMapping` — the only one that can retire a row without deleting it.

**Payload is all-optional, merge is field-level city-over-country, `undefined` =
inherit.** This copies `effectiveSlot`'s explicit undefined-stripping, *not* a
`{...base, ...city}` spread — that spread would treat a present-but-undefined key as a
real override, and would take `isActive` from the city row, so a retired override
merged to `{price: countryPrice, isActive: false}`: a row that looks retired while
carrying the price that should be served.

> **Reconciliation.** The pricing verifier argued `price` should stay **required**,
> because a one-field row has nothing to inherit and `price?` only manufactures a
> "no-op city row" rot state. That premise is false once the row carries price,
> percent, window, `visibleOn`, `audience` and `coverage` — it was attacking the
> pricing-only row shape, not the merged scope row. Optional payload wins: a city row
> that overrides only the window and inherits the price is now expressible, and is
> covered by a test.

**Three country-row states, not two.** Two booleans cannot express what ops needs, so
`coverage?: "country" | "cities_only"` is the third: a priced payload parent that does
not sell country-wide, only in its city rows.

**Retiring a country cascades to its cities.** A regulatory pull is **one write**
enforced in the resolver, not a UI loop over N rows. `isActive: false` is legal on a
country row and *keeps* the price, the baseline and the date — so a market paused for
a quarter comes back with its history intact instead of looking brand new. Removing a
country never prunes rows. (Both verifiers overturned the pricing design's rule 3,
which rejected `isActive: false` on country rows and pruned on country-off; pruning
destroys the very baseline the drift feature exists to protect.)

**Empty field = inherit. Empty row set = nowhere.** Four regulators, four clocks and a
Qatar that issues no invoices make default-on a compliance event. A new composition
gets one explicit UAE row, never "everywhere".

**Precedence** is one fixed AND-chain, first failure wins, closed enum
(`ScopeMissReason`): `status` → duplicate key → row exists → country closed → row
inactive → window → surface → audience → member availability → price entered. No later
gate re-enables an earlier failure.

A **duplicate key is a deterministic refusal**, not whichever row `.find` hits first —
there is no server here to enforce write-time uniqueness.

**`grant_budget_exhausted` is deliberately not in the enum.** `ScopeContext` has no
grants-issued input, and adding one would un-cache stages 0–4 that the module header
declares cacheable. Caps sit on the row; exhaustion is checked after stage 4 with the
count passed in — exactly how flash sales are already handled.

**Time is stored as an instant with its offset** (`2026-09-01T09:00:00+04:00`).
`MARKET_TZ` is code, used only to render "9am Dubai", because one canonical zone per
market is computable (`FlashSale.timezone` is the anti-precedent). KSA, Qatar and
Kuwait all sit at +03 while UAE is +04 — a stored wall clock is one `new Date()` away
from a plausible-looking multi-hour error.

**Audience is per row.** `CataloguePartner.countries` and
`PartnerPrice {variantId?, country?, cityId?}` are already market-scoped, so
"Emaar-exclusive in UAE, public in KSA" is one composition, not two that drift.

---

## 2. Mapping: two mappings, both two-sided

### Members (composition → priced units)

Stay **embedded and ordered**. Quantity, `required`, `dayOffset`, `sortOrder` are
values the composition owns and must audit as one document; a join table buys nothing.
No name, label, department or price field is added to a member.

Per-market member sets, per-market quantities and per-market `grantMemberId` stay
**out** of scope rows. The moment those go per-row this stops being an auditable
document and becomes a general attribute-rule engine.

### Parents (freebie / add-on → what it attaches to)

**Attach is a two-sided predicate**, and the one-sided version was serving a
clinically forbidden add-on. The shipped seed contradicted itself: `l-blood` sets
`excludedMiniPackageIds: ["l-mini-vitd"]` because the panel already measures Vit-D,
while `cmp-vitd-addon` attached that exact mini to that exact panel. The old filter
checked only composition-side facts, so it returned the add-on the parent explicitly
forbids, on the parent's own page.

`attachEligible(parent, composition, listings)` now intersects **composition scope ∩
parent veto**, honouring the closed vocabulary Diagnostics already shipped with UI
behind it (`allowMiniPackageAddition`, `excludedMiniPackageIds`) plus
`Listing.discountable` for money-bearing rules.

**Which side won:** the clinical veto. A Vit-D upsell on a panel that already measures
Vit-D is wrong regardless of what the campaign says. With one panel in seed data the
add-on therefore has no eligible parent and *says so* — the prototype demonstrates the
guard rail on genuinely contradictory data rather than hiding it. It is `draft`; it is
asserted as blocked in the verification script.

**A freebie's parent may be a member — that is the shape.** "Buy an IV, get collagen
free" has the IV plan as both the qualifying member and the attach parent. Refusing
parent-as-member (right for add-ons, which would double-charge) initially made the
freebie unattachable; the rule is now rule-aware, and only the *granted* member is
barred from being the qualifier.

### `unitUsage` is a read, never a refusal

"What breaks if I remove this variant" is genuinely missing and is now available. It is
deliberately **not** the substrate for a block: the listing editor does not fetch
compositions, and this codebase swallows failed fetches (`Promise.allSettled` with no
error branch). An empty index would read as "nothing references it" and let a
destructive edit through — a silent failure biased toward data loss. Enforcement
belongs in the API mutators, beside the audit records.

---

## 3. Country/city pricing: entered, inherited, derived, refused

**Entered** — one number per country, on the row. A freebie enters no money at all.

**Inherited** — a city row inherits every field it does not set.

**Derived, never stored** — currency and minor units (`MONEY[country]`), savings,
granted value, drift %, price source, serviceable cities, VAT and Zoho routing.

**Refused** — see §4.

### City rows are deliberate, never demanded

**No gap ever asks for a city row.** The UI renders one row per override that actually
exists, never one per city. Rendering the full grid is precisely how the legacy
`package_cities` table reached **698 rows** nobody maintained.

### City serviceability is derived — and honest about what it cannot know

The pricing design proposed deriving city sellability from "does every required member
resolve a price at that city". That evaluates to **constant true**: every price lookup
in this codebase falls back city → country (`cityPrices?.find(...) ?? r.price`,
`servicePrice`, `planPrice` all do it), so the promised "blocked cities" column could
never have rendered a row.

The only place city serviceability actually lives is Diagnostics `slotMappings`
(`cityId` + `isActive` + `slotGroupId`). Variants carry `warehouse`/`warehouseStock`
per **country**; plans have no city record at all. So `memberCityCoverage` returns a
tri-state — `covered` / `not_serviceable` / `unknown_country_granular` — and the third
value is the honest answer for a cross-department combo: the departments are not
comparable at city granularity, and only Diagnostics knows. It is shown as
**information**, never a gap, because a combo unavailable in one city is still sellable
in the country.

The real case this catches: a home blood draw with `isActive: false` in Al Ain still
resolves the *country* price, so the combo looked sellable there at the bundle price
and the customer would book a draw nobody can fulfil.

### Staleness is visible

There is no notification model in this codebase and one should not be invented. What
ships is **one** signal:

1. **A per-market drift chip.** `basisSubtotal` + `setAt` record what the members cost
   when the price was confirmed — past state, not recoverable from present data.

`compositionsReferencing(ref)` — "3 combos price off this unit" shown to whoever is
editing a member's price — is **implemented but not yet wired** into the three price
editors (variant `regionalData`, `DiagnosticsPackageFields`, `TreatmentPlans`). Until it
is, the drift chip is the only staleness signal, and it is only seen by someone who
opens the composition.

`basisMemberIds` is stored alongside, because **`memberSubtotal` moves with membership,
not only with member prices**. Add one optional member and a subtotal-only baseline
reads +40% drift, with the operator unable to separate a price rise from a membership
change — a false positive in the only instrument there is. With membership recorded,
the chip says *"membership changed — re-confirm"* instead of a fabricated percentage.

A row with no baseline says **"baseline unknown — re-confirm the price to arm drift"**,
never "0% drift". Every seeded and migrated row starts this way; that cold start is
honest.

---

## 4. What is refused rather than guessed

**One bundle price cannot carry a cross-department combo's tax or routing.** VAT and
Zoho books live on (sub-department × country × clinical class), never on the
composition. The flagship seed spans three sub-departments; in KSA its members invoice
from **two different legal entities** (`ksa_vhit` and `saha`), and in UAE a GLP-1
override re-rates one member to zero against a 5% default.

**`allocateBundle` was deliberately not built.** Its own design document blocks it:
*"Is an operator-entered bundle price VAT-net or VAT-gross? `allocateBundle` is
undefined until this is settled"*, and *"Can Zoho issue one invoice with lines routed
to two different `zohoBook` entities? If not, cross-book combos need a merchandising
policy, not a pricing field."* Building the split would mean inventing finance policy
and hardcoding it. What ships instead is the set of refusals that hold regardless of
how finance rules:

| Condition | Outcome |
|---|---|
| Member's sub-department has `countryConfig` but omits this country | **Gap** — no invoicing entity for that market |
| Members disagree on `vatMode` under one bundle price | **Gap** — one number cannot mean both gross and net |
| Members invoice from 2+ Zoho entities and no split basis is declared | **Gap** — declare the basis |
| `invoicingEnabled: false` (Qatar) | **Note** — "priced, no invoice issued". Never blocks the sale |
| Sub-department has **no** `countryConfig` at all | **Note** — not configured yet. Never blocks |

That last distinction is load-bearing: "never configured" is not "deliberately
excluded", and conflating them would have bricked publishing on six of eight seeded
sub-departments.

### Open questions for finance (verbatim, unresolved)

1. Is an operator-entered bundle price VAT-net or VAT-gross?
   `SubDepartmentCountryConfig.vatMode` and `CatalogCountryConfig.isVatExcluded` are
   two sources that can disagree for the same sale.
2. When members disagree on `vatMode`, is the bundle refused (current behaviour) or
   does the composition declare one authoritative mode?
3. Which entity owns a combo's own invoice — the primary member's sub-department, or
   per-member allocation with no composition-level entity?
4. Can Zoho issue one invoice with lines routed to two `zohoBook` entities? If not,
   cross-book combos need a merchandising policy, not a pricing field.

---

## 5. Defects fixed along the way

Found by the design attack or by the verification script — not by `tsc`, which was
clean throughout.

| # | Defect | Consequence |
|---|---|---|
| 1 | `Math.round(x * 100) / 100` at four sites | **KWD has three decimals.** Every Kuwait total was rounded to the wrong money |
| 2 | `unitPrice` never read `Listing.status` | An **archived** listing kept pricing inside a live combo, with no signal anywhere — retirement is deactivation, so this was the "nothing deletes" blind spot |
| 3 | Absent `countryConfig` treated as "sold nowhere" | A variant with live, available UAE/KSA prices (`p1`, Vitamin D3) was **invisible to every combo** |
| 4 | `grant_free` deducted `gp`, not `gp × quantity` | A freebie granting 2 units **charged for one of them** |
| 5 | `grant_free` honoured `member.required` | An optional granted member dropped out, `?? 0` deducted nothing, `total === memberSubtotal` — the storefront advertised a gift that was **never given**, silently |
| 6 | Sleep Reset Combo priced at 999 against a 993.10 subtotal | A "combo" that **cost more than buying the parts**. Masked by #3 |
| 7 | One string for three states | "not sellable in UAE" meant blocked / no price / not sold. Now three distinct readouts |
| 8 | `unitLabel` fell through to the parent listing name | A **deleted unit read as a healthy member** |
| 9 | Duplicate scope keys | Served whichever row `.find` hit first |
| 10 | City rows unreachable from the UI | Dead field in the type |

### Rejected: a gap that would have bricked every add-on

The pricing design proposed gapping any composition where `total >= memberSubtotal`.
For `member_sum` the resolver sets `total = memberSubtotal` **by definition** — it is
the rule's shipped label, "Sum of members, no discount" — and `member_sum` is the
add-on default. The condition is identically true, and the status control disables
`active` whenever a gap exists, so **no add-on could ever be published again**. The
inversion gap is scoped to `bundle_price` only, and this is asserted in the tests.

---

## 6. Deliberately out of scope

- **`removeVariant` hard-splices a variant out of the array**, orphaning its SKU,
  `zohoId`, subscription plans and order history, and `VariantStatus` has no
  `archived`. Real, and the actual data-loss path — but it is a listing-editor change,
  not a combo change.
- **`servicePrice` / `planPrice` use `{...base, ...city}`**, so an explicitly-undefined
  city key becomes a real override. Fixing it reprices live Diagnostics and Treatments
  listings; the composition's own merge is correct.
- **Flash sale stage 3.** `resolveComposition` now *accepts* `{cityId, at, sales}` so
  the module header stops promising something the signature could not express, but sale
  resolution is not retro-fitted — the flash-sale rework owns it. The live collision to
  regression-test: the seeded sale covers `l-blood` + `l-mini-vitd`, exactly the
  add-on attach pair, so an add-on would render at full price on a page where the same
  unit is AED 100 cheaper standalone.
- **`sd-treatments-iv-therapy` and `sd-consultations-clinical`** were referenced by
  live listings and never defined, so every combo containing an IV plan or a
  consultation had no resolvable invoicing entity. Both are now seeded, with VAT and
  book values mirroring the clinical-services pattern and **pending finance
  confirmation**.
