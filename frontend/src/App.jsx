import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import './styles/global.css';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ClientCartoesPage = lazy(() => import('./pages/ClientCartoesPage'));
const ClientAgendamentosPage = lazy(() => import('./pages/ClientAgendamentosPage'));
const PerfilPage = lazy(() => import('./pages/PerfilPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const ManageFuncionarios = lazy(() => import('./pages/admin/ManageFuncionarios'));
const AdminAgendasPage = lazy(() => import('./pages/admin/AdminAgendasPage'));
const AdminCartoesPage = lazy(() => import('./pages/admin/AdminCartoesPage'));
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'));

function AppFallback() {
  return (
    <div className="app-loading-shell" role="status" aria-live="polite">
      <div className="loading-card">
        <div className="loading-card__pulse" />
        <p>Carregando sua área da clínica...</p>
      </div>
    </div>
  );
}

function withSuspense(element) {
  return <Suspense fallback={<AppFallback />}>{element}</Suspense>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={withSuspense(<LoginPage />)} />
          <Route path="/" element={withSuspense(<ProtectedRoute><DashboardPage /></ProtectedRoute>)} />
          <Route path="/cartoes" element={withSuspense(<ProtectedRoute><ClientCartoesPage /></ProtectedRoute>)} />
          <Route path="/agendamentos" element={withSuspense(<ProtectedRoute><ClientAgendamentosPage /></ProtectedRoute>)} />
          <Route path="/funcionarios" element={withSuspense(<AdminRoute><ManageFuncionarios /></AdminRoute>)} />
          <Route path="/relatorios" element={withSuspense(<AdminRoute><AdminReportsPage /></AdminRoute>)} />
          <Route path="/perfil" element={withSuspense(<ProtectedRoute><PerfilPage /></ProtectedRoute>)} />
          <Route path="/admin" element={withSuspense(<AdminRoute><AdminDashboard /></AdminRoute>)} />
          <Route path="/admin/funcionarios" element={withSuspense(<AdminRoute><ManageFuncionarios /></AdminRoute>)} />
          <Route path="/admin/agendas" element={withSuspense(<AdminRoute><AdminAgendasPage /></AdminRoute>)} />
          <Route path="/admin/cartoes" element={withSuspense(<AdminRoute><AdminCartoesPage /></AdminRoute>)} />
          <Route path="/admin/relatorios" element={withSuspense(<AdminRoute><AdminReportsPage /></AdminRoute>)} />
          <Route path="*" element={withSuspense(<ProtectedRoute><NotFoundPage /></ProtectedRoute>)} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
