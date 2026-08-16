import { Box, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckIcon from '@mui/icons-material/Check';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { COACHES, USER, cycleState, focusRun, planPrice } from '../data';
import { C } from '../theme';

/*
 * MY PROGRAMME.
 *
 * Today answers "what do I do now". This answers "what am I in, and what is it
 * costing me" — the question every subscription eventually gets asked, and the
 * one most health apps hide because the honest answer is a cancel button.
 *
 * The shape is borrowed from the subscription services that people do not
 * resent: what you are on, when it renews, what it costs, and one plain way to
 * change it. Burying that is what makes a subscription feel like a trap; saying
 * it out loud is most of what makes this one feel like care.
 *
 * The cycle-end card is the important beat. A month of medication running out
 * is not a billing event, it is a clinical one: renew, and the next thing you
 * do is book the dose review.
 */
export default function Program({ st, onGo, onRenew, onBookTitration, onNewGoal }) {
  const rx = focusRun(st);
  const doc = COACHES.C_LAYLA;

  if (!rx) {
    return (
      <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: C.cream, px: 3, pt: 5 }}>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 600, color: C.deep,
        }}>Nothing running yet.</Typography>
        <Typography sx={{ fontSize: 14.5, color: C.ink2, mt: 1.25, lineHeight: 1.6 }}>
          When you start a programme it lives here: what you are on, when it renews,
          and what it costs.
        </Typography>
        <Stack direction="row" spacing={1.25} onClick={onNewGoal} sx={{
          alignItems: 'center', mt: 3, px: 2, py: 1.75, borderRadius: '16px',
          bgcolor: C.deep, color: '#fff', cursor: 'pointer',
        }}>
          <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography sx={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>
            Tell us what you want to work on
          </Typography>
          <ArrowForwardIcon sx={{ fontSize: 18 }} />
        </Stack>
      </Box>
    );
  }

  const cyc = cycleState(rx);
  const price = planPrice(st.plan, rx.med, rx.duration);
  const termLabel = rx.duration === 'quarter' ? '3-month plan' : 'Monthly plan';

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: C.cream, pb: 5 }}>
      <Box sx={{ px: 3, pt: 3 }}>
        <Typography sx={{ fontSize: 12.5, color: C.ink2 }}>{USER.first}’s programme</Typography>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 600,
          color: C.deep, mt: 0.25,
        }}>{st.plan.name}</Typography>
      </Box>

      {/* ── the cycle-end moment, when it is close ── */}
      {cyc.endingSoon && (
        <Box sx={{ px: 3, mt: 2.5 }}>
          <Box sx={{
            px: 2.25, py: 2, borderRadius: '18px',
            bgcolor: C.deep, color: '#fff',
          }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <AutorenewIcon sx={{ fontSize: 17, color: C.yellow }} />
              <Typography sx={{
                fontSize: 10.5, fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: C.yellow,
              }}>{cyc.ended ? 'Your plan has ended' : `Renews in ${cyc.daysLeft} days`}</Typography>
            </Stack>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 19, fontWeight: 600, mt: 1, lineHeight: 1.35,
            }}>
              {cyc.ended
                ? 'Keep going with your treatment.'
                : `Your ${rx.duration === 'quarter' ? 'three months' : 'month'} is nearly up.`}
            </Typography>
            <Typography sx={{ fontSize: 13.5, lineHeight: 1.6, color: 'rgba(255,255,255,.75)', mt: 1 }}>
              Renew and your next delivery is prepared straight away. Then book your dose
              review, so {doc.short} can set the right dose for the month ahead.
            </Typography>
            <Stack direction="row" spacing={1} onClick={onRenew} sx={{
              alignItems: 'center', justifyContent: 'center', mt: 2, py: 1.35,
              borderRadius: '999px', bgcolor: C.yellow, color: C.deep, cursor: 'pointer',
            }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                Renew · SAR {price.toLocaleString()}
              </Typography>
              <ArrowForwardIcon sx={{ fontSize: 17 }} />
            </Stack>
          </Box>
        </Box>
      )}

      {/* ── what you are on ── */}
      <Box sx={{ px: 3, mt: 2.5 }}>
        <Box sx={{
          px: 2.25, py: 2.25, borderRadius: '18px', bgcolor: '#fff',
          boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
        }}>
          <Stack direction="row" sx={{ alignItems: 'flex-start' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 17, fontWeight: 700, color: C.deep }}>
                {rx.med || 'Your medication'}
              </Typography>
              <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 0.3 }}>
                {termLabel} · {cyc.doseLabel}
              </Typography>
            </Box>
            <Box sx={{
              px: 1.25, py: 0.5, borderRadius: '999px', bgcolor: 'rgba(39,153,91,.12)',
              color: C.green, fontSize: 11, fontWeight: 700,
            }}>Active</Box>
          </Stack>

          {/* progress through the cycle */}
          <Box sx={{ mt: 2 }}>
            <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 0.75 }}>
              <Typography sx={{ fontSize: 11.5, fontWeight: 600, color: C.deep }}>
                Week {cyc.week} of {cyc.weeks}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
                {cyc.daysLeft} days left in this cycle
              </Typography>
            </Stack>
            <Box sx={{ height: 6, borderRadius: 3, bgcolor: 'rgba(27,57,91,.08)', overflow: 'hidden' }}>
              <Box sx={{
                width: `${Math.min(100, Math.round((cyc.week / cyc.weeks) * 100))}%`,
                height: '100%', borderRadius: 3, bgcolor: C.green,
              }} />
            </Box>
          </Box>

          <Stack spacing={1.25} sx={{ mt: 2.25 }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <LocalShippingOutlinedIcon sx={{ fontSize: 17, color: C.ink2 }} />
              <Typography sx={{ flex: 1, fontSize: 13, color: C.ink }}>Next delivery</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.deep }}>{cyc.nextDelivery}</Typography>
            </Stack>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <EventOutlinedIcon sx={{ fontSize: 17, color: C.ink2 }} />
              <Typography sx={{ flex: 1, fontSize: 13, color: C.ink }}>Next dose review</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: cyc.titrationDue ? C.yellowDeep : C.deep }}>
                {cyc.titrationDue ? 'Due now' : cyc.nextConsult}
              </Typography>
            </Stack>
          </Stack>

          {cyc.titrationDue && (
            <Stack direction="row" spacing={1} onClick={onBookTitration} sx={{
              alignItems: 'center', justifyContent: 'center', mt: 2, py: 1.25,
              borderRadius: '999px', bgcolor: C.yellow, color: C.deep, cursor: 'pointer',
            }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>Book my dose review</Typography>
              <ArrowForwardIcon sx={{ fontSize: 16 }} />
            </Stack>
          )}
        </Box>
      </Box>

      {/* ── the subscription, said plainly ── */}
      <Box sx={{ px: 3, mt: 2.5 }}>
        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.ink2, mb: 1,
        }}>Your subscription</Typography>
        <Box sx={{
          borderRadius: '18px', bgcolor: '#fff', overflow: 'hidden',
          boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
        }}>
          {[
            ['Plan', termLabel],
            ['Price', `SAR ${price.toLocaleString()} ${rx.duration === 'quarter' ? 'every 3 months' : 'a month'}`],
            [cyc.ended ? 'Ended' : 'Renews', cyc.renewsOn],
            ['Paid with', 'Apple Pay'],
          ].map(([k, v], i) => (
            <Stack key={k} direction="row" sx={{
              px: 2, py: 1.4, alignItems: 'center',
              borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
            }}>
              <Typography sx={{ flex: 1, fontSize: 13, color: C.ink2 }}>{k}</Typography>
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.deep }}>{v}</Typography>
            </Stack>
          ))}
        </Box>

        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
          {['Pause a month', 'Change plan', 'Stop'].map((t) => (
            <Box key={t} sx={{
              flex: 1, textAlign: 'center', py: 1.1, borderRadius: '12px',
              border: `1px solid ${C.line}`, bgcolor: '#fff',
              fontSize: 12.5, fontWeight: 600, color: C.deep, cursor: 'pointer',
            }}>{t}</Box>
          ))}
        </Stack>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 1, lineHeight: 1.55 }}>
          Pause or cancel anytime. If you stop, we tell your doctor so nobody is left
          wondering what happened.
        </Typography>
      </Box>

      {/* ── what is included, from the plan itself ── */}
      <Box sx={{ px: 3, mt: 2.5 }}>
        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.ink2, mb: 1,
        }}>What’s included</Typography>
        <Box sx={{
          px: 2, py: 1.25, borderRadius: '18px', bgcolor: '#fff',
          boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
        }}>
          {(st.plan.sections || []).flatMap((sec) => sec.rows)
            .filter((r) => (rx.duration === 'quarter' ? r.q : r.m))
            .map((r, i) => (
              <Stack key={r.t} direction="row" spacing={1.1} sx={{
                alignItems: 'flex-start', py: 0.9,
                borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
              }}>
                <CheckIcon sx={{ fontSize: 15, color: C.yellowDeep, mt: '2px', flexShrink: 0 }} />
                <Typography sx={{ fontSize: 12.5, color: C.ink, lineHeight: 1.45 }}>{r.t}</Typography>
              </Stack>
            ))}
        </Box>
      </Box>

      {/* ── another goal ── */}
      <Box sx={{ px: 3, mt: 3 }}>
        <Stack direction="row" spacing={1.25} onClick={onNewGoal} sx={{
          alignItems: 'center', px: 2, py: 1.75, borderRadius: '16px',
          border: `1.5px dashed ${C.line}`, cursor: 'pointer',
        }}>
          <ChatBubbleOutlineOutlinedIcon sx={{ fontSize: 18, color: C.deep }} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 600, color: C.deep }}>
              Work on something else too
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>
              Tell us the goal and we will take it from there.
            </Typography>
          </Box>
          <ArrowForwardIcon sx={{ fontSize: 17, color: C.ink2 }} />
        </Stack>
      </Box>
    </Box>
  );
}
