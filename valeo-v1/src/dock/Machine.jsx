import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { STATES, TRANSITIONS, ACTORS, episodesOf, canFire, stateOf } from '../machine';
import { USER } from '../data';
import { C } from '../theme';

/*
 * THE MACHINE, VISIBLE — the state graph, the levers, the ticker.
 *
 * ── MANUAL, BUT NEVER INCONSISTENT ──
 * Every lever is a real transition from machine.js. A lever is enabled only
 * when its guard passes for the selected episode; disabled levers stay
 * visible with the unmet condition in plain words. There is no way to fire
 * an event the machine would refuse, from this panel or anywhere else.
 *
 * ── WHAT SIM MEANS ──
 * A SIM tag marks the transitions that pseudofy the real world (money,
 * blood, video, parcels). The state change they cause is real and shared:
 * fire one and the phone, the clinic queues and this graph all move,
 * because there is only one store for them to move in.
 */

const LANE_STYLE = {
  trunk: { t: 'Shared trunk' },
  known: { t: 'Known solution' },
  resolve: { t: 'Need diagnosis' },
  merged: { t: 'The shared room' },
  post: { t: 'Closing the loop' },
};

/* The graph's reading order, per lane. */
const ORDER = {
  trunk: ['NEW', 'INTAKE'],
  known: ['K1_SAFETY', 'K2_PLAN', 'K4_REVIEW', 'K4A_CALL'],
  resolve: ['D1_AI', 'D2_CONSULT', 'D3_RECOMMENDED', 'D4_PAYMENT', 'D5_LABS', 'D6_REVIEW'],
  merged: ['M1_FULFILMENT', 'M2_TREATMENT'],
  post: ['P1_RETEST', 'P2_RESULTS', 'P3_PROOF', 'P4_LOOP'],
};

/* Which states are behind the current one, for the "done" fill. */
const SEQ = {
  known: ['NEW', 'INTAKE', 'K1_SAFETY', 'K2_PLAN', 'K4_REVIEW', 'K4A_CALL',
          'M1_FULFILMENT', 'M2_TREATMENT', 'P1_RETEST', 'P2_RESULTS', 'P3_PROOF', 'P4_LOOP'],
  resolve: ['NEW', 'INTAKE', 'D1_AI', 'D2_CONSULT', 'D3_RECOMMENDED', 'D4_PAYMENT',
            'D5_LABS', 'D6_REVIEW', 'M1_FULFILMENT', 'M2_TREATMENT',
            'P1_RETEST', 'P2_RESULTS', 'P3_PROOF', 'P4_LOOP'],
};

