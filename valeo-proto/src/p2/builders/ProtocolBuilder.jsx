import { useState } from 'react';
import Icon from '../ui/Icon';
import { go } from '../lib/router';
import { Field, Chip, Note, IconBtn } from '../ui/kit';
import { useStudio } from '../lib/store';
import { serviceGroupsFor, findService } from '../lib/seed';
import { actorOf, whenLabel, weekNo } from '../../p1/lib/journey';
import { publishedFor, chatsForGoal, chatVersions, goalOf } from '../../shared/bus';

/* ── WHERE THE STEPS BEGIN ──
   A protocol does not start at step one. It starts at the onboarding chat,
   which every goal shares and no category manager owns, and then the goal chat
   this protocol is pinned to. Showing both above the steps is what makes the
   funnel one thing on one screen instead of three screens somebody has to hold
   in their head.

   The onboarding chat is fixed and viewable. The goal chat is a choice, and it
   is a choice of VERSION — so publishing a newer chat cannot change what a
   live protocol asks. */
function FunnelHead({ protocol, state, patchProtocol, readOnly }) {
  const onb = publishedFor(state, 'shared', 'onboarding');
  const chats = chatsForGoal(state, protocol.goal);
  const linked = protocol.chat || {};
  const vs = chatVersions(state, linked.id || chats[0]?.id);
  const chat = chats.find((c) => c.id === linked.id) || null;
  const set = (fn) => { if (!readOnly) patchProtocol(protocol.id, fn); };

  return (
    <div className="funnel">
      <div className="fn-step fixed">
        <span className="fn-n">Before</span>
        <div className="grow">
          <b>Onboarding chat</b>
          <span>
            {onb ? `v${onb.version} live · ${(onb.data?.questions || []).length} questions`
                 : 'not published'} · shared by every goal
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => go('/chats/onboarding')}>
          View <Icon name="chev" size={11} />
        </button>
      </div>

      <div className="fn-arrow"><Icon name="chev" size={12} /></div>

      <div className={`fn-step ${linked.id ? '' : 'warn'}`}>
        <span className="fn-n">Then</span>
        <div className="grow">
          <b>{chat ? chat.name : 'No goal chat linked'}</b>
          <span>
            {chat
              ? `asked after the goal is chosen, before the price`
              : `${goalOf(protocol.goal)?.t || protocol.goal} patients would go straight to the price`}
          </span>
        </div>
        {chats.length > 0 && (
          <div className="fn-pick">
            <select value={linked.id || ''} disabled={readOnly}
              onChange={(e) => {
                const id = e.target.value;
                const v = chatVersions(state, id)[0]?.version || 1;
                set((p) => { p.chat = id ? { id, version: v } : undefined; });
              }}>
              <option value="">Not linked</option>
              {chats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {linked.id && (
              <select value={String(linked.version || '')} disabled={readOnly}
                onChange={(e) => set((p) => { p.chat = { ...p.chat, version: Number(e.target.value) }; })}>
                {vs.map((v) => (
                  <option key={v.version} value={String(v.version)}>
                    v{v.version} · {new Date(v.at).toLocaleDateString('en-GB',
                      { day: 'numeric', month: 'short', year: '2-digit' })}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      <div className="fn-arrow"><Icon name="chev" size={12} /></div>
      <div className="fn-step now">
        <span className="fn-n">Now</span>
        <div className="grow">
          <b>The steps below</b>
          <span>What happens after they pay</span>
        </div>
      </div>
    </div>
  );
}

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
/*
 * ── ONE THING, NOT FOUR TABS ──
 * This screen used to carry Listing, Clinical and Commercial beside the plan.
 * Listing held one field that mattered — how many weeks — and that is a
 * property of the protocol, so it now sits in the protocol's own header beside
 * its name and its region. Clinical and Commercial were read-only restatements
 * of things authored elsewhere: the panel is a service on a step, the prices are
 * the package's invoice, and the screening gate lives on the catalogue item it
 * gates. A tab that only repeats another screen is a second place for the same
 * fact to be wrong.
 */
export default function ProtocolBuilder({ scope, protocol, readOnly = false }) {
  const { state, update, patchProtocol } = useStudio();
  const draft = state.drafts?.[scope];
  const [refused, setRefused] = useState(null);
  const [editing, setEditing] = useState(null);   /* id of the row open for editing */

  if (!draft || !draft.plan) {
    return <div className="card card-pad empty">This protocol has no plan template.</div>;
  }

  const region = protocol?.region || 'uae';
  const weeksTotal = protocol?.weeks || 12;
  const WEEKS = Array.from({ length: weeksTotal }, (_, i) => i + 1);
  const groups = serviceGroupsFor(region);
  const plan = draft.plan;
  /* The one guard that matters. A locked protocol's draft cannot be written,
     whatever a control on screen looks like it would do. */
  const patch = readOnly ? () => {} : (fn) => update((d) => { fn(d.drafts[scope]); });

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
    <div className={readOnly ? 'ro' : ''}>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="grow">
          <h2>Step Builder</h2>
          <p className="sub">
            An ordered list of items with due offsets. Purchase copies this onto the
            patient as their own schedule, and the app shows whichever item is due.
            Adding an item adds a state without adding a screen.
          </p>
        </div>
      </div>

      <FunnelHead protocol={protocol} state={state} patchProtocol={patchProtocol}
        readOnly={readOnly} />

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
                      /* Only what this region sells, and with no country on
                         the labels: the builder is already scoped to one, and
                         repeating it on every option is how a scope stops
                         being read. */
                      groups={[{ label: 'None', items: [{ value: '', label: 'Not linked' }] },
                               ...groups]}
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
      </>
    </div>
  );
}
