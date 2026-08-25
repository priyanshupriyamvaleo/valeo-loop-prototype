import { useState } from 'react';
import Icon from '../ui/Icon';
import { Field, Chip, Note, IconBtn } from '../ui/kit';
import { useStudio } from '../lib/store';

/*
 * THE PRE-PURCHASE BUILDER — the PDP, the cart, and the confirmation.
 *
 * Three screens, one editor, because they are one argument: here is what this
 * is, here is what it costs, here is what happens first. Splitting them across
 * three tools is how the confirmation ends up promising something the PDP did
 * not sell.
 *
 * Two fields here are refusals rather than inputs.
 *
 * The promo code field is locked off. "The protocol is the offer. Bundle or
 * discount, never both." A disabled input says that more permanently than a
 * line in a wiki does.
 *
 * The twelve-week statement blocks publishing when empty. The brief names it
 * the single most important line on the page and the fix for one-month churn,
 * so the builder treats it as structural rather than as copy.
 */
export default function PrePurchase({ goalId }) {
  const { state, update } = useStudio();
  const draft = state.drafts?.[goalId];
  const [tab, setTab] = useState('pdp');

  if (!draft || !draft.prepurchase) {
    return <div className="card card-pad empty">No pre-purchase flow configured for this goal.</div>;
  }

  const pp = draft.prepurchase;
  const patch = (fn) => update((d) => { fn(d.drafts[goalId].prepurchase); });

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="grow">
          <h2>Pre-purchase flow</h2>
          <p className="sub">
            The three screens between triage and a paid protocol. The patient app
            renders exactly what is here, in this order.
          </p>
        </div>
        <div className="tabs">
          {[['pdp', 'PDP'], ['cart', 'Cart'], ['confirm', 'Confirmation']].map(([k, t]) => (
            <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{t}</button>
          ))}
        </div>
      </div>

      {tab === 'pdp' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="card card-pad" style={{ display: 'grid', gap: 12 }}>
            <Field label="Page title" value={pp.pdp.title}
              onChange={(v) => patch((p) => { p.pdp.title = v; })} />
            <Field label="Hero summary" type="textarea" rows={3} value={pp.pdp.hero}
              onChange={(v) => patch((p) => { p.pdp.hero = v; })} />
            <Field label="The 12-week statement" type="textarea" rows={2} value={pp.pdp.twelveWeek}
              onChange={(v) => patch((p) => { p.pdp.twelveWeek = v; })}
              hint="Required. Publishing is refused without it — it is the fix for one-month churn." />
          </div>

          <div className="card card-pad">
            <h3 style={{ marginBottom: 10 }}>Timeline blocks ({pp.pdp.timeline.length})</h3>
            {pp.pdp.timeline.map((b, i) => (
              <div className="item" key={i}>
                <span className="when">{String(i + 1).padStart(2, '0')}</span>
                <div className="body" style={{ display: 'grid', gap: 8 }}>
                  <Field label="Heading" value={b.t}
                    onChange={(v) => patch((p) => { p.pdp.timeline[i].t = v; })} />
                  <Field label="Body" type="textarea" rows={2} value={b.s}
                    onChange={(v) => patch((p) => { p.pdp.timeline[i].s = v; })} />
                </div>
                <div className="acts">
                  <IconBtn name="trash" title="Remove block" danger
                    onClick={() => patch((p) => { p.pdp.timeline.splice(i, 1); })} />
                </div>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 6 }}
              onClick={() => patch((p) => { p.pdp.timeline.push({ t: '', s: '' }); })}>
              <Icon name="plus" size={12} /> Add block
            </button>
          </div>

          <div className="card card-pad" style={{ display: 'grid', gap: 12 }}>
            <Field label="Related symptoms" type="textarea" rows={3}
              value={(pp.pdp.symptoms || []).join('\n')}
              onChange={(v) => patch((p) => { p.pdp.symptoms = v.split('\n').filter((s) => s.trim()); })}
              hint="One per line. This is also what the goal picker matches against." />
            <Field label="What's included" type="textarea" rows={8}
              value={(pp.pdp.included || []).join('\n')}
              onChange={(v) => patch((p) => { p.pdp.included = v.split('\n').filter((s) => s.trim()); })}
              hint="One per line." />
            <Field label="Service provider line" value={pp.pdp.provider}
              onChange={(v) => patch((p) => { p.pdp.provider = v; })}
              hint="Never name a doctor or the pharmacy. Copy rule." />
          </div>
        </div>
      )}

      {tab === 'cart' && (
        <div className="card card-pad" style={{ display: 'grid', gap: 14 }}>
          <div className="grid-2">
            <Field label="Price (AED)" type="number" value={pp.cart.price}
              onChange={(v) => patch((p) => { p.cart.price = v; })} />
            <Field label="Instalment amount (AED)" type="number" value={pp.cart.instalmentAmount}
              onChange={(v) => patch((p) => { p.cart.instalmentAmount = v; })} />
          </div>
          <Field label="Number of instalments" type="number" value={pp.cart.instalmentCount}
            onChange={(v) => patch((p) => { p.cart.instalmentCount = v; })} />
          <Field label="Payment widgets" type="textarea" rows={2}
            value={(pp.cart.widgets || []).join('\n')}
            onChange={(v) => patch((p) => { p.cart.widgets = v.split('\n').filter((s) => s.trim()); })} />
          <Field label="Promo code field" value="Not permitted on protocol SKUs" disabled
            lockWhy="The protocol is the offer. Bundle or discount, never both. This is refused by the builder, not by review." />
          <Field label="Cart CTA" value={pp.cart.cta}
            onChange={(v) => patch((p) => { p.cart.cta = v; })} />
        </div>
      )}

      {tab === 'confirm' && (
        <div style={{ display: 'grid', gap: 14 }}>
          <div className="card card-pad" style={{ display: 'grid', gap: 12 }}>
            <Field label="Headline" value={pp.confirmation.title}
              onChange={(v) => patch((p) => { p.confirmation.title = v; })} />
            <Field label="Body" type="textarea" rows={3} value={pp.confirmation.body}
              onChange={(v) => patch((p) => { p.confirmation.body = v; })} />
            <Field label="Single action" value={pp.confirmation.action}
              onChange={(v) => patch((p) => { p.confirmation.action = v; })}
              hint="One action only. A confirmation screen with two buttons is a screen that is not sure what happens next." />
          </div>
          <Note label="Why one action">
            The protocol starts with testing, so the only thing this screen can honestly
            ask for is the nurse visit. Everything else in the plan is blocked behind it.
          </Note>
        </div>
      )}
    </>
  );
}
