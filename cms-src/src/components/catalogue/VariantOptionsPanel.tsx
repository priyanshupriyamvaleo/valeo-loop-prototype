"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
    Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, ChevronRight, AlertTriangle, Grid3x3, Code2, Check, Package, Lock, Undo2, CornerDownRight } from "lucide-react"
import { ImageField } from "@/components/catalogue/ImageField"
import { Country, ProductVariant, VariantOption, VariantOptionValue, VariantType } from "@/types"
import {
    MAX_VARIANT_COMBOS, comboLabel, comboMatrix, missingCombos, duplicateComboVariantIds, withAxisUnit,
    variantsAnsweringInactive,
} from "@/lib/catalogue"

const rid = () => Math.random().toString(36).slice(2, 9)

type AxisKind = { kind: VariantType; nameEn: string; nameAr: string; example: string }

/** Axis kinds, with the sensible default axis name for each. */
const AXIS_KINDS: AxisKind[] = [
    { kind: "colour", nameEn: "Colour", nameAr: "اللون", example: "Midnight Black, Silver, Rose Gold" },
    { kind: "size", nameEn: "Size", nameAr: "المقاس", example: "S, M, L / 41mm, 45mm" },
    { kind: "flavour", nameEn: "Flavour", nameAr: "النكهة", example: "Chocolate, Vanilla, Unflavoured" },
    { kind: "quantity", nameEn: "Quantity", nameAr: "الكمية", example: "30 caps, 60 caps, 90 caps" },
    { kind: "dosage", nameEn: "Dosage", nameAr: "الجرعة", example: "2.5mg, 5mg, 7.5mg" },
    { kind: "denomination", nameEn: "Denomination", nameAr: "الفئة", example: "AED 250, AED 500" },
    // ── consultation axes ──
    { kind: "visit", nameEn: "Visit", nameAr: "الزيارة", example: "First visit, Follow-up" },
    { kind: "mode", nameEn: "Delivered", nameAr: "طريقة التقديم", example: "Online, In clinic, At home" },
    { kind: "sessions", nameEn: "Sessions", nameAr: "الجلسات", example: "1 session, 4 sessions, 8 sessions" },
]

/**
 * TREATMENTS axes, from `IV_THERAPY.md` §3.1–3.2. Offering Colour and Flavour on an
 * IV drip is noise, and the three that matter are absent from the generic list.
 *
 *   · VOLUME  — blends + Hydration: 100 / 250 / 500 mL. D-C27 makes it MANDATORY on
 *               every drip, single-size included (one value, pre-selected), with a
 *               `500 mL` backfill for legacy variants whose name carries no size token.
 *   · DOSAGE  — single compounds: Glutathione 600/1,200/1,800 mg, NAD+ 100/250/500 mg…
 *               §3.1: strength is volume for blends and mass for single compounds, and
 *               "no formula ever uses both" today — but the model allows both, sparsely.
 *   · SPEED   — Standard / Slow. The slow infusion runs ~30 min longer and costs more;
 *               the price difference is why it is an AXIS and not a boolean plus a
 *               surcharge (D-C1, and D-C9's precedent removing `is_fast_track`).
 *               🅿️ The extra DURATION has no home yet — parked, D-C62 §6 trigger 2.
 *
 * NOT here, deliberately: SESSIONS. §3.2 — "SESSIONS left the axis vocabulary
 * entirely". A pack is its own variant plus a `variant_session_packs` row (D-C59);
 * cart quantity is `variant_multi_buy_tiers` (D-C56). A third mechanism as an axis is
 * the defect D-C50 and D-C58 both deleted.
 */
/**
 * CLOSED axis vocabularies — the value set is the same on every product that declares
 * the axis, so it is seeded whole and the operator gets no "Add value" button.
 *
 * `speed` is the catalog's FIRST genuinely closed axis. Volume and Dosage are open by
 * nature — each formula has its own strengths, and D-C21 deliberately accepted that
 * `250 mL` here and `0.5 L` elsewhere can coexist because "within one product the admin
 * screen shows both to the same editor, which is the drift guard". Infusion speed is not
 * a measurement: it is the same binary on every drip, so `Normal` vs `Regular` vs
 * `Standard` across thirty drips would be noise carrying no information.
 *
 * ⚠️ THE SCHEMA CANNOT ENFORCE THIS YET, and that is deliberate rather than forgotten.
 * D-C21 makes axis values per-product ROWS, and D-C55's mechanism for closing a
 * vocabulary (make it an ENUM) operates on COLUMNS — you cannot ENUM a label.
 * `variant_axes` has a `code` column so the AXIS can be tagged; `variant_axis_values`
 * has none, so the VALUES cannot. Seeding is therefore the whole guard today.
 *
 * NAMED TRIGGER for making it real: the first time anything downstream needs to BRANCH
 * on the value rather than display it — the parked slot-duration question (D-C62 §6
 * trigger 2) is the visible candidate, since a slower drip occupies the nurse longer.
 * Answering "is this the slower variant?" by string-matching its NAME is exactly the
 * fragility D-C55 was written to stop: `translations.entity_type` drifted three times in
 * both directions WHILE code was nominally enforcing it. At that point
 * `variant_axis_values` gains a `code` column and this becomes NORMAL / EXTENDED.
 */
