"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, MessageSquare, Target } from "lucide-react"
import { chatStore } from "@/lib/chats"
import type { Chat } from "@/types"

/**
 * CHAT BUILDER — the door.
 *
 * Two kinds of chat, and the split is not cosmetic. One runs BEFORE a goal is
 * known and its job is to pick the goal. The other runs AFTER and its job is to
 * hand the person to a protocol. They ask questions the same way, so they share
 * one question builder, and they differ at both ends, so they get two lists.
 *
 * The tool is deliberately global. A chat is a conversation that ends in a
 * decision, and that shape also fits a product page or a campaign page. Nothing
 * in here is owned by Protocols.
 */
export default function ChatBuilderPage() {
    const [chats, setChats] = useState<Chat[]>([])
    useEffect(() => {
        const read = () => setChats(chatStore.list())
        read()
        return chatStore.subscribe(read)
    }, [])

    const count = (kind: Chat["kind"]) => {
        const of = chats.filter(c => c.kind === kind)
        return { total: of.length, live: of.filter(c => c.status === "published").length }
    }
    const onb = count("onboarding")
    const goal = count("goal")

    const CARDS = [
        {
            href: "/chat-builder/onboarding",
            icon: MessageSquare,
            title: "Onboarding Chat Builder",
            blurb: "Runs before a goal is known. It collects the answers the engine needs to pick the goal.",
            detail: "Has a slug, because something must open it.",
            stat: onb,
        },
        {
            href: "/chat-builder/goal",
            icon: Target,
            title: "Goal Chat Builder",
            blurb: "Runs after the goal is known. It asks the goal's own questions and hands the person to a protocol.",
            detail: "Has a slug too, so a campaign or a coach can open it directly.",
            stat: goal,
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold">Chat Builder</h2>
                <p className="max-w-2xl text-sm text-muted-foreground">
                    A chat is a scripted conversation that ends in a decision. It opens on a
                    surface, asks questions, and hands the person to one destination. Chats are
                    global: nothing here belongs to Protocols.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {CARDS.map(c => (
                    <Link key={c.href} href={c.href}>
                        <Card className="group h-full p-5 transition-colors hover:border-primary/40 hover:bg-muted/30">
                            <div className="flex items-start gap-3">
                                <span className="rounded-md border bg-muted/50 p-2">
                                    <c.icon className="h-4 w-4 text-muted-foreground" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold">{c.title}</h3>
                                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">{c.blurb}</p>
                                    <p className="mt-2 text-xs text-muted-foreground/80">{c.detail}</p>
                                    <div className="mt-3 flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {c.stat.total} chat{c.stat.total === 1 ? "" : "s"}
                                        </Badge>
                                        {c.stat.live > 0 && (
                                            <Badge variant="outline"
                                                className="border-emerald-200 bg-emerald-50 text-xs text-emerald-700">
                                                {c.stat.live} live
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>

            <Card className="bg-muted/30 p-4">
                <p className="text-sm font-medium">How the two fit together</p>
                <ol className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                    <li><b>1.</b> A person opens an onboarding chat from its slug.</li>
                    <li><b>2.</b> The chat posts every answer, and marks the ones that count.</li>
                    <li><b>3.</b> The recommendation engine reads the post and picks the goal.</li>
                    <li><b>4.</b> That goal&rsquo;s own chat runs next, and asks the goal&rsquo;s questions.</li>
                    <li><b>5.</b> The goal chat ends by handing the person to a protocol.</li>
                </ol>
                <p className="mt-3 text-xs text-muted-foreground">
                    The builder never picks the goal. Age alone names no goal, and age with a
                    weight and a medicine does, so the rule belongs in the engine. A question can
                    still name a goal outright, and the engine reads that as a hint.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                    Both kinds save as a draft, so a mapping can be set up and checked before
                    anything goes live.
                </p>
            </Card>
        </div>
    )
}
