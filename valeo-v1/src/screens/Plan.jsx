import { useState } from 'react';
import { Box, IconButton, InputBase, Stack, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CheckIcon from '@mui/icons-material/Check';
import {
  PROTOCOLS, recommendFor, searchProtocols, catList, twinFor, statusOf, DOCTOR, RX_LABEL,
} from '../data';
import { C, meter } from '../theme';

/**
 * PLAN — the shortlist and the catalogue, one screen.
 *
 * They were two, and that left a hole: after you picked a protocol there was no
 * route to a second one. A shortlist answers "what should I do" exactly once and
 * then has nothing to say. So Plan is the permanent way in, and the two halves
 * do different jobs — a recommendation for someone who does not know, a search
 * for someone who does.
 *
 * The screen does not switch modes; it REORDERS. With nothing running, the
 * shortlist leads, because a first-timer needs a recommendation and browsing
 * seven protocols is work we should be doing for them. Once they have a protocol,
 * browse leads, because their question has changed from "what should I do" to
 * "what else is there" — and a shortlist they already acted on is now noise at
 * the top of the page.
 *
 * Search sits above both in every state. It costs one thin row and it is the only
 * affordance that works when the user arrived knowing the answer.
 */
export default function Plan({ st, onOpen }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(null);

  const cats = catList(st);
  const searching = q.trim().length > 0;
  const held = Object.keys(st.runs || {}).length > 0 || (st.saved || []).length > 0;
  /* what leads the page — see the note above */
  const lead = held ? 'browse' : 'matched';

  const recs = recommendFor(st, 3);
  const results = searching
    ? searchProtocols(q)
    : cat ? (cats.find((c) => c.k === cat) || { keys: [] }).keys
      : null;

  const Matched = () => (
    <>
      <Label>{held ? 'Also matched to you' : 'Matched to you'}</Label>
      {!held && (
        <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: -0.75, mb: 1.4, lineHeight: 1.55 }}>
          Picked from your answers by {DOCTOR.name}. Every one ends in a retest that says
          whether it worked on you.
        </Typography>
      )}
      <Stack spacing={held ? 1 : 1.4}>
        {recs.map((r, i) => (held
          ? <Row key={r.k} pKey={r.k} st={st} onOpen={onOpen} note={r.why} />
          : (
            <Box key={r.k} onClick={() => onOpen(r.k)} sx={{
              borderRadius: '20px', bgcolor: '#fff', overflow: 'hidden', cursor: 'pointer',
              boxShadow: '0 3px 16px -9px rgba(27,57,91,.45)',
              border: `1.5px solid ${i === 0 ? C.yellow : 'rgba(27,57,91,.07)'}`,
            }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', p: 1.75 }}>
                <Avatar tw={r.tw} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {i === 0 && (
                    <Typography sx={{
                      fontSize: 8, fontWeight: 800, letterSpacing: '.14em',
                      textTransform: 'uppercase', color: C.yellowDeep, mb: 0.35,
                    }}>Best fit</Typography>
                  )}
                  <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.deep }}>
                    {r.p.t}
                  </Typography>
                  <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>{r.why}</Typography>
                </Box>
                <Stack sx={{ alignItems: 'flex-end', flexShrink: 0 }}>
                  <Typography sx={{
                    fontFamily: meter, fontSize: 17, fontWeight: 700, color: C.deep, lineHeight: 1,
                  }}>{r.match}%</Typography>
                  <Typography sx={{
                    fontSize: 7.5, fontWeight: 800, letterSpacing: '.12em',
                    textTransform: 'uppercase', color: C.ink2, mt: 0.4,
                  }}>Match</Typography>
                </Stack>
              </Stack>
              <Stack direction="row" spacing={1} sx={{
                alignItems: 'center', px: 1.75, py: 1.35,
                borderTop: `1px solid ${C.line}`, bgcolor: 'rgba(27,57,91,.022)',
              }}>
                <Typography sx={{ flex: 1, minWidth: 0, fontSize: 11.5, color: C.ink2 }}>
                  {r.p.wk} weeks · retests <b style={{ color: C.deep }}>{r.p.mk}</b>
                </Typography>
                <Typography sx={{
                  fontFamily: meter, fontSize: 12, fontWeight: 700, color: C.deep, flexShrink: 0,
                }}>SAR {r.p.price.toLocaleString()}</Typography>
                <ChevronRightIcon sx={{ fontSize: 18, color: C.ink2, flexShrink: 0 }} />
              </Stack>
            </Box>
          )))}
      </Stack>
    </>
  );

  const Browse = () => (
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
              <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>{g.t}</Typography>
              <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.15 }}>
                {g.keys.length} protocol{g.keys.length === 1 ? '' : 's'}
                {g.yours ? ' · what you said you wanted' : ''}
              </Typography>
            </Box>
            <ChevronRightIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
          </Stack>
        ))}
      </Stack>
    </>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ px: 2.25, pt: 2.5, pb: 1.5, flexShrink: 0 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1.5 }}>
          <Typography variant="overline" sx={{ flex: 1, color: C.ink2 }}>
            {cat ? (cats.find((c) => c.k === cat) || {}).t : 'Protocols'}
          </Typography>
          {(searching || cat) && (
            <Typography onClick={() => { setQ(''); setCat(null); }} sx={{
              fontSize: 11.5, fontWeight: 700, color: C.teal, cursor: 'pointer',
            }}>Clear</Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1} sx={{
          alignItems: 'center', px: 1.5, py: 1.1, borderRadius: '14px', bgcolor: '#fff',
          boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
        }}>
          <SearchIcon sx={{ fontSize: 18, color: C.ink2, flexShrink: 0 }} />
          <InputBase value={q} onChange={(e) => { setQ(e.target.value); setCat(null); }}
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
        {results ? (
          <>
            <Label>
              {searching
                ? `${results.length} match${results.length === 1 ? '' : 'es'}`
                : `${results.length} protocol${results.length === 1 ? '' : 's'}`}
            </Label>
            {results.length === 0 ? (
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
                {results.map((k) => <Row key={k} pKey={k} st={st} onOpen={onOpen} />)}
              </Stack>
            )}
          </>
        ) : lead === 'matched' ? (
          <><Matched /><Box sx={{ mt: 3 }}><Browse /></Box></>
        ) : (
          <><Browse /><Box sx={{ mt: 3 }}><Matched /></Box></>
        )}
      </Box>
    </Box>
  );
}

