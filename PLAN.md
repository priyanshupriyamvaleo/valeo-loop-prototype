# Valeo UI Layer — Figma Build Plan v1

**Session goal:** a Figma prototype of the loop rendered for a human, plus the reasoning
framework that makes every frame defensible.

**Non-goal:** 30 equally-polished screens. That is decoration with a project plan attached.

---

## 0. Grounding facts (pulled from the crawl, not assumed)

These change the design, so they're recorded up front.

| Fact | Source | Design consequence |
|---|---|---|
| Market is **KSA** (`en-sa`), Riyadh-led, 19 city pages, Arabic blog content exists | `PRODUCT_TAXONOMY.md` §5, §4.3 | RTL + Arabic type is a live constraint, not a v2 problem. Poppins has no Arabic cut. |
| `glp-1-eligibility-blood-test` **and** `glp1-monitoring-blood-test` are already live SKUs | §2.1 | **You already sell the loop.** Baseline and retest exist as inventory. The leak is that they are sold as two unrelated products, never as one arc. This is the single most important finding in this doc. |
| `journey/weightloss`, `all-in-one-mounjaro-program`, `glp-1-starter-kit` exist | §3.1, §1.6 | The "program" container exists. We are re-rendering it, not inventing it. |
| 154 products, ~108 services, ~20 programs | §1–3 | The WHOOP clarity trap is not a future risk — it is your current state. |
| GLP-1 catalog is deep: Mounjaro/Ozempic/Wegovy/Rybelsus/Saxenda, dose-level SKUs | §1.1 | Dose titration is a first-class object in the data model, not a note field. |
| Ultrahuman Ring AIR is resold | §1.5 | A passive-data connect step is available for the Measure surface. |
| Brand: navy `#1B395B`, yellow `#FFB900`, warm sand/cream, teal/green/coral, Poppins + Fraunces | `Valeo_BioHarness_Prototype/README.md` | Design system starts from real brand, not a fresh palette. |
| BioHarness prototype already stages "a prediction on record (−7.5 kg)" | same | The sealed-prediction idea is already in your thinking. We are promoting it from demo beat to core UI object. |

---

## 1. The strategic call: tier the fidelity, don't spread it

Your own leak hypothesis says two transitions leak. So two surfaces get obsessive
treatment and everything else gets exactly enough to hold the story. Equal polish across
30 frames would mean the design work isn't actually pointed at a leak.

| Tier | Surfaces | Fidelity | Frames | Effort |
|---|---|---|---|---|
| **1** | **Commit** (result → plan) and **Prove** (retest reveal) | Production. Real copy, real numbers, every state including the ugly ones. | ~13 | **60%** |
| **2** | **Act** (daily logging) + **Memory** (the twin surface) | Functional. Happy path + the one failure state that matters. These are where structured data is captured and where the zombie forms. | ~8 | 25% |
| **3** | Onboard, Activate, Renew, account | Skeleton. Enough to click through and to see the loop close. | ~9 | 15% |

**One goal, end-to-end: GLP-1 / weight.** Not negotiable-by-default, for four reasons:
the loop is already operational as SKUs; the biomarker feedback is fast (weight daily,
HbA1c/lipids in 8–12 weeks); it's your highest-anxiety, highest-spend cohort; and the
verdict is unambiguous. Longevity fails all four — a 12-month loop with a fuzzy verdict
is the worst possible first design target.

---

## 2. The reasoning framework

### 2a. The Loop Ledger — every frame answers six questions

No frame enters the Figma file without a filled row. This is the anti-decoration clamp.

1. **Transition** — which arrow in Onboard → Activate → Commit → Journey → Prove → Renew.
2. **Leak** — the drop-off mechanic, written as a sentence the user would actually say.
   ("I got a PDF with 40 numbers and no idea what to do, so I closed it.")
3. **Metric** — the one number this frame moves, plus its current baseline (blank until
   you pull real data — a blank is honest, a guess is not).
4. **Precedent** — which reference, and the *one mechanic* borrowed. Not the aesthetic.
5. **Capture** — the structured event(s) this frame writes to the twin: field names,
   types, units. UI decision = data-model decision, per your constraint.
6. **Falsifier** — the cheapest test that would show this frame doesn't work.

