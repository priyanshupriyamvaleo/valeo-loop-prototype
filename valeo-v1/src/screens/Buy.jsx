import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import PaySheet from '../components/PaySheet';
import { carePlan, coachOf, givenNameOf } from '../data';
import { C } from '../theme';

/* Data names a concept, this maps it to a glyph — so data.js never imports
   a component library. */
const ICONS = {
  test: ScienceOutlinedIcon, doc: DescriptionOutlinedIcon, rx: MedicationOutlinedIcon,
  box: Inventory2OutlinedIcon, cal: CalendarMonthOutlinedIcon, chat: ChatBubbleOutlineIcon,
  chart: BarChartIcon, tune: TuneIcon, food: RestaurantMenuIcon,
  gym: FitnessCenterIcon, cgm: MonitorHeartOutlinedIcon,
};

/**
 * SCREEN TWO — THE 12-WEEK CARE PLAN.
 *
 * Layout and styling reproduce the stakeholder's approved mock (Aug 2026):
 * header with the clinician's portrait opposite the back button, the price
 * in a white card beside a shield that says who is accountable, the care
 * table as icon rows with right-aligned timings and a gold chevron, the
 * journey and included lists side by side as two half-width cards, the
 * sequencing note behind an info icon, and the gold CTA in the page flow
 * with a lock line under it.
 *
 * ── ONE PLAN, NO CHOOSING ──
 * The clinician recommended a specific course of care, so there is nothing
 * to pick. The page presents the single complete loop — baseline,
 * understand, treat, follow, reassess — and the only decision is to start.
 *
 * ── EVERYTHING IS DATA ──
 * Rows, timings, journey stages and the included list come from
 * carePlan(pKey); the weight programme renders its nutritionist, coach and
 * CGM rows through the same pipe. Nothing on this screen is hardcoded to a
 * programme.
 */
