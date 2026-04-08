import type { PersonalDetails } from './types';

/**
 * Computes profile completeness as a percentage (0–100).
 * Counts 16 fields; numeric fields are filled when non-null (0 counts as filled).
 */
export function computeProgress(p: PersonalDetails): number {
  const values = [
    p.firstName, p.lastName, p.dateOfBirth, p.sex,
    p.address, p.city, p.state, p.zip, p.phone, p.email,
    p.preferredLanguage, p.maritalStatus, p.bloodType,
    p.heightFt  !== null ? String(p.heightFt)  : '',
    p.heightIn  !== null ? String(p.heightIn)  : '',
    p.weightLbs !== null ? String(p.weightLbs) : '',
  ];
  const filled = values.filter((v) => v !== '').length;
  return Math.round((filled / values.length) * 100);
}
