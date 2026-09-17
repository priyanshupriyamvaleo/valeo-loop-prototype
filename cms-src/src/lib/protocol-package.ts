// ── The package: what a patient buys ─────────────────────────
//
// THE PACKAGE IS A COMPOSITION. Not a new entity, and not the old prototype's
// hand-rolled invoice. This repo already holds the primitive, and its rule is
// written at src/types/index.ts:134 —
//
//   NOTHING COMPOSES LISTINGS. EVERYTHING COMPOSES PRICED UNITS.
//
// So a member names a PricedUnitRef (a variant, a service option or a plan),
// `resolveComposition()` prices the set per country and per city, and the four
// discount rules are the catalogue's rules. This file holds only the two
// things the catalogue cannot know:
//
//   1. THE BRIDGE   the protocol's steps decide what is in the package, and
//                   how many of each.
//   2. THE RULES    what stops a package going live, in the same PlanGap
//                   shape the page already uses.

import {
    compositionGaps, resolveComposition, roundMoney, subDeptRouting, unitLabel, unitPrice,
} from "@/lib/composition"
import { unitKey } from "@/lib/protocol-chain"
import type { PlanGap } from "@/lib/protocol-plans"
import type {
    Composition, CompositionMember, Country, Listing, PricedUnitRef, Protocol,
    ProtocolPlan, ProtocolStep, SubDepartment,
} from "@/types"

const rid = (p = "m") => `${p}-${Math.random().toString(36).slice(2, 9)}`

// ── The bridge ───────────────────────────────────────────────
//
// QUANTITY IS THE NUMBER OF STEPS. One step that links a unit puts one unit in
// the package; three "Month N dispatched" steps put three. That is how a
// protocol is authored — the count is the plan, not a multiplier typed twice —
// and it is why two lists describing one protocol cannot disagree: there is one
// list, and it is the steps.
//
// IT GROUPS BY UNIT, NOT BY LISTING. A listing is a folder, so two steps naming
// the Standard and the Fast Track panel of one listing are two different
// things bought at two different prices, and collapsing them would bill one and
// deliver the other.
//
// There is no cadence to read. A step carries no time, so the count is the only
// quantity there is.

export interface StepUnit {
    ref: PricedUnitRef
    qty: number
    stepTitles: string[]
    /** "Nurse draws the sample, Repeat panel" · "Month 1, Month 2 and 1 more" */
    note: string
}

export function stepUnits(steps: ProtocolStep[]): StepUnit[] {
    const by = new Map<string, StepUnit>()
    ;[...steps].sort((a, b) => a.order - b.order).forEach(s => {
        if (!s.linkedUnit) return
        const k = unitKey(s.linkedUnit)
        const cur = by.get(k) ?? { ref: s.linkedUnit, qty: 0, stepTitles: [], note: "" }
        cur.qty += 1
        cur.stepTitles.push(s.titleEn || "Untitled step")
        by.set(k, cur)
    })

    /* The note is the steps a line came from, so a category manager can see why
       a consultation is in there four times without opening the Step Builder. */
    return [...by.values()].map(u => ({
        ...u,
        note: u.stepTitles.length > 2
            ? `${u.stepTitles.slice(0, 2).join(", ")} and ${u.stepTitles.length - 2} more`
            : u.stepTitles.join(", "),
    }))
}

/** Steps that link nothing sellable. A review or a call often is one. */
export const unlinkedSteps = (steps: ProtocolStep[]) =>
    steps.filter(s => !s.linkedUnit)

export function emptyPackage(protocol: Protocol, pathLabel?: string): Composition {
    return {
        id: `pkg-${protocol.id}${pathLabel ? `-${pathLabel}` : ""}`,
        /* "program" is the composition kind for a course of care sold as one
           thing. A combo is a shelf pairing; this is a programme. */
        kind: "program",
        nameEn: pathLabel ? `${protocol.nameEn} · ${pathLabel}` : protocol.nameEn,
        nameAr: protocol.nameAr,
        members: [],
        /* One percentage off what the parts come to. It is the lever a category
           manager actually has, and the rule can be changed on screen. */
        rule: { kind: "percent_off_members" },
        trigger: { kind: "always" },
        surface: "own_page",
        scopes: [],
        /* ProductStatus, the catalogue's own vocabulary: "active" is live and
           "draft" is not. The pages screen says Active / Inactive for the same
           two states, so the words on screen match. */
        status: "draft",
    }
}

