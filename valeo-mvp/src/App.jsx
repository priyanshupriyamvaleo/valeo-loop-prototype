import { useReducer, useState } from 'react';
import { Box, CssBaseline, ThemeProvider, Stack, Typography } from '@mui/material';
import theme, { C } from './theme';
import ValeoHome from './screens/ValeoHome';
import Coach from './screens/Coach';
import Consultation from './screens/Consultation';
import PlanScreen from './screens/PlanScreen';
import Today from './screens/Today';
import BottomNav from './components/BottomNav';
import PushToast from './components/PushToast';
import FlowTable from './dock/FlowTable';
import CatMan from './dock/CatMan';
import { TRANSITIONS, canFire } from './machine';
import { PROTOCOLS, DEFAULT_PLAN, GLP_PKEY, focusRun, synthObserved } from './data';

/* ══════════════════════════════════════════════════════════════════════════
   VALEO MVP — weight loss, known intent, one plan.

   The patient answers six questions. Clean answers see the plan and pay;
   the doctor reviews in the background, same day, and either signs or
   refunds in full. A flagged answer sees the doctor FIRST, ten minutes,
   included, before any payment. The doctor's only verbs are yes and no.

   The plan itself is content: one object in the store, edited live in the
   category manager's console on the right, rendered by the PDP on the phone.

   Right of the phone: two tabs. Flow — every step with its entry and exit
   conditions, current row highlighted, one control for the system's next
   move. Plans — the category manager's console.
   ══════════════════════════════════════════════════════════════════════════ */

const INIT = {
  qa: {},
  plan: DEFAULT_PLAN,
  runs: {},
  focus: null,
  saved: [], supps: [], devices: [], blood: false, tier: 'open',
  log: [],
};

/* Every action that is an event, named with its actor, appended to the log
   by the reducer wrapper. One history for the phone and both panels. */
const EVENT_OF = {
  orderPlaced: () => ({ event: 'PLAN_PAID', actor: 'patient' }),
  checkpoint: (a) => (a.v === 'approved'
    ? { event: 'ORDER_APPROVED', actor: 'clinician' }
    : a.v === 'declined'
      ? { event: 'ORDER_DECLINED', actor: 'clinician' }
      : null),
  ship: (a) => ({ event: { preparing: 'MEDICATION_DISPENSED', out: 'SHIPMENT_OUT',
                           delivered: 'DELIVERY_CONFIRMED' }[a.stage],
                  actor: a.stage === 'delivered' ? 'nurse' : 'pharmacy' }),
  deliver: () => ({ event: 'TREATMENT_STARTED', actor: 'patient' }),
  advance: () => ({ event: 'WEEK_ADVANCED', actor: 'system' }),
  planPatch: () => ({ event: 'PLAN_EDITED', actor: 'system' }),
  answers: (a) => (a.qa && a.qa.flags
    ? { event: a.qa.flagged ? 'INTAKE_SUBMITTED · FLAGGED' : 'INTAKE_SUBMITTED · CLEAN',
        actor: 'patient' }
    : null),
};

function withLog(reduce) {
  return (s, a) => {
    const next = reduce(s, a);
    const entry = a.type === 'emit'
      ? { event: a.event, actor: a.actor }
      : (EVENT_OF[a.type] ? EVENT_OF[a.type](a, s) : null);
    if (!entry || !entry.event) return next;
    const log = next.log || [];
    return { ...next, log: [...log, { seq: log.length + 1, pKey: a.protocol || s.focus || null, ...entry }] };
  };
}

function patchRun(s, pKey, patch) {
  const cur = s.runs[pKey];
  if (!cur) return s;
  return { ...s, runs: { ...s.runs, [pKey]: { ...cur, ...patch } } };
}
function target(s, a) { return a.protocol || s.focus; }

