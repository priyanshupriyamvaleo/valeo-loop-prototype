// ── Save a Health Product to the content service ──────────────
// The API is section-shaped: create returns a DRAFT id, then each section is
// its own PUT. We mirror that rather than pretending it's one document save,
// and we collect per-section failures instead of aborting — losing the whole
// save because the FAQ list was rejected would be worse than a partial save
// the editor can report honestly.

import type { Listing } from "@/types"
import { ApiError } from "./client"
import { syncPacks } from "./packs"
import type { VariantResponse } from "./types"
import { cellsFromListing, syncPrices } from "./pricing"
import {
    createProduct, deleteCitiesBatch, generateVariants, getCityAvailability,
    getCountries, getAllSubDepartments, putCitiesBulk,
    getVariants, putAvailability, putClassification, putContent, putContentBlock,
    putFaqs, putIdentity, putProductMedia, putRecommendations, putSubscription, putVariantsBulk,
    putVariantAxes, putVariantMarket,
} from "./products"
import type { SubDeptLookup } from "./mapper"
import {
    countryId, matchVariant, numericIds, toAvailability, toClassification,
    toComparison, toContent, toCustomerReviews, toFaqs, toHowToUse, toIdentity,
    toInfluencerVideos, toStats, toSubscription, toSubscriptionPlans,
    toVariantAxes, toVariantMarket, toMediaRows, toVariantUpdate, toWhySuperior,
} from "./mapper"
import type { Country as ApiCountry, SubDepartment } from "./types"

export interface SectionResult { section: string; ok: boolean; error?: string; fields?: Record<string, string> }
export interface SaveResult {
    /** Sections whose wire payload matched the clean snapshot — nothing was sent for them. */
    skipped?: string[]

    productId?: number
    uid?: string
    results: SectionResult[]
    /** True when the product exists on the server, whatever else failed. */
    created: boolean
}

// Reference data barely changes within a session; fetch once.
// Only {id, code} is ever used from this — that IS SubDeptLookup. Typing it as the
// full SubDepartment forced a conversion between two differently-nullable name types
// for fields nothing here reads.
let subsCache: SubDeptLookup | null = null
let countriesCache: ApiCountry[] | null = null

export async function loadLookups() {
    if (!subsCache) {
        subsCache = (await getAllSubDepartments()).map(sd => ({ id: sd.id, code: sd.code }))
    }
    if (!countriesCache) countriesCache = await getCountries()
    return { subs: subsCache, countries: countriesCache }
}

export function clearLookupCache() { subsCache = null; countriesCache = null }

const describe = (e: unknown): SectionResult["error"] =>
    e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Unexpected error"

const fieldsOf = (e: unknown) => (e instanceof ApiError ? e.fieldErrors() : undefined)

async function run(section: string, fn: () => Promise<unknown>, out: SectionResult[]) {
    try {
        await fn()
        out.push({ section, ok: true })
    } catch (e) {
        out.push({ section, ok: false, error: describe(e), fields: fieldsOf(e) })
    }
}

/**
 * Run independent section writes CONCURRENTLY, with a cap.
 *
 * The save used to be one long `await` chain: ~49 round trips in series for a
 * treatments listing, so a service answering in 40ms still took seconds and one
 * answering in 115ms took over five. Nothing was slow; everything was queued.
 *
 * ⚠️ ONLY for calls that are genuinely independent. The ordering this save
 * depends on is real and proven, not defensive:
 *   · city availability BEFORE any city price — the service refuses otherwise
 *     (CITY_NOT_OFFERED)
 *   · variants exist BEFORE prices and packs — a price row names a variant id
 * So phases stay sequential and only their contents run together. A blanket
 * Promise.all over the whole save would be faster and wrong.
 *
 * Capped rather than unbounded: firing 30 writes at once against one product
 * invites lock contention on the same rows, and turns a clean per-section
 * failure list into a pile of timeouts.
 */
const CONCURRENCY = 6

