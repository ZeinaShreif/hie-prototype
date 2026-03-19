import { describe, it, expect } from 'vitest';

const pages = [
  { name: 'OverviewPage', path: '/' },
  { name: 'ProfilePage', path: '/profile' },
  { name: 'MedicationsPage', path: '/medications' },
  { name: 'VaccinationsPage', path: '/vaccinations' },
  { name: 'ProceduresPage', path: '/procedures' },
  { name: 'InsurancePage', path: '/insurance' },
  { name: 'SharePage', path: '/share' },
];

describe('page modules exist and export a default component', () => {
  it.each(pages)('$name exports a default function', async ({ name }) => {
    const mod = await import(`./${name}`);
    expect(typeof mod.default).toBe('function');
  });
});
