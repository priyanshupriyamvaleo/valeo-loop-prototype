"use client"

import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SEO_FOLDERS, SEO_HANDLING, SITE_ROOT, folderOf, planUrl, toSlug } from "@/lib/protocol-plans"
import { PlanField, FieldRow } from "./fields"
import type { PlanSeoFolder, PlanSeoHandling, ProtocolPlan } from "@/types"

/**
 * SEO — the second tab of the drawer. English on the left, Arabic on the right.
 * Index and Follow sit at the foot, as two checkboxes.
 *
 * WHAT IS NOT HERE. The live screen also carries Breadcrumb Text, Alt Image
 * Tag, Keywords and Canonical Url. A protocol page fills none of them: the
 * breadcrumb repeats the page name, the artwork comes from the widget that
 * holds it, keywords are read by no search engine, and a canonical url only has
 * a use when a second page carries the same content. They were dropped rather
 * than left empty, because an empty field asks an author a question that has no
 * answer.
 *
 * The one addition is the resolved url, printed under the slug. A slug, a
 * folder and a site root that never appear together are three fields nobody
 * can check.
 */
export function SeoTab({
    plan, showErrors, onChange,
}: {
    plan: ProtocolPlan
    showErrors: boolean
    onChange: (patch: Partial<ProtocolPlan>) => void
}) {
    const bad = (v?: string) => (showErrors && !v?.trim() ? "border-destructive" : "")
    const folder = folderOf(plan)

    return (
        <div className="space-y-5">
            <PlanField label="Seo Url" required>
                <div className="flex items-center gap-0">
                    <span className="rounded-l-md border border-r-0 bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                        {SITE_ROOT}{folder.path}
                    </span>
                    <Input value={plan.slug ?? ""}
                        placeholder="weight-loss-glp1-programme"
                        className={`rounded-l-none font-mono text-sm ${bad(plan.slug)}`}
                        onChange={e => onChange({ slug: toSlug(e.target.value) })} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                    The patient opens <code className="font-mono">{planUrl(plan)}</code>
                </p>
            </PlanField>

            <FieldRow>
                {/* The folder reads from `folder`, not from `plan.seoFolder`. A plan
                    saved under the old "programs" value would otherwise show a blank
                    trigger, because that value is no longer an option. */}
                <PlanField label="SEO Folder">
                    <Select value={folder.id}
                        onValueChange={v => onChange({ seoFolder: v as PlanSeoFolder })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {SEO_FOLDERS.map(f => (
                                <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </PlanField>
                <PlanField label="SEO Handling" required
                    hint="Country is the normal case: one page per market.">
                    <Select value={plan.seoHandling ?? "country"}
                        onValueChange={v => onChange({ seoHandling: v as PlanSeoHandling })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {SEO_HANDLING.map(h => (
                                <SelectItem key={h.id} value={h.id}>{h.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </PlanField>
            </FieldRow>

            <FieldRow>
                <PlanField label="Meta Title" required
                    hint={`${(plan.seoTitleEn ?? "").length} characters. Search shows about 60.`}>
                    <Input value={plan.seoTitleEn ?? ""}
                        placeholder="Doctor-led GLP-1 weight loss in the UAE | Valeo"
                        className={bad(plan.seoTitleEn)}
                        onChange={e => onChange({ seoTitleEn: e.target.value })} />
                </PlanField>
                <PlanField label="Meta Title Arabic" required>
                    <Input dir="rtl" value={plan.seoTitleAr ?? ""}
                        className={bad(plan.seoTitleAr)}
                        onChange={e => onChange({ seoTitleAr: e.target.value })} />
                </PlanField>
            </FieldRow>

            <FieldRow>
                <PlanField label="Meta Description" required
                    hint={`${(plan.seoDescriptionEn ?? "").length} characters. Search shows about 155.`}>
                    <Textarea rows={3} value={plan.seoDescriptionEn ?? ""}
                        placeholder="A clinician builds your plan from your own blood work."
                        className={bad(plan.seoDescriptionEn)}
                        onChange={e => onChange({ seoDescriptionEn: e.target.value })} />
                </PlanField>
                <PlanField label="Meta Description Arabic" required>
                    <Textarea rows={3} dir="rtl" value={plan.seoDescriptionAr ?? ""}
                        className={bad(plan.seoDescriptionAr)}
                        onChange={e => onChange({ seoDescriptionAr: e.target.value })} />
                </PlanField>
            </FieldRow>

            <div className="flex flex-wrap gap-x-10 gap-y-3 border-t pt-4">
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={plan.isIndexable ?? true}
                        onCheckedChange={v => onChange({ isIndexable: !!v })} />
                    Index
                </label>
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={plan.isFollowable ?? true}
                        onCheckedChange={v => onChange({ isFollowable: !!v })} />
                    Follow
                </label>
                <p className="text-xs text-muted-foreground">
                    Turn Index off where the programme is not sold. It stops a dead page
                    reaching search.
                </p>
            </div>
        </div>
    )
}
