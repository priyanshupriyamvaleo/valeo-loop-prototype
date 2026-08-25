# The two prototypes, and how to demo them

Two apps, one origin.

- Patient app: `https://priyanshupriyamvaleo.github.io/valeo-loop-prototype/p1/`
- Valeo Studio: `https://priyanshupriyamvaleo.github.io/valeo-loop-prototype/p2/`

Open both, side by side, in two tabs of the same browser. They talk to each
other through `localStorage` and the `storage` event, which only reaches other
tabs of the same origin. Two different browsers, or one normal window and one
private window, are two different stores and the link will not work.

Start every run by pressing **Reset demo** in the Studio. It clears both apps.

## The point of the demo

The patient app has no journey hardcoded in it. Every time it needs something
that has not been configured yet, it stops on a waiting screen and names the
Studio surface that owns it. Publish that surface next door and the waiting
screen turns into a **Continue** button, live, with no refresh.

So the demo is a loop, run four times: **stop, configure, publish, continue.**

## The run

### 1. The home screen, in three states

In the patient app, use **The demo · Home screen state** on the right.

- *Nothing active* is Discover: the goal picker.
- *Weight loss active* is the existing GLP-1 journey. The second dropdown
  switches between the four ways a patient enters it (prescription led,
  medicine purchased, blood test booked, tagged by ops). All four are one card.
- *Protocol active* is a Recover and Rebuild patient mid-journey.

Set it back to *Nothing active*.

### 2. Pick Recover and Rebuild

The app stops: *"Triage chat has not been published yet."* Continue is dead.

### 3. Studio: Onboarding Chat Builder

Goal **Recover and Rebuild**, surface **Onboarding Chat Builder**. Two questions
are seeded. Add a third, edit the wording, reorder them. Press **Publish triage
chat**.

Watch the patient tab as you publish. The waiting screen becomes
*"Triage chat is published"* and Continue lights up. Nothing was refreshed.

### 4. Patient app: answer the triage

Continue, then answer. The third question is the one you just wrote.

There is no gating here. Every Recover and Rebuild patient reaches the same next
step, so these answers buy the doctor context rather than route anybody.

The app stops again: *"Pre-purchase flow has not been published yet."*

### 5. Studio: Pre-purchase Builder

Three tabs: PDP, Cart, Confirmation.

Two things on this screen are refusals rather than fields:

- On **Cart**, the promo code field is locked off. *The protocol is the offer.
  Bundle or discount, never both.*
- On **PDP**, clear **The 12-week statement** and the Publish button goes dead
  and says why. It is the fix for one-month churn, so the builder treats it as
  structural, not as copy. Put it back and Publish turns on again.

Publish.

### 6. Patient app: buy the protocol

Continue, then walk PDP to Cart to Confirmation. AED 3,799, or three payments of
AED 1,349. No promo field anywhere, because the Studio refused to allow one.

The confirmation offers one action: book your nurse visit. Your protocol starts
with testing.

Then it stops: *"Protocol plan has not been published yet."*

### 7. Studio: Protocol Builder

The Recover and Rebuild template, pre-filled: 14 items, each with a due offset
in days. Edit any of them with the pencil. Add one. Reorder them.

Three items refuse to be deleted: the baseline panel, the doctor consultation
and the Week 12 panel. Press the bin on one and it tells you why. Their wording
is still yours to change; the step itself stays.

Publish.

### 8. Patient app: the journey begins

Continue. Home now carries the protocol card, showing the next action.

This is the part worth saying out loud: **that card is one card.** It is not
fourteen designs. It renders whichever plan item is due next, which is why the
item you added in step 7 is already in the patient's journey without anybody
writing a screen for it.

Work through to the doctor consultation. The app stops:
*"Consult outcome has not been published yet."*

### 9. Studio: Clinician Console

A checklist, not a free editor. A doctor leaving a call has two minutes.

Record an outcome and a dose note. Then look at **TB-500 (Wolverine upgrade)**:
it cannot be offered while the competition question is unanswered, and it cannot
be offered if the answer is *yes, tested sport*, because TB-500 is
WADA-prohibited. Answer *No* and the control turns on.

Offer the upgrade, nurse visits and physiotherapy. **Save consult outcome.**
This is the one surface in the Studio that writes to a patient rather than to a
template.

### 10. Patient app: the doctor's additions

Continue. The three items the clinician added are now in the journey, marked
*added at your consult*, each sitting at its own due date among the template
items. No new code, no new screen.

## What to say when somebody asks how much is real

The refusals are real. The promo lock, the 12-week statement, the three
undeletable clinical steps and the WADA gate all fail in the builder, at the
moment somebody tries, rather than being caught later in review.

Drafts and published are genuinely separate. Typing in the Studio changes
nothing on the phone until Publish, and the version stamp on each surface says
which one the app is reading.

Clinical lists, panel contents and prices are placeholders pending sign-off.

## Running it locally

```bash
npx vite --config valeo-proto/vite.config.js
```

Then `http://localhost:5180/valeo-loop-prototype/p1/` and `/p2/`.

To rebuild and place the deployable files at `/p1/`, `/p2/` and
`/proto-assets/`:

```bash
./valeo-proto/deploy.sh
```
