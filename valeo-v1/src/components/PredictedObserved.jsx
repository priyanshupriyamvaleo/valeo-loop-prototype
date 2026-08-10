import { Box, Stack, Typography } from '@mui/material';
import { deliveryFor } from '../data';
import { C, meter } from '../theme';

/**
 * PREDICTED vs OBSERVED — the claim, checked.
 *
 * This is the only scoreboard the product has that a competitor cannot copy,
 * because using it requires having promised a number first. Everyone can show you
 * a chart of what happened. Almost nobody will put last quarter's promise beside
 * it and let you do the subtraction.
 *
 * So it leads the results, and it is built to be read in one glance and survive a
 * second look:
 *
 *   · one headline share, banded, with the raw points behind it
 *   · per subsystem, the prediction as a hollow track and the outcome as a fill
 *     inside it — so under-delivery is a visibly unfilled bar, not a number you
 *     have to compare against another number
 *   · the shortfall named in points, because "72%" hides that Heart is the one
 *     that missed and by how much
 *
 * Bands are 80 / 40 rather than a gradient: a protocol either broadly did what it
 * said, partly did, or didn't, and a smooth ramp would let everything read as
 * nearly fine.
 */
export default function PredictedObserved({ st, pKey }) {
  const d = deliveryFor(st, pKey);
  if (!d.rows.length) return null;

  const tone = C[d.band];

  return (
    <Box>
      {/* ── the headline ── */}
      <Box sx={{
        px: 2, py: 1.9, borderRadius: '20px', bgcolor: '#fff',
        border: `1px solid ${tone}33`,
        boxShadow: '0 3px 16px -10px rgba(27,57,91,.45)',
      }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-end' }}>
          <Stack direction="row" spacing={0.3} sx={{ alignItems: 'baseline' }}>
            <Typography sx={{
              fontFamily: meter, fontSize: 44, fontWeight: 700, lineHeight: 0.85,
              color: tone, letterSpacing: '-.02em',
            }}>{d.share}</Typography>
            <Typography sx={{
              fontFamily: meter, fontSize: 17, fontWeight: 600, color: tone,
            }}>%</Typography>
          </Stack>
          <Typography sx={{
            flex: 1, minWidth: 0, fontSize: 13, color: C.ink, lineHeight: 1.4, pb: 0.3,
          }}>
            of what this protocol<br />said it would move
          </Typography>
        </Stack>

        {/* the whole claim as one bar: predicted is the track, observed fills it */}
        <Box sx={{
          mt: 1.6, height: 10, borderRadius: 5, position: 'relative',
          bgcolor: 'rgba(27,57,91,.08)',
          border: '1px dashed rgba(27,57,91,.22)', overflow: 'hidden',
        }}>
          <Box sx={{
            width: `${Math.min(100, d.share)}%`, height: '100%', bgcolor: tone,
            borderRadius: 5,
          }} />
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 0.9, alignItems: 'baseline' }}>
          <Typography sx={{ flex: 1, fontSize: 11.5, color: C.ink2 }}>
            <b style={{ color: tone }}>{d.observed}</b> of {d.predicted} points delivered
          </Typography>
          {d.predicted > d.observed && (
            <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
              {d.predicted - d.observed} short
            </Typography>
          )}
        </Stack>
      </Box>

      {/* ── where it delivered, and where it didn't ── */}
      <Stack spacing={1.4} sx={{ mt: 1.75 }}>
        {d.rows.map((r) => {
          const rt = C[r.band];
          return (
            <Box key={r.sys}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 0.7 }}>
                <Typography sx={{
                  flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: C.deep,
                }}>{r.t}</Typography>
                <Typography sx={{
                  fontFamily: meter, fontSize: 13, fontWeight: 700, color: rt,
                }}>{r.share}%</Typography>
              </Stack>

              {/* the dashed outline IS the promise; the fill is what arrived */}
              <Box sx={{
                position: 'relative', height: 22, borderRadius: '7px',
                border: `1px dashed ${C.ink2}55`, bgcolor: 'rgba(27,57,91,.03)',
                overflow: 'hidden',
              }}>
                <Box sx={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${Math.min(100, r.share)}%`, bgcolor: `${rt}26`,
                  borderRight: `2px solid ${rt}`,
                }} />
                <Stack direction="row" spacing={0.75} sx={{
                  position: 'absolute', inset: 0, alignItems: 'center', px: 0.9,
                }}>
                  <Typography sx={{
                    fontFamily: meter, fontSize: 11.5, fontWeight: 700, color: rt,
                  }}>+{r.observed}</Typography>
                  <Box sx={{ flex: 1 }} />
                  <Typography sx={{ fontSize: 10, color: C.ink2 }}>
                    predicted +{r.predicted}
                  </Typography>
                </Stack>
              </Box>
            </Box>
          );
        })}
      </Stack>

      <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 1.75, lineHeight: 1.6 }}>
        The prediction was made before the run started, from twins with your
        starting numbers. It is kept and scored either way — that is the only
        reason the next one is worth believing.
      </Typography>
    </Box>
  );
}
