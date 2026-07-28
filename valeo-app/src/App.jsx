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
import BottomNav from './components/BottomNav';
import { PROTOCOLS } from './data';

const INIT = {
  qa: {},          /* answers — the single source of truth for the twin */
  saved: [],       /* protocol keys */
  passed: [],      /* twin ids */
  revealed: [],    /* twin ids explicitly revealed */
  swipes: 0,
  tier: 'open',
  blood: false,
  active: null,    /* { protocol, day, total, adherence, items[] } */
  done: [],        /* indices of today's completed items */
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
    /* One loop at a time. Two running protocols mean neither verdict is
       attributable, which makes the whole product a guess. */
    case 'start':
      if (s.active) return s;
      return {
        ...s, done: [],
        active: {
          protocol: a.protocol, day: 1, total: PROTOCOLS[a.protocol].wk * 7,
          adherence: 100, items: PROTOCOLS[a.protocol].stack,
        },
      };
    case 'toggleDone':
      return {
        ...s,
        done: s.done.includes(a.i) ? s.done.filter((x) => x !== a.i) : [...s.done, a.i],
      };
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
  const baselineDone = () => {
    dispatch({ type: 'blood' });
    dispatch({ type: 'tier', tier: 'elite' });
    setFlow('app'); setTab('discover');
  };

  /* Landing follows state, not habit: with a protocol running the only
     question that matters is "what do I do today". */
  const enterApp = () => { setFlow('app'); setTab(st.active ? 'today' : 'discover'); };

  const dark = tab === 'discover' && st.tier !== 'open';

  let view = null;
  if (flow === 'intro') view = <Intro onNext={() => goQuestions(null)} />;
  else if (flow === 'questions') view = (
    <Questions reveal={reveal} onFinish={finishQuestions}
               onBack={() => (reveal ? (setReveal(null), setFlow('app')) : setFlow('intro'))} />
  );
  else if (flow === 'matching') view = <Matching onDone={enterApp} />;
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
          {chrome ? (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ flex: '1 1 auto', minHeight: 0, position: 'relative' }}>
                {tab === 'discover' && (
                  <Discover st={st} dispatch={dispatch} onQuestions={goQuestions}
                            onBlood={bookBlood} />
                )}
                {tab === 'today' && (
                  <Today st={st} dispatch={dispatch} onGo={setTab} />
                )}
                {tab === 'protocols' && (
                  <Protocols st={st} dispatch={dispatch} onGo={setTab} onBlood={bookBlood} />
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
