// ── Departments and sub-departments, from the content service ─────────────────
//
// GET /departments returns the whole tree in one call — DepartmentResponse nests
// its children — so both pickers fill from a single request with no chained
// loading state.
//
// ⚠️ THE DATABASE AND `src/lib/taxonomy.ts` HOLD DIFFERENT LISTS.
// The frontend's list is transcribed from the published Design Model artifact:
// 5 departments, ~15 sub-departments, keyed by slug. `departments` currently
// holds 1 root (HP) and 3 children (SUPP, MED, WEAR), keyed by numeric id. Four
// of the five frontend departments do not exist server-side yet.
//
// This module does NOT paper over that. It makes the service authoritative about
// WHAT EXISTS while letting the frontend keep its labels and its slug-keyed
// behaviour, joined on `code` — which both sides already carry and agree on
// (IV, PHYSIO, SUPP, MED, WEAR, BT, NBT, INJ, GENO...).
//
// Consequence, deliberately visible: until the taxonomy is seeded, the pickers
// offer Health Products -> Supplements / Medicines / Wearables and nothing else.
// That is the database being honest. Seeding TREAT/IV/PHYSIO makes them appear
// with no frontend change, because the join is on code.

import { api } from "@/lib/api/client"
import { CODE_TO_SUB_DEPARTMENT_ID, SUB_DEPARTMENT_CODES, SUB_DEPARTMENTS } from "@/lib/taxonomy"
import { Department, SubDepartment } from "@/types"

export interface LocalizedText { en: string | null; ar: string | null }

export interface SubDepartmentDto {
    id: number
    code: string
    name: LocalizedText
    status: string
    sortOrder: number | null
}

export interface DepartmentDto {
    id: number
    code: string
    name: LocalizedText
    status: string
    sortOrder: number | null
    subDepartments: SubDepartmentDto[]
}

/**
 * The department tree, fetched at most once per session.
 *
 * ⚠️ The PROMISE is cached, not just the result. Two components mounting together
 * both called this before either resolved, so the tree was fetched twice on every
 * editor open — visible as a duplicated `departments` row in the Network tab.
 * Caching the result alone would not have fixed that: the second caller arrives
 * while the first is still in flight.
 *
 * A session-lifetime cache is safe here because `departments` is a GOVERNED register
 * — alters/025: "a sub-department is not creatable at runtime" — so it cannot change
 * under a running tab. {@link clearDepartmentCache} exists for the case where it does
 * (a seed run against dev mid-session).
 */
let treePromise: Promise<DepartmentDto[]> | null = null

export function fetchDepartments(): Promise<DepartmentDto[]> {
    if (!treePromise) {
        treePromise = api.get<DepartmentDto[]>("departments").catch(e => {
            // A failure must NOT be cached — the next call has to be able to retry,
            // otherwise one flaky request breaks the pickers for the whole session.
            treePromise = null
            throw e
        })
    }
    return treePromise
}

export function clearDepartmentCache() {
    treePromise = null
}

/**
 * A display name that is never blank.
 *
 * Both halves of every translated name in this API are nullable — a row with no
 * `translations` entry resolves to {en: null, ar: null}. An empty <SelectItem>
 * is invisible and unclickable, so `code` is the last resort: ugly, but it names
 * the row and says plainly that a translation is missing.
 */
export function displayName(name: LocalizedText | null | undefined, code: string): string {
    return name?.en?.trim() || name?.ar?.trim() || code
}

/**
 * The service's sub-departments in the frontend's own `SubDepartment` shape.
 *
 * Why map rather than replace the shape: `listing.subDepartmentId` is a SLUG
 * everywhere downstream — axis seeding, flowForSubDepartment, uid prefixes,
 * isConsultationSubDept, the master sheet. Handing those a numeric id would
 * break every one of them silently. So a server row that matches a known code
 * KEEPS the frontend's slug identity and contributes only its existence and its
 * database id.
 *
 * A server row whose code matches nothing known still appears, using the
 * service's own name and a synthetic slug. That is the case worth having: it
 * means a newly seeded sub-department shows up without a frontend release.
 */
