import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { RECOMMEND, coachOf } from '../data';
import { C } from '../theme';

/**
 * SCREEN ONE — THE CLINICIAN'S RECOMMENDATION.
 *
 * The consultation just ended. This screen is the clinician saying one thing:
 * "here is what I think, and here is where I'd start." The patient's only
 * decision is "okay — show me", which is what the CTA does. Contents, length,
 * price and payment all belong to the next screen.
 *
 * ── ONE NARRATIVE, NOT A STACK OF CARDS ──
 * An earlier attempt was a doctor card, an assessment card, a programme card
 * and a benefits grid. That reads as a brochure assembled by a company. A
 * recommendation is speech, so the page is one continuous column — label,
 * speaker, what I think, what I recommend, why — separated by spacing and
 * typography, not by containers.
 *
 * ── EXACTLY ONE OBJECT ──
 * The programme panel is the only boxed element on the page, which is what
 * makes it read as "the one Jamie chose for me". If anything else on the page
 * were a card, this would become a card among cards, i.e. a catalogue.
 *
 * ── THE CLINICIAN SPEAKS, THE COMPANY DOESN'T ──
 * Every sentence between the name and the CTA is first person and comes from
 * RECOMMEND[pKey].speak, which is authored per programme in the clinician's
 * voice. Nothing on this screen is assembled from fragments, because the
 * moment a template writes "here's what I think", it isn't.
 *
 * ── WHAT IS DELIBERATELY ABSENT ──
 * No price, no inclusions list, no timeline, no feature icons, no
 * testimonials, no "recommended" badge competing with the clinician's own
 * words. The word "protocol" does not appear.
 */
export default function Brief({ pKey, onBack, onStart }) {
  const c = coachOf(pKey);
  const rec = RECOMMEND[pKey];
  const [inn, setInn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setInn(true), 40); return () => clearTimeout(t); }, []);

  if (!c || !rec?.speak) return null;
  const s = rec.speak;

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
        flex: '1 1 auto', overflowY: 'auto', px: 3, pb: 1,
        opacity: inn ? 1 : 0,
        transform: inn ? 'none' : 'translateY(12px)',
        transition: 'opacity .5s cubic-bezier(.2,.9,.25,1), transform .55s cubic-bezier(.2,.9,.25,1)',
      }}>
        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.18em',
          textTransform: 'uppercase', color: C.yellowDeep, mt: 0.5,
        }}>My recommendation</Typography>

        {/* Who is speaking. Identity, not a profile card — no credentials,
            reply times or patient counts here. */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 2 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            border: '2px solid #fff',
            boxShadow: '0 4px 14px -6px rgba(27,57,91,.45)',
            background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {c.img
              ? <Box component="img" src={c.img} alt="" sx={{
                  width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                }} />
              : <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 15, fontWeight: 600,
                  color: 'rgba(255,255,255,.9)',
                }}>{c.mono}</Typography>}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep, lineHeight: 1.2 }}>
              {c.name}
            </Typography>
            <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.3 }}>{c.role}</Typography>
          </Box>
        </Stack>

        {/* What I think. */}
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 29, fontWeight: 600,
          lineHeight: 1.16, color: C.deep, mt: 3,
        }}>Here’s my assessment.</Typography>

        <Typography sx={{ fontSize: 15, lineHeight: 1.58, color: C.ink, mt: 1.75 }}>
          {s.think}
        </Typography>

        {/* What I recommend — the one boxed object on the page. */}
        <Box sx={{
          mt: 3, px: 2.5, py: 2.25, borderRadius: '18px', bgcolor: '#fff',
          borderLeft: `3px solid ${C.yellow}`,
          boxShadow: '0 10px 30px -24px rgba(27,57,91,.55)',
        }}>
          <Typography sx={{
            fontSize: 9.5, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase', color: C.ink2,
          }}>Recommended care</Typography>
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 23, fontWeight: 600,
            lineHeight: 1.18, color: C.deep, mt: 1,
          }}>{s.prog}</Typography>
          {/* No meta line here: every desc already opens with what kind of
              care this is, and a gold "clinician-led" strapline above a
              sentence that says "clinician-led" was saying it twice. */}
          <Typography sx={{ fontSize: 13.5, lineHeight: 1.55, color: C.ink2, mt: 1.2 }}>
            {s.desc}
          </Typography>
        </Box>

        {/* The close. Still the clinician talking, so it is not boxed. The
            "treatment confirmed after results" sequencing lives on the next
            screen, under the payment button, where the commitment is made. */}
        <Typography sx={{ fontSize: 14.5, lineHeight: 1.58, color: C.ink, mt: 2.25 }}>
          {s.why}
        </Typography>
      </Box>

      <Box sx={{
        px: 3, pt: 2.5, pb: 3, flexShrink: 0, mt: -1.5,
        background: `linear-gradient(180deg,rgba(255,253,245,0) 0%,${C.cream} 46%)`,
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={onStart}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 17 }} />}>
          View recommended care
        </Button>
      </Box>
    </Box>
  );
}
