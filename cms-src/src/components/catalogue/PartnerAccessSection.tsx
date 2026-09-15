"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Trash2, Plus, Handshake, ChevronDown, ChevronRight } from "lucide-react"
import { ImageField } from "@/components/catalogue/ImageField"
import { CataloguePartner, PartnerAccessEntry, PartnerAccessType, PartnerPrice, City, Country } from "@/types"

const COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT", "OTHERS"]

// Reusable B2B partner-access assignment — used on Listing, Category, Sub-category
// and Journey editors. Grants a partner Owner/Viewer access to the entity.
// On listings (enableOverrides) it also carries per-partner exclusivity, an image
// override, and variant/city/country-level price overrides.
export function PartnerAccessSection({
    partners,
    value,
    onChange,
    variants,
    cities,
    enableOverrides,
}: {
    partners: CataloguePartner[]
    value: PartnerAccessEntry[]
    onChange: (v: PartnerAccessEntry[]) => void
    /** variant options for per-variant pricing (listing editor only) */
    variants?: { id: string; label: string }[]
    /** city options for per-city pricing (listing editor only) */
    cities?: City[]
    /** enable image-override + pricing overrides per partner */
    enableOverrides?: boolean
}) {
    const [addId, setAddId] = useState("")
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const assigned = new Set(value.map(v => v.partnerId))
    const available = partners.filter(p => !assigned.has(p.id))
    const partnerName = (id: string) => partners.find(p => p.id === id)?.name ?? id

    const add = () => {
        if (!addId) return
        onChange([...value, { partnerId: addId, accessType: "viewer" }])
        setExpanded(e => ({ ...e, [addId]: true }))
        setAddId("")
    }
    const patchEntry = (id: string, patch: Partial<PartnerAccessEntry>) =>
        onChange(value.map(e => (e.partnerId === id ? { ...e, ...patch } : e)))
    const remove = (id: string) => onChange(value.filter(e => e.partnerId !== id))

    // ── per-partner pricing rows ──
    const addPrice = (id: string, pricing: PartnerPrice[]) =>
        patchEntry(id, { pricing: [...pricing, { price: 0, discountType: undefined }] })
    const updatePrice = (id: string, pricing: PartnerPrice[], i: number, patch: Partial<PartnerPrice>) =>
        patchEntry(id, { pricing: pricing.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) })
    const removePrice = (id: string, pricing: PartnerPrice[], i: number) =>
        patchEntry(id, { pricing: pricing.filter((_, idx) => idx !== i) })

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Select value={addId} onValueChange={setAddId}>
                    <SelectTrigger className="h-9 w-64"><SelectValue placeholder="Add a partner…" /></SelectTrigger>
                    <SelectContent>
                        {available.length === 0 ? (
                            <div className="px-2 py-1.5 text-xs text-muted-foreground">All partners added</div>
                        ) : (
                            available.map(p => (
                                <SelectItem key={p.id} value={p.id}>{`${p.name} · ${p.code}`}</SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={add} disabled={!addId}>
                    <Plus className="mr-1 h-4 w-4" /> Add partner
                </Button>
            </div>

            {value.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                    <Handshake className="h-4 w-4" /> No partners assigned — visible per normal visibility rules.
                </div>
            ) : (
                <div className="space-y-2">
                    {value.map(e => {
                        const partner = partners.find(p => p.id === e.partnerId)
                        const pricing = e.pricing ?? []
                        const isOpen = !!expanded[e.partnerId]
                        return (
                            <div key={e.partnerId} className="rounded-md border">
                                <div className="flex items-center gap-3 p-2.5">
                                    {enableOverrides && (
                                        <button
                                            type="button"
                                            onClick={() => setExpanded(x => ({ ...x, [e.partnerId]: !isOpen }))}
                                            className="text-muted-foreground hover:text-foreground"
                                        >
                                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </button>
                                    )}
                                    <div className="flex-1">
                                        <span className="text-sm font-medium">{partnerName(e.partnerId)}</span>
                                        {partner?.countries && partner.countries.length > 0 && (
                                            <span className="ml-2 text-[11px] text-muted-foreground">· {partner.countries.join(", ")}</span>
                                        )}
                                    </div>
                                    <Select value={e.accessType} onValueChange={v => patchEntry(e.partnerId, { accessType: v as PartnerAccessType })}>
                                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="owner">Owner</SelectItem>
                                            <SelectItem value="viewer">Viewer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(e.partnerId)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {enableOverrides && isOpen && (
                                    <div className="space-y-5 border-t bg-muted/20 p-3">
                                        {/* Image override */}
                                        <div className="space-y-2">
                                            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Image override</Label>
                                            <ImageField
                                                preset="square"
                                                value={e.imageOverrideUrl}
                                                onChange={url => patchEntry(e.partnerId, { imageOverrideUrl: url })}
                                                altEn={e.imageOverrideAltEn}
                                                altAr={e.imageOverrideAltAr}
                                                onAltEnChange={v => patchEntry(e.partnerId, { imageOverrideAltEn: v })}
                                                onAltArChange={v => patchEntry(e.partnerId, { imageOverrideAltAr: v })}
                                            />
                                        </div>

                                        {/* Pricing overrides */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Price overrides</Label>
                                                <Button size="sm" variant="outline" onClick={() => addPrice(e.partnerId, pricing)}>
                                                    <Plus className="mr-1 h-3.5 w-3.5" /> Add price
                                                </Button>
                                            </div>
                                            {pricing.length === 0 ? (
                                                <p className="text-xs text-muted-foreground">No overrides — the partner pays standard price.</p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {pricing.map((p, i) => {
                                                        const cityOptions = (cities ?? []).filter(c => !p.country || c.country === p.country)
                                                        return (
                                                            <div key={i} className="flex flex-wrap items-end gap-2 rounded-md border bg-background p-2">
                                                                {variants && variants.length > 0 && (
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] text-muted-foreground">Variant</Label>
                                                                        <Select value={p.variantId ?? "all"} onValueChange={v => updatePrice(e.partnerId, pricing, i, { variantId: v === "all" ? undefined : v })}>
                                                                            <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="all">All variants</SelectItem>
                                                                                {variants.map(v => <SelectItem key={v.id} value={v.id}>{v.label}</SelectItem>)}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                )}
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] text-muted-foreground">Country</Label>
                                                                    <Select value={p.country ?? "all"} onValueChange={v => updatePrice(e.partnerId, pricing, i, { country: v === "all" ? undefined : v as Country, cityId: undefined })}>
                                                                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="all">All countries</SelectItem>
                                                                            {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] text-muted-foreground">City</Label>
                                                                    <Select value={p.cityId ?? "all"} onValueChange={v => updatePrice(e.partnerId, pricing, i, { cityId: v === "all" ? undefined : v })}>
                                                                        <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="all">All cities</SelectItem>
                                                                            {cityOptions.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] text-muted-foreground">Price</Label>
                                                                    <Input type="number" className="h-8 w-24 text-xs" value={p.price} onChange={ev => updatePrice(e.partnerId, pricing, i, { price: Number(ev.target.value) })} />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <Label className="text-[10px] text-muted-foreground">Discount</Label>
                                                                    <Select value={p.discountType ?? "none"} onValueChange={v => updatePrice(e.partnerId, pricing, i, { discountType: v === "none" ? undefined : v as "percentage" | "fixed" })}>
                                                                        <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="none">None</SelectItem>
                                                                            <SelectItem value="percentage">Percentage</SelectItem>
                                                                            <SelectItem value="fixed">Fixed</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                {p.discountType && (
                                                                    <div className="space-y-1">
                                                                        <Label className="text-[10px] text-muted-foreground">Value</Label>
                                                                        <Input type="number" className="h-8 w-20 text-xs" value={p.discountValue ?? ""} onChange={ev => updatePrice(e.partnerId, pricing, i, { discountValue: ev.target.value ? Number(ev.target.value) : undefined })} />
                                                                    </div>
                                                                )}
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removePrice(e.partnerId, pricing, i)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
