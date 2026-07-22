import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import ClientCartoesPage from './pages/ClientCartoesPage';
import ClientAgendamentosPage from './pages/ClientAgendamentosPage';
import PerfilPage from './pages/PerfilPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageFuncionarios from './pages/admin/ManageFuncionarios';
import AdminAgendasPage from './pages/admin/AdminAgendasPage';
import AdminCartoesPage from './pages/admin/AdminCartoesPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { AuthProvider } from './context/AuthContext';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cartoes"
            element={
              <ProtectedRoute>
                <ClientCartoesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agendamentos"
            element={
              <ProtectedRoute>
                <ClientAgendamentosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/funcionarios"
            element={
              <AdminRoute>
                <ManageFuncionarios />
              </AdminRoute>
            }
          />
          <Route
            path="/relatorios"
            element={
              <AdminRoute>
                <AdminReportsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute>
                <PerfilPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/funcionarios"
            element={
              <AdminRoute>
                <ManageFuncionarios />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/agendas"
            element={
              <AdminRoute>
                <AdminAgendasPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/cartoes"
            element={
              <AdminRoute>
                <AdminCartoesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/relatorios"
            element={
              <AdminRoute>
                <AdminReportsPage />
              </AdminRoute>
            }
          />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <NotFoundPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
