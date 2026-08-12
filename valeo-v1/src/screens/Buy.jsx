import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import PaySheet from '../components/PaySheet';
import { PROTOCOLS, PROGRAMME_FEE, careIncludes, careSteps,
         coachOf, givenNameOf } from '../data';
import { C } from '../theme';

/**
 * SCREEN TWO — THE COMMITMENT.
 *
 * The screen before this one answers "do I want this care?". This one answers
 * a different question: what exactly am I committing to? Two psychological
 * moments, so two screens. Merging them would force one page to argue and
 * account at the same time, and it would do neither.
 *
 * This screen is allowed to be more transactional than the one before it. That
 * is deliberate. A patient who has decided wants the terms stated plainly, and
 * vagueness at the moment of payment reads as evasion.
 *
 * ── WHAT IT MUST MAKE CLEAR ──
 * What the care is, what it includes, what happens after paying, and what it
 * costs. In that order, because the price is easier to accept once the four
 * things it buys are already understood.
 *
 * ── THE SEQUENCING IS THE HARD PART ──
 * The clinician cannot confirm treatment before seeing blood results. Two ways
 * of saying that are both wrong. "You cannot get your plan until your blood
 * test" makes the patient feel blocked by us. "Your treatment is ready" is
 * false. So the numbered steps state the order as ordinary clinical sequence,
 * and one line says care starts now with treatment confirmed after the results.
 *
 * ── NO INTERNAL ACCOUNTING ──
 * The patient sees one price for one course of care. What the blood draw costs
 * us, and how the consultation is credited, are our problems. Itemising them
 * turns care back into a basket of procedures, which is the framing this whole
 * flow was rebuilt to remove.
 *
 * ── AND NO REMINDER THAT THE CONSULTATION WAS FREE ──
 * It was, and saying so here would build the pattern free, then pay. The
 * patient should experience consultation, recommendation, care.
 */
export default function Buy({ pKey, onBack, onPaid }) {
  const p = PROTOCOLS[pKey];
  const c = coachOf(pKey);
  const [pay, setPay] = useState(false);

  if (!p || !c) return null;
  const first = givenNameOf(c);
  const includes = careIncludes(first, c.short);
  const steps = careSteps(first);
  const price = PROGRAMME_FEE.toLocaleString();

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
          {/* Not "and his team": no clinician in this product has stated
              pronouns, and the same sentence has to work for Layla and Huda.
              Not "the team at Jamie's practice" either, which said the name
              twice in one line. */}
          Personalised care with {first} and the practice team.
        </Typography>

        {/* The price, once, early, and not hidden. A patient who has to hunt
            for the number assumes it is bad news. */}
        <Stack direction="row" spacing={1.4} sx={{
          alignItems: 'baseline', mt: 3.25, pb: 3, borderBottom: `1px solid ${C.line}`,
        }}>
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 34, fontWeight: 600, color: C.deep,
          }}>SAR {price}</Typography>
          <Typography sx={{ fontSize: 13.5, color: C.ink2 }}>
            {p.wk}-week course of care
          </Typography>
        </Stack>

        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.ink2, mt: 4, mb: 2.5,
        }}>Your care includes</Typography>

        {/* Named, then explained. "Follow-up consultations" alone is a line on
            a pricing page. The sentence under it describes being looked after. */}
        <Stack spacing={2.5}>
          {includes.map((x) => (
            <Box key={x.t}>
              <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.deep, lineHeight: 1.3 }}>
                {x.t}
              </Typography>
              <Typography sx={{ fontSize: 14, lineHeight: 1.5, color: C.ink2, mt: 0.4, maxWidth: 290 }}>
                {x.s}
              </Typography>
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

        {/* Sequencing, not a disclaimer. "You cannot get your plan until the
            blood test" blocks the patient. This says care has already begun. */}
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
          One payment. Nothing further to pay at any later step.
        </Typography>
      </Box>

      <PaySheet open={pay} item={`Care with ${c.short}’s practice`} fee={price}
        onClose={() => setPay(false)} onDone={onPaid} />
    </Box>
  );
}
