/* Kept deliberately small — enough to drive the prototype, no schema. */

export const PROTOCOLS = {
  P_SLEEP: {
    arc: [
      { to: 3,  t: 'Hygiene first', b: 'Light and caffeine timing do most of the work. Nothing injectable yet.' },
      { to: 6,  t: 'DSIP added', b: 'Deep sleep should lengthen before total sleep does. Watch latency, not hours.' },
      { to: 8,  t: 'Consolidate', b: 'HRV is the read-out. A rising baseline means recovery is catching up.' },
    ],
    milestones: [
      { d: 21, t: 'DSIP starts' },
      { d: 56, t: 'Retest HRV' },
    ],
    price: 1850, blood: 'maybe',
    items: [
      { k: 'pep', t: 'DSIP',                 d: '100 mcg, nights, 5 on 2 off' },
      { k: 'sup', t: 'Magnesium threonate',  d: '400 mg, 2h before bed' },
      { k: 'sup', t: 'Apigenin',             d: '50 mg, nights' },
      { k: 'hab', t: 'Morning light',        d: '10 min within an hour of waking' },
      { k: 'hab', t: 'Caffeine cut-off',     d: '10h before sleep' },
    ],
    amend: {
      changed: ['DSIP held back to week 3 — sleep hygiene first'],
      added:   ['Ferritin check — low iron mimics poor sleep'],
      flagged: ['If HRV drops two weeks running, stop and call'],
    },
    t: 'Sleep & Recovery', wk: 8, mk: 'HRV + sleep latency',
    goal: 'Fall asleep faster and wake up actually recovered',
    stack: ['Magnesium threonate, 2h before bed', 'Morning light, 10 min within an hour of waking',
            'Caffeine cut-off 10h before sleep', 'Room to 18°C, blackout'],
    risk: 'Magnesium can loosen stools for the first week. We start at half dose and step up.',
    wrongFor: 'Shift workers on rotating nights — the light timing does more harm than good.',
  },
  P_WEIGHT: {
    arc: [
      { to: 4,  t: 'Titration', b: 'Your gut is adapting to tirzepatide. Nausea peaks around day 10 and settles by week 3.' },
      { to: 8,  t: 'Steady state', b: 'Appetite signalling has reset. This is where fat loss starts outpacing water loss.' },
      { to: 12, t: 'Final stretch', b: 'HbA1c reflects your last 90 days, so the retest is now reading the whole run.' },
    ],
    milestones: [
      { d: 28, t: 'Dose goes to 5 mg' },
      { d: 56, t: 'Body composition check' },
    ],
    price: 3400, blood: 'maybe',
    items: [
      { k: 'glp', t: 'Tirzepatide',          d: '2.5 → 5 mg, weekly injection' },
      { k: 'iv',  t: 'B-complex + carnitine',d: '250 ml, fortnightly' },
      { k: 'sup', t: 'Iron + vitamin C',     d: 'Mornings, empty stomach' },
      { k: 'hab', t: 'Protein floor',        d: '1.6 g per kg bodyweight, daily' },
      { k: 'hab', t: 'Resistance training',  d: '3× a week, compound lifts' },
    ],
    amend: {
      changed: ['Tirzepatide starts at 2.5 mg for 4 weeks, not 2'],
      added:   ['Anti-nausea cover for weeks 1–3'],
      flagged: ['Muscle loss if protein slips — we retest body composition'],
    },
    t: 'Weight Loss', wk: 12, mk: 'HbA1c',
    goal: 'Drop fasting glucose and lose fat without losing muscle',
    stack: ['Tirzepatide 2.5 → 5 mg weekly', 'Protein floor 1.6 g/kg bodyweight',
            'Resistance training 3× a week', 'Iron + vitamin C, mornings'],
    risk: 'Nausea in weeks 1–3 is common. Muscle loss if you undershoot protein.',
    wrongFor: 'Anyone with a history of pancreatitis, or planning pregnancy inside a year.',
  },
  P_SKIN: {
    price: 2100, blood: 'no',
    items: [
      { k: 'pep', t: 'GHK-Cu topical',       d: 'Nights, after cleansing' },
      { k: 'sup', t: 'Tretinoin 0.05%',      d: 'Nights, buffered, alternate days first month' },
      { k: 'sup', t: 'Collagen peptides',    d: '10 g daily' },
      { k: 'iv',  t: 'Glutathione',          d: '600 mg, monthly' },
      { k: 'hab', t: 'SPF 50',               d: 'Every morning, non-negotiable' },
    ],
    amend: {
      changed: ['Tretinoin every third night to week 4 — your skin is reactive'],
      added:   ['Ferritin correction — under 50 stalls collagen'],
      flagged: ['Purge for 4–6 weeks. It gets worse before better.'],
    },
    t: 'Skin & Anti-Ageing', wk: 12, mk: 'Collagen density',
    goal: 'Rebuild collagen density instead of masking the surface',
    stack: ['Tretinoin 0.05%, nights, buffered', 'Oral collagen peptides 10 g daily',
            'SPF 50 every morning, non-negotiable', 'Ferritin correction if under 50'],
    risk: 'Retinoid purge for 4–6 weeks — it gets worse before it gets better.',
    wrongFor: 'Pregnancy, breastfeeding, or active eczema on the face.',
  },
  P_ATH: {
    arc: [
      { to: 4,  t: 'Base', b: 'You are building mitochondrial density. It will not feel like progress yet — that is expected.' },
      { to: 8,  t: 'Load', b: 'Intervals are in. HRV decides whether you go hard on any given day.' },
      { to: 12, t: 'Sharpen', b: 'Lactate clearance improves before VO₂max does. Pace at threshold should feel easier.' },
      { to: 16, t: 'Peak', b: 'Adaptations consolidate. Volume drops, quality holds.' },
    ],
    milestones: [
      { d: 35, t: 'Intervals begin' },
      { d: 84, t: 'Mid-point lactate test' },
    ],
    price: 2750, blood: 'no',
    items: [
      { k: 'pep', t: 'BPC-157',              d: '250 mcg daily, 6 week block' },
      { k: 'iv',  t: 'Recovery drip',        d: 'Saline, magnesium, B12 — weekly' },
      { k: 'sup', t: 'Creatine monohydrate', d: '5 g daily' },
      { k: 'hab', t: 'Zone 2 base',          d: '180 min a week' },
      { k: 'hab', t: 'VO₂max intervals',     d: '1 session weekly, from week 5' },
    ],
    amend: {
      changed: ['Intervals held to week 5 — base first'],
      added:   ['Weekly HRV gate before hard sessions'],
      flagged: ['Ferritin is borderline. It caps aerobic gains.'],
    },
    t: 'Peak Athlete', wk: 16, mk: 'VO₂max + lactate',
    goal: 'Add a gear you do not currently have',
    stack: ['Zone 2 base, 180 min a week', 'One VO₂max interval session weekly',
            'Creatine monohydrate 5 g daily', 'Sodium + carb intra-workout above 90 min'],
    risk: 'Overreaching if you add intensity before the base is built. We gate week 5 on HRV.',
    wrongFor: 'Uncontrolled hypertension, or anyone inside 6 weeks of a soft-tissue injury.',
  },
  P_LONG: {
    price: 5200, blood: 'maybe',
    items: [
      { k: 'glp', t: 'Rapamycin',            d: '5 mg, weekly pulse, supervised' },
      { k: 'pep', t: 'NAD+ precursor',       d: '500 mg daily' },
      { k: 'iv',  t: 'NAD+ infusion',        d: '250 mg, monthly' },
      { k: 'sup', t: 'Omega-3',              d: 'To an index above 8%' },
      { k: 'hab', t: 'Zone 2 + resistance',  d: '5 days a week' },
    ],
    amend: {
      changed: ['Rapamycin deferred to month 2 — ApoB first'],
      added:   ['Monthly bloods while on rapamycin'],
      flagged: ['Stop immediately if you get an infection'],
    },
    t: 'Longevity', wk: 24, mk: 'ApoB, hsCRP',
    goal: 'Move the markers that actually predict lifespan',
    stack: ['ApoB target under 60 mg/dL', 'Rapamycin, weekly pulse, physician-supervised',
            'Zone 2 + resistance, 5 days a week', 'Omega-3 index above 8%'],
    risk: 'Rapamycin needs monthly bloods. Mouth ulcers and mild immune dip are dose-dependent.',
    wrongFor: 'Anyone immunosuppressed, or with an active infection.',
  },
  P_TEST: {
    price: 2400, blood: 'maybe',
    items: [
      { k: 'glp', t: 'Enclomiphene',         d: '12.5 mg, alternate days — only if labs justify it' },
      { k: 'sup', t: 'Zinc + vitamin D',     d: 'To sufficiency, retested at week 8' },
      { k: 'sup', t: 'Boron',                d: '6 mg daily' },
      { k: 'hab', t: 'Compound lifts',       d: '3× weekly' },
      { k: 'hab', t: 'Sleep floor',          d: '7 hours — this one does most of the work' },
    ],
    amend: {
      changed: ['Enclomiphene held pending SHBG'],
      added:   ['Haematocrit at week 8'],
      flagged: ['Not while trying to conceive without a fertility review'],
    },
    t: 'Testosterone', wk: 16, mk: 'Total + free T',
    goal: 'Raise free testosterone without shutting down your own production',
    stack: ['Sleep first — 7h floor before anything else', 'Zinc + vitamin D to sufficiency',
            'Compound lifts 3× weekly', 'Enclomiphene only if labs justify it'],
    risk: 'Haematocrit can climb. We retest at week 8 and pull back if it does.',
    wrongFor: 'Anyone trying to conceive in the next 12 months without a fertility review first.',
  },
  P_FOCUS: {
    price: 1950, blood: 'no',
    items: [
      { k: 'pep', t: 'Semax',                d: '300 mcg, mornings, 4 week block' },
      { k: 'sup', t: 'Creatine monohydrate', d: '5 g daily — cognitive, not just muscular' },
      { k: 'sup', t: 'Omega-3 (high DHA)',   d: '2 g daily' },
      { k: 'hab', t: 'Zone 2 cardio',        d: '150 min a week' },
      { k: 'hab', t: 'Caffeine timing',      d: 'Matched to your chronotype' },
    ],
    amend: {
      changed: ['Semax to a 4 week block, then reassess'],
      added:   ['Sleep apnoea screen — fix the airway first'],
      flagged: ['Nothing here is stimulant-led. Gains are slower, they hold.'],
    },
    t: 'Focus & Brain', wk: 12, mk: 'Reaction time',
    goal: 'Hold deep focus for longer without the 3pm collapse',
    stack: ['Creatine 5 g daily — cognitive, not just muscular', 'Zone 2 cardio 150 min a week',
            'Glucose variability under control', 'Caffeine timed to your chronotype'],
    risk: 'Nothing here is stimulant-led, so gains are slower and hold longer.',
    wrongFor: 'Untreated sleep apnoea — fix the airway before anything else.',
  },
};

