import { Box } from '@mui/material';
import { C } from '../theme';

/**
 * MARKS THE ICON SET DOES NOT CARRY.
 *
 * Three glyphs live here because Material has no version of them that says the
 * right thing. Material's nearest nurse is a syringe and its nearest blood tube
 * is a laboratory flask; both read as "procedure" where these have to read as
 * "a person is coming to your home, and it is quick". A stethoscope it does not
 * have at all.
 *
 * All three are outline-only at the same 1.4 stroke as the Material outlined
 * set, so they sit in a row with real icons without announcing that they were
 * drawn by hand. Colour is a prop rather than `currentColor` because every
 * caller so far wants the gold, and a default beats five call sites repeating
 * it.
 */

export function HouseHeartMark({ size = 30, color = C.yellowDeep }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" fill="none" aria-hidden
      sx={{ width: size, height: size, display: 'block' }}>
      <path d="M3.6 10.2 12 3.5l8.4 6.7v9.1a1.2 1.2 0 0 1-1.2 1.2H4.8a1.2 1.2 0 0 1-1.2-1.2z"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 17.4c-.15 0-2.9-1.7-2.9-3.6a1.55 1.55 0 0 1 2.9-.8 1.55 1.55 0 0 1 2.9.8c0 1.9-2.75 3.6-2.9 3.6z"
        stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </Box>
  );
}

export function NurseMark({ size = 26, color = C.yellowDeep }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" fill="none" aria-hidden
      sx={{ width: size, height: size, display: 'block' }}>
      <path d="M5.6 8.4 6.4 4.6a1 1 0 0 1 .98-.8h9.24a1 1 0 0 1 .98.8l.8 3.8"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 5.9h2M12 4.9v2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5.6 8.4h12.8v3.2a6.4 6.4 0 0 1-12.8 0z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.7 13.4c.6.7 1.4 1.05 2.3 1.05s1.7-.35 2.3-1.05"
        stroke={color} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 21.2c1.1-2.5 4.2-3.8 8-3.8s6.9 1.3 8 3.8"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Box>
  );
}

export function VialMark({ size = 26, color = C.yellowDeep }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" fill="none" aria-hidden
      sx={{ width: size, height: size, display: 'block' }}>
      <rect x="8.4" y="2.8" width="7.2" height="18.4" rx="3.6"
        stroke={color} strokeWidth="1.4" />
      <path d="M8.4 6.6h7.2" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8.4 11.4h7.2v6.2a3.6 3.6 0 0 1-7.2 0z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    </Box>
  );
}

/* The one filled drawing in the set, and the only place the product ever shows
   blood. It sits beside "we're analysing your sample", where the thing being
   analysed is the subject of the sentence — an outline tube there reads as a
   button rather than as the patient's own sample in a lab. */
export function BloodTubeArt({ size = 74 }) {
  return (
    <Box component="svg" viewBox="0 0 60 96" fill="none" aria-hidden
      sx={{ width: size * 0.62, height: size, display: 'block' }}>
      <rect x="19" y="3" width="22" height="11" rx="3" fill="#F0A800" />
      <rect x="21" y="12" width="18" height="78" rx="9"
        fill="#FBFAF6" stroke="rgba(27,57,91,.18)" strokeWidth="1.6" />
      <path d="M21 46h18v35a9 9 0 0 1-18 0z" fill="#C4432F" />
      <path d="M21 46h18v7H21z" fill="#D8543D" />
      <rect x="25" y="20" width="4" height="16" rx="2" fill="rgba(255,255,255,.75)" />
    </Box>
  );
}

export function SparkMark({ size = 16, color = C.yellow }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" aria-hidden
      sx={{ width: size, height: size, display: 'block' }}>
      <path d="M12 2.5c.5 4.6 1.9 6 6.5 6.5-4.6.5-6 1.9-6.5 6.5-.5-4.6-1.9-6-6.5-6.5 4.6-.5 6-1.9 6.5-6.5z"
        fill={color} />
    </Box>
  );
}

export function StethoscopeMark({ size = 22, color = C.yellowDeep }) {
  return (
    <Box component="svg" viewBox="0 0 24 24" fill="none" aria-hidden
      sx={{ width: size, height: size, display: 'block' }}>
      <path d="M6 3v5a4 4 0 0 0 8 0V3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4.8 3h2.4M12.8 3h2.4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 12v2.6a4.4 4.4 0 0 0 8.8 0V13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18.8" cy="10.8" r="2.2" stroke={color} strokeWidth="1.5" />
    </Box>
  );
}