### 2b. Six design principles that fall out of the thesis

**P1 — The sealed prediction.** Commit and Prove are *one object viewed at two times*.
At Commit the user sees a falsifiable promise: which marker, what threshold counts as a
win, by what date. At Prove, that same card opens and gets filled in. Nothing else earns
a retest, and nothing else makes "selling is sequencing" literally true — the plan sells
itself because it names a bet it can lose.

**P2 — Loss aversion on the answer, not on a streak.** *(Revised v1.2 — three guardrails
added after research.)* Duolingo's mechanic is loss aversion; the flame is its costume.
Ours: missed logs visibly degrade the *interpretability of the verdict already paid for*.

**Nobody in consumer health ships this.** Unproven, not disproven — the closest precedents
(Oura Rest Mode, Medisafe Medfriend, clinical-trial eDiaries) are all adjacent and weaker.
The one strongly transferable data point is Duolingo's: adding an eight-word plain-language
statement of the streak consequence produced a >10k DAU win. The lever was never the flame,
it was *stating the consequence explicitly*. That is precisely this bet.

Three ways it breaks, and the guardrail for each:

- **G1 — We must be able to defend the number statistically.** The first user who misses
  four days, retests anyway and gets a clean verdict has caught us lying, and unlike a
  streak there's no "it's only a game" escape hatch. Requires a pre-registered
  adherence-to-power function, set conservatively enough that we **never over-deliver a
  verdict we said was dead**.
- **G2 — It is a one-way ratchet toward despair unless we build the exit first.** A streak
  resets to zero and restarts tomorrow. "Your retest is now inconclusive" is *terminal for
  the cycle* — it removes any reason to log for the remaining 60 days. So: the threat and
  the recovery path appear **in the same sentence**, always. Never terminal, always
  conditional and reversible.
- **G3 — Never sell the repair, and never let failure route to a charge.** Cal AI sells a
  $0.99 Streak Restore; Duolingo sells Streak Repair. Fine in a game. Charging a patient to
  repair their adherence record means profiting from their failure. Harder version for us:
  **if "inconclusive" ever appears to drive a paid re-draw, the mechanic dies the day
  someone posts that theory.** The retest is pre-paid at Commit; an inconclusive verdict
  extends the protocol and uses the retest the user already owns. Repair is behavioural and
  free — extra logging days extend the window, on Duolingo's *earned* "Earn Back" model.

**Corollary — false-positive logging is worse than a missed log.** Duolingo has a documented
population completing one trivial lesson at 23:58. Our equivalent — tapping "taken" without
taking — silently corrupts the causal read instead of visibly degrading it. Design so that
lying is unattractive: "Skipped" must be a dignified first-class option (Apple Medications
does this), because a user with only "Taken" available either lies or goes silent.

**P3 — The one daily number is VERDICT CONFIDENCE, and it is banded.** *(Resolved v1.2 —
this was an open question; the research answered it.)*

A number earns a place on the daily surface only if it passes four tests: **novel input
since yesterday** · **attributable movement** (the user can name which input moved it) ·
**behaviourally sensitive** (something they do today changes it) · **bounded honesty**
(reports uncertainty when data is thin instead of defaulting to confident).

Bio-age fails all four. Trend weight passes two. **Verdict confidence passes all four by
construction** — it moves down on a miss and up on a log, every movement is attributable to
a specific event, it is entirely behaviourally sensitive, and it is a statement about
uncertainty. The daily number is not a health score. It is *confidence in the answer.*

**Band it; do not render a precise percentage.** WHOOP's discipline: the band is the
decision, the number is the justification. A 71% and a 74% must produce identical behaviour,
and banding enforces that by deliberately destroying precision the user shouldn't act on. A
precise interpretability figure invites users to read noise as signal — fatal for a product
whose pitch is epistemic honesty. Three or four bands, descriptive names, and follow Oura's
copy discipline: labels are directions to look, not judgments ("Pay Attention", never
"Poor"), and the **bottom band is the widest**, which compresses the emotional distance
between a bad state and a very bad one.

**Never show the score without the prescription.** WHOOP's real insight is the Recovery↔Strain
pairing: Recovery is a measurement you can't control, Strain is a target you can act on, and
one is never shown without the other. Ours: confidence score (measured) → today's protocol
list (actionable). A number with no adjacent action is anxiety.

