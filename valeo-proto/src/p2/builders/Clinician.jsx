import { useState } from 'react';
import Icon from '../ui/Icon';
import { Field, Chip, Note } from '../ui/kit';
import { useStudio } from '../lib/store';

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

export default function Clinician({ goalId }) {
  const { state, update } = useStudio();
  const draft = state.drafts?.[goalId];
  const consult = state.consult || {};

  const [note, setNote] = useState(consult.note || '');
  const [outcome, setOutcome] = useState(consult.outcome || OUTCOMES[0]);
  const [dose, setDose] = useState(consult.dose || 'BPC-157 250 mcg daily');
  const [competes, setCompetes] = useState(consult.competes || 'unanswered');
  const [added, setAdded] = useState(consult.addedItems || []);

  if (!draft || !draft.plan) {
    return <div className="card card-pad empty">No protocol for this goal, so there is nothing to consult on.</div>;
  }

  /* The whole gate, in one line. Unanswered is not the same as no. */
  const tbOfferable = competes === 'no';

  const addItem = (item) => setAdded((xs) => (xs.some((x) => x.id === item.id) ? xs : [...xs, item]));
  const drop = (id) => setAdded((xs) => xs.filter((x) => x.id !== id));

  const OFFERS = [
    { id: 'tb_500', t: 'TB-500 (Wolverine upgrade)', sub: 'AED 5,999 · adds TB-500 from Week 6',
      gated: true, when: 'Week 6', offset: 43 },
    { id: 'nurse_admin', t: 'Nurse administration visits', sub: 'AED 99 per visit, 4-pack AED 349',
      when: 'Ongoing', offset: 14 },
    { id: 'physio', t: 'Physiotherapy referral', sub: 'Where clinically indicated',
      when: 'Week 2', offset: 14 },
  ];

  const save = () => update((d) => {
    d.consult = {
      note, outcome, dose, competes, addedItems: added,
      at: new Date().toISOString(),
      version: ((d.consult && d.consult.version) || 0) + 1,
    };
  });

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="grow">
          <h2>Consult outcome</h2>
          <p className="sub">
            A checklist, not a free editor. What is recorded here becomes items on this
            patient's plan, and the plan is what their next screen shows.
          </p>
        </div>
        <Chip tone={consult.version ? 'live' : 'draft'}>
          {consult.version ? `saved v${consult.version}` : 'not saved'}
        </Chip>
      </div>

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

      {/* ── offers, with the gate enforced at the offer ── */}
      <div className="card card-pad">
        <h3 style={{ marginBottom: 8 }}>Add to this patient's plan</h3>
        {OFFERS.map((o) => {
          const blocked = o.gated && !tbOfferable;
          const on = added.some((x) => x.id === o.id);
          return (
            <div className={`item ${blocked ? 'locked' : ''}`} key={o.id}>
              <span className="when">{o.when}</span>
              <div className="body">
                <b>{o.t}</b>
                <span>{o.sub}</span>
                {blocked && (
                  <span style={{ color: 'var(--red)', marginTop: 4 }}>
                    {competes === 'yes'
                      ? 'Cannot be offered. This patient competes in tested sport and TB-500 is WADA-prohibited.'
                      : 'Cannot be offered until the competition question is answered.'}
                  </span>
                )}
              </div>
              <div className="acts">
                {on ? (
                  <button className="btn btn-ghost btn-sm" onClick={() => drop(o.id)}>Remove</button>
                ) : (
                  <button className="btn btn-gold btn-sm" disabled={blocked}
                    onClick={() => addItem({ id: o.id, t: o.t, sub: o.sub, when: o.when,
                                             offset: o.offset, actor: 'Doctor added' })}>
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
