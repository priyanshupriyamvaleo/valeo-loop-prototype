# Valeo — Phase 1 handoff

**Demo:** `?phase=1` · `?phase=2` · `?phase=3` (default 1). Switch also lives in the dev rail.
**Reference prototype:** this repo. Marked *reference, not scope* — it contains all three phases.

---

## Phase map

Cut by **capability**, not by screen, so each phase is independently shippable and the order is forced by dependency.

| Phase | Name | The question it answers | Depends on |
|---|---|---|---|
| **1** | **The Loop** | Will a person run a protocol to completion and come back for the retest? | Nothing |
| **2** | **Discovery** | Does choice increase conversion, and can matching beat a clinician? | P1 protocol content + P1 recommendation log |
| **3** | **The Twin** | Does a model of the body increase return rate and repeat purchase? | P1 **closed loops** — real predicted-vs-observed data |

**Why this order.** Phase 3 is the most attractive and must come last: `LEVELS`, `PROTO_HITS` and `deliveryFor` are all downstream of completed runs. Ship the twin first and you ship a poster with invented numbers. Phase 2 comes second because at 20–50 users a human matcher beats an algorithm, and the algorithm needs P1's outcome data to train on anyway.

### Phase 1 scope

**In:** onboarding → shortlist of ≤3 → protocol detail → book consult → doctor amends → buy → ship → daily run tracking → verdict → book retest+review → results (incl. predicted vs observed) → Protocols with Active / Saved / Completed.

**Out:** swipe deck, catalog, search, tiers/locks, Twin tab, longevity score, subsystem map, Now/Peak, simulation, twin chat, device integrations, multi-protocol *discovery* (multi-protocol *runs* stay in — the data model supports N and removing it would be a rewrite later).

---

# TICKET A — Frontend (Phase 1)

## Screens

| # | Screen | State it reads | Notes |
|---|---|---|---|
| 0 | **Valeo home — host** | `GET /home-card` | **Not ours.** One card, injected between the greeting and the services grid. See below. |
| 1 | Intro | — | Marketing. Single CTA. Escapable back to host. Phase 1 copy sells the protocol and the retest — **not** the twin, which does not exist until phase 3. |
| 2 | Questions | `intake` | Existing set. Goal question drives the shortlist. |
| 3 | Matching (loader) | — | Staged, ~2s. Not decorative — it's where the shortlist is claimed. |
| 4 | **Plan (shortlist + catalogue)** | `GET /recommendations`, `GET /protocols?q=&goal=` | **New.** One screen, two halves. Search pinned at top in every state. First visit: shortlist leads (≤3, first marked *Best fit*; row = protocol, why, match %, weeks, marker, price). Once the user holds a protocol the halves **reorder** — browse-by-goal leads, shortlist demotes to compact rows under *Also matched to you*. It reorders; it does not switch modes. |
| 5 | Protocol detail | `GET /protocols/:id`, `GET /runs/:id` | Three faces: pre-purchase plan · live tracker · Protocol\|Results switch when done. |
| 6 | Consult | `POST /consults` | Two modes: `start` and `review`. Copy differs, slot picker identical. |
| 7 | Buy | `POST /orders` | Price, what's included, one CTA. |
| 8 | Today | `GET /runs`, `POST /logs` | Per-run focus + switcher when >1 active. Captures: dose, weight, meal, check-in. |
| 9 | Verdict day | `GET /runs/:id` | Adherence summary → *Book retest and review*. |
| 10 | Results | `GET /verdicts/:runId` | Verdict → **predicted vs observed** → scored markers → everything else → doctor's read → recommendation → stop-list. |
| 11 | Protocols | `GET /runs`, `GET /protocols/saved` | Active · Saved · Completed. Running row → status view, not the funnel. |

## The host home card

Protocols ship as a **module inside the Valeo app that already exists**. Valeo's nav has five
items and is not getting a sixth, so the module's entire presence on the home screen is one
card. That makes it the highest-leverage surface in the phase: it is the only thing a user who
is not currently thinking about protocols will ever see.

**Placement is part of the spec:** directly under the greeting, directly above the services
grid. Below the grid it is a promotion nobody scrolls to. Above the greeting it displaces the
host's own identity. Between them it reads *your thing, then our shop* — the correct hierarchy
for a returning user with an open loop.

`GET /home-card` returns one resolved card. **The server resolves it, ordered by urgency, not by
lifecycle order** — an unread result outranks a run in flight, which outranks a shortlist. The
client renders; it does not choose.

