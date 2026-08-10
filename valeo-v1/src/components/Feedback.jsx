import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { C } from '../theme';
import { ago } from '../lib/screen';
import {
  configured, listComments, addComment, resolveComment, getReviewer, setReviewer,
} from '../lib/comments';

/**
 * THE FEEDBACK PANEL.
 *
 * A review surface for a prototype that is going to a designer and a handful
 * of colleagues. It sits beside the phone rather than inside it, because a
 * comment box drawn inside the frame would become part of the thing being
 * reviewed and people would start commenting on the comment box.
 *
 * ── IT FOLLOWS THE STATE, NOT THE URL ──
 * There is one URL. `screen.key` is resolved from the app's own state, so the
 * thread changes as the reviewer moves, and a comment left on the checkout is
 * waiting on the checkout when somebody else arrives there next week.
 *
 * ── NO SECTION PICKER ──
 * An earlier design had a dropdown of sections per screen. It was dropped on
 * purpose: the reviewer writes "the bottom section" in their own words, which
 * is faster for them and needs no manifest that goes stale every time a screen
 * is rebuilt. This prototype has been rebuilt four times in a week.
 *
 * ── FAILURE IS A MESSAGE, NOT A BLANK BOX ──
 * If the keys are missing or Supabase is unreachable the panel says so and
 * disables the composer. Silently swallowing a comment somebody spent two
 * minutes writing is the worst thing this component could do.
 */
