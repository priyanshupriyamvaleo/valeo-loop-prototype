import { ScrollText } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Empty state for the audit log. `variant="cold"` = nothing recorded yet;
 * `variant="no-match"` = filters excluded everything (offers a Reset).
 */
export function AuditEmptyState({
    variant,
    onReset,
}: {
    variant: "cold" | "no-match"
    onReset?: () => void
}) {
    const message = variant === "cold" ? "No audit entries yet" : "No entries match your filters"
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <ScrollText className="h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{message}</p>
            {variant === "no-match" && onReset && (
                <Button variant="outline" size="sm" onClick={onReset}>Reset filters</Button>
            )}
        </div>
    )
}
