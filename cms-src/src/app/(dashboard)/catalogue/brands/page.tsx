"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Loader2, Plus, Tag } from "lucide-react"
import { toast } from "sonner"
import { createBrand, getBrands } from "@/lib/api/products"
import type { Brand } from "@/lib/api/types"

/** BrandDto.name is a plain String OR localized — the one exception in this API. */
const brandName = (b: Brand): string =>
    typeof b.name === "string" ? b.name : b.name?.en ?? `Brand ${b.id}`

/**
 * The brand registry — `product_brands`, read live from the content service.
 *
 * Brands are catalogue MASTER data: the Identity section sends a brandId and the
 * service resolves it back to the brand object. This page is the registry's home.
 *
 * CREATION IS NOT LIVE YET, and this page says so instead of pretending. The
 * service's own OpenAPI exposes exactly one brand route (GET /brands). The create
 * form below calls the real POST anyway — flip-ready — and when the service
 * answers "no endpoint", the brand is held in a clearly-badged local list that is
 * NEVER offered to the listing editor's brand picker: a locally-invented brandId
 * saved onto a real product would be a dangling reference in product_master.
 */
export default function BrandsPage() {
    const [brands, setBrands] = useState<Brand[] | null>(null)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [pending, setPending] = useState<{ name: string; logo?: string }[]>([])
    const [name, setName] = useState("")
    const [logo, setLogo] = useState("")
    const [creating, setCreating] = useState(false)

    const load = () => {
        setLoadError(null)
        getBrands()
            .then(setBrands)
            .catch(e => setLoadError(e instanceof Error ? e.message : "Could not load brands"))
    }
    useEffect(load, [])

    const create = async () => {
        const trimmed = name.trim()
        if (!trimmed) { toast.error("A brand needs a name"); return }
        if (brands?.some(b => brandName(b).toLowerCase() === trimmed.toLowerCase())
            || pending.some(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
            toast.error(`"${trimmed}" already exists`)
            return
        }
        setCreating(true)
        try {
            // The real POST, so this starts working the day the endpoint ships.
            const created = await createBrand({ name: trimmed, logo: logo.trim() || undefined })
            setBrands(prev => [...(prev ?? []), created])
            toast.success(`Brand "${trimmed}" created`)
            setName(""); setLogo("")
        } catch {
            // Today's answer: the endpoint does not exist. Hold it locally, visibly.
            setPending(prev => [...prev, { name: trimmed, logo: logo.trim() || undefined }])
            toast.warning(`"${trimmed}" saved locally — the service has no create-brand endpoint yet`, {
                description: "It will NOT appear in the listing editor's brand picker until the API ships and it is re-created for real.",
            })
            setName(""); setLogo("")
        } finally {
            setCreating(false)
        }
    }

    return (
        <div className="space-y-5 pb-16">
            <div className="max-w-3xl space-y-1">
                <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                    <Tag className="h-5 w-5 text-primary" /> Brands
                </h2>
                <p className="text-sm text-muted-foreground">
                    The brand registry (<code className="text-xs">product_brands</code>). Listings reference a
                    brand by id in their Identity section; the registry is the only place brands are authored.
                </p>
            </div>

            {/* ── create ── */}
            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-base">New brand</CardTitle>
                    <CardDescription>
                        Name is a plain string — brand names are not translated. Logo is optional.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-end gap-3 pt-0">
                    <div className="w-64 space-y-1">
                        <Label className="text-xs">Name</Label>
                        <Input className="h-9 text-xs" value={name} placeholder="e.g. Valeo Nutrition"
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") void create() }} />
                    </div>
                    <div className="w-80 space-y-1">
                        <Label className="text-xs">Logo URL (optional)</Label>
                        <Input className="h-9 text-xs" value={logo} placeholder="https://…"
                            onChange={e => setLogo(e.target.value)} />
                    </div>
                    <Button size="sm" className="h-9" onClick={() => void create()} disabled={creating}>
                        {creating
                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</>
                            : <><Plus className="mr-2 h-4 w-4" /> Create brand</>}
                    </Button>
                </CardContent>
            </Card>

            {/* ── the registry, live ── */}
            <Card>
                <CardHeader className="py-3">
                    <CardTitle className="text-base">
                        Registry {brands ? `(${brands.length})` : ""}
                    </CardTitle>
                    <CardDescription>Live from the content service — GET /brands.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    {loadError && (
                        <div className="flex flex-col items-start gap-2 rounded-md border border-amber-200 bg-amber-50/50 p-3">
                            <p className="flex items-center gap-1.5 text-xs text-amber-900">
                                <AlertTriangle className="h-3.5 w-3.5" /> {loadError}
                            </p>
                            <p className="text-[11px] text-amber-900/80">
                                No mock rows stand in for the registry — an invented brand id saved onto a
                                real product is exactly what this page must never cause.
                            </p>
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={load}>Retry</Button>
                        </div>
                    )}
                    {!loadError && brands === null && (
                        <p className="text-xs text-muted-foreground">Loading…</p>
                    )}
                    {!loadError && brands?.length === 0 && (
                        <p className="text-xs text-muted-foreground">No brands yet.</p>
                    )}
                    {!loadError && !!brands?.length && (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                            {brands.map(b => (
                                <div key={b.id} className="flex items-center gap-3 rounded-md border p-2.5">
                                    {b.logo ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={b.logo} alt="" className="h-8 w-8 shrink-0 rounded object-contain" />
                                    ) : (
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-muted text-[10px] font-semibold">
                                            {brandName(b).slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="truncate text-xs font-medium">{brandName(b)}</p>
                                        <p className="text-[10px] text-muted-foreground">id {b.id}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* ── locally-held creations, quarantined and labelled ── */}
            {pending.length > 0 && (
                <Card className="border-amber-200">
                    <CardHeader className="py-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            Awaiting the create endpoint ({pending.length})
                        </CardTitle>
                        <CardDescription>
                            Held locally because the service has no POST /brands yet. These have no real id,
                            are not in the listing editor&apos;s brand picker, and are lost on reload — this
                            list is a to-do for the day the API ships, not storage.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2 pt-0">
                        {pending.map(p => (
                            <Badge key={p.name} variant="outline"
                                className="border-amber-200 bg-amber-50 text-[11px] text-amber-800">
                                {p.name}
                            </Badge>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
