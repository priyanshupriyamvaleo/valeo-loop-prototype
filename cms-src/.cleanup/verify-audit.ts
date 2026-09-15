/**
 * History coverage — run with:  npx tsx .cleanup/verify-audit.ts
 *
 * Two properties, and the second is the one that makes history usable:
 *   1. Every entity records, and records DEEP — a price three levels down must be
 *      named, not summarised as "3 items → 3 items".
 *   2. A save that changes NOTHING must record NOTHING. Otherwise every visit to an
 *      editor writes a row, and the log becomes noise nobody reads.
 */
import { ApiService } from "@/services/api"
import { auditStore } from "@/services/audit"
import { diffEntities, LISTING_LABELS } from "@/lib/audit-diff"

let pass = 0, fail = 0
const t = (name: string, got: unknown, want: unknown) => {
    const ok = JSON.stringify(got) === JSON.stringify(want)
    ok ? pass++ : fail++
    console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${ok ? "" : `\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`)
}
const countFor = async (entityId: string) => (await auditStore.list({ entityId })).length

async function main() {
    const api = ApiService.catalogue

    console.log("── a no-op save records nothing ──")
    const [listings, comps, tags, sales, arts, prs] = await Promise.all([
        api.listings(), api.compositions(), api.tags(), api.flashSales(), api.articles(), api.healthTeam(),
    ])
    const banners = await api.promoBanners()
    const rets = await api.retentionTemplates()

    const cases: { label: string; id: string; save: () => Promise<unknown> }[] = [
        { label: "listing", id: listings[0].id, save: () => api.updateListing(listings[0].id, {}) },
        { label: "composition", id: comps[0].id, save: () => api.updateComposition(comps[0].id, {}) },
        { label: "tag", id: tags[0].id, save: () => api.updateTag(tags[0].id, {}) },
        { label: "flashSale", id: sales[0].id, save: () => api.updateFlashSale(sales[0].id, {}) },
        { label: "article", id: arts[0].id, save: () => api.updateArticle(arts[0].id, {}) },
        { label: "practitioner", id: prs[0].id, save: () => api.updatePractitioner(prs[0].id, {}) },
        { label: "promoBanner", id: banners[0].id, save: () => api.updatePromoBanner(banners[0].id, {}) },
        { label: "retentionTemplate", id: rets[0].id, save: () => api.updateRetentionTemplate(rets[0].id, {}) },
    ]
    for (const c of cases) {
        const before = await countFor(c.id)
        await c.save()
        await c.save()
        t(`${c.label}: two empty saves add no rows`, await countFor(c.id), before)
    }

    console.log("\n── every entity records a real edit ──")
    for (const c of cases) {
        const before = await countFor(c.id)
        await api.audit.list({})
        // a real, harmless edit per entity type
        if (c.label === "listing") await api.updateListing(c.id, { brand: `Brand ${Date.now()}` })
        if (c.label === "composition") await api.updateComposition(c.id, { nameEn: `N ${Date.now()}` })
        if (c.label === "tag") await api.updateTag(c.id, { nameEn: `T ${Date.now()}` })
        if (c.label === "flashSale") await api.updateFlashSale(c.id, { name: `S ${Date.now()}` })
        if (c.label === "article") await api.updateArticle(c.id, { titleEn: `A ${Date.now()}` })
        if (c.label === "practitioner") await api.updatePractitioner(c.id, { nameEn: `P ${Date.now()}` })
        if (c.label === "promoBanner") await api.updatePromoBanner(c.id, { name: `B ${Date.now()}` })
        if (c.label === "retentionTemplate") await api.updateRetentionTemplate(c.id, { name: `R ${Date.now()}` })
        t(`${c.label}: a real edit is recorded`, (await countFor(c.id)) > before, true)
    }

    console.log("\n── depth: money three levels down is NAMED, not summarised ──")
    const l = listings.find(x => x.id === "p1")!
    const deeper = {
        ...l,
        variants: (l.variants ?? []).map(v => (v.id !== "v-d3-60" ? v : {
            ...v,
            regionalData: (v.regionalData ?? []).map(r => (r.country === "UAE" ? { ...r, price: 189 } : r)),
        })),
    }
    const d = diffEntities(l, deeper, LISTING_LABELS)
    t("exactly one row for a one-price change", d.length, 1)
    console.log(`      → ${d[0]?.label}: ${d[0]?.oldValue} → ${d[0]?.newValue}`)
    t("row names the variant and the market", /^Variants › .*Capsules › Regional data › UAE › Price$/.test(d[0]?.label ?? ""), true)
    t("carries the actual numbers", [d[0]?.oldValue, d[0]?.newValue], ["89", "189"])

    console.log("\n── depth: a scope row price and a retirement are both visible ──")
    const c0 = comps.find(x => x.id === "cmp-sleep-combo")!
    const moved = { ...c0, scopes: (c0.scopes ?? []).map(s => (s.country === "UAE" ? { ...s, price: 949, isActive: false } : s)) }
    const ds = diffEntities(c0, moved, LISTING_LABELS)
    ds.forEach(r => console.log(`      → ${r.label}: ${r.oldValue} → ${r.newValue}`))
    t("price change named per market", ds.some(r => /^Markets › UAE › Price$/.test(r.label) && r.newValue === "949"), true)
    t("retirement named per market", ds.some(r => /^Markets › UAE › Active$/.test(r.label) && r.newValue === "No"), true)

    console.log("\n── a member swap at EQUAL count is no longer invisible ──")
    const swapped = { ...c0, members: c0.members.map((m, i) => (i === 1 ? { ...m, quantity: 3 } : m)) }
    const dm = diffEntities(c0, swapped, LISTING_LABELS)
    t("quantity change recorded", dm.some(r => /Members.*Quantity/.test(r.label)), true)
    const removed = { ...c0, members: c0.members.slice(0, 2) }
    const drm = diffEntities(c0, removed, LISTING_LABELS)
    // the renderer reads an EXACT "—" to tell added from removed from changed, so the
    // differ must emit that sentinel and nothing decorated
    t("removal uses the bare sentinel the renderer reads", drm.some(r => r.newValue === "—"), true)
    const addedM = { ...c0, members: [...c0.members, { ...c0.members[0], id: "mX" }] }
    t("addition uses the bare sentinel", diffEntities(c0, addedM, LISTING_LABELS).some(r => r.oldValue === "—"), true)

    console.log("\n── nested rows carry a pre-split path so the audit page can group them ──")
    const dp = diffEntities(l, deeper, LISTING_LABELS)
    t("path is present and split", dp[0].path, ["Variants", "60 Capsules", "Regional data", "UAE", "Price"])
    t("label is the joined path", dp[0].label, dp[0].path!.join(" › "))
    t("leaf is the last segment", dp[0].path![dp[0].path!.length - 1], "Price")
    const flat = diffEntities({ brand: "A" }, { brand: "B" })
    t("top-level changes carry no path", flat[0].path, undefined)
    // two edits under the SAME parent must share a group key
    const two = {
        ...l,
        variants: (l.variants ?? []).map(v => (v.id !== "v-d3-60" ? v : {
            ...v,
            regionalData: (v.regionalData ?? []).map(r => (r.country === "UAE" ? { ...r, price: 189, sku: "NEW-SKU" } : r)),
        })),
    }
    const dt = diffEntities(l, two, LISTING_LABELS)
    const parents = new Set(dt.map(r => (r.path ?? []).slice(0, -1).join(" › ")))
    t("both edits share one parent group", parents.size, 1)
    t("group is the parent path", [...parents][0], "Variants › 60 Capsules › Regional data › UAE")

    console.log("\n── unkeyed collections fall back to a summary, never index matching ──")
    const un = diffEntities({ xs: [{ a: 1 }, { a: 2 }] }, { xs: [{ a: 9 }, { a: 2 }] })
    t("one summary row, not two invented ones", un.length, 1)

    console.log("\n── the row cap holds ──")
    const big = { vs: Array.from({ length: 200 }, (_, i) => ({ id: `v${i}`, p: 1 })) }
    const big2 = { vs: big.vs.map(v => ({ ...v, p: 2 })) }
    const dc = diffEntities(big, big2)
    t("capped at 40 + one overflow row", dc.length, 41)
    t("overflow row says so", dc[40].label, "More changes")

    console.log(`\n${pass} passed, ${fail} failed`)
    if (fail) process.exit(1)
}
main().catch(e => { console.error(e); process.exit(1) })
