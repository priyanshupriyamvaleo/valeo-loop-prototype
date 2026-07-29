import { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import TwinGlyph from '../components/TwinGlyph';
import { C } from '../theme';

const FIRST = [
  'Reading your twin · 14 signals',
  'Finding verified twins near you',
  'Comparing your biology to theirs',
  'Pulling their current protocols',
  'Scoring what would transfer to you',
];
/* Re-scoring after a baseline lands. Same theatre, different work — because
   it genuinely is different work: real bloods change every score. */
const UNLOCK = [
  'Baseline received · 24 markers',
  'Re-scoring every twin against your bloods',
  'Opening Advanced',
  'Opening Elite',
  'Re-ordering your deck',
];

export default function Matching({ onDone, mode = 'first' }) {
  const STEPS = mode === 'unlock' ? UNLOCK : FIRST;
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
        {mode === 'unlock' ? 'Everything just moved.' : 'Finding your matches.'}
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
