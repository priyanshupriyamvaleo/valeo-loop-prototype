import { useState } from 'react';
import { Box, Button, Drawer, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import TwinGlyph from './TwinGlyph';
import { TWIN_ASKS, ASK_VERDICT, DOCTOR } from '../data';
import { C } from '../theme';

/**
 * Ask your twin.
 *
 * The answer people never get anywhere else is "no, not you" with the number
 * that says so — so every reply carries the marker it reasoned from. A chatbot
 * that only ever agrees with you is a search engine with worse manners.
 *
 * Escalation is offered, never automatic: an assistant that decides on your
 * behalf to involve a prescriber is making a medical decision.
 */
export default function TwinChat({ open, onClose }) {
  const [thread, setThread] = useState([]);
  const [sent, setSent] = useState(false);
  const asked = thread.map((t) => t.q);
  const left = TWIN_ASKS.filter((a) => !asked.includes(a.q));

  const ask = (a) => setThread((t) => [...t, a]);
  const close = () => { onClose(); };

  return (
    <Drawer anchor="bottom" open={open} onClose={close}
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: {
          sx: {
            position: 'absolute', borderTopLeftRadius: 26, borderTopRightRadius: 26,
            height: '90%', bgcolor: C.cream, backgroundImage: 'none',
          },
        },
      }}>
      <Stack direction="row" spacing={1.5} sx={{
        alignItems: 'center', px: 2.25, py: 1.75, flexShrink: 0,
        borderBottom: `1px solid ${C.line}`,
      }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(150deg,${C.deep},#12283F)`,
        }}>
          <TwinGlyph size={40} fill={0.7} loops={0} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
            Ask your twin
          </Typography>
          <Typography sx={{ fontSize: 11, color: C.ink2 }}>
            It has your panel, your logs and your protocol
          </Typography>
        </Box>
        <IconButton onClick={close} size="small" sx={{ color: C.ink2 }}>
          <CloseIcon sx={{ fontSize: 19 }} />
        </IconButton>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, py: 2.25 }}>
        {thread.length === 0 && (
          <Box sx={{
            px: 1.9, py: 1.5, borderRadius: '16px', bgcolor: '#fff', mb: 2,
            boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
          }}>
            <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: C.ink }}>
              Ask me whether something fits you. I answer from your own numbers, and I will tell you
              when the answer is no.
            </Typography>
          </Box>
        )}

        <Stack spacing={2.25}>
          {thread.map((a, i) => (
            <Box key={i}>
              {/* the question, as the user */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.25 }}>
                <Box sx={{
                  maxWidth: '84%', px: 1.9, py: 1.35, borderRadius: '16px',
                  borderBottomRightRadius: '5px', bgcolor: 'rgba(27,57,91,.07)',
                }}>
                  <Typography sx={{ fontSize: 13, lineHeight: 1.45, color: C.ink }}>{a.q}</Typography>
                </Box>
              </Box>

              {/* the verdict, stated before the reasoning */}
              <Box sx={{
                px: 1.9, py: 1.75, borderRadius: '18px', bgcolor: '#fff',
                borderLeft: `3px solid ${C[ASK_VERDICT[a.v].c]}`,
                boxShadow: '0 2px 12px -6px rgba(27,57,91,.28)',
              }}>
                <Typography sx={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
                  textTransform: 'uppercase', color: C[ASK_VERDICT[a.v].c], mb: 1,
                }}>{ASK_VERDICT[a.v].t}</Typography>

                <Stack spacing={0.9}>
                  {a.a.map((line) => (
                    <Typography key={line} sx={{ fontSize: 13, lineHeight: 1.5, color: C.ink }}>
                      {line}
                    </Typography>
                  ))}
                </Stack>

                {a.marker && <RangeBar {...a.marker} />}
              </Box>
            </Box>
          ))}
        </Stack>

        {/* escalation, once something has been asked */}
        {thread.length > 0 && (sent ? (
          <Stack direction="row" spacing={1.5} sx={{
            alignItems: 'center', mt: 2.25, px: 1.9, py: 1.6, borderRadius: '17px',
            bgcolor: 'rgba(39,153,91,.09)', border: `1.5px solid rgba(39,153,91,.35)`,
          }}>
            <Box component="img" src={DOCTOR.img} alt="" sx={{
              width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
            }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.green }}>
                Sent · he replies today
              </Typography>
              <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.15 }}>
                This thread went with your logs
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1.5} onClick={() => setSent(true)} sx={{
            alignItems: 'center', mt: 2.25, px: 1.9, py: 1.6, borderRadius: '17px',
            cursor: 'pointer',
            bgcolor: 'rgba(64,143,164,.10)', border: `1.5px solid rgba(64,143,164,.4)`,
          }}>
            <Box component="img" src={DOCTOR.img} alt="" sx={{
              width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
            }} />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep }}>
                Not convinced? Send it to {DOCTOR.name.split(' ')[1]}
              </Typography>
              <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.15 }}>
                A prescriber can overrule me
              </Typography>
            </Box>
            <ArrowUpwardIcon sx={{ fontSize: 17, color: C.teal, flexShrink: 0 }} />
          </Stack>
        ))}
      </Box>

      {/* suggested questions, in place of a keyboard that has nothing behind it */}
      <Box sx={{ px: 2.25, pt: 1.5, pb: 3, flexShrink: 0, borderTop: `1px solid ${C.line}` }}>
        {left.length > 0 ? (
          <>
            <Typography sx={{
              fontSize: 9, fontWeight: 800, letterSpacing: '.14em', textTransform: 'uppercase',
              color: C.ink2, mb: 1.1,
            }}>Try asking</Typography>
            <Stack spacing={0.75}>
              {left.slice(0, 3).map((a) => (
                <Stack key={a.q} direction="row" spacing={1} onClick={() => ask(a)} sx={{
                  alignItems: 'center', px: 1.6, py: 1.2, borderRadius: '14px', cursor: 'pointer',
                  bgcolor: 'rgba(27,57,91,.05)',
                }}>
                  <Typography sx={{ flex: 1, fontSize: 12.5, color: C.deep, fontWeight: 500 }}>
                    {a.q}
                  </Typography>
                  <ArrowUpwardIcon sx={{ fontSize: 15, color: C.ink2, flexShrink: 0 }} />
                </Stack>
              ))}
            </Stack>
          </>
        ) : (
          <Button fullWidth variant="contained" color="primary" onClick={close}>Done</Button>
        )}
      </Box>
    </Drawer>
  );
}

