"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Plus, Trash, Layers, ChevronRight, Undo2 } from "lucide-react"
import { City, Country, ProductVariant, VariantOption, VariantSessionPack } from "@/types"
import { comboLabel, variantsAnsweringInactive } from "@/lib/catalogue"
import { NumCell } from "@/components/catalogue/NumCell"
import { MONEY } from "@/lib/composition"

/**
 * ── Session Packs — ladders ───────────────────────────────────────────────────
 *
 * `variant_session_packs` (D-C59). A pack ("Pack of 3", physio ×5) is a real
 * `product_variants` row priced by ordinary city rows — "packs inherit uid, translations,
 * media, ERP identity, status, audit BY BEING VARIANTS."
 *
 * A LADDER IS THE GROUP OF PACKS OF ONE SIZE, and it is where editing happens. The
 * measured variation is across pack SIZES, not across the base variants of one size:
 * Hydration Express runs its 3-pack weekly (offsets 0/7/14) and its 5-pack daily
 * (0/1/2/3/4), while nothing suggests a 250 mg 3-pack spaces differently from a 500 mg
 * 3-pack of the same drip. Editing per member asked for 3 fields × N members — 108 inputs
 * for 12 variants across 3 ladders — to express what is nearly always 3 decisions.
 *
 * ⚠️ THE GROUPING IS PRESENTATIONAL. There is no ladder table and there must not be one:
 * D-C61 moved `session_interval_days` DOWN onto each pack precisely so two packs of one
 * formula CAN differ. A settings edit therefore writes N independent satellite rows, and
 * when they disagree the header says so rather than showing one value as if it governed
 * them. Divergence is a state to see, not a bug to prevent.
 */

interface Props {
    variants: ProductVariant[]
    variantOptions: VariantOption[]
    cities: City[]
    onCreatePacks: (packs: { baseVariantId: string; pack: VariantSessionPack }[]) => void
    /** Patch the satellite on many packs at once — a ladder edit is ONE action. */
    onUpdatePacks: (variantIds: string[], patch: Partial<VariantSessionPack>) => void
    onDeletePacks: (variantIds: string[]) => void
    onRestore?: (variants: ProductVariant[]) => void
    onGoToPricing?: () => void
    /** Countries the listing sells in — a pack price is per (variant, city) like any other. */
    countries: Country[]
    /** Write a pack's own city price. The PRICE is authored; the % is read back off it. */
    onSetPackPrice: (variantId: string, cityId: string, country: Country, price: number | null, retail: number) => void
    /**
     * Same rows, each family's own words. "Pack of {n}" is a RENDER TEMPLATE, never a
     * stored label — which is exactly what lets home care call the same
     * `variant_session_packs` row a "{n}-day plan": a babysitting session IS a day of
     * care, and nobody sells a parent a "Pack of 20".
     */
    family?: "treatments" | "homecare"
}

const agree = <T,>(xs: T[]) => new Set(xs).size <= 1
/** The shared value when a group agrees. `undefined` is itself a value here. */
const one = <T,>(xs: T[]) => (new Set(xs).size === 1 ? xs[0] : undefined)

