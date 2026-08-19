import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import LocalFireDepartmentOutlinedIcon from '@mui/icons-material/LocalFireDepartmentOutlined';
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import BedtimeOutlinedIcon from '@mui/icons-material/BedtimeOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { INVESTIGATE, INVESTIGATE_SUB, coachOf } from '../data';
import { C } from '../theme';

/**
 * THE AI'S HALF OF THE INVESTIGATION — between the intake and the doctor.
 *
 * On the unresolved-problem door, the AI's job is big: investigate and
 * reason. This is the one surface where that work is VISIBLE. Three areas
 * worth investigating, each tied to the marker that would settle it, appear
 * one at a time — reasoning arriving, not a list rendering.
 *
 * ── WHAT IT NEVER CLAIMS ──
 * No diagnosis, no probability, no "likely". The boundary card under the
 * rows says exactly where the machine stops and the clinician starts,
 * because an AI that implies it replaces the doctor undoes the product's
 * whole premise. This screen PREPARES the consultation; the CTA hands
 * straight into it.
 *
 * ── WHY A SCREEN AND NOT A CHAT BUBBLE ──
 * The investigation is the value of this door — "judgment + resolution" —
 * and value buried in a chat transcript reads as small talk. One quiet
 * screen makes the work inspectable at a glance and gives the consultation
 * an agenda the patient has already seen.
 *
 * ── THREE FINDINGS, NOT A LIST ──
 * Each area carries its own icon and colour. Three identical rows read as a
 * list of topics; three distinct ones read as three findings, which is what
 * they are. Nothing here opens: there is no detail screen behind a row, so
 * there is no chevron either. A control that promises a destination it does
 * not have is the fastest way to lose someone's trust in the rest of the
 * screen.
 *
 * ── THE CLINICIAN KEEPS HIS TITLE ──
 * `c.short` rather than `givenNameOf`. On this screen the doctor has not been
 * met yet, and the first name alone reads as an app being familiar with
 * someone it is about to hand a medical decision to.
 */

/* Tone names from the data, resolved once. Soft disc, saturated mark. */
const TONES = {
  rose: { bg: 'rgba(233,79,95,.11)', fg: '#D2404F', pill: 'rgba(233,79,95,.13)' },
  green: { bg: C.greenSoft, fg: C.green, pill: 'rgba(39,153,91,.13)' },
  violet: { bg: 'rgba(122,75,110,.11)', fg: '#7A4B6E', pill: 'rgba(122,75,110,.13)' },
  teal: { bg: C.tealSoft, fg: C.teal, pill: 'rgba(64,143,164,.14)' },
  amber: { bg: 'rgba(224,164,0,.13)', fg: C.yellowDeep, pill: 'rgba(224,164,0,.15)' },
};

const ICONS = {
  heart: MonitorHeartOutlinedIcon,
  flame: LocalFireDepartmentOutlinedIcon,
  people: Groups2OutlinedIcon,
  lab: ScienceOutlinedIcon,
  bolt: BoltOutlinedIcon,
  sleep: BedtimeOutlinedIcon,
  drop: WaterDropOutlinedIcon,
  history: HistoryOutlinedIcon,
  recovery: SelfImprovementOutlinedIcon,
};

