import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/MicNone';
import VideocamIcon from '@mui/icons-material/VideocamOutlined';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CheckIcon from '@mui/icons-material/Check';
import { CALL_TOPICS, ETA_STEPS, GUIDED, READY_STEPS, USER,
         callbackAt, CALLBACK_MINUTES, coachOf, givenNameOf, onCallNow } from '../data';
import { C } from '../theme';

/**
 * THE LAST TWO MINUTES BEFORE A CONSULTATION.
 *
 * Five builds. The failures are worth keeping written down, because each one
 * looked correct until it was on a screen.
 *
 * A chat was a bot with a photograph. A search said "checking who is free" and
 * showed the routing system, which turns a clinic into a marketplace. A
 * preparation checklist was calm and left the patient idle. A single free text
 * box gave the patient something to do, but it read as an unrelated form
 * bolted to the bottom of a waiting page.
 *
 * ── THE THESIS ──
 * This is not a waiting screen. It is the last two minutes before a live
 * consultation, and both sides are getting ready. The clinician is reading the
 * file. The patient is deciding what to raise. One activity, two halves, one
 * screen. That idea decides every other choice here.
 *
 * ── WHY THE QUESTIONS ARE TAPS, NOT TYPING ──
 * They come from the clinical intake that already exists. Nothing was invented
 * to occupy the patient. A clinician reads the answers, so answering is worth
 * the patient's time, and each one costs a single tap.
 *
 * The consultation never depends on them. If the patient answers nothing, the
 * call opens at the same moment in the same way. The timers do not wait.
 *
 * ── CREAM, LIKE EVERY OTHER SCREEN ──
 * An earlier build made this dark. Darkness did carry a sense of a live
 * system, and that was the fault: the feeling came from the background rather
 * than from anything happening. It also broke the journey, because the screen
 * before it and the screen after it are both warm cream, so the patient
 * appeared to leave the clinic and enter a piece of software.
 *
 * The live feeling now comes from the components. A green dot marks the room
 * as live. A ring opens outward from the portrait. The estimate shortens in
 * gold. One status row pulses while the others rest. The call itself stays
 * dark, which is correct for video and is the only dark screen in the flow.
 *
 * ── WHY THE SCREEN MOVES ──
 * A static page says a request is queued. A page where the estimate shortens,
 * the clinician's state advances and the question changes says something is
 * arriving. That is the entire difference between logistics and care, and it
 * is built from three small pieces of motion rather than animation for its own
 * sake.
 *
 * ── NAMING THE CLINICIAN ──
 * `onCallNow` returns the practice lead deterministically, so the name on this
 * screen is true when it appears. If a real rota routed across a team, this
 * screen would say "your clinician" until somebody accepted, and only then
 * show a name. The copy must always match what the system actually knows.
 *
 * ── DEMO TIMING ──
 * The states and their order are real. The prototype runs them in about
 * fourteen seconds, because nobody reviewing this will wait two minutes. The
 * rail control "No clinician free" forces the delayed state, which matters more
 * than the happy path and which a reviewer would never otherwise reach.
 */
