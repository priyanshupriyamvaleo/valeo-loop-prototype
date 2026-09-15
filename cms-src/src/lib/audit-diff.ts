import { AuditChange } from "@/types"

/**
 * Pure before→after diff for audit logging. No store dependency.
 *
 * HISTORY AT EVERY LEVEL. This used to stop at the top level: a collection was
 * compared whole and reported as "Variants: 3 items → 3 items", which records that
 * *something* changed while destroying the only useful part — what. Money lives
 * three levels down in this catalogue (`variants[].regionalData[].price`,
 * `diagnostics.serviceOptions[].pricing[]`, `treatments.plans[].pricing[]`,
 * `scopes[].price`), so a shallow diff cannot describe a price change at all.
 *
 * It now descends, and names what it walks through:
 *
 *   Variants › 60 Capsules › Regional data › UAE › Price      89 → 189
 *   Scopes › KSA › Is active                                  Yes → No
 *
 * Two rules keep it from exploding:
 *   · a collection is only descended into when every item has an id that is UNIQUE
 *     WITHIN THAT COLLECTION — otherwise items cannot be matched and index matching
 *     would report one insertion as N changes. Unkeyed collections fall back to the
 *     old single summary row, which is honest about being a summary.
 *   · a hard row cap, with one overflow row saying how many were not itemised, so a
 *     bulk edit cannot write thousands of rows.
 */

const SKIP = new Set(["id", "createdAt", "updatedAt"])
const MAX_ROWS = 40

function isEmpty(v: unknown): boolean {
    if (v === undefined || v === null || v === "") return true
    if (Array.isArray(v)) return v.length === 0
    if (typeof v === "object") return Object.keys(v as object).length === 0
    return false
}

// JSON.stringify with recursively sorted object keys → order-independent compare.
function stableStringify(v: unknown): string {
    return JSON.stringify(v, (_k, val) => {
        if (val && typeof val === "object" && !Array.isArray(val)) {
            return Object.keys(val as Record<string, unknown>).sort().reduce((acc, k) => {
                acc[k] = (val as Record<string, unknown>)[k]
                return acc
            }, {} as Record<string, unknown>)
        }
        return val
    })
}

function equal(a: unknown, b: unknown): boolean {
    if (isEmpty(a) && isEmpty(b)) return true
    if (isEmpty(a) !== isEmpty(b)) return false
    if (typeof a === "object" || typeof b === "object") return stableStringify(a) === stableStringify(b)
    return a === b
}

function humanize(k: string): string {
    let key = k
    let suffix = ""
    if (key.endsWith("En")) { key = key.slice(0, -2); suffix = " (EN)" }
    else if (key.endsWith("Ar")) { key = key.slice(0, -2); suffix = " (AR)" }
    const words = key.replace(/([A-Z])/g, " $1").replace(/[_-]+/g, " ").trim()
    return words.charAt(0).toUpperCase() + words.slice(1) + suffix
}

function trunc(s: string, n: number): string {
    return s.length > n ? s.slice(0, n - 1) + "…" : s
}

function fmt(v: unknown): string {
    if (isEmpty(v)) return "—"
    if (typeof v === "boolean") return v ? "Yes" : "No"
    if (typeof v === "number") return String(v)
    if (typeof v === "string") return trunc(v, 120)
    if (Array.isArray(v)) {
        const allPrimitive = v.every(x => x === null || typeof x !== "object")
        if (allPrimitive) return trunc(v.join(", "), 120)
        return `${v.length} item${v.length === 1 ? "" : "s"}: ${trunc(stableStringify(v), 80)}`
    }
    return trunc(stableStringify(v), 80)
}

function isPlainObject(v: unknown): boolean {
    return !!v && typeof v === "object" && !Array.isArray(v)
}

/** What identifies a row inside its own collection. `country` covers the price tables. */
function itemKey(item: unknown): string | undefined {
    if (!isPlainObject(item)) return undefined
    const o = item as Record<string, unknown>
    const id = o.id
    if (typeof id === "string" && id) return id
    // the four shipped price/slot tables are keyed (country, cityId?) rather than by id
    if (typeof o.country === "string" && o.country) {
        return typeof o.cityId === "string" && o.cityId ? `${o.country}/${o.cityId}` : o.country
    }
    return undefined
}

/** How a row should read to a human: its own label, never its id when it has a name. */
function itemName(item: unknown): string {
    if (!isPlainObject(item)) return "item"
    const o = item as Record<string, unknown>
    for (const k of [
        "variantLabelEn", "labelEn", "displayNameEn", "nameEn", "titleEn", "name", "label",
    ]) {
        const v = o[k]
        if (typeof v === "string" && v) return trunc(v, 40)
    }
    if (typeof o.country === "string" && o.country) {
        return typeof o.cityId === "string" && o.cityId ? `${o.country} / ${o.cityId}` : o.country
    }
    const id = o.id
    return typeof id === "string" && id ? id : "item"
}

/**
 * A Map of key→item, but ONLY when every item has a key and no key repeats. A
 * duplicate or missing key means the collection cannot be matched item-for-item, and
 * guessing by position would misreport an insertion as a change to every later row.
 */
function keyMap(arr: unknown[]): Map<string, unknown> | undefined {
    const m = new Map<string, unknown>()
    for (const item of arr) {
        const k = itemKey(item)
        if (!k || m.has(k)) return undefined
        m.set(k, item)
    }
    return m
}

type Seg = { seg: string; kind: "field" | "item" }

export interface DiffOptions {
    labels?: Record<string, string>
    ignore?: string[]
    maxRows?: number
}

function pathParts(path: Seg[], labels?: Record<string, string>): string[] {
    return path.map(p => (p.kind === "item" ? p.seg : labels?.[p.seg] ?? humanize(p.seg)))
}

