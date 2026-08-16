import { useReducer, useState } from 'react';
import { Box, CssBaseline, ThemeProvider } from '@mui/material';
import theme, { C } from './theme';
import ValeoHome from './screens/ValeoHome';
import Between from './screens/Between';
import Coach from './screens/Coach';
import Assess from './screens/Assess';
import Meet from './screens/Meet';
import Consultation from './screens/Consultation';
import Brief from './screens/Brief';
import BuyScreen from './screens/Buy';
import Activate from './screens/Activate';
import Consult from './screens/Consult';
import ProtocolDetail from './screens/ProtocolDetail';
import Today from './screens/Today';
import BottomNav from './components/BottomNav';
import PushToast from './components/PushToast';
import FlowTable from './dock/FlowTable';
import { TRANSITIONS, canFire } from './machine';
import { PROTOCOLS, GOALS, focusRun, activeRuns, synthObserved, leadFor, doorOf }
  from './data';

/* ══════════════════════════════════════════════════════════════════════════
   VALEO MVP — the launchable cut.

   Two flows, one store. Weight loss carries the fork (GLP-1 monthly plan
   with a doctor checkpoint, no labs). Every other goal takes the long flow:
   free consult → care brief → blood test SAR 499 applied toward the
   programme → results review → activation (the balance) → treatment.

   The demo surface is the phone plus the flow table. No feedback panel, no
   twins, no machine infra: the table shows each step's entry and exit
   conditions and offers exactly one control, the system's next move.
   ══════════════════════════════════════════════════════════════════════════ */

const INIT = {
  qa: {},
  saved: [], supps: [], devices: [],
  blood: false, tier: 'open',
  runs: {},
  focus: null,
  log: [],
};

/* Every action that is an event, named as one, with its actor. The reducer
   wrapper appends these to the log, which is what keeps the phone, the flow
   table and any future clinician surface in one history. */
