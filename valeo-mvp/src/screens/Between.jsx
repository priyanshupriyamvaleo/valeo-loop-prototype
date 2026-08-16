import { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import VerifiedIcon from '@mui/icons-material/Verified';
import { COACHES, USER } from '../data';
import { C } from '../theme';

/**
 * THE GREETING — someone just started talking to you.
 *
 * The north star for every decision on this screen: does this feel like
 * software, or does it feel like meeting a doctor? Previous versions kept
 * answering "software" for one structural reason — they used Apple's onboarding
 * layout (centred, balanced, hero copy, poster) to try to produce iMessage's
 * feeling (left-aligned, asymmetric, whitespace, speech). Those aesthetics are
 * opposites. Centred and perfectly balanced reads as *composed for you*; humans
 * don't communicate in centred columns.
 *
 * So the whole lower half is left-aligned now. The one exception is the fan of
 * faces at the top, which stays centred deliberately: that is the iMessage
 * convention exactly — the contact sits centred at the head of a thread, and the
 * conversation runs left beneath it. Centred = who you're with. Left = what
 * they're saying.
 *
 * ── THE SCREEN ASSEMBLES ITSELF ──
 * Nothing is on screen at once. A line lands, a typing indicator runs, the next
 * line lands. By the time the goals drift in, you haven't read an onboarding
 * page — you've watched the first few seconds of a conversation. Impatience is
 * respected: tapping anywhere skips to the end.
 *
 * ── HIERARCHY ──
 * Only one thing is loud. "Hi Faisal" at 38 carries the screen; the doctor's
 * name is 14, the reassurance 20, the question 18. Previously all four had
 * roughly equal weight and the screen shouted in four directions at once.
 *
 * ── SPACING IS EMOTIONAL, NOT EVEN ──
 * Question and goals sit close, because they're one thought — a question and its
 * answers. Big gaps separate the greeting from the note from the way out.
 * Even rhythm is what makes a layout read as generated.
 *
 * ── GOALS AS DRIFTING SUGGESTIONS, NOT PILLS ──
 * A pill is a UI component; it announces a control. These are bare — emoji and
 * words, no border, no fill — so they read as thoughts on offer rather than
 * buttons to press. They drift slowly, and the drift is real scroll position, so
 * the first touch stops it and the row becomes an ordinary swipeable list. A
 * target that slides away as you reach for it is a cruelty; ambience must yield
 * to intent the instant intent appears.
 *
 * ── NO PRIMARY BUTTON ──
 * The yellow bar was the last piece of app furniture on the screen. Tapping a
 * goal opens the chat carrying that goal, so a separate "continue" is redundant
 * — and answering a question is a more natural human act than pressing a button.
 * "Say hi" survives only as a quiet line, because a user whose goal isn't among
 * the four still needs a way in, and there is never an excuse to trap someone.
 *
 * NOTE: two of the three portraits are placeholders. The claim here is that these
 * are real people who will remember you; monograms quietly contradict it.
 */

/* When each line lands, in ms. `typ` beats are the typing indicator. */
const SCRIPT = [
  { at: 250,  b: 'hi' },
  { at: 800,  b: 'typ1' },
  { at: 1500, b: 'glad' },
  { at: 1900, b: 'typ2' },
  { at: 2550, b: 'ask' },
  { at: 2850, b: 'goals' },
  /* THE PAUSE. Nothing happens for ~850ms after the goals land, then the dots
     start again. That silence is the "before we begin, I want you to know
     something" beat — delivered as timing rather than as a line of copy, so the
     finalised wording is untouched and the moment still reads as the doctor
     stopping to add one last thing. */
  { at: 3700, b: 'typ3' },
  { at: 4500, b: 'note' },
  { at: 5000, b: 'reply' },
];
const ORDER = ['none', 'hi', 'typ1', 'glad', 'typ2', 'ask', 'goals', 'typ3', 'note', 'reply'];

export default function Between({ onStart, onBack }) {
  /* The weight-loss care team only: the endocrinologist who leads it, the
     internal-medicine doctor behind the metabolic panels, the performance
     coach. A postpartum OB-GYN in this fan would tell the patient we're a
     general store, and this shop sells one thing. */
  const team = ['C_LAYLA', 'C_MAHMOUD', 'C_OMAR'].map((k) => COACHES[k]);
  const [beat, setBeat] = useState('none');
  const [leaving, setLeaving] = useState(false);
  const at = (b) => ORDER.indexOf(beat) >= ORDER.indexOf(b);

  useEffect(() => {
    const ts = SCRIPT.map((s) => setTimeout(() => setBeat(s.b), s.at));
    return () => ts.forEach(clearTimeout);
  }, []);

  const go = (goalKey) => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(() => onStart(goalKey || null), 250);
  };

  return (
    <Box
      /* impatience is respected — one tap and the whole script resolves */
      onClick={() => { if (beat !== 'reply') setBeat('reply'); }}
      sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        background: `linear-gradient(180deg,#FFF6E4 0%,${C.cream} 30%)`,
      }}>
      <Box sx={{ px: 1.5, pt: 1.5, flexShrink: 0 }}>
        <IconButton onClick={(e) => { e.stopPropagation(); onBack(); }} size="small"
          sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      <Box sx={{
        flex: '1 1 auto', overflowY: 'auto', pb: 2,
        opacity: leaving ? 0 : 1,
        transform: leaving ? 'translateY(-10px)' : 'none',
        transition: 'opacity .22s, transform .25s',
      }}>
        {/* ── who you're with · centred, like the head of a thread ── */}
        <Fan team={team} />

        {/* ── what they're saying · left, like the thread itself ── */}
        <Box sx={{ px: 3 }}>
          <Rise on={at('hi')}>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 38, fontWeight: 600,
              lineHeight: 1.1, color: C.deep, mt: 3.5,
            }}>
              Hi {USER.first} 👋
            </Typography>
          </Rise>

          {beat === 'typ1' && <Dots />}

          <Rise on={at('glad')}>
            <Typography sx={{
              fontSize: 20, lineHeight: 1.45, color: C.ink, mt: 1.5, fontWeight: 400,
            }}>
              You’re in the right place.
            </Typography>
            <Typography sx={{
              fontSize: 15, lineHeight: 1.55, color: C.ink2, mt: 1.25,
            }}>
              GLP-1 weight loss, prescribed by a doctor and delivered to your
              door.
            </Typography>
          </Rise>

          {beat === 'typ2' && <Dots />}

          {/* the question and its answers are ONE thought — they sit close */}
          <Rise on={at('ask')}>
            <Typography sx={{
              fontSize: 18, lineHeight: 1.45, color: C.deep, fontWeight: 600, mt: 3,
            }}>
              Shall we get you started?
            </Typography>
          </Rise>
        </Box>

        <Rise on={at('goals')}>
          <Drift onPick={go} />
        </Rise>

        {/* ── the pause, then one last thing ── */}
        <Box sx={{ px: 3 }}>
          {beat === 'typ3' && <Box sx={{ mt: 4 }}><Dots /></Box>}

          {/* NOT A CARD.
              A border, symmetrical padding and a tinted rectangle are the visual
              grammar of *content inserted into a page* — an info box. This is the
              same person still speaking, so it gets no container at all. What sets
              it apart instead is a single hairline down the left margin, the way a
              written aside is marked, and a lot of air above it.

              The type descends 21 → 14.5 → 14 and then lifts slightly to 15 on the
              closing line, so the eye moves through it the way a voice moves
              through a sentence — settling, then rising at the end. A single flat
              size is what makes a paragraph read as a block of content. */}
          <Rise on={at('note')}>
            <Box sx={{
              mt: at('typ3') && beat !== 'typ3' ? 4 : 2.5,
              pl: 2.5, borderLeft: '2px solid rgba(224,164,0,.4)',
            }}>
              <Stack direction="row" spacing={0.7} sx={{ alignItems: 'center', mb: 1.6 }}>
                <Box sx={{ fontSize: 12, lineHeight: 1 }}>💛</Box>
                <Typography sx={{
                  fontSize: 11.5, color: C.ink2, fontStyle: 'italic', letterSpacing: '.01em',
                }}>A quick note</Typography>
              </Stack>

              <Typography sx={{
                fontFamily: '"Fraunces", serif', fontSize: 21, fontWeight: 600,
                lineHeight: 1.35, color: C.deep,
              }}>
                You’ll be in good hands.
              </Typography>

              <Typography sx={{ fontSize: 14.5, lineHeight: 1.6, color: C.ink, mt: 1.75 }}>
                A licensed doctor reviews every order before it ships.
              </Typography>

              {/* the breaks are breath, not wrapping */}
              <Typography sx={{ fontSize: 14, lineHeight: 1.8, color: C.ink2, mt: 1.75 }}>
                Real doctors reading your answers,<br />
                medication delivered to your door,<br />
                check-ins that keep your dose right…
              </Typography>

              <Typography sx={{
                fontSize: 15, lineHeight: 1.6, color: C.deep, mt: 1.75, fontWeight: 500,
              }}>
                and we’re only a message away.
              </Typography>
            </Box>
          </Rise>
        </Box>
      </Box>

      {/* ── YOUR TURN ──
          Not a button. At the foot of a conversation, a composer is the universal
          signal that the other person has stopped and is waiting for you — nobody
          has to be told what it means or decide to "press the CTA". The doctor's
          words sit above, your reply sits below: the relationship between the two
          is the oldest layout in messaging, and it does the work that a labelled
          button was failing to do.

          No caret and no keyboard is summoned, because there is nothing to type
          into yet — a blinking cursor would promise an input we don't have. It
          rests, the way a composer rests before you touch it. */}
      <Rise on={at('reply')}>
        <Box sx={{
          px: 3, pt: 3, pb: 3, flexShrink: 0,
          /* fades the conversation out behind it — a hard rule would read as a
             toolbar bolted to the bottom of a page */
          background: `linear-gradient(180deg,rgba(255,253,245,0) 0%,${C.cream} 42%)`,
        }}>
          <Stack direction="row" spacing={1.25}
            onClick={(e) => { e.stopPropagation(); go(null); }}
            sx={{
              alignItems: 'center', pl: 2.25, pr: 0.65, py: 0.65, borderRadius: '999px',
              bgcolor: '#fff', border: '1px solid rgba(27,57,91,.09)',
              boxShadow: '0 6px 22px -12px rgba(27,57,91,.4)', cursor: 'pointer',
              transition: 'transform .12s', '&:active': { transform: 'scale(.99)' },
            }}>
            <Box sx={{ fontSize: 15, lineHeight: 1 }}>👋</Box>
            <Typography sx={{ flex: 1, fontSize: 15, color: C.ink2 }}>
              Say hi
            </Typography>
            <Box sx={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0, bgcolor: C.yellow,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ArrowUpwardIcon sx={{ fontSize: 18, color: C.deep }} />
            </Box>
          </Stack>
        </Box>
      </Rise>
    </Box>
  );
}

