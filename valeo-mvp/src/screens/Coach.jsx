import { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import { COACHES, GLP_QUIZ, quizRoute, bmiOf, USER } from '../data';
import { C, meter } from '../theme';

/*
 * THE INTAKE, AS A CONVERSATION.
 *
 * The chat is the fundamental here: one thread, their words on the right,
 * ours on the left, questions as suggested replies. What changed underneath
 * is the brain (docs/ONBOARDING_SPEC.md): the same GLP_QUIZ config drives
 * this thread, so every question still feeds a decision, branches still
 * branch (a man is never asked about pregnancy, a first-timer is never
 * asked why he stopped), BMI is computed and announced as a message, and
 * the close is "you're a match" or "a doctor first" or an honest stop.
 *
 * ── THE ENGINE ──
 * The thread is a recorded history, not a replay of a fixed list: the
 * visible question list changes as answers land, and a history can never
 * contradict itself. The next question is always "the first visible step
 * without an answer"; computed moments (the BMI message) push themselves
 * into the history and advance without a tap.
 */
export default function Coach({ onBack, onDone }) {
  const [a, setA] = useState({});
  const [hist, setHist] = useState([]);      /* {me,text} | {say,paras} */
  const [ending, setEnding] = useState(null); /* 'plan' | 'doctor' | {stop} */
  const [typing, setTyping] = useState(true);
  const [ready, setReady] = useState(false);
  const [skip, setSkip] = useState(0);
  const [picked, setPicked] = useState([]);  /* multi-select in progress */
  const feed = useRef(null);

  const team = ['C_LAYLA', 'C_MAHMOUD', 'C_OMAR'].map((k) => COACHES[k]);

  const visible = GLP_QUIZ.filter((s) => (!s.show || s.show(a)) && s.kind !== 'info');
  const step = ending ? null : visible.find((s) => a[s.k] === undefined) || null;

  /* the opening: one considered message, ending in the first question */
  useEffect(() => {
    setHist([{ say: true, paras: [
      `Hi ${USER.first}! 👋`,
      'I’m glad you’re here.',
      'I have a few quick questions so your doctor can see the full picture.',
      'Every answer is read by a DHA-licensed doctor.',
      GLP_QUIZ[0].q,
    ], strongLast: true }]);
  }, []);

  /* a beat before each of our lines */
  useEffect(() => {
    setTyping(true); setReady(false);
    const t = setTimeout(() => setTyping(false), hist.length <= 1 ? 900 : 480);
    return () => clearTimeout(t);
  }, [hist.length]);

  useEffect(() => {
    if (feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [hist, typing, ending]);

  /* ── one answer lands; the machine decides what we say next ── */
  const answer = (label, value) => {
    if (!step) return;
    const next = { ...a, [step.k]: value === undefined ? label : value };
    const out = [{ me: true, text: label }];

    /* honest stops are declared by the answers themselves */
    const r = quizRoute(next);
    if (r.out === 'stop') {
      out.push({ say: true, paras: [r.t, r.s] });
      setA(next); setHist((h) => [...h, ...out]); setPicked([]);
      setEnding({ stop: true }); return;
    }

    /* the BMI moment: computed, announced, never asked */
    if (step.k === 'weight' || (step.k === 'comorbid' && next.comorbid !== 'None of these')) {
      const b = bmiOf(next);
      const ok30 = b >= 30;
      if (ok30 || step.k === 'comorbid') {
        next.bmiMoment = true;
        out.push({ say: true, paras: [
          `Your BMI is ${b}.`,
          ok30 ? 'That qualifies you for GLP-1 treatment.'
            : 'With the condition you named, that qualifies you for GLP-1 treatment.',
          'People on weekly GLP-1 typically lose 10 to 15% of their body weight in the first year, and up to 25% on the strongest medications, with a doctor reviewing your dose as you go.',
        ] });
      }
    }

    /* what do we ask next? */
    const vis = GLP_QUIZ.filter((s) => (!s.show || s.show(next)) && s.kind !== 'info');
    const nxt = vis.find((s) => next[s.k] === undefined);
    if (nxt) {
      out.push({ say: true, paras: [nxt.q, ...(nxt.sub ? [nxt.sub] : [])] });
      setA(next); setHist((h) => [...h, ...out]); setPicked([]);
      return;
    }

    /* nothing left to ask: the close */
    if (r.out === 'doctor') {
      out.push({ say: true, paras: [
        'Thank you for telling me.',
        [{ b: 'One of your answers needs a doctor’s eyes before we go further.' }],
        'Ten minutes, included, and nothing to pay before it.',
      ] });
      setEnding('doctor');
    } else {
      out.push({ say: true, paras: [
        `You’re a match, ${USER.first}.`,
        `✓ Your BMI of ${bmiOf(next)} qualifies for GLP-1`,
        '✓ No safety flags in your answers',
        '✓ A DHA-licensed doctor reviews your order before it ships',
        [{ b: 'Here’s the plan for you.' }],
      ] });
      setEnding('plan');
    }
    setA(next); setHist((h) => [...h, ...out]); setPicked([]);
  };

  const toggle = (o) => {
    if (step.none && o === step.none) { setPicked([o]); return; }
    setPicked((p) => (p.includes(o)
      ? p.filter((x) => x !== o)
      : [...p.filter((x) => x !== step.none), o]));
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      {/* ── the head of the thread: people, not a product mark ── */}
      <Stack direction="row" spacing={1.4} sx={{
        alignItems: 'center', px: 2.25, pt: 2, pb: 1.4, flexShrink: 0,
        borderBottom: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        <IconButton onClick={onBack} size="small" sx={{ ml: -0.75, color: C.deep }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
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
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>Valeo</Typography>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: C.green }} />
            <Typography sx={{ fontSize: 10.5, color: C.ink2 }}>
              {ending === 'plan' ? 'Preparing your plan'
                : ending === 'doctor' ? 'Arranging your doctor' : 'Online'}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      {/* ── the thread ── */}
      <Box ref={feed} onClick={() => setSkip((n) => n + 1)}
        sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, py: 2.25 }}>
        {hist.map((m, n) => {
          if (m.me) {
            return (
              <Bubble key={n} mine>
                <P>{m.text}</P>
              </Bubble>
            );
          }
          const last = n === hist.length - 1;
          if (last && typing) return <Dots key={n} />;
          return (
            <Bubble key={n}>
              {last
                ? <Typed paras={m.paras} strongLast={m.strongLast}
                    skip={skip} feed={feed} onDone={() => setReady(true)} />
                : m.paras.map((p, i) => <P key={i} mt={i > 0}>{plain(p)}</P>)}
            </Bubble>
          );
        })}
      </Box>

      {/* ── your turn ── */}
      <Box sx={{
        px: 2.25, pt: 1.5, pb: 3, flexShrink: 0,
        borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        {ending && ready ? (
          <Box onClick={() => (ending.stop
            ? onBack()
            : onDone({ ...a, flagged: ending === 'doctor' }))} sx={{
            py: 1.55, borderRadius: '999px', textAlign: 'center', cursor: 'pointer',
            bgcolor: C.deep, color: '#fff', fontSize: 14.5, fontWeight: 600,
          }}>
            {ending.stop ? 'Back to Valeo'
              : ending === 'doctor' ? 'Talk to the doctor' : 'See my plan'}
          </Box>
        ) : (typing || !ready) ? (
          <Box sx={{ height: 44 }} />
        ) : step && step.kind === 'multi' ? (
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, justifyContent: 'flex-end' }}>
              {step.o.map((o) => {
                const on = picked.includes(o);
                return (
                  <Stack key={o} direction="row" spacing={0.6} onClick={() => toggle(o)} sx={{
                    alignItems: 'center', px: 1.5, py: 0.95, borderRadius: '999px',
                    cursor: 'pointer', bgcolor: on ? C.deep : '#fff',
                    border: `1px solid ${on ? C.deep : 'rgba(27,57,91,.22)'}`,
                    transition: 'background-color .15s',
                  }}>
                    {on && <CheckIcon sx={{ fontSize: 13, color: C.yellow }} />}
                    <Typography sx={{
                      fontSize: 13, fontWeight: 500, color: on ? '#fff' : C.deep,
                    }}>{o}</Typography>
                  </Stack>
                );
              })}
            </Box>
            {picked.length > 0 && (
              <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                <Box onClick={() => answer(picked.join(', '), picked)} sx={{
                  width: 40, height: 40, borderRadius: '50%', cursor: 'pointer',
                  bgcolor: C.yellow, display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <ArrowUpwardIcon sx={{ fontSize: 18, color: C.deep }} />
                </Box>
              </Stack>
            )}
          </Stack>
        ) : step && step.kind === 'number' ? (
          <NumberRail key={step.k} step={step}
            onPick={(v) => answer(`${v} ${step.suffix}`, v)} />
        ) : step ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, justifyContent: 'flex-end' }}>
            {step.o.map((o) => (
              <Box key={o} onClick={() => answer(o)} sx={{
                px: 1.6, py: 1, borderRadius: '999px', cursor: 'pointer',
                bgcolor: '#fff', border: '1px solid rgba(27,57,91,.22)',
                '&:active': { bgcolor: 'rgba(27,57,91,.05)' },
              }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 500, color: C.deep }}>{o}</Typography>
              </Box>
            ))}
          </Box>
        ) : <Box sx={{ height: 44 }} />}
      </Box>
    </Box>
  );
}

