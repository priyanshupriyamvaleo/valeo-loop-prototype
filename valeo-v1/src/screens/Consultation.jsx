import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/MicNone';
import VideocamIcon from '@mui/icons-material/VideocamOutlined';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CheckIcon from '@mui/icons-material/Check';
import { CALL_TOPICS, LIVE, USER, coachOf, givenNameOf, onCallNow } from '../data';
import { C } from '../theme';

/**
 * THE FIRST CONSULTATION — connect now, then a live call.
 *
 * The first build of this screen was a chat. The patient tapped answers to
 * written questions and a clinician's name sat at the top. That is a bot with
 * a photograph, and it is the exact experience this screen exists to avoid.
 *
 * A consultation is a live meeting with a person. So this behaves the way an
 * on-demand service behaves: the patient asks, the system finds a clinician
 * who is free right now, and the call begins. Seconds, not days.
 *
 * ── TWO PHASES ──
 * CONNECTING borrows the pattern from on-demand booking. Something is being
 * searched for, the wait is bounded and stated, and the steps of the search
 * are visible. A blank spinner makes ten seconds feel like a failure; a stated
 * "usually under a minute" and a visible checklist makes the same ten seconds
 * feel like work being done.
 *
 * CALL is a video call. The clinician's face fills the screen, a timer runs,
 * and the controls are the three a phone call has. Nothing here is tappable
 * except ending the call, because in a real consultation the patient talks.
 *
 * ── WHY THE TOPIC LIST EXISTS ──
 * A video call gives a person looking at a prototype nothing to watch, and it
 * gives the patient no sense that the conversation is progressing. The topics
 * are a record of what has been covered, not questions to answer. They are the
 * five subjects the written questions used to ask, which a clinician now asks
 * out loud.
 *
 * The patient may end the call at any point. The consultation is complete once
 * every topic is covered, and only then does the Care Brief exist.
 */
