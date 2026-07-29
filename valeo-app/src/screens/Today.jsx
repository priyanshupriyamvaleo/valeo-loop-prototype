import { useState } from 'react';
import { Box, Button, Stack, Typography, Divider, LinearProgress } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VideocamIcon from '@mui/icons-material/Videocam';
import ScienceIcon from '@mui/icons-material/Science';
import RunHero from '../components/RunHero';
import TwinChat from '../components/TwinChat';
import Trend from '../components/Trend';
import LogSheet from '../components/LogSheet';
import { PROTOCOLS, KINDS, DOCTOR, logKindFor, LOG_KINDS, arcFor, nextMilestone } from '../data';
import { C } from '../theme';

/**
 * Today is the loop, day by day. It has five faces because the person's
 * situation genuinely differs at each stage — one screen that tried to serve
 * all of them would serve none.
 *
 *   booked   → the call is the next event
 *   ready    → the call happened; the protocol is waiting to be bought
 *   shipping → it's coming; here's when and what
 *   running  → log it, watch it move
 *   verdict  → retest day
 */
export default function Today({ st, dispatch, onGo, onBuy, onDetail }) {
  const [coach, setCoach] = useState(false);
  const [log, setLog] = useState(false);
  const rx = st.rx;

  /* ── nothing committed ── */
  if (!rx) {
    return (
      <Shell coach={coach} setCoach={setCoach}>
        <Head sub="Tuesday 28 July" title="Nothing to run yet." />
        <Box sx={{ flex: '1 1 auto', px: 2.25, display: 'flex', flexDirection: 'column',
                   justifyContent: 'center' }}>
          <Stack spacing={1.25}>
            <Step n="1" t="Save a protocol" s="Swipe the deck in Discover"
                  done={st.saved.length > 0} onClick={() => onGo('discover')} />
            <Step n="2" t="Talk to a doctor" s="He amends it to fit you"
                  done={false} onClick={() => onGo('protocols')} />
            <Step n="3" t="Run it, then retest" s="That's the loop" done={false} />
          </Stack>
        </Box>
      </Shell>
    );
  }

  const p = PROTOCOLS[rx.protocol];

  /* ── consult booked, doctor hasn't reviewed yet ── */
  if (rx.status === 'booked') {
    return (
      <Shell coach={coach} setCoach={setCoach}>
        <Head sub="Tuesday 28 July" title={`Your call is ${rx.slot.toLowerCase()}.`} />
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
          <Stack direction="row" spacing={1.75} sx={{
            alignItems: 'center', p: 2, borderRadius: '20px',
            background: `linear-gradient(150deg,${C.deep},#12283F)`, color: '#fff',
          }}>
            <Box component="img" src={DOCTOR.img} alt="" sx={{
              width: 54, height: 54, borderRadius: '16px', objectFit: 'cover', flexShrink: 0,
            }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{
                fontSize: 8.5, fontWeight: 800, letterSpacing: '.16em',
                textTransform: 'uppercase', color: C.yellow,
              }}>◈ Under doctor review</Typography>
              <Typography sx={{ fontSize: 15, fontWeight: 700, mt: 0.5 }}>{DOCTOR.name}</Typography>
              <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,.62)', mt: 0.25 }}>
                {p.t} · {rx.slot}
              </Typography>
            </Box>
            <VideocamIcon sx={{ fontSize: 20, color: C.yellow, flexShrink: 0 }} />
          </Stack>

          <Label sx={{ mt: 3 }}>Have these ready</Label>
          <Stack spacing={1}>
            {['Anything you take now — including supplements',
              'Conditions that run in your family',
              'What you have already tried that did not work'].map((t) => (
              <Stack key={t} direction="row" spacing={1.5} sx={{
                alignItems: 'flex-start', px: 1.9, py: 1.6, borderRadius: '16px', bgcolor: '#fff',
                boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
              }}>
                <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: C.ink2,
                           mt: '7px', flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13, lineHeight: 1.45, color: C.ink }}>{t}</Typography>
              </Stack>
            ))}
          </Stack>
          <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2, lineHeight: 1.55 }}>
            He can change any part of this protocol on the call. Nothing ships until he signs it.
          </Typography>
        </Box>
      </Shell>
    );
  }

  /* ── reviewed, waiting to be bought ── */
  if (rx.status === 'ready') {
    return (
      <Shell coach={coach} setCoach={setCoach}>
        <Head sub="Tuesday 28 July" title="Your protocol is ready." />
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
          <Box onClick={onDetail} sx={{
            p: 2, borderRadius: '20px', cursor: 'pointer',
            bgcolor: 'rgba(39,153,91,.08)', border: '1.5px solid rgba(39,153,91,.35)',
          }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box component="img" src={DOCTOR.img} alt="" sx={{
                width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
              }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>
                  {DOCTOR.name} changed 2 things
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>
                  Tap to see what and why
                </Typography>
              </Box>
              <ChevronRightIcon sx={{ fontSize: 20, color: C.green, flexShrink: 0 }} />
            </Stack>
          </Box>

          <Label sx={{ mt: 3 }}>Then it starts</Label>
          <Stack spacing={1.25}>
            <Step n="1" t={p.blood !== 'no' ? 'Blood test first' : 'Package arrives'}
                  s={p.blood !== 'no' ? 'A nurse draws your baseline at home'
                                      : 'A nurse brings it and stays for the first dose'} />
            <Step n="2" t={`Run it ${p.wk} weeks`} s={`${p.items.length} things, logged daily`} />
            <Step n="3" t={`Retest ${p.mk}`} s="Verdict day" />
          </Stack>
        </Box>
        <Box sx={{ px: 2.25, pb: 1.5, flexShrink: 0 }}>
          <Button fullWidth variant="contained" color="secondary" onClick={onBuy}>
            Buy protocol · SAR {p.price.toLocaleString()}
          </Button>
        </Box>
      </Shell>
    );
  }

  /* ── paid, on its way ── */
  if (rx.status === 'shipping') {
    return (
      <Shell coach={coach} setCoach={setCoach}>
        <Head sub="Tuesday 28 July"
              title={p.blood !== 'no' ? 'Blood test on Thursday.' : 'Arriving tomorrow, 9–11am.'} />
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
          <Box sx={{
            p: 2.25, borderRadius: '20px', color: '#fff',
            background: `linear-gradient(150deg,${C.teal},#2E6F80)`,
          }}>
            <LocalShippingIcon sx={{ fontSize: 26 }} />
            <Typography sx={{ fontSize: 15.5, fontWeight: 700, mt: 1.25 }}>
              {p.blood !== 'no' ? 'Blood draw, then your package' : 'Nadia is bringing it'}
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: 'rgba(255,255,255,.8)', mt: 0.6, lineHeight: 1.5 }}>
              She stays for the first dose and shows you how to do the rest.
            </Typography>
            <Stack direction="row" spacing={0.75} sx={{ mt: 2 }}>
              {['Paid', 'Packed', 'Out for delivery', 'Delivered'].map((s, i) => (
                <Box key={s} sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{
                    height: 3, borderRadius: 2, mb: 0.75,
                    bgcolor: i <= 1 ? '#fff' : 'rgba(255,255,255,.28)',
                  }} />
                  <Typography sx={{
                    fontSize: 7.5, fontWeight: 700, letterSpacing: '.06em',
                    textTransform: 'uppercase',
                    color: i <= 1 ? '#fff' : 'rgba(255,255,255,.5)',
                  }}>{s}</Typography>
                </Box>
              ))}
            </Stack>
          </Box>

          <Label sx={{ mt: 3 }}>In the box</Label>
          <Box sx={{
            borderRadius: '18px', bgcolor: '#fff', overflow: 'hidden',
            boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
          }}>
            {p.items.map((it, i) => (
              <Box key={it.t}>
                {i > 0 && <Divider />}
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', px: 1.75, py: 1.35 }}>
                  <Box sx={{ fontSize: 15, width: 22, textAlign: 'center', flexShrink: 0 }}>
                    {KINDS[it.k].ic}
                  </Box>
                  <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: C.deep }}>
                    {it.t}
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Box>

          <Button fullWidth variant="text" onClick={() => dispatch({ type: 'deliver' })}
                  sx={{ mt: 2, fontSize: 12.5, color: C.ink2 }}>
            Simulate delivery →
          </Button>
        </Box>
      </Shell>
    );
  }

  /* ── running ── */
  const kind = logKindFor(rx.day);
  const loggedToday = rx.logs.some((l) => l.day === rx.day);
  const need = Math.max(1, Math.ceil(rx.day * 0.7));
  const valid = rx.logs.length >= need;
  const doneCount = rx.doneItems.length;

  const arc = arcFor(p, rx.day);
  const milestone = nextMilestone(p, rx.day);
  /* Held back until there is enough to say something true. */
  const felt = rx.logs.filter((l) => l.kind === 'felt');
  const insight = rx.logs.length >= 10
    ? `You have logged ${rx.logs.length} of ${rx.day} days. ${felt.length >= 5
        ? 'Side effects clustered in week two and have not recurred since day 16.'
        : 'Consistency is high enough that the retest will be attributable to the protocol.'}`
    : null;

  /* proxy series — a weekly weigh-in, so the chart has something honest in it */
  const series = rx.logs.filter((l) => l.kind === 'proxy').map((l) => ({ d: l.day, v: l.v }));
  const points = [{ d: 1, v: 96 }, ...series].filter((pt, i, arr) =>
    arr.findIndex((o) => o.d === pt.d) === i);

  if (rx.status === 'verdict') {
    return (
      <Shell coach={coach} setCoach={setCoach}>
        <Head sub={`Day ${rx.day}`} title="Retest day." />
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
          <Box sx={{
            p: 2.25, borderRadius: '20px', textAlign: 'center',
            background: `linear-gradient(152deg,${C.deep},#12283F)`, color: '#fff',
          }}>
            <ScienceIcon sx={{ fontSize: 30, color: C.yellow }} />
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 21, fontWeight: 600, mt: 1.25,
            }}>Time to find out.</Typography>
            <Typography sx={{
              fontSize: 12.5, color: 'rgba(255,255,255,.7)', mt: 1, lineHeight: 1.55,
            }}>
              {rx.logs.length} days logged out of {rx.day}. Enough for the verdict to hold.
            </Typography>
            <Button fullWidth variant="contained" color="secondary" sx={{ mt: 2.25 }}
                    onClick={() => dispatch({ type: 'retest' })}>
              Book the retest
            </Button>
          </Box>
        </Box>
      </Shell>
    );
  }

  return (
    <Shell coach={coach} setCoach={setCoach}>
      <Head sub={`Day ${rx.day} · ${p.t}`}
            title={loggedToday ? 'Logged. Nothing else owed.' : `${doneCount} of ${p.items.length} done.`} />
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
        <RunHero day={rx.day} total={rx.total} week={Math.ceil(rx.day / 7)} weeks={p.wk}
                 arc={arc} logs={rx.logs} milestone={milestone} />

        {/* today's log — the one thing that keeps the verdict valid */}
        <Label sx={{ mt: 3 }}>Today's log</Label>
        <Box onClick={loggedToday ? undefined : () => setLog(true)} sx={{
          p: 2, borderRadius: '20px', cursor: loggedToday ? 'default' : 'pointer',
          bgcolor: loggedToday ? 'rgba(39,153,91,.08)' : '#fff',
          border: `1.5px solid ${loggedToday ? 'rgba(39,153,91,.35)' : 'transparent'}`,
          boxShadow: loggedToday ? 'none' : '0 2px 12px -6px rgba(27,57,91,.3)',
        }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box sx={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: loggedToday ? C.green : 'rgba(255,185,0,.18)',
            }}>
              {loggedToday
                ? <CheckIcon sx={{ fontSize: 17, color: '#fff' }} />
                : <Box sx={{ fontSize: 13 }}>✎</Box>}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>
                {loggedToday ? 'Done for today' : LOG_KINDS[kind].t}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>
                {loggedToday ? 'Back tomorrow' : LOG_KINDS[kind].sub}
              </Typography>
            </Box>
            {!loggedToday && <ChevronRightIcon sx={{ fontSize: 20, color: C.ink2 }} />}
          </Stack>
        </Box>

        {/* evidence, not obedience — logging buys verdict validity */}
        <Box sx={{ mt: 1.5, px: 1.9, py: 1.6, borderRadius: '16px', bgcolor: 'rgba(27,57,91,.04)' }}>
          <Stack direction="row" sx={{ alignItems: 'baseline', mb: 0.9 }}>
            <Typography sx={{ flex: 1, fontSize: 12, color: C.ink2 }}>
              <b style={{ color: C.deep }}>{rx.logs.length} of {rx.day} days</b> logged
            </Typography>
            <Typography sx={{
              fontSize: 11, fontWeight: 700, color: valid ? C.green : C.yellowDeep,
            }}>{valid ? 'Verdict will hold' : `${need - rx.logs.length} more needed`}</Typography>
          </Stack>
          <LinearProgress variant="determinate"
            value={Math.min(100, (rx.logs.length / need) * 100)}
            sx={{ '& .MuiLinearProgress-bar': { background: valid ? C.green : C.yellow } }} />
        </Box>

        {/* The reward for logging is an insight, not a badge. Whoop holds this
            back until it has enough yes/no logs to say something true — so do we. */}
        {insight && (
          <Stack direction="row" spacing={1.5} sx={{
            alignItems: 'flex-start', mt: 1.5, px: 1.9, py: 1.75, borderRadius: '17px',
            bgcolor: 'rgba(64,143,164,.09)', border: '1px solid rgba(64,143,164,.28)',
          }}>
            <Box sx={{ fontSize: 15, flexShrink: 0, mt: '1px' }}>◈</Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{
                fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: C.teal,
              }}>What your logs show</Typography>
              <Typography sx={{ fontSize: 12.5, color: C.ink, mt: 0.6, lineHeight: 1.5 }}>
                {insight}
              </Typography>
            </Box>
          </Stack>
        )}

        {/* what to actually do */}
        <Label sx={{ mt: 3 }}>Doing today</Label>
        <Stack spacing={1}>
          {p.items.map((it, i) => {
            const on = rx.doneItems.includes(i);
            return (
              <Stack key={it.t} direction="row" spacing={1.5}
                     onClick={() => dispatch({ type: 'toggleItem', i })} sx={{
                alignItems: 'center', px: 1.9, py: 1.6, borderRadius: '16px', cursor: 'pointer',
                bgcolor: on ? 'rgba(39,153,91,.07)' : '#fff',
                border: `1.5px solid ${on ? 'rgba(39,153,91,.3)' : 'transparent'}`,
                boxShadow: on ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
              }}>
                <Box sx={{
                  width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: on ? C.green : 'transparent',
                  border: on ? 'none' : '1.5px solid rgba(27,57,91,.25)',
                }}>{on && <CheckIcon sx={{ fontSize: 13, color: '#fff' }} />}</Box>
                <Box sx={{ fontSize: 14, flexShrink: 0 }}>{KINDS[it.k].ic}</Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                    <Typography sx={{
                      fontSize: 13.5, fontWeight: 600,
                      color: on ? C.ink2 : C.deep,
                      textDecoration: on ? 'line-through' : 'none',
                    }}>{it.t}</Typography>
                    {KINDS[it.k].rx && !on && (
                      <Typography sx={{
                        fontSize: 8, fontWeight: 800, letterSpacing: '.1em', flexShrink: 0,
                        textTransform: 'uppercase', color: C.yellowDeep,
                        px: 0.6, py: '2px', borderRadius: '4px', bgcolor: 'rgba(255,185,0,.16)',
                      }}>Rx</Typography>
                    )}
                  </Stack>
                  <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.15 }}>{it.d}</Typography>
                </Box>
              </Stack>
            );
          })}
        </Stack>

        {/* the trend — proxy only, honest about it */}
        {points.length > 1 && (
          <>
            <Label sx={{ mt: 3 }}>Weight</Label>
            <Box sx={{
              p: 2, borderRadius: '20px', bgcolor: '#fff',
              boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
            }}>
              <Trend points={points} total={rx.total} caption="Between blood draws this is the proxy." />
            </Box>
          </>
        )}

        <Label sx={{ mt: 3 }}>The whole run</Label>
        <Stack spacing={0.9}>
          {arc.all.map((a, i) => {
            const done = i < arc.idx;
            const now = i === arc.idx;
            return (
              <Stack key={a.t} direction="row" spacing={1.5} sx={{
                alignItems: 'center', px: 1.75, py: 1.4, borderRadius: '14px',
                bgcolor: now ? 'rgba(255,185,0,.12)' : '#fff',
                border: `1px solid ${now ? 'rgba(255,185,0,.45)' : 'transparent'}`,
                boxShadow: now ? 'none' : '0 2px 10px -6px rgba(27,57,91,.24)',
                opacity: done ? 0.55 : 1,
              }}>
                <Box sx={{
                  width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: done ? C.green : now ? C.yellow : 'rgba(27,57,91,.08)',
                }}>
                  {done && <CheckIcon sx={{ fontSize: 12, color: '#fff' }} />}
                </Box>
                <Typography sx={{
                  flex: 1, fontSize: 13, fontWeight: now ? 700 : 500, color: C.deep,
                }}>{a.t}</Typography>
                <Typography sx={{ fontSize: 11, color: C.ink2, flexShrink: 0 }}>
                  to week {a.to}
                </Typography>
              </Stack>
            );
          })}
        </Stack>

        <Button fullWidth variant="text" onClick={() => dispatch({ type: 'advance' })}
                sx={{ mt: 2, fontSize: 12.5, color: C.ink2 }}>
          Skip ahead a week →
        </Button>
      </Box>

      <LogSheet open={log} onClose={() => setLog(false)} kind={kind} day={rx.day}
                onSave={(v) => { dispatch({ type: 'log', kind, v }); setLog(false); }} />
    </Shell>
  );
}

