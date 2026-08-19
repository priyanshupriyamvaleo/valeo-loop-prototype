import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import TrackChangesOutlinedIcon from '@mui/icons-material/TrackChangesOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import { HouseHeartMark, StethoscopeMark } from '../components/Marks';
import { coachOf } from '../data';
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
 * You are arriving at a practice, not at one person's inbox. "We're looking
 * forward to helping you achieve your goals" promises a team standing behind
 * the name on the door — which is both warmer and truer, since a nurse draws
 * the bloods and a coach carries the weeks between appointments.
 *
 * ── THE BUTTON OPENS THE ROOM ──
 * It used to open a slot picker. A calendar between "nice to meet you" and the
 * doctor spends the one moment in this journey where the patient has just
 * agreed to speak to someone. The call starts here now, and the line under the
 * button says the doctor is free rather than when he next will be.
 *
 * ── WHY THE THREE PROMISES ARE A LIST AND NOT A PARAGRAPH ──
 * They are what the patient is buying with the next ten minutes, so each one
 * gets a mark of its own and the first phrase of each carries the weight. Read
 * only the bold words and the screen still answers "what do I get".
 *
 * NOTE: two of the four portraits are still monograms, and it costs more here
 * than anywhere else — this screen's whole job is "trust this person".
 */

const PROMISES = [
  { ic: TrackChangesOutlinedIcon, b: 'Clarity', t: ' on what’s standing between you and your goals.' },
  { ic: AssignmentOutlinedIcon, b: 'A personalised plan', t: ' built around your goals.' },
  { ic: Groups2OutlinedIcon, b: 'A clear path forward', t: ' — and a team to guide you along the way.' },
];

