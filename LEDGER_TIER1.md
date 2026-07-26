# Loop Ledger — Tier 1

The 13 frames that carry the two hypothesised leaks. Every frame answers six questions. No
frame gets drawn without a filled row.

**Metric baselines are deliberately blank.** A blank is honest; a guess would launder a
hypothesis into a fact. Fill them from Valeo's real funnel — that pull runs in parallel and
does not block design.

**Naming convention:** `C` = Commit surface, `P` = Prove surface. Mechanic references
(`M1`…`M33`) point at [REFERENCES.md](REFERENCES.md). Principles (`P1`…`P11`) and decisions
(`D1`…`D6`) point at [PLAN.md](PLAN.md). Schema entities point at
[DATA_MODEL.md](DATA_MODEL.md).

---

# COMMIT — the result → plan handoff

## C1 · Results are ready

| | |
|---|---|
| **Transition** | Activate → Commit. The entry point to the whole surface. |
| **Leak** | *"I got a notification, opened a PDF with forty numbers, felt vaguely anxious, and closed it."* |
| **Metric** | Push → open rate within 2h. Open → reached-prediction rate. Baseline: ___ |
| **Precedent** | **M18** LetsGetChecked's push carries the verdict itself — *"Your results: Normal."* The screen is opened by someone who already knows. **Anti: Function's 28-day gap** between results landing and the clinician note — the interpretive moment arrives four weeks after the emotional one, by which point the user has left. |
| **Capture** | `notification_id`, `sent_at`, `opened_at`, `channel` (push / email / SMS), `variant` |
| **Falsifier** | If <40% of pushes open within 2h, the copy is wrong, not the screen. Test three variants on the concierge cohort before building anything downstream. |

**Design calls.** The push carries the headline, not "your results are ready." Interpretation
ships *simultaneously* with the numbers — never a lag. And per **D1**, this frame has a
**web/email twin**: the read and the sealed prediction must be openable from a link, with the
app install asked for afterwards, *"to run the protocol."* Gating the results moment behind an
install would put a brand-new leak in front of the one we're fixing.

---

## C2 · The one thing that matters

| | |
|---|---|
| **Transition** | Commit — the read. |
| **Leak** | *"There were forty numbers and I couldn't tell which one was about me."* |
| **Metric** | 5-second comprehension rate. % reaching C4. Baseline: ___ |
| **Precedent** | **M9** Everlywell is the only product leading with a *sentence* rather than a score, count, or document metadata — but fix their error: they highlight `28 foods`, a count of **problems**, which produces dread and zero direction. **M3** Superpower's `GOAL 1 OF 3` — don't rank forty markers, *replace* them. **M8** Marek's page-2 signed clinician letter, which earns the right to use optimal rather than reference ranges. |
| **Capture** | `markers_viewed[]`, `dwell_ms`, `scroll_depth` |
| **Falsifier** | Five-second test. Flash the screen, ask "what's the one thing?" Fewer than 4 of 5 naming the right marker = fail. |

**Design calls.** Verdict sentence at the top, structured
`Your test shows [finding]. That makes you a candidate for [named protocol].` The one
highlighted number is **the count of things we're asking you to do** — three, not the count
of things wrong with you.

**M8 is load-bearing in KSA.** Western reference ranges fit the Saudi population poorly, so
we *will* be showing optimal ranges — which means we owe the user a named, photographed
clinician explaining why, before the first number. The commercial argument is
LetsGetChecked's own screen: testosterone at the 3rd percentile of range, awarded a confident
teal `✓ Normal`. **A reference-range binary hides exactly the population that would buy a
protocol.** *(Pending: the KSA track's read on whether a named clinician face raises or
lowers trust locally, and any SFDA constraint on the claim.)*

---

## C3 · The full panel, ranked by actionability

| | |
|---|---|
| **Transition** | Commit — the depth. Optional path. |
| **Leak** | *"I wanted to see everything and got an alphabetical list."* |
| **Metric** | % expanding. **And: does expanding reduce attach rate?** Baseline: ___ |
| **Precedent** | **M4** InsideTracker's printed impact score — deviation × evidence strength, the only defensible ranking claim in the category. **M7** Everlywell collapses normals into one grey row (`10 foods — Normal`). **M6** Marek's red-as-location. **M5** InsideTracker pairs every score with a remedy count in the same object. **Anti: Function** sorts 148 markers alphabetically on a triage screen. **Anti: Labcorp** ships `Only Show Out-of-Range Results` **default-off** beside a `10 Out-of-Range` badge — the triage is done and deliberately isn't the default. |
| **Capture** | `markers_expanded[]`, `sort_applied`, `filter_applied` |
| **Falsifier** | If this screen *lowers* Commit conversion, it's a leak wearing a feature's clothes — demote it behind the prediction rather than in front of it. |

