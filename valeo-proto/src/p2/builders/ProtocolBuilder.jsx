import { useState } from 'react';
import Icon from '../ui/Icon';
import { Field, Chip, Note, IconBtn } from '../ui/kit';
import { useStudio } from '../lib/store';
import { LOCKED_RULES, SERVICE_GROUPS, findService } from '../lib/seed';
import { actorOf, whenLabel, weekNo } from '../../p1/lib/journey';

/*
 * THE PROTOCOL BUILDER — the after-purchase journey.
 *
 * This is the part of the Studio that actually drives the product. Everything
 * else is copy and pricing; this is a plan template, and a purchase copies it
 * onto one patient as a dated schedule. The app then shows the earliest item
 * that is due or overdue. Nothing else.
 *
 * Which is why adding an item here adds a state to the patient's journey
 * without adding a screen, and why the doctor adding TB-500 at Week 6 needs no
 * new code at all.
 *
 * ── THE REFUSALS ARE THE FEATURE ──
 * A builder that lets a category manager change anything will eventually ship
 * something non-compliant. The baseline panel, the consultation and the Week 12
 * panel cannot be deleted: they are the product promise and the clinical basis
 * for dispensing. The delete button is disabled and says why, because a rule
 * you can read at the moment you try to break it is worth ten in a document.
 */
/* The protocol is twelve weeks, and the duration is set on the Listing tab. */
const WEEKS = Array.from({ length: 12 }, (_, i) => i + 1);

const TABS = [['plan', 'Plan template'], ['listing', 'Listing'],
               ['clinical', 'Clinical'], ['commercial', 'Commercial']];

