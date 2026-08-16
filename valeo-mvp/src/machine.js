import { GLP_PKEY } from './data';

/* ══════════════════════════════════════════════════════════════════════════
   THE CONTROLS — the moves that are not the patient's.

   This file is not a model of the product. It is the remote control for the
   demo: the handful of things a clinician, a pharmacy, a nurse or the clock
   would do off-screen, so the prototype can be driven all the way through
   without waiting a month for week four to arrive.

   Everything the patient does happens on the phone. Nothing here describes
   the flow; the protocol in the admin panel does that.
   ══════════════════════════════════════════════════════════════════════════ */

/* The run the controls act on: the focused one, or the only one. */
export function target(st) {
  const keys = Object.keys(st.runs || {});
  const pKey = st.focus && st.runs[st.focus] ? st.focus : keys[0] || null;
  return pKey ? { pKey, run: st.runs[pKey] } : { pKey: null, run: null };
}

/* SIM intake answers, for driving the funnel from the panel. Same shape the
   chat produces. */
export function simIntake(flagged) {
  return {
    sex: 'Male', age: 34, height: 175, weight: 96,
    why: ['Improve my health', 'More energy'],
    wants: 'GLP-1 weekly injections',
    prior: 'Never',
    conditions: flagged ? ['History of pancreatitis'] : ['None of these'],
    meds: 'None',
    flagged: !!flagged, eligible: false,
    reasons: flagged ? ['a safety answer'] : [],
  };
}