/** Every emitted row carries the pre-split path so renderers can group by parent. */
function row(
    path: Seg[], opt: DiffOptions, oldValue: string, newValue: string,
): AuditChange {
    const parts = pathParts(path, opt.labels)
    return {
        field: pathField(path), label: parts.join(" › "),
        oldValue, newValue,
        ...(parts.length > 1 ? { path: parts } : {}),
    }
}

function pathField(path: Seg[]): string {
    return path.map(p => p.seg).join(".")
}

function walk(
    path: Seg[], ov: unknown, nv: unknown, out: AuditChange[], opt: DiffOptions, max: number,
): void {
    if (out.length >= max) return
    if (equal(ov, nv)) return

    if (Array.isArray(ov) || Array.isArray(nv)) {
        const a = Array.isArray(ov) ? ov : []
        const b = Array.isArray(nv) ? nv : []
        const ka = keyMap(a)
        const kb = keyMap(b)
        if (ka && kb) {
            for (const [k, item] of ka) {
                if (out.length >= max) return
                if (!kb.has(k)) {
                    const p = [...path, { seg: itemName(item), kind: "item" as const }]
                    out.push(row(p, opt, fmt(item), "—"))
                }
            }
            for (const [k, item] of kb) {
                if (out.length >= max) return
                const p = [...path, { seg: itemName(item), kind: "item" as const }]
                if (!ka.has(k)) {
                    out.push(row(p, opt, "—", fmt(item)))
                } else {
                    walk(p, ka.get(k), item, out, opt, max)
                }
            }
            return
        }
        // unkeyed: one honest summary row rather than N invented ones
        out.push(row(path, opt, fmt(ov), fmt(nv)))
        return
    }

    if (isPlainObject(ov) && isPlainObject(nv)) {
        const keys = new Set([
            ...Object.keys(ov as object), ...Object.keys(nv as object),
        ])
        for (const k of keys) {
            if (out.length >= max) return
            if (SKIP.has(k) || (opt.ignore ?? []).includes(k)) continue
            walk(
                [...path, { seg: k, kind: "field" }],
                (ov as Record<string, unknown>)[k], (nv as Record<string, unknown>)[k],
                out, opt, max,
            )
        }
        return
    }

    out.push(row(path, opt, fmt(ov), fmt(nv)))
}

/**
 * ONE differ for every entity in the CMS. Mutators must not hand-roll a field
 * whitelist — a whitelist is exactly the mechanism by which history silently omits
 * whatever nobody remembered to add to it.
 */
export function diffEntities<T extends object>(
    before: Partial<T> | null | undefined,
    after: Partial<T>,
    labelMap?: Record<string, string>,
    ignore: string[] = [],
    maxRows: number = MAX_ROWS,
): AuditChange[] {
    const opt: DiffOptions = { labels: labelMap, ignore }
    const out: AuditChange[] = []
    const keys = new Set<string>([...Object.keys(before ?? {}), ...Object.keys(after)])
    for (const k of keys) {
        if (SKIP.has(k) || ignore.includes(k)) continue
        if (out.length >= maxRows) break
        walk(
            [{ seg: k, kind: "field" }],
            (before as Record<string, unknown> | null | undefined)?.[k],
            (after as Record<string, unknown>)[k],
            out, opt, maxRows,
        )
    }
    if (out.length >= maxRows) {
        out.push({
            field: "_overflow", label: "More changes",
            oldValue: "—", newValue: `capped at ${maxRows} itemised rows`,
        })
    }
    return out
}

// Human labels for field names, at any depth (unmapped keys fall back to humanize()).
export const LISTING_LABELS: Record<string, string> = {
    internalName: "Internal Name", displayNameEn: "Display Name (EN)", displayNameAr: "Display Name (AR)",
    brand: "Brand", department: "Department", subDepartmentId: "Sub-department", fulfilmentPath: "Fulfilment Path",
    categoryManagerId: "Category Manager", internalCategoryId: "Internal Category / Feature", status: "Status",
    visibility: "Visibility", visibleOn: "Visible On", primarySubCategoryId: "Primary Sub-category",
    subCategoryIds: "Sub-category Placements", journeyIds: "Journeys",
    subscriptionEnabled: "Subscription Enabled", subscriptionFrequencies: "Subscription Frequencies",
    subscriptionDiscountPct: "Subscription Discount %", consultationAddonEnabled: "Consultation Add-on",
    consultationAddonPrice: "Consultation Price", consultationAddonListingId: "Linked Consultation",
    giftWrappingEnabled: "Gift Wrapping", giftWrappingPrice: "Gift Wrapping Price",
    descriptionEn: "Description (EN)", descriptionAr: "Description (AR)",
    variants: "Variants", benefits: "Benefits", ingredients: "Ingredients", faq: "FAQ",
    mediaGallery: "Media Gallery", superiorityBlock: "Why Superior", partnerExclusive: "Partner-exclusive",
    partnerAccess: "Partner Access", countryConfig: "Country Availability",
    // nested — money and availability live down here, which is the point
    regionalData: "Regional data", cityPrices: "City prices", pricing: "Pricing",
    serviceOptions: "Service options", slotMappings: "Slot mappings", biomarkers: "Biomarkers",
    plans: "Treatment plans", scopes: "Markets", members: "Members", rule: "Pricing rule",
    licences: "Licences", isAvailable: "Available", isActive: "Active",
    warehouseStock: "Stock", price: "Price", vat: "VAT %", sku: "SKU",
}

// Left empty now that emptyListing()/seeds share listingDefaults() — kept as an escape hatch.
export const LISTING_AUDIT_IGNORE: string[] = []
