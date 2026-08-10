import { Box, Button, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoopRing from '../components/LoopRing';
import { PROTOCOLS, PHASES, phaseOf, TWINS, matchFor, RX_LABEL,
         activeRuns, savedOnly, completedRuns, runOf } from '../data';
import TwinGlyph from '../components/TwinGlyph';
import { C } from '../theme';

/**
 * Protocols is the portfolio: the one thing running, and the things you kept.
 *
 * The gate on starting is deliberate and not a paywall — a protocol without a
 * baseline has nothing to be measured against at week 12, so starting one
 * would quietly break the only promise the product makes.
 */
export default function Protocols({ st, onGo, onDetail, onResults, onTrack, home = 'discover' }) {
  /* ── THREE GROUPS, THREE QUESTIONS ──
     Active: what is happening to me now. Saved: should I run this. Completed:
     what did it do. They are different questions, which is why one list with
     status badges was never going to be enough. */
  const active = activeRuns(st);
  const saved = savedOnly(st);
  const closed = completedRuns(st);
  /* the run to show as the hero — the furthest along one that is actually running */
  const hero = active.find((x) => ['running', 'verdict', 'reviewing'].includes(x.status));
  const a = hero ? hero.run : null;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2.25, pt: 2.5, pb: 2 }}>
        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.ink2,
        }}>Protocols</Typography>
        <Typography variant="h2" sx={{ color: C.deep, mt: 0.75 }}>
          {active.length > 1 ? `${active.length} in flight.`
            : a ? 'One running.'
              : active.length ? 'Getting started.'
                : saved.length || closed.length ? 'Nothing running yet.' : 'Nothing here yet.'}
        </Typography>
      </Box>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
        {/* ── the loop, as the hero ── */}
        {a && (() => {
          const p = hero.p;
          const phase = phaseOf(a);
          const idx = PHASES.indexOf(phase);
          return (
            <Box sx={{
              borderRadius: '22px', p: 2.25, color: '#fff',
              background: `linear-gradient(155deg,${C.deep},#12283F)`,
            }}>
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <LoopRing size={92} dark phase={phase} fill={a.day / a.total}
                          label={a.day} sub={`of ${a.total}`} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 8.5, fontWeight: 800, letterSpacing: '.16em',
                    textTransform: 'uppercase', color: C.yellow,
                  }}>◈ Loop 1 · {phase}</Typography>
                  <Typography sx={{
                    fontFamily: '"Fraunces", serif', fontSize: 21, fontWeight: 600, mt: 0.5,
                  }}>{p.t}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,.62)', mt: 0.4 }}>
                    {a.adherence}% adherence
                  </Typography>
                </Box>
              </Stack>

              {/* the five phases, spelled out — the ring alone isn't literate */}
              <Stack direction="row" spacing={0.75} sx={{ mt: 2.25 }}>
                {PHASES.map((ph, i) => (
                  <Box key={ph} sx={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
                    <Box sx={{
                      height: 3, borderRadius: 2, mb: 0.75,
                      bgcolor: i < idx ? '#6FD69B' : i === idx ? C.yellow : 'rgba(255,255,255,.18)',
                    }} />
                    <Typography sx={{
                      fontSize: 7.5, fontWeight: 700, letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: i <= idx ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.35)',
                    }}>{ph}</Typography>
                  </Box>
                ))}
              </Stack>

              <Stack direction="row" spacing={1.25} onClick={() => onTrack(hero.k)} sx={{
                mt: 2, pt: 1.75, borderTop: '1px solid rgba(255,255,255,.13)',
                alignItems: 'center', cursor: 'pointer',
              }}>
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,.75)', flex: 1 }}>
                  Verdict on {p.mk} at day {a.total}
                </Typography>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C.yellow }}>
                  {a.total - a.day} days
                </Typography>
                <ChevronRightIcon sx={{ fontSize: 17, color: C.yellow }} />
              </Stack>
            </Box>
          );
        })()}

        {/* ── active ──
            Everything with a run that no clinician has closed yet. Tapping one
            goes to its day, not to a booking page it already went through. */}
        {active.length > 0 && (
          <>
            <Typography sx={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
              color: C.ink2, mt: a ? 3 : 0, mb: 1.25,
            }}>Active · {active.length}</Typography>

            <Stack spacing={1.1} sx={{ mb: 1 }}>
              {active.map(({ k, p, run, status }) => {
                const L = RX_LABEL[status];
                const tw = TWINS.find((t) => t.protocol === k);
                const live = ['running', 'verdict', 'reviewing'].includes(status);
                /* Always the protocol's own page — which for a running one is a
                   status view ending in "Track it on Today", not the booking flow
                   it already went through. The hero card above is the shortcut
                   straight into the day. */
                return (
                  <Stack key={k} direction="row" spacing={1.5}
                         onClick={() => onDetail(k)}
                         sx={{
                    alignItems: 'center', p: 1.75, borderRadius: '18px', cursor: 'pointer',
                    bgcolor: '#fff', boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
                    border: k === st.focus && live ? `1px solid ${C.deep}` : '1px solid transparent',
                  }}>
                    <Avatar tw={tw} />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
                        {p.t}
                      </Typography>
                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.4 }}>
                        <Box sx={{
                          width: 6, height: 6, borderRadius: '50%', flexShrink: 0, bgcolor: C[L.c],
                        }} />
                        <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C[L.c] }}>
                          {L.t}
                        </Typography>
                        <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
                          {run && run.day ? `· day ${run.day} of ${run.total}` : `· ${p.wk} wk`}
                        </Typography>
                      </Stack>
                      {/* progress, where there is progress to show */}
                      {run && run.day && (
                        <Box sx={{
                          mt: 0.85, height: 3, borderRadius: 2, bgcolor: 'rgba(27,57,91,.09)',
                        }}>
                          <Box sx={{
                            width: `${Math.round((run.day / run.total) * 100)}%`, height: '100%',
                            borderRadius: 2, bgcolor: C.green,
                          }} />
                        </Box>
                      )}
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
                  </Stack>
                );
              })}
            </Stack>
          </>
        )}

        {/* ── completed ── */}
        {closed.length > 0 && (
          <>
            <Typography sx={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
              color: C.ink2, mt: (a || active.length) ? 3 : 0, mb: 1.25,
            }}>Completed · {closed.length}</Typography>

            <Stack spacing={1.1} sx={{ mb: 1 }}>
              {closed.map(({ k: pk, p }) => { const tw = TWINS.find((t) => t.protocol === pk); return (
                <Stack key={pk} direction="row" spacing={1.5} onClick={() => onResults(pk)}
                       sx={{
                  alignItems: 'center', p: 1.75, borderRadius: '18px', cursor: 'pointer',
                  bgcolor: 'rgba(39,153,91,.07)', border: '1px solid rgba(39,153,91,.22)',
                }}>
                  <Box sx={{
                    width: 46, height: 46, borderRadius: '14px', flexShrink: 0, overflow: 'hidden',
                    bgcolor: tw ? tw.tone : C.deep, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 15, fontWeight: 800,
                    color: 'rgba(255,255,255,.85)',
                  }}>
                    {tw
                      ? (tw.img
                          ? <Box component="img" src={tw.img} alt=""
                                 sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : tw.mono)
                      : <TwinGlyph size={30} fill={0.9} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
                      {p.t}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.4 }}>
                      <CheckCircleIcon sx={{ fontSize: 13, color: C.green }} />
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C.green }}>
                        Verdict in
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
                        · {p.wk} wk · scored on {p.mk}
                      </Typography>
                    </Stack>
                  </Box>
                  <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
                </Stack>
              ); })}
            </Stack>
          </>
        )}

        {/* ── saved ── */}
        <Typography sx={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
          color: C.ink2, mt: (a || active.length || closed.length) ? 3 : 0, mb: 1.25,
        }}>
          {saved.length ? `Saved · ${saved.length}` : 'Saved'}
        </Typography>

        {saved.length === 0 ? (
          <Box sx={{
            textAlign: 'center', px: 3, py: 4, borderRadius: '20px', bgcolor: '#fff',
            boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
          }}>
            <Typography sx={{ fontSize: 13.5, color: C.ink2, lineHeight: 1.55 }}>
              Anything you keep waits here until you book it.
            </Typography>
            {/* the destination is whichever find-a-protocol surface this phase ships —
                hardcoding 'discover' dropped phase 1 onto a tab it does not have */}
            <Button variant="contained" color="secondary" sx={{ mt: 2.25 }}
                    onClick={() => onGo(home)}>
              Find a protocol
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.1}>
            {saved.map(({ k: pk, p }) => {
              const tw = TWINS.find((t) => t.protocol === pk);
              const L = RX_LABEL.saved;
              return (
                <Stack key={pk} direction="row" spacing={1.5} onClick={() => onDetail(pk)}
                       sx={{
                  alignItems: 'center', p: 1.75, borderRadius: '18px', bgcolor: '#fff',
                  cursor: 'pointer', boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
                }}>
                  <Box sx={{
                    width: 46, height: 46, borderRadius: '14px', flexShrink: 0, overflow: 'hidden',
                    bgcolor: tw ? tw.tone : C.deep, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 15, fontWeight: 800,
                    color: 'rgba(255,255,255,.85)',
                  }}>
                    {tw
                      ? (tw.img
                          ? <Box component="img" src={tw.img} alt=""
                                 sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : tw.mono)
                      : <TwinGlyph size={30} fill={0.9} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
                      {p.t}
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.4 }}>
                      <Box sx={{
                        width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                        bgcolor: C[L.c],
                      }} />
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C[L.c] }}>
                        {L.t}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
                        · {tw ? `${matchFor(tw, st)}%` : 'yours'} · {p.wk} wk
                      </Typography>
                    </Stack>
                  </Box>
                  <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
                </Stack>
              );
            })}
          </Stack>
        )}
      </Box>

    </Box>
  );
}

/* One avatar for all three lists — an influencer's face where there is one, the
   twin glyph where the protocol was generated. */
function Avatar({ tw }) {
  return (
    <Box sx={{
      width: 46, height: 46, borderRadius: '14px', flexShrink: 0, overflow: 'hidden',
      bgcolor: tw ? tw.tone : C.deep, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,.85)',
    }}>
      {tw
        ? (tw.img
            ? <Box component="img" src={tw.img} alt=""
                   sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : tw.mono)
        : <TwinGlyph size={30} fill={0.9} />}
    </Box>
  );
}
