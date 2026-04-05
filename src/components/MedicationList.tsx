import { useState, Fragment } from 'react';
import { usePatientStore } from '../core/store';
import { newMedication } from '../core/schema';
import type { Medication } from '../core/types';

// ── Frequency parser ───────────────────────────────────────────────────────
type FreqSchedule =
  | { type: 'prn' }
  | { type: 'weekly'; count: number }
  | { type: 'daily'; count: number };

function parseFrequency(freq: string): FreqSchedule {
  if (!freq) return { type: 'daily', count: 1 };
  const f = freq.toLowerCase();
  if (/as needed|prn|when needed|if needed/.test(f)) return { type: 'prn' };
  if (/week/.test(f)) {
    if (/twice|2[\s-]?x|2 times/.test(f)) return { type: 'weekly', count: 2 };
    if (/three|3[\s-]?x|3 times/.test(f)) return { type: 'weekly', count: 3 };
    return { type: 'weekly', count: 1 };
  }
  if (/once|1[\s-]?x|1 time/.test(f))    return { type: 'daily', count: 1 };
  if (/twice|2[\s-]?x|2 times/.test(f))  return { type: 'daily', count: 2 };
  if (/three|3[\s-]?x|3 times/.test(f))  return { type: 'daily', count: 3 };
  if (/four|4[\s-]?x|4 times/.test(f))   return { type: 'daily', count: 4 };
  const m = f.match(/(\d+)\s*(?:times?|x)/);
  if (m) return { type: 'daily', count: parseInt(m[1], 10) };
  return { type: 'daily', count: 1 };
}

