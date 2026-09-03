import { useState } from 'react';
import Icon from '../ui/Icon';
import { Field, Chip, Note } from '../ui/kit';
import { useStudio, pubState, stageOf, landingTab } from '../lib/store';
import { invoiceOf } from '../lib/seed';
import { GOALS, REGIONS, regionOf, goalOf, money, chatsForGoal, chatVersions }
  from '../../shared/bus';
import { go } from '../lib/router';

/*
 * PROTOCOL BUILDER — the dashboard.
 *
 * Two levels, because a protocol has two identities and flattening them was
 * confusing. At the top it is a GOAL: Recover and Rebuild is one product no
 * matter how many times it has been rebuilt. Inside a goal it is a list of
 * VERSIONS, each one a protocol somebody authored for a region on a date.
 *
 * The goals that are not built out are shown and not clickable, because a list
 * that hides them makes it look as though the product only has one goal.
 *
 * ── THE TIMELINE IS THE POINT ──
 * Versions are read down the left by date. Which one the consumer app is
 * serving is stated on the row, because a list that can hold four versions of
 * one protocol owes you that before you open any of them.
 */

const STATE = {
  package: { tone: 'draft', t: 'Not published' },
  plan:    { tone: 'ed',    t: 'Plan not published' },
  live:    { tone: 'live',  t: 'Live' },
};

/* ── LEVEL ONE: the goals ── */
function GoalRow({ g, versions, serving, state, onOpen }) {
  const live = versions.filter((p) => stageOf(state, p.id) === 'live').length;
  const built = versions.length > 0;
  const price = serving ? invoiceOf(state.drafts?.[serving.id]?.prepurchase,
    serving.region, state.drafts?.[serving.id]?.plan).total : 0;

  return (
    <button className={`grow-row ${built ? '' : 'off'}`}
      onClick={() => built && onOpen(g)} disabled={!built}>
      <span className="prow-ic"><Icon name={g.ic} size={17} /></span>
      <span className="prow-main">
        <b>{g.t}</b>
        <i>{built
          ? `${versions.length} version${versions.length === 1 ? '' : 's'} · ${live} live`
          : g.existing
            ? 'Already shipping as its own journey. Not authored here.'
            : 'No protocol built for this goal yet'}</i>
      </span>
      {serving && <span className="prow-price">{money(price, serving.region)}</span>}
      {built
        ? <Chip tone={live ? 'live' : 'draft'}>{live ? 'selling' : 'draft only'}</Chip>
        : <Chip tone="draft">not built</Chip>}
      {built && <Icon name="chev" size={14} className="prow-go" />}
    </button>
  );
}

