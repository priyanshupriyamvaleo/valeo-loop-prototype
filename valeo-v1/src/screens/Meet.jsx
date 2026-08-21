import { useEffect, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VideocamOutlinedIcon from '@mui/icons-material/VideocamOutlined';
import PhoneInTalkOutlinedIcon from '@mui/icons-material/PhoneInTalkOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import { StethoscopeMark } from '../components/Marks';
import { CALL_EXPECT, coachOf } from '../data';
import { C } from '../theme';

/**
 * MEET — your expert, your partner.
 *
 * This screen used to be a product card: protocol name, duration, plan count,
 * price, chevron. Individually defensible, collectively fatal — the moment it
 * appeared the user stopped being a patient and became a shopper, three screens
 * after we had carefully made them feel welcomed.
 *
 * It was also backwards on its own terms. We are not selling a protocol; we are
 * selling an ongoing relationship with a clinician who writes one FOR you.
 *
 * ── WHY IT BECAME A PROFILE ──
 * The version before this one was warm and thin: a portrait, "Nice to meet
 * you", and three promises about the conversation. Warmth is the right register
 * for a threshold, but this is the screen where somebody decides whether to
 * hand their metabolic health to a stranger, and warmth alone does not answer
 * "who is this person". So the credentials arrive at the top now, where a
 * patient looks first, and the promises stay underneath where they belong.
 *
 * ── THE NAME IS THE HEADLINE ──
 * Not "Welcome to Dr. Mahmoud's Practice" in eyebrow caps above a photograph.
 * The name, at headline size, with the qualification under it: the two facts
 * that decide this screen, in the order a patient reads them. The portrait sits
 * beside it rather than above, so the fold carries name, licence and face
 * together instead of spending its whole height on a picture.
 *
 * ── THE THREE STATS EARN THEIR ROW ──
 * Years, consultations, specialty. All three come off the roster in data.js so
 * they cannot drift from the rest of the app, and none of them is a rating: a
 * five-star average on a doctor is a restaurant pattern, and it cheapens
 * exactly the thing this screen is trying to establish.
 *
 * ── THE CALL IS A LIST, NOT A PARAGRAPH ──
 * Four beats in the order a good consultation runs them, from CALL_EXPECT so
 * every clinician's page says the same true thing. Read only the bold lines and
 * the screen still answers "what happens in the ten minutes".
 */

const EXPECT_ICONS = {
  concerns: PersonOutlineOutlinedIcon,
  matters: SearchOutlinedIcon,
  plan: AssignmentOutlinedIcon,
  next: Groups2OutlinedIcon,
};

export default function Meet({ pKey, onBook, onBack }) {
  /* A rail jump can arrive here with no episode at all. The demo must show a
     doctor, not a blank phone, so the weight-loss lead stands in. */
  const c = coachOf(pKey) || coachOf('P_WEIGHT');
  const [inn, setInn] = useState(false);
  useEffect(() => { const t = setTimeout(() => setInn(true), 40); return () => clearTimeout(t); }, []);

  if (!c) return null;

  /* Every one of these has a fallback: a coach added later without the new
     fields renders a thinner page, never a broken one. */
  const qual = c.qual || c.role;
  const bio = c.bio
    || `${c.short} has ${c.years} years behind them and works on ${(c.focus || '').toLowerCase()}.`;
  const stats = [
    { ic: StethoscopeMark, v: `${c.years}+`, l: 'Years experience', mark: true },
    ...(c.consults ? [{ ic: SchoolOutlinedIcon, v: c.consults, l: 'Consultations' }] : []),
    { ic: VerifiedUserOutlinedIcon, v: c.role, l: 'Verified specialty', wide: true },
  ];

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: `
        radial-gradient(74% 32% at 104% -4%, rgba(255,185,0,.18) 0%, rgba(255,185,0,0) 62%),
        linear-gradient(180deg,#FFF9EC 0%,${C.cream} 26%)`,
    }}>
      <Box sx={{ px: 2.25, pt: 1.75, flexShrink: 0, position: 'absolute', zIndex: 3 }}>
        <IconButton onClick={onBack} size="small" sx={{
          width: 36, height: 36, bgcolor: '#fff', color: C.deep,
          boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
          '&:hover': { bgcolor: '#fff' },
        }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      <Box sx={{
        flex: '1 1 auto', overflowY: 'auto', pb: 2, pt: 2.25,
        opacity: inn ? 1 : 0,
        transform: inn ? 'none' : 'translateY(14px)',
        transition: 'opacity .5s cubic-bezier(.2,.9,.25,1), transform .55s cubic-bezier(.2,.9,.25,1)',
      }}>
        <Typography sx={{
          textAlign: 'center', fontSize: 10.5, fontWeight: 800, letterSpacing: '.15em',
          textTransform: 'uppercase', color: C.yellowDeep,
        }}>
          Your expert, your partner
        </Typography>

        {/* ── the fold: name, licence, face ── */}
        <Stack direction="row" spacing={1.25} sx={{ px: 2.5, mt: 2, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0, pt: 0.5 }}>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 27, fontWeight: 600,
              lineHeight: 1.08, letterSpacing: '-.02em', color: C.deep,
            }}>{c.short}</Typography>
            <Box sx={{ width: 42, height: 3, borderRadius: 2, bgcolor: C.yellow, mt: 1 }} />
            <Typography sx={{
              fontSize: 12, fontWeight: 600, lineHeight: 1.4, color: C.ink2, mt: 1.1,
            }}>{qual}</Typography>
          </Box>

          {/* The blob behind the portrait is what stops a rectangular photo
              reading as a database record. */}
          <Box sx={{
            position: 'relative', width: 124, flexShrink: 0,
            transform: inn ? 'scale(1)' : 'scale(.95)',
            transition: 'transform .6s cubic-bezier(.2,.9,.25,1)',
          }}>
            <Box sx={{
              position: 'absolute', inset: '-8% -6% -2% -6%', borderRadius: '46% 54% 50% 50%',
              bgcolor: 'rgba(255,185,0,.16)',
            }} />
            <Box sx={{
              position: 'relative', width: '100%', pt: '118%', borderRadius: '18px',
              overflow: 'hidden', border: '4px solid #fff',
              boxShadow: '0 16px 32px -18px rgba(27,57,91,.5)',
              background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
            }}>
              {c.img ? (
                <Box component="img" src={c.img} alt="" sx={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  objectFit: 'cover', objectPosition: 'center 16%',
                }} />
              ) : (
                <Typography sx={{
                  position: 'absolute', inset: 0, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontFamily: '"Fraunces", serif', fontSize: 30, fontWeight: 600,
                  color: 'rgba(255,255,255,.9)',
                }}>{c.mono}</Typography>
              )}
            </Box>
          </Box>
        </Stack>

        <Typography sx={{
          px: 2.5, mt: 1.75, fontSize: 13.5, lineHeight: 1.55, color: C.deep,
        }}>{bio}</Typography>

        {/* ── the three facts, none of them a rating ── */}
        <Box sx={{
          px: 2.5, mt: 2.25, display: 'grid',
          gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 0.9,
        }}>
          {stats.map(({ ic: Icon, v, l, mark, wide }) => (
            <Stack key={l} sx={{
              alignItems: 'flex-start', px: 1.15, py: 1.15, borderRadius: '14px',
              bgcolor: '#fff', border: '1px solid rgba(224,164,0,.24)',
              boxShadow: '0 8px 20px -16px rgba(27,57,91,.5)',
            }}>
              <Box sx={{
                width: 26, height: 26, borderRadius: '9px', mb: 0.7,
                bgcolor: 'rgba(224,164,0,.13)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {mark ? <StethoscopeMark size={15} />
                      : <Icon sx={{ fontSize: 15, color: C.yellowDeep }} />}
              </Box>
              <Typography sx={{
                fontSize: wide ? 11.5 : 15, fontWeight: 700, color: C.deep, lineHeight: 1.2,
              }}>{v}</Typography>
              <Typography sx={{ fontSize: 9.5, color: C.ink2, mt: 0.2, lineHeight: 1.3 }}>
                {l}
              </Typography>
            </Stack>
          ))}
        </Box>

        {/* ── what the ten minutes actually is ── */}
        <Box sx={{
          mx: 2.5, mt: 2.5, borderRadius: '18px', bgcolor: 'rgba(255,185,0,.06)',
          border: '1px solid rgba(224,164,0,.28)', px: 1.75, py: 1.75,
        }}>
          <Stack direction="row" spacing={1.3} sx={{ alignItems: 'flex-start' }}>
            <Box sx={{
              width: 34, height: 34, borderRadius: '50%', flexShrink: 0, bgcolor: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 6px 16px -12px rgba(27,57,91,.5)',
            }}>
              <PhoneInTalkOutlinedIcon sx={{ fontSize: 18, color: C.yellowDeep }} />
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
                In your call, you can expect
              </Typography>
              <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.25, lineHeight: 1.45 }}>
                A focused conversation, one to one, to understand you better
              </Typography>
            </Box>
          </Stack>

          <Stack sx={{ mt: 0.5 }}>
            {CALL_EXPECT.map(({ k, t, s }, idx) => {
              const Icon = EXPECT_ICONS[k] || PersonOutlineOutlinedIcon;
              return (
                <Stack key={k} direction="row" spacing={1.3} sx={{
                  alignItems: 'flex-start', py: 1.15,
                  borderTop: idx === 0 ? `1px solid rgba(224,164,0,.22)` : `1px solid ${C.line}`,
                  mt: idx === 0 ? 1.25 : 0,
                }}>
                  <Box sx={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0, bgcolor: '#fff',
                    border: '1px solid rgba(224,164,0,.3)', mt: 0.2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon sx={{ fontSize: 16, color: C.yellowDeep }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep, lineHeight: 1.3 }}>
                      {t}
                    </Typography>
                    <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.25, lineHeight: 1.45 }}>
                      {s}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Stack>
        </Box>
      </Box>

      {/* ── the commitment · a conversation, not a purchase ── */}
      <Box sx={{
        px: 2.75, pt: 2, pb: 2.25, flexShrink: 0,
        background: `linear-gradient(180deg,rgba(255,253,245,0) 0%,${C.cream} 40%)`,
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => onBook(pKey)}
          startIcon={<VideocamOutlinedIcon sx={{ fontSize: 18 }} />}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          sx={{
            py: 1.6, fontSize: 15, borderRadius: '17px',
            '& .MuiButton-startIcon': { mr: 1 },
            '& .MuiButton-endIcon': { ml: 1 },
            whiteSpace: 'nowrap',
          }}>
          Start my consultation
        </Button>
        <Stack direction="row" spacing={0.6} sx={{
          alignItems: 'center', justifyContent: 'center', mt: 1.3,
        }}>
          <ScheduleOutlinedIcon sx={{ fontSize: 14, color: C.ink2 }} />
          <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
            {c.short} is available now · Included
          </Typography>
        </Stack>
      </Box>

    </Box>
  );
}
