import { useState } from 'react';
import { Box, Dialog, IconButton, InputBase, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import LockIcon from '@mui/icons-material/Lock';
import CheckIcon from '@mui/icons-material/Check';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import {
  PROTOCOLS, catList, searchProtocols, twinFor, lockOf, statusOf, TIERS,
} from '../data';
import { C, meter } from '../theme';

/**
 * THE CATALOGUE — discovery for people who arrived knowing what they want.
 *
 * The deck is discovery by serendipity: it is good at showing you something you
 * would never have searched for, and useless the moment you came in with an
 * intent. Those are different jobs, so this is not a redundant second surface —
 * it is the other half of one.
 *
 * It browses by the SAME six goals the onboarding asked about rather than a
 * taxonomy invented for a shelf, and it leads with the one the user already told
 * us they cared about. A second set of category names would mean the app
 * describes its own products two ways, which is how a catalogue starts lying.
 *
 * Search covers the marker and the contents, not just the title — because people
 * look for "tirzepatide" or "apob", not "Weight Loss". Locked protocols are listed
 * with what they cost to open rather than hidden: a catalogue that conceals its
 * own inventory is a worse catalogue and a worse sell.
 */
export default function Catalog({ open, onClose, st, onPick, onLocked }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);

  const cats = catList(st);
  const searching = q.trim().length > 0;
  const keys = searching
    ? searchProtocols(q)
    : cat ? (cats.find((c) => c.k === cat) || { keys: [] }).keys
      : [];
  const heading = searching ? `${keys.length} match${keys.length === 1 ? '' : 'es'}`
    : cat ? (cats.find((c) => c.k === cat) || {}).t : null;

  const close = () => { setQ(''); setCat(null); onClose(); };
  const back = () => { if (searching) return setQ(''); if (cat) return setCat(null); return close(); };

  return (
    <Dialog open={open} onClose={close} fullScreen
      slotProps={{
        root: { disablePortal: true, sx: { position: 'absolute' } },
        backdrop: { sx: { position: 'absolute' } },
        paper: { sx: { position: 'absolute', inset: 0, bgcolor: C.cream, backgroundImage: 'none' } },
      }}>
      <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* ── search, pinned ── */}
        <Box sx={{ px: 2.25, pt: 2, pb: 1.5, flexShrink: 0 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 1.5 }}>
            <IconButton onClick={back} size="small" sx={{ ml: -0.75, color: C.deep }}>
              {searching || cat
                ? <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
                : <CloseIcon sx={{ fontSize: 19 }} />}
            </IconButton>
            <Typography sx={{
              flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '.16em',
              textTransform: 'uppercase', color: C.ink2,
            }}>All protocols</Typography>
            <Typography sx={{
              fontFamily: meter, fontSize: 11, fontWeight: 700, color: C.ink2,
            }}>{Object.keys(PROTOCOLS).length}</Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{
            alignItems: 'center', px: 1.5, py: 1.1, borderRadius: '14px', bgcolor: '#fff',
            boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
          }}>
            <SearchIcon sx={{ fontSize: 18, color: C.ink2, flexShrink: 0 }} />
            <InputBase value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search a protocol, a marker, a drug"
              sx={{ flex: 1, fontSize: 13.5, color: C.deep,
                    '& input::placeholder': { color: C.ink2, opacity: 1 } }} />
            {searching && (
              <IconButton onClick={() => setQ('')} size="small" sx={{ p: 0.25, color: C.ink2 }}>
                <CloseIcon sx={{ fontSize: 15 }} />
              </IconButton>
            )}
          </Stack>
        </Box>

        <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 3 }}>
          {/* ── browse by goal ── */}
          {!searching && !cat && (
            <>
              <Label>Browse by what you want</Label>
              <Stack spacing={1}>
                {cats.map((g) => (
                  <Stack key={g.k} direction="row" spacing={1.5} onClick={() => setCat(g.k)} sx={{
                    alignItems: 'center', px: 1.75, py: 1.6, borderRadius: '17px', cursor: 'pointer',
                    bgcolor: '#fff', boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
                    border: g.yours ? `1.5px solid ${C.yellow}` : '1.5px solid transparent',
                  }}>
                    <Box sx={{ fontSize: 21, flexShrink: 0 }}>{g.ic}</Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>
                        {g.t}
                      </Typography>
                      <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.15 }}>
                        {g.keys.length} protocol{g.keys.length === 1 ? '' : 's'}
                        {/* the goal they named at onboarding, surfaced rather than
                            asked for a second time */}
                        {g.yours ? ' · what you said you wanted' : ''}
                      </Typography>
                    </Box>
                    <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
                  </Stack>
                ))}
              </Stack>
            </>
          )}

          {/* ── results ── */}
          {(searching || cat) && (
            <>
              <Label>{heading}</Label>
              {keys.length === 0 ? (
                <Box sx={{
                  px: 1.75, py: 2, borderRadius: '16px', textAlign: 'center',
                  border: '1px dashed rgba(27,57,91,.18)',
                }}>
                  <Typography sx={{ fontSize: 13, color: C.ink2, lineHeight: 1.55 }}>
                    Nothing matches “{q}”. Try a marker like ApoB, or a goal like sleep.
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={1}>
                  {keys.map((k) => (
                    <Row key={k} pKey={k} st={st} onPick={onPick} onLocked={onLocked} />
                  ))}
                </Stack>
              )}
            </>
          )}
        </Box>
      </Box>
    </Dialog>
  );
}

