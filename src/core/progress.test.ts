import { describe, it, expect } from 'vitest';
import { computeProgress } from './progress';
import { createEmptyPatientRecord } from './schema';
import type { PersonalDetails } from './types';

function emptyPersonal(): PersonalDetails {
  return createEmptyPatientRecord().personal;
}

function fullPersonal(): PersonalDetails {
  return {
    firstName: 'Jane', lastName: 'Doe', dateOfBirth: '1990-01-01', sex: 'Female',
    address: '123 Main St', city: 'Springfield', state: 'VA', zip: '22150',
    phone: '(555) 555-5555', email: 'jane@example.com',
    preferredLanguage: 'English', maritalStatus: 'Single', bloodType: 'O+',
    heightFt: 5, heightIn: 4, weightLbs: 130,
  };
}

describe('computeProgress', () => {
  it('returns 0 for a completely empty personal record', () => {
    expect(computeProgress(emptyPersonal())).toBe(0);
  });

  it('returns 100 when all 16 fields are filled', () => {
    expect(computeProgress(fullPersonal())).toBe(100);
  });

  it('counts 1 filled field correctly', () => {
    // 1/16 = 6.25 → rounds to 6
    expect(computeProgress({ ...emptyPersonal(), firstName: 'Jane' })).toBe(6);
  });

  it('counts 2 filled fields correctly', () => {
    // 2/16 = 12.5 → rounds to 13
    expect(computeProgress({ ...emptyPersonal(), firstName: 'Jane', lastName: 'Doe' })).toBe(13);
  });

  it('returns 50 when exactly 8 of 16 fields are filled', () => {
    const p: PersonalDetails = {
      firstName: 'Jane', lastName: 'Doe', dateOfBirth: '1990-01-01', sex: 'Female',
      address: '123 Main St', city: 'Springfield', state: 'VA', zip: '22150',
      phone: '', email: '', preferredLanguage: '', maritalStatus: '', bloodType: '',
      heightFt: null, heightIn: null, weightLbs: null,
    };
    expect(computeProgress(p)).toBe(50);
  });

  it('counts numeric 0 as filled — zero is a valid measurement', () => {
    // heightFt=0, heightIn=0, weightLbs=0 are all filled (String(0) = '0')
    const p = { ...emptyPersonal(), heightFt: 0 as number | null, heightIn: 0 as number | null, weightLbs: 0 as number | null };
    // 3/16 = 18.75 → rounds to 19
    expect(computeProgress(p)).toBe(19);
  });

  it('does not count null numeric fields', () => {
    const p = emptyPersonal(); // heightFt/heightIn/weightLbs all null
    expect(computeProgress(p)).toBe(0);
  });

  it('progress is monotonically non-decreasing as fields are added', () => {
    const p0 = emptyPersonal();
    const p1 = { ...p0, firstName: 'Jane' };
    const p2 = { ...p1, lastName: 'Doe' };
    expect(computeProgress(p0)).toBeLessThanOrEqual(computeProgress(p1));
    expect(computeProgress(p1)).toBeLessThanOrEqual(computeProgress(p2));
  });

  it('result is always between 0 and 100 inclusive', () => {
    expect(computeProgress(emptyPersonal())).toBeGreaterThanOrEqual(0);
    expect(computeProgress(fullPersonal())).toBeLessThanOrEqual(100);
  });
});
