import { Box, Stack, Typography, Slide } from '@mui/material';
import { DOCTOR } from '../data';
import { C } from '../theme';

/**
 * The iOS-style banner. It exists because the doctor's review finishing is a
 * real event that happens while the person is elsewhere — and a status that
 * changes silently is a status nobody sees.
 */
export default function PushToast({ push, onOpen, onDismiss }) {
  return (
    <Slide direction="down" in={!!push} mountOnEnter unmountOnExit>
      <Box sx={{
        position: 'absolute', top: 12, left: 10, right: 10, zIndex: 1400, cursor: 'pointer',
      }} onClick={onOpen}>
        <Stack direction="row" spacing={1.5} sx={{
          alignItems: 'center', px: 1.75, py: 1.6, borderRadius: '20px',
          bgcolor: 'rgba(250,250,248,.92)', backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 12px 34px -10px rgba(0,0,0,.45)',
        }}>
          <Box component="img" src={DOCTOR.img} alt="" sx={{
            width: 38, height: 38, borderRadius: '11px', objectFit: 'cover', flexShrink: 0,
          }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Stack direction="row" sx={{ alignItems: 'baseline' }}>
              <Typography sx={{
                flex: 1, fontSize: 13.5, fontWeight: 700, color: '#111',
              }}>{push?.t}</Typography>
              <Typography sx={{ fontSize: 11, color: 'rgba(0,0,0,.4)', flexShrink: 0 }}>
                now
              </Typography>
            </Stack>
            <Typography sx={{
              fontSize: 12.5, color: 'rgba(0,0,0,.62)', mt: 0.2, lineHeight: 1.35,
            }}>{push?.s}</Typography>
          </Box>
        </Stack>
        {/* Inside the banner, not under it. Floated below, "Dismiss" landed on
            whatever card happened to be behind the toast and read as broken
            layout — and white-on-unknown is not a contrast you can promise. */}
        <Box onClick={(e) => { e.stopPropagation(); onDismiss(); }} sx={{
          position: 'absolute', right: 14, bottom: -6,
          px: 1.1, py: 0.45, borderRadius: '999px',
          fontSize: 10, fontWeight: 800, letterSpacing: '.08em',
          textTransform: 'uppercase', color: 'rgba(0,0,0,.5)',
          bgcolor: 'rgba(250,250,248,.96)',
          boxShadow: '0 6px 16px -6px rgba(0,0,0,.4)',
        }}>Dismiss</Box>
      </Box>
    </Slide>
  );
}
