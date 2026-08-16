# MVP implementation plan

Lean and production-shaped. Two fixed inputs: the weight-loss-only fork, and
the split-payment long flow with the borrowed copy deck
(`docs/MVP_LONG_FLOW.md`). One new demo surface: phone on the left, the flow
table with entry and exit conditions on the right. No feedback panel, no
state-machine infra on screen.

## 1. Scope

**In:** the funnel for four goals (weight loss, sexual health, longevity,
postpartum) · fork only on weight loss · known door = GLP-1 Monthly Plan with
doctor checkpoint, no labs · long flow = free instant consult → care brief →
blood test SAR 499 (applied toward the programme) → results review →
programme activation (balance) → fulfilment → treatment → week-12 loop ·
practice thread · Today · the flow table.

**Out (deleted from the copy):** P1/P2/P3 phases, Twin, Discover deck, Find,
Intro/Questions/Matching/unlock, Baseline, Protocols catalogue tab, the
feedback panel, the dock (Controls/Clinic/Machine). `machine.js` stays as
logic only: the flow table reads it.

## 2. Structure

- Repo folder `valeo-mvp/` on branch `mvp`, built to `/mvp`
  (`base: /valeo-loop-prototype/mvp/`). Merged to main to deploy alongside
  `/v1/`.
- App layout: `Phone` (left) + `FlowTable` (right). Nothing else.

## 3. Changes, file by file

| File | Change |
|---|---|
| `vite.config.js` | base `/valeo-loop-prototype/mvp/`, outDir `../mvp` |
| `src/App.jsx` | delete phases/twin/discover/find/questions routes, feedback, dock, harness rails; tabs = `['today']`; add `FlowTable` right panel; keep the gate helpers; new `testPaid`/`activate` wiring |
| `src/data.js` | fork question only when `goal === 'fat'` (`forkFor`); `TEST_FEE = 499`; `programmeDue(pKey)`; copy deck lines (brief pricing block, four steps, PaySheet lines, Today sub-lines) |
| `src/screens/Coach.jsx` | door step skipped for non-weight goals (steps built per goal) |
| `src/screens/Brief.jsx` | pricing block + the ask (SAR 499, applied-toward line) + four steps + CTA `Book my blood test` → PaySheet(499) |
| `src/screens/Buy.jsx` | known branch only (monthly plan). Resolve branch no longer routed |
| `src/screens/Activate.jsx` | **new**: cart math (total / applied / due today) + `Start my programme · SAR {due}` → PaySheet(balance) |
| `src/screens/Today.jsx` | `ready` card becomes `Start your programme` → Activate; D5 sub-lines per deck |
| `src/machine.js` | states/copy for the split: D4 = blood-test payment, D6 exit = activation; entry/exit strings power the flow table |
| `src/dock/FlowTable.jsx` | **new**: the right panel. Steps grouped (shared trunk, weight fork, long flow, shared room), columns Step / Entry / Exit, active row highlighted from `projectEpisode`, a small ▸ on the active row when the next move belongs to the system (fires through the same gate) |
| deleted | `src/dock/Clinic.jsx`, `src/dock/Machine.jsx`, `components/Feedback.jsx` usage, unused screens |

## 4. The flow table (the right panel)

One table, four groups, three columns. Entry and exit conditions are the
spec's plain-language lines. The current step is highlighted live; steps on
the untaken door dim. Rows never fire patient moves (those happen on the
phone); the ▸ appears only when the machine's next move belongs to the
clinic, lab, pharmacy or nurse, so the demo can be advanced without any
state-machine UI.

## 5. Build order

1. Strip: delete out-of-scope screens/routes; single-tab nav; app builds.
2. Layout: phone left, FlowTable right (static rows first).
3. Fork gating (weight only) + Coach steps per goal.
4. Long-flow commerce: Brief pricing block + test PaySheet; Today sub-lines;
   Activate screen with cart math; machine transitions TEST_PAID and
   PROGRAMME_ACTIVATED.
5. FlowTable live highlight + system ▸ through the gate.
6. Verify all four goals end to end in the browser; merge `mvp` → main;
   deploy to Pages `/mvp/`.

## 6. Acceptance

- Weight loss shows the fork; the other three goals never do.
- Known door reaches fulfilment with no lab state anywhere.
- Long flow: exactly two payment moments (499, balance), the applied-toward
  line at both, cart math on the activation screen.
- The right panel shows only the table; no feedback, no machine, no rails.
- Every copy line matches `MVP_LONG_FLOW.md`; no em dashes in product copy.
