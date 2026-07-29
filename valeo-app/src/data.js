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
      { k: 'pep', t: 'DSIP',                 d: '100 mcg, nights, 5 on 2 off', w: 'pm' },
      { k: 'sup', t: 'Magnesium threonate',  d: '400 mg, 2h before bed', w: 'pm' },
      { k: 'sup', t: 'Apigenin',             d: '50 mg, nights', w: 'pm' },
      { k: 'hab', t: 'Morning light',        d: '10 min within an hour of waking', w: 'am' },
      { k: 'hab', t: 'Caffeine cut-off',     d: '10h before sleep', w: 'pm' },
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
      { k: 'glp', t: 'Tirzepatide',          d: '2.5 → 5 mg, weekly injection', w: 'wk' },
      { k: 'iv',  t: 'B-complex + carnitine',d: '250 ml, fortnightly' },
      { k: 'sup', t: 'Iron + vitamin C',     d: 'Mornings, empty stomach', w: 'am' },
      { k: 'hab', t: 'Protein floor',        d: '1.6 g per kg bodyweight, daily', w: 'food' },
      { k: 'hab', t: 'Resistance training',  d: '3× a week, compound lifts', w: 'wk' },
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
      { k: 'pep', t: 'GHK-Cu topical',       d: 'Nights, after cleansing', w: 'pm' },
      { k: 'sup', t: 'Tretinoin 0.05%',      d: 'Nights, buffered, alternate days first month', w: 'pm' },
      { k: 'sup', t: 'Collagen peptides',    d: '10 g daily', w: 'am' },
      { k: 'iv',  t: 'Glutathione',          d: '600 mg, monthly' },
      { k: 'hab', t: 'SPF 50',               d: 'Every morning, non-negotiable', w: 'am' },
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
      { k: 'pep', t: 'BPC-157',              d: '250 mcg daily, 6 week block', w: 'am' },
      { k: 'iv',  t: 'Recovery drip',        d: 'Saline, magnesium, B12 — weekly' },
      { k: 'sup', t: 'Creatine monohydrate', d: '5 g daily', w: 'am' },
      { k: 'hab', t: 'Zone 2 base',          d: '180 min a week', w: 'wk' },
      { k: 'hab', t: 'VO₂max intervals',     d: '1 session weekly, from week 5', w: 'wk' },
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
      { k: 'glp', t: 'Rapamycin',            d: '5 mg, weekly pulse, supervised', w: 'wk' },
      { k: 'pep', t: 'NAD+ precursor',       d: '500 mg daily', w: 'am' },
      { k: 'iv',  t: 'NAD+ infusion',        d: '250 mg, monthly' },
      { k: 'sup', t: 'Omega-3',              d: 'To an index above 8%', w: 'food' },
      { k: 'hab', t: 'Zone 2 + resistance',  d: '5 days a week', w: 'wk' },
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
      { k: 'glp', t: 'Enclomiphene',         d: '12.5 mg, alternate days — only if labs justify it', w: 'am' },
      { k: 'sup', t: 'Zinc + vitamin D',     d: 'To sufficiency, retested at week 8', w: 'food' },
      { k: 'sup', t: 'Boron',                d: '6 mg daily', w: 'am' },
      { k: 'hab', t: 'Compound lifts',       d: '3× weekly', w: 'wk' },
      { k: 'hab', t: 'Sleep floor',          d: '7 hours — this one does most of the work', w: 'pm' },
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
      { k: 'pep', t: 'Semax',                d: '300 mcg, mornings, 4 week block', w: 'am' },
      { k: 'sup', t: 'Creatine monohydrate', d: '5 g daily — cognitive, not just muscular', w: 'am' },
      { k: 'sup', t: 'Omega-3 (high DHA)',   d: '2 g daily', w: 'food' },
      { k: 'hab', t: 'Zone 2 cardio',        d: '150 min a week', w: 'wk' },
      { k: 'hab', t: 'Caffeine timing',      d: 'Matched to your chronotype', w: 'am' },
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
/* Weight lives in the weekly Body capture now, so the daily log asks only
   what the day can answer: how it sat, or whether you took it. Two captures
   competing for the same number is how people stop trusting either. */
export function logKindFor(day) {
  if (day <= 21) return 'felt';             /* the quitting window */
  return 'taken';
}

/* ── WHEN ──
   "What do I take in the morning" is the question people actually ask, so the
   day is grouped by time rather than by drug class. */
