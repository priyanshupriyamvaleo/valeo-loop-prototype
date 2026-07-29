import { useState } from 'react';
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import TwinGlyph from './TwinGlyph';
import { TWIN_CHAT, DOCTOR } from '../data';
import { C } from '../theme';

/**
 * You ask the twin, not a generic coach — it's the thing that holds your
 * protocol, your logs and your panel, so it's the thing that can answer.
 *
 * Escalation is offered, never automatic. An assistant that decides on your
 * behalf to involve a prescriber is making a medical decision; one that says
 * "this is where I stop, send it if you want" is not.
 */
export default function TwinChat({ open, onClose }) {
  const [sent, setSent] = useState(false);

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: {
          sx: {
            position: 'absolute', borderTopLeftRadius: 26, borderTopRightRadius: 26,
            maxHeight: '88%', bgcolor: C.cream, backgroundImage: 'none',
          },
        },
      }}>
      <Stack direction="row" spacing={1.5} sx={{
        alignItems: 'center', px: 2.25, py: 1.75, flexShrink: 0,
        borderBottom: `1px solid ${C.line}`,
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(150deg,${C.deep},#12283F)`,
        }}>
          <TwinGlyph size={40} fill={0.7} loops={0} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
            Your twin
          </Typography>
          <Typography sx={{ fontSize: 11, color: C.ink2 }}>
            Knows your protocol, logs and last panel
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: C.ink2 }}>
          <CloseIcon sx={{ fontSize: 19 }} />
        </IconButton>
      </Stack>

      <Box sx={{ overflowY: 'auto', px: 2.25, py: 2.25 }}>
        <Stack spacing={1.1}>
          {TWIN_CHAT.map((m, i) => (
            <Box key={i}>
              <Box sx={{ display: 'flex', justifyContent: m.me ? 'flex-end' : 'flex-start' }}>
                <Box sx={{
                  maxWidth: '86%', px: 1.9, py: 1.4, borderRadius: '16px',
                  borderBottomRightRadius: m.me ? '5px' : '16px',
                  borderBottomLeftRadius: m.me ? '16px' : '5px',
                  bgcolor: m.me ? 'rgba(27,57,91,.07)' : '#fff',
                  color: C.ink,
                  boxShadow: m.me ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
                }}>
                  <Typography sx={{ fontSize: 13, lineHeight: 1.5 }}>{m.t}</Typography>
                </Box>
              </Box>

              {/* where the twin's authority ends — the user decides */}
              {m.offer && !sent && (
                <Stack direction="row" spacing={1.5} onClick={() => setSent(true)} sx={{
                  alignItems: 'center', mt: 1.25, px: 1.9, py: 1.6, borderRadius: '17px',
                  cursor: 'pointer',
                  bgcolor: 'rgba(64,143,164,.10)', border: `1.5px solid rgba(64,143,164,.4)`,
                }}>
                  <Box component="img" src={DOCTOR.img} alt="" sx={{
                    width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
                  }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep }}>
                      Send this to {DOCTOR.name.split(' ')[1]}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.15 }}>
                      With your dose, logs and adherence
                    </Typography>
                  </Box>
                  <ArrowUpwardIcon sx={{ fontSize: 17, color: C.teal, flexShrink: 0 }} />
                </Stack>
              )}

              {m.offer && sent && (
                <Stack direction="row" spacing={1.5} sx={{
                  alignItems: 'center', mt: 1.25, px: 1.9, py: 1.6, borderRadius: '17px',
                  bgcolor: 'rgba(39,153,91,.09)', border: `1.5px solid rgba(39,153,91,.35)`,
                }}>
                  <Box component="img" src={DOCTOR.img} alt="" sx={{
                    width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
                  }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.green }}>
                      Sent · he replies today
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.15 }}>
                      12 days of logs went with it
                    </Typography>
                  </Box>
                </Stack>
              )}
            </Box>
          ))}
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
