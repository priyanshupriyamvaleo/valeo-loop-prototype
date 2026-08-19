import { useEffect, useRef, useState } from 'react';
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckIcon from '@mui/icons-material/Check';
import ListIcon from '@mui/icons-material/FormatListBulleted';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import { PROTOCOLS, RECOMMEND, coachOf, givenNameOf, DOCTOR, statusOf,
         includedIn, careJourney, planStatus, nextOnPlan, treatmentStatus,
         outlookFor, markersFor } from '../data';
import { C, meter } from '../theme';

/* A colour per marker family, decided once. Four identical gold discs would
   turn four findings back into a list. */
const MARKER_ICONS = {
  heart: FavoriteBorderIcon, drop: WaterDropOutlinedIcon,
  scale: MonitorWeightOutlinedIcon, bolt: BoltOutlinedIcon,
};
const MARKER_TONES = {
  heart: { bg: 'rgba(233,79,95,.11)', fg: '#D2404F' },
  drop: { bg: 'rgba(64,143,164,.13)', fg: C.teal },
  scale: { bg: C.greenSoft, fg: C.green },
  bolt: { bg: 'rgba(224,164,0,.14)', fg: C.yellowDeep },
};

/* Where a timeline step sits relative to now, in one word. Only the steps
   around the present get one: labelling week 12 "Later" tells nobody
   anything they could not see from its position in the list. */
function stagePill(s, i, firstNext) {
  if (s.state === 'done') return { t: 'Done', bg: C.greenSoft, fg: C.green };
  if (s.state === 'now') return { t: 'Today', bg: 'rgba(64,143,164,.14)', fg: C.teal };
  if (i === firstNext) return { t: 'Next', bg: 'rgba(255,185,0,.18)', fg: C.yellowDeep };
  return null;
}

/**
 * YOUR CARE PLAN — the permanent reference for a course of treatment.
 *
 * Three passes to get here, and the last one changed what the page IS.
 *
 * v1 was a protocol catalogue: dark hero, metadata strip, typed inventory, Buy.
 * v2 put the clinical reasoning first and read as a letter — right instinct,
 * but it was written for one reading, on the day the plan arrived.
 * v3 made it a structured document with accordions, which is what you build
 * when you are still thinking of it as something to be read.
 *
 * It isn't. The consultation already did the convincing; this is what the
 * patient opens in week six to check whether they are meant to be taking
 * something yet. That is a lookup, not a read, and the two want opposite
 * layouts.
 *
 * ── WHY THE ACCORDIONS WENT ──
 * Collapsing is right for a document you read once and never revisit: it keeps
 * the first screen calm. It is exactly wrong for a reference, because every
 * lookup now costs a tap, and worse, the thing you want is invisible until you
 * guess which drawer it is behind. Recognition beats recall — so everything is
 * open, and the calm comes from spacing and hierarchy instead of from hiding.
 *
 * ── TWO LAYERS ──
 * Level 1 answers "where am I" in about five seconds and without scrolling:
 * name, clinician, date, status, duration, then three tiles — goals, what I am
 * taking, what happens next. Level 2 is the reference underneath, one question
 * per section, each independently scannable.
 *
 * The tiles are derived from the same resolvers the sections below render, so
 * the summary cannot drift from the detail. `nextOnPlan` is literally the first
 * unfinished row of the timeline further down the page.
 *
 * ── ONE THING KEPT FROM v2 ──
 * The reasoning. It is not in the brief's section list, but the brief also
 * says the patient should be able to return months later and answer "why did
 * Jamie choose this?" — so it survives, compressed from three paragraphs to
 * three labelled lines, inside Treatment where the question actually occurs.
 *
 * ── THE PAGE OUTLIVES THE PURCHASE ──
 * It now renders for ready / shipping / running rather than only the moment
 * before payment, because "open it six weeks in" is the whole premise. The
 * footer follows: it sells once, and after that it is a way back to Today.
 */

const SECTIONS = [
  { id: 'top',       t: 'Overview' },
  { id: 'goals',     t: 'Goals' },
  { id: 'treatment', t: 'Treatment' },
  { id: 'timeline',  t: 'Timeline' },
  { id: 'included',  t: 'Included' },
  { id: 'know',      t: 'Things to know' },
  { id: 'note',      t: 'Jamie’s note' },
];

