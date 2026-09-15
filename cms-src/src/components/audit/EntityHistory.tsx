"use client"

import { useCallback, useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChevronRight, History, RefreshCw } from "lucide-react"
import { AuditEntityType, AuditLogEntry } from "@/types"
import { ApiService } from "@/services/api"
import { AuditDiffRows } from "./AuditDiffRows"

/**
 * History where the thing is edited, not only in the global log.
 *
 * The global audit page answers "what happened across the CMS today". It does not
 * answer the question people actually ask, which is "who changed THIS price, and
 * what was it before" — that meant filtering a global list by an id you had to know.
 * This is the same records, scoped to one entity, next to the fields they describe.
 *
 * Deliberately read-only and self-fetching: it needs no state from its host, so it
 * can be dropped into any editor without threading data through it.
 */
export function EntityHistory({ entityType, entityId, limit = 20, defaultOpen = false }: {
    entityType: AuditEntityType
    entityId: string
    limit?: number
    defaultOpen?: boolean
}) {
    const [open, setOpen] = useState(defaultOpen)
    const [rows, setRows] = useState<AuditLogEntry[] | null>(null)
    const [busy, setBusy] = useState(false)

    const load = useCallback(() => {
        setBusy(true)
        ApiService.catalogue.audit.list({ entityType, entityId, limit })
            .then(setRows)
            .catch(() => setRows([]))
            .finally(() => setBusy(false))
    }, [entityType, entityId, limit])

    useEffect(() => { if (open && rows === null) load() }, [open, rows, load])

    return (
        <div className="rounded-md border bg-muted/10">
            <button type="button" onClick={() => setOpen(o => !o)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left">
                <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold">History</span>
                {rows && (
                    <span className="text-[10px] text-muted-foreground">
                        {rows.length === 0 ? "no changes recorded" : `${rows.length} change${rows.length === 1 ? "" : "s"}`}
                    </span>
                )}
                {open && (
                    <Button size="sm" variant="ghost" className="ml-auto h-6 px-1.5 text-[10px]"
                        onClick={e => { e.stopPropagation(); load() }}>
                        <RefreshCw className={`h-3 w-3 ${busy ? "animate-spin" : ""}`} />
                    </Button>
                )}
            </button>

            {open && (
                <div className="space-y-2 border-t px-3 py-2">
                    {rows === null && <p className="text-[10px] text-muted-foreground">Loading…</p>}
                    {rows?.length === 0 && (
                        <p className="text-[10px] text-muted-foreground">
                            Nothing recorded yet. Every save that actually changes a field lands here —
                            including a price three levels down.
                        </p>
                    )}
                    {rows?.map(r => (
                        <div key={r.id} className="space-y-1 border-b pb-2 last:border-b-0 last:pb-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <Badge variant="outline" className="text-[9px]">{r.action.replace("_", " ")}</Badge>
                                <span className="text-[10px] font-medium">{r.actor.name}</span>
                                {r.actor.role && (
                                    <span className="text-[10px] text-muted-foreground">· {r.actor.role}</span>
                                )}
                                <span className="ml-auto text-[10px] text-muted-foreground">
                                    {new Date(r.timestamp).toLocaleString()}
                                </span>
                            </div>
                            {r.changes.length === 0 ? (
                                <p className="text-[10px] text-muted-foreground">Created</p>
                            ) : (
                                // the shared renderer, so nested paths group the same way
                                // here as they do in the global audit log
                                <AuditDiffRows changes={r.changes} />
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
