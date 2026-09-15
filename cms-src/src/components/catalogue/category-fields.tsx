"use client"

import { useState, useMemo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Search } from "lucide-react"
import { ImageField } from "@/components/catalogue/ImageField"
import { RichText } from "@/components/catalogue/RichText"
import { SubDepartment, CategoryContent, CategoryStat, FAQItem, VisibleOn } from "@/types"

// Badge styling for a category / sub-category's VisibleOn surface.
export const VISIBLE_ON_BADGE: Record<VisibleOn, { label: string; className: string }> = {
    app: { label: "App", className: "bg-violet-100 text-violet-700 border-violet-200" },
    web: { label: "Web", className: "bg-sky-100 text-sky-700 border-sky-200" },
    both: { label: "App + Web", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
}

export const DEPARTMENT_LABEL: Record<string, string> = {
    diagnostics: "Diagnostics",
    treatments: "Treatments",
    consultations: "Consultations",
    home_personal: "Home & Personal",
    health_products: "Health Products",
}

// ── Reusable searchable checkbox list ──
export interface CheckOption {
    id: string
    primary: string
    primaryDir?: "rtl" | "ltr"
    secondary?: string
    department?: string
    subDepartmentId?: string
}

export function SearchableCheckList({
    options,
    selected,
    onToggle,
    placeholder,
    emptyLabel,
    subDepartments,
    onBulkToggle,
}: {
    options: CheckOption[]
    selected: Set<string>
    onToggle: (id: string) => void
    placeholder: string
    emptyLabel: string
    /** When provided, shows Department + Sub-department filter dropdowns. */
    subDepartments?: SubDepartment[]
    /** When provided, shows a Select-all / Clear-all control over the filtered set. */
    onBulkToggle?: (ids: string[], select: boolean) => void
}) {
    const [query, setQuery] = useState("")
    const [deptFilter, setDeptFilter] = useState<string>("all")
    const [subDeptFilter, setSubDeptFilter] = useState<string>("all")
    const showFilters = !!subDepartments

    const subDeptOptions = useMemo(
        () => (subDepartments ?? []).filter(s => deptFilter === "all" || s.department === deptFilter),
        [subDepartments, deptFilter]
    )

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        return options.filter(o => {
            if (q && !(o.primary.toLowerCase().includes(q) || (o.secondary?.toLowerCase().includes(q) ?? false))) return false
            if (deptFilter !== "all" && o.department !== deptFilter) return false
            if (subDeptFilter !== "all" && o.subDepartmentId !== subDeptFilter) return false
            return true
        })
    }, [options, query, deptFilter, subDeptFilter])

    const filteredIds = filtered.map(o => o.id)
    const allSelected = filteredIds.length > 0 && filteredIds.every(id => selected.has(id))

    return (
        <div className="space-y-2">
            {showFilters && (
                <div className="grid grid-cols-2 gap-2">
                    <Select value={deptFilter} onValueChange={v => { setDeptFilter(v); setSubDeptFilter("all") }}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Department" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {Object.keys(DEPARTMENT_LABEL).map(d => <SelectItem key={d} value={d}>{DEPARTMENT_LABEL[d]}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={subDeptFilter} onValueChange={setSubDeptFilter}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Sub-department" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sub-departments</SelectItem>
                            {subDeptOptions.map(s => <SelectItem key={s.id} value={s.id}>{s.nameEn}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder={placeholder} value={query} onChange={e => setQuery(e.target.value)} className="pl-9 h-9" />
            </div>
            {onBulkToggle && filtered.length > 0 && (
                <div className="flex items-center justify-between px-1">
                    <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => onBulkToggle(filteredIds, !allSelected)}>
                        {allSelected ? "Clear all shown" : `Select all shown (${filtered.length})`}
                    </button>
                    <span className="text-xs text-muted-foreground">{selected.size} selected</span>
                </div>
            )}
            <div className="max-h-[280px] overflow-y-auto rounded-md border divide-y">
                {filtered.length === 0 ? (
                    <p className="px-3 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
                ) : (
                    filtered.map(o => (
                        <label key={o.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/40 cursor-pointer">
                            <Checkbox checked={selected.has(o.id)} onCheckedChange={() => onToggle(o.id)} />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium truncate" dir={o.primaryDir}>{o.primary}</p>
                                {o.secondary && <p className="text-xs text-muted-foreground truncate">{o.secondary}</p>}
                            </div>
                        </label>
                    ))
                )}
            </div>
            {!onBulkToggle && <p className="text-xs text-muted-foreground">{selected.size} selected</p>}
        </div>
    )
}

// ── Shared landing-page content fields ──
const TRUST_BADGE_PRESETS = ["iso", "gdpr", "secure_payment", "moh_approved", "data_confidentiality"] as const

const TRUST_BADGE_LABEL: Record<string, string> = {
    iso: "ISO",
    gdpr: "GDPR",
    secure_payment: "Secure Payment",
    moh_approved: "MOH Approved",
    data_confidentiality: "Data Confidentiality",
}

function ContentText({
    label,
    value,
    onChange,
    placeholder,
    dir,
    mono,
}: {
    label: string
    value: string | undefined
    onChange: (v: string) => void
    placeholder?: string
    dir?: "rtl" | "ltr"
    mono?: boolean
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <Input
                dir={dir}
                value={value ?? ""}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={mono ? "font-mono text-sm" : undefined}
            />
        </div>
    )
}

function ContentTextArea({
    label,
    value,
    onChange,
    placeholder,
    dir,
}: {
    label: string
    value: string | undefined
    onChange: (v: string) => void
    placeholder?: string
    dir?: "rtl" | "ltr"
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            <textarea
                dir={dir}
                value={value ?? ""}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full min-h-[72px] border rounded-md p-2 text-sm bg-transparent"
            />
        </div>
    )
}

function SectionLabel({ children }: { children: ReactNode }) {
    return <p className="text-sm font-bold">{children}</p>
}

/** The distinct landing-page content concerns, matching the editor's sections. */
export type ContentSection =
    | "hero" | "stats" | "promo" | "description" | "info" | "options" | "faq" | "seo"

export function CategoryContentFields({
    value,
    onChange,
    only,
}: {
    value: CategoryContent
    onChange: (patch: Partial<CategoryContent>) => void
    /**
     * When set, renders only that one content block (used by the full-page editor
     * where each block is its own section). When omitted, renders every block with
     * separators + labels (used by the Map* dialogs), exactly as before.
     */
    only?: ContentSection
}) {
    const show = (s: ContentSection) => !only || only === s
    const combined = !only

    const stats: CategoryStat[] = value.heroStats ?? []
    const updateStat = (i: number, patch: Partial<CategoryStat>) =>
        onChange({ heroStats: stats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) })
    const addStat = () => onChange({ heroStats: [...stats, { value: "", labelEn: "", labelAr: "" }] })
    const removeStat = (i: number) => onChange({ heroStats: stats.filter((_, idx) => idx !== i) })

    const faqs: FAQItem[] = value.faq ?? []
    const updateFaq = (i: number, patch: Partial<FAQItem>) =>
        onChange({ faq: faqs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) })
    const addFaq = () =>
        onChange({
            faq: [
                ...faqs,
                { questionEn: "", questionAr: "", answerEn: "", answerAr: "", sortOrder: faqs.length },
            ],
        })
    const removeFaq = (i: number) =>
        onChange({ faq: faqs.filter((_, idx) => idx !== i).map((f, idx) => ({ ...f, sortOrder: idx })) })

    const badges: string[] = value.trustBadges ?? []
    const toggleBadge = (b: string) =>
        onChange({ trustBadges: badges.includes(b) ? badges.filter(x => x !== b) : [...badges, b] })

    return (
        <div className="space-y-4">
            {/* Hero */}
            {show("hero") && (
                <>
                    {combined && <Separator />}
                    {combined && <SectionLabel>Hero</SectionLabel>}
                    <div className="grid grid-cols-2 gap-4">
                        <ContentText label="Hero title (EN)" value={value.heroTitleEn} onChange={v => onChange({ heroTitleEn: v })} placeholder="Feel your best" />
                        <ContentText label="Hero title (AR)" dir="rtl" value={value.heroTitleAr} onChange={v => onChange({ heroTitleAr: v })} placeholder="اشعر بأفضل حال" />
                        <ContentText label="Hero subtitle (EN)" value={value.heroSubtitleEn} onChange={v => onChange({ heroSubtitleEn: v })} />
                        <ContentText label="Hero subtitle (AR)" dir="rtl" value={value.heroSubtitleAr} onChange={v => onChange({ heroSubtitleAr: v })} />
                    </div>
                    <ImageField
                        preset="hero"
                        label="Hero image"
                        value={value.heroImageUrl}
                        onChange={v => onChange({ heroImageUrl: v })}
                        altEn={value.heroImageAltEn}
                        altAr={value.heroImageAltAr}
                        onAltEnChange={v => onChange({ heroImageAltEn: v })}
                        onAltArChange={v => onChange({ heroImageAltAr: v })}
                    />
                </>
            )}

            {/* Highlight stats */}
            {show("stats") && (
                <>
                    {combined && <Separator />}
                    <div className="flex items-center justify-between">
                        <SectionLabel>Highlight stats</SectionLabel>
                        <Button type="button" variant="outline" size="sm" onClick={addStat}>
                            <Plus className="mr-2 h-4 w-4" /> Add stat
                        </Button>
                    </div>
                    {stats.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No stats yet.</p>
                    ) : (
                        stats.map((s, i) => (
                            <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-end rounded-md border p-2">
                                <ContentText label="Value" value={s.value} onChange={v => updateStat(i, { value: v })} placeholder="13K+" />
                                <ContentText label="Label (EN)" value={s.labelEn} onChange={v => updateStat(i, { labelEn: v })} placeholder="Booked" />
                                <ContentText label="Label (AR)" dir="rtl" value={s.labelAr} onChange={v => updateStat(i, { labelAr: v })} />
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeStat(i)} aria-label="Remove stat">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        ))
                    )}
                </>
            )}

            {/* Promo */}
            {show("promo") && (
                <>
                    {combined && <Separator />}
                    {combined && <SectionLabel>Promo</SectionLabel>}
                    <div className="grid grid-cols-2 gap-4">
                        <ContentText label="Promo text (EN)" value={value.promoTextEn} onChange={v => onChange({ promoTextEn: v })} placeholder="Save 20% this week" />
                        <ContentText label="Promo text (AR)" dir="rtl" value={value.promoTextAr} onChange={v => onChange({ promoTextAr: v })} />
                    </div>
                    <ContentText label="Promo code" value={value.promoCode} onChange={v => onChange({ promoCode: v })} placeholder="FEEL20" mono />
                </>
            )}

            {/* Description */}
            {show("description") && (
                <>
                    {combined && <Separator />}
                    {combined && <SectionLabel>Description</SectionLabel>}
                    <RichText label="Description (EN)" value={value.descriptionEn} onChange={v => onChange({ descriptionEn: v })} />
                    <RichText label="Description (AR)" dir="rtl" value={value.descriptionAr} onChange={v => onChange({ descriptionAr: v })} />
                </>
            )}

            {/* Info block */}
            {show("info") && (
                <>
                    {combined && <Separator />}
                    {combined && <SectionLabel>Info block</SectionLabel>}
                    <div className="grid grid-cols-2 gap-4">
                        <ContentText label="Info title (EN)" value={value.infoTitleEn} onChange={v => onChange({ infoTitleEn: v })} placeholder="How it works" />
                        <ContentText label="Info title (AR)" dir="rtl" value={value.infoTitleAr} onChange={v => onChange({ infoTitleAr: v })} />
                    </div>
                    <RichText label="Info body (EN)" value={value.infoBodyEn} onChange={v => onChange({ infoBodyEn: v })} />
                    <RichText label="Info body (AR)" dir="rtl" value={value.infoBodyAr} onChange={v => onChange({ infoBodyAr: v })} />
                    <ImageField
                        preset="hero"
                        label="Info media"
                        value={value.infoMediaUrl}
                        onChange={v => onChange({ infoMediaUrl: v })}
                        altEn={value.infoMediaAltEn}
                        altAr={value.infoMediaAltAr}
                        onAltEnChange={v => onChange({ infoMediaAltEn: v })}
                        onAltArChange={v => onChange({ infoMediaAltAr: v })}
                    />
                </>
            )}

            {/* Options */}
            {show("options") && (
                <>
                    {combined && <Separator />}
                    {combined && <SectionLabel>Options</SectionLabel>}
                    <div className="space-y-1.5">
                        <Label>Trust badges</Label>
                        <div className="flex flex-wrap gap-2">
                            {TRUST_BADGE_PRESETS.map(b => {
                                const active = badges.includes(b)
                                return (
                                    <Button
                                        key={b}
                                        type="button"
                                        variant={active ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleBadge(b)}
                                    >
                                        {TRUST_BADGE_LABEL[b] ?? b}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* FAQ */}
            {show("faq") && (
                <>
                    {combined && <Separator />}
                    <div className="flex items-center justify-between">
                        <SectionLabel>FAQ</SectionLabel>
                        <Button type="button" variant="outline" size="sm" onClick={addFaq}>
                            <Plus className="mr-2 h-4 w-4" /> Add question
                        </Button>
                    </div>
                    {faqs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No FAQ items yet.</p>
                    ) : (
                        faqs.map((f, i) => (
                            <div key={i} className="space-y-2 rounded-md border p-2">
                                <div className="flex items-center justify-between">
                                    <Badge variant="outline">#{i + 1}</Badge>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => removeFaq(i)} aria-label="Remove FAQ item">
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <ContentText label="Question (EN)" value={f.questionEn} onChange={v => updateFaq(i, { questionEn: v })} />
                                    <ContentText label="Question (AR)" dir="rtl" value={f.questionAr} onChange={v => updateFaq(i, { questionAr: v })} />
                                </div>
                                <RichText label="Answer (EN)" value={f.answerEn} onChange={v => updateFaq(i, { answerEn: v })} />
                                <RichText label="Answer (AR)" dir="rtl" value={f.answerAr} onChange={v => updateFaq(i, { answerAr: v })} />
                            </div>
                        ))
                    )}
                </>
            )}

            {/* SEO */}
            {show("seo") && (
                <>
                    {combined && <Separator />}
                    {combined && <SectionLabel>SEO</SectionLabel>}
                    <div className="grid grid-cols-2 gap-4">
                        <ContentText label="SEO title (EN)" value={value.seoTitleEn} onChange={v => onChange({ seoTitleEn: v })} />
                        <ContentText label="SEO title (AR)" dir="rtl" value={value.seoTitleAr} onChange={v => onChange({ seoTitleAr: v })} />
                    </div>
                    <ContentTextArea label="SEO description (EN)" value={value.seoDescriptionEn} onChange={v => onChange({ seoDescriptionEn: v })} />
                    <ContentTextArea label="SEO description (AR)" dir="rtl" value={value.seoDescriptionAr} onChange={v => onChange({ seoDescriptionAr: v })} />
                    <ContentText label="Canonical URL" value={value.seoCanonicalUrl} onChange={v => onChange({ seoCanonicalUrl: v })} placeholder="https://…" mono />
                    <ImageField
                        preset="og"
                        label="OG image"
                        value={value.ogImageUrl}
                        onChange={v => onChange({ ogImageUrl: v })}
                        altEn={value.ogImageAltEn}
                        altAr={value.ogImageAltAr}
                        onAltEnChange={v => onChange({ ogImageAltEn: v })}
                        onAltArChange={v => onChange({ ogImageAltAr: v })}
                    />
                </>
            )}
        </div>
    )
}