const CLOSED_AXIS_VALUES: Partial<Record<VariantType, { en: string; ar: string; active?: boolean }[]>> = {
    // Normal is not a choice — every infusion runs at it. The real question is whether
    // SLOW DRIP is offered, so it seeds INACTIVE and becomes available by switching it on.
    // That is the schema's own mechanism: `variant_axis_values.status`, under a no-delete
    // policy ("retired values deactivate, they are never spliced out"), and `comboMatrix`
    // already filters inactive values — so an unoffered Slow Drip generates no variants,
    // no price rows and no empty cells, while the value row stays on record.
    speed: [
        { en: "Normal", ar: "عادي", active: true },
        // Renamed 2026-09-02 to match the server's seed, which is the authority:
        // TreatmentsCommercePolicy writes these translations once at product creation, and
        // this list is only the fallback for an axis added before the product exists.
        { en: "Slow Drip", ar: "تنقيط بطيء", active: false },
    ],
}

const TREATMENT_AXIS_KINDS: AxisKind[] = [
    { kind: "volume", nameEn: "Volume", nameAr: "الحجم", example: "100 mL, 250 mL, 500 mL — every drip declares this" },
    { kind: "dosage", nameEn: "Dosage", nameAr: "الجرعة", example: "600 mg, 1,200 mg, 1,800 mg" },
    { kind: "speed", nameEn: "Infusion speed", nameAr: "سرعة التنقيط", example: "Normal, Slow Drip — same drip, run slower. Closes at 2 values." },
]

/**
 * HOME & PERSONAL CARE axes. One kind, mandatory on every listing
 * (HomeCareCommercePolicy): the day is the base variant and a plan is a session
 * pack over it (D-C59), so the ONLY question a variant answers is the shift
 * length. Plan lengths are NOT an axis — they live in Session Packs.
 */
const HOMECARE_AXIS_KINDS: AxisKind[] = [
    { kind: "hours_per_day", nameEn: "Hours per day", nameAr: "ساعات في اليوم", example: "9 hrs, 10 hrs, 24 hrs — a live-in is a different allocation" },
]

interface Props {
    options: VariantOption[]
    onChange: (options: VariantOption[]) => void
    variants: ProductVariant[]
    /**
     * Create the variants for these combinations.
     *
     * For a SAVED product this goes to the service (PUT axes -> POST generate -> read back), so
     * it is async and can refuse. For an unsaved one it stays local — there is nothing to POST
     * against yet.
     */
    onGenerate: (combos: Record<string, string>[]) => void | Promise<void>
    /** True while the service is generating — the button must not be pressable twice. */
    generating?: boolean
    /** The service's refusal, verbatim. It names the axis; do not replace it with a generic line. */
    generateError?: string | null
    countries: Country[]
    /** Which axis vocabulary to offer. Treatments gets Volume / Dosage / Infusion speed. */
    axisSet?: "default" | "treatments" | "homecare"
    /**
     * Whether this sub-department has a drip speed at all. `flowForSubDepartment` already
     * knows: an injection is a single shot and a vaccine is administered, so neither has
     * one — offering the axis there would be a field that can never be meaningfully set.
     */
    allowSpeedAxis?: boolean
    /**
     * Set `product_variants.status` on a set of variants — never deletes them. Used both
     * by the orphan cleanup and by the status pills in the grid below, so activating a
     * dozen combinations does not mean opening a dozen cards.
     */
    onSetVariantStatus?: (ids: string[], status: "active" | "inactive") => void
    /**
     * Axis kinds this family REQUIRES (server: `mandatoryAxisCodes`). Non-empty means "sold as one
     * item" is not on offer — a drip must declare Volume (D-C27), so it cannot be a single item.
     *
     * <p>Empty for every other family, including physio: the choice is the operator's per LISTING,
     * not a property of the department. Hardcoding which families may be single forecloses cases
     * the register already expects (D-C62 §6 parks duration-per-variant and at-home vs at-clinic,
     * both physio-shaped).
     */
    mandatoryAxisKinds?: string[]
    /** Creates the single zero-axis variant (`axis_signature = ''`). Idempotent by that signature. */
    onCreateSoleVariant?: () => void
    /**
     * Removes the sole variant so axes can be declared instead. The caller refuses when the variant
     * is priced, packed or stocked — the same `VARIANT_IN_USE` rule the API enforces.
     */
    onDropSoleVariant?: () => void
}

