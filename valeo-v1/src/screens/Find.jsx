import { Box, Stack, Typography } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import { GOALS, PROTOCOLS, LIVE, coachOf, coachesFor, protosFor, breakdown,
         givenNameOf, leadFor } from '../data';
import { C, meter } from '../theme';

/**
 * THE MATCH — one doctor, one plan, no menu.
 *
 * Arrived at from the coach chat, which already knows the goal, so this screen
 * does not ask again: it answers. One recommendation, with the doctor's face,
 * their philosophy, and what the weeks contain.
 *
 * It used to list the other three below, on the theory that visible alternatives
 * make the recommendation feel chosen rather than assigned. That was wrong, and
 * specifically wrong: those three are other GOALS. Showing a postpartum patient
 * a testosterone plan is not choice, it is noise wearing the costume of choice —
 * and it quietly undercuts a recommendation we just made with confidence.
 *
 * A real alternative is a different approach to the SAME goal — one clinician
 * who medicates and measures against one who trains and refuses to. Where that
 * exists it appears as a single quiet line. Where it doesn't, nothing does.
 *
 * With no goal (someone opening the tab cold) this becomes a browse surface,
 * because we haven't earned the right to rank anything yet.
 */
export default function Find({ matched, onOpen }) {
  const goal = GOALS.find((g) => g.k === matched);
  const mine = goal ? coachesFor(goal.k).flatMap((ck) => protosFor(ck, goal.k)) : [];
  /* the recommendation, and any genuine same-goal alternative behind it */
  const lead = goal ? leadFor(goal.k) : undefined;
  const others = mine.slice(1);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" spacing={1} sx={{
        alignItems: 'center', px: 2.25, pt: 2.5, pb: 1.5, flexShrink: 0,
      }}>
        <Typography variant="overline" sx={{ flex: 1, color: C.ink2 }}>
          {goal ? 'Your match' : 'All plans'}
        </Typography>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 3 }}>
        {goal ? (
          <>
            <Typography variant="h2" sx={{ color: C.deep, mb: 0.6 }}>
              {goal.t}, with {coachOf(mine[0]) ? coachOf(mine[0]).short : 'a doctor'}.
            </Typography>
            <Typography sx={{ fontSize: 13, color: C.ink2, lineHeight: 1.55, mb: 2.25 }}>
              {/* No pronoun: naming someone then saying "they" in the same clause
                  reads as a mistake, and these characters have no stated
                  pronouns. Restructured so the sentence never needs one. */}
              {coachOf(lead) ? givenNameOf(coachOf(lead)) : 'Your doctor'} wrote this plan,
              and adapts it to you after your consultation.
            </Typography>

            {lead && <OfferCard pKey={lead} onOpen={onOpen} />}

            {/* Only a different approach to the same goal earns a place here. */}
            {others.length > 0 && (
              <>
                <Typography sx={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
                  color: C.ink2, mt: 3, mb: 1.25,
                }}>Or a different approach</Typography>
                <Stack spacing={1}>
                  {others.map((pk) => <Row key={pk} pKey={pk} onOpen={onOpen} />)}
                </Stack>
              </>
            )}
          </>
        ) : (
          <>
            <Typography variant="h2" sx={{ color: C.deep, mb: 0.6 }}>
              Four doctors. Four plans.
            </Typography>
            <Typography sx={{ fontSize: 13, color: C.ink2, lineHeight: 1.55, mb: 2.25 }}>
              Each plan is written by the doctor who runs it, and ends in a retest that
              says whether it worked on you.
            </Typography>
            <Stack spacing={1.75}>
              {LIVE.map((pk) => <OfferCard key={pk} pKey={pk} onOpen={onOpen} />)}
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}

/* The fused card: who, then what. Portrait is real where a headshot exists and
   initials where it does not — identical footprint either way, so supplying the
   remaining photos changes nothing structural. */
