// sharing.ts — pure business logic for Layer 2 sharing features.
// No React imports. No browser APIs (no window.*, no localStorage).
// All side effects (saving tokens, appending log entries) happen in the store.

import type { ShareToken, PatientRecord } from './types';

/** Returns true if the token is active and not past its expiry. */
export function isTokenActive(token: ShareToken): boolean {
  if (!token.active) return false;
  if (token.expiresAt === null) return true;
  return new Date(token.expiresAt) > new Date();
}

/**
 * Builds the provider-facing view URL.
 * Origin is supplied by the caller — window.location.origin is not allowed in core/.
 * Example: shareUrl('abc-123', 'https://myapp.com') → 'https://myapp.com/view/abc-123'
 */
export function shareUrl(token: string, origin: string): string {
  return `${origin}/view/${token}`;
}

/** Returns only usable (active, non-expired) tokens from the record's shareTokens map. */
export function getActiveTokens(tokens: Record<string, ShareToken>): ShareToken[] {
  return Object.values(tokens).filter(isTokenActive);
}

/** Returns only unusable (revoked or expired) tokens from the record's shareTokens map. */
export function getRevokedTokens(tokens: Record<string, ShareToken>): ShareToken[] {
  return Object.values(tokens).filter((t) => !isTokenActive(t));
}

/**
 * Formats a PatientRecord as a plain-text block suitable for pasting into an intake form.
 * Omits blank fields. Active medications only.
 */
export function buildClipboardText(record: PatientRecord): string {
  const { personal: p, emergencyContact: ec, allergies, medications, vaccinations, procedures, insurancePrimary } = record;
  const lines: string[] = [];

  const field = (label: string, value: string | number | null | undefined): void => {
    if (value !== null && value !== undefined && value !== '') {
      lines.push(`${label}: ${value}`);
    }
  };

  lines.push('PATIENT HEALTH SUMMARY');
  lines.push('======================');
  lines.push(`Generated: ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');

  lines.push('PERSONAL INFORMATION');
  field('Name', `${p.firstName} ${p.lastName}`.trim());
  field('Date of Birth', p.dateOfBirth);
  field('Gender', p.gender);
  field('Blood Type', p.bloodType);
  field('Address', [p.address, p.city, p.state, p.zip].filter(Boolean).join(', '));
  field('Phone', p.phone);
  field('Email', p.email);
  const heightParts: string[] = [];
  if (p.heightFt !== null) heightParts.push(`${p.heightFt}'`);
  if (p.heightIn !== null) heightParts.push(`${p.heightIn}"`);
  if (heightParts.length) field('Height', heightParts.join(' '));
  if (p.weightLbs !== null) field('Weight', `${p.weightLbs} lbs`);
  field('Primary Language', p.primaryLanguage);
  field('Marital Status', p.maritalStatus);
  lines.push('');

  lines.push('EMERGENCY CONTACT');
  field('Name', ec.name);
  field('Relationship', ec.relationship);
  field('Phone', ec.phone);
  lines.push('');

  lines.push('ALLERGIES');
  if (allergies.length === 0) {
    lines.push('None reported');
  } else {
    for (const a of allergies) {
      lines.push(`- ${a.substance}: ${a.reaction} (${a.severity})`);
    }
  }
  lines.push('');

  lines.push('MEDICATIONS');
  const activeMeds = medications.filter((m) => m.status === 'active');
  if (activeMeds.length === 0) {
    lines.push('None reported');
  } else {
    for (const m of activeMeds) {
      const parts = [`- ${m.name}`];
      if (m.dosage) parts.push(m.dosage);
      if (m.frequency) parts.push(m.frequency);
      if (m.prescribingProvider) parts.push(`(${m.prescribingProvider})`);
      lines.push(parts.join(', '));
    }
  }
  lines.push('');

  lines.push('VACCINATIONS');
  if (vaccinations.length === 0) {
    lines.push('None reported');
  } else {
    for (const v of vaccinations) {
      const parts = [`- ${v.vaccineName}`];
      if (v.dateAdministered) parts.push(v.dateAdministered);
      lines.push(parts.join(': '));
    }
  }
  lines.push('');

  lines.push('PROCEDURES / SURGERIES');
  if (procedures.length === 0) {
    lines.push('None reported');
  } else {
    for (const proc of procedures) {
      const parts = [`- ${proc.procedureName}`];
      if (proc.date) parts.push(proc.date);
      if (proc.facility) parts.push(proc.facility);
      lines.push(parts.join(', '));
    }
  }
  lines.push('');

  if (insurancePrimary) {
    lines.push('PRIMARY INSURANCE');
    field('Carrier', insurancePrimary.carrier);
    field('Plan', insurancePrimary.planName);
    field('Member ID', insurancePrimary.memberId);
    field('Group Number', insurancePrimary.groupNumber);
    field('Policy Holder', insurancePrimary.policyHolderName);
    lines.push('');
  }

  return lines.join('\n');
}
