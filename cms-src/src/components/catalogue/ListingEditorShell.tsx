"use client"

import Link from "next/link"
import { ReactNode, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, Save, ChevronDown, ChevronRight } from "lucide-react"

export interface EditorSection {
    id: string
    label: string
    /** optional count/indicator shown on the right of the nav item */
    badge?: string | number
    /** show a destructive dot when the section has validation errors */
    hasError?: boolean
    /** optional cluster label — sections sharing a group collapse together */
    group?: string
    /** Content-service coverage dot: amber/red/grey when the section does not
        fully reach the API. Undefined renders nothing. */
    syncDot?: { className: string; title: string }
}

interface ListingEditorShellProps {
    /** Back-link target (e.g. "/catalogue/listings"). */
    backHref: string
    title: string
    subtitle?: string
    /** Rendered next to the title (e.g. a status <Badge/>). */
    titleBadge?: ReactNode
    /** Rendered in the top-right action bar (status select, preview, etc.). */
    headerActions?: ReactNode
    saveLabel?: string
    onSave?: () => void
    /**
     * Hide the shell's own Save button. An editor that publishes as well as
     * saves owns both buttons itself, and a third button labelled only "Save"
     * beside them says nothing about which of the two it does.
     */
    hideSave?: boolean
    /**
     * True while a save is in flight. The button disables and says so — an
     * operator who can multi-click a silent button has no way to know anything
     * happened, and every extra click queues another PUT wave.
     */
    saving?: boolean
    sections: EditorSection[]
    activeSection: string
    onSectionChange: (id: string) => void
    children: ReactNode
}

/**
 * Shared editor chrome for every catalogue editor: sticky header (back / title /
 * status / save) + left section navigator + scrollable body. Extracted from the
 * product editor so all department editors share one layout.
 */
export function ListingEditorShell({
    backHref,
    title,
    subtitle,
    titleBadge,
    headerActions,
    saveLabel = "Save",
    onSave,
    hideSave = false,
    saving = false,
    sections,
    activeSection,
    onSectionChange,
    children,
}: ListingEditorShellProps) {
    return (
        <div className="flex flex-col h-[calc(100vh-80px)]">
            {/* Header */}
            {/* The action row is long and the title is arbitrary length, so the title
                truncates and the actions wrap to a second line rather than squeezing
                each other into unreadable columns. */}
            <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b pb-4">
                <div className="flex min-w-[260px] flex-1 items-center gap-3">
                    <Button variant="ghost" size="icon" className="shrink-0" asChild>
                        <Link href={backHref}><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="truncate text-lg font-semibold" title={title}>{title}</h2>
                            <span className="shrink-0">{titleBadge}</span>
                        </div>
                        {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                    {headerActions}
                    {!hideSave && (
                        <Button size="sm" onClick={onSave} disabled={saving}
                            className="min-w-[150px]" aria-busy={saving}>
                            {saving
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                                : <><Save className="mr-2 h-4 w-4" /> {saveLabel}</>}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Section navigator */}
                <div className="w-60 shrink-0 space-y-0.5 overflow-y-auto pr-1">
                    <SectionNav
                        sections={sections}
                        activeSection={activeSection}
                        onSectionChange={onSectionChange}
                    />
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="space-y-6 pb-12">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    )
}

/**
 * Left-rail navigator. When sections declare a `group`, they render as
 * collapsible clusters (progressive disclosure — fewer things on screen at
 * once); the group containing the active section is always expanded. With no
 * groups it falls back to a flat list (used by the protocol / category editors).
 */
function SectionNav({
    sections,
    activeSection,
    onSectionChange,
}: {
    sections: EditorSection[]
    activeSection: string
    onSectionChange: (id: string) => void
}) {
    const hasGroups = sections.some(s => s.group)
    const activeGroup = sections.find(s => s.id === activeSection)?.group
    const [open, setOpen] = useState<Record<string, boolean>>({})

    const renderItem = (section: EditorSection) => (
        <Button
            key={section.id}
            variant={activeSection === section.id ? "secondary" : "ghost"}
            className="w-full justify-start text-sm"
            onClick={() => onSectionChange(section.id)}
        >
            <span className="truncate">{section.label}</span>
            {section.hasError && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-destructive" />
            )}
            {!section.hasError && section.syncDot && (
                <span
                    className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${section.syncDot.className}`}
                    title={section.syncDot.title}
                />
            )}
            {section.badge !== undefined && !section.hasError && !section.syncDot && (
                <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1">
                    {section.badge}
                </Badge>
            )}
        </Button>
    )

    if (!hasGroups) return <>{sections.map(renderItem)}</>

    const order: string[] = []
    const byGroup: Record<string, EditorSection[]> = {}
    for (const s of sections) {
        const g = s.group ?? ""
        if (!(g in byGroup)) { byGroup[g] = []; order.push(g) }
        byGroup[g].push(s)
    }
    const isOpen = (g: string) => g === activeGroup || !!open[g]

    return (
        <>
            {order.map(g => {
                if (g === "") return <div key="__ungrouped" className="space-y-0.5">{byGroup[g].map(renderItem)}</div>
                const groupError = byGroup[g].some(s => s.hasError)
                return (
                    <div key={g} className="pt-1.5">
                        <button
                            onClick={() => setOpen(o => ({ ...o, [g]: !isOpen(g) }))}
                            className="flex w-full items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground"
                        >
                            {isOpen(g) ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                            <span className="truncate">{g}</span>
                            {groupError && !isOpen(g) && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-destructive" />}
                        </button>
                        {isOpen(g) && <div className="space-y-0.5">{byGroup[g].map(renderItem)}</div>}
                    </div>
                )
            })}
        </>
    )
}
