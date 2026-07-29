import { Box } from '@mui/material';
import { GRADE_C } from '../data';
import { C } from '../theme';

/**
 * The body as an index, not a portrait.
 *
 * It stays androgynous and shape-invariant — it never changes with weight and
 * has no gendered anatomy — because its job is to answer "where in my body is
 * this?" and not to depict the patient. That distinction is what keeps it clear
 * of the body-image problems a realistic render would create.
 *
 * Measured systems glow in their grade colour. Unmeasured ones sit dim, which
 * is the point: the dark spots are the argument for answering more.
 */
export default function BodyFigure({ rows, sel, onSel, height = 300 }) {
  return (
    <Box sx={{ position: 'relative', height, display: 'flex', justifyContent: 'center' }}>
      <svg viewBox="0 0 200 380" style={{ height: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="bfSkin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity=".22" />
            <stop offset="100%" stopColor="#BFD2E6" stopOpacity=".10" />
          </linearGradient>
          <filter id="bfGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* limbs behind the torso */}
        <g stroke="url(#bfSkin)" strokeLinecap="round" fill="none">
          <path d="M70,92 C56,104 50,132 47,162 L43,204" strokeWidth="16" />
          <path d="M130,92 C144,104 150,132 153,162 L157,204" strokeWidth="16" />
          <path d="M88,214 C86,262 84,318 83,368" strokeWidth="21" />
          <path d="M112,214 C114,262 116,318 117,368" strokeWidth="21" />
        </g>
        <ellipse cx="100" cy="42" rx="19" ry="23" fill="url(#bfSkin)" />
        <rect x="91" y="60" width="18" height="16" rx="8" fill="url(#bfSkin)" />
        <path d="M69,82 C67,77 73,73 80,73 L120,73 C127,73 133,77 131,82
                 L127,148 C126,176 121,198 117,214 L83,214 C79,198 74,176 73,148 Z"
              fill="url(#bfSkin)" />

        {/* outline so the silhouette reads on a dark ground */}
        <g stroke="rgba(255,255,255,.22)" strokeWidth="1" fill="none">
          <ellipse cx="100" cy="42" rx="19" ry="23" />
          <path d="M69,82 C67,77 73,73 80,73 L120,73 C127,73 133,77 131,82
                   L127,148 C126,176 121,198 117,214 L83,214 C79,198 74,176 73,148 Z" />
        </g>

        {/* system markers */}
        {rows.map((r) => {
          const on = !!r.grade;
          const active = sel === r.k;
          const col = on ? GRADE_C[r.grade] : 'rgba(255,255,255,.28)';
          return (
            <g key={r.k} onClick={() => onSel(active ? null : r.k)} style={{ cursor: 'pointer' }}>
              {on && (
                <circle cx={r.x} cy={r.y} r={active ? 17 : 13} fill={col}
                        opacity={active ? 0.45 : 0.28} filter="url(#bfGlow)" />
              )}
              <circle cx={r.x} cy={r.y} r={active ? 6.5 : 5} fill={col} />
              <circle cx={r.x} cy={r.y} r={active ? 6.5 : 5} fill="none"
                      stroke={on ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.35)'}
                      strokeWidth="1.5" strokeDasharray={on ? '' : '2 2'} />
            </g>
          );
        })}
      </svg>
    </Box>
  );
}