| `kind` | When | Tag | CTA | Destination |
|---|---|---|---|---|
| `done` | a verdict the user has not opened | Your results are in | See what changed | Results |
| `verdict` | run hit its end date | N weeks done | Book my retest | Protocol |
| `reviewing` | retest done, doctor reviewing | With your doctor | See where it stands | Protocol |
| `running` | run in flight | Your protocol | View my plan | Today, focused on that run |
| `pipeline` | saved → booked → ready | Under doctor review / Ready to buy | See where it stands / Start it | Protocol |
| `saved` | kept, never booked | Not started | Book my consult | Protocol |
| `shortlist` | onboarded, nothing chosen | Your shortlist is ready | See my matches | Plan |
| `intro` | never engaged | Introducing protocols | Build my plan | Intro → onboarding |

Two client rules specific to the card:

- **It changes shape, not just copy.** A run in flight earns a progress bar and a marker delta
  (`78.4 kg → 73.6 kg`); a waiting verdict earns neither, because the only thing it needs is to
  be opened. Identical furniture in every state makes the urgent states look routine.
- **`intro` is the only state that gets the dark selling treatment.** Everything after it is
  status, and status on someone else's home screen sits inside their visual language.
- **Never a number without the thing that makes it mean something.** A weight is a fact.
  `78.4 → 73.6` is progress.

With `>1` active run the card shows the most urgent one and a `2 running` chip; it does not
become a list.

## How a user gets a *second* protocol

The gap this closes: a shortlist answers *what should I do* exactly once, and phase 1 has no
deck. Without a permanent route, a user who finishes one protocol has nowhere to go.

- **Phase 1** — the Plan tab, permanently. Search by title, marker, or drug (`apob`,
  `tirzepatide`) plus browse by the same six goals the onboarding asked about. Not a second
  taxonomy: a catalogue that names its products differently from the onboarding is a catalogue
  that has started lying.
- **Phase 2+** — Plan folds into Discover, whose catalogue bar is the same search and the same
  browse. Two nav entries for *find a protocol* read as two products.

Rows already held show their status (`Running`, `Kept`) instead of a price. Offering to
"discover" something the user is three weeks into is the fastest way to look like two products
bolted together.

## Client rules that are not negotiable

These are the constraints the prototype encodes. They are product, not styling.

1. **Never a finding without its move.** Any state, grade or gap renders with the action that addresses it.
2. **Confidence travels with every claim.** Every number carries its source and date (`Panel · 04 Jun`). No bare numbers.
3. **Two visual languages.** Lab-measured and self-reported never render identically. Self-report is hollow/hatched and quotes the user (`You said 7–8 h`).
4. **Unmeasured ≠ unhealthy.** Missing data renders as *not measured* plus the action that would open it. Never as zero, never as red.
5. **`0` from the server means "not measured yet", not "delivered nothing."** Distinguish null from zero in every display.
6. **The state machine is server-owned.** The client renders status; it never infers or advances it.
7. **Generated text is never attributed to a clinician.** A doctor's read is authored. A numeric summary is labelled as such.

## Frontend acceptance criteria

- [ ] Shortlist shows ≤3, ordered as the API returns them. Client does **not** re-sort or re-score.
- [ ] Opening a running protocol shows live stages + **Track it on Today**, never *Book consultation*.
- [ ] Protocol status is read per-protocol. With two protocols running, neither reads "Not started".
- [ ] Retest CTA label depends on `protocol.needs_blood`: with → *Book retest and review*; without → *Book your final review*.
- [ ] Results renders correctly when `scored_markers` is empty (protocol scored on VO₂max etc.) — no "0 of 0".
- [ ] Completed protocol appears under Completed and **not** under Saved.
- [ ] All four capture types post per-run and survive a tab change.
- [ ] Every screen renders with `intake` present but zero runs, and with a run in each of the 8 statuses.
- [ ] The demo **opens on Valeo's home**, not on our Intro. Every phase, every reload.
- [ ] All nine `home-card` states render, and the card is reachable back from anywhere in the module.
- [ ] Choosing a protocol and returning to the host **visibly changes the card** — this is the whole loop the module has with its host.
- [ ] Plan leads with the shortlist on a first visit and with browse once anything is held; search works in both.
- [ ] Search matches markers and drug names, not just titles.

---

# TICKET B — Backend (Phase 1)

## What this phase is really building

Phase 1 is **concierge with a system of record**. Matching, predictions, lab coordination and the clinical read are all done by humans. The backend's job is to **capture what they did, in a form that can be automated later** — not to automate it now.

