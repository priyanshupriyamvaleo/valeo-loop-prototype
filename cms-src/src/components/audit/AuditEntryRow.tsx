"use client"

import { useState } from "react"
import Link from "next/link"
import { TableCell, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronDown, ChevronRight } from "lucide-react"
import type { AuditLogEntry } from "@/types"
import { AuditActionBadge } from "./AuditActionBadge"
import { AuditEntityBadge } from "./AuditEntityBadge"
import { AuditDiffRows } from "./AuditDiffRows"
import { relativeTime } from "./relative-time"

function initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase() ?? "").join("") || "?"
}

/**
 * "Created draft" for a create; else "{n} fields: {L1}, {L2} +{rest}".
 *
 * Labels are now full paths ("Variants › 60 Capsules › Regional data › UAE › Price"),
 * and two of those concatenated is an unreadable line in a table cell. So the summary
 * names the SECTION each change sits in — "Variants › UAE › Price" collapses to
 * "Variants: Price" — and the expanded rows carry the full path.
 */
function summaryLabel(c: { label: string; path?: string[] }): string {
    if (!c.path || c.path.length < 2) return c.label
    const leaf = c.path[c.path.length - 1]
    return `${c.path[0]}: ${leaf}`
}

function changesSummary(entry: AuditLogEntry): string {
    if (entry.action === "create") return "Created draft"
    const changes = (entry.changes ?? []).filter(c => c.field !== "_overflow")
    if (changes.length === 0) return "No field changes"
    const labels = Array.from(new Set(changes.map(summaryLabel)))
    const shown = labels.slice(0, 2).join(", ")
    const rest = labels.length - 2
    const suffix = rest > 0 ? ` +${rest}` : ""
    const count = `${changes.length} field${changes.length > 1 ? "s" : ""}`
    return `${count}: ${shown}${suffix}`
}

export function AuditEntryRow({ entry }: { entry: AuditLogEntry }) {
    const [expanded, setExpanded] = useState(false)
    const hasDetail = entry.action === "create" || (entry.changes?.length ?? 0) > 0

    return (
        <>
            <TableRow
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => setExpanded(e => !e)}
                aria-expanded={expanded}
            >
                <TableCell className="py-2.5 align-top">
                    <div className="flex items-center gap-1.5 text-xs">
                        {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                        <span title={new Date(entry.timestamp).toISOString()} className="whitespace-nowrap text-muted-foreground">
                            {relativeTime(entry.timestamp)}
                        </span>
                    </div>
                </TableCell>
                <TableCell className="py-2.5 align-top">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[9px]">{initials(entry.actor.name)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{entry.actor.name}</span>
                    </div>
                </TableCell>
                <TableCell className="py-2.5 align-top">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <AuditEntityBadge entityType={entry.entityType} />
                        {entry.entityType === "listing" ? (
                            <Link
                                href={`/catalogue/listings/${entry.entityId}`}
                                onClick={e => e.stopPropagation()}
                                className="text-xs font-medium hover:underline"
                            >
                                {entry.entityName}
                            </Link>
                        ) : (
                            <span className="text-xs font-medium">{entry.entityName}</span>
                        )}
                    </div>
                </TableCell>
                <TableCell className="py-2.5 align-top">
                    <AuditActionBadge action={entry.action} />
                </TableCell>
                <TableCell className="py-2.5 align-top">
                    <span className="text-xs text-muted-foreground">{changesSummary(entry)}</span>
                </TableCell>
            </TableRow>

            {expanded && hasDetail && (
                <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="bg-muted/20 py-3">
                        {entry.action === "create" ? (
                            <p className="text-xs text-muted-foreground">Created draft — {entry.entityName}</p>
                        ) : (
                            <AuditDiffRows changes={entry.changes} />
                        )}
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}
