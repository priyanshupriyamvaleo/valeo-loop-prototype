import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/MicNone';
import VideocamIcon from '@mui/icons-material/VideocamOutlined';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CheckIcon from '@mui/icons-material/Check';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { CALL_TOPICS, MATCH_TIME, USER, callbackAt, CALLBACK_MINUTES,
         coachOf, givenNameOf, matchSteps, onCallNow } from '../data';
import { C } from '../theme';

/**
 * THE FIRST CONSULTATION — connect, then meet.
 *
 * Four builds. Each one failed differently, and the failures are worth keeping
 * written down.
 *
 * A chat was a bot with a photograph. A search said "checking who is free now"
 * and showed the inside of the routing system, which makes a clinic look like a
 * marketplace. A preparation checklist was calm and warm, and it left the
 * patient with nothing to do. An idle patient leaves.
 *
 * ── THE WAIT IS NOW AN INVESTMENT ──
 * One question sits under the status: anything else the clinician should know.
 * It does three jobs at once. The wait gains a purpose. The patient puts effort
 * into the session and becomes far less likely to abandon it. The consultation
 * is genuinely better for the answer.
 *
 * A ride-hailing app shows a car moving because the rider has nothing to
 * contribute. A patient has everything to contribute. That difference is the
 * whole design of this screen.
 *
 * ── A NAME, AND A VERB ──
 * "Jamie is reading what you shared" is believable. "Checking who is free" is
 * not, and it sounds like a call centre queue. A face plus an action reads as
 * care that has already started.
 *
 * ── THE FALLBACK IS THE IMPORTANT PART ──
 * The failure that loses a patient is not a ninety second wait. It is the quiet
 * fall back to a calendar. So when nobody connects, the screen holds the
 * patient's place with a real callback time in the same session, and the
 * calendar appears once, small, as the last option.
 *
 * ── NO EXITS ──
 * There is no back arrow and no navigation. The only ways out are forward, or
 * the small calendar link inside the fallback.
 *
 * ── DEMO TIMING ──
 * The copy states the real expectation. The prototype connects in about eleven
 * seconds, because nobody reviewing this will wait two minutes. The rail
 * control "No clinician free" forces the fallback, which is otherwise hard to
 * see and is the state that matters most.
 */