export default function Meet({ pKey, onBook, onBack }) {
  /* A rail jump can arrive here with no episode at all. The demo must show a
     doctor, not a blank phone, so the weight-loss lead stands in. */
  const c = coachOf(pKey) || coachOf('P_WEIGHT');
  const [inn, setInn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setInn(true), 40); return () => clearTimeout(t); }, []);

  if (!c) return null;

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: `
        radial-gradient(70% 34% at 106% -2%, rgba(255,185,0,.16) 0%, rgba(255,185,0,0) 64%),
        linear-gradient(180deg,#FFF9EC 0%,${C.cream} 30%)`,
    }}>
      <Box sx={{ px: 2.25, pt: 1.75, flexShrink: 0, position: 'absolute', zIndex: 2 }}>
        <IconButton onClick={onBack} size="small" sx={{
          width: 36, height: 36, bgcolor: '#fff', color: C.deep,
          boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
          '&:hover': { bgcolor: '#fff' },
        }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      <Box sx={{
        flex: '1 1 auto', overflowY: 'auto', pb: 2, pt: 2,
        opacity: inn ? 1 : 0,
        transform: inn ? 'none' : 'translateY(14px)',
        transition: 'opacity .5s cubic-bezier(.2,.9,.25,1), transform .55s cubic-bezier(.2,.9,.25,1)',
      }}>
        <Box sx={{ px: 2.75 }}>
          {/* ── the practice door ──
              A house with a heart in it, above the name. The line alone read as
              a page title; with the mark above it, it reads as a threshold you
              are being welcomed across, which is the only job this beat has. */}
          <Stack sx={{ alignItems: 'center' }}>
            <HouseHeartMark />
            <Typography sx={{
              textAlign: 'center', fontSize: 11, fontWeight: 800, letterSpacing: '.13em',
              textTransform: 'uppercase', color: C.yellowDeep, mt: 0.75,
            }}>
              Welcome to {c.short}’s Practice
            </Typography>
          </Stack>

          <Box sx={{
            width: '38%', maxWidth: 138, mx: 'auto', mt: 1.75, borderRadius: '20px',
            overflow: 'hidden', border: '4px solid #fff',
            boxShadow: '0 16px 34px -18px rgba(27,57,91,.45)',
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

          {/* What they do and how long they have done it, on one card that
              overlaps nothing and claims nothing else. The registration number
              stays off: nobody chooses a clinician on "SCFHS 24-118940", and
              four credential fragments on one line read as a barcode. */}
          <Stack direction="row" spacing={1.2} sx={{
            alignItems: 'center', width: 'fit-content', mx: 'auto', mt: -1.75,
            position: 'relative', zIndex: 1,
            pl: 1.1, pr: 2, py: 1, borderRadius: '999px', bgcolor: '#fff',
            boxShadow: '0 10px 26px -16px rgba(27,57,91,.45)',
          }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              bgcolor: 'rgba(224,164,0,.13)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <StethoscopeMark size={19} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep, lineHeight: 1.2 }}>
                {c.role}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.15 }}>
                {c.years}+ years experience
              </Typography>
            </Box>
          </Stack>

          {/* Beat 2 · the doctor walks in.
              "Hi Faisal 👋" is gone. It was the THIRD greeting in the journey —
              the host home says it, the chat says it, and by the time the
              clinician says it the relationship has already started, so a
              fourth hello reads as a template rather than as warmth. */}
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 28, fontWeight: 600,
            lineHeight: 1.12, letterSpacing: '-.015em', color: C.deep, mt: 2.5,
          }}>
            Nice to meet you.
          </Typography>
          {/* One short rule. It gives the sentence a floor to sit on, which is
              what stops the two paragraphs under it reading as one block. */}
          <Box sx={{ width: 46, height: 3, borderRadius: 2, bgcolor: C.yellow, mt: 1 }} />

          <Typography sx={{
            fontSize: 15, fontWeight: 500, lineHeight: 1.45, color: C.deep,
            mt: 1.2, maxWidth: 300,
          }}>
            We’re looking forward to helping you achieve your goals.
          </Typography>

          {/* Beat 3 · why this conversation matters.
              Was serif, italic, and fenced between two rules — which read as a
              literary pull quote. This is healthcare, not a novel. It is a card
              now: same words, but held rather than performed. */}
          <Stack direction="row" spacing={1.4} sx={{
            alignItems: 'flex-start', mt: 2.25, px: 1.5, py: 1.5,
            borderRadius: '16px', bgcolor: 'rgba(255,185,0,.07)',
            borderLeft: `3px solid ${C.yellow}`,
          }}>
            <ForumOutlinedIcon sx={{ fontSize: 22, color: C.yellowDeep, flexShrink: 0, mt: 0.1 }} />
            <Typography sx={{
              fontSize: 14.5, fontWeight: 600, lineHeight: 1.4, color: C.deep,
            }}>
              Our first conversation sets the foundation for everything that follows.
            </Typography>
          </Stack>

          {/* Beat 4 · what you walk away with */}
          <Typography sx={{
            fontSize: 13.5, lineHeight: 1.5, color: C.ink2, mt: 2,
          }}>
            By the end of our conversation, you’ll leave with:
          </Typography>

          <Stack sx={{ mt: 0.75 }}>
            {PROMISES.map(({ ic: Icon, b, t }, idx) => (
              <Stack key={b} direction="row" spacing={1.4} sx={{
                alignItems: 'center', py: 1.25,
                borderTop: idx === 0 ? 'none' : `1px solid ${C.line}`,
              }}>
                <Box sx={{
                  width: 38, height: 38, borderRadius: '50%', flexShrink: 0, bgcolor: '#fff',
                  border: '1px solid rgba(224,164,0,.30)',
                  boxShadow: '0 6px 16px -12px rgba(27,57,91,.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon sx={{ fontSize: 19, color: C.yellowDeep }} />
                </Box>
                <Typography sx={{ flex: 1, fontSize: 13.5, lineHeight: 1.45, color: C.deep }}>
                  <Box component="span" sx={{ fontWeight: 700 }}>{b}</Box>{t}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* ── the commitment · a conversation, not a purchase ── */}
      <Box sx={{
        px: 2.75, pt: 2, pb: 2.25, flexShrink: 0,
        background: `linear-gradient(180deg,rgba(255,253,245,0) 0%,${C.cream} 40%)`,
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => onBook(pKey)}
          startIcon={<VideocamOutlinedIcon sx={{ fontSize: 18 }} />}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          sx={{
            py: 1.6, fontSize: 15, borderRadius: '17px',
            '& .MuiButton-startIcon': { mr: 1 },
            '& .MuiButton-endIcon': { ml: 1 },
            whiteSpace: 'nowrap',
          }}>
          Start my consultation
        </Button>
        <Stack direction="row" spacing={0.6} sx={{
          alignItems: 'center', justifyContent: 'center', mt: 1.3,
        }}>
          <ScheduleOutlinedIcon sx={{ fontSize: 14, color: C.ink2 }} />
          <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
            {c.short} is available now · Included
          </Typography>
        </Stack>
      </Box>

    </Box>
  );
}
