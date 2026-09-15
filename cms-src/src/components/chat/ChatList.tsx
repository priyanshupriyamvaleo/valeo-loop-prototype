"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { ArrowLeft, MessageSquare, Pencil, Plus, RotateCcw, Search, Trash } from "lucide-react"
import {
    chatStore, mappedQuestions, publishGaps, routingQuestions, useChats, useHydrated,
} from "@/lib/chats"
import { ApiService } from "@/services/api"
import type { Chat, ChatKind, Journey, Protocol } from "@/types"

const STATUS_BADGE = {
    published: "bg-emerald-100 text-emerald-700 border-emerald-200",
    draft: "bg-slate-100 text-slate-600 border-slate-200",
} as const

/**
 * "What exists, and make another." One screen, used by both chat kinds.
 *
 * The columns differ per kind, because the two kinds are identified by
 * different things: an onboarding chat by the slug that opens it, a goal chat
 * by the goal it serves and the protocol it ends at. Everything else — search,
 * status, the draft count, the empty state — is the same, so it lives here once.
 */
export function ChatList({ kind }: { kind: ChatKind }) {
    const isOnboarding = kind === "onboarding"
    const base = isOnboarding ? "/chat-builder/onboarding" : "/chat-builder/goal"

    const hydrated = useHydrated()
    const chats = useChats(kind)
    const [goals, setGoals] = useState<Journey[]>([])
    const [protocols, setProtocols] = useState<Protocol[]>([])
    const [query, setQuery] = useState("")

    useEffect(() => {
        ApiService.catalogue.journeys().then(j => setGoals(j.filter(x => x.kind === "program")))
        ApiService.catalogue.protocols().then(setProtocols)
    }, [])

    const goalName = (id?: string) => goals.find(g => g.id === id)?.nameEn
    const protocolName = (id?: string) => protocols.find(p => p.id === id)?.nameEn

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return chats
        return chats.filter(c => {
            const goal = goals.find(g => g.id === c.goalId)?.nameEn ?? ""
            return `${c.nameEn} ${c.slug ?? ""} ${goal}`.toLowerCase().includes(needle)
        })
    }, [chats, query, goals])

    const drafts = chats.filter(c => c.status === "draft").length

    const remove = (c: Chat) => {
        chatStore.remove(c.id)
        toast.success("Deleted.", { description: `${c.nameEn || "Untitled chat"} is gone from the store.` })
    }

    return (
        <div className="space-y-5">
            <Button variant="ghost" size="sm" className="-ml-2 h-8 text-muted-foreground" asChild>
                <Link href="/chat-builder"><ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Chat Builder</Link>
            </Button>

            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-xl font-semibold">
                        {isOnboarding ? "Onboarding Chat Builder" : "Goal Chat Builder"}
                    </h2>
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        {isOnboarding
                            ? "Runs before a goal is known. A slug opens it, and its answers go to the engine."
                            : "Runs after the goal is known. It asks the goal's questions and hands the person to a protocol."}
                    </p>
                </div>
                <Button asChild>
                    <Link href={`${base}/new`}>
                        <Plus className="mr-2 h-4 w-4" /> Create new
                    </Link>
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                {drafts > 0 && (
                    <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                        {drafts} draft{drafts === 1 ? "" : "s"} — not live
                    </Badge>
                )}
                <div className="relative ml-auto">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                    <Input value={query} onChange={e => setQuery(e.target.value)}
                        placeholder="Search chats…" className="h-9 w-56 pl-8 text-sm" />
                </div>
                {/* The store is a prototype store. Say so, and give a way back to
                    the seed after a demo has left it in a strange state. */}
                <Button variant="outline" size="sm" onClick={() => {
                    chatStore.reset()
                    toast.success("Reset to the seeded chats.")
                }}>
                    <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset
                </Button>
            </div>

            {!hydrated ? (
                /* The store lives in this browser, so the list is unknown until
                   hydration. Say "loading", never "none". */
                <Card className="border-dashed p-12 text-center text-sm text-muted-foreground">
                    Loading chats…
                </Card>
            ) : filtered.length === 0 ? (
                <Card className="flex flex-col items-center gap-2 border-dashed p-12 text-center">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm font-medium">
                        {chats.length === 0 ? "No chats yet" : "Nothing matches that search"}
                    </p>
                    {chats.length === 0 && (
                        <>
                            <p className="max-w-sm text-xs text-muted-foreground">
                                {isOnboarding
                                    ? "An onboarding chat needs a slug, some questions, and at least one question that counts."
                                    : "A goal chat needs a goal, a slug, some questions, and a protocol to end at."}
                            </p>
                            <Button size="sm" className="mt-3" asChild>
                                <Link href={`${base}/new`}>
                                    <Plus className="mr-2 h-3.5 w-3.5" /> Create the first one
                                </Link>
                            </Button>
                        </>
                    )}
                </Card>
            ) : (
                <Card className="overflow-hidden p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Opens at</TableHead>
                                <TableHead>{isOnboarding ? "Feeds the engine" : "Goal"}</TableHead>
                                <TableHead>{isOnboarding ? "Hints" : "Ends at"}</TableHead>
                                <TableHead className="text-center">Questions</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-24 text-right">Edit</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map(c => {
                                const gaps = publishGaps(c)
                                const signals = routingQuestions(c)
                                const mapped = mappedQuestions(c)
                                const hints = mapped.reduce(
                                    (n, q) => n + q.options.filter(o => o.goalId).length, 0)
                                const hintsTotal = mapped.reduce((n, q) => n + q.options.length, 0)
                                return (
                                    <TableRow key={c.id}>
                                        <TableCell>
                                            <Link href={`${base}/${c.id}`} className="font-medium hover:underline">
                                                {c.nameEn || "Untitled chat"}
                                            </Link>
                                            {/* A draft may be incomplete, and that is fine. Only say
                                                so when it would block publishing. */}
                                            {gaps.length > 0 && (
                                                <span className="block text-xs text-amber-700">
                                                    {gaps.length} thing{gaps.length === 1 ? "" : "s"} to fill in before it can go live
                                                </span>
                                            )}
                                        </TableCell>

                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {c.slug ? `/chat/${c.slug}` : "— no slug"}
                                        </TableCell>

                                        <TableCell className="text-xs text-muted-foreground">
                                            {isOnboarding
                                                ? (signals.length
                                                    ? `${signals.length} question${signals.length === 1 ? "" : "s"}`
                                                    : "nothing yet")
                                                : (goalName(c.goalId) ?? "— no goal")}
                                        </TableCell>

                                        <TableCell className="text-xs text-muted-foreground">
                                            {isOnboarding
                                                ? (mapped.length
                                                    ? `${hints} of ${hintsTotal} answers name a goal`
                                                    : "factors only")
                                                : (protocolName(c.target?.id) ?? "— no protocol")}
                                        </TableCell>

                                        <TableCell className="text-center text-sm">{c.questions.length}</TableCell>

                                        <TableCell>
                                            <Badge variant="outline" className={STATUS_BADGE[c.status]}>
                                                {c.status === "published" ? "Published" : "Draft"}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                                <Link href={`${base}/${c.id}`}><Pencil className="h-3.5 w-3.5" /></Link>
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"
                                                onClick={() => remove(c)}>
                                                <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}

            <p className="text-xs text-muted-foreground">
                Chats are held in a prototype store in this browser. A content-service
                endpoint replaces it without a change to these screens.
            </p>
        </div>
    )
}