/* ── shared chrome ── */
function Shell({ children, coach, setCoach }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {children}
      <Box sx={{ px: 2.25, pb: 1.5, pt: 1.5, flexShrink: 0 }}>
        <Stack direction="row" spacing={1.5} onClick={() => setCoach(true)} sx={{
          alignItems: 'center', px: 1.9, py: 1.6, borderRadius: '17px', cursor: 'pointer',
          background: `linear-gradient(150deg,${C.deep},#12283F)`, color: '#fff',
        }}>
          <Box sx={{
            width: 30, height: 30, borderRadius: '50%', flexShrink: 0, fontSize: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'rgba(255,255,255,.12)', color: C.yellow,
          }}>◎</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>Ask your twin</Typography>
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,.6)', mt: 0.2 }}>
              It knows your protocol, your logs and your panel
            </Typography>
          </Box>
          <ChevronRightIcon sx={{ fontSize: 19, color: 'rgba(255,255,255,.5)', flexShrink: 0 }} />
        </Stack>
      </Box>
      <TwinChat open={coach} onClose={() => setCoach(false)} />
    </Box>
  );
}

function Head({ sub, title }) {
  return (
    <Box sx={{ px: 2.25, pt: 2.5, pb: 2, flexShrink: 0 }}>
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

function Step({ n, t, s, done, onClick }) {
  return (
    <Stack direction="row" spacing={1.75} onClick={onClick} sx={{
      alignItems: 'center', px: 1.9, py: 1.9, borderRadius: '17px',
      cursor: onClick ? 'pointer' : 'default',
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
      {onClick && <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />}
    </Stack>
  );
}
