import { useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CheckIcon from '@mui/icons-material/Check';
import PaySheet from '../components/PaySheet';
import { carePlans, compareRows, coachOf, givenNameOf } from '../data';
import { C } from '../theme';

/** Width of one plan column. Two of them plus a 186px label column fill the
 *  350px of content the 390px frame allows. */
const COL = 82;

/**
 * SCREEN TWO — CHOOSE YOUR CARE.
 *
 * Two lengths of care, and the whole comparison on one screen with nothing to
 * scroll.
 *
 * ── WHY A TABLE AND NOT TWO CARDS ──
 * Two cards stacked the same seven items twice, which put the second plan
 * below the fold and turned a comparison into a memory test. A person cannot
 * compare what they cannot see at the same time. The table says each item
 * once and lets the two columns answer it, so the screen carries the same
 * information in a third of the height.
 *
 * ── THE CELLS ARE NOT ALL TICKS ──
 * The plans do not differ in WHAT they contain. They differ in HOW MUCH: one
 * blood test or two, one review or three. So a cell holds a number wherever
 * the plans differ, a tick where the item is simply included, and a dash for
 * the one thing the short plan does not have. A column of identical ticks
 * would look like a comparison while making none.
 *
 * ── THERE IS NO MEDICATION TOGGLE ──
 * Every Valeo plan includes the medication. A toggle offering care without it
 * would advertise a plan that does not exist and make every price look like
 * it had a cheaper version behind it. The line under the heading states the
 * promise once, and medication is a row in the table like any other.
 *
 * ── ONE CHOICE, MADE IN ONE PLACE ──
 * The column headings are the control: tapping one slides a white card behind
 * that column and the single button at the bottom follows it. Two buttons,
 * one under each plan, would ask the patient to choose twice — once with
 * their eyes and again with their thumb.
 *
 * ── THE SAVING IS ARITHMETIC, NOT PERSUASION ──
 * Three months costs less than three single months, and the difference is
 * stated under the button as a number the patient can check. That is the
 * honest argument for the longer plan, which is why no badge says
 * "recommended" and no column is called "best value".
 */
export default function Buy({ pKey, onBack, onPaid }) {
  const c = coachOf(pKey);
  const [sel, setSel] = useState('m3');
  const [pay, setPay] = useState(false);

  if (!c) return null;
  const first = givenNameOf(c);
  const plans = carePlans(pKey);
  const chosen = plans.find((pl) => pl.k === sel) || plans[1];
  const rows = compareRows(first);
  const save = plans[0].price * 3 - plans[1].price;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      <Box sx={{ px: 1, pt: 1, flexShrink: 0 }}>
        <IconButton onClick={onBack} size="small" sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.5 }}>
        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.18em',
          textTransform: 'uppercase', color: C.ink2, textAlign: 'center',
        }}>Choose your care</Typography>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 27, fontWeight: 600,
          lineHeight: 1.15, color: C.deep, mt: 0.9, textAlign: 'center',
        }}>Your care with {first}</Typography>

        {/* The promise the toggle used to carry, said once and for both plans. */}
        <Typography sx={{
          fontSize: 13, lineHeight: 1.5, color: C.ink2, mt: 1.4,
          textAlign: 'center', px: 1,
        }}>
          Both plans include your medication, delivered to you.
        </Typography>

        {/* ── the comparison ── */}
        <Box sx={{ position: 'relative', mt: 4.5 }}>
          {/* The selected column, as a card that slides between the two. It
              overhangs its column by only 4px: the plan headings are nearly as
              wide as the column, so a fatter card would run its border into
              the word beside it. */}
          <Box sx={{
            position: 'absolute', top: -14, bottom: -6, right: -4, width: COL + 8,
            borderRadius: '20px', bgcolor: '#fff',
            border: `1.5px solid ${C.yellow}`,
            boxShadow: '0 14px 36px -22px rgba(27,57,91,.6)',
            transform: sel === 'm1' ? `translateX(-${COL}px)` : 'none',
            transition: 'transform .34s cubic-bezier(.2,.9,.25,1)',
          }} />

          {/* Headings, which are also the control. */}
          <Stack direction="row" sx={{ position: 'relative', alignItems: 'flex-end' }}>
            <Box sx={{ flex: 1 }} />
            {plans.map((pl) => {
              const on = sel === pl.k;
              return (
                <Box key={pl.k} onClick={() => setSel(pl.k)} sx={{
                  width: COL, flexShrink: 0, textAlign: 'center', cursor: 'pointer', pb: 1.4,
                }}>
                  <Typography sx={{
                    fontFamily: '"Fraunces", serif', fontSize: 14, fontWeight: 600,
                    lineHeight: 1.1, whiteSpace: 'nowrap',
                    color: on ? C.deep : 'rgba(27,57,91,.62)',
                    transition: 'color .25s',
                  }}>{pl.t}</Typography>
                  <Typography sx={{
                    fontSize: 12.5, fontWeight: 700, mt: 0.55, whiteSpace: 'nowrap',
                    color: on ? C.deep : 'rgba(27,57,91,.58)', transition: 'color .25s',
                  }}>SAR {pl.price.toLocaleString()}</Typography>
                  {/* The 1 month column keeps this line empty so both headings
                      are the same height and the cells below stay aligned. */}
                  <Typography sx={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: '.04em',
                    color: on ? C.yellowDeep : 'rgba(27,57,91,.35)',
                    minHeight: 13, transition: 'color .25s',
                  }}>
                    {pl.months > 1 ? `${Math.round(pl.price / pl.months).toLocaleString()}/mo` : ''}
                  </Typography>
                </Box>
              );
            })}
          </Stack>

          {rows.map((r, i) => (
            <Stack key={r.t} direction="row" sx={{ position: 'relative', alignItems: 'center' }}>
              {/* The rule runs under the label only. It would otherwise cut
                  across the selected card and break the illusion of a card. */}
              <Box sx={{
                flex: 1, minWidth: 0, py: 1.6,
                borderTop: `1px solid ${i === 0 ? 'transparent' : C.line}`,
              }}>
                <Typography sx={{
                  fontSize: 13.5, fontWeight: 700, color: C.deep, lineHeight: 1.25,
                }}>{r.t}</Typography>
                <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.15 }}>{r.s}</Typography>
              </Box>
              {plans.map((pl) => (
                <Cell key={pl.k} {...r[pl.k]} on={sel === pl.k} />
              ))}
            </Stack>
          ))}
        </Box>
      </Box>

      <Box sx={{ px: 2.5, pt: 2, pb: 2.5, flexShrink: 0 }}>
        <Button fullWidth variant="contained" color="secondary" onClick={() => setPay(true)}>
          Start {chosen.t}
        </Button>
        <Typography sx={{
          fontSize: 11.5, lineHeight: 1.5, color: C.ink2, mt: 1.2, textAlign: 'center',
        }}>
          One payment of SAR {chosen.price.toLocaleString()}
          {chosen.k === 'm3' && `, SAR ${save.toLocaleString()} less than three single months`}
          . {first} confirms your treatment once your results are in.
        </Typography>
      </Box>

      <PaySheet open={pay}
        item={`${chosen.t} of care with ${c.short}`}
        fee={chosen.price.toLocaleString()}
        onClose={() => setPay(false)} onDone={onPaid} />
    </Box>
  );
}

