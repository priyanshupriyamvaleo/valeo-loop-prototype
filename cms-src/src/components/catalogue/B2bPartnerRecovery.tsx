"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Building2 } from "lucide-react"
import type { CataloguePartner, Listing } from "@/types"
import { ApiService } from "@/services/api"
import { b2bGaps, partnerAccessFor, proposeB2b } from "@/lib/partner-import"

/**
 * The legacy admin sold to a corporate client by duplicating the whole listing
 * and appending the client's name — "Dr. Therese Ward" and "Dr. Therese Ward
 * DEWA" are the same consultation at two prices. Three of the four DEWA
 * listings are exactly that.
 *
 * This spots the pattern and offers the fix: move the partner into a field, and
 * either merge into the consumer listing or convert this one in place. It never
 * acts on its own — merging two listings, one of which might be live, is not
 * something to automate.
 */
export function B2bPartnerRecovery({ listing, onChange, onGoToPartners }: {
    listing: Listing
    onChange: (patch: Partial<Listing>) => void
    onGoToPartners?: () => void
}) {
    const [partners, setPartners] = useState<CataloguePartner[]>([])
    const [allListings, setAllListings] = useState<Listing[]>([])

    useEffect(() => {
        let alive = true
        void Promise.all([
            ApiService.catalogue.partners(),
            ApiService.catalogue.listings(),
        ]).then(([p, l]) => { if (alive) { setPartners(p); setAllListings(l) } })
            .catch(() => { /* panel just stays quiet */ })
        return () => { alive = false }
    }, [])

    const proposal = useMemo(
        () => (partners.length ? proposeB2b(listing, allListings, partners) : undefined),
        [listing, allListings, partners],
    )
    const gaps = useMemo(
        () => (partners.length ? b2bGaps(listing, partners) : []),
        [listing, partners],
    )

    const attached = listing.partnerAccess ?? []
    const attachedNames = attached
        .map(a => partners.find(p => p.id === a.partnerId)?.name ?? a.partnerId)

    if (!proposal && attached.length === 0 && gaps.length === 0) return null

    return (
        <div className="rounded-md border bg-muted/10 p-3">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold">
                <Building2 className="h-3 w-3" /> B2B / partner
            </p>

            {attached.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {attachedNames.map(n => (
                        <Badge key={n} variant="outline" className="text-[10px]">{n}</Badge>
                    ))}
                    {listing.partnerExclusive && (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-[10px] text-amber-700">
                            exclusive — not public
                        </Badge>
                    )}
                </div>
            )}

            {proposal && (
                <div className="mt-2 space-y-1">
                    <p className="text-[10px] text-muted-foreground">
                        The title names <span className="font-medium">{proposal.partner.name}</span> (from
                        &ldquo;{proposal.evidence}&rdquo;). A partner belongs in a field, not in the product name.
                    </p>
                    {proposal.action === "merge-into-twin" ? (
                        <p className="text-[10px] text-muted-foreground">
                            &ldquo;{proposal.twin?.displayNameEn}&rdquo; already exists — this record is a duplicate
                            that only exists because legacy had nowhere to put a partner price. Attach the
                            partner there and retire this one.
                        </p>
                    ) : (
                        <p className="text-[10px] text-muted-foreground">
                            No consumer twin exists, so convert this record in place: rename it to
                            &ldquo;{proposal.cleanName}&rdquo; and mark it exclusive to {proposal.partner.code}.
                        </p>
                    )}
                    <div className="flex flex-wrap gap-2 pt-1">
                        {proposal.action === "convert-in-place" && (
                            <Button size="sm" variant="outline" className="h-7 text-[10px]"
                                onClick={() => onChange({
                                    displayNameEn: proposal.cleanName,
                                    partnerExclusive: true,
                                    partnerAccess: [
                                        ...attached.filter(a => a.partnerId !== proposal.partner.id),
                                        partnerAccessFor(proposal.partner.id),
                                    ],
                                })}>
                                Convert to {proposal.partner.code}-exclusive
                            </Button>
                        )}
                        {proposal.action === "merge-into-twin" && (
                            <Button size="sm" variant="outline" className="h-7 text-[10px]"
                                onClick={() => onChange({ status: "archived" })}>
                                Archive this duplicate
                            </Button>
                        )}
                        {onGoToPartners && (
                            <Button size="sm" variant="ghost" className="h-7 text-[10px]" onClick={onGoToPartners}>
                                Open Partner Access →
                            </Button>
                        )}
                    </div>
                </div>
            )}

            {gaps.length > 0 && (
                <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2">
                    <p className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-800">
                        <AlertTriangle className="h-3 w-3" /> {gaps.length} to fix
                    </p>
                    <ul className="mt-0.5 space-y-0.5">
                        {gaps.map(g => <li key={g} className="text-[10px] text-amber-800">· {g}</li>)}
                    </ul>
                </div>
            )}
        </div>
    )
}
