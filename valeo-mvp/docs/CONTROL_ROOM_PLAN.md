# The Control Room — implementation plan

Builds on `STATE_MACHINE_V1.md`. Three surfaces at the end:

1. **The patient app** (the phone) — already built, stays as is.
2. **The Clinician UI** — Jamie's queues, reading and writing the same state.
3. **The State Machine visualization** — the live machine with manual levers
   to fire events and watch every surface move together.

**The consistency rule (the whole point):** all three surfaces read one store
and write through one gate. Levers are manual, but a lever can only fire an
event the machine currently allows. The only pseudofied things are the *real
world* — money moving, blood being drawn, video being spoken, parcels driving
across Riyadh. The logic is never pseudofied.

---

## 0. Architecture — one store, one projection, one gate

The prototype already has a single source of truth: the reducer state `st` in
`App.jsx` (`st.qa`, `st.runs[pKey]`). We do NOT build a second store and try
to keep two brains in sync. Instead:

### 0.1 The projection (read side)

A pure function maps prototype state onto spec states, per episode:

```js
// src/machine.js
projectEpisode(st, pKey) → {
  pKey, category, intent,          // KNOWN_SOLUTION | NEED_DIAGNOSIS
  state,                           // 'K4_DOCTOR_REVIEW', 'M2_TREATMENT_ACTIVE', ...
  enteredAt,                       // from the event log
  patient, program, order,         // derived views of the five objects
}
episodesOf(st) → projectEpisode for every run + the in-funnel episode
```

This is §6 of the spec (state → screen map) implemented in reverse. It cannot
drift from the app because it reads the same fields the app renders from
(`status`, `checkpoint`, `ship`, `qa.door`, `qa.escalated`).

### 0.2 The machine table (the spec as data)

```js
export const STATES = [ { id, label, lane, actorNote } ... ]   // lane: trunk | known | resolve | merged | post
export const TRANSITIONS = [
  { from: 'K4_DOCTOR_REVIEW', event: 'ORDER_APPROVED', to: 'M1_FULFILMENT',
    actor: 'clinician',
    guard: (st, pKey) => ...,          // entry/exit conditions, §3 of the spec
    reason: 'Order must be paid first',// plain words shown on a disabled lever
    fire: (ctx, pKey) => ...,          // the ONLY code allowed to mutate state
    writes: 'review_note, signature',  // what data this event creates
    simulated: false },                // true where the real world is pseudofied
  ...
]
allowedEvents(st, pKey) → TRANSITIONS where from === current state && guard passes
```

### 0.3 The gate (write side)

One dispatcher, defined in `App.jsx` and passed to every surface:

```js
const fireEvent = (eventId, pKey) => {
  const t = allowedEvents(st, pKey).find((x) => x.event === eventId);
  if (!t) return;                        // an invalid event is simply impossible
  t.fire({ dispatch, setFlow, setTab, setDetail, setCkCall }, pKey);
  dispatch({ type: 'log', pKey, event: eventId, actor: t.actor });
};
```

- `fire` maps events to the reducer actions that already exist
  (`ORDER_APPROVED` → `checkpoint approved` + `activate`;
  `LABS_UPLOADED` → `labsReady`; `PAYMENT_COMPLETED` → `orderPlaced` or
  `programme`...). No new state shape; the machine drives the same levers the
  harness buttons drive today.
- Because `fire` also receives `setFlow`/`setTab`, an event can move the
  PHONE too: fire `PAYMENT_COMPLETED` from the machine tab and the phone
  itself lands on Today with the checkpoint card. Three surfaces, one gate,
  zero drift.

### 0.4 The event log

New reducer case `log`: appends `{ at: seq++, pKey, event, actor }` to
`st.log`. The phone also logs: `PaySheet onDone`, `End call`, chip taps route
through `fireEvent` where a machine event exists, so patient actions taken on
the phone appear in the same ticker as clinician actions taken in the queue.
(Sequence numbers, not wall-clock, because the demo jumps time.)

---

## 1. The layout — where the new surfaces live

The desktop frame today: Feedback panel (left) · phone (centre) · harness
rail (right). It becomes:

```
Feedback | Phone | Dock
```

