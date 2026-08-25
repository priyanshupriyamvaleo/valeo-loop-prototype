/*
 * THE SEED — Recover and Rebuild, as the spec wrote it.
 *
 * Every value here is lifted from the Recover and Rebuild document rather than
 * invented: the fourteen plan items with their offsets and blocking flags, the
 * listing copy, the panel, the prices, and the TB-500 gate. A prototype whose
 * numbers drift from the brief teaches the room the wrong thing.
 *
 * This seeds the Studio's DRAFT. Nothing here reaches the patient app until
 * somebody presses Publish, which is the whole point of the demo.
 *
 * PLACEHOLDER, like every clinical list in this project: panel composition and
 * gate class need Dr. Rayan before any external audience.
 */

/* ── the plan template ──
   `locked` items refuse deletion. From the Locked fields table: the baseline
   panel, the consultation and the Week 12 panel are the product promise and
   the clinical basis for dispensing, so the builder refuses rather than
   trusting review to catch it. */
export const RR_PLAN = [
  { id: 'p1',  t: 'Book nurse visit',        sub: 'Nothing else can start until this is done.',
    when: 'Day 0 to 3',  offset: 0,  actor: 'Patient', blocking: true,
    action: { kind: 'book', label: 'Book your nurse visit' },
    card: 'Book your nurse visit' },
  { id: 'p2',  t: 'Blood sample collected',  sub: 'Recovery & Inflammation Panel, baseline.',
    when: 'Week 1',      offset: 5,  actor: 'Nurse',   blocking: true, locked: true,
    lockWhy: 'Your protocol starts with testing, not a product. It is also the clinical basis for prescribing.',
    card: 'Nurse visiting Tuesday, 9am' },
  { id: 'p3',  t: 'Results ready',           sub: 'Automatic. No patient action.',
    when: 'Plus 3 days', offset: 8,  actor: 'Lab',
    card: 'Results in a few days' },
  { id: 'p4',  t: 'Doctor consultation',     sub: 'Injury and recovery assessment, results review, competition screening. Dispatch is blocked until this happens.',
    when: 'Week 1',      offset: 9,  actor: 'Patient books', blocking: true, locked: true,
    lockWhy: 'Dispensing depends on it. Removing it makes this a supplement sale.',
    action: { kind: 'book', label: 'Book your consultation' },
    card: 'Your results are ready' },
  { id: 'p5',  t: 'Supplement voucher issued', sub: 'Automatic. AED 150.',
    when: 'After consult', offset: 10, actor: 'System',
    card: 'Voucher issued' },
  { id: 'p6',  t: 'Month 1 dispatched',      sub: 'BPC-157 pen, cold chain.',
    when: 'After consult', offset: 11, actor: 'Ops', milestone: true,
    action: { kind: 'track', label: 'Track delivery' },
    card: 'Month 1 on the way' },
  { id: 'p7',  t: 'Concierge call 1',        sub: 'Care team.',
    when: 'Day 10',      offset: 10, actor: 'Care team',
    card: 'Week 2 of 12' },
  { id: 'p8',  t: 'Concierge call 2',        sub: 'Care team.',
    when: 'Day 25',      offset: 25, actor: 'Care team',
    card: 'Week 4 of 12' },
  { id: 'p9',  t: 'Mid-point doctor review', sub: 'Response reviewed, dosing adjusted, TB-500 assessed.',
    when: 'Week 6',      offset: 42, actor: 'Patient books', milestone: true,
    action: { kind: 'book', label: 'Book your Week 6 review' },
    card: 'Book your Week 6 review' },
  { id: 'p10', t: 'Month 2 dispatched',      sub: 'Ops.',
    when: 'Week 6',      offset: 43, actor: 'Ops', milestone: true,
    action: { kind: 'track', label: 'Track delivery' },
    card: 'Month 2 on the way' },
  { id: 'p11', t: 'Monthly concierge calls', sub: 'Care team. Recurring.',
    when: 'Day 55, 85',  offset: 55, actor: 'Care team',
    card: 'Week 8 of 12' },
  { id: 'p12', t: 'Month 3 dispatched',      sub: 'Ops.',
    when: 'Week 9',      offset: 63, actor: 'Ops', milestone: true,
    action: { kind: 'track', label: 'Track delivery' },
    card: 'Week 9 of 12' },
  { id: 'p13', t: 'Repeat blood panel',      sub: 'Same panel as baseline.',
    when: 'Week 12',     offset: 84, actor: 'Patient books nurse', blocking: true, locked: true,
    lockWhy: 'Promised on the page, and it is the renewal conversation.',
    action: { kind: 'book', label: 'Book your Week 12 test' },
    card: 'Book your Week 12 test' },
  { id: 'p14', t: 'Physician reassessment',  sub: 'Produces the maintenance plan and the renewal decision.',
    when: 'Week 12',     offset: 86, actor: 'Patient books', milestone: true,
    action: { kind: 'book', label: 'Book your reassessment' },
    card: 'Book your reassessment' },
];

