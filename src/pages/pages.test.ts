import { describe, it, expect } from 'vitest';
import OverviewPage from './OverviewPage';
import ProfilePage from './ProfilePage';
import MedicationsPage from './MedicationsPage';
import VaccinationsPage from './VaccinationsPage';
import ProceduresPage from './ProceduresPage';
import InsurancePage from './InsurancePage';
import SharePage from './SharePage';

const pages = [
  { name: 'OverviewPage',    mod: OverviewPage    },
  { name: 'ProfilePage',     mod: ProfilePage     },
  { name: 'MedicationsPage', mod: MedicationsPage },
  { name: 'VaccinationsPage',mod: VaccinationsPage},
  { name: 'ProceduresPage',  mod: ProceduresPage  },
  { name: 'InsurancePage',   mod: InsurancePage   },
  { name: 'SharePage',       mod: SharePage       },
];

describe('page modules exist and export a default component', () => {
  it.each(pages)('$name exports a default function', ({ mod }) => {
    expect(typeof mod).toBe('function');
  });
});
