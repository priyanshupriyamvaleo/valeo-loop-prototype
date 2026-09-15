/**
 * End-to-end: an edit made through the API surfaces in the per-entity history that
 * the editors render. Run: npx tsx .cleanup/verify-history-ui.ts
 */
import { ApiService } from "@/services/api"

async function main() {
    const api = ApiService.catalogue
    const listings = await api.listings()
    const l = listings.find(x => x.id === "p1")!
    // change one variant's UAE price, three levels down
    await api.updateListing(l.id, {
        variants: (l.variants ?? []).map(v => (v.id !== "v-d3-60" ? v : {
            ...v,
            regionalData: (v.regionalData ?? []).map(r => (r.country === "UAE" ? { ...r, price: 189 } : r)),
        })),
    })
    const rows = await api.audit.list({ entityType: "listing", entityId: l.id, limit: 5 })
    console.log(`history rows for ${l.displayNameEn}: ${rows.length}`)
    rows[0].changes.forEach(c => console.log(`  ${c.label}: ${c.oldValue} → ${c.newValue}`))
    const ok = rows[0].changes.some(c =>
        c.label.includes("UAE") && c.label.includes("Price") && c.newValue === "189")
    // and the composition that prices off it
    const comps = await api.compositions()
    await api.updateComposition("cmp-sleep-combo", {
        scopes: (comps.find(c => c.id === "cmp-sleep-combo")!.scopes ?? [])
            .map(s => (s.country === "UAE" ? { ...s, price: 949 } : s)),
    })
    const crows = await api.audit.list({ entityType: "composition", entityId: "cmp-sleep-combo", limit: 3 })
    console.log(`\nhistory rows for Sleep Reset Combo: ${crows.length}`)
    crows[0].changes.forEach(c => console.log(`  ${c.label}: ${c.oldValue} → ${c.newValue}`))
    const cok = crows[0].changes.some(c => c.label.includes("UAE") && c.newValue === "949")
    console.log(`\n${ok && cok ? "PASS" : "FAIL"} — a price three levels down, and a per-market bundle price, both named in history`)
    if (!(ok && cok)) process.exit(1)
}
main().catch(e => { console.error(e); process.exit(1) })