export const WHEN = {
  am:   { t: 'Morning',    s: 'On waking',        ic: '☀️', o: 1 },
  food: { t: 'With food',  s: 'Any main meal',    ic: '🍽', o: 2 },
  pm:   { t: 'Evening',    s: 'Before bed',       ic: '🌙', o: 3 },
  wk:   { t: 'This week',  s: 'Not tied to a time', ic: '📅', o: 4 },
};
export const WHEN_ORDER = ['am', 'food', 'pm', 'wk'];

/* ── PASSIVE CAPTURE ──
   The best log is the one nobody has to do. Pairing a device should visibly
   take work off the daily list, not add a settings screen — so each one
   declares what it replaces. */
export const DEVICES = {
  oura:  { t: 'Oura Ring',      ic: '💍', gives: 'Sleep, HRV, temperature', drops: ['sleep'],
           metric: { k: 'hrv', t: 'HRV', unit: 'ms' } },
  watch: { t: 'Apple Watch',    ic: '⌚', gives: 'Steps, heart rate, workouts', drops: [],
           metric: { k: 'rhr', t: 'Resting HR', unit: 'bpm' } },
  whoop: { t: 'Whoop',          ic: '🎽', gives: 'Strain, recovery, sleep', drops: ['sleep'],
           metric: { k: 'hrv', t: 'HRV', unit: 'ms' } },
  cgm:   { t: 'FreeStyle Libre',ic: '🩸', gives: 'Continuous glucose', drops: ['meals'],
           metric: { k: 'glucose', t: 'Glucose', unit: 'mmol/L' } },
};
export const DEVICE_ORDER = ['oura', 'watch', 'whoop', 'cgm'];

/* ── MEALS ──
   Chips, not a food diary. A diary gets abandoned in a week; fifteen seconds
   of "roughly what was it" survives twelve. */
export const MEAL_SLOTS = [
  { k: 'b', t: 'Breakfast' },
  { k: 'l', t: 'Lunch' },
  { k: 'd', t: 'Dinner' },
];
export const MEAL_CHIPS = ['Eggs', 'Bread', 'Rice', 'Kabsa', 'Grilled meat', 'Chicken',
  'Fish', 'Salad', 'Yoghurt', 'Dates', 'Fruit', 'Nuts', 'Coffee', 'Protein shake',
  'Fried', 'Sweets', 'Skipped it'];

/* ── WEEKLY CHECK-IN ── the questions a clinician would ask at review */
export const CHECKIN = [
  { k: 'energy', t: 'Energy this week', o: ['Better', 'Same', 'Worse'] },
  { k: 'sleep',  t: 'Sleep',            o: ['Better', 'Same', 'Worse'] },
  { k: 'side',   t: 'Side effects',     o: ['None', 'Mild', 'Noticeable', 'Bad'] },
  { k: 'stick',  t: 'Hardest to stick to', o: ['Nothing', 'The injection', 'Training', 'Food'] },
];

/* ── BODY ── weekly, and the only capture with a photo */
export const BODY_FIELDS = [
  { k: 'kg',    t: 'Weight', unit: 'kg', from: 60, to: 140, def: 95 },
  { k: 'waist', t: 'Waist',  unit: 'cm', from: 60, to: 130, def: 96 },
];

/* Which captures are due today, and what a paired device has taken over. */
export function capturesFor(rx, day) {
  const dropped = (rx.devices || []).flatMap((d) => DEVICES[d].drops);
  const weekly = day % 7 === 1 || day === 1;
  return [
    { k: 'doses', t: 'Doses',    ic: '💊', due: true },
    { k: 'meals', t: 'Meals',    ic: '🍽', due: !dropped.includes('meals'),
      auto: dropped.includes('meals') },
    { k: 'body',  t: 'Body',     ic: '⚖️', due: weekly },
    { k: 'checkin', t: 'Check-in', ic: '◈', due: weekly },
  ];
}
/* Count back from today if today is already logged, otherwise from yesterday —
   an unlogged morning shouldn't read as a broken streak before the day is out. */
export function streakOf(rx) {
  if (!rx || !rx.logs) return 0;
  const from = rx.logs.some((l) => l.day === rx.day) ? rx.day : rx.day - 1;
  let n = 0;
  for (let d = from; d >= 1; d -= 1) {
    if (rx.logs.some((l) => l.day === d)) n += 1; else break;
  }
  return n;
}
/* Plausible device series so the second chart has something in it. */
export function deviceSeries(rx, dev) {
  const m = DEVICES[dev].metric;
  const base = { hrv: 48, rhr: 62, glucose: 5.6 }[m.k];
  const drift = { hrv: 0.28, rhr: -0.12, glucose: -0.012 }[m.k];
  const pts = [];
  for (let d = 1; d <= rx.day; d += 7) {
    pts.push({ d, v: Math.round((base + drift * d) * 10) / 10 });
  }
  return { pts, ...m };
}

