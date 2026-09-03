import Icon from '../ui/Icon';
import { Chip, Note } from '../ui/kit';
import { useStudio, pubState } from '../lib/store';
import { GOALS, goalOf, chatsOf, chatVersions } from '../../shared/bus';
import { go } from '../lib/router';

/*
 * THE CHAT BUILDER — everything that happens before anybody is sold anything.
 *
 * Two chats, and neither of them belongs to a protocol. The onboarding chat
 * decides which goal somebody is in, so it is edited once for the whole
 * product. A goal chat runs after that and before the price, and one goal chat
 * serves every protocol built for that goal — a protocol in Dubai and the same
 * protocol in Riyadh ask the same questions.
 *
 * They used to live inside a protocol, which meant three protocols for one goal
 * held three copies of one conversation and the product team had nowhere to own
 * them. They are here now, and a protocol LINKS to one.
 *
 * ── WHY VERSIONS ARE KEPT ──
 * A protocol points at a chat VERSION, not at a chat. Publish a new version and
 * nothing live changes until somebody points a protocol at it. That is the only
 * way a chat can be edited freely while protocols are running on it.
 */

function VersionRow({ v, used }) {
  const d = new Date(v.at);
  const when = Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB',
    { day: 'numeric', month: 'short', year: 'numeric' });
  return (
    <div className="vrow">
      <span className="vrow-when">{when}</span>
      <span className="vrow-dot" />
      <span className="vrow-main">
        <b>Version {v.version}</b>
        <i>{(v.data?.questions || []).length} questions · {(v.data?.intro || '').slice(0, 58)}…</i>
      </span>
      {used > 0
        ? <Chip tone="live">{used} protocol{used === 1 ? '' : 's'} on it</Chip>
        : <Chip tone="draft">not linked</Chip>}
    </div>
  );
}

function ChatCard({ chat, state, onOpen }) {
  const ps = pubState(state, chat.id, 'triage');
  const vs = chatVersions(state, chat.id);
  const g = goalOf(chat.goal);
  const usage = (v) => (state.protocols || [])
    .filter((p) => p.chat?.id === chat.id && p.chat?.version === v.version).length;

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <button className="chat-head" onClick={onOpen}>
        <span className="prow-ic"><Icon name={g?.ic || 'chat'} size={16} /></span>
        <span className="prow-main">
          <b>{chat.name}</b>
          <i>{g ? g.t : chat.goal} · {vs.length} published version{vs.length === 1 ? '' : 's'}</i>
        </span>
        <Chip tone={ps.live ? (ps.dirty ? 'ed' : 'live') : 'draft'}>
          {ps.live ? (ps.dirty ? `v${ps.version} · edits since` : `v${ps.version} live`) : 'draft'}
        </Chip>
        <Icon name="chev" size={14} className="prow-go" />
      </button>
      {vs.length > 0 && (
        <div className="vlist">
          {vs.map((v) => <VersionRow key={v.version} v={v} used={usage(v)} />)}
        </div>
      )}
    </div>
  );
}

export default function Chats({ parts = [] }) {
  const { state } = useStudio();
  const chats = chatsOf(state);
  const onb = pubState(state, 'shared', 'onboarding');
  const unbuilt = GOALS.filter((g) => !chats.some((c) => c.goal === g.id));

  return (
    <>
      <div className="row" style={{ marginBottom: 16 }}>
        <div className="grow">
          <h2>Chat Builder</h2>
          <p className="sub">
            Everything a patient answers before a price is shown. Owned by the product
            team, not by a protocol — a protocol links to a published version of a goal
            chat.
          </p>
        </div>
      </div>

      {/* ── The one chat that belongs to no goal ── */}
      <div className="card" style={{ marginBottom: 22 }}>
        <button className="chat-head" onClick={() => go('/chats/onboarding')}>
          <span className="prow-ic"><Icon name="chat" size={16} /></span>
          <span className="prow-main">
            <b>Onboarding chat</b>
            <i>Shared by every goal · the conversation that decides which goal somebody is in</i>
          </span>
          <Chip tone={onb.live ? (onb.dirty ? 'ed' : 'live') : 'draft'}>
            {onb.live ? (onb.dirty ? `v${onb.version} · edits since` : `v${onb.version} live`) : 'draft'}
          </Chip>
          <Icon name="chev" size={14} className="prow-go" />
        </button>
      </div>

      <div className="row" style={{ marginBottom: 10 }}>
        <h3 className="grow" style={{ marginTop: 0 }}>Goal chats</h3>
        <span className="hint">One per goal. Every protocol for that goal links to a version of it.</span>
      </div>

      {chats.map((c) => (
        <ChatCard key={c.id} chat={c} state={state} onOpen={() => go(`/chats/g/${c.id}`)} />
      ))}

      {unbuilt.length > 0 && (
        <Note label="Goals with no chat of their own yet">
          <p style={{ margin: 0 }}>
            {unbuilt.map((g) => g.t).join(', ')}. A protocol for one of these has nothing to
            link to, so its patients go from the goal picker straight to the price.
          </p>
        </Note>
      )}
    </>
  );
}
