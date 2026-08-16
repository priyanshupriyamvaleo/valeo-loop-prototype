import { GLP_PKEY } from './data';

/* ══════════════════════════════════════════════════════════════════════════
   THE MACHINE — MVP: weight loss, known intent, one plan.

   Eight states. The doctor appears in exactly two of them, and in both his
   only verb is eligibility: yes or no. The plan is fixed and owned by the
   category manager; nothing in this file prices or describes it.

   The flow table on the right of the phone renders these `enter`/`exit`
   strings verbatim, so the table can never disagree with the product.
   ══════════════════════════════════════════════════════════════════════════ */

export const STATES = [
  { id: 'NEW', t: 'Start',
    enter: 'The patient opens weight loss. An episode exists.',
    exit: 'Intake begins.' },
  { id: 'INTAKE', t: 'Intake & safety',
    enter: 'Six questions: what you want, sex, height, weight, prior use, red flags.',
    exit: 'Clean answers go to the plan. Any flag goes to a doctor first.' },
  { id: 'FLAGGED_CALL', t: 'Eligibility call',
    enter: 'A safety answer needs a doctor. Ten minutes, included, before any payment.',
    exit: 'The doctor confirms eligibility: yes or no. The plan itself never changes.' },
  { id: 'PLAN_VIEW', t: 'The plan',
    enter: 'One plan, rendered from the category manager’s config. Medication included.',
    exit: 'Patient pays: monthly, or 3 months in one payment. Full refund if declined.' },
  { id: 'REVIEW', t: 'Doctor review',
    enter: 'Paid. The order is in the doctor’s queue, same day. Nothing ships unsigned.',
    exit: 'Approved: dispatch begins. Declined: full refund, said plainly.' },
  { id: 'NOT_ELIGIBLE', t: 'Not eligible',
    enter: 'The doctor said no.',
    exit: 'Refund issued in full. The episode closes.' },
  { id: 'FULFILMENT', t: 'Delivery',
    enter: 'A signed order with the pharmacy.',
    exit: 'Dispensed, shipped, delivered in cold chain. Nurse stays for the first dose.' },
  { id: 'TREATMENT', t: 'Treatment',
    enter: 'First dose taken. The monthly cycle begins.',
    exit: 'Each month: a doctor check-in, the dose reviewed, the next delivery.' },
];

export const stateOf = (id) => STATES.find((s) => s.id === id);

/* ── the projection: prototype state → machine state ── */
function runState(r) {
  switch (r.status) {
    case 'programme':
      if (r.checkpoint === 'declined') return 'NOT_ELIGIBLE';
      return 'REVIEW';
    case 'shipping': return 'FULFILMENT';
    default: return 'TREATMENT';   /* running and beyond */
  }
}

export function episodesOf(st, ui) {
  const eps = [];
  const inFunnel = ['coach', 'consultation', 'plan'].includes(ui.flow);
  if (inFunnel && !st.runs[GLP_PKEY]) {
    eps.push({
      id: 'funnel', pKey: null, goal: 'Weight Loss',
      flagged: !!st.qa.flagged,
      state: ui.flow === 'coach' ? 'INTAKE'
        : ui.flow === 'consultation' ? 'FLAGGED_CALL'
          : 'PLAN_VIEW',
    });
  }
  Object.keys(st.runs).forEach((pKey) => {
    const r = st.runs[pKey];
    eps.push({ id: pKey, pKey, goal: 'Weight Loss', state: runState(r), run: r });
  });
  return eps;
}

/* SIM intake answers, for driving the funnel from the table. */
export function simIntake(flagged) {
  return {
    goal: 'fat', goal_label: 'Lose weight',
    wants: 'GLP-1 weekly injection', wants_label: 'GLP-1 weekly injection',
    sex: 'Male', sex_label: 'Male',
    height: 175, height_label: '175 cm',
    weight: 96, weight_label: '96 kg',
    prior: 'Never', prior_label: 'Never',
    flags: flagged ? 'History of pancreatitis' : 'None of these',
    flags_label: flagged ? 'History of pancreatitis' : 'None of these',
    flagged: !!flagged, eligible: false,
  };
}

