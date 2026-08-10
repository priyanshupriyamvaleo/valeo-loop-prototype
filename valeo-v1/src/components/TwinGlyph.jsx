import { C } from '../theme';

const PHASES = ['Measure', 'Read', 'Commit', 'Act', 'Prove'];
const ARC = 101.58 * 1.272;
const GAP = 451.34 * 1.272;
const FULL = 552.92 * 1.272;

/**
 * The mark: the loop orbiting a body. One object that says
 * "the loop runs on your biology".
 * The ring encircles — the figure reads as inside it, never behind.
 * The figure stays androgynous and shape-invariant: it is an index,
 * not a picture of the patient.
 */
export default function TwinGlyph({ size = 168, phase = 'Read', fill = 0.72, loops = 1 }) {
  const idx = PHASES.indexOf(phase);
  const stroke = (i) =>
    i < idx ? 'rgba(111,214,155,.95)' : i === idx ? 'rgba(255,255,255,.16)' : 'rgba(255,255,255,.16)';
  const rings = Array.from({ length: loops }, (_, i) => 74 - i * 11);

  return (
    <svg width={size} height={size} viewBox="0 0 260 260" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="vgBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity=".95" />
          <stop offset="100%" stopColor="#BFD2E6" stopOpacity=".5" />
        </linearGradient>
        <radialGradient id="vgAura">
          <stop offset="0%" stopColor={C.yellow} stopOpacity=".22" />
          <stop offset="100%" stopColor={C.yellow} stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="130" cy="130" r="98" fill="url(#vgAura)" />

      {/* body, inside the ring */}
      <g transform="translate(130,130) scale(.40) translate(-100,-215)">
        <g stroke="url(#vgBody)" strokeLinecap="round" fill="none">
          <path d="M72,92 C58,104 52,130 49,158 L45,196" strokeWidth="17" />
          <path d="M128,92 C142,104 148,130 151,158 L155,196" strokeWidth="17" />
          <path d="M88,206 C86,258 84,320 83,392" strokeWidth="22" />
          <path d="M112,206 C114,258 116,320 117,392" strokeWidth="22" />
        </g>
        <ellipse cx="100" cy="40" rx="20" ry="24" fill="url(#vgBody)" />
        <rect x="91" y="58" width="18" height="18" rx="8" fill="url(#vgBody)" />
        <path
          d="M69,80 C67,75 73,71 80,71 L120,71 C127,71 133,75 131,80
             L127,142 C126,168 121,190 117,206 L83,206 C79,190 74,168 73,142 Z"
          fill="url(#vgBody)"
        />
      </g>

      {/* the loop, orbiting */}
      <g transform="translate(130,130)">
        {rings.map((r, i) => (
          <circle key={i} r={r} strokeWidth="3" fill="none"
                  stroke="rgba(111,214,155,.5)" opacity={0.4 - i * 0.1} />
        ))}
        {PHASES.map((p, i) => (
          <circle key={p} r="112" strokeWidth="9" fill="none" strokeLinecap="round"
                  stroke={stroke(i)} strokeDasharray={`${ARC} ${GAP}`}
                  transform={`rotate(${i * 72 - 90})`} />
        ))}
        <circle r="112" strokeWidth="9" fill="none" strokeLinecap="round" stroke={C.yellow}
                strokeDasharray={`${ARC * Math.max(0, Math.min(1, fill))} ${FULL}`}
                transform={`rotate(${idx * 72 - 90})`} />
      </g>
    </svg>
  );
}
