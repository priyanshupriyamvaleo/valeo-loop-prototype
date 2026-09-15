// ── Real sources for the domains the content service actually covers ─────────
//
// These replace the hand-written rows in src/services/api.ts. Rather than editing
// ~20 call sites, the mock's own functions delegate here — one boundary, so every
// page that asked the mock for products or cities now gets real data with no
// change of its own. Same approach already used for internal categories.
//
// ⚠️ SCOPE. Only products, cities, departments, internal categories, brands and
// countries have endpoints. Everything else in api.ts (journeys, categories,
// tags, flash sales, promo banners, retention, protocols, compositions, health
// team, service providers, partners, orders, audit...) has NO backend and keeps
// its mock. Those are marked `local` in section-sync's vocabulary: the prototype
// owns that data because there is nowhere yet to put it.

import { countryFromId, type CountryLookup } from "./mapper"
import { fetchProducts, toListingRow } from "./product-list"
import { getCities, getCountries } from "./products"
import type { City, Country, Listing } from "@/types"

/** Hard ceiling on paging, so a runaway loop cannot hang a picker. */
const MAX_PAGES = 40
const PAGE_SIZE = 100   // the service's own cap

/**
 * Every product, for the pickers.
 *
 * The list endpoint is paged; a picker needs the whole set, so this walks the
 * pages. Bounded on both sides — the service caps pageSize at 100 and this caps
 * the page count — because an off-by-one in either place would otherwise loop
 * until the tab dies.
 */
export async function fetchAllProducts(): Promise<Listing[]> {
    const rows: Listing[] = []
    for (let page = 0; page < MAX_PAGES; page++) {
        const { rows: batch, meta } = await fetchProducts({ page, pageSize: PAGE_SIZE })
        rows.push(...batch.map(toListingRow))
        // Stop on the LAST page, not on a short one: a page can be short and still
        // not be the last if a row was deleted mid-walk.
        const totalPages = meta?.totalPages ?? 1
        if (batch.length === 0 || page + 1 >= totalPages) break
    }
    return rows
}

let countriesLookup: CountryLookup | null = null

async function countries(): Promise<CountryLookup> {
    if (!countriesLookup) {
        countriesLookup = (await getCountries()).map(c => ({ id: c.id, code: c.code }))
    }
    return countriesLookup
}

/**
 * Cities, in the prototype's own City shape.
 *
 * The service keys a city to a numeric countryId; the frontend keys it to a
 * Country enum ("UAE" | "KSA" | ...), so the countries list is needed to bridge
 * them — `countryFromId` already does that mapping and is reused rather than
 * duplicated.
 */
export async function fetchCities(): Promise<City[]> {
    const [rows, countryList] = await Promise.all([getCities(), countries()])
    return rows.map(c => ({
        id: String(c.id),
        name: c.name?.en?.trim() || c.code,
        nameAr: c.name?.ar ?? undefined,
        // OTHERS rather than dropping the row: a city whose country is not in the
        // frontend's enum still exists and still needs to be pickable.
        country: (countryFromId(c.countryId, countryList) ?? "OTHERS") as Country,
        isActive: c.isActive,
    }))
}


/**
 * The countries the SERVICE actually has, as the frontend's own Country keys.
 *
 * The Add-country picker used the hardcoded COUNTRIES constant, which offered every
 * market the frontend can name rather than every market the service knows. Adding one
 * it does not have produced a listing that filled in six toggles and then failed the
 * save with "Unknown market." — honest, but only after the work was done.
 *
 * A country the frontend cannot NAME is skipped rather than shown raw: everything
 * downstream (`countryId`, the country config rows, the pricing sheet) is keyed on the
 * Country union, so offering a key that is not in it would break at the first save.
 * That is a gap to close by widening the union, not by leaking a code into the picker.
 */
export async function fetchAvailableCountries(): Promise<Country[]> {
    const list = await countries()
    const out: Country[] = []
    for (const c of list) {
        const key = countryFromId(c.id, list)
        if (key && !out.includes(key)) out.push(key)
    }
    return out
}

/** Countries the service has that the frontend has no name for — worth surfacing, not hiding. */
export async function unnameableCountries(): Promise<string[]> {
    const list = await countries()
    return list.filter(c => !countryFromId(c.id, list)).map(c => c.code)
}
