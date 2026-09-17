import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RegisterOfficerPage from './pages/RegisterOfficerPage';
import RegisterAdminPage from './pages/RegisterAdminPage';
import CitizenDashboard from './pages/CitizenDashboard';
import CreateGrievancePage from './pages/CreateGrievancePage';
import MyGrievancesPage from './pages/MyGrievancesPage';
import GrievanceDetailPage from './pages/GrievanceDetailPage';
import AdminDashboard from './pages/AdminDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import OfficerGrievanceDetailPage from './pages/OfficerGrievanceDetail';
import AdminMapPage from './pages/AdminMapPage';
import NotificationsPage from './pages/NotificationsPage';
import CitizenAssistantWidget from './components/assistant/CitizenAssistantWidget';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/citizen" element={<RegisterPage />} />
              <Route path="/register/officer" element={<RegisterOfficerPage />} />
              <Route path="/register/admin" element={<RegisterAdminPage />} />

              {/* Protected Citizen Routes */}
              <Route path="/citizen" element={<Navigate to="/dashboard" replace />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <CitizenDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grievances"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <MyGrievancesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grievances/new"
                element={
                  <ProtectedRoute allowedRoles={['citizen']}>
                    <CreateGrievancePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/grievances/:id"
                element={
                  <ProtectedRoute>
                    <GrievanceDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Officer Routes */}
              <Route
                path="/officer"
                element={
                  <ProtectedRoute allowedRoles={['officer']}>
                    <OfficerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/grievances/:id"
                element={
                  <ProtectedRoute allowedRoles={['officer']}>
                    <OfficerGrievanceDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Protected Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/map"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminMapPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <CitizenAssistantWidget />
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;