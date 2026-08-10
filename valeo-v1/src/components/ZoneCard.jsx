import { Box, Stack, Typography, Divider } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ScienceIcon from '@mui/icons-material/Science';
import WatchOutlinedIcon from '@mui/icons-material/WatchOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import ListAltIcon from '@mui/icons-material/ListAlt';
import EditNoteIcon from '@mui/icons-material/EditNote';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { GRADE_C, PROTOCOLS } from '../data';
import { C } from '../theme';

const KIND = {
  test:     { ic: <ScienceIcon />,           verb: 'Book' },
  supp:     { ic: <MedicationOutlinedIcon />, verb: 'Add' },
  protocol: { ic: <ListAltIcon />,           verb: 'Start' },
  device:   { ic: <WatchOutlinedIcon />,     verb: 'Connect' },
  answer:   { ic: <EditNoteIcon />,          verb: 'Answer' },
  log:      { ic: <EditNoteIcon />,          verb: 'Log' },
};

/**
 * One card that rewrites itself on every zone tap.
 *
 * This replaces three lists — systems, levers and dangers — because all three
 * answered a question the figure already answers better: where is it, and what
 * do I do. A list makes you read twelve rows to find one action. This makes the
 * body the index and the card the answer.
 *
 * Three states, and the unmeasured one is the commercial one: if we cannot see
 * a region, the honest next step and the thing we sell are the same object.
 */
export default function ZoneCard({ zone, worst, onAct }) {
  /* nothing measured in this region — the card becomes the sell, honestly */
  if (zone && !zone.known) {
    return (
      <Shell tone={C.ink2}>
        <Head label={zone.t} right={`${zone.inside.length} systems`} />
        <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.deep, mt: 0.75 }}>
          We can’t see this yet.
        </Typography>
        <Typography sx={{ fontSize: 13, color: C.ink2, mt: 0.6, lineHeight: 1.5 }}>
          {zone.inside.map((r) => r.t).join(', ')} — all of it needs a blood panel before we’ll
          put a grade on it.
        </Typography>
        <Action kind="test" t="Book a blood test"
                sub={`Opens ${zone.inside.length} systems in ${zone.t.toLowerCase()}`}
                onAct={() => onAct({ kind: 'test' })} />
      </Shell>
    );
  }

  if (!worst) return null;

  /* nothing wrong in here — say so and stop. A card that manufactures an action
     for a clean region teaches people to ignore the card. */
  if (!worst.fix) {
    return (
      <Shell tone={C.green}>
        <Head label={zone ? zone.t : 'Biggest lever'} right={worst.src} />
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', mt: 0.75 }}>
          <CheckCircleIcon sx={{ fontSize: 20, color: C.green, flexShrink: 0 }} />
          <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.deep }}>
            Nothing to do here.
          </Typography>
        </Stack>
        <Typography sx={{ fontSize: 13, color: C.ink2, mt: 0.6, lineHeight: 1.5 }}>
          {worst.ref ? `${worst.ref}. ` : ''}{worst.why}
        </Typography>
      </Shell>
    );
  }

  const K = KIND[worst.fix.kind] || KIND.supp;
  const p = worst.fix.protocol ? PROTOCOLS[worst.fix.protocol] : null;

  return (
    <Shell tone={worst.grade ? GRADE_C[worst.grade] : C.ink2}>
      <Head label={zone ? zone.t : 'Biggest lever'} right={worst.src} />

      {/* the status */}
      <Typography sx={{ fontSize: 15.5, fontWeight: 700, color: C.deep, mt: 0.75 }}>
        {worst.ref || `${worst.t} · ${worst.said}`}
      </Typography>

      {/* the problem */}
      <Typography sx={{ fontSize: 13, color: C.ink2, mt: 0.6, lineHeight: 1.5 }}>
        {worst.why}
      </Typography>

      {/* everything else in this region, so the card is not hiding anything */}
      {zone && zone.inside.length > 1 && (
        <Stack direction="row" useFlexGap spacing={0.75} sx={{ flexWrap: 'wrap', mt: 1.25 }}>
          {zone.inside.map((r) => (
            <Stack key={r.k} direction="row" spacing={0.5} sx={{
              alignItems: 'center', px: 0.9, py: 0.4, borderRadius: '7px',
              bgcolor: 'rgba(27,57,91,.05)',
            }}>
              <Typography sx={{ fontSize: 10.5, color: C.ink2 }}>{r.t}</Typography>
              <Typography sx={{
                fontSize: 10.5, fontWeight: 800,
                color: r.grade ? GRADE_C[r.grade] : C.ink2,
              }}>{r.grade || (r.said ? '·' : '—')}</Typography>
            </Stack>
          ))}
        </Stack>
      )}

      <Action kind={worst.fix.kind} t={worst.fix.t}
              sub={p ? `${p.wk} weeks · scored on ${p.mk}` : worst.fix.sub}
              verb={K.verb} onAct={() => onAct(worst.fix)} />
    </Shell>
  );
}

function Shell({ tone, children }) {
  return (
    <Box sx={{
      mt: 1.75, borderRadius: '20px', bgcolor: '#fff', overflow: 'hidden',
      boxShadow: '0 2px 14px -6px rgba(27,57,91,.32)',
      borderLeft: `3px solid ${tone}`,
    }}>
      <Box sx={{ px: 1.9, pt: 1.75, pb: 1.6 }}>{children}</Box>
    </Box>
  );
}

function Head({ label, right }) {
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline' }}>
      <Typography sx={{
        flex: 1, fontSize: 9, fontWeight: 800, letterSpacing: '.14em',
        textTransform: 'uppercase', color: C.ink2,
      }}>{label}</Typography>
      {right && <Typography sx={{ fontSize: 10, color: C.ink2 }}>{right}</Typography>}
    </Stack>
  );
}

/* The action is the point of the card, so it gets full width and a real target. */
function Action({ kind, t, sub, onAct }) {
  const K = KIND[kind] || KIND.supp;
  return (
    <>
      <Box sx={{ mx: -1.9, mt: 1.6 }}><Divider /></Box>
      <Stack direction="row" spacing={1.5} onClick={onAct} sx={{
        alignItems: 'center', mx: -1.9, mb: -1.6, px: 1.9, py: 1.6, cursor: 'pointer',
        bgcolor: 'rgba(255,185,0,.12)',
      }}>
        <Box sx={{
          width: 32, height: 32, borderRadius: '10px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          bgcolor: 'rgba(255,185,0,.28)', color: C.deep,
          '& svg': { fontSize: 17 },
        }}>{K.ic}</Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: C.deep }}>{t}</Typography>
          {sub && (
            <Typography sx={{ fontSize: 11, color: C.ink2, mt: 0.15 }}>{sub}</Typography>
          )}
        </Box>
        <ChevronRightIcon sx={{ fontSize: 19, color: C.yellowDeep, flexShrink: 0 }} />
      </Stack>
    </>
  );
}
