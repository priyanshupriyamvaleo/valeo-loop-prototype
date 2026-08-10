import { useRef, useState } from 'react';
import {
  Box, Button, Dialog, IconButton, Stack, Typography, LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteIcon from '@mui/icons-material/Favorite';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LockIcon from '@mui/icons-material/Lock';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ScienceIcon from '@mui/icons-material/Science';
import EditNoteIcon from '@mui/icons-material/EditNote';
import ProtocolSheet from '../components/ProtocolSheet';
import Catalog from '../components/Catalog';
import { TWINS, TIERS, PROTOCOLS, GROUP_LABEL, SWIPE_TARGET,
         deckOf, lockOf, owedBy, matchFor, twinOrSelf } from '../data';
import { C, meter } from '../theme';

/**
 * DISCOVER — two ways in, one screen.
 *
 * The deck used to have two axes: left/right to judge, up to change TIER. That
 * second axis had to be taught, and it hid two thirds of the catalogue behind a
 * gesture most people never tried. So tier stopped being a place you travel to
 * and became a property a card carries — one deck, one axis, and the thing you
 * cannot have yet sits in the run of play where you can see it.
 *
 * Removing the vertical swipe also freed the slot the second half of discovery
 * needed. Swiping is serendipity: good at showing you something you would never
 * have searched for, useless once you arrive with an intent. The catalogue is
 * that other half, and it lives in the space the tier tickle used to occupy —
 * a swap, not an addition.
 *
 * The two jobs the screen has to do in words are split across the two places the
 * eye actually goes: the headline says what these cards ARE, and the bottom bar
 * says there is another way to find them.
 */
export default function Discover({ st, dispatch, onQuestions, onBlood }) {
  const deck = deckOf(st);
  const w = deck[0];
  const lock = w ? lockOf(w, st) : null;
  const lockedLeft = deck.filter((t) => lockOf(t, st)).length;

  const [d, setD] = useState(0);
  const [fly, setFly] = useState(0);
  const [gate, setGate] = useState(null);
  const [sheet, setSheet] = useState(null);
  const [browse, setBrowse] = useState(false);
  const p0 = useRef(0);
  const drag = useRef(false);

  const openGate = (tw) => setGate({ tw, lock: lockOf(tw, st) });

  const commit = (dir) => {
    if (!w || fly) return;
    /* A locked card cannot be kept — swiping right on one asks for what it costs
       instead. Silently discarding the gesture would read as a broken swipe. */
    if (dir > 0 && lock) { setD(0); return openGate(w); }
    setFly(dir);
    setTimeout(() => {
      setFly(0); setD(0);
      dispatch({ type: dir > 0 ? 'save' : 'pass', id: w.id, protocol: w.protocol });
    }, 240);
  };

  /* One axis. There is no second gesture to disambiguate any more. */
  const down = (e) => { if (fly) return; drag.current = true; p0.current = e.clientX; };
  const move = (e) => { if (!drag.current || fly) return; setD(e.clientX - p0.current); };
  const up = () => {
    if (!drag.current) return;
    drag.current = false;
    if (d > 88) return commit(1);
    if (d < -88) return commit(-1);
    setD(0);
  };

  const openDetail = (tw) => (lockOf(tw, st) ? openGate(tw) : setSheet(tw));
  const off = fly ? fly * 540 : d;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      {/* ── the headline carries the noun: these cards are protocols ── */}
      <Box sx={{ px: 2.25, pt: 2.5, pb: 1.25 }}>
        <Typography variant="overline" sx={{ color: C.ink2, display: 'block' }}>
          Discover
        </Typography>
        <Typography variant="h2" sx={{ mt: 0.5, color: C.deep }}>
          Protocols, matched to you.
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center', mt: 0.85 }}>
          <Typography sx={{ fontFamily: meter, fontSize: 11.5, fontWeight: 700, color: C.ink2 }}>
            {deck.length}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: C.ink2 }}>
            to look at{lockedLeft ? ` · ${lockedLeft} locked` : ''}
          </Typography>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1.5} sx={{
        alignItems: 'center', mx: 2.25, mb: 1.25, px: 1.75, py: 1.25,
        borderRadius: '15px', bgcolor: 'rgba(27,57,91,.05)',
      }}>
        <Typography sx={{ flex: 1, fontSize: 11.5, color: C.ink2 }}>
          Your twin is learning your type · <b style={{ color: C.deep }}>{st.swipes} of {SWIPE_TARGET}</b>
        </Typography>
        <Box sx={{ width: 72 }}>
          <LinearProgress variant="determinate"
            value={Math.min(100, (st.swipes / SWIPE_TARGET) * 100)}
            sx={{ '& .MuiLinearProgress-bar': { background: C.green } }} />
        </Box>
      </Stack>

      {/* ── the deck ── */}
      <Box sx={{ flex: '1 1 auto', position: 'relative', mx: 2.25, minHeight: 0 }}
           onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {w ? (
          <>
            {deck.slice(1, 3).reverse().map((c, n) => {
              const k = deck.slice(1, 3).length - n;
              return (
                <Box key={c.id} sx={{
                  position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
                  transform: `scale(${1 - k * 0.03}) translateY(${k * 9}px)`, opacity: 1 - k * 0.24,
                }}>
                  <TwinCard tw={c} lock={lockOf(c, st)} shownMatch={matchFor(c, st)} />
                </Box>
              );
            })}
            <Box sx={{
              position: 'absolute', inset: 0, zIndex: 5,
              transform: `translateX(${off}px) rotate(${off / 28}deg)`,
              transition: drag.current ? 'none' : 'transform .4s cubic-bezier(.2,.8,.2,1)',
            }}>
              <TwinCard tw={w} lock={lock} top shownMatch={matchFor(w, st)}
                        onTap={() => { if (Math.abs(d) < 6) openDetail(w); }}
                        onUnlock={() => openGate(w)} />
            </Box>
          </>
        ) : (
          <Box sx={{
            textAlign: 'center', p: 4, borderRadius: '22px', bgcolor: '#fff',
            boxShadow: '0 2px 14px -8px rgba(27,57,91,.35)',
          }}>
            <ScienceIcon sx={{ fontSize: 34, color: C.yellow }} />
            <Typography variant="h3" sx={{ mt: 1.5, color: C.deep }}>
              That’s everyone.
            </Typography>
            <Typography sx={{ fontSize: 13, color: C.ink2, mt: 1, lineHeight: 1.55 }}>
              You have seen every twin we have. The catalogue is still there if you
              want to look one up by goal.
            </Typography>
            <Button variant="contained" color="secondary" sx={{ mt: 2.5 }}
                    onClick={() => setBrowse(true)}>
              Browse all protocols
            </Button>
          </Box>
        )}
      </Box>

      {/* ── controls ── */}
      {w && (
        <Stack direction="row" spacing={2}
               sx={{ justifyContent: 'center', alignItems: 'center', py: 1.5 }}>
          <RoundBtn onClick={() => commit(-1)}><CloseIcon /></RoundBtn>
          <RoundBtn small onClick={() => openDetail(w)}><InfoOutlinedIcon /></RoundBtn>
          <RoundBtn save onClick={() => commit(1)}><FavoriteIcon /></RoundBtn>
        </Stack>
      )}

      {/* ── the other half of discovery, in the slot the tier tickle vacated ── */}
      <Stack direction="row" spacing={1.4} onClick={() => setBrowse(true)} sx={{
        alignItems: 'center', mx: 2.25, mb: 2.5, px: 1.6, py: 1.35,
        borderRadius: '16px', cursor: 'pointer', bgcolor: '#fff',
        boxShadow: '0 2px 12px -7px rgba(27,57,91,.4)',
        border: '1px solid rgba(27,57,91,.07)',
      }}>
        <Box sx={{
          width: 34, height: 34, borderRadius: '11px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'rgba(27,57,91,.06)', color: C.deep,
        }}><SearchIcon sx={{ fontSize: 17 }} /></Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>
            Browse all {Object.keys(PROTOCOLS).length} protocols
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.1 }}>
            By goal, or search a name or marker
          </Typography>
        </Box>
        <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
      </Stack>

      <ProtocolSheet twin={sheet} open={!!sheet} onClose={() => setSheet(null)}
        saved={sheet ? st.saved.includes(sheet.protocol) : false}
        onSave={() => {
          dispatch({ type: 'save', id: sheet.id, protocol: sheet.protocol });
          setSheet(null);
        }} />

      <Catalog open={browse} onClose={() => setBrowse(false)} st={st}
               onPick={(pKey) => { setBrowse(false); setSheet(twinOrSelf(pKey)); }}
               onLocked={(tw) => { setBrowse(false); openGate(tw); }} />

      {/* ── unlock — two doors, both feed the flywheel ── */}
      <Dialog open={!!gate} onClose={() => setGate(null)} fullWidth
              slotProps={{
                root: { disablePortal: true, sx: { position: 'absolute' } },
                backdrop: { sx: { position: 'absolute' } },
                paper: { sx: { borderRadius: '22px', m: 2, p: 2.5 } },
              }}>
        {gate && gate.tw && (() => {
          const tw = gate.tw;
          const owed = owedBy(tw, st);
          const needsBlood = gate.lock && gate.lock.kind === 'blood';
          return (
            <>
              <Typography variant="h3" sx={{ color: C.deep }}>
                {tw.name} is in {TIERS[tw.tier].name}
              </Typography>
              <Typography sx={{ fontSize: 13, color: C.ink2, mt: 1, mb: 2.5 }}>
                {needsBlood
                  ? 'Elite needs a baseline before we’ll score anything against it.'
                  : 'Two ways in. Both make your twin sharper.'}
              </Typography>

              {!needsBlood && owed.length > 0 && (
                <Door icon={<EditNoteIcon />} tag="Free"
                  title={`Answer ${owed.length} skipped question${owed.length > 1 ? 's' : ''}`}
                  sub={owed.map((g) => GROUP_LABEL[g] || g).join(' · ')}
                  onClick={() => { setGate(null); onQuestions({ id: tw.id, groups: owed }); }} />
              )}
              <Door hero icon={<ScienceIcon />} tag="Half price"
                title="Take a blood test"
                sub="Opens every locked protocol, and Elite with it"
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
   the protocol are gated. Total blur leaves nothing to want.
   The tier badge lives on the card now that tier is not screen state: without it
   a mixed deck loses the hierarchy entirely, and "why is this one locked" has no
   visible answer. */
function TwinCard({ tw, lock, top, onUnlock, onTap, shownMatch }) {
  const p = PROTOCOLS[tw.protocol];
  const blurred = !!lock;
  const [imgOk, setImgOk] = useState(!!tw.img);
  return (
    <Box sx={{
      position: 'absolute', inset: 0, borderRadius: '26px', overflow: 'hidden',
      bgcolor: tw.tone, boxShadow: '0 22px 52px -18px rgba(18,42,69,.55)',
      cursor: top ? 'pointer' : 'default',
    }} onClick={onTap}>
      {imgOk ? (
        <Box component="img" src={tw.img} alt="" onError={() => setImgOk(false)}
             sx={{
               position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
               /* scale up slightly so the blur has no soft edge against the frame */
               filter: blurred ? 'blur(17px) saturate(.85)' : 'none',
               transform: blurred ? 'scale(1.12)' : 'scale(1)',
               transition: 'filter .55s ease, transform .55s ease',
             }} />
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

      {tw.tier !== 'open' && (
        <Stack direction="row" spacing={0.5} sx={{
          position: 'absolute', top: 13, left: 13, zIndex: 3, alignItems: 'center',
          px: 1, py: 0.6, borderRadius: '10px',
          bgcolor: 'rgba(12,24,40,.5)', backdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,.2)',
        }}>
          <Typography sx={{ fontSize: 9, color: C.yellow, letterSpacing: '.04em' }}>
            {TIERS[tw.tier].mark}
          </Typography>
          <Typography sx={{
            fontSize: 8.5, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,.85)',
          }}>{TIERS[tw.tier].name}</Typography>
        </Stack>
      )}

      <Box sx={{
        position: 'absolute', top: 13, right: 13, px: 1.4, py: 1, borderRadius: '13px',
        bgcolor: 'rgba(12,24,40,.5)', backdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,.2)', textAlign: 'center', zIndex: 3,
      }}>
        <Typography sx={{
          fontSize: 22, fontWeight: 800, color: C.yellow, lineHeight: 1,
          filter: blurred ? 'blur(4.5px)' : 'none', opacity: blurred ? 0.75 : 1,
        }}>{shownMatch}</Typography>
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
          {lock && top && (
            <Stack direction="row" spacing={0.75}
              onClick={(e) => { e.stopPropagation(); onUnlock(); }}
              sx={{
                alignItems: 'center', justifyContent: 'center', position: 'absolute', inset: -6,
                borderRadius: '14px', cursor: 'pointer', bgcolor: 'rgba(12,24,40,.36)',
              }}>
              <LockIcon sx={{ fontSize: 14, color: C.yellow }} />
              <Typography sx={{
                fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase',
              }}>
                {lock.kind === 'blood'
                  ? 'Blood test to unlock'
                  : `${lock.owed.length} question${lock.owed.length === 1 ? '' : 's'} to reveal`}
              </Typography>
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