export function SessionPacks({
    variants, variantOptions, cities, countries,
    onCreatePacks, onUpdatePacks, onDeletePacks, onRestore, onGoToPricing, onSetPackPrice,
    family = "treatments",
}: Props) {
    const hcMode = family === "homecare"
    const groupTitle = (n: number) => hcMode ? `${n}-day plan` : `Pack of ${n}`
    const unitLabel = hcMode ? "Days" : "Sessions"
    const bookingCopy = hcMode ? "schedule chosen at booking" : "customer books each session"
    const addLabel = hcMode ? "Add a plan" : "Add a ladder"
    const [openGroup, setOpenGroup] = useState<number | null>(null)
    const [adding, setAdding] = useState(false)
    const [newSessions, setNewSessions] = useState(3)
    const [undo, setUndo] = useState<{ label: string; snapshot: ProductVariant[] } | null>(null)
    /**
     * ONE COUNTRY AT A TIME, like every other pricing surface here. The per-city rows used
     * to list every country's cities in one column, so a UAE manager scrolled past KSA to
     * reach Ajman and could mistype into a market they do not run. Country is also the only
     * scope where "AED" means anything.
     */
    const [country, setCountry] = useState<Country | null>(null)
    const active = country && countries.includes(country) ? country : countries[0]

    const snap = (label: string) => setUndo({ label, snapshot: variants })

    const inactiveAxis = variantsAnsweringInactive(variants, variantOptions)
    // A pack of a pack is refused (D-C59 governance). A variant answering a switched-off
    // axis value is excluded too — a pack over an unsellable base is born unsellable.
    const bases = variants.filter(v => !v.sessionPack && !inactiveAxis.includes(v.id))
    const label = (v: ProductVariant) =>
        comboLabel(v.optionValues, variantOptions) || v.variantLabelEn || v.nameEn || "Unnamed"

    const ladders: [number, ProductVariant[]][] = (() => {
        const m = new Map<number, ProductVariant[]>()
        variants.filter(v => v.sessionPack).forEach(v => {
            const n = v.sessionPack!.sessions
            m.set(n, [...(m.get(n) ?? []), v])
        })
        return [...m.entries()].sort((a, b) => a[0] - b[0])
    })()
    const sizes = new Set(ladders.map(([n]) => n))

    /** `uk_vsp_base_sessions` — at most one pack per (base, sessions). */
    const packFor = (baseId: string, n: number) =>
        variants.find(v => v.sessionPack?.baseVariantId === baseId && v.sessionPack.sessions === n)

    const pricedCityCount = (v: ProductVariant) =>
        (v.regionalData ?? []).reduce(
            (t, r) => t + (r.cityPrices ?? []).filter(c => c.price > 0).length, 0)

    /**
     * The base's priced cities — a pack can only be priced where its base is, because
     * `retail = sessions × base selling` and that is also the D-C59 write-time ceiling.
     */
    const basePrices = (base: ProductVariant) => {
        const out: { cityId: string; name: string; country: Country; unit: number }[] = []
        ;(base.regionalData ?? []).forEach(r => {
            if (!countries.includes(r.country)) return
            (r.cityPrices ?? []).forEach(cp => {
                if (!cp.price) return
                out.push({
                    cityId: cp.cityId, name: cities.find(c => c.id === cp.cityId)?.name ?? cp.cityId,
                    country: r.country, unit: cp.price,
                })
            })
        })
        return out
    }
    const packPrice = (pack: ProductVariant, cityId: string) => {
        for (const r of pack.regionalData ?? []) {
            const hit = r.cityPrices?.find(c => c.cityId === cityId)
            if (hit) return hit.price
        }
        return undefined
    }

    return (
        <div className="space-y-4">
            {/* Scopes every sheet below. A pack price is a `product_pricing` row like any
                other, so it is priced in one currency at a time — and the manager who sets
                UAE is not the one who sets KSA. */}
            {countries.length > 1 && (
                <div className="flex items-center gap-2">
                    <div className="flex overflow-hidden rounded border">
                        {countries.map(c => (
                            <button key={c} type="button"
                                className={`px-2.5 py-1 text-[11px] ${active === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                                onClick={() => setCountry(c)}>
                                {c} <span className="font-mono opacity-70">{MONEY[c].code}</span>
                            </button>
                        ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                        Prices below are {active} only. Settings — interval, validity, intended % —
                        are on the pack itself and apply everywhere.
                    </span>
                </div>
            )}

            {undo && onRestore && (
                <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5">
                    <span className="text-[11px] text-muted-foreground">{undo.label}</span>
                    <Button size="sm" variant="outline" className="ml-auto h-6 px-2 text-[10px]"
                        onClick={() => { onRestore(undo.snapshot); setUndo(null) }}>
                        <Undo2 className="mr-1 h-3 w-3" /> Undo
                    </Button>
                </div>
            )}

            {bases.length === 0 && (
                <div className="rounded-lg border-2 border-dashed bg-muted/10 py-10 text-center">
                    <p className="text-sm font-medium text-muted-foreground">No variants to build a pack on.</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Generate variants from the axes first — a pack points at a base variant, so
                        there is nothing to be a pack of.
                    </p>
                </div>
            )}

            {ladders.map(([n, packs]) => {
                const sps = packs.map(p => p.sessionPack!)
                const intervals = sps.map(x => x.sessionIntervalDays)
                const validities = sps.map(x => x.validityDays)
                const intents = sps.map(x => x.intendedDiscountPct)
                const uniform = agree(intervals) && agree(validities) && agree(intents)
                const iv = one(intervals), vd = one(validities), ip = one(intents)
                const ids = packs.map(p => p.id)
                const members = packs.length
                const settings: VariantSessionPack = {
                    baseVariantId: "", sessions: n,
                    sessionIntervalDays: iv, validityDays: vd, intendedDiscountPct: ip,
                }
                const isOpen = openGroup === n
                const summary = [
                    agree(intervals)
                        ? (iv === undefined ? bookingCopy : `every ${iv} days`)
                        : "interval varies",
                    agree(validities) ? (vd === undefined ? "no expiry" : `valid ${vd}d`) : "validity varies",
                    agree(intents) ? (ip === undefined ? "no intended %" : `intended −${ip}%`) : "intent varies",
                ].join(" · ")

                return (
                    <Card key={n} className="border-violet-200">
                        <CardHeader className="cursor-pointer py-2.5"
                            onClick={() => setOpenGroup(isOpen ? null : n)}>
                            <div className="flex items-center gap-2">
                                <ChevronRight className={`h-4 w-4 shrink-0 text-violet-500 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                                <Layers className="h-3.5 w-3.5 text-violet-600" />
                                <CardTitle className="text-sm">{groupTitle(n)}</CardTitle>
                                <span className="text-[11px] text-muted-foreground">
                                    {members} of {bases.length} variants
                                </span>
                                <span className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    {summary}
                                    {!uniform && (
                                        <span className="rounded bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
                                            some set individually
                                        </span>
                                    )}
                                </span>
                            </div>
                        </CardHeader>

                        {isOpen && (
                            <CardContent className="space-y-3 pt-0">
                                {/* ── settings, edited once for the whole ladder ────────── */}
                                <div className="rounded-md border bg-violet-50/30 p-2.5">
                                    <div className="flex flex-wrap items-end gap-3">
                                        <div className="space-y-0.5">
                                            <Label className="text-[10px] text-muted-foreground">Days between visits</Label>
                                            <Input type="number" className="h-7 w-28 text-xs"
                                                value={iv ?? ""}
                                                placeholder={agree(intervals) ? "customer books" : "varies"}
                                                onChange={e => {
                                                    snap(`Interval set on ${members} pack${members === 1 ? "" : "s"} of ${n}`)
                                                    onUpdatePacks(ids, {
                                                        sessionIntervalDays: e.target.value === "" ? undefined : Number(e.target.value),
                                                    })
                                                }} />
                                        </div>
                                        <div className="flex items-center gap-1.5 pb-1.5">
                                            <Switch checked={agree(intervals) && iv === undefined}
                                                onCheckedChange={c => {
                                                    snap(`Booking mode set on ${members} pack${members === 1 ? "" : "s"} of ${n}`)
                                                    onUpdatePacks(ids, { sessionIntervalDays: c ? undefined : 7 })
                                                }} />
                                            <span className="text-[10px] text-muted-foreground">{bookingCopy}</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <Label className="text-[10px] text-muted-foreground">Valid (days)</Label>
                                            <Input type="number" className="h-7 w-24 text-xs"
                                                value={vd ?? ""}
                                                placeholder={agree(validities) ? "no expiry" : "varies"}
                                                onChange={e => {
                                                    snap(`Validity set on ${members} pack${members === 1 ? "" : "s"} of ${n}`)
                                                    onUpdatePacks(ids, {
                                                        validityDays: e.target.value === "" ? undefined : Number(e.target.value),
                                                    })
                                                }} />
                                        </div>
                                        <div className="space-y-0.5">
                                            <Label className="text-[10px] text-muted-foreground">Intended %</Label>
                                            <Input type="number" className="h-7 w-24 text-xs"
                                                value={ip ?? ""}
                                                placeholder={agree(intents) ? "—" : "varies"}
                                                onChange={e => {
                                                    snap(`Intended % set on ${members} pack${members === 1 ? "" : "s"} of ${n}`)
                                                    onUpdatePacks(ids, {
                                                        intendedDiscountPct: e.target.value === "" ? undefined : Number(e.target.value),
                                                    })
                                                }} />
                                        </div>
                                        <Button variant="ghost" size="sm"
                                            className="ml-auto h-7 px-2 text-[10px] text-destructive"
                                            onClick={() => {
                                                snap(`Deleted the pack of ${n} ladder (${members} variant${members === 1 ? "" : "s"})`)
                                                onDeletePacks(ids)
                                            }}>
                                            <Trash className="mr-1 h-3 w-3" /> Delete ladder
                                        </Button>
                                    </div>
                                    <p className="mt-1.5 text-[10px] text-muted-foreground">
                                        Editing here writes all {members} pack{members === 1 ? "" : "s"} at
                                        once. Each is still its own row, so they may differ — this
                                        sets them together.
                                    </p>
                                </div>

                                {/* ── membership: one control, not a second form ──────────
                                    ABOVE the per-variant blocks, not below them. It used to be
                                    last, so choosing which variants get a pack of N meant
                                    scrolling past every existing member's settings AND prices —
                                    the one control you reach for most often was the furthest
                                    away. The order now runs coarse to fine, the same as
                                    Multi-buy Tiers: what a pack of N is, who gets one, then
                                    where one of them differs. */}
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Label className="text-[11px]">Applies to</Label>
                                        {bases.length > 1 && (
                                            <button type="button"
                                                className="rounded border px-1.5 py-px text-[10px] text-muted-foreground hover:bg-muted"
                                                onClick={() => {
                                                    const missing = bases.filter(b => !packFor(b.id, n))
                                                    if (missing.length > 0) {
                                                        snap(`Added ${missing.length} variant${missing.length === 1 ? "" : "s"} to pack of ${n}`)
                                                        onCreatePacks(missing.map(b => ({
                                                            baseVariantId: b.id,
                                                            pack: { ...settings, baseVariantId: b.id, sessions: n },
                                                        })))
                                                    } else {
                                                        snap(`Removed all ${members} variants from pack of ${n}`)
                                                        onDeletePacks(ids)
                                                    }
                                                }}>
                                                {bases.every(b => packFor(b.id, n)) ? "clear all" : `select all ${bases.length}`}
                                            </button>
                                        )}
                                    </div>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        {bases.map(b => {
                                            const existing = packFor(b.id, n)
                                            const priced = pricedCityCount(b)
                                            return (
                                                <button key={b.id} type="button"
                                                    title={priced === 0
                                                        ? "Not priced yet — the pack is created without prices"
                                                        : `Priced in ${priced} ${priced === 1 ? "city" : "cities"} — the pack seeds from those`}
                                                    className={`rounded border px-2 py-1 text-[10px] ${
                                                        existing ? "border-primary bg-primary text-primary-foreground"
                                                            : "text-muted-foreground hover:bg-muted"}`}
                                                    onClick={() => {
                                                        if (existing) {
                                                            snap(`Removed ${label(b)} from pack of ${n}`)
                                                            onDeletePacks([existing.id])
                                                        } else {
                                                            snap(`Added ${label(b)} to pack of ${n}`)
                                                            onCreatePacks([{
                                                                baseVariantId: b.id,
                                                                pack: { ...settings, baseVariantId: b.id, sessions: n },
                                                            }])
                                                        }
                                                    }}>
                                                    {label(b)}
                                                    {!existing && priced === 0 && <span className="ml-1 opacity-60">unpriced</span>}
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                        Ticking mints a pack variant and seeds its prices from the base;
                                        unticking deletes that variant and its price rows.
                                    </p>
                                </div>

                                {/* ── the members, as a sheet ───────────────────────────
                                    Rows are the pack variants on this ladder; columns are the
                                    cities their bases are priced in. It was a stack of blocks —
                                    settings, then one line per city, per member — which for nine
                                    UAE cities and four members was thirty-six lines you scrolled
                                    through to compare two numbers. Prices only mean anything next
                                    to their neighbours, which is what a sheet is for.

                                    The three per-pack settings stay ON the row rather than moving
                                    to the group: D-C61 put `session_interval_days` on each pack
                                    precisely so two packs of one formula can differ, and a layout
                                    that can only set them together cannot express that. */}
                                {(() => {
                                    const cols = (() => {
                                        const ids = new Set<string>()
                                        packs.forEach(p => {
                                            const b = variants.find(x => x.id === p.sessionPack!.baseVariantId)
                                            if (b) basePrices(b).filter(r => r.country === active)
                                                .forEach(r => ids.add(r.cityId))
                                        })
                                        return cities.filter(c => ids.has(c.id))
                                    })()
                                    if (!active || cols.length === 0) {
                                        return (
                                            <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
                                                <p className="flex-1 text-[10px] text-muted-foreground">
                                                    No member&rsquo;s base is priced in {active ?? "any country"} yet, so there
                                                    is nothing to price a pack against — a pack&rsquo;s price is derived from
                                                    its base&rsquo;s, city by city.
                                                </p>
                                                {onGoToPricing && (
                                                    <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs"
                                                        onClick={onGoToPricing}>
                                                        Price the bases
                                                    </Button>
                                                )}
                                            </div>
                                        )
                                    }
                                    const cur = MONEY[active].code
                                    return (
                                        <div className="max-h-[52vh] overflow-auto rounded-md border">
                                            <table className="border-collapse text-[11px]">
                                                <thead>
                                                    <tr>
                                                        <th className="sticky left-0 top-0 z-30 border-b border-r-2 bg-muted px-2 py-1 text-left font-medium">
                                                            Variant
                                                        </th>
                                                        {["Days between", "Valid", "Intended %"].map(h => (
                                                            <th key={h} className="sticky top-0 z-20 border-b border-l bg-muted px-1 py-1 text-center text-[9px] font-normal text-muted-foreground">
                                                                {h}
                                                            </th>
                                                        ))}
                                                        <th className="sticky top-0 z-20 border-b border-l border-r-2 bg-muted px-1 py-1 text-center text-[9px] font-normal text-muted-foreground">
                                                            all
                                                        </th>
                                                        {cols.map(c => (
                                                            <th key={c.id} className="sticky top-0 z-20 border-b border-l bg-muted px-2 py-1 text-center font-normal text-muted-foreground">
                                                                {c.name}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {packs.map(p => {
                                                        const base = variants.find(x => x.id === p.sessionPack!.baseVariantId)
                                                        const sp = p.sessionPack!
                                                        const odd = sp.sessionIntervalDays !== iv
                                                            || sp.validityDays !== vd || sp.intendedDiscountPct !== ip
                                                        const pct = sp.intendedDiscountPct
                                                        const rows = base ? basePrices(base).filter(r => r.country === active) : []
                                                        const unitIn = (cityId: string) => rows.find(r => r.cityId === cityId)?.unit
                                                        return (
                                                            <tr key={p.id} className="border-b last:border-0">
                                                                <td className={`sticky left-0 z-10 whitespace-nowrap border-r-2 bg-background px-2 py-1 font-medium ${odd && !uniform ? "border-l-2 border-l-primary" : ""}`}>
                                                                    {base ? label(base) : "base missing"}
                                                                    {odd && !uniform && (
                                                                        <span className="ml-1.5 text-[9px] font-normal text-muted-foreground">
                                                                            set individually
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                {([
                                                                    ["sessionIntervalDays", sp.sessionIntervalDays, hcMode ? "at booking" : "customer books"],
                                                                    ["validityDays", sp.validityDays, "none"],
                                                                    ["intendedDiscountPct", sp.intendedDiscountPct, "—"],
                                                                ] as const).map(([field, val, ph]) => (
                                                                    <td key={field} className="border-l px-0.5 py-0.5 text-center">
                                                                        <Input type="number" className="h-6 w-16 text-[11px]"
                                                                            value={val ?? ""} placeholder={ph}
                                                                            onChange={e => {
                                                                                snap(`${base ? label(base) : "One pack"} — ${field} set`)
                                                                                onUpdatePacks([p.id], {
                                                                                    [field]: e.target.value === "" ? undefined : Number(e.target.value),
                                                                                } as Partial<VariantSessionPack>)
                                                                            }} />
                                                                    </td>
                                                                ))}
                                                                <td className="border-l border-r-2 px-1 py-0.5 text-center">
                                                                    <button type="button"
                                                                        className="rounded border border-primary/40 bg-primary/10 px-1.5 py-1 text-[9px] font-medium text-primary hover:bg-primary/20 disabled:opacity-40"
                                                                        disabled={rows.length === 0}
                                                                        title={`Set every ${active} city to ${n} × its single${pct ? `, less ${pct}%` : ""}`}
                                                                        onClick={() => {
                                                                            snap(`Filled ${base ? label(base) : "pack"} prices at ${pct ?? 0}% off`)
                                                                            // ONE call per city is safe here only because the
                                                                            // page's setVariants takes a functional updater;
                                                                            // before that fix this loop wrote nine cities and
                                                                            // kept the last.
                                                                            rows.forEach(r => {
                                                                                const retail = r.unit * n
                                                                                const seeded = pct === undefined
                                                                                    ? retail
                                                                                    : Math.round(retail * (1 - pct / 100) * 100) / 100
                                                                                onSetPackPrice(p.id, r.cityId, r.country, seeded, retail)
                                                                            })
                                                                        }}>
                                                                        = ×{n}
                                                                    </button>
                                                                </td>
                                                                {cols.map(c => {
                                                                    const unit = unitIn(c.id)
                                                                    if (unit === undefined) {
                                                                        return (
                                                                            <td key={c.id} className="border-l px-0.5 py-0.5 text-right align-top">
                                                                                <div className="ml-auto w-20">
                                                                                    <div className="border border-transparent px-1 py-0.5 text-right text-muted-foreground"
                                                                                        title={`${base ? label(base) : "The base"} is not sold in ${c.name}`}>·</div>
                                                                                    <div className="border border-transparent px-1 text-right text-[9px] leading-tight">&nbsp;</div>
                                                                                </div>
                                                                            </td>
                                                                        )
                                                                    }
                                                                    const retail = unit * n
                                                                    const price = packPrice(p, c.id)
                                                                    const off = price === undefined || retail === 0
                                                                        ? undefined
                                                                        : Math.round((1 - price / retail) * 1000) / 10
                                                                    const drift = off !== undefined && pct !== undefined
                                                                        && Math.abs(off - pct) > 0.5
                                                                    return (
                                                                        <td key={c.id} className="border-l px-0.5 py-0.5 text-right align-top">
                                                                            <div className="ml-auto w-20"
                                                                                title={`${n} × ${unit.toLocaleString()} = ${retail.toLocaleString()} ${cur}`
                                                                                    + (drift ? ` · intended ${pct}%` : "")}>
                                                                                {/* Commits on blur — the D-C59 ceiling clamps
                                                                                    down to N × the single, which on each keystroke
                                                                                    would cap a partial number and then be typed
                                                                                    into again. */}
                                                                                <NumCell value={price} placeholder="·"
                                                                                    className="w-full rounded border bg-white px-1 py-0.5 text-right tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                                                                                    onCommit={raw => {
                                                                                        if (raw === "") {
                                                                                            snap(`${c.name} pack price cleared`)
                                                                                            onSetPackPrice(p.id, c.id, active, null, retail)
                                                                                            return
                                                                                        }
                                                                                        const val = Math.min(Number(raw), retail)
                                                                                        snap(`${c.name} pack price set`)
                                                                                        onSetPackPrice(p.id, c.id, active, val, retail)
                                                                                    }} />
                                                                                {/* The ×N total and the discount it implies, in
                                                                                    the width of the box above them. Amber when it
                                                                                    disagrees with Intended % — the field it
                                                                                    disagrees WITH, not an instruction. */}
                                                                                <div className={`border border-transparent px-1 text-right text-[9px] leading-tight ${drift ? "text-amber-700" : "text-muted-foreground"}`}>
                                                                                    {retail.toLocaleString()}
                                                                                    {off !== undefined && ` · ${off}%`}
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    )
                                                                })}
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )
                                })()}
                                <p className="text-[10px] text-muted-foreground">
                                    Each pack is its own row, so different settings per row are a normal
                                    setup rather than a problem — a different dosage may want a different
                                    interval, and Hydration Express runs its 3-pack weekly and its 5-pack daily.
                                    Typing in the group fields above sets all {members} together again. A cell
                                    shows the price you charge over <strong>{"{N × the single} · {% off}"}</strong>;
                                    a <strong>·</strong> means the base is not sold in that city, so there is
                                    nothing to derive a pack price from.
                                </p>


                            </CardContent>
                        )}
                    </Card>
                )
            })}

            {/* ── add a ladder ─────────────────────────────────────────────────── */}
            {bases.length > 0 && (adding ? (
                <div className="flex flex-wrap items-end gap-3 rounded-md border border-dashed p-2.5">
                    <div className="space-y-0.5">
                        <Label className="text-[10px] text-muted-foreground">{unitLabel}</Label>
                        <NumCell value={newSessions} placeholder="2"
                            className="h-7 w-24 rounded border bg-white px-2 text-xs tabular-nums outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                            onCommit={raw => setNewSessions(Math.max(2, Number(raw) || 2))} />
                    </div>
                    <span className="pb-1.5 text-[10px] text-muted-foreground">
                        {sizes.has(newSessions)
                            ? `${groupTitle(newSessions)} already exists — open it to add variants.`
                            : "Two or more. It opens with one variant; tick the rest inside."}
                    </span>
                    <Button size="sm" className="h-7 text-xs" disabled={sizes.has(newSessions)}
                        onClick={() => {
                            // Membership is a tick inside the ladder, not a second form — so a
                            // ladder is created with one member and grown there. That is the whole
                            // point of the rework: one way to add a variant to a pack, not two.
                            const first = bases[0]
                            snap(`Created the pack of ${newSessions} ladder`)
                            onCreatePacks([{
                                baseVariantId: first.id,
                                pack: {
                                    baseVariantId: first.id, sessions: newSessions,
                                    sessionIntervalDays: 7, validityDays: 90, intendedDiscountPct: 10,
                                },
                            }])
                            setOpenGroup(newSessions); setAdding(false)
                        }}>
                        Create
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAdding(false)}>
                        Cancel
                    </Button>
                </div>
            ) : (
                <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
                    <Plus className="mr-2 h-4 w-4" /> {addLabel}
                </Button>
            ))}

            <div className="rounded-md border bg-muted/10 p-3 text-[11px] text-muted-foreground">
                <p>
                    <strong>A pack is a variant.</strong> Ticking a variant into a ladder mints a real
                    variant with its own price rows, so it appears in Pricing &amp; Availability like any
                    other and needs no special handling at checkout — a pack is{" "}
                    <code>(variant_id, qty)</code> on the cart line. The one place that knows is
                    fulfilment, after payment.
                </p>
                <p className="mt-1.5">
                    <strong>A ladder is a grouping, not a table.</strong> Each pack keeps its own row, so
                    two packs of one formula can differ — Hydration Express runs its 3-pack weekly and its
                    5-pack daily. Editing the settings sets every member at once; when they
                    already differ, the header says so rather than hiding it.
                </p>
                <p className="mt-1.5">
                    A blank interval <strong>means the customer books each session</strong> —
                    physio&rsquo;s recorded value, not missing data. ⚠️ One interval expresses{" "}
                    <strong>uniform gaps only</strong>: HPV 0/60/180 and B12 0/10/30/40/50 are not
                    representable, and a dose-schedule table replaces this field when injections &amp;
                    vaccines closes.
                </p>
            </div>
        </div>
    )
}
