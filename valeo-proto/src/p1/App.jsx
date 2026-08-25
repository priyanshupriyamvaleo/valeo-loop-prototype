import { useEffect, useRef, useState } from 'react';
import './theme.css';
import Icon from './ui/Icon';
import Home from './screens/Home';
import { Gate, Triage, PDP, Cart, Confirm } from './screens/Flow';
import { ProtocolCard, JourneyDetail } from './screens/Journey';
import { readStudio, readPatient, writePatient, subscribe, GOALS, goalOf, publishedFor, GATES } from '../shared/bus';
import { planFor, nextItem, gateOpen } from './lib/journey';

/*
 * VALEO — the patient app.
 *
 * Two things drive every screen here, and neither of them is hardcoded copy:
 * the demo state (which journey is active) and the Studio's published config.
 *
 * When the journey reaches something the Studio has not authored, the app
 * STOPS and says so. That is not a limitation of the prototype, it is the
 * demonstration: the flow is configuration, and without configuration there is
 * nothing to render. Publish next door and the waiting screen unlocks live.
 */

const RR = 'recover-rebuild';

const INIT = {
  mode: 'none',        /* none | wl | protocol */
  wlEntry: 'rx',
  stage: 'home',
  answers: null,
  done: [],
  consultSeen: 0,      /* the consult version this patient has already absorbed */
};