/* ══════════════════════════════════════════════════════════════
   BODY SYSTEMS
   ══════════════════════════════════════════════════════════════
   Each system declares what it needs before it can be graded. A system we
   have not measured shows as unmeasured rather than as a guess — the blanks
   are the honest sales pitch, and they're what the single CTA exists to fill.
   Grading everything on thin data is how a twin stops being believable.   */
/* ── SYSTEMS, grouped into six body regions ──────────────────
   Twelve tap targets on a 270px body gives ~20px hit areas against a 44px
   minimum, which is a hard accessibility failure. Six regions fix that and
   add a real hierarchy: the body carries regions, a region carries systems.

   Two kinds of statement live here and they must never look alike:
   · measured  — a lab value, so it earns a letter grade and a provenance date
   · reported  — something you told us, so we show WHAT YOU SAID, never a
                 grade we invented. Grading self-report is the same offence as
                 an unfalsifiable biological age.                            */
/* Four zones, not six dots. Six markers on a 380-unit body cannot give 44px
   targets without overlapping — the arithmetic simply does not work at 390px.
   Four y-bands do, and painting the grade ONTO the body reads better than
   pinning a dot beside it. */
export const REGIONS = [
  { k: 'headneck', t: 'Head & neck', y0: 18,  y1: 112, cy: 66  },
  { k: 'chest',    t: 'Chest',       y0: 112, y1: 176, cy: 144 },
  { k: 'core',     t: 'Core',        y0: 176, y1: 250, cy: 212 },
  { k: 'limbs',    t: 'Limbs',       y0: 250, y1: 374, cy: 300 },
];

