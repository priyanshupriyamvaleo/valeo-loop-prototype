import { useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PaySheet from '../components/PaySheet';
import { PROTOCOLS, carePlans, careSteps, planItems, coachOf, givenNameOf } from '../data';
import { C } from '../theme';

/**
 * SCREEN TWO — CHOOSE YOUR CARE.
 *
 * Two lengths of care, and one toggle for whether Valeo supplies the
 * medication. Four combinations from two controls.
 *
 * ── WHY THE TOGGLE IS ABOVE BOTH CARDS ──
 * It applies to both lengths. Putting it inside each card would ask the same
 * question twice and make the cards look like four plans instead of two.
 *
 * ── WHY A CAROUSEL AND NOT A STACK ──
 * The value of two plans is the comparison, and a comparison needs the options
 * near each other. Two cards will not fit side by side at this width, so they
 * scroll horizontally with the next one visible at the edge. Stacking them
 * would turn a choice into a scroll.
 *
 * ── NOTHING IS MARKED "RECOMMENDED" ──
 * The three month plan is cheaper per month, and that is the honest reason to
 * pick it. A badge pushing people toward it would undo the screen before this
 * one, where the clinician already made the recommendation. The only thing
 * being chosen here is length and supply.
 *
 * ── THE PRICE IS NOT A HEADLINE ──
 * An earlier build set it at 34px, which made a care page look like a price
 * tag. It sits under the plan name at reading size, which is where a person
 * looks for it and is enough.
 */
export default function Buy({ pKey, onBack, onPaid }) {
  const p = PROTOCOLS[pKey];
  const c = coachOf(pKey);
  const [meds, setMeds] = useState(false);
  const [pay, setPay] = useState(null);

  if (!p || !c) return null;
  const first = givenNameOf(c);
  const plans = carePlans(pKey);
  const steps = careSteps(first);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      <Stack direction="row" sx={{ alignItems: 'center', px: 1.5, pt: 1.5, pb: 0.5 }}>
        <IconButton onClick={onBack} size="small" sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', pb: 3 }}>
        <Box sx={{ px: 3, textAlign: 'center' }}>
          <Typography sx={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.18em',
            textTransform: 'uppercase', color: C.ink2,
          }}>Choose your care</Typography>
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 28, fontWeight: 600,
            lineHeight: 1.15, color: C.deep, mt: 1.2,
          }}>Your care with {first}</Typography>

          {/* One question, asked once, for both plans. */}
          <Stack direction="row" spacing={0.5} sx={{
            mt: 3, p: 0.5, borderRadius: '999px', bgcolor: 'rgba(27,57,91,.055)',
          }}>
            {[['Care only', false], ['With medication', true]].map(([t, v]) => (
              <Box key={t} onClick={() => setMeds(v)} sx={{
                flex: 1, textAlign: 'center', py: 1, borderRadius: '999px', cursor: 'pointer',
                fontSize: 13, fontWeight: meds === v ? 700 : 500,
                bgcolor: meds === v ? '#fff' : 'transparent',
                color: meds === v ? C.deep : C.ink2,
                boxShadow: meds === v ? '0 2px 10px -6px rgba(27,57,91,.45)' : 'none',
                transition: 'background-color .25s, color .25s',
              }}>{t}</Box>
            ))}
          </Stack>

          <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 1.3, lineHeight: 1.5 }}>
            {meds
              ? 'Medication dispensed and delivered for the length of your care.'
              : 'Your prescription is included. Medication is bought separately.'}
          </Typography>
        </Box>

        {/* ── the two plans ── */}
        <Box sx={{
          display: 'flex', gap: 1.5, mt: 3, px: 2.25, pb: 1,
          overflowX: 'auto', scrollSnapType: 'x mandatory',
          '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
        }}>
          {plans.map((pl, n) => {
            const fee = (meds ? pl.meds : pl.care).toLocaleString();
            const items = planItems(first, c.short, pl, meds);
            const lead = n === 1;
            return (
              <Box key={pl.k} sx={{
                flex: '0 0 auto', width: '86%', scrollSnapAlign: 'center',
                borderRadius: '22px', bgcolor: '#fff', overflow: 'hidden',
                border: `1px solid ${lead ? 'rgba(224,164,0,.4)' : 'rgba(27,57,91,.08)'}`,
                boxShadow: '0 4px 20px -14px rgba(27,57,91,.5)',
              }}>
                <Box sx={{ px: 2.25, pt: 2.5, pb: 2 }}>
                  <Typography sx={{
                    fontFamily: '"Fraunces", serif', fontSize: 24, fontWeight: 600,
                    color: C.deep, lineHeight: 1.15,
                  }}>{pl.t}</Typography>

                  <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mt: 1 }}>
                    <Typography sx={{ fontSize: 19, fontWeight: 700, color: C.deep }}>
                      SAR {fee}
                    </Typography>
                    {pl.months > 1 && (
                      <Typography sx={{ fontSize: 12, color: C.ink2 }}>
                        SAR {Math.round((meds ? pl.meds : pl.care) / pl.months).toLocaleString()} a month
                      </Typography>
                    )}
                  </Stack>

                  <Box onClick={() => setPay(pl)} sx={{
                    mt: 2, py: 1.4, borderRadius: '999px', textAlign: 'center', cursor: 'pointer',
                    fontSize: 14, fontWeight: 700,
                    bgcolor: lead ? C.yellow : 'transparent',
                    color: C.deep,
                    border: lead ? 'none' : `1.5px solid ${C.deep}`,
                    '&:active': { opacity: .85 },
                  }}>{pl.cta}</Box>
                </Box>

                <Box sx={{ px: 2.25, pb: 2.25 }}>
                  {items.map((x, i) => (
                    <Box key={x.t} sx={{
                      pt: i === 0 ? 0 : 1.75, pb: 1.75,
                      borderBottom: i === items.length - 1 ? 'none' : `1px solid ${C.line}`,
                    }}>
                      <Stack direction="row" spacing={0.9} sx={{ alignItems: 'center', mb: 0.6 }}>
                        <Typography sx={{
                          fontSize: 14, fontWeight: 700, color: C.deep, lineHeight: 1.25,
                        }}>{x.t}</Typography>
                        <Typography sx={{
                          flexShrink: 0, px: 0.85, py: 0.25, borderRadius: '6px',
                          fontSize: 9, fontWeight: 800, letterSpacing: '.08em',
                          textTransform: 'uppercase',
                          bgcolor: lead ? 'rgba(224,164,0,.16)' : 'rgba(27,57,91,.06)',
                          color: lead ? C.yellowDeep : C.ink2,
                        }}>{x.b}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 12.5, lineHeight: 1.5, color: C.ink2 }}>
                        {x.s}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* ── the sequence, the same whichever plan is chosen ── */}
        <Box sx={{ px: 3, mt: 3 }}>
          <Typography sx={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase', color: C.ink2,
            pt: 3, borderTop: `1px solid ${C.line}`, mb: 2.5,
          }}>What happens next</Typography>

          <Stack spacing={2.25}>
            {steps.map((x, n) => (
              <Stack key={x.t} direction="row" spacing={1.8} sx={{ alignItems: 'flex-start' }}>
                <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 13.5, fontWeight: 600,
                  color: C.yellowDeep, flexShrink: 0, width: 21, mt: '2px',
                }}>{String(n + 1).padStart(2, '0')}</Typography>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.deep, lineHeight: 1.3 }}>
                    {x.t}
                  </Typography>
                  <Typography sx={{ fontSize: 13.5, lineHeight: 1.5, color: C.ink2, mt: 0.25 }}>
                    {x.s}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          {/* Sequencing, not a disclaimer. */}
          <Typography sx={{
            fontSize: 14, lineHeight: 1.6, color: C.deep, mt: 3.5,
            px: 2.25, py: 2, borderRadius: '16px', bgcolor: 'rgba(224,164,0,.1)',
          }}>
            Your care starts now. {first} confirms your treatment once your blood
            results are in.
          </Typography>
        </Box>
      </Box>

      <PaySheet open={!!pay}
        item={pay ? `${pay.t} of care with ${c.short}` : ''}
        fee={pay ? (meds ? pay.meds : pay.care).toLocaleString() : ''}
        onClose={() => setPay(null)} onDone={onPaid} />
    </Box>
  );
}
