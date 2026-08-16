import { useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { episodesOf, queueOf, QUEUES, clinicianActions, whoseMove, stateLine } from '../machine';
import { INVESTIGATE, coachOf, givenNameOf, USER } from '../data';
import { C } from '../theme';

/*
 * JAMIE'S MACHINE — queues, not pages.
 *
 * The clinician UI is one list, filtered by state, and the allowed actions.
 * Nothing here is bespoke: queues come from machine.QUEUES, actions come from
 * clinicianActions(), and both read the same store the phone renders from.
 * Click Approve here and the phone's Today card changes in the same second,
 * because there is only one state for it to change in.
 */
export default function Clinic({ st, ui, fireEvent }) {
  const [queue, setQueue] = useState(null);       /* null = everything */
  const [open, setOpen] = useState(null);         /* episode id drawer */

  const eps = episodesOf(st, ui).map((ep) => ({ ...ep, queue: queueOf(ep) }));
  const shown = queue ? eps.filter((e) => e.queue === queue) : eps;

  return (
    <Box sx={{ color: '#E8EEF5' }}>
      {/* who is working */}
      <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mb: 2 }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '50%', bgcolor: C.yellow, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Typography sx={{ fontFamily: '"Fraunces", serif', fontSize: 13, fontWeight: 600, color: C.deep }}>
            JR
          </Typography>
        </Box>
        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>
            The practice
          </Typography>
          <Typography sx={{ fontSize: 11, color: '#93A9C2' }}>
            One list, filtered by state
          </Typography>
        </Box>
      </Stack>

      {/* the queues, with live counts */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 2 }}>
        <Chip on={queue === null} t={`All · ${eps.length}`} onClick={() => setQueue(null)} />
        {QUEUES.map((q) => {
          const n = eps.filter((e) => e.queue === q.id).length;
          return (
            <Chip key={q.id} on={queue === q.id} dim={n === 0}
              t={`${q.t} · ${n}`} onClick={() => setQueue(queue === q.id ? null : q.id)} />
          );
        })}
      </Box>

      {/* the list */}
      <Stack spacing={0.9}>
        {shown.length === 0 && (
          <Typography sx={{ fontSize: 12, color: '#5D7793', py: 2, textAlign: 'center' }}>
            Nothing in this queue.
          </Typography>
        )}
        {shown.map((ep) => {
          const acts = clinicianActions(st, ui, ep);
          return (
            <Box key={ep.id} onClick={() => setOpen(open === ep.id ? null : ep.id)} sx={{
              px: 1.5, py: 1.25, borderRadius: '12px', cursor: 'pointer',
              bgcolor: open === ep.id ? 'rgba(255,255,255,.1)' : 'rgba(255,255,255,.05)',
              border: '1px solid rgba(255,255,255,.07)',
            }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.7} sx={{ alignItems: 'center' }}>
                    <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>
                      {USER.first} · {ep.goal}
                    </Typography>
                    {ep.intent && (
                      <Typography sx={{
                        px: 0.6, py: 0.1, borderRadius: '5px', fontSize: 8.5, fontWeight: 800,
                        letterSpacing: '.06em', textTransform: 'uppercase',
                        bgcolor: ep.intent === 'known' ? 'rgba(255,185,0,.2)' : 'rgba(64,143,164,.25)',
                        color: ep.intent === 'known' ? C.yellow : '#7FC4D8',
                      }}>{ep.intent === 'known' ? 'Known' : 'Diagnosis'}</Typography>
                    )}
                  </Stack>
                  <Typography sx={{ fontSize: 11, color: '#93A9C2', mt: 0.3 }}>
                    {stateLine(ep)}{acts.length === 0 && ` · waiting on ${whoseMove(ep)}`}
                  </Typography>
                </Box>
                {acts.length > 0 && (
                  <Box sx={{
                    width: 8, height: 8, borderRadius: '50%', bgcolor: C.yellow, flexShrink: 0,
                    animation: 'qPulse 1.4s ease-in-out infinite',
                    '@keyframes qPulse': { '0%,100%': { opacity: 0.4 }, '50%': { opacity: 1 } },
                  }} />
                )}
              </Stack>

              {/* the drawer: the four-questions data + the allowed actions */}
              {open === ep.id && (
                <Box onClick={(e) => e.stopPropagation()} sx={{
                  mt: 1.25, pt: 1.25, borderTop: '1px solid rgba(255,255,255,.09)',
                }}>
                  <File ep={ep} st={st} />
                  {acts.length ? (
                    <Stack spacing={0.6} sx={{ mt: 1.25 }}>
                      {acts.map((t) => (
                        <Box key={t.event} onClick={() => fireEvent(t.event, ep)} sx={{
                          px: 1.25, py: 0.95, borderRadius: '9px', cursor: 'pointer',
                          textAlign: 'center', fontSize: 12, fontWeight: 700,
                          bgcolor: C.yellow, color: C.deep,
                          '&:active': { opacity: 0.85 },
                        }}>{t.event.replace(/_/g, ' ').replace(' · ', ': ')}</Box>
                      ))}
                    </Stack>
                  ) : (
                    <Typography sx={{ fontSize: 11, color: '#5D7793', mt: 1.25 }}>
                      No action for the clinician here. The move belongs to {whoseMove(ep)}.
                    </Typography>
                  )}
                </Box>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

/* The episode file: what the clinician can actually see at this state.
   Every row is data the store genuinely holds; the two marked SIM are the
   real-world artefacts the demo pseudofies. */
function File({ ep, st }) {
  const qa = st.qa;
  const rows = [];

  rows.push(['Intake', qa.goal
    ? `${qa.goal_label || qa.goal} · ${qa.sub || ''} · ${qa.sex || ''} · ${qa.height || 'n/a'} cm · ${qa.weight || 'n/a'} kg`
    : 'Not submitted yet']);

  if (ep.intent === 'known') {
    rows.push(['Safety screen', qa.wants
      ? `Wants ${qa.wants} · prior: ${qa.prior || 'n/a'} · flags: ${qa.flags || 'n/a'}`
      : 'Not answered yet']);
  }
  if (ep.intent === 'resolve' && qa.goal && INVESTIGATE[qa.goal]) {
    rows.push(['AI summary', INVESTIGATE[qa.goal].map((r) => r.t).join(' · ')]);
  }
  if (ep.run && ['bloodsDone', 'followup', 'ready'].includes(ep.run.status)) {
    rows.push(['Labs', ep.run.labs === 'ready'
      ? 'Panel received · 24 markers · SIM'
      : 'Sample with the lab · SIM']);
  }
  if (ep.run && ep.run.status === 'running') {
    rows.push(['Adherence', `Day ${ep.run.day} of ${ep.run.total} · ${ep.run.logs.length} logs`]);
  }
  if (ep.run && ['verdict', 'reviewing', 'done'].includes(ep.run.status)) {
    rows.push(['Course', 'Complete · retest panel attached · SIM']);
  }
  const c = ep.pKey ? coachOf(ep.pKey) : null;
  if (c) rows.push(['Lead', `${c.name} (${givenNameOf(c)})`]);

  return (
    <Stack spacing={0.7}>
      {rows.map(([k, v]) => (
        <Box key={k}>
          <Typography sx={{
            fontSize: 8.5, fontWeight: 800, letterSpacing: '.12em',
            textTransform: 'uppercase', color: '#5D7793',
          }}>{k}</Typography>
          <Typography sx={{ fontSize: 11.5, color: '#C7D6E6', lineHeight: 1.45 }}>{v}</Typography>
        </Box>
      ))}
    </Stack>
  );
}

function Chip({ t, on, dim, onClick }) {
  return (
    <Box onClick={onClick} sx={{
      px: 1.1, py: 0.55, borderRadius: '999px', cursor: 'pointer',
      fontSize: 10.5, fontWeight: on ? 700 : 500, whiteSpace: 'nowrap',
      bgcolor: on ? C.yellow : 'rgba(255,255,255,.07)',
      color: on ? C.deep : dim ? '#5D7793' : '#C7D6E6',
    }}>{t}</Box>
  );
}