const EVENT_OF = {
  consulted: () => ({ event: 'CONSULT_COMPLETED', actor: 'clinician' }),
  orderPlaced: () => ({ event: 'PAYMENT_COMPLETED', actor: 'patient' }),
  /* the resolve door's first payment is the blood test */
  programme: () => ({ event: 'TEST_PAID', actor: 'patient' }),
  checkpoint: (a) => (a.v === 'approved'
    ? { event: 'ORDER_APPROVED', actor: 'clinician' }
    : { event: 'CALL_REQUESTED', actor: 'clinician' }),
  bookBloods: () => ({ event: 'NURSE_BOOKED', actor: 'patient' }),
  bloodsDone: () => ({ event: 'SAMPLE_COLLECTED', actor: 'nurse' }),
  bookFollow: () => ({ event: 'FOLLOWUP_BOOKED', actor: 'patient' }),
  labsReady: () => ({ event: 'LABS_UPLOADED', actor: 'lab' }),
  reviewed: () => ({ event: 'PRESCRIPTION_SIGNED', actor: 'clinician' }),
  /* the balance: known-door activation is part of the doctor's approval and
     is logged there, so it stays silent here */
  activate: (a, s) => {
    const r = s.runs[a.protocol || s.focus];
    return r && r.door === 'known' ? null
      : { event: 'PROGRAMME_ACTIVATED', actor: 'patient' };
  },
  ship: (a) => ({ event: { preparing: 'MEDICATION_DISPENSED', out: 'SHIPMENT_OUT',
                           delivered: 'DELIVERY_CONFIRMED' }[a.stage],
                  actor: a.stage === 'delivered' ? 'nurse' : 'pharmacy' }),
  deliver: () => ({ event: 'TREATMENT_STARTED', actor: 'patient' }),
  advance: () => ({ event: 'WEEK_ADVANCED', actor: 'system' }),
  bookReview: () => ({ event: 'RETEST_BOOKED', actor: 'patient' }),
  results: () => ({ event: 'VERDICT_PUBLISHED', actor: 'clinician' }),
  loopOpened: () => ({ event: 'LOOP_OPENED', actor: 'system' }),
  answers: (a) => (a.qa && a.qa.door
    ? (a.qa.escalated
      ? { event: 'ESCALATION_RAISED', actor: 'ai' }
      : { event: `INTENT_CHOSEN · ${a.qa.door === 'known' ? 'KNOWN' : 'DIAGNOSIS'}`,
          actor: 'patient' })
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

    /* ── one episode's lifecycle ── */
    case 'consulted':
      return {
        ...s,
        runs: { ...s.runs, [a.protocol]: { ...(s.runs[a.protocol] || {}),
                                           status: 'consulted' } },
        focus: s.focus || a.protocol,
      };
    /* The long flow's first payment: the blood test, applied toward the
       programme. The run moves to 'programme' with the test paid. */
    case 'programme': return patchRun(s, target(s, a), { status: 'programme' });
    /* The known door's run is born at payment, checkpoint pending. */
    case 'orderPlaced':
      return {
        ...s,
        runs: { ...s.runs, [a.protocol]: {
          status: 'programme', door: 'known', checkpoint: 'pending' } },
        focus: s.focus || a.protocol,
      };
    case 'checkpoint':
      return patchRun(s, target(s, a), {
        checkpoint: a.v, ...(a.v === 'call' ? { checkpointWasCall: true } : {}),
      });
    case 'reviewed':  return patchRun(s, target(s, a), { status: 'ready' });
    case 'emit': return s;
    case 'loopOpened': return patchRun(s, target(s, a), { loopOpened: true });

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
    case 'bookBloods': return patchRun(s, target(s, a),
      { status: 'bloodsBooked', bloodSlot: a.slot });
    case 'bloodsDone': return patchRun(s, target(s, a),
      { status: 'bloodsDone', labs: 'processing' });
    case 'labsReady': return patchRun(s, target(s, a), { labs: 'ready' });
    case 'bookFollow': return patchRun(s, target(s, a),
      { status: 'followup', followSlot: a.slot });
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
      return patchRun(s, k, {
        day, logs, body, doneItems: [],
        status: day >= r.total ? 'verdict' : 'running',
      });
    }
    case 'bookReview':
      return patchRun(s, target(s, a), { status: 'reviewing', reviewSlot: a.slot });
    case 'results': {
      const k = target(s, a); const r = s.runs[k];
      if (!r) return s;
      const adherence = r.day ? Math.round((r.logs.length / r.day) * 100) : 90;
      return patchRun(s, k, {
        status: 'done',
        observed: r.observed || (k === 'P_LONG' ? null : synthObserved(k, adherence)),
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

/* One run only in the log reducer per action — the version above is final. */
export default function App() {
  const [st, dispatch] = useReducer(withLog(reducer), INIT);

  const [flow, setFlow] = useState('home');
  const [tab, setTab] = useState('today');
  const [preGoal, setPreGoal] = useState(null);
  const [matched, setMatched] = useState(null);
  const [meetKey, setMeetKey] = useState(null);
  const [booking, setBooking] = useState('consult');
  const [matchFail, setMatchFail] = useState(false);
  const [ckCall, setCkCall] = useState(false);
  const [detail, setDetail] = useState(null);
  const [reviewKey, setReviewKey] = useState(null);
  const [detailView, setDetailView] = useState('plan');
  const [push, setPush] = useState(null);

  const openDetail = (pk) => { setDetail(pk); setDetailView('plan'); setFlow('detail'); };
  const openResults = (pk) => { setDetail(pk); setDetailView('results'); setFlow('detail'); };

  const fromCard = (go, pKey) => {
    if (go === 'start') {
      dispatch({ type: 'emit', event: 'EPISODE_CREATED', actor: 'system' });
      return setFlow('between');
    }
    if (go === 'results') return openResults(pKey);
    if (go === 'detail') return openDetail(pKey);
    setFlow('app'); return setTab('today');
  };

  const enterApp = () => { setFlow('app'); setTab('today'); };

  /* ── the gate helpers: the only code that moves the journey ── */
  const completeIntake = (a) => {
    dispatch({ type: 'answers', qa: {
      escalated: false, escAt: null,
      wants: null, wantsPkey: null, wantsShort: null,
      ...a,
    } });
    setMatched(a.goal);
    if (a.door === 'known' && !a.escalated) {
      setDetail(a.wantsPkey || leadFor(a.goal));
      setFlow('buy');
    } else {
      setMeetKey(leadFor(a.goal));
      setFlow('assess');
    }
  };

  const joinConsult = () => {
    const pk = meetKey || leadFor(st.qa.goal);
    setDetail(pk); setMeetKey(pk);
    setMatchFail(false);
    dispatch({ type: 'emit', event: 'CONSULT_JOINED', actor: 'patient', protocol: pk });
    setFlow('consultation');
  };

  const endConsult = () => {
    dispatch({ type: 'consulted', protocol: detail });
    dispatch({ type: 'focus', protocol: detail });
    setFlow('brief');
  };
  const approveAfterCall = (pk) => {
    dispatch({ type: 'checkpoint', protocol: pk, v: 'approved' });
    dispatch({ type: 'activate', protocol: pk });
    if (ckCall) { setCkCall(false); setFlow('app'); setTab('today'); }
  };

  /* The long flow's first payment: the blood test, SAR 499, applied. */
  const payTest = (pk) => {
    const k = pk || detail;
    dispatch({ type: 'programme', protocol: k });
    dispatch({ type: 'focus', protocol: k });
    setFlow('app'); setTab('today');
  };

  /* The known door's one payment: the monthly plan. */
  const completePayment = () => {
    dispatch({ type: 'orderPlaced', protocol: detail });
    dispatch({ type: 'focus', protocol: detail });
    setFlow('app'); setTab('today');
  };

  const approveOrder = (pk) => {
    dispatch({ type: 'checkpoint', protocol: pk, v: 'approved' });
    dispatch({ type: 'activate', protocol: pk });
  };
  const requestCall = (pk) => dispatch({ type: 'checkpoint', protocol: pk, v: 'call' });
  const startCheckpointCall = (pk) => {
    dispatch({ type: 'emit', event: 'CALL_STARTED', actor: 'patient', protocol: pk });
    setDetail(pk); setCkCall(true); setMatchFail(false); setFlow('consultation');
  };

  /* The activation screen: results reviewed, pay the balance. */
  const onActivate = (pk) => { setDetail(pk); setFlow('activate'); };

  const ui = { flow, detail, ckCall, tab };
  const ctx = {
    dispatch, setFlow, setTab, setDetail, setCkCall, setMatchFail,
    completeIntake, joinConsult, endConsult, approveAfterCall,
    payTest, completePayment, approveOrder, requestCall, startCheckpointCall,
    simGoal: () => {
      const free = GOALS.find((g) => !st.runs[leadFor(g.k)]);
      return free ? free.k : (st.qa.goal || preGoal || 'fat');
    },
  };

  /* THE GATE. A transition the machine refuses simply does not fire. */
  const fireEvent = (eventId, ep) => {
    const t = TRANSITIONS.find((x) => x.event === eventId);
    if (!t || !canFire(t, st, ui, ep)) return;
    t.fire(ctx, ep);
  };

  let view = null;
  if (flow === 'home') view = (
    <ValeoHome st={st} phase={1} onGo={fromCard} onServices={() => {}} />
  );
  else if (flow === 'between') view = (
    <Between onStart={(g) => { setPreGoal(g); setFlow('coach'); }}
      onBack={() => setFlow('home')} />
  );
  else if (flow === 'coach') view = (
    <Coach preGoal={preGoal} onBack={() => setFlow('between')}
      onDone={completeIntake} />
  );
  else if (flow === 'assess') view = (
    <Assess goal={matched || st.qa.goal} pKey={meetKey}
      onBack={() => setFlow('coach')}
      onDone={() => setFlow('meet')} />
  );
  else if (flow === 'meet') view = (
    <Meet pKey={meetKey}
      onBack={() => setFlow('coach')}
      onBook={joinConsult} />
  );
  else if (flow === 'consultation') view = (
    <Consultation pKey={detail} failed={matchFail}
      onDone={() => (ckCall ? approveAfterCall(detail) : endConsult())} />
  );
  else if (flow === 'brief') view = (
    /* The care brief carries the split: programme shown, blood test asked. */
    <Brief pKey={detail} st={st}
      onBack={() => { setFlow('app'); setTab('today'); }}
      onTestPaid={() => payTest(detail)} />
  );
  else if (flow === 'buy') view = (
    /* Known door only: the monthly plan. */
    <BuyScreen st={st} pKey={detail} door="known"
      wants={st.qa.wantsPkey ? (st.qa.wants || null) : null}
      wantsShort={st.qa.wantsShort || null}
      onBack={() => setFlow('between')}
      onPaid={completePayment} />
  );
  else if (flow === 'activate') view = (
    <Activate pKey={detail}
      onBack={() => { setFlow('app'); setTab('today'); }}
      onPaid={() => {
        dispatch({ type: 'activate', protocol: detail });
        setFlow('app'); setTab('today');
      }} />
  );
  else if (flow === 'detail') view = (
    <ProtocolDetail st={st} pKey={detail} view={detailView} onView={setDetailView}
      onBack={() => { setFlow('app'); setTab('today'); }}
      onConsult={() => setFlow('consult')}
      onTrack={() => { dispatch({ type: 'focus', protocol: detail }); enterApp(); }}
      onBuy={() => {
        dispatch({ type: 'activate', protocol: detail });
        enterApp();
      }} />
  );
  else if (flow === 'consult') view = (
    <Consult mode={booking === 'consult' ? 'start' : booking === 'bloods' ? 'bloods' : 'review'}
      onBack={() => { setFlow('app'); setTab('today'); }}
      onBooked={(slot) => {
        if (booking === 'bloods') {
          dispatch({ type: 'bookBloods', protocol: detail, slot });
        } else if (booking === 'follow') {
          dispatch({ type: 'bookFollow', protocol: detail, slot });
        }
        setFlow('app'); setTab('today');
      }} />
  );
  else if (flow === 'review') view = (
    <Consult mode="review" pKey={reviewKey}
      onBack={() => { setFlow('app'); setTab('today'); }}
      onBooked={(slot) => {
        dispatch({ type: 'bookReview', protocol: reviewKey, slot });
        setFlow('app'); setTab('today');
      }} />
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
          <PushToast push={push} onOpen={() => {
            const go = push && push.go;
            setPush(null);
            if (go) return go();
            enterApp();
          }} onDismiss={() => setPush(null)} />
          {chrome ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flex: '1 1 auto', minHeight: 0, position: 'relative' }}>
                <Today st={st} dispatch={dispatch} onGo={setTab}
                       onBrief={(pk) => { setDetail(pk); setFlow('brief'); }}
                       onCheckpointCall={startCheckpointCall}
                       onActivate={onActivate}
                       onBookBloods={(pk) => {
                         setDetail(pk); setBooking('bloods'); setFlow('consult');
                       }}
                       onBookFollow={(pk) => {
                         setDetail(pk); setBooking('follow'); setFlow('consult');
                       }}
                       onBuy={(pk) => dispatch({ type: 'activate', protocol: pk })}
                       onDetail={(pk) => openDetail(pk)}
                       onReview={(pk) => { setReviewKey(pk); setFlow('review'); }}
                       onResults={(pk) => openResults(pk)}
                       onFocus={(pk) => dispatch({ type: 'focus', protocol: pk })} />
              </Box>
              <BottomNav active={tab} onGo={setTab} dark={false} tabs={['today']}
                         onHome={() => setFlow('home')} badge={{}} />
            </Box>
          ) : view}
        </Phone>

        <FlowTable st={st} ui={ui} fireEvent={fireEvent} />
      </Box>
    </ThemeProvider>
  );
}
