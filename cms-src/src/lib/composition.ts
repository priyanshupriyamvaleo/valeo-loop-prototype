import {
    Composition, CompositionMember, CompositionScope, Country, Listing, MedicineClass,
    PricedUnitRef, ProductStatus, SubDepartment, VisibleOn, ZohoBook,
} from "@/types"
import { servicePrice, finalServicePrice, effectiveSlot } from "@/lib/diagnostics"
import { planPrice, finalPlanPrice } from "@/lib/treatments"

/**
 * Price resolution. Stages 0–4 are a pure function of (unit, country, city) and
 * are cacheable; anything cart-shaped (coupons, thresholds, how many freebies have
 * already been granted) happens after and is not. The order is fixed and written
 * down so two features can never disagree about which discount applied first.
 *
 *   0. availability gate — a unit that fails has NO price, rather than a hidden one
 *   1. base price in the unit's own home (variant / service option / plan)
 *   2. the unit's own stored discount (already lives beside the price)
 *   3. flash sale (resolved elsewhere; passed in, never recomputed here)
 *   4. composition rule (bundle / percent / sum / grant-free)
 *
 * Three things this module deliberately does NOT do:
 *   · split one bundle price across Zoho entities — see subDeptRouting(); the basis
 *     is a finance policy, so a cross-book bundle is REFUSED, never guessed
 *   · decide city serviceability — it is derived from the members, never entered
 *   · count grants issued — that is order state
 */

export const COMPOSITION_KINDS: {
    id: Composition["kind"]; label: string; blurb: string; defaultRule: Composition["rule"]["kind"]
}[] = [
        { id: "combo", label: "Combo", blurb: "Several priced units sold together, on their own page.", defaultRule: "bundle_price" },
        { id: "program", label: "Program", blurb: "A scheduled course of deliverables sold as one commitment.", defaultRule: "bundle_price" },
        { id: "addon", label: "Add-on", blurb: "Offered on a parent's page; the customer opts in.", defaultRule: "member_sum" },
        { id: "freebie", label: "Freebie", blurb: "A real unit granted at zero with the parent.", defaultRule: "grant_free" },
    ]

export const RULE_LABELS: Record<Composition["rule"]["kind"], string> = {
    bundle_price: "One bundle price per country",
    percent_off_members: "Percent off the member subtotal",
    member_sum: "Sum of members, no discount",
    grant_free: "Grant one member free",
}

/** Which scope-row fields a rule actually reads. Anything else on the row is rot. */
export const RULE_ROW_FIELDS: Record<Composition["rule"]["kind"], ("price" | "percent")[]> = {
    bundle_price: ["price"],
    percent_off_members: ["percent"],
    member_sum: [],
    grant_free: [],
}

/**
 * Currency is a pure function of Country and must never become an entered field.
 * KWD has THREE decimal places — every `Math.round(x * 100) / 100` in this file was
 * silently rounding Kuwait money to the wrong unit.
 */
export const MONEY: Record<Country, { code: string; minorUnits: number }> = {
    UAE: { code: "AED", minorUnits: 2 },
    KSA: { code: "SAR", minorUnits: 2 },
    QATAR: { code: "QAR", minorUnits: 2 },
    KUWAIT: { code: "KWD", minorUnits: 3 },
    OTHERS: { code: "—", minorUnits: 2 },
}

export function roundMoney(country: Country, n: number): number {
    const f = 10 ** MONEY[country].minorUnits
    return Math.round(n * f) / f
}

/**
 * One canonical zone per market — computable, so it is code and never a stored
 * field (FlashSale.timezone is the anti-precedent). Used ONLY to render "9am Dubai".
 * KSA, Qatar and Kuwait all sit at +03 while UAE is +04, so a stored wall clock is
 * one `new Date(localString)` away from a plausible-looking 60-minute error.
 */
export const MARKET_TZ: Record<Country, string> = {
    UAE: "Asia/Dubai",
    KSA: "Asia/Riyadh",
    QATAR: "Asia/Qatar",
    KUWAIT: "Asia/Kuwait",
    OTHERS: "UTC",
}

/** The single clock every window check shares, so two features cannot disagree. */
export function marketNow(_country: Country, at?: string): number {
    return at ? new Date(at).getTime() : Date.now()
}

