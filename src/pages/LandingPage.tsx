import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { usePatientStore } from '../core/store';
import { storage } from '../core/storage';

// ── Design constants ────────────────────────────────────────────────────────
const TAB_H   = 15;   // px — tab protrudes this far above the folder body
const TAB_W   = 102;  // px — fixed width so all tabs are identical
const NAVY    = '#1A2E72';

interface Section {
  to: string;
  tabLabel: string;
  icon: string;
  label: string;
  desc: string;
  accent: string;
  accentBg: string;
  accentBdr: string;
}

const OVERVIEW: Section = {
  to:         '/overview',
  tabLabel:   'Start here',
  icon:       '🩺',
  label:      'Overview',
  desc:       'Your health summary at a glance',
  accent:     NAVY,
  accentBg:   '#E8EEFA',
  accentBdr:  '#D0DCF7',
};

const GRID_SECTIONS: Section[] = [
  {
    to: '/profile',   tabLabel: 'Personal',     icon: '👤',
    label: 'Profile',      desc: 'Details, contacts & allergies',
    accent: '#0DB5C5',  accentBg: '#E0F9FC', accentBdr: '#B2EFF7',
  },
  {
    to: '/medications', tabLabel: 'Rx',           icon: '💊',
    label: 'Medications',  desc: 'Dosage & reminders',
    accent: '#10B981',  accentBg: '#D1FAE5', accentBdr: '#A7F3D0',
  },
  {
    to: '/vaccinations', tabLabel: 'Immunization', icon: '💉',
    label: 'Vaccines',     desc: 'Vaccination history',
    accent: '#1565C0',  accentBg: '#E3F2FD', accentBdr: '#90CAF9',
  },
  {
    to: '/procedures',  tabLabel: 'History',      icon: '🔬',
    label: 'Procedures',   desc: 'Surgeries & treatments',
    accent: '#6A1B9A',  accentBg: '#F3E5F5', accentBdr: '#CE93D8',
  },
  {
    to: '/insurance',   tabLabel: 'Coverage',     icon: '🪪',
    label: 'Insurance',    desc: 'Primary & secondary plans',
    accent: '#B7860B',  accentBg: '#FFF8E1', accentBdr: '#FFE082',
  },
  {
    to: '/share',       tabLabel: 'Access',       icon: '📤',
    label: 'Share',        desc: 'QR codes & provider access',
    accent: '#0891A8',  accentBg: '#E0FEFF', accentBdr: '#A5F3FC',
  },
];

// ── Shared sub-components ───────────────────────────────────────────────────

function Tab({ s }: { s: Section }) {
  return (
    <div style={{
      position: 'absolute',
      top: -TAB_H,
      left: 0,
      width: TAB_W,
      height: TAB_H + 2,
      padding: '0 10px',
      borderRadius: '5px 5px 0 0',
      border: `1.5px solid ${s.accentBdr}`,
      borderBottom: 'none',
      background: s.accentBg,
      display: 'flex',
      alignItems: 'center',
    }}>
      <span style={{
        fontFamily: "'Sora', system-ui, sans-serif",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: s.accent,
      }}>
        {s.tabLabel}
      </span>
    </div>
  );
}

// ── Overview folder (full-width, logo pinned top-right) ─────────────────────
function OverviewFolder({ s }: { s: Section }) {
  return (
    <div style={{ paddingTop: TAB_H, marginBottom: 18 }}>
      <Link to={s.to} style={{ textDecoration: 'none', display: 'block', position: 'relative' }}>
        <Tab s={s} />
        <div
          style={{
            position: 'relative',
            background: 'white',
            border: `1.5px solid ${s.accentBdr}`,
            borderRadius: '0 8px 8px 8px',
            padding: '18px 150px 18px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            transition: 'box-shadow 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 18px rgba(0,0,0,0.22)';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            (e.currentTarget as HTMLDivElement).style.transform = 'none';
          }}
        >
          {/* Icon + label row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: s.accentBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <p style={{
              margin: 0,
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontWeight: 700, fontSize: 17, color: s.accent,
            }}>
              {s.label}
            </p>
          </div>
          {/* Description */}
          <p style={{ margin: 0, fontSize: 12, color: 'var(--muted)', fontWeight: 400, lineHeight: 1.45 }}>
            {s.desc}
          </p>
          {/* Logo pinned to right, vertically centred */}
          <img
            src="/HealthPass.svg"
            alt=""
            style={{
              position: 'absolute',
              top: '50%',
              right: 14,
              transform: 'translateY(-50%)',
              height: 106,
              width: 'auto',
              pointerEvents: 'none',
            }}
          />
        </div>
      </Link>
    </div>
  );
}

// ── Grid folder (equal-height, icon+label row then description) ─────────────
function GridFolder({ s }: { s: Section }) {
  return (
    <div style={{ paddingTop: TAB_H, display: 'flex', flexDirection: 'column' }}>
      <Link
        to={s.to}
        style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}
      >
        <Tab s={s} />
        <div
          style={{
            flex: 1,
            background: 'white',
            border: `1.5px solid ${s.accentBdr}`,
            borderRadius: '0 8px 8px 8px',
            padding: '18px 14px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            transition: 'box-shadow 0.15s ease, transform 0.15s ease',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 18px rgba(0,0,0,0.22)';
            (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
            (e.currentTarget as HTMLDivElement).style.transform = 'none';
          }}
        >
          {/* Icon + label row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: s.accentBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18, flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <p style={{
              margin: 0,
              fontFamily: "'Libre Baskerville', Georgia, serif",
              fontWeight: 700, fontSize: 13, color: s.accent,
            }}>
              {s.label}
            </p>
          </div>
          {/* Description */}
          <p style={{ margin: 0, fontSize: 10.5, color: 'var(--muted)', fontWeight: 400, lineHeight: 1.45 }}>
            {s.desc}
          </p>
        </div>
      </Link>
    </div>
  );
}

