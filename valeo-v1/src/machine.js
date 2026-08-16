import { GOALS, PROTOCOLS, doorOf, leadFor, coachOf, givenNameOf, statusOf } from './data';

/* ══════════════════════════════════════════════════════════════════════════
   THE MACHINE — docs/STATE_MACHINE_V1.md as executable data.

   Three surfaces read this one module: the phone (implicitly, through the
   same reducer state), the Clinic tab (queues) and the Machine tab (graph +
   levers). None of them holds state of its own.

   ── ONE STORE, ONE PROJECTION, ONE GATE ──
   Machine state is never stored: `projectEpisode` derives it from the same
   fields the phone renders from, so the surfaces cannot drift. Writes go
   through App's `fireEvent`, which finds the transition here, checks its
   guard, and refuses anything the machine would not allow. Manual levers,
   mechanical consistency.

   ── WHAT IS SIMULATED ──
   Transitions with `sim: true` pseudofy the real world (money, blood,
   video, parcels). The logic around them is never pseudofied: a simulated
   payment still creates the order, still queues the doctor, still moves
   every surface.
   ══════════════════════════════════════════════════════════════════════════ */

/* ── the states, with lanes for the graph ── */
export const LANES = ['trunk', 'known', 'resolve', 'merged', 'post'];

export const STATES = [
  { id: 'NEW', lane: 'trunk', t: 'New episode',
    enter: 'A goal was picked. An episode now exists.',
    exit: 'Intake begins.' },
  { id: 'INTAKE', lane: 'trunk', t: 'Intake active',
    enter: 'Episode open.',
    exit: 'All intake answers present and intent captured at the fork.' },

  { id: 'K1_SAFETY', lane: 'known', t: 'Safety screen',
    enter: 'Intent = KNOWN_SOLUTION.',
    exit: 'Wants, prior use and red flags answered. Any flag escalates.' },
  { id: 'K2_PLAN', lane: 'known', t: 'Plan recommended',
    enter: 'Safety screen clean. Monthly plan resolved from wants.',
    exit: 'Patient pays.' },
  { id: 'K4_REVIEW', lane: 'known', t: 'Doctor review',
    enter: 'Order paid. Episode in the Needs Signature queue.',
    exit: 'Doctor approves, or requests a call. Same day.' },
  { id: 'K4A_CALL', lane: 'known', t: 'Checkpoint call',
    enter: 'Doctor requested two minutes before confirming.',
    exit: 'Call complete and order approved.' },

  { id: 'D1_AI', lane: 'resolve', t: 'AI summary',
    enter: 'Intent = NEED_DIAGNOSIS (chosen or escalated).',
    exit: 'Three investigation areas written and on the clinician dashboard.' },
  { id: 'D2_CONSULT', lane: 'resolve', t: 'Consult live',
    enter: 'Intake + AI summary visible to the clinician before the call.',
    exit: 'Transcript uploaded and assessment written.' },
  { id: 'D3_RECOMMENDED', lane: 'resolve', t: 'Care recommended',
    enter: 'Assessment exists. Programme linked.',
    exit: 'Patient opens the plan.' },
  { id: 'D4_PAYMENT', lane: 'resolve', t: 'Payment pending',
    enter: 'Plan open, order created.',
    exit: 'Patient pays. Payment buys the loop, and the loop starts with blood.' },
  { id: 'D5_LABS', lane: 'resolve', t: 'Labs pending',
    enter: 'Order paid. Panel ordered, nurse to book.',
    exit: 'Sample collected and results uploaded by the lab.' },
  { id: 'D6_REVIEW', lane: 'resolve', t: 'Doctor review',
    enter: 'Results in. Episode in the Needs Review queue.',
    exit: 'Results reviewed with the patient, prescription signed, plan activated.' },

  { id: 'M1_FULFILMENT', lane: 'merged', t: 'Fulfilment',
    enter: 'A signed order or a signed prescription.',
    exit: 'Dispensed, shipped, delivered. Nurse stays for the first dose.' },
  { id: 'M2_TREATMENT', lane: 'merged', t: 'Treatment active',
    enter: 'Day 1 taken. Retest already scheduled for course end.',
    exit: 'The course completes. Interior weeks are events, not states.' },

  { id: 'P1_RETEST', lane: 'post', t: 'Retest due',
    enter: 'Course complete. The held retest date arrives.',
    exit: 'Retest sample collected.' },
  { id: 'P2_RESULTS', lane: 'post', t: 'Results in',
    enter: 'Retest uploaded. Results reach the doctor first.',
    exit: 'The doctor publishes the verdict.' },
  { id: 'P3_PROOF', lane: 'post', t: 'Proof delivered',
    enter: 'Before and after, in his own numbers.',
    exit: 'The next question opens from his data.' },
  { id: 'P4_LOOP', lane: 'post', t: 'Next loop',
    enter: 'Episode N+1 seeded at NEW with a held date.',
    exit: 'The machine hands over. It never ends.' },
];

