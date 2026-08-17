import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import MicIcon from '@mui/icons-material/MicNone';
import VideocamIcon from '@mui/icons-material/VideocamOutlined';
import CallEndIcon from '@mui/icons-material/CallEnd';
import CheckIcon from '@mui/icons-material/Check';
import { CALL_TOPICS, LINK_OPENS_MINUTES, USER,
         coachOf, givenNameOf, onCallNow } from '../data';
import { C } from '../theme';

/**
 * THE CONSULTATION — BOOKED, THEN HELD.
 *
 * This screen used to open by looking for a clinician who was free at that
 * second: three faces, a shortening estimate, a queue the patient could not
 * see, and a fallback for when nobody picked up. It read as an on-demand
 * marketplace, and it failed in the one way a clinic must not — by having
 * nobody there.
 *
 * A time replaces all of it. The slot was taken on the screen before this one,
 * from the next hour, and this screen is what the patient sees until it comes
 * round: who they are seeing, when, and the one honest fact about the link,
 * which is that it opens ten minutes early. Nothing pulses. There is nothing
 * to wait through, because waiting is no longer the product.
 *
 * ── CREAM, THEN DARK ──
 * The held screen is warm cream like every screen around it. The call itself
 * stays dark, which is correct for video and is still the only dark screen in
 * the flow.
 *
 * ── TWO ENDINGS, BOTH THE CLINICIAN'S ──
 * A consultation that can only end in yes is a formality with a camera on it.
 * The call ends by ending, and the clinician either approves or does not; the
 * no is not a dead end and never appears on this screen, because it belongs in
 * the conversation the patient was already having.
 */
export default function Consultation({ pKey, onDone, onDecline, slot, review }) {
  const c = coachOf(pKey);
  const doc = onCallNow(pKey);
  const first = givenNameOf(doc);

  /* held → the slot is booked and the link is not open yet. call → in it. */
  const [phase, setPhase] = useState(slot ? 'held' : 'call');
  const [secs, setSecs] = useState(0);
  const [covered, setCovered] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    if (phase !== 'call') return undefined;
    timer.current = setInterval(() => setSecs((x) => x + 1), 1000);
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

  /* ── BOOKED, AND NOT YET TIME ───────────────────────────────────── */
  if (phase === 'held') {
    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
        px: 3.25, background: `linear-gradient(180deg,#FFF6E4 0%,${C.cream} 26%)`,
      }}>
        <Box sx={{
          width: 52, height: 52, borderRadius: '50%', bgcolor: C.greenSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3,
        }}><CheckIcon sx={{ fontSize: 26, color: C.green }} /></Box>

        <Typography variant="h1" sx={{ fontSize: 26, lineHeight: 1.2, color: C.deep }}>
          You’re booked for {slot.t}.
        </Typography>

        <Stack direction="row" spacing={1.75} sx={{
          alignItems: 'center', mt: 3.25, px: 2, py: 2.25, borderRadius: '18px',
          bgcolor: '#fff', boxShadow: '0 3px 16px -11px rgba(27,57,91,.45)',
        }}>
          {face(46, false)}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, color: C.deep }}>
              {doc.name}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 0.4, lineHeight: 1.45 }}>
              {doc.role} · {doc.reg}
            </Typography>
          </Box>
        </Stack>

        <Typography sx={{ fontSize: 14, color: C.ink2, mt: 2.75, lineHeight: 1.55 }}>
          {review
            ? `Your link opens ${LINK_OPENS_MINUTES} minutes before. ${doc.short} has `
              + 'your answers already and will go through the safety question with you.'
            : `Your link opens ${LINK_OPENS_MINUTES} minutes before. We will send a `
              + 'WhatsApp message when it does.'}
        </Typography>

        {/* The demo cannot wait half an hour, and pretending otherwise would
            make this screen impossible to review. The label says what the
            control really is. */}
        <Box onClick={() => setPhase('call')} sx={{
          mt: 3.5, py: 1.6, borderRadius: '999px', textAlign: 'center', cursor: 'pointer',
          bgcolor: C.deep, color: '#fff', fontSize: 15, fontWeight: 700,
        }}>Join now</Box>

        <Typography sx={{
          fontSize: 11.5, color: C.ink2, textAlign: 'center', mt: 1.5, lineHeight: 1.5,
        }}>
          Nothing is charged, and nothing is prescribed until you have spoken.
        </Typography>
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
            {review
              ? `That is everything ${doc.short} needs to decide.`
              : `That is everything ${first} needs. Your care brief is ready when `
                + 'you end the call.'}
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

        {/* The second ending. A review call that can only end in yes is a
            formality with a camera on it, so the other answer is reachable
            from the same screen — quietly, because it is the rarer one. */}
        {review && onDecline && (
          <Typography onClick={onDecline} sx={{
            fontSize: 11.5, color: 'rgba(255,255,255,.55)', textAlign: 'center',
            mt: 1.4, cursor: 'pointer', textDecoration: 'underline',
          }}>
            {doc.short} cannot approve this
          </Typography>
        )}
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
