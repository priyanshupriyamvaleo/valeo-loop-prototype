"use client"

import { Country } from "@/types"

/**
 * Diagnostics config is deep — biomarkers, service options, pricing, slots, city
 * overrides. Showing every country at once made these sections unreadable, so
 * country becomes the frame and only one is edited at a time.
 */
export function CountrySwitcher({ countries, value, onChange, counts }: {
    countries: Country[]
    value: Country
    onChange: (c: Country) => void
    /** Optional per-country badge, e.g. how many biomarkers are mapped. */
    counts?: Partial<Record<Country, string | number>>
}) {
    return (
        <div className="flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/20 p-1.5">
            <span className="px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Country
            </span>
            {countries.map(c => {
                const on = c === value
                return (
                    <button key={c} type="button" onClick={() => onChange(c)}
                        aria-pressed={on}
                        className={`flex items-center gap-1.5 rounded px-2.5 py-1 text-xs transition-colors ${on
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-background hover:text-foreground"}`}>
                        {c}
                        {counts?.[c] !== undefined && (
                            <span className={`rounded-full px-1.5 text-[10px] ${on ? "bg-primary-foreground/20" : "bg-muted"}`}>
                                {counts[c]}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
