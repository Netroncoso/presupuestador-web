import { useState, useEffect } from 'react';
import { api } from '../api/api';

export const useNotificationCount = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000); // Cada 30s
    return () => clearInterval(interval);
  }, []);

  const fetchCount = async () => {
    try {
      const response = await api.get('/notificaciones/count');
      setCount(response.data.count);
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setCount(0);
    }
  };

  return { count, refreshCount: fetchCount };
};