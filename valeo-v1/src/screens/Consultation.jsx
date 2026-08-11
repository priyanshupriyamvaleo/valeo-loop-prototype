import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/MicNone';
import VideocamIcon from '@mui/icons-material/VideocamOutlined';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CheckIcon from '@mui/icons-material/Check';
import { CALL_TOPICS, PREPARE_ITEMS, PREPARE_STEPS, USER,
         coachOf, givenNameOf, goalAim, onCallNow } from '../data';
import { C } from '../theme';

/**
 * THE FIRST CONSULTATION — prepare, then meet.
 *
 * Two earlier builds were wrong in two different ways.
 *
 * The first was a chat: the patient tapped answers to written questions. That
 * is a bot with a photograph.
 *
 * The second was a search. It said "Checking who is free now", showed a name
 * accepting the request, and put the team's faces on screen. That is the
 * inside of the routing system, and it makes a clinic look like a marketplace
 * with drivers. It also promised a person before a person had agreed.
 *
 * ── WHAT THE WAIT IS FOR ──
 * Connecting a clinician takes three to five minutes. The patient does not
 * need to know that a match is being found. The patient needs to know that the
 * consultation is being prepared, and roughly how long that takes.
 *
 * The wait then has a second use. This is a video consultation, and a patient
 * who takes the call in a corridor with two bars of signal gets a worse
 * consultation. So the screen spends the wait on preparation, and the patient
 * arrives at the call ready rather than merely present.
 *
 * ── THE PRODUCT PROMISE IS "YOUR CARE TEAM" ──
 * Before anybody accepts, the screen says "your clinician". It does not say
 * Jamie. Naming a person before that person has agreed invents a relationship
 * that may not happen, and the routing may reasonably send the patient to any
 * qualified clinician in the practice. The name and the face appear at the
 * moment they become true, and not before.
 *
 * ── WARM, NOT DARK ──
 * The previous screen is cream and so is this one. The dark treatment belonged
 * to the search, and darkness at this point reads as a system working rather
 * than a room being made ready. Only the call itself is dark, which is correct
 * for video.
 *
 * ── DEMO TIMING ──
 * The copy states the real range of three to five minutes. The prototype
 * advances in about nine seconds, because nobody reviewing this will sit
 * through four minutes. The states and their order are the real ones.
 */
