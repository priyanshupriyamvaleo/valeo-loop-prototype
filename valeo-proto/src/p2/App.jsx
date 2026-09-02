import { Component, useState } from 'react';
import './theme.css';
import Icon from './ui/Icon';
import { Chip, Note, Field } from './ui/kit';
import { StudioProvider, useStudio, pubState, publishBlockers, landingTab } from './lib/store';
import { REGIONS, regionOf, goalOf, SHARED } from '../shared/bus';
import { useRoute, go } from './lib/router';
import ChatBuilder from './builders/ChatBuilder';
import PrePurchase from './builders/PrePurchase';
import ProtocolBuilder from './builders/ProtocolBuilder';
import Protocols from './builders/Protocols';

/*
 * THE ADMIN PANEL — where a protocol is authored.
 *
 * One of three products on this origin, and the only one that writes a
 * template. The consumer app reads what is published here; the coach panel
 * reads one patient against it. Neither of them authors anything, which is why
 * they are separate logins and separate screens rather than three jobs behind
 * one sidebar.
 *
 * The sidebar is the real admin panel's own sections, because Protocols has to
 * look like it belongs among them rather than like a separate tool bolted on.
 * Only Protocols opens; the rest say so honestly, which beats a dead link.
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

/*
 * ── WHAT SITS UNDER PROTOCOLS ──
 * Two kinds of thing, and conflating them was the old sidebar's mistake.
 *
 * PROTOCOLS are made, several of them, each with a package and a plan. They are
 * reached through the list, not through a dropdown of three fixed goals.
 *
 * The other three belong to no protocol. The onboarding chat is the
 * conversation that decides which goal you are in, so it is edited once for the
 * whole product. The two consoles are about a patient, and a patient is on one
 * protocol already.
 */
export const ENTRIES = [
  /* The chat comes first because the patient meets it first: it is the
     conversation that decides which goal, and therefore which protocol, they
     are even in. */
  { k: 'onboarding', t: 'Onboarding Chat Builder', route: '/onboarding' },
  { k: 'protocols',  t: 'Protocols',               route: '/protocols' },
];

/* Inside one protocol, in the order the PATIENT meets them. The triage runs
   before the price is ever shown, so it is step one and it sits on the left. */
