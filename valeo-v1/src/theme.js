import { createTheme } from '@mui/material/styles';

/* Valeo palette — carried over from the design system unchanged. */
export const C = {
  deep: '#1B395B',
  deep2: '#254A73',
  yellow: '#FFB900',
  yellowDeep: '#E0A400',
  green: '#27995B',
  greenSoft: '#E3F3E9',
  teal: '#408FA4',
  tealSoft: '#E2F0F4',
  mint: '#FDF1CC',
  cream: '#FFFDF5',
  ink: '#22354C',
  ink2: '#5E6E82',
  coral: '#E94F5F',
  line: '#F0E7D0',
  night: '#0E1B2C',
  night2: '#0A1522',
};

const display = '"Fraunces", Georgia, serif';
const ui = '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
/* Live readouts only — scores, gauges, counters. Squared and mechanical, which
   is what makes a number feel measured rather than written. */
export const meter = '"Chakra Petch", "Poppins", sans-serif';

const theme = createTheme({
  palette: {
    primary:   { main: C.deep, contrastText: '#fff' },
    secondary: { main: C.yellow, contrastText: C.deep },
    success:   { main: C.green },
    error:     { main: C.coral },
    background:{ default: C.cream, paper: '#fff' },
    text:      { primary: C.ink, secondary: C.ink2 },
    divider:   'rgba(27,57,91,0.10)',
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: ui,
    /* Display sizes are deliberately tight — a mobile hero, not a poster. */
    h1: { fontFamily: display, fontWeight: 600, fontSize: 34, lineHeight: 1.08, letterSpacing: '-0.02em' },
    h2: { fontFamily: display, fontWeight: 600, fontSize: 27, lineHeight: 1.14, letterSpacing: '-0.015em' },
    h3: { fontFamily: display, fontWeight: 600, fontSize: 22, lineHeight: 1.2 },
    body1: { fontSize: 14.5, lineHeight: 1.5 },
    body2: { fontSize: 12.5, lineHeight: 1.5 },
    button: { textTransform: 'none', fontWeight: 700, fontSize: 16 },
    /* the small tracked label used throughout */
    overline: { fontFamily: ui, fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', lineHeight: 1.4 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { background: C.cream, WebkitFontSmoothing: 'antialiased' },
        '*::-webkit-scrollbar': { display: 'none' },
        '*': { scrollbarWidth: 'none' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 15, minHeight: 54, paddingInline: 22 },
        containedSecondary: {
          boxShadow: '0 12px 28px -12px rgba(255,185,0,.55)',
          '&:hover': { background: C.yellowDeep },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          height: 40,
          borderRadius: 999,
          fontSize: 13.5,
          fontWeight: 500,
          paddingInline: 4,
          background: 'rgba(27,57,91,0.06)',
          '& .MuiChip-label': { paddingInline: 14 },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { height: 3, borderRadius: 2, background: 'rgba(27,57,91,0.12)' },
        bar: { borderRadius: 2, background: C.yellow },
      },
    },
  },
});

export default theme;
