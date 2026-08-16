import { Box } from '@mui/material';
import { ZONES, zoneOf } from '../data';
import { C } from '../theme';

/**
 * A subsystem's position on the three-band scale.
 *
 *   ▐ red ▌▌▌▌▌▌ green ▌▌▌▌▌▌▐ yellow ▌
 *        ○────────●          ┊
 *       was      now        peak
 *
 * Deliberately a POSITION chart, not a fill chart. A fill answers "how much of
 * the way there", which is the wrong question when the point is whether a
 * subsystem is somewhere a clinician would act — a bar filled to 38 and a bar
 * filled to 62 look like the same kind of thing, and they are not.
 *
 * The band the body is standing in is the only one drawn at strength; the other
 * two stay faint so the marker never has to compete with the scale it sits on.
 * The was→now connector carries the progress, so a red row is never only bad
 * news: it also shows the direction of travel.
 *
 * `soft` keeps self-report visually separate from lab — a hollow marker is still
 * placeable on the scale but never mistaken for something we measured.
 */
export default function ZoneBar({ was, now, peak, exp, soft, h = 11 }) {
  const zone = zoneOf(now);
  const moved = now > was;

  return (
    <Box sx={{ position: 'relative', height: h }}>
      {/* ── the scale ── */}
      <Box sx={{
        position: 'absolute', left: 0, right: 0, top: h / 2 - 3, height: 6,
        borderRadius: 3, overflow: 'hidden', display: 'flex',
      }}>
        {ZONES.map((z) => (
          <Box key={z.k} sx={{
            width: `${z.to - z.from}%`, bgcolor: z.c,
            opacity: z.k === zone.k ? 0.4 : 0.15,
            borderRight: z.k === 'peak' ? 'none' : '1px solid rgba(255,253,245,.85)',
          }} />
        ))}
      </Box>

      {/* ── where a protocol is aiming, if one is ── */}
      {exp != null && exp > now && (
        <Box sx={{
          position: 'absolute', left: `${now}%`, width: `${Math.min(100, exp) - now}%`,
          top: h / 2 - 1, height: 2, opacity: 0.75,
          backgroundImage: `repeating-linear-gradient(115deg,${C.green} 0 2px,transparent 2px 5px)`,
        }} />
      )}

      {/* ── the journey ── */}
      {moved && (
        <Box sx={{
          position: 'absolute', left: `${was}%`, width: `${now - was}%`,
          top: h / 2 - 1.25, height: 2.5, borderRadius: 2,
          bgcolor: C.deep, opacity: 0.4,
        }} />
      )}

      {/* ── where he was ── */}
      <Box sx={{
        position: 'absolute', left: `${was}%`, top: h / 2 - 3.5, ml: '-3.5px',
        width: 7, height: 7, borderRadius: '50%',
        bgcolor: C.cream, border: `1.5px solid ${C.ink2}`, opacity: 0.7,
      }} />

      {/* ── peak for his age ── */}
      {peak != null && (
        <Box sx={{
          position: 'absolute', left: `${peak}%`, top: 0, bottom: 0, width: 1.5,
          bgcolor: C.deep, opacity: 0.45,
        }} />
      )}

      {/* ── where he is: the one thing that must be unmissable ── */}
      <Box sx={{
        position: 'absolute', left: `${now}%`, top: 0, ml: '-3px',
        width: 6, height: h, borderRadius: '3px',
        bgcolor: soft ? C.cream : zone.c,
        border: `2px solid ${zone.c}`,
        boxShadow: '0 0 0 1.5px rgba(255,253,245,.95)',
      }} />
    </Box>
  );
}
