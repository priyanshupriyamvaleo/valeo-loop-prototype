/* Kept deliberately small — enough to drive the prototype, no schema. */

export const PROTOCOLS = {
  P_SLEEP: { t: 'Sleep & Recovery', wk: 8,  mk: 'HRV + sleep latency' },
  P_WEIGHT:{ t: 'Weight Loss',      wk: 12, mk: 'HbA1c' },
  P_SKIN:  { t: 'Skin & Anti-Ageing', wk: 12, mk: 'Collagen density' },
  P_ATH:   { t: 'Peak Athlete',     wk: 16, mk: 'VO₂max + lactate' },
  P_LONG:  { t: 'Longevity',        wk: 24, mk: 'ApoB, hsCRP' },
  P_TEST:  { t: 'Testosterone',     wk: 16, mk: 'Total + free T' },
  P_FOCUS: { t: 'Focus & Brain',    wk: 12, mk: 'Reaction time' },
};

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