type TodayState = 'taken' | 'due' | 'missed';
type MissedEntry = { id: string; doseKey: string; medName: string; scheduledTime: string | null; missedAt: string };
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtTime(str: string): string {
  if (!str) return '';
  const [h, m] = str.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function fmtDate(str: string): string {
  if (!str) return '';
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

type Dose = { med: Medication; index: number; time: string | null; key: string };

function isDoseUpcoming(time: string | null): boolean {
  if (!time) return false;
  const [h, m] = time.split(':').map(Number);
  const scheduled = new Date();
  scheduled.setHours(h, m, 0, 0);
  return scheduled > new Date();
}

function getDosesForToday(med: Medication): Dose[] {
  const sched = parseFrequency(med.frequency);
  if (sched.type === 'weekly') {
    const days = med.reminderDays ?? [];
    const todayDow = String(new Date().getDay()); // '0'=Sun … '6'=Sat
    if (days.length > 0 && !days.includes(todayDow)) return [];
  }
  const times = med.reminderTimes ?? [];
  // For daily meds, cap to the parsed count so stale extra slots
  // from a previous higher frequency don't keep appearing.
  const effectiveTimes = sched.type === 'daily' ? times.slice(0, sched.count) : times;
  if (effectiveTimes.length === 0) return [{ med, index: 0, time: null, key: `${med.id}-0` }];
  return effectiveTimes.map((time, i) => ({ med, index: i, time, key: `${med.id}-${i}` }));
}

function getDoseLabel(index: number, totalDoses: number): string {
  if (totalDoses <= 1) return '';
  if (totalDoses === 2) return (['Morning', 'Evening'] as const)[index] ?? `Dose ${index + 1}`;
  if (totalDoses === 3) return (['Morning', 'Afternoon', 'Evening'] as const)[index] ?? `Dose ${index + 1}`;
  return `Dose ${index + 1}`;
}


// Persists collapsed state across navigation (survives component unmount)
let savedCollapsedIds = new Set<string>();

// ── Status dot ─────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: Medication['status'] }) {
  const bg =
    status === 'active' ? '#10B981' :
    status === 'prn'    ? '#F59E0B' : 'var(--muted)';
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7,
      borderRadius: '50%', flexShrink: 0, backgroundColor: bg,
    }} />
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Medication['status'] }) {
  const map: Record<Medication['status'], { bg: string; color: string; border: string; label: string }> = {
    active: { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7',       label: 'Active' },
    past:   { bg: 'var(--ice)', color: 'var(--label-color)', border: 'var(--ice-border)', label: 'Past' },
    prn:    { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D',       label: 'PRN'    },
  };
  const s = map[status];
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
      padding: '2px 8px', borderRadius: 8, display: 'inline-block',
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function MedicationList() {
  const medications      = usePatientStore((s) => s.record.medications);
  const addMedication    = usePatientStore((s) => s.addMedication);
  const updateMedication = usePatientStore((s) => s.updateMedication);
  const removeMedication = usePatientStore((s) => s.removeMedication);

  const [view, setView]               = useState<'today' | 'list'>('today');
  // collapsedIds: ids of items that are COLLAPSED; default = all expanded
  const [collapsedIds, setCollapsed]  = useState<Set<string>>(() => new Set(savedCollapsedIds));
  const [expandedTodayId, setTodayId] = useState<string | null>(null);
  const [todayStates, setTodayStates] = useState<Record<string, TodayState>>({});
  const [showPast, setShowPast]           = useState(false);
  const [alertMedId, setAlertMedId]       = useState<string | null>(null);
  const [missedLog, setMissedLog]         = useState<MissedEntry[]>([]);
  const [showMissedLog, setShowMissedLog] = useState(false);

  const todayStr    = new Date().toISOString().split('T')[0];
  const activeMeds  = medications.filter(m => m.status !== 'past');
  const pastMeds    = medications.filter(m => m.status === 'past');
  const remindedMeds = activeMeds.filter(m => m.reminder ?? false);
  const expiredMeds  = activeMeds.filter(m => m.endDate && m.endDate < todayStr);

  function getTodayState(key: string): TodayState {
    return todayStates[key] ?? 'due';
  }

  const allDoses     = remindedMeds.flatMap(getDosesForToday);
  const currentDoses = allDoses.filter(d => !isDoseUpcoming(d.time));
  const taken   = currentDoses.filter(d => getTodayState(d.key) === 'taken').length;
  const total   = currentDoses.length;
  const dosePct = total ? Math.round((taken / total) * 100) : 0;
  const dueMed  = currentDoses.find(d => getTodayState(d.key) === 'due')?.med;

  function toggleCollapsed(id: string) {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      savedCollapsedIds = next;
      return next;
    });
  }

  function markTaken(id: string) {
    setTodayStates(prev => ({ ...prev, [id]: 'taken' }));
    setTodayId(null);
  }

  function markMissed(key: string) {
    setTodayStates(prev => ({ ...prev, [key]: 'missed' }));
    const dose = allDoses.find(d => d.key === key);
    if (dose) {
      setMissedLog(prev => [...prev, {
        id: `${key}-${Date.now()}`,
        doseKey: key,
        medName: dose.med.name || 'Unnamed',
        scheduledTime: dose.time,
        missedAt: new Date().toISOString(),
      }]);
    }
  }

  function deleteMissedEntry(entryId: string) {
    const entry = missedLog.find(e => e.id === entryId);
    if (entry) setTodayStates(prev => ({ ...prev, [entry.doseKey]: 'due' }));
    setMissedLog(prev => prev.filter(e => e.id !== entryId));
  }

  function undoTaken(id: string) {
    setTodayStates(prev => ({ ...prev, [id]: 'due' }));
  }

  function handleStatusChange(id: string, newStatus: Medication['status']) {
    const med = medications.find(m => m.id === id);
    if (!med) return;
    if (newStatus === 'past' && !med.endDate) {
      updateMedication(id, { status: newStatus, endDate: todayStr });
    } else {
      updateMedication(id, { status: newStatus });
    }
  }

  function setReminderTime(id: string, index: number, value: string) {
    const med = medications.find(m => m.id === id);
    if (!med) return;
    const times = [...(med.reminderTimes ?? [])];
    times[index] = value;
    updateMedication(id, { reminderTimes: times });
  }

  function toggleReminderDay(id: string, dayStr: string) {
    const med = medications.find(m => m.id === id);
    if (!med) return;
    const days = med.reminderDays ?? [];
    const next = days.includes(dayStr)
      ? days.filter(d => d !== dayStr)
      : [...days, dayStr];
    updateMedication(id, { reminderDays: next });
  }

  function renderReminderFields(med: Medication) {
    const sched = parseFrequency(med.frequency);
    if (sched.type === 'prn') {
      return (
        <p style={{ fontSize: 12, color: 'var(--label-color)', fontStyle: 'italic', margin: 0 }}>
          Reminders are not available for as-needed medications.
        </p>
      );
    }
    if (sched.type === 'weekly') {
      const selectedDays = med.reminderDays ?? [];
      return (
        <>
          <div style={{ marginBottom: 8 }}>
            <span className="hie-label" style={{ display: 'block', marginBottom: 6 }}>Day of week</span>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {DAYS.map((d, i) => {
                const sel = selectedDays.includes(String(i));
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleReminderDay(med.id, String(i))}
                    style={{
                      width: 36, height: 36, borderRadius: '50%',
                      border: `1.5px solid ${sel ? 'var(--cyan)' : 'var(--ice-border)'}`,
                      background: sel ? 'var(--cyan)' : 'var(--ice)',
                      color: sel ? '#fff' : 'var(--label-color)',
                      fontSize: 11, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label htmlFor={`medReminderTime-${med.id}-0`} className="hie-label" style={{ minWidth: 56, marginBottom: 0 }}>
              Time
            </label>
            <input
              id={`medReminderTime-${med.id}-0`}
              type="time"
              value={(med.reminderTimes ?? [])[0] ?? ''}
              onChange={e => setReminderTime(med.id, 0, e.target.value)}
              className="hie-input"
            />
          </div>
        </>
      );
    }
    // Daily — one time slot per dose
    const count = Math.max(1, sched.count);
    const labels =
      count === 1 ? ['Time'] :
      count === 2 ? ['Morning', 'Evening'] :
      count === 3 ? ['Morning', 'Afternoon', 'Evening'] :
      Array.from({ length: count }, (_, i) => `Dose ${i + 1}`);
    return (
      <>
        {labels.map((lbl, i) => (
          <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < labels.length - 1 ? 8 : 0 }}>
            <label htmlFor={`medReminderTime-${med.id}-${i}`} className="hie-label" style={{ minWidth: 56, marginBottom: 0 }}>
              {lbl}
            </label>
            <input
              id={`medReminderTime-${med.id}-${i}`}
              type="time"
              value={(med.reminderTimes ?? [])[i] ?? ''}
              onChange={e => setReminderTime(med.id, i, e.target.value)}
              className="hie-input"
            />
          </div>
        ))}
      </>
    );
  }

  // ── TODAY VIEW ──────────────────────────────────────────────────────────────
  function renderTodayView() {
    const adherence =
      dosePct >= 80 ? { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7', label: 'On track' } :
      dosePct >= 50 ? { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', label: 'Needs attention' } :
                      { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', label: 'Off track' };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14, paddingBottom: 24 }}>

        {/* Dose alert banner — shown when a reminder med is 'due' */}
        {dueMed && (
          <div style={{ background: '#FEF3C7', border: '1.5px solid #F59E0B', borderRadius: 12, overflow: 'hidden' }}>
            <button
              onClick={() => setAlertMedId(id => id === dueMed.id ? null : dueMed.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '11px 14px', background: 'none', border: 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>
                💊 {dueMed.name || 'Unnamed'} due now — tap for details
              </span>
              <span style={{
                fontSize: 10, color: '#92400E', transition: 'transform 0.25s',
                transform: alertMedId === dueMed.id ? 'rotate(180deg)' : 'none',
              }}>▾</span>
            </button>
            {alertMedId === dueMed.id && (
              <div style={{ padding: '10px 14px 12px', borderTop: '1px solid #FDE68A', background: '#FFFBEA', fontSize: 12, color: '#78540A' }}>
                <p>
                  <strong>Dose:</strong> {dueMed.dosage || '—'}
                  {(dueMed.notes ?? '') ? ' · ' + dueMed.notes : ''}
                </p>
                {(dueMed.reminderTimes ?? [])[0] && (
                  <p style={{ marginTop: 4 }}>
                    Scheduled at {fmtTime((dueMed.reminderTimes ?? [])[0])} · tap below to mark taken
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Adherence card */}
        <div className="hie-section">
          <div className="hie-section-header">
            <h2 className="hie-section-title">Today</h2>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
              background: adherence.bg, color: adherence.color, border: `1.5px solid ${adherence.border}`,
            }}>
              {adherence.label}
            </span>
          </div>
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
              <span style={{ fontSize: 12, color: 'var(--label-color)', minWidth: 88, fontWeight: 600 }}>
                Doses taken
              </span>
              <div style={{ flex: 1, background: 'var(--ice-divider)', borderRadius: 100, height: 6 }}>
                <div style={{
                  height: 6, borderRadius: 100, background: '#10B981',
                  width: `${dosePct}%`, transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)', minWidth: 34, textAlign: 'right' }}>
                {dosePct}%
              </span>
            </div>
            <p style={{
              fontSize: 12, color: 'var(--label-color)', marginTop: 10,
              paddingTop: 10, borderTop: '1px solid var(--ice-divider)', fontStyle: 'italic',
            }}>
              {total > 0
                ? `${taken} of ${total} reminders taken today · ${dosePct}% today 🎉`
                : 'No reminders set. Enable them in My List.'}
            </p>
          </div>
        </div>

        {/* Today's medications */}
        <div className="hie-section">
          <div className="hie-section-header">
            <h2 className="hie-section-title">Today's medications</h2>
            <span style={{
              background: 'var(--ice)', color: 'var(--navy)',
              border: '1.5px solid var(--ice-border)',
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
            }}>
              {activeMeds.length} active
            </span>
          </div>

          {allDoses.length === 0 ? (
            <p className="text-sm italic" style={{ color: 'var(--label-color)', padding: '14px 16px' }}>
              No reminders set. Enable reminders in My List to track doses here.
            </p>
          ) : (
            allDoses.map(dose => {
              const { med } = dose;
              const totalDoses   = (med.reminderTimes ?? []).length || 1;
              const doseLabel    = getDoseLabel(dose.index, totalDoses);
              const userState  = getTodayState(dose.key);
              const state      = userState === 'taken' ? 'taken' : isDoseUpcoming(dose.time) ? 'upcoming' : userState;
              const isTaken    = state === 'taken';
              const isExpanded = expandedTodayId === dose.key;
              const ss =
                state === 'taken'    ? { bg: '#E8F5E9', color: '#2E7D32', border: '#A5D6A7', label: 'Taken ✓' } :
                state === 'upcoming' ? { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: fmtTime(dose.time ?? '') } :
                state === 'due'      ? { bg: '#FEF3C7', color: '#92400E', border: '#FCD34D', label: 'Due now' } :
                                       { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', label: 'Missed' };
              return (
                <div key={dose.key}>
                  <button
                    onClick={() => setTodayId(isExpanded ? null : dose.key)}
                    style={{
                      display: 'flex', alignItems: 'center', width: '100%',
                      padding: '13px 16px', gap: 12, textAlign: 'left',
                      background: isTaken ? '#F0FDF4' : '#fff',
                      opacity: isTaken ? 0.75 : 1,
                      border: 'none', cursor: 'pointer',
                      borderBottom: '1px solid var(--ice-divider)',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)' }}>
                        💊 {med.name || 'Unnamed'}{doseLabel ? ` · ${doseLabel}` : ''}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--label-color)', marginTop: 2, fontWeight: 600 }}>
                        {[med.dosage, med.frequency].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                      {dose.time && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)' }}>
                          {fmtTime(dose.time)}
                        </span>
                      )}
                      <span style={{
                        padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                        border: `1.5px solid ${ss.border}`, whiteSpace: 'nowrap',
                        background: ss.bg, color: ss.color,
                      }}>
                        {ss.label}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 10, color: 'var(--muted)', transition: 'transform 0.25s',
                      transform: isExpanded ? 'rotate(180deg)' : 'none',
                    }}>▾</span>
                  </button>

                  {isExpanded && (
                    <div style={{
                      padding: '12px 16px 14px',
                      borderTop: '1px solid var(--ice-divider)',
                      background: 'var(--ice)',
                    }}>
                      {med.prescribingProvider && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--label-color)', padding: '2px 0', fontWeight: 600 }}>
                          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--muted)', flexShrink: 0, display: 'inline-block' }} />
                          Prescribed by {med.prescribingProvider}
                        </div>
                      )}
                      {med.startDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--label-color)', padding: '2px 0', fontWeight: 600 }}>
                          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--muted)', flexShrink: 0, display: 'inline-block' }} />
                          Since {fmtDate(med.startDate)}
                        </div>
                      )}
                      {(med.notes ?? '') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--label-color)', padding: '2px 0', fontWeight: 600 }}>
                          <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--muted)', flexShrink: 0, display: 'inline-block' }} />
                          {med.notes}
                        </div>
                      )}
                      {(med.patientNotes ?? '') && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#92400E', padding: '2px 0', fontStyle: 'italic', fontWeight: 600, marginTop: 4 }}>
                          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#FCD34D', flexShrink: 0, display: 'inline-block' }} />
                          {med.patientNotes}
                        </div>
                      )}
                      {state === 'taken' ? (
                        <>
                          <button disabled style={{
                            marginTop: 10, width: '100%', padding: 8, fontSize: 12, fontWeight: 700,
                            borderRadius: 8, border: '1.5px solid #A5D6A7',
                            background: '#E8F5E9', color: '#2E7D32', cursor: 'default', opacity: 0.7,
                          }}>
                            Taken ✓
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); undoTaken(dose.key); }}
                            style={{
                              marginTop: 6, width: '100%', padding: 8, fontSize: 11, fontWeight: 700,
                              borderRadius: 8, border: '1.5px solid var(--ice-border)',
                              background: 'var(--ice)', color: 'var(--label-color)', cursor: 'pointer',
                            }}
                          >
                            ↩ Undo — mark as due
                          </button>
                        </>
                      ) : state === 'missed' ? (
                        <>
                          <button disabled style={{
                            marginTop: 10,
                            width: '100%', padding: 8, fontSize: 12, fontWeight: 700,
                            borderRadius: 8, border: '1.5px solid #FCA5A5',
                            background: '#FEE2E2', color: '#991B1B', cursor: 'default', opacity: 0.7,
                          }}>
                            Missed
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); markTaken(dose.key); }}
                            style={{
                              marginTop: 6, width: '100%', padding: 8, fontSize: 11, fontWeight: 700,
                              borderRadius: 8, border: '1.5px solid #A5D6A7',
                              background: '#E8F5E9', color: '#2E7D32', cursor: 'pointer',
                            }}
                          >
                            Mark as taken anyway
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); undoTaken(dose.key); }}
                            style={{
                              marginTop: 6, width: '100%', padding: 8, fontSize: 11, fontWeight: 700,
                              borderRadius: 8, border: '1.5px solid var(--ice-border)',
                              background: 'var(--ice)', color: 'var(--label-color)', cursor: 'pointer',
                            }}
                          >
                            ↩ Undo — mark as due
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={e => { e.stopPropagation(); markTaken(dose.key); }}
                            style={{
                              marginTop: 10, width: '100%', padding: 8, fontSize: 12, fontWeight: 700,
                              borderRadius: 8, border: '1.5px solid #A5D6A7',
                              background: '#E8F5E9', color: '#2E7D32', cursor: 'pointer',
                            }}
                          >
                            Mark as taken
                          </button>
                          {!isDoseUpcoming(dose.time) && (
                            <button
                              onClick={e => { e.stopPropagation(); markMissed(dose.key); }}
                              style={{
                                marginTop: 6, width: '100%', padding: 8, fontSize: 11, fontWeight: 700,
                                borderRadius: 8, border: '1.5px solid #FCA5A5',
                                background: '#FEE2E2', color: '#991B1B', cursor: 'pointer',
                              }}
                            >
                              Mark as missed
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Missed doses log */}
        {missedLog.length > 0 && (
          <>
            <button
              onClick={() => setShowMissedLog(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '12px 16px', cursor: 'pointer',
                background: '#fff', borderRadius: 12, border: '1.5px solid #FCA5A5',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>
                {showMissedLog ? '▾ Hide missed doses' : `▸ Missed doses (${missedLog.length})`}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                background: '#FEE2E2', color: '#991B1B', border: '1.5px solid #FCA5A5',
              }}>
                {missedLog.length} missed
              </span>
            </button>
            {showMissedLog && (
              <div className="hie-section">
                {missedLog.map(entry => (
                  <div key={entry.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px', borderTop: '1px solid var(--ice-divider)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>
                        {entry.medName}
                        {entry.scheduledTime && (
                          <span style={{ fontWeight: 400, color: 'var(--label-color)', marginLeft: 6, fontSize: 12 }}>
                            · {fmtTime(entry.scheduledTime)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--label-color)', marginTop: 2, fontWeight: 600 }}>
                        Missed at {fmtDateTime(entry.missedAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteMissedEntry(entry.id)}
                      aria-label="Delete missed entry"
                      style={{
                        background: 'none', border: 'none', fontSize: 18, fontWeight: 700,
                        color: 'var(--label-color)', cursor: 'pointer', lineHeight: 1, padding: '0 2px', flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }


  // ── MY LIST VIEW ────────────────────────────────────────────────────────────
  function renderMedItem(med: Medication) {
    const isExpanded = !collapsedIds.has(med.id);
    return (
      <div style={{ borderTop: '2px solid var(--ice-border)' }}>

        {/* Collapsible header — div not button to allow nested Delete button */}
        <div
          onClick={() => toggleCollapsed(med.id)}
          role="button"
          tabIndex={0}
          onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleCollapsed(med.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, width: '100%',
            padding: '11px 16px', background: 'var(--ice)',
            borderBottom: '1px solid var(--ice-divider)',
            cursor: 'pointer', userSelect: 'none',
          }}
        >
          <StatusDot status={med.status} />
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 13, fontWeight: 700, color: 'var(--navy)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {med.name || <span style={{ color: 'var(--muted)', fontWeight: 400, fontStyle: 'italic' }}>Unnamed</span>}
            </span>
            {(med.dosage || med.frequency) && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--label-color)',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1,
              }}>
                {[med.dosage, med.frequency].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <StatusBadge status={med.status} />
            <span style={{
              fontSize: 10, color: 'var(--muted)', transition: 'transform 0.22s',
              transform: isExpanded ? 'rotate(180deg)' : 'none',
            }}>▾</span>
            <button
              aria-label="Delete"
              onClick={e => { e.stopPropagation(); removeMedication(med.id); }}
              style={{
                background: 'none', border: 'none', fontWeight: 700, fontSize: 20,
                color: 'var(--label-color)', cursor: 'pointer', lineHeight: 1, padding: '0 2px',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Expanded fields */}
        {isExpanded && (
          <div className="grid grid-cols-2">

            <div className="hie-field-left">
              <label htmlFor={`medName-${med.id}`} className="hie-label">Medication Name</label>
              <input id={`medName-${med.id}`} type="text" value={med.name}
                onChange={e => updateMedication(med.id, { name: e.target.value })}
                className="hie-input" placeholder="e.g. Lisinopril" />
            </div>

            <div className="hie-field">
              <label htmlFor={`medDosage-${med.id}`} className="hie-label">Dosage</label>
              <input id={`medDosage-${med.id}`} type="text" value={med.dosage}
                onChange={e => updateMedication(med.id, { dosage: e.target.value })}
                className="hie-input" placeholder="e.g. 10mg" />
            </div>

            <div className="hie-field-left">
              <label htmlFor={`medFrequency-${med.id}`} className="hie-label">Frequency</label>
              <input id={`medFrequency-${med.id}`} type="text" value={med.frequency}
                onChange={e => updateMedication(med.id, { frequency: e.target.value })}
                className="hie-input" placeholder="e.g. Once daily" />
            </div>

            <div className="hie-field">
              <label htmlFor={`medProvider-${med.id}`} className="hie-label">Prescribing Provider</label>
              <input id={`medProvider-${med.id}`} type="text" value={med.prescribingProvider}
                onChange={e => updateMedication(med.id, { prescribingProvider: e.target.value })}
                className="hie-input" placeholder="e.g. Dr. Smith" />
            </div>

            <div className="hie-field-left">
              <label htmlFor={`medStartDate-${med.id}`} className="hie-label">Start Date</label>
              <input id={`medStartDate-${med.id}`} type="date" value={med.startDate}
                onChange={e => updateMedication(med.id, { startDate: e.target.value })}
                className="hie-input" />
            </div>

            <div className="hie-field">
              <label htmlFor={`medEndDate-${med.id}`} className="hie-label">End Date (blank = active)</label>
              <input id={`medEndDate-${med.id}`} type="date" value={med.endDate ?? ''}
                onChange={e => updateMedication(med.id, { endDate: e.target.value || null })}
                className="hie-input" />
            </div>

            <div className="hie-field-left">
              <label htmlFor={`medStatus-${med.id}`} className="hie-label">Status</label>
              <select id={`medStatus-${med.id}`} value={med.status}
                onChange={e => handleStatusChange(med.id, e.target.value as Medication['status'])}
                className="hie-input">
                <option value="active">Active</option>
                <option value="past">Past</option>
                <option value="prn">PRN (as needed)</option>
              </select>
            </div>

            <div className="hie-field">
              <label htmlFor={`medSource-${med.id}`} className="hie-label">Source</label>
              <select id={`medSource-${med.id}`} value={med.source}
                onChange={e => updateMedication(med.id, { source: e.target.value as Medication['source'] })}
                className="hie-input">
                <option value="self-reported">Self-reported</option>
                <option value="provider">Provider</option>
              </select>
            </div>

            {/* Instructions / Notes — full width */}
            <div className="hie-field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor={`medNotes-${med.id}`} className="hie-label">Instructions / Notes</label>
              <input id={`medNotes-${med.id}`} type="text" value={med.notes ?? ''}
                onChange={e => updateMedication(med.id, { notes: e.target.value })}
                className="hie-input" placeholder="e.g. Take with food" />
            </div>

            {/* My notes — full width, amber tinted */}
            <div className="hie-field" style={{ gridColumn: '1 / -1', background: '#FFFBEB', borderTop: '1.5px dashed #FCD34D' }}>
              <label htmlFor={`medPatientNotes-${med.id}`} className="hie-label" style={{ color: '#92400E' }}>
                My notes{' '}
                <span style={{ fontWeight: 400, textTransform: 'none', fontStyle: 'italic', letterSpacing: 0 }}>
                  (side effects, observations)
                </span>
              </label>
              <textarea
                id={`medPatientNotes-${med.id}`}
                value={med.patientNotes ?? ''}
                onChange={e => updateMedication(med.id, { patientNotes: e.target.value })}
                placeholder="e.g. Causes mild dizziness in the first hour…"
                style={{
                  width: '100%', minHeight: 64, resize: 'vertical',
                  background: 'var(--ice)', border: '1px solid var(--ice-border)',
                  borderRadius: 6, padding: '5px 8px', fontSize: 13, fontWeight: 600,
                  lineHeight: 1.5, outline: 'none', fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Reminder toggle — full width */}
            <div style={{
              gridColumn: '1 / -1',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px 6px',
              borderBottom: '1px solid var(--ice-divider)', background: 'var(--ice)',
            }}>
              <span className="hie-label" style={{ marginBottom: 0 }}>Reminder</span>
              <label style={{
                position: 'relative', width: 36, height: 20,
                flexShrink: 0, display: 'inline-block', cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={med.reminder ?? false}
                  onChange={e => updateMedication(med.id, { reminder: e.target.checked })}
                  style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                />
                <span style={{
                  position: 'absolute', inset: 0,
                  background: (med.reminder ?? false) ? 'var(--cyan)' : 'var(--ice-border)',
                  borderRadius: 100, transition: 'background 0.2s',
                }}>
                  <span style={{
                    position: 'absolute', top: 3,
                    left: (med.reminder ?? false) ? 19 : 3,
                    width: 14, height: 14, background: '#fff', borderRadius: '50%',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s',
                  }} />
                </span>
              </label>
            </div>

            {/* Reminder time fields — shown when reminder is on */}
            {(med.reminder ?? false) && (
              <div style={{
                gridColumn: '1 / -1',
                padding: '10px 16px 12px',
                borderBottom: '1px solid var(--ice-divider)',
              }}>
                {renderReminderFields(med)}
              </div>
            )}

          </div>
        )}
      </div>
    );
  }

  function renderListView() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingTop: 14, paddingBottom: 24 }}>

        {/* Expired end-date warnings */}
        {expiredMeds.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {expiredMeds.map(med => (
              <div key={med.id} style={{ background: '#FEE2E2', border: '1.5px solid #FCA5A5', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px' }}>
                  <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚠️</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 2 }}>
                      {med.name || 'Unnamed'} — end date passed
                    </div>
                    <div style={{ fontSize: 12, color: '#B91C1C', fontWeight: 600, lineHeight: 1.4 }}>
                      End date was {fmtDate(med.endDate!)}. Still taking it? Update the end date. Stopped? Mark it as past.
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, padding: '0 14px 12px 38px' }}>
                  <button
                    onClick={() => updateMedication(med.id, { endDate: null })}
                    style={{
                      flex: 1, padding: '7px 10px', fontSize: 11, fontWeight: 700,
                      borderRadius: 8, cursor: 'pointer',
                      border: '1.5px solid var(--ice-border)', background: 'var(--ice)', color: 'var(--navy)',
                    }}
                  >
                    Still taking — clear end date
                  </button>
                  <button
                    onClick={() => updateMedication(med.id, { status: 'past' })}
                    style={{
                      flex: 1, padding: '7px 10px', fontSize: 11, fontWeight: 700,
                      borderRadius: 8, cursor: 'pointer',
                      border: '1.5px solid #991B1B', background: '#991B1B', color: '#fff',
                    }}
                  >
                    Mark as past
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Active / PRN medications */}
        <div className="hie-section">
          <div className="hie-section-header">
            <h2 className="hie-section-title">Medications</h2>
            <span style={{
              background: '#E8F5E9', color: '#2E7D32', border: '1.5px solid #A5D6A7',
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
            }}>
              {medications.length} on file
            </span>
          </div>

          {activeMeds.length === 0 && (
            <p className="text-sm italic" style={{ color: 'var(--label-color)', padding: '14px 16px' }}>
              No medications recorded.
            </p>
          )}

          {activeMeds.map(med => <Fragment key={med.id}>{renderMedItem(med)}</Fragment>)}

          {/* Add button */}
          <button
            aria-label="Add"
            onClick={() => addMedication(newMedication())}
            className="flex items-center gap-2 w-full"
            style={{ borderTop: '1px solid var(--ice-divider)', padding: '10px 16px 12px' }}
          >
            <span
              className="flex items-center justify-center rounded-full text-white font-extrabold shrink-0"
              style={{ width: 24, height: 24, backgroundColor: 'var(--cyan)', fontSize: 15, lineHeight: 1 }}
            >
              +
            </span>
            <span className="font-bold" style={{ color: 'var(--cyan)', fontSize: 13 }}>
              Add medication
            </span>
          </button>
        </div>

        {/* Past medications — collapsible */}
        {pastMeds.length > 0 && (
          <>
            <button
              onClick={() => setShowPast(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '12px 16px', cursor: 'pointer',
                background: '#fff', borderRadius: 12, border: '1.5px solid var(--ice-border)',
                textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>
                {showPast ? '▾ Hide past medications' : `▸ Past medications (${pastMeds.length})`}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                background: '#FEF3C7', color: '#92400E', border: '1.5px solid #FCD34D',
              }}>
                {pastMeds.length} past
              </span>
            </button>
            {showPast && (
              <div className="hie-section">
                {pastMeds.map(med => <Fragment key={med.id}>{renderMedItem(med)}</Fragment>)}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── MAIN RENDER ─────────────────────────────────────────────────────────────
  return (
    <div>
      {/* View toggle */}
      <div style={{
        display: 'flex', background: 'var(--ice-divider)', border: '1.5px solid var(--ice-border)',
        borderRadius: 10, overflow: 'hidden',
      }}>
        {(['today', 'list'] as const).map(v => (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: 1, padding: '9px 12px', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
              background: view === v ? 'var(--navy)' : 'none',
              color: view === v ? '#fff' : 'var(--label-color)',
            }}
          >
            {v === 'today' ? 'Today' : 'My List'}
          </button>
        ))}
      </div>

      {view === 'today' ? renderTodayView() : renderListView()}
    </div>
  );
}
