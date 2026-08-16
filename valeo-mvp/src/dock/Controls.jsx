import { Box, Stack, Typography } from '@mui/material';
import { TRANSITIONS, canFire, target } from '../machine';
import { C } from '../theme';

/*
 * THE REMOTE CONTROL.
 *
 * Everything the patient does happens on the phone. This panel exists only for
 * the moves that are not theirs: the clinician's yes and no, the pharmacy, the
 * nurse, and the clock — plus two shortcuts through the parts of the funnel
 * that are tedious to retype when you are demonstrating the fifth path of the
 * evening.
 *
 * A move that cannot be made is still shown, greyed, with the plain reason
 * why. That is more useful than hiding it: it says where the prototype is.
 */

const GROUPS = ['Funnel', 'Order', 'Delivery', 'The cycle'];

export default function Controls({ st, ui, fireEvent }) {
  const ep = target(st);

  return (
    <Box sx={{
      width: 470, flexShrink: 0, maxHeight: 844, overflowY: 'auto',
      borderRadius: '22px', bgcolor: '#FFFDF5', p: 2.5,
      boxShadow: '0 30px 70px -30px rgba(0,0,0,.5)',
    }}>
      <Typography sx={{
        fontSize: 10, fontWeight: 800, letterSpacing: '.18em',
        textTransform: 'uppercase', color: C.yellowDeep,
      }}>Valeo MVP</Typography>
      <Typography sx={{
        fontFamily: '"Fraunces", serif', fontSize: 21, fontWeight: 600,
        color: C.deep, mt: 0.5, lineHeight: 1.2,
      }}>Drive the flow</Typography>
      <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.5, lineHeight: 1.5 }}>
        The moves that happen off the phone: the clinician, the pharmacy, the
        nurse and the clock. Everything else is on the phone itself.
      </Typography>

      {GROUPS.map((g) => {
        const items = TRANSITIONS.filter((t) => t.group === g);
        if (!items.length) return null;
        return (
          <Box key={g} sx={{ mt: 2 }}>
            <Typography sx={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.13em',
              textTransform: 'uppercase', color: C.ink2, mb: 0.75,
            }}>{g}</Typography>
            <Stack spacing={0.75}>
              {items.map((t) => {
                const on = canFire(t, st, ui, ep);
                return (
                  <Box key={t.event} onClick={on ? () => fireEvent(t.event, ep) : undefined} sx={{
                    px: 1.5, py: 1, borderRadius: '12px',
                    cursor: on ? 'pointer' : 'default',
                    bgcolor: on ? C.yellow : 'rgba(27,57,91,.04)',
                    border: on ? '1.5px solid rgba(224,164,0,.5)' : `1.5px solid ${C.line}`,
                    opacity: on ? 1 : 0.62,
                    transition: 'opacity .2s, background-color .2s',
                    '&:active': on ? { transform: 'scale(.99)' } : {},
                  }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography sx={{
                        flex: 1, minWidth: 0, fontSize: 12, fontWeight: 700,
                        color: on ? C.deep : C.ink2, textTransform: 'lowercase',
                      }}>{t.event.toLowerCase()}</Typography>
                      <Typography sx={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '.09em',
                        textTransform: 'uppercase',
                        color: on ? C.yellowDeep : C.ink2, opacity: on ? 1 : 0.8,
                      }}>{t.actor}</Typography>
                    </Stack>
                    <Typography sx={{
                      fontSize: 10.5, lineHeight: 1.45, color: on ? C.ink : C.ink2, mt: 0.25,
                    }}>{on ? t.hint : t.reason}</Typography>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}
