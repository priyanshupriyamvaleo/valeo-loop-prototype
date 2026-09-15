"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, CalendarClock, Info, Zap } from "lucide-react"
import { ApiService } from "@/services/api"
import {
    City, Country, DiagnosticsConfig, DiagnosticsLab, DiagnosticsServiceOption,
    DiagnosticsSlotMapping, SlotGroup,
} from "@/types"
import {
    citySlots, countryDefaultSlot, finalServicePrice, SERVICE_KINDS, servicePrice,
    withDefaultServiceOptions,
} from "@/lib/diagnostics"
import { CountrySwitcher } from "@/components/catalogue/CountrySwitcher"

const rid = () => Math.random().toString(36).slice(2, 9)

/**
 * One country at a time. Diagnostics config is deep — service options, their
 * pricing, slot groups, city overrides — and stacking every country vertically
 * made the section unreadable. The switcher makes country the frame.
 */
export function DiagnosticsSlots({ config, onChange, countries }: {
    config: DiagnosticsConfig
    onChange: (patch: Partial<DiagnosticsConfig>) => void
    countries: Country[]
}) {
    const [cities, setCities] = useState<City[]>([])
    const [groups, setGroups] = useState<SlotGroup[]>([])
    const [labs, setLabs] = useState<DiagnosticsLab[]>([])
    const [country, setCountry] = useState<Country | null>(countries[0] ?? null)

    useEffect(() => {
        ApiService.catalogue.cities().then(setCities)
        ApiService.catalogue.slotGroups().then(setGroups)
        ApiService.catalogue.diagnosticsLabs().then(setLabs)
    }, [])
    useEffect(() => {
        if (!country || !countries.includes(country)) setCountry(countries[0] ?? null)
    }, [countries, country])

    const options = withDefaultServiceOptions(config)
    const rows = config.slotMappings ?? []
    const setRows = (next: DiagnosticsSlotMapping[]) => onChange({ slotMappings: next })
    const patchRow = (id: string, p: Partial<DiagnosticsSlotMapping>) =>
        setRows(rows.map(r => (r.id === id ? { ...r, ...p } : r)))

    const setOption = (kind: string, patch: Partial<DiagnosticsServiceOption>) =>
        onChange({
            serviceOptions: options.map(o => (o.kind === kind ? { ...o, ...patch } : o)),
        })
    const setPrice = (kind: string, cityId: string | undefined, field: string, value: number | string | undefined) => {
        const opt = options.find(o => o.kind === kind)!
        const existing = opt.pricing.find(p => p.country === country && p.cityId === cityId)
        const next = existing
            ? opt.pricing.map(p => (p === existing ? { ...p, [field]: value } : p))
            : [...opt.pricing, { country: country!, cityId, [field]: value }]
        setOption(kind, { pricing: next })
    }

    if (countries.length === 0) {
        return (
            <Card>
                <CardContent className="flex gap-2 p-4 text-xs">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p>Enable a country in <strong>Country Availability &amp; Config</strong> first — service
                        options, pricing and slots are all defined per country.</p>
                </CardContent>
            </Card>
        )
    }
    if (!country) return null

    const countryRow = countryDefaultSlot(config, country)
    const kids = citySlots(config, country)
    const countryCities = cities.filter(c => c.country === country)

    const Num = ({ label, value, onSet, ph, suffix }: {
        label: string; value?: number; onSet: (n: number | undefined) => void; ph?: string; suffix?: string
    }) => (
        <div className="space-y-1">
            <Label className="text-[11px]">{label}{suffix && <span className="text-muted-foreground"> ({suffix})</span>}</Label>
            <Input type="number" className="h-8 text-xs" value={value ?? ""} placeholder={ph}
                onChange={e => onSet(e.target.value === "" ? undefined : Number(e.target.value))} />
        </div>
    )

    /** Price block for one service option, at country or city scope. */
    const PriceRow = ({ opt, cityId }: { opt: DiagnosticsServiceOption; cityId?: string }) => {
        const own = opt.pricing.find(p => p.country === country && p.cityId === cityId)
        const eff = servicePrice(opt, country, cityId)
        const base = cityId ? servicePrice(opt, country) : undefined
        return (
            <div className="grid gap-2 sm:grid-cols-5">
                <Num label="Price" value={own?.price}
                    ph={cityId && base?.price !== undefined ? `inherits ${base.price}` : "0"}
                    onSet={n => setPrice(opt.kind, cityId, "price", n)} />
                <Num label="Retail" value={own?.retailPrice}
                    ph={cityId && base?.retailPrice !== undefined ? `inherits ${base.retailPrice}` : "0"}
                    onSet={n => setPrice(opt.kind, cityId, "retailPrice", n)} />
                <div className="space-y-1">
                    <Label className="text-[11px]">Discount</Label>
                    <Select value={own?.discountType ?? "none"}
                        onValueChange={v => setPrice(opt.kind, cityId, "discountType", v === "none" ? undefined : v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="percent">Percent</SelectItem>
                            <SelectItem value="fixed">Fixed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Num label="Value" value={own?.discountValue}
                    onSet={n => setPrice(opt.kind, cityId, "discountValue", n)} />
                <div className="space-y-1">
                    <Label className="text-[11px]">Final</Label>
                    {/* derived, so no one keys a final price that disagrees with the maths */}
                    <div className="flex h-8 items-center rounded-md border bg-muted/50 px-2 text-xs font-medium">
                        {finalServicePrice(eff) ?? "—"}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <CountrySwitcher countries={countries} value={country} onChange={setCountry} />

            {/* ── Standard / Fast Track ── */}
            <Card className="border-l-4 border-l-amber-500">
                <CardHeader className="py-3">
                    <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-semibold">Service options — {country}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Standard and Fast Track are <strong>service options, not variants</strong> — the same panel on
                        a different turnaround. Price is defined here, per option, per country.
                    </p>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    {options.map(opt => {
                        const meta = SERVICE_KINDS.find(k => k.id === opt.kind)!
                        return (
                            <div key={opt.kind} className={`rounded-md border ${opt.isActive ? "" : "opacity-60"}`}>
                                <div className="flex items-center gap-2 border-b bg-muted/20 px-3 py-2">
                                    <span className="text-xs font-medium">{opt.labelEn}</span>
                                    <span className="text-[11px] text-muted-foreground">{meta.blurb}</span>
                                    {finalServicePrice(servicePrice(opt, country)) !== undefined && (
                                        <Badge variant="outline" className="text-[10px]">
                                            {finalServicePrice(servicePrice(opt, country))}
                                        </Badge>
                                    )}
                                    <label className="ml-auto flex items-center gap-1.5">
                                        <Switch checked={opt.isActive}
                                            onCheckedChange={v => setOption(opt.kind, { isActive: v })} />
                                        <span className="text-[11px] text-muted-foreground">Offered</span>
                                    </label>
                                </div>
                                {opt.isActive && (
                                    <div className="space-y-3 p-3">
                                        <PriceRow opt={opt} />
                                        <div className="grid gap-2 sm:grid-cols-3">
                                            <Num label="Report days min" value={opt.reportDaysMin}
                                                onSet={n => setOption(opt.kind, { reportDaysMin: n })} />
                                            <Num label="Report days max" value={opt.reportDaysMax}
                                                onSet={n => setOption(opt.kind, { reportDaysMax: n })} />
                                            <div className="space-y-1">
                                                <Label className="text-[11px]">Label shown to customers</Label>
                                                <Input className="h-8 text-xs" value={opt.labelEn}
                                                    onChange={e => setOption(opt.kind, { labelEn: e.target.value })} />
                                            </div>
                                        </div>
                                        {/* Fast Track sometimes runs fewer markers than Standard — the live
                                            data has a CBC at 20 standard vs 15 fast-track. */}
                                        {opt.kind === "fast_track" && (
                                            <p className="text-[11px] text-muted-foreground">
                                                {(opt.droppedBiomarkerIds ?? []).length > 0
                                                    ? `Omits ${(opt.droppedBiomarkerIds ?? []).length} marker(s) versus the mapped set.`
                                                    : "Runs the same markers as the mapped set. If the lab cannot fast-track certain markers, record them as omitted."}
                                            </p>
                                        )}

                                        {/* city price overrides for this option */}
                                        {countryCities.length > 0 && (
                                            <div className="rounded-md border bg-muted/5 p-2">
                                                <p className="mb-1.5 text-[11px] font-semibold">City price overrides</p>
                                                {opt.pricing.filter(p => p.country === country && p.cityId).length === 0 ? (
                                                    <p className="text-[11px] text-muted-foreground">
                                                        None — every city uses the {country} price above.
                                                    </p>
                                                ) : opt.pricing.filter(p => p.country === country && p.cityId).map(p => (
                                                    <div key={p.cityId} className="mb-2 rounded border bg-background p-2">
                                                        <div className="mb-1.5 flex items-center gap-2">
                                                            <span className="text-[11px] font-medium">
                                                                {countryCities.find(c => c.id === p.cityId)?.name ?? p.cityId}
                                                            </span>
                                                            <Button variant="ghost" size="icon"
                                                                className="ml-auto h-5 w-5 text-destructive"
                                                                onClick={() => setOption(opt.kind, {
                                                                    pricing: opt.pricing.filter(x => x !== p),
                                                                })}>
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <PriceRow opt={opt} cityId={p.cityId} />
                                                    </div>
                                                ))}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                                            <Plus className="mr-1 h-3 w-3" /> Add city price
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="start">
                                                        {countryCities
                                                            .filter(c => !opt.pricing.some(p => p.country === country && p.cityId === c.id))
                                                            .map(c => (
                                                                <DropdownMenuItem key={c.id} className="text-xs"
                                                                    onClick={() => setOption(opt.kind, {
                                                                        pricing: [...opt.pricing, { country, cityId: c.id }],
                                                                    })}>
                                                                    {c.name}
                                                                </DropdownMenuItem>
                                                            ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {/* ── Nurse slots ── */}
            <Card className="border-l-4 border-l-sky-500">
                <CardHeader className="py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <CalendarClock className="h-4 w-4 text-sky-600" />
                                <span className="text-sm font-semibold">Nurse booking slots — {country}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                A country default, overridden only in cities that differ. Slot groups come from the
                                Order Service and are city-scoped.
                            </p>
                        </div>
                        {!countryRow && (
                            <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs"
                                onClick={() => setRows([...rows, { id: rid(), country, isActive: true }])}>
                                <Plus className="mr-1 h-3.5 w-3.5" /> Configure {country}
                            </Button>
                        )}
                    </div>
                </CardHeader>
                {countryRow && (
                    <CardContent className="space-y-3 pt-0">
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-[11px]">Slot group</Label>
                                <Select value={countryRow.slotGroupId ?? ""}
                                    onValueChange={v => {
                                        const g = groups.find(x => x.groupId === v)
                                        patchRow(countryRow.id, {
                                            slotGroupId: v, slotGroupName: g?.groupName,
                                            leadTimeMinutes: countryRow.leadTimeMinutes ?? g?.leadTimeMinutes,
                                        })
                                    }}>
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Pick a slot group" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {groups.filter(g => !g.cityId).map(g => (
                                            <SelectItem key={g.groupId} value={g.groupId}>
                                                {g.groupName} · national
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Num label="Lead time" suffix="minutes" value={countryRow.leadTimeMinutes}
                                onSet={n => patchRow(countryRow.id, { leadTimeMinutes: n })} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-4">
                            <div className="space-y-1">
                                <Label className="text-[11px]">Default lab</Label>
                                <Select value={countryRow.defaultLabId ?? ""}
                                    onValueChange={v => patchRow(countryRow.id, { defaultLabId: v })}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick a lab" /></SelectTrigger>
                                    <SelectContent>
                                        {labs.filter(l => l.country === country).map(l => (
                                            <SelectItem key={l.id} value={l.id}>{l.nameEn}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Num label="Order SLA" suffix="hrs" value={countryRow.orderSlaHours}
                                onSet={n => patchRow(countryRow.id, { orderSlaHours: n })} />
                            <Num label="Coach SLA" suffix="hrs" value={countryRow.coachSlaHours}
                                onSet={n => patchRow(countryRow.id, { coachSlaHours: n })} />
                            <Num label="Ops SLA" suffix="hrs" value={countryRow.operationsSlaHours}
                                onSet={n => patchRow(countryRow.id, { operationsSlaHours: n })} />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1">
                                <Label className="text-[11px]">Collection window copy (EN)</Label>
                                <Input className="h-8 text-xs" value={countryRow.deliveryTimeEn ?? ""}
                                    placeholder="e.g. Same-day collection before 11am"
                                    onChange={e => patchRow(countryRow.id, { deliveryTimeEn: e.target.value })} />
                            </div>
                            <div className="space-y-1" dir="rtl">
                                <Label className="text-[11px]">نص موعد السحب (AR)</Label>
                                <Input className="h-8 text-right text-xs" value={countryRow.deliveryTimeAr ?? ""}
                                    onChange={e => patchRow(countryRow.id, { deliveryTimeAr: e.target.value })} />
                            </div>
                        </div>

                        <div className="rounded-md border bg-muted/5 p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <p className="text-[11px] font-semibold">City slot overrides</p>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline" className="h-6 text-[10px]">
                                            <Plus className="mr-1 h-3 w-3" /> Add city
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        {countryCities.filter(c => !kids.some(k => k.cityId === c.id)).map(c => (
                                            <DropdownMenuItem key={c.id} className="text-xs"
                                                onClick={() => setRows([...rows, {
                                                    id: rid(), country, cityId: c.id, isActive: true,
                                                }])}>
                                                {c.name}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            {kids.length === 0 ? (
                                <p className="text-[11px] text-muted-foreground">
                                    None — every city in {country} uses the country slot group above.
                                </p>
                            ) : kids.map(k => (
                                <div key={k.id} className="mb-2 rounded border bg-background p-2">
                                    <div className="mb-1.5 flex items-center gap-2">
                                        <span className="text-[11px] font-medium">
                                            {countryCities.find(c => c.id === k.cityId)?.name ?? k.cityId}
                                        </span>
                                        <label className="ml-auto flex items-center gap-1.5">
                                            <Switch checked={k.isActive}
                                                onCheckedChange={v => patchRow(k.id, { isActive: v })} />
                                            <span className="text-[10px] text-muted-foreground">Bookable</span>
                                        </label>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive"
                                            onClick={() => setRows(rows.filter(r => r.id !== k.id))}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-[11px]">Slot group</Label>
                                            <Select value={k.slotGroupId ?? ""}
                                                onValueChange={v => {
                                                    const g = groups.find(x => x.groupId === v)
                                                    patchRow(k.id, {
                                                        slotGroupId: v, slotGroupName: g?.groupName,
                                                        leadTimeMinutes: k.leadTimeMinutes ?? g?.leadTimeMinutes,
                                                    })
                                                }}>
                                                <SelectTrigger className="h-8 text-xs">
                                                    <SelectValue placeholder={countryRow.slotGroupName
                                                        ? `inherits ${countryRow.slotGroupName}` : "Pick a slot group"} />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {groups.filter(g => !g.cityId || g.cityId === k.cityId).map(g => (
                                                        <SelectItem key={g.groupId} value={g.groupId}>
                                                            {g.groupName}{!g.cityId && " · national"}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Num label="Lead time" suffix="minutes" value={k.leadTimeMinutes}
                                            ph={countryRow.leadTimeMinutes !== undefined
                                                ? `inherits ${countryRow.leadTimeMinutes}` : undefined}
                                            onSet={n => patchRow(k.id, { leadTimeMinutes: n })} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                )}
            </Card>
        </div>
    )
}
