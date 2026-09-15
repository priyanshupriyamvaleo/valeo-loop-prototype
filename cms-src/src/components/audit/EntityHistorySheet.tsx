"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ScrollText, ChevronDown, ChevronRight } from "lucide-react"
import type { AuditEntityType, AuditLogEntry } from "@/types"
import { AuditActionBadge } from "./AuditActionBadge"
import { AuditDiffRows } from "./AuditDiffRows"
import { relativeTime } from "./relative-time"
import { ApiService } from "@/services/api"

function HistoryCard({ entry }: { entry: AuditLogEntry }) {
    const [expanded, setExpanded] = useState(false)
    const hasDetail = entry.action === "create" || (entry.changes?.length ?? 0) > 0

    return (
        <div className="relative pl-6">
            {/* timeline node + line */}
            <span className="absolute left-0 top-2 h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
            <span className="absolute left-[4px] top-5 bottom-0 w-px bg-border" />

            <div className="rounded-md border">
                <button
                    type="button"
                    onClick={() => hasDetail && setExpanded(e => !e)}
                    className="flex w-full items-center gap-2 p-2.5 text-left"
                >
                    {hasDetail
                        ? (expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />)
                        : <span className="w-3.5 shrink-0" />}
                    <AuditActionBadge action={entry.action} />
                    <span className="text-xs font-medium">{entry.actor.name}</span>
                    <span className="ml-auto whitespace-nowrap text-xs text-muted-foreground" title={new Date(entry.timestamp).toISOString()}>
                        {relativeTime(entry.timestamp)}
                    </span>
                </button>
                {expanded && hasDetail && (
                    <div className="border-t p-2.5">
                        {entry.action === "create"
                            ? <p className="text-xs text-muted-foreground">Created draft — {entry.entityName}</p>
                            : <AuditDiffRows changes={entry.changes} />}
                    </div>
                )}
            </div>
        </div>
    )
}

export function EntityHistorySheet({
    entityType,
    entityId,
    entityName,
    open,
    onOpenChange,
}: {
    entityType: AuditEntityType
    entityId: string
    entityName: string
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const [entries, setEntries] = useState<AuditLogEntry[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!open || !entityId) return
        setLoading(true)
        let cancelled = false
        ApiService.catalogue.audit.list({ entityType, entityId }).then(rows => {
            if (cancelled) return
            setEntries(rows)
            setLoading(false)
        })
        return () => { cancelled = true }
    }, [open, entityType, entityId])

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>History</SheetTitle>
                    <SheetDescription className="truncate">{entityName}</SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    {loading ? (
                        <div className="py-16 text-center text-sm text-muted-foreground">Loading history…</div>
                    ) : entries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <ScrollText className="h-10 w-10 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">No history for this item yet</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {entries.map(entry => <HistoryCard key={entry.id} entry={entry} />)}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
