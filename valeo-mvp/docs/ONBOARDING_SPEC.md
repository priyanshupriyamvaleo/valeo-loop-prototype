# The onboarding, mapped (MVP · GLP-1 weight loss)

The old intake was a flat list where nothing branched and no answer visibly
did anything. That is what made it feel wrong: questions without
consequences. This spec starts from one rule and derives every screen.

**The rule: every question must feed a decision.** If removing a question
changes no downstream behaviour, the question is deleted. The three
decisions this intake exists to make:

1. **Eligibility** (math): BMI ≥ 30 qualifies, 27–29.9 needs a weight-related
   condition, under 27 is out. The Hims and Juniper line, identical, from the
   medication labels.
2. **Routing** (safety): any contraindication signal goes to a doctor BEFORE
   payment. Clean answers go to the plan, and the doctor reviews after
   payment instead. A doctor is in every path exactly once.
3. **Conversion** (psychology): one motivation question and two interstitials
   that give back before they ask again. Hims runs ask-ask-give; Noom built a
   company on the motivation question. These do not route; they are why the
   patient finishes.

## The evidence

- Hims (screenshots, verbatim): "Do you have a treatment in mind already?"
  offers concrete forms (pills / injections / "I'd like a provider
  recommendation" — uncertainty turned into a service, not a dead end).
  "Why do you want to lose weight?" is multi-select and emotional.
  "What matters most to you about your treatment?" harvests objections. Then
  an interstitial: "You've come to the right place" + three reassurances +
  "Get my plan".
- Hims intake covers BMI, prior attempts, contraindications (thyroid cancer,
  pregnancy, pancreatitis), goals; eligibility BMI ≥30 or ≥27 + comorbidity.
- Juniper: same BMI gates; questionnaire is BMI + history + goals; decision
  in 24–72h.
- Clinical contraindication set (FDA labels, prescriber references):
  MTC/MEN2 personal or family (absolute), pregnancy/breastfeeding
  (absolute), pancreatitis history, gastroparesis/severe GI, type 1
  diabetes, eating-disorder history (relative → clinician review).

## The sequence

Rendered as a chat: the chat is the product's fundamental surface, so the
intake speaks it too. One question per message, answers as suggested replies,
multi-select as toggle chips with a send arrow, and the computed moments (BMI,
the match) arrive as messages from the practice. Same brain, conversational
body: the table below drives the thread exactly as it would drive a wizard.

| # | Screen | Type | Feeds | Branch logic |
|---|---|---|---|---|
| 1 | Are you male or female? | choice | dosing record + unlocks Q10 | female → pregnancy question later |
| 2 | How old are you? | number | eligibility | < 18 → honest stop |
| 3 | How tall are you? | number | BMI | — |
| 4 | And your weight today? | number | BMI | — |
| — | **BMI is computed here, never asked** | | | < 27 → honest stop · 27–29.9 → Q5 · ≥ 30 → skip Q5 |
| 5 | Do any of these come with the weight? (27–29.9 only) | choice | eligibility | BP / prediabetes or T2 / sleep apnea / high cholesterol / none → none = honest stop |
| A | **Interstitial: "Your BMI is {n}."** eligibility said plainly + what people typically lose | give | conversion | — |
| 6 | Why do you want to lose weight? | multi | conversion, mirrored on the match screen | never routes |
| 7 | Do you have a treatment in mind already? | choice | plan eyebrow copy | injections / "the doctor can recommend" — both continue; one plan either way |
| 8 | Have you used GLP-1 before? | choice | safety | never → Q9 · currently → 8b · before → 8c |
| 8b | Which weekly dose are you on? | choice | doctor's review note | clean; dose confirmed at review |
| 8c | Why did you stop? | choice | routing | side effects / didn't work / something else → **doctor first** · cost or availability → clean |
| 9 | Do any of these apply to you? | multi | routing | thyroid cancer in me or my family · pancreatitis · type 1 diabetes · severe stomach or digestive condition · eating-disorder history · none — **any → doctor first** |
| 10 | Pregnant, breastfeeding, or trying? (female only) | choice | routing | yes → **doctor first** |
| 11 | Any medication right now? | choice | routing + record | insulin or diabetes medication → **doctor first** · BP / other → noted, clean |
| B | **Interstitial: "You're a match, {name}."** three checks + "See my plan" | give | conversion | flagged version: "A doctor first." + "Talk to the doctor" |

Happy path: 9 taps + 2 continues. Female adds one. Nothing is asked twice,
nothing is asked of the wrong sex, and every branch is visible to the
patient as a consequence.

## The two exits (unchanged product rule)

- **Clean** → plan → pay → doctor reviews the order after payment, same day.
  If declined, the payment is returned; we state that at the decline, never
  as a selling line before it.
- **Flagged** → doctor call first, before any payment. If the doctor
  confirms, the plan shows "Confirmed by your doctor" and payment goes
  STRAIGHT to dispatch. There is no second review; the review already
  happened. One doctor touch per journey, never two.

## Copy rules applied

No em dashes. "Typically", never promised outcomes. The projection line is
the industry's own number, hedged: "People on weekly GLP-1 typically lose 10
to 15% of their body weight over the first year." Stops are honest and kind,
never a bounce: they say why, and what would change the answer.