function reducer(s, a) {
  switch (a.type) {
    case 'answers': return { ...s, qa: { ...s.qa, ...a.qa } };
    case 'focus':   return { ...s, focus: a.protocol };
    /* the category manager's pen */
    case 'planPatch': return { ...s, plan: { ...s.plan, ...a.patch } };

    /* The run is born at payment. `eligible` means a doctor already said
       yes on the pre-payment call, so review is complete at birth. */
    case 'orderPlaced':
      return {
        ...s,
        runs: { ...s.runs, [a.protocol]: {
          status: 'programme', door: 'known', duration: a.duration || 'monthly',
          checkpoint: a.eligible ? 'approved' : 'pending' } },
        focus: s.focus || a.protocol,
      };
    case 'checkpoint':
      return patchRun(s, target(s, a), { checkpoint: a.v });
    case 'emit': return s;

    case 'say': {
      const k = target(s, a);
      const r = s.runs[k];
      if (!r) return s;
      const said = r.said || [];
      if (a.key && said.includes(a.key)) return s;
      return patchRun(s, k, {
        thread: [...(r.thread || []), ...a.msgs],
        said: a.key ? [...said, a.key] : said,
      });
    }
    case 'seen': return patchRun(s, target(s, a), { seen: a.n });
    case 'activate':  return patchRun(s, target(s, a),
      { status: 'shipping', ship: 'confirmed' });
    case 'ship':      return patchRun(s, target(s, a), { ship: a.stage });
    case 'deliver': {
      const k = target(s, a);
      return patchRun(s, k, {
        status: 'running', day: 1, total: PROTOCOLS[k].wk * 7,
        logs: [], doneItems: [], meals: [], body: [], checkin: [],
      });
    }
    case 'toggleItem': {
      const k = target(s, a); const r = s.runs[k]; if (!r) return s;
      return patchRun(s, k, {
        doneItems: r.doneItems.includes(a.i)
          ? r.doneItems.filter((x) => x !== a.i)
          : [...r.doneItems, a.i],
      });
    }
    /* the daily dose/feeling log on Today */
    case 'log': {
      const k = target(s, a); const r = s.runs[k]; if (!r) return s;
      return patchRun(s, k, { logs: [...r.logs, { day: r.day, kind: a.kind, v: a.v }] });
    }
    case 'meals': {
      const k = target(s, a); const r = s.runs[k]; if (!r) return s;
      return patchRun(s, k, {
        meals: [...r.meals.filter((m) => m.day !== r.day), { day: r.day, v: a.v }] });
    }
    case 'body': {
      const k = target(s, a); const r = s.runs[k]; if (!r) return s;
      return patchRun(s, k, {
        body: [...r.body.filter((b) => b.day !== r.day), { day: r.day, ...a.v }] });
    }
    case 'checkin': {
      const k = target(s, a); const r = s.runs[k]; if (!r) return s;
      return patchRun(s, k, {
        checkin: [...r.checkin.filter((c) => c.day !== r.day), { day: r.day, v: a.v }] });
    }
    case 'advance': {
      const k = target(s, a); const r = s.runs[k];
      if (!r || !r.day) return s;
      const day = Math.min(r.total, r.day + 7);
      const logs = [...r.logs];
      const body = [...r.body];
      for (let d = r.day; d < day; d += 1) {
        logs.push({ day: d, kind: d <= 21 ? 'felt' : 'taken', v: true });
        if (d % 7 === 1) body.push({ day: d, kg: 96 - Math.round((d / 7) * 0.9 * 10) / 10, waist: 96 });
      }
      return patchRun(s, k, { day, logs, body, doneItems: [], status: 'running' });
    }
    case 'results': {
      const k = target(s, a); const r = s.runs[k];
      if (!r) return s;
      const adherence = r.day ? Math.round((r.logs.length / r.day) * 100) : 90;
      return patchRun(s, k, {
        status: 'done',
        observed: r.observed || synthObserved(k, adherence),
      });
    }
    default: return s;
  }
}

function Phone({ children }) {
  return (
    <Box sx={{
      width: 390, height: 844, flexShrink: 0, position: 'relative',
      borderRadius: '46px', overflow: 'hidden', bgcolor: C.cream,
      boxShadow: '0 40px 90px -30px rgba(0,0,0,.55), 0 0 0 10px #0B1522, 0 0 0 11px #2B3F56',
    }}>{children}</Box>
  );
}

