/*
 * THE SEED — Recover and Rebuild, as the spec wrote it.
 *
 * Every value here is lifted from the Recover and Rebuild document rather than
 * invented: the fourteen plan items with their offsets and actors, the
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
/* ── WHAT VALEO ALREADY SELLS ──
   A protocol step is not a new thing to build. It is a service that already
   exists, with a booking flow, a nurse rota, a lab handoff and a results
   upload behind it. So a step LINKS to one rather than describing one, and
   everything downstream of that link is somebody else's solved problem.

   This is the catalogue an admin panel would read from its own services table.
   Names are representative of what Valeo runs today. */
export const SERVICES = {
  lab: { t: 'Lab panel', items: [
    { id: 'panel_recovery', t: 'Recovery & Inflammation Panel',
      note: 'CBC, hs-CRP, ESR, Vitamin D, Magnesium, CK, Liver, Kidney, HbA1c, Ferritin', price: { uae: 890, ksa: 920 } },
    { id: 'panel_male', t: 'Comprehensive Male Profile', note: '49 biomarkers', price: { uae: 1290, ksa: 1340 } },
    { id: 'panel_female', t: 'Comprehensive Female Profile', note: '49 biomarkers', price: { uae: 1290, ksa: 1340 } },
    { id: 'panel_wellbeing', t: 'General Well-being Test', note: '49 essential biomarkers', price: { uae: 1190, ksa: 1230 } },
    { id: 'panel_testosterone', t: 'Testosterone Profile', note: 'Total, free, SHBG, LH, FSH', price: { uae: 540, ksa: 560 } },
    { id: 'panel_thyroid', t: 'Thyroid Profile', note: 'TSH, T3, T4, antibodies', price: { uae: 460, ksa: 480 } },
    { id: 'panel_metabolic', t: 'Metabolic Profile', note: 'HbA1c, fasting insulin, lipids', price: { uae: 620, ksa: 640 } },
    /* Targeted single-marker tests. A doctor chasing one thing should not have
       to order forty-nine biomarkers to get it. */
    { id: 'test_b12', t: 'Vitamin B12', note: 'Single marker', price: { uae: 90, ksa: 95 } },
    { id: 'test_vitd', t: 'Vitamin D', note: 'Single marker', price: { uae: 110, ksa: 115 } },
    { id: 'test_iron', t: 'Iron studies', note: 'Ferritin, transferrin, saturation', price: { uae: 180, ksa: 190 } },
    { id: 'test_hba1c', t: 'HbA1c', note: 'Single marker', price: { uae: 95, ksa: 100 } },
    { id: 'test_crp', t: 'hs-CRP', note: 'Single marker, inflammation', price: { uae: 85, ksa: 90 } },
  ] },
  consult: { t: 'Consultation', items: [
    { id: 'consult_peptide', t: 'Peptide Therapy Consultation', note: '30 minutes, video', price: { uae: 350, ksa: 365 } },
    { id: 'consult_glp1', t: 'GLP-1 Weight Loss Consultation', note: '30 minutes, video', price: { uae: 350, ksa: 365 } },
    { id: 'consult_longevity', t: 'Longevity Consultation', note: '45 minutes, video', price: { uae: 500, ksa: 520 } },
    { id: 'consult_gp', t: 'General Physician Consultation', note: '15 minutes, video', price: { uae: 150, ksa: 160 } },
    { id: 'consult_discovery', t: 'Discovery Consultation', note: '20 minutes, video', price: { uae: 0, ksa: 0 } },
    { id: 'consult_review', t: 'Follow-up Review', note: '15 minutes, video', price: { uae: 200, ksa: 210 } },
  ] },
  homecare: { t: 'Home care', items: [
    { id: 'home_draw', t: 'Home nurse visit, blood draw', note: 'About 20 minutes', price: { uae: 120, ksa: 135 } },
    { id: 'home_injection', t: 'Home nurse visit, injection', note: 'Per visit', price: { uae: 99, ksa: 110 } },
    { id: 'home_pack4', t: 'Nurse administration, 4-pack', note: 'Four visits', price: { uae: 349, ksa: 385 } },
    { id: 'home_iv', t: 'IV drip at home', note: 'About 45 minutes', price: { uae: 690 } },
  ] },
  medication: { t: 'Medication', items: [
    /* Priced like everything else, and flagged as something a protocol ships
       rather than sells separately. With no price the package had no component
       to discount and its total was an assertion again. */
    { id: 'med_bpc', t: 'BPC-157 pen, one month', note: 'Cold chain',
      price: { uae: 1400, ksa: 1450 }, inProtocol: true },
    { id: 'med_tb500', t: 'TB-500, one month', note: 'The Wolverine upgrade', price: { uae: 5999, ksa: 6250 },
      /* WADA-prohibited, so it cannot be offered until the competition question
         is answered no. The gate is a property of the PRODUCT, not of one
         hardcoded button, so anything carrying TB-500 inherits it. */
      gate: 'competes' },
    { id: 'med_bpc_tb', t: 'BPC-157 with TB-500, one month', note: 'Cold chain', price: { uae: 5999, ksa: 6250 },
      gate: 'competes' },
    { id: 'med_ghk', t: 'GHK-Cu, one month', note: 'Where clinically indicated', price: { uae: 1200 } },
    { id: 'med_semaglutide', t: 'Semaglutide, one month', note: 'Cold chain', price: { uae: 1745, ksa: 1810 } },
  ] },
  supplement: { t: 'Supplement', items: [
    { id: 'sup_voucher', t: 'Supplement voucher', note: 'Spend against any stack', price: { uae: 150, ksa: 155 } },
    { id: 'sup_joint', t: 'Joint and tendon stack', note: 'Collagen, Vitamin C, Boswellia', price: { uae: 220, ksa: 230 } },
    { id: 'sup_d3k2', t: 'Vitamin D3 with K2', note: '90 days', price: { uae: 95, ksa: 99 } },
    { id: 'sup_magnesium', t: 'Magnesium glycinate', note: '90 days', price: { uae: 85, ksa: 89 } },
    { id: 'sup_omega', t: 'Omega-3', note: '90 days', price: { uae: 130, ksa: 135 } },
    { id: 'sup_creatine', t: 'Creatine monohydrate', note: '90 days', price: { uae: 90, ksa: 95 } },
  ] },
};

