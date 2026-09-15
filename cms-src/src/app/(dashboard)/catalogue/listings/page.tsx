"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Plus, Search, Pencil, ChevronLeft, ChevronRight, ChevronDown, Check, History, Tag as TagIcon, SlidersHorizontal } from "lucide-react"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ApiService } from "@/services/api"
import { ApiError, type PageMeta } from "@/lib/api/client"
import { departmentIdOf, fetchDepartments, subDepartmentIdOf, toSubDepartments, type DepartmentDto } from "@/lib/api/taxonomy"
import { fetchProducts, isUnservableStatus, toListingRow, toServerStatus, UNSERVABLE_FILTERS } from "@/lib/api/product-list"
import { GuideButton, OnboardingBanner } from "@/components/catalogue/OnboardingGuide"
import { DEPARTMENTS, departmentLabel, listingUnmetRequirements } from "@/lib/catalogue"
import { DIAGNOSTICS_TIERS, biomarkerDrift, countryDefaultSlot } from "@/lib/diagnostics"
import { statusMeta } from "@/lib/listing-status"
import { Listing, SubDepartment, Department, ProductStatus, Tag, TAG_NAMESPACES, Country } from "@/types"

const STATUS_BADGE: Record<ProductStatus, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    inactive: "bg-amber-100 text-amber-700 border-amber-200",
    archived: "bg-rose-100 text-rose-700 border-rose-200",
}

