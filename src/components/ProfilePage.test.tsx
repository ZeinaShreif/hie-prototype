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
    expect(screen.getByLabelText('Sex')).toBeInTheDocument();
    expect(screen.getByLabelText('Address')).toBeInTheDocument();
    expect(screen.getByLabelText('City')).toBeInTheDocument();
    expect(screen.getByLabelText('State')).toBeInTheDocument();
    expect(screen.getByLabelText('ZIP')).toBeInTheDocument();
    expect(screen.getByLabelText('Phone')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Height')).toBeInTheDocument();
    expect(screen.getByLabelText('Weight (lbs)')).toBeInTheDocument();
    expect(screen.getByLabelText('Preferred Language')).toBeInTheDocument();
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
// PersonalDetailsForm — parametrised store-update tests for remaining fields
// ---------------------------------------------------------------------------

describe('PersonalDetailsForm — store updates', () => {
  const textFields: { label: string; storeKey: keyof ReturnType<typeof usePatientStore.getState>['record']['personal']; value: string }[] = [
    { label: 'Last Name',          storeKey: 'lastName',          value: 'Santos'  },
    { label: 'Address',            storeKey: 'address',           value: '123 Main St' },
    { label: 'City',               storeKey: 'city',              value: 'Arlington' },
    { label: 'ZIP',                storeKey: 'zip',               value: '22201'   },
    { label: 'Email',              storeKey: 'email',             value: 'jane@example.com' },
    { label: 'Preferred Language', storeKey: 'preferredLanguage', value: 'Spanish' },
  ];

  it.each(textFields)('typing in "$label" updates store.$storeKey', ({ label, storeKey, value }) => {
    render(<PersonalDetailsForm />);
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
    expect(usePatientStore.getState().record.personal[storeKey]).toBe(value);
  });

  it('selecting Sex updates store.sex', () => {
    render(<PersonalDetailsForm />);
    fireEvent.change(screen.getByLabelText('Sex'), { target: { value: 'Female' } });
    expect(usePatientStore.getState().record.personal.sex).toBe('Female');
  });

  it('selecting Marital Status updates store.maritalStatus', () => {
    render(<PersonalDetailsForm />);
    fireEvent.change(screen.getByLabelText('Marital Status'), { target: { value: 'Married' } });
    expect(usePatientStore.getState().record.personal.maritalStatus).toBe('Married');
  });

  it('selecting Blood Type updates store.bloodType', () => {
    render(<PersonalDetailsForm />);
    fireEvent.change(screen.getByLabelText('Blood Type'), { target: { value: 'O+' } });
    expect(usePatientStore.getState().record.personal.bloodType).toBe('O+');
  });

  it('height is saved to store on blur', () => {
    render(<PersonalDetailsForm />);
    const heightInput = screen.getByLabelText('Height');
    fireEvent.change(heightInput, { target: { value: "5'8\"" } });
    fireEvent.blur(heightInput);
    const { heightFt, heightIn } = usePatientStore.getState().record.personal;
    expect(heightFt).toBe(5);
    expect(heightIn).toBe(8);
  });

  it('weight is saved to store on blur', () => {
    render(<PersonalDetailsForm />);
    const weightInput = screen.getByLabelText('Weight (lbs)');
    fireEvent.change(weightInput, { target: { value: '145' } });
    fireEvent.blur(weightInput);
    expect(usePatientStore.getState().record.personal.weightLbs).toBe(145);
  });

  it('switching to Metric converts displayed height without losing stored ft/in', () => {
    usePatientStore.getState().updatePersonal({ heightFt: 5, heightIn: 8 });
    render(<PersonalDetailsForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Metric' }));
    // 5'8" = 172.72 cm → rounds to 173
    const input = screen.getByLabelText('Height (cm)') as HTMLInputElement;
    expect(input.value).toBe('173');
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

  it('typing in relationship updates the store', () => {
    render(<EmergencyContactForm />);
    fireEvent.change(screen.getByLabelText('Relationship'), { target: { value: 'Spouse' } });
    expect(usePatientStore.getState().record.emergencyContact.relationship).toBe('Spouse');
  });

  it('typing in phone stores the formatted value', () => {
    render(<EmergencyContactForm />);
    fireEvent.change(screen.getByLabelText('Phone'), { target: { value: '5551234567' } });
    // formatPhone transforms digits into (555) 123-4567
    expect(usePatientStore.getState().record.emergencyContact.phone).toBe('(555) 123-4567');
  });

  it('"On file" badge appears when name is set', () => {
    usePatientStore.getState().updateEmergencyContact({ name: 'Carlos' });
    render(<EmergencyContactForm />);
    expect(screen.getByText('On file')).toBeInTheDocument();
  });

  it('"On file" badge is absent when name is empty', () => {
    render(<EmergencyContactForm />);
    expect(screen.queryByText('On file')).not.toBeInTheDocument();
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

  it('typing in the substance field updates the store', () => {
    usePatientStore.getState().addAllergy(newAllergy());
    render(<AllergyList />);
    fireEvent.change(screen.getByPlaceholderText('e.g. Penicillin'), {
      target: { value: 'Peanuts' },
    });
    expect(usePatientStore.getState().record.allergies[0].substance).toBe('Peanuts');
  });

  it('typing in the reaction field updates the store', () => {
    usePatientStore.getState().addAllergy(newAllergy());
    render(<AllergyList />);
    fireEvent.change(screen.getByPlaceholderText('e.g. Hives, rash'), {
      target: { value: 'Anaphylaxis' },
    });
    expect(usePatientStore.getState().record.allergies[0].reaction).toBe('Anaphylaxis');
  });

  it('substance and reaction edits target the correct allergy by id when multiple exist', () => {
    const a1 = newAllergy(); a1.substance = 'Penicillin';
    const a2 = newAllergy(); a2.substance = 'Peanuts';
    usePatientStore.getState().addAllergy(a1);
    usePatientStore.getState().addAllergy(a2);
    render(<AllergyList />);

    const substanceInputs = screen.getAllByPlaceholderText('e.g. Penicillin');
    fireEvent.change(substanceInputs[0], { target: { value: 'Shellfish' } });

    const { allergies } = usePatientStore.getState().record;
    expect(allergies.find((a) => a.id === a1.id)?.substance).toBe('Shellfish');
    expect(allergies.find((a) => a.id === a2.id)?.substance).toBe('Peanuts');
  });

  it('the count badge updates after adding an allergy', () => {
    usePatientStore.getState().addAllergy(newAllergy());
    usePatientStore.getState().addAllergy(newAllergy());
    render(<AllergyList />);
    expect(screen.getByText('2 on file')).toBeInTheDocument();
  });
});