async function runAll(
    tasks: { section: string; fn: () => Promise<unknown> }[],
    out: SectionResult[],
): Promise<void> {
    if (!tasks.length) return
    let next = 0
    const workers = Array.from({ length: Math.min(CONCURRENCY, tasks.length) }, async () => {
        for (;;) {
            const i = next++
            if (i >= tasks.length) return
            // Results land in completion order rather than task order, which is
            // why every section carries its own label.
            await run(tasks[i].section, tasks[i].fn, out)
        }
    })
    await Promise.all(workers)
}

export async function saveHealthProduct(listing: Listing, clean?: Listing | null): Promise<SaveResult> {
    const results: SectionResult[] = []
    const { subs, countries } = await loadLookups()

    // ── the dirty-section gate ────────────────────────────────
    // "Dirty" is defined at the WIRE: a section runs only when the payload its own mapper
    // builds differs between the current listing and the last clean snapshot. Reusing the to*
    // mappers means there is no hand-maintained field→section map to drift — identical wire,
    // identical outcome, so skipping is safe by construction. Editing one identity field used
    // to fire ~20 writes; it now fires one.
    //
    // No baseline (first save, create flow) runs everything, and a mapper choking on the
    // snapshot counts as "changed" — never skip on doubt.
    const baseline = listing.apiProductId ? clean ?? null : null
    const skipped: string[] = []
    const unchanged = (key: string, build: (l: Listing) => unknown): boolean => {
        if (!baseline) return false
        try {
            if (JSON.stringify(build(listing)) === JSON.stringify(build(baseline))) {
                skipped.push(key)
                return true
            }
        } catch {
            // fall through: changed
        }
        return false
    }

    const classification = toClassification(listing, subs)
    if (!classification) {
        return {
            results: [{ section: "classification", ok: false, error: "Choose a sub-department before saving." }],
            created: false,
        }
    }

    // ── 1. Create or update the product row ───────────────────
    let productId = listing.apiProductId
    let uid = listing.apiUid
    if (!productId) {
        try {
            const created = await createProduct(classification)
            productId = created.productId
            uid = created.uid
            results.push({ section: "classification", ok: true })
        } catch (e) {
            return {
                results: [{ section: "classification", ok: false, error: describe(e), fields: fieldsOf(e) }],
                created: false,
            }
        }
    } else if (!unchanged("classification", l => toClassification(l, subs))) {
        await run("classification", () => putClassification(productId!, classification), results)
    }

    const id = productId!
    // Typed as the full response, not a narrowed { variantId, label } — the pack block on it
    // is what tells an existing pack from one the editor minted this session.
    let serverVariants: VariantResponse[] = []

    // ── 2. Sections that always apply ─────────────────────────
    // Independent of each other and of everything below — one wave.
    await runAll([
        ...(unchanged("identity", toIdentity)
            ? [] : [{ section: "identity", fn: () => putIdentity(id, toIdentity(listing)) }]),
        ...(unchanged("content", toContent)
            ? [] : [{ section: "content", fn: () => putContent(id, toContent(listing)) }]),
        ...((listing.faq ?? []).length && !unchanged("faqs", toFaqs)
            ? [{ section: "faqs", fn: () => putFaqs(id, toFaqs(listing)) }]
            : []),
    ], results)
    // A lazy re-read for gated sections that need server variant ids (subscription plans,
    // pack blocks). When the variants section is skipped, nothing has fetched them — and a
    // subscription payload built from an empty id list would REPLACE the plans with nothing.
    const ensureServerVariants = async () => {
        if (serverVariants.length === 0) {
            try {
                serverVariants = await getVariants(id)
            } catch {
                results.push({ section: "variants", ok: false, error: "Could not read variants back." })
            }
        }
    }

    // The whole variant complex gates as ONE unit — axes, generation, per-variant rows and
    // per-market rows all write state the others name, so partial skips would re-order them.
    const variantsUnchanged = unchanged("variants", l => ({
        axes: toVariantAxes(l),
        rows: (l.variants ?? []).map(v => ({ id: v.id, u: toVariantUpdate(v) })),
        markets: (l.variants ?? []).map(v => (v.regionalData ?? [])
            .map(r => ({ c: r.country, m: toVariantMarket(r, l.multiBuyTiers ?? []) }))),
    }))

    const hasAxes = (listing.variantOptions ?? []).some(o => (o.values ?? []).length)

    // generate() is THREE-way, and this used to call it only in the first case:
    //   axes with values → the cartesian product
    //   no axes at all   → ONE variant, axis_signature '' — physio (D-C30), a single-SKU
    //                      supplement, a combo (D-C35). A legitimate state, not an absence.
    //   an axis with no values → refused, naming it
    //
    // Gating on hasAxes meant a product with no axes never generated its sole variant, so it
    // had nothing to attach a price to and could never be sold at all. The server already
    // answers all three correctly; the client just has to ask.
    if (!variantsUnchanged) {
        if (hasAxes) {
            await run("variant-axes", () => putVariantAxes(id, toVariantAxes(listing)), results)
            // Build a variant row per axis combination, then read back the server
            // ids — everything below (pricing, subscription plans) is keyed on them.
            await run("variants", () => generateVariants(id), results)
            try {
                serverVariants = await getVariants(id)
            } catch {
                results.push({ section: "variants", ok: false, error: "Could not read variants back." })
            }
        } else {
            // No axes declared: ask for the sole variant. The server decides whether that is
            // legitimate — it refuses with AXIS_WITHOUT_VALUES if an axis exists but is empty,
            // which is exactly the case this branch must NOT paper over.
            await run("variants", () => generateVariants(id), results)
            try {
                serverVariants = await getVariants(id)
            } catch {
                results.push({ section: "variants", ok: false, error: "Could not read variants back." })
            }
        }

        // ── Variant rows and per-market SKU / price ───────────────
        const localVariants = listing.variants ?? []
        const variantRows: (ReturnType<typeof toVariantUpdate> & { variantId: number })[] = []
        const marketTasks: { section: string; fn: () => Promise<unknown> }[] = []
        for (let i = 0; i < localVariants.length; i++) {
            const lv = localVariants[i]
            // The variant's own id FIRST. toLocalVariants sets `id` to the server's variantId, so
            // a hydrated or freshly generated variant already knows what it is.
            //
            // matchVariant is the fallback for a variant built locally before the product existed.
            // It matches on label and then falls back to serverVariants[index] — which quietly PUTs
            // one variant's status onto another the moment the list is reordered or filtered. Using
            // it when a real id is available would be choosing the guess over the fact.
            const own = Number(lv.id)
            const vid = Number.isFinite(own) && own > 0 && serverVariants.some(sv => sv.variantId === own)
                ? own
                : matchVariant(lv, i, serverVariants)
            if (!vid) continue
            variantRows.push({ variantId: vid, ...toVariantUpdate(lv) })

            for (const r of lv.regionalData ?? []) {
                const cid = countryId(r.country, countries)
                if (!cid) continue
                // The market row is the supplements-shaped surface: a per-country SKU (@NotBlank
                // upstream) plus a country-scope price. The treatments sheets price per CITY and
                // collect no SKU — so with nothing to say, say nothing. Sending anyway was 34 PUTs
                // per save, every one a 400 on the blank SKU, at ~660ms of upstream each.
                const hasAnythingToSay = (r.sku ?? "").trim() !== "" || Number(r.price) > 0
                if (!hasAnythingToSay) continue
                marketTasks.push({
                    section: `price:${lv.variantLabelEn || i + 1}/${r.country}`,
                    fn: () => putVariantMarket(id, vid, cid, toVariantMarket(r, listing.multiBuyTiers ?? [])),
                })
            }
        }
        // The variant rows first, then their market rows: a market row names a
        // variant, so the two waves cannot be merged into one. The rows go as ONE
        // bulk request (was one PUT per variant); per-row refusals come back beside
        // the saved echo, so one bad row marks itself rather than the save.
        if (variantRows.length) {
            try {
                const res = await putVariantsBulk(id, variantRows)
                if (res.saved.length > 0 || (res.rejected ?? []).length === 0) {
                    results.push({ section: "variant rows", ok: true })
                }
                for (const r of res.rejected ?? []) {
                    results.push({ section: `variant:${r.variantId}`, ok: false,
                        error: `${r.code}: ${r.message}` })
                }
            } catch (e) {
                results.push({ section: "variant rows", ok: false, error: describe(e), fields: fieldsOf(e) })
            }
        }
        await runAll(marketTasks, results)
    }

    // ── Media gallery (product_media) ─────────────────────────
    // AFTER the variant complex: assigned variantIds must be server-real. Atomic replace
    // server-side, so the TRIPWIRE from the price-wipe incident applies: the PUT goes only
    // when there is something to say OR the baseline proves rows existed — a blank shell
    // can never mass-delete a gallery, while a deliberate clear still lands.
    {
        // A gallery asset assigned to a hand-added, not-yet-saved variant carries a LOCAL id.
        // Resolve those to server ids the way the variant rows themselves do (matchVariant) —
        // excluding the row without trying would DELETE the asset server-side under a green
        // check, since the replace is atomic and the payload simply wouldn't carry it.
        const localById = new Map((listing.variants ?? []).map((v, i) => [v.id, i] as const))
        const needsResolving = (listing.mediaGallery ?? []).some(a =>
            (a.variantIds ?? []).some(id => !(Number(id) > 0)))
        if (needsResolving) await ensureServerVariants()
        const resolve = (localId: string): number | undefined => {
            const index = localById.get(localId)
            if (index === undefined) return undefined
            return matchVariant((listing.variants ?? [])[index], index, serverVariants)
        }

        const mediaRows = toMediaRows(listing, resolve)
        const baselineMedia = baseline ? toMediaRows(baseline, resolve) : []
        if (!unchanged("media", l => toMediaRows(l, resolve))
                && (mediaRows.length > 0 || baselineMedia.length > 0)) {
            await run("media", () => putProductMedia(id, mediaRows), results)
        }

        // EVERY silent exclusion surfaces — outside the dirty gate, because "all my images
        // are preview-only" is precisely the save where the gate goes quiet.
        const unuploaded = (listing.mediaGallery ?? []).filter(a => !(a.url ?? "").trim()).length
        if (unuploaded > 0) {
            results.push({ section: "media (not uploaded)", ok: false,
                error: `${unuploaded} asset${unuploaded === 1 ? " has" : "s have"} no stored file and did not save — upload before saving.` })
        }
        const unresolvable = (listing.mediaGallery ?? []).filter(a =>
            (a.url ?? "").trim()
            && (a.variantIds ?? []).length > 0
            && (a.variantIds ?? []).every(id => !(Number(id) > 0) && resolve(id) == null)).length
        if (unresolvable > 0) {
            results.push({ section: "media (variants unsaved)", ok: false,
                error: `${unresolvable} asset${unresolvable === 1 ? " is" : "s are"} assigned only to variants that are not saved yet — save variants first, then save again.` })
        }
    }

    // ── City prices (product_pricing) ─────────────────────────
    // The Pricing Sheet and the Master Sheet both write here. Runs AFTER the variants,
    // because a price row names a variant id, and after the cities, because pricing a
    // city with no product_city_config row is refused (CITY_NOT_OFFERED).
    if (variantIdsExist(listing) && !unchanged("prices", cellsFromListing)) {
        const priced = await syncPrices(id, listing)
        if (priced.error) {
            results.push({ section: "prices", ok: false, error: priced.error })
        } else {
            for (const r of priced.rejected) {
                // Reported per ROW, with the city on it: "12 rows saved" beside a silent
                // failure is how a price nobody notices ends up missing in one market.
                results.push({
                    section: `price:variant ${r.variantId ?? "?"} / city ${r.cityId ?? "?"}`,
                    ok: false,
                    error: `${r.code}: ${r.message}`,
                })
            }
            if (priced.saved > 0 || priced.deleted > 0 || priced.rejected.length === 0) {
                results.push({
                    section: "prices",
                    ok: priced.rejected.length === 0,
                    error: priced.rejected.length
                        ? `${priced.saved} saved, ${priced.rejected.length} rejected`
                        : undefined,
                })
            }
        }
    }

    // ── Session packs (a pack IS a variant, D-C59) ────────────
    // AFTER prices: requireUnderPackCeiling validates a pack's price against its base's
    // STORED price, so writing packs before the bases are priced checks against nothing.
    // A pack payload identical to the baseline means no pack was added, edited or removed —
    // and the second price pass only exists for packs minted THIS save, so it skips too.
    // Existing packs carry real server ids, so their price edits ride the first pass above.
    if (variantIdsExist(listing)
            && !unchanged("packs", l => (l.variants ?? []).map(v => v.sessionPack ?? null))) {
        await ensureServerVariants()
        const serverPacks = serverVariants
            .filter(v => v.pack?.baseVariantId)
            .map(v => ({
                variantId: v.variantId,
                baseVariantId: v.pack!.baseVariantId,
                sessions: v.pack!.sessions ?? 0,
            }))

        const packed = await syncPacks(id, listing, serverPacks)
        for (const f of packed.failures) {
            results.push({ section: f.section, ok: false, error: f.error })
        }
        if (packed.created || packed.updated || packed.deleted) {
            results.push({ section: "session packs", ok: packed.failures.length === 0 })
        }

        // A pack is a new VARIANT, so the ids the editor holds are now stale — it has
        // rows the client has never seen. Re-read rather than guess at their ids.
        if (packed.created > 0 || packed.deleted > 0) {
            try {
                serverVariants = await getVariants(id)
            } catch {
                results.push({ section: "session packs", ok: false,
                    error: "Packs were saved, but the variant list could not be re-read." })
            }
        }

        // ── a SECOND price pass, for the packs ────────────────────────────
        // The first pass skipped every pack: syncPrices ignores a variant with no real
        // server id, and a pack does not have one until the POST above creates it. So a
        // pack could never be priced in a single save — packs existed with zero price rows.
        //
        // It has to be this order and not the reverse: requireUnderPackCeiling validates a
        // pack's price against its base's STORED price, so the bases must be written first.
        // Hence prices, then packs, then prices again.
        //
        // The pass is a diff like the first, so re-sending the base rows is a no-op rather
        // than a duplicate.
        const packIdByKey = new Map(
            serverVariants
                .filter(v => v.pack?.baseVariantId)
                .map(v => [`${v.pack!.baseVariantId}:${v.pack!.sessions ?? 0}`, v.variantId]),
        )
        const withPackIds: Listing = {
            ...listing,
            variants: (listing.variants ?? []).map(v => {
                if (!v.sessionPack) return v
                const real = packIdByKey.get(
                    `${Number(v.sessionPack.baseVariantId)}:${v.sessionPack.sessions}`)
                return real ? { ...v, id: String(real) } : v
            }),
        }
        if (packIdByKey.size > 0) {
            const packPriced = await syncPrices(id, withPackIds)
            if (packPriced.error) {
                results.push({ section: "pack prices", ok: false, error: packPriced.error })
            } else {
                for (const r of packPriced.rejected) {
                    // PACK_PRICE_ABOVE_CEILING lands here — a pack dearer than base x sessions.
                    results.push({
                        section: `pack price:variant ${r.variantId ?? "?"} / city ${r.cityId ?? "?"}`,
                        ok: false,
                        error: `${r.code}: ${r.message}`,
                    })
                }
            }
        }
    }

    // ── 3. PDP content blocks ─────────────────────────────────
    // Six of the seven addressable blocks. how-to-use and influencer-videos were skipped here
    // until 2026-09-02 on the belief that they 400'd — they do not; the old mappers were
    // sending the wrong shape (see the correction at the top of section-sync.ts).
    //
    // clinician-reviews stays out, and for a real reason rather than a stale one:
    // ClinicianReviewsDto requires a coachId, and this editor has no coach to name.
    const blockBuilders: [string, (l: Listing) => unknown][] = [
        ["why-superior", toWhySuperior],
        ["stats", toStats],
        ["comparison", toComparison],
        ["customer-reviews", toCustomerReviews],
        ["how-to-use", toHowToUse],
        ["influencer-videos", toInfluencerVideos],
    ]
    await runAll(
        blockBuilders
            .map(([block, build]) => ({ block, build, payload: build(listing) }))
            .filter(({ payload }) => payload)
            .filter(({ block, build }) => !unchanged(`block:${block}`, build))
            .map(({ block, payload }) => ({
                section: `block:${block}`,
                fn: () => putContentBlock(id, block as never, payload),
            })),
        results,
    )

    // ── 4. Recommendations ────────────────────────────────────
    const fbIds = numericIds(listing.frequentlyBought?.listingIds)
    if (fbIds.length && !unchanged("frequently-bought", l => numericIds(l.frequentlyBought?.listingIds))) {
        await run("frequently-bought", () => putRecommendations(id, "frequently-bought", { items: fbIds.map(i => ({ relatedProductId: i, status: "ACTIVE" })) }), results)
    }
    const avIds = numericIds(listing.recommendationIds)
    if (avIds.length && !unchanged("also-viewed", l => numericIds(l.recommendationIds))) {
        await run("also-viewed", () => putRecommendations(id, "also-viewed", { items: avIds.map(i => ({ relatedProductId: i, status: "ACTIVE" })) }), results)
    }

    // ── City availability (product x city) ────────────────────
    // A DIFF, not a series of writes: this screen's off state is the ABSENCE of a row,
    // so a city switched off has to be DELETEd. Writing only the "on" rows would leave
    // every city the operator ever enabled switched on forever — the same silent
    // divergence the country screen has, except here the API can actually fix it.
    //
    // The server's current rows are read first because the editor cannot know what it is
    // removing otherwise: local state says which cities should be on, never which are.
    if (!unchanged("cities", l => l.cityConfig ?? [])) {
        await syncCities(id, listing, results)
    }

    // ── 5. Per-market sections ────────────────────────────────
    // One market's availability and its subscription are independent of every
    // other market's, so all of them go in one wave.
    // Subscription gates as one unit on its OWN inputs, not on serverVariants — the plans
    // payload is built from server ids, and when the variants section was skipped none were
    // fetched. A dirty subscription therefore re-reads the ids first; building plans off an
    // empty list would REPLACE every market's plans with nothing.
    const subscriptionUnchanged = unchanged("subscription", l => ({
        enabled: !!l.subscriptionEnabled,
        frequencies: l.subscriptionFrequencies ?? [],
        discounts: l.subscriptionDiscountPct ?? {},
        copy: [l.subscriptionSavingsLabelEn, l.subscriptionSavingsLabelAr,
               l.subscriptionTermsEn, l.subscriptionTermsAr],
    }))
    if (listing.subscriptionEnabled && !subscriptionUnchanged) {
        await ensureServerVariants()
    }

    const marketSections: { section: string; fn: () => Promise<unknown> }[] = []
    for (const cfg of listing.countryConfig ?? []) {
        const cid = countryId(cfg.country, countries)
        if (!cid) {
            results.push({ section: `availability:${cfg.country}`, ok: false, error: "Unknown market." })
            continue
        }
        if (unchanged(`availability:${cfg.country}`, l => {
            const c = (l.countryConfig ?? []).find(x => x.country === cfg.country)
            return c ? toAvailability(c) : null
        })) {
            // fall through to subscription — the flags row is already what the sheet shows
        } else marketSections.push({
            section: `availability:${cfg.country}`,
            fn: () => putAvailability(id, cid, toAvailability(cfg)),
        })

        if (listing.subscriptionEnabled && !subscriptionUnchanged) {
            // Plans are keyed on server variant ids, so they can only be built
            // after the variant rows exist.
            const plans = toSubscriptionPlans(
                listing.subscriptionFrequencies ?? [],
                (listing.subscriptionDiscountPct ?? {}) as Record<string, number | undefined>,
                serverVariants.map(v => v.variantId),
            )
            marketSections.push({
                section: `subscription:${cfg.country}`,
                fn: () => putSubscription(id, cid, toSubscription(listing, plans)),
            })
        }
    }
    await runAll(marketSections, results)

    return { productId: id, uid, results, skipped, created: true }
}


