"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AlertTriangle, ExternalLink, Trash, Wand2 } from "lucide-react"
import Link from "next/link"
import { NumCell } from "@/components/catalogue/NumCell"
import {
    MONEY, pricedUnitsOf, unitLabel, unitOutOfStock, unitPrice,
} from "@/lib/composition"
import { packageDrift, stepUnits } from "@/lib/protocol-package"
import { unitKey } from "@/lib/protocol-chain"
import { isDemoListing } from "@/lib/package-demo-catalogue"
import type { CompositionResolution } from "@/lib/composition"
import type {
    Composition, CompositionMember, Country, Listing, PricedUnitRef, Protocol,
} from "@/types"

/**
 * WHAT IS INCLUDED — the line-item table.
 *
 * This is the one thing the repo did not have. `CompositionMember.quantity` is
 * honoured by `resolveComposition` and hardcoded to 1 at the only place that
 * writes a member, and no screen has ever shown a line total. So a bundle of
 * three pens priced as one pen looked correct everywhere.
 *
 * EVERY NUMBER COMES FROM THE CATALOGUE. `unitPrice()` is the only price read,
 * and it already returns the figure after the item's OWN discount. There is no
 * per-line discount field here on purpose: an item's discount is authored on
 * the item, and a second lever on the same number is how nobody could say what
 * the package as a whole was discounted by. Where an item has a sticker price
 * above what it charges, the line shows it struck through.
 */