/* The dropdown is grouped by category and stores a bare id. There is no
   separate "service type" control: which catalogue a step draws from is a
   property of the step, not a decision, and asking for it twice let the two
   answers disagree. */
export const SERVICE_GROUPS = Object.entries(SERVICES).map(([type, g]) => ({
  label: g.t,
  items: g.items.map((x) => ({ value: x.id, label: x.t })),
  type,
}));

/* Every catalogue item, flattened and tagged with the shelf it came from.
   The console offers things and the patient app renders them, and neither
   should have to know which category an id belongs to. */
export const CATALOGUE = Object.entries(SERVICES).flatMap(([type, g]) =>
  g.items.map((x) => ({ ...x, type })));
export const findService = (id) => CATALOGUE.find((x) => x.id === id) || null;

/* ── READING THE CATALOGUE IN A REGION ──
   A service has one price per country it is sold in, and is absent from the
   ones it is not. So "what does this cost" is not a property of the item, it is
   a question you can only ask once you know where. */
export const inRegion = (svc, region = 'uae') =>
  !!svc && svc.price != null && svc.price[region] != null;
export const priceOf = (svc, region = 'uae') =>
  (svc && svc.price && svc.price[region]) || 0;

/* The same grouped dropdown, holding only what that region actually sells. The
   options carry no country tag: the builder is already scoped to one, and
   repeating it on every line is how a scope stops being read. */
