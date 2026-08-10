import { useState } from 'react';
import { Box, Collapse, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { C, meter } from '../theme';

/**
 * WHAT MOVED, BY SUBSYSTEM
 *
 * The old version listed Weight, HRV and Glucose as three equal rows, which read
 * as "here is your result". They are not the result — they are proxies, and each
 * one reports to exactly one subsystem. Leading with the raw streams put the
 * evidence above the finding.
 *
 * So the top level is the body: subsystems, with what each one moved. Tap one and
 * its own evidence unfolds underneath — the blood marker where there is one, and
 * the daily streams that feed it. Two levels, and the order matches how a
 * clinician would actually say it: the finding, then what it rests on.
 *
 * Streams the protocol is judged close to are promoted out of this and shown
 * above it, because burying weight one tap down on a weight-loss run would be
 * perverse. That promotion is declared per protocol, not inferred.
 */
export default function MovedList({ rows, dark }) {
  const [open, setOpen] = useState(null);

  const ink = dark ? 'rgba(255,255,255,.92)' : C.deep;
  const ink2 = dark ? 'rgba(255,255,255,.5)' : C.ink2;
  const card = dark ? 'rgba(255,255,255,.06)' : '#fff';
  const line = dark ? 'rgba(255,255,255,.1)' : C.line;

  return (
    <Stack spacing={0.9}>
      {rows.map((m) => {
        const on = open === m.k;
        const has = !!m.marker || m.evidence.length > 0;
        const up = m.delta > 0;

        return (
          <Box key={m.k} sx={{
            borderRadius: '16px', bgcolor: card, overflow: 'hidden',
            boxShadow: dark ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
            border: dark ? '1px solid rgba(255,255,255,.08)' : 'none',
          }}>
            <Stack direction="row" spacing={1.25}
                   onClick={has ? () => setOpen(on ? null : m.k) : undefined}
                   sx={{
                     alignItems: 'center', px: 1.75, py: 1.5,
                     cursor: has ? 'pointer' : 'default',
                   }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14, fontWeight: 700, color: ink }}>
                  {m.t}
                </Typography>
                <Typography sx={{ fontSize: 11.5, color: ink2, mt: 0.2 }}>
                  {/* the level is the summary; the units live one level down */}
                  {m.was} → {m.now}
                  {m.targeted ? ' · targeted' : ''}
                </Typography>
              </Box>

              <Typography sx={{
                fontFamily: meter, fontSize: 16, fontWeight: 700, flexShrink: 0,
                color: up ? (dark ? '#6FD69B' : C.green) : ink2,
              }}>{up ? '+' : ''}{m.delta}</Typography>

              {has && (
                <ExpandMoreIcon sx={{
                  fontSize: 18, color: ink2, flexShrink: 0,
                  transform: on ? 'rotate(180deg)' : 'none', transition: 'transform .2s',
                }} />
              )}
            </Stack>

            <Collapse in={on} unmountOnExit>
              <Box sx={{ px: 1.75, pb: 1.6, pt: 0.2 }}>
                <Box sx={{ borderTop: `1px solid ${line}`, pt: 1.4 }}>
                  {m.marker && (
                    <Row t={m.marker.mk} from={`${m.marker.from}${m.marker.unit}`}
                         to={`${m.marker.to}${m.marker.unit}`} good={m.marker.good}
                         tag="Blood" ink={ink} ink2={ink2} dark={dark} />
                  )}
                  {m.evidence.map((e) => (
                    <Row key={e.k} t={e.t} from={`${e.from} ${e.unit}`} to={`${e.to} ${e.unit}`}
                         good={e.good} tag="Daily" ink={ink} ink2={ink2} dark={dark} />
                  ))}
                  {!m.marker && m.reported && (
                    <Typography sx={{ fontSize: 11.5, color: ink2, lineHeight: 1.5 }}>
                      Self-reported only. A device or a panel would make this
                      measurable instead of remembered.
                    </Typography>
                  )}
                </Box>
              </Box>
            </Collapse>
          </Box>
        );
      })}
    </Stack>
  );
}

/* One piece of evidence, tagged by where it came from. Blood and daily capture
   are not the same kind of claim and the tag is what keeps them apart. */
function Row({ t, from, to, good, tag, ink, ink2, dark }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', py: 0.55 }}>
      <Typography sx={{
        flexShrink: 0, fontSize: 8, fontWeight: 800, letterSpacing: '.1em',
        textTransform: 'uppercase', color: ink2,
        px: 0.6, py: 0.25, borderRadius: '4px',
        bgcolor: dark ? 'rgba(255,255,255,.08)' : 'rgba(27,57,91,.05)',
      }}>{tag}</Typography>

      <Typography sx={{ flex: 1, minWidth: 0, fontSize: 12.5, color: ink }}>{t}</Typography>

      <Typography sx={{ fontSize: 11.5, color: ink2, whiteSpace: 'nowrap' }}>{from}</Typography>
      <Typography sx={{ fontSize: 11, color: ink2 }}>→</Typography>
      <Typography sx={{
        fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap',
        color: good ? (dark ? '#6FD69B' : C.green) : ink,
      }}>{to}</Typography>
    </Stack>
  );
}
