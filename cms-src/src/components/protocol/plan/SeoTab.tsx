"use client"

import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { SEO_FOLDERS, SEO_HANDLING, SITE_ROOT, planUrl, toSlug } from "@/lib/protocol-plans"
import { PlanField, FieldRow } from "./fields"
import type { PlanSeoFolder, PlanSeoHandling, ProtocolPlan } from "@/types"

/**
 * SEO — the second tab of the drawer, field for field and in the same order as
 * the live screen. English on the left, Arabic on the right. Index and Follow
 * sit at the foot, as two checkboxes.
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
    const folderPath = SEO_FOLDERS.find(f => f.id === (plan.seoFolder ?? "none"))?.path ?? ""

    return (
        <div className="space-y-5">
            <PlanField label="Seo Url" required>
                <div className="flex items-center gap-0">
                    <span className="rounded-l-md border border-r-0 bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                        {SITE_ROOT}{folderPath}
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
                <PlanField label="SEO Folder">
                    <Select value={plan.seoFolder ?? "none"}
                        onValueChange={v => onChange({ seoFolder: v as PlanSeoFolder })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {SEO_FOLDERS.map(f => (
                                <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </PlanField>
                <div />
            </FieldRow>

            <FieldRow>
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
                <PlanField label="Breadcrumb Text">
                    <Input value={plan.breadcrumb ?? ""} placeholder="Weight loss"
                        onChange={e => onChange({ breadcrumb: e.target.value })} />
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

            <FieldRow>
                <PlanField label="Alt Image Tag"
                    hint="What a screen reader says about the page artwork.">
                    <Input value={plan.altImageTagEn ?? ""}
                        placeholder="A doctor holding a GLP-1 pen"
                        onChange={e => onChange({ altImageTagEn: e.target.value })} />
                </PlanField>
                <PlanField label="Alt Image Tag Arabic">
                    <Input dir="rtl" value={plan.altImageTagAr ?? ""}
                        onChange={e => onChange({ altImageTagAr: e.target.value })} />
                </PlanField>
            </FieldRow>

            <FieldRow>
                <PlanField label="Keywords">
                    <Input value={plan.keywordsEn ?? ""} placeholder="glp-1, weight loss, dubai"
                        onChange={e => onChange({ keywordsEn: e.target.value })} />
                </PlanField>
                <PlanField label="Keywords Arabic">
                    <Input dir="rtl" value={plan.keywordsAr ?? ""}
                        onChange={e => onChange({ keywordsAr: e.target.value })} />
                </PlanField>
            </FieldRow>

            <PlanField label="Canonical Url"
                hint="Leave it empty unless another page is the original.">
                <Input value={plan.seoCanonicalUrl ?? ""} className="font-mono text-sm"
                    onChange={e => onChange({ seoCanonicalUrl: e.target.value })} />
            </PlanField>

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
