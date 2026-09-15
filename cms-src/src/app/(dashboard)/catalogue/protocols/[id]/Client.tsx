"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Link from "next/link"
import {
    AlertCircle, Send, ArrowRight, GitBranch, LayoutTemplate,
} from "lucide-react"
import { toast } from "sonner"
import { ApiService } from "@/services/api"
import { ListingEditorShell, EditorSection } from "@/components/catalogue/ListingEditorShell"
import { useHydrated, usePlan } from "@/lib/protocol-plans"
import {
    Protocol, ProtocolStatus, ProtocolVariantAttribute,
    ProtocolVariantAxis, Journey, Listing,
} from "@/types"
import { Assembler } from "@/components/protocol/Assembler"
import { assemblyStore, useAssembly } from "@/lib/protocol-assembly-store"
import {
    ALL_PATHS, VARIANT_ATTRIBUTES, attributeOf, chainFindings, pathsOf, resolveProtocol,
} from "@/lib/protocol-chain"
import { DEMO_LISTINGS } from "@/lib/package-demo-catalogue"

const STATUSES: ProtocolStatus[] = ["draft", "active", "archived"]

/** The markets a step's price can be read in. OTHERS has no currency. */
type PriceMarket = "UAE" | "KSA" | "QATAR" | "KUWAIT"

const STATUS_BADGE: Record<ProtocolStatus, string> = {
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    archived: "bg-rose-100 text-rose-700 border-rose-200",
}

function emptyProtocol(): Protocol {
    return {
        id: "", code: "", nameEn: "", nameAr: "",
        descriptionEn: "", descriptionAr: "",
        clinicianAuthor: "", targetCondition: "", journeyId: undefined,
        status: "draft", isActive: false,
        variantAxis: undefined, steps: [],
    }
}

