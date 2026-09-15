// ── Internal categories (the Classification tab's "Feature" picker) ───────────
//
// GET /internal-categories returns ACTIVE rows only, already ordered
// alphabetically by English name — the service sorts because the table has no
// name column to ORDER BY in SQL (names live in translations) and its ids are
// legacy creation order. So do NOT re-sort here.
//
// ⚠️ TWO FIELDS THE SERVICE DOES NOT HAVE.
// The frontend's InternalCategory carries `serviceProviderIds` and
// `fulfilmentPath`; internal_categories carries neither.
//
//   · serviceProviderIds — the provider pool is country-scoped, living in
//     internal_category_country_config. It is the Provider Pool chip's data, and
//     it comes back EMPTY here. ClassificationResponse.providerPool is likewise
//     hardcoded null (ProductMapper:60) for the same reason: that endpoint has no
//     country. Empty is the honest answer; the UI says so rather than showing a
//     blank chip that looks like "no providers".
//   · fulfilmentPath — dead on this type. Nothing reads it off a category
//     (checked: the only field read is serviceProviderIds), so it is filled with
//     a value rather than widening the type for a field with no reader.

import { api } from "@/lib/api/client"
import { InternalCategory } from "@/types"
import { LocalizedText, displayName } from "@/lib/api/taxonomy"

export interface InternalCategoryDto {
    id: number
    name: LocalizedText
}

/** The service's rows, in the frontend's own shape. Order is preserved. */
export async function fetchInternalCategories(): Promise<InternalCategory[]> {
    const rows = await api.get<InternalCategoryDto[]>("internal-categories")
    return rows.map(row => ({
        // Listing.internalCategoryId is a string, and the service's id is a Long.
        // Stringified here — the ONE place that conversion happens — so the saved
        // value round-trips and Number() at the write boundary is exact.
        id: String(row.id),
        nameEn: displayName(row.name, `#${row.id}`),
        nameAr: row.name?.ar?.trim() || "",
        fulfilmentPath: "blood",
        serviceProviderIds: [],
        isActive: true,
    }))
}

/** Whether the provider pool is knowable at all yet — see the header. */
export const PROVIDER_POOL_AVAILABLE = false
