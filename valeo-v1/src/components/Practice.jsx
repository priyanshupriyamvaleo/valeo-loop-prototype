import { useEffect, useRef, useState } from 'react';
import { Box, Drawer, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { practiceScript, runOf, statusOf } from '../data';
import { C } from '../theme';

/**
 * {CLINICIAN}'S PRACTICE — one thread, for the entire relationship.
 *
 * This component replaces two things: a pre-consultation assistant that lived on
 * its own screen and belonged to the clinician, and a concierge sheet that
 * belonged to Valeo. Both read well in isolation. Together they asked the
 * patient a question no patient should ever be asked — "is this one for the
 * practice or one for support?" — and every extra identity in a product is a
 * routing decision offloaded onto the person least equipped to make it.
 *
 * In a real clinic you message the practice. What happens next — reception, a
 * nurse, the doctor, a system — is the clinic's business. So there is now one
 * thread, it carries one name, and it never changes hands.
 *
 * ── WHAT IS DIFFERENT FROM THE CONCIERGE IT REPLACES ──
 * · HISTORY IS REAL. Messages are dispatched into the run, not rendered from
 *   the current state. Close it in week two and week six still contains it.
 * · PREPARATION HAPPENS HERE. It is not an errand that looks like chat; it is
 *   the first thing the practice ever says, in the thread it says everything
 *   else in. Finishing it does not point you at another surface, because there
 *   is no other surface to point at.
 * · THE VOICE IS "WE". A practice, not an assistant. "We'll message you", "tell
 *   us" — which is also the honest description of what is behind it.
 *
 * Nothing here names a technology. Whether an answer came from a model, from
 * operations or from the clinician is ours to know; the moment the product
 * explains which, it stops being a clinic and becomes software again.
 *
 * There is no composer. This surface is deliberately not a live chat: the
 * practice sends updates, the FAQ chips answer the questions people actually
 * have, and anything beyond that goes to support on WhatsApp — one green chip,
 * where every patient in the region already expects support to live. A text
 * box here would promise a reply SLA nobody is staffed to keep.
 */
export default function Practice({ open, onClose, st, pKey, dispatch }) {
  const feed = useRef(null);
  const [typing, setTyping] = useState(false);

  const r = pKey ? runOf(st || {}, pKey) : null;
  const status = pKey ? statusOf(st || {}, pKey) : 'none';
  const script = practiceScript(st || {}, pKey);
  const c = script.clinician;
  const thread = (r && r.thread) || [];

  /* The preparation questions used to run here, during the wait between
     booking a consultation and attending it. There is no wait now: the
     consultation is immediate, and the clinician asks those questions inside
     it. So this thread carries messages and answers only. */

  /* ── the stage announces itself, once, and then it is history ──
     Dispatched rather than rendered: see the reducer's `say`.

     Deliberately NOT gated on `open`. The sheet is always mounted, and a clinic
     messages you when the thing happens, not when you next happen to look — so
     passing through a stage without opening the thread must still leave the
     message in it. Gating on open lost exactly that: book a blood draw, walk
     past the sheet, and the thread had a hole where the confirmation should be.

     The beat before it lands is not decoration. A message already sitting there
     when the sheet finishes opening reads as a page; one that arrives reads as
     someone answering. */
  useEffect(() => {
    if (!pKey || !dispatch) return undefined;
    if ((r && r.said || []).includes(script.key)) return undefined;
    if (open) setTyping(true);
    const t = setTimeout(() => {
      dispatch({ type: 'say', protocol: pKey, key: script.key,
                 msgs: script.lines.map((t2) => ({ w: 'them', t: t2 })) });
      setTyping(false);
    }, open ? (thread.length ? 700 : 450) : 900);
    return () => clearTimeout(t);
  }, [pKey, script.key, open]);

  /* opening the thread is what marks it read */
  useEffect(() => {
    if (!open || !pKey || !dispatch) return;
    if ((r && r.seen) === thread.length) return;
    dispatch({ type: 'seen', protocol: pKey, n: thread.length });
  }, [open, thread.length]);

  useEffect(() => {
    if (open && feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [open, thread.length, typing]);

  const say = (msgs, key) => dispatch({ type: 'say', protocol: pKey, key, msgs });

  const asked = thread.filter((m) => m.w === 'me').map((m) => m.t);
  const chips = script.chips.filter((x) => !asked.includes(x.q));

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: {
          sx: {
            position: 'absolute', borderTopLeftRadius: 26, borderTopRightRadius: 26,
            height: '92%', bgcolor: C.cream, backgroundImage: 'none',
          },
        },
      }}>
      {/* ── one name on the door ── */}
      <Stack direction="row" spacing={1.3} sx={{
        alignItems: 'center', px: 2.25, py: 1.6, flexShrink: 0,
        borderBottom: `1px solid ${C.line}`,
      }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
          background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {c.img
            ? <Box component="img" src={c.img} alt="" sx={{
                width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
              }} />
            : <Typography sx={{
                fontFamily: '"Fraunces", serif', fontSize: 12, fontWeight: 600,
                color: 'rgba(255,255,255,.9)',
              }}>{c.mono}</Typography>}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.deep }}>
            {c.short}’s Practice
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: C.green }} />
            <Typography sx={{ fontSize: 10.5, color: C.ink2 }}>
              Updates and quick answers
            </Typography>
          </Stack>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: C.ink2 }}>
          <CloseIcon sx={{ fontSize: 19 }} />
        </IconButton>
      </Stack>

      <Box ref={feed} sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, py: 2 }}>
        {thread.map((m, n) => (
          <Bubble key={n} mine={m.w === 'me'} mt={n > 0}>{m.t}</Bubble>
        ))}
        {typing && <Dots />}
      </Box>

      {/* ── strictly the questions, plus the one door to a human ── */}
      <Box sx={{
        px: 2.25, pt: 1.5, pb: 2.5, flexShrink: 0, borderTop: `1px solid ${C.line}`,
      }}>
        <Typography sx={{
          fontSize: 9.5, fontWeight: 800, letterSpacing: '.13em',
          textTransform: 'uppercase', color: C.ink2, mb: 1,
        }}>Common questions</Typography>

        {chips.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 1.25 }}>
            {chips.map((x) => (
              <Stack key={x.q} direction="row" spacing={0.7}
                onClick={() => say([{ w: 'me', t: x.q },
                                    ...x.a.map((t) => ({ w: 'them', t }))])}
                sx={{
                  alignItems: 'center', flexShrink: 0, px: 1.5, py: 0.9,
                  borderRadius: '999px', cursor: 'pointer', bgcolor: '#fff',
                  border: '1px solid rgba(27,57,91,.16)',
                  '&:active': { bgcolor: 'rgba(27,57,91,.05)' },
                }}>
                <Box sx={{ fontSize: 13, lineHeight: 1 }}>{x.ic}</Box>
                <Typography sx={{
                  fontSize: 13, fontWeight: 500, color: C.deep, whiteSpace: 'nowrap',
                }}>{x.q}</Typography>
              </Stack>
            ))}
          </Box>
        )}

        {/* Static in this build: the chip is the design, the deep link comes
            with the real WhatsApp Business number. */}
        <Stack direction="row" spacing={1} sx={{
          alignItems: 'center', justifyContent: 'center', px: 1.75, py: 1.15,
          borderRadius: '999px', cursor: 'pointer',
          bgcolor: 'rgba(37,211,102,.13)', border: '1.5px solid rgba(37,211,102,.55)',
          '&:active': { bgcolor: 'rgba(37,211,102,.2)' },
        }}>
          <WhatsAppIcon sx={{ fontSize: 18, color: '#1DA851' }} />
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#128C4B' }}>
            Chat with support on WhatsApp
          </Typography>
        </Stack>
      </Box>
    </Drawer>
  );
}