/**
 * Members from the steps.
 *
 * The step now NAMES its priced unit, so there is nothing to guess. It keeps a
 * member's `required` flag and rewrites the quantity, so re-running it never
 * undoes a hand-set optional flag. A unit the steps dropped loses its member;
 * a unit they added gains one.
 *
 * PASS A RESOLVED PROTOCOL. `resolveProtocol(p, pathId)` first, or a variant
 * protocol will build the wrong path's package.
 */
export function buildPackageFromSteps(pkg: Composition, protocol: Protocol): Composition {
    const units = stepUnits(protocol.steps)

    const members: CompositionMember[] = units.map((u, i) => {
        const existing = pkg.members.find(m => unitKey(m.ref) === unitKey(u.ref))
        return existing
            ? { ...existing, quantity: u.qty, sortOrder: i }
            : { id: rid(), ref: u.ref, quantity: u.qty, required: true, sortOrder: i }
    })

    return { ...pkg, members }
}

/**
 * What the steps deliver, against what the package sells.
 *
 * The same check the page carries, and it matters more here: a package that
 * charges for something no step delivers takes money for nothing.
 */
export interface PackageDrift {
    /** Linked by a step, and no member names it. */
    missingFromPackage: StepUnit[]
    /** A member names it, and no step links it. */
    extraInPackage: CompositionMember[]
    /** A member whose quantity no longer matches the step count. */
    wrongQuantity: { member: CompositionMember; steps: number }[]
}

export function packageDrift(pkg: Composition, steps: ProtocolStep[]): PackageDrift {
    const units = stepUnits(steps)
    const byUnit = new Map(units.map(u => [unitKey(u.ref), u]))

    return {
        missingFromPackage: units.filter(u =>
            !pkg.members.some(m => unitKey(m.ref) === unitKey(u.ref))),
        extraInPackage: pkg.members.filter(m => !byUnit.has(unitKey(m.ref))),
        wrongQuantity: pkg.members
            .map(m => ({ member: m, steps: byUnit.get(unitKey(m.ref))?.qty ?? 0 }))
            .filter(x => x.steps > 0 && x.steps !== (x.member.quantity || 1)),
    }
}

// ── Invoicing and tax ───────────────────────────────────────
//
// A package sells for ONE number and invoices as MANY lines, so the discount
// has to be split back across them. That split is not cosmetic: a consultation
// invoices from DMCC at 5% and a GLP-1 pen from Shifa at 0%, so where the
// discount lands changes what each entity books and what tax is charged.
//
// The catalogue already refuses a bundle whose members cross two Zoho entities
// with no split declared — `compositionGaps` says "set how the bundle price
// splits". This is that split.
//
//   PROPORTIONATE  each line takes a share in proportion to its own price.
//                  `rule.allocation = "pro_rata_list"`.
//   EQUAL          the discount is divided by the number of lines.
//                  `rule.allocation = "per_member"`.
//
// THE LAST LINE ABSORBS THE ROUNDING. Allocating a share to every line and
// rounding each one leaves a remainder, and an invoice that does not foot is
// worse than one whose last line is a fils off.

export type DiscountStrategy = NonNullable<Composition["rule"]["allocation"]>

export const STRATEGIES: { id: DiscountStrategy; label: string; blurb: string }[] = [
    {
        id: "pro_rata_list", label: "Proportionate",
        blurb: "Each line takes a share in proportion to its own price.",
    },
    {
        id: "per_member", label: "Equal",
        blurb: "The discount is divided equally by the number of lines.",
    },
]

export interface InvoiceLine {
    memberId: string
    label: string
    qty: number
    unit?: number
    /** Its own price times its quantity, before the package discount. */
    gross: number
    /** Its share of the package discount. Always a positive figure. */
    discount: number
    net: number
    vatRate?: number
    vat: number
    total: number
    entity?: string
    /** False where the market issues no invoice at all — Qatar. */
    invoiced: boolean
    /** Why a line cannot be invoiced, when it cannot. */
    note?: string
}

