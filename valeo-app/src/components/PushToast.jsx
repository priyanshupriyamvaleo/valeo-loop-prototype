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
        <Box onClick={(e) => { e.stopPropagation(); onDismiss(); }} sx={{
          textAlign: 'center', mt: 0.75, fontSize: 10.5, fontWeight: 700,
          color: 'rgba(255,255,255,.45)', letterSpacing: '.06em',
        }}>Dismiss</Box>
      </Box>
    </Slide>
  );
}