export default function Consultation({ pKey, onDone }) {
  const c = coachOf(pKey);
  const doc = onCallNow(pKey);
  const first = givenNameOf(doc);

  const [phase, setPhase] = useState('preparing');
  const [step, setStep] = useState(1);
  const [secs, setSecs] = useState(0);
  const [covered, setCovered] = useState(0);
  const timer = useRef(null);

  /* Prepare, then a clinician accepts, then the call opens. */
  useEffect(() => {
    const a = setTimeout(() => setStep(2), 2600);
    const b = setTimeout(() => setPhase('ready'), 8000);
    const d = setTimeout(() => setPhase('call'), 11200);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(d); };
  }, []);

  useEffect(() => {
    if (phase !== 'call') return undefined;
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'call' || covered >= CALL_TOPICS.length) return undefined;
    const t = setTimeout(() => setCovered((n) => n + 1), covered === 0 ? 2600 : 2300);
    return () => clearTimeout(t);
  }, [phase, covered]);

  if (!c) return null;

  /* ── PHASE 1 · PREPARING ──────────────────────────────────────────── */
  if (phase === 'preparing') {
    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        background: `linear-gradient(180deg,#FFF6E4 0%,${C.cream} 26%)`,
      }}>
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 3, pt: 5, pb: 3 }}>
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 29, fontWeight: 600,
            lineHeight: 1.15, color: C.deep, maxWidth: 290,
          }}>Preparing your consultation</Typography>

          <Typography sx={{
            fontSize: 15, lineHeight: 1.55, color: C.ink2, mt: 1.5, maxWidth: 290,
          }}>
            We’ll connect you with your care team in about 3–5 minutes.
          </Typography>

          {/* Quiet, and never a queue position. It says work is happening and
              stops there. */}
          <Stack spacing={1.4} sx={{ mt: 3.5 }}>
            {PREPARE_STEPS.map((t, n) => {
              const ok = n < step;
              return (
                <Stack key={t} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box sx={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: ok ? 'rgba(39,153,91,.14)' : 'rgba(27,57,91,.06)',
                    transition: 'background-color .5s',
                  }}>
                    {ok
                      ? <CheckIcon sx={{ fontSize: 11, color: C.green }} />
                      : <Box sx={{
                          width: 5, height: 5, borderRadius: '50%', bgcolor: C.yellowDeep,
                          animation: 'pulseDot 1.8s ease-in-out infinite',
                          '@keyframes pulseDot': {
                            '0%,100%': { opacity: 1 }, '50%': { opacity: .25 },
                          },
                        }} />}
                  </Box>
                  <Typography sx={{
                    fontSize: 13.5, color: ok ? C.ink2 : C.deep,
                    fontWeight: ok ? 400 : 600,
                  }}>{t}</Typography>
                </Stack>
              );
            })}
          </Stack>

          {/* ── the wait, put to use ── */}
          <Typography sx={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase', color: C.ink2,
            mt: 5, pt: 3, borderTop: `1px solid ${C.line}`,
          }}>While we get everything ready</Typography>
          <Typography sx={{
            fontSize: 14.5, lineHeight: 1.55, color: C.ink2, mt: 1.5, mb: 3, maxWidth: 295,
          }}>
            A few small things can help make your consultation more useful.
          </Typography>

          <Stack spacing={2.75}>
            {PREPARE_ITEMS.map((x) => (
              <Stack key={x.t} direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                <Box sx={{
                  width: 6, height: 6, borderRadius: '50%', bgcolor: C.yellowDeep,
                  flexShrink: 0, mt: '8px',
                }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 15.5, fontWeight: 700, color: C.deep, lineHeight: 1.3,
                  }}>{x.t}</Typography>
                  <Typography sx={{
                    fontSize: 14, lineHeight: 1.5, color: C.ink2, mt: 0.5, maxWidth: 275,
                  }}>{x.s}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          {/* Built from what the patient already told us. It asks for nothing
              and adds no form. */}
          <Box sx={{
            mt: 4.5, px: 2.25, py: 2.25, borderRadius: '18px', bgcolor: '#fff',
            boxShadow: '0 3px 16px -12px rgba(27,57,91,.45)',
          }}>
            <Typography sx={{ fontSize: 14.5, lineHeight: 1.55, color: C.deep }}>
              You told us you want to {goalAim(pKey)}.
            </Typography>
            <Typography sx={{ fontSize: 13.5, lineHeight: 1.55, color: C.ink2, mt: 0.8 }}>
              If there is anything specific you want to cover, keep it in mind for
              the conversation.
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  /* ── PHASE 2 · A CLINICIAN HAS ACCEPTED ───────────────────────────── */
  if (phase === 'ready') {
    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', px: 3.5, textAlign: 'center',
        background: `linear-gradient(180deg,#FFF6E4 0%,${C.cream} 40%)`,
        animation: 'settle .6s cubic-bezier(.2,.9,.25,1) both',
        '@keyframes settle': {
          from: { opacity: 0 }, to: { opacity: 1 },
        },
      }}>
        {/* The name and the face appear now, because now they are true. */}
        <Box sx={{
          width: 104, height: 104, borderRadius: '50%', overflow: 'hidden',
          border: '3px solid #fff',
          boxShadow: '0 12px 30px -14px rgba(27,57,91,.5)',
          background: `linear-gradient(155deg,${doc.tone} 0%,rgba(11,21,34,.7) 145%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'pop .55s cubic-bezier(.2,.9,.25,1) both',
          '@keyframes pop': {
            from: { opacity: 0, transform: 'scale(.9)' },
            to: { opacity: 1, transform: 'none' },
          },
        }}>
          {doc.img
            ? <Box component="img" src={doc.img} alt="" sx={{
                width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
              }} />
            : <Typography sx={{
                fontFamily: '"Fraunces", serif', fontSize: 30, fontWeight: 600,
                color: 'rgba(255,255,255,.9)',
              }}>{doc.mono}</Typography>}
        </Box>

        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 27, fontWeight: 600,
          lineHeight: 1.15, color: C.deep, mt: 3,
        }}>Your clinician is ready</Typography>

        <Typography sx={{ fontSize: 16, fontWeight: 700, color: C.deep, mt: 2 }}>
          {doc.name}
        </Typography>
        <Typography sx={{ fontSize: 13.5, color: C.ink2, mt: 0.3 }}>
          {doc.role}
        </Typography>

        <Stack direction="row" spacing={0.7} sx={{ alignItems: 'center', mt: 4 }}>
          {[0, 1, 2].map((n) => (
            <Box key={n} sx={{
              width: 6, height: 6, borderRadius: '50%', bgcolor: C.yellowDeep,
              animation: 'wink 1.2s ease-in-out infinite',
              animationDelay: `${n * 0.18}s`,
              '@keyframes wink': { '0%,100%': { opacity: .25 }, '50%': { opacity: 1 } },
            }} />
          ))}
          <Typography sx={{ fontSize: 13, color: C.ink2, pl: 0.7 }}>
            Starting your consultation
          </Typography>
        </Stack>
      </Box>
    );
  }

  /* ── PHASE 3 · THE CALL ───────────────────────────────────────────── */
  const done = covered >= CALL_TOPICS.length;
  const clock = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative', bgcolor: '#0B1B2E', color: '#fff', overflow: 'hidden',
    }}>
      <Box sx={{ position: 'absolute', inset: 0 }}>
        {doc.img ? (
          <Box component="img" src={doc.img} alt="" sx={{
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 22%',
          }} />
        ) : (
          <Box sx={{
            width: '100%', height: '100%',
            background: `linear-gradient(155deg,${doc.tone} 0%,rgba(11,21,34,.9) 145%)`,
          }} />
        )}
        <Box sx={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(180deg,rgba(11,27,46,.72) 0%,rgba(11,27,46,.08) 26%,'
            + 'rgba(11,27,46,.35) 62%,rgba(11,27,46,.92) 100%)',
        }} />
      </Box>

      <Stack direction="row" spacing={1.2} sx={{
        position: 'relative', alignItems: 'center', px: 2.25, pt: 2.5, flexShrink: 0,
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{doc.name}</Typography>
          <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,.7)' }}>
            {doc.role}
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.7} sx={{
          alignItems: 'center', px: 1.15, py: 0.5, borderRadius: '999px',
          bgcolor: 'rgba(0,0,0,.35)',
        }}>
          <Box sx={{
            width: 6, height: 6, borderRadius: '50%', bgcolor: '#FF5A5A',
            animation: 'rec 1.6s ease-in-out infinite',
            '@keyframes rec': { '0%,100%': { opacity: 1 }, '50%': { opacity: .25 } },
          }} />
          <Typography sx={{ fontSize: 12, fontWeight: 700 }}>{clock}</Typography>
        </Stack>
      </Stack>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ position: 'relative', px: 2.25, pb: 1.5, flexShrink: 0 }}>
        <Typography sx={{
          fontSize: 9.5, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', mb: 1.4,
        }}>{done ? 'Consultation complete' : 'What you have covered'}</Typography>
        <Stack spacing={0.9}>
          {CALL_TOPICS.map((t, n) => {
            const ok = n < covered;
            const now = n === covered;
            if (!ok && !now) return null;
            return (
              <Stack key={t} direction="row" spacing={1.2} sx={{
                alignItems: 'center',
                animation: 'tin .4s cubic-bezier(.2,.9,.25,1) both',
                '@keyframes tin': {
                  from: { opacity: 0, transform: 'translateY(6px)' },
                  to: { opacity: 1, transform: 'none' },
                },
              }}>
                <Box sx={{
                  width: 17, height: 17, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: ok ? 'rgba(111,214,155,.22)' : 'rgba(255,255,255,.1)',
                }}>
                  {ok
                    ? <CheckIcon sx={{ fontSize: 10.5, color: '#6FD69B' }} />
                    : <Box sx={{
                        width: 5, height: 5, borderRadius: '50%', bgcolor: C.yellow,
                        animation: 'bl2 1.2s ease-in-out infinite',
                        '@keyframes bl2': { '0%,100%': { opacity: 1 }, '50%': { opacity: .3 } },
                      }} />}
                </Box>
                <Typography sx={{
                  fontSize: 13.5,
                  color: ok ? 'rgba(255,255,255,.92)' : '#fff',
                  fontWeight: now ? 700 : 400,
                }}>{t}</Typography>
              </Stack>
            );
          })}
        </Stack>
      </Box>

      <Box sx={{ position: 'relative', px: 2.25, pb: 3, pt: 1, flexShrink: 0 }}>
        {done && (
          <Typography sx={{
            fontSize: 13, color: 'rgba(255,255,255,.75)', textAlign: 'center',
            mb: 2, lineHeight: 1.5,
          }}>
            That is everything {first} needs. Your care brief is ready when you
            end the call.
          </Typography>
        )}
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'center', alignItems: 'center' }}>
          <Ctl><MicIcon sx={{ fontSize: 21 }} /></Ctl>
          <Box onClick={onDone} sx={{
            width: 62, height: 62, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: '#E5484D', color: '#fff',
            boxShadow: done ? '0 0 0 8px rgba(229,72,77,.18)' : 'none',
            transition: 'box-shadow .3s',
          }}><CallEndIcon sx={{ fontSize: 26 }} /></Box>
          <Ctl><VideocamIcon sx={{ fontSize: 21 }} /></Ctl>
        </Stack>
        <Typography sx={{
          fontSize: 11, color: 'rgba(255,255,255,.5)', textAlign: 'center', mt: 1.6,
        }}>
          {done ? 'End call' : `In consultation with ${first}`}
        </Typography>
      </Box>

      <Box sx={{
        position: 'absolute', right: 14, top: 74, width: 74, height: 100,
        borderRadius: '14px', overflow: 'hidden', zIndex: 2,
        bgcolor: '#16283C', border: '1px solid rgba(255,255,255,.14)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,.45)' }}>
          {USER.first}
        </Typography>
      </Box>
    </Box>
  );
}

function Ctl({ children }) {
  return (
    <Box sx={{
      width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'rgba(255,255,255,.14)', color: '#fff',
    }}>{children}</Box>
  );
}
