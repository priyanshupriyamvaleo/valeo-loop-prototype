"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Users } from "lucide-react"
import { ApiService } from "@/services/api"
import { ListingEditorShell, EditorSection } from "@/components/catalogue/ListingEditorShell"
import { GuideButton } from "@/components/catalogue/OnboardingGuide"
import { PartnerAccessSection } from "@/components/catalogue/PartnerAccessSection"
import { PromoBannerSelect } from "@/components/catalogue/PromoBannerSelect"
import {
    CategoryContentFields, SearchableCheckList, CheckOption,
    VISIBLE_ON_BADGE, DEPARTMENT_LABEL,
} from "@/components/catalogue/category-fields"
import { Category, SubCategory, Listing, VisibleOn, SubDepartment, CategoryContent, CataloguePartner, City, PromoBanner } from "@/types"

// One working shape covering both a Category and a SubCategory. Category-only
// (`subCategoryIds`) and sub-category-only (`categoryId`, `listingIds`) fields
// coexist here; only the relevant ones are edited per `kind`. Mock/local only.
interface EditorRecord extends Category {
    categoryId?: string
    listingIds?: string[]
}

function emptyRecord(): EditorRecord {
    return {
        id: "",
        nameEn: "",
        nameAr: "",
        slug: "",
        visibleOn: "both",
        sortOrder: 0,
        isActive: true,
        subCategoryIds: [],
        listingIds: [],
        categoryId: undefined,
    }
}

