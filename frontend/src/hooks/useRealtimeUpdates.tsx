import { useState, useEffect, useRef } from 'react';
import { api } from '../api/api';

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

  // Fallback function to refresh data manually
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
      console.error('Error refreshing data:', error);
    }
  };

  useEffect(() => {
    const connectSSE = () => {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token found, skipping SSE connection');
          return;
        }

        // Create EventSource with token in URL (since headers aren't supported)
        const eventSource = new EventSource(`/api/stream/updates?token=${encodeURIComponent(token)}`);
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          retryCountRef.current = 0; // Reset retry count on successful connection
          lastUpdateRef.current = Date.now();
          console.log('SSE connected');
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

        eventSource.onerror = (error) => {
          setIsConnected(false);
          console.log('SSE error, reconnecting...', error);
          eventSource.close();
          
          // Always try to reconnect in development (Vite restarts)
          const currentToken = localStorage.getItem('token');
          if (currentToken) {
            retryCountRef.current++;
            // Reset retry count if it's been a while since last attempt
            if (retryCountRef.current > maxRetries) {
              retryCountRef.current = 1;
            }
            const delay = Math.min(2000 * retryCountRef.current, 10000); // Faster reconnection
            console.log(`Retrying SSE connection in ${delay}ms (attempt ${retryCountRef.current})`);
            setTimeout(connectSSE, delay);
          }
        };

      } catch (error) {
        console.error('Error connecting to SSE:', error);
        setIsConnected(false);
        
        // Only reconnect if we have a token and haven't exceeded max retries
        const currentToken = localStorage.getItem('token');
        if (currentToken && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          const delay = Math.min(5000 * retryCountRef.current, 30000);
          setTimeout(connectSSE, delay);
        }
      }
    };

    // Start SSE connection
    connectSSE();

    // Fallback polling every 20 seconds
    fallbackIntervalRef.current = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdateRef.current;
      // If no update in 30 seconds, refresh manually
      if (timeSinceLastUpdate > 30000) {
        console.log('No SSE updates for 30s, refreshing manually');
        refreshData();
      }
    }, 20000);

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
      }
    };
  }, []); // We don't add token as dependency to avoid reconnecting on every token change

  return {
    notifications: data.notifications,
    notificationsList: data.notificationsList,
    presupuestos: data.presupuestos,
    isConnected,
    refreshData
  };
};