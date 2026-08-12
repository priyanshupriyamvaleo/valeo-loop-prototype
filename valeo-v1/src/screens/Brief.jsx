import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import BoltIcon from '@mui/icons-material/Bolt';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { RECOMMEND, coachOf } from '../data';
import { C } from '../theme';

/* Data names a concept, this maps it to a glyph — so data.js never imports
   a component library. */
const ICONS = {
  energy: BoltIcon, heart: FavoriteBorderIcon, shield: ShieldOutlinedIcon,
  scale: MonitorWeightOutlinedIcon, muscle: FitnessCenterIcon, chart: ShowChartIcon,
};

/* ── THE HAND-DRAWN UNDERLINE ──
   One gold stroke that dips and recovers like a pen pulled quickly along the
   page: down-up-down, uneven on purpose. It is an SVG background rather than
   text-decoration because no browser lets a text-decoration wobble.

   `preserveAspectRatio="none"` stretches the same gesture under a short word
   or a five-word phrase, and `box-decoration-break: clone` redraws it on each
   line fragment when a phrase wraps — without it, the middle line of a
   wrapped phrase would go bare. */
const STROKE = encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 9" preserveAspectRatio="none">'
  + '<path d="M3 5.2 C 22 2.4, 43 7.4, 62 4.6 S 99 6.6, 117 3.4"'
  + ' fill="none" stroke="#E8A93C" stroke-width="2.6" stroke-linecap="round" opacity=".9"/></svg>',
);

