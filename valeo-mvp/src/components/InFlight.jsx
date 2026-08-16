import { Box, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DeltaBar from './DeltaBar';
import { C } from '../theme';

/**
 * WHAT YOUR PROTOCOLS ARE MOVING
 *
 * The causal layer of the twin. The body answers "where", Peak answers "how
 * far", and this answers "what is acting on it, and what has that bought me".
 * Without it a protocol is a receipt and the twin is a poster — which is the
 * failure mode of every competitor screen we looked at.
 *
 * A horizontal rail, not a list, for one reason: protocol count grows and
 * vertical space does not. The next card is deliberately left peeking so the
 * rail reads as scrollable without a hint label.
 *
 * Each card is a claim with its own evidence. Running protocols show what a
 * panel confirmed; saved ones show only a forecast and are drawn as forecast.
 * The footer is always the same sentence shape — marker, weeks, retest —
 * because that promise is the product.
 */
export default function InFlight({ flights, region, onOpen, onFind }) {
  /* Nothing acting on this region is not an empty state — it is the sell, and
     the most honest one on the screen. */
  if (!flights.length) {
    return (
      <Box onClick={onFind} sx={{
        borderRadius: '16px', px: 1.75, py: 1.6, cursor: 'pointer',
        border: `1.5px dashed rgba(27,57,91,.2)`,
      }}>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep }}>
          {region ? `Nothing is working on your ${region.toLowerCase()} yet` : 'No protocol running'}
        </Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.3 }}>
          <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>Find one that does</Typography>
          <ChevronRightIcon sx={{ fontSize: 15, color: C.ink2 }} />
        </Stack>
      </Box>
    );
  }

  return (
    <Stack direction="row" spacing={1.25} sx={{
      overflowX: 'auto', mx: -2.25, px: 2.25, pb: 0.5,
      scrollSnapType: 'x mandatory',
      '&::-webkit-scrollbar': { display: 'none' },
    }}>
      {flights.map((f) => (
        <Box key={f.k} onClick={() => onOpen(f.k)} sx={{
          flex: '0 0 auto', width: '81%', scrollSnapAlign: 'start', cursor: 'pointer',
          borderRadius: '18px', bgcolor: '#fff', px: 1.6, py: 1.5,
          border: `1px solid ${f.live ? 'rgba(39,153,91,.3)' : 'rgba(27,57,91,.09)'}`,
          boxShadow: f.live ? '0 3px 14px -8px rgba(27,57,91,.4)' : 'none',
        }}>
          {/* ── status ── */}
          <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              bgcolor: f.live ? C.green : 'rgba(27,57,91,.28)',
            }} />
            <Typography sx={{
              flex: 1, minWidth: 0, fontSize: 8.5, fontWeight: 800, letterSpacing: '.12em',
              textTransform: 'uppercase', color: f.live ? C.green : C.ink2,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {f.live ? `Running · week ${f.week} of ${f.wk}` : `Saved · ${f.wk} weeks`}
            </Typography>
            {f.live && f.delivered > 0 && (
              <Typography sx={{ fontSize: 10.5, fontWeight: 800, color: C.green }}>
                {f.delivered}% delivered
              </Typography>
            )}
          </Stack>

          <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.deep, mt: 0.35 }}>
            {f.t}
          </Typography>

          {/* Which part of the body this is aimed at. A marker name tells you
              nothing about where you'd feel it; a region places the protocol on
              the same figure the rest of the screen is built around. */}
          <Stack direction="row" useFlexGap spacing={0.5} sx={{ flexWrap: 'wrap', mt: 0.6, mb: 1.2 }}>
            {f.regions.map((rt) => (
              <Typography key={rt} sx={{
                fontSize: 9, fontWeight: 800, letterSpacing: '.07em', textTransform: 'uppercase',
                color: C.teal, px: 0.75, py: 0.3, borderRadius: '6px',
                bgcolor: 'rgba(64,143,164,.11)',
              }}>{rt}</Typography>
            ))}
          </Stack>

          {/* ── the subsystems it is attacking, and what it has delivered ── */}
          <Stack spacing={1.3}>
            {f.hits.map((h) => (
              <Box key={h.sys}>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'baseline', mb: 0.35 }}>
                  <Typography sx={{
                    flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 600, color: C.deep,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{h.t}</Typography>
                  {h.got > 0 ? (
                    <Typography sx={{ fontSize: 11, fontWeight: 800, color: C.green }}>
                      +{h.got} landed
                    </Typography>
                  ) : (
                    <Typography sx={{ fontSize: 10.5, color: C.ink2 }}>
                      +{h.exp - h.base} expected
                    </Typography>
                  )}
                </Stack>

                <DeltaBar was={h.was} now={h.now} exp={h.exp} peak={h.peak} soft={h.reported} />

                {/* Base and target, at subsystem level. The delta above says how
                    much moved; these two say where it started and where this
                    protocol is aiming — which is the pair a user needs to judge
                    whether the thing is on track. */}
                <Stack direction="row" spacing={0.6} sx={{ alignItems: 'baseline', mt: 0.4 }}>
                  <Typography sx={{ fontSize: 9.5, color: C.ink2 }}>base</Typography>
                  <Typography sx={{
                    fontSize: 10.5, fontWeight: 700, color: C.ink2,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{h.base}</Typography>
                  <Typography sx={{ fontSize: 9.5, color: C.ink2 }}>→ target</Typography>
                  <Typography sx={{
                    fontSize: 10.5, fontWeight: 800, color: C.deep,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{h.exp}</Typography>
                  <Box sx={{ flex: 1 }} />
                  {h.owed > 0 && (
                    <Typography sx={{ fontSize: 9.5, color: C.ink2 }}>{h.owed} to go</Typography>
                  )}
                </Stack>
              </Box>
            ))}
          </Stack>

          {/* ── the promise, in the same shape every time ── */}
          <Typography sx={{
            fontSize: 10.5, color: C.ink2, mt: 1.2, pt: 1, lineHeight: 1.45,
            borderTop: `1px solid ${C.line}`,
          }}>
            {f.live
              ? <>Retests <b style={{ color: C.deep }}>{f.mk}</b> in {f.left} weeks</>
              : <>Would be scored on <b style={{ color: C.deep }}>{f.mk}</b></>}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
