import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckIcon from '@mui/icons-material/Check';
import PaySheet from '../components/PaySheet';
import { carePlan, coachOf, givenNameOf } from '../data';
import { C } from '../theme';

/**
 * SCREEN TWO — THE 12-WEEK CARE PLAN.
 *
 * Screen one answered "what does my clinician recommend?". This one answers
 * "what exactly does that care consist of, how does it unfold, and what am I
 * committing to?" — in that order, top to bottom.
 *
 * ── ONE PLAN, NO CHOOSING ──
 * The clinician recommended a specific course of care, so there is nothing to
 * pick. An earlier build compared 1-month and 3-month columns; it made the
 * recommendation look like shopping. Now the page presents the single
 * complete loop — baseline, understand, treat, follow, reassess — and the
 * only decision is to start it.
 *
 * ── THE TABLE IS THE CENTRE ──
 * The row anatomy is borrowed from the strongest reference we have: name,
 * one-line plain-English explanation, and a small timing chip on the name
 * line. Rows are separated by hairlines, never boxed into cards — the page
 * should read like a beautifully typeset clinical service plan, not a stack
 * of product tiles.
 *
 * ── THE PRICE IS STRUCTURAL, NOT PROMOTIONAL ──
 * It appears once in the hero at reading scale with "12 weeks of care"
 * beside it, and once inside the CTA where the commitment is made. No
 * savings maths, no badges — there is no alternative plan to compare it to.
 *
 * ── WHAT IS DELIBERATELY ABSENT ──
 * No tiers, no comparison columns, no "best value", no discount language,
 * and no replay of the recommendation from screen one. "Protocol" appears
 * nowhere.
 */
export default function Buy({ pKey, onBack, onPaid }) {
  const c = coachOf(pKey);
  const [pay, setPay] = useState(false);

  if (!c) return null;
  const first = givenNameOf(c);
  const plan = carePlan(pKey);
  const price = plan.price.toLocaleString();

  const label = (t, sx) => (
    <Typography sx={{
      fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
      textTransform: 'uppercase', color: C.ink2, ...sx,
    }}>{t}</Typography>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FAF6ED' }}>
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.75, pt: 1.75, pb: 2 }}>
        <IconButton onClick={onBack} size="small" sx={{
          width: 34, height: 34, bgcolor: '#fff', color: C.deep,
          boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
          '&:hover': { bgcolor: '#fff' },
        }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        </IconButton>

        {/* ── hero: what, how long, how much ── */}
        {label(`Your care with ${first}`, { color: C.yellowDeep, letterSpacing: '.2em', mt: 2.25 })}
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 30, fontWeight: 600,
          lineHeight: 1.12, color: C.deep, mt: 1.25,
        }}>12-week care plan</Typography>
        <Typography sx={{ fontSize: 13.5, lineHeight: 1.55, color: C.ink2, mt: 1, maxWidth: 300 }}>
          One structured course of care, guided by {first} and built around your goals.
        </Typography>

        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'baseline', mt: 2.5 }}>
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 30, fontWeight: 600, color: C.deep,
          }}>SAR {price}</Typography>
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>
            12 weeks of care
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.5 }}>
          One payment to begin your care.
        </Typography>

        {/* ── the care table — the centre of the page ── */}
        <Box sx={{ mt: 2, borderTop: `1px solid ${C.line}` }}>
          {plan.rows.map((r) => (
            <Box key={r.t} sx={{ py: 1.6, borderBottom: `1px solid ${C.line}` }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Typography sx={{
                  fontSize: 14.5, fontWeight: 700, color: C.deep, lineHeight: 1.25,
                }}>{r.t}</Typography>
                <Typography sx={{
                  flexShrink: 0, px: 0.9, py: 0.3, borderRadius: '6px',
                  fontSize: 9, fontWeight: 800, letterSpacing: '.07em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                  bgcolor: 'rgba(224,164,0,.13)', color: C.yellowDeep,
                }}>{r.b}</Typography>
              </Stack>
              <Typography sx={{ fontSize: 12.5, lineHeight: 1.5, color: C.ink2, mt: 0.5 }}>
                {r.s}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* ── the loop, so 12 weeks reads as a designed arc, not a duration ── */}
        {label('Your 12 weeks', { mt: 3.5, mb: 2 })}
        <Stack spacing={0}>
          {plan.journey.map((j, n) => (
            <Stack key={j.t} direction="row" spacing={1.75}>
              <Stack sx={{ alignItems: 'center' }}>
                <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 13, fontWeight: 600,
                  color: C.yellowDeep, width: 24, textAlign: 'center', flexShrink: 0,
                }}>{String(n + 1).padStart(2, '0')}</Typography>
                {n < plan.journey.length - 1 && (
                  <Box sx={{ width: '1.5px', flex: 1, bgcolor: 'rgba(224,164,0,.35)', my: 0.5 }} />
                )}
              </Stack>
              <Box sx={{ pb: n < plan.journey.length - 1 ? 2 : 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep, lineHeight: 1.3 }}>
                  {j.t}
                </Typography>
                <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 0.25 }}>{j.s}</Typography>
              </Box>
            </Stack>
          ))}
        </Stack>

        {/* ── included — removes uncertainty, sells nothing ── */}
        {label('Included in your care', { mt: 3.5, mb: 1.5 })}
        <Stack spacing={1}>
          {plan.included.map((t) => (
            <Stack key={t} direction="row" spacing={1.1} sx={{ alignItems: 'center' }}>
              <CheckIcon sx={{ fontSize: 15, color: C.yellowDeep, flexShrink: 0 }} />
              <Typography sx={{ fontSize: 13, color: C.ink, lineHeight: 1.4 }}>{t}</Typography>
            </Stack>
          ))}
        </Stack>

        {/* How the care works — sequencing, never a blocker. */}
        <Typography sx={{
          fontSize: 13, lineHeight: 1.6, color: C.deep, mt: 3,
          px: 2, py: 1.75, borderRadius: '14px', bgcolor: 'rgba(224,164,0,.1)',
        }}>{plan.how}</Typography>
      </Box>

      {/* ── the commitment, always reachable ── */}
      <Box sx={{
        px: 2.75, pt: 1.75, pb: 2.25, flexShrink: 0,
        borderTop: `1px solid ${C.line}`, bgcolor: '#FAF6ED',
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => setPay(true)}
          sx={{ py: 1.4, fontSize: 15 }}>
          Start my care · SAR {price}
        </Button>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 1, textAlign: 'center' }}>
          One payment. Your complete 12-week care plan.
        </Typography>
      </Box>

      <PaySheet open={pay}
        item={`12 weeks of care with ${c.short}`}
        fee={price}
        onClose={() => setPay(false)} onDone={onPaid} />
    </Box>
  );
}
