import { useReducer, useState } from 'react';
import { Box, CssBaseline, ThemeProvider, Stack, Typography } from '@mui/material';
import theme, { C } from './theme';
import Intro from './screens/Intro';
import Questions from './screens/Questions';
import Matching from './screens/Matching';
import Discover from './screens/Discover';
import Find from './screens/Find';
import ValeoHome from './screens/ValeoHome';
import Baseline from './screens/Baseline';
import Today from './screens/Today';
import Protocols from './screens/Protocols';
import Twin from './screens/Twin';
import ProtocolDetail from './screens/ProtocolDetail';
import Consult from './screens/Consult';
import Between from './screens/Between';
import Coach from './screens/Coach';
import Meet from './screens/Meet';
import Consultation from './screens/Consultation';
import Brief from './screens/Brief';
import BuyScreen from './screens/Buy';
import BottomNav from './components/BottomNav';
import Feedback from './components/Feedback';
import PushToast from './components/PushToast';
import { screenOf } from './lib/screen';
import { PROTOCOLS, DEMO_QA, focusRun, activeRuns, synthObserved,
         PHASES_APP, phaseHas, leadFor } from './data';

const INIT = {
  qa: {},          /* answers — the single source of truth for the twin */
  saved: [],       /* protocol keys */
  passed: [],      /* twin ids */
  supps: [],       /* supplement keys bought outright, no consult */
  revealed: [],    /* twin ids explicitly revealed */
  swipes: 0,
  tier: 'open',
  blood: false,
  devices: [],     /* paired wearables — a fact about the person, not a protocol */
  /* Protocols in flight, keyed by protocol. Any number at once:
     consulted → programme → bloodsBooked → bloodsDone → followup → ready
     → shipping → running → verdict → reviewing → done */
  runs: {},
  focus: null,     /* which run Today is showing */
};

/* Write into one protocol's run without touching any other. Every lifecycle
   action goes through this, which is what makes the N-protocol case safe: there
   is no shared slot left for one protocol to clobber another's status in. */
function patchRun(s, pKey, patch) {
  const cur = s.runs[pKey];
  if (!cur) return s;
  return { ...s, runs: { ...s.runs, [pKey]: { ...cur, ...patch } } };
}
/* the run Today is acting on */
function target(s, a) { return a.protocol || s.focus; }

