import { useState } from 'react';
import Icon from '../ui/Icon';
import { Field, Chip, Note, IconBtn } from '../ui/kit';
import { useStudio } from '../lib/store';
import { SHARED } from '../../shared/bus';

/*
 * THE ONBOARDING CHAT BUILDER — two chats, because the product asks twice.
 *
 * THE ONBOARDING CHAT runs before a goal exists. It is the conversation that
 * decides which goal you are in, so it belongs to none of them and is edited
 * once for the whole product. It also collects the four facts a doctor needs on
 * file before anything can be prescribed.
 *
 * THE TRIAGE CHAT runs after the goal is chosen and is different for each one.
 * Triage, not screening: on Recover and Rebuild every answer leads to the same
 * next step, so there is no routing here and no gate. What these answers buy is
 * a doctor who has read them before the call.
 *
 * They sit under one roof because they are one conversation to the patient, and
 * splitting them across two tools is how the second one ends up asking again
 * for something the first one already knew.
 */
const KINDS = ['choice', 'multi', 'text', 'number'];
const FIELD_KINDS = ['number', 'choice', 'text'];

/* Both chats hold the same shape of question, so the list is written once. */
function Questions({ qs, patch, editing, setEditing, addLabel }) {
  const move = (i, dir) => patch((c) => {
    const j = i + dir;
    if (j < 0 || j >= c.questions.length) return;
    [c.questions[i], c.questions[j]] = [c.questions[j], c.questions[i]];
  });

  const save = () => {
    const q = editing;
    if (!q.q.trim()) return;
    patch((c) => {
      const i = c.questions.findIndex((x) => x.id === q.id);
      const clean = { ...q, options: (q.optionsText || '').split('\n').map((s) => s.trim()).filter(Boolean) };
      delete clean.optionsText;
      if (i === -1) c.questions.push(clean); else c.questions[i] = clean;
    });
    setEditing(null);
  };

  const open = (q) => setEditing({ ...q, optionsText: (q.options || []).join('\n') });

  return (
    <>
      <div className="row" style={{ marginBottom: 8 }}>
        <h3 className="grow">Questions ({qs.length})</h3>
        <button className="btn btn-ghost btn-sm"
          onClick={() => setEditing({ id: 'q' + Date.now().toString(36), q: '', kind: 'choice', optionsText: '' })}>
          <Icon name="plus" size={12} /> {addLabel}
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
              onClick={() => patch((c) => { c.questions = c.questions.filter((x) => x.id !== q.id); })} />
          </div>
        </div>
      ))}

      {qs.length === 0 && (
        <div className="card card-pad empty">No questions yet. The chat would open and end immediately.</div>
      )}

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

