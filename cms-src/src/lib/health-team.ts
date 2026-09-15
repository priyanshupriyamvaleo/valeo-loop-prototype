import { Practitioner, REGULATOR_JURISDICTIONS, RegulatorJurisdiction } from "@/types"

/** The jurisdictions implied by the countries a practitioner operates in. */
export function jurisdictionsFor(countries: string[] = []): RegulatorJurisdiction[] {
    return REGULATOR_JURISDICTIONS.filter(j => countries.includes(j.country))
}

/**
 * A jurisdiction the profile claims to practise in but has no licence number for.
 * This is the publish gate: advertising a practitioner in Dubai without a DHA
 * number on file is the exact thing a GCC review objects to.
 */
export function missingLicences(p: Pick<Practitioner, "countries" | "licences">): RegulatorJurisdiction[] {
    const have = new Set((p.licences ?? []).filter(l => l.licenceNumber?.trim()).map(l => l.jurisdictionId))
    return jurisdictionsFor((p.countries ?? []) as string[]).filter(j => !have.has(j.id))
}

/** Licences past their expiry date — a lapsed licence is worse than a missing one. */
export function expiredLicences(p: Pick<Practitioner, "licences">): string[] {
    const today = new Date().toISOString().slice(0, 10)
    return (p.licences ?? [])
        .filter(l => l.expiresOn && l.expiresOn < today)
        .map(l => REGULATOR_JURISDICTIONS.find(j => j.id === l.jurisdictionId)?.authority ?? l.jurisdictionId)
}