**Bio-age moves to a separate tab.** Oura already solved this architecturally — Today holds
fast-moving metrics, My Health holds explicitly slow ones (Cardiovascular Age, Stress
Resilience) with quarterly and yearly cadence stated on the face of it. Copy the split
exactly. Bio-age is a Prove-day payload living on the slow tab, never a home-screen widget.

**P4 — The chat shows its work.** Every conversational input renders back as a structured
card: "Logged — semaglutide 0.5 mg, Tue 08:12." Two payoffs: memory becomes visible
(believable), and visible memory becomes user-corrected memory (free data cleaning).
Free-text that vanishes into a transcript is a data-capture failure wearing a chat UI.

**P5 — Failure states get equal design budget.** Your stated enemy is the paying,
non-adhering, never-retesting user. That user only ever appears on unhappy paths. Most
products design the happy path and let the leak live in the dark. We design
missed-logs, paused-protocol, slipping-retest-window, and **inconclusive verdict** at
the same fidelity as the wins. The "inconclusive" screen is the trust artifact of the
whole product.

**P6 — The reveal names exactly one number and one date.** *(Sharpened, v1.2 — see D3.)*
154 SKUs must never appear as a catalog inside the loop; products enter only as named
components of a protocol with a stated role and dose. But the enforceable version of that
is a constraint on the *reveal*, not the picker: one scored number, one date, everything
else demoted. Noom = one line + one date. WHOOP = one colour. Function = "100 in range,
14 out." This is also what the schema wants — exactly one `primary_marker`, because five
shots at significance is how you manufacture false verdicts.

**P7 — Every input must visibly move the output.** Cal AI's pace selector changes the
projected date in real time; Noom's does not, and teardowns caught it. For us this is
load-bearing rather than nice: a prediction the user can *feel* is unresponsive to their
inputs is worthless as a thing to be scored against later. If an intake answer doesn't
change the sealed prediction, don't ask it.

**P8 — Separate the obligation from the reward.** A user should be able to complete a full
day's adherence **without ever opening the app** — then the app becomes the place you go to
see what it bought you. Tap cost, cheapest first: HealthKit autopull **0 taps** (a smart
scale means the weigh-in is already logged — never ask a question the phone can answer) ·
interactive Home Screen widget, iOS 17+, **1 tap, app never launches** · notification action
button, **1 tap, backgrounded** · Siri App Intent, **voice** · Control Centre control, iOS
18+ · cold launch → log, **3–5 taps**, the thing we're avoiding. One spec trap to avoid:
**Lock Screen widgets are display-only, not interactive** — no tap-to-log there.

**P9 — Nothing is red, nothing is graded, and the only honest stakes are true ones.**
Noom renamed their food system's Red to **Orange**; one word of palette, materially
different emotional load — red reads *forbidden*, orange reads *spend carefully*. So:
missed days are never red, protocol items are **done / not-done, never good / bad**, and
confetti goes nowhere near a biomarker result.

On stakes: Medisafe's consequence for poor adherence isn't a broken flame, it's **a report
your doctor will read**. Externalising the record to a clinician does everything a streak
does — creates loss aversion, creates weight — with none of the credibility cost, *because
it is true*. Ours: the retest report shows the adherence record beside the verdict, framed
as **methodology, not punishment**.

The line, stated precisely: **a game mechanic is acceptable when it is a true statement
about the user's health, and corrosive when it is a proxy invented to drive engagement.**
A streak counter is a claim about attendance; attendance is not health; every user
eventually notices, and the moment they do they discount everything else on the screen —
including the real numbers.

Worth sitting with: **Oura has no streaks, no badges, no leagues, no points** — 4.9★ on
272k ratings, premium subscription, category-best retention. **Apple's Medications has
zero game mechanics** — the most-distributed medication adherence tool on earth, built by
the most conservative product organisation in consumer tech, facing exactly our question.
That is their answer.

**Copy rule that falls out of WHOOP's bands — credit is personal, deficit is
physiological.** Green: *"**You** are well recovered and primed to perform."* Red: *"Rest is
**likely** what **your body** needs."* The red band has no "you", no "should", no failure
language, and hedges with "likely" — the agent is your physiology, not you. Green is the
only band that says "you". It costs nothing and it is most of the softening. Apply it
verbatim to inconclusive and refuted verdicts.