export const stateOf = (id) => STATES.find((s) => s.id === id);

/* ── the projection: prototype state → machine state ──
   Reads exactly the fields the phone renders from, so it cannot drift. */
const FUNNEL_FLOWS = ['between', 'coach', 'assess', 'meet', 'consultation'];

function runState(r, pKey, ui) {
  switch (r.status) {
    case 'consulted':
      return (ui.flow === 'buy' && ui.detail === pKey) ? 'D4_PAYMENT' : 'D3_RECOMMENDED';
    case 'programme':
      if (r.door === 'known') return r.checkpoint === 'call' ? 'K4A_CALL' : 'K4_REVIEW';
      return 'D5_LABS';
    case 'bloodsBooked':
    case 'bloodsDone': return 'D5_LABS';
    case 'followup': return (r.labs === 'ready') ? 'D6_REVIEW' : 'D5_LABS';
    case 'ready': return 'D6_REVIEW';
    case 'shipping': return 'M1_FULFILMENT';
    case 'running': return 'M2_TREATMENT';
    case 'verdict': return 'P1_RETEST';
    case 'reviewing': return 'P2_RESULTS';
    case 'done': return r.loopOpened ? 'P4_LOOP' : 'P3_PROOF';
    default: return 'NEW';
  }
}

const goalOf = (cat) => GOALS.find((g) => g.k === cat) || null;

export function episodesOf(st, ui) {
  const eps = [];

  /* The in-funnel episode: real from the greeting until a run exists. */
  const inFunnel = FUNNEL_FLOWS.includes(ui.flow) && !ui.ckCall;
  const knownBuy = ui.flow === 'buy' && !(st.runs[ui.detail]);
  if (inFunnel || knownBuy) {
    const intent = doorOf(st.qa);
    const cat = st.qa.goal || null;
    const state = ui.flow === 'between' ? 'NEW'
      : ui.flow === 'coach' ? 'INTAKE'
        : ui.flow === 'assess' ? 'D1_AI'
          : (ui.flow === 'meet' || ui.flow === 'consultation') ? 'D2_CONSULT'
            : 'K2_PLAN';
    eps.push({
      id: 'funnel', pKey: null, cat,
      goal: goalOf(cat) ? goalOf(cat).t : 'New patient',
      intent: state === 'NEW' || state === 'INTAKE' ? null : intent,
      escalated: !!st.qa.escalated,
      state,
      wants: st.qa.wants || null,
    });
  }

  Object.keys(st.runs).forEach((pKey) => {
    const r = st.runs[pKey];
    const c = coachOf(pKey);
    eps.push({
      id: pKey, pKey, cat: PROTOCOLS[pKey] ? PROTOCOLS[pKey].cat : null,
      goal: PROTOCOLS[pKey] ? PROTOCOLS[pKey].t : pKey,
      intent: r.door === 'known' ? 'known' : 'resolve',
      escalated: false,
      state: runState(r, pKey, ui),
      wants: r.door === 'known' ? (st.qa.wantsPkey === pKey ? st.qa.wants : null) : null,
      clinician: c ? c.short : null,
      run: r,
    });
  });

  return eps;
}