export interface InvoiceTable {
    lines: InvoiceLine[]
    gross: number
    discount: number
    net: number
    vat: number
    total: number
    /** One row per invoicing entity. Two rows is the case the split exists for. */
    byEntity: { entity: string; net: number; vat: number; total: number }[]
    strategy: DiscountStrategy
}

/**
 * The split, and the one rule that makes it an invoice.
 *
 * NO LINE MAY BE DISCOUNTED BELOW ZERO. "Equal" divided by the line count and
 * happily took 582 off a 150 voucher, which produced a net of −432 and a
 * negative tax figure. A negative line is not an invoice.
 *
 * So equal means AS EQUAL AS POSSIBLE: any line whose own price is below the
 * even share is capped at its price and leaves the pool, and what it could not
 * absorb is shared again among the lines that can. It settles in a few rounds
 * and the shares still sum to the discount exactly.
 *
 * Proportionate cannot overflow while the discount is no larger than the
 * subtotal, and it is capped anyway: a rule is worth less if it holds only
 * while somebody keeps the inputs in range.
 */
function allocate(
    lines: InvoiceLine[],
    toSplit: number,
    gross: number,
    strategy: DiscountStrategy,
    r: (n: number) => number,
) {
    if (!lines.length || toSplit <= 0) return

    const pool = new Set(lines)
    let remaining = toSplit
    let remainingGross = gross

    /* Each round caps whoever cannot absorb its share, then shares the rest
       again. It terminates because every round either caps a line or stops. */
    for (let round = 0; round < lines.length; round++) {
        const capped = [...pool].filter(l => {
            const share = strategy === "per_member"
                ? remaining / pool.size
                : remainingGross === 0 ? 0 : remaining * (l.gross / remainingGross)
            return share > l.gross
        })
        if (!capped.length) break
        capped.forEach(l => {
            l.discount = l.gross
            remaining = r(remaining - l.gross)
            remainingGross = r(remainingGross - l.gross)
            pool.delete(l)
        })
        if (!pool.size) break
    }

    /* The last line in the pool absorbs the rounding: an invoice that does not
       foot is worse than one whose last line is a fils off. */
    const rest = [...pool]
    let allocated = 0
    rest.forEach((l, i) => {
        const last = i === rest.length - 1
        l.discount = last
            ? r(remaining - allocated)
            : r(strategy === "per_member"
                ? remaining / rest.length
                : remainingGross === 0 ? 0 : remaining * (l.gross / remainingGross))
        allocated = r(allocated + l.discount)
    })
}

