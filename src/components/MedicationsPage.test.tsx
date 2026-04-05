import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePatientStore } from '../core/store';
import { newMedication } from '../core/schema';
import MedicationsPage from '../pages/MedicationsPage';
import MedicationList from './MedicationList';

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

beforeEach(() => {
  localStorageMock.clear();
  usePatientStore.getState().clearAll();
});

function switchToMyList() {
  fireEvent.click(screen.getByRole('button', { name: 'My List' }));
}

// ---------------------------------------------------------------------------
// MedicationsPage
// ---------------------------------------------------------------------------

describe('MedicationsPage', () => {
  it('renders view toggle with Today and My List buttons', () => {
    render(<MedicationsPage />);
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My List' })).toBeInTheDocument();
  });

  it('Today view shows adherence card by default', () => {
    render(<MedicationsPage />);
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
  });

  it('My List view shows Medications section heading', () => {
    render(<MedicationsPage />);
    switchToMyList();
    expect(screen.getByText('Medications')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MedicationList — empty state and count badge
// ---------------------------------------------------------------------------

describe('MedicationList — empty state', () => {
  it('shows empty state message in My List when there are no medications', () => {
    render(<MedicationList />);
    switchToMyList();
    expect(screen.getByText('No medications recorded.')).toBeInTheDocument();
  });

  it('shows 0 on file in My List when there are no medications', () => {
    render(<MedicationList />);
    switchToMyList();
    expect(screen.getByText('0 on file')).toBeInTheDocument();
  });

  it('updates the count badge as medications are added', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    expect(screen.getByText('1 on file')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MedicationList — add
// ---------------------------------------------------------------------------

describe('MedicationList — add', () => {
  it('clicking Add creates a new medication in the store', () => {
    render(<MedicationList />);
    switchToMyList();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(usePatientStore.getState().record.medications).toHaveLength(1);
  });

  it('new medication renders all fields', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    expect(screen.getByLabelText('Medication Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Dosage')).toBeInTheDocument();
    expect(screen.getByLabelText('Frequency')).toBeInTheDocument();
    expect(screen.getByLabelText('Prescribing Provider')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date (blank = active)')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Source')).toBeInTheDocument();
    expect(screen.getByLabelText('Instructions / Notes')).toBeInTheDocument();
  });

  it('new medication defaults to active + self-reported in the store', () => {
    render(<MedicationList />);
    switchToMyList();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    const med = usePatientStore.getState().record.medications[0];
    expect(med.status).toBe('active');
    expect(med.source).toBe('self-reported');
  });

  it('new medication has empty notes and reminder off', () => {
    render(<MedicationList />);
    switchToMyList();
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    const med = usePatientStore.getState().record.medications[0];
    expect(med.notes).toBe('');
    expect(med.patientNotes).toBe('');
    expect(med.reminder).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// MedicationList — inline edit
// ---------------------------------------------------------------------------

describe('MedicationList — inline edit', () => {
  it('typing in the name field calls updateMedication with the new value', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    fireEvent.change(screen.getByLabelText('Medication Name'), {
      target: { value: 'Lisinopril' },
    });
    expect(usePatientStore.getState().record.medications[0].name).toBe('Lisinopril');
  });

  it('typing in dosage calls updateMedication with the new value', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    fireEvent.change(screen.getByLabelText('Dosage'), { target: { value: '10mg' } });
    expect(usePatientStore.getState().record.medications[0].dosage).toBe('10mg');
  });

  it('changing status updates the store', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'past' } });
    expect(usePatientStore.getState().record.medications[0].status).toBe('past');
  });

  it('changing source updates the store', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'provider' } });
    expect(usePatientStore.getState().record.medications[0].source).toBe('provider');
  });

  it('setting end date stores the value; clearing it stores null', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    fireEvent.change(screen.getByLabelText('End Date (blank = active)'), {
      target: { value: '2025-06-01' },
    });
    expect(usePatientStore.getState().record.medications[0].endDate).toBe('2025-06-01');
    fireEvent.change(screen.getByLabelText('End Date (blank = active)'), {
      target: { value: '' },
    });
    expect(usePatientStore.getState().record.medications[0].endDate).toBeNull();
  });

  it('typing in Instructions / Notes updates the store', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    fireEvent.change(screen.getByLabelText('Instructions / Notes'), {
      target: { value: 'Take with food' },
    });
    expect(usePatientStore.getState().record.medications[0].notes).toBe('Take with food');
  });

  it('typing in My notes textarea updates patientNotes in the store', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    fireEvent.change(screen.getByLabelText(/My notes/i), {
      target: { value: 'Causes mild dizziness' },
    });
    expect(usePatientStore.getState().record.medications[0].patientNotes).toBe('Causes mild dizziness');
  });

  it('changing status to past auto-sets endDate to today when endDate is null', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'past' } });
    const med = usePatientStore.getState().record.medications[0];
    expect(med.status).toBe('past');
    expect(med.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

// ---------------------------------------------------------------------------
// MedicationList — collapse / expand
// ---------------------------------------------------------------------------

describe('MedicationList — collapse / expand', () => {
  it('items are expanded by default (fields are visible)', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    expect(screen.getByLabelText('Medication Name')).toBeInTheDocument();
  });

  it('clicking the item header collapses the fields', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    // Header is the div[role="button"] containing the status dot
    fireEvent.click(screen.getByRole('button', { name: /unnamed/i }));
    expect(screen.queryByLabelText('Medication Name')).not.toBeInTheDocument();
  });

  it('clicking the header again re-expands the fields', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    const header = screen.getByRole('button', { name: /unnamed/i });
    fireEvent.click(header); // collapse
    fireEvent.click(header); // expand
    expect(screen.getByLabelText('Medication Name')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MedicationList — reminder toggle
// ---------------------------------------------------------------------------

describe('MedicationList — reminder toggle', () => {
  it('reminder checkbox is unchecked by default', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    expect(usePatientStore.getState().record.medications[0].reminder).toBe(false);
  });

  it('checking the reminder toggle enables reminder in the store', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    switchToMyList();
    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(usePatientStore.getState().record.medications[0].reminder).toBe(true);
  });

  it('enabling reminder reveals a time input', () => {
    const m = newMedication();
    m.reminder = true;
    m.frequency = 'Once daily';
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    switchToMyList();
    expect(screen.getByLabelText('Time')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MedicationList — delete
// ---------------------------------------------------------------------------

describe('MedicationList — delete', () => {
  it('clicking Delete removes the correct medication by id', () => {
    const m1 = newMedication(); m1.name = 'Lisinopril';
    const m2 = newMedication(); m2.name = 'Metformin';
    usePatientStore.getState().addMedication(m1);
    usePatientStore.getState().addMedication(m2);
    render(<MedicationList />);
    switchToMyList();

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    const { medications } = usePatientStore.getState().record;
    expect(medications).toHaveLength(1);
    expect(medications[0].id).toBe(m2.id);
  });
});

// ---------------------------------------------------------------------------
// MedicationList — Today view
// ---------------------------------------------------------------------------

describe('MedicationList — Today view', () => {
  it('shows adherence card with "Today" heading', () => {
    render(<MedicationList />);
    expect(screen.getByRole('heading', { name: 'Today' })).toBeInTheDocument();
  });

  it('shows empty reminder message when no meds have reminders enabled', () => {
    usePatientStore.getState().addMedication(newMedication());
    render(<MedicationList />);
    expect(
      screen.getByText('No reminders set. Enable reminders in My List to track doses here.')
    ).toBeInTheDocument();
  });

  it('shows today med row when reminder is enabled', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    expect(screen.getByText('💊 Lisinopril')).toBeInTheDocument();
  });

  it('today med row shows "Due now" pill by default', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    expect(screen.getByText('Due now')).toBeInTheDocument();
  });

  it('clicking "Mark as taken" changes pill to "Taken ✓"', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    // Expand the row
    fireEvent.click(screen.getByText('💊 Lisinopril'));
    fireEvent.click(screen.getByText('Mark as taken'));
    expect(screen.getByText('Taken ✓')).toBeInTheDocument();
  });

  it('clicking "Undo — mark as due" reverts pill back to "Due now"', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    fireEvent.click(screen.getByText('💊 Lisinopril')); // expand
    fireEvent.click(screen.getByText('Mark as taken')); // marks taken + collapses
    fireEvent.click(screen.getByText('💊 Lisinopril')); // re-expand to show Undo
    fireEvent.click(screen.getByText('↩ Undo — mark as due'));
    expect(screen.getByText('Due now')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MedicationList — multi-dose Today view
// ---------------------------------------------------------------------------

describe('MedicationList — multi-dose Today view', () => {
  it('med with two reminder times renders two separate dose rows', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    m.frequency = 'Twice daily';
    m.reminderTimes = ['00:01', '00:02'];
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    expect(screen.getByText('💊 Lisinopril · Morning')).toBeInTheDocument();
    expect(screen.getByText('💊 Lisinopril · Evening')).toBeInTheDocument();
  });

  it('marking morning dose taken does not affect evening dose', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    m.frequency = 'Twice daily';
    m.reminderTimes = ['00:01', '00:02'];
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    fireEvent.click(screen.getByText('💊 Lisinopril · Morning'));
    fireEvent.click(screen.getByText('Mark as taken'));
    expect(screen.getByText('Taken ✓')).toBeInTheDocument();
    expect(screen.getByText('Due now')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MedicationList — mark as missed
// ---------------------------------------------------------------------------

describe('MedicationList — mark as missed', () => {
  it('"Mark as missed" button appears for an overdue dose', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    fireEvent.click(screen.getByText('💊 Lisinopril'));
    expect(screen.getByRole('button', { name: 'Mark as missed' })).toBeInTheDocument();
  });

  it('"Mark as missed" button does not appear for an upcoming dose', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    m.reminderTimes = ['23:59'];
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    fireEvent.click(screen.getByText('💊 Lisinopril'));
    expect(screen.queryByRole('button', { name: 'Mark as missed' })).not.toBeInTheDocument();
  });

  it('clicking "Mark as missed" shows Missed badge', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    fireEvent.click(screen.getByText('💊 Lisinopril'));
    fireEvent.click(screen.getByRole('button', { name: 'Mark as missed' }));
    expect(screen.getByRole('button', { name: 'Missed' })).toBeDisabled();
  });

  it('clicking "Mark as missed" keeps the row expanded', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    fireEvent.click(screen.getByText('💊 Lisinopril'));
    fireEvent.click(screen.getByRole('button', { name: 'Mark as missed' }));
    expect(screen.getByText('Mark as taken anyway')).toBeInTheDocument();
  });

  it('"Mark as taken anyway" in missed state marks the dose taken', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    fireEvent.click(screen.getByText('💊 Lisinopril'));
    fireEvent.click(screen.getByRole('button', { name: 'Mark as missed' }));
    fireEvent.click(screen.getByText('Mark as taken anyway'));
    expect(screen.getByText('Taken ✓')).toBeInTheDocument();
  });

  it('undo from missed state reverts dose to Due now', () => {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    fireEvent.click(screen.getByText('💊 Lisinopril'));
    fireEvent.click(screen.getByRole('button', { name: 'Mark as missed' }));
    fireEvent.click(screen.getByText('↩ Undo — mark as due'));
    expect(screen.getByText('Due now')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MedicationList — missed doses log
// ---------------------------------------------------------------------------

describe('MedicationList — missed doses log', () => {
  function markFirstDoseAsMissed() {
    fireEvent.click(screen.getByText('💊 Lisinopril'));
    fireEvent.click(screen.getByRole('button', { name: 'Mark as missed' }));
  }

  function addOverdueMed() {
    const m = newMedication();
    m.name = 'Lisinopril';
    m.reminder = true;
    usePatientStore.getState().addMedication(m);
  }

  it('missed doses toggle appears after marking a dose missed', () => {
    addOverdueMed();
    render(<MedicationList />);
    markFirstDoseAsMissed();
    expect(screen.getByText(/Missed doses/)).toBeInTheDocument();
  });

  it('expanding the log shows the medication name', () => {
    addOverdueMed();
    render(<MedicationList />);
    markFirstDoseAsMissed();
    fireEvent.click(screen.getByText(/Missed doses/));
    expect(screen.getAllByText('Lisinopril').length).toBeGreaterThan(0);
  });

  it('expanding the log shows the missed timestamp', () => {
    addOverdueMed();
    render(<MedicationList />);
    markFirstDoseAsMissed();
    fireEvent.click(screen.getByText(/Missed doses/));
    expect(screen.getByText(/Missed at/)).toBeInTheDocument();
  });

  it('collapsing the log hides the entries', () => {
    addOverdueMed();
    render(<MedicationList />);
    markFirstDoseAsMissed();
    fireEvent.click(screen.getByText(/Missed doses/));    // expand
    fireEvent.click(screen.getByText(/Hide missed doses/)); // collapse
    expect(screen.queryByText(/Missed at/)).not.toBeInTheDocument();
  });

  it('deleting a log entry removes it from the log', () => {
    addOverdueMed();
    render(<MedicationList />);
    markFirstDoseAsMissed();
    fireEvent.click(screen.getByText(/Missed doses/));
    fireEvent.click(screen.getByRole('button', { name: 'Delete missed entry' }));
    expect(screen.queryByText(/Missed doses/)).not.toBeInTheDocument();
  });

  it('deleting a log entry resets the dose back to Due now', () => {
    addOverdueMed();
    render(<MedicationList />);
    markFirstDoseAsMissed();
    fireEvent.click(screen.getByText(/Missed doses/));
    fireEvent.click(screen.getByRole('button', { name: 'Delete missed entry' }));
    expect(screen.getByText('Due now')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// MedicationList — past medications section
// ---------------------------------------------------------------------------

describe('MedicationList — past medications section', () => {
  it('past medications do not appear in the active list', () => {
    const m = newMedication();
    m.name = 'OldMed';
    m.status = 'past';
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    switchToMyList();
    expect(screen.queryByText('No medications recorded.')).toBeInTheDocument();
  });

  it('shows "Past medications" toggle when past meds exist', () => {
    const m = newMedication();
    m.status = 'past';
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    switchToMyList();
    expect(screen.getByText(/Past medications/)).toBeInTheDocument();
  });

  it('clicking the toggle reveals past medications', () => {
    const m = newMedication();
    m.name = 'OldMed';
    m.status = 'past';
    usePatientStore.getState().addMedication(m);
    render(<MedicationList />);
    switchToMyList();
    fireEvent.click(screen.getByText(/Past medications/));
    expect(screen.getByText('OldMed')).toBeInTheDocument();
  });
});
