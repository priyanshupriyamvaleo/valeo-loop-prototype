import { useEffect, useRef, useState } from 'react';
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckIcon from '@mui/icons-material/Check';
import ListIcon from '@mui/icons-material/FormatListBulleted';
import { PROTOCOLS, RECOMMEND, coachOf, givenNameOf, DOCTOR, statusOf,
         includedIn, careJourney, planStatus, nextOnPlan, treatmentStatus } from '../data';
import { C } from '../theme';

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
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 29, fontWeight: 600,
            lineHeight: 1.12, color: C.deep, mt: 0.5,
          }}>{p.t}</Typography>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1.4 }}>
            <Box sx={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
            }}>
              {c.img && <Box component="img" src={c.img} alt="" sx={{
                width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
              }} />}
            </Box>
            <Typography sx={{ fontSize: 12.5, color: C.ink2 }}>
              {first} · 28 July · {p.wk} weeks
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
        <Tile ref={mark('goals')} sx={{ mt: 2.5 }}>
          <TileLabel>Our goals</TileLabel>
          <Stack spacing={0.85} sx={{ mt: 1.25 }}>
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

        <Box sx={{ display: 'flex', gap: 1.25, mt: 1.25 }}>
          <Tile sx={{ flex: 1, minWidth: 0 }}>
            <TileLabel>Treatment</TileLabel>
            <Typography sx={{
              fontSize: 16, fontWeight: 700, color: C.deep, mt: 1, lineHeight: 1.2,
            }}>{rec.lead.t}</Typography>
            <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.5, lineHeight: 1.4 }}>
              {p.wk}-week programme
            </Typography>
            <Typography sx={{ fontSize: 12, color: C.ink2, lineHeight: 1.4 }}>
              {txStatus}
            </Typography>
          </Tile>

          {/* Reads off the timeline below rather than duplicating its logic —
              a summary that can disagree with the detail is worse than none. */}
          <Tile sx={{ flex: 1, minWidth: 0 }}>
            <TileLabel>Next</TileLabel>
            {next ? (
              <>
                <Typography sx={{
                  fontSize: 15.5, fontWeight: 700, color: C.deep, mt: 1, lineHeight: 1.25,
                }}>{next.t}</Typography>
                <Typography sx={{
                  fontSize: 12, color: next.when ? C.deep : C.ink2, mt: 0.5, lineHeight: 1.4,
                  fontWeight: next.when ? 600 : 400,
                }}>{next.when || next.s}</Typography>
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
                border: s.state === 'next' ? '1.5px solid rgba(27,57,91,.18)' : 'none',
              }}>
                {s.state === 'done' && <CheckIcon sx={{ fontSize: 12, color: '#fff' }} />}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
                  <Typography sx={{
                    flex: 1, minWidth: 0, fontSize: 15,
                    fontWeight: s.state === 'next' ? 500 : 700,
                    color: s.state === 'next' ? C.ink : C.deep,
                  }}>{s.t}</Typography>
                  {s.when && (
                    <Typography sx={{
                      fontSize: 12, fontWeight: 600, color: C.ink2, flexShrink: 0,
                    }}>{s.when}</Typography>
                  )}
                </Stack>
                <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 0.2, lineHeight: 1.4 }}>
                  {s.s}
                </Typography>
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
            <Button fullWidth variant="contained" color="secondary" onClick={onBuy}>
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
