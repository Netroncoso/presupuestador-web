import React from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Login />;
  }

  if (user.rol === 'admin') {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}

export default function App() {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <Notifications />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MantineProvider>
  );
}