export const SYSTEMS = [
  { k: 'nutri', t: 'Nutrients', mk: 'Ferritin', tgt: 'target 50–150', whyOk: 'Ferritin is back in range. Oxygen transport is no longer your limiter, but 90+ is where it stops being a factor at all.', fix: { kind: 'supp', t: 'Iron + vitamin C, mornings', sub: 'Needs a prescriber to add it' }, region: 'chest', needs: ['blood'], lever: 1,
    g: 'D', src: 'Panel · 12 Mar', ref: 'Ferritin 38 µg/L · target 50–150',
    why: 'Under 50 limits oxygen transport, which caps VO₂max and stalls collagen.',
    move: 'Iron with vitamin C, mornings' },
  { k: 'inflam', t: 'Inflammation', mk: 'hsCRP', tgt: 'optimal under 1.0', whyOk: 'Inflammation is optimal now. Correcting iron is what moved it.', fix: { kind: 'supp', t: 'Omega-3 to an index above 8%', sub: 'Added to your next protocol' }, region: 'chest', needs: ['blood'], lever: 2,
    g: 'B', src: 'Panel · 12 Mar', ref: 'hsCRP 1.4 mg/L · optimal under 1.0',
    why: 'Low-grade inflammation slows recovery from everything else you do.',
    move: 'Ferritin first — iron deficiency raises hsCRP' },
  { k: 'sleep', t: 'Sleep & recovery', fix: { kind: 'device', t: 'Pair a ring or a watch', sub: 'Stops this being a guess' }, region: 'headneck', needs: ['sleep'], lever: 3,
    reported: true, sayKey: 'sleep',
    why: 'Short sleep blunts every other lever you pull.',
    move: 'Wear a ring for two weeks so this stops being a guess' },
  { k: 'thyroid', t: 'Thyroid', mk: 'TSH', tgt: 'range 0.4–4.0', whyOk: 'TSH came back into range. Worth confirming it holds rather than assuming it.', fix: { kind: 'test', t: 'Recheck TSH with free T4', sub: 'Added to your next draw' }, region: 'headneck', needs: ['blood'], lever: 4,
    g: 'C', src: 'Panel · 12 Mar', ref: 'TSH 4.2 mIU/L · range 0.4–4.0',
    why: 'TSH sits just above range, so your metabolic rate runs slightly low.',
    move: 'Recheck TSH with free T4 at your next draw' },
  { k: 'hormone', t: 'Sex hormones', mk: 'Free T', tgt: 'range 8.7–25', whyOk: 'Free testosterone climbed out of the bottom of range. Sleep did most of that.', fix: { kind: 'protocol', t: 'Run the Testosterone protocol', sub: 'Sleep-first, 16 weeks', protocol: 'P_TEST' }, region: 'core', needs: ['blood', 'basic'], lever: 5,
    g: 'C', src: 'Panel · 12 Mar', ref: 'Free T 9.1 ng/dL · range 8.7–25',
    why: 'Free testosterone sits at the bottom of range for your age.',
    move: 'A 7h sleep floor does more here than any supplement' },
  { k: 'heart', t: 'Heart & vascular', mk: 'ApoB', tgt: 'target under 60', fix: { kind: 'protocol', t: 'Run the Longevity protocol', sub: 'ApoB is its primary marker', protocol: 'P_LONG' }, region: 'chest', needs: ['blood'], lever: 6,
    g: 'B', src: 'Panel · 12 Mar', ref: 'ApoB 78 mg/dL · target under 60',
    why: 'ApoB is the number that predicts arterial risk. Yours is mid-range.',
    move: 'Omega-3 to an index above 8%' },
  { k: 'stress', t: 'Stress load', fix: { kind: 'answer', t: 'Answer the weekly check-in', sub: 'Four questions, thirty seconds' }, region: 'headneck', needs: ['stress'], lever: 7,
    reported: true, sayKey: 'stress',
    why: 'Sustained load keeps cortisol high, which holds visceral fat in place.',
    move: 'Answer the weekly check-in' },
  { k: 'comp', t: 'Body composition', fix: { kind: 'log', t: 'Log a body snapshot', sub: 'Weight, waist, one photo' }, region: 'limbs', needs: ['basic'], lever: 8,
    reported: true, sayKey: 'weight', unit: ' kg',
    why: 'We only have what you typed. A body snapshot would make this real.',
    move: 'Log a body snapshot this week' },
  { k: 'fitness', t: 'Fitness', fix: { kind: 'device', t: 'Pair a watch', sub: 'Then this measures itself' }, region: 'limbs', needs: ['life'], lever: 9,
    reported: true, sayKey: 'move',
    why: 'Self-reported activity is the weakest signal we hold.',
    move: 'Pair a watch and this measures itself' },
  { k: 'metab', t: 'Metabolic', mk: 'HbA1c', tgt: 'optimal under 5.4', fix: null, region: 'core', needs: ['blood'], lever: 10,
    g: 'B', src: 'Panel · 12 Mar', ref: 'HbA1c 5.4% · optimal under 5.4',
    why: 'Glucose handling is sound. Nothing here is holding you back.', move: null },
  { k: 'kidney', t: 'Kidney', mk: 'eGFR', tgt: 'range above 90', fix: null, region: 'core', needs: ['blood'], lever: 11,
    g: 'B', src: 'Panel · 12 Mar', ref: 'eGFR 98 · range above 90',
    why: 'Filtration is normal, which is why creatine is safe for you.', move: null },
  { k: 'liver', t: 'Liver', mk: 'ALT', tgt: 'range 7–56', fix: null, region: 'core', needs: ['blood'], lever: 12,
    g: 'A', src: 'Panel · 12 Mar', ref: 'ALT 22 U/L · range 7–56',
    why: 'Clean. No action needed.', move: null },
];

export const GRADE_C = { A: '#27995B', B: '#408FA4', C: '#E0A400', D: '#E94F5F' };

/* Two panels, so "over time" has a line instead of a dot. */
export const PANELS = [
  { date: '12 Mar', label: 'Baseline' },
  { date: '04 Jun', label: 'Retest' },
];
/* per-system movement between those two draws */
export const MOVES = {
  nutri:   { from: 38,  to: 71,   unit: ' µg/L', better: 'up',   was: 'D', now: 'B' },
  inflam:  { from: 1.4, to: 0.8,  unit: ' mg/L', better: 'down', was: 'B', now: 'A' },
  heart:   { from: 78,  to: 64,   unit: ' mg/dL',better: 'down', was: 'B', now: 'B' },
  thyroid: { from: 4.2, to: 3.1,  unit: ' mIU/L',better: 'down', was: 'C', now: 'B' },
  hormone: { from: 9.1, to: 12.4, unit: ' ng/dL',better: 'up',   was: 'C', now: 'B' },
  metab:   { from: 5.4, to: 5.2,  unit: '%',     better: 'down', was: 'B', now: 'A' },
  kidney:  { from: 98,  to: 99,   unit: '',      better: 'up',   was: 'B', now: 'B' },
  liver:   { from: 22,  to: 21,   unit: ' U/L',  better: 'down', was: 'A', now: 'A' },
};
/* A system resolves only when every signal it depends on exists. Measured
   systems return a grade; reported ones return the user's own words, never a
   grade we invented. */
