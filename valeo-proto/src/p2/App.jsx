import { Component } from 'react';
import './theme.css';
import Icon from './ui/Icon';
import { Chip, Note } from './ui/kit';
import { StudioProvider, useStudio, pubState, publishBlockers } from './lib/store';
import { GOALS, goalOf, SHARED } from '../shared/bus';
import { useRoute, go } from './lib/router';
import ChatBuilder from './builders/ChatBuilder';
import PrePurchase from './builders/PrePurchase';
import ProtocolBuilder from './builders/ProtocolBuilder';
import Clinician from './builders/Clinician';

/*
 * VALEO STUDIO — where a protocol is authored.
 *
 * The sidebar is the real admin panel's own sections, because Protocols has to
 * look like it belongs among them rather than like a separate tool bolted on.
 * Only Protocols opens; the rest say so honestly, which beats a dead link.
 *
 * Two controls decide everything: which GOAL you are authoring, and which
 * SURFACE of it. Everything below them is one of four builders.
 */

const MODULES = [
  { k: 'users', t: 'User Management', ic: 'users' },
  { k: 'orders', t: 'Order Management', ic: 'cart' },
  { k: 'protocols', t: 'Protocols', ic: 'clipboard', open: true },
  { k: 'surveys', t: 'Surveys', ic: 'heart' },
  { k: 'services', t: 'Services', ic: 'box' },
  { k: 'packages', t: 'Package Management', ic: 'layers' },
  { k: 'labs', t: 'Lab Management', ic: 'flask' },
  { k: 'coaches', t: 'Coach Management', ic: 'steth' },
  { k: 'journeys', t: 'Journeys', ic: 'route' },
];
const OPS = [
  { k: 'homecare', t: 'Home Care Portal', ic: 'truck' },
  { k: 'nurse', t: 'Nurse Portal', ic: 'steth' },
  { k: 'tickets', t: 'Ticketing', ic: 'chat' },
];
const ADMIN = [
  { k: 'acl', t: 'Access Control', ic: 'lock' },
  { k: 'settings', t: 'Application Settings', ic: 'gear' },
];

/* The four authoring surfaces, in the order the patient meets them. */
export const SURFACES = [
  { k: 'chat', t: 'Onboarding Chat Builder', part: 'triage', short: 'Triage chat' },
  /* The chat surface holds two publishable chats. Which one is open is the
     third segment of the route, so the publish bar below can target the right
     one and a reload lands back on the same tab. */
  { k: 'prepurchase', t: 'Pre-purchase Builder', part: 'prepurchase', short: 'PDP, cart, confirmation' },
  { k: 'protocol', t: 'Protocol Builder', part: 'plan', short: 'The after-purchase plan' },
  { k: 'clinician', t: 'Clinician Console', part: 'consult', short: 'Consult outcome' },
];

class Boundary extends Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div className="page-in">
        <Note tone="red" label="This screen hit an error">
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{String(this.state.err)}</pre>
        </Note>
      </div>
    );
  }
}

