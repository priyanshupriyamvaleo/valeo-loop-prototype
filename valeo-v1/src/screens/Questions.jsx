import { useState } from 'react';
import {
  Box, Button, Chip, IconButton, LinearProgress, Stack, Typography, ToggleButton,
  ToggleButtonGroup, TextField,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckIcon from '@mui/icons-material/Check';
import Drum from '../components/Drum';
import { GROUPS, GOALS, USER, buildWords, phaseHas } from '../data';
import { C } from '../theme';

/* Steps. `centre` means the input is a wheel and belongs optically centred;
   everything else anchors directly under the headline — floating chips in the
   middle of an empty screen was the bug in the last build. */
const FULL = [
  { type: 'drum',   k: 'age',    q: 'How old are you?', from: 18, to: 80, def: 34, centre: true },
  /* Two options is a rows question, not a chips question — two small pills in
     an 844px screen is a poster with a void under it. */
  { type: 'rows',   k: 'gender', q: 'Gender', o: ['Male', 'Female'] },
  { type: 'place',  k: 'place',  q: 'Where should the nurse come?' },
  { type: 'height', k: 'height', q: 'What’s your height?', centre: true },
  { type: 'weight', k: 'weight', q: 'And your weight?', centre: true },
  { type: 'cheer',  h: `Off to a good start, ${USER.first}.` },
  /* `deep` = asked only where something reads the answer. Phase 1 scores the
     shortlist off the stated goal alone, so these two screens buy nothing there
     and cost two screens of drop-off before the first thing we sell. */
  { type: 'multi',  q: 'Let’s talk lifestyle', groups: ['work', 'smoke', 'drink'], deep: true },
  { type: 'multi',  q: 'And how you move', groups: ['move', 'train'], deep: true },
  { type: 'multi',  q: 'Food, sleep and stress', groups: ['food', 'sleep', 'stress'] },
  { type: 'goal',   k: 'goal',   q: 'What are you trying to change?' },
  { type: 'done',   h: 'That’s everything we need.' },
];

export default function Questions({ reveal, onFinish, onBack, phase = 1 }) {
  const STEPS = reveal
    ? [{ type: 'multi', q: 'Two quick ones', groups: reveal.groups }]
    : FULL.filter((s) => !s.deep || phaseHas(phase, 'twin'));

  const [i, setI] = useState(0);
  const [a, setA] = useState({ hUnit: 'cm', wUnit: 'kg' });
  const set = (k, v) => setA((p) => ({ ...p, [k]: v }));
  const step = STEPS[i];

  const real = STEPS.filter((s) => s.type !== 'cheer' && s.type !== 'done');
  const pct = Math.round((STEPS.slice(0, i).filter((s) => s.type !== 'cheer' && s.type !== 'done').length / real.length) * 100);

  const next = () => (i < STEPS.length - 1 ? setI(i + 1) : onFinish(a));
  const back = () => (i > 0 ? setI(i - 1) : onBack());

  const groupDone = (g) => {
    const v = a[g];
    return GROUPS[g].multi ? !!(v && v.length) : !!v;
  };
  const nDone = step.groups ? step.groups.filter(groupDone).length : 0;
  const canNext =
    step.type === 'multi' ? nDone > 0 :
    step.type === 'chips' || step.type === 'rows' ? !!a[step.k] :
    step.type === 'goal'  ? !!a.goal : true;

  /* ── full-bleed moments ── */
  if (step.type === 'cheer' || step.type === 'done') {
    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', px: 3.5, textAlign: 'center',
      }}>
        <Typography variant="h1" sx={{ color: C.deep }}>{step.h}</Typography>
        <Button variant="contained" color="secondary" onClick={next}
                sx={{ mt: 4, minWidth: 240 }}>
          {step.type === 'done' ? buildWords(phase).cta : 'Continue'}
        </Button>
      </Box>
    );
  }

  const chipSx = (on) => ({
    bgcolor: on ? C.deep : 'rgba(27,57,91,0.06)',
    color: on ? '#fff' : C.ink,
    fontWeight: on ? 600 : 500,
    '&:hover': { bgcolor: on ? C.deep : 'rgba(27,57,91,0.10)' },
  });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* back · short centred bar · skip */}
      <Stack direction="row" sx={{ alignItems: 'center', px: 2.25, pt: 1.5, pb: 0.5 }}>
        <Box sx={{ flex: '1 1 0', display: 'flex' }}>
          <IconButton onClick={back} size="small" sx={{ ml: -0.5, color: C.deep }}>
            <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
          </IconButton>
        </Box>
        <LinearProgress variant="determinate" value={pct}
                        sx={{ flex: '0 0 132px' }} />
        <Box sx={{ flex: '1 1 0', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={next} sx={{
            minHeight: 0, p: 0, fontSize: 14, fontWeight: 700, color: C.ink2,
          }}>Skip</Button>
        </Box>
      </Stack>

      <Box sx={{
        flex: '1 1 auto', overflowY: 'auto', px: 2.25, pt: 1.5, pb: 2,
        display: 'flex', flexDirection: 'column',
        textAlign: step.centre ? 'center' : 'left',
      }}>
        <Typography variant="h2" sx={{ color: C.deep }}>{step.q}</Typography>

        <Box sx={{
          flex: step.centre ? '1 1 auto' : '0 0 auto',
          display: 'flex', flexDirection: 'column',
          justifyContent: step.centre ? 'center' : 'flex-start',
          mt: step.centre ? 0 : 2.5,
        }}>
          {step.type === 'drum' && (
            <Drum from={step.from} to={step.to} value={a[step.k] ?? step.def}
                  onChange={(v) => set(step.k, v)} />
          )}

          {step.type === 'height' && (
            <>
              {a.hUnit === 'cm' ? (
                <Stack direction="row"><Drum from={140} to={210} value={a.cm ?? 175}
                  onChange={(v) => set('cm', v)} suffix="cm" /></Stack>
              ) : (
                /* flex 1 + minWidth 0 on each drum — cannot overflow 375px */
                <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
                  <Drum from={4} to={7}  value={a.ft ?? 5} onChange={(v) => set('ft', v)} suffix="ft" />
                  <Drum from={0} to={11} value={a.in ?? 9} onChange={(v) => set('in', v)} suffix="in" />
                </Stack>
              )}
              <UnitToggle value={a.hUnit} onChange={(v) => set('hUnit', v)} opts={['cm', 'ft']} />
            </>
          )}

          {step.type === 'weight' && (
            <>
              {a.wUnit === 'kg'
                ? <Stack direction="row"><Drum from={40} to={180} value={a.kg ?? 96}
                    onChange={(v) => set('kg', v)} suffix="kg" /></Stack>
                : <Stack direction="row"><Drum from={90} to={400} value={a.lb ?? 210}
                    onChange={(v) => set('lb', v)} suffix="lb" /></Stack>}
              <UnitToggle value={a.wUnit} onChange={(v) => set('wUnit', v)} opts={['kg', 'lb']} />
            </>
          )}

          {step.type === 'chips' && (
            <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
              {step.o.map((o) => (
                <Chip key={o} label={o} onClick={() => set(step.k, o)} sx={chipSx(a[step.k] === o)} />
              ))}
            </Stack>
          )}

          {step.type === 'rows' && (
            <Stack spacing={1.25}>
              {step.o.map((o) => {
                const on = a[step.k] === o;
                return (
                  <Stack key={o} direction="row" spacing={1.75}
                         onClick={() => set(step.k, o)} sx={{
                    alignItems: 'center', px: 2.25, py: 2.25, borderRadius: '18px',
                    cursor: 'pointer',
                    bgcolor: on ? 'rgba(27,57,91,.05)' : '#fff',
                    border: `1.5px solid ${on ? C.deep : 'transparent'}`,
                    boxShadow: on ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
                  }}>
                    <Typography sx={{ flex: 1, fontSize: 16, fontWeight: 600, color: C.deep }}>
                      {o}
                    </Typography>
                    {on && <CheckIcon sx={{ fontSize: 20, color: C.deep }} />}
                  </Stack>
                );
              })}
            </Stack>
          )}

          {step.type === 'place' && (
            <>
              <Box sx={{
                position: 'relative', height: 250, borderRadius: '20px', overflow: 'hidden',
                bgcolor: '#DCE6EC', boxShadow: 'inset 0 0 0 1px rgba(27,57,91,.09)',
              }}>
                <Box component="img" src="/map.jpg" alt=""
                     onError={(e) => { e.currentTarget.style.display = 'none'; }}
                     sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <Box sx={{
                  position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-100%)',
                  bgcolor: C.deep, color: '#fff', fontSize: 12.5, fontWeight: 700,
                  px: 1.6, py: 0.9, borderRadius: '11px', whiteSpace: 'nowrap',
                }}>Al Olaya</Box>
              </Box>
              <TextField fullWidth variant="standard" defaultValue="Al Olaya, Riyadh"
                         onChange={(e) => set('place', e.target.value)}
                         sx={{ mt: 2 }} />
            </>
          )}

          {step.type === 'multi' && (
            <Stack spacing={2.5} divider={<Box sx={{ borderTop: '1px solid rgba(27,57,91,.08)' }} />}>
              {step.groups.map((g) => {
                const G = GROUPS[g];
                const v = a[g];
                const on = (o) => (G.multi ? (v || []).includes(o) : v === o);
                const pick = (o) => set(g, G.multi
                  ? ((v || []).includes(o) ? v.filter((x) => x !== o) : [...(v || []), o])
                  : o);
                return (
                  <Box key={g}>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 1.5 }}>
                      <Box sx={{ fontSize: 17 }}>{G.ic}</Box>
                      <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.deep }}>
                        {G.t}
                      </Typography>
                    </Stack>
                    <Stack direction="row" useFlexGap spacing={1} sx={{ flexWrap: 'wrap' }}>
                      {G.o.map((o) => (
                        <Chip key={o} label={o} onClick={() => pick(o)} sx={chipSx(on(o))} />
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          )}

          {step.type === 'goal' && (
            <Stack spacing={1.25}>
              {GOALS.map((g) => {
                const on = a.goal === g.k;
                return (
                  <Stack key={g.k} direction="row" spacing={1.75}
                         onClick={() => set('goal', g.k)} sx={{
                    alignItems: 'center', px: 2, py: 1.9, borderRadius: '18px', cursor: 'pointer',
                    bgcolor: on ? 'rgba(27,57,91,.05)' : '#fff',
                    border: `1.5px solid ${on ? C.deep : 'transparent'}`,
                    boxShadow: on ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
                  }}>
                    <Box sx={{ fontSize: 21 }}>{g.ic}</Box>
                    <Typography sx={{ flex: 1, fontSize: 15, fontWeight: 700, color: C.deep }}>
                      {g.t}
                    </Typography>
                    {on && <CheckIcon sx={{ fontSize: 19, color: C.deep }} />}
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
      </Box>

      <Box sx={{
        px: 2.25, pt: 1.25, pb: 3, borderTop: `1px solid ${C.line}`,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
      }}>
        {step.type === 'multi' ? (
          <Button fullWidth variant="contained" color="secondary"
                  disabled={!canNext} onClick={next}>
            Next {nDone} / {step.groups.length}
          </Button>
        ) : (
          <IconButton onClick={next} disabled={!canNext} sx={{
            width: 54, height: 54, bgcolor: C.deep, color: '#fff',
            '&:hover': { bgcolor: C.deep2 },
            '&.Mui-disabled': { bgcolor: 'rgba(27,57,91,.2)', color: '#fff' },
          }}>
            <ArrowForwardIosIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
      </Box>
    </Box>
  );
}

function UnitToggle({ value, onChange, opts }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
      <ToggleButtonGroup exclusive value={value} size="small"
        onChange={(_, v) => v && onChange(v)}
        sx={{
          bgcolor: 'rgba(27,57,91,.07)', borderRadius: '12px', p: '3px',
          '& .MuiToggleButton-root': {
            border: 0, borderRadius: '10px !important', px: 2.25, py: 0.8,
            fontSize: 12.5, fontWeight: 700, color: C.ink2, textTransform: 'uppercase',
          },
          '& .Mui-selected': {
            bgcolor: '#fff !important', color: `${C.deep} !important`,
            boxShadow: '0 2px 7px -2px rgba(27,57,91,.22)',
          },
        }}>
        {opts.map((o) => <ToggleButton key={o} value={o}>{o}</ToggleButton>)}
      </ToggleButtonGroup>
    </Box>
  );
}
