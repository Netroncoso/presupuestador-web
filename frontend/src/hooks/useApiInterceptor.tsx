import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/api';

export const useApiInterceptor = () => {
  const { logout } = useAuth();

  useEffect(() => {
    const unsubscribe = api.subscribeToUnauthorized(() => {
      logout();
    });
    return unsubscribe;
  }, [logout]);
};
