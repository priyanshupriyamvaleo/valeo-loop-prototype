import { useEffect, useRef, useState } from 'react';
import './theme.css';
import Icon from './ui/Icon';
import Home from './screens/Home';
import { Gate, Onboarding, Triage, PDP, Cart, Confirm } from './screens/Flow';
import { Schedule, Status, CheckIn, Report, Join, ProductPage } from './screens/Actions';
import { ProtocolCard, JourneyDetail } from './screens/Journey';
import { readStudio, readPatient, writePatient, subscribe, GOALS, goalOf, publishedFor, GATES, SHARED } from '../shared/bus';
import { planFor, nextItem, gateOpen, archetypeOf, stateOf, bookingCompletes, medicinesFor, voucherFor } from './lib/journey';
import { serviceOf } from '../p2/lib/seed';

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
  goal: null,          /* chosen at the end of the onboarding chat, not before it */
  intake: null,        /* the onboarding answers and the details the doctor needs */
  answers: null,       /* the goal's own triage answers */
  done: [],
  checkins: [],        /* pain and capacity, self-reported */
  target: null,        /* where the patient says they want to be by Week 12 */
  logs: {},            /* how many times each tile has been logged */
  booked: {},          /* itemId -> the slot the patient chose */
  acting: null,        /* the plan item whose action screen is open */
  actMode: null,       /* which face of it: report, join, or the default */
  product: null,       /* the medicine or supplement whose page is open */
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

  /* The goal is now something the patient chose, not a constant. It falls back
     to Recover and Rebuild only so the protocol home state in the demo rail has
     something to render before anybody has been through onboarding. */
  const goalId = pt.goal || RR;
  const goal = goalOf(goalId);
  const onbCfg = publishedFor(studio, SHARED, 'onboarding');
  const triageCfg = publishedFor(studio, goalId, 'triage');
  const ppCfg = publishedFor(studio, goalId, 'prepurchase');
  const plan = planFor(studio, goalId, pt);
  const medicines = medicinesFor(studio, goalId, pt);
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
    ['onboarding', 'Onboarding chat', !!onbCfg],
    ['triage', `Triage · ${goal.t}`, !!triageCfg],
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
        {/* TIME LIVES HERE, NOT ON THE PHONE.
            Nine of the fourteen steps belong to a nurse, a lab or the pharmacy,
            and the patient cannot make those happen. Putting a "mark this as
            done" button on the patient screen to advance them was the thing
            that made it read as a prototype rather than a product. So the
            phone shows the true waiting state and the presenter moves time
            from out here. */}
        {pt.mode === 'protocol' && item && (
          <button className="ghost" style={{ marginBottom: 8 }}
            onClick={() => set((prev) => ({
              ...prev,
              done: [...prev.done, item.id],
              stage: item.id === 'p4' ? 'gate:consult' : prev.stage,
            }))}>
            Move time on · {item.t}
          </button>
        )}
        <button className="ghost" onClick={reset}>Reset the patient</button>
      </div>
    </div>
  );

  /* ── which screen ── */
  let view = null;

  if (screen === 'home') {
    view = (
      <Home
        mode={pt.mode} wlEntry={pt.wlEntry}
        onChat={() => {}}
        onStart={() => set({ mode: 'none', stage: 'gate:onboarding' })}
        protocolCard={
          <ProtocolCard title={goal.t} plan={plan} done={pt.done}
            onChat={() => {}} onOpen={() => setScreen('detail')} />
        }
      />
    );
  } else if (screen === 'gate:onboarding') {
    view = <Gate gate={GATES.onboarding} open={!!onbCfg} onBack={() => setScreen('home')}
      onContinue={() => setScreen('onboarding')} />;
  } else if (screen === 'onboarding') {
    view = (
      <Onboarding config={onbCfg.data} goals={GOALS}
        onBack={() => setScreen('gate:onboarding')}
        onDone={({ answers, profile, goal: picked }) => {
          /* Weight loss is the journey Valeo already ships, so choosing it hands
             the patient to that home state rather than into this flow. */
          if (picked === 'weight-loss') {
            set({ intake: { answers, profile }, goal: picked, mode: 'wl', stage: 'home' });
            return;
          }
          set({ intake: { answers, profile }, goal: picked, mode: 'none', stage: 'gate:triage' });
        }} />
    );
  } else if (screen === 'gate:triage') {
    view = <Gate gate={GATES.triage} title={goal.t} open={!!triageCfg} onBack={() => setScreen('home')}
      onContinue={() => setScreen('triage')} />;
  } else if (screen === 'triage') {
    view = <Triage title={goal.t} config={triageCfg.data} onBack={() => setScreen('gate:triage')}
      onDone={(a) => set({ answers: a, stage: 'gate:prepurchase' })} />;
  } else if (screen === 'gate:prepurchase') {
    view = <Gate gate={GATES.prepurchase} title={goal.t} open={!!ppCfg} onBack={() => setScreen('home')}
      onContinue={() => setScreen('pdp')} />;
  } else if (screen === 'pdp') {
    view = <PDP cfg={ppCfg.data} onBack={() => setScreen('gate:prepurchase')} onBuy={() => setScreen('cart')} />;
  } else if (screen === 'cart') {
    view = <Cart cfg={ppCfg.data} onBack={() => setScreen('pdp')} onPay={() => setScreen('confirm')} />;
  } else if (screen === 'confirm') {
    view = <Confirm cfg={ppCfg.data} onDone={() => setScreen('gate:plan')} />;
  } else if (screen === 'gate:plan') {
    view = <Gate gate={GATES.plan} title={goal.t} open={plan.length > 0} onBack={() => setScreen('home')}
      onContinue={() => set({ mode: 'protocol', stage: 'home' })} />;
  } else if (screen === 'gate:consult') {
    view = <Gate gate={GATES.consult} title={goal.t} open={!consultPending} onBack={() => setScreen('home')}
      onContinue={() => set({ consultSeen: consultVersion, stage: 'home' })} />;
  } else if (screen === 'act') {
    const it = plan.find((x) => x.id === pt.acting);
    /* A step published after this screen was opened, or a stale id from an
       older session, must not take the screen down. */
    if (!it) {
      view = <Gate gate={GATES.plan} title={goal.t} open onBack={() => setScreen('detail')}
        onContinue={() => setScreen('detail')} />;
    } else if (pt.actMode === 'report') {
      view = <Report item={it} panelName={serviceOf(plan.find((x) => x.id === 'p2')?.service)?.t}
        onBack={() => setScreen('detail')} onBook={() => set({ actMode: null })} />;
    } else if (pt.actMode === 'join') {
      view = (
        <Join item={it} when={pt.booked[it.id]} onBack={() => setScreen('detail')}
          onDone={() => set((prev) => ({
            ...prev, done: [...prev.done, it.id], acting: null, actMode: null,
            stage: it.id === 'p4' ? 'gate:consult' : 'detail',
          }))} />
      );
    } else if (archetypeOf(it) === 'schedule') {
      view = (
        <Schedule item={it} onBack={() => setScreen('detail')}
          onDone={(slot) => set((prev) => {
            /* Booking a consultation does not mean you attended it, so a step
               with somewhere to be afterwards keeps its place in the plan and
               changes what it says instead. */
            const finishes = bookingCompletes(it);
            return {
              ...prev,
              booked: { ...prev.booked, [it.id]: slot },
              done: finishes ? [...prev.done, it.id] : prev.done,
              acting: null, actMode: null,
              stage: finishes && it.id === 'p4' ? 'gate:consult' : 'detail',
            };
          })} />
      );
    } else {
      view = <Status item={it} onBack={() => setScreen('detail')} />;
    }
  } else if (screen === 'product') {
    view = (
      <ProductPage id={pt.product?.id} status={pt.product?.status}
        onBack={() => setScreen('detail')}
        onBuy={() => { window.alert('Checkout is not wired up in this prototype.'); }} />
    );
  } else if (screen === 'checkin') {
    view = (
      <CheckIn first={pt.checkins.length === 0} previous={pt.checkins[pt.checkins.length - 1]}
        onBack={() => setScreen('detail')}
        onDone={(v, target) => set((prev) => ({
          ...prev,
          checkins: [...prev.checkins, v],
          target: target != null ? target : prev.target,
          logs: { ...prev.logs, symptoms: (prev.logs?.symptoms || 0) + 1 },
          stage: 'detail',
        }))} />
    );
  } else if (screen === 'detail') {
    view = (
      <JourneyDetail title={goal.t} plan={plan} done={pt.done}
        medicines={medicines}
        voucherId={voucherFor(studio, plan.find((x) => x.id === 'p5'), pt)}
        onProduct={(m) => set({ product: m, stage: 'product' })}
        checkins={pt.checkins || []} booked={pt.booked || {}}
        logs={pt.logs || {}} target={pt.target}
        onBack={() => setScreen('home')}
        onChat={() => {}}
        onOpen={(it, mode) => set({ acting: it.id, actMode: mode || null, stage: 'act' })}
        onLog={(k) => {
          /* Symptoms is the real capture and opens the check-in. The other
             three record that the day was logged and nothing more, because the
             numbers behind them need an ops backend that does not exist yet.
             A tile that invented a weight would be worse than one that does
             not pretend to have it. */
          if (k === 'symptoms') { setScreen('checkin'); return; }
          set((prev) => ({ ...prev, logs: { ...prev.logs, [k]: (prev.logs?.[k] || 0) + 1 } }));
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
