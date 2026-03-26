import { usePatientStore } from '../core/store';
import { formatPhone } from './formatPhone';

export default function EmergencyContactForm() {
  const emergencyContact = usePatientStore((s) => s.record.emergencyContact);
  const updateEmergencyContact = usePatientStore((s) => s.updateEmergencyContact);

  const hasContact = Boolean(emergencyContact.name);

  return (
    <div className="hie-section">
      {/* Section header */}
      <div className="hie-section-header">
        <div className="flex items-center">
          <h2 className="hie-section-title">Emergency Contact</h2>

          {hasContact && (
            <span
              className="flex items-center gap-1 font-bold"
              style={{
                background: '#E8F8F0',
                border: '1.5px solid #A8DFC0',
                borderRadius: 8,
                padding: '3px 10px',
                color: '#1A7A3C',
                fontSize: 10,
                fontWeight: 700,
                marginLeft: 8,
              }}
            >
              <span
                className="inline-block rounded-full shrink-0"
                style={{ width: 6, height: 6, backgroundColor: '#2ECC71' }}
              />
              On file
            </span>
          )}
        </div>
      </div>

      {/* Field grid */}
      <div className="grid grid-cols-2">

        {/* Name — full width */}
        <div className="col-span-2 hie-field">
          <label htmlFor="emergencyName" className="hie-label">Name</label>
          <input
            id="emergencyName"
            type="text"
            value={emergencyContact.name}
            onChange={(e) => updateEmergencyContact({ name: e.target.value })}
            className="hie-input"
            placeholder="Full name"
          />
        </div>

        {/* Relationship | Phone */}
        <div className="hie-field-left">
          <label htmlFor="emergencyRelationship" className="hie-label">Relationship</label>
          <input
            id="emergencyRelationship"
            type="text"
            value={emergencyContact.relationship}
            onChange={(e) => updateEmergencyContact({ relationship: e.target.value })}
            className="hie-input"
            placeholder="e.g. Spouse"
          />
        </div>
        <div className="hie-field">
          <label htmlFor="emergencyPhone" className="hie-label">Phone</label>
          <input
            id="emergencyPhone"
            type="tel"
            value={emergencyContact.phone}
            onChange={(e) => updateEmergencyContact({ phone: formatPhone(e.target.value) })}
            className="hie-input"
            placeholder="(000) 000-0000"
          />
        </div>

      </div>
    </div>
  );
}
