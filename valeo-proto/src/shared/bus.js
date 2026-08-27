/*
 * THE BUS — the only thing the two prototypes share.
 *
 * The Studio publishes configuration. The patient app reads it and never
 * writes it back. That one-way rule is what makes the demo legible: when
 * something changes on the phone, it changed because somebody published it
 * next door, and there is no second explanation.
 *
 * Both apps are served from the same origin (/p1/ and /p2/ on one Pages site),
 * which buys two things that a cross-origin split would not:
 *   · one localStorage namespace, so a publish is visible immediately
 *   · the `storage` event, which fires in OTHER tabs of the same origin, so a
 *     publish in the Studio tab lights up the waiting screen in the app tab
 *     with no refresh and no polling
 *
 * `storage` deliberately does not fire in the tab that wrote it, so each app
 * also notifies itself locally. Same subscribe call either way.
 */

/* ── WHY THE SEED HAS A VERSION ──
   Publishing takes a COPY of the draft, which is the point: the app reads what
   was published, not what somebody is typing. But the draft comes from a seed
   that ships with the code, so every time the seed gains a field or better
   words, anybody holding a published copy keeps seeing the old ones and has no
   way to know why. The answer was "republish", which is a workflow, not a fix.

   So the storage keys carry the seed version. Ship a new seed and the old store
   is swept on load: drafts reseed, published clears, and nobody is left reading
   a snapshot of copy that no longer exists. Bump this whenever the seed changes
   in a way a patient or a category manager would notice. */
const SEED_VERSION = 6;

export const STUDIO_KEY = `valeo.studio.v${SEED_VERSION}`;   /* the Studio writes, the app reads */
export const PATIENT_KEY = `valeo.patient.v${SEED_VERSION}`; /* the app writes, the Studio ignores */

/* Every superseded key, swept on load so a stale shape or stale copy cannot
   come back later. */
try {
  for (let v = 1; v < SEED_VERSION; v += 1) {
    localStorage.removeItem(`valeo.studio.v${v}`);
    localStorage.removeItem(`valeo.patient.v${v}`);
  }
} catch { /* private mode */ }

const listeners = new Set();

function readRaw(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    /* private mode, or somebody hand-edited the value: the prototype keeps
       working from defaults rather than dying on a parse error */
    return fallback;
  }
}

function writeRaw(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  listeners.forEach((fn) => { try { fn(key); } catch { /* one bad listener must not stop the rest */ } });
}

export const readStudio = (fallback = null) => readRaw(STUDIO_KEY, fallback);
export const writeStudio = (value) => writeRaw(STUDIO_KEY, value);
export const readPatient = (fallback = null) => readRaw(PATIENT_KEY, fallback);
export const writePatient = (value) => writeRaw(PATIENT_KEY, value);

/* Fires on any change to either key, from this tab or another one. */
export function subscribe(fn) {
  listeners.add(fn);
  const onStorage = (e) => {
    if (e.key === STUDIO_KEY || e.key === PATIENT_KEY) fn(e.key);
  };
  window.addEventListener('storage', onStorage);
  return () => { listeners.delete(fn); window.removeEventListener('storage', onStorage); };
}

export function resetAll() {
  try { localStorage.removeItem(STUDIO_KEY); localStorage.removeItem(PATIENT_KEY); } catch { /* ignore */ }
  listeners.forEach((fn) => fn(null));
}

/* ── the goals both apps know about ──
   Recover and Rebuild is the one built out in full. The other two are real
   entries so the Studio's goal picker is not a dropdown with one item, but
   their configuration is deliberately thinner. */
export const GOALS = [
  { id: 'recover-rebuild', t: 'Recover and Rebuild', sub: 'Injury, recovery and repair',
    protocol: 'Valeo Recovery & Repair Peptide Protocol', built: true, ic: 'bolt' },
  { id: 'weight-loss', t: 'Weight loss', sub: 'GLP-1, tracked and reviewed',
    protocol: 'Weight Loss', built: false, ic: 'scale', existing: true },
  { id: 'skin-hair', t: 'Skin and hair', sub: 'Firmness, texture, density',
    protocol: 'Valeo Skin & Hair Peptide Protocol', built: false, ic: 'spark' },
];
export const goalOf = (id) => GOALS.find((g) => g.id === id) || null;

/* ── what the app is waiting for, in order ──
   Each gate names the Studio surface that unblocks it. The waiting screen
   prints this, so a demo never has to explain what it is stuck on. */
export const GATES = {
  onboarding:  { t: 'Onboarding chat',    studio: 'Onboarding Chat Builder' },
  triage:      { t: 'Triage chat',        studio: 'Onboarding Chat Builder' },
  prepurchase: { t: 'Pre-purchase flow',  studio: 'Pre-purchase Builder' },
  plan:        { t: 'Protocol plan',      studio: 'Protocol Builder' },
  consult:     { t: 'Consult outcome',    studio: 'Clinician Console' },
};

/* The onboarding chat belongs to no goal: it is the conversation that decides
   which goal you are in. It is stored under a pseudo-goal so that publishing,
   version stamping and the waiting gates all work on it unchanged. */
export const SHARED = 'shared';

export const publishedFor = (studio, goalId, part) =>
  (studio && studio.published && studio.published[goalId] && studio.published[goalId][part]) || null;
