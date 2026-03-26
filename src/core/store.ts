import { create } from 'zustand';
import type {
  PatientRecord,
  PersonalDetails,
  EmergencyContact,
  Medication,
  Vaccination,
  Procedure,
  Allergy,
  Insurance,
  ShareToken,
  AccessLogEntry,
} from './types';
import { createEmptyPatientRecord } from './schema';
import { storage } from './storage';

interface PatientStore {
  record: PatientRecord;
  log: AccessLogEntry[];

  // Personal
  updatePersonal: (data: Partial<PersonalDetails>) => void;
  updateEmergencyContact: (data: Partial<EmergencyContact>) => void;

  // Lists
  addAllergy: (item: Allergy) => void;
  updateAllergy: (id: string, data: Partial<Allergy>) => void;
  removeAllergy: (id: string) => void;

  addMedication: (item: Medication) => void;
  updateMedication: (id: string, data: Partial<Medication>) => void;
  removeMedication: (id: string) => void;

  addVaccination: (item: Vaccination) => void;
  updateVaccination: (id: string, data: Partial<Vaccination>) => void;
  removeVaccination: (id: string) => void;

  addProcedure: (item: Procedure) => void;
  updateProcedure: (id: string, data: Partial<Procedure>) => void;
  removeProcedure: (id: string) => void;

  // Insurance
  updateInsurancePrimary: (data: Partial<Insurance>) => void;
  updateInsuranceSecondary: (data: Partial<Insurance>) => void;
  clearInsuranceSecondary: () => void;

  // Sharing
  addShareToken: (token: ShareToken) => void;
  revokeShareToken: (token: string) => void;

  // Access log
  appendLog: (entry: AccessLogEntry) => void;

  // Utility
  clearAll: () => void;
}

export const usePatientStore = create<PatientStore>()(
  (set) => ({
      record: storage.loadRecord() ?? createEmptyPatientRecord(),
      log: storage.loadLog(),

      updatePersonal: (data) =>
        set((s) => {
          const updated = {
            ...s.record,
            personal: { ...s.record.personal, ...data },
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      updateEmergencyContact: (data) =>
        set((s) => {
          const updated = {
            ...s.record,
            emergencyContact: { ...s.record.emergencyContact, ...data },
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      addAllergy: (item) =>
        set((s) => {
          const updated = {
            ...s.record,
            allergies: [...s.record.allergies, item],
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      updateAllergy: (id, data) =>
        set((s) => {
          const updated = {
            ...s.record,
            allergies: s.record.allergies.map((a) =>
              a.id === id ? { ...a, ...data } : a
            ),
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      removeAllergy: (id) =>
        set((s) => {
          const updated = {
            ...s.record,
            allergies: s.record.allergies.filter((a) => a.id !== id),
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      addMedication: (item) =>
        set((s) => {
          const updated = {
            ...s.record,
            medications: [...s.record.medications, item],
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      updateMedication: (id, data) =>
        set((s) => {
          const updated = {
            ...s.record,
            medications: s.record.medications.map((m) =>
              m.id === id ? { ...m, ...data } : m
            ),
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      removeMedication: (id) =>
        set((s) => {
          const updated = {
            ...s.record,
            medications: s.record.medications.filter((m) => m.id !== id),
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      addVaccination: (item) =>
        set((s) => {
          const updated = {
            ...s.record,
            vaccinations: [...s.record.vaccinations, item],
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      updateVaccination: (id, data) =>
        set((s) => {
          const updated = {
            ...s.record,
            vaccinations: s.record.vaccinations.map((v) =>
              v.id === id ? { ...v, ...data } : v
            ),
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      removeVaccination: (id) =>
        set((s) => {
          const updated = {
            ...s.record,
            vaccinations: s.record.vaccinations.filter((v) => v.id !== id),
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      addProcedure: (item) =>
        set((s) => {
          const updated = {
            ...s.record,
            procedures: [...s.record.procedures, item],
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      updateProcedure: (id, data) =>
        set((s) => {
          const updated = {
            ...s.record,
            procedures: s.record.procedures.map((p) =>
              p.id === id ? { ...p, ...data } : p
            ),
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      removeProcedure: (id) =>
        set((s) => {
          const updated = {
            ...s.record,
            procedures: s.record.procedures.filter((p) => p.id !== id),
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      updateInsurancePrimary: (data) =>
        set((s) => {
          const current = s.record.insurancePrimary ?? {
            carrier: '', planName: '', memberId: '',
            groupNumber: '', policyHolderName: '', effectiveDate: '',
          };
          const updated = {
            ...s.record,
            insurancePrimary: { ...current, ...data },
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      updateInsuranceSecondary: (data) =>
        set((s) => {
          const current = s.record.insuranceSecondary ?? {
            carrier: '', planName: '', memberId: '',
            groupNumber: '', policyHolderName: '', effectiveDate: '',
          };
          const updated = {
            ...s.record,
            insuranceSecondary: { ...current, ...data },
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      clearInsuranceSecondary: () =>
        set((s) => {
          const updated = { ...s.record, insuranceSecondary: null };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      addShareToken: (token) =>
        set((s) => {
          const updated = {
            ...s.record,
            shareTokens: { ...s.record.shareTokens, [token.token]: token },
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      revokeShareToken: (token) =>
        set((s) => {
          const updated = {
            ...s.record,
            shareTokens: {
              ...s.record.shareTokens,
              [token]: { ...s.record.shareTokens[token], active: false },
            },
          };
          storage.saveRecord(updated);
          return { record: updated };
        }),

      appendLog: (entry) =>
        set((s) => {
          const log = [entry, ...s.log];
          storage.appendLogEntry(entry);
          return { log };
        }),

      clearAll: () => {
        const fresh = createEmptyPatientRecord();
        storage.saveRecord(fresh);
        storage.loadLog();
        set({ record: fresh, log: [] });
      },
  })
);