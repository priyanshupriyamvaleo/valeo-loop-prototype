import { useEffect, useRef, useState } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import WbSunnyOutlinedIcon from '@mui/icons-material/WbSunnyOutlined';
import PhoneAndroidOutlinedIcon from '@mui/icons-material/PhoneAndroidOutlined';
import SelfImprovementOutlinedIcon from '@mui/icons-material/SelfImprovementOutlined';
import GppGoodOutlinedIcon from '@mui/icons-material/GppGoodOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CenterFocusWeakOutlinedIcon from '@mui/icons-material/CenterFocusWeakOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { SCAN_SECONDS, SCAN_TARGET, SCAN_MEASURES, SCAN_STEPS, scanBands } from '../data';
import { C, meter } from '../theme';

/**
 * THE HEART SCAN — three screens and a camera.
 *
 * ── WHAT IS REAL AND WHAT IS NOT ──
 * The camera is real: it opens the front camera, the patient sees their own
 * face, and the frame brightness is genuinely sampled off a 24px canvas every
 * 400ms. That last part matters — the "move somewhere brighter" warning is the
 * one piece of feedback that would be obvious theatre if it were faked, and a
 * patient who catches the app lying about the light will not believe the number
 * underneath it either.
 *
 * The three numbers ARE simulated. No signal is extracted from the video and no
 * frame leaves the device. See the block comment in data.js: this must be said
 * out loud to any external audience before they see the screen, because a blood
 * pressure the app did not measure is a medical claim.
 *
 * ── WHY THE NUMBERS MOVE AND THEN SETTLE ──
 * A readout that lands on 118/76 instantly reads as a lookup. Real
 * photoplethysmography swings while the confidence interval is wide and narrows
 * as the sample grows, so the jitter here decays as the fifteen seconds run
 * down. The motion is the honest part of the illusion: it says "still working"
 * without a spinner.
 *
 * ── THREE SCREENS, ONE JOB EACH ──
 * intro    what this is, what it needs from you, and your consent
 * scan     your face, the numbers moving, the seconds counting down
 * result   the three readings with their bands, and one thing to do
 *
 * The intro exists because a camera that opens without warning is a camera the
 * patient did not agree to. Everything on it is a condition of a good reading —
 * light, stillness, and when to take it — so nothing on it is decoration.
 */

const STEP_ICONS = {
  sun: { Ic: WbSunnyOutlinedIcon, bg: 'rgba(255,185,0,.14)', fg: C.yellowDeep },
  phone: { Ic: PhoneAndroidOutlinedIcon, bg: C.greenSoft, fg: C.green },
  lotus: { Ic: SelfImprovementOutlinedIcon, bg: 'rgba(122,75,110,.12)', fg: '#7A4B6E' },
};

const MEASURE_ICONS = {
  heart: { Ic: FavoriteBorderIcon, bg: 'rgba(233,79,95,.11)', fg: '#D2404F' },
  drop: { Ic: WaterDropOutlinedIcon, bg: 'rgba(64,143,164,.13)', fg: C.teal },
  wave: { Ic: MonitorHeartOutlinedIcon, bg: 'rgba(122,75,110,.12)', fg: '#7A4B6E' },
};

const BAND_TONES = {
  Normal: { bg: C.greenSoft, fg: C.green },
  Good: { bg: C.greenSoft, fg: C.green },
  Fair: { bg: 'rgba(255,185,0,.16)', fg: C.yellowDeep },
  Elevated: { bg: 'rgba(255,185,0,.16)', fg: C.yellowDeep },
  Low: { bg: 'rgba(64,143,164,.14)', fg: C.teal },
  High: { bg: 'rgba(233,79,95,.12)', fg: '#D2404F' },
};

/* A face outline, drawn rather than photographed. A stock portrait here would
   be a stranger's face on the screen that is about to show yours. */
