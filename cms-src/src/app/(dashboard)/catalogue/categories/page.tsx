"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Plus, LayoutGrid, ListTree, Search, Pencil, Info } from "lucide-react"
import { ApiService } from "@/services/api"
import { OnboardingBanner } from "@/components/catalogue/OnboardingGuide"
import { Category, SubCategory, Listing, SubDepartment, VisibleOn } from "@/types"
import {
    SearchableCheckList, CheckOption, VISIBLE_ON_BADGE, DEPARTMENT_LABEL,
} from "@/components/catalogue/category-fields"

// ── Resolution helpers (support both directions since the mock links both ways) ──
function subCategoriesOfCategory(cat: Category, subCategories: SubCategory[]): SubCategory[] {
    return subCategories.filter(
        sc => cat.subCategoryIds?.includes(sc.id) || sc.categoryId === cat.id
    )
}

function listingsOfSubCategory(sc: SubCategory, listings: Listing[]): Listing[] {
    return listings.filter(
        l => sc.listingIds?.includes(l.id) || l.subCategoryIds?.includes(sc.id)
    )
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [subCategories, setSubCategories] = useState<SubCategory[]>([])
    const [listings, setListings] = useState<Listing[]>([])
    const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [search, setSearch] = useState("")

    // Sub-categories tab filters (distinct from the SearchableCheckList locals)
    const [subTabDept, setSubTabDept] = useState<string>("all")
    const [subTabSubDept, setSubTabSubDept] = useState<string>("all")

    // Dialog state (mapping quick actions only — create/edit lives in the full-page editor)
    const [mapSubsForCat, setMapSubsForCat] = useState<Category | null>(null)
    const [mapListingsForSub, setMapListingsForSub] = useState<SubCategory | null>(null)

    useEffect(() => {
        const loadData = async () => {
            try {
                const [cats, subs, lists, subDepts] = await Promise.all([
                    ApiService.catalogue.categories(),
                    ApiService.catalogue.subCategories(),
                    ApiService.catalogue.listings(),
                    ApiService.catalogue.subDepartments(),
                ])
                setCategories(cats)
                setSubCategories(subs)
                setListings(lists)
                setSubDepartments(subDepts)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    // ── Local mutations (no persistence) ──
    const toggleCategoryActive = (id: string) => {
        setCategories(prev => prev.map(c => (c.id === id ? { ...c, isActive: !c.isActive } : c)))
    }

    const toggleSubCategoryActive = (id: string) => {
        setSubCategories(prev => prev.map(sc => (sc.id === id ? { ...sc, isActive: !sc.isActive } : sc)))
    }

    // Save the sub-category ↔ category mapping (authoritative on both sides).
    const saveCategoryMapping = (categoryId: string, selectedSubIds: Set<string>) => {
        setCategories(prev =>
            prev.map(c =>
                c.id === categoryId ? { ...c, subCategoryIds: Array.from(selectedSubIds) } : c
            )
        )
        setSubCategories(prev =>
            prev.map(sc => {
                if (selectedSubIds.has(sc.id)) return { ...sc, categoryId }
                if (sc.categoryId === categoryId) return { ...sc, categoryId: undefined }
                return sc
            })
        )
    }

    // Create a brand-new sub-category (with its fields) from the map dialog.
    const createSubCategory = (data: { nameEn: string; nameAr: string; slug: string; visibleOn: VisibleOn }, categoryId?: string): string => {
        const id = `sc-${Date.now().toString(36)}`
        const newSc: SubCategory = {
            id,
            categoryId,
            nameEn: data.nameEn,
            nameAr: data.nameAr,
            slug: data.slug || data.nameEn.trim().toLowerCase().replace(/\s+/g, "-"),
            visibleOn: data.visibleOn,
            sortOrder: subCategories.length,
            isActive: true,
        }
        setSubCategories(prev => [...prev, newSc])
        return id
    }

    // Save the listing ↔ sub-category mapping (authoritative on both sides).
    const saveListingMapping = (subId: string, selectedListingIds: Set<string>) => {
        setSubCategories(prev =>
            prev.map(sc =>
                sc.id === subId ? { ...sc, listingIds: Array.from(selectedListingIds) } : sc
            )
        )
        setListings(prev =>
            prev.map(l => {
                const has = l.subCategoryIds?.includes(subId) ?? false
                if (selectedListingIds.has(l.id) && !has) {
                    return { ...l, subCategoryIds: [...(l.subCategoryIds ?? []), subId] }
                }
                if (!selectedListingIds.has(l.id) && has) {
                    return { ...l, subCategoryIds: (l.subCategoryIds ?? []).filter(id => id !== subId) }
                }
                return l
            })
        )
    }

    // ── Filtering by search (both categories and sub-categories) ──
    const matchesQuery = (nameEn: string, nameAr: string) => {
        const q = search.trim().toLowerCase()
        if (!q) return true
        return nameEn.toLowerCase().includes(q) || nameAr.toLowerCase().includes(q)
    }

    // Resolve a sub-category's parent (supports both link directions).
    const parentCategoryOf = (sc: SubCategory): Category | undefined =>
        categories.find(c => c.subCategoryIds?.includes(sc.id) || sc.categoryId === c.id)

    // Flat, sorted, search-filtered category list for the Categories tab.
    const categoryRows = useMemo(() => {
        return categories
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .filter(cat => matchesQuery(cat.nameEn, cat.nameAr))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categories, search])

    // Flat, sorted, search + department-filtered sub-category list for the Sub-categories tab.
    const subCategoryRows = useMemo(() => {
        return subCategories
            .slice()
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .filter(sc => {
                if (!matchesQuery(sc.nameEn, sc.nameAr)) return false
                if (subTabDept === "all" && subTabSubDept === "all") return true
                const scListings = listingsOfSubCategory(sc, listings)
                return scListings.some(
                    l =>
                        (subTabDept === "all" || l.department === subTabDept) &&
                        (subTabSubDept === "all" || l.subDepartmentId === subTabSubDept)
                )
            })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subCategories, listings, search, subTabDept, subTabSubDept])

    // Sub-department options for the dependent Select in the Sub-categories tab.
    const subTabSubDeptOptions = useMemo(
        () => subDepartments.filter(s => subTabDept === "all" || s.department === subTabDept),
        [subDepartments, subTabDept]
    )

    return (
        <div className="space-y-4">
            <OnboardingBanner guide="category" />
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
                    <p className="text-muted-foreground">
                        Web/App merchandising — Category → Sub-category → Listings
                    </p>
                </div>
            </div>

            {/* Explanatory note */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex gap-3 py-4">
                    <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <p className="text-sm text-muted-foreground">
                        Mapping is authored here from the category side. A{" "}
                        <span className="font-medium text-foreground">Category</span> contains{" "}
                        <span className="font-medium text-foreground">Sub-categories</span>, and each
                        sub-category contains <span className="font-medium text-foreground">Listings</span>.
                        Everything below is editable locally.
                    </p>
                </CardContent>
            </Card>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search categories & sub-categories..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 h-9"
                />
            </div>

            {isLoading ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Loading categories...
                    </CardContent>
                </Card>
            ) : (
                <Tabs defaultValue="categories" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="categories">
                            <LayoutGrid className="mr-2 h-4 w-4" /> Categories
                        </TabsTrigger>
                        <TabsTrigger value="sub-categories">
                            <ListTree className="mr-2 h-4 w-4" /> Sub-categories
                        </TabsTrigger>
                    </TabsList>

                    {/* ── Categories tab ── */}
                    <TabsContent value="categories">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle>Categories</CardTitle>
                                    <CardDescription>
                                        {categoryRows.length} categor{categoryRows.length === 1 ? "y" : "ies"}
                                    </CardDescription>
                                </div>
                                <Button asChild>
                                    <Link href="/catalogue/categories/new">
                                        <Plus className="mr-2 h-4 w-4" /> New Category
                                    </Link>
                                </Button>
                            </CardHeader>
                            <Separator />
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead>Name</TableHead>
                                            <TableHead>Slug</TableHead>
                                            <TableHead className="w-32">Visible On</TableHead>
                                            <TableHead className="w-32 text-center"># Sub-categories</TableHead>
                                            <TableHead className="w-20">Active</TableHead>
                                            <TableHead className="w-64 text-right pr-4">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {categoryRows.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={6}
                                                    className="text-center py-8 text-muted-foreground"
                                                >
                                                    {search
                                                        ? "No categories match your search."
                                                        : "No categories yet. Create one to get started."}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            categoryRows.map(cat => {
                                                const vis = VISIBLE_ON_BADGE[cat.visibleOn]
                                                const subCount = subCategoriesOfCategory(cat, subCategories).length
                                                return (
                                                    <TableRow key={cat.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{cat.nameEn}</span>
                                                                <span className="text-sm text-muted-foreground" dir="rtl">
                                                                    {cat.nameAr}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">/{cat.slug}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={vis.className}>
                                                                {vis.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="text-sm font-medium">{subCount}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Switch
                                                                checked={cat.isActive}
                                                                onCheckedChange={() => toggleCategoryActive(cat.id)}
                                                                aria-label="Toggle category active"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right pr-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setMapSubsForCat(cat)}
                                                                >
                                                                    <ListTree className="mr-2 h-4 w-4" /> Map
                                                                </Button>
                                                                <Button asChild variant="outline" size="sm">
                                                                    <Link href={`/catalogue/categories/${cat.id}`}>
                                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                                    </Link>
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── Sub-categories tab ── */}
                    <TabsContent value="sub-categories">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <CardTitle>Sub-categories</CardTitle>
                                    <CardDescription>
                                        {subCategoryRows.length} sub-categor{subCategoryRows.length === 1 ? "y" : "ies"}
                                    </CardDescription>
                                </div>
                                <Button asChild>
                                    <Link href="/catalogue/sub-categories/new">
                                        <Plus className="mr-2 h-4 w-4" /> New Sub-category
                                    </Link>
                                </Button>
                            </CardHeader>
                            <Separator />
                            <div className="flex flex-wrap items-center gap-2 px-6 py-3">
                                <span className="text-xs text-muted-foreground">Filter by</span>
                                <Select
                                    value={subTabDept}
                                    onValueChange={v => {
                                        setSubTabDept(v)
                                        setSubTabSubDept("all")
                                    }}
                                >
                                    <SelectTrigger className="h-9 w-[200px]">
                                        <SelectValue placeholder="Department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {Object.keys(DEPARTMENT_LABEL).map(d => (
                                            <SelectItem key={d} value={d}>
                                                {DEPARTMENT_LABEL[d]}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={subTabSubDept} onValueChange={setSubTabSubDept}>
                                    <SelectTrigger className="h-9 w-[200px]">
                                        <SelectValue placeholder="Sub-department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sub-departments</SelectItem>
                                        {subTabSubDeptOptions.map(s => (
                                            <SelectItem key={s.id} value={s.id}>
                                                {s.nameEn}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Separator />
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead>Name</TableHead>
                                            <TableHead>Parent Category</TableHead>
                                            <TableHead>Slug</TableHead>
                                            <TableHead className="w-32">Visible On</TableHead>
                                            <TableHead className="w-24 text-center"># Listings</TableHead>
                                            <TableHead className="w-20">Active</TableHead>
                                            <TableHead className="w-56 text-right pr-4">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subCategoryRows.length === 0 ? (
                                            <TableRow>
                                                <TableCell
                                                    colSpan={7}
                                                    className="text-center py-8 text-muted-foreground"
                                                >
                                                    {search || subTabDept !== "all" || subTabSubDept !== "all"
                                                        ? "No sub-categories match your filters."
                                                        : "No sub-categories yet. Create one to get started."}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            subCategoryRows.map(sc => {
                                                const scVis = VISIBLE_ON_BADGE[sc.visibleOn]
                                                const parent = parentCategoryOf(sc)
                                                const listingCount = listingsOfSubCategory(sc, listings).length
                                                return (
                                                    <TableRow key={sc.id}>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">{sc.nameEn}</span>
                                                                <span className="text-sm text-muted-foreground" dir="rtl">
                                                                    {sc.nameAr}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {parent ? (
                                                                parent.nameEn
                                                            ) : (
                                                                <span className="text-muted-foreground">—</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">/{sc.slug}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className={scVis.className}>
                                                                {scVis.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className="text-sm font-medium">{listingCount}</span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Switch
                                                                checked={sc.isActive}
                                                                onCheckedChange={() => toggleSubCategoryActive(sc.id)}
                                                                aria-label="Toggle sub-category active"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-right pr-4">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setMapListingsForSub(sc)}
                                                                >
                                                                    <ListTree className="mr-2 h-4 w-4" /> Map
                                                                </Button>
                                                                <Button asChild variant="outline" size="sm">
                                                                    <Link href={`/catalogue/sub-categories/${sc.id}`}>
                                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                                    </Link>
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* Edit / map sub-categories into a category */}
            <MapSubCategoriesDialog
                category={mapSubsForCat}
                onOpenChange={open => !open && setMapSubsForCat(null)}
                subCategories={subCategories}
                initialSelected={
                    mapSubsForCat
                        ? new Set(
                              subCategoriesOfCategory(mapSubsForCat, subCategories).map(sc => sc.id)
                          )
                        : new Set<string>()
                }
                onSave={saveCategoryMapping}
                onCreate={createSubCategory}
            />

            {/* Map listings into a sub-category */}
            <MapListingsDialog
                subCategory={mapListingsForSub}
                onOpenChange={open => !open && setMapListingsForSub(null)}
                listings={listings}
                subDepartments={subDepartments}
                initialSelected={
                    mapListingsForSub
                        ? new Set(
                              listingsOfSubCategory(mapListingsForSub, listings).map(l => l.id)
                          )
                        : new Set<string>()
                }
                onSave={saveListingMapping}
            />
        </div>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// Map sub-categories into an existing category
// ────────────────────────────────────────────────────────────────────────────
function MapSubCategoriesDialog({
    category,
    onOpenChange,
    subCategories,
    initialSelected,
    onSave,
    onCreate,
}: {
    category: Category | null
    onOpenChange: (open: boolean) => void
    subCategories: SubCategory[]
    initialSelected: Set<string>
    onSave: (categoryId: string, selected: Set<string>) => void
    onCreate: (data: { nameEn: string; nameAr: string; slug: string; visibleOn: VisibleOn }, categoryId?: string) => string
}) {
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [creating, setCreating] = useState(false)
    const [draft, setDraft] = useState({ nameEn: "", nameAr: "", slug: "", visibleOn: "both" as VisibleOn })
    const resetDraft = () => setDraft({ nameEn: "", nameAr: "", slug: "", visibleOn: "both" })
    const createAndAdd = () => {
        if (!draft.nameEn.trim()) return
        const id = onCreate(draft, category?.id)
        setSelected(prev => new Set(prev).add(id))
        resetDraft()
        setCreating(false)
    }

    // Re-seed selection whenever a new category is opened.
    useEffect(() => {
        if (category) setSelected(new Set(initialSelected))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [category?.id])

    const toggle = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleSave = () => {
        if (category) onSave(category.id, selected)
        onOpenChange(false)
    }

    const options: CheckOption[] = subCategories.map(sc => ({
        id: sc.id,
        primary: sc.nameEn,
        secondary: sc.nameAr,
    }))

    return (
        <Dialog open={category !== null} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-4 overflow-hidden">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Map sub-categories</DialogTitle>
                    <DialogDescription>
                        Toggle which sub-categories belong to{" "}
                        <span className="font-medium text-foreground">{category?.nameEn}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
                    {/* Create a brand-new sub-category with its fields */}
                    {creating ? (
                        <div className="space-y-2 rounded-md border bg-muted/20 p-3">
                            <p className="text-xs font-semibold">New sub-category</p>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1"><Label className="text-[11px]">Name (EN) *</Label><Input className="h-8 text-sm" value={draft.nameEn} onChange={e => setDraft(d => ({ ...d, nameEn: e.target.value }))} placeholder="Energy & Focus" /></div>
                                <div className="space-y-1"><Label className="text-[11px]">Name (AR)</Label><Input dir="rtl" className="h-8 text-right text-sm" value={draft.nameAr} onChange={e => setDraft(d => ({ ...d, nameAr: e.target.value }))} placeholder="الطاقة والتركيز" /></div>
                                <div className="space-y-1"><Label className="text-[11px]">Slug</Label><Input className="h-8 font-mono text-sm" value={draft.slug} onChange={e => setDraft(d => ({ ...d, slug: e.target.value }))} placeholder="auto from name" /></div>
                                <div className="space-y-1">
                                    <Label className="text-[11px]">Surface</Label>
                                    <Select value={draft.visibleOn} onValueChange={v => setDraft(d => ({ ...d, visibleOn: v as VisibleOn }))}>
                                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="both">App + Web</SelectItem>
                                            <SelectItem value="app">App</SelectItem>
                                            <SelectItem value="web">Web</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { resetDraft(); setCreating(false) }}>Cancel</Button>
                                <Button size="sm" onClick={createAndAdd} disabled={!draft.nameEn.trim()}>Create &amp; add</Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground">Full landing-page content can be edited later from the sub-category editor.</p>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm" className="w-full" onClick={() => setCreating(true)}>
                            <Plus className="mr-2 h-4 w-4" /> New sub-category
                        </Button>
                    )}

                    <SearchableCheckList
                        options={options}
                        selected={selected}
                        onToggle={toggle}
                        placeholder="Search sub-categories..."
                        emptyLabel="No sub-categories available."
                    />
                </div>

                <DialogFooter className="shrink-0 border-t pt-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save mapping</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ────────────────────────────────────────────────────────────────────────────
// Map listings into an existing sub-category
// ────────────────────────────────────────────────────────────────────────────
function MapListingsDialog({
    subCategory,
    onOpenChange,
    listings,
    subDepartments,
    initialSelected,
    onSave,
}: {
    subCategory: SubCategory | null
    onOpenChange: (open: boolean) => void
    listings: Listing[]
    subDepartments: SubDepartment[]
    initialSelected: Set<string>
    onSave: (subId: string, selected: Set<string>) => void
}) {
    const [selected, setSelected] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (subCategory) setSelected(new Set(initialSelected))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [subCategory?.id])

    const toggle = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }
    const bulkToggle = (ids: string[], select: boolean) => {
        setSelected(prev => {
            const next = new Set(prev)
            ids.forEach(id => { if (select) next.add(id); else next.delete(id) })
            return next
        })
    }

    const handleSave = () => {
        if (subCategory) onSave(subCategory.id, selected)
        onOpenChange(false)
    }

    const options: CheckOption[] = listings.map(l => ({
        id: l.id,
        primary: l.displayNameEn,
        secondary: DEPARTMENT_LABEL[l.department] ?? l.department,
        department: l.department,
        subDepartmentId: l.subDepartmentId,
    }))

    return (
        <Dialog open={subCategory !== null} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-4 overflow-hidden">
                <DialogHeader className="shrink-0">
                    <DialogTitle>Map listings</DialogTitle>
                    <DialogDescription>
                        Toggle which listings appear in{" "}
                        <span className="font-medium text-foreground">{subCategory?.nameEn}</span>.{" "}
                        Filter by department & sub-department, or select all shown. {listings.length} listings available.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 min-h-0 overflow-y-auto pr-1">
                    <SearchableCheckList
                        options={options}
                        selected={selected}
                        onToggle={toggle}
                        onBulkToggle={bulkToggle}
                        subDepartments={subDepartments}
                        placeholder="Search listings by name…"
                        emptyLabel="No listings match."
                    />
                </div>

                <DialogFooter className="shrink-0 border-t pt-3">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save mapping</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
