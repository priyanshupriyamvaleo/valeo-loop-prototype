# The Twin Flow — an alternate, desire-first entry into the same loop

**Status:** plan, not built. Step 1 of the ask.
**Extends:** PLAN.md (P1–P11, B1–B6), REFERENCES.md (M1–M33), KSA_CONSTRAINTS.md (R1–R8).
**New in this doc:** P12–P16, B7–B12, M34–M38, flow nodes DS1–DS14.

---

## 0 · The one-line read

The feedback is **not a redesign of our product**. It is a **new front door** onto it —
and it is a better front door than the one we built.

Our flow is *evidence-first*: measure, then interpret, then decide. It assumes a user
who already has a problem and will pay a high entry cost to understand it.

The feedback is *desire-first*: aspire, then browse, then commit, then measure. It assumes
a user with vague ambition and no acute pain — **which is most people, and a much larger
market.**

These are not in conflict. They are two entry ramps onto the same highway. The mistake
would be to treat this as a replacement for the loop. The loop is still the product. This
is how strangers get into it.

---

## 1 · Structural read — what the feedback actually proposes

Stripped of surface, it is a **six-stage conversion machine**:

| # | Stage | Mechanism | Precedent |
|---|-------|-----------|-----------|
| 1 | **Anthropomorphise the data** | "Your twin" — an agent with agency that works *for* you | Replika, Duolingo's Duo |
| 2 | **Extract the minimum viable profile** | 20% mandatory now, 80% harvested later | Bumble, LinkedIn profile strength |
| 3 | **Make the machine visible** | "Cooking / brewing" — theatre of computation | Levels, Whoop onboarding |
| 4 | **Convert browsing into preference data** | Swipe deck with match score | Bumble, Tinder |
| 5 | **Gate the good stuff behind more data** | "Complete your twin to unlock" | Astrotalk, Bumble |
| 6 | **Hand off to a human to close** | Free coach consult that doubles as data capture | Noom, Hims, most KSA health commerce |

The genius of it is that **stages 2, 4, 5 and 6 are all the same activity wearing different
costumes**: they are data collection disguised as self-improvement, browsing, ambition, and
conversation respectively. That directly answers the constraint you set — every screen must
capture structured data.

It also correctly identifies where the data problem lives. You labelled it **MEASURE**, and
that's right: our Measure stage currently means "draw blood," which is the single highest-friction
act in the whole product. The feedback redefines Measure as *everything we know about you*, of
which blood is one late, expensive input.

---

## 2 · What it fixes that we got wrong

### F1 — We front-loaded the hardest step. (Fixes the Activate leak.)

Our funnel is Onboard → **book a nurse, get stabbed, wait 48h** → Read → Commit.
We ask for money, a scheduled home visit, a needle, and two days of patience **before the
user has seen a single thing worth having.**

The feedback inverts it: show the prize, let them want it, *then* explain that a baseline is
how they get it. Blood draw stops being a toll booth and becomes the unlock for something
they've already chosen.

This is the biggest single improvement in the feedback and it is not close.

### F2 — Progressive profiling solves the data problem honestly.

We have a hard constraint (structured data on every screen) and no mechanism for sustained
collection. 20/80 with a visible completeness meter is the mechanism. Bumble and Astrotalk
are the right precedents and both are proven at scale.

Critically, it converts our biggest liability — *we need a lot of data about you* — into the
core game.

### F3 — Twin-as-agent beats Twin-as-mirror.

Our current Twin tab is a **passive visualisation**: a body, some markers, a history. Beautiful,
inert. Nothing about it explains why you'd feed it.

"Your twin goes out and finds the best protocols so you never have to" gives the twin **agency
and a job**. Now feeding it has an obvious payoff: a better-informed agent searches better on
your behalf. That is a far stronger reason to answer question #14 than a progress bar.

### F4 — The coach call is the best data-capture surface we have.

People abandon forms and answer questions in conversation. A free consult:
- captures the 80% at high fidelity,
- converts (a human asking for commitment beats a button),
- satisfies the clinician-verification step we already built (C5b),
- and matches how KSA health commerce actually works — relationship-led, high-touch.

Doing data capture *on the call* rather than in a form before it is the correct call.

### F5 — Discover gives us something to do during the 12-week dead zone.

