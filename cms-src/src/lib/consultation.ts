import {
    ConsultationConfig, CoachRole, Country, Listing, ListingCoach, Practitioner, Questionnaire,
    SubDepartment,
} from "@/types"
import { availabilityGaps, hasBookableHours } from "@/lib/availability"

/**
 * Consultation rules, derived from the three tables that define this surface:
 * coach_role_mapping, valeo_professional_details and questionnaires.
 *
 * Nothing here recomputes what the DB already stores, and nothing here invents a
 * field the schema has no home for.
 */

/** The Consultation section applies to exactly one sub-department. */
export function isConsultationSubDept(sd?: SubDepartment): boolean {
    return sd?.department === "consultations" && sd.slug === "consultation"
}

/** Who may deliver this consultation: holds the required role in coach_role_mapping. */
export function qualifiedPractitioners(
    cfg: ConsultationConfig | undefined, team: Practitioner[],
): Practitioner[] {
    const role = cfg?.requiredRole
    if (!role) return team
    return team.filter(p => (p.coachRoles ?? []).some(r => r.role === role))
}

/**
 * The follow-up package for a role comes off the PERSON, not the listing — one row
 * per (user, role). Distinct values across the mapped team is a real ops question,
 * so it is surfaced rather than averaged away.
 */
export function followUpListingsFor(
    cfg: ConsultationConfig | undefined, mapped: Practitioner[],
): { practitioner: Practitioner; listingId?: string }[] {
    const role = cfg?.requiredRole
    return mapped.map(p => ({
        practitioner: p,
        listingId: (p.coachRoles ?? []).find(r => !role || r.role === role)?.followUpListingId,
    }))
}

/** A questionnaire qualifies for a market when it is ACTIVE and scoped to it or to all. */
export function questionnairesFor(all: Questionnaire[], country: Country): Questionnaire[] {
    return all.filter(q => q.status === "ACTIVE" && (!q.country || q.country === country))
}

export function questionnaireForCountry(
    cfg: ConsultationConfig | undefined, country: Country,
): string | undefined {
    return (cfg?.questionnaires ?? []).find(q => q.country === country)?.questionnaireId
}

/**
 * What blocks a consultation listing from going live. Same shape as the diagnostics
 * and composition gap checks: each entry is a sentence an operator can act on.
 */
export function consultationGaps(
    l: Listing, team: Practitioner[], questionnaires: Questionnaire[],
): string[] {
    const g: string[] = []
    const cfg = l.consultation
    if (!cfg?.requiredRole) g.push("Pick which role delivers this consultation")
    if (!cfg?.sessionMinutes) g.push("Session length is not set — the Order Service books a slot from it")
    // Required in the legacy form, and it drives which content the PDP renders.
    if (!cfg?.consultationType) g.push("Consultation type is not set (Consultation / Program / Weight loss)")
    // Both were trapped in listing titles, so a migrated record looks complete
    // while carrying neither.
    if (!cfg?.mode) g.push("Delivery is not set — online, in clinic or at home")
    if (!cfg?.visitType) g.push("Visit type is not set — initial or follow-up")
    // A free consultation is a deliberate decision, not a blank.
    if (cfg?.isPaid === undefined) g.push("Say whether this consultation is paid or free")

    const mapped = (l.practitionerIds ?? [])
        .map(id => team.find(t => t.id === id))
        .filter((x): x is Practitioner => !!x)
    if (mapped.length === 0) g.push("No Health Team member is mapped to deliver it")

    // A mapped person who does not hold the required role cannot take the booking.
    if (cfg?.requiredRole) {
        mapped.forEach(p => {
            if (!(p.coachRoles ?? []).some(r => r.role === cfg.requiredRole)) {
                g.push(`"${p.nameEn}" is mapped but does not hold the ${cfg.requiredRole} role`)
            }
        })
    }
    // 1:1 with User Service is what makes a booking resolvable to a person at all.
    mapped.filter(p => !p.userServiceId?.trim()).forEach(p => {
        g.push(`"${p.nameEn}" has no User Service link, so a booking cannot resolve to them`)
    })

    // Availability is the difference between a listing that looks sellable and
    // one a customer can actually book. Nobody with bookable hours means every
    // slot lookup returns empty.
    if (mapped.length > 0 && !mapped.some(hasBookableHours)) {
        g.push("No mapped practitioner has bookable hours — every slot lookup will come back empty")
    }
    mapped.filter(p => !hasBookableHours(p)).forEach(p => {
        g.push(`"${p.nameEn}" has no bookable hours set`)
    })
    // A broken calendar (overlaps, lead time beyond the horizon) fails at
    // booking time, so surface it on the listing that depends on it.
    mapped.forEach(p => {
        availabilityGaps(p)
            .filter(x => !x.startsWith("No bookable hours"))
            .forEach(x => g.push(`"${p.nameEn}" — ${x}`))
    })

    // A questionnaire is required per market the listing actually sells in.
    ;(l.countryConfig ?? []).filter(c => c.status === "active").forEach(c => {
        const qid = questionnaireForCountry(cfg, c.country)
        if (!qid) {
            g.push(`${c.country}: no questionnaire mapped`)
            return
        }
        const q = questionnaires.find(x => x.id === qid)
        if (!q) { g.push(`${c.country}: mapped questionnaire no longer exists`); return }
        if (q.status !== "ACTIVE") g.push(`${c.country}: "${q.internalName}" is INACTIVE`)
        if (q.country && q.country !== c.country) {
            g.push(`${c.country}: "${q.internalName}" is scoped to ${q.country}`)
        }
    })
    return g
}

