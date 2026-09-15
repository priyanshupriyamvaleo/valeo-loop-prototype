"use client"

import { useCallback, useState, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronRight, HelpCircle, AlertTriangle, ListOrdered, Clock } from "lucide-react"
import { guideFor } from "@/lib/section-guide"
import { syncOf, SYNC_LABEL } from "@/lib/api/section-sync"

/**
 * "What do I do here?" for one section.
 *
 * Collapsed by default and remembered per section, because guidance that cannot
 * be turned off becomes furniture people scroll past — and then the one section
 * where they DID need it reads like the nineteen where they did not.
 *
 * It states whether the section reaches the real service, read from
 * SECTION_SYNC rather than repeated here. That matters more than the steps: an
 * operator filling in a section that saves nowhere deserves to know before they
 * spend twenty minutes on it, not after.
 */
export function SectionHelp({ sectionId }: { sectionId: string }) {
    const guide = guideFor(sectionId)
    const sync = syncOf(sectionId)
    const storeKey = `valeo_cms_help_open_${sectionId}`

    /**
     * localStorage is external state, so it is read through
     * useSyncExternalStore rather than copied into state inside an effect.
     * That gives the server a defined snapshot (collapsed) instead of a
     * render-then-correct flicker, and keeps the read out of an effect.
     */
    const subscribe = useCallback((cb: () => void) => {
        window.addEventListener("storage", cb)
        return () => window.removeEventListener("storage", cb)
    }, [])
    const [bump, setBump] = useState(0)
    const persisted = useSyncExternalStore(
        subscribe,
        () => { try { return localStorage.getItem(storeKey) === "1" } catch { return false } },
        () => false,
    )
    // `bump` only exists to re-read after this tab writes; the storage event
    // fires for other tabs, not the one that made the change.
    void bump
    const open = persisted

    const toggle = () => {
        try {
            open ? localStorage.removeItem(storeKey) : localStorage.setItem(storeKey, "1")
        } catch { /* private window — the panel just will not remember */ }
        setBump(n => n + 1)
    }

    if (!guide) return null

    // Whether what you type here actually leaves the browser.
    const reaches = sync?.state === "synced" || sync?.state === "partial"

    return (
        <div className="rounded-md border bg-muted/20">
            <button type="button" onClick={toggle}
                aria-expanded={open}
                className="flex w-full items-center gap-2 px-3 py-2 text-left">
                <HelpCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-xs">
                    <span className="font-medium">{guide.what}</span>
                </span>
                {sync && (
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
                        reaches ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {reaches ? "saves to the service" : SYNC_LABEL[sync.state]}
                    </span>
                )}
                {open
                    ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            </button>

            {open && (
                <div className="space-y-3 border-t px-3 py-3">
                    {/* WHEN — prerequisites first, because arriving in the wrong
                        order is what actually wastes someone's afternoon. */}
                    {guide.before?.length ? (
                        <div>
                            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                <Clock className="h-3 w-3" /> Do this first
                            </p>
                            <ul className="space-y-0.5">
                                {guide.before.map((b, i) => (
                                    <li key={i} className="flex gap-1.5 text-xs text-muted-foreground">
                                        <span>·</span>{b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {/* HOW */}
                    <div>
                        <p className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            <ListOrdered className="h-3 w-3" /> Then
                        </p>
                        <ol className="space-y-1">
                            {guide.how.map((h, i) => (
                                <li key={i} className="flex gap-2 text-xs">
                                    <span className="w-3 shrink-0 font-mono text-[10px] text-muted-foreground">{i + 1}</span>
                                    <span>{h}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                    {guide.gotcha && (
                        <p className="flex gap-2 rounded border-l-2 border-amber-400 bg-amber-50/60 px-2.5 py-2 text-xs text-amber-900">
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span>{guide.gotcha}</span>
                        </p>
                    )}

                    {!reaches && sync && (
                        <p className="rounded border-l-2 border-slate-400 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">
                            <strong>Where this goes.</strong> {sync.detail}
                        </p>
                    )}

                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={toggle}>
                        Hide this
                    </Button>
                </div>
            )}
        </div>
    )
}
