import Icon from '../ui/Icon';
import { nextItem, progress, weekOf, isPatientMove, inMotion, soon } from '../lib/journey';

/*
 * ONE CARD AND ONE DETAIL SCREEN.
 *
 * Thirteen states in the spec, and none of them is a design. Both components
 * here read the same thing — the earliest plan item not yet done — and render
 * whatever it happens to be. Publish a new item in the Studio and a state
 * appears with no code written, which is the claim this prototype exists to
 * demonstrate.
 */

export function ProtocolCard({ plan, done, onOpen, onChat, title }) {
  const item = nextItem(plan, done);
  const p = progress(plan, done);
  const wk = weekOf(plan, done);

  return (
    <div className="jcard">
      <div className="hd">
        <b>{title}</b>
        <button className="chatpill" onClick={onChat}><Icon name="chat" size={11} /> Chat with Doctor</button>
      </div>

      {item ? (
        <div className="mod">
          {/* action_needed outranks everything else, per the module table */}
          <div className="lbl" style={{ color: item.blocking ? 'var(--red)' : 'var(--gold-deep)' }}>
            {item.blocking ? 'Action needed' : item.doctorAdded ? 'Added by your doctor' : item.when}
          </div>
          <div className="big">{item.card || item.t}</div>
          <div className="sm" style={{ marginTop: 3 }}>{item.sub}</div>
          {item.action && (
            <button className="btn-dark" style={{ marginTop: 11 }} onClick={onOpen}>
              {item.action.label} <Icon name="chev" size={12} />
            </button>
          )}
          {!item.action && (
            <button className="btn-gold" style={{ marginTop: 11 }} onClick={onOpen}>
              View details <Icon name="chev" size={12} />
            </button>
          )}
        </div>
      ) : (
        <div className="mod">
          <div className="lbl" style={{ color: 'var(--green)' }}>Protocol complete</div>
          <div className="big">All twelve weeks, done.</div>
          <button className="btn-dark" style={{ marginTop: 11 }} onClick={onOpen}>
            Continue or switch <Icon name="chev" size={12} />
          </button>
        </div>
      )}

      {/* progress: purchased means there is a week to show */}
      <div className="mod">
        <div className="rowline" style={{ marginBottom: 5 }}>
          <div className="sm" style={{ flex: 1 }}>Week <b style={{ fontSize: 14 }}>{wk}</b> of 12</div>
          <div className="sm">{p.done} of {p.total} steps</div>
        </div>
        <div className="pbar"><i style={{ width: `${p.pct}%` }} /></div>
      </div>

      <div className="dots"><i className="on" /><i /></div>
    </div>
  );
}

/*
 * THE PROTOCOL SCREEN.
 *
 * This used to be the fourteen plan items printed as a list, which is how a
 * category manager thinks about a protocol and not how anybody lives one. It
 * was the Studio's data model wearing patient clothes.
 *
 * Rebuilt around the one fact that matters: NINE OF THE FOURTEEN STEPS ARE
 * SOMEBODY ELSE'S MOVE. A nurse, a lab, the pharmacy, the care team. Only five
 * belong to the patient. So the dominant state across twelve weeks is waiting,
 * punctuated by short bursts of action, and the screen is shaped for that:
 *
 *   YOUR MOVE     nothing or one thing, and it outranks everything when it exists
 *   WHERE YOU ARE the two numbers, which work from day zero
 *   IN MOTION     what Valeo is doing right now, because the waiting IS the product
 *   NEXT          a fortnight, never the whole fourteen
 *
 * The order flips. A blocking action takes the top; when there is none the
 * numbers do, and the app says plainly that nothing is needed. Same components,
 * order decided by state, which is the rule the home card already runs on.
 *
 * ── THE DAY ZERO PROBLEM, AND WHY PAIN AND CAPACITY SOLVE IT ──
 * Between paying and the first result there are about nine days with nothing
 * true to say about the patient's body. No markers, no trend. That window is
 * where a twelve-week commitment is most fragile. A tracker opened there is a
 * monument to emptiness.
 * Recovery, though, is measured in pain and in what the body will do, and both
 * of those are available the minute somebody has paid. No lab, no scale, no ops
 * integration. So the tracker starts full on day zero, and the Week 12 panel
 * has something to be read against.
 */
