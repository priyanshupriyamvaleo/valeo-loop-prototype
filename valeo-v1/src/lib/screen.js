import { RECOMMEND, focusRun, statusOf } from '../data';

/* ══════════════════════════════════════════════════════════════════════════
   WHICH SCREEN AM I ON?

   This prototype has one URL. Everything a reviewer sees is internal state, so
   there is no address to attach a comment to. Without a resolver you get
   "the spacing here is wrong" filed against `index.html`, and nobody can find
   "here" again a week later.

   Two values come out. `key` groups the comments and must stay stable, because
   changing it orphans every comment already filed under the old one. `label`
   is what a person reads and can be reworded freely.

   ── WHY TODAY SPLITS BY STATUS ──
   The Today tab is not one screen. It renders a consultation card, a blood
   draw card, a summary, a plan-ready card, a delivery tracker and a daily log,
   and those are as different from each other as separate pages are. Filing
   them all under "Today" would pile unrelated feedback into one thread, which
   is exactly the failure this resolver exists to prevent.

   The same is true of the plan: before purchase it is a care plan, and after
   it is a reference. One key each.
   ══════════════════════════════════════════════════════════════════════════ */

const FLOW = {
  home:     'Valeo home',
  consultation: 'First consultation',
  brief:    'Care brief',
  between:  'Greeting',
  coach:    'Intake chat',
  meet:     'Meet your doctor',
  buy:      'Checkout',
  baseline: 'Blood test',
  intro:    'Intro',
  questions:'Questions',
  matching: 'Matching',
  review:   'Review',
  unlock:   'Unlock',
};

/* The Today card, named for what it actually shows. */
const TODAY = {
  consulted:   'care brief ready',
  programme:   'blood test to book',
  bloodsBooked:'blood draw scheduled',
  bloodsDone:  'waiting on results',
  followup:    'follow-up booked',
  ready:       'plan ready',
  shipping:    'preparing treatment',
  running:     'daily log',
  verdict:     'retest due',
  reviewing:   'in review',
  done:        'verdict',
};

const TAB = {
  plan: 'Plan', discover: 'Discover', protocols: 'Protocols', twin: 'Twin',
};

export function screenOf({ flow, tab, st, booking, detail }) {
  if (flow === 'consult') {
    const m = booking === 'bloods' ? 'blood draw' : 'follow-up';
    return { key: `consult:${booking || 'review'}`, label: `Scheduling — ${m}` };
  }

  if (flow === 'detail') {
    const status = detail ? statusOf(st, detail) : 'saved';
    /* The care plan replaces the protocol page from `ready` onward. Same route,
       genuinely different screen — see ProtocolDetail's guard. */
    const plan = RECOMMEND[detail]
      && ['ready', 'shipping', 'running'].includes(status);
    if (plan) {
      return status === 'ready'
        ? { key: 'careplan:ready', label: 'Care plan — before purchase' }
        : { key: 'careplan:live', label: 'Care plan — during treatment' };
    }
    return { key: 'protocol', label: 'Protocol detail' };
  }

  if (flow === 'app') {
    if (tab === 'today') {
      const f = focusRun(st);
      const s = f ? f.status : 'empty';
      /* `shipping` covers both the wait and the delivered moment, and those are
         two different cards, so the parcel substate has to be in the key. */
      const sub = s === 'shipping' && f.run && f.run.ship === 'delivered'
        ? 'delivered' : s;
      const name = s === 'empty' ? 'nothing running' : (TODAY[sub] || TODAY[s] || s);
      return { key: `today:${sub}`, label: `Today — ${name}` };
    }
    return { key: `tab:${tab}`, label: TAB[tab] || tab };
  }

  return { key: flow, label: FLOW[flow] || flow };
}

/* Short, and honest about what it does not know. Anything under a minute is
   "just now" rather than a spinning seconds counter. */
export function ago(iso) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = s / 60;
  if (m < 60) return `${Math.floor(m)}m ago`;
  const h = m / 60;
  if (h < 24) return `${Math.floor(h)}h ago`;
  const d = h / 24;
  if (d < 7) return `${Math.floor(d)}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}