/* One line arriving. Nothing on this screen appears — it lands. */
function Rise({ on, children }) {
  return (
    <Box sx={{
      opacity: on ? 1 : 0,
      transform: on ? 'none' : 'translateY(10px)',
      transition: 'opacity .42s cubic-bezier(.2,.9,.25,1), transform .42s cubic-bezier(.2,.9,.25,1)',
      pointerEvents: on ? 'auto' : 'none',
      height: on ? 'auto' : 0,
      overflow: on ? 'visible' : 'hidden',
    }}>{children}</Box>
  );
}

function Dots() {
  return (
    <Stack direction="row" spacing={0.55} sx={{
      alignItems: 'center', mt: 1.75, px: 1.6, py: 1.2, width: 'fit-content',
      borderRadius: '16px', borderBottomLeftRadius: '5px', bgcolor: '#fff',
      boxShadow: '0 2px 10px -6px rgba(27,57,91,.3)',
    }}>
      {[0, 1, 2].map((n) => (
        <Box key={n} sx={{
          width: 6, height: 6, borderRadius: '50%', bgcolor: C.ink2,
          animation: 'bd 1.1s ease-in-out infinite', animationDelay: `${n * 0.16}s`,
          '@keyframes bd': {
            '0%,60%,100%': { opacity: 0.3, transform: 'translateY(0)' },
            '30%': { opacity: 1, transform: 'translateY(-3px)' },
          },
        }} />
      ))}
    </Stack>
  );
}