/* ── the onboarding chat ── */
function Onboarding({ draft, update }) {
  const [editing, setEditing] = useState(null);
  const [field, setField] = useState(null);
  const patch = (fn) => update((d) => { fn(d.drafts[SHARED].onboarding); });
  const ob = draft;
  if (!ob) {
    return (
      <div className="card card-pad empty">
        No onboarding chat is configured. Press Reset demo to restore it.
      </div>
    );
  }
  const fields = ob.profile?.fields || [];

  const saveField = () => {
    const f = field;
    if (!f.t.trim()) return;
    patch((c) => {
      const list = c.profile.fields;
      const i = list.findIndex((x) => x.id === f.id);
      const clean = { ...f, options: (f.optionsText || '').split('\n').map((s) => s.trim()).filter(Boolean) };
      delete clean.optionsText;
      if (i === -1) list.push(clean); else list[i] = clean;
    });
    setField(null);
  };

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="grow">
          <h2>Onboarding chat</h2>
          <p className="sub">
            Runs before a goal exists, so it is edited once for the whole product rather
            than per goal. It works out what somebody is here for, collects what the
            doctor needs on file, and then suggests a goal.
          </p>
        </div>
        <Chip tone="live">Shared by every goal</Chip>
      </div>

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <Field label="Opening line" type="textarea" rows={2} value={ob.intro}
          onChange={(v) => patch((c) => { c.intro = v; })}
          hint="The first thing anybody reads in the product." />
      </div>

      <Questions qs={ob.questions || []} patch={patch} editing={editing}
        setEditing={setEditing} addLabel="Add question" />

      <div className="row" style={{ marginTop: 22, marginBottom: 8 }}>
        <h3 className="grow">Details collected ({fields.length})</h3>
        <button className="btn btn-ghost btn-sm"
          onClick={() => setField({ id: 'f' + Date.now().toString(36), t: '', kind: 'number', suffix: '', optionsText: '' })}>
          <Icon name="plus" size={12} /> Add detail
        </button>
      </div>
      <div className="card card-pad" style={{ marginBottom: 12 }}>
        <Field label="Step heading" value={ob.profile?.t || ''}
          onChange={(v) => patch((c) => { c.profile.t = v; })} />
        <div style={{ height: 12 }} />
        <Field label="Step note" type="textarea" rows={2} value={ob.profile?.sub || ''}
          onChange={(v) => patch((c) => { c.profile.sub = v; })} />
      </div>

      {fields.map((f) => (
        <div className="item" key={f.id}>
          <span className="when">{f.kind}</span>
          <div className="body">
            <b>{f.t}</b>
            <span>{f.kind === 'choice' ? (f.options || []).join(' · ') : (f.suffix || 'Free entry')}</span>
          </div>
          <div className="acts">
            <IconBtn name="pencil" title="Edit"
              onClick={() => setField({ ...f, optionsText: (f.options || []).join('\n') })} />
            <IconBtn name="trash" title="Delete" danger
              onClick={() => patch((c) => { c.profile.fields = c.profile.fields.filter((x) => x.id !== f.id); })} />
          </div>
        </div>
      ))}

      {field && (
        <div className="card card-pad" style={{ marginTop: 14, borderColor: 'var(--gold)' }}>
          <h3 style={{ marginBottom: 12 }}>
            {fields.some((x) => x.id === field.id) ? 'Edit detail' : 'New detail'}
          </h3>
          <div style={{ display: 'grid', gap: 12 }}>
            <Field label="Label" value={field.t} onChange={(v) => setField({ ...field, t: v })}
              placeholder="Weight" />
            <Field label="Kind" type="select" options={FIELD_KINDS} value={field.kind}
              onChange={(v) => setField({ ...field, kind: v })} />
            {field.kind === 'choice' ? (
              <Field label="Options" type="textarea" rows={4} value={field.optionsText}
                onChange={(v) => setField({ ...field, optionsText: v })} hint="One per line." />
            ) : (
              <Field label="Unit" value={field.suffix || ''}
                onChange={(v) => setField({ ...field, suffix: v })} placeholder="kg" />
            )}
          </div>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="btn btn-primary" onClick={saveField}>Save detail</button>
            <button className="btn btn-ghost" onClick={() => setField(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="row" style={{ marginTop: 22, marginBottom: 8 }}>
        <h3 className="grow">Which goal each answer suggests</h3>
      </div>
      <div className="card card-pad" style={{ marginBottom: 12 }}>
        <Field label="Goal step heading" value={ob.goalStep?.t || ''}
          onChange={(v) => patch((c) => { c.goalStep.t = v; })} />
        <div style={{ height: 12 }} />
        <Field label="Goal step note" type="textarea" rows={2} value={ob.goalStep?.sub || ''}
          onChange={(v) => patch((c) => { c.goalStep.sub = v; })} />
      </div>
      {(ob.routes || []).map((r, i) => (
        <div className="item" key={r.when}>
          <span className="when">if</span>
          <div className="body">
            <b>{r.when}</b>
            <span>suggests {r.goal}</span>
          </div>
          <div className="acts">
            <Field type="select" value={r.goal}
              options={['recover-rebuild', 'weight-loss', 'skin-hair']}
              onChange={(v) => patch((c) => { c.routes[i].goal = v; })} />
          </div>
        </div>
      ))}

      <div style={{ marginTop: 16 }}>
        <Note label="A suggestion, not a route">
          The goal step always shows all three goals. Whatever these rules pick is
          marked as suggested and nothing more, because a chat that quietly forces a
          route is a router wearing a conversation as a costume.
        </Note>
      </div>
    </>
  );
}

/* ── the per-goal triage chat ── */
function Triage({ goalId, draft, update }) {
  const [editing, setEditing] = useState(null);
  const patch = (fn) => update((d) => { fn(d.drafts[goalId].triage); });

  if (!draft) {
    return <div className="card card-pad empty">No triage chat is configured for this goal yet.</div>;
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="grow">
          <h2>Triage chat</h2>
          <p className="sub">
            Runs after the goal is chosen, and is different for each one. No gating on
            this goal: every answer leads to the same next step, so these questions buy
            the doctor context, not a routing decision.
          </p>
        </div>
      </div>

      <div className="card card-pad" style={{ marginBottom: 14 }}>
        <Field label="Opening line" type="textarea" rows={2} value={draft.intro}
          onChange={(v) => patch((t) => { t.intro = v; })}
          hint="The first thing in the thread, before question one." />
      </div>

      <Questions qs={draft.questions || []} patch={patch} editing={editing}
        setEditing={setEditing} addLabel="Add question" />

      <div style={{ marginTop: 16 }}>
        <Note label="Why there is no gate here">
          Recover and Rebuild refuses nobody at triage. The competition question that
          gates TB-500 is a clinical screening question and lives in the consultation,
          not here, because the answer has to be on the record before Week 6.
        </Note>
      </div>
    </>
  );
}

export default function ChatBuilder({ goalId, tab }) {
  const { state, update } = useStudio();
  return tab === 'triage'
    ? <Triage goalId={goalId} draft={state.drafts?.[goalId]?.triage} update={update} />
    : <Onboarding draft={state.drafts?.[SHARED]?.onboarding} update={update} />;
}
