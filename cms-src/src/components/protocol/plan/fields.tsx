"use client"

import { Label } from "@/components/ui/label"

/**
 * The field shapes of the live landing-page screen, minus one thing.
 *
 * THE PENCIL IS GONE. Every field on that screen sits behind a pencil icon:
 * you click the pencil, then you type. It is two actions for one edit, on every
 * field, and it protects nothing that a draft status does not already protect.
 * Fields here are editable where they stand. Nothing else about the layout
 * changed: label above the input, English on the left, Arabic on the right.
 */
export function PlanField({
    label, required, hint, children,
}: {
    label: string
    required?: boolean
    hint?: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <Label className="text-sm">
                {label}{required && <span className="ml-0.5 text-destructive">*</span>}
            </Label>
            {children}
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
    )
}

/** A row of the two-column grid the live screen uses: English, then Arabic. */
export function FieldRow({ children }: { children: React.ReactNode }) {
    return <div className="grid gap-4 md:grid-cols-2">{children}</div>
}
