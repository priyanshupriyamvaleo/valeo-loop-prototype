"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
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
import { ArrowLeft, Plus, X, FileText, ChevronRight, Clock } from "lucide-react"
import { ApiService } from "@/services/api"
import { Article, ArticleCategory, Listing, Practitioner, ProductStatus, Tag } from "@/types"
import { RichText } from "@/components/catalogue/RichText"
import { ImageField } from "@/components/catalogue/ImageField"
import { LISTING_STATUSES, statusMeta } from "@/lib/listing-status"
import { UnsavedChangesGuard, useDirtyTracker } from "@/components/catalogue/UnsavedChangesGuard"
import { EntityHistory } from "@/components/audit/EntityHistory"
import { toast } from "sonner"

/**
 * Blog authoring. Deliberately reuses the catalogue's decisions rather than
 * inventing parallel ones: the same four publishing states, the same upload-only
 * media field, the same unsaved-work guard, the same audit trail. Article
 * CATEGORIES are their own tree — a blog topic is not a merchandising category.
 */
export default function ArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([])
    const [cats, setCats] = useState<ArticleCategory[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [team, setTeam] = useState<Practitioner[]>([])
    const [listings, setListings] = useState<Listing[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [draft, setDraft] = useState<Article | null>(null)
    const [saving, setSaving] = useState(false)
    const [query, setQuery] = useState("")
    const [newCat, setNewCat] = useState("")

    const tracker = useDirtyTracker(draft)

    const load = () => Promise.allSettled([
        ApiService.catalogue.articles(),
        ApiService.catalogue.articleCategories(),
        ApiService.catalogue.tags(),
        ApiService.catalogue.healthTeam(),
        ApiService.catalogue.listings(),
    ]).then(([a, c, t, h, l]) => {
        if (a.status === "fulfilled") setArticles(a.value)
        if (c.status === "fulfilled") setCats(c.value)
        if (t.status === "fulfilled") setTags(t.value)
        if (h.status === "fulfilled") setTeam(h.value)
        if (l.status === "fulfilled") setListings(l.value)
        setLoading(false)
    })
    useEffect(() => { load() }, [])

    const open = (a: Article) => { setEditingId(a.id); setDraft({ ...a }); tracker.markCleanAs({ ...a }) }
    const create = async () => {
        const a = await ApiService.catalogue.createArticle({ titleEn: "Untitled article" })
        setArticles(prev => [a, ...prev]); open(a)
        toast.success("Draft article created")
    }
    const save = async (): Promise<boolean> => {
        if (!draft) return false
        if (!draft.titleEn.trim()) { toast.error("A title is required"); return false }
        setSaving(true)
        try {
            const saved = await ApiService.catalogue.updateArticle(draft.id, draft)
            setArticles(prev => prev.map(a => (a.id === saved.id ? saved : a)))
            setDraft(saved); tracker.markCleanAs(saved)
            toast.success("Saved")
            return true
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not save")
            return false
        } finally { setSaving(false) }
    }
    const patch = (p: Partial<Article>) => setDraft(d => (d ? { ...d, ...p } : d))

    const addCategory = async () => {
        if (!newCat.trim()) return
        try {
            const c = await ApiService.catalogue.createArticleCategory({ nameEn: newCat })
            setCats(prev => [...prev, c]); setNewCat("")
            toast.success(`Category "${c.nameEn}" created`)
        } catch (e) { toast.error(e instanceof Error ? e.message : "Could not create") }
    }

    const filtered = useMemo(() => articles.filter(a =>
        !query || a.titleEn.toLowerCase().includes(query.toLowerCase())), [articles, query])

    // ── the editor ──
    if (editingId && draft) {
        const st = statusMeta(draft.status)
        return (
            <div className="space-y-5 pb-16">
                <UnsavedChangesGuard dirty={tracker.dirty} onSave={save} entityLabel="article" />
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-4">
                    <div className="flex min-w-[260px] flex-1 items-center gap-3">
                        <Button variant="ghost" size="icon" className="shrink-0"
                            onClick={() => { setEditingId(null); setDraft(null) }}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="truncate text-lg font-semibold">{draft.titleEn || "Untitled article"}</h2>
                                <Badge variant="outline" className={`shrink-0 text-[10px] ${st.className}`}>{st.label}</Badge>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                                /blog/{draft.slug}
                                {draft.readMinutes ? ` · ${draft.readMinutes} min read` : ""}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Select value={draft.status} onValueChange={v => patch({ status: v as ProductStatus })}>
                            <SelectTrigger className="h-9 w-[132px] shrink-0">
                                <span className="truncate">{st.label}</span>
                            </SelectTrigger>
                            <SelectContent className="w-80">
                                {LISTING_STATUSES.map(s => (
                                    <SelectItem key={s.id} value={s.id} className="flex-col items-start gap-0.5 py-1.5">
                                        <span className="text-xs font-medium">{s.label}</span>
                                        <span className="text-[10px] leading-snug text-muted-foreground">{s.blurb}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button size="sm" onClick={save} disabled={saving}>
                            {saving ? "Saving…" : "Save"}
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="py-3"><span className="text-sm font-semibold">Identity</span></CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Title (EN)</Label>
                                        <Input className="h-9" value={draft.titleEn}
                                            onChange={e => patch({ titleEn: e.target.value })} />
                                    </div>
                                    <div className="space-y-1" dir="rtl">
                                        <Label className="text-xs">العنوان (AR)</Label>
                                        <Input className="h-9 text-right" value={draft.titleAr ?? ""}
                                            onChange={e => patch({ titleAr: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Slug</Label>
                                        <Input className="h-9" value={draft.slug}
                                            onChange={e => patch({ slug: e.target.value })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Author — Health Team only</Label>
                                        {/* Authors are not free text: one identity across the blog,
                                            the catalogue and the User Service. */}
                                        <Select value={draft.authorPractitionerId ?? ""}
                                            onValueChange={v => {
                                                const t = team.find(x => x.id === v)
                                                patch({ authorPractitionerId: v, authorName: t?.nameEn ?? "" })
                                            }}>
                                            <SelectTrigger className="h-9 text-sm">
                                                <SelectValue placeholder={draft.authorName || "Pick a Health Team member"} />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-64">
                                                {team.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        {t.nameEn} — {t.kind.replace("_", " ")}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Excerpt (EN)</Label>
                                    <Input className="h-9" value={draft.excerptEn ?? ""}
                                        placeholder="One sentence for cards and search results"
                                        onChange={e => patch({ excerptEn: e.target.value })} />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-3">
                                <span className="text-sm font-semibold">Body</span>
                                <p className="text-xs text-muted-foreground">
                                    Only one H1 is allowed per page and it is the title — use H2 and below in the body.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-0">
                                <RichText label="English" value={draft.bodyEn ?? ""}
                                    onChange={html => patch({ bodyEn: html })}
                                    placeholder="Write the article…" />
                                <RichText label="العربية" dir="rtl" value={draft.bodyAr ?? ""}
                                    onChange={html => patch({ bodyAr: html })} />
                                <p className="text-[11px] text-muted-foreground">
                                    Read time is <strong>derived</strong> from the body on save
                                    {draft.readMinutes ? ` — currently ${draft.readMinutes} min` : ""}. A typed
                                    &ldquo;4 min read&rdquo; goes stale the first time a paragraph changes.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader className="py-3"><span className="text-sm font-semibold">Categories</span></CardHeader>
                            <CardContent className="space-y-2 pt-0">
                                <div className="flex flex-wrap gap-1.5">
                                    {(draft.categoryIds ?? []).map(id => (
                                        <Badge key={id} variant="outline" className="gap-1 py-1 text-[11px]">
                                            {cats.find(c => c.id === id)?.nameEn ?? id}
                                            <button type="button" onClick={() => patch({
                                                categoryIds: (draft.categoryIds ?? []).filter(x => x !== id),
                                            })}><X className="h-3 w-3" /></button>
                                        </Badge>
                                    ))}
                                    {(draft.categoryIds ?? []).length === 0 && (
                                        <p className="text-[11px] text-muted-foreground">
                                            None yet — a category decides where the article surfaces.
                                        </p>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline" className="h-7 w-full text-xs">
                                            <Plus className="mr-1 h-3 w-3" /> Add category
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-64">
                                        <DropdownMenuLabel className="text-xs">Blog categories</DropdownMenuLabel>
                                        {cats.filter(c => c.isActive && !(draft.categoryIds ?? []).includes(c.id)).map(c => (
                                            <DropdownMenuItem key={c.id} className="text-xs"
                                                onClick={() => patch({ categoryIds: [...(draft.categoryIds ?? []), c.id] })}>
                                                {c.nameEn}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <Separator />
                                <div className="flex gap-1.5">
                                    <Input className="h-7 text-xs" placeholder="New category name" value={newCat}
                                        onChange={e => setNewCat(e.target.value)}
                                        onKeyDown={e => { if (e.key === "Enter") addCategory() }} />
                                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={addCategory}>
                                        Add
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">
                                    Blog categories are separate from product categories on purpose — sharing one node
                                    is how a taxonomy rots.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-3"><span className="text-sm font-semibold">Hero image</span></CardHeader>
                            <CardContent className="pt-0">
                                <ImageField preset="hero" value={draft.heroImageUrl ?? ""}
                                    onChange={url => patch({ heroImageUrl: url })}
                                    altEn={draft.heroImageAltEn} onAltEnChange={v => patch({ heroImageAltEn: v })} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-3">
                                <span className="text-sm font-semibold">Linked listings</span>
                                <p className="text-xs text-muted-foreground">
                                    &ldquo;Shop the article&rdquo;. A reference, never a copy — the listing keeps
                                    owning its price, stock and status.
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-2 pt-0">
                                <div className="flex flex-wrap gap-1.5">
                                    {(draft.relatedListingIds ?? []).map(id => {
                                        const l = listings.find(x => x.id === id)
                                        return (
                                            <Badge key={id} variant="outline" className="gap-1 py-1 text-[11px]">
                                                {l?.displayNameEn ?? id}
                                                {/* a delisted or archived listing must not be silently promoted */}
                                                {l && l.status !== "active" && (
                                                    <span className="text-amber-700">· {statusMeta(l.status).label}</span>
                                                )}
                                                <button type="button" onClick={() => patch({
                                                    relatedListingIds: (draft.relatedListingIds ?? []).filter(x => x !== id),
                                                })}><X className="h-3 w-3" /></button>
                                            </Badge>
                                        )
                                    })}
                                    {(draft.relatedListingIds ?? []).length === 0 && (
                                        <p className="text-[11px] text-muted-foreground">
                                            None linked. An article about sleep can point at the sleep panel and the
                                            magnesium supplement.
                                        </p>
                                    )}
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button size="sm" variant="outline" className="h-7 w-full text-xs">
                                            <Plus className="mr-1 h-3 w-3" /> Link a listing
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="max-h-72 w-80 overflow-y-auto">
                                        <DropdownMenuLabel className="text-xs">Published listings</DropdownMenuLabel>
                                        {listings.filter(l => l.status === "active"
                                            && !(draft.relatedListingIds ?? []).includes(l.id)).slice(0, 60).map(l => (
                                                <DropdownMenuItem key={l.id} className="text-xs"
                                                    onClick={() => patch({
                                                        relatedListingIds: [...(draft.relatedListingIds ?? []), l.id],
                                                    })}>
                                                    {l.displayNameEn || l.internalName}
                                                </DropdownMenuItem>
                                            ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                <p className="text-[10px] text-muted-foreground">
                                    Tags do the reverse automatically: an article and a listing sharing
                                    <code className="mx-1 rounded bg-muted px-1">goal:better-sleep</code>
                                    relate without either being edited.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="py-3"><span className="text-sm font-semibold">SEO &amp; surfaces</span></CardHeader>
                            <CardContent className="space-y-3 pt-0">
                                <div className="space-y-1">
                                    <Label className="text-xs">SEO title</Label>
                                    <Input className="h-8 text-xs" value={draft.seoTitleEn ?? ""} maxLength={70}
                                        onChange={e => patch({ seoTitleEn: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Meta description</Label>
                                    <Input className="h-8 text-xs" value={draft.seoDescriptionEn ?? ""} maxLength={160}
                                        onChange={e => patch({ seoDescriptionEn: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Shown on</Label>
                                    <Select value={draft.visibleOn ?? "both"}
                                        onValueChange={v => patch({ visibleOn: v as Article["visibleOn"] })}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="both">App &amp; web</SelectItem>
                                            <SelectItem value="app">App only</SelectItem>
                                            <SelectItem value="web">Web only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Separator />
                                <div>
                                    <Label className="text-xs">Tags</Label>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {(draft.tagIds ?? []).map(id => (
                                            <Badge key={id} variant="outline" className="gap-1 text-[10px]">
                                                {tags.find(t => t.id === id)?.nameEn ?? id}
                                                <button type="button" onClick={() => patch({
                                                    tagIds: (draft.tagIds ?? []).filter(x => x !== id),
                                                })}><X className="h-3 w-3" /></button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="sm" variant="outline" className="mt-1.5 h-7 w-full text-xs">
                                                <Plus className="mr-1 h-3 w-3" /> Add tag
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="max-h-64 w-64 overflow-y-auto">
                                            {tags.filter(t => t.status === "active" && !(draft.tagIds ?? []).includes(t.id))
                                                .map(t => (
                                                    <DropdownMenuItem key={t.id} className="text-xs"
                                                        onClick={() => patch({ tagIds: [...(draft.tagIds ?? []), t.id] })}>
                                                        <span className="opacity-60">{t.namespace}:</span>&nbsp;{t.nameEn}
                                                    </DropdownMenuItem>
                                                ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                        Same governed vocabulary as listings — curated in Administration → Tags.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    // ── the list ──
    return (
        <div className="space-y-5 pb-16">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl space-y-1">
                    <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <FileText className="h-5 w-5 text-primary" /> Articles
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        The blog. Same four publishing states as the catalogue, same governed tags, same audit trail —
                        with its own category tree.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-9" asChild>
                        <Link href="/content">Content Hub</Link>
                    </Button>
                    <Button size="sm" className="h-9" onClick={create}>
                        <Plus className="mr-2 h-4 w-4" /> New Article
                    </Button>
                </div>
            </div>

            <Input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search articles…" className="h-9 max-w-sm" />

            {loading ? <p className="text-sm text-muted-foreground">Loading…</p> : (
                <Card className="overflow-hidden">
                    {filtered.length === 0 ? (
                        <CardContent className="py-10 text-center">
                            <p className="text-sm text-muted-foreground">No articles yet.</p>
                            <Button size="sm" variant="outline" className="mt-3" onClick={create}>
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Write the first one
                            </Button>
                        </CardContent>
                    ) : filtered.map(a => {
                        const st = statusMeta(a.status)
                        return (
                            <button key={a.id} type="button" onClick={() => open(a)}
                                className="flex w-full flex-wrap items-center gap-2 border-b px-3 py-2.5 text-left last:border-0 hover:bg-muted/30">
                                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{a.titleEn}</p>
                                    <p className="truncate text-[11px] text-muted-foreground">
                                        /blog/{a.slug}
                                        {a.authorName ? ` · ${a.authorName}` : ""}
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-1.5">
                                    {(a.categoryIds ?? []).slice(0, 2).map(id => (
                                        <Badge key={id} variant="outline" className="text-[10px]">
                                            {cats.find(c => c.id === id)?.nameEn ?? id}
                                        </Badge>
                                    ))}
                                    {a.readMinutes && (
                                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            <Clock className="h-3 w-3" />{a.readMinutes} min
                                        </span>
                                    )}
                                    <Badge variant="outline" className={`text-[10px] ${st.className}`}
                                        title={st.blurb}>{st.label}</Badge>
                                </div>
                            </button>
                        )
                    })}
                </Card>
            )}

            {draft?.id && <EntityHistory entityType="article" entityId={draft.id} />}

            <Card className="p-3">
                <p className="text-xs font-semibold">Blog categories ({cats.length})</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {cats.map(c => (
                        <Badge key={c.id} variant="outline" className="text-[11px]">
                            {c.nameEn} <span className="ml-1 opacity-60">
                                {articles.filter(a => (a.categoryIds ?? []).includes(c.id)).length}
                            </span>
                        </Badge>
                    ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                    A blog topic is not a merchandising category — these are a separate tree, created while editing an
                    article.
                </p>
            </Card>
        </div>
    )
}
