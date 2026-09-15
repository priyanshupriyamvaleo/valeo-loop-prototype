// Run: npx tsx --tsconfig tsconfig.smoke.json .cleanup/verify-audit-render.tsx  (needs jsx: react-jsx)
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { AuditDiffRows } from "@/components/audit/AuditDiffRows"
import { AuditLogTable } from "@/components/audit/AuditLogTable"
import { diffEntities, LISTING_LABELS } from "@/lib/audit-diff"
import { ApiService } from "@/services/api"
import type { AuditLogEntry } from "@/types"

let pass = 0, fail = 0
const t = (n: string, got: unknown, want: unknown) => {
    const ok = JSON.stringify(got) === JSON.stringify(want)
    ok ? pass++ : fail++
    console.log(`${ok ? "  ok  " : "  FAIL"} ${n}${ok ? "" : `\n        got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

async function main() {
    const listings = await ApiService.catalogue.listings()
    const l = listings.find(x => x.id === "p1")!
    // two edits under one parent + one top-level edit
    const after = {
        ...l, brand: "New Brand",
        variants: (l.variants ?? []).map(v => (v.id !== "v-d3-60" ? v : {
            ...v,
            regionalData: (v.regionalData ?? []).map(r => (r.country === "UAE" ? { ...r, price: 189, sku: "NEW" } : r)),
        })),
    }
    const changes = diffEntities(l, after, LISTING_LABELS)
    const html = renderToStaticMarkup(React.createElement(AuditDiffRows, { changes }))

    const parent = "Variants › 60 Capsules › Regional data › UAE"
    const occurrences = html.split(parent).length - 1
    t("parent path rendered exactly once, not per row", occurrences, 1)
    t("leaf 'Price' rendered", html.includes(">Price<"), true)
    t("leaf 'Sku' rendered", /S(ku|KU)/.test(html), true)
    t("full path NOT repeated inside a row label", html.includes(`>${parent} › Price<`), false)
    t("top-level change still renders its own label", html.includes("Brand"), true)
    t("old and new values present", html.includes("189") && html.includes("89"), true)

    // added / removed classification through the real sentinel
    const rm = diffEntities({ xs: [{ id: "a", v: 1 }] }, { xs: [] })
    const rmHtml = renderToStaticMarkup(React.createElement(AuditDiffRows, { changes: rm }))
    t("a removal renders the Removed badge", rmHtml.includes("Removed"), true)
    t("a removal is not mislabelled Changed", rmHtml.includes("Changed"), false)
    const ad = diffEntities({ xs: [] }, { xs: [{ id: "a", v: 1 }] })
    const adHtml = renderToStaticMarkup(React.createElement(AuditDiffRows, { changes: ad }))
    t("an addition renders the Added badge", adHtml.includes("Added"), true)
    t("an addition is not mislabelled Changed", adHtml.includes("Changed"), false)

    // overflow row renders as a note, not a green "Added"
    const big = { vs: Array.from({ length: 200 }, (_, i) => ({ id: `v${i}`, p: 1 })) }
    const bigHtml = renderToStaticMarkup(React.createElement(AuditDiffRows, {
        changes: diffEntities(big, { vs: big.vs.map(v => ({ ...v, p: 2 })) }),
    }))
    t("overflow renders as an italic note", bigHtml.includes("open the entity to see the rest"), true)

    // the whole table, with a real nested entry
    const entry: AuditLogEntry = {
        id: "aud-x", entityType: "listing", entityId: l.id, entityName: l.displayNameEn ?? "x",
        action: "update", actor: { id: "u1", name: "Ritwik Gupta", role: "PM" },
        timestamp: new Date().toISOString(), changes,
    }
    const table = renderToStaticMarkup(React.createElement(AuditLogTable, { entries: [entry] }))
    console.log("      SUMMARY CELL:", (table.match(/[0-9]+ fields?:[^<]*/) ?? ["<none>"])[0])
    console.log("      LABELS:", JSON.stringify(changes.map(c => c.label)))
    t("table renders the collapsed summary", /Variants: (SKU|Price)/.test(table), true)
    t("summary is not the raw full path", table.includes(`${parent} › Price,`), false)

    console.log(`\n${pass} passed, ${fail} failed`)
    if (fail) process.exit(1)
}
main().catch(e => { console.error(e); process.exit(1) })
