"use client"

import { AlertCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet"
import { PlanField } from "@/components/protocol/plan/fields"
import type { PhaseRange } from "@/lib/protocol-journey"
import type { PlanGap } from "@/lib/protocol-plans"
import type { JourneyPhase } from "@/types"

/**
 * ONE PHASE PAGE'S NAME AND STATUS. It is the plan page's Template tab, minus
 * everything a phase page does not have.
 *
 * NO SEO, NO ADDRESS. The plan page is a web page and needs a slug, a folder
 * and crawl settings. A phase page opens inside the app from Today, so it has
 * no address and nothing to say to a search engine, and asking for one would
 * be a field nobody can fill honestly.
 *
 * THE WEEK RANGE IS NOT EDITABLE HERE either. It is derived from the journey's
 * length and its two break points, which are set once above the list — three
 * phases each editing their own range is how a week ends up in two of them.
 */
export function PhaseEditDrawer({
    phase, range, gaps, showErrors, onChange, onSave, onClose,
}: {
    phase: JourneyPhase | null
    range: PhaseRange
    gaps: PlanGap[]
    showErrors: boolean
    onChange: (patch: Partial<JourneyPhase>) => void
    onSave: () => void
    onClose: () => void
}) {
    if (!phase) return null

    const written = phase.blocks.length > 0

    return (
        <Sheet open={!!phase} onOpenChange={o => { if (!o) onClose() }}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
                <SheetHeader className="flex-row items-center justify-between gap-3 border-b px-5 py-4">
                    <SheetTitle className="text-base">
                        Phase {phase.phase} · {range.label}
                    </SheetTitle>
                    <Button size="sm" onClick={onSave} className="mr-8">
                        <Save className="mr-2 h-3.5 w-3.5" /> Save
                    </Button>
                </SheetHeader>

                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                    {showErrors && gaps.length > 0 && (
                        <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50/60 p-3">
                            <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
                                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                {gaps.length === 1 ? gaps[0].what : `${gaps.length} things are missing`}
                            </p>
                            <ul className="space-y-1 text-xs text-amber-900">
                                {gaps.map((g, i) => (
                                    <li key={i}><b>{g.what}.</b> <span className="text-amber-800">{g.why}</span></li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <PlanField label="Page name" required
                        hint="How staff find it in the list. It is not the heading a patient reads — that is the phase hero's own words.">
                        <Input value={phase.pageName ?? ""}
                            onChange={e => onChange({ pageName: e.target.value })}
                            placeholder={`Phase ${phase.phase} · ${range.label}`} />
                    </PlanField>

                    <PlanField label="Status"
                        hint={written
                            ? "Active means a patient in these weeks reads it."
                            : "There is nothing on the page yet, so Active would show a patient an empty screen."}>
                        <Select value={phase.status}
                            onValueChange={v => onChange({ status: v as JourneyPhase["status"] })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Inactive</SelectItem>
                                <SelectItem value="published" disabled={!written}>
                                    Active{written ? "" : " — write the page first"}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </PlanField>

                    <Separator />

                    <div className="space-y-1.5 rounded-md bg-muted/50 px-3 py-2.5">
                        <p className="text-xs font-medium">These weeks are set above the list</p>
                        <p className="text-xs text-muted-foreground">
                            {range.label} comes from the journey&rsquo;s length and its two break
                            points. Changing them there moves all three phases together, which is
                            the only way a week cannot land in two of them.
                        </p>
                    </div>

                    <div className="space-y-1.5 rounded-md bg-muted/50 px-3 py-2.5">
                        <p className="text-xs font-medium">A phase page has no address</p>
                        <p className="text-xs text-muted-foreground">
                            It opens inside the app from Today, so there is no slug, no folder and
                            nothing to tell a search engine. The plan page is the one with an
                            address.
                        </p>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
