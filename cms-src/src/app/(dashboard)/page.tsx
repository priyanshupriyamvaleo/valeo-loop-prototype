"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
    AlertTriangle, ArrowRight, Clock, FlaskConical, Globe, History, Plus, Tag as TagIcon, Zap,
} from "lucide-react"
import { ApiService } from "@/services/api"
import { AuditLogEntry, Country, FlashSale, Listing, PromoBanner, Tag } from "@/types"
import { listingUnmetRequirements, DEPARTMENTS } from "@/lib/catalogue"
import { biomarkerDrift, countryDefaultSlot } from "@/lib/diagnostics"
import { saleState } from "@/lib/flash-sales"
import { statusMeta } from "@/lib/listing-status"
import { useAuth } from "@/lib/auth"

const COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT"]

/**
 * A CMS dashboard, not an analytics dashboard. Revenue, traffic and conversion
 * belong in BI — put them here and people read numbers then leave without doing
 * the one thing only the CMS can do. Every tile is therefore a WORK QUEUE: a count
 * and a link that lands on exactly those records.
 *
 * The counts reuse the same predicates as the Listings filters, so a tile can never
 * disagree with the list it links to.
 */
export default function DashboardPage() {
    const { user } = useAuth()
    const [listings, setListings] = useState<Listing[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [sales, setSales] = useState<FlashSale[]>([])
    const [banners, setBanners] = useState<PromoBanner[]>([])
    const [audit, setAudit] = useState<AuditLogEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // allSettled, not all: the dashboard reads five independent feeds and one
        // failing feed must not blank the whole page — with Promise.all a single
        // rejection leaves `loading` true forever and the operator just sees a
        // spinner. Each tile degrades on its own instead.
        Promise.allSettled([
            ApiService.catalogue.listings(),
            ApiService.catalogue.tags(),
            ApiService.catalogue.flashSales(),
            ApiService.catalogue.promoBanners(),
            ApiService.catalogue.audit.list(),
        ]).then(([l, t, s, b, a]) => {
            if (l.status === "fulfilled") setListings(l.value)
            if (t.status === "fulfilled") setTags(t.value)
            if (s.status === "fulfilled") setSales(s.value)
            if (b.status === "fulfilled") setBanners(b.value)
            if (a.status === "fulfilled") setAudit(a.value)
            setLoading(false)
        })
    }, [])

    // ── 1. blocked from going live ──
    const blocked = useMemo(() => listings.filter(l =>
        l.status !== "active" && listingUnmetRequirements(l).length > 0), [listings])
    const noPrice = useMemo(() => listings.filter(l =>
        !(l.variants ?? []).some(v => (v.regionalData ?? []).some(r => (r.price ?? 0) > 0))), [listings])
    const noImage = useMemo(() => listings.filter(l => (l.mediaGallery ?? []).length === 0
        && !(l.variants ?? []).some(v => !!v.imageUrl || (v.mediaGallery ?? []).length > 0)), [listings])
    const unplaced = useMemo(() => listings.filter(l => (l.subCategoryIds ?? []).length === 0), [listings])

    // ── 2. waiting on a person, not on work ──
    const noSubDept = useMemo(() => listings.filter(l => !l.subDepartmentId), [listings])
    const proposedTags = useMemo(() => tags.filter(t => t.status === "proposed"), [tags])
    const unexplainedDrift = useMemo(() => listings.filter(l => {
        if (l.department !== "diagnostics") return false
        const maps = l.diagnostics?.biomarkerCountryMaps ?? []
        if (biomarkerDrift(maps).severity !== "severe") return false
        // explained drift is a recorded decision, not a queue item
        return biomarkerDrift(maps).perCountry.filter(pc => pc.missing.length > 0)
            .some(pc => !maps.find(m => m.country === pc.country)?.intentionalNote?.trim())
    }), [listings])
    const noSlots = useMemo(() => listings.filter(l => l.department === "diagnostics"
        && (l.countryConfig ?? []).length > 0
        && (l.countryConfig ?? []).some(c => !countryDefaultSlot(l.diagnostics, c.country)?.slotGroupId)), [listings])

    // ── 3. time-boxed things people forget ──
    const live = sales.filter(s => saleState(s) === "live")
    const scheduled = sales.filter(s => saleState(s) === "scheduled")
    const endingSoon = live.filter(s =>
        new Date(s.endsAt).getTime() - Date.now() < 24 * 3600 * 1000)
    const activeBanners = banners.filter(b => b.isActive)

    // ── 5. where countries have quietly diverged ──
    const coverage = useMemo(() => COUNTRIES.map(c => {
        const sold = listings.filter(l => (l.countryConfig ?? []).some(x => x.country === c))
        const noArabic = sold.filter(l => !l.displayNameAr?.trim())
        return { country: c, sold: sold.length, noArabic: noArabic.length }
    }), [listings])

    const decisions = noSubDept.length + proposedTags.length + unexplainedDrift.length

    const Tile = ({ icon, title, count, tone, children, href, cta }: {
        icon: React.ReactNode; title: string; count?: number
        tone?: "danger" | "warn" | "ok"; children: React.ReactNode; href: string; cta: string
    }) => (
        <Card className={`flex flex-col border-l-4 ${tone === "danger" ? "border-l-red-500"
            : tone === "warn" ? "border-l-amber-500" : "border-l-emerald-500"}`}>
            <CardHeader className="py-3">
                <div className="flex items-center gap-2">
                    {icon}
                    <span className="text-sm font-semibold">{title}</span>
                    {count !== undefined && (
                        <Badge variant="outline" className="ml-auto font-mono text-[11px]">{count}</Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-2 pt-0">
                <div className="flex-1 space-y-1 text-xs text-muted-foreground">{children}</div>
                <Button size="sm" variant="outline" className="h-7 w-full text-xs" asChild>
                    <Link href={href}>{cta} <ArrowRight className="ml-1 h-3 w-3" /></Link>
                </Button>
            </CardContent>
        </Card>
    )

    const Row = ({ label, n, href }: { label: string; n: number; href?: string }) => (
        <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-foreground">{n}</span>
            {href ? <Link href={href} className="hover:underline">{label}</Link> : <span>{label}</span>}
        </div>
    )

    if (loading) {
        return <p className="text-sm text-muted-foreground">Loading your queues…</p>
    }

    return (
        <div className="space-y-6 pb-16">
            <div className="max-w-3xl space-y-1">
                <h2 className="text-2xl font-semibold tracking-tight">
                    {user?.name ? `Morning, ${user.name.split(" ")[0]}` : "Dashboard"}
                </h2>
                <p className="text-sm text-muted-foreground">
                    What needs attention in the catalogue, and where to do it. Revenue and traffic live in BI — this
                    page is the work queue.
                </p>
            </div>

            {/* start something */}
            <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                    <Link href="/catalogue/listings"><Plus className="mr-1.5 h-3.5 w-3.5" /> New Listing</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                    <Link href="/catalogue/flash-sales"><Plus className="mr-1.5 h-3.5 w-3.5" /> New Flash Sale</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                    <Link href="/catalogue/promo-banners"><Plus className="mr-1.5 h-3.5 w-3.5" /> New Promo Banner</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                    <Link href="/catalogue/journeys"><Plus className="mr-1.5 h-3.5 w-3.5" /> New Journey</Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Tile icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
                    title="Blocked from going live" count={blocked.length} tone="danger"
                    href="/catalogue/listings" cta="Open the blocked list">
                    <p className="mb-1">Drafts that fail an activation requirement. Nothing ships until these clear.</p>
                    <Row n={noPrice.length} label="no priced variant — cannot be bought" />
                    <Row n={noImage.length} label="no image" />
                    <Row n={unplaced.length} label="not placed in any sub-category" />
                </Tile>

                <Tile icon={<Clock className="h-4 w-4 text-amber-600" />}
                    title="Waiting on a decision" count={decisions} tone="warn"
                    href="/catalogue/listings" cta="Review what is stalled">
                    <p className="mb-1">Stalled on a person, not on work — the queue that goes invisible for weeks.</p>
                    <Row n={noSubDept.length} label="migrated packages with no sub-department" />
                    <Row n={proposedTags.length} label="tags proposed, awaiting approval" href="/catalogue/tags" />
                    <Row n={unexplainedDrift.length} label="severe biomarker drift, unexplained" />
                </Tile>

                <Tile icon={<Zap className="h-4 w-4 text-emerald-600" />}
                    title="Live &amp; changing soon" count={live.length + scheduled.length}
                    href="/catalogue/flash-sales" cta="Open flash sales">
                    <p className="mb-1">Time-boxed pricing is what people forget to check.</p>
                    <Row n={live.length} label="flash sales live right now" />
                    <Row n={endingSoon.length} label="ending in the next 24 hours" />
                    <Row n={scheduled.length} label="scheduled to start" />
                    <Row n={activeBanners.length} label="promo banners active" href="/catalogue/promo-banners" />
                </Tile>

                <Tile icon={<FlaskConical className="h-4 w-4 text-amber-600" />}
                    title="Diagnostics readiness" count={noSlots.length} tone="warn"
                    href="/catalogue/listings?department=diagnostics" cta="Open diagnostics">
                    <p className="mb-1">A panel with no nurse slot group cannot be booked, however well it is priced.</p>
                    <Row n={noSlots.length} label="countries with no slot group mapped" />
                    <Row n={unexplainedDrift.length} label="packages whose country marker sets differ severely" />
                </Tile>

                <Tile icon={<Globe className="h-4 w-4 text-emerald-600" />}
                    title="Country coverage" href="/catalogue/listings" cta="Compare by country">
                    <p className="mb-1">Where markets have quietly diverged from each other.</p>
                    {coverage.filter(c => c.sold > 0).map(c => (
                        <div key={c.country} className="flex items-baseline gap-2">
                            <span className="w-12 text-xs text-foreground">{c.country}</span>
                            <span className="font-mono text-xs">{c.sold}</span>
                            <span>sold</span>
                            {c.noArabic > 0 && (
                                <span className="text-amber-700">· {c.noArabic} missing Arabic</span>
                            )}
                        </div>
                    ))}
                </Tile>

                <Tile icon={<History className="h-4 w-4 text-emerald-600" />}
                    title="Recently changed" count={audit.length}
                    href="/audit" cta="Open the audit log">
                    <p className="mb-1">&ldquo;Who changed this price?&rdquo; — the most asked question in a catalogue.</p>
                    {audit.slice(0, 4).map(e => (
                        <div key={e.id} className="truncate">
                            <span className="text-foreground">{e.actor?.name ?? "System"}</span>{" "}
                            {e.action.replace("_", " ")} <span className="text-foreground">{e.entityName}</span>
                        </div>
                    ))}
                    {audit.length === 0 && <p>No changes recorded yet.</p>}
                </Tile>
            </div>

            {/* by department — where a category manager actually works */}
            <Card>
                <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                        <TagIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">By department</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Published versus blocked, so an owner can see their own patch.
                    </p>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[34rem] text-xs">
                            <thead>
                                <tr className="border-b text-left text-muted-foreground">
                                    <th className="py-1.5 pr-4 font-medium">Department</th>
                                    <th className="py-1.5 pr-4 font-medium">Published</th>
                                    <th className="py-1.5 pr-4 font-medium">Blocked</th>
                                    <th className="py-1.5 font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {DEPARTMENTS.map(d => {
                                    const mine = listings.filter(l => l.department === d.id)
                                    const pub = mine.filter(l => l.status === "active").length
                                    const blk = mine.filter(l => blocked.includes(l)).length
                                    return (
                                        <tr key={d.id} className="border-b last:border-0">
                                            <td className="py-1.5 pr-4">
                                                <Link href={`/catalogue/listings?department=${d.id}`}
                                                    className="hover:underline">{d.labelEn}</Link>
                                            </td>
                                            <td className="py-1.5 pr-4 font-mono">{pub}</td>
                                            <td className={`py-1.5 pr-4 font-mono ${blk > 0 ? "text-amber-700" : ""}`}>{blk}</td>
                                            <td className="py-1.5 font-mono text-muted-foreground">{mine.length}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                        {listings.length} listings total ·{" "}
                        {listings.filter(l => l.status === "active").length} {statusMeta("active").label.toLowerCase()}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
