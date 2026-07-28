# Twin Match — the celebrity-supply front door

**Status:** plan. Nothing built yet.
**Supersedes the front half of** TWIN_FLOW_PLAN.md (DS1–DS6). The back half
(consult → baseline → loop → verdict) is untouched.
**New:** P17–P20, B13–B16, M39–M43. Nodes DS1–DS6 rewritten, DS5a/DS5b added.

---

## 0 · What actually changed in this spec

The previous deck was **protocols with a virtue line**. This spec turns it into
**people, whose payload is a protocol.** That is not a reskin — it changes what a
card *is*, what a save *means*, and what the product *is for*.

Old: *"Here's Metabolic Reset. Athletes use it."*
New: *"Here's Huberman's twin. You're an 88% match. This is what he runs."*

The second is a categorically stronger proposition, because it answers the
question a cold user actually has — **"who is already doing this and did it work
for them"** — with a person rather than a claim. Celebrity supply is inventory
you can *see*, and it solves the deck-inventory problem (B11) from the other
direction: you don't need 200 protocols, you need 40 interesting people.

**Structural consequence:** the swipe deck becomes a two-sided marketplace with
a supply side we have to acquire. That is a business change, not a UI change,
and it is flagged in B13.

---

## 1 · The one idea in here better than anything I proposed

**"A loop-like figure around a human figurine — loops + twin as one single idea."**

All session the Loop Ring and the Twin body map have been two separate visual
languages sitting in different tabs. Merging them — the ring as an *orbit around
the body*, body inside, phase arcs on the ring, completed loops as inner rings —
collapses the entire thesis into **one glyph**:

> the loop runs on your biology

That becomes the product mark. It goes on the cold open, the app icon, the
loading state, the verdict screen. Craft notes for getting it right:

- The ring **encircles**, it does not sit behind. Body must read as *inside* it.
- Phase arcs stay on the ring (Measure · Read · Commit · Act · Prove) so the
  glyph is still functional, not decorative.
- Completed loops nest **inward** as tree rings — already built, reuse.
- The figurine stays androgynous, abstract, shape-invariant (MOH Art. 20, R6).
- One accent only. The ring carries colour; the body is a silhouette.

## 2 · The strongest mechanic in here — and why it beats mine

**Blur → answer the questions you skipped → reveal → back to swiping.**

My tier gate was abstract: *"4 protocols sit in Advanced."* Theirs is concrete:
*"Huberman's protocol is behind this blur."* Concrete desire beats categorical
desire every time. And the redirect goes to **specifically the questions you
skipped** — it isn't a generic form, it's the exact debt you owe. That closes a
tight loop the previous design never had:

```
swipe → hit a blurred card → answer 3 skipped questions → card reveals → swipe on
```

**Craft note — the blur must be partial.** Total blur kills desire because there
is nothing to want. Show the **photo, the name, and one hook line sharp**; blur
only the **match score and the protocol contents**. You need to know exactly
whose door is shut.

**P17 — Gate the payoff, never the identity.**

## 3 · Where I was wrong: dropping the pass-reason

I argued for capturing *why* on every left swipe. This spec kills it and replaces
it with a counter — *"swipe 20 cards, your twin is learning your preferences."*

They're right and I'll concede it cleanly. A modal on a pass **breaks the swipe
rhythm**, which is the only reason the mechanic works at all; Bumble and Hinge
never interrupt a pass. And implicit signal at volume (what you passed, what you
dwelled on, what you opened) is richer than a forced-choice reason at low volume.
I was optimising the data model at the cost of the behaviour that produces data.

**P18 — Never interrupt a swipe. Convert intent into forward motion, not a modal.**

## 4 · The contradiction I have to design around

Leading with celebrities inverts the epistemics we spent the whole project on.
If the card says *"Huberman runs this,"* the product can read as **copy famous
people** — the exact opposite of *verified for you*.

The reconciliation is a sequencing one, and it needs to be visible in the UI:

> **The influencer is the entry. The verdict is the exit.**
> You come in because Huberman does it. You stay because we told you whether it
> worked *on you* — and he can't tell you that.

Concretely: every card detail ends on one line —
*"In 12 weeks we'll tell you whether this worked on you, not on him."*
That single line keeps the thesis alive inside the celebrity frame. Without it we
are a fan-merch store for protocols.

**P19 — Celebrity opens the door; the verdict is what's behind it. Say so on every card.**

---

## 5 · Screen-by-screen spec

### DS1 · Meet your twin (rewrite)

| | |
|---|---|
| **Hero** | The merged glyph — ring orbiting a figurine (§1) |
| **Eyebrow** | ◈ Introducing Valeo Twins |
| **Headline** | Meet your twin. |
| **One-liner** | Proposed: **"A glimpse of you, that reads everything you don't have time to."** (alternates in §9) |
| **Social proof** | `[N] twins already built` · `[N] verified experts onboard` — numbers needed (Q) |
| **Platform claim** | The point they asked to land clearly: *"The people who set the protocols are on here. Their twins are too."* |

