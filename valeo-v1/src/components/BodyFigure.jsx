import { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { GRADE_C, clipRate } from '../data';
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
export default function BodyFigure({ zones, sel, onSel, focus, anim, isolate, marks,
                                     tones, alerts, headMedia, playing, isoCrop, atEnd,
                                     height = 300 }) {
  /* One video element for the head, whatever the lens. Paused on its first frame
     it IS the "now" portrait, so there is no separate still to keep in sync with
     the clip. Playing, it is the transition. */
  const vid = useRef(null);

  /* The clip stops because the timer says so, not because it ran out of frames.
     Its own `to` boundary is kept as a backstop, but the score and the footage
     have to finish on the same tick or the number lands early. */
  useEffect(() => {
    if (atEnd && vid.current) vid.current.pause();
  }, [atEnd]);

  useEffect(() => {
    const v = vid.current;
    if (!v || !headMedia) return undefined;
    const rate = clipRate(headMedia);
    const arm = () => { v.playbackRate = rate; };
    arm();
    v.addEventListener('loadeddata', arm);
    if (playing) {
      v.currentTime = headMedia.from;
      v.play().catch(() => {});
    } else {
      v.pause();
      /* a hair above `from`, because some decoders paint nothing at exactly 0 */
      v.currentTime = headMedia.from + 0.04;
    }
    return () => v.removeEventListener('loadeddata', arm);
  }, [playing, headMedia]);
  /* A selected region is painted its band colour — red when it needs work —
     rather than a uniform highlight. One region at a time, never all four: a
     body lit up like a traffic light at rest is a shame machine, but a single
     region answering "is this one a problem" the moment you ask is information.
     The three steps for it always render directly beneath. */
  const tone = (k) => (tones && tones[k]) || C.yellow;
  /* A region in the red band stays lit whether or not it is selected. Healthy
     ones do not — so the figure is never a full traffic light, but a problem is
     never something you have to go looking for either. */
  const alerted = (k) => !!(alerts && alerts.includes(k));
  /* Isolate mode shows one zone and nothing else, so the region is the only
     thing on screen. It keeps the FULL body width in frame and a floor on the
     frame height: zoom hard enough and a torso section stops reading as a torso
     and becomes three abstract slabs. Shoulder width is what makes a chest a
     chest, so the width stays and only the vertical crop tightens. */
  const iso = isolate ? zones.find((z) => z.k === isolate) : null;
  /* The head is drawn 4 units larger outside isolate mode. At full-body scale the
     portrait is ~28px across, which is too small to read a face; in Peak the crop
     already magnifies it, so growing it there would only crowd the frame. */
  const hr = iso ? 19 : 23;
  const hy = iso ? 23 : 27;
  const cy = iso ? (iso.y0 + iso.y1) / 2 : 0;
  const vh = iso ? Math.max(iso.y1 - iso.y0 + 26, 104) : 390;
  const view = iso ? (isoCrop || `0 ${cy - vh / 2} 200 ${vh}`) : '0 0 200 390';
  return (
    <Box sx={{
      position: 'relative', display: 'flex', justifyContent: 'center',
      /* isolated, the band sets its own height from its aspect ratio — a fixed
         height would leave it floating in a void */
      height: iso ? 'auto' : height, alignItems: 'center', overflow: 'hidden',
    }}>
      <svg viewBox={view} style={iso
        ? { width: '100%', display: 'block' }
        : { height: '100%', display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="bfBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity=".16" />
            <stop offset="100%" stopColor="#BFD2E6" stopOpacity=".07" />
          </linearGradient>
          {/* the silhouette, reused as a clip so zone fills stay inside the body */}
          <clipPath id="bfClip">
            <path d={BODY} />
            <ellipse cx="100" cy="42" rx={hr} ry={hy} />
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
            const flag = alerted(z.k);
            const lit = z.k === focus || z.k === sel || flag;
            /* selected reads stronger than merely flagged, so tapping still
               changes something */
            const strong = z.k === focus || z.k === sel;
            /* While a zone plays, it carries its real grade colour and moves
               from where it was to where it is. Everywhere else stays neutral,
               so the eye has exactly one thing to follow. */
            /* `mute` is set where the region has footage: the clip is the
               transition, and tinting the band at the same time makes the head
               fight its own surroundings. */
            const ramp = playing && !anim.mute;
            const col = ramp ? mix(anim.fromCol, anim.toCol, anim.t)
              : lit ? tone(z.k) : '#9DB4CE';
            const top = ramp ? 0.9 : strong ? 0.42 : flag ? 0.3 : z.known ? 0.15 : 0.06;
            const bot = ramp ? 0.5 : strong ? 0.16 : flag ? 0.11 : z.known ? 0.09 : 0.04;
            return (
              <linearGradient key={z.k} id={`bfZ${z.k}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={col} stopOpacity={top} />
                <stop offset="100%" stopColor={col} stopOpacity={bot} />
              </linearGradient>
            );
          })}
        </defs>

        {/* base silhouette — clipped to the zone when isolated, so the rest of
            the body genuinely is not there rather than merely dimmed */}
        {iso && (
          <clipPath id="bfBand">
            <rect x="0" y={iso.y0} width="200" height={iso.y1 - iso.y0} />
          </clipPath>
        )}
        {/* Isolated, the band needs an edge. Without one the fill floats as three
            flat slabs; with one it reads as a section cut out of a body. */}
        <g fill="url(#bfBase)" clipPath={iso ? 'url(#bfBand)' : undefined}
           stroke={iso ? 'rgba(255,255,255,.3)' : undefined}
           /* a tight crop magnifies the stroke — 1.1 reads as a hard line at
              portrait zoom, where the photo supplies its own edge anyway */
           strokeWidth={iso ? (isoCrop ? 0.45 : 1.1) : undefined}>
          <ellipse cx="100" cy="42" rx={hr} ry={hy} />
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
            if (iso && z.k !== iso.k) return null;
            return (
              <rect key={z.k} x="0" y={z.y0} width="200" height={z.y1 - z.y0}
                    fill={`url(#bfZ${z.k})`}
                    opacity={anim ? (anim.zone === z.k ? 1 : 0.25)
                      : sel && !active && !alerted(z.k) ? 0.3 : 1}
                    style={{ transition: 'opacity .3s' }} />
            );
          })}
        </g>

        {/* ── THE HEAD ──
            Clipped to the head ellipse, which does two things for free: it cuts
            the clip's changing rooms and clothing out of frame entirely, and it
            rides the isolate viewBox, so the same element is a 28px portrait in
            Now and a 170px one in Peak with no second code path. Drawn above the
            zone fills so a tint never washes the face. */}
        {headMedia && (
          <>
            <clipPath id="bfHead">
              <ellipse cx="100" cy="42" rx={hr} ry={hy} />
            </clipPath>
            <foreignObject x={100 - hr} y={42 - hy} width={hr * 2} height={hy * 2}
                           clipPath="url(#bfHead)">
              <video ref={vid} src={headMedia.clip} muted playsInline preload="auto"
                     onTimeUpdate={() => {
                       const v = vid.current;
                       if (v && v.currentTime >= headMedia.to) v.pause();
                     }}
                     style={{
                       width: '100%', height: '100%', objectFit: 'cover',
                       display: 'block', borderRadius: '50%',
                       /* the head is still a tap target for its region — a video
                          swallowing the tap would make head & neck unselectable */
                       pointerEvents: 'none',
                     }} />
            </foreignObject>
            {/* a rim, so the portrait reads as part of the figure rather than
                pasted on top of it */}
            <ellipse cx="100" cy="42" rx={hr} ry={hy} fill="none"
                     stroke="rgba(255,255,255,.4)" strokeWidth="0.8" />
          </>
        )}

        {/* zone separators — hairlines, so the bands read as distinct */}
        {!iso && <g stroke="rgba(255,255,255,.12)" strokeWidth="0.75" strokeDasharray="2 3">
          {zones.slice(1).map((z) => (
            <line key={z.k} x1="38" y1={z.y0} x2="162" y2={z.y0} />
          ))}
        </g>}

        {/* "look here" — one soft ring, on the zone that owns the constraint */}
        {!anim && zones.filter((z) => z.k === focus && z.k !== sel).map((z) => (
          <rect key={`f${z.k}`} x="30" y={z.y0 + 2} width="140" height={z.y1 - z.y0 - 4}
                rx="14" fill="none" stroke={tone(z.k)} strokeWidth="1.25"
                strokeDasharray="4 4" opacity=".55" pointerEvents="none" />
        ))}

        {/* selection bracket on the active zone */}
        {!iso && zones.filter((z) => z.k === sel).map((z) => (
          <g key={z.k} stroke={tone(z.k)} strokeWidth="1.75" fill="none">
            <path d={`M36,${z.y0 + 4} L30,${z.y0 + 4} L30,${z.y1 - 4} L36,${z.y1 - 4}`} />
            <path d={`M164,${z.y0 + 4} L170,${z.y0 + 4} L170,${z.y1 - 4} L164,${z.y1 - 4}`} />
          </g>
        ))}

        {/* tap targets — full-width bands, ~55px at this render size */}
        {!iso && zones.map((z) => (
          <rect key={`t${z.k}`} x="0" y={z.y0} width="200" height={z.y1 - z.y0}
                fill="transparent" style={{ cursor: 'pointer' }}
                onClick={() => onSel(sel === z.k ? null : z.k)} />
        ))}

        {/* What is being worked on, and what has already moved — on the body
            itself, because "where is my protocol acting" is a question about a
            place. A pulsing dot is work in progress; the green number is what a
            retest has already confirmed there. Costs no vertical space, which
            is the only reason it can sit above the fold at all. */}
        {!anim && marks && zones.map((z) => {
          const m = marks[z.k];
          if (!m) return null;
          return (
            <g key={`m${z.k}`} pointerEvents="none"
               opacity={sel && sel !== z.k ? 0.35 : 1}
               style={{ transition: 'opacity .3s' }}>
              {m.active && (
                <circle cx="14" cy={z.cy} r="2.8" fill="#6FD69B">
                  <animate attributeName="opacity" values="1;.2;1"
                           dur="2.4s" repeatCount="indefinite" />
                </circle>
              )}
              {m.delta > 0 && (
                <text x={m.active ? 20 : 12} y={z.cy + 3.5} fontSize="9" fontWeight="800"
                      fill="#6FD69B">+{m.delta}</text>
              )}
            </g>
          );
        })}

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
