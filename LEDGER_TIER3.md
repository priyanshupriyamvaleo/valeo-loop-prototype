# Loop Ledger — Tier 3 (Onboard, Activate, Renew)

**Deliberately skeleton fidelity.** Per PLAN.md's tiering (§1: Tier 3 = 15% of effort,
"enough to click through and see the loop close"), these 9 frames are built at lower
polish than Tier 1/2 on purpose. Building them at Tier-1 fidelity would be the exact mistake
the plan warns against: "thirty equally-polished screens is decoration with a project plan
attached." Each frame still gets a real design decision and a one-line reason — just not a
six-question Ledger row each.

| # | Frame | The one decision that matters | Cites |
|---|---|---|---|
| T3-1 | Goal picker | Single-select, no auto-advance, preview-what-opens on focus. Five inert goals render like WHOOP's grey Recovery score — real UI, visibly disabled, dated — never animated-closed. | D2, M28, M29 |
| T3-2 | Intake | Every question must visibly move the eventual sealed prediction; if an answer wouldn't change C4, it isn't asked. Branching eligibility questions only where prior answers warrant. | P7, M9(Ro pattern) |
| T3-3 | Eligibility → baseline | Screening as branching, not a wall — conditional labs only where indicated. Feeds directly into C1–C4, doesn't duplicate them. | KSA R1 (no drug names pre-login) |
| T3-4 | Phlebotomy booking | Gender-of-provider is a first-class field, defaulted female-for-female for female patients, with the slot trade-off shown inline, never hidden. | KSA R5, in full |
| T3-5 | Sample processing | Status as a first-class object with an estimated delivery date (Quest's pattern) — the dead interval between draw and result is addressable inventory, same principle as P2. | Quest status states |
| T3-6 | Consult scheduling + prep | The concierge call is the highest-leverage retention intervention available (Superhuman), not logistics — booked with the same weight as the blood draw itself. | Superhuman concierge finding |
| T3-7 | Consult summary | The user's own stated goal from intake is quoted back by the clinician — Function Health's pattern: a goal captured, held, and visibly honoured at the moment of highest credibility. | Function Health intake→note pattern |
| T3-8 | Renew / loop 2 | Never the acquisition page minus a discount (ZOE's anti-pattern) — `loop_index` changes the whole screen: a returning user sees their own history, not a first-timer's pitch. | ZOE anti-pattern (#17), `Loop.loop_index` |
| T3-9 | Plan management | Cancellation is at least as easy as purchase, self-serve, in-app, no chatbot gate — the direct answer to Noom's $62M settlement. | Noom lesson (C6) |
