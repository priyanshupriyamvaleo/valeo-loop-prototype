# Two Doors, One Room — implementation plan for Valeo V1

**Source material:** `Customer_Spectrum.docx` (the spectrum, the Christensen mapping,
the product-differentiation table) and the journey diagram *"The Valeo Journey —
two doors, one room"*. This plan translates both into concrete changes to
`valeo-v1`, file by file, for implementation.

---

## 0. The idea, in five sentences

Valeo serves two different jobs that today share one funnel. A patient who
**knows what he wants** ("I want GLP-1") needs safe execution with minimum
friction — intake, a doctor's sign-off, checkout, dispatch. A patient with an
**unresolved problem** ("always tired, labs came back normal") needs uncertainty
reduced — investigation, a consultation, a judgment, then a plan. The product
must serve both **inside one flow the customer never sees the seams of**: a
single honest question routes him, and both doors converge into the same
post-commit loop (treatment → proof → next question) that the app already has.
The current build IS the unresolved-problem door; this plan adds the fork, the
known-solution door, and one AI-investigation surface, while keeping everything
else.

**The rule from the diagram, which applies to every new screen:** every box
exits into a dated, scheduled next event. Nothing exits into "we'll be in
touch."

---

## 1. Current state (verified against the code)

One URL, one state machine in `src/App.jsx`:

```
flow: home → between (greeting, goal chips) → coach (intake chat)
      → meet → consultation (live video) → brief (clinician recommendation)
      → buy (12-week plan + PaySheet) → app (tabs: plan | today | protocols)
```

- **Runs** live in `st.runs[pKey]`, statuses:
  `consulted → programme → bloodsBooked → bloodsDone → followup → ready →
  shipping → running → verdict → reviewing → done`. Created by the
  `'consulted'` reducer action **at the end of the consultation** — note:
  `patchRun` silently no-ops if no run exists, so any path that skips the
  consultation must create the run itself (see §5.4).
- **Intake** is data-driven: `COACH_OPENING` in `src/data.js`
  (goal → sub → sex → height → weight), `GOALS` (4 categories: `fat`, `test`,
  `long`, `post`), `GUIDED` (asked during the consultation wait),
  `leadFor(goal)` resolves the clinician/protocol.
- **Screens that map to the diagram already:**
  | Diagram box (Door B) | Existing screen |
  |---|---|
  | Minimal intake | `Coach.jsx` |
  | Instant consult (named doctor, held callback fallback) | `Meet.jsx` + `Consultation.jsx` |
  | Care brief ("what we heard") | `Brief.jsx` |
  | Commit (certainty of cause + fix) | `Buy.jsx` |
  | Verdict / baseline locked / retest scheduled | `Today.jsx` statuses |
  | The shared room (treatment, proof, next question) | `Today.jsx`, `Protocols.jsx`, `Practice.jsx` thread |
- **Harness:** right rail with P1/P2/P3 twins, Funnel jump buttons, `NEXT`
  system-step buttons, Load a full twin. **Feedback panel** (Supabase) keyed by
  `src/lib/screen.js` → `screenOf()`; comment keys must stay stable.

**What is missing entirely:** the fork, the known-solution door, and a visible
AI-investigation surface. That is this plan.

---

## 2. Vocabulary for the codebase

