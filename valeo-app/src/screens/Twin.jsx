import { useState } from 'react';
import { Box, Button, Stack, Typography, Collapse, Divider } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ScienceIcon from '@mui/icons-material/Science';
import BodyFigure from '../components/BodyFigure';
import TwinChat from '../components/TwinChat';
import SimSheet from '../components/SimSheet';
import PeersSheet from '../components/PeersSheet';
import PeakSheet from '../components/PeakSheet';
import {
  regionsState, systemsState, constraintOf, verdictOf, noticings, nextGap,
  twinPct, GRADE_C, SIGNALS, moveOf, PANELS, DANGERS, LADDER, PEERS,
} from '../data';
import { C } from '../theme';

/**
 * THE TWIN SCREEN
 *
 * Architecture: a stack of self-contained entries with the body as entry one.
 * Not a feed — a feed needs a model that notices, and until daily capture
 * actually moves the model a feed would be theatre. But the composition is a
 * stack of entries on purpose, so noticings can be inserted later without a
 * rewrite.
 *
 * Three rules govern every decision below.
 *   1. The body is the noun; the layers are verbs applied to it.
 *   2. Never a finding without its move. A grade with no action is anxiety.
 *   3. Confidence travels with every claim — because identical blood produced
 *      biological ages of 37.3 and 45.2 at two competitors, and an unqualified
 *      number in this category is a liability.
 *
 * Above the fold answers the only three questions anyone actually arrives
 * with: am I okay, what's the one thing to do, can I trust this. Reference,
 * Trajectory and Simulation are more exciting and none of them is why anyone
 * opens this screen, so none of them is above the fold.
 */