The **Dock** is a tabbed panel replacing the bare rail:

- **Controls** — exactly today's rail (twins, funnel jumps, NEXT beats,
  load-a-full-twin). Unchanged content, just housed in the first tab.
- **Clinic** — Jamie's UI (§2). Dock widens to ~560px.
- **Machine** — the visualization (§3). Same wide mode.

`?view=clinic` / `?view=machine` opens a tab on load, so a link can be sent
to the designer with the right surface already open. The Feedback panel and
its comment keys stay untouched.

Files: `src/App.jsx` (dock shell + tabs), `src/dock/Controls.jsx` (extracted
rail, no behaviour change).

---

## 2. The Clinician UI (Clinic tab)

Jamie sees queues, never pages. One list, filtered by state.

### 2.1 Anatomy — `src/dock/Clinic.jsx`

- **Header**: clinician identity row (portrait, name, "Jamie's Practice").
- **Queue chips** with live counts, from `QUEUES` in `machine.js` (§4 of the
  spec): Needs Signature · Needs Review · Waiting Labs · Waiting Patient ·
  Follow-up Due · Retest Due · Completed. A chip is a filter; empty queues
  render dimmed with a zero.
- **Episode cards** (the filtered list): patient name, category + intent
  chip (`KNOWN` gold / `DIAGNOSIS` teal), programme name, current state
  label, time-in-state (sequence-relative), and the primary action inline.
- **Episode drawer** (tap a card): the four-questions data for the current
  state, from the same sources the phone renders:
  - Intake answers (`st.qa`) and safety screen (wants / prior / flags)
  - AI summary (INVESTIGATE rows for the goal)
  - Labs (the synth panel the prototype already generates)
  - Adherence (run.logs summary) once treatment is active
  - Transcript placeholder line after any consult ("Transcript uploaded ·
    4,180 words" — simulated, marked as such)
  - **Action buttons** = `allowedEvents(st, pKey)` filtered to
    `actor === 'clinician'`. Nothing else. If the machine says Jamie has no
    move, the drawer says exactly why ("Waiting on lab upload").

### 2.2 The two demo moments that must land

1. Patient pays on the phone → the **Needs Signature** chip ticks up in the
   same second → Jamie opens the episode, sees the safety screen, clicks
   **Approve order** → the phone's Today card flips to "Preparing your
   treatment". No refresh, no seam.
2. Jamie clicks **Request a call** instead → the phone's card becomes "Dr
   Layla wants two minutes with you" with the call button.

### 2.3 What Clinic never does

No free-text notes, no fake EMR chrome, no tabs of its own. It is a queue, a
drawer, and the allowed actions. The spec's rule renders literally: the UI is
`filter(episodes, queue)`.

---

## 3. The State Machine visualization (Machine tab)

### 3.1 The graph — `src/dock/Machine.jsx`

A vertical swimlane, because the dock is tall and narrow:

```
        [trunk]           NEW → INTAKE_ACTIVE → ROUTED
       [fork]                ┌────────┴────────┐
   [known lane]          K1 → K2 → K3 → K4(→K4a)   [resolve lane] D1 → D2 → D3 → D4 → D5 → D6
       [merge]               └────────┬────────┘
       [merged]           M1_FULFILMENT → M2_TREATMENT_ACTIVE
       [post]             P1 → P2 → P3 → P4 (loops back to NEW)
```

- Nodes: rounded chips, spec state ids as labels. **Done** = filled navy,
  **current** = gold with a soft pulse, **reachable next** = outlined,
  **unreachable** = dimmed. The untaken fork lane dims entirely once routed.
- Edges: thin connectors; the edge just traversed draws itself in gold
  (300ms) when an event fires. The P4 → NEW loop edge is drawn explicitly —
  the machine never ends, it hands over.
- **Episode selector** at the top: one chip per open episode (category +
  intent), same source as the Today switcher. The graph follows the selected
  episode.

### 3.2 The levers

Grouped by actor, in the spec's actor order (Patient, AI, Clinician, Nurse,
Lab, Pharmacy, System). Each lever is a row: event name · actor chip · fire
control.

