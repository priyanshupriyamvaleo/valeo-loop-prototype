# The Mechanic Library

Borrowed mechanics, organised by the frame each one serves — not by product. Each entry is
specified tightly enough to build from. Sources are named so a designer can go look.

**The finding that governs everything below.** Two research tracks arrived at it
independently:

> **Nobody has solved the result→plan handoff, and nobody renders a delta on retest.**
> Superpower makes the only personal, dated, marker-specific prediction in the category
> (*"We'll reassess Ferritin in 8–12 weeks to confirm"*). Marek makes exactly one, for one
> of twelve out-of-range markers. **Not one product renders a verdict on whether the
> prediction came true.** That screen does not exist yet.

So the two hero surfaces aren't a bet on an under-served niche. They're an empty room.

---

## PART 1 — COMMIT (result → plan)

### M1 · The three-column contract strip
**Superpower.** Directly under the bad news, before any product:

| `Health Impact` | `Recovery time` | `Priority` |
|---|---|---|
| Heart health | **8 weeks** | High |

Converts a diagnosis into a contract. `Recovery time` is a committed, dated claim sitting
above the markers it should move. It is simultaneously the best mechanic in the category
and its biggest liability — *if you print it, you must render the verdict at week 8 whether
or not it went your way.* Which is exactly the thing we're building and they aren't.

### M2 · The prediction sentence — the single best line in the research
**Superpower Concierge.** Adapt this shape for every flagged marker:

> "Take 45–65 mg elemental iron every other day. **You'll notice steadier afternoons in 1–2
> weeks.** We'll reassess **Ferritin** levels in **8–12 weeks** to confirm."

`[dose] → [subjective outcome, SHORT horizon] → [objective marker, LONG horizon]`

The two horizons are load-bearing. The short one buys a cheap early win that keeps the user
adherent long enough for the retest to vindicate them. Superpower ships this in chat only,
for one question at a time. We ship it as the sealed prediction, for the scored marker,
on the Commit screen.

### M3 · Cap the problem set at three
**Superpower:** `GOAL 1 OF 3`, with a 5-pip segmented progress bar. Forty markers become
three goals, paginated. This is the answer to "how do you prioritise 40 rows" — you don't
rank them, you *replace* them.

Compare **Function Health**, the category leader: 148 markers, sorted **alphabetically**, on
a screen whose entire job is triage. They compute `16 Out of Range` and render it at the top,
then make you scroll an alphabetical index to find them. And **Labcorp** ships an
`Only Show Out-of-Range Results` toggle **switched off by default**, next to a badge reading
`10 Out-of-Range Results` — the triage is done, and deliberately isn't the default. That's
worse than no prioritisation, because it proves the omission was a choice.

### M4 · Rank with a stated formula, and print the number
**InsideTracker.** The only prioritisation claim in the category that survives scrutiny:

> "ordered by the highest impact score for you, based on **your current biomarker levels**
> and **the strength of the science** behind the recommendation."

Deviation × evidence strength. Rendered as `8.7 IMPACT` in a badge. Their card grammar is
worth copying whole:

```
[impact score] [category tag] [imperative title] [frequency] [specific dose]
    8.7          SUPPLEMENT    Increase your B12   7 days/wk   Take 500 mcg daily
```

Frequency and dose are separate lines and deliberately redundant — **cadence is the
commitment, dose is the instruction.**

### M5 · Score and remedy in the same object
**InsideTracker** category cards pair a ring gauge with a recommendation count:
`Metabolism · Needs work · 24 · 9 recommendations`. Bad news and its remedy are structurally
inseparable — the interface cannot deliver a problem without delivering the response. Same
instinct as WHOOP's never-show-Recovery-without-Strain-Target.

### M6 · Red is a location, not a legend
**Marek Health**, and it's the cleanest rendering idea found anywhere. One horizontal gauge
per marker:

- **In range:** grey flank | **green optimal band** | grey flank — *no red on the chart at all*
- **Out of range:** the flank *you are standing on* turns red, boundary to axis end; the
  opposite flank stays grey