/* ── SIM intake defaults: the one funnel step the machine autofills.
   The chat is the patient's own words; everything after it is drivable. */
export function simIntake(goalKey, intent, escalate) {
  const g = goalOf(goalKey) || GOALS[0];
  const base = {
    goal: g.k, goal_label: g.say || g.t,
    sub: g.sub[0], sub_label: g.sub[0],
    sex: 'Male', sex_label: 'Male',
    height: 175, height_label: '175 cm',
    weight: 82, weight_label: '82 kg',
    door: intent, door_label: intent === 'known' ? 'I know what I want' : 'I’m not sure what’s right for me',
    escalated: false, escAt: null,
    wants: null, wantsPkey: null, wantsShort: null,
  };
  if (intent === 'known') {
    const w = { fat: { t: 'GLP-1 weekly injection', short: 'GLP-1', pKey: 'P_WEIGHT' },
                test: { t: 'Testosterone support', short: 'Testosterone', pKey: 'P_TEST' } }[g.k]
            || { t: 'A full body checkup', short: 'Checkup', pKey: leadFor(g.k) };
    Object.assign(base, {
      wants: w.t, wants_label: w.t, wantsShort: w.short, wantsPkey: w.pKey,
      prior: 'Never', prior_label: 'Never',
      flags: escalate ? 'Escalating answer' : 'None of these',
      flags_label: escalate ? 'Escalating answer' : 'None of these',
      escalated: !!escalate, escAt: escalate ? 'flags' : null,
    });
  }
  return base;
}

/* ── the transitions: event, actors, guards, effects ──
   `from` is where the lever lives on the graph. `guard` is the entry/exit
   condition, checked live. `reason` is the same condition in plain words,
   shown under a disabled lever. `fire` is the ONLY code that moves state,
   and it reuses the exact actions the phone already dispatches. */
