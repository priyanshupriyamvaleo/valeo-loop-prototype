import { Box, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { RX_ACTIVE, USER, coachOf, knownPlan, runsList } from '../data';
import { C } from '../theme';

/*
 * PROGRAMS — what is running, and the two doors out of it.
 *
 * A subscription product has exactly two growth moments: the renewal and the
 * second programme. This tab is both, and nothing else. The running programme
 * is one card with its cycle drawn on it; from week 3 the renewal grows out of
 * that same card rather than appearing somewhere new, because the thing being
 * renewed and the thing shown running must be visibly the same object.
 *
 * The renewal is offered a week early for the same reason pharmacies refill a
 * week early: the next delivery has to be dispensed, reviewed and driven over
 * before the last pen is used. The card says that, plainly, instead of
 * pretending the button is for our benefit.
 */
export default function Programs({ st, onRenew, onNewGoal, onDetail }) {
  const runs = runsList(st).filter((x) => x.run && RX_ACTIVE.includes(x.status));

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: C.cream, pb: 4 }}>
      <Box sx={{ px: 2.75, pt: 3.5 }}>
        <Typography sx={{ fontSize: 12.5, color: C.ink2 }}>{USER.first}’s programmes</Typography>
        <Typography variant="h1" sx={{ fontSize: 27, color: C.deep, mt: 0.25 }}>
          Programs
        </Typography>
      </Box>

      <Stack spacing={1.5} sx={{ px: 2.25, mt: 2.5 }}>
        {runs.length === 0 && (
          <Box sx={{ px: 2.25, py: 3, borderRadius: '20px', bgcolor: '#fff' }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.deep }}>
              Nothing running yet.
            </Typography>
            <Typography sx={{ fontSize: 13, color: C.ink2, mt: 0.75, lineHeight: 1.55 }}>
              When you start a programme it lives here: what you are on, how far
              in you are, and when it renews.
            </Typography>
          </Box>
        )}

        {runs.map(({ k, p, run, status }) => {
          const doc = coachOf(k);
          const running = status === 'running' && run.day;
          const weeks = Math.ceil((run.total || 28) / 7);
          const week = running ? Math.min(weeks, Math.ceil(run.day / 7)) : 0;
          const monthly = run.term === 'monthly';
          const daysLeft = running ? Math.max(0, run.total - run.day) : null;
          const ended = running && run.day >= run.total;
          /* week 3 of 4 is when the renewal starts asking */
          const renewDue = monthly && running && week >= 3;
          const price = monthly ? knownPlan(k, {}).price : null;

          return (
            <Box key={k} sx={{
              borderRadius: '20px', bgcolor: '#fff', overflow: 'hidden',
              boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
            }}>
              <Box onClick={() => onDetail(k)} sx={{ px: 2.25, pt: 2.25, pb: 2, cursor: 'pointer' }}>
                <Stack direction="row" sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 16.5, fontWeight: 700, color: C.deep }}>
                      {p.t}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.3 }}>
                      {monthly ? `Monthly plan · with ${doc ? doc.short : 'your doctor'}`
                        : `12-week programme · with ${doc ? doc.short : 'your doctor'}`}
                      {run.cycle > 1 ? ` · Cycle ${run.cycle}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{
                    px: 1.15, py: 0.45, borderRadius: '999px', flexShrink: 0,
                    fontSize: 10.5, fontWeight: 700,
                    bgcolor: running ? 'rgba(39,153,91,.12)' : 'rgba(224,164,0,.16)',
                    color: running ? C.green : C.yellowDeep,
                  }}>{running ? 'Active' : 'Starting'}</Box>
                </Stack>

                {running ? (
                  <Box sx={{ mt: 1.75 }}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.6 }}>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C.deep }}>
                        Week {week} of {weeks}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
                        {ended ? 'Cycle complete' : `${daysLeft} days left in this cycle`}
                      </Typography>
                    </Stack>
                    <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(27,57,91,.08)', overflow: 'hidden' }}>
                      <Box sx={{
                        width: `${Math.min(100, Math.round((run.day / run.total) * 100))}%`,
                        height: '100%', borderRadius: 3, bgcolor: ended ? C.yellowDeep : C.green,
                      }} />
                    </Box>
                  </Box>
                ) : (
                  <Typography sx={{ fontSize: 12, color: C.ink2, mt: 1.5 }}>
                    Your cycle starts on the day of your first dose.
                  </Typography>
                )}

                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 1.5 }}>
                  <Typography sx={{ fontSize: 12, color: C.ink2 }}>View programme</Typography>
                  <ChevronRightIcon sx={{ fontSize: 15, color: C.ink2 }} />
                </Stack>
              </Box>

              {/* ── the renewal, growing out of the same card ── */}
              {renewDue && (
                <Box sx={{
                  px: 2.25, py: 2, borderTop: `1.5px solid ${C.line}`,
                  bgcolor: ended ? 'rgba(255,185,0,.12)' : 'rgba(27,57,91,.03)',
                }}>
                  <Typography sx={{
                    fontSize: 9.5, fontWeight: 800, letterSpacing: '.13em',
                    textTransform: 'uppercase', color: C.yellowDeep,
                  }}>{ended ? 'Your month is complete' : 'Renewal coming up'}</Typography>
                  <Typography sx={{ fontSize: 13.5, lineHeight: 1.55, color: C.ink, mt: 0.75 }}>
                    {ended
                      ? 'Renew to keep going. Your next month is prepared straight away, '
                        + 'and your doctor reviews your dose before it ships.'
                      : 'We prepare your next month a week ahead, so there is no gap '
                        + 'between pens. Renewing books a dose review with your doctor.'}
                  </Typography>
                  <Stack direction="row" spacing={1} onClick={() => onRenew(k)} sx={{
                    alignItems: 'center', justifyContent: 'center', mt: 1.5, py: 1.3,
                    borderRadius: '999px', cursor: 'pointer', bgcolor: C.deep, color: '#fff',
                  }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                      Renew now{price ? ` · SAR ${price.toLocaleString()}` : ''}
                    </Typography>
                    <ArrowForwardIcon sx={{ fontSize: 16 }} />
                  </Stack>
                </Box>
              )}
            </Box>
          );
        })}

        {/* ── the second growth moment ── */}
        <Stack direction="row" spacing={1.5} onClick={onNewGoal} sx={{
          alignItems: 'center', px: 2.25, py: 2, borderRadius: '20px', cursor: 'pointer',
          bgcolor: '#fff', border: `1.5px dashed rgba(27,57,91,.25)`,
        }}>
          <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 20, color: C.deep }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
              Start something new
            </Typography>
            <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.2 }}>
              Another goal, alongside what you are already running.
            </Typography>
          </Box>
          <ArrowForwardIcon sx={{ fontSize: 17, color: C.ink2 }} />
        </Stack>
      </Stack>
    </Box>
  );
}
