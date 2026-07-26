# Loop Ledger — Tier 2 (Act + Memory)

Tighter than Tier 1 by design — the heavy reasoning (D4 state machine, P2/P3/P8/P9/P10/P11,
M21–M33) is already banked in PLAN.md and REFERENCES.md. Each frame below cites rather than
re-derives. Same rule as Tier 1: no frame gets pixels without a filled row.

**Governing structure, restated once:** the daily surface is D4's state machine — one
state-switched hero, not a checklist. Five states: ordinary day · shot day · days 1–3
post-shot · titration review week · week 12. Frames T2-1 through T2-8 are the components
that hero is built from, plus the two screens (twin, timeline) that sit one tap away from it.

---

## T2-1 · Daily home (the hero, all 5 states)

| | |
|---|---|
| **Transition** | Journey — the engagement loop that protects the outcome loop. Not itself a leak transition; it's the surface that prevents Adherence from becoming the second hypothesised leak. |
| **Leak it prevents** | *"There was a six-item checklist on a day with one real action, so I stopped opening the app."* |
| **Metric** | Daily open rate is a **leading indicator only** — never the north star. The real metric this frame serves is downstream: adherence_pct at retest. |
| **Precedent** | **D4** (asymmetry, not minimalism) · **M32** (Noom: loop on the hero, admin in a separate Care tab) · **P3/P10** (verdict confidence, banded, clamped, never shown without a prescription) · **M16** (Shotsy PK curve as the "ordinary day" content). |
| **Capture** | `Loop.status`, `AdherenceEvent` reads (not writes — this screen mostly displays), `Observation` (trend weight). |
| **Falsifier** | Show a user the "ordinary day" state cold. Ask "what does the app want from me today?" One correct answer, immediately, or the hierarchy is wrong. |

**Design calls.** One hero card that changes shape by state; a horizontal rail below it for
the demoted daily items (weight quota, one insight); a bottom tab bar with **Today · Twin ·
Timeline · Care**. Verdict confidence sits inside the hero on non-shot days — banded, not a
raw percentage (P10), paired with a prescription (P3: never the score without the action).

---

## T2-2 · Log weight

| | |
|---|---|
| **Transition** | The 10-second interaction that produces the trend line P3 depends on. |
| **Leak** | Raw daily weight read as failure on a normal water-retention day → abandonment. |
| **Metric** | Log completion rate; % using HealthKit autopull vs manual (source quality, schema `Observation.source`). |
| **Precedent** | **P8** (0-tap HealthKit autopull is the best log) · Noom's ruler-scrubber for the manual path · **P3** (trend thick, raw thin, tolerance band shown before the noise, never after). |
| **Capture** | `Observation{type:weight, value_num, source, raw:true}`; trend computed at render, never stored pre-smoothed (per DATA_MODEL §6). |
| **Falsifier** | Does showing raw+trend together reduce same-week re-logging churn vs. raw-only? |

**Design calls.** If a connected scale exists, this screen is a confirmation, not an entry
form — Withings-style "step on the scale" flow. Manual fallback is a horizontal ruler, no
keypad. The trend line is visually heavier (thicker stroke) than the raw scatter beneath it.

---

## T2-3 · Log dose

| | |
|---|---|
| **Transition** | The weekly (or scheduled) action that actually matters — the one real item on shot day. |
| **Leak** | Ambiguous or effortful dose logging → silent non-adherence that never surfaces until the verdict, when it's too late to fix. |
| **Metric** | % of scheduled doses logged within 2h of the reminder (source quality proxy). |
| **Precedent** | **M24** (Lilly's barcode scan — zero-typo capture, and with Valeo's dose-level SKUs nearly free) · **M23** (three-state response: Taken / Skip / Reschedule — Skip is dignified, not a failure) · Shotsy's site-rotation pre-fill. |
| **Capture** | `AdherenceEvent{status, actual_at, dose_taken, injection_site, source}`. `status:skipped_intentional` requires a one-tap reason; `missed` is inferred, never typed by the user as a self-accusation. |
| **Falsifier** | Does the barcode-scan path produce measurably higher-confidence rows (`source: reminder_action`) than manual entry? |

**Design calls.** Site rotation is a default, not a nag — the screen pre-selects the next
site in rotation. **"Skip" always visible, same visual weight as "Taken"** (P2 corollary:
false-positive logging is worse than a missed log — make lying unattractive, not just
possible to avoid).

---

## T2-4 · Log side effect / symptom

| | |
|---|---|
| **Transition** | The input that should be **driving titration decisions**, not sitting in a chat transcript nobody queries. |
| **Leak** | GLP-1's largest discontinuation driver, and the worst-served surface in the entire competitive set — nobody has a structured symptom instrument. |
| **Metric** | % of symptom reports that are structured (chip+severity) vs. free-text-only fallback — target: zero free-text-only. |
| **Precedent** | Calibrate's 5-point ordinal scale with inline history · the closed symptom vocabulary from Noom's Side Effect Guides (nausea, headaches, constipation, injection-site reaction, fatigue, indigestion, diarrhoea) · **DATA_MODEL §6** (`value_enum`, never free text as the only channel). |
| **Capture** | `Observation{type:symptom, value_enum, severity:0-3, measured_at}`, tagged to `days_since_injection` automatically. |
| **Falsifier** | Can a clinician later answer "does this symptom cluster around day 2 post-shot?" from the captured rows alone, with zero manual chart review? |

