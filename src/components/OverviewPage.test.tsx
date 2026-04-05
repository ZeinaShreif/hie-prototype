import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { usePatientStore } from '../core/store';
import { newAllergy, newMedication, newVaccination, newProcedure } from '../core/schema';
import OverviewPage from '../pages/OverviewPage';

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

function renderOverview() {
  return render(
    <MemoryRouter>
      <OverviewPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorageMock.clear();
  usePatientStore.getState().clearAll();
});

// ---------------------------------------------------------------------------
// Identity banner
// ---------------------------------------------------------------------------

describe('OverviewPage — identity banner', () => {
  it('shows a dash when no name is set', () => {
    renderOverview();
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('displays the patient full name when set', () => {
    usePatientStore.getState().updatePersonal({ firstName: 'Maria', lastName: 'Santos' });
    renderOverview();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
  });

  it('displays DOB, sex, and blood type when set', () => {
    usePatientStore.getState().updatePersonal({
      dateOfBirth: '1978-03-04',
      sex: 'Female',
      bloodType: 'O+',
    });
    renderOverview();
    expect(screen.getByText(/1978-03-04/)).toBeInTheDocument();
    expect(screen.getByText(/Female/)).toBeInTheDocument();
    expect(screen.getByText(/O\+/)).toBeInTheDocument();
  });

  it('shows emergency contact name and phone when set', () => {
    usePatientStore.getState().updateEmergencyContact({
      name: 'Carlos Santos',
      phone: '(555) 123-4567',
      relationship: 'Spouse',
    });
    renderOverview();
    expect(screen.getByText('Carlos Santos')).toBeInTheDocument();
    expect(screen.getByText(/\(555\) 123-4567/)).toBeInTheDocument();
  });

  it('does not show emergency contact section when name is empty', () => {
    renderOverview();
    expect(screen.queryByText(/Emergency contact/)).not.toBeInTheDocument();
  });

  it('shows insurance carrier and plan when insurancePrimary is set', () => {
    usePatientStore.getState().updateInsurancePrimary({
      carrier: 'Blue Cross',
      planName: 'Gold Plan',
    });
    renderOverview();
    expect(screen.getByText('Blue Cross')).toBeInTheDocument();
    expect(screen.getByText(/Gold Plan/)).toBeInTheDocument();
  });

  it('does not show insurance section when insurancePrimary is null', () => {
    renderOverview();
    expect(screen.queryByText(/Insurance:/)).not.toBeInTheDocument();
  });

  it('contains an Edit link to /profile', () => {
    renderOverview();
    const links = screen.getAllByRole('link', { name: /Edit/ });
    const profileLink = links.find((l) => l.getAttribute('href') === '/profile');
    expect(profileLink).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Summary cards — section headings and Edit links
// ---------------------------------------------------------------------------

describe('OverviewPage — summary cards', () => {
  it('renders all four section headings', () => {
    renderOverview();
    expect(screen.getByText('Allergies')).toBeInTheDocument();
    expect(screen.getByText('Medications')).toBeInTheDocument();
    expect(screen.getByText('Vaccinations')).toBeInTheDocument();
    expect(screen.getByText('Procedures')).toBeInTheDocument();
  });

  it('shows empty labels when all sections have no data', () => {
    renderOverview();
    expect(screen.getByText('No allergies recorded.')).toBeInTheDocument();
    expect(screen.getByText('No medications recorded.')).toBeInTheDocument();
    expect(screen.getByText('No vaccinations recorded.')).toBeInTheDocument();
    expect(screen.getByText('No procedures recorded.')).toBeInTheDocument();
  });

  it('Edit links point to the correct routes', () => {
    renderOverview();
    const links = screen.getAllByRole('link', { name: /Edit/ });
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/profile');
    expect(hrefs).toContain('/medications');
    expect(hrefs).toContain('/vaccinations');
    expect(hrefs).toContain('/procedures');
  });
});

// ---------------------------------------------------------------------------
// Summary cards — counts and item previews
// ---------------------------------------------------------------------------

describe('OverviewPage — count badges', () => {
  it('allergy count badge updates when allergies are added', () => {
    usePatientStore.getState().addAllergy(newAllergy());
    usePatientStore.getState().addAllergy(newAllergy());
    renderOverview();
    // There will be multiple "on file" badges; find the one in the Allergies card
    const badges = screen.getAllByText(/on file/);
    expect(badges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2 on file').length).toBeGreaterThanOrEqual(1);
  });

  it('shows allergy substance and severity in the list', () => {
    const a = newAllergy(); a.substance = 'Penicillin'; a.severity = 'severe';
    usePatientStore.getState().addAllergy(a);
    renderOverview();
    expect(screen.getByText('Penicillin · severe')).toBeInTheDocument();
  });

  it('shows medication name, dosage, and status in the list', () => {
    const m = newMedication(); m.name = 'Lisinopril'; m.dosage = '10mg'; m.status = 'active';
    usePatientStore.getState().addMedication(m);
    renderOverview();
    expect(screen.getByText('Lisinopril · 10mg · active')).toBeInTheDocument();
  });

  it('shows vaccine name and date in the list', () => {
    const v = newVaccination(); v.vaccineName = 'Influenza'; v.dateAdministered = '2024-10-01';
    usePatientStore.getState().addVaccination(v);
    renderOverview();
    expect(screen.getByText('Influenza · 2024-10-01')).toBeInTheDocument();
  });

  it('shows procedure name, date, and category in the list', () => {
    const p = newProcedure();
    p.procedureName = 'Appendectomy'; p.date = '2023-05-15'; p.category = 'surgery';
    usePatientStore.getState().addProcedure(p);
    renderOverview();
    expect(screen.getByText('Appendectomy · 2023-05-15 · surgery')).toBeInTheDocument();
  });
});
