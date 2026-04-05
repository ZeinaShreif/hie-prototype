import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePatientStore } from '../core/store';
import { newProcedure } from '../core/schema';
import ProceduresPage from '../pages/ProceduresPage';
import ProcedureList from './ProcedureList';

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

// ---------------------------------------------------------------------------
// ProceduresPage
// ---------------------------------------------------------------------------

describe('ProceduresPage', () => {
  it('renders the Procedures & Surgeries section heading', () => {
    render(<ProceduresPage />);
    expect(screen.getByText('Procedures & Surgeries')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ProcedureList — empty state and count badge
// ---------------------------------------------------------------------------

describe('ProcedureList — empty state', () => {
  it('shows empty state message when there are no procedures', () => {
    render(<ProcedureList />);
    expect(screen.getByText('No procedures recorded yet.')).toBeInTheDocument();
  });

  it('shows 0 on file when there are no procedures', () => {
    render(<ProcedureList />);
    expect(screen.getByText('0 on file')).toBeInTheDocument();
  });

  it('updates the count badge as procedures are added', () => {
    const p = newProcedure();
    usePatientStore.getState().addProcedure(p);
    render(<ProcedureList />);
    expect(screen.getByText('1 on file')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ProcedureList — add form
// ---------------------------------------------------------------------------

describe('ProcedureList — add form', () => {
  it('clicking Add procedure opens the form', () => {
    render(<ProcedureList />);
    fireEvent.click(screen.getByRole('button', { name: 'Add procedure' }));
    expect(screen.getByText('New Procedure')).toBeInTheDocument();
  });

  it('the add form renders all fields', () => {
    render(<ProcedureList />);
    fireEvent.click(screen.getByRole('button', { name: 'Add procedure' }));
    expect(screen.getByLabelText('Procedure Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Facility')).toBeInTheDocument();
    expect(screen.getByLabelText('Provider')).toBeInTheDocument();
    expect(screen.getByLabelText('CPT Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Diagnosis Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Outcome')).toBeInTheDocument();
    expect(screen.getByLabelText('Follow-up Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
  });

  it('saving a new procedure adds it to the store and closes the form', () => {
    render(<ProcedureList />);
    fireEvent.click(screen.getByRole('button', { name: 'Add procedure' }));
    fireEvent.change(screen.getByLabelText('Procedure Name'), {
      target: { value: 'Appendectomy' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save procedure' }));

    const { procedures } = usePatientStore.getState().record;
    expect(procedures).toHaveLength(1);
    expect(procedures[0].procedureName).toBe('Appendectomy');
    expect(screen.queryByText('New Procedure')).not.toBeInTheDocument();
  });

  it('cancelling the add form closes it without saving', () => {
    render(<ProcedureList />);
    fireEvent.click(screen.getByRole('button', { name: 'Add procedure' }));
    fireEvent.change(screen.getByLabelText('Procedure Name'), {
      target: { value: 'MRI Scan' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(usePatientStore.getState().record.procedures).toHaveLength(0);
    expect(screen.queryByText('New Procedure')).not.toBeInTheDocument();
  });

  it('saving stores the category field correctly', () => {
    render(<ProcedureList />);
    fireEvent.click(screen.getByRole('button', { name: 'Add procedure' }));
    fireEvent.change(screen.getByLabelText('Category'), {
      target: { value: 'surgery' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save procedure' }));

    expect(usePatientStore.getState().record.procedures[0].category).toBe('surgery');
  });

  it('saving stores the new extended fields correctly', () => {
    render(<ProcedureList />);
    fireEvent.click(screen.getByRole('button', { name: 'Add procedure' }));
    fireEvent.change(screen.getByLabelText('CPT Code'), { target: { value: '44950' } });
    fireEvent.change(screen.getByLabelText('Diagnosis Code'), { target: { value: 'K37' } });
    fireEvent.change(screen.getByLabelText('Outcome'), { target: { value: 'Successful' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save procedure' }));

    const p = usePatientStore.getState().record.procedures[0];
    expect(p.cptCode).toBe('44950');
    expect(p.diagnosisCode).toBe('K37');
    expect(p.outcome).toBe('Successful');
  });
});

// ---------------------------------------------------------------------------
// ProcedureList — edit form
// ---------------------------------------------------------------------------

describe('ProcedureList — edit form', () => {
  it('clicking Edit on an existing procedure opens the edit form', () => {
    const p = newProcedure(); p.procedureName = 'Colonoscopy';
    usePatientStore.getState().addProcedure(p);
    render(<ProcedureList />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByText('Edit Procedure')).toBeInTheDocument();
  });

  it('the edit form is pre-populated with the existing procedure name', () => {
    const p = newProcedure(); p.procedureName = 'Colonoscopy';
    usePatientStore.getState().addProcedure(p);
    render(<ProcedureList />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByLabelText('Procedure Name')).toHaveValue('Colonoscopy');
  });

  it('saving edit updates the procedure in the store', () => {
    const p = newProcedure(); p.procedureName = 'Colonoscopy';
    usePatientStore.getState().addProcedure(p);
    render(<ProcedureList />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Procedure Name'), {
      target: { value: 'Colonoscopy (revised)' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    const { procedures } = usePatientStore.getState().record;
    expect(procedures).toHaveLength(1);
    expect(procedures[0].procedureName).toBe('Colonoscopy (revised)');
  });
});

// ---------------------------------------------------------------------------
// ProcedureList — delete
// ---------------------------------------------------------------------------

describe('ProcedureList — delete', () => {
  it('clicking Delete removes the correct procedure by id', () => {
    const p1 = newProcedure(); p1.procedureName = 'Appendectomy';
    const p2 = newProcedure(); p2.procedureName = 'MRI Scan';
    usePatientStore.getState().addProcedure(p1);
    usePatientStore.getState().addProcedure(p2);
    render(<ProcedureList />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete procedure' });
    fireEvent.click(deleteButtons[0]);

    const { procedures } = usePatientStore.getState().record;
    expect(procedures).toHaveLength(1);
    expect(procedures[0].id).toBe(p2.id);
  });
});

// ---------------------------------------------------------------------------
// ProcedureList — search and filter
// ---------------------------------------------------------------------------

describe('ProcedureList — search', () => {
  beforeEach(() => {
    const p1 = newProcedure(); p1.procedureName = 'Appendectomy'; p1.provider = 'Dr. Patel';
    const p2 = newProcedure(); p2.procedureName = 'MRI Scan'; p2.facility = 'Inova Fairfax';
    usePatientStore.getState().addProcedure(p1);
    usePatientStore.getState().addProcedure(p2);
  });

  it('search by procedure name hides non-matching rows', () => {
    render(<ProcedureList />);
    fireEvent.change(screen.getByPlaceholderText('Search by name, provider, or facility'), {
      target: { value: 'Appendectomy' },
    });
    expect(screen.getByText('Appendectomy')).toBeInTheDocument();
    expect(screen.queryByText('MRI Scan')).not.toBeInTheDocument();
  });

  it('search by provider filters correctly', () => {
    render(<ProcedureList />);
    fireEvent.change(screen.getByPlaceholderText('Search by name, provider, or facility'), {
      target: { value: 'Dr. Patel' },
    });
    expect(screen.getByText('Appendectomy')).toBeInTheDocument();
    expect(screen.queryByText('MRI Scan')).not.toBeInTheDocument();
  });

  it('a search with no matches shows the no-match message', () => {
    render(<ProcedureList />);
    fireEvent.change(screen.getByPlaceholderText('Search by name, provider, or facility'), {
      target: { value: 'zzz-no-match' },
    });
    expect(screen.getByText('No procedures match the current filters.')).toBeInTheDocument();
  });
});

describe('ProcedureList — category filter', () => {
  it('filtering by category shows only matching procedures', () => {
    const p1 = newProcedure(); p1.procedureName = 'Appendectomy'; p1.category = 'surgery';
    const p2 = newProcedure(); p2.procedureName = 'Blood Panel'; p2.category = 'diagnostic';
    usePatientStore.getState().addProcedure(p1);
    usePatientStore.getState().addProcedure(p2);

    render(<ProcedureList />);
    fireEvent.click(screen.getByRole('button', { name: 'Surgery' }));

    expect(screen.getByText('Appendectomy')).toBeInTheDocument();
    expect(screen.queryByText('Blood Panel')).not.toBeInTheDocument();
  });
});
