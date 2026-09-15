// ── GET /products — the listings list ─────────────────────────
//
// The screen was client-side: fetch every listing, then filter and page in
// memory. This endpoint filters and pages SERVER-side, which is the right shape
// for 1560 rows but changes what the screen can do.
//
// ⚠️ FOUR OF THE SCREEN'S FILTERS CANNOT BE SERVED.
// They test data the list row does not carry, so they cannot be sent and cannot
// be applied afterwards either — filtering a page AFTER paging gives short pages
// and a wrong total, which is worse than not offering the filter:
//
//   · tags      → l.tagIds       (no tag data on product_master at all)
//   · country   → l.countryConfig (per-country availability is its own endpoint)
//   · surface   → l.visibleOn     (classification has it; the LIST row does not)
//   · flags     → predicates over a whole Listing
//
// The screen disables them and says why rather than silently returning wrong
// results. Surface is the one that is cheap to fix properly: adding
// isVisibleApp/isVisibleWeb to ProductListRowResponse would make it servable.

import { api, type PageMeta } from "./client"
import type { LocalizedText } from "./taxonomy"

export interface ProductListRow {
    productId: number
    uid: string | null
    internalName: string | null
    name: LocalizedText | null
    subDepartment: { id: number; code: string; name?: LocalizedText | null } | null
    department: { id: number; code: string; name?: LocalizedText | null } | null
    status: string | null
    updatedAt: string | null
}

export type ProductSort = "UPDATED" | "NAME" | "UID"

export interface ProductListParams {
    departmentId?: number
    subDepartmentId?: number
    /** Repeated on the wire as ?status=A&status=B. Empty means every status. */
    status?: string[]
    q?: string
    /** Zero-based, matching the service. The screen is one-based — convert at the edge. */
    page?: number
    pageSize?: number
    sort?: ProductSort
}

export interface ProductListPage {
    rows: ProductListRow[]
    meta: PageMeta | null
}

export async function fetchProducts(params: ProductListParams = {},
                                    signal?: AbortSignal): Promise<ProductListPage> {
    const qs = new URLSearchParams()
    if (params.departmentId != null) qs.set("departmentId", String(params.departmentId))
    if (params.subDepartmentId != null) qs.set("subDepartmentId", String(params.subDepartmentId))
    // Repeated key, not a comma-joined value — @ModelAttribute binds a List from
    // repeated params and would read "DRAFT,ACTIVE" as one unparseable enum.
    for (const s of params.status ?? []) qs.append("status", s)
    if (params.q?.trim()) qs.set("q", params.q.trim())
    if (params.page != null) qs.set("page", String(params.page))
    if (params.pageSize != null) qs.set("pageSize", String(params.pageSize))
    if (params.sort) qs.set("sort", params.sort)

    const query = qs.toString()
    const res = await api.getPaged<ProductListRow>(`products${query ? `?${query}` : ""}`, signal)
    return { rows: res.data, meta: res.meta }
}

/** Which of the screen's filters this endpoint can actually serve. */
export const SERVER_FILTERS = ["department", "subDepartment", "status", "search"] as const
export const UNSERVABLE_FILTERS: Record<string, string> = {
    tags: "Tags are not on the product record — the service has no tag data.",
    country: "Per-country availability is its own endpoint, not a column on the list.",
    surface: "The list row carries no app/web flags yet (classification does).",
    flags: "Work-queue flags are computed from a whole listing, not from a list row.",
}


// ── API row → the shape the table already renders ─────────────
//
// Mapped into Listing rather than changing the table: it renders six fields and
// the service supplies all six. The rest of a Listing stays at its defaults,
// which is honest — this is a LIST row, not a loaded product.

import { CODE_TO_SUB_DEPARTMENT_ID } from "@/lib/taxonomy"
import { departmentOf } from "./taxonomy"
import type { Listing, ProductStatus } from "@/types"

/**
 * Service status → the screen's own vocabulary.
 *
 * ⚠️ The two sets are NOT the same size. ProductStatus server-side is
 * DRAFT | ACTIVE | ARCHIVED; the screen also has "inactive", which has no
 * server equivalent. So "inactive" can never arrive here, and asking the server
 * to filter by it is meaningless — {@link toServerStatus} returns undefined for
 * it so the caller can decline rather than send something the API rejects.
 */
const STATUS_FROM_SERVER: Record<string, ProductStatus> = {
    DRAFT: "draft",
    ACTIVE: "active",
    ARCHIVED: "archived",
}

export function toServerStatus(local: string): string | undefined {
    const found = Object.entries(STATUS_FROM_SERVER).find(([, v]) => v === local)
    return found?.[0]
}

/** True when the screen's status filter cannot be expressed server-side. */
export const isUnservableStatus = (local: string) =>
    local !== "all" && toServerStatus(local) === undefined

export function toListingRow(row: ProductListRow): Listing {
    const subCode = row.subDepartment?.code
    return {
        id: String(row.productId),
        // Kept TRUTHFUL — empty when the service says empty. Putting the uid in here
        // (an earlier attempt at the blank-row problem) duplicated it onto both lines of
        // the cell and, worse, handed a uid to everything downstream that reads
        // internalName. The fallback belongs in the rendering, not in the data.
        internalName: row.internalName ?? "",
        displayNameEn: row.name?.en ?? "",
        displayNameAr: row.name?.ar ?? "",
        department: row.department?.code ? departmentOf(row.department.code) : "health_products",
        // Back to the slug the screen looks names up by. An unknown code keeps the
        // code itself so the row still renders something identifiable.
        subDepartmentId: (subCode && CODE_TO_SUB_DEPARTMENT_ID[subCode]) || subCode || "",
        status: (row.status && STATUS_FROM_SERVER[row.status]) ?? "draft",
        apiProductId: row.productId,
        apiUid: row.uid ?? undefined,
    } as Listing
}
