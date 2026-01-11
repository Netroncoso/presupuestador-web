import React, { Suspense } from 'react';
import { MantineProvider, Loader, Center, ScrollArea } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useApiInterceptor } from './hooks/useApiInterceptor';
import { useSessionExpiredNotification } from './hooks/useSessionExpiredNotification';
import Login from './components/Login';
import './styles/global.css';

const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const GerenciaAdministrativa = React.lazy(() => import('./pages/GerenciaAdministrativa'));
const GerenciaPrestacional = React.lazy(() => import('./pages/GerenciaPrestacional'));
const GerenciaGeneral = React.lazy(() => import('./pages/GerenciaGeneral'));
const OperadorCargaDashboard = React.lazy(() => import('./pages/OperadorCargaDashboard'));
const GerenciaFinanciera = React.lazy(() => import('./pages/GerenciaFinanciera'));

function AppContent() {
  const { user, loading } = useAuth();
  useApiInterceptor();
  useSessionExpiredNotification();

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
      case 'gerencia_administrativa':
        return <GerenciaAdministrativa />;
      case 'gerencia_prestacional':
        return <GerenciaPrestacional />;
      case 'gerencia_general':
        return <GerenciaGeneral />;
      case 'gerencia_financiera':
        return <GerenciaFinanciera />;
      case 'operador_carga':
        return <OperadorCargaDashboard />;
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
    <MantineProvider
      theme={{
        components: {
          Modal: { 
            defaultProps: { 
              scrollAreaComponent: ScrollArea.Autosize
            },
            styles: {
              title: {
                fontWeight: 600
              }
            }
          },
          Select: {
            defaultProps: {
              checkIconPosition: 'right'
            }
          }
        }
      }}
    >
      <Notifications />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </MantineProvider>
  );
}
