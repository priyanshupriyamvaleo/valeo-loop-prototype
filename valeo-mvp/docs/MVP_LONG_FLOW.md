# MVP · The long flow (NEED_DIAGNOSIS): split payment + copy deck

Decision fixed: the long flow sells the **blood test first (SAR 499, applied
toward the programme)** and closes the programme at the **results review**.
This document is the flow, the clarity rules learned from the reference
products, and the copy deck. Every line of copy is borrowed from a named
pattern; nothing is invented.

Reference corpus (fetched Aug 2026): Midi (how-it-works), Hone (TRT page),
Marek (Guided Optimization), Lifeforce (membership), Parsley (membership
walkthrough), plus the standard clinic credit convention documented on
RealSelf / ABCS.

---

## 1. The flow (states unchanged, one payment split in two)

```
Instant consult (free, live)              D2   ← unchanged
  ↓
Care brief: assessment + programme        D3   full price VISIBLE, not asked
  ↓  CTA: Book my blood test
Test checkout · SAR 499                   D4   nurse slot held at checkout
  ↓
Nurse draw at home → lab                  D5   results review pre-booked
  ↓
Results review with the doctor            D6   the conviction peak
  ↓  CTA: Start my programme (balance: total minus 499)
Fulfilment → treatment → the loop         M1+  unchanged
```

Machine note: `PAYMENT_COMPLETED` splits into `TEST_PAID` (D3 → D5) and
`PROGRAMME_ACTIVATED` (D6 → M1). The known door (weight loss only) is
untouched: monthly plan, checkpoint, no labs.

---

## 2. Clarity rules (how the good ones avoid confusion)

1. **One number per moment.** At the test checkout the only price is 499. At
   the review the only ask is the balance. The programme total appears as
   context, never as a second ask on the same screen. (Hone separates the $65
   test from the $155/mo membership; Lifeforce stages $599 → $149; neither
   ever shows two asks at once.)
2. **One phrase for the money mechanic, reused verbatim everywhere:**
   **"applied toward the cost of your programme."** This is the standard
   clinic credit convention ("some clinics charge a small fee for the
   consultation which is then applied as a credit to the cost of your
   procedure" — RealSelf/ABCS). Never mix in "deposit", "credited",
   "counts toward", or "refundable". One mechanic, one name.
3. **Steps are patient verbs, two to four words.** Midi: "Start Your Care
   Plan". Hone: "Get Tested". Lifeforce: "Measure your baseline · Interpret
   your results · Start your program · Retest and refine". Ours match this
   shape exactly.
4. **The doctor line is possessive and concrete.** Hone verbatim: "Your
   licensed physician will review your labs & health history." Never "our
   clinical team will assess".
5. **Labs are explained as the doctor's need, not a product.** Midi verbatim:
   "If needed, they'll order blood work … to help pinpoint effective
   solutions." Parsley verbatim: "review the results with your provider …
   to identify the root cause of your symptoms."
6. **The balance ask is cart math, three rows.** Total · applied · due today.
   Standard checkout summary, universally read, zero learning.
7. **Every screen ends in a dated, scheduled next event** (ours), and the
   next event is stated in the patient's words: Midi's "Book Your Virtual
   Visit" verb pattern, our first person ("Book my blood test").

---

## 3. Copy deck, screen by screen

No em dashes anywhere in product copy.

### 3.1 Care brief (D3) — additions under the recommendation panel

| Element | Copy | Borrowed from |
|---|---|---|
| Programme price line | `Male Hormone Programme · SAR 4,299 · 12 weeks of care` | Lifeforce price staging (total visible as context) |
| The ask | `Start with your blood test. SAR 499.` | Hone "Get Tested" first-step pattern |
| The mechanic | `Applied toward the cost of your programme.` | Clinic credit convention (RealSelf/ABCS) |
| Why the test | `${Doctor} reviews your results with you before any treatment is confirmed.` | Hone "Your licensed physician will review your labs & health history" |
| CTA | `Book my blood test` | Midi "Book Your Virtual Visit" verb pattern |

### 3.2 The four steps (replaces the current "what happens next")

| # | Label | Sub-line | Borrowed from |
|---|---|---|---|
| 01 | `Blood test at home` | `A nurse comes to you. SAR 499, applied toward your programme.` | Lifeforce "Measure your baseline" + our ops |
| 02 | `Review your results` | `A video visit with ${Doctor} to talk through what your results show.` | Parsley "review the results with your provider"; Lifeforce "Interpret your results" |
| 03 | `Start your programme` | `Treatment confirmed on your results. Pay the balance only when you start.` | Lifeforce "Start your program" |
| 04 | `Retest and refine` | `Repeat testing at week 12 shows what changed.` | Lifeforce "Retest and refine", verbatim label |

### 3.3 Test checkout (D4 · PaySheet)

| Element | Copy |
|---|---|
| Item | `At-home blood test with nurse` (production PDP language) |
| Price | `SAR 499` |
| Under the pay button | `Applied toward the cost of your programme. A nurse comes to you.` |
| Slot line | `Pick a time that suits you.` (existing) |

### 3.4 After payment (D5 · Today card + thread)

| Element | Copy | Borrowed from |
|---|---|---|
| Card tag | `Step 1 of your programme` (existing) | — |
| Card title | `Your blood test comes first.` (existing) | — |
| New sub-line | `Your results review with ${Doctor} is already booked for {date}.` | Dated-exit rule; Midi follow-up cadence |
| Waiting state | `We'll message you the moment your results are in.` (existing) | — |

### 3.5 Results review (D6 · the conviction peak)

| Element | Copy | Borrowed from |
|---|---|---|
| Card tag | `Results review` | — |
| Card title | `You'll review your results with ${Doctor}.` | Parsley verbatim pattern |
| Sub | `Together you'll talk through what's driving your symptoms and confirm your treatment.` | Parsley "identify the root cause of your symptoms" |

### 3.6 Activation (D6 exit · the balance ask)

Cart math, three rows, then one CTA:

```
Your programme          SAR 4,299
Blood test, applied     − SAR 499
Due today               SAR 3,800
```

| Element | Copy | Borrowed from |
|---|---|---|
| Title | `Start your programme` | Lifeforce "Start your program" |
| Sub | `Your treatment is confirmed on your results.` | Hone physician-review pattern |
| CTA | `Start my programme · SAR 3,800` | our CTA convention |
| Lock line | `12 weeks of clinician-led care, treatment and follow-up. Your blood test is already paid.` | existing + mechanic restated |

### 3.7 If they pause at the review

The episode stays in Waiting Patient with the held date. One reminder message
in the practice thread, no urgency theatre:
`Your results and ${Doctor}'s recommendation are saved. Whenever you're ready, your blood test stays applied toward your programme.`

---

## 4. What is deliberately NOT said

- No "deposit", no "refund", no "credit" (one mechanic, one phrase).
- No "save SAR 499" framing. It is not a discount; it is their money moving
  with them.
- No second price on any screen that already asks for one.
- No "protocol", no urgency, no countdown, per the standing copy rules.
