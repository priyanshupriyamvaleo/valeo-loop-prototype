import { publishedFor, GATES } from '../../shared/bus';
import { findService } from '../../p2/lib/seed';

/* THE ONE PATIENT THIS APP IS.
   Consult records are keyed by patient in the Studio. The phone is Ahmad, so it
   reads his and only his. */
export const LIVE_PATIENT = 'live';
export const consultFor = (studio, id = LIVE_PATIENT) => (studio?.consults?.[id]) || null;

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
  if (gateKey === 'consult') return !!consultFor(studio);
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
  const added = (consulted && consultFor(studio)?.addedItems) || [];
  const merged = [...base];
  added.forEach((a) => {
    if (merged.some((m) => m.id === a.id)) return;
    /* The clinician DEFINED this step, so it keeps what she gave it. This used
       to overwrite every added item's action with a view-only one, which meant
       a blood test a doctor ordered was a step the patient could look at and
       never book. */
    const item = { ...a, doctorAdded: true };
    /* Straight after the step the patient was on when it was added, rather
       than at the end. The item carries that step's week, so the stable sort
       below holds it exactly where it was put. */
    /* Each one goes after the last thing already inserted behind that step, not
       straight after the step itself, or three additions would come out in the
       reverse of the order the doctor added them. */
    const anchor = a.afterStepId ? merged.findIndex((m) => m.id === a.afterStepId) : -1;
    if (anchor === -1) { merged.push(item); return; }
    let at = anchor;
    while (at + 1 < merged.length && merged[at + 1].doctorAdded
           && merged[at + 1].afterStepId === a.afterStepId) at += 1;
    merged.splice(at + 1, 0, item);
  });
  /* Week first, then the order they were authored in. Array sort is stable, so
     the several steps that share a week keep their position, which is what
     finally makes the builder's up and down arrows reach the patient. */
  return merged.sort((a, b) => weekNo(a) - weekNo(b));
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
export function weekOf(plan, done, weeks = 12) {
  const last = plan.filter((i) => done.includes(i.id)).slice(-1)[0];
  return Math.max(1, Math.min(weeks, last ? weekNo(last) : 1));
}

/* How long the protocol runs, from the Studio rather than from a number typed
   into three screens. */
/* ── ELAPSED TIME, SIMULATED ──
   There is no clock in this prototype: a presenter moves time from the demo
   rail. But a plan that only knows the week each step was PLANNED for cannot
   say whether the patient is running late, and running late is the whole point
   of a per-patient view. So the patient carries a day counter, and each step
   records the day it was actually completed on. */
export const weekOfDay = (day) => Math.max(1, Math.ceil(((day || 0) + 1) / 7));

/* Completing a step moves time into that step's planned week, plus a little
   slack, so drift accumulates the way it does in life rather than every step
   landing exactly on plan. */
export function dayAfter(day, item) {
  const earliest = (weekNo(item) - 1) * 7 + 2;
  return Math.max((day || 0) + 2, earliest);
}

/* Planned against actual, for one completed step. */
export function drift(item, completedOn) {
  const on = completedOn && completedOn[item.id];
  if (on == null) return null;
  const actual = weekOfDay(on);
  return { planned: weekNo(item), actual, late: actual - weekNo(item) };
}

export const weeksOf = (studio, goalId) =>
  (publishedFor(studio, goalId, 'plan')?.weeks) || 12;

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
/* ── WHO HAS THIS, DERIVED RATHER THAN TYPED ──
   A step used to carry an `actor` field beside its linked service, which meant
   saying the same thing twice and letting the two disagree: nothing stopped
   somebody linking a lab panel and then setting the actor to Patient. The
   service already says who does the work, and the call to action already says
   whether the patient has to do anything, so both are read rather than asked
   for a second time.

   Booking is the patient's move. Tracking a parcel is not: the pharmacy still
   has the parcel, the patient is only watching it. */
export const isPatientMove = (item) => item?.action?.kind === 'book';

const OWNER = {
  lab: 'The lab',
  homecare: 'Your nurse',
  consult: 'Your doctor',
  medication: 'The pharmacy',
  supplement: 'Valeo',
};

/* Returns null rather than guessing. Two steps carry no linked service, and
   falling through to "your care team" told the patient the wrong thing about
   both: the nurse draws the blood and the lab runs it. Where this is null the
   caller omits the line, and the step's own copy carries who has it. */
/* The avatar letter. "The pharmacy" and "Your nurse" both start with a word
   that says nothing, so the initial comes from the first word that does. */
export const actorInitial = (name) =>
  (String(name || '?').replace(/^(the|your|a)\s+/i, '')[0] || '?').toUpperCase();

export function actorOf(item) {
  if (!item) return null;
  if (item.doctorAdded) return 'Your care team';
  if (isPatientMove(item)) return 'You';
  const svc = findService(item.serviceId);
  return svc ? (OWNER[svc.type] || null) : null;
}

/* ── WHEN, AS A WEEK ──
   A step used to carry a window in days and two separate places converted it.
   The plan is sold in weeks, its milestones are named in weeks, and the exact
   date comes from the booking rather than from here, so the week is all a step
   needs to say and the label is now a read rather than a calculation. */
