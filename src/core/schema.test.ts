import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createEmptyPatientRecord,
  newMedication,
  newVaccination,
  newProcedure,
  newAllergy,
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
    expect(r.updatedAt).not.toBe(before);
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