**P10 — Our score must be transparent, because theirs can't be.** The hardest competitive
fact in the research: a 2025 peer-reviewed review of 14 composite scores across 10
manufacturers found that **no manufacturer discloses how inputs are weighted, and not one
score has been validated against an actual outcome** (Doherty et al., *Translational
Exercise Biomedicine* 2(2):128–144). WHOOP Recovery has never been shown to predict the
thing it claims to predict. Two rings can read identical HRV and return a 61 and an 84.

Their opacity is load-bearing — an undisclosed weighting can't be argued with, can't be
gamed, and can be silently retuned. **We cannot use it.** A company whose entire pitch is
*verification* cannot ship an unvalidated black-box composite next to the verdict it sells;
it poisons its own well. So verdict confidence must be fully inspectable: tap it and see
exactly which events moved it and by how much. That is a differentiator competitors
structurally cannot copy, because copying it means giving up their opacity.

Three corollaries, all cheap at design time and expensive to retrofit:

- **Clamp the range; never show 0 or 100.** WHOOP renders 1–99. A 0 reads as "you are
  dead"; a 100 reads as a solved problem with nothing left to buy.
- **Match output resolution to the noise floor.** WHOOP's HRV limits of agreement (±5.93%)
  *approach or exceed the smallest worthwhile change*, on top of 3–13% natural day-to-day
  variability. The band is defensible; the integer is theater. Ship the band as the claim
  and the number as texture.
- **Have a real answer for "why is this weird today," or don't ship the number.** When
  WHOOP's score contradicts felt experience, its AI coach cites *"proprietary algorithms
  and established science"* and support suggests adjusting band placement. That converts a
  measurement complaint into a trust collapse.

**P11 — Self-report must never be able to flatter the verdict, and personal causal claims
are gated on variance.** WHOOP's Journal is strictly *read-only* with respect to the
Recovery score — which is precisely what keeps its correlations meaningful and forecloses
gaming in one stroke. Our version: adherence logs move **confidence in the answer**, never
the answer. The verdict is computed from the biomarker, which cannot be faked. That makes
false-logging self-defeating rather than merely discouraged — you buy a prettier confidence
bar and lose the answer you paid for. Weight confidence by `adherence_source_quality`
(scale-via-HealthKit > notification action > retrospective backfill) and show the weighting.

