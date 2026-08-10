import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckIcon from '@mui/icons-material/Check';
import { USER, coachOf, CONSULT_FEE } from '../data';
import { C } from '../theme';

/**
 * MEET — the camera follows you deeper into the clinic.
 *
 * This screen used to be a product card: protocol name, duration, plan count,
 * price, chevron. Individually defensible, collectively fatal — the moment it
 * appeared the user stopped being a patient and became a shopper, three screens
 * after we had carefully made them feel welcomed.
 *
 * It was also backwards on its own terms. We are not selling a protocol; we are
 * selling an ongoing relationship with a clinician who writes one FOR you. The
 * plan does not exist yet. Showing it before the consultation says "here is the
 * package you're buying" when the thing we mean is "here is who you'll be
 * working with".
 *
 * ── THE VOICE IS "WE", NOT "I" ──
 * You are arriving at a practice, not at one person's inbox. "We're really
 * looking forward to working with you" promises a team standing behind the
 * name on the door — which is both warmer and truer, since a nurse draws the
 * bloods and a coach carries the weeks between appointments.
 *
 * ── WHAT THE COMMITMENT IS ──
 * Booking a first conversation, not buying a programme. Nothing on this page
 * names a protocol, a duration or a package price. The fee sits under the button
 * in small type as the cost of an appointment — the instant it becomes the
 * headline this is a checkout again.
 *
 * ── CONTINUITY ──
 * The chat's last line was "I'd like to introduce you to Dr. Layla's team." This
 * opens on the practice door and her face, so the introduction completes rather
 * than restarts. Content settles on mount rather than cutting, because a cut
 * reads as a new page and a settle reads as the same scene continuing.
 *
 * NOTE: two of the four portraits are still monograms, and it costs more here
 * than anywhere else — this screen's whole job is "trust this person".
 */
export default function Meet({ pKey, onBook, onBack }) {
  const c = coachOf(pKey);
  const [inn, setInn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setInn(true), 40); return () => clearTimeout(t); }, []);

  if (!c) return null;

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(180deg,#FFF6E4 0%,${C.cream} 32%)`,
    }}>
      <Box sx={{ px: 1.5, pt: 1.5, flexShrink: 0 }}>
        <IconButton onClick={onBack} size="small" sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      <Box sx={{
        flex: '1 1 auto', overflowY: 'auto', pb: 2,
        opacity: inn ? 1 : 0,
        transform: inn ? 'none' : 'translateY(14px)',
        transition: 'opacity .5s cubic-bezier(.2,.9,.25,1), transform .55s cubic-bezier(.2,.9,.25,1)',
      }}>
        <Box sx={{ px: 3 }}>
          {/* ── FOUR BEATS, NO REPETITION ──
              welcome → nice to meet you → why this conversation matters → what
              you walk away with. Nothing else.

              "Hi Faisal 👋" is gone. It was the THIRD greeting in the journey —
              the host home says it, the chat says it, and by the time the
              clinician says it the relationship has already started, so a fourth
              hello reads as a template rather than as warmth. A receptionist
              introduces you and then the doctor walks in and says "nice to meet
              you"; nobody re-greets you at the door of the consulting room. */}
          <Typography sx={{
            textAlign: 'center', fontSize: 11, fontWeight: 700, letterSpacing: '.12em',
            textTransform: 'uppercase', color: C.yellowDeep, mb: 1.5,
          }}>
            Welcome to {c.short}’s Practice
          </Typography>

          <Box sx={{
            width: '43%', maxWidth: 156, mx: 'auto', borderRadius: '20px', overflow: 'hidden',
            border: '4px solid #fff',
            boxShadow: '0 14px 30px -16px rgba(27,57,91,.4)',
            background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
            transform: inn ? 'scale(1)' : 'scale(.96)',
            transition: 'transform .6s cubic-bezier(.2,.9,.25,1)',
          }}>
            <Box sx={{ position: 'relative', width: '100%', pt: '116%' }}>
              {c.img ? (
                <Box component="img" src={c.img} alt="" sx={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center 18%',
                }} />
              ) : (
                <Typography sx={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Fraunces", serif', fontSize: 34, fontWeight: 600,
                  color: 'rgba(255,255,255,.9)',
                }}>{c.mono}</Typography>
              )}
            </Box>
          </Box>

          {/* What they do and how long they have done it. The registration number
              was visual noise — nobody chooses a clinician on "CSCS L2", and four
              credential fragments on one line read as a barcode. */}
          <Typography sx={{
            textAlign: 'center', fontSize: 13.5, fontWeight: 600, color: C.deep, mt: 1.4,
          }}>{c.role}</Typography>
          <Typography sx={{ textAlign: 'center', fontSize: 12.5, color: C.ink2, mt: 0.3 }}>
            {c.years}+ years experience
          </Typography>

          {/* Beat 2 · the doctor walks in */}
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 29, fontWeight: 600,
            lineHeight: 1.15, color: C.deep, mt: 3.25,
          }}>
            Nice to meet you.
          </Typography>
          <Typography sx={{
            fontSize: 16.5, fontWeight: 500, lineHeight: 1.42, color: C.deep,
            mt: 1.1, maxWidth: 300,
          }}>
            We’re looking forward to helping you achieve your goals.
          </Typography>

          {/* Beat 3 · why this conversation matters.
              Was serif, italic, and fenced between two rules — which read as a
              literary pull quote. This is healthcare, not a novel. Same family,
              no italic, no rules; the emphasis comes from size and weight, which
              is quieter and far more confident. */}
          <Typography sx={{
            fontSize: 19.5, fontWeight: 600, lineHeight: 1.4, color: C.deep,
            mt: 3, maxWidth: 310,
          }}>
            Our first conversation sets the foundation for everything that follows.
          </Typography>

          {/* Beat 4 · what you walk away with */}
          <Typography sx={{
            fontSize: 14.5, lineHeight: 1.5, color: C.ink2, mt: 2.75, maxWidth: 280,
          }}>
            By the end of our conversation, you’ll leave with:
          </Typography>

          <Stack spacing={1.1} sx={{ mt: 1.5 }}>
            {[
              'Clarity on what’s standing between you and your goals.',
              'A personalised plan built around your goals.',
              'A clear path forward—and a team to guide you along the way.',
            ].map((t) => (
              <Stack key={t} direction="row" spacing={1.3} sx={{ alignItems: 'flex-start' }}>
                <CheckIcon sx={{ fontSize: 15, color: C.yellowDeep, flexShrink: 0, mt: '3px' }} />
                <Typography sx={{ flex: 1, fontSize: 14.5, lineHeight: 1.45, color: C.deep }}>
                  {t}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* ── the commitment · an appointment, not a purchase ── */}
      <Box sx={{
        px: 3, pt: 2, pb: 3, flexShrink: 0,
        background: `linear-gradient(180deg,rgba(255,253,245,0) 0%,${C.cream} 40%)`,
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => onBook(pKey)}>
          Continue
        </Button>
      </Box>

    </Box>
  );
}
