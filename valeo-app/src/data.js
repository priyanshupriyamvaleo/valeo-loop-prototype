/* Kept deliberately small — enough to drive the prototype, no schema. */

export const PROTOCOLS = {
  P_SLEEP: {
    t: 'Sleep & Recovery', wk: 8, mk: 'HRV + sleep latency',
    goal: 'Fall asleep faster and wake up actually recovered',
    stack: ['Magnesium threonate, 2h before bed', 'Morning light, 10 min within an hour of waking',
            'Caffeine cut-off 10h before sleep', 'Room to 18°C, blackout'],
    risk: 'Magnesium can loosen stools for the first week. We start at half dose and step up.',
    wrongFor: 'Shift workers on rotating nights — the light timing does more harm than good.',
  },
  P_WEIGHT: {
    t: 'Weight Loss', wk: 12, mk: 'HbA1c',
    goal: 'Drop fasting glucose and lose fat without losing muscle',
    stack: ['Tirzepatide 2.5 → 5 mg weekly', 'Protein floor 1.6 g/kg bodyweight',
            'Resistance training 3× a week', 'Iron + vitamin C, mornings'],
    risk: 'Nausea in weeks 1–3 is common. Muscle loss if you undershoot protein.',
    wrongFor: 'Anyone with a history of pancreatitis, or planning pregnancy inside a year.',
  },
  P_SKIN: {
    t: 'Skin & Anti-Ageing', wk: 12, mk: 'Collagen density',
    goal: 'Rebuild collagen density instead of masking the surface',
    stack: ['Tretinoin 0.05%, nights, buffered', 'Oral collagen peptides 10 g daily',
            'SPF 50 every morning, non-negotiable', 'Ferritin correction if under 50'],
    risk: 'Retinoid purge for 4–6 weeks — it gets worse before it gets better.',
    wrongFor: 'Pregnancy, breastfeeding, or active eczema on the face.',
  },
  P_ATH: {
    t: 'Peak Athlete', wk: 16, mk: 'VO₂max + lactate',
    goal: 'Add a gear you do not currently have',
    stack: ['Zone 2 base, 180 min a week', 'One VO₂max interval session weekly',
            'Creatine monohydrate 5 g daily', 'Sodium + carb intra-workout above 90 min'],
    risk: 'Overreaching if you add intensity before the base is built. We gate week 5 on HRV.',
    wrongFor: 'Uncontrolled hypertension, or anyone inside 6 weeks of a soft-tissue injury.',
  },
  P_LONG: {
    t: 'Longevity', wk: 24, mk: 'ApoB, hsCRP',
    goal: 'Move the markers that actually predict lifespan',
    stack: ['ApoB target under 60 mg/dL', 'Rapamycin, weekly pulse, physician-supervised',
            'Zone 2 + resistance, 5 days a week', 'Omega-3 index above 8%'],
    risk: 'Rapamycin needs monthly bloods. Mouth ulcers and mild immune dip are dose-dependent.',
    wrongFor: 'Anyone immunosuppressed, or with an active infection.',
  },
  P_TEST: {
    t: 'Testosterone', wk: 16, mk: 'Total + free T',
    goal: 'Raise free testosterone without shutting down your own production',
    stack: ['Sleep first — 7h floor before anything else', 'Zinc + vitamin D to sufficiency',
            'Compound lifts 3× weekly', 'Enclomiphene only if labs justify it'],
    risk: 'Haematocrit can climb. We retest at week 8 and pull back if it does.',
    wrongFor: 'Anyone trying to conceive in the next 12 months without a fertility review first.',
  },
  P_FOCUS: {
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
    img: null, mono: 'BJ', tone: '#254A73', match: 93, tier: 'adv',
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
