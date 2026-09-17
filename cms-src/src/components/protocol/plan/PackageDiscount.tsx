"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MONEY, fmtMoney } from "@/lib/composition"
import type { CompositionResolution } from "@/lib/composition"
import type { Country } from "@/types"

/**
 * THE OVERALL DISCOUNT, AND NOTHING ELSE.
 *
 * One number for the whole package, in every market it sells in. The card it
 * replaces also held a live window, a split strategy and a full VAT invoice
 * table. Those describe how a sale is booked, not what it costs, and they made
 * the pricing screen twice as long as the question it answers.
 *
 * The three lines below the field are the same arithmetic the sheet foots,
 * for the market on screen.
 */
export function PackageDiscount({
    country, where, percent, onPercent, resolution,
}: {
    country: Country
    /** The column the figures describe — a city name, or the country. */
    where: string
    percent?: number
    onPercent: (percent?: number) => void
    resolution: CompositionResolution
}) {
    const money = MONEY[country]
    const fmt = (n: number) => fmtMoney(country, n)

    return (
        <Card className="space-y-4 p-5">
            <div>
                <p className="text-base font-semibold">Overall discount</p>
                <p className="mt-0.5 max-w-3xl text-xs text-muted-foreground">
                    One number for the whole package. It applies in every market the package
                    sells in, so the money it takes off differs by column only because the
                    subtotals do.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_320px]">
                <div className="space-y-1.5">
                    <Label className="text-xs">Percent off the items</Label>
                    <div className="flex items-center gap-2">
                        <Input type="number" min={0} max={100} className="h-9 w-24" placeholder="0"
                            value={percent ?? ""}
                            onChange={e => onPercent(
                                e.target.value === "" ? undefined : Number(e.target.value))} />
                        <span className="text-sm text-muted-foreground">%</span>
                    </div>
                </div>

                <div className="space-y-2 rounded-md border bg-muted/30 p-4">
                    <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        {where}
                    </p>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Items at their own price</span>
                        <span className="font-mono">{fmt(resolution.memberSubtotal)}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-mono text-emerald-700">
                            {resolution.savings === undefined ? "—" : `−${fmt(resolution.savings)}`}
                        </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 border-t pt-2">
                        <span className="text-sm font-medium">Price on the cart</span>
                        <span className="font-mono text-lg font-semibold">
                            {resolution.total === undefined
                                ? <span className="text-sm font-normal text-rose-700">no price</span>
                                : `${money.code} ${fmt(resolution.total)}`}
                        </span>
                    </div>
                    {resolution.total === undefined && (
                        <p className="text-xs text-amber-700">
                            {resolution.blocking.length > 0
                                ? `${resolution.blocking.length} item${resolution.blocking.length === 1 ? " is" : "s are"} not sold in ${where}.`
                                : `${where} is not a market for this package yet.`}
                        </p>
                    )}
                </div>
            </div>
        </Card>
    )
}
