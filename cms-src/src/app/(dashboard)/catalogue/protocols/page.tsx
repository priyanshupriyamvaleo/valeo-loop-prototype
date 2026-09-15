"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Plus, Search, Pencil, LayoutTemplate } from "lucide-react"
import { ApiService } from "@/services/api"
import { planUrl, useHydrated, usePlans } from "@/lib/protocol-plans"
import { Protocol, ProtocolStatus, Journey } from "@/types"

const STATUS_BADGE: Record<ProtocolStatus, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    archived: "bg-rose-100 text-rose-700 border-rose-200",
}

export default function ProtocolsPage() {
    const [protocols, setProtocols] = useState<Protocol[]>([])
    const [journeys, setJourneys] = useState<Journey[]>([])
    /* The patient page of each protocol, read from the plan store. */
    const hydrated = useHydrated()
    const plans = usePlans()
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState("")

    /**
     * This screen needs protocols and journeys, and it needs nothing else.
     *
     * It used to await listings as well. That call reaches the real content
     * service, which answers 401 without a signed-in session, so Promise.all
     * rejected and the table never left "Loading protocols…". A screen must
     * not wait on data it does not show.
     */
    useEffect(() => {
        Promise.all([
            ApiService.catalogue.protocols(),
            ApiService.catalogue.journeys(),
        ]).then(([p, j]) => {
            setProtocols(p); setJourneys(j)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    // journeys are loaded for name resolution across the screen
    const journeyName = (id?: string) => journeys.find(j => j.id === id)?.nameEn

    const toggleActive = (id: string, next: boolean) =>
        setProtocols(prev => prev.map(p => p.id === id
            ? { ...p, isActive: next, status: next ? "active" : (p.status === "active" ? "draft" : p.status) }
            : p))

    const filtered = useMemo(() => protocols.filter(p => {
        if (!query) return true
        const hay = `${p.code} ${p.nameEn} ${p.nameAr} ${p.clinicianAuthor} ${p.targetCondition ?? ""}`.toLowerCase()
        return hay.includes(query.toLowerCase())
    }), [protocols, query])

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Protocols</h2>
                    <p className="text-sm text-muted-foreground">
                        Two stages each. The Step Builder decides what is delivered; the Plan
                        Builder decides what a patient reads, what they pay, and what they do
                        afterwards.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/catalogue/protocols/new"><Plus className="mr-2 h-4 w-4" /> New Protocol</Link>
                </Button>
            </div>

            <div className="flex items-center">
                <div className="relative ml-auto">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search protocols…" className="h-9 w-56 pl-8 text-sm" />
                </div>
            </div>

            <Card>
                {loading ? (
                    <div className="py-16 text-center text-muted-foreground text-sm">Loading protocols…</div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="text-xs">Code</TableHead>
                                    <TableHead className="text-xs">Name</TableHead>
                                    <TableHead className="text-xs">Clinician</TableHead>
                                    <TableHead className="text-xs">Target condition</TableHead>
                                    <TableHead className="text-xs"># Steps</TableHead>
                                    <TableHead className="text-xs">Patient page</TableHead>
                                    <TableHead className="text-xs">Status</TableHead>
                                    <TableHead className="text-xs">Active</TableHead>
                                    {/* Two actions, the way the live pages list has Edit
                                        and Manage: the protocol, and its page. */}
                                    <TableHead className="text-xs text-right">Edit</TableHead>
                                    <TableHead className="w-24 text-xs text-right">Page</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow><TableCell colSpan={10} className="text-center py-10 text-muted-foreground text-sm italic">No protocols match.</TableCell></TableRow>
                                ) : filtered.map(p => (
                                    <TableRow key={p.id} className="hover:bg-muted/20">
                                        <TableCell className="py-2.5">
                                            <span className="font-mono text-[11px] text-muted-foreground">{p.code}</span>
                                        </TableCell>
                                        <TableCell className="py-2.5">
                                            <Link href={`/catalogue/protocols/${p.id}`} className="block">
                                                <div className="font-medium text-sm">{p.nameEn}</div>
                                                <div className="text-[11px] text-muted-foreground" dir="rtl">{p.nameAr}</div>
                                                {journeyName(p.journeyId) && (
                                                    <div className="text-[10px] text-muted-foreground">Journey: {journeyName(p.journeyId)}</div>
                                                )}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="py-2.5 text-xs">{p.clinicianAuthor || "—"}</TableCell>
                                        <TableCell className="py-2.5 text-xs">{p.targetCondition || "—"}</TableCell>
                                        <TableCell className="py-2.5 text-xs">{p.steps.length}</TableCell>

                                        {/* The page publishes on its own, so its state is its
                                            own column. "no page yet" is a real answer. */}
                                        <TableCell className="py-2.5">
                                            {!hydrated ? (
                                                <span className="text-[11px] text-muted-foreground">…</span>
                                            ) : plans[p.id] ? (
                                                <div>
                                                    <span className="font-mono text-[10px] text-muted-foreground">
                                                        {planUrl(plans[p.id])}
                                                    </span>
                                                    <Badge variant="outline" className={`ml-1.5 text-[10px] ${plans[p.id].status === "published"
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                        : "border-slate-200 bg-slate-50 text-slate-600"}`}>
                                                        {plans[p.id].status === "published" ? "live" : "draft"}
                                                    </Badge>
                                                </div>
                                            ) : (
                                                <span className="text-[11px] text-muted-foreground">no page yet</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="py-2.5"><Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[p.status]}`}>{p.status}</Badge></TableCell>
                                        <TableCell className="py-2.5">
                                            <Switch checked={p.isActive} onCheckedChange={v => toggleActive(p.id, v)} />
                                        </TableCell>
                                        <TableCell className="py-2.5 text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild
                                                title="Step Builder">
                                                <Link href={`/catalogue/protocols/${p.id}`}><Pencil className="h-3.5 w-3.5" /></Link>
                                            </Button>
                                        </TableCell>
                                        <TableCell className="py-2.5 text-right">
                                            <Button variant="outline" size="sm" className="h-8" asChild
                                                title="Plan Builder">
                                                <Link href={`/catalogue/protocols/${p.id}/plan`}>
                                                    <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" /> Plan
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>
        </div>
    )
}
