import { useEffect, useState } from 'react';
import { Box, Drawer, Stack, Typography } from '@mui/material';
import FaceIcon from '@mui/icons-material/FaceRetouchingNatural';

/**
 * THE PAYMENT SHEET.
 *
 * Deliberately not our design. It borrows the platform's: grey sheet, white
 * row, "Double-click to pay", a green tick. Paying is the one moment in the
 * product where the patient should feel they are dealing with their phone
 * rather than with us — a bespoke checkout at this exact moment reads as a
 * merchant, and everything else about this product is trying not to.
 *
 * Extracted from Consult when the purchase flow started using it too. Two
 * copies of a payment affordance is how one of them quietly stops matching.
 */
export default function PaySheet({ open, slot, item, fee, onClose, onDone }) {
  const [state, setState] = useState('ask');

  useEffect(() => {
    if (!open) { setState('ask'); return undefined; }
    const a = setTimeout(() => setState('ok'), 1500);
    const b = setTimeout(onDone, 2400);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute', bgcolor: 'rgba(0,0,0,.45)' } },
        paper: {
          sx: {
            position: 'absolute', borderTopLeftRadius: 14, borderTopRightRadius: 14,
            bgcolor: '#F7F7F9', backgroundImage: 'none', color: '#111',
          },
        },
      }}>
      <Box sx={{ px: 2.5, pt: 2.25, pb: 3.5 }}>
        <Stack direction="row" sx={{ alignItems: 'center', mb: 2 }}>
          <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 700, color: '#111' }}>
             Pay
          </Typography>
          <Typography sx={{ fontSize: 12, color: '#8A8A8E' }}>Valeo</Typography>
        </Stack>

        <Stack direction="row" sx={{
          alignItems: 'center', px: 1.75, py: 1.6, borderRadius: '10px', bgcolor: '#fff',
        }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: '#111' }}>
              {item}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: '#8A8A8E', mt: 0.2 }}>
              {slot ? `${slot.d} · ${slot.t}` : ''}
            </Typography>
          </Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: '#111' }}>
            SAR {fee}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{
          alignItems: 'center', justifyContent: 'center', mt: 3,
        }}>
          {state === 'ok' ? (
            <>
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%', bgcolor: '#34C759',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 13, fontWeight: 700,
              }}>✓</Box>
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111' }}>Done</Typography>
            </>
          ) : (
            <>
              <FaceIcon sx={{ fontSize: 20, color: '#111' }} />
              <Typography sx={{ fontSize: 14, fontWeight: 600, color: '#111' }}>
                Double-click to pay
              </Typography>
            </>
          )}
        </Stack>
      </Box>
    </Drawer>
  );
}
