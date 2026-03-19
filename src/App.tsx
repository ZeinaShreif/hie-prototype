import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
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
      <nav className="flex gap-4 p-4 bg-slate-100">
        <NavLink to="/">Overview</NavLink>
        <NavLink to="/profile">Profile</NavLink>
        <NavLink to="/medications">Medications</NavLink>
        <NavLink to="/vaccinations">Vaccinations</NavLink>
        <NavLink to="/procedures">Procedures</NavLink>
        <NavLink to="/insurance">Insurance</NavLink>
        <NavLink to="/share">Share</NavLink>
      </nav>
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
    </BrowserRouter>
  );
}