/* ── WHAT THE PACKAGE COSTS ──
   The one answer, computed the one way, from what the package is made of.

   Components at their own list price, less a cut per line, less a cut on the
   subtotal. Category managers set either, both or neither, and the number that
   falls out is the price on the cart — there is no second field to type it into.

   The bundle argument reads straight off it: a patient buying these separately
   pays `list`; the protocol is `total`; the difference is what the bundle is
   worth. That is a claim anybody in the room can check. */
export function invoiceOf(pp, region = 'uae') {
  const rows = (pp?.pdp?.included || [])
    .map((l) => ({ ...l, svc: findService(l.serviceId) }))
    .filter((r) => r.svc)
    .map((r) => {
      const unit = priceOf(r.svc, region);
      const qty = r.qty || 1;
      const disc = Math.min(100, Math.max(0, r.discount || 0));
      const gross = unit * qty;
      return { ...r, unit, qty, disc, gross, net: Math.round(gross * (1 - disc / 100)),
               sold: inRegion(r.svc, region) };
    });
  const list = rows.reduce((n, r) => n + r.gross, 0);
  const afterLines = rows.reduce((n, r) => n + r.net, 0);
  const pkgDisc = Math.min(100, Math.max(0, pp?.pdp?.discount || 0));
  const total = Math.round(afterLines * (1 - pkgDisc / 100));
  return { rows, list, afterLines, lineSaved: list - afterLines,
           pkgDisc, pkgSaved: afterLines - total, total, saved: list - total,
           /* A line pointing at something this region does not sell. */
           unsold: rows.filter((r) => !r.sold) };
}
export const packagePrice = (pp, region = 'uae') => invoiceOf(pp, region).total;

export const serviceGroupsFor = (region = 'uae') =>
  Object.entries(SERVICES).map(([type, g]) => ({
    label: g.t,
    items: g.items.filter((x) => inRegion(x, region)).map((x) => ({ value: x.id, label: x.t })),
    type,
  })).filter((g) => g.items.length);

