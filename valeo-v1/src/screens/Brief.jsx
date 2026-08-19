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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { RECOMMEND, coachOf } from '../data';
import { C, meter } from '../theme';

/* Data names a concept, this maps it to a glyph — so data.js never imports
   a component library. */
const ICONS = {
  energy: BoltIcon, heart: FavoriteBorderIcon, shield: ShieldOutlinedIcon,
  scale: MonitorWeightOutlinedIcon, muscle: FitnessCenterIcon, chart: ShowChartIcon,
};

/* ── THE MARKED PHRASE ──
   Weight, not decoration. A hand-drawn gold stroke used to run under these
   phrases, and inside a quotation it read as annotation: someone had gone
   over the doctor's words with a highlighter afterwards. Bold is the doctor
   leaning on the phrase as he says it, which is what the copy means. */
function Mark({ children }) {
  return (
    <Box component="span" sx={{ fontWeight: 700, color: C.deep }}>{children}</Box>
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
        px: 2.75, pt: 1.5, pb: 2,
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
            {/* Experience earns a pill of its own. On a line with the specialty
                it was one more grey fragment; set apart it reads as the single
                credential worth carrying into the recommendation below. */}
            <Typography sx={{
              display: 'inline-block', mt: 0.6, px: 1, py: 0.3, borderRadius: '999px',
              fontSize: 10.5, fontWeight: 600, color: C.deep,
              bgcolor: 'rgba(27,57,91,.07)',
            }}>{c.years}+ years experience</Typography>
          </Box>
        </Stack>

        {/* The heading, with the mock's gold full stop. */}
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 25, fontWeight: 600,
          lineHeight: 1.14, color: C.deep, mt: 1.75,
        }}>
          Here’s my assessment<Box component="span" sx={{ color: C.yellow }}>.</Box>
        </Typography>

        {/* The assessment, spoken against a gold bar. The quotation mark is
            what turns the paragraph from a summary the app wrote into words
            the doctor said — the bar alone was doing that job on its own and
            reading as a callout box. */}
        <Stack direction="row" spacing={1.25} sx={{
          alignItems: 'flex-start', mt: 1.5, pl: 1.5, borderLeft: '3px solid #F5C64F',
        }}>
          <Typography aria-hidden sx={{
            fontFamily: '"Fraunces", serif', fontSize: 34, fontWeight: 700,
            lineHeight: 0.85, color: C.yellow, flexShrink: 0, mt: '2px',
          }}>“</Typography>
          <Typography sx={{ fontSize: 13.5, lineHeight: 1.55, color: C.ink }}>
            {markUp(s.think, s.marks)}
          </Typography>
        </Stack>

        {/* The bridge between what was said and what is recommended. */}
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mt: 1.75 }}>
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
          mt: 1.5, p: 1.85, borderRadius: '22px', position: 'relative', overflow: 'hidden',
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
            mt: 1.75, pt: 1.5, borderTop: '1px solid rgba(255,255,255,.12)',
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

        {/* The close — still the clinician talking, with the one number that
            answers "am I the only one?". A shield rather than a star: this is
            a clinical assurance, and a star is a rating. */}
        <Stack direction="row" spacing={1.25} sx={{
          alignItems: 'center', mt: 1.5, px: 1.5, py: 1.4,
          borderRadius: '14px', bgcolor: 'rgba(27,57,91,.05)',
        }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            bgcolor: 'rgba(224,164,0,.15)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <VerifiedUserOutlinedIcon sx={{ fontSize: 18, color: C.yellowDeep }} />
          </Box>
          <Typography sx={{ flex: 1, fontSize: 12.5, lineHeight: 1.4, color: C.deep, fontWeight: 600 }}>
            {s.why}
          </Typography>

          {s.onPlan && (
            <Box sx={{ flexShrink: 0, textAlign: 'center' }}>
              <Typography sx={{
                px: 1.1, py: 0.4, borderRadius: '999px', bgcolor: '#fff',
                fontFamily: meter, fontSize: 13, fontWeight: 700, color: C.deep,
                boxShadow: '0 6px 16px -12px rgba(27,57,91,.6)',
              }}>{s.onPlan}</Typography>
              <Typography sx={{ fontSize: 9, color: C.ink2, mt: 0.4, lineHeight: 1.2 }}>
                on this plan
              </Typography>
            </Box>
          )}
        </Stack>

        <Button fullWidth variant="contained" color="secondary" onClick={onStart}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 17 }} />}
          sx={{ mt: 1.5, py: 1.4, fontSize: 15, borderRadius: '17px' }}>
          View recommended care
        </Button>

        {/* The three words that answer the objection the price will raise on
            the next screen. Quiet, and never larger than the button. */}
        <Stack direction="row" spacing={0.6} sx={{
          alignItems: 'center', justifyContent: 'center', mt: 1.3,
        }}>
          <LockOutlinedIcon sx={{ fontSize: 13, color: C.ink2 }} />
          <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
            Evidence-based · Personalised · Ongoing
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}
