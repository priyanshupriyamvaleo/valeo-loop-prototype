"use client"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Package, Plus, Trash, Wand2 } from "lucide-react"
import { pricedUnitsOf, unitLabel } from "@/lib/composition"
import { buildFulfilments, emptyFulfilment, pathOfFulfilment } from "@/lib/protocol-runtime"
import type { Listing, PricedUnitRef, Protocol, ProtocolFulfilment } from "@/types"

/**
 * THE ORDERS THIS PROTOCOL EXPECTS.
 *
 * It exists because a step's linked unit does NOT identify its order, however
 * much it looks like it should. In the seeded fourteen-step protocol, steps 1
 * and 14 share one unit, steps 7/11/13 share one, steps 8/9/12 share one, and
 * steps 2 and 3 link nothing while being the two most order-driven steps in
 * it. Fourteen steps, eleven orders, six units.
 *
 * `Build the orders from the steps` reads the steps and EXPANDS where the
 * package builder groups: three dispatch steps become three orders, because
 * they arrive on three days and each carries its own status. The result is a
 * draft to correct, not a truth.
 */
export function FulfilmentsCard({
    protocol, listings, onChange,
}: {
    protocol: Protocol
    listings: Listing[]
    onChange: (next: ProtocolFulfilment[]) => void
}) {
    const list = protocol.fulfilments ?? []
    const sellable = listings.filter(l => pricedUnitsOf(l).length > 0)

    const patch = (id: string, p: Partial<ProtocolFulfilment>) =>
        onChange(list.map(f => (f.id === id ? { ...f, ...p } : f)))

    const build = () => {
        const next = buildFulfilments(protocol, listings)
        onChange(next)
        toast.success(`${next.length} order${next.length === 1 ? "" : "s"} read off the steps.`, {
            description: "One per step that links an item, so three dispatches are three orders. "
                + "Correct the labels and point the rest at them.",
        })
    }

    /* The unit picker writes the first priced unit of the listing, the way the
       step's own picker does. The exact unit rarely matters here — what matters
       is which listing, because that gives the order kind. */
    const setUnit = (id: string, listingId: string) => {
        if (listingId === "none") { patch(id, { unit: undefined }); return }
        const l = listings.find(x => x.id === listingId)
        const u = l ? pricedUnitsOf(l)[0] : undefined
        patch(id, { unit: u as PricedUnitRef | undefined })
    }

    return (
        <Card className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="flex items-center gap-2 text-sm font-medium">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        The orders this protocol expects
                    </p>
                    <p className="max-w-2xl text-xs text-muted-foreground">
                        One entry per child order, so three months of dispatch are three entries. A
                        step says which of these it watches. They are listed here and not derived
                        from the steps, because a step&rsquo;s item does not identify its order —
                        three dispatch steps share one item and mean three orders.
                    </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" onClick={build}>
                        <Wand2 className="mr-2 h-3.5 w-3.5" /> Build the orders from the steps
                    </Button>
                    <Button variant="outline" size="sm"
                        onClick={() => onChange([...list, emptyFulfilment()])}>
                        <Plus className="mr-2 h-3.5 w-3.5" /> Add
                    </Button>
                </div>
            </div>

            {list.length === 0 ? (
                <p className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                    No orders yet. Until there is at least one, no step can name what it watches.
                </p>
            ) : (
                <div className="space-y-2">
                    {list.map((f, i) => {
                        const path = pathOfFulfilment(f, listings)
                        return (
                            <div key={f.id} className="flex flex-wrap items-end gap-2 rounded-md border p-2.5">
                                <span className="w-5 shrink-0 pb-2 text-xs tabular-nums text-muted-foreground">
                                    {i + 1}
                                </span>

                                <div className="min-w-[180px] flex-1 space-y-1.5">
                                    <Label className="text-xs">What staff call it</Label>
                                    <Input value={f.label} className="h-8 text-sm"
                                        onChange={e => patch(f.id, { label: e.target.value })}
                                        placeholder="Month 1 pen" />
                                </div>

                                <div className="min-w-[220px] flex-1 space-y-1.5">
                                    <Label className="text-xs">The item it is an order for</Label>
                                    <Select value={f.unit?.listingId ?? "none"}
                                        onValueChange={v => setUnit(f.id, v)}>
                                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Not linked yet</SelectItem>
                                            {sellable.map(l => (
                                                <SelectItem key={l.id} value={l.id}>
                                                    {l.internalName || l.id}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex shrink-0 items-center gap-2 pb-1">
                                    {/* The order KIND, derived. It decides which statuses can
                                        ever occur on this order, so it is worth showing. */}
                                    {path ? (
                                        <Badge variant="outline" className="text-[10px]">
                                            {path.replace("_", " ")}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline"
                                            className="border-amber-200 bg-amber-50 text-[10px] text-amber-800">
                                            kind unknown
                                        </Badge>
                                    )}
                                    {f.unit && (
                                        <span className="max-w-[180px] truncate text-[11px] text-muted-foreground">
                                            {unitLabel(f.unit, listings)}
                                        </span>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-7 w-7"
                                        onClick={() => onChange(list.filter(x => x.id !== f.id))}
                                        aria-label="Delete">
                                        <Trash className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {list.some(f => !f.unit) && (
                <p className="text-xs text-amber-700">
                    An order with no item has no kind, so nothing can check whether the statuses a
                    step waits for can ever occur on it.
                </p>
            )}
        </Card>
    )
}
