import { Box, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { C } from '../theme';

/**
 * The ACT-phase hero.
 *
 * Oura's 2025 rebuild surfaces one thing "based on what your body most needs
 * to know right now" rather than a wall of stats, and that's the right
 * instinct for a protocol too: on any given day there is exactly one thing
 * worth saying. Here it's the phase you're in and what your body is doing in
 * it — because a checklist tells you what to do, and only this tells you why
 * today matters.
 *
 * The week strip below it is Whoop's consistency calendar: gaps are as
 * informative as streaks, so they're shown rather than hidden.
 */
export default function RunHero({ day, total, week, weeks, arc, logs, milestone, streak, onRenew }) {
  /* last seven days, oldest first */
  const strip = Array.from({ length: 7 }, (_, i) => {
    const d = day - 6 + i;
    return { d, on: logs.some((l) => l.day === d), future: d > day, valid: d >= 1 };
  });
  const pct = Math.round((day / total) * 100);

  return (
    <Box sx={{
      borderRadius: '24px', p: 2.25, color: '#fff', position: 'relative', overflow: 'hidden',
      background: `linear-gradient(152deg,${C.deep},#12283F 60%,#0E2138)`,
    }}>
      {/* phase progress, as a hairline across the top */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        bgcolor: 'rgba(255,255,255,.10)',
      }}>
        <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: C.yellow }} />
      </Box>

      <Stack direction="row" sx={{ alignItems: 'baseline' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontSize: 8.5, fontWeight: 800, letterSpacing: '.18em',
            textTransform: 'uppercase', color: C.yellow,
          }}>◈ {arc.t}</Typography>
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 23, fontWeight: 600, mt: 0.6,
          }}>Week {week} of {weeks}</Typography>
        </Box>
        <Stack direction="row" spacing={2} sx={{ flexShrink: 0, alignItems: 'baseline' }}>
          {streak > 1 && (
            <Box sx={{ textAlign: 'right' }}>
              <Typography sx={{
                fontSize: 24, fontWeight: 800, lineHeight: 1, color: '#6FD69B',
              }}>{streak}</Typography>
              <Typography sx={{
                fontSize: 7.5, fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', mt: 0.4,
              }}>day streak</Typography>
            </Box>
          )}
          <Box sx={{ textAlign: 'right' }}>
            <Typography sx={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{day}</Typography>
            <Typography sx={{
              fontSize: 7.5, fontWeight: 800, letterSpacing: '.14em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', mt: 0.4,
            }}>of {total}</Typography>
          </Box>
        </Stack>
      </Stack>

      {/* the line that earns the daily open */}
      <Typography sx={{
        fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,.82)', mt: 1.5,
      }}>{arc.b}</Typography>

      {/* consistency, gaps included */}
      <Stack direction="row" spacing={0.6} sx={{ mt: 2.25 }}>
        {strip.map((s) => (
          <Box key={s.d} sx={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
            <Box sx={{
              height: 26, borderRadius: '7px',
              bgcolor: !s.valid || s.future ? 'rgba(255,255,255,.07)'
                : s.on ? '#6FD69B' : 'rgba(255,255,255,.16)',
              border: s.d === day ? `1.5px solid ${C.yellow}` : 'none',
            }} />
            <Typography sx={{
              fontSize: 8, fontWeight: 700, mt: 0.5,
              color: s.d === day ? C.yellow : 'rgba(255,255,255,.35)',
            }}>{s.valid ? s.d : ''}</Typography>
          </Box>
        ))}
      </Stack>

      {milestone && (
        <Stack direction="row" spacing={1.25} sx={{
          alignItems: 'center', mt: 2, pt: 1.75,
          borderTop: '1px solid rgba(255,255,255,.13)',
        }}>
          <Typography sx={{ flex: 1, fontSize: 12, color: 'rgba(255,255,255,.72)' }}>
            Next · {milestone.t}
          </Typography>
          <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C.yellow, flexShrink: 0 }}>
            {Math.max(0, milestone.d - day)} days
          </Typography>
        </Stack>
      )}

      {/* ── the renewal, on the card that owns the cycle. From week 3, because
          the next month is dispensed, reviewed and driven over before the last
          pen is used. ── */}
      {onRenew && (
        <Stack direction="row" spacing={1} onClick={onRenew} sx={{
          alignItems: 'center', mt: 1.75, px: 1.75, py: 1.2,
          borderRadius: '12px', cursor: 'pointer', bgcolor: C.yellow,
        }}>
          <Typography sx={{ flex: 1, fontSize: 13, fontWeight: 700, color: C.deep }}>
            Renew subscription
          </Typography>
          <ArrowForwardIcon sx={{ fontSize: 16, color: C.deep }} />
        </Stack>
      )}
    </Box>
  );
}