/* One protocol as a row: everything a browse decision needs, plus whether you
   already hold it — offering to "discover" something you are mid-way through is
   the fastest way to look like two products bolted together. */
function Row({ pKey, st, onOpen, note }) {
  const p = PROTOCOLS[pKey];
  const tw = twinFor(pKey);
  const status = statusOf(st, pKey);
  const has = status !== 'saved' || (st.saved || []).includes(pKey);
  const L = RX_LABEL[status];

  return (
    <Stack direction="row" spacing={1.5} onClick={() => onOpen(pKey)} sx={{
      alignItems: 'center', px: 1.6, py: 1.5, borderRadius: '17px', cursor: 'pointer',
      bgcolor: '#fff', boxShadow: '0 2px 10px -6px rgba(27,57,91,.28)',
    }}>
      <Avatar tw={tw} sm />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{
          fontSize: 14, fontWeight: 700, color: C.deep,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{p.t}</Typography>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.15 }}>
          {note || `${p.wk} wk · scored on ${p.mk}`}
        </Typography>
      </Box>
      {has ? (
        <Stack direction="row" spacing={0.4} sx={{ alignItems: 'center', flexShrink: 0 }}>
          <CheckIcon sx={{ fontSize: 14, color: C[L.c] }} />
          <Typography sx={{
            fontSize: 11, fontWeight: 700, color: C[L.c], whiteSpace: 'nowrap',
          }}>{L.t}</Typography>
        </Stack>
      ) : (
        <Typography sx={{
          fontFamily: meter, fontSize: 12, fontWeight: 700, color: C.ink2, flexShrink: 0,
        }}>SAR {p.price.toLocaleString()}</Typography>
      )}
    </Stack>
  );
}

function Avatar({ tw, sm }) {
  const d = sm ? 44 : 48;
  return (
    <Box sx={{
      width: d, height: d, borderRadius: '14px', flexShrink: 0, overflow: 'hidden',
      bgcolor: tw ? tw.tone : C.deep, display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 800, color: 'rgba(255,255,255,.85)',
    }}>
      {tw && tw.img
        ? <Box component="img" src={tw.img} alt=""
               sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : (tw ? tw.mono : 'V')}
    </Box>
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