export function toSubDepartments(tree: DepartmentDto[]): SubDepartment[] {
    const out: SubDepartment[] = []

    for (const dept of tree) {
        for (const sub of dept.subDepartments ?? []) {
            const knownId = CODE_TO_SUB_DEPARTMENT_ID[sub.code]
            const seed = knownId ? SUB_DEPARTMENTS.find(s => s.id === knownId) : undefined

            if (seed) {
                // The seed supplies BEHAVIOUR only — attributeKeys, countryConfig, slug, and the
                // slug identity every downstream helper keys on. The NAME and the active flag come
                // from the service, which owns them now: renaming a sub-department is a data edit,
                // not a frontend release.
                out.push({
                    ...seed,
                    nameEn: displayName(sub.name, seed.nameEn || sub.code),
                    nameAr: sub.name?.ar?.trim() || seed.nameAr,
                    sortOrder: sub.sortOrder ?? seed.sortOrder,
                    isActive: sub.status === "ACTIVE",
                })
                continue
            }
            // Unknown to the frontend: carry it anyway, named by the service.
            out.push({
                id: `sd-server-${sub.id}`,
                department: departmentOf(dept.code),
                nameEn: displayName(sub.name, sub.code),
                nameAr: sub.name?.ar ?? "",
                slug: sub.code.toLowerCase(),
                sortOrder: sub.sortOrder ?? 0,
                isActive: sub.status === "ACTIVE",
                attributeKeys: [],
            })
        }
    }
    return out
}

/**
 * slug -> numeric `department_id`, which is what every write actually sends.
 *
 * The pickers speak slugs; ClassificationRequest.subDepartmentId is a Long. This
 * is the one place that translation happens, so a missing entry fails at the
 * save with a clear cause rather than posting a slug the service cannot parse.
 */
export function subDepartmentDbIds(tree: DepartmentDto[]): Record<string, number> {
    const ids: Record<string, number> = {}
    for (const dept of tree) {
        for (const sub of dept.subDepartments ?? []) {
            ids[CODE_TO_SUB_DEPARTMENT_ID[sub.code] ?? `sd-server-${sub.id}`] = sub.id
        }
    }
    return ids
}

/**
 * Department key -> the service's name for it.
 *
 * The frontend's DEPARTMENTS table keeps icon and blurb, which are presentation and have no
 * server-side home. The LABEL is not presentation — it is the same string an operator reads in the
 * database — so it comes from here, and `departmentLabel()` is the fallback for a department the
 * service has not got yet.
 */
export function departmentNames(tree: DepartmentDto[]): Partial<Record<Department, string>> {
    const names: Partial<Record<Department, string>> = {}
    for (const dept of tree) {
        const key = departmentOf(dept.code)
        if (key) names[key] = displayName(dept.name, dept.code)
    }
    return names
}

/** Which frontend departments the service can actually accept a listing under. */
export function departmentsPresent(tree: DepartmentDto[]): Set<Department> {
    const present = new Set<Department>()
    for (const dept of tree) {
        if ((dept.subDepartments ?? []).length === 0) continue
        const mapped = departmentOf(dept.code)
        if (mapped) present.add(mapped)
    }
    return present
}

/**
 * `departments.code` -> the frontend's department key.
 *
 * Only HP is seeded today. The rest are written down now because they are the
 * codes the seed will use, so this needs no edit when it runs.
 */
export const DEPARTMENT_BY_CODE: Record<string, Department> = {
    HP: "health_products",
    TREAT: "treatments",
    DIAG: "diagnostics",
    CONS: "consultations",     // was CONSULT — the seed's code is CONS (02_migrate.sql)
    CARE: "home_personal",     // was HOME — live on staging 2026-09-06 as id 8, subs BBS/ELC
}

export function departmentOf(code: string): Department {
    return DEPARTMENT_BY_CODE[code] ?? "health_products"
}


/**
 * A frontend department key -> the service's numeric `department_id`.
 *
 * Returns undefined when the service has no such department, and the CALLER must
 * treat that as "cannot filter" rather than "filter by nothing" — silently
 * dropping the filter would list the whole catalogue under a department tab.
 */
export function departmentIdOf(tree: DepartmentDto[], key: Department): number | undefined {
    return tree.find(d => departmentOf(d.code) === key)?.id
}

/** A sub-department SLUG -> the service's numeric id, joined on `code`. */
export function subDepartmentIdOf(tree: DepartmentDto[], slug: string): number | undefined {
    const code = SUB_DEPARTMENT_CODES[slug]
    if (!code) return undefined
    for (const dept of tree) {
        const hit = (dept.subDepartments ?? []).find(sd => sd.code === code)
        if (hit) return hit.id
    }
    return undefined
}