export default function App() {
  const [st, dispatch] = useReducer(withLog(reducer), INIT);

  const [flow, setFlow] = useState('home');
  const [tab, setTab] = useState('today');
  const [panel, setPanel] = useState(() => {
    const v = new URLSearchParams(window.location.search).get('view');
    return ['flow', 'plans'].includes(v) ? v : 'flow';
  });
  const [push, setPush] = useState(null);

  const enterApp = () => { setFlow('app'); setTab('today'); };

  /* ── the gate helpers: the only code that moves the journey ── */
  const startIntake = () => {
    dispatch({ type: 'emit', event: 'EPISODE_CREATED', actor: 'system' });
    setFlow('coach');
  };

  /* The end of the six questions: clean sees the plan, flagged sees the
     doctor first. Fork keys written authoritatively so a re-run cannot
     inherit a stale flag. */
  const completeIntake = (a) => {
    dispatch({ type: 'answers', qa: { flagged: false, eligible: false, ...a } });
    setFlow(a.flagged ? 'consultation' : 'plan');
  };

  /* The eligibility call ends one of two ways, and both are the doctor's. */
  const confirmEligible = () => {
    dispatch({ type: 'answers', qa: { eligible: true } });
    dispatch({ type: 'emit', event: 'ELIGIBILITY_CONFIRMED', actor: 'clinician' });
    setFlow('plan');
  };

  /* Payment. If a doctor already said yes on the call, review is complete
     and dispatch begins at once; otherwise the order enters review. */
  const payPlan = (duration) => {
    dispatch({ type: 'orderPlaced', protocol: GLP_PKEY, duration,
               eligible: !!st.qa.eligible });
    dispatch({ type: 'focus', protocol: GLP_PKEY });
    if (st.qa.eligible) dispatch({ type: 'activate', protocol: GLP_PKEY });
    enterApp();
  };

  const approveOrder = (pk) => {
    dispatch({ type: 'checkpoint', protocol: pk, v: 'approved' });
    dispatch({ type: 'activate', protocol: pk });
  };
  const declineOrder = (pk) => dispatch({ type: 'checkpoint', protocol: pk, v: 'declined' });

  const ui = { flow, tab };
  const ctx = { dispatch, setFlow, setTab, startIntake, completeIntake,
                confirmEligible, payPlan, approveOrder, declineOrder };

  /* THE GATE. A transition the machine refuses simply does not fire. */
  const fireEvent = (eventId, ep) => {
    const t = TRANSITIONS.find((x) => x.event === eventId);
    if (!t || !canFire(t, st, ui, ep)) return;
    t.fire(ctx, ep);
  };

  let view = null;
  if (flow === 'home') view = (
    <ValeoHome st={st} phase={1}
      onGo={(go, pKey) => {
        if (go === 'start') return startIntake();
        enterApp();
      }}
      onServices={() => {}} />
  );
  else if (flow === 'coach') view = (
    <Coach onBack={() => setFlow('home')} onDone={completeIntake} />
  );
  else if (flow === 'consultation') view = (
    /* The eligibility call. The doctor's one job here is yes or no; ending
       the call is the yes (the no is the table's ORDER_DECLINED beat after
       payment, or simply no plan offered — SIM keeps the happy path). */
    <Consultation pKey={GLP_PKEY} failed={false}
      onDone={confirmEligible} />
  );
  else if (flow === 'plan') view = (
    <PlanScreen plan={st.plan} eligible={!!st.qa.eligible}
      onBack={() => setFlow('coach')}
      onPaid={payPlan} />
  );

  const chrome = flow === 'app';
  const f = focusRun(st);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 5, p: 4, bgcolor: '#0E1D2E',
      }}>
        <Phone>
          <PushToast push={push} onOpen={() => { setPush(null); enterApp(); }}
            onDismiss={() => setPush(null)} />
          {chrome ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flex: '1 1 auto', minHeight: 0, position: 'relative' }}>
                <Today st={st} dispatch={dispatch} onGo={setTab}
                       onBrief={() => {}}
                       onCheckpointCall={() => {}}
                       onActivate={() => {}}
                       onBookBloods={() => {}}
                       onBookFollow={() => {}}
                       onBuy={(pk) => dispatch({ type: 'activate', protocol: pk })}
                       onDetail={() => {}}
                       onReview={() => {}}
                       onResults={() => {}}
                       onFocus={(pk) => dispatch({ type: 'focus', protocol: pk })} />
              </Box>
              <BottomNav active={tab} onGo={setTab} dark={false} tabs={['today']}
                         onHome={() => setFlow('home')} badge={{}} />
            </Box>
          ) : view}
        </Phone>

        {/* ── right of the phone: the flow, or the console ── */}
        <Box sx={{ width: 470, flexShrink: 0 }}>
          <Stack direction="row" spacing={0.5} sx={{ mb: 1.5 }}>
            {[['flow', 'The flow'], ['plans', 'Plans · category manager']].map(([k, t]) => (
              <Box key={k} onClick={() => setPanel(k)} sx={{
                flex: 1, textAlign: 'center', py: 0.8, borderRadius: '10px', cursor: 'pointer',
                fontSize: 11.5, fontWeight: panel === k ? 700 : 500,
                bgcolor: panel === k ? 'rgba(255,255,255,.14)' : 'rgba(255,255,255,.05)',
                color: panel === k ? '#fff' : '#93A9C2',
                border: panel === k ? '1px solid rgba(255,255,255,.25)' : '1px solid transparent',
              }}>{t}</Box>
            ))}
          </Stack>
          {panel === 'flow'
            ? <FlowTable st={st} ui={ui} fireEvent={fireEvent} />
            : (
              <Box sx={{ maxHeight: 800, overflowY: 'auto', pr: 0.5 }}>
                <CatMan st={st} dispatch={dispatch} />
              </Box>
            )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}
