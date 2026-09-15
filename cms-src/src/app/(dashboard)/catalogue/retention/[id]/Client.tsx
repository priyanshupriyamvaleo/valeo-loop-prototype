"use client"

import { useEffect, useMemo, useState } from "react"
import { UnsavedChangesGuard, useDirtyTracker } from "@/components/catalogue/UnsavedChangesGuard"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ArrowLeft, Save, Plus, Trash2, ChevronDown, ChevronUp, ChevronsUpDown,
    Image as ImageIcon, Package, MessageSquare, Video, LayoutList,
    AlertCircle, LayoutTemplate, Syringe, Type as TypeIcon,
} from "lucide-react"
import { ApiService } from "@/services/api"
import {
    RetentionTemplate, RetentionSection, RetentionSectionType, RetentionSectionConfig, RetentionMessage, Listing,
} from "@/types"
import { ImageField } from "@/components/catalogue/ImageField"
import { RichText } from "@/components/catalogue/RichText"

const TYPE_META: Record<RetentionSectionType, { label: string; icon: typeof Package; description: string }> = {
    banner: { label: "Banner", icon: ImageIcon, description: "Hero banner to personalise the page by cohort / country." },
    package: { label: "Package", icon: Package, description: "Promote booking a coach, nutritionist or service package." },
    messages: { label: "Weekly Doctor Messages", icon: MessageSquare, description: "Scheduled care-team messages across the 4-month journey." },
    video: { label: "Video", icon: Video, description: "Medicine-focused videos surfaced weekly." },
    content: { label: "Content", icon: LayoutList, description: "A curated list of listings (top picks, tests, support…)." },
    symptoms: { label: "Clinical / Symptoms", icon: AlertCircle, description: "Symptoms, stop reasons, decline and ineligibility lists." },
    onboarding: { label: "Onboarding", icon: LayoutTemplate, description: "Program benefits and why the patient needs this." },
    nextdose: { label: "Next Dose", icon: Syringe, description: "Deep links to the next dose for each medication." },
    simpletitle: { label: "Section Title", icon: TypeIcon, description: "A title-only config for an app section." },
}

const TYPE_ORDER: RetentionSectionType[] = [
    "banner", "package", "messages", "video", "content",
    "symptoms", "onboarding", "nextdose", "simpletitle",
]

// Section types that use a free-text note + item count editor.
// (messages has its own structured editor, so it's excluded here.)
const NOTE_TYPES: RetentionSectionType[] = ["video", "symptoms", "onboarding", "nextdose"]

const rerank = (sections: RetentionSection[]): RetentionSection[] =>
    sections.map((s, i) => ({ ...s, rank: i + 1 }))

