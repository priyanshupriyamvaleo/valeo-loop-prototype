import { Component } from 'react';
import '../p2/theme.css';
import Icon from '../p2/ui/Icon';
import { Note } from '../p2/ui/kit';
import { StudioProvider } from '../p2/lib/store';
import { useRoute, go } from '../p2/lib/router';
import Clinician from './Clinician';
import UserConsole from './UserConsole';

/*
 * THE COACH PANEL.
 *
 * A separate product from the Admin Panel, because it is a separate job done by
 * separate people on a separate login. The admin authors protocols; the coach
 * never does. Putting both behind one sidebar was the thing that made this
 * confusing: a category manager pricing a package and a doctor finishing a
 * consultation have nothing to say to each other, and a tool that shows you
 * both is a tool you have to filter in your head every time you open it.
 *
 * So: three products, one origin.
 *   /p1/  the consumer app
 *   /p2/  the Admin Panel, where a protocol is authored
 *   /p3/  this, where a coach reads and acts on one patient
 *
 * They still share localStorage, which is what makes a publish next door light
 * up here with no refresh.
 *
 * The sidebar is the real coach panel's own menu, because this has to look like
 * the screen a coach already opens every morning.
 */

const ORDERS_ITEMS = [
  { k: 'clinician', t: 'Past Orders', route: '/clinician' },
];
const CLIENT_ITEMS = [
  { k: 'user', t: 'User Console', route: '/user' },
];
/* Everything a coach really has, so the two that work read as part of a real
   panel rather than as a two-item tool. */
const REST = [
  { k: 'clients', t: 'Clients', ic: 'users' },
  { k: 'skincare', t: 'Skincare Survey', ic: 'heart' },
  { k: 'tags', t: 'Tags', ic: 'tag' },
  { k: 'surveys', t: 'Surveys', ic: 'clipboard' },
  { k: 'slots', t: 'Availability Slots', ic: 'route' },
  { k: 'messages', t: 'Messages', ic: 'chat' },
  { k: 'longevity', t: 'Customer Longevity Score', ic: 'activity' },
  { k: 'resources', t: 'Additional Resources', ic: 'box' },
  { k: 'wearables', t: 'Wearables Tracker', ic: 'spark' },
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
  const view = parts[0] === 'user' ? 'user' : 'clinician';

  const Dead = ({ item }) => (
    <button className="nav-item"
      onClick={() => window.alert(`${item.t} is not part of this prototype.`)}>
      <Icon name={item.ic} size={15} />
      <span>{item.t}</span>
    </button>
  );

  return (
    <div className="app">
      <aside className="side">
        <div className="side-head">
          <div className="brand-mark coach">V</div>
          <div>
            <div className="brand">Valeo Coach</div>
            <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)' }}>Coach panel</div>
          </div>
        </div>
        <div className="side-scroll">
          <button className="nav-item"><Icon name="home" size={15} /><span>Home</span></button>
          <div className="side-label">Modules</div>
          <Dead item={REST[0]} />
          <button className="nav-item on"><Icon name="cart" size={15} /><span>Order Management</span></button>
          <div style={{ margin: '4px 0 8px' }}>
            {[...ORDERS_ITEMS, ...CLIENT_ITEMS].map((e) => (
              <button key={e.k} className={`nav-child ${view === e.k ? 'on' : ''}`}
                onClick={() => go(e.route)}>{e.t}</button>
            ))}
          </div>
          {REST.slice(1).map((m) => <Dead key={m.k} item={m} />)}
        </div>
      </aside>

      <div className="page">
        <div className="topbar">
          <div className="tbar-crumb">
            <Icon name="cart" size={13} />
            <span>Order Management</span>
            <Icon name="chev" size={10} />
            <b>{view === 'user' ? 'User Console' : 'Past Orders'}</b>
          </div>
          <div className="grow" />
          <div className="whoami">
            <span className="who-av">DC</span>
            <div>
              <b>Durga Coach</b>
              <i>Wellbeing coach</i>
            </div>
          </div>
        </div>

        <div className="page-in">
          <Boundary key={parts.join('/')}>
            {view === 'user' ? <UserConsole /> : <Clinician parts={parts} />}
          </Boundary>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <StudioProvider><Shell /></StudioProvider>;
}
