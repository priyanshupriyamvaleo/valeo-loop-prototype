import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { NurseMark } from '../components/Marks';
import { CONSULT_SLOTS, BLOOD_SLOTS, CONSULT_FEE, BLOOD_FEE, slotsByDay,
         immediateSlots, LINK_OPENS_MINUTES } from '../data';
import PaySheet from '../components/PaySheet';
import { C } from '../theme';

/* The three things a person weighs before agreeing to be bled at home: who
   comes, how long it takes, what it costs. Held next to the mode that needs
   them rather than in the layout. */
const BLOOD_FACTS = [
  { ic: HomeOutlinedIcon, t: 'At-home', t2: 'blood draw', s: 'We come to you' },
  { ic: ScheduleOutlinedIcon, t: 'Takes about', t2: '15 minutes', s: 'Quick & easy' },
  { ic: CheckCircleOutlineIcon, t: 'Included', s: 'in your plan' },
];

/**
 * SCHEDULING — one question, and nothing else.
 *
 * This screen used to open with "Talk it through first.", the doctor's face, a
 * video icon and a paragraph explaining what a consultation is. All of that was
 * selling, and by the time anyone arrives here the selling is finished — the
 * introduction did it. Repeating the pitch at the point of scheduling reads as a
 * product that isn't sure you were convinced.
 *
 * ── THE ENERGY DROPS ON PURPOSE ──
 * The screens before this are warm and high-effort because they are earning
 * trust. From "Continue" onward the interface should get progressively calmer,
 * then get out of the way entirely. Scheduling, payment and confirmation are
 * tasks; the moment they start emoting they slow the person down. So: no
 * portrait, no icon, no adjectives — a calendar and a footer.
 *
 * ── SHAPED LIKE A CALENDAR ──
 * Times are grouped by day and laid out as a grid, the way every booking surface
 * a person has already learned works: a restaurant, a barber, a calendar invite.
 * A vertical list of "Tomorrow · 9:00 am" rows turns picking a time into reading
 * options.
 *
 * Review mode is kept. Closing a protocol books the same way it opened, and the
 * booking experience is the part that should not vary.
 */