export default function RetentionBuilderRoute() {
    const params = useParams()
    const id = typeof params.id === "string" ? params.id : ""

    const [template, setTemplate] = useState<RetentionTemplate | null>(null)

    const dirtyTracker = useDirtyTracker(template)
    // Baseline for the unsaved-work guard: taken once the record is in state.
    useEffect(() => {
        if (template && !dirtyTracker.hasSnapshot) dirtyTracker.markClean()
    }, [template, dirtyTracker])
    const [listings, setListings] = useState<Listing[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [savedAt, setSavedAt] = useState<string | null>(null)

    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [listingQuery, setListingQuery] = useState<Record<string, string>>({})

    useEffect(() => {
        const load = async () => {
            try {
                const [tpl, allListings] = await Promise.all([
                    ApiService.catalogue.getRetentionTemplate(id),
                    ApiService.catalogue.listings(),
                ])
                setTemplate(tpl)
                setListings(allListings)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [id])

    const sections = useMemo(
        () => (template?.sections ?? []).slice().sort((a, b) => a.rank - b.rank),
        [template?.sections],
    )

    if (loading) {
        return <div className="flex h-64 items-center justify-center text-muted-foreground">Loading retention page…</div>
    }

    if (!template) {
        return (
            <div className="flex h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
                <p>Retention page not found.</p>
                <Button variant="outline" asChild><Link href="/catalogue/retention">Back to retention</Link></Button>
            </div>
        )
    }

    // ── Mutators ──
    const setSections = (updater: (prev: RetentionSection[]) => RetentionSection[]) =>
        setTemplate(t => (t ? { ...t, sections: rerank(updater(sections)) } : t))

    const updateSection = (sid: string, updater: (s: RetentionSection) => RetentionSection) =>
        setSections(prev => prev.map(s => (s.id === sid ? updater(s) : s)))

    const updateConfig = (sid: string, patch: Partial<RetentionSectionConfig>) =>
        updateSection(sid, s => ({ ...s, config: { ...s.config, ...patch } }))

    const move = (index: number, dir: -1 | 1) => {
        const target = index + dir
        if (target < 0 || target >= sections.length) return
        setSections(prev => {
            const next = prev.slice()
            const [item] = next.splice(index, 1)
            next.splice(target, 0, item)
            return next
        })
    }

    const addSection = (type: RetentionSectionType) => {
        const meta = TYPE_META[type]
        const newSection: RetentionSection = {
            id: `rs-${Date.now().toString(36)}`,
            rank: sections.length + 1,
            type,
            titleEn: meta.label,
            enabled: true,
            config: {},
        }
        setSections(prev => [...prev, newSection])
        setExpandedId(newSection.id)
    }

    const removeSection = (sid: string) => {
        setSections(prev => prev.filter(s => s.id !== sid))
        if (expandedId === sid) setExpandedId(null)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const saved = await ApiService.catalogue.updateRetentionTemplate(id, {
                name: template.name,
                descriptionEn: template.descriptionEn,
                sections: template.sections,
            })
            setTemplate(saved)
            dirtyTracker.markCleanAs(saved)
            setSavedAt(new Date().toLocaleTimeString())
        } finally {
            setSaving(false)
        }
    }

    const activeCount = sections.filter(s => s.enabled).length

    const guardedSave = async (): Promise<boolean> => {
        try { await handleSave(); return true } catch { return false }
    }

    return (
        <div className="flex h-[calc(100vh-80px)] flex-col">
            <UnsavedChangesGuard dirty={dirtyTracker.dirty} onSave={guardedSave} entityLabel="retention journey" />
            {/* Header */}
            <div className="mb-4 flex shrink-0 items-center justify-between gap-4 border-b pb-4">
                <div className="flex min-w-0 items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/catalogue/retention"><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div className="min-w-0">
                        <Input
                            value={template.name}
                            onChange={e => setTemplate(t => (t ? { ...t, name: e.target.value } : t))}
                            className="h-8 border-transparent px-1 text-lg font-semibold shadow-none focus-visible:border-input"
                            placeholder="Retention page name"
                        />
                        <p className="px-1 text-xs text-muted-foreground">
                            Section Manager · {sections.length} section{sections.length === 1 ? "" : "s"} · {activeCount} active
                            {savedAt && <span className="ml-2 text-emerald-600">Saved {savedAt}</span>}
                        </p>
                    </div>
                </div>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" /> {saving ? "Saving…" : "Save"}
                </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="max-w-3xl space-y-4 pb-10">
                    {/* Description */}
                    <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea
                            value={template.descriptionEn ?? ""}
                            onChange={e => setTemplate(t => (t ? { ...t, descriptionEn: e.target.value } : t))}
                            placeholder="What is this retention page for?"
                            rows={2}
                        />
                    </div>

                    {/* Add section — rich picker (mirrors the journey page-builder) */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button className="w-full"><Plus className="mr-2 h-4 w-4" /> Add section</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[360px]">
                            {TYPE_ORDER.map(t => {
                                const meta = TYPE_META[t]
                                const Icon = meta.icon
                                return (
                                    <DropdownMenuItem key={t} onClick={() => addSection(t)} className="flex items-start gap-3 py-2">
                                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                        <div>
                                            <p className="text-sm font-medium">{meta.label}</p>
                                            <p className="text-xs text-muted-foreground">{meta.description}</p>
                                        </div>
                                    </DropdownMenuItem>
                                )
                            })}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Section list */}
                    {sections.length === 0 && (
                        <p className="py-10 text-center text-sm italic text-muted-foreground">
                            No sections yet — add one above.
                        </p>
                    )}

                    {sections.map((section, index) => {
                        const meta = TYPE_META[section.type]
                        const Icon = meta.icon
                        const expanded = expandedId === section.id
                        return (
                            <div key={section.id} className={`rounded-lg border ${section.enabled ? "" : "opacity-70"}`}>
                                {/* Row */}
                                <div className="flex items-center gap-3 p-3">
                                    <Badge variant="secondary" className="h-6 w-8 shrink-0 justify-center tabular-nums">{section.rank}</Badge>
                                    <div className="flex flex-col gap-0.5">
                                        <Button variant="ghost" size="icon" className="h-5 w-6" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up">
                                            <ChevronUp className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-5 w-6" onClick={() => move(index, 1)} disabled={index === sections.length - 1} aria-label="Move down">
                                            <ChevronDown className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="truncate text-sm font-medium">{section.titleEn || meta.label}</span>
                                            <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                                            {typeof section.itemCount === "number" && (
                                                <Badge variant="outline" className="text-[10px] tabular-nums">{section.itemCount} items</Badge>
                                            )}
                                        </div>
                                        {section.descriptionEn && (
                                            <p className="truncate text-xs text-muted-foreground">{section.descriptionEn}</p>
                                        )}
                                    </div>
                                    <Switch
                                        checked={section.enabled}
                                        onCheckedChange={v => updateSection(section.id, s => ({ ...s, enabled: v }))}
                                        aria-label="Toggle enabled"
                                    />
                                    <Button variant="ghost" size="sm" className="h-8" onClick={() => setExpandedId(expanded ? null : section.id)}>
                                        <ChevronsUpDown className="mr-1 h-3.5 w-3.5" /> {expanded ? "Close" : "Edit"}
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSection(section.id)} aria-label="Remove section">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Expanded editor */}
                                {expanded && (
                                    <div className="space-y-4 border-t bg-muted/10 p-4">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div className="space-y-1.5">
                                                <Label>Title (EN)</Label>
                                                <Input
                                                    value={section.titleEn}
                                                    onChange={e => updateSection(section.id, s => ({ ...s, titleEn: e.target.value }))}
                                                    placeholder={meta.label}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label>Title (AR)</Label>
                                                <Input
                                                    dir="rtl"
                                                    value={section.titleAr ?? ""}
                                                    onChange={e => updateSection(section.id, s => ({ ...s, titleAr: e.target.value }))}
                                                    placeholder="العنوان بالعربية"
                                                />
                                            </div>
                                        </div>

                                        {section.type !== "simpletitle" && (
                                            <div className="space-y-1.5">
                                                <Label>Description (EN)</Label>
                                                <Textarea
                                                    value={section.descriptionEn ?? ""}
                                                    onChange={e => updateSection(section.id, s => ({ ...s, descriptionEn: e.target.value }))}
                                                    placeholder="Describe this section…"
                                                    rows={2}
                                                />
                                            </div>
                                        )}

                                        {/* Type-specific config */}
                                        {section.type === "banner" && (
                                            <ImageField
                                                label="Banner image"
                                                preset="banner"
                                                value={section.config?.bannerImageUrl}
                                                onChange={url => updateConfig(section.id, { bannerImageUrl: url })}
                                                altEn={section.config?.bannerAltEn}
                                                altAr={section.config?.bannerAltAr}
                                                onAltEnChange={v => updateConfig(section.id, { bannerAltEn: v })}
                                                onAltArChange={v => updateConfig(section.id, { bannerAltAr: v })}
                                            />
                                        )}

                                        {section.type === "package" && (
                                            <div className="space-y-1.5">
                                                <Label>Linked listing (package)</Label>
                                                <Select
                                                    value={section.config?.linkedListingId ?? "__none"}
                                                    onValueChange={v => updateConfig(section.id, { linkedListingId: v === "__none" ? undefined : v })}
                                                >
                                                    <SelectTrigger className="h-9"><SelectValue placeholder="Select a listing…" /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="__none">— None —</SelectItem>
                                                        {listings.map(l => (
                                                            <SelectItem key={l.id} value={l.id}>{l.displayNameEn || l.internalName}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {section.type === "content" && (
                                            <ContentListingPicker
                                                listings={listings}
                                                selected={section.config?.listingIds ?? []}
                                                query={listingQuery[section.id] ?? ""}
                                                onQuery={q => setListingQuery(prev => ({ ...prev, [section.id]: q }))}
                                                onToggle={lid => updateConfig(section.id, {
                                                    listingIds: (section.config?.listingIds ?? []).includes(lid)
                                                        ? (section.config?.listingIds ?? []).filter(x => x !== lid)
                                                        : [...(section.config?.listingIds ?? []), lid],
                                                })}
                                            />
                                        )}

                                        {section.type === "messages" && (
                                            <MessagesEditor
                                                messages={section.config?.messages ?? []}
                                                onChange={next => updateSection(section.id, s => ({
                                                    ...s,
                                                    itemCount: next.length,
                                                    config: { ...s.config, messages: next },
                                                }))}
                                            />
                                        )}

                                        {NOTE_TYPES.includes(section.type) && (
                                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                                <div className="space-y-1.5 sm:col-span-2">
                                                    <Label>Note (EN)</Label>
                                                    <Textarea
                                                        value={section.config?.noteEn ?? ""}
                                                        onChange={e => updateConfig(section.id, { noteEn: e.target.value })}
                                                        placeholder="Internal note / behaviour…"
                                                        rows={2}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label>Item count</Label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        value={section.itemCount ?? ""}
                                                        onChange={e => updateSection(section.id, s => ({
                                                            ...s,
                                                            itemCount: e.target.value === "" ? undefined : Number(e.target.value),
                                                        }))}
                                                        placeholder="—"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {section.type === "simpletitle" && (
                                            <p className="text-xs text-muted-foreground">
                                                Section-title config
                                                {section.config?.sectionKey ? ` · key: ${section.config.sectionKey}` : ""}. Only the title is editable.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

// Full "Weekly Doctor Messages" editor — the 16-message, 4-month schedule.
const MONTHS = [1, 2, 3, 4] as const
const monthOf = (week: number) => Math.min(4, Math.max(1, Math.ceil(week / 4)))
const msgId = () => `msg-${Math.random().toString(36).slice(2, 9)}`

function MessagesEditor({
    messages,
    onChange,
}: {
    messages: RetentionMessage[]
    onChange: (m: RetentionMessage[]) => void
}) {
    const sorted = [...messages].sort((a, b) => a.week - b.week)
    const publishedCount = messages.filter(m => m.status === "published").length

    const update = (mid: string, patch: Partial<RetentionMessage>) =>
        onChange(messages.map(m => (m.id === mid ? { ...m, ...patch } : m)))
    const remove = (mid: string) => onChange(messages.filter(m => m.id !== mid))
    const add = () => {
        const used = new Set(messages.map(m => m.week))
        let week = 1
        while (week < 16 && used.has(week)) week++
        onChange([...messages, { id: msgId(), week, titleEn: "", bodyEn: "", status: "draft" }])
    }

    return (
        <div className="space-y-4">
            {/* 4-month schedule overview */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MONTHS.map(mo => {
                    const inMonth = messages.filter(m => monthOf(m.week) === mo)
                    return (
                        <div key={mo} className="rounded-md border bg-muted/30 p-2.5">
                            <div className="text-[11px] text-muted-foreground">Month {mo} · Weeks {(mo - 1) * 4 + 1}–{mo * 4}</div>
                            <div className="text-sm font-semibold">{inMonth.length} message{inMonth.length === 1 ? "" : "s"}</div>
                        </div>
                    )
                })}
            </div>

            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{messages.length} total · {publishedCount} published</p>
                <Button size="sm" variant="outline" onClick={add} disabled={messages.length >= 16}>
                    <Plus className="mr-1 h-3.5 w-3.5" /> Add message
                </Button>
            </div>

            {messages.length === 0 ? (
                <p className="rounded-md border-2 border-dashed p-6 text-center text-sm text-muted-foreground">
                    No messages yet — add the weekly doctor messages for the 4-month journey (up to 16).
                </p>
            ) : (
                MONTHS.map(mo => {
                    const rows = sorted.filter(m => monthOf(m.week) === mo)
                    if (!rows.length) return null
                    return (
                        <div key={mo} className="space-y-2">
                            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Month {mo}</div>
                            {rows.map(m => (
                                <div key={m.id} className="space-y-2 rounded-md border p-3">
                                    <div className="flex items-center gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Week</Label>
                                            <Select value={String(m.week)} onValueChange={v => update(m.id, { week: Number(v) })}>
                                                <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {Array.from({ length: 16 }, (_, i) => i + 1).map(w => (
                                                        <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="ml-auto flex items-center gap-2">
                                            <Badge variant="outline" className={`text-[10px] ${m.status === "published" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>{m.status}</Badge>
                                            <Label className="text-[10px] text-muted-foreground">Published</Label>
                                            <Switch checked={m.status === "published"} onCheckedChange={v => update(m.id, { status: v ? "published" : "draft" })} />
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(m.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Title (EN)</Label>
                                            <Input className="h-8 text-sm" value={m.titleEn} onChange={e => update(m.id, { titleEn: e.target.value })} placeholder="e.g. Week 1: Welcome to your journey" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Title (AR)</Label>
                                            <Input dir="rtl" className="h-8 text-sm text-right" value={m.titleAr ?? ""} onChange={e => update(m.id, { titleAr: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Content (EN)</Label>
                                            <RichText value={m.bodyEn} onChange={html => update(m.id, { bodyEn: html })} placeholder="Write the message the care team sends this week…" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-[10px] text-muted-foreground">Content (AR)</Label>
                                            <RichText dir="rtl" value={m.bodyAr ?? ""} onChange={html => update(m.id, { bodyAr: html })} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                })
            )}
        </div>
    )
}

// Searchable multi-select of listings for "content" sections.
function ContentListingPicker({
    listings, selected, query, onQuery, onToggle,
}: {
    listings: Listing[]
    selected: string[]
    query: string
    onQuery: (q: string) => void
    onToggle: (id: string) => void
}) {
    const filtered = listings.filter(l =>
        !query || `${l.displayNameEn} ${l.internalName}`.toLowerCase().includes(query.toLowerCase()))
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>Listings</Label>
                <span className="text-xs text-muted-foreground">{selected.length} selected</span>
            </div>
            <Input value={query} onChange={e => onQuery(e.target.value)} placeholder="Search listings…" className="h-9" />
            <div className="max-h-56 divide-y overflow-y-auto rounded-md border">
                {filtered.slice(0, 200).map(l => (
                    <label key={l.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted/30">
                        <Checkbox checked={selected.includes(l.id)} onCheckedChange={() => onToggle(l.id)} />
                        <span className="flex-1 text-sm">{l.displayNameEn || l.internalName}</span>
                        <Badge variant="outline" className="text-[10px]">{l.department.replace("_", " ")}</Badge>
                    </label>
                ))}
                {filtered.length === 0 && (
                    <p className="py-6 text-center text-sm italic text-muted-foreground">No listings match.</p>
                )}
            </div>
        </div>
    )
}

