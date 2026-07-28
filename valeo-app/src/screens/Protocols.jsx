import { useState } from 'react';
import { Box, Button, Stack, Typography, Divider } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ScienceIcon from '@mui/icons-material/Science';
import LoopRing from '../components/LoopRing';
import ProtocolSheet from '../components/ProtocolSheet';
import { PROTOCOLS, PHASES, PHASE_NOTE, phaseOf, TWINS, matchFor } from '../data';
import { C } from '../theme';

/**
 * Protocols is the portfolio: the one thing running, and the things you kept.
 *
 * The gate on starting is deliberate and not a paywall — a protocol without a
 * baseline has nothing to be measured against at week 12, so starting one
 * would quietly break the only promise the product makes.
 */
export default function Protocols({ st, dispatch, onGo, onBlood }) {
  const [sheet, setSheet] = useState(null);
  const a = st.active;
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
              const running = a && a.protocol === tw.protocol;
              return (
                <Box key={tw.id} sx={{
                  borderRadius: '18px', bgcolor: '#fff', overflow: 'hidden',
                  boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
                }}>
                  <Stack direction="row" spacing={1.5} onClick={() => setSheet(tw)} sx={{
                    alignItems: 'center', p: 1.75, cursor: 'pointer',
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
                      <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>
                        {tw.name} · {matchFor(tw, st)}% · {p.wk} wk
                      </Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
                  </Stack>

                  <Divider />
                  {running ? (
                    <Box sx={{ px: 1.75, py: 1.4, bgcolor: 'rgba(39,153,91,.08)' }}>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C.green }}>
                        Running · day {a.day}
                      </Typography>
                    </Box>
                  ) : a ? (
                    <Box sx={{ px: 1.75, py: 1.4 }}>
                      <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
                        Queued — one loop at a time, so a verdict means something
                      </Typography>
                    </Box>
                  ) : st.blood ? (
                    <Button fullWidth onClick={() => dispatch({ type: 'start', protocol: tw.protocol })}
                            sx={{
                              minHeight: 0, py: 1.4, borderRadius: 0, fontSize: 13, fontWeight: 700,
                              color: C.deep, bgcolor: 'rgba(255,185,0,.16)',
                              '&:hover': { bgcolor: 'rgba(255,185,0,.26)' },
                            }}>
                      Start this protocol
                    </Button>
                  ) : (
                    <Button fullWidth startIcon={<ScienceIcon sx={{ fontSize: 16 }} />}
                            onClick={onBlood} sx={{
                              minHeight: 0, py: 1.4, borderRadius: 0, fontSize: 12.5, fontWeight: 700,
                              color: C.ink2, '&:hover': { bgcolor: 'rgba(27,57,91,.04)' },
                            }}>
                      Baseline needed to start
                    </Button>
                  )}
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      <ProtocolSheet twin={sheet} open={!!sheet} onClose={() => setSheet(null)} saved
                     onSave={() => setSheet(null)} />
    </Box>
  );
}
