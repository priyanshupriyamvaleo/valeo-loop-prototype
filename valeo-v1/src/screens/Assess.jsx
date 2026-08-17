import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { INVESTIGATE, coachOf, givenNameOf } from '../data';
import { C } from '../theme';

/**
 * THE AI'S HALF OF THE INVESTIGATION — between the intake and the doctor.
 *
 * On the unresolved-problem door, the AI's job is big: investigate and
 * reason. This is the one surface where that work is VISIBLE. Three areas
 * worth investigating, each tied to the marker that would settle it, appear
 * one at a time — reasoning arriving, not a list rendering.
 *
 * ── WHAT IT NEVER CLAIMS ──
 * No diagnosis, no probability, no "likely". The boundary line under the
 * rows says exactly where the machine stops and the clinician starts,
 * because an AI that implies it replaces the doctor undoes the product's
 * whole premise. This screen PREPARES the consultation; the CTA hands
 * straight into it.
 *
 * ── WHY A SCREEN AND NOT A CHAT BUBBLE ──
 * The investigation is the value of this door — "judgment + resolution" —
 * and value buried in a chat transcript reads as small talk. One quiet
 * screen makes the work inspectable at a glance and gives the consultation
 * an agenda the patient has already seen.
 */
export default function Assess({ goal, pKey, onBack, onDone }) {
  const c = coachOf(pKey) || coachOf('P_WEIGHT');
  const rows = INVESTIGATE[goal] || INVESTIGATE.test;
  const first = c ? givenNameOf(c) : 'your doctor';
  /* rows reveal one by one — visible reasoning, not a spinner */
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= rows.length + 1) return undefined;
    const t = setTimeout(() => setN((x) => x + 1), n === 0 ? 500 : 640);
    return () => clearTimeout(t);
  }, [n, rows.length]);
  const ready = n > rows.length;

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(180deg,#FFF6E4 0%,${C.cream} 24%)`,
    }}>
      <Box sx={{ px: 2.25, pt: 1.75, flexShrink: 0 }}>
        <IconButton onClick={onBack} size="small" sx={{
          width: 34, height: 34, bgcolor: '#fff', color: C.deep,
          boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
          '&:hover': { bgcolor: '#fff' },
        }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.75, pb: 2 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.5 }}>
          <Box sx={{
            width: 7, height: 7, borderRadius: '50%', bgcolor: C.yellow,
            animation: ready ? 'none' : 'aPulse 1.1s ease-in-out infinite',
            '@keyframes aPulse': {
              '0%,100%': { opacity: 0.35 }, '50%': { opacity: 1 },
            },
          }} />
          <Typography sx={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em',
            textTransform: 'uppercase', color: C.yellowDeep,
          }}>{ready ? 'Worked through your answers' : 'Working through your answers'}</Typography>
        </Stack>

        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 27, fontWeight: 600,
          lineHeight: 1.15, color: C.deep, mt: 2,
        }}>Here’s what’s worth investigating.</Typography>

        <Stack spacing={1.25} sx={{ mt: 2.75 }}>
          {rows.map((r, idx) => (
            <Box key={r.t} sx={{
              px: 2, py: 1.75, borderRadius: '16px', bgcolor: '#fff',
              boxShadow: '0 8px 24px -18px rgba(27,57,91,.5)',
              opacity: n > idx ? 1 : 0,
              transform: n > idx ? 'none' : 'translateY(10px)',
              transition: 'opacity .45s cubic-bezier(.2,.9,.25,1), transform .5s cubic-bezier(.2,.9,.25,1)',
            }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography sx={{
                  fontSize: 13.5, fontWeight: 700, color: C.deep, flex: 1, minWidth: 0,
                }}>{r.t}</Typography>
                <Typography sx={{
                  flexShrink: 0, px: 0.9, py: 0.3, borderRadius: '6px',
                  fontSize: 8.5, fontWeight: 800, letterSpacing: '.06em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                  bgcolor: 'rgba(224,164,0,.14)', color: C.yellowDeep,
                }}>{r.m}</Typography>
              </Stack>
              <Typography sx={{ fontSize: 12.5, lineHeight: 1.5, color: C.ink2, mt: 0.6 }}>
                {r.s}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* Where the machine stops. One sentence, and it is load-bearing. */}
        <Typography sx={{
          fontSize: 12, lineHeight: 1.55, color: C.ink2, mt: 2.5,
          opacity: ready ? 1 : 0, transition: 'opacity .5s',
        }}>
          This is preparation, not a diagnosis. {first} decides what matters
          on your call, and can see all of this before you speak.
        </Typography>
      </Box>

      <Box sx={{ px: 2.75, pt: 1.5, pb: 3, flexShrink: 0 }}>
        <Button fullWidth variant="contained" color="secondary" onClick={onDone}
          disabled={!ready}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 17 }} />}
          sx={{ py: 1.45, fontSize: 15 }}>
          Review this with {first} now
        </Button>
      </Box>
    </Box>
  );
}