Red becomes a position rather than a warning colour, so it retains meaning. An eye can scan
a long panel and find the problems without reading. Costs nothing to implement.

**Add the amber tier Marek and LetsGetChecked both lack** — their binary green/red produces
cliff effects in both directions (Marek renders AST at exactly the boundary as fully green).

### M7 · Collapse the normals
**Everlywell.** Abnormal rows are hoisted individually; everything normal crushes into one
grey line:

```
Eggs
  Egg White — Mild ●
  1 food — Normal ●
Legumes
  10 foods — Normal ●
```

Signal proportional to abnormality. For a 40-marker panel this is the right compression, and
it pairs with a severity-sorted accordion view (`Moderate Reactivity · 1 · ⌃`).

### M8 · Earn the right to redefine "normal" — before the first number
**Marek's page 2**, before any data: a signed letter from a *named* clinician, circular
headshot, white coat, **handwritten signature**.

> "You may notice that some of our recommendations are based on what we consider ideal blood
> ranges and may not match a typical 'reference range.' This is because we meticulously seek
> to achieve optimal lab values founded on evidence-based medicine and that of a young,
> healthy adult."

It's a consent gate, and it's what lets them then delete the standard reference range
entirely without the user feeling misled. **This matters doubly in KSA**, where Western
reference ranges fit the population poorly.

The commercial argument for optimal ranges is **LetsGetChecked's own screen**: testosterone
at 8.4 nmol/L against a range of 7.6–31.4 — roughly the 3rd percentile — awarded the same
confident teal `✓ Normal` pill as a mid-range value. *A reference-range binary hides exactly
the population that would buy a protocol.*

### M9 · The verdict sentence at the top
**Everlywell** is the only product that leads with a *sentence* rather than a score, a count,
or document metadata:

> "Your test showed IgG reactivity above normal to **28 foods**. Foods in the high, moderate
> and mild ranges are good candidates for a two-part elimination diet."

Structure: `Your test showed [finding]. That makes you a candidate for [named protocol].`
The protocol is named *inside the verdict*, before any data.

**But their highlighted number is a count of problems** — "28 foods" produces dread and zero
direction. **If you highlight one number in the verdict sentence, make it the count of things
you're asking the user to do. Three, not twenty-eight.**

### M10 · The `+`, not the "Buy"
**Superpower's** sticky bottom card survives scroll, physically attached to the finding:
product name, dose instruction, thumbnail, and a circular **`+`**. Commerce dressed as
protocol assembly. One plan, one dose — not a menu.

Contrast **Thorne**, which surfaces recommendations as inline hyperlinked product names into
a store — a menu the user must assemble themselves.

### M11 · Presuppose the commit in prose
**Marek** has *no button anywhere* in 27 pages. The transition to purchase is a grammatical
presupposition, repeated ~10 times:

> "Your medical provider will advise you on the optimal dose during **your upcoming patient
> exam**."

Not "book a consult." *Your upcoming patient exam* — asserted as an existing fact. Worth
holding as a tonal option for the consult step, where a hard CTA would cheapen it.

### M12 · The escalation card with a printed SLA
**Superpower.** Below the AI answer, a bordered card: three overlapping clinician headshots ·
🕐 `< 24h on weekdays` · **`Message your clinician?`** · *"Ask about complex topics"*. Below
it, greyed: *"Ask your Superpower AI — simple questions, advice and analysis."*

AI for simple, human for complex, **with the response time printed on the handoff**. Cheap to
build; lets the AI be useful without pretending to be a doctor.

Related trust gradient — **Function** badges `Private AI Chat` with `BETA` and leaves
`Clinician Notes` unbadged. Deliberate, and it works.

### M13 · Two dates, not one
**Labcorp's** provenance block: `Service date 03/27` and `Report date 03/31`, separately.
The difference between *what my body was doing* and *when I learned it*. Consumer health apps
universally collapse these into one wrong timestamp. Our schema already separates
`collected_at` from `reported_at` — render both.