A loop is 84–112 days. That is a long time to hold attention with a daily checkbox.
A discovery surface gives users a reason to open the app that isn't adherence, and it feeds
the multi-loop portfolio we just built.

---

## 3 · What it breaks — and the reframes

I would not ship three things as written.

### R1 — "Used by top athletes / actors" is a direct attack on our thesis. ⚠️ Highest stakes.

Our entire defensibility claim is **"we verify what actually works for you."** Celebrity
provenance is the opposite epistemics — authority-based, unfalsifiable, and *exactly* the
"generating advice is cheap" trap we said we were escaping. If our card faces say what every
supplement brand's ads say, we are a supplement brand with better UI.

It is also a **KSA regulatory problem**: SFDA/MOH rules on health claims and endorsements
(see R1–R3 in KSA_CONSTRAINTS.md). "Used by elite athletes" as a purchase driver is an
unsubstantiated efficacy claim wearing a costume.

**But the underlying need is real and I don't want to lose it.** At cold start the user has
no personal evidence, and *something* must fill that void. Social proof is the correct
instinct. The provenance is what's wrong.

**The reframe — swap celebrity provenance for evidence provenance:**

> ~~Used by top athletes~~
> **Grade A evidence · 4 RCTs, n=1,240**
> **340 Valeo members ran this · 71% moved the marker**

This is strictly better on every axis:
- still social proof (satisfies the psychology),
- **on-thesis** (it is literally our verification corpus),
- regulatorily defensible (our own outcome data, stated as outcome data),
- and it **compounds** — every loop anyone completes makes every card face stronger.

Nobody else in the market can print that second line. Athletes anyone can rent.

At true cold start with no corpus, we print only the literature grade, honestly:
*"Grade A evidence · no Valeo outcomes yet — you'd be among the first 50."* Scarcity and
honesty in one line.

### R2 — A precise match score at 3 questions is a lie we can be caught in.

"94% match" after five questions is fabricated precision. Astrotalk can do this because
astrology is unfalsifiable. **We are falsifiable by design — we retest in 12 weeks.** If we
promise 94% and the protocol is refuted at P5, we have destroyed the exact asset we are
building: trust in our verdicts.

**The reframe — make confidence visible and data-linked:**

Show a **confidence band, not a point score**, and show what it's built on:

> **Likely fit** · confidence LOW
> based on 5 of 14 signals · a baseline would move this most

Then the gate stops being a growth-hack and becomes **honest**: we're not withholding cards
to extract data, we're telling you the scoring isn't trustworthy yet. Same conversion
mechanic, no integrity cost, and it teaches the user that data → better answers, which is
the belief the whole product depends on.

### R3 — A right-swipe cannot be a commitment, and the feedback already knows this.

Swiping works on Bumble because a bad match costs nothing. A bad protocol costs 12 weeks,
money, and possibly harm.

The feedback handles this correctly — **right swipe goes to Saved, not to purchase**, and the
real commitment happens on the coach call. That architecture is right and I'd keep it exactly.

Two additions:
- **Capture the left-swipe reason** (too hard / not my goal / already doing this / don't
  believe it). A rejection is a high-value structured signal and it's free at the moment of
  rejection. Nobody does this well.
- **Never allow protocol start without baseline.** See R4.

### R4 — Protocol-before-measurement threatens the baseline, which is the whole loop.

If a user swipes → consults → starts a protocol → *then* books blood work three weeks in,
the baseline is contaminated and **the loop can never produce a verdict.** We'd have sold a
protocol and destroyed our reason to exist.

The feedback mostly gets this right (view protocol → action pending → book blood test). I'd
make it harder:

**You may see the protocol. You may not start it.** The sealed prediction (C4) is
un-writable without a baseline — that's not a paywall, it's arithmetic. Show the protocol
fully, show the sealed-prediction card as *locked with the reason stated*.

### R5 — Don't name real people. ("your twin is like Huberman's twin")

Naming a real individual to imply endorsement is a false-endorsement/right-of-publicity
exposure, and it borrows someone else's brand to build ours.

The idea underneath is excellent and survives without the name:

> **"The stack a full-time optimiser would build for you — without becoming one."**

### R6 — The 50%-off blood test is right, for a reason worth stating explicitly.

