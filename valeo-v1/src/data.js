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
    t: 'Sleep & Recovery', wk: 8, cat: 'sleep', mk: 'HRV + sleep latency',
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
    t: 'Weight Loss', wk: 12, cat: 'fat', mk: 'HbA1c',
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
    t: 'Skin & Anti-Ageing', wk: 12, cat: 'looks', mk: 'Collagen density',
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
    t: 'Peak Athlete', wk: 16, cat: 'perf', mk: 'VO₂max + lactate',
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
    t: 'Longevity', wk: 24, cat: 'long', mk: 'ApoB, hsCRP',
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
    t: 'Testosterone', wk: 16, cat: 'energy', mk: 'Total + free T',
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
    t: 'Focus & Brain', wk: 12, cat: 'energy', mk: 'Reaction time',
    goal: 'Hold deep focus for longer without the 3pm collapse',
    stack: ['Creatine 5 g daily — cognitive, not just muscular', 'Zone 2 cardio 150 min a week',
            'Glucose variability under control', 'Caffeine timed to your chronotype'],
    risk: 'Nothing here is stimulant-led, so gains are slower and hold longer.',
    wrongFor: 'Untreated sleep apnoea — fix the airway before anything else.',
  },

  /* ── THE GENERATED ONE ──
     Assembled from the twin rather than borrowed from an influencer, which is
     why it carries his own name in the byline slot where a twin's would go.

     It targets Limbs and Sleep on purpose: Longevity is already running on his
     chest, and two protocols competing for the same subsystem make neither
     verdict attributable. It also keeps creatine — the simulator had already
     cleared it against his eGFR of 98, and a generated protocol that ignores
     what the simulation just established is not a generated protocol, it is a
     template with a new title. */
  P_FAISAL: {
    byline: 'Faisal',
    own: true,
    arc: [
      { to: 4,  t: 'Aerobic base', b: 'Nothing hard yet. Zone 2 is the foundation everything else is built on, and rushing it is the most common way this fails.' },
      { to: 10, t: 'Intervals in', b: 'One hard session a week. VO₂max moves slowly and then all at once — expect nothing for six weeks.' },
      { to: 16, t: 'Composition', b: 'Strength and protein are now doing the work. Fat goes down while muscle holds, which is what the retest checks.' },
    ],
    milestones: [
      { d: 28, t: 'Intervals start' },
      { d: 84, t: 'Body composition check' },
    ],
    price: 2650, blood: 'maybe',
    items: [
      { k: 'hab', t: 'Zone 2 base',          d: '180 min a week, across 4 sessions', w: 'wk' },
      { k: 'hab', t: 'VO₂max intervals',     d: '1× a week, 4×4 min hard', w: 'wk' },
      { k: 'hab', t: 'Compound lifts',       d: '3× a week, full body', w: 'wk' },
      { k: 'sup', t: 'Creatine monohydrate', d: '5 g daily, any time', w: 'am' },
      { k: 'hab', t: 'Protein floor',        d: '1.6 g per kg bodyweight, daily', w: 'food' },
      { k: 'sup', t: 'Magnesium threonate',  d: '400 mg, 2h before bed', w: 'pm' },
    ],
    amend: {
      changed: ['Intervals held to week 4 — the base comes first'],
      added:   ['Ferritin recheck at week 8 — iron caps VO₂max'],
      flagged: ['If resting heart rate climbs two weeks running, the volume comes down'],
    },
    t: "Faisal's protocol", wk: 16, cat: 'perf', mk: 'VO₂max + body fat %',
    goal: 'Build the aerobic engine and lose fat without losing muscle',
    stack: ['Zone 2, 180 min a week', 'VO₂max intervals once a week',
            'Compound lifts 3× a week', 'Creatine 5 g daily', 'Protein floor 1.6 g/kg'],
    risk: 'Doing the intervals before the base is built is how people stall. Creatine adds 1–2 kg of water in the first fortnight — that is not fat.',
    wrongFor: 'Anyone with uncontrolled blood pressure, until that is handled first.',
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
/* ── ASSET PATHS MUST CARRY THE BASE ──
   Vite rewrites the asset URLs it can see: real imports, and url() in CSS.
   These are plain strings in a data file, so it cannot see them, and a leading
   slash means "the domain root". That is correct on a dev server at / and
   wrong the moment the app is served from a subpath — on GitHub Pages
   /team/jamie.jpg resolves to the wrong host directory and 404s, which is why
   the portraits vanished after the site went live.

   BASE_URL is "/" in development and "/valeo-loop-prototype/v1/" in the build,
   and it always ends in a slash, so the argument must not start with one. */
const asset = (p) => `${import.meta.env.BASE_URL}${p}`;

export const TWINS = [
  { id: 'w1', name: 'Lilly Sabri',  role: 'Physiotherapist · 4.9M subs', handle: '@lillysabri',
    img: asset('twins/lillysabri.jpg'), mono: 'LS', tone: '#8E3A44', match: 84, tier: 'open',
    protocol: 'P_WEIGHT', hook: '4.9M follow her fat-loss protocol' },
  { id: 'w2', name: 'Hamza Salah',  role: 'Model & trainer · Dubai', handle: '@hamzasalah',
    img: asset('twins/hamzasalah.jpg'), mono: 'HS', tone: '#9C6A2A', match: 79, tier: 'open',
    protocol: 'P_SKIN', hook: 'Top 1% of Dubai run this before shoots' },
  { id: 'w3', name: 'IShowSpeed',   role: 'Streamer · 40M+ following', handle: '@ishowspeed',
    img: asset('twins/ishowspeed.jpg'), mono: 'IS', tone: '#2C6B45', match: 71, tier: 'open',
    protocol: 'P_ATH', hook: 'What the next generation trains like' },

  { id: 'w4', name: 'Andrew Huberman', role: 'Neuroscientist · Stanford', handle: '@hubermanlab',
    img: asset('twins/huberman.jpg'), mono: 'AH', tone: '#2E4A6B', match: 91, tier: 'adv',
    protocol: 'P_SLEEP', hook: 'The most copied protocol on the internet' },
  { id: 'w5', name: 'Bryan Johnson', role: 'Blueprint', handle: '@bryan_johnson',
    img: asset('twins/bryanjohnson.jpg'), mono: 'BJ', tone: '#254A73', match: 93, tier: 'adv',
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

/* V1 ships four protocols, so there are four goals. Sub-goals exist because
   "lose weight" is not a brief — 8 kg and 30 kg are different protocols run by
   different people, and asking one extra tappable question here saves the
   doctor the first ten minutes of the call. */
export const GOALS = [
  {
    k: 'fat', ic: '⚖️', t: 'Lose weight', say: 'Lose weight',
    sub: ['Under 10 kg to lose', '10–20 kg to lose', '20 kg or more',
          'Keep muscle while cutting'],
  },
  {
    k: 'test', ic: '⚡', t: 'Raise testosterone', say: 'Improve sexual health',
    sub: ['Low energy and drive', 'Struggling to build muscle',
          'Already have low results on paper'],
  },
  {
    k: 'long', ic: '🧬', t: 'Live longer, healthier', say: 'Live longer',
    sub: ['Something that runs in my family', 'Heart and metabolic health',
          'Lower my biological age'],
  },
  {
    k: 'post', ic: '🤍', t: 'Postpartum recovery', say: 'Recover after birth',
    sub: ['First 3 months after birth', '3–12 months after birth',
          'Energy, iron and mood', 'Getting my strength back'],
  },
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
  short: 'Dr. Mahmoud',
  img: asset('team/mahmoud.jpg'),
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
/* ══════════════════════════════════════════════════════════════════════════
   LOCKS — a property of a card, not a mode of the screen
   ══════════════════════════════════════════════════════════════════════════

   Tier used to be screen state: you swiped UP to change which tier the deck was
   showing, so Advanced and Elite were places you travelled to. Two axes of swipe
   is one too many — the vertical one had to be taught, and it hid two thirds of
   the catalogue behind a gesture most people never tried.

   So tier is now something a card carries. One deck, one axis, and a locked card
   sits in the sequence where you can see it: the thing you cannot have yet is far
   more motivating in the run of play than behind a door. */
export function lockOf(tw, st) {
  /* Elite needs a baseline before we will score anything against it. */
  if (tw.tier === 'elite' && !st.blood) return { kind: 'blood' };
  const owed = owedBy(tw, st);
  if (tw.blur && owed.length && !(st.revealed || []).includes(tw.id)) {
    return { kind: 'answers', owed };
  }
  return null;
}

/* One deck, ordered to teach.

   Value first — two cards you can actually have — then locked ones woven in one
   at a time. Front-loading the locks reads as a paywall; burying them means
   nobody learns there is more. Deterministic, so the deck does not reshuffle
   under the user between renders. */
export function deckOf(st) {
  const pool = TWINS.filter((w) => !st.saved.includes(w.protocol) && !st.passed.includes(w.id));
  const open = pool.filter((w) => !lockOf(w, st));
  const shut = pool.filter((w) => lockOf(w, st));
  const out = [];
  let i = 0, j = 0;
  /* Two you can have, then one you cannot, repeating. Once the open ones run out
     the rest of the locked ones follow. */
  while (i < open.length || j < shut.length) {
    for (let n = 0; n < 2 && i < open.length; n += 1) { out.push(open[i]); i += 1; }
    if (j < shut.length) { out.push(shut[j]); j += 1; }
    if (i >= open.length && j >= shut.length) break;
  }
  return out;
}

/* ══════════════════════════════════════════════════════════════════════════
   THE HOST APP — Valeo's existing home
   ══════════════════════════════════════════════════════════════════════════

   Protocols are a module inside Valeo's app, not an app. That is not a framing
   nicety, it decides the integration: Valeo's bottom nav already has five items
   and is not getting three more, so the entire product hangs off ONE card on a
   home screen it does not own.

   Which makes that card the highest-leverage surface in the whole thing. It is
   the only place a user who is not currently thinking about protocols will be
   reminded that a loop is open — so it has to answer, in one glance and in every
   lifecycle state, "what does this want from me right now". */
export const VALEO_SERVICES = [
  { k: 'labs',   t: 'Lab Tests' },
  { k: 'weight', t: 'Weight Loss' },
  { k: 'iv',     t: 'IV Therapy' },
  { k: 'pep',    t: 'Peptide Therapy' },
  { k: 'supp',   t: 'Supplements' },
  { k: 'hair',   t: 'Hair Growth' },
  { k: 'baby',   t: 'Newborn Care' },
  { k: 'doc',    t: 'Doctor on Call' },
  { k: 'elder',  t: 'Elderly Care' },
];

/* ── THE CARD ──
   One resolver for every state the module can be in, because the card is the
   module's whole presence on the host home screen. `go` is where a tap lands:
   'start' begins onboarding, 'plan' opens the shortlist, 'today' opens the run,
   'detail' opens the protocol, 'results' opens the verdict.

   Ordered by urgency, not by lifecycle: a finished protocol nobody has read yet
   outranks a running one, because the verdict is the thing the user paid for and
   the thing they will churn over if it goes unseen. */
export function homeCard(st, phase = 1) {
  const act = activeRuns(st);
  const done = completedRuns(st);
  const kept = savedOnly(st);
  const onboarded = !!(st.qa && st.qa.goal);

  /* results read but not opened — top priority */
  const unseen = done[0];
  if (unseen) {
    return {
      kind: 'done', go: 'results', pKey: unseen.k,
      tag: 'Your results are in',
      title: `${unseen.p.t}`,
      sub: `${unseen.p.wk} weeks done · read by ${(coachOf(unseen.k) || DOCTOR).name}`,
      cta: 'See what changed', tone: 'green',
    };
  }

  if (act.length) {
    const f = focusRun(st);
    const r = f.run;
    const p = f.p;
    const L = RX_LABEL[f.status];

    if (f.status === 'running') {
      const hero = heroStreams(st, f.k)[0] || null;
      const due = capturesFor(r, r.day, st.devices || []).filter((c) => c.due).length;
      return {
        kind: 'running', go: 'today', pKey: f.k,
        tag: 'Your protocol',
        title: p.t,
        sub: `Week ${Math.ceil(r.day / 7)} of ${p.wk} · ${due} task${due === 1 ? '' : 's'} due today`,
        cta: 'View my plan',
        progress: r.day / r.total,
        /* the reference design carries a marker delta, and it earns its place:
           it is the only thing on the card that says the run is working */
        delta: hero ? `${hero.from} ${hero.unit} → ${hero.to} ${hero.unit}` : null,
        more: act.length > 1 ? `${act.length} running` : null,
        tone: 'yellow',
      };
    }

    if (f.status === 'verdict') {
      return {
        kind: 'verdict', go: 'today', pKey: f.k,
        tag: `${p.wk} weeks done`,
        title: 'Time to find out.',
        sub: `Retest ${p.mk} and read it with ${(coachOf(f.k) || DOCTOR).name}`,
        cta: 'Book my retest', tone: 'yellow',
      };
    }

    if (f.status === 'reviewing') {
      return {
        kind: 'reviewing', go: 'today', pKey: f.k,
        tag: 'With your doctor',
        title: p.t,
        sub: `Results read on ${r.reviewSlot || 'your call'}`,
        cta: 'See where it stands', tone: 'teal',
      };
    }

    /* booked · ready · shipping — the pre-run pipeline */
    return {
      kind: 'pipeline', go: 'detail', pKey: f.k,
      tag: L.t,
      title: p.t,
      sub: f.status === 'booked' ? `Consult ${(r.slot || '').toLowerCase()}`
        : f.status === 'ready' ? `Reviewed and ready to start`
          : 'On its way to you',
      cta: f.status === 'ready' ? 'Start it' : 'See where it stands', tone: 'teal',
    };
  }

  if (kept.length) {
    return {
      kind: 'saved', go: 'detail', pKey: kept[0].k,
      tag: 'Not started',
      title: kept[0].p.t,
      sub: `${kept[0].p.wk} weeks · book a consult to begin`,
      cta: 'Book my consult', tone: 'teal',
    };
  }

  if (onboarded) {
    return {
      kind: 'shortlist', go: 'plan',
      tag: 'Your shortlist is ready',
      title: 'Three worth your time.',
      sub: 'Matched to the answers you gave us',
      cta: 'See my matches', tone: 'yellow',
    };
  }

  /* never engaged — the only state that has to sell */
  return {
    kind: 'intro', go: 'start',
    tag: 'New at Valeo',
    title: 'Personalized health plans built by doctors.',
    /* ACQUISITION LANGUAGE ≠ PRODUCT LANGUAGE.
       "Protocol" is our word, not theirs — nobody wakes up wanting one. It is
       gone from every surface before commitment and kept everywhere after,
       where it names something precise: the thing a doctor amends and we
       retest. The CTA names the PERSON, because the person is the product. */
    sub: 'Tell us your goal. A doctor builds your plan. Your AI coach keeps you on track.',
    cta: phaseHas(phase, 'twin') ? buildWords(phase).cta : 'Find my doctor',
    tone: 'yellow',
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   PHASES — what ships when
   ══════════════════════════════════════════════════════════════════════════

   Three demos from one build. Three copies of a codebase diverge inside a week
   and the design team ends up reviewing a stale one, so the phases are a flag
   rather than a fork.

   Cut by CAPABILITY, not by screen, because that is what makes each phase
   independently shippable and fixes the order:

     1 · THE LOOP       can a person run a protocol to the end and come back
                        for the retest? Needs nothing else to be true.
     2 · DISCOVERY      choice and acquisition — deck, catalogue, tiers.
                        Needs phase 1's protocol content.
     3 · THE TWIN       the model of you — score, subsystems, predicted vs
                        observed across runs. Needs phase 1's CLOSED LOOPS,
                        or every number on it is invented.

   Phase 3 cannot come earlier for that last reason: LEVELS, PROTO_HITS and
   deliveryFor are all downstream of completed runs. Ship the twin first and you
   ship the poster without the proof. */
export const PHASES_APP = {
  1: {
    n: 1, t: 'The Loop',
    s: 'Onboard, get up to three recommendations, run one to a verdict.',
    has: ['onboarding', 'recommend', 'protocol', 'consult', 'buy', 'today', 'verdict', 'results'],
  },
  2: {
    n: 2, t: 'Discovery',
    s: 'Everything in phase 1, plus the deck, the catalogue and locked tiers.',
    has: ['onboarding', 'recommend', 'protocol', 'consult', 'buy', 'today', 'verdict', 'results',
          'discover', 'catalog', 'tiers'],
  },
  3: {
    n: 3, t: 'The Twin',
    s: 'Everything, plus the longevity score, subsystems, Peak and simulation.',
    has: ['onboarding', 'recommend', 'protocol', 'consult', 'buy', 'today', 'verdict', 'results',
          'discover', 'catalog', 'tiers', 'twin', 'score', 'peak', 'sim', 'chat'],
  },
};

export function phaseHas(phase, feature) {
  const p = PHASES_APP[phase] || PHASES_APP[3];
  return p.has.includes(feature);
}

/* THE ONE PROMISE, IN ONE PLACE.
   The same sentence is spoken on four screens in a row — the host card, the
   intro, the last question, and the loader — and it must be the same sentence,
   because a user who taps "Build my plan" and is then offered "Show me my
   matches" has been handed a different product mid-flow.

   It lives here because it already drifted once: editing the word "twin" out of
   one CTA left the old verb behind, and nothing in four separate files could
   notice. */
export function buildWords(phase) {
  return phaseHas(phase, 'twin')
    ? { cta: 'Build my twin', ing: 'Building your twin.' }
    : { cta: 'Build my plan', ing: 'Building your plan.' };
}

/* ── RECOMMENDATIONS ──
   Phase 1 has no deck and no catalogue, so the whole of discovery is one screen
   of at most three protocols.

   Three because it is the largest set a person compares without deferring the
   decision, and because a shortlist is a claim: we are saying these are the ones
   worth your money, which is a stronger and more falsifiable statement than a
   feed. In phase 1 a human clinician picks them — this function is the rule they
   would apply, and it is what the matching engine has to beat later.

   Stored, never recomputed on display: you have to know what a user was actually
   shown at the moment they chose. */
export function recommendFor(st, limit = 3) {
  const goal = st.qa ? st.qa.goal : null;
  const scored = Object.keys(PROTOCOLS)
    .filter((k) => !PROTOCOLS[k].own)          /* generated protocols are not offers */
    .map((k) => {
      const p = PROTOCOLS[k];
      const tw = twinFor(k);
      return {
        k, p, tw,
        /* stated goal first, then match strength — the order a clinician
           reading the intake would arrive at */
        onGoal: p.cat === goal,
        match: tw ? matchFor(tw, st) : 70,
        why: p.cat === goal
          ? 'Matches the goal you picked'
          : `Strong fit for what you told us`,
      };
    })
    .sort((a, b) => (b.onGoal - a.onGoal) || (b.match - a.match));
  return scored.slice(0, limit);
}

/* ── THE CATALOGUE ──
   Swiping is discovery by serendipity: good at showing you something you would
   not have searched for, useless if you arrived knowing what you want. A
   goal-first catalogue is the other half, and they are not redundant — one is
   browse, one is look-up.

   It browses by the SAME six goals the onboarding asked about, not a parallel
   taxonomy invented for a shelf. The user already told us which of these they
   care about, so the catalogue can lead with it — and inventing a second set of
   category names would mean the app describes its own products two ways. */
export function catList(st) {
  const mine = st && st.qa ? st.qa.goal : null;
  return GOALS.map((g) => ({
    ...g,
    keys: Object.keys(PROTOCOLS).filter((k) => PROTOCOLS[k].cat === g.k),
    yours: g.k === mine,
  })).filter((g) => g.keys.length)
    /* what they said they wanted, first */
    .sort((a, b) => (b.yours ? 1 : 0) - (a.yours ? 1 : 0));
}

/* Matches title, goal, the marker it is scored on, and the names of the things
   inside it — so "tirzepatide" finds Weight Loss, which is how people actually
   search for a protocol they half-remember. */
export function searchProtocols(q) {
  const needle = q.trim().toLowerCase();
  const keys = Object.keys(PROTOCOLS);
  if (!needle) return keys;
  return keys.filter((k) => {
    const p = PROTOCOLS[k];
    const g = GOALS.find((x) => x.k === p.cat);
    const hay = [p.t, p.mk, p.goal, p.cat, g ? g.t : '', ...(p.items || []).map((i) => i.t)]
      .join(' ').toLowerCase();
    return hay.includes(needle);
  });
}

/* the twin who fronts a protocol, where one does */
export function twinFor(pKey) { return TWINS.find((t) => t.protocol === pKey) || null; }

/* A protocol with no influencer behind it still needs an identity to render in
   surfaces built around twins — the catalogue lists protocols, not personalities.
   Its own byline stands in rather than every consumer branching on null. */
export function twinOrSelf(pKey) {
  const tw = twinFor(pKey);
  if (tw) return tw;
  const p = PROTOCOLS[pKey];
  return {
    id: 'self:' + pKey, protocol: pKey, self: true,
    name: p.byline || 'Valeo', role: p.own ? 'Built from your twin' : 'Valeo protocol',
    img: null, mono: (p.byline || 'V')[0], tone: '#1B395B',
    match: 100, tier: 'open',
  };
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
  booked:   { t: 'Consultation booked',c: 'yellowDeep' },
  /* ── the middle of the journey ──
     Between the first consultation and a finished plan there is either nothing
     (the clinician had enough to go on) or an entire arc: bloods requested,
     bloods booked, bloods taken, a follow-up to read them. These were invisible
     before — the demo jumped from "booked" straight to "ready" — which is
     exactly the part of real care the product is meant to carry. */
  consulted:   { t: 'Consultation done',   c: 'teal' },
  programme:   { t: 'Programme active',    c: 'green' },
  bloodsBooked:{ t: 'Blood draw booked',   c: 'teal' },
  bloodsDone:  { t: 'Results with doctor', c: 'teal' },
  followup:    { t: 'Follow-up booked',    c: 'yellowDeep' },
  ready:    { t: 'Ready to buy',       c: 'green' },
  shipping: { t: 'On the way',         c: 'teal' },
  running:  { t: 'Running',            c: 'green' },
  verdict:  { t: 'Retest due',         c: 'yellowDeep' },
  /* the closing half of the loop — without these the protocol list throws the
     moment a run finishes, which is the one moment it must not */
  reviewing:{ t: 'Review booked',      c: 'yellowDeep' },
  done:     { t: 'Complete',           c: 'green' },
};

/* Consult slots. Same-day is the point — the call is what unblocks everything. */
/* ── SCHEDULED, NOT CONNECTED ──
   The consultation used to begin by looking for whoever was free at that
   second. That is a marketplace behaviour: it makes the patient wait on a
   queue they cannot see, and it fails in the one way a clinic must not, by
   having nobody there.

   So every consultation is booked, and the times offered are the next hour:
   in 30, 45 or 60 minutes. It is still same-day care — the difference is that
   the patient leaves with a time in their hand instead of a spinner.

   Computed at the moment the picker opens, in the patient's own clock. */
export const SLOT_OFFSETS = [30, 45, 60];

export function immediateSlots(now = new Date()) {
  return SLOT_OFFSETS.map((mins) => {
    const at = new Date(now.getTime() + mins * 60000);
    return { d: 'Today', t: clockOf(at), mins, at: at.getTime(),
             note: `in ${mins} minutes` };
  });
}

export function clockOf(d) {
  let h = d.getHours();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

/* The link opens ten minutes before the slot, which is the only honest thing
   to tell someone who books a call for later this hour. */
export const LINK_OPENS_MINUTES = 10;

export const CONSULT_SLOTS = [
  { d: 'Today',    t: '6:30 pm', note: 'Next available' },
  { d: 'Today',    t: '8:00 pm' },
  { d: 'Tomorrow', t: '9:00 am' },
  { d: 'Tomorrow', t: '1:30 pm' },
  { d: 'Tomorrow', t: '7:00 pm' },
  { d: 'Thursday', t: '11:00 am' },
  { d: 'Thursday', t: '4:00 pm' },
  { d: 'Thursday', t: '8:30 pm' },
];

/* A fasting draw is a morning appointment. Offering 6:30 pm next to "fast for
   10 hours" is the kind of small incoherence that tells a patient nobody joined
   these two screens up. */
export const BLOOD_SLOTS = [
  { d: 'Tomorrow', t: '7:00 am', note: 'Earliest' },
  { d: 'Tomorrow', t: '8:30 am' },
  { d: 'Thursday', t: '7:00 am' },
  { d: 'Thursday', t: '9:00 am' },
  { d: 'Friday',   t: '7:30 am' },
];

/* Grouped the way a calendar is read: by day, then by time. */
export function slotsByDay(list) {
  const out = [];
  (list || CONSULT_SLOTS).forEach((s) => {
    const row = out.find((r) => r.d === s.d);
    if (row) row.times.push(s); else out.push({ d: s.d, times: [s] });
  });
  return out;
}

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
/* The demo user. One record, because a name hardcoded into a greeting is a name
   that drifts out of step with everything else that refers to him. */
export const USER = { first: 'Faisal', full: 'Faisal Al-Otaibi', city: 'Riyadh' };

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

/* Which captures are due today, and what a paired device has taken over.
   `devices` comes from the user, not the run: pairing a ring once should retire
   manual sleep logging on every protocol, not just the one you happened to be
   running that week. */
export function capturesFor(rx, day, devices = []) {
  const dropped = devices.flatMap((d) => DEVICES[d].drops);
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
  const f = focusRun(st);
  const rx = f ? f.run : null;
  if (st.devices && st.devices.length) {
    out.push({ k: 'dev', t: DEVICES[st.devices[0]].t + ' is covering sleep now',
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
    img: asset('twins/huberman.jpg'), apart: 2, why: 'Sleep architecture and ApoB sit close to yours.',
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
    img: asset('twins/lillysabri.jpg'), apart: 4,
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

/* ══════════════════════════════════════════════════════════════
   PEAK — the aspirational lens
   ══════════════════════════════════════════════════════════════
   Not history. "Here is this region at peak performance, and the three moves
   that get you there." Plain language on purpose: nobody thinks in ferritin,
   they think "my blood" — so the step says the thing, and the marker stays in
   the CTA where it belongs.

   Steps unlock in sequence because that is how they actually work. Showing
   three simultaneous asks produces none of them.                            */
/* ── LEVELS ──
   Every subsystem on one 0–100 scale: where it was at baseline, where it is
   now, and where peak sits for his age.

   A level is not a lab value and never replaces one. It exists because Ferritin
   in µg/L and HRV in ms cannot share a column, and without a shared column
   there is no such thing as a body-wide view. The lab value always travels
   beside the level — the level summarises, the marker is the evidence.

   `now - was` is the only number here that has to be defended, because it is
   the one the product is selling. Every point of it is either attributed to a
   protocol below or left unattributed on purpose. A protocol may not claim
   movement it did not cause; attribution IS the product. */
export const LEVELS = {
  /* head & neck — in the red band, and the region the hair clip belongs to. The
     weight sits on sleep and stress, both self-reported: nothing has measured
     them, which is exactly why they are the weakest. Thyroid stays mid-band
     because its marker (TSH 3.1) is genuinely in range — dragging it down to
     force the region red would put a "needs work" label on a normal lab. */
  sleep:   { was: 24, now: 30, peak: 94 },
  thyroid: { was: 45, now: 58, peak: 92 },
  stress:  { was: 26, now: 28, peak: 90 },
  /* chest */
  nutri:   { was: 41, now: 78, peak: 95 },
  inflam:  { was: 66, now: 88, peak: 96 },
  heart:   { was: 62, now: 69, peak: 94 },
  /* core */
  hormone: { was: 47, now: 63, peak: 93 },
  metab:   { was: 74, now: 86, peak: 96 },
  kidney:  { was: 88, now: 89, peak: 97 },
  liver:   { was: 91, now: 92, peak: 98 },
  /* limbs — the only region in the red band, and the only one no protocol is
     working on. Both are self-reported, which is exactly why they are the
     weakest: nothing has measured them. */
  comp:    { was: 30, now: 38, peak: 95 },
  fitness: { was: 26, now: 34, peak: 97 },
};

/* ── PROTOCOL → SUBSYSTEM ──
   What a protocol is actually working on, and how much of the gap it should
   close in each one.

   `exp` is the level gain a full run is expected to deliver. `got` is the part
   a retest has already confirmed. The difference between them is what the
   protocol still owes you, and drawing that gap is what gives a twelve-week
   protocol something to show in week three. Without it, nothing visibly happens
   between blood draws and adherence collapses in the gap.

   `got` is only ever non-zero where a panel measured it. Everything else is a
   forecast and is drawn as one. */
export const PROTO_HITS = {
  P_LONG:   [{ sys: 'nutri',   exp: 42, got: 37 },
             { sys: 'inflam',  exp: 26, got: 22 },
             { sys: 'heart',   exp: 25, got: 7  }],
  P_SLEEP:  [{ sys: 'sleep',   exp: 33, got: 0 },
             { sys: 'stress',  exp: 16, got: 0 },
             { sys: 'hormone', exp: 11, got: 0 }],
  P_WEIGHT: [{ sys: 'comp',    exp: 30, got: 0 },
             { sys: 'metab',   exp: 9,  got: 0 }],
  P_TEST:   [{ sys: 'hormone', exp: 26, got: 0 },
             { sys: 'sleep',   exp: 12, got: 0 }],
  P_ATH:    [{ sys: 'fitness', exp: 41, got: 0 },
             { sys: 'comp',    exp: 19, got: 0 }],
  P_SKIN:   [{ sys: 'inflam',  exp: 7,  got: 0 },
             { sys: 'nutri',   exp: 9,  got: 0 }],
  P_FOCUS:  [{ sys: 'stress',  exp: 21, got: 0 },
             { sys: 'sleep',   exp: 14, got: 0 }],
  P_FAISAL: [{ sys: 'fitness', exp: 41, got: 0 },
             { sys: 'comp',    exp: 30, got: 0 },
             { sys: 'sleep',   exp: 14, got: 0 }],
};

/* ── THE THREE ZONES ──
   One scale, split into three named bands, used identically on the dial and on
   every subsystem bar. Fixed boundaries, not percentiles: a band that moves with
   the population would make a level mean something different every month.

       0 ──────────── 40 ──────────────────── 90 ──── 100
         needs work      healthy               peak

   Red is deliberately wide and low. A subsystem does not need to be broken to
   sit in it — it needs to be somewhere a clinician would act. And red never
   appears without its three steps directly underneath, because a warning with
   no move attached is just anxiety with a colour.

   The peak band is narrow on purpose. Peak is meant to be hard. */
export const ZONES = [
  { k: 'red',     t: 'Needs work', from: 0,  to: 40,  c: '#C4333F' },
  { k: 'healthy', t: 'Healthy',    from: 40, to: 90,  c: '#27995B' },
  { k: 'peak',    t: 'Peak',       from: 90, to: 100, c: '#FFB900' },
];

/* The top of the healthy band. Now-mode aims here rather than at peak: getting
   out of trouble and chasing the last five points are different jobs, and
   showing one target for both is how a screen stops being actionable. */
export const OPTIMUM = 90;

export function zoneOf(v) {
  return ZONES.find((z) => v < z.to) || ZONES[ZONES.length - 1];
}
export function zoneColor(v) { return zoneOf(v).c; }

/* ── THE LONGEVITY SCORE ──
   One number for the whole body, computed from the twelve subsystem levels and
   never stored.

   A single composite is the most dangerous object in this category: identical
   blood produced biological ages of 37.3 and 45.2 at two competitors, and the
   reason is that both invented a weighting nobody could inspect. So this one is
   a plain unweighted mean — Kidney counts exactly as much as Heart — because a
   score you can explain in one sentence beats a score that sounds cleverer and
   cannot be defended. It always ships with three things: the delta that earned
   it, the peak it is measured against, and one tap to the parts.

   If this ever needs weighting, the weights belong in a clinician-signed table
   with a citation, not in a helper function. */
export function longevityScore() {
  const avg = (f) => Math.round(
    SYSTEMS.reduce((n, x) => n + f(LEVELS[x.k]), 0) / SYSTEMS.length);
  return { was: avg((l) => l.was), now: avg((l) => l.now), peak: avg((l) => l.peak) };
}

/* A region's level is the mean of its subsystems, computed rather than stored,
   so the body view and the subsystem list can never drift apart. Two numbers
   for the same thing is how the 37.3-versus-45.2 problem starts. */
export function regionLevel(regionKey) {
  const inside = SYSTEMS.filter((x) => x.region === regionKey);
  const avg = (f) => Math.round(inside.reduce((n, x) => n + f(LEVELS[x.k]), 0) / inside.length);
  return { now: avg((l) => l.now), was: avg((l) => l.was), peak: avg((l) => l.peak) };
}

/* Step gains sum to exactly the gap between now and peak. If the three steps
   added up to more than the distance, the screen would be promising a body
   better than peak — and the number is the whole reason anyone believes it. */
/* Each step is a gain paired with something purchasable. "Zone 2, 180 min a
   week" described a training zone nobody outside a lab uses — it read as jargon
   and it was not clickable, so the card dead-ended. A step now names the
   protocol or the supplement that delivers it, and `buy` says where the tap goes.

   Peptides and anything prescription-grade route to a PROTOCOL, never to a
   direct purchase: a prescriber has to see them first, and that constraint is
   the product, not a technicality. Over-the-counter supplements go straight to
   checkout, because pretending they need a consult would be theatre.

   Gains still sum to exactly the distance from now to peak. */
export const PEAK_STEPS = {
  headneck: {
    steps: [
      { pct: 25, t: 'Fix your sleep',       cta: 'Sleep & Recovery protocol',
        buy: { kind: 'protocol', p: 'P_SLEEP' } },
      { pct: 18, t: 'Lower your stress',    cta: 'Magnesium + L-theanine',
        buy: { kind: 'supp', s: 'mag' } },
      { pct: 10, t: 'Thicken your hair',    cta: 'Skin & Hair protocol',
        buy: { kind: 'protocol', p: 'P_SKIN' } },
    ],
  },
  chest: {
    steps: [
      { pct: 7, t: 'Improve your blood',    cta: 'Iron + vitamin C',
        buy: { kind: 'supp', s: 'iron' } },
      { pct: 6, t: 'Protect your heart',    cta: 'Longevity protocol',
        buy: { kind: 'protocol', p: 'P_LONG' } },
      { pct: 4, t: 'Cut inflammation',      cta: 'Omega-3, 2 g EPA',
        buy: { kind: 'supp', s: 'omega' } },
    ],
  },
  core: {
    steps: [
      { pct: 7, t: 'Raise your hormones',   cta: 'Testosterone protocol',
        buy: { kind: 'protocol', p: 'P_TEST' } },
      { pct: 4, t: 'Sharpen your metabolism', cta: 'Berberine + chromium',
        buy: { kind: 'supp', s: 'berb' } },
      { pct: 2, t: 'Protect your liver',    cta: 'NAC + milk thistle',
        buy: { kind: 'supp', s: 'nac' } },
    ],
  },
  limbs: {
    steps: [
      { pct: 26, t: 'Build your engine',    cta: 'Peak Athlete protocol',
        buy: { kind: 'protocol', p: 'P_ATH' } },
      { pct: 20, t: 'Add strength',         cta: 'Creatine + electrolytes',
        buy: { kind: 'supp', s: 'creatine' } },
      { pct: 14, t: 'Protect your joints',  cta: 'Collagen + omega-3',
        buy: { kind: 'supp', s: 'collagen' } },
    ],
  },
};

/* ── WHAT A SUPPLEMENT STEP SELLS ──
   Everything needed to check out without a consult: what it is, the dose, what
   it is for, the honest caveat, and the price. `needsRx: true` would force it
   through a protocol instead — none of these do, which is why they are here. */
export const SUPPS = {
  mag:      { t: 'Magnesium + L-theanine', d: '400 mg + 200 mg, 2h before bed', price: 165,
              why: 'Shortens how long you lie awake without sedating you.',
              note: 'Can loosen stools for the first week. Starts at half dose.' },
  iron:     { t: 'Iron + vitamin C',       d: '25 mg + 500 mg, mornings, empty stomach', price: 140,
              why: 'Ferritin is your cap on oxygen transport. Vitamin C roughly doubles absorption.',
              note: 'Keep coffee 2 hours away from it or you lose most of the dose.' },
  omega:    { t: 'Omega-3',                d: '2 g EPA daily, with a meal', price: 210,
              why: 'Drives your omega-3 index toward 8%, which is where hsCRP responds.',
              note: 'Take with fat. On an empty stomach it repeats on you.' },
  berb:     { t: 'Berberine + chromium',   d: '500 mg 2× daily, before meals', price: 190,
              why: 'Blunts the post-meal glucose rise HbA1c is averaging.',
              note: 'Not alongside metformin without a prescriber.' },
  nac:      { t: 'NAC + milk thistle',     d: '600 mg + 300 mg, daily', price: 155,
              why: 'Supports glutathione, which is what your liver spends on clearance.',
              note: 'Does not offset alcohol. It is not a licence.' },
  creatine: { t: 'Creatine + electrolytes', d: '5 g daily, any time', price: 120,
              why: 'The best-evidenced supplement there is for strength and power.',
              note: 'Adds 1–2 kg of water in the first fortnight. That is not fat.' },
  collagen: { t: 'Collagen + omega-3',     d: '15 g + 1 g, post-training', price: 175,
              why: 'Tendon and joint load tolerance, which is what limits training volume.',
              note: 'Needs vitamin C alongside it to be used at all.' },
};

export function suppOf(k) { return SUPPS[k] || null; }

export function peakOf(zoneKey) {
  const z = PEAK_STEPS[zoneKey];
  if (!z) return null;
  const rg = REGIONS.find((r) => r.k === zoneKey);
  const lv = regionLevel(zoneKey);
  return { ...z, label: rg.t, now: lv.now, was: lv.was, peak: lv.peak };
}

/* Now-mode target: the top of the healthy band rather than peak.

   Same three levers as Peak — a region has the levers it has — but the gains are
   rescaled to close the distance to 90, so the numbers on the cards are the
   numbers this target actually needs. Reusing Peak's gains against a nearer
   target would overstate every card by the width of the peak band. */
export function optimumOf(zoneKey) {
  const z = PEAK_STEPS[zoneKey];
  if (!z) return null;
  const rg = REGIONS.find((r) => r.k === zoneKey);
  const lv = regionLevel(zoneKey);
  const gap = Math.max(0, OPTIMUM - lv.now);
  const total = z.steps.reduce((n, x) => n + x.pct, 0);

  /* proportional rescale, then hand the rounding remainder to the first step so
     the three cards still add up to exactly the gap */
  let spent = 0;
  const steps = z.steps.map((x, i) => {
    const pct = i === z.steps.length - 1
      ? Math.max(0, gap - spent)
      : Math.max(1, Math.round((x.pct / total) * gap));
    spent += pct;
    return { ...x, pct };
  });

  return {
    ...z, steps, label: rg.t, now: lv.now, was: lv.was, peak: OPTIMUM,
    zone: zoneOf(lv.now), atTarget: gap === 0,
  };
}

/* ── THE BODY, AS THE BODY ──
   Real footage in place of the abstract figure, region by region.

   The head is the first one because it is the only region where change is
   visible from the outside. `from`/`to` bound the usable arc of the clip — the
   last second drifts off-centre, so it is left out — and `ms` is how long the
   whole Peak transition runs. Playback rate is derived from those three, so the
   video, the score counter, the bar and the colour all land together; a clip
   that finishes early or late is the one thing that would break the effect.

   Where a region has footage, the colour ramp is suppressed. The video IS the
   transition, and running both makes the head fight the band around it. */
export const REGION_MEDIA = {
  headneck: {
    clip: '/hairgrowth.mp4', from: 0, to: 9.5, ms: 6000,
    /* A tighter isolate crop than the band would give. Keeping full body width
       is what makes a torso section read as a torso — but a head reads as a head
       on its own, and at band width the portrait renders about 38px wide, which
       is too small to see anything happen. Here the head is ~73% of the frame,
       and the bottom edge stops above y=73 so the shoulder curve of the torso
       does not cut a stray horizontal line under the chin. */
    crop: '74 16 52 53',
  },
};

export function mediaOf(zoneKey) { return REGION_MEDIA[zoneKey] || null; }

/* seconds of footage per second of wall clock */
export function clipRate(m) {
  return Math.max(0.0625, Math.min(16, (m.to - m.from) / (m.ms / 1000)));
}

/* ── EVIDENCE ──
   Which subsystem each continuously-captured stream actually speaks to.

   Weight, HRV and glucose were shown as a flat list of three, which quietly
   implied they were the result. They are not — they are proxies, and each one is
   evidence about exactly one subsystem. Filing them under the subsystem they
   belong to is what lets the verdict screen lead with what moved in the BODY and
   keep the raw streams underneath as support. */
export const EVIDENCE = {
  weight:  { sys: 'comp',    t: 'Weight',     unit: 'kg',     better: 'down' },
  hrv:     { sys: 'sleep',   t: 'HRV',        unit: 'ms',     better: 'up' },
  rhr:     { sys: 'fitness', t: 'Resting HR', unit: 'bpm',    better: 'down' },
  glucose: { sys: 'metab',   t: 'Glucose',    unit: 'mmol/L', better: 'down' },
};

/* Streams the protocol is close enough to that hiding them behind a tap would be
   perverse — a weight-loss run has to show weight on the first screen. This is a
   clinical judgement per protocol, not something to derive: the same stream is
   headline evidence for one protocol and background for another. */
export const PROTO_HERO = {
  P_WEIGHT: ['weight', 'glucose'],
  P_SLEEP:  ['hrv'],
  P_ATH:    ['rhr', 'weight'],
  P_TEST:   ['hrv'],
  P_LONG:   ['weight'],
  P_FAISAL: ['rhr', 'weight'],
  P_SKIN:   [],
  P_FOCUS:  ['hrv'],
};

/* Every stream this run actually measured, start to finish. */
export function evidenceStreams(rx, devices = []) {
  if (!rx) return [];
  const out = [];
  if (rx.body && rx.body.length > 1) {
    out.push({ k: 'weight', ...EVIDENCE.weight,
      from: rx.body[0].kg, to: rx.body[rx.body.length - 1].kg });
  }
  devices.forEach((d) => {
    const ds = deviceSeries(rx, d);
    if (ds.pts.length < 2 || !EVIDENCE[ds.k] || out.some((x) => x.k === ds.k)) return;
    out.push({ k: ds.k, ...EVIDENCE[ds.k],
      from: ds.pts[0].v, to: ds.pts[ds.pts.length - 1].v });
  });
  /* Round the endpoints, not just the delta. Unrounded floats reach the card as
     "77.60000000000001 kg", and a health product that cannot display a weight is
     not one anybody trusts with a lab value. */
  return out.map((x) => {
    const from = Math.round(x.from * 10) / 10;
    const to = Math.round(x.to * 10) / 10;
    const delta = Math.round((to - from) * 10) / 10;
    return { ...x, from, to, delta, good: x.better === 'down' ? delta < 0 : delta > 0 };
  });
}

/* ── WHAT MOVED, BY SUBSYSTEM ──
   The verdict screen's top level. Each row is a subsystem with its level delta;
   underneath it sits its own evidence — the blood marker where one exists, and
   the daily streams that report to it. Targeted subsystems first, then whatever
   else the capture happened to speak to, biggest mover first inside each group. */
export function subsystemMoves(st, pKey) {
  const streams = evidenceStreams(runOf(st, pKey), st.devices || []);
  const hits = PROTO_HITS[pKey] || [];
  const keys = [...new Set([...hits.map((h) => h.sys), ...streams.map((x) => x.sys)])];

  return keys.map((k) => {
    const sys = SYSTEMS.find((x) => x.k === k);
    const lv = LEVELS[k];
    const mv = MOVES[k];
    return {
      k, t: sys.t, region: sys.region,
      was: lv.was, now: lv.now, delta: lv.now - lv.was, peak: lv.peak,
      targeted: hits.some((h) => h.sys === k),
      marker: mv && sys.mk ? {
        mk: sys.mk, from: mv.from, to: mv.to, unit: mv.unit,
        good: mv.better === 'down' ? mv.to < mv.from : mv.to > mv.from,
      } : null,
      evidence: streams.filter((x) => x.sys === k),
      reported: !!sys.reported,
    };
  }).sort((a, b) => (b.targeted - a.targeted) || (b.delta - a.delta));
}

/* the streams promoted out of their subsystem onto the first screen */
export function heroStreams(st, pKey) {
  const want = PROTO_HERO[pKey] || [];
  return evidenceStreams(runOf(st, pKey), st.devices || [])
    .filter((x) => want.includes(x.k));
}

/* ── THE VERDICT ──
   Three outcomes and no fourth. A protocol either moved the markers it is scored
   on, moved some of them, or did not. "Inconclusive" is not offered, because it
   is the word products reach for when they do not want to say no. */
export const VERDICTS = {
  worked:  { k: 'worked',  t: 'It worked.',       c: 'green',
             s: 'Every marker this protocol is scored on moved the right way.',
             d: 'It delivered essentially what it predicted.' },
  partial: { k: 'partial', t: 'It part-worked.',  c: 'yellow',
             s: 'Some of the markers moved. One did not go far enough.',
             d: 'It delivered part of what it predicted.' },
  no:      { k: 'no',      t: 'It did not work.', c: 'coral',
             s: 'The markers this protocol is scored on did not move.',
             d: 'It delivered almost none of what it predicted.' },
};

/* The doctor's read, and what he does about it. Authored per protocol because
   this is the one part of the loop a model should not be generating: it is a
   clinician committing to an interpretation, which is the thing being sold. */
export const RESULTS_READ = {
  P_ATH: {
    read: 'VO₂max responded, which is the harder of the two to move at your age. Body composition lagged it — that is usually protein, not training. Worth checking intake before adding volume.',
    next: { t: 'Repeat with a protein floor', s: '16 weeks, 1.6 g/kg tracked, same retest' },
    stop: [],
  },
  P_SLEEP: {
    read: 'Latency came down and HRV followed. Nothing here argues for the peptide staying in — the hygiene changes did most of it, and they are free.',
    next: { t: 'Hold the habits, drop the stack', s: 'Retest HRV in 8 weeks to confirm it holds without support' },
    stop: ['DSIP — the effect held without it'],
  },
  P_LONG: {
    read: 'Ferritin corrected first and inflammation followed it down. That order matters — low iron was holding hsCRP up, so treating the iron did both jobs. ApoB moved less than I wanted. At 64 it is out of the range that concerns me, but it is not where I would leave it.',
    next: { t: 'A second loop on ApoB alone', s: '16 weeks, omega-3 raised, and a statin conversation if it stalls again' },
    stop: ['Iron and vitamin C — ferritin holds on diet from here'],
  },
  P_ATH: {
    read: 'VO₂max responded, which is the harder of the two to move at your age. Body composition lagged it — that is usually protein, not training. Worth checking intake before adding volume.',
    next: { t: 'Repeat with a protein floor', s: '16 weeks, 1.6 g/kg tracked, same retest' },
    stop: [],
  },
  P_SLEEP: {
    read: 'Latency came down and HRV followed. Nothing here argues for the peptide staying in — the hygiene changes did most of it, and they are free.',
    next: { t: 'Hold the habits, drop the stack', s: 'Retest HRV in 8 weeks to confirm it holds without support' },
    stop: ['DSIP — the effect held without it'],
  },
  P_FAISAL: {
    read: 'The aerobic base held and body composition moved with it. Nothing here argues for changing the plan.',
    next: { t: 'Extend the same protocol', s: '16 more weeks, intervals up one session a week' },
    stop: [],
  },
};

export function resultsFor(st, pKey) {
  const p = PROTOCOLS[pKey];
  const rows = subsystemMoves(st, pKey);
  const targeted = rows.filter((m) => m.targeted);
  /* only markers can decide it — a level is a summary, and self-report cannot
     carry a verdict no matter how much of it there is */
  const scored = targeted.filter((m) => m.marker);
  const hit = scored.filter((m) => m.marker.good).length;
  const d = deliveryFor(st, pKey);

  /* Blood decides where blood exists. Where it does not — VO₂max, body fat, a
     lactate curve — the protocol is judged on how much of its own prediction it
     delivered. Defaulting to "part-worked" with nothing to point at was how this
     printed "0 of 0 markers hit". */
  const basis = scored.length ? 'markers' : 'delivery';
  const k = basis === 'markers'
    ? (hit === scored.length ? 'worked' : hit === 0 ? 'no' : 'partial')
    : (d.share >= 80 ? 'worked' : d.share >= 40 ? 'partial' : 'no');
  const V = VERDICTS[k];

  /* "It worked" and "it delivered 54% of what it promised" are both true and are
     different claims — the markers moved the right way, and the prediction was
     optimistic about how far. Printing the first alone next to the second reads
     as contradiction, so where the gap is real the verdict says both. */
  let line = basis === 'markers' ? V.s : `${V.d} ${d.share}% of it, measured.`;
  if (basis === 'markers' && k === 'worked' && d.share < 70) {
    line = `Every marker moved the right way — though it delivered ${d.share}% of the size we predicted.`;
  }

  return {
    p, rows, targeted, scored, hit, basis, delivery: d,
    verdict: { ...V, s: line },
    ...(RESULTS_READ[pKey] || { read: null, next: null, stop: [] }),
    /* Where no clinician has written a read, summarise the numbers instead — and
       attribute it to the app, not to the doctor. A generated sentence in a
       doctor's voice is the one thing this screen must never do. */
    summary: RESULTS_READ[pKey] ? null : summarise(d, p),
  };
}

function summarise(d, p) {
  if (!d.rows.length) return null;
  const best = d.rows.reduce((a, b) => (b.share > a.share ? b : a));
  const worst = d.rows.reduce((a, b) => (b.share < a.share ? b : a));
  if (best.sys === worst.sys) {
    return `${best.t} landed at ${best.share}% of the predicted move. ${p.mk} is what the next loop should be scored on.`;
  }
  return `${best.t} came closest to prediction at ${best.share}%. ${worst.t} was the shortfall at ${worst.share}% — that is the one worth taking to a consult before running this again.`;
}

/* ══════════════════════════════════════════════════════════════════════════
   RUNS — the protocol lifecycle, N at a time
   ══════════════════════════════════════════════════════════════════════════

   This used to be a single `rx` slot, and that single slot was a bug with a
   schedule: starting a second protocol overwrote the first, so every screen that
   asked "what is the status of protocol X" got the answer for whatever happened
   to be in the slot. A protocol you were mid-way through would read "Not
   started" the moment you began another one.

   So runs are keyed by protocol. `st.runs[pKey]` is that protocol's own run and
   nothing else's, and status is always answered by asking about the protocol you
   named. `completed` is derived from status rather than kept as a parallel list,
   because two places to record the same fact is two places to disagree.

   One protocol still owns Today at a time — `st.focus` — because a day has one
   set of things to do and merging two protocols' checklists loses which run any
   given dose belonged to. That is a focus problem, not a storage problem. */
/* ── THE JOURNEY, REBUILT AROUND ONE PAYMENT ──
   The old flow charged twice and gated twice. A patient booked a paid first
   consultation, and then paid again for a blood test before anything that
   looked like a plan appeared. Both gates sat in front of the relationship
   rather than in front of the thing that needs them.

   Two facts drove the change.

   First, the clinicians say they cannot write a protocol before they see blood
   results. So the product must not pretend a protocol exists earlier.

   Second, a patient does not want to buy a blood test. A patient wants help
   with a goal. The blood test is a step inside that help, not the product.

   The answer is an intermediate document. The Care Brief is the output of the
   first consultation. It reports what the clinician heard and which clinical
   questions the blood work must answer. It is not a weak protocol. It is the
   bridge between the conversation and the treatment.

   So: the consultation is free and immediate, the Care Brief follows it, and
   one payment starts the programme. Blood work is step one inside the
   programme, and it is already paid for.

   `booked` is gone because nobody books the first consultation now.
   `bloodsNeeded` is gone because blood work is no longer a decision taken on
   the call. It is always the first step. */
export const RX_FLOW = ['saved', 'consulted', 'programme',
                        'bloodsBooked', 'bloodsDone', 'followup',
                        'ready', 'shipping',
                        'running', 'verdict', 'reviewing', 'done'];

/* anything with a run that has not yet been read by a clinician */
export const RX_ACTIVE = ['consulted', 'programme', 'bloodsBooked',
                          'bloodsDone', 'followup',
                          'ready', 'shipping', 'running', 'verdict', 'reviewing'];

/* ── ONE QUESTION, ANSWERED BY STATE ──
   Today is the whole product; everything before it exists to get someone here.
   So it is not a dashboard of sections, it is a single resolver: given where
   this person is, what is the one next thing?

   `act` is what the USER does — it gets a button. `wait` states have no action
   because the next move belongs to the clinic, and inventing a button for the
   user in those moments is how a product starts nagging people about work that
   isn't theirs. */
/* "Before we meet tomorrow" was hardcoded, and the consultation is not always
   tomorrow — booking a same-day slot produced a card that said "tomorrow" under
   a heading that said "Today". Derived from the actual slot, with the
   preposition a weekday needs and Today/Tomorrow don't. */
/* A home draw plus the panel. Priced, because it is a real visit with a real
   nurse — and because the booking pattern only stays learnable if every booking
   behaves the same way. */
export const BLOOD_FEE = 450;

/* ── WHAT WE TALKED ABOUT ──
   Thirty minutes of someone's attention should not resolve into "your plan is
   being written". A patient leaves a good consultation certain they were heard,
   and the only way an app can carry that feeling is to say back what was said.

   Three lines, never a transcript: the goal in their words, the thing we agreed
   to work on, and what happens next. The third line differs by branch, because
   "we're taking bloods first" and "your plan is being written" are genuinely
   different endings to the same conversation. */
export const CONSULT_SUMMARY = {
  P_TEST: {
    said: ['Your main goal is getting your energy and drive back.',
           'Sleep and blood pressure come before anything else.'],
    bloods: 'Jamie would like to see your hormone markers before building the plan.',
    direct: 'Jamie is putting your plan together now.',
  },
  P_WEIGHT: {
    said: ['Your main goal is losing 10–20 kg without losing muscle.',
           'We agreed to start low and step up rather than push hard early.'],
    bloods: 'Layla would like HbA1c and a metabolic panel before finalising.',
    direct: 'Layla is putting your plan together now.',
  },
  P_LONG: {
    said: ['Your main goal is staying ahead of what runs in your family.',
           'Cardiovascular risk is where the next thirty years are decided.'],
    bloods: 'Mahmoud would like a full lipid and inflammatory panel first.',
    direct: 'Mahmoud is putting your plan together now.',
  },
  P_POST: {
    said: ['Your main goal is getting your energy back after birth.',
           'We agreed to look at iron and thyroid before anything about weight.'],
    bloods: 'Huda would like ferritin and a thyroid panel before finalising.',
    direct: 'Huda is putting your plan together now.',
  },
};

export function whenPhrase(slot) {
  if (!slot) return 'soon';
  const d = slot.split(' ')[0];
  return (d === 'Today' || d === 'Tomorrow') ? d.toLowerCase() : `on ${d}`;
}

export function nextStep(st, pKey) {
  const status = statusOf(st, pKey);
  const r = runOf(st, pKey);
  const p = PROTOCOLS[pKey];
  const c = coachOf(pKey);
  const who = c ? c.short : 'your doctor';

  switch (status) {
    /* The consultation has happened and it was free. What waits for the
       patient is the Care Brief, not a bill. The card points at the brief and
       the brief carries the price, because the decision to start belongs on
       the document that explains what starting means. */
    case 'consulted': return {
      kind: 'brief', tag: 'Your care brief is ready',
      title: `${who} has written up your consultation.`,
      body: 'It covers what you talked about, what the blood test needs to '
          + 'answer, and what happens next.',
      cta: 'Read my care brief', ctaKind: 'brief',
    };

    /* Paid. Blood work is step one and it is already covered, so this card
       asks for a time and never mentions money again. */
    case 'programme': {
      /* A known-door order waits on the doctor's sign-off first. Pending is a
         waiting state, so it gets no button — the next move is the clinic's.
         The call substate is the escalation beat: the disguised resolver
         caught at the checkpoint, offered a doctor instead of a dispatch. */
      if (r && r.door === 'known' && r.checkpoint !== 'approved') {
        if (r.checkpoint === 'call') return {
          kind: 'checkpointCall', tag: 'A quick word first',
          title: `${who} wants two minutes with you before confirming.`,
          body: 'Something in your answers deserves a doctor’s look before we '
              + 'dispense. It’s included, and it’s usually reassurance.',
          cta: 'Start the call', ctaKind: 'checkpointCall',
        };
        return {
          kind: 'checkpoint', tag: 'Doctor review today',
          title: `${who} is reviewing your order.`,
          body: 'Nothing is dispensed until a doctor signs it off. You’ll '
              + 'hear back today.',
          cta: null,
        };
      }
      return {
        kind: 'bookBloods', tag: 'Step 1 of your programme',
        title: 'Your blood test comes first.',
        body: `${who} needs these results before writing your plan. A nurse `
            + 'comes to you.',
        cta: 'Choose a time', free: true,
      };
    }
    case 'bloodsBooked': return {
      kind: 'bloods', tag: 'Blood draw scheduled',
      when: r && r.bloodSlot, cta: null,
      prepList: [
        'Fast for 10 hours — water is fine',
        'Drink water before the nurse arrives',
        'Have your ID ready',
        'The nurse comes to you',
      ],
    };
    case 'bloodsDone': return {
      kind: 'bookFollow', tag: 'Blood sample received',
      /* This said "Jamie is reviewing your results" the moment the nurse left,
         which is chronologically impossible — the lab has not run them yet.
         Claiming work nobody has started is a small lie that costs trust the
         first time a patient notices it. */
      title: 'We’re waiting on your lab results.',
      body: `This usually takes 24–48 hours. In the meantime, pick a time with `
        + `${who} to go through them.`,
      cta: 'Choose a time', free: true, bts: 'processing',
    };
    case 'followup': return {
      kind: 'consult', tag: 'Follow-up consultation',
      when: r && r.followSlot, cta: 'Join consultation',
      foot: 'Link opens 10 minutes before', locked: true,
      /* the second, quieter question a patient has: what is happening while I
         wait? Answered alongside the appointment, not instead of it. */
      bts: (r && r.labs) === 'ready' ? 'ready' : 'processing',

    };
    /* No price. The patient bought the programme at the Care Brief, and this
       plan is what the programme produced. Asking for money twice for one
       course of care is the thing the new flow exists to remove. */
    case 'ready': return {
      kind: 'plan', tag: 'Your plan is ready',
      title: `${who} built your plan.`,
      cta: 'View your plan', price: 0,
    };

    /* ── PAYING IS NOT STARTING ──
       The old flow collapsed these: you paid, a success screen said "protocol
       begins", and the run jumped to day 1 with nothing in your hands. Two days
       later a nurse turned up with medication for a treatment the app had
       already been counting since Tuesday.

       So the days between paying and holding it are a state of their own. It is
       a waiting state, which means no CTA — the next move belongs to the
       pharmacy and the courier, and manufacturing a button here would be the
       app asking the patient to do work that was never theirs. */
    case 'shipping': {
      const ship = (r && r.ship) || 'confirmed';
      /* A monthly plan runs in 4-week cycles; renewals say "next month"
         because the app remembering which month this is, is the difference
         between a subscription and a succession of first purchases. */
      const wks = r && r.term === 'monthly' ? 4 : p.wk;
      const renewal = r && (r.cycle || 1) > 1;
      if (ship === 'delivered') return {
        kind: 'start', tag: 'Your treatment starts today',
        title: `Day 1 of ${wks} weeks.`,
        body: renewal
          ? `Your next month is with you, at the dose ${who} set on your review. `
            + 'Start whenever you\u2019re ready.'
          : `Everything ${who} prescribed is with you. Start whenever you're ready.`,
        cta: 'Start Day 1', ctaKind: 'startDay',
      };
      /* The headline moves with the parcel. Leaving "we're preparing your
         first month" up while a nurse is driving to the house is the same
         staleness the strip underneath it would immediately contradict. */
      return ship === 'out' ? {
        kind: 'fulfil', tag: 'Out for delivery',
        title: 'Your package is on its way.',
        body: 'A nurse brings it to you and stays for the first dose.',
        ship: fulfilment(st, pKey),
      } : {
        kind: 'fulfil', tag: renewal ? 'Preparing your next month' : 'Preparing your treatment',
        title: renewal
          ? `${who} has signed off your dose.`
          : `${who} has everything ready.`,
        body: `We\u2019re preparing your ${renewal ? 'next' : 'first'} month. `
            + 'We\u2019ll tell you the moment it\u2019s on its way.',
        ship: fulfilment(st, pKey),
      };
    }
    default: return null;
  }
}

export function runOf(st, pKey) { return (st.runs || {})[pKey] || null; }

export function statusOf(st, pKey) {
  const r = runOf(st, pKey);
  return r ? r.status : 'saved';
}

/* Every protocol the user has any relationship with, newest-stage first. Saved
   protocols have no run, which is what makes them saved. */
export function runsList(st) {
  const keys = [...new Set([...Object.keys(st.runs || {}), ...(st.saved || [])])];
  return keys
    .filter((k) => PROTOCOLS[k])
    .map((k) => ({ k, p: PROTOCOLS[k], run: runOf(st, k), status: statusOf(st, k) }))
    .sort((a, b) => RX_FLOW.indexOf(b.status) - RX_FLOW.indexOf(a.status));
}

export function activeRuns(st) {
  return runsList(st).filter((x) => RX_ACTIVE.includes(x.status));
}
export function completedRuns(st) {
  return runsList(st).filter((x) => x.status === 'done');
}
/* kept, never started — the only group where "should I run this" is still the
   question being asked */
export function savedOnly(st) {
  return runsList(st).filter((x) => x.status === 'saved');
}

/* Which run Today is showing. Falls back to the furthest-along active run rather
   than to nothing, so Today is never blank while a protocol is in flight. */
export function focusRun(st) {
  const act = activeRuns(st);
  if (!act.length) {
    const done = completedRuns(st);
    return done.length ? done[0] : null;
  }
  return act.find((x) => x.k === st.focus) || act[0];
}

/* ── STAGES ──
   One protocol's journey as a live checklist, driven by its own status. The same
   list serves the pre-purchase page ("here is what you are signing up for") and
   the tracking page ("here is where you are"), because they are the same list at
   two different points — duplicating it is how the two drift apart. */
export function runStages(st, pKey) {
  const p = PROTOCOLS[pKey];
  const r = runOf(st, pKey);
  const status = statusOf(st, pKey);
  const author = coachOf(pKey) || DOCTOR;
  const rank = RX_FLOW.indexOf(status);
  const at = (i) => (rank > i ? 'done' : rank === i ? 'now' : 'next');

  const out = [{
    t: 'Consultation with a Valeo doctor',
    s: status === 'booked' ? `Booked · ${r.slot}`
      : rank > RX_FLOW.indexOf('booked') ? 'Done'
        : '30 min video call · required',
    state: rank > RX_FLOW.indexOf('booked') ? 'done' : at(RX_FLOW.indexOf('booked')),
  }];

  if (p.blood !== 'no') {
    out.push({
      t: 'Blood baseline',
      s: rank >= RX_FLOW.indexOf('running') ? 'Drawn'
        : rank >= RX_FLOW.indexOf('ready') ? 'Included in your package'
          : `${givenNameOf(author)} decides on the call`,
      state: rank >= RX_FLOW.indexOf('running') ? 'done'
        : rank >= RX_FLOW.indexOf('ready') ? 'next' : 'maybe',
    });
  }

  out.push({
    t: `Run it for ${p.wk} weeks`,
    s: r && r.day
      ? `Day ${r.day} of ${r.total} · ${r.logs ? r.logs.length : 0} days logged`
      : `${p.items.length} things, delivered to you`,
    state: rank > RX_FLOW.indexOf('running') ? 'done'
      : status === 'running' ? 'now' : 'next',
    meta: r && r.day ? { day: r.day, total: r.total } : null,
  });

  out.push({
    t: `Retest ${p.mk}`,
    s: status === 'reviewing' ? `Review booked · ${r.reviewSlot}`
      : status === 'done' ? 'Read and verdict in'
        : 'The number that decides whether it worked',
    state: status === 'done' ? 'done'
      : ['verdict', 'reviewing'].includes(status) ? 'now' : 'next',
  });

  return out.map((x, i) => ({ ...x, n: i + 1 }));
}

/* ── PREDICTED vs OBSERVED ──
   The claim, checked. `exp` is what the protocol was sold as delivering and `got`
   is what a retest actually measured, so the ratio is the only honest scoreboard
   the product has — and the only one a competitor cannot fake, because it
   requires having promised a number in the first place. */
/* Deterministic 0–1 from a string. Same protocol and subsystem always produce
   the same number, so a report does not change under the reader. */
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/* ── WHAT A RETEST FOUND ──
   The observed side of the comparison, produced when the loop closes.

   It used to be a hand-authored `got` on every subsystem, which meant exactly one
   protocol had real numbers and every other one reported zero delivered the moment
   it finished — reading as "this did nothing" when it meant "nobody has measured
   it yet". Those are opposite claims.

   So: adherence sets the ceiling (you cannot get the effect of a protocol you did
   not take) and a seeded offset stands in for biological variation, which is why
   two subsystems in the same run land differently. Deterministic, so a report is
   stable, and stored on the run once written rather than recomputed. */
export function synthObserved(pKey, adherence = 90) {
  const hits = PROTO_HITS[pKey] || [];
  const out = {};
  hits.forEach((h) => {
    /* The spread is wide on purpose. A narrow one made perfect adherence produce
       "It worked" on every protocol, which is the opposite of the point — you can
       do everything right and still not respond, and a loop that cannot return
       that answer is a subscription with extra steps. Adherence sets the ceiling;
       biology decides where under it you land. */
    const spread = (seeded(pKey + ':' + h.sys) - 0.5) * 0.66;
    const share = Math.max(0.08, Math.min(1, 0.26 + 0.55 * (adherence / 100) + spread));
    out[h.sys] = Math.round(h.exp * share);
  });
  return out;
}

export function deliveryFor(st, pKey) {
  const run = runOf(st, pKey);
  /* Priority: what this run's retest actually recorded, then a hand-authored
     outcome where one exists, then nothing — never a synthesised number for a
     protocol that has not been retested. */
  const obs = (run && run.observed) || null;
  const rows = (PROTO_HITS[pKey] || []).map((h) => {
    const sys = SYSTEMS.find((x) => x.k === h.sys);
    const got = obs && obs[h.sys] != null ? obs[h.sys] : h.got;
    const share = h.exp > 0 ? Math.round((got / h.exp) * 100) : 0;
    return {
      sys: h.sys, t: sys.t, predicted: h.exp, observed: got, share,
      band: share >= 80 ? 'green' : share >= 40 ? 'yellow' : 'coral',
    };
  }).sort((a, b) => b.predicted - a.predicted);

  const predicted = rows.reduce((n, x) => n + x.predicted, 0);
  const observed = rows.reduce((n, x) => n + x.observed, 0);
  const share = predicted ? Math.round((observed / predicted) * 100) : 0;
  return {
    rows, predicted, observed, share,
    band: share >= 80 ? 'green' : share >= 40 ? 'yellow' : 'coral',
  };
}

/* ── IN FLIGHT ──
   Everything the user's protocols are doing to the twin: the one that is
   running first, then the saved ones that have not started.

   This is the causal layer. The body says where, Peak says how far, and this
   says what is acting on it and what that has bought so far. Without it a
   protocol is a shopping receipt and the twin is a poster. */
export function inFlight(st) {
  const keys = [];
  Object.keys(st.runs || {}).forEach((k) => keys.push(k));
  (st.saved || []).forEach((k) => { if (!keys.includes(k)) keys.push(k); });

  return keys.map((k) => {
    const p = PROTOCOLS[k];
    if (!p) return null;
    const r = runOf(st, k);
    const live = !!(r && r.day && ['running', 'verdict', 'reviewing'].includes(r.status));
    const week = live ? Math.max(1, Math.ceil(r.day / 7)) : 0;
    const status = r ? r.status : 'saved';

    const hits = (PROTO_HITS[k] || []).map((h) => {
      const sys = SYSTEMS.find((x) => x.k === h.sys);
      const lv = LEVELS[h.sys];
      /* Where a full run lands, capped at peak. A protocol that has already
         banked movement accrues from baseline; one that has not started yet
         accrues from today — otherwise a saved protocol can claim a level the
         body has already passed, and appear to owe nothing. */
      const base = h.got > 0 ? lv.was : lv.now;
      const exp = Math.min(lv.peak, base + h.exp);
      return {
        ...h, t: sys.t, region: sys.region, mk: sys.mk,
        was: lv.was, now: lv.now, peak: lv.peak, exp, base,
        owed: Math.max(0, exp - lv.now),
        reported: !!sys.reported,
      };
    }).sort((a, b) => b.got - a.got || (b.exp - b.now) - (a.exp - a.now));

    return {
      k, t: p.t, wk: p.wk, mk: p.mk, status, week, live, hits,
      /* the regions it acts on, in body order — a protocol is easier to place
         on the twin by region than by marker name */
      regions: REGIONS.filter((r) => hits.some((h) => h.region === r.k)).map((r) => r.t),
      /* the closed loop, stated: which marker, how many weeks out */
      left: live ? Math.max(0, p.wk - week) : p.wk,
      /* How much of what this protocol promised has actually landed. A point
         total ("+66") is meaningless without knowing the total on offer; a
         share is legible on its own and cannot be inflated by counting more
         subsystems. */
      delivered: (() => {
        const owe = hits.reduce((n, h) => n + h.exp - h.was, 0);
        const had = hits.reduce((n, h) => n + h.got, 0);
        return owe > 0 ? Math.round((had / owe) * 100) : 0;
      })(),
    };
  }).filter(Boolean);
}

/* The ramp for the isolated zone: where it is now, and green at peak. Distance
   from peak sets the starting colour, so a region close to peak barely reddens
   and a region far from it clearly does. */
export const PEAK_FROM = '#A33645';
export const PEAK_TO   = '#1C7245';

/* ══════════════════════════════════════════════════════════════════════════
   V1 — THE CLINICIAN IS THE PRODUCT

   The twin build made an influencer the unit of trust. V1 makes it a doctor or
   coach, which is both more defensible and closer to what Valeo already sells.
   Everything below hangs off that one change.

   Three rules held throughout:

   1. A protocol is a TEMPLATE its author owns, plus per-patient edits. The
      edits are the product — "personalized attention" is unfalsifiable until
      you can show someone the diff.
   2. Tangibles are things that arrive and get billed. Non-tangibles are things
      you do. They are separated everywhere because they fail differently: a
      supplement fails by not being taken, a meal plan fails by not fitting
      your life.
   3. Nothing is written in a clinician's voice unless a clinician wrote it, or
      approved a draft. Presence claims ("reviewing your progress") must be
      backed by an event a coach actually caused.
   ══════════════════════════════════════════════════════════════════════════ */

/* Credentials, registration numbers and load figures are PLACEHOLDERS for the
   demo. Replace with real, verifiable detail before this is shown outside the
   building — a fake SCFHS number is the one detail here a regulator would care
   about. */
export const COACHES = {
  C_MAHMOUD: {
    name: 'Dr. Mahmoud Hassan', short: 'Dr. Mahmoud', mono: 'MH',
    img: asset('team/mahmoud.jpg'),
    kind: 'doctor', role: 'Internal Medicine', reg: 'SCFHS 24-118940',
    years: 11, langs: 'Arabic · English',
    focus: 'Metabolic health & preventive medicine',
    cats: ['long', 'energy'],
    line: 'Reads your panel line by line, not just the flagged values.',
    reply: 'Usually replies within 4h', patients: 34, tone: '#1B395B',
  },
  C_LAYLA: {
    name: 'Dr. Layla Al-Rashid', short: 'Dr. Layla', mono: 'LR',
    kind: 'doctor', role: 'Endocrinology', reg: 'SCFHS 22-094117',
    years: 14, langs: 'Arabic · English · French',
    focus: 'Weight, insulin resistance, thyroid',
    cats: ['fat', 'energy'],
    line: 'Starts at half dose on everything and steps up. Fewer people quit that way.',
    reply: 'Usually replies same day', patients: 41, tone: '#2E6B5E',
  },
  C_OMAR: {
    name: 'Omar Haddad', short: 'Omar', mono: 'OH',
    kind: 'coach', role: 'Performance Coach', reg: 'CSCS · NASM-CPT',
    years: 9, langs: 'Arabic · English',
    focus: 'Strength, VO₂max, body composition',
    cats: ['perf', 'fat'],
    line: 'Will cut your programme in half if your sleep is bad. Non-negotiable.',
    reply: 'Usually replies within 2h', patients: 28, tone: '#8A5A2B',
  },
  C_NADIA: {
    name: 'Dr. Nadia Kassem', short: 'Dr. Nadia', mono: 'NK',
    kind: 'doctor', role: 'Sleep & Neurology', reg: 'SCFHS 23-107755',
    years: 12, langs: 'Arabic · English',
    focus: 'Sleep architecture, cognition, shift work',
    cats: ['sleep', 'energy'],
    line: 'Fixes light and caffeine timing before prescribing anything.',
    reply: 'Usually replies within 6h', patients: 22, tone: '#3B4E8C',
  },
  C_REEM: {
    name: 'Dr. Reem Fahad', short: 'Dr. Reem', mono: 'RF',
    kind: 'doctor', role: 'Dermatology', reg: 'SCFHS 21-088204',
    years: 8, langs: 'Arabic · English',
    focus: 'Skin ageing, hair, pigmentation',
    cats: ['looks'],
    line: 'Photographs baseline properly, so twelve weeks later there is something to compare.',
    reply: 'Usually replies within 8h', patients: 19, tone: '#9A4B6B',
  },
};

/* Authorship lives out here rather than inside PROTOCOLS, so adding a coach
   never means editing eight protocol objects. */
const AUTHOR = {
  P_LONG: 'C_MAHMOUD', P_TEST: 'C_MAHMOUD',
  P_WEIGHT: 'C_LAYLA',
  P_ATH: 'C_OMAR', P_FAISAL: 'C_OMAR',
  P_SLEEP: 'C_NADIA', P_FOCUS: 'C_NADIA',
  P_SKIN: 'C_REEM',
};

/* The name a warm, first-name-basis line uses — "so Layla isn't starting from
   zero", not "so Al-Rashid isn't starting from zero". `short` already encodes
   this per coach (title kept for doctors, dropped for Omar); this just strips
   the title for the sentences that want the bare given name. Centralised
   because this exact string got computed three different ways before it lived
   anywhere — that's how "Al-Rashid" and "Mahmoud" ended up meaning two
   different things in two files. */
export const givenNameOf = (c) => (c ? (c.short || c.name).replace(/^Dr\.\s*/, '') : 'your doctor');

export const coachKeyOf = (pKey) => AUTHOR[pKey] || null;
export const coachOf = (pKey) => COACHES[AUTHOR[pKey]] || null;

/* A second template in the same category, by a different clinician, with a
   deliberately different philosophy. Without this the "choose a doctor" step is
   a formality — one category, one doctor, no decision. With it the choice is
   real and legible: Layla medicates and measures, Omar trains and refuses to.
   Declared as a separate object and merged, so the original PROTOCOLS literal
   is never edited. */
const V1_PROTOCOLS = {
  P_RECOMP: {
    arc: [
      { to: 4,  t: 'Learn the lifts', b: 'Technique before load. Weight will barely move and that is correct.' },
      { to: 10, t: 'Add load', b: 'Strength climbs first, then body composition follows it.' },
      { to: 14, t: 'Hold and reassess', b: 'Waist and lifts, not scale weight. Muscle weighs.' },
    ],
    milestones: [
      { d: 28, t: 'Strength check' },
      { d: 98, t: 'DEXA + waist' },
    ],
    price: 1450, blood: 'no',
    items: [
      { k: 'sup', t: 'Creatine monohydrate', d: '5 g daily, any time', w: 'am' },
      { k: 'sup', t: 'Whey protein',         d: '30 g on training days', w: 'am' },
      { k: 'hab', t: 'Protein floor',        d: '130 g a day, every day', w: 'am' },
      { k: 'hab', t: 'Lift three times',     d: '45 min, full body', w: 'am' },
    ],
    amend: {
      changed: ['Dropped to two sessions a week — your travel weeks made three unrealistic'],
      added:   ['Creatine from week 1 rather than week 4'],
      flagged: ['If the scale does not move by week 6, that is expected. Waist is the read-out.'],
    },
    t: 'Strength Recomp', wk: 14, cat: 'fat', mk: 'Waist + DEXA body fat %',
    goal: 'Lose fat without losing muscle, and without medication',
    stack: ['Creatine 5 g daily', 'Protein 130 g a day', 'Three full-body lifts a week',
            '8,000 steps as a daily floor'],
    risk: 'Scale weight can hold flat for six weeks while body fat drops. If that will frustrate you, say so now.',
    wrongFor: 'Anyone who wants fast scale movement, or cannot commit to lifting. Take the medicated route instead.',
  },
};
Object.assign(PROTOCOLS, V1_PROTOCOLS);
Object.assign(AUTHOR, { P_RECOMP: 'C_OMAR' });

/* Which categories a clinician actually covers is DERIVED from what they have
   authored, never declared. The hand-written version listed Omar under weight
   loss and Layla under energy, and both would have opened a category page with
   a doctor on it who had nothing to offer. A capability claim that the
   inventory does not back is the same bug either way. */
export function catsOf(coachKey) {
  return GOALS.map((g) => g.k).filter((c) => protosFor(coachKey, c).length > 0);
}

/* Category first, then the people who work in it — a new user cannot pick a
   doctor they have never heard of, but they know what they want fixed. */
export function coachesFor(cat) {
  return Object.keys(COACHES).filter((k) => protosFor(k, cat).length > 0);
}

export function protosFor(coachKey, cat = null) {
  return Object.keys(AUTHOR).filter((p) => AUTHOR[p] === coachKey
    && !PROTOCOLS[p].own
    && isLive(p)
    && (!cat || PROTOCOLS[p].cat === cat));
}

/* How many people a category has behind it. Shown on the category list because
   "3 doctors" is the reason to tap, not the icon. */
export function catCoachCount(cat) {
  return coachesFor(cat).length;
}

/* ── tangible vs non-tangible ──
   A supplement fails by not being taken; a meal plan fails by not fitting your
   life. They are billed differently and they are adhered to differently, so
   they are never mixed in one list. */
export const TANGIBLE_KINDS = ['med', 'glp', 'pep', 'sup', 'iv', 'test'];
export const KIND_LABEL = {
  med: 'Medicine', glp: 'Medicine', pep: 'Peptide', sup: 'Supplement',
  iv: 'IV drip', test: 'Test', hab: 'Habit', meal: 'Meal plan', exer: 'Training',
};

/* Non-tangibles authored per protocol. Kept out of `items` because items are
   the billing manifest — a meal plan has no price and no delivery. */
export const PLANS = {
  P_WEIGHT: {
    meal: { t: 'Kabsa-friendly deficit', b: '400 kcal under maintenance without cutting rice. Protein floor 130g.',
            pts: ['Rice stays — portion by fist, not by cup', 'Protein at every meal, 130g floor', 'Eat before Maghrib, not after'] },
    exer: { t: '3 lifts + 8k steps', b: 'Enough resistance work to keep muscle while losing fat. Steps do the rest.',
            pts: ['3 full-body lifts a week, 45 min', '8,000 steps daily average', 'No cardio blocks — steps are the cardio'] },
  },
  P_LONG: {
    meal: { t: 'Mediterranean, Gulf pantry', b: 'Olive oil, fish twice a week, legumes. Built from what is actually in Tamimi.',
            pts: ['Fish twice a week', 'Olive oil as the default fat', 'Legumes 4× a week'] },
    exer: { t: 'Zone 2 + two lifts', b: 'VO₂max is the strongest single predictor here, so it gets the volume.',
            pts: ['150 min Zone 2 a week', '2 lifting sessions', 'One hard 4×4 interval block weekly'] },
  },
  P_ATH: {
    meal: { t: 'Fuelled, not restricted', b: 'Carbs timed around sessions. This is not a deficit protocol.',
            pts: ['Carbs before and after sessions', '1.8g/kg protein', 'No training fasted'] },
    exer: { t: 'Block periodisation, 16 wk', b: 'Four blocks, each with a different job. Deload every fourth week.',
            pts: ['Wk 1–4 base, wk 5–8 build', 'Wk 9–12 intensity, wk 13–16 peak', 'Deload every 4th week'] },
  },
  P_SLEEP: {
    meal: { t: 'Caffeine and dinner timing', b: 'Almost all of it is when you eat and drink, not what.',
            pts: ['Caffeine cut-off 10h before bed', 'Dinner 3h before sleep', 'No alcohol within 4h of bed'] },
    exer: { t: 'Morning load, evening walk', b: 'Hard training late pushes sleep onset. Move it earlier.',
            pts: ['Train before 6pm', '15 min walk after dinner', 'No HIIT after 7pm'] },
  },
  P_TEST: {
    meal: { t: 'Fat and zinc floor', b: 'Very low fat intake suppresses testosterone. This sets a floor.',
            pts: ['Fat at 0.8g/kg minimum', 'Red meat or shellfish twice a week', 'Alcohol under 4 units a week'] },
    exer: { t: 'Heavy, brief, frequent', b: 'Compound lifts near-maximal. Long sessions raise cortisol instead.',
            pts: ['3 sessions, 45 min hard cap', 'Squat, press, pull, hinge', 'No sessions over an hour'] },
  },
  P_FOCUS: {
    meal: { t: 'Stable glucose day', b: 'Focus tracks glucose stability more than any single nutrient.',
            pts: ['Protein-led breakfast, no cereal', 'No sugar spikes before deep work', 'Lunch after the hardest block'] },
    exer: { t: 'Movement snacks', b: 'Short walks between blocks, not one long session.',
            pts: ['10 min walk every 90 min', '2 lifts a week', 'Daylight before the first work block'] },
  },
  P_SKIN: {
    meal: { t: 'Collagen and glycaemic load', b: 'Lower the glycaemic load, raise protein. Both show in skin by week 8.',
            pts: ['Low glycaemic load', 'Protein 1.4g/kg', 'Two litres of water daily'] },
    exer: { t: 'Sweat and sunlight rules', b: 'Training helps skin; midday sun undoes it.',
            pts: ['Cleanse within 30 min of sweating', 'No outdoor training 11am–3pm', 'SPF 50 reapplied'] },
  },
  P_RECOMP: {
    meal: { t: 'Protein-led, no deficit', b: 'Eat at maintenance. The lifting does the work, not restriction.',
            pts: ['130 g protein, non-negotiable', 'Eat at maintenance, not under', 'Rice and kabsa stay in'] },
    exer: { t: 'Three full-body lifts', b: 'The protocol IS the training. Everything else supports it.',
            pts: ['3 sessions a week, 45 min', 'Squat, hinge, press, pull, carry', 'Add load weekly, not reps'] },
  },
  P_FAISAL: {
    meal: { t: 'Fuelled, not restricted', b: 'Carbs timed around sessions, protein floor held.',
            pts: ['Carbs before and after sessions', '1.8g/kg protein', 'No training fasted'] },
    exer: { t: 'Four blocks, 16 weeks', b: 'Base, build, intensity, peak. Deload every fourth week.',
            pts: ['Wk 1–4 base', 'Wk 5–12 build and intensity', 'Wk 13–16 peak'] },
  },
};

/* Tests are derived, not authored: if a protocol is scored on a marker, that
   marker has to be drawn twice. Stating it as a line item means the retest
   stops being a surprise at week 12. */
export function testsFor(pKey) {
  const p = PROTOCOLS[pKey];
  if (!p || p.blood === 'no') return [];
  return [
    { k: 'test', t: `Baseline panel · ${p.mk}`, d: 'Before you start. Nurse comes to you.', w: 'once' },
    { k: 'test', t: `Retest · ${p.mk}`, d: `Week ${p.wk}. Same panel, same lab, same conditions.`, w: 'once' },
  ];
}

/* The whole protocol, split the way a patient actually reads it. */
export function breakdown(pKey) {
  const p = PROTOCOLS[pKey];
  if (!p) return { tangibles: [], plans: [], habits: [] };
  const items = p.items || [];
  return {
    tangibles: [...items.filter((it) => TANGIBLE_KINDS.includes(it.k)), ...testsFor(pKey)],
    habits: items.filter((it) => it.k === 'hab'),
    plans: [
      ...(PLANS[pKey] && PLANS[pKey].meal ? [{ k: 'meal', ...PLANS[pKey].meal }] : []),
      ...(PLANS[pKey] && PLANS[pKey].exer ? [{ k: 'exer', ...PLANS[pKey].exer }] : []),
    ],
  };
}

/* ── PRE-CONSULT INTAKE ──
   One shared script for v1 — every doctor's assistant asks the same four
   things. Branded per doctor (the opening line names them) even though the
   questions themselves aren't authored per doctor yet; that's the cheap part
   of "this doctor is real" and it ships now. The expensive part — questions
   that actually differ by protocol — is next, not v1.
   Required before the consult confirms: skipping intake would let a doctor
   walk into a call blind, which is the exact "doctor as aesthetic" failure
   this whole rework exists to avoid. */
export const INTAKE_SCRIPT = [
  { k: 'age', kind: 'number', q: 'First — how old are you?', ph: 'Age', suffix: 'years' },
  { k: 'height', kind: 'number', q: 'Height?', ph: 'e.g. 175', suffix: 'cm' },
  { k: 'weight', kind: 'number', q: 'And your current weight?', ph: 'e.g. 82', suffix: 'kg' },
  {
    k: 'meds', kind: 'chips', q: 'Any conditions or medications right now?',
    o: ['None', 'Blood pressure', 'Thyroid', 'Diabetes', "I'll explain on the call"],
  },
  {
    k: 'note', kind: 'text', optional: true,
    q: 'Anything specific you want them to know before the call?',
    ph: 'Optional — type or skip',
  },
];

/* ══════════════════════════════════════════════════════════════════════════
   V1 SCOPE — four protocols, four goals

   Everything else authored earlier stays in the file but goes dark: it is
   reachable data, not shipped product. Filtering rather than deleting keeps the
   twin-era demo material intact (and PROTO_HITS, LEVELS and the results
   fixtures all still resolve) while the app only ever offers four things.
   ══════════════════════════════════════════════════════════════════════════ */

/* Postpartum needed its own clinician — none of the five already authored
   credibly runs it, and putting an endocrinologist's name on a postpartum
   protocol is exactly the "doctor as decoration" move this rework exists to
   kill. Credentials are PLACEHOLDERS, same caveat as the rest. */
Object.assign(COACHES, {
  /* Jamie is a coach, not a clinician, so his name carries no title anywhere —
     not in `name`, not in `short`, and `givenNameOf` therefore has nothing to
     strip. The Testosterone protocol he fronts still contains prescription
     items; those route through a Valeo doctor exactly as before, and the
     protocol page already states it. A coach owns the programme; only a
     prescriber signs the medicine. */
  C_JAMIE: {
    name: 'Jamie Richards', short: 'Jamie', mono: 'JR',
    kind: 'coach', role: 'Men’s Health & Performance', reg: 'CSCS · Precision Nutrition L2',
    years: 12, langs: 'English',
    focus: 'Sexual health, energy and peak performance',
    cats: ['test'],
    line: 'Sleep and blood pressure first. Most men arrive wanting a pill and leave with a bedtime.',
    reply: 'Usually replies within 3h', patients: 31, tone: '#2F5D50',
    img: asset('team/jamie.jpg'),
  },
  C_HUDA: {
    name: 'Dr. Huda Al-Amoudi', short: 'Dr. Huda', mono: 'HA',
    kind: 'doctor', role: 'OB-GYN', reg: 'SCFHS 20-071344',
    years: 15, langs: 'Arabic · English',
    focus: 'Postpartum recovery, iron and thyroid, pelvic health',
    cats: ['post'],
    line: 'Checks your iron and thyroid before anyone talks to you about weight.',
    reply: 'Usually replies within 3h', patients: 26, tone: '#7A4B6E',
  },
});

Object.assign(PROTOCOLS, {
  P_POST: {
    arc: [
      { to: 4,  t: 'Replete first', b: 'Iron and thyroid before anything else. Fatigue after birth is usually a deficiency, not a discipline problem.' },
      { to: 10, t: 'Rebuild', b: 'Pelvic floor and load-bearing work, in that order.' },
      { to: 16, t: 'Retest and reassess', b: 'Ferritin and thyroid again. Energy is the outcome, not the scale.' },
    ],
    milestones: [
      { d: 28, t: 'Iron recheck' },
      { d: 112, t: 'Retest ferritin + thyroid' },
    ],
    price: 2900, blood: 'yes',
    items: [
      { k: 'sup', t: 'Iron bisglycinate',   d: '25 mg, alternate days with vitamin C', w: 'am' },
      { k: 'sup', t: 'Vitamin D3 + K2',     d: '2000 IU daily', w: 'am' },
      { k: 'sup', t: 'Omega-3',             d: '2 g daily', w: 'am' },
      { k: 'hab', t: 'Pelvic floor work',   d: '10 min daily, guided', w: 'am' },
      { k: 'hab', t: 'Protein floor',       d: '100 g a day, more if breastfeeding', w: 'am' },
    ],
    amend: {
      changed: ['Iron moved to alternate days — daily dosing absorbs worse and upsets your stomach more'],
      added:   ['Thyroid panel added — postpartum thyroiditis is common and missed'],
      flagged: ['If you are breastfeeding, nothing here changes without me saying so'],
    },
    t: 'Postpartum Recovery', wk: 16, cat: 'post', mk: 'Ferritin + thyroid panel',
    goal: 'Get your energy, iron and strength back after birth',
    stack: ['Iron bisglycinate on alternate days', 'Vitamin D3 + K2 daily',
            'Omega-3 2 g daily', 'Pelvic floor work, 10 min daily'],
    risk: 'Iron can cause constipation and nausea. Alternate-day dosing is specifically to reduce that, and we start low.',
    wrongFor: 'Anyone still in the first six weeks after birth — that is a medical review, not a protocol. Book a consultation instead.',
  },
});

/* P_TEST was filed under 'energy' when energy was a goal of its own. It is now
   its own goal, so its category moves with it. Assigned rather than edited
   in place — the PROTOCOLS literal is never touched. */
Object.assign(PROTOCOLS.P_TEST, { cat: 'test' });

Object.assign(AUTHOR, { P_POST: 'C_HUDA', P_TEST: 'C_JAMIE' });

Object.assign(PLANS, {
  P_POST: {
    meal: { t: 'Iron-forward, no deficit', b: 'This is not the time to eat less. Iron, protein and enough calories to actually recover.',
            pts: ['Red meat or lentils 4× a week', 'Vitamin C with every iron dose', 'No calorie deficit while breastfeeding'] },
    exer: { t: 'Floor first, load second', b: 'Pelvic floor before any loaded movement. Skipping this is how people end up injured at month four.',
            pts: ['Pelvic floor daily, 10 min', 'Walking as the only cardio for 6 weeks', 'Load added from week 8, slowly'] },
  },
});

/* Keeps the twin-era attribution maths resolvable for the new protocol. */
Object.assign(PROTO_HITS, {
  P_POST: [
    { sys: 'Blood', exp: 22, got: 0 },
    { sys: 'Hormones', exp: 18, got: 0 },
  ],
});

/* The four things V1 actually sells. */
export const LIVE = ['P_WEIGHT', 'P_TEST', 'P_LONG', 'P_POST'];
export const isLive = (pKey) => LIVE.includes(pKey);

/* ── THE COACH'S OPENING QUESTIONS ──
   Asked BEFORE a doctor is chosen, so this is Valeo's coach speaking, not any
   named doctor's assistant. Branding it to a doctor the user has not picked yet
   would be incoherent, and it is the one thing the earlier flow got wrong.

   Four questions, none of them typed. Goal and sub-goal route the match;
   height and weight are the two numbers every one of these protocols needs and
   the only ones worth asking for before someone has committed to anything.
   Everything clinical waits until after they have paid — interrupting a person
   who just spent SAR 3,400 to ask about their thyroid is a way to lose them. */
export const COACH_OPENING = [
  { k: 'goal',   kind: 'goal',   q: 'What would you like to work on today?' },
  { k: 'sub',    kind: 'sub',    q: 'Which of these sounds most like you?' },
  /* Clinical, not demographic. Reference ranges for most of the markers these
     protocols track differ by sex, so a plan cannot be read correctly without
     it. Two options only, because that is what the ranges are defined against.
     It sits after the goal so the conversation starts with the patient rather
     than with a form field. */
  { k: 'sex',    kind: 'choice', q: 'And are you male or female?',
    o: ['Male', 'Female'] },
  { k: 'height', kind: 'number', q: 'How tall are you?', ph: '175', suffix: 'cm', min: 120, max: 220 },
  { k: 'weight', kind: 'number', q: 'And roughly what do you weigh?', ph: '82', suffix: 'kg', min: 35, max: 250 },
  /* ── THE FORK ──
     One honest question, asked as a chat bubble like every other. It routes
     between two different jobs — "execute what I already decided" and "help
     me understand what's wrong" — and it is the ONLY place the two
     architectures are ever allowed to surface. Everything downstream reads
     the answer; no screen ever mentions it. */
  { k: 'door',   kind: 'door',   q: 'What brings you to Valeo today?' },
];

/* The fork's two answers, phrased in the patient's own words per goal. The
   right words matter more here than anywhere: "I know what I want" from a
   weight-loss patient is "I want to start GLP-1", and pretending both doors
   are abstract "journeys" would make this a routing form. Stakeholder copy
   (Aug 2026) for the weight goal, verbatim. */
export const DOOR_ASK = {
  fat: {
    known:   { t: 'I want to start GLP-1 treatment',
               s: 'I’ve decided GLP-1 is right for me. Help me get started safely.' },
    resolve: { t: 'I’m not sure what’s right for me',
               s: 'Help me understand the best approach for my weight loss.' },
  },
  test: {
    known:   { t: 'I know the treatment I’m after',
               s: 'I’ve decided what’s right for me. Help me get started safely.' },
    resolve: { t: 'I’m not sure what’s right for me',
               s: 'Help me understand the best approach for my health.' },
  },
  _default: {
    known:   { t: 'I know what I want',
               s: 'I’ve decided what’s right for me. Help me get started safely.' },
    resolve: { t: 'I’m not sure what’s right for me',
               s: 'Help me understand the best approach for my health.' },
  },
};
export const doorAskFor = (goalKey) => DOOR_ASK[goalKey] || DOOR_ASK._default;

/* Which door the answers actually put this person through. An escalated
   known-door patient (red flag, or "it didn't work before") is a resolver who
   arrived with a product name, so the escalation flag wins over the answer. */
export const doorOf = (qa) =>
  (qa && qa.door === 'known' && !qa.escalated ? 'known' : 'resolve');

/* ── DOOR A · THE STRUCTURED INTAKE ──
   Three more chat questions, asked only after "I know what I want": what,
   prior use, red flags. `wants` options carry the protocol they map to, so
   the router never re-derives it. The red-flag lists are deliberately short —
   this is the screen door, not the consultation — and any positive answer
   escalates to a doctor (see the escalation rule in Coach.jsx).

   PLACEHOLDER flag lists, same caveat as the clinician registrations: a
   clinician must sign these off before any external audience. */
export const KNOWN = {
  fat: {
    wants: { q: 'What did you have in mind?', o: [
      { t: 'GLP-1 weekly injection', short: 'GLP-1', pKey: 'P_WEIGHT' },
      { t: 'Not sure, recommend one', pKey: null },
    ] },
    prior: { q: 'Have you used it before?',
      o: ['Never', 'Currently using it', 'Used it before, it didn’t work'] },
    flags: { q: 'Quick safety check. Do any of these apply to you?', o: [
      'History of pancreatitis', 'Thyroid cancer in my family',
      'Pregnant or breastfeeding', 'None of these'] },
  },
  test: {
    wants: { q: 'What did you have in mind?', o: [
      { t: 'Testosterone support', short: 'Testosterone', pKey: 'P_TEST' },
      { t: 'ED medication', short: 'ED Medication', pKey: 'P_TEST' },
      { t: 'Not sure, recommend one', pKey: null },
    ] },
    prior: { q: 'Have you used it before?',
      o: ['Never', 'Currently using it', 'Used it before, it didn’t work'] },
    flags: { q: 'Quick safety check. Do any of these apply to you?', o: [
      'Trying to conceive in the next 12 months', 'A heart condition',
      'None of these'] },
  },
  long: {
    wants: { q: 'What did you have in mind?', o: [
      { t: 'A full body checkup', short: 'Checkup', pKey: 'P_LONG' },
      { t: 'A longevity plan', short: 'Longevity', pKey: 'P_LONG' },
      { t: 'Not sure, recommend one', pKey: null },
    ] },
    prior: { q: 'Have you done structured testing before?',
      o: ['Never', 'Once or twice', 'Regularly, it didn’t change anything'] },
    flags: { q: 'Quick safety check. Do any of these apply to you?', o: [
      'An active infection right now', 'Immunosuppressed',
      'None of these'] },
  },
  post: {
    wants: { q: 'What did you have in mind?', o: [
      { t: 'A postpartum recovery plan', short: 'Recovery', pKey: 'P_POST' },
      { t: 'Not sure, recommend one', pKey: null },
    ] },
    prior: { q: 'Have you tried anything so far?',
      o: ['Nothing yet', 'Supplements on my own', 'A plan, it didn’t help'] },
    flags: { q: 'Quick safety check. Do any of these apply to you?', o: [
      'Heavy bleeding or fever right now', 'Severe mood changes',
      'None of these'] },
  },
};

/* The known-door answer that means "it failed before" — the doc calls this
   person a disguised resolver, and catching them is the fork's whole job. */
export const KNOWN_FAILED = /didn’t (work|help|change)/;

/* ── THE CLINICIAN'S NO, AND WHERE IT LEAVES SOMEBODY ──
   A safety flag no longer ends the known door by itself; a clinician reviews
   it and decides. When the answer is no, the worst version of this moment is
   a screen that says "you are not eligible" and stops. The patient came here
   with a goal, and the goal has not gone away — only one route to it has.

   So the no goes back into the conversation they were already having. The
   thread is still there, the answers are still there, and the next message
   says what changed and asks the only question that still matters. From that
   answer on they are on the clinician-led door: a doctor and a coach work out
   the route instead of the patient naming it.

   `declineSaid` is the coach speaking, not the clinician: the clinician's own
   words were said on the call. Written per goal so the alternative offered is
   a real one rather than "something else". */
export function declineSaid(goalKey, docShort = 'your doctor') {
  const alt = {
    fat: 'your weight',
    test: 'your energy and hormones',
    long: 'your long-term health',
    post: 'your recovery',
  }[goalKey] || 'your health';
  return [
    `I have just heard from ${docShort}.`,
    ['That plan ', { b: 'is not the right one for you' },
      ', and prescribing it would not have been safe.'],
    `That does not close the door on ${alt}. There are other ways to work on `
      + 'it, and they start with a doctor and a coach rather than with a '
      + 'medication.',
  ];
}

export const DECLINE_ASK = {
  q: 'Would you like to look at the other options with them?',
  o: [
    { t: 'Yes, show me what else there is', go: 'resolve' },
    { t: 'Not right now', go: 'stop' },
  ],
};

/* ── DOOR B · WHAT THE AI WORKED OUT ──
   Three areas worth investigating per goal, shown on the Assess screen
   between the intake and the consultation. AI investigates and reasons; the
   clinician decides — each row maps to the markers the panel measures, so
   the claim stays concrete. Authored, like every clinical judgement here. */
export const INVESTIGATE = {
  test: [
    { t: 'Hormone levels', s: 'Energy and drive dropping together usually starts here.', m: 'Total + free T' },
    { t: 'Thyroid & iron', s: 'The two most common mimics of low testosterone.', m: 'TSH · ferritin' },
    { t: 'Sleep & recovery', s: 'Poor sleep suppresses everything above.', m: 'discussed live' },
  ],
  fat: [
    { t: 'Metabolic markers', s: 'Weight that returns is usually signalling, not discipline.', m: 'HbA1c · insulin' },
    { t: 'Thyroid', s: 'A slow thyroid quietly fights every diet.', m: 'TSH · free T4' },
    { t: 'What you’ve tried', s: 'The pattern of what failed tells us what to change.', m: 'discussed live' },
  ],
  long: [
    { t: 'Cardiovascular risk', s: 'The marker with thirty years of evidence behind it.', m: 'ApoB · hsCRP' },
    { t: 'Metabolic health', s: 'Where decline starts a decade before symptoms.', m: 'HbA1c · lipids' },
    { t: 'Family history', s: 'What runs in your family sets what we test first.', m: 'discussed live' },
  ],
  post: [
    { t: 'Iron status', s: 'The most common cause of fatigue after birth.', m: 'ferritin · CBC' },
    { t: 'Thyroid', s: 'Postpartum thyroid shifts are common and missable.', m: 'TSH · free T4' },
    { t: 'Recovery load', s: 'Sleep, feeding and support shape what your body can do.', m: 'discussed live' },
  ],
};

/* Asked only AFTER the consult is paid for, and never as a gate — it sits on
   Today as an offer to help the doctor prepare. Same questions the old blocking
   intake asked; the difference is entirely in when and whether. */
export const PREP_QUESTIONS = [
  { k: 'meds', q: 'Any conditions or medications right now?',
    o: ['None', 'Blood pressure', 'Thyroid', 'Diabetes', 'Something else'] },
  { k: 'tried', q: 'What have you already tried that did not work?',
    o: ['Diet on my own', 'A gym programme', 'Medication before', 'Nothing yet'] },
  { k: 'worry', q: 'Anything you are worried about going in?',
    o: ['Side effects', 'Cost', 'Whether it will last', 'Nothing really'] },
];

/* The consultation is PAID. It is the moment a stranger becomes your doctor, and
   pricing it is what stops it being a sales call. Deliberately small against the
   protocol price — it buys the review, not the plan. */
export const CONSULT_FEE = 200;

/* ── ONE RESOLVER ──
   Goal → the clinician we recommend, decided in exactly one place. It was being
   derived independently inside the chat, the match screen and the router, which
   is how the name spoken in the conversation and the face on the next screen
   quietly stop agreeing the first time anyone reassigns a protocol. */
export function leadFor(goalKey) {
  if (!goalKey) return null;
  return coachesFor(goalKey).flatMap((ck) => protosFor(ck, goalKey))[0] || null;
}

/* ── MEETING THEM ──
   First person, because this is the clinician speaking, not a profile being
   rendered. Each opens the same way — name, then what they are actually trying
   to do for you, which is deliberately never "run the protocol".

   `why` is the concierge's voice explaining the recommendation. Written as
   reasons a patient would care about rather than credentials: how someone works
   is a better predictor of whether you'll stick with them than where they
   trained. Years, patient load and response time are appended from the roster
   at render time so they can't drift from the rest of the app. */
export const MEET = {
  C_LAYLA: {
    intro: [
      'I’m Dr. Layla.',
      'I’m looking forward to working with you.',
      'My goal isn’t simply to help you lose weight. It’s to help you build habits '
        + 'that hold long after the plan ends.',
    ],
    why: [
      'Weight and metabolic health is what she does every day, not a sideline',
      'Starts everything at half dose and steps up — far fewer of her patients quit',
      'Will tell you plainly if medication isn’t the right route for you',
    ],
  },
  C_JAMIE: {
    intro: [
      'I’m Jamie.',
      'I’m looking forward to working with you.',
      'My goal isn’t to hand you a prescription and disappear. It’s to get the '
        + 'foundations right first, so whatever we add on top actually holds.',
    ],
    why: [
      'Men’s health and performance is the whole of his practice',
      'Fixes sleep and blood pressure before anything else — most men feel it inside a month',
      'Straight with you about what a protocol can and can’t change',
    ],
  },
  C_MAHMOUD: {
    intro: [
      'I’m Dr. Mahmoud.',
      'I’m looking forward to working with you.',
      'My goal isn’t to chase a number on a panel. It’s to change the things that '
        + 'decide how the next thirty years go.',
    ],
    why: [
      'Preventive and metabolic medicine is where he has spent his career',
      'Reads your panel line by line, not just the values the lab flagged',
      'Calls you the same day if something needs acting on now',
    ],
  },
  C_HUDA: {
    intro: [
      'I’m Dr. Huda.',
      'I’m looking forward to working with you.',
      'My goal isn’t to get you back to a number on a scale. It’s to get your '
        + 'energy back first, because everything else follows that.',
    ],
    why: [
      'Postpartum recovery and women’s health is her whole practice',
      'Checks iron and thyroid before anyone talks to you about weight',
      'Will not change a thing while you’re breastfeeding without saying so first',
    ],
  },
};

/* How the relationship runs. Not a package — the shape of working with someone.
   Blood work appears only where the plan actually needs it. */
export function journeyFor(pKey) {
  const p = PROTOCOLS[pKey];
  const out = [
    ['Your first consultation', '30 minutes on video, face to face'],
  ];
  if (p && p.blood !== 'no') out.push(['Blood work, if it’s needed', 'A nurse comes to you']);
  out.push(
    ['A plan written for you', 'After you’ve talked, not before'],
    ['Regular follow-ups', 'They see how you’re actually going'],
    ['Chat support in between', 'For the questions that come up at 11pm'],
    ['Adjustments as your body responds', 'The plan changes when you do'],
  );
  return out;
}

/* ── PREPARING FOR THE CONSULTATION ──
   Asked in the days BETWEEN booking and the call, by the clinician's assistant.
   Explicitly preparation, never diagnosis: every question here is one a doctor
   would otherwise spend the first ten minutes of a paid appointment collecting,
   which is the worst possible use of that time for both of them.

   All tappable. Someone answering these is doing us a favour in a spare minute,
   not filling in a medical history at a desk. */
export const PREP_SCRIPT = [
  { k: 'meds', q: 'Are you taking any medication at the moment?',
    o: ['Nothing right now', 'Blood pressure', 'Thyroid', 'Something else'] },
  { k: 'bloods', q: 'Have you had blood work done in the last year?',
    o: ['Yes, I can share it', 'Yes, but I don’t have it', 'No'] },
  { k: 'allergies', q: 'Any allergies we should know about?',
    o: ['None', 'Penicillin', 'Food allergies', 'Something else'] },
  { k: 'tried', q: 'What have you already tried?',
    o: ['Diet on my own', 'A gym programme', 'Medication before', 'Nothing yet'] },
  { k: 'hope', q: 'And what would make this worth it for you?',
    o: ['Feeling like myself again', 'A number on a test', 'More energy day to day',
        'Getting ahead of something'] },
];

/* ── BEHIND THE SCENES ──
   A reusable strip for work the clinic is doing that the patient cannot act on.
   Today answers "what do I do next"; this answers "what is happening while I
   wait", which is the question that actually generates anxiety. Keeping them as
   separate cards keeps the first one honest — a waiting state is not a task. */
/* ── FULFILMENT ──
   The same shape as `behindScenes`, for the same reason: work the clinic is
   doing that the patient cannot act on, shown so that waiting feels like
   progress rather than silence. Four states, held on the run as `ship`. */
export const SHIP_FLOW = ['confirmed', 'preparing', 'out', 'delivered'];

export function fulfilment(st, pKey) {
  const at = Math.max(0, SHIP_FLOW.indexOf((runOf(st, pKey) || {}).ship || 'confirmed'));
  return [
    { t: 'Plan confirmed', s: 'Paid, and with the pharmacy' },
    { t: 'Preparing your medication', s: 'Dispensed and checked against your plan' },
    { t: 'Out for delivery', s: 'A nurse brings it to you' },
    { t: 'Delivered', s: 'Day 1 starts when it arrives' },
  ].map((x, i) => ({ ...x, s: i < at ? 'done' : i === at ? 'now' : 'wait', note: x.s }));
}

export function behindScenes(stage) {
  if (!stage) return null;
  const ready = stage === 'ready';
  return {
    steps: [
      { t: 'Blood sample received', s: 'done' },
      { t: ready ? 'Lab analysis complete' : 'Lab analysing your sample',
        s: ready ? 'done' : 'now', note: ready ? null : 'Usually 24–48 hours' },
      { t: 'Report ready', s: ready ? 'done' : 'wait' },
    ],
    ready,
  };
}

/* ══════════════════════════════════════════════════════════════════════════
   THE PRACTICE THREAD — one conversation, for the whole relationship

   There used to be two of these. A pre-consultation assistant that belonged to
   the clinician ("Jamie asked me to help prepare"), and a concierge that
   belonged to Valeo. Both were well written. Together they were a bug, because
   they handed the patient a routing decision no patient should ever have to
   make: is this a question for the practice or a question for support?

   In a real clinic that decision does not exist. You message the practice. What
   happens after that — a receptionist, a nurse, the doctor, a system — is the
   clinic's problem, not yours. So there is now exactly ONE thread, it is called
   {clinician}'s Practice, and it runs from the first preparation question to
   week sixteen of a protocol without ever changing its name.

   ── WHY THE STAGE MESSAGES ARE PERSISTED, NOT RENDERED ──
   The old concierge recomputed its opening every time the sheet was opened, so
   the conversation had no past: close it and the state line vanished, reopen it
   and it reappeared as though for the first time. That is the difference
   between a thread and a status panel, and it is instantly legible.

   These lines are dispatched into the run the first time their stage is
   reached, and after that they are simply history. Scrolling up in week six
   shows the night before the first consultation — which is the whole reason
   people trust a thread more than they trust a dashboard.

   `key` is what makes that idempotent. Each stage says its piece once, and
   `run.said` remembers it.

   ── WHY THE SUGGESTIONS ARE STAGE-DERIVED ──
   "Can I take creatine?" is a real question in week six and a meaningless one
   the night before a first consultation, when what someone is actually thinking
   is "where do I join?" and "did I forget to mention something?". Prompts built
   from features get ignored; prompts built from what someone is already
   worrying about are almost impossible not to tap.

   Nothing here names a technology. Whether an answer comes from a model, an
   operations team or the clinician is ours to know and the patient's not to
   care about — the moment the product explains which, it stops being a clinic.
   ══════════════════════════════════════════════════════════════════════════ */
export function practiceScript(st, pKey) {
  const r = pKey ? runOf(st, pKey) : null;
  const c = (pKey && coachOf(pKey)) || DOCTOR;
  const first = givenNameOf(c);
  const status = pKey ? statusOf(st, pKey) : 'none';
  const when = (r && r.slot) ? r.slot.toLowerCase() : 'soon';
  const goal = (pKey && PROTOCOLS[pKey]) ? PROTOCOLS[pKey].goal.toLowerCase() : 'your goal';

  /* ── what the practice says when you arrive at each stage ── */
  const S = {
    /* The consultation just happened and it was free. The practice speaks
       first, and it speaks about the brief, not about money. */
    consulted: {
      key: 'consulted',
      lines: [`Hi ${USER.first} 👋`,
              `${first} has written up your consultation.`,
              'Your care brief is on Today. It says what we heard and what the '
                + 'blood test needs to answer.'],
      chips: [
        { ic: '🩸', q: 'Why do I need a blood test?',
          a: [`${first} cannot write a safe plan without seeing how your body is `
                + 'working right now.',
              'The brief lists the exact questions the results answer.'] },
        { ic: '💰', q: 'What does the programme cost?',
          a: [`SAR ${PROGRAMME_FEE}, once.`,
              'It covers the blood work, the review, your plan, follow-ups and '
                + 'our support. There is nothing to pay later.'] },
        { ic: '📝', q: 'I forgot to mention something.',
          a: ['Tell us and we will add it to your notes.',
              `${first} sees it before writing your plan.`] },
        { ic: '⏳', q: 'How long does all of this take?',
          a: ['The blood test takes about fifteen minutes at your home.',
              'Results come back in a day or two, and your plan follows the '
                + 'review with ' + first + '.'] },
      ],
    },

    /* Paid. The next thing the patient does is pick a time. */
    programme: {
      key: 'programme',
      lines: ['You are on the programme. Thank you.',
              'Step one is your blood test. Pick a time that suits you and a '
                + 'nurse comes to you.'],
      chips: [
        { ic: '🩸', q: 'What happens at the blood test?',
          a: ['A nurse comes to your home, takes one sample, and leaves. About '
                + 'fifteen minutes.',
              'You must not eat for ten hours before it, so mornings are easiest.'] },
        { ic: '💰', q: 'Do I pay for the blood test?',
          a: ['No. Your programme covers it.',
              'There is nothing more to pay at any step.'] },
        { ic: '📈', q: 'When do I get my plan?',
          a: [`Results take one or two days. Then you and ${first} go through `
                + 'them together, and the plan follows that call.'] },
      ],
    },

    bloodsBooked: {
      key: 'bloodsBooked',
      lines: [`Your nurse is booked for ${(r && r.bloodSlot) ? r.bloodSlot.toLowerCase() : 'soon'}.`,
              'Anything you’re unsure about beforehand, just ask.'],
      chips: [
        { ic: '⏰', q: 'When is my nurse arriving?',
          a: [`${(r && r.bloodSlot) || 'Your slot'}, at the address on your account.`,
              'They’ll call when they’re close.'] },
        { ic: '🍽', q: 'Do I need to fast?',
          a: ['Yes — ten hours, water is fine.',
              'Eating beforehand skews the markers your plan is built on, so it would mean redoing it.'] },
        { ic: '☕️', q: 'Can I drink coffee?',
          a: ['Black coffee is best avoided too — it moves glucose and lipids enough to matter.',
              'Water, then coffee the moment the nurse leaves.'] },
        { ic: '💊', q: 'Should I take my usual medication?',
          a: ['Keep taking anything you’re already prescribed unless a clinician told you otherwise.',
              'If you’re unsure about a specific one, tell us which and we’ll check.'] },
      ],
    },

    bloodsDone: {
      key: 'bloodsDone',
      lines: ['We’ve received your blood sample.',
              'We’ll let you know as soon as the laboratory sends the results.'],
      chips: [
        { ic: '📦', q: 'Have my results arrived?',
          a: ['Not yet — the sample reached the lab and is being analysed now.',
              'You can watch it move on your next-step card, and we’ll message you the moment it’s in.'] },
        { ic: '📈', q: 'How long does it take?',
          a: ['Typically 24 to 48 hours from the draw.',
              'We’ll message you rather than make you check.'] },
        { ic: '➡️', q: 'What happens next?',
          a: [`Once results are in you and ${first} go through them together.`,
              'The plan is written straight after that call.'] },
      ],
    },

    followup: {
      key: 'followup',
      lines: [`You’re seeing ${first} ${(r && r.followSlot) ? r.followSlot.toLowerCase() : 'soon'} to go through your results.`,
              'Ask us anything before then.'],
      chips: [
        { ic: '📊', q: 'Can you explain my report?',
          a: ['We can walk you through any marker in plain English.',
              `Which one is on your mind — or shall ${first} take you through the whole thing on the call?`] },
        { ic: '🗓', q: 'When is my follow-up?',
          a: [`${(r && r.followSlot) || 'Your slot'} — thirty minutes with ${first}.`,
              'Same place, here in the app.'] },
        { ic: '📝', q: 'What should I ask about?',
          a: ['Anything that’s been bothering you, and anything you’ve noticed since we last spoke.',
              'Tell us now and we’ll put it in front of the team beforehand.'] },
      ],
    },

    /* ── THE THREAD FOLLOWS THE PARCEL ──
       Keyed on the fulfilment substate, not just on 'shipping', so the practice
       says something different when it leaves than when it was packed. One
       static "we're preparing your order" sitting there for three days is the
       difference between a concierge and an order-status page. */
    shipping: (() => {
      const ship = (r && r.ship) || 'confirmed';
      const lines = {
        confirmed: ['Your plan is confirmed and we’re preparing your first month.',
                    'We’ll message you the moment it leaves us.'],
        preparing: ['Your medication is being dispensed and checked against your plan.',
                    'Not long now.'],
        out:       ['Your package is out for delivery.',
                    'A nurse brings it to you and stays for the first dose.'],
        delivered: ['Your package has arrived.',
                    'Start whenever you’re ready — we’ll be here through the whole run.'],
      }[ship];
      return {
        key: `shipping-${ship}`,
        lines,
        chips: [
          { ic: '📦', q: 'Where is my package?',
            a: [ship === 'out' ? 'On its way to you now.'
                  : ship === 'delivered' ? 'It’s with you — the nurse confirmed delivery.'
                    : 'With the pharmacy, being prepared.',
                'We’ll message you at every step rather than make you check.'] },
          { ic: '🚪', q: 'Do I need to be home?',
            a: ['Yes — a nurse hands it over and stays for the first dose.',
                'If the timing doesn’t work, tell us and we’ll move it.'] },
          { ic: '💊', q: 'When do I take the first dose?',
            a: ['With the nurse, on the day it arrives.',
                `They’ll show you how, and ${first} sees your first week either way.`] },
        ],
      };
    })(),
    ready: {
      key: 'ready',
      lines: ['Your plan is ready.',
              `${first} has finished reviewing everything.`],
      chips: [
        { ic: '📄', q: 'Explain what’s in my plan.',
          a: [`${first} built it around ${goal}.`,
              'Name any single item and we’ll tell you what it’s for and why it’s in there.'] },
        { ic: '❓', q: 'Why these things specifically?',
          a: ['Each one is there for a marker or a habit you and the doctor talked about.',
              'Name one and we’ll tell you which.'] },
        { ic: '💬', q: 'I want to change something.',
          a: [`That’s ${first}’s call rather than ours — but tell us what and we’ll get it in front of the team today.`] },
      ],
    },

    running: {
      key: 'running',
      lines: ['How are things feeling this week?'],
      chips: [
        { ic: '💊', q: 'Can I take creatine?',
          a: ['Nothing in your plan argues against it.',
              'If you want it added properly so the team can track it, we’ll ask.'] },
        { ic: '📊', q: 'What do these biomarkers mean?',
          a: ['Name the one you’re looking at and we’ll put it in plain English.',
              'We’ll also tell you whether yours moved, and whether that matters.'] },
        { ic: '🥗', q: 'Can I eat this?',
          a: ['Tell us what it is and we’ll check it against your plan.',
              'Most things are fine — it’s the timing that usually matters.'] },
        { ic: '📉', q: 'I’ve started feeling worse.',
          a: ['Thanks for telling us — that’s exactly the kind of thing we want to hear early.',
              `We’ve flagged it for ${first}. Tell us what changed and when it started.`] },
      ],
    },
  };

  const fallback = {
    key: 'open',
    lines: [`Hi ${USER.first} 👋`, 'Anything you need, just message us here.'],
    chips: [
      { ic: '🗓', q: 'When is my next appointment?',
        a: ['Everything scheduled is on your Today page.',
            'Tell us what you’d like to change and we’ll sort it.'] },
      { ic: '💬', q: 'I have a question.',
        a: ['Go ahead — we’ll answer if we can, and get the right person if we can’t.'] },
    ],
  };

  /* ── THE KNOWN-DOOR CHECKPOINT ──
     A door-A run sits at 'programme' the moment it is paid, but until a
     doctor signs the order off the practice has different news. Keyed per
     substate so each message fires once, and the ordinary 'programme' script
     follows naturally on approval. */
  if (r && r.door === 'known' && status === 'programme' && r.checkpoint !== 'approved') {
    return r.checkpoint === 'call' ? {
      key: 'checkpoint-call', clinician: c, first,
      lines: [`${first} looked at your order and wants two minutes with you `
                + 'before confirming it.',
              'Nothing to worry about. It’s how we make sure this is right '
                + 'for you. The call is on your Today page.'],
      chips: [
        { ic: '📞', q: 'Why the call?',
          a: ['Something in your answers deserves a doctor’s attention before '
                + 'we dispense.',
              'It takes about ten minutes, and it’s included.'] },
        { ic: '💰', q: 'Have I been charged?',
          a: ['Your programme is paid, and nothing ships until you and '
                + `${first} have spoken.`,
              'If the plan changes, the difference is settled before anything '
                + 'is dispensed.'] },
      ],
    } : {
      key: 'checkpoint-pending', clinician: c, first,
      lines: ['Your order is in. Thank you.',
              `${first} reviews it today. Nothing is dispensed until a `
                + 'doctor has signed it off, and you’ll hear from us today.'],
      chips: [
        { ic: '🩺', q: 'What is being reviewed?',
          a: ['Your answers, your safety screen and the treatment you chose.',
              'A doctor signs off every order before the pharmacy touches it.'] },
        { ic: '⏳', q: 'How long does it take?',
          a: ['Same day, almost always within a few hours.',
              'We’ll message you here the moment it’s confirmed.'] },
      ],
    };
  }

  const s = S[status] || fallback;

  /* ── THE INTRODUCTION HAPPENS ONCE ──
     Replaying "hello, here's how this works" on every open is the loudest
     possible tell that nobody is really there. A person at a desk explains
     themselves the first time you walk up and says "hi again" for the rest of
     your life. Here that is free: the thread is persisted, so the introduction
     is already sitting in the history and the stage message simply follows it. */
  return { ...s, clinician: c, first };
}

/* The closing beat of preparation. It does NOT point anywhere — pointing at a
   button ("tap the chat top right") is what created two identities in the first
   place. This thread is the destination, so the only thing left to say is that
   it stays open. */
export function prepClosing(first) {
  return [
    `That’s everything ${first} needs before you meet.`,
    'If anything comes up before then — a question, a concern, an update — just '
      + 'message us here anytime.',
    'We’re always around.',
  ];
}

/* ══════════════════════════════════════════════════════════════════════════
   THE RECOMMENDATION — what the clinician concluded, and why

   Everything up to this point in the product is a relationship. You meet a
   practice, they get to know you, you prepare, you talk, they go away and
   think. Then the plan page opened and it was a catalogue: protocol name,
   duration, "Scored on", "Runs with", a typed inventory of five items and a
   Buy button. Six screens of being treated like a patient, and then one screen
   that treats you like a shopper.

   The old page answered "what protocol did Jamie choose?". This data answers
   "what did Jamie recommend for me, and why?" — which is a different question
   with a different shape. The protocol is the OUTCOME of the reasoning, so the
   reasoning has to come first and the protocol has to come after it.

   ── WHY THIS IS AUTHORED AND NOT DERIVED ──
   Everything else on this page can be computed from the run: the journey, what
   is included, what was personalised. The reasoning cannot. "Fertility remains
   important to you, so we optimise your own production before we replace it"
   is a clinical judgement, and the day a template generates that sentence is
   the day the page starts lying about who is speaking.

   In the real product these fields are written by the clinician during or
   after the consultation. Here they are authored per protocol, in that
   clinician's voice, and never assembled from fragments.
   ══════════════════════════════════════════════════════════════════════════ */
export const RECOMMEND = {
  P_TEST: {
    goals: ['Improve your energy',
            'Improve libido',
            'Preserve fertility',
            'Raise testosterone naturally before considering TRT'],
    why: {
      symptoms: 'Energy is your biggest concern, and it’s affecting your day-to-day life.',
      priorities: 'Preserving fertility matters to you.',
      approach: 'We’ll optimise your body’s own testosterone production before '
              + 'considering replacement therapy.',
    },
    lead: {
      t: 'Enclomiphene', dose: '12.5 mg, alternate days', status: 'Starts after SHBG review',
      lines: ['Supports your body’s own testosterone production.',
              'Helps preserve fertility.'],
    },
    note: 'Our priority is restoring your energy while preserving fertility. I’d first '
        + 'like to understand how your SHBG behaves before deciding whether replacement '
        + 'therapy is necessary. We’ll review everything together after your blood results.',
  },

  P_WEIGHT: {
    goals: ['Lose 10–20 kg',
            'Keep the muscle you have',
            'Bring your HbA1c back into range',
            'Build habits that outlast the medication'],
    why: {
      symptoms: 'Everything you’ve tried has worked until it stopped, and the weight came back.',
      priorities: 'You’d rather go slower than lose muscle getting there.',
      approach: 'We’ll move your metabolic markers first and let the scale follow, '
              + 'holding protein and resistance work throughout.',
    },
    lead: {
      t: 'Tirzepatide', dose: '2.5 mg weekly, stepping to 5 mg', status: 'Starts on delivery',
      lines: ['Resets the appetite signalling that has been working against you.',
              'Started low and stepped up slowly, so your gut has time to adapt.'],
    },
    note: 'The goal is fat, not weight — which is why we start low, hold the protein '
        + 'floor and lift three times a week rather than chase the scale. I’d rather you '
        + 'lose it slower and keep it off than lose it fast and rebuild it next year.',
  },

  P_LONG: {
    goals: ['Get ahead of what runs in your family',
            'Bring ApoB down and keep it there',
            'Hold onto strength and aerobic capacity',
            'Measure it, rather than assume it'],
    why: {
      symptoms: 'No symptoms yet — which is the point of starting now.',
      priorities: 'Your family history means acting earlier than we otherwise would.',
      approach: 'We’ll bring ApoB down first, and only then introduce anything supervised.',
    },
    lead: {
      t: 'Rapamycin', dose: '5 mg, weekly pulse, supervised', status: 'Deferred to month 2',
      lines: ['Lipids come down before anything else is introduced.',
              'Supervised throughout, with monthly bloods.'],
    },
    note: 'I’ve deliberately put the interesting part second. ApoB is the marker with '
        + 'thirty years of evidence behind it, and there is no sense adding a supervised '
        + 'drug to a plan whose foundation isn’t in place yet. We’ll revisit in month two.',
  },

  P_POST: {
    goals: ['Get your energy back',
            'Bring iron and thyroid back into range',
            'Rebuild strength safely, in the right order',
            'Feel like yourself again'],
    why: {
      symptoms: 'Fatigue since birth — usually a deficiency rather than a discipline problem.',
      priorities: 'Feeling like yourself again comes before anything about weight.',
      approach: 'We’ll replete iron and check thyroid first, then rebuild strength in order.',
    },
    lead: {
      t: 'Iron bisglycinate', dose: '25 mg, alternate days with vitamin C',
      status: 'Starts on delivery',
      lines: ['Repletes the deficiency behind most postpartum fatigue.',
              'Alternate days absorbs better than daily dosing.'],
    },
    note: 'I want to replete you before I ask anything of you. Iron and thyroid first, '
        + 'pelvic floor before load, and nothing about the scale until you have your energy '
        + 'back. If you’re breastfeeding, nothing here changes without me saying so.',
  },
};

/* What the fee actually buys, in the order people worry about it. Derived, so
   a protocol that needs no bloods never claims to include a blood draw. */
export function includedIn(st, pKey) {
  const p = PROTOCOLS[pKey];
  const c = coachOf(pKey) || DOCTOR;
  const first = givenNameOf(c);
  /* `blood: 'maybe'` means the clinician decides on the call, and they have now
     decided — so this has to ask the run, not the template. Promising "home
     blood draw included" to someone the doctor sent straight to a plan puts a
     line in the Included list that contradicts the journey directly above it. */
  const upfront = true;   /* every programme includes the blood work */
  /* Labels, not sentences. These render as a grid you check at a glance, and a
     sentence in a grid cell wraps to four lines and ruins the row — the whole
     point of the shape is that six things are legible in one look. */
  return [
    ...(upfront ? ['Home blood draw'] : []),
    'Medication',
    'Delivery to your door',
    `Consultations with ${first}`,
    'Blood tests',
    'Unlimited support',
    'Progress reviews',
  ];
}

/* ── THE JOURNEY, IN THE PATIENT'S WORDS ──
   `runStages` already describes this arc, but in the machine's vocabulary —
   "Run it for 16 weeks", "Retest Total + free T". That language is correct on
   a protocol page and wrong on this one: nobody lies awake wondering which
   marker gets retested, they wonder what happens next and when someone will
   look at them again. Same lifecycle, answered as a person would ask it. */
export function careJourney(st, pKey) {
  const p = PROTOCOLS[pKey];
  const r = runOf(st, pKey) || {};
  const rank = RX_FLOW.indexOf(statusOf(st, pKey));
  const past = (k) => rank > RX_FLOW.indexOf(k);
  const at = (k) => (past(k) ? 'done' : rank === RX_FLOW.indexOf(k) ? 'now' : 'next');
  const half = Math.round(p.wk / 2);

  return [
    { t: 'First consultation', s: 'Done', state: 'done' },
    /* No longer optional. Every programme starts with blood work, because the
       clinician cannot write the plan without it. */
    { t: 'Blood draw', s: 'A nurse comes to you', when: r.bloodSlot,
      state: past('bloodsDone') ? 'done' : at('bloodsBooked') },
    { t: 'Results reviewed', s: `You and ${givenNameOf(coachOf(pKey) || DOCTOR)} go through them`,
      when: r.followSlot, state: past('followup') ? 'done' : at('followup') },
    { t: 'Medication delivered', s: 'To your door, first month included',
      state: at('shipping') },
    { t: `Week ${half} review`, s: 'We check what’s moving and adjust', state: at('running') },
    { t: 'Final blood test', s: `${p.mk}, retested`, state: at('verdict') },
    { t: 'Progress review', s: 'What worked, what didn’t, what comes next', state: at('reviewing') },
  ];
}

/* ── THE TWO THINGS A REFERENCE PAGE HAS TO ANSWER AT A GLANCE ──
   Where am I, and what is the next thing that happens to me. Both are read off
   the same timeline the page renders below, so the summary at the top and the
   detail further down cannot fall out of step. */
export function planStatus(st, pKey) {
  const r = runOf(st, pKey) || {};
  switch (statusOf(st, pKey)) {
    case 'ready':    return 'Ready to start';
    case 'shipping': return 'On its way to you';
    case 'running':  return `Week ${Math.max(1, Math.ceil((r.day || 1) / 7))} of ${PROTOCOLS[pKey].wk}`;
    case 'verdict':  return 'Awaiting final bloods';
    case 'reviewing':return 'In review';
    case 'done':     return 'Complete';
    default:         return 'In progress';
  }
}

/* Named around the plan rather than the protocol: `nextMilestone` already
   exists for the in-run milestone list and takes (protocol, day). */
/* `lead.status` is the authored pre-start note ("Starts after SHBG review") and
   it is only true until the thing starts. Left static it would still be claiming
   the treatment hadn't begun in week twelve — on a page whose entire premise is
   being reopened months later, that is the one field guaranteed to go stale. */
export function treatmentStatus(st, pKey) {
  const r = runOf(st, pKey) || {};
  switch (statusOf(st, pKey)) {
    case 'ready':    return RECOMMEND[pKey].lead.status;
    case 'shipping': return 'Starts on delivery';
    case 'running':  return `Active · day ${r.day || 1}`;
    case 'verdict':
    case 'reviewing':return 'Course complete';
    case 'done':     return 'Finished';
    default:         return RECOMMEND[pKey].lead.status;
  }
}

export function nextOnPlan(st, pKey) {
  return careJourney(st, pKey).find((s) => s.state !== 'done') || null;
}

/* ══════════════════════════════════════════════════════════════════════════
   THE PROGRAMME — one purchase, at one moment

   The patient is not buying a blood test. The patient is buying help with a
   goal. So the price sits on the programme, and the blood work is a line
   inside it.

   One payment covers the whole course of care. There is no second charge when
   the plan arrives, because the patient already bought the plan. The plan
   screen therefore ends in "Activate", not in "Buy".

   NOTE FOR THE STAKEHOLDER REVIEW: this figure is the example from the design
   discussion. The SAR 600 adjustment is still open, and this number does not
   yet separate the cost of the medication from the cost of the care. Change
   PROGRAMME_FEE and nothing else breaks.
   ══════════════════════════════════════════════════════════════════════════ */
export const PROGRAMME_FEE = 999;

export const PROGRAMME_INCLUDES = [
  'Your first consultation',
  'The blood work Jamie needs',
  'Clinical review of your results',
  'Your personalised treatment plan',
  'Follow-up consultations',
  'Unlimited support from the practice',
];

/* ── THE CARE BRIEF ──
   `CONSULT_SUMMARY.said` already holds what the clinician heard, so the brief
   reuses it rather than authoring the same sentences twice.

   `asks` is the new part and it is the reason the brief works. A blood test
   presented as a price is an obstacle. The same blood test presented as four
   clinical questions is the reason to continue. These are the questions the
   clinician must answer before deciding the treatment, written so a patient
   can read them. */
export const BRIEF = {
  P_TEST: {
    asks: ['How well is your own testosterone production working?',
           'What is your SHBG doing, and is it holding free testosterone down?',
           'Is anything else contributing to the tiredness?',
           'Is there anything we should treat before we start?'],
  },
  P_WEIGHT: {
    asks: ['Where is your HbA1c now?',
           'How is your thyroid function?',
           'Is insulin resistance part of the picture?',
           'Is there any reason to avoid the medication we would normally use?'],
  },
  P_LONG: {
    asks: ['What is your ApoB, and how far is it from target?',
           'Is there inflammation we should be treating first?',
           'How are your liver and kidney markers?',
           'Is it safe to introduce a supervised medication later?'],
  },
  P_POST: {
    asks: ['How low is your ferritin?',
           'Is your thyroid function normal after the birth?',
           'Is vitamin D or B12 contributing to the tiredness?',
           'Is anything else slowing your recovery?'],
  },
};

/* The four steps of the brief, and where the patient stands in them. This is
   the same list on the brief and on Today, so the two cannot disagree. */
export function briefSteps(st, pKey) {
  const rank = RX_FLOW.indexOf(statusOf(st, pKey));
  const at = (k) => (rank > RX_FLOW.indexOf(k) ? 'done'
    : rank === RX_FLOW.indexOf(k) ? 'now' : 'wait');
  return [
    { t: 'First consultation', s: 'done' },
    { t: 'Blood test', s: rank > RX_FLOW.indexOf('bloodsDone') ? 'done'
        : rank >= RX_FLOW.indexOf('bloodsBooked') ? 'now' : at('programme') },
    { t: 'Jamie reviews your results', s: at('followup') },
    { t: 'Your personalised plan', s: at('ready') },
    { t: 'Treatment begins', s: rank >= RX_FLOW.indexOf('shipping') ? 'now' : 'wait' },
  ];
}

/* ══════════════════════════════════════════════════════════════════════════
   THE INSTANT CONSULTATION

   The first build of this was a chat. The patient tapped answers to written
   questions. That is a bot, and it is the thing this screen must not be.

   A consultation is a live meeting with a clinician. So the product does what
   an on-demand service does: the patient asks, the system finds a clinician
   who is free right now, and the call starts. The patient waits seconds, not
   days, and speaks to a person.

   `CALL_TOPICS` is what the clinician covers during that call. It is not a
   list of questions for the patient to tap. It appears as a quiet record of
   what has been discussed so far, because a video call gives a reviewer
   nothing to look at otherwise, and because the patient should be able to see
   that the conversation is going somewhere.

   The same five subjects were the old written questions. A clinician asks them
   out loud. */
export const CALL_TOPICS = [
  'Your goals',
  'Medication and history',
  'Previous blood work',
  'What you have already tried',
  'What matters most to you',
];

/* Who picks up. The lead clinician of the practice takes the call in this
   build, which keeps the Care Brief, the plan and the message thread in one
   person's name. A real rota would put a duty clinician here instead, and
   only this function would change. */
export function onCallNow(pKey) {
  return coachOf(pKey) || DOCTOR;
}

/* How many clinicians can take a call right now. A fixed number in this build.
   A real rota supplies it, and only this function changes. It is a resolver
   rather than a literal in the screen, because the same count must agree with
   the connecting screen if that screen ever shows it. */
export function availableNow() {
  return 3;
}

/* ══════════════════════════════════════════════════════════════════════════
   WHAT THIS SCREEN SELLS

   The Care Brief first showed the mechanics of the programme: what the
   consultation heard, which questions the blood test answers, the five steps
   of the journey, the price and the list of what is included. All of it was
   true. None of it was the reason to continue.

   The reason to continue is clinical judgement. The patient is not choosing a
   blood test, a protocol or a support package. The patient is choosing to let
   one clinician decide what happens to their body, and to keep deciding as
   things change.

   So this screen states one idea. Every decision from now on comes from Jamie
   and from the patient's own results. The three points below are the only
   support that idea needs.

   The price is not here. It is on the checkout screen that follows, before any
   charge occurs. A screen that argues for judgement and then shows a number in
   the same breath argues for neither. */
export function careMeaning(first) {
  return [
    { t: 'Care built around you',
      s: 'Treatment tailored to your health.' },
    { t: 'Clinical decisions, not assumptions',
      s: `${first} makes each treatment decision using your clinical information.` },
    { t: 'Support that continues beyond today',
      s: `Ongoing guidance from ${first} and from the team as your treatment evolves.` },
  ];
}

/* ══════════════════════════════════════════════════════════════════════════
   WHILE A CLINICIAN CONNECTS

   Three builds of this screen were wrong in three ways.

   A chat was a bot. A search ("checking who is free now") showed the inside of
   the routing system. A preparation checklist was calm, but it left the patient
   idle, and an idle patient leaves.

   The wait is now an investment. One question sits under the status: anything
   else the clinician should know. It does three jobs at once. The wait has a
   purpose, the patient puts effort into the session and is far less likely to
   abandon it, and the consultation is genuinely better for the answer.

   A ride-hailing app shows a car moving because the rider has nothing to give.
   A patient has everything to give. That is the difference, and this screen
   uses it.

   ── NAMED, AND DOING SOMETHING ──
   "Jamie is reading what you shared" is believable. "Checking who is free" is
   not, and it sounds like a call centre. A face and a verb read as care that
   has already started.

   This reverses an earlier rule in this file, which said no name may appear
   before a clinician accepts. The rule was right when the screen described a
   search. It is wrong now, because the practice lead takes this call and the
   name is true when it appears. */

/* ── THE FALLBACK MATTERS MORE THAN THE HAPPY PATH ──
   The failure that loses a patient is not a ninety second wait. It is the
   silent fall back to "book a slot tomorrow". A held callback in the same
   session keeps the commitment. A calendar resets it to nothing.

   So the calendar is the last option and never the default. */
export const CALLBACK_MINUTES = 18;

export function callbackAt(mins = CALLBACK_MINUTES) {
  const d = new Date(Date.now() + mins * 60000);
  let h = d.getHours();
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${String(d.getMinutes()).padStart(2, '0')} ${ampm}`;
}

/* ══════════════════════════════════════════════════════════════════════════
   THE LAST TWO MINUTES BEFORE A CONSULTATION

   This is not a waiting screen and it must not be built as one. Both sides are
   getting ready. The clinician is reading the file. The patient is deciding
   what to raise. The screen shows one activity with two halves.

   ── THE CLINICIAN'S HALF ──
   Three states, no more. A patient needs to understand "preparing, then
   joining, then talking". A longer list is an engineering dashboard.

   The verbs matter. "Reviewing your information" describes a person doing
   something. "Checking who is free" describes a system searching, and it tells
   the patient they are in a queue. */
/* ══════════════════════════════════════════════════════════════════════════
   THE MINUTES BEFORE A CONSULTATION

   The headline is the live element. A fixed headline with a moving spinner
   underneath says the page is loading. A headline that changes from reviewing
   to preparing to joining says a person is working through something.

   Every line names a human action. None of them names the system. "Matching",
   "searching" and "loading" describe a queue, and a patient in a queue is
   waiting. A patient whose case is being read is already being cared for.

   ── WHY NOBODY IS NAMED UNTIL THE END ──
   The screen before this one says three clinicians are available. Promising
   Jamie here would contradict it, and it would be a promise the rota cannot
   keep. So the whole wait belongs to "your care team" and "your clinician".
   A name and a face appear only at the moment somebody accepts. */
export const WAIT_STAGES = [
  { head: 'Your care team is reviewing your case',
    eta: 'About 2 minutes' },
  { head: 'Your clinician is preparing for you',
    eta: 'About a minute' },
  { head: 'Your clinician is joining you now',
    eta: 'Any moment now' },
];

/* Three states, and each one says what is happening rather than what is being
   processed. The support lines exist because "Reviewing what you have shared"
   alone leaves the patient guessing which part of their file is open. */
export const WAIT_STEPS = [
  { t: 'Reviewing what you’ve shared', s: 'Your goals, your history, your answers' },
  { t: 'Preparing for your consultation', s: 'Getting up to speed on your case' },
  { t: 'Joining your call', s: 'We’ll connect you automatically' },
];

export const GUIDED = [
  { k: 'meds', q: 'Are you taking any medication at the moment?',
    o: ['Nothing right now', 'Blood pressure', 'Thyroid', 'Something else'] },
  { k: 'bloods', q: 'Have you had blood work done in the last year?',
    o: ['Yes, I can share it', 'Yes, but I don’t have it', 'No'] },
  { k: 'allergies', q: 'Any allergies we should know about?',
    o: ['None', 'Penicillin', 'Food allergies', 'Something else'] },
];

/* ══════════════════════════════════════════════════════════════════════════
   TWO SCREENS, TWO JOBS

   Screen one is the moment after the consultation: the clinician says "here
   is what I think, and here is where I'd start". Screen two asks "what
   exactly am I committing to?". They are different psychological moments and
   they must not be merged.

   ── THE CLINICIAN SPEAKS IN THE FIRST PERSON ──
   An earlier build headlined the outcome ("Better sexual health, with care
   built around you") and listed three things we were "working toward". That
   is a brochure's grammar. Nobody who just spent twenty minutes talking to a
   clinician wants the company's summary of the conversation; they want the
   clinician's conclusion, in the clinician's own voice. So every field here
   is written as speech: `think` is what I made of what you told me, `why` is
   why I'd start where I'm pointing.

   ── AUTHORED, NEVER ASSEMBLED ──
   These sentences are clinical judgement. In the real product the clinician
   writes them during or after the call; here they are authored per programme,
   in that clinician's voice, grounded in the same facts as `why` above and
   inventing nothing. The day a template generates "that pattern usually isn't
   about discipline" is the day the page starts lying about who is speaking.

   ── `prog` IS THE PATIENT-FACING NAME ──
   PROTOCOLS[].t is our catalogue word ("Testosterone", "Longevity") and
   "protocol" is our internal noun. A recommendation is named the way a
   clinician would say it across a desk.

   ── NO INTERNAL WORDS ──
   "Protocol" is our word. A patient should never have to learn it.

   ── WHAT IS NOT CLAIMED ──
   The clinician cannot finalise treatment before seeing blood results, so
   nothing here says the treatment is decided. Each `desc` says the opposite,
   in the patient's favour: the treatment is built around the results. */
/* This block is the stakeholder's own copy and design (Aug 2026): text,
   benefit columns and the name "Male Performance Program" all came from
   their mock, verbatim — including the US spelling of "optimize".

   `points` are the three columns inside the dark recommendation panel. `ic`
   is a key the screen maps to an icon, so this file stays free of component
   imports. Titles fit one column at 13px — about 22 characters.

   `marks` are the phrases inside `think` that get the hand-drawn underline —
   the two or three words the clinician would underline on paper. Each must
   appear in `think` verbatim (the screen finds them by exact match), and two
   per programme is the ceiling: underline more and nothing is underlined. */
Object.assign(RECOMMEND.P_TEST, {
  speak: {
    prog: 'Male Performance Program',
    desc: 'A clinician-led care plan designed to improve your energy, sexual '
        + 'health and hormone health through structured, ongoing care.',
    think: 'From our conversation, it’s clear your energy and sexual health '
         + 'have both changed, and maintaining fertility is an important '
         + 'priority. I believe these concerns are linked and should be '
         + 'addressed together.',
    marks: ['energy and sexual health', 'fertility'],
    why: 'This is the care plan I recommend for you.',
    points: [
      { ic: 'energy', t: 'Boost energy', s: 'Feel like yourself again' },
      { ic: 'heart', t: 'Enhance sexual health', s: 'Improve performance and confidence' },
      { ic: 'shield', t: 'Support fertility', s: 'Protect and optimize your future' },
    ],
  },
});
Object.assign(RECOMMEND.P_WEIGHT, {
  speak: {
    prog: 'Weight & Metabolic Health',
    desc: 'A clinician-led care plan designed to bring your weight and '
        + 'metabolic markers back in range through structured, ongoing care.',
    think: 'Everything you’ve tried has worked until it stopped, and the '
         + 'weight has come back each time. That pattern usually isn’t about '
         + 'discipline — and you told me you’d rather go slower than lose '
         + 'muscle getting there. I agree. I want to see your metabolic '
         + 'markers before deciding exactly how we treat this.',
    marks: ['the weight has come back', 'lose muscle'],
    why: 'This is the care plan I recommend for you.',
    /* The weight programme's real staffing: a doctor plus nutritionist and
       performance coach, with continuous glucose monitoring. Stated here
       because it is what this plan contains, not a generic outcome. */
    points: [
      { ic: 'scale', t: 'Lose the weight', s: 'And keep it off this time' },
      { ic: 'muscle', t: 'A full care team', s: 'Doctor, nutritionist and coach' },
      { ic: 'chart', t: 'Live glucose data', s: 'CGM informs every adjustment' },
    ],
  },
});
Object.assign(RECOMMEND.P_LONG, {
  speak: {
    prog: 'Longevity & Heart Health',
    desc: 'A clinician-led care plan designed to measure the risks that run '
        + 'in your family and act on them early, through structured, ongoing care.',
    think: 'You feel fine today, and that’s exactly the right time to act. '
         + 'With your family history, I want a clear picture of your '
         + 'cardiovascular risk — ApoB above all — before we assume anything.',
    marks: ['family history', 'cardiovascular risk'],
    why: 'This is the care plan I recommend for you.',
    points: [
      { ic: 'heart', t: 'Lower your risk', s: 'ApoB down, and kept down' },
      { ic: 'muscle', t: 'Stay strong', s: 'Strength and capacity preserved' },
      { ic: 'chart', t: 'Measure it', s: 'Tracked, never assumed' },
    ],
  },
});
Object.assign(RECOMMEND.P_POST, {
  speak: {
    prog: 'Postpartum Recovery',
    desc: 'A clinician-led care plan designed to restore what birth has '
        + 'drawn down and rebuild your strength through structured, ongoing care.',
    think: 'Fatigue like this after birth is usually a deficiency, not a '
         + 'discipline problem. Before anyone talks to you about weight, I '
         + 'want to see your iron and thyroid.',
    marks: ['a deficiency', 'iron and thyroid'],
    why: 'This is the care plan I recommend for you.',
    points: [
      { ic: 'energy', t: 'Restore energy', s: 'Iron and thyroid repleted' },
      { ic: 'muscle', t: 'Rebuild strength', s: 'In the right order' },
      { ic: 'heart', t: 'Feel yourself again', s: 'Before anything about weight' },
    ],
  },
});


/* The sequence, stated plainly. A patient must understand that they are not
   buying a treatment that has already been decided. They are entering care in
   which the treatment is decided once the clinician has what they need. */
export function careSteps(first) {
  return [
    { t: 'Blood test', s: 'A nurse comes to you.' },
    { t: 'Results reviewed', s: `${first} reads your results.` },
    { t: 'Treatment confirmed', s: 'Chosen around what your results show.' },
    { t: 'Care begins', s: 'Your treatment arrives and your care continues.' },
  ];
}


/* ══════════════════════════════════════════════════════════════════════════
   ONE COURSE OF CARE — THE 12-WEEK PLAN

   There is exactly one duration, because the clinician recommended a specific
   course of care, not a menu. An earlier build compared a 1-month and a
   3-month column; it made the recommendation look like shopping and made the
   price look like it had a cheaper version behind it. The patient is not
   choosing between packages — they are looking at the complete loop of care
   they are about to enter: baseline, understand, treat, follow, reassess.

   ── THE ROWS COME FROM THE REAL PROTOCOL ARCHITECTURE ──
   The shape mirrors the production peptide-protocol PDPs (Aug 2026): baseline
   and week-12 testing, results review, monthly dispatch, concierge check-in
   calls on day 10 and day 25, a week-6 mid-point review, unlimited messaging,
   and a week-12 reassessment. Each row is name + what it does + when it
   happens, and never a paragraph.

   ── PER-PROGRAMME ROWS ──
   The weight programme carries its real care team — nutritionist, performance
   coach, and continuous glucose monitoring — because that is what that plan
   actually contains. Rows appear only where the plan genuinely includes them.

   ── PRICE ──
   One figure: the programme fee plus three months of treatment, both derived
   from the same constants as before so nothing drifts. No per-month figure
   and no "save X" line — there is no monthly alternative to save against. */
/* ── THE KNOWN-DOOR PLAN ──
   Not the programme. A person who has already decided wants a simple,
   smaller, cheaper thing: a doctor signs the order off, the medication
   arrives monthly, a short check-in keeps the dose right, and the practice
   is a message away. No blood test is required to start; if the doctor
   recommends testing later, it is arranged then. Priced per month, well
   under the 12-week programme, because it carries less care. */
export function knownPlan(pKey, opts = {}) {
  const { wants = null, short = null } = opts;
  const p = PROTOCOLS[pKey];
  const perMonth = Math.round(p.price / 4 / 50) * 50;
  return {
    title: short ? `${short} Monthly Plan` : 'Monthly Care Plan',
    price: 499 + perMonth,
    rows: [
      { ic: 'doctor', t: 'Doctor review of your order', b: 'today',
        s: 'A Valeo doctor checks your answers and signs off before anything ships' },
      { ic: 'box', t: 'Medication delivered', b: 'monthly',
        s: wants
          ? `Your ${wants}, dispensed and delivered in cold chain`
          : 'Dispensed and delivered in cold chain' },
      { ic: 'cal', t: 'Doctor check-in', b: 'monthly',
        s: 'A short review each month to keep your dose right' },
      { ic: 'chat', t: 'Message the practice', b: 'any time',
        s: 'Support between check-ins, in app or on WhatsApp' },
    ],
    steps: [
      { t: 'Doctor reviews your order', s: 'Today, before anything is dispensed' },
      { t: 'Your medication arrives', s: 'Delivered to your door, in cold chain' },
      { t: 'Check in and adjust', s: 'A short review with your doctor each month' },
    ],
    note: 'No blood test is needed to start. If your doctor recommends '
        + 'testing later, we arrange it at your home.',
  };
}

/* `opts.door` varies the copy, never the care: a known-door patient arrives
   without a consultation, so the sequencing note and the journey's first row
   speak about the doctor's same-day order review instead of a consultation
   that never happened. `opts.wants` names what he asked for in the
   medication row — he named it first. */
export function carePlan(pKey, opts = {}) {
  const { door = 'resolve', wants = null } = opts;
  const p = PROTOCOLS[pKey];
  const c = coachOf(pKey) || DOCTOR;
  const first = givenNameOf(c);
  const perMonth = Math.round(p.price / 4 / 50) * 50;

  /* ── EVERY TANGIBLE, IN ONE TABLE, IN FOUR QUIET SECTIONS ──
     The patient is being asked to pay, so everything the money buys is
     listed: who looks after them, what gets measured, what they receive,
     and how they are followed. Content comes from the production protocol
     architecture (Aug 2026 PDPs): unlimited doctor consultations, monthly
     cold-chain dispatch, concierge calls on days 10 and 25, dose titration,
     the supplement voucher, and the week-12 retest.

     Sections keep thirteen rows scannable without breaking the single
     table: people, then measurement, then treatment, then follow-up — the
     order a patient asks "who / how do you know / what do I get / how do
     you keep me on track". `ic` is a concept key the screen maps to a
     glyph. Row copy follows name + what it does + when: no paragraphs. */
  const sections = [
    { k: 'team', t: 'Your care team', rows: [
      { ic: 'doctor', t: 'Your doctor', b: 'Unlimited',
        s: `Consultations with ${first}, book any time in app or WhatsApp` },
      { ic: 'food', t: 'Nutrition coach', b: 'Throughout',
        s: 'An evolving nutrition plan as your markers change' },
      { ic: 'gym', t: 'Performance coach', b: 'Throughout',
        s: 'A training plan that adapts as your body changes' },
    ] },
    { k: 'testing', t: 'Testing & tracking', rows: [
      { ic: 'test', t: 'Blood test', b: 'Week 1 + 12',
        s: 'Full panel, collected at home by a nurse' },
      { ic: 'cgm', t: 'Glucose monitoring', b: 'CGM included',
        s: 'Live glucose data informs every adjustment' },
    ] },
    { k: 'treatment', t: 'Your treatment', rows: [
      { ic: 'rx', t: 'Personalised treatment', b: 'From week 1',
        s: `Selected by ${first} around your results` },
      { ic: 'box', t: 'Medication delivered', b: '3 deliveries',
        s: wants
          ? `Your ${wants}, dispensed monthly in cold chain`
          : 'Dispensed monthly and delivered in cold chain' },
      { ic: 'tune', t: 'Dose titration', b: 'Weeks 1–12',
        s: 'Managed medically, refined as your data evolves' },
      { ic: 'gift', t: 'Supplement voucher', b: 'Week 1',
        s: 'SAR 150 on our range, issued after your consultation' },
    ] },
    { k: 'support', t: 'Follow-up & support', rows: [
      { ic: 'cal', t: 'Follow-up consultations', b: 'Weeks 4, 8 & 12',
        s: `One-to-one progress reviews with ${first}` },
      { ic: 'call', t: 'Care team check-ins', b: 'Days 10 & 25',
        s: 'Concierge calls to check how you are doing' },
      { ic: 'chat', t: 'Message the practice', b: 'Any time',
        s: 'In-app and WhatsApp support between consultations' },
      { ic: 'chart', t: 'Progress review', b: 'Week 12',
        s: 'What changed, and what comes next' },
    ] },
  ];

  /* ── THE FULL JOURNEY, WEEK BY WEEK ──
     Behind "View entire programme journey". The consultation row is marked
     done because the patient reading this page has just finished it — the
     journey has already started, which is the quietest possible argument
     for continuing. The weeks 2–5 line sets expectations on purpose: the
     single most important sentence for one-month churn is the one that
     says early silence is normal. */
  const timeline = [
    door === 'known'
      /* No consultation happened on this door. The first event is the
         checkpoint, and it is dated: today. */
      ? { w: 'Today', t: 'Doctor review of your order',
          s: 'A Valeo doctor reviews your answers and your order today. '
           + 'Nothing is dispensed until it’s signed off.' }
      : { w: 'Pre-programme', t: 'Online consultation', done: true,
          s: `Your goals, history and symptoms, reviewed with ${first}.` },
    { w: 'Week 1', t: 'Testing and first steps',
      s: `A nurse collects your blood panel at home. ${first} reviews your `
       + 'results and confirms your treatment, and your first month is dispatched.' },
    { w: 'Weeks 2–5', t: 'Building the base',
      s: 'Daily treatment, with care team check-ins on day 10 and day 25. '
       + 'It is normal to notice little change in this period.' },
    { w: 'Week 4', t: 'First follow-up',
      s: `A one-to-one with ${first} on how your first four weeks have gone.` },
    { w: 'Week 6', t: 'Mid-point review',
      s: 'Your response reviewed, and your dosing adjusted if required. '
       + 'Month 2 dispatched.' },
    { w: 'Week 8', t: 'Second follow-up',
      s: `A progress review with ${first}, refining your plan for the final month.` },
    { w: 'Weeks 9–12', t: 'Consolidation',
      s: 'Month 3 dispatched. Your treatment continues as your results build.' },
    { w: 'Week 12', t: 'Retest and reassess',
      s: `A repeat blood panel with your nurse, a final review with ${first}, `
       + 'and your next-step plan.' },
  ];

  return {
    weeks: 12,
    /* The page title is the programme name the clinician recommended on the
       screen before, so the two screens can never drift apart. */
    title: `12-Week ${RECOMMEND[pKey]?.speak?.prog || 'Care Plan'}`,
    price: 2499 + perMonth * 3,
    sections,
    timeline,
    /* Sequencing, not a blocker. This is how the care works. */
    how: door === 'known'
      ? 'A Valeo doctor reviews your order today, before anything is '
        + 'dispensed. Your blood test then confirms the dose is right for '
        + 'you, and your care continues through the programme.'
      : `Your care begins with the information ${first} needs to personalise `
        + 'your treatment. Once your results are reviewed, your treatment is '
        + 'confirmed and your care continues through the programme.',
    /* Expectation-setting, adapted from the shared protocol skeleton. */
    pace: 'Care like this is designed over 12 weeks, and it is normal to '
        + 'notice very little in the first few weeks. Your body responds '
        + 'gradually, which is why your care includes testing at the start '
        + 'and at week 12. Your progress is measured, not guessed.',
  };
}
