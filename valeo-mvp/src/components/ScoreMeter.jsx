import { Box, Stack, Typography } from '@mui/material';
import { ZONES, zoneOf } from '../data';
import { C, meter } from '../theme';

/* Gauge geometry. A 232° sweep centred on straight-up, leaving the bottom open
   for the readout and both ends low enough to hang labels off. */
const CX = 150, CY = 126, R = 98, START = 154, SWEEP = 232;
const TICKS = 44;

const pt = (frac, r) => {
  const a = ((START + SWEEP * frac) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
const arc = (v0, v1, r) => {
  const [x0, y0] = pt(v0 / 100, r);
  const [x1, y1] = pt(v1 / 100, r);
  const large = (SWEEP * (v1 - v0)) / 100 > 180 ? 1 : 0;
  return `M${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1}`;
};

/**
 * THE LONGEVITY METER
 *
 * A three-band dial with three pointers, which between them answer the two
 * questions a single number cannot: am I in trouble, and am I moving.
 *
 *   0 ─── 40 ──────────── 90 ── 100
 *    red      green         yellow
 *
 * Every tick carries its band colour whether or not the needle has reached it,
 * so the map of good and bad is always on screen; ticks the body has passed are
 * taller and fully saturated, which is what marks the current position. Colour
 * the reached ticks only and the peak band disappears until you are standing in
 * it — you would lose the thing the dial exists to show.
 *
 * Three pointers rather than one: where he was, where he is, where peak sits.
 * The distance between the first two IS the progress claim, and a lone needle
 * cannot make it — it shows a state and says nothing about a journey. They are
 * rim-anchored rather than hub-anchored so the centre stays free for the score;
 * multi-marker instruments do the same thing for the same reason.
 */
export default function ScoreMeter({ was, now, peak, since }) {
  const zone = zoneOf(now);
  const gap = Math.max(0, peak - now);

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Width-capped: at full container width the dial is ~215px tall and
          starves the tracker list below it. The arc ends well above the box
          floor, so the viewBox is cropped to match. */}
      <Box component="svg" viewBox="0 0 300 170"
           sx={{ width: '86%', maxWidth: 320, mx: 'auto', display: 'block', overflow: 'visible' }}>
        {/* ── the three bands, as a tick scale ── */}
        {Array.from({ length: TICKS }, (_, i) => {
          const v = ((i + 0.5) / TICKS) * 100;
          const frac = i / (TICKS - 1);
          const reached = v <= now;
          const z = zoneOf(v);
          const len = reached ? 15 : 9;
          const [x1, y1] = pt(frac, R - len);
          const [x2, y2] = pt(frac, R);
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke={z.c} strokeWidth={reached ? 4.2 : 3}
                  strokeLinecap="round" opacity={reached ? 1 : 0.28} />
          );
        })}

        {/* ── the journey, as an arc from where he was to where he is ── */}
        {now > was && (
          <path d={arc(was, now, R + 9)} fill="none" stroke={C.green}
                strokeWidth="3" strokeLinecap="round" opacity={0.9} />
        )}

        {/* ── the three pointers ── */}
        <Needle v={was}  col={C.ink2} w={2}   op={0.5} tip={3}   hollow />
        <Needle v={peak} col={C.deep} w={2}   op={0.55} tip={3}  hollow />
        <Needle v={now}  col={zone.c} w={4.5} op={1}   tip={5.5} />

        {/* pointer values, outside the ring */}
        <Val v={was}  t={was}  col={C.ink2} />
        <Val v={peak} t={peak} col={C.deep} />
        <Val v={now}  t={now}  col={zone.c} big />
      </Box>

      {/* ── the readout, in the clear centre ── */}
      <Stack sx={{
        position: 'absolute', left: 0, right: 0, top: '31%',
        alignItems: 'center', pointerEvents: 'none',
      }}>
        {/* No label inside the dial: with the dial width-capped, a caption here
            lands on the tick ring. It belongs in the sheet header, which had no
            title of its own anyway. */}
        <Stack direction="row" spacing={0.4} sx={{ alignItems: 'baseline', mt: 0.3 }}>
          <Typography sx={{
            fontFamily: meter, fontSize: 50, fontWeight: 700, lineHeight: 1,
            color: C.deep, letterSpacing: '-.02em', fontVariantNumeric: 'tabular-nums',
          }}>{now}</Typography>
          <Typography sx={{
            fontFamily: meter, fontSize: 15, fontWeight: 600, color: C.ink2,
          }}>/100</Typography>
        </Stack>

        {/* the band he is standing in, named */}
        <Typography sx={{
          mt: 0.6, px: 1, py: 0.3, borderRadius: '7px',
          fontFamily: meter, fontSize: 10, fontWeight: 700, letterSpacing: '.1em',
          textTransform: 'uppercase', color: '#fff', bgcolor: zone.c,
        }}>{zone.t}</Typography>
      </Stack>

      {/* ── the journey in numbers, under the dial ── */}
      <Stack direction="row" sx={{ mt: 0.25 }}>
        <Stat k={since} v={was} col={C.ink2} />
        <Stat k="Moved" v={`+${now - was}`} col={C.green} mid />
        <Stat k="To peak" v={gap} col={C.deep} end />
      </Stack>

      {/* the scale, named once */}
      <Stack direction="row" spacing={1.25} sx={{ justifyContent: 'center', mt: 1.1 }}>
        {ZONES.map((z) => (
          <Stack key={z.k} direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 9, height: 4, borderRadius: 2, bgcolor: z.c }} />
            <Typography sx={{
              fontSize: 9.5, color: z.k === zone.k ? C.deep : C.ink2,
              fontWeight: z.k === zone.k ? 700 : 400,
            }}>{z.t}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

/* Rim-anchored pointer: a short hand just inside the tick ring, tipped so the
   eye lands on the value rather than on the line. */
function Needle({ v, col, w, op, tip, hollow }) {
  const frac = v / 100;
  const [x1, y1] = pt(frac, R - 34);
  const [x2, y2] = pt(frac, R - 3);
  return (
    <g opacity={op}>
      <line x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={col} strokeWidth={w} strokeLinecap="round" />
      <circle cx={x2} cy={y2} r={tip} fill={hollow ? '#FFFDF5' : col}
              stroke={col} strokeWidth={hollow ? 1.8 : 1.5} />
    </g>
  );
}

function Val({ v, t, col, big }) {
  const [x, y] = pt(v / 100, R + 22);
  return (
    <text x={x} y={y} fontSize={big ? 13 : 11} fontWeight="700" fill={col}
          fontFamily={meter} textAnchor="middle" dominantBaseline="middle">{t}</text>
  );
}

function Stat({ k, v, col, mid, end }) {
  return (
    <Stack sx={{
      flex: 1, alignItems: mid ? 'center' : end ? 'flex-end' : 'flex-start',
    }}>
      <Typography sx={{
        fontSize: 8.5, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase',
        color: C.ink2,
      }}>{k}</Typography>
      <Typography sx={{ fontFamily: meter, fontSize: 17, fontWeight: 700, color: col }}>
        {v}
      </Typography>
    </Stack>
  );
}