Discounting a diagnostic feels uncomfortable, but strategically it is correct: **the baseline
is the asset.** Every baseline we buy is a permanent entry in the verification corpus, makes
that user's every future card face better, and is the precondition for all downstream revenue.
Subsidising baselines is buying the moat at a discount.

Two guardrails: no countdown-timer pressure on a medical decision (offer window stated
calmly, R7), and the discount must never be contingent on choosing a *particular* protocol.

---

## 4 · The missing move — and it's the one that matters

**The feedback never mentions the loop.** No retest, no verdict, no verification, no ring.
It ends at "user starts a protocol." Everything we believe happens *after* that point.

As written, this builds a **protocol discovery marketplace** — competing with Examine,
Function, Levels on catalog and matching quality. That is a commodity fight we would lose,
and it abandons the only defensible thing we have.

**The fix is one edge in the graph, and it's a P0:**

```
Verdict (P3/P4b/P5/P6) ──▶ Twin gets smarter ──▶ Deck re-scores ──▶ Discover
```

Concretely, after any verdict:

> **Your verdict just changed your twin.**
> Ferritin: oral iron *refuted* for you — absorption pathway flagged.
> **3 protocols re-scored.** 1 new protocol now clears the bar. 2 dropped off.

This is the whole ballgame. It makes the deck **yours** rather than a catalog:
- The corpus scores the cards (R1) → our deck beats a generic deck.
- Your own verdicts re-score your cards → your deck beats our deck.
- Every completed loop improves both, forever.

**P12 — The deck is an output of the verification engine, not a catalog in front of it.**
If we ship the swipe deck without this edge, we have built a beautiful front door onto
someone else's house. This is the sequencing hill I'd die on.

---

## 5 · The alternate flow (DS-series nodes)

Prefixed `DS` to avoid collision with decisions D1–D6. Existing nodes reused where noted —
**most of the back half already exists.**

```
DS1  Meet your twin (cold open — twin does something before asking for anything)
DS2  What a twin is (3 beats: it's you in data · it reads everything · it works for you)
DS3  Core 5 — mandatory 20%          [twin 0% → 34%]
DS4  Goal deepening (3 q)            [twin 34% → 48%]
DS5  Twin assembly ("cooking")       — honest computation theatre
DS6  The deck — swipe                [5 cards free at 48%]
DS7  Card detail (tap-through)       — what's in it, weekly cost to you, who it's wrong for
DS8  Deck exhausted → honest gate    [answer 6 → 70% → unlock 4 more]
DS9  Saved protocols                 — consult CTA per row + staleness nudge
DS10 Book coach consult (free)       — KSA-aware slots (R4, R5)
DS11 Post-call state                 [twin 48% → 78%, coach captured 12 fields]
       └─▶ card flips: "Book a consult" → "View protocol"
DS12 Full protocol            ══▶ REUSE C5 (mission briefing)
       + baseline gate: sealed prediction locked, reason stated
DS13 Book blood test (offer)  ══▶ REUSE T3-3 / T3-3b (upload existing bloodwork)
DS14 Verdict → twin update           ★ THE CLOSING EDGE — new screen, P0

        ── from here the existing loop runs unchanged ──
Draw → lab            ══▶ existing
Results → sealed      ══▶ C1 · C2 · C3 · C4
Commit                ══▶ C5b (clinician) · C6 · C6b
Act                   ══▶ Today (daily tracker, report surfaced here, coach access)
Prove                 ══▶ P1 · P2 · P3 / P4b / P5 / P6
Renew                 ══▶ DS14 ──▶ back to DS6 with a re-scored deck
```

**The recursion:** `DS6 → … → P3 → DS14 → DS6′` where the deck at `DS6′` is measurably
different from `DS6`. That loop closing on itself is the product.

---

## 6 · Navigation

Five tabs is too many. **Discover and Protocols are the same object at different stages**
(finding vs. owning), so they merge into one tab with segments — which also absorbs the
portfolio page we just built.

```
Today  ·  Loop  ·  Discover  ·  Twin
                   └─ segments: [ For you | Saved | Running | Done ]
                                    DS6      DS9     portfolio  portfolio
```

