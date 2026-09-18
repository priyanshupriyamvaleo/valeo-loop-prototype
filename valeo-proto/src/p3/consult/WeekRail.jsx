import Icon from '../../p2/ui/Icon';

/* ══ WHERE THIS PATIENT IS ═════════════════════════════════════════════════
 *
 * The one question a coach asks before any other, and the screen could not
 * answer it without scrolling. It is a rail because a protocol is a sequence,
 * and reading a sequence as a list of cards loses the only thing a sequence has.
 *
 * ⚠️ DERIVED, NEVER DRAWN. The reference mock for this screen has a hand-drawn
 * version of the same rail, and in it W8 appears twice, W10 appears twice and
 * W11 carries no label at all. That is what a sequence does the moment it is
 * artwork: it drifts from the protocol the first time anybody edits the
 * protocol. This reads `planFor()` — the same resolver the patient's phone
 * reads — so the two cannot disagree.
 *
 * WEEKS COME FROM THE STEP, NOT FROM A COUNTER. The repo's rule is that a
 * protocol carries no time; a step's `week` is the builder's own field and a
 * refill's week is a property of that order. Nothing here computes a date.
 */
export default function WeekRail({ plan, done = [], current, onPick }) {
  if (!plan.length) {
    return (
      <p className="empty-line" style={{ margin: '0 0 14px' }}>
        No plan is published for this protocol, so there is no sequence to show.
      </p>
    );
  }

  /* One mark per step, grouped under the week it belongs to. Two steps in the
     same week sit under one heading rather than repeating it, which is the bug
     the drawn version has. */
  const weeks = [];
  plan.forEach((s) => {
    const w = s.week || 1;
    const last = weeks[weeks.length - 1];
    if (last && last.week === w) last.steps.push(s);
    else weeks.push({ week: w, steps: [s] });
  });

  return (
    <div className="rail">
      {weeks.map((g) => (
        <div className="rail-w" key={g.week}>
          <span className="rail-wk">W{g.week}</span>
          <div className="rail-steps">
            {g.steps.map((s) => {
              const isDone = done.includes(s.id);
              const isNow = current && current.id === s.id;
              return (
                <button key={s.id} type="button"
                  className={`rail-s ${isDone ? 'done' : ''} ${isNow ? 'now' : ''}`}
                  title={`${s.t}${s.sub ? ` — ${s.sub}` : ''}`}
                  onClick={() => onPick && onPick(s)}>
                  <i className="rail-dot">
                    {isDone && <Icon name="check" size={10} />}
                  </i>
                  <span>{s.t}</span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