/* What the baseline panel actually measures, by protocol marker. */
export const PANEL = [
  { g: 'Metabolic',    n: 'HbA1c, fasting insulin, glucose' },
  { g: 'Lipids',       n: 'ApoB, Lp(a), full panel' },
  { g: 'Hormones',     n: 'Total + free T, SHBG, thyroid' },
  { g: 'Inflammation', n: 'hsCRP, homocysteine' },
  { g: 'Nutrients',    n: 'Ferritin, B12, vitamin D, omega-3 index' },
  { g: 'Organ',        n: 'Liver, kidney, full blood count' },
];

export const TIERS = {
  open: { key: 'open', name: 'Open',         mark: '◆',   headline: 'Your twin matches.' },
  adv:  { key: 'adv',  name: 'Advanced',     mark: '◆◆',  headline: 'Where it gets serious.' },
  elite:{ key: 'elite',name: 'Elite',        mark: '◆◆◆', headline: 'The inner circle.' },
};
export const TIER_ORDER = ['open', 'adv', 'elite'];

/* The card is a person; the payload is their protocol. */
export const TWINS = [
  { id: 'w1', name: 'Lilly Sabri',  role: 'Physiotherapist · 4.9M subs', handle: '@lillysabri',
    img: '/twins/lillysabri.jpg', mono: 'LS', tone: '#8E3A44', match: 84, tier: 'open',
    protocol: 'P_WEIGHT', hook: '4.9M follow her fat-loss protocol' },
  { id: 'w2', name: 'Hamza Salah',  role: 'Model & trainer · Dubai', handle: '@hamzasalah',
    img: '/twins/hamzasalah.jpg', mono: 'HS', tone: '#9C6A2A', match: 79, tier: 'open',
    protocol: 'P_SKIN', hook: 'Top 1% of Dubai run this before shoots' },
  { id: 'w3', name: 'IShowSpeed',   role: 'Streamer · 40M+ following', handle: '@ishowspeed',
    img: '/twins/ishowspeed.jpg', mono: 'IS', tone: '#2C6B45', match: 71, tier: 'open',
    protocol: 'P_ATH', hook: 'What the next generation trains like' },

  { id: 'w4', name: 'Andrew Huberman', role: 'Neuroscientist · Stanford', handle: '@hubermanlab',
    img: '/twins/huberman.jpg', mono: 'AH', tone: '#2E4A6B', match: 91, tier: 'adv',
    protocol: 'P_SLEEP', hook: 'The most copied protocol on the internet' },
  { id: 'w5', name: 'Bryan Johnson', role: 'Blueprint', handle: '@bryan_johnson',
    img: '/twins/bryanjohnson.jpg', mono: 'BJ', tone: '#254A73', match: 93, tier: 'adv',
    protocol: 'P_LONG', hook: 'The most measured body on earth',
    blur: true, needs: ['food', 'sleep', 'stress'] },
  { id: 'w6', name: 'Peter Attia',  role: 'Longevity physician', handle: '@peterattiamd',
    img: null, mono: 'PA', tone: '#3A4E63', match: 88, tier: 'adv',
    protocol: 'P_FOCUS', hook: 'The protocol the top 1% pay $8k for',
    blur: true, needs: ['food'] },

  { id: 'w7', name: 'Rhonda Patrick', role: 'Biochemist', handle: '@foundmyfitness',
    img: null, mono: 'RP', tone: '#4A5A72', match: 82, tier: 'elite',
    protocol: 'P_TEST', hook: 'What researchers run on themselves' },
];

