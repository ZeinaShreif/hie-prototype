import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createEmptyPatientRecord,
  newMedication,
  newVaccination,
  newProcedure,
  newAllergy,
  newShareToken,
  newAccessLogEntry,
} from './schema';
import { storage } from './storage';

// Mock localStorage for tests
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

describe('createEmptyPatientRecord', () => {
  it('produces a valid record with a uuid', () => {
    const r = createEmptyPatientRecord();
    expect(r.recordId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('two calls produce different recordIds', () => {
    expect(createEmptyPatientRecord().recordId).not.toBe(
      createEmptyPatientRecord().recordId
    );
  });

  it('starts with empty arrays for list fields', () => {
    const r = createEmptyPatientRecord();
    expect(r.allergies).toEqual([]);
    expect(r.medications).toEqual([]);
    expect(r.vaccinations).toEqual([]);
    expect(r.procedures).toEqual([]);
  });

  it('dates are valid ISO 8601', () => {
    const r = createEmptyPatientRecord();
    expect(new Date(r.createdAt).toISOString()).toBe(r.createdAt);
  });
});

describe('item factories', () => {
  it('each factory produces a unique id', () => {
    expect(newMedication().id).not.toBe(newMedication().id);
    expect(newVaccination().id).not.toBe(newVaccination().id);
    expect(newProcedure().id).not.toBe(newProcedure().id);
    expect(newAllergy().id).not.toBe(newAllergy().id);
  });

  it('new medication defaults to active + self-reported', () => {
    const m = newMedication();
    expect(m.status).toBe('active');
    expect(m.source).toBe('self-reported');
    expect(m.endDate).toBeNull();
  });

  it('new medication has empty notes/patientNotes and reminder off', () => {
    const m = newMedication();
    expect(m.notes).toBe('');
    expect(m.patientNotes).toBe('');
    expect(m.reminder).toBe(false);
    expect(m.reminderTimes).toEqual([]);
    expect(m.reminderDays).toEqual([]);
  });

  it('new procedure defaults new fields correctly', () => {
    const p = newProcedure();
    expect(p.outcome).toBe('');
    expect(p.followUpDate).toBeNull();
    expect(p.cptCode).toBe('');
    expect(p.diagnosisCode).toBe('');
  });
});

describe('newShareToken', () => {
  it('creates a uuid token', () => {
    const t = newShareToken('Dr. Rashid');
    expect(t.token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('two calls produce different tokens', () => {
    expect(newShareToken('A').token).not.toBe(newShareToken('A').token);
  });

  it('stores the supplied label', () => {
    expect(newShareToken('Inova Primary Care').label).toBe('Inova Primary Care');
  });

  it('defaults to active with no expiry', () => {
    const t = newShareToken('Test');
    expect(t.active).toBe(true);
    expect(t.expiresAt).toBeNull();
  });

  it('createdAt is a valid ISO 8601 timestamp', () => {
    const t = newShareToken('Test');
    expect(new Date(t.createdAt).toISOString()).toBe(t.createdAt);
  });
});

describe('newAccessLogEntry', () => {
  it('creates a uuid id', () => {
    const e = newAccessLogEntry('qr', null, 'Walk-in clinic');
    expect(e.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('two calls produce different ids', () => {
    expect(newAccessLogEntry('link', null, 'A').id).not.toBe(
      newAccessLogEntry('link', null, 'A').id
    );
  });

  it('stores method, token, and label correctly', () => {
    const e = newAccessLogEntry('clipboard', 'tok-123', 'Dr. Patel');
    expect(e.method).toBe('clipboard');
    expect(e.token).toBe('tok-123');
    expect(e.label).toBe('Dr. Patel');
  });

  it('accepts null token', () => {
    const e = newAccessLogEntry('print', null, 'Reception desk');
    expect(e.token).toBeNull();
  });

  it('defaults revoked to false', () => {
    expect(newAccessLogEntry('qr', null, 'Test').revoked).toBe(false);
  });

  it('timestamp is a valid ISO 8601 string', () => {
    const e = newAccessLogEntry('link', null, 'Test');
    expect(new Date(e.timestamp).toISOString()).toBe(e.timestamp);
  });
});

describe('storage — disclaimer acknowledgement', () => {
  beforeEach(() => localStorageMock.clear());

  it('loadDisclaimerAck returns false when not yet set', () => {
    expect(storage.loadDisclaimerAck()).toBe(false);
  });

  it('loadDisclaimerAck returns true after saveDisclaimerAck', () => {
    storage.saveDisclaimerAck();
    expect(storage.loadDisclaimerAck()).toBe(true);
  });

  it('saveDisclaimerAck is idempotent — calling it twice still returns true', () => {
    storage.saveDisclaimerAck();
    storage.saveDisclaimerAck();
    expect(storage.loadDisclaimerAck()).toBe(true);
  });

  it('disclaimer key is independent from the patient record key', () => {
    storage.saveDisclaimerAck();
    storage.clearRecord();
    expect(storage.loadDisclaimerAck()).toBe(true);
    expect(storage.loadRecord()).toBeNull();
  });
});

describe('storage adapter', () => {
  beforeEach(() => localStorageMock.clear());

  it('returns null when nothing saved', () => {
    expect(storage.loadRecord()).toBeNull();
  });

  it('round-trips a patient record without data loss', () => {
    const original = createEmptyPatientRecord();
    original.personal.firstName = 'Maria';
    original.personal.lastName = 'Santos';
    storage.saveRecord(original);
    const loaded = storage.loadRecord();
    expect(loaded?.personal.firstName).toBe('Maria');
    expect(loaded?.personal.lastName).toBe('Santos');
    expect(loaded?.recordId).toBe(original.recordId);
  });

  it('updates updatedAt on save', () => {
    const r = createEmptyPatientRecord();
    const before = r.updatedAt;
    // Small delay to ensure timestamp differs
    vi.useFakeTimers();
    vi.advanceTimersByTime(1000);
    storage.saveRecord(r);
    // saveRecord does not mutate the argument — check the persisted value instead
    const loaded = storage.loadRecord();
    expect(loaded?.updatedAt).not.toBe(before);
    vi.useRealTimers();
  });

  it('clearRecord removes the record', () => {
    storage.saveRecord(createEmptyPatientRecord());
    storage.clearRecord();
    expect(storage.loadRecord()).toBeNull();
  });

  it('appendLogEntry prepends newest first', () => {
    const e1 = { id: '1', timestamp: '2024-01-01T00:00:00Z',
      method: 'qr' as const, token: null, label: 'First', revoked: false };
    const e2 = { id: '2', timestamp: '2024-01-02T00:00:00Z',
      method: 'link' as const, token: 'abc', label: 'Second', revoked: false };
    storage.appendLogEntry(e1);
    storage.appendLogEntry(e2);
    const log = storage.loadLog();
    expect(log[0].label).toBe('Second');
    expect(log[1].label).toBe('First');
  });
});