- `door = 'known' | 'resolve'` — which job the patient hired us for.
  `'resolve'` is the default (today's behaviour, unchanged).
- Never patient-facing. No screen, chip, or copy string may say "door",
  "known solution", "flow A/B", or "route". The customer sees one product.

Copy compass (from the doc's table — apply to every new string):

| | Door `known` | Door `resolve` |
|---|---|---|
| Optimise for | friction removed | understanding built |
| Verbs | start, review, dispatch, today | figure out, investigate, look into, explain |
| Time promises | "a doctor reviews it today", "3 steps" | "before we decide", "measured, not guessed" |
| AI presence | invisible (form logic) | visible (investigates + reasons, hands to the doctor) |
| Clinician presence | a checkpoint, same day | the centre of the product |
| Never | urgency theatre, discounts | jargon, "differential", "triage" |

---

## 3. The fork (routing logic + routing UI)

### 3.1 Where it lives

Inside the existing intake chat (`Coach.jsx`), as **one more chat question** —
not a separate screen, not a landing-page toggle. Position: **after** `sub`
(so routing knows goal + flavour) and **after** the shared clinical basics
(sex, height, weight), i.e. appended to `COACH_OPENING`:

```js
// data.js — COACH_OPENING gains one step
{ k: 'door', kind: 'door', q: 'Last one. Which of these sounds more like you?' }
```

### 3.2 The question is honest, and per-goal

Generic fallback options (two rich chips, each two lines — bold line + quiet
sub-line; `kind:'door'` renders them stacked, full width):

- **"I know what I want"** — *I've done my research. Help me start safely.* → `known`
- **"Something's off and I want answers"** — *Help me figure out what's going on first.* → `resolve`

Per-category overrides live in a new `DOOR_ASK` map in `data.js` so the words
match the goal (`fat`: "I want to start weight-loss medication" vs "I can't
lose weight and I don't know why" · `test`: "I know the treatment I'm after"
vs "My energy and drive are off — I want to know why" · `long`, `post`:
default to `resolve`-leaning copy; both options always shown).

```js
export const DOOR_ASK = { fat: {...}, test: {...}, _default: {...} };
export const doorOf = (st) => st.qa.door || 'resolve';
```

### 3.3 Door-A structured intake (3 more chat questions, `known` only)

Appended by `Coach.jsx` when `door === 'known'` (data in a new `KNOWN` block in
`data.js`, keyed by goal category):

1. **`wants`** — "What did you have in mind?" Options per category, from the
   spectrum doc's typical cases, e.g. `fat`: GLP-1 weekly injection / not sure,
   recommend one · `test`: testosterone support / ED medication. Each option
   carries the protocol it maps to (`{ t, pKey }`); "not sure" maps to the
   category default `leadFor(goal)`.
2. **`prior`** — "Have you used it before?" Never / Currently using /
   **Used it — it didn't work** (this one is a *disguised resolver*, see 3.4).
3. **`flags`** — one red-flag screen, multi-select, per category (authored in
   `KNOWN[cat].flags`, 3–4 items + "None of these"). Examples: `fat`: history
   of pancreatitis, thyroid cancer family history, pregnant/breastfeeding ·
   `test`: **trying to conceive in the next 12 months**, heart condition.

### 3.4 The escalation rule (the diagram's "escalates disguised resolvers")

If `prior === 'didn't work'` **or** any red flag is selected → the chat replies
in one sentence — *"That changes what I'd recommend. I want a doctor to look at
this with you — it takes about ten minutes and it's included."* — and the flow
continues down **door `resolve`** (`meet → consultation`). The `door` answer is
rewritten to `'resolve'`; nothing else special-cases it downstream. This must
feel like an upgrade (a doctor's attention), never a rejection.

### 3.5 Wiring in `App.jsx`

`Coach.onDone(a)` currently always goes to `meet`. It becomes:

```js
if (doorOf(...a) === 'known') {
  const pk = a.wantsPkey || leadFor(a.goal);
  setDetail(pk);
  setFlow('buy');            // straight to the plan — 3 steps to commit
} else {
  setMeetKey(leadFor(a.goal));
  setFlow('assess');         // the new AI surface, then meet (see §5)
}
```

---

## 4. Door A — the known-solution path

Diagram: *Structured intake → Clinician checkpoint → Commit*, "3 steps to
commit — deliberately short — metric: intent → checkpoint < 24h".

**One deliberate divergence from the diagram, decided by the founder:** the
checkpoint runs **after** payment (standard hims/Ro sequencing — intake →
checkout → same-day async provider review → dispatch), not before. The diagram's
"meds billed separately" note supports this: the programme is bought, the
medication ships only after sign-off. The checkpoint's escalation duty is
preserved post-payment (§4.3).

### 4.1 Commit = the existing `Buy.jsx`, with a `door` variant

`Buy` already is the hims-style PDP (title, price card, sectioned care table,
journey sheet, frozen CTA). Changes, all driven by a new `door` prop /
`carePlan(pKey, door)` parameter — **no new screen**:

- Small eyebrow above the title returns for door A only: `BASED ON YOUR ANSWERS`.
- The medication row's caption names what he asked for:
  `s: 'Your ${wantsLabel}, dispensed monthly in cold chain'`.
- The `how` info strip swaps to checkpoint copy:
  *"A Valeo doctor reviews your order today, before anything is dispensed.
  Your blood test confirms the dose is right for you."*
- `timeline[0]` (journey sheet) becomes
  `{ w: 'Today', t: 'Doctor review of your order', s: '...' }` instead of the
  door-B "Online consultation — Done" row.
- CTA unchanged: **Activate my plan · SAR {price}**.
- `onBack` for door A returns to the chat (`coach`), not the protocol page.

### 4.2 Run creation at payment

New reducer action in `App.jsx` (because `'programme'` uses `patchRun`, which
no-ops without an existing run):

```js
case 'orderPlaced':   // door A only — the run starts at payment
  return { ...s,
    runs: { ...s.runs, [a.protocol]: {
      status: 'programme', door: 'known', checkpoint: 'pending' } },
    focus: s.focus || a.protocol };
case 'checkpoint':    // 'approved' | 'call'
  return patchRun(s, target(s, a), { checkpoint: a.v });
```

`Buy.onPaid` dispatches `'orderPlaced'` when `door === 'known'` (door B keeps
today's `'programme'` patch — its run already exists from `'consulted'`).

### 4.3 The checkpoint, on Today (no new screen)

`Today.jsx` gains one card state. For a run with
`door === 'known' && status === 'programme'`:

- `checkpoint: 'pending'` → card: **"Dr. {name} reviews your order today"** —
  sub: "Nothing is dispensed until a doctor signs it off. You'll hear back
  today." (a dated next event, per the rule). No button; the practice thread
  (`Practice.jsx`) posts the same line.
- `checkpoint: 'approved'` → the existing "book your blood test" card takes
  over (status flow continues exactly as door B: `bloodsBooked → … → running`).
  Thread message: "Your order is confirmed. Step one is your blood test."
- `checkpoint: 'call'` → the escalation beat: card **"Dr. {name} wants two
  minutes with you before confirming"** → button opens `Consultation.jsx`
  (`flow: 'consultation'`) — the disguised resolver caught post-payment merges
  into door B and, on call end, continues to `brief`.

Harness `NEXT` additions (App.jsx) when focus run has `checkpoint: 'pending'`:
`[ 'Doctor approves the order' → dispatch checkpoint approved,
   'Doctor asks for a quick call' → dispatch checkpoint call ]`.

### 4.4 Steps-to-commit audit (acceptance)

Door A tap count from greeting: goal → sub → sex → height → weight → door →
wants → prior → flags → **plan screen** → Activate. Three *screens* to commit
(greeting/chat → plan → pay). If the chat feels long, `sub` may be skipped for
door A after `wants` is known — decide during build; do not cut sex/height/
weight (safety) or flags (the red-flag screen is the door's clinical spine).

---

## 5. Door B — keep everything, add the AI investigation surface

The doc's differentiation: here AI's role is **big — investigate + reason** —
and the clinician's role is **big — diagnose / decide**. Today the AI is
invisible (the wait screen implies work). Add exactly one surface.

### 5.1 New screen: `src/screens/Assess.jsx` (flow key: `assess`)

Position: `coach (door=resolve) → assess → meet`. One screen, no scroll,
cream, same editorial language as `Brief.jsx`. Content, top to bottom:

1. Eyebrow: `WORKING THROUGH YOUR ANSWERS` + a 2-second staged build-in
   (the three lines appear one by one — visible reasoning, not a spinner).
2. Title (Fraunces): **"Here's what's worth investigating."**
3. Three hypothesis rows from a new authored data block — each: bold area,
   one plain-English line, and the marker(s) it maps to as a small chip:

```js
// data.js
export const INVESTIGATE = {
  test: [
    { t: 'Hormone levels', s: 'Energy and drive both dropping usually starts here.', m: 'Total + free T' },
    { t: 'Thyroid & iron', s: 'The two most common mimics of low testosterone.', m: 'TSH · ferritin' },
    { t: 'Sleep & recovery', s: 'Poor sleep suppresses everything above.', m: 'discussed live' },
  ],
  fat: [...], long: [...], post: [...],
};
```

4. One honest boundary line: *"This is preparation, not a diagnosis. {Doctor}
   decides what matters on your call."* (AI investigates; the clinician
   decides — the doc's split, stated in one sentence.)
5. CTA: **"Review this with {doctor} now →"** → `meet`.

### 5.2 Downstream echoes (cheap, high-trust)

- `Consultation.jsx` wait stage "Reviewing what you've shared" gains a sub-line
  naming the same three areas (data reuse, no new design).
- `Brief.jsx` needs no change (the doctor's `speak.think` already reads like a
  conclusion to that investigation).

---

## 6. The shared room (post-commit) — no changes required

Both doors land in the same `RX_FLOW` loop the app already ships: treatment &
follow-through (`running` + logs + thread), **proof** (`verdict → results`, the
before/after in his own numbers), next question (`reviewing → done` → next
protocol). This is the diagram's whole point — build nothing new here. Only
nuance: `run.door` is kept on the run so copy can vary one line where it
matters (e.g. Today's first door-A card, §4.3).

---

## 7. File-by-file change list

| File | Change |
|---|---|
| `src/data.js` | `DOOR_ASK`, `doorOf()`, `KNOWN` (per-cat: `wants[]` with `pKey`s, `prior[]`, `flags[]`, checkpoint copy), `INVESTIGATE`, `COACH_OPENING` + door step, `carePlan(pKey, door)` variants (eyebrow, medication caption, `how`, `timeline[0]`) |
| `src/screens/Coach.jsx` | render `kind:'door'` rich chips; door-A follow-ups (`wants`, `prior`, `flags`); escalation sentence + rewrite `door` to `resolve`; return `wantsPkey` in `onDone` payload |
| `src/App.jsx` | route on `doorOf` after coach; new flow `'assess'`; `'orderPlaced'` + `'checkpoint'` reducer actions; door-A `Buy` wiring (`detail` from `wantsPkey`, `onBack → coach`); harness `NEXT` checkpoint beats; Funnel rail + `['assess', 'AI assessment']` |
| `src/screens/Assess.jsx` | **new** (§5.1) |
| `src/screens/Buy.jsx` | `door` prop: eyebrow, medication caption, `how` copy, timeline row 0, back target |
| `src/screens/Today.jsx` | checkpoint card states for door-A `programme` runs (§4.3) |
| `src/components/Practice.jsx` | thread lines for order-placed / approved / call-requested (via existing `'say'` action from App, keyed so they fire once) |
| `src/lib/screen.js` | add `assess: 'AI assessment'`; keep every existing key unchanged (comments are keyed to them) |

Explicitly untouched: `Consultation.jsx` phases, `Brief.jsx`, `Meet.jsx`,
`PaySheet.jsx`, the Feedback/Supabase panel, theme, portraits, GitHub Pages
setup, and the whole `valeo-app` folder.

---

## 8. Build order (each step ships alone, testable in the harness)

1. **Data layer** — everything in the `data.js` row above. Build passes; no UI
   change yet. *Accept:* `doorOf({qa:{}}) === 'resolve'`.
2. **The fork in Coach** — door question renders after weight; picking
   "resolve" reproduces today's flow byte-for-byte. *Accept:* existing funnel
   unchanged when answering `resolve`; `qa.door` recorded.
3. **Door A to commit** — `wants/prior/flags` questions; escalation rule; App
   routes `known` → `Buy` with door variants. *Accept:* greeting → paid in 3
   screens; a red-flag answer lands on `meet` with the escalation line in the
   chat.
4. **Checkpoint on Today** — `orderPlaced`/`checkpoint` actions, Today cards,
   thread lines, harness beats for approve/call; `call` opens the
   consultation and continues to `brief`. *Accept:* both harness beats
   playable end-to-end.
5. **Assess screen** — build + wire `resolve` route through it. *Accept:*
   coach → assess → meet → consultation unchanged after that point.
6. **Sweep** — `screenOf` keys, Funnel rail, drive all four goal categories
   through both doors, deploy to Pages.

---

## 9. Open decisions (defaults chosen; flag if wrong)

1. **Checkpoint after payment** (chosen, per founder instruction + hims
   convention) vs before commit (as drawn). Reversible later by moving the
   card before `PaySheet`.
2. **`sub` question for door A** — currently kept (it feeds the twin). Cut it
   if the chat feels one question too long.
3. **Named medication pre-checkout** — door A names what the patient asked for
   in the medication row caption ("Your GLP-1 weekly injection…"), because he
   named it first. The doctor's sign-off still gates dispatch. If clinical
   review prefers not to name it before the checkpoint, swap the caption for
   "the treatment you selected".
4. **Metrics** — the diagram defines door metrics (A: intent→checkpoint <24h;
   B: consult→commit rate). Prototype scope: not instrumented; noted here so
   the production build carries them.

---

## 10. The five tests (run before calling it done)

1. Walk door A as a GLP-1-decided patient: do you commit in ~3 screens without
   ever meeting a card that asks you to reconsider?
2. Walk door B as "always tired, labs normal": does every screen build
   understanding before asking for money?
3. At any screen, could a user tell there are two architectures? If yes, the
   seam is showing — fix the copy, not the routing.
4. Trip a red flag in door A: does the escalation read as being taken more
   seriously, not rejected?
5. Does every new box exit into a dated, scheduled next event?
