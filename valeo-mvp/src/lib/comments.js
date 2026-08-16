/* ══════════════════════════════════════════════════════════════════════════
   COMMENTS — a thin client for the Supabase REST API.

   No SDK. The official client is about 30 kB for three calls we can write in
   forty lines, and this bundle is already large enough that Vite warns about
   it. PostgREST speaks plain HTTP, so `fetch` is the whole dependency list.

   ── THE KEY IS PUBLIC AND THAT IS THE DESIGN ──
   Vite writes VITE_ variables into the bundle at build time, and that bundle
   is committed to a public repository. The anon key is therefore readable by
   anyone. This is how Supabase expects it to work: the key identifies the
   project, and the row level security rules on the table are what actually
   grant access. Our rules allow read, insert and update on `comments` and
   nothing else. There is no delete rule, so a reviewer can resolve a comment
   but cannot destroy one.

   ── IT MUST DEGRADE, NOT CRASH ──
   The prototype has to keep working for someone who clones it without a
   Supabase project, and it has to keep working if Supabase is unreachable.
   Every function here resolves to a value the panel can render. None of them
   throw. `configured` tells the panel which message to show.
   ══════════════════════════════════════════════════════════════════════════ */

const URL = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const configured = Boolean(URL && KEY);

const api = `${URL}/rest/v1/comments`;
const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
};

/* Every comment for one screen, oldest first — a thread reads top to bottom. */
export async function listComments(screen) {
  if (!configured) return { ok: false, rows: [] };
  try {
    const q = `screen=eq.${encodeURIComponent(screen)}&order=created_at.asc`;
    const res = await fetch(`${api}?${q}`, { headers });
    if (!res.ok) return { ok: false, rows: [] };
    return { ok: true, rows: await res.json() };
  } catch {
    return { ok: false, rows: [] };
  }
}

/* `return=representation` hands back the stored row, so the panel renders the
   real id and the server's timestamp rather than guessing at them. */
export async function addComment({ author, body, screen }) {
  if (!configured) return null;
  try {
    const res = await fetch(api, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify([{ author, body, screen }]),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0] || null;
  } catch {
    return null;
  }
}

export async function resolveComment(id, resolved) {
  if (!configured) return false;
  try {
    const res = await fetch(`${api}?id=eq.${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ resolved }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ── WHO IS WRITING ──
   There is no login, so the name is self-declared and stored in the browser.
   Nobody verifies it. For a named group of reviewers that is enough, and a
   login screen in front of a feedback box would stop people leaving feedback.
   The trade is deliberate: attribution good enough to act on, zero friction. */
const NAME_KEY = 'valeo.reviewer';

export function getReviewer() {
  try { return localStorage.getItem(NAME_KEY) || ''; } catch { return ''; }
}

export function setReviewer(name) {
  try { localStorage.setItem(NAME_KEY, name); } catch { /* private mode */ }
}