**Design call.** Ordering is by impact score, never by panel, never alphabetically. Add the
**amber tier** Marek and LetsGetChecked both lack — their binary green/red produces cliff
effects at the boundary in both directions.

---

## C4 · The sealed prediction ★ hero

| | |
|---|---|
| **Transition** | Commit — the bet. **This is the frame the whole surface exists for.** |
| **Leak** | *"There was a plan, but no reason to believe it would work on me."* |
| **Metric** | **Protocol attach rate.** The single number this project is judged on. Baseline: ___ (pull from existing `glp-1-eligibility-blood-test` → protocol conversion) |
| **Precedent** | **M2** Superpower's Concierge sentence — `[dose] → [subjective outcome, SHORT horizon] → [objective marker, LONG horizon]`. **M1** their three-column strip `Health Impact / Recovery time / Priority`. **M15** Function's empty socket — the retest drawn as a hollow grey dot on a dashed line with its date printed, *before it exists*. **Noom's** milestone-annotated forecast curve, with our waypoints being clinical (maintenance dose reached, week-12 draw) rather than a wedding. **P7 / Cal AI** every input visibly moves the output. |
| **Capture** | `SealedPrediction` — full record, `immutable: true`, `sealed_at`, `sealed_by`, `adherence_floor`, `rationale` |
| **Falsifier** | **B5.** Render this one screen for users who already bought an eligibility panel and measure whether attach rate moves. One screen, no platform. If it doesn't move, the Commit hypothesis is wrong and Tier 1 should be re-tiered. |

**Design calls.**

- The card must **look sealed** — locked, timestamped, signed. A signed document, not a
  settings row. Data integrity and emotional design want the same object here.
- **`adherence_floor` is visible from this moment**, not introduced later when it starts to
  bite. That is what converts the daily surface from nagging into a contract the user agreed
  to (**P2**).
- **Exactly one scored marker** (**P6**, and the schema). Five shots at significance is how
  you manufacture false verdicts.
- **Target is a range, not a point.** Noom's real legal shield isn't the App Store
  disclaimer — it's saying "0.5–1 kg per week" three times and refusing unhealthy inputs. A
  range stays falsifiable: you land in it or you don't.
- **Never silently revise it.** Noom quietly improves its projected date ~21 screens later.
  If ours moves, it is a visible event with a reason attached.

**The copy spec, from outside health.** Forfeit states the commit triple in one sentence:
*"Say what you're going to do, when you're going to do it, and how much money you lose if you
don't do it."* Metric, date, stake. Fatebook adds the precision rule — *"'Probably' is
ambiguous, '80%' isn't"* — and resolves three ways: YES / NO / **AMBIGUOUS**. A forecasting
tool for rationalists is the closest working model of this card that exists.

**The failure mode to design against is Calibrate's, and it is exact.** They priced a health
outcome — a 10% weight-loss guarantee, the boldest promise in the category — and **never built
the instrument that scores it.** No goal line on the chart, no on-track state, no adherence
meter, no month-12 verdict screen, no outcome email. The year ends and the member files a
support ticket to discover they lost.

Worse, the *real* gate was hidden: the published terms require tracking *"at least 85% of the
time"* and not missing *"more than 4 consecutive, or 7 total, coaching sessions"* — disclosed
in legal, never surfaced in-product. **A member could fail on day 40 and learn on day 400.**
That is the origin of their BBB complaints.

So: **if adherence gates the verdict, the adherence meter is live from day one — or adherence
doesn't gate the verdict.** There is no honest third option. This is the strongest external
validation of making `adherence_floor` visible at C4.

**Marker choice is constrained by responsiveness, and ZOE proves it.** They *withdrew* blood
sugar and blood fat retests: *"our metabolic responses aren't likely to significantly change
over time."* A quiet admission that those scores are **traits, not states**. **Only put a
marker in the sealed prediction if it can actually move in 10–12 weeks.** That partially
resolves open question 1 below — it's a responsiveness test, not a preference.

---

## C5 · The protocol

