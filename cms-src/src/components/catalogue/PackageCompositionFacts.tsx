"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Layers, Sigma, Plus, Minus } from "lucide-react"
import { ApiService } from "@/services/api"
import type { Biomarker, BiomarkerPanel, Country } from "@/types"
import {
    expandToAnalytes, fastingHoursFor, tatHoursFor, specimensFor, tubesFor, sexRestrictionFor, tubeOf,
} from "@/lib/biomarkers"

/**
 * What a package's biomarker set implies — and what it blocks.
 *
 * Every fact below is DERIVED from the set. All of them are typed by hand today,
 * on every package, in two languages: biomarker count, fasting requirement,
 * turnaround, sex icons. Deriving them means editing one biomarker silently
 * corrects every package that contains it, instead of leaving 1,400 listings to
 * be re-checked. (The legacy count notes were wrong by up to 30 markers, which
 * is what a hand-typed derived field looks like after a few years.)
 *
 * The panel row is the other half of the mapping: a package composes biomarkers
 * OR whole panels, and choosing a panel adds its members rather than storing a
 * reference the downstream cannot expand.
 */
export function PackageCompositionFacts({ country, selectedIds, onAdd, onRemove }: {
    country: Country
    selectedIds: string[]
    onAdd: (ids: string[]) => void
    onRemove: (ids: string[]) => void
}) {
    const [master, setMaster] = useState<Biomarker[]>([])
    const [panels, setPanels] = useState<BiomarkerPanel[]>([])

    useEffect(() => {
        Promise.all([
            ApiService.catalogue.biomarkers(),
            ApiService.catalogue.biomarkerPanels(),
        ]).then(([b, p]) => { setMaster(b); setPanels(p) })
    }, [])

    const facts = useMemo(() => {
        if (!master.length) return null
        const byId = new Map(master.map(b => [b.id, b]))
        const expanded = expandToAnalytes({ biomarkerIds: selectedIds }, master, panels)
        const assayed = expanded.assayed

        // A derived value whose inputs are not in the set is unresolvable — the
        // package would advertise a ratio it has no way to compute.
        const unresolvable = selectedIds
            .map(id => byId.get(id))
            .filter((b): b is Biomarker => !!b?.isDerived)
            .map(b => ({
                nameEn: b.nameEn,
                missing: (b.inputIds ?? [])
                    .filter(i => !selectedIds.includes(i))
                    .map(i => byId.get(i)?.nameEn ?? i),
            }))
            .filter(x => x.missing.length)

        const notOffered = selectedIds
            .map(id => byId.get(id))
            .filter((b): b is Biomarker => !!b && !!b.countryAvailability && !b.countryAvailability.includes(country))
            .map(b => b.nameEn)

        return {
            count: selectedIds.length,
            derivedCount: expanded.derived.length,
            fasting: fastingHoursFor(assayed, master),
            tat: tatHoursFor(assayed, master),
            specimens: specimensFor(assayed, master),
            tubes: tubesFor(assayed, master),
            sex: sexRestrictionFor(selectedIds, master),
            unresolvable,
            notOffered,
        }
    }, [master, panels, selectedIds, country])

    if (!facts) return null

    const selected = new Set(selectedIds)

    return (
        <div className="space-y-3 rounded-md border bg-muted/20 p-3">
            {/* ── Panels: compose by grouping, not one tick at a time ── */}
            <div>
                <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    <Layers className="h-3 w-3" /> Panels
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {panels.filter(p => p.isActive).map(p => {
                        const members = p.memberIds
                        const inCount = members.filter(id => selected.has(id)).length
                        const allIn = inCount === members.length && members.length > 0
                        return (
                            <Button key={p.id} variant="outline" size="sm"
                                className={`h-7 text-[11px] ${allIn ? "border-primary bg-primary/5" : ""}`}
                                onClick={() => allIn ? onRemove(members) : onAdd(members)}>
                                {allIn ? <Minus className="mr-1 h-3 w-3" /> : <Plus className="mr-1 h-3 w-3" />}
                                {p.nameEn}
                                <span className="ml-1.5 tabular-nums text-muted-foreground">
                                    {inCount}/{members.length}
                                </span>
                            </Button>
                        )
                    })}
                </div>
            </div>

            {/* ── Derived facts ── */}
            <div>
                <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Derived from the set — none of this is typed
                </div>
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
                    <Fact k="Biomarkers" v={String(facts.count)} />
                    <Fact k="Calculated" v={facts.derivedCount ? String(facts.derivedCount) : "—"} />
                    <Fact k="Fasting" v={facts.fasting ? `${facts.fasting} h` : "none"} />
                    <Fact k="Turnaround" v={facts.tat ? `${facts.tat} h` : "—"} />
                    <Fact k="Specimens" v={facts.specimens.join(", ") || "—"} />
                    <Fact k="Sex" v={facts.sex === "any" ? "anyone"
                        : facts.sex === "conflict" ? "conflict" : facts.sex.replace("_only", " only")} />
                </div>
                {facts.tubes.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span>Tubes to carry:</span>
                        {facts.tubes.map(t => {
                            const tube = tubeOf(t)
                            return (
                                <span key={t} className="inline-flex items-center gap-1">
                                    <span className="inline-block h-2 w-2 rounded-full" style={{ background: tube?.swatch }} />
                                    {tube?.label.split(" — ")[0]}
                                </span>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* ── Gates ── */}
            {facts.sex === "conflict" && (
                <Gate>
                    This set mixes a male-only and a female-only biomarker, so no single customer can be
                    sold it. Split it into two packages.
                </Gate>
            )}
            {facts.unresolvable.map(u => (
                <Gate key={u.nameEn}>
                    <Sigma className="mr-1 inline h-3 w-3" />
                    <strong>{u.nameEn}</strong> is calculated but the set is missing {u.missing.join(", ")}.
                    The package would advertise a value it cannot compute — add the inputs or drop it.
                </Gate>
            ))}
            {facts.notOffered.length > 0 && (
                <Gate>
                    {facts.notOffered.slice(0, 3).join(", ")}
                    {facts.notOffered.length > 3 ? ` and ${facts.notOffered.length - 3} more` : ""}
                    {" "}{facts.notOffered.length === 1 ? "is" : "are"} not offered in {country}. Either
                    open the market on the biomarker or remove it here.
                </Gate>
            )}
        </div>
    )
}

const Fact = ({ k, v }: { k: string; v: string }) => (
    <div className="rounded border bg-background px-2 py-1.5">
        <span className="block text-[9px] uppercase tracking-wider text-muted-foreground">{k}</span>
        <span className="block truncate text-xs capitalize">{v}</span>
    </div>
)

const Gate = ({ children }: { children: React.ReactNode }) => (
    <p className="flex gap-2 rounded-md border-l-2 border-red-400 bg-red-50/60 px-3 py-2 text-[11px] text-red-900">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>{children}</span>
    </p>
)
