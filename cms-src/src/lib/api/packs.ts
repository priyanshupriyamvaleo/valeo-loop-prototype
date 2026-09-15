// ── Session packs ─────────────────────────────────────────────
//
// Ticking a base variant in the Session Packs ladder mints a pack; unticking deletes it.
// So the save is a DIFF, like cities and prices — and here it has to be, because a pack
// carries price rows of its own. Writing only the ticked ones would leave a pack on sale
// that the operator had visibly unticked.
//
// ⚠️ ORDER. A pack POSTs against a BASE VARIANT ID, so packs can only be synced after the
// base variants exist server-side. And PricingWriter.requireUnderPackCeiling validates a
// pack's price against its base's STORED price, so prices must be written before pack
// prices are — which is why this runs after syncPrices.

import { ApiError } from "./client"
import { createPack, deletePack, updatePack, type PackResponse } from "./products"
import type { Listing, ProductVariant } from "@/types"

export interface PackSyncResult {
    created: number
    updated: number
    deleted: number
    failures: { section: string; error: string }[]
    error?: string
}

interface WantedPack {
    baseVariantId: number
    sessions: number
    intervalDays?: number
    validityDays?: number
    intendedDiscountPct?: number
    /** Present when this pack already exists server-side. */
    packVariantId?: number
}

/**
 * The packs the editor is holding, as (base, sessions) pairs.
 *
 * A pack variant is identified server-side by base + sessions — that pair is what the axis
 * signature encodes and what DUPLICATE_PACK protects. Matching on it rather than on the
 * local row's id is what lets a pack minted in this session be told apart from one that
 * already existed.
 */
export function packsFromListing(listing: Listing): WantedPack[] {
    const out: WantedPack[] = []
    for (const v of listing.variants ?? []) {
        const sp = v.sessionPack
        if (!sp) continue
        const baseVariantId = Number(sp.baseVariantId)
        // A pack whose BASE has never been saved cannot be created — the POST needs a real id.
        if (!Number.isFinite(baseVariantId) || baseVariantId <= 0) continue
        if (!Number.isFinite(sp.sessions) || sp.sessions < 2) continue

        const own = Number(v.id)
        out.push({
            baseVariantId,
            sessions: sp.sessions,
            intervalDays: sp.sessionIntervalDays,
            validityDays: sp.validityDays,
            intendedDiscountPct: sp.intendedDiscountPct,
            packVariantId: Number.isFinite(own) && own > 0 ? own : undefined,
        })
    }
    return out
}

/**
 * Makes the service's packs match the ladder.
 *
 * Existing packs are read from the variants the server already gave us — a pack variant is
 * one carrying a `pack` block — so no extra read is needed.
 */
export async function syncPacks(
    productId: number,
    listing: Listing,
    serverPacks: { variantId: number; baseVariantId: number; sessions: number }[],
): Promise<PackSyncResult> {
    const wanted = packsFromListing(listing)
    const failures: PackSyncResult["failures"] = []
    let created = 0, updated = 0, deleted = 0

    const key = (base: number, sessions: number) => `${base}:${sessions}`
    const onServer = new Map(serverPacks.map(p => [key(p.baseVariantId, p.sessions), p]))

    for (const w of wanted) {
        const existing = onServer.get(key(w.baseVariantId, w.sessions))
        try {
            if (existing) {
                // Sessions is NOT sent — it defines the pack's identity and the API does not
                // accept it on update. Changing it means a different pack.
                await updatePack(productId, existing.variantId, {
                    intervalDays: w.intervalDays,
                    validityDays: w.validityDays,
                    intendedDiscountPct: w.intendedDiscountPct,
                })
                updated++
            } else {
                await createPack(productId, w.baseVariantId, {
                    sessions: w.sessions,
                    intervalDays: w.intervalDays,
                    validityDays: w.validityDays,
                    intendedDiscountPct: w.intendedDiscountPct,
                })
                created++
            }
        } catch (e) {
            // PACK_OF_PACK, DUPLICATE_PACK, PACKS_NOT_SUPPORTED and PACK_PRICE_ABOVE_CEILING
            // all name what to change. Reported per pack so one refusal does not hide the rest.
            failures.push({
                section: `pack:${w.sessions} sessions of variant ${w.baseVariantId}`,
                error: msg(e),
            })
        }
    }

    // ── unticked packs ──
    const keep = new Set(wanted.map(w => key(w.baseVariantId, w.sessions)))
    for (const [k, p] of onServer) {
        if (keep.has(k)) continue
        try {
            await deletePack(productId, p.variantId)
            deleted++
        } catch (e) {
            // VARIANT_IN_USE means it is commercialised — retirement is what INACTIVE is for.
            failures.push({ section: `pack:removed ${p.sessions} sessions`, error: msg(e) })
        }
    }

    return { created, updated, deleted, failures }
}

const msg = (e: unknown) =>
    e instanceof ApiError ? `${e.code}: ${e.message}` : e instanceof Error ? e.message : "Unexpected error."
