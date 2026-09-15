"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Save } from "lucide-react"
import { BLOCK_REGISTRY } from "@/components/catalogue/page-builder/registry"
import { PlanField, FieldRow } from "./fields"
import type { Listing, PageBlock, PageBlockConfig } from "@/types"

/**
 * ONE WIDGET, IN A DRAWER — the shape of the live screen's View action.
 *
 * The four fields at the top are the ones every widget has, in the live
 * drawer's own order: type, internal name, rank, status. The type is locked
 * after creation, because changing it would throw away the fields below it.
 *
 * Everything under the separator is the type's own editor, taken from the
 * shared widget registry. So a hero shows hero fields and a product list shows
 * a product picker, and no screen here knows which is which.
 */
export function WidgetDrawer({
    block, count, listings, onChange, onRank, onSave, onClose,
}: {
    block: PageBlock | null
    /** How many widgets the page has, for the rank options. */
    count: number
    listings: Listing[]
    onChange: (patch: Partial<PageBlock>) => void
    onConfig?: never
    onRank: (rank: number) => void
    onSave: () => void
    onClose: () => void
}) {
    if (!block) return null
    const entry = BLOCK_REGISTRY[block.type]

    const updateConfig = (patch: Partial<PageBlockConfig>) =>
        onChange({ config: { ...block.config, ...patch } })

    return (
        <Sheet open={!!block} onOpenChange={o => { if (!o) onClose() }}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
                <SheetHeader className="flex-row items-center justify-between gap-3 border-b px-5 py-4">
                    <SheetTitle className="font-mono text-base">{block.type}</SheetTitle>
                    <Button size="sm" onClick={onSave} className="mr-8">
                        <Save className="mr-2 h-3.5 w-3.5" /> Save
                    </Button>
                </SheetHeader>

                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                    <FieldRow>
                        <PlanField label="Select Widget Type"
                            hint="Locked after the widget is created. Delete it and add another to change type.">
                            <Select value={block.type} disabled onValueChange={() => {}}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={block.type}>{block.type}</SelectItem>
                                </SelectContent>
                            </Select>
                        </PlanField>

                        <PlanField label="Widget Internal Name"
                            hint="What staff call this widget in the list. The patient never reads it.">
                            <Input value={block.internalName ?? ""}
                                placeholder={entry.label}
                                onChange={e => onChange({ internalName: e.target.value })} />
                        </PlanField>
                    </FieldRow>

                    <FieldRow>
                        <PlanField label="Rank" hint="Where it sits on the page, from the top.">
                            <Select value={String(block.rank + 1)}
                                onValueChange={v => onRank(Number(v) - 1)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: count }, (_, i) => (
                                        <SelectItem key={i} value={String(i + 1)}>{i + 1}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </PlanField>

                        <PlanField label="Status">
                            <Select value={block.isActive ? "active" : "inactive"}
                                onValueChange={v => onChange({ isActive: v === "active" })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </PlanField>
                    </FieldRow>

                    <Separator />

                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{entry.label} fields</p>
                            <Badge variant="outline" className="text-[10px]">EN and AR</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{entry.description}</p>
                    </div>

                    {/* The type's own editor. Every field pair is English then
                        Arabic, the way the live drawer pairs them. */}
                    <entry.Editor
                        config={block.config}
                        onChange={updateConfig}
                        listings={listings}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