/**
 * The goals, drifting.
 *
 * No pill, no border, no fill — a pill announces itself as a control, and these
 * should read as suggestions someone is offering, not a form's options.
 *
 * The drift is real scroll position rather than a transform, which matters: the
 * first touch stops it and the row is instantly an ordinary swipeable list, so
 * every goal stays reachable. A transform-based marquee looks the same and traps
 * you — you cannot swipe it, and pausing mid-cycle can leave an option
 * permanently off screen.
 */
const ENTRIES = [
  { k: 'start', ic: '⚖️', t: 'I want to start GLP-1' },
  { k: 'curious', ic: '💬', t: 'I have a few questions first' },
];

function Drift({ onPick }) {
  const ref = useRef(null);
  /* A row that runs off the edge with a hard cut reads as a layout fault. The
     mask fades the last few millimetres so the edge reads as "there is more",
     which is the only affordance a drifting row needs. */
  const fade = 'linear-gradient(90deg,transparent 0,#000 18px,#000 calc(100% - 34px),transparent 100%)';
  const [held, setHeld] = useState(false);
  /* doubled so the scroll can wrap without a visible seam */
  const items = [...ENTRIES, ...ENTRIES];

  useEffect(() => {
    if (held) return undefined;
    let raf;
    const step = () => {
      const el = ref.current;
      if (el) {
        const half = el.scrollWidth / 2;
        el.scrollLeft = el.scrollLeft >= half ? el.scrollLeft - half : el.scrollLeft + 0.32;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [held]);

  return (
    <Box ref={ref}
      onPointerDown={() => setHeld(true)}
      onWheel={() => setHeld(true)}
      sx={{
        display: 'flex', gap: 3, overflowX: 'auto', mt: 2, pl: 3, pr: 3,
        WebkitMaskImage: fade, maskImage: fade,
        '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
      }}>
      {items.map((g, i) => (
        <Stack key={`${g.k}-${i}`} direction="row" spacing={1}
          onClick={(e) => { e.stopPropagation(); onPick(g.k); }}
          sx={{
            alignItems: 'center', flexShrink: 0, cursor: 'pointer', py: 0.5,
            transition: 'opacity .15s', '&:active': { opacity: 0.55 },
          }}>
          <Box sx={{ fontSize: 19, lineHeight: 1 }}>{g.ic}</Box>
          <Typography sx={{
            fontSize: 17, fontWeight: 500, color: C.deep, whiteSpace: 'nowrap',
          }}>{g.t}</Typography>
        </Stack>
      ))}
    </Box>
  );
}

/**
 * The care team, centred at the head of the thread.
 *
 * Smaller than it was: the hierarchy asks for "Hi Faisal" to be the one loud
 * thing, and a large photo block out-shouts any typography beneath it.
 */
function Fan({ team }) {
  const [n, setN] = useState(0);
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held) return undefined;
    const t = setInterval(() => setN((i) => (i + 1) % team.length), 3000);
    return () => clearInterval(t);
  }, [held, team.length]);

  const take = (i) => { setHeld(true); setN(((i % team.length) + team.length) % team.length); };
  const live = team[n];

  return (
    <Box>
      <Box sx={{ position: 'relative', height: 152 }}>
        {team.map((c, i) => {
          let d = i - n;
          if (d > team.length / 2) d -= team.length;
          if (d < -team.length / 2) d += team.length;
          const isLive = d === 0;
          if (Math.abs(d) > 1) return null;

          return (
            <Box key={c.name} onClick={(e) => { e.stopPropagation(); if (!isLive) take(i); }} sx={{
              position: 'absolute', left: '50%', top: 0,
              width: 124, ml: '-62px',
              transform: `translateX(${d * 74}px) scale(${isLive ? 1 : 0.82}) rotate(${d * 5}deg)`,
              opacity: isLive ? 1 : 0.4,
              zIndex: 10 - Math.abs(d),
              cursor: isLive ? 'default' : 'pointer',
              transition: 'transform .55s cubic-bezier(.22,.9,.24,1), opacity .55s',
              borderRadius: '18px', overflow: 'hidden',
              background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.72) 145%)`,
              border: '3px solid #fff',
              boxShadow: isLive
                ? '0 14px 30px -14px rgba(27,57,91,.4)'
                : '0 6px 16px -10px rgba(27,57,91,.3)',
            }}>
              <Box sx={{ position: 'relative', width: '100%', pt: '112%' }}>
                {c.img ? (
                  <Box component="img" src={c.img} alt="" sx={{
                    position: 'absolute', inset: 0, width: '100%', height: '100%',
                    objectFit: 'cover', objectPosition: 'center 18%',
                  }} />
                ) : (
                  <Typography sx={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: '"Fraunces", serif', fontSize: 30, fontWeight: 600,
                    color: 'rgba(255,255,255,.88)',
                  }}>{c.mono}</Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* 14px — supporting, never competing with the greeting */}
      <Box sx={{ textAlign: 'center', mt: 1.4 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep, lineHeight: 1.25 }}>
          {live.name}
        </Typography>
        <Stack direction="row" spacing={0.4} sx={{
          alignItems: 'center', justifyContent: 'center', mt: 0.25,
        }}>
          <VerifiedIcon sx={{ fontSize: 10.5, color: C.teal }} />
          <Typography sx={{ fontSize: 10.5, color: C.ink2 }}>
            {live.role} · {live.focus}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'center', mt: 1.1 }}>
          {team.map((c, i) => (
            <Box key={c.name} onClick={(e) => { e.stopPropagation(); take(i); }} sx={{
              width: i === n ? 15 : 4.5, height: 4.5, borderRadius: 3, cursor: 'pointer',
              bgcolor: i === n ? C.yellow : 'rgba(27,57,91,.18)',
              transition: 'width .4s, background-color .4s',
            }} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
