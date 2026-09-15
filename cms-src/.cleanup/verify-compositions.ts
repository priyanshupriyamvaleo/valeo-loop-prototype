/**
 * Composition invariants — run with:  npx tsx .cleanup/verify-compositions.ts
 *
 * These are the checks `tsc` cannot make. Every one of them corresponds to a defect
 * that was actually found: a bundle priced above its own members, a freebie that
 * granted one unit and deducted one when quantity was two, a duplicate scope row
 * served by whichever `.find` hit first, a wall-clock window three hours out in
 * three of the four markets, and an add-on served on the one panel that forbids it.
 */
import { ApiService } from "@/services/api"
import { compositionGaps, compositionNotes, eligibleParents, MONEY, roundMoney } from "@/lib/composition"
import {
    effectiveScope, resolveComposition, scopeDecision, scopeHygiene,
    toMarketInstant, fromMarketInstant, marketOffset, memberCityCoverage,
} from "@/lib/composition"
import { Composition, CompositionScope } from "@/types"

let pass = 0, fail = 0
const t = (name: string, got: unknown, want: unknown) => {
    const ok = JSON.stringify(got) === JSON.stringify(want)
    ok ? pass++ : fail++
    console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${ok ? "" : `\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`)
}

async function main() {
    const listings = await ApiService.catalogue.listings()
    const comps = await ApiService.catalogue.compositions()
    const base = comps.find(c => c.id === "cmp-sleep-combo")!

    const mk = (scopes: CompositionScope[]): Composition => ({ ...base, scopes, status: "active" })

    console.log("── city override merge ──")
    const withCity = mk([
        { id: "a", country: "UAE", isActive: true, price: 899 },
        { id: "b", country: "UAE", cityId: "c-dubai", isActive: true, price: 949 },
    ])
    t("city row wins", effectiveScope(withCity, "UAE", "c-dubai").row?.price, 949)
    t("city level reported", effectiveScope(withCity, "UAE", "c-dubai").level, "city")
    t("country row for other city", effectiveScope(withCity, "UAE", "c-abudhabi").row?.price, 899)
    t("no city arg = country row", effectiveScope(withCity, "UAE").row?.price, 899)

    console.log("── inherit: city row overrides window, INHERITS price ──")
    const inherit = mk([
        { id: "a", country: "UAE", isActive: true, price: 899 },
        { id: "b", country: "UAE", cityId: "c-dubai", isActive: true, endsAt: "2026-12-31T23:59:00+04:00" },
    ])
    const im = effectiveScope(inherit, "UAE", "c-dubai").row!
    t("price inherited", im.price, 899)
    t("window overridden", im.endsAt, "2026-12-31T23:59:00+04:00")
    t("isActive from matched row", im.isActive, true)

    console.log("── retired city row falls back, does NOT carry its own isActive ──")
    const retiredCity = mk([
        { id: "a", country: "UAE", isActive: true, price: 899 },
        { id: "b", country: "UAE", cityId: "c-dubai", isActive: false, price: 949 },
    ])
    const rc = effectiveScope(retiredCity, "UAE", "c-dubai")
    t("falls back to country price", rc.row?.price, 899)
    t("level is country", rc.level, "country")

    console.log("── country retirement CASCADES to cities ──")
    const closed = mk([
        { id: "a", country: "UAE", isActive: false, price: 899 },
        { id: "b", country: "UAE", cityId: "c-dubai", isActive: true, price: 949 },
    ])
    t("country closed flag", effectiveScope(closed, "UAE", "c-dubai").countryClosed, true)
    t("resolves to no total", resolveComposition(closed, listings, "UAE", { cityId: "c-dubai" }).total, undefined)
    const d = scopeDecision(closed, listings, { country: "UAE", cityId: "c-dubai" })
    t("scopeDecision country_closed", d.live === false && d.reason, "country_closed")

    console.log("── cities_only parent does not sell country-wide ──")
    const co = mk([
        { id: "a", country: "UAE", isActive: true, price: 899, coverage: "cities_only" },
        { id: "b", country: "UAE", cityId: "c-dubai", isActive: true },
    ])
    t("no city = closed", effectiveScope(co, "UAE").countryClosed, true)
    t("named city sells", effectiveScope(co, "UAE", "c-dubai").row?.price, 899)

    console.log("── duplicate key is deterministic, not first-wins ──")
    const dup = mk([
        { id: "a", country: "UAE", isActive: true, price: 899 },
        { id: "a2", country: "UAE", isActive: true, price: 777 },
    ])
    t("duplicate detected", effectiveScope(dup, "UAE").duplicate, true)
    t("no price served", resolveComposition(dup, listings, "UAE").total, undefined)
    t("hygiene reports it", scopeHygiene(dup).some(x => x.includes("two rows share")), true)

    console.log("── hygiene: rot the rule never reads ──")
    const rot = { ...mk([{ id: "a", country: "UAE", isActive: true, price: 899, percent: 20 }]), rule: { kind: "bundle_price" as const } }
    t("percent under bundle_price flagged", scopeHygiene(rot).some(x => x.includes("percent is set")), true)
    const orphan = mk([{ id: "b", country: "KUWAIT", cityId: "c-x", isActive: true, price: 5 }])
    t("orphan city row flagged", scopeHygiene(orphan).some(x => x.includes("no country row")), true)

    console.log("── window uses instants, per market ──")
    const win = mk([{ id: "a", country: "UAE", isActive: true, price: 899, startsAt: "2099-01-01T09:00:00+04:00" }])
    const wd = scopeDecision(win, listings, { country: "UAE" })
    t("future window blocks", wd.live === false && wd.reason, "before_window")
    t("UAE offset", marketOffset("UAE"), "+04:00")
    t("KSA offset", marketOffset("KSA"), "+03:00")
    const rt = toMarketInstant("2026-09-01T09:00", "UAE")
    t("9am Dubai stores offset", rt, "2026-09-01T09:00:00+04:00")
    t("round-trips", fromMarketInstant(rt, "UAE"), "2026-09-01T09:00")

    console.log("── grant quantity: 2 free units deduct 2 ──")
    const free = comps.find(c => c.id === "cmp-collagen-free")!
    const q2: Composition = {
        ...free, status: "active",
        members: free.members.map(m => (m.id === "f2" ? { ...m, quantity: 2 } : m)),
    }
    const r2 = resolveComposition(q2, listings, "UAE")
    t("granted value doubles", r2.grantedValue, 178)
    t("total still the IV only", r2.total, 95)

    console.log("── audience is per market ──")
    const aud = mk([
        { id: "a", country: "UAE", isActive: true, price: 899, audience: { kind: "partner_exclusive", partnerIds: ["p-emaar"] } },
        { id: "b", country: "KSA", isActive: true, price: 1090 },
    ])
    t("no partner id fails UAE", (() => { const x = scopeDecision(aud, listings, { country: "UAE" }); return x.live === false && x.reason })(), "audience")
    t("right partner passes UAE", scopeDecision(aud, listings, { country: "UAE", partnerId: "p-emaar" }).live, true)
    t("KSA stays public", scopeDecision(aud, listings, { country: "KSA" }).live, true)

    console.log("── city coverage is derived and honest ──")
    const blood = base.members[0]
    t("diagnostics city known", memberCityCoverage(blood, listings, "UAE", "c-dubai"), "covered")
    t("variant is unknown at city level", memberCityCoverage(base.members[1], listings, "UAE", "c-dubai"), "unknown_country_granular")


    console.log("── drift separates a price move from a membership move ──")
    const stamped: Composition = {
        ...base, status: "active",
        scopes: [{
            id: "d1", country: "UAE", isActive: true, price: 899,
            basisSubtotal: 993.1, basisMemberIds: base.members.map(m => m.id),
            setAt: "2026-01-01T00:00:00+04:00",
        }],
    }
    t("no drift when nothing moved", resolveComposition(stamped, listings, "UAE").driftPct, 0)
    // bump one member's UAE price 89 -> 189, so the subtotal rises 100 on a 993.10 base
    const bumped = listings.map(l => (l.id !== "p1" ? l : {
        ...l,
        variants: (l.variants ?? []).map(v => (v.id !== "v-d3-60" ? v : {
            ...v,
            regionalData: (v.regionalData ?? []).map(r => (r.country === "UAE" ? { ...r, price: 189 } : r)),
        })),
    }))
    const rb = resolveComposition(stamped, bumped, "UAE")
    t("subtotal reflects the rise", rb.memberSubtotal, 1093.1)
    t("drift is signed and correct", rb.driftPct, 10.1)
    t("membership not blamed for a price move", rb.membershipChanged, undefined)
    // adding a member moves the subtotal too — that must NOT read as price drift
    const added: Composition = {
        ...stamped,
        members: [...stamped.members, {
            id: "m4", ref: base.members[1].ref, quantity: 1, required: false, sortOrder: 3,
        }],
    }
    const ra = resolveComposition(added, listings, "UAE")
    t("membership change flagged", ra.membershipChanged, true)
    t("no fabricated drift percentage", ra.driftPct, undefined)
    // a row with no baseline must say so, never "0%"
    const noBasis = mk([{ id: "n1", country: "UAE", isActive: true, price: 899 }])
    t("no baseline = no drift number", resolveComposition(noBasis, listings, "UAE").driftPct, undefined)

    console.log("\n── every seeded composition, every market ──")
    const subs = await ApiService.catalogue.subDepartments()
    const COUNTRIES = ["UAE", "KSA", "QATAR", "KUWAIT"] as const
    for (const c of comps) {
        const gaps = compositionGaps(c, listings, subs)
        console.log(`  ${c.id} (${c.kind}/${c.rule.kind}) — publishable: ${gaps.length === 0 ? "YES" : "NO"}`)
        gaps.forEach(g => console.log(`      gap: ${g}`))
        compositionNotes(c, listings, subs).forEach(n => console.log(`      note: ${n}`))
        if (c.trigger.kind === "attach_to") console.log(`      eligible parents: [${eligibleParents(c, listings).join(", ") || "NONE"}]`)
        for (const ct of COUNTRIES) {
            const r = resolveComposition(c, listings, ct)
            // A NaN subtotal would compare false against every total, so the inversion
            // gap would stop firing silently. Guards the whole class in one assertion.
            t(`${c.id}/${ct} subtotal finite`, Number.isFinite(r.memberSubtotal), true)
            const row = (c.scopes ?? []).find(s => s.country === ct && !s.cityId)
            const state = r.total !== undefined ? `${MONEY[ct].code} ${r.total}`
                : !row ? "not sold" : row.isActive === false ? "retired"
                : r.blocking.length ? `blocked(${r.blocking.length})` : "no price"
            console.log(`      ${ct.padEnd(7)} ${state.padEnd(14)} subtotal=${r.memberSubtotal} save=${r.savings ?? "-"} granted=${r.grantedValue ?? "-"}`)
        }
    }
    // The two seeds that must stay publishable, and the one that must not.
    t("sleep combo publishable", compositionGaps(comps.find(c => c.id === "cmp-sleep-combo")!, listings, subs).length, 0)
    t("collagen freebie publishable", compositionGaps(comps.find(c => c.id === "cmp-collagen-free")!, listings, subs).length, 0)
    t("vitd addon blocked by the parent's clinical veto",
        compositionGaps(comps.find(c => c.id === "cmp-vitd-addon")!, listings, subs).some(g => g.includes("No eligible parent")), true)
    t("KWD rounds to 3 decimals", roundMoney("KUWAIT", 1.2345), 1.235)
    t("AED rounds to 2", roundMoney("UAE", 1.2345), 1.23)

    console.log(`\n${pass} passed, ${fail} failed`)
    if (fail) process.exit(1)
}
main().catch(e => { console.error(e); process.exit(1) })
