import { Box, Button, IconButton, Stack, Typography, Divider } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import TwinGlyph from '../components/TwinGlyph';
import { buildWords, phaseHas } from '../data';
import { C } from '../theme';

/* Two pitches, because the phases sell different things.
   The twin version promises a model of you; the protocol version promises a
   verdict on one thing you tried. Running the twin pitch in a phase that ships
   no twin is the fastest way to lose someone on screen two — they are told they
   are getting a digital copy of themselves and handed a task list. */
const PITCH = {
  twin: {
    eyebrow: '◈ Introducing Valeo Twins',
    head: <>Health that finally<br />knows you.</>,
    sub: 'Your twin is a glimpse of you.',
    proof: [['10,000+', 'Twins'], ['100+', 'Experts']],
    lines: [
      ['◈', 'Joins the world’s most elite health network'],
      ['✦', 'Finds the best protocols on earth, matched to you'],
      ['◎', 'Is a digital copy of your health'],
    ],
  },
  loop: {
    eyebrow: '◈ Explore Valeo Protocols',
    head: <>Doctor-led,<br />not doctor-decorated.</>,
    /* No subhead. Two features, stated once each — anything more here is the
       thing this screen exists to avoid: a pitch for a program where the
       doctor turns out to be a rubber stamp. */
    sub: null,
    proof: [['10,000+', 'Members'], ['100+', 'Doctors']],
    lines: [
      ['◈', 'Doctor-led protocols — matched to your goal, run by a real doctor or coach'],
      ['✦', 'Your doctor’s practice, in your pocket — message them any time, between visits'],
    ],
  },
};

/**
 * Cold open.
 * Fixes on the previous version: the eyebrow said "Introducing Valeo Twins"
 * and the headline said "Meet Valeo Twins" — the same sentence twice, so the
 * headline now carries the benefit instead. The eyebrow has real clearance
 * from the mark. The proof numbers are sized to be read. And the CTA is
 * pinned to a bottom bar rather than floating in the flow, which is what
 * makes it read as an app rather than a poster.
 */
export default function Intro({ onNext, onBack, phase = 3 }) {
  const k = phaseHas(phase, 'twin') ? 'twin' : 'loop';
  const P = PITCH[k];
  const W = buildWords(phase);
  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(172deg,#1E3F63,${C.night} 58%,#0B1B2E)`, color: '#fff',
    }}>
      {onBack && (
        <Box sx={{ px: 1.5, pt: 1.5, flexShrink: 0 }}>
          <IconButton onClick={onBack} size="small" sx={{ color: 'rgba(255,255,255,.6)' }}>
            <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
      )}

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.75, pt: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <TwinGlyph size={onBack ? 138 : 162} />
        </Box>

        {/* clearance from the mark — this was touching it before */}
        <Typography variant="overline" sx={{
          display: 'block', textAlign: 'center', color: C.yellow, mt: 2.5,
        }}>
          {P.eyebrow}
        </Typography>

        <Typography variant="h1" sx={{ textAlign: 'center', mt: 1.25 }}>
          {P.head}
        </Typography>

        {P.sub && (
          <Typography sx={{
            textAlign: 'center', mt: 1.5, fontSize: 15.5, lineHeight: 1.45,
            color: 'rgba(255,255,255,.62)',
          }}>
            {P.sub}
          </Typography>
        )}

        {/* proof, at a size you can actually read */}
        <Stack direction="row" spacing={2.5}
               sx={{ alignItems: 'center', justifyContent: 'center', mt: P.sub ? 2.75 : 3.5 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 27, fontWeight: 800, color: C.yellow, lineHeight: 1 }}>
              {P.proof[0][0]}
            </Typography>
            <Typography sx={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', mt: 0.6,
            }}>{P.proof[0][1]}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem
                   sx={{ borderColor: 'rgba(255,255,255,.16)', my: 0.5 }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 27, fontWeight: 800, color: '#6FD69B', lineHeight: 1 }}>
              {P.proof[1][0]}
            </Typography>
            <Typography sx={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', mt: 0.6,
            }}>{P.proof[1][1]}</Typography>
          </Box>
        </Stack>

        <Stack spacing={1.1} sx={{ mt: 3.25, pb: 2 }}>
          {P.lines.map(([ic, t]) => (
            <Stack key={t} direction="row" spacing={1.75} sx={{
              alignItems: 'center', px: 2, py: 1.9, borderRadius: '18px',
              background: 'rgba(255,255,255,.075)',
              border: '1px solid rgba(255,255,255,.13)',
              backdropFilter: 'blur(22px) saturate(150%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.14)',
            }}>
              <Box sx={{ width: 24, textAlign: 'center', fontSize: 17, color: C.yellow, flexShrink: 0 }}>
                {ic}
              </Box>
              <Typography sx={{ fontSize: 15, fontWeight: 600, lineHeight: 1.34 }}>{t}</Typography>
            </Stack>
          ))}
        </Stack>
      </Box>

      {/* pinned bar — app, not poster */}
      <Box sx={{ px: 2.75, pt: 1.5, pb: 3 }}>
        <Button fullWidth variant="contained" color="secondary" onClick={onNext}>
          {k === 'loop' ? 'Start my journey' : W.cta}
        </Button>
      </Box>
    </Box>
  );
}