export default function Consultation({ pKey, onDone, failed }) {
  const c = coachOf(pKey);
  const doc = onCallNow(pKey);
  const first = givenNameOf(doc);
  const steps = matchSteps(first);

  const [phase, setPhase] = useState('matching');
  const [step, setStep] = useState(0);
  const [note, setNote] = useState('');
  const [sent, setSent] = useState('');
  const [held, setHeld] = useState(false);
  /* Fixed when the fallback appears, never recomputed. callbackAt() reads the
     clock, so calling it during render moved the promised time from 5:53 to
     5:54 between the offer and the confirmation. A time that changes while a
     patient reads it is worse than no time at all. */
  const [callAt, setCallAt] = useState('');
  const [secs, setSecs] = useState(0);
  const [covered, setCovered] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (phase !== 'matching') return undefined;
    const a = setTimeout(() => setStep(1), 9000);
    const b = setTimeout(() => setPhase('call'), 11500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [phase]);

  /* The rail forces the state that a reviewer would otherwise never see. */
  useEffect(() => {
    if (!failed || phase !== 'matching') return;
    setCallAt(callbackAt());
    setPhase('fallback');
  }, [failed, phase]);

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

  const face = (size) => (
    <Box sx={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      border: '2.5px solid rgba(255,255,255,.2)',
      background: `linear-gradient(155deg,${doc.tone} 0%,rgba(11,21,34,.7) 145%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {doc.img
        ? <Box component="img" src={doc.img} alt="" sx={{
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
          }} />
        : <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: size * 0.3,
            color: 'rgba(255,255,255,.9)',
          }}>{doc.mono}</Typography>}
    </Box>
  );

  /* ── FALLBACK · nobody connected ──────────────────────────────────── */
  if (phase === 'fallback') {
    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', px: 3.25, color: '#fff',
        background: `linear-gradient(172deg,#1E3F63,${C.night} 62%,#0B1B2E)`,
        animation: 'fadeIn .5s ease both',
        '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
      }}>
        {held ? (
          <>
            <Box sx={{
              width: 52, height: 52, borderRadius: '50%', bgcolor: 'rgba(111,214,155,.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
            }}><CheckIcon sx={{ fontSize: 26, color: '#6FD69B' }} /></Box>
            <Typography variant="h1" sx={{ fontSize: 26, lineHeight: 1.2 }}>
              Your place is held.
            </Typography>
            <Typography sx={{
              fontSize: 15, color: 'rgba(255,255,255,.68)', mt: 1.75, lineHeight: 1.55,
            }}>
              {first} will call you at {callAt}. We will send a WhatsApp message
              two minutes before.
            </Typography>
            <Typography sx={{
              fontSize: 13.5, color: 'rgba(255,255,255,.45)', mt: 2.5, lineHeight: 1.55,
            }}>
              You can close the app. Nothing else is needed from you.
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h1" sx={{ fontSize: 26, lineHeight: 1.22, maxWidth: 300 }}>
              All clinicians are with patients right now.
            </Typography>

            {/* A real time, in this session. Not a calendar. */}
            <Stack direction="row" spacing={1.75} sx={{
              alignItems: 'center', mt: 3.5, px: 2, py: 2.25, borderRadius: '18px',
              bgcolor: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.13)',
            }}>
              {face(46)}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35 }}>
                  {first} will call you at {callAt}
                </Typography>
                <Typography sx={{
                  fontSize: 12.5, color: 'rgba(255,255,255,.6)', mt: 0.4, lineHeight: 1.45,
                }}>
                  In about {CALLBACK_MINUTES} minutes. We will send a WhatsApp
                  message two minutes before.
                </Typography>
              </Box>
            </Stack>

            <Box onClick={() => setHeld(true)} sx={{
              mt: 3, py: 1.6, borderRadius: '999px', textAlign: 'center', cursor: 'pointer',
              bgcolor: C.yellow, color: C.deep, fontSize: 15, fontWeight: 700,
            }}>Hold my place</Box>

            {/* The only path to a calendar, and it is deliberately quiet. */}
            <Typography onClick={onDone} sx={{
              fontSize: 12.5, color: 'rgba(255,255,255,.38)', textAlign: 'center',
              mt: 2.5, cursor: 'pointer', textDecoration: 'underline',
            }}>Prefer another time?</Typography>
          </>
        )}
      </Box>
    );
  }

  /* ── MATCHING ─────────────────────────────────────────────────────── */
  if (phase === 'matching') {
    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        color: '#fff', background: `linear-gradient(172deg,#1E3F63,${C.night} 62%,#0B1B2E)`,
      }}>
        <Box sx={{
          flex: '1 1 auto', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', px: 3.25, textAlign: 'center',
        }}>
          <Box sx={{ position: 'relative', width: 108, height: 108, mb: 3.5 }}>
            {[0, 1].map((n) => (
              <Box key={n} sx={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '1.5px solid rgba(255,185,0,.4)',
                animation: 'halo 2.8s cubic-bezier(.2,.7,.3,1) infinite',
                animationDelay: `${n * 1.4}s`,
                '@keyframes halo': {
                  '0%': { transform: 'scale(.72)', opacity: 0 },
                  '30%': { opacity: .8 },
                  '100%': { transform: 'scale(1)', opacity: 0 },
                },
              }} />
            ))}
            <Box sx={{
              position: 'absolute', inset: '50% auto auto 50%', transform: 'translate(-50%,-50%)',
            }}>{face(80)}</Box>
          </Box>

          <Typography variant="h1" sx={{ fontSize: 25, lineHeight: 1.2 }}>
            Connecting you with {first}
          </Typography>

          {/* Verbs of care. Never a queue position. */}
          <Stack spacing={1.3} sx={{ mt: 3.25, width: '100%', maxWidth: 268 }}>
            {steps.map((t, n) => {
              const done = n < step;
              const now = n === step;
              return (
                <Stack key={t} direction="row" spacing={1.4} sx={{ alignItems: 'center' }}>
                  <Box sx={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: done ? 'rgba(111,214,155,.2)' : 'rgba(255,255,255,.08)',
                  }}>
                    {done
                      ? <CheckIcon sx={{ fontSize: 11, color: '#6FD69B' }} />
                      : <Box sx={{
                          width: 5, height: 5, borderRadius: '50%',
                          bgcolor: now ? C.yellow : 'rgba(255,255,255,.3)',
                          animation: now ? 'bl 1.4s ease-in-out infinite' : 'none',
                          '@keyframes bl': { '0%,100%': { opacity: 1 }, '50%': { opacity: .25 } },
                        }} />}
                  </Box>
                  <Typography sx={{
                    flex: 1, textAlign: 'left', fontSize: 13.5,
                    color: now ? '#fff' : 'rgba(255,255,255,.5)',
                    fontWeight: now ? 600 : 400,
                  }}>{t}</Typography>
                </Stack>
              );
            })}
          </Stack>

          <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,.42)', mt: 2.5 }}>
            {MATCH_TIME}
          </Typography>
        </Box>

        {/* ── the wait, spent on something useful ── */}
        <Box sx={{ px: 3.25, pb: 3.5, flexShrink: 0 }}>
          {sent ? (
            <Stack direction="row" spacing={1.3} sx={{
              alignItems: 'flex-start', px: 2, py: 1.75, borderRadius: '16px',
              bgcolor: 'rgba(111,214,155,.1)', border: '1px solid rgba(111,214,155,.22)',
              animation: 'noteIn .4s cubic-bezier(.2,.9,.25,1) both',
              '@keyframes noteIn': {
                from: { opacity: 0, transform: 'translateY(8px)' },
                to: { opacity: 1, transform: 'none' },
              },
            }}>
              <CheckIcon sx={{ fontSize: 15, color: '#6FD69B', flexShrink: 0, mt: '2px' }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,.6)' }}>
                  {first} will see this before you talk
                </Typography>
                <Typography sx={{ fontSize: 13.5, color: '#fff', mt: 0.5, lineHeight: 1.5 }}>
                  {sent}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <>
              <Typography sx={{
                fontSize: 13.5, color: 'rgba(255,255,255,.6)', mb: 1.4, textAlign: 'center',
              }}>
                Anything else {first} should know before you talk?
              </Typography>
              <Stack direction="row" spacing={1} sx={{
                alignItems: 'flex-end', pl: 2, pr: 0.6, py: 0.6, borderRadius: '20px',
                bgcolor: 'rgba(255,255,255,.09)', border: '1px solid rgba(255,255,255,.15)',
              }}>
                <Box component="textarea" rows={1} value={note} placeholder="Type here"
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (note.trim()) setSent(note.trim());
                    }
                  }}
                  sx={{
                    flex: 1, resize: 'none', border: 'none', outline: 'none',
                    background: 'transparent', color: '#fff', py: 1.1,
                    fontFamily: 'inherit', fontSize: 14, lineHeight: 1.5,
                    '&::placeholder': { color: 'rgba(255,255,255,.35)' },
                  }} />
                <Box onClick={() => note.trim() && setSent(note.trim())} sx={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0, mb: 0.4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: note.trim() ? 'pointer' : 'default',
                  bgcolor: note.trim() ? C.yellow : 'rgba(255,255,255,.12)',
                  color: note.trim() ? C.deep : 'rgba(255,255,255,.35)',
                }}><ArrowUpwardIcon sx={{ fontSize: 17 }} /></Box>
              </Stack>
            </>
          )}
        </Box>
      </Box>
    );
  }

  /* ── THE CALL ─────────────────────────────────────────────────────── */
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
