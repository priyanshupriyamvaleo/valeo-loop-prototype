import { Box, Stack, Typography } from '@mui/material';
import { STATES, stateOf, episodesOf, allowedEvents } from '../machine';
import { C } from '../theme';

/*
 * THE FLOW, AS A TABLE — the only thing on the right of the phone.
 *
 * Each step of the MVP with its entry and exit conditions, straight from the
 * state machine's own strings, so the table can never disagree with the
 * product. The row the patient is currently on is highlighted; the door not
 * taken dims once the fork is answered.
 *
 * The one control: when the next move belongs to the system (doctor, lab,
 * nurse, pharmacy), a single button appears under the table to advance it.
 * Patient moves are never buttons here; they happen on the phone.
 */

const GROUPS = [
  { t: 'Start', ids: ['NEW', 'INTAKE'] },
  { t: 'Eligibility, when flagged', ids: ['FLAGGED_CALL'] },
  { t: 'The plan', ids: ['PLAN_VIEW', 'REVIEW', 'NOT_ELIGIBLE'] },
  { t: 'Delivery & treatment', ids: ['FULFILMENT', 'TREATMENT'] },
];

export default function FlowTable({ st, ui, fireEvent }) {
  const eps = episodesOf(st, ui);
  /* follow the funnel if one is open, else the focused run */
  const ep = eps.find((e) => e.id === 'funnel')
    || eps.find((e) => e.pKey === st.focus)
    || eps[0] || null;

  const sys = ep
    ? allowedEvents(st, ui, ep).filter((t) => t.actor !== 'patient')
    : [];

  return (
    <Box sx={{
      width: 470, flexShrink: 0, maxHeight: 844, overflowY: 'auto',
      borderRadius: '22px', bgcolor: '#FFFDF5', p: 2.5,
      boxShadow: '0 30px 70px -30px rgba(0,0,0,.5)',
    }}>
      <Typography sx={{
        fontSize: 10, fontWeight: 800, letterSpacing: '.18em',
        textTransform: 'uppercase', color: C.yellowDeep,
      }}>Valeo MVP</Typography>
      <Typography sx={{
        fontFamily: '"Fraunces", serif', fontSize: 21, fontWeight: 600,
        color: C.deep, mt: 0.5, lineHeight: 1.2,
      }}>The flow, step by step</Typography>
      <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.5, lineHeight: 1.5 }}>
        Entry and exit conditions for every step. The highlighted row is where
        this patient is right now.
      </Typography>

      {/* header row */}
      <Stack direction="row" spacing={1} sx={{ mt: 2, pb: 0.75, borderBottom: `1.5px solid ${C.deep}` }}>
        <Cell w={92} head>Step</Cell>
        <Cell head>Entry condition</Cell>
        <Cell head>Exit condition</Cell>
      </Stack>

      {GROUPS.map((g) => {
        /* the flagged detour dims once a clean path has moved past it */
        const dimmed = g.ids[0] === 'FLAGGED_CALL' && ep
          && !['NEW', 'INTAKE', 'FLAGGED_CALL'].includes(ep.state) && !st.qa.flagged;
        return (
          <Box key={g.t} sx={{ opacity: dimmed ? 0.35 : 1, transition: 'opacity .3s' }}>
            <Typography sx={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.13em',
              textTransform: 'uppercase', color: C.ink2, mt: 1.5, mb: 0.4,
            }}>{g.t}</Typography>
            {g.ids.map((id) => {
              const s = stateOf(id);
              const now = ep && ep.state === id;
              return (
                <Stack key={id} direction="row" spacing={1} sx={{
                  py: 0.9, px: 0.75, mx: -0.75, borderRadius: '10px',
                  borderBottom: `1px solid ${C.line}`,
                  bgcolor: now ? 'rgba(255,185,0,.14)' : 'transparent',
                  outline: now ? '1.5px solid rgba(224,164,0,.55)' : 'none',
                }}>
                  <Cell w={92}>
                    <Typography sx={{
                      fontSize: 11, fontWeight: 700, lineHeight: 1.3,
                      color: now ? C.deep : C.ink,
                    }}>{s.t}</Typography>
                    {now && (
                      <Typography sx={{
                        fontSize: 8.5, fontWeight: 800, letterSpacing: '.08em',
                        color: C.yellowDeep, textTransform: 'uppercase', mt: 0.2,
                      }}>Now</Typography>
                    )}
                  </Cell>
                  <Cell><Small>{s.enter}</Small></Cell>
                  <Cell><Small>{s.exit}</Small></Cell>
                </Stack>
              );
            })}
          </Box>
        );
      })}

      {/* the one control: the system's next move, through the same gate */}
      <Box sx={{
        mt: 2, px: 1.5, py: 1.25, borderRadius: '12px',
        bgcolor: 'rgba(27,57,91,.05)',
      }}>
        <Typography sx={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.13em',
          textTransform: 'uppercase', color: C.ink2,
        }}>Next move</Typography>
        {sys.length ? (
          <Stack spacing={0.6} sx={{ mt: 0.75 }}>
            {sys.map((t) => (
              <Box key={t.event} onClick={() => fireEvent(t.event, ep)} sx={{
                px: 1.25, py: 0.85, borderRadius: '9px', cursor: 'pointer',
                textAlign: 'center', fontSize: 11.5, fontWeight: 700,
                bgcolor: C.yellow, color: C.deep, '&:active': { opacity: 0.85 },
              }}>▸ {t.event.replace(/_/g, ' ').toLowerCase()}</Box>
            ))}
          </Stack>
        ) : (
          <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.5 }}>
            The patient's. Drive it on the phone.
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function Cell({ children, w, head }) {
  return (
    <Box sx={{ width: w || 'auto', flex: w ? 'none' : 1, minWidth: 0 }}>
      {head ? (
        <Typography sx={{
          fontSize: 9.5, fontWeight: 800, letterSpacing: '.1em',
          textTransform: 'uppercase', color: C.deep,
        }}>{children}</Typography>
      ) : children}
    </Box>
  );
}

function Small({ children }) {
  return (
    <Typography sx={{ fontSize: 10.5, lineHeight: 1.45, color: C.ink2 }}>
      {children}
    </Typography>
  );
}