/** One cell. A number where the plans differ, a tick where the item is simply
 *  included, a dash where it is absent. The caption underneath says when. */
function Cell({ v, c, on }) {
  return (
    <Box sx={{
      width: COL, flexShrink: 0, position: 'relative',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', alignSelf: 'stretch',
    }}>
      {/* The unselected column is not disabled, only unchosen. It stays legible
          enough to compare against, which is the entire point of a table. */}
      {v === true ? (
        <CheckIcon sx={{
          fontSize: 20, color: on ? C.yellowDeep : 'rgba(27,57,91,.42)',
          transition: 'color .25s',
        }} />
      ) : v === null ? (
        <Typography sx={{ fontSize: 15, color: 'rgba(27,57,91,.26)', lineHeight: 1 }}>—</Typography>
      ) : (
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 19, fontWeight: 600, lineHeight: 1,
          color: on ? C.deep : 'rgba(27,57,91,.58)', transition: 'color .25s',
        }}>{v}</Typography>
      )}
      {c && (
        <Typography sx={{
          fontSize: 8.5, fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase',
          color: on ? C.ink2 : 'rgba(27,57,91,.4)', mt: 0.45, transition: 'color .25s',
          whiteSpace: 'nowrap',
        }}>{c}</Typography>
      )}
    </Box>
  );
}
