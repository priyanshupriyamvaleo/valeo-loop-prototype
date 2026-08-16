import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedIcon from '@mui/icons-material/Verified';
import { COACHES, USER } from '../data';
import { C } from '../theme';

/*
 * THE NO, WHICH IS NOT A DEAD END.
 *
 * A refusal delivered by a form is the worst version of this moment: the
 * patient is told no by something that cannot explain itself. So the answer
 * comes back in the doctor's own words, inside the same thread they were
 * already having, and it is followed immediately by somewhere else to go.
 *
 * The ordering matters. The reason first, because it is owed. The alternative
 * second, because a person who has just been refused will not read past their
 * disappointment until it has been addressed.
 */
const GOALS = [
  { k: 'energy', ic: '⚡️', t: 'Energy and tiredness',
    s: 'Bloods first, then a doctor reads them with you.' },
  { k: 'longevity', ic: '🧬', t: 'A full health check',
    s: 'The wide panel, and a plan built on what it finds.' },
  { k: 'skin', ic: '✨', t: 'Skin and hair',
    s: 'A dermatology-led review.' },
  { k: 'weight', ic: '⚖️', t: 'Weight, another way',
    s: 'Coaching and nutrition, without medication.' },
];

export default function Declined({ message, onPick, onBack }) {
  const doc = COACHES.C_LAYLA;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: C.cream }}>
      <Box sx={{ px: 1.5, pt: 1.5, flexShrink: 0 }}>
        <IconButton onClick={onBack} size="small" sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 3, pb: 2 }}>
        {/* the doctor, speaking */}
        <Stack direction="row" spacing={1.4} sx={{ alignItems: 'center', mt: 1 }}>
          <Box sx={{
            width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
            background: `linear-gradient(155deg,${doc.tone} 0%,rgba(11,21,34,.72) 145%)`,
          }}>
            {doc.img && <Box component="img" src={doc.img} alt="" sx={{
              width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 18%',
            }} />}
          </Box>
          <Box>
            <Typography sx={{ fontSize: 14, fontWeight: 700, color: C.deep }}>{doc.name}</Typography>
            <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center', mt: 0.2 }}>
              <VerifiedIcon sx={{ fontSize: 11.5, color: C.teal }} />
              <Typography sx={{ fontSize: 11, color: C.ink2 }}>{doc.role}</Typography>
            </Stack>
          </Box>
        </Stack>

        {/* the message, as a message */}
        <Box sx={{
          mt: 2, px: 2.25, py: 2, bgcolor: '#fff', borderRadius: '18px',
          borderTopLeftRadius: '6px', boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
        }}>
          <Typography sx={{ fontSize: 15, lineHeight: 1.6, color: C.ink }}>
            {message || `Thank you for your time, ${USER.first}. Having gone through your answers with you, GLP-1 is not the right treatment for you at the moment, and I would not feel right prescribing it.`}
          </Typography>
          <Typography sx={{ fontSize: 15, lineHeight: 1.6, color: C.ink, mt: 1.5 }}>
            That does not mean there is nothing here for you. There are other ways we
            can help, and I have written up everything we discussed so whoever picks
            this up already knows your story.
          </Typography>
        </Box>

        <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 1.25 }}>
          Nothing was charged. Your consultation was included.
        </Typography>

        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 21, fontWeight: 600,
          lineHeight: 1.3, color: C.deep, mt: 4,
        }}>
          Where would you like to go next?
        </Typography>

        <Stack spacing={1} sx={{ mt: 1.75 }}>
          {GOALS.map((g) => (
            <Stack key={g.k} direction="row" spacing={1.5} onClick={() => onPick(g.k)} sx={{
              alignItems: 'center', px: 2, py: 1.6, borderRadius: '16px', cursor: 'pointer',
              bgcolor: '#fff', border: '1.5px solid rgba(27,57,91,.10)',
              transition: 'border-color .18s', '&:hover': { borderColor: C.yellow },
            }}>
              <Box sx={{ fontSize: 20, lineHeight: 1 }}>{g.ic}</Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: 14.5, fontWeight: 600, color: C.deep }}>{g.t}</Typography>
                <Typography sx={{ fontSize: 11.5, color: C.ink2, mt: 0.2 }}>{g.s}</Typography>
              </Box>
              <ArrowForwardIcon sx={{ fontSize: 17, color: C.ink2 }} />
            </Stack>
          ))}
        </Stack>

        <Typography sx={{ fontSize: 12.5, color: C.ink2, mt: 2.5, lineHeight: 1.6 }}>
          Or leave it for now. We will keep your answers, and you can pick this up
          whenever you want.
        </Typography>
      </Box>
    </Box>
  );
}
