// types.ts — the complete Layer 0 contract

export interface PersonalDetails {
  firstName: string;
  lastName: string;
  dateOfBirth: string;        // ISO 8601: "1978-03-04"
  gender: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  heightFt: number | null;
  heightIn: number | null;
  weightLbs: number | null;
  primaryLanguage: string;
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

export interface ShareToken {
  token: string;
  createdAt: string;
  expiresAt: string | null;   // null = no expiry in prototype
  label: string;              // "Inova Primary Care", "Dr. Rashid"
  active: boolean;
}

export interface AccessLogEntry {
  id: string;
  timestamp: string;
  method: 'qr' | 'link' | 'print' | 'clipboard';
  token: string | null;
  label: string;
  revoked: boolean;
}