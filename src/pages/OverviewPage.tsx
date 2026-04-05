import { usePatientStore } from '../core/store';
import { Link } from 'react-router-dom';

interface SummaryCardProps {
  title: string;
  count: number;
  to: string;
  accentColor: string;
  accentBg: string;
  accentBorder: string;
  emptyLabel: string;
  items: string[];
}

function SummaryCard({ title, count, to, accentColor, accentBg, accentBorder, emptyLabel, items }: SummaryCardProps) {
  return (
    <div className="hie-section" style={{ marginBottom: 12 }}>
      <div className="hie-section-header">
        <h2 className="hie-section-title">{title}</h2>
        <div className="flex items-center gap-2">
          <span
            className="font-bold"
            style={{
              background: accentBg,
              color: accentColor,
              border: `1.5px solid ${accentBorder}`,
              fontSize: 11,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 10,
            }}
          >
            {count} on file
          </span>
          <Link
            to={to}
            className="font-bold"
            style={{ color: 'var(--cyan)', fontSize: 12 }}
          >
            Edit →
          </Link>
        </div>
      </div>
      <div style={{ padding: '10px 16px 12px' }}>
        {count === 0 ? (
          <p className="text-sm italic" style={{ color: 'var(--label-color)' }}>{emptyLabel}</p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {items.map((item, i) => (
              <li
                key={item}
                className="text-sm"
                style={{
                  color: 'var(--text-dark)',
                  padding: '3px 0',
                  borderBottom: i < items.length - 1 ? '1px solid var(--ice-divider)' : 'none',
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const personal = usePatientStore((s) => s.record.personal);
  const emergencyContact = usePatientStore((s) => s.record.emergencyContact);
  const allergies = usePatientStore((s) => s.record.allergies);
  const medications = usePatientStore((s) => s.record.medications);
  const vaccinations = usePatientStore((s) => s.record.vaccinations);
  const procedures = usePatientStore((s) => s.record.procedures);
  const insurancePrimary = usePatientStore((s) => s.record.insurancePrimary);

  const fullName = [personal.firstName, personal.lastName].filter(Boolean).join(' ') || '—';
  const dob = personal.dateOfBirth || '—';
  const bloodType = personal.bloodType || '—';

  return (
    <div className="p-4">

      {/* Identity banner */}
      <div
        className="hie-section"
        style={{ marginBottom: 12, padding: '14px 16px' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className="font-extrabold"
              style={{ color: 'var(--navy)', fontSize: 18, marginBottom: 2 }}
            >
              {fullName}
            </p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              DOB: {dob}
              {personal.sex ? ` · ${personal.sex}` : ''}
              {bloodType !== '—' ? ` · Blood type: ${bloodType}` : ''}
            </p>
          </div>
          <Link
            to="/profile"
            className="font-bold"
            style={{ color: 'var(--cyan)', fontSize: 12 }}
          >
            Edit →
          </Link>
        </div>
        {emergencyContact.name && (
          <p className="text-sm" style={{ color: 'var(--label-color)', marginTop: 6 }}>
            Emergency contact: <span style={{ color: 'var(--muted)' }}>{emergencyContact.name}</span>
            {emergencyContact.phone ? ` · ${emergencyContact.phone}` : ''}
          </p>
        )}
        {insurancePrimary?.carrier && (
          <p className="text-sm" style={{ color: 'var(--label-color)', marginTop: 4 }}>
            Insurance: <span style={{ color: 'var(--muted)' }}>{insurancePrimary.carrier}</span>
            {insurancePrimary.planName ? ` · ${insurancePrimary.planName}` : ''}
          </p>
        )}
      </div>

      {/* Allergies */}
      <SummaryCard
        title="Allergies"
        count={allergies.length}
        to="/profile"
        accentColor="#C62828"
        accentBg="#FFF0F0"
        accentBorder="#FFCDD2"
        emptyLabel="No allergies recorded."
        items={allergies.map((a) =>
          [a.substance, a.severity].filter(Boolean).join(' · ')
        )}
      />

      {/* Medications */}
      <SummaryCard
        title="Medications"
        count={medications.length}
        to="/medications"
        accentColor="#2E7D32"
        accentBg="#E8F5E9"
        accentBorder="#A5D6A7"
        emptyLabel="No medications recorded."
        items={medications.map((m) =>
          [m.name, m.dosage, m.status].filter(Boolean).join(' · ')
        )}
      />

      {/* Vaccinations */}
      <SummaryCard
        title="Vaccinations"
        count={vaccinations.length}
        to="/vaccinations"
        accentColor="#1565C0"
        accentBg="#E3F2FD"
        accentBorder="#90CAF9"
        emptyLabel="No vaccinations recorded."
        items={vaccinations.map((v) =>
          [v.vaccineName, v.dateAdministered].filter(Boolean).join(' · ')
        )}
      />

      {/* Procedures */}
      <SummaryCard
        title="Procedures"
        count={procedures.length}
        to="/procedures"
        accentColor="#6A1B9A"
        accentBg="#F3E5F5"
        accentBorder="#CE93D8"
        emptyLabel="No procedures recorded."
        items={procedures.map((p) =>
          [p.procedureName, p.date, p.category].filter(Boolean).join(' · ')
        )}
      />

    </div>
  );
}
