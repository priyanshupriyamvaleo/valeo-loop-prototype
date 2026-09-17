"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { AlertCircle, ArrowLeft, Save, Send } from "lucide-react"
import { ApiService } from "@/services/api"
import { MONEY, resolveComposition } from "@/lib/composition"
import { emptyPlan, planStore, useHydrated, usePlan } from "@/lib/protocol-plans"
import {
    buildPackageFromSteps, emptyPackage, packagePublishGaps, unlinkedSteps,
} from "@/lib/protocol-package"
import { ALL_PATHS, pathsOf, resolveProtocol } from "@/lib/protocol-chain"
import { DEMO_CITIES, DEMO_LISTINGS } from "@/lib/package-demo-catalogue"
import { PackageSheet } from "@/components/protocol/plan/PackageSheet"
import { PackageCountries, PackageCities } from "@/components/protocol/plan/PackageMarkets"
import { PackageDiscount } from "@/components/protocol/plan/PackageDiscount"
import type {
    City, Composition, CompositionScope,
    Country, Listing, Protocol, SubDepartment,
} from "@/types"

/**
 * The markets a package may be sold in.
 *
 * "OTHERS" is deliberately absent: MONEY["OTHERS"].code is "—", so a scope row
 * there would be money with no currency.
 *
 * THERE IS NO LIVE_COUNTRY OR LIVE_CITY ANY MORE. The screen used to hardcode
 * UAE and Dubai and render every other market disabled behind "Not selling here
 * yet", which made opening a city a code change and made its gaps discoverable
 * only one cell at a time. Where a package sells is authored now, in the
 * markets panel, and read down the sheet.
 */
const COUNTRIES: Country[] = ["UAE", "KSA", "QATAR", "KUWAIT"]

/**
 * PACKAGE BUILDER — what a patient buys.
 *
 * THE PACKAGE IS A COMPOSITION. Every number on this screen comes from
 * `resolveComposition()`, which is the catalogue's own pricer: it gates on
 * availability, reads each unit's price after that unit's own discount,
 * multiplies by the quantity, drops optional members that are not sold here,
 * applies the rule, and rounds in the market's own minor units. Nothing here
 * re-implements any of that.
 *
 * ONE MARKET AT A TIME. Every pricing surface in this repo works that way, and
 * deliberately: a four-country by many-city grid is how the legacy
 * `package_cities` table reached 698 rows nobody maintained.
 *
 * SAVE AND STATUS, NOT PUBLISH. A Composition carries the catalogue's
 * ProductStatus, so Active is the live state and Save is the moment the rules
 * run — the same shape as the pages list.
 */
