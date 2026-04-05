import { describe, it, expect } from 'vitest';
import { isTokenActive, shareUrl, getActiveTokens, getRevokedTokens, buildClipboardText, createShareToken, ALL_SECTIONS } from './sharing';
import type { ShareToken } from './types';
import { createEmptyPatientRecord } from './schema';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeToken(overrides: Partial<ShareToken> = {}): ShareToken {
  return {
    token: 'test-token-uuid',
    createdAt: '2026-01-01T00:00:00.000Z',
    expiresAt: null,
    label: 'Test Clinic',
    active: true,
    sections: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// isTokenActive
// ---------------------------------------------------------------------------

describe('isTokenActive', () => {
  it('returns true for an active token with no expiry', () => {
    expect(isTokenActive(makeToken())).toBe(true);
  });

  it('returns false when active is false', () => {
    expect(isTokenActive(makeToken({ active: false }))).toBe(false);
  });

  it('returns true when expiresAt is in the future', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isTokenActive(makeToken({ expiresAt: future }))).toBe(true);
  });

  it('returns false when expiresAt is in the past', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isTokenActive(makeToken({ expiresAt: past }))).toBe(false);
  });

  it('returns false when both active=false and expiresAt is in the future', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    expect(isTokenActive(makeToken({ active: false, expiresAt: future }))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// shareUrl
// ---------------------------------------------------------------------------

describe('shareUrl', () => {
  it('builds the correct URL', () => {
    expect(shareUrl('abc-123', 'https://myapp.com')).toBe('https://myapp.com/view/abc-123');
  });

  it('works with localhost origin', () => {
    expect(shareUrl('tok', 'http://localhost:5173')).toBe('http://localhost:5173/view/tok');
  });
});

// ---------------------------------------------------------------------------
// getActiveTokens
// ---------------------------------------------------------------------------

describe('getActiveTokens', () => {
  it('returns an empty array when there are no tokens', () => {
    expect(getActiveTokens({})).toEqual([]);
  });

  it('returns only active, non-expired tokens', () => {
    const future = new Date(Date.now() + 60_000).toISOString();
    const past = new Date(Date.now() - 60_000).toISOString();
    const tokens: Record<string, ShareToken> = {
      a: makeToken({ token: 'a', active: true, expiresAt: null }),
      b: makeToken({ token: 'b', active: false }),
      c: makeToken({ token: 'c', active: true, expiresAt: past }),
      d: makeToken({ token: 'd', active: true, expiresAt: future }),
    };
    const result = getActiveTokens(tokens);
    expect(result.map((t) => t.token).sort()).toEqual(['a', 'd']);
  });

  it('returns all tokens when all are active with no expiry', () => {
    const tokens: Record<string, ShareToken> = {
      x: makeToken({ token: 'x' }),
      y: makeToken({ token: 'y' }),
    };
    expect(getActiveTokens(tokens)).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// getRevokedTokens
// ---------------------------------------------------------------------------

describe('getRevokedTokens', () => {
  it('returns an empty array when there are no tokens', () => {
    expect(getRevokedTokens({})).toEqual([]);
  });

  it('returns only inactive or expired tokens', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const tokens: Record<string, ShareToken> = {
      a: makeToken({ token: 'a', active: true }),
      b: makeToken({ token: 'b', active: false }),
      c: makeToken({ token: 'c', active: true, expiresAt: past }),
    };
    const result = getRevokedTokens(tokens);
    expect(result.map((t) => t.token).sort()).toEqual(['b', 'c']);
  });

  it('getActiveTokens and getRevokedTokens partition the full set', () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    const tokens: Record<string, ShareToken> = {
      a: makeToken({ token: 'a', active: true }),
      b: makeToken({ token: 'b', active: false }),
      c: makeToken({ token: 'c', active: true, expiresAt: past }),
    };
    const active = getActiveTokens(tokens);
    const revoked = getRevokedTokens(tokens);
    expect(active.length + revoked.length).toBe(Object.keys(tokens).length);
  });
});

// ---------------------------------------------------------------------------
// buildClipboardText
// ---------------------------------------------------------------------------

describe('buildClipboardText', () => {
  it('includes the patient name', () => {
    const record = createEmptyPatientRecord();
    record.personal.firstName = 'Maria';
    record.personal.lastName = 'Santos';
    const text = buildClipboardText(record);
    expect(text).toContain('Name: Maria Santos');
  });

  it('shows "None reported" for empty allergies', () => {
    const record = createEmptyPatientRecord();
    expect(buildClipboardText(record)).toContain('None reported');
  });

  it('lists allergy substance, reaction, and severity', () => {
    const record = createEmptyPatientRecord();
    record.allergies = [{
      id: '1', substance: 'Penicillin', reaction: 'Rash', severity: 'moderate',
    }];
    expect(buildClipboardText(record)).toContain('- Penicillin: Rash (moderate)');
  });

  it('includes only active medications', () => {
    const record = createEmptyPatientRecord();
    record.medications = [
      { id: '1', name: 'Lisinopril', dosage: '10mg', frequency: 'daily',
        prescribingProvider: 'Dr. Patel', startDate: '2024-01-01', endDate: null,
        source: 'provider', status: 'active',
        notes: '', patientNotes: '', reminder: false, reminderTimes: [], reminderDays: [] },
      { id: '2', name: 'OldMed', dosage: '5mg', frequency: 'weekly',
        prescribingProvider: '', startDate: '2020-01-01', endDate: '2021-01-01',
        source: 'self-reported', status: 'past',
        notes: '', patientNotes: '', reminder: false, reminderTimes: [], reminderDays: [] },
    ];
    const text = buildClipboardText(record);
    expect(text).toContain('Lisinopril');
    expect(text).not.toContain('OldMed');
  });

  it('lists vaccinations', () => {
    const record = createEmptyPatientRecord();
    record.vaccinations = [{
      id: '1', vaccineName: 'Influenza', dateAdministered: '2025-10-01',
      lotNumber: 'LOT123', administeringSite: 'Left arm', source: 'provider',
    }];
    expect(buildClipboardText(record)).toContain('- Influenza: 2025-10-01');
  });

  it('includes primary insurance when present', () => {
    const record = createEmptyPatientRecord();
    record.insurancePrimary = {
      carrier: 'BlueCross', planName: 'PPO Gold', memberId: 'MBR001',
      groupNumber: 'GRP999', policyHolderName: 'Maria Santos', effectiveDate: '2024-01-01',
    };
    const text = buildClipboardText(record);
    expect(text).toContain('PRIMARY INSURANCE');
    expect(text).toContain('Carrier: BlueCross');
    expect(text).toContain('Member ID: MBR001');
  });

  it('omits insurance section when insurancePrimary is null', () => {
    const record = createEmptyPatientRecord();
    expect(buildClipboardText(record)).not.toContain('PRIMARY INSURANCE');
  });

  it('omits blank personal fields', () => {
    const record = createEmptyPatientRecord();
    record.personal.firstName = 'John';
    // email, phone, bloodType, etc. are all empty — should not appear as "Email: "
    const text = buildClipboardText(record);
    expect(text).not.toMatch(/Email:\s*\n/);
    expect(text).not.toMatch(/Phone:\s*\n/);
  });

  it('formats height from ft and in parts', () => {
    const record = createEmptyPatientRecord();
    record.personal.heightFt = 5;
    record.personal.heightIn = 8;
    expect(buildClipboardText(record)).toContain("Height: 5' 8\"");
  });

  it('includes weight with unit', () => {
    const record = createEmptyPatientRecord();
    record.personal.weightLbs = 150;
    expect(buildClipboardText(record)).toContain('Weight: 150 lbs');
  });

  it('includes the PATIENT HEALTH SUMMARY header', () => {
    expect(buildClipboardText(createEmptyPatientRecord())).toContain('PATIENT HEALTH SUMMARY');
  });
});

// ---------------------------------------------------------------------------
// ALL_SECTIONS
// ---------------------------------------------------------------------------

describe('ALL_SECTIONS', () => {
  it('contains all eight shareable sections', () => {
    expect(ALL_SECTIONS).toHaveLength(8);
  });

  it('includes every expected section key', () => {
    const expected = [
      'personal', 'emergency', 'allergies', 'medications',
      'vaccinations', 'procedures', 'insurancePrimary', 'insuranceSecondary',
    ];
    expect(ALL_SECTIONS).toEqual(expected);
  });
});

// ---------------------------------------------------------------------------
// createShareToken
// ---------------------------------------------------------------------------

describe('createShareToken', () => {
  it('creates a token with the supplied label and sections', () => {
    const t = createShareToken('Dr. Rashid', ['personal', 'allergies']);
    expect(t.label).toBe('Dr. Rashid');
    expect(t.sections).toEqual(['personal', 'allergies']);
  });

  it('generates a uuid token string', () => {
    const t = createShareToken('Clinic', ALL_SECTIONS);
    expect(t.token).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });

  it('two calls produce different token values', () => {
    expect(createShareToken('A', []).token).not.toBe(createShareToken('A', []).token);
  });

  it('defaults expiresAt to null when omitted', () => {
    expect(createShareToken('X', []).expiresAt).toBeNull();
  });

  it('stores the supplied expiresAt when provided', () => {
    const exp = '2027-01-01T00:00:00.000Z';
    expect(createShareToken('X', [], exp).expiresAt).toBe(exp);
  });

  it('stores null expiresAt when explicitly passed null', () => {
    expect(createShareToken('X', [], null).expiresAt).toBeNull();
  });

  it('starts active', () => {
    expect(createShareToken('X', ALL_SECTIONS).active).toBe(true);
  });

  it('works with ALL_SECTIONS — token carries all eight sections', () => {
    const t = createShareToken('Full share', ALL_SECTIONS);
    expect(t.sections).toHaveLength(8);
    expect(t.sections).toContain('medications');
    expect(t.sections).toContain('insuranceSecondary');
  });
});
