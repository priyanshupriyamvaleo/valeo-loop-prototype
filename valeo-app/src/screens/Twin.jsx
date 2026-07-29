import { useState, useEffect, useRef } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ScienceIcon from '@mui/icons-material/Science';
import BodyFigure from '../components/BodyFigure';
import TwinChat from '../components/TwinChat';
import SimSheet from '../components/SimSheet';
import PeersSheet from '../components/PeersSheet';
import PeakSheet from '../components/PeakSheet';
import ZoneCard from '../components/ZoneCard';
import {
  regionsState, systemsState, constraintOf, verdictOf, noticings, nextGap,
  twinPct, GRADE_C, PANELS, LADDER, PEERS, arcOfZone, bestMovedZone,
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
export default function Twin({ st, onGo, onBlood, onQuestions }) {
  const [sel, setSel] = useState(null);          /* selected zone */
  const [chat, setChat] = useState(false);
  const [sim, setSim] = useState(false);
  const [lens, setLens] = useState('now');       /* now | time */
  const [peers, setPeers] = useState(false);
  const [peak, setPeak] = useState(false);
  const [t, setT] = useState(1);                 /* playback 0 → 1 */
  const raf = useRef(0);

  const zones = regionsState(st);
  const { rows, known, total } = systemsState(st);
  const pct = twinPct(st);
  const verdict = verdictOf(st);
  const constraint = constraintOf(st);
  const notes = noticings(st);
  const gap = nextGap(st);

  const zone = zones.find((z) => z.k === sel);
  /* The card shows the worst thing in the selected zone, or the overall
     biggest lever when nothing is selected. One component, both states. */
  const worst = zone
    ? zone.inside.find((r) => (r.grade || r.said) && r.fix)
      || zone.inside.find((r) => r.grade || r.said)
    : constraint;

  /* ── the played transition ──
     Switching to Over time picks the zone that moved most and plays it, so the
     feature demonstrates itself instead of waiting to be discovered. */
  const arc = lens === 'time' && sel ? arcOfZone(sel, st) : null;
  const anim = arc ? { zone: sel, from: arc.from, to: arc.to, t } : null;

  useEffect(() => {
    if (lens !== 'time') return undefined;
    if (!sel) { setSel(bestMovedZone(st) || zones[1].k); return undefined; }
    setT(0);
    const start = performance.now();
    const step = (now) => {
      const p = Math.min(1, (now - start) / 2200);
      /* ease-out, so the last third settles rather than snapping */
      setT(1 - Math.pow(1 - p, 3));
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [lens, sel]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* Routing for the card's action — the CTA knows what kind of thing it is. */
  const act = (fix) => {
    if (!fix || fix.kind === 'test') return onBlood();
    if (fix.kind === 'answer') return onQuestions();
    if (fix.kind === 'device' || fix.kind === 'log') return onGo('today');
    return onGo('protocols');            /* supp and protocol both need a doctor */
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
        {/* ═══ ENTRY 1 · THE BODY ═══ */}
        <Box sx={{
          borderRadius: '26px', pt: 1.5, pb: 1.25, position: 'relative',
          background: `linear-gradient(168deg,#1E3F63,${C.night})`,
        }}>
          {/* In Over time the figure moves left and the markers count on the
              right, so the change and its evidence are read together. */}
          <Stack direction="row" sx={{ alignItems: 'center', px: arc ? 1.5 : 0 }}>
            <Box sx={{ flex: arc ? '0 0 46%' : '1 1 auto' }}>
              <BodyFigure zones={zones} sel={sel} onSel={setSel} height={arc ? 268 : 300}
                          anim={anim} focus={constraint ? constraint.region : null} />
            </Box>

            {arc && (
              <Box sx={{ flex: 1, minWidth: 0, pl: 1 }}>
                <Typography sx={{
                  fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em',
                  textTransform: 'uppercase', color: C.yellow, mb: 1.25,
                }}>{PANELS[0].date} → {PANELS[1].date}</Typography>
                <Stack spacing={1.5}>
                  {arc.markers.map((m) => {
                    const v = (m.from + (m.to - m.from) * t);
                    const dp = Math.abs(m.to) < 10 ? 1 : 0;
                    const good = (m.better === 'up') === (m.to > m.from);
                    return (
                      <Box key={m.t}>
                        <Typography sx={{
                          fontSize: 10.5, color: 'rgba(255,255,255,.55)',
                        }}>{m.t}</Typography>
                        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline' }}>
                          <Typography sx={{
                            fontSize: 19, fontWeight: 800, lineHeight: 1.1,
                            color: good ? '#6FD69B' : C.coral,
                            fontVariantNumeric: 'tabular-nums',
                          }}>{v.toFixed(dp)}</Typography>
                          <Typography sx={{
                            fontSize: 10, color: 'rgba(255,255,255,.45)',
                          }}>{m.unit.trim()}</Typography>
                        </Stack>
                        {m.was !== m.now && (
                          <Typography sx={{
                            fontSize: 9.5, fontWeight: 800, mt: 0.2,
                            color: t > 0.85 ? '#6FD69B' : 'rgba(255,255,255,.35)',
                          }}>{m.was} → {m.now}</Typography>
                        )}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}
          </Stack>

          {/* lens · two, not three. Comparison needs a cohort we don't have. */}
          <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', mt: 0.5 }}>
            {[['now', 'Now'], ['time', 'Over time']].map(([k, label]) => (
              <Box key={k} onClick={() => setLens(k)} sx={{
                px: 1.75, py: 0.8, borderRadius: '10px', cursor: 'pointer',
                fontSize: 11.5, fontWeight: lens === k ? 700 : 500,
                bgcolor: lens === k ? 'rgba(255,255,255,.14)' : 'transparent',
                color: lens === k ? '#fff' : 'rgba(255,255,255,.5)',
              }}>{label}</Box>
            ))}
          </Stack>

          {lens === 'time' && (
            <Typography sx={{
              fontSize: 10.5, color: 'rgba(255,255,255,.4)', textAlign: 'center',
              pt: 0.75, pb: 0.25,
            }}>
              {arc ? 'Tap another region to replay it' : 'This region was only measured once'}
            </Typography>
          )}
        </Box>

        {/* ═══ ENTRY 2 · THE VERDICT — one sentence ═══ */}
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 25, fontWeight: 600,
          color: C.deep, lineHeight: 1.15, mt: 2.5,
        }}>{verdict}</Typography>

        {/* ═══ ENTRY 3 · ONE CARD, REWRITTEN ON EVERY ZONE TAP ═══
            This replaced three lists — systems, levers, dangers. All three
            answered a question the body answers better: where is it, and what
            do I do about it. */}
        <ZoneCard zone={zone} worst={worst} onAct={act} />

        {zone && (
          <Typography onClick={() => setSel(null)} sx={{
            fontSize: 12, fontWeight: 700, color: C.teal, cursor: 'pointer',
            textAlign: 'center', pt: 1.5,
          }}>Back to the whole body</Typography>
        )}

        {/* ═══ ENTRY 4 · WHAT THE TWIN NOTICED — the feed seed ═══ */}
        {notes.length > 0 && (
          <>
            <Typography sx={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
              color: C.ink2, mt: 3, mb: 1.25,
            }}>Noticed</Typography>
            <Stack spacing={0.9}>
              {notes.map((n) => (
                <Stack key={n.k} direction="row" spacing={1.5} sx={{
                  alignItems: 'flex-start', px: 1.9, py: 1.5, borderRadius: '16px',
                  bgcolor: 'rgba(64,143,164,.08)', border: '1px solid rgba(64,143,164,.22)',
                }}>
                  <Box sx={{ fontSize: 13, flexShrink: 0, mt: '2px', color: C.teal }}>◈</Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep }}>{n.t}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.25, lineHeight: 1.45 }}>
                      {n.s}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </>
        )}

        {/* ═══ ENTRY 5 · SIMULATION ═══ */}
        <Box onClick={() => setSim(true)} sx={{
          mt: 3, px: 1.9, py: 1.9, borderRadius: '20px', cursor: 'pointer',
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

          <Stack direction="row" spacing={1.5} onClick={() => setPeak(true)} sx={{
            alignItems: 'center', px: 1.9, py: 1.6, borderRadius: '16px', cursor: 'pointer',
            bgcolor: '#fff', boxShadow: '0 2px 10px -6px rgba(27,57,91,.26)',
          }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '11px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(64,143,164,.14)', color: C.teal, fontSize: 15,
            }}>▲</Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
                Distance to peak
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.15 }}>
                Biggest gap is {LADDER.slice().sort((a, b) => (a.peak - a.you) < (b.peak - b.you) ? 1 : -1)[0].sys.toLowerCase()}
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

      <TwinChat open={chat} onClose={() => setChat(false)} />
      <SimSheet open={sim} onClose={() => setSim(false)} />
      <PeersSheet open={peers} onClose={() => setPeers(false)} />
      <PeakSheet open={peak} onClose={() => setPeak(false)} />
    </Box>
  );
}
