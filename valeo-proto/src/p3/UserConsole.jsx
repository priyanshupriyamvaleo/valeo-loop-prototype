import { useEffect, useState } from 'react';
import Icon from '../p2/ui/Icon';
import { Chip, Note } from '../p2/ui/kit';
import { useStudio } from '../p2/lib/store';
import { PATIENTS, SERVICES, findService } from '../p2/lib/seed';
import { Queue } from './Clinician';
import { goalOf, readPatient, subscribe, scopeFor, money, regionOf } from '../shared/bus';
import { planFor, packageFor, nextItem, weekNo, weeksOf, drift, weekOfDay,
         serviceForStep, isPatientMove, actorOf } from '../p1/lib/journey';

/*
 * THE USER CONSOLE — one patient's protocol, as it actually is.
 *
 * ── TWO QUESTIONS, SIDE BY SIDE ──
 * Where has this patient got to, and what are they worth. These used to be
 * stacked, so answering the second meant scrolling past the first and losing
 * sight of it. They are now one screen: the journey on the left, running top to
 * bottom with the step they are on now called out, and the invoice pinned
 * beside it.
 *
 * The invoice opens on a press rather than sitting open, because the number is
 * the answer and the fourteen lines behind it are the working. Same shape as an
 * order summary anywhere else: the total is always visible, the breakdown is
 * one click away, and nothing is hidden.
 *
 * Everywhere else in this Studio shows a TEMPLATE. This shows what happened to
 * one person after a clinician touched it: what they were sold, what was
 * swapped, what was added, how far they have got and how far behind they are.
 *
 * It is deliberately read only. Every edit lives in the Clinician Console, and a
 * second place to change the same thing is how two screens start disagreeing
 * about which one is the truth.
 *
 * Two sections, because there are two questions. What is this patient worth, and
 * where have they got to.
 */

const GROUP_ORDER = ['lab', 'consult', 'homecare', 'medication', 'supplement'];

function Money({ n, region }) {
  return <b className="money">{money(n, region)}</b>;
}

/* ── WHAT THIS PATIENT IS WORTH ──
   Closed, it is the one number and how it splits. Open, it is every service
   they have and which step each came from. */