export const GOALS = [
  { k: 'fat',    ic: '⚖️', t: 'Lose fat, keep muscle' },
  { k: 'energy', ic: '⚡', t: 'Energy through the day' },
  { k: 'sleep',  ic: '😴', t: 'Sleep and recovery' },
  { k: 'long',   ic: '🧬', t: 'Live longer, healthier' },
  { k: 'looks',  ic: '✨', t: 'Skin, hair, how I look' },
  { k: 'perf',   ic: '🏆', t: 'Perform — sport or work' },
];

export const GROUPS = {
  work:   { ic: '💼', t: 'What do you do all day?', o: ['Desk-bound', 'On my feet', 'Shift work', 'Travel constantly', 'Physical labour'] },
  smoke:  { ic: '🚬', t: 'Where do you land on smoking?', o: ['Non-smoker', 'Socially', 'When drinking', 'Daily', 'Trying to quit'] },
  drink:  { ic: '🍷', t: 'And drinking?', o: ['Never', 'Special occasions', 'Weekends', 'Most nights'] },
  move:   { ic: '🏃', t: 'How much do you move?', o: ['Barely', 'Some weeks', '3–4× a week', 'Most days', 'Twice a day'] },
  train:  { ic: '⚡', t: 'What kind?', multi: true, o: ['Lifting', 'Running', 'Padel', 'Football', 'Yoga', 'Walking', 'Swimming', 'Cycling'] },
  food:   { ic: '🍽', t: 'What food do you actually love?', multi: true, o: ['Grilled meat', 'Rice & carbs', 'Bread & pastry', 'Salads', 'Seafood', 'Sweets', 'Fried food', 'Dairy heavy', 'Anything'] },
  sleep:  { ic: '😴', t: 'How much sleep do you get?', o: ['Under 5 h', '5–6 h', '7–8 h', '9 h+'] },
  stress: { ic: '🌊', t: 'How loud is life right now?', o: ['Quiet', 'Manageable', 'High', 'Relentless'] },
};