export const weekNo = (item) => (item && item.week) || 1;
export const whenLabel = (item) => (item ? `Week ${weekNo(item)}` : '');


/* The next few weeks, so the screen reads as current rather than encyclopedic.
   `skip` carries the ids already shown higher up the screen. Without it the same
   three steps appeared under both "In motion" and "Next two weeks", which is the
   duplication that made the old list feel like a config dump. */
export function soon(plan, done, skip = [], weeks = 3, limit = 4) {
  const front = nextItem(plan, done);
  if (!front) return [];
  return plan
    .filter((i) => !done.includes(i.id) && !skip.includes(i.id)
      && weekNo(i) <= weekNo(front) + weeks)
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

/* ── WHAT THE PATIENT IS ON, AS OPPOSED TO WHAT THEY MUST DO ──
   Medicines, peptides and supplements have no date and nothing to turn up for.
   Putting them in the plan made a shopping list wear a schedule as a costume,
   so they are a standing list instead: what is already running, and what the
   doctor has suggested on top of it.

   The protocol's own medication steps supply the ongoing ones, so a patient
   sees what they are taking before any consultation has happened. */
export function medicinesFor(studio, goalId, journey) {
  const pub = publishedFor(studio, goalId, 'plan');
  const plan = (pub && pub.data) || [];
  const done = (journey && journey.done) || [];
  const out = new Map();

  plan.forEach((it) => {
    const svc = findService(it.serviceId);
    if (svc && svc.type === 'medication') {
      /* The same medicine hangs off every month's dispatch step, so status is
         decided by whether ANY of them has shipped. Taking the last one meant
         Month 3 overwrote Month 1 and a patient already on their pen was told
         it was still coming. Once shipped, it stays shipped. */
      const shipped = done.includes(it.id) || out.get(svc.id)?.status === 'ongoing';
      out.set(svc.id, { id: svc.id, status: shipped ? 'ongoing' : 'coming' });
    }
  });

  const consulted = done.includes('p4');
  const c = consulted && consultFor(studio);
  if (c) (c.prescribed || []).forEach((r) => out.set(r.id, { ...r, fromDoctor: true }));
  return [...out.values()];
}

/* ── WHICH SERVICE A STEP ACTUALLY CARRIES ──
   The builder sets a default; for the steps flagged `clinicianCanSet` the doctor
   can change it for one patient at the consultation, and from then on that is
   what the step is.

   This used to exist only for the supplement voucher, and only on the card when
   the voucher happened to be the front item, so the same step named a different
   product in What follows and in the full plan list. One resolver, used
   everywhere a service is named. */
/* The doctor found this protocol unsuitable, so it stops. The patient should
   see that a person decided it, not a next step they should not take. */
export const pausedBy = (studio, journey) =>
  ((journey?.done || []).includes('p4') && consultFor(studio)?.outcome === 'Not suitable')
    ? consultFor(studio) : null;

export function serviceForStep(studio, item, journey) {
  if (!item) return null;
  const done = (journey && journey.done) || [];
  const overrides = (done.includes('p4') && consultFor(studio)?.overrides) || {};
  return findService(overrides[item.id] || item.serviceId);
}

/* ── WHAT THIS PATIENT IS ACTUALLY BUYING ──
   The protocol has one price and everything in it is covered. What the doctor
   adds afterwards is not, and the difference is the only number anybody
   handling an account actually wants: the protocol, plus what has been added on
   top, equals what this patient is worth.

   Read off the resolved plan rather than a stored basket, because there is no
   basket: the plan IS the order, and a second copy of it would drift. */
export function packageFor(studio, goalId, journey) {
  const plan = planFor(studio, goalId, journey);
  const pp = publishedFor(studio, goalId, 'prepurchase');
  const base = pp?.data?.cart?.price || 0;
  const c = consultFor(studio);

  const lines = [];
  const seen = new Set();
  plan.forEach((it) => {
    const svc = serviceForStep(studio, it, journey);
    if (!svc) return;
    const key = `${svc.id}@${it.id}`;
    if (seen.has(key)) return;
    seen.add(key);
    lines.push({
      key, id: svc.id, t: svc.t, note: svc.note, type: svc.type,
      price: svc.price || 0,
      step: it.t, week: it.week,
      /* Anything the doctor put there is on top of the protocol price. */
      added: !!it.doctorAdded,
      swapped: !!(c?.overrides && c.overrides[it.id]),
    });
  });

  /* Products on the medicines list that are not a step of their own. */
  (c?.prescribed || []).forEach((r) => {
    if (lines.some((l) => l.id === r.id)) return;
    const svc = findService(r.id);
    if (!svc) return;
    lines.push({ key: `rx_${r.id}`, id: svc.id, t: svc.t, note: svc.note, type: svc.type,
      price: svc.price || 0, step: 'Prescribed at the consultation', week: null,
      added: true, swapped: false });
  });

  const extra = lines.filter((l) => l.added).reduce((n, l) => n + l.price, 0);
  return { lines, base, extra, total: base + extra };
}