export default function Assess({ goal, pKey, onBack, onDone }) {
  const c = coachOf(pKey) || coachOf('P_WEIGHT');
  const rows = INVESTIGATE[goal] || INVESTIGATE.test;
  const sub = INVESTIGATE_SUB[goal] || INVESTIGATE_SUB.test;
  const doc = c ? c.short : 'your doctor';
  /* rows reveal one by one — visible reasoning, not a spinner */
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= rows.length + 1) return undefined;
    const t = setTimeout(() => setN((x) => x + 1), n === 0 ? 500 : 640);
    return () => clearTimeout(t);
  }, [n, rows.length]);
  const ready = n > rows.length;

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
      /* A warm top that thins into the page, plus one soft light in the top
         right corner. The corner glow is what stops a cream screen reading
         as an empty one before the first card has arrived. */
      background: `
        radial-gradient(78% 42% at 108% -4%, rgba(255,185,0,.20) 0%, rgba(255,185,0,0) 62%),
        radial-gradient(58% 30% at -8% 6%, rgba(255,185,0,.10) 0%, rgba(255,185,0,0) 70%),
        linear-gradient(180deg,#FFF8E9 0%,${C.cream} 34%)`,
    }}>
      <Box sx={{ px: 2.25, pt: 1.75, flexShrink: 0 }}>
        <IconButton onClick={onBack} size="small" sx={{
          width: 36, height: 36, bgcolor: '#fff', color: C.deep,
          boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
          '&:hover': { bgcolor: '#fff' },
        }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.5, pb: 2 }}>
        {/* ── the seal ──
            A rosette rather than a status dot. The dot said "loading"; the
            seal says the work is finished and signed, which is the claim the
            headline underneath it makes. It breathes while the rows arrive. */}
        <Stack direction="row" spacing={1.15} sx={{ alignItems: 'center', mt: 1.75 }}>
          <WorkspacePremiumOutlinedIcon sx={{
            fontSize: 21, color: C.yellowDeep,
            animation: ready ? 'none' : 'aPulse 1.3s ease-in-out infinite',
            '@keyframes aPulse': { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 1 } },
          }} />
          <Typography sx={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: '.17em',
            textTransform: 'uppercase', color: C.yellowDeep,
          }}>{ready ? 'Worked through your answers' : 'Working through your answers'}</Typography>
        </Stack>

        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 29, fontWeight: 600,
          lineHeight: 1.13, letterSpacing: '-.015em', color: C.deep, mt: 1.5,
        }}>Here’s what’s worth investigating.</Typography>

        <Typography sx={{
          fontSize: 13.5, lineHeight: 1.55, color: C.ink2, mt: 1.25,
          opacity: ready ? 1 : 0.55, transition: 'opacity .5s',
        }}>{sub}</Typography>

        <Stack spacing={1.3} sx={{ mt: 2.75 }}>
          {rows.map((r, idx) => {
            const tone = TONES[r.tone] || TONES.amber;
            const Icon = ICONS[r.ic] || ScienceOutlinedIcon;
            return (
              <Stack key={r.t} direction="row" spacing={1.3} sx={{
                alignItems: 'center', px: 1.5, py: 1.8, borderRadius: '18px', bgcolor: '#fff',
                boxShadow: '0 10px 26px -20px rgba(27,57,91,.55)',
                opacity: n > idx ? 1 : 0,
                transform: n > idx ? 'none' : 'translateY(10px)',
                transition: 'opacity .45s cubic-bezier(.2,.9,.25,1), transform .5s cubic-bezier(.2,.9,.25,1)',
              }}>
                <Box sx={{
                  width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                  bgcolor: tone.bg, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon sx={{ fontSize: 23, color: tone.fg }} />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 14, fontWeight: 700, color: C.deep, lineHeight: 1.3,
                  }}>{r.t}</Typography>
                  <Typography sx={{
                    fontSize: 12, lineHeight: 1.45, color: C.ink2, mt: 0.35,
                  }}>{r.s}</Typography>
                </Box>

                {/* One line, always. A marker name broken over two lines stops
                    looking like a marker name. */}
                <Typography sx={{
                  flexShrink: 0, alignSelf: 'center', px: 0.95, py: 0.5, borderRadius: '999px',
                  fontSize: 8, fontWeight: 800, letterSpacing: '.06em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                  bgcolor: tone.pill, color: tone.fg,
                }}>{r.m}</Typography>
              </Stack>
            );
          })}
        </Stack>

        {/* Where the machine stops. One sentence, and it decides how much of
            the rest of this screen the patient is entitled to believe — so it
            gets a card of its own rather than grey text under the fold. */}
        <Stack direction="row" spacing={1.3} sx={{
          alignItems: 'flex-start', mt: 2.25, px: 1.6, py: 1.6, borderRadius: '16px',
          bgcolor: 'rgba(255,185,0,.07)', border: '1px solid rgba(224,164,0,.20)',
          opacity: ready ? 1 : 0, transition: 'opacity .5s',
        }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0, mt: 0.2,
            bgcolor: 'rgba(224,164,0,.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <GppGoodOutlinedIcon sx={{ fontSize: 18, color: C.yellowDeep }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.deep }}>
              This is preparation, not a diagnosis.
            </Typography>
            <Typography sx={{ fontSize: 12, lineHeight: 1.5, color: C.ink2, mt: 0.3 }}>
              {doc} decides what matters on your call, and can see all of this
              before you speak.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ px: 2.5, pt: 1.25, pb: 2.25, flexShrink: 0 }}>
        <Button fullWidth variant="contained" color="secondary" onClick={onDone}
          disabled={!ready}
          startIcon={<CalendarTodayOutlinedIcon sx={{ fontSize: 16 }} />}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          /* The label carries a title and a name, so it is the longest CTA in
             the product. It holds one line at 14 with the icons tucked in. */
          sx={{
            py: 1.6, fontSize: 14, borderRadius: '17px', px: 1.5,
            '& .MuiButton-startIcon': { mr: 0.9 },
            '& .MuiButton-endIcon': { ml: 0.9 },
            '& .MuiButton-startIcon, & .MuiButton-endIcon': { flexShrink: 0 },
            whiteSpace: 'nowrap',
          }}>
          Review this with {doc} now
        </Button>

        {/* The last thing under a medical CTA is the reassurance that makes it
            pressable. Quiet, and never larger than the button above it. */}
        <Stack direction="row" spacing={0.6} sx={{
          alignItems: 'center', justifyContent: 'center', mt: 1.4,
        }}>
          <LockOutlinedIcon sx={{ fontSize: 13, color: C.ink2 }} />
          <Typography sx={{ fontSize: 11.5, fontWeight: 500, color: C.ink2 }}>
            Secure · Private · 100% Confidential
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
