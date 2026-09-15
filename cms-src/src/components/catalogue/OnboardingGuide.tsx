"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { HelpCircle, X, ArrowRight, Circle, Lightbulb } from "lucide-react"
import { GUIDES, GuideKey } from "@/lib/onboarding"

const key = (k: GuideKey) => `valeo_cms_guide_dismissed_${k}`

function isDismissed(k: GuideKey): boolean {
    try { return localStorage.getItem(key(k)) === "1" } catch { return false }
}
function setDismissed(k: GuideKey, v: boolean) {
    try { v ? localStorage.setItem(key(k), "1") : localStorage.removeItem(key(k)) } catch { /* ignore */ }
}

/** The guide itself — a right-side sheet of numbered steps. */
export function GuideSheet({
    guide,
    open,
    onOpenChange,
}: {
    guide: GuideKey
    open: boolean
    onOpenChange: (o: boolean) => void
}) {
    const g = GUIDES[guide]
    const [dontShow, setDontShow] = useState(false)

    // Read persisted state only after mount (avoids hydration mismatch).
    useEffect(() => { if (open) setDontShow(isDismissed(guide)) }, [open, guide])

    const toggleDontShow = (v: boolean) => { setDontShow(v); setDismissed(guide, v) }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex w-full flex-col gap-0 overflow-hidden sm:max-w-lg">
                <SheetHeader>
                    <div className="flex items-center gap-2">
                        <SheetTitle>{g.title}</SheetTitle>
                        <Badge variant="secondary" className="text-[10px]">~{g.minutes} min</Badge>
                    </div>
                    <SheetDescription>{g.forWho}</SheetDescription>
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                    <p className="text-sm text-muted-foreground">{g.intro}</p>

                    <ol className="mt-5 space-y-4">
                        {g.steps.map((s, i) => (
                            <li key={i} className="flex gap-3">
                                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                    {i + 1}
                                </span>
                                <div className="min-w-0 space-y-1">
                                    <p className="text-sm font-medium leading-snug">{s.title}</p>
                                    <p className="text-sm text-muted-foreground">{s.body}</p>
                                    {s.tip && (
                                        <p className="flex gap-1.5 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                                            <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <span>{s.tip}</span>
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ol>

                    {g.mandatory && g.mandatory.length > 0 && (
                        <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-500/30 dark:bg-amber-500/10">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                                Required before it can go Active
                            </p>
                            <ul className="mt-2 space-y-1">
                                {g.mandatory.map(m => (
                                    <li key={m} className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-200">
                                        <Circle className="h-3 w-3 shrink-0" /> {m}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <Separator />
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Checkbox checked={dontShow} onCheckedChange={v => toggleDontShow(v === true)} />
                        Don&apos;t show this automatically
                    </label>
                    {g.next && (
                        <Button size="sm" asChild onClick={() => onOpenChange(false)}>
                            <Link href={g.next.href}>{g.next.label} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}

/** Drop-in "Guide" button for any page/editor header. */
export function GuideButton({ guide, className }: { guide: GuideKey; className?: string }) {
    const [open, setOpen] = useState(false)
    return (
        <>
            <Button variant="outline" size="sm" className={className} onClick={() => setOpen(true)}>
                <HelpCircle className="mr-1.5 h-4 w-4" /> Guide
            </Button>
            <GuideSheet guide={guide} open={open} onOpenChange={setOpen} />
        </>
    )
}

/** First-run nudge for a list page. Hidden once dismissed. */
export function OnboardingBanner({ guide }: { guide: GuideKey }) {
    const g = GUIDES[guide]
    const [show, setShow] = useState(false)   // stays hidden until the effect confirms
    const [open, setOpen] = useState(false)

    useEffect(() => { setShow(!isDismissed(guide)) }, [guide])

    if (!show) return null
    return (
        <>
            <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <HelpCircle className="h-4 w-4 shrink-0 text-primary" />
                <p className="min-w-0 flex-1 text-sm">
                    New to this? Read the {g.minutes}-minute guide to <span className="font-medium">{g.title.toLowerCase()}</span>.
                </p>
                <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={() => setOpen(true)}>Read guide</Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    aria-label="Dismiss"
                    onClick={() => { setDismissed(guide, true); setShow(false) }}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
            <GuideSheet guide={guide} open={open} onOpenChange={setOpen} />
        </>
    )
}
