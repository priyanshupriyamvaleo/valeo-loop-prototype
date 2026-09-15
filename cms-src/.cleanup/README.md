# Blood + Custom package cleanup — merge artifacts

Source workbooks (pulled 4 Aug 2026 via cms-631@product-479117.iam.gserviceaccount.com):
- Blood Package Master Cleanup — 415 packages · 242 active
- Custom Package Master Cleanup — 1,046 packages · 591 active
Both share the same three category tables (website_categories, frontend_webpackagecategory,
products_packages_products), so a decision in one applies to both.

| File | What |
|---|---|
| `blood.json` / `custom.json` | Full verbatim dump of every tab (raw + parsed rows) — restore point |
| `mapped_packages.json` | All 1,461 packages with proposed department / sub-department / categories, the signal each came from, and NEEDS DECISION reasons |

Mapping precedence (see job tmp/map_packages.py):
1. Package NAME — 100% populated and self-describing
2. internal_category — but ONLY if not a lab method code (IV/PCR/STD/DOC were
   mis-filing packages: an STD blood test became "IV Therapy")
3. Order-path category → 4. Storefront → 5. Website
6. otherwise blank + NEEDS DECISION
Campaign/partner/hidden buckets are never sub-departments; they fall through and
are emitted as categories or marked drop.

Result: 1,378 / 1,461 resolved (94%) · 83 awaiting a business decision
(57 "Custom Order (Hidden Purpose)", 11 "Custom Order KSA", rest vague buckets).

Proposals were written into both workbooks' amber ► columns, prefixed "PROPOSED —".
CMS merge output: src/services/catalogue-data-packages.ts (1,064 listings,
14 sub-departments, 5 categories, 111 sub-categories; 325 variants rolled into parents).
