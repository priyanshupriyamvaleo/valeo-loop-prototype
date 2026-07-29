import { useState } from 'react';
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RemoveIcon from '@mui/icons-material/Remove';
import { SIM_EXAMPLES, SIM_VERDICT, DOCTOR } from '../data';
import { C } from '../theme';

/**
 * Run something through the twin.
 *
 * The whole value is in giving TWO kinds of no. "Not real" and "not for you"
 * are different findings and collapsing them is how a health product loses
 * trust — one is a claim about the world, the other is a claim about you.
 *
 * Deliberately framed as comparative and hedged rather than predictive. "This
 * would raise your testosterone 12%" is a clinical prediction; "here is what
 * it touches in you, and here is what it collides with" is not. That framing
 * is also the one that survives a regulator reading it.
 */
export default function SimSheet({ open, onClose }) {
  const [run, setRun] = useState(null);
  const [busy, setBusy] = useState(false);

  const go = (ex) => {
    setBusy(true);
    setTimeout(() => { setRun(ex); setBusy(false); }, 900);
  };
  const reset = () => { setRun(null); setBusy(false); };
  const close = () => { reset(); onClose(); };

  return (
    <Drawer anchor="bottom" open={open} onClose={close}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: {
          sx: {
            position: 'absolute', borderTopLeftRadius: 26, borderTopRightRadius: 26,
            height: '92%', bgcolor: C.cream, backgroundImage: 'none',
          },
        },
      }}>
      <Stack direction="row" spacing={1.5} sx={{
        alignItems: 'center', px: 2.25, py: 1.75, flexShrink: 0,
        borderBottom: `1px solid ${C.line}`,
      }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
            {run ? run.label : 'Run it through your twin'}
          </Typography>
          <Typography sx={{ fontSize: 11, color: C.ink2 }}>
            {run ? run.src : 'Paste a link, or pick one below'}
          </Typography>
        </Box>
        <IconButton onClick={run ? reset : close} size="small" sx={{ color: C.ink2 }}>
          <CloseIcon sx={{ fontSize: 19 }} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, py: 2.25 }}>
        {busy && (
          <Stack spacing={1.1}>
            {['Reading the claim', 'Checking it against evidence',
              'Scoring it against your panel', 'Looking for collisions'].map((t, i) => (
              <Stack key={t} direction="row" spacing={1.25} sx={{ alignItems: 'center', py: 0.7 }}>
                <Box sx={{
                  width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                  bgcolor: i === 0 ? C.yellow : 'rgba(27,57,91,.2)',
                }} />
                <Typography sx={{ fontSize: 13, color: i === 0 ? C.deep : C.ink2 }}>{t}</Typography>
              </Stack>
            ))}
          </Stack>
        )}

        {!busy && !run && (
          <>
            <Box sx={{
              px: 1.9, py: 1.75, borderRadius: '17px', mb: 2.5,
              bgcolor: 'rgba(27,57,91,.04)', border: `1.5px dashed rgba(27,57,91,.2)`,
            }}>
              <Typography sx={{ fontSize: 13, color: C.ink2, lineHeight: 1.5 }}>
                A reel, a supplement label, a stack a friend sent you. Your twin checks whether the
                claim holds, then whether it holds <b style={{ color: C.deep }}>for you</b>.
              </Typography>
            </Box>

            <Typography sx={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
              color: C.ink2, mb: 1.25,
            }}>Try one</Typography>
            <Stack spacing={1}>
              {SIM_EXAMPLES.map((ex) => (
                <Stack key={ex.label} direction="row" spacing={1.25} onClick={() => go(ex)} sx={{
                  alignItems: 'center', px: 1.9, py: 1.6, borderRadius: '16px', cursor: 'pointer',
                  bgcolor: '#fff', boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
                }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: 13.5, fontWeight: 600, color: C.deep }}>
                      {ex.label}
                    </Typography>
                    <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.2 }}>{ex.src}</Typography>
                  </Box>
                  <ArrowUpwardIcon sx={{ fontSize: 16, color: C.ink2, flexShrink: 0 }} />
                </Stack>
              ))}
            </Stack>
          </>
        )}

        {!busy && run && (() => {
          const V = SIM_VERDICT[run.verdict];
          return (
            <>
              {/* the verdict, before any reasoning */}
              <Box sx={{
                px: 2, py: 2, borderRadius: '20px', color: '#fff',
                background: run.verdict === 'yes'
                  ? `linear-gradient(150deg,${C.green},#1C7245)`
                  : run.verdict === 'no'
                    ? `linear-gradient(150deg,${C.coral},#B03544)`
                    : `linear-gradient(150deg,#5E6E82,#43505F)`,
              }}>
                <Typography sx={{
                  fontSize: 9.5, fontWeight: 800, letterSpacing: '.16em',
                  textTransform: 'uppercase', color: 'rgba(255,255,255,.72)',
                }}>◈ {V.s}</Typography>
                <Typography sx={{
                  fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 600, mt: 0.75,
                }}>{V.t}</Typography>
                <Typography sx={{
                  fontSize: 12.5, lineHeight: 1.5, color: 'rgba(255,255,255,.85)', mt: 1,
                }}>Claim: {run.claim}</Typography>
              </Box>

              <Label sx={{ mt: 3 }}>Does the claim hold?</Label>
              <Box sx={{
                px: 1.9, py: 1.6, borderRadius: '16px', bgcolor: '#fff',
                boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
              }}>
                <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: C.ink }}>
                  {run.evidence}
                </Typography>
              </Box>

              <Label sx={{ mt: 3 }}>What it touches in you</Label>
              <Stack spacing={0.9}>
                {run.onYou.map((o) => (
                  <Stack key={o.sys} direction="row" spacing={1.5} sx={{
                    alignItems: 'flex-start', px: 1.9, py: 1.5, borderRadius: '16px', bgcolor: '#fff',
                    boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
                  }}>
                    <Box sx={{
                      width: 22, height: 22, borderRadius: '7px', flexShrink: 0, mt: '1px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: o.dir === 'better' ? 'rgba(39,153,91,.14)'
                        : o.dir === 'worse' ? 'rgba(233,79,95,.14)' : 'rgba(27,57,91,.07)',
                      color: o.dir === 'better' ? C.green : o.dir === 'worse' ? C.coral : C.ink2,
                    }}>
                      {o.dir === 'better' ? <ArrowUpwardIcon sx={{ fontSize: 13 }} />
                        : o.dir === 'worse' ? <ArrowDownwardIcon sx={{ fontSize: 13 }} />
                        : <RemoveIcon sx={{ fontSize: 13 }} />}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep }}>
                        {o.sys}
                      </Typography>
                      <Typography sx={{ fontSize: 12, color: C.ink2, mt: 0.2, lineHeight: 1.45 }}>
                        {o.t}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>

              <Label sx={{ mt: 3 }}>Collisions</Label>
              <Box sx={{
                px: 1.9, py: 1.6, borderRadius: '16px',
                bgcolor: 'rgba(255,185,0,.10)', border: `1px solid rgba(255,185,0,.4)`,
              }}>
                <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: C.ink }}>
                  {run.collides}
                </Typography>
              </Box>

              {run.instead && (
                <>
                  <Label sx={{ mt: 3 }}>Instead</Label>
                  <Box sx={{
                    px: 1.9, py: 1.6, borderRadius: '16px',
                    bgcolor: 'rgba(64,143,164,.09)', border: `1px solid rgba(64,143,164,.3)`,
                  }}>
                    <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: C.ink }}>
                      {run.instead}
                    </Typography>
                  </Box>
                </>
              )}

              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2.5, lineHeight: 1.55 }}>
                This is a comparison against your own panel, not a prediction. If you want it
                prescribed or ruled out properly, {DOCTOR.name.split(' ')[1]} is the one who decides.
              </Typography>
            </>
          );
        })()}
      </Box>

      <Box sx={{ px: 2.25, pt: 1.5, pb: 3, flexShrink: 0, borderTop: `1px solid ${C.line}` }}>
        <Button fullWidth variant="contained" color={run ? 'primary' : 'secondary'}
                onClick={run ? reset : close}>
          {run ? 'Run something else' : 'Close'}
        </Button>
      </Box>
    </Drawer>
  );
}

function Label({ children, sx }) {
  return (
    <Typography sx={{
      fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
      color: C.ink2, mb: 1.25, ...sx,
    }}>{children}</Typography>
  );
}
