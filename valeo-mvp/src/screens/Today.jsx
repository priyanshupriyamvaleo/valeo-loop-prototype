import { useState } from 'react';
import { Box, Button, Stack, Typography, Divider, LinearProgress } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VideocamIcon from '@mui/icons-material/Videocam';
import ScienceIcon from '@mui/icons-material/Science';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import RunHero from '../components/RunHero';
import Practice from '../components/Practice';
import Trend from '../components/Trend';
import LogSheet from '../components/LogSheet';
import CaptureGrid from '../components/CaptureGrid';
import { MealSheet, BodySheet, CheckinSheet } from '../components/CaptureSheets';
import { PROTOCOLS, KINDS, DOCTOR, coachOf, nextStep, behindScenes, logKindFor, LOG_KINDS, arcFor, nextMilestone,
         WHEN, WHEN_ORDER, capturesFor, streakOf,
         subsystemMoves, heroStreams, focusRun, activeRuns, RX_LABEL,
} from '../data';
import MovedList from '../components/MovedList';
import { C, meter } from '../theme';

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
export default function Today({ st, dispatch, onGo, onBuy, onDetail, onReview, onResults,
  onBookBloods, onBookFollow, onBrief, onCheckpointCall, onActivate, onJoinConsult,
                                onFocus }) {
  const [coach, setCoach] = useState(false);
  const [sheet, setSheet] = useState(null);   /* doses | meals | body | checkin | devices */
  /* ── WHICH RUN IS TODAY ABOUT ──
     One protocol owns the day. Merging two protocols' checklists would lose which
     run a given dose belonged to, and adherence that cannot be attributed cannot
     support a verdict — so instead the day has a focus, and a switcher when there
     is more than one thing running. */
  const f = focusRun(st);
  const rx = f ? f.run : null;
  const pKey = f ? f.k : null;
  /* messages the practice sent that you haven't opened the thread on yet */
  const unread = !!rx && ((rx.thread || []).length > (rx.seen || 0));
  const runs = activeRuns(st);
  const switcher = runs.length > 1 ? (
    <Stack direction="row" spacing={0.75} sx={{
      overflowX: 'auto', px: 2.25, pb: 1.25, flexShrink: 0,
      '&::-webkit-scrollbar': { display: 'none' },
    }}>
      {runs.map((r) => {
        const on = r.k === pKey;
        return (
          <Stack key={r.k} direction="row" spacing={0.6} onClick={() => onFocus(r.k)} sx={{
            flex: '0 0 auto', alignItems: 'center', cursor: 'pointer',
            px: 1.15, py: 0.65, borderRadius: '11px',
            bgcolor: on ? C.deep : 'rgba(27,57,91,.055)',
          }}>
            <Typography sx={{
              fontSize: 11.5, fontWeight: on ? 700 : 500,
              color: on ? '#fff' : C.ink2, whiteSpace: 'nowrap',
            }}>{r.p.t}</Typography>
            <Typography sx={{
              fontFamily: meter, fontSize: 10.5, fontWeight: 700,
              color: on ? C.yellow : C.ink2, opacity: on ? 1 : 0.7,
            }}>{r.run && r.run.day ? `d${r.run.day}` : RX_LABEL[r.status].t}</Typography>
          </Stack>
        );
      })}
    </Stack>
  ) : null;

  /* A booked consultation is a next step even though nothing has been bought
     yet, so it is resolved before the empty state gets a chance to claim the
     screen. */
  const nsKey = pKey || 'P_WEIGHT';
  const preNs = nextStep(st, nsKey);

  /* ── nothing committed, and nothing booked ── */
  if (!rx && !preNs) {
    return (
      <Shell coach={coach} setCoach={setCoach} st={st} pKey={pKey} dispatch={dispatch}>
        <Head sub="Tuesday 28 July" title="Nothing to run yet." onTwin={() => setCoach(true)} dot={unread} />
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

  const p = f ? f.p : null;

  /* ── YOUR NEXT STEP ──
     Today is the product; everything before it exists to get someone here. So
     this is not a dashboard with sections for consultations, bloods and results
     — it is one card, resolved from where the person actually is. The structure
     never changes; only the content does.

     Called "Your next step" rather than "Today's focus" because focus is
     productivity language and this is care. Quiet, forward-looking, and it says
     the same thing every single day: here is the one thing that moves you on.

     Waiting states get no button. When the next move belongs to the clinic,
     manufacturing an action for the patient is how a product starts nagging
     people about work that was never theirs. */
  const ns = preNs;
  if (ns) {
    const who = coachOf(nsKey) || DOCTOR;
    const [when1, ...when2] = (ns.when || '').split(' ');
    /* Same component, same reason: work the clinic is doing that the patient
       cannot act on. The lab strip and the delivery strip are the same object
       with different rows, so they render through one path. */
    const bts = ns.ship
      ? { steps: ns.ship, ready: false, label: 'Your package' }
      : behindScenes(ns.bts);
    const hasRun = !!rx;
    return (
      <Shell coach={coach} setCoach={setCoach} st={st} pKey={pKey} dispatch={dispatch}>
        <Head below={switcher} sub="Tuesday 28 July" title="Your next step"
              onTwin={() => setCoach(true)} dot={unread} />
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
          <Box sx={{
            borderRadius: '22px', bgcolor: '#fff', overflow: 'hidden',
            border: '1px solid rgba(27,57,91,.07)',
            boxShadow: '0 4px 18px -12px rgba(27,57,91,.4)',
          }}>
            <Box sx={{ px: 2.25, pt: 2.25, pb: 2 }}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                <Box sx={{
                  width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                  bgcolor: ['plan', 'summary', 'start'].includes(ns.kind) ? C.green : C.yellow,
                }} />
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
                  {ns.tag}
                </Typography>
              </Stack>

              {/* a time, when there is one — at the size of the only thing that matters */}
              {ns.when ? (
                <>
                  <Typography sx={{ fontSize: 14, color: C.ink2, mt: 1.6 }}>{when1}</Typography>
                  <Typography sx={{
                    fontFamily: '"Fraunces", serif', fontSize: 36, fontWeight: 600,
                    lineHeight: 1.05, color: C.deep, mt: 0.2,
                  }}>{when2.join(' ')}</Typography>
                  <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 1 }}>
                    {ns.kind === 'bloods'
                      ? 'A nurse comes to you'
                      : `With ${who.short} · 30-minute video call`}
                  </Typography>
                </>
              ) : ns.kind === 'summary' ? (
                /* Not a transcript and not meeting notes — three lines whose only
                   job is that the patient closes the app certain they were
                   heard. "Your plan is being written" says nothing happened. */
                <>
                  <Typography sx={{ fontSize: 13.5, color: C.ink2, mt: 1.5 }}>
                    Today we talked about:
                  </Typography>
                  <Stack spacing={1.1} sx={{ mt: 1.25 }}>
                    {ns.said.map((t) => (
                      <Stack key={t} direction="row" spacing={1.2} sx={{ alignItems: 'flex-start' }}>
                        <Box sx={{
                          width: 5, height: 5, borderRadius: '50%', bgcolor: C.teal,
                          mt: '8px', flexShrink: 0,
                        }} />
                        <Typography sx={{ flex: 1, fontSize: 14.5, lineHeight: 1.5, color: C.deep }}>
                          {t}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  {/* ── THE CARD HOLDS ACTIONS; THE THREAD HOLDS NEWS ──
                      This block used to run in both routes, and on the direct
                      route it said "Jamie is putting your plan together now"
                      four lines above a message from the practice saying "Jamie
                      is reviewing everything you shared today". The same news,
                      twice, in two voices.

                      Now the practice tells you what is happening — that is
                      what a practice is for — and this block survives only
                      where it carries something to DO, which is the bloods
                      route and its booking button. */}
                  {ns.cta && (
                    <Box sx={{ mt: 2, pt: 1.75, borderTop: `1px solid ${C.line}` }}>
                      <Typography sx={{
                        fontSize: 10.5, fontWeight: 700, letterSpacing: '.12em',
                        textTransform: 'uppercase', color: C.ink2, mb: 0.9,
                      }}>{ns.recTag}</Typography>
                      <Typography sx={{ fontSize: 14.5, lineHeight: 1.55, color: C.ink }}>
                        {ns.rec}
                      </Typography>
                    </Box>
                  )}
                </>
              ) : (
                <>
                  <Typography sx={{
                    fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 600,
                    lineHeight: 1.2, color: C.deep, mt: 1.4,
                  }}>{ns.title}</Typography>
                  {ns.body && (
                    <Typography sx={{ fontSize: 13.5, color: C.ink2, mt: 1, lineHeight: 1.55 }}>
                      {ns.body}
                    </Typography>
                  )}
                </>
              )}
            </Box>

            {ns.cta && (
              <Box sx={{ px: 2.25, py: 1.75, borderTop: `1px solid ${C.line}` }}>
                <Box onClick={() => {
                  const k = ns.ctaKind || ns.kind;
                  if (k === 'joinConsult') onJoinConsult && onJoinConsult();
                  else if (k === 'brief') onBrief(pKey);
                  else if (k === 'bookBloods') onBookBloods(pKey);
                  else if (k === 'bookFollow') onBookFollow(pKey);
                  else if (k === 'checkpointCall') onCheckpointCall(pKey);
                  else if (k === 'activate') onActivate(pKey);
                  else if (k === 'plan') onDetail(pKey);
                  else if (k === 'startDay') dispatch({ type: 'deliver', protocol: pKey });
                }} sx={{
                  py: 1.35, borderRadius: '12px', textAlign: 'center',
                  cursor: ns.locked ? 'default' : 'pointer',
                  bgcolor: ns.locked ? 'rgba(27,57,91,.05)' : C.yellow,
                  color: ns.locked ? C.ink2 : C.deep,
                  fontSize: 14.5, fontWeight: 700,
                }}>{ns.cta}</Box>
                {ns.foot && (
                  <Typography sx={{
                    fontSize: 11.5, color: C.ink2, textAlign: 'center', mt: 0.9,
                  }}>{ns.foot}</Typography>
                )}
                {ns.free && (
                  <Typography sx={{
                    fontSize: 11.5, color: C.ink2, textAlign: 'center', mt: 0.9,
                  }}>Included, no charge for this one</Typography>
                )}
              </Box>
            )}

            {/* buying happens here, not somewhere else */}
            {ns.kind === 'plan' && (
              <Box sx={{ px: 2.25, pb: 2.25 }}>
                <Box onClick={() => onBuy(pKey)} sx={{
                  py: 1.3, borderRadius: '12px', textAlign: 'center', cursor: 'pointer',
                  border: `1.5px solid ${C.deep}`, color: C.deep,
                  fontSize: 14, fontWeight: 700,
                }}>Activate my plan</Box>
              </Box>
            )}
          </Box>

          {/* what to do before a blood draw — the point is to remove anxiety */}
          {ns.prepList && (
            <Box sx={{ mt: 2.5 }}>
              <Label>Before the nurse arrives</Label>
              <Stack spacing={1}>
                {ns.prepList.map((t) => (
                  <Stack key={t} direction="row" spacing={1.3} sx={{
                    alignItems: 'flex-start', px: 1.9, py: 1.5, borderRadius: '16px',
                    bgcolor: '#fff', border: '1px solid rgba(27,57,91,.06)',
                  }}>
                    <Box sx={{
                      width: 5, height: 5, borderRadius: '50%', bgcolor: C.yellowDeep,
                      mt: '7px', flexShrink: 0,
                    }} />
                    <Typography sx={{ fontSize: 13.5, lineHeight: 1.45, color: C.ink }}>{t}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {/* ── AN UNREAD MESSAGE, NOT A TASK CARD ──
              This was a yellow panel headed "Help us prepare" with a "Continue
              in chat" button, and it broke the spell: four screens establish
              that you now have a relationship with a practice, and then the
              interface reappears and hands you a task.

              A real clinic would not give you a card. They would text you. So it
              is a message — avatar, name, unread dot, timestamp, the words — and
              the whole row is tappable, the way every message anyone has ever
              received is.

              ── AND IT DOES NOT LIVE FOREVER ──
              Once the questions are answered the message has done its job, so the
              same card becomes what the thread actually is from then on: an open
              line to the practice. Same conversation, different purpose. Leaving
              a completed task sitting on the page is how a care surface silts up
              into a to-do list. */}
          {/* ── ITEM 6 · BEHIND THE SCENES ──
              Today answers "what do I do next". This answers the quieter second
              question — "what is happening while I wait" — which is the one that
              actually causes anxiety. Separate card on purpose: a background
              process is not a task, and folding it into the next-step card would
              make waiting look like something the patient has to do. */}
          {bts && (
            <Box sx={{
              mt: 2.5, px: 2, py: 1.9, borderRadius: '18px',
              bgcolor: 'rgba(27,57,91,.03)', border: '1px solid rgba(27,57,91,.07)',
            }}>
              <Typography sx={{
                fontSize: 10, fontWeight: 700, letterSpacing: '.14em',
                textTransform: 'uppercase', color: C.ink2, mb: 1.4,
              }}>{bts.label || 'Behind the scenes'}</Typography>

              <Stack spacing={1.15}>
                {bts.steps.map((sp) => (
                  <Stack key={sp.t} direction="row" spacing={1.2} sx={{ alignItems: 'flex-start' }}>
                    <Box sx={{
                      width: 16, height: 16, borderRadius: '50%', flexShrink: 0, mt: '2px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: sp.s === 'done' ? 'rgba(39,153,91,.16)'
                        : sp.s === 'now' ? 'rgba(255,185,0,.22)' : 'rgba(27,57,91,.07)',
                    }}>
                      {sp.s === 'done'
                        ? <CheckIcon sx={{ fontSize: 10, color: C.green }} />
                        : sp.s === 'now'
                          ? <Box sx={{
                              width: 6, height: 6, borderRadius: '50%', bgcolor: C.yellowDeep,
                              animation: 'pulse 1.6s ease-in-out infinite',
                              '@keyframes pulse': {
                                '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 },
                              },
                            }} />
                          : null}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{
                        fontSize: 13.5, lineHeight: 1.4,
                        color: sp.s === 'wait' ? C.ink2 : C.deep,
                        fontWeight: sp.s === 'now' ? 600 : 400,
                      }}>{sp.t}</Typography>
                      {sp.note && (
                        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.15 }}>
                          {sp.note}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                ))}
              </Stack>

              {bts.ready && (
                <Box sx={{
                  mt: 1.75, py: 1.1, borderRadius: '11px', textAlign: 'center', cursor: 'pointer',
                  border: `1.5px solid ${C.deep}`, color: C.deep, fontSize: 13.5, fontWeight: 700,
                }}>View report</Box>
              )}
            </Box>
          )}


          {/* CONNECT WITH CLINICIAN.
              The thread that used to sit here previewed the doctor's messages
              inline, which put a conversation in the middle of a screen whose
              only job is the next action. The conversation still exists — the
              bubble top right opens it — but what belongs in this position is
              a way to reach a person, not a transcript of one. */}
          <Stack direction="row" spacing={1.4} onClick={() => setCoach(true)} sx={{
            alignItems: 'center', mt: 2.5, px: 1.9, py: 1.6, borderRadius: '18px',
            cursor: 'pointer', bgcolor: '#fff', border: '1px solid rgba(27,57,91,.08)',
            boxShadow: '0 3px 16px -11px rgba(27,57,91,.4)',
          }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              bgcolor: 'rgba(27,57,91,.06)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <ChatBubbleOutlineIcon sx={{ fontSize: 18, color: C.deep }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14, fontWeight: 650, color: C.deep }}>
                Connect with your clinician
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>
                {who.short} and the practice, any time
              </Typography>
            </Box>
            {unread && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: C.coral }} />}
          </Stack>



        </Box>
      </Shell>
    );
  }



  /* ── reviewed, waiting to be bought ── */
  if (rx.status === 'ready') {
    return (
      <Shell coach={coach} setCoach={setCoach} st={st} pKey={pKey} dispatch={dispatch}>
        <Head sub="Tuesday 28 July" title="Your protocol is ready." onTwin={() => setCoach(true)} dot={unread}
              below={switcher} />
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
          <Box onClick={() => onDetail(pKey)} sx={{
            p: 2, borderRadius: '20px', cursor: 'pointer',
            bgcolor: 'rgba(39,153,91,.08)', border: '1.5px solid rgba(39,153,91,.35)',
          }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box sx={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                bgcolor: (coachOf(pKey) || DOCTOR).tone, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,.9)',
              }}>{(coachOf(pKey) || DOCTOR).mono || ''}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>
                  {(coachOf(pKey) || DOCTOR).short || (coachOf(pKey) || DOCTOR).name} changed 2 things
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
          <Button fullWidth variant="contained" color="secondary" onClick={() => onBuy(pKey)}>
            Buy plan · SAR {p.price.toLocaleString()}
          </Button>
        </Box>
      </Shell>
    );
  }

  /* ── paid, on its way ── */
  if (rx.status === 'shipping') {
    return (
      <Shell coach={coach} setCoach={setCoach} st={st} pKey={pKey} dispatch={dispatch}>
        <Head sub="Tuesday 28 July"
              title={p.blood !== 'no' ? 'Blood test on Thursday.' : 'Arriving tomorrow, 9–11am.'}
              onTwin={() => setCoach(true)} dot={unread} />
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

          <Button fullWidth variant="text" onClick={() => dispatch({ type: 'deliver', protocol: pKey })}
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
  const streak = streakOf(rx);

  /* capture state, with notes written from what's actually true */
  const loggedBody = rx.body.some((b) => b.day === rx.day);
  const captures = capturesFor(rx, rx.day, []).map((c) => {
    if (c.k === 'doses') return { ...c, done: loggedToday,
      note: loggedToday ? 'Logged' : LOG_KINDS[kind].t };
    if (c.k === 'meals') return { ...c,
      done: rx.meals.some((m) => m.day === rx.day),
      note: c.auto ? 'From your sensor'
        : rx.meals.some((m) => m.day === rx.day) ? 'Logged' : '3 slots' };
    if (c.k === 'body') return { ...c, done: loggedBody,
      note: !c.due ? `Day ${Math.ceil(rx.day / 7) * 7 + 1}` : loggedBody ? 'Logged' : 'Weight, waist, photo' };
    return { ...c, done: rx.checkin.some((x) => x.day === rx.day),
      note: !c.due ? `Day ${Math.ceil(rx.day / 7) * 7 + 1}`
        : rx.checkin.some((x) => x.day === rx.day) ? 'Logged' : '4 questions' };
  });
  const allDone = captures.filter((c) => c.due).every((c) => c.done);
  const bodyPts = rx.body.map((b) => ({ d: b.day, v: b.kg }));
  /* Held back until there is enough to say something true. */
  const felt = rx.logs.filter((l) => l.kind === 'felt');
  const insight = rx.logs.length >= 10
    ? `You have logged ${rx.logs.length} of ${rx.day} days. ${felt.length >= 5
        ? 'Side effects clustered in week two and have not recurred since day 16.'
        : 'Consistency is high enough that the retest will be attributable to the protocol.'}`
    : null;

  /* ── retest day ──
     The last day of a twelve-week run is the biggest moment in the loop, so it
     gets the run's whole story rather than a lone button: what you did, what
     moved, and what the retest is about to read. And it books the review with
     it, because a result nobody reads back to you is just a number. */
  /* ── BOOKED, NOT READ ──
     The run is over and the numbers exist, but nobody has interpreted them. That
     gap is the entire claim of the product, so it gets its own screen instead of
     being hidden inside a spinner or collapsed into "done". */
  if (rx.status === 'reviewing') {
    return (
      <Shell coach={coach} setCoach={setCoach} st={st} pKey={pKey} dispatch={dispatch}>
        <Head sub={`Day ${rx.day} · ${p.t}`} title="Booked." onTwin={() => setCoach(true)} dot={unread} below={switcher} />
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
          <Box sx={{
            p: 2.25, borderRadius: '22px', color: '#fff',
            background: `linear-gradient(152deg,${C.deep},#12283F)`,
          }}>
            <Typography sx={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: '.18em',
              textTransform: 'uppercase', color: C.yellow,
            }}>◈ {rx.reviewSlot || 'Booked'}</Typography>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 22, fontWeight: 600, mt: 0.75,
            }}>Nothing to do until the call.</Typography>
            <Typography sx={{
              fontSize: 12.5, lineHeight: 1.6, color: 'rgba(255,255,255,.78)', mt: 1.1,
            }}>
              {p.blood !== 'no'
                ? `A nurse draws ${p.mk} at home before it. Dr. Mahmoud reads the result against day one on the call.`
                : `Dr. Mahmoud reads the run against day one on the call.`}
            </Typography>
          </Box>

          <Label sx={{ mt: 3 }}>What moved in your body</Label>
          <MovedList rows={subsystemMoves(st, pKey)} />

          <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2, lineHeight: 1.6 }}>
            You can stop logging now. The run is closed either way.
          </Typography>
        </Box>
      </Shell>
    );
  }

  /* ── READ, AND WAITING TO BE SEEN ──
     One card, one job. Everything else on this screen would compete with it. */
  if (rx.status === 'done') {
    return (
      <Shell coach={coach} setCoach={setCoach} st={st} pKey={pKey} dispatch={dispatch}>
        <Head sub={p.t} title="Your results are in." onTwin={() => setCoach(true)} dot={unread} below={switcher} />
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
          <Box onClick={() => onResults(pKey)} sx={{
            p: 2.25, borderRadius: '22px', color: '#fff', cursor: 'pointer',
            background: `linear-gradient(152deg,${C.green},${C.deep})`,
          }}>
            <Typography sx={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: '.18em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,.72)',
            }}>◈ Read by {(coachOf(pKey) || DOCTOR).name}</Typography>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 24, fontWeight: 600, mt: 0.75,
            }}>See what {p.wk} weeks did.</Typography>
            <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 1.6 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>Open your results</Typography>
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            </Stack>
          </Box>

          <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 2.5, lineHeight: 1.6 }}>
            It lives with the protocol from now on, under Completed: the plan and what
            it did, side by side.
          </Typography>

          <Box onClick={() => onGo('protocols')} sx={{
            mt: 2, px: 1.9, py: 1.6, borderRadius: '16px', cursor: 'pointer', bgcolor: '#fff',
            boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
          }}>
            <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
              <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: C.deep }}>
                Start your next loop
              </Typography>
              <ChevronRightIcon sx={{ fontSize: 18, color: C.ink2 }} />
            </Stack>
          </Box>
        </Box>
      </Shell>
    );
  }

  if (rx.status === 'verdict') {
    const adherence = Math.round((rx.logs.length / rx.day) * 100);
    const moves = subsystemMoves(st, pKey);
    const hero = heroStreams(st, pKey);
    const needsBlood = p.blood !== 'no';

    return (
      <Shell coach={coach} setCoach={setCoach} st={st} pKey={pKey} dispatch={dispatch}>
        <Head sub={`Day ${rx.day} · ${p.t}`} title="You finished it."
              onTwin={() => setCoach(true)} dot={unread} below={switcher} />
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
          {/* what you did — stated first, because they earned it */}
          <Box sx={{
            p: 2.25, borderRadius: '22px', color: '#fff',
            background: `linear-gradient(152deg,${C.deep},#12283F)`,
          }}>
            <Typography sx={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: '.18em',
              textTransform: 'uppercase', color: C.yellow,
            }}>◈ {p.wk} weeks done</Typography>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 22, fontWeight: 600, mt: 0.75,
            }}>Time to find out.</Typography>

            <Stack direction="row" sx={{ mt: 2 }}
                   divider={<Divider orientation="vertical" flexItem
                                     sx={{ borderColor: 'rgba(255,255,255,.15)' }} />}>
              {[['Adherence', `${adherence}%`],
                ['Days logged', `${rx.logs.length}`],
                ['Best streak', `${streak}`]].map(([k, v], i) => (
                <Box key={k} sx={{ flex: 1, minWidth: 0, pl: i ? 1.5 : 0, pr: 1.5 }}>
                  <Typography sx={{ fontSize: 19, fontWeight: 800, lineHeight: 1 }}>{v}</Typography>
                  <Typography sx={{
                    fontSize: 7.5, fontWeight: 800, letterSpacing: '.14em',
                    textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', mt: 0.5,
                  }}>{k}</Typography>
                </Box>
              ))}
            </Stack>

            <Typography sx={{
              fontSize: 12, lineHeight: 1.55, color: 'rgba(255,255,255,.78)', mt: 2,
              pt: 1.75, borderTop: '1px solid rgba(255,255,255,.13)',
            }}>
              {rx.logs.length >= rx.day * 0.7
                ? 'Enough of the run is logged that the result is attributable to the protocol.'
                : 'Coverage is thin, so read the result with some caution.'}
            </Typography>
          </Box>

          {/* ── WHAT MOVED ──
              Subsystems first, evidence underneath. Three raw streams in a flat
              list implied they were the result; they are proxies, and each one
              reports to exactly one subsystem. The streams this protocol is
              judged closest to are promoted above the list, because burying
              weight one tap down on a weight-loss run would be perverse. */}
          {hero.length > 0 && (
            <>
              <Label sx={{ mt: 3 }}>Tracked through the run</Label>
              <Stack direction="row" spacing={1}>
                {hero.map((h) => (
                  <Box key={h.k} sx={{
                    flex: 1, minWidth: 0, px: 1.6, py: 1.5, borderRadius: '16px', bgcolor: '#fff',
                    boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
                  }}>
                    <Typography sx={{
                      fontSize: 8.5, fontWeight: 800, letterSpacing: '.12em',
                      textTransform: 'uppercase', color: C.ink2,
                    }}>{h.t}</Typography>
                    <Stack direction="row" spacing={0.3} sx={{ alignItems: 'baseline', mt: 0.7 }}>
                      <Typography sx={{
                        fontFamily: meter, fontSize: 24, fontWeight: 700, lineHeight: 1,
                        color: h.good ? C.green : C.deep,
                      }}>{h.delta > 0 ? '+' : ''}{h.delta}</Typography>
                      <Typography sx={{ fontSize: 11, color: C.ink2 }}>{h.unit}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.5 }}>
                      {h.from} → {h.to}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </>
          )}

          {moves.length > 0 && (
            <>
              <Label sx={{ mt: 3 }}>What moved in your body</Label>
              <MovedList rows={moves} />
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 1.5, lineHeight: 1.55 }}>
                None of this is the verdict. {p.mk} is, and that needs blood.
              </Typography>
            </>
          )}

          {/* what happens next, in order */}
          <Label sx={{ mt: 3 }}>What happens next</Label>
          <Stack spacing={1.1}>
            <Step n="1" t={`Retest ${p.mk}`} s="A nurse draws it at home, same as your baseline" />
            <Step n="2" t="Dr. Mahmoud reads it against day one"
                  s="Same doctor, same numbers, side by side" />
            <Step n="3" t="You get a verdict"
                  s="It worked, it did not, or it needs longer, plainly" />
          </Stack>

          <Box sx={{
            mt: 2.25, px: 1.9, py: 1.75, borderRadius: '17px',
            bgcolor: 'rgba(255,185,0,.10)', border: `1px solid rgba(255,185,0,.4)`,
          }}>
            <Typography sx={{ fontSize: 12.5, color: C.ink, lineHeight: 1.55 }}>
              If it did not work, we say so and stop selling it to you. That is the whole point of
              running a loop instead of a subscription.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 2.25, pb: 1.5, flexShrink: 0 }}>
          {/* A protocol scored on a blood marker needs the draw before the call.
              One scored on anything else does not, and asking for blood anyway
              would be selling a test to justify a consult. */}
          <Button fullWidth variant="contained" color="secondary" onClick={() => onReview(pKey)}>
            {needsBlood ? 'Book retest and review' : 'Book your final review'}
          </Button>
          <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', mt: 1.1 }}>
            {needsBlood
              ? 'Blood draw at home, then 30 minutes to read it'
              : '30 minutes with Dr. Mahmoud to read the run'}
          </Typography>
        </Box>
      </Shell>
    );
  }

  return (
    <Shell coach={coach} setCoach={setCoach} st={st} pKey={pKey} dispatch={dispatch}>
      <Head sub={`Day ${rx.day} · ${p.t}`}
            title={allDone ? 'Everything logged.' : (() => {
              const n = captures.filter((c) => c.due && !c.done).length;
              return `${n} thing${n === 1 ? '' : 's'} to log.`;
            })()}
            onTwin={() => setCoach(true)} dot={unread} below={switcher} />
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
        <RunHero day={rx.day} total={rx.total} week={Math.ceil(rx.day / 7)} weeks={p.wk}
                 arc={arc} logs={rx.logs} milestone={milestone} streak={streak} />

        {/* ── what today asks of you ── */}
        <Label sx={{ mt: 3 }}>Capture</Label>
        <CaptureGrid items={captures} onOpen={setSheet} />

        {/* validity, not vanity */}
        <Box sx={{ mt: 1.1, px: 1.9, py: 1.6, borderRadius: '16px', bgcolor: 'rgba(27,57,91,.04)' }}>
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

        {insight && (
          <Stack direction="row" spacing={1.5} sx={{
            alignItems: 'flex-start', mt: 1.1, px: 1.9, py: 1.75, borderRadius: '17px',
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

        {/* ── doses, grouped by when — the question people actually ask ── */}
        <Label sx={{ mt: 3 }}>Doing today</Label>
        <Stack spacing={2}>
          {WHEN_ORDER.filter((w) => p.items.some((i) => i.w === w)).map((w) => (
            <Box key={w}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1 }}>
                <Box sx={{ fontSize: 13 }}>{WHEN[w].ic}</Box>
                <Typography sx={{
                  fontSize: 11, fontWeight: 800, letterSpacing: '.1em',
                  textTransform: 'uppercase', color: C.deep,
                }}>{WHEN[w].t}</Typography>
                <Typography sx={{ fontSize: 11, color: C.ink2 }}>· {WHEN[w].s}</Typography>
              </Stack>
              <Stack spacing={0.9}>
                {p.items.map((it, i) => ({ it, i })).filter(({ it }) => it.w === w)
                  .map(({ it, i }) => {
                  const on = rx.doneItems.includes(i);
                  return (
                    <Stack key={it.t} direction="row" spacing={1.5}
                           onClick={() => dispatch({ type: 'toggleItem', protocol: pKey, i })} sx={{
                      alignItems: 'center', px: 1.9, py: 1.5, borderRadius: '16px', cursor: 'pointer',
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
            </Box>
          ))}
        </Stack>

        {/* ── the numbers. Two single-series charts, never one with two scales. ── */}
        {(bodyPts.length > 1) && (
          <>
            <Label sx={{ mt: 3 }}>Your numbers</Label>
            <Stack spacing={1.1}>
              {bodyPts.length > 1 && (
                <Box sx={{ p: 2, borderRadius: '20px', bgcolor: '#fff',
                           boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)' }}>
                  <ChartHead t="Weight" v={`${bodyPts[bodyPts.length - 1].v} kg`} />
                  <Trend points={bodyPts} total={rx.total}
                         caption="Between blood draws this is the proxy." />
                </Box>
              )}
            </Stack>
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

        <Button fullWidth variant="text" onClick={() => dispatch({ type: 'advance', protocol: pKey })}
                sx={{ mt: 2, fontSize: 12.5, color: C.ink2 }}>
          Skip ahead a week →
        </Button>
      </Box>

      <LogSheet open={sheet === 'doses'} onClose={() => setSheet(null)} kind={kind} day={rx.day}
                onSave={(v) => { dispatch({ type: 'log', protocol: pKey, kind, v }); setSheet(null); }} />
      <MealSheet open={sheet === 'meals'} onClose={() => setSheet(null)} day={rx.day}
                 onSave={(v) => { dispatch({ type: 'meals', protocol: pKey, v }); setSheet(null); }} />
      <BodySheet open={sheet === 'body'} onClose={() => setSheet(null)} day={rx.day}
                 onSave={(v) => { dispatch({ type: 'body', protocol: pKey, v }); setSheet(null); }} />
      <CheckinSheet open={sheet === 'checkin'} onClose={() => setSheet(null)} day={rx.day}
                    onSave={(v) => { dispatch({ type: 'checkin', protocol: pKey, v }); setSheet(null); }} />
    </Shell>
  );
}

/* ── shared chrome ── */
function Shell({ children, coach, setCoach, st, pKey, dispatch }) {
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {children}
      <Practice open={coach} onClose={() => setCoach(false)}
                st={st} pKey={pKey} dispatch={dispatch} />
    </Box>
  );
}

/* The twin lives top-right. At the bottom it sat over the content and ate a
   row of the screen on every state. */
function Head({ sub, title, onTwin, below, dot }) {
  return (
    <Box sx={{ px: 2.25, pt: 2.5, pb: below ? 0.5 : 2, flexShrink: 0 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase', color: C.ink2,
          }}>{sub}</Typography>
          <Typography variant="h2" sx={{ color: C.deep, mt: 0.75 }}>{title}</Typography>
        </Box>
        {onTwin && (
          <Box onClick={onTwin} sx={{
            position: 'relative',
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(150deg,${C.deep},#12283F)`, color: C.yellow,
            boxShadow: '0 6px 16px -6px rgba(27,57,91,.45)',
          }}>
            <ChatBubbleOutlineIcon sx={{ fontSize: 19 }} />
            {/* The practice messaged you while you were elsewhere. Without this
                the thread only ever speaks when spoken to, which is the one
                thing a real front desk never does. */}
            {dot && (
              <Box sx={{
                position: 'absolute', top: 1, right: 1, width: 11, height: 11,
                borderRadius: '50%', bgcolor: C.yellow, border: `2px solid ${C.cream}`,
              }} />
            )}
          </Box>
        )}
      </Stack>
      {/* the run switcher, when more than one protocol is in flight */}
      {below}
    </Box>
  );
}

/* A before/after pair with the change called out — the shape people read fastest. */
function Stat({ t, from, to, delta, good }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{
      alignItems: 'center', px: 1.9, py: 1.6, borderRadius: '16px', bgcolor: '#fff',
      boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
    }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>{t}</Typography>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>{from} → {to}</Typography>
      </Box>
      <Typography sx={{
        fontSize: 14, fontWeight: 800, flexShrink: 0, color: good ? C.green : C.ink2,
      }}>{delta}</Typography>
    </Stack>
  );
}

function ChartHead({ t, v }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'baseline', mb: 1.25 }}>
      <Typography sx={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: C.deep }}>{t}</Typography>
      <Typography sx={{ fontSize: 15, fontWeight: 800, color: C.deep }}>{v}</Typography>
    </Stack>
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