And WHOOP's gate on personal correlations is the best statistical hygiene in the category:
**5 "yes" and 5 "no" entries within 90 days** before it will compute *your* correlation. It
requires **variance, not volume** — a behaviour you do every single day is uninsightable.
Population-level claims ship immediately; personal ones are earned; the two stay visually
distinct. Note also their claim rhetoric: hedged verbs only ("tended to", "associated
with" — never "causes"), and honest small effect sizes ("12 more minutes of sleep") whose
credibility comes precisely from their smallness.

---

## 3. Frame inventory (~30)

### Tier 1 — Commit: the result → plan handoff
1. Results-ready entry (notification + open state)
2. The one thing that matters (single-marker read, not a 40-row table)
3. Full panel, ranked by actionability
4. **The sealed prediction card** — marker, threshold, date, what "win" means
5. Protocol detail — components map to real Valeo SKUs with stated roles
6. Consent + commit — **retest pre-booked at purchase**, not sold again later
7. Failure: not eligible / nothing actionable → what happens instead

### Tier 1 — Prove: the retest reveal
8. Retest due (return trigger)
9. Sample collected → "verdict in 48h" waiting state
10. **The reveal** — predicted vs measured, side by side
11. Verdict: it worked → loop 2 offer
12. Verdict: it didn't work → what changes (the trust screen most products hide)
13. Verdict: inconclusive (adherence too low) → the honest one

### Tier 2 — Act + Memory
14. Daily home (minimum viable surface)
15. Log weight — the 10-second interaction
16. Log dose — structured, dose-aware, titration-aware
17. Log side effect / symptom — chips and scales, zero free text
18. Coach chat with structured extraction cards (P4)
19. Adherence at risk — the intervention (P2)
20. The twin: "what Valeo knows about you", correctable
21. Protocol timeline / phase view

### Tier 3 — Skeleton
22. Goal pick · 23. Intake · 24. Eligibility → baseline recommend ·
25. At-home phlebotomy booking · 26. Sample processing ·
27. Consult scheduling + prep · 28. Consult summary ·
29. Renew / loop 2 · 30. Plan management

Plus: design-system page, reference board, and an annotation layer carrying each frame's
Ledger row directly on the canvas.

---

## 4. Tooling: how we actually produce the Figma file

**Decision: do not drive Figma node-by-node over MCP. Treat Figma as a compile target.**

Why: a write-capable Figma MCP (the plugin+websocket bridge type) issues one RPC per
node. Thirty screens is on the order of 1,500–2,000 node operations, and every design
iteration re-pays that cost. It is slow, brittle, and it puts the bottleneck on plumbing
instead of on the two screens that matter. The *official* Figma MCP runs the other
direction — Figma → code — which is the wrong way for authoring, but genuinely useful
for reading an existing brand file and for dev handoff later.

### The pipeline

```
Loop Ledger (SPEC.md)          ← the reasoning, reviewed before any pixels
        ↓
tokens.json + component sheet  ← one source of truth, CSS vars ≡ Figma variables
        ↓
HTML screens at 390×844        ← I build these; iterate live in the browser
        ↓                         (this is ALSO your user-test instrument)
html.to.design (Figma plugin)  ← import: real text layers, auto-layout, editable
        ↓
Figma pass: componentize,
bind variables, wire prototype,
paste Ledger annotations       ← ~1 focused day, ideal job for a human designer
        ↓
Annotated Figma prototype
```

**The side benefit is the main benefit.** The HTML stage gives you a clickable,
phone-sized prototype *before* the Figma file exists. Figma frames test badly with
users; a thing they can tap tests well. So the cheapest test of your Commit hypothesis
becomes available at step 3, not step 6.

**Where Figma MCP does earn a slot:** (a) official read-MCP pointed at your existing
brand/design file, if one exists, so tokens are inherited rather than reinvented;
(b) dev handoff at the end.

**"Will Claude design work?"** — yes, for authoring. I produce the screens directly as
high-fidelity HTML/SVG and iterate in seconds. What I can't do natively is *land clean
layered geometry in Figma*; that's the html.to.design bridge plus one human pass.

---

## 5. Phases

| Phase | Output | Blocks on |
|---|---|---|
| **0 — Lock the frame** | 4 decisions answered (see §7) | You, ~30 min |
| **1 — Reference mechanics** *(revised, see below)* | `REFERENCES.md`: one borrowed mechanic per app, specified precisely enough to build | Me, unblocked |
| **1b — Evidence pull** *(parallel, does not block design)* | 5 real funnel numbers + your current result deliverable | You |
| **2 — The Loop Ledger** | `SPEC.md`: 30 frames × 6 questions, plus the twin event schema | Phase 0 |
| **3 — Design system** | `tokens.json` + ~16 components, rendered as a live spec sheet | Brand answer |
| **4 — Tier 1 build** | Commit + Prove, all states, iterated hard | The bulk of the work |
| **5 — Tier 2 + 3 build** | Daily/memory, then skeleton | — |
| **6 — Figma assembly** | Import, componentize, wire, annotate | html.to.design access |
| **7 — Test protocol** | Per-surface falsifier, ready to run on the concierge 10 | — |

### Revised sequencing (v1.1) — vertical slice, not a 30-frame spec first

A 30-frame Ledger written before any pixels delays your first real reaction by a full
session, and it is exactly the failure mode your own notes flag. So:

```
2a  Ledger for Tier 1 only (13 frames)      → one tight doc, reviewed
3   Tokens + the ~16 components Tier 1 needs → rendered as a live sheet
4   Build Tier 1: Commit + Prove             → REAL PIXELS, your first reaction
—— gate: does this plug the leak? ——
2b  Ledger for Tier 2 + 3
5   Build the rest
6   Figma assembly
```

**The gate moves to after frame 4, not after the spec.** Cheapest place to kill a bad
idea is a rendered Commit screen you can look at and reject, not a table you agree with
in the abstract.

### Reference strategy without Mobbin

Mechanic-first, not screenshot-first — which is what P4 of the framework demanded
anyway ("borrow the mechanic, not the aesthetic"). Three sources, in order of value:

1. **Mechanic specification (me, primary).** For each of the six references I write the
   one borrowed mechanic precisely enough to build from: trigger, state model, copy
   pattern, what it costs the user to skip. Then you sanity-check it. This is 90% of the
   value and it needs no screenshots.
2. **App Store / Play Store listing screenshots (free, current, real pixels).** Every one
   of these apps publishes 5–10 real in-app screens on its store page. I can pull these
   in-browser. Good enough for a reference board.
3. **Duolingo installed on your phone, 5 minutes.** The single mechanic most worth
   *feeling* rather than reading about, and it's free. Oura/WHOOP need hardware,
   Levels/Noom need a subscription — skip those, my spec will carry them.

---

## 6. Blindspots I'm flagging now

**B1 — Native app: decided, with a designed mitigation.** *(Resolved — see §7 D1.)*
The risk stands: an install step now sits upstream of both known leaks, and your
existing users are web e-comm buyers. It is bought back by push notifications, which
are the natural return trigger for the retest reveal and are genuinely weaker on web.
The mitigation is D1: the Commit read and the sealed prediction get a link-openable
web/email twin, so the install is asked for *after* value lands, not before.
**Instrument the install step as its own funnel row from day one** — it is a new
transition and it must not be invisible.

**B2 — The daily task list in the prototype is probably wrong.** A GLP-1 protocol's real
actions are a weekly injection and a daily weigh-in. A six-item checklist on a day with
one real action manufactures failure and trains dismissal. Minimum viable daily surface:
one number in, one number out, days-to-retest visible.

**B3 — Arabic/RTL is a design-system decision, not a localisation ticket.** Deciding it
after 30 frames means rebuilding all 30.

**B4 — Your leak hypothesis is still unvalidated, and I'm going to design against it
anyway.** That's defensible only because the Ledger records it as a hypothesis with a
named falsifier per frame, and because Phase 1 runs in parallel. If the real numbers
come back saying Activate leaks worse than Commit, we re-tier — cheaply, because the
system and skeleton are shared.

**B5 — Because the loop already exists as SKUs, the Commit hypothesis is testable
without building anything.** Take 20 users who bought `glp-1-eligibility-blood-test`,
render one Commit screen, measure whether the protocol attach rate moves. That's a
one-screen test, not a platform.

**B6 — Some "gaps" in the category may be regulatory, not oversights. Check before
celebrating.** I flagged "nobody shows a forward dose schedule" as an open opportunity.
Then Noom's research came back: they deliberately **do not** expose a patient-facing
titration ladder — dose escalation is clinician-gated and delivered in chat — and they
explicitly position the product against FDA's **PDURS** (Prescription Drug Use-Related
Software) draft guidance, aligning content to approved labeling language. Their
side-effect logging feeds a content library and is **firewalled from the clinical
channel** for the same reason.

