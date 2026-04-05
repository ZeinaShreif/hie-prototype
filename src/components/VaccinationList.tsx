import { usePatientStore } from '../core/store';
import { newVaccination } from '../core/schema';
import type { Vaccination } from '../core/types';

export default function VaccinationList() {
  const vaccinations = usePatientStore((s) => s.record.vaccinations);
  const addVaccination = usePatientStore((s) => s.addVaccination);
  const updateVaccination = usePatientStore((s) => s.updateVaccination);
  const removeVaccination = usePatientStore((s) => s.removeVaccination);

  return (
    <div className="hie-section">

      {/* Section header */}
      <div className="hie-section-header">
        <h2 className="hie-section-title">Vaccinations</h2>
        <span
          style={{
            background: '#E3F2FD',
            color: '#1565C0',
            border: '1.5px solid #90CAF9',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 10,
          }}
        >
          {vaccinations.length} on file
        </span>
      </div>

      {/* Empty state */}
      {vaccinations.length === 0 && (
        <p className="text-sm italic" style={{ color: 'var(--label-color)', padding: '14px 16px' }}>
          No vaccinations recorded.
        </p>
      )}

      {/* Vaccination items */}
      {vaccinations.map((vax, index) => (
        <div
          key={vax.id}
          style={{ borderTop: index === 0 ? 'none' : '2px solid var(--ice-border)' }}
        >

          {/* Item header row */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: '8px 16px',
              background: 'var(--ice)',
              borderBottom: '1px solid var(--ice-divider)',
            }}
          >
            <span
              className="uppercase font-extrabold tracking-wide"
              style={{ fontSize: 10, color: 'var(--muted)' }}
            >
              Vaccination {index + 1}
            </span>
            <button
              aria-label="Delete"
              onClick={() => removeVaccination(vax.id)}
              className="font-bold leading-none"
              style={{ color: 'var(--label-color)', fontSize: 20 }}
            >
              ×
            </button>
          </div>

          {/* Fields grid */}
          <div className="grid grid-cols-2">

            <div className="hie-field-left">
              <label htmlFor={`vaxName-${vax.id}`} className="hie-label">Vaccine Name</label>
              <input
                id={`vaxName-${vax.id}`}
                type="text"
                value={vax.vaccineName}
                onChange={(e) => updateVaccination(vax.id, { vaccineName: e.target.value })}
                className="hie-input"
                placeholder="e.g. Influenza"
              />
            </div>

            <div className="hie-field">
              <label htmlFor={`vaxDate-${vax.id}`} className="hie-label">Date Administered</label>
              <input
                id={`vaxDate-${vax.id}`}
                type="date"
                value={vax.dateAdministered}
                onChange={(e) => updateVaccination(vax.id, { dateAdministered: e.target.value })}
                className="hie-input"
              />
            </div>

            <div className="hie-field-left">
              <label htmlFor={`vaxLot-${vax.id}`} className="hie-label">Lot Number</label>
              <input
                id={`vaxLot-${vax.id}`}
                type="text"
                value={vax.lotNumber}
                onChange={(e) => updateVaccination(vax.id, { lotNumber: e.target.value })}
                className="hie-input"
                placeholder="e.g. A2B3C4"
              />
            </div>

            <div className="hie-field">
              <label htmlFor={`vaxSite-${vax.id}`} className="hie-label">Administering Site</label>
              <input
                id={`vaxSite-${vax.id}`}
                type="text"
                value={vax.administeringSite}
                onChange={(e) => updateVaccination(vax.id, { administeringSite: e.target.value })}
                className="hie-input"
                placeholder="e.g. CVS Pharmacy"
              />
            </div>

            <div className="col-span-2 hie-field">
              <label htmlFor={`vaxSource-${vax.id}`} className="hie-label">Source</label>
              <select
                id={`vaxSource-${vax.id}`}
                value={vax.source}
                onChange={(e) =>
                  updateVaccination(vax.id, { source: e.target.value as Vaccination['source'] })
                }
                className="hie-input"
              >
                <option value="self-reported">Self-reported</option>
                <option value="provider">Provider</option>
              </select>
            </div>

          </div>
        </div>
      ))}

      {/* Add button */}
      <button
        aria-label="Add"
        onClick={() => addVaccination(newVaccination())}
        className="flex items-center gap-2 w-full"
        style={{ borderTop: '1px solid var(--ice-divider)', padding: '10px 16px 12px' }}
      >
        <span
          className="flex items-center justify-center rounded-full text-white font-extrabold shrink-0"
          style={{ width: 24, height: 24, backgroundColor: 'var(--cyan)', fontSize: 15, lineHeight: 1 }}
        >
          +
        </span>
        <span className="font-bold" style={{ color: 'var(--cyan)', fontSize: 13 }}>
          Add vaccination
        </span>
      </button>

    </div>
  );
}
