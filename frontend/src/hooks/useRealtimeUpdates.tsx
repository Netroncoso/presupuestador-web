import { useState, useEffect, useRef } from 'react';

interface RealtimeData {
  notifications: number;
  presupuestos?: any[];
}

export const useRealtimeUpdates = () => {
  const [data, setData] = useState<RealtimeData>({ notifications: 0 });
  const eventSourceRef = useRef<EventSource | null>(null);
  const [isConnected, setIsConnected] = useState(false);

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
          console.log('SSE connected');
        };

        eventSource.addEventListener('notifications', (event) => {
          const notificationData = JSON.parse(event.data);
          setData(prev => ({ ...prev, notifications: notificationData.count }));
        });

        eventSource.addEventListener('presupuestos', (event) => {
          const presupuestosData = JSON.parse(event.data);
          setData(prev => ({ ...prev, presupuestos: presupuestosData.pendientes }));
        });

        eventSource.onerror = (error) => {
          setIsConnected(false);
          console.log('SSE error, reconnecting...', error);
          eventSource.close();
          
          // Only reconnect if we have a token
          const currentToken = localStorage.getItem('token');
          if (currentToken) {
            setTimeout(connectSSE, 3000); // Reconectar en 3s
          } else {
            console.log('No token available, stopping reconnection attempts');
          }
        };

      } catch (error) {
        console.error('Error connecting to SSE:', error);
        setIsConnected(false);
        
        // Only reconnect if we have a token
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
          setTimeout(connectSSE, 3000);
        }
      }
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []); // We don't add token as dependency to avoid reconnecting on every token change

  return {
    notifications: data.notifications,
    presupuestos: data.presupuestos,
    isConnected
  };
};