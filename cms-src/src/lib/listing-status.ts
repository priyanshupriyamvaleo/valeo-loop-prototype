import { ProductStatus } from "@/types"

/**
 * ── The four listing states ────────────────────────────────────────────────────
 * Status alone decides two independent things — whether the URL resolves, and
 * whether the listing appears in browse. There is deliberately no separate
 * "visibility" concept: "Inactive" already means live URL, delisted from browse,
 * which is exactly what an unlisted flag used to express. One field, four states,
 * no combinations that contradict each other.
 */
export interface ListingStatusMeta {
    id: ProductStatus
    /** What operators see. */
    label: string
    /** Does the public URL resolve in production? */
    urlLive: boolean
    /** Does it appear on category pages, search and any other listing surface? */
    inBrowse: boolean
    blurb: string
    className: string
}

export const LISTING_STATUSES: ListingStatusMeta[] = [
    {
        id: "draft", label: "Draft", urlLive: false, inBrowse: false,
        blurb: "Not live anywhere. The URL does not resolve.",
        className: "bg-slate-100 text-slate-700 border-slate-200",
    },
    {
        id: "active", label: "Published", urlLive: true, inBrowse: true,
        blurb: "Live. URL resolves and the listing appears in categories and search.",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    {
        id: "inactive", label: "Inactive", urlLive: true, inBrowse: false,
        blurb: "URL still resolves — existing links and ads keep working — but the listing is removed from every category page, search result and other surface.",
        className: "bg-amber-100 text-amber-700 border-amber-200",
    },
    {
        id: "archived", label: "Archived", urlLive: false, inBrowse: false,
        blurb: "Retired. The URL stops resolving. Nothing is deleted — history and reporting survive.",
        className: "bg-rose-100 text-rose-700 border-rose-200",
    },
]

export function statusMeta(s: ProductStatus): ListingStatusMeta {
    return LISTING_STATUSES.find(x => x.id === s) ?? LISTING_STATUSES[0]
}

/** One line an operator can act on, e.g. next to the status control. */
export function statusEffect(s: ProductStatus): string {
    const m = statusMeta(s)
    return `${m.urlLive ? "URL live" : "URL does not resolve"} · ${m.inBrowse ? "shown in browse" : "not in browse"}`
}

/**
 * Preprod renders EVERY state, including Draft and Archived, so content can be
 * reviewed before it is published and after it is retired. Production honours
 * urlLive. Never let preprod behaviour leak into production — that is how an
 * unfinished draft becomes indexable.
 */
export function resolvesOn(s: ProductStatus, env: "production" | "preprod"): boolean {
    return env === "preprod" ? true : statusMeta(s).urlLive
}