export function invoiceTable(
    pkg: Composition,
    listings: Listing[],
    subDepartments: SubDepartment[],
    country: Country,
    cityId: string | undefined,
    /** The package total. Undefined = nothing to split, so nothing is discounted. */
    packageTotal: number | undefined,
): InvoiceTable {
    const strategy: DiscountStrategy = pkg.rule.allocation ?? "pro_rata_list"
    const r = (n: number) => roundMoney(country, n)

    const lines: InvoiceLine[] = [...pkg.members]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(m => {
            const unit = unitPrice(m.ref, listings, country, cityId)
            const qty = m.quantity || 1
            const route = subDeptRouting(m, listings, subDepartments, country)
            return {
                memberId: m.id,
                label: unitLabel(m.ref, listings),
                qty,
                unit,
                gross: unit === undefined ? 0 : r(unit * qty),
                discount: 0, net: 0, vat: 0, total: 0,
                vatRate: route.vat,
                entity: route.zohoBook,
                invoiced: route.invoicingEnabled && unit !== undefined,
                note: unit === undefined
                    ? `not sold in ${country}`
                    : !route.configured
                        ? "routing not configured"
                        : route.countryMissing
                            ? `the sub-department omits ${country}`
                            : !route.invoicingEnabled
                                ? `${country} issues no invoice`
                                : undefined,
            }
        })

    const gross = r(lines.reduce((n, l) => n + l.gross, 0))
    const toSplit = packageTotal === undefined ? 0 : Math.max(0, r(gross - packageTotal))

    /* Only a priced line can carry a share of the discount. */
    const payable = lines.filter(l => l.gross > 0)
    allocate(payable, toSplit, gross, strategy, r)

    lines.forEach(l => {
        l.net = r(l.gross - l.discount)
        const rate = l.vatRate ?? 0
        if (!l.invoiced || rate === 0) {
            l.vat = 0
            l.total = l.net
            return
        }
        /* Every price in this catalogue is VAT-exclusive net, so VAT is added on
           top. The inclusive branch exists because the field does. */
        const mode = subDeptRouting(
            pkg.members.find(m => m.id === l.memberId)!, listings, subDepartments, country,
        ).vatMode ?? "exclusive"
        if (mode === "inclusive") {
            const net = r(l.net / (1 + rate / 100))
            l.vat = r(l.net - net)
            l.total = l.net
            l.net = net
        } else {
            l.vat = r(l.net * (rate / 100))
            l.total = r(l.net + l.vat)
        }
    })

    const byEntityMap = new Map<string, { net: number; vat: number; total: number }>()
    lines.filter(l => l.invoiced).forEach(l => {
        const k = l.entity ?? "unassigned"
        const cur = byEntityMap.get(k) ?? { net: 0, vat: 0, total: 0 }
        byEntityMap.set(k, {
            net: r(cur.net + l.net), vat: r(cur.vat + l.vat), total: r(cur.total + l.total),
        })
    })

    return {
        lines,
        gross,
        discount: r(lines.reduce((n, l) => n + l.discount, 0)),
        net: r(lines.reduce((n, l) => n + l.net, 0)),
        vat: r(lines.reduce((n, l) => n + l.vat, 0)),
        total: r(lines.reduce((n, l) => n + l.total, 0)),
        byEntity: [...byEntityMap.entries()].map(([entity, v]) => ({ entity, ...v })),
        strategy,
    }
}

// ── What stops a package going live ─────────────────────────
//
// `compositionGaps` already holds the catalogue's own refusals: a bundle that
// costs more than its parts, members that mix VAT-inclusive and VAT-exclusive
// pricing, members invoicing from different Zoho entities with no split. Those
// are reused verbatim rather than restated. This adds the three a protocol
// package needs on top.

export function packagePublishGaps(
    pkg: Composition | undefined,
    protocol: Protocol,
    listings: Listing[],
    subDepartments: SubDepartment[],
    countries: Country[],
    /** Names a city id for the message. Without it a refusal reads "city-3". */
    cityName?: (id: string) => string | undefined,
): PlanGap[] {
    const out: PlanGap[] = []

    if (!pkg || pkg.members.length === 0) {
        out.push({
            section: "package",
            blocksDraft: true,
            what: "The package has no items",
            why: "A package with nothing in it prices at zero. Build it from the steps.",
        })
        return out
    }

    /* Every market with a LIVE scope row has to reach a price. Two rows are not
       gaps and were both being reported as one:
         · no row at all — an empty scope table means it sells nowhere, which is
           a decision and not an omission.
         · a row switched Inactive — a withdrawn market is the author saying so.
           Reading it as "KSA has no price" made Inactive unusable: the control
           that retires a market also refused to let the package be saved. */
    const live = pkg.scopes.filter(s => !s.cityId && s.isActive !== false)
    const scoped = countries.filter(c => live.some(s => s.country === c))
    if (!scoped.length) {
        out.push({
            section: "package",
            what: "No market has a price",
            why: "A package with no live scope row sells nowhere. Add a market and price it.",
        })
    }
    scoped.forEach(country => {
        const row = live.find(s => s.country === country)

        /* EVERY LIVE COLUMN IS ASKED, not just the country.
           
           A city the author switched on is a market the package claims to sell
           in, and an item with no price row there makes that claim false. Asking
           only the country question is how a city gets opened and its holes are
           then found one order at a time.
           
           And a "cities_only" country does not sell country-wide at all —
           effectiveScope closes the cityless lookup to say so — so asking it
           would report a market as priceless when it is merely priced in its
           cities. Ask what each row actually answers. */
        const liveCities = pkg.scopes
            .filter(s => s.country === country && s.cityId && s.isActive !== false)
            .map(s => s.cityId)
        const asked: (string | undefined)[] = row?.coverage === "cities_only"
            ? liveCities
            : [undefined, ...liveCities]

        if (!asked.length) {
            out.push({
                section: "package",
                what: `${country} sells in no city`,
                why: "The market is set to cities only and has no live city. Add one, or let it sell country-wide.",
            })
            return
        }

        asked.forEach(cityId => {
            const where = cityId ? `${cityName?.(cityId) ?? cityId}` : country
            const res = resolveComposition(pkg, listings, country, { cityId })
            if (res.total === undefined) {
                out.push({
                    section: "package",
                    what: `${where} has no price`,
                    why: res.blocking.length
                        ? `${res.blocking.length} item${res.blocking.length === 1 ? " is" : "s are"} not sold in ${where}.`
                        : "Nobody has typed the number this rule needs.",
                })
            } else if (res.total <= 0) {
                out.push({
                    section: "package",
                    what: `The package prices at zero in ${where}`,
                    why: "A protocol that costs nothing is a mistake, not an offer.",
                })
            }
        })
    })

    /* The catalogue's own refusals, unedited. */
    compositionGaps(pkg, listings, subDepartments).forEach(g => out.push({
        section: "package",
        what: g,
        why: "A rule the catalogue enforces on every composition.",
    }))

    if (protocol.status !== "active") out.push({
        section: "package",
        what: `The protocol is a ${protocol.status}, and it is not live`,
        why: "Selling a package for a protocol nobody signed off is the one order this refuses.",
    })

    return out
}

