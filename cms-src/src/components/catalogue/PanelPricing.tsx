"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Coins, AlertTriangle } from "lucide-react"
import { CountrySwitcher } from "@/components/catalogue/CountrySwitcher"
import { componentPrice } from "@/lib/cyot"
import type { Biomarker, BiomarkerPanel, Country, CyotComponentPrice } from "@/types"

/**
 * What a panel COSTS — never what it is priced at.
 *
 * ⚠️ A PANEL HAS NO PRICE, and this screen deliberately gives it no field to
 * type one into. A panel is a clinical grouping: it has no SKU, raises no
 * invoice line, and is not sellable. Two things do carry money, and neither is
 * the panel:
 *
 *   · a PACKAGE that includes the panel — priced on its own pricing sheet, per
 *     variant per city, because the package is the sellable thing
 *   · the panel's MEMBERS in build-your-own — each has a component price, and
 *     choosing the panel charges the deduplicated union of them
 *
 * So what is useful here is the sum of the second: pick this panel in a basket
 * and this is what it adds. Read-only and derived, because the moment a panel
 * gets an editable price it has two — its own and its members' — and they drift.
 */
export function PanelPricing({ panel, biomarkers, prices, countries }: {
    panel: BiomarkerPanel
    biomarkers: Biomarker[]
    prices: CyotComponentPrice[]
    countries: Country[]
}) {
    const [active, setActive] = useState<Country | null>(countries[0] ?? null)
    const byId = useMemo(() => new Map(biomarkers.map(b => [b.id, b])), [biomarkers])

    const perCountry = useMemo(() => countries.map(country => {
        let total = 0
        const unpriced: string[] = []
        let derived = 0
        for (const id of panel.memberIds) {
            const b = byId.get(id)
            if (!b) continue
            // A calculated value consumes no specimen. It can still carry a
            // component price, but it is not what makes the basket cost money.
            if (b.isDerived) derived++
            const { price } = componentPrice(id, { country }, prices)
            if (price === undefined) unpriced.push(b.nameEn)
            else total += price
        }
        return { country, total, unpriced, derived }
    }), [countries, panel.memberIds, byId, prices])

    const shown = perCountry.find(p => p.country === active) ?? perCountry[0]
    if (!shown) return null

    return (
        <div className="space-y-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                    <Coins className="h-4 w-4 text-muted-foreground" />
                    What this panel adds to a basket
                </span>
                <Badge variant="outline" className="text-[10px]">read-only · derived</Badge>
            </div>

            <p className="text-xs text-muted-foreground">
                A panel has no price of its own — it is not sellable. This is the sum of its
                members&rsquo; build-your-own component prices, which is what picking it in a
                basket adds. A package that includes this panel is priced on{" "}
                <strong>the package&rsquo;s own pricing sheet</strong>, per variant per city.
            </p>

            {countries.length > 0 && active && (
                <CountrySwitcher countries={countries} value={active} onChange={setActive}
                    counts={Object.fromEntries(perCountry.map(p =>
                        [p.country, p.unpriced.length ? `${p.total}+` : p.total],
                    )) as Partial<Record<Country, string | number>>} />
            )}

            <div className="flex flex-wrap items-baseline gap-4">
                <span>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                        Component sum in {shown.country}
                    </span>
                    <span className="text-lg font-semibold tabular-nums">
                        {shown.total}{shown.unpriced.length ? "+" : ""}
                    </span>
                </span>
                <span>
                    <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Members</span>
                    <span className="text-sm tabular-nums">{panel.memberIds.length}</span>
                </span>
                {shown.derived > 0 && (
                    <span>
                        <span className="block text-[10px] uppercase tracking-wider text-muted-foreground">Calculated</span>
                        <span className="text-sm tabular-nums">{shown.derived}</span>
                    </span>
                )}
            </div>

            {shown.unpriced.length > 0 && (
                <p className="flex gap-2 rounded border-l-2 border-amber-400 bg-amber-50/60 px-2.5 py-2 text-[11px] text-amber-900">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                        {shown.unpriced.length} member{shown.unpriced.length === 1 ? " has" : "s have"} no
                        component price in {shown.country}, so the sum is a floor and not the real total:{" "}
                        {shown.unpriced.slice(0, 4).join(", ")}
                        {shown.unpriced.length > 4 ? ` and ${shown.unpriced.length - 4} more` : ""}. Set them on{" "}
                        <Link href="/catalogue/cyot" className="underline">Create Your Own Test → Component prices</Link>.
                    </span>
                </p>
            )}
        </div>
    )
}
