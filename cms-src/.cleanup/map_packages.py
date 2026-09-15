"""Derive proposed Department / Sub-department / Categories for all 1,461 packages.

Precedence (auditable, in order):
  1. internal_category on the package   — sparsest but cleanest signal
  2. Order-path category                — the money path; fully filled on custom
  3. Storefront category                — website filing
  4. Package name keywords              — last resort
  5. otherwise: leave blank + NEEDS DECISION with the reason
Campaign / partner / hidden buckets are NEVER sub-departments — they fall through
to the next signal and are emitted as CATEGORIES (or drop) instead.
"""
import json, pathlib, re
from collections import Counter

CL = pathlib.Path("/Users/ritwik/valeo-projects/Admin-Panel/headless-cms-frontend/.cleanup")
blood = json.loads((CL / "blood.json").read_text())
custom = json.loads((CL / "custom.json").read_text())

# ── buckets that are campaigns / partner / hidden, not structural ──
NON_STRUCTURAL = [
    "custom order", "hidden purpose", "exclusive partner", "allianz", "dewa",
    "under 99", "50% off", "national day", "cohort", "yellow", "b2b",
    "testing category", "null", "offers", "campaign", "bundle of",
    "mini packages", "health packages", "health cover",
]
# internal_category on the custom book holds LAB METHOD CODES ("IV", "PCR", "STD",
# "DOC"), not department signals — reading them as categories mis-files packages
# (an STD blood test became "IV Therapy"). Never classify from these.
AMBIGUOUS_CODES = {"iv", "pcr", "std", "doc", "bt", "ct", "us", "na", "n/a", "-"}

def non_structural(s: str) -> bool:
    s = (s or "").strip().lower()
    if s in AMBIGUOUS_CODES or len(s) <= 3:
        return True
    return any(k in s for k in NON_STRUCTURAL)

# ── signal → (department, sub-department) ──
# order matters: first regex hit wins
RULES: list[tuple[str, str, str]] = [
    # Diagnostics
    (r"fasting\s*bt|non\s*fasting\s*bt|blood\s*test|blood\s*panel|\bcbc\b|lipid|thyroid|vitamin\s*d\s*test|pregnancy\s*blood|\bstd\b|sexual\s*health|hormone\s*test|testosterone|\bhiv\b|hepatitis|syphilis|gonorrh|chlamyd|herpes|anemia|diabet.*(test|panel)|ferritin|\bcrp\b", "Diagnostics", "Blood Tests"),
    (r"functional\s*test|intolerance|allergy|gi\s*map|bioresonance|gut\s*(health|cleanse)?\s*test", "Diagnostics", "Functional Tests"),
    (r"\bdna\b|genetic|genome|genomic|nipt", "Diagnostics", "Genomics"),
    # non-blood pathology + imaging (PCR swab, urine, dexa, scans) — NOT blood draws
    (r"dexa|\bscan\b|scans|non\s*invasive|\bpcr\b|x-?ray|ultrasound|urine|swab|stool|semen", "Diagnostics", "Non-Blood Tests"),
    (r"wearable", "Diagnostics", "Blood Tests"),
    # Treatments — a bare "IV" is too loose; require a drip context
    (r"iv[\s_-]*(therapy|drip)|\bdrip\b|glutathione|\bnad\+?\b|infusion|iv\s+(vitamin|glow|hydration|immunity|energy|liver|skin|weight|nac|antioxidant|fitness|after\s*party|vip|men|hair)", "Treatments", "IV Therapy"),
    # Injections/vaccines and IV drips are ONE sub-department — both are a clinician
    # administering something parenterally, and splitting them meant two homes for
    # the same operational flow.
    (r"vaccin|flu\s*shot|\bhpv\b|influenza|tetanus|pneumo|rabies|typhoid|meningo", "Treatments", "Vaccines"),
    (r"injection|\bshot\b|\bb12\b|intramuscular|lipotropic", "Treatments", "Injections"),
    (r"physio|rehab|cupping|dry\s*needling|lymphedema|myofascial|athlete|recovery\s*session", "Treatments", "Physio & Rehab"),
    # Home & Personal Care
    (r"babysit|newborn|new-?born|child\s*care|nanny", "Home & Personal Care", "Childcare"),
    (r"elderly|geriatric", "Home & Personal Care", "Elderly Care"),
    (r"nurse|nursing", "Home & Personal Care", "Nursing"),
    # Products BEFORE consultations — "Mounjaro + Free Consultation" is a medicine
    # sale bundled with a consult, not a consultation product.
    (r"mounjar|wegovy|weg0vy|rybelsus|foundayo|ozempic|glp-?1|peptide|semaglutide|tirzepatide", "Products & Devices", "Medicine"),
    (r"supplement|collagen|multivitamin|omega", "Products & Devices", "Supplements"),
    # Consultations
    # Doctor Visits BEFORE the generic consultation rule — "Doctor at Home" contains "doctor".
    (r"doctor at home|doctor at hotel|home visit|emergency doctor|on.?call|on phone", "Doctors & Health Coaches", "Doctor Visits"),
    (r"\bprogramme?s?\b|\d+[- ]week", "Doctors & Health Coaches", "Programs"),
    (r"dietitian|nutritionist|coach\s*consult|health\s*coach", "Doctors & Health Coaches", "Consultations"),
        (r"doctor\s*consult|teleconsult|consultation|\bdoctor\b", "Doctors & Health Coaches", "Consultations"),
    # LAST RESORT: an unmatched name that still reads as a diagnostic.
    (r"\btest\b|screening|\bpanel\b|\bprofile\b|check-?up|analysis", "Diagnostics", "Blood Tests"),
]

