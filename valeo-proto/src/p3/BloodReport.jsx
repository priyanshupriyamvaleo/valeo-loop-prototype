import { useState } from 'react';
import Icon from '../p2/ui/Icon';
import { Chip, Note } from '../p2/ui/kit';
import { PANELS, latestPanel, priorPanel, outOfRange, priorRow, bandPosition } from '../p1/lib/labs';
import { go } from '../p2/lib/router';

/* ══ THE BLOOD REPORT ═══════════════════════════════════════════════════════
 *
 * What a coach could not do before: read the numbers properly. The panel showed
 * six rows on the Order Detail screen with the reference printed as a sentence
 * — "under 3.0" beside "4.1" — and left the reader to do the comparison in
 * their head, six times, with no history and no sense of by how much.
 *
 * THREE THINGS THIS ADDS, and each is a real clinical question:
 *
 *   BY HOW MUCH    a bar with the band drawn on it, so "4.1 against under 3.0"
 *                  is a position rather than two numbers.
 *   SINCE WHEN     the same marker in the previous panel, and the direction.
 *                  A falling hs-CRP that is still high is a different call from
 *                  a rising one at the same value.
 *   WHAT FIRST     out-of-range markers sort to the top. A coach with a call
 *                  starting reads six rows in the order that matters, not the
 *                  order the lab returned them.
 *
 * TWO STATES THAT ARE DESIGNED, NOT ERRORS. Before the sample is read there is
 * no report and the screen says so. With one panel on file there is no trend,
 * and saying "no change" of a single reading would invite a doctor to read a
 * flat line that does not exist — the same rule `Track` already follows.
 */

/** Which marker moved, and whether that is the good direction. */
function delta(row, before) {
  if (!before) return null;
  const now = Number(row.v);
  const was = Number(before.v);
  if (!Number.isFinite(now) || !Number.isFinite(was) || now === was) {
    return { move: 0, text: 'no change', tone: '' };
  }
  const move = now - was;
  /* Towards the band is good, away from it is not. A marker already inside its
     band has no better direction, so movement there is neither. */
  const outside = (x) => (row.lo !== undefined && x < row.lo) || (row.hi !== undefined && x > row.hi);
  const distance = (x) => (row.lo !== undefined && x < row.lo ? row.lo - x
    : row.hi !== undefined && x > row.hi ? x - row.hi : 0);
  const tone = !outside(now) && !outside(was) ? ''
    : distance(now) < distance(was) ? 'up' : 'down';
  return {
    move,
    text: `${move > 0 ? '+' : ''}${Number(move.toFixed(2))}`,
    tone,
  };
}

/** The band, drawn. Grey track, tinted band, a tick where the value landed. */
function Band({ row }) {
  const p = bandPosition(row);
  if (!p) return <span className="rb-none">no band</span>;
  return (
    <span className="rb" title={`Reference ${row.ref}`}>
      <i className="rb-ok" style={{ left: `${p.bandStart}%`, right: `${100 - p.bandEnd}%` }} />
      <u className={`rb-v ${row.flag}`} style={{ left: `${p.value}%` }} />
    </span>
  );
}

