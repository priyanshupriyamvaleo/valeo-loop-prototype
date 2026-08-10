import { useState, useEffect, useRef } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ScienceIcon from '@mui/icons-material/Science';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BodyFigure from '../components/BodyFigure';
import Practice from '../components/Practice';
import SimSheet from '../components/SimSheet';
import PeersSheet from '../components/PeersSheet';
import PeakSteps from '../components/PeakSteps';
import InFlight from '../components/InFlight';
import ScoreSheet from '../components/ScoreSheet';
import SuppSheet from '../components/SuppSheet';
import {
  regionsState, constraintOf, nextGap, twinPct, PEERS, longevityScore,
  peakOf, optimumOf, PEAK_FROM, PEAK_TO, inFlight, regionLevel, SYSTEMS, PROTO_HITS,
  mediaOf, REGION_MEDIA, REGIONS, activeRuns,
  zoneOf, zoneColor,
} from '../data';
import { C } from '../theme';

/**
 * THE TWIN SCREEN
 *
 * Architecture: a stack of self-contained entries with the body as entry one.
 * Not a feed — a feed needs a model that notices, and until daily capture
 * actually moves the model a feed would be theatre. But the composition is a
 * stack of entries on purpose, so noticings can be inserted later without a
 * rewrite.
 *
 * Three rules govern every decision below.
 *   1. The body is the noun; the layers are verbs applied to it.
 *   2. Never a finding without its move. A grade with no action is anxiety.
 *   3. Confidence travels with every claim — because identical blood produced
 *      biological ages of 37.3 and 45.2 at two competitors, and an unqualified
 *      number in this category is a liability.
 *
 * Above the fold answers the only three questions anyone actually arrives
 * with: am I okay, what's the one thing to do, can I trust this. Reference,
 * Trajectory and Simulation are more exciting and none of them is why anyone
 * opens this screen, so none of them is above the fold.
 */
