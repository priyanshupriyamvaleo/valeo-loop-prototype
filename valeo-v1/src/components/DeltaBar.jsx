import { Box } from '@mui/material';
import { C } from '../theme';

/**
 * One bar that holds four facts at once, in six pixels of height.
 *
 *   ▓▓▓▓▓▓▓▓ ████████ ░░░░░░ ┊
 *   was      gained    owed   peak
 *
 * This is the whole answer to "what changed after I took it". A number alone
 * ("78") says nothing about movement. A delta alone ("+37") says nothing about
 * whether 37 was a lot. Both, against the distance still to travel, is the only
 * framing where a user can tell whether the thing they paid for is working —
 * and it costs one row instead of a chart.
 *
 * The owed segment is the important one and the one competitors skip. It is
 * what a twelve-week protocol has to show in week three, when nothing has been
 * remeasured yet and adherence either survives or doesn't.
 *
 * `soft` keeps self-report visually separate from lab. A hollow bar is still
 * comparable but never mistaken for something we measured — the two-language
 * rule, applied at 6px.
 */
export default function DeltaBar({ was, now, exp, peak, soft, h = 6 }) {
  const gained = Math.max(0, now - was);
  const owed = exp != null ? Math.max(0, Math.min(exp, 100) - now) : 0;
  const tone = soft ? C.ink2 : C.green;

  return (
    <Box sx={{
      position: 'relative', height: h, borderRadius: h / 2, overflow: 'hidden',
      bgcolor: 'rgba(27,57,91,.08)',
    }}>
      {/* where the body started — deliberately flat and quiet, so the eye
          reads it as ground rather than as achievement */}
      <Box sx={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: `${was}%`,
        bgcolor: 'rgba(27,57,91,.26)',
      }} />

      {/* what moved */}
      {gained > 0 && (
        <Box sx={{
          position: 'absolute', left: `${was}%`, top: 0, bottom: 0, width: `${gained}%`,
          bgcolor: soft ? 'rgba(27,57,91,.5)' : C.green,
          backgroundImage: soft
            ? 'repeating-linear-gradient(115deg,rgba(255,255,255,.55) 0 2px,transparent 2px 4px)'
            : 'none',
        }} />
      )}

      {/* what is still owed by the protocol acting on it */}
      {owed > 0 && (
        <Box sx={{
          position: 'absolute', left: `${now}%`, top: 0, bottom: 0, width: `${owed}%`,
          backgroundImage: `repeating-linear-gradient(115deg,${tone} 0 2px,transparent 2px 5px)`,
          opacity: 0.62,
        }} />
      )}

      {/* peak, as a hard stop the fills have to reach */}
      {peak != null && (
        <Box sx={{
          position: 'absolute', left: `${peak}%`, top: -1, bottom: -1, width: 1.5,
          bgcolor: C.deep, opacity: 0.5,
        }} />
      )}
    </Box>
  );
}