/* ── presentational: a line is either a string or segments with {b} bold ── */
const segsOf = (para) => (typeof para === 'string' ? [para] : para);
const textOf = (seg) => (typeof seg === 'string' ? seg : seg.b);
const plain = (para) => segsOf(para).map(textOf).join('');
const plainOf = plain;

function revealSegs(para, count) {
  const out = []; let left = count;
  for (const seg of segsOf(para)) {
    if (left <= 0) break;
    const txt = textOf(seg);
    const shown = txt.slice(0, left);
    out.push(typeof seg === 'string' ? shown : { b: shown });
    left -= txt.length;
  }
  return out;
}
function sliceAt(paras, tick, gap) {
  const out = []; let t = tick;
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

/* Time-based typing: a throttled tab resumes in the right place. */
function Typed({ paras, speed, strongLast, skip, feed, onDone }) {
  const GAP = 20;
  const total = paras.map(plainOf).join(' ').length;
  const ms = speed || (total > 200 ? 8 : 15);
  const ticks = paras.reduce((n, para) => n + plainOf(para).length + GAP, 0);
  const [tick, setTick] = useState(0);
  const fired = useRef(false);
  const t0 = useRef(0);

  useEffect(() => {
    let raf;
    t0.current = performance.now();
    const beat = () => {
      const n = Math.floor((performance.now() - t0.current) / ms);
      setTick(n); return n;
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
  useEffect(() => { if (skip > 0) setTick(ticks); }, [skip]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (feed && feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [tick]); // eslint-disable-line react-hooks/exhaustive-deps

  const shown = doneTyping ? paras.map((p) => segsOf(p)) : sliceAt(paras, tick, GAP);
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
      fontWeight: strong ? 600 : 400, color: 'inherit',
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

/* Coarse chips land in range in one tap; the stepper does the rest. */
function NumberRail({ step, onPick }) {
  const [v, setV] = useState(step.start);
  return (
    <Stack spacing={1.1}>
      <Stack direction="row" spacing={0.7}>
        {step.chips.map((c) => (
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
        <StepBtn label="−" onClick={() => setV((x) => Math.max(step.min, x - 1))} />
        <Box sx={{
          flex: 1, textAlign: 'center', py: 0.9, borderRadius: '999px', bgcolor: '#fff',
          border: '1px solid rgba(27,57,91,.14)',
        }}>
          <Typography sx={{ fontFamily: meter, fontSize: 17, fontWeight: 700, color: C.deep }}>
            {v} <span style={{ fontSize: 11, color: C.ink2 }}>{step.suffix}</span>
          </Typography>
        </Box>
        <StepBtn label="+" onClick={() => setV((x) => Math.min(step.max, x + 1))} />
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

function StepBtn({ label, onClick }) {
  return (
    <Box onClick={onClick} sx={{
      width: 38, height: 38, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'rgba(27,57,91,.06)', color: C.deep, fontSize: 18, fontWeight: 700,
      userSelect: 'none',
    }}>{label}</Box>
  );
}