- **Today** — Act. Daily tracker, blood report when it lands, coach access.
- **Loop** — the ring. Unchanged; still the emotional core.
- **Discover** — acquisition *and* portfolio. New protocols in, owned protocols managed.
- **Twin** — completeness, body map, what it knows, what it still needs.

The twin completeness meter lives in the **Twin** tab as its permanent home, and appears as a
thin bar in **Discover** wherever a gate is in play. Nowhere else — a percentage on every
screen is nagging, not motivation.

---

## 7 · Data captured per node (the point of all this)

| Node | Structured data captured |
|------|--------------------------|
| DS3 | age_band, sex_at_birth, primary_goal, top_constraint, current_stack[] |
| DS4 | goal_specificity, time_budget_weekly, prior_attempts[], failure_mode |
| DS6 | **swipe_right** (interest), **swipe_left + reason enum** (anti-preference), dwell_ms per card |
| DS7 | detail_expanded[], section_read[] — which objection they cared about |
| DS8 | 6 × profile fields, chosen under explicit "this improves scoring" framing |
| DS9 | save_age_days, revisit_count — intent decay signal |
| DS10 | slot preference, coach gender preference (R5), language |
| DS11 | **12 clinician-grade fields** — meds, conditions, family history, labs held elsewhere |
| DS13 | baseline panel — the corpus entry |
| DS14 | verdict outcome → re-scoring weights, per-user response priors |

Every one of these is a row that feeds memory and the verification corpus. Nothing here is
decoration.

---

## 8 · Metrics — one per transition

| Transition | Metric | Why it's the right one |
|---|---|---|
| DS1 → DS3 | intro→first-answer rate | is the twin pitch landing at all |
| DS3 | **core-5 completion** (target >80%) | if this leaks, nothing downstream matters |
| DS4 → DS6 | median twin % at deck entry | are we scoring on enough signal |
| DS6 | cards viewed / served; **save rate** | deck quality |
| DS6 | left-swipe reason distribution | *why* the catalog is wrong |
| DS8 | **gate conversion** | does honest gating actually extract data |
| DS9 → DS10 | **save → consult booked** ← the key conversion | the new Commit leak |
| DS10 → DS11 | consult show rate | free consults get ghosted |
| DS11 | **twin % delta across the call** | is the coach actually capturing |
| DS11 → DS13 | consult → blood test booked | the old Commit leak, relocated |
| DS13 → Act | baseline → protocol start | |
| Act → P1 | **retest rate** | the adherence leak, unchanged and still the enemy |
| P3 → DS14 → DS6′ | **verdict → next swipe session** | the recursion — the whole thesis in one number |

The last row is the one I'd put on the wall. It is the operational definition of the
retention you described: *completes one full loop and begins the next.*

---

## 9 · New blindspots

- **B7 — The window shopper.** A user with 9 saved protocols and 0 consults is a *new class
  of zombie*. Bumble tolerates a low match rate; we can't. Watch save→consult obsessively;
  if it's under ~25%, the deck is entertainment, not a funnel.
- **B8 — Coach capacity is the hard ceiling.** Free consults don't scale. If save→consult
  runs at 40%, coach-hours become the binding constraint in week one. This needs a capacity
  model *before* build, not after. Possible release valve: AI pre-call intake that captures
  8 of the 12 fields so the human call is 12 minutes, not 30.
- **B9 — Twin % is vanity unless it (a) unlocks capability and (b) decays.** Bumble profiles
  don't go stale; **biology does.** A ferritin value from 8 months ago is not current truth.
  Decay gives us an *honest, permanent* reason to re-ping — which is exactly the "keeps
  updating it" problem in the feedback. **This is the most underrated idea available to us
  and I'd build it in from day one.**
- **B10 — Desire-first may select for weaker adherence.** Evidence-first users self-selected
  by having a problem. Swipers may aspire more and adhere less. Segment every adherence and
  retest metric by entry path or we'll mistake a volume win for a quality one.
- **B11 — Protocol supply is an unsolved content operation.** A deck needs inventory with real
  evidence grades. With 12 protocols the deck runs dry in one sitting. Who builds, grades, and
  maintains the catalog — and how do grades get revised as our corpus grows? Unowned today.
- **B12 — Legal.** Named individuals (R5), athlete/efficacy claims (R1), and discount framing
  on diagnostics (R6) all need review before anything ships publicly in KSA.

