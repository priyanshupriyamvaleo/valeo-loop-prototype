# The Twin Schema — what every screen must write

**Why this document exists before any pixels.** Your constraint: every screen captures
structured data, because the same rows feed memory and the verification corpus. That makes
this a *design* document, not a backend one. If a screen can't name the row it writes, the
screen is decoration.

Each entity below carries a **UI consequence** — the thing about the schema that changes what
gets drawn.

---

## 0. The spine: one object, three surfaces

The single most important structure in the product is the **SealedPrediction**. It is not a
feature. It is the same object appearing at three different moments wearing three different
jobs:

| Surface | What the card is doing | User-facing form |
|---|---|---|
| **Commit** | The sales object | "We predict HbA1c 5.9 → below 5.7 by 12 Oct. Sealed." |
| **Act** (daily) | The adherence motivator | "Adherence 71%. This verdict needs 80%." |
| **Prove** | The scoring rubric | "We said below 5.7. You're at 5.6. Confirmed." |

Everything else in the schema exists to make that card honest.

---

## 1. Loop

The unit of retention. One completed Loop = one delivered value + one causal row.

```
Loop
  loop_id                uuid
  user_id                uuid
  goal                   enum  [weight_glp1, longevity, hair, energy, fertility, kids]
  loop_index             int          // 1 = first ever; drives Renew copy
  status                 enum  [baseline_pending, committed, active, retest_due,
                                retest_pending, verdict_ready, closed, abandoned]
  opened_at              ts
  expected_close_at      ts           // set at Commit, from the prediction due date
  closed_at              ts?
  predecessor_loop_id    uuid?        // how loops chain; the compounding record
```

**UI consequence.** `status` is the app's actual router. The home screen is not one screen —
it is eight, one per status. Most health apps have a static home and bury state in a card;
that's why they feel like a dashboard instead of a journey. `loop_index` matters too: loop 2
onboarding must never look like loop 1.

---

## 2. Panel and BiomarkerReading

```
Panel
  panel_id               uuid
  loop_id                uuid
  role                   enum  [baseline, retest, interim, ad_hoc]
  collected_at           ts
  reported_at            ts
  lab_id                 string
  assay_version          string       // ← the moat, see below
  fasting_state          enum  [fasted_8h, fasted_12h, non_fasted, unknown]
  collection_mode        enum  [home_phlebotomy, clinic, self_kit]
  time_of_day_bucket     enum  [early_am, am, pm]
  comparable_to          uuid[]       // panels this can be legitimately diffed against

BiomarkerReading
  reading_id             uuid
  panel_id               uuid
  marker_code            string       // LOINC — verify each against your lab's catalog
  value                  decimal
  unit                   string       // store canonical; convert at render
  ref_low / ref_high     decimal
  ref_population         string       // ranges are population-specific; KSA norms may differ
  flag                   enum  [low, normal, high, critical]
```

**`assay_version` is the whole business.** Two HbA1c results from different assays are not
comparable, and a verdict computed across them is fiction. This one field is the difference
between a verification company and a dashboard company. It is also the reason the retest must
be *pre-booked at Commit* — you're not just booking a test, you're reserving a matched assay.

**UI consequence, and it's a big one.** `comparable_to` means the Prove screen must be able to
say *"not comparable"* and offer a free re-draw. That is a designed state, not an error toast.
An honest product that occasionally says "we can't tell you yet, on us" is more trustworthy
than one that always has an answer. Also: `fasting_state` and `time_of_day_bucket` must be
captured at collection, which means the phlebotomy booking screen and the sample-collected
screen both write rows.

**Markers for the GLP-1 loop** (verify codes against your lab before building):
HbA1c `4548-4` · fasting glucose `1558-6` · fasting insulin `20448-7` · triglycerides `2571-8`
· HDL `2085-9` · LDL · total cholesterol `2093-3` · ALT `1742-6` · AST `1920-8` · hs-CRP
`30522-7` · TSH `3016-3` · creatinine `2160-0` · eGFR · ferritin `2276-4` · vitamin D `1989-3`.
Derived: **HOMA-IR** (glucose × insulin / 405) — the best single insulin-resistance readout and
a strong candidate for the primary predicted marker.

