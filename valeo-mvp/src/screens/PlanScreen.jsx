import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import PaySheet from '../components/PaySheet';
import { C } from '../theme';

/*
 * THE PLAN — one PDP, rendered entirely from the category manager's config.
 *
 * Nothing on this screen is hardcoded: name, tagline, prices, the includes
 * checklist and the guarantee all come from `plan` (st.plan), which the
 * console edits live. Structure per docs/PLAN_STRUCTURE.md: all-in with
 * medication included, monthly or 3 months in one payment, flat price at
 * every dose, and the refund guarantee that makes pay-before-approval clean.
 *
 * One number per moment: the selector shows each option's own price; the CTA
 * carries only the selected one.
 */
export default function PlanScreen({ plan, eligible, onBack, onPaid }) {
  const [dur, setDur] = useState('monthly');       /* monthly | quarter */
  const [pay, setPay] = useState(false);

  const perMonth3 = Math.round(plan.quarterTotal / 3);
  const price = dur === 'monthly' ? plan.monthly : plan.quarterTotal;
  /* The CTA carries the cadence, not just the number: a subscription must
     never read as a one-time month. */
  const priceLabel = dur === 'monthly'
    ? `SAR ${price.toLocaleString()} a month`
    : `SAR ${price.toLocaleString()}`;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FAF6ED' }}>
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.75, pt: 1.75, pb: 2 }}>
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton onClick={onBack} size="small" sx={{
            width: 34, height: 34, bgcolor: '#fff', color: C.deep,
            boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
            '&:hover': { bgcolor: '#fff' },
          }}>
            <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
          </IconButton>
          {plan.status === 'draft' && (
            <Typography sx={{
              px: 1, py: 0.4, borderRadius: '7px', fontSize: 9, fontWeight: 800,
              letterSpacing: '.1em', textTransform: 'uppercase',
              bgcolor: 'rgba(233,79,95,.12)', color: C.coral,
            }}>Draft</Typography>
          )}
        </Stack>

        <Typography sx={{
          fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em',
          textTransform: 'uppercase', color: C.yellowDeep, mt: 2,
        }}>{eligible ? 'Confirmed by your doctor' : 'Based on your answers'}</Typography>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 28, fontWeight: 600,
          lineHeight: 1.15, color: C.deep, mt: 0.75,
        }}>{plan.name}</Typography>
        <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: C.ink2, mt: 0.75 }}>
          {plan.tagline}
        </Typography>

        {/* ── the two durations, nothing else to choose ── */}
        <Stack direction="row" spacing={1} sx={{ mt: 2.25 }}>
          {[
            { k: 'monthly', t: 'Monthly', big: `SAR ${plan.monthly.toLocaleString()}`,
              sub: 'a month', renew: 'Renews monthly until you stop.' },
            { k: 'quarter', t: '3 months', big: `SAR ${plan.quarterTotal.toLocaleString()}`,
              sub: `SAR ${perMonth3.toLocaleString()} a month`,
              renew: 'One payment. Renews every 3 months.' },
          ].map((o) => {
            const on = dur === o.k;
            return (
              <Box key={o.k} onClick={() => setDur(o.k)} sx={{
                flex: 1, px: 1.6, py: 1.5, borderRadius: '16px', cursor: 'pointer',
                bgcolor: '#fff',
                border: `1.5px solid ${on ? C.yellow : 'rgba(27,57,91,.12)'}`,
                boxShadow: on ? '0 10px 26px -18px rgba(224,164,0,.7)' : 'none',
                transition: 'border-color .2s, box-shadow .2s',
              }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: on ? C.yellowDeep : C.ink2 }}>
                  {o.t}
                </Typography>
                <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 20, fontWeight: 600,
                  color: C.deep, mt: 0.4, lineHeight: 1.1,
                }}>{o.big}</Typography>
                <Typography sx={{ fontSize: 10.5, color: C.ink2, mt: 0.3 }}>{o.sub}</Typography>
                <Typography sx={{ fontSize: 9.5, color: C.ink2, mt: 0.5, lineHeight: 1.35 }}>
                  {o.renew}
                </Typography>
              </Box>
            );
          })}
        </Stack>

        {/* ── what the money buys, from the console ── */}
        <Box sx={{
          mt: 1.75, px: 2, py: 1.25, borderRadius: '18px', bgcolor: '#fff',
          boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
        }}>
          {plan.includes.map((t, i) => (
            <Stack key={t} direction="row" spacing={1.1} sx={{
              alignItems: 'flex-start', py: 1.05,
              borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
            }}>
              <CheckIcon sx={{ fontSize: 15, color: C.yellowDeep, flexShrink: 0, mt: '2px' }} />
              <Typography sx={{ fontSize: 12.5, color: C.ink, lineHeight: 1.45 }}>{t}</Typography>
            </Stack>
          ))}
        </Box>

        {/* the guarantee: what makes paying before the review safe */}
        <Stack direction="row" spacing={1.1} sx={{
          mt: 1.75, px: 1.75, py: 1.4, borderRadius: '14px',
          bgcolor: 'rgba(39,153,91,.08)', alignItems: 'flex-start',
        }}>
          <VerifiedUserOutlinedIcon sx={{ fontSize: 17, color: C.green, flexShrink: 0, mt: '1px' }} />
          <Typography sx={{ fontSize: 12, lineHeight: 1.5, color: C.deep }}>
            {plan.guarantee}
          </Typography>
        </Stack>
      </Box>

      <Box sx={{
        flexShrink: 0, px: 2.75, pt: 1.5, pb: 2,
        borderTop: `1px solid ${C.line}`, bgcolor: '#FAF6ED',
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => setPay(true)}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{ py: 1.4, fontSize: 15.5 }}>
          Start my plan · {priceLabel}
        </Button>
        <Stack direction="row" spacing={0.6} sx={{
          alignItems: 'center', justifyContent: 'center', mt: 1,
        }}>
          <LockOutlinedIcon sx={{ fontSize: 12, color: C.ink2 }} />
          <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', lineHeight: 1.45 }}>
            {eligible
              ? 'Your doctor has confirmed your eligibility. Dispatch follows payment.'
              : 'A doctor reviews your order today, before anything ships.'}
          </Typography>
        </Stack>
      </Box>

      <PaySheet open={pay}
        item={`${plan.name} · ${dur === 'monthly' ? 'monthly subscription' : '3 months, one payment'}`}
        fee={dur === 'monthly' ? `${price.toLocaleString()} a month` : price.toLocaleString()}
        note={`${dur === 'monthly'
          ? 'Renews monthly until you stop.'
          : 'One payment for 3 months. Renews every 3 months unless you stop.'} ${plan.guarantee}`}
        onClose={() => setPay(false)} onDone={() => onPaid(dur)} />
    </Box>
  );
}
