"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft, Save, Plus, Trash, Truck, MapPin, ExternalLink,
    GripVertical, Copy, ImagePlus, AlertCircle, Star, Pill,
    Package, Gift, Cpu, Leaf, Video, MessageSquare, Users, Trophy,
    CheckCircle, Play
} from "lucide-react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ApiService } from "@/services/api"
import {
    Product, ProductVariant, DeliveryConfig, ProductStatus,
    ProductType, FAQItem, SubscriptionFrequency, VariantType,
    VariantStatus, Country, Benefit, Ingredient, MediaAsset,
    CustomerReview, InfluencerVideo, SuperiorityBlock, SuperiorityPoint
} from "@/types"

const SIDEBAR_SECTIONS = [
    { id: "identity", label: "Identity & Type" },
    { id: "content", label: "Master Content" },
    { id: "media", label: "Media Gallery" },
    { id: "variants", label: "Variants Flow" },
    { id: "subscription", label: "Subscription & Pricing" },
    { id: "addons", label: "Add-ons & Recommendations" },
    { id: "reviews", label: "Customer Reviews" },
    { id: "influencers", label: "Influencer Videos" },
    { id: "superiority", label: "Why [Product] is Superior" },
    { id: "seo", label: "SEO & Metadata" },
    { id: "flags", label: "Feature Flags" },
    { id: "faq", label: "Master FAQ" },
]

const COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT", "OTHERS"]

const VARIANT_TYPES: VariantType[] = ["size", "flavour", "quantity", "dosage", "denomination", "colour"]

const SUBSCRIPTION_FREQUENCIES: SubscriptionFrequency[] = ["weekly", "monthly", "quarterly", "bi_annual"]

const STATUS_BADGE: Record<ProductStatus, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    draft: { label: "Draft", className: "bg-slate-100 text-slate-600 border-slate-200" },
    inactive: { label: "Inactive", className: "bg-amber-100 text-amber-700 border-amber-200" },
    archived: { label: "Archived", className: "bg-rose-100 text-rose-700 border-rose-200" },
}

const TYPE_ICONS: Record<ProductType, React.ReactNode> = {
    package: <Package className="h-3.5 w-3.5" />,
    supplement: <Leaf className="h-3.5 w-3.5" />,
    medicine: <Pill className="h-3.5 w-3.5" />,
    wearable: <Cpu className="h-3.5 w-3.5" />,
    gift_card: <Gift className="h-3.5 w-3.5" />,
}

function emptyProduct(): Product {
    return {
        id: "", internalName: "", displayNameEn: "", displayNameAr: "",
        type: "supplement", subCategory: "", category: "", brand: "",
        status: "draft", visibility: "public",
        isPrescriptionRequired: false, isOtc: false, requiresConsultation: false,
        isControlledSubstance: false, regulatoryBadges: [],
        descriptionEn: "", descriptionAr: "", shortDescriptionEn: "", shortDescriptionAr: "",
        benefits: [], ingredients: [], trustBadges: [],
        mediaGallery: [], deliveryConfig: [],
        subscriptionEnabled: false, subscriptionAutoSelected: true, subscriptionFrequencies: [],
        subscriptionDiscountPct: {}, subscriptionMinCycles: 1,
        multiBuyTiers: [], bundles: [],
        enhancements: [], frequentlyBoughtTogether: [], biomarkerPackages: [],
        consultationAddonEnabled: false, consultationAddonPrice: 0,
        giftWrappingEnabled: false, giftWrappingPrice: 0, extendedDeliveryEnabled: false,
        seoTitleEn: "", seoTitleAr: "", seoDescriptionEn: "", seoDescriptionAr: "",
        slugEn: "", slugAr: "",
        hideVariantsOnConsultationLink: false, forceVariantDisplay: false,
        variantVisibilityUrlOverrideEnabled: true, subscriptionAutoSelectOverride: null,
        showCompareAtPrice: true, showStockIndicator: true, showDeliveryEstimate: true,
        consultationLinkSuppressesAddons: true,
        faq: [],
        reviews: [],
        influencerVideos: [],
        superiorityBlock: { headlineEn: "", headlineAr: "", mediaType: null, mediaUrl: "", thumbnailUrl: "", points: [] },
        variants: []
    }
}

function emptyVariant(sortOrder: number): ProductVariant {
    return {
        id: Math.random().toString(36).substr(2, 9),
        slugEn: "", slugAr: "", nameEn: "", nameAr: "",
        shortDescriptionEn: "", shortDescriptionAr: "",
        variantType: "size", variantLabelEn: "", variantLabelAr: "",
        imageUrl: "", vat: 5, isDefault: false, sortOrder,
        status: "inactive", stockQuantity: 0, lowStockThreshold: 10,
        customFields: {}, regionalData: []
    }
}

