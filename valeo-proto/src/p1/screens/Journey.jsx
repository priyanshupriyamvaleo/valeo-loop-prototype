import Icon from '../ui/Icon';
import { nextItem, progress, weekOf } from '../lib/journey';

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

export function JourneyDetail({ plan, done, onComplete, onBack, title }) {
  const item = nextItem(plan, done);

  return (
    <div className="screen">
      <div className="shead">
        <button className="iconbtn" onClick={onBack}><Icon name="back" size={14} /></button>
        <div style={{ flex: 1 }}>
          <div className="stitle">{title}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Your plan, twelve weeks</div>
        </div>
      </div>

      <div className="scroll pad">
        {item && (
          <div style={{
            borderRadius: 16, padding: 16, marginBottom: 16,
            background: item.blocking ? 'var(--red-soft)' : 'var(--gold-soft)',
            border: `1px solid ${item.blocking ? 'var(--red)' : 'var(--gold)'}`,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase',
              color: item.blocking ? 'var(--red)' : 'var(--gold-deep)',
            }}>
              {item.blocking ? 'Blocking · nothing moves until this is done' : 'Next'}
            </div>
            <div className="h1" style={{ fontSize: 19, marginTop: 6 }}>{item.t}</div>
            <div className="p" style={{ marginTop: 5 }}>{item.sub}</div>
            <div style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 8 }}>
              {item.when} · {item.actor}
            </div>
          </div>
        )}

        <div className="sectlbl" style={{ margin: '4px 0 4px' }}>The whole plan</div>
        {plan.map((it) => {
          const isDone = done.includes(it.id);
          const isNext = item && it.id === item.id;
          return (
            <div className="rowitem" key={it.id} style={{ opacity: isDone ? 0.5 : 1 }}>
              {isDone
                ? <div className="tick"><Icon name="check" size={10} /></div>
                : <div className="n" style={isNext
                    ? { background: 'var(--ink)', color: '#fff' }
                    : { background: 'transparent', border: '1px solid var(--line-2)', color: 'var(--ink-3)' }}>
                    {isNext ? '▸' : ''}
                  </div>}
              <div style={{ flex: 1 }}>
                <b style={{ textDecoration: isDone ? 'line-through' : 'none' }}>{it.t}</b>
                <span>{it.when} · {it.actor}{it.doctorAdded ? ' · added at your consult' : ''}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="foot">
        {item ? (
          <>
            <button className="cta" onClick={() => onComplete(item)}>
              {item.action ? item.action.label : `Mark done: ${it_short(item.t)}`} <Icon name="chev" size={16} />
            </button>
            <div className="tiny">
              {item.actor === 'Ops' || item.actor === 'Lab' || item.actor === 'Care team'
                ? 'This one is ours, not yours. The button stands in for us doing it.'
                : 'Your move.'}
            </div>
          </>
        ) : (
          <button className="cta" onClick={onBack}>Back to home</button>
        )}
      </div>
    </div>
  );
}

const it_short = (t) => (t.length > 22 ? `${t.slice(0, 22)}…` : t);
