import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { CONSULT_SLOTS, BLOOD_SLOTS, CONSULT_FEE, BLOOD_FEE, slotsByDay } from '../data';
import PaySheet from '../components/PaySheet';
import { C } from '../theme';

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
export default function Consult({ onBack, onBooked, mode = 'start' }) {
  const [slot, setSlot] = useState(0);
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
    bloods: { sub: 'A nurse will come to you. Mornings only — you’ll be fasting.',
              /* No price and no payment sheet. The programme already covers
                 this draw, and charging at the door for something the patient
                 bought last week is how a programme stops feeling like one. */
              foot: 'Home blood draw · about 15 minutes', price: 'Included',
              cta: 'Confirm my blood test', pays: false, list: BLOOD_SLOTS,
              item: 'Blood test', fee: BLOOD_FEE },
    review: { sub: 'Pick a time to go through your results together.',
              foot: '30-minute video consultation', price: 'Included',
              cta: 'Confirm', pays: false, list: CONSULT_SLOTS },
  }[mode] || {};
  const days = slotsByDay(M.list);
  const picked = M.list[slot] || M.list[0];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      <Stack direction="row" sx={{ alignItems: 'center', px: 2.25, pt: 2, pb: 0.5, flexShrink: 0 }}>
        <IconButton onClick={onBack} size="small" sx={{ ml: -0.5, color: C.deep }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.75, pt: 1.5, pb: 2 }}>
        <Typography variant="h2" sx={{ color: C.deep }}>
          Choose a time
        </Typography>
        <Typography sx={{ fontSize: 14.5, color: C.ink2, mt: 1, lineHeight: 1.5 }}>
          {M.sub}
        </Typography>

        <Typography sx={{
          fontSize: 10, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase',
          color: C.ink2, mt: 4, mb: 2,
        }}>
          Available times
        </Typography>

        <Stack spacing={2.75}>
          {days.map((day) => (
            <Box key={day.d}>
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep, mb: 1.25 }}>
                {day.d}
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {day.times.map((s) => {
                  const i = M.list.indexOf(s);
                  const on = slot === i;
                  return (
                    <Box key={`${s.d}${s.t}`} onClick={() => setSlot(i)} sx={{
                      px: 2, py: 1.1, borderRadius: '12px', cursor: 'pointer',
                      minWidth: 98, textAlign: 'center',
                      bgcolor: on ? C.deep : '#fff',
                      border: `1px solid ${on ? C.deep : 'rgba(27,57,91,.14)'}`,
                      transition: 'background-color .15s, border-color .15s',
                    }}>
                      <Typography sx={{
                        fontSize: 14.5, fontWeight: on ? 700 : 500,
                        color: on ? '#fff' : C.deep,
                      }}>{s.t}</Typography>
                      {s.note && (
                        <Typography sx={{
                          fontSize: 10, mt: 0.15, fontWeight: 600,
                          color: on ? 'rgba(255,255,255,.72)' : C.green,
                        }}>{s.note}</Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* ── the footer states the facts and nothing more ── */}
      <Box sx={{
        px: 2.75, pt: 1.75, pb: 3, flexShrink: 0,
        borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        <Stack direction="row" sx={{ alignItems: 'baseline', mb: 1.5 }}>
          <Typography sx={{ flex: 1, fontSize: 13.5, color: C.ink2 }}>
            {M.foot}
          </Typography>
          <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.deep }}>
            {M.price}
          </Typography>
        </Stack>

        <Button fullWidth variant="contained" color="secondary"
          onClick={() => (M.pays ? setPay(true) : onBooked(`${picked.d} ${picked.t}`))}>
          {M.cta}
        </Button>
      </Box>

      <PaySheet open={pay} slot={picked} item={M.item} fee={M.fee}
        onClose={() => setPay(false)}
        onDone={() => onBooked(`${picked.d} ${picked.t}`)} />
    </Box>
  );
}

/* The platform payment sheet, stood in for. Deliberately styled as the OS's
   rather than ours: a sheet the phone owns is the strongest possible signal
   that no further Valeo screen is coming, and that the card details never
   touch us. Authorises itself after a beat, the way Face ID does. */
