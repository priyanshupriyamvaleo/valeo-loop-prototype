import { useMemo, useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import VerifiedIcon from '@mui/icons-material/Verified';
import { COACHES, USER } from '../data';
import { C } from '../theme';

/*
 * BOOKING, NOT WAITING.
 *
 * The old screen dropped the patient into a live video call about fourteen
 * seconds after they arrived. That reads as a call centre: you are held until
 * somebody is free. This is the Practo and Snabbit shape instead — three real
 * times in the next hour, one tap, done — and it changes the feeling entirely,
 * because a booked time is a promise the clinic has made to you rather than a
 * queue you are standing in.
 *
 * Only three slots, only within the hour: enough choice to feel like a choice,
 * short enough that nobody drifts away before the call.
 */
const SLOT_OFFSETS = [30, 45, 60];   /* minutes from now */

const fmt = (d) => d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true })
  .replace(' ', ' ').toLowerCase();

export default function BookConsult({ onBack, onBooked, reasons = [], titration = false }) {
  const doc = COACHES.C_LAYLA;
  const [picked, setPicked] = useState(null);

  /* Computed once on arrival so the times hold still while the patient reads. */
  const slots = useMemo(() => SLOT_OFFSETS.map((mins) => {
    const at = new Date(Date.now() + mins * 60000);
    return { mins, at, label: fmt(at) };
  }), []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      <Box sx={{ px: 1.5, pt: 1.5, flexShrink: 0 }}>
        <IconButton onClick={onBack} size="small" sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 3, pb: 2 }}>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 27, fontWeight: 600,
          lineHeight: 1.15, color: C.deep, mt: 1,
        }}>
          Pick a time, {USER.first}.
        </Typography>
        <Typography sx={{ fontSize: 14.5, lineHeight: 1.55, color: C.ink2, mt: 1.25 }}>
          {titration
            ? `Ten minutes with ${doc.short} to set your dose for the month ahead, `
              + 'included in your plan. She will have read your logs before you speak.'
            : 'Ten minutes with a DHA-licensed doctor, included in your plan. Nothing to '
              + 'pay before it, and nothing is prescribed until you have spoken.'}
        </Typography>

        {/* who you are actually meeting */}
        <Stack direction="row" spacing={1.4} sx={{
          alignItems: 'center', mt: 2.5, p: 1.5, borderRadius: '16px', bgcolor: '#fff',
          boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
        }}>
          <Box sx={{
            width: 46, height: 46, borderRadius: '12px', overflow: 'hidden', flexShrink: 0,
            background: `linear-gradient(155deg,${doc.tone} 0%,rgba(11,21,34,.72) 145%)`,
          }}>
            {doc.img && <Box component="img" src={doc.img} alt="" sx={{
              width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
            }} />}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>{doc.name}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.25 }}>
              <VerifiedIcon sx={{ fontSize: 12, color: C.teal }} />
              <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>{doc.role} · {doc.reg}</Typography>
            </Stack>
          </Box>
        </Stack>

        <Typography sx={{
          fontSize: 10.5, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
          color: C.yellowDeep, mt: 3, mb: 1.25,
        }}>Today</Typography>

        <Stack spacing={1}>
          {slots.map((s) => {
            const on = picked === s.mins;
            return (
              <Stack key={s.mins} direction="row" onClick={() => setPicked(s.mins)} sx={{
                alignItems: 'center', px: 2, py: 1.75, borderRadius: '16px', cursor: 'pointer',
                bgcolor: '#fff',
                border: `1.5px solid ${on ? C.yellow : 'rgba(27,57,91,.12)'}`,
                boxShadow: on ? '0 10px 26px -18px rgba(224,164,0,.7)' : 'none',
                transition: 'border-color .18s, box-shadow .18s',
              }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontFamily: '"Fraunces", serif', fontSize: 20, fontWeight: 600, color: C.deep,
                  }}>{s.label}</Typography>
                  <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.25 }}>
                    in {s.mins} minutes · 10 minutes with {doc.short}
                  </Typography>
                </Box>
                <Box sx={{
                  width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: on ? C.green : 'transparent',
                  border: on ? 'none' : '1.5px solid rgba(27,57,91,.18)',
                }}>
                  {on && <CheckIcon sx={{ fontSize: 15, color: '#fff' }} />}
                </Box>
              </Stack>
            );
          })}
        </Stack>

        <Typography sx={{ fontSize: 12, color: C.ink2, mt: 2, lineHeight: 1.6 }}>
          Your link opens on the Today screen ten minutes before, and we will remind you.
          {reasons.length > 0 && ' The doctor already has your answers.'}
        </Typography>
      </Box>

      <Box sx={{
        flexShrink: 0, px: 3, pt: 1.5, pb: 3,
        borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        <Stack direction="row" spacing={1} onClick={() => picked && onBooked(
          slots.find((s) => s.mins === picked))} sx={{
          alignItems: 'center', justifyContent: 'center',
          py: 1.55, borderRadius: '999px',
          bgcolor: picked ? C.deep : 'rgba(27,57,91,.18)',
          color: '#fff', cursor: picked ? 'pointer' : 'default',
          transition: 'background-color .18s',
        }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 600 }}>
            {picked ? `Confirm ${slots.find((s) => s.mins === picked).label}` : 'Choose a time'}
          </Typography>
          {picked && <ArrowForwardIcon sx={{ fontSize: 18 }} />}
        </Stack>
      </Box>
    </Box>
  );
}
