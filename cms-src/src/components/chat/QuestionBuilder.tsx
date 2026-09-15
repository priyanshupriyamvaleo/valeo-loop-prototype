"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ArrowDown, ArrowUp, MessageSquare, Plus, Trash } from "lucide-react"
import {
    QUESTION_KINDS, ROUTING_MODES, emptyOption, emptyQuestion, modeOf, takesOptions, toKey,
} from "@/lib/chats"
import type { ChatQuestion, ChatQuestionKind, ChatRoutingMode } from "@/types"

/**
 * The question and answer builder, shared by every chat.
 *
 * It knows nothing about goals, protocols or surfaces. That is deliberate: the
 * same builder has to serve an onboarding chat, a goal chat, and later a chat
 * on a product page. Anything that is true of ONE kind of chat lives in that
 * kind's editor, not in here.
 *
 * The routing column is the one exception, and it is opt-in through
 * `routingSlot`. The editor passes a renderer for it, so this component still
 * does not know what a goal is.
 */
export interface QuestionBuilderProps {
    questions: ChatQuestion[]
    onChange: (next: ChatQuestion[]) => void
    /** Show validation borders once the author has tried to publish. */
    showErrors?: boolean
    /** Onboarding only: lets the author say how a question feeds the engine. */
    allowRouting?: boolean
    /**
     * Onboarding only: rendered beside every option of a MAPPED question.
     * The editor supplies the goal picker, so this file stays goal-agnostic.
     */
    routingSlot?: (optionId: string) => React.ReactNode
}

