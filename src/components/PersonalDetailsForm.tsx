import { useState } from 'react';
import { usePatientStore } from '../core/store';
import { formatPhone } from './formatPhone';
import StateCombobox from './StateCombobox';

type Unit = 'imperial' | 'metric';

// ── Display helpers ──────────────────────────────────────────────────────────

function heightDisplay(ft: number | null, inches: number | null, unit: Unit): string {
  if (ft === null) return '';
  if (unit === 'imperial') {
    return inches !== null ? `${ft}'${inches}"` : `${ft}'`;
  }
  const cm = Math.round((ft * 12 + (inches ?? 0)) * 2.54);
  return String(cm);
}

function weightDisplay(lbs: number | null, unit: Unit): string {
  if (lbs === null) return '';
  if (unit === 'imperial') return String(lbs);
  return String(Math.round((lbs / 2.2046) * 10) / 10);
}

// ── Parse helpers (always write back to the imperial store fields) ────────────

function parseHeight(raw: string, unit: Unit): { heightFt: number | null; heightIn: number | null } {
  if (unit === 'imperial') {
    const nums = (raw.match(/\d+/g) ?? []).map(Number);
    return { heightFt: nums[0] ?? null, heightIn: nums[1] ?? null };
  }
  const cm = parseFloat(raw);
  if (isNaN(cm)) return { heightFt: null, heightIn: null };
  const totalIn = cm / 2.54;
  return { heightFt: Math.floor(totalIn / 12), heightIn: Math.round(totalIn % 12) };
}

