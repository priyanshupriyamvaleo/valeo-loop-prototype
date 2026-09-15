"use client"

// Shared catalogue wayfinding: a breadcrumb trail (upward / where-am-I travel)
// and an ambient "Next: <stage>" forward CTA. Both are self-contained (next/link
// + lucide icons + existing shadcn primitives) so they drop into any catalogue
// screen without new dependencies. See the UX spec: hub + deep-link CTAs carry
// the pipeline sequence in place of a wizard.

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, ChevronRight, Home, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface Crumb {
    label: string
    /** Omit on the current (last) crumb so it renders as plain text. */
    href?: string
}

/**
 * Breadcrumb trail for catalogue editors/lists. The record name is not derivable
 * from the path, so each screen passes its own trail rather than re-deriving it.
 */
export function CatalogueBreadcrumb({ trail }: { trail: Crumb[] }) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link
                href="/catalogue"
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
                <Home className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Catalogue</span>
            </Link>
            {trail.map((crumb, i) => {
                const isLast = i === trail.length - 1
                return (
                    <span key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                        <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                        {crumb.href && !isLast ? (
                            <Link href={crumb.href} className="transition-colors hover:text-foreground">
                                {crumb.label}
                            </Link>
                        ) : (
                            <span className={isLast ? "font-medium text-foreground" : undefined}>
                                {crumb.label}
                            </span>
                        )}
                    </span>
                )
            })}
        </nav>
    )
}

/**
 * Ambient, dismissible forward-CTA bar for the terminal state of a list/editor.
 * Deep-links to the next pipeline stage (optionally pre-scoped via query param on
 * the href). Never gates Save — it is purely a hand-off affordance.
 */
export function NextStepBar({
    label,
    href,
    description,
    ctaLabel = "Continue",
    dismissible = true,
}: {
    /** The next stage, e.g. "Add a listing" — rendered after "Next:". */
    label: string
    href: string
    description?: string
    ctaLabel?: string
    dismissible?: boolean
}) {
    const [dismissed, setDismissed] = useState(false)
    if (dismissed) return null

    return (
        <div className="flex items-center gap-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ArrowRight className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                    Next: {label}
                </p>
                {description && (
                    <p className="truncate text-xs text-muted-foreground">{description}</p>
                )}
            </div>
            <Button asChild size="sm">
                <Link href={href}>
                    {ctaLabel}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
            {dismissible && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground"
                    onClick={() => setDismissed(true)}
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
