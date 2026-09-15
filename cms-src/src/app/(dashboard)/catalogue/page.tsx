"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
    ArrowRight, ChevronRight, ChevronDown, Pill, Syringe, TestTube, HeartPulse,
    Handshake, LayoutTemplate, Boxes, Package, Tags, Route,
    CheckCircle2, Circle,
} from "lucide-react"
import { ApiService } from "@/services/api"
import { GuideSheet } from "@/components/catalogue/OnboardingGuide"
import { GUIDES, GUIDE_ORDER, GuideKey } from "@/lib/onboarding"
import { DEPARTMENTS, FULFILMENT_PATHS, listingActivationRequirements, listingUnmetRequirements } from "@/lib/catalogue"
import { Listing, SubDepartment, SubCategory, Category, Journey } from "@/types"

// ── Task-oriented "plays": named outcomes that deep-link into the real flow ──
const PLAYS = [
    { icon: Pill, title: "Launch a supplement", desc: "Health Products · supplement path. Name → variants & price → placement → image → go-live.", badge: "~5 steps", href: "/catalogue/listings/new?department=health_products&subDepartment=supplements&fulfilment=supplement" },
    { icon: Syringe, title: "Launch a GLP-1 medicine + protocol", desc: "Health Products · pen form. Create the listing, then order dosing & gating in the protocol builder.", badge: "~8 steps", href: "/catalogue/listings/new?department=health_products&fulfilment=supplement&form=pen" },
    { icon: TestTube, title: "Publish a diagnostics blood panel", desc: "Diagnostics & Testing · blood path (phlebotomy → lab → report). Assign the lab, set turnaround, place it.", badge: "~6 steps", href: "/catalogue/listings/new?department=diagnostics&fulfilment=blood" },
    { icon: HeartPulse, title: "List a home-service treatment", desc: "Treatments / Home & Personal Care · home-service. Set catchment cities, therapist, slot duration.", badge: "~6 steps", href: "/catalogue/listings/new?department=treatments&fulfilment=home_service" },
    { icon: Handshake, title: "Onboard a B2B partner", desc: "Per-variant pricing by city & country, image overrides, and partner-exclusive listings hidden from master search.", badge: "Partner setup", href: "/catalogue/partners" },
    { icon: LayoutTemplate, title: "Build a journey page", desc: "Assemble the block page-builder, wire retention slots, publish to app & web.", badge: "Page builder", href: "/catalogue/journeys" },
]

// ── Confusable-pair clarifications (recognition + contrast) ──
const COMPARES = [
    { left: "Journey", leftDef: "A block-built page with retention slots (marketing surface).", right: "Program vs Protocol", rightDef: "Program = several listings bundled & tracked as one. Protocol = clinically-distinct ordered steps with gating.", verdict: "Page ≠ Bundle ≠ Clinical sequence" },
    { left: "Category", leftDef: "The storefront group shown on web/app.", right: "Sub-category", rightDef: "The finer bucket a listing is actually placed into. A listing needs ≥1 placement to go live.", verdict: "Group vs the shelf it sits on" },
    { left: "Listing", leftDef: "The sellable hub — one concept, serves app + web.", right: "Variant", rightDef: "A specific purchasable SKU with its own price (e.g. one dose of a pen medicine).", verdict: "The thing vs the buyable SKU" },
    { left: "Internal Category", leftDef: "Ops/feature grouping that determines the service-provider pool.", right: "Category", rightDef: "Customer-facing merchandising. Not the same field.", verdict: "Ops routing vs storefront" },
]

