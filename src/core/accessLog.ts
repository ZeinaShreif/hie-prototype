// accessLog.ts — pure business logic for Layer 3 access log and consent features.
// No React imports. No browser APIs. No localStorage access.
// All side effects (appending entries, persisting the log) happen in the store.

import type { AccessLogEntry } from './types';
import { newAccessLogEntry } from './schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LogSummary {
  total: number;
  byMethod: Record<AccessLogEntry['method'], number>;
  revoked: number;
}

// ---------------------------------------------------------------------------
// Factory wrapper
// ---------------------------------------------------------------------------

/**
 * Creates a new AccessLogEntry with a uuid id and current ISO timestamp.
 * Wraps newAccessLogEntry from schema.ts with (method, label, token) parameter order.
 */
export function createLogEntry(
  method: AccessLogEntry['method'],
  label: string,
  token: string | null,
): AccessLogEntry {
  return newAccessLogEntry(method, token, label);
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

/** Returns entries matching the given share method. */
export function filterByMethod(
  log: AccessLogEntry[],
  method: AccessLogEntry['method'],
): AccessLogEntry[] {
  return log.filter((e) => e.method === method);
}

/**
 * Returns entries whose timestamp falls within [from, to] inclusive.
 * Both from and to are ISO 8601 strings. Comparison uses Date arithmetic
 * so partial date strings (e.g. "2024-01-31") are interpreted as midnight UTC.
 */
export function filterByDateRange(
  log: AccessLogEntry[],
  from: string,
  to: string,
): AccessLogEntry[] {
  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  return log.filter((e) => {
    const ts = new Date(e.timestamp).getTime();
    return ts >= fromMs && ts <= toMs;
  });
}

/** Returns entries where revoked is false. */
export function getActiveEntries(log: AccessLogEntry[]): AccessLogEntry[] {
  return log.filter((e) => !e.revoked);
}

/** Returns entries where revoked is true. */
export function getRevokedEntries(log: AccessLogEntry[]): AccessLogEntry[] {
  return log.filter((e) => e.revoked);
}

// ---------------------------------------------------------------------------
// Mutations (pure — return new arrays, never mutate input)
// ---------------------------------------------------------------------------

/**
 * Returns a new log array with the entry matching id having revoked set to true.
 * The original array is not mutated. If no entry matches, returns the array unchanged.
 */
export function revokeEntry(log: AccessLogEntry[], id: string): AccessLogEntry[] {
  return log.map((e) => (e.id === id ? { ...e, revoked: true } : e));
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

/**
 * Returns a summary of the log: total entry count, per-method counts,
 * and the number of revoked entries.
 */
export function summariseLog(log: AccessLogEntry[]): LogSummary {
  const byMethod: Record<AccessLogEntry['method'], number> = {
    qr: 0,
    link: 0,
    print: 0,
    clipboard: 0,
  };
  let revoked = 0;

  for (const e of log) {
    byMethod[e.method]++;
    if (e.revoked) revoked++;
  }

  return { total: log.length, byMethod, revoked };
}
