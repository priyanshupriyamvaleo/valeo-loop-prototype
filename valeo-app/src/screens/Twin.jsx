import { useState } from 'react';
import { Box, Button, Stack, Typography, LinearProgress } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import BodyFigure from '../components/BodyFigure';
import { systemsState, nextGap, twinPct, GRADE_C, SIGNALS, signalDone } from '../data';
import { C } from '../theme';

/**
 * The twin, as a body you can read.
 *
 * One deliberate difference from every other panel product: systems we have
 * not measured are shown as unmeasured, not graded on a guess. The blanks are
 * the honest argument for filling them in — and they are what the single CTA
 * on this page exists to close.
 *
 * One CTA, on purpose. A page of buttons spreads intent; a page with one
 * button creates a loop.
 */
export default function Twin({ st, onGo, onBlood, onQuestions }) {
  const [sel, setSel] = useState(null);
  const { rows, measured, total } = systemsState(st);
  const pct = twinPct(st);
  const gap = nextGap(st);
  const chosen = rows.find((r) => r.k === sel);

  const act = () => {
    if (!gap) return onGo('today');
    if (gap.k === 'blood') return onBlood();
    return onQuestions();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── the figure ── */}
      <Box sx={{
        flexShrink: 0, px: 2.25, pt: 2, pb: 2,
        background: `linear-gradient(168deg,#1E3F63,${C.night})`, color: '#fff',
        borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
      }}>
        {/* the figure is the subject, so it gets the width; the number sits over it */}
        <Box sx={{ position: 'relative' }}>
          <Box sx={{
            position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none',
          }}>
            <Typography sx={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: '.18em',
              textTransform: 'uppercase', color: C.yellow,
            }}>◈ Your twin</Typography>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline', mt: 0.5 }}>
              <Typography sx={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{pct}</Typography>
              <Typography sx={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>
                %
              </Typography>
            </Stack>
            <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', mt: 0.5 }}>
              {measured} of {total}<br />systems measured
            </Typography>
          </Box>
          <BodyFigure rows={rows} sel={sel} onSel={setSel} height={286} />
        </Box>

        <LinearProgress variant="determinate" value={pct} sx={{
          mt: 1, bgcolor: 'rgba(255,255,255,.14)',
          '& .MuiLinearProgress-bar': { background: C.yellow },
        }} />

        {/* tapping a marker explains it rather than opening a new page */}
        {chosen && (
          <Box sx={{
            mt: 1.75, px: 1.75, py: 1.5, borderRadius: '15px',
            bgcolor: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)',
          }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 700 }}>{chosen.t}</Typography>
              {chosen.grade ? (
                <Box sx={{
                  px: 0.9, py: 0.25, borderRadius: '6px', fontSize: 11, fontWeight: 800,
                  bgcolor: GRADE_C[chosen.grade], color: '#fff',
                }}>{chosen.grade}</Box>
              ) : (
                <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: C.yellow }}>
                  Unmeasured
                </Typography>
              )}
            </Stack>
            <Typography sx={{
              fontSize: 11.5, color: 'rgba(255,255,255,.68)', mt: 0.6, lineHeight: 1.45,
            }}>
              {chosen.grade
                ? 'Graded from your last panel and your answers.'
                : `Needs ${chosen.missing.map((m) => (SIGNALS.find((x) => x.k === m) || {}).t
                    || m).join(' and ').toLowerCase()}.`}
            </Typography>
          </Box>
        )}
      </Box>

      {/* ── the systems ── */}
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pt: 2.25, pb: 2 }}>
        <Typography sx={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
          color: C.ink2, mb: 1.25,
        }}>Systems</Typography>

        <Stack spacing={0.75}>
          {rows.map((r) => {
            const on = !!r.grade;
            const active = sel === r.k;
            return (
              <Stack key={r.k} direction="row" spacing={1.5} onClick={() => setSel(active ? null : r.k)}
                     sx={{
                alignItems: 'center', px: 1.75, py: 1.4, borderRadius: '15px', cursor: 'pointer',
                bgcolor: active ? 'rgba(27,57,91,.06)' : on ? '#fff' : 'rgba(27,57,91,.03)',
                border: `1.5px solid ${active ? C.deep : 'transparent'}`,
                boxShadow: on && !active ? '0 2px 10px -6px rgba(27,57,91,.24)' : 'none',
              }}>
                {on ? (
                  <Box sx={{
                    width: 24, height: 24, borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: GRADE_C[r.grade], color: '#fff', fontSize: 12, fontWeight: 800,
                  }}>{r.grade}</Box>
                ) : (
                  <Box sx={{
                    width: 24, height: 24, borderRadius: '8px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(27,57,91,.07)', color: C.ink2,
                  }}><LockOutlinedIcon sx={{ fontSize: 13 }} /></Box>
                )}
                <Typography sx={{
                  flex: 1, fontSize: 13.5, fontWeight: on ? 600 : 500,
                  color: on ? C.deep : C.ink2,
                }}>{r.t}</Typography>
                {!on && (
                  <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: C.yellowDeep }}>
                    Unmeasured
                  </Typography>
                )}
              </Stack>
            );
          })}
        </Stack>

        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2.25, lineHeight: 1.55 }}>
          We grade what we have measured and leave the rest blank. A guess dressed as a grade is
          worse than an empty row.
        </Typography>
      </Box>

      {/* ── one CTA. A page of buttons spreads intent; one button makes a loop. ── */}
      <Box sx={{
        px: 2.25, pt: 1.5, pb: 3, flexShrink: 0,
        borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={act}
                endIcon={<ChevronRightIcon />}>
          {gap ? 'Improve your twin' : 'Your twin is complete'}
        </Button>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, textAlign: 'center', mt: 1.25 }}>
          {gap
            ? `${gap.t} · unlocks ${gap.blocks} system${gap.blocks === 1 ? '' : 's'} · +${gap.pct}%`
            : 'Every system is measured. Keep logging and it stays that way.'}
        </Typography>
      </Box>
    </Box>
  );
}
