import { useReducer, useState } from 'react';
import { Box, CssBaseline, ThemeProvider, Stack, Typography } from '@mui/material';
import theme, { C } from './theme';
import Intro from './screens/Intro';
import Questions from './screens/Questions';
import Matching from './screens/Matching';
import Discover from './screens/Discover';
import Baseline from './screens/Baseline';
import Today from './screens/Today';
import Protocols from './screens/Protocols';
import Twin from './screens/Twin';
import ProtocolDetail from './screens/ProtocolDetail';
import Consult from './screens/Consult';
import BuyScreen from './screens/Buy';
import BottomNav from './components/BottomNav';
import PushToast from './components/PushToast';
import { PROTOCOLS, DEMO_QA } from './data';

const INIT = {
  qa: {},          /* answers — the single source of truth for the twin */
  saved: [],       /* protocol keys */
  passed: [],      /* twin ids */
  revealed: [],    /* twin ids explicitly revealed */
  swipes: 0,
  tier: 'open',
  blood: false,
  /* One protocol moves through the loop at a time:
     saved → booked → ready → shipping → running → verdict */
  rx: null,
};

function reducer(s, a) {
  switch (a.type) {
    case 'save':
      return { ...s, swipes: s.swipes + 1, saved: [...new Set([...s.saved, a.protocol])] };
    case 'pass':
      return { ...s, swipes: s.swipes + 1, passed: [...s.passed, a.id] };
    case 'tier':    return { ...s, tier: a.tier };
    case 'reveal':  return { ...s, revealed: [...new Set([...s.revealed, a.id])] };
    case 'answers': return { ...s, qa: { ...s.qa, ...a.qa } };
    case 'blood':   return { ...s, blood: true };
    /* Demo affordance: fill the twin so every feature can be judged at once. */
    case 'demoFull':
      return {
        ...s, qa: { ...s.qa, ...DEMO_QA }, blood: true, tier: 'elite',
        saved: [...new Set([...s.saved, 'P_LONG', 'P_SLEEP'])],
        rx: s.rx || {
          protocol: 'P_LONG', status: 'running', slot: 'Today 6:30 pm',
          day: 43, total: 168, adherence: 96,
          logs: Array.from({ length: 41 }, (_, i) => ({ day: i + 1, kind: 'taken', v: true })),
          body: Array.from({ length: 7 }, (_, i) => ({ day: i * 7 + 1, kg: 96 - i * 0.7, waist: 96 - i * 0.4 })),
          meals: [], checkin: [], doneItems: [], devices: ['oura', 'cgm'],
        },
      };
    /* One loop at a time. Two running protocols mean neither verdict is
       attributable, which makes the whole product a guess. */
    case 'book':
      return { ...s, rx: { protocol: a.protocol, status: 'booked', slot: a.slot } };
    /* The consult is what unblocks everything — and what amends the protocol. */
    case 'reviewed':
      return s.rx ? { ...s, rx: { ...s.rx, status: 'ready' } } : s;
    case 'paid':
      return s.rx ? { ...s, rx: { ...s.rx, status: 'shipping' } } : s;
    case 'deliver':
      return s.rx ? {
        ...s,
        rx: {
          ...s.rx, status: 'running', day: 1,
          total: PROTOCOLS[s.rx.protocol].wk * 7,
          logs: [], doneItems: [],
          meals: [], body: [], checkin: [], devices: [],
        },
      } : s;
    case 'toggleItem':
      return s.rx ? {
        ...s,
        rx: {
          ...s.rx,
          doneItems: s.rx.doneItems.includes(a.i)
            ? s.rx.doneItems.filter((x) => x !== a.i)
            : [...s.rx.doneItems, a.i],
        },
      } : s;
    case 'log':
      return s.rx ? {
        ...s,
        rx: { ...s.rx, logs: [...s.rx.logs, { day: s.rx.day, kind: a.kind, v: a.v }] },
      } : s;
    /* the other three captures */
    case 'meals':
      return s.rx ? { ...s, rx: { ...s.rx,
        meals: [...s.rx.meals.filter((m) => m.day !== s.rx.day), { day: s.rx.day, v: a.v }] } } : s;
    case 'body':
      return s.rx ? { ...s, rx: { ...s.rx,
        body: [...s.rx.body.filter((b) => b.day !== s.rx.day), { day: s.rx.day, ...a.v }] } } : s;
    case 'checkin':
      return s.rx ? { ...s, rx: { ...s.rx,
        checkin: [...s.rx.checkin.filter((c) => c.day !== s.rx.day), { day: s.rx.day, v: a.v }] } } : s;
    /* pairing is the only capture that pays forward — it removes future work */
    case 'pair':
      return s.rx ? { ...s, rx: { ...s.rx,
        devices: [...new Set([...(s.rx.devices || []), a.dev])] } } : s;
    /* Demo affordance — jump a week so the loop can be walked in a sitting. */
    case 'advance': {
      if (!s.rx || !s.rx.day) return s;
      const day = Math.min(s.rx.total, s.rx.day + 7);
      const logs = [...s.rx.logs];
      const body = [...s.rx.body];
      for (let d = s.rx.day; d < day; d += 1) {
        logs.push({ day: d, kind: d <= 21 ? 'felt' : 'taken', v: true });
        if (d % 7 === 1) body.push({ day: d, kg: 96 - Math.round((d / 7) * 0.9 * 10) / 10, waist: 96 });
      }
      return {
        ...s,
        rx: { ...s.rx, day, logs, body, doneItems: [],
              status: day >= s.rx.total ? 'verdict' : 'running' },
      };
    }
    case 'retest': return s;
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
  const [flow, setFlow] = useState('intro');
  const [tab, setTab] = useState('discover');
  const [reveal, setReveal] = useState(null);

  const goQuestions = (r) => { setReveal(r || null); setFlow('questions'); };

  const finishQuestions = (qa) => {
    if (qa) dispatch({ type: 'answers', qa });
    if (reveal) {
      dispatch({ type: 'reveal', id: reveal.id });
      setReveal(null);
      setFlow('app'); setTab('discover');
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
  const [push, setPush] = useState(null);

  const openDetail = (pk) => { setDetail(pk); setFlow('detail'); };
  const bookConsult = (slot) => {
    dispatch({ type: 'book', protocol: detail, slot });
    setFlow('app'); setTab('today');
    /* the call happens, the doctor amends, the phone buzzes */
    setTimeout(() => {
      dispatch({ type: 'reviewed' });
      setPush({
        t: 'Your protocol is ready',
        s: 'Dr. Mahmoud reviewed it and changed 2 things',
      });
    }, 4200);
  };

  /* Landing follows state, not habit: with a protocol in flight the only
     question that matters is "what happens next". */
  const enterApp = () => { setFlow('app'); setTab(st.rx ? 'today' : 'discover'); };

  const dark = tab === 'discover' && st.tier !== 'open';

  let view = null;
  if (flow === 'intro') view = <Intro onNext={() => goQuestions(null)} />;
  else if (flow === 'questions') view = (
    <Questions reveal={reveal} onFinish={finishQuestions}
               onBack={() => (reveal ? (setReveal(null), setFlow('app')) : setFlow('intro'))} />
  );
  else if (flow === 'matching') view = <Matching onDone={enterApp} />;
  else if (flow === 'unlock') view = (
    <Matching mode="unlock" onDone={() => { setFlow('app'); setTab('discover'); }} />
  );
  else if (flow === 'detail') view = (
    <ProtocolDetail st={st} pKey={detail}
      onBack={() => { setFlow('app'); setTab('protocols'); }}
      onConsult={() => setFlow('consult')}
      onBuy={() => setFlow('buy')} />
  );
  else if (flow === 'consult') view = (
    <Consult pKey={detail} onBack={() => setFlow('detail')} onBooked={bookConsult} />
  );
  else if (flow === 'buy') view = (
    <BuyScreen pKey={detail} onBack={() => setFlow('detail')}
      onPaid={() => { dispatch({ type: 'paid' }); setFlow('app'); setTab('today'); }} />
  );
  else if (flow === 'baseline') view = (
    <Baseline onBack={() => { setFlow('app'); setTab('discover'); }} onDone={baselineDone} />
  );

  const chrome = flow === 'app';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 5, p: 4, bgcolor: '#0E1D2E',
      }}>
        <Phone>
          <PushToast push={push} onOpen={() => {
            setPush(null); setFlow('app'); setTab('today');
          }} onDismiss={() => setPush(null)} />
          {chrome ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flex: '1 1 auto', minHeight: 0, position: 'relative' }}>
                {tab === 'discover' && (
                  <Discover st={st} dispatch={dispatch} onQuestions={goQuestions}
                            onBlood={bookBlood} />
                )}
                {tab === 'today' && (
                  <Today st={st} dispatch={dispatch} onGo={setTab}
                         onBuy={() => { setDetail(st.rx.protocol); setFlow('buy'); }}
                         onDetail={() => openDetail(st.rx.protocol)} />
                )}
                {tab === 'protocols' && (
                  <Protocols st={st} onGo={setTab} onDetail={openDetail} />
                )}
                {tab === 'twin' && (
                  <Twin st={st} onGo={setTab} onBlood={bookBlood}
                        onQuestions={() => goQuestions(null)} />
                )}
              </Box>
              <BottomNav active={tab} onGo={setTab} dark={dark}
                         badge={{ protocols: st.saved.length }} />
            </Box>
          ) : view}
        </Phone>

        <Box sx={{ maxWidth: 230, display: { xs: 'none', md: 'block' } }}>
          <Typography sx={{
            fontSize: 11, fontWeight: 800, letterSpacing: '.18em',
            textTransform: 'uppercase', color: C.yellow,
          }}>Valeo Twins</Typography>
          <Typography sx={{ fontSize: 13, mt: 1.5, lineHeight: 1.6, color: '#93A9C2' }}>
            Drag a card left or right to pass or save. Drag up to ascend a tier.
          </Typography>

          <Rail label="Onboarding" items={[['intro', 'Intro'], ['questions', 'Questions'],
            ['matching', 'Matching'], ['baseline', 'Blood test']]}
            active={flow} onGo={(k) => { setReveal(null); setFlow(k); }} />

          <Rail label="App" items={[['discover', 'Discover'], ['today', 'Today'],
            ['protocols', 'Protocols'], ['twin', 'Twin']]}
            active={chrome ? tab : null}
            onGo={(k) => { setFlow('app'); setTab(k); }} />

          <Box onClick={() => { dispatch({ type: 'demoFull' }); setFlow('app'); setTab('twin'); }}
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
