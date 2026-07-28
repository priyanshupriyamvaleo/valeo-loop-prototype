import { Box, Stack, Typography } from '@mui/material';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import TodayOutlinedIcon from '@mui/icons-material/TodayOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import BlurOnOutlinedIcon from '@mui/icons-material/BlurOn';
import { C } from '../theme';

const TABS = [
  { k: 'discover',  t: 'Discover',  Icon: ExploreOutlinedIcon },
  { k: 'today',     t: 'Today',     Icon: TodayOutlinedIcon },
  { k: 'protocols', t: 'Protocols', Icon: ListAltOutlinedIcon },
  { k: 'twin',      t: 'Twin',      Icon: BlurOnOutlinedIcon },
];

/** Four tabs, dark-aware so it survives the Advanced/Elite palette. */
export default function BottomNav({ active, onGo, dark, badge = {} }) {
  return (
    <Stack direction="row" sx={{
      flexShrink: 0, pt: 1, pb: 2.5, px: 0.5,
      borderTop: `1px solid ${dark ? 'rgba(255,255,255,.10)' : C.line}`,
      bgcolor: dark ? 'rgba(8,16,28,.9)' : C.cream,
      backdropFilter: 'blur(12px)',
    }}>
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
