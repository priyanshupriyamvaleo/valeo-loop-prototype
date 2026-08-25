import Icon from '../ui/Icon';
import { WL_ENTRIES } from '../lib/journey';

/*
 * HOME — one rule, from the Current and Discover spec.
 *
 * "Home is in one of two states, never both. If the user is inside a journey,
 * home IS that journey. If they are not, home is Discover."
 *
 * So there is no branch here that renders a journey card AND a goal picker.
 * The offers banner and the services grid belong to Discover, which is the
 * open decision the spec flags: an active user stops seeing them.
 */

const SERVICES = [
  { ic: 'flask', t: 'Blood Test' }, { ic: 'scale', t: 'Weight Loss' }, { ic: 'flask', t: 'IV Therapy' },
  { ic: 'bolt', t: 'Peptide Therapy' }, { ic: 'box', t: 'Supplements' }, { ic: 'spark', t: 'Hair Growth' },
];

function Chrome({ children }) {
  return (
    <>
      <div className="appbar">
        <div className="search"><Icon name="eye" size={15} /><span>Search &lsquo;Blood test&rsquo;</span></div>
        <Icon name="panel" size={18} />
      </div>
      <div className="greet">Hi <b>Ahmad,</b> Welcome back</div>
      {children}
    </>
  );
}

/* ── weight loss: the card that already ships ── */
function WeightLoss({ entry, onChat }) {
  const mods = WL_ENTRIES[entry].mods;
  return (
    <div className="jcard">
      <div className="hd">
        <b>Weight Loss</b>
        <button className="chatpill" onClick={onChat}><Icon name="chat" size={11} /> Chat with Doctor</button>
      </div>

      {mods.includes('prescription') && (
        <div className="mod">
          <div className="lbl">Your Prescription (Rx)</div>
          <div className="rowline">
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--gold-soft)' }} />
            <div className="grow" style={{ flex: 1 }}>
              <div className="big">Mounjaro 5mg</div>
              <div className="sm">AED 1,745 · One shot, weekly, 1 month</div>
            </div>
          </div>
          <div className="rowline" style={{ marginTop: 10 }}>
            <div className="sm" style={{ flex: 1 }}>This Rx contains<br /><b>3 items</b></div>
            <button className="btn-dark">View Rx <Icon name="chev" size={12} /></button>
          </div>
        </div>
      )}

      {mods.includes('blood_test_report') && (
        <div className="mod">
          <div className="rowline">
            <div style={{ flex: 1 }}>
              <div className="lbl" style={{ marginBottom: 2 }}>Weight loss blood test</div>
              <div className="sm">Report 22 Jul 2024</div>
            </div>
            <button className="btn-dark">View Report <Icon name="chev" size={12} /></button>
          </div>
          <div className="rowline" style={{ marginTop: 10, gap: 14 }}>
            <div className="sm"><b style={{ color: 'var(--red)' }}>02</b> Out of Range</div>
            <div className="sm"><b>18</b> Normal</div>
          </div>
        </div>
      )}

      {mods.includes('follow_up_call') && (
        <div className="mod">
          <div className="lbl">General Follow up call</div>
          <div className="rowline">
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--gold-soft)' }} />
            <div style={{ flex: 1 }}>
              <div className="big" style={{ fontSize: 13.5 }}>Dr. Fizza Ali</div>
              <div className="sm">General physician · AED 150</div>
            </div>
            <button className="btn-dark">Book Now</button>
          </div>
        </div>
      )}

      {mods.includes('tracker') && (
        <div className="mod">
          <div className="rowline" style={{ marginBottom: 4 }}>
            <div className="sm" style={{ flex: 1 }}>Started <b style={{ fontSize: 14 }}>86</b> Kg</div>
            <div className="sm" style={{ color: 'var(--green)', fontWeight: 700 }}>3 kg lost</div>
            <div className="sm">Goal <b style={{ fontSize: 14 }}>72</b> Kg</div>
          </div>
          <div className="pbar"><i style={{ width: '22%' }} /></div>
          <div className="rowline" style={{ marginTop: 8 }}>
            <div className="sm" style={{ flex: 1 }}><b>21</b> BMI
              <span style={{ marginLeft: 6, color: 'var(--green)' }}>Healthy</span></div>
          </div>
          <div className="rowline" style={{ marginTop: 10 }}>
            <div style={{ flex: 1 }}>
              <div className="big" style={{ color: 'var(--green)' }}>4.5 Kg</div>
              <div className="sm">More to go</div>
            </div>
            <button className="btn-dark">Log Progress <Icon name="chev" size={12} /></button>
          </div>
        </div>
      )}

      <div className="dots">{mods.map((m, i) => <i key={m} className={i === 0 ? 'on' : ''} />)}</div>
    </div>
  );
}

/* ── discover: the only state in which a journey can be started ── */
function Discover({ goals, onPick }) {
  return (
    <>
      <div className="hero">
        <div className="k">Start here</div>
        <h2>What are you here for?</h2>
        <p>One question. Your answer decides everything that follows, and nothing else on
          this screen changes until you pick.</p>
        {goals.map((g) => (
          <button className="goalrow" key={g.id} onClick={() => onPick(g.id)} style={{ width: '100%' }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,201,60,.18)',
                          display: 'grid', placeItems: 'center', color: 'var(--gold)', flex: 'none' }}>
              <Icon name={g.ic} size={16} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <b>{g.t}</b><span>{g.sub}</span>
            </div>
            <Icon name="chev" size={15} />
          </button>
        ))}
      </div>

      <div className="banner">
        <b>Celebrate with a burst<br />of <em>vibrant health</em></b>
        <span>Test 49 essential biomarkers · General Well-being Blood Test</span>
      </div>

      <div className="sectlbl">Healthcare Services at Your Doorstep</div>
      <div className="grid3">
        {SERVICES.map((s) => (
          <div className="svc" key={s.t}>
            <div className="ic"><Icon name={s.ic} size={17} /></div>
            <span>{s.t}</span>
          </div>
        ))}
      </div>
      <div style={{ height: 16 }} />
    </>
  );
}

export default function Home({ mode, wlEntry, goals, onPick, onChat, protocolCard }) {
  return (
    <div className="scroll">
      <Chrome>
        {mode === 'wl' && <WeightLoss entry={wlEntry} onChat={onChat} />}
        {mode === 'protocol' && protocolCard}
        {mode === 'none' && <Discover goals={goals} onPick={onPick} />}
      </Chrome>
    </div>
  );
}
