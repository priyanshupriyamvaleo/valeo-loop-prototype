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
import { Plus, X, TestTube, Check } from "lucide-react"
import { ApiService } from "@/services/api"
import { DiagnosticsConfig, DiagnosticsTier, SampleKind } from "@/types"
import { DIAGNOSTICS_TIERS, SAMPLE_KINDS } from "@/lib/diagnostics"

/**
 * The Diagnostics-specific fields carried over from Package Management. Which
 * ones show depends on the tier — a mini package has no "allow mini additions",
 * and a proper panel has no mini category.
 */
export function DiagnosticsPackageFields({ config, onChange, subDepartmentName }: {
    config: DiagnosticsConfig
    onChange: (patch: Partial<DiagnosticsConfig>) => void
    subDepartmentName?: string
}) {
    const [minis, setMinis] = useState<{ id: string; nameEn: string }[]>([])
    useEffect(() => { ApiService.catalogue.miniPackages().then(setMinis) }, [])

    const isMini = config.tier === "mini"
    const samples = config.sampleTypes ?? []
    const excluded = config.excludedMiniPackageIds ?? []
    const unusedSamples = SAMPLE_KINDS.filter(s => !samples.some(x => x.kind === s.id))

    const addSample = (kind: SampleKind) =>
        onChange({ sampleTypes: [...samples, { kind, units: 1 }] })
    const patchSample = (kind: SampleKind, units: number | undefined) =>
        onChange({ sampleTypes: samples.map(s => (s.kind === kind ? { ...s, units } : s)) })

    return (
        <div className="space-y-4">
            {/* ── package type ── */}
            <Card className="border-l-4 border-l-violet-500">
                <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                        <TestTube className="h-4 w-4 text-violet-600" />
                        <span className="text-sm font-semibold">Package type</span>
                        <Badge variant="outline" className="text-[10px]">
                            {DIAGNOSTICS_TIERS.find(t => t.id === config.tier)?.label ?? "not set"}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid gap-3 sm:grid-cols-2">
                        {DIAGNOSTICS_TIERS.map(t => {
                            const on = config.tier === t.id
                            return (
                                <button key={t.id} type="button" onClick={() => onChange({ tier: t.id as DiagnosticsTier })}
                                    className={`rounded-md border p-3 text-left transition-colors ${on ? "border-violet-500/40 bg-violet-500/5" : "hover:bg-muted/40"}`}>
                                    <div className="flex items-center gap-2">
                                        <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${on ? "bg-violet-600 text-white" : ""}`}>
                                            {on && <Check className="h-2.5 w-2.5" />}
                                        </span>
                                        <span className="text-xs font-semibold">{t.label}</span>
                                    </div>
                                    <p className="mt-1 text-[11px] text-muted-foreground">{t.blurb}</p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">{t.detail}</p>
                                </button>
                            )
                        })}
                    </div>
                    {config.tier === "proper" && (
                        <p className="mt-2 text-[11px] text-muted-foreground">
                            Which kind of proper package this is comes from the sub-department
                            {subDepartmentName ? <> — currently <strong>{subDepartmentName}</strong></> : <> (Blood Tests,
                                Non-Blood Tests or Genomics)</>}. Change it in Classification rather than here, so
                            the taxonomy stays the single source of truth.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* ── collection & lab ── */}
            <Card>
                <CardHeader className="py-3">
                    <span className="text-sm font-semibold">Collection &amp; reporting</span>
                    <p className="text-xs text-muted-foreground">
                        What is collected, how the customer must prepare, and how long the report takes. Country and
                        city overrides for lab and report days live in the slots section.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4 pt-0">
                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <Label className="text-xs">Sample types</Label>
                            {unusedSamples.length > 0 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                            <Plus className="mr-1 h-3 w-3" /> Add sample
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel className="text-xs">What is collected?</DropdownMenuLabel>
                                        {unusedSamples.map(s => (
                                            <DropdownMenuItem key={s.id} className="text-xs"
                                                onClick={() => addSample(s.id)}>{s.label}</DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                        {samples.length === 0 ? (
                            <p className="rounded-md border border-dashed bg-muted/10 px-3 py-3 text-center text-[11px] text-muted-foreground">
                                No sample type set. Required — it drives courier handling and lab routing.
                            </p>
                        ) : (
                            <div className="space-y-1.5">
                                {samples.map(s => (
                                    <div key={s.kind} className="flex items-center gap-2 rounded border px-2 py-1.5">
                                        <span className="w-20 text-[11px] font-medium">
                                            {SAMPLE_KINDS.find(x => x.id === s.kind)?.label}
                                        </span>
                                        <Label className="text-[11px] text-muted-foreground">Units</Label>
                                        <Input type="number" className="h-7 w-20 text-xs" value={s.units ?? ""}
                                            onChange={e => patchSample(s.kind, e.target.value === "" ? undefined : Number(e.target.value))} />
                                        <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 text-destructive"
                                            onClick={() => onChange({ sampleTypes: samples.filter(x => x.kind !== s.kind) })}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <Separator />

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Fasting required</Label>
                            <div className="flex h-8 items-center gap-2">
                                <Switch checked={config.fastingRequired ?? false}
                                    onCheckedChange={v => onChange({
                                        fastingRequired: v,
                                        fastingHours: v ? (config.fastingHours ?? 10) : undefined,
                                    })} />
                                <span className="text-[11px] text-muted-foreground">
                                    {config.fastingRequired ? "Yes" : "No"}
                                </span>
                            </div>
                        </div>
                        {config.fastingRequired && (
                            <div className="space-y-1">
                                <Label className="text-xs">Fasting time <span className="text-muted-foreground">(hours)</span></Label>
                                <Input type="number" className="h-8 text-xs" value={config.fastingHours ?? ""}
                                    onChange={e => onChange({ fastingHours: e.target.value === "" ? undefined : Number(e.target.value) })} />
                            </div>
                        )}
                        <div className="space-y-1">
                            <Label className="text-xs">Provider tag</Label>
                            <Input className="h-8 text-xs" value={config.providerTag ?? ""}
                                placeholder="routes to a provider pool"
                                onChange={e => onChange({ providerTag: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                        <div className="space-y-1">
                            <Label className="text-xs">Report days min</Label>
                            <Input type="number" className="h-8 text-xs" value={config.reportDaysMin ?? ""}
                                onChange={e => onChange({ reportDaysMin: e.target.value === "" ? undefined : Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Report days max</Label>
                            <Input type="number" className="h-8 text-xs" value={config.reportDaysMax ?? ""}
                                onChange={e => onChange({ reportDaysMax: e.target.value === "" ? undefined : Number(e.target.value) })} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Home appointment</Label>
                            <div className="flex h-8 items-center gap-2">
                                <Switch checked={config.homeAppointment ?? false}
                                    onCheckedChange={v => onChange({ homeAppointment: v })} />
                                <span className="text-[11px] text-muted-foreground">
                                    {config.homeAppointment ? "Nurse visits" : "Walk-in / clinic"}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Couple booking</Label>
                            <div className="flex h-8 items-center gap-2">
                                <Switch checked={config.allowCoupleBooking ?? false}
                                    onCheckedChange={v => onChange({ allowCoupleBooking: v })} />
                                <span className="text-[11px] text-muted-foreground">
                                    {config.allowCoupleBooking ? "Two people, one visit" : "Single person"}
                                </span>
                            </div>
                        </div>
                        {config.allowCoupleBooking && (
                            <div className="space-y-1">
                                <Label className="text-xs">Couple surcharge</Label>
                                <Input type="number" className="h-8 text-xs" value={config.coupleBookingSurcharge ?? ""}
                                    onChange={e => onChange({
                                        coupleBookingSurcharge: e.target.value === "" ? undefined : Number(e.target.value),
                                    })} />
                            </div>
                        )}
                        {config.homeAppointment && (
                            <div className="space-y-1">
                                <Label className="text-xs">Visit duration <span className="text-muted-foreground">(hours)</span></Label>
                                <Input type="number" className="h-8 text-xs" value={config.durationHours ?? ""}
                                    onChange={e => onChange({ durationHours: e.target.value === "" ? undefined : Number(e.target.value) })} />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* ── tier-specific ── */}
            <Card>
                <CardHeader className="py-3">
                    <span className="text-sm font-semibold">
                        {isMini ? "Mini package settings" : "Panel settings"}
                    </span>
                    <p className="text-xs text-muted-foreground">
                        {isMini
                            ? "How this mini appears on its own and when offered alongside a panel."
                            : "What may be added to this panel at checkout."}
                    </p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    {isMini ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Doses / instructions (EN)</Label>
                                <Input className="h-8 text-xs" value={config.dosesEn ?? ""}
                                    placeholder="e.g. Single draw, no preparation"
                                    onChange={e => onChange({ dosesEn: e.target.value })} />
                            </div>
                            <div className="space-y-1" dir="rtl">
                                <Label className="text-xs">التعليمات (AR)</Label>
                                <Input className="h-8 text-right text-xs" value={config.dosesAr ?? ""}
                                    onChange={e => onChange({ dosesAr: e.target.value })} />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <label className="flex items-start gap-2 rounded-md border p-3">
                                    <Switch checked={config.allowMiniPackageAddition ?? false}
                                        onCheckedChange={v => onChange({ allowMiniPackageAddition: v })} />
                                    <span>
                                        <span className="block text-xs font-medium">Allow mini packages to be added</span>
                                        <span className="block text-[11px] text-muted-foreground">
                                            Customers can bolt individual tests onto this panel at checkout.
                                        </span>
                                    </span>
                                </label>
                                <label className="flex items-start gap-2 rounded-md border p-3">
                                    <Switch checked={config.allowNonBloodBiomarkerAddition ?? false}
                                        onCheckedChange={v => onChange({ allowNonBloodBiomarkerAddition: v })} />
                                    <span>
                                        <span className="block text-xs font-medium">Allow non-blood tests to be added</span>
                                        <span className="block text-[11px] text-muted-foreground">
                                            Urine, stool or swab add-ons alongside the blood draw.
                                        </span>
                                    </span>
                                </label>
                            </div>

                            {config.allowMiniPackageAddition && (
                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <Label className="text-xs">Excluded mini packages</Label>
                                        {minis.length > 0 && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                                        <Plus className="mr-1 h-3 w-3" /> Exclude a mini
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
                                                    {minis.filter(m => !excluded.includes(m.id)).map(m => (
                                                        <DropdownMenuItem key={m.id} className="text-xs"
                                                            onClick={() => onChange({ excludedMiniPackageIds: [...excluded, m.id] })}>
                                                            {m.nameEn}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                    {excluded.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground">
                                            None excluded. Exclude a mini whose markers this panel already covers —
                                            otherwise the customer pays twice for the same test.
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {excluded.map(id => (
                                                <Badge key={id} variant="outline" className="gap-1 py-1 text-[11px]">
                                                    {minis.find(m => m.id === id)?.nameEn ?? id}
                                                    <button type="button"
                                                        onClick={() => onChange({ excludedMiniPackageIds: excluded.filter(x => x !== id) })}>
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