/**
 * One marker against its reference range. This is the whole reason the answer
 * is credible — a claim with a number beside it is checkable, and a claim
 * without one is a guess.
 */
function RangeBar({ t, v, lo, hi, unit, good }) {
  const span = hi - lo;
  const pad = span * 0.6;
  const min = lo - pad, max = hi + pad;
  const pos = Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
  const bandL = ((lo - min) / (max - min)) * 100;
  const bandW = (span / (max - min)) * 100;
  const col = good ? C.green : C.coral;

  return (
    <Box sx={{ mt: 1.75, pt: 1.5, borderTop: `1px solid ${C.line}` }}>
      <Stack direction="row" sx={{ alignItems: 'baseline', mb: 1.1 }}>
        <Typography sx={{ flex: 1, fontSize: 11, fontWeight: 700, color: C.ink2 }}>{t}</Typography>
        <Typography sx={{ fontSize: 14, fontWeight: 800, color: col }}>{v}{unit}</Typography>
      </Stack>
      <Box sx={{ position: 'relative', height: 8 }}>
        <Box sx={{
          position: 'absolute', inset: 0, borderRadius: '4px', bgcolor: 'rgba(27,57,91,.07)',
        }} />
        {/* the in-range band, so "out of range" is visible rather than asserted */}
        <Box sx={{
          position: 'absolute', top: 0, bottom: 0, left: `${bandL}%`, width: `${bandW}%`,
          borderRadius: '4px', bgcolor: 'rgba(39,153,91,.22)',
        }} />
        <Box sx={{
          position: 'absolute', top: -3, left: `${pos}%`, ml: '-7px',
          width: 14, height: 14, borderRadius: '50%', bgcolor: col,
          border: `2px solid ${C.cream}`,
        }} />
      </Box>
      <Stack direction="row" sx={{ mt: 0.75 }}>
        <Typography sx={{ flex: 1, fontSize: 9.5, color: C.ink2 }}>{lo}{unit}</Typography>
        <Typography sx={{ fontSize: 9.5, color: C.ink2 }}>{hi}{unit}</Typography>
      </Stack>
      <Typography sx={{ fontSize: 10, color: C.ink2, mt: 0.5, textAlign: 'center' }}>
        Green band is your reference range
      </Typography>
    </Box>
  );
}