That reframes three of my "unoccupied position" findings as *possibly* deliberate
avoidance. Two are almost certainly safe (the retest delta and the verdict are our own
test data, not drug claims). But **the forward dose ladder and any UI implying we adjust
medication in response to logged symptoms need an SFDA/MoH read before they're
designed**, not after. Added to the KSA research brief.

Worth noting how much Noom hedges once you look: *"this association does not imply
causation"*, *"based on retrospective study of self-reported data"*, *"individual results
may vary."* Our sealed prediction is a stronger claim than anything Noom makes.

---

## 7. Decisions locked (v1.1)

| # | Decision | Consequence |
|---|---|---|
| 1 | **Native mobile app** | 390×844 iOS frames, safe areas, tab bar, native nav. **Push notification becomes a designed surface** — and it is the return trigger for the retest reveal, which is a real advantage over web. Cost: an install step now sits upstream of Commit. Mitigated by D1 below. |
| 2 | **Figma → designer polishes** | Needs clean layers, real components, bound variables, a proper design-system page. Does *not* need exhaustive engineering redlines. Visual craft bar is high — the designer must inherit something good, not a wireframe. |
| 3 | **All 6 goals in the picker; weight designed deep** | The goal picker is promoted from Tier 3 skeleton to a **Tier 2 designed frame**. See D2 — this turns out to strengthen P6 rather than violate it. |
| 4 | **No Mobbin/Refero** | Reference strategy in §5 Phase 1 revised: mechanic-first, not screenshot-first. |