/* ── LEVEL TWO: one goal's versions, down a date rail ── */
function GoalTimeline({ goal, versions, serving, state, onCopy }) {
  const g = goalOf(goal);
  return (
    <>
      <button className="crumb" onClick={() => go('/protocols')}>
        <Icon name="back" size={12} /> Protocol Builder
      </button>

      <div className="row" style={{ margin: '10px 0 18px' }}>
        <div className="grow">
          <h2>{g?.t || goal}</h2>
          <p className="sub">
            Every protocol built for this goal, newest first. One of them is what the
            consumer app is serving; the rest are history or work in progress.
          </p>
        </div>
        <button className="btn btn-gold" onClick={() => go(`/protocols/${goal}/new`)}>
          <Icon name="plus" size={13} /> New version
        </button>
      </div>

      <div className="tline">
        {versions.map((p) => {
          const st = STATE[stageOf(state, p.id)];
          const inv = invoiceOf(state.drafts?.[p.id]?.prepurchase, p.region,
            state.drafts?.[p.id]?.plan);
          const pub = state.published?.[p.id]?.plan?.at;
          const when = pub ? new Date(pub) : null;
          const isServing = serving?.id === p.id;
          return (
            <div className={`tl ${isServing ? 'on' : ''} ${p.locked ? 'ro' : ''}`} key={p.id}>
              {/* The date rail. Unpublished versions say so rather than
                  borrowing a date they do not have. */}
              <div className="tl-when">
                {when ? (
                  <>
                    <b>{when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</b>
                    <i>{when.getFullYear()}</i>
                  </>
                ) : <b className="dim">unpublished</b>}
              </div>
              <div className="tl-rail"><span /></div>
              <button className="tl-body" onClick={() => go(`/p/${p.id}/${landingTab(state, p.id)}`)}>
                <div className="row" style={{ alignItems: 'flex-start', gap: 10 }}>
                  <div className="grow">
                    <b>{p.name}</b>
                    <span className="tl-meta">
                      {regionOf(p.region).short} · {p.weeks} weeks · {money(inv.total, p.region)}
                      {p.chat?.id ? ` · chat v${p.chat.version}` : ' · no chat linked'}
                    </span>
                  </div>
                  <Chip tone={st.tone}>{st.t}</Chip>
                  {p.locked && <Chip tone="draft">read only</Chip>}
                </div>
                {isServing && (
                  <span className="tl-serving">
                    <Icon name="check" size={11} /> the consumer app is serving this one
                  </span>
                )}
              </button>
              {p.locked && (
                <button className="btn btn-ghost btn-sm tl-act" onClick={() => onCopy(p)}>
                  <Icon name="layers" size={12} /> Duplicate
                </button>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ── MAKING ONE ── */
function Create({ goal, state, onCancel, onCreate }) {
  const g = goalOf(goal);
  const chats = chatsForGoal(state, goal);
  const [name, setName] = useState(g ? g.t.replace(' and ', ' & ') : 'New protocol');
  const [region, setRegion] = useState('uae');
  const [weeks, setWeeks] = useState(12);
  const [chatId, setChatId] = useState(chats[0]?.id || '');
  const vs = chatVersions(state, chatId);
  const [ver, setVer] = useState(vs[0]?.version || 0);
  const ready = String(name).trim() && weeks > 0;

  return (
    <>
      <button className="crumb" onClick={onCancel}>
        <Icon name="back" size={12} /> {g?.t || 'Protocols'}
      </button>

      <div className="row" style={{ margin: '10px 0 16px' }}>
        <div className="grow">
          <h2>A new version of {g?.t || goal}</h2>
          <p className="sub">
            Then the steps, then the package — which prices itself from the steps.
          </p>
        </div>
      </div>

      <div className="card card-pad" style={{ display: 'grid', gap: 14, maxWidth: 620 }}>
        <Field label="Name" value={name} onChange={setName}
          hint="What staff call this version in the list. The patient reads the PDP title, set in the package." />
        <div className="grid-2">
          <Field label="Where it is sold" type="select" value={region} onChange={setRegion}
            options={REGIONS.map((r) => r.id)}
            display={Object.fromEntries(REGIONS.map((r) => [r.id, `${r.t} · ${r.ccy}`]))}
            hint="Decides which catalogue the steps can draw from, and at what prices." />
          <Field label="How long it runs (weeks)" type="number" value={weeks}
            onChange={(v) => setWeeks(Math.max(1, v || 1))}
            hint="Every step's week is set against this." />
        </div>

        {chats.length ? (
          <div className="grid-2">
            <Field label="Goal chat" type="select" value={chatId}
              onChange={(v) => { setChatId(v); setVer(chatVersions(state, v)[0]?.version || 0); }}
              options={chats.map((c) => c.id)}
              display={Object.fromEntries(chats.map((c) => [c.id, c.name]))}
              hint="The questions asked before the price. Owned by the product team." />
            <Field label="Which version" type="select" value={String(ver)}
              onChange={(v) => setVer(Number(v))}
              options={vs.map((v) => String(v.version))}
              display={Object.fromEntries(vs.map((v) => [String(v.version),
                `v${v.version} · ${new Date(v.at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`]))}
              hint="Pinned. Publishing a newer chat version will not change this protocol." />
          </div>
        ) : (
          <Note tone="gold" label="This goal has no published chat">
            <p style={{ margin: 0 }}>
              Build one in the Chat Builder first, or this protocol will send patients
              from the goal picker straight to the price with nothing asked.
            </p>
          </Note>
        )}

        <div className="row" style={{ gap: 8 }}>
          <button className="btn btn-gold" disabled={!ready}
            onClick={() => onCreate({ name: String(name).trim(), goal, region, weeks,
              chat: chatId ? { id: chatId, version: ver } : undefined })}>
            <Icon name="plus" size={13} /> Create it and open the steps
          </button>
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </>
  );
}

export default function Protocols({ parts = [] }) {
  const { state, createProtocol, duplicateProtocol } = useStudio();
  const list = state.protocols || [];

  /* Which version each goal and region pair is actually serving. */
  const servingIds = new Set(Object.values(list.reduce((acc, p) => {
    const k = `${p.goal}/${p.region}`;
    const at = state.published?.[p.id]?.plan?.at;
    if (!at) return acc;
    if (!acc[k] || at > (state.published?.[acc[k]]?.plan?.at || '')) acc[k] = p.id;
    return acc;
  }, {})));

  const goalId = parts[1];
  const creating = parts[2] === 'new';
  const versions = goalId
    ? list.filter((p) => p.goal === goalId).slice().reverse()
    : [];
  const serving = versions.find((p) => servingIds.has(p.id)) || null;

  if (goalId && creating) {
    return (
      <Create goal={goalId} state={state} onCancel={() => go(`/protocols/${goalId}`)}
        onCreate={(meta) => { const id = createProtocol(meta); go(`/p/${id}/steps`); }} />
    );
  }
  if (goalId && versions.length) {
    return (
      <GoalTimeline goal={goalId} versions={versions} serving={serving} state={state}
        onCopy={(p) => { const id = duplicateProtocol(p.id); if (id) go(`/p/${id}/steps`); }} />
    );
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="grow">
          <h2>Protocol Builder</h2>
          <p className="sub">
            One row per goal. Open one to see every version built for it, when each was
            published, and which one the consumer app is serving.
          </p>
        </div>
      </div>

      <div className="plist">
        {GOALS.map((g) => {
          const vs = list.filter((p) => p.goal === g.id);
          return (
            <GoalRow key={g.id} g={g} versions={vs} state={state}
              serving={vs.find((p) => servingIds.has(p.id)) || null}
              onOpen={() => go(`/protocols/${g.id}`)} />
          );
        })}
      </div>

      <p className="ofoot">
        Goals without a protocol are shown greyed rather than hidden — the product has
        more goals than this Studio has built out, and a list that hides them says
        otherwise.
      </p>
    </>
  );
}
