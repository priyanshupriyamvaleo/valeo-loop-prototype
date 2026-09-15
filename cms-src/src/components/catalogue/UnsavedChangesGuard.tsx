"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Save } from "lucide-react"

/**
 * Stops unsaved work from disappearing when someone navigates away.
 *
 * Two escape routes have to be covered, and they need different mechanisms:
 *
 *   1. Leaving the app entirely — tab close, refresh, typing a new URL. Only the
 *      browser's own `beforeunload` prompt can interrupt that; its wording is
 *      fixed by the browser and cannot be customised.
 *   2. Navigating inside the app — the editor's back arrow, the sidebar, any
 *      internal link. App Router gives no navigation-blocking hook, so we
 *      intercept the click in the CAPTURE phase before Next's router sees it,
 *      hold the destination, and ask first.
 *
 * The dialog offers the three answers people actually want: save and go, go
 * anyway, or stay. "Go anyway" is deliberately not the default button.
 */
export function UnsavedChangesGuard({ dirty, onSave, entityLabel = "listing" }: {
    dirty: boolean
    /** Persist. Return false if it failed (e.g. validation) so we stay put. */
    onSave: () => Promise<boolean>
    entityLabel?: string
}) {
    const router = useRouter()
    /** Sentinel for "the user pressed Back", which has no href to push. */
    const BACK = "__browser_back__"
    const [pending, setPending] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    // Read inside listeners registered once — avoids re-binding on every keystroke.
    const dirtyRef = useRef(dirty)
    dirtyRef.current = dirty

    // ── 1. leaving the app ──
    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!dirtyRef.current) return
            e.preventDefault()
            // Legacy browsers need returnValue set; the string itself is ignored.
            e.returnValue = ""
        }
        window.addEventListener("beforeunload", onBeforeUnload)
        return () => window.removeEventListener("beforeunload", onBeforeUnload)
    }, [])

    // ── 2. navigating inside the app ──
    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (!dirtyRef.current) return
            // Let the browser do its normal thing for new-tab / modified clicks.
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
            const anchor = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null
            if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return
            // Never intercept our own dialog, or anything that opted out.
            if (anchor.closest("[data-unsaved-ignore]")) return
            const href = anchor.getAttribute("href") ?? ""
            if (!href.startsWith("/")) return                        // external or hash
            const here = window.location.pathname + window.location.search
            if (href === here || href === window.location.pathname) return

            e.preventDefault()
            e.stopPropagation()
            setPending(href)
        }
        // capture phase: we must run before the Next.js Link handler
        document.addEventListener("click", onClick, true)
        return () => document.removeEventListener("click", onClick, true)
    }, [])

    // ── 3. the browser BACK button ──
    // Not covered by either mechanism above: Back fires popstate, not a click, and
    // beforeunload does not run for a same-app history move. So the one route people
    // actually use to leave a page was the one route that discarded their edits silently.
    //
    // The technique: while dirty, keep a spare history entry in front of us. Back consumes
    // it, popstate fires, we push it again to stay put, and ask. Not elegant — the History
    // API gives no way to cancel a navigation — but it is the only thing that works in App
    // Router, and it degrades safely: if the push fails, the worst case is the old behaviour.
    useEffect(() => {
        if (!dirty) return
        window.history.pushState(null, "", window.location.href)

        const onPop = () => {
            if (!dirtyRef.current) return
            // Put the guard entry back so this Back press does not take effect.
            window.history.pushState(null, "", window.location.href)
            setPending(BACK)
        }
        window.addEventListener("popstate", onPop)
        return () => window.removeEventListener("popstate", onPop)
    }, [dirty])

    const go = (href: string) => {
        setPending(null)
        if (href === BACK) {
            // Two entries back: the guard entry we pushed, and the page itself.
            window.history.go(-2)
            return
        }
        router.push(href)
    }

    const saveAndGo = async () => {
        if (!pending) return
        setSaving(true)
        try {
            const ok = await onSave()
            // Validation failed — stay so the operator can see what is wrong.
            if (ok) go(pending)
            else setPending(null)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open={pending !== null} onOpenChange={o => !o && setPending(null)}>
            <DialogContent data-unsaved-ignore>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        You have unsaved changes
                    </DialogTitle>
                    <DialogDescription>
                        This {entityLabel} has edits that were never saved.{" "}
                        {pending === BACK ? "Going back" : "Leaving now"} discards them — there is no
                        undo.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:justify-between">
                    <Button variant="ghost" onClick={() => pending && go(pending)}
                        className="text-destructive hover:text-destructive">
                        Leave without saving
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setPending(null)}>Keep editing</Button>
                        <Button onClick={saveAndGo} disabled={saving}>
                            <Save className="mr-2 h-4 w-4" />
                            {saving ? "Saving…" : "Save & leave"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/**
 * Tracks whether the edited value differs from what was last persisted.
 * Snapshot on load and after every successful save; compare on every render.
 */
export function useDirtyTracker<T>(value: T) {
    const [snapshot, setSnapshot] = useState<string | null>(null)
    // Memoized on the value's IDENTITY: the listing is multi-megabyte once variants and
    // prices fill in, and every unrelated render (tab switch, hover state, save spinner)
    // was re-serialising all of it. Edits replace the object, so identity is the right key.
    const serialised = useMemo(() => JSON.stringify(value), [value])
    return {
        /** false until the first snapshot is taken, so a loading screen is never "dirty". */
        dirty: snapshot !== null && snapshot !== serialised,
        /** Whether a baseline exists yet — lets the caller snapshot exactly once. */
        hasSnapshot: snapshot !== null,
        /** Call after load and after each successful save. */
        markClean: () => setSnapshot(JSON.stringify(value)),
        /** Mark clean against a value you already have (e.g. the server response). */
        markCleanAs: (v: T) => setSnapshot(JSON.stringify(v)),
        /**
         * The last clean value, parsed — the baseline dirty-section saves diff against.
         * Null until the first snapshot, which correctly means "no baseline: save everything".
         */
        cleanValue: (): T | null => (snapshot === null ? null : JSON.parse(snapshot) as T),
    }
}