export const GROUP_LABEL = { food: 'Food', sleep: 'Sleep', stress: 'Stress', work: 'Work', move: 'Training' };
export const SWIPE_TARGET = 20;

/* The doctor who reads your baseline. A result nobody signs off on is just a
   number — putting a named face on it before the draw is what makes the
   panel feel like care rather than a data grab. */
export const DOCTOR = {
  name: 'Dr. Mahmoud Hassan',
  img: '/team/mahmoud.jpg',
  role: 'Internal Medicine · Valeo',
  reg: 'SCFHS 24-118940',
  years: '11 years',
  langs: 'Arabic · English',
  focus: 'Metabolic health & preventive medicine',
  does: [
    'Reads your panel line by line, not just the flagged values',
    'Calls you the same day if anything needs acting on now',
    'Signs off every protocol before it starts',
    'Compares your retest against this baseline at week 12',
  ],
};

/* ══════════════════════════════════════════════════════════════
   THE TWIN, COMPUTED
   ══════════════════════════════════════════════════════════════
   Completeness is derived from what the user has actually given us,
   never stored as a number. That keeps every screen honest: the Twin
   tab can't claim 60% while the answers say otherwise, and each row
   is worth exactly what it says it's worth.

   The weights are the model: behaviour is cheap to collect and worth
   less; a blood baseline is expensive and worth the most.            */
