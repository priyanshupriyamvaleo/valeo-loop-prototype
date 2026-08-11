import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckIcon from '@mui/icons-material/Check';
import PaySheet from '../components/PaySheet';
import { PROTOCOLS, PROGRAMME_FEE, PROGRAMME_INCLUDES } from '../data';
import { C } from '../theme';

/**
 * PROGRAMME CHECKOUT.
 *
 * This screen has changed job three times, and the last change was the largest.
 * It sold a protocol, then a first month of treatment. It now sells entry to a
 * course of care.
 *
 * The reason is a real product problem. A patient does not want to buy a blood
 * test, and does not think in terms of consultation plus diagnostics plus
 * protocol plus logistics. A patient wants help with a goal. Those other things
 * are parts of the service, so they belong inside one price rather than beside
 * it as separate charges.
 *
 * ── ONE LINE, NOT AN ITEMISED BILL ──
 * An itemised list here turns the programme back into a basket of medical
 * procedures. The patient already read what is included on the Care Brief, and
 * the same list appears below the total for reassurance, not for arithmetic.
 *
 * ── AND ONLY ONCE ──
 * This is the single payment in the whole journey. The consultation before it
 * was free. The blood test after it is already covered. The plan screen at the
 * end says "Activate", not "Buy".
 */

export default function Buy({ pKey, onBack, onPaid }) {
  const p = PROTOCOLS[pKey];
  const [pay, setPay] = useState(false);

  /* One line, one price. The patient is buying entry to a course of care, and
     the blood test is a step inside it. Itemising the components here would
     turn the programme back into a shopping basket of medical procedures,
     which is the framing this whole flow was rebuilt to remove. */
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      <Stack direction="row" sx={{ alignItems: 'center', px: 1.5, pt: 1.5, pb: 0.5 }}>
        <IconButton onClick={onBack} size="small" sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 27, fontWeight: 600,
          lineHeight: 1.15, color: C.deep, mt: 0.5,
        }}>Start your programme</Typography>
        <Typography sx={{ fontSize: 14.5, color: C.ink2, mt: 1.1, lineHeight: 1.5 }}>
          One payment for your whole course of care with {p.t.toLowerCase()}.
        </Typography>

        <Box sx={{
          mt: 3.5, borderRadius: '18px', bgcolor: '#fff', px: 2, py: 0.5,
          boxShadow: '0 2px 14px -10px rgba(27,57,91,.4)',
        }}>
          <Line t="Personalised health programme" s={p.t} v={`SAR ${PROGRAMME_FEE.toLocaleString()}`} />
          <Stack direction="row" sx={{
            alignItems: 'baseline', py: 1.75, borderTop: `1px solid ${C.line}`,
          }}>
            <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 700, color: C.deep }}>
              Total
            </Typography>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 21, fontWeight: 600, color: C.deep,
            }}>SAR {PROGRAMME_FEE.toLocaleString()}</Typography>
          </Stack>
        </Box>

        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
          color: C.ink2, mt: 4, mb: 1.8,
        }}>What is included</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {PROGRAMME_INCLUDES.map((t) => (
            <Stack key={t} direction="row" spacing={1.1} sx={{
              width: 'calc(50% - 4px)', alignItems: 'center',
              px: 1.4, py: 1.3, borderRadius: '14px', bgcolor: '#fff',
              boxShadow: '0 2px 12px -9px rgba(27,57,91,.4)',
            }}>
              <CheckIcon sx={{ fontSize: 14, color: C.green, flexShrink: 0 }} />
              <Typography sx={{ flex: 1, fontSize: 12.5, lineHeight: 1.3, color: C.deep }}>
                {t}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Box>

      <Box sx={{ px: 2.25, pt: 1.5, pb: 3, flexShrink: 0 }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => setPay(true)}>
          Start my programme · SAR {PROGRAMME_FEE.toLocaleString()}
        </Button>
        <Typography sx={{ fontSize: 12, color: C.ink2, textAlign: 'center', mt: 1.2 }}>
          Nothing more to pay at any later step
        </Typography>
      </Box>

      <PaySheet open={pay} item={`${p.t} programme`} fee={PROGRAMME_FEE.toLocaleString()}
        onClose={() => setPay(false)} onDone={onPaid} />
    </Box>
  );
}

function Line({ t, s, v, muted, top }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{
      alignItems: 'baseline', py: 1.6, borderTop: top ? `1px solid ${C.line}` : 'none',
    }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: C.deep, lineHeight: 1.35 }}>
          {t}
        </Typography>
        {s && <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 0.25 }}>{s}</Typography>}
      </Box>
      <Typography sx={{
        fontSize: 14.5, fontWeight: 600, flexShrink: 0,
        color: muted ? C.green : C.deep,
      }}>{v}</Typography>
    </Stack>
  );
}
