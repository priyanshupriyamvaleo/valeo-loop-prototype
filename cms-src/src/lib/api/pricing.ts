// ── The Pricing Sheet ─────────────────────────────────────────
//
// One `product_pricing` row per (variant, city). The sheet's own rules, which the
// payload has to honour:
//
//   · a blank cell is a MISSING ROW, not a zero — "not sold there" (D-C29)
//   · clearing a selling price therefore DELETES the row
//   · retail is NOT NULL; omitted means "same as selling", i.e. nothing struck out
//
// So the save is a DIFF, not a series of writes: what the sheet holds now, against what
// the service holds. Writing only the filled cells would leave a price standing in a city
// the operator cleared — the product going on selling somewhere they thought they had
// withdrawn it from, which is the same failure the country screen has by design and this
// one does not have to.

import { ApiError } from "./client"
import {
    deletePricesBatch, getCommerce, putPricesBulk,
    type BulkPriceRow, type PriceRowResponse, type RejectedPriceRow,
} from "./products"
import type { Listing, ProductVariant } from "@/types"

export interface PriceSyncResult {
    saved: number
    deleted: number
    /** Per-row refusals, each already resolved to the variant and city that caused it. */
    rejected: RejectedPriceRow[]
    /** Set when the whole call failed rather than individual rows. */
    error?: string
}

/** One cell of the sheet, flattened out of the nested regionalData/cityPrices shape. */
interface Cell {
    variantId: number
    cityId: number
    price: number
    retailPrice?: number
    /** The ladder for THIS row, at the row's own scope — see the note in gatherTiers. */
    multiBuyTiers?: { minQty: number; discountValue: number }[]
}

/**
 * The tiers belonging to one (variant, city) price row.
 *
 * <p><b>A tier is read at the SAME scope its price row was found at</b> (D-C63) — a variant's
 * ladder is all-country or all-city and the two never shadow each other. So a CITY row takes
 * only the tiers scoped to that city; it does not inherit the country-scoped ones. Falling
 * back would be an override chain, which is the thing D-C58 and D-C63 both refused: turning a
 * ladder off in one city is writing no row for it, not writing a tombstone.
 *
 * <p>Tiers ride on the price row rather than going up separately because the row already
 * carries the scope — sending them apart would mean repeating variantId and cityId and
 * risking the two disagreeing.
 */
function gatherTiers(
    tiers: { minQuantity: number; discountPct: number; cityId?: string }[] | undefined,
    cityId: number,
): { minQty: number; discountValue: number }[] | undefined {
    const mine = (tiers ?? []).filter(t => Number(t.cityId) === cityId)
    if (mine.length === 0) return undefined
    return mine
        // minQty 1 is just the price (ck_vmbt_qty), and 0% is not a discount.
        .filter(t => t.minQuantity >= 2 && t.discountPct > 0 && t.discountPct <= 100)
        .map(t => ({ minQty: t.minQuantity, discountValue: t.discountPct }))
}

/**
 * Every priced cell the sheet currently holds.
 *
 * A row with no price is skipped rather than sent as 0 — the whole point of the blank cell
 * is that it means "no row", and a 0 would be a real price of nothing.
 */
export function cellsFromListing(listing: Listing): Cell[] {
    const out: Cell[] = []
    for (const v of listing.variants ?? []) {
        const variantId = Number(v.id)
        if (!Number.isFinite(variantId) || variantId <= 0) continue   // never saved yet
        for (const r of v.regionalData ?? []) {
            for (const cp of r.cityPrices ?? []) {
                const cityId = Number(cp.cityId)
                if (!Number.isFinite(cityId) || cityId <= 0) continue
                if (!Number.isFinite(cp.price) || cp.price <= 0) continue
                out.push({
                    variantId, cityId,
                    price: cp.price,
                    // Only sent when it differs; the service defaults it to the selling price.
                    retailPrice: Number.isFinite(cp.retailPrice as number) && (cp.retailPrice as number) > 0
                        ? cp.retailPrice
                        : undefined,
                    multiBuyTiers: gatherTiers(r.multiBuyTiers, cityId),
                })
            }
        }
    }
    return out
}

