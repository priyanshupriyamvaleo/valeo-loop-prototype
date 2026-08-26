import Icon from '../ui/Icon';
import { nextItem, progress, weekOf, isPatientMove, soon, recoveryScore, captures, stateOf } from '../lib/journey';
import { serviceOf } from '../../p2/lib/seed';

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

/*
 * THE PROTOCOL SCREEN — one fixed structure, top to bottom.
 *
 * It used to be the fourteen plan items printed as a list, which is how a
 * category manager thinks about a protocol and not how anybody lives one.
 *
 * The order is deliberately NOT clever. Whatever is next sits at the top, every
 * time, until the twelve weeks are done. A screen that rearranges itself is a
 * screen you have to read again on every visit, and the whole point of this one
 * is that a patient can glance at it and know what to do.
 *
 *   NEXT          what happens now, whether it is theirs or ours
 *   YOUR LOGBOOK  where they are in the twelve weeks, the score, the four tiles
 *   WHAT FOLLOWS  the next couple of steps, so nothing arrives as a surprise
 *   HELP          the coach and the care team, always in the same place
 *
 * The one exception is the end: with nothing left to do, the logbook rises to
 * the top, because logging is then the only thing the screen is for.
 *
 * ── WHY THE SCORE IS SELF-REPORTED ──
 * Between paying and the first result there are about nine days with nothing
 * true to say about the patient's body, and that is exactly when a twelve-week
 * commitment is most fragile. Recovery, though, is measured in pain and in what
 * the body will do, and the patient can report both the minute they have paid.
 * So the logbook is full on day zero and Week 12 has something to read against.
 */
