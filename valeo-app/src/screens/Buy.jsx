import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography, Divider } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { PROTOCOLS, KINDS, DOCTOR } from '../data';
import { C } from '../theme';

/**
 * The purchase. Everything on this page exists to answer one question the
 * person is actually asking: what arrives, and when.
 *
 * The line-item list is the protocol they already read — same names, same
 * order. A different-looking cart at checkout is how trust gets lost at the
 * last step.
 */
export default function Buy({ pKey, onBack, onPaid }) {
  const p = PROTOCOLS[pKey];
  const [paid, setPaid] = useState(false);

  const bloods = p.bloodFirst ? 449 : 0;
  const total = p.price + bloods;

  if (paid) {
    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        background: `linear-gradient(172deg,#1E3F63,${C.night} 58%,#0B1B2E)`, color: '#fff',
      }}>
        <Box sx={{
          flex: '1 1 auto', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', px: 3.5, textAlign: 'center',
        }}>
          <CheckCircleIcon sx={{ fontSize: 62, color: '#6FD69B' }} />
          <Typography variant="overline" sx={{ color: C.yellow, mt: 2.5, display: 'block' }}>
            ◈ Loop 1 begins
          </Typography>
          <Typography variant="h1" sx={{ mt: 1.25 }}>
            {p.bloodFirst ? 'Bloods Thursday.' : 'It ships tonight.'}
          </Typography>
          <Typography sx={{
            fontSize: 14.5, color: 'rgba(255,255,255,.66)', mt: 1.75, lineHeight: 1.5,
          }}>
            {p.bloodFirst
              ? 'A nurse draws your baseline, then the package follows.'
              : 'A nurse brings it to you tomorrow and walks you through the first dose.'}
          </Typography>

          <Stack direction="row" spacing={1.5} sx={{
            alignItems: 'center', mt: 4, px: 2, py: 1.75, borderRadius: '16px', width: '100%',
            bgcolor: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
          }}>
            <LocalShippingIcon sx={{ fontSize: 20, color: C.yellow, flexShrink: 0 }} />
            <Typography sx={{ flex: 1, fontSize: 13, textAlign: 'left' }}>
              Track it on Today
            </Typography>
          </Stack>
        </Box>
        <Box sx={{ px: 2.75, pb: 3 }}>
          <Button fullWidth variant="contained" color="secondary" onClick={onPaid}>
            Go to Today
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" sx={{ alignItems: 'center', px: 2.25, pt: 2, pb: 0.5 }}>
        <IconButton onClick={onBack} size="small" sx={{ ml: -0.5, color: C.deep }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pt: 1.5, pb: 2 }}>
        <Typography variant="h2" sx={{ color: C.deep }}>What arrives.</Typography>
        <Typography sx={{ fontSize: 13.5, color: C.ink2, mt: 1.25, lineHeight: 1.5 }}>
          First month of {p.t.toLowerCase()}, as {DOCTOR.name.split(' ')[1]} amended it.
        </Typography>

        <Box sx={{
          mt: 2.5, borderRadius: '18px', bgcolor: '#fff', overflow: 'hidden',
          boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
        }}>
          {p.items.map((it, i) => (
            <Box key={it.t}>
              {i > 0 && <Divider />}
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 1.75, py: 1.4 }}>
                <Box sx={{ fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 }}>
                  {KINDS[it.k].ic}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: C.deep }}>
                    {it.t}
                  </Typography>
                  <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.15 }}>{it.d}</Typography>
                </Box>
                {KINDS[it.k].rx && (
                  <Typography sx={{
                    fontSize: 8.5, fontWeight: 800, letterSpacing: '.1em',
                    textTransform: 'uppercase', color: C.yellowDeep, flexShrink: 0,
                  }}>Rx</Typography>
                )}
              </Stack>
            </Box>
          ))}
        </Box>

        {/* the money, itemised */}
        <Box sx={{
          mt: 2.5, borderRadius: '18px', bgcolor: 'rgba(27,57,91,.035)', p: 2,
        }}>
          <Row k={`${p.t} · first month`} v={`SAR ${p.price.toLocaleString()}`} />
          {p.bloodFirst && <Row k="Blood baseline (half price)" v={`SAR ${bloods}`} />}
          <Row k="Nurse visits & delivery" v="Included" muted />
          <Row k={`${DOCTOR.name.split(' ')[1]}'s review`} v="Free" muted />
          <Divider sx={{ my: 1.5 }} />
          <Row k="Total today" v={`SAR ${total.toLocaleString()}`} bold />
        </Box>

        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2, lineHeight: 1.55 }}>
          Monthly after this, cancel any time. If the retest at week {p.wk} says it didn't work, we
          tell you and we stop — that's the point of the loop.
        </Typography>
      </Box>

      <Box sx={{
        px: 2.25, pt: 1.5, pb: 3, flexShrink: 0,
        borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => setPaid(true)}>
          Pay SAR {total.toLocaleString()}
        </Button>
      </Box>
    </Box>
  );
}

function Row({ k, v, bold, muted }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'baseline', py: 0.55 }}>
      <Typography sx={{
        flex: 1, fontSize: bold ? 14 : 12.5,
        fontWeight: bold ? 800 : 400, color: bold ? C.deep : C.ink2,
      }}>{k}</Typography>
      <Typography sx={{
        fontSize: bold ? 17 : 12.5, fontWeight: bold ? 800 : 600,
        color: bold ? C.deep : muted ? C.green : C.ink,
      }}>{v}</Typography>
    </Stack>
  );
}