/* ── the triage chat ──
   Starts as a DRAFT with two questions so the builder is not an empty page.
   The demo authors the rest. No gating: every Recover and Rebuild patient
   reaches the same next step whatever they answer. */
export const RR_TRIAGE = {
  intro: 'A few questions before we show you the protocol. Nothing here changes the price.',
  questions: [
    { id: 'q1', q: 'What are you dealing with?', kind: 'multi',
      options: ['Joint or tendon pain', 'Slow recovery between sessions',
                'An old injury that never resolved', 'Lingering soreness',
                'Gut discomfort', 'Reduced capacity'] },
    { id: 'q2', q: 'How long has it been going on?', kind: 'choice',
      options: ['Under a month', 'One to six months', 'Over six months', 'Years'] },
  ],
};

/* ── THE ONBOARDING CHAT ──
   Goal-agnostic on purpose: this is the conversation that DECIDES the goal, so
   it cannot live inside one. Three questions to work out what somebody is
   actually here for, then the four facts a doctor needs before anything is
   prescribed, then the goal itself.

   `routes` only produces a RECOMMENDATION. The patient can still pick any goal,
   because a chat that quietly forces a route is a router pretending to be a
   conversation. */
export const ONBOARDING = {
  intro: 'Two minutes. These answers pick the right protocol and give the doctor somewhere to start.',
  questions: [
    { id: 'o1', q: 'What made you open this today?', kind: 'choice',
      options: ['Something hurts, or will not heal', 'The weight is not moving',
                'Hair, skin, or both', 'I want to get ahead of it'] },
    { id: 'o2', q: 'How long has that been true?', kind: 'choice',
      options: ['Weeks', 'Months', 'A year or more'] },
    { id: 'o3', q: 'What have you already tried?', kind: 'multi',
      options: ['Nothing yet', 'Rest and time', 'Physio or a change in training',
                'Supplements', 'Prescription medicine', 'A doctor, with no clear answer'] },
  ],
  profile: {
    t: 'About you',
    sub: 'The doctor needs these before anything is prescribed. None of it changes the price.',
    fields: [
      { id: 'age',    t: 'Age',           kind: 'number', suffix: 'years' },
      { id: 'sex',    t: 'Sex at birth',  kind: 'choice', options: ['Female', 'Male'] },
      { id: 'height', t: 'Height',        kind: 'number', suffix: 'cm' },
      { id: 'weight', t: 'Weight',        kind: 'number', suffix: 'kg' },
    ],
  },
  goalStep: {
    t: 'Choose your goal',
    sub: 'Suggested from your answers. Pick a different one if it does not fit.',
  },
  routes: [
    { when: 'Something hurts, or will not heal', goal: 'recover-rebuild' },
    { when: 'The weight is not moving',          goal: 'weight-loss' },
    { when: 'Hair, skin, or both',               goal: 'skin-hair' },
    { when: 'I want to get ahead of it',         goal: 'recover-rebuild' },
  ],
};

/* Which goal the answers point at. Falls through to nothing rather than to a
   default, so an unmapped answer shows the picker with no suggestion instead of
   a confidently wrong one. */
export const suggestGoal = (cfg, answers) => {
  const first = [].concat(answers?.o1 || [])[0];
  const hit = (cfg?.routes || []).find((r) => r.when === first);
  return hit ? hit.goal : null;
};

