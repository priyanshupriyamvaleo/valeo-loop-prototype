import { useState } from 'react';
import { Box, Button, Drawer, IconButton, Stack, Typography, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { PEERS, COHORT, GRADE_C } from '../data';
import { C } from '../theme';

/**
 * Closest twins.
 *
 * This is the layer that makes Discover explainable — a match score stops
 * being a magic number once you can see which systems it was computed from.
 *
 * Two deliberate choices. Similarity is stated as "systems apart" rather than
 * a percentage, because a percentage implies precision this matching does not
 * have. And the DIVERGENCE is given as much room as the similarity, because the
 * gap is the useful part: it is what a protocol is designed to close.
 */
export default function PeersSheet({ open, onClose }) {
  const [sel, setSel] = useState(null);
  const peer = PEERS.find((p) => p.id === sel);
  const close = () => { setSel(null); onClose(); };

  return (
    <Drawer anchor="bottom" open={open} onClose={close}
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
      <Stack direction="row" spacing={1.25} sx={{
        alignItems: 'center', px: 2.25, py: 1.75, flexShrink: 0,
        borderBottom: `1px solid ${C.line}`,
      }}>
        {peer && (
          <IconButton onClick={() => setSel(null)} size="small" sx={{ ml: -0.75, color: C.deep }}>
            <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
            {peer ? peer.name : 'Closest twins'}
          </Typography>
          <Typography sx={{ fontSize: 11, color: C.ink2 }}>
            {peer ? `${peer.apart} systems apart` : 'Matched on measured biology, not a questionnaire'}
          </Typography>
        </Box>
        <IconButton onClick={close} size="small" sx={{ color: C.ink2 }}>
          <CloseIcon sx={{ fontSize: 19 }} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, py: 2.25 }}>
        {!peer && (
          <>
            <Stack spacing={1}>
              {PEERS.map((p) => (
                <Stack key={p.id} direction="row" spacing={1.5} onClick={() => setSel(p.id)} sx={{
                  alignItems: 'center', px: 1.75, py: 1.6, borderRadius: '17px', cursor: 'pointer',
                  bgcolor: '#fff', boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
                }}>
                  <Box sx={{
                    width: 46, height: 46, borderRadius: '14px', flexShrink: 0, overflow: 'hidden',
                    bgcolor: p.tone || C.deep, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 14, fontWeight: 800,
                    color: 'rgba(255,255,255,.85)',
                  }}>
                    {p.img
                      ? <Box component="img" src={p.img} alt=""
                             sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : p.mono}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>
                      {p.name}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>{p.role}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography sx={{ fontSize: 18, fontWeight: 800, color: C.deep, lineHeight: 1 }}>
                      {p.apart}
                    </Typography>
                    <Typography sx={{
                      fontSize: 7.5, fontWeight: 800, letterSpacing: '.12em',
                      textTransform: 'uppercase', color: C.ink2, mt: 0.4,
                    }}>apart</Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>

            {/* the corpus — a distribution, never a promise */}
            <Label sx={{ mt: 3 }}>Others who started where you are</Label>
            <Box sx={{
              px: 1.9, py: 1.9, borderRadius: '20px', bgcolor: '#fff',
              boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
            }}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline', mb: 1.75 }}>
                <Typography sx={{ fontSize: 26, fontWeight: 800, color: C.deep, lineHeight: 1 }}>
                  {COHORT.startedLike}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: C.ink2 }}>
                  of {COHORT.n.toLocaleString()} twins
                </Typography>
              </Stack>
              <Stack spacing={1}>
                {COHORT.after12.map((b, i) => (
                  <Box key={b.band}>
                    <Stack direction="row" sx={{ alignItems: 'baseline', mb: 0.5 }}>
                      <Typography sx={{ flex: 1, fontSize: 12, color: C.ink }}>{b.band}</Typography>
                      <Typography sx={{ fontSize: 12, fontWeight: 800, color: C.deep }}>
                        {b.pct}%
                      </Typography>
                    </Stack>
                    <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(27,57,91,.07)' }}>
                      <Box sx={{
                        width: `${b.pct * 2}%`, maxWidth: '100%', height: '100%', borderRadius: 3,
                        bgcolor: i === 3 ? C.coral : i === 2 ? C.ink2 : C.green,
                      }} />
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 1.75, lineHeight: 1.55 }}>
                {COHORT.note}
              </Typography>
            </Box>
          </>
        )}

        {peer && (
          <>
            <Box sx={{
              px: 1.9, py: 1.75, borderRadius: '18px', mb: 2.5,
              bgcolor: 'rgba(64,143,164,.09)', border: '1px solid rgba(64,143,164,.28)',
            }}>
              <Typography sx={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>{peer.why}</Typography>
            </Box>

            <Label>System by system</Label>
            <Box sx={{
              borderRadius: '18px', bgcolor: '#fff', overflow: 'hidden',
              boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
            }}>
              <Stack direction="row" sx={{
                px: 1.75, py: 1.1, bgcolor: 'rgba(27,57,91,.04)',
              }}>
                <Typography sx={{ flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '.12em',
                                  textTransform: 'uppercase', color: C.ink2 }}>System</Typography>
                <Typography sx={{ width: 44, textAlign: 'center', fontSize: 9, fontWeight: 800,
                                  letterSpacing: '.12em', textTransform: 'uppercase',
                                  color: C.deep }}>You</Typography>
                <Typography sx={{ width: 44, textAlign: 'center', fontSize: 9, fontWeight: 800,
                                  letterSpacing: '.12em', textTransform: 'uppercase',
                                  color: C.ink2 }}>Them</Typography>
              </Stack>
              {peer.rows.map((r, i) => (
                <Box key={r.sys}>
                  {i > 0 && <Divider />}
                  <Stack direction="row" sx={{ alignItems: 'center', px: 1.75, py: 1.35 }}>
                    <Typography sx={{ flex: 1, fontSize: 13, color: C.ink }}>{r.sys}</Typography>
                    <Box sx={{ width: 44, display: 'flex', justifyContent: 'center' }}>
                      <Chip g={r.you} />
                    </Box>
                    <Box sx={{ width: 44, display: 'flex', justifyContent: 'center' }}>
                      <Chip g={r.them} dim={r.them === r.you} />
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Box>

            {/* the divergence gets equal billing — it is the useful half */}
            <Label sx={{ mt: 3 }}>Where you diverge</Label>
            <Box sx={{
              px: 1.9, py: 1.75, borderRadius: '18px',
              bgcolor: 'rgba(255,185,0,.10)', border: `1px solid rgba(255,185,0,.4)`,
            }}>
              <Typography sx={{ fontSize: 13, color: C.ink, lineHeight: 1.55 }}>
                {peer.diverge}
              </Typography>
            </Box>

            <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2.5, lineHeight: 1.55 }}>
              Matching runs on measured systems only. The closer this gets, the more your deck
              re-orders — and your closest twin changes as you do.
            </Typography>
          </>
        )}
      </Box>

      <Box sx={{ px: 2.25, pt: 1.5, pb: 3, flexShrink: 0, borderTop: `1px solid ${C.line}` }}>
        <Button fullWidth variant="contained" color="primary" onClick={close}>Done</Button>
      </Box>
    </Drawer>
  );
}

function Chip({ g, dim }) {
  return (
    <Box sx={{
      width: 24, height: 24, borderRadius: '7px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: dim ? 'rgba(27,57,91,.10)' : GRADE_C[g],
      color: dim ? C.ink2 : '#fff', fontSize: 12, fontWeight: 800,
    }}>{g}</Box>
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
