import { useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { C } from '../theme';

const ROW = 52;

/**
 * Wheel picker. Scroll-snap does the physics; we read the centred row.
 * Width is always 100% of its flex slot with minWidth 0, so two of these
 * side by side can never overflow the viewport.
 */
export default function Drum({ from, to, value, onChange, suffix, height = 260 }) {
  const ref = useRef(null);
  const vals = [];
  for (let v = from; v <= to; v += 1) vals.push(v);
  const pad = (height - ROW) / 2;

  /* Set the initial scroll after layout. Inside an animating Drawer the
     element has no scroll height on the first frame, so a synchronous
     scrollTop is silently dropped and the wheel opens on its lowest value. */
  useEffect(() => {
    const i = vals.indexOf(value);
    if (i < 0) return;
    let raf2;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (ref.current) ref.current.scrollTop = i * ROW;
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const i = Math.max(0, Math.min(vals.length - 1, Math.round(el.scrollTop / ROW)));
    if (vals[i] !== value) onChange(vals[i]);
  };

  return (
    <Box sx={{ position: 'relative', height, flex: '1 1 0', minWidth: 0, overflow: 'hidden' }}>
      {/* the selected row's card — must sit above the page, below the text */}
      <Box sx={{
        position: 'absolute', left: 0, right: 0, top: pad, height: ROW, borderRadius: '14px',
        bgcolor: '#fff', boxShadow: '0 4px 14px -5px rgba(27,57,91,.2)', zIndex: 0,
      }} />
      <Box ref={ref} onScroll={onScroll} sx={{
        position: 'relative', zIndex: 1, height, overflowY: 'scroll',
        scrollSnapType: 'y mandatory', py: `${pad}px`,
      }}>
        {vals.map((v) => {
          const on = v === value;
          return (
            <Box key={v} sx={{
              height: ROW, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 0.7, scrollSnapAlign: 'center',
              opacity: on ? 1 : 0.32, transition: 'opacity .18s',
            }}>
              <Typography sx={{
                fontSize: on ? 30 : 21, fontWeight: on ? 700 : 400,
                color: on ? C.deep : C.ink2, lineHeight: 1, transition: 'font-size .18s',
              }}>{v}</Typography>
              {suffix && (
                <Typography sx={{ fontSize: 13, color: C.ink2, fontWeight: 500 }}>{suffix}</Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