/* ── the moves, grouped by who makes them ── */
export const TRANSITIONS = [
  { event: 'SKIP INTAKE · CLEAN', actor: 'patient', group: 'Funnel',
    hint: 'Fills the questionnaire with clean answers and opens the plan',
    reason: 'The intake is not open',
    guard: (st, ui) => ['between', 'coach'].includes(ui.flow),
    fire: (ctx) => ctx.completeIntake(simIntake(false)) },

  { event: 'SKIP INTAKE · FLAGGED', actor: 'patient', group: 'Funnel',
    hint: 'Fills it with an answer that needs a clinician, and goes to booking',
    reason: 'The intake is not open',
    guard: (st, ui) => ['between', 'coach'].includes(ui.flow),
    fire: (ctx) => ctx.completeIntake(simIntake(true)) },

  { event: 'OPEN THE CONSULT LINK', actor: 'system', group: 'Funnel',
    hint: 'Normally opens ten minutes before the slot',
    reason: 'No consultation is booked',
    guard: (st, ui) => !!(st.qa && st.qa.slotAt) && !st.qa.eligible && ui.flow === 'app',
    fire: (ctx) => ctx.openConsult() },

  { event: 'CLINICIAN SAYS YES', actor: 'clinician', group: 'Funnel',
    hint: 'Eligibility confirmed, the plan unlocks',
    reason: 'No eligibility call is open',
    guard: (st, ui) => ui.flow === 'consultation',
    fire: (ctx) => ctx.confirmEligible() },

  { event: 'CLINICIAN SAYS NO', actor: 'clinician', group: 'Funnel',
    hint: 'The no comes back in their words, with another goal offered',
    reason: 'No eligibility call is open',
    guard: (st, ui) => ui.flow === 'consultation',
    fire: (ctx) => ctx.declineEligibility() },

  { event: 'PAY THE PLAN', actor: 'patient', group: 'Funnel',
    hint: 'Subscribes to Wegovy, monthly',
    reason: 'The plan is not open',
    guard: (st, ui) => ui.flow === 'plan',
    fire: (ctx) => ctx.payPlan('monthly', { name: 'Wegovy' }) },

  { event: 'APPROVE THE ORDER', actor: 'clinician', group: 'Order',
    hint: 'Signs the prescription, dispatch begins',
    reason: 'No paid order is waiting for review',
    guard: (st, ui, ep) => !!ep.run && ep.run.status === 'programme' && ep.run.checkpoint !== 'declined',
    fire: (ctx, ep) => ctx.approveOrder(ep.pKey) },

  { event: 'DECLINE THE ORDER', actor: 'clinician', group: 'Order',
    hint: 'Refuses it, and the payment is returned',
    reason: 'No paid order is waiting for review',
    guard: (st, ui, ep) => !!ep.run && ep.run.status === 'programme' && ep.run.checkpoint !== 'declined',
    fire: (ctx, ep) => ctx.declineOrder(ep.pKey) },

  { event: 'PHARMACY PACKS IT', actor: 'pharmacy', group: 'Delivery',
    hint: 'Dispensed and packed in cold chain',
    reason: 'Nothing is with the pharmacy',
    guard: (st, ui, ep) => !!ep.run && ep.run.status === 'shipping' && (ep.run.ship || 'confirmed') === 'confirmed',
    fire: (ctx, ep) => ctx.dispatch({ type: 'ship', protocol: ep.pKey, stage: 'preparing' }) },

  { event: 'OUT FOR DELIVERY', actor: 'pharmacy', group: 'Delivery',
    hint: 'On its way, with an arrival window',
    reason: 'Nothing is packed',
    guard: (st, ui, ep) => !!ep.run && ep.run.status === 'shipping' && ep.run.ship === 'preparing',
    fire: (ctx, ep) => ctx.dispatch({ type: 'ship', protocol: ep.pKey, stage: 'out' }) },

  { event: 'NURSE DELIVERS IT', actor: 'nurse', group: 'Delivery',
    hint: 'Handed over, and the first dose given on the 3-month plan',
    reason: 'Nothing is out for delivery',
    guard: (st, ui, ep) => !!ep.run && ep.run.status === 'shipping' && ep.run.ship === 'out',
    fire: (ctx, ep) => ctx.dispatch({ type: 'ship', protocol: ep.pKey, stage: 'delivered' }) },

  { event: 'START TREATMENT', actor: 'patient', group: 'Delivery',
    hint: 'First dose taken, day 1 of the cycle',
    reason: 'The medication has not been delivered',
    guard: (st, ui, ep) => !!ep.run && ep.run.status === 'shipping' && ep.run.ship === 'delivered',
    fire: (ctx, ep) => ctx.dispatch({ type: 'deliver', protocol: ep.pKey }) },

  { event: 'A WEEK PASSES', actor: 'clock', group: 'The cycle',
    hint: 'A week of doses logged. Week 3 raises the renewal, week 4 the dose review',
    reason: 'Treatment is not running',
    guard: (st, ui, ep) => !!ep.run && ep.run.status === 'running',
    fire: (ctx, ep) => ctx.dispatch({ type: 'advance', protocol: ep.pKey }) },

  { event: 'JUMP TO WEEK 4', actor: 'clock', group: 'The cycle',
    hint: 'Straight to the dose review',
    reason: 'Treatment is not running',
    guard: (st, ui, ep) => !!ep.run && ep.run.status === 'running' && (ep.run.day || 1) < 22,
    fire: (ctx, ep) => ctx.dispatch({ type: 'setDay', protocol: ep.pKey, day: 22 }) },

  { event: 'CLINICIAN SETS THE DOSE', actor: 'clinician', group: 'The cycle',
    hint: 'The dose review happens: the dose goes up, and the next order is raised at it',
    reason: 'No dose review is booked',
    guard: (st, ui, ep) => !!ep.run && !!ep.run.titrationSlot,
    fire: (ctx, ep) => ctx.dispatch({
      type: 'titration', protocol: ep.pKey, dose: '1 mg weekly' }) },

  { event: 'JUMP TO THE CYCLE END', actor: 'clock', group: 'The cycle',
    hint: 'The last week of the term, when renewal is due',
    reason: 'Treatment is not running',
    guard: (st, ui, ep) => !!ep.run && ep.run.status === 'running',
    fire: (ctx, ep) => ctx.dispatch({
      type: 'setDay', protocol: ep.pKey,
      day: (ep.run.duration === 'quarter' ? 12 : 4) * 7,
    }) },
];

export const GLP = GLP_PKEY;

export const canFire = (t, st, ui, ep) => {
  try { return t.guard(st, ui, ep); } catch { return false; }
};