### M14 · Decide which abnormalities are duty-of-care and which are monetisable
**LetsGetChecked** splits explicitly: abnormal HbA1c → **free** clinical phone call. High LDL
→ **$39 paid consult**. One abnormality gets care, the other gets a checkout.

That segmentation is the most transferable strategic decision in the research and it maps
straight onto the GLP-1-vs-general-wellness split. **Decide it deliberately and write it
down**, because doing it accidentally is how a health company becomes a store.

---

## PART 2 — PROVE (the retest reveal)

### M15 · The empty socket — draw the retest before it exists
**Function Health**, and it's the primitive the whole loop wants. On every biomarker trend
chart, four x-positions: `May 24 · Dec 24 · Jun 25 · Dec 25`. Three have data. The fourth —
the next scheduled draw — is a **hollow grey dot on a dashed grey line, with its date
printed**.

The y-axis isn't numbers, it's two stacked colour bands (`Above / >90`, `In Range / <90`).

**It makes the *absence* of the retest the salient object.** Far stronger than a "book your
retest" button, because an unfinished chart is a thing the eye wants closed. Function built
this and then attached nothing to it — no delta view, no verdict, no comparison. The socket
is ours to fill.

### M16 · The dose-segmented outcome curve — the unoccupied position
**Shotsy** (indie, 28k ratings, 4.84★) plots weight as a single line **colour-segmented by
the dose in effect**, with a pill badge at each titration point: `2.5mg` → `5mg` → `7.5mg` →
`10mg` → `12.5mg` → `15mg`.

One chart answers *"did the dose increase do anything?"* — which is the question the entire
causal database exists to answer. **Apply it to biomarkers instead of weight and you have the
Prove hero:** *"At 5 mg your HbA1c moved 6.1 → 5.7."*

Nobody does this. Calibrate draws labs at 3 and 12 months and **never visualises the delta**.
Hims has a beautiful prior-vs-current visual **not tied to any drug or dose**. Found accepts
lab uploads and loses them. Function's diffing lives in a chat query you have to think to ask.

### M17 · The before/after form that works
**Hims** `Biological Age`: a **vertical band scale** (`Out of range` / `In range` / `Optimal`)
with two plotted points connected by a **dotted line**, labelled `Prior result` → `Current
result`, plus a delta chip (`↑ 3% from last year`).

Vertical is the right axis choice for a two-point comparison — it sidesteps the RTL
time-axis problem entirely, since the scale is *value*, not time.

### M17b · Anchor to your past self, not to the cohort — the ZOE contrast
The most instructive negative case in the research, because ZOE is the closest structural
analogue to Valeo and they made the opposite choice.

ZOE **monetises** the retest — £149 repurchase, a stated *"we recommend doing so every four
months"* cadence, retesting written into their Terms — and then **does not design the retest
reveal at all.** No comparison to last test, no delta, no arrow, no trend line, no reveal
moment, and no retest marketing surface anywhere. The score screen is a stateless
point-in-time state.

Their "is this good?" anchor is **social**: `Typical ZOE member 450` (orange bar) above
`Your score 650` (green bar). The interpretive sentence is written to survive any outcome —
*"your gut health is on the right track but could still be improved"* reads identically
whether you went up, down, or nowhere.

**That choice conveniently makes null results invisible. It also means the product can never
deliver "you moved this."** ZOE has permanently foreclosed its own best emotional payoff in
exchange for never having to show a bad one.

Valeo's anchor must be **temporal — your baseline**. It's the only anchor that makes a
verdict possible, and accepting it is precisely what obliges us to design `refuted` and
`inconclusive` properly. The two decisions are the same decision.

*(One more tell: ZOE's own retest stat is "77% of ZOE members increased their microbiome
score by following our advice" — n=476, a single-arm pilot, presented adjacent to RCT
language. No page anywhere addresses the other 23%.)*

### M18 · The push notification carries the verdict
**LetsGetChecked** sends *"Your results: Normal."* The result screen is opened by someone who
already knows the answer. It's a genuine anxiety mechanic — and it inverts cleanly: on
results day, the push can carry the *good* news and let the screen carry the detail.

