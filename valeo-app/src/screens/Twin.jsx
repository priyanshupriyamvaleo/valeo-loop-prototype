import { useState } from 'react';
import { Box, Button, Stack, Typography, LinearProgress } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ScienceIcon from '@mui/icons-material/Science';
import TwinGlyph from '../components/TwinGlyph';
import { SIGNALS, signalDone, twinPct, TWINS, matchFor, PROTOCOLS } from '../data';
import { C } from '../theme';

/**
 * Twin is the ledger: what it knows, what it's missing, and what each missing
 * piece is worth.
 *
 * The demo card is the argument. Telling someone data improves their matches
 * is a claim; showing the same protocol scored at their twin today versus a
 * complete one is a demonstration. That gap is the reason to answer anything.
 */
export default function Twin({ st, onGo, onBlood, onQuestions }) {
  const [demo, setDemo] = useState(false);
  const pct = twinPct(st);
  const missing = SIGNALS.filter((s) => !signalDone(s.k, st));
  const gain = missing.reduce((n, s) => n + s.pct, 0);

  /* the highest-scoring twin makes the sharpest demonstration */
  const dc = [...TWINS].sort((a, b) => b.match - a.match)[0];
  const now = matchFor(dc, st);
  const full = dc.match;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── the mark, and the number ── */}
      <Box sx={{
        px: 2.25, pt: 2, pb: 2.5, flexShrink: 0, color: '#fff',
        background: `linear-gradient(168deg,#1E3F63,${C.night})`,
        borderBottomLeftRadius: 26, borderBottomRightRadius: 26,
      }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <TwinGlyph size={104} fill={pct / 100} loops={0} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: '.18em',
              textTransform: 'uppercase', color: C.yellow,
            }}>◈ Your twin</Typography>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline', mt: 0.5 }}>
              <Typography sx={{ fontSize: 38, fontWeight: 800, lineHeight: 1 }}>{pct}</Typography>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>%</Typography>
            </Stack>
            <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,.62)', mt: 0.6 }}>
              {missing.length === 0 ? 'Complete' : `${gain}% still on the table`}
            </Typography>
          </Box>
        </Stack>
        <LinearProgress variant="determinate" value={pct} sx={{
          mt: 2, bgcolor: 'rgba(255,255,255,.14)',
          '& .MuiLinearProgress-bar': { background: C.yellow },
        }} />
      </Box>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pt: 2.5, pb: 2 }}>
        {/* ── the demonstration ── */}
        <Label>What a fuller twin buys you</Label>
        <Box sx={{
          borderRadius: '20px', p: 2, bgcolor: '#fff',
          boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
        }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box sx={{
              width: 44, height: 44, borderRadius: '13px', flexShrink: 0, overflow: 'hidden',
              bgcolor: dc.tone, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,.85)',
            }}>
              {dc.img
                ? <Box component="img" src={dc.img} alt=""
                       sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : dc.mono}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>{dc.name}</Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>
                {PROTOCOLS[dc.protocol].t}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography sx={{
                fontSize: 27, fontWeight: 800, lineHeight: 1,
                color: demo ? C.green : C.deep,
                transition: 'color .4s',
              }}>{demo ? full : now}</Typography>
              <Typography sx={{
                fontSize: 7.5, fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: C.ink2, mt: 0.4,
              }}>Match</Typography>
            </Box>
          </Stack>

          <Typography sx={{ fontSize: 12, color: C.ink2, mt: 1.75, lineHeight: 1.5 }}>
            {demo
              ? `The same protocol at a complete twin — ${full - now} points more confidence, from answers you already have.`
              : 'Scored on what your twin knows today.'}
          </Typography>

          {full > now && (
            <Button fullWidth variant={demo ? 'text' : 'contained'}
                    color={demo ? 'primary' : 'secondary'}
                    onClick={() => setDemo(!demo)} sx={{ mt: 1.75, minHeight: 46 }}>
              {demo ? 'Show today’s score' : 'Show it at a complete twin'}
            </Button>
          )}
        </Box>

        {/* ── the ledger ── */}
        <Label sx={{ mt: 3 }}>What it knows</Label>
        <Stack spacing={1}>
          {SIGNALS.map((s) => {
            const on = signalDone(s.k, st);
            const act = s.via === 'blood' ? onBlood : () => onQuestions(s.k);
            return (
              <Stack key={s.k} direction="row" spacing={1.5}
                     onClick={on ? undefined : act} sx={{
                alignItems: 'center', px: 1.9, py: 1.7, borderRadius: '16px',
                cursor: on ? 'default' : 'pointer',
                bgcolor: on ? 'rgba(39,153,91,.07)' : '#fff',
                border: on ? '1.5px solid rgba(39,153,91,.28)' : '1.5px solid transparent',
                boxShadow: on ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
              }}>
                <Box sx={{
                  width: 23, height: 23, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: on ? C.green : 'rgba(27,57,91,.07)',
                }}>
                  {on
                    ? <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />
                    : s.via === 'blood'
                      ? <ScienceIcon sx={{ fontSize: 13, color: C.ink2 }} />
                      : <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: C.ink2 }} />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>{s.t}</Typography>
                  <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.2 }}>{s.sub}</Typography>
                </Box>
                <Typography sx={{
                  fontSize: 12, fontWeight: 800, flexShrink: 0,
                  color: on ? C.green : C.yellowDeep,
                }}>{on ? `+${s.pct}` : `+${s.pct}%`}</Typography>
                {!on && <ChevronRightIcon sx={{ fontSize: 18, color: C.ink2, flexShrink: 0 }} />}
              </Stack>
            );
          })}
        </Stack>

        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2.25, lineHeight: 1.55 }}>
          Nothing here is sold on. It exists to score protocols against your body instead of an
          average one.
        </Typography>
      </Box>
    </Box>
  );
}

function Label({ children, sx }) {
  return (
    <Typography sx={{
      fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
      color: C.ink2, mb: 1.25, ...sx,
    }}>{children}</Typography>
  );
}