export default function PackageBuilderPage() {
    const params = useParams()
    const protocolId = typeof params.id === "string" ? params.id : ""

    const hydrated = useHydrated()
    const stored = usePlan(protocolId)

    const [protocol, setProtocol] = useState<Protocol | null>(null)
    const [serviceListings, setServiceListings] = useState<Listing[]>([])
    const [serviceCities, setServiceCities] = useState<City[]>([])
    const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([])
    const [loading, setLoading] = useState(true)

    const [country, setCountry] = useState<Country>("UAE")
    const [cityId, setCityId] = useState<string>("")
    const [showErrors, setShowErrors] = useState(false)
    /** Which path is priced. A protocol with no axis has exactly one. */
    const [pathId, setPathId] = useState<string>(ALL_PATHS)

    /**
     * Unsaved work, KEYED BY PATH.
     *
     * One state per path rather than one state plus an effect that clears it:
     * switching the path then shows that path's own edits with no reset to
     * write, and a half-priced female package is not lost by looking at the
     * male one. An absent key means the screen shows exactly what the store
     * holds.
     */
    const [editsByPath, setEditsByPath] = useState<Record<string, Composition>>({})
    const [providerEdit, setProviderEdit] = useState<string | null>(null)

    useEffect(() => {
        ApiService.catalogue.protocols()
            .then(list => setProtocol(list.find(p => p.id === protocolId) ?? null))
            .catch(() => setProtocol(null))
            .finally(() => setLoading(false))
        /* Both reach the real content service, which answers 401 without a
           session. Caught on their own, so neither blanks the screen. */
        ApiService.catalogue.listings().then(setServiceListings).catch(() => setServiceListings([]))
        ApiService.catalogue.cities().then(setServiceCities).catch(() => setServiceCities([]))
        ApiService.catalogue.subDepartments().then(setSubDepartments).catch(() => setSubDepartments([]))
    }, [protocolId])

    /**
     * The catalogue this screen prices against.
     *
     * `listings()` is a REAL call and it returns list rows with no prices, so
     * offline every unit price is undefined. The snapshot fills that in, and
     * every line says which source it came from. `listings()` itself is never
     * given a fallback — that rule protects real product ids from invented ones.
     */
    const listings = useMemo(() => [...serviceListings, ...DEMO_LISTINGS], [serviceListings])
    const cities = useMemo(
        () => (serviceCities.length ? serviceCities : DEMO_CITIES),
        [serviceCities])

    /**
     * ONE PATH, AS AN ORDINARY PROTOCOL. Every screen downstream of the Step
     * Builder calls the resolver and then works on a plain linear protocol —
     * that is the whole reason one axis costs nothing here.
     */
    const paths = useMemo(() => (protocol ? pathsOf(protocol) : []), [protocol])
    const path = paths.find(p => p.id === pathId) ?? paths[0]
    const resolved = useMemo(
        () => (protocol ? resolveProtocol(protocol, path?.id) : null),
        [protocol, path?.id])

    const key = path?.id ?? ALL_PATHS
    const edits = editsByPath[key] ?? null
    /**
     * ONE RULE. A percentage off what the items come to, which is the lever a
     * category manager has. It is coerced rather than picked, because a stored
     * package on any other rule would show a percentage box that changed
     * nothing — the scope row it reads would be the wrong field.
     */
    const raw = edits ?? stored?.packages?.[key]
        ?? (protocol ? emptyPackage(protocol, paths.length > 1 ? path?.label : undefined) : undefined)
    /* Memoised: the coercion returns a NEW object, and an unmemoised one would
       make every price recompute on every render. */
    const pkg = useMemo(() => {
        if (!raw) return raw
        const kind = "percent_off_members" as const
        /* A CITY PERCENT IS DEAD DATA NOW.
           The discount is one number for the whole package, so a stored
           per-city override has no control anywhere on the screen — and
           resolveComposition would still read it, quietly discounting Abu
           Dhabi by an old 10% while the field above says 15. It is stripped
           on the way in, so what is shown is what is stored on the next Save. */
        const stale = raw.scopes.some(sc => sc.cityId && sc.percent !== undefined)
        if (raw.rule.kind === kind && !stale) return raw
        return {
            ...raw,
            rule: { ...raw.rule, kind },
            scopes: stale
                ? raw.scopes.map(sc => (sc.cityId ? { ...sc, percent: undefined } : sc))
                : raw.scopes,
        }
    }, [raw])
    const dirty = edits !== null || providerEdit !== null
    const providerLine = providerEdit ?? stored?.providerLine ?? ""

    const setEdits = (next: Composition) =>
        setEditsByPath(prev => ({ ...prev, [key]: next }))
    const clearEdits = (k: string) =>
        setEditsByPath(prev => { const n = { ...prev }; delete n[k]; return n })

    /**
     * The markets the sheet may show. A country with no row sells nowhere, so
     * it is not a tab — the tab strip is read from the package, never from the
     * list of countries the business could theoretically serve.
     */
    const soldIn = COUNTRIES.filter(c => pkg?.scopes.some(sc => sc.country === c && !sc.cityId))
    /* A package that sells only in KSA must not open on an empty UAE. The
       selected country is honoured while it is a market and falls back to the
       first one that is. */
    const shown = soldIn.includes(country) ? country : (soldIn[0] ?? country)

    const resolution = useMemo(
        () => (pkg
            ? resolveComposition(pkg, listings, shown, { cityId: cityId || undefined })
            : undefined),
        [pkg, listings, shown, cityId])

    const gaps = useMemo(
        () => (pkg && resolved
            ? packagePublishGaps(pkg, resolved, listings, subDepartments, COUNTRIES,
                id => cities.find(c => c.id === id)?.name)
            : []),
        [pkg, resolved, listings, subDepartments, cities])

    const update = (patch: Partial<Composition>) => setEdits({ ...pkg!, ...patch })


    /**
     * ONE DISCOUNT FOR THE WHOLE PACKAGE.
     *
     * The percent is stored per scope row, because that is what
     * `resolveComposition` reads. So "overall" is written rather than modelled:
     * the same number goes on EVERY country row, and every city row's own
     * percent is cleared so none of them can quietly override it. A retired
     * country keeps the number, so restoring a market does not restore it at
     * full price.
     *
     * Read back from the country row of the market on screen. Any of them
     * would answer the same, because the write keeps them in step.
     */
    const overallPercent = pkg?.scopes.find(sc => sc.country === shown && !sc.cityId)?.percent
        ?? pkg?.scopes.find(sc => !sc.cityId)?.percent

    const setOverallPercent = (percent?: number) => {
        if (!pkg) return
        /* A stored 0 reads as falsy in resolveComposition and yields NO PRICE
           rather than no discount, so zero clears the field instead. */
        const p = percent !== undefined && percent > 0 ? Math.min(100, percent) : undefined
        update({
            scopes: pkg.scopes.map(sc => (sc.cityId
                ? { ...sc, percent: undefined }
                : { ...sc, percent: p })),
        })
    }

    const persist = (next: Composition, provider?: string) => {
        const base = stored ?? emptyPlan()
        planStore.save(protocolId, {
            ...base,
            packages: { ...(base.packages ?? {}), [key]: next },
            providerLine: provider ?? providerLine,
        })
        clearEdits(key)
        setProviderEdit(null)
    }

    const save = () => {
        if (!pkg || !protocol) return
        setShowErrors(true)
        /* Draft stores anything except an empty package: a package with no
           items has nothing to price, so there is nothing to come back to. */
        const blocking = pkg.status === "active" ? gaps : gaps.filter(g => g.blocksDraft)
        if (blocking.length) {
            toast.error(
                blocking.length === 1 ? blocking[0].what : `${blocking.length} things are missing`,
                {
                    description: pkg.status === "active"
                        ? "An Active package has to pass every rule."
                        : "Build the package from the steps first.",
                },
            )
            return
        }
        persist(pkg)
        toast.success("Saved.", {
            description: pkg.status === "active"
                ? "The package is Active. It is what a patient buys."
                : "The package is Inactive, and the work is stored.",
        })
    }

    /**
     * EVERY PATH IN ONE PRESS.
     *
     * An author who builds the male path and forgets the female one ships a
     * package that bills a man's panel to a woman. So this builds them all,
     * saves the ones that are not on screen, and leaves the one that is as an
     * unsaved edit so the author can still price it before storing.
     */
    const buildFromSteps = () => {
        if (!pkg || !protocol) return
        const base = stored ?? emptyPlan()
        const built: Record<string, Composition> = { ...(base.packages ?? {}) }

        paths.forEach(pp => {
            const rp = resolveProtocol(protocol, pp.id)
            const start = pp.id === key
                ? pkg
                : built[pp.id] ?? emptyPackage(protocol, paths.length > 1 ? pp.label : undefined)
            built[pp.id] = buildPackageFromSteps(start, rp)
        })

        /* The other paths go straight to the store; this one stays on screen. */
        const others = { ...built }
        delete others[key]
        if (Object.keys(others).length) {
            planStore.save(protocolId, {
                ...base,
                packages: { ...(base.packages ?? {}), ...others },
            })
        }
        setEdits(built[key])

        const skipped = unlinkedSteps(resolved?.steps ?? []).length
        toast.success(
            paths.length > 1
                ? `${paths.length} paths built from ${protocol.steps.length} steps.`
                : `${built[key].members.length} item${built[key].members.length === 1 ? "" : "s"} from ${protocol.steps.length} steps.`,
            {
                description: skipped
                    ? `${skipped} step${skipped === 1 ? "" : "s"} link no catalogue item, so they add no line.`
                    : "Every step links a catalogue item.",
            },
        )
    }

    if (loading || !hydrated) {
        return <div className="py-16 text-center text-sm text-muted-foreground">Loading…</div>
    }

    if (!protocol || !resolved || !pkg || !resolution) {
        return (
            <div className="py-16 text-center">
                <p className="text-sm font-medium">That protocol is not in the catalogue</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                    <Link href="/catalogue/protocols">Back to protocols</Link>
                </Button>
            </div>
        )
    }

    const live = pkg.status === "active"
    const money = MONEY[country]

    return (
        <div className="space-y-5">
            {/* ══ HEADER ══ */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
                <div className="min-w-0">
                    <Button variant="ghost" size="sm" className="-ml-2 mb-1 h-7 text-muted-foreground" asChild>
                        <Link href={`/catalogue/protocols/${protocolId}/plan`}>
                            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                            {protocol.nameEn} · Plan Builder
                        </Link>
                    </Button>
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">Package Builder</h2>
                        <Badge variant="outline" className={live
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"}>
                            {live ? "Active" : "Inactive"}
                        </Badge>
                        {dirty && (
                            <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                not saved
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {paths.length > 1 && <>{path?.label} · </>}
                        {pkg.members.length} item{pkg.members.length === 1 ? "" : "s"} ·{" "}
                        {resolution.total === undefined
                            ? `no ${country} price yet`
                            : `${money.code} ${resolution.total.toLocaleString(undefined, {
                                minimumFractionDigits: Math.abs(resolution.total % 1) < 1e-9 ? 0 : money.minorUnits,
                                maximumFractionDigits: money.minorUnits,
                            })} in ${cities.find(c => c.id === cityId)?.name ?? country}`}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={pkg.status}
                        onValueChange={v => update({ status: v as Composition["status"] })}>
                        <SelectTrigger className="h-9 w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button size="sm" onClick={save}>
                        {live
                            ? <><Send className="mr-2 h-3.5 w-3.5" /> Save</>
                            : <><Save className="mr-2 h-3.5 w-3.5" /> Save</>}
                    </Button>
                </div>
            </div>

            {/* The refusals, once Save has been pressed and turned down. */}
            {showErrors && gaps.length > 0 && (
                <Card className="space-y-2 border-amber-200 bg-amber-50/60 p-4">
                    <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
                        <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                        {live
                            ? "This package cannot be Active yet"
                            : "The package is not ready"}
                    </p>
                    <ul className="space-y-1 text-xs text-amber-900">
                        {gaps.map((g, i) => (
                            <li key={i}><b>{g.what}.</b> <span className="text-amber-800">{g.why}</span></li>
                        ))}
                    </ul>
                    {live && (
                        <p className="text-xs text-amber-800">
                            Set the status to Inactive to store the work as it is.
                        </p>
                    )}
                </Card>
            )}

            {/* ══ PATH, MARKET, CITY ══ */}
            {paths.length > 1 && (
                <div className="space-y-1.5">
                    <Label className="text-xs">Path</Label>
                    <div className="inline-flex rounded-md border p-0.5">
                        {paths.map(pp => (
                            <Button key={pp.id}
                                variant={pp.id === key ? "secondary" : "ghost"}
                                size="sm" className="h-7 px-3 text-xs"
                                onClick={() => setPathId(pp.id)}>
                                {pp.label}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* ══ WHERE IT SELLS, THEN WHAT IT COSTS ══

                Four sections and no more. The screen used to carry an
                invoicing-entity panel, an audience picker, a live window, a
                split strategy and a full VAT invoice table as well. Those say
                how a sale is BOOKED. This screen answers what a package costs
                and where, and the extra furniture made that question twice as
                far down the page as it needed to be. ══ */}

            <PackageCountries
                pkg={pkg}
                onChange={(scopes: CompositionScope[]) => update({ scopes })} />

            <PackageCities
                pkg={pkg}
                cities={cities}
                onChange={(scopes: CompositionScope[]) => update({ scopes })} />

            <PackageSheet
                pkg={pkg}
                protocol={resolved!}
                listings={listings}
                cities={cities}
                country={shown}
                countries={soldIn}
                onCountry={c => { setCountry(c); setCityId("") }}
                selected={cityId || undefined}
                onSelect={c => setCityId(c ?? "")}
                onChange={next => setEdits(next)}
                onBuildFromSteps={buildFromSteps}
                overallPercent={overallPercent}
            />

            <PackageDiscount
                country={shown}
                where={cities.find(c => c.id === cityId)?.name ?? shown}
                percent={overallPercent}
                onPercent={setOverallPercent}
                resolution={resolution}
            />
        </div>
    )
}