export const TABS = [
  { k: 'triage',  t: 'Triage chat', part: 'triage', n: 1,
    short: 'the questions asked before the price' },
  { k: 'package', t: 'Package',     part: 'prepurchase', n: 2,
    short: 'the package, its price and the cart' },
  { k: 'plan',    t: 'Protocol',    part: 'plan', n: 3,
    short: 'the after-purchase plan' },
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

/* ── WHERE AM I ──
   One route, read once. Two shapes:
     /protocols[/new] · /onboarding · /clinician[/order[/journey]] · /user
     /p/<protocolId>/<package|plan|triage>
*/
function readRoute(parts, protocols) {
  if (parts[0] === 'p' && parts[1]) {
    const proto = protocols.find((x) => x.id === parts[1]) || null;
    const tab = TABS.find((t) => t.k === parts[2]) || TABS[0];
    return { view: 'protocol', proto, tab, scope: proto?.id || null, part: tab.part };
  }
  const k = ENTRIES.find((e) => e.k === parts[0])?.k || 'protocols';
  if (k === 'onboarding') return { view: 'onboarding', scope: SHARED, part: 'onboarding' };
  return { view: 'protocols', scope: null, part: null };
}

function Shell() {
  const parts = useRoute();
  const { state, publish, reset, patchProtocol, duplicateProtocol } = useStudio();
  const protocols = state.protocols || [];
  const r = readRoute(parts, protocols);

  /* Which sidebar entry is lit. A protocol is reached through the list, so being
     inside one still lights Protocols. */
  const entryKey = r.view === 'protocol' ? 'protocols' : r.view === 'protocols' ? 'protocols' : r.view;

  /* ── WHAT, IF ANYTHING, THIS SCREEN PUBLISHES ──
     The list, the creation form and the two consoles author nothing, so the bar
     stays off them rather than sitting there disabled. */
  /* A locked protocol is already selling and is read only, so nothing about it
     publishes. Duplicate it and the copy does. */
  const publishes = (r.view === 'protocol' && r.proto && !r.proto.locked)
    || r.view === 'onboarding';
  const ps = publishes ? pubState(state, r.scope, r.part)
    : { live: false, dirty: false, version: 0 };
  const blockers = publishes ? publishBlockers(state, r.scope, r.part) : [];

  const NavItem = ({ item }) => (
    <button className={`nav-item ${item.open ? 'on' : ''}`}
      onClick={() => { if (!item.open) window.alert(`${item.t} is not part of this prototype.`); }}>
      <Icon name={item.ic} size={15} />
      <span>{item.t}</span>
    </button>
  );

  /* ── THE PROTOCOL HEADER ──
     Name, region and length, pinned once above the two builders. Everything
     inside is scoped to it, and nothing inside repeats it. */
  const ProtocolHead = () => {
    const p = r.proto;
    const [open, setOpen] = useState(false);
    if (!p) return null;
    const locked = !!p.locked;
    return (
      <div className="phead">
        <button className="crumb" onClick={() => go('/protocols')}>
          <Icon name="back" size={12} /> Protocols
        </button>
        <div className="row" style={{ margin: '10px 0 0', alignItems: 'flex-start' }}>
          <div className="grow">
            <h1>{p.name}</h1>
            <p className="sub">{goalOf(p.goal)?.t} · {p.weeks} weeks</p>
          </div>
          {/* The scope, stated once. Everything below is this region's
              catalogue at this region's prices. */}
          <button className={`scopebtn ${open ? 'on' : ''} ${locked ? 'ro' : ''}`}
            onClick={() => !locked && setOpen(!open)} disabled={locked}>
            <Icon name="globe" size={13} />
            <b>{regionOf(p.region).short}</b>
            <span>{regionOf(p.region).ccy}</span>
            {!locked && <Icon name="chev" size={11} className="sbx" />}
          </button>
          {locked && (
            <button className="btn btn-gold btn-sm" onClick={() => {
              const id = duplicateProtocol(p.id);
              if (id) go(`/p/${id}/triage`);
            }}>
              <Icon name="layers" size={12} /> Duplicate to edit
            </button>
          )}
        </div>

        {/* ── WHY IT WILL NOT LET YOU TYPE ──
            Patients are on this one. Editing it in place would change what they
            are already reading, so the only action on it is to take a copy. */}
        {locked && (
          <div className="lockbar">
            <Icon name="lock" size={14} />
            <div className="grow">
              <b>Read only. Patients are on this protocol.</b>
              <span>
                It is what the consumer app is serving right now. Duplicate it, change
                the copy, and publish the copy — that is how a live protocol is edited.
              </span>
            </div>
          </div>
        )}

        {open && !locked && (
          <div className="card card-pad scopepanel">
            <div className="grid-2" style={{ gap: 16 }}>
              <Field label="Where it is sold" type="select" value={p.region}
                onChange={(v) => patchProtocol(p.id, (x) => { x.region = v; })}
                options={REGIONS.map((x) => x.id)}
                display={Object.fromEntries(REGIONS.map((x) => [x.id, `${x.t} · ${x.ccy}`]))}
                hint="Changing it re-prices the package from the other country's catalogue. A line pointing at something that country does not sell says so." />
              <Field label="How long it runs (weeks)" type="number" value={p.weeks}
                onChange={(v) => patchProtocol(p.id, (x) => { x.weeks = Math.max(1, v || 1); })}
                hint="Published with the plan. Every step's week is set against it." />
            </div>
            <Field label="Name" value={p.name}
              onChange={(v) => patchProtocol(p.id, (x) => { x.name = v; })}
              hint="Staff-facing. The patient reads the PDP title, in the package." />
          </div>
        )}

        <div className="ptabs">
          {TABS.map((t) => {
            const st = pubState(state, p.id, t.part);
            return (
              <button key={t.k} className={`ptab ${r.tab.k === t.k ? 'on' : ''}`}
                onClick={() => go(`/p/${p.id}/${t.k}`)}>
                <i className="ptab-n">{t.n}</i>
                <span>{t.t}</span>
                <Chip tone={st.live ? (st.dirty ? 'ed' : 'live') : 'draft'}>
                  {st.live ? (st.dirty ? `v${st.version} · edited` : `v${st.version}`) : 'draft'}
                </Chip>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  let body = null;
  if (r.view === 'protocols') body = <Protocols parts={parts} />;
  else if (r.view === 'onboarding') body = <ChatBuilder scope={SHARED} tab="onboarding" />;
  else if (r.view === 'protocol') {
    const ro = !!r.proto?.locked;
    if (!r.proto) body = <div className="card card-pad empty">That protocol no longer exists.</div>;
    else if (r.tab.k === 'package') body = <PrePurchase scope={r.scope} protocol={r.proto} readOnly={ro} />;
    else if (r.tab.k === 'plan') body = <ProtocolBuilder scope={r.scope} protocol={r.proto} readOnly={ro} />;
    else body = <ChatBuilder scope={r.scope} tab="triage" protocol={r.proto} readOnly={ro} />;
  }

  return (
    <div className="app">
      <aside className="side">
        <div className="side-head">
          <div className="brand-mark">V</div>
          <div>
            <div className="brand">Valeo Admin</div>
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
                  {ENTRIES.map((e) => (
                    <div key={e.k}>
                      <button className={`nav-child ${entryKey === e.k ? 'on' : ''}`}
                        onClick={() => go(e.route)}>{e.t}</button>
                      {/* The protocols themselves, one level down, because a
                          list you have to open to see what exists is a list
                          nobody navigates by. */}
                      {e.k === 'protocols' && (
                        <div style={{ margin: '2px 0 6px' }}>
                          {protocols.map((p) => (
                            <button key={p.id}
                              className={`nav-grand ${r.proto?.id === p.id ? 'on' : ''}`}
                              onClick={() => go(`/p/${p.id}/${landingTab(state, p.id)}`)}>
                              {p.name} <em>{regionOf(p.region).short}</em>
                            </button>
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
          <div className="tbar-crumb">
            <Icon name="clipboard" size={13} />
            <span>Protocols</span>
            <Icon name="chev" size={10} />
            <b>{r.view === 'protocol' ? r.proto?.name || 'Unknown'
              : ENTRIES.find((e) => e.k === entryKey)?.t}</b>
          </div>
          <div className="grow" />
          {publishes && (
            <Chip tone={ps.live ? (ps.dirty ? 'ed' : 'live') : 'draft'}>
              {ps.live ? (ps.dirty ? `v${ps.version} live · edited` : `v${ps.version} live`) : 'draft'}
            </Chip>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => {
            if (window.confirm('Reset the Studio and the patient app to a clean demo?')) reset();
          }}>Reset demo</button>
        </div>

        <div className="page-in">
          {r.view === 'protocol' && <ProtocolHead />}
          {r.view === 'onboarding' && (
            <div style={{ marginBottom: 18 }}>
              <h1>Onboarding chat</h1>
              <p className="sub">
                Shared by every protocol. It is the conversation that decides which goal
                somebody is in, so it is edited once for the whole product.
              </p>
            </div>
          )}
          <Boundary key={parts.join('/')}>{body}</Boundary>
        </div>

        {publishes && (
          <div className="pubbar">
            <div className="grow">
              <div className="pub-state">
                {blockers.length > 0
                  ? `Publishing is blocked. ${blockers.length === 1 ? blockers[0].what : `${blockers.length} things are missing`}.`
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
            {(
              <button className="btn btn-gold" disabled={blockers.length > 0}
                onClick={() => {
                  publish(r.scope, r.part);
                  /* Publishing the package is the end of step one, so it hands
                     you step two rather than leaving you on a screen you have
                     finished with. */
                  /* Publishing one step hands you the next, rather than
                     leaving you on a screen you have finished with. */
                  const i = TABS.findIndex((t) => t.k === r.tab.k);
                  const next = TABS[i + 1];
                  if (r.view === 'protocol' && next
                      && !state.published?.[r.proto.id]?.[next.part]) {
                    go(`/p/${r.proto.id}/${next.k}`);
                  }
                }}>
                <Icon name="send" size={14} /> Publish{' '}
                {r.view === 'onboarding' ? 'the onboarding chat' : r.tab.short}
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
