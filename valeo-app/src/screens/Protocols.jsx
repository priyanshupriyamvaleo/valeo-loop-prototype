import { Box, Button, Stack, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LoopRing from '../components/LoopRing';
import { PROTOCOLS, PHASES, phaseOf, TWINS, matchFor, RX_LABEL } from '../data';
import { C } from '../theme';

/**
 * Protocols is the portfolio: the one thing running, and the things you kept.
 *
 * The gate on starting is deliberate and not a paywall — a protocol without a
 * baseline has nothing to be measured against at week 12, so starting one
 * would quietly break the only promise the product makes.
 */
export default function Protocols({ st, onGo, onDetail }) {
  const rx = st.rx;
  const a = rx && ['running', 'verdict'].includes(rx.status) ? rx : null;
  const savedTwins = TWINS.filter((t) => st.saved.includes(t.protocol));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2.25, pt: 2.5, pb: 2 }}>
        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.ink2,
        }}>Protocols</Typography>
        <Typography variant="h2" sx={{ color: C.deep, mt: 0.75 }}>
          {a ? 'One running.' : savedTwins.length ? 'Nothing running yet.' : 'Nothing here yet.'}
        </Typography>
      </Box>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
        {/* ── the loop, as the hero ── */}
        {a && (() => {
          const p = PROTOCOLS[a.protocol];
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

              <Box sx={{
                mt: 2, pt: 1.75, borderTop: '1px solid rgba(255,255,255,.13)',
                display: 'flex', alignItems: 'center', gap: 1.25,
              }}>
                <Typography sx={{ fontSize: 12, color: 'rgba(255,255,255,.75)', flex: 1 }}>
                  Verdict on {p.mk} at day {a.total}
                </Typography>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C.yellow }}>
                  {a.total - a.day} days
                </Typography>
              </Box>
            </Box>
          );
        })()}

        {/* ── saved ── */}
        <Typography sx={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
          color: C.ink2, mt: a ? 3 : 0, mb: 1.25,
        }}>
          {savedTwins.length ? `Saved · ${savedTwins.length}` : 'Saved'}
        </Typography>

        {savedTwins.length === 0 ? (
          <Box sx={{
            textAlign: 'center', px: 3, py: 4, borderRadius: '20px', bgcolor: '#fff',
            boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
          }}>
            <Typography sx={{ fontSize: 13.5, color: C.ink2, lineHeight: 1.55 }}>
              Every twin you keep lands here with their protocol.
            </Typography>
            <Button variant="contained" color="secondary" sx={{ mt: 2.25 }}
                    onClick={() => onGo('discover')}>
              Go to Discover
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.1}>
            {savedTwins.map((tw) => {
              const p = PROTOCOLS[tw.protocol];
              const status = rx && rx.protocol === tw.protocol ? rx.status : 'saved';
              const L = RX_LABEL[status];
              return (
                <Stack key={tw.id} direction="row" spacing={1.5} onClick={() => onDetail(tw.protocol)}
                       sx={{
                  alignItems: 'center', p: 1.75, borderRadius: '18px', bgcolor: '#fff',
                  cursor: 'pointer', boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
                }}>
                  <Box sx={{
                    width: 46, height: 46, borderRadius: '14px', flexShrink: 0, overflow: 'hidden',
                    bgcolor: tw.tone, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 15, fontWeight: 800,
                    color: 'rgba(255,255,255,.85)',
                  }}>
                    {tw.img
                      ? <Box component="img" src={tw.img} alt=""
                             sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : tw.mono}
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
                        · {matchFor(tw, st)}% · {p.wk} wk
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
