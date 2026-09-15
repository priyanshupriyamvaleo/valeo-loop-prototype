"use client"

import { ComponentType } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ImageField } from "@/components/catalogue/ImageField"
import { RichText } from "@/components/catalogue/RichText"
import { departmentLabel } from "@/lib/catalogue"
import {
    LayoutTemplate, ShoppingBag, HelpCircle, Sparkles, ListOrdered,
    Star, Plus, Trash, Phone, Mail, Columns, MessageSquareQuote, Calculator,
    ListChecks, UserCircle, ShieldCheck, Check, X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
    PageBlockType, PageBlockConfig, PageBlockItem, PageBlockTestimonial,
    FAQItem, Listing, StatItem,
} from "@/types"

// Local id helper (mirrors the catalogue editors).
function rid() { return Math.random().toString(36).substr(2, 9) }

// Language-aware text selector for previews. `ar || en` fallback means an empty
// AR field renders EN rather than a blank — never a compiler-checked read.
function pick(lang: "en" | "ar", en?: string, ar?: string) {
    return lang === "ar" ? (ar || en || "") : (en || "")
}

// ── shared editor primitives ─────────────────────────────────────────────
function TextField({
    label, value, onChange, dir, placeholder,
}: {
    label: string
    value: string | undefined
    onChange: (v: string) => void
    dir?: "rtl" | "ltr"
    placeholder?: string
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <Input
                dir={dir}
                value={value ?? ""}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                className={dir === "rtl" ? "h-8 text-sm text-right" : "h-8 text-sm"}
            />
        </div>
    )
}

// EN / AR side-by-side pair.
function BilingualText({
    labelEn, labelAr, valueEn, valueAr, onEn, onAr,
}: {
    labelEn: string
    labelAr: string
    valueEn: string | undefined
    valueAr: string | undefined
    onEn: (v: string) => void
    onAr: (v: string) => void
}) {
    return (
        <div className="grid grid-cols-2 gap-2">
            <TextField label={labelEn} value={valueEn} onChange={onEn} />
            <TextField label={labelAr} value={valueAr} onChange={onAr} dir="rtl" />
        </div>
    )
}

function HeadingFields({
    config, onChange,
}: {
    config: PageBlockConfig
    onChange: (patch: Partial<PageBlockConfig>) => void
}) {
    return (
        <BilingualText
            labelEn="Heading (EN)" labelAr="Heading (AR)"
            valueEn={config.headingEn} valueAr={config.headingAr}
            onEn={v => onChange({ headingEn: v })} onAr={v => onChange({ headingAr: v })}
        />
    )
}

function CtaFields({
    config, onChange,
}: {
    config: PageBlockConfig
    onChange: (patch: Partial<PageBlockConfig>) => void
}) {
    return (
        <div className="space-y-2">
            <BilingualText
                labelEn="CTA label (EN)" labelAr="CTA label (AR)"
                valueEn={config.ctaLabelEn} valueAr={config.ctaLabelAr}
                onEn={v => onChange({ ctaLabelEn: v })} onAr={v => onChange({ ctaLabelAr: v })}
            />
            <TextField
                label="CTA link (href)" value={config.ctaHref}
                onChange={v => onChange({ ctaHref: v })} placeholder="/catalogue/listings/…"
            />
        </div>
    )
}

// ── preview primitives ───────────────────────────────────────────────────
function PreviewHeading({ text }: { text: string | undefined }) {
    if (!text) return null
    return <h3 className="text-lg font-semibold tracking-tight text-slate-900 text-start">{text}</h3>
}

