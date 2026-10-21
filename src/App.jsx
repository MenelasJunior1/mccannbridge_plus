'use client';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import DashboardLayout from './components/layout/DashboardLayout';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/Landing/LandingPage';
import TrafficIAPage from './pages/TrafficIA/TrafficIAPage';
import BriefsPage from './pages/Briefs/BriefsPage';
import CalendarPage from './pages/Calendar/CalendarPage';
import ValidationPage from './pages/Validation/ValidationPage';
import InfluencePage from './pages/Influence/InfluencePage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import FinancePage from './pages/Finance/FinancePage';

import UsersPage from './pages/Users/UsersPage';

import ReportsPage from './pages/Reports/ReportsPage';
import DocumentsPage from './pages/Documents/DocumentsPage';
import TasksPage from './pages/Tasks/TasksPage';
import GrowthPage from './pages/Growth/GrowthPage';
import AssistantIAPage from './pages/AssistantIA/AssistantIAPage';
import MonitoringPage from './pages/Monitoring/MonitoringPage';
import PromptLibraryPage from './pages/PromptLibrary/PromptLibraryPage';
import AdminIAPage from './pages/AdminIA/AdminIAPage';
function ProtectedRoutes() {
  const { isAuthenticated, isAgency, isClient, user, loadingAuth } = useAuth();
  if (loadingAuth) return <div className="next-app-loading"><span /><strong>Vérification de la session…</strong></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const canAccessInternalOps = isAgency && !isClient && user?.role !== 'client';

  return (
    <AppProvider>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/traffic" element={<TrafficIAPage />} />
          {isAgency && <Route path="/assistant-ia" element={<AssistantIAPage />} />}
          {user?.systemRole === 'super_admin' && <Route path="/monitoring" element={<MonitoringPage />} />}
          {isAgency && <Route path="/prompts" element={<PromptLibraryPage />} />}
          <Route path="/briefs" element={<BriefsPage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/validation" element={<ValidationPage />} />
          <Route path="/influence" element={<InfluencePage />} />
          <Route path="/influence/:talentId" element={<InfluencePage />} />
          {canAccessInternalOps ? (
            <Route path="/dashboard" element={<DashboardPage />} />
          ) : (
            <Route path="/dashboard" element={<Navigate to="/reports" replace />} />
          )}
          <Route path="/finance" element={<FinancePage />} />

          {canAccessInternalOps ? (
            <Route path="/users" element={<UsersPage />} />
          ) : (
            <Route path="/users" element={<Navigate to="/reports" replace />} />
          )}
          {isAgency && <Route path="/admin-ia" element={<AdminIAPage />} />}

          <Route path="/reports" element={<ReportsPage />} />
          {isAgency && <Route path="/documents" element={<DocumentsPage />} />}
          <Route path="/tasks" element={<TasksPage />} />
          {isAgency && <Route path="/growth" element={<GrowthPage />} />}
          <Route path="*" element={<Navigate to={isAgency ? "/traffic" : "/briefs"} replace />} />
        </Route>
      </Routes>
    </AppProvider>
  );
}

function AppRoutes() {
  const { isAuthenticated, isAgency, loadingAuth } = useAuth();
  if (loadingAuth) return <div className="next-app-loading"><span /><strong>Chargement…</strong></div>;
  const workspacePath = isAgency ? '/traffic' : '/briefs';

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={workspacePath} replace /> : <LoginPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
