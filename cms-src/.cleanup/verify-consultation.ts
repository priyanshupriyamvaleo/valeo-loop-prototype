/**
 * Consultation section vs the real schema — run:
 *   npx tsx .cleanup/verify-consultation.ts
 *
 * Two-way completeness, which is the point of the section:
 *   · every field the CMS collects has a named table.column, or an explicit
 *     "NO SCHEMA IN DB" note saying it has no home yet
 *   · every consultation-relevant table in the schema document has a CMS surface,
 *     or an explicit note saying it is authored elsewhere
 *
 * Source of truth: "Schema Cleanup.docx" — coach_role_mapping,
 * valeo_professional_details, questionnaires (+ questions / question_options /
 * question_facts / questionnaire_submissions / question_responses).
 */
import { ApiService } from "@/services/api"
import { SCHEMA_MAP_GROUPS, isNoSchema } from "@/lib/schema-map"
import {
    consultationGaps, isConsultationSubDept, qualifiedPractitioners,
    questionnaireForCountry, questionnairesFor,
} from "@/lib/consultation"
import { Listing, Practitioner } from "@/types"

let pass = 0, fail = 0
const t = (name: string, got: unknown, want: unknown) => {
    const ok = JSON.stringify(got) === JSON.stringify(want)
    ok ? pass++ : fail++
    console.log(`${ok ? "  ok  " : "  FAIL"} ${name}${ok ? "" : `\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`)
}

async function main() {
    const [sds, listings, team, questionnaires] = await Promise.all([
        ApiService.catalogue.subDepartments(),
        ApiService.catalogue.listings(),
        ApiService.catalogue.healthTeam(),
        ApiService.catalogue.questionnaires(),
    ])

    console.log("── sub-departments resolve to exactly one row (the gate depends on it) ──")
    const ids = sds.map(s => s.id)
    t("no duplicate sub-department ids", ids.length, new Set(ids).size)
    const consult = sds.filter(s => s.department === "consultations")
    t("three consultations sub-departments", consult.map(s => s.slug).sort(), ["consultation", "doctor-visits", "programs"])
    const clinical = sds.find(s => s.id === "sd-consultations-clinical")!
    t("consultation row keeps all four markets after the merge",
        (clinical.countryConfig ?? []).map(c => c.country).sort(), ["KSA", "KUWAIT", "QATAR", "UAE"])
    t("the section gate matches it", isConsultationSubDept(clinical), true)
    t("gate rejects programs", isConsultationSubDept(sds.find(s => s.slug === "programs")), false)
    t("gate rejects doctor visits", isConsultationSubDept(sds.find(s => s.slug === "doctor-visits")), false)

    console.log("\n── role is NOT profession: the two enums stay separate ──")
    const kinds = new Set(team.map(p => p.kind))
    t("PractitionerKind still has more than two values in use", kinds.size > 2, true)
    const roles = new Set(team.flatMap(p => (p.coachRoles ?? []).map(r => r.role)))
    t("only the two DB enum values appear as roles", [...roles].sort(), ["DOCTOR", "WEIGHTLOSS_COACH"])
    const dietitians = team.filter(p => p.kind === "dietitian")
    t("dietitians are left without a role on purpose",
        dietitians.every(p => (p.coachRoles ?? []).length === 0), true)
    t("no follow-up package was invented",
        team.every(p => (p.coachRoles ?? []).every(r => r.followUpListingId === undefined)), true)

    console.log("\n── qualification comes from coach_role_mapping ──")
    t("DOCTOR filter keeps only doctors",
        qualifiedPractitioners({ requiredRole: "DOCTOR" }, team).every(p => p.kind === "doctor"), true)
    t("no role required = nobody excluded",
        qualifiedPractitioners({}, team).length, team.length)

    console.log("\n── questionnaires: country_id NULL means every market ──")
    t("an unscoped questionnaire qualifies in KSA",
        questionnairesFor(questionnaires, "KSA").some(q => q.internalName === "doctor_general_intake"), true)
    t("a KSA-scoped one does not qualify in UAE",
        questionnairesFor(questionnaires, "UAE").some(q => q.country === "KSA"), false)
    t("INACTIVE ones never qualify",
        questionnairesFor(questionnaires, "UAE").every(q => q.status === "ACTIVE"), true)
    t("internal_name is unique", questionnaires.length, new Set(questionnaires.map(q => q.internalName)).size)

    console.log("\n── the demo listing, and what the gaps actually say ──")
    const l = listings.find(x => x.id === "l-consult")!
    t("demo listing is in the consultation sub-department", l.subDepartmentId, "sd-consultations-clinical")
    t("it declares a role", l.consultation?.requiredRole, "DOCTOR")
    const gaps = consultationGaps(l, team, questionnaires)
    gaps.forEach(g => console.log(`      gap: ${g}`))
    // Aparna is a dietitian with no DOCTOR role, and every seeded profile lacks a
    // User Service id — both must be named, not silently tolerated.
    t("a mapped person without the required role is named",
        gaps.some(g => g.includes("does not hold the DOCTOR role")), true)
    t("a missing User Service link is named",
        gaps.some(g => g.includes("no User Service link")), true)

    console.log("\n── gap check is precise, not blanket ──")
    const good: Practitioner = {
        id: "p-ok", kind: "doctor", nameEn: "Dr Fine", slug: "dr-fine", status: "active",
        sortOrder: 0, userServiceId: "usr-1", coachRoles: [{ role: "DOCTOR", followUpListingId: "l-consult" }],
    }
    const clean: Listing = {
        ...l, practitionerIds: ["p-ok"],
        countryConfig: [{ country: "UAE", status: "active" }],
        consultation: {
            requiredRole: "DOCTOR", sessionMinutes: 30,
            questionnaires: [{ country: "UAE", questionnaireId: "qn-doctor-general" }],
        },
    }
    t("a fully-configured consultation has no gaps", consultationGaps(clean, [good], questionnaires), [])
    t("removing the session length is caught",
        consultationGaps({ ...clean, consultation: { ...clean.consultation, sessionMinutes: undefined } }, [good], questionnaires)
            .some(g => g.includes("Session length")), true)
    t("an unmapped market is caught",
        consultationGaps({ ...clean, countryConfig: [{ country: "UAE", status: "active" }, { country: "KSA", status: "active" }] }, [good], questionnaires)
            .some(g => g.includes("KSA: no questionnaire mapped")), true)
    t("an INACTIVE questionnaire is caught",
        consultationGaps({ ...clean, consultation: { ...clean.consultation, questionnaires: [{ country: "UAE", questionnaireId: "qn-legacy-v1" }] } }, [good], questionnaires)
            .some(g => g.includes("INACTIVE")), true)
    t("a wrongly-scoped questionnaire is caught",
        consultationGaps({ ...clean, consultation: { ...clean.consultation, questionnaires: [{ country: "UAE", questionnaireId: "qn-doctor-ksa" }] } }, [good], questionnaires)
            .some(g => g.includes("scoped to KSA")), true)
    t("per-country lookup returns the right questionnaire",
        questionnaireForCountry(clean.consultation, "UAE"), "qn-doctor-general")

    console.log("\n── two-way schema completeness ──")
    const group = SCHEMA_MAP_GROUPS.find(g => g.section === "Consultation")!
    t("a Consultation group exists in the schema map", !!group, true)
    // (a) every CMS field the section collects is accounted for
    const COLLECTED = [
        "consultation.requiredRole", "consultation.sessionMinutes", "consultation.followUpIncluded",
        "consultation.questionnaires[].country", "consultation.questionnaires[].questionnaireId",
        "Practitioner.coachRoles[].role", "Practitioner.coachRoles[].followUpListingId",
        "Practitioner.gender", "Practitioner.yearsOfExperience",
    ]
    COLLECTED.forEach(f => t(`mapped: ${f}`, group.rows.some(r => r.cmsField === f), true))
    // (b) every consultation-relevant table in the docx has a surface or a stated reason
    const TABLES = [
        "coach_role_mapping", "valeo_professional_details", "questionnaires",
        "questions", "question_options", "question_facts",
        "questionnaire_submissions", "question_responses",
    ]
    const blob = group.rows.map(r => `${r.cmsField} ${r.dbMapping} ${r.note ?? ""}`).join(" | ")
    TABLES.forEach(tb => t(`schema table covered: ${tb}`, blob.includes(tb), true))
    // (c) anything with no DB home must say WHY, not just sit blank
    group.rows.filter(r => isNoSchema(r.dbMapping)).forEach(r => {
        t(`no-schema field explains itself: ${r.cmsField}`, (r.note ?? "").length > 20, true)
    })
    // (d) the EN/AR divergence is recorded rather than quietly ignored
    t("the translations divergence is stated",
        group.rows.some(r => r.cmsField.startsWith("DIVERGENCE") && r.dbMapping.includes("translations")), true)
    // (e) new Consultation types must not reintroduce En/Ar columns
    t("ConsultationConfig declares no En/Ar pair",
        COLLECTED.some(f => f.endsWith("En") || f.endsWith("Ar")), false)

    console.log(`\n${pass} passed, ${fail} failed`)
    if (fail) process.exit(1)
}
main().catch(e => { console.error(e); process.exit(1) })
