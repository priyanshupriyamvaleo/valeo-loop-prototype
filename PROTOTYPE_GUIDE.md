# The Interactive Prototype — how it works, and how to demo it

**Open `prototype.html`.** That's the whole thing. No build step, no server.

---

## What it is

The 30 screens were built as *specimens* — each one a standalone file proving a design decision.
This turns them into **one navigable app** without rebuilding any of them, and adds the three
things a static file set structurally cannot express: **branching, waiting, and recursion.**

---

## The architecture, in one paragraph

Each screen loads a small bridge script (`design-system/embed.js`). Opened directly, it does
nothing. Inside the prototype it does two jobs: strips the screen's own presentation chrome
(frame label, caption, page padding) so it fills a clean 390×844 iframe, and reports every tap
up to the shell via `postMessage` as one of `primary / secondary / back / tab`.

**The screens never know where they are in the flow.** All routing lives in a single `FLOW`
graph inside `prototype.html`. That means a branch can be re-pointed, a new fork inserted, or
the whole journey re-sequenced by editing one object — never by touching 30 files.

---

## The four node types

| Type | Looks like | What it's for |
|---|---|---|
| **Screen** | The real UI in a phone bezel, tagged *"Product screen"* | One of the 30 built frames |
| **Branch** ◆ | Dark card, dashed amber border, tagged *"Demo control"* | A fork — you pick which scenario to walk |
| **Time skip** ⏱ | Same card + a progress bar and a delta list | Compresses 8 weeks into one beat, and shows what changed |
| **Recursion** 🔁 | Same card, blue accent | The loop closing and reopening |

Meta cards render **inside the phone slot** so the demo never breaks focus — but they are
visually unmistakable as demo controls: dark, dashed amber border, and the tag above the phone
flips from grey *"Product screen"* to yellow *"Demo control"*.

---

## Every branch in the system

| Fork | Outcomes |
|---|---|
| **Eligibility** | Clears threshold → baseline · Below threshold → the honest-decline path |
| **After decline** | Alternative protocol · Free clinician call · Honest exit (a real terminal state) |
| **Entry** | Taps the push → in-app · Opens the emailed link → the web twin |
| **Depth** | Straight to the plan · Reads all 40 markers first |
| **Which day is it?** | 6 states of the daily hero — ordinary, shot day, post-shot, titration review, week 12, coach |
| **Adherence** | Holding 86% · Slipping 62% · Something came up → Pause |
| **Does the intervention work?** | Logs missed days · Pauses · Ignores it → arrives below floor |
| **⚖️ THE VERDICT** | Confirmed · Partial · Refuted · Inconclusive |
| **Inconclusive — which reason?** | Assay mismatch · Outside window · Ramadan · Below floor |

Plus five time skips (the draw, 48h lab, 8 weeks clean, 8 weeks poor, the 4-week extension),
a Pause state, and three recursion points (loop 2, new hypothesis, back-to-intake).

---

## Nothing is ever gated

This was an explicit requirement, and it's enforced three ways:

1. **The left rail lists all 57 nodes**, grouped by stage, every one directly clickable. You can
   jump straight to the refuted verdict without walking eight weeks to get there.
2. **The right panel lists every outgoing edge** of the current node — including back-edges —
   as clickable buttons. You can always see where you can go from here.
3. **Map mode** renders the entire graph: 57 nodes, ~109 edges, colour-coded (grey = forward,
   amber = branch outcome, dashed blue = recursion). Click any node to jump there.

---

## Demoing it to your team

**The 90-second version.** Reset → walk Onboard → at the eligibility fork take *"Clears the
threshold"* → skip through the draw and the lab → land on C1 → C2 → C4 (the sealed prediction).
Stop there and read the right-hand panel out loud. That's the Commit thesis.

**The 5-minute version.** Continue to C6 (retest pre-booked), hit the loop-start recursion card,
show the daily hero, then use the *"Which day is it?"* fork to show the state machine. Take the
adherence fork *down* — pick "Slipping 62%" → T2-6 → "Ignores it" → land on the verdict as
inconclusive. Then Back out and re-run the verdict as **Confirmed** to show the contrast.

**The one that wins the room.** Go straight to `⚖️ THE VERDICT` from the rail and walk all four
outcomes in a row — confirmed, partial, refuted, inconclusive. Nobody else in the category has
even one of these screens. Showing four in ninety seconds is the argument.

**Then switch to Map** and let the loop speak for itself: the dashed blue edges curving backwards
from Prove into Journey and Commit *are* the retention thesis, drawn.

---

## Controls

- **← / →** back / continue
- **1–9** pick a branch option by number
- **M** toggle Walk ↔ Map
- **Reset** returns to the top and clears state
- The URL carries the current node as a hash, so any scenario is bookmarkable and shareable

The top bar tracks live state — **Day**, **Adherence**, **Loop** — mutated by the time skips, so
"8 weeks pass · adherence 54%" is visible in the chrome, not just asserted in a card.

---

## Known limits (stated, not hidden)

- **Screens are visually static.** Tapping "Skip" on the dose screen advances the flow; it does
  not re-render that screen in a skipped state. The prototype demonstrates *journeys*, not
  per-screen state permutations.
- **Any tap on an interactive-looking element advances via the node's primary route.** This is
  deliberate — it keeps the demo smooth — but it means the prototype is more forgiving than the
  real app will be. Bare background taps are ignored so it never advances by accident.
- **Adherence and Day are demo state**, driven by the skip cards. They are not computed from
  logged events, because no events are actually logged.
- The four **P6 inconclusive variants** are one HTML file isolated by `?card=N`. They render
  slightly narrower than a true full-bleed screen.