export const TRANSITIONS = [
  { event: 'EPISODE_CREATED', actor: 'system', from: null, to: 'NEW', sim: false,
    writes: 'Episode row',
    reason: 'An episode is already open on the phone',
    guard: (st, ui) => ['home', 'app'].includes(ui.flow),
    fire: (ctx) => { ctx.setFlow('between'); } },

  { event: 'INTENT_CHOSEN · KNOWN', actor: 'patient', from: 'INTAKE', to: 'K2_PLAN', sim: true,
    writes: 'intake_answers, safety_screen, episode.intent, episode.wants',
    reason: 'The funnel is not at intake',
    guard: (st, ui) => ['between', 'coach'].includes(ui.flow),
    fire: (ctx) => ctx.completeIntake(simIntake(ctx.simGoal(), 'known', false)) },

  { event: 'INTENT_CHOSEN · DIAGNOSIS', actor: 'patient', from: 'INTAKE', to: 'D1_AI', sim: true,
    writes: 'intake_answers, episode.intent, ai_summary',
    reason: 'The funnel is not at intake',
    guard: (st, ui) => ['between', 'coach'].includes(ui.flow),
    fire: (ctx) => ctx.completeIntake(simIntake(ctx.simGoal(), 'resolve', false)) },

  { event: 'ESCALATION_RAISED', actor: 'ai', from: 'K1_SAFETY', to: 'D1_AI', sim: true,
    writes: 'safety_screen (flagged), episode.escalated, intent rewritten',
    reason: 'Escalation happens during a known-solution intake',
    guard: (st, ui) => ['between', 'coach'].includes(ui.flow),
    fire: (ctx) => ctx.completeIntake(simIntake(ctx.simGoal(), 'known', true)) },

  { event: 'CONSULT_JOINED', actor: 'patient', from: 'D1_AI', to: 'D2_CONSULT', sim: false,
    writes: 'consult session',
    reason: 'The patient is not at the AI summary',
    guard: (st, ui) => ['assess', 'meet'].includes(ui.flow),
    fire: (ctx) => ctx.joinConsult() },

  { event: 'CONSULT_COMPLETED', actor: 'clinician', from: 'D2_CONSULT', to: 'D3_RECOMMENDED', sim: true,
    writes: 'transcript, soap_note, assessment, recommendation',
    reason: 'No consultation is live',
    guard: (st, ui) => ui.flow === 'consultation' && !ui.ckCall,
    fire: (ctx) => ctx.endConsult() },

  { event: 'PLAN_OPENED', actor: 'patient', from: 'D3_RECOMMENDED', to: 'D4_PAYMENT', sim: false,
    writes: 'nothing (navigation)',
    reason: 'No recommendation is waiting',
    guard: (st, ui, ep) => !!ep && ep.state === 'D3_RECOMMENDED',
    fire: (ctx, ep) => ctx.openPlan(ep.pKey) },

  { event: 'PAYMENT_COMPLETED', actor: 'patient', from: null, to: null, sim: true,
    fromAny: ['K2_PLAN', 'D4_PAYMENT'],
    writes: 'Order PAID',
    reason: 'No plan is open to pay for',
    guard: (st, ui) => ui.flow === 'buy',
    fire: (ctx) => ctx.completePayment() },

  { event: 'ORDER_APPROVED', actor: 'clinician', from: 'K4_REVIEW', to: 'M1_FULFILMENT', sim: false,
    writes: 'review_note, signature; fulfilment begins',
    reason: 'No paid order is waiting for signature',
    guard: (st, ui, ep) => !!ep && ep.state === 'K4_REVIEW',
    fire: (ctx, ep) => ctx.approveOrder(ep.pKey) },

  { event: 'CALL_REQUESTED', actor: 'clinician', from: 'K4_REVIEW', to: 'K4A_CALL', sim: false,
    writes: 'review_note (call requested)',
    reason: 'No paid order is waiting for signature',
    guard: (st, ui, ep) => !!ep && ep.state === 'K4_REVIEW',
    fire: (ctx, ep) => ctx.requestCall(ep.pKey) },

  { event: 'CALL_STARTED', actor: 'patient', from: 'K4A_CALL', to: 'K4A_CALL', sim: false,
    writes: 'consult session',
    reason: 'The doctor has not asked for a call',
    guard: (st, ui, ep) => !!ep && ep.state === 'K4A_CALL' && ui.flow !== 'consultation',
    fire: (ctx, ep) => ctx.startCheckpointCall(ep.pKey) },

  { event: 'CALL_COMPLETED · APPROVED', actor: 'clinician', from: 'K4A_CALL', to: 'M1_FULFILMENT', sim: true,
    writes: 'transcript, soap_note, signature; fulfilment begins',
    reason: 'No checkpoint call is open',
    guard: (st, ui, ep) => !!ep && ep.state === 'K4A_CALL',
    fire: (ctx, ep) => ctx.approveAfterCall(ep.pKey) },

  { event: 'NURSE_BOOKED', actor: 'patient', from: 'D5_LABS', to: 'D5_LABS', sim: true,
    writes: 'lab_order, nurse slot',
    reason: 'Labs are not waiting to be booked',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'programme' && ep.run.door !== 'known',
    fire: (ctx, ep) => ctx.dispatch({ type: 'bookBloods', protocol: ep.pKey, slot: 'Tomorrow 7:30 am' }) },

  { event: 'SAMPLE_COLLECTED', actor: 'nurse', from: 'D5_LABS', to: 'D5_LABS', sim: true,
    writes: 'sample record',
    reason: 'No nurse visit is booked',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'bloodsBooked',
    fire: (ctx, ep) => ctx.dispatch({ type: 'bloodsDone', protocol: ep.pKey }) },

  { event: 'FOLLOWUP_BOOKED', actor: 'patient', from: 'D5_LABS', to: 'D5_LABS', sim: true,
    writes: 'follow-up slot',
    reason: 'The sample has not been collected',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'bloodsDone',
    fire: (ctx, ep) => ctx.dispatch({ type: 'bookFollow', protocol: ep.pKey, slot: 'Thu 6:00 pm' }) },

  { event: 'LABS_UPLOADED', actor: 'lab', from: 'D5_LABS', to: 'D6_REVIEW', sim: true,
    writes: 'lab_result',
    reason: 'No sample is at the lab',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'followup' && ep.run.labs !== 'ready',
    fire: (ctx, ep) => ctx.dispatch({ type: 'labsReady', protocol: ep.pKey }) },

  { event: 'PRESCRIPTION_SIGNED', actor: 'clinician', from: 'D6_REVIEW', to: 'D6_REVIEW', sim: false,
    writes: 'prescription; plan ready',
    reason: 'Results are not in front of the doctor',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'followup' && ep.run.labs === 'ready',
    fire: (ctx, ep) => ctx.dispatch({ type: 'reviewed', protocol: ep.pKey }) },

  { event: 'PLAN_ACTIVATED', actor: 'patient', from: 'D6_REVIEW', to: 'M1_FULFILMENT', sim: false,
    writes: 'fulfilment begins',
    reason: 'No signed plan is waiting',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'ready',
    fire: (ctx, ep) => ctx.dispatch({ type: 'activate', protocol: ep.pKey }) },

  { event: 'MEDICATION_DISPENSED', actor: 'pharmacy', from: 'M1_FULFILMENT', to: 'M1_FULFILMENT', sim: true,
    writes: 'shipment: preparing',
    reason: 'Nothing is with the pharmacy',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'shipping' && (ep.run.ship || 'confirmed') === 'confirmed',
    fire: (ctx, ep) => ctx.dispatch({ type: 'ship', protocol: ep.pKey, stage: 'preparing' }) },

  { event: 'SHIPMENT_OUT', actor: 'pharmacy', from: 'M1_FULFILMENT', to: 'M1_FULFILMENT', sim: true,
    writes: 'shipment: out for delivery',
    reason: 'Nothing is packed',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'shipping' && ep.run.ship === 'preparing',
    fire: (ctx, ep) => ctx.dispatch({ type: 'ship', protocol: ep.pKey, stage: 'out' }) },

  { event: 'DELIVERY_CONFIRMED', actor: 'nurse', from: 'M1_FULFILMENT', to: 'M1_FULFILMENT', sim: true,
    writes: 'delivery record',
    reason: 'Nothing is out for delivery',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'shipping' && ep.run.ship === 'out',
    fire: (ctx, ep) => ctx.dispatch({ type: 'ship', protocol: ep.pKey, stage: 'delivered' }) },

  { event: 'TREATMENT_STARTED', actor: 'patient', from: 'M1_FULFILMENT', to: 'M2_TREATMENT', sim: false,
    writes: 'day 1; retest scheduled for course end',
    reason: 'The medication has not been delivered',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'shipping' && ep.run.ship === 'delivered',
    fire: (ctx, ep) => ctx.dispatch({ type: 'deliver', protocol: ep.pKey }) },

  { event: 'WEEK_ADVANCED', actor: 'system', from: 'M2_TREATMENT', to: 'M2_TREATMENT', sim: true,
    writes: 'adherence_log (a week of doses)',
    reason: 'Treatment is not running',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'running',
    fire: (ctx, ep) => ctx.dispatch({ type: 'advance', protocol: ep.pKey }) },

  { event: 'RETEST_BOOKED', actor: 'patient', from: 'P1_RETEST', to: 'P2_RESULTS', sim: true,
    writes: 'lab_order (retest), review slot',
    reason: 'The course has not completed',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'verdict',
    fire: (ctx, ep) => ctx.dispatch({ type: 'bookReview', protocol: ep.pKey, slot: 'Sat 9:00 am' }) },

  { event: 'VERDICT_PUBLISHED', actor: 'clinician', from: 'P2_RESULTS', to: 'P3_PROOF', sim: false,
    writes: 'verdict (the one-sentence read)',
    reason: 'The retest is not in review',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'reviewing',
    fire: (ctx, ep) => ctx.dispatch({ type: 'results', protocol: ep.pKey }) },

  { event: 'LOOP_OPENED', actor: 'system', from: 'P3_PROOF', to: 'P4_LOOP', sim: false,
    writes: 'Episode N+1 seeded at NEW, held date attached',
    reason: 'No verdict has been delivered',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'done' && !ep.run.loopOpened,
    fire: (ctx, ep) => ctx.dispatch({ type: 'loopOpened', protocol: ep.pKey }) },
];