**Design calls.** Chip grid (closed vocabulary) + 0–3 severity, four taps total. A small
"show my pattern" link surfaces the day-since-injection correlation back to the user
immediately — turns logging into a payoff, not a chore, and it's free once the data model
supports it.

---

## T2-5 · Coach chat (with structured extraction)

| | |
|---|---|
| **Transition** | The conversational surface, but built so it's a data-capture channel wearing a friendly UI, not the reverse. |
| **Leak** | Free-text that vanishes into a transcript is structured data that was never captured — a chat log is not a database. |
| **Metric** | % of chat turns that produce a structured card the user can confirm/correct. |
| **Precedent** | **M4 mechanic ("the chat shows its work")** — every logged input renders back as a structured card ("Logged — semaglutide 0.5mg, Tue 08:12") · **M12/M33** (AI-first, human-escalation-with-printed-SLA; Superpower's `<24h weekdays` card; Noom's Welli→Coach routing rule). |
| **Capture** | Whatever entity the message implies (`AdherenceEvent`, `Observation`, `ConfounderEvent`) — the chat is a capture UI, not a separate data store. |
| **Falsifier** | Show a user a logged message; ask them to correct one field. If they can't find where to tap, the "shows its work" card failed. |

**Design calls.** AI answers render as a message; anything that implied a loggable event
also renders a **separate, tappable, editable card** beneath it. Clinician escalation is a
distinct, visually different message type with the response-time SLA printed, never hidden
in settings.

---

## T2-6 · Adherence at risk

| | |
|---|---|
| **Transition** | The intervention frame for P2's central bet — loss aversion on the answer, not the streak. |
| **Leak** | Silent non-adherence that only surfaces as an inconclusive verdict 8 weeks later, when nothing can be done about it. |
| **Metric** | % of at-risk users who return to floor before the window closes. |
| **Precedent** | **P2 in full**, including all three guardrails (G1 defensible number, G2 recovery path in the same sentence, G3 never routes to a charge) · **M22** (quota, not streak) · **M26** (Pause as the humane exit, not a guilt trip). |
| **Capture** | Triggered off `adherence_pct` crossing a warning threshold before `adherence_floor`; logs which recovery path the user took. |
| **Falsifier** | A/B this screen's copy against a generic reminder — does naming the specific consequence (inconclusive verdict) outperform "don't forget to log"? |

**Design calls.** One sentence carries both the stake and the exit in the same breath —
never the threat alone. A visible **Pause** entry point is offered before the floor is
breached, not just after (Ramadan, illness, travel — KSA R6). No red. No streak-break
animation. Tone follows M19: hedge the deficit, don't address "you."

---

## T2-7 · The twin ("what Valeo knows about you")

| | |
|---|---|
| **Transition** | Makes memory visible, which is what makes it correctable — and correctable memory is free data cleaning. |
| **Leak** | Invisible memory reads as surveillance; visible, editable memory reads as a shared record. |
| **Metric** | % of surfaced facts the user actively confirms or corrects (engagement is a proxy for trust in the record, not a vanity metric). |
| **Precedent** | **P11** (self-report never moves the verdict, only confidence) · **M20/WHOOP gate** (personal causal claims require 5-yes/5-no variance over 90 days; population claims ship immediately, visually distinct) · Superpower's Digital Twin as a legible, not decorative, data surface. |
| **Capture** | Read/edit surface over `Observation`, `AdherenceEvent`, `ConfounderEvent` — this screen is the correction UI for the whole schema, not a new entity. |
| **Falsifier** | Seed one deliberately wrong fact; can a user find and fix it in under 15 seconds? |

**Design calls.** Two visually distinct sections: **"What we've measured"** (population-level,
available immediately) and **"What this means for you"** (personal correlation, locked with a
visible progress toward the 5/5/90-day gate — an honest "not enough data yet," not a fake
number). No KSA body imagery (R2) — this is numbers and named facts, never a figure.

---

## T2-8 · Protocol timeline / phase view

| | |
|---|---|
| **Transition** | The visible arc — Noom's milestone-annotated forecast, done with clinical waypoints instead of a wedding date. |
| **Leak** | A protocol with no visible endpoint or phase structure reads as indefinite, which quietly erodes commitment. |
| **Metric** | % of users who can correctly state "what phase am I in" when asked — a comprehension check, not a vanity metric. |
| **Precedent** | Lilly's staircase dose-ladder chart · **KSA R6/R7** (Ramadan as a shaded band with its own micro-state, computed from Umm al-Qura, never hardcoded) · **M26** (Pause shown on the same timeline it affects). |
| **Capture** | Renders `Protocol.phases[]` and `InterventionComponent.titration_schedule` directly — no new entity, this is a visualization of what C5/schema already models. |
| **Falsifier** | Does a Ramadan-crossing protocol shown with the shaded band and restated goal ("hold, don't lose") reduce mid-Ramadan drop-off vs. an unannotated timeline? |

**Design calls.** Horizontal phase strip with the current position marked; dose ladder
overlaid as a stepped line; the retest date is the visible finish line (echoing C4/P3's
socket motif — the same visual object appearing a third time, now as a timeline landmark).
Ramadan renders as a shaded band with restated goal copy, sourced from R6/R7 — never assumed
to fall in a fixed month.
