/**
 * Prerequisites before running these tests:
 *
 *   npm install -D @testing-library/react @testing-library/jest-dom jsdom
 *
 * Also update vite.config.ts test block:
 *   include: ['src/**\/*.test.ts', 'src/**\/*.test.tsx'],
 *   environment: 'jsdom',
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePatientStore } from '../core/store';
import { newAllergy } from '../core/schema';
import PersonalDetailsForm from './PersonalDetailsForm';
import EmergencyContactForm from './EmergencyContactForm';
import AllergyList from './AllergyList';

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
// PersonalDetailsForm
// ---------------------------------------------------------------------------

describe('PersonalDetailsForm', () => {
  it('renders all PersonalDetails fields', () => {
    render(<PersonalDetailsForm />);
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Date of Birth')).toBeInTheDocument();
    expect(screen.getByLabelText('Gender')).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('State')).toBeInTheDocument();
    expect(screen.getByLabelText('ZIP')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Height (ft)')).toBeInTheDocument();
    expect(screen.getByLabelText('Height (in)')).toBeInTheDocument();
    expect(screen.getByLabelText('Weight (lbs)')).toBeInTheDocument();
    expect(screen.getByLabelText('Primary Language')).toBeInTheDocument();
    expect(screen.getByLabelText('Marital Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Blood Type')).toBeInTheDocument();
  });

  it('typing in firstName calls updatePersonal with the new value', () => {
    render(<PersonalDetailsForm />);
    fireEvent.change(screen.getByLabelText('First Name'), {
      target: { value: 'Maria' },
    });
    expect(usePatientStore.getState().record.personal.firstName).toBe('Maria');
  });

  it('typing in dateOfBirth calls updatePersonal with the new value', () => {
    render(<PersonalDetailsForm />);
    fireEvent.change(screen.getByLabelText('Date of Birth'), {
      target: { value: '1978-03-04' },
    });
    expect(usePatientStore.getState().record.personal.dateOfBirth).toBe('1978-03-04');
  });
});

// ---------------------------------------------------------------------------
// EmergencyContactForm
// ---------------------------------------------------------------------------

describe('EmergencyContactForm', () => {
  it('renders all three fields: name, relationship, phone', () => {
    render(<EmergencyContactForm />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Relationship')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
  });

  it('typing in name calls updateEmergencyContact with the new value', () => {
    render(<EmergencyContactForm />);
    fireEvent.change(screen.getByLabelText('Name'), {
      target: { value: 'Carlos Santos' },
    });
    expect(usePatientStore.getState().record.emergencyContact.name).toBe('Carlos Santos');
  });
});

// ---------------------------------------------------------------------------
// AllergyList
// ---------------------------------------------------------------------------

describe('AllergyList', () => {
  it('renders an empty state message when there are no allergies', () => {
    render(<AllergyList />);
    expect(screen.getByText('No allergies recorded.')).toBeInTheDocument();
  });

  it('clicking Add creates a new allergy in the store', () => {
    render(<AllergyList />);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(usePatientStore.getState().record.allergies).toHaveLength(1);
  });

  it('clicking Delete removes the correct allergy by id', () => {
    const a1 = newAllergy(); a1.substance = 'Penicillin';
    const a2 = newAllergy(); a2.substance = 'Peanuts';
    usePatientStore.getState().addAllergy(a1);
    usePatientStore.getState().addAllergy(a2);

    render(<AllergyList />);
    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
    fireEvent.click(deleteButtons[0]);

    const { allergies } = usePatientStore.getState().record;
    expect(allergies).toHaveLength(1);
    expect(allergies[0].id).toBe(a2.id);
  });

  it('changing severity updates the correct allergy in the store', () => {
    const allergy = newAllergy();
    usePatientStore.getState().addAllergy(allergy);

    render(<AllergyList />);
    fireEvent.change(screen.getByRole('combobox'), {
      target: { value: 'severe' },
    });

    expect(usePatientStore.getState().record.allergies[0].severity).toBe('severe');
  });
});
