import { useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import PersonSearchOutlinedIcon from '@mui/icons-material/PersonSearchOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
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
/* ── THE TWO DOORS, AS TWO CARDS ──
   One blended card asked both patients to read past the half that was not for
   them. Two cards, one swipe apart, let each patient find their own sentence:
   "I know what I want" on the first, "help me work out what is wrong" on the
   second. Both CTAs open the same intake chat, because the fork lives inside
   the conversation, not on the shelf. The deck only exists in the intro state;
   every later lifecycle state keeps the single status card below. */
const DECK = [
  {
    dark: true, accent: C.yellow,
    tag: 'New at Valeo',
    title: 'Know the treatment you want?',
    sub: 'GLP-1 weight loss, hair, skin, sexual health. Doctor prescribed. Discreet. Delivered to you.',
    rows: [
      { Icon: VerifiedUserOutlinedIcon, t: 'Doctor assessment and prescription' },
      { Icon: LocalShippingOutlinedIcon, t: 'Delivered to your door, in cold chain' },
      { Icon: ChatBubbleOutlineOutlinedIcon, t: 'AI coach and clinical follow-up' },
    ],
    cta: 'Start my treatment',
    trust: 'DHA-licensed doctors · Discreet packaging · Secure and private',
  },
  {
    dark: false, accent: C.green,
    tag: 'New at Valeo',
    title: 'Clinician-led care for you',
    sub: 'Not sure what\u2019s wrong? We help you find answers and the right care.',
    rows: [
      { Icon: PersonSearchOutlinedIcon, t: 'In-depth assessment with our clinicians' },
      { Icon: FactCheckOutlinedIcon, t: 'A personalised diagnosis and care plan' },
      { Icon: EventAvailableOutlinedIcon, t: 'Ongoing support that fits your life' },
    ],
    cta: 'Talk to a clinician',
    trust: 'Doctor-led · Evidence-based · Confidential',
  },
];

function HeroDeck({ onGo }) {
  const rail = useRef(null);
  const [at, setAt] = useState(0);

  const onScroll = () => {
    const el = rail.current;
    if (el) setAt(Math.round(el.scrollLeft / el.clientWidth));
  };
  const jump = (i) => {
    const el = rail.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  return (
    <Box>
      <Box ref={rail} onScroll={onScroll} sx={{
        display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory',
        gap: 0, mx: -0.25, px: 0.25,
        '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none',
      }}>
        {DECK.map((d) => (
          <Box key={d.title} sx={{
            flex: '0 0 100%', scrollSnapAlign: 'start', scrollSnapStop: 'always',
            pr: 0.25, pl: 0.25, boxSizing: 'border-box',
          }}>
            <Box sx={{
              borderRadius: '20px', overflow: 'hidden', height: '100%',
              display: 'flex', flexDirection: 'column',
              bgcolor: d.dark ? C.deep : '#fff',
              border: d.dark ? 'none' : '1.5px solid rgba(39,153,91,.3)',
              boxShadow: d.dark
                ? '0 14px 32px -16px rgba(27,57,91,.7)'
                : '0 8px 26px -18px rgba(27,57,91,.45)',
              px: 2.1, pt: 1.9, pb: 1.9,
            }}>
              <Typography sx={{
                fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
                textTransform: 'uppercase',
                color: d.dark ? C.yellow : C.green,
              }}>{d.tag}</Typography>

              <Typography sx={{
                fontFamily: '"Fraunces", serif', fontSize: 21, fontWeight: 700,
                lineHeight: 1.2, mt: 0.6, color: d.dark ? '#fff' : C.deep,
              }}>{d.title}</Typography>

              <Typography sx={{
                fontSize: 12.5, mt: 0.6, lineHeight: 1.5,
                color: d.dark ? 'rgba(255,255,255,.72)' : C.ink2,
              }}>{d.sub}</Typography>

              <Stack spacing={0.9} sx={{ mt: 1.5, mb: 1.75 }}>
                {d.rows.map(({ Icon, t }) => (
                  <Stack key={t} direction="row" spacing={1.1} sx={{ alignItems: 'center' }}>
                    <Box sx={{
                      width: 26, height: 26, borderRadius: '9px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: d.dark ? 'rgba(255,185,0,.16)' : 'rgba(39,153,91,.12)',
                    }}>
                      <Icon sx={{ fontSize: 15, color: d.dark ? C.yellow : C.green }} />
                    </Box>
                    <Typography sx={{
                      fontSize: 12.5, fontWeight: 600,
                      color: d.dark ? 'rgba(255,255,255,.88)' : C.ink,
                    }}>{t}</Typography>
                  </Stack>
                ))}
              </Stack>

              <Box sx={{ flex: 1 }} />

              <Stack direction="row" spacing={0.75} onClick={() => onGo('start')} sx={{
                alignItems: 'center', justifyContent: 'center', py: 1.2,
                borderRadius: '12px', cursor: 'pointer',
                bgcolor: d.dark ? C.yellow : C.green,
                transition: 'transform .12s', '&:active': { transform: 'scale(.98)' },
              }}>
                <Typography sx={{
                  fontSize: 13.5, fontWeight: 700,
                  color: d.dark ? C.deep : '#fff',
                }}>{d.cta}</Typography>
                <ArrowForwardIcon sx={{ fontSize: 15, color: d.dark ? C.deep : '#fff' }} />
              </Stack>

              <Typography sx={{
                fontSize: 9.5, fontWeight: 600, textAlign: 'center', mt: 1.1,
                color: d.dark ? 'rgba(255,255,255,.5)' : C.ink2,
              }}>{d.trust}</Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* the dots say there is more than one door */}
      <Stack direction="row" spacing={0.7} sx={{ justifyContent: 'center', mt: 1.1 }}>
        {DECK.map((d, i) => (
          <Box key={d.title} onClick={() => jump(i)} sx={{
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
