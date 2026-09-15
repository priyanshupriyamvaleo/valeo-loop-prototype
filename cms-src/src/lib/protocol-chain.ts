// ── The chain: order, dependency, and one variant axis ───────
//
// THERE IS NO TIME IN HERE. Not a week, not a day, not a cadence. A patient
// starts when they buy and every step takes as long as it takes, so a step
// that names a week is wrong for almost everybody who reads it.
//
// What replaces it:
//
//   THE ORDER IS THE DEPENDENCY   step N unlocks when step N−1 is done, and
//                                 that needs no field at all.
//   PRODUCES AND REQUIRES         two facts per step, drawn from one closed
//                                 vocabulary, so the order can be CHECKED.
//   ONE AXIS                      the sequence is authored once and resolved
//                                 into a path per value.
//
// The resolver is the load-carrying idea: every screen downstream calls it
// first and then works on an ordinary linear protocol. Nothing but the Step
// Builder ever learns that variants exist.

import type {
    Listing, PricedUnitRef, Protocol, ProtocolActor, ProtocolOutput, ProtocolStep,
    ProtocolVariantAttribute,
} from "@/types"

// ── Vocabularies, with the words an author reads ─────────────

export const ACTORS: { id: ProtocolActor; label: string; blurb: string }[] = [
    { id: "patient", label: "The patient", blurb: "They do it themselves, wherever they are." },
    { id: "nurse", label: "A nurse", blurb: "A home visit. Somebody travels to them." },
    { id: "doctor", label: "A doctor", blurb: "A clinician. It carries clinical responsibility." },
    { id: "lab", label: "The lab", blurb: "The laboratory runs it. Nobody can hurry it." },
    { id: "coach", label: "A coach", blurb: "A health coach or the concierge team." },
    { id: "ops", label: "Operations", blurb: "Pharmacy, logistics, scheduling." },
    { id: "system", label: "Automatic", blurb: "Nobody touches it. The system does it." },
]

/**
 * One vocabulary, produced by some steps and required by others.
 *
 * `article` and `needs` exist so the chain reads as a sentence rather than as
 * a set of enum values: "needs a report", "produces an assessment".
 */
export const OUTPUTS: {
    id: ProtocolOutput; produces: string; needs: string; blurb: string
}[] = [
    { id: "booking", produces: "a booking", needs: "a booking", blurb: "A visit is on the calendar." },
    { id: "sample", produces: "a sample", needs: "a sample", blurb: "A specimen has been collected." },
    { id: "report", produces: "a report", needs: "a report", blurb: "Results exist and can be read." },
    { id: "assessment", produces: "an assessment", needs: "an assessment", blurb: "A clinician has read something and decided." },
    { id: "prescription", produces: "a prescription", needs: "a prescription", blurb: "An Rx exists." },
    { id: "delivery", produces: "a delivery", needs: "a delivery", blurb: "Goods have reached the patient." },
]

export const actorLabel = (a: ProtocolActor) =>
    ACTORS.find(x => x.id === a)?.label ?? a
export const producesLabel = (o: ProtocolOutput) =>
    OUTPUTS.find(x => x.id === o)?.produces ?? o
export const needsLabel = (o: ProtocolOutput) =>
    OUTPUTS.find(x => x.id === o)?.needs ?? o

// ── The variant axis ────────────────────────────────────────
//
// A CLOSED LIST, because the axis has to be matched to something the system
// already knows about a patient. A free-text axis would look identical in the
// builder and leave somebody choosing the path by hand on every order.

export const VARIANT_ATTRIBUTES: {
    id: ProtocolVariantAttribute
    label: string
    /** The key the onboarding chat sends this fact under. */
    signalKey: string
    values: { id: string; label: string }[]
}[] = [
    {
        id: "sex", label: "Sex", signalKey: "sex",
        values: [
            { id: "male", label: "Male" },
            { id: "female", label: "Female" },
        ],
    },
]

export const attributeOf = (a: ProtocolVariantAttribute) =>
    VARIANT_ATTRIBUTES.find(x => x.id === a)

/** The paths a protocol has. A protocol with no axis has exactly one. */
export const ALL_PATHS = "all"

export interface ProtocolPath {
    /** The key a package is stored under. */
    id: string
    label: string
}

export function pathsOf(p: Protocol): ProtocolPath[] {
    if (!p.variantAxis) return [{ id: ALL_PATHS, label: "Everybody" }]
    const attr = attributeOf(p.variantAxis.attribute)
    return p.variantAxis.values.map(v => ({
        id: v,
        label: attr?.values.find(x => x.id === v)?.label ?? v,
    }))
}

// ── The resolver ────────────────────────────────────────────

/** The unit a step delivers on one path. The per-value override wins. */
export function unitForPath(s: ProtocolStep, pathId?: string): PricedUnitRef | undefined {
    if (pathId && pathId !== ALL_PATHS && s.unitByValue?.[pathId]) return s.unitByValue[pathId]
    return s.linkedUnit
}