export default function Consultation({ pKey, onDone, failed }) {
  const c = coachOf(pKey);
  const doc = onCallNow(pKey);
  const first = givenNameOf(doc);

  const [phase, setPhase] = useState('live');   /* live | ready | fallback | call */
  const [stage, setStage] = useState(0);        /* which preparation state is active */
  const [qi, setQi] = useState(0);
  const [callAt, setCallAt] = useState('');
  const [held, setHeld] = useState(false);
  const [secs, setSecs] = useState(0);
  const [covered, setCovered] = useState(0);
  const timer = useRef(null);

  /* The clinician's half advances on its own. */
  useEffect(() => {
    if (phase !== 'live') return undefined;
    const a = setTimeout(() => setStage(1), 4200);
    const b = setTimeout(() => setStage(2), 9000);
    const d = setTimeout(() => setPhase('ready'), 12200);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(d); };
  }, [phase]);

  /* Arrival is short, and it opens the call without another tap. */
  useEffect(() => {
    if (phase !== 'ready') return undefined;
    const t = setTimeout(() => setPhase('call'), 2600);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (!failed || (phase !== 'live' && phase !== 'ready')) return;
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

  const face = (size, ring) => (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {ring && [0, 1].map((n) => (
        <Box key={n} sx={{
          position: 'absolute', inset: -6, borderRadius: '50%',
          border: '1.5px solid rgba(224,164,0,.45)',
          animation: 'halo 3s cubic-bezier(.2,.7,.3,1) infinite',
          animationDelay: `${n * 1.5}s`,
          '@keyframes halo': {
            '0%': { transform: 'scale(.86)', opacity: 0 },
            '30%': { opacity: .75 },
            '100%': { transform: 'scale(1.14)', opacity: 0 },
          },
        }} />
      ))}
      <Box sx={{
        width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden',
        border: `2.5px solid ${ring ? 'rgba(224,164,0,.55)' : 'rgba(39,153,91,.75)'}`,
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
    </Box>
  );

  /* ── DELAYED ─────────────────────────────────────────────────────── */
  if (phase === 'fallback') {
    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', px: 3.25,
        background: `linear-gradient(180deg,#FFF6E4 0%,${C.cream} 26%)`,
        animation: 'fadeIn .5s ease both',
        '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
      }}>
        {held ? (
          <>
            <Box sx={{
              width: 52, height: 52, borderRadius: '50%', bgcolor: C.greenSoft,
              display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
            }}><CheckIcon sx={{ fontSize: 26, color: C.green }} /></Box>
            <Typography variant="h1" sx={{ fontSize: 26, lineHeight: 1.2, color: C.deep }}>
              Your place is held.
            </Typography>
            <Typography sx={{
              fontSize: 15, color: C.ink2, mt: 1.75, lineHeight: 1.55,
            }}>
              {first} will call you at {callAt}. We will send a WhatsApp message
              two minutes before.
            </Typography>
            <Typography sx={{
              fontSize: 13.5, color: C.ink2, mt: 2.5, lineHeight: 1.55,
            }}>
              You can close the app. Nothing else is needed from you.
            </Typography>
          </>
        ) : (
          <>
            {/* Honest, and specific about who is busy. Vagueness at this point
                makes a patient wonder whether anybody is coming at all. */}
            <Typography variant="h1" sx={{
              fontSize: 26, lineHeight: 1.22, maxWidth: 300, color: C.deep,
            }}>
              This is taking longer than expected.
            </Typography>
            <Typography sx={{
              fontSize: 15, color: C.ink2, mt: 1.5, lineHeight: 1.55,
            }}>
              Our clinicians are with other patients right now.
            </Typography>

            <Stack direction="row" spacing={1.75} sx={{
              alignItems: 'center', mt: 3.25, px: 2, py: 2.25, borderRadius: '18px',
              bgcolor: '#fff', boxShadow: '0 3px 16px -11px rgba(27,57,91,.45)',
            }}>
              {face(46, false)}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                  fontSize: 15, fontWeight: 700, lineHeight: 1.35, color: C.deep,
                }}>
                  {first} will call you at {callAt}
                </Typography>
                <Typography sx={{
                  fontSize: 12.5, color: C.ink2, mt: 0.4, lineHeight: 1.45,
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

            <Typography onClick={onDone} sx={{
              fontSize: 12.5, color: C.ink2, textAlign: 'center',
              mt: 2.5, cursor: 'pointer', textDecoration: 'underline',
            }}>Choose another time</Typography>
          </>
        )}
      </Box>
    );
  }

  /* ── LIVE and ARRIVAL share one composition, so arrival is a change of
        state rather than a new page. ─────────────────────────────────── */
  if (phase === 'live' || phase === 'ready') {
    const here = phase === 'ready';
    const q = GUIDED[qi];
    const steps = here
      ? [`${first} is here`, 'Starting video']
      : READY_STEPS;
    const active = here ? 1 : stage;

    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        background: `linear-gradient(180deg,#FFF6E4 0%,${C.cream} 26%)`,
      }}>
        <Box sx={{
          flex: '1 1 auto', overflowY: 'auto', px: 3, pt: 2.5, pb: 2,
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        }}>
          {/* the room you are already in */}
          {/* A live room, stated as a chip rather than by making the whole
              screen dark. */}
          <Stack direction="row" spacing={0.8} sx={{
            alignItems: 'center', px: 1.25, py: 0.55, borderRadius: '999px',
            bgcolor: C.greenSoft,
          }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: '50%', bgcolor: C.green,
              animation: 'live 2s ease-in-out infinite',
              '@keyframes live': { '0%,100%': { opacity: 1 }, '50%': { opacity: .25 } },
            }} />
            <Typography sx={{
              fontSize: 9.5, fontWeight: 800, letterSpacing: '.18em',
              textTransform: 'uppercase', color: C.green,
            }}>Live consultation</Typography>
          </Stack>

          <Box sx={{ mt: 3.25 }}>{face(96, !here)}</Box>

          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 25, fontWeight: 600,
            lineHeight: 1.2, mt: 2.75, maxWidth: 290, color: C.deep,
          }}>
            {here ? `${first} is ready` : `${first} is getting ready to join you`}
          </Typography>

          {/* An estimate that shortens. Not a service guarantee. */}
          <Typography sx={{
            fontSize: 14, color: here ? C.ink2 : C.yellowDeep,
            mt: 1.2, fontWeight: here ? 400 : 600,
            transition: 'color .4s',
          }}>
            {here ? 'Starting your consultation…' : ETA_STEPS[stage]}
          </Typography>

          {/* three states, never more */}
          <Stack spacing={1.15} sx={{ mt: 3.25, width: '100%', maxWidth: 262 }}>
            {steps.map((t, n) => {
              const done = n < active;
              const now = n === active;
              return (
                <Stack key={t} direction="row" spacing={1.4} sx={{ alignItems: 'center' }}>
                  <Box sx={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: done ? C.greenSoft : 'rgba(27,57,91,.06)',
                    transition: 'background-color .5s',
                  }}>
                    {done
                      ? <CheckIcon sx={{ fontSize: 11, color: C.green }} />
                      : <Box sx={{
                          width: 5, height: 5, borderRadius: '50%',
                          bgcolor: now ? C.yellowDeep : 'rgba(27,57,91,.22)',
                          animation: now ? 'bl 1.4s ease-in-out infinite' : 'none',
                          '@keyframes bl': { '0%,100%': { opacity: 1 }, '50%': { opacity: .25 } },
                        }} />}
                  </Box>
                  <Typography sx={{
                    flex: 1, textAlign: 'left', fontSize: 13.5,
                    color: now ? C.deep : C.ink2,
                    fontWeight: now ? 600 : 400,
                    transition: 'color .4s',
                  }}>{t}</Typography>
                </Stack>
              );
            })}
          </Stack>

          {/* ── the patient's half of the same activity ── */}
          {!here && (
            <Box sx={{
              width: '100%', mt: 4, pt: 3.25, borderTop: `1px solid ${C.line}`,
            }}>
              {q ? (
                <>
                  <Stack direction="row" sx={{ alignItems: 'baseline', mb: 1.75 }}>
                    <Typography sx={{
                      flex: 1, textAlign: 'left', fontSize: 9.5, fontWeight: 800,
                      letterSpacing: '.16em', textTransform: 'uppercase',
                      color: C.ink2,
                    }}>While {first} gets ready</Typography>
                    <Typography sx={{ fontSize: 11, color: C.ink2 }}>
                      {qi + 1} of {GUIDED.length}
                    </Typography>
                  </Stack>

                  {/* One question at a time. Each answer replaces it, so the
                      screen never looks like a form to be completed. */}
                  <Box key={q.k} sx={{
                    animation: 'qIn .45s cubic-bezier(.2,.9,.25,1) both',
                    '@keyframes qIn': {
                      from: { opacity: 0, transform: 'translateY(10px)' },
                      to: { opacity: 1, transform: 'none' },
                    },
                  }}>
                    <Typography sx={{
                      fontSize: 16.5, fontWeight: 600, lineHeight: 1.35,
                      textAlign: 'left', mb: 1.6, color: C.deep,
                    }}>{q.q}</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.9 }}>
                      {q.o.map((o) => (
                        <Box key={o} onClick={() => setQi((n) => n + 1)} sx={{
                          px: 1.6, py: 1.05, borderRadius: '999px', cursor: 'pointer',
                          fontSize: 13.5, fontWeight: 500,
                          bgcolor: '#fff', color: C.deep,
                          border: '1px solid rgba(27,57,91,.16)',
                          boxShadow: '0 2px 10px -8px rgba(27,57,91,.5)',
                          '&:active': { bgcolor: 'rgba(255,185,0,.16)' },
                        }}>{o}</Box>
                      ))}
                    </Box>
                  </Box>
                </>
              ) : (
                <Stack direction="row" spacing={1.3} sx={{
                  alignItems: 'center', px: 2, py: 1.75, borderRadius: '16px',
                  bgcolor: C.greenSoft, border: '1px solid rgba(39,153,91,.22)',
                }}>
                  <CheckIcon sx={{ fontSize: 16, color: C.green, flexShrink: 0 }} />
                  <Typography sx={{
                    flex: 1, textAlign: 'left', fontSize: 13.5, lineHeight: 1.5, color: C.deep,
                  }}>
                    Thank you. {first} will see this before you talk.
                  </Typography>
                </Stack>
              )}
            </Box>
          )}
        </Box>

        {/* The one thing the patient needs to know about their own role. */}
        <Box sx={{ px: 3, pb: 3, pt: 1, flexShrink: 0 }}>
          <Typography sx={{
            fontSize: 11.5, color: C.ink2, textAlign: 'center', lineHeight: 1.5,
          }}>
            Stay on this screen. We will take you straight in when {first} is ready.
          </Typography>
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