| | |
|---|---|
| **Transition** | Commit — what am I actually buying. |
| **Leak** | *"It felt like a shopping cart with a doctor's logo on it."* |
| **Metric** | Attach rate. Component-removal rate. Baseline: ___ |
| **Precedent** | **M4** InsideTracker's card grammar: `[impact] [category tag] [imperative title] [frequency] [specific dose]` — frequency and dose on separate lines, deliberately redundant, because *cadence is the commitment and dose is the instruction*. **M10** Superpower's sticky card with a **`+`, not a "Buy"** — commerce dressed as protocol assembly. **Anti: Thorne** surfaces recommendations as inline hyperlinked product names into a store, a menu the user must assemble. |
| **Capture** | `InterventionComponent` per item — `sku_id`, `substance`, `dose`, `route`, `frequency_rule`, `role`, `is_scored` |
| **Falsifier** | Ask five users "what is each item *for*?" Any item they can't answer for is an item that shouldn't be in the protocol. |

**Design calls.** `role` is mandatory and user-facing — nothing enters the stack without a
stated job, which makes upsell structurally impossible to disguise as care.

**And the hard one: print the conflict.** The most damaging anti-pattern in the research is
Marek recommending into a green marker — *the moment you do that, the user re-reads the entire
result as advertising, retroactively, including the true findings.* Valeo is maximally
exposed: we sell the supplements, the drug, **and** the retest. Superpower already takes flak
for exactly this (*"the action plan recommends supplements Superpower sells"*). So the
protocol card carries a visible line marking which components Valeo sells and which it
doesn't. It costs some conversion and buys the credibility the entire verification thesis
runs on. **Absolute rule: never recommend into a green marker.**

---

## C6 · Consent and commit

| | |
|---|---|
| **Transition** | Commit → Journey. The purchase. |
| **Leak** | *"I bought the medication and never thought about the retest again."* |
| **Metric** | **% of protocol purchases with the retest pre-booked. Target 100% — it is not an option.** Baseline: ___ |
| **Precedent** | **Function** defines membership *as* twice-yearly testing, so the retest is bought at signup rather than sold at result time. **M27** Calibrate's contract sentence. **Noom's $62M settlement** — the funnel wasn't the problem, the cancellation architecture was: *sequencing is legitimate, friction asymmetry between joining and leaving is not.* |
| **Capture** | `adherence_floor_acknowledged_at`, `retest_window_booked`, `assay_version_reserved`, `consent_version`, `pdpl_consent` |
| **Falsifier** | If the flow permits buying a protocol without a retest, users will. Make them structurally inseparable and watch the drop — **if pre-booking the retest costs more than a few points of conversion, that's a finding, not a bug**: it means the retest isn't wanted, which invalidates a bigger assumption than this screen. |

**Design calls.** Pre-booking the retest isn't a scheduling nicety — per the schema it
**reserves a matched `assay_version`**, without which the week-12 comparison is fiction.
Say that plainly; it's a real reason, and real reasons convert.

Two commitments printed here, both of which are competitive weapons:
**(1)** an inconclusive verdict never routes to a charge — the retest is already paid for
(**P2/G3**); **(2)** results stay readable and exportable forever. ZOE's Terms delete your
test results when you cancel. *A fact about your own body is not a subscription feature.*

Cancellation must be at least as easy as purchase. Self-serve, in-app, no chatbot gate.

**Consider making the pre-paid retest expire.** Function's strongest return trigger isn't a
notification, it's structural: *"You must use your Mid-Year Test before your annual renewal…
it **doesn't roll over**."* That converts the return trigger into loss aversion on an asset
the member already owns — the honest kind, because the thing at stake is real. It also pairs
with the retest window the schema already needs for comparability. **InsideTracker** does the
adjacent version: the retest date is auto-set *at plan creation*, so the commitment is made at
maximum motivation, before the behaviour starts.

---

## C7 · Not eligible / nothing actionable

| | |
|---|---|
| **Transition** | Commit → exit, or → an honest alternative. |
| **Leak** | *"They took my money for a test and then told me nothing."* |
| **Metric** | Trust rating post-screen. % returning within 90 days. Baseline: ___ |
| **Precedent** | **M14** LetsGetChecked's duty-of-care split — abnormal HbA1c gets a *free* clinical call, high LDL gets a *$39 paid consult*. **Anti: Marek** renders creatinine red and gives it zero words; if you paint it red you owe a sentence. |
| **Capture** | `eligibility_result`, `reason_code`, `referral_issued`, `alternative_offered` |
| **Falsifier** | Do ineligible users rate trust **higher** after seeing this? If not, the copy is defensive rather than honest. |

