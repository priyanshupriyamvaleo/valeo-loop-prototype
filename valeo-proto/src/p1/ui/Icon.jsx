/* Dependency-free glyphs. A dozen strokes, no icon package. */
const P = {
  home:'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5', users:'M16 20v-2a4 4 0 0 0-8 0v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  cart:'M3 4h2l2.5 11h10L20 7H6M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2m8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  clipboard:'M9 4h6v3H9zM7 5H5v16h14V5h-2', box:'M3 8l9-4 9 4-9 4zM3 8v8l9 4 9-4V8',
  flask:'M9 3v6L4 20h16L15 9V3M8 3h8', heart:'M12 20s-7-4.5-7-9a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 4.5-7 9-7 9',
  chat:'M4 5h16v11H9l-5 4z', gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M4 12h2m12 0h2M12 4v2m0 12v2',
  lock:'M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3', tag:'M3 12l9-9h8v8l-9 9zM16 8h.01',
  route:'M6 20V9a3 3 0 0 1 3-3h6a3 3 0 0 0 3-3M6 20h.01M18 3h.01', star:'M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.6l1.1-6L3.4 9.4l6-.8z',
  truck:'M3 6h11v10H3zM14 9h4l3 3v4h-7M6 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m11 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
  steth:'M6 3v6a4 4 0 0 0 8 0V3M10 13v3a4 4 0 0 0 8 0v-2M18 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3',
  globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18',
  activity:'M3 12h4l3 8 4-16 3 8h4', layers:'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  hash:'M6 9h12M6 15h12M10 4l-2 16M16 4l-2 16', shake:'M4 12l4-4 4 4 4-4 4 4M4 16h16',
  mega:'M4 10v4h4l6 4V6l-6 4z', refresh:'M4 12a8 8 0 0 1 13-6M20 12a8 8 0 0 1-13 6M17 3v3h-3M7 21v-3h3',
  plus:'M12 5v14M5 12h14', up:'M12 5v14M6 11l6-6 6 6', down:'M12 5v14M6 13l6 6 6-6',
  trash:'M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13', pencil:'M4 20h4L19 9l-4-4L4 16z',
  check:'M4 12l5 5L20 6', chev:'M9 5l7 7-7 7', back:'M15 5l-7 7 7 7',
  bolt:'M13 3L5 14h6l-1 7 8-11h-6z', spark:'M12 3v5m0 8v5M3 12h5m8 0h5M6 6l3 3m6 6l3 3M18 6l-3 3M9 15l-3 3',
  scale:'M12 3v18M6 7l-3 6h6zM18 7l-3 6h6zM7 3h10', eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7m10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6',
  send:'M4 12l16-8-6 16-2-6z', panel:'M4 4h16v16H4zM10 4v16',
};
export default function Icon({ name, size = 15, stroke = 1.7, className = '' }) {
  const d = P[name] || P.box;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  );
}