export default function Twin({ st, onGo, onBlood, onQuestions }) {
  const [sel, setSel] = useState(null);          /* selected zone */
  const [openSys, setOpenSys] = useState(null);  /* expanded system row */
  const [showAll, setShowAll] = useState(false);
  const [chat, setChat] = useState(false);
  const [sim, setSim] = useState(false);
  const [lens, setLens] = useState('now');       /* now | time */
  const [peers, setPeers] = useState(false);
  const [peak, setPeak] = useState(false);
  const [dangersOpen, setDangersOpen] = useState(false);

  const zones = regionsState(st);
  const { rows, known, total } = systemsState(st);
  const pct = twinPct(st);
  const verdict = verdictOf(st);
  const constraint = constraintOf(st);
  const notes = noticings(st);
  const gap = nextGap(st);

  const zone = zones.find((z) => z.k === sel);
  /* selecting a zone filters the list — one selection, two surfaces */
  const listed = zone ? zone.inside : rows;
  const visible = showAll || zone ? listed : listed.slice(0, 3);

  const improve = () => {
    if (!gap) return onGo('today');
    return gap.k === 'blood' ? onBlood() : onQuestions();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── header · chat is the only persistent affordance ── */}
      <Stack direction="row" spacing={1.5} sx={{
        alignItems: 'center', px: 2.25, pt: 2, pb: 1, flexShrink: 0,
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontSize: 9, fontWeight: 800, letterSpacing: '.18em',
            textTransform: 'uppercase', color: C.ink2,
          }}>Your twin</Typography>
          {/* confidence framed as a debt we owe, never a hedge on our answer */}
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.4 }}>
            <Box sx={{
              width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
              bgcolor: pct >= 60 ? C.green : pct >= 30 ? C.yellow : C.ink2,
            }} />
            <Typography sx={{ fontSize: 12.5, color: C.ink2 }}>
              Knows <b style={{ color: C.deep }}>{pct}%</b> of you
            </Typography>
          </Stack>
        </Box>
        <Box onClick={() => setChat(true)} sx={{
          width: 42, height: 42, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(150deg,${C.deep},#12283F)`, color: C.yellow,
          boxShadow: '0 6px 16px -6px rgba(27,57,91,.45)',
        }}><ChatBubbleOutlineIcon sx={{ fontSize: 19 }} /></Box>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
        {/* ═══ ENTRY 1 · THE BODY ═══ */}
        <Box sx={{
          borderRadius: '26px', pt: 1.5, pb: 1.25, position: 'relative',
          background: `linear-gradient(168deg,#1E3F63,${C.night})`,
        }}>
          <BodyFigure zones={zones} sel={sel} onSel={setSel} height={300}
                      focus={constraint ? constraint.region : null} />

          {/* lens · two, not three. Comparison needs a cohort we don't have. */}
          <Stack direction="row" spacing={0.5} sx={{
            justifyContent: 'center', mt: 0.5,
          }}>
            {[['now', 'Now'], ['time', 'Over time']].map(([k, t]) => (
              <Box key={k} onClick={() => setLens(k)} sx={{
                px: 1.75, py: 0.8, borderRadius: '10px', cursor: 'pointer',
                fontSize: 11.5, fontWeight: lens === k ? 700 : 500,
                bgcolor: lens === k ? 'rgba(255,255,255,.14)' : 'transparent',
                color: lens === k ? '#fff' : 'rgba(255,255,255,.5)',
              }}>{t}</Box>
            ))}
          </Stack>

          {lens === 'time' && (
            <Box sx={{ px: 2, pt: 1.25, pb: 0.5 }}>
              <Typography sx={{
                fontSize: 11, color: 'rgba(255,255,255,.55)', textAlign: 'center', mb: 1.25,
              }}>{PANELS[0].date} → {PANELS[1].date}</Typography>
              <Stack spacing={0.6}>
                {rows.filter((r) => moveOf(r.k)).slice(0, 4).map((r) => {
                  const mv = moveOf(r.k);
                  const up = mv.to > mv.from;
                  const good = (mv.better === 'up') === up;
                  return (
                    <Stack key={r.k} direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                      <Typography sx={{
                        flex: 1, fontSize: 11.5, color: 'rgba(255,255,255,.7)',
                      }}>{r.t}</Typography>
                      <Typography sx={{
                        fontSize: 11.5, color: 'rgba(255,255,255,.45)',
                      }}>{mv.from}{mv.unit}</Typography>
                      <Typography sx={{
                        fontSize: 11.5, color: 'rgba(255,255,255,.35)',
                      }}>→</Typography>
                      <Typography sx={{
                        fontSize: 12, fontWeight: 800,
                        color: good ? '#6FD69B' : C.coral,
                      }}>{mv.to}{mv.unit}</Typography>
                      {mv.was !== mv.now && (
                        <Box sx={{
                          px: 0.6, borderRadius: '4px', fontSize: 9, fontWeight: 800,
                          bgcolor: 'rgba(111,214,155,.2)', color: '#6FD69B',
                        }}>{mv.was}→{mv.now}</Box>
                      )}
                    </Stack>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Box>

        {/* ═══ ENTRY 2 · THE VERDICT — one sentence ═══ */}
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 25, fontWeight: 600,
          color: C.deep, lineHeight: 1.15, mt: 2.5,
        }}>{verdict}</Typography>

        {/* ═══ ENTRY 3 · THE CONSTRAINT + THE MOVE, fused ═══ */}
        {constraint && (
          <Box sx={{
            mt: 1.75, borderRadius: '20px', bgcolor: '#fff', overflow: 'hidden',
            boxShadow: '0 2px 14px -6px rgba(27,57,91,.32)',
            borderLeft: `3px solid ${constraint.grade ? GRADE_C[constraint.grade] : C.ink2}`,
          }}>
            <Box sx={{ px: 1.9, pt: 1.75, pb: 1.5 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                <Typography sx={{
                  flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
                  textTransform: 'uppercase', color: C.ink2,
                }}>Biggest lever</Typography>
                {constraint.src && (
                  <Typography sx={{ fontSize: 10, color: C.ink2 }}>{constraint.src}</Typography>
                )}
              </Stack>
              <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.deep, mt: 0.75 }}>
                {constraint.ref || `${constraint.t} · ${constraint.said}`}
              </Typography>
              <Typography sx={{ fontSize: 13, color: C.ink2, mt: 0.6, lineHeight: 1.5 }}>
                {constraint.why}
              </Typography>
            </Box>
            <Divider />
            <Stack direction="row" spacing={1.25} onClick={improve} sx={{
              alignItems: 'center', px: 1.9, py: 1.5, cursor: 'pointer',
              bgcolor: 'rgba(255,185,0,.12)',
            }}>
              <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: C.deep }}>
                {constraint.move}
              </Typography>
              <ChevronRightIcon sx={{ fontSize: 19, color: C.yellowDeep, flexShrink: 0 }} />
            </Stack>
          </Box>
        )}

        {/* ═══ ENTRY 4 · SYSTEMS ═══ */}
        <Stack direction="row" sx={{ alignItems: 'baseline', mt: 3, mb: 1.25 }}>
          <Typography sx={{
            flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase', color: C.ink2,
          }}>{zone ? zone.t : 'Systems'}</Typography>
          {zone ? (
            <Typography onClick={() => setSel(null)} sx={{
              fontSize: 11, fontWeight: 700, color: C.teal, cursor: 'pointer',
            }}>Show all</Typography>
          ) : (
            <Typography sx={{ fontSize: 11, color: C.ink2 }}>{known} of {total} known</Typography>
          )}
        </Stack>

        <Stack spacing={0.75}>
          {visible.map((r) => {
            const open = openSys === r.k;
            const isKnown = !!(r.grade || r.said);
            return (
              <Box key={r.k} sx={{
                borderRadius: '16px', overflow: 'hidden',
                bgcolor: isKnown ? '#fff' : 'rgba(27,57,91,.03)',
                boxShadow: isKnown ? '0 2px 10px -6px rgba(27,57,91,.24)' : 'none',
                border: `1.5px solid ${open ? C.deep : 'transparent'}`,
              }}>
                <Stack direction="row" spacing={1.5} onClick={() => setOpenSys(open ? null : r.k)}
                       sx={{ alignItems: 'center', px: 1.75, py: 1.4, cursor: 'pointer' }}>
                  {/* two visual languages: a grade is a lab value, never a self-report */}
                  {r.grade ? (
                    <Box sx={{
                      width: 26, height: 26, borderRadius: '8px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: GRADE_C[r.grade], color: '#fff', fontSize: 12.5, fontWeight: 800,
                    }}>{r.grade}</Box>
                  ) : r.said ? (
                    <Box sx={{
                      width: 26, height: 26, borderRadius: '8px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: 'rgba(64,143,164,.14)', color: C.teal,
                      fontSize: 13, fontWeight: 700,
                    }}>”</Box>
                  ) : (
                    <Box sx={{
                      width: 26, height: 26, borderRadius: '8px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: 'rgba(27,57,91,.06)', color: C.ink2,
                    }}><LockOutlinedIcon sx={{ fontSize: 13 }} /></Box>
                  )}

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                      fontSize: 13.5, fontWeight: isKnown ? 600 : 500,
                      color: isKnown ? C.deep : C.ink2,
                    }}>{r.t}</Typography>
                    {r.said && (
                      <Typography sx={{ fontSize: 11, color: C.teal, mt: 0.15 }}>
                        You said: {r.said}
                      </Typography>
                    )}
                  </Box>

                  {!isKnown && (
                    <Typography sx={{ fontSize: 10.5, fontWeight: 700, color: C.ink2 }}>
                      Not measured
                    </Typography>
                  )}
                </Stack>

                {/* CAUSE lives inline, attached to its effect. A separate screen
                    would sever the link that makes it worth reading. */}
                <Collapse in={open}>
                  <Divider />
                  <Box sx={{ px: 1.75, py: 1.5 }}>
                    <Typography sx={{ fontSize: 12.5, color: C.ink, lineHeight: 1.5 }}>
                      {isKnown ? r.why : `Needs ${r.missing.map(
                        (m) => (SIGNALS.find((x) => x.k === m) || {}).t || m
                      ).join(' and ').toLowerCase()}.`}
                    </Typography>
                    {r.src && (
                      <Typography sx={{ fontSize: 10.5, color: C.ink2, mt: 0.75 }}>
                        Source · {r.src}
                      </Typography>
                    )}
                    {/* never a finding without a move */}
                    {(r.move || !isKnown) && (
                      <Stack direction="row" spacing={1} onClick={improve} sx={{
                        alignItems: 'center', mt: 1.25, px: 1.4, py: 1.1, borderRadius: '12px',
                        cursor: 'pointer', bgcolor: 'rgba(255,185,0,.12)',
                      }}>
                        <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: C.deep }}>
                          {r.move || 'Fill this in'}
                        </Typography>
                        <ChevronRightIcon sx={{ fontSize: 17, color: C.yellowDeep }} />
                      </Stack>
                    )}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Stack>

        {!zone && listed.length > 3 && (
          <Typography onClick={() => setShowAll(!showAll)} sx={{
            fontSize: 12.5, fontWeight: 700, color: C.teal, cursor: 'pointer',
            textAlign: 'center', pt: 1.75,
          }}>{showAll ? 'Show fewer' : `See all ${listed.length}`}</Typography>
        )}

        {/* ═══ ENTRY 5 · WHAT THE TWIN NOTICED — the feed seed ═══ */}
        {notes.length > 0 && (
          <>
            <Typography sx={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
              color: C.ink2, mt: 3, mb: 1.25,
            }}>Noticed</Typography>
            <Stack spacing={0.9}>
              {notes.map((n) => (
                <Stack key={n.k} direction="row" spacing={1.5} sx={{
                  alignItems: 'flex-start', px: 1.9, py: 1.5, borderRadius: '16px',
                  bgcolor: 'rgba(64,143,164,.08)', border: '1px solid rgba(64,143,164,.22)',
                }}>
                  <Box sx={{ fontSize: 13, flexShrink: 0, mt: '2px', color: C.teal }}>◈</Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep }}>{n.t}</Typography>
                    <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.25, lineHeight: 1.45 }}>
                      {n.s}
                    </Typography>
                  </Box>
                </Stack>
              ))}
            </Stack>
          </>
        )}

        {/* ═══ ENTRY 6 · SIMULATION ═══ */}
        <Box onClick={() => setSim(true)} sx={{
          mt: 3, px: 1.9, py: 1.9, borderRadius: '20px', cursor: 'pointer',
          background: `linear-gradient(150deg,${C.deep},#12283F)`, color: '#fff',
        }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <ScienceIcon sx={{ fontSize: 22, color: C.yellow, flexShrink: 0 }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 700 }}>
                Test something on your twin
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,.62)', mt: 0.25 }}>
                A reel, a supplement, a stack a friend sent
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ fontSize: 19, color: 'rgba(255,255,255,.5)', flexShrink: 0 }} />
          </Stack>
        </Box>

        {/* ═══ ENTRY 7 · LEVERS — the ranked list, not three cards ═══
            Dangers are negative-leverage entries on the same list, which is why
            they live here rather than in a section of their own. */}
        <Typography sx={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
          color: C.ink2, mt: 3, mb: 1.25,
        }}>Your levers, in order</Typography>
        <Stack spacing={0.75}>
          {rows.filter((r) => (r.grade || r.said) && r.move).slice(0, 4).map((r, i) => (
            <Stack key={r.k} direction="row" spacing={1.5} onClick={improve} sx={{
              alignItems: 'center', px: 1.75, py: 1.4, borderRadius: '15px', cursor: 'pointer',
              bgcolor: '#fff', boxShadow: '0 2px 10px -6px rgba(27,57,91,.24)',
            }}>
              <Box sx={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: i === 0 ? C.yellow : 'rgba(27,57,91,.07)',
                color: i === 0 ? C.deep : C.ink2, fontSize: 11, fontWeight: 800,
              }}>{i + 1}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.deep }}>{r.move}</Typography>
                <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.15 }}>{r.t}</Typography>
              </Box>
              <ChevronRightIcon sx={{ fontSize: 17, color: C.ink2, flexShrink: 0 }} />
            </Stack>
          ))}
        </Stack>

        {/* ═══ ENTRY 8 · DANGERS — conditional rules, not warnings ═══ */}
        <Stack direction="row" sx={{ alignItems: 'baseline', mt: 3, mb: 1.25 }}>
          <Typography sx={{
            flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase', color: C.ink2,
          }}>What we watch for you</Typography>
          <Typography onClick={() => setDangersOpen(!dangersOpen)} sx={{
            fontSize: 11, fontWeight: 700, color: C.teal, cursor: 'pointer',
          }}>{dangersOpen ? 'Fewer' : `All ${DANGERS.length}`}</Typography>
        </Stack>
        <Stack spacing={0.75}>
          {DANGERS.slice(0, dangersOpen ? DANGERS.length : 2).map((d) => (
            <Box key={d.k} sx={{
              px: 1.75, py: 1.5, borderRadius: '15px',
              bgcolor: d.armed ? 'rgba(233,79,95,.05)' : 'rgba(27,57,91,.03)',
              border: `1px solid ${d.armed ? 'rgba(233,79,95,.22)' : 'rgba(27,57,91,.09)'}`,
            }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{
                  width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
                  bgcolor: d.armed ? C.coral : C.ink2,
                }} />
                <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: C.deep }}>
                  If {d.t.charAt(0).toLowerCase() + d.t.slice(1)}
                </Typography>
                {!d.armed && (
                  <Typography sx={{ fontSize: 9.5, fontWeight: 800, color: C.ink2 }}>
                    NOT ARMED
                  </Typography>
                )}
              </Stack>
              <Typography sx={{ fontSize: 12, color: C.ink, mt: 0.6, lineHeight: 1.45 }}>
                → {d.act}
              </Typography>
              <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.5, lineHeight: 1.45 }}>
                {d.why}
              </Typography>
            </Box>
          ))}
        </Stack>

        {/* ═══ ENTRY 9 · REFERENCE + TRAJECTORY — one row each ═══ */}
        <Stack spacing={0.75} sx={{ mt: 3 }}>
          <Stack direction="row" spacing={1.5} onClick={() => setPeers(true)} sx={{
            alignItems: 'center', px: 1.9, py: 1.6, borderRadius: '16px', cursor: 'pointer',
            bgcolor: '#fff', boxShadow: '0 2px 10px -6px rgba(27,57,91,.26)',
          }}>
            <Box component="img" src={PEERS[0].img} alt="" sx={{
              width: 34, height: 34, borderRadius: '11px', objectFit: 'cover', flexShrink: 0,
            }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
                Closest twins
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.15 }}>
                {PEERS[0].name.split(' ')[1]} is {PEERS[0].apart} systems away
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
          </Stack>

          <Stack direction="row" spacing={1.5} onClick={() => setPeak(true)} sx={{
            alignItems: 'center', px: 1.9, py: 1.6, borderRadius: '16px', cursor: 'pointer',
            bgcolor: '#fff', boxShadow: '0 2px 10px -6px rgba(27,57,91,.26)',
          }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '11px', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(64,143,164,.14)', color: C.teal, fontSize: 15,
            }}>▲</Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
                Distance to peak
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.15 }}>
                Biggest gap is {LADDER.slice().sort((a, b) => (a.peak - a.you) < (b.peak - b.you) ? 1 : -1)[0].sys.toLowerCase()}
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
          </Stack>
        </Stack>

        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2.5, lineHeight: 1.55 }}>
          We grade what we measured, quote what you told us, and leave the rest blank. A guess
          dressed as a grade is worse than an empty row.
        </Typography>
      </Box>

      <TwinChat open={chat} onClose={() => setChat(false)} />
      <SimSheet open={sim} onClose={() => setSim(false)} />
      <PeersSheet open={peers} onClose={() => setPeers(false)} />
      <PeakSheet open={peak} onClose={() => setPeak(false)} />
    </Box>
  );
}
