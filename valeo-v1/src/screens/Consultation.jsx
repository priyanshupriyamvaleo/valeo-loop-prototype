import { useEffect, useRef, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import { PREP_SCRIPT, USER, coachOf, givenNameOf } from '../data';
import { C } from '../theme';

/**
 * THE FIRST CONSULTATION — immediate, and free.
 *
 * The old flow put a scheduler and a SAR 200 charge between the patient and
 * the clinician. Both sat in front of the relationship rather than in front of
 * the thing that needs them. A patient who has already met the team, answered
 * the intake questions and said what they want should be talking, not booking.
 *
 * So this screen opens the moment the patient asks for it. There is no slot
 * picker and no payment sheet.
 *
 * ── WHAT THIS CONVERSATION IS FOR ──
 * It is not for prescribing. The clinicians are clear that they cannot write a
 * protocol before they see blood results. This conversation exists to answer a
 * different question: what does the clinician need to investigate, and in
 * which direction should the care go?
 *
 * The output is therefore two things. The clinician understands the patient,
 * and the clinician knows which blood work to order. Both go into the Care
 * Brief on the next screen.
 *
 * ── WHY THE OLD PREPARATION SCRIPT IS REUSED ──
 * These questions were already written and already asked. They ran in a
 * separate chat during the wait between booking and the appointment. There is
 * no wait now, so the questions move into the consultation itself, which is
 * where a clinician would have asked them anyway.
 */
export default function Consultation({ pKey, onDone }) {
  const c = coachOf(pKey);
  const first = givenNameOf(c);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [typing, setTyping] = useState(true);
  const feed = useRef(null);

  const step = PREP_SCRIPT[i];
  const done = i >= PREP_SCRIPT.length;

  useEffect(() => {
    setTyping(true);
    const t = setTimeout(() => setTyping(false), i === 0 ? 1100 : 520);
    return () => clearTimeout(t);
  }, [i]);

  useEffect(() => {
    if (feed.current) feed.current.scrollTop = feed.current.scrollHeight;
  }, [i, typing, done]);

  if (!c) return null;
  const said = PREP_SCRIPT.slice(0, i).map((sp) => ({ q: sp.q, a: answers[sp.k] }));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      {/* A live call, so the header says live. There is no back button: you do
          not walk out of a consultation halfway through. */}
      <Stack direction="row" spacing={1.3} sx={{
        alignItems: 'center', px: 2.25, pt: 2.25, pb: 1.4, flexShrink: 0,
        borderBottom: `1px solid ${C.line}`,
      }}>
        <Box sx={{
          width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: `linear-gradient(155deg,${c.tone} 0%,rgba(11,21,34,.7) 145%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {c.img
            ? <Box component="img" src={c.img} alt="" sx={{
                width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
              }} />
            : <Typography sx={{
                fontFamily: '"Fraunces", serif', fontSize: 13, fontWeight: 600,
                color: 'rgba(255,255,255,.9)',
              }}>{c.mono}</Typography>}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep }}>
            {c.short}’s Practice
          </Typography>
          <Stack direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
            <Box sx={{
              width: 6, height: 6, borderRadius: '50%', bgcolor: C.green,
              animation: 'live 1.7s ease-in-out infinite',
              '@keyframes live': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
            }} />
            <Typography sx={{ fontSize: 11, color: C.ink2 }}>
              {done ? 'Consultation complete' : 'In consultation now'}
            </Typography>
          </Stack>
        </Box>
      </Stack>

      <Box ref={feed} sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, py: 2.25 }}>
        <Bubble>Hi {USER.first} 👋</Bubble>
        <Bubble>I’m {first}. Thanks for the answers you gave the team.</Bubble>
        <Bubble>
          I have read them. Let me ask a few more things, then I will tell you what
          I think we should look at.
        </Bubble>

        {said.map((qa, n) => (
          <Box key={n}>
            <Bubble>{qa.q}</Bubble>
            <Bubble mine>{qa.a}</Bubble>
          </Box>
        ))}

        {!done && (typing ? <Dots /> : <Bubble>{step.q}</Bubble>)}
        {done && typing && <Dots />}
        {done && !typing && (
          <>
            <Bubble>That is everything I need for now. Thank you.</Bubble>
            {/* The consultation must not promise a plan. The clinicians cannot
                write one before they see results, so the last thing said here
                is what actually comes next. */}
            <Bubble>
              I have written up what we discussed, and the blood work I need before
              I can decide on treatment.
            </Bubble>
            <Bubble>Your care brief is ready.</Bubble>
          </>
        )}
      </Box>

      <Box sx={{ px: 2.25, pt: 1.5, pb: 3, flexShrink: 0, borderTop: `1px solid ${C.line}` }}>
        {done ? (
          <Box onClick={onDone} sx={{
            py: 1.55, borderRadius: '999px', textAlign: 'center', cursor: 'pointer',
            bgcolor: C.yellow, color: C.deep, fontSize: 14.5, fontWeight: 700,
          }}>Read my care brief</Box>
        ) : typing ? (
          <Box sx={{ height: 44 }} />
        ) : (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, justifyContent: 'flex-end' }}>
            {step.o.map((o) => (
              <Box key={o}
                onClick={() => { setAnswers((p) => ({ ...p, [step.k]: o })); setI((n) => n + 1); }}
                sx={{
                  px: 1.6, py: 1, borderRadius: '999px', cursor: 'pointer', bgcolor: '#fff',
                  border: '1px solid rgba(27,57,91,.22)',
                  fontSize: 13.5, fontWeight: 500, color: C.deep,
                  '&:active': { bgcolor: 'rgba(27,57,91,.05)' },
                }}>{o}</Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function Bubble({ mine, children }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', mb: 1.2 }}>
      <Box sx={{
        maxWidth: '86%', px: 1.85, py: 1.3, borderRadius: '18px',
        borderBottomRightRadius: mine ? '5px' : '18px',
        borderBottomLeftRadius: mine ? '18px' : '5px',
        bgcolor: mine ? C.deep : '#fff',
        boxShadow: mine ? 'none' : '0 2px 10px -6px rgba(27,57,91,.28)',
      }}>
        <Typography sx={{ fontSize: 13.5, lineHeight: 1.55, color: mine ? '#fff' : C.ink }}>
          {children}
        </Typography>
      </Box>
    </Box>
  );
}

function Dots() {
  return (
    <Box sx={{ display: 'flex', mb: 1.2 }}>
      <Stack direction="row" spacing={0.55} sx={{
        px: 1.7, py: 1.35, borderRadius: '18px', borderBottomLeftRadius: '5px', bgcolor: '#fff',
        boxShadow: '0 2px 10px -6px rgba(27,57,91,.3)',
      }}>
        {[0, 1, 2].map((n) => (
          <Box key={n} sx={{
            width: 6, height: 6, borderRadius: '50%', bgcolor: C.ink2,
            animation: 'cd 1.1s ease-in-out infinite', animationDelay: `${n * 0.16}s`,
            '@keyframes cd': {
              '0%,60%,100%': { opacity: 0.3, transform: 'translateY(0)' },
              '30%': { opacity: 1, transform: 'translateY(-3px)' },
            },
          }} />
        ))}
      </Stack>
    </Box>
  );
}
