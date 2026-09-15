import { Badge } from "@/components/ui/badge"
import type { AuditChange } from "@/types"

// The "—" sentinel (empty/absent) tells us what kind of change each field is.
type ChangeType = "added" | "removed" | "changed"
function changeTypeOf(c: AuditChange): ChangeType {
    if (c.oldValue === "—") return "added"
    if (c.newValue === "—") return "removed"
    return "changed"
}

const TYPE_META: Record<ChangeType, { label: string; badge: string }> = {
    added: { label: "Added", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
    removed: { label: "Removed", badge: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
    changed: { label: "Changed", badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
}

const BEFORE_CELL = "bg-red-500/10 text-red-700 dark:text-red-400"
const AFTER_CELL = "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"

/**
 * Shared before→after diff renderer.
 *
 * Changes are no longer flat. Money in this catalogue lives three levels down, so a
 * single price edit arrives as "Variants › 60 Capsules › Regional data › UAE › Price".
 * Rendering that as one long label per row means ten edits to one variant repeat the
 * same parent ten times and squeeze the before/after cells into nothing.
 *
 * So rows are GROUPED by their parent path: the parent is stated once as a heading,
 * and each row underneath carries only its leaf field. Top-level changes have no
 * parent and render exactly as they always did.
 */
function groupKey(c: AuditChange): string {
    return c.path && c.path.length > 1 ? c.path.slice(0, -1).join(" › ") : ""
}

function leafLabel(c: AuditChange): string {
    return c.path && c.path.length > 1 ? c.path[c.path.length - 1] : c.label
}

export function AuditDiffRows({ changes }: { changes: AuditChange[] }) {
    if (!changes || changes.length === 0) return null

    // Preserve emission order; group only runs of the same parent so the reading
    // order still matches the order things were changed in.
    const groups: { key: string; rows: AuditChange[] }[] = []
    for (const c of changes) {
        const k = groupKey(c)
        const last = groups[groups.length - 1]
        if (last && last.key === k) last.rows.push(c)
        else groups.push({ key: k, rows: [c] })
    }

    return (
        <div className="overflow-x-auto">
            <div className="min-w-0 space-y-2">
                {groups.map((g, gi) => (
                    <div key={`${g.key}-${gi}`} className={g.key ? "rounded-md border" : ""}>
                        {g.key && (
                            <div className="border-b bg-muted/40 px-2 py-1">
                                <span className="text-[11px] font-medium text-muted-foreground">{g.key}</span>
                            </div>
                        )}
                        <div className={g.key ? "space-y-1.5 p-2" : "space-y-2"}>
                            {g.rows.map((c, i) => {
                                const type = changeTypeOf(c)
                                const meta = TYPE_META[type]
                                const isOverflow = c.field === "_overflow"
                                if (isOverflow) {
                                    return (
                                        <p key={`${c.field}-${i}`} className="text-[11px] italic text-muted-foreground">
                                            {c.newValue} — open the entity to see the rest
                                        </p>
                                    )
                                }
                                return (
                                    <div
                                        key={`${c.field}-${i}`}
                                        className={`grid grid-cols-1 gap-2 sm:grid-cols-[minmax(8rem,1.2fr)_minmax(0,2fr)_minmax(0,2fr)] sm:items-center ${g.key ? "" : "rounded-md border p-2"}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className={`shrink-0 text-[10px] ${meta.badge}`}>
                                                {meta.label}
                                            </Badge>
                                            <span className="text-xs font-medium break-words text-foreground">
                                                {leafLabel(c)}
                                            </span>
                                        </div>
                                        <div className={`rounded px-2 py-1 text-xs break-words font-mono ${BEFORE_CELL}`}>{c.oldValue}</div>
                                        <div className={`rounded px-2 py-1 text-xs break-words font-mono ${AFTER_CELL}`}>{c.newValue}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