function Bubble({ mine, mt, children }) {
  return (
    <Box sx={{
      display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start',
      mt: mt ? 0.7 : 0,
      animation: 'bIn .32s cubic-bezier(.2,.9,.25,1) both',
      '@keyframes bIn': {
        from: { opacity: 0, transform: 'translateY(6px)' },
        to: { opacity: 1, transform: 'none' },
      },
    }}>
      <Box sx={{
        maxWidth: '86%', px: 1.7, py: 1.1, borderRadius: '16px',
        borderBottomRightRadius: mine ? '5px' : '16px',
        borderBottomLeftRadius: mine ? '16px' : '5px',
        bgcolor: mine ? C.deep : '#fff',
        boxShadow: mine ? 'none' : '0 2px 10px -7px rgba(27,57,91,.3)',
      }}>
        <Typography sx={{
          fontSize: 13.5, lineHeight: 1.5, color: mine ? '#fff' : C.ink,
        }}>{children}</Typography>
      </Box>
    </Box>
  );
}

function Dots() {
  return (
    <Box sx={{ display: 'flex', mt: 0.7 }}>
      <Stack direction="row" spacing={0.55} sx={{
        px: 1.5, py: 1.1, borderRadius: '16px', borderBottomLeftRadius: '5px', bgcolor: '#fff',
        boxShadow: '0 2px 10px -7px rgba(27,57,91,.3)',
      }}>
        {[0, 1, 2].map((n) => (
          <Box key={n} sx={{
            width: 6, height: 6, borderRadius: '50%', bgcolor: C.ink2,
            animation: 'cad 1.1s ease-in-out infinite', animationDelay: `${n * 0.16}s`,
            '@keyframes cad': {
              '0%,60%,100%': { opacity: 0.3, transform: 'translateY(0)' },
              '30%': { opacity: 1, transform: 'translateY(-3px)' },
            },
          }} />
        ))}
      </Stack>
    </Box>
  );
}
