import { useState } from 'react';
import Icon from '../ui/Icon';
import { serviceOf, findService } from '../../p2/lib/seed';
import { actorOf, whenLabel } from '../lib/journey';

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
            <b>{serviceOf(item.service)?.t || (atHome ? 'At your home' : 'Video call')}</b>
            <span>{serviceOf(item.service)?.note || (atHome
              ? 'A Valeo nurse comes to you. Allow about twenty minutes.'
              : 'With one of our peptide doctors. Allow about thirty minutes.')}</span>
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
      <Head title={item.t} sub={whenLabel(item)} onBack={onBack} />
      <div className="scroll pad">
        <p className="lead">{item.sub}</p>

        <div className="act-who">
          <span className="who-av">{actorOf(item)[0]}</span>
          <div>
            {/* Items the clinician added carry the actor "Doctor added", which
                reads as nonsense in a sentence. Name the source instead. */}
            <b>{item.doctorAdded ? 'Added by your doctor' : `${actorOf(item)} has this`}</b>
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
      {/* No button. This step is not the patient's to advance, and a control
          that pretends otherwise is the thing that made the old screen feel
          like a prototype. Time moves from the demo rail instead. */}
      <div className="foot">
        <div className="tiny">Nothing to do here. We will tell you when it moves.</div>
      </div>
    </div>
  );
}

/* ── 4. THE REPORT ──
   What "your results are ready" actually opens. Markers are placeholders
   pending clinical sign-off, and the screen says so rather than presenting
   invented numbers as findings. */
const PANEL = [
  { t: 'hs-CRP', v: '4.1', u: 'mg/L', ref: 'under 3.0', flag: 'high' },
  { t: 'ESR', v: '18', u: 'mm/hr', ref: 'under 15', flag: 'high' },
  { t: 'Vitamin D', v: '41', u: 'nmol/L', ref: '75 to 125', flag: 'low' },
  { t: 'Ferritin', v: '96', u: 'ug/L', ref: '30 to 400', flag: 'ok' },
  { t: 'Creatine kinase', v: '210', u: 'U/L', ref: 'under 200', flag: 'high' },
  { t: 'Magnesium', v: '0.85', u: 'mmol/L', ref: '0.7 to 1.0', flag: 'ok' },
];

export function Report({ item, panelName, onBack, onBook }) {
  const off = PANEL.filter((m) => m.flag !== 'ok').length;
  return (
    <div className="screen">
      <Head title="Your baseline panel" sub={panelName || 'Recovery and Inflammation'} onBack={onBack} />
      <div className="scroll pad">
        <div className="rpt-sum">
          <b>{off} of {PANEL.length} outside range</b>
          <span>Your doctor has already seen this. You will go through it together.</span>
        </div>

        <div className="lbl-sm">Markers</div>
        {PANEL.map((m) => (
          <div className={`marker ${m.flag}`} key={m.t}>
            <div className="mk-l">
              <b>{m.t}</b>
              <span>Reference {m.ref}</span>
            </div>
            <div className="mk-r">
              <b>{m.v}</b><i>{m.u}</i>
            </div>
            <span className={`mk-f ${m.flag}`}>
              {m.flag === 'ok' ? 'In range' : m.flag === 'high' ? 'High' : 'Low'}
            </span>
          </div>
        ))}

        <p className="fineprint">
          Marker values and reference ranges are placeholders pending clinical
          sign-off. The panel repeats at Week 12 and is read against this one.
        </p>
      </div>
      <div className="foot">
        <button className="cta" onClick={onBook}>
          {item.action ? item.action.label : 'Book your consultation'} <Icon name="chev" size={16} />
        </button>
      </div>
    </div>
  );
}

/* ── 5. THE CALL ──
   Joining is its own screen because "join" is the only thing on it. */
export function Join({ item, when, onBack, onDone }) {
  return (
    <div className="screen">
      <Head title="Consultation" sub={when} onBack={onBack} />
      <div className="scroll pad">
        <div className="join-hero">
          <span className="who-av lg">V</span>
          <b>Your peptide doctor</b>
          <span>30-minute video call</span>
        </div>
        <div className="act-who" style={{ marginTop: 14 }}>
          <Icon name="check" size={15} />
          <div>
            <b>They have read your panel</b>
            <span>Your results, your triage answers and your starting numbers are
              already on their screen.</span>
          </div>
        </div>
        <p className="fineprint">
          Secure video call. There is no real call in this prototype, so joining
          takes you to the outcome.
        </p>
      </div>
      <div className="foot">
        <button className="cta" onClick={onDone}>
          Join consultation <Icon name="chev" size={16} />
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

/* ── 6. THE PRODUCT PAGE ──
   Where a medicine or supplement goes when the patient taps it. Everything here
   comes from the catalogue the Studio linked to, so a product the doctor added
   this morning has a page this afternoon with nobody writing one. */
export function ProductPage({ id, status, onBack, onBuy }) {
  const svc = findService(id);
  if (!svc) {
    return (
      <div className="screen">
        <Head title="Not found" onBack={onBack} />
        <div className="scroll pad"><p className="lead">This product is no longer listed.</p></div>
      </div>
    );
  }
  const ongoing = status === 'ongoing';
  return (
    <div className="screen">
      <Head title={svc.t} sub={svc.type === 'medication' ? 'Medication' : 'Supplement'} onBack={onBack} />
      <div className="scroll pad">
        <div className="pdp-hero">
          <span className="who-av lg">{svc.t[0]}</span>
          <b>{svc.t}</b>
          <span>{svc.note}</span>
          {svc.price > 0
            ? <div className="pdp-price">AED {svc.price.toLocaleString()}</div>
            : <div className="pdp-price incl">Included in your protocol</div>}
        </div>

        {ongoing && (
          <div className="act-who" style={{ marginTop: 14 }}>
            <Icon name="check" size={15} />
            <div>
              <b>You are already on this</b>
              <span>It came with your protocol. Nothing to buy.</span>
            </div>
          </div>
        )}
        {status === 'recommended' && (
          <div className="act-who" style={{ marginTop: 14 }}>
            <span className="who-av sm">D</span>
            <div>
              <b>Your doctor suggested this</b>
              <span>Added at your consultation. It is a suggestion, not a requirement.</span>
            </div>
          </div>
        )}

        <p className="fineprint">
          Product details and prices are placeholders pending sign-off. Checkout is
          not wired up in this prototype.
        </p>
      </div>
      <div className="foot">
        {svc.price > 0 && !ongoing ? (
          <button className="cta" onClick={onBuy}>
            Add to cart · AED {svc.price.toLocaleString()} <Icon name="chev" size={16} />
          </button>
        ) : (
          <div className="tiny">Nothing to buy. This is part of your protocol.</div>
        )}
      </div>
    </div>
  );
}
