import { Box, InputBase, Stack, Typography } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import MonitorWeightOutlinedIcon from '@mui/icons-material/MonitorWeightOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import VaccinesOutlinedIcon from '@mui/icons-material/VaccinesOutlined';
import MedicationOutlinedIcon from '@mui/icons-material/MedicationOutlined';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import ChildFriendlyOutlinedIcon from '@mui/icons-material/ChildFriendlyOutlined';
import StethoscopeIcon from '@mui/icons-material/MedicalServicesOutlined';
import ElderlyOutlinedIcon from '@mui/icons-material/ElderlyOutlined';
import ProtocolCard from '../components/ProtocolCard';
import { USER, VALEO_SERVICES } from '../data';
import { C } from '../theme';

const ICONS = {
  labs: ScienceOutlinedIcon, weight: MonitorWeightOutlinedIcon, iv: WaterDropOutlinedIcon,
  pep: VaccinesOutlinedIcon, supp: MedicationOutlinedIcon, hair: ContentCutOutlinedIcon,
  baby: ChildFriendlyOutlinedIcon, doc: StethoscopeIcon, elder: ElderlyOutlinedIcon,
};

/**
 * VALEO'S EXISTING HOME — the host, not our screen.
 *
 * Reproduced as reference so the handoff shows protocols living *inside* the app
 * Valeo already ships rather than beside it. Everything here except the protocol
 * card is theirs and is out of scope: the services grid, the search, the five-tab
 * nav are all inert.
 *
 * The card sits directly under the greeting and above the services grid, and that
 * position is the argument. Below the grid it becomes a promotion nobody scrolls
 * to. Above the greeting it displaces the host's own identity. Between them it
 * reads as "your thing, then our shop" — which is the correct hierarchy for a
 * returning user with a protocol in flight, and the only placement where an open
 * loop is unmissable without hijacking the page.
 */
export default function ValeoHome({ st, onGo, onServices, phase = 1 }) {
  return (
    <Box sx={{
      height: '100%', display: 'flex', flexDirection: 'column',
      background: `linear-gradient(180deg,#FDF3DE 0%,${C.cream} 22%)`,
    }}>
      {/* ── host chrome ── */}
      <Stack direction="row" sx={{ alignItems: 'center', px: 2.25, pt: 1.75, pb: 1.5, flexShrink: 0 }}>
        <Box sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: 15, fontWeight: 700, color: C.deep }}>Valeo</Typography>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <MoreHorizIcon sx={{ fontSize: 20, color: C.deep }} />
        </Box>
      </Stack>

      <Box sx={{ flex: '1 1 auto', overflowY: 'auto', px: 2.25, pb: 2 }}>
        <Stack direction="row" spacing={1} sx={{
          alignItems: 'center', px: 1.75, py: 1.35, borderRadius: '999px', bgcolor: '#fff',
          border: '1px solid rgba(27,57,91,.08)',
        }}>
          <SearchIcon sx={{ fontSize: 19, color: C.ink2, flexShrink: 0 }} />
          <InputBase readOnly placeholder='Search "Blood tests"'
            sx={{ flex: 1, fontSize: 13.5, '& input::placeholder': { color: C.ink2, opacity: 1 } }} />
          <TuneIcon sx={{ fontSize: 18, color: C.deep, flexShrink: 0 }} />
        </Stack>

        <Typography sx={{ fontSize: 21, color: C.deep, mt: 2.25, mb: 1.75 }}>
          Hi <b>{USER.first},</b> Welcome back
        </Typography>

        {/* ── ours ── */}
        <ProtocolCard st={st} onGo={onGo} phase={phase} />

        <Typography sx={{
          fontSize: 10.5, fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase',
          color: C.ink2, mt: 3, mb: 1.5,
        }}>Healthcare services at your doorstep</Typography>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.25 }}>
          {VALEO_SERVICES.map((sv) => {
            const Icon = ICONS[sv.k];
            return (
              <Stack key={sv.k} onClick={onServices} sx={{
                alignItems: 'center', py: 1.75, px: 0.5, borderRadius: '16px', cursor: 'pointer',
                bgcolor: '#fff', border: '1px solid rgba(27,57,91,.07)',
              }}>
                <Box sx={{
                  width: 42, height: 42, borderRadius: '12px', mb: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: 'rgba(255,185,0,.18)', color: C.deep,
                }}><Icon sx={{ fontSize: 21 }} /></Box>
                <Typography sx={{
                  fontSize: 11.5, fontWeight: 700, color: C.deep, textAlign: 'center',
                  lineHeight: 1.3,
                }}>{sv.t}</Typography>
              </Stack>
            );
          })}
        </Box>
      </Box>

      {/* ── host nav, inert: this is Valeo's, and none of it is our scope ── */}
      <Stack direction="row" sx={{
        flexShrink: 0, pt: 1, pb: 2.5, px: 0.5, alignItems: 'flex-end',
        borderTop: `1px solid ${C.line}`, bgcolor: C.cream,
      }}>
        {[['Services', ScienceOutlinedIcon], ['Supplements', MedicationOutlinedIcon],
          ['Home', null], ['Results', MonitorWeightOutlinedIcon],
          ['Cart', null]].map(([t, Icon]) => {
          const home = t === 'Home';
          return (
            <Stack key={t} sx={{ flex: 1, minWidth: 0, alignItems: 'center', pb: home ? 0 : 0.5 }}>
              {home ? (
                <Box sx={{
                  width: 42, height: 42, borderRadius: '13px', mb: 0.4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  bgcolor: C.yellow, color: C.deep, fontSize: 19, fontWeight: 800,
                }}>V</Box>
              ) : (
                Icon ? <Icon sx={{ fontSize: 20, color: C.ink2 }} />
                  : <Box sx={{ fontSize: 18, color: C.ink2, lineHeight: '20px' }}>🛒</Box>
              )}
              <Typography sx={{
                fontSize: 10, fontWeight: home ? 700 : 500,
                color: home ? C.deep : C.ink2,
              }}>{t}</Typography>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}