/** "+04:00" for the market on that date — derived, so DST changes cannot rot a constant. */
export function marketOffset(country: Country, at: Date = new Date()): string {
    const s = new Intl.DateTimeFormat("en-US", {
        timeZone: MARKET_TZ[country], timeZoneName: "longOffset",
    }).format(at)
    return s.match(/GMT([+-]\d{2}:\d{2})/)?.[1] ?? "+00:00"
}

/** A "9am Dubai" typed into the editor becomes the instant it actually is. */
export function toMarketInstant(local: string, country: Country): string {
    if (!local) return ""
    return `${local}:00${marketOffset(country, new Date(`${local}:00Z`))}`
}

/** …and back to the market's wall clock, so the operator reads what they typed. */
export function fromMarketInstant(iso: string, country: Country): string {
    if (!iso) return ""
    const p = new Intl.DateTimeFormat("en-CA", {
        timeZone: MARKET_TZ[country], year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(iso))
    const g = (t: string) => p.find(x => x.type === t)?.value ?? "00"
    return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`
}

export function unitLabel(ref: PricedUnitRef, listings: Listing[]): string {
    const l = listings.find(x => x.id === ref.listingId)
    if (!l) return `missing listing ${ref.listingId}`
    const name = l.displayNameEn || l.internalName
    // Never fall through to the parent listing's name: a deleted unit would read as
    // a healthy member and price off the wrong thing.
    if (ref.kind === "variant") {
        const v = (l.variants ?? []).find(x => x.id === ref.unitId)
        return v ? `${name} — ${v.variantLabelEn || v.nameEn}` : `${name} — missing variant ${ref.unitId}`
    }
    if (ref.kind === "service_option") {
        const o = (l.diagnostics?.serviceOptions ?? []).find(x => x.id === ref.unitId)
        return o ? `${name} — ${o.labelEn}` : `${name} — missing service option ${ref.unitId}`
    }
    const p = (l.treatments?.plans ?? []).find(x => x.id === ref.unitId)
    return p ? `${name} — ${p.labelEn}` : `${name} — missing plan ${ref.unitId}`
}

/** Every priced unit a listing exposes, whichever department it belongs to. */
export function pricedUnitsOf(l: Listing): { ref: PricedUnitRef; label: string }[] {
    const out: { ref: PricedUnitRef; label: string }[] = []
    ;(l.variants ?? []).forEach(v => out.push({
        ref: { listingId: l.id, kind: "variant", unitId: v.id },
        label: v.variantLabelEn || v.nameEn || v.id,
    }))
    ;(l.diagnostics?.serviceOptions ?? []).forEach(o => out.push({
        ref: { listingId: l.id, kind: "service_option", unitId: o.id }, label: o.labelEn,
    }))
    ;(l.treatments?.plans ?? []).forEach(p => out.push({
        ref: { listingId: l.id, kind: "plan", unitId: p.id }, label: p.labelEn,
    }))
    return out
}

/**
 * Stage 0 + 1 + 2: what one unit costs a customer buying it ON ITS OWN, today,
 * after that unit's own stored discount.
 *
 * That basis is deliberate and is what makes `savings` an honest claim: a service
 * option and a plan carry their own compareAt/discount and this returns the
 * post-discount figure, while RegionalData has no discount concept so `price` is
 * already the paid figure. Mixing the two bases would advertise a saving against a
 * price nobody pays.
 */
export function unitPrice(
    ref: PricedUnitRef, listings: Listing[], country: Country, cityId?: string,
): number | undefined {
    const l = listings.find(x => x.id === ref.listingId)
    if (!l) return undefined
    // Retirement is deactivation, so a retired listing keeps all its data and would
    // otherwise keep pricing inside a live combo with no signal anywhere. `inactive`
    // is delisted-but-live and its price DOES stand.
    if (l.status === "archived" || l.status === "draft") return undefined
    // stage 0 — a unit not sold in this country has no price at all.
    //
    // An ABSENT countryConfig is "never configured", which is not the same statement
    // as "excluded here": p1 (Vitamin D3) has no countryConfig and live, available
    // UAE and KSA prices on its variant, and the old strict gate made it invisible to
    // every combo. Where the listing declares country config we honour it exactly;
    // where it declares none we defer to the unit's own per-country record below,
    // which is the finer-grained truth anyway.
    const cc = l.countryConfig ?? []
    if (cc.length > 0 && !cc.some(c => c.country === country && c.status === "active")) return undefined
    if (ref.kind === "variant") {
        const v = (l.variants ?? []).find(x => x.id === ref.unitId)
        const r = (v?.regionalData ?? []).find(x => x.country === country)
        if (!v || v.status === "inactive" || !r || r.isAvailable === false) return undefined
        // NO FALLBACK (D-C29). The sparse (variant, city) grid IS the availability answer:
        // a missing city row means NOT SOLD THERE, never "use the country price". This
        // read used `?? r.price`, which invented a price for every city a variant is not
        // sold in — and it is the one mechanism the whole pricing screen refuses, so a
        // reader doing it silently undid that.
        //
        // A cityId is only asked for where city pricing exists; without one the country
        // row is the answer in its own right, not a fallback from a finer grain.
        if (cityId) return r.cityPrices?.find(c => c.cityId === cityId)?.price
        return r.price
    }
    if (ref.kind === "service_option") {
        const o = (l.diagnostics?.serviceOptions ?? []).find(x => x.id === ref.unitId)
        if (!o?.isActive) return undefined
        return finalServicePrice(servicePrice(o, country, cityId))
    }
    const p = (l.treatments?.plans ?? []).find(x => x.id === ref.unitId)
    if (!p?.isActive) return undefined
    return finalPlanPrice(planPrice(p, country, cityId), p.dripSpeed, l.treatments?.slowDripSurcharge)
}

/** A unit that is priced but cannot be shipped today. The price stands; the sale waits. */
export function unitOutOfStock(ref: PricedUnitRef, listings: Listing[], country: Country): boolean {
    if (ref.kind !== "variant") return false
    const l = listings.find(x => x.id === ref.listingId)
    const v = (l?.variants ?? []).find(x => x.id === ref.unitId)
    if (!v) return false
    if (v.status === "out_of_stock") return true
    const r = (v.regionalData ?? []).find(x => x.country === country)
    return r?.warehouseStock === 0
}

/* ── scope: the one lookup ──────────────────────────────────────────────────── */

export interface ScopeLookup {
    /** The merged row actually in force, city over country. */
    row?: CompositionScope
    level: "city" | "country" | "none"
    /** Two rows share a key — deterministic refusal, never whichever `.find` hits. */
    duplicate: boolean
    /** The country row is retired, which cascades to every city under it. */
    countryClosed: boolean
}

/**
 * Field-level merge, city over country, `undefined` = inherit. This copies
 * effectiveSlot()'s explicit undefined-stripping rather than `{...base, ...city}`,
 * which would turn a present-but-undefined key into a real override — and would
 * take `isActive` from the city row, so a retired override merged to
 * `{price: countryPrice, isActive: false}`: a row that looks retired while carrying
 * the price that should be served.
 */
export function effectiveScope(c: Composition, country: Country, cityId?: string): ScopeLookup {
    const rows = c.scopes ?? []
    const inCountry = rows.filter(r => r.country === country)
    const countryRows = inCountry.filter(r => !r.cityId)
    const cityRows = cityId ? inCountry.filter(r => r.cityId === cityId) : []
    if (countryRows.length > 1 || cityRows.length > 1) {
        return { level: "none", duplicate: true, countryClosed: false }
    }
    const base = countryRows[0]
    const city = cityRows[0]
    if (!base && !city) return { level: "none", duplicate: false, countryClosed: false }
    // A retired country row closes the whole country, cities included: a regulatory
    // pull is ONE write enforced here, not a UI loop over N rows.
    if (base && base.isActive === false) return { row: base, level: "country", duplicate: false, countryClosed: true }
    if (!city) {
        if (!base) return { level: "none", duplicate: false, countryClosed: false }
        // A "cities_only" parent is a priced payload, not a country-wide offer.
        if (!cityId && base.coverage === "cities_only") {
            return { row: base, level: "country", duplicate: false, countryClosed: true }
        }
        return { row: base, level: "country", duplicate: false, countryClosed: false }
    }
    if (city.isActive === false) {
        return base
            ? { row: base, level: "country", duplicate: false, countryClosed: false }
            : { level: "none", duplicate: false, countryClosed: false }
    }
    if (!base) return { row: city, level: "city", duplicate: false, countryClosed: false }
    const merged: CompositionScope = { ...base }
    ;(Object.keys(city) as (keyof CompositionScope)[]).forEach(k => {
        if (city[k] !== undefined) (merged as unknown as Record<string, unknown>)[k] = city[k]
    })
    // identity + retirement always belong to the row that matched
    merged.id = city.id
    merged.cityId = city.cityId
    merged.isActive = city.isActive
    merged.coverage = undefined
    return { row: merged, level: "city", duplicate: false, countryClosed: false }
}

/** CLOSED enum. A new reason is a code change, so two callers cannot invent their own. */
export type ScopeMissReason =
    | "status_not_active" | "duplicate_row" | "no_row" | "country_closed" | "row_inactive"
    | "before_window" | "after_window" | "surface" | "audience"
    | "member_integrity" | "member_unavailable" | "no_price_entered"

export interface ScopeContext {
    country: Country
    cityId?: string
    /** ISO instant. Compared as an instant, never as a wall clock. */
    at?: string
    surface?: VisibleOn
    partnerId?: string
}

/**
 * Is this offer live for this customer right now? One fixed AND-chain, first
 * failure wins. No later gate can re-enable an earlier failure, and nothing here
 * needs a grants-issued count — caps sit on the row and are enforced after this,
 * with the consumed count passed in, exactly as flash sales are.
 */
export function scopeDecision(
    c: Composition, listings: Listing[], ctx: ScopeContext,
): { live: true; row: CompositionScope } | { live: false; reason: ScopeMissReason } {
    if (c.status !== "active") return { live: false, reason: "status_not_active" }
    const look = effectiveScope(c, ctx.country, ctx.cityId)
    if (look.duplicate) return { live: false, reason: "duplicate_row" }
    if (!look.row) return { live: false, reason: "no_row" }
    if (look.countryClosed) return { live: false, reason: "country_closed" }
    if (look.row.isActive === false) return { live: false, reason: "row_inactive" }
    const now = marketNow(ctx.country, ctx.at)
    if (look.row.startsAt && now < new Date(look.row.startsAt).getTime()) return { live: false, reason: "before_window" }
    if (look.row.endsAt && now > new Date(look.row.endsAt).getTime()) return { live: false, reason: "after_window" }
    if (ctx.surface && look.row.visibleOn && look.row.visibleOn !== "both" && look.row.visibleOn !== ctx.surface) {
        return { live: false, reason: "surface" }
    }
    const aud = look.row.audience
    if (aud?.kind === "partner_exclusive" && (!ctx.partnerId || !aud.partnerIds.includes(ctx.partnerId))) {
        return { live: false, reason: "audience" }
    }
    const res = resolveComposition(c, listings, ctx.country, { cityId: ctx.cityId, at: ctx.at })
    if (res.blocking.length > 0) return { live: false, reason: "member_unavailable" }
    if (res.total === undefined) return { live: false, reason: "no_price_entered" }
    return { live: true, row: look.row }
}

/* ── city coverage: derived, and honest about what it cannot know ───────────── */

export type CityCoverage = "covered" | "not_serviceable" | "unknown_country_granular"

/**
 * Where a member can actually be DELIVERED in a city — which is not the same
 * question as what it costs. Every price lookup in this codebase falls back
 * city → country, so "derive serviceability from whether the member has a city
 * price" is constant-true and tells you nothing.
 *
 * Only Diagnostics records city serviceability, in `slotMappings` (a city with
 * `isActive: false` or no slot group cannot take a home draw). Variants carry
 * `warehouse`/`warehouseStock` per COUNTRY and plans have no city record at all, so
 * for those the honest answer is "unknown at city granularity" — never a
 * confident yes. That is also the truthful answer for a cross-department combo:
 * the departments are not comparable at city level, and only Diagnostics knows.
 */
export function memberCityCoverage(
    m: CompositionMember, listings: Listing[], country: Country, cityId: string,
): CityCoverage {
    if (m.ref.kind !== "service_option") return "unknown_country_granular"
    const l = listings.find(x => x.id === m.ref.listingId)
    if (!l?.diagnostics) return "unknown_country_granular"
    const slot = effectiveSlot(l.diagnostics, country, cityId)
    if (!slot) return "unknown_country_granular"
    if (slot.isActive === false || !slot.slotGroupId) return "not_serviceable"
    return "covered"
}

/* ── Zoho routing: refuse, never guess ─────────────────────────────────────── */

export interface MemberRouting {
    memberId: string
    subDepartmentId?: string
    /** No countryConfig array at all = routing not configured yet (information). */
    configured: boolean
    /** countryConfig exists but omits this country = a deliberate hole (a gap). */
    countryMissing: boolean
    zohoBook?: ZohoBook
    vat?: number
    vatMode?: "exclusive" | "inclusive"
    invoicingEnabled: boolean
}

/**
 * Which entity invoices a member, and at what VAT, in one country. Routing lives on
 * (sub-department × country × clinical class) — never on the composition.
 *
 * Two failure shapes that must not be conflated: a sub-department with NO
 * countryConfig has simply not been configured yet, which is information; one that
 * HAS countryConfig and omits this country is a statement that the country was left
 * out, which blocks (sd-health_products-medicine lists UAE/KSA/QATAR and no KUWAIT).
 */
export function subDeptRouting(
    m: CompositionMember, listings: Listing[], subDepartments: SubDepartment[], country: Country,
): MemberRouting {
    const l = listings.find(x => x.id === m.ref.listingId)
    const sdId = l?.subDepartmentId
    const sd = subDepartments.find(s => s.id === sdId)
    const cfgs = sd?.countryConfig
    if (!sd || !cfgs || cfgs.length === 0) {
        return { memberId: m.id, subDepartmentId: sdId, configured: false, countryMissing: false, invoicingEnabled: true }
    }
    const row = cfgs.find(x => x.country === country)
    if (!row) {
        return { memberId: m.id, subDepartmentId: sdId, configured: true, countryMissing: true, invoicingEnabled: true }
    }
    const cls = (l?.attributes as Record<string, unknown> | undefined)?.medicineType as MedicineClass | undefined
    const ov = cls ? row.overrides?.find(o => o.medicineClass === cls) : undefined
    return {
        memberId: m.id, subDepartmentId: sdId, configured: true, countryMissing: false,
        zohoBook: ov?.zohoBook ?? row.zohoBook,
        vat: ov?.vat ?? row.vat,
        vatMode: row.vatMode ?? "exclusive",
        invoicingEnabled: row.invoicingEnabled !== false,
    }
}

/* ── resolution ─────────────────────────────────────────────────────────────── */

export interface CompositionResolution {
    /** undefined = not sellable here. `priceSource` says which of the two reasons. */
    total?: number
    /**
     * What the members would cost bought SEPARATELY today, each after its own
     * discount — the basis `savings` is advertised against.
     */
    memberSubtotal: number
    /** Required members with no price here; each one blocks the sale. */
    blocking: { member: CompositionMember; reason: string }[]
    /** Optional members that dropped out; the total already excludes them. */
    dropped: CompositionMember[]
    /** Priced and sellable, but not shippable today. Does not block the price. */
    outOfStock: CompositionMember[]
    savings?: number
    /** Separates "nobody typed a price" from "a member is blocked". */
    priceSource: "city" | "country" | "none"
    currency: string
    /** What the freebie gives away, at the granted member's own list value. */
    grantedValue?: number
    basisSubtotal?: number
    /** Signed. Only present where a baseline was recorded. */
    driftPct?: number
    /** Membership moved since the price was confirmed — drift % would be a lie. */
    membershipChanged?: boolean
    cityCoverage?: { memberId: string; state: CityCoverage }[]
}

export function resolveComposition(
    c: Composition, listings: Listing[], country: Country,
    opts?: {
        cityId?: string
        at?: string
        /** Stage 3. Resolved elsewhere and passed in; never recomputed here. */
        sales?: unknown[]
    },
): CompositionResolution {
    const cityId = opts?.cityId
    const blocking: CompositionResolution["blocking"] = []
    const dropped: CompositionMember[] = []
    const outOfStock: CompositionMember[] = []
    let subtotal = 0
    const grantId = c.rule.kind === "grant_free" ? c.rule.grantMemberId : undefined
    c.members.forEach(m => {
        const p = unitPrice(m.ref, listings, country, cityId)
        if (p === undefined) {
            // The granted member is implicitly REQUIRED: an optional one would drop
            // out, the subtotal would already exclude it, the deduction would be
            // zero — and the storefront would advertise a gift that is not given.
            // Substitution is an ops action, never automatic.
            if (m.required || m.id === grantId) {
                blocking.push({ member: m, reason: "not available in this country" })
            } else dropped.push(m)
            return
        }
        if (unitOutOfStock(m.ref, listings, country)) outOfStock.push(m)
        subtotal += p * (m.quantity || 1)
    })
    const look = effectiveScope(c, country, cityId)
    const res: CompositionResolution = {
        memberSubtotal: roundMoney(country, subtotal),
        blocking, dropped, outOfStock,
        priceSource: "none",
        currency: MONEY[country].code,
    }
    if (cityId) {
        res.cityCoverage = c.members.map(m => ({ memberId: m.id, state: memberCityCoverage(m, listings, country, cityId) }))
    }
    if (blocking.length > 0) return res           // a required member gone = no price
    if (look.duplicate || look.countryClosed || !look.row || look.row.isActive === false) return res
    const row = look.row
    switch (c.rule.kind) {
        case "bundle_price":
            if (row.price !== undefined) {
                res.total = row.price
                res.priceSource = look.level === "city" ? "city" : "country"
            }
            break
        case "percent_off_members":
            if (row.percent) {
                res.total = roundMoney(country, subtotal * (1 - row.percent / 100))
                res.priceSource = look.level === "city" ? "city" : "country"
            }
            break
        case "member_sum":
            res.total = res.memberSubtotal
            res.priceSource = look.level === "city" ? "city" : "country"
            break
        case "grant_free": {
            const g = c.members.find(m => m.id === grantId)
            // quantity matters: granting 2 and deducting 1 charges for a free unit
            const gp = g ? unitPrice(g.ref, listings, country, cityId) : undefined
            if (g && gp !== undefined) {
                const give = gp * (g.quantity || 1)
                res.grantedValue = roundMoney(country, give)
                res.total = roundMoney(country, subtotal - give)
                res.priceSource = look.level === "city" ? "city" : "country"
            }
            break
        }
    }
    if (res.total !== undefined && res.memberSubtotal > res.total) {
        res.savings = roundMoney(country, res.memberSubtotal - res.total)
    }
    // Drift: only meaningful against a recorded baseline, and only as a PRICE claim
    // when the membership behind that baseline has not itself moved.
    if (row.basisSubtotal !== undefined) {
        res.basisSubtotal = row.basisSubtotal
        const now = c.members.map(m => m.id).sort().join(",")
        const then = (row.basisMemberIds ?? []).slice().sort().join(",")
        if (row.basisMemberIds && then !== now) res.membershipChanged = true
        else if (row.basisSubtotal > 0) {
            res.driftPct = Math.round(((res.memberSubtotal - row.basisSubtotal) / row.basisSubtotal) * 1000) / 10
        }
    }
    return res
}

/* ── mapping: two sides, both closed vocabularies ──────────────────────────── */

/**
 * Attach eligibility is a TWO-sided predicate. The composition's scope says where
 * the offer runs; the PARENT says what it will host. Diagnostics already shipped a
 * closed veto vocabulary for exactly this (`allowMiniPackageAddition`,
 * `allowNonBloodBiomarkerAddition`, `excludedMiniPackageIds`) with UI behind it, and
 * ignoring it would leave two disagreeing add-on paths — the private mechanism this
 * primitive exists to absorb.
 */
export function attachEligible(
    parentListingId: string, c: Composition, listings: Listing[],
): { ok: true } | { ok: false; reason: string } {
    if (c.trigger.kind !== "attach_to") return { ok: false, reason: "not an attaching composition" }
    if ((c.trigger.exclude ?? []).includes(parentListingId)) return { ok: false, reason: "parent excluded from this campaign" }
    const parent = listings.find(l => l.id === parentListingId)
    if (!parent) return { ok: false, reason: "parent listing not found" }
    // A freebie's non-granted members ARE the qualifying purchase, so the parent
    // being a member is the whole shape of "buy an IV, get collagen free". For every
    // other rule the parent must not be a member, or the customer pays for it twice.
    if (c.rule.kind === "grant_free") {
        if (c.members.some(m => m.ref.listingId === parentListingId && m.id === c.rule.grantMemberId)) {
            return { ok: false, reason: "the granted member cannot also be the qualifying parent" }
        }
    } else if (c.members.some(m => m.ref.listingId === parentListingId)) {
        return { ok: false, reason: "parent is already a member — it would be charged twice" }
    }
    if (parent.compositionId === c.id) return { ok: false, reason: "cannot attach to its own listing" }
    // money-bearing rules honour the parent's discount policy
    if ((c.rule.kind === "grant_free" || c.rule.kind === "percent_off_members") && parent.discountable === false) {
        return { ok: false, reason: "parent is not discountable" }
    }
    const dx = parent.diagnostics
    if (dx) {
        for (const m of c.members) {
            const isMini = m.ref.kind === "service_option"
            if (!isMini) continue
            if (dx.allowMiniPackageAddition === false) {
                return { ok: false, reason: "parent does not accept package additions" }
            }
            if ((dx.excludedMiniPackageIds ?? []).includes(m.ref.listingId)) {
                const ml = listings.find(l => l.id === m.ref.listingId)
                return { ok: false, reason: `parent excludes ${ml?.displayNameEn || m.ref.listingId} (duplicate markers)` }
            }
        }
    }
    return { ok: true }
}

/** Every parent this composition can legitimately appear on. */
export function eligibleParents(c: Composition, listings: Listing[]): string[] {
    if (c.trigger.kind !== "attach_to") return []
    const candidates = c.trigger.parentTagId
        ? listings.filter(l => (l.tagIds ?? []).includes(c.trigger.parentTagId!)).map(l => l.id)
        : [
            ...(c.trigger.parentListingIds ?? []),
            ...(c.trigger.parentUnits ?? []).map(u => u.listingId),
        ]
    return Array.from(new Set(candidates)).filter(id => attachEligible(id, c, listings).ok)
}

/**
 * What breaks if this unit changes. A READ, deliberately not the substrate for a
 * refusal: the listing editor does not fetch compositions, and this codebase
 * swallows failed fetches, so an empty index would read as "nothing references it"
 * and let a destructive edit through. Enforcement belongs in the API mutators.
 */
export function unitUsage(comps: Composition[], listings: Listing[]): Map<string, string[]> {
    const out = new Map<string, string[]>()
    comps.forEach(c => c.members.forEach(m => {
        const k = `${m.ref.listingId}:${m.ref.kind}:${m.ref.unitId}`
        out.set(k, [...(out.get(k) ?? []), c.id])
        void listings
    }))
    return out
}

/** Shown to whoever is editing a member's price, at the moment they edit it. */
export function compositionsReferencing(ref: PricedUnitRef, comps: Composition[]): Composition[] {
    return comps.filter(c => c.members.some(m =>
        m.ref.listingId === ref.listingId && m.ref.kind === ref.kind && m.ref.unitId === ref.unitId))
}

/* ── validation ─────────────────────────────────────────────────────────────── */

/** Rows that no rule reads, and rows that contradict each other. Save-time hygiene. */
export function scopeHygiene(c: Composition): string[] {
    const out: string[] = []
    const reads = RULE_ROW_FIELDS[c.rule.kind]
    const seen = new Set<string>()
    ;(c.scopes ?? []).forEach(r => {
        const k = `${r.country}|${r.cityId ?? ""}`
        if (seen.has(k)) out.push(`${r.country}${r.cityId ? ` / ${r.cityId}` : ""}: two rows share this key`)
        seen.add(k)
        if (r.cityId && !(c.scopes ?? []).some(x => x.country === r.country && !x.cityId)) {
            out.push(`${r.country} / ${r.cityId}: city row with no country row above it`)
        }
        if (r.price !== undefined && !reads.includes("price")) {
            out.push(`${r.country}: a price is set but "${RULE_LABELS[c.rule.kind]}" never reads one`)
        }
        if (r.percent !== undefined && !reads.includes("percent")) {
            out.push(`${r.country}: a percent is set but "${RULE_LABELS[c.rule.kind]}" never reads one`)
        }
        if (r.startsAt && r.endsAt && new Date(r.endsAt).getTime() <= new Date(r.startsAt).getTime()) {
            out.push(`${r.country}: the window ends before it starts`)
        }
    })
    return out
}

/** What still blocks this composition from going live. */
export function compositionGaps(
    c: Composition, listings: Listing[], subDepartments: SubDepartment[] = [],
): string[] {
    const g: string[] = []
    if (!c.nameEn.trim()) g.push("Name")
    if (c.members.length === 0) g.push("At least one member")
    if (c.members.length === 1 && c.kind === "combo") g.push("A combo of one is just a listing — add another member")
    const rows = c.scopes ?? []
    const live = rows.filter(r => r.isActive !== false && !r.cityId)
    if (live.length === 0) g.push("Nowhere to sell — add a country")
    if (c.rule.kind === "grant_free" && !c.rule.grantMemberId) g.push("Pick which member is granted free")
    if (c.trigger.kind === "attach_to") {
        if (!c.trigger.parentTagId
            && (c.trigger.parentListingIds ?? []).length === 0
            && (c.trigger.parentUnits ?? []).length === 0) {
            g.push("Nothing to attach to — pick a tag or a parent listing")
        } else if (eligibleParents(c, listings).length === 0) {
            g.push("No eligible parent — every candidate refuses this add-on")
        }
    }
    g.push(...scopeHygiene(c))
    live.forEach(r => {
        const ct = r.country
        const res = resolveComposition(c, listings, ct)
        res.blocking.forEach(b => g.push(`${ct}: "${unitLabel(b.member.ref, listings)}" ${b.reason}`))
        if (res.blocking.length === 0) {
            if (c.rule.kind === "bundle_price" && r.price === undefined) g.push(`${ct}: no bundle price`)
            if (c.rule.kind === "percent_off_members" && !r.percent) g.push(`${ct}: discount percent is 0`)
            // Inversion is only meaningful for a rule that can invert. `member_sum`
            // sets total === subtotal BY DEFINITION and is named for it, so gapping
            // equality would make every add-on permanently unpublishable.
            if (c.rule.kind === "bundle_price" && res.total !== undefined && res.total >= res.memberSubtotal) {
                g.push(`${ct}: bundle costs ${res.total} but its members total ${res.memberSubtotal} — no saving`)
            }
        }
        // Zoho / VAT: the refusals finance does not need to rule on first.
        if (subDepartments.length > 0) {
            const routes = c.members
                .filter(m => !res.dropped.includes(m))
                .map(m => subDeptRouting(m, listings, subDepartments, ct))
            routes.filter(x => x.countryMissing).forEach(x => {
                const m = c.members.find(y => y.id === x.memberId)!
                g.push(`${ct}: "${unitLabel(m.ref, listings)}" — its sub-department has no ${ct} invoicing entity`)
            })
            const invoiced = routes.filter(x => x.invoicingEnabled && !x.countryMissing && x.configured)
            const modes = new Set(invoiced.map(x => x.vatMode))
            if (modes.size > 1 && c.rule.kind === "bundle_price") {
                g.push(`${ct}: members mix VAT-inclusive and VAT-exclusive pricing — one bundle number cannot mean both`)
            }
            const books = new Set(invoiced.map(x => x.zohoBook).filter(Boolean))
            if (books.size > 1 && c.rule.kind === "bundle_price" && !c.rule.allocation) {
                g.push(`${ct}: members invoice from ${books.size} different Zoho entities — set how the bundle price splits`)
            }
        }
    })
    return g
}

/** Information, never a gap: things an operator should see but that do not block. */
export function compositionNotes(
    c: Composition, listings: Listing[], subDepartments: SubDepartment[] = [],
): string[] {
    const out: string[] = []
    ;(c.scopes ?? []).filter(r => r.isActive !== false && !r.cityId).forEach(r => {
        const routes = c.members.map(m => subDeptRouting(m, listings, subDepartments, r.country))
        if (routes.some(x => !x.invoicingEnabled)) out.push(`${r.country}: priced, no invoice issued`)
        routes.filter(x => !x.configured).forEach(x => {
            const m = c.members.find(y => y.id === x.memberId)!
            out.push(`${r.country}: "${unitLabel(m.ref, listings)}" — Zoho routing not configured for its sub-department yet`)
        })
        if (r.basisSubtotal === undefined && c.rule.kind === "bundle_price" && r.price !== undefined) {
            out.push(`${r.country}: baseline unknown — re-confirm the price to arm drift`)
        }
    })
    return out
}

export function statusOf(c: Composition): ProductStatus { return c.status }
