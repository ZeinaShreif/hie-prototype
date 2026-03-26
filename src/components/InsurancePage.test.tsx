import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { usePatientStore } from '../core/store';
import InsurancePage from '../pages/InsurancePage';
import InsurancePrimaryForm from './InsurancePrimaryForm';
import InsuranceSecondaryForm from './InsuranceSecondaryForm';

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
// InsurancePage
// ---------------------------------------------------------------------------

describe('InsurancePage', () => {
  it('renders both the primary and secondary insurance sections', () => {
    render(<InsurancePage />);
    expect(screen.getByText('Primary Insurance')).toBeInTheDocument();
    expect(screen.getByText('Secondary Insurance')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// InsurancePrimaryForm
// ---------------------------------------------------------------------------

describe('InsurancePrimaryForm', () => {
  it('renders all six fields', () => {
    render(<InsurancePrimaryForm />);
    expect(screen.getByLabelText('Insurance Carrier')).toBeInTheDocument();
    expect(screen.getByLabelText('Plan Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Member ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Group Number')).toBeInTheDocument();
    expect(screen.getByLabelText('Policy Holder Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Effective Date')).toBeInTheDocument();
  });

  it('typing in carrier calls updateInsurancePrimary with the new value', () => {
    render(<InsurancePrimaryForm />);
    fireEvent.change(screen.getByLabelText('Insurance Carrier'), {
      target: { value: 'Blue Cross' },
    });
    expect(usePatientStore.getState().record.insurancePrimary?.carrier).toBe('Blue Cross');
  });

  it('typing in memberId calls updateInsurancePrimary with the new value', () => {
    render(<InsurancePrimaryForm />);
    fireEvent.change(screen.getByLabelText('Member ID'), {
      target: { value: 'XYZ123' },
    });
    expect(usePatientStore.getState().record.insurancePrimary?.memberId).toBe('XYZ123');
  });
});

// ---------------------------------------------------------------------------
// InsuranceSecondaryForm
// ---------------------------------------------------------------------------

describe('InsuranceSecondaryForm', () => {
  it('renders the Secondary Insurance section even when insuranceSecondary is null', () => {
    // insuranceSecondary is null after clearAll() in beforeEach
    render(<InsuranceSecondaryForm />);
    expect(screen.getByText('Secondary Insurance')).toBeInTheDocument();
  });

  it('shows the Add secondary insurance button when insuranceSecondary is null', () => {
    render(<InsuranceSecondaryForm />);
    expect(
      screen.getByRole('button', { name: 'Add secondary insurance' })
    ).toBeInTheDocument();
  });

  it('typing in a field after opting in initialises the secondary insurance object', () => {
    render(<InsuranceSecondaryForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Add secondary insurance' }));
    fireEvent.change(screen.getByLabelText('Insurance Carrier'), {
      target: { value: 'Aetna' },
    });
    expect(usePatientStore.getState().record.insuranceSecondary?.carrier).toBe('Aetna');
  });

  it('shows the Remove button when the form is open', () => {
    render(<InsuranceSecondaryForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Add secondary insurance' }));
    expect(screen.getByRole('button', { name: 'Remove secondary insurance' })).toBeInTheDocument();
  });

  it('clicking Remove clears insuranceSecondary in the store and collapses back to the add button', () => {
    usePatientStore.getState().updateInsuranceSecondary({ carrier: 'Aetna' });
    render(<InsuranceSecondaryForm />);
    fireEvent.click(screen.getByRole('button', { name: 'Remove secondary insurance' }));
    expect(usePatientStore.getState().record.insuranceSecondary).toBeNull();
    expect(screen.getByRole('button', { name: 'Add secondary insurance' })).toBeInTheDocument();
  });
});
