import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckIcon from '@mui/icons-material/Check';
import VideocamIcon from '@mui/icons-material/Videocam';
import { PROTOCOLS, CONSULT_SLOTS, DOCTOR } from '../data';
import { C } from '../theme';

/**
 * The consult. Deliberately thin — one decision, no upsell, no forms.
 *
 * The doctor's face belongs here rather than on a page of his own: he shows up
 * at the moment he's about to do something, which is the difference between a
 * bio and a reason.
 */
export default function Consult({ pKey, onBack, onBooked }) {
  const p = PROTOCOLS[pKey];
  const [slot, setSlot] = useState(0);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" sx={{ alignItems: 'center', px: 2.25, pt: 2, pb: 0.5 }}>
        <IconButton onClick={onBack} size="small" sx={{ ml: -0.5, color: C.deep }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
          textTransform: 'uppercase', color: C.green,
        }}>Free</Typography>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pt: 1.5, pb: 2 }}>
        <Typography variant="h2" sx={{ color: C.deep }}>
          Talk it through first.
        </Typography>
        <Typography sx={{ fontSize: 14, color: C.ink2, mt: 1.25, lineHeight: 1.5 }}>
          Thirty minutes on video. He'll go through {p.t.toLowerCase()} line by line and change
          whatever doesn't fit you.
        </Typography>

        {/* who you're actually talking to */}
        <Stack direction="row" spacing={1.75} sx={{
          alignItems: 'center', mt: 2.5, p: 1.9, borderRadius: '18px', bgcolor: '#fff',
          boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
        }}>
          <Box component="img" src={DOCTOR.img} alt="" sx={{
            width: 52, height: 52, borderRadius: '16px', objectFit: 'cover', flexShrink: 0,
          }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
              {DOCTOR.name}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.25 }}>
              {DOCTOR.role} · {DOCTOR.langs}
            </Typography>
          </Box>
          <VideocamIcon sx={{ fontSize: 20, color: C.teal, flexShrink: 0 }} />
        </Stack>

        <Typography sx={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
          color: C.ink2, mt: 3, mb: 1.5,
        }}>Pick a time</Typography>
        <Stack spacing={1.1}>
          {CONSULT_SLOTS.map((s, i) => {
            const on = slot === i;
            return (
              <Stack key={`${s.d}${s.t}`} direction="row" spacing={1.5}
                     onClick={() => setSlot(i)} sx={{
                alignItems: 'center', px: 2, py: 1.8, borderRadius: '17px', cursor: 'pointer',
                bgcolor: on ? 'rgba(27,57,91,.05)' : '#fff',
                border: `1.5px solid ${on ? C.deep : 'transparent'}`,
                boxShadow: on ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
              }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>
                    {s.d} · {s.t}
                  </Typography>
                  {s.note && (
                    <Typography sx={{ fontSize: 11, color: C.green, fontWeight: 600, mt: 0.25 }}>
                      {s.note}
                    </Typography>
                  )}
                </Box>
                {on && <CheckIcon sx={{ fontSize: 20, color: C.deep, flexShrink: 0 }} />}
              </Stack>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{
        px: 2.25, pt: 1.5, pb: 3, flexShrink: 0,
        borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        <Button fullWidth variant="contained" color="secondary"
                onClick={() => onBooked(`${CONSULT_SLOTS[slot].d} ${CONSULT_SLOTS[slot].t}`)}>
          Confirm {CONSULT_SLOTS[slot].d.toLowerCase()}, {CONSULT_SLOTS[slot].t}
        </Button>
      </Box>
    </Box>
  );
}