export default function Machine({ st, ui, fireEvent }) {
  const eps = episodesOf(st, ui);
  const [selId, setSelId] = useState(null);
  const [showState, setShowState] = useState(null);
  const sel = eps.find((e) => e.id === selId) || eps[0] || null;

  const seq = sel ? SEQ[sel.intent === 'known' ? 'known' : 'resolve'] : [];
  const at = sel ? seq.indexOf(sel.state) : -1;
  const pos = (id) => seq.indexOf(id);
  const mark = (id) => {
    if (!sel) return 'future';
    if (id === sel.state) return 'now';
    const p = pos(id);
    if (p === -1) return 'off';               /* the untaken lane */
    if (p < at) {
      /* K4A is optional: only "done" if it was actually visited */
      if (id === 'K4A_CALL' && !(sel.run && sel.run.checkpointWasCall)) return 'skip';
      return 'done';
    }
    return 'future';
  };

  const log = (st.log || []).slice().reverse();

  return (
    <Box sx={{ color: '#E8EEF5' }}>
      {/* which episode the graph follows */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 1.75 }}>
        {eps.length === 0 && (
          <Typography sx={{ fontSize: 12, color: '#5D7793' }}>
            No episode yet. Fire EPISODE_CREATED below.
          </Typography>
        )}
        {eps.map((e) => (
          <Box key={e.id} onClick={() => setSelId(e.id)} sx={{
            px: 1.1, py: 0.55, borderRadius: '999px', cursor: 'pointer',
            fontSize: 10.5, fontWeight: sel && sel.id === e.id ? 700 : 500,
            bgcolor: sel && sel.id === e.id ? C.yellow : 'rgba(255,255,255,.07)',
            color: sel && sel.id === e.id ? C.deep : '#C7D6E6',
          }}>{USER.first} · {e.goal}</Box>
        ))}
      </Box>

      {/* ── the graph ── */}
      <Box sx={{
        p: 1.5, borderRadius: '14px', bgcolor: 'rgba(255,255,255,.04)',
        border: '1px solid rgba(255,255,255,.07)',
      }}>
        <Lane label={LANE_STYLE.trunk.t}>
          <Row>
            {ORDER.trunk.map((id, i) => (
              <Node key={id} id={id} mark={mark(id)} last={i === ORDER.trunk.length - 1}
                onInfo={() => setShowState(showState === id ? null : id)} />
            ))}
          </Row>
        </Lane>

        {/* the fork: two lanes side by side */}
        <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'flex-start' }}>
          <Lane label={LANE_STYLE.known.t} half
            dim={sel && sel.intent === 'resolve'}>
            <Col>
              {ORDER.known.map((id, i) => (
                <Node key={id} id={id} mark={mark(id)} down last={i === ORDER.known.length - 1}
                  onInfo={() => setShowState(showState === id ? null : id)} />
              ))}
            </Col>
          </Lane>
          <Lane label={LANE_STYLE.resolve.t} half
            dim={sel && sel.intent === 'known' && !sel.escalated}>
            <Col>
              {ORDER.resolve.map((id, i) => (
                <Node key={id} id={id} mark={mark(id)} down last={i === ORDER.resolve.length - 1}
                  onInfo={() => setShowState(showState === id ? null : id)} />
              ))}
            </Col>
          </Lane>
        </Stack>

        <Lane label={LANE_STYLE.merged.t} sx={{ mt: 1 }}>
          <Row>
            {ORDER.merged.map((id, i) => (
              <Node key={id} id={id} mark={mark(id)} last={i === ORDER.merged.length - 1}
                onInfo={() => setShowState(showState === id ? null : id)} />
            ))}
          </Row>
        </Lane>

        <Lane label={LANE_STYLE.post.t} sx={{ mt: 1 }}>
          <Row>
            {ORDER.post.map((id, i) => (
              <Node key={id} id={id} mark={mark(id)} last={i === ORDER.post.length - 1}
                onInfo={() => setShowState(showState === id ? null : id)} />
            ))}
          </Row>
          {/* the loop never ends; it hands over */}
          <Typography sx={{ fontSize: 9.5, color: '#5D7793', mt: 0.75 }}>
            ↻ P4 seeds Episode N+1 at NEW, with a held date.
          </Typography>
        </Lane>
      </Box>

      {/* entry/exit conditions for a tapped state */}
      {showState && stateOf(showState) && (
        <Box sx={{
          mt: 1, px: 1.5, py: 1.25, borderRadius: '12px',
          bgcolor: 'rgba(255,185,0,.08)', border: '1px solid rgba(255,185,0,.25)',
        }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: C.yellow }}>
            {stateOf(showState).t}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: '#C7D6E6', mt: 0.4, lineHeight: 1.5 }}>
            <b>Entry:</b> {stateOf(showState).enter}
          </Typography>
          <Typography sx={{ fontSize: 10.5, color: '#C7D6E6', mt: 0.3, lineHeight: 1.5 }}>
            <b>Exit:</b> {stateOf(showState).exit}
          </Typography>
        </Box>
      )}

      {/* ── the levers, grouped by actor ── */}
      <Typography sx={{
        fontSize: 9.5, fontWeight: 800, letterSpacing: '.16em',
        textTransform: 'uppercase', color: '#5D7793', mt: 2, mb: 1,
      }}>Events</Typography>
      <Stack spacing={0.5}>
        {TRANSITIONS.map((t) => {
          const ok = canFire(t, st, ui, sel);
          const a = ACTORS[t.actor];
          return (
            <Box key={t.event} sx={{
              px: 1.25, py: 0.8, borderRadius: '10px',
              bgcolor: ok ? 'rgba(255,255,255,.07)' : 'rgba(255,255,255,.025)',
              border: `1px solid ${ok ? 'rgba(255,185,0,.4)' : 'rgba(255,255,255,.05)'}`,
            }}>
              <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center' }}>
                <Box sx={{
                  px: 0.6, py: 0.15, borderRadius: '4px', flexShrink: 0,
                  fontSize: 8, fontWeight: 800, letterSpacing: '.05em', textTransform: 'uppercase',
                  bgcolor: `${a.tone}33`, color: a.tone,
                }}>{a.t}</Box>
                <Typography sx={{
                  flex: 1, minWidth: 0, fontSize: 11, fontWeight: 700,
                  color: ok ? '#fff' : '#5D7793',
                }}>{t.event}{t.sim && (
                  <Box component="span" sx={{
                    ml: 0.6, px: 0.5, borderRadius: '3px', fontSize: 7.5, fontWeight: 800,
                    bgcolor: 'rgba(255,255,255,.1)', color: '#93A9C2', verticalAlign: 'middle',
                  }}>SIM</Box>
                )}</Typography>
                <Box onClick={() => ok && fireEvent(t.event, sel)} sx={{
                  px: 1.1, py: 0.45, borderRadius: '7px', flexShrink: 0,
                  fontSize: 10, fontWeight: 800, textAlign: 'center',
                  cursor: ok ? 'pointer' : 'default',
                  bgcolor: ok ? C.yellow : 'rgba(255,255,255,.05)',
                  color: ok ? C.deep : '#44586E',
                  '&:active': ok ? { opacity: 0.85 } : {},
                }}>Fire</Box>
              </Stack>
              {!ok && (
                <Typography sx={{ fontSize: 9.5, color: '#44586E', mt: 0.4, ml: 0.2 }}>
                  {t.reason}
                </Typography>
              )}
              {ok && (
                <Typography sx={{ fontSize: 9.5, color: '#93A9C2', mt: 0.4, ml: 0.2 }}>
                  writes: {t.writes}
                </Typography>
              )}
            </Box>
          );
        })}
      </Stack>

      {/* ── the ticker: state is a fold over these ── */}
      <Typography sx={{
        fontSize: 9.5, fontWeight: 800, letterSpacing: '.16em',
        textTransform: 'uppercase', color: '#5D7793', mt: 2, mb: 1,
      }}>Event log</Typography>
      {log.length === 0 ? (
        <Typography sx={{ fontSize: 11, color: '#44586E' }}>
          Nothing yet. State is a fold over this list.
        </Typography>
      ) : (
        <Stack spacing={0.4} sx={{ maxHeight: 190, overflowY: 'auto' }}>
          {log.slice(0, 40).map((e) => {
            const a = ACTORS[e.actor] || ACTORS.system;
            return (
              <Stack key={e.seq} direction="row" spacing={0.7} sx={{ alignItems: 'baseline' }}>
                <Typography sx={{ fontSize: 9, color: '#44586E', width: 22, flexShrink: 0 }}>
                  #{e.seq}
                </Typography>
                <Typography sx={{ fontSize: 9, color: a.tone, width: 52, flexShrink: 0 }}>
                  {a.t}
                </Typography>
                <Typography sx={{ fontSize: 10, color: '#C7D6E6', lineHeight: 1.4 }}>
                  {e.event}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

function Lane({ label, children, half, dim, sx }) {
  return (
    <Box sx={{ flex: half ? 1 : 'none', minWidth: 0, opacity: dim ? 0.35 : 1,
               transition: 'opacity .4s', ...sx }}>
      <Typography sx={{
        fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: '#5D7793', mb: 0.6,
      }}>{label}</Typography>
      {children}
    </Box>
  );
}

function Row({ children }) {
  return <Stack direction="row" spacing={0} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>{children}</Stack>;
}
function Col({ children }) {
  return <Stack spacing={0}>{children}</Stack>;
}

/* One state chip plus its connector. `mark`: now | done | skip | future | off */
function Node({ id, mark, down, last, onInfo }) {
  const s = stateOf(id);
  const look = {
    now: { bg: C.yellow, fg: C.deep, bd: C.yellow },
    done: { bg: '#24476B', fg: '#C7D6E6', bd: '#24476B' },
    skip: { bg: 'transparent', fg: '#44586E', bd: 'rgba(255,255,255,.12)' },
    future: { bg: 'transparent', fg: '#93A9C2', bd: 'rgba(255,255,255,.16)' },
    off: { bg: 'transparent', fg: '#44586E', bd: 'rgba(255,255,255,.07)' },
  }[mark];
  return (
    <Stack direction={down ? 'column' : 'row'} sx={{ alignItems: down ? 'flex-start' : 'center' }}>
      <Box onClick={onInfo} sx={{
        px: 0.9, py: 0.45, borderRadius: '8px', cursor: 'pointer', whiteSpace: 'nowrap',
        fontSize: 9.5, fontWeight: mark === 'now' ? 800 : 600,
        bgcolor: look.bg, color: look.fg, border: `1px solid ${look.bd}`,
        animation: mark === 'now' ? 'nodePulse 1.6s ease-in-out infinite' : 'none',
        '@keyframes nodePulse': {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(255,185,0,.35)' },
          '50%': { boxShadow: '0 0 0 5px rgba(255,185,0,0)' },
        },
        mb: down && !last ? 0 : 0,
      }}>{s ? s.t : id}</Box>
      {!last && (down
        ? <Box sx={{ width: '1.5px', height: 10, bgcolor: 'rgba(255,255,255,.14)', ml: 1.4, my: '1px' }} />
        : <Box sx={{ width: 12, height: '1.5px', bgcolor: 'rgba(255,255,255,.14)', mx: '2px' }} />)}
    </Stack>
  );
}