---

## 10 · New principles

- **P12 — The deck is an output of the verification engine, not a catalog in front of it.**
- **P13 — Provenance must be evidence, never celebrity.** Anything we print as a reason to
  believe has to be something we could be held to.
- **P14 — Confidence is shown as a band with its inputs named.** No point scores we can be
  caught out on in 12 weeks.
- **P15 — Gates must be honest.** Withhold only what we genuinely can't do well yet, and say
  which. The gate teaches the core belief: more data → better answers.
- **P16 — Twin completeness decays.** Freshness is part of the score, because biology moves.

## New mechanics for REFERENCES.md

- **M34** — Progressive profiling with capability unlocks (Bumble, LinkedIn, Astrotalk)
- **M35** — Rejection-reason capture at swipe-left (novel; nobody in health does this)
- **M36** — Honest computation theatre — show real work, not a fake spinner (Levels, Whoop)
- **M37** — Human-call-as-data-capture (Noom, Hims)
- **M38** — Decay-driven re-engagement — staleness as an honest reason to ping

---

## 11 · Sequencing — what I'd build, in order

**Phase 0 — prove the premise before building anything (2 weeks, no app changes).** See §12.

**Phase 1 — the front door.** DS1–DS9 + Discover tab. Deck can be hand-curated; scoring can
be crude, *as long as the confidence band is honest* (R2). This tests activation.

**Phase 2 — the close.** DS10–DS13 + coach panel. Reuses C5, C5b, T3-3. This tests conversion
and is where B8 (capacity) becomes real.

**Phase 3 — the recursion.** DS14. **Do not defer this past Phase 3.** Without it we are a
marketplace (§4).

**Phase 4 — decay + re-ping.** B9/P16. Turns one-time collection into permanent collection.

The back half of this flow — protocol, clinician review, consent, order, draw, results,
sealed prediction, Today, retest, verdict — **is already designed and built.** This is
genuinely a front-door project, not a rebuild. That's the good news.

---

## 12 · The cheapest ways to test this

Ordered by cost. Each kills a specific assumption.

1. **Does desire-first beat evidence-first?** (~2 weeks, zero app changes.)
   Take existing non-activated users, split them. Arm A gets the current "book a blood test"
   CTA. Arm B gets a link to a **static deck of 6 protocol cards** ending in "book a free
   consult." Measure consult bookings and downstream baselines. This is the whole hypothesis
   for the price of a landing page.

2. **Does the honest gate actually extract data?** (~3 days.)
   A Typeform. Five questions, then: *"Your twin is at 48%. Scoring is unreliable below 70% —
   6 more questions unlocks 4 protocols."* Measure the answer-through rate. If it works in a
   Typeform it will work in the app.

3. **Evidence provenance vs. celebrity provenance.** (~1 week — *and this one is aimed at me.*)
   A/B two card faces: "Used by elite athletes" vs. "Grade A · 4 RCTs · 71% of 340 members
   moved the marker." I've argued hard for the second (R1). If the first wins decisively on
   save rate, I want to know, because then the question becomes how to get that pull *without*
   the claim — not whether I was right.

4. **Coach-call capacity and capture rate.** (~10 calls, manual.)
   Run ten real consults with a spreadsheet as the "coach panel." Measure minutes per call and
   fields captured. This sizes B8 before we build tooling for it.

5. **Does a verdict change swipe behaviour?** (needs Phase 3 — the slowest, most important.)
   Compare deck engagement before vs. after a user's first verdict. If a verdict doesn't lift
   the next session, P12 is wrong and the recursion isn't real. Everything strategic rests here.

---

## 13 · Assumptions I made

Stated rather than blocking on:

1. **Coach = health coach, not physician.** Clinician sign-off remains the separate C5b step
   (regulatory, R2). If "coach" was meant to be the doctor, DS10 and C5b merge and the
   capacity math in B8 gets much tighter.
2. **"Free consultation" is genuinely free**, absorbed as CAC.
3. **Discover absorbs the Protocols tab** rather than becoming a fifth tab (§6).
4. **The existing loop stays as designed.** I've treated everything after DS13 as reuse.
5. **Protocol catalog exists or will be built** — flagged as unowned in B11.