export const SIGNALS = [
  { k: 'basic',  t: 'Age, gender, body',  pct: 15, via: 'questions', sub: 'The floor for any reference range' },
  { k: 'life',   t: 'Work & habits',      pct: 20, via: 'questions', sub: 'Smoking, drinking, how you move' },
  { k: 'food',   t: 'Food',               pct: 10, via: 'questions', sub: 'What you actually eat' },
  { k: 'sleep',  t: 'Sleep',              pct: 10, via: 'questions', sub: 'Hours and quality' },
  { k: 'stress', t: 'Stress',             pct: 10, via: 'questions', sub: 'Load and where it comes from' },
  { k: 'goal',   t: 'Your goal',          pct: 10, via: 'questions', sub: 'What you want changed' },
  { k: 'blood',  t: 'Blood baseline',     pct: 25, via: 'blood',     sub: 'One draw at home — the biggest single jump' },
];

export function signalDone(k, st) {
  const qa = st.qa || {};
  if (k === 'blood') return !!st.blood;
  if (k === 'basic') return !!(qa.age && qa.gender);
  if (k === 'life')  return !!(qa.work && qa.smoke && qa.drink);
  if (k === 'goal')  return !!qa.goal;
  if (k === 'food')  return !!(qa.food && qa.food.length);
  return !!qa[k];                                    /* sleep, stress */
}
export function twinPct(st) {
  return SIGNALS.reduce((n, s) => n + (signalDone(s.k, st) ? s.pct : 0), 0);
}

/* A thin twin scores conservatively. Filling it in is the only way the
   number climbs — which is the whole flywheel, made visible. */
export function matchFor(tw, st) {
  return Math.round(tw.match * (0.82 + 0.18 * (twinPct(st) / 100)));
}
/* What a blurred card is still owed. Derived from the answers, so there's
   no second list to keep in sync. */
export function owedBy(tw, st) {
  return (tw.needs || []).filter((g) => !signalDone(g, st));
}
export function isBlurred(tw, st) {
  return !!tw.blur && !(st.revealed || []).includes(tw.id) && owedBy(tw, st).length > 0;
}

/* ── THE LOOP ── */
export const PHASES = ['Measure', 'Read', 'Commit', 'Act', 'Prove'];
export const PHASE_NOTE = {
  Measure: 'Baseline drawn',
  Read:    'Panel read and signed off',
  Commit:  'Protocol agreed',
  Act:     'Running it',
  Prove:   'Retest and verdict',
};
export function phaseOf(active) {
  if (!active) return null;
  if (active.day >= active.total) return 'Prove';
  return 'Act';
}

/* ── YOUR TWIN ──
   It answers from what it knows about you, and it says plainly where its
   authority ends. Escalation is the user's call, offered — not a scripted
   hand-off, because an assistant that decides to involve a doctor on your
   behalf is making a medical decision. */
