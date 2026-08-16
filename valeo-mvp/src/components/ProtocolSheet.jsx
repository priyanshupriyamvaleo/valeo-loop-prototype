import {
  Box, Button, Drawer, IconButton, Stack, Typography, Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { PROTOCOLS, TIERS } from '../data';
import { C } from '../theme';

/**
 * The ⓘ destination. Three things a swipe decision needs and a card can't
 * hold: what's actually in it, what could go wrong, and who it's wrong for.
 *
 * It closes on the verdict promise. That single line is what keeps a
 * celebrity-led deck from being a fan-merch store — you arrive because
 * Huberman runs it, you stay because we tell you whether it worked on *you*.
 */
export default function ProtocolSheet({ twin, open, onClose, onSave, saved }) {
  if (!twin) return null;
  const p = PROTOCOLS[twin.protocol];
  const first = twin.name.split(' ')[0];

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}
      /* disablePortal + absolute keeps the sheet inside the phone frame.
         By default Modal portals to document.body and goes full-viewport. */
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: {
          sx: {
            position: 'absolute',
            borderTopLeftRadius: 26, borderTopRightRadius: 26,
            maxHeight: '92%', bgcolor: C.cream, backgroundImage: 'none',
          },
        },
      }}>
      {/* header keeps the person visible — this is their protocol, not a generic one */}
      <Box sx={{
        position: 'relative', px: 2.5, pt: 2.5, pb: 2.25, flexShrink: 0,
        background: `linear-gradient(160deg,${C.deep},#12283F)`, color: '#fff',
      }}>
        <IconButton onClick={onClose} sx={{
          position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,.7)',
          bgcolor: 'rgba(255,255,255,.1)', width: 32, height: 32,
        }}>
          <CloseIcon sx={{ fontSize: 17 }} />
        </IconButton>

        <Box sx={{ width: 38, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,.22)',
                   mx: 'auto', mb: 2 }} />

        <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center' }}>
          <Box sx={{
            width: 52, height: 52, borderRadius: '16px', flexShrink: 0, overflow: 'hidden',
            bgcolor: twin.tone, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,.85)',
          }}>
            {twin.img
              ? <Box component="img" src={twin.img} alt=""
                     sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : twin.mono}
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{
              fontSize: 7.5, fontWeight: 800, letterSpacing: '.2em',
              textTransform: 'uppercase', color: C.yellow,
            }}>◈ {TIERS[twin.tier].name} twin</Typography>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 20, fontWeight: 600, lineHeight: 1.15,
              mt: 0.4,
            }}>{twin.name}</Typography>
            <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,.6)', mt: 0.3 }}>
              {twin.role}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            <Typography sx={{ fontSize: 26, fontWeight: 800, color: C.yellow, lineHeight: 1 }}>
              {twin.match}
            </Typography>
            <Typography sx={{
              fontSize: 7, letterSpacing: '.16em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,.5)', mt: 0.4,
            }}>Match</Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={{ overflowY: 'auto', px: 2.5, pt: 2.5, pb: 1 }}>
        <Typography variant="h3" sx={{ color: C.deep }}>{p.t}</Typography>
        <Typography sx={{ fontSize: 14, color: C.ink2, mt: 1, lineHeight: 1.5 }}>
          {p.goal}
        </Typography>

        {/* the three facts, as a strip rather than prose */}
        <Stack direction="row" sx={{
          mt: 2.25, borderRadius: '16px', bgcolor: '#fff', overflow: 'hidden',
          boxShadow: '0 2px 12px -6px rgba(27,57,91,.3)',
        }} divider={<Divider orientation="vertical" flexItem />}>
          {[['Duration', `${p.wk} wk`], ['Scored on', p.mk], ['Tier', TIERS[twin.tier].name]]
            .map(([k, v]) => (
              <Box key={k} sx={{ flex: 1, minWidth: 0, px: 1.5, py: 1.5 }}>
                <Typography sx={{
                  fontSize: 8, fontWeight: 800, letterSpacing: '.14em',
                  textTransform: 'uppercase', color: C.ink2,
                }}>{k}</Typography>
                <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: C.deep, mt: 0.5 }}>
                  {v}
                </Typography>
              </Box>
            ))}
        </Stack>

        <Section title={`What ${first} runs`}>
          <Stack spacing={1}>
            {p.stack.map((s) => (
              <Stack key={s} direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
                <CheckIcon sx={{ fontSize: 16, color: C.green, mt: '2px', flexShrink: 0 }} />
                <Typography sx={{ fontSize: 13.5, lineHeight: 1.45, color: C.ink }}>{s}</Typography>
              </Stack>
            ))}
          </Stack>
        </Section>

        <Section title="What could go wrong" tone="warn">
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
            <WarningAmberIcon sx={{ fontSize: 17, color: C.yellowDeep, mt: '1px', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: C.ink }}>{p.risk}</Typography>
          </Stack>
        </Section>

        <Section title="Who it's wrong for" tone="warn">
          <Stack direction="row" spacing={1.25} sx={{ alignItems: 'flex-start' }}>
            <BlockIcon sx={{ fontSize: 17, color: C.coral, mt: '1px', flexShrink: 0 }} />
            <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: C.ink }}>{p.wrongFor}</Typography>
          </Stack>
        </Section>

        {/* the line that keeps this honest */}
        <Box sx={{
          mt: 2.5, mb: 1, p: 2, borderRadius: '18px', color: '#fff',
          background: `linear-gradient(152deg,${C.deep},#12283F)`,
        }}>
          <Typography sx={{
            fontSize: 8.5, fontWeight: 800, letterSpacing: '.18em',
            textTransform: 'uppercase', color: C.yellow,
          }}>◈ The part {first} can't give you</Typography>
          <Typography sx={{
            fontSize: 13, lineHeight: 1.55, mt: 1, color: 'rgba(255,255,255,.88)',
          }}>
            In <b style={{ color: '#fff' }}>{p.wk} weeks</b> we retest {p.mk} and tell you whether
            this worked <b style={{ color: C.yellow }}>on you</b> — not on {first}.
          </Typography>
        </Box>
      </Box>

      <Box sx={{
        px: 2.5, pt: 1.5, pb: 3, flexShrink: 0,
        borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        <Button fullWidth variant="contained" color={saved ? 'primary' : 'secondary'}
                startIcon={saved ? <CheckIcon /> : <FavoriteIcon />}
                onClick={saved ? onClose : onSave}>
          {saved ? 'Saved to your matches' : `Save ${first}'s protocol`}
        </Button>
        <Typography sx={{ fontSize: 11, color: C.ink2, textAlign: 'center', mt: 1.25 }}>
          Saving costs nothing — you commit on the coach call.
        </Typography>
      </Box>
    </Drawer>
  );
}

function Section({ title, children }) {
  return (
    <Box sx={{ mt: 2.75 }}>
      <Typography sx={{
        fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
        color: C.ink2, mb: 1.25,
      }}>{title}</Typography>
      {children}
    </Box>
  );
}