/**
 * Makes the server's city rows match the editor's.
 *
 * <p>Three outcomes per city, and the third is the one a naive implementation misses:
 * on → PUT, changed → PUT, and off-but-present-on-the-server → DELETE.
 *
 * <p>A read failure ABORTS rather than falling through to writes. Without the server's
 * list the diff cannot tell "off" from "never on", and guessing would either delete rows
 * the operator never touched or leave the product sold in cities they switched off.
 */
async function syncCities(productId: number, listing: Listing, results: SectionResult[]) {
    let onServer: number[]
    try {
        onServer = (await getCityAvailability(productId))
            .map(r => r.city?.id)
            .filter((id): id is number => typeof id === "number")
    } catch (e) {
        results.push({ section: "cities", ok: false,
            error: `Could not read current cities, so none were changed: ${describe(e)}` })
        return
    }

    const wanted = new Map<number, boolean>()
    for (const row of listing.cityConfig ?? []) {
        const cityId = Number(row.cityId)
        if (!Number.isFinite(cityId) || cityId <= 0) continue
        // Only ACTIVE rows are "offered". An inactive row in local state means the same
        // thing as no row at all on this screen, so it becomes a delete below.
        if (row.status === "active") wanted.set(cityId, !!row.isCustomerSlotBookEnabled)
    }

    // The whole diff in TWO transactions: one bulk upsert for the switch-ons, one batch
    // delete for the switch-offs. This was one round trip per city (33 at worst) — the last
    // per-row write storm after prices moved to its bulk pair. Per-row refusals come back
    // beside the saved count, so one closed city marks one row, never the sheet.
    if (wanted.size > 0) {
        try {
            const res = await putCitiesBulk(productId, [...wanted].map(([cityId, slotBook]) => ({
                cityId, status: "ACTIVE" as const, isCustomerSlotBookEnabled: slotBook,
            })))
            if (res.saved > 0) results.push({ section: "cities", ok: true })
            for (const r of res.rejected ?? []) {
                results.push({ section: `city:${r.cityId}`, ok: false, error: `${r.code}: ${r.message}` })
            }
        } catch (e) {
            results.push({ section: "cities", ok: false, error: describe(e) })
        }
    }
    const stale = onServer.filter(cityId => !wanted.has(cityId))
    if (stale.length > 0) {
        try {
            await deleteCitiesBatch(productId, stale)
            results.push({ section: "cities (removed)", ok: true })
        } catch (e) {
            // All-or-nothing server-side: a refused batch removed zero cities.
            results.push({ section: "cities (removed)", ok: false,
                error: `${stale.length} switched-off cit${stale.length === 1 ? "y was" : "ies were"} not removed: ${describe(e)}` })
        }
    }
}


/** True once at least one variant has a real server id — nothing can be priced before that. */
function variantIdsExist(listing: Listing): boolean {
    return (listing.variants ?? []).some(v => {
        const id = Number(v.id)
        return Number.isFinite(id) && id > 0
    })
}
