# KSA constraints — the ones that change screens

Not a market summary. Eight rules that alter what gets drawn, with sources.

---

## R1 · You cannot name the drug before login — SFDA

**Article 36, SFDA advertising regulations: *"The advertisement of prescriptive medicine is
prohibited."*** Only exceptions are scientific publications and HCP-directed conferences.
Pre-approval costs SAR 14,000 and applies to non-prescription products only.

**"Mounjaro", "Ozempic", "Wegovy" cannot appear on any public-facing acquisition surface** —
App Store listing, landing page, ads, or any pre-login screen. `GLP-1` as a *mechanism class*
is the workaround the market already uses; Valeo's own UAE page already does it
(*"Start Your GLP1 Weight Loss Journey Today"*). Brand names are fine **post-authentication,
post-prescription**, inside the care relationship.

**Screen consequences.** The goal picker, onboarding, and the C1 web/email twin all sit
pre-login and must sell **the programme** — the doctor, the at-home labs, the nurse, the
plan — not the molecule. The protocol card (C5) can name the drug; the marketing site cannot.
This is a better product story anyway, and it's the one Kilow (the Saudi GLP-1 competitor) is
already telling.

---

## R2 · No body silhouette, no avatar. Ever.

Saudi weight-stigma prevalence **46.4%**, and gendered: **women 50.2% vs men 42.5%**
(n=4,709, IJERPH 2021). Top reported sources include *"being stared at in public"* — a body
figure is, literally, being looked at.

The regulator's standard reinforces it: MOH Decision 87/2023 Art. 20(3) requires showing
*"الحد الأدنى من جسم المريض"* — the minimum of the patient's body — and **names the female
chest and the buttock area** as regions not to display. GCAM's Sept 2025 content guidelines
classify revealing clothing as a clear violation.

