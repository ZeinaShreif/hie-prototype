import { describe, it, expect } from 'vitest';
import {
  createLogEntry,
  filterByMethod,
  filterByDateRange,
  getActiveEntries,
  getRevokedEntries,
  revokeEntry,
  summariseLog,
} from './accessLog';
import type { AccessLogEntry } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Partial<AccessLogEntry> = {}): AccessLogEntry {
  return {
    id: 'entry-1',
    timestamp: '2026-01-15T10:00:00.000Z',
    method: 'qr',
    token: 'tok-abc',
    label: 'Test Clinic',
    revoked: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// createLogEntry
// ---------------------------------------------------------------------------

describe('createLogEntry', () => {
  it('returns an entry with a uuid id', () => {
    const e = createLogEntry('qr', 'Inova', 'tok-1');
    expect(e.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('two calls produce different ids', () => {
    expect(createLogEntry('link', 'A', null).id).not.toBe(
      createLogEntry('link', 'A', null).id
    );
  });

  it('stores method, label, and token correctly', () => {
    const e = createLogEntry('clipboard', 'Dr. Patel', 'tok-xyz');
    expect(e.method).toBe('clipboard');
    expect(e.label).toBe('Dr. Patel');
    expect(e.token).toBe('tok-xyz');
  });

  it('accepts null token', () => {
    expect(createLogEntry('print', 'Reception', null).token).toBeNull();
  });

  it('defaults revoked to false', () => {
    expect(createLogEntry('qr', 'Clinic', null).revoked).toBe(false);
  });

  it('timestamp is a valid ISO 8601 string', () => {
    const e = createLogEntry('link', 'Test', null);
    expect(new Date(e.timestamp).toISOString()).toBe(e.timestamp);
  });
});

// ---------------------------------------------------------------------------
// filterByMethod
// ---------------------------------------------------------------------------

describe('filterByMethod', () => {
  const log: AccessLogEntry[] = [
    makeEntry({ id: '1', method: 'qr' }),
    makeEntry({ id: '2', method: 'link' }),
    makeEntry({ id: '3', method: 'qr' }),
    makeEntry({ id: '4', method: 'print' }),
    makeEntry({ id: '5', method: 'clipboard' }),
  ];

  it('returns only entries matching the given method', () => {
    const result = filterByMethod(log, 'qr');
    expect(result).toHaveLength(2);
    expect(result.every((e) => e.method === 'qr')).toBe(true);
  });

  it('returns an empty array when no entries match', () => {
    expect(filterByMethod([], 'link')).toEqual([]);
  });

  it('returns a single match', () => {
    const result = filterByMethod(log, 'print');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  it('does not mutate the original log', () => {
    const copy = [...log];
    filterByMethod(log, 'qr');
    expect(log).toEqual(copy);
  });
});

// ---------------------------------------------------------------------------
// filterByDateRange
// ---------------------------------------------------------------------------

describe('filterByDateRange', () => {
  const log: AccessLogEntry[] = [
    makeEntry({ id: '1', timestamp: '2026-01-01T00:00:00.000Z' }),
    makeEntry({ id: '2', timestamp: '2026-01-15T12:00:00.000Z' }),
    makeEntry({ id: '3', timestamp: '2026-01-31T23:59:59.000Z' }),
    makeEntry({ id: '4', timestamp: '2026-02-10T08:00:00.000Z' }),
  ];

  it('returns entries within the range inclusive', () => {
    const result = filterByDateRange(log, '2026-01-01T00:00:00.000Z', '2026-01-31T23:59:59.000Z');
    expect(result.map((e) => e.id)).toEqual(['1', '2', '3']);
  });

  it('excludes entries outside the range', () => {
    const result = filterByDateRange(log, '2026-01-10T00:00:00.000Z', '2026-01-20T00:00:00.000Z');
    expect(result.map((e) => e.id)).toEqual(['2']);
  });

  it('returns an empty array when nothing falls in range', () => {
    expect(filterByDateRange(log, '2025-01-01T00:00:00.000Z', '2025-12-31T23:59:59.000Z')).toEqual([]);
  });

  it('returns an empty array when log is empty', () => {
    expect(filterByDateRange([], '2026-01-01T00:00:00.000Z', '2026-12-31T00:00:00.000Z')).toEqual([]);
  });

  it('includes entries exactly on the from and to boundaries', () => {
    const result = filterByDateRange(
      log,
      '2026-01-01T00:00:00.000Z',
      '2026-01-01T00:00:00.000Z',
    );
    expect(result.map((e) => e.id)).toEqual(['1']);
  });
});

// ---------------------------------------------------------------------------
// getActiveEntries
// ---------------------------------------------------------------------------

describe('getActiveEntries', () => {
  it('returns only entries where revoked is false', () => {
    const log = [
      makeEntry({ id: '1', revoked: false }),
      makeEntry({ id: '2', revoked: true }),
      makeEntry({ id: '3', revoked: false }),
    ];
    const result = getActiveEntries(log);
    expect(result.map((e) => e.id)).toEqual(['1', '3']);
  });

  it('returns all entries when none are revoked', () => {
    const log = [makeEntry({ id: '1' }), makeEntry({ id: '2' })];
    expect(getActiveEntries(log)).toHaveLength(2);
  });

  it('returns an empty array when all are revoked', () => {
    const log = [makeEntry({ revoked: true }), makeEntry({ revoked: true })];
    expect(getActiveEntries(log)).toEqual([]);
  });

  it('returns an empty array when log is empty', () => {
    expect(getActiveEntries([])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getRevokedEntries
// ---------------------------------------------------------------------------

describe('getRevokedEntries', () => {
  it('returns only entries where revoked is true', () => {
    const log = [
      makeEntry({ id: '1', revoked: false }),
      makeEntry({ id: '2', revoked: true }),
      makeEntry({ id: '3', revoked: true }),
    ];
    const result = getRevokedEntries(log);
    expect(result.map((e) => e.id)).toEqual(['2', '3']);
  });

  it('returns an empty array when none are revoked', () => {
    expect(getRevokedEntries([makeEntry()])).toEqual([]);
  });

  it('returns an empty array when log is empty', () => {
    expect(getRevokedEntries([])).toEqual([]);
  });

  it('getActiveEntries and getRevokedEntries partition the full log', () => {
    const log = [
      makeEntry({ id: '1', revoked: false }),
      makeEntry({ id: '2', revoked: true }),
      makeEntry({ id: '3', revoked: false }),
    ];
    expect(getActiveEntries(log).length + getRevokedEntries(log).length).toBe(log.length);
  });
});

// ---------------------------------------------------------------------------
// revokeEntry
// ---------------------------------------------------------------------------

describe('revokeEntry', () => {
  it('sets revoked to true on the matching entry', () => {
    const log = [makeEntry({ id: 'a', revoked: false }), makeEntry({ id: 'b', revoked: false })];
    const result = revokeEntry(log, 'a');
    expect(result.find((e) => e.id === 'a')?.revoked).toBe(true);
  });

  it('does not affect other entries', () => {
    const log = [makeEntry({ id: 'a' }), makeEntry({ id: 'b' })];
    const result = revokeEntry(log, 'a');
    expect(result.find((e) => e.id === 'b')?.revoked).toBe(false);
  });

  it('does not mutate the original array', () => {
    const log = [makeEntry({ id: 'a', revoked: false })];
    revokeEntry(log, 'a');
    expect(log[0].revoked).toBe(false);
  });

  it('returns a new array reference', () => {
    const log = [makeEntry({ id: 'a' })];
    expect(revokeEntry(log, 'a')).not.toBe(log);
  });

  it('returns the array unchanged when id does not match', () => {
    const log = [makeEntry({ id: 'a', revoked: false })];
    const result = revokeEntry(log, 'no-match');
    expect(result[0].revoked).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// summariseLog
// ---------------------------------------------------------------------------

describe('summariseLog', () => {
  it('returns zero counts for an empty log', () => {
    const summary = summariseLog([]);
    expect(summary.total).toBe(0);
    expect(summary.byMethod).toEqual({ qr: 0, link: 0, print: 0, clipboard: 0 });
    expect(summary.revoked).toBe(0);
  });

  it('counts total entries correctly', () => {
    const log = [makeEntry(), makeEntry(), makeEntry()];
    expect(summariseLog(log).total).toBe(3);
  });

  it('counts per-method correctly', () => {
    const log = [
      makeEntry({ method: 'qr' }),
      makeEntry({ method: 'qr' }),
      makeEntry({ method: 'link' }),
      makeEntry({ method: 'print' }),
      makeEntry({ method: 'clipboard' }),
      makeEntry({ method: 'clipboard' }),
    ];
    const { byMethod } = summariseLog(log);
    expect(byMethod.qr).toBe(2);
    expect(byMethod.link).toBe(1);
    expect(byMethod.print).toBe(1);
    expect(byMethod.clipboard).toBe(2);
  });

  it('counts revoked entries correctly', () => {
    const log = [
      makeEntry({ revoked: false }),
      makeEntry({ revoked: true }),
      makeEntry({ revoked: true }),
    ];
    expect(summariseLog(log).revoked).toBe(2);
  });

  it('total equals sum of all byMethod counts', () => {
    const log = [
      makeEntry({ method: 'qr' }),
      makeEntry({ method: 'link' }),
      makeEntry({ method: 'print' }),
    ];
    const { total, byMethod } = summariseLog(log);
    const methodSum = Object.values(byMethod).reduce((a, b) => a + b, 0);
    expect(total).toBe(methodSum);
  });
});
