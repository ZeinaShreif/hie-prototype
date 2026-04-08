import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { usePatientStore } from '../core/store';
import LandingPage from './LandingPage';

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

function renderLanding() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorageMock.clear();
  usePatientStore.getState().clearAll();
});

// ---------------------------------------------------------------------------
// Top strip
// ---------------------------------------------------------------------------

describe('LandingPage — top strip', () => {
  it('falls back to "Your Name" when no name is set', () => {
    renderLanding();
    expect(screen.getByText('Your Name')).toBeInTheDocument();
  });

  it('displays the patient full name from the store', () => {
    usePatientStore.getState().updatePersonal({ firstName: 'Jane', lastName: 'Doe' });
    renderLanding();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });

  it('displays only first name when last name is missing', () => {
    usePatientStore.getState().updatePersonal({ firstName: 'Jane', lastName: '' });
    renderLanding();
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  it('renders a Settings button', () => {
    renderLanding();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('renders a Sign out button', () => {
    renderLanding();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('Settings is a button, not a link', () => {
    renderLanding();
    const btn = screen.getByRole('button', { name: 'Settings' });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).not.toHaveAttribute('href');
  });

  it('Sign out is a button, not a link', () => {
    renderLanding();
    const btn = screen.getByRole('button', { name: 'Sign out' });
    expect(btn.tagName).toBe('BUTTON');
    expect(btn).not.toHaveAttribute('href');
  });
});

// ---------------------------------------------------------------------------
// Hero pitch
// ---------------------------------------------------------------------------

describe('LandingPage — hero pitch', () => {
  it('renders the Health part of the wordmark', () => {
    renderLanding();
    expect(screen.getByText('Health')).toBeInTheDocument();
  });

  it('renders the Pass part of the wordmark', () => {
    renderLanding();
    expect(screen.getByText('Pass')).toBeInTheDocument();
  });

  it('renders the main heading', () => {
    renderLanding();
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/Your health story/i);
    expect(heading).toHaveTextContent(/in your hands/i);
  });

  it('renders the subtitle', () => {
    renderLanding();
    expect(screen.getByText(/Keep your medical information/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Navigation folders — labels
// ---------------------------------------------------------------------------

describe('LandingPage — folder labels', () => {
  it('renders the Overview folder', () => {
    renderLanding();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('renders all six section folder labels', () => {
    renderLanding();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Medications')).toBeInTheDocument();
    expect(screen.getByText('Vaccines')).toBeInTheDocument();
    expect(screen.getByText('Procedures')).toBeInTheDocument();
    expect(screen.getByText('Insurance')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('renders all folder descriptions', () => {
    renderLanding();
    expect(screen.getByText('Your health summary at a glance')).toBeInTheDocument();
    expect(screen.getByText('Details, contacts & allergies')).toBeInTheDocument();
    expect(screen.getByText('Dosage & reminders')).toBeInTheDocument();
    expect(screen.getByText('Vaccination history')).toBeInTheDocument();
    expect(screen.getByText('Surgeries & treatments')).toBeInTheDocument();
    expect(screen.getByText('Primary & secondary plans')).toBeInTheDocument();
    expect(screen.getByText('QR codes & provider access')).toBeInTheDocument();
  });

  it('renders all folder tab labels', () => {
    renderLanding();
    expect(screen.getByText('Start here')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
    expect(screen.getByText('Rx')).toBeInTheDocument();
    expect(screen.getByText('Immunization')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Coverage')).toBeInTheDocument();
    expect(screen.getByText('Access')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Navigation folders — links
// ---------------------------------------------------------------------------

describe('LandingPage — folder links', () => {
  it('Overview folder links to /overview', () => {
    renderLanding();
    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/overview')).toBe(true);
  });

  it('Profile folder links to /profile', () => {
    renderLanding();
    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/profile')).toBe(true);
  });

  it('Medications folder links to /medications', () => {
    renderLanding();
    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/medications')).toBe(true);
  });

  it('Vaccines folder links to /vaccinations', () => {
    renderLanding();
    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/vaccinations')).toBe(true);
  });

  it('Procedures folder links to /procedures', () => {
    renderLanding();
    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/procedures')).toBe(true);
  });

  it('Insurance folder links to /insurance', () => {
    renderLanding();
    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/insurance')).toBe(true);
  });

  it('Share folder links to /share', () => {
    renderLanding();
    const links = screen.getAllByRole('link');
    expect(links.some(l => l.getAttribute('href') === '/share')).toBe(true);
  });

  it('renders exactly 7 folder links', () => {
    renderLanding();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(7);
  });
});

// ---------------------------------------------------------------------------
// Disclaimer warning box
// ---------------------------------------------------------------------------

describe('LandingPage — disclaimer warning box', () => {
  it('renders the warning box', () => {
    localStorageMock.setItem('hie_disclaimer_acknowledged', '1');
    renderLanding();
    expect(screen.getByText(/Demo prototype/i)).toBeInTheDocument();
  });

  it('renders the do-not-enter message', () => {
    localStorageMock.setItem('hie_disclaimer_acknowledged', '1');
    renderLanding();
    expect(screen.getByText(/do not enter real medical information/i)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Disclaimer modal
// ---------------------------------------------------------------------------

describe('LandingPage — disclaimer modal', () => {
  it('shows the modal on first visit (no localStorage flag)', () => {
    renderLanding();
    expect(screen.getByRole('button', { name: /I understand/i })).toBeInTheDocument();
  });

  it('does not show the modal when already acknowledged', () => {
    localStorageMock.setItem('hie_disclaimer_acknowledged', '1');
    renderLanding();
    expect(screen.queryByRole('button', { name: /I understand/i })).not.toBeInTheDocument();
  });

  it('dismisses the modal on acknowledge', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: /I understand/i }));
    expect(screen.queryByRole('button', { name: /I understand/i })).not.toBeInTheDocument();
  });

  it('sets the localStorage flag on acknowledge', () => {
    renderLanding();
    fireEvent.click(screen.getByRole('button', { name: /I understand/i }));
    expect(localStorageMock.getItem('hie_disclaimer_acknowledged')).toBe('1');
  });
});
