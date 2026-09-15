# CMS migration crawl artifacts

Durable output of the exhaustive Admin-Panel parity crawl (30 Jul 2026) that
produced the Scope tab of the CMS Migration Master Tracker.

| File | What it is |
|---|---|
| `map.json` | Route/nav map of the legacy panel — 163 routes, 36 nav sections, 22 unrouted (hidden/dead) screens, 34 service files |
| `findings_raw.json` | 706 raw findings from 10 parallel crawl bundles (before dedup) |
| `inventory.json` | 581 deduplicated, module-normalised features → the Scope tab |
| `sheet_backup_pre_rebuild.json` | Full backup of the 6 tabs that existed before the 3-tab rebuild |
| `plan_rows.json` | The 72 Plan-tab rows (blockers, decisions, 5× department template, migrations, consumers) |
| `built.json` | Tab/sheet ids created |

Tracker: https://docs.google.com/spreadsheets/d/1h2e3uzMZueSwAewWhu-GrkTmcmDmPKtfgv3FPumzo8A/edit

Scope counts: 592 rows — Phase 1 239 · Phase 2 252 · Good to Have 23 · Won't Do 78.
328 debt rows, 59 dead-code (commented-out) findings, 25 "Admin Portal — intentional".