- A lever is **enabled only when `allowedEvents` contains it**. Disabled
  levers stay visible with their `reason` in plain words underneath
  ("Blood sample not collected yet"). That is the logical consistency: the
  panel is manual, but it is impossible to fire an event the machine would
  refuse.
- Firing a lever calls the same `fireEvent` gate as the phone and the
  clinic. The graph animates, the ticker appends, the phone moves, the
  queue counts change.
- Levers whose real-world action is pseudofied carry a small `SIM` tag:
  PAYMENT_COMPLETED (no money), LABS_UPLOADED (synth values),
  CONSULT_COMPLETED (no video), MEDICATION_DISPENSED / SHIPMENT_OUT /
  DELIVERY_CONFIRMED (no parcel), SAMPLE_COLLECTED (no nurse). The tag is
  the honest line between simulated world and real logic.
- Patient-actor levers work too (they drive the phone through the same
  gate), so the entire loop can be walked from this tab alone. Steps that
  genuinely need patient words (the intake chat) are represented by one
  lever, `INTAKE_SUBMITTED (autofill)`, which plays the funnel with default
  answers — marked SIM.

### 3.3 The ticker

Under the levers: the event log, newest first. `#seq · actor chip · EVENT ·
from → to`. Click an entry to flash the edge it traversed. This is the
"model the backend around events" idea made visible.

### 3.4 Guards shown as guards

Hovering (or tapping) any node shows its entry and exit conditions from the
spec, verbatim, with live ticks: which conditions are currently true. The
visualization teaches the spec while it runs.

---

## 4. Build order (each step ships alone)

1. **`src/machine.js`** — STATES, TRANSITIONS (with guard/fire/reason/writes
   per §3+§5 of the spec), `projectEpisode`, `episodesOf`, `allowedEvents`,
   `QUEUES`. Plus reducer case `log` and the `fireEvent` gate in App.
   *Accept:* drive both doors on the phone as today; `episodesOf` returns
   correct spec states at every step (assert via console in dev).
2. **Dock shell** — tabs Controls/Clinic/Machine, rail extracted unchanged,
   `?view=` boot param, wide mode.
   *Accept:* Controls tab is pixel-identical in behaviour to today's rail.
3. **Clinic tab** — queues, cards, drawer, clinician actions through
   `fireEvent`. Rewire the two existing harness checkpoint beats to the same
   gate (they become thin aliases).
   *Accept:* demo moments 2.2 both land; every clinician action available in
   the drawer exists in the spec's queue table, and nothing else.
4. **Machine tab** — graph, selector, levers, ticker, guard popovers.
   *Accept:* full walk of both doors from the Machine tab alone, phone
   following; a lever for an invalid event cannot be fired anywhere in the
   UI; escalation (red flag) visibly re-routes the token from the known lane
   to the resolve lane.
5. **Post-course loop** — verdict/reviewing/done already exist as states;
   add P4 `LOOP_OPENED` lever: logs the event, draws the loop edge, and
   seeds Episode N+1 (a new suggested episode chip at NEW pointing at the
   next question).
   *Accept:* the loop edge fires and a new episode appears at the top of the
   graph.
6. **Sweep + ship** — `screenOf` untouched (comment keys stable), drive all
   four categories through both doors and the loop, build, deploy to Pages,
   send the `?view=machine` link.

---

## 5. What is explicitly untouched

The phone's screens and copy, the feedback panel and its Supabase keys, the
P1/P2/P3 twin system, the deployment pipeline, and `valeo-app`. The harness
NEXT buttons remain but route through `fireEvent`, so the Controls tab, the
Clinic tab and the Machine tab can never disagree.

## 6. Risks and their answers

- **Two sources of truth** — avoided by construction: machine state is a
  projection of `st`, never stored.
- **Funnel screens are flow-local** (coach chat lives in component state) —
  answered by the SIM autofill lever for intake; every post-intake state is
  reducer-backed and fully drivable.
- **Multi-episode confusion** — the selector follows `st.focus` by default,
  and the queue cards carry the category chip everywhere.
- **Guard drift** — guards live only in `machine.js`; the UI renders
  `reason` strings from the same objects it checks. A guard can't disagree
  with its own tooltip.
