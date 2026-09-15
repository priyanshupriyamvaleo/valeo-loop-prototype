"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Plus, Megaphone, Pencil, Tag } from "lucide-react"
import { ApiService } from "@/services/api"
import { OnboardingBanner } from "@/components/catalogue/OnboardingGuide"
import { PromoBanner } from "@/types"

function discountLabel(b: PromoBanner): string {
    if (!b.discountType || b.discountValue == null) return "—"
    return b.discountType === "percentage" ? `${b.discountValue}%` : `AED ${b.discountValue}`
}

export default function PromoBannersLibraryPage() {
    const router = useRouter()
    const [banners, setBanners] = useState<PromoBanner[]>([])
    const [loading, setLoading] = useState(true)
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                setBanners(await ApiService.catalogue.promoBanners())
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const createNew = async () => {
        setCreating(true)
        try {
            const created = await ApiService.catalogue.createPromoBanner({ name: "Untitled promo banner" })
            router.push(`/catalogue/promo-banners/${created.id}`)
        } catch {
            setCreating(false)
        }
    }

    const toggleActive = async (id: string, isActive: boolean) => {
        // Optimistic local update, then persist.
        setBanners(prev => prev.map(b => (b.id === id ? { ...b, isActive } : b)))
        await ApiService.catalogue.updatePromoBanner(id, { isActive })
    }

    return (
        <div className="space-y-4">
            <OnboardingBanner guide="promo" />
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Promo Banners</h2>
                    <p className="text-muted-foreground">
                        Reusable promotional banners with an attached coupon — select them on listings, categories &amp; sub-categories.
                    </p>
                </div>
                <Button onClick={createNew} disabled={creating}>
                    <Plus className="mr-2 h-4 w-4" /> {creating ? "Creating…" : "New promo banner"}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Megaphone className="h-5 w-5 text-muted-foreground" /> Promo banners
                    </CardTitle>
                    <CardDescription>{banners.length} banner{banners.length === 1 ? "" : "s"}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30">
                                <TableHead>Name</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Coupon</TableHead>
                                <TableHead className="text-right">Discount</TableHead>
                                <TableHead className="text-right">Active</TableHead>
                                <TableHead className="text-right pr-4">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">Loading promo banners…</TableCell></TableRow>
                            ) : banners.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="py-12 text-center text-muted-foreground">No promo banners yet.</TableCell></TableRow>
                            ) : banners.map(b => (
                                <TableRow key={b.id}>
                                    <TableCell className="font-medium">{b.name}</TableCell>
                                    <TableCell className="max-w-xs truncate text-muted-foreground">{b.titleEn || "—"}</TableCell>
                                    <TableCell>
                                        {b.couponCode ? (
                                            <Badge variant="secondary" className="gap-1 font-mono text-xs">
                                                <Tag className="h-3 w-3" /> {b.couponCode}
                                            </Badge>
                                        ) : <span className="text-muted-foreground">—</span>}
                                    </TableCell>
                                    <TableCell className="text-right tabular-nums">{discountLabel(b)}</TableCell>
                                    <TableCell className="text-right">
                                        <Switch checked={b.isActive} onCheckedChange={v => toggleActive(b.id, v)} />
                                    </TableCell>
                                    <TableCell className="text-right pr-4">
                                        <Button variant="outline" size="sm" className="h-8 text-xs" asChild>
                                            <Link href={`/catalogue/promo-banners/${b.id}`}>
                                                <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                                            </Link>
                                        </Button>
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
