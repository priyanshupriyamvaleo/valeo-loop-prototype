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
 * Two choices and nothing else: the medication (Wegovy or Mounjaro, each
 * with its own price) and the term (monthly rolling, or 3 months in one
 * payment). Everything the money buys sits in ONE table, three sections in
 * the practice's three voices, with a tick column per term, because the
 * starter kit and the nurse's first-dose visit belong to the 3-month plan
 * only. The selected term's column is tinted so the table always answers
 * "what does MY choice include". Mirrors the live Valeo platform, minus
 * the blood test, which is not part of this plan.
 *
 * One number per moment: each card carries its own price, the CTA carries
 * only the selected one.
 */
const SECTION_TONES = ['#1B395B', '#1E7F76', '#B77800'];

export default function PlanScreen({ plan, eligible, onBack, onPaid }) {
  const [medKey, setMedKey] = useState(plan.meds[0].key);
  const [dur, setDur] = useState('monthly');       /* monthly | quarter */
  const [pay, setPay] = useState(false);

  const med = plan.meds.find((m) => m.key === medKey) || plan.meds[0];
  const perMonth3 = Math.round(med.quarter / 3);
  const price = dur === 'monthly' ? med.monthly : med.quarter;
  /* The CTA carries the cadence, not just the number: a subscription must
     never read as a one-time month. */
  const priceLabel = dur === 'monthly'
    ? `SAR ${price.toLocaleString()} a month`
    : `SAR ${price.toLocaleString()} for 3 months`;

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

        {/* ── choice one: the medication ── */}
        <Stack direction="row" spacing={1} sx={{ mt: 2.25 }}>
          {plan.meds.map((m) => {
            const on = medKey === m.key;
            return (
              <Box key={m.key} onClick={() => setMedKey(m.key)} sx={{
                flex: 1, px: 1.6, py: 1.3, borderRadius: '16px', cursor: 'pointer',
                bgcolor: '#fff',
                border: `1.5px solid ${on ? C.yellow : 'rgba(27,57,91,.12)'}`,
                boxShadow: on ? '0 10px 26px -18px rgba(224,164,0,.7)' : 'none',
                transition: 'border-color .2s, box-shadow .2s',
              }}>
                <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 17, fontWeight: 600,
                  color: C.deep, lineHeight: 1.1,
                }}>{m.name}</Typography>
                <Typography sx={{ fontSize: 10, color: C.ink2, mt: 0.35 }}>{m.generic}</Typography>
                <Typography sx={{ fontSize: 10.5, fontWeight: 600, color: on ? C.yellowDeep : C.ink2, mt: 0.6 }}>
                  from SAR {m.monthly.toLocaleString()} a month
                </Typography>
              </Box>
            );
          })}
        </Stack>

        {/* ── choice two: the term ── */}
        <Stack direction="row" spacing={1} sx={{ mt: 1.25 }}>
          {[
            { k: 'monthly', t: 'Monthly', big: `SAR ${med.monthly.toLocaleString()}`,
              sub: 'a month', renew: 'Renews monthly until you stop.' },
            { k: 'quarter', t: '3 months', pop: true, big: `SAR ${med.quarter.toLocaleString()}`,
              sub: `SAR ${perMonth3.toLocaleString()} a month`,
              renew: 'One payment. Renews every 3 months.' },
          ].map((o) => {
            const on = dur === o.k;
            return (
              <Box key={o.k} onClick={() => setDur(o.k)} sx={{
                flex: 1, px: 1.6, py: 1.5, borderRadius: '16px', cursor: 'pointer',
                bgcolor: '#fff', position: 'relative',
                border: `1.5px solid ${on ? C.yellow : 'rgba(27,57,91,.12)'}`,
                boxShadow: on ? '0 10px 26px -18px rgba(224,164,0,.7)' : 'none',
                transition: 'border-color .2s, box-shadow .2s',
              }}>
                <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 12, fontWeight: 700, color: on ? C.yellowDeep : C.ink2 }}>
                    {o.t}
                  </Typography>
                  {o.pop && (
                    <Typography sx={{
                      px: 0.7, py: 0.15, borderRadius: '6px', fontSize: 7.5, fontWeight: 800,
                      letterSpacing: '.08em', textTransform: 'uppercase',
                      bgcolor: 'rgba(224,164,0,.14)', color: C.yellowDeep,
                    }}>Most popular</Typography>
                  )}
                </Stack>
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

        {/* ── what the money buys: one table, three voices, a column per term ── */}
        <Box sx={{
          mt: 1.75, px: 2, pt: 1.25, pb: 1.5, borderRadius: '18px', bgcolor: '#fff',
          boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
        }}>
          {/* the column heads */}
          <Stack direction="row" sx={{ alignItems: 'center', pb: 0.5 }}>
            <Box sx={{ flex: 1 }} />
            {[['monthly', 'Monthly'], ['quarter', '3 mo']].map(([k, t]) => (
              <Typography key={k} onClick={() => setDur(k)} sx={{
                width: 46, textAlign: 'center', fontSize: 8.5, fontWeight: 800,
                letterSpacing: '.08em', textTransform: 'uppercase', cursor: 'pointer',
                color: dur === k ? C.yellowDeep : C.ink2,
                opacity: dur === k ? 1 : 0.65,
              }}>{t}</Typography>
            ))}
          </Stack>

          {plan.sections.map((sec, sn) => (
            <Box key={sec.h}>
              <Typography sx={{
                fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: SECTION_TONES[sn % 3],
                mt: sn === 0 ? 0.5 : 1.5, mb: 0.25,
              }}>{sec.h}</Typography>
              {sec.rows.map((row, i) => (
                <Stack key={row.t} direction="row" sx={{
                  alignItems: 'center',
                  borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
                }}>
                  <Typography sx={{ flex: 1, fontSize: 11.5, color: C.ink, lineHeight: 1.4, py: 0.85 }}>
                    {row.t}
                  </Typography>
                  {[['monthly', row.m], ['quarter', row.q]].map(([k, has]) => (
                    <Box key={k} sx={{
                      width: 46, alignSelf: 'stretch', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      bgcolor: dur === k ? 'rgba(224,164,0,.07)' : 'transparent',
                    }}>
                      {has
                        ? <CheckIcon sx={{
                            fontSize: 14, color: C.yellowDeep,
                            opacity: dur === k ? 1 : 0.45,
                          }} />
                        : <Typography sx={{ fontSize: 11, color: C.ink2, opacity: 0.5 }}>—</Typography>}
                    </Box>
                  ))}
                </Stack>
              ))}
            </Box>
          ))}
        </Box>

        {/* the guarantee: the line under everything money */}
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
          sx={{ py: 1.4, fontSize: 14.5 }}>
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
        item={`${med.name} · ${dur === 'monthly' ? 'monthly subscription' : '3 months, one payment'}`}
        fee={dur === 'monthly' ? `${price.toLocaleString()} a month` : price.toLocaleString()}
        note={`${dur === 'monthly'
          ? 'Renews monthly until you stop.'
          : 'One payment for 3 months. Renews every 3 months unless you stop.'} ${plan.guarantee}`}
        onClose={() => setPay(false)} onDone={() => onPaid(dur, med)} />
    </Box>
  );
}
