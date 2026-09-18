/* ══ THE BLOOD PANELS ══════════════════════════════════════════════════════
 *
 * Moved out of `p1/screens/Actions.jsx`, where the markers sat inside a patient
 * SCREEN and were imported from there by the coach panel. A number a doctor
 * reads should not live in a phone component.
 *
 * TWO PANELS, NOT ONE. A single reading is a reading; two are a trend, and a
 * trend is the thing a consultation is actually about. The baseline is the one
 * the patient has already seen; the retest is what week 12 returns.
 *
 * NUMERIC BOUNDS, NOT A SENTENCE. The old rows carried `ref: 'under 3.0'` —
 * fine to print, impossible to draw. `lo` and `hi` let a screen show WHERE a
 * value sits in its band instead of asking a doctor to compare two strings.
 * Either side may be absent: "under 3.0" is `{ hi: 3 }` and that is honest,
 * because no lab publishes a lower bound for hs-CRP.
 *
 * ⚠️ Values and ranges are placeholders pending clinical sign-off. Every
 * surface that renders them says so. They are shaped like real results so the
 * screens are real; they are not clinical advice.
 */

/** One marker row. `lo`/`hi` are the reference band; either may be undefined. */
const m = (t, v, u, lo, hi, ref) => ({ t, v, u, lo, hi, ref, flag: flagOf(v, lo, hi) });

/**
 * WHERE THE FLAG COMES FROM.
 *
 * Derived from the bounds, never typed beside them. The old rows carried both a
 * range and a hand-written flag, so a range could be edited and the flag left
 * saying the opposite — and nothing would have caught it.
 */
export function flagOf(v, lo, hi) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 'ok';
  if (lo !== undefined && n < lo) return 'low';
  if (hi !== undefined && n > hi) return 'high';
  return 'ok';
}

/* ── THE PANELS, NEWEST LAST ──
   Ordered oldest first so `at(-1)` is always the current one and the baseline
   is always `[0]`. A screen reading them backwards would compare a retest
   against itself. */
export const PANELS = [
  {
    id: 'pnl-baseline',
    label: 'Recovery and Inflammation Panel',
    role: 'Baseline',
    collectedOn: '12 Mar 2026',
    rows: [
      m('hs-CRP', '6.8', 'mg/L', undefined, 3.0, 'under 3.0'),
      m('ESR', '24', 'mm/hr', undefined, 15, 'under 15'),
      m('Vitamin D', '28', 'nmol/L', 75, 125, '75 to 125'),
      m('Ferritin', '88', 'ug/L', 30, 400, '30 to 400'),
      m('Creatine kinase', '340', 'U/L', undefined, 200, 'under 200'),
      m('Magnesium', '0.78', 'mmol/L', 0.7, 1.0, '0.7 to 1.0'),
    ],
  },
  {
    id: 'pnl-retest',
    label: 'Recovery and Inflammation Panel',
    role: 'Retest',
    collectedOn: '04 Jun 2026',
    rows: [
      m('hs-CRP', '4.1', 'mg/L', undefined, 3.0, 'under 3.0'),
      m('ESR', '18', 'mm/hr', undefined, 15, 'under 15'),
      m('Vitamin D', '41', 'nmol/L', 75, 125, '75 to 125'),
      m('Ferritin', '96', 'ug/L', 30, 400, '30 to 400'),
      m('Creatine kinase', '210', 'U/L', undefined, 200, 'under 200'),
      m('Magnesium', '0.85', 'mmol/L', 0.7, 1.0, '0.7 to 1.0'),
    ],
  },
];

/** The panel a screen means when it says "the results". */
export const latestPanel = () => PANELS[PANELS.length - 1];

/** The one before it, or null when there is only one on file. */
export const priorPanel = () => (PANELS.length > 1 ? PANELS[PANELS.length - 2] : null);

/**
 * BACKWARD COMPATIBILITY. `PANEL` was a flat array and two screens import it by
 * that name. It stays, pointing at the current panel's rows, so the patient's
 * own report is untouched by this move.
 */
export const PANEL = latestPanel().rows;

/** How many markers are outside their band. */
export const outOfRange = (rows) => rows.filter((r) => r.flag !== 'ok').length;

/** The same marker in an earlier panel, for a delta. */
export const priorRow = (panel, name) =>
  (panel ? panel.rows.find((r) => r.t === name) : undefined);

/**
 * WHERE A VALUE SITS IN ITS BAND, as a percentage across a drawable track.
 *
 * An open-ended band has no width, so one is invented: the missing side gets
 * 40% of the span it does have, and the reading is clamped inside. That is a
 * DRAWING decision and it is deliberately generous — a bar that pins a
 * high reading to the far edge says "off the scale", which is what it means.
 *
 * Returns the band's own start and end as well, because a caller drawing the
 * track needs to label the ends with the numbers the bar actually used.
 */
export function bandPosition(row) {
  const n = Number(row.v);
  if (!Number.isFinite(n)) return null;
  const { lo, hi } = row;
  if (lo === undefined && hi === undefined) return null;
  const span = lo !== undefined && hi !== undefined ? hi - lo : Math.abs(lo ?? hi) || 1;
  const pad = span * 0.4;
  const from = lo !== undefined ? lo - pad : Math.min(n, hi - pad);
  const to = hi !== undefined ? hi + pad : Math.max(n, lo + pad);
  /* Clamped just inside the track, not to its very edge: a tick at 0% is half
     outside its own bar and reads as a rendering fault rather than as a reading
     off the end of the scale. */
  const pct = (x) => Math.max(1, Math.min(99, ((x - from) / (to - from)) * 100));
  return {
    from, to,
    value: pct(n),
    bandStart: lo !== undefined ? pct(lo) : 0,
    bandEnd: hi !== undefined ? pct(hi) : 100,
  };
}
