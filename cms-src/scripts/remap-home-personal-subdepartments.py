#!/usr/bin/env python3
"""Re-point home_personal listings onto the 2026-09-06 service split.

Product directive 2026-09-06: Home & Personal Care has exactly TWO
sub-departments, Babysitting (BABY) and Elderly Care (ELDER) — no third node.
The old merged "duration care" node and the "nursing" node are gone from the
taxonomy (src/lib/taxonomy.ts), so their listing rows in
src/services/catalogue-data-packages.ts are re-pointed PER ROW — the service
split survives only in the listing names, so an id-level legacy map cannot
do it.

Rules, in order (grounded in the legacy dump's internal_category where the
name alone is ambiguous):
  1. internalName contains "elderly"                    -> elderly-care (10)
  2. mother/new-born visits (postnatal, breastfeeding — legacy category
     'Babysitter' — and new-born-baby-care)             -> babysitting
  3. nurse-on-call / clinical home nursing (legacy category
     'Medical Services': nurse-on-call rows, diabetes-care-at-home,
     nurse-administration-for-peptides)                 -> elderly-care
  4. everything else (plans, hourly, babysitting)       -> babysitting

Idempotent: re-running after a successful pass changes nothing.
Kept in scripts/ so the remap can be re-run and reviewed rather than being a
one-off edit nobody can retrace (same reasoning as LEGACY_SUB_DEPARTMENT_IDS).
"""

import collections
import re
import sys
from pathlib import Path

DATA = Path(__file__).resolve().parent.parent / "src/services/catalogue-data-packages.ts"

BABY = "sd-home_personal-babysitting"
ELDER = "sd-home_personal-elderly-care"

TO_BABY_BY_NAME = {
    "breastfeeding-counselor-visit",            # legacy internal_category: Babysitter
    "postnatal-home-nursing-visit-for-mother-new-born",
    "new-born-baby-care",
}

TO_ELDER_BY_NAME = {
    "nurse-on-call",                            # legacy internal_category: Medical Services
    "nurse-on-call-1-day-24hrs",
    "nurse-on-call-30-days-12-hours",
    "nurse-on-call-4-hours-one-visit",
    "diabetes-care-at-home",
    "nurse-administration-for-peptides",
}

ROW = re.compile(
    r'("department": "home_personal", "subDepartmentId": ")([^"]+)(", "internalName": "([^"]+)")'
)

counts: collections.Counter[str] = collections.Counter()


def target(name: str) -> str:
    if "elderly" in name:
        return ELDER
    if name in TO_BABY_BY_NAME:
        return BABY
    if name in TO_ELDER_BY_NAME:
        return ELDER
    return BABY


def replace(m: re.Match[str]) -> str:
    new = target(m.group(4))
    counts[new] += 1
    return f"{m.group(1)}{new}{m.group(3)}"


def main() -> int:
    src = DATA.read_text(encoding="utf-8")
    out, n = ROW.subn(replace, src)
    if n == 0:
        print("no home_personal rows found — nothing to do")
        return 1
    DATA.write_text(out, encoding="utf-8")
    print(f"re-pointed {n} home_personal rows:")
    for sd, c in sorted(counts.items()):
        print(f"  {c:4d}  {sd}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
