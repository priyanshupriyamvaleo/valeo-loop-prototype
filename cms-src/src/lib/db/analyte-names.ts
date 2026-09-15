// ── The analyte names the prototype already carried ───────────
// Extracted from the prototype's seed list, which came from the real catalogue.
//
// ⚠️ NAMES, SPECIMEN AND LEGACY ID ONLY, on purpose. The seed also held units,
// tube types, fasting rules, graded bands, component prices and lab costs —
// all authored to make the screens demonstrable, none of it from Valeo's own
// data. Those are left out so the database never contains a clinical or
// commercial value that nobody decided.

import type { SampleKind } from "@/types"

export interface PrototypeAnalyte {
    id: string
    legacyId: number
    nameEn: string
    sampleKind: SampleKind
}

export const PROTOTYPE_ANALYTES: PrototypeAnalyte[] = [
    { id: "bm-1", legacyId: 1, nameEn: "Haemoglobin", sampleKind: "blood" },
    { id: "bm-2", legacyId: 2, nameEn: "White Blood Cell Count", sampleKind: "blood" },
    { id: "bm-3", legacyId: 3, nameEn: "Platelet Count", sampleKind: "blood" },
    { id: "bm-4", legacyId: 4, nameEn: "Haematocrit", sampleKind: "blood" },
    { id: "bm-5", legacyId: 5, nameEn: "Red Cell Distribution Width", sampleKind: "blood" },
    { id: "bm-7", legacyId: 7, nameEn: "Mean Corpuscular Volume", sampleKind: "blood" },
    { id: "bm-11", legacyId: 11, nameEn: "Total Cholesterol", sampleKind: "blood" },
    { id: "bm-12", legacyId: 12, nameEn: "LDL Cholesterol", sampleKind: "blood" },
    { id: "bm-13", legacyId: 13, nameEn: "HDL Cholesterol", sampleKind: "blood" },
    { id: "bm-14", legacyId: 14, nameEn: "Triglycerides", sampleKind: "blood" },
    { id: "bm-21", legacyId: 21, nameEn: "Fasting Glucose", sampleKind: "blood" },
    { id: "bm-22", legacyId: 22, nameEn: "HbA1c", sampleKind: "blood" },
    { id: "bm-23", legacyId: 23, nameEn: "Fasting Insulin", sampleKind: "blood" },
    { id: "bm-24", legacyId: 24, nameEn: "HOMA-IR", sampleKind: "blood" },
    { id: "bm-31", legacyId: 31, nameEn: "TSH", sampleKind: "blood" },
    { id: "bm-32", legacyId: 32, nameEn: "Free T4", sampleKind: "blood" },
    { id: "bm-33", legacyId: 33, nameEn: "Free T3", sampleKind: "blood" },
    { id: "bm-35", legacyId: 35, nameEn: "Thyroid Peroxidase Antibodies", sampleKind: "blood" },
    { id: "bm-41", legacyId: 41, nameEn: "Vitamin D (25-OH)", sampleKind: "blood" },
    { id: "bm-42", legacyId: 42, nameEn: "Vitamin B12", sampleKind: "blood" },
    { id: "bm-44", legacyId: 44, nameEn: "Folate", sampleKind: "blood" },
    { id: "bm-45", legacyId: 45, nameEn: "Ferritin", sampleKind: "blood" },
    { id: "bm-46", legacyId: 46, nameEn: "Serum Iron", sampleKind: "blood" },
    { id: "bm-47", legacyId: 47, nameEn: "Magnesium", sampleKind: "blood" },
    { id: "bm-51", legacyId: 51, nameEn: "ALT", sampleKind: "blood" },
    { id: "bm-52", legacyId: 52, nameEn: "AST", sampleKind: "blood" },
    { id: "bm-53", legacyId: 53, nameEn: "GGT", sampleKind: "blood" },
    { id: "bm-57", legacyId: 57, nameEn: "Albumin", sampleKind: "blood" },
    { id: "bm-60", legacyId: 60, nameEn: "Creatinine", sampleKind: "blood" },
    { id: "bm-61", legacyId: 61, nameEn: "eGFR", sampleKind: "blood" },
    { id: "bm-62", legacyId: 62, nameEn: "Urea", sampleKind: "blood" },
    { id: "bm-70", legacyId: 70, nameEn: "Testosterone (Total)", sampleKind: "blood" },
    { id: "bm-71", legacyId: 71, nameEn: "Free Testosterone", sampleKind: "blood" },
    { id: "bm-72", legacyId: 72, nameEn: "Oestradiol", sampleKind: "blood" },
    { id: "bm-73", legacyId: 73, nameEn: "Cortisol", sampleKind: "blood" },
    { id: "bm-74", legacyId: 74, nameEn: "DHEA-S", sampleKind: "blood" },
    { id: "bm-81", legacyId: 81, nameEn: "hs-CRP", sampleKind: "blood" },
    { id: "bm-82", legacyId: 82, nameEn: "Homocysteine", sampleKind: "blood" },
    { id: "bm-146", legacyId: 146, nameEn: "Neutrophils", sampleKind: "blood" },
    { id: "bm-147", legacyId: 147, nameEn: "Lymphocytes", sampleKind: "blood" },
    { id: "bm-148", legacyId: 148, nameEn: "Monocytes", sampleKind: "blood" },
    { id: "bm-149", legacyId: 149, nameEn: "Eosinophils", sampleKind: "blood" },
    { id: "bm-150", legacyId: 150, nameEn: "Basophils", sampleKind: "blood" },
    { id: "bm-157", legacyId: 157, nameEn: "Apolipoprotein B", sampleKind: "blood" },
    { id: "bm-169", legacyId: 169, nameEn: "Lipoprotein(a)", sampleKind: "blood" },
    { id: "bm-201", legacyId: 201, nameEn: "Urine Protein", sampleKind: "urine" },
    { id: "bm-202", legacyId: 202, nameEn: "Urine Microalbumin", sampleKind: "urine" },
    { id: "bm-211", legacyId: 211, nameEn: "Faecal Calprotectin", sampleKind: "stool" },
    { id: "bm-212", legacyId: 212, nameEn: "Faecal Occult Blood", sampleKind: "stool" },
    { id: "bm-221", legacyId: 221, nameEn: "Salivary Cortisol (waking)", sampleKind: "saliva" },
    { id: "bm-231", legacyId: 231, nameEn: "H. pylori Breath", sampleKind: "breath" },
]
