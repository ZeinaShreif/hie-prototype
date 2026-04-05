import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { usePatientStore } from '../core/store';

const NAV_ITEMS = [
  { to: '/',            label: 'Overview',  end: true  },
  { to: '/profile',     label: 'Profile',   end: false },
  { to: '/medications', label: 'Medications', end: false },
  { to: '/vaccinations',label: 'Vaccines',  end: false },
  { to: '/procedures',  label: 'Procedures',end: false },
  { to: '/insurance',   label: 'Insurance', end: false },
  { to: '/share',       label: 'Share',     end: false },
];

function computeProgress(p: {
  firstName: string; lastName: string; dateOfBirth: string; sex: string;
  address: string; city: string; state: string; zip: string; phone: string;
  email: string; preferredLanguage: string; maritalStatus: string; bloodType: string;
  heightFt: number | null; heightIn: number | null; weightLbs: number | null;
}): number {
  const values = [
    p.firstName, p.lastName, p.dateOfBirth, p.sex,
    p.address, p.city, p.state, p.zip, p.phone, p.email,
    p.preferredLanguage, p.maritalStatus, p.bloodType,
    p.heightFt !== null ? String(p.heightFt) : '',
    p.heightIn !== null ? String(p.heightIn) : '',
    p.weightLbs !== null ? String(p.weightLbs) : '',
  ];
  const filled = values.filter((v) => v !== '').length;
  return Math.round((filled / values.length) * 100);
}

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
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || 'PA';
  const fullName = [first, last].filter(Boolean).join(' ') || 'Your Name';
  const progress = computeProgress(personal);

  return (
    <header className="bg-cobalt-900 no-print">
      {/* Avatar + Name + Save */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div
          className="flex items-center justify-center rounded-full shrink-0 font-extrabold text-sm bg-cobalt-500 text-cobalt-900"
          style={{ width: 46, height: 46 }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-white truncate" style={{ fontSize: 17, fontFamily: "'Libre Baskerville', Georgia, serif" }}>
            {fullName}
          </div>
          <div className="text-xs text-cobalt-300" style={{ fontSize: 12 }}>
            {formatToday()}
          </div>
        </div>

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
