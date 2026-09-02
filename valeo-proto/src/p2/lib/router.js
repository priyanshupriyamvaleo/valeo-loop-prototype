import { useEffect, useState } from 'react';

/* Hash routing, twenty lines. #/protocols, #/p/<protocolId>/<tab>, #/clinician/... */
export const go = (path) => { window.location.hash = path; };

export function useRoute() {
  const read = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const [parts, setParts] = useState(read);
  useEffect(() => {
    const on = () => setParts(read());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}