export default function CatalogueOverviewPage() {
    const [listings, setListings] = useState<Listing[]>([])
    const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
    const [subCategories, setSubCategories] = useState<SubCategory[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [journeys, setJourneys] = useState<Journey[]>([])
    const [node, setNode] = useState<null | (typeof SPINE)[number]>(null)
    const [guide, setGuide] = useState<GuideKey | null>(null)

    useEffect(() => {
        ApiService.catalogue.listings().then(setListings)
        ApiService.catalogue.subDepartments().then(setSubDepartments)
        ApiService.catalogue.subCategories().then(setSubCategories)
        ApiService.catalogue.categories().then(setCategories)
        ApiService.catalogue.journeys().then(setJourneys)
    }, [])

    const activeCount = listings.filter(l => l.status === "active").length
    const draftCount = listings.filter(l => l.status === "draft").length

    const SPINE = useMemo(() => [
        { key: "dept", label: "Department", icon: Boxes, count: DEPARTMENTS.length, manageHref: "/catalogue/departments", def: "The canonical 'what it is' — 5 departments. Every listing lives in exactly one." },
        { key: "subdept", label: "Sub-department", icon: Boxes, count: subDepartments.length, manageHref: "/catalogue/departments", def: "Narrows the department and gates which attributes appear on the listing (e.g. Medicine → medicine type)." },
        { key: "listing", label: "Listing", icon: Package, count: listings.length, manageHref: "/catalogue/listings", def: "The sellable hub. One entry serves app + web; creation differs per department." },
        { key: "cats", label: "Categories & Sub-categories", icon: Tags, count: categories.length + subCategories.length, manageHref: "/catalogue/categories", def: "Pure web/app merchandising — where a listing shows up, not what it is." },
        { key: "wrap", label: "Journeys · Programs · Protocols", icon: Route, count: journeys.length, manageHref: "/catalogue/journeys", def: "What wraps the listing: block pages, bundled multi-listing programs, and clinically-ordered protocol steps with gating." },
    ], [subDepartments.length, listings.length, categories.length, subCategories.length, journeys.length])

    // Drafts closest to go-live first (fewest unmet requirements on top).
    const drafts = useMemo(() =>
        listings.filter(l => l.status === "draft")
            .map(l => ({ l, unmet: listingUnmetRequirements(l) }))
            .sort((a, b) => a.unmet.length - b.unmet.length),
        [listings])
    const nearest = drafts[0]

    const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })

    return (
        <div className="space-y-10 pb-16">
            {/* ── 1. Launch band (hero) ── */}
            <section className="space-y-5">
                <div className="max-w-2xl space-y-3">
                    <h2 className="text-2xl font-semibold tracking-tight">What are you taking to market today?</h2>
                    <p className="text-sm text-muted-foreground">
                        The catalogue runs one spine — <strong>Department → Sub-department → Listing → Categories → Journeys, Programs &amp; Protocols</strong>.
                        A Listing is the sellable hub: one entry serves both app and web.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <Button size="lg" onClick={() => scrollTo("plays")}>Start a guided launch →</Button>
                    <button onClick={() => scrollTo("model")} className="text-sm text-muted-foreground hover:text-foreground">Just browse the model ↓</button>
                </div>
                <div className="flex flex-wrap divide-x rounded-lg border bg-muted/20 text-sm">
                    <Stat label="Departments" value={DEPARTMENTS.length} />
                    <Stat label="Fulfilment paths" value={FULFILMENT_PATHS.length} />
                    <Stat label="Active listings" value={activeCount} />
                    <Stat label="Drafts awaiting go-live" value={draftCount} />
                </div>
            </section>

            {/* ── 2. The Plays ── */}
            <section id="plays" className="space-y-3 scroll-mt-4">
                <SectionHead title="The plays" hint="Pick the outcome you want — each routes you into the exact flow." />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {PLAYS.map(p => (
                        <Card key={p.title} className="flex flex-col">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary"><p.icon className="h-4 w-4" /></span>
                                    <Badge variant="secondary" className="text-[10px]">{p.badge}</Badge>
                                </div>
                                <CardTitle className="pt-2 text-base">{p.title}</CardTitle>
                                <CardDescription>{p.desc}</CardDescription>
                            </CardHeader>
                            <CardContent className="mt-auto">
                                <Button asChild variant="ghost" className="w-full justify-between text-primary">
                                    <Link href={p.href}>Start play <ArrowRight className="h-4 w-4" /></Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* ── 3. The model at a glance ── */}
            <section id="model" className="space-y-4 scroll-mt-4">
                <SectionHead title="The model at a glance" hint="Two taxonomies on one spine — what a listing IS, and where it SHOWS UP." />

                {/* The two taxonomies, spelled out */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-primary/20">
                        <CardHeader className="pb-2"><CardTitle className="text-sm">What it IS — the spine</CardTitle><CardDescription>Classification. Every listing sits in exactly one.</CardDescription></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><Link href="/catalogue/departments" className="font-medium text-primary hover:underline">Department</Link> — the canonical category of care (e.g. Health Products, Diagnostics &amp; Testing). 5 total.</p>
                            <p><Link href="/catalogue/departments" className="font-medium text-primary hover:underline">Sub-department</Link> — narrows the department (e.g. Supplements, Medicine) and <strong>gates which fields appear</strong> on the listing.</p>
                        </CardContent>
                    </Card>
                    <Card className="border-primary/20">
                        <CardHeader className="pb-2"><CardTitle className="text-sm">Where it SHOWS UP — merchandising</CardTitle><CardDescription>Storefront placement. A listing can appear in many.</CardDescription></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p><Link href="/catalogue/categories" className="font-medium text-primary hover:underline">Category</Link> — a web/app storefront group a shopper browses (e.g. Shop by Goal). Purely merchandising.</p>
                            <p><Link href="/catalogue/categories" className="font-medium text-primary hover:underline">Sub-category</Link> — the finer shelf inside a category that a listing is actually placed on. A listing needs <strong>≥1 placement</strong> to go live.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* The full spine, click a node to manage */}
                <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
                    {SPINE.map((s, i) => (
                        <div key={s.key} className="flex flex-col md:flex-1 md:flex-row md:items-stretch">
                            <button onClick={() => setNode(s)} className="group h-full w-full text-left md:flex-1">
                                <Card className="flex h-full flex-col transition-colors group-hover:border-primary/40 group-hover:bg-muted/30">
                                    <CardHeader className="pb-2">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary"><s.icon className="h-4 w-4" /></span>
                                        <CardTitle className="pt-2 text-sm">{s.label}</CardTitle>
                                        <CardDescription className="text-xs">{s.def}</CardDescription>
                                    </CardHeader>
                                    <CardContent className="mt-auto"><Badge variant="outline" className="text-[10px]">{s.count}</Badge></CardContent>
                                </Card>
                            </button>
                            {i < SPINE.length - 1 && (
                                <div className="flex items-center justify-center py-1 md:px-1 md:py-0">
                                    <ChevronRight className="h-5 w-5 rotate-90 text-muted-foreground/50 md:rotate-0" />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── 4. When to use what ── */}
            <section className="space-y-3">
                <SectionHead title="When to use what" hint="The four distinctions people mix up most." />
                <div className="grid gap-4 md:grid-cols-2">
                    {COMPARES.map(c => (
                        <Card key={c.left}>
                            <CardContent className="space-y-3 pt-5">
                                <div className="grid grid-cols-2 divide-x">
                                    <div className="pr-3"><p className="text-sm font-semibold">{c.left}</p><p className="text-xs text-muted-foreground">{c.leftDef}</p></div>
                                    <div className="pl-3"><p className="text-sm font-semibold">{c.right}</p><p className="text-xs text-muted-foreground">{c.rightDef}</p></div>
                                </div>
                                <Badge variant="secondary" className="text-[10px]">{c.verdict}</Badge>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* ── 5. The go-live gate ── */}
            <section className="space-y-3">
                <SectionHead title="The go-live gate" hint="Eight requirements clear before a listing can flip to Active." />
                {nearest ? (
                    <Card>
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Ring met={listingActivationRequirements(nearest.l).filter(r => r.met).length} total={8} />
                            <div>
                                <CardTitle className="text-base">{nearest.l.displayNameEn || nearest.l.internalName}</CardTitle>
                                <CardDescription>Closest draft to go-live — {nearest.unmet.length} requirement{nearest.unmet.length === 1 ? "" : "s"} left.</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="grid gap-1.5 sm:grid-cols-2">
                            {listingActivationRequirements(nearest.l).map(r => (
                                <div key={r.key} className="flex items-center gap-2 text-sm">
                                    {r.met ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="h-4 w-4 shrink-0 text-amber-500" />}
                                    <span className={r.met ? "text-muted-foreground line-through" : ""}>{r.label}</span>
                                    {!r.met && <Link href={`/catalogue/listings/${nearest.l.id}?section=${r.section}`} className="ml-auto text-xs text-primary hover:underline">Fix →</Link>}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ) : (
                    <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No drafts — everything is live or there is nothing to launch yet.</CardContent></Card>
                )}
                <p className="text-xs text-muted-foreground">Incremental save writes each section back as you go — a draft always saves partially, but only flips to Active once all eight clear.</p>
            </section>

            {/* ── 6. Pick up where you left off ── */}
            <section className="space-y-3">
                <SectionHead title="Pick up where you left off" hint="Unfinished drafts, closest to done first." />
                {drafts.length === 0 ? (
                    <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">Nothing half-built — start a new play above.</CardContent></Card>
                ) : (
                    <div className="space-y-2">
                        {drafts.slice(0, 6).map(({ l, unmet }) => (
                            <Card key={l.id} className="py-0">
                                <div className="flex items-center gap-4 p-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{l.displayNameEn || l.internalName}</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                                                <div className="h-full bg-emerald-500" style={{ width: `${((8 - unmet.length) / 8) * 100}%` }} />
                                            </div>
                                            <span className="text-[11px] text-muted-foreground">{8 - unmet.length}/8</span>
                                        </div>
                                    </div>
                                    {l.partnerExclusive && <Badge variant="outline" className="text-[10px]">Partner-exclusive</Badge>}
                                    {unmet[0] && <Badge variant="secondary" className="text-[10px]">needs: {unmet[0].label.toLowerCase()}</Badge>}
                                    <Button asChild size="sm" variant="outline" className="h-8">
                                        <Link href={`/catalogue/listings/${l.id}?section=${unmet[0]?.section ?? "classification"}`}>Resume →</Link>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Guides ── */}
            <section className="space-y-3">
                <SectionHead title="Guides" hint="Step-by-step walkthroughs for every creation flow — open one any time." />
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {GUIDE_ORDER.map(k => {
                        const g = GUIDES[k]
                        return (
                            <button key={k} onClick={() => setGuide(k)} className="group text-left">
                                <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-muted/30">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="text-sm">{g.title}</CardTitle>
                                            <Badge variant="secondary" className="shrink-0 text-[10px]">~{g.minutes} min</Badge>
                                        </div>
                                        <CardDescription className="text-xs">{g.forWho}</CardDescription>
                                    </CardHeader>
                                </Card>
                            </button>
                        )
                    })}
                </div>
                {guide && <GuideSheet guide={guide} open={!!guide} onOpenChange={o => !o && setGuide(null)} />}
            </section>

            {/* ── 7. Reference shelf ── */}
            <section className="space-y-3">
                <SectionHead title="Reference shelf" hint="Recognise, don't recall — the concepts every play touches." />
                <Tabs defaultValue="fulfilment">
                    <TabsList>
                        <TabsTrigger value="fulfilment">Fulfilment</TabsTrigger>
                        <TabsTrigger value="medicine">Medicine</TabsTrigger>
                        <TabsTrigger value="partners">Partners & Providers</TabsTrigger>
                        <TabsTrigger value="wrappers">Wrappers</TabsTrigger>
                    </TabsList>
                    <TabsContent value="fulfilment" className="pt-3">
                        <div className="space-y-1.5">
                            {FULFILMENT_PATHS.map(fp => <RefRow key={fp.id} term={fp.label} def={fp.hint} />)}
                        </div>
                    </TabsContent>
                    <TabsContent value="medicine" className="space-y-1.5 pt-3">
                        <RefRow term="Medicine types" def="GLP-1, Peptide, Hair Loss, Antibiotic, Vitamin, General Rx — the clinical class, set on Medicine sub-department listings." />
                        <RefRow term="Medicine forms" def="oral / pen / injectable / IV / topical. The form decides the fulfilment path — a pen medicine ships like a supplement." />
                    </TabsContent>
                    <TabsContent value="partners" className="space-y-1.5 pt-3">
                        <RefRow term="Partner integration" def="Per-partner pricing at variant × city × country, image overrides, and partner-exclusive listings hidden from master search." href="/catalogue/partners" />
                        <RefRow term="Service Provider" def="The lab / clinic / therapist pool that fulfils a listing; assigned per listing and gated by its Internal Category." href="/catalogue/service-providers" />
                        <RefRow term="Internal Category" def="The ops/feature grouping that determines the service-provider pool — distinct from the customer-facing merchandising Category." href="/catalogue/internal-categories" />
                    </TabsContent>
                    <TabsContent value="wrappers" className="space-y-1.5 pt-3">
                        <RefRow term="Protocols" def="Clinically-distinct ordered steps with gating between them." href="/catalogue/protocols" />
                        <RefRow term="Journeys" def="The block page-builder with retention slots." href="/catalogue/journeys" />
                        <RefRow term="Programs" def="Bundled multi-listing offerings sold and tracked as one." />
                    </TabsContent>
                </Tabs>
            </section>

            {/* Model node side panel */}
            <Sheet open={!!node} onOpenChange={o => !o && setNode(null)}>
                <SheetContent>
                    {node && (
                        <>
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2"><node.icon className="h-4 w-4" /> {node.label}</SheetTitle>
                                <SheetDescription>{node.def}</SheetDescription>
                            </SheetHeader>
                            <div className="mt-4 flex items-center gap-2 px-4">
                                <Badge variant="outline">{node.count} in catalogue</Badge>
                                <Button asChild size="sm" variant="outline" className="ml-auto">
                                    <Link href={node.manageHref}>Open manager →</Link>
                                </Button>
                            </div>
                        </>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    )
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="flex-1 px-4 py-3">
            <div className="text-lg font-semibold tabular-nums">{value}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
        </div>
    )
}

function SectionHead({ title, hint }: { title: string; hint: string }) {
    return (
        <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground/80">{hint}</p>
        </div>
    )
}

function Ring({ met, total }: { met: number; total: number }) {
    const r = 26, c = 2 * Math.PI * r, pct = Math.min(1, met / total)
    return (
        <div className="relative h-16 w-16 shrink-0">
            <svg viewBox="0 0 64 64" className="h-16 w-16 -rotate-90">
                <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
                <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-emerald-500" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-semibold tabular-nums">{met}/{total}</span>
            </div>
        </div>
    )
}

function RefRow({ term, def, href }: { term: string; def: string; href?: string }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="rounded-md border">
            <button onClick={() => setOpen(o => !o)} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-muted/40">
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
                <span className="flex-1">{term}</span>
                {href && <Link href={href} onClick={e => e.stopPropagation()} className="text-xs text-primary hover:underline">Manage →</Link>}
            </button>
            {open && <p className="px-3 pb-2.5 pl-8 text-xs text-muted-foreground">{def}</p>}
        </div>
    )
}
