import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { homeCard } from '../data';
import { C, meter } from '../theme';

/**
 * THE MODULE'S ENTIRE PRESENCE ON A HOME SCREEN IT DOES NOT OWN.
 *
 * Valeo's nav already has five items and is not getting three more, so protocols
 * hang off one card. That makes this the highest-leverage surface in the product:
 * it is the only thing a user who is not currently thinking about protocols will
 * see, which means it has to answer "what does this want from me right now" in
 * one glance, in nine different lifecycle states.
 *
 * So the card is not a banner that changes copy — it changes SHAPE. A run in
 * flight earns a progress bar and a marker delta; a verdict waiting to be read
 * earns neither, because the only thing it needs is to be opened. Giving every
 * state the same furniture would mean the important ones look like the routine
 * ones.
 *
 * One rule held throughout: the card never shows a number without the thing that
 * makes it mean something. A weight on its own is a fact. `78.4 → 73.6` is
 * progress.
 */
/* ── THE TWO DOORS, AS TWO IMAGES ──
   The hero is marketing-owned artwork now: one image per target group, cycled
   automatically so the second door surfaces without a swipe, and swipeable by
   hand for whoever wants to go back. Both tap through to the same intake chat,
   because the fork lives inside the conversation, not on the shelf. The deck
   only exists in the intro state; every later lifecycle state keeps the single
   status card below. */
const DOORS = [
  { img: 'hero/door-1.webp', alt: 'Care for your goals, backed by doctors' },
  { img: 'hero/door-2.webp', alt: 'Answers, clarity and care, designed for you' },
];
const CYCLE_MS = 4500;

function HeroDeck({ onGo }) {
  const rail = useRef(null);
  const [at, setAt] = useState(0);
  /* A hand on the deck silences the autoplay for a beat: a carousel that
     fights the user's thumb reads as broken, not lively. */
  const holdUntil = useRef(0);

  const onScroll = () => {
    const el = rail.current;
    if (el) setAt(Math.round(el.scrollLeft / el.clientWidth));
  };
  const jump = (i) => {
    const el = rail.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  useEffect(() => {
    const t = setInterval(() => {
      if (Date.now() < holdUntil.current) return;
      const el = rail.current;
      if (!el) return;
      const cur = Math.round(el.scrollLeft / el.clientWidth);
      jump((cur + 1) % DOORS.length);
    }, CYCLE_MS);
    return () => clearInterval(t);
  }, []);

  const hold = () => { holdUntil.current = Date.now() + 8000; };

  return (
    <Box>
      <Box ref={rail} onScroll={onScroll} onPointerDown={hold} onTouchStart={hold} sx={{
        display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
        borderRadius: '20px',
        boxShadow: '0 12px 30px -16px rgba(27,57,91,.45)',
        '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
      }}>
        {DOORS.map((d) => (
          <Box key={d.img} onClick={() => onGo('start')} sx={{
            flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always',
            cursor: 'pointer', lineHeight: 0,
          }}>
            <Box component="img" src={`${import.meta.env.BASE_URL}${d.img}`} alt={d.alt}
              sx={{ width: '100%', display: 'block' }} />
          </Box>
        ))}
      </Box>

      <Stack direction="row" spacing={0.7} sx={{ justifyContent: 'center', mt: 1.1 }}>
        {DOORS.map((d, i) => (
          <Box key={d.img} onClick={() => { hold(); jump(i); }} sx={{
            width: at === i ? 18 : 6, height: 6, borderRadius: 3, cursor: 'pointer',
            bgcolor: at === i ? C.deep : 'rgba(27,57,91,.22)',
            transition: 'width .2s, background-color .2s',
          }} />
        ))}
      </Stack>
    </Box>
  );
}

export default function ProtocolCard({ st, onGo, phase = 1 }) {
  const c = homeCard(st, phase);
  /* Before anything is engaged, the home surface is the two doors. */
  if (c.kind === 'intro') return <HeroDeck onGo={onGo} />;
  const tone = c.tone === 'green' ? C.green : c.tone === 'teal' ? C.teal : C.yellow;
  /* The intro state is the only one that has to sell, so it is the only one that
     gets the dark treatment. Everything after it is status, and status on a host
     home screen should sit quietly inside the host's own visual language. */
  const selling = c.kind === 'intro';

  return (
    <Box onClick={() => onGo(c.go, c.pKey)} sx={{
      borderRadius: '20px', overflow: 'hidden', cursor: 'pointer',
      bgcolor: selling ? C.deep : '#fff',
      color: selling ? '#fff' : C.ink,
      border: selling ? 'none' : `1px solid rgba(27,57,91,.09)`,
      boxShadow: selling
        ? '0 14px 32px -16px rgba(27,57,91,.7)'
        : '0 3px 16px -10px rgba(27,57,91,.4)',
    }}>
      <Box sx={{ px: 2, pt: 1.9, pb: 1.75 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Typography sx={{
            flex: 1, minWidth: 0, fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
            textTransform: 'uppercase',
            color: selling ? C.yellow : tone === C.yellow ? C.yellowDeep : tone,
          }}>{c.tag}</Typography>
          {c.more && (
            <Typography sx={{
              fontSize: 9.5, fontWeight: 700, color: C.ink2, whiteSpace: 'nowrap',
              px: 0.7, py: 0.25, borderRadius: '5px', bgcolor: 'rgba(27,57,91,.06)',
            }}>{c.more}</Typography>
          )}
        </Stack>

        <Typography sx={{
          fontSize: selling ? 21 : 19, fontWeight: 700, mt: 0.55, lineHeight: 1.2,
          fontFamily: selling ? '"Fraunces", serif' : undefined,
          color: selling ? '#fff' : C.deep,
        }}>{c.title}</Typography>

        <Typography sx={{
          fontSize: 12.5, mt: 0.5, lineHeight: 1.5,
          color: selling ? 'rgba(255,255,255,.72)' : C.ink2,
        }}>{c.sub}</Typography>

        {/* only a run in flight has a distance to show */}
        {c.progress != null && (
          <Box sx={{
            mt: 1.6, height: 7, borderRadius: 4, bgcolor: 'rgba(27,57,91,.09)',
            overflow: 'hidden',
          }}>
            <Box sx={{
              width: `${Math.round(c.progress * 100)}%`, height: '100%',
              borderRadius: 4, bgcolor: C.yellow,
            }} />
          </Box>
        )}

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 1.6 }}>
          <Stack direction="row" spacing={0.75} sx={{
            alignItems: 'center', px: 1.7, py: 1.05, borderRadius: '12px',
            bgcolor: selling ? C.yellow : tone === C.yellow ? C.yellow : 'rgba(27,57,91,.06)',
            transition: 'transform .12s',
            '&:active': { transform: 'scale(.98)' },
          }}>
            <Typography sx={{
              fontSize: 13, fontWeight: 700,
              color: tone === C.yellow || selling ? C.deep : C.deep,
            }}>{c.cta}</Typography>
            <ArrowForwardIcon sx={{ fontSize: 15, color: C.deep }} />
          </Stack>

          <Box sx={{ flex: 1 }} />

          {/* the one number that says the run is working */}
          {c.delta && (
            <Typography sx={{
              fontFamily: meter, fontSize: 13, fontWeight: 700, color: C.deep,
              whiteSpace: 'nowrap',
            }}>{c.delta}</Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
}
