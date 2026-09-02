/* Every helper this refactor introduced, and every file that uses one must
   import it. esbuild bundles an undefined identifier without complaint — it is
   a runtime ReferenceError — so this is the check that catches it. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const HELPERS = ['money','priceOf','inRegion','ccyOf','regionOf','REGIONS','invoiceOf',
  'packagePrice','serviceGroupsFor','membersOf','memberOf','scopeFor','protocolFor',
  'protocolsOf','stageOf','landingTab','weeksOf','PANEL','findService','suggestGoal',
  'goalOf','GOALS','GATES','SHARED','publishedFor','readPatient','writePatient',
  'subscribe','readStudio','writeStudio','resetAll','PATIENTS','SERVICES','ORDERS',
  'ORDER_CATEGORIES','COACHES','orderFor','RR_PLAN','PROTOCOL_SEED','STEPS',
  'newProtocolDraft','emptyDraft','recoveryScore','captures','weekOfDay','planFor',
  'nextItem','consultFor','progress','weekOf','isPatientMove','soon','stateOf',
  'actorOf','actorInitial','whenLabel','weekNo','drift','serviceForStep','packageFor',
  'medicinesFor','pausedBy','bookingCompletes','dayAfter','gateFor','gateOpen',
  'WL_MODULES','WL_ENTRIES','archetypeOf','LIVE_PATIENT','useStudio','pubState',
  'publishBlockers','StudioProvider','useRoute','go','Icon','Field','Chip','Note',
  'IconBtn','SERVICE_GROUPS','LOCKED_RULES','RR_META','Queue'];

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|mjs)$/.test(f)) files.push(p);
  }
})('src');

let bad = 0;
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  /* names brought in, declared, or exported here */
  const local = new Set();
  for (const m of src.matchAll(/import\s+(?:(\w+)\s*,?\s*)?(?:\{([^}]*)\})?\s*from/g)) {
    if (m[1]) local.add(m[1]);
    for (const part of (m[2] || '').split(',')) {
      const name = part.trim().split(/\s+as\s+/).pop().trim();
      if (name) local.add(name);
    }
  }
  for (const m of src.matchAll(/(?:export\s+)?(?:const|let|var|function|class)\s+(\w+)/g)) local.add(m[1]);

  /* Comments and string literals are prose, not code: "More to go" and
     "THE COACH PANEL." both looked like references before this. */
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    /* JSX text between tags is prose too */
    .replace(/>([^<>{}]*)</g, '><');

  for (const h of HELPERS) {
    if (local.has(h)) continue;
    /* A lower-case helper is only ever called or dereferenced. A capitalised one
       can also be a JSX tag. */
    const tail = /^[A-Z]/.test(h) ? '[(.]|<' : '[(.]';
    const re = new RegExp(`(?<![.\\w$])(?:<${h}[\\s/>]|${h}\\s*(?:${tail}))`, 'g');
    const hits = [...code.matchAll(re)];
    if (!hits.length) continue;
    const line = code.slice(0, hits[0].index).split('\n').length;
    console.log(`  ${f}:${line}  uses "${h}" but never imports or declares it`);
    bad += 1;
  }
}
console.log(bad ? `\n  ${bad} undefined reference(s)` : '  no undefined references');
process.exit(bad ? 1 : 0);