### M19 · Hedge deficits, own credits
**WHOOP's** band copy. Green: *"**You** are well recovered and primed to perform."* Red:
*"Rest is **likely** what **your body** needs."*

The red band has no "you", no "should", no failure language, and hedges with "likely" — the
agent is your physiology, not you. Green is the only band that says "you". Free, and it is
most of the softening. Apply verbatim to `refuted` and `inconclusive`.

### M20 · Claim rhetoric that survives scrutiny
**WHOOP's** correlation statements: hedged verbs only (*"tended to"*, *"associated with"* —
never "causes"), population framing, and **honest small effect sizes** (*"12 more minutes of
sleep"*, *"4 ms"*) whose credibility comes precisely from their smallness.

Their statistical gate is the best hygiene in the category: **5 "yes" and 5 "no" entries
within 90 days** before computing *your* personal correlation. It requires **variance, not
volume** — a behaviour you do every single day is uninsightable. Population claims ship
immediately; personal claims are earned; the two stay visually distinct.

---

## PART 3 — ACT (daily) and ONBOARD

### M21 · Asymmetry, not minimalism
**MeAgain** expands a Shot Day card to five clocked items — protein, hydration, pen to room
temperature, **inject**, protein — each a side-effect mitigation, and collapses it to nothing
on the other six days. **~1 item on six days, ~5 on one day.**

### M22 · The quota, not the streak
**Form Health:** *"Weigh yourself 4 days each week to hit your monthly goal of 16 days"* with
a **16-segment progress bar at 9/16**. A quota degrades gracefully; a streak shatters.
Identical structured data, no guilt cliff.

### M23 · The three-state dose response
**Apple Medications** and **Medisafe**: `[✕ Skip] [✓ Take] [⏰ Reschedule]`. **Skip is a
logged, dignified, first-class action** — a user with only "Taken" available either lies or
goes silent. Medisafe adds `Log All as Taken` for bulk.

Anti-pattern to design against explicitly: **Ro won't let you edit a weight after 30 minutes**;
Hers and Form Health share the defect. An immutable log trains users to stop, and it means
several competitors have actively designed *against* re-entry after an absence.

### M24 · The barcode scan
**Lilly Health:** `[⛶ Scan Barcode]` beside `[Log Dose]` captures product, strength and lot
with zero typing and zero transcription error. With Valeo's dose-level SKUs this is nearly
free, and it's what makes a self-reported record trustworthy enough for a causal database.

### M25 · The notification → flash → log interstitial
**WHOOP.** Tap the morning notification, the Recovery score appears for a moment, and the
Journal throws itself up as a modal in front of it. From a user: *"I can see my recovery for
a few seconds because the journal comes up."*

**The score is the hook; the log is the toll.** It is the highest-leverage adherence mechanic
in the category and the resentment in that quote is real. If we use it, mitigate with the two
things WHOOP's own power users beg for and still don't have: **copy-yesterday defaults** and
**conditional logic** (don't ask what a prior answer already settled).

### M26 · Rest Mode → our Pause
**Oura.** Suspends the Activity score and goal, reweights Readiness toward recovery,
**auto-suggests itself on detected fever**, and on exit **ramps demands back over a period
equal to the time spent in it, capped at 7 days.**

For us this is one control solving three problems: the humane answer to absence, the
highest-quality confounder capture available (user-declared beats inferred), and Ramadan as
a first-class program state. *The Pause UI and the `ConfounderEvent` write are the same
object.*

### M27 · The contract sentence on every logging screen
**Calibrate**, the best justification-for-logging line found:

> "What you track becomes the data your Medical Team uses to **adjust your medication**, and
> it's what you and your coach use to refine and personalize your goals."

It names the clinical consequence. Every logging screen should be able to answer *"what will
this change?"* Use their contract — **not their lock**: Calibrate gates the prescription on
the daily check-in, which works and is resented (*"I have to complete a series of multiple
choice questions every day or I cannot receive my prescription"*). Coercion produces
compliance data, not honest data.

### M28 · Preview what opens; never animate what closes
**Headspace's** goal picker: single-select, **no auto-advance**, and the top of the screen
changes as you move between options — previewing the consequence before the choice locks.

### M29 · The grey score with a date
**WHOOP's** calibration period renders the real Recovery score **in grey** for days 1–4, with
capabilities unlocking on a published schedule. Not a "coming soon" badge — the actual UI,
visibly disabled, on a promised timer. The only pattern found where an unbuilt feature
*builds* trust instead of spending it. This is how our five unbuilt goals should behave.

### M30 · Different scale grammars for received vs earned
**WHOOP.** Recovery is a **percentage** (received, uncontrollable, frozen at wake). Strain is
a **0–21 index** (earned, built by you, accumulates live). A percentage invites *"why isn't
it 100?"* — so it's used only for the thing you can't control. Putting a percentage on an
achievement metric makes every non-maximal day a failure.

For us: verdict confidence is *received* → band it. The adherence quota is *earned* → count
it (`13/16`), never a percentage.

---

### M31 · The pre-committed recovery message — the best adherence idea found
**Noom's Motivation SOS Plan.** Set up on **day 2**, while the user is still motivated: they
write their *own* message to their future lapsed self, and choose the channel (text, email,
or none) up front. It fires when app usage slows — *"skipping lessons, not logging meals, or
not opening the app."*

This is the answer to P2/G2 ("build the exit before you need it") in a form that cannot read
as nagging, because **it isn't the app talking — it's the user's past self.** Nothing else in
the research solves the guilt problem this cleanly, and it costs one onboarding screen.

Related, from the same product: **NoomCoin doesn't expire.** *"You'll only miss out on coins
for the days you don't complete your goals."* Non-punitive accumulation, not a resettable
chain — the same instinct as Form Health's quota (M22).

### M32 · The drug gets its own tab; the daily surface stays the loop
**Noom** puts medication in a separate `Care` tab — prescription card, dose-change requests,
shipping, clinician chat — and leaves `Today` as the behaviour surface. Their research
describes this as the single most important structural decision they made.

**Adapt, don't copy directly.** Noom is a behaviour-change company that bolted on a drug, so
separating them is right for them. Valeo is a *verification* company where the intervention
and the measurement are the same loop — so our daily hero should render the **loop state**
(D4's five states, dose included), while a separate `Care` tab holds the **clinical
relationship**: prescription, refills, dose-change requests, lab orders, clinician thread.
Loop on the hero, admin in Care.

### M33 · AI is the front door; humans are the escalation tier
**Noom's** routing rule, stated explicitly: *"Access to the team of Noom Coaches is through an
escalation from Welli."* Their clinician SLA is **36 hours, printed**. Welli is barred from
"medical or clinical advice." Same shape as Superpower's escalation card (M12) — and both
print the wait time on the handoff rather than hiding it.

Note also where Noom's labs live: **in the chat transcript.** *"Scroll back to your first
interaction to locate the PDF."* For the branded-meds program, results aren't rendered in-app
at all — users log into Quest or Labcorp. Noom sells a $125 at-home 17-marker kit whose stated
rationale is *"a real-time feedback loop connecting intervention to outcome"* and *"retest
later and track their progress"* — **they have articulated our exact thesis and not built the
screen.**

---

## PART 4 — THE ANTI-PATTERN LIST

Ranked by how much damage each would do to Valeo specifically.

1. **Never recommend into a green marker.** *Marek* renders testosterone fully green, says
   *"levels greater than 550 ng/dL rarely require any treatment"* — then immediately sells
   two pages of "adjunct treatment options." **The moment you recommend into green, the user
   re-reads the entire result as advertising, retroactively, including the true findings.**
   Valeo is maximally exposed here: we sell the supplements *and* the drug *and* the retest.
   Consider **printing the conflict** rather than hiding it.
2. **Never ship a derived/composite marker into an alarm state.** A *Superpower* reviewer got
   a flagged-high "bilirubin-to-albumin ratio" with both components normal; the AI explained
   it away as *"a mathematical artifact."* His conclusion is the killer: *"me not knowing if
   the AI can be trusted is another issue."* **One false positive contaminates every true
   positive.**
3. **Never let export be the loudest button.** *Labcorp's* primary CTA on the result screen is
   `Download Official Report`. The most emphasised action in their results experience is
   leaving with a PDF for someone else.
4. **Never sort by alphabet a screen whose job is triage.** *Function.*
5. **Never gate the emotional peak behind a login cycle.** *InsideTracker* forces FaceID on
   every launch; reviews are full of login loops at the results moment. It is a 3.4★ app
   wrapped around the best ranking logic in the category — the app eats the science.
6. **Never make a goal change lossy.** *InsideTracker* warns that changing your plan destroys
   your data. Protocols change; that must never cost history.
7. **Never place a share CTA under a bad number.** *InsideTracker* renders `Share your
   InnerAge` at fixed position beneath the gauge — so anyone whose biological age came back
   *older* is invited to broadcast it. Gate social on valence.
8. **Never offer `Reorder` beside `View Results`.** *Everlywell* offers to re-sell the test
   before you've read the first one.
9. **Never make the chat the landing surface.** *Superpower* reviewers: *"the AI is the first
   thing that pops up… AI is everywhere these days and while it can be a great tool, it's
   being overdone."* Note **WHOOP moved the other way** — replacing an open chatbot with a
   pre-composed *Daily Outlook* card. Free-form AI lost to a deterministic card.
10. **Never answer "why is this number weird" with authority.** WHOOP Coach cites
    *"proprietary algorithms and established science"*; support suggests adjusting band
    placement. That converts a measurement complaint into a trust collapse.
11. **Never log non-measurements.** *Found* offers `Celebrate` and `Support` as loggable
    "routines" — engagement events dressed as health data, inflating streaks and polluting
    the dataset.
12. **Never broadcast individual health events.** *Found* ships a public community feed:
    *"Sarah T. · 3 min · logged their meds · 26 👏"*. A privacy problem anywhere; a
    non-starter in KSA.
13. **Never sell the repair.** *Cal AI* charges $0.99 for Streak Restore. Charging a patient
    to repair their adherence record means profiting from their failure.
14. **Never silently revise a prediction.** *Noom* shows a projected date, then quietly
    improves it ~21 screens later.
15. **Never ship an input that doesn't move the output.** *Noom's* pace selector doesn't
    change the projected date, and teardowns caught it. *Cal AI's* does.
16. **Never hold results hostage.** *ZOE's* Terms: *"If your membership is cancelled … you
    will lose access to the ZOE app **and any Gut Health Test results**."* Cancel and your
    biology disappears. That is their real return trigger — stronger than any reminder
    email, and the thing most likely to surface as resentment in user research. For a
    company selling verification and trust it would be self-immolating: **the user paid for
    a fact about their own body, and a fact about your body is not a subscription feature.**
    Results stay readable and exportable forever. Say so at Commit — it is a *selling* point
    against every competitor in this list.
17. **Never make the win-back page the acquisition page minus the discount.** *ZOE's*
    reactivation flow renders the same hero and the same plans as new-user acquisition, only
    with the trial removed — so a returning member is charged more and greeted with nothing.
    No "welcome back", no acknowledgement of history. For a loop product, loop 2 onboarding
    that ignores loop 1 wastes the only asset the relationship has.

---

## PART 5 — WHAT THE CATEGORY PROVES ABOUT THE OPPORTUNITY

| Question | The category's answer |
|---|---|
| Who caps the problem set? | Only Superpower (`1 OF 3`). |
| Who states a ranking formula? | Only InsideTracker (deviation × evidence). |
| Who makes a personal dated prediction? | Superpower (in chat). Marek (once, in prose, for 1 of 12 red markers). |
| Who draws the retest before it happens? | Function (empty socket) — and attaches nothing to it. |
| Who renders a **delta** at retest? | **Nobody.** |
| Who renders a **verdict on the prediction**? | **Nobody.** |
| Who has an **inconclusive** state? | **Nobody.** |
| Who ties a biomarker change to a **dose**? | **Nobody.** (Shotsy does it for weight only.) |

The last four rows are the product.
