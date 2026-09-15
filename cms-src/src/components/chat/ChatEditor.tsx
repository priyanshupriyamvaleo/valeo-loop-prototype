"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Braces, ExternalLink, Link2, Send, Target } from "lucide-react"
import { ListingEditorShell, EditorSection } from "@/components/catalogue/ListingEditorShell"
import { QuestionBuilder } from "@/components/chat/QuestionBuilder"
import {
    SURFACES, buildSubmission, chatStore, emptyChat, modeOf, publishGaps,
    routingQuestions, samplePicks, toSlug, useChat, useChats, useHydrated,
} from "@/lib/chats"
import { ApiService } from "@/services/api"
import type { Chat, ChatKind, ChatSurface, Journey, Protocol } from "@/types"

const STATUS_BADGE = {
    published: "bg-emerald-100 text-emerald-700 border-emerald-200",
    draft: "bg-slate-100 text-slate-600 border-slate-200",
} as const

/**
 * One editor, two kinds of chat.
 *
 * The sections differ because the two kinds answer different questions:
 *
 *   ONBOARDING  Where does this open?  →  Questions  →  Which goal does each
 *               answer lead to?
 *   GOAL        Which goal is this?    →  Questions  →  Which protocol does it
 *               hand the person to?
 *
 * The questions in the middle are the same builder in both, which is the whole
 * reason the chat builder is one tool and not two.
 */
