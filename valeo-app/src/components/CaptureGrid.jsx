import { Box, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { C } from '../theme';

/**
 * The four captures, as tiles with visible state.
 *
 * This replaces a single passive "today's log" card. One card asks for one
 * thing and hides the rest; four tiles show the whole day's ask at a glance,
 * including what a paired device has already taken care of.
 */
export default function CaptureGrid({ items, onOpen }) {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.1 }}>
      {items.map((c) => {
        const state = c.auto ? 'auto' : c.done ? 'done' : c.due ? 'due' : 'off';
        const clickable = state === 'due' || state === 'done';
        return (
          <Box key={c.k} onClick={clickable ? () => onOpen(c.k) : undefined} sx={{
            p: 1.6, borderRadius: '18px', cursor: clickable ? 'pointer' : 'default',
            bgcolor: state === 'done' ? 'rgba(39,153,91,.08)'
              : state === 'auto' ? 'rgba(64,143,164,.09)'
              : state === 'off' ? 'rgba(27,57,91,.03)' : '#fff',
            border: `1.5px solid ${
              state === 'done' ? 'rgba(39,153,91,.35)'
              : state === 'auto' ? 'rgba(64,143,164,.3)'
              : state === 'due' ? 'rgba(255,185,0,.5)' : 'transparent'}`,
            boxShadow: state === 'due' ? '0 2px 12px -6px rgba(27,57,91,.3)' : 'none',
            opacity: state === 'off' ? 0.5 : 1,
          }}>
            <Stack direction="row" sx={{ alignItems: 'center' }}>
              <Box sx={{ fontSize: 17, flex: 1 }}>{c.ic}</Box>
              {state === 'done' && (
                <Box sx={{
                  width: 19, height: 19, borderRadius: '50%', bgcolor: C.green,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}><CheckIcon sx={{ fontSize: 12, color: '#fff' }} /></Box>
              )}
              {state === 'due' && (
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: C.yellow }} />
              )}
            </Stack>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep, mt: 1 }}>
              {c.t}
            </Typography>
            <Typography sx={{
              fontSize: 10.5, fontWeight: 600, mt: 0.25,
              color: state === 'done' ? C.green
                : state === 'auto' ? C.teal
                : state === 'due' ? C.yellowDeep : C.ink2,
            }}>
              {c.note}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
