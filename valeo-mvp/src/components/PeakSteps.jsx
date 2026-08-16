import { Box, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { C, meter } from '../theme';

/**
 * THE THREE STEPS, AS A SEQUENCE
 *
 * Three equal columns was the mistake. Only one of them can ever be acted on, so
 * giving all three the same weight made the screen say "here are three options"
 * when it means "do this, then this, then this" — and it squeezed the live CTA
 * into a third of the width, where a protocol name broke across three lines.
 *
 * So the layout is asymmetric: the live step is wide and expressive, the other
 * two collapse to slim rails carrying only what still matters about them — their
 * number, what they are worth, and whether they are locked or banked. Complete
 * one and it collapses as the next expands, so the layout performs the
 * progression rather than describing it.
 *
 * Sequential for a real reason, not just for pacing: three simultaneous asks
 * produce none of them, and the second move rarely makes sense before the first
 * has landed — correcting iron before chasing inflammation is the order the
 * biology actually wants.
 *
 * COLOUR. Red is the diagnostic language here; it means "needs work". Filling the
 * button with it conflated the diagnosis with the invitation, which is exactly
 * why it read as an alarm instead of something you want to press. The action now
 * speaks the app's action language — yellow, navy ink, the same soft yellow glow
 * every other primary button carries — and red is demoted to a 5px dot beside the
 * step label, which is where a state belongs.
 */
export default function PeakSteps({
  peak, done, onAct,
  title = 'Next three steps to your peak',
  tone = C.yellow,
}) {
  return (
    <Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1.25 }}>
        <Typography sx={{
          flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.ink2,
        }}>{title}</Typography>
        <Typography sx={{
          fontFamily: meter, fontSize: 11, fontWeight: 700, color: C.ink2,
          whiteSpace: 'nowrap',
        }}>{done} / 3</Typography>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'stretch' }}>
        {peak.steps.map((s, i) => {
          const isDone = i < done;
          const isOpen = i === done;

          /* ── the live step ── */
          if (isOpen) {
            return (
              <Box key={s.t} onClick={() => onAct(s)} sx={{
                flex: 1, minWidth: 0, cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                borderRadius: '18px', bgcolor: '#fff', p: 1.5,
                border: '1px solid rgba(27,57,91,.07)',
                boxShadow: '0 6px 20px -12px rgba(27,57,91,.5)',
              }}>
                <Stack direction="row" spacing={0.65} sx={{ alignItems: 'center' }}>
                  {/* the region's state, as a dot — not as a fill */}
                  <Box sx={{
                    width: 5, height: 5, borderRadius: '50%', bgcolor: tone, flexShrink: 0,
                  }} />
                  <Typography sx={{
                    fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em',
                    textTransform: 'uppercase', color: C.ink2,
                  }}>Step {i + 1} · start here</Typography>
                </Stack>

                <Stack direction="row" spacing={0.15} sx={{ alignItems: 'baseline', mt: 1.1 }}>
                  <Typography sx={{
                    fontFamily: meter, fontSize: 15, fontWeight: 700, color: C.deep,
                  }}>+</Typography>
                  <Typography sx={{
                    fontFamily: meter, fontSize: 36, fontWeight: 700, lineHeight: 0.88,
                    color: C.deep, letterSpacing: '-.02em',
                  }}>{s.pct}</Typography>
                  <Typography sx={{
                    fontFamily: meter, fontSize: 14, fontWeight: 600, color: C.ink2,
                  }}>%</Typography>
                </Stack>

                <Typography sx={{
                  fontSize: 13.5, fontWeight: 600, color: C.deep, mt: 0.45, lineHeight: 1.3,
                }}>{s.t}</Typography>

                {/* holds the action at the floor of the card whatever the title height */}
                <Box sx={{ flex: 1, minHeight: 12 }} />

                <Stack direction="row" spacing={0.75} sx={{
                  alignItems: 'center', px: 1.3, py: 1.15, borderRadius: '13px',
                  bgcolor: C.yellow, boxShadow: '0 9px 20px -12px rgba(255,185,0,.95)',
                  transition: 'transform .12s ease',
                  '&:active': { transform: 'scale(.98)' },
                }}>
                  <Typography sx={{
                    flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: C.deep,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{s.cta}</Typography>
                  <ArrowForwardIcon sx={{ fontSize: 15, color: C.deep, flexShrink: 0 }} />
                </Stack>
              </Box>
            );
          }

          /* ── banked, or still ahead ── */
          return (
            <Stack key={s.t} sx={{
              flex: '0 0 58px', borderRadius: '16px', px: 0.75, py: 1.4,
              alignItems: 'center', justifyContent: 'space-between',
              bgcolor: isDone ? 'rgba(39,153,91,.07)' : 'rgba(27,57,91,.032)',
              border: `1px solid ${isDone ? 'rgba(39,153,91,.18)' : 'rgba(27,57,91,.055)'}`,
            }}>
              <Typography sx={{
                fontFamily: meter, fontSize: 10, fontWeight: 700, color: C.ink2,
                opacity: isDone ? 0.9 : 0.55,
              }}>{i + 1}</Typography>

              <Typography sx={{
                fontFamily: meter, fontSize: 15, fontWeight: 700, lineHeight: 1,
                color: isDone ? C.green : C.ink2, opacity: isDone ? 1 : 0.45,
              }}>+{s.pct}</Typography>

              {isDone ? (
                <Box sx={{
                  width: 17, height: 17, borderRadius: '50%', bgcolor: C.green,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><CheckIcon sx={{ fontSize: 11, color: '#fff' }} /></Box>
              ) : (
                <LockOutlinedIcon sx={{ fontSize: 13, color: C.ink2, opacity: 0.4 }} />
              )}
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