function FaceScanArt({ size = 150 }) {
  return (
    <Box component="svg" viewBox="0 0 120 100" fill="none" aria-hidden
      sx={{ width: size, height: size * 0.83, display: 'block' }}>
      <circle cx="52" cy="50" r="44" fill="rgba(255,185,0,.09)" />
      <path d="M34 96c1-13 3-20 10-24 5-3 8-2 8-9 0-4-3-6-4-11-2-1-2-5-1-6 0-9 3-16 12-16 8 0 12 6 12 15 1 1 1 5-1 7-1 4-4 6-4 10 0 7 3 6 8 9 7 4 9 11 10 24"
        stroke={C.deep} strokeWidth="2" strokeLinejoin="round" fill="rgba(27,57,91,.06)" />
      <rect x="86" y="34" width="24" height="40" rx="5"
        stroke={C.deep} strokeWidth="2" fill="#fff" />
      <path d="M70 44 86 40M70 52 86 54M70 60 86 66"
        stroke={C.yellowDeep} strokeWidth="1.4" strokeDasharray="3 3" />
      <path d="M92 52h4l2-4 3 8 2-4h3" stroke="#D2404F" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round" />
    </Box>
  );
}

export default function HeartScan({ open, onClose, onSave, day }) {
  const [phase, setPhase] = useState('intro');
  const [secs, setSecs] = useState(0);
  const [live, setLive] = useState({ ...SCAN_TARGET });
  const [dark, setDark] = useState(false);
  const [camErr, setCamErr] = useState(null);
  /* ── THE VENUE PROBLEM ──
     A locked-down browser, a meeting-room laptop or a declined permission all
     end the same way: no camera. On a demo that is fatal — the room is watching
     and the screen is a dead end. So the scan can run without one, and says so
     on every screen while it does. The numbers were always simulated; what
     changes here is that we stop pretending a camera is involved. */
  const [noCam, setNoCam] = useState(false);
  const [when, setWhen] = useState('before');

  const video = useRef(null);
  const canvas = useRef(null);
  const stream = useRef(null);

  /* Reset every time the sheet opens: a scan half-finished last night is not a
     scan, and resuming one would report a number built from two sittings. */
  useEffect(() => {
    if (!open) return;
    setPhase('intro'); setSecs(0); setDark(false);
    setCamErr(null); setNoCam(false); setWhen('before'); setLive({ ...SCAN_TARGET });
  }, [open]);

  /* ── THE CAMERA ──
     Front camera only, video only, no audio. Torn down on every exit path,
     including the one where the patient closes the sheet mid-scan: a camera
     light still on after the screen has gone is the single worst thing a health
     app can do to someone's trust. */
  useEffect(() => {
    if (!open || phase !== 'scan') return undefined;
    let dead = false;
    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (dead) { s.getTracks().forEach((t) => t.stop()); return; }
        stream.current = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch((e) => { if (!dead) setCamErr(e && e.name === 'NotAllowedError' ? 'denied' : 'unavailable'); });
    return () => {
      dead = true;
      if (stream.current) {
        stream.current.getTracks().forEach((t) => t.stop());
        stream.current = null;
      }
    };
  }, [open, phase]);

  /* ── THE ONE HONEST MEASUREMENT ──
     Average luminance off a 24×24 draw of the current frame. Cheap enough to
     run four times a second and real enough that the warning it drives is true. */
  useEffect(() => {
    if (phase !== 'scan' || camErr || noCam) return undefined;
    const id = setInterval(() => {
      const v = video.current;
      const cv = canvas.current;
      if (!v || !cv || !v.videoWidth) return;
      const ctx = cv.getContext('2d');
      ctx.drawImage(v, 0, 0, 24, 24);
      const { data } = ctx.getImageData(0, 0, 24, 24);
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      setDark(sum / (data.length / 4) < 58);
    }, 400);
    return () => clearInterval(id);
  }, [phase, camErr, noCam]);

  /* ── THE COUNTDOWN AND THE JITTER ──
     One timer drives both. `settle` runs 0 → 1 across the window and scales the
     noise down with it, so the numbers arrive unstable and end still. */
  useEffect(() => {
    if (phase !== 'scan' || (camErr && !noCam)) return undefined;
    const id = setInterval(() => {
      setSecs((s) => {
        const next = Math.min(SCAN_SECONDS, s + 0.1);
        const settle = next / SCAN_SECONDS;
        const noise = (1 - settle) ** 1.6;
        const jit = (amp) => Math.round((Math.random() - 0.5) * 2 * amp * noise);
        setLive({
          hr: SCAN_TARGET.hr + jit(16),
          sys: SCAN_TARGET.sys + jit(14),
          dia: SCAN_TARGET.dia + jit(10),
          hrv: SCAN_TARGET.hrv + jit(22),
        });
        if (next >= SCAN_SECONDS) setPhase('result');
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [phase, camErr, noCam]);

  if (!open) return null;

  const left = Math.max(0, Math.ceil(SCAN_SECONDS - secs));
  const pct = Math.min(100, (secs / SCAN_SECONDS) * 100);
  const reading = phase === 'result' ? { ...SCAN_TARGET } : live;

  return (
    <Box sx={{
      position: 'absolute', inset: 0, zIndex: 40, display: 'flex', flexDirection: 'column',
      bgcolor: phase === 'scan' ? '#0B1622' : C.cream,
      animation: 'scanIn .28s cubic-bezier(.2,.9,.25,1)',
      '@keyframes scanIn': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
    }}>
      <canvas ref={canvas} width={24} height={24} style={{ display: 'none' }} />

      {/* ══ INTRO ══════════════════════════════════════════════════════ */}
      {phase === 'intro' && (
        <>
          <Box sx={{ px: 2, pt: 2, flexShrink: 0 }}>
            <IconButton onClick={onClose} size="small" sx={{ ml: -0.5, color: C.deep }}>
              <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>

          <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.5, pb: 1 }}>
            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 30, fontWeight: 600,
              lineHeight: 1.1, letterSpacing: '-.015em', color: C.deep, mt: 1,
            }}>Heart Scan</Typography>
            <Typography sx={{ fontSize: 13.5, lineHeight: 1.5, color: C.ink2, mt: 1 }}>
              Measure your heart rate and estimate cardiovascular markers using
              your phone’s camera.
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mt: 2 }}>
              <Box sx={{ flexShrink: 0 }}><FaceScanArt size={158} /></Box>
              <Stack spacing={0.9} sx={{ flex: 1, minWidth: 0 }}>
                {SCAN_MEASURES.map((m) => {
                  const tone = MEASURE_ICONS[m.ic];
                  const Ic = tone.Ic;
                  return (
                    <Stack key={m.k} direction="row" spacing={1} sx={{
                      alignItems: 'center', px: 1.1, py: 0.9, borderRadius: '12px',
                      bgcolor: '#fff', boxShadow: '0 4px 14px -12px rgba(27,57,91,.6)',
                    }}>
                      <Box sx={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, bgcolor: tone.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ic sx={{ fontSize: 15, color: tone.fg }} />
                      </Box>
                      <Typography sx={{
                        fontSize: 11.5, fontWeight: 700, color: C.deep, lineHeight: 1.25,
                      }}>{m.t}</Typography>
                    </Stack>
                  );
                })}
              </Stack>
            </Stack>

            <Stack spacing={1} sx={{ mt: 2.25 }}>
              {SCAN_STEPS.map((s) => {
                const tone = STEP_ICONS[s.ic];
                const Ic = tone.Ic;
                return (
                  <Stack key={s.t} direction="row" spacing={1.4} sx={{
                    alignItems: 'flex-start', px: 1.5, py: 1.4, borderRadius: '16px',
                    bgcolor: '#fff', border: `1px solid ${C.line}`,
                  }}>
                    <Box sx={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0, bgcolor: tone.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ic sx={{ fontSize: 19, color: tone.fg }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 13, fontWeight: 700, color: C.deep }}>
                        {s.t}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, lineHeight: 1.45, color: C.ink2, mt: 0.3 }}>
                        {s.s}
                      </Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Stack>

            <Stack direction="row" spacing={1.3} sx={{
              alignItems: 'flex-start', mt: 1.5, px: 1.5, py: 1.35,
              borderRadius: '14px', bgcolor: 'rgba(27,57,91,.045)',
            }}>
              <GppGoodOutlinedIcon sx={{ fontSize: 19, color: C.green, flexShrink: 0, mt: 0.2 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 12, fontWeight: 700, color: C.deep }}>
                  Your privacy matters
                </Typography>
                <Typography sx={{ fontSize: 11.5, lineHeight: 1.45, color: C.ink2, mt: 0.2 }}>
                  The camera runs on your phone. Nothing is recorded and no video
                  leaves the device.
                </Typography>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ px: 2.5, pt: 1.25, pb: 2.25, flexShrink: 0 }}>
            <Button fullWidth variant="contained" color="secondary"
              onClick={() => { setSecs(0); setPhase('scan'); }}
              startIcon={<CenterFocusWeakOutlinedIcon sx={{ fontSize: 19 }} />}
              sx={{ py: 1.5, fontSize: 15, borderRadius: '17px',
                    '& .MuiButton-startIcon': { mr: 1.1 } }}>
              Start {SCAN_SECONDS}-second scan
            </Button>
            <Typography sx={{ fontSize: 11.5, color: C.ink2, textAlign: 'center', mt: 1 }}>
              Takes about {SCAN_SECONDS} seconds.
            </Typography>
            <Stack direction="row" spacing={0.7} sx={{
              alignItems: 'flex-start', justifyContent: 'center', mt: 1.4,
              pt: 1.4, borderTop: `1px solid ${C.line}`,
            }}>
              <LockOutlinedIcon sx={{ fontSize: 13, color: C.ink2, mt: '1px' }} />
              <Typography sx={{ fontSize: 10.5, lineHeight: 1.4, color: C.ink2, maxWidth: 250 }}>
                By continuing, you consent to this measurement being added to
                your health timeline.
              </Typography>
            </Stack>
          </Box>
        </>
      )}

      {/* ══ SCAN ═══════════════════════════════════════════════════════ */}
      {phase === 'scan' && (
        <>
          <Box component="video" ref={video} autoPlay playsInline muted sx={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            /* Mirrored, because a front camera that is not mirrored makes people
               move their head the wrong way to correct their position. */
            transform: 'scaleX(-1)',
            opacity: camErr ? 0 : 1,
          }} />
          <Box sx={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg,rgba(11,22,34,.72) 0%,rgba(11,22,34,.25) 34%,rgba(11,22,34,.55) 64%,rgba(11,22,34,.92) 100%)',
          }} />

          <Stack direction="row" sx={{
            position: 'relative', alignItems: 'center', px: 2, pt: 2, flexShrink: 0,
          }}>
            <IconButton onClick={onClose} size="small" sx={{
              color: '#fff', bgcolor: 'rgba(255,255,255,.14)',
              '&:hover': { bgcolor: 'rgba(255,255,255,.2)' },
            }}>
              <CloseRoundedIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Box sx={{ flex: 1 }} />
            <Typography sx={{
              fontFamily: meter, fontSize: 15, fontWeight: 700, color: '#fff',
              px: 1.4, py: 0.6, borderRadius: '999px', bgcolor: 'rgba(255,255,255,.16)',
            }}>{left}s</Typography>
          </Stack>

          {camErr && !noCam ? (
            <Stack sx={{
              position: 'relative', flex: 1, alignItems: 'center', justifyContent: 'center', px: 4,
            }}>
              <Typography sx={{
                fontFamily: '"Fraunces", serif', fontSize: 22, fontWeight: 600,
                color: '#fff', textAlign: 'center',
              }}>
                {camErr === 'denied' ? 'Camera access is off.' : 'No camera available.'}
              </Typography>
              <Typography sx={{
                fontSize: 13, lineHeight: 1.5, color: 'rgba(255,255,255,.72)',
                textAlign: 'center', mt: 1.25,
              }}>
                {camErr === 'denied'
                  ? 'Allow camera access in your browser to run the scan.'
                  : 'This device has no front camera we can reach.'}
              </Typography>
              <Stack direction="row" spacing={1.25} sx={{ mt: 3 }}>
                <Button variant="outlined" onClick={onClose} sx={{
                  borderRadius: '15px', minHeight: 46, color: '#fff',
                  borderColor: 'rgba(255,255,255,.4)',
                }}>Go back</Button>
                {/* Keeps a demo alive in a room that blocks the camera. Every
                    screen after this says the reading came from no camera. */}
                <Button variant="contained" color="secondary"
                  onClick={() => { setSecs(0); setNoCam(true); }}
                  sx={{ borderRadius: '15px', minHeight: 46 }}>
                  Continue without camera
                </Button>
              </Stack>
            </Stack>
          ) : (
            <>
              <Box sx={{ position: 'relative', flex: 1 }}>
                {/* The frame the face belongs in. Corners only — a full oval
                    over someone's face reads as a targeting reticle. */}
                <Box sx={{
                  position: 'absolute', left: '50%', top: '46%',
                  transform: 'translate(-50%,-50%)',
                  width: 208, height: 268, borderRadius: '50% / 42%',
                  border: `2px solid ${dark ? 'rgba(255,185,0,.85)' : 'rgba(255,255,255,.55)'}`,
                  boxShadow: '0 0 0 9999px rgba(11,22,34,.28)',
                  transition: 'border-color .3s',
                }} />
              </Box>

              {/* The hint, and only when it is true. */}
              <Box sx={{ position: 'relative', px: 2.5, flexShrink: 0 }}>
                <Stack direction="row" spacing={1.1} sx={{
                  alignItems: 'center', px: 1.4, py: 1.1, borderRadius: '13px',
                  bgcolor: dark ? 'rgba(255,185,0,.22)' : 'rgba(255,255,255,.12)',
                  border: `1px solid ${dark ? 'rgba(255,185,0,.5)' : 'rgba(255,255,255,.16)'}`,
                  transition: 'background-color .3s',
                }}>
                  <LightbulbOutlinedIcon sx={{
                    fontSize: 18, flexShrink: 0, color: dark ? C.yellow : 'rgba(255,255,255,.75)',
                  }} />
                  <Typography sx={{
                    flex: 1, fontSize: 12.5, fontWeight: dark ? 700 : 500, lineHeight: 1.4,
                    color: dark ? '#fff' : 'rgba(255,255,255,.8)',
                  }}>
                    {noCam
                      ? 'Running without a camera. This reading is a demonstration.'
                      : dark
                        ? 'Please move to a better lit area.'
                        : 'Good light. Hold still and keep looking at the camera.'}
                  </Typography>
                </Stack>
              </Box>

              {/* The numbers, moving. */}
              <Box sx={{ position: 'relative', px: 2.5, pt: 2, pb: 2.25, flexShrink: 0 }}>
                <Stack direction="row" spacing={1}>
                  {[['Heart rate', live.hr, 'bpm'],
                    ['Blood pressure', `${live.sys}/${live.dia}`, 'mmHg'],
                    ['HRV', live.hrv, 'ms']].map(([t, v, u]) => (
                    <Box key={t} sx={{
                      flex: 1, minWidth: 0, px: 1.1, py: 1.25, borderRadius: '15px',
                      bgcolor: 'rgba(255,255,255,.1)',
                      border: '1px solid rgba(255,255,255,.14)', textAlign: 'center',
                    }}>
                      <Typography sx={{
                        fontSize: 9.5, fontWeight: 700, letterSpacing: '.06em',
                        textTransform: 'uppercase', color: 'rgba(255,255,255,.6)',
                      }}>{t}</Typography>
                      <Typography sx={{
                        fontFamily: meter, fontSize: 21, fontWeight: 700, color: '#fff',
                        lineHeight: 1.15, mt: 0.4,
                      }}>{v}</Typography>
                      <Typography sx={{ fontSize: 9.5, color: 'rgba(255,255,255,.55)' }}>
                        {u}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Box sx={{
                  mt: 2, height: 4, borderRadius: 2, bgcolor: 'rgba(255,255,255,.16)',
                  overflow: 'hidden',
                }}>
                  <Box sx={{
                    width: `${pct}%`, height: '100%', bgcolor: C.yellow,
                    transition: 'width .1s linear',
                  }} />
                </Box>
                <Typography sx={{
                  fontSize: 11.5, color: 'rgba(255,255,255,.6)', textAlign: 'center', mt: 1.1,
                }}>
                  {noCam ? 'Simulated reading — no camera in use'
                    : 'Measuring \u2014 keep your face in the frame'}
                </Typography>
              </Box>
            </>
          )}
        </>
      )}

      {/* ══ RESULT ═════════════════════════════════════════════════════ */}
      {phase === 'result' && (
        <>
          <Box sx={{ px: 2, pt: 2, flexShrink: 0 }}>
            <IconButton onClick={onClose} size="small" sx={{ ml: -0.5, color: C.deep }}>
              <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>

          <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.5, pb: 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 0.5 }}>
              <Box sx={{
                width: 24, height: 24, borderRadius: '50%', bgcolor: C.green,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckRoundedIcon sx={{ fontSize: 15, color: '#fff' }} />
              </Box>
              <Typography sx={{
                fontSize: 10.5, fontWeight: 800, letterSpacing: '.15em',
                textTransform: 'uppercase', color: C.green,
              }}>Scan complete</Typography>
            </Stack>

            <Typography sx={{
              fontFamily: '"Fraunces", serif', fontSize: 27, fontWeight: 600,
              lineHeight: 1.13, letterSpacing: '-.015em', color: C.deep, mt: 1.1,
            }}>Here’s your reading.</Typography>
            <Typography sx={{ fontSize: 13, lineHeight: 1.5, color: C.ink2, mt: 0.9 }}>
              Taken just now, over {SCAN_SECONDS} seconds. One reading is a
              snapshot; the trend is what your doctor reads.
            </Typography>

            {/* Said on the screen, not only in the code. A reading taken with no
                camera must never look like one that was. */}
            {noCam && (
              <Stack direction="row" spacing={1.1} sx={{
                alignItems: 'center', mt: 1.4, px: 1.4, py: 1.1, borderRadius: '12px',
                bgcolor: 'rgba(255,185,0,.13)', border: '1px solid rgba(224,164,0,.3)',
              }}>
                <LightbulbOutlinedIcon sx={{ fontSize: 17, color: C.yellowDeep, flexShrink: 0 }} />
                <Typography sx={{ flex: 1, fontSize: 11.5, lineHeight: 1.4, color: C.deep }}>
                  Demonstration reading. No camera was used.
                </Typography>
              </Stack>
            )}

            <Stack spacing={1} sx={{ mt: 2 }}>
              {scanBands(reading).map((b) => {
                const tone = BAND_TONES[b.band] || BAND_TONES.Normal;
                const ic = MEASURE_ICONS[b.k === 'hr' ? 'heart' : b.k === 'bp' ? 'drop' : 'wave'];
                const Ic = ic.Ic;
                return (
                  <Stack key={b.k} direction="row" spacing={1.4} sx={{
                    alignItems: 'center', px: 1.5, py: 1.5, borderRadius: '16px',
                    bgcolor: '#fff', border: `1px solid ${C.line}`,
                  }}>
                    <Box sx={{
                      width: 40, height: 40, borderRadius: '50%', flexShrink: 0, bgcolor: ic.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ic sx={{ fontSize: 21, color: ic.fg }} />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 12.5, color: C.ink2 }}>{b.t}</Typography>
                      <Stack direction="row" spacing={0.6} sx={{ alignItems: 'baseline', mt: 0.1 }}>
                        <Typography sx={{
                          fontFamily: meter, fontSize: 22, fontWeight: 700, color: C.deep,
                          lineHeight: 1.1,
                        }}>{b.v}</Typography>
                        <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>{b.unit}</Typography>
                      </Stack>
                    </Box>
                    <Typography sx={{
                      flexShrink: 0, px: 1, py: 0.4, borderRadius: '8px',
                      fontSize: 10.5, fontWeight: 700, bgcolor: tone.bg, color: tone.fg,
                    }}>{b.band}</Typography>
                  </Stack>
                );
              })}
            </Stack>

            {/* The reading is worth twice as much with a label on it, and the
                label is the whole reason the intro mentions meditation. */}
            <Typography sx={{
              fontSize: 10, fontWeight: 800, letterSpacing: '.14em',
              textTransform: 'uppercase', color: C.ink2, mt: 2.5, mb: 1,
            }}>Tag this reading</Typography>
            <Stack direction="row" spacing={1}>
              {[['before', 'Before meditation'], ['after', 'After meditation']].map(([k, t]) => (
                <Box key={k} onClick={() => setWhen(k)} sx={{
                  flex: 1, textAlign: 'center', px: 1, py: 1.2, borderRadius: '14px',
                  cursor: 'pointer', fontSize: 12.5, fontWeight: 700,
                  bgcolor: when === k ? C.deep : '#fff',
                  color: when === k ? '#fff' : C.deep,
                  border: `1px solid ${when === k ? C.deep : 'rgba(27,57,91,.14)'}`,
                }}>{t}</Box>
              ))}
            </Stack>
          </Box>

          <Box sx={{ px: 2.5, pt: 1.25, pb: 2.25, flexShrink: 0 }}>
            <Button fullWidth variant="contained" color="secondary"
              onClick={() => onSave({ ...reading, when, day })}
              sx={{ py: 1.5, fontSize: 15, borderRadius: '17px' }}>
              Log and save
            </Button>
            <Typography sx={{ fontSize: 11.5, color: C.ink2, textAlign: 'center', mt: 1 }}>
              Saved to your health timeline. {SCAN_MEASURES.length} measures.
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
