import { useEffect, useState } from 'react';
import Icon from '../p2/ui/Icon';
import { Field, Chip, Note } from '../p2/ui/kit';
import { useStudio } from '../p2/lib/store';
import { PATIENTS, SERVICES, findService, ORDERS, ORDER_CATEGORIES, COACHES,
         orderFor, RR_PLAN, serviceGroupsFor, priceOf } from '../p2/lib/seed';
import { planFor, nextItem, consultFor, captures, recoveryScore, weekOfDay, weeksOf }
  from '../p1/lib/journey';
import { PANEL } from '../p1/screens/Actions';
import { goalOf, readPatient, subscribe, scopeFor, regionOf, money } from '../shared/bus';
import { go } from '../p2/lib/router';

/*
 * THE CLINICIAN CONSOLE — the end of a consultation.
 *
 * Everything else in this Studio edits a TEMPLATE. This edits one patient's
 * plan, which is why it is a checklist rather than a free editor: a doctor
 * finishing a call has two minutes and no appetite for a form builder, and the
 * open decision in the brief proposes exactly this.
 *
 * Whatever she records here becomes plan items, and plan items are what the
 * patient's next screen is. Nothing structured is captured today, so this is
 * the surface that turns a consultation into something the product can act on.
 *
 * ── THE GATE BITES HERE ──
 * The competition question is mandatory in the Week 1 consult so the answer
 * exists before Week 6. Until it is answered "no", the Wolverine upgrade cannot
 * be offered — the control is disabled and says why. That is what "never offer
 * the upgrade without asking about competition" means once it is software
 * rather than a line in a brief.
 */
const OUTCOMES = ['Continue as planned', 'Not suitable', 'Modify'];

/* ── WHAT A COACH CAN ADD, AND WHAT IT BECOMES ──
   Three kinds, and each lands in the plan as a different sort of step. The
   defaults are filled from the product so the common case is one press, and the
   coach then edits the step the same way a category manager would.

   Medicines and supplements do BOTH: a step marks that it happened, and the
   product joins the standing Medicines list the patient buys from. The step is
   the news, the list is the shelf. */
const ADDABLE = {
  medicine: {
    t: 'Medicine', group: 'medication', prescribes: true,
    step: (svc) => ({ t: `Rx added: ${svc.t}`, sub: svc.note, action: undefined }),
  },
  supplement: {
    t: 'Supplement', group: 'supplement', prescribes: true,
    step: (svc) => ({ t: `Voucher issued: ${svc.t}`, sub: svc.note, action: undefined }),
  },
  test: {
    t: 'Blood test', group: 'lab', prescribes: false,
    step: (svc) => ({ t: svc.t, sub: svc.note,
      action: { kind: 'book', label: 'Book your test' } }),
  },
};

/* ── THE QUEUE ──
   A doctor does not arrive at one patient, she arrives at a list. Who is
   waiting, how long, and for what, before she opens anybody.

   Ahmad is the patient sitting in the other tab and his record is read live out
   of the patient app. The rest are fixtures, labelled as fixtures. */