function Package({ pkg, region, open, onToggle }) {
  const groups = GROUP_ORDER
    .map((type) => ({ type, t: SERVICES[type].t, rows: pkg.lines.filter((l) => l.type === type) }))
    .filter((g) => g.rows.length);

  return (
    <div className="card uc-side">
      <button className={`uc-open ${open ? 'on' : ''}`} onClick={onToggle}>
        <div className="grow">
          <span className="ls-k">What this patient is worth</span>
          <div className="uc-big">{money(pkg.total, region)}</div>
          <span className="hint">
            {pkg.lines.length} services · {regionOf(region).short} prices
            {pkg.extra > 0 ? ` · ${money(pkg.extra, region)} added since the consult` : ''}
          </span>
        </div>
        <span className="uc-chev">
          <Icon name="chev" size={14} />
          <i>{open ? 'Hide' : 'Open'}</i>
        </span>
      </button>

      {open && (
        <>
          {groups.map((g) => (
            <div key={g.type}>
              <div className="uc-group">{g.t}</div>
              {g.rows.map((l) => (
                <div className="uc-line" key={l.key}>
                  <div className="grow">
                    <b>{l.t}</b>
                    <span>{l.week ? `Week ${l.week} · ` : ''}{l.step}</span>
                  </div>
                  {l.swapped && <Chip tone="ed">swapped</Chip>}
                  {l.added && <Chip tone="live">added</Chip>}
                  <span className="uc-price">
                    {l.price > 0 ? money(l.price, region) : 'included'}
                  </span>
                </div>
              ))}
            </div>
          ))}

          <div className="uc-total">
            <div className="uc-tot-row">
              <span>The protocol as sold</span><Money n={pkg.base} region={region} />
            </div>
            <div className="uc-tot-row">
              <span>Added since the consultation</span><Money n={pkg.extra} region={region} />
            </div>
            <div className="uc-tot-row grand">
              <span>Total</span><Money n={pkg.total} region={region} />
            </div>
          </div>

          <div className="card-pad" style={{ paddingTop: 0 }}>
            <span className="hint">
              Prices are placeholders pending sign-off. There is no basket behind this:
              the plan is the order, and a second copy of it would drift.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

/* ── SECTION 2 ── */
/* ── WHERE THEY HAVE GOT TO ──
   One list, not two. Completed steps struck through above, the step they are on
   NOW called out, and what is left below it in the weeks it is planned for.

   Splitting it into "completed" and "still to come" hid the only thing a coach
   opens this screen for: which step is live right now, and whether it is late. */
function Journey({ plan, done, completedOn, weeks, studio, pt, region }) {
  const current = nextItem(plan, done);

  const Row = ({ it }) => {
    const complete = done.includes(it.id);
    const now = !complete && current && it.id === current.id;
    const d = complete ? drift(it, completedOn) : null;
    const svc = serviceForStep(studio, it, pt);
    const owner = actorOf(it);
    return (
      <div className={`uc-step ${complete ? 'done' : ''} ${now ? 'now' : ''}`}>
        <span className="uc-rail">
          <i className={complete ? 'tick' : now ? 'dot' : ''}>
            {complete ? <Icon name="check" size={9} /> : null}
          </i>
        </span>
        <span className="uc-wk">Week {weekNo(it)}</span>
        <div className="grow">
          {now && (
            <span className="uc-nowlbl">
              {isPatientMove(it) ? 'Waiting on the patient' : `Waiting on ${owner || 'the care team'}`}
            </span>
          )}
          <b>{it.t}</b>
          <span>{svc ? svc.t : it.sub}</span>
        </div>
        {it.doctorAdded && <Chip tone="live">added by the doctor</Chip>}
        {it.blocker && <Chip tone="block">blocks</Chip>}
        {/* Planned against actual. The only number that says whether this
            patient is keeping up. */}
        {d && (
          <span className={`uc-drift ${d.late > 0 ? 'late' : ''}`}>
            {d.late > 0 ? `Week ${d.actual}, ${d.late} wk late` : `Week ${d.actual}, on time`}
          </span>
        )}
      </div>
    );
  };

  const doneCount = plan.filter((i) => done.includes(i.id)).length;

  return (
    <div className="card uc-main">
      <div className="card-pad">
        <div className="row">
          <div className="grow">
            <h3>Their journey</h3>
            <p className="sub">
              {doneCount} of {plan.length} steps, over {weeks} weeks. Completed steps show
              the week they were planned for against the week they happened in.
            </p>
          </div>
          {current && <Chip tone="ed">on step {doneCount + 1}</Chip>}
        </div>
      </div>
      <div className="uc-steps">
        {plan.map((it) => <Row key={it.id} it={it} />)}
      </div>
      {!current && (
        <div className="card-pad" style={{ paddingTop: 0 }}>
          <p className="empty-line">Every step is done. The protocol is complete.</p>
        </div>
      )}
    </div>
  );
}

export default function UserConsole() {
  const { state } = useStudio();
  const [chosen, setChosen] = useState('live');
  /* The invoice is the answer; the fourteen lines behind it are the working. */
  const [openInvoice, setOpenInvoice] = useState(false);
  const [pt, setPt] = useState(() => readPatient(null));
  useEffect(() => subscribe(() => setPt(readPatient(null))), []);

  const patient = PATIENTS.find((p) => p.id === chosen) || PATIENTS[0];
  const live = patient.live;
  const journey = live ? (pt || {}) : null;

  /* The protocol this patient is actually on: their goal, in their country. */
  const region = live ? (pt?.region || 'uae') : 'uae';
  const scope = scopeFor(state, patient.goal, region);
  const plan = live ? planFor(state, scope, journey) : [];
  const pkg = live ? packageFor(state, scope, journey) : null;
  const weeks = weeksOf(state, scope);

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="grow">
          <h2>User console</h2>
          <p className="sub">
            One patient's protocol as it actually is, after the clinician has touched it.
            Read only: every edit lives in the Clinician Console, and a second place to
            change the same thing is how two screens start disagreeing.
          </p>
        </div>
      </div>

      <Queue patients={PATIENTS} chosen={chosen} onChoose={setChosen} />

      <div className="row" style={{ margin: '20px 0 14px' }}>
        <div className="grow">
          <h2>{patient.name}</h2>
          <p className="sub">
            {goalOf(patient.goal)?.t}
            {live && journey?.day != null ? ` · day ${journey.day}, week ${weekOfDay(journey.day)}` : ''}
          </p>
        </div>
      </div>

      {!live ? (
        <Note label="This one is a fixture">
          <p style={{ margin: 0 }}>
            {patient.name} is here to show what a queue looks like. Only Ahmad is wired to
            the patient app, so only he has a real protocol to read.
          </p>
        </Note>
      ) : !plan.length ? (
        <Note label="Nothing to show yet">
          <p style={{ margin: 0 }}>
            This patient has no published protocol. Publish the plan in the Protocol
            Builder first.
          </p>
        </Note>
      ) : (
        /* Side by side, because "where are they" and "what are they worth" are
           asked together and stacking them meant losing one to read the other. */
        <div className="uc-split">
          <Journey plan={plan} done={journey.done || []} completedOn={journey.completedOn || {}}
            weeks={weeks} studio={state} pt={journey} region={pkg.region || region} />
          <Package pkg={pkg} region={pkg.region || region}
            open={openInvoice} onToggle={() => setOpenInvoice((v) => !v)} />
        </div>
      )}
    </>
  );
}
