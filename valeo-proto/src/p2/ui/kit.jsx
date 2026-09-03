import Icon from './Icon';

export function Field({ label, value, onChange, type = 'text', rows = 3, hint,
                        disabled, lockWhy, options, placeholder, display, groups,
                        disabledOptions = [] }) {
  return (
    <div className="field">
      <label>
        {label}
        {lockWhy && <span className="chip chip-lock" style={{ marginLeft: 6 }}>locked</span>}
      </label>
      {type === 'textarea' ? (
        <textarea value={value} rows={rows} disabled={disabled} placeholder={placeholder}
          onChange={(e) => onChange && onChange(e.target.value)} />
      ) : type === 'select' ? (
        <select value={value} disabled={disabled} onChange={(e) => onChange && onChange(e.target.value)}>
          {/* `display` lets a select carry ids as values and names as labels,
              which is what linking to a catalogue needs: the id is what gets
              stored, the name is what a human picks. `groups` adds the headings,
              so one dropdown can offer a whole catalogue without a second
              dropdown first asking which shelf to look on. */}
          {groups
            ? groups.map((g) => (
                g.items.length === 0 ? null : (
                  <optgroup key={g.label} label={g.label}>
                    {g.items.map((o) => (
                      <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
                    ))}
                  </optgroup>
                )
              ))
            : (options || []).map((o) => (
                <option key={o} value={o} disabled={disabledOptions.includes(o)}>
                  {display ? (display[o] || o) : o}
                </option>
              ))}
        </select>
      ) : (
        <input type={type} value={value} disabled={disabled} placeholder={placeholder}
          onChange={(e) => onChange && onChange(type === 'number' ? Number(e.target.value) : e.target.value)} />
      )}
      {(hint || lockWhy) && <span className="hint">{lockWhy || hint}</span>}
    </div>
  );
}

export const Chip = ({ tone = 'draft', children }) =>
  <span className={`chip chip-${tone}`}>{children}</span>;

export function Note({ tone = 'gold', label, children }) {
  return (
    <div className={`note note-${tone}`}>
      {label && <span className="note-lbl">{label}</span>}
      {children}
    </div>
  );
}

export const IconBtn = ({ name, onClick, disabled, title, danger }) => (
  <button className={`icon-btn ${danger ? 'danger' : ''}`} onClick={onClick}
    disabled={disabled} title={title} aria-label={title}>
    <Icon name={name} size={14} />
  </button>
);
