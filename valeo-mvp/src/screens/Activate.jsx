import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PaySheet from '../components/PaySheet';
import { RECOMMEND, carePlan, coachOf, givenNameOf, TEST_FEE } from '../data';
import { C } from '../theme';

/*
 * THE ACTIVATION — the balance ask at the conviction peak.
 *
 * Results are reviewed and the treatment is confirmed; this screen asks for
 * the rest of the money. The maths is three rows of cart arithmetic (total,
 * applied, due today) because that is the one format nobody has to learn,
 * and the only number ASKED for is the last one. docs/MVP_LONG_FLOW.md §3.6.
 */
export default function Activate({ pKey, onBack, onPaid }) {
  const c = coachOf(pKey);
  const [pay, setPay] = useState(false);
  if (!c) return null;

  const first = givenNameOf(c);
  const s = (RECOMMEND[pKey] || {}).speak || {};
  const total = carePlan(pKey).price;
  const due = total - TEST_FEE;

  const row = (t, v, strong) => (
    <Stack direction="row" sx={{ justifyContent: 'space-between', py: 1.1 }}>
      <Typography sx={{ fontSize: 13.5, color: strong ? C.deep : C.ink2, fontWeight: strong ? 700 : 500 }}>
        {t}
      </Typography>
      <Typography sx={{
        fontSize: 13.5, fontWeight: strong ? 800 : 600, color: strong ? C.deep : C.ink2,
        fontVariantNumeric: 'tabular-nums',
      }}>{v}</Typography>
    </Stack>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FAF6ED' }}>
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.75, pt: 1.75, pb: 2 }}>
        <IconButton onClick={onBack} size="small" sx={{
          width: 34, height: 34, bgcolor: '#fff', color: C.deep,
          boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
          '&:hover': { bgcolor: '#fff' },
        }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        </IconButton>

        <Typography sx={{
          fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em',
          textTransform: 'uppercase', color: C.yellowDeep, mt: 2.25,
        }}>Results reviewed</Typography>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 28, fontWeight: 600,
          lineHeight: 1.15, color: C.deep, mt: 0.75,
        }}>Start your programme</Typography>
        <Typography sx={{ fontSize: 13.5, lineHeight: 1.55, color: C.ink2, mt: 1, maxWidth: 300 }}>
          Your treatment is confirmed on your results.
        </Typography>

        {/* the cart math: total, applied, due — nothing to learn */}
        <Box sx={{
          mt: 2.5, px: 2.25, py: 1.25, borderRadius: '18px', bgcolor: '#fff',
          boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
        }}>
          {row(s.prog || 'Your programme', `SAR ${total.toLocaleString()}`)}
          <Box sx={{ borderTop: `1px solid ${C.line}` }} />
          {row('Blood test, applied', `− SAR ${TEST_FEE}`)}
          <Box sx={{ borderTop: `1px solid ${C.line}` }} />
          {row('Due today', `SAR ${due.toLocaleString()}`, true)}
        </Box>

        <Typography sx={{ fontSize: 12.5, lineHeight: 1.55, color: C.ink2, mt: 2 }}>
          12 weeks of care with {first}: your treatment delivered monthly,
          follow-up consultations, support between them, and your retest at
          week 12.
        </Typography>
      </Box>

      <Box sx={{
        flexShrink: 0, px: 2.75, pt: 1.5, pb: 2,
        borderTop: `1px solid ${C.line}`, bgcolor: '#FAF6ED',
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => setPay(true)}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{ py: 1.4, fontSize: 15.5 }}>
          Start my programme · SAR {due.toLocaleString()}
        </Button>
        <Stack direction="row" spacing={0.6} sx={{
          alignItems: 'center', justifyContent: 'center', mt: 1,
        }}>
          <LockOutlinedIcon sx={{ fontSize: 12, color: C.ink2 }} />
          <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', lineHeight: 1.45 }}>
            12 weeks of clinician-led care, treatment and follow-up. Your
            blood test is already paid.
          </Typography>
        </Stack>
      </Box>

      <PaySheet open={pay}
        item={`${s.prog || 'Your programme'} · balance`}
        fee={due.toLocaleString()}
        note="Your blood test payment is already applied."
        onClose={() => setPay(false)} onDone={onPaid} />
    </Box>
  );
}
