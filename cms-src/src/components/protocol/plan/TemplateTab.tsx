"use client"

import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ImageField } from "@/components/catalogue/ImageField"
import { PlanField, FieldRow } from "./fields"
import type { PlanStatus, Protocol, ProtocolPlan } from "@/types"

/**
 * TEMPLATE — the first tab of the drawer, field for field.
 *
 * Page Name is the name in the pages LIST. It is not the heading a patient
 * reads: that is the hero widget's own header text. Keeping those two apart is
 * why this tab is short.
 */
export function TemplateTab({
    plan, protocol, showErrors, onChange,
}: {
    plan: ProtocolPlan
    protocol: Protocol | null
    showErrors: boolean
    onChange: (patch: Partial<ProtocolPlan>) => void
}) {
    const bad = (v?: string) => (showErrors && !v?.trim() ? "border-destructive" : "")

    return (
        <div className="space-y-5">
            <FieldRow>
                    <PlanField label="Page Name" required
                        hint="How staff find this page in the list.">
                        <Input value={plan.pageName ?? ""}
                            placeholder="Weight Loss GLP-1 Programme"
                            className={bad(plan.pageName)}
                            onChange={e => onChange({ pageName: e.target.value })} />
                    </PlanField>

                    <PlanField label="Status"
                        hint="Inactive keeps the page off the site and keeps the work. Active is checked on Save.">
                        <Select value={plan.status}
                            onValueChange={v => onChange({ status: v as PlanStatus })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="published">Active</SelectItem>
                                <SelectItem value="draft">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                    </PlanField>
            </FieldRow>

            <PlanField label="Water Mark Image"
                hint="Optional. It sits over the page artwork.">
                <ImageField
                    preset="square"
                    value={plan.watermarkUrl}
                    onChange={v => onChange({ watermarkUrl: v })}
                />
            </PlanField>

            <Separator />

            {/* The clinical half of the protocol, stated and not editable here.
                It answers "is this page allowed to go live" before somebody
                presses Publish and reads a refusal. */}
            {protocol && (
                <Card className="space-y-1 border-dashed p-3">
                    <p className="text-sm font-medium">The protocol behind this page</p>
                    <p className="text-xs text-muted-foreground">
                        {protocol.nameEn} · {protocol.code} · {protocol.steps.length} step
                        {protocol.steps.length === 1 ? "" : "s"} · the protocol is{" "}
                        <span className={protocol.status === "active"
                            ? "font-medium text-emerald-700" : "font-medium text-amber-700"}>
                            {protocol.status}
                        </span>
                    </p>
                    {protocol.status !== "active" && (
                        <p className="text-xs text-amber-700">
                            A page cannot go live while its protocol is not live. That would
                            sell a programme nobody signed off.
                        </p>
                    )}
                </Card>
            )}
        </div>
    )
}
