import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePatientStore } from '../core/store';
import { newVaccination } from '../core/schema';
import VaccinationsPage from '../pages/VaccinationsPage';
import VaccinationList from './VaccinationList';

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
// VaccinationsPage
// ---------------------------------------------------------------------------

describe('VaccinationsPage', () => {
  it('renders the Vaccinations section heading', () => {
    render(<VaccinationsPage />);
    expect(screen.getByText('Vaccinations')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// VaccinationList — empty state and count badge
// ---------------------------------------------------------------------------

describe('VaccinationList — empty state', () => {
  it('shows empty state message when there are no vaccinations', () => {
    render(<VaccinationList />);
    expect(screen.getByText('No vaccinations recorded.')).toBeInTheDocument();
  });

  it('shows 0 on file when there are no vaccinations', () => {
    render(<VaccinationList />);
    expect(screen.getByText('0 on file')).toBeInTheDocument();
  });

  it('updates the count badge as vaccinations are added', () => {
    usePatientStore.getState().addVaccination(newVaccination());
    render(<VaccinationList />);
    expect(screen.getByText('1 on file')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// VaccinationList — add
// ---------------------------------------------------------------------------

describe('VaccinationList — add', () => {
  it('clicking Add creates a new vaccination in the store', () => {
    render(<VaccinationList />);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(usePatientStore.getState().record.vaccinations).toHaveLength(1);
  });

  it('new vaccination renders all five fields', () => {
    usePatientStore.getState().addVaccination(newVaccination());
    render(<VaccinationList />);
    expect(screen.getByLabelText('Vaccine Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Date Administered')).toBeInTheDocument();
    expect(screen.getByLabelText('Lot Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Administering Site')).toBeInTheDocument();
    expect(screen.getByLabelText('Source')).toBeInTheDocument();
  });

  it('new vaccination defaults source to self-reported', () => {
    render(<VaccinationList />);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(usePatientStore.getState().record.vaccinations[0].source).toBe('self-reported');
  });
});

// ---------------------------------------------------------------------------
// VaccinationList — inline edit
// ---------------------------------------------------------------------------

describe('VaccinationList — inline edit', () => {
  it('typing in the vaccine name field calls updateVaccination with the new value', () => {
    usePatientStore.getState().addVaccination(newVaccination());
    render(<VaccinationList />);
    fireEvent.change(screen.getByLabelText('Vaccine Name'), {
      target: { value: 'Influenza' },
    });
    expect(usePatientStore.getState().record.vaccinations[0].vaccineName).toBe('Influenza');
  });

  it('typing in lot number updates the store', () => {
    usePatientStore.getState().addVaccination(newVaccination());
    render(<VaccinationList />);
    fireEvent.change(screen.getByLabelText('Lot Number'), { target: { value: 'A2B3C4' } });
    expect(usePatientStore.getState().record.vaccinations[0].lotNumber).toBe('A2B3C4');
  });

  it('typing in administering site updates the store', () => {
    usePatientStore.getState().addVaccination(newVaccination());
    render(<VaccinationList />);
    fireEvent.change(screen.getByLabelText('Administering Site'), {
      target: { value: 'CVS Pharmacy' },
    });
    expect(usePatientStore.getState().record.vaccinations[0].administeringSite).toBe('CVS Pharmacy');
  });

  it('changing source to provider updates the store', () => {
    usePatientStore.getState().addVaccination(newVaccination());
    render(<VaccinationList />);
    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'provider' } });
    expect(usePatientStore.getState().record.vaccinations[0].source).toBe('provider');
  });
});

// ---------------------------------------------------------------------------
// VaccinationList — delete
// ---------------------------------------------------------------------------

describe('VaccinationList — delete', () => {
  it('clicking Delete removes the correct vaccination by id', () => {
    const v1 = newVaccination(); v1.vaccineName = 'Influenza';
    const v2 = newVaccination(); v2.vaccineName = 'COVID-19';
    usePatientStore.getState().addVaccination(v1);
    usePatientStore.getState().addVaccination(v2);
    render(<VaccinationList />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    const { vaccinations } = usePatientStore.getState().record;
    expect(vaccinations).toHaveLength(1);
    expect(vaccinations[0].id).toBe(v2.id);
  });
});
