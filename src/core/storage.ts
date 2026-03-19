// storage.ts — localStorage adapter
// Swap this file's implementation for API calls in production.
// Nothing outside this file should ever call localStorage directly.

import type { PatientRecord, AccessLogEntry } from './types';

const RECORD_KEY = 'hie_patient_record';
const LOG_KEY = 'hie_access_log';

export const storage = {
  loadRecord(): PatientRecord | null {
    try {
      const raw = localStorage.getItem(RECORD_KEY);
      return raw ? (JSON.parse(raw) as PatientRecord) : null;
    } catch {
      return null;
    }
  },

  saveRecord(record: PatientRecord): void {
    record.updatedAt = new Date().toISOString();
    localStorage.setItem(RECORD_KEY, JSON.stringify(record));
  },

  clearRecord(): void {
    localStorage.removeItem(RECORD_KEY);
  },

  loadLog(): AccessLogEntry[] {
    try {
      const raw = localStorage.getItem(LOG_KEY);
      return raw ? (JSON.parse(raw) as AccessLogEntry[]) : [];
    } catch {
      return [];
    }
  },

  appendLogEntry(entry: AccessLogEntry): void {
    const log = storage.loadLog();
    log.unshift(entry); // newest first
    localStorage.setItem(LOG_KEY, JSON.stringify(log));
  },
};