/* ── the transitions: guards, plain-word reasons, effects ── */
export const TRANSITIONS = [
  { event: 'EPISODE_CREATED', actor: 'system', from: null, to: 'NEW', sim: false,
    writes: 'Episode row',
    reason: 'An episode is already open',
    guard: (st, ui) => ['home', 'app'].includes(ui.flow) && !st.runs[GLP_PKEY],
    fire: (ctx) => ctx.startIntake() },

  { event: 'INTAKE_SUBMITTED · CLEAN', actor: 'patient', from: 'INTAKE', to: 'PLAN_VIEW', sim: true,
    writes: 'intake_answers, safety_screen (clean)',
    reason: 'The intake chat is not open',
    guard: (st, ui) => ui.flow === 'coach',
    fire: (ctx) => ctx.completeIntake(simIntake(false)) },

  { event: 'INTAKE_SUBMITTED · FLAGGED', actor: 'patient', from: 'INTAKE', to: 'FLAGGED_CALL', sim: true,
    writes: 'intake_answers, safety_screen (flagged)',
    reason: 'The intake chat is not open',
    guard: (st, ui) => ui.flow === 'coach',
    fire: (ctx) => ctx.completeIntake(simIntake(true)) },

  { event: 'ELIGIBILITY_CONFIRMED', actor: 'clinician', from: 'FLAGGED_CALL', to: 'PLAN_VIEW', sim: true,
    writes: 'eligibility note: yes',
    reason: 'No eligibility call is open',
    guard: (st, ui) => ui.flow === 'consultation',
    fire: (ctx) => ctx.confirmEligible() },

  { event: 'PLAN_PAID', actor: 'patient', from: 'PLAN_VIEW', to: 'REVIEW', sim: true,
    writes: 'Order PAID (monthly). Straight to dispatch if already confirmed eligible.',
    reason: 'The plan is not open',
    guard: (st, ui) => ui.flow === 'plan',
    fire: (ctx) => ctx.payPlan('monthly') },

  { event: 'ORDER_APPROVED', actor: 'clinician', from: 'REVIEW', to: 'FULFILMENT', sim: false,
    writes: 'signature; dispatch begins',
    reason: 'No paid order is waiting for review',
    guard: (st, ui, ep) => !!ep && ep.state === 'REVIEW',
    fire: (ctx, ep) => ctx.approveOrder(ep.pKey) },

  { event: 'ORDER_DECLINED', actor: 'clinician', from: 'REVIEW', to: 'NOT_ELIGIBLE', sim: false,
    writes: 'eligibility note: no; refund issued in full',
    reason: 'No paid order is waiting for review',
    guard: (st, ui, ep) => !!ep && ep.state === 'REVIEW',
    fire: (ctx, ep) => ctx.declineOrder(ep.pKey) },

  { event: 'MEDICATION_DISPENSED', actor: 'pharmacy', from: 'FULFILMENT', to: 'FULFILMENT', sim: true,
    writes: 'shipment: preparing',
    reason: 'Nothing is with the pharmacy',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'shipping' && (ep.run.ship || 'confirmed') === 'confirmed',
    fire: (ctx, ep) => ctx.dispatch({ type: 'ship', protocol: ep.pKey, stage: 'preparing' }) },

  { event: 'SHIPMENT_OUT', actor: 'pharmacy', from: 'FULFILMENT', to: 'FULFILMENT', sim: true,
    writes: 'shipment: out for delivery',
    reason: 'Nothing is packed',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'shipping' && ep.run.ship === 'preparing',
    fire: (ctx, ep) => ctx.dispatch({ type: 'ship', protocol: ep.pKey, stage: 'out' }) },

  { event: 'DELIVERY_CONFIRMED', actor: 'nurse', from: 'FULFILMENT', to: 'FULFILMENT', sim: true,
    writes: 'delivery record; nurse stays for the first dose',
    reason: 'Nothing is out for delivery',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'shipping' && ep.run.ship === 'out',
    fire: (ctx, ep) => ctx.dispatch({ type: 'ship', protocol: ep.pKey, stage: 'delivered' }) },

  { event: 'TREATMENT_STARTED', actor: 'patient', from: 'FULFILMENT', to: 'TREATMENT', sim: false,
    writes: 'day 1 of the monthly cycle',
    reason: 'The medication has not been delivered',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'shipping' && ep.run.ship === 'delivered',
    fire: (ctx, ep) => ctx.dispatch({ type: 'deliver', protocol: ep.pKey }) },

  { event: 'WEEK_ADVANCED', actor: 'system', from: 'TREATMENT', to: 'TREATMENT', sim: true,
    writes: 'adherence_log (a week of doses)',
    reason: 'Treatment is not running',
    guard: (st, ui, ep) => !!ep && ep.run && ep.run.status === 'running',
    fire: (ctx, ep) => ctx.dispatch({ type: 'advance', protocol: ep.pKey }) },
];

export function allowedEvents(st, ui, ep) {
  return TRANSITIONS.filter((t) => {
    try { return t.guard(st, ui, ep); } catch { return false; }
  });
}
export const canFire = (t, st, ui, ep) => {
  try { return t.guard(st, ui, ep); } catch { return false; }
};