Three pointers:
1. **It reads what you don't have time to** — trials, protocol logs, what actually held up. Continuously.
2. **TWIN MATCH** — *"Your twin matches with theirs."* Scientists, longevity
   researchers, the people others copy. You see what they run and how close their
   biology sits to yours.
3. **It brings back only what cleared the bar** — scored against your body, not a
   general audience.

**CTA:** `See who's already in →`
**Secondary:** `Check Huberman's protocol` *(deep-links straight to a blurred card
— desire before signup, which is the right order)*

### DS2 · Warm start (edits, per spec)

- Keep: **"You're already at 34%"** + tracker.
- **Remove** the ghost/ceiling "→ 48% after 5 questions" label.
- **Remove** the "Most people start a health app at zero…" paragraph.
- **Remove** the green "Nothing here is new to us…" callout.
- **Remove** the `Something's changed` secondary button.
- **Remove** the closed-loop item — nobody has one yet.
- Known items collapse to **two**, rendered as substantial cards rather than thin rows:
  1. 🧪 **Blood tests, supplements & peptides** — what you've ordered from Valeo
  2. 👤 **Age, weight & city** — from your account
- **CTA:** `Make my twin smarter →`

### DS3 · The questions (full rebuild — 3 sets)

Adopting the **Hinge multi-question pattern** wholesale: several questions per
scrolling screen, chip selects, a counter in the CTA (`Next 3 / 7`), thin progress
bar top, `Skip` top-right. It shows you the end, lets you move, and creates
completion pressure without blocking. Far better than my one-question-per-screen.

**Set 1 — Basic info** (mandatory core)
| Q | Pattern |
|---|---|
| Age | Drum picker |
| Sex at birth | Chip row (clinical framing — it drives reference ranges) |
| Location | Map-style area picker (Q4) — framed for Valeo: *"Where should the nurse come?"* |
| Height | **Drum picker, two columns, FT/CM toggle** — direct from reference |
| Weight | Drum picker, KG/LB toggle |

**Set 2 — Lifestyle** (one scrolling screen, 7 chip questions)
| Q | Asked as |
|---|---|
| Occupation | *"What do you do all day?"* — chips: Desk-bound · On my feet · Shift work · Travel constantly · Physical labour |
| Smoking | *"Where do you land on smoking?"* — Non-smoker · Social · When drinking · Daily · Trying to quit |
| Alcohol | *"And drinking?"* — Never · Special occasions · Weekends · Most nights |
| Activity | *"How much do you move?"* — Barely · Some weeks · 3–4×/week · Most days · Twice a day |
| Activity type | Lifting · Running · Padel/tennis · Football · Yoga/pilates · Walking · Swimming |
| **Diet** | **Asked sideways, per spec:** *"What food do you actually love?"* — Grilled meat · Rice & carbs · Bread & pastry · Salads & greens · Seafood · Sweets · Fried food · Dairy heavy · I eat anything ← infers dietary pattern without a lecture |
| Sleep | *"How's sleep, honestly?"* — hours chips (<5 · 5–6 · 7–8 · 9+) + quality chips (Out cold · Fine · Broken · Wired & tired) |
| Stress | *"How loud is life right now?"* — Low · Manageable · High · Relentless, then source chips (Work · Money · Family · Health · Travel) |

**Set 3 — Goals**
| Q | Pattern |
|---|---|
| Primary goal | Single-select, large cards (this one gets weight — it drives the whole deck) |
| Secondary goals | Multi-select chips |

**Two celebration interstitials**, lifted from the references — full-bleed,
centred serif, one line, enormous whitespace:
- after Set 1 → *"Off to a good start, Faisal."*
- after Set 3 → *"Your twin has what it needs."* + a **glass summary card** listing
  what was captured (icon rows, matching reference screenshot 6)

**Two trust primitives stolen and upgraded for health:**
- Dating's `Visible on profile` (eye icon) → **`Only your clinician sees this`**
- Dating's `Wondering why we ask this? Learn more` → kept verbatim; on health data
  it earns far more than it costs. PDPL-aligned (R7).

**Tracker** fills continuously across all three sets.
**Final CTA:** `Show me my twin matches →`

### DS4 · Loading / matching (rewrite)

Same honest-work structure, new content — matching, not scanning:
```
Reading your twin · 14 signals
Finding verified twins near you · Riyadh, Dubai, London
Comparing your biology to theirs
Pulling their current protocols
Scoring what would transfer to you
```
Ends: *"6 twins matched. 2 are behind a blur."* — plants the gate before it's hit.