function ListingsInner() {
    const searchParams = useSearchParams()
    const deptParam = searchParams.get("department") as Department | null

    const [listings, setListings] = useState<Listing[]>([])
    const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
    const [loading, setLoading] = useState(true)
    useEffect(() => { ApiService.catalogue.tags().then(setTags) }, [])

    const [deptFilter, setDeptFilter] = useState<Department | "all">(deptParam ?? "all")
    const [query, setQuery] = useState("")
    // The list effect keys on the DEBOUNCED copy: typing used to fire one request per
    // keystroke ("valeo" = six list queries, five of them garbage). 300ms of quiet
    // first — and the effect aborts the in-flight request when superseded.
    const [debouncedQuery, setDebouncedQuery] = useState("")
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQuery(query), 300)
        return () => clearTimeout(t)
    }, [query])
    const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all")
    const [tags, setTags] = useState<Tag[]>([])
    const [tagFilter, setTagFilter] = useState<string[]>([])
    // "all" = must carry every selected tag; "any" = at least one. Stated
    // explicitly because the two give very different result sets.
    const [tagMode, setTagMode] = useState<"all" | "any">("all")
    const [subDeptFilter, setSubDeptFilter] = useState<string>("all")
    const [countryFilter, setCountryFilter] = useState<Country | "all">("all")
    const [surfaceFilter, setSurfaceFilter] = useState<"all" | "app" | "web" | "both">("all")
    /**
     * Work-queue filters. With 1,425 listings the useful question is rarely
     * "which are Blood Tests" — it is "which ones are blocking me". These turn the
     * list into a queue of things to fix.
     */
    const [flagFilter, setFlagFilter] = useState<string[]>([])
    const [page, setPage] = useState(1)
    const PAGE_SIZE = 12
    const [deptTree, setDeptTree] = useState<DepartmentDto[]>([])
    const [serverMeta, setServerMeta] = useState<PageMeta | null>(null)
    const [listError, setListError] = useState<string | null>(null)
    const STATUSES: ProductStatus[] = ["active", "draft", "inactive", "archived"]

    // Taxonomy once; it does not depend on the filters.
    useEffect(() => {
        fetchDepartments()
            .then(tree => { setSubDepartments(toSubDepartments(tree)); setDeptTree(tree) })
            .catch(() => ApiService.catalogue.subDepartments().then(setSubDepartments))
    }, [])

    // ── The list itself: filtered and paged BY THE SERVICE ────────────────────
    // Was "fetch all 1560, filter and page in memory". GET /products does both, so
    // a filter change is a new request, not a re-slice — and `page` is reset by the
    // effect that watches the filters, so you never land on page 9 of a 2-page result.
    useEffect(() => {
        let alive = true
        const ctrl = new AbortController()
        setLoading(true)
        const serverStatus = statusFilter === "all" ? undefined : toServerStatus(statusFilter)
        fetchProducts({
            departmentId: deptFilter === "all" ? undefined : departmentIdOf(deptTree, deptFilter),
            subDepartmentId: subDeptFilter === "all" ? undefined : subDepartmentIdOf(deptTree, subDeptFilter),
            status: serverStatus ? [serverStatus] : undefined,
            q: debouncedQuery || undefined,
            page: page - 1,              // the screen is 1-based, the service 0-based
            pageSize: PAGE_SIZE,
            sort: "UPDATED",
        }, ctrl.signal)
            .then(({ rows, meta }) => {
                if (!alive) return
                setListings(rows.map(toListingRow))
                setServerMeta(meta)
                setListError(null)
            })
            .catch((e: unknown) => {
                if (!alive) return
                setListings([])
                setServerMeta(null)
                setListError(e instanceof ApiError ? e.message : "Could not load listings.")
            })
            .finally(() => { if (alive) setLoading(false) })
        return () => { alive = false; ctrl.abort() }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [deptFilter, subDeptFilter, statusFilter, debouncedQuery, page, deptTree])

    // A filter change invalidates the page number — page 9 of a 2-page result is
    // an empty table that looks like "no listings" rather than "wrong page".
    useEffect(() => { setPage(1) }, [deptFilter, subDeptFilter, statusFilter, query])

    useEffect(() => { if (deptParam) setDeptFilter(deptParam) }, [deptParam])
    useEffect(() => { setPage(1) }, [deptFilter, query, statusFilter, tagFilter, tagMode, subDeptFilter, countryFilter, surfaceFilter, flagFilter])

    const subDeptName = (id: string) => subDepartments.find(s => s.id === id)?.nameEn ?? "—"

    /** Each flag is a predicate over one listing — cheap, and self-documenting. */
    const FLAGS: { id: string; label: string; hint: string; test: (l: Listing) => boolean }[] = [
        {
            id: "blocked", label: "Cannot go Active", hint: "one or more activation requirements unmet",
            test: l => l.status !== "active" && listingUnmetRequirements(l).length > 0,
        },
        {
            id: "noImage", label: "No image", hint: "no gallery asset and no variant image",
            test: l => (l.mediaGallery ?? []).length === 0
                && !(l.variants ?? []).some(v => !!v.imageUrl || (v.mediaGallery ?? []).length > 0),
        },
        {
            id: "noPrice", label: "No priced variant", hint: "cannot be bought",
            test: l => !(l.variants ?? []).some(v => (v.regionalData ?? []).some(r => (r.price ?? 0) > 0)),
        },
        {
            id: "noPlacement", label: "Not placed anywhere", hint: "no sub-category, so nobody can browse to it",
            test: l => (l.subCategoryIds ?? []).length === 0,
        },
        {
            id: "noSubDept", label: "Needs a sub-department", hint: "the migration could not resolve one",
            test: l => !l.subDepartmentId,
        },
        {
            id: "partnerOnly", label: "Partner-exclusive", hint: "hidden from master search",
            test: l => !!l.partnerExclusive,
        },
        // Diagnostics-specific, and only ever true for diagnostics listings.
        {
            id: "dxDrift", label: "Severe biomarker drift", hint: "countries differ by 10+ markers",
            test: l => l.department === "diagnostics"
                && biomarkerDrift(l.diagnostics?.biomarkerCountryMaps ?? []).severity === "severe",
        },
        {
            id: "dxNoSlots", label: "No nurse slot group", hint: "cannot be booked",
            test: l => l.department === "diagnostics"
                && (l.countryConfig ?? []).length > 0
                && (l.countryConfig ?? []).some(c => !countryDefaultSlot(l.diagnostics, c.country)?.slotGroupId),
        },
    ]

    /**
     * The rows to render.
     *
     * Department, sub-department, status and search are applied BY THE SERVICE, so
     * re-applying them here would be a second, disagreeing implementation.
     *
     * The other four — tags, country, surface, work-queue flags — test data the list
     * row does not carry. They are NOT applied client-side either: narrowing a page
     * after the service paged it produces short pages and a total that lies. The UI
     * disables them and says why; see UNSERVABLE_FILTERS.
     */
    const filtered = listings

    /** Set when a filter the service cannot serve is active, so the UI can explain itself. */
    const unservableActive = useMemo(() => {
        const on: string[] = []
        if (tagFilter.length > 0) on.push("tags")
        if (countryFilter !== "all") on.push("country")
        if (surfaceFilter !== "all") on.push("surface")
        if (flagFilter.length > 0) on.push("flags")
        if (isUnservableStatus(statusFilter)) on.push("status")
        return on
    }, [tagFilter, countryFilter, surfaceFilter, flagFilter, statusFilter])

    const narrowCount = flagFilter.length
        + (subDeptFilter !== "all" ? 1 : 0)
        + (countryFilter !== "all" ? 1 : 0)
        + (surfaceFilter !== "all" ? 1 : 0)
    const activeFilterCount = narrowCount + tagFilter.length
        + (statusFilter !== "all" ? 1 : 0) + (query ? 1 : 0)
    const clearFilters = () => {
        setFlagFilter([]); setSubDeptFilter("all"); setCountryFilter("all")
        setSurfaceFilter("all"); setTagFilter([]); setStatusFilter("all"); setQuery("")
    }

    // Paging is the service's answer now. totalItems is the count for the CURRENT
    // filters, which is what the footer must show — filtered.length is only this page.
    const totalItems = serverMeta?.totalItems ?? filtered.length
    const totalPages = Math.max(1, serverMeta?.totalPages ?? 1)
    const safePage = Math.min(page, totalPages)
    // Already one page from the service — slicing again would blank every page but the first.
    const paged = filtered

    return (
        <div className="flex h-[calc(100vh-112px)] flex-col">
            {/* Sticky header — stays put while the table scrolls */}
            <div className="shrink-0 space-y-4 pb-4">
                <OnboardingBanner guide="listing" />
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h2 className="text-xl font-semibold">Listings</h2>
                        <p className="text-sm text-muted-foreground">Every sellable item across all departments. One entry serves app + web.</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <GuideButton guide="listing" />
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search listings…" className="h-9 w-48 pl-8 text-sm lg:w-56" />
                        </div>
                        {deptFilter === "all" ? (
                            /* A listing must belong to a department, so ask for it here rather
                               than disabling the CTA — a dead primary button just reads as broken. */
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button size="sm" className="h-9">
                                        <Plus className="mr-2 h-4 w-4" /> New Listing
                                        <ChevronDown className="ml-1.5 h-3.5 w-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-64">
                                    <DropdownMenuLabel className="text-xs">Which department?</DropdownMenuLabel>
                                    {DEPARTMENTS.map(d => (
                                        d.id === "diagnostics" ? (
                                            /* Diagnostics is created two ways — the tier changes which
                                               fields the editor asks for, so it is chosen up front. */
                                            DIAGNOSTICS_TIERS.map(t => (
                                                <DropdownMenuItem key={t.id} asChild>
                                                    <Link href={`/catalogue/listings/new?department=diagnostics&tier=${t.id}`}
                                                        className="flex-col items-start gap-0.5 text-xs">
                                                        <span>{d.labelEn} — {t.label}</span>
                                                        <span className="text-[10px] text-muted-foreground">{t.blurb}</span>
                                                    </Link>
                                                </DropdownMenuItem>
                                            ))
                                        ) : (
                                            <DropdownMenuItem key={d.id} asChild>
                                                <Link href={`/catalogue/listings/new?department=${d.id}`} className="text-xs">
                                                    {d.labelEn}
                                                </Link>
                                            </DropdownMenuItem>
                                        )
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button size="sm" className="h-9" asChild>
                                <Link href={`/catalogue/listings/new?department=${deptFilter}`}><Plus className="mr-2 h-4 w-4" /> New Listing</Link>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Department filter */}
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant={deptFilter === "all" ? "default" : "outline"} className="h-8 text-xs" onClick={() => setDeptFilter("all")}>
                        All Departments
                    </Button>
                    {DEPARTMENTS.map(d => (
                        <Button key={d.id} size="sm" variant={deptFilter === d.id ? "default" : "outline"} className="h-8 text-xs" onClick={() => setDeptFilter(d.id)}>
                            {d.labelEn}
                        </Button>
                    ))}

                    {/* Filters share the department-chip row rather than adding another
                        control band. */}
                    <div className="ml-auto flex items-center gap-1.5">
                        {activeFilterCount > 0 && (
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground"
                                onClick={clearFilters}>
                                Clear {activeFilterCount}
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant={narrowCount > 0 ? "default" : "outline"} className="h-8 text-xs">
                                    <SlidersHorizontal className="mr-1.5 h-3.5 w-3.5" />
                                    Filters{narrowCount > 0 && ` · ${narrowCount}`}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="max-h-[70vh] w-80 overflow-y-auto">
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Needs attention
                                </DropdownMenuLabel>
                                {FLAGS.map(f => {
                                    const n = listings.filter(f.test).length
                                    return (
                                        <DropdownMenuItem key={f.id} className="flex-col items-start gap-0.5 text-xs"
                                            onSelect={e => {
                                                e.preventDefault()
                                                setFlagFilter(prev => prev.includes(f.id)
                                                    ? prev.filter(x => x !== f.id) : [...prev, f.id])
                                            }}>
                                            <span className="flex w-full items-center gap-2">
                                                <span className={`flex h-3.5 w-3.5 items-center justify-center rounded border ${flagFilter.includes(f.id) ? "bg-primary text-primary-foreground" : ""}`}>
                                                    {flagFilter.includes(f.id) && <Check className="h-2.5 w-2.5" />}
                                                </span>
                                                {f.label}
                                                {/* the count is the point — it says how much work is waiting */}
                                                <span className="ml-auto font-mono text-[10px] text-muted-foreground">{n}</span>
                                            </span>
                                            <span className="pl-[22px] text-[10px] text-muted-foreground">{f.hint}</span>
                                        </DropdownMenuItem>
                                    )
                                })}
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Sub-department
                                </DropdownMenuLabel>
                                <div className="px-2 pb-2">
                                    <Select value={subDeptFilter} onValueChange={setSubDeptFilter}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent className="max-h-64">
                                            <SelectItem value="all">All sub-departments</SelectItem>
                                            {subDepartments
                                                .filter(sd => deptFilter === "all" || sd.department === deptFilter)
                                                .map(sd => (
                                                    <SelectItem key={sd.id} value={sd.id}>{sd.nameEn}</SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Sold in
                                </DropdownMenuLabel>
                                <div className="px-2 pb-2">
                                    <Select value={countryFilter} onValueChange={v => setCountryFilter(v as Country | "all")}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Any country</SelectItem>
                                            {(["UAE", "KSA", "QATAR", "KUWAIT", "OTHERS"] as Country[]).map(c => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                    Surface
                                </DropdownMenuLabel>
                                <div className="px-2 pb-2">
                                    <Select value={surfaceFilter} onValueChange={v => setSurfaceFilter(v as typeof surfaceFilter)}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">App &amp; web</SelectItem>
                                            <SelectItem value="both">Both surfaces</SelectItem>
                                            <SelectItem value="app">App only</SelectItem>
                                            <SelectItem value="web">Web only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {tagFilter.length > 1 && (
                            <div className="flex overflow-hidden rounded-md border">
                                {(["all", "any"] as const).map(m => (
                                    <button key={m} type="button" onClick={() => setTagMode(m)}
                                        className={`px-2 py-1 text-[11px] ${tagMode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
                                        title={m === "all" ? "Must carry every selected tag" : "Carries at least one selected tag"}>
                                        {m === "all" ? "Match all" : "Match any"}
                                    </button>
                                ))}
                            </div>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant={tagFilter.length ? "default" : "outline"} className="h-8 text-xs">
                                    <TagIcon className="mr-1.5 h-3.5 w-3.5" />
                                    {tagFilter.length ? `${tagFilter.length} tag${tagFilter.length === 1 ? "" : "s"}` : "Tags"}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="max-h-80 w-72 overflow-y-auto">
                                <DropdownMenuLabel className="text-xs">Filter by tag</DropdownMenuLabel>
                                {tagFilter.length > 0 && (
                                    <DropdownMenuItem onSelect={e => { e.preventDefault(); setTagFilter([]) }} className="text-xs">
                                        Clear {tagFilter.length} selected
                                    </DropdownMenuItem>
                                )}
                                {TAG_NAMESPACES.map(n => {
                                    const rows = tags.filter(t => t.namespace === n.id && t.status === "active")
                                    if (rows.length === 0) return null
                                    return (
                                        <div key={n.id}>
                                            <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                                {n.label}
                                            </DropdownMenuLabel>
                                            {rows.map(t => (
                                                <DropdownMenuItem key={t.id} className="text-xs"
                                                    onSelect={e => {
                                                        e.preventDefault()
                                                        setTagFilter(prev => prev.includes(t.id) ? prev.filter(x => x !== t.id) : [...prev, t.id])
                                                    }}>
                                                    <span className={`mr-2 flex h-3.5 w-3.5 items-center justify-center rounded border ${tagFilter.includes(t.id) ? "bg-primary text-primary-foreground" : ""}`}>
                                                        {tagFilter.includes(t.id) && <Check className="h-2.5 w-2.5" />}
                                                    </span>
                                                    {t.nameEn}
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    )
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
                {deptFilter === "all" && (
                    <p className="text-xs text-muted-foreground">Filter by department to narrow the list — “New Listing” will ask which one.</p>
                )}

                {/* The list is now served by GET /products, so a filter the service cannot
                        express has to be reported rather than quietly ignored. Applying it to the
                        page after the service paged it would give short pages and a wrong total —
                        the kind of failure that reads as missing data. */}
                {unservableActive.length > 0 && (
                    <div className="mt-2 rounded-md border border-amber-500/40 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
                            <span className="font-medium">
                                Not applied — the listings service cannot filter on {unservableActive.join(", ")}:
                            </span>
                            <ul className="mt-1 space-y-0.5">
                                {unservableActive.map(k => (
                                    <li key={k}>
                                        <span className="font-medium">{k}</span> —{" "}
                                        {k === "status"
                                            ? "“inactive” has no server-side equivalent (DRAFT · ACTIVE · ARCHIVED)."
                                            : UNSERVABLE_FILTERS[k]}
                                    </li>
                                ))}
                        </ul>
                    </div>
                )}

                {listError && (
                    <div className="mt-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
                        {listError} The table below is empty because the request failed — this is not an empty catalogue.
                    </div>
                )}
            </div>

            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden py-0">
                {loading ? (
                    <div className="py-16 text-center text-muted-foreground text-sm">Loading listings…</div>
                ) : (
                    <>
                        <Table containerClassName="min-h-0 flex-1 overflow-auto">
                                <TableHeader className="sticky top-0 z-10 bg-muted">
                                    <TableRow className="bg-muted hover:bg-muted">
                                        <TableHead className="text-xs">ID</TableHead>
                                        <TableHead className="text-xs">Name</TableHead>
                                        <TableHead className="text-xs">Department</TableHead>
                                        <TableHead className="text-xs">Sub-department</TableHead>
                                        <TableHead className="text-xs p-0">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className="flex h-full w-full items-center gap-1 px-2 py-3 text-xs font-medium hover:text-foreground focus:outline-none">
                                                    Status
                                                    {statusFilter !== "all" && <Badge variant="outline" className={`ml-1 text-[9px] ${STATUS_BADGE[statusFilter]}`}>{statusFilter}</Badge>}
                                                    <ChevronDown className="h-3 w-3 opacity-60" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                    <DropdownMenuLabel className="text-xs">Filter by status</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                                                        <span className="flex-1">All statuses</span>{statusFilter === "all" && <Check className="h-3.5 w-3.5" />}
                                                    </DropdownMenuItem>
                                                    {STATUSES.map(s => (
                                                        <DropdownMenuItem key={s} onClick={() => setStatusFilter(s)}>
                                                            <span className="flex-1">{statusMeta(s).label}</span>{statusFilter === s && <Check className="h-3.5 w-3.5" />}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableHead>
                                        <TableHead className="text-xs text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paged.length === 0 ? (
                                        <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm italic">No listings match.</TableCell></TableRow>
                                    ) : paged.map(l => (
                                        <TableRow key={l.id} className="hover:bg-muted/20">
                                            {/* ID and Name are their OWN columns, exactly like
                                                Department and Sub-department — one fact per cell,
                                                so every column is scannable down the page. */}
                                            <TableCell className="py-2.5 font-mono text-xs text-muted-foreground">
                                                {(l as { apiUid?: string }).apiUid ?? `#${l.id}`}
                                            </TableCell>
                                            <TableCell className="py-2.5">
                                                <span className={l.displayNameEn || l.internalName
                                                    ? "text-sm font-medium"
                                                    : "text-sm italic text-muted-foreground"}>
                                                    {l.displayNameEn || l.internalName || "Unnamed"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="py-2.5 text-xs">{departmentLabel(l.department)}</TableCell>
                                            <TableCell className="py-2.5 text-xs">{subDeptName(l.subDepartmentId)}</TableCell>
                                            <TableCell className="py-2.5"><Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[l.status]}`}
                                            title={statusMeta(l.status).blurb}>{statusMeta(l.status).label}</Badge></TableCell>
                                            <TableCell className="py-2.5 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button size="icon" variant="ghost" className="h-8 w-8" title="View history" asChild>
                                                        <Link href={`/audit?entityType=listing&entityId=${l.id}`}><History className="h-3.5 w-3.5" /></Link>
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8" asChild>
                                                        <Link href={`/catalogue/listings/${l.id}`}><Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit</Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                        {/* Pagination footer */}
                        <div className="flex shrink-0 items-center justify-between border-t px-4 py-2.5">
                            <span className="text-xs text-muted-foreground">
                                {totalItems === 0 ? "0 listings" : `Showing ${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, totalItems)} of ${totalItems}`}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="h-8" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                                    <ChevronLeft className="h-4 w-4" /> Prev
                                </Button>
                                <span className="text-xs tabular-nums text-muted-foreground">Page {safePage} of {totalPages}</span>
                                <Button size="sm" variant="outline" className="h-8" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                                    Next <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Card>
        </div>
    )
}

export default function ListingsPage() {
    return (
        <Suspense fallback={<div className="py-16 text-center text-muted-foreground text-sm">Loading…</div>}>
            <ListingsInner />
        </Suspense>
    )
}
