import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import { Field, Chip, Note } from '../ui/kit';
import { useStudio } from '../lib/store';
import { PATIENTS, SERVICES, findService } from '../lib/seed';
import { goalOf, readPatient, subscribe } from '../../shared/bus';

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
const OUTCOMES = ['Continue as planned', 'Dose adjusted', 'Paused pending review'];

/* ── THE QUEUE ──
   A doctor does not arrive at one patient, she arrives at a list. Who is
   waiting, how long, and for what, before she opens anybody.

   Ahmad is the patient sitting in the other tab and his record is read live out
   of the patient app. The rest are fixtures, labelled as fixtures. */
function Queue({ patients, chosen, onChoose }) {
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
function liveRecord(pt, studio, goalId) {
  if (!pt) return { flags: ['This patient has not opened the app yet.'] };
  const label = (cfg, id) => (cfg?.questions || []).find((q) => q.id === id)?.q || id;
  const onbCfg = studio?.published?.shared?.onboarding?.data;
  const triCfg = studio?.published?.[goalId]?.triage?.data;
  const asRows = (cfg, answers) => Object.fromEntries(
    Object.entries(answers || {}).map(([k, v]) => [label(cfg, k), [].concat(v).join(', ')]));

  const plan = studio?.published?.[goalId]?.plan?.data || [];
  const extra = studio?.consult?.addedItems || [];
  const total = plan.length + extra.length;
  const done = (pt.done || []).length;
  const next = plan.find((i) => !(pt.done || []).includes(i.id));
  const bought = !!pt.goal && ['gate:plan', 'home', 'detail', 'gate:consult'].includes(pt.stage) && pt.mode === 'protocol';
  const pp = studio?.published?.[goalId]?.prepurchase?.data;
  const c = studio?.consult;

  return {
    profile: pt.intake?.profile,
    onboarding: asRows(onbCfg, pt.intake?.answers),
    triage: asRows(triCfg, pt.answers),
    purchase: bought && pp
      ? { what: pp.pdp?.title || 'Protocol', paid: `AED ${(pp.cart?.price || 0).toLocaleString()}`, on: 'This session' }
      : null,
    progress: total ? { done, total, next: next ? next.t : null } : null,
    consults: c && c.version
      ? [{ on: 'Earlier today', outcome: c.outcome, note: c.note || 'No note recorded.' }]
      : [],
    flags: [`Competes in tested sport: ${(c && c.competes && c.competes !== 'unanswered') ? c.competes : 'not asked yet'}`],
  };
}

export default function Clinician({ goalId }) {
  const { state, update } = useStudio();
  const draft = state.drafts?.[goalId];

  const [chosen, setChosen] = useState('live');
  /* The patient app writes while this screen is open, so follow it. */
  const [pt, setPt] = useState(() => readPatient(null));
  useEffect(() => subscribe(() => setPt(readPatient(null))), []);

  const patient = PATIENTS.find((p) => p.id === chosen) || PATIENTS[0];
  const record = patient.live ? liveRecord(pt, state, goalId) : patient.record;

  if (!draft || !draft.plan) {
    return <div className="card card-pad empty">No protocol for this goal, so there is nothing to consult on.</div>;
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="grow">
          <h2>Consult queue</h2>
          <p className="sub">
            Who is waiting, and for what. Open one to read the record before the call.
          </p>
        </div>
      </div>

      <Queue patients={PATIENTS} chosen={chosen} onChoose={setChosen} />

      {/* Keyed on the patient so that switching gives a genuinely fresh screen.
          Without it the folds stay open on the last person's history and, far
          worse, a half-typed note stays in the box and gets saved against
          whoever is now on screen. */}
      <Consult key={patient.id} patient={patient} record={record}
        state={state} update={update} />
    </>
  );
}

function Consult({ patient, record, state, update }) {
  const consult = state.consult || {};
  const [note, setNote] = useState(consult.note || '');
  const [outcome, setOutcome] = useState(consult.outcome || OUTCOMES[0]);
  const [dose, setDose] = useState(consult.dose || 'BPC-157 250 mcg daily');
  const [competes, setCompetes] = useState(consult.competes || 'unanswered');
  /* THREE DIFFERENT THINGS COME OUT OF A CONSULTATION, and conflating them is
     how the plan filled up with products.
       ORDERED    tests and visits. These are plan STEPS: they have a date, they
                  block things, the patient has to turn up for them.
       PRESCRIBED medicines, peptides and supplements. These are NOT steps. They
                  are a standing list the patient reads and buys from, and
                  putting them in the plan made a shopping list wear a schedule
                  as a costume.
       VOUCHER    which product the supplement voucher is actually for. The plan
                  ships a default; the doctor decides the real one. */
  const [added, setAdded] = useState(consult.addedItems || []);
  const [rx, setRx] = useState(consult.prescribed || []);
  const [voucher, setVoucher] = useState(consult.voucher || 'sup_joint');
  const [pickTest, setPickTest] = useState(SERVICES.lab.items[0].id);
  const [pickRx, setPickRx] = useState(SERVICES.medication.items[0].id);

  /* The whole gate, in one line. Unanswered is not the same as no, and the
     rule lives on the catalogue item so anything WADA-prohibited inherits it
     rather than one button knowing about one product. */
  const blockedFor = (svc) => (svc && svc.gate === 'competes' && competes !== 'no');

  const addItem = (item) => setAdded((xs) => (xs.some((x) => x.id === item.id) ? xs : [...xs, item]));
  const drop = (id) => setAdded((xs) => xs.filter((x) => x.id !== id));

  /* Ordered here means a step on THIS patient's plan, dated just after the
     consultation that ordered it. It does not touch the template: one patient
     needing a thyroid panel is not a reason for every patient to have one. */
  const orderTest = () => {
    const svc = findService(pickTest);
    if (!svc || added.some((x) => x.id === `ord_${svc.id}`)) return;
    setAdded((xs) => [...xs, {
      id: `ord_${svc.id}`, t: svc.t, sub: svc.note,
      window: { from: 12, to: 16 },
      service: { type: svc.type, id: svc.id },
      action: { kind: 'book', label: `Book your ${svc.t.toLowerCase()}` },
    }]);
  };

  const prescribe = () => {
    const svc = findService(pickRx);
    if (!svc || blockedFor(svc) || rx.some((x) => x.id === svc.id)) return;
    setRx((xs) => [...xs, { id: svc.id, status: 'recommended' }]);
  };

  const OFFERS = [
    { id: 'nurse_admin', t: 'Nurse administration visits', sub: 'AED 99 per visit, 4-pack AED 349',
      window: { from: 14, to: 84 }, service: { type: 'homecare', id: 'home_injection' } },
    { id: 'physio', t: 'Physiotherapy referral', sub: 'Where clinically indicated',
      window: { from: 14, to: 21 } },
  ];

  const save = () => update((d) => {
    d.consult = {
      note, outcome, dose, competes, addedItems: added, prescribed: rx, voucher,
      at: new Date().toISOString(),
      version: ((d.consult && d.consult.version) || 0) + 1,
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

      <h3 style={{ marginBottom: 10 }}>Consult outcome</h3>
      <p className="sub" style={{ marginBottom: 12 }}>
        A checklist, not a free editor. What is recorded here becomes items on this
        patient's plan, and the plan is what their next screen shows.
      </p>

      <div className="card card-pad" style={{ display: 'grid', gap: 12, marginBottom: 14 }}>
        <Field label="Outcome" type="select" options={OUTCOMES} value={outcome} onChange={setOutcome} />
        <Field label="Dose" value={dose} onChange={setDose} />
        <Field label="Note for the record" type="textarea" rows={3} value={note} onChange={setNote}
          placeholder="Response so far, tolerance, anything the care team should know." />
      </div>

      {/* ── the mandatory screening question ── */}
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <div className="row" style={{ marginBottom: 8 }}>
          <h3 className="grow">Screening · mandatory</h3>
          <Chip tone={competes === 'unanswered' ? 'block' : 'live'}>
            {competes === 'unanswered' ? 'unanswered' : `answered: ${competes}`}
          </Chip>
        </div>
        <p style={{ fontSize: 13.5, marginBottom: 10 }}>Do you compete in tested sport?</p>
        <div className="row" style={{ gap: 8 }}>
          {['yes', 'no'].map((v) => (
            <button key={v} className={`btn btn-sm ${competes === v ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setCompetes(v)}>{v === 'yes' ? 'Yes, tested sport' : 'No'}</button>
          ))}
          {competes !== 'unanswered' && (
            <button className="btn btn-ghost btn-sm" onClick={() => setCompetes('unanswered')}>
              Clear
            </button>
          )}
        </div>
        <div style={{ marginTop: 10 }}>
          <span className="hint">
            Asked in the Week 1 consult so the answer exists before Week 6. WADA-prohibited
            substances are gated on it.
          </span>
        </div>
      </div>

      {/* ── 1. ORDER A TEST. This becomes a step on the plan. ── */}
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <h3 style={{ marginBottom: 4 }}>Order a test</h3>
        <p className="sub" style={{ marginBottom: 10 }}>
          Becomes a dated step on this patient's plan, just after today. It does not
          change the template: one patient needing a thyroid panel is not a reason for
          every patient to have one.
        </p>
        <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
          <div className="grow">
            <Field label="Panel" type="select" value={pickTest}
              options={SERVICES.lab.items.map((x) => x.id)}
              display={SERVICES.lab.items.reduce((a, x) => ({ ...a, [x.id]: x.t }), {})}
              onChange={setPickTest}
              hint={findService(pickTest)?.note} />
          </div>
          <button className="btn btn-gold btn-sm" onClick={orderTest}>
            <Icon name="plus" size={12} /> Order
          </button>
        </div>
      </div>

      {/* ── 2. PRESCRIBE. This does NOT become a step. ── */}
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <h3 style={{ marginBottom: 4 }}>Prescribe or recommend</h3>
        <p className="sub" style={{ marginBottom: 10 }}>
          Medicines, peptides and supplements are not steps. They have no date and
          nothing to turn up for, so they go to the patient's medicines list rather
          than into the schedule.
        </p>
        <div className="row" style={{ gap: 8, alignItems: 'flex-end' }}>
          <div className="grow">
            <Field label="Product" type="select" value={pickRx}
              options={[...SERVICES.medication.items, ...SERVICES.supplement.items].map((x) => x.id)}
              display={[...SERVICES.medication.items, ...SERVICES.supplement.items]
                .reduce((a, x) => ({ ...a, [x.id]: x.t }), {})}
              onChange={setPickRx}
              hint={blockedFor(findService(pickRx))
                ? (competes === 'yes'
                    ? 'Cannot be prescribed. This patient competes in tested sport and this is WADA-prohibited.'
                    : 'Cannot be prescribed until the competition question is answered.')
                : findService(pickRx)?.note} />
          </div>
          <button className="btn btn-gold btn-sm" disabled={blockedFor(findService(pickRx))}
            onClick={prescribe}>
            <Icon name="plus" size={12} /> Add
          </button>
        </div>

        {rx.length > 0 && rx.map((r) => {
          const svc = findService(r.id);
          return (
            <div className="item" key={r.id} style={{ marginTop: 8 }}>
              <span className="when">{r.status}</span>
              <div className="body">
                <b>{svc?.t || r.id}</b>
                <span>{svc?.note}{svc?.price ? ` · AED ${svc.price.toLocaleString()}` : ''}</span>
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
      </div>

      {/* ── 3. THE VOUCHER. The plan ships a default; the doctor decides. ── */}
      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <h3 style={{ marginBottom: 4 }}>What the supplement voucher is for</h3>
        <p className="sub" style={{ marginBottom: 10 }}>
          The protocol issues the voucher automatically. What it buys is a clinical
          decision, so it is made here and the patient's voucher updates to match.
        </p>
        <Field label="Product" type="select" value={voucher}
          options={SERVICES.supplement.items.map((x) => x.id)}
          display={SERVICES.supplement.items.reduce((a, x) => ({ ...a, [x.id]: x.t }), {})}
          onChange={setVoucher}
          hint={findService(voucher)?.note} />
      </div>

      {/* ── referrals and visits, which are steps like any other ── */}
      <div className="card card-pad">
        <h3 style={{ marginBottom: 8 }}>Add to this patient's plan</h3>
        {OFFERS.map((o) => {
          const on = added.some((x) => x.id === o.id);
          return (
            <div className="item" key={o.id}>
              <span className="when">day {o.window.from}</span>
              <div className="body">
                <b>{o.t}</b>
                <span>{o.sub}</span>
              </div>
              <div className="acts">
                {on ? (
                  <button className="btn btn-ghost btn-sm" onClick={() => drop(o.id)}>Remove</button>
                ) : (
                  <button className="btn btn-gold btn-sm"
                    onClick={() => addItem({ id: o.id, t: o.t, sub: o.sub, window: o.window,
                                             service: o.service })}>
                    Offer
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
