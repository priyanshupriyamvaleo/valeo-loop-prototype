import { Box, Stack, Typography } from '@mui/material';
import { C } from '../theme';

/*
 * THE CATEGORY MANAGER'S CONSOLE.
 *
 * The plan is content, not code. Everything the patient sees on the PDP —
 * name, tagline, both medications with both prices, the three-section
 * includes table with its per-term ticks, the guarantee — is edited here
 * and renders on the phone in the same second, because both surfaces read
 * the same store.
 *
 * What is deliberately NOT here: the safety questions and eligibility rules.
 * Those are clinical, owned by the doctor's side, and shown read-only so the
 * boundary is visible.
 */
export default function CatMan({ st, dispatch }) {
  const plan = st.plan;
  const patch = (p) => dispatch({ type: 'planPatch', patch: p });

  const patchMed = (i, p) => {
    const meds = plan.meds.map((m, n) => (n === i ? { ...m, ...p } : m));
    patch({ meds });
  };
  const patchRow = (si, ri, p) => {
    const sections = plan.sections.map((s, n) => (n !== si ? s
      : { ...s, rows: p === null
          ? s.rows.filter((_, rn) => rn !== ri)
          : s.rows.map((r, rn) => (rn === ri ? { ...r, ...p } : r)) }));
    patch({ sections });
  };
  const addRow = (si) => {
    const sections = plan.sections.map((s, n) => (n !== si ? s
      : { ...s, rows: [...s.rows, { t: 'New line', m: true, q: true }] }));
    patch({ sections });
  };

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

      {/* ── the two medications, each with its two prices ── */}
      <Typography sx={{
        fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: '#5D7793', mt: 2.25,
      }}>Medications & pricing (SAR)</Typography>
      {plan.meds.map((m, i) => (
        <Box key={m.key} sx={{
          mt: 1, px: 1.5, py: 1.25, borderRadius: '12px',
          bgcolor: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)',
        }}>
          <Stack direction="row" spacing={1}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={miniLabel}>Name</Typography>
              <Box component="input" value={m.name}
                onChange={(e) => patchMed(i, { name: e.target.value })}
                sx={{ ...inputSx, width: '100%', boxSizing: 'border-box' }} />
            </Box>
            <Box sx={{ flex: 1.4, minWidth: 0 }}>
              <Typography sx={miniLabel}>Molecule · cadence</Typography>
              <Box component="input" value={m.generic}
                onChange={(e) => patchMed(i, { generic: e.target.value })}
                sx={{ ...inputSx, width: '100%', boxSizing: 'border-box' }} />
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={miniLabel}>Monthly</Typography>
              <Box component="input" type="number" value={m.monthly}
                onChange={(e) => patchMed(i, { monthly: Math.max(0, Number(e.target.value) || 0) })}
                sx={{ ...inputSx, width: '100%', boxSizing: 'border-box' }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={miniLabel}>3 months, one payment</Typography>
              <Box component="input" type="number" value={m.quarter}
                onChange={(e) => patchMed(i, { quarter: Math.max(0, Number(e.target.value) || 0) })}
                sx={{ ...inputSx, width: '100%', boxSizing: 'border-box' }} />
            </Box>
          </Stack>
          <Typography sx={{ fontSize: 10, color: '#5D7793', mt: 0.5 }}>
            3-month per-month renders as SAR {Math.round(m.quarter / 3).toLocaleString()},
            derived, never typed.
          </Typography>
        </Box>
      ))}

      {/* ── the includes table: three sections, a tick per term ── */}
      <Typography sx={{
        fontSize: 9.5, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: '#5D7793', mt: 2.25, mb: 0.25,
      }}>What’s included · M = monthly, 3M = 3 months</Typography>
      {plan.sections.map((sec, si) => (
        <Box key={sec.h} sx={{ mt: 1.25 }}>
          <Typography sx={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.1em',
            textTransform: 'uppercase', color: C.yellow, mb: 0.5,
          }}>{sec.h}</Typography>
          <Stack spacing={0.6}>
            {sec.rows.map((row, ri) => (
              <Stack key={ri} direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
                <Box component="input" value={row.t}
                  onChange={(e) => patchRow(si, ri, { t: e.target.value })}
                  sx={inputSx} />
                {[['m', 'M'], ['q', '3M']].map(([k, t]) => (
                  <Box key={k} onClick={() => patchRow(si, ri, { [k]: !row[k] })} sx={{
                    width: 30, height: 26, borderRadius: '7px', flexShrink: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800,
                    bgcolor: row[k] ? 'rgba(39,153,91,.35)' : 'rgba(255,255,255,.06)',
                    color: row[k] ? '#fff' : '#5D7793',
                  }}>{t}</Box>
                ))}
                <Box onClick={() => patchRow(si, ri, null)} sx={{
                  width: 26, height: 26, borderRadius: '7px', flexShrink: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: 'rgba(255,255,255,.06)', color: '#93A9C2', fontSize: 14,
                }}>×</Box>
              </Stack>
            ))}
            <Box onClick={() => addRow(si)} sx={{
              px: 1.25, py: 0.7, borderRadius: '9px', cursor: 'pointer', textAlign: 'center',
              fontSize: 11, fontWeight: 700, bgcolor: 'rgba(255,255,255,.07)', color: '#C7D6E6',
            }}>+ Add a line</Box>
          </Stack>
        </Box>
      ))}

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

const miniLabel = {
  fontSize: 9, fontWeight: 800, letterSpacing: '.12em',
  textTransform: 'uppercase', color: '#5D7793', mb: 0.4,
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