export const RR_PLAN = [
  { id: 'p1',  t: 'Book nurse visit',        sub: 'Nothing else can start until this is done.',
    serviceId: 'panel_recovery', week: 1,
    action: { kind: 'book', label: 'Choose a time' },
    /* The three objections a home blood draw actually raises, answered before
       the button rather than after it: who turns up, what it is like, and
       whether anybody reads the result. */
    ask: { tag: 'Step 1 of your protocol',
      title: 'We start with your blood test.',
      body: 'Your doctor needs these results before anything is prescribed.',
      assure: ['A qualified nurse comes to you',
               'Quick, and about twenty minutes',
               'Read by one of our peptide doctors'] },
    card: 'Book your nurse visit' },
  { id: 'p2',  t: 'Blood sample collected',  sub: 'Recovery & Inflammation Panel, baseline.',
    /* The VISIT, not the panel. This step is the nurse turning up; the panel is
       what the lab runs afterwards, and that is the next step. Linking both to
       the panel made the app say the lab was drawing the blood. */
    week: 1, blocker: true, locked: true,
    lockWhy: 'Your protocol starts with testing, not a product. It is also the clinical basis for prescribing.',
    /* Booked. The card stops being a task and becomes an appointment, so the
       time is the largest thing on it. The slot comes from the step that
       booked it. */
    waiting: { tag: 'First step', title: 'At-home blood test',
      whenLead: 'Arriving', slotFrom: 'p1',
      prepLabel: 'Before your appointment',
      prep: ['Fast for 10 hours, water is fine',
             'Drink water before the nurse arrives',
             'Have your ID ready',
             'The nurse comes to you'] },
    card: 'Nurse visit scheduled' },
  { id: 'p3',  t: 'Results ready',           sub: 'Automatic. No patient action.',
    week: 2,
    /* This used to say the doctor was reviewing results the moment the nurse
       left, which is chronologically impossible. Claiming work nobody has
       started is a small lie that costs trust the first time it is noticed. */
    waiting: { tag: 'Sample received at the lab', chip: 'In progress',
      title: 'We are analysing your sample.',
      body: 'This usually takes 24 to 48 hours. Your doctor sees it before you do.' },
    card: 'Results in a few days' },
  { id: 'p4',  t: 'Doctor consultation',     sub: 'Injury and recovery assessment, results review, competition screening. Dispatch is blocked until this happens.',
    serviceId: 'consult_peptide', week: 2, blocker: true, locked: true,
    lockWhy: 'Dispensing depends on it. Removing it makes this a supplement sale.',
    action: { kind: 'book', label: 'Book your consultation' },
    /* Two things to do at once, and the report comes first: reading it is what
       makes the consultation worth booking. */
    ask: { tag: 'Your results are in',
      title: 'Your baseline panel is ready.',
      body: 'Read it, then book a time to go through it with your doctor.',
      secondary: { kind: 'report', label: 'View your report' } },
    /* Booked, not yet attended. The appointment replaces the task. */
    scheduled: { tag: 'Consultation booked', title: 'Consultation with your doctor',
      whenLead: 'Scheduled for', sub: '30-minute video call',
      strip: 'The link opens 10 minutes before your call.',
      cta: 'Join consultation' },
    card: 'Your results are ready' },
  { id: 'p5',  t: 'Supplement voucher issued', sub: 'Automatic. AED 150.',
    serviceId: 'sup_voucher', week: 2, clinicianCanSet: true,
    card: 'Voucher issued' },
  { id: 'p6',  t: 'Month 1 dispatched',      sub: 'BPC-157 pen, cold chain.',
    serviceId: 'med_bpc', week: 2, clinicianCanSet: true, milestone: true,
    action: { kind: 'track', label: 'Track delivery' },
    waiting: { tag: 'Dispatched', title: 'Your medicine is on the way.',
      body: 'BPC-157 pen, shipped cold chain from a fully licensed UAE compounding pharmacy.' },
    card: 'Month 1 on the way' },
  { id: 'p7',  t: 'Concierge call 1',        sub: 'Care team.',
    serviceId: 'consult_gp', week: 2,
    card: 'Week 2 of 12' },
  { id: 'p8',  t: 'Concierge call 2',        sub: 'Care team.',
    serviceId: 'consult_gp', week: 4,
    card: 'Week 4 of 12' },
  { id: 'p9',  t: 'Mid-point doctor review', sub: 'Response reviewed, dosing adjusted, TB-500 assessed.',
    serviceId: 'consult_review', week: 6, milestone: true,
    action: { kind: 'book', label: 'Book your Week 6 review' },
    card: 'Book your Week 6 review' },
  { id: 'p10', t: 'Month 2 dispatched',      sub: 'Ops.',
    serviceId: 'med_bpc', week: 7, clinicianCanSet: true, milestone: true,
    action: { kind: 'track', label: 'Track delivery' },
    card: 'Month 2 on the way' },
  { id: 'p11', t: 'Monthly concierge calls', sub: 'Care team. Recurring.',
    serviceId: 'consult_gp', week: 8,
    card: 'Week 8 of 12' },
  { id: 'p12', t: 'Month 3 dispatched',      sub: 'Ops.',
    serviceId: 'med_bpc', week: 10, clinicianCanSet: true, milestone: true,
    action: { kind: 'track', label: 'Track delivery' },
    card: 'Week 9 of 12' },
  { id: 'p13', t: 'Repeat blood panel',      sub: 'Same panel as baseline.',
    serviceId: 'panel_recovery', week: 12, blocker: true, clinicianCanSet: true, locked: true,
    lockWhy: 'Promised on the page, and it is the renewal conversation.',
    action: { kind: 'book', label: 'Book your Week 12 test' },
    card: 'Book your Week 12 test' },
  { id: 'p14', t: 'Physician reassessment',  sub: 'Produces the maintenance plan and the renewal decision.',
    serviceId: 'consult_peptide', week: 12, milestone: true,
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
  /* ── WHO IS THIS FOR ──
     Asked first, and not as one of the questions, because the answer changes
     who "you" means in every question after it. A parent buying for a child
     should not have to work out whose height is being asked for. */
  who: {
    t: 'Before we start',
    sub: 'Is this for you, or for someone in your family?',
    selfLabel: 'For myself',
    memberLabel: 'For a family member',
    namePrompt: 'Who is it for?',
    relations: ['Spouse', 'Parent', 'Child', 'Sibling', 'Other'],
  },
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
        s: 'Daily injectable therapy. Concierge check-in calls at Week 2 and Week 4. It is normal to notice little change in this period.' },
      { t: 'Week 6 · First review',
        s: 'Mid-point review with your doctor. Response reviewed, dosing adjusted. Month 2 dispatched.' },
      { t: 'Weeks 7 to 12 · Full protocol',
        s: 'Month 3 dispatched. Repeat blood panel at Week 12 with your nurse, and a physician reassessment with your next-step plan.' },
    ],
    symptoms: ['Joint or tendon pain', 'Slow recovery', 'An unresolved old injury',
               'Lingering soreness', 'Gut discomfort', 'Reduced capacity', 'Morning stiffness'],
    /* ── WHAT THE PACKAGE IS MADE OF ──
       Not a list of sentences somebody typed. Each line points at a service in
       the catalogue and says how many of it the protocol includes, so the
       package has a cost that can be added up rather than asserted. */
    included: [
      { serviceId: 'panel_recovery', qty: 2, note: 'Baseline and Week 12' },
      { serviceId: 'home_draw', qty: 2, note: 'A nurse comes to you, both times' },
      { serviceId: 'consult_peptide', qty: 2, note: 'First consultation and the Week 12 reassessment' },
      { serviceId: 'consult_review', qty: 1, note: 'Week 6 mid-point review' },
      { serviceId: 'consult_gp', qty: 4, note: 'Concierge calls, Week 2, Week 4 and monthly' },
      /* The peptide is the line the bundle exists to carry, so it is the line
         that takes the biggest cut. */
      { serviceId: 'med_bpc', qty: 3, discount: 50, note: 'Dispatched monthly, cold chain' },
      { serviceId: 'sup_voucher', qty: 1, note: 'Issued after your doctor consultation' },
    ],
    /* Off the subtotal, after the per-line cuts. Either, both or neither. */
    discount: 34,
    provider: 'Prepared by a fully licensed UAE compounding pharmacy regulated by MOH and EDE.',
  },
  cart: {
    /* No price field. The price IS the invoice, computed from what the package
       is made of; two places to set one number is how a cart and a package
       description start disagreeing about what a protocol costs. */
    instalmentCount: 3,
    widgets: ['Tamara: split in 4 payments', 'Tabby: 4 interest-free payments'],
    promoAllowed: false,
  },
  confirmation: {
    title: 'Your protocol starts with testing.',
    body: 'Not with a product. A nurse comes to you, draws the baseline panel, and your '
        + 'doctor reads it with you before anything is dispensed.',
    action: 'Book your nurse visit',
  },
};

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
      /* What she has logged in her own app. Six weeks in, still reporting,
         and the numbers are moving the right way. */
      day: 41,
      checkins: [
        { pain: 8, capacity: 3, day: 2 },  { pain: 7, capacity: 4, day: 9 },
        { pain: 7, capacity: 4, day: 16 }, { pain: 6, capacity: 5, day: 24 },
        { pain: 5, capacity: 6, day: 31 }, { pain: 4, capacity: 7, day: 38 },
      ],
      target: 85,
      logs: { symptoms: 6, doses: 22, meals: 9 },
      logAt: { symptoms: 38, doses: 40, meals: 19 },
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
      /* One check-in in week one and nothing since. The interesting case: the
         console has to make "logged once, then stopped" visible, because that
         is what the coach is meant to act on. */
      day: 16,
      checkins: [{ pain: 9, capacity: 2, day: 1 }],
      target: 80,
      logs: { symptoms: 1 },
      logAt: { symptoms: 1 },
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
      day: 4,
      checkins: [],
      target: null,
      logs: {},
      logAt: {},
    } },
];

