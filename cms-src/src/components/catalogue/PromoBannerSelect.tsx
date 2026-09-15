"use client"

import Link from "next/link"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Megaphone, ArrowUpRight } from "lucide-react"
import { PromoBanner } from "@/types"

const NONE = "__none__"

/**
 * Small reusable control to attach a reusable Promo Banner (with coupon) to a
 * catalogue entity (listing / category / sub-category). Shows a Select of the
 * active banners (labelled by name + coupon), a "— None —" option, and a link
 * to manage the library. Bind `value` to the entity's `promoBannerId`.
 */
export function PromoBannerSelect({
    banners,
    value,
    onChange,
    label = "Promo Banner",
    description = "Attach a reusable promotional banner with a coupon. Manage the library to add or edit banners.",
}: {
    banners: PromoBanner[]
    value?: string
    onChange: (id: string | undefined) => void
    label?: string
    description?: string
}) {
    const active = banners.filter(b => b.isActive)
    // Keep a currently-attached-but-inactive banner selectable so it still shows.
    const selected = value ? banners.find(b => b.id === value) : undefined
    const options = selected && !selected.isActive ? [selected, ...active] : active

    const bannerLabel = (b: PromoBanner) =>
        b.couponCode ? `${b.name} · ${b.couponCode}` : b.name

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5">
                    <Megaphone className="h-3.5 w-3.5 text-muted-foreground" /> {label}
                </Label>
                <Link
                    href="/catalogue/promo-banners"
                    className="flex items-center gap-0.5 text-xs text-primary hover:underline"
                >
                    Manage promo banners <ArrowUpRight className="h-3 w-3" />
                </Link>
            </div>
            <Select
                value={value ?? NONE}
                onValueChange={v => onChange(v === NONE ? undefined : v)}
            >
                <SelectTrigger><SelectValue placeholder="— None —" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value={NONE}>— None —</SelectItem>
                    {options.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                            {bannerLabel(b)}{!b.isActive ? " (inactive)" : ""}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {description && <p className="text-[11px] text-muted-foreground">{description}</p>}
        </div>
    )
}
