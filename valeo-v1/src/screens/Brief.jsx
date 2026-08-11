import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckIcon from '@mui/icons-material/Check';
import { BRIEF, CONSULT_SUMMARY, PROGRAMME_FEE, PROGRAMME_INCLUDES,
         briefSteps, coachOf, givenNameOf } from '../data';
import { C } from '../theme';

/**
 * THE CARE BRIEF — the bridge between the conversation and the treatment.
 *
 * This screen exists because of a conflict between two true things.
 *
 * The clinicians cannot write a protocol before they see blood results. So the
 * product must not show a plan yet.
 *
 * The patient has just spent time in a consultation and needs to see that it
 * produced something. "Nothing happens until you pay for a blood test" is a
 * dead end, and it makes the blood test look like the product.
 *
 * The Care Brief resolves both. It is the honest output of the consultation:
 * what the clinician heard, which questions the blood work must answer, and
 * what happens next. It is not a weak version of the plan. It is a different
 * document with a different job.
 *
 * ── THE SECOND SECTION IS THE IMPORTANT ONE ──
 * "You need to pay for a blood test" is an obstacle. The same test written as
 * four clinical questions is the reason to continue. The patient can read what
 * the clinician does not yet know, and why the answer changes the treatment.
 * That is what makes the price at the bottom reasonable.
 *
 * ── THE PRICE SITS HERE, AND ONLY HERE ──
 * One payment, on the document that explains what the payment buys. The
 * patient enters a programme. The blood test is step one inside it, already
 * paid for. Nothing asks for money again, including the plan screen later.
 */