export default function ProductEditorPage() {
    const params = useParams()
    const isNew = params.id === "new"
    const [product, setProduct] = useState<Product>(emptyProduct())
    const [activeTab, setActiveTab] = useState("identity")
    const [isLoading, setIsLoading] = useState(!isNew)

    useEffect(() => {
        if (!isNew && typeof params.id === "string") {
            ApiService.products.get(params.id).then(item => {
                if (item) setProduct(item)
                setIsLoading(false)
            })
        }
    }, [isNew, params.id])

    const update = (patch: Partial<Product>) => setProduct(prev => ({ ...prev, ...patch }))

    // Delivery config helpers
    const addDelivery = () => update({ deliveryConfig: [...product.deliveryConfig, { city: "", deliveryTime: "", isAvailable: true }] })
    const updateDelivery = (i: number, patch: Partial<DeliveryConfig>) =>
        update({ deliveryConfig: product.deliveryConfig.map((d, idx) => idx === i ? { ...d, ...patch } : d) })
    const removeDelivery = (i: number) => update({ deliveryConfig: product.deliveryConfig.filter((_, idx) => idx !== i) })

    // Variant helpers
    const addVariant = () => update({ variants: [...product.variants, emptyVariant(product.variants.length)] })
    const updateVariant = (id: string, patch: Partial<ProductVariant>) =>
        update({ variants: product.variants.map(v => v.id === id ? { ...v, ...patch } : v) })
    const removeVariant = (id: string) => update({ variants: product.variants.filter(v => v.id !== id) })
    const setDefaultVariant = (id: string) =>
        update({ variants: product.variants.map(v => ({ ...v, isDefault: v.id === id })) })
    const duplicateVariant = (id: string) => {
        const src = product.variants.find(v => v.id === id)
        if (!src) return
        const copy: ProductVariant = {
            ...src,
            id: Math.random().toString(36).substr(2, 9),
            slugEn: src.slugEn + "-copy",
            slugAr: src.slugAr + "-copy",
            isDefault: false,
            sortOrder: product.variants.length,
            regionalData: src.regionalData.map(r => ({ ...r, sku: "" }))
        }
        update({ variants: [...product.variants, copy] })
    }

    const toggleCountry = (variantId: string, country: Country) => {
        const v = product.variants.find(x => x.id === variantId)
        if (!v) return
        const exists = v.regionalData.find(r => r.country === country)
        const newRegional = exists
            ? v.regionalData.filter(r => r.country !== country)
            : [...v.regionalData, { country, sku: "", zohoId: "", price: 0, isAvailable: true }]
        updateVariant(variantId, { regionalData: newRegional })
    }

    const updateRegional = (variantId: string, country: Country, patch: Record<string, any>) => {
        const v = product.variants.find(x => x.id === variantId)
        if (!v) return
        updateVariant(variantId, { regionalData: v.regionalData.map(r => r.country === country ? { ...r, ...patch } : r) })
    }

    // FAQ helpers
    const addFaq = () => update({ faq: [...product.faq, { questionEn: "", questionAr: "", answerEn: "", answerAr: "", sortOrder: product.faq.length }] })
    const updateFaq = (i: number, patch: Partial<FAQItem>) =>
        update({ faq: product.faq.map((f, idx) => idx === i ? { ...f, ...patch } : f) })
    const removeFaq = (i: number) => update({ faq: product.faq.filter((_, idx) => idx !== i) })

    // Multi-buy helpers
    const addMultiBuyTier = () =>
        update({ multiBuyTiers: [...product.multiBuyTiers, { minQuantity: 2, discountPct: 0 }] })
    const removeMultiBuyTier = (i: number) =>
        update({ multiBuyTiers: product.multiBuyTiers.filter((_, idx) => idx !== i) })

    // Review helpers
    const addReview = () => update({
        reviews: [...product.reviews, {
            id: Math.random().toString(36).substr(2, 9),
            reviewerName: "", rating: 5, reviewTextEn: "",
            isVerified: true, sortOrder: product.reviews.length
        }]
    })
    const updateReview = (id: string, patch: Partial<CustomerReview>) =>
        update({ reviews: product.reviews.map(r => r.id === id ? { ...r, ...patch } : r) })
    const removeReview = (id: string) =>
        update({ reviews: product.reviews.filter(r => r.id !== id) })

    // Influencer video helpers
    const addInfluencerVideo = () => update({
        influencerVideos: [...product.influencerVideos, {
            id: Math.random().toString(36).substr(2, 9),
            handle: "", platform: "instagram" as const,
            videoUrl: "", thumbnailUrl: "", sortOrder: product.influencerVideos.length
        }]
    })
    const updateInfluencerVideo = (id: string, patch: Partial<InfluencerVideo>) =>
        update({ influencerVideos: product.influencerVideos.map(v => v.id === id ? { ...v, ...patch } : v) })
    const removeInfluencerVideo = (id: string) =>
        update({ influencerVideos: product.influencerVideos.filter(v => v.id !== id) })

    // Superiority block helpers
    const updateSuperiority = (patch: Partial<SuperiorityBlock>) =>
        update({ superiorityBlock: { ...product.superiorityBlock, ...patch } })
    const addSuperiorityPoint = () => updateSuperiority({
        points: [...product.superiorityBlock.points, { titleEn: "", titleAr: "", descriptionEn: "", descriptionAr: "" }]
    })
    const updateSuperiorityPoint = (i: number, patch: Partial<SuperiorityPoint>) =>
        updateSuperiority({ points: product.superiorityBlock.points.map((p, idx) => idx === i ? { ...p, ...patch } : p) })
    const removeSuperiorityPoint = (i: number) =>
        updateSuperiority({ points: product.superiorityBlock.points.filter((_, idx) => idx !== i) })

    // Benefit & Ingredient helpers
    const addBenefit = () =>
        update({ benefits: [...product.benefits, { iconKey: "", labelEn: "", labelAr: "", descriptionEn: "", descriptionAr: "" }] })
    const removeBenefit = (i: number) =>
        update({ benefits: product.benefits.filter((_, idx) => idx !== i) })

    const addIngredient = () =>
        update({ ingredients: [...product.ingredients, { nameEn: "", nameAr: "", amount: 0, unit: "", dailyValuePct: null }] })
    const removeIngredient = (i: number) =>
        update({ ingredients: product.ingredients.filter((_, idx) => idx !== i) })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
                Loading product...
            </div>
        )
    }

    const statusMeta = STATUS_BADGE[product.status]

    return (
        <div className="flex flex-col h-[calc(100vh-80px)]">
            {/* Page Header */}
            <div className="flex items-center justify-between border-b pb-4 mb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/products"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold">
                                {isNew ? "New Product Master" : product.displayNameEn || "Edit Product Master"}
                            </h2>
                            <Badge variant="outline" className={statusMeta.className}>
                                {statusMeta.label}
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {isNew ? "Create a new master product record" : `ID: ${params.id} · Last updated ${product.updatedAt ? new Date(product.updatedAt).toLocaleDateString("en-GB") : "—"}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isNew && (
                        <Button variant="outline" size="sm">
                            <ExternalLink className="mr-2 h-4 w-4" /> Preview PDP
                        </Button>
                    )}
                    <Select value={product.status} onValueChange={(v: any) => update({ status: v })}>
                        <SelectTrigger className="w-[130px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm">
                        <Save className="mr-2 h-4 w-4" /> Save Master & Variants
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Sidebar */}
                <div className="w-56 shrink-0 space-y-0.5 overflow-y-auto">
                    {SIDEBAR_SECTIONS.map(section => (
                        <Button
                            key={section.id}
                            variant={activeTab === section.id ? "secondary" : "ghost"}
                            className="w-full justify-start text-sm"
                            onClick={() => setActiveTab(section.id)}
                        >
                            {section.label}
                            {section.id === "variants" && (
                                <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1">
                                    {product.variants.length}
                                </Badge>
                            )}
                        </Button>
                    ))}
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-6 pb-12">

                        {/* ── 1. IDENTITY & TYPE ── */}
                        {activeTab === "identity" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Identity & Classification</CardTitle>
                                        <CardDescription>Core identification and categorisation of the master product.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Internal Name <span className="text-destructive">*</span></Label>
                                                <Input value={product.internalName} onChange={e => update({ internalName: e.target.value })} placeholder="e.g. vitamin-d3-boost (admin only)" />
                                                <p className="text-xs text-muted-foreground">Not displayed on the storefront.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Product Group Type <span className="text-destructive">*</span></Label>
                                                <Select value={product.type} onValueChange={(v: any) => update({ type: v })}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="supplement">Supplement</SelectItem>
                                                        <SelectItem value="medicine">Medicine</SelectItem>
                                                        <SelectItem value="wearable">Wearable</SelectItem>
                                                        <SelectItem value="gift_card">Gift Card</SelectItem>
                                                        <SelectItem value="package">Package</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Display Name (EN) <span className="text-destructive">*</span></Label>
                                                <Input value={product.displayNameEn} onChange={e => update({ displayNameEn: e.target.value })} placeholder="English product name" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Display Name (AR) <span className="text-destructive">*</span></Label>
                                                <Input dir="rtl" value={product.displayNameAr} onChange={e => update({ displayNameAr: e.target.value })} placeholder="اسم المنتج بالعربية" className="text-right" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label>Category <span className="text-destructive">*</span></Label>
                                                <Input value={product.category} onChange={e => update({ category: e.target.value })} placeholder="e.g. Energy, Hormones" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Sub-Category</Label>
                                                <Input value={product.subCategory ?? ""} onChange={e => update({ subCategory: e.target.value })} placeholder="e.g. vitamin, GLP-1 agonist" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Brand</Label>
                                                <Input value={product.brand ?? ""} onChange={e => update({ brand: e.target.value })} placeholder="e.g. Valeo Nutrition" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Visibility</Label>
                                                <Select value={product.visibility} onValueChange={(v: any) => update({ visibility: v })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="public">Public</SelectItem>
                                                        <SelectItem value="unlisted">Unlisted (direct URL only)</SelectItem>
                                                        <SelectItem value="hidden">Hidden</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Regulatory & Clinical Flags</CardTitle>
                                        <CardDescription>Controls prescription gating, badges, and consultation behaviour.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {product.isPrescriptionRequired && product.isOtc && (
                                            <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <span>Prescription Required and OTC cannot both be enabled simultaneously.</span>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex items-center justify-between p-3 border rounded-md">
                                                <div>
                                                    <Label className="text-sm font-medium">Prescription Required</Label>
                                                    <p className="text-xs text-muted-foreground">Triggers prescription gate on PDP</p>
                                                </div>
                                                <Switch
                                                    checked={product.isPrescriptionRequired}
                                                    onCheckedChange={v => update({ isPrescriptionRequired: v })}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 border rounded-md">
                                                <div>
                                                    <Label className="text-sm font-medium">Over-The-Counter (OTC)</Label>
                                                    <p className="text-xs text-muted-foreground">Affects badge display on PDP</p>
                                                </div>
                                                <Switch
                                                    checked={product.isOtc}
                                                    onCheckedChange={v => update({ isOtc: v })}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 border rounded-md">
                                                <div>
                                                    <Label className="text-sm font-medium">Requires Consultation</Label>
                                                    <p className="text-xs text-muted-foreground">Triggers consultation add-on</p>
                                                </div>
                                                <Switch
                                                    checked={product.requiresConsultation}
                                                    onCheckedChange={v => update({ requiresConsultation: v })}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between p-3 border rounded-md">
                                                <div>
                                                    <Label className="text-sm font-medium">Controlled Substance</Label>
                                                    <p className="text-xs text-muted-foreground">Renders regulatory notice on PDP</p>
                                                </div>
                                                <Switch
                                                    checked={product.isControlledSubstance}
                                                    onCheckedChange={v => update({ isControlledSubstance: v })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Regulatory Badges</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {["fda_approved", "moh_approved", "clinically_tested", "authentic", "secure_payment"].map(badge => {
                                                    const active = product.regulatoryBadges.includes(badge)
                                                    return (
                                                        <Button
                                                            key={badge}
                                                            size="sm"
                                                            variant={active ? "default" : "outline"}
                                                            className="h-7 text-xs"
                                                            onClick={() => update({
                                                                regulatoryBadges: active
                                                                    ? product.regulatoryBadges.filter(b => b !== badge)
                                                                    : [...product.regulatoryBadges, badge]
                                                            })}
                                                        >
                                                            {badge.replace(/_/g, " ")}
                                                        </Button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Type-conditional fields */}
                                {product.type === "medicine" && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Pill className="h-4 w-4" /> Medicine-Specific Fields
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Generic / Active Ingredient Name</Label>
                                                <Input value={product.medicineGenericName ?? ""} onChange={e => update({ medicineGenericName: e.target.value })} placeholder="e.g. Semaglutide" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Disclaimer (EN) <span className="text-destructive">*</span></Label>
                                                    <textarea className="w-full h-24 p-3 border rounded-md text-sm" value={product.medicineDisclaimerEn ?? ""} onChange={e => update({ medicineDisclaimerEn: e.target.value })} placeholder="Mandatory regulatory disclaimer (EN)" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Disclaimer (AR) <span className="text-destructive">*</span></Label>
                                                    <textarea dir="rtl" className="w-full h-24 p-3 border rounded-md text-sm text-right" value={product.medicineDisclaimerAr ?? ""} onChange={e => update({ medicineDisclaimerAr: e.target.value })} placeholder="إخلاء المسؤولية التنظيمية الإلزامية" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Mechanism of Action (EN)</Label>
                                                    <textarea className="w-full h-20 p-3 border rounded-md text-sm" value={product.medicineMechanismEn ?? ""} onChange={e => update({ medicineMechanismEn: e.target.value })} placeholder="How it works (EN)" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Mechanism of Action (AR)</Label>
                                                    <textarea dir="rtl" className="w-full h-20 p-3 border rounded-md text-sm text-right" value={product.medicineMechanismAr ?? ""} onChange={e => update({ medicineMechanismAr: e.target.value })} placeholder="آلية العمل (AR)" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Contraindications</Label>
                                                <textarea className="w-full h-20 p-3 border rounded-md text-sm" value={product.medicineContraindications ?? ""} onChange={e => update({ medicineContraindications: e.target.value })} placeholder="Contraindications and warnings" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {product.type === "wearable" && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Cpu className="h-4 w-4" /> Wearable Specifications
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Manufacturer / Brand <span className="text-destructive">*</span></Label>
                                                    <Input value={product.wearableManufacturer ?? ""} onChange={e => update({ wearableManufacturer: e.target.value })} placeholder="e.g. Oura, Apple, Garmin" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Connectivity</Label>
                                                    <Input value={product.wearableConnectivity ?? ""} onChange={e => update({ wearableConnectivity: e.target.value })} placeholder="e.g. Bluetooth 5.3, WiFi, NFC" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Compatibility</Label>
                                                    <Input value={product.wearableCompatibility ?? ""} onChange={e => update({ wearableCompatibility: e.target.value })} placeholder="e.g. iOS 16+, Android 11+" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Warranty (months)</Label>
                                                    <Input type="number" value={product.wearableWarrantyMonths ?? ""} onChange={e => update({ wearableWarrantyMonths: Number(e.target.value) })} placeholder="e.g. 24" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {product.type === "gift_card" && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Gift className="h-4 w-4" /> Gift Card Settings
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Validity Period <span className="text-destructive">*</span></Label>
                                                    <Input value={product.giftCardValidity ?? ""} onChange={e => update({ giftCardValidity: e.target.value })} placeholder="e.g. 12 Months, No Expiry" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Redemption Type <span className="text-destructive">*</span></Label>
                                                    <Select value={product.giftCardRedemptionType ?? "digital"} onValueChange={(v: any) => update({ giftCardRedemptionType: v })}>
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="digital">Digital Code</SelectItem>
                                                            <SelectItem value="physical">Physical Card</SelectItem>
                                                            <SelectItem value="both">Both</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Terms & Conditions (EN)</Label>
                                                    <textarea className="w-full h-20 p-3 border rounded-md text-sm" value={product.giftCardTermsEn ?? ""} onChange={e => update({ giftCardTermsEn: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Terms & Conditions (AR)</Label>
                                                    <textarea dir="rtl" className="w-full h-20 p-3 border rounded-md text-sm text-right" value={product.giftCardTermsAr ?? ""} onChange={e => update({ giftCardTermsAr: e.target.value })} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* ── 2. MASTER CONTENT ── */}
                        {activeTab === "content" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Descriptions</CardTitle>
                                        <CardDescription>Shared across all variants unless overridden at the variant level.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Tabs defaultValue="english">
                                            <TabsList>
                                                <TabsTrigger value="english">English</TabsTrigger>
                                                <TabsTrigger value="arabic">Arabic</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="english" className="space-y-4 pt-4">
                                                <div className="space-y-2">
                                                    <Label>Short Description (EN) <span className="text-muted-foreground text-xs font-normal">Max 500 chars</span></Label>
                                                    <Input value={product.shortDescriptionEn ?? ""} onChange={e => update({ shortDescriptionEn: e.target.value })} placeholder="Used in catalogue cards and social meta" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Master Description (EN) <span className="text-destructive">*</span></Label>
                                                    <textarea className="w-full h-36 p-3 border rounded-md text-sm" value={product.descriptionEn} onChange={e => update({ descriptionEn: e.target.value })} placeholder="Long-form description shared across all variants..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Usage Instructions (EN)</Label>
                                                    <textarea className="w-full h-24 p-3 border rounded-md text-sm" value={product.usageInstructionsEn ?? ""} onChange={e => update({ usageInstructionsEn: e.target.value })} placeholder="Dosage and usage directions" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Storage Instructions (EN)</Label>
                                                    <Input value={product.storageInstructionsEn ?? ""} onChange={e => update({ storageInstructionsEn: e.target.value })} placeholder="e.g. Store below 25°C, away from direct sunlight" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Science / Research Block (EN)</Label>
                                                    <textarea className="w-full h-28 p-3 border rounded-md text-sm" value={product.scienceBlockEn ?? ""} onChange={e => update({ scienceBlockEn: e.target.value })} placeholder="Clinical and scientific evidence section" />
                                                </div>
                                            </TabsContent>
                                            <TabsContent value="arabic" className="space-y-4 pt-4" dir="rtl">
                                                <div className="space-y-2">
                                                    <Label>وصف قصير (AR)</Label>
                                                    <Input className="text-right" value={product.shortDescriptionAr ?? ""} onChange={e => update({ shortDescriptionAr: e.target.value })} placeholder="يُستخدم في بطاقات الكتالوج والبيانات الاجتماعية" />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>الوصف الرئيسي (AR) <span className="text-destructive">*</span></Label>
                                                    <textarea dir="rtl" className="w-full h-36 p-3 border rounded-md text-sm text-right" value={product.descriptionAr} onChange={e => update({ descriptionAr: e.target.value })} placeholder="الوصف التفصيلي المشترك لجميع المتغيرات..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>تعليمات الاستخدام (AR)</Label>
                                                    <textarea dir="rtl" className="w-full h-24 p-3 border rounded-md text-sm text-right" value={product.usageInstructionsAr ?? ""} onChange={e => update({ usageInstructionsAr: e.target.value })} />
                                                </div>
                                            </TabsContent>
                                        </Tabs>
                                    </CardContent>
                                </Card>

                                {/* Benefits */}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Benefits</CardTitle>
                                            <CardDescription>Structured icon + label items displayed on the PDP.</CardDescription>
                                        </div>
                                        <Button onClick={addBenefit} variant="outline" size="sm">
                                            <Plus className="mr-2 h-4 w-4" /> Add Benefit
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {product.benefits.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4 italic">No benefits added.</p>
                                        ) : product.benefits.map((b, i) => (
                                            <div key={i} className="grid grid-cols-5 gap-2 items-start p-3 border rounded-md bg-muted/5">
                                                <Input className="h-8 text-xs" placeholder="Icon key (e.g. shield)" value={b.iconKey} onChange={e => update({ benefits: product.benefits.map((x, idx) => idx === i ? { ...x, iconKey: e.target.value } : x) })} />
                                                <Input className="h-8 text-xs" placeholder="Label (EN)" value={b.labelEn} onChange={e => update({ benefits: product.benefits.map((x, idx) => idx === i ? { ...x, labelEn: e.target.value } : x) })} />
                                                <Input className="h-8 text-xs" placeholder="Label (AR)" value={b.labelAr} dir="rtl" onChange={e => update({ benefits: product.benefits.map((x, idx) => idx === i ? { ...x, labelAr: e.target.value } : x) })} />
                                                <Input className="h-8 text-xs" placeholder="Description (EN)" value={b.descriptionEn} onChange={e => update({ benefits: product.benefits.map((x, idx) => idx === i ? { ...x, descriptionEn: e.target.value } : x) })} />
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeBenefit(i)}>
                                                    <Trash className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                {/* Ingredients */}
                                {(product.type === "supplement" || product.type === "medicine") && (
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle>Ingredients / Supplement Facts</CardTitle>
                                                <CardDescription>Active ingredients with amounts and daily values.</CardDescription>
                                            </div>
                                            <Button onClick={addIngredient} variant="outline" size="sm">
                                                <Plus className="mr-2 h-4 w-4" /> Add Ingredient
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            {product.ingredients.length === 0 ? (
                                                <p className="text-sm text-muted-foreground text-center py-4 italic">No ingredients added.</p>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/30">
                                                            <TableHead className="h-8 text-xs">Name (EN)</TableHead>
                                                            <TableHead className="h-8 text-xs">Name (AR)</TableHead>
                                                            <TableHead className="h-8 text-xs">Amount</TableHead>
                                                            <TableHead className="h-8 text-xs">Unit</TableHead>
                                                            <TableHead className="h-8 text-xs">Daily Value %</TableHead>
                                                            <TableHead className="h-8 text-xs text-right">Remove</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {product.ingredients.map((ing, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className="py-1.5"><Input className="h-7 text-xs" value={ing.nameEn} onChange={e => update({ ingredients: product.ingredients.map((x, idx) => idx === i ? { ...x, nameEn: e.target.value } : x) })} /></TableCell>
                                                                <TableCell className="py-1.5"><Input className="h-7 text-xs text-right" dir="rtl" value={ing.nameAr} onChange={e => update({ ingredients: product.ingredients.map((x, idx) => idx === i ? { ...x, nameAr: e.target.value } : x) })} /></TableCell>
                                                                <TableCell className="py-1.5"><Input type="number" className="h-7 text-xs w-20" value={ing.amount} onChange={e => update({ ingredients: product.ingredients.map((x, idx) => idx === i ? { ...x, amount: Number(e.target.value) } : x) })} /></TableCell>
                                                                <TableCell className="py-1.5"><Input className="h-7 text-xs w-16" value={ing.unit} placeholder="mg" onChange={e => update({ ingredients: product.ingredients.map((x, idx) => idx === i ? { ...x, unit: e.target.value } : x) })} /></TableCell>
                                                                <TableCell className="py-1.5"><Input type="number" className="h-7 text-xs w-20" value={ing.dailyValuePct ?? ""} placeholder="null" onChange={e => update({ ingredients: product.ingredients.map((x, idx) => idx === i ? { ...x, dailyValuePct: e.target.value ? Number(e.target.value) : null } : x) })} /></TableCell>
                                                                <TableCell className="py-1.5 text-right">
                                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeIngredient(i)}>
                                                                        <Trash className="h-3 w-3" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Delivery Config */}
                                {product.type !== "gift_card" && (
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <div>
                                                <CardTitle>City-Level Delivery Configuration</CardTitle>
                                                <CardDescription>Manage delivery times and availability per city. Falls back to global config if empty.</CardDescription>
                                            </div>
                                            <Button onClick={addDelivery} size="sm" variant="outline">
                                                <Plus className="mr-2 h-4 w-4" /> Add City
                                            </Button>
                                        </CardHeader>
                                        <CardContent>
                                            {product.deliveryConfig.length === 0 ? (
                                                <div className="text-center py-4 border rounded-md bg-muted/5 italic text-sm text-muted-foreground">
                                                    No city-level configs. Global delivery config will be used.
                                                </div>
                                            ) : (
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow className="bg-muted/50">
                                                            <TableHead className="h-9 text-xs">City</TableHead>
                                                            <TableHead className="h-9 text-xs">Delivery Time</TableHead>
                                                            <TableHead className="h-9 text-xs">Availability</TableHead>
                                                            <TableHead className="h-9 text-xs text-right">Remove</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {product.deliveryConfig.map((cfg, i) => (
                                                            <TableRow key={i}>
                                                                <TableCell className="py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                        <Input value={cfg.city} onChange={e => updateDelivery(i, { city: e.target.value })} placeholder="City" className="h-8 text-xs" />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <Truck className="h-3 w-3 text-muted-foreground shrink-0" />
                                                                        <Input value={cfg.deliveryTime} onChange={e => updateDelivery(i, { deliveryTime: e.target.value })} placeholder="e.g. Same Day, 24 hours" className="h-8 text-xs" />
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell className="py-2">
                                                                    <Select value={cfg.isAvailable ? "yes" : "no"} onValueChange={v => updateDelivery(i, { isAvailable: v === "yes" })}>
                                                                        <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="yes">Available</SelectItem>
                                                                            <SelectItem value="no">Unavailable</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </TableCell>
                                                                <TableCell className="py-2 text-right">
                                                                    <Button variant="ghost" size="icon" onClick={() => removeDelivery(i)} className="h-7 w-7 text-destructive">
                                                                        <Trash className="h-3.5 w-3.5" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* ── 3. MEDIA GALLERY ── */}
                        {activeTab === "media" && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Media Gallery</CardTitle>
                                        <CardDescription>
                                            Min 1 asset required for active status. Max 10 assets, max 1 video.
                                            Exactly one image must be marked as hero.
                                        </CardDescription>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        <ImagePlus className="mr-2 h-4 w-4" /> Upload Asset
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {product.mediaGallery.length === 0 ? (
                                        <div className="border-2 border-dashed rounded-lg p-10 text-center">
                                            <ImagePlus className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                            <p className="text-sm font-medium">No assets uploaded</p>
                                            <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP (max 5MB, min 800×800px) · MP4 video (max 100MB)</p>
                                            <Button variant="outline" size="sm" className="mt-4">Upload your first asset</Button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {product.mediaGallery.map((asset, i) => (
                                                <div key={asset.assetId} className={`flex items-start gap-4 p-3 border rounded-lg ${asset.isHero ? "border-primary bg-primary/5" : ""}`}>
                                                    <div className="shrink-0 flex items-center">
                                                        <GripVertical className="h-4 w-4 text-muted-foreground mr-2" />
                                                        <div className="w-16 h-16 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                                            {asset.type === "video" ? "VIDEO" : "IMG"}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Asset URL</Label>
                                                            <Input className="h-8 text-xs" value={asset.url} placeholder="https://cdn.example.com/image.webp" onChange={e => update({ mediaGallery: product.mediaGallery.map((a, idx) => idx === i ? { ...a, url: e.target.value } : a) })} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Type</Label>
                                                            <Select value={asset.type} onValueChange={v => update({ mediaGallery: product.mediaGallery.map((a, idx) => idx === i ? { ...a, type: v as "image" | "video" } : a) })}>
                                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="image">Image</SelectItem>
                                                                    <SelectItem value="video">Video</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Alt Text (EN)</Label>
                                                            <Input className="h-8 text-xs" value={asset.altTextEn} onChange={e => update({ mediaGallery: product.mediaGallery.map((a, idx) => idx === i ? { ...a, altTextEn: e.target.value } : a) })} />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Alt Text (AR)</Label>
                                                            <Input className="h-8 text-xs text-right" dir="rtl" value={asset.altTextAr} onChange={e => update({ mediaGallery: product.mediaGallery.map((a, idx) => idx === i ? { ...a, altTextAr: e.target.value } : a) })} />
                                                        </div>
                                                        {asset.type === "video" && (
                                                            <div className="col-span-2 space-y-1 bg-amber-50 border border-amber-200 rounded-md p-2">
                                                                <Label className="text-xs font-medium text-amber-800 flex items-center gap-1">
                                                                    <ImagePlus className="h-3 w-3" /> Video Thumbnail <span className="text-destructive">*</span>
                                                                </Label>
                                                                <Input
                                                                    className="h-7 text-xs bg-white"
                                                                    value={asset.thumbnailUrl ?? ""}
                                                                    onChange={e => update({ mediaGallery: product.mediaGallery.map((a, idx) => idx === i ? { ...a, thumbnailUrl: e.target.value } : a) })}
                                                                    placeholder="Thumbnail image URL — required for video assets"
                                                                />
                                                                <p className="text-[10px] text-amber-700">Required for every video. Shown as the video poster before playback.</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        {asset.type === "image" && (
                                                            <Button
                                                                size="sm"
                                                                variant={asset.isHero ? "default" : "outline"}
                                                                className="h-7 text-xs"
                                                                onClick={() => update({ mediaGallery: product.mediaGallery.map((a, idx) => ({ ...a, isHero: idx === i })) })}
                                                            >
                                                                <Star className="mr-1 h-3 w-3" />
                                                                {asset.isHero ? "Hero" : "Set Hero"}
                                                            </Button>
                                                        )}
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => update({ mediaGallery: product.mediaGallery.filter((_, idx) => idx !== i) })}>
                                                            <Trash className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* ── 4. VARIANTS FLOW ── */}
                        {activeTab === "variants" && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-semibold">Variants Flow</h3>
                                        <p className="text-sm text-muted-foreground">Each variant represents a purchasable option (size, dosage, denomination, etc.)</p>
                                    </div>
                                    <Button onClick={addVariant} size="sm">
                                        <Plus className="mr-2 h-4 w-4" /> Add Unique Variant
                                    </Button>
                                </div>

                                {product.variants.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/10">
                                        <p className="text-muted-foreground font-medium">No variants added yet.</p>
                                        <p className="text-sm text-muted-foreground mt-1">At least one active variant is required to publish the product.</p>
                                        <Button onClick={addVariant} variant="outline" size="sm" className="mt-4">
                                            <Plus className="mr-2 h-4 w-4" /> Add First Variant
                                        </Button>
                                    </div>
                                ) : product.variants.map((v, idx) => (
                                    <Card key={v.id} className={`border-l-4 ${v.isDefault ? "border-l-primary" : "border-l-muted"}`}>
                                        <CardHeader className="py-3 flex flex-row items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-sm">Variant #{idx + 1}: {v.nameEn || "Unnamed Variant"}</span>
                                                        {v.isDefault && <Badge variant="outline" className="text-[10px] h-4 px-1 bg-primary/10 text-primary border-primary/20">Default</Badge>}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <Badge variant="outline" className={
                                                            v.status === "active" ? "text-emerald-700 border-emerald-200 bg-emerald-50 text-[10px] h-4 px-1" :
                                                                v.status === "out_of_stock" ? "text-amber-700 border-amber-200 bg-amber-50 text-[10px] h-4 px-1" :
                                                                    "text-slate-600 border-slate-200 bg-slate-50 text-[10px] h-4 px-1"
                                                        }>
                                                            {v.status}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">SKU: {v.regionalData[0]?.sku || "—"}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {!v.isDefault && (
                                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setDefaultVariant(v.id)}>
                                                        <Star className="mr-1 h-3 w-3" /> Set Default
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateVariant(v.id)} title="Duplicate variant">
                                                    <Copy className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeVariant(v.id)}>
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-5 pt-0">
                                            {/* Variant Identity */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Variant Type <span className="text-destructive">*</span></Label>
                                                    <Select value={v.variantType} onValueChange={val => updateVariant(v.id, { variantType: val as VariantType })}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {VARIANT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Variant Label (EN) <span className="text-destructive">*</span></Label>
                                                    <Input className="h-8 text-xs" placeholder="e.g. 500mg, Chocolate, AED 250" value={v.variantLabelEn} onChange={e => updateVariant(v.id, { variantLabelEn: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Variant Label (AR) <span className="text-destructive">*</span></Label>
                                                    <Input className="h-8 text-xs text-right" dir="rtl" placeholder="مثال: 500 مجم، شوكولاتة" value={v.variantLabelAr} onChange={e => updateVariant(v.id, { variantLabelAr: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Status</Label>
                                                    <Select value={v.status} onValueChange={val => updateVariant(v.id, { status: val as VariantStatus })}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">Active</SelectItem>
                                                            <SelectItem value="inactive">Inactive</SelectItem>
                                                            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Stock Quantity</Label>
                                                    <Input type="number" className="h-8 text-xs" value={v.stockQuantity} onChange={e => updateVariant(v.id, { stockQuantity: Number(e.target.value) })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Low Stock Threshold</Label>
                                                    <Input type="number" className="h-8 text-xs" value={v.lowStockThreshold ?? 10} onChange={e => updateVariant(v.id, { lowStockThreshold: Number(e.target.value) })} />
                                                </div>
                                            </div>

                                            {/* Regional Availability */}
                                            <div className="space-y-3 border p-3 rounded-md bg-muted/5">
                                                <div className="flex items-center justify-between">
                                                    <Label className="font-semibold text-xs">Regional Availability & Commercial Data</Label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {COUNTRIES.map(country => (
                                                            <Button
                                                                key={country}
                                                                size="sm"
                                                                variant={v.regionalData.some(r => r.country === country) ? "default" : "outline"}
                                                                onClick={() => toggleCountry(v.id, country)}
                                                                className="h-6 text-[10px] px-2"
                                                            >
                                                                {country}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {v.regionalData.length === 0 ? (
                                                    <p className="text-xs text-muted-foreground italic text-center py-2">
                                                        No regions enabled. Activate at least one region for this variant.
                                                    </p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {v.regionalData.map(reg => (
                                                            <div key={reg.country} className="grid grid-cols-5 gap-2 p-2 border rounded bg-white shadow-xs items-end">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-bold text-xs text-slate-700">{reg.country}</span>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] text-muted-foreground">SKU <span className="text-destructive">*</span></Label>
                                                                    <Input className="h-7 text-xs" value={reg.sku} placeholder="Unique SKU" onChange={e => updateRegional(v.id, reg.country, { sku: e.target.value })} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] text-muted-foreground">Zoho ID <span className="text-destructive">*</span></Label>
                                                                    <Input className="h-7 text-xs" value={reg.zohoId} onChange={e => updateRegional(v.id, reg.country, { zohoId: e.target.value })} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] text-muted-foreground">Price <span className="text-destructive">*</span></Label>
                                                                    <Input type="number" className="h-7 text-xs" value={reg.price} onChange={e => updateRegional(v.id, reg.country, { price: Number(e.target.value) })} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] text-muted-foreground">Available</Label>
                                                                    <Select value={reg.isAvailable ? "yes" : "no"} onValueChange={val => updateRegional(v.id, reg.country, { isAvailable: val === "yes" })}>
                                                                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="yes">Yes</SelectItem>
                                                                            <SelectItem value="no">No</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* EN/AR bilingual slugs + names */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-3 border p-3 rounded-md bg-muted/5">
                                                    <Label className="font-semibold text-xs">English Identity</Label>
                                                    <Input placeholder="Display Name (EN) *" className="h-8 text-xs" value={v.nameEn} onChange={e => updateVariant(v.id, { nameEn: e.target.value })} />
                                                    <Input placeholder="URL Slug (EN) *" className="h-8 text-xs" value={v.slugEn} onChange={e => updateVariant(v.id, { slugEn: e.target.value })} />
                                                    <textarea placeholder="Short Description (EN)" className="w-full text-xs p-2 border rounded h-16" value={v.shortDescriptionEn ?? ""} onChange={e => updateVariant(v.id, { shortDescriptionEn: e.target.value })} />
                                                </div>
                                                <div className="space-y-3 border p-3 rounded-md bg-muted/5" dir="rtl">
                                                    <Label className="font-semibold text-xs text-right">الهوية العربية</Label>
                                                    <Input placeholder="اسم المنتج (AR) *" className="h-8 text-xs text-right" value={v.nameAr} onChange={e => updateVariant(v.id, { nameAr: e.target.value })} />
                                                    <Input placeholder="نص الرابط (AR) *" className="h-8 text-xs text-right" value={v.slugAr} onChange={e => updateVariant(v.id, { slugAr: e.target.value })} />
                                                    <textarea placeholder="وصف قصير (AR)" className="w-full text-xs p-2 border rounded h-16 text-right" value={v.shortDescriptionAr ?? ""} onChange={e => updateVariant(v.id, { shortDescriptionAr: e.target.value })} />
                                                </div>
                                            </div>

                                            {/* Pricing extras */}
                                            <div className="grid grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">VAT % <span className="text-destructive">*</span></Label>
                                                    <Input type="number" className="h-8 text-xs" value={v.vat} onChange={e => updateVariant(v.id, { vat: Number(e.target.value) })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Compare-at Price Override</Label>
                                                    <Input type="number" className="h-8 text-xs" value={v.compareAtPriceOverride ?? ""} placeholder="Leave empty to use master" onChange={e => updateVariant(v.id, { compareAtPriceOverride: e.target.value ? Number(e.target.value) : undefined })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Image URL (Override)</Label>
                                                    <Input className="h-8 text-xs" value={v.imageUrl ?? ""} placeholder="Overrides master hero on selection" onChange={e => updateVariant(v.id, { imageUrl: e.target.value })} />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* ── 5. SUBSCRIPTION & PRICING ── */}
                        {activeTab === "subscription" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Subscription Configuration</CardTitle>
                                        <CardDescription>
                                            {(product.type === "wearable" || product.type === "gift_card")
                                                ? "Subscriptions are not available for Wearable or Gift Card product types."
                                                : "Control subscription availability, frequencies, and discounts for this product."}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-5">
                                        {(product.type === "wearable" || product.type === "gift_card") ? (
                                            <div className="flex items-center gap-2 p-3 rounded-md bg-amber-50 text-amber-700 text-sm border border-amber-200">
                                                <AlertCircle className="h-4 w-4 shrink-0" />
                                                <span>Subscriptions cannot be enabled for {product.type === "wearable" ? "Wearable" : "Gift Card"} products.</span>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between p-3 border rounded-md">
                                                    <div>
                                                        <Label className="font-medium">Enable Subscription</Label>
                                                        <p className="text-xs text-muted-foreground mt-0.5">Shows subscription toggle on the PDP</p>
                                                    </div>
                                                    <Switch checked={product.subscriptionEnabled} onCheckedChange={v => update({ subscriptionEnabled: v })} />
                                                </div>

                                                {product.subscriptionEnabled && (
                                                    <>
                                                        <div className="flex items-center justify-between p-3 border rounded-md">
                                                            <div>
                                                                <Label className="font-medium">Auto-Select Subscription</Label>
                                                                <p className="text-xs text-muted-foreground mt-0.5">Subscription tab pre-selected on PDP load</p>
                                                            </div>
                                                            <Switch checked={product.subscriptionAutoSelected} onCheckedChange={v => update({ subscriptionAutoSelected: v })} />
                                                        </div>

                                                        <div className="space-y-3">
                                                            <Label className="font-medium">Available Frequencies & Discounts</Label>
                                                            <div className="space-y-2">
                                                                {SUBSCRIPTION_FREQUENCIES.map(freq => {
                                                                    const enabled = product.subscriptionFrequencies.includes(freq)
                                                                    return (
                                                                        <div key={freq} className="flex items-center gap-3 p-3 border rounded-md">
                                                                            <Switch
                                                                                checked={enabled}
                                                                                onCheckedChange={checked => {
                                                                                    const freqs = checked
                                                                                        ? [...product.subscriptionFrequencies, freq]
                                                                                        : product.subscriptionFrequencies.filter(f => f !== freq)
                                                                                    update({ subscriptionFrequencies: freqs })
                                                                                }}
                                                                            />
                                                                            <Label className="w-24 capitalize">{freq.replace("_", " ")}</Label>
                                                                            <div className="flex items-center gap-2">
                                                                                <Label className="text-xs text-muted-foreground">Discount %</Label>
                                                                                <Input
                                                                                    type="number"
                                                                                    className="h-7 w-20 text-xs"
                                                                                    disabled={!enabled}
                                                                                    value={product.subscriptionDiscountPct[freq] ?? ""}
                                                                                    placeholder="0"
                                                                                    onChange={e => update({ subscriptionDiscountPct: { ...product.subscriptionDiscountPct, [freq]: Number(e.target.value) } })}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <Label>Savings Label (EN)</Label>
                                                                <Input value={product.subscriptionSavingsLabelEn ?? ""} onChange={e => update({ subscriptionSavingsLabelEn: e.target.value })} placeholder="e.g. Save 15% vs one-time" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Savings Label (AR)</Label>
                                                                <Input dir="rtl" value={product.subscriptionSavingsLabelAr ?? ""} onChange={e => update({ subscriptionSavingsLabelAr: e.target.value })} placeholder="مثال: وفر 15% مقارنة بالشراء الفردي" className="text-right" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Terms Copy (EN) <span className="text-xs text-muted-foreground font-normal">Max 300 chars</span></Label>
                                                                <Input value={product.subscriptionTermsEn ?? ""} onChange={e => update({ subscriptionTermsEn: e.target.value })} placeholder="e.g. Cancel anytime. No hidden fees." />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Terms Copy (AR)</Label>
                                                                <Input dir="rtl" value={product.subscriptionTermsAr ?? ""} onChange={e => update({ subscriptionTermsAr: e.target.value })} className="text-right" />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label>Min. Commitment Cycles</Label>
                                                                <Input type="number" value={product.subscriptionMinCycles} onChange={e => update({ subscriptionMinCycles: Number(e.target.value) })} />
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle>Multi-Buy Discount Tiers</CardTitle>
                                            <CardDescription>Quantity-based discounts. Tiers must be in ascending min_quantity order.</CardDescription>
                                        </div>
                                        <Button onClick={addMultiBuyTier} variant="outline" size="sm">
                                            <Plus className="mr-2 h-4 w-4" /> Add Tier
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        {product.multiBuyTiers.length === 0 ? (
                                            <p className="text-sm text-muted-foreground text-center py-4 italic">No multi-buy tiers configured.</p>
                                        ) : (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="bg-muted/30">
                                                        <TableHead className="h-8 text-xs">Min Qty</TableHead>
                                                        <TableHead className="h-8 text-xs">Discount %</TableHead>
                                                        <TableHead className="h-8 text-xs">Label (EN)</TableHead>
                                                        <TableHead className="h-8 text-xs">Label (AR)</TableHead>
                                                        <TableHead className="h-8 text-xs text-right">Remove</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {product.multiBuyTiers.map((tier, i) => (
                                                        <TableRow key={i}>
                                                            <TableCell className="py-1.5"><Input type="number" className="h-7 text-xs w-16" value={tier.minQuantity} onChange={e => update({ multiBuyTiers: product.multiBuyTiers.map((t, idx) => idx === i ? { ...t, minQuantity: Number(e.target.value) } : t) })} /></TableCell>
                                                            <TableCell className="py-1.5"><Input type="number" className="h-7 text-xs w-16" value={tier.discountPct} onChange={e => update({ multiBuyTiers: product.multiBuyTiers.map((t, idx) => idx === i ? { ...t, discountPct: Number(e.target.value) } : t) })} /></TableCell>
                                                            <TableCell className="py-1.5 text-xs text-muted-foreground" colSpan={2}>
                                                                Buy {tier.minQuantity}, save {tier.discountPct}%
                                                            </TableCell>
                                                            <TableCell className="py-1.5 text-right">
                                                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeMultiBuyTier(i)}>
                                                                    <Trash className="h-3 w-3" />
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* ── 6. ADD-ONS & RECOMMENDATIONS ── */}
                        {activeTab === "addons" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Consultation & Service Add-ons</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex items-center justify-between p-3 border rounded-md">
                                            <div>
                                                <Label className="font-medium">Doctor Consultation Add-on</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">Enables a bookable consultation module on the PDP</p>
                                            </div>
                                            <Switch checked={product.consultationAddonEnabled} onCheckedChange={v => update({ consultationAddonEnabled: v })} />
                                        </div>
                                        {product.consultationAddonEnabled && (
                                            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                                                <Label>Consultation Price (AED)</Label>
                                                <Input type="number" className="max-w-[200px]" value={product.consultationAddonPrice} onChange={e => update({ consultationAddonPrice: Number(e.target.value) })} />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between p-3 border rounded-md">
                                            <div>
                                                <Label className="font-medium">Gift Wrapping</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">Enables gift wrapping option (0 = free)</p>
                                            </div>
                                            <Switch checked={product.giftWrappingEnabled} onCheckedChange={v => update({ giftWrappingEnabled: v })} />
                                        </div>
                                        {product.giftWrappingEnabled && (
                                            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                                                <Label>Gift Wrapping Price (AED)</Label>
                                                <Input type="number" className="max-w-[200px]" value={product.giftWrappingPrice} onChange={e => update({ giftWrappingPrice: Number(e.target.value) })} />
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between p-3 border rounded-md">
                                            <div>
                                                <Label className="font-medium">Extended Delivery</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">Offers extended delivery window option</p>
                                            </div>
                                            <Switch checked={product.extendedDeliveryEnabled} onCheckedChange={v => update({ extendedDeliveryEnabled: v })} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Upsell Banner Text</CardTitle>
                                        <CardDescription>Optional promotional copy displayed in the add-ons section.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Banner Text (EN)</Label>
                                            <Input value={product.upsellBannerTextEn ?? ""} onChange={e => update({ upsellBannerTextEn: e.target.value })} placeholder="e.g. Complete your health stack" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Banner Text (AR)</Label>
                                            <Input dir="rtl" className="text-right" value={product.upsellBannerTextAr ?? ""} onChange={e => update({ upsellBannerTextAr: e.target.value })} />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Enhancement Products</CardTitle>
                                        <CardDescription>Up to 5 add-on products shown alongside this product. Each card links to the enhancement product's PDP.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                                            <Plus className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                            Product search & linking coming soon. Define up to 5 enhancement product + variant pairs.
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Frequently Bought Together</CardTitle>
                                        <CardDescription>Up to 5 products commonly purchased with this product.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                                            <Plus className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                            Product search & linking coming soon.
                                        </div>
                                    </CardContent>
                                </Card>

                                {product.type === "medicine" && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Biomarker Packages</CardTitle>
                                            <CardDescription>Mini blood test packages linked from this medicine PDP. Only rendered on Medicine-type PDPs.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                                                <Plus className="h-6 w-6 mx-auto mb-2 opacity-50" />
                                                Package linking coming soon.
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* ── 7. SEO & METADATA ── */}
                        {activeTab === "seo" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>URL Slugs</CardTitle>
                                        <CardDescription>
                                            Slugs must be globally unique. Auto-generated from display names; editable.
                                            Changing a slug on a published product will trigger a 301 redirect from the old URL.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Slug (EN) <span className="text-destructive">*</span></Label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground shrink-0">/products/</span>
                                                <Input value={product.slugEn} onChange={e => update({ slugEn: e.target.value })} placeholder="e.g. vitamin-d3-boost" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Slug (AR) <span className="text-destructive">*</span></Label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground shrink-0">/products/</span>
                                                <Input dir="rtl" className="text-right" value={product.slugAr} onChange={e => update({ slugAr: e.target.value })} placeholder="vitamin-d3-boost-ar" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>SEO Title & Description</CardTitle>
                                        <CardDescription>Required for publishing. Character limits enforced: title max 70, description max 160.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>SEO Title (EN) <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">{product.seoTitleEn.length}/70</span></Label>
                                                <Input value={product.seoTitleEn} onChange={e => update({ seoTitleEn: e.target.value })} placeholder="Page title for search engines" maxLength={70} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>SEO Title (AR) <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">{product.seoTitleAr.length}/70</span></Label>
                                                <Input dir="rtl" className="text-right" value={product.seoTitleAr} onChange={e => update({ seoTitleAr: e.target.value })} placeholder="عنوان الصفحة لمحركات البحث" maxLength={70} />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Meta Description (EN) <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">{product.seoDescriptionEn.length}/160</span></Label>
                                                <textarea className="w-full h-24 p-3 border rounded-md text-sm" value={product.seoDescriptionEn} onChange={e => update({ seoDescriptionEn: e.target.value })} placeholder="Description shown in search result snippets" maxLength={160} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Meta Description (AR) <span className="text-destructive">*</span> <span className="text-xs text-muted-foreground font-normal">{product.seoDescriptionAr.length}/160</span></Label>
                                                <textarea dir="rtl" className="w-full h-24 p-3 border rounded-md text-sm text-right" value={product.seoDescriptionAr} onChange={e => update({ seoDescriptionAr: e.target.value })} maxLength={160} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Advanced SEO</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Canonical URL Override</Label>
                                                <Input value={product.seoCanonicalUrl ?? ""} onChange={e => update({ seoCanonicalUrl: e.target.value })} placeholder="https://feelvaleo.com/products/..." />
                                                <p className="text-xs text-muted-foreground">Defaults to /products/{"{slug_en}"} if left empty.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>OG Image URL Override</Label>
                                                <Input value={product.ogImageUrl ?? ""} onChange={e => update({ ogImageUrl: e.target.value })} placeholder="Defaults to hero media asset" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* ── 8. FEATURE FLAGS ── */}
                        {activeTab === "flags" && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Feature Flags</CardTitle>
                                    <CardDescription>
                                        Per-product overrides controlling variant visibility, subscription auto-selection,
                                        and consultation link behaviour. Global flags apply where not overridden here.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {[
                                        {
                                            key: "hideVariantsOnConsultationLink" as const,
                                            label: "Hide Variants on Consultation Link",
                                            description: "Hides the variant selector when the PDP is opened via a doctor consultation recommendation link"
                                        },
                                        {
                                            key: "forceVariantDisplay" as const,
                                            label: "Force Variant Display",
                                            description: "Forces the variant selector visible regardless of other conditions (overrides hide_variants flag)"
                                        },
                                        {
                                            key: "variantVisibilityUrlOverrideEnabled" as const,
                                            label: "Allow URL Parameter to Control Variant Visibility",
                                            description: "Permits ?show_variants=true/false URL parameter to control variant visibility for this product"
                                        },
                                        {
                                            key: "showCompareAtPrice" as const,
                                            label: "Show Compare-at Price",
                                            description: "Shows strikethrough/compare-at price on the PDP pricing block"
                                        },
                                        {
                                            key: "showStockIndicator" as const,
                                            label: "Show Stock Indicator",
                                            description: "Shows low-stock / in-stock indicator badge on the PDP"
                                        },
                                        {
                                            key: "showDeliveryEstimate" as const,
                                            label: "Show Delivery Estimate",
                                            description: "Shows the delivery estimate sourced from delivery config"
                                        },
                                        {
                                            key: "consultationLinkSuppressesAddons" as const,
                                            label: "Consultation Link Suppresses All Add-ons",
                                            description: "When accessed via a consultation link, all add-ons are hidden (not just variants)"
                                        },
                                    ].map(flag => (
                                        <div key={flag.key} className="flex items-center justify-between p-3 border rounded-md">
                                            <div className="flex-1 pr-4">
                                                <Label className="text-sm font-medium">{flag.label}</Label>
                                                <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>
                                            </div>
                                            <Switch
                                                checked={product[flag.key] as boolean}
                                                onCheckedChange={v => update({ [flag.key]: v })}
                                            />
                                        </div>
                                    ))}

                                    <Separator />

                                    <div className="p-3 border rounded-md space-y-3">
                                        <div>
                                            <Label className="text-sm font-medium">Subscription Auto-Select Override</Label>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Override the global subscription auto-select setting for this product only.
                                                <strong> null</strong> = defer to global setting.
                                            </p>
                                        </div>
                                        <Select
                                            value={product.subscriptionAutoSelectOverride === null ? "null" : String(product.subscriptionAutoSelectOverride)}
                                            onValueChange={v => update({ subscriptionAutoSelectOverride: v === "null" ? null : v === "true" })}
                                        >
                                            <SelectTrigger className="max-w-[250px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="null">Defer to global setting (null)</SelectItem>
                                                <SelectItem value="true">Force auto-select ON</SelectItem>
                                                <SelectItem value="false">Force auto-select OFF</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* ── 10. CUSTOMER REVIEWS ── */}
                        {activeTab === "reviews" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <MessageSquare className="h-4 w-4" /> Real Stories, Real Results
                                            </CardTitle>
                                            <CardDescription>
                                                Customer reviews displayed on the PDP. Photo and video are optional —
                                                if a video is uploaded a thumbnail image is required.
                                            </CardDescription>
                                        </div>
                                        <Button onClick={addReview} variant="outline" size="sm">
                                            <Plus className="mr-2 h-4 w-4" /> Add Review
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {product.reviews.length === 0 ? (
                                            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                                                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                                No reviews added. Click "Add Review" to create the first entry.
                                            </div>
                                        ) : product.reviews.map((review, idx) => (
                                            <div key={review.id} className="border rounded-lg p-4 space-y-4 bg-muted/5">
                                                {/* Header row */}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-medium text-muted-foreground">Review #{idx + 1}</span>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeReview(review.id)}>
                                                        <Trash className="h-3 w-3" />
                                                    </Button>
                                                </div>

                                                {/* Identity row */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Reviewer Name <span className="text-destructive">*</span></Label>
                                                        <Input className="h-8" value={review.reviewerName} onChange={e => updateReview(review.id, { reviewerName: e.target.value })} placeholder="e.g. Sarah Mitchell" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Star Rating <span className="text-destructive">*</span></Label>
                                                        <Select value={String(review.rating)} onValueChange={v => updateReview(review.id, { rating: Number(v) as 1 | 2 | 3 | 4 | 5 })}>
                                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                {[5, 4, 3, 2, 1].map(n => (
                                                                    <SelectItem key={n} value={String(n)}>
                                                                        {"★".repeat(n)}{"☆".repeat(5 - n)} ({n})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex items-center justify-between p-2.5 border rounded-md bg-white">
                                                        <div>
                                                            <Label className="text-xs font-medium">Verified Purchase</Label>
                                                        </div>
                                                        <Switch
                                                            checked={review.isVerified}
                                                            onCheckedChange={v => updateReview(review.id, { isVerified: v })}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Review text */}
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Review Text (EN) <span className="text-destructive">*</span></Label>
                                                        <textarea
                                                            className="w-full h-20 p-2 border rounded-md text-sm"
                                                            value={review.reviewTextEn}
                                                            onChange={e => updateReview(review.id, { reviewTextEn: e.target.value })}
                                                            placeholder="Customer's review in English..."
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-xs">Review Text (AR) <span className="text-muted-foreground font-normal">Optional</span></Label>
                                                        <textarea
                                                            dir="rtl"
                                                            className="w-full h-20 p-2 border rounded-md text-sm text-right"
                                                            value={review.reviewTextAr ?? ""}
                                                            onChange={e => updateReview(review.id, { reviewTextAr: e.target.value })}
                                                            placeholder="مراجعة العميل بالعربية (اختياري)..."
                                                        />
                                                    </div>
                                                </div>

                                                {/* Media */}
                                                <div className="space-y-3 border-t pt-3">
                                                    <p className="text-xs font-medium text-muted-foreground">Media (Optional)</p>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs flex items-center gap-1">
                                                                <ImagePlus className="h-3 w-3" /> Lifestyle / Before-After Photo URL
                                                            </Label>
                                                            <Input className="h-8 text-xs" value={review.photoUrl ?? ""} onChange={e => updateReview(review.id, { photoUrl: e.target.value })} placeholder="https://cdn.example.com/photo.jpg" />
                                                            <p className="text-[10px] text-muted-foreground">JPEG, PNG, WebP · Max 5MB</p>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs flex items-center gap-1">
                                                                <Video className="h-3 w-3" /> Review Video URL
                                                                <span className="text-muted-foreground font-normal">Optional</span>
                                                            </Label>
                                                            <Input className="h-8 text-xs" value={review.videoUrl ?? ""} onChange={e => updateReview(review.id, { videoUrl: e.target.value })} placeholder="https://cdn.example.com/review.mp4" />
                                                            <p className="text-[10px] text-muted-foreground">MP4 · Max 100MB</p>
                                                        </div>
                                                    </div>

                                                    {/* Thumbnail required only when video URL is set */}
                                                    {review.videoUrl && (
                                                        <div className="space-y-1 bg-amber-50 border border-amber-200 rounded-md p-3">
                                                            <Label className="text-xs font-medium text-amber-800 flex items-center gap-1">
                                                                <ImagePlus className="h-3 w-3" /> Video Thumbnail Image <span className="text-destructive">*</span>
                                                            </Label>
                                                            <Input className="h-8 text-xs bg-white" value={review.videoThumbnailUrl ?? ""} onChange={e => updateReview(review.id, { videoThumbnailUrl: e.target.value })} placeholder="Thumbnail required when a video is uploaded" />
                                                            <p className="text-[10px] text-amber-700">Required when a video is uploaded. Displayed as the video cover image.</p>
                                                        </div>
                                                    )}

                                                    {/* Date */}
                                                    <div className="space-y-1 max-w-[200px]">
                                                        <Label className="text-xs">Review Date</Label>
                                                        <Input type="date" className="h-8 text-xs" value={review.date ?? ""} onChange={e => updateReview(review.id, { date: e.target.value })} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* ── 11. INFLUENCER VIDEOS ── */}
                        {activeTab === "influencers" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Users className="h-4 w-4" /> Loved by Our Community
                                            </CardTitle>
                                            <CardDescription>
                                                Influencer and UGC (user-generated content) videos displayed on the PDP.
                                                Each entry requires a thumbnail image — the video itself is optional (thumbnail-only mode shows a static card).
                                            </CardDescription>
                                        </div>
                                        <Button onClick={addInfluencerVideo} variant="outline" size="sm">
                                            <Plus className="mr-2 h-4 w-4" /> Add Influencer
                                        </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {product.influencerVideos.length === 0 ? (
                                            <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                                                <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                                No influencer videos added yet.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {product.influencerVideos.map((vid, idx) => (
                                                    <div key={vid.id} className="border rounded-lg p-4 space-y-4 bg-muted/5">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-xs font-medium text-muted-foreground">
                                                                    {vid.handle || `Influencer #${idx + 1}`}
                                                                </span>
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeInfluencerVideo(vid.id)}>
                                                                <Trash className="h-3 w-3" />
                                                            </Button>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-3">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Social Handle <span className="text-destructive">*</span></Label>
                                                                <Input className="h-8 text-xs" value={vid.handle} onChange={e => updateInfluencerVideo(vid.id, { handle: e.target.value })} placeholder="@username" />
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Platform <span className="text-destructive">*</span></Label>
                                                                <Select value={vid.platform} onValueChange={v => updateInfluencerVideo(vid.id, { platform: v as InfluencerVideo["platform"] })}>
                                                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="tiktok">TikTok</SelectItem>
                                                                        <SelectItem value="instagram">Instagram</SelectItem>
                                                                        <SelectItem value="youtube">YouTube</SelectItem>
                                                                        <SelectItem value="other">Other</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Caption (EN)</Label>
                                                                <Input className="h-8 text-xs" value={vid.captionEn ?? ""} onChange={e => updateInfluencerVideo(vid.id, { captionEn: e.target.value })} placeholder="Short caption" />
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-3">
                                                            {/* Thumbnail - always required */}
                                                            <div className="space-y-1">
                                                                <Label className="text-xs font-medium flex items-center gap-1">
                                                                    <ImagePlus className="h-3 w-3" /> Thumbnail Image <span className="text-destructive">*</span>
                                                                </Label>
                                                                <Input className="h-8 text-xs" value={vid.thumbnailUrl} onChange={e => updateInfluencerVideo(vid.id, { thumbnailUrl: e.target.value })} placeholder="https://cdn.example.com/thumb.jpg" />
                                                                <p className="text-[10px] text-muted-foreground">Always required. Displayed as the card cover on the PDP carousel.</p>
                                                                {/* Thumbnail preview placeholder */}
                                                                {vid.thumbnailUrl ? (
                                                                    <div className="mt-2 w-20 h-28 rounded-lg border overflow-hidden bg-muted flex items-center justify-center">
                                                                        <Play className="h-5 w-5 text-muted-foreground opacity-50" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="mt-2 w-20 h-28 rounded-lg border-2 border-dashed bg-muted/30 flex items-center justify-center">
                                                                        <ImagePlus className="h-5 w-5 text-muted-foreground opacity-40" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {/* Video - optional */}
                                                            <div className="space-y-1">
                                                                <Label className="text-xs flex items-center gap-1">
                                                                    <Video className="h-3 w-3" /> Video URL
                                                                    <span className="text-muted-foreground font-normal ml-1">Optional</span>
                                                                </Label>
                                                                <Input className="h-8 text-xs" value={vid.videoUrl} onChange={e => updateInfluencerVideo(vid.id, { videoUrl: e.target.value })} placeholder="https://cdn.example.com/video.mp4 (leave empty for image-only card)" />
                                                                <p className="text-[10px] text-muted-foreground">MP4 · Max 100MB. If left empty the thumbnail renders as a static image card.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* ── 12. WHY [PRODUCT] IS SUPERIOR ── */}
                        {activeTab === "superiority" && (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4" /> Why [Product] is Superior
                                        </CardTitle>
                                        <CardDescription>
                                            A comparison / credibility section on the PDP. Consists of a headline, an optional
                                            media asset (video with required thumbnail, or image), and up to 8 feature points.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {/* Headline */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>Section Headline (EN)</Label>
                                                <Input
                                                    value={product.superiorityBlock.headlineEn}
                                                    onChange={e => updateSuperiority({ headlineEn: e.target.value })}
                                                    placeholder="e.g. Why Valeo Gut Revive is Superior"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Section Headline (AR)</Label>
                                                <Input
                                                    dir="rtl"
                                                    className="text-right"
                                                    value={product.superiorityBlock.headlineAr}
                                                    onChange={e => updateSuperiority({ headlineAr: e.target.value })}
                                                    placeholder="مثال: لماذا فاليو غت ريفايف متفوق"
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        {/* Media block */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="font-medium">Section Media</Label>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        Optional — upload a video or image. If a video is uploaded, a thumbnail is required.
                                                    </p>
                                                </div>
                                                <Select
                                                    value={product.superiorityBlock.mediaType ?? "none"}
                                                    onValueChange={v => updateSuperiority({ mediaType: v === "none" ? null : v as "video" | "image" })}
                                                >
                                                    <SelectTrigger className="w-[160px] h-9">
                                                        <SelectValue placeholder="No media" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="none">No media</SelectItem>
                                                        <SelectItem value="image">Image</SelectItem>
                                                        <SelectItem value="video">Video</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {product.superiorityBlock.mediaType && (
                                                <div className="space-y-3 border rounded-lg p-4 bg-muted/5">
                                                    <div className="space-y-1">
                                                        <Label className="text-sm font-medium flex items-center gap-1.5">
                                                            {product.superiorityBlock.mediaType === "video"
                                                                ? <><Video className="h-3.5 w-3.5" /> Video URL <span className="text-destructive">*</span></>
                                                                : <><ImagePlus className="h-3.5 w-3.5" /> Image URL <span className="text-destructive">*</span></>
                                                            }
                                                        </Label>
                                                        <Input
                                                            value={product.superiorityBlock.mediaUrl}
                                                            onChange={e => updateSuperiority({ mediaUrl: e.target.value })}
                                                            placeholder={
                                                                product.superiorityBlock.mediaType === "video"
                                                                    ? "https://cdn.example.com/superiority.mp4"
                                                                    : "https://cdn.example.com/superiority.jpg"
                                                            }
                                                        />
                                                        {product.superiorityBlock.mediaType === "video" && (
                                                            <p className="text-xs text-muted-foreground">MP4 · Max 100MB</p>
                                                        )}
                                                        {product.superiorityBlock.mediaType === "image" && (
                                                            <p className="text-xs text-muted-foreground">JPEG, PNG, WebP · Max 5MB · Min 800×450px recommended</p>
                                                        )}
                                                    </div>

                                                    {/* Thumbnail — only required for video */}
                                                    {product.superiorityBlock.mediaType === "video" && (
                                                        <div className="space-y-1 bg-amber-50 border border-amber-200 rounded-md p-3">
                                                            <Label className="text-xs font-medium text-amber-800 flex items-center gap-1">
                                                                <ImagePlus className="h-3 w-3" /> Video Thumbnail Image <span className="text-destructive">*</span>
                                                            </Label>
                                                            <Input
                                                                className="h-8 text-xs bg-white"
                                                                value={product.superiorityBlock.thumbnailUrl ?? ""}
                                                                onChange={e => updateSuperiority({ thumbnailUrl: e.target.value })}
                                                                placeholder="https://cdn.example.com/superiority-thumb.jpg"
                                                            />
                                                            <p className="text-[10px] text-amber-700">
                                                                Required when a video is uploaded. Shown as the video poster/cover before playback.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <Separator />

                                        {/* Feature points */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <Label className="font-medium">Feature Points</Label>
                                                    <p className="text-xs text-muted-foreground mt-0.5">Displayed in a 2-column grid below the media. Max 8 points.</p>
                                                </div>
                                                <Button
                                                    onClick={addSuperiorityPoint}
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={product.superiorityBlock.points.length >= 8}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" /> Add Point
                                                </Button>
                                            </div>

                                            {product.superiorityBlock.points.length === 0 ? (
                                                <div className="text-center py-6 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                                                    <Trophy className="h-6 w-6 mx-auto mb-2 opacity-40" />
                                                    No feature points added. Add points to explain why this product is superior.
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {product.superiorityBlock.points.map((point, i) => (
                                                        <div key={i} className="border rounded-lg p-4 space-y-3 bg-muted/5 relative">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                                                                        {i + 1}
                                                                    </div>
                                                                    <span className="text-xs font-medium text-muted-foreground">Point #{i + 1}</span>
                                                                </div>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeSuperiorityPoint(i)}>
                                                                    <Trash className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Title (EN) <span className="text-destructive">*</span></Label>
                                                                    <Input className="h-8" value={point.titleEn} onChange={e => updateSuperiorityPoint(i, { titleEn: e.target.value })} placeholder="e.g. Higher Bioavailability" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Title (AR) <span className="text-destructive">*</span></Label>
                                                                    <Input dir="rtl" className="h-8 text-right" value={point.titleAr} onChange={e => updateSuperiorityPoint(i, { titleAr: e.target.value })} placeholder="مثال: توافر بيولوجي أعلى" />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Description (EN) <span className="text-destructive">*</span></Label>
                                                                    <textarea className="w-full h-16 p-2 border rounded-md text-sm" value={point.descriptionEn} onChange={e => updateSuperiorityPoint(i, { descriptionEn: e.target.value })} placeholder="Marine collagen is absorbed up to 1.5x more efficiently..." />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-xs">Description (AR) <span className="text-destructive">*</span></Label>
                                                                    <textarea dir="rtl" className="w-full h-16 p-2 border rounded-md text-sm text-right" value={point.descriptionAr} onChange={e => updateSuperiorityPoint(i, { descriptionAr: e.target.value })} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <p className="text-xs text-muted-foreground text-right">
                                                        {product.superiorityBlock.points.length}/8 feature points
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* ── 13. MASTER FAQ ── */}
                        {activeTab === "faq" && (
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle>Master FAQ</CardTitle>
                                        <CardDescription>
                                            Q&A pairs rendered as an expandable accordion on the PDP. Max 20 items. Bilingual — EN and AR required per item.
                                        </CardDescription>
                                    </div>
                                    <Button onClick={addFaq} variant="outline" size="sm" disabled={product.faq.length >= 20}>
                                        <Plus className="mr-2 h-4 w-4" /> Add Q&A
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {product.faq.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground italic text-sm">
                                            No FAQs added. Click "Add Q&A" to create the first FAQ item.
                                        </div>
                                    ) : product.faq.map((item, i) => (
                                        <div key={i} className="border p-4 rounded-lg space-y-3 relative bg-muted/5">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-muted-foreground">FAQ #{i + 1}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFaq(i)}>
                                                    <Trash className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Question (EN) <span className="text-destructive">*</span></Label>
                                                    <Input className="h-8" value={item.questionEn} onChange={e => updateFaq(i, { questionEn: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Question (AR) <span className="text-destructive">*</span></Label>
                                                    <Input dir="rtl" className="h-8 text-right" value={item.questionAr} onChange={e => updateFaq(i, { questionAr: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Answer (EN) <span className="text-destructive">*</span></Label>
                                                    <textarea className="w-full h-20 p-2 border rounded-md text-sm" value={item.answerEn} onChange={e => updateFaq(i, { answerEn: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Answer (AR) <span className="text-destructive">*</span></Label>
                                                    <textarea dir="rtl" className="w-full h-20 p-2 border rounded-md text-sm text-right" value={item.answerAr} onChange={e => updateFaq(i, { answerAr: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {product.faq.length > 0 && (
                                        <p className="text-xs text-muted-foreground text-right">{product.faq.length}/20 FAQ items</p>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}

