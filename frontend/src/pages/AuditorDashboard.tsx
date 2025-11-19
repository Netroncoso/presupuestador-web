import React, { useState, useEffect } from 'react';
import { api } from '../api/api';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';

interface PresupuestoPendiente {
  idPresupuestos: number;
  version: number;
  estado: string;
  Nombre_Apellido: string;
  DNI: string;
  Sucursal: string;
  costo_total: number;
  rentabilidad: number;
  dificil_acceso: string;
  created_at: string;
  creador: string;
  sucursal_nombre: string;
  dias_pendiente: number;
}

const AuditorDashboard: React.FC = () => {
  const [pendientes, setPendientes] = useState<PresupuestoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<number | null>(null);
  const [comentario, setComentario] = useState('');
  const [procesando, setProcesando] = useState(false);
  const { presupuestos, isConnected } = useRealtimeUpdates();

  useEffect(() => {
    cargarPendientes();
  }, []);
  
  // Update pendientes when SSE data arrives
  useEffect(() => {
    if (presupuestos && presupuestos.length >= 0) {
      setPendientes(presupuestos);
      setLoading(false);
    }
  }, [presupuestos]);

  const cargarPendientes = async () => {
    try {
      const response = await api.get('/v2/presupuestos/auditor/pendientes');
      setPendientes(response.data);
    } catch (error) {
      console.error('Error cargando pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstado = async (id: number, nuevoEstado: string) => {
    setProcesando(true);
    try {
      await api.put(`/v2/presupuestos/${id}/estado`, {
        estado: nuevoEstado,
        comentario: comentario.trim() || null
      });
      
      // Actualizar lista
      await cargarPendientes();
      setSelectedPresupuesto(null);
      setComentario('');
      
      alert(`Presupuesto ${nuevoEstado.toUpperCase()} correctamente`);
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar estado');
    } finally {
      setProcesando(false);
    }
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getColorEstado = (estado: string) => {
    switch (estado) {
      case 'pendiente': return 'bg-yellow-100 text-yellow-800';
      case 'en_revision': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getColorDias = (dias: number) => {
    if (dias > 7) return 'text-red-600 font-bold';
    if (dias > 3) return 'text-orange-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Cargando presupuestos pendientes...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Auditor Médico</h1>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-gray-600">
            {pendientes.length} presupuesto{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''} de revisión
          </p>
          <div className={`flex items-center gap-2 text-sm ${
            isConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            {isConnected ? 'Activo' : 'Desconectado'}
          </div>
        </div>
      </div>

      {pendientes.length === 0 ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-green-600 text-xl mb-2">✅ ¡Todo al día!</div>
          <div className="text-green-700">No hay presupuestos pendientes de revisión</div>
        </div>
      ) : (
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Versión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Costo Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rentabilidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días Pendiente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Creador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendientes.map((presupuesto) => (
                  <tr key={presupuesto.idPresupuestos} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {presupuesto.Nombre_Apellido}
                        </div>
                        <div className="text-sm text-gray-500">
                          DNI: {presupuesto.DNI}
                        </div>
                        {presupuesto.dificil_acceso === 'SI' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-1">
                            Difícil Acceso
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        v{presupuesto.version}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getColorEstado(presupuesto.estado)}`}>
                        {presupuesto.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${presupuesto.costo_total?.toLocaleString() || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${presupuesto.rentabilidad < 15 ? 'text-red-600' : 'text-green-600'}`}>
                        {presupuesto.rentabilidad?.toFixed(1) || 0}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${getColorDias(presupuesto.dias_pendiente)}`}>
                        {presupuesto.dias_pendiente} día{presupuesto.dias_pendiente !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{presupuesto.creador}</div>
                      <div className="text-sm text-gray-500">{presupuesto.sucursal_nombre}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedPresupuesto(presupuesto.idPresupuestos)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Revisar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Revisión */}
      {selectedPresupuesto && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Revisar Presupuesto #{selectedPresupuesto}
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentario (opcional)
                </label>
                <textarea
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Agregar comentario sobre la decisión..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => cambiarEstado(selectedPresupuesto, 'aprobado')}
                  disabled={procesando}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  ✅ Aprobar
                </button>
                <button
                  onClick={() => cambiarEstado(selectedPresupuesto, 'rechazado')}
                  disabled={procesando}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  ❌ Rechazar
                </button>
              </div>

              <button
                onClick={() => {
                  setSelectedPresupuesto(null);
                  setComentario('');
                }}
                className="w-full mt-3 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditorDashboard;