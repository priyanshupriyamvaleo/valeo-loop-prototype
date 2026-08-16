import { useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { GLP_QUIZ, quizRoute, bmiOf, USER } from '../data';
import { C, meter } from '../theme';

/*
 * THE ONBOARDING WIZARD — one question per screen, the pattern every GLP-1
 * funnel converged on, in Valeo's skin.
 *
 * The engine walks GLP_QUIZ. A step's `show(answers)` hides untaken
 * branches, so a man is never asked about pregnancy and a first-timer is
 * never asked why he stopped: every question the patient sees is a
 * consequence of an answer they gave.
 *
 * Two computed moments interrupt the questions, because a funnel that only
 * takes begins to feel like a form: the BMI moment (eligibility said
 * plainly, plus what people typically lose) and the match screen (three
 * checks, then the plan). Ineligible answers end at an honest stop that
 * says why, never a bounce.
 */
export default function Quiz({ onClose, onDone }) {
  const [a, setA] = useState({});
  const [trail, setTrail] = useState([]);       /* step keys actually visited */
  const [stop, setStop] = useState(null);       /* honest-stop payload */

  const visible = GLP_QUIZ.filter((s) => !s.show || s.show(a));
  const at = trail.length;
  const step = visible[at] || null;
  const doneAsking = !step;
  const route = quizRoute(a);

  /* A stop can only be declared by the answers themselves. */
  const maybeStop = (next) => {
    const r = quizRoute(next);
    if (r.out === 'stop') { setStop(r); return true; }
    return false;
  };

  const answer = (k, v) => {
    const next = { ...a, [k]: v };
    setA(next);
    if (maybeStop(next)) return;
    setTrail((t) => [...t, k]);
  };

  const back = () => {
    if (stop) { setStop(null); return; }
    if (at === 0) return onClose();
    const k = trail[at - 1];
    setTrail((t) => t.slice(0, -1));
    setA((prev) => { const n = { ...prev }; delete n[k]; return n; });
  };

  /* ── the honest stop ── */
  if (stop) {
    return (
      <Frame onBack={back} onClose={onClose} progress={1}>
        <Center>
          <Typography sx={titleSx}>{stop.t}</Typography>
          <Typography sx={{ fontSize: 14, lineHeight: 1.6, color: C.ink2, mt: 2, maxWidth: 300, mx: 'auto' }}>
            {stop.s}
          </Typography>
        </Center>
        <Cta t="Back to Valeo" onClick={onClose} quiet />
      </Frame>
    );
  }

  /* ── the two exits ── */
  if (doneAsking) {
    if (route.out === 'doctor') {
      return (
        <Frame onBack={back} onClose={onClose} progress={1}>
          <Center>
            <Typography sx={eyebrowSx}>Before anything else</Typography>
            <Typography sx={titleSx}>A doctor first.</Typography>
            <Typography sx={{ fontSize: 14, lineHeight: 1.6, color: C.ink2, mt: 2, maxWidth: 300, mx: 'auto' }}>
              One of your answers needs a doctor’s eyes before we go further.
              Ten minutes, included, and nothing to pay before it.
            </Typography>
          </Center>
          <Cta t="Talk to the doctor" onClick={() => onDone({ ...a, flagged: true })} />
        </Frame>
      );
    }
    return (
      <Frame onBack={back} onClose={onClose} progress={1}>
        <Center>
          <Typography sx={eyebrowSx}>Eligibility checks passed</Typography>
          <Typography sx={titleSx}>You’re a match, {USER.first}.</Typography>
          <Stack spacing={1.4} sx={{ mt: 3, textAlign: 'left', mx: 'auto', width: 'fit-content' }}>
            {[`Your BMI of ${bmiOf(a)} qualifies for GLP-1`,
              'No safety flags in your answers',
              'A doctor still reviews your order before it ships'].map((t) => (
              <Stack key={t} direction="row" spacing={1.1} sx={{ alignItems: 'center' }}>
                <CheckCircleOutlinedIcon sx={{ fontSize: 17, color: C.green, flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13.5, color: C.ink, lineHeight: 1.4 }}>{t}</Typography>
              </Stack>
            ))}
          </Stack>
        </Center>
        <Cta t="See my plan" onClick={() => onDone({ ...a, flagged: false })} />
      </Frame>
    );
  }

  const progress = at / (visible.length + 1);

  /* ── the BMI moment ── */
  if (step.kind === 'info') {
    const b = bmiOf(a);
    return (
      <Frame onBack={back} onClose={onClose} progress={progress}>
        <Center>
          <Typography sx={eyebrowSx}>Where you’re starting</Typography>
          <Typography sx={titleSx}>Your BMI is {b}.</Typography>
          <Typography sx={{ fontSize: 14.5, lineHeight: 1.6, color: C.ink, mt: 2, maxWidth: 300, mx: 'auto' }}>
            {b >= 30
              ? 'That qualifies you for GLP-1 treatment.'
              : 'With the condition you named, that qualifies you for GLP-1 treatment.'}
          </Typography>
          <Typography sx={{ fontSize: 13.5, lineHeight: 1.6, color: C.ink2, mt: 1.75, maxWidth: 300, mx: 'auto' }}>
            People on weekly GLP-1 typically lose 10 to 15% of their body
            weight over the first year, reviewed with a doctor as they go.
          </Typography>
        </Center>
        <Cta t="Continue" onClick={() => answer('bmiMoment', true)} />
      </Frame>
    );
  }

  /* ── multi-select ── */
  if (step.kind === 'multi') {
    const picked = a[step.k] || [];
    const toggle = (o) => {
      let next;
      if (step.none && o === step.none) next = [o];
      else next = picked.includes(o)
        ? picked.filter((x) => x !== o)
        : [...picked.filter((x) => x !== step.none), o];
      setA((prev) => ({ ...prev, [step.k]: next }));
    };
    return (
      <Frame onBack={back} onClose={onClose} progress={progress}>
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 3 }}>
          <Typography sx={{ ...titleSx, mt: 2 }}>{step.q}</Typography>
          {step.sub && <Sub t={step.sub} />}
          <Stack spacing={1} sx={{ mt: 3 }}>
            {step.o.map((o) => {
              const on = picked.includes(o);
              return (
                <Stack key={o} direction="row" onClick={() => toggle(o)} sx={{
                  ...cardSx, alignItems: 'center', justifyContent: 'space-between',
                  borderColor: on ? C.yellow : 'rgba(27,57,91,.12)',
                }}>
                  <Typography sx={cardTextSx}>{o}</Typography>
                  <Box sx={{
                    width: 22, height: 22, borderRadius: '7px', flexShrink: 0,
                    border: `1.5px solid ${on ? C.yellow : 'rgba(27,57,91,.25)'}`,
                    bgcolor: on ? C.yellow : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {on && <CheckIcon sx={{ fontSize: 15, color: C.deep }} />}
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Box>
        <Cta t="Continue" disabled={!picked.length}
          onClick={() => picked.length && answer(step.k, picked)} />
      </Frame>
    );
  }

  /* ── number ── */
  if (step.kind === 'number') {
    return (
      <Frame onBack={back} onClose={onClose} progress={progress}>
        <Box sx={{ flex: '1 1 auto', px: 3 }}>
          <Typography sx={{ ...titleSx, mt: 2 }}>{step.q}</Typography>
          <NumberRail key={step.k} step={step} onPick={(v) => answer(step.k, v)} />
        </Box>
      </Frame>
    );
  }

  /* ── single choice ── */
  return (
    <Frame onBack={back} onClose={onClose} progress={progress}>
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 3 }}>
        <Typography sx={{ ...titleSx, mt: 2 }}>{step.q}</Typography>
        {step.sub && <Sub t={step.sub} />}
        <Stack spacing={1} sx={{ mt: 3 }}>
          {step.o.map((o) => (
            <Box key={o} onClick={() => answer(step.k, o)} sx={cardSx}>
              <Typography sx={cardTextSx}>{o}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>
    </Frame>
  );
}

/* ── the chrome every screen shares ── */
function Frame({ onBack, onClose, progress, children }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FAF6ED' }}>
      <Stack direction="row" sx={{ alignItems: 'center', px: 1.5, pt: 1.5, pb: 1, flexShrink: 0 }}>
        <IconButton onClick={onBack} size="small" sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
        </IconButton>
        <Box sx={{ flex: 1, mx: 1.5, height: 3, borderRadius: 2, bgcolor: 'rgba(27,57,91,.08)' }}>
          <Box sx={{
            width: `${Math.max(4, Math.round(progress * 100))}%`, height: '100%',
            borderRadius: 2, bgcolor: C.yellow, transition: 'width .35s ease',
          }} />
        </Box>
        <IconButton onClick={onClose} size="small" sx={{
          bgcolor: '#fff', color: C.deep, width: 32, height: 32,
          boxShadow: '0 4px 14px -8px rgba(27,57,91,.4)', '&:hover': { bgcolor: '#fff' },
        }}>
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Stack>
      {children}
    </Box>
  );
}

function Center({ children }) {
  return (
    <Box sx={{
      flex: '1 1 auto', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', px: 3, textAlign: 'center', pb: 4,
    }}>{children}</Box>
  );
}

function Cta({ t, onClick, disabled, quiet }) {
  return (
    <Box sx={{ px: 3, pb: 3, pt: 1.5, flexShrink: 0 }}>
      <Box onClick={onClick} sx={{
        py: 1.5, borderRadius: '999px', textAlign: 'center',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 15, fontWeight: 700,
        bgcolor: disabled ? 'rgba(27,57,91,.08)' : quiet ? 'transparent' : C.yellow,
        color: disabled ? C.ink2 : C.deep,
        border: quiet ? `1.5px solid ${C.deep}` : 'none',
        transition: 'background-color .2s',
        '&:active': disabled ? {} : { opacity: 0.85 },
      }}>{t}</Box>
    </Box>
  );
}

function Sub({ t }) {
  return (
    <Typography sx={{
      fontSize: 12.5, lineHeight: 1.5, color: C.ink2, mt: 1, textAlign: 'center',
    }}>{t}</Typography>
  );
}

const titleSx = {
  fontFamily: '"Fraunces", serif', fontSize: 25, fontWeight: 600,
  lineHeight: 1.2, color: C.deep, textAlign: 'center',
};
const eyebrowSx = {
  fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em',
  textTransform: 'uppercase', color: C.yellowDeep, mb: 1.25,
};
const cardSx = {
  px: 2.25, py: 2, borderRadius: '16px', cursor: 'pointer', bgcolor: '#fff',
  border: '1.5px solid rgba(27,57,91,.12)',
  boxShadow: '0 6px 18px -14px rgba(27,57,91,.35)',
  transition: 'border-color .15s', '&:active': { borderColor: C.yellow },
};
const cardTextSx = { fontSize: 15, fontWeight: 600, color: C.deep, lineHeight: 1.35 };

/* Coarse chips land in range in one tap, the stepper does the rest, and the
   gold arrow sends. No keyboard: typing a number turns a wizard into a form. */
function NumberRail({ step, onPick }) {
  const [v, setV] = useState(step.start);
  return (
    <Stack spacing={1.25} sx={{ mt: 3.5 }}>
      <Stack direction="row" spacing={0.7}>
        {step.chips.map((c) => (
          <Box key={c} onClick={() => setV(c)} sx={{
            flex: 1, textAlign: 'center', py: 1, borderRadius: '11px', cursor: 'pointer',
            fontFamily: meter, fontSize: 13.5, fontWeight: 700,
            bgcolor: v === c ? C.deep : '#fff',
            color: v === c ? '#fff' : C.deep,
            border: '1px solid rgba(27,57,91,.14)',
          }}>{c}</Box>
        ))}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
        <Step label="−" onClick={() => setV((x) => Math.max(step.min, x - 1))} />
        <Box sx={{
          flex: 1, textAlign: 'center', py: 1.1, borderRadius: '999px', bgcolor: '#fff',
          border: '1px solid rgba(27,57,91,.14)',
        }}>
          <Typography sx={{ fontFamily: meter, fontSize: 18, fontWeight: 700, color: C.deep }}>
            {v} <span style={{ fontSize: 11, color: C.ink2 }}>{step.suffix}</span>
          </Typography>
        </Box>
        <Step label="+" onClick={() => setV((x) => Math.min(step.max, x + 1))} />
        <Box onClick={() => onPick(v)} sx={{
          width: 44, height: 44, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          bgcolor: C.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ArrowUpwardIcon sx={{ fontSize: 19, color: C.deep }} />
        </Box>
      </Stack>
    </Stack>
  );
}

function Step({ label, onClick }) {
  return (
    <Box onClick={onClick} sx={{
      width: 42, height: 42, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'rgba(27,57,91,.06)', color: C.deep, fontSize: 19, fontWeight: 700,
      userSelect: 'none',
    }}>{label}</Box>
  );
}