export function gradeFor(sys, st) {
  const missing = sys.needs.filter((n) => !signalDone(n, st));
  if (missing.length) return { grade: null, said: null, missing };
  if (sys.reported) {
    const v = (st.qa || {})[sys.sayKey];
    return { grade: null, said: v ? String(v) + (sys.unit || '') : null, missing: [] };
  }
  /* Where a second panel exists, everything reads from it. The screen showing a
     baseline value beside an animation that ends somewhere else is how a twin
     stops being believable — one surface, one truth, and the baseline appears
     only inside Over time. */
  const mv = MOVES[sys.k];
  if (mv) {
    const grade = mv.now;
    return {
      grade, said: null, missing: [],
      ref: sys.mk ? `${sys.mk} ${mv.to}${mv.unit} · ${sys.tgt}` : sys.ref,
      /* an explanation written for a deficiency is wrong once it is corrected */
      why: grade === 'A' || grade === 'B' ? (sys.whyOk || sys.why) : sys.why,
      /* nothing left to fix at A — a card that invents an action gets ignored */
      fix: grade === 'A' ? null : sys.fix,
      src: `Panel · ${PANELS[1].date}`,
    };
  }
  return { grade: sys.g, said: null, missing: [] };
}
export function systemsState(st) {
  const rows = SYSTEMS.map((x) => ({ ...x, ...gradeFor(x, st) }))
    .sort((a, b) => a.lever - b.lever);
  return { rows, known: rows.filter((r) => r.grade || r.said).length, total: rows.length };
}

/* A region shows the WORST thing inside it, because a region is a warning
   light and not an average. Averaging hides the one row that matters. */
const GRADE_RANK = { D: 0, C: 1, B: 2, A: 3 };
export function regionsState(st) {
  const { rows } = systemsState(st);
  return REGIONS.map((rg) => {
    const inside = rows.filter((r) => r.region === rg.k);
    const graded = inside.filter((r) => r.grade)
      .sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade]);
    return {
      ...rg,
      inside,
      grade: graded.length ? graded[0].grade : null,
      known: inside.some((r) => r.grade || r.said),
      unknown: inside.filter((r) => !r.grade && !r.said).length,
    };
  });
}

/* The one thing worth saying and the one thing worth doing, ranked by our own
   lever order rather than by severity: a bad number you cannot move is not
   the most important number. */
export function constraintOf(st) {
  const { rows } = systemsState(st);
  return rows.find((r) => (r.grade || r.said) && r.move) || null;
}

/* One sentence for the top of the screen. When the twin is thin the sentence
   blames the model, never the person. */
export function verdictOf(st) {
  const { rows, known, total } = systemsState(st);
  if (known === 0) return 'I don’t know you yet.';
  if (known < total / 2) return 'Reading ' + known + ' of ' + total + ' systems.';
  const bad = rows.filter((r) => r.grade === 'D' || r.grade === 'C').length;
  if (bad === 0) return 'Nothing is holding you back.';
  return bad === 1 ? 'One system is holding you back.'
                   : bad + ' systems are holding you back.';
}

/* Things the twin noticed. Derived from real state, never canned — this is the
   seed of a feed architecture, and it degrades to nothing rather than filler. */
export function noticings(st) {
  const out = [];
  const rx = st.rx;
  if (rx && rx.devices && rx.devices.length) {
    out.push({ k: 'dev', t: DEVICES[rx.devices[0]].t + ' is covering sleep now',
      s: 'That is one fewer thing you log by hand.' });
  }
  if (rx && rx.day && rx.logs) {
    const gaps = rx.day - rx.logs.length;
    if (gaps > 2) out.push({ k: 'gap', t: gaps + ' days unlogged',
      s: 'Confidence in your reported systems is decaying. Data has a half-life.' });
  }
  if (rx && rx.body && rx.body.length > 1) {
    const a = rx.body[0].kg, b = rx.body[rx.body.length - 1].kg;
    const dl = Math.round((b - a) * 10) / 10;
    if (dl !== 0) {
      out.push({ k: 'body', t: 'Weight ' + (dl > 0 ? 'up ' : 'down ') + Math.abs(dl) + ' kg',
        s: 'A proxy, not the verdict. The retest still decides.' });
    }
  }
  if (!st.blood) {
    out.push({ k: 'blood', t: 'Six systems are waiting on one blood draw',
      s: 'It is the single biggest jump available to you.' });
  }
  return out.slice(0, 3);
}

