# Upgrade Plan — from screens to a product

## What I got wrong, stated plainly

Four of your points are correct and one of them is the biggest hole in the entire project.

1. **Today / Twin / Timeline are wireframes, not designs.** You're right. They're arrangements
   of correct information with no hierarchy, no restraint, no moment. I designed the *content*
   and skipped the *craft*. The research doesn't excuse that — it makes it worse, because the
   thinking is there and the execution didn't earn it.
2. **The Loop is invisible.** ← *the real failure.* The entire thesis is a closed loop that
   compounds, and there is not one pixel anywhere representing it. I built the loop's screens
   and forgot to build the loop.
3. **Iron in a weight-loss journey is incoherent.** I picked ferritin early because it's a
   fast, clean marker for demoing a prediction, then never reconciled it with the goal the
   user selected. Sloppy.
4. **"Shot day" / "post-shot" go to logging modals, not day-states.** The daily surface was
   specified as a state machine and built as one static screen plus separate modals. The
   spec was right and the build didn't honour it.
5. **Care doesn't belong in the tab bar** — agreed, and it exposes that I never defined a
   navigation model at all.

---

## The organising idea: the Loop Ring

The product is a closed loop. Apple's most effective engagement mechanic ever shipped is
**closing a ring** — and its weakness is that the ring is arbitrary (why 500 calories?).

Ours is not arbitrary. **The ring closes when the loop actually closes** — when a sealed
prediction receives a verdict. That is a real event with a real threshold, not a made-up
target. It is the rare case where the honest mechanic and the addictive mechanic are the
same mechanic.

**Anatomy.** Five arcs — `Measure · Interpret · Decide · Act · Prove`. Completed arcs solid,
current arc filling, future arcs hairline. Centre carries the day count and the single most
relevant number.

**Completed loops stack as concentric rings, inward — tree rings.** Loop 1 innermost, each
new loop laid outside it. Your history becomes a physical object that grows. It cannot be
faked, bought, or reset, because each ring is a verified causal fact about your own body.

**That is the gamification, and it is honest: you are not collecting points, you are
collecting answers.** No streaks, no confetti, no badges — the research was explicit that
those corrode a medical product's credibility (Oura and Apple Medications both ship zero).

**Where it appears**
| Surface | Form |
|---|---|
| Valeo app home entry card | 32px ring + phase label — the hook back into the protocol |
| Every protocol screen's nav bar | 26px ring, always visible, tappable → Loop tab |
| The Loop tab | Full 220px hero with tree rings, phase detail, sealed prediction at centre |
| The reveal (P3) | The ring **closes** — the one animated moment in the product |

---

## Navigation model (industry convention, then our application)

**The rule every major app follows:** a tab bar persists on *top-level destinations* and
disappears on *focused tasks* and *immersive moments*. Instagram keeps tabs on the feed and
drops them in the camera. Duolingo keeps tabs on home and drops them inside a lesson. Airbnb
drops them in the booking flow.

Valeo has **two nested apps**, so it has two tab bars — exactly as your v3 prototype already
does with `nav-app` and `nav`.

| Surface | Chrome | Why |
|---|---|---|
| Valeo app home | **App tab bar** — Services · Supplements · Home · Results · Cart | The store's top level, untouched |
| Today · Loop · Twin | **Protocol tab bar (3 tabs)** + `‹ Valeo` in the nav bar | Top-level destinations of the sub-app |
| Log weight / dose / symptom | **None** — modal sheet, swipe to dismiss | Focused task |
| Coach chat | **None** — pushed, back arrow | Focused conversation |
| Onboard · intake · eligibility · booking | **None** | Linear commitment flow |
| Commit C1–C7 | **None** | Linear, high-stakes; escape hatches leak |
| Prove P1–P6 | **None** | The reveal must own the screen |
| Plan management | **None** — pushed from the avatar | Settings-like |

**Care leaves the tab bar.** Three tabs, not four: **Today · Loop · Twin**. Plan management
moves to the avatar in the Today nav bar, which is where every consumer app puts account.
Three tabs is also simply better — Apple's own guidance is that a tab bar with a weak fourth
item is a tab bar with three items and a mistake.

---

## Fixing the clinical story

Currently: goal = weight, prediction = ferritin. Incoherent.

**The fix is medically real, not a rename.** Baseline panel returns *two* findings:

- **HbA1c 5.9%** — elevated. **This is the scored marker.** It moves in exactly 12 weeks
  (it *is* a 90-day average), it justifies the retest, and it is "the numbers, not the
  mirror" — your own line.
- **Ferritin 18 ng/mL** — low. A secondary finding, corrected in the same protocol.

Why keeping ferritin is *better* than deleting it: iron deficiency is common in GLP-1
patients and causes exactly the fatigue that destroys adherence. So the protocol treats the
thing being measured *and* the thing that would otherwise sabotage the measurement. That is
what a verification company does and a pill-seller doesn't.

**Protocol becomes:** tirzepatide 2.5 → 5 mg weekly (titrating) + iron + vitamin C +
the behaviour change. Weight is the visible secondary; HbA1c is scored.

---

## The five day-states, actually built

"Shot day" and "post-shot" must re-render **Today**, not open a modal. One file,
`?state=` variants:

| State | Hero renders |
|---|---|
| `ordinary` (6 of 7) | Dose-cycle position, trend weight, one action |
| `shot` (1 of 7) | The timed injection protocol — 5 clocked items, site pre-filled |
| `post` (days 1–3) | Symptom window — the structured instrument surfaces |
| `titration` | The dose decision, with adherence + symptoms as the evidence |
| `retest` (week 12) | The ring is nearly closed → straight into Prove |

---

## Build order

1. `design-system/loop.css` — the Loop Ring, tab bar, nav bar, sheet primitives
2. **V0** Valeo app home — search, greeting, protocol entry card with mini ring, services grid
3. **T2-1 Today** rebuilt + 3 day-state variants
4. **T2-9 Loop** — new middle tab, the hero ring + tree rings + phase detail
5. **T2-7 Twin** rebuilt
6. Clinical-story pass across the affected screens
7. Flow graph: V0 entry/exit, day-state branch, nav rules
