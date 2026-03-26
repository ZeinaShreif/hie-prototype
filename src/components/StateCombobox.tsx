import { useState, useRef, useEffect } from 'react';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
  'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
  'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
  'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
  'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
  'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
  'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
  'West Virginia', 'Wisconsin', 'Wyoming', 'District of Columbia',
];

interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export default function StateCombobox({ id, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });

  // Keep local query in sync when the committed value changes externally
  useEffect(() => { setQuery(value); }, [value]);

  const filtered = query.trim()
    ? US_STATES.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
    : US_STATES;

  function openDrop() {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 2, left: r.left, width: r.width });
    }
    setOpen(true);
  }

  function commit(state: string) {
    onChange(state);
    setQuery(state);
    setOpen(false);
  }

  function handleBlur() {
    // Small delay so onMouseDown on an option fires first
    setTimeout(() => {
      setOpen(false);
      // If the user typed something that isn't a valid state, revert to committed value
      if (!US_STATES.includes(query)) setQuery(value);
    }, 150);
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={query}
        placeholder="State"
        className="hie-input"
        onChange={(e) => { setQuery(e.target.value); openDrop(); }}
        onFocus={openDrop}
        onBlur={handleBlur}
      />

      {open && filtered.length > 0 && (
        <ul
          style={{
            position: 'fixed',
            top: dropPos.top,
            left: dropPos.left,
            width: dropPos.width,
            background: 'white',
            border: '1.5px solid var(--ice-border)',
            borderRadius: 8,
            maxHeight: 200,
            overflowY: 'auto',
            zIndex: 9999,
            marginTop: 2,
            padding: '4px 0',
            boxShadow: '0 4px 12px rgba(3,4,94,0.10)',
          }}
        >
          {filtered.map((s) => (
            <li
              key={s}
              onMouseDown={() => commit(s)}
              style={{
                padding: '7px 12px',
                fontSize: 13,
                cursor: 'pointer',
                color: s === value ? 'var(--cyan)' : 'var(--text-dark)',
                fontWeight: s === value ? 700 : 400,
                background: 'transparent',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--ice)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
