import { useState } from 'react';
import Icon from '../ui/Icon';
import { suggestGoal, findService } from '../../p2/lib/seed';

/* ── THE WAITING SCREEN ──
   The demo's hinge. When the app reaches something the Studio has not authored
   yet, it says exactly what is missing and where it is authored, rather than
   dead-ending or faking content. The moment that thing is published in the
   other tab, Continue appears here without a refresh. */
export function Gate({ gate, title, open, onContinue, onBack }) {
  return (
    <div className="screen">
      <div className="shead">
        <button className="iconbtn" onClick={onBack}><Icon name="back" size={14} /></button>
        <div className="stitle">{title || 'Valeo Protocols'}</div>
      </div>
      <div className="scroll">
        <div className="gatebox">
          <div className="k">{open ? 'Ready' : 'Waiting on the Studio'}</div>
          <h3>{open ? `${gate.t} is published.` : `${gate.t} has not been published yet.`}</h3>
          <p>
            {open
              ? 'The app is reading the version that was just published next door. Continue to see it.'
              : 'This part of the journey is configuration, not code. Nothing is hardcoded here, so the app has nothing to show until somebody publishes it.'}
          </p>
          <div className="where">
            <Icon name={open ? 'check' : 'lock'} size={12} /> Valeo Studio · {gate.studio}
          </div>
        </div>
      </div>
      <div className="foot">
        <button className="cta" disabled={!open} onClick={onContinue}>
          Continue <Icon name="chev" size={16} />
        </button>
        <div className="tiny">
          {open ? 'Published and live.' : 'This button turns on the moment it is published.'}
        </div>
      </div>
    </div>
  );
}

/* ── TRIAGE ──
   Renders whatever the Chat Builder published. No gating on this goal: every
   answer leads to the same next step, so the questions buy the doctor context
   rather than a routing decision. */