export function JourneyDetail({ plan, done, checkins, booked, title, onBack, onOpen, onCheckIn }) {
  const front = nextItem(plan, done);
  const p = progress(plan, done);
  const wk = weekOf(plan, done);
  const mine = isPatientMove(front);
  const motion = inMotion(plan, done);
  /* Everything already on screen above is excluded, so this section adds
     information rather than repeating it. */
  const shown = [...motion.map((i) => i.id), ...(front ? [front.id] : [])];
  const near = soon(plan, done, shown);
  const first = checkins.length === 0;
  const latest = checkins[checkins.length - 1];
  const base = checkins[0];
  const baselineDone = done.includes('p2');

  /* ── the two numbers ── */
  const numbers = (
    <div className="sect">
      <div className="sect-h">
        <span>{first ? 'Set your starting point' : 'Where you are'}</span>
        {!first && <em>{checkins.length} check-in{checkins.length === 1 ? '' : 's'}</em>}
      </div>
      {first ? (
        <button className="baseline-cta" onClick={onCheckIn}>
          <div>
            <b>Two numbers, before anything starts</b>
            <span>Pain, and what your body will do. Week 12 gets read against them.</span>
          </div>
          <Icon name="chev" size={16} />
        </button>
      ) : (
        <>
          <div className="nums">
            <Metric t="Pain" from={base.pain} to={latest.pain} lower alone={checkins.length === 1} />
            <Metric t="Capacity" from={base.capacity} to={latest.capacity} alone={checkins.length === 1} />
          </div>
          <button className="linkrow" onClick={onCheckIn}>
            Check in again <Icon name="chev" size={13} />
          </button>
        </>
      )}
      <div className="panel-line">
        <Icon name="flask" size={13} />
        {baselineDone
          ? 'Baseline panel on file. The same panel repeats at Week 12.'
          : 'Your baseline panel is drawn at the nurse visit.'}
      </div>
    </div>
  );

  /* ── your move ── */
  const yourMove = (
    <div className="sect">
      <div className="sect-h"><span>Your move</span></div>
      {mine ? (
        <div className={`move ${front.blocking ? 'block' : ''}`}>
          {front.blocking && <div className="move-k">Nothing else starts until this is done</div>}
          <b>{front.t}</b>
          <span>{front.sub}</span>
          <button className="cta" onClick={() => onOpen(front)}>
            {front.action ? front.action.label : 'Open'} <Icon name="chev" size={15} />
          </button>
        </div>
      ) : (
        <div className="move quiet">
          <b>Nothing right now</b>
          <span>
            {front
              ? `${front.doctorAdded ? 'Your care team' : front.actor} has the next step. We will tell you when it moves.`
              : 'Your twelve weeks are complete.'}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="screen">
      <div className="shead">
        <button className="iconbtn" onClick={onBack}><Icon name="back" size={14} /></button>
        <div style={{ flex: 1 }}>
          <div className="stitle">{title}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            Week {wk} of 12 · {p.done} of {p.total} steps
          </div>
        </div>
      </div>

      <div className="scroll pad">
        <div className="pbar wide"><i style={{ width: `${p.pct}%` }} /></div>

        {/* A blocking move outranks the numbers. With nothing to do, the numbers
            lead and the app says so rather than inventing a task. */}
        {mine ? <>{yourMove}{numbers}</> : <>{numbers}{yourMove}</>}

        {motion.length > 0 && (
          <div className="sect">
            <div className="sect-h"><span>In motion</span><em>on your behalf</em></div>
            {motion.map((i) => (
              <button className="mrow" key={i.id} onClick={() => onOpen(i)}>
                <span className="who-av sm">{(i.actor || '?')[0]}</span>
                <div>
                  <b>{i.t}</b>
                  <span>{i.doctorAdded ? 'Added by your doctor' : i.actor} · {i.when}</span>
                </div>
                <Icon name="chev" size={13} />
              </button>
            ))}
          </div>
        )}

        {near.length > 0 && (
          <div className="sect">
            <div className="sect-h"><span>Next two weeks</span></div>
            {near.map((i) => (
              <div className="nrow" key={i.id}>
                <span className="when">{i.when}</span>
                <div>
                  <b>{i.t}</b>
                  {i.doctorAdded && <em>added at your consult</em>}
                </div>
              </div>
            ))}
          </div>
        )}

        <details className="allplan">
          <summary>The whole plan, {plan.length} steps <Icon name="chev" size={12} /></summary>
          {plan.map((it) => {
            const isDone = done.includes(it.id);
            return (
              <div className="rowitem" key={it.id} style={{ opacity: isDone ? 0.45 : 1 }}>
                {isDone
                  ? <div className="tick"><Icon name="check" size={10} /></div>
                  : <div className="n" style={{ background: 'transparent', border: '1px solid var(--line-2)' }} />}
                <div style={{ flex: 1 }}>
                  <b style={{ textDecoration: isDone ? 'line-through' : 'none' }}>{it.t}</b>
                  <span>
                    {it.when} · {it.actor}
                    {booked[it.id] ? ` · ${booked[it.id]}` : ''}
                    {it.doctorAdded ? ' · added at your consult' : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </details>
      </div>
    </div>
  );
}

/* One number, and the thing that makes it mean something. A value on its own is
   a fact; 6 to 4 is progress. */
function Metric({ t, from, to, lower, alone }) {
  const moved = to - from;
  const good = lower ? moved < 0 : moved > 0;
  return (
    <div className="num">
      <span className="t">{t}</span>
      <div className="v">
        {!alone && from !== to && <em>{from}</em>}
        <b>{to}</b>
        {/* With one reading there is nothing to compare against, and "no change"
            against yourself reads as a failure rather than as a starting line. */}
        <i className={alone || moved === 0 ? '' : good ? 'up' : 'down'}>
          {alone ? 'baseline' : moved === 0 ? 'level' : `${moved > 0 ? '+' : ''}${moved}`}
        </i>
      </div>
    </div>
  );
}