/* ── SIMULATION ──
   Two kinds of no, which is the thing nobody else offers: "this is not real"
   and "this is real but not for you". Collapsing them is how trust is lost. */
export const SIM_EXAMPLES = [
  {
    label: 'A reel about ashwagandha for cortisol',
    src: 'instagram.com/reel/…',
    claim: 'Lowers cortisol and improves recovery',
    verdict: 'no',
    evidence: 'Small trials show a modest cortisol reduction. The recovery claim is extrapolated from that, not measured.',
    onYou: [
      { sys: 'Thyroid', dir: 'worse', t: 'TSH is already 4.2. Ashwagandha pushes thyroid output.' },
      { sys: 'Stress load', dir: 'better', t: 'Plausible small benefit.' },
    ],
    collides: 'Nothing in your protocol, but it works against your thyroid finding.',
    instead: 'Magnesium and breathwork get the stress effect without touching the thyroid.',
  },
  {
    label: 'Creatine + beta-alanine stack',
    src: 'Sent by a friend',
    claim: 'Adds strength and delays fatigue',
    verdict: 'yes',
    evidence: 'Creatine is among the best-evidenced supplements that exist. Beta-alanine holds up for efforts over 60 seconds.',
    onYou: [
      { sys: 'Fitness', dir: 'better', t: 'eGFR 98 means creatine is safe for you.' },
      { sys: 'Nutrients', dir: 'flat', t: 'No interaction with your iron correction.' },
    ],
    collides: 'Nothing. It sits alongside your current protocol.',
    instead: null,
  },
  {
    label: 'A 7-day liver cleanse',
    src: 'tiktok.com/@…',
    claim: 'Flushes toxins and resets the liver',
    verdict: 'bunk',
    evidence: 'There is no mechanism. Livers are not cleansed by diets, and "toxins" is never specified.',
    onYou: [
      { sys: 'Liver', dir: 'flat', t: 'Your ALT is 22. There is nothing here to fix.' },
    ],
    collides: 'The fasting component would interrupt your iron dosing.',
    instead: 'Nothing. This is not a wrong-for-you question, it is a not-real question.',
  },
];
export const SIM_VERDICT = {
  yes:  { t: 'Worth doing', c: 'green',      s: 'Evidence holds and it fits you' },
  no:   { t: 'Not for you', c: 'coral',      s: 'Real effect, wrong person' },
  bunk: { t: 'Not real',    c: 'ink2',       s: 'The claim does not hold for anyone' },
};
/* What the single CTA should do next: the cheapest unmet signal first. */
export function nextGap(st) {
  const order = ['blood', 'basic', 'life', 'sleep', 'stress', 'food', 'goal'];
  const k = order.find((x) => !signalDone(x, st));
  if (!k) return null;
  const s = SIGNALS.find((x) => x.k === k);
  return { k, ...s, blocks: SYSTEMS.filter((y) => y.needs.includes(k)).length };
}

/* ── ASK YOUR TWIN ──
   Real questions with real answers, including the answer people never get from
   a search engine: no, not you, and here's the number that says so. */
export const TWIN_ASKS = [
  {
    q: 'Can I take creatine?',
    v: 'yes',
    a: ['Nothing in your panel argues against it. Kidney markers are clean — creatinine 84 µmol/L, eGFR 98.',
        'It is already in two of the protocols your twin scored highly, so it fits the direction you are going.'],
    marker: { t: 'eGFR', v: 98, lo: 90, hi: 120, unit: '', good: true },
  },
  {
    q: 'Can I take ashwagandha?',
    v: 'no',
    a: ['Not for you. Your last panel put TSH at 4.2 mIU/L — that is above range and your thyroid is already working hard.',
        'Ashwagandha pushes thyroid output. On a borderline TSH that is the wrong direction.',
        'If you want the stress effect, magnesium and breathwork do it without touching the thyroid.'],
    marker: { t: 'TSH', v: 4.2, lo: 0.4, hi: 4.0, unit: ' mIU/L', good: false },
  },
  {
    q: 'Can I drink this weekend?',
    v: 'careful',
    a: ['One or two will not undo twelve weeks. But you are on day 22 and alcohol blunts sleep depth for about 48 hours.',
        'Your HRV drops 8–11 ms the day after drinking, going by your own Oura data.',
        'If you drink, log it. An unexplained dip in the retest is worse than a logged one.'],
    marker: { t: 'HRV after alcohol', v: 43, lo: 50, hi: 70, unit: ' ms', good: false },
  },
  {
    q: 'Why is this protocol right for me?',
    v: 'yes',
    a: ['You said skin was the goal, and your ferritin came back at 38 µg/L — under 50 stalls collagen synthesis.',
        'That is why the protocol corrects iron before anything topical. Most plans skip it.'],
    marker: { t: 'Ferritin', v: 38, lo: 50, hi: 150, unit: ' µg/L', good: false },
  },
];
export const ASK_VERDICT = {
  yes:     { t: 'Fits you',        c: 'green' },
  no:      { t: 'Not for you',    c: 'coral' },
  careful: { t: 'Careful',        c: 'yellowDeep' },
};

