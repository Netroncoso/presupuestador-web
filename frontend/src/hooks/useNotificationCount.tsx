import { useRealtimeUpdates } from './useRealtimeUpdates';
import { api } from '../api/api';

export const useNotificationCount = () => {
  const { notifications, notificationsList, isConnected, refreshData } = useRealtimeUpdates();

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
    list: notificationsList,
    refreshCount,
    refreshData,
    isConnected 
  };
};