/* One protocol, with everything a browse decision needs: who fronts it, how long
   it runs, what it is scored on, and whether it is open to you. */
function Row({ pKey, st, onPick, onLocked }) {
  const p = PROTOCOLS[pKey];
  const tw = twinFor(pKey);
  const lock = tw ? lockOf(tw, st) : null;
  const status = statusOf(st, pKey);
  const held = status !== 'saved' || st.saved.includes(pKey);

  return (
    <Stack direction="row" spacing={1.5}
           onClick={() => (lock ? onLocked(tw, lock) : onPick(pKey, tw))}
           sx={{
      alignItems: 'center', px: 1.6, py: 1.5, borderRadius: '17px', cursor: 'pointer',
      bgcolor: '#fff', boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
    }}>
      <Box sx={{
        width: 44, height: 44, borderRadius: '13px', flexShrink: 0, overflow: 'hidden',
        bgcolor: tw ? tw.tone : C.deep, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,.85)',
      }}>
        {tw && tw.img
          ? <Box component="img" src={tw.img} alt="" sx={{
              width: '100%', height: '100%', objectFit: 'cover',
              filter: lock ? 'blur(5px)' : 'none',
            }} />
          : (tw ? tw.mono : 'F')}
        {lock && (
          <Box sx={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(14,27,44,.45)',
          }}><LockIcon sx={{ fontSize: 15, color: '#fff' }} /></Box>
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
          <Typography sx={{
            fontSize: 14, fontWeight: 700, color: C.deep,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{p.t}</Typography>
          {tw && tw.tier !== 'open' && (
            <Typography sx={{ fontSize: 9, color: C.yellowDeep, flexShrink: 0 }}>
              {TIERS[tw.tier].mark}
            </Typography>
          )}
        </Stack>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.15 }}>
          {p.wk} wk · scored on {p.mk}
        </Typography>
      </Box>

      {held ? (
        <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <CheckIcon sx={{ fontSize: 14, color: C.green }} />
          <Typography sx={{ fontSize: 11, fontWeight: 700, color: C.green }}>Kept</Typography>
        </Stack>
      ) : lock ? (
        <Typography sx={{
          fontSize: 9, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase',
          color: C.yellowDeep, flexShrink: 0, whiteSpace: 'nowrap',
        }}>{lock.kind === 'blood' ? 'Needs blood' : 'Locked'}</Typography>
      ) : (
        <Typography sx={{
          fontFamily: meter, fontSize: 12, fontWeight: 700, color: C.ink2, flexShrink: 0,
        }}>SAR {p.price.toLocaleString()}</Typography>
      )}
    </Stack>
  );
}

function Label({ children }) {
  return (
    <Typography sx={{
      fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
      color: C.ink2, mb: 1.25,
    }}>{children}</Typography>
  );
}