---

## 3. SealedPrediction — write-once

```
SealedPrediction
  prediction_id          uuid
  loop_id                uuid
  primary_marker         string       // exactly ONE. see below.
  baseline_value         decimal
  direction              enum  [decrease, increase, maintain]
  target                 { type: absolute|relative|threshold, value: decimal }
  window_opens_at        ts
  window_closes_at       ts
  adherence_floor        decimal      // e.g. 0.80 — PRE-REGISTERED, not chosen later
  protocol_id            uuid
  secondary_markers      string[]     // observed, not scored
  rationale              text         // shown to user; why this marker, why this magnitude
  sealed_at              ts
  sealed_by              enum  [clinician, model_reviewed, model_auto]
  immutable              true
```

**Write-once is not a technical nicety — it is the product.** A prediction editable after the
result arrives is worth nothing, and everyone who has ever run a study knows it. Pre-registration
is what converts "we generated advice" into "we made a falsifiable claim."

**`adherence_floor` must be sealed too.** If you decide after seeing a null that 62% adherence
was good enough, you've p-hacked your own corpus. Sealing the floor up front is also what makes
the daily surface honest: the app isn't nagging, it's holding you to a number you agreed to.

**Exactly one primary marker.** The temptation is to predict five things so something moves.
That's the clarity trap in statistical clothing — five shots at significance is how you generate
false verdicts. One scored marker, others observed.

**UI consequences.**
- The card renders as *sealed* — visually locked, timestamped, non-editable. The affordance
  should feel like a signed document, not a settings row. This is where the emotional design
  and the data integrity happen to want the same thing.
- `rationale` means the Commit screen needs a "why this marker" disclosure. Users who don't
  understand the bet won't value winning it.
- `adherence_floor` must be visible from day one on the daily surface, or the "your verdict is
  at risk" mechanic reads as a guilt trip invented late.
- Changing the protocol mid-loop invalidates the prediction. The app therefore needs an
  **amendment** flow: supersede the prediction, record why, and mark the loop's causal quality
  as degraded. Every product lets you change your plan; almost none records what that costs.

---

## 4. Protocol and InterventionComponent

```
Protocol
  protocol_id            uuid
  loop_id                uuid
  name                   string
  phases                 Phase[]  { index, label, starts_on, ends_on, intent }

InterventionComponent
  component_id           uuid
  protocol_id            uuid
  sku_id                 string       // ← binds to the real Valeo catalog
  substance              string       // 'tirzepatide'
  substance_class        enum  [rx_glp1, supplement, device, behavior, service]
  dose_value / dose_unit decimal / string
  route                  enum  [subcutaneous, oral, topical, iv, na]
  frequency_rule         string       // RRULE
  starts_on / ends_on    date
  titration_schedule     Step[]  { week, dose_value, conditional_on }
  role                   text         // user-facing: why this is in the stack
  is_scored              bool         // is this what the prediction tests?
```

**UI consequence.** `role` is mandatory and user-facing. This is the mechanism that enforces
"the store is walled off" — a product can only enter the protocol *with a stated job*. It makes
upsell structurally impossible to disguise as care. `titration_schedule` with
`conditional_on` means the dose ladder is a real object the timeline screen renders, not
copy in a PDF.

---

## 5. AdherenceEvent

```
AdherenceEvent
  event_id               uuid
  component_id           uuid
  scheduled_for          ts
  status                 enum  [taken, missed, skipped_intentional, late, unknown]
  actual_at              ts?
  dose_taken             decimal?     // may differ from prescribed
  injection_site         enum?  [abdomen_l, abdomen_r, thigh_l, thigh_r, arm_l, arm_r]
  source                 enum  [self_report, reminder_action, coach_confirmed, inferred]
  logged_at              ts
```

**`skipped_intentional` vs `missed` is a real distinction and almost nobody captures it.**
"I skipped because I was vomiting" and "I forgot" are different rows with different clinical
meaning and different recovery UX. One needs a clinician; the other needs a reminder.

