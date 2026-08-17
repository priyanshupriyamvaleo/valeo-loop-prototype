import { useState } from 'react';
import { Box, Button, Drawer, IconButton, Stack, TextField, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import CardGiftcardOutlinedIcon from '@mui/icons-material/CardGiftcardOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseIcon from '@mui/icons-material/Close';
import EastRoundedIcon from '@mui/icons-material/EastRounded';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import RestaurantMenuIcon from '@mui/icons-material/RestaurantMenu';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import TuneIcon from '@mui/icons-material/Tune';
import PaySheet from '../components/PaySheet';
import { USER, carePlan, knownPlan, coachOf } from '../data';
import { C } from '../theme';

/* Data names a concept, this maps it to a glyph — so data.js never imports
   a component library. */
const ICONS = {
  doctor: MedicalServicesOutlinedIcon, food: RestaurantMenuIcon, gym: FitnessCenterIcon,
  test: ScienceOutlinedIcon, cgm: MonitorHeartOutlinedIcon, rx: MedicationOutlinedIcon,
  box: Inventory2OutlinedIcon, tune: TuneIcon, gift: CardGiftcardOutlinedIcon,
  cal: CalendarMonthOutlinedIcon, call: SupportAgentOutlinedIcon,
  chat: ChatBubbleOutlineIcon, chart: BarChartIcon,
};

/* One quiet hue per section band, from the existing Valeo palette: navy for
   the people, teal for measurement, gold for treatment, green for follow-up.
   The tint is the band's whole job — rows underneath stay neutral. */
const TONES = {
  team: { bg: 'rgba(27,57,91,.06)', fg: C.deep },
  testing: { bg: C.tealSoft, fg: C.teal },
  treatment: { bg: 'rgba(224,164,0,.13)', fg: C.yellowDeep },
  support: { bg: C.greenSoft, fg: C.green },
};

/**
 * SCREEN TWO — THE 12-WEEK CARE PLAN.
 *
 * The patient is being asked to pay, so the table lists every tangible the
 * money buys — thirteen rows, not seven headlines. Thirteen rows would be
 * unreadable as a flat list, so the table is segmented by four quiet
 * section bands (care team → testing → treatment → follow-up: the order a
 * patient asks "who / how do you know / what do I get / how do you keep me
 * on track"). The bands are tinted strips inside the SAME card — one table,
 * subtly sectioned, never a stack of cards.
 *
 * ── ROW ANATOMY ──
 * Icon, name, timing chip inline after the name, one-line explanation.
 * The chip moved from a right-hand column to the name line because the
 * honest timings ("Weeks 4, 8 & 12", "Days 10 & 25") no longer fit a right
 * column at 390px, and a wrapped column breaks every row below it. Type is
 * a step smaller throughout — density is the point, per the reference.
 *
 * ── THE FULL JOURNEY IS ONE TAP AWAY ──
 * "View entire programme journey" is the table's last row and opens a
 * sheet with the week-by-week timeline — pre-programme to week 12, with
 * the consultation already marked done, because it is. Keeping the
 * timeline in the sheet is what lets the main page stay a summary.
 *
 * ── ONE PLAN, NO CHOOSING ──
 * The clinician recommended a specific course of care. No tiers, no
 * comparison columns, no "best value". "Protocol" appears nowhere.
 */
export default function Buy({ pKey, onBack, onPaid, door = 'resolve',
                              wants = null, wantsShort = null, renew = false }) {
  const c = coachOf(pKey);
  const [pay, setPay] = useState(false);
  const [tour, setTour] = useState(false);
  /* ── THE DELIVERY ADDRESS ──
     Medication in cold chain has to land somewhere specific, and every
     checkout a person has ever used asks before taking money — so this one
     does too, in the same shape: a saved address selected by default, a
     Change affordance, and an add-new form behind it. GLP flow only; the
     programme checkout has a nurse visit scheduled separately. */
  const [addrs, setAddrs] = useState([
    { tag: 'Home', name: USER.full, line: 'Villa 23, Al Nakheel District',
      city: 'Riyadh 12381', phone: '+966 50 123 4567' },
    { tag: 'Office', name: USER.full, line: 'Olaya Towers, Tower B, Floor 14',
      city: 'Riyadh 12213', phone: '+966 50 123 4567' },
  ]);
  const [addrAt, setAddrAt] = useState(0);
  const [addrOpen, setAddrOpen] = useState(false);

  if (!c) return null;

  /* ── THE KNOWN DOOR GETS THE SIMPLE PLAN ──
     Not the programme. A person who has already decided is buying execution:
     a doctor's sign-off, the medication monthly, a check-in, a message line.
     One screen, four rows, three steps, a monthly price well under the
     programme, and no blood test to start. */
  if (door === 'known') {
    const kp = knownPlan(pKey, { wants, short: wantsShort });
    const kprice = kp.price.toLocaleString();
    return (
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#FAF6ED',
      }}>
        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pt: 1.75, pb: 2 }}>
          <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
            <IconButton onClick={onBack} size="small" sx={{
              width: 34, height: 34, bgcolor: '#fff', color: C.deep,
              boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
              '&:hover': { bgcolor: '#fff' },
            }}>
              <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
            </IconButton>
            <Box sx={{
              width: 38, height: 38, borderRadius: '50%', overflow: 'hidden',
              bgcolor: C.yellow, border: '2px solid #fff',
              boxShadow: '0 6px 16px -8px rgba(27,57,91,.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {c.img
                ? <Box component="img" src={c.img} alt="" sx={{
                    width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                  }} />
                : <Typography sx={{
                    fontFamily: '"Fraunces", serif', fontSize: 13, fontWeight: 600, color: C.deep,
                  }}>{c.mono}</Typography>}
            </Box>
          </Stack>

          <Typography sx={{
            fontSize: 10.5, fontWeight: 800, letterSpacing: '.18em',
            textTransform: 'uppercase', color: C.yellowDeep, mt: 1.75,
          }}>Based on your answers</Typography>
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 28, fontWeight: 600,
            lineHeight: 1.15, color: C.deep, mt: 0.75,
          }}>{kp.title}</Typography>

          <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mt: 1.5 }}>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 600,
              color: C.deep, lineHeight: 1.1,
            }}>SAR {kprice}</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: C.ink2 }}>
              a month
            </Typography>
          </Stack>
          <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.4 }}>
            Doctor reviewed. Delivered monthly. Stop whenever you and your
            doctor decide.
          </Typography>

          {/* the four things the money buys, and when */}
          <Box sx={{
            mt: 2, px: 1.75, borderRadius: '18px', bgcolor: '#fff',
            boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
          }}>
            {kp.rows.map((r, i) => {
              const Ic = ICONS[r.ic] || MedicalServicesOutlinedIcon;
              return (
                <Stack key={r.t} direction="row" spacing={1.1} sx={{
                  alignItems: 'flex-start', py: 1.4,
                  borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
                }}>
                  <Box sx={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0, mt: '1px',
                    bgcolor: 'rgba(27,57,91,.055)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ic sx={{ fontSize: 15, color: C.deep }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Typography sx={{
                        fontSize: 13, fontWeight: 700, color: C.deep, lineHeight: 1.3,
                      }}>{r.t}</Typography>
                      <Typography sx={{
                        px: 0.7, py: 0.2, borderRadius: '5px', whiteSpace: 'nowrap',
                        fontSize: 8, fontWeight: 800, letterSpacing: '.06em',
                        textTransform: 'uppercase',
                        bgcolor: 'rgba(224,164,0,.14)', color: C.yellowDeep,
                      }}>{r.b}</Typography>
                    </Stack>
                    <Typography sx={{ fontSize: 11, lineHeight: 1.45, color: C.ink2, mt: 0.35 }}>
                      {r.s}
                    </Typography>
                  </Box>
                </Stack>
              );
            })}
          </Box>

          {/* how it works, in three dated steps */}
          <Typography sx={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.15em',
            textTransform: 'uppercase', color: C.ink2, mt: 2.5, mb: 1.25,
          }}>How it works</Typography>
          <Stack spacing={1.4}>
            {kp.steps.map((x, n) => (
              <Stack key={x.t} direction="row" spacing={1.4} sx={{ alignItems: 'flex-start' }}>
                <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 12.5, fontWeight: 600,
                  color: C.yellowDeep, flexShrink: 0, width: 20, mt: '1px',
                }}>{String(n + 1).padStart(2, '0')}</Typography>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep, lineHeight: 1.3 }}>
                    {x.t}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>{x.s}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>

          {/* ── deliver to ── */}
          <Typography sx={{
            fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
            textTransform: 'uppercase', color: C.ink2, mt: 3, mb: 1,
          }}>Deliver to</Typography>
          <Stack direction="row" spacing={1.5} sx={{
            alignItems: 'flex-start', px: 1.9, py: 1.7, borderRadius: '16px',
            bgcolor: '#fff', boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
          }}>
            <HomeOutlinedIcon sx={{ fontSize: 19, color: C.deep, flexShrink: 0, mt: '2px' }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
                <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
                  {addrs[addrAt].tag}
                </Typography>
                <Typography sx={{ fontSize: 12, color: C.ink2 }}>· {addrs[addrAt].name}</Typography>
              </Stack>
              <Typography sx={{ fontSize: 12.5, color: C.ink, mt: 0.4, lineHeight: 1.5 }}>
                {addrs[addrAt].line}, {addrs[addrAt].city}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>
                {addrs[addrAt].phone}
              </Typography>
            </Box>
            <Typography onClick={() => setAddrOpen(true)} sx={{
              fontSize: 12.5, fontWeight: 700, color: C.teal, cursor: 'pointer',
              flexShrink: 0, mt: '2px',
            }}>Change</Typography>
          </Stack>
          <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.8, ml: 0.5 }}>
            Delivered in cold chain. Someone should be home to receive it.
          </Typography>

          {/* No blood test to start. Said plainly, because it is the whole
              difference between this plan and the programme. */}
          <Stack direction="row" spacing={1.25} sx={{
            mt: 2.25, px: 1.75, py: 1.5, borderRadius: '14px',
            bgcolor: 'rgba(224,164,0,.09)', alignItems: 'flex-start',
          }}>
            <InfoOutlinedIcon sx={{ fontSize: 17, color: C.yellowDeep, flexShrink: 0, mt: '1px' }} />
            <Typography sx={{ fontSize: 12, lineHeight: 1.55, color: C.deep }}>
              {kp.note}
            </Typography>
          </Stack>
        </Box>

        <Box sx={{
          flexShrink: 0, px: 2.25, pt: 1.5, pb: 2,
          borderTop: `1px solid ${C.line}`, bgcolor: '#FAF6ED',
        }}>
          <Button fullWidth variant="contained" color="secondary" onClick={() => setPay(true)}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
            sx={{ py: 1.4, fontSize: 15.5 }}>
            {renew ? 'Renew my plan' : 'Start my plan'} · SAR {kprice}
          </Button>
          <Stack direction="row" spacing={0.6} sx={{
            alignItems: 'center', justifyContent: 'center', mt: 1,
          }}>
            <LockOutlinedIcon sx={{ fontSize: 12, color: C.ink2 }} />
            <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', lineHeight: 1.45 }}>
              Billed monthly. A doctor reviews every order before it ships.
            </Typography>
          </Stack>
        </Box>

        <AddressSheet open={addrOpen} addrs={addrs} at={addrAt}
          onPick={(i) => { setAddrAt(i); setAddrOpen(false); }}
          onAdd={(a) => { setAddrs((xs) => [...xs, a]); setAddrAt(addrs.length); setAddrOpen(false); }}
          onClose={() => setAddrOpen(false)} />

        <PaySheet open={pay}
          item={`${kp.title} with ${c.short}`}
          fee={kprice}
          onClose={() => setPay(false)} onDone={onPaid} />
      </Box>
    );
  }

  const plan = carePlan(pKey, { door, wants });
  const price = plan.price.toLocaleString();

  const card = { borderRadius: '18px', bgcolor: '#fff', boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)' };
  const label = (t, sx) => (
    <Typography sx={{
      fontSize: 10.5, fontWeight: 800, letterSpacing: '.14em',
      textTransform: 'uppercase', color: C.deep, ...sx,
    }}>{t}</Typography>
  );

  return (
    <Box sx={{
      height: '100%', position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', bgcolor: '#FAF6ED',
    }}>
      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pt: 1.75, pb: 2 }}>
        {/* Header: back on the left, the clinician on the right. */}
        <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <IconButton onClick={onBack} size="small" sx={{
            width: 34, height: 34, bgcolor: '#fff', color: C.deep,
            boxShadow: '0 6px 18px -10px rgba(27,57,91,.45)',
            '&:hover': { bgcolor: '#fff' },
          }}>
            <ArrowBackIosNewIcon sx={{ fontSize: 14 }} />
          </IconButton>
          <Box sx={{
            width: 38, height: 38, borderRadius: '50%', overflow: 'hidden',
            bgcolor: C.yellow, border: '2px solid #fff',
            boxShadow: '0 6px 16px -8px rgba(27,57,91,.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {c.img
              ? <Box component="img" src={c.img} alt="" sx={{
                  width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
                }} />
              : <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 13, fontWeight: 600, color: C.deep,
                }}>{c.mono}</Typography>}
          </Box>
        </Stack>

        {/* The title is the whole hero: programme name and price, nothing
            else. The known door never reaches this layout anymore; it has
            its own simple monthly plan above. */}
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 28, fontWeight: 600,
          lineHeight: 1.15, color: C.deep, mt: 1.75,
        }}>{plan.title}</Typography>

        {/* ── the price card ── */}
        <Stack direction="row" sx={{ ...card, mt: 1.75, px: 2, py: 2, alignItems: 'center' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 600,
              color: C.deep, lineHeight: 1.1,
            }}>SAR {price}</Typography>
            <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.5 }}>
              One payment to begin your care.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexShrink: 0, pl: 1.5, maxWidth: 140 }}>
            <GppGoodOutlinedIcon sx={{ fontSize: 26, color: C.yellowDeep, flexShrink: 0 }} />
            <Typography sx={{ fontSize: 11.5, lineHeight: 1.4, color: C.deep }}>
              Clinician-led care from start to finish
            </Typography>
          </Stack>
        </Stack>

        {/* ── the care table: one card, four quiet sections ── */}
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mt: 2.75, mb: 1.5 }}>
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(224,164,0,.4)' }} />
          {label('What’s included & when it happens')}
          <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(224,164,0,.4)' }} />
        </Stack>

        <Box sx={{ ...card, px: 1.75, overflow: 'hidden' }}>
          {plan.sections.map((sec) => (
            <Box key={sec.k}>
              {/* The section band: full-bleed tint inside the card. This is
                  the entire segmentation device — no borders, no sub-cards.
                  Each section carries its own quiet hue. */}
              <Box sx={{
                mx: -1.75, px: 1.75, py: 0.7,
                bgcolor: (TONES[sec.k] || TONES.team).bg,
              }}>
                <Typography sx={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '.15em',
                  textTransform: 'uppercase', color: (TONES[sec.k] || TONES.team).fg,
                }}>{sec.t}</Typography>
              </Box>
              {sec.rows.map((r, i) => {
                const Ic = ICONS[r.ic] || ScienceOutlinedIcon;
                return (
                  <Stack key={r.t} direction="row" spacing={1.1} sx={{
                    alignItems: 'flex-start', py: 1.25,
                    borderTop: i === 0 ? 'none' : `1px solid ${C.line}`,
                  }}>
                    <Box sx={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, mt: '1px',
                      bgcolor: 'rgba(27,57,91,.055)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ic sx={{ fontSize: 14, color: C.deep }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" spacing={0.8} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        <Typography sx={{
                          fontSize: 12.5, fontWeight: 700, color: C.deep, lineHeight: 1.3,
                        }}>{r.t}</Typography>
                        <Typography sx={{
                          px: 0.7, py: 0.2, borderRadius: '5px', whiteSpace: 'nowrap',
                          fontSize: 8, fontWeight: 800, letterSpacing: '.06em',
                          textTransform: 'uppercase',
                          bgcolor: 'rgba(224,164,0,.14)', color: C.yellowDeep,
                        }}>{r.b}</Typography>
                      </Stack>
                      <Typography sx={{ fontSize: 10.5, lineHeight: 1.45, color: C.ink2, mt: 0.35 }}>
                        {r.s}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Box>
          ))}

          {/* The table's last row: the door to the week-by-week view. */}
          <Stack direction="row" onClick={() => setTour(true)} sx={{
            mx: -1.75, px: 1.75, py: 1.5, alignItems: 'center',
            justifyContent: 'space-between', cursor: 'pointer',
            borderTop: `1px solid ${C.line}`,
            '&:active': { bgcolor: 'rgba(27,57,91,.03)' },
          }}>
            <Typography sx={{
              fontSize: 10.5, fontWeight: 800, letterSpacing: '.13em',
              textTransform: 'uppercase', color: C.deep,
            }}>View entire programme journey</Typography>
            <EastRoundedIcon sx={{ fontSize: 17, color: C.deep }} />
          </Stack>
        </Box>

        {/* How the care works — sequencing, never a blocker. The 12-week
            loop card that used to sit here duplicated the journey sheet one
            tap above, so it went. */}
        <Stack direction="row" spacing={1.25} sx={{
          mt: 1.75, px: 1.75, py: 1.75, borderRadius: '14px',
          bgcolor: 'rgba(224,164,0,.09)', alignItems: 'flex-start',
        }}>
          <InfoOutlinedIcon sx={{ fontSize: 18, color: C.yellowDeep, flexShrink: 0, mt: '1px' }} />
          <Typography sx={{ fontSize: 12.5, lineHeight: 1.55, color: C.deep }}>
            {plan.how}
          </Typography>
        </Stack>
      </Box>

      {/* ── the commitment, frozen: visible wherever the page is scrolled ── */}
      <Box sx={{
        flexShrink: 0, px: 2.25, pt: 1.5, pb: 2,
        borderTop: `1px solid ${C.line}`, bgcolor: '#FAF6ED',
      }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => setPay(true)}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 18 }} />}
          sx={{ py: 1.4, fontSize: 15.5 }}>
          Activate my plan · SAR {price}
        </Button>
        <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center', justifyContent: 'center', mt: 1 }}>
          <LockOutlinedIcon sx={{ fontSize: 12, color: C.ink2 }} />
          <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', lineHeight: 1.45 }}>
            12 weeks of clinician-led care, testing, treatment and follow-up. One payment.
          </Typography>
        </Stack>
      </Box>

      {/* ── the programme journey, week by week ── */}
      <Box onClick={() => setTour(false)} sx={{
        position: 'absolute', inset: 0, bgcolor: 'rgba(14,27,44,.4)',
        opacity: tour ? 1 : 0, pointerEvents: tour ? 'auto' : 'none',
        transition: 'opacity .3s',
      }} />
      <Box sx={{
        position: 'absolute', left: 0, right: 0, bottom: 0, top: 44,
        borderRadius: '24px 24px 0 0', bgcolor: '#FAF6ED',
        boxShadow: '0 -12px 40px -18px rgba(14,27,44,.55)',
        transform: tour ? 'none' : 'translateY(105%)',
        transition: 'transform .38s cubic-bezier(.2,.9,.25,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <Stack direction="row" sx={{
          alignItems: 'center', justifyContent: 'space-between',
          px: 2.5, pt: 2.25, pb: 1.5, flexShrink: 0,
        }}>
          <Typography sx={{
            fontFamily: '"Fraunces", serif', fontSize: 21, fontWeight: 600, color: C.deep,
          }}>Programme journey</Typography>
          <IconButton onClick={() => setTour(false)} size="small" sx={{
            width: 30, height: 30, bgcolor: 'rgba(27,57,91,.06)', color: C.deep,
          }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Stack>

        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.5, pb: 2.5 }}>
          {/* The churn-killing sentence: early silence is normal. */}
          <Typography sx={{ fontSize: 11.5, lineHeight: 1.55, color: C.ink2, mb: 1 }}>
            {plan.pace}
          </Typography>

          {plan.timeline.map((x) => (
            <Box key={x.w} sx={{
              py: 1.6, borderBottom: '1px dashed rgba(27,57,91,.18)',
              '&:last-of-type': { borderBottom: 'none' },
            }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{
                  px: 0.8, py: 0.25, borderRadius: '5px', display: 'inline-block',
                  fontSize: 8.5, fontWeight: 800, letterSpacing: '.09em',
                  textTransform: 'uppercase',
                  bgcolor: x.done ? 'rgba(39,153,91,.14)' : 'rgba(27,57,91,.07)',
                  color: x.done ? C.green : C.deep,
                }}>{x.w}</Typography>
                {x.done && (
                  <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center' }}>
                    <CheckRoundedIcon sx={{ fontSize: 14, color: C.green }} />
                    <Typography sx={{ fontSize: 10, fontWeight: 700, color: C.green }}>
                      Done
                    </Typography>
                  </Stack>
                )}
              </Stack>
              <Typography sx={{
                fontSize: 13.5, fontWeight: 700, color: C.deep, lineHeight: 1.3, mt: 0.7,
              }}>{x.t}</Typography>
              <Typography sx={{ fontSize: 11.5, lineHeight: 1.5, color: C.ink2, mt: 0.4 }}>
                {x.s}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      <PaySheet open={pay}
        item={`12 weeks of care with ${c.short}`}
        fee={price}
        onClose={() => setPay(false)} onDone={onPaid} />
    </Box>
  );
}


/*
 * THE ADDRESS SHEET — the shape every checkout has taught.
 *
 * Saved addresses first, selected with one tap. The add-new form stays behind
 * a row rather than greeting the user with four empty fields, because in the
 * common case the address already exists and the form is noise.
 */
function AddressSheet({ open, addrs, at, onPick, onAdd, onClose }) {
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ tag: '', line: '', city: '', phone: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const ok = f.tag && f.line && f.city;

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute', bgcolor: 'rgba(0,0,0,.45)' } },
        paper: {
          sx: {
            position: 'absolute', borderTopLeftRadius: 14, borderTopRightRadius: 14,
            bgcolor: C.cream, backgroundImage: 'none',
          },
        },
      }}>
      <Box sx={{ px: 2.5, pt: 2.25, pb: 3.5 }}>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 19, fontWeight: 600, color: C.deep, mb: 1.75,
        }}>{adding ? 'Add a new address' : 'Deliver to'}</Typography>

        {!adding ? (
          <>
            <Stack spacing={0.9}>
              {addrs.map((a, i) => {
                const on = i === at;
                return (
                  <Stack key={a.tag + i} direction="row" spacing={1.4} onClick={() => onPick(i)} sx={{
                    alignItems: 'flex-start', px: 1.75, py: 1.5, borderRadius: '14px',
                    cursor: 'pointer', bgcolor: '#fff',
                    border: `1.5px solid ${on ? C.deep : 'rgba(27,57,91,.12)'}`,
                  }}>
                    <Box sx={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, mt: '2px',
                      border: `2px solid ${on ? C.deep : 'rgba(27,57,91,.3)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {on && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: C.deep }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>{a.tag}</Typography>
                      <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.25, lineHeight: 1.45 }}>
                        {a.line}, {a.city}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
            <Typography onClick={() => setAdding(true)} sx={{
              fontSize: 13.5, fontWeight: 700, color: C.teal, mt: 1.75,
              cursor: 'pointer', textAlign: 'center',
            }}>+ Add a new address</Typography>
          </>
        ) : (
          <>
            <Stack spacing={1.25}>
              <TextField size="small" label="Label (Home, Office…)" value={f.tag} onChange={set('tag')} />
              <TextField size="small" label="Street and building" value={f.line} onChange={set('line')} />
              <TextField size="small" label="City and district" value={f.city} onChange={set('city')} />
              <TextField size="small" label="Phone for the courier" value={f.phone} onChange={set('phone')} />
            </Stack>
            <Button fullWidth variant="contained" color="secondary" disabled={!ok}
              onClick={() => { onAdd({ ...f, name: USER.full, phone: f.phone || '+966 50 123 4567' }); setAdding(false); setF({ tag: '', line: '', city: '', phone: '' }); }}
              sx={{ mt: 2, py: 1.25 }}>
              Save and deliver here
            </Button>
            <Typography onClick={() => setAdding(false)} sx={{
              fontSize: 12.5, color: C.ink2, mt: 1.25, cursor: 'pointer', textAlign: 'center',
            }}>Back to saved addresses</Typography>
          </>
        )}
      </Box>
    </Drawer>
  );
}
