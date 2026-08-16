# Valeo Twins — React + MUI prototype

Real Vite + React 19 + MUI v9 project. No build-step tricks, no vendored UMD.

## Run

```bash
npm install
npm run dev
```

Opens on http://localhost:5173. The right-hand rail jumps between screens;
inside the phone, drag a card left/right to pass or save and **drag up to
ascend a tier**.

## Layout

    src/theme.js              MUI theme — Valeo palette, Fraunces + Poppins
    src/data.js               twins, protocols, tiers, question groups
    src/components/
      TwinGlyph.jsx           the mark: the loop orbiting a body
      Drum.jsx                wheel picker (scroll-snap; can't overflow)
    src/screens/
      Intro.jsx               cold open
      Questions.jsx           the question engine (drum / rows / chips / multi / map / goals)
      Matching.jsx            the matching loader
      Discover.jsx            twin-match deck, tier ascent, unlock doors
    public/twins/*.jpg        portraits

## Assets still needed

Drop a Riyadh/Dubai map at `public/map.jpg` — the location step falls back to
a plain panel until it exists.

## Node

This machine had no Node. It's installed at `~/.local/opt/node`:

```bash
export PATH="$HOME/.local/opt/node/bin:$PATH"
```

Add that line to `~/.zshrc` to make it permanent.