export default function App() {
  const [pt, setPt] = useState(() => readPatient(null) || INIT);
  /* Same reason as the Studio store: the write happens beside setState, not
     inside it, so React's development double-invoke cannot fire it twice. */
  const ptRef = useRef(pt);
  const [studio, setStudio] = useState(() => readStudio(null));
  /* ONE SOURCE OF TRUTH FOR WHERE THE PATIENT IS.
     This used to be a second useState beside the persisted state, and the two
     drifted: the UI advanced to the pre-purchase gate while storage still said
     triage. That is invisible until the demo does the thing it exists to do --
     leave this tab open, publish next door, come back -- at which point the
     cross-tab update re-reads storage and the patient snaps backwards. So the
     stage is persisted on every transition and read straight back out. */
  const screen = pt.stage || 'home';
  const setScreen = (next) => set({ stage: next });

  /* The other tab publishes; this one follows, with no refresh. */
  useEffect(() => subscribe(() => {
    setStudio(readStudio(null));
    /* Falling back to INIT rather than ignoring an empty read is what makes
       "Reset demo" in the Studio reach this tab. Keeping the old state on a
       cleared key left the phone mid-journey against a Studio that had just
       forgotten publishing any of it. */
    const p = readPatient(null) || { ...INIT };
    ptRef.current = p;
    setPt(p);
  }), []);

  const set = (patch) => {
    const prev = ptRef.current;
    const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch };
    ptRef.current = next;
    writePatient(next);
    setPt(next);
  };

  const goal = goalOf(RR);
  const triageCfg = publishedFor(studio, RR, 'triage');
  const ppCfg = publishedFor(studio, RR, 'prepurchase');
  const plan = planFor(studio, RR, pt);
  const item = nextItem(plan, pt.done);

  /* ── the consult gate ──
     Completing the doctor consultation stops the journey until the clinician
     records an outcome next door. Their added items then merge into the plan. */
  const consultDone = pt.done.includes('p4');
  const consultVersion = studio?.consult?.version || 0;
  /* Two different states used to share one flag, and absorbing the outcome
     therefore threw the patient straight back into waiting for it.
     PENDING is "the clinician has recorded nothing at all", which blocks.
     UNSEEN is "she has recorded something this patient has not read yet",
     which opens. Both route to the same gate; only one of them holds it shut,
     and a later consult raises the version and opens it again. */
  const consultPending = consultDone && consultVersion === 0;
  const consultUnseen = consultDone && consultVersion > (pt.consultSeen || 0);
  const awaitingConsult = consultPending || consultUnseen;

  const reset = () => { const f = { ...INIT }; ptRef.current = f; writePatient(f); setPt(f); };

  /* ── the demo rail ── */
  const gateRows = [
    ['triage', 'Triage chat', !!triageCfg],
    ['prepurchase', 'Pre-purchase flow', !!ppCfg],
    ['plan', 'Protocol plan', !!publishedFor(studio, RR, 'plan')],
    ['consult', 'Consult outcome', !!studio?.consult],
  ];

  const rail = (
    <div className="rail">
      <div className="box">
        <h4>The demo</h4>
        <label>Home screen state</label>
        <select value={pt.mode} onChange={(e) => {
          const mode = e.target.value;
          set({ ...INIT, mode, wlEntry: pt.wlEntry });
        }}>
          <option value="none">Nothing active · Discover</option>
          <option value="wl">Weight loss active</option>
          <option value="protocol">Protocol active</option>
        </select>
        {pt.mode === 'wl' && (
          <div style={{ marginTop: 10 }}>
            <label>Which module qualifies</label>
            <select value={pt.wlEntry} onChange={(e) => set({ wlEntry: e.target.value })}>
              <option value="rx">Prescription led</option>
              <option value="meds">Medicine purchased</option>
              <option value="blood">Blood test booked</option>
              <option value="tagged">Tagged GLP-1 by ops</option>
            </select>
            <div style={{ fontSize: 11, color: '#8CA0B4', marginTop: 8, lineHeight: 1.5 }}>
              Not four flows. One card, with different modules qualifying.
            </div>
          </div>
        )}
      </div>

      <div className="box">
        <h4>Published from the Studio</h4>
        {gateRows.map(([k, t, on]) => (
          <div className="gate" key={k}>
            <span className="nm">{t}</span>
            <span className={`pill ${on ? 'on' : 'off'}`}>{on ? 'live' : 'waiting'}</span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: '#8CA0B4', marginTop: 10, lineHeight: 1.5 }}>
          Open the Studio in another tab. Publishing there updates this one live.
        </div>
      </div>

      <div className="box">
        <button className="ghost" onClick={reset}>Reset the patient</button>
      </div>
    </div>
  );

  /* ── which screen ── */
  let view = null;

  if (screen === 'home') {
    view = (
      <Home
        mode={pt.mode} wlEntry={pt.wlEntry} goals={GOALS}
        onChat={() => {}}
        onPick={(id) => {
          if (id !== RR) { window.alert('Only Recover and Rebuild is built out in this prototype.'); return; }
          set({ mode: 'none', stage: 'gate:triage' });
        }}
        protocolCard={
          <ProtocolCard title={goal.t} plan={plan} done={pt.done}
            onChat={() => {}} onOpen={() => setScreen('detail')} />
        }
      />
    );
  } else if (screen === 'gate:triage') {
    view = <Gate gate={GATES.triage} open={!!triageCfg} onBack={() => setScreen('home')}
      onContinue={() => setScreen('triage')} />;
  } else if (screen === 'triage') {
    view = <Triage config={triageCfg.data} onBack={() => setScreen('gate:triage')}
      onDone={(a) => set({ answers: a, stage: 'gate:prepurchase' })} />;
  } else if (screen === 'gate:prepurchase') {
    view = <Gate gate={GATES.prepurchase} open={!!ppCfg} onBack={() => setScreen('home')}
      onContinue={() => setScreen('pdp')} />;
  } else if (screen === 'pdp') {
    view = <PDP cfg={ppCfg.data} onBack={() => setScreen('gate:prepurchase')} onBuy={() => setScreen('cart')} />;
  } else if (screen === 'cart') {
    view = <Cart cfg={ppCfg.data} onBack={() => setScreen('pdp')} onPay={() => setScreen('confirm')} />;
  } else if (screen === 'confirm') {
    view = <Confirm cfg={ppCfg.data} onDone={() => setScreen('gate:plan')} />;
  } else if (screen === 'gate:plan') {
    view = <Gate gate={GATES.plan} open={plan.length > 0} onBack={() => setScreen('home')}
      onContinue={() => set({ mode: 'protocol', stage: 'home' })} />;
  } else if (screen === 'gate:consult') {
    view = <Gate gate={GATES.consult} open={!consultPending} onBack={() => setScreen('home')}
      onContinue={() => set({ consultSeen: consultVersion, stage: 'home' })} />;
  } else if (screen === 'detail') {
    view = (
      <JourneyDetail title={goal.t} plan={plan} done={pt.done} onBack={() => setScreen('home')}
        onComplete={(it) => {
          /* The consultation is the one step that hands the journey to a
             clinician. Everything stops until they record what happened.
             Marked done and moved in one write: two writes race, and the
             second one's stage would land on the first one's stale copy. */
          set((p) => ({
            ...p,
            done: [...p.done, it.id],
            stage: it.id === 'p4' ? 'gate:consult' : 'home',
          }));
        }} />
    );
  }

  /* The consult gate can also be reached by landing on home mid-wait. */
  useEffect(() => {
    if (screen === 'home' && pt.mode === 'protocol' && awaitingConsult) setScreen('gate:consult');
  }, [screen, pt.mode, awaitingConsult]);

  return (
    <div className="stage">
      <div className="phone-col">
        <div className="phone">
          {view}
          {screen === 'home' && (
            <div className="nav">
              {[['Tests', 'flask'], ['Supplements', 'box'], ['Home', null],
                ['Results', 'activity'], ['Cart', 'cart']].map(([t, ic]) => (
                <div className={`t ${t === 'Home' ? 'on' : ''}`} key={t}>
                  {ic ? <Icon name={ic} size={19} /> : <div className="v">V</div>}
                  <span>{t}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {rail}
    </div>
  );
}
