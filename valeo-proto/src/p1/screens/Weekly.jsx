import Icon from '../ui/Icon';

/*
 * THE WEEKLY JOURNEY — what a patient opens from Today.
 *
 * NOT the plan page. That one sells the protocol before anybody buys; this
 * tells somebody already on it what their body is doing this month and what to
 * concentrate on. So it carries its own five sections, authored in the
 * catalogue per protocol and in three versions.
 *
 * NOTHING HERE IS WRITTEN IN THIS FILE. Every heading, every line and every
 * item comes off the compiled phase, so rewording a phase in the catalogue
 * changes this screen with no code. The one thing the screen decides is which
 * phase to show, and it decides that from the week alone.
 *
 * WHICH IS WHY WEEKS ARE FINE HERE. A step names no week, because a lab or a
 * courier decides when it lands. How long ago somebody bought is known
 * exactly, and that is the only fact this page reads.
 */

/* The drawings that sit beside a "you may notice" line. A closed set: the
   catalogue offers these names and nothing else, so a name always has a
   drawing and never renders as an empty box. */
const NOTICE_ICON = {
  appetite: { ic: 'flask', tone: 'green' },
  fatigue: { ic: 'refresh', tone: 'violet' },
  scale: { ic: 'scale', tone: 'blue' },
  digestion: { ic: 'heart', tone: 'red' },
  energy: { ic: 'bolt', tone: 'red' },
  wellbeing: { ic: 'spark', tone: 'gold' },
  sleep: { ic: 'refresh', tone: 'violet' },
  mood: { ic: 'heart', tone: 'gold' },
};

function Hero({ block, label }) {
  return (
    <div className="wj-hero">
      <div className="wj-chip"><Icon name="clipboard" size={12} /> {label}</div>
      <h3>{block.heading}</h3>
      <p>{block.blurb}</p>
      <span className="wj-leaf" aria-hidden />
    </div>
  );
}

function Notice({ block }) {
  return (
    <div className="wj-card">
      <h4>{block.heading}</h4>
      {block.blurb && <p className="wj-sub">{block.blurb}</p>}
      <div className="wj-grid">
        {(block.items || []).map((it, i) => {
          const g = NOTICE_ICON[it.icon] || NOTICE_ICON.appetite;
          return (
            <div className="wj-note" key={i}>
              <span className={`wj-ic ${g.tone}`}><Icon name={g.ic} size={14} /></span>
              <div>
                <b>{it.title}</b>
                <span>{it.text}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Focus({ block }) {
  return (
    <div className="wj-pane green">
      <h4>{block.heading}</h4>
      {block.blurb && <p className="wj-sub">{block.blurb}</p>}
      <ul className="wj-ticks">
        {(block.items || []).map((it, i) => (
          <li key={i}>
            <span className="wj-tick"><Icon name="check" size={9} /></span>
            {it.text || it.title}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Next({ block }) {
  return (
    <div className="wj-pane blue">
      <h4>{block.heading}</h4>
      {block.blurb && <p className="wj-sub">{block.blurb}</p>}
      <ol className="wj-steps">
        {(block.items || []).map((it, i) => (
          <li key={i}>
            <span className="wj-n">{i + 1}</span>
            <div>
              <b>{it.title}</b>
              <span>{it.text}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function CareTeam({ block, onChat }) {
  return (
    <div className="wj-care">
      <span className="wj-av" aria-hidden />
      <div className="wj-care-b">
        <b>{block.heading}</b>
        <span>{block.blurb}</span>
      </div>
      <button className="wj-btn" onClick={onChat}>{block.ctaLabel || 'Message Now'}</button>
    </div>
  );
}

export default function Weekly({ journey, week, weeks, done, total, onBack, onChat }) {
  const phase = journey.phases.find((p) => week >= p.from && week <= p.to)
    || journey.phases[journey.phases.length - 1];

  const blocks = [...phase.blocks].sort((a, b) => a.rank - b.rank);
  const by = (t) => blocks.find((b) => b.type === t);
  const pct = total ? Math.round((done / total) * 100) : 0;

  /* Focus and Coming next sit side by side in the design, so they are drawn as
     a pair rather than in the flat rank order. Everything else is a full-width
     row and follows the order the catalogue set. */
  const focus = by('FOCUS_THIS_WEEK');
  const next = by('COMING_NEXT');

  return (
    <>
      <div className="wj-bar">
        <button className="wj-back" onClick={onBack} aria-label="Back">
          <Icon name="back" size={16} />
        </button>
        <b>Your Journey</b>
      </div>

      <div className="wj-scroll">
        <div className="wj-prog">
          <b>Week {week} of {weeks}</b>
          <span className="wj-track">
            {Array.from({ length: weeks }, (_, i) => (
              <i key={i} className={i < week ? 'on' : ''} />
            ))}
          </span>
          <em>{pct}% Complete</em>
        </div>

        {blocks.map((b) => {
          if (b.type === 'PHASE_HERO') return <Hero key={b.type} block={b} label={phase.label} />;
          if (b.type === 'YOU_MAY_NOTICE') return <Notice key={b.type} block={b} />;
          return null;
        })}

        {(focus || next) && (
          <div className="wj-pair">
            {focus && <Focus block={focus} />}
            {next && <Next block={next} />}
          </div>
        )}

        {by('CARE_TEAM') && <CareTeam block={by('CARE_TEAM')} onChat={onChat} />}

        {/* Nothing authored is nothing to read. It says so rather than drawing
            an empty screen a patient would take for a broken app. */}
        {blocks.length === 0 && (
          <div className="wj-card">
            <h4>Nothing to read yet</h4>
            <p className="wj-sub">
              Your care team is still writing this part of your journey. Your next step is
              on the home screen as usual.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
