// schema.ts — factory functions and defaults

import { v4 as uuidv4 } from 'uuid';
import type { PatientRecord, Medication, Vaccination, Procedure, Allergy, ShareToken, AccessLogEntry, ShareableSection } from './types';

export function createEmptyPatientRecord(): PatientRecord {
  return {
    recordId: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    personal: {
      firstName: '', lastName: '', dateOfBirth: '',
      sex: '', address: '', city: '', state: '', zip: '',
      phone: '', email: '',
      heightFt: null, heightIn: null, weightLbs: null,
      preferredLanguage: '', maritalStatus: '', bloodType: '',
    },
    emergencyContact: { name: '', relationship: '', phone: '' },
    allergies: [],
    medications: [],
    vaccinations: [],
    procedures: [],
    insurancePrimary: null,
    insuranceSecondary: null,
    shareTokens: {},
  };
}

// Item factories — always use these, never construct inline
export const newMedication = (): Medication => ({
  id: uuidv4(), name: '', dosage: '', frequency: '',
  prescribingProvider: '', startDate: '', endDate: null,
  source: 'self-reported', status: 'active',
  notes: '', patientNotes: '', reminder: false,
  reminderTimes: [], reminderDays: [],
});

export const newVaccination = (): Vaccination => ({
  id: uuidv4(), vaccineName: '', dateAdministered: '',
  lotNumber: '', administeringSite: '', source: 'self-reported',
});

export const newProcedure = (): Procedure => ({
  id: uuidv4(), procedureName: '', date: '',
  facility: '', provider: '', notes: '', category: 'other',
  outcome: '', followUpDate: null, cptCode: '', diagnosisCode: '',
});

export const newAllergy = (): Allergy => ({
  id: uuidv4(), substance: '', reaction: '', severity: 'mild',
});

export const newShareToken = (label: string, sections: ShareableSection[] = []): ShareToken => ({
  token: uuidv4(),
  createdAt: new Date().toISOString(),
  expiresAt: null,
  label,
  active: true,
  sections,
});

export const newAccessLogEntry = (
  method: AccessLogEntry['method'],
  token: string | null,
  label: string,
): AccessLogEntry => ({
  id: uuidv4(),
  timestamp: new Date().toISOString(),
  method,
  token,
  label,
  revoked: false,
});