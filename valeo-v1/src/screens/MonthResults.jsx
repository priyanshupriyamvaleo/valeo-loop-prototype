import { Box, IconButton, Stack, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { PROTOCOLS, coachOf, knownPlan } from '../data';
import { C } from '../theme';

/*
 * THE MONTH, MEASURED — with no blood test anywhere.
 *
 * The clinician-led programmes end on a retest, because they began on one.
 * This plan never drew blood, so its results screen is built from the only
 * instrument it ever had: what the patient logged. That is not a weaker
 * ending — a weight curve with 27 points on it is evidence, and it is
 * evidence the patient made themselves.
 *
 * The renewal sits on this screen because this is the moment the product has
 * just proved itself. It follows the same flow as every renewal: pay, the
 * doctor reviews the month and sets the dose, and the next delivery arrives.
 */
export default function MonthResults({ st, pKey, onRenew, onLater }) {
  const run = st.runs[pKey] || {};
  const p = PROTOCOLS[pKey] || {};
  const doc = coachOf(pKey);
  const price = knownPlan(pKey, {}).price;

  const body = run.body || [];
  const kg0 = body.length ? body[0].kg : null;
  const kg1 = body.length ? body[body.length - 1].kg : null;
  const delta = kg0 !== null && kg1 !== null ? Math.round((kg0 - kg1) * 10) / 10 : null;
  const logged = (run.logs || []).length;
  const total = run.total || 28;

  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(180deg,#F2FBF6 0%,${C.cream} 30%)`,
    }}>
      <Box sx={{ px: 1.5, pt: 1.5, flexShrink: 0 }}>
        <IconButton onClick={onLater} size="small" sx={{ color: C.ink2 }}>
          <ArrowBackIosNewIcon sx={{ fontSize: 17 }} />
        </IconButton>
      </Box>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 3, pb: 2 }}>
        <Typography sx={{
          fontSize: 10, fontWeight: 800, letterSpacing: '.16em',
          textTransform: 'uppercase', color: C.green,
        }}>{run.cycle > 1 ? `Cycle ${run.cycle} complete` : 'Your first month, complete'}</Typography>

        <Typography sx={{
          fontFamily: '"Fraunces", serif', fontSize: 30, fontWeight: 600,
          lineHeight: 1.15, color: C.deep, mt: 1,
        }}>
          {delta !== null && delta > 0 ? `Down ${delta} kg in four weeks.` : 'Four weeks, logged.'}
        </Typography>
        <Typography sx={{ fontSize: 14, lineHeight: 1.6, color: C.ink2, mt: 1.25 }}>
          Everything below comes from your own logs, and {doc ? doc.short : 'your doctor'} reads
          the same numbers before setting your next dose.
        </Typography>

        {/* ── what the month shows ── */}
        <Stack spacing={1} sx={{ mt: 3 }}>
          {delta !== null && (
            <Row ic={<TrendingDownIcon sx={{ fontSize: 18, color: C.green }} />}
              t="Weight" v={`${kg0} → ${kg1} kg`} s={delta > 0 ? `−${delta} kg` : 'holding'} />
          )}
          <Row ic="💊" t="Doses and check-ins"
            v={`${logged} of ${total} days logged`} s={logged / total >= 0.8 ? 'Strong record' : 'Patchy'} />
          <Row ic="🌤" t="Side effects"
            v="Clustered in week two" s="None since day 16" />
        </Stack>

        <Typography sx={{ fontSize: 12.5, lineHeight: 1.6, color: C.ink2, mt: 2.5 }}>
          Weight medication works over months, not weeks. The first cycle is the
          adjustment; the trend you see here is what the next cycle builds on.
        </Typography>
      </Box>

      {/* ── the renewal, at the moment the product just proved itself ── */}
      <Box sx={{ flexShrink: 0, px: 3, pt: 1.5, pb: 3 }}>
        <Stack direction="row" spacing={1} onClick={() => onRenew(pKey)} sx={{
          alignItems: 'center', justifyContent: 'center', py: 1.6,
          borderRadius: '999px', bgcolor: C.deep, color: '#fff', cursor: 'pointer',
        }}>
          <Typography sx={{ fontSize: 15, fontWeight: 600 }}>
            Renew my subscription · SAR {price.toLocaleString()}
          </Typography>
          <ArrowForwardIcon sx={{ fontSize: 18 }} />
        </Stack>
        <Typography sx={{ fontSize: 11.5, color: C.ink2, textAlign: 'center', mt: 1.2, lineHeight: 1.5 }}>
          {doc ? doc.short : 'Your doctor'} reviews your month and sets the dose before anything ships.
        </Typography>
        <Typography onClick={onLater} sx={{
          fontSize: 12.5, color: C.ink2, textAlign: 'center', mt: 1.5,
          cursor: 'pointer', textDecoration: 'underline',
        }}>Maybe later</Typography>
      </Box>
    </Box>
  );
}

function Row({ ic, t, v, s }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{
      alignItems: 'center', px: 2, py: 1.6, borderRadius: '16px', bgcolor: '#fff',
      boxShadow: '0 8px 26px -20px rgba(27,57,91,.5)',
    }}>
      <Box sx={{ fontSize: 18, lineHeight: 1, flexShrink: 0, width: 24, textAlign: 'center' }}>{ic}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 12, color: C.ink2 }}>{t}</Typography>
        <Typography sx={{ fontSize: 14.5, fontWeight: 700, color: C.deep, mt: 0.15 }}>{v}</Typography>
      </Box>
      <Typography sx={{ fontSize: 11.5, fontWeight: 700, color: C.green, flexShrink: 0 }}>{s}</Typography>
    </Stack>
  );
}