export function PackageLines({
    pkg, protocol, listings, country, cityId, resolution, onChange, onBuildFromSteps,
}: {
    pkg: Composition
    protocol: Protocol
    listings: Listing[]
    country: Country
    cityId?: string
    resolution: CompositionResolution
    onChange: (members: CompositionMember[]) => void
    onBuildFromSteps: () => void
}) {
    const money = MONEY[country]
    /**
     * Money, in the market's own minor units — and only when it has any. A whole
     * figure reads "7,480" and a fractional one reads "3,814.80", because
     * "3,814.8" is not how a price is written. KWD carries three.
     */
    const fmt = (n: number) => {
        const whole = Math.abs(n % 1) < 1e-9
        return n.toLocaleString(undefined, {
            minimumFractionDigits: whole ? 0 : money.minorUnits,
            maximumFractionDigits: money.minorUnits,
        })
    }

    /** The note on a line: which steps put it there, keyed by the unit. */
    const notes = useMemo(() => {
        const m = new Map<string, string>()
        stepUnits(protocol.steps).forEach(u => m.set(unitKey(u.ref), u.note))
        return m
    }, [protocol.steps])

    const drift = useMemo(() => packageDrift(pkg, protocol.steps), [pkg, protocol.steps])
    const sorted = [...pkg.members].sort((a, b) => a.sortOrder - b.sortOrder)

    const patch = (id: string, p: Partial<CompositionMember>) =>
        onChange(pkg.members.map(m => (m.id === id ? { ...m, ...p } : m)))
    const remove = (id: string) =>
        onChange(pkg.members.filter(m => m.id !== id).map((m, i) => ({ ...m, sortOrder: i })))

    /** The sticker price of a unit, when it is above what the unit charges. */
    const wasPrice = (ref: PricedUnitRef, charged: number): number | undefined => {
        const l = listings.find(x => x.id === ref.listingId)
        if (!l) return undefined
        let was: number | undefined
        if (ref.kind === "variant") {
            const v = (l.variants ?? []).find(x => x.id === ref.unitId)
            const r = (v?.regionalData ?? []).find(x => x.country === country)
            was = cityId
                ? r?.cityPrices?.find(c => c.cityId === cityId)?.retailPrice ?? r?.retailPrice
                : r?.retailPrice
        } else if (ref.kind === "service_option") {
            const o = (l.diagnostics?.serviceOptions ?? []).find(x => x.id === ref.unitId)
            was = (o?.pricing ?? []).find(pp =>
                pp.country === country && pp.cityId === cityId)?.retailPrice
                ?? (o?.pricing ?? []).find(pp => pp.country === country && !pp.cityId)?.retailPrice
        } else {
            const pl = (l.treatments?.plans ?? []).find(x => x.id === ref.unitId)
            was = (pl?.pricing ?? []).find(pp =>
                pp.country === country && pp.cityId === cityId)?.compareAtPrice
                ?? (pl?.pricing ?? []).find(pp => pp.country === country && !pp.cityId)?.compareAtPrice
        }
        return was !== undefined && was > charged ? was : undefined
    }

    return (
        <Card className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                    Items · {protocol.steps.length} steps
                </p>
                <Button variant="outline" size="sm" onClick={onBuildFromSteps}>
                    <Wand2 className="mr-2 h-3.5 w-3.5" /> Build from the steps
                </Button>
            </div>

            {/* Drift. Silent when the package and the steps agree. */}
            {(drift.missingFromPackage.length > 0 || drift.extraInPackage.length > 0
                || drift.wrongQuantity.length > 0) && (
                <div className="flex flex-wrap items-start gap-2.5 rounded-md border border-amber-200 bg-amber-50/70 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div className="min-w-0 flex-1 space-y-1 text-xs text-amber-900">
                        {drift.missingFromPackage.length > 0 && (
                            <p>
                                {drift.missingFromPackage.length} item
                                {drift.missingFromPackage.length === 1 ? "" : "s"} the steps
                                deliver are not in the package. Build from the steps to add them.
                            </p>
                        )}
                        {drift.extraInPackage.length > 0 && (
                            <p className="text-rose-800">
                                {drift.extraInPackage.length} item
                                {drift.extraInPackage.length === 1 ? "" : "s"} in the package are
                                delivered by no step. A patient would pay for them and receive nothing.
                            </p>
                        )}
                        {drift.wrongQuantity.map(w => (
                            <p key={w.member.id}>
                                {unitLabel(w.member.ref, listings)} is {w.member.quantity} here and{" "}
                                {w.steps} step{w.steps === 1 ? "" : "s"} deliver it.
                            </p>
                        ))}
                    </div>
                </div>
            )}

            {sorted.length === 0 ? (
                <div className="rounded-md border border-dashed p-10 text-center">
                    <p className="text-sm font-medium">The package is empty</p>
                    <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                        No step links a catalogue item. Link them in the Step Builder.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs uppercase">Service</TableHead>
                                <TableHead className="text-xs uppercase">From which steps</TableHead>
                                <TableHead className="w-24 text-right text-xs uppercase">Qty</TableHead>
                                <TableHead className="w-32 text-right text-xs uppercase">Unit</TableHead>
                                <TableHead className="w-32 text-right text-xs uppercase">Total</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {sorted.map(m => {
                                const l = listings.find(x => x.id === m.ref.listingId)
                                const units = l ? pricedUnitsOf(l) : []
                                const price = unitPrice(m.ref, listings, country, cityId)
                                const qty = m.quantity || 1
                                const was = price !== undefined ? wasPrice(m.ref, price) : undefined
                                const oos = unitOutOfStock(m.ref, listings, country)
                                const note = notes.get(unitKey(m.ref))
                                const blocked = resolution.blocking.some(b => b.member.id === m.id)
                                const droppedOut = resolution.dropped.some(d => d.id === m.id)

                                return (
                                    <TableRow key={m.id} className={droppedOut ? "opacity-60" : ""}>
                                        <TableCell className="py-3 align-top">
                                            <p className="text-sm font-medium">
                                                {unitLabel(m.ref, listings)}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                <Badge variant="outline" className="text-[10px]">
                                                    {m.ref.kind.replace("_", " ")}
                                                </Badge>
                                                {isDemoListing(m.ref.listingId) ? (
                                                    <Badge variant="outline"
                                                        className="border-sky-200 bg-sky-50 text-[10px] text-sky-700"
                                                        title="Priced from the prototype snapshot in this repo, not the live service">
                                                        snapshot
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline"
                                                        className="border-emerald-200 bg-emerald-50 text-[10px] text-emerald-700">
                                                        live
                                                    </Badge>
                                                )}
                                                {!m.required && (
                                                    <Badge variant="outline" className="text-[10px]">optional</Badge>
                                                )}
                                                {oos && (
                                                    <Badge variant="outline"
                                                        className="border-amber-200 bg-amber-50 text-[10px] text-amber-700">
                                                        out of stock
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Which unit of the listing is bought. A listing is a
                                                folder, so this is a real choice — Standard against
                                                Fast Track changes the price. */}
                                            {units.length > 1 && (
                                                <div className="mt-2 w-56">
                                                    <Select value={m.ref.unitId}
                                                        onValueChange={v => patch(m.id, {
                                                            ref: { ...m.ref, unitId: v },
                                                        })}>
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {units.map(u => (
                                                                <SelectItem key={u.ref.unitId} value={u.ref.unitId}>
                                                                    {u.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </TableCell>

                                        <TableCell className="py-3 align-top text-xs text-muted-foreground">
                                            {note ?? (
                                                <span className="text-rose-700">no step delivers this</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="py-3 align-top text-right">
                                            <div className="ml-auto w-16">
                                                <NumCell value={qty}
                                                    onCommit={raw => {
                                                        const n = Math.max(1, Math.round(Number(raw) || 1))
                                                        patch(m.id, { quantity: n })
                                                    }} />
                                            </div>
                                        </TableCell>

                                        <TableCell className="py-3 align-top text-right font-mono text-sm">
                                            {price === undefined ? (
                                                <span className="text-xs text-rose-700">
                                                    {blocked ? "not sold here" : "no price"}
                                                </span>
                                            ) : (
                                                <>
                                                    {was !== undefined && (
                                                        <span className="mr-1.5 text-xs text-muted-foreground line-through">
                                                            {fmt(was)}
                                                        </span>
                                                    )}
                                                    {fmt(price)}
                                                </>
                                            )}
                                        </TableCell>

                                        <TableCell className="py-3 align-top text-right font-mono text-sm">
                                            {price === undefined ? "—" : fmt(price * qty)}
                                        </TableCell>

                                        <TableCell className="py-3 align-top text-right">
                                            <div className="flex flex-col items-end gap-1">
                                                <Button variant="ghost" size="icon" className="h-7 w-7"
                                                    onClick={() => remove(m.id)} title="Remove from the package">
                                                    <Trash className="h-3.5 w-3.5" />
                                                </Button>
                                                {l && (
                                                    <Button variant="ghost" size="icon" className="h-7 w-7" asChild
                                                        title="Open the catalogue item — its own discount is authored there">
                                                        <Link href={`/catalogue/listings/${l.id}`}>
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Link>
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>

                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={4} className="text-sm">
                                    Components at their own list price
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-medium">
                                    {fmt(resolution.memberSubtotal)}
                                </TableCell>
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}

        </Card>
    )
}
