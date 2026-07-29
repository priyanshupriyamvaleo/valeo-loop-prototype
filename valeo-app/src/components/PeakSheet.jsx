import { Box, Button, Drawer, IconButton, Stack, Typography, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { LADDER, LADDER_FIXED, TRAJECTORY } from '../data';
import { C } from '../theme';

/**
 * The ladder, and where it leads.
 *
 * Deliberately a SHAPE and not a rung. "You are level 4 of 7" hides the only
 * useful information — which gap is actually yours. A silhouette against the
 * peak silhouette shows it in one glance, and the biological-age problem
 * (37.3 at one competitor, 45.2 at another on identical blood) is exactly what
 * a single composite number inherits.
 *
 * Trajectory is sourced from the cohort, never from a model. "People like you
 * who ran this got here, and here is the spread" is a comparison. "You will
 * reach X by week 9" is a clinical prediction, and not ours to make.
 */
export default function PeakSheet({ open, onClose }) {
  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: {
          sx: {
            position: 'absolute', borderTopLeftRadius: 26, borderTopRightRadius: 26,
            height: '92%', bgcolor: C.cream, backgroundImage: 'none',
          },
        },
      }}>
      <Stack direction="row" sx={{
        alignItems: 'center', px: 2.25, py: 1.75, flexShrink: 0,
        borderBottom: `1px solid ${C.line}`,
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
            Distance to peak
          </Typography>
          <Typography sx={{ fontSize: 11, color: C.ink2 }}>
            A shape, not a score — the gaps are the point
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: C.ink2 }}>
          <CloseIcon sx={{ fontSize: 19 }} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, py: 2.25 }}>
        {/* the shape */}
        <Box sx={{
          px: 1.9, py: 1.9, borderRadius: '20px', bgcolor: '#fff',
          boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
        }}>
          <Stack spacing={1.6}>
            {LADDER.map((l) => {
              const gap = l.peak - l.you;
              return (
                <Box key={l.sys}>
                  <Stack direction="row" sx={{ alignItems: 'baseline', mb: 0.6 }}>
                    <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: C.deep }}>
                      {l.sys}
                    </Typography>
                    <Typography sx={{
                      fontSize: 11, fontWeight: 800,
                      color: gap > 30 ? C.yellowDeep : gap > 15 ? C.ink2 : C.green,
                    }}>{gap} to go</Typography>
                  </Stack>
                  {/* one bar, two marks: where you are, where peak is */}
                  <Box sx={{ position: 'relative', height: 8 }}>
                    <Box sx={{
                      position: 'absolute', inset: 0, borderRadius: '4px',
                      bgcolor: 'rgba(27,57,91,.07)',
                    }} />
                    <Box sx={{
                      position: 'absolute', top: 0, bottom: 0, left: 0, width: `${l.you}%`,
                      borderRadius: '4px', bgcolor: C.teal,
                    }} />
                    <Box sx={{
                      position: 'absolute', top: -3, left: `${l.peak}%`, ml: '-1px',
                      width: 2, height: 14, borderRadius: 1, bgcolor: C.deep,
                    }} />
                  </Box>
                  <Typography sx={{ fontSize: 10.5, color: C.ink2, mt: 0.5 }}>{l.unit}</Typography>
                </Box>
              );
            })}
          </Stack>
          <Stack direction="row" spacing={2} sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${C.line}` }}>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 12, height: 6, borderRadius: 3, bgcolor: C.teal }} />
              <Typography sx={{ fontSize: 10.5, color: C.ink2 }}>You</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 2, height: 12, borderRadius: 1, bgcolor: C.deep }} />
              <Typography sx={{ fontSize: 10.5, color: C.ink2 }}>Peak for your age</Typography>
            </Stack>
          </Stack>
        </Box>

        {/* trajectory, from the cohort */}
        <Label sx={{ mt: 3 }}>How long, based on people like you</Label>
        <Stack spacing={1}>
          {TRAJECTORY.map((t) => (
            <Box key={t.marker} sx={{
              px: 1.9, py: 1.6, borderRadius: '17px', bgcolor: '#fff',
              boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
            }}>
              <Stack direction="row" sx={{ alignItems: 'baseline' }}>
                <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: C.deep }}>
                  {t.marker} {t.now} → {t.target}
                </Typography>
                <Typography sx={{ fontSize: 14, fontWeight: 800, color: C.yellowDeep }}>
                  ~{t.weeks} wk
                </Typography>
              </Stack>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.5, lineHeight: 1.45 }}>
                {t.basis} · most landed between {t.spread}
              </Typography>
            </Box>
          ))}
        </Stack>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 1.5, lineHeight: 1.55 }}>
          These are ranges from people who started where you did, not predictions about you.
          Nobody can promise you a number.
        </Typography>

        {/* the ceiling — honest, and oddly freeing */}
        <Label sx={{ mt: 3 }}>What will not move</Label>
        <Box sx={{
          borderRadius: '18px', bgcolor: 'rgba(27,57,91,.03)', overflow: 'hidden',
          border: '1px solid rgba(27,57,91,.09)',
        }}>
          {LADDER_FIXED.map((f, i) => (
            <Box key={f}>
              {i > 0 && <Divider />}
              <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', px: 1.75, py: 1.3 }}>
                <LockOutlinedIcon sx={{ fontSize: 15, color: C.ink2, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12.5, color: C.ink2 }}>{f}</Typography>
              </Stack>
            </Box>
          ))}
        </Box>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 1.5, lineHeight: 1.55 }}>
          Everything above this list is modifiable. Everything in it is not — which means it is not
          worth your attention.
        </Typography>
      </Box>

      <Box sx={{ px: 2.25, pt: 1.5, pb: 3, flexShrink: 0, borderTop: `1px solid ${C.line}` }}>
        <Button fullWidth variant="contained" color="primary" onClick={onClose}>Done</Button>
      </Box>
    </Drawer>
  );
}

function Label({ children, sx }) {
  return (
    <Typography sx={{
      fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
      color: C.ink2, mb: 1.25, ...sx,
    }}>{children}</Typography>
  );
}