export function VariantOptionsPanel({
    options, onChange, variants, onGenerate, countries, axisSet = "default", allowSpeedAxis = true,
    onSetVariantStatus, mandatoryAxisKinds = [], onCreateSoleVariant, onDropSoleVariant,
    generating = false, generateError = null,
}: Props) {
    const axisKinds = (axisSet === "treatments" ? TREATMENT_AXIS_KINDS
        : axisSet === "homecare" ? HOMECARE_AXIS_KINDS : AXIS_KINDS)
        .filter(k => k.kind !== "speed" || allowSpeedAxis)
    const [expanded, setExpanded] = useState<string | null>(null)
    const [confirmSwitch, setConfirmSwitch] = useState(false)
    const [showContract, setShowContract] = useState(false)

    const sorted = [...options].sort((a, b) => a.position - b.position)
    const matrix = comboMatrix(options)
    const missing = missingCombos(options, variants)
    // Variants left behind by a value being switched off. They still exist and are still
    // sellable until their own status says otherwise — see variantsAnsweringInactive.
    const orphaned = variantsAnsweringInactive(variants, options)
        .filter(id => variants.find(v => v.id === id)?.status !== "inactive")
    const dupes = duplicateComboVariantIds(variants)
    const overCap = matrix.length > MAX_VARIANT_COMBOS

    // ── which mode this listing is IN — DERIVED, never stored ────────────────────────────────────
    //
    // There is deliberately no `hasAxes` field to keep in step with the rows. Axes exist or they do
    // not; a zero-axis variant exists or it does not. A stored flag could disagree with both, and
    // that is the failure mode D-C58 (`multi_buy_blocked`) and D-C59 (`is_pack`) each deleted once
    // already: a flag can contradict the data, the data cannot contradict itself.
    const soleVariant = variants.find(v => !v.optionValues || Object.keys(v.optionValues).length === 0)
    const mode: "axes" | "single" | "undecided" =
        options.length > 0 ? "axes"
            : soleVariant ? "single"
            : "undecided"

    /**
     * What still holds the sole variant, in the operator's words — the panel's copy of the API's
     * VARIANT_IN_USE reasons, so the refusal is visible BEFORE the click rather than after it.
     */
    const soleVariantHolds: string[] = !soleVariant ? [] : [
        soleVariant.regionalData?.some(r => (r.price ?? 0) > 0
            || r.cityPrices?.some(cp => (cp.price ?? 0) > 0)) ? "a price" : null,
        variants.some(v => v.sessionPack?.baseVariantId === soleVariant.id) ? "session packs" : null,
        (soleVariant.stockQuantity ?? 0) > 0 ? "stock" : null,
        soleVariant.regionalData?.some(r => r.zohoId) ? "an ERP pairing" : null,
    ].filter((x): x is string => x !== null)
    const soleVariantRemovable = soleVariant != null && soleVariantHolds.length === 0

    const usedKinds = new Set(options.map(o => o.kind))
    const addAxis = (k: AxisKind) => onChange([...options, {
        id: rid(), kind: k.kind, nameEn: k.nameEn, nameAr: k.nameAr,
        position: options.length,
        // A CLOSED axis arrives with its full value set. Everything else starts empty.
        values: (CLOSED_AXIS_VALUES[k.kind] ?? []).map((label, i) => ({
            id: rid(), valueEn: label.en, valueAr: label.ar, position: i,
            isActive: label.active ?? true,
        })),
    }])
    const patchAxis = (id: string, patch: Partial<VariantOption>) =>
        onChange(options.map(o => (o.id === id ? { ...o, ...patch } : o)))
    const removeAxis = (id: string) => onChange(options.filter(o => o.id !== id))
    /** True once any variant has answered this axis — removing it would orphan them. */
    const inUse = (id: string) => variants.some(v => v.optionValues?.[id])
    const addValue = (axis: VariantOption) => patchAxis(axis.id, {
        values: [...axis.values, {
            id: rid(), valueEn: "", valueAr: "", position: axis.values.length, isActive: true,
        }],
    })
    const patchValue = (axis: VariantOption, vid: string, patch: Partial<VariantOptionValue>) =>
        patchAxis(axis.id, { values: axis.values.map(v => (v.id === vid ? { ...v, ...patch } : v)) })

    /** How many of this combo's country SKUs are filled — the real readiness signal. */
    /**
     * SKU coverage is a HEALTH PRODUCTS reading — D-C14 makes variant_inventory (and its
     * `sku`) a Health-Products table, so on a service it read 0/3 forever and invited
     * someone to go looking for the SKU field that is correctly not rendered.
     *
     * For a service the equivalent readiness signal is CITY PRICES: a variant is sellable
     * in a city iff a product_pricing row exists for it (D-C29), so "priced in N cities"
     * is the same question asked of the right column.
     */
    const coverage = (v: ProductVariant | undefined) => {
        if (!v) return null
        const rows = v.regionalData ?? []
        if (axisSet !== "default") {
            const cities = rows.reduce((n, r) => n + (r.cityPrices ?? []).filter(c => c.price > 0).length, 0)
            return { label: cities === 0 ? "not priced" : `${cities} priced`, ok: cities > 0 }
        }
        const filled = rows.filter(r => r.sku).length
        const total = Math.max(rows.length, countries.length)
        return { label: `${filled}/${total}`, ok: total > 0 && filled === total }
    }

    // ── UNDECIDED: the choice, offered in every department ───────────────────────────────────────
    if (mode === "undecided") {
        return (
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                        <Grid3x3 className="h-4 w-4 text-blue-600" />
                        <span className="font-semibold text-sm">Does this listing have options?</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
                        Answer once, before anything is priced. Nothing is stored either way — the answer
                        IS whether axes exist, so it stays readable from the listing itself.
                    </p>
                </CardHeader>
                <CardContent className="pt-0 grid gap-2 sm:grid-cols-2">
                    <button type="button" onClick={() => addAxis(axisKinds[0])}
                        className="rounded-md border p-3 text-left hover:border-blue-500 hover:bg-blue-500/5 transition-colors">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                            <Grid3x3 className="h-3.5 w-3.5 text-blue-600" /> It varies
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            Flavours, sizes, strengths. Declare the axes and every combination becomes a
                            variant with its own SKU and price.
                        </p>
                    </button>
                    <button type="button" onClick={onCreateSoleVariant}
                        disabled={!onCreateSoleVariant || mandatoryAxisKinds.length > 0}
                        className="rounded-md border p-3 text-left hover:border-slate-500 hover:bg-muted/40 transition-colors disabled:opacity-50 disabled:hover:border-border disabled:hover:bg-transparent">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                            <Package className="h-3.5 w-3.5 text-slate-500" /> Sold as one item
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                            {mandatoryAxisKinds.length > 0 ? (
                                <>
                                    Not available here — this type always varies by{" "}
                                    <strong>{mandatoryAxisKinds.join(", ")}</strong>, so it must declare
                                    that axis even when there is only one value to pick.
                                </>
                            ) : (
                                <>
                                    One SKU, one price. Creates the listing&rsquo;s single variant so it
                                    can be priced — you can still switch to options later, until it sells.
                                </>
                            )}
                        </p>
                    </button>
                </CardContent>
            </Card>
        )
    }

    // ── ALREADY SINGLE: the switch back, with its cost stated up front ──────────────────────────
    if (mode === "single") {
        return (
            <Card className="border-l-4 border-l-slate-400">
                <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-500" />
                        <span className="font-semibold text-sm">Sold as one item</span>
                        <Badge variant="outline" className="text-[10px]">No variant options</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
                        This listing has one variant and no axes. Its price and stock hang off that variant.
                    </p>
                </CardHeader>
                <CardContent className="pt-0">
                    {soleVariantRemovable ? (
                        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-3 py-2 text-xs">
                            <span className="text-muted-foreground">
                                Nothing is sold yet, so the shape can still change.
                            </span>
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => setConfirmSwitch(true)} disabled={!onDropSoleVariant}>
                                <Undo2 className="mr-1 h-3.5 w-3.5" /> Switch to options
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs">
                            <Lock className="mt-0.5 h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>
                                <strong>This can no longer be switched.</strong> The single variant carries{" "}
                                {soleVariantHolds.join(", ")}, and axes would leave that behind with nothing to
                                answer. Clear it first, or make a new listing — the same rule the API applies
                                as <code className="text-[10px]">VARIANT_IN_USE</code>.
                            </span>
                        </div>
                    )}
                </CardContent>

                {/*
                  * A REAL stop, not an inline button. The variant carries more than a row — its
                  * name, images and SEO copy go with it — so the dialog names what is lost rather
                  * than saying "this variant will be deleted", which undersells it.
                  *
                  * Deliberately NOT a conversion into the first combination: keeping the row and
                  * relabelling it would preserve that work, but it also rewrites what a past order
                  * points at, and it needed one answer per axis to place the price on the right
                  * cell. Recreating is the simpler contract — nothing ever changes identity.
                  */}
                <Dialog open={confirmSwitch} onOpenChange={setConfirmSwitch}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-base">
                                Switch to variant options?
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-3 text-sm">
                            <p>
                                <strong>{soleVariant?.variantLabelEn || "The single variant"}</strong>{" "}
                                will be deleted. Once axes exist every variant has to answer them, and
                                this one answers none — so it cannot be carried across.
                            </p>
                            <div className="rounded-md border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-xs">
                                Anything held on that variant goes with it — its name, its images and its
                                SEO copy. You will re-enter them on the new combinations.
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Next: pick the axis and its values, then generate the combinations. New
                                variants are not created automatically — nothing knows yet whether this
                                is two flavours or five.
                            </p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" size="sm"
                                onClick={() => setConfirmSwitch(false)}>Keep as one item</Button>
                            <Button variant="destructive" size="sm" onClick={() => {
                                onDropSoleVariant?.()
                                addAxis(axisKinds[0])
                                setConfirmSwitch(false)
                            }}>
                                Delete it and add options
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </Card>
        )
    }

    return (
        <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="py-3">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Grid3x3 className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-sm">Variant options</span>
                            {options.length > 0 && (
                                <Badge variant="outline" className="text-[10px]">
                                    {sorted.map(o => o.nameEn).join(" × ")}
                                </Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 max-w-3xl">
                            Declare the <strong>axes</strong> this listing varies by — pick more than one when it
                            varies by several (Flavour <em>and</em> Quantity). Every combination becomes one variant,
                            and the variant is what carries the SKU, price and stock. You do not add combinations by
                            hand: define Colour and Size, and the grid is generated.
                        </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 text-xs"
                            onClick={() => setShowContract(s => !s)}>
                            <Code2 className="mr-1 h-3.5 w-3.5" /> API contract
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-7 text-xs">
                                    <Plus className="mr-1 h-3.5 w-3.5" /> Add axis
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-72">
                                <DropdownMenuLabel className="text-xs">Vary this listing by…</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {axisKinds.map(k => (
                                    <DropdownMenuItem key={k.kind} disabled={usedKinds.has(k.kind)}
                                        onClick={() => addAxis(k)} className="flex-col items-start gap-0.5 py-1.5">
                                        <span className="text-xs font-medium">
                                            {k.nameEn}{usedKinds.has(k.kind) && " — added"}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">{k.example}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0">
                {/* The flow, stated in the UI so nobody has to be told it twice. */}
                <ol className="flex flex-wrap items-center gap-1 text-[11px]">
                    {[
                        { n: 1, label: "Declare the axes", done: options.length > 0 },
                        { n: 2, label: "Add each axis's values", done: matrix.length > 0 },
                        { n: 3, label: "Generate the combinations", done: matrix.length > 0 && missing.length === 0 },
                        {
                            n: 4, label: "Fill SKU & price per country",
                            done: matrix.length > 0 && missing.length === 0 && variants.length > 0
                                && variants.every(v => (v.regionalData ?? []).length > 0
                                    && v.regionalData.every(r => r.sku)),
                        },
                    ].map((s, i) => (
                        <span key={s.n} className="flex items-center gap-1">
                            {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${s.done
                                ? "border-green-500/30 bg-green-500/10 text-green-700"
                                : "text-muted-foreground"}`}>
                                {s.done ? <Check className="h-3 w-3" /> : <span className="font-mono">{s.n}</span>}
                                {s.label}
                            </span>
                        </span>
                    ))}
                </ol>

                {options.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed rounded-lg bg-muted/10">
                        <p className="text-sm text-muted-foreground font-medium">No axes declared.</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                            This listing is in <strong>single-variant mode</strong> — each variant below is described
                            by its own type and a typed-in label. Add an axis to switch to the generated grid.
                        </p>
                    </div>
                ) : sorted.map(axis => {
                    const open = expanded === axis.id
                    const active = axis.values.filter(v => v.isActive).length
                    return (
                        <div key={axis.id} className="border rounded-md overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 bg-muted/20">
                                <button type="button" onClick={() => setExpanded(open ? null : axis.id)}
                                    className="flex items-center gap-2 flex-1 text-left">
                                    <ChevronRight className={`h-4 w-4 transition-transform ${open ? "rotate-90" : ""}`} />
                                    <span className="font-medium text-xs">{axis.nameEn}</span>
                                    <Badge variant="outline" className="text-[10px]">{axis.kind}</Badge>
                                    <span className="text-[11px] text-muted-foreground">
                                        {active} value{active === 1 ? "" : "s"}
                                        {axis.values.length !== active && ` · ${axis.values.length - active} inactive`}
                                    </span>
                                    {active === 0 && (
                                        <Badge variant="outline"
                                            className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/20">
                                            needs values
                                        </Badge>
                                    )}
                                </button>
                                {/* Dropping an axis that variants already answer would orphan their
                                    combinations — deactivate the unwanted values instead. */}
                                <Button variant="ghost" size="icon"
                                    className="h-6 w-6 text-destructive disabled:opacity-30"
                                    disabled={inUse(axis.id)}
                                    onClick={() => removeAxis(axis.id)}
                                    title={inUse(axis.id)
                                        ? `${variants.filter(v => v.optionValues?.[axis.id]).length} variants use this axis — deactivate values instead of removing it`
                                        : "Remove this axis"}>
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            {open && (
                                <div className="p-3 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Axis name (EN)</Label>
                                            <Input className="h-8 text-xs" value={axis.nameEn}
                                                onChange={e => patchAxis(axis.id, { nameEn: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Axis name (AR)</Label>
                                            <Input dir="rtl" className="h-8 text-xs text-right" value={axis.nameAr ?? ""}
                                                onChange={e => patchAxis(axis.id, { nameAr: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Values</Label>
                                        {axis.values.map(val => (
                                            <div key={val.id}
                                                className={`grid gap-2 items-start ${axis.kind === "colour"
                                                    ? "grid-cols-[1fr_1fr_88px_120px_auto]" : "grid-cols-[1fr_1fr_auto]"}`}>
                                                <Input className="h-8 text-xs" placeholder="Value (EN)" value={val.valueEn}
                                                    onChange={e => patchValue(axis, val.id, { valueEn: e.target.value })}
                                                    onBlur={() => {
                                                        // "6" on an hours axis means 6 HOURS — say so in the stored
                                                        // label, which is also what the server saves as the value name.
                                                        const unit = withAxisUnit(axis.kind, val.valueEn)
                                                        if (unit !== val.valueEn) patchValue(axis, val.id, { valueEn: unit })
                                                    }} />
                                                <Input dir="rtl" className="h-8 text-xs text-right" placeholder="القيمة (AR)"
                                                    value={val.valueAr ?? ""}
                                                    onChange={e => patchValue(axis, val.id, { valueAr: e.target.value })} />
                                                {axis.kind === "colour" && (
                                                    <>
                                                        <Input type="color" className="h-8 w-full p-1 cursor-pointer"
                                                            value={val.swatchHex || "#000000"}
                                                            title="Swatch shown on the PDP"
                                                            onChange={e => patchValue(axis, val.id, { swatchHex: e.target.value })} />
                                                        <ImageField preset="thumbnail" value={val.imageUrl ?? ""}
                                                            onChange={url => patchValue(axis, val.id, { imageUrl: url })} />
                                                    </>
                                                )}
                                                <Button variant="ghost" size="sm"
                                                    className={`h-8 text-[10px] ${val.isActive ? "text-muted-foreground" : "text-amber-700"}`}
                                                    onClick={() => patchValue(axis, val.id, { isActive: !val.isActive })}
                                                    title="No-delete policy: values deactivate, they are never removed">
                                                    {val.isActive ? "Active" : "Inactive"}
                                                </Button>
                                            </div>
                                        ))}
                                        {CLOSED_AXIS_VALUES[axis.kind] ? (
                                            <p className="text-[11px] text-muted-foreground">
                                                Closed vocabulary — this axis has exactly these
                                                {" "}{CLOSED_AXIS_VALUES[axis.kind]!.length} values on every product.
                                                Rename them for translation; do not add to the set.
                                                {axis.kind === "speed" && (
                                                    <> <strong>Switch Slow Drip to Active to offer it</strong> — an
                                                    inactive value generates no variants, so nothing is priced for a
                                                    speed you do not sell.</>
                                                )}
                                            </p>
                                        ) : (
                                            <Button variant="outline" size="sm" className="h-7 text-xs"
                                                onClick={() => addValue(axis)}>
                                                <Plus className="mr-1 h-3 w-3" /> Add value
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {/* ── generated grid ── */}
                {/* ── why there are no combinations ────────────────────────────────
                    `comboMatrix` returns nothing while ANY declared axis has no active value,
                    because a half-declared grid has no COMPLETE combination to build (D-C7). The
                    block below then renders nothing at all, which reads as "the generator is
                    broken" rather than "Volume has no values yet" — so the axis holding it up is
                    named. Silence here is what let `IV NAD — Normal` be generated: the matrix
                    used to treat an empty axis as absent and mint the axes that happened to be
                    filled. */}
                {matrix.length === 0 && options.length > 0 && (() => {
                    const empty = options.filter(o => !o.values.some(v => v.isActive))
                    if (empty.length === 0) return null
                    return (
                        <div className="rounded-md border border-dashed bg-muted/20 p-3 text-[11px] text-muted-foreground">
                            <strong className="text-foreground">
                                No combinations yet — {empty.map(o => o.nameEn || "an unnamed axis").join(" and ")}
                                {empty.length === 1 ? " has" : " have"} no active values.
                            </strong>{" "}
                            Every declared axis has to be answered by every variant, so nothing can be
                            generated until each one has at least one active value. Adding values to the
                            other axes will not help on its own — a variant answering some axes and not
                            others could never be sold, and would still take the default flag.
                        </div>
                    )
                })()}

                {matrix.length > 0 && (
                    <>
                    {/* A DERIVED panel, deliberately not styled like the axis cards above.
                        The axes are things you author; this is what they produce, and you
                        cannot edit a cell of it. Reading as a fourth card of the same weight
                        made "Normal" in the grid look like a value belonging to the axis card
                        above it. The arrow, the inset background and the heading all say
                        "result of the above" rather than "another thing to fill in". */}
                    <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                        <CornerDownRight className="h-3.5 w-3.5 shrink-0" />
                        <span>every combination of the axes above</span>
                        <span className="h-px flex-1 bg-border" />
                    </div>

                    <div className="rounded-md border-2 border-dashed bg-muted/30">
                        <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
                            <div className="text-xs">
                                <span className="font-semibold">{matrix.length} combination{matrix.length === 1 ? "" : "s"}</span>
                                <span className="text-muted-foreground">
                                    {" "}· <span className={matrix.length - missing.length > 0 ? "text-foreground" : ""}>
                                        {matrix.length - missing.length} built
                                    </span> · {missing.length} not yet created
                                </span>
                            </div>
                            {orphaned.length > 0 && onSetVariantStatus && (
                                <Button size="sm" variant="outline"
                                    className="h-7 border-amber-300 bg-amber-50 text-xs text-amber-900 hover:bg-amber-100"
                                    title="These variants answer an option value that is no longer active. They are still sellable until their own status says otherwise."
                                    onClick={() => onSetVariantStatus(orphaned, "inactive")}>
                                    <AlertTriangle className="mr-1 h-3.5 w-3.5" />
                                    Deactivate {orphaned.length} variant{orphaned.length === 1 ? "" : "s"} answering an inactive value
                                </Button>
                            )}
                            {missing.length > 0 && !overCap && (
                                <Button size="sm" className="h-7 text-xs" disabled={generating}
                                    onClick={() => { void onGenerate(missing) }}>
                                    <Plus className="mr-1 h-3.5 w-3.5" />
                                    {generating
                                        ? "Creating…"
                                        : `Create ${missing.length} missing variant${missing.length === 1 ? "" : "s"}`}
                                </Button>
                            )}
                        </div>

                        {generateError && (
                            <div className="flex gap-2 px-3 py-2 bg-destructive/5 border-b text-xs">
                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                {/* The service's own message, unedited. MANDATORY_AXIS_MISSING names the
                                    axis code the family requires; AXIS_WITHOUT_VALUES names the empty
                                    one. A generic "could not generate" throws away the only part an
                                    operator can act on. */}
                                <p>{generateError}</p>
                            </div>
                        )}

                        {overCap && (
                            <div className="flex gap-2 px-3 py-2 bg-destructive/5 border-b text-xs">
                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                <p>
                                    <strong>{matrix.length} combinations exceeds the {MAX_VARIANT_COMBOS} limit.</strong>{" "}
                                    Each one needs a SKU and a price per country, so this grid stops being maintainable.
                                    Drop an axis, or split this into separate listings.
                                </p>
                            </div>
                        )}

                        {dupes.length > 0 && (
                            <div className="flex gap-2 px-3 py-2 bg-destructive/5 border-b text-xs">
                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                                <p>
                                    <strong>{dupes.length} variants share a combination.</strong> Two variants with the
                                    same values make the PDP unable to resolve a selection to one SKU. Change or
                                    deactivate the duplicates.
                                </p>
                            </div>
                        )}

                        <div className="max-h-72 overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="sticky top-0 bg-background border-b shadow-sm">
                                    <tr className="text-left text-muted-foreground">
                                        {/* The axis columns are the combination's KEY — what identifies
                                            the row. Variant / priced / status are its STATE. Tinting the
                                            first group is what makes a wide grid readable at a glance. */}
                                        {sorted.filter(o => o.values.some(v => v.isActive)).map(o => (
                                            <th key={o.id} className="px-3 py-1.5 font-medium bg-muted/40">{o.nameEn}</th>
                                        ))}
                                        <th className="px-3 py-1.5 font-medium">Variant</th>
                                        <th className="px-3 py-1.5 font-medium">
                                            {axisSet !== "default" ? "Cities priced" : "SKUs filled"}
                                        </th>
                                        <th className="px-3 py-1.5 font-medium">
                                            <span className="flex items-center gap-1.5">
                                                Status
                                                {onSetVariantStatus && variants.length > 0 && (() => {
                                                    // Bulk, because a 12-combination grid means twelve
                                                    // card visits otherwise. Only ever sets status —
                                                    // never creates or deletes a variant.
                                                    const off = variants.filter(x => x.status !== "active").map(x => x.id)
                                                    return off.length > 0 ? (
                                                        <button type="button"
                                                            className="rounded border px-1.5 py-px text-[9px] font-normal text-muted-foreground hover:bg-muted"
                                                            onClick={() => onSetVariantStatus(off, "active")}>
                                                            activate all {off.length}
                                                        </button>
                                                    ) : null
                                                })()}
                                            </span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {matrix.slice(0, MAX_VARIANT_COMBOS).map((combo, i) => {
                                        const v = variants.find(x =>
                                            Object.entries(combo).every(([o, val]) => x.optionValues?.[o] === val))
                                        const cov = coverage(v)
                                        return (
                                            <tr key={i} className={`border-b last:border-0 ${v ? "" : "bg-muted/10"}`}>
                                                {sorted.filter(o => o.values.some(val => val.isActive)).map(o => {
                                                    const val = o.values.find(x => x.id === combo[o.id])
                                                    return (
                                                        <td key={o.id} className="px-3 py-1.5 bg-muted/20 font-medium">
                                                            <span className="inline-flex items-center gap-1.5">
                                                                {o.kind === "colour" && val?.swatchHex && (
                                                                    <span className="h-3 w-3 rounded-full border shrink-0"
                                                                        style={{ background: val.swatchHex }} />
                                                                )}
                                                                {val ? withAxisUnit(o.kind, val.valueEn) : <span className="text-muted-foreground">—</span>}
                                                            </span>
                                                        </td>
                                                    )
                                                })}
                                                <td className="px-3 py-1.5">
                                                    {v ? (
                                                        <span className="font-mono text-[10px]">{v.nameEn || v.id}</span>
                                                    ) : (
                                                        // A chip, not italic prose: "not created" is a STATE
                                                        // of the row, and every other state in this grid
                                                        // (priced, status) reads as one. Italics made it look
                                                        // like a caption about the row instead of a value in it.
                                                        <span className="inline-flex items-center gap-1 rounded-full border border-dashed px-1.5 py-px text-[10px] text-muted-foreground">
                                                            <Plus className="h-2.5 w-2.5" /> not created
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    {cov ? (
                                                        <span className={cov.ok ? "text-green-700" : "text-amber-700"}>
                                                            {cov.ok && (
                                                                <Check className="inline h-3 w-3 mr-0.5" />
                                                            )}
                                                            {cov.label}
                                                        </span>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    {v ? (
                                                        onSetVariantStatus ? (
                                                            <button type="button"
                                                                title={v.status === "active"
                                                                    ? "Sellable. Click to deactivate."
                                                                    : "Not sellable. Click to activate."}
                                                                className={`rounded-full border px-2 py-px text-[10px] ${
                                                                    v.status === "active"
                                                                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                                                                        : "text-muted-foreground hover:bg-muted"}`}
                                                                onClick={() => onSetVariantStatus(
                                                                    [v.id], v.status === "active" ? "inactive" : "active")}>
                                                                {v.status}
                                                            </button>
                                                        ) : (
                                                            <Badge variant="outline" className="text-[10px]">{v.status}</Badge>
                                                        )
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <p className="px-3 py-1.5 text-[10px] text-muted-foreground border-t">
                            The grid is intentionally <strong>sparse</strong> — a combination you do not sell simply has
                            no variant, and the PDP greys that choice out. Not every declared combination has to exist.
                        </p>
                    </div>
                    </>
                )}

                {showContract && <ApiContract options={sorted} variants={variants} countries={countries} />}
            </CardContent>
        </Card>
    )
}

/** ── How the frontend and backend hand this off to each other ── */
function ApiContract({ options, variants, countries }: {
    options: VariantOption[]; variants: ProductVariant[]; countries: Country[]
}) {
    const sampleOptions = options.length > 0 ? options : [{
        id: "opt_colour", kind: "colour" as VariantType, nameEn: "Colour", position: 0,
        values: [{ id: "val_black", valueEn: "Midnight Black", swatchHex: "#111111", position: 0, isActive: true }],
    }]
    const country = countries[0] ?? "UAE"
    const firstVariant = variants[0]

    const response = {
        // axes + variants below are this listing's live data
        listingId: "<this listing>",
        options: sampleOptions.map(o => ({
            id: o.id, kind: o.kind, name: { en: o.nameEn, ar: o.nameAr ?? "" }, position: o.position,
            values: o.values.filter(v => v.isActive).map(v => ({
                id: v.id, value: { en: v.valueEn, ar: v.valueAr ?? "" },
                swatchHex: v.swatchHex, imageUrl: v.imageUrl, position: v.position,
            })),
        })),
        variants: (variants.length > 0 ? variants.slice(0, 2) : [null]).map((v, i) => ({
            id: v?.id ?? "var_black_m",
            optionValues: v?.optionValues ?? { opt_colour: "val_black", opt_size: "val_m" },
            label: v ? comboLabel(v.optionValues, options) : "Midnight Black / M",
            sku: v?.regionalData?.find(r => r.country === country)?.sku ?? "VAL-RING-BLK-M",
            price: v?.regionalData?.find(r => r.country === country)?.price ?? 1299,
            inStock: (v?.regionalData?.find(r => r.country === country)?.warehouseStock ?? 12) > 0,
            status: v?.status ?? "active",
            isDefault: v?.isDefault ?? i === 0,
        })),
    }

    return (
        <div className="border rounded-md overflow-hidden">
            <div className="px-3 py-2 bg-blue-500/5 border-b">
                <p className="text-xs font-semibold">Frontend ↔ backend contract</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                    One payload carries the axes and the variants together. The backend never sends a pre-built
                    selector — it sends the axes and the sparse variant list, and the frontend derives what is
                    selectable. This is the same shape Shopify, BigCommerce and commercetools expose.
                </p>
            </div>

            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x">
                <div className="p-3 space-y-2">
                    <p className="text-[11px] font-semibold">Backend owns</p>
                    <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                        <li><strong>One source of truth for the axes.</strong> Order matters — it is the order the
                            selectors render in.</li>
                        <li><strong>Only sellable variants.</strong> Filter by country and status server-side; do not
                            ship rows the user cannot buy and expect the FE to hide them.</li>
                        <li><strong>Resolved price &amp; stock per country</strong> already applied, so the FE does no
                            regional arithmetic.</li>
                        <li><strong>Rejects duplicate combinations</strong> on write — a UNIQUE constraint on the
                            sorted value set. Ambiguity here is unresolvable on the PDP.</li>
                        <li><strong>A default variant</strong>, so the PDP has something priced on first paint.</li>
                    </ul>
                </div>
                <div className="p-3 space-y-2">
                    <p className="text-[11px] font-semibold">Frontend owns</p>
                    <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pl-4">
                        <li><strong>One selector per axis</strong>, rendered by <code>kind</code> — colour becomes
                            swatches, size becomes pills, quantity becomes a dropdown.</li>
                        <li><strong>Resolution:</strong> a selection is complete only when every axis has a value;
                            find the variant whose <code>optionValues</code> match exactly.</li>
                        <li><strong>Greying out:</strong> before all axes are chosen, a value is selectable only if
                            some remaining variant still contains it. This is what makes a sparse grid feel correct
                            rather than broken.</li>
                        <li><strong>Partial state:</strong> show a price range until resolution completes; never show
                            the default variant&apos;s price as if it were the selection&apos;s.</li>
                        <li><strong>Deep links:</strong> reflect the resolved variant in the URL so a shared PDP link
                            reopens on the same SKU.</li>
                    </ul>
                </div>
            </div>

            <div className="border-t">
                <p className="px-3 pt-2 text-[11px] font-semibold">GET /v1/listings/:slug?country={country}</p>
                <pre className="px-3 pb-2 pt-1 text-[10px] leading-relaxed overflow-x-auto">
                    {JSON.stringify(response, null, 2)}
                </pre>
            </div>

            <div className="border-t bg-muted/10">
                <p className="px-3 pt-2 text-[11px] font-semibold">Resolving a selection on the PDP</p>
                <pre className="px-3 pb-2 pt-1 text-[10px] leading-relaxed overflow-x-auto">{`// complete selection → exactly one variant (or none, if that combo is not sold)
const resolve = (sel) =>
  variants.find(v => options.every(o => v.optionValues[o.id] === sel[o.id]))

// which values are still reachable given a partial selection — drives greying out
const selectable = (sel, axisId) => new Set(
  variants
    .filter(v => Object.entries(sel)
      .every(([o, val]) => o === axisId || v.optionValues[o] === val))
    .map(v => v.optionValues[axisId])
)

// add to cart carries the VARIANT, never the listing + a bag of labels
POST /v1/cart { variantId: "var_black_m", qty: 1 }`}</pre>
            </div>

            <div className="border-t px-3 py-2">
                <p className="text-[11px] font-semibold">Persistence</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                    SKU already sits in the right place: <code>product_variant_identifiers(variant_id, country_id,
                        sku)</code>, so &ldquo;each combination maps to a SKU&rdquo; needs no new SKU plumbing once a
                    variant <em>is</em> a combination. What is missing is the axes themselves —{" "}
                    <code>catalog_options</code>, <code>catalog_option_values</code> and the join{" "}
                    <code>product_variant_option_values</code>. Until those exist,{" "}
                    <code>product_variants.variant_type</code> can only express one axis.
                    {firstVariant && (
                        <> Sample above is drawn from this listing&apos;s live data.</>
                    )}
                </p>
            </div>
        </div>
    )
}