/* ══════════════════════════════════════════════════════════════
   EVERYTHING BELOW EXISTS SO THE FULL TWIN CAN BE SEEN WORKING
   ══════════════════════════════════════════════════════════════
   These are demo fixtures, clearly separated from the computed model above.
   Nothing here is inferred — it is written down so the screens can be judged
   before the pipeline that would produce them exists.                        */

export function moveOf(k) { return MOVES[k] || null; }

/* Grade before and after, for the played transition. A zone that has not been
   measured twice has nothing to play, and says so rather than faking motion. */
export function arcOfZone(zoneKey, st) {
  const { rows } = systemsState(st);
  const inside = rows.filter((r) => r.region === zoneKey && MOVES[r.k]);
  if (!inside.length) return null;
  const rank = { D: 0, C: 1, B: 2, A: 3 };
  const worstWas = inside.slice().sort((a, b) => rank[MOVES[a.k].was] - rank[MOVES[b.k].was])[0];
  const worstNow = inside.slice().sort((a, b) => rank[MOVES[a.k].now] - rank[MOVES[b.k].now])[0];
  return {
    from: MOVES[worstWas.k].was,
    to: MOVES[worstNow.k].now,
    markers: inside.map((r) => ({ t: r.t, ...MOVES[r.k] })),
    gained: inside.filter((r) => MOVES[r.k].was !== MOVES[r.k].now).length,
  };
}
/* Which zone moved most — the one worth auto-playing. */
export function bestMovedZone(st) {
  const scored = REGIONS.map((rg) => {
    const a = arcOfZone(rg.k, st);
    return { k: rg.k, n: a ? a.gained : -1 };
  }).sort((x, y) => y.n - x.n);
  return scored[0] && scored[0].n > 0 ? scored[0].k : null;
}

/* ── CLOSEST TWINS ──
   Matched on measured biology, not on a questionnaire, and the delta is the
   point: the gap is what a protocol is designed to close. Similarity is stated
   as "systems apart" rather than a percentage, because a percentage implies a
   precision this matching does not have. */
export const PEERS = [
  {
    id: 'p_hub', name: 'Andrew Huberman', role: 'Neuroscientist · Stanford',
    img: '/twins/huberman.jpg', apart: 2, why: 'Sleep architecture and ApoB sit close to yours.',
    diverge: 'He runs ferritin near 90. Yours is the gap.',
    rows: [
      { sys: 'Sleep & recovery', you: 'B', them: 'A' },
      { sys: 'Heart & vascular', you: 'B', them: 'B' },
      { sys: 'Nutrients',        you: 'B', them: 'A' },
      { sys: 'Inflammation',     you: 'A', them: 'A' },
    ],
  },
  {
    id: 'p_att', name: 'Peter Attia', role: 'Longevity physician',
    img: null, mono: 'PA', tone: '#3A4E63', apart: 3,
    why: 'Similar lipid profile and training load.',
    diverge: 'His ApoB is under 50. That is a two-year project, not a quarter.',
    rows: [
      { sys: 'Heart & vascular', you: 'B', them: 'A' },
      { sys: 'Metabolic',        you: 'A', them: 'A' },
      { sys: 'Fitness',          you: 'B', them: 'A' },
      { sys: 'Thyroid',          you: 'B', them: 'B' },
    ],
  },
  {
    id: 'p_sabri', name: 'Lilly Sabri', role: 'Physiotherapist',
    img: '/twins/lillysabri.jpg', apart: 4,
    why: 'Comparable body composition trajectory.',
    diverge: 'Her training volume is roughly double yours.',
    rows: [
      { sys: 'Body composition', you: 'B', them: 'A' },
      { sys: 'Fitness',          you: 'B', them: 'A' },
      { sys: 'Inflammation',     you: 'A', them: 'A' },
      { sys: 'Sleep & recovery', you: 'B', them: 'B' },
    ],
  },
];
/* Where you sit in the corpus — the moat, stated as a distribution rather
   than a promise. */
