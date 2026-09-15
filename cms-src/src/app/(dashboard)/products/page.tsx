"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Plus, MoreHorizontal, FlaskConical, Dna, Utensils,
    Search, ExternalLink, Copy, Archive, Download, CheckSquare,
    Filter
} from "lucide-react"
import { ApiService } from "@/services/api"
import { Product, ProductStatus, ProductType } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const STATUS_BADGE: Record<ProductStatus, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    draft: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
    inactive: { label: "Inactive", className: "bg-amber-100 text-amber-700 border-amber-200" },
    archived: { label: "Archived", className: "bg-rose-100 text-rose-700 border-rose-200" },
}

const TYPE_LABEL: Record<string, string> = {
    package: "Package",
    supplement: "Supplement",
    medicine: "Medicine",
    wearable: "Wearable",
    gift_card: "Gift Card",
}

function formatDate(iso?: string) {
    if (!iso) return "—"
    return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
}

export default function ProductsPage() {
    const [data, setData] = useState<Product[]>([])
    const [labTests, setLabTests] = useState<any[]>([])
    const [biomarkers, setBiomarkers] = useState<any[]>([])
    const [foodIntolerances, setFoodIntolerances] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterType, setFilterType] = useState<string>("all")
    const [filterStatus, setFilterStatus] = useState<string>("all")
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        const loadData = async () => {
            try {
                const [items, tests, bio, food] = await Promise.all([
                    ApiService.products.list(),
                    ApiService.products.tests(),
                    ApiService.products.biomarkers(),
                    ApiService.products.foodIntolerance()
                ])
                setData(items)
                setLabTests(tests)
                setBiomarkers(bio)
                setFoodIntolerances(food)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const packagesData = data.filter(item => item.type === "package")
    const productsData = data.filter(item => ["supplement", "medicine", "wearable", "gift_card"].includes(item.type))

    const applyFilters = (items: Product[]) => {
        return items.filter(item => {
            const matchesSearch = !searchQuery || item.displayNameEn.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesType = filterType === "all" || item.type === filterType
            const matchesStatus = filterStatus === "all" || item.status === filterStatus
            return matchesSearch && matchesType && matchesStatus
        })
    }

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedIds(next)
    }

    const toggleSelectAll = (items: Product[]) => {
        if (items.every(i => selectedIds.has(i.id))) {
            const next = new Set(selectedIds)
            items.forEach(i => next.delete(i.id))
            setSelectedIds(next)
        } else {
            const next = new Set(selectedIds)
            items.forEach(i => next.add(i.id))
            setSelectedIds(next)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Product Catalogue</h2>
                    <p className="text-muted-foreground">Manage packages, products, lab tests, biomarkers, and food intolerances.</p>
                </div>
                <Button asChild>
                    <Link href="/products/new">
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Link>
                </Button>
            </div>

            <Tabs defaultValue="products" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="packages">Packages</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="tests">Lab Tests</TabsTrigger>
                    <TabsTrigger value="biomarkers">Biomarkers</TabsTrigger>
                    <TabsTrigger value="food">Food Intolerance</TabsTrigger>
                </TabsList>

                {/* Packages Tab */}
                <TabsContent value="packages" className="space-y-4">
                    <ProductTable
                        data={applyFilters(packagesData)}
                        isLoading={isLoading}
                        showTypeColumn={false}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onToggleSelectAll={() => toggleSelectAll(applyFilters(packagesData))}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        filterStatus={filterStatus}
                        onFilterStatusChange={setFilterStatus}
                    />
                </TabsContent>

                {/* Products Tab */}
                <TabsContent value="products" className="space-y-4">
                    <ProductTable
                        data={applyFilters(productsData)}
                        isLoading={isLoading}
                        showTypeColumn={true}
                        selectedIds={selectedIds}
                        onToggleSelect={toggleSelect}
                        onToggleSelectAll={() => toggleSelectAll(applyFilters(productsData))}
                        searchQuery={searchQuery}
                        onSearchChange={setSearchQuery}
                        filterType={filterType}
                        onFilterTypeChange={setFilterType}
                        filterStatus={filterStatus}
                        onFilterStatusChange={setFilterStatus}
                    />
                </TabsContent>

                {/* Lab Tests Tab */}
                <TabsContent value="tests" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Clinical Lab Tests</CardTitle>
                                <CardDescription>Read-only. Sourced from the lab test service.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                                <FlaskConical className="mr-2 h-4 w-4" /> Sync Lab Catalog
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Test Name</TableHead>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
                                    ) : labTests.map((test) => (
                                        <TableRow key={test.id}>
                                            <TableCell className="font-medium">{test.name}</TableCell>
                                            <TableCell className="font-mono text-xs">{test.code}</TableCell>
                                            <TableCell className="capitalize">{test.category}</TableCell>
                                            <TableCell><Badge variant="outline">{test.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Biomarkers Tab */}
                <TabsContent value="biomarkers" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Biomarker Registry</CardTitle>
                                <CardDescription>Read-only. Reference ranges and unit mappings.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm">
                                <Dna className="mr-2 h-4 w-4" /> Add Biomarker
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Biomarker</TableHead>
                                        <TableHead>Default Unit</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
                                    ) : biomarkers.map((bio) => (
                                        <TableRow key={bio.id}>
                                            <TableCell className="font-medium">{bio.name}</TableCell>
                                            <TableCell>{bio.unit}</TableCell>
                                            <TableCell>{bio.category}</TableCell>
                                            <TableCell><Badge variant="outline">{bio.status}</Badge></TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Food Intolerance Tab */}
                <TabsContent value="food" className="space-y-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Food Intolerance Library</CardTitle>
                                <CardDescription>Read-only. Reactions and dietary recommendations.</CardDescription>
                            </div>
                            <Button size="sm">
                                <Utensils className="mr-2 h-4 w-4" /> Add Food Item
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Food Item</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>Clinical Recommendation</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading library...</TableCell></TableRow>
                                    ) : foodIntolerances.map((fi: any) => (
                                        <TableRow key={fi.id}>
                                            <TableCell className="font-semibold">{fi.name}</TableCell>
                                            <TableCell>{fi.category}</TableCell>
                                            <TableCell>
                                                <Badge className={
                                                    fi.severity === "high" ? "bg-rose-100 text-rose-700 border-rose-200" :
                                                        fi.severity === "medium" ? "bg-amber-100 text-amber-700 border-amber-200" :
                                                            "bg-slate-100 text-slate-600 border-slate-200"
                                                }>
                                                    {fi.severity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{fi.recommendation}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

interface ProductTableProps {
    data: Product[]
    isLoading: boolean
    showTypeColumn: boolean
    selectedIds: Set<string>
    onToggleSelect: (id: string) => void
    onToggleSelectAll: () => void
    searchQuery: string
    onSearchChange: (v: string) => void
    filterType?: string
    onFilterTypeChange?: (v: string) => void
    filterStatus: string
    onFilterStatusChange: (v: string) => void
}

function ProductTable({
    data, isLoading, showTypeColumn, selectedIds, onToggleSelect, onToggleSelectAll,
    searchQuery, onSearchChange, filterType, onFilterTypeChange, filterStatus, onFilterStatusChange
}: ProductTableProps) {
    const allSelected = data.length > 0 && data.every(d => selectedIds.has(d.id))
    const someSelected = data.some(d => selectedIds.has(d.id))
    const selectedCount = data.filter(d => selectedIds.has(d.id)).length

    return (
        <Card>
            <CardHeader className="pb-3">
                {/* Search & Filter Bar */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name..."
                            value={searchQuery}
                            onChange={e => onSearchChange(e.target.value)}
                            className="pl-9 h-9"
                        />
                    </div>
                    {showTypeColumn && onFilterTypeChange && (
                        <Select value={filterType ?? "all"} onValueChange={onFilterTypeChange}>
                            <SelectTrigger className="w-[150px] h-9">
                                <Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                <SelectValue placeholder="All Types" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="supplement">Supplement</SelectItem>
                                <SelectItem value="medicine">Medicine</SelectItem>
                                <SelectItem value="wearable">Wearable</SelectItem>
                                <SelectItem value="gift_card">Gift Card</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                    <Select value={filterStatus} onValueChange={onFilterStatusChange}>
                        <SelectTrigger className="w-[150px] h-9">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Bulk Actions Bar */}
                {someSelected && (
                    <div className="flex items-center gap-3 pt-2 mt-2 border-t">
                        <span className="text-sm text-muted-foreground font-medium">{selectedCount} selected</span>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                            <CheckSquare className="mr-1.5 h-3.5 w-3.5" /> Bulk Activate
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                            <Archive className="mr-1.5 h-3.5 w-3.5" /> Bulk Archive
                        </Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">
                            <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
                        </Button>
                    </div>
                )}
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/30">
                            <TableHead className="w-10 pl-4">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={onToggleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>Name</TableHead>
                            {showTypeColumn && <TableHead>Type</TableHead>}
                            <TableHead>Category</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Variants</TableHead>
                            <TableHead>Updated</TableHead>
                            <TableHead className="text-right pr-4">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Loading catalogue...</TableCell></TableRow>
                        ) : data.length === 0 ? (
                            <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No products match the current filters.</TableCell></TableRow>
                        ) : data.map((item) => {
                            const statusMeta = STATUS_BADGE[item.status]
                            const activeVariants = item.variants.filter(v => v.status === "active").length
                            return (
                                <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-muted/20" : ""}>
                                    <TableCell className="pl-4">
                                        <Checkbox
                                            checked={selectedIds.has(item.id)}
                                            onCheckedChange={() => onToggleSelect(item.id)}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <Link href={`/products/${item.id}`} className="font-medium hover:underline">
                                                {item.displayNameEn}
                                            </Link>
                                            <p className="text-xs text-muted-foreground mt-0.5">{item.internalName}</p>
                                        </div>
                                    </TableCell>
                                    {showTypeColumn && (
                                        <TableCell>
                                            <span className="text-sm">{TYPE_LABEL[item.type] ?? item.type}</span>
                                        </TableCell>
                                    )}
                                    <TableCell className="text-sm">{item.category}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={statusMeta.className}>
                                            {statusMeta.label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm font-medium">{item.variants.length}</span>
                                        <span className="text-xs text-muted-foreground ml-1">({activeVariants} active)</span>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {formatDate(item.updatedAt)}
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/products/${item.id}`}>Edit</Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Copy className="mr-2 h-4 w-4" /> Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <ExternalLink className="mr-2 h-4 w-4" /> View on Storefront
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive">
                                                    <Archive className="mr-2 h-4 w-4" /> Archive
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