export default function Brief({ pKey, st, onStart, onBack }) {
  const c = coachOf(pKey);
  const first = givenNameOf(c);
  const sum = CONSULT_SUMMARY[pKey];
  const brief = BRIEF[pKey];
  const [inn, setInn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setInn(true), 40); return () => clearTimeout(t); }, []);

  if (!c || !brief) return null;
  const steps = briefSteps(st, pKey);

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
        flex: '1 1 auto', overflowY: 'auto', px: 2.75, pb: 2,
        opacity: inn ? 1 : 0,
        transform: inn ? 'none' : 'translateY(12px)',
        transition: 'opacity .45s cubic-bezier(.2,.9,.25,1), transform .5s cubic-bezier(.2,.9,.25,1)',
      }}>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 29, fontWeight: 600,
          lineHeight: 1.14, color: C.deep, mt: 0.5,
        }}>Your care brief</Typography>

        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.3 }}>
          <Box sx={{
            width: 22, height: 22, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
          }}>
            {c.img && <Box component="img" src={c.img} alt="" sx={{
              width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
            }} />}
          </Box>
          <Typography sx={{ fontSize: 12.5, color: C.ink2 }}>
            Written by {first} after your consultation
          </Typography>
        </Stack>

        {/* ── 1 · what we heard ── */}
        <Head>What we heard</Head>
        <Stack spacing={1.3}>
          {(sum ? sum.said : []).map((t) => (
            <Stack key={t} direction="row" spacing={1.4} sx={{ alignItems: 'flex-start' }}>
              <Box sx={{
                width: 5, height: 5, borderRadius: '50%', bgcolor: C.yellowDeep,
                flexShrink: 0, mt: '9px',
              }} />
              <Typography sx={{ flex: 1, fontSize: 15.5, lineHeight: 1.5, color: C.deep }}>
                {t}
              </Typography>
            </Stack>
          ))}
        </Stack>

        {/* ── 2 · what the blood test is for ──
            The whole design turns on this section. Questions, not a price. */}
        <Head>What we’re looking into</Head>
        <Typography sx={{ fontSize: 14.5, lineHeight: 1.55, color: C.ink2, mb: 2 }}>
          Before {first} decides on treatment, these are the things to understand
          about how your body is working.
        </Typography>
        <Stack spacing={1.4}>
          {brief.asks.map((q, n) => (
            <Stack key={q} direction="row" spacing={1.6} sx={{
              alignItems: 'flex-start', px: 1.75, py: 1.5,
              borderRadius: '15px', bgcolor: '#fff',
              boxShadow: '0 2px 12px -9px rgba(27,57,91,.4)',
            }}>
              <Typography sx={{
                fontFamily: '"Fraunces", serif', fontSize: 15, fontWeight: 600,
                color: C.yellowDeep, flexShrink: 0, lineHeight: 1.4,
              }}>{n + 1}</Typography>
              <Typography sx={{ flex: 1, fontSize: 14.5, lineHeight: 1.45, color: C.deep }}>
                {q}
              </Typography>
            </Stack>
          ))}
        </Stack>
        <Typography sx={{ fontSize: 14, lineHeight: 1.55, color: C.ink2, mt: 2 }}>
          A blood test answers all four. A nurse comes to you and it takes about
          fifteen minutes.
        </Typography>

        {/* ── 3 · what happens next ── */}
        <Head>What happens next</Head>
        <Box>
          {steps.map((s, i) => (
            <Stack key={s.t} direction="row" spacing={1.8}
              sx={{ position: 'relative', pb: i === steps.length - 1 ? 0 : 2.1 }}>
              {i < steps.length - 1 && (
                <Box sx={{
                  position: 'absolute', left: 9, top: 22, bottom: 2, width: 1.5,
                  bgcolor: s.s === 'done' ? 'rgba(39,153,91,.3)' : 'rgba(27,57,91,.10)',
                }} />
              )}
              <Box sx={{
                width: 19, height: 19, borderRadius: '50%', flexShrink: 0, zIndex: 1, mt: '2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: s.s === 'done' ? C.green : s.s === 'now' ? C.yellow : 'transparent',
                border: s.s === 'wait' ? '1.5px solid rgba(27,57,91,.18)' : 'none',
              }}>
                {s.s === 'done' && <CheckIcon sx={{ fontSize: 11, color: '#fff' }} />}
              </Box>
              <Typography sx={{
                flex: 1, fontSize: 15, mt: '1px',
                fontWeight: s.s === 'wait' ? 500 : 700,
                color: s.s === 'wait' ? C.ink : C.deep,
              }}>{s.t}</Typography>
            </Stack>
          ))}
        </Box>

        {/* ── 4 · the programme ── */}
        <Head>Your programme</Head>
        <Typography sx={{ fontSize: 14.5, lineHeight: 1.55, color: C.ink2, mb: 2 }}>
          One payment covers your whole course of care. There is nothing to pay
          at any later step.
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {PROGRAMME_INCLUDES.map((t) => (
            <Stack key={t} direction="row" spacing={1.1} sx={{
              width: 'calc(50% - 4px)', alignItems: 'center',
              px: 1.4, py: 1.3, borderRadius: '14px', bgcolor: '#fff',
              boxShadow: '0 2px 12px -9px rgba(27,57,91,.4)',
            }}>
              <CheckIcon sx={{ fontSize: 14, color: C.green, flexShrink: 0 }} />
              <Typography sx={{ flex: 1, fontSize: 12.5, lineHeight: 1.3, color: C.deep }}>
                {t}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Box>

      <Box sx={{
        px: 2.75, pt: 4, pb: 3, flexShrink: 0, mt: -3,
        background: `linear-gradient(180deg,rgba(255,253,245,0) 0%,${C.cream} 50%)`,
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={onStart}>
          Start my programme · SAR {PROGRAMME_FEE.toLocaleString()}
        </Button>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, textAlign: 'center', mt: 1.3 }}>
          Your first consultation was free. Cancel any time.
        </Typography>
      </Box>
    </Box>
  );
}

function Head({ children }) {
  return (
    <Typography sx={{
      fontSize: 18.5, fontWeight: 700, color: C.deep, mt: 4.5, mb: 2,
    }}>{children}</Typography>
  );
}