### DS5 · Twin Matches — the deck (rebuild)

- **Title:** Your twin matches
- **Card:** full-bleed portrait photo, **glass-panel overlay** (frosted, bottom
  two-thirds), Bumble-style. Not the current navy header card.
- **Card face:** photo · name · *Twin* label · **match score top-right** · one hook
  line · protocol name · duration · marker
- **Hook lines** (their examples, kept flashy):
  *"Top 1% of Dubai follow this for fat loss"* · *"Viral in longevity circles on X"*
  · *"What the top 3 padel players in KSA run"* · *"[Partner name]'s standard stack"*
- **Blurred cards:** photo + name + hook **sharp**; match score and protocol
  **blurred**. Tap → `Answer 3 questions to reveal` → routes to *exactly the
  skipped questions* → returns to the card, revealed. (§2)
- **Left swipe: no modal.** Top of screen carries the learning counter:
  `◍ Your twin is learning your type · 7 of 20 swipes`
- **Bottom of deck:** Advanced section with a **famous person's protocol locked
  and blurred**, and `Complete your twin →`
- That CTA routes to **Twin**, landing on an *immediately fillable* section —
  and the top gate there is **`Book a blood test to unlock Advanced`**, which
  converts the unlock ladder into the baseline we actually need.

**The unlock ladder becomes:**
```
questions answered ──▶ blurred cards reveal
blood test booked  ──▶ Advanced / Elite tiers
loop completed     ──▶ Inner Circle
```
Better than pure twin-%, because each rung buys us something real: data, then a
baseline, then a corpus entry.

**P20 — Every gate must be unlocked by something the loop needs anyway.**

---

## 6 · Data model changes

```js
TWINS = [{                      // NEW — the supply side; the card is a person
  id, name, handle, role,       // "Andrew Huberman", "@hubermanlab", "Neuroscientist"
  img,                          // asset path — needed from you (Q2)
  match, hook, tier,
  protocol: 'K6',               // FK into CATALOG — downstream flow unchanged
  blurred: true|false,
  needs: ['sleep','stress']     // which skipped question groups unlock it
}]
```
- `CATALOG` **stays** — it's now the payload, not the card. Everything downstream
  (save → consult → baseline → loop → verdict) keeps working untouched.
- `TWIN_KNOWN` → 2 grouped items (§DS2).
- `PASS_REASONS` → **deleted**; replaced by `swipes` counter in state.
- `TIERS` unlock keys change from `at:%` to `{questions|bloodtest|loop}`.
- State adds: `swipes`, `skipped[]`, `revealed[]`, `bloodBooked`.
- Saving a match = adding `twin.protocol` to `saved` — so **Protocols renames
  "Saved" to "Matches"** and nothing else in that tab changes.

## 7 · Build order

1. **The glyph** — merged ring + figurine. Everything else is styled around it.
2. **DS2 edits** — smallest, fully specified, no open questions. Ship first.
3. **DS3 question engine** — biggest single piece. Drum picker, chip groups,
   counter CTA, skip tracking, interstitials.
4. **DS1** — needs the glyph and the numbers.
5. **DS4** — copy swap, cheap.
6. **DS5 deck rebuild** — glass photo cards, blur gate, swipe counter, skipped-
   question routing.
7. **Twin tab** — blood-test gate as the top fillable section.
8. Validate, mobile + desktop, push.

## 8 · New blindspots

- **B13 — The deck now has a supply side.** 40 interesting people with real,
  documented protocols and image rights. That's a partnerships function nobody
  owns. It's a better-shaped problem than 200 protocols, but it is a *business*
  dependency, not a design one.
- **B14 — Named individuals is a harder legal position than "top athletes".** Real
  name + photo + implied protocol endorsement is right-of-publicity and false-
  endorsement territory. Fine for an internal prototype; needs signed partners
  before anything public. (Q2.)
- **B15 — Celebrity entry may select for copycat intent, not verification intent.**
  These users want *his* stack, not *their* answer. Watch retest rate by entry
  path — if celebrity-entry users adhere and retest worse, the front door is
  filling the funnel with people who leave before the thing that matters.
- **B16 — 20 swipes before the twin "learns" is a promise with a deadline.** At
  swipe 20 something visible must change or the mechanic is exposed as theatre.

## 9 · Copy options for the DS1 one-liner

They flagged uncertainty here. Ranked:
1. **"A glimpse of you, that reads everything you don't have time to."**
2. "Your biology, with someone reading the research for it."
3. "It knows your body. It reads their protocols. It tells you what transfers."
4. "The stack a full-time optimiser would build for you — without becoming one." *(current)*

I'd take #1 for the hero and #3 as the sub-line — #3 states the mechanism in one
breath, which is what the three pointers then expand.
