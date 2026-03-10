import { useState, useEffect, useRef } from 'react';
import { api } from '../api/api';
import { notifications } from '@mantine/notifications';

interface RealtimeData {
  notifications: number;
  notificationsList?: any[];
  presupuestos?: any[];
}

export const useRealtimeUpdates = () => {
  const [data, setData] = useState<RealtimeData>({ notifications: 0 });
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const retryCountRef = useRef(0);
  const maxRetries = 5;
  const fallbackIntervalRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const NOTIFICATION_ID = 'sse-connection-error';

  const refreshData = async () => {
    try {
      const [notifResponse] = await Promise.all([
        api.get('/notificaciones/count')
      ]);
      
      setData(prev => ({
        ...prev,
        notifications: notifResponse.data.count
      }));
      
      lastUpdateRef.current = Date.now();
    } catch (error) {
      if (error instanceof Error && error.message !== 'Sesión expirada') {
        console.error('Error refreshing data:', error);
      }
    }
  };

  useEffect(() => {
    const connectSSE = () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const eventSource = new EventSource(`/api/sse/updates?token=${encodeURIComponent(token)}`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          retryCountRef.current = 0;
          lastUpdateRef.current = Date.now();
          notifications.hide(NOTIFICATION_ID);
        };

        eventSource.addEventListener('notifications', (event) => {
          const notificationData = JSON.parse(event.data);
          setData(prev => ({ 
            ...prev, 
            notifications: notificationData.count,
            notificationsList: notificationData.list || prev.notificationsList
          }));
          lastUpdateRef.current = Date.now();
        });

        eventSource.addEventListener('presupuestos', (event) => {
          const presupuestosData = JSON.parse(event.data);
          setData(prev => ({ ...prev, presupuestos: presupuestosData.pendientes }));
          lastUpdateRef.current = Date.now();
        });

        eventSource.onerror = () => {
          setIsConnected(false);
          eventSource.close();
          
          const currentToken = localStorage.getItem('token');
          if (currentToken) {
            retryCountRef.current++;
            if (retryCountRef.current > maxRetries) {
              retryCountRef.current = 1;
            }
            
            if (retryCountRef.current === maxRetries) {
              notifications.show({
                id: NOTIFICATION_ID,
                title: 'Conexión perdida',
                message: 'No se reciben actualizaciones. El sistema intentará reconectar.',
                color: 'red',
                autoClose: false,
                withCloseButton: true,
              });
            }

            const delay = Math.min(2000 * retryCountRef.current, 10000);
            setTimeout(connectSSE, delay);
          }
        };

      } catch (error) {
        setIsConnected(false);
        
        const currentToken = localStorage.getItem('token');
        if (currentToken && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.min(5000 * retryCountRef.current, 30000);
          setTimeout(connectSSE, delay);
        }
      }
    };

    connectSSE();

    // Fallback polling eliminado - SSE maneja reconexión automática

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' && e.newValue) {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        retryCountRef.current = 0;
        connectSSE();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    notifications: data.notifications,
    notificationsList: data.notificationsList,
    presupuestos: data.presupuestos,
    isConnected,
    refreshData
  };
};