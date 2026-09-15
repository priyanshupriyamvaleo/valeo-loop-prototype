import { Badge } from "@/components/ui/badge"
import type { AuditAction } from "@/types"

const ACTION_META: Record<AuditAction, { label: string; className: string }> = {
    create: { label: "Created", className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" },
    update: { label: "Updated", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
    status_change: { label: "Status", className: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
    delete: { label: "Deleted", className: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20" },
}

export function AuditActionBadge({ action }: { action: AuditAction }) {
    const meta = ACTION_META[action]
    return <Badge variant="outline" className={`text-[10px] ${meta.className}`}>{meta.label}</Badge>
}
