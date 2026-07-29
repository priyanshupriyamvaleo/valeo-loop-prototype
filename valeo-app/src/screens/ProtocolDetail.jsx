import { Box, Button, IconButton, Stack, Typography, Divider } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckIcon from '@mui/icons-material/Check';
import HelpOutlineIcon from '@mui/icons-material/HelpOutlineOutlined';
import LockClockIcon from '@mui/icons-material/LockClock';
import AddIcon from '@mui/icons-material/Add';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FlagIcon from '@mui/icons-material/Flag';
import { PROTOCOLS, KINDS, KIND_ORDER, DOCTOR, TWINS, matchFor } from '../data';
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
export default function ProtocolDetail({ st, pKey, onBack, onConsult, onBuy }) {
  const p = PROTOCOLS[pKey];
  const tw = TWINS.find((t) => t.protocol === pKey);
  const status = st.rx && st.rx.protocol === pKey ? st.rx.status : 'saved';
  const reviewed = status === 'ready';
  const booked = status === 'booked';
  const first = tw ? tw.name.split(' ')[0] : null;

  /* Some protocols never need bloods — a consult is enough — so that step is
     absent rather than crossed out. Where the doctor has to decide, the step
     is present and undecided, then resolves on the call. */
  const needsBloods = p.blood !== 'no';

  const steps = [
    {
      t: 'Consultation with a Valeo doctor',
      s: booked ? `Booked · ${st.rx.slot}` : reviewed ? 'Done' : '30 min video call · required',
      state: reviewed ? 'done' : booked ? 'now' : 'next',
    },
    ...(needsBloods ? [{
      t: 'Blood baseline',
      s: reviewed
        ? 'Needed first — included in your package'
        : `${DOCTOR.name.split(' ')[1]} decides on the call`,
      state: reviewed ? 'next' : 'maybe',
    }] : []),
    {
      t: `Run it for ${p.wk} weeks`,
      s: `${p.items.length} things, delivered to you`,
      state: 'later',
    },
    {
      t: `Retest ${p.mk}`,
      s: 'The number that decides whether it worked',
      state: 'later',
    },
  ].map((x, i) => ({ ...x, n: i + 1 }));

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
        <Typography sx={{
          fontSize: 8.5, fontWeight: 800, letterSpacing: '.2em',
          textTransform: 'uppercase', color: C.yellow,
        }}>
          {reviewed ? '◈ Reviewed and amended' : '◈ Protocol'}
        </Typography>
        {/* whose protocol this is — the reason they swiped right */}
        {first && (
          <Typography sx={{
            fontSize: 12.5, fontWeight: 700, color: 'rgba(255,255,255,.6)', mt: 0.9,
          }}>{first}’s</Typography>
        )}
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 27, fontWeight: 600, lineHeight: 1.12,
          mt: first ? 0.2 : 0.75,
        }}>{p.t}</Typography>
        <Typography sx={{ fontSize: 13, color: 'rgba(255,255,255,.66)', mt: 0.9, lineHeight: 1.45 }}>
          {p.goal}
        </Typography>

        <Stack direction="row" sx={{ mt: 2.25 }}
               divider={<Divider orientation="vertical" flexItem
                                 sx={{ borderColor: 'rgba(255,255,255,.15)' }} />}>
          {[['Duration', `${p.wk} weeks`],
            ['Scored on', p.mk],
            ['Match', tw ? `${matchFor(tw, st)}%` : '—']].map(([k, v]) => (
            <Box key={k} sx={{ flex: 1, minWidth: 0, pr: 1.25, pl: k === 'Duration' ? 0 : 1.25 }}>
              <Typography sx={{
                fontSize: 7.5, fontWeight: 800, letterSpacing: '.14em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,.45)',
              }}>{k}</Typography>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, mt: 0.45 }}>{v}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pt: 2.5, pb: 2 }}>
        {/* ── what the doctor changed — only after the call ── */}
        {reviewed && (
          <Box sx={{
            mb: 3, p: 2, borderRadius: '20px',
            bgcolor: 'rgba(64,143,164,.09)', border: '1px solid rgba(64,143,164,.32)',
          }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1.75 }}>
              <Box component="img" src={DOCTOR.img} alt="" sx={{
                width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
              }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep }}>
                  {DOCTOR.name} changed 2 things
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
      </Box>

      {/* ── one CTA, and it changes with the state ── */}
      <Box sx={{
        px: 2.25, pt: 1.5, pb: 3, flexShrink: 0,
        borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        {booked ? (
          <>
            <Button fullWidth variant="contained" color="primary" disabled
                    sx={{ '&.Mui-disabled': { bgcolor: 'rgba(27,57,91,.12)', color: C.ink2 } }}>
              Under doctor review
            </Button>
            <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', mt: 1.25 }}>
              Your call is {st.rx.slot.toLowerCase()}. We'll open this up straight after.
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
              Book consultation and start this protocol
            </Button>
            <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', mt: 1.25 }}>
              Free · 30 minutes · a doctor has to approve this before anything ships
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
