import { useReducer, useState } from 'react';
import { Box, CssBaseline, ThemeProvider, Stack, Typography } from '@mui/material';
import theme, { C } from './theme';
import Intro from './screens/Intro';
import Questions from './screens/Questions';
import Matching from './screens/Matching';
import Discover from './screens/Discover';

const INIT = {
  saved: [], passed: [], revealed: [], swipes: 0,
  skipped: ['food', 'sleep', 'stress'],
  tier: 'open', blood: false,
};

function reducer(s, a) {
  switch (a.type) {
    case 'save':
      return { ...s, swipes: s.swipes + 1, saved: [...new Set([...s.saved, a.protocol])] };
    case 'pass':
      return { ...s, swipes: s.swipes + 1, passed: [...s.passed, a.id] };
    case 'tier': return { ...s, tier: a.tier };
    case 'reveal':
      return {
        ...s, revealed: [...s.revealed, a.id],
        skipped: s.skipped.filter((g) => !(a.groups || []).includes(g)),
      };
    case 'blood': return { ...s, blood: true };
    default: return s;
  }
}

/* Device frame so the prototype reads as a phone on a desktop screen. */
function Phone({ children }) {
  return (
    <Box sx={{
      width: 390, height: 844, flexShrink: 0, position: 'relative',
      borderRadius: '46px', overflow: 'hidden', bgcolor: C.cream,
      boxShadow: '0 40px 90px -30px rgba(0,0,0,.55), 0 0 0 10px #0B1522, 0 0 0 11px #2B3F56',
    }}>
      {children}
    </Box>
  );
}

export default function App() {
  const [st, dispatch] = useReducer(reducer, INIT);
  const [screen, setScreen] = useState('intro');
  const [reveal, setReveal] = useState(null);

  const goQuestions = (r) => { setReveal(r || null); setScreen('questions'); };

  const finishQuestions = () => {
    if (reveal) {
      dispatch({ type: 'reveal', id: reveal.id, groups: reveal.groups });
      setReveal(null);
      setScreen('discover');
    } else {
      setScreen('matching');
    }
  };

  const bookBlood = () => { dispatch({ type: 'blood' }); setScreen('discover'); };

  let view;
  if (screen === 'intro') {
    view = <Intro onNext={() => goQuestions(null)} />;
  } else if (screen === 'questions') {
    view = (
      <Questions reveal={reveal} onFinish={finishQuestions}
                 onBack={() => setScreen(reveal ? 'discover' : 'intro')} />
    );
  } else if (screen === 'matching') {
    view = <Matching onDone={() => setScreen('discover')} />;
  } else {
    view = <Discover st={st} dispatch={dispatch}
                     onQuestions={goQuestions} onBlood={bookBlood} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 5, p: 4, bgcolor: '#0E1D2E',
      }}>
        <Phone>{view}</Phone>
        <Box sx={{ maxWidth: 230, display: { xs: 'none', md: 'block' } }}>
          <Typography sx={{
            fontSize: 11, fontWeight: 800, letterSpacing: '.18em',
            textTransform: 'uppercase', color: C.yellow,
          }}>Valeo Twins</Typography>
          <Typography sx={{ fontSize: 13, mt: 1.5, lineHeight: 1.6, color: '#93A9C2' }}>
            React + MUI. Drag a card left or right to pass or save. Drag up to ascend a tier.
          </Typography>
          <Stack spacing={0.75} sx={{ mt: 2.5 }}>
            {[['intro', 'Intro'], ['questions', 'Questions'], ['matching', 'Matching'],
              ['discover', 'Discover']].map(([k, label]) => (
              <Box key={k} onClick={() => { setReveal(null); setScreen(k); }} sx={{
                px: 1.5, py: 1, borderRadius: '10px', cursor: 'pointer', fontSize: 13,
                bgcolor: screen === k ? C.yellow : 'rgba(255,255,255,.07)',
                color: screen === k ? C.deep : '#C7D6E6',
                fontWeight: screen === k ? 700 : 400,
              }}>{label}</Box>
            ))}
          </Stack>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
