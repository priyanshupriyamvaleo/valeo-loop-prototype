import { useState } from 'react';
import Icon from '../ui/Icon';
import { Field, Chip, Note, IconBtn } from '../ui/kit';
import { useStudio } from '../lib/store';
import { serviceGroupsFor, findService, invoiceOf } from '../lib/seed';
import { money, ccyOf, regionOf } from '../../shared/bus';

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
/* ── WHAT IS IN THE PACKAGE, AND WHAT IT COSTS ──
   This used to be eight sentences somebody typed, which meant the package had a
   price nobody could check: the number in the cart was an assertion.

   Now it is an invoice. Each line points at a service this region actually
   sells, at that region's price, with a quantity and a cut. A second cut comes
   off the subtotal. The number that falls out IS the price on the cart — there
   is no field to type it into, because two places to set one price is how a
   cart and a package description start disagreeing.

   ── DISCOUNTS ARE NOT PROMO CODES ──
   A promo code is a patient stacking a saving on top of a bundle, and that is
   still refused on the cart. This is how the bundle's own price is arrived at.
   The difference between what the parts cost separately and what the protocol
   costs is the whole argument for buying it as one thing, and it is now a
   number in front of the person setting it rather than a claim in a deck. */
function Included({ pp, region, patch }) {
  const inv = invoiceOf(pp, region);
  const ccy = ccyOf(region);
  const set = (i, key, value) => patch((p) => { p.pdp.included[i][key] = value; });
  const pct = (v) => Math.min(100, Math.max(0, Number(v) || 0));

  return (
    <div>
      <div className="row" style={{ marginBottom: 8 }}>
        <div className="grow">
          <label className="lbl-inline">What is included</label>
          <span className="hint">
            Every line is a real service at {regionOf(region).short} prices, so the package
            adds up instead of being asserted.
          </span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => patch((p) => {
          p.pdp.included.push({ serviceId: 'consult_gp', qty: 1, discount: 0, note: '' });
        })}>
          <Icon name="plus" size={12} /> Add a line
        </button>
      </div>

      <table className="invoice">
        <thead>
          <tr><th>Service</th><th className="n">Qty</th><th className="n">Unit</th>
            <th className="n">Off</th><th className="n">Total</th><th /></tr>
        </thead>
        <tbody>
          {inv.rows.map((r, i) => (
            <tr key={`${r.serviceId}-${i}`} className={r.sold ? '' : 'gone'}>
              <td>
                <Field type="select" value={r.serviceId}
                  groups={serviceGroupsFor(region)}
                  onChange={(v) => set(i, 'serviceId', v)} />
                <input className="inv-note" value={r.note || ''} placeholder={r.svc.note}
                  onChange={(e) => set(i, 'note', e.target.value)} />
                {!r.sold && (
                  <span className="hint">
                    Not sold in {regionOf(region).short}. It prices at zero here.
                  </span>
                )}
              </td>
              <td className="n">
                <input className="inv-qty" type="number" min="1" value={r.qty}
                  onChange={(e) => set(i, 'qty', Math.max(1, Number(e.target.value) || 1))} />
              </td>
              <td className="n mono">{r.unit.toLocaleString()}</td>
              <td className="n">
                <div className="inv-pct">
                  <input type="number" min="0" max="100" value={r.disc || ''} placeholder="0"
                    onChange={(e) => set(i, 'discount', pct(e.target.value))} />
                  <i>%</i>
                </div>
              </td>
              <td className="n mono">
                {r.disc > 0 && <s>{r.gross.toLocaleString()}</s>}
                {r.net.toLocaleString()}
              </td>
              <td className="n">
                <IconBtn name="trash" danger title="Remove line"
                  onClick={() => patch((p) => { p.pdp.included.splice(i, 1); })} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr><td colSpan={4}>Components at their own list price</td>
            <td className="n mono">{inv.list.toLocaleString()}</td><td /></tr>
          {inv.lineSaved > 0 && (
            <tr><td colSpan={4}>Less the cuts on individual lines</td>
              <td className="n mono">−{inv.lineSaved.toLocaleString()}</td><td /></tr>
          )}
          <tr>
            <td colSpan={4}>
              <div className="inv-total-row">
                <span>Less a cut on the whole package</span>
                <div className="inv-pct">
                  <input type="number" min="0" max="100" value={pp.pdp.discount || ''} placeholder="0"
                    onChange={(e) => patch((p) => { p.pdp.discount = pct(e.target.value); })} />
                  <i>%</i>
                </div>
              </div>
            </td>
            <td className="n mono">{inv.pkgSaved ? `−${inv.pkgSaved.toLocaleString()}` : '—'}</td><td />
          </tr>
          <tr className="grand">
            <td colSpan={4}>The price on the cart</td>
            <td className="n mono">{ccy} {inv.total.toLocaleString()}</td><td />
          </tr>
        </tfoot>
      </table>

      {/* The bundle argument, in the one form anybody can check. */}
      <div className={`bundle ${inv.total <= 0 ? 'bad' : ''}`}>
        {inv.total <= 0 ? (
          <b>The package prices at zero. Publishing is refused until it does not.</b>
        ) : (
          <>
            <b>Bought separately, these come to {money(inv.list, region)}.</b>
            <span>
              The protocol is {money(inv.total, region)}, so a patient keeps{' '}
              {money(inv.saved, region)} — {Math.round((inv.saved / inv.list) * 100)}% —
              by taking it as one thing. That is the whole argument for the bundle, and
              it is a number rather than a claim.
            </span>
          </>
        )}
      </div>

      <span className="hint">
        Catalogue prices are placeholders pending sign-off, so the total is only as good
        as they are.
      </span>
    </div>
  );
}

export default function PrePurchase({ scope, protocol, readOnly = false }) {
  const { state, update } = useStudio();
  const draft = state.drafts?.[scope];
  const [tab, setTab] = useState('pdp');

  if (!draft || !draft.prepurchase) {
    return <div className="card card-pad empty">This protocol has no package.</div>;
  }

  const region = protocol?.region || 'uae';
  const pp = draft.prepurchase;
  const inv = invoiceOf(pp, region);
  /* The one guard that matters. A locked protocol's draft cannot be written,
     whatever a control on screen looks like it would do. */
  const patch = readOnly ? () => {} : (fn) => update((d) => { fn(d.drafts[scope].prepurchase); });

  return (
    <div className={readOnly ? 'ro' : ''}>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="grow">
          <h2>The package</h2>
          <p className="sub">
            The three screens between triage and a paid protocol, at{' '}
            {regionOf(region).t} prices. The patient app renders exactly what is here,
            in this order.
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
              hint="Required. Publishing is refused without it. It is the fix for one-month churn." />
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
            <Included pp={pp} region={region} patch={patch} />
            <Field label="Service provider line" value={pp.pdp.provider}
              onChange={(v) => patch((p) => { p.pdp.provider = v; })}
              hint="Never name a doctor or the pharmacy. Copy rule." />
          </div>
        </div>
      )}

      {tab === 'cart' && (
        <div style={{ display: 'grid', gap: 14 }}>
          {/* ── THE PRICE IS NOT A FIELD ──
              It is the invoice on the PDP tab. This screen shows what that came
              to and how it splits, and nothing here can contradict it. */}
          <div className="card card-pad">
            <div className="row" style={{ alignItems: 'flex-end' }}>
              <div className="grow">
                <span className="ls-k">The price on the cart</span>
                <div className="cart-price">{money(inv.total, region)}</div>
                <span className="hint">
                  Computed from what the package is made of. To change it, change the
                  package or its discounts on the <b>PDP</b> tab.
                </span>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => setTab('pdp')}>
                Open the invoice <Icon name="chev" size={12} />
              </button>
            </div>
          </div>

          <div className="card card-pad" style={{ display: 'grid', gap: 14 }}>
            <div className="grid-2">
              <Field label="Number of instalments" type="number" value={pp.cart.instalmentCount}
                onChange={(v) => patch((p) => { p.cart.instalmentCount = Math.max(1, v || 1); })} />
              <Field label="Each instalment" disabled
                value={money(Math.ceil(inv.total / Math.max(1, pp.cart.instalmentCount || 1)), region)}
                hint="The price divided by the number of instalments. Not a second number to set." />
            </div>
            <Field label="Payment widgets" type="textarea" rows={2}
              value={(pp.cart.widgets || []).join('\n')}
              onChange={(v) => patch((p) => { p.cart.widgets = v.split('\n').filter((s) => s.trim()); })} />
            <Field label="Promo code field" value="Not permitted on protocol SKUs" disabled
              lockWhy="The discount is already in the price, set on the invoice by whoever priced the package. A code on top of that is a second discount nobody approved. Refused by the builder, not by review." />
          </div>
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
    </div>
  );
}