/* ── What a market column actually means ──────────────────────
 *
 * TWO DIFFERENT EMPTY CELLS, and only one of them is a gap.
 *
 * `unitPrice()` takes a cityId, but the three unit kinds do not agree on what
 * that means. A VARIANT has no fallback — D-C29 makes the sparse (variant,
 * city) grid itself the availability answer, so no row means NOT SOLD THERE. A
 * service option and a plan merge their city row over their country row, so a
 * country price answers the city.
 *
 * Read blindly, a package of country-grain supplements renders an empty column
 * in every city, and an author reads "we do not sell in Abu Dhabi" off a
 * product that sells there perfectly well. So the sheet has to ask a different
 * question first: does this unit price BY CITY in this country at all?
 *
 *   "country"  it does not. The country price is the answer everywhere, the
 *              cell shows it, and no city can be blocked over it.
 *   "city"     it does. A city with no row is a real hole, the cell shows a
 *              dot, and that city cannot go live.
 *
 * `priceScopeOf()` in catalogue.ts answers this for a variant and says why —
 * "follow the price". This is the same rule over all three kinds.
 */
export function priceGrain(
    ref: PricedUnitRef, listings: Listing[], country: Country,
): "city" | "country" {
    const l = listings.find(x => x.id === ref.listingId)
    if (!l) return "country"
    if (ref.kind === "variant") {
        const v = (l.variants ?? []).find(x => x.id === ref.unitId)
        const r = (v?.regionalData ?? []).find(x => x.country === country)
        return (r?.cityPrices ?? []).some(c => c.price > 0) ? "city" : "country"
    }
    if (ref.kind === "service_option") {
        const o = (l.diagnostics?.serviceOptions ?? []).find(x => x.id === ref.unitId)
        return (o?.pricing ?? []).some(p => p.country === country && p.cityId) ? "city" : "country"
    }
    const pl = (l.treatments?.plans ?? []).find(x => x.id === ref.unitId)
    return (pl?.pricing ?? []).some(p => p.country === country && p.cityId) ? "city" : "country"
}

/** Does this unit carry a price row for THIS city, as opposed to inheriting one? */
function hasCityRow(
    ref: PricedUnitRef, listings: Listing[], country: Country, cityId: string,
): boolean {
    const l = listings.find(x => x.id === ref.listingId)
    if (!l) return false
    if (ref.kind === "variant") {
        const v = (l.variants ?? []).find(x => x.id === ref.unitId)
        const r = (v?.regionalData ?? []).find(x => x.country === country)
        return (r?.cityPrices ?? []).some(c => c.cityId === cityId)
    }
    if (ref.kind === "service_option") {
        const o = (l.diagnostics?.serviceOptions ?? []).find(x => x.id === ref.unitId)
        return (o?.pricing ?? []).some(p => p.country === country && p.cityId === cityId)
    }
    const pl = (l.treatments?.plans ?? []).find(x => x.id === ref.unitId)
    return (pl?.pricing ?? []).some(p => p.country === country && p.cityId === cityId)
}