That framing decides everything below: the ops console is not a nice-to-have, it is where half the product lives.

## Entities

```
user
  id, phone, email, locale, created_at

intake                          -- versioned; question sets will change
  id, user_id, schema_version, answers jsonb, completed_at

protocol                        -- catalogue header
  id, slug, title, goal_sentence, category, weeks,
  scored_on text[],             -- ['ApoB','hsCRP']
  needs_blood enum(no|maybe|yes), price_minor, currency, active bool

protocol_version                -- ⚠ IMMUTABLE. see note 1
  id, protocol_id, version, published_at, published_by, content jsonb

protocol_item
  id, protocol_version_id, kind enum(peptide|glp|supp|iv|habit),
  title, dose, timing, needs_rx bool, sort

recommendation                  -- what we OFFERED, see note 2
  id, user_id, created_at, created_by,           -- clinician or 'rule:v1'
  items jsonb                                    -- [{protocol_id, rank, reason, match_score}]

run                             -- one user × one protocol. N per user.
  id, user_id, protocol_version_id,
  status enum(saved|booked|ready|shipping|running|verdict|reviewing|done),
  day int, total_days int, started_on date,
  recommendation_id,            -- which offer produced this
  created_at, updated_at

run_status_event                -- append-only audit, see note 6
  id, run_id, from_status, to_status, actor_type, actor_id, reason, at

consult
  id, run_id, type enum(start|review), doctor_id, slot_at,
  status enum(booked|done|no_show|cancelled), notes, ended_at

amendment                       -- the diff IS the artefact
  id, consult_id, changed jsonb, added jsonb, flagged jsonb, created_by

order
  id, run_id, user_id, amount_minor, currency, status, psp_ref,
  idempotency_key unique, paid_at

shipment
  id, order_id, status, carrier_ref, shipped_at, delivered_at

lab_order
  id, run_id, purpose enum(baseline|retest), panel_code,
  lab_id, scheduled_at, collected_at, status

lab_result
  id, lab_order_id, lab_id, assay_method,
  collected_at,                 -- NOT received_at. see note 3
  raw jsonb, ingested_at

marker_value                    -- canonicalised, see note 4
  id, lab_result_id, marker_code, value numeric,
  unit, ref_low, ref_high, flag enum(low|normal|high)

marker                          -- the dictionary
  code PK, display, canonical_unit, aliases text[],
  conversions jsonb, higher_is_better bool

prediction                      -- ⚠ IMMUTABLE, PRE-DATED. see note 5
  id, run_id, marker_code | subsystem_code,
  predicted_delta numeric, basis text,
  predicted_at, predicted_by,   -- clinician id, never a service account
  UNIQUE(run_id, marker_code)

log_entry
  id, run_id, day int, kind enum(dose|weight|meal|checkin),
  value jsonb, logged_at, source enum(user|device|ops)

verdict
  id, run_id, outcome enum(worked|part_worked|did_not),
  basis enum(markers|delivery),
  delivered_share int,          -- observed/predicted × 100
  read text, recommendation jsonb, stop_list text[],
  authored_by, authored_at, published_at
```

## Six notes that are the actual engineering

**1 · Protocol content must be immutable per version.** Edit "Longevity" while 20 people are running it and every one of their verdicts becomes unreadable — you can no longer say what they took. `run` references `protocol_version_id`, never `protocol_id`. Publishing an edit creates a new version; running users stay pinned.

**2 · Store the recommendation, never recompute it.** You must be able to answer "what were they shown at the moment they chose?" six months later. If the display recomputes, the shortlist changes as the rule changes and your conversion data becomes meaningless. This table is also the **only** way to evaluate the Phase 2 matching engine — it's the human baseline.

**3 · Lab provenance decides whether a verdict is valid.** Store `lab_id`, `assay_method` and `collected_at` (collection time, not receipt). **A verdict where baseline and retest used different labs or assays must be flagged and must not publish silently.** The product's central claim is a before/after comparison; a comparison across assays isn't one.

**4 · Marker canonicalisation is the most underestimated work here.** Labs return `ApoB` / `Apolipoprotein B` / `APO-B` in `mg/dL` or `g/L`. Build the `marker` dictionary with aliases and conversions on day one and normalise on ingest. Retro-fixing this after 200 results exist is a migration nobody wants.