function Stars({ rating }: { rating: number }) {
    return (
        <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(n => (
                <Star
                    key={n}
                    className={`h-3.5 w-3.5 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
                />
            ))}
        </div>
    )
}

// ── registry entry contract ──────────────────────────────────────────────
export interface BlockEditorProps {
    config: PageBlockConfig
    onChange: (patch: Partial<PageBlockConfig>) => void
    listings: Listing[]
}
export interface BlockPreviewProps {
    config: PageBlockConfig
    device: "desktop" | "mobile"
    lang: "en" | "ar"
    listings: Listing[]
}
export interface BlockRegistryEntry {
    type: PageBlockType
    label: string
    icon: LucideIcon
    description: string
    defaultConfig: PageBlockConfig
    Editor: ComponentType<BlockEditorProps>
    Preview: ComponentType<BlockPreviewProps>
    singleton?: boolean   // at most one instance allowed on a page
    mandatory?: boolean   // the sole instance cannot be deleted or hidden
}

// ── HERO_SECTION ────────────────────────────────────────────────────────────
const HeroEditor: ComponentType<BlockEditorProps> = ({ config, onChange }) => (
    <div className="space-y-3">
        <HeadingFields config={config} onChange={onChange} />
        <BilingualText
            labelEn="Subheading (EN)" labelAr="Subheading (AR)"
            valueEn={config.subheadingEn} valueAr={config.subheadingAr}
            onEn={v => onChange({ subheadingEn: v })} onAr={v => onChange({ subheadingAr: v })}
        />
        <BilingualText
            labelEn="Price label (EN)" labelAr="Price label (AR)"
            valueEn={config.priceLabel} valueAr={config.priceLabelAr}
            onEn={v => onChange({ priceLabel: v })} onAr={v => onChange({ priceLabelAr: v })}
        />

        {/* CTA Type decides what the button does. The live drawer carries it,
            and the model did not, so a redirection link had no companion. */}
        <div className="space-y-1.5">
            <Label className="text-xs">CTA type</Label>
            <Select value={config.ctaType ?? "REDIRECTION"}
                onValueChange={v => onChange({ ctaType: v as PageBlockConfig["ctaType"] })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="REDIRECTION">REDIRECTION — go to a link</SelectItem>
                    <SelectItem value="CHAT">CHAT — open a chat</SelectItem>
                    <SelectItem value="SCROLL">SCROLL — jump down the page</SelectItem>
                    <SelectItem value="NONE">NONE — no button</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <CtaFields config={config} onChange={onChange} />
        <BilingualText
            labelEn="CTA side text (EN)" labelAr="CTA side text (AR)"
            valueEn={config.ctaSideTextEn} valueAr={config.ctaSideTextAr}
            onEn={v => onChange({ ctaSideTextEn: v })} onAr={v => onChange({ ctaSideTextAr: v })}
        />
        <TextField
            label="CTA link (AR) — only when the Arabic site uses another path"
            value={config.ctaHrefAr}
            onChange={v => onChange({ ctaHrefAr: v })}
        />

        <Separator />
        <ImageField
            label="Master image (EN)"
            preset="hero"
            value={config.imageUrl}
            onChange={v => onChange({ imageUrl: v })}
            altEn={config.imageAltEn}
            altAr={config.imageAltAr}
            onAltEnChange={v => onChange({ imageAltEn: v })}
            onAltArChange={v => onChange({ imageAltAr: v })}
        />
        {/* A separate Arabic image, because hero artwork carries baked-in text. */}
        <ImageField
            label="Master image (AR) — only when the artwork holds Arabic text"
            preset="hero"
            value={config.imageUrlAr}
            onChange={v => onChange({ imageUrlAr: v })}
        />
    </div>
)

const HeroPreview: ComponentType<BlockPreviewProps> = ({ config, device, lang }) => {
    const heading = pick(lang, config.headingEn, config.headingAr)
    const subheading = pick(lang, config.subheadingEn, config.subheadingAr)
    const price = pick(lang, config.priceLabel, config.priceLabelAr)
    const cta = config.ctaType === "NONE" ? "" : pick(lang, config.ctaLabelEn, config.ctaLabelAr)
    const sideText = pick(lang, config.ctaSideTextEn, config.ctaSideTextAr)
    const alt = pick(lang, config.imageAltEn, config.imageAltAr)
    /* Arabic falls back to the English artwork, so a missing AR image never
       leaves the hero blank. */
    const image = lang === "ar" ? (config.imageUrlAr || config.imageUrl) : config.imageUrl
    return (
        <div className="relative overflow-hidden rounded-lg bg-slate-800" style={{ aspectRatio: device === "mobile" ? "4 / 5" : "16 / 9" }}>
            {image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt={alt} className="absolute inset-0 h-full w-full object-cover opacity-70" />
            )}
            <div className="relative z-10 flex h-full flex-col justify-end gap-2 p-5 text-start text-white">
                {heading && <p className={`font-bold leading-tight ${device === "mobile" ? "text-xl" : "text-3xl"}`}>{heading}</p>}
                {subheading && <p className="max-w-lg text-sm text-white/90">{subheading}</p>}
                {price && <p className="text-sm font-semibold text-emerald-300">{price}</p>}
                {cta && (
                    <span className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="inline-flex w-fit items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-900">
                            {cta}
                        </span>
                        {sideText && <span className="text-xs text-white/80">{sideText}</span>}
                    </span>
                )}
            </div>
        </div>
    )
}

// ── PRODUCT_LIST ─────────────────────────────────────────────────────────────
const ProductListEditor: ComponentType<BlockEditorProps> = ({ config, onChange, listings }) => {
    const selected = config.listingIds ?? []
    const toggle = (id: string) => {
        onChange({ listingIds: selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id] })
    }
    return (
        <div className="space-y-3">
            <HeadingFields config={config} onChange={onChange} />
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label className="text-xs">Products</Label>
                    <span className="text-xs text-muted-foreground">{selected.length} selected</span>
                </div>
                <div className="max-h-64 overflow-y-auto rounded-md border divide-y">
                    {listings.length === 0 ? (
                        <p className="px-3 py-4 text-center text-xs italic text-muted-foreground">No listings available.</p>
                    ) : listings.map(l => (
                        <label key={l.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/30">
                            <Checkbox checked={selected.includes(l.id)} onCheckedChange={() => toggle(l.id)} />
                            <span className="flex-1 text-sm">{l.displayNameEn || l.internalName}</span>
                            <Badge variant="outline" className="text-[10px]">{departmentLabel(l.department)}</Badge>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    )
}

const ProductListPreview: ComponentType<BlockPreviewProps> = ({ config, device, lang, listings }) => {
    const ids = config.listingIds ?? []
    const resolved = ids.map(id => listings.find(l => l.id === id)).filter((l): l is Listing => !!l)
    return (
        <div className="space-y-3">
            <PreviewHeading text={pick(lang, config.headingEn, config.headingAr)} />
            {resolved.length === 0 ? (
                <p className="text-sm italic text-slate-400 text-start">No products selected.</p>
            ) : (
                <div className={`gap-3 ${device === "mobile" ? "grid grid-cols-2" : "flex flex-wrap"}`}>
                    {resolved.map(l => (
                        <div key={l.id} className={`rounded-lg border bg-white p-3 text-start ${device === "mobile" ? "" : "w-40"}`}>
                            <div className="mb-2 aspect-square rounded-md bg-slate-100" />
                            <p className="line-clamp-2 text-sm font-medium text-slate-900">{pick(lang, l.displayNameEn, l.displayNameAr) || l.internalName}</p>
                            <p className="text-xs text-slate-500">{departmentLabel(l.department)}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── FAQ ──────────────────────────────────────────────────────────────────────
const FaqEditor: ComponentType<BlockEditorProps> = ({ config, onChange }) => {
    const faq = config.faq ?? []
    const add = () => onChange({ faq: [...faq, { questionEn: "", questionAr: "", answerEn: "", answerAr: "", sortOrder: faq.length }] })
    const update = (i: number, patch: Partial<FAQItem>) => onChange({ faq: faq.map((f, idx) => idx === i ? { ...f, ...patch } : f) })
    const remove = (i: number) => onChange({ faq: faq.filter((_, idx) => idx !== i).map((f, idx) => ({ ...f, sortOrder: idx })) })
    return (
        <div className="space-y-3">
            <HeadingFields config={config} onChange={onChange} />
            <div className="space-y-2">
                {faq.map((f, i) => (
                    <div key={i} className="space-y-2 rounded-md border bg-muted/5 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Q{i + 1}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(i)}><Trash className="h-3.5 w-3.5" /></Button>
                        </div>
                        <BilingualText labelEn="Question (EN)" labelAr="Question (AR)" valueEn={f.questionEn} valueAr={f.questionAr} onEn={v => update(i, { questionEn: v })} onAr={v => update(i, { questionAr: v })} />
                        <BilingualText labelEn="Answer (EN)" labelAr="Answer (AR)" valueEn={f.answerEn} valueAr={f.answerAr} onEn={v => update(i, { answerEn: v })} onAr={v => update(i, { answerAr: v })} />
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={add}><Plus className="mr-2 h-4 w-4" /> Add question</Button>
            </div>
        </div>
    )
}

const FaqPreview: ComponentType<BlockPreviewProps> = ({ config, lang }) => {
    const faq = config.faq ?? []
    return (
        <div className="space-y-3">
            <PreviewHeading text={pick(lang, config.headingEn, config.headingAr)} />
            {faq.length === 0 ? (
                <p className="text-sm italic text-slate-400 text-start">No questions yet.</p>
            ) : (
                <div className="divide-y rounded-lg border bg-white">
                    {faq.map((f, i) => {
                        const q = pick(lang, f.questionEn, f.questionAr)
                        const a = pick(lang, f.answerEn, f.answerAr)
                        return (
                            <div key={i} className="p-3 text-start">
                                <p className="text-sm font-medium text-slate-900">{q || "Untitled question"}</p>
                                {a && <p className="mt-1 text-sm text-slate-600">{a}</p>}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── generic PageBlockItem list (usp / steps) ──────────────────────────────────
function usePageItems(config: PageBlockConfig, onChange: (patch: Partial<PageBlockConfig>) => void) {
    const items = config.items ?? []
    const add = () => onChange({ items: [...items, { id: rid(), titleEn: "", titleAr: "", textEn: "", textAr: "", rank: items.length }] })
    const update = (id: string, patch: Partial<PageBlockItem>) => onChange({ items: items.map(it => it.id === id ? { ...it, ...patch } : it) })
    const remove = (id: string) => onChange({ items: items.filter(it => it.id !== id).map((it, idx) => ({ ...it, rank: idx })) })
    return { items, add, update, remove }
}

// ── USP ────────────────────────────────────────────────────────────────────
const UspEditor: ComponentType<BlockEditorProps> = ({ config, onChange }) => {
    const { items, add, update, remove } = usePageItems(config, onChange)
    return (
        <div className="space-y-3">
            <HeadingFields config={config} onChange={onChange} />
            <div className="space-y-2">
                {items.map((it, i) => (
                    <div key={it.id} className="space-y-2 rounded-md border bg-muted/5 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(it.id)}><Trash className="h-3.5 w-3.5" /></Button>
                        </div>
                        <BilingualText labelEn="Title (EN)" labelAr="Title (AR)" valueEn={it.titleEn} valueAr={it.titleAr} onEn={v => update(it.id, { titleEn: v })} onAr={v => update(it.id, { titleAr: v })} />
                        <BilingualText labelEn="Text (EN)" labelAr="Text (AR)" valueEn={it.textEn} valueAr={it.textAr} onEn={v => update(it.id, { textEn: v })} onAr={v => update(it.id, { textAr: v })} />
                        <ImageField label="Icon" preset="thumbnail" value={it.iconUrl} onChange={v => update(it.id, { iconUrl: v })} />
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={add}><Plus className="mr-2 h-4 w-4" /> Add item</Button>
            </div>
        </div>
    )
}

const UspPreview: ComponentType<BlockPreviewProps> = ({ config, device, lang }) => {
    const items = config.items ?? []
    return (
        <div className="space-y-3">
            <PreviewHeading text={pick(lang, config.headingEn, config.headingAr)} />
            {items.length === 0 ? (
                <p className="text-sm italic text-slate-400 text-start">No items yet.</p>
            ) : (
                <div className={`grid gap-3 ${device === "mobile" ? "grid-cols-1" : "grid-cols-3"}`}>
                    {items.map(it => {
                        const title = pick(lang, it.titleEn, it.titleAr)
                        const text = pick(lang, it.textEn, it.textAr)
                        return (
                            <div key={it.id} className="rounded-lg border bg-white p-4 text-center">
                                {it.iconUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={it.iconUrl} alt="" className="mx-auto mb-2 h-10 w-10 object-contain" />
                                ) : (
                                    <div className="mx-auto mb-2 h-10 w-10 rounded-full bg-emerald-100" />
                                )}
                                <p className="text-sm font-semibold text-slate-900">{title || "Title"}</p>
                                {text && <p className="mt-1 text-xs text-slate-600">{text}</p>}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── STEPS_TO_FOLLOW ──────────────────────────────────────────────────────────
const StepsEditor: ComponentType<BlockEditorProps> = ({ config, onChange }) => {
    const { items, add, update, remove } = usePageItems(config, onChange)
    return (
        <div className="space-y-3">
            <HeadingFields config={config} onChange={onChange} />
            <div className="space-y-2">
                {items.map((it, i) => (
                    <div key={it.id} className="space-y-2 rounded-md border bg-muted/5 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Step {i + 1}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(it.id)}><Trash className="h-3.5 w-3.5" /></Button>
                        </div>
                        <BilingualText labelEn="Title (EN)" labelAr="Title (AR)" valueEn={it.titleEn} valueAr={it.titleAr} onEn={v => update(it.id, { titleEn: v })} onAr={v => update(it.id, { titleAr: v })} />
                        <BilingualText labelEn="Text (EN)" labelAr="Text (AR)" valueEn={it.textEn} valueAr={it.textAr} onEn={v => update(it.id, { textEn: v })} onAr={v => update(it.id, { textAr: v })} />
                        <ImageField label="Icon (optional)" preset="thumbnail" value={it.iconUrl} onChange={v => update(it.id, { iconUrl: v })} />
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={add}><Plus className="mr-2 h-4 w-4" /> Add step</Button>
            </div>
        </div>
    )
}

const StepsPreview: ComponentType<BlockPreviewProps> = ({ config, lang }) => {
    const items = config.items ?? []
    return (
        <div className="space-y-3">
            <PreviewHeading text={pick(lang, config.headingEn, config.headingAr)} />
            {items.length === 0 ? (
                <p className="text-sm italic text-slate-400 text-start">No steps yet.</p>
            ) : (
                <ol className="space-y-3">
                    {items.map((it, i) => {
                        const title = pick(lang, it.titleEn, it.titleAr)
                        const text = pick(lang, it.textEn, it.textAr)
                        return (
                            <li key={it.id} className="flex gap-3">
                                {it.iconUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={it.iconUrl} alt="" className="h-7 w-7 shrink-0 rounded-full object-cover" />
                                ) : (
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">{i + 1}</span>
                                )}
                                <div className="text-start">
                                    <p className="text-sm font-semibold text-slate-900">{title || "Step"}</p>
                                    {text && <p className="text-sm text-slate-600">{text}</p>}
                                </div>
                            </li>
                        )
                    })}
                </ol>
            )}
        </div>
    )
}

// ── TRUST_SECTION (badges / logos + stats) ────────────────────────────────────
const TrustSectionEditor: ComponentType<BlockEditorProps> = ({ config, onChange }) => {
    const { items, add, update, remove } = usePageItems(config, onChange)
    const stats = config.stats ?? []
    const addStat = () => onChange({ stats: [...stats, { value: "", labelEn: "", labelAr: "" }] })
    const updateStat = (i: number, patch: Partial<StatItem>) => onChange({ stats: stats.map((s, idx) => idx === i ? { ...s, ...patch } : s) })
    const removeStat = (i: number) => onChange({ stats: stats.filter((_, idx) => idx !== i) })
    return (
        <div className="space-y-3">
            <HeadingFields config={config} onChange={onChange} />
            <div className="space-y-2">
                <Label className="text-xs">Badges / logos</Label>
                {items.map((it, i) => (
                    <div key={it.id} className="space-y-2 rounded-md border bg-muted/5 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Badge {i + 1}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(it.id)}><Trash className="h-3.5 w-3.5" /></Button>
                        </div>
                        <ImageField label="Logo" preset="square" value={it.iconUrl} onChange={v => update(it.id, { iconUrl: v })} />
                        <BilingualText labelEn="Label (EN)" labelAr="Label (AR)" valueEn={it.titleEn} valueAr={it.titleAr} onEn={v => update(it.id, { titleEn: v })} onAr={v => update(it.id, { titleAr: v })} />
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={add}><Plus className="mr-2 h-4 w-4" /> Add badge</Button>
            </div>
            <Separator />
            <BilingualText
                labelEn="Stats title (EN)" labelAr="Stats title (AR)"
                valueEn={config.statsTitleEn} valueAr={config.statsTitleAr}
                onEn={v => onChange({ statsTitleEn: v })} onAr={v => onChange({ statsTitleAr: v })}
            />
            <div className="space-y-2">
                {stats.map((s, i) => (
                    <div key={i} className="space-y-2 rounded-md border bg-muted/5 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Stat {i + 1}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeStat(i)}><Trash className="h-3.5 w-3.5" /></Button>
                        </div>
                        <TextField label="Value" value={s.value} onChange={v => updateStat(i, { value: v })} placeholder="94%" />
                        <BilingualText labelEn="Label (EN)" labelAr="Label (AR)" valueEn={s.labelEn} valueAr={s.labelAr} onEn={v => updateStat(i, { labelEn: v })} onAr={v => updateStat(i, { labelAr: v })} />
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addStat}><Plus className="mr-2 h-4 w-4" /> Add stat</Button>
            </div>
        </div>
    )
}

const TrustSectionPreview: ComponentType<BlockPreviewProps> = ({ config, device, lang }) => {
    const items = config.items ?? []
    const stats = config.stats ?? []
    const statsTitle = pick(lang, config.statsTitleEn, config.statsTitleAr)
    return (
        <div className="space-y-4">
            <PreviewHeading text={pick(lang, config.headingEn, config.headingAr)} />
            {items.length > 0 && (
                <div className="flex flex-wrap items-center gap-4">
                    {items.map(it => {
                        const label = pick(lang, it.titleEn, it.titleAr)
                        return (
                            <div key={it.id} className="flex items-center gap-2">
                                {it.iconUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={it.iconUrl} alt="" className="h-10 w-10 object-contain grayscale" />
                                ) : (
                                    <div className="h-10 w-10 rounded bg-slate-100" />
                                )}
                                {label && <span className="text-xs font-medium text-slate-600">{label}</span>}
                            </div>
                        )
                    })}
                </div>
            )}
            {stats.length > 0 && (
                <div className="space-y-2">
                    {statsTitle && <p className="text-sm font-medium text-slate-700 text-start">{statsTitle}</p>}
                    <div className={`grid gap-3 ${device === "mobile" ? "grid-cols-2" : "grid-cols-4"}`}>
                        {stats.map((s, i) => (
                            <div key={i} className="rounded-lg border bg-white p-3 text-center">
                                <p className="text-xl font-bold text-slate-900">{s.value || "—"}</p>
                                <p className="text-xs text-slate-600">{pick(lang, s.labelEn, s.labelAr)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {items.length === 0 && stats.length === 0 && (
                <p className="text-sm italic text-slate-400 text-start">No trust content yet.</p>
            )}
        </div>
    )
}

// ── CONTACT_US ─────────────────────────────────────────────────────────────
const ContactEditor: ComponentType<BlockEditorProps> = ({ config, onChange }) => (
    <div className="space-y-3">
        <HeadingFields config={config} onChange={onChange} />
        <BilingualText
            labelEn="Subheading (EN)" labelAr="Subheading (AR)"
            valueEn={config.subheadingEn} valueAr={config.subheadingAr}
            onEn={v => onChange({ subheadingEn: v })} onAr={v => onChange({ subheadingAr: v })}
        />
        <TextField label="Phone" value={config.contactPhone} onChange={v => onChange({ contactPhone: v })} dir="ltr" placeholder="+971 4 000 0000" />
        <TextField label="Email" value={config.contactEmail} onChange={v => onChange({ contactEmail: v })} dir="ltr" placeholder="hello@valeo.com" />
        <TextField label="WhatsApp" value={config.contactWhatsapp} onChange={v => onChange({ contactWhatsapp: v })} dir="ltr" placeholder="+971 50 000 0000" />
        <BilingualText
            labelEn="Hours (EN)" labelAr="Hours (AR)"
            valueEn={config.contactHoursEn} valueAr={config.contactHoursAr}
            onEn={v => onChange({ contactHoursEn: v })} onAr={v => onChange({ contactHoursAr: v })}
        />
        <Separator />
        <CtaFields config={config} onChange={onChange} />
    </div>
)

const ContactPreview: ComponentType<BlockPreviewProps> = ({ config, device, lang }) => {
    const subheading = pick(lang, config.subheadingEn, config.subheadingAr)
    const hours = pick(lang, config.contactHoursEn, config.contactHoursAr)
    const cta = pick(lang, config.ctaLabelEn, config.ctaLabelAr)
    const rows: { icon: LucideIcon; value?: string }[] = [
        { icon: Phone, value: config.contactPhone },
        { icon: MessageSquareQuote, value: config.contactWhatsapp },
    ]
    return (
        <div className={`gap-4 ${device === "mobile" ? "grid grid-cols-1" : "grid grid-cols-2"}`}>
            <div className="space-y-2 text-start">
                <PreviewHeading text={pick(lang, config.headingEn, config.headingAr)} />
                {subheading && <p className="text-sm text-slate-600">{subheading}</p>}
                {hours && <p className="text-xs text-slate-500">{hours}</p>}
                {cta && (
                    <span className="mt-1 inline-flex w-fit items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">{cta}</span>
                )}
            </div>
            <div className="space-y-2">
                {rows.map(({ icon: Icon, value }, i) => value ? (
                    <div key={i} className="flex items-center gap-2 text-start">
                        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                        <span dir="ltr" className="text-sm text-slate-700">{value}</span>
                    </div>
                ) : null)}
                {config.contactEmail && (
                    <div className="flex items-center gap-2 text-start">
                        <Mail className="h-4 w-4 shrink-0 text-slate-500" />
                        <span dir="ltr" className="text-sm text-slate-700">{config.contactEmail}</span>
                    </div>
                )}
            </div>
        </div>
    )
}

// ── COMPARISON_WIDGET ────────────────────────────────────────────────────────
const EMPTY_COMPARISON = { valeoTitleEn: "", valeoTitleAr: "", otherTitleEn: "", otherTitleAr: "", rows: [] }

const ComparisonEditor: ComponentType<BlockEditorProps> = ({ config, onChange }) => {
    const comparison = config.comparison ?? EMPTY_COMPARISON
    const rows = comparison.rows ?? []
    const setComparison = (patch: Partial<typeof comparison>) => onChange({ comparison: { ...comparison, ...patch } })
    const addRow = () => setComparison({ rows: [...rows, { textEn: "", textAr: "", valeo: true, other: false }] })
    const updateRow = (i: number, patch: Partial<(typeof rows)[number]>) => setComparison({ rows: rows.map((r, idx) => idx === i ? { ...r, ...patch } : r) })
    const removeRow = (i: number) => setComparison({ rows: rows.filter((_, idx) => idx !== i) })
    return (
        <div className="space-y-3">
            <HeadingFields config={config} onChange={onChange} />
            <BilingualText
                labelEn="Valeo column (EN)" labelAr="Valeo column (AR)"
                valueEn={comparison.valeoTitleEn} valueAr={comparison.valeoTitleAr}
                onEn={v => setComparison({ valeoTitleEn: v })} onAr={v => setComparison({ valeoTitleAr: v })}
            />
            <BilingualText
                labelEn="Others column (EN)" labelAr="Others column (AR)"
                valueEn={comparison.otherTitleEn} valueAr={comparison.otherTitleAr}
                onEn={v => setComparison({ otherTitleEn: v })} onAr={v => setComparison({ otherTitleAr: v })}
            />
            <div className="space-y-2">
                {rows.map((r, i) => (
                    <div key={i} className="space-y-2 rounded-md border bg-muted/5 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Row {i + 1}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRow(i)}><Trash className="h-3.5 w-3.5" /></Button>
                        </div>
                        <BilingualText labelEn="Feature (EN)" labelAr="Feature (AR)" valueEn={r.textEn} valueAr={r.textAr} onEn={v => updateRow(i, { textEn: v })} onAr={v => updateRow(i, { textAr: v })} />
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 text-xs">
                                <Checkbox checked={r.valeo} onCheckedChange={v => updateRow(i, { valeo: v === true })} /> Valeo
                            </label>
                            <label className="flex items-center gap-2 text-xs">
                                <Checkbox checked={r.other} onCheckedChange={v => updateRow(i, { other: v === true })} /> Others
                            </label>
                        </div>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addRow}><Plus className="mr-2 h-4 w-4" /> Add row</Button>
            </div>
        </div>
    )
}

const ComparisonPreview: ComponentType<BlockPreviewProps> = ({ config, lang }) => {
    const comparison = config.comparison ?? EMPTY_COMPARISON
    const rows = comparison.rows ?? []
    const valeoTitle = pick(lang, comparison.valeoTitleEn, comparison.valeoTitleAr) || "Valeo"
    const otherTitle = pick(lang, comparison.otherTitleEn, comparison.otherTitleAr) || "Others"
    const Mark = ({ on }: { on: boolean }) => on
        ? <Check className="mx-auto h-4 w-4 text-emerald-600" />
        : <X className="mx-auto h-4 w-4 text-slate-300" />
    return (
        <div className="space-y-3">
            <PreviewHeading text={pick(lang, config.headingEn, config.headingAr)} />
            {rows.length === 0 ? (
                <p className="text-sm italic text-slate-400 text-start">No comparison rows yet.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[320px] border-collapse text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="p-2 text-start font-medium text-slate-500"></th>
                                <th className="p-2 text-center font-semibold text-slate-900">{valeoTitle}</th>
                                <th className="p-2 text-center font-medium text-slate-500">{otherTitle}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr key={i} className="border-b last:border-0">
                                    <td className="p-2 text-start text-slate-700">{pick(lang, r.textEn, r.textAr) || "—"}</td>
                                    <td className="p-2 text-center"><Mark on={r.valeo} /></td>
                                    <td className="p-2 text-center"><Mark on={r.other} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}

// ── IMAGE_TESTIMONIALS ─────────────────────────────────────────────────────
const TestimonialsEditor: ComponentType<BlockEditorProps> = ({ config, onChange }) => {
    const testimonials = config.testimonials ?? []
    const add = () => onChange({ testimonials: [...testimonials, { id: rid(), nameEn: "", nameAr: "", quoteEn: "", quoteAr: "", rating: 5 }] })
    const update = (id: string, patch: Partial<PageBlockTestimonial>) => onChange({ testimonials: testimonials.map(t => t.id === id ? { ...t, ...patch } : t) })
    const remove = (id: string) => onChange({ testimonials: testimonials.filter(t => t.id !== id) })
    return (
        <div className="space-y-3">
            <HeadingFields config={config} onChange={onChange} />
            <div className="space-y-2">
                {testimonials.map((t, i) => (
                    <div key={t.id} className="space-y-2 rounded-md border bg-muted/5 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Testimonial {i + 1}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(t.id)}><Trash className="h-3.5 w-3.5" /></Button>
                        </div>
                        <ImageField
                            label="Photo" preset="portrait" value={t.imageUrl}
                            onChange={v => update(t.id, { imageUrl: v })}
                            altEn={t.imageAltEn} altAr={t.imageAltAr}
                            onAltEnChange={v => update(t.id, { imageAltEn: v })}
                            onAltArChange={v => update(t.id, { imageAltAr: v })}
                        />
                        <BilingualText labelEn="Name (EN)" labelAr="Name (AR)" valueEn={t.nameEn} valueAr={t.nameAr} onEn={v => update(t.id, { nameEn: v })} onAr={v => update(t.id, { nameAr: v })} />
                        <BilingualText labelEn="Quote (EN)" labelAr="Quote (AR)" valueEn={t.quoteEn} valueAr={t.quoteAr} onEn={v => update(t.id, { quoteEn: v })} onAr={v => update(t.id, { quoteAr: v })} />
                        <div className="space-y-1.5">
                            <Label className="text-xs">Rating (1–5)</Label>
                            <Input
                                type="number" min={1} max={5}
                                value={t.rating ?? ""}
                                onChange={e => update(t.id, { rating: e.target.value ? Math.max(1, Math.min(5, Number(e.target.value))) : undefined })}
                                className="h-8 w-20 text-sm"
                            />
                        </div>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={add}><Plus className="mr-2 h-4 w-4" /> Add testimonial</Button>
            </div>
        </div>
    )
}

const TestimonialsPreview: ComponentType<BlockPreviewProps> = ({ config, device, lang }) => {
    const testimonials = config.testimonials ?? []
    return (
        <div className="space-y-3">
            <PreviewHeading text={pick(lang, config.headingEn, config.headingAr)} />
            {testimonials.length === 0 ? (
                <p className="text-sm italic text-slate-400 text-start">No testimonials yet.</p>
            ) : (
                <div className={`grid gap-3 ${device === "mobile" ? "grid-cols-1" : "grid-cols-2"}`}>
                    {testimonials.map(t => {
                        const name = pick(lang, t.nameEn, t.nameAr)
                        const quote = pick(lang, t.quoteEn, t.quoteAr)
                        const alt = pick(lang, t.imageAltEn, t.imageAltAr)
                        return (
                            <div key={t.id} className="rounded-lg border bg-white p-4 text-start">
                                {t.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={t.imageUrl} alt={alt} className="mb-2 h-24 w-20 rounded-md object-cover" style={{ aspectRatio: "4 / 5" }} />
                                ) : (
                                    <div className="mb-2 h-24 w-20 rounded-md bg-slate-100" style={{ aspectRatio: "4 / 5" }} />
                                )}
                                <Stars rating={t.rating ?? 0} />
                                {quote && <p className="mt-2 text-sm italic text-slate-700">&ldquo;{quote}&rdquo;</p>}
                                {name && <p className="mt-2 text-xs font-medium text-slate-900">— {name}</p>}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

// ── BMI (appearance-only widget) ──────────────────────────────────────────────
const BMI_BANDS = [
    { en: "Underweight", ar: "نقص الوزن", cls: "bg-sky-100 text-sky-700" },
    { en: "Normal", ar: "طبيعي", cls: "bg-emerald-100 text-emerald-700" },
    { en: "Overweight", ar: "زيادة الوزن", cls: "bg-amber-100 text-amber-700" },
    { en: "Obese", ar: "سمنة", cls: "bg-rose-100 text-rose-700" },
]

const BmiEditor: ComponentType<BlockEditorProps> = ({ config, onChange }) => (
    <div className="space-y-3">
        <HeadingFields config={config} onChange={onChange} />
        <BilingualText
            labelEn="Subheading (EN)" labelAr="Subheading (AR)"
            valueEn={config.subheadingEn} valueAr={config.subheadingAr}
            onEn={v => onChange({ subheadingEn: v })} onAr={v => onChange({ subheadingAr: v })}
        />
        <div className="space-y-1.5">
            <Label className="text-xs">Unit system</Label>
            <Select value={config.bmiUnitSystem ?? "metric"} onValueChange={(v: string) => onChange({ bmiUnitSystem: v as "metric" | "imperial" | "both" })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="metric">Metric (cm / kg)</SelectItem>
                    <SelectItem value="imperial">Imperial (ft-in / lb)</SelectItem>
                    <SelectItem value="both">Both (toggle)</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <BilingualText
            labelEn="Disclaimer (EN)" labelAr="Disclaimer (AR)"
            valueEn={config.disclaimerEn} valueAr={config.disclaimerAr}
            onEn={v => onChange({ disclaimerEn: v })} onAr={v => onChange({ disclaimerAr: v })}
        />
        <Separator />
        <CtaFields config={config} onChange={onChange} />
    </div>
)

const BmiPreview: ComponentType<BlockPreviewProps> = ({ config, device, lang }) => {
    const unit = config.bmiUnitSystem ?? "metric"
    const subheading = pick(lang, config.subheadingEn, config.subheadingAr)
    const disclaimer = pick(lang, config.disclaimerEn, config.disclaimerAr)
    const cta = pick(lang, config.ctaLabelEn, config.ctaLabelAr)
    const heightLabel = lang === "ar" ? "الطول" : "Height"
    const weightLabel = lang === "ar" ? "الوزن" : "Weight"
    const hUnit = unit === "imperial" ? "ft-in" : "cm"
    const wUnit = unit === "imperial" ? "lb" : "kg"
    return (
        <div className="space-y-4 rounded-lg border bg-white p-4">
            <PreviewHeading text={pick(lang, config.headingEn, config.headingAr)} />
            {subheading && <p className="text-sm text-slate-600 text-start">{subheading}</p>}
            {unit === "both" && (
                <div className="inline-flex rounded-md border p-0.5 text-xs">
                    <span className="rounded bg-slate-900 px-2.5 py-1 text-white">Metric</span>
                    <span className="px-2.5 py-1 text-slate-500">Imperial</span>
                </div>
            )}
            <div className={`gap-3 ${device === "mobile" ? "grid grid-cols-1" : "grid grid-cols-2"}`}>
                <div className="space-y-1.5">
                    <Label className="block text-start text-xs">{heightLabel} ({hUnit})</Label>
                    <span dir="ltr" className="block"><Input disabled placeholder="—" className="h-9" /></span>
                </div>
                <div className="space-y-1.5">
                    <Label className="block text-start text-xs">{weightLabel} ({wUnit})</Label>
                    <span dir="ltr" className="block"><Input disabled placeholder="—" className="h-9" /></span>
                </div>
            </div>
            <div className="flex flex-wrap gap-2">
                {BMI_BANDS.map((b, i) => (
                    <span key={i} className={`rounded-full px-3 py-1 text-xs font-medium ${b.cls}`}>{lang === "ar" ? b.ar : b.en}</span>
                ))}
            </div>
            {cta && (
                <span className="inline-flex w-fit items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">{cta}</span>
            )}
            {disclaimer && <p className="text-xs text-slate-400 text-start">{disclaimer}</p>}
        </div>
    )
}

// ── FEATURE_LIST (check / cross bullets) ──────────────────────────────────────
const FeatureListEditor: ComponentType<BlockEditorProps> = ({ config, onChange }) => {
    const items = config.items ?? []
    const add = () => onChange({ items: [...items, { id: rid(), titleEn: "", titleAr: "", textEn: "", textAr: "", included: true, rank: items.length }] })
    const update = (id: string, patch: Partial<PageBlockItem>) => onChange({ items: items.map(it => it.id === id ? { ...it, ...patch } : it) })
    const remove = (id: string) => onChange({ items: items.filter(it => it.id !== id).map((it, idx) => ({ ...it, rank: idx })) })
    return (
        <div className="space-y-3">
            <HeadingFields config={config} onChange={onChange} />
            <div className="space-y-2">
                {items.map((it, i) => (
                    <div key={it.id} className="space-y-2 rounded-md border bg-muted/5 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Feature {i + 1}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(it.id)}><Trash className="h-3.5 w-3.5" /></Button>
                        </div>
                        <label className="flex items-center gap-2 text-xs">
                            <Checkbox checked={it.included ?? false} onCheckedChange={v => update(it.id, { included: v === true })} /> Included
                        </label>
                        <BilingualText labelEn="Feature (EN)" labelAr="Feature (AR)" valueEn={it.titleEn} valueAr={it.titleAr} onEn={v => update(it.id, { titleEn: v })} onAr={v => update(it.id, { titleAr: v })} />
                        <BilingualText labelEn="Detail (EN)" labelAr="Detail (AR)" valueEn={it.textEn} valueAr={it.textAr} onEn={v => update(it.id, { textEn: v })} onAr={v => update(it.id, { textAr: v })} />
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={add}><Plus className="mr-2 h-4 w-4" /> Add feature</Button>
            </div>
        </div>
    )
}

const FeatureListPreview: ComponentType<BlockPreviewProps> = ({ config, lang }) => {
    const items = config.items ?? []
    return (
        <div className="space-y-3">
            <PreviewHeading text={pick(lang, config.headingEn, config.headingAr)} />
            {items.length === 0 ? (
                <p className="text-sm italic text-slate-400 text-start">No features yet.</p>
            ) : (
                <ul className="space-y-2">
                    {items.map(it => {
                        const title = pick(lang, it.titleEn, it.titleAr)
                        const detail = pick(lang, it.textEn, it.textAr)
                        return (
                            <li key={it.id} className="flex items-start gap-2">
                                {it.included ? (
                                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                                ) : (
                                    <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                                )}
                                <div className="text-start">
                                    <p className="text-sm font-medium text-slate-900">{title || "Feature"}</p>
                                    {detail && <p className="text-xs text-slate-500">{detail}</p>}
                                </div>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}

// ── CUSTOMER_PROFILE (who-this-is-for persona) ────────────────────────────────
const CustomerProfileEditor: ComponentType<BlockEditorProps> = ({ config, onChange }) => {
    const { items, add, update, remove } = usePageItems(config, onChange)
    return (
        <div className="space-y-3">
            <HeadingFields config={config} onChange={onChange} />
            <BilingualText
                labelEn="Persona name (EN)" labelAr="Persona name (AR)"
                valueEn={config.subheadingEn} valueAr={config.subheadingAr}
                onEn={v => onChange({ subheadingEn: v })} onAr={v => onChange({ subheadingAr: v })}
            />
            <RichText label="Summary (EN)" value={config.bodyEn} onChange={v => onChange({ bodyEn: v })} />
            <RichText label="Summary (AR)" value={config.bodyAr} onChange={v => onChange({ bodyAr: v })} dir="rtl" />
            <Separator />
            <ImageField
                label="Portrait" preset="portrait" value={config.imageUrl}
                onChange={v => onChange({ imageUrl: v })}
                altEn={config.imageAltEn} altAr={config.imageAltAr}
                onAltEnChange={v => onChange({ imageAltEn: v })}
                onAltArChange={v => onChange({ imageAltAr: v })}
            />
            <Separator />
            <div className="space-y-2">
                <Label className="text-xs">Fits you if…</Label>
                {items.map((it, i) => (
                    <div key={it.id} className="space-y-2 rounded-md border bg-muted/5 p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">Trait {i + 1}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => remove(it.id)}><Trash className="h-3.5 w-3.5" /></Button>
                        </div>
                        <BilingualText labelEn="Trait (EN)" labelAr="Trait (AR)" valueEn={it.titleEn} valueAr={it.titleAr} onEn={v => update(it.id, { titleEn: v })} onAr={v => update(it.id, { titleAr: v })} />
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={add}><Plus className="mr-2 h-4 w-4" /> Add trait</Button>
            </div>
        </div>
    )
}

const CustomerProfilePreview: ComponentType<BlockPreviewProps> = ({ config, device, lang }) => {
    const items = config.items ?? []
    const name = pick(lang, config.subheadingEn, config.subheadingAr)
    const body = pick(lang, config.bodyEn, config.bodyAr)
    const alt = pick(lang, config.imageAltEn, config.imageAltAr)
    return (
        <div className="space-y-3">
            <PreviewHeading text={pick(lang, config.headingEn, config.headingAr)} />
            <div className={`items-start gap-4 ${device === "mobile" ? "flex flex-col" : "flex flex-row"}`}>
                {config.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={config.imageUrl} alt={alt} className="h-40 w-32 shrink-0 rounded-lg object-cover" />
                ) : (
                    <div className="h-40 w-32 shrink-0 rounded-lg bg-slate-100" />
                )}
                <div className="space-y-2 text-start">
                    {name && <p className="text-base font-semibold text-slate-900">{name}</p>}
                    {body && <p className="whitespace-pre-line text-sm text-slate-600">{body}</p>}
                    {items.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {items.map(it => {
                                const t = pick(lang, it.titleEn, it.titleAr)
                                return t ? (
                                    <span key={it.id} className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{t}</span>
                                ) : null
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── the registry ─────────────────────────────────────────────────────────────
export const BLOCK_REGISTRY: Record<PageBlockType, BlockRegistryEntry> = {
    HERO_SECTION: {
        type: "HERO_SECTION", label: "Hero", icon: LayoutTemplate,
        description: "Full-width banner with heading, price and CTA over an image.",
        defaultConfig: { headingEn: "", headingAr: "", subheadingEn: "", subheadingAr: "", priceLabel: "", priceLabelAr: "", ctaLabelEn: "", ctaLabelAr: "", ctaHref: "", imageUrl: "", imageAltEn: "", imageAltAr: "" },
        Editor: HeroEditor, Preview: HeroPreview,
        singleton: true, mandatory: true,
    },
    USP: {
        type: "USP", label: "USPs", icon: Sparkles,
        description: "A grid of icon / title / text selling points.",
        defaultConfig: { headingEn: "", headingAr: "", items: [] },
        Editor: UspEditor, Preview: UspPreview,
    },
    TRUST_SECTION: {
        type: "TRUST_SECTION", label: "Trust", icon: ShieldCheck,
        description: "Partner badges / logos plus a stats strip.",
        defaultConfig: { headingEn: "", headingAr: "", items: [], stats: [], statsTitleEn: "", statsTitleAr: "" },
        Editor: TrustSectionEditor, Preview: TrustSectionPreview,
    },
    STEPS_TO_FOLLOW: {
        type: "STEPS_TO_FOLLOW", label: "Steps to follow", icon: ListOrdered,
        description: "A numbered how-it-works list with optional icons.",
        defaultConfig: { headingEn: "", headingAr: "", items: [] },
        Editor: StepsEditor, Preview: StepsPreview,
    },
    PRODUCT_LIST: {
        type: "PRODUCT_LIST", label: "Product list", icon: ShoppingBag,
        description: "A heading and a row of product cards from selected listings.",
        defaultConfig: { headingEn: "", headingAr: "", listingIds: [] },
        Editor: ProductListEditor, Preview: ProductListPreview,
    },
    FAQ: {
        type: "FAQ", label: "FAQ", icon: HelpCircle,
        description: "Heading plus repeatable question / answer pairs.",
        defaultConfig: { headingEn: "", headingAr: "", faq: [] },
        Editor: FaqEditor, Preview: FaqPreview,
    },
    CONTACT_US: {
        type: "CONTACT_US", label: "Contact us", icon: Phone,
        description: "Heading, subheading and contact details with hours.",
        defaultConfig: { headingEn: "", headingAr: "", subheadingEn: "", subheadingAr: "", contactPhone: "", contactEmail: "", contactWhatsapp: "", contactHoursEn: "", contactHoursAr: "", ctaLabelEn: "", ctaLabelAr: "", ctaHref: "" },
        Editor: ContactEditor, Preview: ContactPreview,
    },
    COMPARISON_WIDGET: {
        type: "COMPARISON_WIDGET", label: "Comparison", icon: Columns,
        description: "A Valeo-vs-others feature comparison table.",
        defaultConfig: { headingEn: "", headingAr: "", comparison: { valeoTitleEn: "", valeoTitleAr: "", otherTitleEn: "", otherTitleAr: "", rows: [] } },
        Editor: ComparisonEditor, Preview: ComparisonPreview,
    },
    IMAGE_TESTIMONIALS: {
        type: "IMAGE_TESTIMONIALS", label: "Image testimonials", icon: MessageSquareQuote,
        description: "Testimonial cards with a person image, quote and rating.",
        defaultConfig: { headingEn: "", headingAr: "", testimonials: [] },
        Editor: TestimonialsEditor, Preview: TestimonialsPreview,
    },
    BMI: {
        type: "BMI", label: "BMI calculator", icon: Calculator,
        description: "A BMI widget with unit system and result bands.",
        defaultConfig: { headingEn: "", headingAr: "", subheadingEn: "", subheadingAr: "", bmiUnitSystem: "metric", disclaimerEn: "", disclaimerAr: "" },
        Editor: BmiEditor, Preview: BmiPreview,
    },
    FEATURE_LIST: {
        type: "FEATURE_LIST", label: "Feature list", icon: ListChecks,
        description: "Check / cross bullets of what is and isn't included.",
        defaultConfig: { headingEn: "", headingAr: "", items: [] },
        Editor: FeatureListEditor, Preview: FeatureListPreview,
    },
    CUSTOMER_PROFILE: {
        type: "CUSTOMER_PROFILE", label: "Customer profile", icon: UserCircle,
        description: "A who-this-is-for persona card with traits.",
        defaultConfig: { headingEn: "", headingAr: "", subheadingEn: "", subheadingAr: "", bodyEn: "", bodyAr: "", imageUrl: "", items: [] },
        Editor: CustomerProfileEditor, Preview: CustomerProfilePreview,
    },
}

// Ordered list for the palette (HERO_SECTION first).
export const BLOCK_ORDER: PageBlockType[] = [
    "HERO_SECTION", "USP", "TRUST_SECTION", "STEPS_TO_FOLLOW", "PRODUCT_LIST",
    "COMPARISON_WIDGET", "FEATURE_LIST", "IMAGE_TESTIMONIALS", "CUSTOMER_PROFILE",
    "BMI", "FAQ", "CONTACT_US",
]
