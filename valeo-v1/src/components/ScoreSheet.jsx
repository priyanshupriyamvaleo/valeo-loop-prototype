import { useState } from 'react';
import { Box, Drawer, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ZoneBar from './ZoneBar';
import ScoreMeter from './ScoreMeter';
import {
  REGIONS, LEVELS, PANELS, systemsState, inFlight, longevityScore, regionLevel,
  zoneOf,
} from '../data';
import { C, meter } from '../theme';

/**
 * THE LONGEVITY SCORE, AND THE TWELVE THINGS IT IS MADE OF
 *
 * Three depths, one tap apart, and the order is the whole argument:
 *
 *   one number  →  four subsystems  →  twelve markers with provenance
 *
 * A composite alone is the 37.3-versus-45.2 failure — a number nobody can
 * inspect. Twelve rows alone is the failure this replaced — nobody reads twelve
 * rows to find the one that matters. The score earns trust by decomposing on
 * demand, so it is never the last word, only the first.
 *
 * The subsystem row is deliberately not a plain tab bar. Each chip carries its
 * own score, delta and hairline, which makes the navigation a comparison: you
 * can see Limbs is the weak region at 53 before you tap anything. Navigation
 * that is also data costs no extra space.
 */
export default function ScoreSheet({ open, onClose, st, onAct }) {
  /* Opens on the region with the furthest to travel. There is no all-subsystems
     view any more, so the default IS an editorial choice — and the useful one is
     where the work is, not wherever the body happens to start. */
  const [tab, setTab] = useState(() => REGIONS
    .map((r) => ({ k: r.k, gap: regionLevel(r.k).peak - regionLevel(r.k).now }))
    .sort((a, b) => b.gap - a.gap)[0].k);
  const { rows } = systemsState(st);
  const total = longevityScore();

  /* which protocol is acting on each subsystem, and where it expects to land it */
  const actingOn = {};
  inFlight(st).filter((f) => f.live).forEach((f) => {
    f.hits.forEach((h) => { actingOn[h.sys] = { t: f.t, exp: h.exp }; });
  });

  const region = REGIONS.find((r) => r.k === tab);

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: {
          sx: {
            /* Fixed height, not maxHeight. The tracker count varies by subsystem
               — Limbs has two, Core has four — and letting the sheet size itself
               made it jump on every tab change, which reads as the panel
               breaking rather than as the data changing. Sized so the densest
               subsystem (Core, four trackers) fits without scrolling, and the
               list inside scrolls if a row ever wraps further than expected. */
            position: 'absolute', borderRadius: '22px 22px 0 0', height: '90%',
            bgcolor: C.paper, backgroundImage: 'none',
          },
        },
      }}>
      {/* ═══ THE COMPOSITE ═══ */}
      <Box sx={{ px: 2.25, pt: 1.5, pb: 1, flexShrink: 0 }}>
        <Stack direction="row" sx={{ alignItems: 'center', mb: -1.5 }}>
          <Typography sx={{
            flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase', color: C.ink2,
          }}>Longevity score</Typography>
          <Box onClick={onClose} sx={{ cursor: 'pointer', p: 0.5, mr: -0.75, mt: -0.5 }}>
            <CloseIcon sx={{ fontSize: 20, color: C.ink2 }} />
          </Box>
        </Stack>

        <ScoreMeter was={total.was} now={total.now} peak={total.peak} since={PANELS[0].date} />

        {/* ═══ THE FOUR SUBSYSTEMS — navigation that is also a comparison ═══ */}
        <Stack direction="row" spacing={0.75} sx={{
          overflowX: 'auto', mx: -2.25, px: 2.25, mt: 1.2, pb: 0.5,
          '&::-webkit-scrollbar': { display: 'none' },
        }}>
          {REGIONS.map((r) => {
            const lv = regionLevel(r.k);
            return (
              <Chip key={r.k} label={r.t} score={lv.now} delta={lv.now - lv.was}
                    lv={lv} zone={zoneOf(lv.now)}
                    on={tab === r.k} onClick={() => setTab(r.k)} />
            );
          })}
        </Stack>

      </Box>

      {/* ═══ THE MOVERS OF THE SELECTED SUBSYSTEM ═══ */}
      <Box sx={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', px: 2.25, pb: 3 }}>
        {(() => {
          const lv = regionLevel(region.k);
          /* biggest mover first — the question this list answers is "what
             changed", and a fixed clinical order buries the answer */
          const inside = rows.filter((r) => r.region === region.k)
            .slice()
            .sort((a, b) => (LEVELS[b.k].now - LEVELS[b.k].was) - (LEVELS[a.k].now - LEVELS[a.k].was));

          return (
            <>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1.3 }}>
                <Typography sx={{
                  flex: 1, fontSize: 8.5, fontWeight: 800, letterSpacing: '.14em',
                  textTransform: 'uppercase', color: C.ink2,
                }}>{region.t} · {inside.length} trackers</Typography>
                <Typography sx={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '.06em',
                  textTransform: 'uppercase', color: '#fff', whiteSpace: 'nowrap',
                  px: 0.7, py: 0.25, borderRadius: '5px', bgcolor: zoneOf(lv.now).c,
                }}>{zoneOf(lv.now).t}</Typography>
                <Typography sx={{
                  fontFamily: meter, fontSize: 15, fontWeight: 700, color: zoneOf(lv.now).c,
                }}>{lv.now}</Typography>
              </Stack>

              <Stack spacing={1.4}>
                {inside.map((r) => {
                  const l = LEVELS[r.k];
                  const seen = r.grade || r.said;
                  const by = actingOn[r.k];
                  return (
                    <Box key={r.k}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 0.4 }}>
                        <Typography sx={{
                          flex: 1, minWidth: 0, fontSize: 13, fontWeight: 600, color: C.deep,
                        }}>{r.t}</Typography>
                        {seen ? (
                          <>
                            {l.now > l.was && (
                              <Typography sx={{
                                fontFamily: meter, fontSize: 11.5, fontWeight: 700, color: C.green,
                              }}>+{l.now - l.was}</Typography>
                            )}
                            <Typography sx={{
                              fontFamily: meter, fontSize: 16, fontWeight: 700,
                              color: zoneOf(l.now).c,
                            }}>{l.now}</Typography>
                          </>
                        ) : (
                          <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>Not measured</Typography>
                        )}
                      </Stack>

                      {seen ? (
                        <ZoneBar was={l.was} now={l.now} peak={l.peak}
                                 exp={by ? by.exp : null} soft={r.reported} />
                      ) : (
                        <Box onClick={() => onAct(r.fix)} sx={{
                          height: 11, borderRadius: 3, cursor: 'pointer',
                          border: '1px dashed rgba(27,57,91,.22)',
                        }} />
                      )}

                      <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start', mt: 0.55 }}>
                        {/* Wraps rather than truncates. This line is the evidence
                            for the number above it, and an ellipsis here eats the
                            panel date — the part that makes the level checkable. */}
                        <Typography sx={{
                          flex: 1, minWidth: 0, fontSize: 10.5, color: C.ink2, lineHeight: 1.4,
                        }}>
                          {seen
                            ? (r.reported ? `You said ${r.said} · ${PANELS[1].date}` : `${r.ref} · ${r.src}`)
                            : r.fix.t}
                        </Typography>
                        {by ? (
                          <Typography sx={{
                            flexShrink: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.06em',
                            textTransform: 'uppercase', color: C.green, whiteSpace: 'nowrap',
                            px: 0.7, py: 0.25, borderRadius: '5px', bgcolor: 'rgba(39,153,91,.12)',
                          }}>{by.t} → {by.exp}</Typography>
                        ) : !seen ? (
                          <ChevronRightIcon sx={{ fontSize: 15, color: C.ink2, flexShrink: 0 }} />
                        ) : null}
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            </>
          );
        })()}
      </Box>
    </Drawer>
  );
}

