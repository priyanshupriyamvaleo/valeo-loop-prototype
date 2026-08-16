import { Box, Stack, Typography } from '@mui/material';
import { C } from '../theme';

/*
 * THE CATEGORY MANAGER'S CONSOLE.
 *
 * The plan is content, not code. Everything the patient sees on the PDP —
 * name, tagline, both prices, the includes list, the guarantee — is edited
 * here and renders on the phone in the same second, because both surfaces
 * read the same store.
 *
 * What is deliberately NOT here: the safety questions and eligibility rules.
 * Those are clinical, owned by the doctor's side, and shown read-only so the
 * boundary is visible.
 */
export default function CatMan({ st, dispatch }) {
  const plan = st.plan;
  const patch = (p) => dispatch({ type: 'planPatch', patch: p });

  const setInclude = (i, v) => {
    const next = plan.includes.slice();
    next[i] = v;
    patch({ includes: next });
  };
  const removeInclude = (i) =>
    patch({ includes: plan.includes.filter((_, n) => n !== i) });
  const addInclude = () =>
    patch({ includes: [...plan.includes, 'New line'] });

  return (
    <Box sx={{ color: '#E8EEF5' }}>
      <Typography sx={{
        fontSize: 10, fontWeight: 800, letterSpacing: '.18em',
        textTransform: 'uppercase', color: C.yellow,
      }}>Category manager</Typography>
      <Typography sx={{
        fontFamily: '"Fraunces", serif', fontSize: 20, fontWeight: 600,
        color: '#fff', mt: 0.5,
      }}>The plan</Typography>
      <Typography sx={{ fontSize: 11.5, color: '#93A9C2', mt: 0.5, lineHeight: 1.5 }}>
        Edit here, and the phone updates in the same second. The plan is
        content, not code.
      </Typography>

      {/* status */}
      <Stack direction="row" spacing={0.6} sx={{ mt: 2 }}>
        {['live', 'draft'].map((v) => (
          <Box key={v} onClick={() => patch({ status: v })} sx={{
            px: 1.4, py: 0.5, borderRadius: '999px', cursor: 'pointer',
            fontSize: 10.5, fontWeight: 700, textTransform: 'capitalize',
            bgcolor: plan.status === v ? (v === 'live' ? C.green : C.coral) : 'rgba(255,255,255,.08)',
            color: plan.status === v ? '#fff' : '#93A9C2',
          }}>{v}</Box>
        ))}
      </Stack>

      <Field label="Plan name" value={plan.name} onChange={(v) => patch({ name: v })} />
      <Field label="Tagline" value={plan.tagline} onChange={(v) => patch({ tagline: v })} />
      <Field label="Medication" value={plan.medication} onChange={(v) => patch({ medication: v })} />

      <Stack direction="row" spacing={1}>
        <NumField label="Monthly (SAR)" value={plan.monthly}
          onChange={(v) => patch({ monthly: v })} />
        <NumField label="3 months, one payment (SAR)" value={plan.quarterTotal}
          onChange={(v) => patch({ quarterTotal: v })} />
      </Stack>
      <Typography sx={{ fontSize: 10, color: '#5D7793', mt: 0.5 }}>
        3-month per-month renders as SAR {Math.round(plan.quarterTotal / 3).toLocaleString()},
        derived, never typed.
      </Typography>

      {/* includes */}
      <Typography sx={{
        fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: '#5D7793', mt: 2.25, mb: 0.75,
      }}>What’s included</Typography>
      <Stack spacing={0.6}>
        {plan.includes.map((t, i) => (
          <Stack key={i} direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
            <Box component="input" value={t}
              onChange={(e) => setInclude(i, e.target.value)}
              sx={inputSx} />
            <Box onClick={() => removeInclude(i)} sx={{
              width: 26, height: 26, borderRadius: '7px', flexShrink: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,.06)', color: '#93A9C2', fontSize: 14,
            }}>×</Box>
          </Stack>
        ))}
        <Box onClick={addInclude} sx={{
          px: 1.25, py: 0.8, borderRadius: '9px', cursor: 'pointer', textAlign: 'center',
          fontSize: 11.5, fontWeight: 700, bgcolor: 'rgba(255,255,255,.07)', color: '#C7D6E6',
        }}>+ Add a line</Box>
      </Stack>

      <Field label="Guarantee" value={plan.guarantee}
        onChange={(v) => patch({ guarantee: v })} />

      {/* the boundary, made visible */}
      <Box sx={{
        mt: 2.25, px: 1.5, py: 1.25, borderRadius: '12px',
        bgcolor: 'rgba(255,255,255,.04)', border: '1px dashed rgba(255,255,255,.15)',
      }}>
        <Typography sx={{
          fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em',
          textTransform: 'uppercase', color: '#5D7793',
        }}>Owned by clinical, read only</Typography>
        <Typography sx={{ fontSize: 11, color: '#93A9C2', mt: 0.5, lineHeight: 1.5 }}>
          The safety questions, the flag rules and the eligibility decision.
          The doctor’s verbs are yes and no; the plan never changes them.
        </Typography>
      </Box>
    </Box>
  );
}

const inputSx = {
  flex: 1, minWidth: 0, px: 1.1, py: 0.75, borderRadius: '9px',
  bgcolor: 'rgba(255,255,255,.07)', border: '1px solid rgba(255,255,255,.12)',
  color: '#E8EEF5', fontSize: 12, fontFamily: 'inherit', outline: 'none',
  '&:focus': { borderColor: 'rgba(255,185,0,.6)' },
};

function Field({ label, value, onChange }) {
  return (
    <Box sx={{ mt: 1.75 }}>
      <Typography sx={{
        fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: '#5D7793', mb: 0.5,
      }}>{label}</Typography>
      <Box component="input" value={value} onChange={(e) => onChange(e.target.value)}
        sx={{ ...inputSx, width: '100%', boxSizing: 'border-box' }} />
    </Box>
  );
}

function NumField({ label, value, onChange }) {
  return (
    <Box sx={{ mt: 1.75, flex: 1, minWidth: 0 }}>
      <Typography sx={{
        fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: '#5D7793', mb: 0.5, whiteSpace: 'nowrap',
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{label}</Typography>
      <Box component="input" type="number" value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        sx={{ ...inputSx, width: '100%', boxSizing: 'border-box' }} />
    </Box>
  );
}
