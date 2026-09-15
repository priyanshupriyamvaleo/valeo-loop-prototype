"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, MapPin } from "lucide-react"
import { CountrySwitcher } from "@/components/catalogue/CountrySwitcher"
import { panelCoverage } from "@/lib/biomarkers"
import type { Biomarker, BiomarkerPanel, Country } from "@/types"

/**
 * How a panel resolves in each market — the diagnostics across-countries view,
 * applied to a panel.
 *
 * ⚠️ WHY THIS IS NOT PER-COUNTRY MEMBERSHIP. A panel is a clinical grouping:
 * CBC is CBC in Riyadh, so there is ONE member list. What differs per market is
 * which of those members is actually offered there — and that difference is
 * real, not hypothetical: the master splits 296 UAE-only / 58 KSA-only / 140
 * both. So the same panel legitimately resolves to fewer biomarkers in one
 * market than another.
 *
 * Storing a member list per country would say the same thing twice and let the
 * two drift into disagreeing about what a CBC contains. Resolving one list
 * against each market's availability cannot.
 *
 * The drift badge is the diagnostics one, and it earns its place here for the
 * same reason it does there: a deliberate difference must never look like an
 * accident.
 */
const SEVERITY: Record<string, { label: string; cls: string }> = {
    none: { label: "same everywhere", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    minor: { label: "minor gap", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    moderate: { label: "moderate gap", cls: "bg-orange-100 text-orange-700 border-orange-200" },
    severe: { label: "SEVERE gap", cls: "bg-red-100 text-red-700 border-red-200" },
}

export function PanelCoverage({ panel, biomarkers, countries }: {
    panel: BiomarkerPanel
    biomarkers: Biomarker[]
    countries: Country[]
}) {
    const [active, setActive] = useState<Country | null>(countries[0] ?? null)
    const byId = useMemo(() => new Map(biomarkers.map(b => [b.id, b])), [biomarkers])

    // The maths lives in lib/biomarkers so it can be tested without a browser.
    const { perCountry, shared, differBy, severity } = useMemo(
        () => panelCoverage(panel, biomarkers, countries), [panel, biomarkers, countries])

    const shown = perCountry.find(p => p.country === active) ?? perCountry[0]
    // Never vanish. An empty panel is exactly when someone is asking "where is
    // the biomarker mapping?" — rendering nothing answers that with nothing.
    if (!panel.memberIds.length) {
        return (
            <div className="rounded-md border border-dashed p-3">
                <span className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    How this panel resolves per market
                </span>
                <p className="mt-1 text-xs text-muted-foreground">
                    Add biomarkers below and this fills in — which of them each market offers,
                    and which it does not.
                </p>
            </div>
        )
    }
    if (!shown) return null

    const name = (id: string) => byId.get(id)?.nameEn ?? id

    return (
        <div className="space-y-3 rounded-md border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    How this panel resolves per market
                </span>
                <Badge variant="outline" className={`text-[10px] ${SEVERITY[severity].cls}`}>
                    {SEVERITY[severity].label}
                </Badge>
            </div>

            <p className="text-xs text-muted-foreground">
                One member list, resolved against what each market offers. {panel.memberIds.length} member
                {panel.memberIds.length === 1 ? "" : "s"}
                {differBy > 0
                    ? <> — <strong>{shared.length}</strong> offered in every market, <strong>{differBy}</strong> not.</>
                    : <> — all offered in every market.</>}
            </p>

            {countries.length > 0 && active && (
                <CountrySwitcher countries={countries} value={active} onChange={setActive}
                    counts={Object.fromEntries(perCountry.map(p =>
                        [p.country, `${p.offered.length}/${panel.memberIds.length}`],
                    )) as Partial<Record<Country, string | number>>} />
            )}

            <div className="grid gap-2 sm:grid-cols-2">
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Offered in {shown.country} ({shown.offered.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {shown.offered.map(id => (
                            <Badge key={id} variant="outline" className="h-5 px-1.5 text-[10px]">{name(id)}</Badge>
                        ))}
                        {!shown.offered.length && (
                            <span className="text-xs text-muted-foreground">None — this panel resolves to nothing here.</span>
                        )}
                    </div>
                </div>
                <div>
                    <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Not offered ({shown.missing.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                        {shown.missing.map(id => (
                            <Badge key={id} variant="outline"
                                className="h-5 border-amber-200 bg-amber-50 px-1.5 text-[10px] text-amber-700">
                                {name(id)}
                            </Badge>
                        ))}
                        {!shown.missing.length && (
                            <span className="text-xs text-muted-foreground">All members are offered here.</span>
                        )}
                    </div>
                </div>
            </div>

            {shown.missing.length > 0 && (
                <p className="flex gap-2 rounded border-l-2 border-amber-400 bg-amber-50/60 px-2.5 py-2 text-[11px] text-amber-900">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                        A package or basket using this panel in {shown.country} gets {shown.offered.length} of
                        its {panel.memberIds.length} members. Open the market on each biomarker if that is not
                        intended — the gap is silent otherwise.
                    </span>
                </p>
            )}
        </div>
    )
}