export default function BloodReport({ order, patient, resulted }) {
  /* Newest first in the picker, because that is the one being discussed. */
  const [panelId, setPanelId] = useState(latestPanel().id);
  const panel = PANELS.find((p) => p.id === panelId) || latestPanel();
  const before = panel.id === latestPanel().id ? priorPanel() : null;

  const back = () => go(`/clinician/${order.id}`);

  if (!resulted) {
    return (
      <>
        <button className="crumb" onClick={back}>
          <Icon name="back" size={12} /> Order {order.id}
        </button>
        <div className="row" style={{ margin: '10px 0 16px' }}>
          <div className="grow">
            <h2>Blood report</h2>
            <p className="sub">{patient?.name || order.name} · Order {order.id}</p>
          </div>
        </div>
        <div className="card card-pad">
          <p className="empty-line" style={{ margin: 0 }}>
            The sample has not been collected and read, so there is no report. This is
            not a missing file — the panel step has not completed yet, and until it does
            the lab holds nothing for this patient.
          </p>
        </div>
      </>
    );
  }

  const off = outOfRange(panel.rows);
  /* Out of range first, then by name, so the reading order is the clinical one
     and it does not change between two panels of the same markers. */
  const rows = [...panel.rows].sort((a, b) => {
    if ((a.flag !== 'ok') !== (b.flag !== 'ok')) return a.flag !== 'ok' ? -1 : 1;
    return a.t.localeCompare(b.t);
  });

  return (
    <>
      <button className="crumb" onClick={back}>
        <Icon name="back" size={12} /> Order {order.id}
      </button>

      <div className="row" style={{ margin: '10px 0 16px' }}>
        <div className="grow">
          <h2>Blood report</h2>
          <p className="sub">
            {patient?.name || order.name} · {panel.label} · collected {panel.collectedOn}
          </p>
        </div>
        <Chip tone={off ? 'ed' : 'live'}>
          {off} of {panel.rows.length} outside range
        </Chip>
      </div>

      {/* WHICH PANEL. One button per panel on file, oldest to newest, so the
          patient's history is visible as a row rather than hidden in a select
          the reader has to open to learn it exists. */}
      <div className="row" style={{ gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {PANELS.map((p) => (
          <button key={p.id}
            className={`btn btn-sm ${p.id === panel.id ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setPanelId(p.id)}>
            {p.role} · {p.collectedOn}
          </button>
        ))}
        <span className="hint">
          {PANELS.length > 1
            ? 'The newest panel is read against the one before it.'
            : 'One panel on file, so there is no trend to read yet.'}
        </span>
      </div>

      <div className="card">
        {/* Scrolls INSIDE its own box. The table is wider than the 1080px page
            and without this it pushed the whole screen sideways, which moves
            the sidebar and the header off with it. */}
        <div className="rpt-scroll">
          <table className="otable otable-in rpt-t">
          <thead>
            <tr>
              <th>Marker</th>
              <th className="rpt-num">Result</th>
              <th>Where it sits</th>
              <th>Reference</th>
              <th className="rpt-num">{before ? `vs ${before.role.toLowerCase()}` : 'Previous'}</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const was = priorRow(before, r.t);
              const d = delta(r, was);
              return (
                <tr key={r.t}>
                  <td><b>{r.t}</b></td>
                  <td className="ores rpt-num">
                    {r.v} <i className="mono-sm">{r.u}</i>
                  </td>
                  <td style={{ minWidth: 190 }}><Band row={r} /></td>
                  <td className="dmute">{r.ref}</td>
                  <td className="rpt-num">
                    {d
                      ? <span className={`trk-d ${d.tone}`}>{d.text}</span>
                      : <span className="dmute">—</span>}
                    {was && <i className="dmute rpt-was">was {was.v}</i>}
                  </td>
                  <td>
                    <span className={`orange ${r.flag}`}>
                      {r.flag === 'ok' ? 'In Range' : r.flag === 'high' ? 'High' : 'Low'}
                    </span>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>

        <div className="card-pad" style={{ borderTop: '1px solid var(--line)' }}>
          <p className="fine" style={{ margin: 0 }}>
            Marker values and reference ranges are placeholders pending clinical sign-off.
            A band drawn open at one end has no published bound on that side, and the track
            is padded so the reading stays visible — the padding is drawing, not a range.
          </p>
        </div>
      </div>

      {off > 0 && (
        <div style={{ marginTop: 14 }}>
          <Note tone="gold" label="Worth raising on the call">
            <p style={{ margin: 0 }}>
              {rows.filter((r) => r.flag !== 'ok').map((r) => r.t).join(' · ')}
              {' '}
              {off === 1 ? 'is' : 'are'} outside range.
              {before
                ? ' The column on the right says which way each has moved since the'
                  + ` ${before.role.toLowerCase()}.`
                : ' There is no earlier panel, so there is no direction to read.'}
            </p>
          </Note>
        </div>
      )}
    </>
  );
}
