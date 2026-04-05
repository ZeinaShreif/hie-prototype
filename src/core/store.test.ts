import { describe, it, expect, beforeEach } from 'vitest';
import { usePatientStore } from './store';
import { newMedication, newAllergy, newVaccination, newProcedure } from './schema';

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

describe('personal details', () => {
  it('updates a single personal field without clobbering others', () => {
    const { updatePersonal } = usePatientStore.getState();
    updatePersonal({ firstName: 'Maria' });
    updatePersonal({ lastName: 'Santos' });
    const { personal } = usePatientStore.getState().record;
    expect(personal.firstName).toBe('Maria');
    expect(personal.lastName).toBe('Santos');
  });

  it('updates emergency contact', () => {
    usePatientStore.getState().updateEmergencyContact({
      name: 'Carlos Santos',
      relationship: 'Spouse',
    });
    const { emergencyContact } = usePatientStore.getState().record;
    expect(emergencyContact.name).toBe('Carlos Santos');
    expect(emergencyContact.relationship).toBe('Spouse');
  });
});

describe('allergies', () => {
  it('adds an allergy', () => {
    const allergy = newAllergy();
    allergy.substance = 'Penicillin';
    usePatientStore.getState().addAllergy(allergy);
    expect(usePatientStore.getState().record.allergies).toHaveLength(1);
    expect(usePatientStore.getState().record.allergies[0].substance)
      .toBe('Penicillin');
  });

  it('updates an allergy by id', () => {
    const allergy = newAllergy();
    usePatientStore.getState().addAllergy(allergy);
    usePatientStore.getState().updateAllergy(allergy.id, { severity: 'severe' });
    expect(usePatientStore.getState().record.allergies[0].severity)
      .toBe('severe');
  });

  it('removes an allergy by id', () => {
    const allergy = newAllergy();
    usePatientStore.getState().addAllergy(allergy);
    usePatientStore.getState().removeAllergy(allergy.id);
    expect(usePatientStore.getState().record.allergies).toHaveLength(0);
  });

  it('removing one allergy does not affect others', () => {
    const a1 = newAllergy();
    const a2 = newAllergy();
    usePatientStore.getState().addAllergy(a1);
    usePatientStore.getState().addAllergy(a2);
    usePatientStore.getState().removeAllergy(a1.id);
    const { allergies } = usePatientStore.getState().record;
    expect(allergies).toHaveLength(1);
    expect(allergies[0].id).toBe(a2.id);
  });
});

describe('medications', () => {
  it('adds a medication', () => {
    const med = newMedication();
    med.name = 'Metformin';
    usePatientStore.getState().addMedication(med);
    expect(usePatientStore.getState().record.medications).toHaveLength(1);
    expect(usePatientStore.getState().record.medications[0].name)
      .toBe('Metformin');
  });

  it('updates a medication by id', () => {
    const med = newMedication();
    usePatientStore.getState().addMedication(med);
    usePatientStore.getState().updateMedication(med.id, { status: 'past' });
    expect(usePatientStore.getState().record.medications[0].status)
      .toBe('past');
  });

  it('removes a medication by id', () => {
    const med = newMedication();
    usePatientStore.getState().addMedication(med);
    usePatientStore.getState().removeMedication(med.id);
    expect(usePatientStore.getState().record.medications).toHaveLength(0);
  });
});

describe('vaccinations', () => {
  it('adds a vaccination', () => {
    const vax = newVaccination();
    vax.vaccineName = 'COVID-19';
    usePatientStore.getState().addVaccination(vax);
    expect(usePatientStore.getState().record.vaccinations).toHaveLength(1);
    expect(usePatientStore.getState().record.vaccinations[0].vaccineName)
      .toBe('COVID-19');
  });

  it('removes a vaccination by id', () => {
    const vax = newVaccination();
    usePatientStore.getState().addVaccination(vax);
    usePatientStore.getState().removeVaccination(vax.id);
    expect(usePatientStore.getState().record.vaccinations).toHaveLength(0);
  });
});

