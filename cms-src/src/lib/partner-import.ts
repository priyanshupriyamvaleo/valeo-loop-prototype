// ── Recovering B2B partners from legacy titles ────────────────
// The legacy admin sold a consultation to a corporate client by DUPLICATING the
// whole listing and appending the client's name:
//
//   "Dr. Therese Ward"        ← the consumer listing
//   "Dr. Therese Ward DEWA"   ← the same thing, priced for DEWA
//
// Three of the four DEWA listings are exactly this. That is what partnerAccess
// exists to remove: one listing, with DEWA carrying its own price, rather than a
// second listing to keep in sync forever.
//
// Same discipline as the title parser — this PROPOSES and shows its evidence.
// Silently merging two listings, one of which may be live, is not a thing to
// automate.

import type { CataloguePartner, Listing, PartnerAccessEntry } from "@/types"

export interface PartnerInTitle {
    partner: CataloguePartner
    /** The matched substring, e.g. "DEWA". */
    evidence: string
    /** Title with the partner name removed — what the listing should be called. */
    cleanName: string
}

/**
 * Finds a known partner named in a listing title. Matched on the partner CODE as
 * a whole word: a substring match would see "NOON" inside "afternoon".
 */
export function partnerInTitle(
    title: string, partners: CataloguePartner[],
): PartnerInTitle | undefined {
    const name = (title ?? "").trim()
    if (!name) return undefined

    for (const partner of partners) {
        const code = (partner.code ?? "").trim()
        if (code.length < 3) continue // too short to match safely
        const re = new RegExp(`\\b${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
        const hit = name.match(re)
        if (!hit) continue
        return {
            partner,
            evidence: hit[0],
            cleanName: name.replace(re, " ").replace(/\s{2,}/g, " ").trim(),
        }
    }
    return undefined
}

export interface B2bProposal {
    partner: CataloguePartner
    evidence: string
    /** What the listing should be named once the partner moves into a field. */
    cleanName: string
    /**
     * The consumer listing this one duplicates, if there is one. Present means
     * the right move is to attach the partner THERE and retire this duplicate.
     */
    twin?: Listing
    action: "merge-into-twin" | "convert-in-place"
}

/**
 * Works out what to do with a listing whose title names a partner.
 *
 * With a twin: attach partner access to the twin and retire this record — the
 * duplicate exists only because legacy had nowhere to put a partner price.
 * Without one: convert this record in place into a partner-exclusive listing.
 */
export function proposeB2b(
    listing: Listing, all: Listing[], partners: CataloguePartner[],
): B2bProposal | undefined {
    const found = partnerInTitle(listing.displayNameEn || listing.internalName, partners)
    if (!found) return undefined

    const key = found.cleanName.trim().toLowerCase()
    const twin = all.find(l =>
        l.id !== listing.id
        && (l.displayNameEn || "").trim().toLowerCase() === key)

    return {
        partner: found.partner,
        evidence: found.evidence,
        cleanName: found.cleanName,
        twin,
        action: twin ? "merge-into-twin" : "convert-in-place",
    }
}

/** The partner-access entry a proposal implies. */
export function partnerAccessFor(partnerId: string): PartnerAccessEntry {
    return { partnerId, accessType: "owner", exclusive: true, pricing: [] }
}

/**
 * What is wrong with a listing's B2B setup. A partner-exclusive listing with no
 * partner is invisible to everyone; with no partner price it falls back to
 * consumer pricing, which is the opposite of a negotiated rate.
 */
export function b2bGaps(listing: Listing, partners: CataloguePartner[]): string[] {
    const g: string[] = []
    const access = listing.partnerAccess ?? []
    const exclusive = listing.partnerExclusive || access.some(a => a.exclusive)

    if (exclusive && access.length === 0) {
        g.push("Marked partner-exclusive but no partner is attached — nobody can see it")
    }

    access.forEach(a => {
        const p = partners.find(x => x.id === a.partnerId)
        if (!p) { g.push(`Partner "${a.partnerId}" no longer exists`); return }
        if (!p.isActive) g.push(`"${p.name}" is inactive, so its pricing will not resolve`)
        if ((a.pricing ?? []).length === 0) {
            g.push(`"${p.name}" has no negotiated price — it would fall back to the consumer price`)
        }
        // A partner scoped to one market cannot be sold in another.
        const partnerCountries = p.countries ?? []
        if (partnerCountries.length > 0) {
            (listing.countryConfig ?? [])
                .filter(c => c.status === "active" && !partnerCountries.includes(c.country))
                .forEach(c => g.push(`Sold in ${c.country}, but "${p.name}" only operates in ${partnerCountries.join(", ")}`))
        }
    })

    // The isolation rule: a negotiated corporate rate is not a public offer.
    if (exclusive && listing.visibleOn && listing.status === "active") {
        g.push("Partner-exclusive and live — confirm it is hidden from public browse")
    }
    return g
}
