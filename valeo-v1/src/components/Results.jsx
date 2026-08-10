import { Box, Divider, Stack, Typography } from '@mui/material';
import MovedList from './MovedList';
import PredictedObserved from './PredictedObserved';
import { resultsFor, runOf, DOCTOR, PANELS } from '../data';
import { C, meter } from '../theme';

/**
 * THE RESULTS — the closing half of the loop.
 *
 * Lives inside the protocol rather than as a screen of its own, because a verdict
 * detached from what produced it is a number without a cause. Same page, two
 * faces: what you agreed to run, and what it did.
 *
 * Order is the argument. The verdict first, in one sentence, before any evidence
 * — a screen that makes you assemble the conclusion yourself is hiding from it.
 * Then the markers it is scored on, because those are the only things allowed to
 * decide. Then everything else that moved. Then the doctor's read, which is the
 * part being sold: a clinician committing to an interpretation and to what
 * happens next, including what to stop paying for.
 */
export default function Results({ st, pKey }) {
  const r = resultsFor(st, pKey);
  const rx = runOf(st, pKey) || {};
  const adherence = rx.logs && rx.day ? Math.round((rx.logs.length / rx.day) * 100) : null;
  const tone = C[r.verdict.c] || C.green;

  return (
    <Box>
      {/* ── the verdict, before the evidence ── */}
      <Box sx={{
        p: 2.25, borderRadius: '22px', color: '#fff',
        background: `linear-gradient(152deg,${tone},${C.deep})`,
      }}>
        <Typography sx={{
          fontSize: 8.5, fontWeight: 800, letterSpacing: '.18em',
          textTransform: 'uppercase', color: 'rgba(255,255,255,.72)',
        }}>◈ Verdict · {PANELS[1].date}</Typography>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 600, mt: 0.75,
        }}>{r.verdict.t}</Typography>
        <Typography sx={{
          fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,.85)', mt: 0.9,
        }}>{r.verdict.s}</Typography>

        <Stack direction="row" sx={{ mt: 2.25 }}
               divider={<Divider orientation="vertical" flexItem
                                 sx={{ borderColor: 'rgba(255,255,255,.18)' }} />}>
          {[/* A protocol with no blood marker cannot report "markers hit" — it was
                judged on how much of its own prediction it delivered, so that is
                what this tile has to say. */
            r.basis === 'markers'
              ? [`${r.hit} of ${r.scored.length}`, 'Markers hit']
              : [`${r.delivery.share}%`, 'Of prediction'],
            [`${r.p.wk} wk`, 'Run length'],
            [adherence != null ? `${adherence}%` : '—', 'Adherence']].map(([v, k], i) => (
            <Box key={k} sx={{ flex: 1, minWidth: 0, pl: i ? 1.5 : 0, pr: 1.5 }}>
              <Typography sx={{
                fontFamily: meter, fontSize: 18, fontWeight: 700, lineHeight: 1,
              }}>{v}</Typography>
              <Typography sx={{
                fontSize: 7.5, fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,.5)', mt: 0.55,
              }}>{k}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* ── THE CENTRAL CLAIM ──
          Predicted against observed, before any other evidence. Everything below
          describes what happened; only this says whether we were right about it. */}
      <Label>What we predicted, what we got</Label>
      <PredictedObserved st={st} pKey={pKey} />

      {/* ── the markers that were allowed to decide ──
          Absent for protocols scored on something a blood panel does not carry.
          An empty section under a heading is worse than no section: it reads as
          data we failed to load rather than data that does not exist. */}
      {r.scored.length === 0 ? (
        <>
          <Label>Scored on {r.p.mk}</Label>
          <Box sx={{
            px: 1.75, py: 1.6, borderRadius: '16px',
            bgcolor: 'rgba(27,57,91,.04)', border: '1px dashed rgba(27,57,91,.18)',
          }}>
            <Typography sx={{ fontSize: 12.5, color: C.ink2, lineHeight: 1.55 }}>
              {r.p.mk} is not a blood marker, so there is no panel to read it
              against. This protocol is judged on how much of its predicted
              movement it delivered.
            </Typography>
          </Box>
        </>
      ) : (
      <>
      <Label>Scored on {r.p.mk}</Label>
      <Stack spacing={0.9}>
        {r.scored.map((m) => (
          <Stack key={m.k} direction="row" spacing={1.25} sx={{
            alignItems: 'center', px: 1.75, py: 1.5, borderRadius: '16px', bgcolor: '#fff',
            boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
            borderLeft: `3px solid ${m.marker.good ? C.green : C.coral}`,
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
                {m.marker.mk}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>{m.t}</Typography>
            </Box>
            <Stack direction="row" spacing={0.6} sx={{ alignItems: 'baseline', flexShrink: 0 }}>
              <Typography sx={{ fontFamily: meter, fontSize: 12.5, color: C.ink2 }}>
                {m.marker.from}
              </Typography>
              <Typography sx={{ fontSize: 11, color: C.ink2 }}>→</Typography>
              <Typography sx={{
                fontFamily: meter, fontSize: 17, fontWeight: 700,
                color: m.marker.good ? C.green : C.coral,
              }}>{m.marker.to}</Typography>
              <Typography sx={{ fontSize: 10.5, color: C.ink2 }}>{m.marker.unit}</Typography>
            </Stack>
          </Stack>
        ))}
      </Stack>
      </>
      )}

      {/* ── everything else the run touched ── */}
      <Label>Everything else that moved</Label>
      <MovedList rows={r.rows.filter((m) => !r.scored.includes(m))} />

      {/* ── where no clinician has written a read yet ── */}
      {!r.read && r.summary && (
        <>
          <Label>Where it landed</Label>
          <Box sx={{
            px: 1.75, py: 1.6, borderRadius: '16px', bgcolor: '#fff',
            boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
          }}>
            <Typography sx={{ fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
              {r.summary}
            </Typography>
            <Typography sx={{ fontSize: 11, color: C.ink2, mt: 1, lineHeight: 1.5 }}>
              A summary of the numbers, not a clinical read. {DOCTOR.name.split(' ')[1]} gives
              you that on the call.
            </Typography>
          </Box>
        </>
      )}

      {/* ── the read, which is the thing being sold ── */}
      {r.read && (
        <>
          <Label>What {DOCTOR.name.split(' ')[1]} says</Label>
          <Stack direction="row" spacing={1.6} sx={{
            alignItems: 'flex-start', px: 1.75, py: 1.75, borderRadius: '18px',
            bgcolor: '#fff', boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
          }}>
            <Box component="img" src={DOCTOR.img} alt="" sx={{
              width: 40, height: 40, borderRadius: '13px', objectFit: 'cover', flexShrink: 0,
            }} />
            <Typography sx={{ fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
              {r.read}
            </Typography>
          </Stack>
        </>
      )}

      {/* ── what happens now, including what to stop ── */}
      {r.next && (
        <>
          <Label>What he recommends</Label>
          <Box sx={{
            px: 1.75, py: 1.6, borderRadius: '16px',
            bgcolor: 'rgba(64,143,164,.09)', border: `1px solid rgba(64,143,164,.3)`,
          }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
              {r.next.t}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 0.3, lineHeight: 1.5 }}>
              {r.next.s}
            </Typography>
          </Box>
        </>
      )}

      {r.stop && r.stop.length > 0 && (
        <Box sx={{
          mt: 1, px: 1.75, py: 1.6, borderRadius: '16px',
          bgcolor: 'rgba(255,185,0,.10)', border: `1px solid rgba(255,185,0,.4)`,
        }}>
          <Typography sx={{
            fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em',
            textTransform: 'uppercase', color: C.yellowDeep, mb: 0.6,
          }}>Stop taking</Typography>
          {r.stop.map((x) => (
            <Typography key={x} sx={{ fontSize: 13, color: C.ink, lineHeight: 1.5 }}>
              {x}
            </Typography>
          ))}
        </Box>
      )}

      <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2.5, lineHeight: 1.6 }}>
        Measured {PANELS[0].date} and again {PANELS[1].date}, same panel, same lab. A verdict
        against a different assay would not be a comparison.
      </Typography>
    </Box>
  );
}

function Label({ children }) {
  return (
    <Typography sx={{
      fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
      color: C.ink2, mt: 3, mb: 1.25,
    }}>{children}</Typography>
  );
}