export function JourneyDetail({ plan, done, checkins, logs, target, booked, title,
                               onBack, onOpen, onLog, onChat }) {
  const front = nextItem(plan, done);
  const p = progress(plan, done);
  const wk = weekOf(plan, done);
  const mine = isPatientMove(front);
  const latest = checkins[checkins.length - 1];
  const score = recoveryScore(latest);
  const tiles = captures(done, logs);
  /* Everything already named above is left out below, so the lower sections add
     information rather than repeating it. */
  const follows = soon(plan, done, front ? [front.id] : [], 21, 3);

  /* ── 1. what happens now ──
     One card, four states. The words come from the step, not from here, so a
     step published in the Studio arrives with its own voice.
     Built only when there IS something next: JSX is constructed eagerly, so a
     completed plan used to dereference a null item and take the screen down at
     the one moment a patient has finished twelve weeks. */
  const state = stateOf(front, booked);
  const next = !front ? null : (
    <div className="sect">
      <div className="sect-h">
        <span>{state.tag || (mine ? 'Your next step' : 'Happening now')}</span>
        {state.chip && <em className="chip-in">{state.chip}</em>}
      </div>
      <div className={`move ${front.blocking && state.k === 'ask' ? 'block' : ''} ${mine ? '' : 'theirs'}`}>
        {front.blocking && state.k === 'ask' && (
          <div className="move-k">Nothing else starts until this is done</div>
        )}
        <b>{state.title}</b>
        {state.sub && <i className="move-sub">{state.sub}</i>}

        {/* An appointment, so the time is the largest thing on the card. */}
        {state.when && (
          <div className="appt">
            <span>{state.whenLead || 'Scheduled for'}</span>
            <b>{state.when}</b>
          </div>
        )}

        {state.body && <span>{state.body}</span>}

        {/* What this step actually books, draws or ships. The Studio linked it
            to a service that already exists, so the patient gets its real name
            rather than a description somebody retyped. */}
        {serviceOf(front.service) && (
          <div className="svc-line">
            <Icon name="clipboard" size={12} />
            <div>
              <b>{serviceOf(front.service).t}</b>
              <span>{serviceOf(front.service).note}</span>
            </div>
          </div>
        )}

        {state.assure && (
          <ul className="assure">
            {state.assure.map((a) => (
              <li key={a}><span className="tick sm"><Icon name="check" size={9} /></span>{a}</li>
            ))}
          </ul>
        )}

        {state.prep && (
          <>
            <div className="prep-l">{state.prepLabel || 'Before your appointment'}</div>
            <ul className="assure">
              {state.prep.map((a) => <li key={a}><i className="pip" />{a}</li>)}
            </ul>
          </>
        )}

        {state.strip && (
          <div className="strip"><Icon name="chat" size={12} />{state.strip}</div>
        )}

        {/* The report comes before the booking: reading it is what makes the
            consultation worth booking. */}
        {state.secondary && (
          <button className="cta ghost-cta" onClick={() => onOpen(front, state.secondary.kind)}>
            {state.secondary.label} <Icon name="chev" size={15} />
          </button>
        )}

        {/* Whose step it is decides the WORDS, not whether there is a button.
            Tracking a delivery is the patient's to do even though the parcel is
            the pharmacy's, so a step with an action keeps its button either
            way, and the line naming who holds it sits underneath. */}
        {state.k === 'scheduled' ? (
          <button className="cta" onClick={() => onOpen(front, 'join')}>
            {state.cta} <Icon name="chev" size={15} />
          </button>
        ) : front.action ? (
          <button className={`cta ${mine ? '' : 'ghost-cta'}`} onClick={() => onOpen(front)}>
            {front.action.label} <Icon name="chev" size={15} />
          </button>
        ) : null}

        {!mine && (
          <div className="whos">
            <span className="who-av sm">{front.doctorAdded ? 'D' : (front.actor || '?')[0]}</span>
            {front.doctorAdded ? 'Added by your doctor' : `${front.actor} has this`}
          </div>
        )}
      </div>
    </div>
  );

  /* ── 2. the logbook ── */
  const logbook = (
    <div className="sect">
      <div className="sect-h"><span>Your logbook</span></div>

      <div className="runhero">
        <div className="rh-bar"><i style={{ width: `${p.pct}%` }} /></div>
        <div className="rh-top">
          <div>
            <div className="rh-k">Recover and Rebuild</div>
            <div className="rh-wk">Week {wk} of 12</div>
          </div>
          <div className="rh-right">
            <b>{p.done}</b><span>of {p.total} steps</span>
          </div>
        </div>

        <button className="rh-score" onClick={() => onLog('symptoms')}>
          {score == null ? (
            <>
              <div className="rh-sc-l">
                <b>Set your starting point</b>
                <span>Two numbers. Week 12 gets read against them.</span>
              </div>
              <Icon name="chev" size={15} />
            </>
          ) : (
            <>
              <div className="rh-sc-l">
                <span>Recovery score</span>
                <div className="rh-nums">
                  <b>{score}</b>
                  {target != null && <><i>to</i><em>{target}</em></>}
                </div>
              </div>
              <div className="rh-meter">
                <i style={{ width: `${score}%` }} />
                {target != null && <u style={{ left: `${target}%` }} />}
              </div>
            </>
          )}
        </button>
      </div>

      <div className="tiles">
        {tiles.map((c) => (
          <button key={c.k} className={`tile ${c.count ? 'done' : c.due ? 'due' : 'off'}`}
            disabled={!c.due} onClick={() => onLog(c.k)}>
            <div className="tile-h">
              <Icon name={c.ic} size={15} />
              {c.count > 0 && <span className="tick sm"><Icon name="check" size={9} /></span>}
              {c.due && !c.count && <i className="pip" />}
            </div>
            <b>{c.t}</b>
            <span>{c.count ? `Logged ${c.count}x` : c.note}</span>
          </button>
        ))}
      </div>
    </div>
  );

  /* ── 3. what follows ── */
  const whatFollows = follows.length > 0 && (
    <div className="sect">
      <div className="sect-h"><span>What follows</span></div>
      {follows.map((i) => (
        <div className="nrow" key={i.id}>
          <span className="when">{i.when}</span>
          <div>
            <b>{i.t}</b>
            <em>{i.doctorAdded ? 'Added by your doctor' : i.actor}</em>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="screen">
      <div className="shead">
        <button className="iconbtn" onClick={onBack}><Icon name="back" size={14} /></button>
        <div style={{ flex: 1 }}>
          <div className="stitle">{title}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Week {wk} of 12</div>
        </div>
        {/* Same place on every screen, because somebody who needs help should
            never have to look for the way to ask for it. */}
        <button className="chatpill" onClick={onChat}>
          <Icon name="chat" size={11} /> AI coach
        </button>
      </div>

      <div className="scroll pad">
        {front ? <>{next}{logbook}</> : (
          <>
            {logbook}
            <div className="sect">
              <div className="sect-h"><span>What is left</span></div>
              <div className="move quiet">
                <b>Your twelve weeks are complete</b>
                <span>Keep logging while your doctor reads the Week 12 panel. There is
                  nothing else to book.</span>
              </div>
            </div>
          </>
        )}

        {whatFollows}

        <div className="sect">
          <div className="sect-h"><span>Help</span></div>
          <button className="helprow" onClick={onChat}>
            <span className="who-av sm">AI</span>
            <div><b>Your AI health coach</b><span>Any hour, any question</span></div>
            <Icon name="chev" size={13} />
          </button>
          <button className="helprow" onClick={onChat}>
            <span className="who-av sm">V</span>
            <div><b>Your care team</b><span>A person, in working hours</span></div>
            <Icon name="chev" size={13} />
          </button>
        </div>

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
                    {it.when} · {it.doctorAdded ? 'Added by your doctor' : it.actor}
                    {booked[it.id] ? ` · ${booked[it.id]}` : ''}
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