export default function Consultation({ pKey, onDone }) {
  const c = coachOf(pKey);
  const doc = onCallNow(pKey);
  const first = givenNameOf(doc);

  const [phase, setPhase] = useState('connecting');
  const [found, setFound] = useState(false);
  const [secs, setSecs] = useState(0);
  const [covered, setCovered] = useState(0);
  const timer = useRef(null);

  /* The search: look, find, connect. */
  useEffect(() => {
    const a = setTimeout(() => setFound(true), 2200);
    const b = setTimeout(() => setPhase('call'), 4000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  /* The call clock. Real seconds, so the timer on screen is the truth. */
  useEffect(() => {
    if (phase !== 'call') return undefined;
    timer.current = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [phase]);

  /* Topics get covered as the conversation runs. */
  useEffect(() => {
    if (phase !== 'call' || covered >= CALL_TOPICS.length) return undefined;
    const t = setTimeout(() => setCovered((n) => n + 1), covered === 0 ? 2600 : 2300);
    return () => clearTimeout(t);
  }, [phase, covered]);

  if (!c) return null;
  const done = covered >= CALL_TOPICS.length;
  const clock = `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  /* ── PHASE 1 · CONNECTING ─────────────────────────────────────────── */
  if (phase === 'connecting') {
    const team = [...new Set(LIVE.map((k) => coachOf(k)))].slice(0, 4);
    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', px: 3.5, textAlign: 'center',
        background: `linear-gradient(172deg,#1E3F63,${C.night} 62%,#0B1B2E)`, color: '#fff',
      }}>
        {/* The rings say a search is running. They stop when somebody answers. */}
        <Box sx={{ position: 'relative', width: 132, height: 132, mb: 4 }}>
          {!found && [0, 1, 2].map((n) => (
            <Box key={n} sx={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: '1.5px solid rgba(255,185,0,.45)',
              animation: 'ring 2.4s cubic-bezier(.2,.7,.3,1) infinite',
              animationDelay: `${n * 0.8}s`,
              '@keyframes ring': {
                '0%':   { transform: 'scale(.55)', opacity: 0 },
                '25%':  { opacity: .85 },
                '100%': { transform: 'scale(1)', opacity: 0 },
              },
            }} />
          ))}
          <Box sx={{
            position: 'absolute', inset: '50% auto auto 50%',
            transform: 'translate(-50%,-50%)',
            width: 74, height: 74, borderRadius: '50%', overflow: 'hidden',
            border: `2.5px solid ${found ? '#6FD69B' : 'rgba(255,255,255,.22)'}`,
            transition: 'border-color .4s',
            background: `linear-gradient(155deg,${doc.tone} 0%,rgba(11,21,34,.7) 145%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {doc.img
              ? <Box component="img" src={doc.img} alt="" sx={{
                  width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                }} />
              : <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 22, color: 'rgba(255,255,255,.9)',
                }}>{doc.mono}</Typography>}
          </Box>
        </Box>

        <Typography variant="h1" sx={{ fontSize: 25, lineHeight: 1.2 }}>
          {found ? `${first} is joining.` : `Connecting you to ${c.short}’s practice.`}
        </Typography>
        <Typography sx={{
          fontSize: 14, color: 'rgba(255,255,255,.62)', mt: 1.4, lineHeight: 1.5,
        }}>
          {found
            ? `${doc.role}. ${doc.years} years experience.`
            : 'Someone is usually free in under a minute.'}
        </Typography>

        {/* The search, step by step. Silence during a wait reads as a fault. */}
        <Stack spacing={1.2} sx={{ mt: 4.5, width: '100%', maxWidth: 260 }}>
          {[['Checking who is free now', true],
            [`${first} accepted your request`, found],
            ['Starting your call', found && false]].map(([t, ok], n) => (
            <Stack key={t} direction="row" spacing={1.4} sx={{ alignItems: 'center' }}>
              <Box sx={{
                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: ok ? 'rgba(111,214,155,.2)' : 'rgba(255,255,255,.07)',
              }}>
                {ok
                  ? <CheckIcon sx={{ fontSize: 11, color: '#6FD69B' }} />
                  : <Box sx={{
                      width: 5, height: 5, borderRadius: '50%', bgcolor: 'rgba(255,255,255,.35)',
                      animation: 'bl 1.3s ease-in-out infinite',
                      '@keyframes bl': { '0%,100%': { opacity: 1 }, '50%': { opacity: .25 } },
                    }} />}
              </Box>
              <Typography sx={{
                flex: 1, textAlign: 'left', fontSize: 13,
                color: ok ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.45)',
              }}>{t}</Typography>
            </Stack>
          ))}
        </Stack>

        {!found && (
          <Stack direction="row" spacing={-0.8} sx={{ mt: 4.5 }}>
            {team.map((m, n) => (
              <Box key={m.name} sx={{
                width: 26, height: 26, borderRadius: '50%', overflow: 'hidden',
                ml: n === 0 ? 0 : '-8px', border: '2px solid #0B1B2E',
                background: `linear-gradient(155deg,${m.tone} 0%,rgba(11,21,34,.7) 145%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {m.img
                  ? <Box component="img" src={m.img} alt="" sx={{
                      width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                    }} />
                  : <Typography sx={{ fontSize: 9, color: 'rgba(255,255,255,.85)' }}>{m.mono}</Typography>}
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    );
  }

  /* ── PHASE 2 · THE CALL ───────────────────────────────────────────── */
  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      position: 'relative', bgcolor: '#0B1B2E', color: '#fff', overflow: 'hidden',
    }}>
      {/* The clinician fills the screen, the way a video call does. */}
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

      {/* who, and how long */}
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
          <Typography sx={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 700 }}>
            {clock}
          </Typography>
        </Stack>
      </Stack>

      <Box sx={{ flex: 1 }} />

      {/* What has been covered so far. Not questions. A record. */}
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

      {/* the three controls a call has */}
      <Box sx={{ position: 'relative', px: 2.25, pb: 3, pt: 1, flexShrink: 0 }}>
        {done && (
          <Typography sx={{
            fontSize: 13, color: 'rgba(255,255,255,.75)', textAlign: 'center',
            mb: 2, lineHeight: 1.5,
          }}>
            {/* No pronoun. A clinician's pronouns are not stated anywhere in
                this product, and guessing one from a name gets it wrong. */}
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

      {/* Self view. Dark and empty on purpose: this prototype has no camera,
          and a stock face here would be a stranger in the patient's own tile. */}
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
