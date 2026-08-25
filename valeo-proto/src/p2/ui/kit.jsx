import Icon from './Icon';

export function Field({ label, value, onChange, type = 'text', rows = 3, hint,
                        disabled, lockWhy, options, placeholder }) {
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
          {(options || []).map((o) => <option key={o} value={o}>{o}</option>)}
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
