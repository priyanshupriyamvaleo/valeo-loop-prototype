import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PaySheet from '../components/PaySheet';
import { PROTOCOLS, careIncludes, carePlans, careSteps,
         coachOf, givenNameOf } from '../data';
import { C } from '../theme';

/**
 * SCREEN TWO — THE COMMITMENT.
 *
 * The screen before answers "do I want this care?". This one answers "what
 * exactly am I committing to?". Two psychological moments, so two screens.
 *
 * This screen is allowed to be more transactional, and that is deliberate. A
 * patient who has already decided wants the terms stated plainly. Vagueness at
 * the moment of payment reads as evasion.
 *
 * ── THE TWO PLANS ──
 * The care is identical in both. The only difference is whether Valeo dispenses
 * and delivers the medication, or the patient takes the prescription elsewhere.
 * That is a genuine choice, and it is the only choice on this screen.
 *
 * Neither plan is marked "recommended" and neither is styled to win. This is
 * not a good plan and a better plan. Manufacturing a preference here would
 * undo the whole point of the screen before it, which is that the clinician
 * has already made the recommendation. The patient is choosing a supply
 * arrangement, not choosing a level of care.
 *
 * The switch is one control at the top rather than two cards side by side. Two
 * cards would invite comparison of the care itself, and the care does not
 * differ. One price changes; one line in the list changes; nothing else moves.
 *
 * ── WHY THE CHEAPER PLAN IS NOT DIMINISHED ──
 * On the care plan the prescription is still written and still included. The
 * list says so. A plan that reads as "care with the medicine removed" pushes
 * people to the expensive option out of doubt rather than out of preference.
 *
 * ── THE SEQUENCING IS THE HARD PART ──
 * The clinician cannot confirm treatment before seeing blood results. "You
 * cannot get your plan until your blood test" makes the patient feel blocked.
 * "Your treatment is ready" is false. So the steps state the order as ordinary
 * clinical sequence, and one line says care starts now.
 *
 * ── NO INTERNAL ACCOUNTING, AND NO "IT WAS FREE" ──
 * One price for one course of care. And no reminder that the consultation cost
 * nothing, which would build the pattern free, then pay.
 */