export default function Twin({ st, onGo, onBlood, onQuestions, onGenerate, onProtocol,
                              onBuySupp }) {
  /* Opens on the weakest region rather than on nothing. An unselected body makes
     the user hunt for the problem; the screen already knows where it is, and the
     three cards below are about that region anyway. */
  const [sel, setSel] = useState(() => REGIONS
    .map((r) => ({ k: r.k, lv: regionLevel(r.k).now }))
    .sort((a, b) => a.lv - b.lv)[0].k);
  const [chat, setChat] = useState(false);
  const [sim, setSim] = useState(false);
  const [lens, setLens] = useState('now');       /* now | peak */
  const [peers, setPeers] = useState(false);
  const [score, setScore] = useState(false);
  const [supp, setSupp] = useState(null);   /* the supplement being bought */
  const [t, setT] = useState(1);                 /* playback 0 → 1 */
  const [done, setDone] = useState({});          /* steps completed, per zone */
  const raf = useRef(0);

  const zones = regionsState(st);
  const pct = twinPct(st);
  const lscore = longevityScore();
  const constraint = constraintOf(st);
  const gap = nextGap(st);

  /* ── WHAT IS ACTING ON THE TWIN ──
     Protocols, resolved down to the subsystems they touch. The rail below shows
     them in full; the body shows the same fact as a mark, so the figure answers
     "what am I working on" without anyone scrolling. */
  /* Every region's band colour, so a selected region can declare its own state
     instead of every selection looking identical. */
  const tones = {};
  zones.forEach((z) => { tones[z.k] = zoneColor(regionLevel(z.k).now); });
  /* every region sitting in the red band — lit on the figure at all times */
  const alerts = zones
    .filter((z) => zoneOf(regionLevel(z.k).now).k === 'red')
    .map((z) => z.k);

  /* A checkout is app state, not screen state — a step you paid for must still be
     done after you leave the tab. The demo button only moves the local counter;
     a purchase is read back out of `st`. */
  const stepsDone = (key, steps) => {
    const bought = (steps || []).reduce((n, x, i) => (
      x.buy && x.buy.kind === 'supp' && (st.supps || []).includes(x.buy.s) ? i + 1 : n
    ), 0);
    return Math.max(done[key] || 0, bought);
  };

  /* ── NOW-MODE GUIDANCE ──
     Which region the three cards are about. His rule: if the region you tapped
     is itself in the red, show its steps. Otherwise show the steps for the one
     that is actually in trouble — a clean region has nothing urgent to say, and
     a screen that goes quiet because you tapped a healthy region is a screen
     that hides the problem. */
  const worstZone = zones.slice()
    .sort((a, b) => regionLevel(a.k).now - regionLevel(b.k).now)[0].k;
  const selRed = sel && zoneOf(regionLevel(sel).now).k === 'red';
  const optZone = lens === 'now' ? (selRed ? sel : worstZone) : null;
  const opt = optZone ? optimumOf(optZone) : null;
  const optDone = opt ? stepsDone(`now:${optZone}`, opt.steps) : 0;
  const flights = inFlight(st);
  const marks = {};
  zones.forEach((z) => {
    const lv = regionLevel(z.k);
    /* The region's own level delta — NOT the sum of its subsystems'. Summing
       gives chest +66 when the region moved 22 points, which puts a number on
       the body that matches nothing else on the screen. */
    marks[z.k] = { delta: Math.max(0, lv.now - lv.was), active: false };
  });
  /* Every running protocol lights the regions it is acting on — not just one.
     A body that only showed the focused protocol's work would under-report what
     is actually happening to it. */
  activeRuns(st)
    .filter((x) => x.status === 'running')
    .forEach((x) => {
      (PROTO_HITS[x.k] || []).forEach((h) => {
        const sys = SYSTEMS.find((y) => y.k === h.sys);
        if (sys && marks[sys.region]) marks[sys.region].active = true;
      });
    });

  const zone = zones.find((z) => z.k === sel);

  /* ── PEAK ──
     Aspirational, not historical: this region as it would be at peak, and the
     three moves that get there. It needs a selection, so entering Peak without
     one falls back to the region that has the furthest to travel. */
  const peakZone = lens === 'peak' ? (sel || zones[1].k) : null;
  const peak = peakZone ? peakOf(peakZone) : null;
  const doneN = stepsDone(`peak:${peakZone}`, peak && peak.steps);
  /* the gain already banked by completed steps */
  const banked = peak ? peak.steps.slice(0, doneN).reduce((n, x) => n + x.pct, 0) : 0;
  const shown = peak ? Math.min(peak.peak, peak.now + banked) : 0;
  /* Where a region has footage the clip owns the tempo: the score, the bar and
     the video all run for exactly its window, so nothing lands early. `mute`
     tells the figure to skip the colour ramp there — the video is the transition. */
  const media = peakZone ? mediaOf(peakZone) : null;
  const animMs = media ? media.ms : 2400;
  const anim = peak
    ? { zone: peakZone, fromCol: PEAK_FROM, toCol: PEAK_TO, t, mute: !!media }
    : null;
  /* In Peak the rail narrows to what is acting on THIS region — and an empty
     rail there is the most honest sell on the screen. */
  const railFlights = peak
    ? flights.filter((f) => f.hits.some((h) => h.region === peakZone))
    : flights;

  useEffect(() => {
    if (lens !== 'peak') { setT(1); return undefined; }
    if (!sel) { setSel(zones[1].k); return undefined; }
    setT(0);
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / animMs);
      /* Ease-out so the last third settles into peak rather than snapping —
         EXCEPT where a clip is playing. Video runs at a constant rate, so an
         eased number would hit its final value about a second before the footage
         did, and you would watch hair keep growing after the score said 92.
         Linear keeps the two locked, and steady growth is truer to a timelapse. */
      setT(media ? p : 1 - Math.pow(1 - p, 3));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [lens, sel, doneN, animMs]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* Routing for the card's action — the CTA knows what kind of thing it is. */
  const act = (fix) => {
    if (!fix || fix.kind === 'test') return onBlood();
    if (fix.kind === 'answer') return onQuestions();
    if (fix.kind === 'device' || fix.kind === 'log') return onGo('today');
    return onGo('protocols');            /* supp and protocol both need a doctor */
  };
  /* Where a step's button goes. A protocol needs a prescriber, so it opens the
     same detail page every other protocol uses and inherits consult → buy. An
     over-the-counter supplement has nothing to gate, so it checks out here. */
  const buyStep = (step) => {
    if (!step.buy) return undefined;
    if (step.buy.kind === 'protocol') return onProtocol(step.buy.p);
    return setSupp({
      k: step.buy.s,
      step,
      key: peak ? `peak:${peakZone}` : `now:${optZone}`,
      label: peak ? peak.label : opt.label,
    });
  };

  const improve = () => {
    if (!gap) return onGo('today');
    return gap.k === 'blood' ? onBlood() : onQuestions();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── header · chat is the only persistent affordance ── */}
      <Stack direction="row" spacing={1.5} sx={{
        alignItems: 'center', px: 2.25, pt: 2, pb: 1, flexShrink: 0,
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontSize: 9, fontWeight: 800, letterSpacing: '.18em',
            textTransform: 'uppercase', color: C.ink2,
          }}>Your twin</Typography>
          {/* confidence framed as a debt we owe, never a hedge on our answer */}
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.4 }}>
            <Box sx={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              bgcolor: pct >= 60 ? C.green : pct >= 30 ? C.yellow : C.ink2,
            }} />
            <Typography sx={{ fontSize: 12.5, color: C.ink2 }}>
              Knows <b style={{ color: C.deep }}>{pct}%</b> of you
            </Typography>
          </Stack>
        </Box>
        <Box onClick={() => setChat(true)} sx={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(150deg,${C.deep},#12283F)`, color: C.yellow,
          boxShadow: '0 6px 16px -6px rgba(27,57,91,.45)',
        }}><ChatBubbleOutlineIcon sx={{ fontSize: 19 }} /></Box>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
        {/* ═══ ENTRY 1 · THE BODY ═══
            Now is a selection surface: the whole body, no card, no verdict.
            Peak is a guidance surface: one region, isolated and zoomed, moving
            toward what it could be. The lens changes what the screen is for,
            not merely how it is drawn. */}
        <Box sx={{
          borderRadius: '26px', pt: 0.5, pb: 1.25, position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          background: `linear-gradient(168deg,#1E3F63,${C.night})`,
        }}>
          {/* The levels the body cannot show. A body answers "where"; it can
              never answer "what is my thyroid actually at". That belongs behind
              a button — a reference, not a decision, and twelve rows on the
              screen is what the body replaced in the first place. */}
          {/* In its own row rather than floated over the figure. Absolutely
              positioned it collided with the head every time the head changed
              size — the fix is to stop them sharing space, not to keep trimming
              whichever one grew last. */}
          <Stack direction="row" spacing={0.7} onClick={() => setScore(true)} sx={{
            ml: 1.5, mt: 1, mb: 0.25, alignSelf: 'flex-start', cursor: 'pointer',
            alignItems: 'center', px: 1.15, py: 0.6, borderRadius: '10px',
            bgcolor: 'rgba(255,255,255,.12)',
          }}>
            <Typography sx={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,.66)',
            }}>Longevity score</Typography>
            <Typography sx={{
              fontSize: 13, fontWeight: 800, color: '#fff', lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>{lscore.now}</Typography>
            {/* the delta lives inside the sheet, on the dial and in its own stat
                column — carrying it here too made the chip wide enough to sit on
                top of the head */}
            <InfoOutlinedIcon sx={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }} />
          </Stack>

          {/* Fixed height across both lenses. A card that resizes when you tap
              Peak makes everything under it jump, and the jump reads as a bug. */}
          <Stack direction="row" sx={{
            alignItems: 'center', px: peak ? 1.75 : 0, height: 272,
          }}>
            <Box sx={{ flex: peak ? '0 0 46%' : '1 1 auto', minWidth: 0 }}>
              <BodyFigure zones={zones} sel={sel} onSel={setSel}
                          height={272} marks={marks} tones={tones} alerts={alerts}
                          headMedia={REGION_MEDIA.headneck}
                          playing={!!(peak && peakZone === 'headneck')}
                          isoCrop={media && media.crop}
                          atEnd={t >= 1}
                          isolate={peakZone} anim={anim}
                          focus={!peak && constraint ? constraint.region : null} />
            </Box>

            {peak && (
              <Box sx={{ flex: 1, minWidth: 0, pl: 1.5 }}>
                <Typography sx={{
                  fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em',
                  textTransform: 'uppercase', color: C.yellow,
                }}>{peak.label} at peak</Typography>

                <Stack direction="row" spacing={0.4} sx={{ alignItems: 'baseline', mt: 1 }}>
                  <Typography sx={{
                    fontSize: 40, fontWeight: 800, lineHeight: 1, color: '#fff',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{Math.round(shown + (peak.peak - shown) * t)}</Typography>
                  <Typography sx={{
                    fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,.5)',
                  }}>%</Typography>
                </Stack>

                <Typography sx={{
                  fontSize: 11.5, color: 'rgba(255,255,255,.6)', mt: 0.75, lineHeight: 1.45,
                }}>
                  You are at <b style={{ color: '#fff' }}>{shown}%</b>.
                  Peak for your age is {peak.peak}%.
                </Typography>

                {/* the gap, as a bar that fills with the animation */}
                <Box sx={{ mt: 1.5, height: 6, borderRadius: 3,
                           bgcolor: 'rgba(255,255,255,.13)', overflow: 'hidden' }}>
                  <Box sx={{
                    width: `${shown + (peak.peak - shown) * t}%`, height: '100%',
                    borderRadius: 3, bgcolor: t > 0.9 ? '#6FD69B' : C.yellow,
                  }} />
                </Box>
              </Box>
            )}
          </Stack>

          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', mt: 0.5 }}>
            {[['now', 'Now'], ['peak', 'Peak']].map(([k, label]) => (
              <Box key={k} onClick={() => setLens(k)} sx={{
                px: 2, py: 0.8, borderRadius: '10px', cursor: 'pointer',
                fontSize: 11.5, fontWeight: lens === k ? 700 : 500,
                bgcolor: lens === k ? 'rgba(255,255,255,.14)' : 'transparent',
                color: lens === k ? '#fff' : 'rgba(255,255,255,.5)',
              }}>{label}</Box>
            ))}
          </Stack>

          <Typography sx={{
            fontSize: 10.5, color: 'rgba(255,255,255,.42)', textAlign: 'center',
            pt: 0.75, pb: 0.25, px: 3, lineHeight: 1.45,
          }}>
            {peak
              ? 'Go back to Now to pick a different region'
              : zone
                ? `${zone.t} · ${zoneOf(regionLevel(zone.k).now).t} · tap Peak for the path`
                : 'Tap a region, then tap Peak'}
          </Typography>
        </Box>

        {/* ═══ ENTRY 2 · IN PEAK ONLY — the three steps ═══ */}
        {peak && (
          <Box sx={{ mt: 2.5 }}>
            <PeakSteps peak={peak} done={doneN} onAct={buyStep} />
            {doneN < 3 && (
              <Typography onClick={() => setDone({ ...done, [`peak:${peakZone}`]: doneN + 1 })} sx={{
                fontSize: 11.5, fontWeight: 700, color: C.teal, cursor: 'pointer',
                textAlign: 'center', pt: 1.5,
              }}>Simulate completing step {doneN + 1} →</Typography>
            )}
            {doneN === 3 && (
              <Typography sx={{
                fontSize: 12, color: C.green, fontWeight: 700,
                textAlign: 'center', pt: 1.5,
              }}>{peak.label} is at peak. Pick another region.</Typography>
            )}
          </Box>
        )}

        {/* ═══ ENTRY 2b · IN NOW ONLY — the three steps to optimum ═══
            Same component and same shape as Peak, different target. Getting out
            of the red and chasing the last five points are different jobs, so
            the title, the target and the accent colour all change — but the
            layout does not, because it is the same promise either way. */}
        {opt && (
          <Box sx={{ mt: 2.5 }}>
            <PeakSteps peak={opt} done={optDone}
                       title={`Next three steps to your optimum ${opt.label.toLowerCase()}`}
                       tone={opt.zone.c}
                       onAct={buyStep} />

            {optDone < 3 && !opt.atTarget && (
              <Typography onClick={() => setDone({ ...done, [`now:${optZone}`]: optDone + 1 })} sx={{
                fontSize: 11.5, fontWeight: 700, color: C.teal, cursor: 'pointer',
                textAlign: 'center', pt: 1.5,
              }}>Simulate completing step {optDone + 1} →</Typography>
            )}
            {optDone === 3 && (
              <Typography sx={{
                fontSize: 12, color: C.green, fontWeight: 700,
                textAlign: 'center', pt: 1.5,
              }}>{opt.label} is out of the red. Peak is the next target.</Typography>
            )}
          </Box>
        )}

        {/* ═══ ENTRY 3 · SIMULATION — pulled up, so both core features sit
            on the first screen without scrolling ═══ */}
        <Box onClick={() => setSim(true)} sx={{
          mt: 2.5, px: 1.9, py: 1.9, borderRadius: '20px', cursor: 'pointer',
          background: `linear-gradient(150deg,${C.deep},#12283F)`, color: '#fff',
        }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <ScienceIcon sx={{ fontSize: 22, color: C.yellow, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>
                Test something on your twin
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,.62)', mt: 0.25 }}>
                A reel, a supplement, a stack a friend sent
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ fontSize: 19, color: 'rgba(255,255,255,.5)', flexShrink: 0 }} />
          </Stack>
        </Box>

        {/* ═══ ENTRY 4 · WHAT YOUR PROTOCOLS ARE MOVING ═══
            The causal layer. Now says where you are, Peak says how far you
            could go, and this says what is acting on it and what that has
            already bought — the only one of the three that proves the product
            works rather than asserting it. */}
        <Stack direction="row" sx={{ alignItems: 'baseline', mt: 3, mb: 1.25 }}>
          <Typography sx={{
            flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase', color: C.ink2,
          }}>
            {peak ? `Moving your ${peak.label.toLowerCase()}` : 'What your protocols are moving'}
          </Typography>
          {railFlights.length > 1 && (
            <Typography sx={{ fontSize: 10.5, color: C.ink2 }}>
              {railFlights.length} protocols
            </Typography>
          )}
        </Stack>
        <InFlight flights={railFlights} region={peak ? peak.label : null}
                  onOpen={() => onGo('protocols')} onFind={() => onGo('discover')} />

        {/* ═══ ENTRY 6 · REFERENCE + TRAJECTORY — one row each ═══ */}
        <Stack spacing={0.75} sx={{ mt: 3 }}>
          <Stack direction="row" spacing={1.5} onClick={() => setPeers(true)} sx={{
            alignItems: 'center', px: 1.9, py: 1.6, borderRadius: '16px', cursor: 'pointer',
            bgcolor: '#fff', boxShadow: '0 2px 10px -6px rgba(27,57,91,.26)',
          }}>
            <Box component="img" src={PEERS[0].img} alt="" sx={{
              width: 34, height: 34, borderRadius: '11px', objectFit: 'cover', flexShrink: 0,
            }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
                Closest twins
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.15 }}>
                {PEERS[0].name.split(' ')[1]} is {PEERS[0].apart} systems away
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
          </Stack>

        </Stack>

        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2.5, lineHeight: 1.55 }}>
          We grade what we measured, quote what you told us, and leave the rest blank. A guess
          dressed as a grade is worse than an empty row.
        </Typography>
      </Box>

      <Practice open={chat} onClose={() => setChat(false)} st={st} pKey={null} />
      <SimSheet open={sim} onClose={() => setSim(false)}
                onGenerate={() => { setSim(false); onGenerate(); }} />
      <PeersSheet open={peers} onClose={() => setPeers(false)} />
      <SuppSheet open={!!supp} onClose={() => setSupp(null)}
                 suppKey={supp && supp.k} step={supp && supp.step}
                 region={supp && supp.label}
                 onBought={() => {
                   if (!supp) return;
                   /* buying IS completing the step — the next one unlocks off a
                      real purchase rather than off the demo button */
                   onBuySupp(supp.k);
                   setDone({ ...done, [supp.key]: (done[supp.key] || 0) + 1 });
                 }} />
      <ScoreSheet open={score} onClose={() => setScore(false)} st={st}
                  onAct={(fix) => { setScore(false); act(fix); }} />
    </Box>
  );
}
