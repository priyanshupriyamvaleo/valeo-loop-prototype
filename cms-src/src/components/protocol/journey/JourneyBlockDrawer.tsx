"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { ArrowDown, ArrowUp, Plus, Save, Trash } from "lucide-react"
import { FieldRow, PlanField } from "@/components/protocol/plan/fields"
import {
    JOURNEY_ICONS, blockLabel, blockSpec, emptyItem, itemWord, takesItems,
} from "@/lib/protocol-journey"
import type { PhaseRange } from "@/lib/protocol-journey"
import type { JourneyBlock, JourneyItem, JourneyItemIcon } from "@/types"

/**
 * ONE SECTION OF A PHASE PAGE.
 *
 * Every section has a heading and a line under it. Three of the five also
 * carry a list, and what a line means differs: "you may notice" lines have a
 * title, a body and an icon; "focus this week" lines are one sentence with a
 * tick; "coming next" lines have a title and a body and are numbered. So the
 * item editor asks only for the fields that section actually draws, rather
 * than showing four boxes and leaving two of them ignored.
 */
export function JourneyBlockDrawer({
    block, range, onChange, onSave, onClose,
}: {
    block: JourneyBlock | null
    range: PhaseRange
    onChange: (patch: Partial<JourneyBlock>) => void
    onSave: () => void
    onClose: () => void
}) {
    if (!block) return null

    const spec = blockSpec(block.type)
    const items = [...(block.config.items ?? [])].sort((a, b) => a.rank - b.rank)
    const one = spec?.itemWord ?? "line"

    const setConfig = (patch: Partial<JourneyBlock["config"]>) =>
        onChange({ config: { ...block.config, ...patch } })

    const rerank = (list: JourneyItem[]) => list.map((it, i) => ({ ...it, rank: i }))
    const setItems = (list: JourneyItem[]) => setConfig({ items: rerank(list) })

    const patchItem = (id: string, patch: Partial<JourneyItem>) =>
        setItems(items.map(it => (it.id === id ? { ...it, ...patch } : it)))

    const moveItem = (id: string, dir: -1 | 1) => {
        const at = items.findIndex(it => it.id === id)
        const to = at + dir
        if (to < 0 || to >= items.length) return
        const next = [...items]
        const [it] = next.splice(at, 1)
        next.splice(to, 0, it)
        setItems(next)
    }

    return (
        <Sheet open={!!block} onOpenChange={o => { if (!o) onClose() }}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
                <SheetHeader className="flex-row items-center justify-between gap-3 border-b px-5 py-4">
                    <SheetTitle className="text-base">{blockLabel(block.type)}</SheetTitle>
                    <Button size="sm" onClick={onSave} className="mr-8">
                        <Save className="mr-2 h-3.5 w-3.5" /> Save
                    </Button>
                </SheetHeader>

                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                    <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        {spec?.blurb} Everybody in <b>{range.label}</b> reads the same
                        words, which is why they can be written here.
                    </p>

                    <FieldRow>
                        <PlanField label="Heading · English"
                            required={block.type !== "PHASE_HERO"}
                            hint={block.type === "PHASE_HERO"
                                ? "The first line a patient reads. \"Your journey begins.\""
                                : undefined}>
                            <Input value={block.config.headingEn ?? ""}
                                onChange={e => setConfig({ headingEn: e.target.value })}
                                placeholder={block.type === "PHASE_HERO" ? "Your journey begins." : "You may notice"} />
                        </PlanField>
                        <PlanField label="Heading · العربية">
                            <Input dir="rtl" value={block.config.headingAr ?? ""}
                                onChange={e => setConfig({ headingAr: e.target.value })} />
                        </PlanField>
                    </FieldRow>

                    <FieldRow>
                        <PlanField label={block.type === "PHASE_HERO" ? "The paragraph · English" : "The line under it · English"}
                            hint={block.type === "PHASE_HERO"
                                ? "What is happening to their body in these weeks."
                                : undefined}>
                            <Textarea rows={block.type === "PHASE_HERO" ? 4 : 2}
                                value={block.config.blurbEn ?? ""}
                                onChange={e => setConfig({ blurbEn: e.target.value })}
                                placeholder="These are common in the early stages and usually settle as your body adapts." />
                        </PlanField>
                        <PlanField label={block.type === "PHASE_HERO" ? "The paragraph · العربية" : "The line under it · العربية"}>
                            <Textarea dir="rtl" rows={block.type === "PHASE_HERO" ? 4 : 2}
                                value={block.config.blurbAr ?? ""}
                                onChange={e => setConfig({ blurbAr: e.target.value })} />
                        </PlanField>
                    </FieldRow>

                    {block.type === "PHASE_HERO" && (
                        <PlanField label="Illustration"
                            hint="The drawing beside the words. Leave it empty for the default plant.">
                            <Input value={block.config.imageUrl ?? ""}
                                onChange={e => setConfig({ imageUrl: e.target.value })}
                                placeholder="https://…" />
                        </PlanField>
                    )}

                    {block.type === "CARE_TEAM" && (
                        <FieldRow>
                            <PlanField label="Button · English">
                                <Input value={block.config.ctaLabelEn ?? ""}
                                    onChange={e => setConfig({ ctaLabelEn: e.target.value })}
                                    placeholder="Message Now" />
                            </PlanField>
                            <PlanField label="Button · العربية">
                                <Input dir="rtl" value={block.config.ctaLabelAr ?? ""}
                                    onChange={e => setConfig({ ctaLabelAr: e.target.value })} />
                            </PlanField>
                        </FieldRow>
                    )}

                    {takesItems(block.type) && (
                        <>
                            <Separator />
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    {items.length} {itemWord(block.type, items.length)}
                                </p>
                                <Button variant="outline" size="sm"
                                    onClick={() => setItems([...items, emptyItem(items.length)])}>
                                    <Plus className="mr-2 h-3.5 w-3.5" /> Add a {one}
                                </Button>
                            </div>

                            {items.length === 0 && (
                                <p className="rounded-md border border-dashed p-6 text-center text-xs text-muted-foreground">
                                    The heading would sit above nothing. Add at least one {one}.
                                </p>
                            )}

                            <div className="space-y-3">
                                {items.map((it, i) => (
                                    <div key={it.id} className="space-y-3 rounded-md border p-3">
                                        <div className="flex items-center gap-2">
                                            <span className="w-5 text-xs tabular-nums text-muted-foreground">
                                                {i + 1}
                                            </span>
                                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                                disabled={i === 0} onClick={() => moveItem(it.id, -1)}
                                                aria-label="Move up">
                                                <ArrowUp className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7"
                                                disabled={i === items.length - 1}
                                                onClick={() => moveItem(it.id, 1)} aria-label="Move down">
                                                <ArrowDown className="h-3.5 w-3.5" />
                                            </Button>
                                            {spec?.itemHasIcon && (
                                                <Select value={it.icon ?? "appetite"}
                                                    onValueChange={v => patchItem(it.id, { icon: v as JourneyItemIcon })}>
                                                    <SelectTrigger className="h-8 w-36 text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {JOURNEY_ICONS.map(ic => (
                                                            <SelectItem key={ic.id} value={ic.id}>{ic.label}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                            <Button variant="ghost" size="icon" className="ml-auto h-7 w-7"
                                                onClick={() => setItems(items.filter(x => x.id !== it.id))}
                                                aria-label="Delete">
                                                <Trash className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>

                                        {/* A "focus this week" line is one sentence beside a tick, so
                                            it asks for one box. The other two carry a title as well. */}
                                        {spec?.itemHasTitle ? (
                                            <>
                                                <FieldRow>
                                                    <PlanField label="Title · English">
                                                        <Input value={it.titleEn ?? ""}
                                                            onChange={e => patchItem(it.id, { titleEn: e.target.value })}
                                                            placeholder="Changes in appetite" />
                                                    </PlanField>
                                                    <PlanField label="Title · العربية">
                                                        <Input dir="rtl" value={it.titleAr ?? ""}
                                                            onChange={e => patchItem(it.id, { titleAr: e.target.value })} />
                                                    </PlanField>
                                                </FieldRow>
                                                <FieldRow>
                                                    <PlanField label="The line under it · English">
                                                        <Input value={it.textEn ?? ""}
                                                            onChange={e => patchItem(it.id, { textEn: e.target.value })}
                                                            placeholder="You may feel less hungry or fuller sooner." />
                                                    </PlanField>
                                                    <PlanField label="The line under it · العربية">
                                                        <Input dir="rtl" value={it.textAr ?? ""}
                                                            onChange={e => patchItem(it.id, { textAr: e.target.value })} />
                                                    </PlanField>
                                                </FieldRow>
                                            </>
                                        ) : (
                                            <FieldRow>
                                                <PlanField label="English">
                                                    <Input value={it.textEn ?? ""}
                                                        onChange={e => patchItem(it.id, { textEn: e.target.value })}
                                                        placeholder="Take your medication as prescribed" />
                                                </PlanField>
                                                <PlanField label="العربية">
                                                    <Input dir="rtl" value={it.textAr ?? ""}
                                                        onChange={e => patchItem(it.id, { textAr: e.target.value })} />
                                                </PlanField>
                                            </FieldRow>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    <Separator />

                    <label className="flex items-center gap-3 rounded-md border p-3">
                        <Switch checked={block.isActive}
                            onCheckedChange={v => onChange({ isActive: v })} />
                        <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium">On the page</span>
                            <span className="block text-xs text-muted-foreground">
                                Off, and the section is kept but a patient does not see it.
                            </span>
                        </span>
                    </label>
                </div>
            </SheetContent>
        </Sheet>
    )
}
