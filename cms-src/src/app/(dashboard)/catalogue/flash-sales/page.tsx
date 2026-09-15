"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { EntityHistory } from "@/components/audit/EntityHistory"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, Zap, ChevronRight, AlertTriangle, Info } from "lucide-react"
import { ApiService } from "@/services/api"
import { Category, Country, FlashSale, FlashSaleRule, Listing, Tag } from "@/types"
import {
    SALE_STATE_META, effectivePrice, flashSaleGaps, listingInSale, saleState,
} from "@/lib/flash-sales"
import { toast } from "sonner"

const COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT", "OTHERS"]
/** datetime-local wants "YYYY-MM-DDTHH:mm", not a full ISO string. */
const toLocal = (iso: string) => (iso ? iso.slice(0, 16) : "")

export default function FlashSalesPage() {
    const [sales, setSales] = useState<FlashSale[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [listings, setListings] = useState<Listing[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [open, setOpen] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    const reload = () => ApiService.catalogue.flashSales().then(setSales)
    useEffect(() => {
        Promise.all([
            ApiService.catalogue.flashSales(),
            ApiService.catalogue.tags(),
            ApiService.catalogue.listings(),
            ApiService.catalogue.categories(),
        ]).then(([s, t, l, c]) => { setSales(s); setTags(t); setListings(l); setCategories(c); setLoading(false) })
    }, [])

    const campaignTags = useMemo(() => tags.filter(t => t.namespace === "campaign"), [tags])

    const patch = async (id: string, p: Partial<FlashSale>) => {
        const next = await ApiService.catalogue.updateFlashSale(id, p)
        setSales(prev => prev.map(s => (s.id === id ? next : s)))
    }
    const create = async () => {
        const created = await ApiService.catalogue.createFlashSale({ createdByName: "Catalogue Ops" })
        toast.success("Draft flash sale created")
        setSales(prev => [created, ...prev]); setOpen(created.id)
    }

    /** Everything the sale currently prices — the number that matters before launch. */
    const inScope = (sale: FlashSale) => listings.filter(l => listingInSale(l, sale))
    const excluded = (sale: FlashSale) => inScope(sale).filter(l => l.discountable === false)

    return (
        <div className="space-y-5 pb-16">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl space-y-1">
                    <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <Zap className="h-5 w-5 text-primary" /> Flash Sales
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Time-boxed pricing that never touches a listing. Listings keep their real price; the read path
                        applies the sale while the window is open and stops on its own when it closes.
                    </p>
                </div>
                <Button size="sm" className="h-9" onClick={create}>
                    <Plus className="mr-2 h-4 w-4" /> New Flash Sale
                </Button>
            </div>

            <Card className="border-l-4 border-l-amber-500 p-3">
                <p className="text-xs font-semibold">Why sale pricing is not set on the listing</p>
                <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                    <p>A listing is <strong>permanent</strong>; a sale is hours or days. Writing the sale price onto
                        the listing loses the original and relies on someone remembering to undo it.</p>
                    <p>One sale covers many listings. Per-listing pricing means <strong>N edits to launch and N to
                        end</strong> — and a half-ended sale.</p>
                    <p>This is how <code className="rounded bg-muted px-1">50% OFF</code> and{" "}
                        <code className="rounded bg-muted px-1">Under 99 AED</code> became permanent
                        <strong> categories</strong> in the old catalogue. A discount is not a taxonomy node.</p>
                </div>
            </Card>

            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : sales.map(sale => {
                const state = saleState(sale)
                const meta = SALE_STATE_META[state]
                const gaps = flashSaleGaps(sale, inScope(sale).length)
                const scope = inScope(sale)
                const skipped = excluded(sale)
                const isOpen = open === sale.id
                return (
                    <Card key={sale.id} className="overflow-hidden">
                        <button type="button" className="flex w-full flex-wrap items-center gap-2 border-b bg-muted/20 px-3 py-2 text-left"
                            onClick={() => setOpen(isOpen ? null : sale.id)}>
                            <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                            <span className="text-sm font-medium">{sale.name}</span>
                            <Badge variant="outline" className={`text-[10px] ${meta.className}`}>{meta.label}</Badge>
                            <span className="text-[11px] text-muted-foreground">
                                {scope.length} listing{scope.length === 1 ? "" : "s"} in scope
                            </span>
                            {skipped.length > 0 && (
                                <Badge variant="outline" className="text-[10px]">
                                    {skipped.length} excluded
                                </Badge>
                            )}
                            {gaps.length > 0 && (
                                <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-700">
                                    {gaps.length} to fix
                                </Badge>
                            )}
                            <span className="ml-auto text-[11px] text-muted-foreground">
                                {sale.rules.map(r => `${r.country} ${r.discountValue}${r.discountType === "percent" ? "%" : " off"}`).join(" · ")}
                            </span>
                        </button>

                        {isOpen && (
                            <CardContent className="space-y-4 p-3">
                                {gaps.length > 0 && (
                                    <div className="rounded-md border border-amber-200 bg-amber-50/50 p-3">
                                        <p className="text-xs font-semibold text-amber-900">Before this can go live</p>
                                        <ul className="mt-1 space-y-0.5">
                                            {gaps.map(g => <li key={g} className="text-[11px] text-amber-900">· {g}</li>)}
                                        </ul>
                                    </div>
                                )}

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Name</Label>
                                        <Input className="h-8 text-xs" value={sale.name}
                                            onChange={e => patch(sale.id, { name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Landing page</Label>
                                        <Select value={sale.landingCategoryId ?? ""}
                                            onValueChange={v => patch(sale.id, { landingCategoryId: v })}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Pick the category page this sale fills" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-64">
                                                {categories.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground">
                                            The sale&apos;s page <strong>is a category page</strong> — same layout, hero,
                                            SEO and app/web surfaces as any other. The sale only drives its
                                            <strong> membership</strong>, so it fills while the window is open and
                                            empties when it closes. Manage the page itself under Categories.
                                        </p>
                                    </div>
                                </div>

                                {/* ── window ── */}
                                <div className="rounded-md border bg-muted/10 p-3">
                                    <p className="mb-2 text-[11px] font-semibold">Window</p>
                                    <div className="grid gap-3 sm:grid-cols-4">
                                        <div className="space-y-1">
                                            <Label className="text-[11px]">Starts</Label>
                                            <Input type="datetime-local" className="h-8 text-xs"
                                                value={toLocal(sale.startsAt)}
                                                onChange={e => patch(sale.id, { startsAt: new Date(e.target.value).toISOString() })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[11px]">Ends</Label>
                                            <Input type="datetime-local" className="h-8 text-xs"
                                                value={toLocal(sale.endsAt)}
                                                onChange={e => patch(sale.id, { endsAt: new Date(e.target.value).toISOString() })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[11px]">Timezone</Label>
                                            <Select value={sale.timezone}
                                                onValueChange={v => patch(sale.id, { timezone: v })}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Asia/Dubai">Asia/Dubai (UAE)</SelectItem>
                                                    <SelectItem value="Asia/Riyadh">Asia/Riyadh (KSA)</SelectItem>
                                                    <SelectItem value="Asia/Qatar">Asia/Qatar</SelectItem>
                                                    <SelectItem value="Asia/Kuwait">Asia/Kuwait</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[11px]">Hold as draft</Label>
                                            <div className="flex h-8 items-center gap-2">
                                                <Switch checked={sale.isDraft}
                                                    onCheckedChange={v => patch(sale.id, { isDraft: v })} />
                                                <span className="text-[11px] text-muted-foreground">
                                                    {sale.isDraft ? "Will not price anything" : "Follows the window"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-[10px] text-muted-foreground">
                                        UAE and KSA do not share a clock, so the window carries a timezone. State is
                                        derived from the window — there is no separate status to go stale.
                                    </p>
                                </div>

                                {/* ── scope ── */}
                                <div className="rounded-md border bg-muted/10 p-3">
                                    <p className="mb-2 text-[11px] font-semibold">Scope</p>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-[11px]">Target by</Label>
                                            <Select value={sale.scopeKind}
                                                onValueChange={v => patch(sale.id, { scopeKind: v as "tag" | "listing" })}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="tag">Campaign tag (recommended)</SelectItem>
                                                    <SelectItem value="listing">An explicit list of listings</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {sale.scopeKind === "tag" ? (
                                            <div className="space-y-1">
                                                <Label className="text-[11px]">Campaign tag</Label>
                                                <Select value={sale.tagId ?? ""}
                                                    onValueChange={v => patch(sale.id, { tagId: v })}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder={campaignTags.length ? "Pick a campaign tag" : "No campaign tags yet"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {campaignTags.map(t => (
                                                            <SelectItem key={t.id} value={t.id}>{t.nameEn}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-[10px] text-muted-foreground">
                                                    Adding a product to a live sale is then <strong>one tag on the
                                                        listing</strong>, not an edit to the sale.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <Label className="text-[11px]">Listings ({(sale.listingIds ?? []).length})</Label>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="outline" className="h-8 w-full justify-start text-xs">
                                                            <Plus className="mr-1 h-3 w-3" /> Add a listing
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent className="max-h-72 w-80 overflow-y-auto">
                                                        <DropdownMenuLabel className="text-xs">Published listings</DropdownMenuLabel>
                                                        {listings.filter(l => l.status === "active"
                                                            && !(sale.listingIds ?? []).includes(l.id)).slice(0, 60).map(l => (
                                                                <DropdownMenuItem key={l.id} className="text-xs"
                                                                    onClick={() => patch(sale.id, {
                                                                        listingIds: [...(sale.listingIds ?? []), l.id],
                                                                    })}>
                                                                    {l.displayNameEn || l.internalName}
                                                                </DropdownMenuItem>
                                                            ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <div className="flex flex-wrap gap-1 pt-1">
                                                    {(sale.listingIds ?? []).map(id => (
                                                        <Badge key={id} variant="outline" className="gap-1 text-[10px]">
                                                            {listings.find(l => l.id === id)?.displayNameEn ?? id}
                                                            <button type="button" onClick={() => patch(sale.id, {
                                                                listingIds: (sale.listingIds ?? []).filter(x => x !== id),
                                                            })}><X className="h-3 w-3" /></button>
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className={`mt-3 rounded-md border p-2 text-[11px] ${scope.length === 0
                                        ? "border-amber-200 bg-amber-50/60 text-amber-900" : "bg-background"}`}>
                                        {scope.length === 0
                                            ? <><strong>No listings in this sale yet.</strong> A flash sale must contain
                                                listings — {sale.scopeKind === "tag"
                                                    ? "apply the campaign tag to the listings you want included."
                                                    : "add them above."} It cannot go live empty.</>
                                            : <><strong>{scope.length} listing{scope.length === 1 ? "" : "s"}</strong> resolved
                                                into this sale.</>}
                                    </div>

                                    <Separator className="my-3" />
                                    <div className="space-y-1">
                                        <Label className="text-[11px]">Applies to which priced unit</Label>
                                        <Select value={sale.pricedUnit}
                                            onValueChange={v => patch(sale.id, { pricedUnit: v as FlashSale["pricedUnit"] })}>
                                            <SelectTrigger className="h-8 text-xs sm:w-72"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Every priced unit</SelectItem>
                                                <SelectItem value="variant">Variants only (Health Products)</SelectItem>
                                                <SelectItem value="service_option">Service options only (Diagnostics)</SelectItem>
                                                <SelectItem value="plan">Treatment plans only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground">
                                            Price lives on variants, Diagnostics service options and Treatment plans
                                            depending on the department, so &ldquo;20% off this listing&rdquo; is
                                            ambiguous when a listing has four plans at different prices.
                                        </p>
                                    </div>
                                </div>

                                {/* ── discount rules ── */}
                                <div className="rounded-md border bg-muted/10 p-3">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-[11px] font-semibold">Discount per country</p>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                                    <Plus className="mr-1 h-3 w-3" /> Add country
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {COUNTRIES.filter(c => !sale.rules.some(r => r.country === c)).map(c => (
                                                    <DropdownMenuItem key={c} className="text-xs"
                                                        onClick={() => patch(sale.id, {
                                                            rules: [...sale.rules, {
                                                                country: c, discountType: "percent", discountValue: 10,
                                                            } as FlashSaleRule],
                                                        })}>{c}</DropdownMenuItem>
                                                ))}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    {sale.rules.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground">
                                            No rule yet — a sale with no country rule prices nothing.
                                        </p>
                                    ) : sale.rules.map(r => (
                                        <div key={r.country} className="mb-2 grid gap-2 sm:grid-cols-[70px_110px_90px_110px_auto]">
                                            <div className="flex h-8 items-center text-xs font-medium">{r.country}</div>
                                            <Select value={r.discountType}
                                                onValueChange={v => patch(sale.id, {
                                                    rules: sale.rules.map(x => x.country === r.country
                                                        ? { ...x, discountType: v as "percent" | "fixed" } : x),
                                                })}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="percent">Percent</SelectItem>
                                                    <SelectItem value="fixed">Fixed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input type="number" className="h-8 text-xs" value={r.discountValue}
                                                onChange={e => patch(sale.id, {
                                                    rules: sale.rules.map(x => x.country === r.country
                                                        ? { ...x, discountValue: Number(e.target.value) } : x),
                                                })} />
                                            <Input type="number" className="h-8 text-xs" placeholder="floor price"
                                                value={r.floorPrice ?? ""}
                                                onChange={e => patch(sale.id, {
                                                    rules: sale.rules.map(x => x.country === r.country
                                                        ? { ...x, floorPrice: e.target.value === "" ? undefined : Number(e.target.value) } : x),
                                                })} />
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                                onClick={() => patch(sale.id, {
                                                    rules: sale.rules.filter(x => x.country !== r.country),
                                                })}><X className="h-3.5 w-3.5" /></Button>
                                        </div>
                                    ))}
                                    <label className="mt-1 flex items-center gap-2">
                                        <Switch checked={sale.stacksWithCoupons}
                                            onCheckedChange={v => patch(sale.id, { stacksWithCoupons: v })} />
                                        <span className="text-[11px]">
                                            Allow a coupon on top of the sale price
                                            {!sale.stacksWithCoupons && (
                                                <span className="text-muted-foreground"> — off, so the customer gets whichever is better, not both</span>
                                            )}
                                        </span>
                                    </label>
                                </div>

                                {/* ── what it will actually do ── */}
                                <div className="rounded-md border p-3">
                                    <p className="mb-2 text-[11px] font-semibold">
                                        What this prices right now ({scope.length} in scope)
                                    </p>
                                    {scope.length === 0 ? (
                                        <div className="flex gap-2 text-[11px] text-muted-foreground">
                                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <p>Nothing in scope yet. With tag scope, apply the campaign tag to the
                                                listings you want included.</p>
                                        </div>
                                    ) : (
                                        <>
                                            {skipped.length > 0 && (
                                                <div className="mb-2 flex gap-2 rounded border border-amber-200 bg-amber-50/50 p-2 text-[11px]">
                                                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                                                    <p><strong>{skipped.length} in scope cannot be discounted</strong> and
                                                        will be skipped: {skipped.slice(0, 3).map(l => l.displayNameEn).join(", ")}
                                                        {skipped.length > 3 && ` +${skipped.length - 3}`}. Set on the listing,
                                                        because it is permanent (GLP-1, MOH-regulated, partner-contracted).</p>
                                                </div>
                                            )}
                                            <div className="space-y-1">
                                                {scope.slice(0, 6).map(l => {
                                                    const base = l.variants?.[0]?.regionalData?.find(r => r.country === "UAE")?.price
                                                    const res = base !== undefined
                                                        ? effectivePrice(base, l, [sale], "UAE") : undefined
                                                    return (
                                                        <div key={l.id} className="flex items-center gap-2 text-[11px]">
                                                            <span className="flex-1 truncate">{l.displayNameEn || l.internalName}</span>
                                                            {base === undefined ? (
                                                                <span className="text-muted-foreground">no UAE price to show</span>
                                                            ) : (
                                                                <>
                                                                    <span className="text-muted-foreground line-through">{base}</span>
                                                                    <span className="font-medium">{res?.price}</span>
                                                                    {res?.wasFloored && (
                                                                        <Badge variant="outline" className="text-[9px]">floored</Badge>
                                                                    )}
                                                                    {l.discountable === false && (
                                                                        <Badge variant="outline" className="text-[9px]">excluded</Badge>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                                {scope.length > 6 && (
                                                    <p className="text-[10px] text-muted-foreground">
                                                        +{scope.length - 6} more
                                                    </p>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                <EntityHistory entityType="flashSale" entityId={sale.id} />
                            </CardContent>
                        )}
                    </Card>
                )
            })}

            <p className="text-xs text-muted-foreground">
                Nothing here deletes and nothing writes onto a listing. Every edit to a rule or window is recorded in
                the Audit Log, because a price change on a live sale is the highest-risk edit in the CMS.
            </p>
        </div>
    )
}
