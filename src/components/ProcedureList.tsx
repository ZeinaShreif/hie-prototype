import { useState } from 'react';
import type { CSSProperties } from 'react';
import { usePatientStore } from '../core/store';
import { newProcedure } from '../core/schema';
import type { Procedure } from '../core/types';

// ── Helpers ────────────────────────────────────────────────────────────────

const CATEGORIES: Array<{ value: Procedure['category'] | 'all'; label: string }> = [
  { value: 'all',        label: 'All' },
  { value: 'surgery',    label: 'Surgery' },
  { value: 'screening',  label: 'Screening' },
  { value: 'diagnostic', label: 'Diagnostic' },
  { value: 'other',      label: 'Other' },
];

const CATEGORY_LABELS: Record<Procedure['category'], string> = {
  surgery: 'Surgery', screening: 'Screening', diagnostic: 'Diagnostic', other: 'Other',
};

function categoryStyle(category: Procedure['category']): CSSProperties {
  if (category === 'surgery')    return { background: '#FFF0F0', color: '#C62828', border: '1.5px solid #FFCDD2' };
  if (category === 'screening')  return { background: '#E8F8F0', color: '#1A7A3C', border: '1.5px solid #A8DFC0' };
  if (category === 'diagnostic') return { background: '#EFF0FF', color: '#3730A3', border: '1.5px solid #C7D2FE' };
  return { background: '#F5F5F5', color: '#555', border: '1.5px solid #DDD' };
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Small read-only field used in the expanded detail view
function DetailField({ label, value, span2 = false }: { label: string; value: string; span2?: boolean }) {
  return (
    <div style={span2 ? { gridColumn: '1 / -1' } : {}}>
      <div
        style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.12em', color: 'var(--label-color)', marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-dark)' }}>
        {value || '—'}
      </div>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

type Draft = { id: string | null; data: Procedure };

// ── Component ──────────────────────────────────────────────────────────────

export default function ProcedureList() {
  const procedures      = usePatientStore((s) => s.record.procedures);
  const addProcedure    = usePatientStore((s) => s.addProcedure);
  const updateProcedure = usePatientStore((s) => s.updateProcedure);
  const removeProcedure = usePatientStore((s) => s.removeProcedure);

  const [draft, setDraft]           = useState<Draft | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch]                   = useState('');
  const [categoryFilter, setCategoryFilter]   = useState<Procedure['category'] | 'all'>('all');
  const [sortDir, setSortDir]                 = useState<'desc' | 'asc'>('desc');

  // ── Draft helpers ──────────────────────────────────────────────────────

  function patch(changes: Partial<Procedure>) {
    setDraft((prev) => prev ? { ...prev, data: { ...prev.data, ...changes } } : null);
  }

  function handleEdit(proc: Procedure) {
    setExpandedId(null); // close detail view when entering edit
    setDraft({ id: proc.id, data: { ...proc } });
  }

  function handleAdd() {
    setDraft({ id: null, data: newProcedure() });
  }

  function handleSave() {
    if (!draft) return;
    if (draft.id === null) {
      addProcedure(draft.data);
    } else {
      updateProcedure(draft.id, draft.data);
    }
    setDraft(null);
  }

  function handleCancel() {
    setDraft(null);
  }

  // ── Expand / collapse ──────────────────────────────────────────────────

  function toggleExpand(id: string) {
    if (draft?.id === id) return; // don't expand the row being edited
    setExpandedId((prev) => (prev === id ? null : id));
  }

  // ── Filtered + sorted list ─────────────────────────────────────────────

  const visible = procedures
    .filter((p) => categoryFilter === 'all' || p.category === categoryFilter)
    .filter((p) => {
      const q = search.toLowerCase();
      return (
        p.procedureName.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q) ||
        p.facility.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return sortDir === 'desc' ? -cmp : cmp;
    });

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="hie-section">

      {/* ── Section header ──────────────────────────────────────────────── */}
      <div className="hie-section-header">
        <h2 className="hie-section-title">Procedures &amp; Surgeries</h2>
        <span
          style={{
            background: '#EFF0FF', color: '#3730A3',
            fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
          }}
        >
          {procedures.length} on file
        </span>
      </div>

      {/* ── Edit / Add form ─────────────────────────────────────────────── */}
      {draft && (
        <div style={{ background: '#F4F7FF', borderBottom: '2px solid var(--ice-border)' }}>

          {/* Form title bar */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 16px 9px',
              borderBottom: '1px solid var(--ice-divider)',
              borderLeft: '3px solid var(--cyan)',
            }}
          >
            <span className="hie-section-title" style={{ color: 'var(--cyan)' }}>
              {draft.id === null ? 'New Procedure' : 'Edit Procedure'}
            </span>
            {draft.id !== null && draft.data.procedureName && (
              <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>
                {draft.data.procedureName}
              </span>
            )}
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2">

            <div className="col-span-2 hie-field">
              <label htmlFor="form-name" className="hie-label">Procedure Name</label>
              <input id="form-name" type="text" value={draft.data.procedureName}
                onChange={(e) => patch({ procedureName: e.target.value })}
                className="hie-input" placeholder="e.g. Appendectomy" autoFocus />
            </div>

            <div className="hie-field-left">
              <label htmlFor="form-date" className="hie-label">Date</label>
              <input id="form-date" type="date" value={draft.data.date}
                onChange={(e) => patch({ date: e.target.value })} className="hie-input" />
            </div>
            <div className="hie-field">
              <label htmlFor="form-category" className="hie-label">Category</label>
              <select id="form-category" value={draft.data.category}
                onChange={(e) => patch({ category: e.target.value as Procedure['category'] })}
                className="hie-input"
                style={{ cursor: 'pointer', ...categoryStyle(draft.data.category) }}>
                <option value="surgery">Surgery</option>
                <option value="screening">Screening</option>
                <option value="diagnostic">Diagnostic</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="hie-field-left">
              <label htmlFor="form-facility" className="hie-label">Facility</label>
              <input id="form-facility" type="text" value={draft.data.facility}
                onChange={(e) => patch({ facility: e.target.value })}
                className="hie-input" placeholder="e.g. Inova Fairfax" />
            </div>
            <div className="hie-field">
              <label htmlFor="form-provider" className="hie-label">Provider</label>
              <input id="form-provider" type="text" value={draft.data.provider}
                onChange={(e) => patch({ provider: e.target.value })}
                className="hie-input" placeholder="e.g. Dr. Patel" />
            </div>

            <div className="hie-field-left">
              <label htmlFor="form-cpt" className="hie-label">CPT Code</label>
              <input id="form-cpt" type="text" value={draft.data.cptCode}
                onChange={(e) => patch({ cptCode: e.target.value })}
                className="hie-input" placeholder="e.g. 44950" />
            </div>
            <div className="hie-field">
              <label htmlFor="form-dx" className="hie-label">Diagnosis Code</label>
              <input id="form-dx" type="text" value={draft.data.diagnosisCode}
                onChange={(e) => patch({ diagnosisCode: e.target.value })}
                className="hie-input" placeholder="e.g. K37 (ICD-10)" />
            </div>

            <div className="hie-field-left">
              <label htmlFor="form-outcome" className="hie-label">Outcome</label>
              <input id="form-outcome" type="text" value={draft.data.outcome}
                onChange={(e) => patch({ outcome: e.target.value })}
                className="hie-input" placeholder="e.g. Successful" />
            </div>
            <div className="hie-field">
              <label htmlFor="form-followup" className="hie-label">Follow-up Date</label>
              <input id="form-followup" type="date" value={draft.data.followUpDate ?? ''}
                onChange={(e) => patch({ followUpDate: e.target.value || null })}
                className="hie-input" />
            </div>

            <div className="col-span-2 hie-field" style={{ borderBottom: 'none' }}>
              <label htmlFor="form-notes" className="hie-label">Notes</label>
              <input id="form-notes" type="text" value={draft.data.notes}
                onChange={(e) => patch({ notes: e.target.value })}
                className="hie-input" placeholder="e.g. No complications, follow-up in 6 weeks" />
            </div>

          </div>

          {/* Save / Cancel */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--ice-divider)' }}>
            <button onClick={handleCancel}
              style={{
                fontSize: 13, fontWeight: 600, padding: '9px 16px', borderRadius: 6,
                border: '1.5px solid var(--ice-border)', background: 'transparent',
                color: 'var(--muted)', cursor: 'pointer',
              }}>
              Cancel
            </button>
            <button onClick={handleSave}
              style={{
                flex: 1, fontSize: 14, fontWeight: 600, padding: '10px 18px', borderRadius: 6,
                border: 'none', background: 'var(--cyan)', color: '#fff', cursor: 'pointer',
              }}>
              {draft.id === null ? 'Save procedure' : 'Save changes'}
            </button>
          </div>

        </div>
      )}

      {/* ── Filter bar ──────────────────────────────────────────────────── */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--ice-divider)' }}>
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          className="hie-input" placeholder="Search by name, provider, or facility"
          style={{ marginBottom: 8 }} />
        <div className="flex items-center gap-2 flex-wrap">
          {CATEGORIES.map(({ value, label }) => {
            const active = categoryFilter === value;
            const cs = active && value !== 'all' ? categoryStyle(value as Procedure['category']) : {};
            return (
              <button key={value} onClick={() => setCategoryFilter(value)}
                style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
                  cursor: 'pointer',
                  border: active ? (value === 'all' ? '1.5px solid var(--cyan)' : cs.border as string) : '1.5px solid var(--ice-border)',
                  background: active ? (value === 'all' ? 'var(--ice)' : cs.background as string) : 'transparent',
                  color: active ? (value === 'all' ? 'var(--cyan)' : cs.color as string) : 'var(--label-color)',
                }}>
                {label}
              </button>
            );
          })}
          <button onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
            style={{
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
              border: '1.5px solid var(--ice-border)', background: 'transparent',
              color: 'var(--muted)', cursor: 'pointer', marginLeft: 'auto',
            }}>
            {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>
        </div>
      </div>

      {/* ── List view ───────────────────────────────────────────────────── */}
      {procedures.length === 0 && (
        <p className="text-sm italic" style={{ color: 'var(--label-color)', padding: '12px 16px' }}>
          No procedures recorded yet.
        </p>
      )}
      {procedures.length > 0 && visible.length === 0 && (
        <p className="text-sm italic" style={{ color: 'var(--label-color)', padding: '12px 16px' }}>
          No procedures match the current filters.
        </p>
      )}

      {visible.map((proc, index) => {
        const expanded = expandedId === proc.id;
        const editing  = draft?.id === proc.id;
        const isLast   = index === visible.length - 1;

        return (
          <div key={proc.id} style={{ borderBottom: isLast ? 'none' : '1px solid var(--ice-divider)' }}>

            {/* Collapsed row — tap to expand */}
            <div
              onClick={() => toggleExpand(proc.id)}
              style={{
                display: 'flex', alignItems: 'flex-start', padding: '10px 16px', gap: 8,
                cursor: editing ? 'default' : 'pointer',
                background: editing ? '#EEF3FF' : expanded ? '#F4F7FF' : 'transparent',
                transition: 'background 0.15s ease',
              }}
            >
              {/* Chevron */}
              <span style={{
                fontSize: 10, color: 'var(--label-color)', flexShrink: 0,
                marginTop: 3, width: 10, textAlign: 'center',
                opacity: editing ? 0.3 : 1,
              }}>
                {expanded ? '▾' : '▸'}
              </span>

              {/* Name + meta */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: editing ? 'var(--cyan)' : 'var(--text-dark)',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {proc.procedureName ||
                    <span style={{ fontStyle: 'italic', color: 'var(--label-color)' }}>Unnamed</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8, ...categoryStyle(proc.category) }}>
                    {CATEGORY_LABELS[proc.category]}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--label-color)' }}>
                    {formatDate(proc.date)}
                  </span>
                  {proc.facility && (
                    <span style={{
                      fontSize: 11, color: 'var(--muted)',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110,
                    }}>
                      {proc.facility}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions — stop propagation so clicks don't toggle expand */}
              <div
                onClick={(e) => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
              >
                <button
                  onClick={() => editing ? handleCancel() : handleEdit(proc)}
                  style={{
                    fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 6,
                    cursor: 'pointer',
                    border: editing ? '1.5px solid var(--cyan)' : '1.5px solid var(--ice-border)',
                    background: editing ? 'var(--ice)' : 'transparent',
                    color: editing ? 'var(--cyan)' : 'var(--muted)',
                  }}>
                  {editing ? 'Editing' : 'Edit'}
                </button>
                <button
                  aria-label="Delete procedure"
                  onClick={() => { if (editing) setDraft(null); removeProcedure(proc.id); }}
                  style={{
                    fontSize: 18, fontWeight: 700, lineHeight: 1, padding: '2px 4px',
                    color: '#EF9A9A', background: 'transparent', border: 'none', cursor: 'pointer',
                  }}>
                  ×
                </button>
              </div>
            </div>

            {/* Expanded detail view */}
            {expanded && (
              <div style={{
                background: '#F4F7FF',
                borderTop: '1px solid var(--ice-divider)',
                padding: '14px 16px 10px 26px',
              }}>
                <div style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr',
                  gap: '12px 16px', marginBottom: 10,
                }}>
                  <DetailField label="Date" value={formatDate(proc.date)} />
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--label-color)', marginBottom: 4 }}>
                      Category
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 8, ...categoryStyle(proc.category) }}>
                      {CATEGORY_LABELS[proc.category]}
                    </span>
                  </div>
                  <DetailField label="Facility"    value={proc.facility} />
                  <DetailField label="Provider"    value={proc.provider} />
                  {(proc.cptCode || proc.diagnosisCode) && <>
                    <DetailField label="CPT Code"       value={proc.cptCode} />
                    <DetailField label="Diagnosis Code" value={proc.diagnosisCode} />
                  </>}
                  {(proc.outcome || proc.followUpDate) && <>
                    <DetailField label="Outcome"        value={proc.outcome} />
                    <DetailField label="Follow-up Date" value={formatDate(proc.followUpDate ?? '')} />
                  </>}
                  {proc.notes && (
                    <DetailField label="Notes" value={proc.notes} span2 />
                  )}
                </div>

                {/* Detail actions */}
                <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--ice-divider)' }}>
                  <button
                    onClick={() => handleEdit(proc)}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 6,
                      border: '1.5px solid var(--cyan)', background: 'transparent',
                      color: 'var(--cyan)', cursor: 'pointer',
                    }}>
                    Edit
                  </button>
                  <button
                    onClick={() => setExpandedId(null)}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: '6px 14px', borderRadius: 6,
                      border: '1.5px solid var(--ice-border)', background: 'transparent',
                      color: 'var(--muted)', cursor: 'pointer',
                    }}>
                    Collapse ▴
                  </button>
                </div>
              </div>
            )}

          </div>
        );
      })}

      {/* ── Add button ──────────────────────────────────────────────────── */}
      <button
        aria-label="Add procedure"
        onClick={handleAdd}
        disabled={draft?.id === null}
        className="flex items-center gap-2 w-full"
        style={{
          borderTop: '1px solid var(--ice-divider)', padding: '10px 16px 12px',
          opacity: draft?.id === null ? 0.4 : 1,
          cursor: draft?.id === null ? 'default' : 'pointer',
        }}>
        <span
          className="flex items-center justify-center rounded-full text-white font-extrabold shrink-0"
          style={{ width: 24, height: 24, backgroundColor: 'var(--cyan)', fontSize: 15, lineHeight: 1 }}>
          +
        </span>
        <span className="font-bold" style={{ color: 'var(--cyan)', fontSize: 13 }}>
          Add procedure
        </span>
      </button>

    </div>
  );
}
