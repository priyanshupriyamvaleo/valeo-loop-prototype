"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, ChevronRight, Droplet, Syringe, Gift, Sparkles, Info } from "lucide-react"
import { ApiService } from "@/services/api"
import {
    City, Country, TreatmentDosageOption, TreatmentPlan, TreatmentsConfig,
    TREATMENT_PLAN_KINDS, AdministrationMethod,
} from "@/types"
import { ImageField } from "@/components/catalogue/ImageField"
import { CountrySwitcher } from "@/components/catalogue/CountrySwitcher"
import { finalPlanPrice, isIv, planDiscountPct, planPrice, flowForSubDepartment } from "@/lib/treatments"

const rid = () => Math.random().toString(36).slice(2, 9)

export function TreatmentPlans({ config, onChange, countries, subDepartmentSlug }: {
    config: TreatmentsConfig
    onChange: (patch: Partial<TreatmentsConfig>) => void
    countries: Country[]
    /** Drives the flow — IV, Injections and Vaccines author differently. */
    subDepartmentSlug?: string
}) {
    const flow = flowForSubDepartment(subDepartmentSlug)
    const [cities, setCities] = useState<City[]>([])
    const [country, setCountry] = useState<Country | null>(countries[0] ?? null)
    const [open, setOpen] = useState<string | null>(null)

    useEffect(() => { ApiService.catalogue.cities().then(setCities) }, [])
    useEffect(() => {
        if (!country || !countries.includes(country)) setCountry(countries[0] ?? null)
    }, [countries, country])

    // the taxonomy decides, not the operator
    const iv = flow.method ? flow.method === "iv_drip" : isIv(config)
    const doses = config.dosageOptions ?? []
    const plans = [...(config.plans ?? [])].sort((a, b) => a.sortOrder - b.sortOrder)

    const setDoses = (next: TreatmentDosageOption[]) => onChange({ dosageOptions: next })
    const setPlans = (next: TreatmentPlan[]) => onChange({ plans: next })
    const patchPlan = (id: string, p: Partial<TreatmentPlan>) =>
        setPlans(plans.map(x => (x.id === id ? { ...x, ...p } : x)))
    const addPlan = (kind: TreatmentPlan["kind"]) => {
        const meta = TREATMENT_PLAN_KINDS.find(k => k.id === kind)!
        setPlans([...plans, {
            id: rid(), kind, labelEn: meta.label, isActive: true, sortOrder: plans.length,
            pricing: [], benefitsEn: [],
            ...(kind === "couple" ? { attendees: 2 } : {}),
            ...(kind === "group" ? { attendees: 3, bagCount: 3 } : {}),
            ...(kind === "course" ? { sessionCount: 8, validityDays: 90, includesConsultation: true } : {}),
        }])
        setOpen(null)
    }
    const setPrice = (plan: TreatmentPlan, cityId: string | undefined, field: string, value: unknown) => {
        const existing = plan.pricing.find(p => p.country === country && p.cityId === cityId)
        patchPlan(plan.id, {
            pricing: existing
                ? plan.pricing.map(p => (p === existing ? { ...p, [field]: value } : p))
                : [...plan.pricing, { country: country!, cityId, [field]: value }],
        })
    }

    const Num = ({ label, value, onSet, ph }: {
        label: string; value?: number; onSet: (n: number | undefined) => void; ph?: string
    }) => (
        <div className="space-y-1">
            <Label className="text-[11px]">{label}</Label>
            <Input type="number" className="h-8 text-xs" value={value ?? ""} placeholder={ph}
                onChange={e => onSet(e.target.value === "" ? undefined : Number(e.target.value))} />
        </div>
    )

    return (
        <div className="space-y-4">
            {/* ── how it is administered ── */}
            <Card className="border-l-4 border-l-teal-500">
                <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                        {iv ? <Droplet className="h-4 w-4 text-teal-600" /> : <Syringe className="h-4 w-4 text-teal-600" />}
                        <span className="text-sm font-semibold">Administration</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        How the treatment is given. This decides what the rest of this screen offers — group sessions
                        and drip speed only exist for an infusion.
                    </p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    {flow.method ? (
                        <div className="rounded-md border border-dashed bg-muted/10 p-3">
                            <p className="text-xs font-medium">
                                {flow.method === "iv_drip" ? "IV drip" : "Injection shot"}
                                {flow.isVaccine && " · vaccine"} — set by the sub-department
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">{flow.note}</p>
                        </div>
                    ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                        {([
                            { id: "iv_drip", label: "IV drip", blurb: "Infusion via a cannula — bags, drip speed, group sessions." },
                            { id: "injection_shot", label: "Injection shot", blurb: "A single shot — no bags, no drip speed." },
                        ] as { id: AdministrationMethod; label: string; blurb: string }[]).map(m => {
                            const on = config.administrationMethod === m.id
                            return (
                                <button key={m.id} type="button"
                                    onClick={() => onChange({ administrationMethod: m.id })}
                                    className={`rounded-md border p-3 text-left ${on ? "border-teal-500/40 bg-teal-500/5" : "hover:bg-muted/40"}`}>
                                    <span className="text-xs font-semibold">{m.label}</span>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">{m.blurb}</p>
                                </button>
                            )
                        })}
                    </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="flex items-start gap-2 rounded-md border p-2.5">
                            <Switch checked={config.isVaccine ?? false}
                                onCheckedChange={v => onChange({ isVaccine: v })} />
                            <span>
                                <span className="block text-xs font-medium">This is a vaccine</span>
                                <span className="block text-[11px] text-muted-foreground">
                                    Vaccines are administered but never sold as a plan.
                                </span>
                            </span>
                        </label>
                        <Num label="Session duration (minutes)" value={config.sessionDurationMinutes}
                            onSet={n => onChange({ sessionDurationMinutes: n })} />
                        {iv && (
                            <div className="rounded-md border p-2.5">
                                <label className="flex items-center gap-2">
                                    <Switch checked={config.slowDripAvailable ?? false}
                                        onCheckedChange={v => onChange({ slowDripAvailable: v })} />
                                    <span className="text-xs font-medium">Offer slow drip</span>
                                </label>
                                {config.slowDripAvailable && (
                                    <div className="mt-2">
                                        <Label className="text-[11px]">Slow-drip surcharge</Label>
                                        <Input type="number" className="h-8 text-xs" value={config.slowDripSurcharge ?? ""}
                                            placeholder="added to every plan price"
                                            onChange={e => onChange({
                                                slowDripSurcharge: e.target.value === "" ? undefined : Number(e.target.value),
                                            })} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {config.isVaccine && (
                        <p className="rounded-md border border-dashed bg-muted/10 p-2.5 text-[11px] text-muted-foreground">
                            Marked as a vaccine — plans below are not required, and this listing is excluded from
                            course/group offers.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* ── dosage axis ── */}
            <Card>
                <CardHeader className="py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <span className="text-sm font-semibold">Dosage options</span>
                            <p className="text-xs text-muted-foreground">
                                The <strong>Select Dosage</strong> row on the product page. A plan can be tied to one
                                dose, or left open to all of them.
                            </p>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs"
                            onClick={() => setDoses([...doses, {
                                id: rid(), labelEn: "", isActive: true,
                            }])}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Add dose
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-1.5 pt-0">
                    {doses.length === 0 ? (
                        <p className="rounded-md border border-dashed bg-muted/10 px-3 py-3 text-center text-[11px] text-muted-foreground">
                            No doses yet. Add 250mg / 500mg (or equivalent) if this treatment is sold at more than one
                            strength.
                        </p>
                    ) : doses.map(d => (
                        <div key={d.id} className="grid grid-cols-[1fr_1fr_110px_auto_auto] items-center gap-2">
                            <Input className="h-8 text-xs" placeholder="e.g. 250mg" value={d.labelEn}
                                onChange={e => setDoses(doses.map(x => x.id === d.id ? { ...x, labelEn: e.target.value } : x))} />
                            <Input dir="rtl" className="h-8 text-right text-xs" placeholder="الجرعة" value={d.labelAr ?? ""}
                                onChange={e => setDoses(doses.map(x => x.id === d.id ? { ...x, labelAr: e.target.value } : x))} />
                            <Input type="number" className="h-8 text-xs" placeholder="ml" value={d.volumeMl ?? ""}
                                onChange={e => setDoses(doses.map(x => x.id === d.id
                                    ? { ...x, volumeMl: e.target.value === "" ? undefined : Number(e.target.value) } : x))} />
                            <label className="flex items-center gap-1.5">
                                <Switch checked={d.isActive}
                                    onCheckedChange={v => setDoses(doses.map(x => x.id === d.id ? { ...x, isActive: v } : x))} />
                                <span className="text-[10px] text-muted-foreground">Active</span>
                            </label>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                onClick={() => setDoses(doses.filter(x => x.id !== d.id))}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* ── plans ── */}
            <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="py-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-indigo-600" />
                                <span className="text-sm font-semibold">Treatment plans</span>
                                {plans.length > 0 && (
                                    <Badge variant="outline" className="text-[10px]">{plans.length}</Badge>
                                )}
                            </div>
                            <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
                                The <strong>Select Package</strong> cards on the product page. A plan is a commercial
                                package, not a SKU — &ldquo;8 sessions with a coach and a free consultation&rdquo; is a
                                different offer, not a different dose. Price lives on the plan.
                            </p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs">
                                    <Plus className="mr-1 h-3.5 w-3.5" /> Add plan
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-72">
                                <DropdownMenuLabel className="text-xs">What kind of plan?</DropdownMenuLabel>
                                {TREATMENT_PLAN_KINDS.filter(k => !k.ivOnly || iv).map(k => (
                                    <DropdownMenuItem key={k.id} className="flex-col items-start gap-0.5 py-1.5"
                                        onClick={() => addPlan(k.id)}>
                                        <span className="text-xs font-medium">{k.label}</span>
                                        <span className="text-[10px] text-muted-foreground">{k.blurb}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0">
                    {countries.length === 0 ? (
                        <div className="flex gap-2 rounded-md border border-dashed bg-muted/10 p-3 text-xs">
                            <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <p>Enable a country in <strong>Country Availability &amp; Config</strong> first — plan
                                pricing is per country.</p>
                        </div>
                    ) : country && (
                        <CountrySwitcher countries={countries} value={country} onChange={setCountry} />
                    )}

                    {plans.length === 0 && (
                        <p className="rounded-md border-2 border-dashed bg-muted/10 px-3 py-5 text-center text-xs text-muted-foreground">
                            No plans yet. Most IV listings start with a Single session, then add a Group session and a
                            multi-session plan.
                        </p>
                    )}

                    {plans.map(plan => {
                        const meta = TREATMENT_PLAN_KINDS.find(k => k.id === plan.kind)!
                        const isOpen = open === plan.id
                        const own = country ? plan.pricing.find(p => p.country === country && !p.cityId) : undefined
                        const eff = country ? planPrice(plan, country) : undefined
                        const pct = planDiscountPct(eff)
                        return (
                            <div key={plan.id} className={`overflow-hidden rounded-md border ${plan.isActive ? "" : "opacity-60"}`}>
                                <div className="flex flex-wrap items-center gap-2 bg-muted/20 px-3 py-2">
                                    <button type="button" className="flex flex-1 items-center gap-2 text-left"
                                        onClick={() => setOpen(isOpen ? null : plan.id)}>
                                        <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                                        <span className="text-xs font-medium">{plan.labelEn || meta.label}</span>
                                        <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                                        {plan.kind === "course" && plan.sessionCount && (
                                            <span className="text-[11px] text-muted-foreground">{plan.sessionCount} sessions</span>
                                        )}
                                        {plan.kind === "group" && plan.bagCount && (
                                            <span className="text-[11px] text-muted-foreground">{plan.bagCount} bags</span>
                                        )}
                                        {plan.coachRecommended && (
                                            <Badge variant="outline" className="border-violet-200 bg-violet-100 text-[10px] text-violet-700">
                                                Coach recommended
                                            </Badge>
                                        )}
                                        {eff?.price !== undefined && (
                                            <span className="ml-1 text-[11px]">
                                                <strong>{finalPlanPrice(eff, "normal", config.slowDripSurcharge)}</strong>
                                                {pct !== undefined && <span className="ml-1 text-green-700">{pct}% off</span>}
                                            </span>
                                        )}
                                    </button>
                                    <label className="flex items-center gap-1.5">
                                        <Switch checked={plan.isActive}
                                            onCheckedChange={v => patchPlan(plan.id, { isActive: v })} />
                                        <span className="text-[10px] text-muted-foreground">Offered</span>
                                    </label>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                                        onClick={() => setPlans(plans.filter(p => p.id !== plan.id))}>
                                        <X className="h-3.5 w-3.5" />
                                    </Button>
                                </div>

                                {isOpen && (
                                    <div className="space-y-3 p-3">
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            <div className="space-y-1">
                                                <Label className="text-[11px]">Card title (EN)</Label>
                                                <Input className="h-8 text-xs" value={plan.labelEn}
                                                    placeholder="Single session — 250mg"
                                                    onChange={e => patchPlan(plan.id, { labelEn: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px]">Sub-title (EN)</Label>
                                                <Input className="h-8 text-xs" value={plan.subtitleEn ?? ""}
                                                    placeholder="Standard — 500 ml"
                                                    onChange={e => patchPlan(plan.id, { subtitleEn: e.target.value })} />
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-[11px]">Dose</Label>
                                                <Select value={plan.dosageOptionId ?? "any"}
                                                    onValueChange={v => patchPlan(plan.id, {
                                                        dosageOptionId: v === "any" ? undefined : v,
                                                    })}>
                                                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="any">Any active dose</SelectItem>
                                                        {doses.filter(d => d.isActive).map(d => (
                                                            <SelectItem key={d.id} value={d.id}>
                                                                {d.labelEn || "(unnamed)"}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* kind-specific shape */}
                                        <div className="grid gap-3 sm:grid-cols-4">
                                            {(plan.kind === "couple" || plan.kind === "group") && (
                                                <Num label="People in the visit" value={plan.attendees}
                                                    onSet={n => patchPlan(plan.id, { attendees: n })} />
                                            )}
                                            {plan.kind === "group" && iv && (
                                                <Num label="IV bags" value={plan.bagCount}
                                                    onSet={n => patchPlan(plan.id, { bagCount: n })} />
                                            )}
                                            {plan.kind === "course" && (
                                                <>
                                                    <Num label="Sessions" value={plan.sessionCount}
                                                        onSet={n => patchPlan(plan.id, { sessionCount: n })} />
                                                    <Num label="Valid for (days)" value={plan.validityDays}
                                                        onSet={n => patchPlan(plan.id, { validityDays: n })} />
                                                </>
                                            )}
                                            {iv && config.slowDripAvailable && (
                                                <div className="space-y-1">
                                                    <Label className="text-[11px]">Drip speed</Label>
                                                    <Select value={plan.dripSpeed ?? "normal"}
                                                        onValueChange={v => patchPlan(plan.id, { dripSpeed: v as "normal" | "slow" })}>
                                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="normal">Normal</SelectItem>
                                                            <SelectItem value="slow">
                                                                Slow (+{config.slowDripSurcharge ?? 0})
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>

                                        {/* pricing for the selected country */}
                                        {country && (
                                            <div className="rounded-md border bg-muted/10 p-3">
                                                <p className="mb-2 text-[11px] font-semibold">Pricing — {country}</p>
                                                <div className="grid gap-2 sm:grid-cols-5">
                                                    <Num label="Price" value={own?.price}
                                                        onSet={n => setPrice(plan, undefined, "price", n)} />
                                                    <Num label="Compare-at" value={own?.compareAtPrice}
                                                        onSet={n => setPrice(plan, undefined, "compareAtPrice", n)} />
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px]">Discount</Label>
                                                        <Select value={own?.discountType ?? "none"}
                                                            onValueChange={v => setPrice(plan, undefined, "discountType",
                                                                v === "none" ? undefined : v)}>
                                                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none">None</SelectItem>
                                                                <SelectItem value="percent">Percent</SelectItem>
                                                                <SelectItem value="fixed">Fixed</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <Num label="Value" value={own?.discountValue}
                                                        onSet={n => setPrice(plan, undefined, "discountValue", n)} />
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px]">Customer pays</Label>
                                                        <div className="flex h-8 items-center rounded-md border bg-muted/50 px-2 text-xs font-medium">
                                                            {finalPlanPrice(eff, plan.dripSpeed, config.slowDripSurcharge) ?? "—"}
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* the "35% Off" badge is derived from compare-at, never typed */}
                                                {pct !== undefined && (
                                                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                                                        Shows as <strong className="text-green-700">{pct}% off</strong> against the
                                                        compare-at price — derived, so the badge cannot disagree with the maths.
                                                    </p>
                                                )}
                                                <CityPrices plan={plan} country={country} cities={cities}
                                                    onPatch={patchPlan} />
                                            </div>
                                        )}

                                        <Separator />

                                        {/* plan card merchandising */}
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label className="text-[11px]">Benefit bullets</Label>
                                                {(plan.benefitsEn ?? []).map((b, i) => (
                                                    <div key={i} className="flex gap-1.5">
                                                        <Input className="h-8 text-xs" value={b}
                                                            placeholder="e.g. 8 IV sessions at the lowest price"
                                                            onChange={e => patchPlan(plan.id, {
                                                                benefitsEn: (plan.benefitsEn ?? []).map((x, j) => j === i ? e.target.value : x),
                                                            })} />
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                                            onClick={() => patchPlan(plan.id, {
                                                                benefitsEn: (plan.benefitsEn ?? []).filter((_, j) => j !== i),
                                                            })}>
                                                            <X className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button size="sm" variant="outline" className="h-7 text-xs"
                                                    onClick={() => patchPlan(plan.id, {
                                                        benefitsEn: [...(plan.benefitsEn ?? []), ""],
                                                    })}>
                                                    <Plus className="mr-1 h-3 w-3" /> Add bullet
                                                </Button>
                                                <div className="space-y-1 pt-1">
                                                    <Label className="flex items-center gap-1 text-[11px]">
                                                        <Gift className="h-3 w-3" /> Bundled gift
                                                    </Label>
                                                    <Input className="h-8 text-xs" value={plan.giftEn ?? ""}
                                                        placeholder="Free Marine Collagen supplement"
                                                        onChange={e => patchPlan(plan.id, { giftEn: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <ImageField preset="square" value={plan.imageUrl ?? ""}
                                                    label="Plan card image"
                                                    onChange={url => patchPlan(plan.id, { imageUrl: url })} />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px]">Clinician</Label>
                                                        <Input className="h-8 text-xs" value={plan.clinicianName ?? ""}
                                                            placeholder="Dr Kinza Javaid"
                                                            onChange={e => patchPlan(plan.id, { clinicianName: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[11px]">Their role</Label>
                                                        <Input className="h-8 text-xs" value={plan.clinicianRole ?? ""}
                                                            placeholder="General Physician"
                                                            onChange={e => patchPlan(plan.id, { clinicianRole: e.target.value })} />
                                                    </div>
                                                </div>
                                                <Num label="Users benefited (social proof)" value={plan.socialProofCount}
                                                    onSet={n => patchPlan(plan.id, { socialProofCount: n })} />
                                                <div className="flex flex-wrap gap-3 pt-1">
                                                    {([
                                                        ["coachRecommended", "Coach recommended"],
                                                        ["includesConsultation", "Free consultation"],
                                                        ["flexibleRescheduling", "Flexible re-scheduling"],
                                                    ] as const).map(([key, label]) => (
                                                        <label key={key} className="flex items-center gap-1.5">
                                                            <Switch checked={!!plan[key]}
                                                                onCheckedChange={v => patchPlan(plan.id, { [key]: v })} />
                                                            <span className="text-[11px]">{label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>
        </div>
    )
}

/** City price overrides for one plan, in the selected country. */
function CityPrices({ plan, country, cities, onPatch }: {
    plan: TreatmentPlan; country: Country; cities: City[]
    onPatch: (id: string, p: Partial<TreatmentPlan>) => void
}) {
    const mine = plan.pricing.filter(p => p.country === country && p.cityId)
    const available = cities.filter(c => c.country === country && !mine.some(m => m.cityId === c.id))
    return (
        <div className="mt-3 border-t pt-2">
            <div className="mb-1.5 flex items-center justify-between">
                <p className="text-[11px] font-semibold">City price overrides</p>
                {available.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                <Plus className="mr-1 h-3 w-3" /> Add city
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {available.map(c => (
                                <DropdownMenuItem key={c.id} className="text-xs"
                                    onClick={() => onPatch(plan.id, {
                                        pricing: [...plan.pricing, { country, cityId: c.id }],
                                    })}>
                                    {c.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            {mine.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                    None — every city in {country} uses the price above.
                </p>
            ) : mine.map(p => (
                <div key={p.cityId} className="mb-1.5 flex items-center gap-2">
                    <span className="w-24 text-[11px]">{cities.find(c => c.id === p.cityId)?.name}</span>
                    <Input type="number" className="h-7 w-24 text-xs" placeholder="price" value={p.price ?? ""}
                        onChange={e => onPatch(plan.id, {
                            pricing: plan.pricing.map(x => x === p
                                ? { ...x, price: e.target.value === "" ? undefined : Number(e.target.value) } : x),
                        })} />
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                        onClick={() => onPatch(plan.id, { pricing: plan.pricing.filter(x => x !== p) })}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            ))}
        </div>
    )
}
