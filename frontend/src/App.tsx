import React, { Suspense } from 'react';
import { MantineProvider, Loader, Center } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import './styles/global.css';

const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Suspense fallback={<Center h="100vh"><Loader size="lg" /></Center>}>
      {user.rol === 'admin' ? <AdminDashboard /> : <UserDashboard />}
    </Suspense>
  );
}

export default function App() {
  return (
    <MantineProvider>
      <Notifications />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MantineProvider>
  );
}
