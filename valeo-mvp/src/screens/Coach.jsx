import { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import { GLP_ASK, GLP_FLAGGED, LIVE, USER, coachOf } from '../data';
import { C, meter } from '../theme';

/**
 * VALEO CARE — the conversation the previous screen started.
 *
 * The screen before ends with a composer, so by the time anyone arrives here they
 * have already spoken. This screen therefore opens with THEIR message, not ours.
 * That single ordering decision is what separates "I replied to someone" from "I
 * pressed a button and a chatbot booted up" — and it costs nothing but putting
 * the first bubble on the right.
 *
 * ── ONE MESSAGE, NOT FOUR ──
 * The welcome is a single bubble that moves through welcome → reassurance →
 * context → the first question. Four short consecutive bubbles is how software
 * announces itself; one considered message is how a person writes. The paragraph
 * breaks inside it do the pacing that separate bubbles were doing badly.
 *
 * ── WHAT THE AI CLAIMS ──
 * It says it will help every step of the way and make sure the right support is
 * there — deliberately NOT that it will be your care. The AI is the concierge and
 * the thread of continuity; the doctor is the expert. An assistant that implies it
 * replaces the clinician undoes the entire premise of the product, which is that
 * the relationship is with a person.
 *
 * ── SUGGESTED REPLIES, NOT A MENU ──
 * The goals are right-aligned and styled as unsent messages, because they are the
 * user's words, not the app's options. A left-aligned list of full-width rows is a
 * menu; a right-aligned set of pills is what you might say next.
 *
 * ── HEADER ──
 * "Valeo AI Health Coach" reminded you, at the top of every frame, that you were
 * talking to software. Just "Valeo", plus the faces of who is actually behind
 * it, does the opposite.
 *
 * This is the ONLY conversation in the product that is not a practice. It runs
 * before you have one, and its whole job is to end by introducing you to a
 * clinician. From that introduction on, every message — preparation, results,
 * scheduling, week nine of a protocol — happens in one thread with one name on
 * it. See components/Practice.jsx.
 */
export default function Coach({ onBack, onDone }) {
  /* Weight loss is the whole shop: the patient's opening line IS the goal,
     so the conversation starts at the first real question. */
  const start = 0;

  const [i, setI] = useState(start);
  const [a, setA] = useState({ goal: 'fat', goal_label: 'Lose weight' });
  const [typing, setTyping] = useState(true);
  /* A Valeo line is "settled" only once it has finished typing. The reply rail
     stays hidden until then — offering answers while someone is still mid-
     sentence is an interruption a real conversation never makes. */
  const [ready, setReady] = useState(false);
  /* Tapping the thread finishes the current line at once. A typewriter you
     cannot outrun stops being atmosphere and becomes a toll. */
  const [skip, setSkip] = useState(0);
  const feed = useRef(null);

  /* ── SIX QUESTIONS, FIXED ──
     What you want, sex, height, weight, prior use, red flags. No goal
     picker, no fork. The flag rule routes at the end: any flag, or a prior
     course that failed, goes to a doctor before any payment. */
  const steps = GLP_ASK;

  const step = steps[i];
  const done = i >= steps.length;
  const left = steps.length - start;
  const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six'][left] || String(left);
  const team = [...new Set(LIVE.map((pk) => coachOf(pk)))];
  const flagged = GLP_FLAGGED(a);

  /* A beat before each reply. Without it the questions render like form fields
     appearing, which is the thing this screen exists not to be. */
  useEffect(() => {
    setTyping(true);
    setReady(false);
    const t = setTimeout(() => setTyping(false), i === start ? 900 : 520);
    return () => clearTimeout(t);
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [i, typing, done]);

  const answer = (k, label, value) => {
    setA((prev) => ({ ...prev, [k]: value === undefined ? label : value, [`${k}_label`]: label }));
    setI((n) => n + 1);
  };

  /* ── the thread ──
     Built as one list so the ordering is legible in one place: their opening
     line, our single welcome (which carries the first question), then a strict
     alternation of answer and question. */
  const thread = [];
  thread.push({ me: true, ic: '⚖️', t: 'Lose weight' });
  thread.push({ welcome: true, q: steps[start].q });
  for (let s = start; s < i; s += 1) {
    thread.push({ me: true, t: a[`${steps[s].k}_label`] });
    if (s + 1 < steps.length) thread.push({ t: steps[s + 1].q });
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      <Stack direction="row" spacing={1.4} sx={{
        alignItems: 'center', px: 2.25, pt: 2, pb: 1.4, flexShrink: 0,
        borderBottom: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        <IconButton onClick={onBack} size="small" sx={{ ml: -0.75, color: C.deep }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>

        {/* who is actually behind this — people, not a product mark */}
        <Stack direction="row" sx={{ flexShrink: 0 }}>
          {team.map((c, n) => (
            <Box key={c.name} sx={{
              width: 30, height: 30, borderRadius: '50%', overflow: 'hidden',
              ml: n === 0 ? 0 : '-10px', zIndex: team.length - n,
              border: '2px solid ' + C.cream,
              background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {c.img
                ? <Box component="img" src={c.img} alt="" sx={{
                    width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                  }} />
                : <Typography sx={{
                    fontFamily: '"Fraunces", serif', fontSize: 11, fontWeight: 600,
                    color: 'rgba(255,255,255,.9)',
                  }}>{c.mono}</Typography>}
            </Box>
          ))}
        </Stack>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* Not "Jamie's Practice" — you have not met Jamie yet, and claiming
              a relationship before it exists is the one thing that would make
              the handover at the end of this conversation ring false. This is
              Valeo's own front desk, and its last act is to introduce you to a
              practice. From that introduction onward there is only one name. */}
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
            Valeo
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: C.green }} />
            <Typography sx={{ fontSize: 10.5, color: C.ink2 }}>
              {done ? (flagged ? 'Arranging your doctor' : 'Preparing your plan') : 'Online'}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Box ref={feed} onClick={() => setSkip((n) => n + 1)}
        sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, py: 2.25 }}>
        {thread.map((m, n) => {
          if (m.welcome) {
            /* the one long message — hidden until the first beat has passed, so
               it arrives as a reply rather than as pre-rendered content */
            if (i === start && typing) return <Dots key={n} />;
            return (
              <Bubble key={n}>
                <Typed
                  paras={[
                    `Hi ${USER.first}! 👋`,
                    'I’m glad you’re here.',
                    'I’ll help you every step of the way and make sure you always have the right support when you need it.',
                    'Before we begin, I’d love to get to know you a little better.',
                    `I have ${WORD} quick question${left === 1 ? '' : 's'}.`,
                    'Let’s start with the first one.',
                    m.q,
                  ]}
                  strongLast skip={skip} feed={feed} onDone={() => setReady(true)} />
              </Bubble>
            );
          }
          if (m.me) {
            return (
              <Bubble key={n} mine>
                <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                  {m.ic && <Box sx={{ fontSize: 14, lineHeight: 1 }}>{m.ic}</Box>}
                  <P>{m.t}</P>
                </Stack>
              </Bubble>
            );
          }
          /* only the newest line types; everything above it has already been said */
          const last = n === thread.length - 1;
          return (
            <Bubble key={n}>
              {last
                ? <Typed paras={[m.t]} skip={skip} feed={feed} onDone={() => setReady(true)} />
                : <P>{m.t}</P>}
            </Bubble>
          );
        })}

        {/* a beat before every question after the first */}
        {!done && i > start && typing && <Dots />}

        {done && !typing && (
          <Bubble>
            {/* Two endings for two exits. The flagged one is written to read
                as being taken more seriously, never as a rejection — that
                sentence is the difference between a safety rule and a
                bounce. */}
            <Typed
              paras={flagged ? [
                'Thank you for telling me.',
                [{ b: 'One of your answers needs a doctor’s eyes before we go further.' }],
                'It takes about ten minutes, it’s included, and there’s nothing to pay before it.',
              ] : [
                `Thank you, ${USER.first}.`,
                ['Based on your answers, here’s ', { b: 'the plan for you.' }],
                'A doctor reviews every order before it ships.',
              ]}
              skip={skip} feed={feed} onDone={() => setReady(true)} />
          </Bubble>
        )}
        {done && typing && <Dots />}
      </Box>

      {/* ── your turn ──
          Right-aligned and shaped like unsent messages: these are the user's
          words, not the app's options. Full-width left-aligned rows would make
          the same content read as a menu. */}
      <Box sx={{
        px: 2.25, pt: 1.5, pb: 3, flexShrink: 0,
        borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        {done ? (
          <Box onClick={() => onDone({ ...a, flagged })} sx={{
            py: 1.55, borderRadius: '999px', textAlign: 'center', cursor: 'pointer',
            bgcolor: C.deep, color: '#fff', fontSize: 14.5, fontWeight: 600,
          }}>
            {flagged ? 'Talk to the doctor' : 'See my plan'}
          </Box>
        ) : (typing || !ready) ? (
          <Box sx={{ height: 44 }} />
        ) : step.kind === 'choice' ? (
          <Suggest opts={step.o.map((o) => ({ k: o, t: o }))}
            onPick={(o) => answer(step.k, o.t)} />
        ) : (
          <NumberRail step={step} onPick={(v) => answer(step.k, `${v} ${step.suffix}`, v)} />
        )}
      </Box>
    </Box>
  );
}

/* Suggested replies — unsent messages, not buttons. Outlined rather than filled,
   because a filled pill is a control and an outline is a draft. */
function Suggest({ opts, onPick }) {
  return (
    <Box sx={{
      display: 'flex', flexWrap: 'wrap', gap: 0.8, justifyContent: 'flex-end',
    }}>
      {opts.map((o, n) => (
        <Stack key={o.k} direction="row" spacing={0.7} onClick={() => onPick(o)}
          sx={{
            alignItems: 'center', px: 1.6, py: 1, borderRadius: '999px', cursor: 'pointer',
            bgcolor: '#fff', border: `1px solid ${'rgba(27,57,91,.22)'}`,
            animation: 'sgIn .36s cubic-bezier(.2,.9,.25,1) both',
            animationDelay: `${n * 0.05}s`,
            '@keyframes sgIn': {
              from: { opacity: 0, transform: 'translateY(7px)' },
              to: { opacity: 1, transform: 'none' },
            },
            '&:active': { bgcolor: 'rgba(27,57,91,.05)' },
          }}>
          {o.ic && <Box sx={{ fontSize: 14, lineHeight: 1 }}>{o.ic}</Box>}
          <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: C.deep }}>
            {o.t}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

/* Coarse chips land you in range in one tap; the stepper handles the rest. Still
   no keyboard — typing a number is the fastest way to turn a conversation into a
   form. */
function NumberRail({ step, onPick }) {
  const mid = step.k === 'height' ? 175 : 82;
  const [v, setV] = useState(mid);
  const chips = step.k === 'height' ? [160, 168, 175, 182, 190] : [65, 75, 85, 95, 110];

  return (
    <Stack spacing={1.1}>
      <Stack direction="row" spacing={0.7}>
        {chips.map((c) => (
          <Box key={c} onClick={() => setV(c)} sx={{
            flex: 1, textAlign: 'center', py: 0.85, borderRadius: '11px', cursor: 'pointer',
            fontFamily: meter, fontSize: 13, fontWeight: 700,
            bgcolor: v === c ? C.deep : '#fff',
            color: v === c ? '#fff' : C.deep,
            border: '1px solid rgba(27,57,91,.14)',
          }}>{c}</Box>
        ))}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Step label="−" onClick={() => setV((x) => Math.max(step.min, x - 1))} />
        <Box sx={{
          flex: 1, textAlign: 'center', py: 0.9, borderRadius: '999px', bgcolor: '#fff',
          border: '1px solid rgba(27,57,91,.14)',
        }}>
          <Typography sx={{ fontFamily: meter, fontSize: 17, fontWeight: 700, color: C.deep }}>
            {v} <span style={{ fontSize: 11, color: C.ink2 }}>{step.suffix}</span>
          </Typography>
        </Box>
        <Step label="+" onClick={() => setV((x) => Math.min(step.max, x + 1))} />
        <Box onClick={() => onPick(v)} sx={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          bgcolor: C.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowUpwardIcon sx={{ fontSize: 18, color: C.deep }} />
        </Box>
      </Stack>
    </Stack>
  );
}

function Step({ label, onClick }) {
  return (
    <Box onClick={onClick} sx={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'rgba(27,57,91,.06)', color: C.deep, fontSize: 18, fontWeight: 700,
      userSelect: 'none',
    }}>{label}</Box>
  );
}

function Dots() {
  return (
    <Box sx={{ display: 'flex', mb: 1.2 }}>
      <Stack direction="row" spacing={0.55} sx={{
        px: 1.7, py: 1.35, borderRadius: '18px', borderBottomLeftRadius: '5px', bgcolor: '#fff',
        boxShadow: '0 2px 10px -6px rgba(27,57,91,.3)',
      }}>
        {[0, 1, 2].map((n) => (
          <Box key={n} sx={{
            width: 6, height: 6, borderRadius: '50%', bgcolor: C.ink2,
            animation: 'cd 1.1s ease-in-out infinite', animationDelay: `${n * 0.16}s`,
            '@keyframes cd': {
              '0%,60%,100%': { opacity: 0.3, transform: 'translateY(0)' },
              '30%': { opacity: 1, transform: 'translateY(-3px)' },
            },
          }} />
        ))}
      </Stack>
    </Box>
  );
}

/* A paragraph is either a plain string or a list of segments, where `{ b }` marks
   one that should be bold. Emphasis has to survive being typed, so reveal is
   computed against the PLAIN length and the styling reapplied afterwards —
   slicing markup directly would print half a tag mid-word. */
const segsOf = (para) => (typeof para === 'string' ? [para] : para);
const textOf = (seg) => (typeof seg === 'string' ? seg : seg.b);
const plainOf = (para) => segsOf(para).map(textOf).join('');

function revealSegs(para, count) {
  const out = [];
  let left = count;
  for (const seg of segsOf(para)) {
    if (left <= 0) break;
    const txt = textOf(seg);
    const shown = txt.slice(0, left);
    out.push(typeof seg === 'string' ? shown : { b: shown });
    left -= txt.length;
  }
  return out;
}

/* How much of each paragraph is visible at `tick`. Each paragraph costs its own
   length in ticks, then a fixed pause — the beat where a person stops, which is
   at a paragraph break and not where a line happens to wrap. */
function sliceAt(paras, tick, gap) {
  const out = [];
  let t = tick;
  for (const para of paras) {
    if (t <= 0) break;
    const len = plainOf(para).length;
    out.push(revealSegs(para, Math.min(len, t)));
    t -= len;
    if (t <= 0) break;
    t -= gap;
  }
  return out;
}

/**
 * A line being written, not rendered.
 *
 * TIME-BASED, NOT TICK-BASED. The obvious implementation advances one character
 * per timer, and it breaks the moment the browser throttles timers — a
 * backgrounded tab clamps them to ~1s, so the message crawls out at a character
 * a second instead of catching up. This reads elapsed time on every frame and
 * derives how much text *should* be visible, so a starved animation resumes at
 * the right place rather than falling further behind.
 *
 * Speed scales with length. A long welcome at a per-character pace comfortable
 * for one sentence takes six seconds, which turns atmosphere into a wait — so
 * anything over ~200 characters types faster.
 *
 * Only the newest line types; re-typing what has already been said on every
 * re-render would misrepresent when it was said. The user's own messages never
 * type at all — they sent them, so they arrive whole.
 */
function Typed({ paras, speed, strongLast, skip, feed, onDone }) {
  const GAP = 20;
  const total = paras.map(plainOf).join(' ').length;
  const ms = speed || (total > 200 ? 9 : 16);
  const ticks = paras.reduce((n, para) => n + plainOf(para).length + GAP, 0);

  const [tick, setTick] = useState(0);
  const fired = useRef(false);
  const t0 = useRef(0);

  useEffect(() => {
    let raf;
    t0.current = performance.now();
    /* Both clocks read elapsed time and derive the same answer, so whichever one
       the browser is willing to run keeps the text on schedule. rAF gives smooth
       frames while visible; a backgrounded tab suspends it entirely, and the
       interval — throttled to about a second — still lands the text in the right
       place rather than leaving the message stalled mid-word. */
    const beat = () => {
      const n = Math.floor((performance.now() - t0.current) / ms);
      setTick(n);
      return n;
    };
    const run = () => { if (beat() < ticks) raf = requestAnimationFrame(run); };
    raf = requestAnimationFrame(run);
    const iv = setInterval(() => { if (beat() >= ticks) clearInterval(iv); }, 60);
    return () => { cancelAnimationFrame(raf); clearInterval(iv); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doneTyping = tick >= ticks;
  useEffect(() => {
    if (doneTyping && !fired.current) { fired.current = true; if (onDone) onDone(); }
  }, [doneTyping]); // eslint-disable-line react-hooks/exhaustive-deps

  /* one tap and the rest of the sentence is simply there */
  useEffect(() => {
    if (skip > 0) setTick(ticks);
  }, [skip]); // eslint-disable-line react-hooks/exhaustive-deps

  /* stay pinned to the newest character as the bubble grows */
  useEffect(() => {
    if (feed && feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = doneTyping
    ? paras.map((para) => segsOf(para))
    : sliceAt(paras, tick, GAP);

  return (
    <>
      {shown.map((segs, idx) => (segs && segs.length ? (
        <P key={idx} mt={idx > 0} strong={strongLast && idx === paras.length - 1}>
          {segs.map((seg, n) => (typeof seg === 'string'
            ? seg
            : <b key={n} style={{ fontWeight: 700 }}>{seg.b}</b>))}
        </P>
      ) : null))}
    </>
  );
}

function P({ children, mt, strong }) {
  return (
    <Typography sx={{
      fontSize: 13.5, lineHeight: 1.55, mt: mt ? 1.35 : 0,
      fontWeight: strong ? 600 : 400,
      color: 'inherit',
    }}>{children}</Typography>
  );
}

function Bubble({ mine, children }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', mb: 1.2 }}>
      <Box sx={{
        maxWidth: '86%', px: 1.85, py: 1.35, borderRadius: '18px',
        borderBottomRightRadius: mine ? '5px' : '18px',
        borderBottomLeftRadius: mine ? '18px' : '5px',
        bgcolor: mine ? C.deep : '#fff',
        color: mine ? '#fff' : C.ink,
        boxShadow: mine ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
      }}>{children}</Box>
    </Box>
  );
}
