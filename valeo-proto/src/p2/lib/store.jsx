import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { readStudio, writeStudio, subscribe, resetAll, SHARED } from '../../shared/bus';
import { emptyDraft, PROTOCOL_SEED, newProtocolDraft, packagePrice, findService } from './seed';

/*
 * THE STUDIO STORE.
 *
 * Two halves that must never be confused: DRAFTS, which the category manager
 * types into, and PUBLISHED, which the patient app reads. Publish copies one
 * into the other and stamps a version.
 *
 * Keeping them apart is the entire demo. If typing in the builder changed the
 * phone live, "publish" would be theatre, and the room would learn nothing
 * about how the real system is supposed to work.
 */
const Ctx = createContext(null);

/* ── THE SEEDED PROTOCOLS ARE ALREADY LIVE ──
   They are locked because patients are on them, and a locked protocol that was
   only a draft would be a read-only screen with nothing behind it. So the store
   opens with them published: the consumer app works with no setup, and the
   authoring flow is what you do to make a NEW one.

   Everything is stamped exactly as publish() would stamp it, so there is one
   shape of published record and not a seeded variant of it. */
const asPublished = (drafts, proto) => {
  const out = {};
  const put = (part, extra) => {
    if (!drafts[proto.id]?.[part]) return;
    out[part] = {
      version: 1, at: '2026-02-02T09:00:00.000Z',
      data: structuredClone(drafts[proto.id][part]),
      region: proto.region, ...(extra || {}),
    };
  };
  put('triage');
  put('prepurchase', { price: packagePrice(drafts[proto.id]?.prepurchase, proto.region) });
  put('plan', { weeks: proto.weeks });
  return out;
};

const blank = () => {
  const drafts = emptyDraft();
  const protocols = structuredClone(PROTOCOL_SEED);
  return {
  /* The list itself, in the order they were made. Everything else is keyed by
     the ids in here. */
  protocols,
  drafts,
  /* SHARED holds the onboarding chat, which belongs to no protocol. */
  published: {
    [SHARED]: { onboarding: { version: 1, at: '2026-02-02T09:00:00.000Z',
                              data: structuredClone(drafts[SHARED].onboarding) } },
    ...Object.fromEntries(protocols.map((p) => [p.id, asPublished(drafts, p)])),
  },
  /* ONE CONSULT RECORD PER PATIENT.
     This used to be a single global object with no patient id on it, so every
     patient's form initialised from the same record: opening Leila showed
     Ahmad's note and outcome, and saving hers overwrote his. A console that
     claims to show one patient's protocol cannot sit on top of that. */
  consults: {},
  };
};

