import { publishedFor, GATES } from '../../shared/bus';

/*
 * THE RESOLVER.
 *
 * The Recover and Rebuild spec makes one claim the prototype has to earn:
 * "They are not thirteen designs. They are one card and one detail screen,
 * rendering whichever plan item is currently due."
 *
 * So there are no thirteen screens in this app. There is a published plan, a
 * set of completed item ids, and this function, which returns the earliest
 * item not yet done. The card and the detail screen render whatever it hands
 * back. Add an item in the Studio and a state appears here with no new code,
 * which is the whole argument for building it this way.
 */

export const STAGES = {
  picking: 'picking',       /* Discover, choosing a goal */
  gate: 'gate',             /* stopped, waiting on the Studio */
  triage: 'triage',         /* answering the published questions */
  pdp: 'pdp',
  cart: 'cart',
  confirm: 'confirm',
  running: 'running',       /* purchased, the resolver drives it */
};

/* Which gate, if any, is blocking the journey at this point. */
export function gateFor(stage, studio, goalId) {
  if (stage === 'gate:triage')      return { key: 'triage', ...GATES.triage };
  if (stage === 'gate:prepurchase') return { key: 'prepurchase', ...GATES.prepurchase };
  if (stage === 'gate:plan')        return { key: 'plan', ...GATES.plan };
  if (stage === 'gate:consult')     return { key: 'consult', ...GATES.consult };
  return null;
}

/* Is the thing that gate is waiting for available yet? */
export function gateOpen(gateKey, studio, goalId) {
  if (!studio) return false;
  if (gateKey === 'consult') return !!studio.consult;
  const pub = publishedFor(studio, goalId, gateKey);
  return !!(pub && pub.data);
}

/* The patient's own plan: the published template, plus anything the doctor
   added at a consult. The doctor's items are merged in by offset, so they take
   their natural place in the schedule rather than landing at the end. */
export function planFor(studio, goalId, journey) {
  const pub = publishedFor(studio, goalId, 'plan');
  const base = (pub && pub.data) ? structuredClone(pub.data) : [];
  /* Items the clinician added at the consultation only exist for a patient who
     has HAD that consultation. Merging them on the mere existence of a consult
     record showed a day-zero patient steps labelled "added at your consult"
     before any consult had happened. */
  const consulted = !!(journey && (journey.done || []).includes('p4'));
  const added = (consulted && studio && studio.consult && studio.consult.addedItems) || [];
  const merged = [...base];
  added.forEach((a) => {
    if (merged.some((m) => m.id === a.id)) return;
    merged.push({ ...a, doctorAdded: true, action: { kind: 'view', label: 'View details' } });
  });
  return merged.sort((a, b) => (a.offset || 0) - (b.offset || 0));
}

/* The earliest item not done. This is the whole state machine. */
export function nextItem(plan, done) {
  return plan.find((i) => !done.includes(i.id)) || null;
}

/* How far through, for the card's progress line. */
export function progress(plan, done) {
  if (!plan.length) return { done: 0, total: 0, pct: 0 };
  const n = plan.filter((i) => done.includes(i.id)).length;
  return { done: n, total: plan.length, pct: Math.round((n / plan.length) * 100) };
}

/* The week a patient is in, derived from the last completed offset rather than
   from a stored counter, so it cannot drift from the plan. */
export function weekOf(plan, done) {
  const last = plan.filter((i) => done.includes(i.id)).slice(-1)[0];
  const day = last ? last.offset : 0;
  return Math.max(1, Math.min(12, Math.floor(day / 7) + 1));
}

/* ── WEIGHT LOSS ──
   Documented, not rebuilt. Four modules, each on its own condition, sorted by
   priority: the top two render and the rest are swipeable. The four Figma
   entry points are not four flows, they are this list with different modules
   qualifying, which is why the demo switches them with one control. */
export const WL_MODULES = [
  { k: 'blood_test_report', t: 'Blood test report', when: 'A weight-loss panel report exists' },
  { k: 'prescription', t: 'Prescription (Rx)', when: 'An Rx has unpurchased items' },
  { k: 'follow_up_call', t: 'Follow-up call', when: 'No unpurchased Rx, and a consult is bookable' },
  { k: 'tracker', t: 'Tracker', when: 'Always' },
];

export const WL_ENTRIES = {
  rx:     { t: 'Prescription led', mods: ['prescription', 'tracker'] },
  meds:   { t: 'Medicine purchased', mods: ['follow_up_call', 'tracker'] },
  blood:  { t: 'Blood test booked', mods: ['blood_test_report', 'tracker'] },
  tagged: { t: 'Tagged GLP-1 by ops', mods: ['tracker'] },
};