export default function Buy({ pKey, onBack, onPaid }) {
  const p = PROTOCOLS[pKey];
  const c = coachOf(pKey);
  const [plan, setPlan] = useState('care');
  const [pay, setPay] = useState(false);

  if (!p || !c) return null;
  const first = givenNameOf(c);
  const plans = carePlans(pKey);
  const sel = plans.find((x) => x.k === plan) || plans[0];
  const withMeds = plan === 'meds';
  const includes = careIncludes(first, c.short, withMeds);
  const steps = careSteps(first);
  const price = sel.fee.toLocaleString();

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      <Stack direction="row" sx={{ alignItems: 'center', px: 1.5, pt: 1.5, pb: 0.5 }}>
        <IconButton onClick={onBack} size="small" sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 3, pb: 2 }}>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 31, fontWeight: 600,
          lineHeight: 1.14, color: C.deep, mt: 0.5,
        }}>Your care</Typography>

        <Typography sx={{ fontSize: 15.5, color: C.ink2, mt: 1.2, lineHeight: 1.5 }}>
          Personalised care with {first} and the practice team.
        </Typography>

        {/* ── THE ONLY CHOICE ON THIS SCREEN ── */}
        <Stack direction="row" spacing={0.5} sx={{
          mt: 3.25, p: 0.5, borderRadius: '999px', bgcolor: 'rgba(27,57,91,.055)',
        }}>
          {plans.map((x) => (
            <Box key={x.k} onClick={() => setPlan(x.k)} sx={{
              flex: 1, textAlign: 'center', py: 1.05, borderRadius: '999px', cursor: 'pointer',
              fontSize: 13.5, fontWeight: plan === x.k ? 700 : 500,
              bgcolor: plan === x.k ? '#fff' : 'transparent',
              color: plan === x.k ? C.deep : C.ink2,
              boxShadow: plan === x.k ? '0 2px 10px -6px rgba(27,57,91,.45)' : 'none',
              transition: 'background-color .25s, color .25s',
            }}>{x.t}</Box>
          ))}
        </Stack>

        <Typography sx={{
          fontSize: 12.5, color: C.ink2, mt: 1.4, textAlign: 'center', lineHeight: 1.5,
        }}>{sel.note}</Typography>

        {/* The price, and it changes with the choice above it. */}
        {/* Stacked, not side by side. "SAR 2,400" beside "16-week course of
            care" wraps the price onto two lines at this width, and a price
            that breaks mid-number reads as a layout fault. */}
        <Box sx={{ mt: 3.25, pb: 3, borderBottom: `1px solid ${C.line}` }}>
          <Typography key={sel.k} sx={{
            fontFamily: '"Fraunces", serif', fontSize: 34, fontWeight: 600,
            color: C.deep, lineHeight: 1.1,
            animation: 'priceIn .35s cubic-bezier(.2,.9,.25,1) both',
            '@keyframes priceIn': {
              from: { opacity: 0, transform: 'translateY(5px)' },
              to: { opacity: 1, transform: 'none' },
            },
          }}>SAR {price}</Typography>
          <Typography sx={{ fontSize: 13.5, color: C.ink2, mt: 0.6 }}>
            {p.wk}-week course of care
          </Typography>
        </Box>

        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.ink2, mt: 4, mb: 2.5,
        }}>Your care includes</Typography>

        <Stack spacing={2.5}>
          {includes.map((x) => (
            <Box key={x.t}>
              <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.deep, lineHeight: 1.3 }}>
                {x.t}
              </Typography>
              <Typography sx={{
                fontSize: 14, lineHeight: 1.5, color: C.ink2, mt: 0.4, maxWidth: 290,
              }}>{x.s}</Typography>
            </Box>
          ))}
        </Stack>

        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.ink2,
          mt: 5, pt: 3.5, borderTop: `1px solid ${C.line}`, mb: 2.5,
        }}>What happens next</Typography>

        <Stack spacing={2.5}>
          {steps.map((x, n) => (
            <Stack key={x.t} direction="row" spacing={1.9} sx={{ alignItems: 'flex-start' }}>
              <Typography sx={{
                fontFamily: '"Fraunces", serif', fontSize: 14, fontWeight: 600,
                color: C.yellowDeep, flexShrink: 0, width: 22, mt: '2px',
              }}>{String(n + 1).padStart(2, '0')}</Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.deep, lineHeight: 1.3 }}>
                  {x.t}
                </Typography>
                <Typography sx={{ fontSize: 14, lineHeight: 1.5, color: C.ink2, mt: 0.3 }}>
                  {x.s}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Stack>

        {/* Sequencing, not a disclaimer. */}
        <Typography sx={{
          fontSize: 14.5, lineHeight: 1.6, color: C.deep, mt: 4,
          px: 2.25, py: 2, borderRadius: '16px', bgcolor: 'rgba(224,164,0,.1)',
        }}>
          Your care starts now. {first} confirms your treatment once your blood
          results are in.
        </Typography>
      </Box>

      <Box sx={{
        px: 3, pt: 4, pb: 3, flexShrink: 0, mt: -3,
        background: `linear-gradient(180deg,rgba(255,253,245,0) 0%,${C.cream} 52%)`,
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => setPay(true)}>
          Continue my care · SAR {price}
        </Button>
        <Typography sx={{
          fontSize: 12, color: C.ink2, textAlign: 'center', mt: 1.3, lineHeight: 1.5,
        }}>
          {withMeds
            ? 'One payment. Medication included for the whole course.'
            : 'One payment. Nothing further to pay Valeo at any later step.'}
        </Typography>
      </Box>

      <PaySheet open={pay} item={`Care with ${c.short}’s practice`} fee={price}
        onClose={() => setPay(false)} onDone={onPaid} />
    </Box>
  );
}
