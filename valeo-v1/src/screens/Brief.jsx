import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { RECOMMEND, careApproach, coachOf, givenNameOf, goalAim } from '../data';
import { C } from '../theme';

/**
 * SCREEN ONE — THE RECOMMENDATION.
 *
 * The job of this screen is one question: do I want this care? It is not a
 * pricing page, not a feature list, and not a record of the consultation that
 * just happened. The patient was there. They do not need it played back.
 *
 * ── THE OUTCOME IS THE HERO, NOT THE CLINICIAN ──
 * An earlier build used "Jamie's recommendation" as the headline, which makes
 * the clinician the subject of the sentence. The patient did not come for a
 * clinician. They came for a result. So the name moves to a small label above,
 * where it does its real job of saying who this came from, and the headline
 * becomes what the patient gets.
 *
 * ── WHAT IS DELIBERATELY NOT CLAIMED ──
 * The clinician cannot finalise treatment before seeing blood results. Nothing
 * on this screen says the treatment is decided. The third outcome says the
 * opposite in the patient's favour: treatment chosen once your results are in.
 * That is honest, and it is also a stronger promise than a decision made
 * without the evidence.
 *
 * ── NO PRICE, AND NO OPERATIONS ──
 * There is no number here and no explanation of how anything works. Both
 * belong on the screen after this one, which exists to make the commitment
 * concrete. A screen that argues for a recommendation and quotes a price at
 * the same time does neither well.
 *
 * ── "PROTOCOL" DOES NOT APPEAR ──
 * It is an internal word. A patient should never have to learn our vocabulary
 * to understand their own care.
 */
export default function Brief({ pKey, onBack, onStart }) {
  const c = coachOf(pKey);
  const rec = RECOMMEND[pKey];
  const [inn, setInn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setInn(true), 40); return () => clearTimeout(t); }, []);

  if (!c || !rec) return null;
  const first = givenNameOf(c);

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
        {/* Who this came from. Small, because it is attribution and not the
            subject of the page. */}
        <Stack direction="row" spacing={1.2} sx={{ alignItems: 'center', mt: 1 }}>
          <Box sx={{
            width: 26, height: 26, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            border: '1.5px solid #fff',
            boxShadow: '0 3px 10px -5px rgba(27,57,91,.5)',
            background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {c.img
              ? <Box component="img" src={c.img} alt="" sx={{
                  width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                }} />
              : <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 10, fontWeight: 600,
                  color: 'rgba(255,255,255,.9)',
                }}>{c.mono}</Typography>}
          </Box>
          <Typography sx={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase', color: C.ink2,
          }}>{first}’s recommendation</Typography>
        </Stack>

        {/* The outcome. */}
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 31, fontWeight: 600,
          lineHeight: 1.14, color: C.deep, mt: 3, maxWidth: 305,
        }}>{rec.hero}</Typography>

        <Typography sx={{
          fontSize: 16, lineHeight: 1.55, color: C.ink, mt: 2.25, maxWidth: 300,
        }}>
          Based on today’s consultation, {first} recommends a personalised approach
          focused on helping you {goalAim(pKey)} and understanding what is getting
          in the way.
        </Typography>

        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.ink2, mt: 5, mb: 2.25,
        }}>What we’re working toward</Typography>

        <Stack spacing={2.25}>
          {rec.toward.map((t) => (
            <Stack key={t} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{
                width: 7, height: 7, borderRadius: '50%', bgcolor: C.yellowDeep,
                flexShrink: 0, mt: '8px',
              }} />
              <Typography sx={{
                flex: 1, fontSize: 16.5, lineHeight: 1.4, color: C.deep, fontWeight: 500,
              }}>{t}</Typography>
            </Stack>
          ))}
        </Stack>

        {/* The philosophy, in one sentence. It is the whole Valeo promise and
            it does not need a section of its own to make the point. */}
        <Typography sx={{
          fontSize: 15, lineHeight: 1.6, color: C.ink2, mt: 5,
          pt: 3, borderTop: `1px solid ${C.line}`, maxWidth: 300,
        }}>{careApproach(first)}</Typography>
      </Box>

      <Box sx={{
        px: 3, pt: 4, pb: 3, flexShrink: 0, mt: -3,
        background: `linear-gradient(180deg,rgba(255,253,245,0) 0%,${C.cream} 52%)`,
      }}>
        {/* No price. This is a decision about care, and the commitment is made
            concrete on the next screen. */}
        <Button fullWidth variant="contained" color="secondary" onClick={onStart}>
          Continue with my care
        </Button>
      </Box>
    </Box>
  );
}
