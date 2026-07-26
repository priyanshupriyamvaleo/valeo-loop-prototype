# Figma Handoff

## What exists, and where

30 built HTML frames + a living design system, all under `Valeo_UI/`:

```
design-system/
  tokens.css        — full brand + semantic token set (color, type, spacing, motion)
  components.css    — every reusable component used across all 30 frames
screens/
  index.html        — clickable gallery of all 30 frames, organised by tier
  C1–C7             — Commit (7 frames, production fidelity)
  P1–P6, P4b        — Prove (7 frames, production fidelity — this is the "6 frames" in
                       the plan; P3/P4 share one artifact, P4b is its own frame)
  T2-1–T2-8         — Act & Memory (8 frames, production fidelity)
  T3-1–T3-9         — Onboard/Activate/Renew (9 frames, deliberately skeleton fidelity)
LEDGER_TIER1.md / LEDGER_TIER2.md / LEDGER_TIER3.md
DATA_MODEL.md / REFERENCES.md / PLAN.md / KSA_CONSTRAINTS.md
```

Open `screens/index.html` in any browser — no build step, no server required for viewing
(the gallery uses `<iframe>`s against relative paths, so open it from the `screens/` folder
directly).

## The honest gap: I cannot push pixels into Figma from here

This session has no Figma API/MCP connector and no ability to drive the `html.to.design`
Figma plugin, which requires a logged-in Figma desktop session on your machine. Per the
plan's own pipeline (§4), that step was always meant to be a short human-in-the-loop pass,
not something done inside this conversation — but I want to be explicit rather than imply
it's done when it isn't.

**What you actually need to do, in order:**

1. **Install html.to.design** in Figma (Community plugin, free tier covers this volume).
2. **Open each of the 30 screen files** in a real browser (not this session's preview) at
   exactly 390×844 — every frame is already built to that canonical size, so no resizing
   needed. The `.device` wrapper in each file is presentation chrome for review; the actual
   product content is everything inside `.screen`.
3. **Run html.to.design against each page.** It imports real text layers, auto-layout, and
   colour styles — not a flattened image. Import order matters for review sanity: do C1–C7,
   then P1–P6/P4b, then T2-1–T2-8, then T3-1–T3-9.
4. **Bind Figma variables to `tokens.css`.** The token file is written so this is closer to
   copy-paste than translation — every color, spacing, and radius value in `components.css`
   references a `var(--token-name)`, and the token names are already semantic (e.g.
   `--verdict-refuted`, `--marker-out-of-range`), so a designer isn't reverse-engineering
   intent from hex codes.
5. **Componentize the repeated elements**, in this priority order (highest reuse first):
   `.btn`, `.pill`, `.card`, `.marker-row`, `.band-gauge`, `.sealed-card`, `.chip`,
   `.chat-bubble`/`.extraction-card`, `.tab-bar`, `.nav-bar`.
6. **Paste the Ledger rows as Figma annotations** directly on each frame. Every screen's
   caption block (the card below the device mockup in each HTML file) is the annotation
   content, already written — copy it in as sticky notes or the native annotation feature.
   This is what makes the file self-documenting for a designer who wasn't in this
   conversation.
7. **Wire the prototype links** in the order implied by the Ledger transitions
   (Commit → Prove is the critical path; Tier 2/3 are mostly leaf nodes off the Today tab
   and onboarding flow respectively).

## What a designer should NOT re-litigate

Everything in `PLAN.md` §2 (the six design principles, P1–P11) and every mechanic cited in
frame captions (`M1`–`M33` in `REFERENCES.md`) was a researched, reasoned decision — not a
placeholder. If something reads as arbitrary, the reasoning exists in these files; check
there before changing it. The three things most likely to tempt a "cleanup" that would
actually break the thesis:

- **Don't unify the verdict colours.** `slate` (refuted) is deliberately not `coral`
  (out-of-range) — conflating them makes a null result read as an alarm, which is the exact
  failure mode P9 exists to prevent.
- **Don't add a body silhouette or BMI visual anywhere.** KSA R2/R3 — this was a researched
  call, not an oversight.
- **Don't turn P4b (partial) into a lesser version of P3 (confirmed).** The research
  suggests partial is the *modal* outcome, not an edge case — it earned its own frame and
  its own tone on purpose.

## Known open items (do not silently resolve these — they need Valeo's clinicians/legal)

From `LEDGER_TIER1.md`'s closing section: the scored primary marker for the weight loop
(HbA1c vs HOMA-IR vs weight), who seals the prediction (clinician/model/hybrid), the exact
adherence floor percentage, retest window width, and the duty-of-care-vs-monetisable list
for C7. All five are currently placeholder values in the built frames (28mg iron / ferritin
/ 80% / etc. for the ferritin storyline used throughout) — real, but illustrative, not
clinically finalised.

Also still open per `KSA_CONSTRAINTS.md`: Arabic typeface pairing, Arabic-Indic vs Western
numerals, and RTL mirroring specifics — the research agent covering this hit a session limit
before completing. Everything built here is English-first with RTL-safe token structure
(no hardcoded letter-spacing, semantic not directional class names), but no frame has
actually been mirrored or typeset in Arabic yet.
