// types.ts — the complete Layer 0 contract

export interface PersonalDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;        // ISO 8601: "1978-03-04"
  sex: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  heightFt: number | null;
  heightIn: number | null;
  weightLbs: number | null;
  preferredLanguage: string;
  maritalStatus: string;
  bloodType: string;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Allergy {
  id: string;                 // uuid — never use array index as key
  substance: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  prescribingProvider: string;
  startDate: string;          // ISO 8601
  endDate: string | null;     // null = currently active
  source: 'provider' | 'self-reported';
  status: 'active' | 'past' | 'prn';
  notes: string;              // instructions / provider notes
  patientNotes: string;       // patient's own observations / side effects
  reminder: boolean;          // dose reminder enabled
  reminderTimes: string[];    // HH:MM times, one per daily dose
  reminderDays: string[];     // day indices ('0'–'6'), for weekly schedules
}

export interface Vaccination {
  id: string;
  vaccineName: string;
  dateAdministered: string;
  lotNumber: string;
  administeringSite: string;
  source: 'provider' | 'self-reported';
}

export interface Procedure {
  id: string;
  procedureName: string;
  date: string;
  facility: string;
  provider: string;
  notes: string;
  category: 'surgery' | 'screening' | 'diagnostic' | 'other';
  outcome: string;              // e.g. "Successful", "" = not recorded
  followUpDate: string | null;  // ISO 8601 or null
  cptCode: string;              // e.g. "44950", "" = none
  diagnosisCode: string;        // e.g. "K37" (ICD-10), "" = none
}

export interface Insurance {
  carrier: string;
  planName: string;
  memberId: string;
  groupNumber: string;
  policyHolderName: string;
  effectiveDate: string;
}

export interface PatientRecord {
  // Metadata — not PHI, safe to use as keys
  recordId: string;           // uuid generated on first save
  createdAt: string;          // ISO 8601
  updatedAt: string;

  // The actual health data
  personal: PersonalDetails;
  emergencyContact: EmergencyContact;
  allergies: Allergy[];
  medications: Medication[];
  vaccinations: Vaccination[];
  procedures: Procedure[];
  insurancePrimary: Insurance | null;
  insuranceSecondary: Insurance | null;

  // Share tokens — maps token → { createdAt, label, active }
  shareTokens: Record<string, ShareToken>;
}

export type ShareableSection =
  'personal' | 'emergency' | 'allergies' | 'medications' |
  'vaccinations' | 'procedures' | 'insurancePrimary' | 'insuranceSecondary';

export interface ShareToken {
  token: string;
  createdAt: string;
  expiresAt: string | null;   // null = no expiry in prototype
  label: string;              // "Inova Primary Care", "Dr. Rashid"
  active: boolean;
  sections: ShareableSection[];
}

export interface AccessLogEntry {
  id: string;
  timestamp: string;
  method: 'qr' | 'link' | 'print' | 'clipboard';
  token: string | null;
  label: string;
  revoked: boolean;
}