export default function ProtocolEditorPage() {
    const params = useParams()
    const isNew = params.id === "new"

    const [protocol, setProtocol] = useState<Protocol>(emptyProtocol())
    const [activeSection, setActiveSection] = useState("identity")
    const [loading, setLoading] = useState(!isNew)
    const [showErrors, setShowErrors] = useState(false)

    const [journeys, setJourneys] = useState<Journey[]>([])
    const [serviceListings, setServiceListings] = useState<Listing[]>([])
    /** Which path is on screen, and which market its prices are read in. */
    const [pathId, setPathId] = useState<string>(ALL_PATHS)
    const [country, setCountry] = useState<PriceMarket>("UAE")

    /**
     * This screen is the STEP BUILDER. The patient page has its own screen at
     * ./plan, the way the live landing-page screen keeps a page's settings and
     * its widgets apart from each other. All this editor needs is the page's
     * state, so it can hand over and say whether the page is live.
     */
    const protocolId = typeof params.id === "string" ? params.id : ""
    const hydrated = useHydrated()
    const plan = usePlan(protocolId)

    useEffect(() => {
        ApiService.catalogue.journeys().then(setJourneys).catch(() => setJourneys([]))
        /* The catalogue reaches the real content service, which answers 401
           without a session. Caught on its own, so it never blanks the editor. */
        ApiService.catalogue.listings().then(setServiceListings).catch(() => setServiceListings([]))
        if (!isNew && typeof params.id === "string") {
            ApiService.catalogue.protocols().then(list => {
                const found = list.find(p => p.id === params.id)
                if (found) setProtocol({ ...emptyProtocol(), ...found })
                setLoading(false)
            })
        }
    }, [isNew, params.id])

    const update = (patch: Partial<Protocol>) => setProtocol(prev => ({ ...prev, ...patch }))

    /* The old flat step list. Still read by the plan builder and the chain
       check; no longer edited here, because the orders are now what is
       authored and the steps fall out of them. */
    const steps = protocol.steps

    /**
     * The catalogue a step can link. `listings()` returns list rows with no
     * prices, so the labelled snapshot is read beside it.
     */
    const listings = useMemo(() => [...serviceListings, ...DEMO_LISTINGS], [serviceListings])

    /**
     * ONE PROTOCOL, MANY PATHS. A protocol with no axis has exactly one path,
     * so nothing about this screen changes for the ordinary case.
     */
    const paths = useMemo(() => pathsOf(protocol), [protocol])

    /* The chain is checked on EVERY path, because a step some values skip
       changes what is above every step below it. */
    const chainErrors = useMemo(
        () => paths.flatMap(pp => chainFindings(resolveProtocol(protocol, pp.id).steps)
            .map(f => ({ ...f, path: pp.label }))),
        [protocol, paths])

    /* THE ASSEMBLED ORDERS. Authored beside the protocol and kept in their own
       store, because the catalogue API does not carry this shape yet. */
    const blocks = useAssembly(protocolId)

    /** The packages the plan holds, whichever paths exist. */
    const builtPackages = useMemo(
        () => Object.values(plan?.packages ?? {}).filter(x => x.members.length > 0),
        [plan])

    // ── validation ──
    const nameError = !protocol.nameEn.trim()
    const codeError = !protocol.code.trim()
    const identityError = nameError || codeError
    const err = (bad: boolean) => showErrors && bad ? "border-destructive" : ""

    /**
     * Two actions, because they answer different questions.
     *
     * A DRAFT keeps whatever is on screen, however incomplete. That is what a
     * draft is for: set up a mapping, leave, come back and check it.
     *
     * PUBLISH is the only one the rules block. A protocol with no name and no
     * code cannot be found by anybody, so it cannot go live.
     */
    /**
     * The protocol and its page publish separately, on purpose. A protocol can
     * be live for a coach while its page is inactive, so one action could not
     * serve both. This screen publishes the PROTOCOL. The page has its own
     * Publish, on its own screen.
     */
    const saveDraft = () => {
        update({ status: "draft", isActive: false })
        toast.success("Saved as a draft.", {
            description: "It is not live. Publishing is a separate action.",
        })
    }

    const publish = () => {
        setShowErrors(true)
        if (chainErrors.length) {
            setActiveSection("steps")
            toast.error(
                chainErrors.length === 1
                    ? "A step cannot run where it is"
                    : `${chainErrors.length} steps cannot run where they are`,
                { description: "A step needs something that no step above it produces." },
            )
            return
        }
        if (identityError) {
            setActiveSection("identity")
            toast.error("Publishing is blocked", {
                description: "A protocol needs a name and a code before it can go live.",
            })
            return
        }
        if (!steps.length) {
            setActiveSection("steps")
            toast.error("Publishing is blocked", {
                description: "A protocol with no steps delivers nothing.",
            })
            return
        }
        update({ status: "active", isActive: true, publishedAt: new Date().toISOString() })
        toast.success("Published.", { description: "The protocol is live." })
    }

    /**
     * Two items, flat. This screen is one stage of two, and the second stage
     * is a screen of its own rather than a group in this rail. Two levels of
     * navigation for one protocol was the confusion worth removing.
     */
    const sections: EditorSection[] = [
        { id: "identity", label: "Identity", hasError: showErrors && identityError },
        { id: "steps", label: "Steps", badge: steps.length },
    ]

    if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading protocol…</div>

    const headerActions = (
        <div className="flex items-center gap-2">
            <Select value={protocol.status} onValueChange={(v: ProtocolStatus) => update({ status: v, isActive: v === "active" })}>
                <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={saveDraft}>Save as draft</Button>
            <Button size="sm" onClick={publish}>
                <Send className="mr-2 h-3.5 w-3.5" /> Publish
            </Button>
            {/* Stage two, and it is a screen and not a panel. */}
            <Button variant="secondary" size="sm" asChild>
                <Link href={`/catalogue/protocols/${protocolId}/plan`}>
                    <LayoutTemplate className="mr-2 h-3.5 w-3.5" /> Plan Builder
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
            </Button>
        </div>
    )

    return (
        <ListingEditorShell
            backHref="/catalogue/protocols"
            title={isNew ? "New Protocol" : (protocol.nameEn || "Edit Protocol")}
            subtitle={isNew ? "Clinician-authored care sequence" : `${protocol.code} · ${protocol.clinicianAuthor || "—"}`}
            titleBadge={
                <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className={STATUS_BADGE[protocol.status]}>
                        {protocol.status}
                    </Badge>
                    {/* The page and the package each have their own status, and
                        each goes live on its own, so all three are visible here. */}
                    {hydrated && (
                        <>
                            <Badge variant="outline" className={plan?.status === "published"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"}>
                                page {!plan ? "not built" : plan.status === "published" ? "live" : "inactive"}
                            </Badge>
                            <Badge variant="outline" className={builtPackages.some(x => x.status === "active")
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"}>
                                {!builtPackages.length
                                    ? "package not built"
                                    : `${builtPackages.length} package${builtPackages.length === 1 ? "" : "s"}`}
                            </Badge>
                        </>
                    )}
                </div>
            }
            headerActions={headerActions}
            hideSave
            sections={sections}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
        >
            {showErrors && identityError && (
                <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Name (EN) and Code are required.</span>
                </div>
            )}

            {/* ── IDENTITY ── */}
            {activeSection === "identity" && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Identity</CardTitle>
                            <CardDescription>Clinical authorship, target condition and optional parent journey.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Code <span className="text-destructive">*</span></Label>
                                    <Input value={protocol.code} onChange={e => update({ code: e.target.value })} placeholder="e.g. PROT-GLP1-WL" className={err(codeError)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Clinician Author</Label>
                                    <Input value={protocol.clinicianAuthor} onChange={e => update({ clinicianAuthor: e.target.value })} placeholder="e.g. Dr. Layla Hassan" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name (EN) <span className="text-destructive">*</span></Label>
                                    <Input value={protocol.nameEn} onChange={e => update({ nameEn: e.target.value })} placeholder="English name" className={err(nameError)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name (AR)</Label>
                                    <Input dir="rtl" className="text-right" value={protocol.nameAr} onChange={e => update({ nameAr: e.target.value })} placeholder="الاسم بالعربية" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Description (EN)</Label>
                                    <textarea className="w-full h-24 p-3 border rounded-md text-sm" value={protocol.descriptionEn ?? ""} onChange={e => update({ descriptionEn: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description (AR)</Label>
                                    <textarea dir="rtl" className="w-full h-24 p-3 border rounded-md text-sm text-right" value={protocol.descriptionAr ?? ""} onChange={e => update({ descriptionAr: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Target Condition</Label>
                                    <Input value={protocol.targetCondition ?? ""} onChange={e => update({ targetCondition: e.target.value })} placeholder="e.g. Weight management" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Parent Journey</Label>
                                    <Select value={protocol.journeyId ?? "none"} onValueChange={v => update({ journeyId: v === "none" ? undefined : v })}>
                                        <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {journeys.map(j => <SelectItem key={j.id} value={j.id}>{j.nameEn}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Status</Label>
                                    <Select value={protocol.status} onValueChange={(v: ProtocolStatus) => update({ status: v, isActive: v === "active" })}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* ── STEPS ── */}
            {/* ══ THE SEQUENCE ══
                No weeks, no days, no cadence. The order is the dependency and
                `produces` / `requires` make it checkable. ══ */}
            {activeSection === "steps" && (
                <div className="space-y-5">
                    {/* ── The variant axis. One protocol, one axis, many paths. ── */}
                    <VariantAxisCard
                        axis={protocol.variantAxis}
                        onChange={variantAxis => update({ variantAxis })}
                    />

                    {paths.length > 1 && (
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Path on screen</Label>
                                <div className="inline-flex rounded-md border p-0.5">
                                    {paths.map(pp => (
                                        <Button key={pp.id}
                                            variant={pp.id === pathId ? "secondary" : "ghost"}
                                            size="sm" className="h-7 px-3 text-xs"
                                            onClick={() => setPathId(pp.id)}>
                                            {pp.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                            <p className="max-w-lg pb-1.5 text-xs text-muted-foreground">
                                One patient&rsquo;s actual journey, not a template with branches drawn
                                on it. The sequence is written once and every step below belongs to
                                the protocol, whichever path is showing.
                            </p>
                        </div>
                    )}

                    {/* ── The market, only because a step shows what its item costs ── */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Prices shown in</Label>
                            <div className="inline-flex rounded-md border p-0.5">
                                {(["UAE", "KSA"] as const).map(c => (
                                    <Button key={c} variant={c === country ? "secondary" : "ghost"}
                                        size="sm" className="h-7 px-3 text-xs"
                                        onClick={() => setCountry(c)}>
                                        {c}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <Assembler
                        blocks={blocks}
                        onChange={next => assemblyStore.save(protocolId, next)}
                        listings={listings}
                        paths={paths.length > 1 ? paths : []}
                    />
                </div>
            )}

            {/* ══ STAGE TWO ══
                The hand-off. The patient page is a screen of its own, so this
                card states what exists and opens it. It sits under the Steps,
                because the page describes what the steps deliver. ══ */}
            {activeSection === "steps" && hydrated && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-wrap items-center gap-4 p-4">
                        <LayoutTemplate className="h-5 w-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">
                                {plan ? "The plan" : "This protocol has no plan yet"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {plan
                                    ? <>
                                        page: {plan.blocks.length} widget{plan.blocks.length === 1 ? "" : "s"},{" "}
                                        {plan.status === "published" ? "active" : "inactive"}
                                        {" · "}
                                        package: {builtPackages.length
                                            ? builtPackages.map(x => `${x.members.length} item${x.members.length === 1 ? "" : "s"}`).join(" · ")
                                            : "not built"}
                                    </>
                                    : "The Plan Builder writes both halves from the steps above: the page a patient reads, and the package they buy."}
                            </p>
                        </div>
                        <Button size="sm" asChild>
                            <Link href={`/catalogue/protocols/${protocolId}/plan`}>
                                {plan ? "Open the Plan Builder" : "Build the plan"}
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            )}

        </ListingEditorShell>
    )
}

/**
 * THE VARIANT AXIS.
 *
 * At most one, and it names an attribute the system already holds about a
 * patient. A free-text axis would look identical here and leave somebody
 * choosing a path by hand on every order — the onboarding chat already sends
 * `sex` as a routing signal, so a patient's path is known before they arrive.
 *
 * Adding a second axis is a code change on purpose: sex by age band is four
 * paths, four packages and four prices per market, and nobody has asked for it.
 */
function VariantAxisCard({
    axis, onChange,
}: {
    axis?: ProtocolVariantAxis
    onChange: (a: ProtocolVariantAxis | undefined) => void
}) {
    const attr = axis ? attributeOf(axis.attribute) : undefined

    return (
        <Card className="border-dashed">
            <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                        <GitBranch className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">
                                {axis ? `This protocol splits by ${attr?.label.toLowerCase()}` : "One protocol, one path"}
                            </p>
                            <p className="max-w-2xl text-xs text-muted-foreground">
                                {axis
                                    ? "The sequence is written once. A step may run for only some values, or deliver a different item for each."
                                    : "Every patient gets the same sequence. Split it only where one item genuinely differs — a full body panel is not the same product for a man and a woman."}
                            </p>
                        </div>
                    </div>

                    {axis ? (
                        <Button variant="ghost" size="sm" className="text-destructive"
                            onClick={() => onChange(undefined)}>
                            Remove the split
                        </Button>
                    ) : (
                        <Select value="none" onValueChange={v => {
                            const a = attributeOf(v as ProtocolVariantAttribute)
                            if (a) onChange({ attribute: a.id, values: a.values.map(x => x.id) })
                        }}>
                            <SelectTrigger className="h-9 w-[190px]">
                                <SelectValue placeholder="Split by…" />
                            </SelectTrigger>
                            <SelectContent>
                                {VARIANT_ATTRIBUTES.map(a => (
                                    <SelectItem key={a.id} value={a.id}>Split by {a.label.toLowerCase()}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {axis && attr && (
                    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                        <span className="text-xs text-muted-foreground">Paths</span>
                        {attr.values.map(v => {
                            const on = axis.values.includes(v.id)
                            return (
                                <Button key={v.id} variant={on ? "secondary" : "outline"} size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                        const next = on
                                            ? axis.values.filter(x => x !== v.id)
                                            : [...axis.values, v.id]
                                        /* One value is not a split. */
                                        if (next.length < 2) return
                                        onChange({ ...axis, values: next })
                                    }}>
                                    {v.label}
                                </Button>
                            )
                        })}
                        <span className="ml-auto text-xs text-muted-foreground">
                            The onboarding chat already sends this as{" "}
                            <code className="font-mono">{attr.signalKey}</code>, so a patient&rsquo;s
                            path is known rather than asked for.
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

