import { Box, Button, IconButton, Stack, Typography, Divider } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckIcon from '@mui/icons-material/Check';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import LockClockIcon from '@mui/icons-material/LockClock';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FlagIcon from '@mui/icons-material/Flag';
import AutorenewRoundedIcon from '@mui/icons-material/AutorenewRounded';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Results from '../components/Results';
import Recommendation from './Recommendation';
import { PROTOCOLS, KINDS, KIND_ORDER, coachOf, CONSULT_FEE, RECOMMEND,
         statusOf, runOf, runStages, RX_ACTIVE, nextGoalAfter } from '../data';
import { C } from '../theme';

/**
 * The protocol, laid out as the loop the person is about to enter.
 *
 * Two states on one page:
 *  · before the consult — the sequence, with bloods marked undecided because
 *    hiding a possible step only makes it a surprise later
 *  · after the consult — the same page with the doctor's changes shown as a
 *    diff, which is the point: a phone call that leaves no artefact behind
 *    can't be productized. The diff is the artefact.
 */
export default function ProtocolDetail({ st, pKey, onBack, onConsult, onBuy, onTrack,
                                         onLoop, onNextGoal, view = 'plan', onView }) {
  const p = PROTOCOLS[pKey];
  /* The clinician who wrote this template. In V1 the doctor is what's being
     sold, so their name sits on the page before anything else does. */
  const coach = coachOf(pKey);
  /* This protocol's own status — asked of this protocol. It used to read from a
     single shared slot, so opening Speed's protocol while Andrew's was running
     answered with Andrew's status and Speed's read "Not started". */
  const run = runOf(st, pKey);
  const status = statusOf(st, pKey);
  const reviewed = status === 'ready';
  /* A finished protocol has two faces: the plan you agreed to, and what it did.
     Same page, because a verdict detached from what produced it is a number
     without a cause. */
  const finished = status === 'done';
  const showResults = finished && view === 'results';
  const booked = status === 'booked';
  /* Already in flight: the page stops being a sales pitch and becomes a tracker. */
  const live = ['running', 'verdict', 'reviewing'].includes(status);
  const inFlightNow = RX_ACTIVE.includes(status);
  /* A generated protocol carries the user's own name in its title ("Faisal's
     protocol"), so it has no separate author byline to show. Every other
     protocol shows who wrote it, in full — "Dr. Layla" is the reason to open
     this page over an identical-looking one from someone else. */
  const byline = p.own ? null : (coach ? coach.short : null);

  /* What the doctor would work on now. Null when the patient is already
     running it, and the footer then offers only the free choice. */
  const advised = showResults ? nextGoalAfter(pKey, st) : null;

  /* Some protocols never need bloods — a consult is enough — so that step is
     absent rather than crossed out. Where the doctor has to decide, the step
     is present and undecided, then resolves on the call. */
  const needsBloods = p.blood !== 'no';

  /* One stage list, resolved from this protocol's status — the same list before
     you buy ("here is what you are signing up for") and after ("here is where you
     are"). Two lists would drift. */
  const steps = runStages(st, pKey);

  /* ── ONE STATE BELONGS TO A DIFFERENT PAGE ──
     Once the consultation has happened and the clinician has written something
     for this person specifically, the subject of the page stops being the
     protocol and becomes the decision. Everything below still applies to
     browsing, running and reading a verdict — states where the protocol really
     is what you came to look at. See screens/Recommendation.jsx.
     Guarded on RECOMMEND rather than on `reviewed` alone: the reasoning and the
     clinician's note are authored per protocol and cannot be generated, so a
     protocol without them (the P2/P3 catalogue) has to keep the old page. The
     alternative is a blank screen the moment one of those reaches 'ready'. */
  /* Extended past `ready`: the care plan is the patient's permanent reference,
     and "open it in week six" is the point of it. A finished run still belongs
     to the protocol page, because there the subject really is the verdict. */
  if (RECOMMEND[pKey] && ['ready', 'shipping', 'running'].includes(status)) {
    return <Recommendation st={st} pKey={pKey} onBack={onBack} onBuy={onBuy}
                           onTrack={onTrack} />;
  }

  const grouped = KIND_ORDER
    .map((k) => ({ k, list: p.items.filter((i) => i.k === k) }))
    .filter((g) => g.list.length);
  const rxCount = p.items.filter((i) => KINDS[i.k].rx).length;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* ── header ── */}
      <Box sx={{
        px: 2.25, pt: 2, pb: 2.25, flexShrink: 0, color: '#fff',
        background: `linear-gradient(158deg,${C.deep},#12283F)`,
      }}>
        <IconButton onClick={onBack} size="small"
                    sx={{ ml: -0.75, mb: 1, color: 'rgba(255,255,255,.7)' }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: '.2em',
              textTransform: 'uppercase', color: C.yellow,
            }}>
              {showResults ? '◈ Results'
                : live ? `◈ Running · day ${run.day} of ${run.total}`
                  : reviewed ? '◈ Reviewed and amended' : '◈ Protocol'}
            </Typography>
          </Box>
          {/* The author, as a face. If the doctor is the product then a name in
              grey 12px is decoration — this is the one element on the page that
              says somebody wrote this and will answer for it. */}
          {coach && (
            <Box sx={{
              width: 52, height: 52, borderRadius: '15px', flexShrink: 0, overflow: 'hidden',
              bgcolor: coach.tone, position: 'relative', mt: -0.5,
              border: '1.5px solid rgba(255,255,255,.22)',
            }}>
              {coach.img ? (
                <Box component="img" src={coach.img} alt="" sx={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center 20%',
                }} />
              ) : (
                <Typography sx={{
                  position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 16, fontWeight: 800,
                  color: 'rgba(255,255,255,.92)',
                }}>{coach.mono}</Typography>
              )}
            </Box>
          )}
        </Stack>
        {/* whose protocol this is — the reason they swiped right */}
        {byline && (
          <Typography sx={{
            fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', mt: 0.9,
          }}>{byline}</Typography>
        )}
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 27, fontWeight: 600, lineHeight: 1.12,
          mt: byline ? 0.2 : 0.75,
        }}>{p.t}</Typography>
        <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,.66)', mt: 0.9, lineHeight: 1.45 }}>
          {p.goal}
        </Typography>

        <Stack direction="row" sx={{ mt: 2.25 }}
               divider={<Divider orientation="vertical" flexItem
                                 sx={{ borderColor: 'rgba(255,255,255,.15)' }} />}>
          {[['Duration', `${p.wk} weeks`],
            ['Scored on', p.mk],
            ['Runs with', coach ? coach.role : 'Built for you']].map(([k, v]) => (
            <Box key={k} sx={{ flex: 1, minWidth: 0, pr: 1.25, pl: k === 'Duration' ? 0 : 1.25 }}>
              <Typography sx={{
                fontSize: 7.5, fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,.45)',
              }}>{k}</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, mt: 0.45 }}>{v}</Typography>
            </Box>
          ))}
        </Stack>

        {/* Two faces, one page. Only appears once there is something to switch to. */}
        {finished && (
          <Stack direction="row" spacing={0.5} sx={{
            mt: 2.25, p: 0.4, borderRadius: '12px', bgcolor: 'rgba(255,255,255,.1)',
          }}>
            {[['plan', 'Protocol'], ['results', 'Results']].map(([k, label]) => (
              <Box key={k} onClick={() => onView && onView(k)} sx={{
                flex: 1, textAlign: 'center', py: 0.85, borderRadius: '9px', cursor: 'pointer',
                fontSize: 12, fontWeight: view === k ? 700 : 500,
                bgcolor: view === k ? '#fff' : 'transparent',
                color: view === k ? C.deep : 'rgba(255,255,255,.7)',
                transition: 'background-color .18s',
              }}>{label}</Box>
            ))}
          </Stack>
        )}
      </Box>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pt: 2.5, pb: 2 }}>
        {showResults ? <Results st={st} pKey={pKey} /> : (<>
        {/* ── what the doctor changed — only after the call ── */}
        {reviewed && (
          <Box sx={{
            mb: 3, p: 2, borderRadius: '20px',
            bgcolor: 'rgba(64,143,164,.09)', border: '1px solid rgba(64,143,164,.32)',
          }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.75 }}>
              <Box sx={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                bgcolor: coach ? coach.tone : C.deep, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,.9)',
              }}>{coach ? coach.mono : ''}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep }}>
                  {coach ? coach.short : 'Your clinician'} changed 2 things
                </Typography>
                <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.15 }}>
                  On your call, 24 minutes
                </Typography>
              </Box>
            </Stack>
            <Stack spacing={1}>
              {p.amend.changed.map((x) => <Amend key={x} icon={<SwapHorizIcon />} c={C.teal} t={x} />)}
              {p.amend.added.map((x) => <Amend key={x} icon={<AddIcon />} c={C.green} t={x} />)}
              {p.amend.flagged.map((x) => <Amend key={x} icon={<FlagIcon />} c={C.yellowDeep} t={x} />)}
            </Stack>
          </Box>
        )}

        {/* ── the loop, as a sequence ── */}
        <Label>How this runs</Label>
        <Box sx={{ position: 'relative', pl: 0.25 }}>
          {steps.map((s, i) => (
            <Stack key={s.n} direction="row" spacing={1.75} sx={{ position: 'relative', pb: i === steps.length - 1 ? 0 : 2.25 }}>
              {/* rail */}
              {i < steps.length - 1 && (
                <Box sx={{
                  position: 'absolute', left: 13, top: 30, bottom: 4, width: 2,
                  bgcolor: s.state === 'done' ? 'rgba(39,153,91,.35)' : 'rgba(27,57,91,.10)',
                }} />
              )}
              <Box sx={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 800,
                bgcolor: s.state === 'done' ? C.green
                  : s.state === 'now' ? C.yellow
                  : s.state === 'maybe' ? 'rgba(27,57,91,.06)'
                  : s.state === 'skip' ? 'rgba(27,57,91,.04)' : 'rgba(27,57,91,.07)',
                color: s.state === 'done' ? '#fff' : s.state === 'now' ? C.deep : C.ink2,
                border: s.state === 'maybe' ? `1.5px dashed rgba(27,57,91,.28)` : 'none',
              }}>
                {s.state === 'done' ? <CheckIcon sx={{ fontSize: 15 }} />
                  : s.state === 'maybe' ? <HelpOutlineIcon sx={{ fontSize: 15 }} />
                  : s.state === 'skip' ? '–' : s.n}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, pt: 0.35 }}>
                <Typography sx={{
                  fontSize: 14, fontWeight: 700,
                  color: s.state === 'skip' ? C.ink2 : C.deep,
                  textDecoration: s.state === 'skip' ? 'line-through' : 'none',
                }}>{s.t}</Typography>
                <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.3, lineHeight: 1.45 }}>
                  {s.s}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>

        {/* ── what's in it, typed ── */}
        <Label sx={{ mt: 3.5 }}>What's in it · {p.items.length} things</Label>
        <Stack spacing={1.1}>
          {grouped.map(({ k, list }) => (
            <Box key={k} sx={{
              borderRadius: '18px', bgcolor: '#fff', overflow: 'hidden',
              boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
            }}>
              <Stack direction="row" spacing={1.25} sx={{
                alignItems: 'center', px: 1.75, py: 1.25,
                bgcolor: KINDS[k].rx ? 'rgba(255,185,0,.10)' : 'rgba(27,57,91,.03)',
              }}>
                <Box sx={{ fontSize: 14 }}>{KINDS[k].ic}</Box>
                <Typography sx={{
                  flex: 1, fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
                  textTransform: 'uppercase', color: KINDS[k].rx ? C.yellowDeep : C.ink2,
                }}>{KINDS[k].t}</Typography>
                {KINDS[k].rx && (
                  <Typography sx={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '.1em',
                    textTransform: 'uppercase', color: C.yellowDeep,
                  }}>Needs a doctor</Typography>
                )}
              </Stack>
              {list.map((it, n) => (
                <Box key={it.t}>
                  {n > 0 && <Divider />}
                  <Box sx={{ px: 1.75, py: 1.4 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: C.deep }}>
                      {it.t}
                    </Typography>
                    <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>{it.d}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
        </Stack>

        {/* ── the honest bits ── */}
        <Label sx={{ mt: 3.5 }}>Before you commit</Label>
        <Stack spacing={1.1}>
          <Warn t="What could go wrong" s={p.risk} c={C.yellowDeep} />
          <Warn t="Who it's wrong for" s={p.wrongFor} c={C.coral} />
        </Stack>

        <Stack direction="row" spacing={1.25} sx={{
          alignItems: 'flex-start', mt: 2.25, p: 1.9, borderRadius: '17px',
          bgcolor: 'rgba(27,57,91,.04)',
        }}>
          <LockClockIcon sx={{ fontSize: 17, color: C.ink2, mt: '1px', flexShrink: 0 }} />
          <Typography sx={{ fontSize: 12, color: C.ink2, lineHeight: 1.55 }}>
            {rxCount} of these {rxCount === 1 ? 'is' : 'are'} prescription-only. Nothing ships until
            a Valeo doctor has signed it off.
          </Typography>
        </Stack>
        </>)}
      </Box>

      {/* ── one CTA, and it changes with the state ── */}
      <Box sx={{
        px: 2.25, pt: 1.5, pb: 3, flexShrink: 0,
        borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        {showResults ? (
          /* ── THE END IS A RECOMMENDATION, THEN TWO DOORS ──
             The loop closing is the one moment the patient has evidence in hand
             and nothing scheduled. A single "start another loop" button spends
             that moment asking for twelve more weeks of the same thing, which is
             a subscription wearing a report's clothes.

             What the moment is actually FOR is the doctor's judgement: this
             worked, here is what I would do now, and here is why in the numbers
             you have just read. So the advice comes first and the CTA follows
             from it.

             Two doors, because they are different things. Following the doctor
             is one. Choosing for yourself is the other, and it stays available
             at the same size as a text link rather than hidden, because a
             patient who wants something else should not have to hunt. */
          <>
            {advised && (
              <Stack direction="row" spacing={1.3} sx={{
                alignItems: 'flex-start', mb: 1.6, px: 1.5, py: 1.4,
                borderRadius: '15px', bgcolor: 'rgba(255,185,0,.09)',
                border: '1px solid rgba(224,164,0,.32)',
              }}>
                <Box sx={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                  background: coach
                    ? `linear-gradient(155deg,${coach.tone} 0%,rgba(11,21,34,.7) 145%)`
                    : C.deep,
                }}>
                  {coach && coach.img && (
                    <Box component="img" src={coach.img} alt="" sx={{
                      width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                    }} />
                  )}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: 9.5, fontWeight: 800, letterSpacing: '.13em',
                    textTransform: 'uppercase', color: C.yellowDeep,
                  }}>
                    {coach ? `${coach.short} advises` : 'Your doctor advises'}
                  </Typography>
                  <Typography sx={{
                    fontSize: 14, fontWeight: 700, color: C.deep, mt: 0.35, lineHeight: 1.3,
                  }}>
                    Work on {advised.goalLabel} next
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.4, lineHeight: 1.5 }}>
                    {advised.why}
                  </Typography>
                </Box>
              </Stack>
            )}

            {advised && (
              <Button fullWidth variant="contained" color="secondary"
                onClick={() => onNextGoal && onNextGoal(advised.pKey)}
                endIcon={<ArrowForwardIcon sx={{ fontSize: 17 }} />}
                sx={{ borderRadius: '17px', '& .MuiButton-endIcon': { ml: 1 } }}>
                View next goal
              </Button>
            )}

            <Button fullWidth variant={advised ? 'text' : 'contained'}
              color="secondary" onClick={onLoop}
              startIcon={<AutorenewRoundedIcon sx={{ fontSize: 18 }} />}
              sx={{
                mt: advised ? 0.6 : 0, borderRadius: '17px',
                fontSize: advised ? 13.5 : undefined,
                color: advised ? C.ink2 : undefined,
                '& .MuiButton-startIcon': { mr: 1 },
              }}>
              Start another goal
            </Button>

            <Typography sx={{
              fontSize: 11.5, color: C.ink2, textAlign: 'center', mt: 1, lineHeight: 1.55,
            }}>
              This loop is closed. The next one starts from these numbers.
            </Typography>
          </>
        ) : live ? (
          <>
            {/* Already running. Offering to book it again was the bug: the page
                has to become a way into the day, not back into the funnel. */}
            <Button fullWidth variant="contained" color="secondary" onClick={onTrack}>
              Track it on Today
            </Button>
            <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', mt: 1.25 }}>
              {status === 'running'
                ? `Day ${run.day} of ${run.total} · ${run.logs.length} days logged`
                : status === 'verdict' ? 'The run is over. Book the retest to close it.'
                  : `Review booked · ${run.reviewSlot}`}
            </Typography>
          </>
        ) : booked ? (
          <>
            <Button fullWidth variant="contained" color="primary" disabled
                    sx={{ '&.Mui-disabled': { bgcolor: 'rgba(27,57,91,.12)', color: C.ink2 } }}>
              Under doctor review
            </Button>
            <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', mt: 1.25 }}>
              Your call is {run.slot.toLowerCase()}. We'll open this up straight after.
            </Typography>
          </>
        ) : reviewed ? (
          <>
            <Button fullWidth variant="contained" color="secondary" onClick={onBuy}>
              Buy protocol · SAR {p.price.toLocaleString()}
            </Button>
            <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', mt: 1.25 }}>
    {p.blood !== 'no' ? 'Blood test and ' : ''}first month, delivered. Cancel any time.
            </Typography>
          </>
        ) : (
          <>
            <Button fullWidth variant="contained" color="secondary" onClick={onConsult}>
              Book {coach ? coach.short : 'a doctor'} · SAR {CONSULT_FEE}
            </Button>
            <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', mt: 1.25 }}>
              30 minutes on video. You only pay for the protocol if you decide to start it.
            </Typography>
          </>
        )}
      </Box>
    </Box>
  );
}

function Label({ children, sx }) {
  return (
    <Typography sx={{
      fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
      color: C.ink2, mb: 1.5, ...sx,
    }}>{children}</Typography>
  );
}

function Amend({ icon, c, t }) {
  return (
    <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
      <Box sx={{ color: c, mt: '1px', flexShrink: 0, display: 'flex', '& svg': { fontSize: 15 } }}>
        {icon}
      </Box>
      <Typography sx={{ fontSize: 12.5, lineHeight: 1.45, color: C.ink }}>{t}</Typography>
    </Stack>
  );
}

function Warn({ t, s, c }) {
  return (
    <Box sx={{
      px: 1.9, py: 1.6, borderRadius: '17px', bgcolor: '#fff',
      boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
      borderLeft: `3px solid ${c}`,
    }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800, color: c, letterSpacing: '.04em' }}>
        {t}
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: C.ink, mt: 0.5, lineHeight: 1.5 }}>{s}</Typography>
    </Box>
  );
}
