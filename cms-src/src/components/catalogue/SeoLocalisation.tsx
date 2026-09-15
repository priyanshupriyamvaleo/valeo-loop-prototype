"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, ChevronRight, MapPin } from "lucide-react"
import { ImageField } from "@/components/catalogue/ImageField"
import { Country, City, SeoLang, SeoLocaleEntry, SeoCountrySettings } from "@/types"

const ALL_COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT", "OTHERS"]
const rid = () => Math.random().toString(36).slice(2, 9)

/** Master values used as inherit-placeholders on the country rows. */
export interface SeoMaster {
    slugEn?: string
    slugAr?: string
    titleEn?: string
    titleAr?: string
    descEn?: string
    descAr?: string
    canonical?: string
}

export function SeoLocalisation({
    locales,
    countrySettings,
    cities,
    master,
    availableCountries,
    onChange,
}: {
    locales: SeoLocaleEntry[]
    countrySettings: SeoCountrySettings[]
    cities: City[]
    master: SeoMaster
    /** markets the listing is actually sold in; falls back to all */
    availableCountries?: Country[]
    onChange: (locales: SeoLocaleEntry[], countrySettings: SeoCountrySettings[]) => void
}) {
    const [open, setOpen] = useState<Record<string, boolean>>({})

    const offered = (availableCountries && availableCountries.length ? availableCountries : ALL_COUNTRIES)
    const added = countrySettings.map(c => c.country)
    const addable = offered.filter(c => !added.includes(c))

    // ── mutators ──
    const addCountry = (country: Country) => {
        onChange(locales, [...countrySettings, { country, isIndexable: true, isFollowable: true, sitemapInclude: true }])
        setOpen(o => ({ ...o, [country]: true }))
    }
    const removeCountry = (country: Country) =>
        onChange(locales.filter(l => l.country !== country), countrySettings.filter(c => c.country !== country))
    const patchCountry = (country: Country, patch: Partial<SeoCountrySettings>) =>
        onChange(locales, countrySettings.map(c => (c.country === country ? { ...c, ...patch } : c)))

    const entry = (country: Country, language: SeoLang, cityId?: string) =>
        locales.find(l => l.country === country && l.language === language && l.cityId === cityId)

    const patchEntry = (country: Country, language: SeoLang, patch: Partial<SeoLocaleEntry>, cityId?: string) => {
        const found = entry(country, language, cityId)
        if (found) {
            onChange(locales.map(l => (l.id === found.id ? { ...l, ...patch } : l)), countrySettings)
        } else {
            onChange([...locales, { id: rid(), country, language, cityId, ...patch }], countrySettings)
        }
    }
    const addCity = (country: Country, cityId: string) =>
        onChange([...locales, { id: rid(), country, cityId, language: "en" }], countrySettings)
    const removeCity = (country: Country, cityId: string) =>
        onChange(locales.filter(l => !(l.country === country && l.cityId === cityId)), countrySettings)

    const citiesOf = (country: Country) => {
        const ids = new Set(locales.filter(l => l.country === country && l.cityId).map(l => l.cityId!))
        return [...ids]
    }
    const has = (country: Country, language: SeoLang) => {
        const e = entry(country, language)
        return !!(e && (e.slug || e.metaTitle || e.metaDescription || e.h1))
    }
    const cityName = (id: string) => cities.find(c => c.id === id)?.name ?? id

    // ── per-language field set (country level) ──
    const LangFields = ({ country, language }: { country: Country; language: SeoLang }) => {
        const e = entry(country, language)
        const ar = language === "ar"
        const dir = ar ? "rtl" : undefined
        const cls = ar ? "h-8 text-xs text-right" : "h-8 text-xs"
        const title = e?.metaTitle ?? ""
        const desc = e?.metaDescription ?? ""
        return (
            <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {ar ? "Arabic" : "English"}
                </p>
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Slug</Label>
                    <Input dir={dir} className={`${cls} font-mono`} value={e?.slug ?? ""}
                        placeholder={(ar ? master.slugAr : master.slugEn) || "inherits master"}
                        onChange={ev => patchEntry(country, language, { slug: ev.target.value })} />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-muted-foreground">Meta title</Label>
                        <span className="text-[10px] tabular-nums text-muted-foreground">{title.length}/60</span>
                    </div>
                    <Input dir={dir} className={cls} maxLength={70} value={title}
                        placeholder={(ar ? master.titleAr : master.titleEn) || "inherits master"}
                        onChange={ev => patchEntry(country, language, { metaTitle: ev.target.value })} />
                </div>
                <div className="space-y-1">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] text-muted-foreground">Meta description</Label>
                        <span className="text-[10px] tabular-nums text-muted-foreground">{desc.length}/160</span>
                    </div>
                    <Textarea dir={dir} rows={2} maxLength={200}
                        className={ar ? "text-xs text-right" : "text-xs"} value={desc}
                        placeholder={(ar ? master.descAr : master.descEn) || "inherits master"}
                        onChange={ev => patchEntry(country, language, { metaDescription: ev.target.value })} />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">H1 (on-page heading)</Label>
                    <Input dir={dir} className={cls} value={e?.h1 ?? ""}
                        placeholder="e.g. Vitamin D3 5000 IU, delivered in Dubai"
                        onChange={ev => patchEntry(country, language, { h1: ev.target.value })} />
                </div>
                <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">Canonical URL</Label>
                    <Input className="h-8 font-mono text-xs" value={e?.canonicalUrl ?? ""}
                        placeholder={master.canonical || "https://feelvaleo.com/…"}
                        onChange={ev => patchEntry(country, language, { canonicalUrl: ev.target.value })} />
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                    Anything left blank <strong>inherits</strong> the master SEO above. Cities inherit their country.
                    Turn <strong>Indexable</strong> off for a market where this listing is not sold.
                </p>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 shrink-0" disabled={addable.length === 0}>
                            <Plus className="mr-1 h-3.5 w-3.5" /> Add market
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel className="text-xs">Add a country</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {addable.map(c => (
                            <DropdownMenuItem key={c} onClick={() => addCountry(c)}>{c}</DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {countrySettings.length === 0 ? (
                <p className="rounded-md border border-dashed py-6 text-center text-xs text-muted-foreground">
                    No localised markets — every country uses the master SEO. Click “Add market”.
                </p>
            ) : (
                <div className="space-y-2">
                    {countrySettings.map(cs => {
                        const isOpen = !!open[cs.country]
                        const cityIds = citiesOf(cs.country)
                        const countryCities = cities.filter(c => c.country === cs.country)
                        const addableCities = countryCities.filter(c => !cityIds.includes(c.id))
                        const indexable = cs.isIndexable !== false
                        return (
                            <div key={cs.country} className="rounded-md border bg-background">
                                {/* collapsed summary row */}
                                <div className="flex flex-wrap items-center gap-2 p-2">
                                    <button type="button" onClick={() => setOpen(o => ({ ...o, [cs.country]: !isOpen }))}
                                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
                                        <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                                        <span className="w-16 text-left text-xs font-semibold text-foreground">{cs.country}</span>
                                    </button>
                                    <Badge variant="outline" className={`text-[10px] ${has(cs.country, "en") ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                        EN {has(cs.country, "en") ? "✓" : "—"}
                                    </Badge>
                                    <Badge variant="outline" className={`text-[10px] ${has(cs.country, "ar") ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                                        AR {has(cs.country, "ar") ? "✓" : "—"}
                                    </Badge>
                                    {cityIds.length > 0 && (
                                        <Badge variant="outline" className="text-[10px]">
                                            <MapPin className="mr-1 h-3 w-3" />{cityIds.length} {cityIds.length === 1 ? "city" : "cities"}
                                        </Badge>
                                    )}
                                    <div className="ml-auto flex items-center gap-2">
                                        <Label className="text-[10px] text-muted-foreground">Indexable</Label>
                                        <Switch checked={indexable} onCheckedChange={v => patchCountry(cs.country, { isIndexable: v })} />
                                        {!indexable && <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px]">noindex</Badge>}
                                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                                            onClick={() => removeCountry(cs.country)} aria-label={`Remove ${cs.country}`}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {isOpen && (
                                    <div className="space-y-4 border-t bg-muted/20 p-3">
                                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                            <LangFields country={cs.country} language="en" />
                                            <LangFields country={cs.country} language="ar" />
                                        </div>

                                        {/* crawl + social, language-agnostic */}
                                        <div className="flex flex-wrap items-center gap-4 border-t pt-3">
                                            <div className="flex items-center gap-2">
                                                <Label className="text-[10px] text-muted-foreground">Follow links</Label>
                                                <Switch checked={cs.isFollowable !== false}
                                                    onCheckedChange={v => patchCountry(cs.country, { isFollowable: v })} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-[10px] text-muted-foreground">In sitemap</Label>
                                                <Switch checked={cs.sitemapInclude !== false}
                                                    onCheckedChange={v => patchCountry(cs.country, { sitemapInclude: v })} />
                                            </div>
                                        </div>
                                        <ImageField
                                            preset="og"
                                            label={`OG / social image — ${cs.country}`}
                                            value={cs.ogImageUrl}
                                            onChange={url => patchCountry(cs.country, { ogImageUrl: url })}
                                            altEn={cs.ogImageAltEn}
                                            altAr={cs.ogImageAltAr}
                                            onAltEnChange={v => patchCountry(cs.country, { ogImageAltEn: v })}
                                            onAltArChange={v => patchCountry(cs.country, { ogImageAltAr: v })}
                                        />

                                        {/* ── city overrides ── */}
                                        <div className="space-y-2 border-t pt-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                                                    City pages ({cs.country})
                                                </p>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button size="sm" variant="outline" className="h-7 text-xs"
                                                            disabled={addableCities.length === 0}
                                                            title={countryCities.length === 0 ? "No cities for this country" : "Add a city page"}>
                                                            <Plus className="mr-1 h-3.5 w-3.5" /> Add city
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {addableCities.map(c => (
                                                            <DropdownMenuItem key={c.id} onClick={() => addCity(cs.country, c.id)}>{c.name}</DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            {cityIds.length === 0 ? (
                                                <p className="text-[11px] text-muted-foreground">
                                                    No city pages — all cities in {cs.country} use the country SEO above.
                                                </p>
                                            ) : cityIds.map(cid => {
                                                const cEn = entry(cs.country, "en", cid)
                                                const cAr = entry(cs.country, "ar", cid)
                                                const ctry = entry(cs.country, "en")
                                                return (
                                                    <div key={cid} className="rounded-md border bg-background p-2">
                                                        <div className="mb-2 flex items-center gap-2">
                                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                            <span className="text-xs font-semibold">{cityName(cid)}</span>
                                                            <Button size="icon" variant="ghost" className="ml-auto h-7 w-7 text-destructive"
                                                                onClick={() => removeCity(cs.country, cid)} aria-label={`Remove ${cityName(cid)}`}>
                                                                <X className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                                            {(["en", "ar"] as SeoLang[]).map(lang => {
                                                                const e = lang === "en" ? cEn : cAr
                                                                const ar = lang === "ar"
                                                                const cls = ar ? "h-7 text-xs text-right" : "h-7 text-xs"
                                                                return (
                                                                    <div key={lang} className="space-y-1.5">
                                                                        <p className="text-[10px] font-semibold uppercase text-muted-foreground">{ar ? "Arabic" : "English"}</p>
                                                                        <Input dir={ar ? "rtl" : undefined} className={`${cls} font-mono`} value={e?.slug ?? ""}
                                                                            placeholder={ctry?.slug || "inherits country"}
                                                                            onChange={ev => patchEntry(cs.country, lang, { slug: ev.target.value }, cid)} />
                                                                        <Input dir={ar ? "rtl" : undefined} className={cls} value={e?.h1 ?? ""}
                                                                            placeholder={`H1 — e.g. in ${cityName(cid)}`}
                                                                            onChange={ev => patchEntry(cs.country, lang, { h1: ev.target.value }, cid)} />
                                                                        <Input dir={ar ? "rtl" : undefined} className={cls} maxLength={70} value={e?.metaTitle ?? ""}
                                                                            placeholder={ctry?.metaTitle || "Meta title — inherits country"}
                                                                            onChange={ev => patchEntry(cs.country, lang, { metaTitle: ev.target.value }, cid)} />
                                                                        <Textarea dir={ar ? "rtl" : undefined} rows={2} maxLength={200}
                                                                            className={ar ? "text-xs text-right" : "text-xs"} value={e?.metaDescription ?? ""}
                                                                            placeholder={ctry?.metaDescription || "Meta description — inherits country"}
                                                                            onChange={ev => patchEntry(cs.country, lang, { metaDescription: ev.target.value }, cid)} />
                                                                        <Input dir={ar ? "rtl" : undefined} className={cls} value={e?.deliveryPromise ?? ""}
                                                                            placeholder={`Delivery promise — e.g. Same-day in ${cityName(cid)}`}
                                                                            onChange={ev => patchEntry(cs.country, lang, { deliveryPromise: ev.target.value }, cid)} />
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            })}
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
