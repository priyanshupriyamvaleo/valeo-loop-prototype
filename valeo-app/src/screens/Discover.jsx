import { useRef, useState } from 'react';
import {
  Box, Button, Dialog, IconButton, Stack, Typography, Chip, LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import LockIcon from '@mui/icons-material/Lock';
import ScienceIcon from '@mui/icons-material/Science';
import EditNoteIcon from '@mui/icons-material/EditNote';
import { TWINS, TIERS, TIER_ORDER, PROTOCOLS, GROUP_LABEL, SWIPE_TARGET } from '../data';
import { C } from '../theme';

export default function Discover({ st, dispatch, onQuestions, onBlood }) {
  const tier = st.tier;
  const T = TIERS[tier];
  const dark = tier !== 'open';
  const ti = TIER_ORDER.indexOf(tier);
  const upKey = TIER_ORDER[ti + 1];

  const pool = TWINS.filter((w) => w.tier === tier
    && !st.saved.includes(w.protocol) && !st.passed.includes(w.id));
  const w = pool[0];

  const [d, setD] = useState({ x: 0, y: 0, axis: null });
  const [fly, setFly] = useState(0);
  const [gate, setGate] = useState(null);
  const p0 = useRef({ x: 0, y: 0 });
  const drag = useRef(false);

  const blurred = (t) => t?.blur && !st.revealed.includes(t.id);

  const commit = (dir) => {
    if (!w || fly) return;
    setFly(dir);
    setTimeout(() => {
      setFly(0); setD({ x: 0, y: 0, axis: null });
      dispatch({ type: dir > 0 ? 'save' : 'pass', id: w.id, protocol: w.protocol });
    }, 240);
  };
  const ascend = () => {
    if (!upKey) return;
    if (upKey === 'elite' && !st.blood) { setGate({ tierGate: upKey }); return; }
    dispatch({ type: 'tier', tier: upKey });
    setD({ x: 0, y: 0, axis: null });
  };

  const down = (e) => { if (fly) return; drag.current = true; p0.current = { x: e.clientX, y: e.clientY }; };
  const move = (e) => {
    if (!drag.current || fly) return;
    const dx = e.clientX - p0.current.x, dy = e.clientY - p0.current.y;
    let axis = d.axis;
    if (!axis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
    setD({ x: axis === 'x' ? dx : 0, y: axis === 'y' ? Math.min(0, dy) : 0, axis });
  };
  const up = () => {
    if (!drag.current) return;
    drag.current = false;
    if (d.axis === 'y' && d.y < -90) return ascend();
    if (d.axis === 'x' && d.x > 88) return commit(1);
    if (d.axis === 'x' && d.x < -88) return commit(-1);
    setD({ x: 0, y: 0, axis: null });
  };

  const off = fly ? fly * 540 : d.x;

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: dark ? `linear-gradient(178deg,${C.night},${C.night2} 60%,#070F1A)` : C.cream,
      color: dark ? '#fff' : C.ink,
    }}>
      <Stack direction="row" sx={{ alignItems: 'center', px: 2.25, pt: 2, pb: 1 }}>
        <Button onClick={() => ti > 0 && dispatch({ type: 'tier', tier: TIER_ORDER[ti - 1] })}
          sx={{ minHeight: 0, p: 0, fontSize: 14, fontWeight: 700,
                color: dark ? 'rgba(255,255,255,.75)' : C.ink2 }}>
          {ti > 0 ? `‹ ${TIERS[TIER_ORDER[ti - 1]].name}` : 'Valeo'}
        </Button>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 12.5, fontWeight: 700,
                          color: dark ? 'rgba(255,255,255,.65)' : C.ink2 }}>
          {pool.length} in {T.name}
        </Typography>
      </Stack>

      <Box sx={{ px: 2.25, pb: 1 }}>
        <Typography variant="overline" sx={{ color: dark ? C.yellow : C.ink2, display: 'block' }}>
          {tier === 'open' ? 'Discover' : `${T.mark} ${T.name}`}
        </Typography>
        <Typography variant="h2" sx={{ mt: 0.5, color: dark ? '#fff' : C.deep }}>
          {T.headline}
        </Typography>
      </Box>

      {tier === 'open' && (
        <Stack direction="row" spacing={1.5}
               sx={{ alignItems: 'center', mx: 2.25, mb: 1.25, px: 1.75, py: 1.25, borderRadius: '15px',
                     bgcolor: 'rgba(27,57,91,.05)' }}>
          <Typography sx={{ flex: 1, fontSize: 11.5, color: C.ink2 }}>
            Your twin is learning your type · <b style={{ color: C.deep }}>{st.swipes} of {SWIPE_TARGET}</b>
          </Typography>
          <Box sx={{ width: 72 }}>
            <LinearProgress variant="determinate"
              value={Math.min(100, (st.swipes / SWIPE_TARGET) * 100)}
              sx={{ '& .MuiLinearProgress-bar': { background: C.green } }} />
          </Box>
        </Stack>
      )}

      {/* deck */}
      <Box sx={{ flex: '1 1 auto', position: 'relative', mx: 2.25, minHeight: 0 }}
           onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {w ? (
          <>
            {pool.slice(1, 3).reverse().map((c, n) => {
              const k = pool.slice(1, 3).length - n;
              return (
                <Box key={c.id} sx={{
                  position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                  transform: `scale(${1 - k * 0.03}) translateY(${k * 9}px)`, opacity: 1 - k * 0.24,
                }}>
                  <TwinCard tw={c} blurred={blurred(c)} />
                </Box>
              );
            })}
            <Box sx={{
              position: 'absolute', inset: 0, zIndex: 5,
              transform: `translate(${off}px,${d.y}px) rotate(${d.axis === 'x' ? off / 28 : 0}deg)`,
              transition: drag.current ? 'none' : 'transform .4s cubic-bezier(.2,.8,.2,1)',
            }}>
              <TwinCard tw={w} blurred={blurred(w)} top
                        onUnlock={() => setGate({ twin: w })} />
            </Box>
          </>
        ) : (
          <Box sx={{
            textAlign: 'center', p: 4, borderRadius: '22px',
            bgcolor: dark ? 'rgba(255,255,255,.06)' : '#fff',
            border: dark ? '1px solid rgba(255,255,255,.12)' : 'none',
          }}>
            <ScienceIcon sx={{ fontSize: 34, color: C.yellow }} />
            <Typography variant="h3" sx={{ mt: 1.5, color: dark ? '#fff' : C.deep }}>
              {tier === 'open' ? 'That’s everyone in Open.'
                : 'Get a blood test to unlock the most elite protocols.'}
            </Typography>
            <Button variant="contained" color="secondary" sx={{ mt: 2.5 }}
              onClick={tier === 'open' ? ascend : onBlood}>
              {tier === 'open' ? 'Swipe up to Advanced' : 'Book my blood test'}
            </Button>
          </Box>
        )}
      </Box>

      {/* controls */}
      {w && (
        <Stack direction="row" spacing={2}
               sx={{ justifyContent: 'center', alignItems: 'center', py: 1.75 }}>
          <RoundBtn dark={dark} onClick={() => commit(-1)}><CloseIcon /></RoundBtn>
          <RoundBtn dark={dark} small onClick={() =>
            blurred(w) ? setGate({ twin: w }) : null}><InfoOutlinedIcon /></RoundBtn>
          <RoundBtn save onClick={() => commit(1)}><FavoriteIcon /></RoundBtn>
        </Stack>
      )}

      {/* the tickle */}
      {upKey && w && (
        <Box onClick={ascend} sx={{
          mx: 2.25, mb: 3, py: 1.5, borderRadius: '16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
          border: `1px dashed ${dark ? 'rgba(255,255,255,.18)' : 'rgba(27,57,91,.18)'}`,
          bgcolor: dark ? 'rgba(255,255,255,.05)' : 'rgba(27,57,91,.04)',
        }}>
          <KeyboardArrowUpIcon sx={{
            fontSize: 19, color: C.yellow,
            animation: 'tickle 1.7s ease-in-out infinite',
            '@keyframes tickle': {
              '0%,100%': { transform: 'translateY(2px)', opacity: 0.55 },
              '50%': { transform: 'translateY(-3px)', opacity: 1 },
            },
          }} />
          <Typography sx={{ fontSize: 13, color: dark ? 'rgba(255,255,255,.7)' : C.ink2 }}>
            Swipe up for <b style={{ color: dark ? '#fff' : C.deep }}>{TIERS[upKey].name}</b>
          </Typography>
          <Chip size="small" label={TWINS.filter((t) => t.tier === upKey).length}
                sx={{ height: 20, bgcolor: C.yellow, color: C.deep, fontWeight: 800, fontSize: 11 }} />
        </Box>
      )}

      {/* unlock — two doors, both feed the flywheel */}
      <Dialog open={!!gate} onClose={() => setGate(null)} fullWidth
              PaperProps={{ sx: { borderRadius: '22px', m: 2, p: 2.5 } }}>
        {gate && (() => {
          const tw = gate.twin;
          const owed = tw ? tw.needs.filter((g) => st.skipped.includes(g)) : [];
          return (
            <>
              <Typography variant="h3" sx={{ color: C.deep }}>
                {tw ? `${tw.name} is in ${TIERS[tw.tier].name}` : 'Elite is locked'}
              </Typography>
              <Typography sx={{ fontSize: 13, color: C.ink2, mt: 1, mb: 2.5 }}>
                {tw ? 'Two ways in. Both make your twin sharper.'
                    : 'Elite needs a baseline before we’ll score it.'}
              </Typography>

              {owed.length > 0 && (
                <Door icon={<EditNoteIcon />} tag="Free"
                  title={`Answer ${owed.length} skipped question${owed.length > 1 ? 's' : ''}`}
                  sub={owed.map((g) => GROUP_LABEL[g] || g).join(' · ')}
                  onClick={() => { setGate(null); onQuestions({ id: tw.id, groups: owed }); }} />
              )}
              <Door hero icon={<ScienceIcon />} tag="Half price"
                title="Take a blood test"
                sub="Unlocks every Advanced twin, and Elite after it"
                onClick={() => { setGate(null); onBlood(); }} />

              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 2, lineHeight: 1.55 }}>
                A blood test does more than unlock a card — it’s the baseline your first verdict is
                measured against.
              </Typography>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}

function RoundBtn({ children, onClick, save, small, dark }) {
  const size = save ? 62 : small ? 44 : 52;
  return (
    <IconButton onClick={onClick} sx={{
      width: size, height: size,
      bgcolor: save ? C.green : dark ? 'rgba(255,255,255,.1)' : '#fff',
      color: save ? '#fff' : dark ? '#fff' : C.ink2,
      boxShadow: save ? '0 10px 24px -8px rgba(39,153,91,.6)'
                      : dark ? 'none' : '0 6px 18px -6px rgba(27,57,91,.3)',
      '&:hover': { bgcolor: save ? C.green : dark ? 'rgba(255,255,255,.16)' : '#fff' },
    }}>{children}</IconButton>
  );
}

function Door({ icon, title, sub, tag, hero, onClick }) {
  return (
    <Stack direction="row" spacing={1.75} onClick={onClick} sx={{
      alignItems: 'center', p: 1.9, mb: 1.25, borderRadius: '17px', cursor: 'pointer',
      background: hero ? 'linear-gradient(150deg,#FFF6DC,#FDEDC4)' : 'rgba(27,57,91,.05)',
      border: hero ? `1.5px solid ${C.yellow}` : '1.5px solid transparent',
    }}>
      <Box sx={{
        width: 42, height: 42, borderRadius: '13px', bgcolor: '#fff', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.deep,
      }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>{title}</Typography>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.3 }}>{sub}</Typography>
      </Box>
      <Typography sx={{
        fontSize: 9.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase',
        color: hero ? C.yellowDeep : C.ink2, flexShrink: 0,
      }}>{tag}</Typography>
    </Stack>
  );
}

