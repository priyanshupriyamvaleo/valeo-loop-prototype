import { useState } from 'react';
import { Box, Button, Chip, Drawer, Stack, Typography, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import CheckIcon from '@mui/icons-material/Check';
import Drum from './Drum';
import { MEAL_SLOTS, MEAL_CHIPS, CHECKIN, BODY_FIELDS } from '../data';
import { C } from '../theme';

/* Shared shell so all four captures feel like one thing. */
function Sheet({ open, onClose, title, sub, children, cta, onCta, disabled }) {
  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: {
          sx: {
            position: 'absolute', borderTopLeftRadius: 26, borderTopRightRadius: 26,
            maxHeight: '90%', bgcolor: C.cream, backgroundImage: 'none',
          },
        },
      }}>
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, flexShrink: 0 }}>
        <Box sx={{ width: 38, height: 4, borderRadius: 2, bgcolor: 'rgba(27,57,91,.16)',
                   mx: 'auto', mb: 2 }} />
        <Stack direction="row" sx={{ alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h3" sx={{ color: C.deep }}>{title}</Typography>
            {sub && <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 0.6 }}>{sub}</Typography>}
          </Box>
          <IconButton onClick={onClose} size="small" sx={{ color: C.ink2, mt: -0.5 }}>
            <CloseIcon sx={{ fontSize: 19 }} />
          </IconButton>
        </Stack>
      </Box>
      <Box sx={{ overflowY: 'auto', px: 2.5, pb: 1 }}>{children}</Box>
      <Box sx={{ px: 2.5, pt: 1.5, pb: 3, flexShrink: 0, borderTop: `1px solid ${C.line}` }}>
        <Button fullWidth variant="contained" color="secondary" disabled={disabled} onClick={onCta}>
          {cta}
        </Button>
      </Box>
    </Drawer>
  );
}

const chip = (on) => ({
  bgcolor: on ? C.deep : 'rgba(27,57,91,0.06)',
  color: on ? '#fff' : C.ink,
  fontWeight: on ? 600 : 500,
  '&:hover': { bgcolor: on ? C.deep : 'rgba(27,57,91,0.10)' },
});

/* ── MEALS ──
   Three slots, chips, done. Not a food diary — a diary is abandoned inside a
   week, and fifteen seconds of "roughly what was it" survives twelve. */
export function MealSheet({ open, onClose, day, onSave }) {
  const [v, setV] = useState({});
  const pick = (slot, item) => setV((p) => {
    const cur = p[slot] || [];
    return { ...p, [slot]: cur.includes(item) ? cur.filter((x) => x !== item) : [...cur, item] };
  });
  const filled = Object.values(v).filter((x) => x.length).length;

  return (
    <Sheet open={open} onClose={onClose} title="What did you eat?"
           sub={`Day ${day} · tap what was on the plate`}
           cta={filled ? `Log ${filled} meal${filled > 1 ? 's' : ''}` : 'Pick something'}
           disabled={!filled} onCta={() => onSave(v)}>
      <Stack spacing={2.5}>
        {MEAL_SLOTS.map((sl) => (
          <Box key={sl.k}>
            <Stack direction="row" sx={{ alignItems: 'baseline', mb: 1.25 }}>
              <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 700, color: C.deep }}>
                {sl.t}
              </Typography>
              {(v[sl.k] || []).length > 0 && (
                <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.green }}>
                  {v[sl.k].length} logged
                </Typography>
              )}
            </Stack>
            <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: 'wrap' }}>
              {MEAL_CHIPS.map((m) => (
                <Chip key={m} label={m} size="small" onClick={() => pick(sl.k, m)}
                      sx={{ ...chip((v[sl.k] || []).includes(m)), height: 32, fontSize: 12 }} />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
      <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2.5, lineHeight: 1.5 }}>
        Log what you remember. Nobody is marking this.
      </Typography>
    </Sheet>
  );
}

/* ── BODY ── weekly, and the only capture that takes a photo */
export function BodySheet({ open, onClose, day, onSave }) {
  const [v, setV] = useState({ kg: 95, waist: 96 });
  const [shot, setShot] = useState(false);

  return (
    <Sheet open={open} onClose={onClose} title="Body snapshot"
           sub={`Day ${day} · same time, same scale`}
           cta="Save snapshot" onCta={() => onSave({ ...v, photo: shot })}>
      <Stack direction="row" spacing={1.5}>
        {BODY_FIELDS.map((f) => (
          <Box key={f.k} sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
              color: C.ink2, textAlign: 'center', mb: 1,
            }}>{f.t}</Typography>
            <Stack direction="row">
              <Drum from={f.from} to={f.to} value={v[f.k]} suffix={f.unit} height={208}
                    onChange={(x) => setV((p) => ({ ...p, [f.k]: x }))} />
            </Stack>
          </Box>
        ))}
      </Stack>

      <Stack direction="row" spacing={1.75} onClick={() => setShot(!shot)} sx={{
        alignItems: 'center', mt: 2.5, px: 1.9, py: 1.8, borderRadius: '17px', cursor: 'pointer',
        bgcolor: shot ? 'rgba(39,153,91,.08)' : '#fff',
        border: `1.5px solid ${shot ? 'rgba(39,153,91,.35)' : 'transparent'}`,
        boxShadow: shot ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '13px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: shot ? C.green : 'rgba(27,57,91,.06)', color: shot ? '#fff' : C.ink2,
        }}>
          {shot ? <CheckIcon sx={{ fontSize: 19 }} /> : <PhotoCameraOutlinedIcon sx={{ fontSize: 19 }} />}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
            {shot ? 'Photo taken' : 'Add a photo'}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>
            Only you and your clinician see it
          </Typography>
        </Box>
      </Stack>
    </Sheet>
  );
}

/* ── CHECK-IN ── the questions a clinician asks at review, asked weekly */
export function CheckinSheet({ open, onClose, day, onSave }) {
  const [v, setV] = useState({});
  const done = CHECKIN.filter((q) => v[q.k]).length;

  return (
    <Sheet open={open} onClose={onClose} title="Weekly check-in"
           sub={`Day ${day} · four questions`}
           cta={done === CHECKIN.length ? 'Save check-in' : `${done} of ${CHECKIN.length} answered`}
           disabled={done < CHECKIN.length} onCta={() => onSave(v)}>
      <Stack spacing={2.5}>
        {CHECKIN.map((q) => (
          <Box key={q.k}>
            <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep, mb: 1.25 }}>
              {q.t}
            </Typography>
            <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: 'wrap' }}>
              {q.o.map((o) => (
                <Chip key={o} label={o} onClick={() => setV((p) => ({ ...p, [q.k]: o }))}
                      sx={chip(v[q.k] === o)} />
              ))}
            </Stack>
          </Box>
        ))}
      </Stack>
    </Sheet>
  );
}