function parseWeight(raw: string, unit: Unit): { weightLbs: number | null } {
  const n = parseFloat(raw);
  if (isNaN(n)) return { weightLbs: null };
  return { weightLbs: unit === 'imperial' ? n : Math.round(n * 2.2046 * 10) / 10 };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PersonalDetailsForm() {
  const personal = usePatientStore((s) => s.record.personal);
  const updatePersonal = usePatientStore((s) => s.updatePersonal);

  const [unit, setUnit] = useState<Unit>('imperial');
  const [heightText, setHeightText] = useState(() =>
    heightDisplay(personal.heightFt, personal.heightIn, 'imperial')
  );
  const [weightText, setWeightText] = useState(() =>
    weightDisplay(personal.weightLbs, 'imperial')
  );

  function handleUnitSwitch(next: Unit) {
    setUnit(next);
    setHeightText(heightDisplay(personal.heightFt, personal.heightIn, next));
    setWeightText(weightDisplay(personal.weightLbs, next));
  }

  return (
    <div className="hie-section">
      <div className="hie-section-header">
        <h2 className="hie-section-title">Personal Details</h2>
      </div>

      <div className="grid grid-cols-2">

        {/* Row 1 */}
        <div className="hie-field-left">
          <label htmlFor="firstName" className="hie-label">First Name</label>
          <input
            id="firstName"
            type="text"
            value={personal.firstName}
            onChange={(e) => updatePersonal({ firstName: e.target.value })}
            className="hie-input"
            placeholder="First name"
          />
        </div>
        <div className="hie-field">
          <label htmlFor="lastName" className="hie-label">Last Name</label>
          <input
            id="lastName"
            type="text"
            value={personal.lastName}
            onChange={(e) => updatePersonal({ lastName: e.target.value })}
            className="hie-input"
            placeholder="Last name"
          />
        </div>

        {/* Row 2 */}
        <div className="hie-field-left">
          <label htmlFor="dateOfBirth" className="hie-label">Date of Birth</label>
          <input
            id="dateOfBirth"
            type="date"
            value={personal.dateOfBirth}
            onChange={(e) => updatePersonal({ dateOfBirth: e.target.value })}
            className="hie-input"
          />
        </div>
        <div className="hie-field">
          <label htmlFor="gender" className="hie-label">Sex</label>
          <select
            id="gender"
            value={personal.sex}
            onChange={(e) => updatePersonal({ sex: e.target.value })}
            className="hie-input"
            style={{ color: personal.sex ? 'var(--text-dark)' : 'var(--label-color)' }}
          >
            <option value="" disabled>Select…</option>
            <option>Male</option>
            <option>Female</option>
            <option>Non-binary</option>
            <option>Prefer not to say</option>
            <option>Other</option>
          </select>
        </div>

        {/* Row 3 — full width */}
        <div className="col-span-2 hie-field">
          <label htmlFor="address" className="hie-label">Address</label>
          <input
            id="address"
            type="text"
            value={personal.address}
            onChange={(e) => updatePersonal({ address: e.target.value })}
            className="hie-input"
            placeholder="Street address"
          />
        </div>

        {/* Row 4 */}
        <div className="hie-field-left">
          <label htmlFor="city" className="hie-label">City</label>
          <input
            id="city"
            type="text"
            value={personal.city}
            onChange={(e) => updatePersonal({ city: e.target.value })}
            className="hie-input"
            placeholder="City"
          />
        </div>
        <div className="hie-field">
          <label htmlFor="state" className="hie-label">State</label>
          <StateCombobox
            id="state"
            value={personal.state}
            onChange={(v) => updatePersonal({ state: v })}
          />
        </div>

        {/* Row 5 */}
        <div className="hie-field-left">
          <label htmlFor="zip" className="hie-label">ZIP</label>
          <input
            id="zip"
            type="text"
            value={personal.zip}
            onChange={(e) => updatePersonal({ zip: e.target.value })}
            className="hie-input"
            placeholder="ZIP code"
          />
        </div>
        <div className="hie-field">
          <label htmlFor="phone" className="hie-label">Phone</label>
          <input
            id="phone"
            type="tel"
            value={personal.phone}
            onChange={(e) => updatePersonal({ phone: formatPhone(e.target.value) })}
            className="hie-input"
            placeholder="(000) 000-0000"
          />
        </div>

        {/* Row 6 — full width */}
        <div className="col-span-2 hie-field">
          <label htmlFor="email" className="hie-label">Email</label>
          <input
            id="email"
            type="email"
            value={personal.email}
            onChange={(e) => updatePersonal({ email: e.target.value })}
            className="hie-input"
            placeholder="email@example.com"
          />
        </div>

        {/* Imperial / Metric toggle */}
        <div
          className="col-span-2 flex justify-start items-center"
          style={{ padding: '10px 16px 0' }}
        >
          <div
            className="flex overflow-hidden font-bold"
            style={{ border: '1.5px solid var(--ice-border)', borderRadius: 8, fontSize: 11 }}
          >
            {(['imperial', 'metric'] as Unit[]).map((u) => (
              <button
                key={u}
                onClick={() => handleUnitSwitch(u)}
                style={{
                  padding: '3px 10px',
                  background: unit === u ? 'var(--cyan)' : 'white',
                  color: unit === u ? 'white' : 'var(--text-dark)',
                }}
              >
                {u === 'imperial' ? 'Imperial' : 'Metric'}
              </button>
            ))}
          </div>
        </div>

        {/* Row 7 — height | weight (unit-aware) */}
        <div className="hie-field-left">
          <label htmlFor="height" className="hie-label">
            {unit === 'imperial' ? 'Height' : 'Height (cm)'}
          </label>
          <input
            id="height"
            type="text"
            value={heightText}
            onChange={(e) => setHeightText(e.target.value)}
            onBlur={() => updatePersonal(parseHeight(heightText, unit))}
            className="hie-input"
            placeholder={unit === 'imperial' ? "e.g. 5'4\"" : 'e.g. 163'}
          />
        </div>
        <div className="hie-field">
          <label htmlFor="weight" className="hie-label">
            {unit === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)'}
          </label>
          <input
            id="weight"
            type="text"
            inputMode="decimal"
            value={weightText}
            onChange={(e) => setWeightText(e.target.value)}
            onBlur={() => updatePersonal(parseWeight(weightText, unit))}
            className="hie-input"
            placeholder={unit === 'imperial' ? 'e.g. 142' : 'e.g. 64'}
          />
        </div>

        {/* Row 8 */}
        <div className="hie-field-left">
          <label htmlFor="primaryLanguage" className="hie-label">Preferred Language</label>
          <input
            id="primaryLanguage"
            type="text"
            value={personal.preferredLanguage}
            onChange={(e) => updatePersonal({ preferredLanguage: e.target.value })}
            className="hie-input"
            placeholder="e.g. English"
          />
        </div>
        <div className="hie-field">
          <label htmlFor="maritalStatus" className="hie-label">Marital Status</label>
          <select
            id="maritalStatus"
            value={personal.maritalStatus}
            onChange={(e) => updatePersonal({ maritalStatus: e.target.value })}
            className="hie-input"
            style={{ color: personal.maritalStatus ? 'var(--text-dark)' : 'var(--label-color)' }}
          >
            <option value="" disabled>Select…</option>
            <option>Single</option>
            <option>Married</option>
            <option>Divorced</option>
            <option>Separated</option>
            <option>Widowed</option>
            <option>Domestic Partnership</option>
          </select>
        </div>

        {/* Row 9 — full width */}
        <div className="col-span-2 hie-field">
          <label htmlFor="bloodType" className="hie-label">Blood Type</label>
          <select
            id="bloodType"
            value={personal.bloodType}
            onChange={(e) => updatePersonal({ bloodType: e.target.value })}
            className="hie-input"
            style={{ color: personal.bloodType ? 'var(--text-dark)' : 'var(--label-color)' }}
          >
            <option value="" disabled>Select…</option>
            <option>A+</option>
            <option>A-</option>
            <option>B+</option>
            <option>B-</option>
            <option>AB+</option>
            <option>AB-</option>
            <option>O+</option>
            <option>O-</option>
            <option>Unknown</option>
          </select>
        </div>

      </div>
    </div>
  );
}