export default function ProtocolBuilder({ goalId }) {
  const { state, update } = useStudio();
  const draft = state.drafts?.[goalId];
  const [tab, setTab] = useState('plan');
  const [refused, setRefused] = useState(null);
  const [editing, setEditing] = useState(null);   /* id of the row open for editing */

  if (!draft || !draft.plan) {
    return <div className="card card-pad empty">No protocol template configured for this goal.</div>;
  }

  const plan = draft.plan;
  const meta = draft.meta;
  const patch = (fn) => update((d) => { fn(d.drafts[goalId]); });

  const move = (i, dir) => patch((d) => {
    const j = i + dir;
    if (j < 0 || j >= d.plan.length) return;
    [d.plan[i], d.plan[j]] = [d.plan[j], d.plan[i]];
  });

  const remove = (item, i) => {
    if (item.locked) { setRefused(item); return; }
    patch((d) => { d.plan.splice(i, 1); });
  };

  /* Editing writes straight through to the draft on every keystroke. A modal
     with a Save button would be the safer pattern in a real tool, but here the
     point of the screen is that the template is not fixed, and watching the row
     change under your hands makes that argument better than a dialog does. */
  const edit = (i, field, value) => patch((d) => { d.plan[i][field] = value; });

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="grow">
          <h2>Protocol template</h2>
          <p className="sub">
            An ordered list of items with due offsets. Purchase copies this onto the
            patient as their own schedule, and the app shows whichever item is due.
            Adding an item adds a state without adding a screen.
          </p>
        </div>
        <div className="tabs">
          {TABS.map(([k, t]) => (
            <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{t}</button>
          ))}
        </div>
      </div>

      {tab === 'plan' && (
        <>
          <div className="row" style={{ marginBottom: 8, gap: 8 }}>
            <span className="hint grow">
              {/* There used to be a "blocking" chip here claiming it stopped
                  everything downstream. Nothing read it. The plan runs in order
                  of week and the app only ever shows the earliest step
                  not yet done, so every step already waits for the one above
                  it. A flag that restates the rule is a promise the code does
                  not keep, and the first person to notice stops trusting the
                  rest of the legend. */}
              {plan.length} items, in order of week. Each one waits for the one above it
              · <Chip tone="key">milestone</Chip> · <Chip tone="lock">locked</Chip> cannot be removed
            </span>
            {/* A new step lands directly under whichever one is open, because
                that is where somebody thinking about the plan wants it. The
                offset is copied from the step above rather than picking a
                number: the list is ordered by offset and equal offsets keep
                their insertion order, so the row stays where it was dropped. */}
            <button className="btn btn-ghost btn-sm" onClick={() => patch((d) => {
              const at = d.plan.findIndex((x) => x.id === editing);
              const after = at === -1 ? d.plan.length - 1 : at;
              const prev = d.plan[after];
              const born = { id: 'p' + Date.now().toString(36), t: 'New step', sub: '',
                             week: prev ? prev.week : 1 };
              d.plan.splice(after + 1, 0, born);
              setTimeout(() => setEditing(born.id), 0);
            })}>
              <Icon name="plus" size={12} /> {editing ? 'Add step below' : 'Add item'}
            </button>
          </div>

          {plan.map((it, i) => (
            <div className={`item ${it.locked ? 'locked' : ''}`} key={it.id}>
              <span className="when">{whenLabel(it)}</span>
              <div className="body">
                <b>{it.t}</b>
                <span>{it.sub}</span>
                <div className="row" style={{ gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                  {actorOf(it) && <Chip tone="draft">{actorOf(it)}</Chip>}
                  {it.milestone && <Chip tone="key">milestone</Chip>}
                  {it.locked && <Chip tone="lock">locked</Chip>}
                  {findService(it.serviceId) && (
                    <Chip tone="live">{findService(it.serviceId).t}</Chip>
                  )}
                  {it.blocker && <Chip tone="block">blocks what follows</Chip>}
                  {it.clinicianCanSet && <Chip tone="ed">doctor can change</Chip>}

                </div>
              </div>
              <div className="acts">
                <IconBtn name="pencil" title={editing === it.id ? 'Close' : 'Edit item'}
                  onClick={() => setEditing(editing === it.id ? null : it.id)} />
                <IconBtn name="up" title="Move up" onClick={() => move(i, -1)} disabled={i === 0} />
                <IconBtn name="down" title="Move down" onClick={() => move(i, 1)} disabled={i === plan.length - 1} />
                <IconBtn name="trash" danger onClick={() => remove(it, i)}
                  title={it.locked ? 'Locked. Cannot be removed' : 'Remove item'} />
              </div>
              {editing === it.id && (
                <div className="item-edit split">
                  {/* WORDS ON THE LEFT, WIRING ON THE RIGHT.
                      They are two different jobs done by two different heads:
                      somebody writing to a patient, and somebody deciding what
                      the step is plugged into. Interleaving them made the whole
                      panel read as one undifferentiated form. */}
                  <div className="col">
                    <div className="col-h">What the patient reads</div>
                    <Field label="Title" value={it.t} onChange={(v) => edit(i, 't', v)} />
                    <Field label="The line under it" value={it.sub}
                      onChange={(v) => edit(i, 'sub', v)}
                      hint="Say what happens, not how it will feel." />
                    <Field label="Call to action" value={it.action?.label || ''}
                      onChange={(v) => edit(i, 'action', v.trim()
                        ? { kind: it.action?.kind || 'book', label: v }
                        : undefined)}
                      hint="The button the patient presses. Leave it empty and the step
                            becomes something they wait on rather than something they do." />
                  </div>

                  <div className="col">
                    <div className="col-h">How it is wired</div>

                    {/* ── WHEN, AS A WEEK ──
                        Not a date, and no longer a span of days. The plan is
                        sold in weeks and its milestones are named in weeks; the
                        exact appointment comes from the booking, which is an API
                        away and not something a category manager should type. */}
                    <Field label="Week" type="select" value={String(weekNo(it))}
                      options={WEEKS.map(String)}
                      display={WEEKS.reduce((a, w) => ({ ...a, [String(w)]: `Week ${w}` }), {})}
                      onChange={(v) => edit(i, 'week', Number(v))}
                      hint="Steps in the same week keep the order they are listed in, so the
                            arrows above decide what comes first." />

                    {/* ── WHAT THIS STEP ACTUALLY IS ──
                        One dropdown, grouped by category. There is no separate
                        service type control: which catalogue a step draws from
                        is a property of the step, not a decision, and asking
                        twice let the two answers disagree. */}
                    <Field label="Linked service" type="select"
                      value={it.serviceId || ''}
                      groups={[{ label: 'None', items: [{ value: '', label: 'Not linked' }] },
                               ...SERVICE_GROUPS]}
                      onChange={(v) => edit(i, 'serviceId', v || undefined)}
                      hint={findService(it.serviceId)?.note
                        || 'Booking, tracking and results already exist behind it.'} />

                    {/* ── A LABEL, NOT A MECHANISM ──
                        The backend reads this and decides what waits on what.
                        Nothing in this prototype gates on it, and the hint says
                        so: last time a chip here claimed to stop everything
                        downstream while no code read it, and the first person to
                        check stopped trusting the rest of the legend. */}
                    <Field label="Blocking" type="select"
                      value={it.blocker ? 'blocks' : 'free'}
                      options={['free', 'blocks']}
                      display={{ free: 'Does not block what follows',
                                 blocks: 'Blocks what follows' }}
                      onChange={(v) => edit(i, 'blocker', v === 'blocks' || undefined)}
                      hint="Declared here, enforced by the backend. This prototype runs the
                            plan in order either way." />

                    <label className="tick">
                      <input type="checkbox" checked={!!it.clinicianCanSet}
                        onChange={(e) => edit(i, 'clinicianCanSet', e.target.checked)} />
                      The doctor can change this for one patient at the consultation.
                    </label>

                    <div className="win-read">
                      Whose move: <b>{actorOf(it) || 'nobody named'}</b>. Read from the service
                      and the call to action rather than set twice.
                    </div>

                    <label className="tick" style={{ marginTop: 4 }}>
                      <input type="checkbox" checked={!!it.milestone}
                        onChange={(e) => edit(i, 'milestone', e.target.checked)} />
                      Milestone. Marked on the patient's timeline.
                    </label>
                  </div>

                  {it.locked && (
                    <Note tone="gold" label="Locked step">
                      <p style={{ margin: 0 }}>
                        The wording is yours to change. The step itself stays: {it.lockWhy}
                      </p>
                    </Note>
                  )}
                </div>
              )}
            </div>
          ))}

          {refused && (
            <div style={{ marginTop: 14 }}>
              <Note tone="red" label={`Refused · ${refused.t}`}>
                <p style={{ margin: 0 }}>{refused.lockWhy}</p>
                <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}
                  onClick={() => setRefused(null)}>Understood</button>
              </Note>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <h3 style={{ marginBottom: 8 }}>What the builder refuses</h3>
            <div className="card">
              {LOCKED_RULES.map((r) => (
                <div className="row" key={r.t} style={{
                  padding: '10px 14px', borderBottom: '1px solid var(--line)', alignItems: 'flex-start',
                }}>
                  <Icon name="lock" size={13} className="grow" style={{ flex: 'none' }} />
                  <div className="grow">
                    <b style={{ fontSize: 13 }}>{r.t}</b>
                    <div className="hint">{r.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'listing' && (
        <div className="card card-pad" style={{ display: 'grid', gap: 12 }}>
          <Field label="Duration (weeks)" type="number" value={meta.listing.duration}
            onChange={(v) => patch((d) => { d.meta.listing.duration = v; })} />
          <Note>
            Title, hero, symptoms, included list and the timeline blocks live in the
            Package Builder, because they are the page the patient reads. Editing
            them in two places is how a protocol ends up describing itself differently
            on the shelf and in the plan.
          </Note>
        </div>
      )}

      {tab === 'clinical' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="card card-pad" style={{ display: 'grid', gap: 12 }}>
            <Field label="Panel" type="textarea" rows={3} value={meta.clinical.panel} disabled
              lockWhy="Clinical only. Panel composition and gate class need Dr. Rayan's sign-off, so the builder routes these edits for approval rather than publishing them." />
            <Field label="Clinical gate class" value={meta.clinical.gateClass} disabled
              lockWhy="Clinical only." />
          </div>

          <div className="card card-pad">
            <h3 style={{ marginBottom: 8 }}>Screening questions</h3>
            {meta.clinical.screening.map((s) => (
              <div className="item" key={s.id}>
                <span className="when">mandatory</span>
                <div className="body">
                  <b>{s.q}</b>
                  <span>{s.note}</span>
                </div>
                <div className="acts"><Chip tone="clin">clinical only</Chip></div>
              </div>
            ))}
          </div>

          <div className="card card-pad">
            <h3 style={{ marginBottom: 8 }}>Add-ons</h3>
            {meta.clinical.addOns.map((a) => (
              <div className="item" key={a.id}>
                <span className="when">{a.price ? `AED ${a.price.toLocaleString()}` : 'clinical'}</span>
                <div className="body">
                  <b>{a.t}</b>
                  <span>{a.requires ? `Requires ${a.requires} · offered at ${a.offeredAt}` : a.note}</span>
                </div>
                <div className="acts">{a.requires ? <Chip tone="block">gated</Chip> : <Chip tone="ed">open</Chip>}</div>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <Note tone="red" label="The TB-500 gate">
                <p style={{ margin: 0 }}>
                  TB-500 is WADA-prohibited. Tested athletes stay on BPC-157 alone. The
                  upgrade never renders in the app for a patient who answered yes or who
                  has not been asked, and the doctor's consult screen cannot surface it
                  either. This is a gate on the offer itself, not a marketing suppression.
                </p>
              </Note>
            </div>
          </div>
        </div>
      )}

      {tab === 'commercial' && (
        <div className="card card-pad" style={{ display: 'grid', gap: 12 }}>
          <div className="grid-2">
            <Field label="Price (AED)" type="number" value={meta.commercial.price}
              onChange={(v) => patch((d) => { d.meta.commercial.price = v; })} />
            <Field label="Upgrade SKU (AED)" type="number" value={meta.commercial.upgrade.price}
              onChange={(v) => patch((d) => { d.meta.commercial.upgrade.price = v; })} />
          </div>
          <Field label="Instalments" value={meta.commercial.instalments}
            onChange={(v) => patch((d) => { d.meta.commercial.instalments = v; })} />
          <Field label="Add-on pricing" value={meta.commercial.addOnPricing}
            onChange={(v) => patch((d) => { d.meta.commercial.addOnPricing = v; })} />
          <Field label="Discount codes" value={meta.commercial.discountCodes} disabled
            lockWhy="Locked. The protocol is the offer. Bundle or discount, never both." />
        </div>
      )}
    </>
  );
}
