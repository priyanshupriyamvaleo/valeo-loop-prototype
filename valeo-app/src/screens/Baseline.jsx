import { useState } from 'react';
import {
  Box, Button, IconButton, Stack, Typography, Divider,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import { PANEL, TWINS, DOCTOR } from '../data';
import { C } from '../theme';

const SLOTS = [
  { d: 'Tomorrow', t: '7:00 – 9:00 am', note: 'Fasted — best for glucose' },
  { d: 'Tomorrow', t: '6:00 – 8:00 pm' },
  { d: 'Thursday', t: '7:00 – 9:00 am', note: 'Fasted — best for glucose' },
  { d: 'Saturday', t: '8:00 – 10:00 am' },
];

/**
 * The baseline booking. This was the dead end — the deck offered a blood test
 * and nothing happened, which blocked every tier above Advanced.
 *
 * It's framed as the baseline rather than as an unlock, because that's what it
 * actually is: without it the first verdict has nothing to measure against.
 * The unlock is a side effect, not the point.
 */
export default function Baseline({ onBack, onDone }) {
  const [slot, setSlot] = useState(null);
  const [step, setStep] = useState('book');   /* book → booked → doctor */

  const unlocks = TWINS.filter((t) => t.tier === 'elite').length
    + TWINS.filter((t) => t.tier === 'adv' && t.blur).length;

  /* ── confirmation ── */
  if (step === 'booked') {
    const s = SLOTS[slot];
    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        background: `linear-gradient(172deg,#1E3F63,${C.night} 58%,#0B1B2E)`, color: '#fff',
      }}>
        <Box sx={{
          flex: '1 1 auto', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', px: 3.5, textAlign: 'center',
        }}>
          <CheckCircleIcon sx={{ fontSize: 62, color: '#6FD69B' }} />
          <Typography variant="overline" sx={{ color: C.yellow, mt: 2.5, display: 'block' }}>
            ◈ Baseline booked
          </Typography>
          <Typography variant="h1" sx={{ mt: 1.25 }}>
            A nurse comes {s.d.toLowerCase()}.
          </Typography>
          <Typography sx={{
            fontSize: 14.5, color: 'rgba(255,255,255,.66)', mt: 1.75, lineHeight: 1.5,
          }}>
            {s.t}, at home. Twenty minutes, one draw.
          </Typography>

          <Stack spacing={1.1} sx={{ mt: 4, width: '100%' }}>
            {[[`${unlocks} locked twins`, 'Unlocked now'],
              ['Elite tier', 'Open'],
              ['Your first verdict', 'Has something to measure against']].map(([k, v]) => (
              <Stack key={k} direction="row" spacing={1.5} sx={{
                alignItems: 'center', px: 2, py: 1.6, borderRadius: '15px',
                bgcolor: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
              }}>
                <CheckIcon sx={{ fontSize: 16, color: '#6FD69B', flexShrink: 0 }} />
                <Typography sx={{ flex: 1, fontSize: 13, textAlign: 'left' }}>{k}</Typography>
                <Typography sx={{
                  fontSize: 11, fontWeight: 700, color: C.yellow, flexShrink: 0,
                }}>{v}</Typography>
              </Stack>
            ))}
          </Stack>
        </Box>

        <Box sx={{ px: 2.75, pb: 3 }}>
          <Button fullWidth variant="contained" color="secondary"
                  endIcon={<ArrowForwardIcon />} onClick={() => setStep('doctor')}>
            Meet the doctor reading it
          </Button>
        </Box>
      </Box>
    );
  }


  /* ── who reads the panel ──
     A result nobody signs off on is just a number. Naming the clinician
     before the draw is what turns the panel from a data grab into care —
     and it's the same person the verdict comes from at week 12. */
  if (step === 'doctor') {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto' }}>
          {/* portrait band */}
          <Box sx={{
            position: 'relative', height: 268,
            background: `linear-gradient(160deg,${C.deep},#12283F)`,
          }}>
            <Box component="img" src={DOCTOR.img} alt=""
                 sx={{
                   position: 'absolute', inset: 0, width: '100%', height: '100%',
                   objectFit: 'cover', objectPosition: 'center 22%',
                 }} />
            {/* deep enough that the eyebrow holds against a bright sky */}
            <Box sx={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom,rgba(10,22,38,0) 22%,rgba(10,22,38,.55) 62%,rgba(10,22,38,.94) 100%)',
            }} />
            <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, px: 2.25, pb: 2 }}>
              <Typography sx={{
                fontSize: 8.5, fontWeight: 800, letterSpacing: '.2em',
                textTransform: 'uppercase', color: C.yellow,
              }}>◈ Your Valeo doctor</Typography>
              <Typography sx={{
                fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 600,
                color: '#fff', lineHeight: 1.12, mt: 0.6,
              }}>{DOCTOR.name}</Typography>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.7 }}>
                <VerifiedIcon sx={{ fontSize: 14, color: '#6FD69B' }} />
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,.8)' }}>
                  {DOCTOR.role}
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Box sx={{ px: 2.25, pt: 2.25 }}>
            {/* credentials as a strip, not prose */}
            <Stack direction="row" sx={{
              borderRadius: '16px', bgcolor: '#fff', overflow: 'hidden',
              boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
            }} divider={<Divider orientation="vertical" flexItem />}>
              {[['Licence', DOCTOR.reg], ['Practising', DOCTOR.years], ['Speaks', DOCTOR.langs]]
                .map(([k, v]) => (
                  <Box key={k} sx={{ flex: 1, minWidth: 0, px: 1.25, py: 1.5 }}>
                    <Typography sx={{
                      fontSize: 7.5, fontWeight: 800, letterSpacing: '.14em',
                      textTransform: 'uppercase', color: C.ink2,
                    }}>{k}</Typography>
                    <Typography sx={{
                      fontSize: 11, fontWeight: 700, color: C.deep, mt: 0.5, lineHeight: 1.3,
                    }}>{v}</Typography>
                  </Box>
                ))}
            </Stack>

            <Typography sx={{ fontSize: 13.5, color: C.ink2, mt: 2.25, lineHeight: 1.55 }}>
              {DOCTOR.name.split(' ')[1]} focuses on {DOCTOR.focus.toLowerCase()}. He'll have your
              panel before you do.
            </Typography>

            <Typography sx={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
              color: C.ink2, mt: 2.75, mb: 1.25,
            }}>What he does with it</Typography>
            <Stack spacing={1.1}>
              {DOCTOR.does.map((d) => (
                <Stack key={d} direction="row" spacing={1.5} sx={{
                  alignItems: 'flex-start', px: 1.9, py: 1.6, borderRadius: '15px', bgcolor: '#fff',
                  boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
                }}>
                  <CheckIcon sx={{ fontSize: 16, color: C.green, mt: '2px', flexShrink: 0 }} />
                  <Typography sx={{ fontSize: 13, lineHeight: 1.45, color: C.ink }}>{d}</Typography>
                </Stack>
              ))}
            </Stack>

            <Box sx={{
              mt: 2.5, mb: 1, p: 2, borderRadius: '18px',
              bgcolor: 'rgba(64,143,164,.10)', border: '1px solid rgba(64,143,164,.3)',
            }}>
              <Typography sx={{ fontSize: 12.5, color: C.ink, lineHeight: 1.55 }}>
                Nothing starts without his sign-off. If the panel says a protocol is wrong for you,
                he tells you that instead.
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{
          px: 2.25, pt: 1.5, pb: 3, borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
        }}>
          <Button fullWidth variant="contained" color="secondary" onClick={onDone}>
            See who just unlocked
          </Button>
        </Box>
      </Box>
    );
  }

  /* ── booking ── */
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack direction="row" sx={{ alignItems: 'center', px: 2.25, pt: 2, pb: 0.5 }}>
        <IconButton onClick={onBack} size="small" sx={{ ml: -0.5, color: C.deep }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
          textTransform: 'uppercase', color: C.green,
        }}>Half price this week</Typography>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pt: 1.5, pb: 2 }}>
        <Typography variant="h2" sx={{ color: C.deep }}>
          Your baseline.
        </Typography>
        <Typography sx={{ fontSize: 14, color: C.ink2, mt: 1.25, lineHeight: 1.5 }}>
          One draw at home. It becomes the number every verdict is measured against — and it
          opens {unlocks} locked twins on the way.
        </Typography>

        <Stack direction="row" spacing={1.75} sx={{
          alignItems: 'center', mt: 2.5, p: 2, borderRadius: '18px',
          bgcolor: 'rgba(64,143,164,.10)', border: `1px solid rgba(64,143,164,.3)`,
        }}>
          <HomeWorkIcon sx={{ fontSize: 26, color: C.teal, flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
              A nurse comes to you
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.3 }}>
              Al Olaya, Riyadh · 20 minutes · no clinic visit
            </Typography>
          </Box>
        </Stack>

        <Typography sx={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
          color: C.ink2, mt: 3, mb: 1.25,
        }}>What we measure</Typography>
        <Box sx={{
          borderRadius: '18px', bgcolor: '#fff', overflow: 'hidden',
          boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
        }}>
          {PANEL.map((row, i) => (
            <Box key={row.g}>
              {i > 0 && <Divider />}
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 2, py: 1.5 }}>
                <Typography sx={{
                  fontSize: 11, fontWeight: 800, color: C.deep, width: 92, flexShrink: 0,
                }}>{row.g}</Typography>
                <Typography sx={{ fontSize: 12, color: C.ink2, lineHeight: 1.4 }}>
                  {row.n}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>

        <Typography sx={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
          color: C.ink2, mt: 3, mb: 1.25,
        }}>Pick a slot</Typography>
        <Stack spacing={1.1}>
          {SLOTS.map((s, i) => {
            const on = slot === i;
            return (
              <Stack key={`${s.d}-${s.t}`} direction="row" spacing={1.5}
                     onClick={() => setSlot(i)} sx={{
                alignItems: 'center', px: 2, py: 1.8, borderRadius: '17px', cursor: 'pointer',
                bgcolor: on ? 'rgba(27,57,91,.05)' : '#fff',
                border: `1.5px solid ${on ? C.deep : 'transparent'}`,
                boxShadow: on ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
              }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>
                    {s.d} · {s.t}
                  </Typography>
                  {s.note && (
                    <Typography sx={{ fontSize: 11, color: C.green, mt: 0.3, fontWeight: 600 }}>
                      {s.note}
                    </Typography>
                  )}
                </Box>
                {on && <CheckIcon sx={{ fontSize: 20, color: C.deep, flexShrink: 0 }} />}
              </Stack>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{
        px: 2.25, pt: 1.5, pb: 3, borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1.25 }}>
          <Typography sx={{ fontSize: 19, fontWeight: 800, color: C.deep }}>SAR 449</Typography>
          <Typography sx={{
            fontSize: 13, color: C.ink2, textDecoration: 'line-through',
          }}>SAR 898</Typography>
          <Box sx={{ flex: 1 }} />
          <Typography sx={{ fontSize: 11, color: C.ink2 }}>Nothing charged today</Typography>
        </Stack>
        <Button fullWidth variant="contained" color="secondary"
                disabled={slot === null} onClick={() => setStep('booked')}>
          {slot === null ? 'Pick a slot to continue' : 'Book my blood test'}
        </Button>
      </Box>
    </Box>
  );
}