**`source` protects the corpus.** Self-reported adherence is inflated; the schema should never
pretend otherwise. Verdict confidence must be weighted by source quality, which means the UI
should quietly prefer capture methods that produce better rows (notification-inline action >
manual entry > retrospective backfill).

**UI consequence.** Logging must be reachable in one tap from a notification, because
`reminder_action` is a higher-quality row than `self_report`. That's a data-quality argument
for a design decision — the best kind.

---

## 6. Observation — the daily numbers

```
Observation
  obs_id                 uuid
  loop_id                uuid
  type                   enum  [weight, waist, symptom, sleep_hours, steps, bp, mood, energy]
  value_num              decimal?
  value_enum             string?      // structured symptom code — never free text
  severity               int?         // 0–3
  measured_at            ts
  source                 enum  [manual, smart_scale, apple_health, ultrahuman_ring, coach]
  raw                    bool         // true = as-measured; trend is derived, never stored as raw
```

**Symptoms are enums with severity, never prose.** GLP-1 side effects are a bounded set —
nausea, vomiting, constipation, diarrhoea, reflux, fatigue, injection-site reaction,
hypoglycaemia. A chip grid plus a 0–3 scale captures a usable row in four seconds. A text box
captures a sentence nobody can query. Free text is a data-capture failure wearing a friendly UI.

**Raw vs trend.** Store raw, render trend. Daily body weight has ±1 kg of water noise, so a raw
number on the home screen manufactures despair on a normal Tuesday. Show the trend line as the
primary and the raw reading as secondary.

---

## 7. ConfounderEvent — the one nobody builds

```
ConfounderEvent
  confounder_id          uuid
  loop_id                uuid
  type                   enum  [illness, travel, ramadan_fasting, new_medication,
                                stopped_medication, major_stress, injury, pregnancy,
                                surgery, diet_change_unplanned, sleep_disruption]
  severity               enum  [minor, moderate, disqualifying]
  starts_on / ends_on    date
  source                 enum  [user_reported, coach_logged, inferred]
```

**This is the difference between a causal claim and a correlation.** Your entire thesis is that
verification is the scarce step, and verification means isolating cause. A user who caught flu
for two weeks, started a steroid, or fasted through Ramadan has a contaminated loop. If you
don't capture that, your corpus is the same observational mush Atropos and everyone else
already has — which is precisely the thing you said you'd beat.

**Ramadan is a first-class enum value, not an edge case.** A 12-week protocol starting in
January crosses Ramadan. Fasting changes dosing, weigh-in timing, and blood-draw conditions for
essentially your entire market. Handling it natively is both a data requirement and, I suspect,
a genuine regional differentiator.

**UI consequence — two surfaces, and the second one was a gift from the research.**

*Passive:* a prompt fired at the moment the data gets weird — "your weight jumped 1.8 kg in
3 days — anything going on?" That converts an anomaly into a labelled row instead of noise,
and reads as attentiveness rather than admin.

*Active — this is Oura's Rest Mode, and it's a direct structural match.* Rest Mode lets a
user declare a disrupted period; it suspends the Activity score and goal, reweights Readiness
toward recovery, **auto-suggests itself when elevated body temperature is detected**, and on
exit **ramps demands back gradually over a period equal to the time spent in it, capped at
seven days.**

Map that onto us exactly: a user-declarable **Pause** (travel, illness, Ramadan, Hajj, surgery)
that (a) writes a `ConfounderEvent` — *the pause UI and the confounder capture are the same
object*, (b) suspends the verdict-confidence countdown honestly rather than silently, (c)
shifts `window_opens_at`/`window_closes_at` and says so, and (d) ramps the protocol back in
proportion to the absence instead of dropping the user into a full day-one load.

This solves three problems with one control: it's the humane answer to absence (P2/G2's
required exit), it's the highest-quality confounder capture available (user-declared beats
inferred), and it makes Ramadan a first-class program state rather than an edge case.

---

## 8. Verdict

