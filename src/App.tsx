import { BrowserRouter, Routes, Route } from 'react-router-dom';
import PageHeader from './components/PageHeader';
import OverviewPage from './pages/OverviewPage';
import ProfilePage from './pages/ProfilePage';
import MedicationsPage from './pages/MedicationsPage';
import VaccinationsPage from './pages/VaccinationsPage';
import ProceduresPage from './pages/ProceduresPage';
import InsurancePage from './pages/InsurancePage';
import SharePage from './pages/SharePage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white">
        <div
          className="mx-auto bg-ice-50 overflow-hidden"
          style={{ maxWidth: 480, borderRadius: 20, border: '1.5px solid var(--ice-border)', minHeight: '100vh' }}
        >
          <PageHeader />
          <main>
            <Routes>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/medications" element={<MedicationsPage />} />
              <Route path="/vaccinations" element={<VaccinationsPage />} />
              <Route path="/procedures" element={<ProceduresPage />} />
              <Route path="/insurance" element={<InsurancePage />} />
              <Route path="/share" element={<SharePage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