/* Which transitions may fire right now, for one episode (or the funnel). */
export function allowedEvents(st, ui, ep) {
  return TRANSITIONS.filter((t) => {
    try { return t.guard(st, ui, ep); } catch { return false; }
  });
}

export const canFire = (t, st, ui, ep) => {
  try { return t.guard(st, ui, ep); } catch { return false; }
};

/* ── the clinician's machine: queues are filters, nothing else ── */
export const QUEUES = [
  { id: 'sign', t: 'Needs signature',
    has: (ep) => ep.state === 'K4_REVIEW',
    events: ['ORDER_APPROVED', 'CALL_REQUESTED'] },
  { id: 'review', t: 'Needs review',
    has: (ep) => (ep.state === 'D6_REVIEW' && ep.run && ep.run.status === 'followup')
              || ep.state === 'P2_RESULTS',
    events: ['PRESCRIPTION_SIGNED', 'VERDICT_PUBLISHED'] },
  { id: 'labs', t: 'Waiting labs',
    has: (ep) => ep.state === 'D5_LABS' || ep.state === 'P1_RETEST',
    events: [] },
  { id: 'patient', t: 'Waiting patient',
    has: (ep) => ['D3_RECOMMENDED', 'D4_PAYMENT', 'K2_PLAN', 'K4A_CALL', 'M1_FULFILMENT'].includes(ep.state)
              || (ep.state === 'D6_REVIEW' && ep.run && ep.run.status === 'ready'),
    events: [] },
  { id: 'followup', t: 'Follow-up due',
    has: (ep) => ep.state === 'M2_TREATMENT',
    events: [] },
  { id: 'done', t: 'Completed',
    has: (ep) => ['P3_PROOF', 'P4_LOOP'].includes(ep.state),
    events: ['LOOP_OPENED'] },
];