```
Verdict
  verdict_id             uuid
  loop_id                uuid
  prediction_id          uuid
  measured_value         decimal
  delta_absolute / delta_relative   decimal
  target_met             bool
  adherence_pct          decimal
  adherence_source_quality  enum  [high, mixed, low]
  confounders_present    ConfounderEvent[]
  status                 enum  [confirmed, partial, refuted, inconclusive]
  inconclusive_reason    enum? [adherence_below_floor, disqualifying_confounder,
                                assay_mismatch, retest_outside_window, insufficient_logging]
  confidence             enum  [high, moderate, low]
  issued_at              ts
  clinician_reviewed_by  uuid?
```

### Verdict resolution order (evaluate top-down, first match wins)

1. Assay not comparable → **inconclusive** (`assay_mismatch`) — *our fault, free re-draw*
2. Retest outside window → **inconclusive** (`retest_outside_window`) — *reschedule*
3. Disqualifying confounder → **inconclusive** (`disqualifying_confounder`) — *nobody's fault, extend*
4. `adherence_pct < adherence_floor` → **inconclusive** (`adherence_below_floor`) — *user's, honestly said*
5. Target met → **confirmed**
6. Right direction, target missed → **partial**
7. No change or wrong direction → **refuted** — *a valid, valuable result*

**The most important line in this document:** *inconclusive is four different screens, not one.*
Each reason has a different owner of the failure and therefore a different tone and remedy. A
generic "we couldn't determine a result" screen would destroy exactly the trust the honest
verdict was supposed to buy.

**`refuted` is a success state for the business.** It is a clean null — the thing your future
B2B customer pays for, and the thing that proves to the user you weren't just selling. It should
be designed with confidence, not apology, and it should immediately propose the next hypothesis.
Most of the category hides this. Owning it is cheap and differentiating.

---

## 9. What this schema forces onto the design

| Schema fact | Non-negotiable design consequence |
|---|---|
| `SealedPrediction.immutable` | The card must *look* sealed. Locked, timestamped, signed. |
| `adherence_floor` pre-registered | The floor is visible from day one on the daily surface. |
| Exactly one `primary_marker` | The result screen leads with one number, not a 40-row table. |
| `assay_version` + `comparable_to` | "We can't compare these — free re-draw" is a designed screen. |
| `Observation.value_enum` | Symptom capture is chips + a 0–3 scale. Zero free-text-only inputs. |
| `raw` vs trend | Home shows trend weight; raw is secondary. |
| `AdherenceEvent.source` | One-tap logging from the notification, because it's a better row. |
| `skipped_intentional` ≠ `missed` | The log needs a reason, and the reason routes the response. |
| `ConfounderEvent` | An anomaly-triggered "anything going on?" prompt, not a form. |
| `inconclusive_reason` (5 values) | Four+ distinct verdict-failure screens with different owners. |
| `Loop.status` (8 values) | The home screen is eight screens, not one dashboard. |
| `InterventionComponent.role` | Nothing enters the stack without a stated job. Upsell can't hide. |
| `loop_index` | Loop 2 onboarding ≠ loop 1 onboarding. |

---

## 10. Open questions for you

1. **Who seals the prediction** — a clinician per user, a model with clinician review, or a
   model auto-issuing from a rules table? This changes the Commit screen's trust signalling
   and it's probably an SFDA question as much as a product one.
2. **What is the adherence floor for GLP-1?** I'd start at 80% of scheduled doses and 70% of
   scheduled weigh-ins, but that should come from your clinicians, and once published it is
   hard to move.
3. **Is the primary marker HbA1c, HOMA-IR, or weight?** Weight is the thing users care about
   and moves fastest; HbA1c is the thing that sounds like medicine and justifies the retest.
   My instinct: **weight is the visible secondary, HbA1c or HOMA-IR is the scored primary** —
   "the numbers, not the mirror," which is already your line.
4. **Retest window width.** Narrow protects comparability; wide protects completion rate.
   These trade directly against each other and the answer sets `window_opens_at`/`closes_at`.
