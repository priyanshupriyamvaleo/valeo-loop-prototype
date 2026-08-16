import { Box, Typography } from '@mui/material';
import { C } from '../theme';

/**
 * One series, change over time — so: a line, one axis, no legend (the caption
 * names it), 2px stroke, a single 8px marker on the latest point, and a direct
 * label on that point only. Grid and axis stay recessive.
 *
 * It plots the proxy, not the verdict. Between two blood draws there is no
 * marker data, and implying otherwise would be the dishonest version of this
 * chart — hence the reference line at the retest day, labelled for what it is.
 */
export default function Trend({ points, total, unit = 'kg', caption, color = C.teal,
                               tail = ', the retest is what decides.' }) {
  const W = 320, H = 118, PAD_L = 6, PAD_R = 34, PAD_T = 10, PAD_B = 20;
  if (!points.length) return null;

  const vals = points.map((p) => p.v);
  const lo = Math.min(...vals) - 0.8;
  const hi = Math.max(...vals) + 0.8;
  const x = (d) => PAD_L + ((d - 1) / Math.max(1, total - 1)) * (W - PAD_L - PAD_R);
  const y = (v) => PAD_T + (1 - (v - lo) / Math.max(0.001, hi - lo)) * (H - PAD_T - PAD_B);

  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.d).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  const first = points[0];
  const delta = (last.v - first.v).toFixed(1);
  const down = last.v < first.v;

  return (
    <Box>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
        {/* recessive baseline */}
        <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B}
              stroke="rgba(27,57,91,.12)" strokeWidth="1" />

        {/* the retest day — a reference, clearly not data */}
        <line x1={x(total)} y1={PAD_T - 4} x2={x(total)} y2={H - PAD_B}
              stroke="rgba(255,185,0,.55)" strokeWidth="1.5" strokeDasharray="3 3" />

        <path d={path} fill="none" stroke={color} strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />

        {/* one marker, on the latest point, with a 2px surface ring */}
        <circle cx={x(last.d)} cy={y(last.v)} r="5" fill={color}
                stroke={C.cream} strokeWidth="2" />

        {/* direct label — on this point only, never on every point */}
        <text x={x(last.d) + 9} y={y(last.v) + 4} fontSize="11" fontWeight="700"
              fill={C.deep}>{last.v}{unit}</text>

        <text x={PAD_L} y={H - 6} fontSize="9" fill="rgba(94,110,130,.9)">Day 1</text>
        <text x={x(total)} y={H - 6} fontSize="9" fontWeight="700" textAnchor="end"
              fill={C.yellowDeep}>Retest</text>
      </svg>

      <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.75, lineHeight: 1.5 }}>
        {caption}{' '}
        <Box component="span" sx={{ color: down ? C.green : C.ink, fontWeight: 700 }}>
          {down ? delta : `+${delta}`}{unit} so far
        </Box>
        {tail}
      </Typography>
    </Box>
  );
}
