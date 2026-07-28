import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LoopRing from '../components/LoopRing';
import CoachSheet from '../components/CoachSheet';
import { PROTOCOLS, PHASE_NOTE, phaseOf } from '../data';
import { C } from '../theme';

/**
 * Today has exactly one job: what do I do in the next few hours.
 *
 * With nothing running it must not invent work — it says so and points at the
 * single next step. Padding an empty state with tips is how a health app
 * teaches people to ignore it.
 */
export default function Today({ st, dispatch, onGo }) {
  const [coach, setCoach] = useState(false);
  const a = st.active;

  if (!a) {
    return (
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Head sub="Tuesday 28 July" title="Nothing to run yet." />
        <Box sx={{ flex: '1 1 auto', px: 2.25, display: 'flex', flexDirection: 'column',
                   justifyContent: 'center' }}>
          <Stack spacing={1.25}>
            <Next n="1" t="Save a protocol" s="Swipe the deck in Discover"
                  done={st.saved.length > 0} onClick={() => onGo('discover')} />
            <Next n="2" t="Book your baseline" s="One draw at home"
                  done={st.blood} onClick={() => onGo('twin')} />
            <Next n="3" t="Start it" s="From Protocols, once both are done"
                  done={false} onClick={() => onGo('protocols')} />
          </Stack>
        </Box>
        <CoachCard onClick={() => setCoach(true)} />
        <CoachSheet open={coach} onClose={() => setCoach(false)} />
      </Box>
    );
  }

  const p = PROTOCOLS[a.protocol];
  const phase = phaseOf(a);
  const doneCount = a.items.filter((_, i) => st.done.includes(i)).length;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Head sub="Tuesday 28 July" title={`${doneCount} of ${a.items.length} done.`} />

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 1 }}>
        {/* where you are in the loop, not a motivational banner */}
        <Stack direction="row" spacing={2} sx={{
          alignItems: 'center', p: 2, borderRadius: '20px', bgcolor: '#fff',
          boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
        }}>
          <LoopRing size={86} phase={phase} fill={a.day / a.total}
                    label={a.day} sub={`of ${a.total}`} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: '.16em',
              textTransform: 'uppercase', color: C.yellow,
            }}>◈ {phase}</Typography>
            <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.deep, mt: 0.5 }}>
              {p.t}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.4 }}>
              {PHASE_NOTE[phase]} · {a.adherence}% adherence
            </Typography>
          </Box>
        </Stack>

        <Label sx={{ mt: 3 }}>Today</Label>
        <Stack spacing={1}>
          {a.items.map((t, i) => {
            const on = st.done.includes(i);
            return (
              <Stack key={t} direction="row" spacing={1.5}
                     onClick={() => dispatch({ type: 'toggleDone', i })} sx={{
                alignItems: 'center', px: 1.9, py: 1.7, borderRadius: '16px', cursor: 'pointer',
                bgcolor: on ? 'rgba(39,153,91,.08)' : '#fff',
                border: `1.5px solid ${on ? 'rgba(39,153,91,.35)' : 'transparent'}`,
                boxShadow: on ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
              }}>
                <Box sx={{
                  width: 23, height: 23, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: on ? C.green : 'transparent',
                  border: on ? 'none' : `1.5px solid rgba(27,57,91,.25)`,
                }}>
                  {on && <CheckIcon sx={{ fontSize: 14, color: '#fff' }} />}
                </Box>
                <Typography sx={{
                  flex: 1, fontSize: 13.5, lineHeight: 1.4,
                  color: on ? C.ink2 : C.ink,
                  textDecoration: on ? 'line-through' : 'none',
                }}>{t}</Typography>
              </Stack>
            );
          })}
        </Stack>

        <Label sx={{ mt: 3 }}>Next milestone</Label>
        <Stack direction="row" spacing={1.5} sx={{
          alignItems: 'center', px: 1.9, py: 1.8, borderRadius: '16px',
          bgcolor: 'rgba(255,185,0,.10)', border: `1px solid rgba(255,185,0,.4)`,
        }}>
          <Box sx={{ fontSize: 18 }}>🧪</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep }}>
              Retest {p.mk}
            </Typography>
            <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>
              Day {a.total} · {a.total - a.day} days away
            </Typography>
          </Box>
        </Stack>
      </Box>

      <CoachCard onClick={() => setCoach(true)} />
      <CoachSheet open={coach} onClose={() => setCoach(false)} />
    </Box>
  );
}

function Head({ sub, title }) {
  return (
    <Box sx={{ px: 2.25, pt: 2.5, pb: 2 }}>
      <Typography sx={{
        fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
        textTransform: 'uppercase', color: C.ink2,
      }}>{sub}</Typography>
      <Typography variant="h2" sx={{ color: C.deep, mt: 0.75 }}>{title}</Typography>
    </Box>
  );
}

function Label({ children, sx }) {
  return (
    <Typography sx={{
      fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
      color: C.ink2, mb: 1.25, ...sx,
    }}>{children}</Typography>
  );
}

function Next({ n, t, s, done, onClick }) {
  return (
    <Stack direction="row" spacing={1.75} onClick={onClick} sx={{
      alignItems: 'center', px: 1.9, py: 1.9, borderRadius: '17px', cursor: 'pointer',
      bgcolor: done ? 'rgba(39,153,91,.08)' : '#fff',
      boxShadow: done ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
    }}>
      <Box sx={{
        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, fontSize: 12, fontWeight: 800,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: done ? C.green : 'rgba(27,57,91,.08)', color: done ? '#fff' : C.ink2,
      }}>{done ? <CheckIcon sx={{ fontSize: 15 }} /> : n}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>{t}</Typography>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>{s}</Typography>
      </Box>
      <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
    </Stack>
  );
}

function CoachCard({ onClick }) {
  return (
    <Box sx={{ px: 2.25, pb: 1.5, pt: 1.5, flexShrink: 0 }}>
      <Stack direction="row" spacing={1.5} onClick={onClick} sx={{
        alignItems: 'center', px: 1.9, py: 1.6, borderRadius: '17px', cursor: 'pointer',
        background: `linear-gradient(150deg,${C.deep},#12283F)`, color: '#fff',
      }}>
        <Box sx={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0, fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'rgba(255,255,255,.12)', color: C.yellow,
        }}>◎</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>Ask your coach</Typography>
          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,.6)', mt: 0.2 }}>
            Escalates to Dr. Mahmoud when it matters
          </Typography>
        </Box>
        <ChevronRightIcon sx={{ fontSize: 19, color: 'rgba(255,255,255,.5)', flexShrink: 0 }} />
      </Stack>
    </Box>
  );
}
