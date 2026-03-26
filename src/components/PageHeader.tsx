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

function formatDob(iso: string): string {
  if (!iso) return 'Date of birth not set';
  const d = new Date(iso + 'T00:00:00');
  const formatted = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return `Date of birth: ${formatted}`;
}

export default function PageHeader() {
  const personal = usePatientStore((s) => s.record.personal);

  const first = personal.firstName || '';
  const last = personal.lastName || '';
  const initials = ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || 'PA';
  const fullName = [first, last].filter(Boolean).join(' ') || 'Your Name';
  const progress = computeProgress(personal);

  return (
    <header className="bg-navy">
      {/* Avatar + Name + Save */}
      <div className="flex items-center gap-3 px-5 pt-5 pb-4">
        <div
          className="flex items-center justify-center rounded-full shrink-0 font-extrabold text-white text-sm bg-cyan"
          style={{ width: 46, height: 46 }}
        >
          {initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-white truncate" style={{ fontSize: 17 }}>
            {fullName}
          </div>
          <div className="text-xs text-muted" style={{ fontSize: 12 }}>
            {formatDob(personal.dateOfBirth)}
          </div>
        </div>

        <button
          className="shrink-0 font-bold text-white text-sm bg-cyan-bright"
          style={{ borderRadius: 8, padding: '9px 20px', fontWeight: 700 }}
        >
          Save changes
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-5" style={{ marginBottom: 14 }}>
        <div className="flex justify-between" style={{ marginBottom: 6 }}>
          <span className="text-xs text-muted" style={{ fontSize: 12 }}>
            Profile completeness
          </span>
          <span className="text-xs font-bold text-cyan-bright" style={{ fontSize: 12 }}>
            {progress}% complete
          </span>
        </div>
        <div className="w-full" style={{ height: 4, backgroundColor: '#0A1A4E', borderRadius: 2 }}>
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
      <nav className="flex overflow-x-auto" style={{ borderBottom: '1px solid #0A1A4E' }}>
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