export const COHORT = {
  n: 1240, startedLike: 312,
  after12: [
    { band: 'Moved two grades', pct: 18 },
    { band: 'Moved one grade',  pct: 47 },
    { band: 'No change',        pct: 26 },
    { band: 'Went backwards',   pct: 9 },
  ],
  note: 'Of 312 twins who started with ferritin under 50, most moved one grade in twelve weeks. Nine per cent got worse — usually adherence, occasionally the wrong protocol.',
};

/* ── THE LADDER ──
   Deliberately a SHAPE and not a rung. A single "you are level 4 of 7" hides
   the only useful information, which is where the gap actually is. */
export const LADDER = [
  { sys: 'Heart & vascular', you: 72, peak: 96, unit: 'ApoB 64 → under 50' },
  { sys: 'Metabolic',        you: 88, peak: 98, unit: 'HbA1c 5.2 → under 5.0' },
  { sys: 'Nutrients',        you: 74, peak: 95, unit: 'Ferritin 71 → 90–120' },
  { sys: 'Fitness',          you: 54, peak: 97, unit: 'VO₂max 42 → 55+' },
  { sys: 'Sleep & recovery', you: 66, peak: 94, unit: 'HRV 54 → 70+' },
  { sys: 'Sex hormones',     you: 61, peak: 92, unit: 'Free T 12.4 → 18+' },
];
export const LADDER_FIXED = [
  'Height, frame and bone structure',
  'ACTN3 — your sprint/endurance bias',
  'APOE genotype',
  'Age, which only moves one way',
];

/* ── TRAJECTORY ──
   Sourced from the cohort, never from a model prediction. "People like you who
   ran this got here" is a comparison; "you will reach X" is a clinical claim. */
export const TRAJECTORY = [
  { sys: 'Nutrients', marker: 'Ferritin', now: 71, target: 95, weeks: 9,
    basis: '312 twins with your starting value', spread: '6–14 weeks' },
  { sys: 'Heart & vascular', marker: 'ApoB', now: 64, target: 50, weeks: 28,
    basis: '198 twins on a comparable protocol', spread: '20–40 weeks' },
  { sys: 'Sex hormones', marker: 'Free T', now: 12.4, target: 18, weeks: 16,
    basis: '84 twins, sleep-first protocol', spread: '12–26 weeks' },
];

/* ── DANGERS ──
   Conditional rules, not warnings. "Watch your ApoB" is advice; "if ApoB
   crosses 90 we stop this protocol" is what a clinician actually holds in
   their head, and it is the thing worth productizing. */
export const DANGERS = [
  { k: 'hct', t: 'Haematocrit above 52%', act: 'We pause the testosterone protocol and retest in two weeks',
    why: 'Rising haematocrit thickens blood. It is the main reason T protocols get stopped.', armed: true },
  { k: 'apob', t: 'ApoB crosses 90 mg/dL', act: 'Protocol stops and you see a prescriber inside 48 hours',
    why: 'Above 90 the arterial risk outweighs anything the current protocol is buying you.', armed: true },
  { k: 'hrv', t: 'HRV drops two weeks running', act: 'Hard sessions come off the plan automatically',
    why: 'A sustained HRV fall on a training block means you are digging a hole.', armed: true },
  { k: 'iron', t: 'Coffee within 2h of iron', act: 'A reminder moves your coffee, not your dose',
    why: 'Polyphenols cut iron absorption by roughly half. Timing is free; a wasted dose is not.', armed: true },
  { k: 'preg', t: 'Pregnancy intent inside 12 months', act: 'Enclomiphene comes off and you get a fertility review first',
    why: 'Fertility planning changes what is safe to run.', armed: false },
];

/* A full twin, so every feature can be judged before the pipeline exists. */
export const DEMO_QA = {
  age: 34, gender: 'Male', place: 'Al Olaya, Riyadh', cm: 178, weight: 91,
  work: 'Desk-bound', smoke: 'Non-smoker', drink: 'Special occasions',
  move: '3–4× a week', train: ['Lifting', 'Padel'],
  food: ['Grilled meat', 'Rice', 'Salads'], sleep: '7–8 h', stress: 'Manageable',
  goal: 'long', goal2: ['Better sleep', 'Sharper focus'],
};