export function ChatEditor({ kind, id }: { kind: ChatKind; id: string }) {
    const router = useRouter()
    const isNew = id === "new"
    const backHref = kind === "onboarding" ? "/chat-builder/onboarding" : "/chat-builder/goal"

    /**
     * Two layers, on purpose.
     *
     * `stored` is what the store holds, read as external state so the store is
     * never copied into state inside an effect. `edits` is what the author has
     * typed and has not saved. The screen shows the edits on top of the stored
     * record, so a save from another tab cannot overwrite typing in this one.
     */
    const hydrated = useHydrated()
    const stored = useChat(id)
    const [edits, setEdits] = useState<Chat | null>(null)
    const chat = edits ?? stored ?? emptyChat(kind)

    const [section, setSection] = useState("identity")
    const [showErrors, setShowErrors] = useState(false)

    // Goals are Journeys of kind "program" in this CMS. "Direct" is not a goal.
    const [goals, setGoals] = useState<Journey[]>([])
    const [protocols, setProtocols] = useState<Protocol[]>([])

    useEffect(() => {
        ApiService.catalogue.journeys().then(j => setGoals(j.filter(x => x.kind === "program")))
        ApiService.catalogue.protocols().then(setProtocols)
    }, [])

    const upd = (patch: Partial<Chat>) =>
        setEdits(prev => ({ ...(prev ?? stored ?? emptyChat(kind)), ...patch }))

    const gaps = useMemo(() => publishGaps(chat), [chat])
    const gapsIn = (s: string) => gaps.filter(g => g.section === s)

    const routing = routingQuestions(chat)

    /** One writer for "this answer names this goal". Two screens call it. */
    const setOptionGoal = (qid: string, oid: string, goalId: string) =>
        upd({
            questions: chat.questions.map(qq => qq.id !== qid ? qq : {
                ...qq,
                options: qq.options.map(oo => oo.id === oid ? { ...oo, goalId } : oo),
            }),
        })

    /**
     * Draft saves whatever is on screen. That is the point of a draft: an author
     * sets up a mapping, leaves, and comes back to check it. Publish is the only
     * action the rules block.
     */
    const saveDraft = () => {
        const saved = chatStore.save({ ...chat, status: "draft" })
        setEdits(saved)
        toast.success("Saved as a draft.", {
            description: "It is in the prototype store, and it is not live.",
        })
        if (isNew) router.replace(`${backHref}/${saved.id}`)
    }

    const publish = () => {
        setShowErrors(true)
        if (gaps.length) {
            setSection(gaps[0].section)
            toast.error(
                gaps.length === 1 ? gaps[0].what : `${gaps.length} things are missing`,
                { description: "Publishing is blocked until they are filled in." },
            )
            return
        }
        const saved = chatStore.save({
            ...chat, status: "published", publishedAt: new Date().toISOString(),
        })
        setEdits(saved)
        toast.success("Published.", { description: "The chat is live on its surfaces." })
        if (isNew) router.replace(`${backHref}/${saved.id}`)
    }

    const toggleSurface = (s: ChatSurface, on: boolean) =>
        upd({ surfaces: on ? [...chat.surfaces, s] : chat.surfaces.filter(x => x !== s) })

    const sections: EditorSection[] = [
        {
            id: "identity",
            label: kind === "onboarding" ? "Entry point" : "The goal",
            hasError: showErrors && gapsIn("identity").length > 0,
        },
        {
            id: "questions",
            label: "Questions",
            badge: chat.questions.length,
            hasError: showErrors && gapsIn("questions").length > 0,
        },
        kind === "onboarding"
            ? {
                id: "routing", label: "Routing",
                badge: routing.length,
                hasError: showErrors && gapsIn("routing").length > 0,
            }
            : {
                id: "destination", label: "Destination",
                hasError: showErrors && gapsIn("destination").length > 0,
            },
    ]

    /* The server has no localStorage, so nothing is known until hydration. */
    if (!hydrated) {
        return <div className="py-16 text-center text-sm text-muted-foreground">Loading chat…</div>
    }

    /* An id that is not "new" and not in the store is a dead link, not a load. */
    if (!isNew && !stored && !edits) {
        return (
            <div className="py-16 text-center">
                <p className="text-sm font-medium">That chat is not in the store</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    It may have been deleted, or the store was reset.
                </p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href={backHref}>Back to the list</Link>
                </Button>
            </div>
        )
    }

    const goalName = (gid?: string) => goals.find(g => g.id === gid)?.nameEn

    return (
        <ListingEditorShell
            backHref={backHref}
            title={chat.nameEn || (isNew ? `New ${kind === "onboarding" ? "onboarding" : "goal"} chat` : "Untitled chat")}
            subtitle={kind === "onboarding"
                ? "Runs before a goal is known. Its answers go to the engine, which picks the goal."
                : "Runs after the goal is known. It hands the person to a protocol."}
            titleBadge={
                <Badge variant="outline" className={STATUS_BADGE[chat.status]}>
                    {chat.status === "published" ? "Published" : "Draft"}
                </Badge>
            }
            headerActions={
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={saveDraft}>Save as draft</Button>
                    <Button size="sm" onClick={publish}>
                        <Send className="mr-2 h-3.5 w-3.5" /> Publish
                    </Button>
                </div>
            }
            hideSave
            sections={sections}
            activeSection={section}
            onSectionChange={setSection}
        >
            {/* ── The refusals, listed once the author has tried to publish ── */}
            {showErrors && gaps.length > 0 && (
                <Card className="mb-5 border-amber-200 bg-amber-50/60 p-4">
                    <div className="flex items-start gap-2.5">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                        <div className="space-y-1.5">
                            <p className="text-sm font-medium text-amber-900">
                                Publishing is blocked. A draft save still works.
                            </p>
                            <ul className="space-y-1 text-xs text-amber-800">
                                {gaps.map((g, i) => (
                                    <li key={i}><b>{g.what}.</b> {g.why}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Card>
            )}

            {/* ══ IDENTITY ══ */}
            {section === "identity" && (
                <div className="max-w-3xl space-y-5">
                    <div className="max-w-md space-y-1.5">
                        <Label>Name</Label>
                        <Input
                            value={chat.nameEn}
                            placeholder={kind === "onboarding"
                                ? "Website protocols onboarding" : "Weight loss triage"}
                            className={showErrors && !chat.nameEn.trim() ? "border-destructive" : ""}
                            onChange={e => upd({ nameEn: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Staff-facing. It is how you find this chat in the list.
                        </p>
                    </div>

                    {/* ── What opens this chat. BOTH kinds have a slug: a goal
                           chat opens on its own from a campaign page, from a
                           product page, or from a link a coach sends. ── */}
                    <Card className="space-y-4 p-4">
                        <div className="flex items-start gap-2.5">
                            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">What opens this chat</p>
                                <p className="text-xs text-muted-foreground">
                                    The slug is the address. Anything that links to it opens this
                                    chat — a button on the website, a card in the app, a campaign
                                    page, or a link a coach sends.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Slug</Label>
                            <div className="flex items-center gap-0">
                                <span className="rounded-l-md border border-r-0 bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                                    /chat/
                                </span>
                                <Input
                                    value={chat.slug ?? ""}
                                    placeholder={kind === "onboarding"
                                        ? "website-protocols-onboarding" : "weight-loss-triage"}
                                    className={`rounded-l-none font-mono text-sm ${showErrors && !chat.slug?.trim() ? "border-destructive" : ""}`}
                                    onChange={e => upd({ slug: toSlug(e.target.value) })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Lower case, hyphens, no spaces. It is corrected as you type.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label>Where it can open</Label>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {SURFACES.map(s => {
                                    const on = chat.surfaces.includes(s.id)
                                    return (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => toggleSurface(s.id, !on)}
                                            className={`rounded-md border p-3 text-left transition-colors ${on ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                                        >
                                            <span className="block text-sm font-medium">{s.label}</span>
                                            <span className="block text-xs text-muted-foreground">{s.blurb}</span>
                                        </button>
                                    )
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                A chat is global. Pick every surface it may open on.
                            </p>
                        </div>
                    </Card>

                    {/* ── Which goal this chat belongs to. Goal chat only. ── */}
                    {kind === "goal" && (
                        <Card className="space-y-4 p-4">
                            <div className="flex items-start gap-2.5">
                                <Target className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Which goal this chat serves</p>
                                    <p className="text-xs text-muted-foreground">
                                        One goal, one chat. An onboarding chat does not name this chat
                                        directly: the engine picks the goal, and the goal leads here.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Goal</Label>
                                <Select
                                    value={chat.goalId ?? ""}
                                    onValueChange={v => upd({ goalId: v })}
                                >
                                    <SelectTrigger className={showErrors && !chat.goalId ? "border-destructive" : ""}>
                                        <SelectValue placeholder="Pick the goal…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {goals.map(g => (
                                            <SelectItem key={g.id} value={g.id}>{g.nameEn}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    Goals are journeys of kind &ldquo;program&rdquo; in this CMS.
                                </p>
                            </div>
                        </Card>
                    )}

                </div>
            )}

            {/* ══ QUESTIONS ══ */}
            {section === "questions" && (
                <div className="max-w-4xl">
                    <QuestionBuilder
                        questions={chat.questions}
                        onChange={q => upd({ questions: q })}
                        showErrors={showErrors}
                        allowRouting={kind === "onboarding"}
                        routingSlot={optionId => {
                            /* Any question may be mapped, so the owner is looked up
                               by the option and not assumed to be one question. */
                            const q = chat.questions.find(qq =>
                                qq.options.some(oo => oo.id === optionId))
                            const o = q?.options.find(x => x.id === optionId)
                            return (
                                <Select
                                    value={o?.goalId ?? ""}
                                    onValueChange={v => q && setOptionGoal(q.id, optionId, v)}
                                >
                                    <SelectTrigger className={`h-9 ${showErrors && !o?.goalId ? "border-destructive" : ""}`}>
                                        <SelectValue placeholder="→ goal…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {goals.map(g => (
                                            <SelectItem key={g.id} value={g.id}>{g.nameEn}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )
                        }}
                    />
                </div>
            )}

            {/* ══ ROUTING — onboarding only ══
                The chat does not decide. It collects answers, says which ones
                count, and posts them. That is why this section reads as "what
                the engine gets" and not as "where each answer leads". ══ */}
            {section === "routing" && kind === "onboarding" && (
                <div className="max-w-3xl space-y-5">
                    <div>
                        <Label className="text-sm">What the engine gets</Label>
                        <p className="text-xs text-muted-foreground">
                            Any number of questions can count. Some name a goal outright.
                            Others are only a factor: age alone picks no goal, and age with
                            a weight and a medicine does. The chat sends both, and the
                            recommendation engine decides.
                        </p>
                    </div>

                    {routing.length === 0 ? (
                        <Card className="border-dashed p-8 text-center">
                            <p className="text-sm font-medium">Nothing counts yet</p>
                            <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
                                Open Questions, and set &ldquo;Part in the decision&rdquo; on the
                                questions that matter. Pick &ldquo;A factor&rdquo; when no single
                                answer names a goal, and &ldquo;Mapped to goals&rdquo; when each
                                answer does.
                            </p>
                            <Button variant="outline" size="sm" className="mt-4"
                                onClick={() => setSection("questions")}>
                                Go to Questions
                            </Button>
                        </Card>
                    ) : (
                        <>
                            <Card className="divide-y p-0">
                                {routing.map(q => {
                                    const mapped = modeOf(q) === "mapped"
                                    return (
                                        <div key={q.id} className="space-y-3 p-4">
                                            <div className="flex flex-wrap items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium">
                                                        {q.promptEn || "Untitled question"}
                                                    </p>
                                                    <p className="font-mono text-xs text-muted-foreground">
                                                        {q.signalKey
                                                            ? q.signalKey
                                                            : <span className="text-destructive">no key</span>}
                                                    </p>
                                                </div>
                                                <Badge variant="outline" className={mapped
                                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                                    : "border-sky-200 bg-sky-50 text-sky-700"}>
                                                    {mapped ? "mapped to goals" : "factor"}
                                                </Badge>
                                            </div>

                                            {mapped ? (
                                                <div className="space-y-2">
                                                    {q.options.map(o => (
                                                        <div key={o.id}
                                                            className="flex flex-wrap items-center gap-3">
                                                            <span className="min-w-0 flex-1 text-sm">
                                                                {o.labelEn || (
                                                                    <span className="text-muted-foreground">
                                                                        Untitled answer
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className="font-mono text-xs text-muted-foreground">
                                                                hints
                                                            </span>
                                                            <div className="w-[220px]">
                                                                <Select value={o.goalId ?? ""}
                                                                    onValueChange={v => setOptionGoal(q.id, o.id, v)}>
                                                                    <SelectTrigger className={`h-9 ${showErrors && !o.goalId ? "border-destructive" : ""}`}>
                                                                        <SelectValue placeholder="Pick a goal…" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {goals.map(g => (
                                                                            <SelectItem key={g.id} value={g.id}>
                                                                                {g.nameEn}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-muted-foreground">
                                                    No goal is named here, and none can be. The answer
                                                    travels as <code className="font-mono">{q.signalKey || "…"}</code>{" "}
                                                    and the engine weighs it with the rest.
                                                </p>
                                            )}
                                        </div>
                                    )
                                })}
                            </Card>

                            {/* Which goal chat picks the person up, for every goal a
                                mapped answer names. A goal with no published chat is
                                visible here rather than at run time. */}
                            <RoutingCoverage
                                goalIds={[...new Set(chat.questions
                                    .filter(q => modeOf(q) === "mapped")
                                    .flatMap(q => q.options.map(o => o.goalId))
                                    .filter((g): g is string => !!g))]}
                                goalName={goalName}
                            />

                            <SubmissionPreview chat={chat} goalName={goalName} />
                        </>
                    )}
                </div>
            )}

            {/* ══ DESTINATION — goal chat only ══ */}
            {section === "destination" && kind === "goal" && (
                <div className="max-w-3xl space-y-4">
                    <div>
                        <Label className="text-sm">Where the chat hands the person next</Label>
                        <p className="text-xs text-muted-foreground">
                            The chat ends by sending the person somewhere. Only protocols are
                            supported today.
                        </p>
                    </div>

                    <Card className="space-y-4 p-4">
                        <div className="grid gap-4 md:grid-cols-[200px_1fr]">
                            <div className="space-y-1.5">
                                <Label>Destination type</Label>
                                <Select value={chat.target?.kind ?? "protocol"}
                                    onValueChange={v => upd({ target: { kind: v as "protocol", id: undefined } })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="protocol">Protocol</SelectItem>
                                        {/* Declared and switched off: the builder is meant to
                                            grow into these, and hiding them hides the plan. */}
                                        <SelectItem value="landing_page" disabled>
                                            Landing page — not built yet
                                        </SelectItem>
                                        <SelectItem value="listing" disabled>
                                            Product page — not built yet
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label>Protocol</Label>
                                <Select
                                    value={chat.target?.id ?? ""}
                                    onValueChange={v => upd({ target: { kind: "protocol", id: v } })}
                                >
                                    <SelectTrigger className={showErrors && !chat.target?.id ? "border-destructive" : ""}>
                                        <SelectValue placeholder="Pick the protocol…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {protocols.map(p => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.nameEn} · {p.status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {chat.target?.id && (
                            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
                                <span className="text-xs text-muted-foreground">
                                    {protocols.find(p => p.id === chat.target?.id)?.steps.length ?? 0} steps
                                    in this protocol
                                </span>
                                <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                    <a href={`/catalogue/protocols/${chat.target.id}`}>
                                        Open it <ExternalLink className="ml-1.5 h-3 w-3" />
                                    </a>
                                </Button>
                            </div>
                        )}
                    </Card>

                    {/* A goal chat posts the same object. The goal is already
                        known here, so the engine reads the answers for triage
                        and not to pick a goal. */}
                    <SubmissionPreview chat={chat} goalName={goalName} />
                </div>
            )}
        </ListingEditorShell>
    )
}

/**
 * The other half of the mapping. An onboarding answer names a goal, but the
 * person only gets a conversation if that goal HAS a published chat. This says
 * which goals are covered, so the hole is found here and not by a patient.
 */
function RoutingCoverage({
    goalIds, goalName,
}: {
    goalIds: string[]
    goalName: (id?: string) => string | undefined
}) {
    const chats = useChats("goal")
    if (!goalIds.length) return null
    const targets = goalIds

    return (
        <Card className="p-4">
            <p className="text-sm font-medium">Does each goal have a chat of its own?</p>
            <p className="mb-3 text-xs text-muted-foreground">
                A goal with no published chat sends the person straight past the questions.
            </p>
            <div className="space-y-2">
                {targets.map(gid => {
                    const found = chats.find(c => c.goalId === gid)
                    const live = found?.status === "published"
                    return (
                        <div key={gid} className="flex items-center gap-3 text-sm">
                            <span className="min-w-0 flex-1 truncate">{goalName(gid) ?? gid}</span>
                            {live ? (
                                <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
                                    {found?.nameEn} · live
                                </Badge>
                            ) : found ? (
                                <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                                    {found.nameEn} · draft
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                    no goal chat
                                </Badge>
                            )}
                        </div>
                    )
                })}
            </div>
        </Card>
    )
}

/**
 * THE CONTRACT, on screen.
 *
 * The builder cannot state the rule that separates a man of 24 from a man of
 * 34 with the same answers. The engine holds that rule. So the honest thing
 * for the builder to show is the post itself: every answer, the key the engine
 * reads, which answers count, and the goals a mapped answer hinted at.
 *
 * It is one sample run — the first answer of every question — so an author can
 * read a real object and not a diagram of one.
 */
function SubmissionPreview({
    chat, goalName,
}: {
    chat: Chat
    goalName: (id?: string) => string | undefined
}) {
    const [open, setOpen] = useState(false)
    const submission = useMemo(
        () => buildSubmission(chat, samplePicks(chat), chat.surfaces[0],
            "2026-09-08T09:00:00.000Z"),
        [chat],
    )

    const counted = submission.answers.filter(a => a.routing !== "off").length

    return (
        <Card className="space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                    <p className="text-sm font-medium">What the chat posts to the backend</p>
                    <p className="text-xs text-muted-foreground">
                        Every answer goes, and {counted} of {submission.answers.length} carry a
                        key that counts.{" "}
                        {chat.kind === "onboarding"
                            ? "The engine reads this and picks the goal."
                            : "The goal is already known, so the engine reads this for triage."}
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setOpen(v => !v)}>
                    <Braces className="mr-2 h-3.5 w-3.5" /> {open ? "Hide" : "Show"} the post
                </Button>
            </div>

            {/* The hint tally, in words, for a reader who does not want JSON. */}
            {submission.goalHints.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-muted-foreground">Hints in this run:</span>
                    {submission.goalHints.map(h => (
                        <Badge key={h.goalId} variant="outline"
                            className="border-amber-200 bg-amber-50 text-amber-700">
                            {goalName(h.goalId) ?? h.goalId} · {h.hits}
                        </Badge>
                    ))}
                    <span className="text-muted-foreground">
                        A tally, not a decision.
                    </span>
                </div>
            )}

            {open && (
                <div className="overflow-x-auto rounded-md border bg-muted/40 p-3">
                    <pre className="font-mono text-[11px] leading-relaxed">
{JSON.stringify(submission, null, 2)}
                    </pre>
                </div>
            )}

            <p className="text-xs text-muted-foreground">
                One sample run, with the first answer of every question. POST it to
                <code className="mx-1 font-mono">/api/chat/submissions</code>
                when the endpoint exists.
            </p>
        </Card>
    )
}