export function StudioProvider({ children }) {
  const [state, setState] = useState(() => readStudio(null) || blank());
  /* The persisted copy, kept beside the render copy so a write can be computed
     without doing it inside a setState updater. React double-invokes those in
     development, and the write notifies listeners that call setState again, so
     a single Publish used to run twice and the version counter jumped. */
  const ref = useRef(state);

  /* Written once on first run so the patient app can tell "never opened the
     Studio" from "opened it and published nothing". */
  useEffect(() => { if (!readStudio(null)) writeStudio(state); }, []); // eslint-disable-line

  /* Another tab may publish, or reset. Follow it. */
  useEffect(() => subscribe(() => {
    const next = readStudio(null) || blank();
    ref.current = next;
    setState(next);
  }), []);

  const update = useCallback((fn) => {
    const next = structuredClone(ref.current);
    fn(next);
    ref.current = next;
    writeStudio(next);
    setState(next);
  }, []);

  const publish = useCallback((scope, part) => {
    update((d) => {
      const draft = d.drafts[scope] || {};
      const proto = (d.protocols || []).find((p) => p.id === scope) || null;
      if (!d.published[scope]) d.published[scope] = {};
      const prev = d.published[scope][part];
      d.published[scope][part] = {
        version: (prev ? prev.version : 0) + 1,
        at: new Date().toISOString(),
        data: structuredClone(draft[part]),
        /* Both of these are properties of the PROTOCOL, not of the part being
           published, and they travel with it so the patient app reads one
           published number instead of every screen deciding for itself. */
        ...(proto ? { region: proto.region } : {}),
        ...(part === 'plan' ? { weeks: proto?.weeks || 12 } : {}),
        /* The price is the invoice. Stamping it means the phone never has to
           recompute a discount to know what it is being charged. */
        ...(part === 'prepurchase'
          ? { price: packagePrice(draft.prepurchase, proto?.region) } : {}),
      };
    });
  }, [update]);

  /* ── CREATING ONE ──
     Name, goal, region, length. Everything else is authored in the two
     builders, in that order. */
  const createProtocol = useCallback((meta) => {
    const base = `p-${meta.goal}-${meta.region}-${(meta.name || 'new').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`.slice(0, 48);
    /* Returns the id it actually used, not the one it hoped for. The caller
       navigates straight to it, and a collision used to send them to a
       protocol that did not exist. */
    let made = base;
    update((d) => {
      if (!d.protocols) d.protocols = [];
      let n = 2;
      while (d.protocols.some((p) => p.id === made)) { made = `${base}-${n}`; n += 1; }
      d.protocols.push({ ...meta, id: made, createdAt: 'Today' });
      d.drafts[made] = newProtocolDraft();
      d.published[made] = {};
    });
    return made;
  }, [update]);

  /* ── EDITING A LIVE PROTOCOL MEANS COPYING IT ──
     The copy carries the drafts, not the published record, so it starts as a
     draft of exactly what is live and publishing it is a deliberate act. */
  const duplicateProtocol = useCallback((id) => {
    let made = null;
    update((d) => {
      const src = (d.protocols || []).find((p) => p.id === id);
      if (!src) return;
      let unique = `${id}-copy`;
      let n = 2;
      while (d.protocols.some((p) => p.id === unique)) { unique = `${id}-copy-${n}`; n += 1; }
      const i = d.protocols.indexOf(src);
      d.protocols.splice(i + 1, 0, {
        ...structuredClone(src), id: unique, locked: false,
        name: `${src.name} (copy)`, createdAt: 'Today',
      });
      d.drafts[unique] = structuredClone(d.drafts[id]);
      d.published[unique] = {};
      made = unique;
    });
    return made;
  }, [update]);

  const patchProtocol = useCallback((id, fn) => update((d) => {
    const p = (d.protocols || []).find((x) => x.id === id);
    if (p) fn(p);
  }), [update]);

  const removeProtocol = useCallback((id) => update((d) => {
    d.protocols = (d.protocols || []).filter((p) => p.id !== id);
    delete d.drafts[id];
    delete d.published[id];
  }), [update]);

  /* The button that calls this promises a clean Studio AND a clean patient,
     so it has to clear both keys. Resetting only the Studio left the phone
     mid-journey against a template it had never seen published, which is the
     one state the demo must never open in. */
  const reset = useCallback(() => {
    resetAll();
    const f = blank();
    ref.current = f;
    writeStudio(f);
    setState(f);
  }, []);

  const value = useMemo(
    () => ({ state, update, publish, reset, createProtocol, duplicateProtocol,
             patchProtocol, removeProtocol }),
    [state, update, publish, reset, createProtocol, duplicateProtocol,
     patchProtocol, removeProtocol]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStudio outside StudioProvider');
  return ctx;
}

/* ── HOW FAR THROUGH IS THIS PROTOCOL ──
   Derived, never stored. A protocol is a package first and a plan second, so
   where it has got to is simply which of the two is published. Storing it as a
   field let a row claim to be live while its own tabs said draft. */
export function stageOf(state, id) {
  const pkg = !!state.published?.[id]?.prepurchase;
  const plan = !!state.published?.[id]?.plan;
  if (pkg && plan) return 'live';
  if (pkg) return 'plan';
  return 'package';
}
/* Which tab to open it on: the first step that is not finished. */
export const landingTab = (state, id) => (stageOf(state, id) === 'package' ? 'package' : 'plan');

/* Has this part been published, and is the draft ahead of it? A builder that
   cannot tell you there are unpublished edits is a builder people mistrust. */
export function pubState(state, scope, part) {
  const pub = state.published?.[scope]?.[part];
  const draft = state.drafts?.[scope]?.[part];
  if (!pub) return { live: false, dirty: !!draft, version: 0 };
  const same = JSON.stringify(pub.data) === JSON.stringify(draft);
  return { live: true, dirty: !same, version: pub.version, at: pub.at };
}

/*
 * WHAT THE BUILDER REFUSES TO PUBLISH.
 *
 * The demo's claim is that the guardrails are structural: "refused by the
 * builder, not by review." A hint that says a field is required, next to a
 * Publish button that ships anyway, makes that claim false and teaches the
 * room the opposite lesson.
 *
 * So the rules live here, in one list, and the publish bar cannot ship past
 * them. Each blocker says what is missing and why the rule exists, because a
 * refusal a category manager cannot act on just reads as a broken button.
 */
export function publishBlockers(state, scope, part) {
  const d = state.drafts?.[scope]?.[part];
  const region = (state.protocols || []).find((p) => p.id === scope)?.region || 'uae';
  if (!d) return [{ what: 'Nothing to publish', why: 'This surface has no draft yet.' }];
  const out = [];
  const empty = (v) => !v || !String(v).trim();

  if (part === 'onboarding') {
    if (empty(d.intro)) out.push({
      what: 'The opening line is empty',
      why: 'It is the first thing anybody reads in the product. Without it the chat opens on a question with no framing.',
    });
    if (!(d.questions || []).length) out.push({
      what: 'There are no questions',
      why: 'With none, the chat cannot suggest a goal and the patient lands on a bare picker.',
    });
    if (!(d.profile?.fields || []).length) out.push({
      what: 'No details are collected',
      why: 'Age, sex, height and weight are what the doctor needs on file before anything can be prescribed.',
    });
    (d.questions || []).forEach((q, i) => {
      if (empty(q.q)) out.push({ what: `Question ${i + 1} has no text`, why: 'The patient would see a blank bubble.' });
      else if (q.kind !== 'text' && !(q.options || []).length) out.push({
        what: `Question ${i + 1} has no answers`,
        why: 'A choice question with no options cannot be answered, so the thread would dead-end.',
      });
    });
  }

  if (part === 'triage') {
    if (empty(d.intro)) out.push({
      what: 'The opening line is empty',
      why: 'It is the first thing in the thread. Without it the chat starts on a question with no framing.',
    });
    if (!(d.questions || []).length) out.push({
      what: 'There are no questions',
      why: 'Publishing an empty triage would send patients from the goal picker straight to the price.',
    });
    (d.questions || []).forEach((q, i) => {
      if (empty(q.q)) out.push({ what: `Question ${i + 1} has no text`, why: 'The patient would see a blank bubble.' });
      else if (q.kind !== 'text' && !(q.options || []).length) out.push({
        what: `Question ${i + 1} has no answers`,
        why: 'A choice question with no options cannot be answered, so the thread would dead-end.',
      });
    });
  }

  if (part === 'prepurchase') {
    if (empty(d.pdp?.twelveWeek)) out.push({
      what: 'The 12-week statement is empty',
      why: 'It is the line that sets the length of the commitment before payment. It is the fix for one-month churn, so the builder treats it as structural, not as copy.',
    });
    if (empty(d.pdp?.title)) out.push({ what: 'The PDP has no title', why: 'The patient app renders the title as the page heading.' });
    /* The price is the invoice, so "not set" means the package is made of
       nothing, or everything in it has been discounted to zero. */
    if (!(packagePrice(d, region) > 0)) out.push({
      what: 'The package prices at zero',
      why: 'Nothing is included, or the discounts have taken the whole of it. A protocol cannot go on sale at zero.',
    });
    const gone = (d.pdp?.included || []).filter((l) => !findService(l.serviceId));
    if (gone.length) out.push({
      what: `${gone.length} included line${gone.length > 1 ? 's point' : ' points'} at nothing`,
      why: 'A line whose service has been withdrawn prices at zero and shows the patient a blank row.',
    });
    if (empty(d.confirmation?.action)) out.push({
      what: 'The confirmation has no action',
      why: 'The protocol starts with testing. If the confirmation offers nothing to book, the patient pays and then stops.',
    });
  }

  if (part === 'plan') {
    /* The plan draft is the ordered list itself, not a wrapper around one. */
    const items = Array.isArray(d) ? d : (d.items || []);
    if (!items.length) out.push({
      what: 'The plan has no items',
      why: 'The home card renders whichever item is due next. With none, there is nothing for the patient to be shown after they pay.',
    });
    items.forEach((it, i) => {
      if (empty(it.t)) out.push({ what: `Step ${i + 1} has no title`, why: 'The title is what the patient reads on the home card.' });
    });
    /* The locked steps are the clinical spine: baseline panel, consultation,
       Week 12 retest. The builder refuses to ship a plan that lost one. */
    const missing = ['p2', 'p4', 'p13'].filter((id) => !items.some((it) => it.id === id));
    if (missing.length) out.push({
      what: `${missing.length} locked step${missing.length > 1 ? 's are' : ' is'} missing`,
      why: 'Baseline panel, doctor consultation and the Week 12 retest are the clinical spine of this protocol. They cannot be removed.',
    });
  }

  return out;
}
