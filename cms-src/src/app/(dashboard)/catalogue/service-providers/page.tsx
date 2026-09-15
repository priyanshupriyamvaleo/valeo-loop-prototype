"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Building2 } from "lucide-react"
import { ApiService } from "@/services/api"
import { ServiceProvider, InternalCategory } from "@/types"

type ProviderType = ServiceProvider["type"]

const TYPE_META: Record<ProviderType, { label: string; className: string }> = {
    lab: { label: "Lab", className: "bg-sky-100 text-sky-700 border-sky-200" },
    homecare: { label: "Homecare", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    clinic: { label: "Clinic", className: "bg-violet-100 text-violet-700 border-violet-200" },
    pharmacy: { label: "Pharmacy", className: "bg-amber-100 text-amber-700 border-amber-200" },
    logistics: { label: "Logistics", className: "bg-slate-100 text-slate-600 border-slate-200" },
}

const TYPE_FILTERS: ("all" | ProviderType)[] = ["all", "lab", "homecare", "clinic", "pharmacy", "logistics"]

export default function ServiceProvidersPage() {
    const [providers, setProviders] = useState<ServiceProvider[]>([])
    const [categories, setCategories] = useState<InternalCategory[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filterType, setFilterType] = useState<"all" | ProviderType>("all")

    // New-provider dialog state (mock, local only)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [draftName, setDraftName] = useState("")
    const [draftType, setDraftType] = useState<ProviderType>("lab")
    const [draftCategoryId, setDraftCategoryId] = useState("")

    useEffect(() => {
        const loadData = async () => {
            try {
                const [sps, ics] = await Promise.all([
                    ApiService.catalogue.serviceProviders(),
                    ApiService.catalogue.internalCategories(),
                ])
                setProviders(sps)
                setCategories(ics)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const categoryName = (id: string) => categories.find(c => c.id === id)?.nameEn ?? id

    const toggleActive = (id: string) => {
        setProviders(prev => prev.map(p => (p.id === id ? { ...p, isActive: !p.isActive } : p)))
    }

    const addProvider = () => {
        if (!draftName.trim()) return
        const newProvider: ServiceProvider = {
            id: `sp-${Date.now()}`,
            name: draftName.trim(),
            type: draftType,
            internalCategoryId: draftCategoryId || (categories[0]?.id ?? ""),
            isActive: true,
        }
        setProviders(prev => [...prev, newProvider])
        setDraftName("")
        setDraftType("lab")
        setDraftCategoryId("")
        setDialogOpen(false)
    }

    const filtered = providers.filter(p => filterType === "all" || p.type === filterType)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Service Providers</h2>
                    <p className="text-muted-foreground">
                        Who provides / fulfils a listing. Each provider maps to one Internal Category / feature, which selects the provider pool.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Provider
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Service Provider</DialogTitle>
                            <DialogDescription>Register a fulfilment provider. Mock only — not persisted.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="sp-name">Name</Label>
                                <Input id="sp-name" value={draftName} onChange={e => setDraftName(e.target.value)} placeholder="e.g. Abu Dhabi Central Lab" />
                            </div>
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select value={draftType} onValueChange={v => setDraftType(v as ProviderType)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TYPE_FILTERS.filter(t => t !== "all").map(t => (
                                            <SelectItem key={t} value={t}>{TYPE_META[t as ProviderType].label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Internal Category</Label>
                                <Select value={draftCategoryId} onValueChange={setDraftCategoryId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.nameEn}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={addProvider} disabled={!draftName.trim()}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-muted-foreground" /> All Providers
                        </CardTitle>
                        <CardDescription>{filtered.length} of {providers.length} providers</CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {TYPE_FILTERS.map(t => (
                            <Button
                                key={t}
                                variant={filterType === t ? "default" : "outline"}
                                size="sm"
                                className="h-8 text-xs capitalize"
                                onClick={() => setFilterType(t)}
                            >
                                {t === "all" ? "All" : TYPE_META[t as ProviderType].label}
                            </Button>
                        ))}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Internal Category</TableHead>
                                <TableHead>Active</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading providers...</TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No providers match the current filter.</TableCell></TableRow>
                            ) : filtered.map((sp) => {
                                const typeMeta = TYPE_META[sp.type]
                                return (
                                    <TableRow key={sp.id}>
                                        <TableCell className="font-medium">{sp.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={typeMeta.className}>{typeMeta.label}</Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{categoryName(sp.internalCategoryId)}</TableCell>
                                        <TableCell>
                                            <Switch checked={sp.isActive} onCheckedChange={() => toggleActive(sp.id)} aria-label="Toggle active" />
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