/* Partial blur: photo, name and hook stay sharp — only the match score and
   the protocol are gated. Total blur leaves nothing to want. */
function TwinCard({ tw, blurred, top, onUnlock }) {
  const p = PROTOCOLS[tw.protocol];
  const [imgOk, setImgOk] = useState(!!tw.img);
  return (
    <Box sx={{
      position: 'absolute', inset: 0, borderRadius: '26px', overflow: 'hidden',
      bgcolor: tw.tone, boxShadow: '0 22px 52px -18px rgba(18,42,69,.55)',
    }}>
      {imgOk ? (
        <Box component="img" src={tw.img} alt="" onError={() => setImgOk(false)}
             sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <Box sx={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: 70, fontWeight: 800,
          color: 'rgba(255,255,255,.28)',
          background: `linear-gradient(158deg,${tw.tone},#101E30)`,
        }}>{tw.mono}</Box>
      )}
      <Box sx={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom,rgba(10,22,38,.42) 0%,rgba(10,22,38,0) 26%,rgba(10,22,38,.22) 52%,rgba(10,22,38,.88) 100%)',
      }} />

      <Box sx={{
        position: 'absolute', top: 13, right: 13, px: 1.4, py: 1, borderRadius: '13px',
        bgcolor: 'rgba(12,24,40,.5)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,.2)', textAlign: 'center', zIndex: 3,
      }}>
        <Typography sx={{
          fontSize: 22, fontWeight: 800, color: C.yellow, lineHeight: 1,
          filter: blurred ? 'blur(4.5px)' : 'none', opacity: blurred ? 0.75 : 1,
        }}>{tw.match}</Typography>
        <Typography sx={{
          fontSize: 7, letterSpacing: '.16em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,.6)', mt: 0.4,
        }}>Match</Typography>
      </Box>

      <Box sx={{
        position: 'absolute', left: 9, right: 9, bottom: 9, zIndex: 2, borderRadius: '19px',
        p: 1.75, color: '#fff', bgcolor: 'rgba(16,30,48,.52)',
        backdropFilter: 'blur(20px) saturate(140%)', border: '1px solid rgba(255,255,255,.16)',
      }}>
        <Typography sx={{
          fontSize: 7.5, fontWeight: 800, letterSpacing: '.2em',
          textTransform: 'uppercase', color: C.yellow,
        }}>◈ Twin</Typography>
        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 23, fontWeight: 600, lineHeight: 1.1, mt: 0.5,
        }}>{tw.name}</Typography>
        <Typography sx={{ fontSize: 11.5, color: 'rgba(255,255,255,.68)', mt: 0.5 }}>
          {tw.role}
        </Typography>
        <Stack direction="row" spacing={1} sx={{
          mt: 1.25, pt: 1.25, borderTop: '1px solid rgba(255,255,255,.15)',
        }}>
          <Box sx={{ color: C.yellow, fontSize: 12 }}>★</Box>
          <Typography sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.4 }}>{tw.hook}</Typography>
        </Stack>

        <Box sx={{
          mt: 1.25, pt: 1.25, borderTop: '1px solid rgba(255,255,255,.15)', position: 'relative',
        }}>
          <Box sx={{ filter: blurred ? 'blur(5px)' : 'none', opacity: blurred ? 0.8 : 1 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{p.t}</Typography>
            <Typography sx={{
              fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,.55)', mt: 0.4,
            }}>{p.wk} weeks · {p.mk}</Typography>
          </Box>
          {blurred && top && (
            <Stack direction="row" spacing={0.75}
              onClick={(e) => { e.stopPropagation(); onUnlock(); }}
              sx={{
                alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: -6, borderRadius: '14px', cursor: 'pointer',
                bgcolor: 'rgba(12,24,40,.36)',
              }}>
              <LockIcon sx={{ fontSize: 14, color: C.yellow }} />
              <Typography sx={{
                fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase',
              }}>{tw.needs.length} questions to reveal</Typography>
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