export function CategoryEditor({ kind }: { kind: "category" | "subcategory" }) {
    const params = useParams()
    const isNew = params.id === "new"
    const isSub = kind === "subcategory"

    const [record, setRecord] = useState<EditorRecord>(emptyRecord())
    const [activeSection, setActiveSection] = useState("identity")
    const [loading, setLoading] = useState(!isNew)
    const [showErrors, setShowErrors] = useState(false)

    const [categories, setCategories] = useState<Category[]>([])
    const [subCategories, setSubCategories] = useState<SubCategory[]>([])
    const [listings, setListings] = useState<Listing[]>([])
    const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
    const [partners, setPartners] = useState<CataloguePartner[]>([])
    const [cities, setCities] = useState<City[]>([])

    useEffect(() => {
        ApiService.catalogue.categories().then(setCategories)
        ApiService.catalogue.subCategories().then(setSubCategories)
        ApiService.catalogue.listings().then(setListings)
        ApiService.catalogue.subDepartments().then(setSubDepartments)
        ApiService.catalogue.partners().then(setPartners)
        ApiService.catalogue.cities().then(setCities)
    }, [])

    // Hydrate from the matching record when editing.
    useEffect(() => {
        if (isNew || typeof params.id !== "string") return
        if (isSub) {
            const found = subCategories.find(sc => sc.id === params.id)
            if (found) {
                // Resolve parent from the category side too (mock links both ways).
                const parent = categories.find(c => c.subCategoryIds?.includes(found.id))
                setRecord({ ...emptyRecord(), ...found, categoryId: found.categoryId ?? parent?.id })
                setLoading(false)
            }
        } else {
            const found = categories.find(c => c.id === params.id)
            if (found) {
                setRecord({ ...emptyRecord(), ...found })
                setLoading(false)
            }
        }
    }, [isNew, isSub, params.id, categories, subCategories])

    const update = (patch: Partial<EditorRecord>) => setRecord(prev => ({ ...prev, ...patch }))
    const updateContent = (patch: Partial<CategoryContent>) => setRecord(prev => ({ ...prev, ...patch }))

    // ── Mapping (local Set boundary) ──
    const subCatSelected = useMemo(() => new Set(record.subCategoryIds ?? []), [record.subCategoryIds])
    const listingSelected = useMemo(() => new Set(record.listingIds ?? []), [record.listingIds])

    const toggleSubCat = (id: string) => {
        const next = new Set(record.subCategoryIds ?? [])
        if (next.has(id)) next.delete(id); else next.add(id)
        update({ subCategoryIds: Array.from(next) })
    }
    const toggleListing = (id: string) => {
        const next = new Set(record.listingIds ?? [])
        if (next.has(id)) next.delete(id); else next.add(id)
        update({ listingIds: Array.from(next) })
    }
    const bulkToggleListing = (ids: string[], select: boolean) => {
        const next = new Set(record.listingIds ?? [])
        ids.forEach(id => { if (select) next.add(id); else next.delete(id) })
        update({ listingIds: Array.from(next) })
    }

    const subCatOptions: CheckOption[] = subCategories.map(sc => ({
        id: sc.id, primary: sc.nameEn, secondary: sc.nameAr, primaryDir: "ltr",
    }))
    const listingOptions: CheckOption[] = listings.map(l => ({
        id: l.id,
        primary: l.displayNameEn,
        secondary: DEPARTMENT_LABEL[l.department] ?? l.department,
        department: l.department,
        subDepartmentId: l.subDepartmentId,
    }))

    // ── Validation (name required) ──
    const nameError = !record.nameEn.trim()
    const handleSave = () => {
        setShowErrors(true)
        if (nameError) setActiveSection("identity")
        // Mock prototype — no persistence beyond validation.
    }

    const noun = isSub ? "Sub-category" : "Category"
    const vis = VISIBLE_ON_BADGE[record.visibleOn]

    const sections: EditorSection[] = [
        { id: "identity", label: "Identity", hasError: showErrors && nameError },
        { id: "mapping", label: isSub ? "Listings" : "Sub-categories", badge: isSub ? (record.listingIds?.length ?? 0) : (record.subCategoryIds?.length ?? 0) },
        { id: "hero", label: "Hero" },
        { id: "stats", label: "Highlight Stats" },
        { id: "promo", label: "Promo" },
        { id: "description", label: "Description" },
        { id: "info", label: "Info Block" },
        { id: "options", label: "Options" },
        { id: "faq", label: "FAQ" },
        { id: "seo", label: "SEO & Metadata" },
        { id: "partners", label: "Partner Access", badge: (record.partnerAccess ?? []).length || undefined },
    ]

    if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading {noun.toLowerCase()}…</div>

    return (
        <ListingEditorShell
            backHref="/catalogue/categories"
            title={isNew ? `New ${noun}` : (record.nameEn || `Edit ${noun}`)}
            subtitle={isNew ? `Create a merchandising ${noun.toLowerCase()} landing page` : `/${record.slug}`}
            titleBadge={<Badge variant="outline" className={vis.className}>{vis.label}</Badge>}
            headerActions={<GuideButton guide={isSub ? "subcategory" : "category"} />}
            saveLabel={`Save ${noun}`}
            onSave={handleSave}
            sections={sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
        >
            {showErrors && nameError && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Name (EN) is required. Check the Identity section.</span>
                </div>
            )}

            {/* ── IDENTITY ── */}
            {activeSection === "identity" && (
                <Card>
                    <CardHeader>
                        <CardTitle>Identity</CardTitle>
                        <CardDescription>Naming, surface visibility and status.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="flex items-center gap-1.5">
                                    Name (EN) <span className="text-destructive">*</span>
                                    {showErrors && nameError && <span className="h-1.5 w-1.5 rounded-full bg-destructive" />}
                                </Label>
                                <Input
                                    value={record.nameEn}
                                    onChange={e => update({ nameEn: e.target.value })}
                                    placeholder={isSub ? "Energy & Focus" : "Shop by Goal"}
                                    className={showErrors && nameError ? "border-destructive" : undefined}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Name (AR)</Label>
                                <Input dir="rtl" value={record.nameAr} onChange={e => update({ nameAr: e.target.value })} placeholder={isSub ? "الطاقة والتركيز" : "تسوق حسب الهدف"} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Slug</Label>
                                <Input value={record.slug} onChange={e => update({ slug: e.target.value })} placeholder={isSub ? "energy-focus" : "shop-by-goal"} className="font-mono text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Visible on</Label>
                                <Select value={record.visibleOn} onValueChange={(v: VisibleOn) => update({ visibleOn: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="app">App</SelectItem>
                                        <SelectItem value="web">Web</SelectItem>
                                        <SelectItem value="both">App + Web</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {isSub && (
                            <div className="space-y-1.5">
                                <Label>Parent Category</Label>
                                <Select value={record.categoryId ?? "none"} onValueChange={v => update({ categoryId: v === "none" ? undefined : v })}>
                                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">None</SelectItem>
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <p className="text-[11px] text-muted-foreground">The category this sub-category is merchandised under.</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between rounded-md border px-3 py-2">
                            <Label className="cursor-pointer">Active</Label>
                            <Switch checked={record.isActive} onCheckedChange={v => update({ isActive: v })} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ── MAPPING ── */}
            {activeSection === "mapping" && (
                <Card>
                    <CardHeader>
                        <CardTitle>{isSub ? "Listings" : "Sub-categories"}</CardTitle>
                        <CardDescription>
                            {isSub
                                ? `Toggle which listings appear in this sub-category. ${listings.length} available.`
                                : "Toggle which sub-categories belong to this category."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSub ? (
                            <SearchableCheckList
                                options={listingOptions}
                                selected={listingSelected}
                                onToggle={toggleListing}
                                onBulkToggle={bulkToggleListing}
                                subDepartments={subDepartments}
                                placeholder="Search listings by name…"
                                emptyLabel="No listings match."
                            />
                        ) : (
                            <SearchableCheckList
                                options={subCatOptions}
                                selected={subCatSelected}
                                onToggle={toggleSubCat}
                                placeholder="Search sub-categories…"
                                emptyLabel="No sub-categories available."
                            />
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ── LANDING-PAGE CONTENT (one concern per section) ── */}
            {(["hero", "stats", "promo", "description", "info", "options", "faq", "seo"] as const).map(sec =>
                activeSection === sec ? (
                    <Card key={sec}>
                        <CardHeader>
                            <CardTitle>{sections.find(s => s.id === sec)?.label}</CardTitle>
                            <CardDescription>Landing-page content rendered on web &amp; app.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CategoryContentFields value={record} onChange={updateContent} only={sec} />
                        </CardContent>
                    </Card>
                ) : null
            )}

            {/* ── PARTNER ACCESS ── */}
            {activeSection === "partners" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4" /> Partner Access</CardTitle>
                        <CardDescription>Grant B2B / corporate / external partners Owner or Viewer access to this {noun.toLowerCase()}.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <div>
                                <Label className="text-sm font-medium">Partner-exclusive {noun.toLowerCase()}</Label>
                                <p className="text-xs text-muted-foreground">Hide from Valeo's master search — only the assigned partner(s) can surface it.</p>
                            </div>
                            <Switch checked={!!record.partnerExclusive} onCheckedChange={v => update({ partnerExclusive: v })} />
                        </div>
                        <PartnerAccessSection
                            partners={partners}
                            value={record.partnerAccess ?? []}
                            onChange={v => update({ partnerAccess: v })}
                            enableOverrides
                            cities={cities}
                        />
                    </CardContent>
                </Card>
            )}
        </ListingEditorShell>
    )
}
