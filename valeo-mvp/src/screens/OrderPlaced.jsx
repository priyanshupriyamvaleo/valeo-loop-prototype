import { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import { USER } from '../data';
import { C } from '../theme';

/*
 * THE MOMENT AFTER PAYING.
 *
 * Until now the payment sheet closed and the patient was simply on Today, mid
 * sentence. Every subscription service marks this beat — Hims lands on "You're
 * all set", Ro welcomes you by name — because the second after money leaves an
 * account is when doubt arrives, and silence is the worst possible answer to
 * it.
 *
 * The rules the copy obeys: name the person, name what was bought, and then say
 * what happens next in the order it happens. No promises about outcomes, no
 * exclamation marks doing work the sentence should do, and the doctor gate is
 * stated as reassurance rather than a caveat — it is the reason this is safe.
 */
export default function OrderPlaced({ med, duration, eligible, renewal, onDone }) {
  const [shown, setShown] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShown(true), 80); return () => clearTimeout(t); }, []);

  const quarter = duration === 'quarter';
  const term = renewal
    ? (quarter ? 'next three months' : 'next month')
    : (quarter ? 'three months' : 'first month');
  const steps = renewal
    ? [
      'Your prescription is signed at the dose your clinician set.',
      'We dispense and pack it in cold chain.',
      quarter
        ? 'A nurse brings it to you and stays for your first dose.'
        : 'It arrives at your door, and we tell you the moment it is on its way.',
    ]
    : eligible
    ? [
      'Your prescription is already signed, so we go straight to the pharmacy.',
      'We dispense and pack it in cold chain.',
      duration === 'quarter'
        ? 'A nurse brings it to you and stays for your first dose.'
        : 'It arrives at your door, and we tell you the moment it is on its way.',
    ]
    : [
      'A DHA-licensed doctor reviews your order today.',
      'Once it is signed off we dispense and pack it in cold chain.',
      duration === 'quarter'
        ? 'A nurse brings it to you and stays for your first dose.'
        : 'It arrives at your door, and we tell you the moment it is on its way.',
    ];

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(180deg,#F2FBF6 0%,${C.cream} 34%)`,
    }}>
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 3, pt: 6, pb: 2 }}>
        <Box sx={{
          width: 62, height: 62, borderRadius: '50%', bgcolor: C.green,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: shown ? 1 : 0, transform: shown ? 'scale(1)' : 'scale(.82)',
          transition: 'opacity .4s, transform .45s cubic-bezier(.2,.9,.25,1)',
        }}>
          <CheckIcon sx={{ fontSize: 34, color: '#fff' }} />
        </Box>

        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 32, fontWeight: 600,
          lineHeight: 1.12, color: C.deep, mt: 3,
        }}>
          {renewal ? `Renewed, ${USER.first}.` : `You’re in, ${USER.first}.`}
        </Typography>

        <Typography sx={{ fontSize: 15.5, lineHeight: 1.6, color: C.ink, mt: 1.5 }}>
          Your {term} of {med || 'treatment'} is being prepared. Here is exactly what
          happens now.
        </Typography>

        <Stack spacing={0} sx={{ mt: 3.5 }}>
          {steps.map((t, i) => (
            <Stack key={t} direction="row" spacing={1.75} sx={{ alignItems: 'flex-start' }}>
              <Stack sx={{ alignItems: 'center', flexShrink: 0 }}>
                <Box sx={{
                  width: 26, height: 26, borderRadius: '50%', bgcolor: '#fff',
                  border: `1.5px solid ${C.line}`, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: C.deep,
                }}>{i + 1}</Box>
                {i < steps.length - 1 && (
                  <Box sx={{ width: 2, flex: 1, minHeight: 26, bgcolor: C.line, my: 0.5 }} />
                )}
              </Stack>
              <Typography sx={{
                fontSize: 14.5, lineHeight: 1.55, color: C.ink,
                pb: i < steps.length - 1 ? 2.25 : 0, pt: 0.25,
              }}>{t}</Typography>
            </Stack>
          ))}
        </Stack>

        <Typography sx={{ fontSize: 13, lineHeight: 1.6, color: C.ink2, mt: 3 }}>
          Everything from here lives on your Today screen: the doctor’s decision, the
          delivery, your doses, and your check-ins.
        </Typography>
      </Box>

      <Box sx={{ flexShrink: 0, px: 3, pt: 1.5, pb: 3 }}>
        <Stack direction="row" spacing={1} onClick={onDone} sx={{
          alignItems: 'center', justifyContent: 'center', py: 1.6,
          borderRadius: '999px', bgcolor: C.deep, color: '#fff', cursor: 'pointer',
        }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>Track my order</Typography>
          <ArrowForwardIcon sx={{ fontSize: 18 }} />
        </Stack>
      </Box>
    </Box>
  );
}
