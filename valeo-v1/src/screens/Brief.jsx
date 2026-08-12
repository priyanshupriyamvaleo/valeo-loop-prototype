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

/**
 * SCREEN ONE — THE CLINICIAN'S RECOMMENDATION.
 *
 * Layout and styling reproduce the stakeholder's mock (Aug 2026) exactly:
 * gold eyebrow, clinician on a gold disc, an oversized serif heading with a
 * gold full stop, the assessment against a gold bar, a "based on our
 * discussion" bridge, then ONE dark navy panel carrying the recommended
 * programme with a three-column benefit row, a star strip, and the gold CTA
 * in the page flow.
 *
 * ── THE PANEL IS THE ONLY DARK OBJECT ──
 * Everything else sits on cream. That inversion is what makes the programme
 * read as "the one my clinician chose" rather than a card among cards, so
 * nothing else on this page may be boxed in navy.
 *
 * ── THE CLINICIAN SPEAKS, THE COMPANY DOESN'T ──
 * Every sentence is first person and comes from RECOMMEND[pKey].speak,
 * authored per programme. Nothing here is assembled from fragments.
 *
 * ── WHAT IS DELIBERATELY ABSENT ──
 * No price, no inclusions list, no timeline, no testimonials. The word
 * "protocol" appears nowhere. Contents and commitment live on the next
 * screen; this one only asks "do you want to see it?".
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
        px: 3, pt: 2.5, pb: 3.5,
        opacity: inn ? 1 : 0,
        transform: inn ? 'none' : 'translateY(12px)',
        transition: 'opacity .5s cubic-bezier(.2,.9,.25,1), transform .55s cubic-bezier(.2,.9,.25,1)',
      }}>
        <IconButton onClick={onBack} size="small" sx={{
          width: 40, height: 40, bgcolor: '#fff', color: C.deep,
          boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
          '&:hover': { bgcolor: '#fff' },
        }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 16 }} />
        </IconButton>

        <Typography sx={{
          fontSize: 12, fontWeight: 800, letterSpacing: '.22em',
          textTransform: 'uppercase', color: C.yellowDeep, mt: 3,
        }}>My recommendation</Typography>

        {/* Who is speaking — the portrait sits on a gold disc, per the mock. */}
        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', mt: 2.5 }}>
          <Box sx={{
            width: 58, height: 58, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            bgcolor: C.yellow, border: '3px solid #fff',
            boxShadow: '0 8px 20px -10px rgba(27,57,91,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {c.img
              ? <Box component="img" src={c.img} alt="" sx={{
                  width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                }} />
              : <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 19, fontWeight: 600, color: C.deep,
                }}>{c.mono}</Typography>}
          </Box>
          <Box>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 24, fontWeight: 600,
              color: C.deep, lineHeight: 1.15,
            }}>{c.name}</Typography>
            <Typography sx={{ fontSize: 14, color: C.ink2, mt: 0.4 }}>{c.role}</Typography>
          </Box>
        </Stack>

        {/* The heading, with the mock's gold full stop. */}
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 38, fontWeight: 600,
          lineHeight: 1.12, color: C.deep, mt: 3.5,
        }}>
          Here’s my assessment<Box component="span" sx={{ color: C.yellow }}>.</Box>
        </Typography>

        {/* The assessment, spoken against a gold bar. */}
        <Typography sx={{
          fontSize: 17, lineHeight: 1.62, color: C.ink, mt: 3,
          pl: 2.25, borderLeft: '3px solid #F5C64F',
        }}>{s.think}</Typography>

        {/* The bridge between what was said and what is recommended. */}
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 3.5 }}>
          <Box sx={{
            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
            bgcolor: 'rgba(27,57,91,.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AssignmentOutlinedIcon sx={{ fontSize: 20, color: C.deep }} />
          </Box>
          <Typography sx={{
            fontSize: 12, fontWeight: 800, letterSpacing: '.14em',
            textTransform: 'uppercase', color: C.deep,
          }}>Based on our discussion</Typography>
        </Stack>

        {/* ── the recommendation — the one dark object on the page ── */}
        <Box sx={{
          mt: 2.5, p: 3, borderRadius: '26px', position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(160deg,#1E3E63 0%,#132C4A 100%)',
          boxShadow: '0 20px 44px -26px rgba(14,27,44,.75)',
        }}>
          {/* The mock's concentric arcs, top right. Decoration only. */}
          {[210, 300, 390].map((d) => (
            <Box key={d} sx={{
              position: 'absolute', top: -d / 2.6, right: -d / 2.6,
              width: d, height: d, borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,.05)', pointerEvents: 'none',
            }} />
          ))}

          <Box sx={{
            width: 52, height: 52, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <TrendingUpIcon sx={{ fontSize: 24, color: C.yellow }} />
          </Box>

          <Typography sx={{
            fontSize: 11, fontWeight: 800, letterSpacing: '.2em',
            textTransform: 'uppercase', color: C.yellow, mt: 2.5,
          }}>Recommended care</Typography>

          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 30, fontWeight: 600,
            lineHeight: 1.16, color: '#fff', mt: 1,
          }}>{s.prog}</Typography>

          <Box sx={{ width: 56, height: 2, bgcolor: C.yellow, mt: 2 }} />

          <Typography sx={{
            fontSize: 15, lineHeight: 1.62, color: 'rgba(255,255,255,.78)', mt: 2.25,
          }}>{s.desc}</Typography>

          {/* Three outcomes, columned like the mock. */}
          <Stack direction="row" sx={{
            mt: 3, pt: 2.75, borderTop: '1px solid rgba(255,255,255,.12)',
          }}>
            {s.points.map((p, i) => {
              const Ic = ICONS[p.ic] || BoltIcon;
              return (
                <Box key={p.t} sx={{
                  flex: 1, minWidth: 0,
                  pl: i === 0 ? 0 : 1.5, pr: i === s.points.length - 1 ? 0 : 1.5,
                  borderLeft: i === 0 ? 'none' : '1px solid rgba(255,255,255,.12)',
                }}>
                  <Stack direction="row" spacing={0.9} sx={{ alignItems: 'flex-start' }}>
                    <Ic sx={{ fontSize: 17, color: C.yellow, flexShrink: 0, mt: '1px' }} />
                    <Typography sx={{
                      fontSize: 12.5, fontWeight: 700, color: '#fff', lineHeight: 1.3,
                    }}>{p.t}</Typography>
                  </Stack>
                  {/* Indented to the title's left edge, past the icon, as in
                      the mock. 17px icon + 7.2px gap. */}
                  <Typography sx={{
                    fontSize: 11, lineHeight: 1.5, color: 'rgba(255,255,255,.55)',
                    mt: 0.75, pl: '24px',
                  }}>{p.s}</Typography>
                </Box>
              );
            })}
          </Stack>
        </Box>

        {/* The close — still the clinician talking. */}
        <Stack direction="row" spacing={1.5} sx={{
          alignItems: 'center', mt: 2.5, px: 2.25, py: 2,
          borderRadius: '18px', bgcolor: 'rgba(27,57,91,.05)',
        }}>
          <StarBorderRoundedIcon sx={{ fontSize: 24, color: C.yellowDeep, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 14.5, lineHeight: 1.5, color: C.deep }}>
            {s.why}
          </Typography>
        </Stack>

        {/* In the page flow, as designed — the page is short enough that the
            CTA is at most one small scroll away. */}
        <Button fullWidth variant="contained" color="secondary" onClick={onStart}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{ mt: 3, py: 1.7, fontSize: 16 }}>
          View recommended care
        </Button>
      </Box>
    </Box>
  );
}