// ── Disclaimer modal ────────────────────────────────────────────────────────
function DisclaimerModal({ onClose }: { onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 14,
        maxWidth: 360,
        width: '100%',
        padding: '28px 24px 24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 24 }}>⚠️</span>
          <p style={{
            margin: 0,
            fontFamily: "'Libre Baskerville', Georgia, serif",
            fontWeight: 700, fontSize: 16, color: '#92400E',
          }}>
            Demo prototype
          </p>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#374151', lineHeight: 1.65 }}>
          This is a prototype for demo purposes only. Please{' '}
          <strong>do not enter real medical information</strong> — no data is
          encrypted or securely stored.
        </p>
        <button
          onClick={onClose}
          style={{
            width: '100%',
            background: '#D97706',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '11px 0',
            fontFamily: "'Sora', sans-serif",
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          I understand — continue
        </button>
      </div>
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const personal = usePatientStore(s => s.record.personal);
  const fullName = [personal.firstName, personal.lastName].filter(Boolean).join(' ') || 'Your Name';

  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    if (!storage.loadDisclaimerAck()) setShowModal(true);
  }, []);

  function handleAcknowledge() {
    storage.saveDisclaimerAck();
    setShowModal(false);
  }

  return (
    <>
    {showModal && <DisclaimerModal onClose={handleAcknowledge} />}
    <div style={{ minHeight: '100vh', background: '#E8EDF8' }}>
      <div style={{
        margin: '0 auto',
        width: '100%', maxWidth: 480, minHeight: '100vh',
        background: NAVY,
        borderRadius: 20,
        border: '1.5px solid var(--ice-border)',
      }}>

        {/* ── Top strip ─────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px' }}>
          <span style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            fontWeight: 700, fontSize: 16, color: 'white',
          }}>
            {fullName}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{
              background: 'none',
              border: '1.5px solid rgba(255,255,255,0.22)',
              color: 'rgba(255,255,255,0.8)',
              padding: '5px 13px', borderRadius: 7,
              fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
              cursor: 'default', opacity: 0.6,
            }}>
              Settings
            </button>
            <button style={{
              background: 'var(--cyan-bright)',
              border: 'none',
              color: NAVY,
              padding: '6px 14px', borderRadius: 7,
              fontFamily: "'Sora', sans-serif", fontSize: 11, fontWeight: 700,
              cursor: 'default', opacity: 0.6,
            }}>
              Sign out
            </button>
          </div>
        </div>

        {/* ── Hero pitch ────────────────────────────────── */}
        <div style={{ padding: '28px 20px 32px', textAlign: 'center' }}>
          <p style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            fontWeight: 700, fontSize: 34, letterSpacing: '-0.02em', marginBottom: 10,
          }}>
            <span style={{ color: '#D4A017' }}>Health</span>
            <span style={{ color: '#11E0F4' }}>Pass</span>
          </p>
          <h1 style={{
            fontFamily: "'Libre Baskerville', Georgia, serif",
            fontSize: 28, fontWeight: 700, lineHeight: 1.2,
            letterSpacing: '-0.02em', color: '#fff', marginBottom: 14,
          }}>
            Your health story,<br />
            <em style={{ fontStyle: 'italic', color: 'var(--cyan-light)' }}>in your hands</em>
          </h1>
          <p style={{ fontSize: 13, fontWeight: 400, color: 'var(--muted)', lineHeight: 1.65, padding: '0 4px' }}>
            Keep your medical information organized, up to date,
            and ready to share with your care team whenever you need it.
          </p>
        </div>

        {/* ── Folder navigation ─────────────────────────── */}
        <div style={{ padding: '28px 18px 36px' }}>
          <span style={{
            display: 'block',
            textTransform: 'uppercase', fontWeight: 800, fontSize: 11,
            letterSpacing: '0.12em', color: 'var(--muted)',
            marginBottom: 20, paddingLeft: 2,
          }}>
            Where would you like to go?
          </span>

          {/* Overview — full width */}
          <OverviewFolder s={OVERVIEW} />

          {/* 6 equal-height grid folders */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridAutoRows: '1fr',
            gap: 14,
          }}>
            {GRID_SECTIONS.map(s => <GridFolder key={s.to} s={s} />)}
          </div>
        </div>

        {/* ── Disclaimer ────────────────────────────────── */}
        <div style={{ padding: '0 18px 28px' }}>
          <div style={{
            background: '#FEF3C7',
            border: '1.5px solid #FCD34D',
            borderRadius: 10,
            padding: '12px 14px',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0 }}>⚠️</span>
            <p style={{ margin: 0, fontSize: 11.5, color: '#78350F', lineHeight: 1.6 }}>
              <strong>Demo prototype.</strong> This is for demo purposes only.
              Please do not enter real medical information.
            </p>
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
