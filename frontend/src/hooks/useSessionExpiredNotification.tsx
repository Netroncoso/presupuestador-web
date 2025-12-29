import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { api } from '../api/api';

export const useSessionExpiredNotification = () => {
  useEffect(() => {
    const unsubscribe = api.subscribeToUnauthorized(() => {
      notifications.show({
        title: 'Sesión expirada',
        message: 'Por favor inicia sesión nuevamente',
        color: 'red',
        autoClose: 5000,
      });
    });
    return unsubscribe;
  }, []);
};