/* ── WHOSE MOVE IS IT ──
   Nine of the fourteen seeded steps belong to a nurse, a lab, the pharmacy or
   the care team. Only five are the patient's. That ratio is the most important
   fact about this protocol and the screen is built on it: most of the twelve
   weeks is spent waiting while other people work, so the app has to render the
   waiting as work rather than as silence. */
export const isPatientMove = (item) => !!item && /^Patient/.test(item.actor || '');

/* What Valeo is doing right now on this patient's behalf. Windowed, because a
   list of everything still outstanding is the config dump we are replacing. */
export function inMotion(plan, done, limit = 3) {
  const front = nextItem(plan, done);
  if (!front) return [];
  return plan
    .filter((i) => !done.includes(i.id) && !isPatientMove(i) && i.offset <= front.offset + 21)
    .slice(0, limit);
}

/* The next fortnight, so the screen reads as current rather than encyclopedic.
   `skip` carries the ids already shown higher up the screen. Without it the same
   three steps appeared under both "In motion" and "Next two weeks", which is the
   duplication that made the old list feel like a config dump. */
export function soon(plan, done, skip = [], days = 14, limit = 4) {
  const front = nextItem(plan, done);
  if (!front) return [];
  return plan
    .filter((i) => !done.includes(i.id) && !skip.includes(i.id) && i.offset <= front.offset + days)
    .slice(0, limit);
}

/* Which of the three action screens this item opens.
   `book` and `track` already exist on the seeded items; everything else is
   something happening elsewhere, which is a status view. */
export const archetypeOf = (item) =>
  (item && item.action && item.action.kind === 'book') ? 'schedule'
    : (item && item.action && item.action.kind === 'track') ? 'status'
      : 'status';

/* ── THE RECOVERY SCORE ──
   One number out of the two the patient actually reports. Pain and capacity
   each say half of it and neither says it alone, so they are folded into a
   single 0 to 100 that a card can carry and a doctor can read at a glance.
   Nothing here is measured by a device: this is the patient's own account of
   their recovery, which is the only thing available on day zero. */
export const recoveryScore = (c) =>
  (!c ? null : Math.round((((10 - c.pain) + c.capacity) / 20) * 100));

/* The four things a Recover and Rebuild patient can log, and whether the plan
   has reached the point where each one means anything yet. Doses before the
   medicine has shipped is a tile asking for a number that cannot exist. */
export function captures(done, logs = {}) {
  const shipped = done.includes('p6');
  const started = done.includes('p2');
  return [
    { k: 'symptoms', t: 'Symptoms', ic: 'activity', due: true,
      note: 'Pain and capacity' },
    { k: 'doses', t: 'Doses', ic: 'plus', due: shipped,
      note: shipped ? 'BPC-157, daily' : 'From Month 1' },
    { k: 'meals', t: 'Meals', ic: 'flask', due: started,
      note: started ? 'Roughly what it was' : 'After your first visit' },
    { k: 'scan', t: 'Heart scan', ic: 'chat', due: false,
      note: 'Needs the camera build' },
  ].map((c) => ({ ...c, count: logs[c.k] || 0 }));
}

/* ── WHICH STATE A STEP IS IN ──
   A step is not done or not-done. It is asked, booked, waited on, then done,
   and it says something different in each. Booking the nurse should turn "Book
   your nurse visit" into "Arriving Wednesday, 08:30" rather than leaving the
   same task on screen with a tick beside it.

   ASK       the patient's move, not yet made
   SCHEDULED booked, not yet attended. The appointment replaces the task.
   WAITING   somebody else's move, in progress
   PLAIN     none of the above, so the step's own words

   `booked` carries the slots, keyed by the step that chose them. A step can
   show a slot another step booked, which is how the nurse appointment knows
   when the nurse is coming. */
export function stateOf(item, booked = {}) {
  if (!item) return null;
  const slot = (k) => booked[k] || null;

  if (item.scheduled && slot(item.id)) {
    return { k: 'scheduled', ...item.scheduled, when: slot(item.id) };
  }
  if (isPatientMove(item) && item.ask) {
    return { k: 'ask', ...item.ask };
  }
  if (!isPatientMove(item) && item.waiting) {
    const w = item.waiting;
    return { k: 'waiting', ...w, when: w.slotFrom ? slot(w.slotFrom) : null };
  }
  return { k: 'plain', title: item.t, body: item.sub };
}

/* Booking completes a step outright unless the step has somewhere to be after
   it is booked. A consultation you have not attended is not a consultation you
   have had. */
export const bookingCompletes = (item) => !item || !item.scheduled;