def classify(*signals: str):
    """Return (dept, subdept, matched_signal, rule) or (None, None, None, None)."""
    for sig in signals:
        if not sig or non_structural(sig):
            continue
        low = sig.lower()
        for pat, dept, sub in RULES:
            if re.search(pat, low):
                return dept, sub, sig, pat
    return None, None, None, None


def process(book_key, recon_rows, is_blood):
    out = []
    for r in recon_rows:
        internal = r.get("④ internal (pkg)", "") or r.get("④ internal (cms)", "")
        orderp = r.get("① Order-path category", "")
        store = r.get("② Storefront category", "")
        website = r.get("③ Website category", "")
        name = r.get("Package name", "")
        iname = r.get("Internal name", "")

        # Precedence: the package NAME first — it is 100% populated and
        # self-describing, whereas internal_category holds lab codes and the
        # category tables are full of campaign buckets. Signals only break ties
        # when the name is opaque (e.g. "Cstm. Package 412").
        dept, sub, matched, rule = classify(name, iname, internal, orderp, store, website)

        # blood workbook: everything is a blood package unless a rule says otherwise
        if dept is None and is_blood:
            dept, sub, matched = "Diagnostics", "Blood Tests", "blood workbook default"

        # categories = the browsable signals worth keeping (campaigns kept as categories)
        cats = []
        for s in (orderp, store, website):
            s = (s or "").strip()
            if not s or s in cats:
                continue
            if re.search(r"hidden purpose|^null$|testing category", s, re.I):
                continue
            cats.append(s)

        reachable = r.get("Reachable on website", "")
        variant_of = reachable[len("variant of → "):] if reachable.startswith("variant of →") else ""

        needs = ""
        if dept is None:
            sigs = [x for x in (internal, orderp, store, website) if x]
            needs = ("NEEDS DECISION: no structural signal — only " +
                     (", ".join(f"'{s}'" for s in sigs[:3]) if sigs else "package name") +
                     " (campaign/hidden bucket)")
        out.append({
            "book": book_key,
            "id": r.get("Package id", ""),
            "name": name,
            "country": r.get("Country", ""),
            "status": r.get("Status", ""),
            "slug": r.get("URL slug", ""),
            "reachable": reachable,
            "variantOf": variant_of,
            "dept": dept or "",
            "sub": sub or "",
            "matchedSignal": matched or "",
            "categories": cats,
            "partnerExclusive": bool(re.search(r"partner|allianz|dewa|b2b", f"{orderp} {store} {reachable}", re.I)),
            "needsDecision": needs,
            "signals": {"internal": internal, "orderPath": orderp, "storefront": store, "website": website},
        })
    return out

mapped = (process("blood", blood["tabs"]["Package Reconciliation"]["rows"], True)
          + process("custom", custom["tabs"]["Package Reconciliation"]["rows"], False))

(CL / "mapped_packages.json").write_text(json.dumps(mapped, indent=1, ensure_ascii=False))

print(f"TOTAL PACKAGES MAPPED: {len(mapped)}")
print()
resolved = [m for m in mapped if m["dept"]]
unresolved = [m for m in mapped if not m["dept"]]
print(f"resolved: {len(resolved)}  ({len(resolved)*100//len(mapped)}%)")
print(f"needs decision: {len(unresolved)}")
print()
print("BY DEPARTMENT → SUB-DEPARTMENT:")
for (d, s), n in Counter((m["dept"], m["sub"]) for m in resolved).most_common():
    print(f"  {d:<26} ▸ {s:<24} {n:>5}")
print()
print("UNRESOLVED by dominant signal:")
for v, n in Counter(
        (m["signals"]["orderPath"] or m["signals"]["internal"] or "(no signal)") for m in unresolved).most_common(12):
    print(f"  {n:>5}  {v[:60]}")
print()
print("BY BOOK:", dict(Counter(m["book"] for m in mapped)))
print("partner-exclusive:", sum(1 for m in mapped if m["partnerExclusive"]))
print("variants (roll into a parent):", sum(1 for m in mapped if m["variantOf"]))
print("inactive:", sum(1 for m in mapped if m["status"] == "Inactive"))
