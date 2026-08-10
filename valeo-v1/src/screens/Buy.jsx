import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PaySheet from '../components/PaySheet';
import { PROTOCOLS, runOf } from '../data';
import { C } from '../theme';

/**
 * CHECKOUT.
 *
 * This screen has been talked out of three different jobs now. It was a
 * delivery manifest ("What arrives"), then a pre-treatment briefing carrying
 * the regimen, an included list, a payment breakdown and a four-step explainer
 * of what happens after paying. All of that was true and none of it belonged
 * here, because the screen immediately before it is a care plan that says the
 * same things at length and the patient has just read it.
 *
 * What is left is a cart. Two lines, a total, a button. The plan is the
 * product; the five things inside it are a spec you can go back one screen to
 * read, and repeating them at the till is how a checkout turns into a second
 * sales pitch.
 *
 * It fits on one screen without scrolling, which is the actual test — a
 * checkout you have to scroll is a checkout that is still arguing.
 */
export default function Buy({ st, pKey, onBack, onPaid }) {
  const p = PROTOCOLS[pKey];
  const [pay, setPay] = useState(false);

  const bloods = p.blood !== 'no' ? 449 : 0;
  const total = p.price + bloods;
  /* On the bloods route the draw already happened — it is still on the bill,
     but calling it "included" as though it were ahead of them would be wrong. */
  const drawn = !!(runOf(st || {}, pKey) || {}).bloodSlot;

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
          lineHeight: 1.15, color: C.deep, mt: 0.5, mb: 2.75,
        }}>Your order</Typography>

        <Box sx={{
          borderRadius: '18px', bgcolor: '#fff', px: 2,
          boxShadow: '0 2px 14px -10px rgba(27,57,91,.4)',
        }}>
          <Line
            t={`${p.t} plan`}
            s={`First month · ${p.items.length} items`}
            v={`SAR ${p.price.toLocaleString()}`}
          />
          {bloods > 0 && (
            <Line
              t="Home blood draw"
              s={drawn ? 'Nurse visit, already taken' : 'Nurse visit included'}
              v={`SAR ${bloods}`}
              top
            />
          )}
          <Line t="Delivery, consultations and support" v="Included" muted top />

          <Stack direction="row" sx={{
            alignItems: 'baseline', py: 1.75, borderTop: `1px solid ${C.line}`,
          }}>
            <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 700, color: C.deep }}>
              Total
            </Typography>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 21, fontWeight: 600, color: C.deep,
            }}>SAR {total.toLocaleString()}</Typography>
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: 2.25, pt: 1.5, pb: 3, flexShrink: 0 }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => setPay(true)}>
          Buy plan · SAR {total.toLocaleString()}
        </Button>
        <Typography sx={{ fontSize: 12, color: C.ink2, textAlign: 'center', mt: 1.2 }}>
          Monthly after this, cancel any time
        </Typography>
      </Box>

      {/* The sheet's green tick is the confirmation. Today takes it from there. */}
      <PaySheet open={pay} item={`${p.t} · first month`} fee={total.toLocaleString()}
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