/* A tab that is also a reading. The hairline is the same grammar as the rows
   below it, one third the height — so the row of chips ranks the four regions
   against each other without a chart. */
function Chip({ label, sub, score, delta, lv, zone, on, onClick }) {
  return (
    <Box onClick={onClick} sx={{
      flex: '0 0 auto', minWidth: 84, cursor: 'pointer', borderRadius: '13px',
      px: 1.1, py: 0.9,
      bgcolor: on ? C.deep : '#fff',
      border: `1px solid ${on ? C.deep : 'rgba(27,57,91,.1)'}`,
      boxShadow: on ? '0 3px 12px -6px rgba(27,57,91,.5)' : 'none',
      /* a hairline of the band colour, so an unselected chip still declares
         whether that region is in trouble */
      borderTop: `2.5px solid ${zone ? zone.c : 'transparent'}`,
    }}>
      <Typography sx={{
        fontSize: 8.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
        color: on ? 'rgba(255,255,255,.62)' : C.ink2,
        whiteSpace: 'nowrap',
      }}>{label}</Typography>

      {score != null ? (
        <>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline', mt: 0.25 }}>
            <Typography sx={{
              fontFamily: meter, fontSize: 19, fontWeight: 700, lineHeight: 1,
              color: on ? '#fff' : zone.c,
            }}>{score}</Typography>
            {delta > 0 && (
              <Typography sx={{
                fontSize: 9.5, fontWeight: 800,
                color: on ? '#6FD69B' : C.green,
              }}>+{delta}</Typography>
            )}
          </Stack>
          <Typography sx={{
            mt: 0.35, fontSize: 8.5, fontWeight: 700, letterSpacing: '.06em',
            textTransform: 'uppercase', whiteSpace: 'nowrap',
            color: on ? 'rgba(255,255,255,.7)' : C.ink2,
          }}>{zone.t}</Typography>
        </>
      ) : (
        <Typography sx={{
          fontSize: 11, fontWeight: 600, mt: 0.5,
          color: on ? 'rgba(255,255,255,.8)' : C.ink2, whiteSpace: 'nowrap',
        }}>{sub}</Typography>
      )}
    </Box>
  );
}

function Key({ sw, t }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
      {sw}
      <Typography sx={{ fontSize: 9.5, color: C.ink2 }}>{t}</Typography>
    </Stack>
  );
}