And the market has already answered: **Kilo** (*"the first calorie tracker designed
specifically for the Saudi user"*) ships no body imagery, no silhouettes, no avatars, no BMI
display. **Akser Waznk**, built for Saudi users in a published study, has none either.

**A silhouette has no clinical job.** It doesn't inform a dose, a draw, or a decision. This is
the rare case where the culturally safe choice and the product-quality choice are identical.

**Show instead:** the number + trend line · a ring/arc around it · **non-scale clinical wins
as first-class tiles** (HbA1c, waist as a number, BP, ALT, lipids) · adherence/process
metrics. We are a blood-testing company — internal improvement is the differentiator against
every calorie tracker, and it's what carries a patient through a flat weight week.

---

## R3 · BMI: show the number once, kill the visual apparatus

BMI has a real job — it's the prescribing gate (≥30, or ≥27 with a comorbidity). Suppressing
it would be paternalistic and clinically wrong.

What goes: the colour-coded band, the little figure that fattens as you slide, and the word
"obese" applied to the user. Present it **once, at eligibility** — *"your BMI is 33.4, which
means the medication route is clinically appropriate for you"* — then retire it from the
dashboard. Track weight longitudinally, not BMI. In Arabic frame as **الوزن الصحي**; avoid
addressing the user with البدانة / السمنة.

---

## R4 · Before/after photos: legal, but don't

KSA is unusual — Art. 20(5) **explicitly permits** *"عرض نتائج العلاج… (قبل بعد)"*, where most
regulated markets ban it. But for a female weight-loss subject, "minimum of the body" plus the
named exclusions makes a compliant torso shot nearly impossible. Art. 20(4) also requires
written, scope-limited consent and identity non-disclosure.

**Note: Valeo's own UAE weight-loss page currently runs three named before/after pairs**
(Linda K. 17 kg, Aaron P. 13 kg, Catherine S. 16 kg). That asset should not port to KSA
unchanged.

**Private progress photos are a different question, and the answer is yes-but:** local-only or
client-side encrypted, off by default, never in a feed, never auto-attached to a clinician
report without a per-instance tap, with an Arabic first-run statement that they never leave
the phone.

---

## R5 · Female phlebotomist is a first-class booking field, defaulted on

No KSA statute mandates it. Four things together are stronger than a statute:

- **IIFA Resolution 81** sets an explicit ordering (female doctor first) and names **khalwah**
  — which makes a *home* visit the paradigm case, not an edge case
- MOH directive: male doctors examine female patients only with a female nurse present
- **94.7%** of Saudi women choose a female provider where intimate exposure is involved;
  **67.9%** prefer a female physician for a general exam (n=3,949, 2024); 64.7% cite religious
  reasons. The preference relaxes only in emergencies — **a routine venipuncture is the
  opposite of an emergency**
- The relevant paper's title is the argument: gender mismatch produces **delayed care**, not a
  complaint. You get a no-show, not feedback.

**Supply is not the constraint: 179,177 of 243,336 KSA nurses are female (73.6%).** Routing
is. And the user base skews female — a Saudi tertiary-care semaglutide cohort ran **60.3%
women**.

**Design call — default female-for-female, as a confirmable default with a visible opt-out
that unlocks more slots.** A neutral default in a market where 90%+ of women want same-gender
isn't neutrality, it's a trap; the costs are asymmetric (a wasted slot vs. a lost customer).

- Label by the person, not the category: `ممرضة (أنثى)` / `لا مانع لدي` — never "gender"
- Place it **above the calendar**, before she invests effort, because it determines which
  slots are real
- Show the trade-off inline: *"مواعيد أقل في منطقتك"* — converts a hidden failure into an
  informed choice
- Make it a **promise, not a preference**: state it on confirmation and in the reminder, with
  the nurse's first name. **A commitment broken once is worse than never offering it** — if
  she becomes unavailable, offer reschedule, never silently substitute
- Add an optional free-text access note (`اتصل من البوابة`, `الدخول من مدخل النساء`)
- **Do not build a mahram/guardian field.** The fiqh requirement is on the provider's side and
  sending a female nurse dissolves it. Demanding a male guardian for a blood test in 2026
  would be legally unnecessary and reputationally radioactive.

The real product is the **dispatch rule**, not the field: never route a male practitioner to a
residential address for a female patient unless "no preference" was affirmatively set.

---

## R6 · Ramadan is a program state, and the religious clearance is the cheapest high-value content you will ever ship

Two rulings from a source Saudi users actually trust — **Ibn Baz**:

- **A blood draw for analysis does not break the fast**: *"مثل هذا التحليل لا يفسد الصوم بل
  يعفى عنه"* (binbaz.org.sa/fatwas/11874)
- **Non-nutritive injections — including subcutaneous — do not break the fast**; only
  nutritive ones do (binbaz.org.sa/fatwas/4424)

**Both core clinical actions are religiously cleared.** Surface this *before* Ramadan, not
during.

**Verdict on the hypothesis: confirmed, with a correction.** No consumer product runs Ramadan
as a program state — not Noom, not ZOE, not Sehhaty (24M users), not Samsung Health. But the
*content* is thoroughly commoditised (DaR SaFa, dozens of clinic blogs) and the *seasonal SKU*
already exists (Alma Health's UAE "Fasting Readiness Profile"; Saudi hospital Ramadan
bundles). **So don't pitch it as "we know things about Ramadan." Pitch it as "the programme
reschedules itself."** The moat is the state machine and the operations, not the knowledge.

### The clinical rules that become software

| Rule | Source | Becomes |
|---|---|---|
| **Titration must complete ≥4 weeks before Ramadan** (one UAE endocrinologist says 8) | J. Obesity review | **Enrolment gate.** If enrolment is <8 weeks out, don't silently schedule escalations into the fast — offer *start now and plateau*, or *start after Eid*. |
| **Don't start, don't escalate during** | Gulf clinicians | Automatic escalation freeze with a visible chip, clinician-override-with-reason. Framed as a clinical decision, not an app toggle. |
| **Continue at a stable dose, same weekday** | IDF-DAR 2021 | Keep the cadence; change only the time. |
| **Inject after iftar** — side effects land during sleep | dronline.uk | **Iftar-relative reminders**: `maghrib + 30–60 min`, per city, recomputed daily. The single most visible "the app knows" moment. |
| **The danger is GI, not hypoglycaemia** — 10–20% vomiting/diarrhoea, *"both are dangerous if the patient is fasting"* | Gulf clinicians | Highest-severity path in the feature: symptom logged during fasting hours → prompt to break the fast and rehydrate + clinician route, **paired with the religious cover** (breaking a fast for illness is permitted and made up later). Without the religious framing the medical advice gets ignored. |
| **Skipping suhoor is the appetite-suppression trap** → fatigue, muscle loss. Hydration 2–3 L between iftar and suhoor | Gulf News expert panel | Suhoor floor with a reminder at suhoor−45. **For this month, nightly protein + fluid displaces weight as the primary adherence metric.** |
| Oral semaglutide: take at iftar, wait 30 min through Maghrib, then eat, ≤120 mL water | Gulf expert panel, Dubai Diabetes & Endo J. | Only if we dispense Rybelsus — Valeo does. |

### The two Ramadan findings that are genuinely ours

**Blood draws — split the panel.** Default the Ramadan draw to **the 90 minutes before
maghrib**: a real 13–15h fast, zero extra ask, religiously clear, and nobody has to be awake
at 04:00. Fine for glucose, HbA1c, lipids, liver enzymes. **But move renal function,
electrolytes and haematocrit-sensitive indices to pre-suhoor or post-Eid** — dehydration
concentrates blood components and makes creatinine and urea read high. On a drug class where
clinicians already watch renal function, a false alarm is expensive twice.

Then **timestamp the physiology, not just the clock**: store *hours since last intake* and
*Ramadan: yes* as result metadata, and render it on the card — *"drawn after a 14-hour fast
during Ramadan; some kidney markers may read slightly high."* That annotation is a better
differentiator than any Ramadan illustration, because a competitor can't retrofit it without
touching their data model. **Add both fields to `Panel` in DATA_MODEL.**

*Operational warning:* defaulting everyone to pre-iftar collapses a month of phlebotomy demand
into a 90-minute window that is also the worst traffic in the Saudi day. Model it before
promising it.

**The weight chart will lie, and you must pre-empt it.** **59.5% of Saudis report weight
*gain* after Ramadan** (Jeddah, n=173 families, Nutrition Journal) — dates at iftar 97.7%,
rice at suhoor 80.9%. So a 12-week GLP-1 chart crossing Ramadan will plausibly show a flat or
rising month **in a patient doing everything right.** If the app reads that as failure, the
patient leaves in week 8 of 12.

So: shade the band, suspend loss-rate scoring and quota-breaking inside it, and **restate the
goal for the month — hold, don't lose** — *before* the first Ramadan weigh-in, never after a
bad one. Anchor comparisons pre-Ramadan → post-Eid. Give **Eid its own three-day micro-state**
so a predictable spike reads as expected rather than as relapse.

This is the same object as **M26 / Oura Rest Mode** and the `ConfounderEvent` Pause — Ramadan
is the auto-suggested, calendar-triggered instance of a control we already need.

---

## R7 · Never hardcode Ramadan dates

Umm al-Qura, with final start confirmed by Saudi Supreme Court moon sighting, ±1 day:

- **Ramadan 2027: Mon 8 Feb → ~8–9 Mar** · **2028: Fri 28 Jan → ~25–26 Feb** · 2029: Tue 16 Jan
- **2030: two Ramadans in one Gregorian year** (Sat 5 Jan, and again late Dec) — this will
  break any code assuming one per calendar year

It drifts ~10–11 days earlier annually and isn't final until the night before. Compute from
Umm al-Qura and expose a **server-side ±1 day correction the whole schedule listens to**.

---

## R8 · The pre-Ramadan readiness moment is the commercial hook

Alma Health has proven Gulf appetite for a "Fasting Readiness Profile"; Saudi hospitals sell
Ramadan checkup bundles. Ours should beat a SKU: **a 4–6 week pre-Ramadan checkpoint that runs
a draw, a titration review and a fasting-suitability conversation, and outputs the patient's
Ramadan plan** — their injection time, their draw slot, their nightly targets. That's the
artifact a competitor cannot copy from a blog post.

---

## Still open (the parent research agent hit a session limit before returning these)

Arabic typeface selection and bilingual metrics · Arabic-Indic vs Western numerals · RTL
mirroring rules for charts with a time axis · Nafath login expectations · Mada/Tabby payment
conventions · PDPL consent-UI requirements · Valeo's own current app and post-test deliverable.

**Design impact of the gap:** the type stack and numeral decision block the *Arabic* design
system, not the English one. **M17's vertical band comparison sidesteps the RTL time-axis
problem by construction** — the axis is value, not time — which was already the reason to
choose it. Building English-first with RTL-safe tokens; the Arabic pass needs these answers.
