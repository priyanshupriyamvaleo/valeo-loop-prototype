# Valeo Catalogue & CMS — Access Control Plan

**Status:** Proposal for review · **Scope:** internal admin (replaces NIMDA's catalogue module) · **Companion to:** the "Valeo Catalogue & CMS Rebuild" brief

This is a written specification only. Nothing in it is built; where it names a screen it describes the screen. It defines *who may do what, where, and who must agree first* for the new catalogue CMS across UAE, KSA, Qatar and Kuwait, two legal entities (Shifa, Valeo DMCC), two surfaces (App, Web), and English + Arabic.

**Design stance, applied throughout:**

- **RBAC with explicit scopes.** A fixed catalogue of roles; every grant is `role × scope`. No attribute-rule engine — rules-on-rules become unauditable.
- **Deny by default.** No permission exists unless a grant names it. No implicit inheritance except the one taxonomy containment rule in §2.4.
- **No per-user special cases.** If a person needs something, it becomes a role or a scoped template.
- **Everything gated writes to the audit log**: actor, target, before/after, timestamp, and the grant that authorised it.
- **Nothing bypasses the Rx gate or the required-language gate** — including Super Admin — without a logged, named override (§5.6).
- **Read-only must be safe to hand out widely** (Analyst, §3).

> **Flag to the team — owner cardinality.** The brief contradicts itself: the entity diagram marks Owner ↔ Listing as **M:M** ("credit stamped at sale, so nobody clones a listing to own it"), while the problem statement requires "**one clear owner**" per listing. This plan treats a listing as having **exactly one owner (M:1)** — accountability collapses the moment two people own a record — and treats *sale-time credit attribution* as a separate, order-side concern that reads a `credited_to` stamp on the order line, not a second owner on the listing. Confirm this reading (Open question Q1).

---

## 1. Permission primitives

### 1.1 Actions

| Action | Meaning |
|---|---|
| `view` | Read the record, including drafts within scope |
| `create` / `edit` / `clone` / `archive` | Author lifecycle. Archive replaces delete — nothing in the CMS deletes |
| `submit-for-review` | Move draft → in-review |
| `approve` | Clear a gate one is the named approver for |
| `publish` / `unpublish` | Move to/from live, **only after every applicable gate has passed** |
| `set-price` / `set-discount` | Commercial values. Distinct from `edit` so copy-editing never implies pricing |
| `translate` | Author the non-source locale of a record |
| `place-in-category` / `set-primary` | Merchandising placement; exactly one Primary per listing |
| `assign-owner` | Change a listing's single owner |
| `attach-provider` | Bind a provider pool to a listing/feature |
| `bulk-import` / `export` | Batch data in/out |
| `manage-access` | Create grants, templates, API keys; the most dangerous verb in the system |
| `view-audit` | Read the audit log (shows actors — deliberately not part of Analyst read-only) |

### 1.2 Resource × action grid

Cells list the actions that exist for that resource; anything not listed cannot be granted for it (deny by default).

| Resource | Read | Author | Review & release | Commercial | Placement & assignment | Language & data | Govern |
|---|---|---|---|---|---|---|---|
| Listing | view | create · edit · clone · archive | submit · approve · publish · unpublish | — (via Price/Discount) | place-in-category · set-primary · assign-owner · attach-provider | translate · export | — |
| Bundle / Program | view | create · edit · clone · archive | submit · approve · publish · unpublish | — (via Price) | place-in-category · set-primary · assign-owner | translate · export | — |
| Variant | view | create · edit · clone · archive | submit · approve | — (via Price) | — | translate · export | — |
| Price | view | edit | approve (price gate) | set-price | — | bulk-import · export | — |
| Discount / Promo | view | create · edit · archive | submit · approve (discount gate) | set-discount | — | export | — |
| Translation | view | edit | submit · approve (language gate) | — | — | translate · bulk-import · export | — |
| Media | view | create · edit · archive | — | — | — | bulk-import | — |
| Category tree | view | create · edit · archive | submit · approve (taxonomy gate) | — | — | export | — |
| Department / Sub-department taxonomy | view | create · edit · archive | submit · approve (taxonomy gate) | — | — | export | — |
| Attribute definitions | view | create · edit · archive | submit · approve (taxonomy gate) | — | — | export | — |
| Journey | view | create · edit · archive | submit · approve · publish · unpublish | — | place-in-category | translate · export | — |
| Owner assignment | view | — | — | — | assign-owner | export | — |
| Provider pool | view | create · edit · archive | — | — | attach-provider | export | — |
| Market / country config | view | edit | approve (new-market gate) | — | — | export | — |
| SEO fields | view | edit | submit · approve (slug change on live) | — | — | translate · export | — |
| Custom (ad-hoc) order | view | create | approve (above threshold) | — | — | export | — |
| Wallet credit | view | create (request) | approve (above threshold) | — | — | export | — |
| Legacy-ID map & ERP mappings | view | edit | approve (Finance) | — | — | bulk-import · export | — |
| Bulk import / export | — | — | approve (import to live) | — | — | bulk-import · export | — |
| API keys & webhooks | view | create · edit · archive | — | — | — | — | manage-access |
| Roles & permissions | view | — (role catalogue is fixed; changes are releases) | — | — | — | export | manage-access |
| Audit log | — | — (append-only, immutable) | — | — | — | export | view-audit |

**Invariants the grid encodes:**
1. `publish` exists only on Listing, Bundle/Program and Journey — the three things a customer can encounter. Everything else changes state through the record it belongs to.
2. Price and Discount are separate resources so "can price" and "can discount" are separable grants — base price is a Pricing decision, a promo is a Merchandising decision, and each approves the other's boundary (§5).
3. The audit log is append-only for everyone, including Super Admin.
4. `manage-access` appears on exactly two rows. Any design where it appears on more is a mistake.

---

## 2. Scoping model

### 2.1 Scope dimensions

A grant is `role × scope`, where scope is a tuple:

| Dimension | Values | Notes |
|---|---|---|
| Market | UAE, KSA, Qatar, Kuwait, `ALL` | The primary blast-radius bound. New markets are added in Market config, and existing grants do **not** extend to them automatically (see 2.3) |
| Legal entity | Shifa, Valeo DMCC, `ALL` | Matters chiefly to Finance/ERP and Pricing; derived on listings from market × product type routing |
| Department / Sub-department | one or more nodes, or `ALL` | The only dimension with inheritance (2.4) |
| Journey | one or more journeys, or `ALL` | For journey-bound curation roles |
| Locale | en, ar, or `ALL` | Bounds `translate` and content editing per language |
| Environment | draft, live, or `ALL` | `draft` = author and stage; `live` = actions whose effect a customer can see (publish, unpublish, price on live, slug on live) |

**Not a scope dimension:** surface (`visible_on: App/Web`). It is a field on the listing, editable by whoever can edit the listing. One entry serves both surfaces by design; scoping by surface would recreate the double-entry problem the rebuild exists to kill.

### 2.2 Composition

- **Within one grant, dimensions intersect.** "Category Manager × (Diagnostics, UAE+KSA)" means Diagnostics **and** in UAE/KSA — not Diagnostics anywhere plus everything in UAE.
- **Across grants, permissions union.** Two grants give the union of what each allows. The effective-permissions inspector (§6.9) must show *which* grant produced any given allowance.
- **Deny by default beats everything.** There are no negative/deny grants to reason about; absence of a grant is the deny.

### 2.3 Unscoped grants

There is no such thing as an implicitly unscoped grant. `ALL` on a dimension is an explicit, deliberately loud value that appears highlighted in the Members screen and in audit entries. `ALL` on Market means "all markets **existing today**" resolved at grant time is **wrong** — it means all markets *including future ones*, which is why granting it requires Catalogue Admin approval and why templates for humans should almost always enumerate markets instead.

### 2.4 Inheritance

Exactly one containment rule: **Department → Sub-department → Listing.** A grant scoped to a department covers its sub-departments and their listings; scoped to a sub-department, its listings. Nothing else inherits:

- **Category placement conveys no scope.** Categories are *where a listing shows up*, not *what it is* — a Merchandiser with category rights gains no edit rights over listings placed there.
- **Journeys convey no scope** over the listings they reference.
- New sub-departments created inside a department **are** covered by existing department-level grants (that is what containment means) — which is one reason creating a sub-department is gated (§5.4).

### 2.5 Environment

`draft` scope is where nearly everyone lives. `live` scope is required for: publish/unpublish, price changes affecting a live listing, slug changes on a live listing, unarchiving into live, bulk-import targeting live. This split is what makes it safe to give editors broad authoring room without giving them a path to production.

---

## 3. Role catalogue

Roles are a fixed catalogue. Changing a role's permission set is a versioned release by Engineering + Super Admin, not a runtime edit.

| Role | Purpose (one line) | Permission set (grid shorthand) | Default scope | Explicitly cannot |
|---|---|---|---|---|
| **Super Admin** | Custodian of access control and last-resort override | All resources: view; Roles & permissions + API keys: manage-access; view-audit; break-glass (§5.6) | ALL | Silently bypass Rx or language gates; approve their own taxonomy proposal; edit audit log |
| **Catalogue Admin** | Owns the structure — taxonomy, attributes, markets, owners | Taxonomy/Category/Attributes: author + approve; Market config: edit + approve; Listing: view, assign-owner, publish; Journey: author + publish; view-audit | ALL markets, ALL departments | manage-access; approve Rx gate; edit ERP mappings; set-price |
| **Category Manager** | The listing owner — accountable for a patch of the catalogue | Listing/Bundle/Variant: author + submit + publish (gates permitting); place-in-category; set-primary; attach-provider; Price: propose (edit draft); Media: author; export | Their department(s) × market(s), draft+live | Approve any gate on their own listing; taxonomy; set-discount; assign-owner; translate approval |
| **Content Editor** | Writes marketing copy, media, FAQ | Listing (field-restricted, §5.5): edit copy/media/SEO-copy; Media: author; submit-for-review | Department(s) × market(s), draft only | Price, discount, medicine fields, placement, publish, slug on live |
| **Translator** | Authors and signs off the Arabic (or other locale) side | Translation: translate + submit + approve (language gate for their locale); view source | locale=ar, ALL departments, draft | Edit source-locale content; publish; anything commercial |
| **Pricing & Revenue** | Owns base prices and the price gate | Price: set-price + approve; Discount: approve; ERP mappings: view; export | Market(s) × entity, draft+live | Edit content; taxonomy; publish; manage discounts of their own creation (no self-approval) |
| **Merchandiser / Campaigns** | Runs placement, promos, journeys, sale events | Discount/Promo: author + set-discount + submit; Category tree: place-in-category, set-primary; Journey: author + submit; Media: author | Market(s), ALL departments, draft+live for placement | Set base price; edit clinical/medicine fields; taxonomy nodes; publish medicine listings |
| **Clinical & Pharmacy Approver** | The regulated-content gatekeeper | Medicine-flagged Listings: view + edit *only* medicine_type, is_controlled_substance, Rx flag, clinical-claims fields; approve (Rx gate) | Market(s) — regulator regimes differ (MOHAP/DHA/DoH vs SFDA vs MOPH) | Author marketing copy; price; publish; anything outside medicine-flagged records |
| **Ops / Fulfilment** | Keeps the service deliverable | Provider pool: author; attach-provider; Market config: view; Listing: view; export | ALL markets, service departments | Edit content/price; publish; taxonomy |
| **Finance / ERP** | Entity routing, ERP truth, money-adjacent approvals | ERP mappings: edit + approve; Legacy-ID map: view; Wallet credit: approve; Custom order: approve above threshold; Price: view; export | Entity × market | Edit catalogue content; publish; manage-access |
| **Partnerships** | Partner-facing catalogue slice | Listing: view (incl. partner-exclusive); partner price lists: view + export; Custom order: create | Partner-relevant departments × markets | Edit anything; publish; see cost/margin fields |
| **SEO** | Slugs, meta, canonicals, sitemap hygiene | SEO fields: edit + submit; slug-on-live: submit (approval: Catalogue Admin); Listing: view | ALL markets, draft (+submit to live) | Content outside SEO fields; price; publish; taxonomy |
| **Analyst (read-only)** | Safe, wide visibility | view on catalogue resources; export (catalogue data only, no cost/margin, no audit) | ALL markets, live + draft | Any write; view-audit; API keys; wallet/custom-order |
| **Support / CS** | Resolve customer situations | Listing: view (live); Custom order: create; Wallet credit: create (request) | Market(s), live | Edit catalogue; approve own wallet/credit request; view drafts |
| **Engineering / Integrations** | Pipes, keys, migrations | API keys & webhooks: manage-access; Legacy-ID map: edit; Bulk import: into draft; view-audit; export | ALL, draft | Approve business gates; author content in live; set-price |

### 3.1 Roles to merge, split, or watch

- **Translator should be a template, not a role.** It is Content Editor ∩ (locale=ar) plus language-gate approval. Keeping it a separate role is defensible only because the language gate needs a *named approver class* — recommendation: keep the role, but implement it as the same underlying permission set with the locale lock and gate-approver bit (avoids drift between two "editor" roles).
- **Wallet credit and Custom order sit oddly in a catalogue CMS.** They are order-platform resources. This plan includes them only as approval hooks (Support requests, Finance approves). If the order platform has its own admin, move both there and delete the rows here — flagging rather than deciding (Open question Q6).
- **SEO could fold into Content Editor** with a field policy, *unless* SEO is an external agency — then it must stay separate so agency scope is one template. Keep separate for now.
- **Do not split Category Manager into "author" and "publisher".** The owner publishing their own listing (after independent gates) is the accountability model; splitting it recreates NIMDA's everyone-waits-for-someone bottleneck. The gates, not a second human, are the control.

---

## 4. Team templates

A template = **role(s) + scope + field policies**, versioned, assignable in one step. Onboarding is one decision ("she's Category Management — Diagnostics, UAE+KSA"), not a hand-assembled grant set.

| Template (examples) | Bundles | Locked | Overridable per member |
|---|---|---|---|
| Category Management — Diagnostics, UAE+KSA | Category Manager × (Diagnostics; UAE, KSA; draft+live) | Role, gate rules, department | Narrow to one market; narrow to sub-departments; add expiry |
| Content & Translation — Arabic, all markets | Content Editor + Translator × (locale=ar; ALL markets; draft) | Locale, draft-only | Narrow markets/departments |
| Pricing — KSA | Pricing & Revenue × (KSA; entity per routing; draft+live) | Role, market-entity pairing | Narrow to departments |
| Clinical Approver — UAE | Clinical & Pharmacy Approver × (UAE) | Everything (regulator-facing) | Nothing but expiry |
| Merchandising — All markets | Merchandiser × (ALL markets; draft+live placement) | Role | Narrow markets; exclude medicine departments (default: excluded) |
| Ops — Provider pools | Ops/Fulfilment × (ALL markets) | Role | Narrow to service departments |
| Partner — read-only price list | Partnerships-restricted view + export of the partner's own price list only | Everything; watermarked export | Expiry only (mandatory, max 12 months) |
| Analyst | Analyst × ALL | Everything | Nothing |

**Rules:**

- **Override may only narrow, never widen.** The template is a ceiling. Widening means a different template or a new template version — never a per-member exception (that is the "no per-user special cases" constraint doing its job).
- **Members stay linked to the template.** A template change creates a new version:
  - **Narrowing** (fewer markets, tighter fields) applies to all linked members immediately, with an audit entry per member.
  - **Widening** requires a Catalogue Admin to confirm the member list before it takes effect — silent privilege escalation across a team is the failure mode this exists to prevent.
- A member manually detached from their template is flagged **"template drift"** on the Members screen and in access reviews; drift should trend to zero.

---

## 5. Approval & gate design

### 5.1 Lifecycle mapped to permissions

`draft → in-review → approved → live`, with `unpublish` and `archive` off to the side. `edit` works in draft; `submit-for-review` freezes a version for gates; `approve` is per-gate (below); `publish` is possible only when every gate applicable to *that listing in that market* shows green, and is executed by someone holding `publish` in scope (normally the owner). Publishing is per-market: live in UAE and draft in KSA is a normal state.

### 5.2 The gates

| Gate | Fires when | Requested by | Must be approved by | Self-approval | Per-market |
|---|---|---|---|---|---|
| **Required-language** | First publish (and re-publish after source-copy change) with EN or AR incomplete | Owner / Content Editor via submit | Translator (locale approver) for the missing locale | **Never** — author of the translation cannot approve it | Yes — a market can go live only when both locales pass for that market |
| **Rx / controlled substance** | Publish of any medicine-flagged listing; any change to medicine_type, is_controlled_substance, Rx flag, or clinical-claims fields (draft or live) | Owner | Clinical & Pharmacy Approver scoped to that market | **Never**, no exceptions, no Super Admin bypass without §5.6 | Yes — MOHAP/DHA/DoH ≠ SFDA ≠ MOPH |
| **Price change** | set-price on a live listing, or draft price beyond ±X% of current (threshold: Open question Q3) | Category Manager / Pricing | A *second* Pricing & Revenue member (or Finance where entity routing changes) | Never for the requester | Yes — prices are per market |
| **Discount** | set-discount / promo activation | Merchandiser | Pricing & Revenue (checks floor/margin) | Never | Yes |
| **Taxonomy change** | create/rename/merge/archive of sub-department, category, or attribute definition | Catalogue Admin (or CM proposal) | A **second** Catalogue Admin or Super Admin | Never — structure is the thing the rebuild protects | No — taxonomy is global |
| **First publish in a new market** | First listing to go live in a market | Owner | Catalogue Admin **and** market config completeness check (VAT, entity routing, locale readiness) | Never | By definition |
| **Bulk import to live** | Any import targeting live records | Engineering / Catalogue Admin | Catalogue Admin (and Pricing if price columns present) | Never | Per import batch |

### 5.3 Who publishes

The **owner publishes** their own listing once gates pass. Gates are independent hands (translator, pharmacist, second pricer); the publish click is accountability, not a control point.

### 5.4 Why taxonomy is a gate and not an edit

A new sub-department instantly falls inside every department-scoped grant (§2.4) and reshapes reporting. It is a structural act with permission side-effects — hence two named structural approvers, never one.

### 5.5 Field-level restriction

Role-level is too coarse exactly where the brief says it is. Field policies attach to templates:

| Field group | May edit | Change must be approved by |
|---|---|---|
| Marketing copy, FAQ, media, benefit content | Content Editor, Category Manager | Language gate only |
| price, compare-at, floor | Pricing (CMs may draft) | Price gate |
| discounts / promo windows | Merchandiser | Discount gate |
| medicine_type, is_controlled_substance, Rx flag, clinical claims | Clinical & Pharmacy Approver **only** | Rx gate (second clinical approver where market requires) |
| slug, canonical (on live) | SEO | Catalogue Admin (redirect integrity) |
| owner | Catalogue Admin | — (audited) |
| visible_on, category placement, primary | Category Manager / Merchandiser | — (audited) |
| ERP mapping, entity routing | Finance | Finance second pair of eyes above materiality threshold |

### 5.6 Break-glass override

Two named custodians (Super Admins). Invoking break-glass: requires a typed reason, is time-boxed (60 minutes), banners the UI for all admins while active, writes `override_event` audit entries naming the person for every action taken, and auto-schedules a post-hoc review with the gate's normal approver. This is the **only** path over the Rx and language gates, and it cannot be silent by construction.

---

## 6. Where everything is set — screen inventory

All under **Settings → Access Control** unless noted. "States" = empty / normal / attention states the screen must represent.

| # | Screen | Path | Purpose | Who can open | Key fields & controls | States |
|---|---|---|---|---|---|---|
| 6.1 | Members | `/settings/access/members` | Every human + their template, scope, expiry, last-active | Super Admin (manage); Catalogue Admin (view) | Search; member rows (name, template@version, scope summary, expiry, drift flag); invite; deactivate | Normal; **drift** rows highlighted; pending-invite; deactivated (greyed, listings-owned count shown) |
| 6.2 | Member detail | `/settings/access/members/{id}` | One person's grants and history | As above | Template link/detach; scope narrowing controls; expiry; per-member audit trail; "inspect as" shortcut to 6.9 | Linked / detached(drift) / expiring-soon / deactivated-pending-reassignment |
| 6.3 | Roles | `/settings/access/roles` | Read-only catalogue of roles and their grids | Any admin role; Analyst can view | Role list → resource×action matrix view; version history of the catalogue | Read-only always; "change requested" banner when a role release is pending |
| 6.4 | Team templates | `/settings/access/templates` | Create/version templates | Super Admin (edit); Catalogue Admin (propose) | Role picker; scope pickers per dimension; field-policy attach; member count; version diff view; publish-version button (widening triggers confirm-members flow) | Draft version / active / superseded; widening-pending-confirmation |
| 6.5 | Approval policies | `/settings/access/approvals` | The gate table (§5.2) as configuration | Super Admin; Clinical rows visible to Clinical Approver | Per gate: trigger, approver role, quorum, per-market toggles, price threshold value | Active; **misconfigured** (gate with no eligible approver in a market — blocks publish in that market and says so) |
| 6.6 | API keys & webhooks | `/settings/access/api-keys` | Machine access | Engineering + Super Admin | Key list (scope-bound like grants, mandatory expiry, last-used); create/rotate/revoke; webhook endpoints + signing secrets | Active / expiring / revoked; never displays a secret twice |
| 6.7 | Audit log | `/settings/access/audit` | Immutable record of every permission change and gated approval | Super Admin, Catalogue Admin, Engineering (view-audit) | Filters: actor, resource, action, market, date; before/after diff pane; export | Append-only; export-in-progress |
| 6.8 | Request-access queue | `/settings/access/requests` | Walls become tickets, not Slack DMs | Approvers see their queue; requesters see their own | Request rows (who, what action, on what, in which scope — prefilled from the 403 that spawned it); approve-as-template-narrowing / deny with reason; TTL auto-expiry | Open / approved / denied / expired |
| 6.9 | Effective-permissions inspector | `/settings/access/inspect` | Pick a user and an object → what can they do and **which grant/template/gate says so** | Super Admin, Catalogue Admin | User picker; object picker (listing/category/market); resulting action list with provenance chain per action; "why not?" for denied actions naming the missing grant or failing gate | Requirement, not built: must resolve in one screen with zero manual grant-tracing |
| 6.10 | Listing → Owner & access panel | on the listing editor | The object-side controls | Owner + Catalogue Admin | Owner field (change = assign-owner, audited); gate status checklist per market (language ✓/✗, Rx ✓/✗/n-a, price ✓); "request access" shortcut for viewers | Gates green / blocked-by-gate (named) / override-active (banner) |
| 6.11 | Market config → publish gate | `/settings/markets/{market}` | Market readiness + first-publish gate | Catalogue Admin | VAT, entity routing, locales required, gate approver assignments for this market; "market open for publishing" switch (requires 5.2 first-publish gate) | Draft market / open / **no-clinical-approver-assigned** blocker |

### 6.12 Flows (written spec)

- **Invite/onboarding.** Admin picks a template (mandatory — no template-less invites), optional narrowing + expiry → email invite → on first login the grant activates. When SSO/SCIM arrives, IdP groups map to templates 1:1 and the invite step collapses to group membership; the model must not care which path created the member.
- **Offboarding/revocation.** Deactivation is immediate and single-click; it revokes sessions and API keys created by the member. The screen **forces reassignment of owned listings** before completion — a listing must never be ownerless. All open approvals requested by the member are re-routed. Audit entry per artefact touched.
- **Request-access.** Every 403 in the CMS renders "request access", pre-filled with resource, action and scope. Requests land in 6.8 with the *narrowest template satisfying the request* suggested. Approval creates a scoped, optionally temporary grant; nothing is granted by chat.
- **Temporary/delegated access.** Any grant can carry an expiry; delegation is "grant my template to X until date" and requires the template's normal approver (covering leave, launches, agencies). Expiry auto-revokes with an audit entry — no cleanup memory required.
- **Break-glass.** As §5.6; reachable only from 6.1 by the two custodians.

---

## 7. Implementation notes

### 7.1 Conceptual data model (no DDL)

- `user` (identity; later mirrored by SCIM)
- `role` — static catalogue shipped with code; versioned as releases
- `grant` — user × role × scope tuple (market[], entity[], dept/sub-dept[], journey[], locale[], environment) + template ref + expiry + created_by
- `template` / `template_version` — role set, scope, field policies; member links carry the version
- `field_policy` — role/template × resource × field-group → editable? approver?
- `approval_policy` — gate type × trigger × approver role × quorum × per-market flag × threshold
- `approval_request` — state machine (open → approved/denied/expired), version-frozen payload, decisions with actors
- `override_event` — break-glass sessions and every action inside one
- `audit_event` — actor, action, target, before/after, timestamp, **grant_id used** (provenance is what makes the inspector cheap)
- `api_key` — scope-bound like a grant, mandatory expiry
- On the listing itself: `owner_id` (exactly one), denormalised scope fields (markets, dept, sub-dept) so authorisation checks are index lookups, and per-market gate status.

**Enforcement point:** one authorisation service at the API layer. The UI only *reflects* permissions (hiding buttons is UX, not security), and the publish pipeline re-checks every gate server-side at publish time.

### 7.2 Sequencing against the migration

Access control depends on two migration outputs: **clean taxonomy** (scopes point at departments) and **owner per listing** (Step 2 of the rebuild assigns both). Therefore:

1. **Before content entry starts** — audit log + deny-by-default middleware + Super Admin/Engineering roles. History must be complete from the first record, not from launch.
2. **At catalogue build (Phase 1)** — role catalogue, grants, scoping, owner field, the Rx + language + price gates, Members/Audit screens (6.1, 6.2, 6.7, 6.10). This is the minimum that honours the brief's "structure cannot be dirtied" premise.
3. **Phase 2** — templates (6.4), approval-policies screen (6.5), request-access (6.8), inspector (6.9), temporary access, taxonomy + new-market + bulk-import gates as config rather than code.
4. **Phase 3** — SSO + SCIM (IdP groups ↔ templates), partner/agency external templates, API keys self-service (6.6 full), access-review reports (drift, dormant grants, expiring).

Phase 1 can hard-code the gate table; §5.2 is deliberately small enough to ship as code first and config later.

---

## Ambiguities in the brief that block clean access control

1. **Owner cardinality** — diagram M:M vs governance "one clear owner". Resolved here as M:1 + order-side credit attribution; needs sign-off.
2. **Journey containment** — "everything sits under a Journey (Direct = default)" reads as structural, but journeys behave like merchandising objects. If journeys are containers, they need scope semantics; this plan deliberately gives them none. Who owns the Direct journey?
3. **Bundle/Program shape** — "a Program is sold as a Bundle (parent + child)" is not defined enough to say whether bundle rows need their own owner or inherit the parent listing's. Assumed: inherit parent's owner.
4. **Custom order & wallet credit boundary** — order-platform resources appearing in a catalogue CMS. Included as approval hooks only.
5. **Legal-entity routing** — which markets/product types invoice through Shifa vs Valeo DMCC is not in the brief; Pricing/Finance scopes reference entities they cannot yet be bound to.
6. **Provider pool ownership** — "a Feature picks the pool" doesn't say who curates pools (Ops here) vs who attaches them (owner here).
7. **Category contention** — placement is M:M across departments; when two Category Managers dispute a shared category's Primary or ordering, the brief names no arbiter. Assumed: Merchandiser owns cross-department category composition.

## Assumptions made

1. A listing has exactly one owner; credit attribution is order-side (per the note in the task).
2. `visible_on` (App/Web) is a field, not a scope dimension.
3. Four markets and two legal entities at launch; more markets planned, entities stable.
4. English is the source locale; Arabic is the gated second locale (per market).
5. Medicine listings exist only in the products department plus `is_medicine`-flagged treatments — the Rx gate keys off those flags, not off department membership.
6. 15–40 internal users; queue volumes are small enough that single-approver gates (plus quorum only on taxonomy) don't bottleneck.
7. Draft content is not confidential *within* the company: any internal role with `view` in scope can see drafts (Support excepted).
8. The audit log is retained indefinitely within the CMS (subject to Q9).

## Open questions for the team

1. Confirm owner = exactly one per listing, with sale credit handled order-side? (yes/no)
2. Do Qatar and Kuwait sell medicine at launch — i.e. do we need a named clinical approver per each of the four markets on day one? (yes/no)
3. Price-change approval threshold: what % deviation on a live price triggers the gate? (single value)
4. May a Category Manager activate a discount within a pre-approved band without the discount gate? (yes/no; if yes, band value)
5. Is Arabic translation done in-house or by an agency (drives Translator-as-template vs external template)? (in-house/agency)
6. Do custom orders and wallet credits stay in this CMS or move to the order platform's admin? (stay/move)
7. Who are the two break-glass custodians? (two names)
8. Which IdP will SSO use, and is SCIM available on our plan? (single value)
9. Audit retention: indefinite, or a fixed number of years? (single value)
10. Do partners get phase-2 access, or is partner access post-launch entirely? (phase-2/later)
11. Is preview (draft on App/Web) a third environment needing its own scope value, or part of `draft`? (own/part-of-draft)
12. Does Finance require write access to the legacy-ID map, or is that Engineering-only with Finance read? (write/read)