/* ── the pre-purchase flow ── */
export const RR_PREPURCHASE = {
  pdp: {
    title: 'Valeo Recovery & Repair Peptide Protocol',
    hero: 'A 12-week programme combining at-home blood testing, doctor-guided BPC-157 '
        + 'peptide therapy, unlimited consultations and a 150 AED supplement voucher '
        + 'into one structured recovery protocol.',
    twelveWeek: 'Recovery is measured over twelve weeks, not one. Your panel is repeated '
              + 'at Week 12 and read against your baseline.',
    timeline: [
      { t: 'Week 1 · Testing and first steps',
        s: 'At-home blood sample collection with a nurse. Doctor consultation and results review. Supplement voucher issued (AED 150). Your first month of therapy is dispatched.' },
      { t: 'Weeks 2 to 5 · Building the base',
        s: 'Daily injectable therapy. Concierge check-in calls at Day 10 and Day 25. It is normal to notice little change in this period.' },
      { t: 'Week 6 · First review',
        s: 'Mid-point review with your doctor. Response reviewed, dosing adjusted. Month 2 dispatched.' },
      { t: 'Weeks 7 to 12 · Full protocol',
        s: 'Month 3 dispatched. Repeat blood panel at Week 12 with your nurse, and a physician reassessment with your next-step plan.' },
    ],
    symptoms: ['Joint or tendon pain', 'Slow recovery', 'An unresolved old injury',
               'Lingering soreness', 'Gut discomfort', 'Reduced capacity', 'Morning stiffness'],
    included: [
      'At-home blood test with a nurse, baseline and Week 12',
      'Doctor consultation and results review',
      '3 × BPC-157 pens, dispatched monthly in cold chain',
      'Unlimited doctor consultations for the full 12 weeks',
      'Concierge care-team calls at Day 10, Day 25 and monthly thereafter',
      'Week 6 mid-point review',
      'Week 12 physician reassessment',
      'Supplement voucher worth AED 150, issued after your doctor consultation',
    ],
    provider: 'Prepared by a fully licensed UAE compounding pharmacy regulated by MOH and EDE.',
  },
  cart: {
    price: 3799,
    instalmentCount: 3,
    instalmentAmount: 1349,
    widgets: ['Tamara: split in 4 payments', 'Tabby: 4 interest-free payments'],
    promoAllowed: false,
    cta: 'Add to cart · AED 3,799',
  },
  confirmation: {
    title: 'Your protocol starts with testing.',
    body: 'Not with a product. A nurse comes to you, draws the baseline panel, and your '
        + 'doctor reads it with you before anything is dispensed.',
    action: 'Book your nurse visit',
  },
};

/* ── listing, clinical and commercial ──
   Editability follows the artifact: clinical fields propose rather than
   publish, and the discount field is refused outright. */
export const RR_META = {
  listing: {
    duration: 12,
    symptomNote: 'The symptom list is what the goal-picker triage matches against.',
  },
  clinical: {
    panel: 'Recovery & Inflammation: CBC · hs-CRP · ESR · Vitamin D · Magnesium · CK · Liver · Kidney · HbA1c · Ferritin',
    gateClass: 'Class 1 to 2',
    screening: [
      { id: 's1', q: 'Do you compete in tested sport?', mandatory: true,
        gates: 'tb_500', note: 'Gates the TB-500 upgrade. WADA-prohibited.' },
    ],
    addOns: [
      { id: 'tb_500', t: 'TB-500 (Wolverine)', price: 5999,
        requires: 'competes_in_tested_sport == "no"', offeredAt: 'Week 6 review' },
      { id: 'nurse', t: 'Nurse administration visits', price: 99, note: '4-pack AED 349' },
      { id: 'ghk', t: 'GHK-Cu addition', price: 0, note: 'Where clinically indicated' },
      { id: 'physio', t: 'Physiotherapy', price: 0, note: 'Where clinically indicated' },
    ],
  },
  commercial: {
    price: 3799,
    upgrade: { t: 'Wolverine, adds TB-500', price: 5999 },
    instalments: '3 × AED 1,349 · Tamara · Tabby',
    addOnPricing: 'Nurse visit AED 99, 4-pack AED 349',
    discountCodes: 'Not permitted on protocol SKUs',
  },
};

/* Refused by the builder, not by review. */
/* ── THE CONSULT QUEUE ──
   One doctor, several patients waiting. Ahmad is the patient sitting in the
   other tab: his record is read live out of the patient app, so whatever was
   answered there is what the doctor reads here. The rest are fixtures, and they
   say so, because a queue of one is not a queue and a fake queue that pretends
   to be real is worse than an honest one.

   `waiting` is what the doctor needs to know before opening anybody: how long
   this person has been sitting there and what for. */