**Design call.** **M14 forces a decision Valeo has to make deliberately: which abnormal
findings are duty-of-care and which are monetisable.** Deciding it accidentally is exactly how
a health company becomes a store. Write the list down before this frame is designed.

---

# PROVE — the retest reveal

## P1 · Retest due

| | |
|---|---|
| **Transition** | Journey → Prove. The return trigger. |
| **Leak** | *"The protocol ended and nothing happened."* |
| **Metric** | Retest booking rate inside `window_opens_at`…`window_closes_at`. Baseline: ___ |
| **Precedent** | **M15** Function's empty socket — the unfinished chart is a thing the eye wants closed, and it beats a "book your retest" button because it makes the **absence** salient. **LetsGetChecked's** one-word `↻ Repeat` in the result header. **Oura's** appointment-by-arrival-of-information — the reward precedes the ask. |
| **Capture** | `window_opened_at`, `booking_event`, `reminder_variant`, `days_to_book` |
| **Falsifier** | A/B the socket-completion framing against a plain reminder email on the concierge cohort. |

**Design call.** Native push is the return trigger, and it's the strongest argument for the
native-app decision (**§7 D1**). Copy names the *sealed prediction*, not the appointment:
"We said below 5.7 by 12 Oct. Let's find out."

---

## P2 · Sample collected → verdict pending

| | |
|---|---|
| **Transition** | Prove — the wait. 48h of dead air. |
| **Leak** | *"I gave blood and then heard nothing for a week."* |
| **Metric** | Drop during wait. App opens during wait. Baseline: ___ |
| **Precedent** | **Function** fills the empty period with **procedural specificity** — *"72 hours before, stop taking supplements"*, *"8 hours before, start fasting"* — rather than motivational filler. When you can't show the outcome, show the protocol; instructions are proof of a real process in a way a progress bar is not. **Quest** publishes status states with estimated delivery dates. |
| **Capture** | `fasting_state`, `time_of_day_bucket`, `collection_mode`, `lab_id`, **`assay_version`**, `collected_at` |
| **Falsifier** | Does filling the wait with the adherence summary — the evidence the verdict will be computed from — reduce drop versus a bare status bar? |

**Design call.** The wait is addressable inventory. Use it to show *what the verdict will be
computed from*: adherence record, quota met, confounders logged. It sets expectations before
the answer lands, which is also the humane way to pre-frame an inconclusive.

---

## P3 · The reveal ★ hero

| | |
|---|---|
| **Transition** | Prove — the moment. **The screen that does not exist anywhere in the category.** |
| **Leak** | None to cite. Nobody renders a delta, so nobody has leaked here yet. |
| **Metric** | **Loop 2 start rate.** The retention definition, made measurable. Baseline: ___ |
| **Precedent** | **M16** Shotsy's dose-segmented curve, applied to biomarkers instead of weight — *"at 5 mg your HbA1c moved 6.1 → 5.7."* **M17** Hims' vertical band scale with two points joined by a dotted line, `Prior result → Current result` — vertical because the axis is *value*, not time, which also sidesteps RTL mirroring entirely. **M15** the empty socket, now filled. **M17b** anchor to the baseline, never to a cohort average. |
| **Capture** | `Verdict` — full record including `adherence_pct`, `adherence_source_quality`, `confounders_present[]`, `confidence` |
| **Falsifier** | Show it to five concierge users and ask "would you do another one?" *before* mentioning price. |

**Design calls.** Staged, not instant: the sealed card the user last saw at Commit reappears
**closed**, then opens. It is the same object at its second moment (**the spine**, DATA_MODEL
§0). The dose ladder shares the time axis with the biomarker line — that overlay is the
genuinely new artifact, and it's exactly what the causal database exists to produce.

**Staged narration works; staged withholding does not.** Function proves the failure mode —
they had four weeks of natural narrative beats (first results at 48h, then ~30 more arriving
over a month, then clinician notes at day 28) and sent **one email**. A member's account:
*"no further notifications as additional tests drip dropped into my account."* Maximum
anxiety, minimum guidance, exactly inverted. WHOOP proves the success: a notification per
wave turns lab logistics into multiple return events.

**Verdict grading, resolution, and palette:**

- **Graded, not binary.** Two independent categories converged here: **Voy** (the closest
  commercial analogue — UK GLP-1) prorates its guarantee — *"if you lose only 8%… you would
  be eligible for a 20% refund"* — and **Manifold** ships a `PARTIAL` resolution for outcomes
  between yes and no. A binary win/lose on a biomarker will feel arbitrary at the boundary,
  and the boundary is where most users land. `partial` is a **designed state**, not a
  schema afterthought.
