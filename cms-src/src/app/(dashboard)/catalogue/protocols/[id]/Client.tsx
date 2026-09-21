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
    AlertCircle, Send, ArrowRight, LayoutTemplate,
} from "lucide-react"
import { toast } from "sonner"
import { ApiService } from "@/services/api"
import { ListingEditorShell, EditorSection } from "@/components/catalogue/ListingEditorShell"
import { useHydrated, usePlan } from "@/lib/protocol-plans"
import {
    Protocol, ProtocolStatus,
    ProtocolVariantAxis, Journey, Listing,
} from "@/types"
import { Assembler } from "@/components/protocol/Assembler"
import { assemblyStore, useAssembly } from "@/lib/protocol-assembly-store"
import {
    chainFindings, pathsOf, resolveProtocol,
} from "@/lib/protocol-chain"
import { DEMO_LISTINGS } from "@/lib/package-demo-catalogue"

const STATUSES: ProtocolStatus[] = ["draft", "active", "archived"]

/**
 * The one axis a step may split on. It is not a choice any more: the only
 * attribute the catalogue carries is sex, the onboarding chat already sends it,
 * and offering a dropdown of one is a question with no second answer.
 */
const SEX_AXIS: ProtocolVariantAxis = { attribute: "sex", values: ["male", "female"] }
const SEX_PATHS = SEX_AXIS.values.map(v => ({
    id: v, label: v === "male" ? "Male" : "Female",
}))

/**
 * THE CODE, FROM THE NAME.
 *
 * `PROT-` and the first words of the English name, upper case. Generated only
 * while the protocol is new: once saved, the code is an identifier other
 * systems key on, and one that moved when somebody reworded a title would
 * break every reference to it.
 */
function protocolCode(nameEn: string) {
    const slug = nameEn.toUpperCase().replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "").split("-").filter(Boolean).slice(0, 3).join("-")
    return slug ? `PROT-${slug}` : ""
}

/** Renaming a new protocol renames its code with it. A saved one keeps both. */
function renamed(p: Protocol, nameEn: string, isNew: boolean): Partial<Protocol> {
    return isNew ? { nameEn, code: protocolCode(nameEn) } : { nameEn }
}

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
    const blocks = useAssembly(protocolId)
    const splits = blocks.some(b => b.unitByValue !== undefined)
    /* Derived at render, never written into state by an effect. An effect that
       sets the state it reads is a cascading render, and the axis is not a
       second fact — it is the steps, read another way. It is folded into
       whatever gets saved, so the stored protocol matches the screen. */
    const protocolWithAxis = useMemo<Protocol>(
        () => ({ ...protocol, variantAxis: splits ? SEX_AXIS : undefined }),
        [protocol, splits])

    const paths = useMemo(() => pathsOf(protocolWithAxis), [protocolWithAxis])

    /* The chain is checked on EVERY path, because a step some values skip
       changes what is above every step below it. */
    const chainErrors = useMemo(
        () => paths.flatMap(pp => chainFindings(resolveProtocol(protocolWithAxis, pp.id).steps)
            .map(f => ({ ...f, path: pp.label }))),
        [protocolWithAxis, paths])

    /* THE ASSEMBLED ORDERS. Authored beside the protocol and kept in their own
       store, because the catalogue API does not carry this shape yet. */

    /**
     * WHETHER THIS PROTOCOL SPLITS, READ OFF THE STEPS.
     *
     * A block whose `unitByValue` exists is a step the author ticked. One such
     * step makes the whole protocol two paths, because a patient follows one
     * sequence and that sequence differs. Nothing declares it.
     *
     * Written back to `protocol.variantAxis` so every screen downstream — the
     * plan, the package builder, the resolver — keeps reading the field it
     * always read. The author never sees it.
     */

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
        update({ status: "draft", isActive: false, variantAxis: protocolWithAxis.variantAxis })
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
            subtitle={isNew ? "Clinician-authored care sequence" : protocol.code}
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
                                    <Label>Code</Label>
                                    {/* GENERATED, NEVER TYPED. A code is an identifier other
                                        systems key on, and two people typing one produce two
                                        spellings of the same protocol. It follows the English
                                        name until the protocol is first saved, and is frozen
                                        after that — a code that moved when somebody reworded a
                                        title would break every reference to it. */}
                                    <Input value={protocol.code} readOnly tabIndex={-1}
                                        className="bg-muted/50 font-mono text-muted-foreground"
                                        placeholder="PROT-…" />
                                    <p className="text-xs text-muted-foreground">
                                        {isNew
                                            ? "Generated from the English name. It is fixed once this is saved."
                                            : "Generated when this protocol was created. It cannot change."}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Name (EN) <span className="text-destructive">*</span></Label>
                                    <Input value={protocol.nameEn}
                                        onChange={e => update(renamed(protocol, e.target.value, isNew))}
                                        placeholder="English name" className={err(nameError)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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
                    {/* ── NO GLOBAL SPLIT, AND NO PATH SWITCH ──
                        Both used to live here. Declaring "this protocol splits
                        by sex" at the top asked the author to commit to a shape
                        before they had written a single step, and then a "path
                        on screen" toggle made every step look conditional when
                        almost none of them are.

                        A split is a property of ONE step: a full body panel is
                        two products, a GLP-1 pen is one. So the checkbox lives
                        on the step, and whether the protocol splits at all is
                        DERIVED from whether any step does — see `axisFor`. The
                        plan and the package builder still see a two-path
                        protocol, and nobody had to declare it. ── */}

                    <Assembler
                        blocks={blocks}
                        onChange={next => assemblyStore.save(protocolId, next)}
                        listings={listings}
                        paths={SEX_PATHS}
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
