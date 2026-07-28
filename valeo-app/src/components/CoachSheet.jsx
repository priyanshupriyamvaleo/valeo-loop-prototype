import { Box, Drawer, IconButton, Stack, Typography, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { COACH, DOCTOR } from '../data';
import { C } from '../theme';

/**
 * The coach answers what it can and escalates what it can't. The escalation
 * is the point: an AI that guesses at a dose change is a liability, one that
 * hands a prescriber the logs is a feature.
 */
export default function CoachSheet({ open, onClose }) {
  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: {
          sx: {
            position: 'absolute', borderTopLeftRadius: 26, borderTopRightRadius: 26,
            maxHeight: '86%', bgcolor: C.cream, backgroundImage: 'none',
          },
        },
      }}>
      <Stack direction="row" sx={{
        alignItems: 'center', px: 2.25, py: 2, flexShrink: 0,
        borderBottom: `1px solid ${C.line}`,
      }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '50%', bgcolor: C.deep, color: C.yellow,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, flexShrink: 0, mr: 1.5,
        }}>◎</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
            Health coach
          </Typography>
          <Typography sx={{ fontSize: 11, color: C.ink2 }}>Answers now · escalates when it matters</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: C.ink2 }}>
          <CloseIcon sx={{ fontSize: 19 }} />
        </IconButton>
      </Stack>

      <Box sx={{ overflowY: 'auto', px: 2.25, py: 2.25 }}>
        <Stack spacing={1.25}>
          {COACH.map((m, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: m.me ? 'flex-end' : 'flex-start' }}>
              <Box sx={{
                maxWidth: '84%', px: 1.9, py: 1.4, borderRadius: '16px',
                borderBottomRightRadius: m.me ? '5px' : '16px',
                borderBottomLeftRadius: m.me ? '16px' : '5px',
                bgcolor: m.esc ? C.deep : m.me ? 'rgba(27,57,91,.07)' : '#fff',
                color: m.esc ? '#fff' : C.ink,
                boxShadow: m.me ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
              }}>
                <Typography sx={{ fontSize: 13, lineHeight: 1.5 }}>{m.t}</Typography>
              </Box>
            </Box>
          ))}
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{
          alignItems: 'center', mt: 2.25, p: 1.9, borderRadius: '17px',
          bgcolor: 'rgba(64,143,164,.10)', border: '1px solid rgba(64,143,164,.3)',
        }}>
          <Box component="img" src={DOCTOR.img} alt="" sx={{
            width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
          }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.deep }}>
              Sent to {DOCTOR.name}
            </Typography>
            <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.2 }}>
              With your dose, logs and adherence · replies today
            </Typography>
          </Box>
          <ArrowUpwardIcon sx={{ fontSize: 17, color: C.teal, flexShrink: 0 }} />
        </Stack>
      </Box>

      <Box sx={{ px: 2.25, pt: 1.5, pb: 3, flexShrink: 0, borderTop: `1px solid ${C.line}` }}>
        <Button fullWidth variant="contained" color="primary" onClick={onClose}>
          Got it
        </Button>
      </Box>
    </Drawer>
  );
}