- **Resolution must exceed noise.** Levels concedes *"Scores are rounded to the nearest whole
  number, so small algorithm differences can shift the result"* — a 10-point scale where ±1
  is noise cannot support a credible delta. Same discipline as **P10**: match output
  resolution to the signal's noise floor, including assay CV.
- **Palette, already validated at scale:** Statsig renders experiment readouts as **green =
  significant win · red = significant loss · grey = inconclusive/not significant.** Map our
  brand tokens onto that grammar — but per **P9**, `refuted` is a *legitimate finding*, so it
  gets a serious colour, not an alarm colour. Grey is for inconclusive only.
- **Disclose n, on both arms.** WHOOP's Impact card prints `✕ 52  ✓ 34` under
  *"# of times you have logged yes or no to this behavior in the past 90 days."* The cheapest
  credibility in the category — it makes the claim falsifiable on its face. Borrow the
  n-disclosure and the hedged sentence shape; **do not** borrow their *"after accounting for
  other influences,"* which their own FAQ admits they can't actually do.
- **Make the number auditable.** Nutrisense decomposes a headline `Meal Score 9` into four
  named axes with bars — `PEAK 80/100`, `EXPOSURE 50/100`, **`STABILITY 10/100`** (red,
  near-empty), `RECOVERY 100/100`. A 9/10 that visibly contains a 10/100 is honest in a way a
  bare score never is. That is how verdict confidence satisfies **P10**'s transparency
  requirement without a formula dump.

**The primary action starts the next loop, in-screen.** WHOOP Advanced Labs ends its
recommendation card with a full-width **`✓ ADDED TO WEEKLY PLAN`** — not a post-reveal upsell
modal. The reveal ends by beginning loop 2.

**And keep it exportable — permanently.** WHOOP retired the Monthly Performance Assessment
and members were furious for a reason worth reading closely: *"I used to take the MPA to my
doctor for my annual physical"* and *"submit documentation for my company's wellness
reimbursement program."* They optimised for delight and destroyed the job-to-be-done. **The
Prove screen has that same external job**, and more so in KSA where a user will want to hand
it to a physician. So: exportable, shareable, and never expiring. WHOOP also puts a 34-day
window on Year in Review — a year of the user's own data — which collides head-on with the
doctor's-appointment use case. Don't.

---

## P4 · Verdict — confirmed

**Transition** Prove → Renew · **Metric** loop 2 start rate · **Capture** `status: confirmed`

**Precedent.** **M19** WHOOP's asymmetry — *credit is personal.* Green is the only band that
says "you." So: **"You did this."**

**Design call.** The next-loop offer appears, but **after** the news has landed — never in the
same visual beat. Function's MRI upsell borrows the out-of-range colour for a sales row;
that's a small dark pattern and it's the exact move to avoid at the moment of maximum trust.

---

## P4b · Verdict — partial

**Transition** Prove → Renew (adjusted) · **Metric** loop 2 start rate from a partial ·
**Capture** `status: partial`, `delta_absolute`, `delta_relative`

**Precedent.** **Voy** prorates its outcome guarantee; **Manifold** ships `PARTIAL`;
**Wealthfront** uses graded verdict words rather than pass/fail — `COMFORTABLE` /
`MANAGEABLE` / `MANAGEABLE STRETCH`.

**Design call.** This is probably the **modal outcome**, not an edge case — right direction,
target missed. Treat it as a first-class screen with its own copy, not a softened
`confirmed` or an apologetic `refuted`. The honest frame: *the direction is confirmed, the
magnitude needs more time or more dose* — which is a genuinely useful causal statement and a
natural bridge into loop 2 with an amended prediction.

---

## P5 · Verdict — refuted

**Transition** Prove → next hypothesis · **Metric** loop 2 start rate *from a null* — the
truest measure of whether the verification promise is believed · **Capture** `status: refuted`

**Precedent.** **M19** *deficit is physiological* — no "you", no "should", hedge with
"likely". **M20** WHOOP's claim rhetoric: hedged verbs, honest small effect sizes.

**Design calls.** **A refuted verdict is a success state for the business.** It is a clean
null — the thing a future B2B customer pays for, and the proof to this user that we weren't
just selling. Design it with confidence, not apology, and propose the next hypothesis
immediately: *the protocol was wrong, not you.*

Nobody in the category has this screen. Most hide the outcome entirely; ZOE architected the
problem away by anchoring to a cohort average so a null is never visible. Owning it is cheap
and it is the whole differentiation.

