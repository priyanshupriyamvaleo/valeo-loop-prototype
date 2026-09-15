import { Country, FlashSale, FlashSaleState, Listing } from "@/types"

/**
 * State is DERIVED from the window, not stored — a stored status is a second
 * source of truth that goes stale the moment the clock passes it, which is how
 * "ended" sales keep discounting.
 */
export function saleState(sale: FlashSale, now: Date = new Date()): FlashSaleState {
    if (sale.isDraft) return "draft"
    const t = now.getTime()
    if (t < new Date(sale.startsAt).getTime()) return "scheduled"
    if (t > new Date(sale.endsAt).getTime()) return "ended"
    return "live"
}

export const SALE_STATE_META: Record<FlashSaleState, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-slate-100 text-slate-700 border-slate-200" },
    scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 border-blue-200" },
    live: { label: "Live now", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    ended: { label: "Ended", className: "bg-muted text-muted-foreground border-border" },
}

/** Is this listing in scope? Tag scope is preferred — it needs no sale edit. */
export function listingInSale(l: Pick<Listing, "id" | "tagIds">, sale: FlashSale): boolean {
    return sale.scopeKind === "tag"
        ? !!sale.tagId && (l.tagIds ?? []).includes(sale.tagId)
        : (sale.listingIds ?? []).includes(l.id)
}

/** Sales that would actually price this listing right now. */
export function activeSalesFor(
    l: Pick<Listing, "id" | "tagIds" | "discountable">, sales: FlashSale[], now?: Date,
): FlashSale[] {
    // An excluded listing is never discounted, whatever a sale claims.
    if (l.discountable === false) return []
    return sales.filter(s => saleState(s, now) === "live" && listingInSale(l, s))
}

export function ruleFor(sale: FlashSale, country: Country) {
    return sale.rules.find(r => r.country === country)
}

/**
 * The effective price for one priced unit. Returns the base price unchanged when
 * nothing applies, so callers never have to special-case "no sale".
 * Floors win over percentages — that is the point of a floor.
 */
export function effectivePrice(
    basePrice: number,
    l: Pick<Listing, "id" | "tagIds" | "discountable" | "priceFloors">,
    sales: FlashSale[],
    country: Country,
    now?: Date,
): { price: number; sale?: FlashSale; wasFloored: boolean } {
    const applicable = activeSalesFor(l, sales, now)
    if (applicable.length === 0) return { price: basePrice, wasFloored: false }
    // Overlapping sales: the customer gets the best price. Deterministic, and the
    // only choice that never looks like a bug from the outside.
    let best = { price: basePrice, sale: undefined as FlashSale | undefined, wasFloored: false }
    applicable.forEach(sale => {
        const rule = ruleFor(sale, country)
        if (!rule) return
        let p = rule.discountType === "percent"
            ? basePrice * (1 - rule.discountValue / 100)
            : basePrice - rule.discountValue
        const floors = [rule.floorPrice, l.priceFloors?.find(f => f.country === country)?.amount]
            .filter((x): x is number => typeof x === "number")
        const floor = floors.length ? Math.max(...floors) : undefined
        let floored = false
        if (floor !== undefined && p < floor) { p = floor; floored = true }
        p = Math.max(0, Math.round(p * 100) / 100)
        if (p < best.price) best = { price: p, sale, wasFloored: floored }
    })
    return best
}

/**
 * What still blocks a sale from going live.
 * `resolvedCount` is how many listings the scope actually matches — a sale that
 * resolves to nothing is the most common way a launch silently does nothing, so
 * having a tag selected is not sufficient.
 */
export function flashSaleGaps(sale: FlashSale, resolvedCount?: number): string[] {
    const gaps: string[] = []
    if (!sale.name.trim()) gaps.push("Name")
    if (!sale.startsAt || !sale.endsAt) gaps.push("Start and end time")
    else if (new Date(sale.endsAt).getTime() <= new Date(sale.startsAt).getTime()) {
        gaps.push("End must be after start")
    }
    if (sale.scopeKind === "tag" && !sale.tagId) gaps.push("Campaign tag to target")
    if (sale.scopeKind === "listing" && (sale.listingIds ?? []).length === 0) gaps.push("At least one listing")
    if (sale.rules.length === 0) gaps.push("A discount rule for at least one country")
    sale.rules.filter(r => !r.discountValue).forEach(r => gaps.push(`${r.country}: discount value is 0`))
    sale.rules.filter(r => r.discountType === "percent" && r.discountValue >= 100)
        .forEach(r => gaps.push(`${r.country}: ${r.discountValue}% would make it free`))
    // Every flash sale must actually contain listings.
    if (resolvedCount === 0) {
        gaps.push(sale.scopeKind === "tag"
            ? "No listings carry this campaign tag yet — the sale would price nothing"
            : "No listings added — the sale would price nothing")
    }
    if (!sale.landingCategoryId && !sale.landingSlug?.trim()) {
        gaps.push("No landing page — link the category page the sale should fill")
    }
    return gaps
}