export function Triage({ title, config, onDone, onBack }) {
  const qs = config.questions || [];
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multi, setMulti] = useState([]);
  const q = qs[i];
  const last = i >= qs.length - 1;

  if (!q) {
    return (
      <div className="screen">
        <div className="scroll"><div className="gatebox">
          <h3>This chat has no questions.</h3>
          <p>It was published empty, so there is nothing to ask.</p>
        </div></div>
        <div className="foot"><button className="cta" onClick={() => onDone({})}>Continue</button></div>
      </div>
    );
  }

  const commit = (val) => {
    const next = { ...answers, [q.id]: val };
    setAnswers(next); setMulti([]);
    if (last) onDone(next); else setI(i + 1);
  };

  return (
    <div className="screen">
      <div className="shead">
        <button className="iconbtn" onClick={onBack}><Icon name="back" size={14} /></button>
        <div style={{ flex: 1 }}>
          <div className="stitle">{title}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Question {i + 1} of {qs.length}</div>
        </div>
      </div>
      <div className="scroll pad">
        <div className="bub">{config.intro}</div>
        {qs.slice(0, i).map((prev) => (
          <div key={prev.id}>
            <div className="bub">{prev.q}</div>
            <div className="bub me">{[].concat(answers[prev.id] || []).join(', ')}</div>
          </div>
        ))}
        <div className="bub">{q.q}</div>
      </div>
      <div className="foot">
        {q.kind === 'multi' ? (
          <>
            <div className="chips" style={{ marginBottom: 10 }}>
              {(q.options || []).map((o) => (
                <button key={o} className={`chip-a ${multi.includes(o) ? 'on' : ''}`}
                  onClick={() => setMulti((m) => (m.includes(o) ? m.filter((x) => x !== o) : [...m, o]))}>
                  {o}
                </button>
              ))}
            </div>
            <button className="cta" disabled={!multi.length} onClick={() => commit(multi)}>
              {last ? 'Finish' : 'Next'} <Icon name="chev" size={16} />
            </button>
          </>
        ) : (
          <div className="chips">
            {(q.options || ['Continue']).map((o) => (
              <button key={o} className="chip-a" onClick={() => commit(o)}>{o}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── THE ONBOARDING CHAT ──
   Runs before a goal exists, which is what makes it different from triage: its
   whole job is to end with a goal. Three parts in one thread, because to the
   patient it is one conversation — questions, then the details a doctor needs,
   then the goal itself with a suggestion attached.

   The suggestion never removes a choice. All three goals are always on screen;
   one of them is marked. */
export function Onboarding({ config, goals, onDone, onBack }) {
  const qs = config.questions || [];
  const fields = config.profile?.fields || [];
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState({});
  const [multi, setMulti] = useState([]);
  const [profile, setProfile] = useState({});

  /* One flat sequence: every question, then the details step, then the goal. */
  const stepCount = qs.length + 2;
  const onProfile = i === qs.length;
  const onGoal = i === qs.length + 1;
  const q = qs[i];

  const commit = (val) => {
    setAnswers((a) => ({ ...a, [q.id]: val }));
    setMulti([]);
    setI(i + 1);
  };

  const suggested = onGoal ? suggestGoal(config, answers) : null;
  const profileDone = fields.every((f) => String(profile[f.id] ?? '').trim() !== '');

  return (
    <div className="screen">
      <div className="shead">
        <button className="iconbtn" onClick={onBack}><Icon name="back" size={14} /></button>
        <div style={{ flex: 1 }}>
          <div className="stitle">Valeo Protocols</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Step {i + 1} of {stepCount}</div>
        </div>
      </div>

      <div className="scroll pad">
        <div className="bub">{config.intro}</div>
        {qs.slice(0, i).map((prev) => (
          <div key={prev.id}>
            <div className="bub">{prev.q}</div>
            <div className="bub me">{[].concat(answers[prev.id] || []).join(', ')}</div>
          </div>
        ))}
        {q && <div className="bub">{q.q}</div>}

        {onProfile && (
          <>
            <div className="bub">{config.profile.t}. {config.profile.sub}</div>
            <div className="profile">
              {fields.map((f) => (
                <label className="pf" key={f.id}>
                  <span>{f.t}</span>
                  {f.kind === 'choice' ? (
                    <div className="chips">
                      {(f.options || []).map((o) => (
                        <button key={o} className={`chip-a ${profile[f.id] === o ? 'on' : ''}`}
                          onClick={() => setProfile((p) => ({ ...p, [f.id]: o }))}>{o}</button>
                      ))}
                    </div>
                  ) : (
                    <div className="pf-in">
                      <input inputMode={f.kind === 'number' ? 'numeric' : 'text'}
                        value={profile[f.id] || ''}
                        onChange={(e) => setProfile((p) => ({ ...p, [f.id]: e.target.value }))} />
                      {f.suffix && <i>{f.suffix}</i>}
                    </div>
                  )}
                </label>
              ))}
            </div>
          </>
        )}

        {onGoal && (
          <>
            <div className="bub">{config.goalStep.t}. {config.goalStep.sub}</div>
            <div style={{ marginTop: 10 }}>
              {goals.map((g) => (
                <button className="goalrow" key={g.id} style={{ width: '100%' }}
                  onClick={() => onDone({ answers, profile, goal: g.id })}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,201,60,.18)',
                                display: 'grid', placeItems: 'center', color: 'var(--gold)', flex: 'none' }}>
                    <Icon name={g.ic} size={16} />
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <b>{g.t}</b><span>{g.sub}</span>
                  </div>
                  {g.id === suggested && <span className="sugg">Suggested</span>}
                  <Icon name="chev" size={15} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="foot">
        {onProfile ? (
          <button className="cta" disabled={!profileDone} onClick={() => setI(i + 1)}>
            Continue <Icon name="chev" size={16} />
          </button>
        ) : onGoal ? (
          <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>
            Pick one to carry on.
          </div>
        ) : q && q.kind === 'multi' ? (
          <>
            <div className="chips" style={{ marginBottom: 10 }}>
              {(q.options || []).map((o) => (
                <button key={o} className={`chip-a ${multi.includes(o) ? 'on' : ''}`}
                  onClick={() => setMulti((m) => (m.includes(o) ? m.filter((x) => x !== o) : [...m, o]))}>
                  {o}
                </button>
              ))}
            </div>
            <button className="cta" disabled={!multi.length} onClick={() => commit(multi)}>
              Next <Icon name="chev" size={16} />
            </button>
          </>
        ) : (
          <div className="chips">
            {(q?.options || ['Continue']).map((o) => (
              <button key={o} className="chip-a" onClick={() => commit(o)}>{o}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── PDP · CART · CONFIRMATION ──
   Three screens rendered from one published config, in the order the
   Package Builder holds them. */
export function PDP({ cfg, onBuy, onBack }) {
  const [tab, setTab] = useState('measured');
  const p = cfg.pdp;
  return (
    <div className="screen">
      <div className="shead">
        <button className="iconbtn" onClick={onBack}><Icon name="back" size={14} /></button>
        <div className="stitle">Protocol</div>
      </div>
      <div className="scroll pad">
        <div className="h1">{p.title}</div>
        <div className="p">{p.hero}</div>

        <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 13,
                      background: 'var(--gold-soft)', border: '1px solid var(--gold)' }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.12em',
                        textTransform: 'uppercase', color: 'var(--gold-deep)' }}>The 12-week statement</div>
          <div style={{ fontSize: 13, color: 'var(--ink)', marginTop: 5, lineHeight: 1.5 }}>{p.twelveWeek}</div>
        </div>

        <div className="sectlbl" style={{ margin: '20px 0 8px' }}>How the 12 weeks run</div>
        {p.timeline.map((b, n) => (
          <div className="rowitem" key={n}>
            <div className="n">{n + 1}</div>
            <div><b>{b.t}</b><span>{b.s}</span></div>
          </div>
        ))}

        <div className="sectlbl" style={{ margin: '20px 0 8px' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['measured', "What's measured"], ['symptoms', 'Symptoms'], ['included', "What's included"]]
              .map(([k, t]) => (
              <button key={k} onClick={() => setTab(k)} style={{
                fontSize: 10.5, fontWeight: 700, letterSpacing: '.04em', padding: '5px 9px',
                borderRadius: 8, background: tab === k ? 'var(--ink)' : '#fff',
                color: tab === k ? '#fff' : 'var(--ink-2)', border: '1px solid var(--line)',
                textTransform: 'none',
              }}>{t}</button>
            ))}
          </div>
        </div>
        {tab === 'symptoms' && p.symptoms.map((s) => (
          <div className="rowitem" key={s}><div className="tick"><Icon name="check" size={10} /></div><div><b>{s}</b></div></div>
        ))}
        {/* Each line is a real service now, so the patient reads the same words
            the package was actually costed from. */}
        {tab === 'included' && p.included.map((line) => {
          const svc = findService(line.serviceId);
          if (!svc) return null;
          return (
            <div className="rowitem" key={line.serviceId}>
              <div className="tick"><Icon name="check" size={10} /></div>
              <div>
                <b>{line.qty > 1 ? `${line.qty} × ` : ''}{svc.t}</b>
                <span>{line.note || svc.note}</span>
              </div>
            </div>
          );
        })}
        {tab === 'measured' && (
          <div className="p" style={{ marginTop: 0 }}>
            Recovery &amp; Inflammation Panel, at baseline and again at Week 12. The same
            panel both times, so the comparison means something.
          </div>
        )}

        <div className="pricebox">
          <div className="price">AED {cfg.cart.price.toLocaleString()}</div>
          <div className="p" style={{ marginTop: 2 }}>
            Or {cfg.cart.instalmentCount} monthly payments of AED {cfg.cart.instalmentAmount.toLocaleString()}
          </div>
          {cfg.cart.widgets.map((w) => (
            <div key={w} style={{ fontSize: 11.5, color: 'var(--ink-3)', marginTop: 5 }}>{w}</div>
          ))}
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 9, lineHeight: 1.5 }}>{p.provider}</div>
        </div>
      </div>
      <div className="foot">
        <button className="cta gold" onClick={onBuy}>{cfg.cart.cta}</button>
      </div>
    </div>
  );
}

export function Cart({ cfg, onPay, onBack }) {
  const c = cfg.cart;
  return (
    <div className="screen">
      <div className="shead">
        <button className="iconbtn" onClick={onBack}><Icon name="back" size={14} /></button>
        <div className="stitle">Checkout</div>
      </div>
      <div className="scroll pad">
        <div className="pricebox" style={{ marginTop: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{cfg.pdp.title}</div>
          <div className="p" style={{ marginTop: 4 }}>12 weeks · testing, therapy, unlimited consultations</div>
          <div className="price" style={{ marginTop: 12 }}>AED {c.price.toLocaleString()}</div>
          <div className="p" style={{ marginTop: 2 }}>
            or {c.instalmentCount} × AED {c.instalmentAmount.toLocaleString()}
          </div>
        </div>
        {!c.promoAllowed && (
          <div style={{ marginTop: 14, padding: '12px 14px', borderRadius: 13, background: '#fff',
                        border: '1px dashed var(--line-2)' }}>
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
              <b style={{ color: 'var(--ink)' }}>No promo code on this SKU.</b><br />
              The protocol is the offer. Bundle or discount, never both.
            </div>
          </div>
        )}
        <div className="sectlbl" style={{ margin: '20px 0 6px' }}>Pay with</div>
        {c.widgets.map((w) => (
          <div className="rowitem" key={w}><div className="tick"><Icon name="check" size={10} /></div>
            <div><b>{w.split(':')[0]}</b><span>{w.split(':')[1]}</span></div></div>
        ))}
      </div>
      <div className="foot">
        <button className="cta gold" onClick={onPay}>Pay AED {c.price.toLocaleString()}</button>
        <div className="tiny">Nothing is dispensed until your doctor has read your baseline panel.</div>
      </div>
    </div>
  );
}

export function Confirm({ cfg, onDone }) {
  const c = cfg.confirmation;
  return (
    <div className="screen">
      <div className="scroll pad" style={{ paddingTop: 40 }}>
        <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--green-soft)',
                      display: 'grid', placeItems: 'center', color: 'var(--green)' }}>
          <Icon name="check" size={26} stroke={2.4} />
        </div>
        <div className="h1" style={{ marginTop: 20 }}>{c.title}</div>
        <div className="p">{c.body}</div>
      </div>
      <div className="foot">
        <button className="cta" onClick={onDone}>{c.action} <Icon name="chev" size={16} /></button>
        <div className="tiny">One action, because everything else is blocked behind it.</div>
      </div>
    </div>
  );
}