export default function Feedback({ screen }) {
  const [rows, setRows] = useState([]);
  const [ok, setOk] = useState(true);
  const [name, setName] = useState(getReviewer());
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const feed = useRef(null);

  /* Reload whenever the reviewer moves to another screen. */
  useEffect(() => {
    let live = true;
    if (!configured) { setOk(false); return undefined; }
    listComments(screen.key).then((r) => {
      if (!live) return;
      setOk(r.ok);
      setRows(r.rows);
    });
    return () => { live = false; };
  }, [screen.key]);

  useEffect(() => {
    if (feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [rows.length]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !name || busy) return;
    setBusy(true);
    const row = await addComment({ author: name, body, screen: screen.key });
    setBusy(false);
    if (!row) { setOk(false); return; }
    setRows((r) => [...r, row]);
    setDraft('');
  };

  const toggle = async (row) => {
    const next = !row.resolved;
    setRows((r) => r.map((x) => (x.id === row.id ? { ...x, resolved: next } : x)));
    const done = await resolveComment(row.id, next);
    if (!done) setRows((r) => r.map((x) => (x.id === row.id ? { ...x, resolved: !next } : x)));
  };

  const open = rows.filter((r) => !r.resolved);
  const done = rows.filter((r) => r.resolved);
  const shown = showDone ? rows : open;

  return (
    <Box sx={{
      /* Laptop only, by decision. The rail opposite is hidden the same way. */
      display: { xs: 'none', md: 'flex' },
      flexDirection: 'column', width: 300, maxHeight: 760,
      borderRadius: '20px', overflow: 'hidden',
      bgcolor: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)',
    }}>
      <Box sx={{ px: 2, pt: 1.9, pb: 1.5, borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <Typography sx={{
          fontSize: 11, fontWeight: 800, letterSpacing: '.18em',
          textTransform: 'uppercase', color: C.yellow,
        }}>Feedback</Typography>
        <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#fff', mt: 0.9 }}>
          {screen.label}
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#93A9C2', mt: 0.35 }}>
          {open.length} open
          {done.length > 0 && (
            <Box component="span" onClick={() => setShowDone((v) => !v)} sx={{
              ml: 1, cursor: 'pointer', color: '#5D7793',
              '&:hover': { color: '#93A9C2' },
            }}>· {done.length} resolved {showDone ? '(hide)' : '(show)'}</Box>
          )}
        </Typography>
      </Box>

      <Box ref={feed} sx={{ flex: '1 1 auto', minHeight: 190, overflowY: 'auto', px: 2, py: 1.75 }}>
        {!ok ? (
          <Typography sx={{ fontSize: 12, color: '#E08A7A', lineHeight: 1.6 }}>
            {configured
              ? 'Cannot reach the comment store. Your comment was not saved.'
              : 'Comments are not set up. Add VITE_SUPABASE_URL and '
                + 'VITE_SUPABASE_ANON_KEY to .env.local, then rebuild.'}
          </Typography>
        ) : shown.length === 0 ? (
          <Typography sx={{ fontSize: 12, color: '#5D7793', lineHeight: 1.6 }}>
            No comments on this screen yet. Say which part you mean — “the total
            row”, “the bottom section” — and what is wrong with it.
          </Typography>
        ) : shown.map((r) => (
          <Box key={r.id} sx={{ mb: 1.75, opacity: r.resolved ? 0.45 : 1 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                {r.author}
              </Typography>
              <Typography sx={{ flex: 1, fontSize: 10.5, color: '#5D7793' }}>
                {ago(r.created_at)}
              </Typography>
              <Box onClick={() => toggle(r)} title={r.resolved ? 'Reopen' : 'Resolve'} sx={{
                width: 17, height: 17, borderRadius: '50%', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                bgcolor: r.resolved ? 'rgba(39,153,91,.5)' : 'rgba(255,255,255,.08)',
              }}>
                <CheckIcon sx={{ fontSize: 11, color: r.resolved ? '#fff' : '#5D7793' }} />
              </Box>
            </Stack>
            <Typography sx={{
              fontSize: 12.5, color: '#C7D6E6', mt: 0.4, lineHeight: 1.55,
              whiteSpace: 'pre-wrap',
              textDecoration: r.resolved ? 'line-through' : 'none',
            }}>{r.body}</Typography>
          </Box>
        ))}
      </Box>

      <Box sx={{ px: 2, py: 1.75, borderTop: '1px solid rgba(255,255,255,.08)' }}>
        {!name ? (
          /* Asked once, then never again. A login in front of a feedback box
             stops people leaving feedback. */
          <>
            <Typography sx={{ fontSize: 11.5, color: '#93A9C2', mb: 1 }}>
              Your name, so the team knows who wrote what.
            </Typography>
            <Box component="input" autoComplete="name" placeholder="Name"
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const v = e.target.value.trim();
                if (!v) return;
                setReviewer(v); setName(v);
              }}
              sx={inputSx} />
          </>
        ) : (
          <>
            <Box component="textarea" rows={3} value={draft} disabled={!ok}
              placeholder={`Comment on ${screen.label}…`}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) send();
              }}
              sx={{ ...inputSx, resize: 'none', lineHeight: 1.5 }} />
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 1 }}>
              <Typography sx={{ flex: 1, fontSize: 10.5, color: '#5D7793' }}>
                {name} · ⌘↵ to send
              </Typography>
              <Box onClick={send} sx={{
                px: 1.6, py: 0.7, borderRadius: '8px',
                cursor: draft.trim() && ok ? 'pointer' : 'default',
                fontSize: 12, fontWeight: 700,
                bgcolor: draft.trim() && ok ? C.yellow : 'rgba(255,255,255,.07)',
                color: draft.trim() && ok ? C.deep : '#5D7793',
              }}>{busy ? 'Saving…' : 'Comment'}</Box>
            </Stack>
          </>
        )}
      </Box>
    </Box>
  );
}

const inputSx = {
  width: '100%', boxSizing: 'border-box',
  px: 1.4, py: 1.1, borderRadius: '9px',
  bgcolor: 'rgba(255,255,255,.06)', color: '#fff',
  border: '1px solid rgba(255,255,255,.12)',
  fontFamily: 'inherit', fontSize: 12.5, outline: 'none',
  '&::placeholder': { color: '#5D7793' },
  '&:focus': { borderColor: 'rgba(255,185,0,.5)' },
};