---

## P6 · Verdict — inconclusive ×4

**One reason per screen. Different owner of the failure, different tone, different remedy.**
A generic "we couldn't determine a result" would destroy precisely the trust the honest
verdict was meant to buy.

| Reason | Owner | Tone | Remedy |
|---|---|---|---|
| `assay_mismatch` | **Ours** | Apology, specific | Free re-draw, booked in the same flow |
| `retest_outside_window` | Shared | Neutral, practical | Reschedule; state the comparability cost |
| `disqualifying_confounder` | **Nobody's** | Matter-of-fact | Extend the protocol; the Pause already logged why |
| `adherence_below_floor` | **Theirs**, said kindly | **M19** register — no "you", no "should" | Extend and re-run; **the retest they already own** |

**Metric** — % who continue rather than churn, by reason. **Capture** — `status: inconclusive`,
`inconclusive_reason`, `adherence_pct` vs `adherence_floor`.

**Precedent.** **Levels** ships the cleanest execution in three words on a plain grey card:
**"No trend observed."** No spin, no filler insight. **WHOOP** names three distinct
inconclusive reasons rather than one — `Not Enough Data Yet` (gated at 5 yes / 5 no over 90
days), `Overlapping Behaviors` (*"WHOOP can't determine which behavior is driving the
impact"*), and greyed-out negligible effect. **Anti: Function's** undefined `Other` bucket,
rendered at equal visual weight beside In Range and Out of Range with no published definition
anywhere. If you ship an inconclusive state, **name it and define it.**

**Design calls.** The adherence variant shows the record as **methodology, not punishment**
(**M23 / Medisafe** — the consequence is a report your clinician reads, which is honest
because it's true). And the rule that protects the whole mechanic: **inconclusive never routes
to a charge.** If it ever looks like it drives a paid re-draw, the mechanic dies the day
someone posts that theory (**P2/G3**).

**Inconclusive must not be scored as a loss.** Metaculus distinguishes *Ambiguous* (the world
was too uncertain) from *Annulled* (the world was clear but a premise of the question was
overturned) — and **excludes both from your track record.** They don't hurt your Brier score.
Ours must work the same way: an inconclusive loop is excluded from the user's verdict history
and from the causal corpus, not counted against either. Otherwise the honest state carries a
penalty and everyone learns to avoid it.

**Consider an engineered null band.** Oura's Cardiovascular Age resolves to *Below* (6+ years
under), *Aligned* (±5 years), or *Above* (6+ years over). The deliberately wide neutral band
swallows most users into a non-judgment and only fires a real verdict at genuine deviation —
**which is what protects the verdict's credibility when it does fire.** Worth setting our
`partial`/`confirmed` boundary with the same instinct, sized to assay CV rather than to
whatever looks decisive.

---

# The three tests that would kill this design cheapest

1. **C4, on real users, this month.** Render the sealed prediction for people who already
   bought an eligibility panel and measure attach rate. One screen. If it doesn't move, the
   Commit hypothesis is wrong and the tiering should change before any more is built.
2. **C2 five-second test, on five people.** If they can't name the one thing that matters,
   nothing downstream matters.
3. **P3 shown to the concierge cohort at week 12**, asking "would you do another one?" before
   price is mentioned. That's the retention definition, tested directly, on ten people.

---

# Open questions this Ledger cannot resolve

1. **The scored primary marker** — HbA1c, HOMA-IR, or weight. My read stands: weight is the
   visible secondary, HbA1c or HOMA-IR is the scored primary. *"The numbers, not the mirror"*
   is already the line; let the schema honour it. Needs clinicians.
2. **Who seals the prediction** — clinician per user, model with clinician review, or model
   auto-issued from rules. Changes how C4 signals trust, and it is an SFDA question as much
   as a product one.
3. **The adherence floor.** Starting proposal 80% of doses / 70% of weigh-ins. Once published
   it is very hard to move, and **P2/G1** requires it be conservative enough that we never
   over-deliver a verdict we declared dead.
4. **Retest window width.** Narrow protects comparability, wide protects completion. Direct
   trade; sets `window_opens_at` / `window_closes_at`.
5. **Which abnormal findings are duty-of-care vs monetisable** (C7). Write the list down.
6. **The current post-blood-test deliverable.** Still the highest-value missing input — C1–C3
   are a direct replacement for whatever a Valeo user receives today, and I'm designing the
   replacement without having seen the thing.
