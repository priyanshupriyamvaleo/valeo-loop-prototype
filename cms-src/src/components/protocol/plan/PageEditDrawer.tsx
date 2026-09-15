"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { AlertCircle } from "lucide-react"
import { TemplateTab } from "./TemplateTab"
import { SeoTab } from "./SeoTab"
import { draftGaps } from "@/lib/protocol-plans"
import type { PlanGap } from "@/lib/protocol-plans"
import type { Protocol, ProtocolPlan } from "@/types"

/**
 * EDIT — the drawer behind the list's Edit action, with the live screen's two
 * tabs: Template and Seo. It is the same drawer for a new page and for an
 * existing one, because the fields are the same either way.
 *
 * WHY SAVE VALIDATES, AND ONLY SOMETIMES.
 *
 * The live screen has one action and a Status field, so Save is the only place
 * a rule can live. It follows the Status:
 *
 *   Inactive   Save stores whatever is on screen. Nothing is required. That is
 *              the whole point of Inactive — set a mapping up, come back later.
 *   Active     Save runs every rule, because Active means a patient can open
 *              the page. A refusal names the tab that fixes it.
 */
export function PageEditDrawer({
    open, isNew, plan, protocol, gaps, showErrors, dirty, tab,
    onTab, onChange, onSave, onClose,
}: {
    open: boolean
    isNew: boolean
    plan: ProtocolPlan
    protocol: Protocol | null
    gaps: PlanGap[]
    showErrors: boolean
    dirty: boolean
    tab: string
    onTab: (v: string) => void
    onChange: (patch: Partial<ProtocolPlan>) => void
    onSave: () => void
    onClose: () => void
}) {
    const blocking = plan.status === "published" ? gaps : draftGaps(gaps)

    return (
        <Sheet open={open} onOpenChange={o => { if (!o) onClose() }}>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
                <SheetHeader className="flex-row items-center justify-between gap-3 border-b px-5 py-4">
                    <SheetTitle className="text-base">
                        {isNew ? "Add New Page" : (plan.pageName || "Edit page")}
                        {dirty && (
                            <Badge variant="outline"
                                className="ml-2 border-amber-200 bg-amber-50 text-[10px] text-amber-700">
                                not saved
                            </Badge>
                        )}
                    </SheetTitle>
                    <Button size="sm" onClick={onSave} className="mr-8">Save</Button>
                </SheetHeader>

                <Tabs value={tab} onValueChange={onTab} className="flex min-h-0 flex-1 flex-col">
                    <div className="border-b px-5 pt-3">
                        <TabsList className="w-full">
                            <TabsTrigger value="template" className="flex-1">
                                Template
                                {showErrors && blocking.some(g => g.section === "template") && (
                                    <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="seo" className="flex-1">
                                Seo
                                {showErrors && blocking.some(g => g.section === "seo") && (
                                    <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5">
                        {/* The refusals, once Save has been pressed and turned down. */}
                        {showErrors && blocking.length > 0 && (
                            <div className="mb-5 space-y-2 rounded-md border border-amber-200 bg-amber-50/60 p-3">
                                <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
                                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                                    {plan.status === "published"
                                        ? "This page cannot be Active yet"
                                        : "The page needs a name"}
                                </p>
                                <ul className="space-y-1 text-xs text-amber-900">
                                    {blocking.map((g, i) => (
                                        <li key={i}>
                                            <button className="text-left hover:underline"
                                                onClick={() => onTab(g.section === "seo" ? "seo" : "template")}>
                                                <b>{g.what}.</b>{" "}
                                                <span className="text-amber-800">{g.why}</span>
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                                {plan.status === "published" && (
                                    <p className="text-xs text-amber-800">
                                        Set Status to Inactive to store the work as it is.
                                    </p>
                                )}
                            </div>
                        )}

                        <TabsContent value="template" className="mt-0">
                            <TemplateTab plan={plan} protocol={protocol}
                                showErrors={showErrors} onChange={onChange} />
                        </TabsContent>

                        <TabsContent value="seo" className="mt-0">
                            <SeoTab plan={plan} showErrors={showErrors} onChange={onChange} />
                        </TabsContent>
                    </div>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}