/* ── THE ORDERS LIST ──
   The coach does not arrive at a protocol, they arrive at Past Orders. This is
   that list: the same columns and the same filters the live panel has, with one
   category added.

   Most of these rows are not protocols. That is deliberate — selecting
   Protocols has to visibly narrow a real list, or the dropdown is decoration. */
export const ORDER_CATEGORIES = [
  'All Orders', 'Blood Package', 'Bundle', 'Coach Package',
  'Coach Consultation Package', 'Custom Package', 'Medicine', 'Mini Package',
  'Protocols', 'Supplement',
];

export const COACHES = ['Dr. Mahmoud Musa', 'Durga Coach', 'Dr. Rania Khoury'];

export const ORDERS = [
  /* The four protocol orders. Each one points at a patient in PATIENTS, which
     is what makes the row openable. */
  { id: 117955, patientId: 'live', category: 'Protocols',
    pkg: 'Recovery & Repair Peptide Protocol', price: 3799,
    name: 'Ahmad Al Mansouri', email: 'ahmad.almansouri@example.ae',
    coach: 'Dr. Mahmoud Musa', reviewed: null,
    purchased: 'Feb 10, 2026, 07:39 AM', country: 'United Arab Emirates',
    city: 'Dubai', rx: 'Yes' },
  { id: 117931, patientId: 'p_leila', category: 'Protocols',
    pkg: 'Recovery & Repair Peptide Protocol', price: 3799,
    name: 'Leila Haddad', email: 'leila.haddad@example.ae',
    coach: 'Dr. Mahmoud Musa', reviewed: 'Jul 21, 2025',
    purchased: 'Jul 14, 2025, 11:02 AM', country: 'United Arab Emirates',
    city: 'Dubai', rx: 'Yes' },
  { id: 117902, patientId: 'p_omar', category: 'Protocols',
    pkg: 'Recovery & Repair Peptide Protocol', price: 4047,
    name: 'Omar Rashid', email: 'omar.rashid@example.ae',
    coach: 'Dr. Mahmoud Musa', reviewed: null,
    purchased: 'Aug 19, 2025, 09:14 AM', country: 'United Arab Emirates',
    city: 'Abu Dhabi', rx: 'Yes' },
  { id: 117884, patientId: 'p_sara', category: 'Protocols',
    pkg: 'Skin & Hair Peptide Protocol', price: 2499,
    name: 'Sara Nasser', email: 'sara.nasser@example.ae',
    coach: 'Dr. Rania Khoury', reviewed: null,
    purchased: 'Aug 22, 2025, 04:20 PM', country: 'United Arab Emirates',
    city: 'Dubai', rx: 'Yes' },

  /* Everything else the coach's queue actually holds. Not openable: these are
     the panel's existing order types and this prototype does not rebuild them. */
  { id: 117954, category: 'Blood Package', pkg: 'VO2 Analyzer', price: 890,
    name: 'Ahmad Al Mansouri', email: 'ahmad.almansouri@example.ae',
    coach: 'Dr. Mahmoud Musa', reviewed: null,
    purchased: 'Feb 10, 2026, 07:39 AM', country: 'United Arab Emirates',
    city: 'Dubai', rx: 'No' },
  { id: 117953, category: 'Custom Package', pkg: 'Comprehensive Food Intolerance Test',
    price: 1290, name: 'Ahmad Al Mansouri', email: 'ahmad.almansouri@example.ae',
    coach: 'Dr. Mahmoud Musa', reviewed: 'Feb 15, 2026',
    purchased: 'Feb 10, 2026, 07:39 AM', country: 'United Arab Emirates',
    city: 'Dubai', rx: 'No' },
  { id: 117840, category: 'Blood Package', pkg: 'Comprehensive Male Profile',
    price: 1290, name: 'Yousef Karim', email: 'yousef.karim@example.ae',
    coach: 'Durga Coach', reviewed: 'Feb 09, 2026',
    purchased: 'Feb 02, 2026, 08:30 AM', country: 'United Arab Emirates',
    city: 'Sharjah', rx: 'No' },
  { id: 117802, category: 'Medicine', pkg: 'Semaglutide, one month', price: 1745,
    name: 'Mariam Al Zaabi', email: 'mariam.alzaabi@example.ae',
    coach: 'Durga Coach', reviewed: null,
    purchased: 'Jan 28, 2026, 06:11 PM', country: 'Saudi Arabia',
    city: 'Riyadh', rx: 'Yes' },
  { id: 117771, category: 'Supplement', pkg: 'Joint and tendon stack', price: 220,
    name: 'Hassan Ali', email: 'hassan.ali@example.ae',
    coach: 'Durga Coach', reviewed: 'Jan 24, 2026',
    purchased: 'Jan 20, 2026, 12:45 PM', country: 'United Arab Emirates',
    city: 'Dubai', rx: 'No' },
  { id: 117740, category: 'Coach Consultation Package', pkg: 'Peptide Therapy Consultation',
    price: 350, name: 'Nadia Farouk', email: 'nadia.farouk@example.ae',
    coach: 'Dr. Rania Khoury', reviewed: 'Jan 18, 2026',
    purchased: 'Jan 15, 2026, 10:05 AM', country: 'Kuwait',
    city: 'Kuwait City', rx: 'No' },
  { id: 117712, category: 'Mini Package', pkg: 'Vitamin D', price: 110,
    name: 'Leila Haddad', email: 'leila.haddad@example.ae',
    coach: 'Dr. Mahmoud Musa', reviewed: 'Jan 12, 2026',
    purchased: 'Jan 09, 2026, 03:22 PM', country: 'United Arab Emirates',
    city: 'Dubai', rx: 'No' },
];

