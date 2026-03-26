import { usePatientStore } from '../core/store';
import { newAllergy } from '../core/schema';
import type { Allergy } from '../core/types';

function severityStyle(severity: Allergy['severity']): React.CSSProperties {
  if (severity === 'mild') {
    return { background: '#FFF8E1', color: '#F57F17', border: '1.5px solid #FFE082' };
  }
  if (severity === 'moderate') {
    return { background: '#FFF0E1', color: '#E65100', border: '1.5px solid #FFCC80' };
  }
  // severe
  return { background: '#FFF0F0', color: '#C62828', border: '1.5px solid #FFCDD2' };
}

export default function AllergyList() {
  const allergies = usePatientStore((s) => s.record.allergies);
  const addAllergy = usePatientStore((s) => s.addAllergy);
  const updateAllergy = usePatientStore((s) => s.updateAllergy);
  const removeAllergy = usePatientStore((s) => s.removeAllergy);

  return (
    <div className="hie-section">
      {/* Section header */}
      <div className="hie-section-header">
        <h2 className="hie-section-title">Allergies</h2>

        {/* Count badge — red variant */}
        <span
          className="font-bold"
          style={{
            background: '#FFF0F0',
            color: '#C62828',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 10,
          }}
        >
          {allergies.length} on file
        </span>
      </div>

      {/* Allergy tags — inline-flex pills that wrap */}
      <div style={{ padding: '12px 16px 4px' }}>
        {allergies.length === 0 && (
          <p className="text-sm italic" style={{ color: 'var(--label-color)' }}>
            No allergies recorded.
          </p>
        )}

        {allergies.map((allergy) => (
          <span
            key={allergy.id}
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              background: '#FFF0F0',
              border: '1.5px solid #FFCDD2',
              borderRadius: 20,
              padding: '5px 12px',
              margin: '0 4px 8px 0',
            }}
          >
            {/* Top row: dot · substance · separator · severity · remove */}
            <span className="flex items-center gap-1">
              <span
                className="inline-block rounded-full shrink-0"
                style={{ width: 6, height: 6, backgroundColor: '#EF5350' }}
              />
              <input
                type="text"
                value={allergy.substance}
                onChange={(e) =>
                  updateAllergy(allergy.id, { substance: e.target.value })
                }
                className="bg-transparent border-0 outline-none font-semibold"
                style={{ color: '#C62828', fontSize: 12, minWidth: 60 }}
                placeholder="e.g. Penicillin"
              />
              <span style={{ color: '#FFCDD2', margin: '0 2px' }}>·</span>
              <select
                value={allergy.severity}
                onChange={(e) =>
                  updateAllergy(allergy.id, {
                    severity: e.target.value as Allergy['severity'],
                  })
                }
                className="outline-none cursor-pointer shrink-0"
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 8,
                  ...severityStyle(allergy.severity),
                }}
              >
                <option value="mild">mild</option>
                <option value="moderate">moderate</option>
                <option value="severe">severe</option>
              </select>
              <button
                aria-label="Delete"
                onClick={() => removeAllergy(allergy.id)}
                className="shrink-0 font-bold leading-none"
                style={{ color: '#EF9A9A', fontSize: 18, marginLeft: 2 }}
              >
                ×
              </button>
            </span>

            {/* Reaction — small secondary row */}
            <input
              type="text"
              value={allergy.reaction}
              onChange={(e) =>
                updateAllergy(allergy.id, { reaction: e.target.value })
              }
              className="bg-transparent border-0 outline-none"
              style={{ color: '#C62828', fontSize: 10, opacity: 0.65, marginLeft: 11, marginTop: 2 }}
              placeholder="e.g. Hives, rash"
            />
          </span>
        ))}
      </div>

      {/* Add row */}
      <button
        aria-label="Add"
        onClick={() => addAllergy(newAllergy())}
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
          Add allergy
        </span>
      </button>
    </div>
  );
}
