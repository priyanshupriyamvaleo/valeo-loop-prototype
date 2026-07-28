import { Box, Button, Stack, Typography, Divider } from '@mui/material';
import TwinGlyph from '../components/TwinGlyph';
import { C } from '../theme';

const LINES = [
  ['◈', 'Joins the world’s most elite health network'],
  ['✦', 'Finds the best protocols on earth, matched to you'],
  ['◎', 'Is a digital copy of your health'],
];

/**
 * Cold open.
 * Fixes on the previous version: the eyebrow said "Introducing Valeo Twins"
 * and the headline said "Meet Valeo Twins" — the same sentence twice, so the
 * headline now carries the benefit instead. The eyebrow has real clearance
 * from the mark. The proof numbers are sized to be read. And the CTA is
 * pinned to a bottom bar rather than floating in the flow, which is what
 * makes it read as an app rather than a poster.
 */
export default function Intro({ onNext }) {
  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(172deg,#1E3F63,${C.night} 58%,#0B1B2E)`, color: '#fff',
    }}>
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.75, pt: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <TwinGlyph size={162} />
        </Box>

        {/* clearance from the mark — this was touching it before */}
        <Typography variant="overline" sx={{
          display: 'block', textAlign: 'center', color: C.yellow, mt: 2.5,
        }}>
          ◈ Introducing Valeo Twins
        </Typography>

        <Typography variant="h1" sx={{ textAlign: 'center', mt: 1.25 }}>
          Health that finally<br />knows you.
        </Typography>

        <Typography sx={{
          textAlign: 'center', mt: 1.5, fontSize: 15.5, lineHeight: 1.45,
          color: 'rgba(255,255,255,.62)',
        }}>
          Your twin is a glimpse of you.
        </Typography>

        {/* proof, at a size you can actually read */}
        <Stack direction="row" spacing={2.5}
               sx={{ alignItems: 'center', justifyContent: 'center', mt: 2.75 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 27, fontWeight: 800, color: C.yellow, lineHeight: 1 }}>
              10,000+
            </Typography>
            <Typography sx={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', mt: 0.6,
            }}>Twins</Typography>
          </Box>
          <Divider orientation="vertical" flexItem
                   sx={{ borderColor: 'rgba(255,255,255,.16)', my: 0.5 }} />
          <Box sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontSize: 27, fontWeight: 800, color: '#6FD69B', lineHeight: 1 }}>
              100+
            </Typography>
            <Typography sx={{
              fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', mt: 0.6,
            }}>Experts</Typography>
          </Box>
        </Stack>

        <Stack spacing={1.1} sx={{ mt: 3.25, pb: 2 }}>
          {LINES.map(([ic, t]) => (
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
          Build my twin
        </Button>
      </Box>
    </Box>
  );
}
