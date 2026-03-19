// schema.ts — factory functions and defaults

import { v4 as uuidv4 } from 'uuid';
import type { PatientRecord, Medication, Vaccination, Procedure, Allergy } from './types';

export function createEmptyPatientRecord(): PatientRecord {
  return {
    recordId: uuidv4(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    personal: {
      firstName: '', lastName: '', dateOfBirth: '',
      gender: '', address: '', city: '', state: '', zip: '',
      phone: '', email: '',
      heightFt: null, heightIn: null, weightLbs: null,
      primaryLanguage: '', maritalStatus: '', bloodType: '',
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
});

export const newVaccination = (): Vaccination => ({
  id: uuidv4(), vaccineName: '', dateAdministered: '',
  lotNumber: '', administeringSite: '', source: 'self-reported',
});

export const newProcedure = (): Procedure => ({
  id: uuidv4(), procedureName: '', date: '',
  facility: '', provider: '', notes: '', category: 'other',
});

export const newAllergy = (): Allergy => ({
  id: uuidv4(), substance: '', reaction: '', severity: 'mild',
});