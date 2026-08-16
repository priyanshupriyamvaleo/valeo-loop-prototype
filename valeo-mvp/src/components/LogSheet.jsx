import { useState } from 'react';
import { Box, Button, Drawer, Stack, Typography, Chip } from '@mui/material';
import Drum from './Drum';
import { LOG_KINDS } from '../data';
import { C } from '../theme';

/**
 * The daily log. Three shapes, and which one you get is decided by what's
 * actually useful that day rather than by variety for its own sake:
 * side effects in the first three weeks, because that's when they happen and
 * when people quit; a weigh-in weekly, because that's what fills the gap
 * between two blood draws; otherwise just: did you take it.
 */
export default function LogSheet({ open, onClose, kind, day, onSave }) {
  const K = LOG_KINDS[kind] || LOG_KINDS.taken;
  const [felt, setFelt] = useState(null);
  const [kg, setKg] = useState(95);

  const canSave = kind === 'felt' ? !!felt : true;
  const value = kind === 'felt' ? felt : kind === 'proxy' ? kg : true;

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: {
          sx: {
            position: 'absolute', borderTopLeftRadius: 26, borderTopRightRadius: 26,
            bgcolor: C.cream, backgroundImage: 'none', px: 2.5, pt: 2, pb: 3,
          },
        },
      }}>
      <Box sx={{ width: 38, height: 4, borderRadius: 2, bgcolor: 'rgba(27,57,91,.16)',
                 mx: 'auto', mb: 2.25 }} />

      <Typography sx={{
        fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
        textTransform: 'uppercase', color: C.ink2,
      }}>Day {day}</Typography>
      <Typography variant="h3" sx={{ color: C.deep, mt: 0.75 }}>{K.t}</Typography>
      <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 0.75 }}>{K.sub}</Typography>

      <Box sx={{ mt: 3 }}>
        {kind === 'felt' && (
          <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
            {K.o.map((o) => (
              <Chip key={o} label={o} onClick={() => setFelt(o)} sx={{
                bgcolor: felt === o ? C.deep : 'rgba(27,57,91,.06)',
                color: felt === o ? '#fff' : C.ink,
                fontWeight: felt === o ? 600 : 500,
                '&:hover': { bgcolor: felt === o ? C.deep : 'rgba(27,57,91,.10)' },
              }} />
            ))}
          </Stack>
        )}

        {kind === 'proxy' && (
          <Stack direction="row"><Drum from={60} to={140} value={kg}
                                      onChange={setKg} suffix="kg" /></Stack>
        )}

        {kind === 'taken' && (
          <Typography sx={{ fontSize: 13.5, color: C.ink, lineHeight: 1.55 }}>
            Tick it off if you took everything prescribed today. If you missed something, say so —
            a gap we know about is worth more than a clean chart we can't trust.
          </Typography>
        )}
      </Box>

      <Button fullWidth variant="contained" color="secondary" disabled={!canSave}
              sx={{ mt: 3 }} onClick={() => onSave(value)}>
        {kind === 'taken' ? 'Took everything' : 'Log it'}
      </Button>
      {kind === 'taken' && (
        <Button fullWidth variant="text" sx={{ mt: 0.5, color: C.ink2, fontSize: 13 }}
                onClick={() => onSave(false)}>
          I missed some
        </Button>
      )}
    </Drawer>
  );
}
