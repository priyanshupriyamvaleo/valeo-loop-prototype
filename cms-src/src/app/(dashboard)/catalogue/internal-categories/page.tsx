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
import { Plus, Tags } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { ApiService } from "@/services/api"
import { InternalCategory, FulfilmentPath } from "@/types"
import { FULFILMENT_PATHS, fulfilmentLabel } from "@/lib/catalogue"

export default function InternalCategoriesPage() {
    const [categories, setCategories] = useState<InternalCategory[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // New-category dialog state (mock, local only)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [draftNameEn, setDraftNameEn] = useState("")
    const [draftNameAr, setDraftNameAr] = useState("")
    const [draftPath, setDraftPath] = useState<FulfilmentPath>(FULFILMENT_PATHS[0].id)

    useEffect(() => {
        const loadData = async () => {
            try {
                const items = await ApiService.catalogue.internalCategories()
                setCategories(items)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const toggleActive = (id: string) => {
        setCategories(prev => prev.map(c => (c.id === id ? { ...c, isActive: c.isActive === false } : c)))
    }

    const addCategory = () => {
        if (!draftNameEn.trim()) return
        const newCategory: InternalCategory = {
            id: `ic-${Date.now()}`,
            nameEn: draftNameEn.trim(),
            nameAr: draftNameAr.trim(),
            fulfilmentPath: draftPath,
            serviceProviderIds: [],
        }
        setCategories(prev => [...prev, newCategory])
        setDraftNameEn("")
        setDraftNameAr("")
        setDraftPath(FULFILMENT_PATHS[0].id)
        setDialogOpen(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Internal Categories</h2>
                    <p className="text-muted-foreground">
                        Attributes &amp; Features (formerly &ldquo;internal category&rdquo;) — describe a listing and pick the service-provider pool.
                    </p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Category
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Internal Category</DialogTitle>
                            <DialogDescription>Define a feature / attribute. Mock only — not persisted.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="ic-name-en">Name (English)</Label>
                                <Input id="ic-name-en" value={draftNameEn} onChange={e => setDraftNameEn(e.target.value)} placeholder="e.g. Fasting Required" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="ic-name-ar">Name (Arabic)</Label>
                                <Input id="ic-name-ar" dir="rtl" value={draftNameAr} onChange={e => setDraftNameAr(e.target.value)} placeholder="الاسم بالعربية" />
                            </div>
                            <div className="space-y-2">
                                <Label>Fulfilment Path</Label>
                                <Select value={draftPath} onValueChange={v => setDraftPath(v as FulfilmentPath)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FULFILMENT_PATHS.map(f => (
                                            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                            <Button onClick={addCategory} disabled={!draftNameEn.trim()}>Create</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Tags className="h-5 w-5 text-muted-foreground" /> Attributes &amp; Features
                        </CardTitle>
                        <CardDescription>{categories.length} internal categories</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead>Name (EN)</TableHead>
                                <TableHead>Name (AR)</TableHead>
                                <TableHead>Fulfilment Path</TableHead>
                                <TableHead className="text-right"># Service Providers</TableHead>
                                <TableHead className="w-20">Active</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Loading categories...</TableCell></TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-12 text-muted-foreground">No internal categories yet.</TableCell></TableRow>
                            ) : categories.map((ic) => (
                                <TableRow key={ic.id}>
                                    <TableCell className="font-medium">{ic.nameEn}</TableCell>
                                    <TableCell dir="rtl" className="text-muted-foreground">{ic.nameAr || "—"}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                                            {fulfilmentLabel(ic.fulfilmentPath)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{ic.serviceProviderIds.length}</TableCell>
                                    <TableCell>
                                        <Switch checked={ic.isActive !== false} onCheckedChange={() => toggleActive(ic.id)} aria-label="Toggle active" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
