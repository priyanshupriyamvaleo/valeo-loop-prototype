"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
    ArrowLeft, CalendarRange, CheckCircle2, ExternalLink, FileDown, LayoutTemplate,
    Plus, Search, Wand2,
} from "lucide-react"
import { ApiService } from "@/services/api"
import {
    draftGaps, emptyPlan, planPublishGaps, planStore, planUrl, toSlug, useHydrated, usePlan,
} from "@/lib/protocol-plans"
import { PageEditDrawer } from "@/components/protocol/plan/PageEditDrawer"
import {
    DEFAULT_BREAKS, DEFAULT_WEEKS, buildPhase, evenBreaks, journeyShapeGaps,
    phaseGaps, phaseRanges, phasesOf,
} from "@/lib/protocol-journey"
import { NumCell } from "@/components/catalogue/NumCell"
import { PhaseEditDrawer } from "@/components/protocol/journey/PhaseEditDrawer"
import type { JourneyPhase, Protocol, ProtocolPlan } from "@/types"

/**
 * PAGE BUILDER — the pages list.
 *
 * The whole flow, and it is the flow of the screen Valeo already runs:
 *
 *   1  a list of pages
 *   2  pick the one that is there, or Add New Page
 *   3  the drawer opens with Template and Seo
 *   4  the page appears in the list, with Edit and Manage.
 *      Edit reopens Template and Seo. Manage opens the widget screen.
 *
 * THE ONE DIFFERENCE from that screen: a protocol has ONE plan page, so Add
 * New Page is spent once it exists, and it says so rather than disappearing.
 *
 * TWO KINDS OF PAGE LIVE HERE. The plan page sells the protocol before
 * anybody buys. The three WEEKLY JOURNEY pages are what somebody already on it
 * opens from Today, one per phase, and they carry a different widget set for a
 * different job. They are listed together because managing a protocol's pages
 * is one task, and because the three phase pages only make sense read against
 * the plan page they follow.
 *
 * The three phase rows are always listed. A journey is three phases whatever
 * its length, so there is nothing to add — only something to write.
 */