**5 · Predictions are immutable and must pre-date the run.** This is the integrity of the entire product. Enforce in the database, not in code:
- `INSERT` only. No `UPDATE`, no `DELETE`. Revoke the grants.
- Reject any prediction where `predicted_at > run.started_on`.
- `predicted_by` must be a clinician identity, never a service account.

If a prediction can be edited after the result is known, predicted-vs-observed is theatre and the one defensible thing Valeo has is gone.

**6 · The state machine is server-owned, with guards.** The prototype runs it in a client reducer; that must not ship.

```
saved → booked      : consult created
booked → ready      : consult.status = done AND amendment exists
ready → shipping    : order.status = paid
shipping → running  : shipment delivered      → sets day=1, started_on
running → verdict   : day >= total_days
verdict → reviewing : review consult created
reviewing → done    : verdict.published_at set
```

Guards that must reject, not silently pass: pay before `ready`; start before delivered; publish a verdict before a retest `lab_result` exists.

## API

```
GET    /home-card                        → ONE resolved card for the host home
POST   /intake                          → { intake_id }
GET    /recommendations                  → persisted offer for this user
GET    /protocols?q=&goal=               → catalogue: search + browse
GET    /protocols/:id?version=           → header + items
GET    /runs                             → all runs, any status
GET    /runs/:id                         → run + stages + adherence
POST   /runs                             { protocol_id }        → status=saved
POST   /consults                         { run_id, type, slot } → booked
POST   /orders                           { run_id, idempotency_key }
POST   /logs                             { run_id, kind, value }
GET    /verdicts/:runId                  → verdict + predictions + observed
```

**Ops / internal** — half the product in Phase 1:

```
POST   /ops/recommendations              clinician sets the shortlist
POST   /ops/amendments                   what changed on the call
POST   /ops/predictions                  pre-run, immutable, signed
POST   /ops/lab-orders                   book phlebotomy
POST   /ops/lab-results                  ingest + canonicalise
POST   /ops/verdicts                     author read, then publish
GET    /ops/queue                        what needs a human right now
```

`GET /ops/queue` is the one nobody scopes and everybody needs — without it, "concierge" means someone querying the database by hand at 11pm.

`GET /home-card` looks trivial and is not: it must resolve nine states **by urgency** across an
arbitrary number of runs, and it is the most-hit endpoint in the product because it fires on
every host home render. Cache it per user, invalidate on any run transition. Resolving it on the
client would put the urgency ordering — a product decision — in three places at once.

`GET /protocols` search must cover marker names and drug names, not just titles. People search
`apob` and `tirzepatide`, not `Longevity`.

## Events (the point of the phase)

Phase 1 exists to produce signal. Instrument at minimum:

```
home_card_shown(kind) · home_card_tapped(kind)
intake_completed · recommendation_viewed · recommendation_selected(rank)
catalog_searched(query, results) · catalog_goal_opened(goal)
consult_booked · consult_completed · order_paid · shipment_delivered
run_started · log_created(kind, day) · run_day_reached(7|14|28|56)
retest_booked · retest_collected · verdict_published · verdict_viewed
second_run_started            ← the number the whole phase is for
```

`recommendation_selected(rank)` is the Phase 2 business case: if users mostly pick rank 1, a clinician's judgement is already good enough and matching is low priority. If they pick rank 2–3, choice matters and Phase 2 moves up.

## Backend acceptance criteria

- [ ] Two concurrent runs for one user, independent statuses; neither affects the other's reads.
- [ ] `UPDATE` on `prediction` fails at the database level.
- [ ] A prediction dated after `run.started_on` is rejected.
- [ ] Publishing a verdict without a retest `lab_result` is rejected.
- [ ] Baseline and retest from different `lab_id` or `assay_method` → verdict flagged, publish blocked pending override.
- [ ] Three alias/unit spellings of ApoB ingest to one `marker_code` and one canonical unit.
- [ ] Editing a protocol creates a new version; in-flight runs still resolve their original content.
- [ ] Duplicate `POST /orders` with the same idempotency key charges once.
- [ ] Every status transition has a `run_status_event` row with an actor.

## Explicitly out of scope for Ticket B

Matching engine · catalog search · subsystem/longevity scoring · device or wearable ingest · LLM anything · notifications beyond the retest-ready push · multi-currency.

---

## Sequencing note for whoever plans the sprints

The backend has one hard ordering constraint: **`marker` dictionary and `protocol_version` must land before any lab result or run is created in a real environment.** Both are painful to retrofit and both are invisible in a demo, which is exactly why they get deferred. Everything else can be built in any order.
