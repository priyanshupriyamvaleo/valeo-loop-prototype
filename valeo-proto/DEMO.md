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

So the demo is a loop, run five times: **stop, configure, publish, continue.**

## The run

### 1. The home screen, in three states

In the patient app, use **The demo · Home screen state** on the right.

- *Nothing active* is Discover: one offer, "Introducing Valeo Protocols".
- *Weight loss active* is the existing GLP-1 journey. The second dropdown
  switches between the four ways a patient enters it (prescription led,
  medicine purchased, blood test booked, tagged by ops). All four are one card.
- *Protocol active* is a Recover and Rebuild patient mid-journey.

Set it back to *Nothing active*.

Note what home does NOT do: it does not ask you to pick a goal. The goal picker
used to sit here and it demanded a decision from somebody who had not been asked
a single question. It now comes at the end of the onboarding chat, once there
are answers to suggest one from.

### 2. Tap "Choose a goal"

The app stops: *"Onboarding chat has not been published yet."*

### 3. Studio: Onboarding Chat Builder, "Onboarding chat"

The chat builder now holds two chats, and the sidebar shows both under it.

**Onboarding chat** is the first one. It belongs to no goal, because it is the
conversation that decides which goal you are in, so it is edited once for the
whole product. Three parts:

- The questions that work out what somebody is here for.
- **Details collected** is age, sex at birth, height and weight. These are what a
  doctor needs on file before anything can be prescribed.
- **Which goal each answer suggests.** Change one and watch the suggestion move.

Publish it, and watch the patient tab unlock as you do.

### 4. Patient app: the onboarding chat

Continue, then answer. Five steps: three questions, the details, then the goal.

The goal step always shows all three goals. One of them is marked **Suggested**,
from the rules you just looked at. It is a suggestion and nothing else, because
a chat that quietly forces a route is a router wearing a conversation as a
costume.

Two of the three are worth showing:

- Pick **Weight loss** and you land on the GLP-1 journey Valeo already ships.
- Pick **Skin and hair** and it stops honestly, on that goal's own unpublished
  triage gate.

Reset the patient and pick **Recover and Rebuild** to carry on.

The app stops: *"Triage chat has not been published yet."*

### 4b. Studio: the same builder, "Goal triage chat"

The second chat, and this one is per goal. Two questions are seeded. Add a
third, edit the wording, reorder them. Publish.

There is no gating here. Every Recover and Rebuild patient reaches the same next
step, so these answers buy the doctor context rather than route anybody.

### 4c. Patient app: answer the triage

Continue and answer. The third question is the one you just wrote.

The app stops: *"Pre-purchase flow has not been published yet."*

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

Open it. One fixed structure, top to bottom, and it does not rearrange itself:
what is next, the logbook, what follows, help. The coach sits top right, where
it sits on the home card.

**A step is not done or not-done.** It is asked, booked, waited on, then done,
and it says something different in each. That is the part worth walking slowly:

- **Book nurse visit** opens as *"We start with your blood test"*, with the
  three objections a home blood draw actually raises answered above the button.
- Choose a time and the card stops being a task and becomes an appointment:
  *"At-home blood test, arriving Wed 3 Sep 08:30"*, with what to do beforehand.
  The slot carries from the step that booked it to the step it belongs to.
- Move time on and the lab has it: *"We are analysing your sample. This usually
  takes 24 to 48 hours."* Not "your doctor is reviewing your results", which
  would be chronologically impossible and is the kind of small lie that costs
  trust the first time somebody notices it.
- Then *"Your baseline panel is ready"*, with two things to do and the report
  first, because reading it is what makes the consultation worth booking.
- **View your report** opens the panel. Book from there, and the card becomes
  *"Consultation booked, scheduled for Thu 4 Sep 11:00"* with **Join
  consultation**. Booking a consultation is not attending one, so the step stays
  open and changes what it says.

**Time moves from the rail, not from the phone.** Nine of the fourteen steps
belong to a nurse, a lab or the pharmacy, and a patient cannot make those
happen. A "mark this as done" button on the patient screen to advance them is
the thing that makes a prototype read as a prototype. Use **Move time on** in
the demo panel instead.

The logbook underneath carries the week, a recovery score folded out of the two
numbers the patient reports, and four capture tiles that unlock where the
protocol reaches them. The score works on day zero, before any blood is drawn,
which is what stops the first nine days being an empty chart.

Pressing anything opens one of **five screens, not fourteen**: a scheduler, a
status view, the report, the call, or the check-in.

Work through to the doctor consultation. The app stops:
*"Consult outcome has not been published yet."*

### 9. Studio: Clinician Console

It opens on a **queue**, because a doctor does not arrive at one patient, she
arrives at a list: who is waiting, how long, and for what. Ahmad is the patient
sitting in the other tab and is marked **live**; the other three are marked
**fixture** and exist to show what a queue looks like.

Open Ahmad and read **Before this call**. His whole history is folded shut, one
section at a time: onboarding, triage, purchase, progress, previous consults.
None of it is authored anywhere. It is read out of the patient app, so the
answers on this screen are the answers that were really given next door. Open
the onboarding fold and you will see the height and weight you typed in step 4.

Switch to Leila and back to see the folds and the form reset. A doctor who
switches patients gets a clean screen, never the last person's half-typed note.

Then the outcome itself: a checklist, not a free editor, because a doctor
leaving a call has two minutes.

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

Logging is deliberately two numbers and nothing else. Weight, meals and scans
need an ops backend that does not exist yet, and the screens say so where a
number would otherwise be invented. Appointment slots and consignment tracking
are labelled the same way.

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
