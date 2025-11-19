import React, { useState, useEffect } from 'react';
import { api } from '../api/api';

interface Notificacion {
  id: number;
  tipo: string;
  mensaje: string;
  estado: string;
  creado_en: string;
  presupuesto_id: number;
  version_presupuesto: number;
  paciente: string;
  dni_paciente: string;
}

const NotificationBell: React.FC = () => {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

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
    }
  };

  const fetchNotifications = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await api.get('/notificaciones?limit=10');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notificaciones/${id}/leer`);
      await fetchCount();
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notificaciones/leer-todas');
      await fetchCount();
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleToggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
    }
  };

  const formatearFecha = (fecha: string) => {
    const now = new Date();
    const notifDate = new Date(fecha);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return notifDate.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case 'pendiente': return '⏳';
      case 'aprobado': return '✅';
      case 'rechazado': return '❌';
      case 'nueva_version': return '🔄';
      default: return '📋';
    }
  };

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'pendiente': return 'border-l-yellow-400';
      case 'aprobado': return 'border-l-green-400';
      case 'rechazado': return 'border-l-red-400';
      case 'nueva_version': return 'border-l-blue-400';
      default: return 'border-l-gray-400';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleDropdown}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6a2 2 0 01-2-2V7a2 2 0 012-2h5m5 0v6m0 0l3-3m-3 3l-3-3" />
        </svg>
        
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Notificaciones</h3>
              {count > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Marcar todas leídas
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Cargando notificaciones...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-4xl mb-2">🔔</div>
                <div>No hay notificaciones</div>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer border-l-4 ${getColorTipo(notif.tipo)} ${
                    notif.estado === 'nuevo' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-lg">{getIconoTipo(notif.tipo)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notif.estado === 'nuevo' ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                        {notif.mensaje}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500">
                          {notif.paciente} (DNI: {notif.dni_paciente})
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatearFecha(notif.creado_en)}
                        </p>
                      </div>
                    </div>
                    {notif.estado === 'nuevo' && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <button
                onClick={() => setShowDropdown(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;