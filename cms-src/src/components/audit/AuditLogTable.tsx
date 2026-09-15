import { Card } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AuditLogEntry } from "@/types"
import { AuditEntryRow } from "./AuditEntryRow"
import { AuditEmptyState } from "./AuditEmptyState"

export function AuditLogTable({
    entries,
    emptyVariant = "cold",
    onReset,
}: {
    entries: AuditLogEntry[]
    emptyVariant?: "cold" | "no-match"
    onReset?: () => void
}) {
    if (entries.length === 0) {
        return (
            <Card className="py-0">
                <AuditEmptyState variant={emptyVariant} onReset={onReset} />
            </Card>
        )
    }

    return (
        <Card className="overflow-hidden py-0">
            <Table>
                <TableHeader className="bg-muted">
                    <TableRow className="bg-muted hover:bg-muted">
                        <TableHead className="text-xs">When</TableHead>
                        <TableHead className="text-xs">Actor</TableHead>
                        <TableHead className="text-xs">Entity</TableHead>
                        <TableHead className="text-xs">Action</TableHead>
                        <TableHead className="text-xs">Changes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map(entry => <AuditEntryRow key={entry.id} entry={entry} />)}
                </TableBody>
            </Table>
        </Card>
    )
}
