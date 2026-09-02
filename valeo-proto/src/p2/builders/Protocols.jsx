import { useState } from 'react';
import Icon from '../ui/Icon';
import { Field, Chip, Note } from '../ui/kit';
import { useStudio, pubState, stageOf, landingTab } from '../lib/store';
import { invoiceOf } from '../lib/seed';
import { GOALS, REGIONS, regionOf, goalOf, money } from '../../shared/bus';
import { go } from '../lib/router';

/*
 * THE PROTOCOLS LIST — what exists, and how to make another.
 *
 * A protocol used to be one of three fixed goals, which quietly said there
 * could only ever be three. There cannot: the same programme priced for two
 * countries is two protocols, because the catalogue behind it is two
 * catalogues, and a category manager runs several at once.
 *
 * So this is a list of things somebody made. Each row says where it is sold,
 * how far through authoring it got, and what it costs — the three questions
 * asked of a protocol before it is opened.
 *
 * ── REGION IS SHOWN HERE AND NOWHERE INSIDE ──
 * Out here no scope is established, so every row carries its country. Inside a
 * protocol the region is pinned to the header once and never repeated on the
 * rows, which is the only way a scope stays read rather than becoming
 * furniture. It is the same reason a console names the region at the top of the
 * window and not on every resource in it.
 */

/* A protocol is a package first and a plan second. The list says which of the
   two somebody stopped at, because a half-made protocol that looks finished is
   worse than one that admits it. Read out of what is published, not out of a
   field somebody set. */
const STATE = {
  package: { tone: 'draft', t: 'Not published' },
  plan:    { tone: 'ed',    t: 'Plan not published' },
  live:    { tone: 'live',  t: 'Live' },
};

function Row({ p, state, serving, onOpen, onCopy }) {
  const pkg = pubState(state, p.id, 'prepurchase');
  const plan = pubState(state, p.id, 'plan');
  const st = STATE[stageOf(state, p.id)];
  const inv = invoiceOf(state.drafts?.[p.id]?.prepurchase, p.region);
  const g = goalOf(p.goal);

  return (
    <div className={`prow ${p.locked ? 'lockedrow' : ''}`}>
      <button className="prow-hit" onClick={() => onOpen(p)}>
        <span className="prow-ic">
          <Icon name={p.locked ? 'lock' : (g?.ic || 'clipboard')} size={16} />
        </span>
        <span className="prow-main">
          <b>{p.name}</b>
          <i>{g ? g.t : p.goal} · {p.weeks} weeks · created {p.createdAt}</i>
        </span>
        {/* The one place the region belongs on a row. */}
        <span className="prow-rg">{regionOf(p.region).short}</span>
        <span className="prow-price">{money(inv.total, p.region)}</span>
        <span className="prow-st">
          <Chip tone={st.tone}>{st.t}</Chip>
          {/* Exactly one protocol per goal and region is what the app is
              reading. Saying which removes the only real ambiguity in a list
              that can hold several. */}
          <i>{serving ? 'the app is reading this one' : p.locked ? 'read only' : 'editable'}</i>
        </span>
      </button>
      {p.locked ? (
        <button className="btn btn-ghost btn-sm prow-act" onClick={() => onCopy(p)}>
          <Icon name="layers" size={12} /> Duplicate to edit
        </button>
      ) : <span className="prow-act" />}
    </div>
  );
}

/* ── MAKING ONE ──
   Four decisions, and every one of them is something the two builders below
   cannot work out for themselves: what it is called, which goal it answers,
   where it is sold, and how long it runs. Region is here rather than inside the
   package because it decides which catalogue the package can even draw from. */
