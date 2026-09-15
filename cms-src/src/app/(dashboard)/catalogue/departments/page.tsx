"use client"

import { Fragment, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Plus, Layers, Info, ChevronRight, X } from "lucide-react"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ApiService } from "@/services/api"
import { OnboardingBanner } from "@/components/catalogue/OnboardingGuide"
import { SubDepartment, SubDepartmentCountryConfig, Department, Country, MedicineClass } from "@/types"
import { DEPARTMENTS, departmentLabel, ZOHO_BOOKS } from "@/lib/catalogue"

const COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT", "OTHERS"]
const PAYMENT_METHODS: { key: string; label: string }[] = [
    { key: "credit_card", label: "Credit / Debit Card" },
    { key: "cod", label: "Cash on Delivery" },
    { key: "paymob", label: "Paymob" },
    { key: "tabby", label: "Tabby" },
    { key: "tamara", label: "Tamara" },
    { key: "apple_pay", label: "Apple Pay" },
]
const paymentLabel = (key: string) => PAYMENT_METHODS.find(p => p.key === key)?.label ?? key
// Clinical classes that can be re-routed away from the country default
// (e.g. UAE GLP-1 → Shifa, zero-rated).
const MEDICINE_CLASSES: { key: MedicineClass; label: string }[] = [
    { key: "glp1", label: "GLP-1 / weight-loss" },
    { key: "peptide", label: "Peptide" },
    { key: "hair_loss", label: "Hair loss" },
    { key: "antibiotic", label: "Antibiotic" },
    { key: "vitamin", label: "Vitamin" },
    { key: "general_rx", label: "General Rx" },
]
const medicineClassLabel = (key: MedicineClass) =>
    MEDICINE_CLASSES.find(m => m.key === key)?.label ?? key