export function queueOf(ep) {
  const q = QUEUES.find((x) => x.has(ep));
  return q ? q.id : null;
}

/* What the clinician can actually do to an episode right now. */
export function clinicianActions(st, ui, ep) {
  return TRANSITIONS.filter((t) => t.actor === 'clinician' && canFire(t, st, ui, ep));
}

/* Displayed under an episode with no clinician action: whose move it is. */
export function whoseMove(ep) {
  const map = {
    NEW: 'the patient', INTAKE: 'the patient',
    K1_SAFETY: 'the patient', K2_PLAN: 'the patient',
    K4_REVIEW: 'the clinician', K4A_CALL: 'the patient',
    D1_AI: 'the patient', D2_CONSULT: 'the clinician',
    D3_RECOMMENDED: 'the patient', D4_PAYMENT: 'the patient',
    D5_LABS: 'the lab and the nurse', D6_REVIEW: 'the clinician',
    M1_FULFILMENT: 'the pharmacy', M2_TREATMENT: 'the patient',
    P1_RETEST: 'the patient', P2_RESULTS: 'the clinician',
    P3_PROOF: 'the system', P4_LOOP: 'nobody, it is done',
  };
  return map[ep.state] || 'the system';
}

/* Names for the ticker and lever chips. */
export const ACTORS = {
  patient: { t: 'Patient', tone: '#408FA4' },
  ai: { t: 'AI', tone: '#7A4B6E' },
  clinician: { t: 'Clinician', tone: '#E0A400' },
  nurse: { t: 'Nurse', tone: '#27995B' },
  lab: { t: 'Lab', tone: '#2E6B5E' },
  pharmacy: { t: 'Pharmacy', tone: '#8A5A2B' },
  system: { t: 'System', tone: '#5E6E82' },
};

/* A short human line for an episode card. */
export function stateLine(ep) {
  const s = stateOf(ep.state);
  return s ? s.t : ep.state;
}

export { statusOf, givenNameOf };