function OfferCard({ pKey, onOpen }) {
  const p = PROTOCOLS[pKey];
  const c = coachOf(pKey);
  const b = breakdown(pKey);

  return (
    <Box onClick={() => onOpen(pKey)} sx={{
      cursor: 'pointer', borderRadius: '22px', overflow: 'hidden', bgcolor: '#fff',
      border: '1px solid rgba(27,57,91,.07)',
      boxShadow: '0 5px 20px -12px rgba(27,57,91,.45)',
      transition: 'transform .12s', '&:active': { transform: 'scale(.99)' },
    }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 1.75, pt: 1.75, pb: 1.4 }}>
        <Portrait c={c} d={52} r="15px" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.deep, lineHeight: 1.2 }}>
            {c.name}
          </Typography>
          <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center', mt: 0.3 }}>
            <VerifiedIcon sx={{ fontSize: 11.5, color: C.teal }} />
            <Typography sx={{ fontSize: 10.5, color: C.ink2 }}>
              {c.role} · {c.years} yrs
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center', mt: 0.3 }}>
            <ScheduleIcon sx={{ fontSize: 11, color: C.ink2 }} />
            <Typography sx={{ fontSize: 10, color: C.ink2 }}>{c.reply}</Typography>
          </Stack>
        </Box>
      </Stack>

      <Typography sx={{
        fontSize: 12.5, color: C.ink, lineHeight: 1.5, fontStyle: 'italic',
        mx: 1.75, pl: 1.3, borderLeft: `2.5px solid ${c.tone}`,
      }}>
        “{c.line}”
      </Typography>

      <Box sx={{ px: 1.75, pt: 1.5, pb: 1.6 }}>
        <Typography sx={{ fontSize: 17, fontWeight: 700, color: C.deep, lineHeight: 1.2 }}>
          {p.t}
        </Typography>
        <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.3, lineHeight: 1.45 }}>
          {p.goal}
        </Typography>
      </Box>

      <Stack direction="row" spacing={1} sx={{
        alignItems: 'center', px: 1.75, py: 1.4,
        borderTop: `1px solid ${C.line}`, bgcolor: 'rgba(27,57,91,.022)',
      }}>
        <Typography sx={{ flex: 1, minWidth: 0, fontSize: 11, color: C.ink2 }}>
          {p.wk} weeks · {b.tangibles.length} delivered · {b.plans.length} plans
        </Typography>
        <Typography sx={{
          fontFamily: meter, fontSize: 13.5, fontWeight: 700, color: C.deep, flexShrink: 0,
        }}>SAR {p.price.toLocaleString()}</Typography>
        <ChevronRightIcon sx={{ fontSize: 18, color: C.ink2, flexShrink: 0 }} />
      </Stack>
    </Box>
  );
}

function Row({ pKey, onOpen }) {
  const p = PROTOCOLS[pKey];
  const c = coachOf(pKey);
  return (
    <Stack direction="row" spacing={1.4} onClick={() => onOpen(pKey)} sx={{
      alignItems: 'center', px: 1.5, py: 1.4, borderRadius: '17px', cursor: 'pointer',
      bgcolor: '#fff', border: '1px solid rgba(27,57,91,.06)',
      boxShadow: '0 2px 10px -7px rgba(27,57,91,.3)',
    }}>
      <Portrait c={c} d={40} r="12px" />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>{p.t}</Typography>
        <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.15 }}>
          {c.short} · {p.wk} wk
        </Typography>
      </Box>
      <Typography sx={{
        fontFamily: meter, fontSize: 12, fontWeight: 700, color: C.ink2, flexShrink: 0,
      }}>SAR {p.price.toLocaleString()}</Typography>
    </Stack>
  );
}

function Portrait({ c, d, r }) {
  return (
    <Box sx={{
      width: d, height: d, borderRadius: r, flexShrink: 0, overflow: 'hidden',
      bgcolor: c.tone, position: 'relative',
    }}>
      {c.img ? (
        <Box component="img" src={c.img} alt="" sx={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', objectPosition: 'center 20%',
        }} />
      ) : (
        <Typography sx={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: d * 0.3, fontWeight: 800,
          color: 'rgba(255,255,255,.92)',
        }}>{c.mono}</Typography>
      )}
    </Box>
  );
}
