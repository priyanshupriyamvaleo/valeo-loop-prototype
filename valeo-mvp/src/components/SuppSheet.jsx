import { useState } from 'react';
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { suppOf } from '../data';
import { C, meter } from '../theme';

/**
 * Buying one supplement, without a consult.
 *
 * The whole point of the step card is that the gain and the thing that delivers
 * it are one tap apart. A CTA that opens a page about the idea breaks that; this
 * closes it — name, dose, price, confirm.
 *
 * No consult here on purpose, and the distinction matters: over-the-counter goes
 * straight to checkout, anything prescription-grade or peptide routes to a
 * protocol so a prescriber sees it first. Putting a doctor in front of magnesium
 * would be theatre, and skipping one in front of a peptide would be worse.
 *
 * The caveat is never hidden behind the price. Iron that you take with coffee
 * does nothing, and a store that only tells you after checkout is a store.
 */
export default function SuppSheet({ open, onClose, suppKey, step, region, onBought }) {
  const [done, setDone] = useState(false);
  const sp = suppKey ? suppOf(suppKey) : null;

  const close = () => { setDone(false); onClose(); };
  const buy = () => { setDone(true); onBought(); };

  return (
    <Drawer anchor="bottom" open={open} onClose={close}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: {
          sx: {
            position: 'absolute', borderRadius: '22px 22px 0 0', maxHeight: '88%',
            bgcolor: C.paper, backgroundImage: 'none',
          },
        },
      }}>
      {!sp ? null : done ? (
        /* ── bought ── */
        <Box sx={{ px: 2.25, pt: 3.5, pb: 3.5, textAlign: 'center' }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '50%', mx: 'auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'rgba(39,153,91,.14)',
          }}><CheckIcon sx={{ fontSize: 26, color: C.green }} /></Box>

          <Typography sx={{ fontSize: 19, fontWeight: 700, color: C.deep, mt: 1.75 }}>
            {sp.t} is on the way
          </Typography>
          <Typography sx={{ fontSize: 13, color: C.ink2, mt: 0.75, lineHeight: 1.55 }}>
            {sp.d}. Arrives Thursday.
          </Typography>

          {step && (
            <Box sx={{
              mt: 2.5, px: 1.9, py: 1.6, borderRadius: '16px', textAlign: 'left',
              bgcolor: 'rgba(39,153,91,.07)', border: '1px solid rgba(39,153,91,.22)',
            }}>
              <Typography sx={{ fontSize: 12.5, color: C.ink, lineHeight: 1.55 }}>
                Step marked done. Your twin is holding{' '}
                <b style={{ color: C.green }}>+{step.pct}</b> against{' '}
                {region ? region.toLowerCase() : 'this region'} until a retest
                confirms it.
              </Typography>
            </Box>
          )}

          <Button fullWidth variant="contained" color="secondary" sx={{ mt: 2.5 }}
                  onClick={close}>
            Back to my twin
          </Button>
        </Box>
      ) : (
        <>
          <Stack direction="row" spacing={1.5} sx={{
            alignItems: 'flex-start', px: 2.25, pt: 2, pb: 1.5, flexShrink: 0,
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{
                fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
                textTransform: 'uppercase', color: C.ink2,
              }}>Supplement · no consult needed</Typography>
              <Typography sx={{ fontSize: 19, fontWeight: 700, color: C.deep, mt: 0.3 }}>
                {sp.t}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 0.3 }}>{sp.d}</Typography>
            </Box>
            <IconButton onClick={close} size="small" sx={{ color: C.ink2, mt: -0.5, mr: -0.75 }}>
              <CloseIcon sx={{ fontSize: 19 }} />
            </IconButton>
          </Stack>

          <Box sx={{ overflowY: 'auto', px: 2.25, pb: 1 }}>
            {/* what it buys, in the same units as the card that sent you here */}
            {step && (
              <Stack direction="row" spacing={1.25} sx={{
                alignItems: 'center', px: 1.75, py: 1.5, borderRadius: '16px',
                bgcolor: '#fff', boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
              }}>
                <Typography sx={{
                  fontFamily: meter, fontSize: 26, fontWeight: 700, color: C.green,
                  lineHeight: 1,
                }}>+{step.pct}</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep }}>
                    {step.t}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.15 }}>
                    on your {region ? region.toLowerCase() : 'twin'} score
                  </Typography>
                </Box>
              </Stack>
            )}

            <Label>Why this one</Label>
            <Box sx={{
              px: 1.75, py: 1.5, borderRadius: '16px', bgcolor: '#fff',
              boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
            }}>
              <Typography sx={{ fontSize: 13, lineHeight: 1.55, color: C.ink }}>
                {sp.why}
              </Typography>
            </Box>

            <Label>Worth knowing</Label>
            <Box sx={{
              px: 1.75, py: 1.5, borderRadius: '16px',
              bgcolor: 'rgba(255,185,0,.10)', border: '1px solid rgba(255,185,0,.4)',
            }}>
              <Typography sx={{ fontSize: 13, lineHeight: 1.55, color: C.ink }}>
                {sp.note}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 2, mb: 1 }}>
              <LocalShippingOutlinedIcon sx={{ fontSize: 16, color: C.ink2 }} />
              <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
                One month, delivered. Cancel any time.
              </Typography>
            </Stack>
          </Box>

          <Box sx={{ px: 2.25, pt: 1.5, pb: 3, flexShrink: 0, borderTop: `1px solid ${C.line}` }}>
            <Button fullWidth variant="contained" color="secondary" onClick={buy}>
              Add to my stack · SAR {sp.price}
            </Button>
          </Box>
        </>
      )}
    </Drawer>
  );
}

function Label({ children }) {
  return (
    <Typography sx={{
      fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
      color: C.ink2, mt: 2.5, mb: 1.25,
    }}>{children}</Typography>
  );
}
