"use client"

import { useEffect, useState } from "react"
import { UnsavedChangesGuard, useDirtyTracker } from "@/components/catalogue/UnsavedChangesGuard"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Save, Tag, Megaphone } from "lucide-react"
import { ApiService } from "@/services/api"
import { PromoBanner } from "@/types"

export default function PromoBannerEditorRoute() {
    const params = useParams()
    const id = typeof params.id === "string" ? params.id : ""

    const [banner, setBanner] = useState<PromoBanner | null>(null)

    const dirtyTracker = useDirtyTracker(banner)
    // Baseline for the unsaved-work guard: taken once the record is in state.
    useEffect(() => {
        if (banner && !dirtyTracker.hasSnapshot) dirtyTracker.markClean()
    }, [banner, dirtyTracker])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [savedAt, setSavedAt] = useState<string | null>(null)

    useEffect(() => {
        const load = async () => {
            try {
                setBanner(await ApiService.catalogue.getPromoBanner(id))
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    if (loading) {
        return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading promo banner…</div>
    }

    if (!banner) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
                <p>Promo banner not found.</p>
                <Button variant="outline" asChild><Link href="/catalogue/promo-banners">Back to promo banners</Link></Button>
            </div>
        )
    }

    const update = (patch: Partial<PromoBanner>) => setBanner(b => (b ? { ...b, ...patch } : b))

    const handleSave = async () => {
        setSaving(true)
        try {
            const saved = await ApiService.catalogue.updatePromoBanner(id, {
                name: banner.name,
                titleEn: banner.titleEn,
                titleAr: banner.titleAr,
                subtitleEn: banner.subtitleEn,
                subtitleAr: banner.subtitleAr,
                imageUrl: banner.imageUrl,
                imageAltEn: banner.imageAltEn,
                imageAltAr: banner.imageAltAr,
                couponCode: banner.couponCode,
                discountType: banner.discountType,
                discountValue: banner.discountValue,
                ctaLabelEn: banner.ctaLabelEn,
                ctaLabelAr: banner.ctaLabelAr,
                ctaHref: banner.ctaHref,
                isActive: banner.isActive,
            })
            setBanner(saved)
            dirtyTracker.markCleanAs(saved)
            setSavedAt(new Date().toLocaleTimeString())
        } finally {
            setSaving(false)
        }
    }

    const guardedSave = async (): Promise<boolean> => {
        try { await handleSave(); return true } catch { return false }
    }

    return (
        <div className="flex h-[calc(100vh-80px)] flex-col">
            <UnsavedChangesGuard dirty={dirtyTracker.dirty} onSave={guardedSave} entityLabel="promo banner" />
            {/* Header */}
            <div className="mb-4 flex shrink-0 items-center justify-between gap-4 border-b pb-4">
                <div className="flex min-w-0 items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/catalogue/promo-banners"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <Megaphone className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <h2 className="truncate text-lg font-semibold">{banner.name || "Promo banner"}</h2>
                            <Badge variant="outline" className={banner.isActive ? "border-emerald-200 bg-emerald-100 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-600"}>
                                {banner.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </div>
                        <p className="px-1 text-xs text-muted-foreground">
                            Reusable promotional banner with an attached coupon.
                            {savedAt && <span className="ml-2 text-emerald-600">Saved {savedAt}</span>}
                        </p>
                    </div>
                </div>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save"}
                </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="max-w-3xl space-y-4 pb-10">
                    {/* Identity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Identity</CardTitle>
                            <CardDescription>Internal name and activation.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1.5">
                                <Label>Name</Label>
                                <Input value={banner.name} onChange={e => update({ name: e.target.value })} placeholder="e.g. Ramadan Offer" />
                                <p className="text-[11px] text-muted-foreground">Admin-only label used to pick this banner elsewhere.</p>
                            </div>
                            <div className="flex items-center justify-between rounded-md border px-3 py-2">
                                <div>
                                    <Label className="cursor-pointer">Active</Label>
                                    <p className="text-xs text-muted-foreground">Only active banners are selectable on listings &amp; categories.</p>
                                </div>
                                <Switch checked={banner.isActive} onCheckedChange={v => update({ isActive: v })} />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Content */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Content</CardTitle>
                            <CardDescription>Bilingual title &amp; subtitle shown on the banner.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label>Title (EN)</Label><Input value={banner.titleEn} onChange={e => update({ titleEn: e.target.value })} placeholder="Ramadan Health Offer" /></div>
                                <div className="space-y-1.5"><Label>Title (AR)</Label><Input dir="rtl" className="text-right" value={banner.titleAr ?? ""} onChange={e => update({ titleAr: e.target.value })} placeholder="عرض رمضان الصحي" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label>Subtitle (EN)</Label><Textarea rows={2} value={banner.subtitleEn ?? ""} onChange={e => update({ subtitleEn: e.target.value })} placeholder="Save 20% on your wellness journey." /></div>
                                <div className="space-y-1.5"><Label>Subtitle (AR)</Label><Textarea dir="rtl" className="text-right" rows={2} value={banner.subtitleAr ?? ""} onChange={e => update({ subtitleAr: e.target.value })} placeholder="وفر 20% في رحلتك الصحية." /></div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Coupon */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Tag className="h-4 w-4" /> Coupon</CardTitle>
                            <CardDescription>The coupon code and discount attached to this banner.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Coupon Code</Label>
                                    <Input className="font-mono" value={banner.couponCode ?? ""} onChange={e => update({ couponCode: e.target.value })} placeholder="RAMADAN20" />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Discount Type</Label>
                                    <Select
                                        value={banner.discountType ?? "none"}
                                        onValueChange={v => update({ discountType: v === "none" ? undefined : v as "percentage" | "fixed" })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed">Fixed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Discount Value</Label>
                                    <Input
                                        type="number"
                                        value={banner.discountValue ?? ""}
                                        onChange={e => update({ discountValue: e.target.value ? Number(e.target.value) : undefined })}
                                        placeholder={banner.discountType === "fixed" ? "e.g. 50" : "e.g. 20"}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* CTA */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Call to Action</CardTitle>
                            <CardDescription>Bilingual button label and destination.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label>CTA Label (EN)</Label><Input value={banner.ctaLabelEn ?? ""} onChange={e => update({ ctaLabelEn: e.target.value })} placeholder="Shop the offer" /></div>
                                <div className="space-y-1.5"><Label>CTA Label (AR)</Label><Input dir="rtl" className="text-right" value={banner.ctaLabelAr ?? ""} onChange={e => update({ ctaLabelAr: e.target.value })} placeholder="تسوق العرض" /></div>
                            </div>
                            <div className="space-y-1.5">
                                <Label>CTA Link</Label>
                                <Input className="font-mono text-sm" value={banner.ctaHref ?? ""} onChange={e => update({ ctaHref: e.target.value })} placeholder="/catalogue" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

