import type { ReactNode } from 'react';
import { usePatientStore } from '../core/store';
import type { ShareableSection } from '../core/types';

interface PrintSummaryProps {
  sections: ShareableSection[];
}

// ── Small layout helpers ───────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          fontWeight: 700,
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          borderBottom: '1px solid #000',
          paddingBottom: 3,
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <p style={{ margin: '3px 0', fontSize: 12 }}>
      <strong>{label}:</strong> {value}
    </p>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

export default function PrintSummary({ sections }: PrintSummaryProps) {
  const record = usePatientStore((s) => s.record);
  const {
    personal: p,
    emergencyContact: ec,
    allergies,
    medications,
    vaccinations,
    procedures,
    insurancePrimary,
    insuranceSecondary,
  } = record;

  const has = (s: ShareableSection) => sections.includes(s);
  const fullName = [p.firstName, p.lastName].filter(Boolean).join(' ') || '—';
  const today = new Date().toISOString().slice(0, 10);

  const activeMeds = medications.filter((m) => m.status === 'active');

  return (
    <div
      className="print-only"
      style={{ fontFamily: 'Georgia, serif', fontSize: 12, color: '#000', padding: '15mm 20mm' }}
    >
      {/* ── Header ── */}
      <div
        style={{
          borderBottom: '2px solid #000',
          paddingBottom: 12,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{fullName}</div>
        {p.dateOfBirth && (
          <div style={{ fontSize: 12 }}>Date of Birth: {p.dateOfBirth}</div>
        )}
        <div style={{ fontSize: 11, color: '#555', marginTop: 4 }}>
          Generated: {today}
        </div>
      </div>

      {/* ── Personal details ── */}
      {has('personal') && (
        <Section title="Personal Details">
          <Field label="Sex" value={p.sex} />
          <Field label="Blood Type" value={p.bloodType} />
          {(p.heightFt !== null || p.heightIn !== null) && (
            <Field
              label="Height"
              value={[p.heightFt !== null ? `${p.heightFt}'` : null, p.heightIn !== null ? `${p.heightIn}"` : null]
                .filter(Boolean)
                .join(' ')}
            />
          )}
          {p.weightLbs !== null && <Field label="Weight" value={`${p.weightLbs} lbs`} />}
          <Field label="Phone" value={p.phone} />
          <Field label="Email" value={p.email} />
          {[p.address, p.city, p.state, p.zip].some(Boolean) && (
            <Field
              label="Address"
              value={[p.address, p.city, p.state, p.zip].filter(Boolean).join(', ')}
            />
          )}
          <Field label="Preferred Language" value={p.preferredLanguage} />
          <Field label="Marital Status" value={p.maritalStatus} />
        </Section>
      )}

      {/* ── Emergency contact ── */}
      {has('emergency') && (
        <Section title="Emergency Contact">
          <Field label="Name" value={ec.name} />
          <Field label="Relationship" value={ec.relationship} />
          <Field label="Phone" value={ec.phone} />
        </Section>
      )}

      {/* ── Allergies ── */}
      {has('allergies') && (
        <Section title="Allergies">
          {allergies.length === 0 ? (
            <p style={{ margin: 0 }}>None reported</p>
          ) : (
            allergies.map((a) => (
              <p key={a.id} style={{ margin: '3px 0' }}>
                {a.substance}: {a.reaction} ({a.severity})
              </p>
            ))
          )}
        </Section>
      )}

      {/* ── Current medications ── */}
      {has('medications') && (
        <Section title="Current Medications">
          {activeMeds.length === 0 ? (
            <p style={{ margin: 0 }}>None reported</p>
          ) : (
            activeMeds.map((m) => (
              <p key={m.id} style={{ margin: '3px 0' }}>
                {m.name}
                {m.dosage ? `, ${m.dosage}` : ''}
                {m.frequency ? `, ${m.frequency}` : ''}
                {m.prescribingProvider ? ` (${m.prescribingProvider})` : ''}
              </p>
            ))
          )}
        </Section>
      )}

      {/* ── Vaccinations ── */}
      {has('vaccinations') && (
        <Section title="Vaccinations">
          {vaccinations.length === 0 ? (
            <p style={{ margin: 0 }}>None reported</p>
          ) : (
            vaccinations.map((v) => (
              <p key={v.id} style={{ margin: '3px 0' }}>
                {v.vaccineName}
                {v.dateAdministered ? `: ${v.dateAdministered}` : ''}
              </p>
            ))
          )}
        </Section>
      )}

      {/* ── Procedures ── */}
      {has('procedures') && (
        <Section title="Procedures &amp; Surgeries">
          {procedures.length === 0 ? (
            <p style={{ margin: 0 }}>None reported</p>
          ) : (
            procedures.map((proc) => (
              <p key={proc.id} style={{ margin: '3px 0' }}>
                {proc.procedureName}
                {proc.date ? `, ${proc.date}` : ''}
                {proc.facility ? `, ${proc.facility}` : ''}
              </p>
            ))
          )}
        </Section>
      )}

      {/* ── Primary insurance ── */}
      {has('insurancePrimary') && insurancePrimary && (
        <Section title="Primary Insurance">
          <Field label="Carrier" value={insurancePrimary.carrier} />
          <Field label="Plan" value={insurancePrimary.planName} />
          <Field label="Member ID" value={insurancePrimary.memberId} />
          <Field label="Group Number" value={insurancePrimary.groupNumber} />
          <Field label="Policy Holder" value={insurancePrimary.policyHolderName} />
        </Section>
      )}

      {/* ── Secondary insurance ── */}
      {has('insuranceSecondary') && insuranceSecondary && (
        <Section title="Secondary Insurance">
          <Field label="Carrier" value={insuranceSecondary.carrier} />
          <Field label="Plan" value={insuranceSecondary.planName} />
          <Field label="Member ID" value={insuranceSecondary.memberId} />
          <Field label="Group Number" value={insuranceSecondary.groupNumber} />
          <Field label="Policy Holder" value={insuranceSecondary.policyHolderName} />
        </Section>
      )}

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: '1px solid #000',
          marginTop: 24,
          paddingTop: 8,
          fontSize: 10,
          color: '#666',
          textAlign: 'center',
        }}
      >
        Generated by HIE Prototype — not for clinical use
      </div>
    </div>
  );
}
