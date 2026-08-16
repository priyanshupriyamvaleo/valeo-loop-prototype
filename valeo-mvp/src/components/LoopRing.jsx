import { Box, Typography } from '@mui/material';
import { PHASES } from '../data';
import { C } from '../theme';

const ARC = 101.58 * 1.272;
const GAP = 451.34 * 1.272;
const FULL = 552.92 * 1.272;

/**
 * The loop as a five-arc ring — one arc per phase, so the shape itself
 * tells you where you are. Done arcs are solid, the live arc fills.
 * Same geometry as TwinGlyph so the two read as one family.
 */
export default function LoopRing({ size = 132, phase = 'Act', fill = 0.33, label, sub, dark }) {
  const idx = PHASES.indexOf(phase);
  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox="0 0 260 260" style={{ display: 'block' }}>
        <g transform="translate(130,130)">
          {PHASES.map((p, i) => (
            <circle key={p} r="112" strokeWidth="13" fill="none" strokeLinecap="round"
                    stroke={i < idx
                      ? (dark ? '#6FD69B' : 'rgba(39,153,91,.85)')
                      : (dark ? 'rgba(255,255,255,.16)' : 'rgba(27,57,91,.13)')}
                    strokeDasharray={`${ARC} ${GAP}`}
                    transform={`rotate(${i * 72 - 90})`} />
          ))}
          {idx >= 0 && (
            <circle r="112" strokeWidth="13" fill="none" strokeLinecap="round" stroke={C.yellow}
                    strokeDasharray={`${ARC * Math.max(0, Math.min(1, fill))} ${FULL}`}
                    transform={`rotate(${idx * 72 - 90})`} />
          )}
        </g>
      </svg>
      <Box sx={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      }}>
        <Typography sx={{
          fontSize: size > 110 ? 25 : 19, fontWeight: 800, lineHeight: 1,
          color: dark ? '#fff' : C.deep,
        }}>{label}</Typography>
        {sub && (
          <Typography sx={{
            fontSize: 8.5, fontWeight: 700, letterSpacing: '.13em', textTransform: 'uppercase',
            color: dark ? 'rgba(255,255,255,.5)' : C.ink2, mt: 0.5,
          }}>{sub}</Typography>
        )}
      </Box>
    </Box>
  );
}
