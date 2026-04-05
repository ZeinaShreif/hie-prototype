import { useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { usePatientStore } from '../core/store';
import { createShareToken, shareUrl, buildClipboardText, ALL_SECTIONS } from '../core/sharing';
import { createLogEntry } from '../core/accessLog';
import type { ShareToken, ShareableSection } from '../core/types';
import PrintSummary from '../components/PrintSummary';

// ── Constants ──────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<ShareableSection, string> = {
  personal:           'Personal details',
  emergency:          'Emergency contact',
  allergies:          'Allergies',
  medications:        'Medications',
  vaccinations:       'Vaccinations',
  procedures:         'Procedures & surgeries',
  insurancePrimary:   'Primary insurance',
  insuranceSecondary: 'Secondary insurance',
};

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  const time = d
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
  if (isToday) return `Today · ${time}`;
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${date} · ${time}`;
}

const METHOD_BADGE: Record<
  string,
  { bg: string; color: string; label: string }
> = {
  qr:        { bg: '#E0F4FB', color: '#0369A1', label: 'QR' },
  link:      { bg: '#EDE9FE', color: '#4C1D95', label: 'Link' },
  clipboard: { bg: '#FEF3C7', color: '#92400E', label: 'Clipboard' },
  print:     { bg: '#F1F5F9', color: '#475569', label: 'Print' },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function SharePage() {
  const shareTokens = usePatientStore((s) => s.record.shareTokens);
  const log         = usePatientStore((s) => s.log);
  const clearLog    = usePatientStore((s) => s.clearLog);

  const [selectedSections, setSelectedSections] = useState<ShareableSection[]>([...ALL_SECTIONS]);
  const [currentToken, setCurrentToken] = useState<ShareToken | null>(null);
  const currentTokenRef = useRef<ShareToken | null>(null);
  const [logOpen, setLogOpen] = useState(true);

  // Issue a new token on mount, and whenever the section selection changes.
  // Using getState() inside the effect avoids stale-closure issues with
  // store actions while keeping selectedSections as the sole dep.
  useEffect(() => {
    const store = usePatientStore.getState();
    if (currentTokenRef.current) store.revokeShareToken(currentTokenRef.current.token);
    const token = createShareToken('Check-in QR', selectedSections);
    store.addShareToken(token);
    currentTokenRef.current = token;
    setCurrentToken(token);
  }, [selectedSections]);

  const url = currentToken
    ? shareUrl(currentToken.token, window.location.origin)
    : '';

  // ── Handlers ──────────────────────────────────────────────────────────

  function handleRefresh() {
    const store = usePatientStore.getState();
    if (currentTokenRef.current) store.revokeShareToken(currentTokenRef.current.token);
    const next = createShareToken('Check-in QR', selectedSections);
    store.addShareToken(next);
    currentTokenRef.current = next;
    setCurrentToken(next);
  }

  function handleCopyLink() {
    if (!currentToken) return;
    navigator.clipboard.writeText(url);
    usePatientStore.getState().appendLog(
      createLogEntry('clipboard', 'Copy link', currentToken.token)
    );
  }

  function handleCopyClipboard() {
    // Access full record at call-time to avoid subscribing to every field change
    const record = usePatientStore.getState().record;
    navigator.clipboard.writeText(buildClipboardText(record));
    usePatientStore.getState().appendLog(
      createLogEntry('clipboard', 'Copy to clipboard', currentToken?.token ?? null)
    );
  }

  function handleSendLink() {
    if (!currentToken) return;
    navigator.clipboard.writeText(url);
    usePatientStore.getState().appendLog(
      createLogEntry('link', 'Send secure link', currentToken.token)
    );
  }

  function toggleSection(section: ShareableSection) {
    setSelectedSections((prev) =>
      prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <>
      {/* Hidden on screen, visible when printing */}
      <PrintSummary sections={selectedSections} />

      <div className="p-4 no-print">

        {/* ── Section picker ──────────────────────────────────────────────── */}
        <div className="hie-section" style={{ marginBottom: 12 }}>
          <div className="hie-section-header">
            <h2 className="hie-section-title">What to share</h2>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
              Sharing {selectedSections.length} of {ALL_SECTIONS.length} sections
            </span>
          </div>

          <div
            style={{
              padding: '12px 16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px 20px',
            }}
          >
            {ALL_SECTIONS.map((section) => (
              <label
                key={section}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  cursor: 'pointer',
                  color: 'var(--text-dark)',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedSections.includes(section)}
                  onChange={() => toggleSection(section)}
                  style={{ accentColor: 'var(--cyan)', width: 15, height: 15, cursor: 'pointer' }}
                />
                {SECTION_LABELS[section]}
              </label>
            ))}
          </div>
        </div>

        {/* ── Section 1: QR hero card ─────────────────────────────────────── */}
        <div className="hie-section" style={{ marginBottom: 12 }}>
          <div className="hie-section-header">
            <h2 className="hie-section-title">Check-in QR code</h2>
          </div>

          <div style={{ padding: '20px 16px 18px', textAlign: 'center' }}>
            <p className="text-sm" style={{ color: 'var(--muted)', marginBottom: 20 }}>
              Show this to your provider at check-in
            </p>

            {/* QR code */}
            {currentToken && (
              <div
                style={{
                  display: 'inline-block',
                  padding: 16,
                  background: 'white',
                  borderRadius: 12,
                  border: '1.5px solid var(--ice-border)',
                  marginBottom: 16,
                }}
              >
                <QRCodeSVG value={url} size={180} />
              </div>
            )}

            {/* Refresh + Copy link */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <button
                onClick={handleRefresh}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '9px 18px', borderRadius: 6,
                  border: '1.5px solid var(--ice-border)', background: 'transparent',
                  color: 'var(--text-dark)', cursor: 'pointer',
                }}
              >
                Refresh code
              </button>
              <button
                onClick={handleCopyLink}
                style={{
                  fontSize: 13, fontWeight: 600, padding: '9px 18px', borderRadius: 6,
                  border: 'none', background: 'var(--cyan)', color: '#fff',
                  cursor: 'pointer',
                }}
              >
                Copy link
              </button>
            </div>

            <p style={{ fontSize: 11, color: 'var(--label-color)' }}>
              Expires in 24 hours
            </p>
          </div>
        </div>

        {/* ── Section 2: Other ways to share ──────────────────────────────── */}
        <div className="hie-section" style={{ marginBottom: 12 }}>
          <div className="hie-section-header">
            <h2 className="hie-section-title">Other ways to share</h2>
          </div>

          {([
            {
              icon: '📋',
              title: 'Copy to clipboard',
              desc: 'Paste into any online intake form',
              onClick: handleCopyClipboard,
            },
            {
              icon: '🖨️',
              title: 'Print summary',
              desc: 'One-page formatted printout',
              onClick: () => {
                usePatientStore.getState().appendLog(
                  createLogEntry('print', 'Print summary', currentToken?.token ?? null)
                );
                window.print();
              },
            },
            {
              icon: '🔗',
              title: 'Send secure link',
              desc: 'Time-limited read-only URL',
              onClick: handleSendLink,
            },
          ] as const).map(({ icon, title, desc, onClick }, i, arr) => (
            <button
              key={title}
              onClick={onClick}
              className="flex items-center gap-3 w-full text-left"
              style={{
                padding: '13px 16px',
                borderBottom: i < arr.length - 1 ? '1px solid var(--ice-divider)' : 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-dark)' }}>
                  {title}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{desc}</div>
              </div>
              <span style={{ color: 'var(--label-color)', fontSize: 16 }}>›</span>
            </button>
          ))}
        </div>

        {/* ── Section 3: Access log ────────────────────────────────────────── */}
        <div className="hie-section">
          {/* div instead of button to allow the nested "Clear log" button */}
          <div
            onClick={() => setLogOpen((o) => !o)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setLogOpen((o) => !o)}
            className="hie-section-header w-full text-left"
            style={{ background: 'transparent', cursor: 'pointer' }}
          >
            <h2 className="hie-section-title">Access log</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    background: 'var(--ice)',
                    color: 'var(--muted)',
                    border: '1.5px solid var(--ice-border)',
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                  }}
                >
                  {log.length} events
                </span>
                {log.length > 0 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); clearLog(); }}
                    style={{
                      fontSize: 11, fontWeight: 600,
                      padding: '3px 9px', borderRadius: 6,
                      border: '1.5px solid var(--ice-border)',
                      background: 'var(--ice)', color: 'var(--muted)',
                      cursor: 'pointer',
                    }}
                  >
                    Clear log
                  </button>
                )}
                <span style={{ color: 'var(--label-color)', fontSize: 14 }}>
                  {logOpen ? '▲' : '▼'}
                </span>
              </div>
            </div>
          </div>

          {logOpen && log.length === 0 ? (
            <p
              className="text-sm italic"
              style={{
                color: 'var(--label-color)',
                padding: '20px 16px',
                textAlign: 'center',
              }}
            >
              No sharing activity yet.
            </p>
          ) : logOpen ? (
            log.map((entry, index) => {
              const badge = METHOD_BADGE[entry.method];
              // An entry is considered revoked if its own flag is set, or if its
              // associated token has been deactivated in the shareTokens map.
              const tokenRevoked =
                entry.token != null
                  ? shareTokens[entry.token]?.active === false
                  : false;
              const isRevoked = entry.revoked || tokenRevoked;

              return (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '11px 16px',
                    borderBottom:
                      index < log.length - 1
                        ? '1px solid var(--ice-divider)'
                        : 'none',
                    opacity: isRevoked ? 0.45 : 1,
                  }}
                >
                  {/* Status dot */}
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: isRevoked ? '#CBD5E1' : 'var(--cyan)',
                    }}
                  />

                  {/* Label + timestamp */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13, fontWeight: 600,
                        color: 'var(--text-dark)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}
                    >
                      {entry.label}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {formatTimestamp(entry.timestamp)}
                    </div>
                  </div>

                  {/* Method badge */}
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 8,
                      background: badge.bg, color: badge.color,
                      flexShrink: 0,
                    }}
                  >
                    {badge.label}
                  </span>

                  {/* Revoke / Revoked — only applicable to link and QR tokens */}
                  {(entry.method === 'link' || entry.method === 'qr') && (
                    isRevoked ? (
                      <span
                        style={{
                          fontSize: 11, fontWeight: 600,
                          color: 'var(--label-color)',
                          flexShrink: 0,
                        }}
                      >
                        Revoked
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (entry.token) usePatientStore.getState().revokeShareToken(entry.token);
                        }}
                        style={{
                          fontSize: 11, fontWeight: 600,
                          padding: '3px 9px', borderRadius: 6,
                          border: '1.5px solid #FFCDD2', background: '#FFF5F5',
                          color: '#C62828', cursor: 'pointer', flexShrink: 0,
                        }}
                      >
                        Revoke
                      </button>
                    )
                  )}
                </div>
              );
            })
          ) : null}
        </div>

      </div>
    </>
  );
}