### D1 — Install-step mitigation (consequence of native)
The results moment must not be gated behind an app install. Design consequence: the
**Commit surface needs a web/email twin** — a link-openable version of frames 1–4 that
delivers the read and the sealed prediction, with the app install positioned as
"to run the protocol", i.e. after the value has landed, not before. One extra frame,
and it protects the exact transition you believe leaks hardest.

### D2 — The goal picker ~~is a commitment screen~~ — **REVISED after research, v1.2**

**Original position (wrong):** six goals, five inert, and selecting weight *visibly closes
the others* to teach "one loop at a time."

**Why it's wrong.** Shown-but-inert **plus** mutual-exclusivity is the one configuration
that reads as a bait-and-switch: if tapping weight animates hair and fertility closing —
and those were never open — we are staging the foreclosure of a choice the user never
had. It also converts the first interaction into a *loss* at the exact moment we need
momentum. Loss aversion doesn't care that our intentions were pedagogical.

**Revised position — three parts:**

1. **Single-select, keep.** Justified not by conversion (no clean A/B evidence exists
   either way) but by **data quality**: a six-way multi-select yields "weight + energy +
   longevity" from nearly everyone, which is a personalization signal with no information
   in it and routes to nothing specific.
2. **Preview what opens; never animate what closes.** Headspace's mechanic — single-select,
   *no auto-advance*, and the top of the screen changes as you move between options,
   previewing the consequence before the choice is locked. Confidence reads as
   **specificity about what you get**, not as visible foreclosure of what you don't.
3. **The five unbuilt goals get WHOOP's grey-score treatment.** WHOOP renders the real
   Recovery score in grey during calibration — the actual UI, visibly disabled, **with a
   date**. That is the only pattern found in the research where an unbuilt feature *builds*
   trust instead of spending it. Ranked: real-but-dated-and-disabled > dated waitlist >
   undated "coming soon" (Apple has rejected apps over literal placeholder strings) >
   inert-and-closing (worst — theater about a foreclosed non-choice).

### D3 — The catalog-sprawl fight is won at the reveal, not the picker
The sharpest reframe from the research, and it moves a constraint from the user onto us.
154 products don't leak in through the goal picker — they leak in at the **plan reveal**,
where every unmentioned service lobbies to be mentioned. What the disciplined products
actually do: Noom shows one line and one date. WHOOP shows one colour. Function resolves
114 biomarkers to *"100 in range, 14 out of range."* ZOE compresses a microbiome to one
number out of 1,000.

So the enforceable commitment is not "you may only pick one goal." It is: **the reveal
names exactly one number and one date.** Get that right and the picker can be gentle and
the product still reads as focused. Get it wrong and no amount of door-closing at
selection will save it. *(This converges with the schema's* `SealedPrediction.primary_marker`
*being exactly one — the statistical argument and the clarity argument want the same thing.)*

### D4 — The daily surface is a state machine with one hero, not a checklist

Four corrections to "one number in, one number out":

1. **On an ordinary day the useful number is not weight — it's position in the dose cycle.**
   Shotsy leads with a pharmacokinetic decay curve: solid line for elapsed drug level, dotted
   projection forward, current value called out. A user on day 6 who suddenly feels hungry
   doesn't need their weight; they need to see the trough. **Weight is the outcome; drug
   level is the explanation.** No telehealth app in the category shows this. An indie app
   with 28k ratings at 4.84★ does.
2. **The weekly injection is not one action, it's a timed protocol.** MeAgain expands a Shot
   Day card to five clocked items — protein, hydration, pen to room temperature, *inject*,
   protein — each one a side-effect mitigation, and collapses it to nothing on the other six
   days. So: ~1 item on six days, ~5 on one day.
3. **A quota beats a streak.** Form Health: *"Weigh yourself 4 days each week to hit your
   monthly goal of 16 days"* with a 16-segment bar at 9/16. **A quota degrades gracefully;
   a streak shatters.** Identical structured data, no guilt cliff, and it composes cleanly
   with verdict confidence (P3) instead of competing with it. This replaces the streak
   entirely.
