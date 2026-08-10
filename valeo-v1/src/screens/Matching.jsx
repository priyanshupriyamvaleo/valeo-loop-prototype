import { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import TwinGlyph from '../components/TwinGlyph';
import { buildWords, phaseHas } from '../data';
import { C } from '../theme';

/* The loader is not decoration — it is where the shortlist gets claimed, so the
   stages have to name work the phase actually does. The twin lines below are load
   bearing where the deck IS other people; in a phase with no twins and no tiers
   they describe a product that isn't there, which is worse than saying nothing. */
const STAGES = {
  twin: {
    first: [
      'Reading your answers · 14 signals',
      'Finding verified twins near you',
      'Comparing your biology to theirs',
      'Pulling their current protocols',
      'Scoring what would transfer to you',
    ],
    /* Re-scoring after a baseline lands. Same theatre, different work — because
       it genuinely is different work: real bloods change every score. */
    unlock: [
      'Baseline received · 24 markers',
      'Re-scoring every twin against your bloods',
      'Opening Advanced',
      'Opening Elite',
      'Re-ordering your deck',
    ],
  },
  loop: {
    first: [
      'Reading your answers · 14 signals',
      'Matching against every protocol we run',
      'Checking what is safe for you',
      'Estimating what each one would move',
      'Putting your plan together',
    ],
    unlock: [
      'Baseline received · 24 markers',
      'Re-scoring every protocol against your bloods',
      'Flagging what your labs rule out',
      'Re-ranking your shortlist',
    ],
  },
};

export default function Matching({ onDone, mode = 'first', phase = 3 }) {
  const STEPS = STAGES[phaseHas(phase, 'tiers') ? 'twin' : 'loop'][mode === 'unlock' ? 'unlock' : 'first'];
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= STEPS.length) { const t = setTimeout(onDone, 750); return () => clearTimeout(t); }
    const t = setTimeout(() => setN(n + 1), 620);
    return () => clearTimeout(t);
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', px: 3, color: '#fff',
      background: `linear-gradient(172deg,#1E3F63,${C.night} 58%,#0B1B2E)`,
    }}>
      <Box sx={{ position: 'relative' }}>
        <TwinGlyph size={140} fill={n / STEPS.length} loops={0} />
        <Typography sx={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 19, fontWeight: 800, color: C.yellow,
        }}>{Math.round((n / STEPS.length) * 100)}%</Typography>
      </Box>

      <Typography variant="h2" sx={{ mt: 3, textAlign: 'center' }}>
        {mode === 'unlock' ? 'Everything just moved.' : buildWords(phase).ing}
      </Typography>

      <Stack spacing={0.5} sx={{ mt: 3, width: '100%', maxWidth: 320 }}>
        {STEPS.map((s, i) => (
          <Stack key={s} direction="row" spacing={1.25}
                 sx={{ alignItems: 'center', py: 0.7, opacity: i <= n ? 1 : 0.3 }}>
            <Box sx={{ width: 18, display: 'flex', justifyContent: 'center' }}>
              {i < n
                ? <CheckIcon sx={{ fontSize: 15, color: '#6FD69B' }} />
                : <Box sx={{
                    width: 7, height: 7, borderRadius: '50%',
                    bgcolor: i === n ? C.yellow : 'rgba(255,255,255,.3)',
                  }} />}
            </Box>
            <Typography sx={{
              fontSize: 13, color: i === n ? '#fff' : 'rgba(255,255,255,.55)',
            }}>{s}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