export function Queue({ patients, chosen, onChoose }) {
  return (
    <div className="queue">
      {patients.map((p) => {
        const g = goalOf(p.goal);
        return (
          <button key={p.id} className={`qrow ${chosen === p.id ? 'on' : ''}`}
            onClick={() => onChoose(p.id)}>
            <span className="av">{p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
            <span className="who">
              <b>{p.name}</b>
              <i>{g ? g.t : p.goal} · {p.waiting}</i>
            </span>
            {p.live
              ? <Chip tone="live">live</Chip>
              : <Chip tone="draft">fixture</Chip>}
            <span className="since">{p.since}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── THE RECORD, COLLAPSED ──
   Everything that has already happened to this patient, folded shut. A doctor
   with two minutes wants the headline and the ability to open exactly one
   thing, not a wall of history she has to scroll past to reach the form.

   Sections with nothing in them still render, saying so, because an absent
   section reads as "not collected" and a doctor cannot tell that apart from
   "not shown". */
function Fold({ t, sub, children, open, onToggle }) {
  return (
    <div className={`fold ${open ? 'on' : ''}`}>
      <button className="fold-h" onClick={onToggle}>
        <Icon name="chev" size={13} className="fold-i" />
        <b>{t}</b>
        <span>{sub}</span>
      </button>
      {open && <div className="fold-b">{children}</div>}
    </div>
  );
}

const Pairs = ({ rows }) => (
  Object.keys(rows || {}).length ? (
    <dl className="pairs">
      {Object.entries(rows).map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
      ))}
    </dl>
  ) : <p className="empty-line">Nothing recorded.</p>
);

function Record({ rec }) {
  const [open, setOpen] = useState(null);
  const toggle = (k) => setOpen(open === k ? null : k);
  const c = rec.consults || [];

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="card-pad" style={{ paddingBottom: 6 }}>
        <div className="row">
          <h3 className="grow">Before this call</h3>
          <span className="hint">Everything already on file. Open what you need.</span>
        </div>
      </div>

      <Fold t="Onboarding" open={open === 'onb'} onToggle={() => toggle('onb')}
        sub={rec.profile
          ? `${rec.profile.age} · ${rec.profile.sex} · ${rec.profile.height} cm · ${rec.profile.weight} kg`
          : 'Not completed'}>
        <Pairs rows={rec.onboarding} />
      </Fold>

      <Fold t="Triage" open={open === 'tri'} onToggle={() => toggle('tri')}
        sub={`${Object.keys(rec.triage || {}).length} answers`}>
        <Pairs rows={rec.triage} />
      </Fold>

      <Fold t="Purchase" open={open === 'buy'} onToggle={() => toggle('buy')}
        sub={rec.purchase ? `${rec.purchase.paid} · ${rec.purchase.on}` : 'Not purchased'}>
        {rec.purchase
          ? <Pairs rows={{ Protocol: rec.purchase.what, Paid: rec.purchase.paid, On: rec.purchase.on }} />
          : <p className="empty-line">This patient has not bought a protocol.</p>}
      </Fold>

      <Fold t="Progress" open={open === 'pro'} onToggle={() => toggle('pro')}
        sub={rec.progress ? `${rec.progress.done} of ${rec.progress.total} steps` : 'Not started'}>
        {rec.progress ? (
          <>
            <div className="bar"><i style={{ width: `${Math.round(100 * rec.progress.done / Math.max(1, rec.progress.total))}%` }} /></div>
            <Pairs rows={{ 'Next due': rec.progress.next || 'Nothing outstanding' }} />
          </>
        ) : <p className="empty-line">The protocol has not started.</p>}
      </Fold>

      {/* ── WHAT THIS PATIENT'S PLAN NO LONGER SHARES WITH THE TEMPLATE ──
          The history used to stop at counts, so a doctor picking up somebody
          else's patient could not see that the plan in front of them had
          already been changed. */}
      <Fold t="Changed for this patient" open={open === 'mod'} onToggle={() => toggle('mod')}
        sub={rec.changes && rec.changes.length ? `${rec.changes.length} change${rec.changes.length === 1 ? '' : 's'}` : 'None'}>
        {rec.changes && rec.changes.length
          ? rec.changes.map((c, i) => (
              <div className="prev" key={i}>
                <span className="when">{c.kind}</span>
                <div><b>{c.what}</b><p>{c.why}</p></div>
              </div>
            ))
          : <p className="empty-line">This patient is on the protocol as published.</p>}
      </Fold>

      <Fold t="Previous consults" open={open === 'con'} onToggle={() => toggle('con')}
        sub={c.length ? `${c.length} on record` : 'None yet'}>
        {c.length ? c.map((x, i) => (
          <div className="prev" key={i}>
            <span className="when">{x.on}</span>
            <div><b>{x.outcome}</b><p>{x.note}</p></div>
          </div>
        )) : <p className="empty-line">This is the first consultation.</p>}
      </Fold>

      {(rec.flags || []).length > 0 && (
        <div className="card-pad" style={{ paddingTop: 10 }}>
          {rec.flags.map((f) => <Chip key={f} tone="block">{f}</Chip>)}
        </div>
      )}
    </div>
  );
}

/* The live patient's record is not authored anywhere. It is assembled from what
   the patient app actually wrote, which is the point: the doctor reads the
   answers that were really given, not a mock of them. */
function liveRecord(pt, studio, scope) {
  if (!pt) return { flags: ['This patient has not opened the app yet.'] };
  const label = (cfg, id) => (cfg?.questions || []).find((q) => q.id === id)?.q || id;
  const onbCfg = studio?.published?.shared?.onboarding?.data;
  const triCfg = studio?.published?.[scope]?.triage?.data;
  const asRows = (cfg, answers) => Object.fromEntries(
    Object.entries(answers || {}).map(([k, v]) => [label(cfg, k), [].concat(v).join(', ')]));

  /* The same resolver the patient app uses, so the doctor is reading the plan
     the patient is actually on. Reading the raw published array meant the two
     disagreed about the order and about whether the doctor's own additions
     counted. */
  const plan = planFor(studio, scope, pt);
  const total = plan.length;
  const done = (pt.done || []).length;
  const next = nextItem(plan, pt.done || []);
  const bought = !!pt.goal && ['gate:plan', 'home', 'detail', 'gate:consult'].includes(pt.stage) && pt.mode === 'protocol';
  const pub = studio?.published?.[scope]?.prepurchase;
  const pp = pub?.data;
  const c = consultFor(studio);

  return {
    profile: pt.intake?.profile,
    onboarding: asRows(onbCfg, pt.intake?.answers),
    triage: asRows(triCfg, pt.answers),
    purchase: bought && pp
      ? { what: pp.pdp?.title || 'Protocol', paid: money(pub?.price || 0, pub?.region), on: 'This session' }
      : null,
    progress: total ? { done, total, next: next ? next.t : null } : null,
    consults: c && c.version
      ? [{ on: 'Earlier today', outcome: c.outcome, note: c.note || 'No note recorded.' }]
      : [],
    changes: !c ? [] : [
      ...Object.entries(c.overrides || {}).map(([stepId, sid]) => {
        const step = plan.find((x) => x.id === stepId);
        return { kind: 'swapped', what: findService(sid)?.t || sid,
                 why: `Replaces the protocol default on ${step ? step.t : stepId}.` };
      }),
      ...(c.addedItems || []).map((a) => ({
        kind: 'added', what: a.t,
        why: `Week ${a.week}${a.afterStepId ? `, straight after ${plan.find((x) => x.id === a.afterStepId)?.t || a.afterStepId}` : ''}.`,
      })),
      ...(c.prescribed || []).map((r) => ({
        kind: r.status, what: findService(r.id)?.t || r.id,
        why: 'On their medicines list.',
      })),
      ...(c.outcome === 'Not suitable'
        ? [{ kind: 'stopped', what: 'Protocol paused', why: 'The doctor found it not suitable.' }] : []),
    ],
    flags: [`Competes in tested sport: ${(c && c.competes && c.competes !== 'unanswered') ? c.competes : 'not asked yet'}`],
  };
}

/* ══ PART ONE — PAST ORDERS ═══════════════════════════════════════════════
   A coach does not arrive at a protocol. They arrive at Past Orders, filter it,
   and open a row. This is that screen, with the columns and filters the live
   panel already has and one category added: Protocols.

   Everything on it is the existing panel's. The single new thing in this whole
   surface is one button, four screens further in. */

const ALL = '';   /* the "no filter" value, so a select can hold it */

function Filter({ value, onChange, options, placeholder }) {
  return (
    <div className="of">
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value={ALL}>{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <Icon name="chev" size={12} />
    </div>
  );
}

function OrdersList() {
  const [typed, setTyped] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(ALL);
  const [coach, setCoach] = useState(ALL);
  const [pkg, setPkg] = useState(ALL);
  const [country, setCountry] = useState(ALL);
  const [rx, setRx] = useState(ALL);

  const packages = [...new Set(ORDERS.map((o) => o.pkg))].sort();
  const countries = [...new Set(ORDERS.map((o) => o.country))].sort();

  const hit = (o) => {
    const term = q.trim().toLowerCase();
    if (term && ![o.id, o.name, o.email, o.pkg].join(' ').toLowerCase().includes(term)) return false;
    if (cat && cat !== 'All Orders' && o.category !== cat) return false;
    if (coach && o.coach !== coach) return false;
    if (pkg && o.pkg !== pkg) return false;
    if (country && o.country !== country) return false;
    if (rx && o.rx !== rx) return false;
    return true;
  };
  const rows = ORDERS.filter(hit);
  const search = (e) => { e.preventDefault(); setQ(typed); };

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="grow">
          <h2>Past Orders</h2>
          <p className="sub">
            Every order this coach can act on. Filter to <b>Protocols</b> and open one
            to reach that patient.
          </p>
        </div>
        <form className="osearch" onSubmit={search}>
          <Icon name="search" size={13} />
          <input value={typed} placeholder="Search"
            onChange={(e) => { setTyped(e.target.value); if (!e.target.value) setQ(''); }} />
          <button className="btn btn-primary btn-sm" type="submit">Search</button>
        </form>
      </div>

      <div className="ofilters">
        <Filter value={cat} onChange={setCat} options={ORDER_CATEGORIES.slice(1)} placeholder="All Orders" />
        <Filter value={coach} onChange={setCoach} options={COACHES} placeholder="All coaches" />
        <Filter value={pkg} onChange={setPkg} options={packages} placeholder="Select Package" />
        <Filter value={country} onChange={setCountry} options={countries} placeholder="Filter by Country" />
        <Filter value={rx} onChange={setRx} options={['Yes', 'No']} placeholder="Prescription Required" />
      </div>

      <div className="otable-wrap">
        <table className="otable">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Coach Review Date</th>
              <th>Feedback Done By</th>
              <th>Primary User Name</th>
              <th>Primary User Email</th>
              <th>Dependent Name</th>
              <th>Dependent Relation</th>
              <th>Package</th>
              <th>Purchased Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => {
              /* Only protocol rows open. The rest are the panel's existing
                 order types and this prototype does not rebuild them. */
              const open = !!o.patientId;
              return (
                <tr key={o.id} className={open ? 'go' : ''}
                  onClick={open ? () => go(`/clinician/${o.id}`) : undefined}
                  title={open ? 'Open this patient' : 'Not a protocol order'}>
                  <td>{open ? <b className="olink">{o.id}</b> : o.id}</td>
                  <td className="mono-sm">{o.reviewed || '–'}</td>
                  <td>{o.coach}</td>
                  <td>{o.name}</td>
                  <td className="omail">{o.email}</td>
                  <td>–</td>
                  <td>–</td>
                  <td className="opkg">{o.pkg}</td>
                  <td className="mono-sm">{o.purchased}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr><td colSpan={9} className="oempty">No order matches these filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="ofoot">
        {rows.length} of {ORDERS.length} orders.
        {cat !== 'Protocols' && ' Protocol orders are the ones that open.'}
      </p>
    </>
  );
}

/* ══ PART TWO — THE ORDER ══════════════════════════════════════════════════
   The patient details page exactly as it already is: what was bought on the
   left, who bought it on the right, the panel underneath, and a row of buttons
   for the surveys already on file.

   One button in that row is new. */

const PILLS = [
  ['Client Notes', 'Notes the coach has written against this client.'],
  ['Health Profile', 'The medical profile survey results.'],
  ['Lifestyle Profile', 'The lifestyle survey results.'],
  ['General Survey', 'Whichever survey this package carries.'],
];

const Rows = ({ rows }) => (
  <table className="drow">
    <tbody>
      {rows.map(([k, v, edit]) => (
        <tr key={k}>
          <td>{k}</td>
          <td>{v ?? '–'}</td>
          {edit !== undefined && (
            <td className="dedit">
              {edit && (
                <button className="btn-green"
                  onClick={() => window.alert('Editing a client record is the existing panel’s job. This prototype only reads it.')}>
                  Edit
                </button>
              )}
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
);

function OrderDetail({ order, patient, pt, record, scope, region = 'uae' }) {
  const live = !!patient?.live;
  const profile = live ? (pt?.intake?.profile || null) : record?.profile;
  const done = live ? (pt?.done || []) : RR_PLAN.slice(0, record?.progress?.done || 0).map((x) => x.id);
  /* The panel only holds results once the sample has actually been read. */
  const resulted = done.includes('p3');

  const others = ORDERS.filter((o) => o.email === order.email && o.id !== order.id);

  return (
    <>
      <button className="crumb" onClick={() => go('/clinician')}>
        <Icon name="back" size={12} /> Past Orders
      </button>

      <div className="row" style={{ margin: '10px 0 16px' }}>
        <div className="grow">
          <h2>View Test Results</h2>
          <p className="sub">Order {order.id} · {order.name}</p>
        </div>
        <div className="pills">
          {PILLS.map(([t, why]) => (
            <button key={t} className="pill"
              onClick={() => window.alert(`${t}: ${why}\n\nThis screen already exists in the panel and is not rebuilt here.`)}>
              {t}
            </button>
          ))}
          {/* ── THE ONE NEW BUTTON ──
              Everything to its left is a survey already on file. This opens the
              protocol: the record, the decision, and what the patient gets. */}
          <button className="pill pill-new"
            onClick={() => go(`/clinician/${order.id}/journey`)}>
            <Icon name="clipboard" size={12} /> Protocol Journey
          </button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-pad"><h3>Order Details</h3></div>
          <Rows rows={[
            ['Order ID', order.id],
            ['Purchased Date', order.purchased.split(',').slice(0, 2).join(',')],
            ['Package Name', order.pkg],
            ['Previous Orders', others.length
              ? <span className="olinks">{others.map((o) => <i key={o.id}>{o.pkg}</i>)}</span>
              : 'None'],
          ]} />
          <div className="card-pad" style={{ borderTop: '1px solid var(--line)' }}>
            <h4 className="mini-h">Customer Transactions</h4>
          </div>
          <table className="otable otable-in">
            <thead><tr><th>Id</th><th>Name</th><th>Purchased On</th></tr></thead>
            <tbody>
              {[order, ...others].map((o) => (
                <tr key={o.id}>
                  <td><b className="olink">{o.id}</b></td>
                  <td className="opkg">{o.pkg}</td>
                  <td className="mono-sm">{o.purchased}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-pad"><h3>Client Details</h3></div>
          <Rows rows={[
            ['ID', order.patientId === 'live' ? '29798' : order.id - 88000],
            ['Name', order.name],
            ['Email', order.email],
            /* Onboarding asks for age, not a date of birth. Saying so is more
               use to a doctor than a plausible date nobody entered. */
            ['Date of Birth', <span className="dmute">Not collected. Onboarding asks for age.</span>, false],
            ['Age', profile?.age ? `${profile.age} Years` : null, false],
            ['Height', profile?.height ? `${profile.height} cm` : null, true],
            ['Weight', profile?.weight ? `${profile.weight} kg` : null, true],
            ['Phone Number', null],
            ['Gender', profile?.sex],
            ['Location', `${order.city}, ${order.country}`],
            ['Feedback Done By', order.coach],
            ['Longevity Score', <span className="dmute">Not part of this prototype</span>],
            ['Longevity Percentile', <span className="dmute">Not part of this prototype</span>],
            ['Last Consultation Date', done.includes('p4') ? 'This session' : 'N/A'],
            ['Wearable Status', 'INACTIVE'],
          ]} />
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-pad">
          <h3>Tests</h3>
          <p className="sub" style={{ marginTop: 2 }}>
            The baseline panel, as the lab returned it. This is the same record the
            patient reads in their own app.
          </p>
        </div>
        {resulted ? (
          <table className="otable otable-in">
            <thead>
              <tr><th>Test</th><th>Panel</th><th>Result</th><th>Reference</th><th>Unit</th><th>Status</th></tr>
            </thead>
            <tbody>
              {PANEL.map((m) => (
                <tr key={m.t}>
                  <td>{m.t}</td>
                  <td className="dmute">Recovery &amp; Inflammation Panel</td>
                  <td className="ores"><b>{m.v}</b></td>
                  <td className="dmute">{m.ref}</td>
                  <td className="mono-sm">{m.u}</td>
                  <td>
                    <span className={`orange ${m.flag}`}>
                      {m.flag === 'ok' ? 'In Range' : 'Out Of Range'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="card-pad" style={{ paddingTop: 0 }}>
            <p className="empty-line">
              No results yet. The sample has not been collected and read.
            </p>
          </div>
        )}
        <div className="card-pad" style={{ borderTop: '1px solid var(--line)' }}>
          <p className="fine">
            Marker values and reference ranges are placeholders pending clinical sign-off.
          </p>
        </div>
      </div>
    </>
  );
}

/* ══ WHAT THE PATIENT HAS BEEN LOGGING ═════════════════════════════════════
   The plan says what should happen. This says what the patient reports is
   happening, and it is the only part of the record they write themselves.

   Three things, in the order a clinician reads them:

     THE SCORE    where they are against where they said they wanted to be,
                  and the shape of the run that got them there.
     THE TWO      pain and capacity apart, because the score folds them together
     NUMBERS      and pain-down-capacity-down is a different call from
                  pain-down-capacity-up.
     WHAT IS      how often each thing is being logged, and when it last was.
     BEING KEPT   Somebody who logged twice in week one and nothing since is the
                  case this section exists to make impossible to miss.

   Nothing here is invented. Where a capture has no backend the row says so,
   because a clinician must not read "no heart scans" as non-adherence when the
   camera build does not exist. */

const CAP_LABEL = { symptoms: 'Symptoms', doses: 'Doses', meals: 'Meals', scan: 'Heart scan' };

/* One patient's logbook, from whichever side it lives on. */
function logbookFor(patient, pt) {
  if (patient.live) {
    return { day: pt?.day || 0, checkins: pt?.checkins || [], target: pt?.target ?? null,
             logs: pt?.logs || {}, logAt: pt?.logAt || {}, done: pt?.done || [], real: true };
  }
  const r = patient.record || {};
  return { day: r.day || 0, checkins: r.checkins || [], target: r.target ?? null,
           logs: r.logs || {}, logAt: r.logAt || {},
           done: RR_PLAN.slice(0, r.progress?.done || 0).map((x) => x.id), real: false };
}

const Track = ({ label, from, to, max, invert, only }) => {
  const move = to - from;
  const good = invert ? move < 0 : move > 0;
  return (
    <div className="trk">
      <span className="trk-l">{label}</span>
      <span className="trk-dots">
        {Array.from({ length: max }, (_, i) => (
          <i key={i} className={i < to ? 'on' : i < from ? 'was' : ''} />
        ))}
      </span>
      {/* One check-in is a reading, not a trend. Saying "no change" of a single
          number invites a doctor to read a flat line that does not exist. */}
      <span className="trk-v"><b>{to}</b>{!only && <em>from {from}</em>}</span>
      <span className={`trk-d ${only || move === 0 ? '' : good ? 'up' : 'down'}`}>
        {only ? 'first reading' : move === 0 ? 'no change' : `${move > 0 ? '+' : ''}${move}`}
      </span>
    </div>
  );
};

function PatientLogs({ patient, pt, weeks = 12 }) {
  const lb = logbookFor(patient, pt);
  const { checkins } = lb;
  const first = checkins[0];
  const last = checkins[checkins.length - 1];
  const score = recoveryScore(last);
  const was = recoveryScore(first);
  const nowWeek = weekOfDay(lb.day);

  /* The chart is the protocol's twelve weeks, not a row of however many bars
     happen to exist. A gap is then a week nobody checked in, which is the thing
     worth seeing; six bars crushed against the left edge is not. */
  const byWeek = new Map();
  checkins.forEach((c) => byWeek.set(weekOfDay(c.day), recoveryScore(c)));
  const slots = Array.from({ length: weeks }, (_, i) => ({
    week: i + 1, v: byWeek.get(i + 1) ?? null, now: i + 1 === nowWeek,
  }));

  /* Due-ness comes from the plan, so a capture the protocol has not reached yet
     reads as "not due" rather than as a patient who is not bothering. */
  const caps = captures(lb.done, lb.logs).map((c) => {
    const at = lb.logAt[c.k];
    const silentFor = at == null ? null : nowWeek - weekOfDay(at);
    const state = c.k === 'scan' ? 'none'
      : !c.due ? 'later'
      : !c.count ? 'never'
      : silentFor >= 2 ? 'quiet'
      : 'on';
    return { ...c, at, silentFor, state };
  });
  const quiet = caps.filter((c) => c.state === 'quiet' || c.state === 'never').length;

  return (
    <div className="card logs" style={{ marginBottom: 14 }}>
      <div className="card-pad logs-h">
        <div className="grow">
          <h3>What they have logged</h3>
          <p className="sub">
            Read out of the patient's own app. None of it is authored here, and none
            of it is a number this prototype made up.
          </p>
        </div>
        <Chip tone={checkins.length ? 'live' : 'draft'}>
          {checkins.length
            ? `week ${nowWeek} · ${checkins.length} check-in${checkins.length === 1 ? '' : 's'}`
            : 'nothing logged yet'}
        </Chip>
      </div>

      {checkins.length === 0 ? (
        <div className="card-pad" style={{ paddingTop: 0 }}>
          <p className="empty-line">
            This patient has not checked in. There is no trend to read, which is itself
            worth saying on the call.
          </p>
        </div>
      ) : (
        <>
          {/* ── the score, and the run that made it ── */}
          <div className="logs-score">
            <div className="ls-now">
              <span className="ls-k">Recovery score</span>
              <div className="ls-v">
                <b>{score}</b>
                {lb.target != null && <em>to {lb.target}</em>}
              </div>
              <span className={`ls-d ${score - was > 0 ? 'up' : score - was < 0 ? 'down' : ''}`}>
                {checkins.length === 1
                  ? `one check-in, week ${weekOfDay(first.day)}`
                  : score === was
                    ? `unchanged since week ${weekOfDay(first.day)}`
                    : `${score - was > 0 ? '+' : ''}${score - was} since week ${weekOfDay(first.day)}`}
              </span>
            </div>
            <div className="ls-chart">
              {slots.map((sl) => (
                <div className={`ls-bar ${sl.v == null ? 'gap' : ''} ${sl.now ? 'now' : ''}`}
                  key={sl.week}
                  title={sl.v == null ? `Week ${sl.week} · no check-in` : `Week ${sl.week} · ${sl.v}`}>
                  {sl.v == null ? <u /> : <i style={{ height: `${Math.max(4, sl.v)}%` }} />}
                  <span>{sl.week}</span>
                </div>
              ))}
              {lb.target != null && (
                <div className="ls-target" style={{ bottom: `${lb.target}%` }}><span>target</span></div>
              )}
            </div>
          </div>

          {/* ── the two numbers, apart ── */}
          <div className="logs-tracks">
            <Track label="Pain" from={first.pain} to={last.pain} max={10} invert
              only={checkins.length === 1} />
            <Track label="Capacity" from={first.capacity} to={last.capacity} max={10}
              only={checkins.length === 1} />
          </div>
        </>
      )}

      {/* ── what is being kept, and what has gone quiet ── */}
      <div className="logs-caps">
        {caps.map((c) => (
          <div className={`cap cap-${c.state}`} key={c.k}>
            <div className="cap-h">
              <Icon name={c.ic} size={13} />
              <b>{CAP_LABEL[c.k]}</b>
            </div>
            <span className="cap-n">
              {c.state === 'none' ? '–' : c.count ? `${c.count}×` : '0'}
            </span>
            <span className="cap-s">
              {c.state === 'none' ? 'Needs the camera build'
                : c.state === 'later' ? c.note
                : c.state === 'never' ? 'Never logged'
                : c.state === 'quiet' ? `Nothing for ${c.silentFor} weeks`
                : `Last week ${weekOfDay(c.at)}`}
            </span>
          </div>
        ))}
      </div>

      {quiet > 0 && (
        <div className="card-pad" style={{ paddingTop: 0 }}>
          <Note tone="gold" label="Worth asking about on the call">
            <p style={{ margin: 0 }}>
              {caps.filter((c) => c.state === 'quiet' || c.state === 'never')
                   .map((c) => CAP_LABEL[c.k]).join(' and ')}
              {' '}
              {quiet === 1 ? 'has' : 'have'} gone quiet. The plan cannot tell you that; only
              this can.
            </p>
          </Note>
        </div>
      )}
    </div>
  );
}

/* ══ THE SURFACE ══════════════════════════════════════════════════════════
   Three screens, one route. #/<goal>/clinician[/<orderId>[/journey]]

     no order        Past Orders, filtered
     an order        that patient's record, as the panel already shows it
     .../journey     the protocol: what happened, how they are doing, and the
                     decision that changes their next screen
*/
export default function Clinician({ parts = [] }) {
  const { state, update } = useStudio();

  /* The patient app writes while this screen is open, so follow it. */
  const [pt, setPt] = useState(() => readPatient(null));
  useEffect(() => subscribe(() => setPt(readPatient(null))), []);

  const orderId = Number(parts[1]) || null;
  const order = ORDERS.find((o) => o.id === orderId && o.patientId) || null;
  const patient = order ? PATIENTS.find((p) => p.id === order.patientId) : null;
  const journey = !!order && parts[2] === 'journey';

  if (!order) return <OrdersList />;

  /* ── WHICH PROTOCOL THIS PATIENT IS ON ──
     Their goal, in their country. The console does not get to pick: it reads
     the same protocol the phone reads, or the two disagree about what the plan
     even is. */
  const region = patient.live ? (pt?.region || 'uae') : (order.country === 'Saudi Arabia' ? 'ksa' : 'uae');
  const scope = scopeFor(state, patient.goal, region);
  const draft = state.drafts?.[scope];

  if (!draft || !draft.plan) {
    return (
      <>
        <button className="crumb" onClick={() => go('/clinician')}>
          <Icon name="back" size={12} /> Past Orders
        </button>
        <div className="card card-pad empty" style={{ marginTop: 12 }}>
          No protocol is authored for {goalOf(patient.goal)?.t} in {regionOf(region).t},
          so there is nothing to consult on.
        </div>
      </>
    );
  }

  const record = patient.live ? liveRecord(pt, state, scope) : patient.record;

  if (!journey) {
    return <OrderDetail order={order} patient={patient} pt={pt} record={record}
      scope={scope} region={region} />;
  }

  return (
    <>
      <button className="crumb" onClick={() => go(`/clinician/${order.id}`)}>
        <Icon name="back" size={12} /> Order {order.id}
      </button>
      {/* Keyed on the patient so that switching gives a genuinely fresh screen.
          Without it the folds stay open on the last person's history and, far
          worse, a half-typed note stays in the box and gets saved against
          whoever is now on screen. */}
      <Consult key={patient.id} patient={patient} record={record} scope={scope} pt={pt}
        region={region}
        currentStep={patient.live ? nextItem(planFor(state, scope, pt || {}), (pt && pt.done) || []) : null}
        state={state} update={update} />
    </>
  );
}

function Consult({ patient, record, state, update, scope, currentStep, pt, region = 'uae' }) {
  /* This patient's record, not the last one anybody opened. */
  const consult = state.consults?.[patient.id] || {};
  const [note, setNote] = useState(consult.note || '');
  const [outcome, setOutcome] = useState(consult.outcome || OUTCOMES[0]);
  /* A dose belongs to a product, not to a consultation. One global dose field
     meant a doctor changing two medicines had one box to say it in. */
  const [doses, setDoses] = useState(consult.doses || {});
  /* Which gated product somebody just reached for, so the question can be asked
     where it is needed instead of sitting unanswered at the top of the page. */
  const [gateAsked, setGateAsked] = useState(null);
  const [competes, setCompetes] = useState(consult.competes || 'unanswered');
  /* THREE DIFFERENT THINGS COME OUT OF A CONSULTATION, and conflating them is
     how the plan filled up with products.
       ORDERED    tests and visits. These are plan STEPS: they have a date, they
                  block things, the patient has to turn up for them.
       PRESCRIBED medicines, peptides and supplements. These are NOT steps. They
                  are a standing list the patient reads and buys from, and
                  putting them in the plan made a shopping list wear a schedule
                  as a costume.
       OVERRIDES  which product a step actually carries. The builder marks the
                  steps a doctor may change, ships a default on each, and this
                  holds whatever they swapped it for. The supplement voucher was
                  the first of these; the monthly dispatches and the repeat panel
                  need exactly the same thing. */
  const [added, setAdded] = useState(consult.addedItems || []);
  const [rx, setRx] = useState(consult.prescribed || []);
  /* One map, not a voucher special case. The builder sets a default on each
     step it marks changeable; this holds whatever the doctor swapped it for.
     The old version defaulted to a supplement the plan did not even carry, so
     the console showed one product and the plan held another. */
  const [overrides, setOverrides] = useState(consult.overrides || {});
  /* The step the coach is defining right now, before it joins the plan. */
  const [draft, setDraft] = useState(null);

  /* The steps the builder marked as the doctor's to decide. Read from the plan
     rather than listed here, so marking a new one in the Protocol Builder makes
     it appear on this screen with no code written. */
  const changeable = (state.published?.[scope]?.plan?.data || [])
    .filter((x) => x.clinicianCanSet && x.serviceId);

  /* The whole gate, in one line. Unanswered is not the same as no, and the
     rule lives on the catalogue item so anything WADA-prohibited inherits it
     rather than one button knowing about one product. */
  const blockedFor = (svc) => (svc && svc.gate === 'competes' && competes !== 'no');


  /* ── ADDING SOMETHING ──
     Two moves, deliberately. `begin` fills a step from the product so the coach
     sees something sensible immediately; `commit` puts it on the plan. In
     between the coach edits it, because a step nobody worded is a step that
     reads like a database row on somebody's phone.

     Everything lands on THIS patient's plan. It does not touch the template:
     one patient needing a B12 test is not a reason for every patient to have
     one. */
  const begin = (kind) => {
    const spec = ADDABLE[kind];
    const svc = SERVICES[spec.group].items.find((x) => !blockedFor(x));
    if (!svc) return;
    /* Lands in the week the patient is actually in, not week one. */
    setDraft({ kind, serviceId: svc.id, blocker: false,
               week: currentStep?.week || 1, ...spec.step(svc) });
  };

  /* Repointing the draft at a different product rewrites the wording it came
     with, unless the coach has already changed it themselves. */
  const repoint = (serviceId) => setDraft((d) => {
    const svc = findService(serviceId);
    const wasDefault = ADDABLE[d.kind].step(findService(d.serviceId));
    const touched = d.t !== wasDefault.t || d.sub !== wasDefault.sub;
    return { ...d, serviceId, ...(touched ? {} : ADDABLE[d.kind].step(svc)) };
  });

  const commit = () => {
    if (!draft || !draft.t.trim()) return;
    const svc = findService(draft.serviceId);
    if (blockedFor(svc)) return;
    const id = `add_${draft.serviceId}_${draft.kind}`;
    if (!added.some((x) => x.id === id)) {
      setAdded((xs) => [...xs, {
        id, t: draft.t, sub: draft.sub, week: draft.week,
        serviceId: draft.serviceId,
        action: draft.action,
        blocker: draft.blocker || undefined,
        /* Straight after whatever the patient is on right now. */
        afterStepId: currentStep?.id || undefined,
      }]);
    }
    /* A medicine or a supplement is also something they are now on. */
    if (ADDABLE[draft.kind].prescribes && !rx.some((x) => x.id === draft.serviceId)) {
      setRx((xs) => [...xs, { id: draft.serviceId, status: 'recommended', dose: draft.dose || undefined }]);
    }
    setDraft(null);
  };


  const save = () => update((d) => {
    if (!d.consults) d.consults = {};
    d.consults[patient.id] = {
      note, outcome, doses, competes, addedItems: added, prescribed: rx, overrides,
      at: new Date().toISOString(),
      version: ((d.consults[patient.id] && d.consults[patient.id].version) || 0) + 1,
    };
  });

  return (
    <>
      <div className="row" style={{ margin: '20px 0 14px' }}>
        <div className="grow">
          <h2>{patient.name}</h2>
          <p className="sub">
            {goalOf(patient.goal)?.t} · {patient.waiting} · waiting since {patient.since}
          </p>
        </div>
        <Chip tone={consult.version ? 'live' : 'draft'}>
          {consult.version ? `saved v${consult.version}` : 'not saved'}
        </Chip>
      </div>

      <Record rec={record} />

      {/* Between the record and the decision, because it is evidence a doctor
          reads BEFORE choosing, not a report she is shown afterwards. */}
      <PatientLogs patient={patient} pt={pt} weeks={weeksOf(state, scope)} />

      {!patient.live && (
        <div style={{ marginBottom: 14 }}>
          <Note label="This one is a fixture">
            <p style={{ margin: 0 }}>
              {patient.name} is here to show what a queue looks like. Only Ahmad is wired
              to the patient app, so only his consult outcome changes anything on a phone.
            </p>
          </Note>
        </div>
      )}

      {/* ── 1. THE DECISION ──
          First, because it is the only thing that must be answered. Everything
          below it is what "modify" means, and a console that shows all of it at
          once makes "continue as planned" look like a choice nobody made. */}
      <h3 style={{ marginBottom: 4 }}>Is this patient approved?</h3>
      <p className="sub" style={{ marginBottom: 10 }}>
        A checklist, not a free editor. What is recorded here becomes items on this
        patient's plan, and the plan is what their next screen shows.
      </p>
      <div className="card card-pad" style={{ marginBottom: 6 }}>
        <div className="decide">
          {OUTCOMES.map((o) => (
            <button key={o} className={`decide-b ${outcome === o ? 'on' : ''} ${o === 'Not suitable' ? 'no' : ''}`}
              onClick={() => setOutcome(o)}>{o}</button>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <Field label="Note for the record" type="textarea" rows={2} value={note} onChange={setNote}
            placeholder="Response so far, tolerance, anything the care team should know." />
        </div>
      </div>

      {outcome === 'Not suitable' && (
        <div style={{ marginTop: 8, marginBottom: 14 }}>
          <Note tone="red" label="This protocol stops here">
            <p style={{ margin: 0 }}>
              Saving this pauses the plan on the patient's phone. They see that a doctor
              has stopped it and who to talk to, rather than a next step they should not
              take.
            </p>
          </Note>
        </div>
      )}

      {/* The screening question no longer has a card of its own. It appears
          where it is actually needed: the moment somebody reaches for a
          WADA-prohibited product. A mandatory question sitting unanswered at the
          top of every consultation is a question people learn to scroll past. */}
      {gateAsked && (
        <div style={{ marginTop: 8, marginBottom: 14 }}>
          <Note tone="gold" label="This one is WADA-prohibited">
            <p style={{ margin: 0 }}>Does this patient compete in tested sport?</p>
            <div className="row" style={{ gap: 8, marginTop: 10 }}>
              <button className="btn btn-sm btn-ghost" onClick={() => { setCompetes('yes'); setGateAsked(null); }}>
                Yes, tested sport
              </button>
              <button className="btn btn-sm btn-primary" onClick={() => { setCompetes('no'); setGateAsked(null); }}>
                No
              </button>
            </div>
          </Note>
        </div>
      )}

      {outcome !== 'Not suitable' && (
        <>
          {/* ── 2. WHAT THEY GET, AND AT WHAT DOSE ── */}
          <div className="card card-pad" style={{ marginTop: 8, marginBottom: 14 }}>
            <h3 style={{ marginBottom: 4 }}>What this patient actually gets</h3>
            <p className="sub" style={{ marginBottom: 10 }}>
              The protocol ships a default on each of these. What it turns out to be, and
              at what dose, is a clinical decision, so it is made here and the patient's
              plan updates to match.
            </p>
            {/* This card used to disappear when the list was empty, which read as
                a missing feature rather than a missing protocol. It says why
                instead. */}
            {changeable.length === 0 && (
              <p className="empty-line">
                Nothing to change yet. This reads the PUBLISHED plan, so publish it in the
                Protocol Builder first, and mark the steps a doctor may decide with
                "The doctor can change this" there.
              </p>
            )}
            {changeable.map((step) => {
                const current = findService(overrides[step.id] || step.serviceId);
                const group = SERVICES[current?.type];
                const dosable = current?.type === 'medication' || current?.type === 'supplement';
                return (
                  <div className="chg" key={step.id}>
                    <div className="chg-h">
                      <span className="when">Week {step.week}</span>
                      <div className="grow">
                        <b>{step.t}</b>
                        <span>Protocol default: {findService(step.serviceId)?.t || 'none'}</span>
                      </div>
                    </div>
                    <div className="chg-f">
                      <Field label="Product" type="select" value={current?.id || ''}
                        options={(group?.items || []).map((x) => x.id)}
                        display={(group?.items || []).reduce((a, x) => ({ ...a, [x.id]: x.t }), {})}
                        onChange={(v) => {
                          /* Reaching for a gated product asks the question here
                             rather than refusing silently. */
                          const svc = findService(v);
                          if (blockedFor(svc)) { setGateAsked(v); return; }
                          setOverrides((o) => ({ ...o, [step.id]: v }));
                        }} />
                      {/* Only things you can be on a dose of get a dose. */}
                      {dosable && (
                        <Field label="Dose" value={doses[step.id] || ''}
                          placeholder="250 mcg daily"
                          onChange={(v) => setDoses((d) => ({ ...d, [step.id]: v }))} />
                      )}
                    </div>
                  </div>
                );
            })}
          </div>

          {/* ── 3. ADD SOMETHING NEW ── */}
          <div className="card card-pad">
            <h3 style={{ marginBottom: 4 }}>Add to this patient's plan</h3>
            <p className="sub" style={{ marginBottom: 10 }}>
              Each of these becomes a step, placed directly after
              {currentStep ? <> <b>{currentStep.t}</b>, which is where this patient is
                right now</> : ' wherever the patient has reached'}. Medicines and
              supplements also join their medicines list.
            </p>

            <div className="row" style={{ gap: 8, marginBottom: 12 }}>
              {Object.entries(ADDABLE).map(([k, spec]) => (
                <button key={k} className={`btn btn-sm ${draft?.kind === k ? 'btn-gold' : 'btn-ghost'}`}
                  onClick={() => begin(k)}>
                  <Icon name="plus" size={12} /> {spec.t}
                </button>
              ))}
            </div>

            {draft && (
              <div className="item-edit split" style={{ marginTop: 4 }}>
                <div className="col">
                  <div className="col-h">What the patient reads</div>
                  <Field label="Title" value={draft.t}
                    onChange={(v) => setDraft({ ...draft, t: v })} />
                  <Field label="The line under it" value={draft.sub || ''}
                    onChange={(v) => setDraft({ ...draft, sub: v })}
                    hint="Say what happens, not how it will feel." />
                  <Field label="Call to action" value={draft.action?.label || ''}
                    onChange={(v) => setDraft({ ...draft,
                      action: v.trim() ? { kind: draft.action?.kind || 'book', label: v } : undefined })}
                    hint="Leave it empty and the step becomes something they wait on." />
                </div>

                <div className="col">
                  <div className="col-h">How it is wired</div>
                  <Field label={ADDABLE[draft.kind].t} type="select" value={draft.serviceId}
                    options={SERVICES[ADDABLE[draft.kind].group].items.map((x) => x.id)}
                    display={SERVICES[ADDABLE[draft.kind].group].items
                      .reduce((a, x) => ({ ...a, [x.id]: x.t }), {})}
                    onChange={(v) => {
                      const svc = findService(v);
                      if (blockedFor(svc)) { setGateAsked(v); return; }
                      repoint(v);
                    }}
                    hint={findService(draft.serviceId)?.note} />
                  {(findService(draft.serviceId)?.type === 'medication'
                    || findService(draft.serviceId)?.type === 'supplement') && (
                    <Field label="Dose" value={draft.dose || ''} placeholder="250 mcg daily"
                      onChange={(v) => setDraft({ ...draft, dose: v })} />
                  )}
                  <Field label="Week" type="select" value={String(draft.week)}
                    options={Array.from({ length: 12 }, (_, n) => String(n + 1))}
                    display={Array.from({ length: 12 }, (_, n) => n + 1)
                      .reduce((a, w) => ({ ...a, [String(w)]: `Week ${w}` }), {})}
                    onChange={(v) => setDraft({ ...draft, week: Number(v) })} />
                  <Field label="Blocking" type="select"
                    value={draft.blocker ? 'blocks' : 'free'}
                    options={['free', 'blocks']}
                    display={{ free: 'Does not block what follows',
                               blocks: 'Blocks what follows' }}
                    onChange={(v) => setDraft({ ...draft, blocker: v === 'blocks' })}
                    hint="Declared here, enforced by the backend." />
                  <div className="win-read">
                    Costs <b>{money(priceOf(findService(draft.serviceId), region), region)}</b>
                    {' '}on top of the protocol.
                  </div>
                </div>

                <div className="row" style={{ gridColumn: '1 / -1', gap: 8 }}>
                  <button className="btn btn-primary" onClick={commit}>
                    <Icon name="plus" size={13} /> Add this step
                  </button>
                  <button className="btn btn-ghost" onClick={() => setDraft(null)}>Cancel</button>
                </div>
              </div>
            )}

            {rx.length > 0 && (
              <>
                <div className="lbl-sm" style={{ marginTop: 16 }}>Also on their medicines list</div>
                {rx.map((r) => {
                  const svc = findService(r.id);
                  return (
                    <div className="item" key={r.id}>
                      <span className="when">{r.status}</span>
                      <div className="body">
                        <b>{svc?.t || r.id}</b>
                        <span>{svc?.note}{r.dose ? ` · ${r.dose}` : ''}
                          {svc && priceOf(svc, region) ? ` · ${money(priceOf(svc, region), region)}` : ''}</span>
                      </div>
                      <div className="acts">
                        <Field type="select" value={r.status} options={['ongoing', 'recommended']}
                          onChange={(v) => setRx((xs) => xs.map((x) => (x.id === r.id ? { ...x, status: v } : x)))} />
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => setRx((xs) => xs.filter((x) => x.id !== r.id))}>Remove</button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </>
      )}

      {added.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <Note tone="green" label={`${added.length} item${added.length === 1 ? '' : 's'} will be added`}>
            <p style={{ margin: 0 }}>
              {added.map((a) => a.t).join(' · ')}. These land on the patient's plan the
              moment you save, and the app resolves them into the journey like any other item.
            </p>
          </Note>
        </div>
      )}

      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={save}>
          <Icon name="check" size={14} /> Save consult outcome
        </button>
        <span className="hint">
          This writes to the patient, not to the template. It is the one surface here that does.
        </span>
      </div>
    </>
  );
}