export default function Consult({ onBack, onBooked, mode = 'start', doc = null }) {
  const [slot, setSlot] = useState(0);
  /* Held still for as long as the screen is open. Times that slide forward
     while somebody is reading them are the reason booking screens feel like
     they are arguing with you. */
  const [soon] = useState(() => immediateSlots());
  /* Payment is an ACTION, not a destination.
     There was a review screen between this and the booking, and it asked the
     user to re-read the time, price and format they had just chosen. Airbnb,
     Uber, Calendly and Apple all skip it for the same reason: by this point the
     only thing left to say is "charge me". So the sheet comes up over the
     calendar, the way a native payment sheet does, and there is no page in
     between. */
  const [pay, setPay] = useState(false);
  /* One booking screen, three occasions. Reusing it is right — the experience of
     choosing a time should not vary — but the words have to. It was borrowing
     the results-review copy for a blood draw, which read as a screen that had
     not noticed what it was booking. */
  const M = {
    start:  { sub: 'Choose a consultation time that works for you.',
              foot: '30-minute video consultation', price: `SAR ${CONSULT_FEE}`,
              cta: `Book consultation • SAR ${CONSULT_FEE}`, pays: true, list: CONSULT_SLOTS,
              item: 'Consultation', fee: CONSULT_FEE },
    /* Paid, and on this one screen — the booking pattern only stays learnable
       if every booking behaves identically. Consistency beats novelty here. */
    bloods: { title: 'Choose a time for your blood test',
              sub: 'A nurse will come to you. Mornings only — you’ll be fasting.',
              /* No price and no payment sheet. The programme already covers
                 this draw, and charging at the door for something the patient
                 bought last week is how a programme stops feeling like one. So
                 the price row goes and the facts card answers the same
                 question without putting a number in front of a patient who
                 has already paid it. */
              badge: { t: 'Fasting required', s: 'Mornings only' },
              hero: true, facts: BLOOD_FACTS, hideFoot: true,
              trust: { t: 'Your health information is always safe with us.',
                       s: 'Secure · Private · Confidential' },
              note: 'Secure booking · No payment now',
              cta: 'Confirm my blood test', pays: false, list: BLOOD_SLOTS,
              item: 'Blood test', fee: BLOOD_FEE },
    review: { sub: 'Pick a time to go through your results together.',
              foot: '30-minute video consultation', price: 'Included',
              cta: 'Confirm', pays: false, list: CONSULT_SLOTS },
    /* The consultation itself: the next hour, nothing to pay, and no queue to
       wait in. The three times are 15 minutes apart because a real rota is
       what makes same-day care believable — "any second now" is not a time. */
    now:    { sub: doc
                ? `${doc.short} has time in the next hour. Nothing is prescribed until you have spoken.`
                : 'A doctor has time in the next hour. Nothing is prescribed until you have spoken.',
              foot: `10-minute video consultation · link opens ${LINK_OPENS_MINUTES} minutes before`,
              price: 'Included',
              cta: 'Confirm my consultation', pays: false, list: soon },
  }[mode] || {};
  const days = slotsByDay(M.list);
  const picked = M.list[slot] || M.list[0];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      <Stack direction="row" spacing={1.5} sx={{
        alignItems: 'flex-start', px: 2.25, pt: 1.75, pb: 0.5, flexShrink: 0,
      }}>
        <IconButton onClick={onBack} size="small" sx={{
          width: 36, height: 36, bgcolor: '#fff', color: C.deep, flexShrink: 0,
          boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
          '&:hover': { bgcolor: '#fff' },
        }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        {/* The one instruction that has to survive this screen. Up here it is
            read before a time is chosen; in the footer it would be read after,
            which is too late to change the answer. */}
        {M.badge && (
          <Stack direction="row" spacing={1} sx={{
            alignItems: 'center', flexShrink: 0, px: 1.4, py: 1, borderRadius: '14px',
            bgcolor: 'rgba(255,185,0,.10)', border: '1px solid rgba(224,164,0,.22)',
          }}>
            <GppGoodOutlinedIcon sx={{ fontSize: 19, color: C.yellowDeep, flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.deep, lineHeight: 1.2 }}>
                {M.badge.t}
              </Typography>
              <Typography sx={{ fontSize: 11, color: C.ink2, lineHeight: 1.2, mt: 0.15 }}>
                {M.badge.s}
              </Typography>
            </Box>
          </Stack>
        )}
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.5, pt: 1, pb: 1 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 25, fontWeight: 600,
              lineHeight: 1.15, letterSpacing: '-.015em', color: C.deep,
            }}>
              {M.title || (mode === 'now' ? 'Pick a time' : 'Choose a time')}
            </Typography>
            <Typography sx={{ fontSize: 13.5, color: C.ink2, mt: 0.85, lineHeight: 1.45 }}>
              {M.sub}
            </Typography>
          </Box>

          {/* Who is actually turning up, at the size of a face rather than of
              an icon. The rings are the only decoration on the screen and they
              exist to stop the headline sitting on empty cream. */}
          {M.hero && (
            <Box sx={{
              width: 96, height: 96, flexShrink: 0, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
              {[96, 78].map((d, i) => (
                <Box key={d} sx={{
                  position: 'absolute', width: d, height: d, borderRadius: '50%',
                  border: `1px solid rgba(224,164,0,${i === 0 ? 0.16 : 0.24})`,
                }} />
              ))}
              <Box sx={{
                width: 62, height: 62, borderRadius: '50%', bgcolor: 'rgba(255,185,0,.16)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <NurseMark size={34} />
              </Box>
            </Box>
          )}
        </Stack>

        {/* Three facts, one card. They answer the objections in the order they
            arrive: who, how long, how much. */}
        {M.facts && (
          <Stack direction="row" sx={{
            mt: 2, py: 1.5, borderRadius: '18px', bgcolor: '#fff',
            border: '1px solid rgba(27,57,91,.07)',
            boxShadow: '0 8px 24px -20px rgba(27,57,91,.5)',
          }}>
            {M.facts.map((f, i) => {
              const Ic = f.ic;
              return (
                <Box key={f.t} sx={{
                  flex: 1, minWidth: 0, px: 1, textAlign: 'center',
                  borderLeft: i === 0 ? 'none' : `1px solid ${C.line}`,
                }}>
                  <Box sx={{
                    width: 40, height: 40, borderRadius: '50%', mx: 'auto',
                    bgcolor: 'rgba(224,164,0,.13)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ic sx={{ fontSize: 21, color: C.yellowDeep }} />
                  </Box>
                  <Typography sx={{
                    fontSize: 12, fontWeight: 700, color: C.deep, mt: 0.9, lineHeight: 1.3,
                  }}>{f.t}{f.t2 ? <><br />{f.t2}</> : null}</Typography>
                  <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.35, lineHeight: 1.3 }}>
                    {f.s}
                  </Typography>
                </Box>
              );
            })}
          </Stack>
        )}

        <Stack direction="row" spacing={1} sx={{
          alignItems: 'center', mt: M.facts ? 2 : 4, mb: 1.3,
        }}>
          <Typography sx={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
            textTransform: 'uppercase', color: C.deep,
          }}>
            {mode === 'now' ? 'The next hour' : 'Available times'}
          </Typography>
          <Box sx={{ flex: 1 }} />
          <CalendarMonthOutlinedIcon sx={{ fontSize: 15, color: C.ink2 }} />
          <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
            All times are in your local time
          </Typography>
        </Stack>

        <Stack spacing={1.9}>
          {days.map((day) => (
            <Box key={day.d}>
              {/* The friendly name and the calendar date. One is warm, the
                  other is the one you could write down. */}
              <Stack direction="row" spacing={1.1} sx={{ alignItems: 'center', mb: 1 }}>
                <Box sx={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  bgcolor: 'rgba(27,57,91,.055)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: C.deep }} />
                </Box>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>
                  {day.d}
                </Typography>
                {day.times[0] && day.times[0].on && (
                  <Typography sx={{ fontSize: 13, color: C.ink2 }}>
                    · {day.times[0].on}
                  </Typography>
                )}
              </Stack>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {day.times.map((s) => {
                  const i = M.list.indexOf(s);
                  const on = slot === i;
                  return (
                    <Stack key={`${s.d}${s.t}`} direction="row" spacing={1}
                      onClick={() => setSlot(i)} sx={{
                        alignItems: 'center', justifyContent: 'center',
                        /* Two to a row, and a lone slot keeps its half rather
                           than stretching: a full-width Friday would read as a
                           more important time than the two above it. */
                        flexGrow: 0, flexShrink: 1, flexBasis: 'calc(50% - 4.4px)',
                        maxWidth: 'calc(50% - 4.4px)',
                        minWidth: 0, px: 1.5, py: 1.3,
                        borderRadius: '14px', cursor: 'pointer',
                        bgcolor: on ? C.deep : '#fff',
                        border: `1px solid ${on ? C.deep : 'rgba(27,57,91,.12)'}`,
                        boxShadow: on
                          ? '0 12px 26px -16px rgba(27,57,91,.8)'
                          : '0 6px 18px -16px rgba(27,57,91,.5)',
                        transition: 'background-color .15s, border-color .15s',
                      }}>
                      <Typography sx={{
                        fontSize: 15, fontWeight: on ? 700 : 500,
                        color: on ? '#fff' : C.deep,
                      }}>{s.t}</Typography>
                      {s.note && (
                        <Typography sx={{
                          flexShrink: 0, px: 0.85, py: 0.3, borderRadius: '7px',
                          fontSize: 10, fontWeight: 700,
                          bgcolor: on ? 'rgba(255,185,0,.22)' : 'rgba(39,153,91,.12)',
                          color: on ? C.yellow : C.green,
                        }}>{s.note}</Typography>
                      )}
                    </Stack>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Stack>

        {M.trust && (
          <Stack direction="row" spacing={1.3} sx={{
            alignItems: 'center', mt: 1.6, px: 1.5, py: 1.35, borderRadius: '16px',
            bgcolor: 'rgba(27,57,91,.045)',
          }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
              bgcolor: 'rgba(39,153,91,.13)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <GppGoodOutlinedIcon sx={{ fontSize: 18, color: C.green }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.deep, lineHeight: 1.35 }}>
                {M.trust.t}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>
                {M.trust.s}
              </Typography>
            </Box>
          </Stack>
        )}
      </Box>

      {/* ── the footer states the facts and nothing more ── */}
      <Box sx={{
        px: 2.5, pt: 1.5, pb: 2.25, flexShrink: 0,
        borderTop: M.hideFoot ? 'none' : `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        {!M.hideFoot && (
          <Stack direction="row" sx={{ alignItems: 'baseline', mb: 1.5 }}>
            <Typography sx={{ flex: 1, fontSize: 13.5, color: C.ink2 }}>
              {M.foot}
            </Typography>
            <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.deep }}>
              {M.price}
            </Typography>
          </Stack>
        )}

        <Button fullWidth variant="contained" color="secondary"
          startIcon={M.hero ? <CalendarMonthOutlinedIcon sx={{ fontSize: 19 }} /> : null}
          sx={{ borderRadius: '17px', '& .MuiButton-startIcon': { mr: 1.1 } }}
          onClick={() => (M.pays ? setPay(true) : onBooked(`${picked.d} ${picked.t}`, picked))}>
          {M.cta}
        </Button>

        {M.note && (
          <Stack direction="row" spacing={0.6} sx={{
            alignItems: 'center', justifyContent: 'center', mt: 1.3,
          }}>
            <LockOutlinedIcon sx={{ fontSize: 13, color: C.ink2 }} />
            <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>{M.note}</Typography>
          </Stack>
        )}
      </Box>

      <PaySheet open={pay} slot={picked} item={M.item} fee={M.fee}
        onClose={() => setPay(false)}
        onDone={() => onBooked(`${picked.d} ${picked.t}`, picked)} />
    </Box>
  );
}

/* The platform payment sheet, stood in for. Deliberately styled as the OS's
   rather than ours: a sheet the phone owns is the strongest possible signal
   that no further Valeo screen is coming, and that the card details never
   touch us. Authorises itself after a beat, the way Face ID does. */
