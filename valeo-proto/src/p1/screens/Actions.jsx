import { useState } from 'react';
import Icon from '../ui/Icon';

/*
 * THREE ACTION SCREENS, NOT FOURTEEN.
 *
 * Every step in the plan has to land somewhere real when the patient presses
 * it, and there are fourteen of them. Building fourteen bespoke screens would
 * break the one claim this prototype exists to make: that a new step published
 * in the Studio needs no new code. So there are three archetypes, and the plan
 * item supplies the words.
 *
 *   SCHEDULE  the patient picks a time          (book a nurse, a consult, a retest)
 *   STATUS    somebody else is doing it         (lab running, pharmacy shipping)
 *   CHECK-IN  the patient reports how they are  (pain and capacity)
 *
 * Adding a fifteenth step adds a state, not a screen. Same argument as the home
 * card, one level down.
 */

/* Slots are fixtures. Real scheduling needs an ops calendar this prototype does
   not have, so it offers a plausible week rather than inventing availability it
   cannot honour. */
const SLOTS = [
  { d: 'Tue 2 Sep', t: '09:00' }, { d: 'Tue 2 Sep', t: '14:30' },
  { d: 'Wed 3 Sep', t: '08:30' }, { d: 'Wed 3 Sep', t: '17:00' },
  { d: 'Thu 4 Sep', t: '11:00' }, { d: 'Sat 6 Sep', t: '10:00' },
];

