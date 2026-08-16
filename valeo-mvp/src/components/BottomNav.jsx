import { Box, Stack, Typography } from '@mui/material';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import BlurOnOutlinedIcon from '@mui/icons-material/BlurOn';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import { C } from '../theme';

const ALL_TABS = [
  /* phase 1 has no deck to explore, so the shortlist takes the first slot —
     the same position discovery occupies later, so the shape of the app does
     not move under a user when phase 2 ships */
  { k: 'plan',      t: 'My Program', Icon: ChecklistOutlinedIcon },
  { k: 'discover',  t: 'Discover',  Icon: ExploreOutlinedIcon },
  { k: 'today',     t: 'Today',     Icon: TodayOutlinedIcon },
  { k: 'protocols', t: 'Protocols', Icon: ListAltOutlinedIcon },
  { k: 'twin',      t: 'Twin',      Icon: BlurOnOutlinedIcon },
];

/** Dark-aware so it survives the Advanced/Elite palette. `tabs` is the phase's
    tab set — the nav does not decide what a phase includes. */
export default function BottomNav({ active, onGo, dark, badge = {}, tabs, onHome }) {
  const TABS = ALL_TABS.filter((x) => (tabs || ALL_TABS.map((y) => y.k)).includes(x.k));
  return (
    <Stack direction="row" sx={{
      flexShrink: 0, pt: 1, pb: 2.5, px: 0.5,
      borderTop: `1px solid ${dark ? 'rgba(255,255,255,.10)' : C.line}`,
      bgcolor: dark ? 'rgba(8,16,28,.9)' : C.cream,
      backdropFilter: 'blur(12px)',
    }}>
      {onHome && (
        <Box onClick={onHome} sx={{
          flex: 1, minWidth: 0, py: 0.5, cursor: 'pointer', textAlign: 'center',
        }}>
          <ArrowBackIosNewIcon sx={{
            fontSize: 19, color: dark ? 'rgba(255,255,255,.4)' : C.ink2,
          }} />
          <Typography sx={{
            fontSize: 10, fontWeight: 500, mt: 0.2,
            color: dark ? 'rgba(255,255,255,.4)' : C.ink2,
          }}>Valeo</Typography>
        </Box>
      )}
      {TABS.map(({ k, t, Icon }) => {
        const on = active === k;
        return (
          <Box key={k} onClick={() => onGo(k)} sx={{
            flex: 1, minWidth: 0, py: 0.5, cursor: 'pointer', textAlign: 'center',
            position: 'relative',
          }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
              <Icon sx={{
                fontSize: 23,
                color: on ? (dark ? C.yellow : C.deep) : (dark ? 'rgba(255,255,255,.4)' : C.ink2),
              }} />
              {badge[k] > 0 && (
                <Box sx={{
                  position: 'absolute', top: -2, right: -7, minWidth: 15, height: 15,
                  px: 0.4, borderRadius: '8px', bgcolor: C.yellow, color: C.deep,
                  fontSize: 9.5, fontWeight: 800, lineHeight: '15px',
                }}>{badge[k]}</Box>
              )}
            </Box>
            <Typography sx={{
              fontSize: 10, fontWeight: on ? 700 : 500, mt: 0.2,
              color: on ? (dark ? '#fff' : C.deep) : (dark ? 'rgba(255,255,255,.45)' : C.ink2),
            }}>{t}</Typography>
          </Box>
        );
      })}
    </Stack>
  );
}