export const orderFor = (patientId) =>
  ORDERS.find((o) => o.patientId === patientId) || null;

/* ── PROTOCOLS ARE THINGS THAT GET CREATED ──
   Not three fixed goals. A category manager builds a protocol for a goal in a
   region, and there can be several: the same programme priced for two
   countries is two protocols, because the catalogue behind it is two
   catalogues.

   How far through one is is NOT stored here. It is which of its two parts have
   been published, derived in the store, because a protocol that carried its own
   progress as a field could claim to be live while its tabs said draft.

   ── THE SEEDED ONES ARE LOCKED ──
   These two are already selling. You do not edit a protocol patients are on:
   you duplicate it, change the copy, and publish the copy. So they open
   read-only with one action on them — Duplicate — and everything editable in
   this Studio is something somebody made themselves. */
export const PROTOCOL_SEED = [
  { id: 'rr-uae', name: 'Recovery & Repair', goal: 'recover-rebuild',
    region: 'uae', weeks: 12, createdAt: '14 July 2025', locked: true },
  { id: 'rr-ksa', name: 'Recovery & Repair', goal: 'recover-rebuild',
    region: 'ksa', weeks: 12, createdAt: '2 February 2026', locked: true },
];

/* A new protocol starts from the seeded one rather than from nothing, because
   the clinical spine is the same programme every time and retyping fourteen
   steps is not authoring. */
export const newProtocolDraft = () => ({
  triage: structuredClone(RR_TRIAGE),
  prepurchase: structuredClone(RR_PREPURCHASE),
  plan: structuredClone(RR_PLAN),
});

export const emptyDraft = () => ({
  /* No protocol owns the onboarding chat, so it sits under a pseudo-scope and
     gets the same drafts, publish and version machinery as everything else. */
  shared: {
    onboarding: structuredClone(ONBOARDING),
  },
  ...Object.fromEntries(PROTOCOL_SEED.map((p) => [p.id, newProtocolDraft()])),
});
