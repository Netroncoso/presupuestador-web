import { useRealtimeUpdates } from './useRealtimeUpdates';
import { api } from '../api/api';

export const useNotificationCount = () => {
  const { notifications, isConnected } = useRealtimeUpdates();

  // Fallback manual refresh function
  const refreshCount = async () => {
    try {
      const response = await api.get('/notificaciones/count');
      return response.data.count;
    } catch (error) {
      console.error('Error fetching notification count:', error);
      return 0;
    }
  };

  return { 
    count: notifications, 
    refreshCount,
    isConnected 
  };
};