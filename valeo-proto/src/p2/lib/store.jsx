import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { readStudio, writeStudio, subscribe, resetAll, GOALS, SHARED } from '../../shared/bus';
import { emptyDraft } from './seed';

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

const blank = () => ({
  drafts: emptyDraft(),
  /* SHARED holds the onboarding chat, which belongs to no goal. */
  published: Object.fromEntries([...GOALS.map((g) => g.id), SHARED].map((id) => [id, {}])),
  consult: null,
});

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

  const publish = useCallback((goalId, part) => {
    update((d) => {
      const draft = d.drafts[goalId] || {};
      if (!d.published[goalId]) d.published[goalId] = {};
      const prev = d.published[goalId][part];
      d.published[goalId][part] = {
        version: (prev ? prev.version : 0) + 1,
        at: new Date().toISOString(),
        data: structuredClone(draft[part]),
        /* How long the protocol runs travels with the plan, so the patient app
           reads one published number instead of three screens each hardcoding
           twelve. */
        ...(part === 'plan' ? { weeks: draft.meta?.listing?.duration || 12 } : {}),
      };
    });
  }, [update]);

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

  const value = useMemo(() => ({ state, update, publish, reset }), [state, update, publish, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStudio() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStudio outside StudioProvider');
  return ctx;
}

/* Has this part been published, and is the draft ahead of it? A builder that
   cannot tell you there are unpublished edits is a builder people mistrust. */
export function pubState(state, goalId, part) {
  const pub = state.published?.[goalId]?.[part];
  const draft = state.drafts?.[goalId]?.[part];
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
export function publishBlockers(state, goalId, part) {
  const d = state.drafts?.[goalId]?.[part];
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
    if (!(d.cart?.price > 0)) out.push({ what: 'The price is not set', why: 'A protocol cannot go on sale at zero.' });
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