export const TWIN_CHAT = [
  { me: false, t: 'I know your protocol, your logs and your last panel. Ask me anything.' },
  { me: true,  t: 'Nausea is bad this week. Should I drop the dose?' },
  { me: false, t: 'You logged nausea on 4 of the last 6 days. On tirzepatide that peaks around day 10 and usually settles by week 3 — you are on day 12.' },
  { me: false, t: 'Two things you can do without changing anything: take it after food, and split your evening meal. Both cut nausea in most people.' },
  { me: false, t: 'Changing the dose is a prescriber decision and I will not guess at it. If it is not easing by day 18, send this to Dr. Mahmoud.', offer: true },
];

/* Any protocol without a written arc still needs a phase name and a line. */
export function arcFor(p, day) {
  const wk = Math.ceil(day / 7);
  const arc = p.arc || [
    { to: Math.ceil(p.wk / 3), t: 'Starting out', b: 'Early weeks are about consistency, not results.' },
    { to: Math.ceil((p.wk / 3) * 2), t: 'Steady state', b: 'This is the stretch that moves the marker.' },
    { to: p.wk, t: 'Final stretch', b: 'The retest is close. Adherence now is what makes it readable.' },
  ];
  const i = Math.max(0, arc.findIndex((a) => wk <= a.to));
  return { ...arc[i === -1 ? arc.length - 1 : i], idx: i, all: arc };
}
export function nextMilestone(p, day) {
  const ms = [...(p.milestones || []), { d: p.wk * 7, t: `Retest ${p.mk}` }];
  return ms.find((m) => m.d > day) || ms[ms.length - 1];
}

/* ── WHAT'S IN THE BOX ──
   Typed so the detail page can say plainly what is a prescription and what
   isn't. People are about to spend real money; "stack" is not an answer. */
export const KINDS = {
  glp: { t: 'Prescription', ic: '💉', rx: true },
  pep: { t: 'Peptide',      ic: '🧬', rx: true },
  iv:  { t: 'IV drip',      ic: '💧', rx: true },
  sup: { t: 'Supplement',   ic: '💊', rx: false },
  hab: { t: 'Habit',        ic: '🏋️', rx: false },
};
export const KIND_ORDER = ['glp', 'pep', 'iv', 'sup', 'hab'];

/* ── PROTOCOL LIFECYCLE ──
   saved   — kept from the deck, nothing committed
   booked  — consult booked; under doctor review until the call happens
   ready   — call done, protocol amended, buyable
   shipping— paid; nurse and package on the way
   running — day 1 onward
   verdict — retest due
*/
export const RX = ['saved', 'booked', 'ready', 'shipping', 'running', 'verdict'];
export const RX_LABEL = {
  saved:    { t: 'Not started',        c: 'ink2' },
  booked:   { t: 'Under doctor review',c: 'yellowDeep' },
  ready:    { t: 'Ready to buy',       c: 'green' },
  shipping: { t: 'On the way',         c: 'teal' },
  running:  { t: 'Running',            c: 'green' },
  verdict:  { t: 'Retest due',         c: 'yellowDeep' },
};

/* Consult slots. Same-day is the point — the call is what unblocks everything. */
export const CONSULT_SLOTS = [
  { d: 'Today',    t: '6:30 pm', note: 'Next available' },
  { d: 'Tomorrow', t: '9:00 am' },
  { d: 'Tomorrow', t: '7:00 pm' },
  { d: 'Thursday', t: '11:00 am' },
];

/* ── DAILY LOG ──
   Three kinds, asked when they're actually useful rather than at random.
   Side effects in the first three weeks, because that's when they happen and
   when people quit. The proxy measure later, because that's what fills the
   gap between two blood draws. */
export const LOG_KINDS = {
  taken:  { t: 'Did you take it?',   sub: 'Everything prescribed today' },
  felt:   { t: 'How did it sit?',    sub: 'Side effects, honestly',
            o: ['Fine', 'Mild', 'Rough', 'Bad'] },
  proxy:  { t: 'Weight this morning', sub: 'Same time, same scale' },
};
export function logKindFor(day) {
  if (day % 7 === 1) return 'proxy';        /* weekly weigh-in */
  if (day <= 21) return 'felt';             /* the quitting window */
  return 'taken';
}