function Create({ onCancel, onCreate }) {
  const [name, setName] = useState('Recovery & Repair');
  const [goal, setGoal] = useState('recover-rebuild');
  const [region, setRegion] = useState('uae');
  const [weeks, setWeeks] = useState(12);
  const ready = String(name).trim() && weeks > 0;

  return (
    <>
      <button className="crumb" onClick={onCancel}>
        <Icon name="back" size={12} /> Protocols
      </button>

      <div className="row" style={{ margin: '10px 0 16px' }}>
        <div className="grow">
          <h2>A new protocol</h2>
          <p className="sub">
            Then its three parts in the order a patient meets them: the triage questions,
            the package they are priced by, and the plan they get after paying.
          </p>
        </div>
      </div>

      <div className="card card-pad" style={{ display: 'grid', gap: 14, maxWidth: 620 }}>
        <Field label="Name" value={name} onChange={setName}
          hint="What staff will call it in this list. The patient reads the PDP title, set in the package." />
        <div className="grid-2">
          <Field label="Goal it answers" type="select" value={goal} onChange={setGoal}
            options={GOALS.map((g) => g.id)}
            display={Object.fromEntries(GOALS.map((g) => [g.id, g.t]))}
            hint="A patient reaching this goal in this region gets this protocol." />
          <Field label="Where it is sold" type="select" value={region} onChange={setRegion}
            options={REGIONS.map((r) => r.id)}
            display={Object.fromEntries(REGIONS.map((r) => [r.id, `${r.t} · ${r.ccy}`]))}
            hint="Decides which catalogue the package can draw from, and at what prices." />
        </div>
        <Field label="How long it runs (weeks)" type="number" value={weeks}
          onChange={(v) => setWeeks(Math.max(1, v || 1))}
          hint="Every step's week is set against this, and the patient's progress is read out of it." />

        <Note label="It starts from the seeded protocol, not from nothing">
          <p style={{ margin: 0 }}>
            The clinical spine is the same programme every time — baseline panel,
            consultation, monthly dispatches, Week 12 retest — so a new protocol opens
            with those in place and priced for the region you picked. Retyping fourteen
            steps is not authoring.
          </p>
        </Note>

        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-gold" disabled={!ready}
            onClick={() => onCreate({ name: String(name).trim(), goal, region, weeks })}>
            <Icon name="plus" size={13} /> Create it and start
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </>
  );
}

export default function Protocols({ parts = [] }) {
  const { state, createProtocol, duplicateProtocol } = useStudio();
  const creating = parts[1] === 'new';
  const list = state.protocols || [];
  /* Which one each goal-and-region pair is actually serving. */
  const serving = new Set(
    Object.values(list.reduce((acc, p) => {
      const k = `${p.goal}/${p.region}`;
      const at = state.published?.[p.id]?.plan?.at;
      if (!at) return acc;
      if (!acc[k] || at > (state.published?.[acc[k]]?.plan?.at || '')) acc[k] = p.id;
      return acc;
    }, {})),
  );

  if (creating) {
    return (
      <Create onCancel={() => go('/protocols')}
        onCreate={(meta) => {
          /* Straight into step one. A creation form that returns you to a list
             makes you find the thing you just made. */
          const id = createProtocol(meta);
          go(`/p/${id}/triage`);
        }} />
    );
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="grow">
          <h2>Protocols</h2>
          <p className="sub">
            Every protocol this account sells, and where. One package and one plan each.
          </p>
        </div>
        <button className="btn btn-gold" onClick={() => go('/protocols/new')}>
          <Icon name="plus" size={13} /> New protocol
        </button>
      </div>

      {list.length ? (
        <div className="plist">
          {list.map((p) => (
            <Row key={p.id} p={p} state={state} serving={serving.has(p.id)}
              onOpen={(x) => go(`/p/${x.id}/${x.locked ? 'triage' : landingTab(state, x.id)}`)}
              onCopy={(x) => { const id = duplicateProtocol(x.id); if (id) go(`/p/${id}/triage`); }} />
          ))}
        </div>
      ) : (
        <div className="card card-pad empty">
          No protocols yet. Create one and its package opens first.
        </div>
      )}

      <p className="ofoot">
        {list.length} protocol{list.length === 1 ? '' : 's'}. Locked ones are already
        selling, so they open read only — duplicate one to change it. The onboarding chat is shared
        by all of them and is edited once, under its own entry.
      </p>
    </>
  );
}
