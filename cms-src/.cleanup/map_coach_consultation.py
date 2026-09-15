"""Coach/consultation cleanup — derive proposed Department / Sub-department for all
175 packages and keep/drop for the 117 shared categories, writing PROPOSED values
into the workbook itself (new ► columns; nothing original is touched).

Destinations match the CMS taxonomy of 2026-08-13:
  Doctors & Health Coaches ▸ Consultations / Programs / Doctor Visits
  plus misfit routing to Diagnostics / Treatments / Home & Personal Care.

Precedence (auditable, in order):
  1. test/dummy data                        → propose drop
  2. consultation_type == PROGRAM           → Programs (the type column is authoritative)
  3. visit patterns / "Doctor on Call"      → Doctor Visits
  4. misfit rules (only when the name has no consult/review/coaching context)
  5. everything else                        → Consultations
"""
import json, pathlib, re
from collections import Counter

CL = pathlib.Path(__file__).parent
d = json.loads((CL / "coach_consultation.json").read_text())

def rows_of(tab):
    hdr = d[tab]["header"]
    return hdr, [dict(zip(hdr, r + [""] * (len(hdr) - len(r)))) for r in d[tab]["rows"]]

_, pkgs = rows_of("coach_consultation_package")
by_id = {p["id"]: p for p in pkgs}

TEST = re.compile(r"round robin|dummy|test$|^coach other$", re.I)
VISIT = re.compile(r"doctor at home|doctor at hotel|home visit|hotel visit|on.?call|on phone|at.?clinic|emergency doctor", re.I)
CONSULT_CTX = re.compile(r"consult|review|guidance|coaching|coach\b|dietitian|nutrition", re.I)
MISFITS = [
    (re.compile(r"iv[\s_-]*drip|\bdrip\b|\bnad\+?\b|glutathione|infusion", re.I), "Treatments", "IV Therapy"),
    (re.compile(r"vaccin|flu\s*shot", re.I), "Treatments", "Vaccines"),
    (re.compile(r"physio", re.I), "Treatments", "Physio & Rehab"),
    (re.compile(r"blood\s*test|\bpanel\b|screening", re.I), "Diagnostics", "Blood Tests"),
    (re.compile(r"supplement|collagen", re.I), "Health Products", "Supplements"),
]
PRACTITIONER = re.compile(r"^(dr|coach|aparna)\b", re.I)

def classify(p):
    name = p["external_name"] or p["internal_name"]
    internal = p["internal_category"]
    ctype = p["consultation_type"]
    if TEST.search(name):
        return "", "", "drop — test/dummy data", f"name '{name[:40]}' is test data"
    # NAME CONTEXT BEATS consultation_type: the legacy PROGRAM value marks a booking
    # flow, not a coached program — "At-clinic consultation" and "Create Your Own IV
    # Drip" both carry it. Visits and misfits are decided from the name first.
    if VISIT.search(name) or internal == "Doctor on Call":
        why = f"visit pattern in '{name[:36]}'" if VISIT.search(name) else "internal_category='Doctor on Call'"
        if ctype == "PROGRAM":
            why += " (overrides consultation_type=PROGRAM)"
        return "Doctors & Health Coaches", "Doctor Visits", "keep", why
    if not CONSULT_CTX.search(name):
        for pat, dept, sub in MISFITS:
            if pat.search(name):
                return dept, sub, "keep", f"MISFILED — '{name[:36]}' is not a consultation; belongs in {dept} ▸ {sub}. Confirm before moving"
    if ctype == "PROGRAM":
        return "Doctors & Health Coaches", "Programs", "keep", "consultation_type=PROGRAM"
    return "Doctors & Health Coaches", "Consultations", "keep", f"consultation_type={ctype or '(blank)'}"

mapped = []
for p in pkgs:
    dept, sub, action, why = classify(p)
    if action == "keep" and p["is_active"] == "False":
        action = "keep (inactive)"
    notes = [f"PROPOSED — {why}."]
    if p["is_b2b_package"] == "True":
        notes.append("B2B — mark partner-exclusive (hidden from master search).")
    if PRACTITIONER.match(p["external_name"] or "") and dept.endswith("Coaches"):
        notes.append("Practitioner-named package — candidate for a practitioner directory entry rather than a catalogue listing.")
    mapped.append({"id": p["id"], "name": p["external_name"] or p["internal_name"],
                   "dept": dept, "sub": sub, "action": action, "note": " ".join(notes),
                   "ctype": p["consultation_type"], "active": p["is_active"]})

(CL / "coach_consultation_mapped.json").write_text(json.dumps(mapped, ensure_ascii=False, indent=1))
print(f"mapped {len(mapped)} packages")
print("by destination:")
for (dp, sb), n in Counter((m["dept"], m["sub"]) for m in mapped).most_common():
    print(f"  {dp or '(drop)':<26} ▸ {sb or '—':<16} {n:>4}")
print("drops:", sum(1 for m in mapped if m["action"].startswith("drop")))
print("misfiled:", sum(1 for m in mapped if "MISFILED" in m["note"]))
print("practitioner-named:", sum(1 for m in mapped if "Practitioner-named" in m["note"]))

# ── category proposals (117 rows, shared table — usage computed within this family only) ──
_, cats = rows_of("product_category")
usage = Counter(p["product_category_id"] for p in pkgs)
CAMPAIGN = re.compile(r"under 99|50% ?off|birthday|winter alert|national day|hidden purpose|exclusive partner|custom order|^null$|testing", re.I)
DEPT_HINT = [
    (re.compile(r"pcr|covid", re.I), "Diagnostics ▸ Non-Blood Tests"),
    (re.compile(r"dna|genetic", re.I), "Diagnostics ▸ Genomics"),
    (re.compile(r"intolerance|allergy", re.I), "Diagnostics ▸ Functional Tests"),
    (re.compile(r"blood test", re.I), "Diagnostics ▸ Blood Tests"),
    (re.compile(r"physio", re.I), "Treatments ▸ Physio & Rehab"),
    (re.compile(r"nurse", re.I), "Home & Personal Care ▸ Nursing"),
    (re.compile(r"newborn|babysit", re.I), "Home & Personal Care ▸ Childcare"),
    (re.compile(r"weight ?loss|health coach|consult", re.I), "Doctors & Health Coaches ▸ Consultations"),
]
cat_rows = []
for c in cats:
    n = usage.get(c["id"], 0)
    name = c["name"] or c["title"]
    if CAMPAIGN.search(name):
        act, note = "drop", "PROPOSED — campaign / partner / hidden bucket, not a taxonomy node."
    elif c["is_deleted"] == "True" or c["status"] == "False":
        act, note = "drop", "PROPOSED — already deleted/disabled in the source table."
    elif n == 0:
        act, note = "drop", "PROPOSED — 0 coach/consultation packages use it. CHECK OTHER PACKAGE FAMILIES first: product_category is shared."
    else:
        act, note = "keep", f"PROPOSED — {n} package(s) in this family."
    hint = next((h for pat, h in DEPT_HINT if pat.search(name)), "")
    cat_rows.append({"id": c["id"], "action": act, "hint": hint, "note": note})
print("\ncategory actions:", dict(Counter(r["action"] for r in cat_rows)))
(CL / "coach_consultation_cats.json").write_text(json.dumps(cat_rows, ensure_ascii=False, indent=1))