export default function DepartmentsPage() {
    const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    // Progressive disclosure: collapsed by default (counts stay visible on the header).
    const [openDepts, setOpenDepts] = useState<Set<string>>(new Set())
    const toggleDept = (id: string) =>
        setOpenDepts(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    const allOpen = openDepts.size === DEPARTMENTS.length
    const toggleAll = () =>
        setOpenDepts(allOpen ? new Set() : new Set(DEPARTMENTS.map(d => d.id)))

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await ApiService.catalogue.subDepartments()
                setSubDepartments(data)
            } catch (error) {
                console.error(error)
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const toggleActive = (id: string) => {
        setSubDepartments(prev =>
            prev.map(sd => (sd.id === id ? { ...sd, isActive: !sd.isActive } : sd))
        )
    }

    // Per-sub-department "VAT & Zoho org (per country)" editor — expandable row.
    const [openConfigs, setOpenConfigs] = useState<Set<string>>(new Set())
    const toggleConfig = (id: string) =>
        setOpenConfigs(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })

    // Upsert one country's VAT / Zoho routing into a sub-department's countryConfig, immutably.
    const updateCountryConfig = (
        id: string,
        country: Country,
        patch: Partial<SubDepartmentCountryConfig>
    ) => {
        setSubDepartments(prev =>
            prev.map(sd => {
                if (sd.id !== id) return sd
                const cfg = sd.countryConfig ?? []
                const exists = cfg.some(c => c.country === country)
                const nextCfg = exists
                    ? cfg.map(c => (c.country === country ? { ...c, ...patch } : c))
                    : [...cfg, { country, ...patch }]
                return { ...sd, countryConfig: nextCfg }
            })
        )
    }

    // Add / remove a country row (variant-style add flow — only configured countries show).
    const addCountryConfig = (id: string, country: Country) =>
        setSubDepartments(prev => prev.map(sd =>
            sd.id === id ? { ...sd, countryConfig: [...(sd.countryConfig ?? []), { country }] } : sd))
    const removeCountryConfig = (id: string, country: Country) =>
        setSubDepartments(prev => prev.map(sd =>
            sd.id === id ? { ...sd, countryConfig: (sd.countryConfig ?? []).filter(c => c.country !== country) } : sd))

    // Clinical-class overrides inside a country — re-route one class to another
    // Zoho book and/or VAT rate (e.g. UAE GLP-1 → Shifa, zero-rated).
    type ClassOverride = NonNullable<SubDepartmentCountryConfig["overrides"]>[number]
    const overridesOf = (sd: SubDepartment, country: Country) =>
        sd.countryConfig?.find(c => c.country === country)?.overrides ?? []
    const addOverride = (sd: SubDepartment, country: Country, medicineClass: MedicineClass) =>
        updateCountryConfig(sd.id, country, { overrides: [...overridesOf(sd, country), { medicineClass }] })
    const updateOverride = (sd: SubDepartment, country: Country, medicineClass: MedicineClass, patch: Partial<ClassOverride>) =>
        updateCountryConfig(sd.id, country, {
            overrides: overridesOf(sd, country).map(o => (o.medicineClass === medicineClass ? { ...o, ...patch } : o)),
        })
    const removeOverride = (sd: SubDepartment, country: Country, medicineClass: MedicineClass) =>
        updateCountryConfig(sd.id, country, {
            overrides: overridesOf(sd, country).filter(o => o.medicineClass !== medicineClass),
        })

    // "New Sub-department" dialog — capture name + fields before creating.
    const [addForDept, setAddForDept] = useState<Department | null>(null)
    const [subDraft, setSubDraft] = useState({ nameEn: "", nameAr: "", slug: "" })
    const resetSubDraft = () => setSubDraft({ nameEn: "", nameAr: "", slug: "" })

    const createSubDepartment = () => {
        if (!addForDept || !subDraft.nameEn.trim()) return
        const department = addForDept
        const siblings = subDepartments.filter(sd => sd.department === department)
        const nextSort = siblings.reduce((max, sd) => Math.max(max, sd.sortOrder), -1) + 1
        const newRow: SubDepartment = {
            id: `sd-new-${department}-${Date.now()}`,
            department,
            nameEn: subDraft.nameEn.trim(),
            nameAr: subDraft.nameAr.trim(),
            slug: subDraft.slug.trim() || subDraft.nameEn.trim().toLowerCase().replace(/\s+/g, "-"),
            sortOrder: nextSort,
            isActive: true,
        }
        setSubDepartments(prev => [...prev, newRow])
        setOpenDepts(prev => new Set(prev).add(department))
        resetSubDraft()
        setAddForDept(null)
    }

    return (
        <div className="space-y-4">
            <OnboardingBanner guide="department" />
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Departments</h2>
                    <p className="text-muted-foreground">
                        &ldquo;What it is&rdquo; — the canonical classification for every listing.
                    </p>
                </div>
                {!isLoading && (
                    <Button variant="outline" size="sm" onClick={toggleAll}>
                        {allOpen ? "Collapse all" : "Expand all"}
                    </Button>
                )}
            </div>

            {/* Explanatory note */}
            <Card className="border-primary/20 bg-primary/5">
                <CardContent className="flex gap-3 py-4">
                    <Info className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                            <span className="font-medium text-foreground">Department → Sub-department</span> is
                            the canonical &ldquo;what it is&rdquo; home. Every listing sits under exactly{" "}
                            <span className="font-medium text-foreground">one</span> sub-department.
                        </p>
                        <p>
                            The 5 Departments are a fixed enum and cannot be added or removed. You manage the
                            Sub-departments beneath each one.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {isLoading ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Loading departments...
                    </CardContent>
                </Card>
            ) : (
                DEPARTMENTS.map(dept => {
                    const rows = subDepartments
                        .filter(sd => sd.department === dept.id)
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                    const isOpen = openDepts.has(dept.id)
                    const activeCount = rows.filter(r => r.isActive).length
                    return (
                        <Card key={dept.id}>
                            <CardHeader className="flex flex-row items-start justify-between gap-4 py-4">
                                <button
                                    type="button"
                                    onClick={() => toggleDept(dept.id)}
                                    aria-expanded={isOpen}
                                    className="flex flex-1 items-start gap-3 text-left"
                                >
                                    <ChevronRight
                                        className={`h-5 w-5 shrink-0 mt-1 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`}
                                    />
                                    <Layers className="h-5 w-5 text-muted-foreground mt-1 shrink-0" />
                                    <div>
                                        <CardTitle className="flex flex-wrap items-center gap-2">
                                            {dept.labelEn}
                                            <span className="text-base font-normal text-muted-foreground" dir="rtl">
                                                {dept.labelAr}
                                            </span>
                                            <Badge variant="outline" className="font-mono text-xs">
                                                {dept.id}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                {rows.length} sub-department{rows.length === 1 ? "" : "s"}
                                                {rows.length > 0 && ` · ${activeCount} active`}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>{dept.blurb}</CardDescription>
                                    </div>
                                </button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => { resetSubDraft(); setAddForDept(dept.id) }}
                                >
                                    <Plus className="mr-2 h-4 w-4" /> Add Sub-department
                                </Button>
                            </CardHeader>
                            {isOpen && (
                              <>
                                <Separator />
                                <CardContent className="p-0">
                                    <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30">
                                            <TableHead>Name (EN)</TableHead>
                                            <TableHead>Name (AR)</TableHead>
                                            <TableHead>Slug</TableHead>
                                            <TableHead className="w-16">Sort</TableHead>
                                            <TableHead className="w-20">Active</TableHead>
                                            <TableHead className="w-44">VAT &amp; Zoho org</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                    No sub-departments yet for {departmentLabel(dept.id)}.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            rows.map(sd => {
                                                const cfgOpen = openConfigs.has(sd.id)
                                                return (
                                                <Fragment key={sd.id}>
                                                <TableRow>
                                                    <TableCell className="font-medium">{sd.nameEn}</TableCell>
                                                    <TableCell dir="rtl">{sd.nameAr}</TableCell>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                                        {sd.slug}
                                                    </TableCell>
                                                    <TableCell className="text-sm">{sd.sortOrder}</TableCell>
                                                    <TableCell>
                                                        <Switch
                                                            checked={sd.isActive}
                                                            onCheckedChange={() => toggleActive(sd.id)}
                                                            aria-label="Toggle active"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                            onClick={() => toggleConfig(sd.id)}
                                                            aria-expanded={cfgOpen}
                                                        >
                                                            <ChevronRight
                                                                className={`mr-1 h-3.5 w-3.5 transition-transform ${cfgOpen ? "rotate-90" : ""}`}
                                                            />
                                                            Edit VAT &amp; Zoho
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                                {cfgOpen && (
                                                    <TableRow className="bg-muted/20 hover:bg-muted/20">
                                                        <TableCell colSpan={6} className="py-3">
                                                            {(() => {
                                                                const cfg = sd.countryConfig ?? []
                                                                const available = COUNTRIES.filter(c => !cfg.some(e => e.country === c))
                                                                return (
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <p className="text-xs font-medium text-foreground">VAT &amp; Zoho routing — add the countries this sub-department sells in</p>
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={available.length === 0}>
                                                                                        <Plus className="mr-1 h-3.5 w-3.5" /> Add country
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end">
                                                                                    {available.map(c => (
                                                                                        <DropdownMenuItem key={c} onClick={() => addCountryConfig(sd.id, c)}>{c}</DropdownMenuItem>
                                                                                    ))}
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                        {cfg.length === 0 ? (
                                                                            <p className="rounded-md border border-dashed py-4 text-center text-[11px] text-muted-foreground">No countries configured — click “Add country”.</p>
                                                                        ) : (
                                                                            <div className="space-y-1.5">
                                                                                {cfg.map(entry => {
                                                                                    const ov = entry.overrides ?? []
                                                                                    const availableClasses = MEDICINE_CLASSES.filter(m => !ov.some(o => o.medicineClass === m.key))
                                                                                    // Rows created before this field existed have it undefined → treat as ON.
                                                                                    const invoicing = entry.invoicingEnabled !== false
                                                                                    return (
                                                                                    <div key={entry.country} className="rounded-md border bg-background">
                                                                                    <div className="flex flex-wrap items-center gap-2 p-2">
                                                                                        <span className="w-16 text-xs font-semibold">{entry.country}</span>
                                                                                        <Label className="text-[10px] text-muted-foreground">VAT %</Label>
                                                                                        <Input
                                                                                            type="number"
                                                                                            className="h-7 w-20 text-xs"
                                                                                            value={entry.vat ?? ""}
                                                                                            onChange={e => updateCountryConfig(sd.id, entry.country, { vat: e.target.value === "" ? undefined : Number(e.target.value) })}
                                                                                        />
                                                                                        <Label className="ml-1 text-[10px] text-muted-foreground whitespace-nowrap">VAT mode</Label>
                                                                                        <Select
                                                                                            value={entry.vatMode ?? "exclusive"}
                                                                                            onValueChange={v => updateCountryConfig(sd.id, entry.country, { vatMode: v as "exclusive" | "inclusive" })}
                                                                                        >
                                                                                            <SelectTrigger className="h-7 w-[8.5rem] text-xs"><SelectValue /></SelectTrigger>
                                                                                            <SelectContent>
                                                                                                <SelectItem value="exclusive">Exclusive</SelectItem>
                                                                                                <SelectItem value="inclusive">Inclusive</SelectItem>
                                                                                            </SelectContent>
                                                                                        </Select>
                                                                                        <DropdownMenu>
                                                                                            <DropdownMenuTrigger asChild>
                                                                                                <Button size="sm" variant="outline" className="h-7 text-xs" title={(entry.paymentMethods ?? []).map(paymentLabel).join(", ") || "No payment methods"}>
                                                                                                    Payments{entry.paymentMethods?.length ? ` (${entry.paymentMethods.length})` : ""}
                                                                                                </Button>
                                                                                            </DropdownMenuTrigger>
                                                                                            <DropdownMenuContent align="end" className="w-52">
                                                                                                <DropdownMenuLabel className="text-xs">Payment methods · {entry.country}</DropdownMenuLabel>
                                                                                                <DropdownMenuSeparator />
                                                                                                {PAYMENT_METHODS.map(pm => {
                                                                                                    const on = entry.paymentMethods?.includes(pm.key) ?? false
                                                                                                    return (
                                                                                                        <DropdownMenuCheckboxItem
                                                                                                            key={pm.key}
                                                                                                            checked={on}
                                                                                                            onSelect={e => e.preventDefault()}
                                                                                                            onCheckedChange={() => {
                                                                                                                const cur = entry.paymentMethods ?? []
                                                                                                                updateCountryConfig(sd.id, entry.country, { paymentMethods: on ? cur.filter(k => k !== pm.key) : [...cur, pm.key] })
                                                                                                            }}
                                                                                                        >
                                                                                                            {pm.label}
                                                                                                        </DropdownMenuCheckboxItem>
                                                                                                    )
                                                                                                })}
                                                                                            </DropdownMenuContent>
                                                                                        </DropdownMenu>
                                                                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeCountryConfig(sd.id, entry.country)} aria-label={`Remove ${entry.country}`}>
                                                                                            <X className="h-4 w-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                    {/* Zoho routing — which Books entity invoices this country × sub-department. */}
                                                                                    <div className="flex flex-wrap items-center gap-2 border-t px-2 py-1.5">
                                                                                        <Label className="text-[10px] text-muted-foreground whitespace-nowrap">Invoicing</Label>
                                                                                        <Switch
                                                                                            checked={invoicing}
                                                                                            onCheckedChange={val => updateCountryConfig(sd.id, entry.country, { invoicingEnabled: val })}
                                                                                            aria-label={`Invoicing for ${entry.country}`}
                                                                                        />
                                                                                        <div className={`flex flex-1 flex-wrap items-center gap-2 ${invoicing ? "" : "opacity-50"}`}>
                                                                                            <Label className="ml-1 text-[10px] text-muted-foreground whitespace-nowrap">Zoho Book</Label>
                                                                                            <Select
                                                                                                value={entry.zohoBook ?? "__unset__"}
                                                                                                disabled={!invoicing}
                                                                                                onValueChange={v => updateCountryConfig(sd.id, entry.country, { zohoBook: v === "__unset__" ? undefined : (v as SubDepartmentCountryConfig["zohoBook"]) })}
                                                                                            >
                                                                                                <SelectTrigger className="h-7 w-[13rem] text-xs"><SelectValue placeholder="Select Zoho book" /></SelectTrigger>
                                                                                                <SelectContent>
                                                                                                    <SelectItem value="__unset__">— Not set —</SelectItem>
                                                                                                    {ZOHO_BOOKS.map(b => (
                                                                                                        <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                                                                                                    ))}
                                                                                                </SelectContent>
                                                                                            </Select>
                                                                                            <Label className="ml-1 text-[10px] text-muted-foreground whitespace-nowrap">Zoho Org ID</Label>
                                                                                            <Input
                                                                                                className="h-7 min-w-[9rem] flex-1 text-xs"
                                                                                                placeholder="confirmed by finance"
                                                                                                disabled={!invoicing}
                                                                                                value={entry.zohoOrgId ?? ""}
                                                                                                onChange={e => updateCountryConfig(sd.id, entry.country, { zohoOrgId: e.target.value })}
                                                                                            />
                                                                                        </div>
                                                                                        {!invoicing && (
                                                                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">No invoicing (e.g. Qatar)</span>
                                                                                        )}
                                                                                    </div>
                                                                                    {/* Clinical-class overrides — re-route one class away from the country default. */}
                                                                                    <div className="space-y-1 border-t bg-muted/10 p-2 pl-6">
                                                                                        <div className="flex items-center justify-between gap-2">
                                                                                            <p className="text-[10px] text-muted-foreground">
                                                                                                Clinical-class overrides — e.g. UAE GLP-1 → Shifa; weight-loss medicine is zero-rated.
                                                                                            </p>
                                                                                            <DropdownMenu>
                                                                                                <DropdownMenuTrigger asChild>
                                                                                                    <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" disabled={availableClasses.length === 0}>
                                                                                                        <Plus className="mr-1 h-3.5 w-3.5" /> Add override{ov.length ? ` (${ov.length})` : ""}
                                                                                                    </Button>
                                                                                                </DropdownMenuTrigger>
                                                                                                <DropdownMenuContent align="end">
                                                                                                    <DropdownMenuLabel className="text-xs">Clinical class · {entry.country}</DropdownMenuLabel>
                                                                                                    <DropdownMenuSeparator />
                                                                                                    {availableClasses.map(m => (
                                                                                                        <DropdownMenuItem key={m.key} onClick={() => addOverride(sd, entry.country, m.key)}>{m.label}</DropdownMenuItem>
                                                                                                    ))}
                                                                                                </DropdownMenuContent>
                                                                                            </DropdownMenu>
                                                                                        </div>
                                                                                        {ov.map(o => (
                                                                                            <div key={o.medicineClass} className="flex flex-wrap items-center gap-2">
                                                                                                <span className="w-32 text-xs">{medicineClassLabel(o.medicineClass)}</span>
                                                                                                <Select
                                                                                                    value={o.zohoBook ?? "__unset__"}
                                                                                                    onValueChange={v => updateOverride(sd, entry.country, o.medicineClass, { zohoBook: v === "__unset__" ? undefined : (v as SubDepartmentCountryConfig["zohoBook"]) })}
                                                                                                >
                                                                                                    <SelectTrigger className="h-7 w-[13rem] text-xs"><SelectValue placeholder="Zoho book" /></SelectTrigger>
                                                                                                    <SelectContent>
                                                                                                        <SelectItem value="__unset__">— Inherit country —</SelectItem>
                                                                                                        {ZOHO_BOOKS.map(b => (
                                                                                                            <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                                                                                                        ))}
                                                                                                    </SelectContent>
                                                                                                </Select>
                                                                                                <Label className="text-[10px] text-muted-foreground">VAT %</Label>
                                                                                                <Input
                                                                                                    type="number"
                                                                                                    className="h-7 w-20 text-xs"
                                                                                                    placeholder={entry.vat !== undefined ? String(entry.vat) : ""}
                                                                                                    value={o.vat ?? ""}
                                                                                                    onChange={e => updateOverride(sd, entry.country, o.medicineClass, { vat: e.target.value === "" ? undefined : Number(e.target.value) })}
                                                                                                />
                                                                                                {o.note && <span className="text-[10px] text-muted-foreground">{o.note}</span>}
                                                                                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => removeOverride(sd, entry.country, o.medicineClass)} aria-label={`Remove ${medicineClassLabel(o.medicineClass)} override`}>
                                                                                                    <X className="h-3.5 w-3.5" />
                                                                                                </Button>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                    </div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )
                                                            })()}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                </Fragment>
                                                )
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                                </CardContent>
                              </>
                            )}
                        </Card>
                    )
                })
            )}

            {/* New Sub-department dialog — capture name + fields before creating */}
            <Dialog open={addForDept !== null} onOpenChange={o => { if (!o) { resetSubDraft(); setAddForDept(null) } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Sub-department{addForDept ? ` — ${departmentLabel(addForDept)}` : ""}</DialogTitle>
                        <DialogDescription>Name it and give it a slug. VAT, Zoho org &amp; payment methods are configured per country after it&apos;s created.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-1">
                        <div className="space-y-1.5">
                            <Label>Name (EN) <span className="text-destructive">*</span></Label>
                            <Input value={subDraft.nameEn} onChange={e => setSubDraft(d => ({ ...d, nameEn: e.target.value }))} placeholder="e.g. Supplements" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Name (AR)</Label>
                            <Input dir="rtl" className="text-right" value={subDraft.nameAr} onChange={e => setSubDraft(d => ({ ...d, nameAr: e.target.value }))} placeholder="المكملات الغذائية" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Slug</Label>
                            <Input className="font-mono text-sm" value={subDraft.slug} onChange={e => setSubDraft(d => ({ ...d, slug: e.target.value }))} placeholder="auto-generated from name" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { resetSubDraft(); setAddForDept(null) }}>Cancel</Button>
                        <Button onClick={createSubDepartment} disabled={!subDraft.nameEn.trim()}>Create sub-department</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