export function QuestionBuilder({
    questions, onChange, showErrors = false, allowRouting = false, routingSlot,
}: QuestionBuilderProps) {
    // Every change reassigns order = index, so it stays 0..n-1 with no gaps.
    const set = (next: ChatQuestion[]) => onChange(next.map((q, i) => ({ ...q, order: i })))

    const add = () => set([...questions, emptyQuestion(questions.length)])
    const upd = (id: string, patch: Partial<ChatQuestion>) =>
        set(questions.map(q => (q.id === id ? { ...q, ...patch } : q)))
    const del = (id: string) => set(questions.filter(q => q.id !== id))

    const move = (index: number, dir: -1 | 1) => {
        const to = index + dir
        if (to < 0 || to >= questions.length) return
        const next = [...questions]
        const [item] = next.splice(index, 1)
        next.splice(to, 0, item)
        set(next)
    }

    /**
     * Any number of questions may feed the engine, so this sets one question
     * and it touches no other. A first key is suggested from the question
     * text, because an author who has to invent a key usually leaves it empty.
     */
    const setMode = (q: ChatQuestion, mode: ChatRoutingMode) =>
        upd(q.id, {
            routing: mode,
            signalKey: mode === "off"
                ? q.signalKey
                : (q.signalKey || toKey(q.promptEn).slice(0, 40) || undefined),
        })

    const addOption = (q: ChatQuestion) =>
        upd(q.id, { options: [...q.options, emptyOption()] })
    const updOption = (q: ChatQuestion, oid: string, labelEn: string) =>
        upd(q.id, { options: q.options.map(o => (o.id === oid ? { ...o, labelEn } : o)) })
    const delOption = (q: ChatQuestion, oid: string) =>
        upd(q.id, { options: q.options.filter(o => o.id !== oid) })

    const bad = (v: boolean) => (showErrors && v ? "border-destructive" : "")

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    <Label className="text-sm">Questions</Label>
                    <p className="text-xs text-muted-foreground">
                        Asked in this order. The person answers one at a time, as a chat.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={add}>
                    <Plus className="mr-2 h-3.5 w-3.5" /> Add question
                </Button>
            </div>

            {questions.length === 0 && (
                <Card className="flex flex-col items-center gap-2 border-dashed p-8 text-center">
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm font-medium">No questions yet</p>
                    <p className="max-w-sm text-xs text-muted-foreground">
                        A chat with no questions opens and closes again. Add the first
                        question, then say what part it plays in the decision.
                    </p>
                </Card>
            )}

            {questions.map((q, i) => (
                <Card key={q.id} className="p-4">
                    <div className="flex items-start gap-3">
                        <span className="mt-2 w-6 shrink-0 text-center font-mono text-xs text-muted-foreground">
                            {String(i + 1).padStart(2, "0")}
                        </span>

                        <div className="min-w-0 flex-1 space-y-3">
                            <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Question</Label>
                                    <Input
                                        value={q.promptEn}
                                        placeholder="What made you open this today?"
                                        className={bad(!q.promptEn.trim())}
                                        onChange={e => upd(q.id, { promptEn: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label className="text-xs">Answer type</Label>
                                    <Select
                                        value={q.kind}
                                        onValueChange={v => upd(q.id, { kind: v as ChatQuestionKind })}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {QUESTION_KINDS.map(k => (
                                                <SelectItem key={k.id} value={k.id}>{k.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-xs">Helper line (optional)</Label>
                                <Input
                                    value={q.helpEn ?? ""}
                                    placeholder="Shown under the question, in smaller text."
                                    onChange={e => upd(q.id, { helpEn: e.target.value })}
                                />
                            </div>

                            {/* Options, only for the two kinds that take them. A text
                                question with an options list is a contradiction. */}
                            {takesOptions(q.kind) && (
                                /* @container, not a screen breakpoint: this box sits
                                   inside a narrow editor column, so what matters is
                                   the room the box has and not the size of the screen. */
                                <div className="@container space-y-2 rounded-md border bg-muted/30 p-3">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs">Answers</Label>
                                        <Button variant="ghost" size="sm" className="h-7 text-xs"
                                            onClick={() => addOption(q)}>
                                            <Plus className="mr-1.5 h-3 w-3" /> Add answer
                                        </Button>
                                    </div>

                                    {q.options.length === 0 && (
                                        <p className={`text-xs ${showErrors ? "text-destructive" : "text-muted-foreground"}`}>
                                            No answers yet. A choice question needs at least one.
                                        </p>
                                    )}

                                    {q.options.map(o => (
                                        <div key={o.id} className="flex items-start gap-2">
                                            <div className="flex min-w-0 flex-1 flex-col gap-2 @md:flex-row @md:items-center">
                                                <Input
                                                    value={o.labelEn}
                                                    placeholder="Something hurts, or will not heal"
                                                    className={`h-9 @md:flex-1 ${bad(!o.labelEn.trim())}`}
                                                    onChange={e => updOption(q, o.id, e.target.value)}
                                                />
                                                {/* The goal picker, on a mapped question only.
                                                    It drops below the answer text when the box is
                                                    narrow, because a squeezed text field hides the
                                                    answer the author is reading. */}
                                                {allowRouting && modeOf(q) === "mapped" && routingSlot && (
                                                    <div className="@md:w-[230px] @md:shrink-0">
                                                        {routingSlot(o.id)}
                                                    </div>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0"
                                                onClick={() => delOption(q, o.id)}>
                                                <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                                <label className="flex items-center gap-2 text-xs">
                                    <Switch checked={q.required}
                                        onCheckedChange={v => upd(q.id, { required: v })} />
                                    Must be answered
                                </label>
                            </div>

                            {/* ── How this question feeds the engine ──
                                Three states and not a switch, because "a factor
                                with no goal" is the common case and a switch
                                cannot say it. A number question can be a factor
                                too, which a goal-per-answer model rules out. */}
                            {allowRouting && (
                                <div className="@container space-y-2 rounded-md border border-dashed bg-background p-3">
                                    <div className="grid gap-3 @md:grid-cols-[1fr_200px]">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs">Part in the decision</Label>
                                            <Select value={modeOf(q)}
                                                onValueChange={v => setMode(q, v as ChatRoutingMode)}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {ROUTING_MODES
                                                        .filter(m => m.id !== "mapped" || takesOptions(q.kind))
                                                        .map(m => (
                                                            <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {modeOf(q) !== "off" && (
                                            <div className="space-y-1.5">
                                                <Label className="text-xs">Key the engine reads</Label>
                                                <Input
                                                    value={q.signalKey ?? ""}
                                                    placeholder="age"
                                                    className={`h-9 font-mono text-xs ${bad(!q.signalKey?.trim())}`}
                                                    onChange={e => upd(q.id, { signalKey: toKey(e.target.value) })}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs text-muted-foreground">
                                        {ROUTING_MODES.find(m => m.id === modeOf(q))?.blurb}
                                    </p>

                                    {modeOf(q) !== "off" && (
                                        <Badge variant="outline"
                                            className={modeOf(q) === "mapped"
                                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                                : "border-sky-200 bg-sky-50 text-sky-700"}>
                                            {modeOf(q) === "mapped" ? "mapped to goals" : "factor"}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex shrink-0 flex-col gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                disabled={i === 0} onClick={() => move(i, -1)}>
                                <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                disabled={i === questions.length - 1} onClick={() => move(i, 1)}>
                                <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                onClick={() => del(q.id)}>
                                <Trash className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    )
}
