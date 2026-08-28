import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import { Chip, Note } from '../ui/kit';
import { useStudio } from '../lib/store';
import { PATIENTS, SERVICES, findService } from '../lib/seed';
import { Queue } from './Clinician';
import { goalOf, readPatient, subscribe } from '../../shared/bus';
import { planFor, packageFor, weekNo, weeksOf, drift, weekOfDay, serviceForStep }
  from '../../p1/lib/journey';

/*
 * THE USER CONSOLE — one patient's protocol, as it actually is.
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

function Money({ n }) {
  return <b className="money">AED {(n || 0).toLocaleString()}</b>;
}

/* ── SECTION 1 ── */
function Package({ pkg }) {
  const groups = GROUP_ORDER
    .map((type) => ({ type, t: SERVICES[type].t, rows: pkg.lines.filter((l) => l.type === type) }))
    .filter((g) => g.rows.length);

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-pad">
        <div className="row">
          <div className="grow">
            <h3>The package</h3>
            <p className="sub">
              Everything this patient has, and which step it comes from. The protocol
              price covers what it shipped with; anything the doctor added since is on
              top of it.
            </p>
          </div>
        </div>
      </div>

      {groups.map((g) => (
        <div key={g.type}>
          <div className="uc-group">{g.t}</div>
          {g.rows.map((l) => (
            <div className="uc-line" key={l.key}>
              <div className="grow">
                <b>{l.t}</b>
                <span>
                  {l.week ? `Week ${l.week} · ` : ''}{l.step}
                </span>
              </div>
              {l.swapped && <Chip tone="ed">swapped</Chip>}
              {l.added && <Chip tone="live">added</Chip>}
              <span className="uc-price">
                {l.price > 0 ? `AED ${l.price.toLocaleString()}` : 'included'}
              </span>
            </div>
          ))}
        </div>
      ))}

      <div className="uc-total">
        <div className="uc-tot-row">
          <span>Protocol</span><Money n={pkg.base} />
        </div>
        <div className="uc-tot-row">
          <span>Added since the consultation</span><Money n={pkg.extra} />
        </div>
        <div className="uc-tot-row grand">
          <span>What this patient is worth</span><Money n={pkg.total} />
        </div>
      </div>

      <div className="card-pad" style={{ paddingTop: 0 }}>
        <span className="hint">
          Prices are placeholders pending sign-off. There is no basket behind this: the
          plan is the order, and a second copy of it would drift.
        </span>
      </div>
    </div>
  );
}

/* ── SECTION 2 ── */
function Journey({ plan, done, completedOn, weeks, studio, goalId, pt }) {
  const doneRows = plan.filter((i) => done.includes(i.id));
  const leftRows = plan.filter((i) => !done.includes(i.id));

  const Row = ({ it, complete }) => {
    const d = complete ? drift(it, completedOn) : null;
    const svc = serviceForStep(studio, it, pt);
    return (
      <div className={`uc-step ${complete ? 'done' : ''}`}>
        <span className="uc-wk">Week {weekNo(it)}</span>
        <div className="grow">
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

  return (
    <div className="card" style={{ marginBottom: 18 }}>
      <div className="card-pad">
        <div className="row">
          <div className="grow">
            <h3>Their journey</h3>
            <p className="sub">
              {doneRows.length} done, {leftRows.length} to go, of {weeks} weeks. Completed
              steps show the week they were planned for against the week they actually
              happened in.
            </p>
          </div>
        </div>
      </div>

      <div className="uc-group">Completed</div>
      {doneRows.length
        ? doneRows.map((it) => <Row key={it.id} it={it} complete />)
        : <div className="card-pad"><p className="empty-line">Nothing completed yet.</p></div>}

      <div className="uc-group">Still to come</div>
      {leftRows.length
        ? leftRows.map((it) => <Row key={it.id} it={it} />)
        : <div className="card-pad"><p className="empty-line">The protocol is complete.</p></div>}
    </div>
  );
}

export default function UserConsole({ goalId }) {
  const { state } = useStudio();
  const [chosen, setChosen] = useState('live');
  const [pt, setPt] = useState(() => readPatient(null));
  useEffect(() => subscribe(() => setPt(readPatient(null))), []);

  const patient = PATIENTS.find((p) => p.id === chosen) || PATIENTS[0];
  const live = patient.live;
  const journey = live ? (pt || {}) : null;

  const plan = live ? planFor(state, goalId, journey) : [];
  const pkg = live ? packageFor(state, goalId, journey) : null;
  const weeks = weeksOf(state, goalId);

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
        <>
          <Package pkg={pkg} />
          <Journey plan={plan} done={journey.done || []} completedOn={journey.completedOn || {}}
            weeks={weeks} studio={state} goalId={goalId} pt={journey} />
        </>
      )}
    </>
  );
}