function reducer(s, a) {
  switch (a.type) {
    case 'save':
      return { ...s, swipes: s.swipes + 1, saved: [...new Set([...s.saved, a.protocol])] };
    case 'pass':
      return { ...s, swipes: s.swipes + 1, passed: [...s.passed, a.id] };
    case 'tier':    return { ...s, tier: a.tier };
    case 'supp':    return { ...s, supps: [...new Set([...s.supps, a.supp])] };
    case 'generate':
      return { ...s, saved: [...new Set([...s.saved, a.protocol])] };
    case 'reveal':  return { ...s, revealed: [...new Set([...s.revealed, a.id])] };
    case 'answers': return { ...s, qa: { ...s.qa, ...a.qa } };
    case 'blood':   return { ...s, blood: true };
    case 'focus':   return { ...s, focus: a.protocol };
    /* pairing pays forward across every protocol, present and future */
    case 'pair':
      return { ...s, devices: [...new Set([...s.devices, a.dev])] };

    /* Demo affordance: two protocols mid-flight, at different stages, so the
       multi-run case is the default rather than something you have to construct. */
    case 'demoFull': {
      const run = (protocol, day, adherence) => {
        const total = PROTOCOLS[protocol].wk * 7;
        return {
          status: 'running', slot: 'Today 6:30 pm', day, total, adherence,
          logs: Array.from({ length: Math.round(day * 0.96) },
            (_, i) => ({ day: i + 1, kind: 'taken', v: true })),
          body: Array.from({ length: Math.ceil(day / 7) },
            (_, i) => ({ day: i * 7 + 1, kg: 96 - i * 0.323, waist: 96 - i * 0.185 })),
          meals: [], checkin: [], doneItems: [],
        };
      };
      return {
        ...s, qa: { ...s.qa, ...DEMO_QA }, blood: true, tier: 'elite',
        devices: ['oura', 'cgm'],
        saved: [...new Set([...s.saved, 'P_LONG', 'P_ATH', 'P_SLEEP'])],
        runs: Object.keys(s.runs).length ? s.runs : {
          /* week 14 of 24 — the run started before the 04 Jun retest, so that
             retest can honestly be credited to it */
          P_LONG: run('P_LONG', 98, 96),
          P_ATH:  run('P_ATH', 21, 91),
        },
        focus: s.focus || 'P_LONG',
      };
    }

    /* ── one protocol's lifecycle ──
       The run now begins at the end of the free consultation. Nothing is
       booked and nothing is paid before that, so `consulted` is the first
       state that exists and it is the one that creates the record. */
    case 'consulted':
      return {
        ...s,
        runs: { ...s.runs, [a.protocol]: { ...(s.runs[a.protocol] || {}),
                                           status: 'consulted' } },
        focus: s.focus || a.protocol,
      };
    /* One payment. It buys the programme, and blood work is step one inside
       it, so the patient is never asked for money again. */
    case 'programme': return patchRun(s, target(s, a), { status: 'programme' });
    case 'reviewed':  return patchRun(s, target(s, a), { status: 'ready' });
    /* ── the middle of the journey ── */

    /* ── THE PRACTICE THREAD LIVES IN STATE ──
       It has to. A conversation the app recomputes on open is a status panel
       wearing a chat's clothes: close it, reopen it, and there is no past. The
       whole reason a thread reassures people more than a dashboard does is that
       week six can scroll back to the night before the first consultation.

       `key` makes stage messages idempotent — each stage says its piece once,
       however many times the sheet is opened, and `said` remembers which. */
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
    /* how far down the thread you have actually read */
    case 'seen': return patchRun(s, target(s, a), { seen: a.n });
    case 'bookBloods': return patchRun(s, target(s, a),
      { status: 'bloodsBooked', bloodSlot: a.slot });
    case 'bloodsDone': return patchRun(s, target(s, a),
      { status: 'bloodsDone', labs: 'processing' });
    case 'labsReady': return patchRun(s, target(s, a), { labs: 'ready' });
    case 'bookFollow': return patchRun(s, target(s, a),
      { status: 'followup', followSlot: a.slot });
    /* Activating the plan starts fulfilment. It is not a purchase: the
       programme was paid for at the Care Brief. `ship` tracks the parcel and
       `deliver` is what actually begins the treatment. */
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
    /* Demo affordance — jump a week so the loop can be walked in a sitting. */
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
    /* ── closing the loop ──
       The retest is booked the same way the first consult was and lands in the
       same kind of holding state: the run is over, the numbers exist, and nobody
       has read them. That gap is the product's whole claim. */
    case 'bookReview':
      return patchRun(s, target(s, a), { status: 'reviewing', reviewSlot: a.slot });
    /* The read has happened. What it found is written onto the run here rather
       than computed on every render — a report has to say the same thing twice.
       P_LONG carries a hand-authored retest, so it keeps it. */
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

export default function App() {
  const [st, dispatch] = useReducer(reducer, INIT);
  /* `flow` is the linear onboarding; `tab` is the app proper. */
  /* ── PHASE ──
     Three demos from one build. ?phase=1|2|3, default 1, switchable in the rail.
     Three forks of a codebase diverge inside a week and the design team ends up
     reviewing a stale one. */
  const [phase, setPhase] = useState(() => {
    const q = Number(new URLSearchParams(window.location.search).get('phase'));
    return [1, 2, 3].includes(q) ? q : 1;
  });
  const P = PHASES_APP[phase];
  /* Plan is phase 1's only route to a protocol — first or fifth. From phase 2 it
     folds into Discover, whose catalogue bar is the same search and the same browse:
     two nav entries for "find a protocol" would read as two products, and six items
     in a phone nav reads as none. The home card's 'plan' destination resolves to
     whichever of the two that phase actually ships. */
  const tabsFor = (n) => (n === 1
    ? ['plan', 'today', 'protocols']
    : n === 2 ? ['discover', 'today', 'protocols']
      : ['discover', 'today', 'protocols', 'twin']);
  const tabs = tabsFor(phase);
  const home = tabs[0];

  /* Every phase starts on Valeo's home screen, because that is where this
     actually lands: protocols are a module inside an app that already exists,
     and a demo that opens on our own intro screen quietly assumes otherwise. */
  const [flow, setFlow] = useState('home');
  const [tab, setTab] = useState(home);
  const [reveal, setReveal] = useState(null);
  /* The goal the coach established, which is what Find answers with. Held here
     rather than in Find so returning to the tab later still shows the match. */
  const [matched, setMatched] = useState(null);
  /* a goal answered on the greeting screen, before the coach even opens */
  const [preGoal, setPreGoal] = useState(null);
  /* the clinician being introduced */
  const [meetKey, setMeetKey] = useState(null);
  /* Which booking the scheduler is currently serving. Bloods and the follow-up
     reuse the same screen — one booking experience, three occasions — so the
     mode says what to do with the slot that comes back. */
  const [booking, setBooking] = useState('consult');

  const goQuestions = (r) => { setReveal(r || null); setFlow('questions'); };

  /* Where a tap on the home card lands. The resolver decides which of these is
     right for the current lifecycle state; this only routes. */
  const fromCard = (go, pKey) => {
    if (go === 'start') return setFlow('between');
    if (go === 'plan') { setFlow('app'); return setTab(home); }
    if (go === 'today') { setFlow('app'); return setTab('today'); }
    if (go === 'results') return openResults(pKey);
    if (go === 'detail') return openDetail(pKey);
    setFlow('app'); return setTab(home);
  };

  const finishQuestions = (qa) => {
    if (qa) dispatch({ type: 'answers', qa });
    if (reveal) {
      dispatch({ type: 'reveal', id: reveal.id });
      setReveal(null);
      setFlow('app'); setTab(home);
    } else {
      setFlow('matching');
    }
  };

  const bookBlood = () => setFlow('baseline');
  /* Fresh bloods change every score, so the loader runs again in unlock mode
     and drops you into the tier it just opened. */
  const baselineDone = () => {
    dispatch({ type: 'blood' });
    dispatch({ type: 'tier', tier: 'elite' });
    setFlow('unlock');
  };

  /* ── protocol lifecycle ── */
  const [detail, setDetail] = useState(null);
  /* the protocol whose end-of-run review is being booked */
  const [reviewKey, setReviewKey] = useState(null);
  /* 'plan' | 'results' — which face of a finished protocol to open on */
  const [detailView, setDetailView] = useState('plan');
  const [push, setPush] = useState(null);

  const openDetail = (pk) => { setDetail(pk); setDetailView('plan'); setFlow('detail'); };
  /* The slot chosen in Consult, held until intake actually confirms it — the
     booking does not go through on a slot pick alone. */
  /* One results surface, reached two ways: the notification on Today, and
     Protocols → Completed. Two copies of a verdict is how they drift apart. */
  const openResults = (pk) => { setDetail(pk); setDetailView('results'); setFlow('detail'); };
  /* Straight from the simulator into the same detail page every other protocol
     uses — same steps, same consult, same back button to Protocols, where it is
     now sitting alongside the ones he swiped for. */
  const generate = () => { dispatch({ type: 'generate', protocol: 'P_FAISAL' }); openDetail('P_FAISAL'); };
  /* The consult is paid for at the slot picker and nothing interrupts after.
     The clinical questions that used to gate this now sit on Today as an offer
     to help the doctor prepare — asking someone who has just paid to answer a
     questionnaire before their booking is real is how you lose them at the till. */
  const bookReview = (slot) => {
    /* whichever run Today was showing is the one being closed */
    const pk = reviewKey;
    dispatch({ type: 'bookReview', protocol: pk, slot });
    setFlow('app'); setTab('today');
  };

  /* Landing follows state, not habit: with a protocol in flight the only
     question that matters is "what happens next". */
  const enterApp = () => {
    setFlow('app');
    setTab(activeRuns(st).length ? 'today' : home);
  };
  /* "Track it on Today" — the one bridge from Protocols into the day, and the
     thing that makes N runs navigable rather than merely stored. */
  const trackOn = (pk) => { dispatch({ type: 'focus', protocol: pk }); setFlow('app'); setTab('today'); };

  /* ── SIMULATE NEXT STEP ──
     Every transition the SYSTEM owns rather than the user: the doctor finishing
     their review, a package arriving, a week passing, a retest being read. These
     used to fire on timers, which meant the demo walked itself past states
     faster than anyone could look at them. Driven by hand, each one is a beat
     you can stop on. Transitions the user owns — booking, buying — stay where
     they belong, on their own buttons. */
  const f = focusRun(st);
  /* Some moments genuinely fork — after the consultation the clinician either
     has enough to write the plan or wants bloods first. The demo offers both
     rather than picking one, because which branch a protocol takes is a clinical
     judgement and hard-coding it would quietly turn a decision into a rule. */
  const NEXT = {
    /* The fork is gone. Every programme starts with blood work, because the
       clinician cannot write a plan without it, so there is nothing to branch
       on after the consultation. What the patient does next is pay and pick a
       time, and both of those are the patient's move, not the system's. */
    bloodsBooked: [{ t: 'Nurse visit complete', run: (k) => {
      dispatch({ type: 'bloodsDone', protocol: k });
    } }],
    followup: [{ t: 'Follow-up happens, plan ready', run: (k) => {
      dispatch({ type: 'reviewed', protocol: k });
    } }],
    /* One control per real event, so the demo can show the thread and the
       fulfilment strip changing rather than jumping straight to day 1. */
    shipping:  [],
    running:   [{ t: 'Jump one week', run: (k) => dispatch({ type: 'advance', protocol: k }) }],
    reviewing: [{ t: 'Results are read', run: (k) => {
      dispatch({ type: 'results', protocol: k });
    } }],
  };
  if (f && f.status === 'shipping') {
    const nx = { confirmed: ['preparing', 'Medication prepared'],
                 preparing: ['out', 'Out for delivery'],
                 out:       ['delivered', 'Package delivered'] }[(f.run && f.run.ship) || 'confirmed'];
    /* nothing once it is delivered — starting day 1 is the patient's move */
    NEXT.shipping = nx
      ? [{ t: nx[1], run: (k) => dispatch({ type: 'ship', protocol: k, stage: nx[0] }) }]
      : [];
  }
  /* the lab finishing is a background event, so it gets its own control rather
     than being bundled into whatever the patient does next */
  if (f && f.status === 'followup' && (f.run && f.run.labs) !== 'ready') {
    NEXT.followup = [
      { t: 'Lab results arrive', run: (k) => dispatch({ type: 'labsReady', protocol: k }) },
      ...NEXT.followup,
    ];
  }
  const steps = (f && NEXT[f.status]) || [];

  const dark = false;

  let view = null;
  if (flow === 'home') view = (
    <ValeoHome st={st} phase={phase} onGo={fromCard} onServices={() => {}} />
  );
  else if (flow === 'between') view = (
    /* The goal tapped on the greeting arrives here and skips the coach's first
       question. That is the whole justification for those chips: the screen
       removes a step downstream instead of decorating this one. */
    <Between onStart={(g) => { setPreGoal(g); setFlow('coach'); }}
      onBack={() => setFlow('home')} />
  );
  else if (flow === 'coach') view = (
    <Coach preGoal={preGoal} onBack={() => setFlow('between')}
      onDone={(a) => {
        dispatch({ type: 'answers', qa: a });
        setMatched(a.goal);
        /* Straight to the person. This used to land on the plan tab, and the
           moment a product card appeared the user stopped being a patient and
           became a shopper — three screens after we'd welcomed them. */
        setMeetKey(leadFor(a.goal));
        setFlow('meet');
      }} />
  );
  else if (flow === 'intro') view = (
    <Intro phase={phase}
      /* The protocol-led path has no separate demographic screen anymore — that
         used to run here, before you'd seen a single protocol. It now happens
         inside the pre-consult intake chat, once a real doctor is attached to
         the question. Only the twin pitch still needs the old Q&A. */
      onNext={() => (phaseHas(phase, 'twin') ? goQuestions(null) : (setFlow('app'), setTab(home)))}
      onBack={() => setFlow('home')} />
  );
  else if (flow === 'questions') view = (
    <Questions reveal={reveal} phase={phase} onFinish={finishQuestions}
               onBack={() => (reveal ? (setReveal(null), setFlow('app')) : setFlow('home'))} />
  );
  else if (flow === 'matching') view = <Matching phase={phase} onDone={enterApp} />;
  else if (flow === 'unlock') view = (
    <Matching mode="unlock" phase={phase} onDone={() => { setFlow('app'); setTab(home); }} />
  );
  else if (flow === 'meet') view = (
    /* Straight into the consultation. No slot picker, no fee. The patient has
       met the team and answered the questions; the next thing is the talk. */
    <Meet pKey={meetKey}
      onBack={() => setFlow('coach')}
      onBook={(pk) => { setDetail(pk); setFlow('consultation'); }} />
  );
  else if (flow === 'consultation') view = (
    <Consultation pKey={detail}
      onDone={() => {
        /* The run begins here, at `consulted`. Nothing was booked and nothing
           was paid, so there is no earlier state to record. */
        dispatch({ type: 'consulted', protocol: detail });
        dispatch({ type: 'focus', protocol: detail });
        setFlow('brief');
      }} />
  );
  else if (flow === 'brief') view = (
    <Brief pKey={detail} st={st}
      onBack={() => { setFlow('app'); setTab('today'); }}
      onStart={() => setFlow('buy')} />
  );
  else if (flow === 'detail') view = (
    <ProtocolDetail st={st} pKey={detail} view={detailView} onView={setDetailView}
      onBack={() => { setFlow('app'); setTab('protocols'); }}
      onConsult={() => setFlow('consult')}
      onTrack={() => trackOn(detail)}
      onBuy={() => {
        /* "Activate my plan". The programme was paid for at the Care Brief. */
        dispatch({ type: 'activate', protocol: detail });
        setFlow('app'); setTab('today');
      }} />
  );
  else if (flow === 'consult') view = (
    <Consult mode={booking === 'consult' ? 'start' : booking === 'bloods' ? 'bloods' : 'review'}
      onBack={() => { if (booking === 'consult') return setFlow('meet');
        setFlow('app'); return setTab('today'); }}
      onBooked={(slot) => {
        if (booking === 'bloods') {
          dispatch({ type: 'bookBloods', protocol: detail, slot });
          setFlow('app'); setTab('today');
        } else if (booking === 'follow') {
          dispatch({ type: 'bookFollow', protocol: detail, slot });
          setFlow('app'); setTab('today');
        }
      }} />
  );
  else if (flow === 'review') view = (
    <Consult mode="review" pKey={reviewKey}
      onBack={() => { setFlow('app'); setTab('today'); }} onBooked={bookReview} />
  );
  else if (flow === 'buy') view = (
    <BuyScreen st={st} pKey={detail} onBack={() => setFlow('detail')}
      onPaid={() => {
        dispatch({ type: 'programme', protocol: detail });
        dispatch({ type: 'focus', protocol: detail });
        setFlow('app'); setTab('today');
      }} />
  );
  else if (flow === 'baseline') view = (
    <Baseline onBack={() => { setFlow('app'); setTab(home); }} onDone={baselineDone} />
  );

  const chrome = flow === 'app';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 5, p: 4, bgcolor: '#0E1D2E',
      }}>
        {/* Reviewers on the left, demo controls on the right, the product in
            the middle. The panel reads the same state the app renders from, so
            a comment always lands on the screen the reviewer was looking at. */}
        <Feedback screen={screenOf({ flow, tab, st, booking, detail })} />

        <Phone>
          <PushToast push={push} onOpen={() => {
            const go = push && push.go;
            setPush(null);
            if (go) return go();
            setFlow('app'); setTab('today');
          }} onDismiss={() => setPush(null)} />
          {chrome ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flex: '1 1 auto', minHeight: 0, position: 'relative' }}>
                {tab === 'plan' && (
                  <Find matched={matched} onOpen={(pk) => { setMeetKey(pk); setFlow('meet'); }} />
                )}
                {tab === 'discover' && phaseHas(phase, 'discover') && (
                  <Discover st={st} dispatch={dispatch} onQuestions={goQuestions}
                            onBlood={bookBlood} />
                )}
                {tab === 'today' && (
                  <Today st={st} dispatch={dispatch} onGo={setTab}
                         onBrief={(pk) => { setDetail(pk); setFlow('brief'); }}
                         onBookBloods={(pk) => {
                           setDetail(pk); setBooking('bloods'); setFlow('consult');
                         }}
                         onBookFollow={(pk) => {
                           setDetail(pk); setBooking('follow'); setFlow('consult');
                         }}
                         onBuy={(pk) => {
                           dispatch({ type: 'activate', protocol: pk });
                         }}
                         onDetail={(pk) => openDetail(pk)}
                         onReview={(pk) => { setReviewKey(pk); setFlow('review'); }}
                         onResults={(pk) => openResults(pk)}
                         onFocus={(pk) => dispatch({ type: 'focus', protocol: pk })} />
                )}
                {tab === 'protocols' && (
                  <Protocols st={st} onGo={setTab} home={home} onDetail={openDetail}
                             onResults={openResults} onTrack={trackOn} />
                )}
                {tab === 'twin' && phaseHas(phase, 'twin') && (
                  <Twin st={st} onGo={setTab} onBlood={bookBlood}
                        onQuestions={() => goQuestions(null)} onGenerate={generate}
                        onProtocol={openDetail}
                        onBuySupp={(k) => dispatch({ type: 'supp', supp: k })} />
                )}
              </Box>
              <BottomNav active={tab} onGo={setTab} dark={dark} tabs={tabs}
                         onHome={() => setFlow('home')}
                         badge={{ protocols: st.saved.length }} />
            </Box>
          ) : view}
        </Phone>

        <Box sx={{ maxWidth: 230, display: { xs: 'none', md: 'block' } }}>
          <Typography sx={{
            fontSize: 11, fontWeight: 800, letterSpacing: '.18em',
            textTransform: 'uppercase', color: C.yellow,
          }}>Valeo Twins</Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }}>
            {[1, 2, 3].map((n) => (
              <Box key={n} onClick={() => {
                setPhase(n);
                const t = tabsFor(n);
                if (!t.includes(tab)) setTab(t[0]);
              }} sx={{
                flex: 1, textAlign: 'center', py: 0.7, borderRadius: '9px', cursor: 'pointer',
                fontSize: 12, fontWeight: phase === n ? 700 : 500,
                bgcolor: phase === n ? C.yellow : 'rgba(255,255,255,.07)',
                color: phase === n ? C.deep : '#C7D6E6',
              }}>P{n}</Box>
            ))}
          </Stack>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: '#fff', mt: 1.25 }}>
            {P.t}
          </Typography>
          <Typography sx={{ fontSize: 11.5, mt: 0.4, lineHeight: 1.55, color: '#93A9C2' }}>
            {P.s}
          </Typography>

          <Rail label="Host" items={[['home', 'Valeo home']]}
            active={flow} onGo={(k) => setFlow(k)} />

          <Rail label="Funnel" items={[['between', 'Greeting'], ['coach', 'Intake chat'],
            ['meet', 'Meet your doctor'], ['baseline', 'Blood test']]}
            active={flow} onGo={(k) => { setReveal(null); setFlow(k); }} />

          <Rail label="App" items={tabs.map((k) => [k, ({
            plan: 'Plan', discover: 'Discover', today: 'Today',
            protocols: 'Protocols', twin: 'Twin' })[k]])}
            active={chrome ? tab : null}
            onGo={(k) => { setFlow('app'); setTab(k); }} />

          <Stack spacing={0.6} sx={{ mt: 2.5 }}>
            {steps.length ? steps.map((sp) => (
              <Box key={sp.t} onClick={() => sp.run(f.k)} sx={{
                px: 1.5, py: 1.1, borderRadius: '10px', cursor: 'pointer',
                fontSize: 12.5, fontWeight: 700, textAlign: 'center',
                bgcolor: C.yellow, color: C.deep,
              }}>▶ {sp.t}</Box>
            )) : (
              <Box sx={{
                px: 1.5, py: 1.1, borderRadius: '10px',
                fontSize: 12.5, fontWeight: 700, textAlign: 'center',
                bgcolor: 'rgba(255,255,255,.07)', color: '#5D7793',
              }}>Nothing to advance</Box>
            )}
          </Stack>
          <Typography sx={{ fontSize: 11, color: '#5D7793', mt: 1, lineHeight: 1.5 }}>
            Fires the next thing the system does, not the user.
          </Typography>

          <Box onClick={() => {
                 dispatch({ type: 'demoFull' }); setFlow('home');
               }}
               sx={{
            mt: 2.5, px: 1.5, py: 1.1, borderRadius: '10px', cursor: 'pointer',
            fontSize: 12.5, fontWeight: 700, textAlign: 'center',
            bgcolor: st.blood && Object.keys(st.qa).length > 6 ? 'rgba(39,153,91,.22)' : C.green,
            color: '#fff',
          }}>
            {st.blood && Object.keys(st.qa).length > 6 ? '✓ Full twin loaded' : 'Load a full twin'}
          </Box>
          <Typography sx={{ fontSize: 11, color: '#5D7793', mt: 1, lineHeight: 1.5 }}>
            Fills every signal so all six layers render.
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

function Rail({ label, items, active, onGo }) {
  return (
    <Box sx={{ mt: 2.5 }}>
      <Typography sx={{
        fontSize: 9, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase',
        color: '#5D7793', mb: 1,
      }}>{label}</Typography>
      <Stack spacing={0.6}>
        {items.map(([k, t]) => (
          <Box key={k} onClick={() => onGo(k)} sx={{
            px: 1.5, py: 0.9, borderRadius: '10px', cursor: 'pointer', fontSize: 12.5,
            bgcolor: active === k ? C.yellow : 'rgba(255,255,255,.07)',
            color: active === k ? C.deep : '#C7D6E6',
            fontWeight: active === k ? 700 : 400,
          }}>{t}</Box>
        ))}
      </Stack>
    </Box>
  );
}