/** Does a step run on this path? A step with no `appliesTo` runs on all of them. */
export const stepOnPath = (s: ProtocolStep, pathId?: string) =>
    !pathId || pathId === ALL_PATHS || !s.appliesTo?.length || s.appliesTo.includes(pathId)

/**
 * ONE PATH, AS AN ORDINARY PROTOCOL.
 *
 * This is the whole reason variants cost nothing downstream. The Package
 * Builder, the page, the drift check and the coach console all call this
 * first and then work on a plain linear protocol with no axis on it. A
 * protocol without an axis resolves to itself, so nothing that exists today
 * behaves differently.
 *
 * With an axis and no path named it resolves the FIRST value, because a screen
 * showing a template with branches drawn on it shows nobody's actual journey.
 */
export function resolveProtocol(p: Protocol, pathId?: string): Protocol {
    if (!p.variantAxis) {
        return { ...p, steps: [...p.steps].sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i })) }
    }
    const path = pathId && pathId !== ALL_PATHS ? pathId : p.variantAxis.values[0]

    const steps = [...p.steps]
        .sort((a, b) => a.order - b.order)
        .filter(s => stepOnPath(s, path))
        .map((s, i) => {
            const unit = unitForPath(s, path)
            const next: ProtocolStep = { ...s, order: i, linkedUnit: unit }
            /* The axis is gone from the result, so the overrides go with it. */
            delete next.unitByValue
            delete next.appliesTo
            return next
        })

    const out: Protocol = { ...p, steps }
    delete out.variantAxis
    return out
}

// ── The chain check ─────────────────────────────────────────

export interface ChainFinding {
    stepId: string
    severity: "error" | "note"
    message: string
}

/**
 * Whether each step's requirement is met by a step ABOVE it.
 *
 * ASYMMETRIC ON PURPOSE. A missing requirement is an error, because the step
 * cannot run. A step that produces something nothing requires is NOT a
 * finding: a report is worth having whether or not a later step formally
 * needs one, and warning about it would train people to ignore warnings.
 *
 * The valuable case is the third one — the thing exists, and it exists too
 * late. That is the error a linear order can catch, and it needs no dates.
 */
export function chainFindings(steps: ProtocolStep[]): ChainFinding[] {
    const out: ChainFinding[] = []
    const ordered = [...steps].sort((a, b) => a.order - b.order)

    ordered.forEach((s, i) => {
        if (!s.requires) return
        const above = ordered.slice(0, i).find(x => x.produces === s.requires)
        if (above) return

        const below = ordered.slice(i + 1).find(x => x.produces === s.requires)
        out.push({
            stepId: s.id,
            severity: "error",
            message: below
                ? `needs ${needsLabel(s.requires)}, and the only step that produces one is step ${(ordered.indexOf(below)) + 1}`
                : `needs ${needsLabel(s.requires)}, and no step produces one`,
        })
    })

    return out
}

/** The step above that satisfies a requirement, for the tick on the row. */
export function satisfiedBy(steps: ProtocolStep[], s: ProtocolStep): number | undefined {
    if (!s.requires) return undefined
    const ordered = [...steps].sort((a, b) => a.order - b.order)
    const i = ordered.findIndex(x => x.id === s.id)
    const at = ordered.slice(0, i).findIndex(x => x.produces === s.requires)
    return at === -1 ? undefined : at + 1
}

// ── Steps and the catalogue ─────────────────────────────────

/**
 * The unit a listing is bought as when nobody has picked one.
 *
 * A listing is a folder, so this has to choose: the default variant if it has
 * variants, else the first priced unit it exposes. It is used to fill the
 * picker in, never to decide money behind an author's back — the step stores
 * whichever unit is chosen, so the package builder never guesses again.
 */
export function defaultUnitOf(l: Listing): PricedUnitRef | undefined {
    const def = (l.variants ?? []).find(v => v.isDefault)
    if (def) return { listingId: l.id, kind: "variant", unitId: def.id }
    const v0 = (l.variants ?? [])[0]
    if (v0) return { listingId: l.id, kind: "variant", unitId: v0.id }
    const so = (l.diagnostics?.serviceOptions ?? [])[0]
    if (so) return { listingId: l.id, kind: "service_option", unitId: so.id }
    const pl = (l.treatments?.plans ?? [])[0]
    if (pl) return { listingId: l.id, kind: "plan", unitId: pl.id }
    return undefined
}

/** A stable key for one priced unit, for grouping and comparing. */
export const unitKey = (r: PricedUnitRef) => `${r.listingId}:${r.kind}:${r.unitId}`

export function emptyStep(order: number): ProtocolStep {
    return {
        id: `s-${Math.random().toString(36).slice(2, 9)}`,
        order,
        titleEn: "", titleAr: "",
        type: "consultation",
        actor: "patient",
        produces: undefined,
        requires: undefined,
        dosing: "", note: "",
        linkedUnit: undefined,
    }
}
