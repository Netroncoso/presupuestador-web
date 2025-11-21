import React, { Suspense } from 'react';
import { MantineProvider, Loader, Center } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import './styles/global.css';

const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AuditorDashboard = React.lazy(() => import('./pages/AuditorDashboard'));

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!user) {
    return <Login />;
  }

  const getDashboard = () => {
    switch (user.rol) {
      case 'admin':
        return <AdminDashboard />;
      case 'auditor_medico':
        return <AuditorDashboard />;
      default:
        return <UserDashboard />;
    }
  };

  return (
    <Suspense fallback={<Center h="100vh"><Loader size="lg" /></Center>}>
      {getDashboard()}
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
