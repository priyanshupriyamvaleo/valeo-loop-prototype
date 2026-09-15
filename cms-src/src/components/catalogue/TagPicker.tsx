"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus, X, Check, Search, Tag as TagIcon, EyeOff, Clock } from "lucide-react"
import Link from "next/link"
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

/**
 * Apply tags to a listing. Deliberately cannot create the vocabulary — an
 * operator may only pick from the curated list, or PROPOSE an addition that an
 * admin approves in Administration → Tags. Free-typed tags are how you end up
 * with glp1 / GLP-1 / GLP 1 as three separate labels.
 */
export function TagPicker({ value, onChange, proposerName }: {
    value: string[]
    onChange: (ids: string[]) => void
    proposerName?: string
}) {
    const [tags, setTags] = useState<Tag[]>([])
    const [query, setQuery] = useState("")
    const [proposing, setProposing] = useState<TagNamespace | null>(null)
    const [proposeName, setProposeName] = useState("")

    const reload = () => ApiService.catalogue.tags().then(setTags)
    useEffect(() => { reload() }, [])

    const selected = useMemo(
        () => value.map(id => tags.find(t => t.id === id)).filter((t): t is Tag => !!t),
        [value, tags])

    // Only active tags can be newly applied. A tag that was deactivated after
    // being applied stays visible on the listing (see the note below) — history
    // must not silently rewrite itself.
    const selectable = useMemo(() => tags.filter(t => t.status === "active"), [tags])
    const q = query.trim().toLowerCase()
    const matching = useMemo(() => selectable.filter(t =>
        !q || t.nameEn.toLowerCase().includes(q) || t.slug.includes(q)), [selectable, q])

    const toggle = (id: string) =>
        onChange(value.includes(id) ? value.filter(x => x !== id) : [...value, id])

    const propose = async (namespace: TagNamespace) => {
        if (!proposeName.trim()) return
        try {
            await ApiService.catalogue.createTag({
                namespace, nameEn: proposeName, status: "proposed", createdByName: proposerName,
            })
            toast.success("Proposed — an admin will approve it in Administration → Tags")
            setProposeName(""); setProposing(null); reload()
        } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not propose tag")
        }
    }

    const staleSelected = selected.filter(t => t.status !== "active")

    return (
        <Card>
            <CardHeader className="py-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <TagIcon className="h-4 w-4 text-primary" />
                            <span className="text-sm font-semibold">Tags</span>
                            {selected.length > 0 && (
                                <Badge variant="outline" className="text-[10px]">{selected.length} applied</Badge>
                            )}
                        </div>
                        <p className="mt-1 max-w-2xl text-xs text-muted-foreground">
                            Cross-cutting labels — used to filter in the CMS, build dynamic collections on the
                            storefront, and route fulfilment. Pick from the curated list; if what you need is
                            missing, propose it and an admin approves it.
                        </p>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs">
                                <Plus className="mr-1 h-3.5 w-3.5" /> Add tag
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-80">
                            <div className="p-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input value={query} onChange={e => setQuery(e.target.value)}
                                        placeholder="Search tags…" className="h-8 pl-7 text-xs" />
                                </div>
                            </div>
                            <div className="max-h-72 overflow-y-auto">
                                {TAG_NAMESPACES.map(n => {
                                    const rows = matching.filter(t => t.namespace === n.id)
                                    if (rows.length === 0) return null
                                    return (
                                        <div key={n.id}>
                                            <DropdownMenuLabel className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide">
                                                {n.label}
                                                {["ops", "clinical"].includes(n.id) && (
                                                    <span title="Internal — never shown to customers"><EyeOff className="h-3 w-3" /></span>
                                                )}
                                            </DropdownMenuLabel>
                                            {rows.map(t => (
                                                <DropdownMenuItem key={t.id} onSelect={e => { e.preventDefault(); toggle(t.id) }}
                                                    className="text-xs">
                                                    <span className={`mr-2 flex h-3.5 w-3.5 items-center justify-center rounded border ${value.includes(t.id) ? "bg-primary text-primary-foreground" : ""}`}>
                                                        {value.includes(t.id) && <Check className="h-2.5 w-2.5" />}
                                                    </span>
                                                    {t.nameEn}
                                                    <code className="ml-auto text-[10px] text-muted-foreground">{t.slug}</code>
                                                </DropdownMenuItem>
                                            ))}
                                        </div>
                                    )
                                })}
                                {matching.length === 0 && (
                                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                                        No tag matches “{query}”.
                                    </p>
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            {proposing ? (
                                <div className="space-y-2 p-2">
                                    <p className="text-[11px] font-medium">
                                        Propose a new {TAG_NAMESPACES.find(n => n.id === proposing)?.label} tag
                                    </p>
                                    <Input autoFocus value={proposeName} onChange={e => setProposeName(e.target.value)}
                                        placeholder="e.g. Gut Health" className="h-8 text-xs"
                                        onKeyDown={e => { if (e.key === "Enter") propose(proposing) }} />
                                    <div className="flex gap-1.5">
                                        <Button size="sm" className="h-7 flex-1 text-xs" onClick={() => propose(proposing)}>
                                            Propose
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 text-xs"
                                            onClick={() => setProposing(null)}>Cancel</Button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        It will not be applied until an admin approves it.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wide">
                                        Missing something? Propose it
                                    </DropdownMenuLabel>
                                    {TAG_NAMESPACES.map(n => (
                                        <DropdownMenuItem key={n.id} onSelect={e => { e.preventDefault(); setProposing(n.id) }}
                                            className="text-xs">
                                            <Plus className="mr-2 h-3 w-3" /> New {n.label} tag
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {selected.length === 0 ? (
                    <p className="rounded-md border-2 border-dashed bg-muted/10 px-3 py-4 text-center text-xs text-muted-foreground">
                        No tags applied. Tags are optional — they never decide what a listing <em>is</em> or where it
                        sits in navigation, only how it can be found and handled.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-1.5">
                        {selected.map(t => (
                            <Badge key={t.id} variant="outline"
                                className={`gap-1 py-1 text-[11px] ${NS_COLOUR[t.namespace]} ${t.status !== "active" ? "opacity-60" : ""}`}>
                                <span className="opacity-70">{t.namespace}:</span>{t.nameEn}
                                {t.status === "proposed" && <span title="Awaiting admin approval"><Clock className="h-3 w-3" /></span>}
                                {!t.customerFacing && <span title="Internal only"><EyeOff className="h-3 w-3" /></span>}
                                <button type="button" onClick={() => toggle(t.id)} className="ml-0.5 hover:opacity-60">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                )}
                {staleSelected.length > 0 && (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                        {staleSelected.length} applied tag{staleSelected.length === 1 ? " is" : "s are"} not active —
                        it stays on this listing for history and reporting, but is excluded from storefront filters.
                    </p>
                )}
                <p className="mt-2 text-[11px] text-muted-foreground">
                    The vocabulary is curated in{" "}
                    <Link href="/catalogue/tags" className="underline">Administration → Tags</Link>.
                </p>
            </CardContent>
        </Card>
    )
}