function Shell() {
  const parts = useRoute();
  const { state, publish, reset } = useStudio();

  const goalId = GOALS.some((g) => g.id === parts[0]) ? parts[0] : 'recover-rebuild';
  const surfaceKey = SURFACES.some((s) => s.k === parts[1]) ? parts[1] : 'chat';
  const goal = goalOf(goalId);
  const surface = SURFACES.find((s) => s.k === surfaceKey);
  const chatTab = parts[2] === 'triage' ? 'triage' : 'onboarding';
  /* The onboarding chat belongs to no goal, so publishing it targets SHARED
     rather than whichever goal happens to be selected in the dropdown. */
  const sharedChat = surfaceKey === 'chat' && chatTab === 'onboarding';
  const pubScope = sharedChat ? SHARED : goalId;
  const pubPart = sharedChat ? 'onboarding' : surface.part;
  const pubShort = sharedChat ? 'onboarding chat' : surface.short.toLowerCase();

  const isConsult = surfaceKey === 'clinician';
  const ps = isConsult
    ? { live: !!state.consult, dirty: false, version: state.consult?.version || 0 }
    : pubState(state, pubScope, pubPart);
  /* The refusals, computed every render so the button turns on the moment the
     missing thing is typed in. */
  const blockers = (sharedChat || goal.built) && !isConsult ? publishBlockers(state, pubScope, pubPart) : [];

  const Body = { chat: ChatBuilder, prepurchase: PrePurchase,
                 protocol: ProtocolBuilder, clinician: Clinician }[surfaceKey];

  const NavItem = ({ item }) => (
    <button className={`nav-item ${item.open ? 'on' : ''}`}
      onClick={() => { if (!item.open) window.alert(`${item.t} is not part of this prototype.`); }}>
      <Icon name={item.ic} size={15} />
      <span>{item.t}</span>
    </button>
  );

  return (
    <div className="app">
      <aside className="side">
        <div className="side-head">
          <div className="brand-mark">V</div>
          <div>
            <div className="brand">Valeo Studio</div>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)' }}>Admin panel</div>
          </div>
        </div>
        <div className="side-scroll">
          <button className="nav-item"><Icon name="home" size={15} /><span>Home</span></button>
          <div className="side-label">Modules</div>
          {MODULES.map((m) => (
            <div key={m.k}>
              <NavItem item={m} />
              {m.open && (
                <div style={{ margin: '4px 0 8px' }}>
                  {SURFACES.map((s) => (
                    <div key={s.k}>
                      <button className={`nav-child ${surfaceKey === s.k ? 'on' : ''}`}
                        onClick={() => go(`/${goalId}/${s.k}`)}>{s.t}</button>
                      {/* The chat builder holds two chats, so it is the one
                          surface with a level below it in the sidebar. */}
                      {s.k === 'chat' && surfaceKey === 'chat' && (
                        <div style={{ margin: '2px 0 6px' }}>
                          {[['onboarding', 'Onboarding chat'], ['triage', 'Goal triage chat']].map(([k, t]) => (
                            <button key={k} className={`nav-grand ${chatTab === k ? 'on' : ''}`}
                              onClick={() => go(`/${goalId}/chat/${k}`)}>{t}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="side-label">Operations</div>
          {OPS.map((m) => <NavItem key={m.k} item={m} />)}
          <div className="side-label">Administration</div>
          {ADMIN.map((m) => <NavItem key={m.k} item={m} />)}
        </div>
      </aside>

      <div className="page">
        <div className="topbar">
          <div className="sel">
            <label>Goal</label>
            <select value={goalId} onChange={(e) => go(`/${e.target.value}/${surfaceKey}`)}>
              {GOALS.map((g) => <option key={g.id} value={g.id}>{g.t}</option>)}
            </select>
          </div>
          <div className="sel">
            <label>Surface</label>
            <select value={surfaceKey} onChange={(e) => go(`/${goalId}/${e.target.value}`)}>
              {SURFACES.map((s) => <option key={s.k} value={s.k}>{s.t}</option>)}
            </select>
          </div>
          <div className="grow" />
          <Chip tone={ps.live ? (ps.dirty ? 'ed' : 'live') : 'draft'}>
            {ps.live ? (ps.dirty ? `v${ps.version} live · edited` : `v${ps.version} live`) : 'draft'}
          </Chip>
          <button className="btn btn-ghost btn-sm" onClick={() => {
            if (window.confirm('Reset the Studio and the patient app to a clean demo?')) reset();
          }}>Reset demo</button>
        </div>

        <div className="page-in">
          <div style={{ marginBottom: 18 }}>
            <h1>{goal.t}</h1>
            <p className="sub">{sharedChat ? 'Shared by every goal · Onboarding chat' : `${goal.protocol} · ${surface.short}`}</p>
          </div>

          {!goal.built ? (
            <Note label={`${goal.t} is not built out in this prototype`}>
              <p style={{ margin: 0 }}>
                {goal.existing
                  ? 'Weight loss already runs in the app and this prototype documents it rather than rebuilding it. Its card, triggers and modules are shown on the patient side.'
                  : 'Skin and Hair has its own PDP and its own eleven-stage journey. The mechanics are identical to Recover and Rebuild, so it is present here as a real entry rather than authored twice.'}
                {' '}Switch the goal to <b>Recover and Rebuild</b> to author a protocol end to end.
              </p>
            </Note>
          ) : (
            <Boundary key={goalId + surfaceKey + chatTab}><Body goalId={goalId} tab={chatTab} /></Boundary>
          )}
        </div>

        {(sharedChat || goal.built) && (
          <div className="pubbar">
            <div className="grow">
              <div className="pub-state">
                {blockers.length > 0
                  ? `Publishing is blocked. ${blockers.length === 1 ? blockers[0].what : `${blockers.length} things are missing`}.`
                  : isConsult
                  ? (ps.live
                      ? 'Saved. The patient app has picked this up.'
                      : 'Nothing saved yet. The patient app is waiting on this consult.')
                  : ps.live
                    ? (ps.dirty
                        ? `Version ${ps.version} is live, and there are edits since. Publish again to send them.`
                        : `Version ${ps.version} is live. The patient app is reading it.`)
                    : 'Draft only. The patient app cannot see any of this until you publish.'}
              </div>
              {blockers.length > 0 && (
                <ul className="pub-blockers">
                  {blockers.map((b, i) => (
                    <li key={i}><b>{b.what}.</b> {b.why}</li>
                  ))}
                </ul>
              )}
            </div>
            {!isConsult && (
              <button className="btn btn-gold" disabled={blockers.length > 0}
                onClick={() => publish(pubScope, pubPart)}>
                <Icon name="send" size={14} /> Publish {pubShort}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return <StudioProvider><Shell /></StudioProvider>;
}
