"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { MONEY, fromMarketInstant, toMarketInstant } from "@/lib/composition"
import { STRATEGIES, invoiceTable } from "@/lib/protocol-package"
import type { CompositionResolution } from "@/lib/composition"
import type { DiscountStrategy } from "@/lib/protocol-package"
import type {
    Composition, CompositionScope, Country, Listing, SubDepartment,
} from "@/types"

/**
 * THE DISCOUNT, ITS WINDOW, AND HOW IT SPLITS.
 *
 * The number belongs to the market row being edited — country, or a city where
 * a city needs its own — and it is typed on the line it changes. Typing it
 * CREATES that row, because a discount for a market is a statement that the
 * package sells there. It cannot make anything live on its own: a row with no
 * number yields no total, and the publish rules refuse that.
 */
export function PackagePrice({
    pkg, country, cityId, cityName, resolution, onScopes, onStrategy,
}: {
    pkg: Composition
    country: Country
    cityId?: string
    cityName?: string
    resolution: CompositionResolution
    onScopes: (scopes: CompositionScope[]) => void
    onStrategy: (s: DiscountStrategy) => void
}) {
    const money = MONEY[country]
    const fmt = (n: number) => {
        const whole = Math.abs(n % 1) < 1e-9
        return n.toLocaleString(undefined, {
            minimumFractionDigits: whole ? 0 : money.minorUnits,
            maximumFractionDigits: money.minorUnits,
        })
    }

    /* The row being edited: the city row when a city is chosen, else the
       country row. `effectiveScope` merges city over country when it prices. */
    const row = pkg.scopes.find(sc =>
        sc.country === country && (cityId ? sc.cityId === cityId : !sc.cityId))
    const where = cityName ?? country

    const setRow = (patch: Partial<CompositionScope>) => {
        if (row) {
            onScopes(pkg.scopes.map(sc => (sc.id === row.id ? { ...sc, ...patch } : sc)))
            return
        }
        onScopes([...pkg.scopes, {
            id: `sc-${pkg.id}-${country}${cityId ? `-${cityId}` : ""}-${Date.now().toString(36)}`,
            country, cityId, isActive: true, ...patch,
        }])
    }

    const strategy: DiscountStrategy = pkg.rule.allocation ?? "pro_rata_list"

    return (
        <>
            {/* ══ THE DISCOUNT ══ */}
            <Card className="space-y-4 p-5">
                <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                    Discount · {where}
                </p>

                <div className="grid gap-4 md:grid-cols-[1fr_320px]">
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Overall discount</Label>
                                <div className="flex items-center gap-2">
                                    <Input type="number" min={0} max={100}
                                        className="h-9 w-20"
                                        placeholder="0"
                                        value={row?.percent ?? ""}
                                        onChange={e => setRow({
                                            percent: e.target.value === "" ? undefined : Number(e.target.value),
                                        })} />
                                    <span className="text-sm text-muted-foreground">%</span>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Live from</Label>
                                <Input type="datetime-local" className="h-9 w-[210px]"
                                    value={row?.startsAt ? fromMarketInstant(row.startsAt, country) : ""}
                                    onChange={e => setRow({
                                        startsAt: e.target.value
                                            ? toMarketInstant(e.target.value, country)
                                            : undefined,
                                    })} />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Live until</Label>
                                <Input type="datetime-local" className="h-9 w-[210px]"
                                    value={row?.endsAt ? fromMarketInstant(row.endsAt, country) : ""}
                                    onChange={e => setRow({
                                        endsAt: e.target.value
                                            ? toMarketInstant(e.target.value, country)
                                            : undefined,
                                    })} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs">How the discount splits across the items</Label>
                            <Select value={strategy}
                                onValueChange={v => onStrategy(v as DiscountStrategy)}>
                                <SelectTrigger className="h-9 w-[240px]"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {STRATEGIES.map(st => (
                                        <SelectItem key={st.id} value={st.id}>{st.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {STRATEGIES.find(st => st.id === strategy)?.blurb}
                            </p>
                        </div>
                    </div>

                    {/* The arithmetic. */}
                    <div className="space-y-2 rounded-md border bg-muted/30 p-4">
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
                        {resolution.total === undefined ? (
                            <p className="text-xs text-amber-700">
                                {resolution.blocking.length > 0
                                    ? `${resolution.blocking.length} item${resolution.blocking.length === 1 ? " is" : "s are"} not sold in ${where}.`
                                    : `Type a discount and ${where} becomes a market for this package.`}
                            </p>
                        ) : cityId && !row ? (
                            /* An empty box beside a real price needs explaining: the
                               city has no row, so it inherits the country's. Typing
                               here gives Dubai its own number. */
                            <p className="text-xs text-muted-foreground">
                                {where} has no discount of its own and inherits {country}&rsquo;s.
                                Type one to give it its own.
                            </p>
                        ) : null}
                    </div>
                </div>
            </Card>
        </>
    )
}

/**
 * INVOICING AND TAX.
 *
 * A package sells for one number and invoices as many lines, so the discount is
 * split back across them by the chosen strategy. Where it lands is not
 * cosmetic: a consultation invoices from DMCC at 5% and a GLP-1 pen from Shifa
 * at 0%, so the split changes what each entity books and what tax is charged.
 *
 * The last line absorbs the rounding, because an invoice that does not foot is
 * worse than one whose last line is a fils off.
 */
export function PackageInvoice({
    pkg, listings, subDepartments, country, cityId, resolution,
}: {
    pkg: Composition
    listings: Listing[]
    subDepartments: SubDepartment[]
    country: Country
    cityId?: string
    resolution: CompositionResolution
}) {
    const money = MONEY[country]
    const fmt = (n: number) => {
        const whole = Math.abs(n % 1) < 1e-9
        return n.toLocaleString(undefined, {
            minimumFractionDigits: whole ? 0 : money.minorUnits,
            maximumFractionDigits: money.minorUnits,
        })
    }
    const inv = invoiceTable(pkg, listings, subDepartments, country, cityId, resolution.total)

    return (
        <Card className="space-y-3 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                    Invoicing and tax
                </p>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">
                        {STRATEGIES.find(s => s.id === inv.strategy)?.label}
                    </Badge>
                    {inv.byEntity.length > 1 && (
                        <Badge variant="outline"
                            className="border-amber-200 bg-amber-50 text-[10px] text-amber-700">
                            {inv.byEntity.length} entities
                        </Badge>
                    )}
                </div>
            </div>

            {pkg.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items to invoice.</p>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs uppercase">Item</TableHead>
                                <TableHead className="text-xs uppercase">Entity</TableHead>
                                <TableHead className="w-24 text-right text-xs uppercase">Gross</TableHead>
                                <TableHead className="w-28 text-right text-xs uppercase">Discount</TableHead>
                                <TableHead className="w-24 text-right text-xs uppercase">Net</TableHead>
                                <TableHead className="w-16 text-right text-xs uppercase">VAT</TableHead>
                                <TableHead className="w-24 text-right text-xs uppercase">Tax</TableHead>
                                <TableHead className="w-28 text-right text-xs uppercase">Total</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {inv.lines.map(l => (
                                <TableRow key={l.memberId} className={l.invoiced ? "" : "opacity-60"}>
                                    <TableCell className="py-2.5 text-sm">
                                        {l.label}
                                        {l.qty > 1 && (
                                            <span className="ml-1.5 text-xs text-muted-foreground">× {l.qty}</span>
                                        )}
                                        {l.note && (
                                            <p className="text-xs text-rose-700">{l.note}</p>
                                        )}
                                    </TableCell>
                                    <TableCell className="py-2.5">
                                        <span className="font-mono text-xs">{l.entity ?? "—"}</span>
                                    </TableCell>
                                    <TableCell className="py-2.5 text-right font-mono text-sm">
                                        {l.gross === 0 ? "—" : fmt(l.gross)}
                                    </TableCell>
                                    <TableCell className="py-2.5 text-right font-mono text-sm text-emerald-700">
                                        {l.discount === 0 ? "—" : `−${fmt(l.discount)}`}
                                    </TableCell>
                                    <TableCell className="py-2.5 text-right font-mono text-sm">
                                        {fmt(l.net)}
                                    </TableCell>
                                    <TableCell className="py-2.5 text-right font-mono text-xs text-muted-foreground">
                                        {l.vatRate === undefined ? "—" : `${l.vatRate}%`}
                                    </TableCell>
                                    <TableCell className="py-2.5 text-right font-mono text-sm">
                                        {fmt(l.vat)}
                                    </TableCell>
                                    <TableCell className="py-2.5 text-right font-mono text-sm font-medium">
                                        {fmt(l.total)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>

                        <TableFooter>
                            <TableRow>
                                <TableCell colSpan={2} className="text-sm font-medium">
                                    {money.code}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">{fmt(inv.gross)}</TableCell>
                                <TableCell className="text-right font-mono text-sm text-emerald-700">
                                    {inv.discount === 0 ? "—" : `−${fmt(inv.discount)}`}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm">{fmt(inv.net)}</TableCell>
                                <TableCell />
                                <TableCell className="text-right font-mono text-sm">{fmt(inv.vat)}</TableCell>
                                <TableCell className="text-right font-mono text-sm font-semibold">
                                    {fmt(inv.total)}
                                </TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            )}

            {/* Per entity, because that is what each one books. */}
            {inv.byEntity.length > 1 && (
                <div className="space-y-1 rounded-md border bg-muted/30 p-3">
                    {inv.byEntity.map(e => (
                        <div key={e.entity} className="flex items-baseline justify-between gap-3 text-xs">
                            <span className="font-mono">{e.entity}</span>
                            <span className="font-mono text-muted-foreground">
                                net {fmt(e.net)} · tax {fmt(e.vat)} · total {fmt(e.total)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    )
}
