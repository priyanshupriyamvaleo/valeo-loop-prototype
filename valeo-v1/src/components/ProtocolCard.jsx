import { Box, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { homeCard } from '../data';
import { C, meter } from '../theme';

/**
 * THE MODULE'S ENTIRE PRESENCE ON A HOME SCREEN IT DOES NOT OWN.
 *
 * Valeo's nav already has five items and is not getting three more, so protocols
 * hang off one card. That makes this the highest-leverage surface in the product:
 * it is the only thing a user who is not currently thinking about protocols will
 * see, which means it has to answer "what does this want from me right now" in
 * one glance, in nine different lifecycle states.
 *
 * So the card is not a banner that changes copy — it changes SHAPE. A run in
 * flight earns a progress bar and a marker delta; a verdict waiting to be read
 * earns neither, because the only thing it needs is to be opened. Giving every
 * state the same furniture would mean the important ones look like the routine
 * ones.
 *
 * One rule held throughout: the card never shows a number without the thing that
 * makes it mean something. A weight on its own is a fact. `78.4 → 73.6` is
 * progress.
 */
export default function ProtocolCard({ st, onGo, phase = 1 }) {
  const c = homeCard(st, phase);
  const tone = c.tone === 'green' ? C.green : c.tone === 'teal' ? C.teal : C.yellow;
  /* The intro state is the only one that has to sell, so it is the only one that
     gets the dark treatment. Everything after it is status, and status on a host
     home screen should sit quietly inside the host's own visual language. */
  const selling = c.kind === 'intro';

  return (
    <Box onClick={() => onGo(c.go, c.pKey)} sx={{
      borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
      bgcolor: selling ? C.deep : '#fff',
      color: selling ? '#fff' : C.ink,
      border: selling ? 'none' : `1px solid rgba(27,57,91,.09)`,
      boxShadow: selling
        ? '0 14px 32px -16px rgba(27,57,91,.7)'
        : '0 3px 16px -10px rgba(27,57,91,.4)',
    }}>
      <Box sx={{ px: 2, pt: 1.9, pb: 1.75 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography sx={{
            flex: 1, minWidth: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: selling ? C.yellow : tone === C.yellow ? C.yellowDeep : tone,
          }}>{c.tag}</Typography>
          {c.more && (
            <Typography sx={{
              fontSize: 9.5, fontWeight: 700, color: C.ink2, whiteSpace: 'nowrap',
              px: 0.7, py: 0.25, borderRadius: '5px', bgcolor: 'rgba(27,57,91,.06)',
            }}>{c.more}</Typography>
          )}
        </Stack>

        <Typography sx={{
          fontSize: selling ? 21 : 19, fontWeight: 700, mt: 0.55, lineHeight: 1.2,
          fontFamily: selling ? '"Fraunces", serif' : undefined,
          color: selling ? '#fff' : C.deep,
        }}>{c.title}</Typography>

        <Typography sx={{
          fontSize: 12.5, mt: 0.5, lineHeight: 1.5,
          color: selling ? 'rgba(255,255,255,.72)' : C.ink2,
        }}>{c.sub}</Typography>

        {/* only a run in flight has a distance to show */}
        {c.progress != null && (
          <Box sx={{
            mt: 1.6, height: 7, borderRadius: 4, bgcolor: 'rgba(27,57,91,.09)',
            overflow: 'hidden',
          }}>
            <Box sx={{
              width: `${Math.round(c.progress * 100)}%`, height: '100%',
              borderRadius: 4, bgcolor: C.yellow,
            }} />
          </Box>
        )}

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1.6 }}>
          <Stack direction="row" spacing={0.75} sx={{
            alignItems: 'center', px: 1.7, py: 1.05, borderRadius: '12px',
            bgcolor: selling ? C.yellow : tone === C.yellow ? C.yellow : 'rgba(27,57,91,.06)',
            transition: 'transform .12s',
            '&:active': { transform: 'scale(.98)' },
          }}>
            <Typography sx={{
              fontSize: 13, fontWeight: 700,
              color: tone === C.yellow || selling ? C.deep : C.deep,
            }}>{c.cta}</Typography>
            <ArrowForwardIcon sx={{ fontSize: 15, color: C.deep }} />
          </Stack>

          <Box sx={{ flex: 1 }} />

          {/* the one number that says the run is working */}
          {c.delta && (
            <Typography sx={{
              fontFamily: meter, fontSize: 13, fontWeight: 700, color: C.deep,
              whiteSpace: 'nowrap',
            }}>{c.delta}</Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