/**
 * What one member costs in one column, and WHERE that number came from.
 *
 * FOUR ANSWERS, because "the cell is empty" and "the cell is inherited" are
 * different facts and only one of them stops a city selling:
 *
 *   city        a real row for this city. The number is this city's own.
 *   country     the unit is not priced by city here at all, so the country
 *               price is the answer everywhere. Correct, never a gap.
 *   inherited   the unit IS priced by city, has no row for THIS one, and the
 *               lookup fell back to the country price. Only service options and
 *               plans do this — a variant refuses (D-C29). Shown muted, because
 *               a country price wearing a city hat should not read as a quote.
 *   none        priced by city, no row here, and nothing to fall back to. The
 *               hole. This is the only answer that refuses a market.
 */
export type PriceLevel = "city" | "country" | "inherited" | "none"

export interface CellPrice {
    price?: number
    level: PriceLevel
    /** The sticker price, when it is above what the unit charges. */
    was?: number
}

export function cellPrice(
    ref: PricedUnitRef, listings: Listing[], country: Country, cityId?: string,
): CellPrice {
    const grain = priceGrain(ref, listings, country)

    /* A country-grain unit is asked the COUNTRY question even in a city column.
       Passing the cityId would return undefined for a variant and invent a hole
       in a product that sells everywhere in the market. */
    if (!cityId || grain === "country") {
        const price = unitPrice(ref, listings, country)
        return {
            price,
            level: price === undefined ? "none" : cityId ? "country" : "city",
            was: price === undefined ? undefined : wasPrice(ref, listings, country, undefined, price),
        }
    }

    const own = hasCityRow(ref, listings, country, cityId)
    const price = unitPrice(ref, listings, country, cityId)
    if (price === undefined) return { level: "none" }
    return {
        price,
        level: own ? "city" : "inherited",
        was: wasPrice(ref, listings, country, own ? cityId : undefined, price),
    }
}

/**
 * The sticker price of a unit, when it is above what the unit charges.
 *
 * Lifted out of PackageLines, where it was a closure over the one market on
 * screen. The sheet prices many columns at once, so it takes them as arguments.
 * Variants and service options carry `retailPrice`; a plan carries
 * `compareAtPrice`. A "was" at or below the charged figure is not a discount.
 */
export function wasPrice(
    ref: PricedUnitRef, listings: Listing[], country: Country,
    cityId: string | undefined, charged: number,
): number | undefined {
    const l = listings.find(x => x.id === ref.listingId)
    if (!l) return undefined
    let was: number | undefined
    if (ref.kind === "variant") {
        const v = (l.variants ?? []).find(x => x.id === ref.unitId)
        const r = (v?.regionalData ?? []).find(x => x.country === country)
        was = cityId
            ? r?.cityPrices?.find(c => c.cityId === cityId)?.retailPrice ?? r?.retailPrice
            : r?.retailPrice
    } else if (ref.kind === "service_option") {
        const o = (l.diagnostics?.serviceOptions ?? []).find(x => x.id === ref.unitId)
        was = (o?.pricing ?? []).find(pp => pp.country === country && pp.cityId === cityId)?.retailPrice
            ?? (o?.pricing ?? []).find(pp => pp.country === country && !pp.cityId)?.retailPrice
    } else {
        const pl = (l.treatments?.plans ?? []).find(x => x.id === ref.unitId)
        was = (pl?.pricing ?? []).find(pp => pp.country === country && pp.cityId === cityId)?.compareAtPrice
            ?? (pl?.pricing ?? []).find(pp => pp.country === country && !pp.cityId)?.compareAtPrice
    }
    return was !== undefined && was > charged ? was : undefined
}

/** Every stored package of a plan, whichever paths exist. */
export const packagesOf = (plan: ProtocolPlan | null): Composition[] =>
    Object.values(plan?.packages ?? {}).filter(p => p.members.length > 0)
