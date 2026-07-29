import { Box } from '@mui/material';
import { GRADE_C } from '../data';
import { C } from '../theme';

const BODY = `M69,82 C67,77 73,73 80,73 L120,73 C127,73 133,77 131,82
              L127,148 C126,176 121,198 117,214 L83,214 C79,198 74,176 73,148 Z`;

/* Interpolate two hexes, so a grade change is a movement rather than a cut.
   A cut reads as a different body; a morph reads as the same body improving. */
function mix(a, b, t) {
  const h = (x) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const [r1, g1, b1] = h(a), [r2, g2, b2] = h(b);
  const c = (x, y) => Math.round(x + (y - x) * t);
  return `rgb(${c(r1, r2)},${c(g1, g2)},${c(b1, b2)})`;
}

/**
 * The body as an index, not a portrait.
 *
 * Androgynous and shape-invariant on purpose — it never changes with weight and
 * has no gendered anatomy, because its job is to answer "where in me is this?"
 * and not to depict the patient. It is also deliberately NOT anatomical: no
 * organ silhouettes, because a glowing liver implies we imaged your liver.
 *
 * Grades are painted onto zones rather than pinned as dots. Four y-bands give
 * ~55px tap targets at this render size; six dots gave ~20px, which is a hard
 * accessibility failure and was the reason for the change.
 *
 * Unlit is not unhealthy. Unknown zones are grey, never red, and the copy says
 * "not measured" — the deficiency belongs to the model, not the person.
 */
export default function BodyFigure({ zones, sel, onSel, focus, anim, height = 300 }) {
  return (
    <Box sx={{ position: 'relative', height, display: 'flex', justifyContent: 'center' }}>
      <svg viewBox="0 0 200 390" style={{ height: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="bfBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity=".16" />
            <stop offset="100%" stopColor="#BFD2E6" stopOpacity=".07" />
          </linearGradient>
          {/* the silhouette, reused as a clip so zone fills stay inside the body */}
          <clipPath id="bfClip">
            <path d={BODY} />
            <ellipse cx="100" cy="42" rx="19" ry="23" />
            <rect x="91" y="60" width="18" height="16" rx="8" />
            <rect x="43" y="84" width="18" height="124" rx="9" />
            <rect x="139" y="84" width="18" height="124" rx="9" />
            <rect x="74" y="206" width="22" height="168" rx="11" />
            <rect x="104" y="206" width="22" height="168" rx="11" />
          </clipPath>
          {/* A grade-coloured body is a traffic light, and a red torso reads as
              "you are broken" long before anyone gets to the list. So the body
              stays neutral and highlights ONE zone — the one worth looking at.
              Severity belongs in the list, where it arrives with its move. */}
          {zones.map((z) => {
            const playing = anim && anim.zone === z.k;
            const lit = z.k === focus || z.k === sel;
            /* While a zone plays, it carries its real grade colour and moves
               from where it was to where it is. Everywhere else stays neutral,
               so the eye has exactly one thing to follow. */
            const col = playing ? mix(GRADE_C[anim.from], GRADE_C[anim.to], anim.t)
              : lit ? C.yellow : '#9DB4CE';
            const top = playing ? 0.72 : lit ? 0.42 : z.known ? 0.15 : 0.06;
            const bot = playing ? 0.34 : lit ? 0.16 : z.known ? 0.09 : 0.04;
            return (
              <linearGradient key={z.k} id={`bfZ${z.k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col} stopOpacity={top} />
                <stop offset="100%" stopColor={col} stopOpacity={bot} />
              </linearGradient>
            );
          })}
        </defs>

        {/* base silhouette */}
        <g fill="url(#bfBase)">
          <ellipse cx="100" cy="42" rx="19" ry="23" />
          <rect x="91" y="60" width="18" height="16" rx="8" />
          <path d={BODY} />
          <rect x="43" y="84" width="18" height="124" rx="9" />
          <rect x="139" y="84" width="18" height="124" rx="9" />
          <rect x="74" y="206" width="22" height="168" rx="11" />
          <rect x="104" y="206" width="22" height="168" rx="11" />
        </g>

        {/* the grades, painted into the silhouette */}
        <g clipPath="url(#bfClip)">
          {zones.map((z) => {
            const active = sel === z.k;
            return (
              <rect key={z.k} x="0" y={z.y0} width="200" height={z.y1 - z.y0}
                    fill={`url(#bfZ${z.k})`}
                    opacity={anim ? (anim.zone === z.k ? 1 : 0.25)
                      : sel && !active ? 0.3 : 1}
                    style={{ transition: 'opacity .3s' }} />
            );
          })}
        </g>

        {/* zone separators — hairlines, so the bands read as distinct */}
        <g stroke="rgba(255,255,255,.12)" strokeWidth="0.75" strokeDasharray="2 3">
          {zones.slice(1).map((z) => (
            <line key={z.k} x1="38" y1={z.y0} x2="162" y2={z.y0} />
          ))}
        </g>

        {/* "look here" — one soft ring, on the zone that owns the constraint */}
        {!anim && zones.filter((z) => z.k === focus && z.k !== sel).map((z) => (
          <rect key={`f${z.k}`} x="30" y={z.y0 + 2} width="140" height={z.y1 - z.y0 - 4}
                rx="14" fill="none" stroke={C.yellow} strokeWidth="1.25"
                strokeDasharray="4 4" opacity=".55" pointerEvents="none" />
        ))}

        {/* selection bracket on the active zone */}
        {zones.filter((z) => z.k === sel).map((z) => (
          <g key={z.k} stroke={C.yellow} strokeWidth="1.75" fill="none">
            <path d={`M36,${z.y0 + 4} L30,${z.y0 + 4} L30,${z.y1 - 4} L36,${z.y1 - 4}`} />
            <path d={`M164,${z.y0 + 4} L170,${z.y0 + 4} L170,${z.y1 - 4} L164,${z.y1 - 4}`} />
          </g>
        ))}

        {/* tap targets — full-width bands, ~55px at this render size */}
        {zones.map((z) => (
          <rect key={`t${z.k}`} x="0" y={z.y0} width="200" height={z.y1 - z.y0}
                fill="transparent" style={{ cursor: 'pointer' }}
                onClick={() => onSel(sel === z.k ? null : z.k)} />
        ))}

        {/* grade chip, only where a grade exists */}
        {!anim && zones.map((z) => (
          z.grade ? (
            <g key={`g${z.k}`} pointerEvents="none"
               opacity={sel && sel !== z.k ? 0.35 : 1}
               style={{ transition: 'opacity .3s' }}>
              <circle cx="180" cy={z.cy} r="3.5" fill={GRADE_C[z.grade]} />
              <text x="188" y={z.cy + 4} fontSize="10.5" fontWeight="800"
                    fill="rgba(255,255,255,.72)">{z.grade}</text>
            </g>
          ) : null
        ))}
      </svg>
    </Box>
  );
}