4. **There was no slot for side effects** — the single largest discontinuation driver, and
   the input that should be *driving* titration. One-in-one-out can't detect the week-5
   nausea that makes someone quit.

**The architecture: one state-switched hero + a demoted horizontal rail.** Lilly Health —
the manufacturer, the party with the most adherence at stake — landed exactly here: a
full-bleed hero, then daily items as a *horizontally scrolling chip rail*, deliberately not
a vertical to-do list. Five states worth designing:

| State | Hero |
|---|---|
| Ordinary day (6 of 7) | Dose-cycle position: PK curve, "day 4 of 7 · 5 mg · level falling". One [Log weight]. Trend primary, today's raw dot secondary. Nothing else above the fold. |
| Shot day (1 of 7) | The timed protocol, site pre-filled to next rotation position, barcode-scan fallback. |
| Days 1–3 post-shot | The structured symptom instrument — that's when symptoms occur and when the data is worth collecting. |
| Titration review week | The dose decision. Form Health's appointment-first hierarchy, with the weigh-in quota (13/16) and symptom summary presented as *the evidence for it*. |
| Week 12 | Retest, then the retest delta with the dose ladder on the same axis. |

### D5 — The unoccupied position, and it's the Prove screen

Be clear-eyed: **"we integrate blood tests" is not differentiation.** Hims already ships a
better version of Valeo's planned eligibility funnel — a three-band donut (`Optimal 66 / In
range 3 / Out of range 6`), health *areas* rather than raw panels, a named risk-factor list
(`A1c Out of range – 5.6%`, `BMI Elevated risk – 30`) terminating in *"You may be a candidate
for GLP-1 treatment."* Calibrate runs a more rigorous panel than we're planning (CMP, HbA1c,
lipids, TSH, CBC, uric acid at 3 and 12 months). Form Health tests quarterly.

What **nobody** does:

- Calibrate draws labs at 3 and 12 months and **never visualises the delta**
- Hims has a beautiful prior-vs-current visual that is **not tied to a drug or a dose** — a
  wellness product sold beside the pharmacy
- Found accepts lab uploads and **loses them**

**The unoccupied position is the closed loop: at week 12, show the retest against baseline
with the dose history on the same time axis.** *"At 5 mg your HbA1c moved from 6.1 to 5.7."*
That is Shotsy's dose-segmented weight curve applied to biomarkers instead of weight — and
it is the only thing in this entire landscape that would be genuinely new. It is also,
exactly, the artifact the causal-evidence database exists to produce. **This is the hero of
the Prove screen.**

### D6 — Two rules the category handed us

**Every logging screen must answer "what will this change?"** Calibrate's contract sentence is
the best line in the corpus: *"What you track becomes the data your Medical Team uses to
adjust your medication and it's what you and your coach use to refine and personalize your
goals."* It justifies structured logging without coercion by naming the clinical consequence.
Use their *contract*, not their **lock** — Calibrate gates the prescription on the daily
check-in, which works and is resented (*"I have to complete a series of multiple choice
questions every day or I cannot receive my prescription"*). Coercion produces compliance data,
not honest data, and for a causal database dishonest inputs are worse than missing ones.

**Logs must be editable and backfillable.** Ro won't let you edit a weight after 30 minutes.
Hers and Form Health have the same defect. An immutable, un-reviewable log trains users to
stop, and it means several competitors have *actively designed against* re-entry after an
absence. Nobody in the category has designed the "you stopped logging for 11 days" moment.

### Still needed, non-blocking
- **Arabic/RTL in v1?** (yes / English-only prototype / design tokens RTL-safe but frames EN)
- **Existing Figma or brand file** to inherit tokens from? Link if yes.
- **Five real numbers**, even rough: baseline-test buyers/month; % who then buy a
  protocol; % who complete a protocol; % who retest; % who start loop 2.
- **The current result deliverable** — screenshot or PDF of what a user actually
  receives today after a blood test. This is the single most useful input for Tier 1,
  because the Commit screen is a direct replacement for it.
- **Real anonymised panel results** for one GLP-1 user (baseline + retest) so the hero
  screens carry true numbers instead of lorem-biomarkers.
