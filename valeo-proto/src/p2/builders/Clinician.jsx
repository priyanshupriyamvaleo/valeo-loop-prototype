import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import { Field, Chip, Note } from '../ui/kit';
import { useStudio } from '../lib/store';
import { PATIENTS, SERVICES, findService } from '../lib/seed';
import { planFor, nextItem, consultFor } from '../../p1/lib/journey';
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
function liveRecord(pt, studio, goalId) {
  if (!pt) return { flags: ['This patient has not opened the app yet.'] };
  const label = (cfg, id) => (cfg?.questions || []).find((q) => q.id === id)?.q || id;
  const onbCfg = studio?.published?.shared?.onboarding?.data;
  const triCfg = studio?.published?.[goalId]?.triage?.data;
  const asRows = (cfg, answers) => Object.fromEntries(
    Object.entries(answers || {}).map(([k, v]) => [label(cfg, k), [].concat(v).join(', ')]));

  /* The same resolver the patient app uses, so the doctor is reading the plan
     the patient is actually on. Reading the raw published array meant the two
     disagreed about the order and about whether the doctor's own additions
     counted. */
  const plan = planFor(studio, goalId, pt);
  const total = plan.length;
  const done = (pt.done || []).length;
  const next = nextItem(plan, pt.done || []);
  const bought = !!pt.goal && ['gate:plan', 'home', 'detail', 'gate:consult'].includes(pt.stage) && pt.mode === 'protocol';
  const pp = studio?.published?.[goalId]?.prepurchase?.data;
  const c = consultFor(studio);

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
      <Consult key={patient.id} patient={patient} record={record} goalId={goalId}
        currentStep={patient.live ? nextItem(planFor(state, goalId, pt || {}), (pt && pt.done) || []) : null}
        state={state} update={update} />
    </>
  );
}

function Consult({ patient, record, state, update, goalId, currentStep }) {
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
  const changeable = (state.published?.[goalId]?.plan?.data || [])
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
                    Costs <b>AED {(findService(draft.serviceId)?.price || 0).toLocaleString()}</b>
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
                          {svc?.price ? ` · AED ${svc.price.toLocaleString()}` : ''}</span>
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