/**
 * Makes the service's price rows match the sheet.
 *
 * One bulk PUT for everything priced, then a DELETE per cell that was cleared. The bulk
 * call is per-row tolerant — it returns `saved` and `rejected` rather than failing as a
 * unit — so one bad cell does not cost the other 237.
 */
export async function syncPrices(
    productId: number,
    listing: Listing,
): Promise<PriceSyncResult> {
    const wanted = cellsFromListing(listing)

    // What the service holds now, so cleared cells can be found — ONE commerce read, where this
    // used to be a GET per variant on every save (17 on the first product measured).
    const onServer = new Map<string, PriceRowResponse>()
    try {
        const commerce = await getCommerce(productId)
        for (const row of commerce.prices ?? []) {
            if (row.cityId == null) continue          // country-scoped rows are another screen's
            onServer.set(`${row.variantId}:${row.cityId}`, row)
        }
    } catch (e) {
        // Without the current rows the diff cannot tell "cleared" from "never set", and
        // guessing would delete rows nobody touched. Write nothing.
        return { saved: 0, deleted: 0, rejected: [], error: `Could not read current prices, so none were changed: ${msg(e)}` }
    }

    // ── the tripwire ──
    // A sheet with ZERO priced cells over a server that holds rows is, in every case met so
    // far, a wiped read (the axis-regeneration bug, a failed hydrate) — not a product-wide
    // withdrawal. The diff below would delete every row the product has; refuse it loudly.
    // A real withdrawal still works city-by-city, or by switching the market off (D-C29).
    if (wanted.length === 0 && onServer.size > 0) {
        return {
            saved: 0, deleted: 0, rejected: [], error:
                `Refused to delete all ${onServer.size} price rows: the sheet is empty but the ` +
                `service is not — that is almost always a wiped read, not a withdrawal. ` +
                `Clear cities individually if the withdrawal is real.`,
        }
    }

    // ── the writes ──
    let saved = 0
    let rejected: RejectedPriceRow[] = []
    if (wanted.length > 0) {
        const rows: BulkPriceRow[] = wanted.map(c => ({
            variantId: c.variantId,
            cityId: c.cityId,                 // CITY scope: treatments price per city (D-C48)
            price: c.price,
            retailPrice: c.retailPrice,
            // Omitted, never [], when there is no ladder. An empty array would REPLACE the
            // stored tiers with nothing on every save — a silent way to lose a ladder
            // nobody edited. Absent means "leave them"; the tiers screen is what clears them.
            multiBuyTiers: c.multiBuyTiers,
        }))
        try {
            const res = await putPricesBulk(productId, rows)
            saved = res.saved?.length ?? 0
            rejected = res.rejected ?? []
        } catch (e) {
            return { saved: 0, deleted: 0, rejected: [], error: `Prices could not be saved: ${msg(e)}` }
        }
    }

    // ── the clears ──
    const keep = new Set(wanted.map(c => `${c.variantId}:${c.cityId}`))
    let deleted = 0
    // ONE batch call, one server-side transaction — this was a capped-concurrency loop of
    // per-cell DELETEs. The body is the explicit cell list; the endpoint cannot infer deletions
    // from absence, so the tripwire above remains the only thing standing between a wiped sheet
    // and a mass delete, exactly as before. All-or-nothing: a refused batch deletes zero cells.
    const stale = [...onServer.keys()].filter(key => !keep.has(key))
    if (stale.length > 0) {
        try {
            const res = await deletePricesBatch(productId, stale.map(key => {
                const [variantId, cityId] = key.split(":").map(Number)
                return { variantId, cityId }
            }))
            deleted = res.deleted
        } catch (e) {
            rejected.push({
                index: -1, variantId: 0, cityId: 0,
                code: "DELETE_FAILED",
                message: `${stale.length} cleared price(s) could not be removed — none were: ${msg(e)}`,
            })
        }
    }

    return { saved, deleted, rejected }
}

const msg = (e: unknown) =>
    e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Unexpected error."
