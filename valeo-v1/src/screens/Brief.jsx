import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { careMeaning, coachOf, givenNameOf, goalAim } from '../data';
import { C } from '../theme';

/**
 * JAMIE'S RECOMMENDATION.
 *
 * The first build of this screen showed the mechanics of the programme. It
 * listed what the consultation heard, the four clinical questions the blood
 * test answers, the five steps of the journey, the price, and a grid of what
 * the programme includes. Every part was true, and no part was the reason to
 * continue.
 *
 * The reason to continue is clinical judgement. A patient at this moment is not
 * choosing a blood test, a protocol or a support package. A patient is choosing
 * to let one clinician decide what happens to their body, and to keep deciding
 * as things change. That decision is the product.
 *
 * ── WHAT THIS SCREEN REMOVED, AND WHY ──
 * The journey map went, because a list of steps describes the service and not
 * the value of it. The included grid went, because it turns care into a
 * shopping basket. The price went, because it belongs on the checkout screen
 * that follows, before any charge occurs. A screen that argues for judgement
 * and shows a number at the same time argues for neither.
 *
 * ── THE ONE PIECE OF MECHANICS THAT STAYED ──
 * One line states that the blood work joins today's consultation. The patient
 * must know that a blood test is part of this before agreeing to it. Removing
 * that line would make the screen shorter and dishonest.
 *
 * ── WHY THE THREE POINTS ARE NOT CARDS ──
 * A card makes a statement look like a product feature. These are qualities of
 * a person's judgement. They get space, a quiet marker and no border.
 */
export default function Brief({ pKey, onBack, onStart }) {
  const c = coachOf(pKey);
  const [inn, setInn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setInn(true), 40); return () => clearTimeout(t); }, []);

  if (!c) return null;
  const first = givenNameOf(c);
  const points = careMeaning(first);

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(180deg,#FFF6E4 0%,${C.cream} 24%)`,
    }}>
      <Box sx={{ px: 1.5, pt: 1.5, flexShrink: 0 }}>
        <IconButton onClick={onBack} size="small" sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      <Box sx={{
        flex: '1 1 auto', overflowY: 'auto', px: 3, pb: 2,
        opacity: inn ? 1 : 0,
        transform: inn ? 'none' : 'translateY(12px)',
        transition: 'opacity .5s cubic-bezier(.2,.9,.25,1), transform .55s cubic-bezier(.2,.9,.25,1)',
      }}>
        {/* Small, because the patient has just spent a call looking at this
            face. It grounds the recommendation in a person and then stops. */}
        <Stack direction="row" spacing={1.3} sx={{ alignItems: 'center', mt: 0.5 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            border: '2px solid #fff',
            boxShadow: '0 4px 12px -6px rgba(27,57,91,.45)',
            background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {c.img
              ? <Box component="img" src={c.img} alt="" sx={{
                  width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                }} />
              : <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 12, fontWeight: 600,
                  color: 'rgba(255,255,255,.9)',
                }}>{c.mono}</Typography>}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
              {c.name}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>{c.role}</Typography>
          </Box>
        </Stack>

        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 32, fontWeight: 600,
          lineHeight: 1.12, color: C.deep, mt: 3.5, maxWidth: 300,
        }}>{first}’s recommendation</Typography>

        <Typography sx={{
          fontSize: 16.5, lineHeight: 1.5, color: C.deep, mt: 2, maxWidth: 305,
        }}>
          Based on today’s consultation, {first} has recommended a personalised
          approach to {goalAim(pKey)}.
        </Typography>

        {/* The claim the whole screen exists to make. */}
        <Typography sx={{
          fontSize: 15, lineHeight: 1.55, color: C.ink2, mt: 2.25, maxWidth: 300,
        }}>
          From this point on, every decision is guided by {first}, tailored to your
          health, your goals and your progress.
        </Typography>

        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.ink2, mt: 5, mb: 2.5,
        }}>What this means for you</Typography>

        <Stack spacing={3}>
          {points.map((x) => (
            <Box key={x.t}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Box sx={{
                  width: 7, height: 7, borderRadius: '50%', bgcolor: C.yellowDeep,
                  flexShrink: 0, mt: '7px',
                }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 16, fontWeight: 700, color: C.deep, lineHeight: 1.3,
                  }}>{x.t}</Typography>
                  <Typography sx={{
                    fontSize: 14.5, lineHeight: 1.5, color: C.ink2, mt: 0.6, maxWidth: 280,
                  }}>{x.s}</Typography>
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>

        {/* The blood test is named once. A patient must know it is part of this
            before agreeing to it, and one sentence is the whole obligation. */}
        <Typography sx={{
          fontSize: 13.5, lineHeight: 1.6, color: C.ink2, mt: 5,
          pt: 2.5, borderTop: `1px solid ${C.line}`, maxWidth: 300,
        }}>
          To personalise your care, {first} will use your blood work alongside
          today’s consultation.
        </Typography>
      </Box>

      <Box sx={{
        px: 3, pt: 4, pb: 3, flexShrink: 0, mt: -3,
        background: `linear-gradient(180deg,rgba(255,253,245,0) 0%,${C.cream} 52%)`,
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={onStart}>
          Continue with my care
        </Button>
      </Box>
    </Box>
  );
}
