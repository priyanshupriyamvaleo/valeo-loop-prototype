"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, Search, Check, X, Merge, AlertTriangle, Tag as TagIcon, EyeOff } from "lucide-react"
import { ApiService } from "@/services/api"
import { Tag, TagNamespace, TAG_NAMESPACES } from "@/types"
import { toast } from "sonner"

const NS_COLOUR: Record<TagNamespace, string> = {
    goal: "bg-blue-100 text-blue-700 border-blue-200",
    audience: "bg-violet-100 text-violet-700 border-violet-200",
    condition: "bg-rose-100 text-rose-700 border-rose-200",
    campaign: "bg-amber-100 text-amber-700 border-amber-200",
    ops: "bg-slate-200 text-slate-700 border-slate-300",
    clinical: "bg-emerald-100 text-emerald-700 border-emerald-200",
}

export default function TagsPage() {
    const [tags, setTags] = useState<Tag[]>([])
    const [usage, setUsage] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState("")
    const [nsFilter, setNsFilter] = useState<TagNamespace | "all">("all")
    const [mergeFrom, setMergeFrom] = useState<Tag | null>(null)

    const reload = async () => {
        const [t, u] = await Promise.all([ApiService.catalogue.tags(), ApiService.catalogue.tagUsage()])
        setTags(t); setUsage(u); setLoading(false)
    }
    useEffect(() => { reload() }, [])

    const proposed = tags.filter(t => t.status === "proposed")
    const filtered = useMemo(() => tags.filter(t => {
        if (t.status === "proposed") return false
        if (nsFilter !== "all" && t.namespace !== nsFilter) return false
        const q = query.trim().toLowerCase()
        return !q || t.nameEn.toLowerCase().includes(q) || t.slug.includes(q)
    }), [tags, nsFilter, query])

    const byNamespace = useMemo(() => {
        const m = new Map<TagNamespace, Tag[]>()
        filtered.forEach(t => m.set(t.namespace, [...(m.get(t.namespace) ?? []), t]))
        return m
    }, [filtered])

    const setStatus = async (t: Tag, status: Tag["status"]) => {
        await ApiService.catalogue.updateTag(t.id, { status })
        toast.success(status === "active" ? `“${t.nameEn}” approved` : `“${t.nameEn}” set ${status}`)
        reload()
    }

    return (
        <div className="space-y-5 pb-16">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl space-y-1">
                    <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
                        <TagIcon className="h-5 w-5 text-primary" /> Tags
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Cross-cutting labels for filtering, merchandising and operations. Tags are a flat layer —
                        they are <strong>not</strong> a third taxonomy.
                    </p>
                </div>
                <NewTagDialog onCreated={reload} />
            </div>

            {/* The rule that keeps this from rotting into a shadow taxonomy. */}
            <Card className="border-l-4 border-l-blue-500 p-3">
                <p className="text-xs font-semibold">When is something a tag, and when is it taxonomy?</p>
                <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                    <p>It changes which <strong>fields</strong> a listing needs → that is a <strong>sub-department</strong>.</p>
                    <p>It changes <strong>where</strong> the listing appears in navigation → that is a <strong>category</strong>.</p>
                    <p>It is a cross-cutting attribute you want to <strong>filter, merchandise or operate</strong> on → tag.</p>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                    Anyone can <strong>apply</strong> a tag while editing a listing, and can <strong>propose</strong> a new
                    one. Only this page <strong>creates</strong> the vocabulary — that is what stops
                    <code className="mx-1 rounded bg-muted px-1">glp1</code>,
                    <code className="mx-1 rounded bg-muted px-1">GLP-1</code> and
                    <code className="mx-1 rounded bg-muted px-1">GLP 1</code> becoming three tags.
                </p>
            </Card>

            {/* Proposals — visible to the proposer too, so nobody re-proposes. */}
            {proposed.length > 0 && (
                <Card className="border-l-4 border-l-amber-500 p-3">
                    <p className="text-xs font-semibold">
                        {proposed.length} tag{proposed.length === 1 ? "" : "s"} proposed by category managers
                    </p>
                    <div className="mt-2 space-y-2">
                        {proposed.map(t => (
                            <div key={t.id} className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant="outline" className={NS_COLOUR[t.namespace]}>
                                    {t.namespace}:{t.slug}
                                </Badge>
                                <span className="font-medium">{t.nameEn}</span>
                                <span className="text-muted-foreground">requested by {t.createdByName ?? "—"}</span>
                                <div className="ml-auto flex gap-1.5">
                                    <Button size="sm" className="h-7 text-xs" onClick={() => setStatus(t, "active")}>
                                        <Check className="mr-1 h-3 w-3" /> Approve
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs"
                                        onClick={() => setStatus(t, "inactive")}>
                                        <X className="mr-1 h-3 w-3" /> Decline
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search tags…"
                        className="h-9 w-56 pl-8 text-sm" />
                </div>
                <Button size="sm" variant={nsFilter === "all" ? "default" : "outline"} className="h-8 text-xs"
                    onClick={() => setNsFilter("all")}>All</Button>
                {TAG_NAMESPACES.map(n => (
                    <Button key={n.id} size="sm" variant={nsFilter === n.id ? "default" : "outline"}
                        className="h-8 text-xs" onClick={() => setNsFilter(n.id)}>{n.label}</Button>
                ))}
            </div>

            {loading ? (
                <p className="text-sm text-muted-foreground">Loading tags…</p>
            ) : TAG_NAMESPACES.filter(n => (byNamespace.get(n.id) ?? []).length > 0).map(n => (
                <Card key={n.id} className="overflow-hidden">
                    <div className="flex flex-wrap items-baseline gap-2 border-b bg-muted/20 px-3 py-2">
                        <Badge variant="outline" className={`text-[10px] ${NS_COLOUR[n.id]}`}>{n.id}</Badge>
                        <span className="text-sm font-semibold">{n.label}</span>
                        <span className="text-xs text-muted-foreground">{n.blurb}</span>
                        {["ops", "clinical"].includes(n.id) && (
                            <Badge variant="outline" className="ml-auto gap-1 text-[10px]">
                                <EyeOff className="h-3 w-3" /> internal — never in a storefront filter
                            </Badge>
                        )}
                    </div>
                    <div className="divide-y">
                        {(byNamespace.get(n.id) ?? []).map(t => {
                            const used = usage[t.id] ?? 0
                            return (
                                <div key={t.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-xs">
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{t.namespace}:{t.slug}</code>
                                    <span className="font-medium">{t.nameEn}</span>
                                    {t.nameAr && <span dir="rtl" className="text-muted-foreground">{t.nameAr}</span>}
                                    <span className="text-muted-foreground">{used} listing{used === 1 ? "" : "s"}</span>
                                    {t.status === "inactive" && (
                                        <Badge variant="outline" className="text-[10px] bg-muted">inactive</Badge>
                                    )}
                                    <div className="ml-auto flex items-center gap-3">
                                        <label className="flex items-center gap-1.5">
                                            <Switch checked={t.status === "active"}
                                                onCheckedChange={v => setStatus(t, v ? "active" : "inactive")} />
                                            <span className="text-muted-foreground">Active</span>
                                        </label>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                                            onClick={() => setMergeFrom(t)}>
                                            <Merge className="mr-1 h-3 w-3" /> Merge
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </Card>
            ))}

            <p className="text-xs text-muted-foreground">
                Nothing here deletes. Deactivating a tag removes it from storefront filters but leaves it on the
                listings that already carry it, so history and reporting stay intact. To consolidate duplicates,
                use <strong>Merge</strong> — every relabelled listing is written to the Audit Log individually.
            </p>

            <MergeDialog from={mergeFrom} tags={tags} usage={usage}
                onClose={() => setMergeFrom(null)} onDone={reload} />
        </div>
    )
}

function NewTagDialog({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false)
    const [namespace, setNamespace] = useState<TagNamespace>("goal")
    const [nameEn, setNameEn] = useState("")
    const [nameAr, setNameAr] = useState("")
    const [busy, setBusy] = useState(false)
    const slug = nameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const meta = TAG_NAMESPACES.find(n => n.id === namespace)!

    const submit = async () => {
        setBusy(true)
        try {
            await ApiService.catalogue.createTag({ namespace, nameEn, nameAr, status: "active" })
            toast.success(`Created ${namespace}:${slug}`)
            setOpen(false); setNameEn(""); setNameAr(""); onCreated()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not create tag")
        } finally { setBusy(false) }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="h-9"><Plus className="mr-2 h-4 w-4" /> New Tag</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>New tag</DialogTitle>
                    <DialogDescription>
                        Pick the namespace first — it decides what the tag means and whether customers ever see it.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Namespace</Label>
                        <Select value={namespace} onValueChange={v => setNamespace(v as TagNamespace)}>
                            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {TAG_NAMESPACES.map(n => (
                                    <SelectItem key={n.id} value={n.id}>{n.label} — {n.blurb}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">e.g. {meta.example}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Name (EN)</Label>
                            <Input className="h-9 text-sm" value={nameEn} onChange={e => setNameEn(e.target.value)}
                                placeholder="Weight Loss" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Name (AR)</Label>
                            <Input dir="rtl" className="h-9 text-sm text-right" value={nameAr}
                                onChange={e => setNameAr(e.target.value)} />
                        </div>
                    </div>
                    <Separator />
                    <p className="text-xs text-muted-foreground">
                        Will be created as <code className="rounded bg-muted px-1">{namespace}:{slug || "…"}</code>
                        {["ops", "clinical"].includes(namespace)
                            ? " — internal only, never shown in a storefront filter."
                            : " — customer-facing."}
                    </p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button disabled={!slug || busy} onClick={submit}>{busy ? "Creating…" : "Create tag"}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function MergeDialog({ from, tags, usage, onClose, onDone }: {
    from: Tag | null; tags: Tag[]; usage: Record<string, number>
    onClose: () => void; onDone: () => void
}) {
    const [into, setInto] = useState<string>("")
    const [busy, setBusy] = useState(false)
    useEffect(() => { setInto("") }, [from])
    if (!from) return null
    const count = usage[from.id] ?? 0
    // Merging only makes sense inside a namespace — a goal is not an ops flag.
    const candidates = tags.filter(t => t.namespace === from.namespace && t.id !== from.id && t.status === "active")
    const target = candidates.find(t => t.id === into)

    const submit = async () => {
        setBusy(true)
        try {
            const { relabelled } = await ApiService.catalogue.mergeTags(from.id, into)
            toast.success(`Merged — ${relabelled} listing${relabelled === 1 ? "" : "s"} relabelled`)
            onDone(); onClose()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Merge failed")
        } finally { setBusy(false) }
    }

    return (
        <Dialog open onOpenChange={o => !o && onClose()}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Merge “{from.nameEn}” into another tag</DialogTitle>
                    <DialogDescription>
                        Every listing carrying <code className="rounded bg-muted px-1">{from.namespace}:{from.slug}</code> is
                        relabelled, and this tag is then deactivated. Tags only merge within one namespace.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div className="space-y-1">
                        <Label className="text-xs">Merge into</Label>
                        <Select value={into} onValueChange={setInto}>
                            <SelectTrigger className="h-9 text-sm">
                                <SelectValue placeholder={candidates.length ? "Pick the surviving tag" : "No other active tag in this namespace"} />
                            </SelectTrigger>
                            <SelectContent>
                                {candidates.map(t => (
                                    <SelectItem key={t.id} value={t.id}>
                                        {t.nameEn} ({t.namespace}:{t.slug}) — {usage[t.id] ?? 0} listings
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    {/* Show the blast radius BEFORE the button does anything. */}
                    <div className={`flex gap-2 rounded-md border p-3 text-xs ${count > 50 ? "border-destructive/30 bg-destructive/5" : "bg-muted/20"}`}>
                        <AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${count > 50 ? "text-destructive" : "text-muted-foreground"}`} />
                        <p>
                            <strong>{count} listing{count === 1 ? "" : "s"}</strong> currently carry this tag and will be
                            relabelled{target ? <> to <strong>{target.nameEn}</strong></> : ""}. Each one is recorded
                            separately in the Audit Log, so this is reversible by review.
                            {count > 50 && " That is a large relabel — confirm it is what you intend."}
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button disabled={!into || busy} onClick={submit}>
                        {busy ? "Merging…" : `Merge & relabel ${count}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