describe('procedures', () => {
  it('adds a procedure', () => {
    const proc = newProcedure();
    proc.procedureName = 'Appendectomy';
    usePatientStore.getState().addProcedure(proc);
    expect(usePatientStore.getState().record.procedures).toHaveLength(1);
    expect(usePatientStore.getState().record.procedures[0].procedureName)
      .toBe('Appendectomy');
  });

  it('removes a procedure by id', () => {
    const proc = newProcedure();
    usePatientStore.getState().addProcedure(proc);
    usePatientStore.getState().removeProcedure(proc.id);
    expect(usePatientStore.getState().record.procedures).toHaveLength(0);
  });
});

describe('insurance', () => {
  it('updates primary insurance without requiring full object', () => {
    usePatientStore.getState().updateInsurancePrimary({ carrier: 'BCBS' });
    expect(usePatientStore.getState().record.insurancePrimary?.carrier)
      .toBe('BCBS');
  });

  it('updates primary insurance incrementally', () => {
    usePatientStore.getState().updateInsurancePrimary({ carrier: 'BCBS' });
    usePatientStore.getState().updateInsurancePrimary({ memberId: 'XYZ123' });
    const ins = usePatientStore.getState().record.insurancePrimary;
    expect(ins?.carrier).toBe('BCBS');
    expect(ins?.memberId).toBe('XYZ123');
  });
});

describe('share tokens', () => {
  it('adds a share token', () => {
    const token = {
      token: 'abc-123',
      createdAt: new Date().toISOString(),
      expiresAt: null,
      label: 'Inova Primary Care',
      active: true,
      sections: [],
    };
    usePatientStore.getState().addShareToken(token);
    expect(usePatientStore.getState().record.shareTokens['abc-123'].active)
      .toBe(true);
  });

  it('revokes a share token', () => {
    const token = {
      token: 'abc-123',
      createdAt: new Date().toISOString(),
      expiresAt: null,
      label: 'Inova Primary Care',
      active: true,
      sections: [],
    };
    usePatientStore.getState().addShareToken(token);
    usePatientStore.getState().revokeShareToken('abc-123');
    expect(usePatientStore.getState().record.shareTokens['abc-123'].active)
      .toBe(false);
  });
});

describe('access log', () => {
  it('appends a log entry', () => {
    usePatientStore.getState().appendLog({
      id: '1',
      timestamp: new Date().toISOString(),
      method: 'qr',
      token: null,
      label: 'Inova',
      revoked: false,
    });
    expect(usePatientStore.getState().log).toHaveLength(1);
  });

  it('log entries are newest first', () => {
    usePatientStore.getState().appendLog({
      id: '1', timestamp: new Date().toISOString(),
      method: 'qr', token: null, label: 'First', revoked: false,
    });
    usePatientStore.getState().appendLog({
      id: '2', timestamp: new Date().toISOString(),
      method: 'link', token: 'abc', label: 'Second', revoked: false,
    });
    expect(usePatientStore.getState().log[0].label).toBe('Second');
  });
});

describe('clearAll', () => {
  it('resets record to empty and clears log', () => {
    usePatientStore.getState().updatePersonal({ firstName: 'Maria' });
    usePatientStore.getState().addMedication(newMedication());
    usePatientStore.getState().clearAll();
    const { record, log } = usePatientStore.getState();
    expect(record.personal.firstName).toBe('');
    expect(record.medications).toHaveLength(0);
    expect(log).toHaveLength(0);
  });

  it('clearAll produces a new recordId', () => {
    const idBefore = usePatientStore.getState().record.recordId;
    usePatientStore.getState().clearAll();
    const idAfter = usePatientStore.getState().record.recordId;
    expect(idAfter).not.toBe(idBefore);
  });
});