export default function Buy({ pKey, onBack, onPaid }) {
  const c = coachOf(pKey);
  const [pay, setPay] = useState(false);

  if (!c) return null;
  const first = givenNameOf(c);
  const plan = carePlan(pKey);
  const price = plan.price.toLocaleString();

  const card = { borderRadius: '18px', bgcolor: '#fff', boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)' };
  const label = (t, sx) => (
    <Typography sx={{
      fontSize: 10.5, fontWeight: 800, letterSpacing: '.14em',
      textTransform: 'uppercase', color: C.deep, ...sx,
    }}>{t}</Typography>
  );

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#FAF6ED' }}>
      <Box sx={{ px: 2.25, pt: 1.75, pb: 2.5 }}>
        {/* Header: back on the left, the clinician on the right. */}
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton onClick={onBack} size="small" sx={{
            width: 34, height: 34, bgcolor: '#fff', color: C.deep,
            boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
            '&:hover': { bgcolor: '#fff' },
          }}>
            <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
          </IconButton>
          <Box sx={{
            width: 38, height: 38, borderRadius: '50%', overflow: 'hidden',
            bgcolor: C.yellow, border: '2px solid #fff',
            boxShadow: '0 6px 16px -8px rgba(27,57,91,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {c.img
              ? <Box component="img" src={c.img} alt="" sx={{
                  width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                }} />
              : <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 13, fontWeight: 600, color: C.deep,
                }}>{c.mono}</Typography>}
          </Box>
        </Stack>

        <Typography sx={{
          fontSize: 11, fontWeight: 800, letterSpacing: '.18em',
          textTransform: 'uppercase', color: C.yellowDeep, mt: 1.75,
        }}>Your care with {first}</Typography>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 32, fontWeight: 600,
          lineHeight: 1.1, color: C.deep, mt: 0.75,
        }}>12-week care plan</Typography>
        <Typography sx={{ fontSize: 13.5, lineHeight: 1.5, color: C.ink2, mt: 1, maxWidth: 300 }}>
          One structured course of care, guided by {first} and built around your goals.
        </Typography>

        {/* ── the price card ── */}
        <Stack direction="row" sx={{ ...card, mt: 2, px: 2, py: 2, alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 600,
              color: C.deep, lineHeight: 1.1,
            }}>SAR {price}</Typography>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.yellowDeep, mt: 0.5 }}>
              12 weeks of care
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.25 }}>
              One payment to begin your care.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0, pl: 1.5, maxWidth: 140 }}>
            <GppGoodOutlinedIcon sx={{ fontSize: 26, color: C.yellowDeep, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 11.5, lineHeight: 1.4, color: C.deep }}>
              Clinician-led care from start to finish
            </Typography>
          </Stack>
        </Stack>

        {/* ── the care table ── */}
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mt: 2.75, mb: 1.5 }}>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(224,164,0,.4)' }} />
          {label('What’s included & when it happens')}
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(224,164,0,.4)' }} />
        </Stack>

        <Box sx={{ ...card, px: 1.75 }}>
          {plan.rows.map((r, i) => {
            const Ic = ICONS[r.ic] || ScienceOutlinedIcon;
            return (
              <Stack key={r.t} direction="row" spacing={1.25} sx={{
                alignItems: 'center', py: 1.5,
                borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
              }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  bgcolor: 'rgba(27,57,91,.055)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ic sx={{ fontSize: 17, color: C.deep }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 13.5, fontWeight: 700, color: C.deep, lineHeight: 1.25,
                  }}>{r.t}</Typography>
                  <Typography sx={{ fontSize: 11.5, lineHeight: 1.4, color: C.ink2, mt: 0.3 }}>
                    {r.s}
                  </Typography>
                </Box>
                <Typography sx={{
                  flexShrink: 0, maxWidth: 92, textAlign: 'right',
                  fontSize: 11, fontWeight: 700, color: C.deep, lineHeight: 1.3,
                }}>{r.b}</Typography>
                <ChevronRightIcon sx={{ fontSize: 17, color: C.yellowDeep, flexShrink: 0, ml: '2px !important' }} />
              </Stack>
            );
          })}
        </Box>

        {/* ── journey and included, side by side ── */}
        <Stack direction="row" spacing={1.25} sx={{ mt: 1.75, alignItems: 'stretch' }}>
          <Box sx={{ ...card, flex: 1, minWidth: 0, px: 1.75, py: 2 }}>
            {label('Your 12 weeks', { fontSize: 10, mb: 1.75 })}
            {plan.journey.map((j, n) => {
              const Ic = ICONS[j.ic] || ScienceOutlinedIcon;
              const last = n === plan.journey.length - 1;
              return (
                <Stack key={j.t} direction="row" spacing={1.1}>
                  <Stack sx={{ alignItems: 'center' }}>
                    <Box sx={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      bgcolor: C.deep, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ic sx={{ fontSize: 14, color: C.yellow }} />
                    </Box>
                    {!last && <Box sx={{
                      width: 0, flex: 1, my: 0.4,
                      borderLeft: '1.5px dashed rgba(27,57,91,.3)',
                    }} />}
                  </Stack>
                  <Box sx={{ pb: last ? 0 : 1.75, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.6} sx={{ alignItems: 'baseline' }}>
                      <Typography sx={{
                        fontSize: 11.5, fontWeight: 800, color: C.yellowDeep, flexShrink: 0,
                      }}>{String(n + 1).padStart(2, '0')}</Typography>
                      <Typography sx={{
                        fontSize: 12.5, fontWeight: 700, color: C.deep, lineHeight: 1.25,
                      }}>{j.t}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 11, lineHeight: 1.4, color: C.ink2, mt: 0.3 }}>
                      {j.s}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Box>

          <Box sx={{ ...card, flex: 1, minWidth: 0, px: 1.75, py: 2 }}>
            {label('Included in your care', { fontSize: 10, mb: 1.75 })}
            <Stack spacing={1.25}>
              {plan.included.map((t) => (
                <Stack key={t} direction="row" spacing={0.9} sx={{ alignItems: 'flex-start' }}>
                  <CheckCircleOutlineIcon sx={{
                    fontSize: 15, color: C.yellowDeep, flexShrink: 0, mt: '1px',
                  }} />
                  <Typography sx={{ fontSize: 11.5, color: C.ink, lineHeight: 1.4 }}>{t}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>

        {/* How the care works — sequencing, never a blocker. */}
        <Stack direction="row" spacing={1.25} sx={{
          mt: 1.75, px: 1.75, py: 1.75, borderRadius: '14px',
          bgcolor: 'rgba(224,164,0,.09)', alignItems: 'flex-start',
        }}>
          <InfoOutlinedIcon sx={{ fontSize: 18, color: C.yellowDeep, flexShrink: 0, mt: '1px' }} />
          <Typography sx={{ fontSize: 12.5, lineHeight: 1.55, color: C.deep }}>
            {plan.how}
          </Typography>
        </Stack>

        {/* The commitment, in the page flow per the mock. */}
        <Button fullWidth variant="contained" color="secondary" onClick={() => setPay(true)}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{ mt: 2, py: 1.5, fontSize: 15.5 }}>
          Start my care · SAR {price}
        </Button>
        <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center', justifyContent: 'center', mt: 1.25 }}>
          <LockOutlinedIcon sx={{ fontSize: 12, color: C.ink2 }} />
          <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', lineHeight: 1.45 }}>
            12 weeks of clinician-led care, testing, treatment and follow-up. One payment.
          </Typography>
        </Stack>
      </Box>

      <PaySheet open={pay}
        item={`12 weeks of care with ${c.short}`}
        fee={price}
        onClose={() => setPay(false)} onDone={onPaid} />
    </Box>
  );
}
