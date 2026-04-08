import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { usePatientStore } from '../core/store';
import { computeProgress } from '../core/progress';

const NAV_ITEMS = [
  { to: '/overview',    label: 'Overview',  end: true  },
  { to: '/profile',     label: 'Profile',   end: false },
  { to: '/medications', label: 'Medications', end: false },
  { to: '/vaccinations',label: 'Vaccines',  end: false },
  { to: '/procedures',  label: 'Procedures',end: false },
  { to: '/insurance',   label: 'Insurance', end: false },
  { to: '/share',       label: 'Share',     end: false },
];


function formatToday(): string {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

interface PageHeaderProps {
  onSave?: () => void;
}

export default function PageHeader({ onSave }: PageHeaderProps) {
  const personal = usePatientStore((s) => s.record.personal);
  const [saved, setSaved] = useState(false);

  const first = personal.firstName || '';
  const last = personal.lastName || '';
  const fullName = [first, last].filter(Boolean).join(' ') || 'Your Name';
  const progress = computeProgress(personal);

  return (
    <header className="bg-cobalt-900 no-print">
      {/* Row 1: Home icon + HealthPass wordmark + Save */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, textDecoration: 'none' }}>
          <div
            style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'rgba(255,255,255,0.10)',
              border: '1.5px solid rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
            }}
          >
            🏠
          </div>
          <div style={{ fontFamily: "'Libre Baskerville', Georgia, serif", fontWeight: 700, fontSize: 18 }}>
            <span style={{ color: '#D4A017' }}>Health</span>
            <span style={{ color: 'var(--cyan-bright)' }}>Pass</span>
          </div>
        </Link>

        {/* Production upgrade: replace handleSave body with an API save call */}
        <button
          disabled={saved}
          onClick={() => {
            onSave?.();
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
          className="shrink-0 font-bold text-sm"
          style={{
            borderRadius: 8,
            padding: '9px 20px',
            fontWeight: 700,
            backgroundColor: saved ? '#10B981' : 'var(--cyan-bright)',
            color: saved ? '#fff' : 'var(--navy)',
            transition: 'background-color 0.2s, color 0.2s',
            cursor: saved ? 'default' : 'pointer',
          }}
        >
          {saved ? 'Saved ✓' : 'Save changes'}
        </button>
      </div>

      {/* Row 2: Patient name + date */}
      <div className="px-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="font-extrabold text-white" style={{ fontSize: 17, fontFamily: "'Libre Baskerville', Georgia, serif" }}>
          {fullName}
        </div>
        <div className="text-cobalt-300" style={{ fontSize: 11.5, marginTop: 2 }}>
          {formatToday()}
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5" style={{ marginBottom: 14 }}>
        <div className="flex justify-between" style={{ marginBottom: 6 }}>
          <span className="text-xs text-cobalt-300" style={{ fontSize: 12 }}>
            Profile completeness
          </span>
          <span className="text-xs font-bold text-cobalt-500" style={{ fontSize: 12 }}>
            {progress}% complete
          </span>
        </div>
        <div className="w-full" style={{ height: 4, backgroundColor: '#152460', borderRadius: 2 }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: 'var(--cyan-bright)',
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Nav tabs */}
      <nav className="flex overflow-x-auto" style={{ borderBottom: '1px solid #152460' }}>
        {NAV_ITEMS.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="flex-1 text-center whitespace-nowrap font-bold uppercase"
            style={({ isActive }) => ({
              fontSize: 11,
              letterSpacing: '0.5px',
              padding: '11px 14px',
              color: isActive ? 'var(--cyan-light)' : 'var(--muted)',
              borderBottom: isActive
                ? '2px solid var(--cyan-bright)'
                : '2px solid transparent',
            })}
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
