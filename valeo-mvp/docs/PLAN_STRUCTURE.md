# The GLP-1 plan structure (MVP · weight loss · known intent only)

Scope cut, final: one condition (weight loss), one persona ("I want GLP-1"),
one plan. The doctor's only job is eligibility: yes or no. The plan itself is
fixed and owned by the category manager. Everything on the patient side and
the console side renders from ONE plan object.

## 1. What the competitors do (researched Aug 2026)

| Player | Cadence | Meds included? | Durations | Dose pricing | Pay vs approval |
|---|---|---|---|---|---|
| Hims/Hers | $39 first mo, $149/mo membership + med separate (was all-in $199/mo, 6-mo prepaid) | two-part now; historically included | monthly / 6-mo / 12-mo prepay pushed | flat, "dosage adjustments at no additional cost" | pay first, provider reviews, refund if not approved |
| Ro Body | $39 first mo, $149/mo or $888/yr membership | NO, med billed separately ($149–299/mo) | monthly or annual membership | per product/dose | insurance-led; two-part billing is its top complaint |
| Noom Med | $129 first mo, $249/mo all-in, billed quarterly | YES (compounded) | monthly, billed quarterly | flat | — |
| Sequence (WW) | ~$99/mo + meds | mostly separate | monthly | ranges $249–399 | — |
| Juniper (UK, cash-pay) | monthly rolling, all-in | YES | monthly rolling | dose ladder £164–339 | pay first; "cancel within the first 25 days… we'll refund you the full amount" |
| Voy (UK, cash-pay) | monthly rolling, all-in | YES | monthly | dose-based | similar |

**The pattern that matters for KSA (cash-pay, no insurance):** all-in monthly
price with medication included; multi-month prepay as the only discount
mechanism; pay-first with a full-refund-if-not-approved guarantee making the
background doctor review safe; unbundled membership+meds (Ro) is the model
with the worst reviews and exists because of insurance, which we do not have.

## 2. The decision

**One plan. All-in. Monthly, with a 3-month prepay option. Flat price at
every dose. Pay first, doctor reviews same day, full refund if not approved.**

- **Medication included**, dispensed and delivered monthly in cold chain.
  No second bill, ever (the Ro failure mode).
- **Two durations only**: Monthly (rolling) and 3 months (one payment, lower
  per-month). No 6/12-month options in MVP; no first-month discount (house
  rule: the plan is the offer — bundle or discount, never both).
- **Flat price at every dose** ("dose adjustments included" is a selling
  line, and it keeps the console simple). The Juniper-style dose ladder is a
  documented v2 lever the console could add later.
- **The guarantee is what makes pay-before-approval clean**:
  "Full refund if the doctor decides it's not right for you." One sentence,
  shown at the price and at the pay sheet.

## 3. The plan object (what the category manager owns)

```
Plan {
  status        live | draft
  name          "GLP-1 Weight Loss Plan"
  medication    "GLP-1 weekly injection"
  tagline       one line under the name
  monthly       1349            // SAR per month, rolling
  quarterTotal  3597            // SAR, one payment (per-month derived: 1199)
  includes[]    the checklist the PDP renders
  guarantee     the refund sentence
}
```

Owned by the category manager in the console. NOT owned there: the safety
questions and the eligibility rules — those are clinical and appear
read-only. The patient PDP, the pay sheet and the practice-thread money
answers all render from this object, so a console edit changes the shop in
the same second.

## 4. The flow this fixes

```
Home → intake (want GLP-1 · sex · height · weight · prior use · safety)
  ├─ clean  → PLAN (PDP) → pay → doctor review, background, same day
  │            ├─ approved → medication ships → treatment (monthly loop)
  │            └─ not eligible → full refund, said plainly
  └─ flagged → doctor call FIRST (eligibility only, ~10 min, included)
               └─ eligible → PLAN → pay → ships (already reviewed)
```

Everything else — other goals, the diagnosis flow, blood tests, care briefs,
programme activation — is out of the MVP.

Sources: Hims pricing/structure (talktomira.com, healthrx.com,
healthfactsjournal.com, hims.com), Ro pricing (ro.co/weight-loss/pricing,
therxindex.com, talktomira.com), Noom Med (glpchart.com, noom.com), Sequence
(trytrimi.com), Juniper (myjuniper.co.uk/articles/how-much-does-juniper-cost),
Voy (joinvoy.com).

## 5. The two-medication update (mirror of the live Valeo platform)

The live platform sells this category as one program with a medication
choice and a term choice, so the MVP now does the same. Structure taken
from the official Valeo GLP-1 page, adapted to the MVP's rules.

**The choices**

| Medication | Monthly, rolling | 3 months, one payment | per month, derived |
|---|---|---|---|
| Wegovy (semaglutide, weekly) | SAR 1,529 | SAR 4,449 | SAR 1,483 |
| Mounjaro (tirzepatide, weekly) | SAR 2,499 | SAR 6,599 | SAR 2,200 |

Prices are the platform's current numbers. The platform shows strikethrough
"was" prices; the MVP does not, because the protocol is the offer, never a
discount. The platform's "Most Popular" tag on the 3-month term is kept.

**The includes, one table in three sections**

Same pattern as the long-protocol page: one table, subtle section headers,
here with a tick column per term because the terms differ.

- Your doctors: monthly doctor consultation · order review before dispatch ·
  dose adjustments at the same price · first dose given by a nurse at home
  (3-month only).
- Your coaches: monthly dietitian consultation · message the practice any
  time.
- Your medication: weekly injections delivered monthly in cold chain ·
  essential supplement pack monthly · GLP-1 starter kit (3-month only) ·
  free delivery.

**Not in this plan: the blood test.** The platform's GLP-1 program lists an
at-home blood test; this plan deliberately does not. The known-intent flow
is pay → onboard → doctor review → dispatch, and nothing in it books a draw.

The plan object grew accordingly: `meds[] {name, generic, monthly, quarter}`
and `sections[] {h, rows[] {t, m, q}}` replace the single price pair and the
flat includes list. The run stores `med` and `duration` at payment, so the
Today page and the practice thread only promise the nurse's first-dose visit
on the 3-month plan.
