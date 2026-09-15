"use client"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { MapPin, AlertTriangle } from "lucide-react"
import { City, Country, ProductCityConfig } from "@/types"

/**
 * ── City Availability & Booking ───────────────────────────────────────────────
 *
 * `product_city_config`, at PRODUCT grain. D-C48 (2026-08-17) removed this table's
 * `variant_id` and the reason is the whole shape of this screen:
 *
 *   "This table only ever carried `status` — and since D-C29 a variant is sellable in a
 *    city ONLY if a product_pricing row exists for (variant, city) — so 'FT sells in 4
 *    cities where STD sells in 6' is expressed by simply NOT writing those price rows.
 *    The variant-scoped status row said the same thing twice."
 *
 * So there is NO variant dimension here, deliberately. Two different questions:
 *   · is this PRODUCT offered in this city at all?      -> this screen
 *   · is this VARIANT sellable in this city?            -> its price row exists, or not
 *
 * `is_customer_slot_book_enabled` (D-C62) lives here and NOWHERE else — not on
 * product_master, not on product_variants, not on product_country_config. Six candidate
 * homes were rejected; the deciding evidence was about DEFAULTS, not grain.
 */

interface Props {
    rows: ProductCityConfig[]
    /** Countries from Country Availability & Config — a city is only offerable inside one. */
    countries: Country[]
    cities: City[]
    /** The write-time default for the slot flag, from the sub-department (D-C62 §4). */
    slotDefault: boolean
    onChange: (rows: ProductCityConfig[]) => void
    onGoToCountries?: () => void
}

export function CityAvailability({
    rows, countries, cities, slotDefault, onChange, onGoToCountries,
}: Props) {
    const rowFor = (cityId: string) => rows.find(r => r.cityId === cityId)

    /**
     * Creating the row is what stamps the slot default (D-C62 §4) — the value is
     * authoritative from that moment and an editor overrides it per city. It is never
     * re-read from the sub-department afterwards, so changing the sub-department later
     * cannot silently rewrite decisions already made.
     */
    const setRow = (cityId: string, patch: Partial<ProductCityConfig>) => {
        const existing = rowFor(cityId)
        onChange(existing
            ? rows.map(r => (r.cityId === cityId ? { ...r, ...patch } : r))
            : [...rows, {
                cityId,
                status: "inactive",
                isCustomerSlotBookEnabled: slotDefault,
                ...patch,
            }])
    }

    const clearRow = (cityId: string) => onChange(rows.filter(r => r.cityId !== cityId))

    if (countries.length === 0) {
        return (
            <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50/60 p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div className="flex-1">
                    <p className="text-xs font-semibold text-amber-900">No countries configured.</p>
                    <p className="mt-0.5 text-[11px] text-amber-900">
                        A city belongs to a country, and no row in Country Availability means the
                        listing is not sold in that market — so none of its cities can be
                        offered either.
                    </p>
                </div>
                {onGoToCountries && (
                    <Button size="sm" variant="outline" className="h-7 shrink-0 text-xs" onClick={onGoToCountries}>
                        Add a country
                    </Button>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {countries.map(country => {
                const list = cities.filter(c => c.country === country)
                const active = list.filter(c => rowFor(c.id)?.status === "active").length
                return (
                    <div key={country} className="rounded-lg border">
                        <div className="flex items-center gap-2 border-b bg-muted/20 px-3 py-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold">{country}</span>
                            <span className="ml-auto text-[11px] text-muted-foreground">
                                {list.length === 0
                                    ? "no cities on record"
                                    : `${active} of ${list.length} cities offered`}
                            </span>
                        </div>

                        {list.length === 0 ? (
                            <p className="p-3 text-[11px] italic text-muted-foreground">
                                No cities on record for {country}.
                            </p>
                        ) : (
                            <div className="divide-y">
                                {list.map(city => {
                                    const row = rowFor(city.id)
                                    const on = row?.status === "active"
                                    // labslot_city.is_active = 0 — switched off market-wide. Not this
                                    // product's decision and not editable here (Qassim, 1 of 34).
                                    const cityOff = city.isActive === false
                                    return (
                                        <div key={city.id} className="flex items-center gap-3 px-3 py-2">
                                            <div className="w-44 shrink-0">
                                                <span className="text-xs font-medium">{city.name}</span>
                                                {cityOff && (
                                                    <Badge variant="outline" className="ml-1.5 border-amber-200 bg-amber-50 text-[9px] text-amber-700">
                                                        city inactive
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <Switch
                                                    checked={on}
                                                    disabled={cityOff}
                                                    onCheckedChange={v => {
                                                        // Turning it off DELETES the row: absence is the answer
                                                        // (D-C29), and an INACTIVE row that lingers is a second
                                                        // way to say the same thing.
                                                        if (v) setRow(city.id, { status: "active" })
                                                        else clearRow(city.id)
                                                    }} />
                                                {/* Fixed width so the slot control below lines up in a
                                                    column across rows instead of shifting with the label. */}
                                                <span className={`w-20 text-[11px] ${on ? "text-foreground" : "text-muted-foreground"}`}>
                                                    {cityOff ? "unavailable" : on ? "offered" : "not offered"}
                                                </span>
                                            </div>

                                            {/* The slot flag only means anything where the product is offered.
                                                Kept adjacent to the status toggle rather than pushed right with
                                                ml-auto — on a wide screen that put the two controls for one city
                                                a thousand pixels apart. */}
                                            {on && (
                                                <div className="flex items-center gap-2 border-l pl-3">
                                                    <Switch
                                                        checked={!!row?.isCustomerSlotBookEnabled}
                                                        onCheckedChange={v => setRow(city.id, { isCustomerSlotBookEnabled: v })} />
                                                    <span className="text-[11px] text-muted-foreground">
                                                        {row?.isCustomerSlotBookEnabled
                                                            ? "customer picks the slot"
                                                            : "ops schedules"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )
            })}

            <div className="rounded-md border bg-muted/10 p-3 text-[11px] text-muted-foreground">
                <p>
                    <strong>This screen is per PRODUCT, not per variant.</strong> Whether a specific
                    variant is sellable in a city is answered by whether it has a price row there —
                    set in Pricing &amp; Availability. Turning a city off here removes
                    the row entirely; there is no lingering INACTIVE state.
                </p>
                <p className="mt-1.5">
                    Slot booking is stamped from the sub-department when a city is first offered
                    (<strong>{slotDefault ? "customer picks" : "ops schedules"}</strong> for this
                    sub-department) and overridden per city. Treat it as{" "}
                    <strong>permission, not promise</strong> — the booking service still has to
                    return real slots before a picker is shown.
                </p>
            </div>
        </div>
    )
}