export const PATIENTS = [
  { id: 'live', name: 'Ahmad Al Mansouri', live: true,
    goal: 'recover-rebuild', waiting: 'Week 1 consult', since: 'Today, 09:40' },
  { id: 'p_leila', name: 'Leila Haddad',
    goal: 'recover-rebuild', waiting: 'Week 6 review', since: 'Today, 10:15',
    record: {
      profile: { age: '34', sex: 'Female', height: '166', weight: '61' },
      onboarding: {
        'What made you open this today?': 'Something hurts, or will not heal',
        'How long has that been true?': 'Months',
        'What have you already tried?': 'Physio or a change in training, Supplements',
      },
      triage: {
        'What are you dealing with?': 'An old injury that never resolved, Reduced capacity',
        'How long has it been going on?': 'Over six months',
      },
      purchase: { what: 'Recovery & Repair Peptide Protocol', paid: 'AED 3,799', on: '14 July' },
      progress: { done: 8, total: 14, next: 'Mid-point doctor review' },
      consults: [
        { on: '21 July', outcome: 'Continue as planned',
          note: 'Baseline hs-CRP raised. Start as written, review at Week 6.' },
      ],
      flags: ['Competes in tested sport: no'],
    } },
  { id: 'p_omar', name: 'Omar Rashid',
    goal: 'recover-rebuild', waiting: 'Week 1 consult', since: 'Today, 11:00',
    record: {
      profile: { age: '41', sex: 'Male', height: '181', weight: '94' },
      onboarding: {
        'What made you open this today?': 'Something hurts, or will not heal',
        'How long has that been true?': 'A year or more',
        'What have you already tried?': 'Rest and time, A doctor, with no clear answer',
      },
      triage: {
        'What are you dealing with?': 'Joint or tendon pain, Lingering soreness',
        'How long has it been going on?': 'Years',
      },
      purchase: { what: 'Recovery & Repair Peptide Protocol', paid: '3 x AED 1,349', on: '19 August' },
      progress: { done: 3, total: 14, next: 'Doctor consultation' },
      consults: [],
      flags: ['Competes in tested sport: not asked yet'],
    } },
  { id: 'p_sara', name: 'Sara Nasser',
    goal: 'skin-hair', waiting: 'Week 1 consult', since: 'Yesterday, 16:20',
    record: {
      profile: { age: '29', sex: 'Female', height: '160', weight: '55' },
      onboarding: {
        'What made you open this today?': 'Hair, skin, or both',
        'How long has that been true?': 'Months',
        'What have you already tried?': 'Supplements',
      },
      triage: {},
      purchase: { what: 'Skin & Hair Peptide Protocol', paid: 'AED 2,499', on: '22 August' },
      progress: { done: 1, total: 11, next: 'Blood sample collected' },
      consults: [],
      flags: ['Skin and hair is not built out in this prototype'],
    } },
];

export const LOCKED_RULES = [
  { t: 'Remove the baseline panel', why: '“Your protocol starts with testing, not a product” is the product. Also the clinical basis for prescribing.' },
  { t: 'Remove the consultation', why: 'Dispensing depends on it. Removing it makes this a supplement sale.' },
  { t: 'Remove the Week 12 panel', why: 'Promised on the page, and it is the renewal conversation.' },
  { t: 'Apply a discount code', why: 'The protocol is the offer. Bundle or discount, never both.' },
  { t: 'Offer TB-500 without the competition question', why: 'WADA-prohibited.' },
  { t: 'Name a doctor or the pharmacy', why: 'Copy rule. Use “our peptide doctors” and “a fully licensed UAE compounding pharmacy regulated by MOH and EDE”.' },
  { t: 'Publish without the 12-week statement', why: 'The single most important line on the page. The fix for one-month churn.' },
  { t: 'Say “free” consultation', why: 'Copy rule. “Included”, never “free”.' },
];

export const emptyDraft = () => ({
  /* No goal owns the onboarding chat, so it sits under a pseudo-goal and gets
     the same drafts, publish and version machinery as everything else. */
  shared: {
    onboarding: structuredClone(ONBOARDING),
  },
  'recover-rebuild': {
    triage: structuredClone(RR_TRIAGE),
    prepurchase: structuredClone(RR_PREPURCHASE),
    plan: structuredClone(RR_PLAN),
    meta: structuredClone(RR_META),
  },
  'weight-loss': { existing: true },
  'skin-hair': { thin: true },
});