function Head({ title, sub, onBack }) {
  return (
    <div className="shead">
      <button className="iconbtn" onClick={onBack}><Icon name="back" size={14} /></button>
      <div style={{ flex: 1 }}>
        <div className="stitle">{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── 1. SCHEDULE ── */
export function Schedule({ item, onBack, onDone }) {
  const [slot, setSlot] = useState(null);
  const atHome = /nurse/i.test(item.t) || /nurse/i.test(item.action?.label || '');

  return (
    <div className="screen">
      <Head title={item.t} sub="Choose a time" onBack={onBack} />
      <div className="scroll pad">
        <p className="lead">{item.sub}</p>

        <div className="act-where">
          <Icon name={atHome ? 'home' : 'steth'} size={15} />
          <div>
            <b>{atHome ? 'At your home' : 'Video call'}</b>
            <span>{atHome
              ? 'A Valeo nurse comes to you. Allow about twenty minutes.'
              : 'With one of our peptide doctors. Allow about thirty minutes.'}</span>
          </div>
        </div>

        <div className="lbl-sm">Available times</div>
        <div className="slots">
          {SLOTS.map((s) => {
            const k = `${s.d} ${s.t}`;
            return (
              <button key={k} className={`slot ${slot === k ? 'on' : ''}`} onClick={() => setSlot(k)}>
                <b>{s.d}</b><span>{s.t}</span>
              </button>
            );
          })}
        </div>

        <p className="fineprint">
          Times are indicative in this prototype. Real availability comes from the
          ops calendar.
        </p>
      </div>
      <div className="foot">
        <button className="cta" disabled={!slot} onClick={() => onDone(slot)}>
          {slot ? `Confirm ${slot}` : 'Pick a time'} <Icon name="chev" size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── 2. STATUS ──
   The screen for the nine steps out of fourteen that are somebody else's move.
   It exists to answer one question: is anything actually happening? */
export function Status({ item, onBack, onDone }) {
  const stages = item.action?.kind === 'track'
    ? ['Packed, cold chain', 'With the courier', 'Out for delivery', 'Delivered']
    : ['Received', 'In progress', 'Ready'];
  const at = 1;

  return (
    <div className="screen">
      <Head title={item.t} sub={item.when} onBack={onBack} />
      <div className="scroll pad">
        <p className="lead">{item.sub}</p>

        <div className="act-who">
          <span className="who-av">{item.doctorAdded ? 'D' : (item.actor || '?')[0]}</span>
          <div>
            {/* Items the clinician added carry the actor "Doctor added", which
                reads as nonsense in a sentence. Name the source instead. */}
            <b>{item.doctorAdded ? 'Added by your doctor' : `${item.actor} has this`}</b>
            <span>
              {item.doctorAdded
                ? 'Arranged at your consultation. Nothing is needed from you yet.'
                : 'Nothing is needed from you. We will tell you when it moves.'}
            </span>
          </div>
        </div>

        <div className="lbl-sm">Where it is</div>
        <ol className="track">
          {stages.map((s, i) => (
            <li key={s} className={i < at ? 'done' : i === at ? 'now' : ''}>
              <i />
              <span>{s}</span>
            </li>
          ))}
        </ol>

        <p className="fineprint">
          Live tracking needs the ops backend. This prototype shows the shape of
          the screen, not a real consignment.
        </p>
      </div>
      <div className="foot">
        <button className="cta ghosted" onClick={onDone}>
          Demo: mark this as happened <Icon name="chev" size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── 3. CHECK-IN ──
   The one thing a Recover and Rebuild patient can report on day zero.
   Recovery is measured in pain and in what the body will do, and both of those
   are available the minute somebody has paid. No lab, no scale, no ops
   integration. That is what makes the tracker work before any result exists. */
const DOTS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function CheckIn({ first, previous, onBack, onDone }) {
  const [pain, setPain] = useState(previous ? previous.pain : null);
  const [cap, setCap] = useState(previous ? previous.capacity : null);
  /* Asked once, at the baseline. The target is the patient's own answer rather
     than a number the product picked for them, because a goal somebody else set
     is a goal nobody owns. */
  const [want, setWant] = useState(null);
  const ready = pain != null && cap != null && (!first || want != null);

  return (
    <div className="screen">
      <Head title={first ? 'Your starting point' : 'Check in'}
        sub={first ? 'Week 12 reads against this' : 'Takes ten seconds'} onBack={onBack} />
      <div className="scroll pad">
        <p className="lead">
          {first
            ? 'Two numbers, before anything starts. They are what the Week 6 review and the Week 12 panel get read against.'
            : 'Two numbers. The doctor sees these before your next review.'}
        </p>

        <div className="scale">
          <div className="lbl-sm">Pain today</div>
          <div className="dots">
            {DOTS.map((n) => (
              <button key={n} className={`dot ${pain === n ? 'on' : ''} ${pain != null && n <= pain ? 'fill' : ''}`}
                onClick={() => setPain(n)}>{n}</button>
            ))}
          </div>
          <div className="ends"><span>None</span><span>As bad as it gets</span></div>
        </div>

        <div className="scale">
          <div className="lbl-sm">What your body will do today</div>
          <div className="dots">
            {DOTS.map((n) => (
              <button key={n} className={`dot ${cap === n ? 'on' : ''} ${cap != null && n <= cap ? 'fill' : ''}`}
                onClick={() => setCap(n)}>{n}</button>
            ))}
          </div>
          <div className="ends"><span>Nothing</span><span>Everything I want</span></div>
        </div>

        {first && (
          <div className="scale">
            <div className="lbl-sm">Where you want to be by Week 12</div>
            <div className="dots">
              {DOTS.map((n) => (
                <button key={n} className={`dot ${want === n ? 'on' : ''} ${want != null && n <= want ? 'fill' : ''}`}
                  onClick={() => setWant(n)}>{n}</button>
              ))}
            </div>
            <div className="ends"><span>As I am now</span><span>Back to full</span></div>
          </div>
        )}

        <p className="fineprint">
          Self-reported, and deliberately so. This is your own account of your
          recovery, which is the one reading that exists before any blood is drawn.
        </p>
      </div>
      <div className="foot">
        <button className="cta" disabled={!ready}
          onClick={() => onDone({ pain, capacity: cap }, first ? want * 10 : undefined)}>
          {first ? 'Set my starting point' : 'Save'} <Icon name="chev" size={16} />
        </button>
      </div>
    </div>
  );
}