/** Information an operator should see that does not block publishing. */
export function consultationNotes(l: Listing, team: Practitioner[]): string[] {
    const out: string[] = []
    const cfg = l.consultation
    const mapped = (l.practitionerIds ?? [])
        .map(id => team.find(t => t.id === id))
        .filter((x): x is Practitioner => !!x)
    if (cfg?.followUpIncluded !== true) {
        const rows = followUpListingsFor(cfg, mapped)
        const missing = rows.filter(r => !r.listingId)
        if (missing.length > 0 && mapped.length > 0) {
            out.push(`${missing.length} of ${mapped.length} mapped members have no follow-up package on their role`)
        }
        const distinct = new Set(rows.map(r => r.listingId).filter(Boolean))
        if (distinct.size > 1) {
            out.push(`Mapped members point at ${distinct.size} different follow-up packages — the customer's depends on who they see`)
        }
    }
    return out
}

export const CONSULTATION_ROLE_LABEL: Record<CoachRole, string> = {
    DOCTOR: "Doctor",
    WEIGHTLOSS_COACH: "Weight-loss coach",
}

// ── Coaches on a listing: who leads, who is bookable, what follows ──
// A master coach package has several coaches, one lead, and a follow-up the
// customer is told about up front. Three rules, all decided rather than assumed:
//
//   1. THE PRIMARY OWNS THE TERMS. Price and the default follow-up are the
//      lead's. A package page can therefore state one follow-up.
//   2. A COACH MAY OVERRIDE THEIR OWN FOLLOW-UP, at listing level. That beats
//      their profile's CoachRoleMapping, because what is sold after a session
//      belongs to the package the customer bought, not to the person's general
//      profile — the same coach can lead one package and assist on another.
//   3. THE CUSTOMER PICKS from the bookable coaches. So `isBookable` has to be
//      real: a coach named for credibility but not taking sessions must not
//      appear in the calendar, or the page and the booking flow disagree.


/** The lead. Undefined when nobody is marked, which `coachGaps` reports. */
export function primaryCoach(coaches: ListingCoach[] | undefined): ListingCoach | undefined {
    return (coaches ?? []).find(c => c.isPrimary)
}

/** Bookable coaches, in display order — what the customer chooses from. */
export function bookableCoaches(coaches: ListingCoach[] | undefined): ListingCoach[] {
    return (coaches ?? [])
        .filter(c => c.isBookable !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
}

/** The flat list existing readers use. Derived, never authored. */
export const coachIds = (coaches: ListingCoach[] | undefined): string[] =>
    (coaches ?? []).map(c => c.practitionerId)

export interface ResolvedFollowUp {
    listingId?: string
    /** Where it came from, so the UI can say why. */
    source: "this coach" | "the primary coach" | "the coach's profile" | "none"
}

/**
 * The follow-up package a session with this coach sells.
 *
 * Order: the coach's listing-level override, then the primary's, then — only as
 * a last resort — the coach's own profile default. The profile comes last
 * deliberately: it is a general fact about the person, and a package that has
 * said nothing should inherit from its own lead rather than from whoever
 * happens to be delivering.
 */
export function resolveFollowUp(
    coach: ListingCoach,
    coaches: ListingCoach[] | undefined,
    team: Practitioner[],
    requiredRole?: string,
): ResolvedFollowUp {
    if (coach.followUpListingId) {
        return { listingId: coach.followUpListingId, source: "this coach" }
    }
    const lead = primaryCoach(coaches)
    if (lead?.followUpListingId) {
        return { listingId: lead.followUpListingId, source: "the primary coach" }
    }
    const profile = team.find(p => p.id === coach.practitionerId)
    const fromProfile = (profile?.coachRoles ?? [])
        .find(r => !requiredRole || r.role === requiredRole)?.followUpListingId
    if (fromProfile) return { listingId: fromProfile, source: "the coach's profile" }
    return { source: "none" }
}

/**
 * What is wrong with the coach setup. Blocking, not advisory — each of these
 * produces a package that cannot be delivered as described.
 */
export function coachGaps(
    coaches: ListingCoach[] | undefined,
    team: Practitioner[],
    requiredRole?: string,
): string[] {
    const list = coaches ?? []
    const gaps: string[] = []
    if (!list.length) return ["No coach is mapped, so this consultation cannot be delivered."]

    const primaries = list.filter(c => c.isPrimary)
    if (primaries.length === 0) {
        gaps.push("No primary coach. One coach must own the package's price and default follow-up.")
    } else if (primaries.length > 1) {
        gaps.push(`${primaries.length} coaches are marked primary. Exactly one can own the terms.`)
    }

    if (!bookableCoaches(list).length) {
        gaps.push("No coach is bookable, so a customer has nobody to book.")
    }

    for (const c of list) {
        const p = team.find(x => x.id === c.practitionerId)
        if (!p) { gaps.push(`A mapped coach no longer exists (${c.practitionerId}).`); continue }
        // A coach with no User Service link has no identity to attach a booking
        // to, so being bookable is a promise the system cannot keep.
        if (c.isBookable !== false && !p.userServiceId?.trim()) {
            gaps.push(`${p.nameEn} is bookable but has no User Service link, so a booking cannot be assigned.`)
        }
        if (requiredRole && !(p.coachRoles ?? []).some(r => r.role === requiredRole)) {
            gaps.push(`${p.nameEn} does not hold the ${requiredRole} role this listing requires.`)
        }
        if (resolveFollowUp(c, list, team, requiredRole).source === "none") {
            gaps.push(`${p.nameEn} has no follow-up package — set one on the primary coach, or on them.`)
        }
    }
    return gaps
}