function Mark({ children }) {
  return (
    <Box component="span" sx={{
      backgroundImage: `url("data:image/svg+xml,${STROKE}")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: '0 100%',
      backgroundSize: '100% 0.32em',
      pb: '0.18em',
      boxDecorationBreak: 'clone',
      WebkitBoxDecorationBreak: 'clone',
    }}>{children}</Box>
  );
}

/* Splits the assessment around the marked phrases so each one renders inside
   <Mark>. Plain string work — the phrases are authored to match verbatim. */
function markUp(text, marks) {
  if (!marks?.length) return text;
  const rx = new RegExp(`(${marks.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`);
  return text.split(rx).map((part, i) => (
    marks.includes(part) ? <Mark key={i}>{part}</Mark> : part
  ));
}

/**
 * SCREEN ONE — THE CLINICIAN'S RECOMMENDATION.
 *
 * Layout and styling follow the stakeholder's mock (Aug 2026): gold eyebrow,
 * clinician on a gold disc, a serif heading closed by a gold full stop, the
 * assessment against a gold bar, a "based on our discussion" bridge, then
 * ONE dark navy panel carrying the recommended programme with a three-column
 * benefit row, a star strip, and the gold CTA.
 *
 * ── SIZED TO FIT 844PX WITHOUT SCROLLING ──
 * The mock's own type sizes ran the page to ~1290px, half a screen below the
 * fold — which buried the CTA. Every size here is the mock's proportion
 * scaled down until the whole narrative fits one screen; the hierarchy
 * (eyebrow < body < panel title < heading) is preserved exactly. If copy
 * grows, shorten the copy rather than re-enabling scroll: the entire value
 * of this screen is that the patient sees judgment, recommendation and CTA
 * in one glance.
 *
 * ── THE PANEL IS THE ONLY DARK OBJECT ──
 * Everything else sits on cream. That inversion is what makes the programme
 * read as "the one my clinician chose", so nothing else here may be boxed
 * in navy.
 *
 * ── THE CLINICIAN SPEAKS, THE COMPANY DOESN'T ──
 * Every sentence is first person and comes from RECOMMEND[pKey].speak,
 * authored per programme. Nothing is assembled from fragments.
 *
 * ── WHAT IS DELIBERATELY ABSENT ──
 * No price, no inclusions list, no timeline, no testimonials. The word
 * "protocol" appears nowhere.
 */
export default function Brief({ pKey, onBack, onStart }) {
  const c = coachOf(pKey);
  const rec = RECOMMEND[pKey];
  const [inn, setInn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setInn(true), 40); return () => clearTimeout(t); }, []);

  if (!c || !rec?.speak) return null;
  const s = rec.speak;

  return (
    <Box sx={{ height: '100%', overflowY: 'auto', bgcolor: '#FAF6ED' }}>
      <Box sx={{
        px: 2.75, pt: 1.75, pb: 2.25,
        opacity: inn ? 1 : 0,
        transform: inn ? 'none' : 'translateY(12px)',
        transition: 'opacity .5s cubic-bezier(.2,.9,.25,1), transform .55s cubic-bezier(.2,.9,.25,1)',
      }}>
        <IconButton onClick={onBack} size="small" sx={{
          width: 34, height: 34, bgcolor: '#fff', color: C.deep,
          boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
          '&:hover': { bgcolor: '#fff' },
        }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        </IconButton>

        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.2em',
          textTransform: 'uppercase', color: C.yellowDeep, mt: 1.75,
        }}>My recommendation</Typography>

        {/* Who is speaking — the portrait sits on a gold disc, per the mock. */}
        <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center', mt: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            bgcolor: C.yellow, border: '2px solid #fff',
            boxShadow: '0 8px 20px -10px rgba(27,57,91,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {c.img
              ? <Box component="img" src={c.img} alt="" sx={{
                  width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                }} />
              : <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 15, fontWeight: 600, color: C.deep,
                }}>{c.mono}</Typography>}
          </Box>
          <Box>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 18, fontWeight: 600,
              color: C.deep, lineHeight: 1.15,
            }}>{c.name}</Typography>
            <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.3 }}>{c.role}</Typography>
          </Box>
        </Stack>

        {/* The heading, with the mock's gold full stop. */}
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 25, fontWeight: 600,
          lineHeight: 1.14, color: C.deep, mt: 2.25,
        }}>
          Here’s my assessment<Box component="span" sx={{ color: C.yellow }}>.</Box>
        </Typography>

        {/* The assessment, spoken against a gold bar. */}
        <Typography sx={{
          fontSize: 13.5, lineHeight: 1.55, color: C.ink, mt: 1.75,
          pl: 1.75, borderLeft: '3px solid #F5C64F',
        }}>{markUp(s.think, s.marks)}</Typography>

        {/* The bridge between what was said and what is recommended. */}
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mt: 2.25 }}>
          <Box sx={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            bgcolor: 'rgba(27,57,91,.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AssignmentOutlinedIcon sx={{ fontSize: 16, color: C.deep }} />
          </Box>
          <Typography sx={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: '.13em',
            textTransform: 'uppercase', color: C.deep,
          }}>Based on our discussion</Typography>
        </Stack>

        {/* ── the recommendation — the one dark object on the page ── */}
        <Box sx={{
          mt: 1.75, p: 2, borderRadius: '22px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg,#1E3E63 0%,#132C4A 100%)',
          boxShadow: '0 20px 44px -26px rgba(14,27,44,.75)',
        }}>
          {/* The mock's concentric arcs, top right. Decoration only. */}
          {[170, 240, 310].map((d) => (
            <Box key={d} sx={{
              position: 'absolute', top: -d / 2.6, right: -d / 2.6,
              width: d, height: d, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,.05)', pointerEvents: 'none',
            }} />
          ))}

          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Box sx={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              bgcolor: 'rgba(255,255,255,.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUpIcon sx={{ fontSize: 19, color: C.yellow }} />
            </Box>
            <Typography sx={{
              fontSize: 9.5, fontWeight: 800, letterSpacing: '.18em',
              textTransform: 'uppercase', color: C.yellow,
            }}>Recommended care</Typography>
          </Stack>

          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 21, fontWeight: 600,
            lineHeight: 1.16, color: '#fff', mt: 1.5,
          }}>{s.prog}</Typography>

          <Box sx={{ width: 44, height: 2, bgcolor: C.yellow, mt: 1.25 }} />

          <Typography sx={{
            fontSize: 12.5, lineHeight: 1.55, color: 'rgba(255,255,255,.78)', mt: 1.5,
          }}>{s.desc}</Typography>

          {/* Three outcomes, columned like the mock. */}
          <Stack direction="row" sx={{
            mt: 2, pt: 1.75, borderTop: '1px solid rgba(255,255,255,.12)',
          }}>
            {s.points.map((p, i) => {
              const Ic = ICONS[p.ic] || BoltIcon;
              return (
                <Box key={p.t} sx={{
                  flex: 1, minWidth: 0,
                  pl: i === 0 ? 0 : 1.25, pr: i === s.points.length - 1 ? 0 : 1.25,
                  borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,.12)',
                }}>
                  <Stack direction="row" spacing={0.75} sx={{ alignItems: 'flex-start' }}>
                    <Ic sx={{ fontSize: 14, color: C.yellow, flexShrink: 0, mt: '1px' }} />
                    <Typography sx={{
                      fontSize: 11, fontWeight: 700, color: '#fff', lineHeight: 1.3,
                    }}>{p.t}</Typography>
                  </Stack>
                  {/* Indented to the title's left edge, past the icon. */}
                  <Typography sx={{
                    fontSize: 10, lineHeight: 1.45, color: 'rgba(255,255,255,.55)',
                    mt: 0.5, pl: '20px',
                  }}>{p.s}</Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* The close — still the clinician talking. */}
        <Stack direction="row" spacing={1.25} sx={{
          alignItems: 'center', mt: 1.5, px: 1.75, py: 1.25,
          borderRadius: '14px', bgcolor: 'rgba(27,57,91,.05)',
        }}>
          <StarBorderRoundedIcon sx={{ fontSize: 20, color: C.yellowDeep, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 12.5, lineHeight: 1.45, color: C.deep }}>
            {s.why}
          </Typography>
        </Stack>

        <Button fullWidth variant="contained" color="secondary" onClick={onStart}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 17 }} />}
          sx={{ mt: 1.5, py: 1.35, fontSize: 15 }}>
          View recommended care
        </Button>
      </Box>
    </Box>
  );
}