export default function PlanPagesListPage() {
    const params = useParams()
    const protocolId = typeof params.id === "string" ? params.id : ""

    const hydrated = useHydrated()
    const stored = usePlan(protocolId)

    const [protocol, setProtocol] = useState<Protocol | null>(null)
    const [loading, setLoading] = useState(true)
    const [query, setQuery] = useState("")

    /* The drawer holds its own copy: an Inactive page stores anything, and an
       Active page must pass every rule, so Save has to be the moment of truth. */
    const [draft, setDraft] = useState<ProtocolPlan | null>(null)
    const [isNew, setIsNew] = useState(false)
    const [tab, setTab] = useState("template")
    const [showErrors, setShowErrors] = useState(false)
    /* The phase whose name and status is being edited. The drawer holds a
       copy, so an Active phase can be refused on Save the way a page is. */
    const [phaseDraft, setPhaseDraft] = useState<JourneyPhase | null>(null)
    const [phaseErrors, setPhaseErrors] = useState(false)

    useEffect(() => {
        ApiService.catalogue.protocols()
            .then(list => setProtocol(list.find(p => p.id === protocolId) ?? null))
            .catch(() => setProtocol(null))
            .finally(() => setLoading(false))
    }, [protocolId])

    const gaps = useMemo(
        () => (protocol && draft ? planPublishGaps(draft, protocol) : []),
        [draft, protocol],
    )

    /* "not saved" has to mean a real change, or it shows on a drawer nobody
       has typed into yet. A new page is always a change. */
    const dirty = useMemo(
        () => !!draft && (isNew || JSON.stringify(draft) !== JSON.stringify(stored)),
        [draft, isNew, stored],
    )

    const openNew = () => {
        if (!protocol) return
        /* Prefilled from the protocol, because a blank form for a page that can
           only ever belong to this protocol is typing for nothing. */
        setDraft({
            ...emptyPlan(),
            pageName: protocol.nameEn,
            slug: toSlug(protocol.nameEn),
            status: "draft",
        })
        setIsNew(true)
        setTab("template")
        setShowErrors(false)
    }

    const openEdit = () => {
        setDraft({ ...(stored ?? emptyPlan()) })
        setIsNew(false)
        setTab("template")
        setShowErrors(false)
    }

    const save = () => {
        if (!draft) return
        setShowErrors(true)

        /* Inactive stores anything except a nameless page: the list needs a
           name to show. Active runs every rule. */
        const blocking = draft.status === "published" ? gaps : draftGaps(gaps)

        if (blocking.length) {
            setTab(blocking[0].section === "seo" ? "seo" : "template")
            toast.error(
                blocking.length === 1 ? blocking[0].what : `${blocking.length} things are missing`,
                {
                    description: draft.status === "published"
                        ? "An Active page has to pass every rule."
                        : "The list shows the page by name.",
                },
            )
            return
        }

        const next: ProtocolPlan = draft.status === "published" && !draft.publishedAt
            ? { ...draft, publishedAt: new Date().toISOString() }
            : draft
        planStore.save(protocolId, next)
        setDraft(null)
        toast.success(isNew ? "Page created." : "Saved.", {
            description: next.status === "published"
                ? "The page is Active. A patient can open it."
                : "The page is Inactive, and the work is stored.",
        })
    }

    if (loading || !hydrated) {
        return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
    }

    if (!protocol) {
        return (
            <div className="py-16 text-center">
                <p className="text-sm font-medium">That protocol is not in the catalogue</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/catalogue/protocols">Back to protocols</Link>
                </Button>
            </div>
        )
    }

    const live = stored?.status === "published"
    const shown = stored && (!query.trim()
        || (stored.pageName ?? "").toLowerCase().includes(query.trim().toLowerCase()))

    return (
        <div className="space-y-5">
            {/* ── Where this is, and what it belongs to ── */}
            <div>
                <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-7 text-muted-foreground" asChild>
                    <Link href={`/catalogue/protocols/${protocolId}/plan`}>
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                        {protocol.nameEn} · Plan Builder
                    </Link>
                </Button>
                <h2 className="text-xl font-semibold">Page Builder</h2>
                <p className="text-sm text-muted-foreground">
                    The landing page a patient reads before buying{" "}
                    <span className="font-medium">{protocol.nameEn}</span>. One protocol, one page.
                </p>
            </div>

            {/* ── The toolbar of the live pages screen ── */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative ml-auto">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search" className="h-9 w-56 pl-8 text-sm" />
                </div>
                <Button onClick={openNew} disabled={!!stored}
                    title={stored ? "This protocol already has its page" : "Create the page"}>
                    <Plus className="mr-2 h-4 w-4" /> Add New Page
                </Button>
            </div>

            <Card className="overflow-hidden p-0">
                {!stored ? (
                    /* Empty, and it says what to do. A protocol without a page is
                       the normal state until somebody writes one. */
                    <div className="flex flex-col items-center gap-2 p-14 text-center">
                        <FileDown className="h-6 w-6 text-muted-foreground" />
                        <p className="text-sm font-medium">This protocol has no page yet</p>
                        <p className="max-w-sm text-xs text-muted-foreground">
                            Add New Page opens Template and Seo. After you save it, the page
                            appears here with Edit and Manage.
                        </p>
                        <Button size="sm" className="mt-3" onClick={openNew}>
                            <Plus className="mr-2 h-3.5 w-3.5" /> Add New Page
                        </Button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40">
                                    <TableHead className="w-16 text-xs">ID</TableHead>
                                    <TableHead className="text-xs">Name</TableHead>
                                    <TableHead className="w-32 text-xs">Status</TableHead>
                                    <TableHead className="w-28 text-xs text-center">Edit</TableHead>
                                    <TableHead className="w-32 text-xs text-center">Manage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!shown ? (
                                    <TableRow>
                                        <TableCell colSpan={5}
                                            className="py-10 text-center text-sm italic text-muted-foreground">
                                            Nothing matches that search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    <TableRow className="hover:bg-muted/20">
                                        <TableCell className="py-3">
                                            <span className="font-mono text-[11px] text-muted-foreground">1</span>
                                        </TableCell>

                                        <TableCell className="py-3">
                                            <button className="text-left text-sm font-medium hover:underline"
                                                onClick={openEdit}>
                                                {stored.pageName || "Untitled page"}
                                            </button>
                                            <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                                <code className="font-mono">{planUrl(stored)}</code>
                                                {live && stored.slug && (
                                                    <a href={`https://${planUrl(stored)}`} target="_blank"
                                                        rel="noreferrer" className="inline-flex items-center hover:underline">
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                )}
                                                <span>·</span>
                                                <span>{stored.blocks.length} widget{stored.blocks.length === 1 ? "" : "s"}</span>
                                            </p>
                                        </TableCell>

                                        <TableCell className="py-3">
                                            <Badge variant="outline" className={live
                                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                : "border-amber-200 bg-amber-50 text-amber-700"}>
                                                {live
                                                    ? <><CheckCircle2 className="mr-1 h-3 w-3" /> Active</>
                                                    : "Inactive"}
                                            </Badge>
                                        </TableCell>

                                        {/* Edit reopens Template and Seo. Manage is the widgets. */}
                                        <TableCell className="py-3 text-center">
                                            <Button variant="outline" size="sm" className="h-8 w-20"
                                                onClick={openEdit}>
                                                Edit
                                            </Button>
                                        </TableCell>
                                        <TableCell className="py-3 text-center">
                                            <Button variant="secondary" size="sm" className="h-8 w-24" asChild>
                                                <Link href={`/catalogue/protocols/${protocolId}/plan/pages/widgets`}>
                                                    <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" /> Manage
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            {/* ── THE WEEKLY JOURNEY ──
                Three pages, one per phase. Listed here because this is where a
                protocol's pages are managed, and separated because they are a
                different widget set doing a different job. */}
            {stored && (
                <div className="space-y-3 pt-2">
                    <div>
                        <h3 className="flex items-center gap-2 text-base font-semibold">
                            <CalendarRange className="h-4 w-4 text-muted-foreground" />
                            The weekly journey
                        </h3>
                        <p className="max-w-3xl text-sm text-muted-foreground">
                            What a patient opens from Today, once they are on the protocol. Three
                            phases, whatever the length. A step still carries no week — this is
                            keyed to how long ago they bought, which is known exactly.
                        </p>
                    </div>

                    {/* The shape, in one place. The three ranges are DERIVED from
                        these numbers, so no week can fall into two phases or none. */}
                    <Card className="flex flex-wrap items-end gap-5 p-4">
                        <div>
                            <p className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                The journey is
                            </p>
                            <div className="flex items-center gap-1.5">
                                <NumCell value={stored.journeyWeeks ?? DEFAULT_WEEKS}
                                    onCommit={raw => planStore.save(protocolId, {
                                        ...stored,
                                        journeyWeeks: raw === "" ? undefined : Number(raw),
                                    })} />
                                <span className="text-sm text-muted-foreground">weeks long</span>
                            </div>
                        </div>
                        <div>
                            <p className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                Phase one ends at week
                            </p>
                            <NumCell value={(stored.phaseBreaks ?? DEFAULT_BREAKS)[0]}
                                onCommit={raw => planStore.save(protocolId, {
                                    ...stored,
                                    phaseBreaks: [
                                        raw === "" ? DEFAULT_BREAKS[0] : Number(raw),
                                        (stored.phaseBreaks ?? DEFAULT_BREAKS)[1],
                                    ],
                                })} />
                        </div>
                        <div>
                            <p className="mb-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                Phase two ends at week
                            </p>
                            <NumCell value={(stored.phaseBreaks ?? DEFAULT_BREAKS)[1]}
                                onCommit={raw => planStore.save(protocolId, {
                                    ...stored,
                                    phaseBreaks: [
                                        (stored.phaseBreaks ?? DEFAULT_BREAKS)[0],
                                        raw === "" ? DEFAULT_BREAKS[1] : Number(raw),
                                    ],
                                })} />
                        </div>
                        <div className="ml-auto flex flex-wrap items-center gap-1.5">
                            {phaseRanges(stored).map(r => (
                                <Badge key={r.phase} variant="outline" className="text-[11px]">
                                    {r.label}
                                </Badge>
                            ))}
                            {/* Changing the length leaves the breaks alone, because
                                somebody chose them. This is the one press that
                                re-cuts a journey into three even parts. */}
                            <Button variant="ghost" size="sm" className="h-7 text-xs"
                                onClick={() => planStore.save(protocolId, {
                                    ...stored,
                                    phaseBreaks: evenBreaks(stored.journeyWeeks ?? DEFAULT_WEEKS),
                                })}>
                                Even thirds
                            </Button>
                        </div>
                    </Card>

                    {journeyShapeGaps(stored).length > 0 && (
                        <Card className="border-amber-200 bg-amber-50/60 p-3">
                            <ul className="space-y-1 text-xs text-amber-900">
                                {journeyShapeGaps(stored).map((g, i) => (
                                    <li key={i}><b>{g.what}.</b> <span className="text-amber-800">{g.why}</span></li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/40">
                                        <TableHead className="w-16 text-xs">ID</TableHead>
                                        <TableHead className="text-xs">Name</TableHead>
                                        <TableHead className="w-32 text-xs">Status</TableHead>
                                        <TableHead className="w-28 text-xs text-center">Edit</TableHead>
                                        <TableHead className="w-32 text-xs text-center">Manage</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {phasesOf(stored).map((ph, i) => {
                                        const range = phaseRanges(stored)[i]
                                        const written = ph.blocks.length > 0
                                        const phLive = ph.status === "published"
                                        const phGaps = written || ph.pageName ? phaseGaps(ph, range) : []
                                        return (
                                            <TableRow key={ph.phase} className="hover:bg-muted/20">
                                                <TableCell className="py-3">
                                                    <span className="font-mono text-[11px] text-muted-foreground">
                                                        P{ph.phase}
                                                    </span>
                                                </TableCell>

                                                <TableCell className="py-3">
                                                    <button className="text-left text-sm font-medium hover:underline"
                                                        onClick={() => { setPhaseDraft({ ...ph }); setPhaseErrors(false) }}>
                                                        {ph.pageName || `Phase ${ph.phase} · ${range.label}`}
                                                    </button>
                                                    <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                                        <span>{range.label}</span>
                                                        <span>·</span>
                                                        <span>
                                                            {written
                                                                ? `${ph.blocks.length} section${ph.blocks.length === 1 ? "" : "s"}`
                                                                : "not written yet"}
                                                        </span>
                                                    </p>
                                                    {phGaps.length > 0 && (
                                                        <span className="block text-[11px] text-amber-700">
                                                            {phGaps.length} thing{phGaps.length === 1 ? "" : "s"} to fill in
                                                        </span>
                                                    )}
                                                </TableCell>

                                                <TableCell className="py-3">
                                                    <Badge variant="outline" className={phLive
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                                        : written
                                                            ? "border-amber-200 bg-amber-50 text-amber-700"
                                                            : "border-slate-200 bg-slate-50 text-slate-600"}>
                                                        {phLive
                                                            ? <><CheckCircle2 className="mr-1 h-3 w-3" /> Active</>
                                                            : written ? "Inactive" : "Blank"}
                                                    </Badge>
                                                </TableCell>

                                                <TableCell className="py-3 text-center">
                                                    <Button variant="outline" size="sm" className="h-8 w-20"
                                                        onClick={() => { setPhaseDraft({ ...ph }); setPhaseErrors(false) }}>
                                                        Edit
                                                    </Button>
                                                </TableCell>
                                                <TableCell className="py-3 text-center">
                                                    {written ? (
                                                        <Button variant="secondary" size="sm" className="h-8 w-24" asChild>
                                                            <Link href={`/catalogue/protocols/${protocolId}/plan/pages/phase/${ph.phase}`}>
                                                                <LayoutTemplate className="mr-1.5 h-3.5 w-3.5" /> Manage
                                                            </Link>
                                                        </Button>
                                                    ) : (
                                                        /* Nothing to manage on a blank page. Offer the
                                                           thing that makes one instead. */
                                                        <Button variant="outline" size="sm" className="h-8 w-24"
                                                            onClick={() => {
                                                                planStore.save(protocolId, {
                                                                    ...stored,
                                                                    phases: phasesOf(stored).map(x => (
                                                                        x.phase === ph.phase
                                                                            ? buildPhase(ph.phase, range)
                                                                            : x)),
                                                                })
                                                                toast.success(`Phase ${ph.phase} laid out.`, {
                                                                    description: "Five sections, worded for these weeks. Manage them to edit.",
                                                                })
                                                            }}>
                                                            <Wand2 className="mr-1.5 h-3.5 w-3.5" /> Write it
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                Pages are held in a prototype store in this browser. A content-service
                endpoint replaces it without a change to these screens.
            </p>

            <PageEditDrawer
                open={!!draft}
                isNew={isNew}
                plan={draft ?? emptyPlan()}
                protocol={protocol}
                gaps={gaps}
                showErrors={showErrors}
                dirty={dirty}
                tab={tab}
                onTab={setTab}
                onChange={patch => setDraft(prev => (prev ? { ...prev, ...patch } : prev))}
                onSave={save}
                onClose={() => setDraft(null)}
            />

            <PhaseEditDrawer
                phase={phaseDraft}
                range={phaseRanges(stored)[(phaseDraft?.phase ?? 1) - 1]}
                gaps={phaseDraft
                    ? phaseGaps(phaseDraft, phaseRanges(stored)[phaseDraft.phase - 1])
                    : []}
                showErrors={phaseErrors}
                onChange={patch => setPhaseDraft(prev => (prev ? { ...prev, ...patch } : prev))}
                onSave={() => {
                    if (!phaseDraft || !stored) return
                    setPhaseErrors(true)
                    const range = phaseRanges(stored)[phaseDraft.phase - 1]
                    const all = phaseGaps(phaseDraft, range)
                    /* Inactive stores anything but a nameless page, because the
                       list finds it by name. Active runs every rule. */
                    const blocking = phaseDraft.status === "published"
                        ? all : all.filter(g => g.blocksDraft)
                    if (blocking.length) {
                        toast.error(
                            blocking.length === 1 ? blocking[0].what : `${blocking.length} things are missing`,
                            {
                                description: phaseDraft.status === "published"
                                    ? "An Active phase page has to pass every rule."
                                    : "The list shows the page by name.",
                            },
                        )
                        return
                    }
                    const next = phaseDraft.status === "published" && !phaseDraft.publishedAt
                        ? { ...phaseDraft, publishedAt: new Date().toISOString() }
                        : phaseDraft
                    planStore.save(protocolId, {
                        ...stored,
                        phases: phasesOf(stored).map(x => (x.phase === next.phase ? next : x)),
                    })
                    setPhaseDraft(null)
                    toast.success("Saved.", {
                        description: next.status === "published"
                            ? `A patient in ${range.label} reads it.`
                            : "The page is Inactive, and the work is stored.",
                    })
                }}
                onClose={() => setPhaseDraft(null)}
            />
        </div>
    )
}
