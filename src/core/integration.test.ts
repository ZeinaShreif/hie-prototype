import { describe, it, expect, beforeEach } from 'vitest';
import { usePatientStore } from './store';
import { newMedication, newAllergy } from './schema';
import { storage } from './storage';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
  usePatientStore.getState().clearAll();
});

describe('store → storage persistence', () => {
  it('personal details written to store are readable from storage', () => {
    usePatientStore.getState().updatePersonal({
      firstName: 'Maria',
      lastName: 'Santos',
      dateOfBirth: '1978-03-04',
    });
    const loaded = storage.loadRecord();
    expect(loaded?.personal.firstName).toBe('Maria');
    expect(loaded?.personal.lastName).toBe('Santos');
    expect(loaded?.personal.dateOfBirth).toBe('1978-03-04');
  });

  it('medications written to store are readable from storage', () => {
    const med = newMedication();
    med.name = 'Metformin';
    med.dosage = '500mg';
    usePatientStore.getState().addMedication(med);
    const loaded = storage.loadRecord();
    expect(loaded?.medications).toHaveLength(1);
    expect(loaded?.medications[0].name).toBe('Metformin');
    expect(loaded?.medications[0].id).toBe(med.id);
  });

  it('allergies written to store are readable from storage', () => {
    const allergy = newAllergy();
    allergy.substance = 'Penicillin';
    allergy.severity = 'moderate';
    usePatientStore.getState().addAllergy(allergy);
    const loaded = storage.loadRecord();
    expect(loaded?.allergies[0].substance).toBe('Penicillin');
    expect(loaded?.allergies[0].severity).toBe('moderate');
  });

  it('insurance written to store is readable from storage', () => {
    usePatientStore.getState().updateInsurancePrimary({
      carrier: 'BCBS',
      memberId: 'XYZ123',
    });
    const loaded = storage.loadRecord();
    expect(loaded?.insurancePrimary?.carrier).toBe('BCBS');
    expect(loaded?.insurancePrimary?.memberId).toBe('XYZ123');
  });
});

describe('simulated page reload', () => {
  it('record survives a reload — store reinitializes from storage', () => {
    usePatientStore.getState().updatePersonal({ firstName: 'Maria' });
    const med = newMedication();
    med.name = 'Lisinopril';
    usePatientStore.getState().addMedication(med);

    // Simulate reload: clear store state then reinitialize from storage
    const saved = storage.loadRecord()!;
    usePatientStore.setState({ record: saved });

    const { record } = usePatientStore.getState();
    expect(record.personal.firstName).toBe('Maria');
    expect(record.medications[0].name).toBe('Lisinopril');
  });

  it('updatedAt is a valid ISO timestamp after save', () => {
    usePatientStore.getState().updatePersonal({ firstName: 'Maria' });
    const loaded = storage.loadRecord();
    expect(loaded?.updatedAt).toBeTruthy();
    expect(new Date(loaded!.updatedAt).toISOString()).toBe(loaded!.updatedAt);
  });

  it('recordId is stable across updates', () => {
    const idBefore = usePatientStore.getState().record.recordId;
    usePatientStore.getState().updatePersonal({ firstName: 'Maria' });
    usePatientStore.getState().addMedication(newMedication());
    const idAfter = usePatientStore.getState().record.recordId;
    expect(idAfter).toBe(idBefore);
  });
});

describe('data integrity', () => {
  it('updating one section does not clobber another', () => {
    usePatientStore.getState().updatePersonal({ firstName: 'Maria' });
    usePatientStore.getState().updateInsurancePrimary({ carrier: 'BCBS' });
    usePatientStore.getState().updateEmergencyContact({ name: 'Carlos' });

    const { record } = usePatientStore.getState();
    expect(record.personal.firstName).toBe('Maria');
    expect(record.insurancePrimary?.carrier).toBe('BCBS');
    expect(record.emergencyContact.name).toBe('Carlos');
  });

  it('removing an item by id leaves all other items intact', () => {
    const m1 = newMedication(); m1.name = 'Metformin';
    const m2 = newMedication(); m2.name = 'Lisinopril';
    const m3 = newMedication(); m3.name = 'Aspirin';
    usePatientStore.getState().addMedication(m1);
    usePatientStore.getState().addMedication(m2);
    usePatientStore.getState().addMedication(m3);
    usePatientStore.getState().removeMedication(m2.id);

    const { medications } = usePatientStore.getState().record;
    expect(medications).toHaveLength(2);
    expect(medications.find(m => m.id === m1.id)?.name).toBe('Metformin');
    expect(medications.find(m => m.id === m3.id)?.name).toBe('Aspirin');
    expect(medications.find(m => m.id === m2.id)).toBeUndefined();
  });

  it('clearAll wipes storage as well as store state', () => {
    usePatientStore.getState().updatePersonal({ firstName: 'Maria' });
    usePatientStore.getState().clearAll();
    const loaded = storage.loadRecord();
    expect(loaded?.personal.firstName).toBe('');
  });
});