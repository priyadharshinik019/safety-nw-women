import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SOSProvider } from './context/SOSContext';
import FakeCallPage from './pages/FakeCallPage';

import LoginPage    from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage     from './pages/HomePage';
import ContactsPage from './pages/ContactsPage';
import HistoryPage  from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import BottomNav    from './components/BottomNav';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh' }}>
      <div className="spinner" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <SOSProvider>
        <div className="app-shell">
          <Routes>
            <Route path="/login"    element={user ? <Navigate to="/" replace /> : <LoginPage />} />
            <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
            <Route path="/" element={
              <ProtectedRoute><HomePage /></ProtectedRoute>
            }/>
            <Route path="/contacts" element={
              <ProtectedRoute><ContactsPage /></ProtectedRoute>
            }/>
            <Route path="/history" element={
              <ProtectedRoute><HistoryPage /></ProtectedRoute>
            }/>
            <Route path="/settings" element={
              <ProtectedRoute><SettingsPage /></ProtectedRoute>
            }/>
           <Route path="/fake-call" element={
              <ProtectedRoute><FakeCallPage /></ProtectedRoute>
             }/>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {user && <BottomNav />}
        </div>
      </SOSProvider>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