export default function Recommendation({ st, pKey, onBack, onBuy, onTrack }) {
  const p = PROTOCOLS[pKey];
  const c = coachOf(pKey) || DOCTOR;
  const first = givenNameOf(c);
  const rec = RECOMMEND[pKey];

  const [toc, setToc] = useState(false);
  const scroller = useRef(null);
  const marks = useRef({});
  const [inn, setInn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setInn(true), 40); return () => clearTimeout(t); }, []);

  if (!p || !rec) return null;

  const status = statusOf(st, pKey);
  const started = status !== 'ready';
  const journey = careJourney(st, pKey);
  const included = includedIn(st, pKey);
  const next = nextOnPlan(st, pKey);
  const txStatus = treatmentStatus(st, pKey);
  const outlook = outlookFor(pKey);
  const markers = markersFor(pKey);
  /* The first step that has not happened. Everything downstream of it is
     "later", and only this one earns the "Next" mark. */
  const firstNext = journey.findIndex((s) => s.state !== 'done');

  /* A smooth scroll requested while the tab is hidden is silently dropped and
     the page is left where it was. Ask for smooth, snap if nothing moved. */
  const goTo = (id) => {
    setToc(false);
    setTimeout(() => {
      const el = marks.current[id];
      const box = scroller.current;
      if (!el || !box) return;
      /* rect delta, not offsetTop — the nearest positioned ancestor is the
         phone frame, so offsetTop carries the header's height with it */
      const top = Math.max(0, box.scrollTop
        + (el.getBoundingClientRect().top - box.getBoundingClientRect().top) - 14);
      const from = box.scrollTop;
      box.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => {
        if (box.scrollTop === from && Math.abs(from - top) > 2) box.scrollTop = top;
      }, 420);
    }, 60);
  };

  const mark = (id) => (el) => { marks.current[id] = el; };

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column', position: 'relative',
      bgcolor: C.cream,
    }}>
      <Stack direction="row" spacing={1} sx={{
        alignItems: 'center', px: 1.5, pt: 1.5, pb: 0.5, flexShrink: 0,
      }}>
        <IconButton onClick={onBack} size="small" sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" spacing={0.7} onClick={() => setToc(true)} sx={{
          alignItems: 'center', cursor: 'pointer', px: 1.35, py: 0.7, mr: 1,
          borderRadius: '999px', border: '1px solid rgba(27,57,91,.14)', bgcolor: '#fff',
          boxShadow: '0 2px 10px -7px rgba(27,57,91,.4)',
        }}>
          <ListIcon sx={{ fontSize: 15, color: C.ink2 }} />
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: C.deep }}>
            Sections
          </Typography>
        </Stack>
      </Stack>

      <Box ref={scroller} sx={{
        flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2,
        opacity: inn ? 1 : 0,
        transform: inn ? 'none' : 'translateY(10px)',
        transition: 'opacity .4s cubic-bezier(.2,.9,.25,1), transform .45s cubic-bezier(.2,.9,.25,1)',
      }}>
        {/* ══ LEVEL 1 · where am I ══════════════════════════════════════ */}
        <Box ref={mark('top')}>
          {/* The programme name becomes the eyebrow and the headline becomes
              what the page actually is. "Longevity" describes the product;
              "Your personalised plan" describes the thing the patient is
              holding, which is what they came here to read. */}
          <Typography sx={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase', color: C.ink2, mt: 0.5,
          }}>{p.t} programme</Typography>
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 29, fontWeight: 600,
            lineHeight: 1.12, letterSpacing: '-.015em', color: C.deep, mt: 0.9,
          }}>Your personalised plan</Typography>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.4 }}>
            <Box sx={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
            }}>
              {c.img && <Box component="img" src={c.img} alt="" sx={{
                width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
              }} />}
            </Box>
            {/* His title, not his first name. The byline on a medical plan is
                a credential, and this is the only line on the page that says
                who is accountable for it. */}
            <Typography sx={{ fontSize: 12.5, color: C.ink2 }}>
              {c.short} · 28 July · {p.wk} weeks
            </Typography>
          </Stack>

          <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.7, mt: 1.6,
            px: 1.25, py: 0.55, borderRadius: '999px',
            bgcolor: started ? 'rgba(39,153,91,.12)' : 'rgba(255,185,0,.18)',
          }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: '50%',
              bgcolor: started ? C.green : C.yellowDeep,
            }} />
            <Typography sx={{
              fontSize: 12, fontWeight: 700,
              color: started ? C.green : C.yellowDeep,
            }}>{planStatus(st, pKey)}</Typography>
          </Box>
        </Box>

        {/* three tiles · goals, what I'm taking, what's next */}
        {/* Every goal, not a preview of them. A "Goals" section repeating this
            list verbatim two inches below was the one place the page still
            looked like a document with a summary bolted on top — so the tile
            became the canonical answer and the section went. */}
        {/* ── WHERE YOU ARE, AND WHERE THIS GOES ──
            The first thing on the page after "who wrote this" should be the
            reason to read the rest of it. Two scores and the distance between
            them do that in one glance; the goals list that used to sit here
            said the same thing in four sentences and needed reading. The list
            is still on the page, under Goals, for anyone who wants the words. */}
        {outlook && (
          <Tile ref={mark('outlook')} sx={{ mt: 2.25 }}>
            <TileLabel>{outlook.title}</TileLabel>
            <Stack direction="row" sx={{ alignItems: 'center', mt: 1.5 }}>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>Current score</Typography>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: 'baseline', mt: 0.2 }}>
                  <Typography sx={{
                    fontFamily: meter, fontSize: 30, fontWeight: 700, color: C.deep, lineHeight: 1,
                  }}>{outlook.now}</Typography>
                  <Typography sx={{ fontSize: 12, color: C.ink2 }}>/ 100</Typography>
                </Stack>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C.yellowDeep, mt: 0.5 }}>
                  {outlook.nowLabel}
                </Typography>
              </Box>

              {/* Twelve bars, amber turning green. Not a chart — there is no
                  data between the two numbers, and drawing a line as though
                  there were would be inventing a trajectory nobody measured. */}
              <Stack sx={{ alignItems: 'center', px: 1.25, flexShrink: 0 }}>
                <Stack direction="row" spacing={0.35} sx={{ alignItems: 'flex-end', height: 34 }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <Box key={i} sx={{
                      width: 4, borderRadius: '2px',
                      height: `${28 + i * 6}%`,
                      bgcolor: i < 6 ? C.yellow : C.green,
                      opacity: i < 6 ? 1 : 0.35 + (i - 5) * 0.11,
                    }} />
                  ))}
                </Stack>
                <ArrowForwardIcon sx={{ fontSize: 15, color: C.ink2, mt: 0.75 }} />
              </Stack>

              <Box sx={{
                flex: 1, minWidth: 0, textAlign: 'right',
                borderLeft: `1px solid ${C.line}`, pl: 1.25,
              }}>
                <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>Expected score</Typography>
                <Stack direction="row" spacing={0.5}
                  sx={{ alignItems: 'baseline', mt: 0.2, justifyContent: 'flex-end' }}>
                  <Typography sx={{
                    fontFamily: meter, fontSize: 30, fontWeight: 700, color: C.deep, lineHeight: 1,
                  }}>{outlook.expected}</Typography>
                  <Typography sx={{ fontSize: 12, color: C.ink2 }}>/ 100</Typography>
                </Stack>
                <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C.green, mt: 0.5 }}>
                  {outlook.expLabel}
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1.2} sx={{
              alignItems: 'center', mt: 1.75, px: 1.4, py: 1.2,
              borderRadius: '13px', bgcolor: 'rgba(39,153,91,.07)',
            }}>
              <GppGoodOutlinedIcon sx={{ fontSize: 19, color: C.green, flexShrink: 0 }} />
              <Typography sx={{ flex: 1, fontSize: 12.5, lineHeight: 1.4, color: C.deep }}>
                {outlook.note}
              </Typography>
              <Typography onClick={() => goTo('know')} sx={{
                flexShrink: 0, fontSize: 12, fontWeight: 700, color: C.green,
                textDecoration: 'underline', cursor: 'pointer',
              }}>Learn more</Typography>
            </Stack>
          </Tile>
        )}

        {/* ── THE PROMISE IN UNITS ──
            Four markers, each with the number it is today and the number this
            plan is aiming at. A target with no baseline beside it is marketing;
            the pair is a commitment somebody can be held to. */}
        {markers && (
          <Tile ref={mark('markers')} sx={{ mt: 1.25 }}>
            <Stack direction="row" sx={{ alignItems: 'center' }}>
              <TileLabel>Key markers we’ll improve</TileLabel>
              <Box sx={{ flex: 1 }} />
              <Typography onClick={() => goTo('included')} sx={{
                fontSize: 11.5, fontWeight: 700, color: C.yellowDeep, cursor: 'pointer',
              }}>View all markers →</Typography>
            </Stack>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', mt: 1.5 }}>
              {markers.map((m, i) => {
                const tone = MARKER_TONES[m.ic] || MARKER_TONES.heart;
                const Ic = MARKER_ICONS[m.ic] || FavoriteBorderIcon;
                return (
                  /* Baseline and target STACKED, not side by side. Laid out in a
                     row they were 132px of text in a 120px column, and
                     "128 mg/dL" arrived as "128 mg/d". A clipped clinical value
                     is worse than no value. */
                  <Box key={m.t} sx={{
                    width: '50%', py: 1.25,
                    pl: i % 2 ? 1.25 : 0, pr: i % 2 ? 0 : 1.25,
                    borderLeft: i % 2 ? `1px solid ${C.line}` : 'none',
                    borderTop: i > 1 ? `1px solid ${C.line}` : 'none',
                  }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Box sx={{
                        width: 28, height: 28, borderRadius: '50%', flexShrink: 0, bgcolor: tone.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ic sx={{ fontSize: 15, color: tone.fg }} />
                      </Box>
                      <Typography sx={{
                        flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 700, color: C.deep,
                      }}>{m.t}</Typography>
                    </Stack>

                    <Stack spacing={0.3} sx={{ mt: 0.85 }}>
                      <Stack direction="row" spacing={0.8} sx={{ alignItems: 'baseline' }}>
                        <Typography sx={{ width: 40, flexShrink: 0, fontSize: 9.5, color: C.ink2 }}>
                          Baseline
                        </Typography>
                        <Typography sx={{ flex: 1, fontSize: 11.5, color: C.deep }}>
                          {m.base}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.8} sx={{ alignItems: 'baseline' }}>
                        <Typography sx={{ width: 40, flexShrink: 0, fontSize: 9.5, color: C.ink2 }}>
                          Target
                        </Typography>
                        <Typography sx={{
                          flex: 1, fontSize: 11.5, fontWeight: 700, color: C.green,
                        }}>{m.target}</Typography>
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Box>
          </Tile>
        )}

        <Box sx={{ display: 'flex', gap: 1.25, mt: 1.25 }}>
          <Tile sx={{ flex: 1, minWidth: 0 }}>
            <TileLabel>Your treatment</TileLabel>
            <Stack direction="row" spacing={1.1} sx={{ alignItems: 'flex-start', mt: 1.25 }}>
              <Box sx={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                bgcolor: 'rgba(224,164,0,.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MedicationOutlinedIcon sx={{ fontSize: 19, color: C.yellowDeep }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{
                  fontSize: 15, fontWeight: 700, color: C.deep, lineHeight: 1.2,
                }}>{rec.lead.t}</Typography>
                <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.4, lineHeight: 1.4 }}>
                  {rec.lead.dose}
                </Typography>
              </Box>
            </Stack>
            {/* Duration and status as a two-row table. As sentences they read as
                small print; as labelled rows they read as facts you can look up
                in week six, which is what this page is for. */}
            <Box sx={{ mt: 1.4, pt: 1.2, borderTop: `1px solid ${C.line}` }}>
              {[['Duration', `${p.wk} weeks`], ['Status', txStatus]].map(([k, v], n) => (
                <Stack key={k} direction="row" spacing={1} sx={{
                  alignItems: 'baseline', pt: n ? 0.8 : 0,
                }}>
                  <Typography sx={{ flex: 1, fontSize: 11.5, color: C.ink2 }}>{k}</Typography>
                  <Typography sx={{
                    flexShrink: 0, fontSize: 11.5, fontWeight: 700, color: C.deep, textAlign: 'right',
                  }}>{v}</Typography>
                </Stack>
              ))}
            </Box>
          </Tile>

          {/* Reads off the timeline below rather than duplicating its logic —
              a summary that can disagree with the detail is worse than none. */}
          <Tile sx={{ flex: 1, minWidth: 0 }}>
            <TileLabel>Next step</TileLabel>
            {next ? (
              <>
                <Stack direction="row" spacing={1.1} sx={{ alignItems: 'flex-start', mt: 1.25 }}>
                  <Box sx={{
                    width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                    bgcolor: C.greenSoft,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <CalendarMonthOutlinedIcon sx={{ fontSize: 18, color: C.green }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                      fontSize: 15, fontWeight: 700, color: C.deep, lineHeight: 1.2,
                    }}>{next.t}</Typography>
                    <Typography sx={{
                      fontSize: 11.5, mt: 0.4, lineHeight: 1.4,
                      color: next.when ? C.deep : C.ink2,
                      fontWeight: next.when ? 600 : 400,
                    }}>{next.when || next.s}</Typography>
                  </Box>
                </Stack>
                {/* Only where a parcel is what happens next. "Usually" because
                    we do not control the courier and should not pretend to. */}
                {next.ship && (
                  <Stack direction="row" spacing={1} sx={{
                    alignItems: 'center', mt: 1.4, px: 1.1, py: 1,
                    borderRadius: '11px', bgcolor: 'rgba(39,153,91,.07)',
                  }}>
                    <LocalShippingOutlinedIcon sx={{ fontSize: 17, color: C.green, flexShrink: 0 }} />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C.deep, lineHeight: 1.3 }}>
                        Usually delivered
                      </Typography>
                      <Typography sx={{ fontSize: 11, color: C.ink2, lineHeight: 1.3 }}>
                        {next.ship}
                      </Typography>
                    </Box>
                  </Stack>
                )}
              </>
            ) : (
              <Typography sx={{ fontSize: 14, color: C.ink2, mt: 1 }}>
                Nothing outstanding
              </Typography>
            )}
          </Tile>
        </Box>

        {/* ══ LEVEL 2 · the reference ═══════════════════════════════════ */}
        <Head r={mark('treatment')}>Treatment</Head>
        <Tile sx={{ p: 0 }}>
          <Box sx={{ px: 2, pt: 2, pb: 1.75 }}>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 23, fontWeight: 600,
              lineHeight: 1.2, color: C.deep,
            }}>{rec.lead.t}</Typography>
            <Stack spacing={0.6} sx={{ mt: 1.1 }}>
              {rec.lead.lines.map((l) => (
                <Typography key={l} sx={{ fontSize: 14.5, lineHeight: 1.5, color: C.ink }}>
                  {l}
                </Typography>
              ))}
            </Stack>
          </Box>
          <Box sx={{ borderTop: `1px solid ${C.line}` }}>
            {[['Dosage', rec.lead.dose],
              ['Duration', `${p.wk} weeks`],
              ['Status', txStatus]].map(([k, v], n) => (
              <Stack key={k} direction="row" spacing={1.5} sx={{
                px: 2, py: 1.15, alignItems: 'baseline',
                borderTop: n ? `1px solid ${C.line}` : 'none',
              }}>
                <Typography sx={{ width: 74, flexShrink: 0, fontSize: 12.5, color: C.ink2 }}>
                  {k}
                </Typography>
                <Typography sx={{ flex: 1, fontSize: 13.5, fontWeight: 600, color: C.deep }}>
                  {v}
                </Typography>
              </Stack>
            ))}
          </Box>
        </Tile>

        {/* ── THE GOALS, IN WORDS ──
            These used to open the page. The outlook card and the markers grid
            now say the same thing in numbers, which is what a patient wants at
            the top; the sentences are what they want when they come back to ask
            "what were we actually trying to do". So the list stayed and only
            moved. */}
        <Head r={mark('goals')}>Our goals</Head>
        <Tile>
          <Stack spacing={0.85}>
            {rec.goals.map((g) => (
              <Stack key={g} direction="row" spacing={1.1} sx={{ alignItems: 'flex-start' }}>
                <CheckIcon sx={{ fontSize: 14, color: C.yellowDeep, flexShrink: 0, mt: '2px' }} />
                <Typography sx={{ flex: 1, fontSize: 14, lineHeight: 1.35, color: C.deep }}>
                  {g}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Tile>

        {/* The reasoning, compressed. Three labels and three lines — enough to
            answer "why this?" on a re-read without becoming something to read. */}
        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
          color: C.ink2, mt: 3, mb: 1.4,
        }}>Why this</Typography>
        <Stack spacing={1.6}>
          {[['Symptoms', rec.why.symptoms],
            ['Priorities', rec.why.priorities],
            ['Approach', rec.why.approach]].map(([h, t]) => (
            <Box key={h}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.yellowDeep }}>
                {h}
              </Typography>
              <Typography sx={{ fontSize: 14.5, lineHeight: 1.45, color: C.deep, mt: 0.3 }}>
                {t}
              </Typography>
            </Box>
          ))}
        </Stack>

        <Head r={mark('timeline')}>Timeline</Head>
        <Box>
          {journey.map((s, i) => (
            <Stack key={s.t} direction="row" spacing={1.9}
              sx={{ position: 'relative', pb: i === journey.length - 1 ? 0 : 2.3 }}>
              {i < journey.length - 1 && (
                <Box sx={{
                  position: 'absolute', left: 10, top: 24, bottom: 2, width: 1.5,
                  bgcolor: s.state === 'done' ? 'rgba(39,153,91,.3)' : 'rgba(27,57,91,.10)',
                }} />
              )}
              <Box sx={{
                width: 21, height: 21, borderRadius: '50%', flexShrink: 0, zIndex: 1, mt: '2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: s.state === 'done' ? C.green : s.state === 'now' ? C.yellow : C.cream,
                border: s.state === 'next'
                  ? `1.5px solid ${s.state === 'next' && i === firstNext ? C.yellowDeep : 'rgba(27,57,91,.18)'}`
                  : 'none',
              }}>
                {s.state === 'done' && <CheckIcon sx={{ fontSize: 12, color: '#fff' }} />}
                {/* The first step still to come gets its number. Every other
                    pending step gets an empty ring, because counting the ones
                    beyond the next one is not information the patient can use. */}
                {i === firstNext && s.state !== 'done' && (
                  <Typography sx={{
                    fontFamily: meter, fontSize: 11, fontWeight: 700,
                    color: s.state === 'now' ? C.deep : C.yellowDeep,
                  }}>{i + 1}</Typography>
                )}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                      fontSize: 15,
                      fontWeight: s.state === 'next' ? 500 : 700,
                      color: s.state === 'next' ? C.ink : C.deep,
                    }}>{s.t}</Typography>
                    <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 0.2, lineHeight: 1.4 }}>
                      {s.when || s.s}
                    </Typography>
                  </Box>
                  {/* One word on the right, saying where this step sits relative
                      to now. It is the only thing on the row a patient scanning
                      the timeline is actually looking for. */}
                  {stagePill(s, i, firstNext) && (
                    <Typography sx={{
                      flexShrink: 0, px: 1, py: 0.4, borderRadius: '8px', mt: 0.1,
                      fontSize: 10.5, fontWeight: 700,
                      bgcolor: stagePill(s, i, firstNext).bg,
                      color: stagePill(s, i, firstNext).fg,
                    }}>{stagePill(s, i, firstNext).t}</Typography>
                  )}
                </Stack>
              </Box>
            </Stack>
          ))}
        </Box>

        {/* A grid, because this is a list you check rather than read. */}
        <Head r={mark('included')}>Included</Head>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {included.map((t) => (
            <Stack key={t} direction="row" spacing={1.1} sx={{
              width: 'calc(50% - 4px)', alignItems: 'center',
              px: 1.4, py: 1.35, borderRadius: '14px', bgcolor: '#fff',
              boxShadow: '0 2px 12px -9px rgba(27,57,91,.4)',
            }}>
              <CheckIcon sx={{ fontSize: 14, color: C.green, flexShrink: 0 }} />
              <Typography sx={{ flex: 1, fontSize: 13, lineHeight: 1.3, color: C.deep }}>
                {t}
              </Typography>
            </Stack>
          ))}
        </Box>

        {/* Kept, and kept quiet. Dropping the risk copy from a page that ends
            in a purchase is the one edit a regulator would notice. */}
        <Head r={mark('know')}>Things to know</Head>
        <Typography sx={{ fontSize: 14, lineHeight: 1.5, color: C.ink2 }}>{p.risk}</Typography>
        <Typography sx={{ fontSize: 14, lineHeight: 1.5, color: C.ink2, mt: 1.4 }}>
          {p.wrongFor}
        </Typography>

        {/* The only paragraph on the page. */}
        <Box ref={mark('note')} sx={{
          mt: 4.5, px: 2.25, py: 2.5, borderRadius: '22px', bgcolor: '#fff',
          boxShadow: '0 4px 22px -14px rgba(27,57,91,.45)',
        }}>
          <Stack direction="row" spacing={1.35} sx={{ alignItems: 'center', mb: 1.6 }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {c.img
                ? <Box component="img" src={c.img} alt="" sx={{
                    width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                  }} />
                : <Typography sx={{
                    fontFamily: '"Fraunces", serif', fontSize: 12, fontWeight: 600,
                    color: 'rgba(255,255,255,.9)',
                  }}>{c.mono}</Typography>}
            </Box>
            <Typography sx={{ fontSize: 15, fontWeight: 600, color: C.deep }}>
              {first}’s note
            </Typography>
          </Stack>
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 16, fontWeight: 400,
            lineHeight: 1.55, color: C.deep,
          }}>{rec.note}</Typography>
        </Box>
      </Box>

      {/* Sells once. After that the page has outlived the purchase and the only
          useful thing at the bottom is the way back into the day. */}
      <Box sx={{
        px: 2.25, pt: 4, pb: 3, flexShrink: 0, mt: -3,
        background: `linear-gradient(180deg,rgba(255,253,245,0) 0%,${C.cream} 50%)`,
      }}>
        {started ? (
          <Button fullWidth variant="outlined" color="secondary"
            onClick={onTrack || onBack}
            sx={{ borderColor: 'rgba(27,57,91,.25)', color: C.deep }}>
            Track it on Today
          </Button>
        ) : (
          <>
            {/* Not a purchase. The programme was paid for at the Care Brief,
                and this plan is what the programme produced. */}
            <Button fullWidth variant="contained" color="secondary" onClick={onBuy}
              startIcon={<RocketLaunchOutlinedIcon sx={{ fontSize: 19 }} />}
              sx={{ borderRadius: '17px', '& .MuiButton-startIcon': { mr: 1.2 } }}>
              Activate my plan
            </Button>
            <Typography sx={{ fontSize: 11.5, color: C.ink2, textAlign: 'center', mt: 1.3 }}>
              Included in your programme. Nothing more to pay.
            </Typography>
          </>
        )}
      </Box>

      {/* ── sections · a bottom sheet, the same grammar as every other sheet
             in the product ── */}
      <Drawer anchor="bottom" open={toc} onClose={() => setToc(false)}
        slotProps={{
          root: { disablePortal: true, sx: { position: 'absolute' } },
          backdrop: { sx: { position: 'absolute' } },
          paper: {
            sx: {
              position: 'absolute', borderTopLeftRadius: 24, borderTopRightRadius: 24,
              bgcolor: C.cream, backgroundImage: 'none', pb: 2,
            },
          },
        }}>
        <Box sx={{
          width: 36, height: 4, borderRadius: 2, bgcolor: 'rgba(27,57,91,.16)',
          mx: 'auto', mt: 1.4, mb: 1,
        }} />
        <Box sx={{ px: 1.5, pb: 1 }}>
          {SECTIONS.map((s) => (
            <Typography key={s.id} onClick={() => goTo(s.id)} sx={{
              px: 1.75, py: 1.4, borderRadius: '13px', cursor: 'pointer',
              fontSize: 15, fontWeight: 500, color: C.deep,
              '&:active': { bgcolor: 'rgba(27,57,91,.06)' },
            }}>{s.t}</Typography>
          ))}
        </Box>
      </Drawer>
    </Box>
  );
}

/* A summary tile. White on cream, soft shadow, no border — the same object the
   rest of the app uses for "a fact you glance at". */
function Tile({ children, sx, ref: r }) {
  return (
    <Box ref={r} sx={{
      px: 2, py: 1.75, borderRadius: '18px', bgcolor: '#fff',
      boxShadow: '0 3px 16px -11px rgba(27,57,91,.45)', ...sx,
    }}>{children}</Box>
  );
}

function TileLabel({ children }) {
  return (
    <Typography sx={{
      fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
      textTransform: 'uppercase', color: C.ink2,
    }}>{children}</Typography>
  );
}

/* Section headings carry the spacing. No rules, no cards around the section —
   the gap above a heading is what separates one question from the next. */
function Head({ children, r }) {
  return (
    <Typography ref={r} sx={{
      fontSize: 19, fontWeight: 700, color: C.deep, mt: 5, mb: 2, scrollMarginTop: '14px',
    }}>{children}</Typography>
  );
}
