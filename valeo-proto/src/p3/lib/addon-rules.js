/* ══ WHAT A COACH MAY PUT ON ONE PATIENT ═══════════════════════════════════
 *
 * THE RULES WERE REAL BEFORE THIS FILE, they were just in three places: the
 * `ADDABLE` map said which kinds, `blockedFor()` said which products the doping
 * gate stops, and `clinicianCanSet` on the published plan said which steps may
 * be swapped. Nothing said them together, so nobody could read the policy
 * without reading the screen.
 *
 * ── MEDICINES AND SUPPLEMENTS. NEVER A BLOOD TEST. ──
 * A blood panel is scheduled BY THE PROTOCOL — it has a week, it gates the
 * steps after it, and its results are what the next consultation reads. A coach
 * adding one mid-course would put a panel in the plan that no step waits for.
 *
 * The coach may still SWAP the panel the protocol already scheduled, wherever
 * the builder marked that step changeable. That is a different act: the
 * protocol decided a panel exists, and the coach decides which one.
 *
 * ── WHERE THESE RULES BELONG IN THE END ──
 * Here for now, by decision. The catalogue is where sellability actually
 * changes, so a copy held in this panel will drift from it. The CMS already has
 * the right shape — `ProtocolTask.coachMayRecommend`, "whether a coach may put
 * this on one patient, the product team's control" — compiled into a board this
 * panel copies. When these rules move, that is the mechanism, and no new
 * concept is needed.
 */

import { CATALOGUE, inRegion } from '../../p2/lib/seed';

/** The two kinds a coach may add, and what each becomes on the plan. */
export const ADDABLE = {
  medicine: {
    t: 'Medicine', group: 'medication', prescribes: true,
    step: (svc) => ({ t: `Rx added: ${svc.t}`, sub: svc.note, action: undefined }),
  },
  supplement: {
    t: 'Supplement', group: 'supplement', prescribes: true,
    step: (svc) => ({ t: `Voucher issued: ${svc.t}`, sub: svc.note, action: undefined }),
  },
};

/** Said on the screen where the blood-test button used to be. */
export const NO_BLOOD_TESTS =
  'Blood panels are scheduled by the protocol, so they are not added here. '
  + 'Where the builder marked a panel changeable you can swap which one it is, above.';

/**
 * WHAT IS ON THE MENU FOR ONE KIND.
 *
 * Read from CATALOGUE, not from `SERVICES[group].items`. The two hold the same
 * objects except that only the flattened one carries `type`, and every rule
 * below keys off `type` — so reading the un-flattened list refused every
 * product with "a coach may add a medicine or a supplement", which is exactly
 * what it was being asked for.
 */
export const offersFor = (kind) =>
  CATALOGUE.filter((x) => x.type === ADDABLE[kind]?.group);

/**
 * MAY THIS PRODUCT GO ON THIS PATIENT?
 *
 * Returns a reason rather than a boolean alone, because the screen SHOWS the
 * refusal instead of hiding the row. Hiding teaches a coach nothing; a greyed
 * line that says why teaches the rule the first time they meet it.
 *
 * `ask` marks the one refusal that is a question rather than a wall: the doping
 * gate is answerable on the spot, and the caller opens it instead of stopping.
 */
export function canRecommend(svc, { region = 'uae', competes = 'unanswered', alreadyOn = [] } = {}) {
  if (!svc) return { ok: false, why: 'This product is not in the catalogue.' };

  /* A blood panel reaches here only if something upstream offered it. */
  if (svc.type === 'lab') {
    return { ok: false, why: 'A blood panel is scheduled by the protocol, not added here.' };
  }
  if (svc.type !== 'medication' && svc.type !== 'supplement') {
    return { ok: false, why: 'A coach may add a medicine or a supplement, and nothing else.' };
  }

  if (svc.oos) return { ok: false, why: 'Out of stock. The pharmacy cannot ship it.' };

  /* THE PROTOTYPE'S OWN D-C29. A product with no price in this patient's market
     is NOT SOLD THERE, and borrowing the other market's number would put a line
     on the plan that can never become an order. `inRegion` is the catalogue's
     own answer to that question and is reused rather than restated. */
  if (!inRegion(svc, region)) {
    return { ok: false, why: `Not sold in ${region.toUpperCase()}. It has no price in this patient's market.` };
  }

  /* The gate lives on the catalogue item, so anything WADA-prohibited inherits
     it rather than one button knowing about one product. */
  if (svc.gate === 'competes' && competes !== 'no') {
    return {
      ok: false, ask: 'competes',
      why: competes === 'yes'
        ? 'WADA-prohibited, and this patient competes in tested sport.'
        : 'WADA-prohibited. Ask whether this patient competes in tested sport first.',
    };
  }

  if (alreadyOn.includes(svc.id)) {
    return { ok: false, why: 'Already on this patient’s list.' };
  }

  return { ok: true };
}

/**
 * NOTHING ENTERS THE PLAN WITHOUT A STATED JOB.
 *
 * The schema makes the role of a component mandatory and user-facing, so that
 * an upsell cannot disguise itself as care. Switching a task OFF already
 * demands a reason here; adding a product did not, which was backwards.
 *
 * The catalogue's own note does not count. It describes the product to
 * everyone; this says why this patient is getting it.
 */
export const reasonMissing = (reason) => !reason || !reason.trim();
export const REASON_HINT =
  'Why this patient is getting it. They read this line, so it is a reason and not a description.';
