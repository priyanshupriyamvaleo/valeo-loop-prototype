import { useState } from 'react';
import Icon from '../ui/Icon';
import { Field, Chip, Note, IconBtn } from '../ui/kit';
import { useStudio } from '../lib/store';

/*
 * THE ONBOARDING CHAT BUILDER.
 *
 * Triage, not screening. Every Recover and Rebuild patient reaches the same
 * next step whatever they answer, so there is no routing here and no gate —
 * what these answers buy is a doctor who has read them before the call, and a
 * symptom list the recommendation can be justified against.
 *
 * The builder is deliberately shaped like the thing it produces: a question,
 * its options, in order. A form that looked like a database table would make a
 * category manager guess at what the patient will see.
 */
const KINDS = ['choice', 'multi', 'text', 'number'];

export default function ChatBuilder({ goalId }) {
  const { state, update } = useStudio();
  const draft = state.drafts?.[goalId];
  const [editing, setEditing] = useState(null);

  if (!draft || !draft.triage) {
    return (
      <div className="card card-pad empty">
        No triage chat is configured for this goal yet.
      </div>
    );
  }

  const qs = draft.triage.questions || [];
  const patch = (fn) => update((d) => { fn(d.drafts[goalId].triage); });

  const move = (i, dir) => patch((t) => {
    const j = i + dir;
    if (j < 0 || j >= t.questions.length) return;
    [t.questions[i], t.questions[j]] = [t.questions[j], t.questions[i]];
  });

  const save = () => {
    const q = editing;
    if (!q.q.trim()) return;
    patch((t) => {
      const i = t.questions.findIndex((x) => x.id === q.id);
      const clean = { ...q, options: (q.optionsText || '').split('\n').map((s) => s.trim()).filter(Boolean) };
      delete clean.optionsText;
      if (i === -1) t.questions.push(clean); else t.questions[i] = clean;
    });
    setEditing(null);
  };

  const open = (q) => setEditing({ ...q, optionsText: (q.options || []).join('\n') });

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="grow">
          <h2>Triage chat</h2>
          <p className="sub">
            What the patient answers before they see the protocol. No gating on this
            goal: every answer leads to the same next step, so these questions buy the
            doctor context, not a routing decision.
          </p>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <Field label="Opening line" type="textarea" rows={2} value={draft.triage.intro}
          onChange={(v) => patch((t) => { t.intro = v; })}
          hint="The first thing in the thread, before question one." />
      </div>

      <div className="row" style={{ marginBottom: 8 }}>
        <h3 className="grow">Questions ({qs.length})</h3>
        <button className="btn btn-ghost btn-sm"
          onClick={() => setEditing({ id: 'q' + Date.now().toString(36), q: '', kind: 'choice', optionsText: '' })}>
          <Icon name="plus" size={12} /> Add question
        </button>
      </div>

      {qs.map((q, i) => (
        <div className="item" key={q.id}>
          <span className="when">{String(i + 1).padStart(2, '0')}</span>
          <div className="body">
            <b>{q.q}</b>
            <span>{(q.options || []).join(' · ') || 'Free text'}</span>
          </div>
          <div className="acts">
            <Chip tone="ed">{q.kind}</Chip>
            <IconBtn name="up" title="Move up" onClick={() => move(i, -1)} disabled={i === 0} />
            <IconBtn name="down" title="Move down" onClick={() => move(i, 1)} disabled={i === qs.length - 1} />
            <IconBtn name="pencil" title="Edit" onClick={() => open(q)} />
            <IconBtn name="trash" title="Delete" danger
              onClick={() => patch((t) => { t.questions = t.questions.filter((x) => x.id !== q.id); })} />
          </div>
        </div>
      ))}

      {qs.length === 0 && (
        <div className="card card-pad empty">No questions yet. The chat would open and end immediately.</div>
      )}

      <div style={{ marginTop: 16 }}>
        <Note label="Why there is no gate here">
          Recover and Rebuild refuses nobody at triage. The competition question that
          gates TB-500 is a clinical screening question and lives in the consultation,
          not here, because the answer has to be on the record before Week 6.
        </Note>
      </div>

      {editing && (
        <div className="card card-pad" style={{ marginTop: 16, borderColor: 'var(--gold)' }}>
          <h3 style={{ marginBottom: 12 }}>
            {qs.some((x) => x.id === editing.id) ? 'Edit question' : 'New question'}
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="Question" value={editing.q}
              onChange={(v) => setEditing({ ...editing, q: v })}
              placeholder="What are you dealing with?" />
            <Field label="Answer type" type="select" options={KINDS} value={editing.kind}
              onChange={(v) => setEditing({ ...editing, kind: v })} />
            {(editing.kind === 'choice' || editing.kind === 'multi') && (
              <Field label="Options" type="textarea" rows={5} value={editing.optionsText}
                onChange={(v) => setEditing({ ...editing, optionsText: v })}
                hint="One per line. These are the chips the patient taps." />
            )}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn btn-primary" onClick={save}>Save question</button>
            <button className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
