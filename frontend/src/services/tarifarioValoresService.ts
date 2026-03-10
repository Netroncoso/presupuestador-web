import { api } from '../api/api';
import { ServicioTarifario } from '../types';

export const tarifarioValoresService = {
  // Obtener servicios del tarifario por zona
  async getServiciosPorZona(zonaId: number): Promise<ServicioTarifario[]> {
    const response = await api.get(`/tarifario/zonas/${zonaId}/servicios`);
    return response.data.servicios.map((s: any) => ({
      id: s.id,
      nombre: s.nombre,
      tipo_unidad: s.tipo_unidad,
      valores: [s.valor_1, s.valor_2, s.valor_3, s.valor_4, s.valor_5]
    }));
  },

  // Crear o actualizar valores del tarifario
  async crearOActualizarValores(data: {
    servicio_id: number;
    zona_tarifario_id: number;
    valor_1: number;
    valor_2: number;
    valor_3: number;
    valor_4: number;
    valor_5: number;
    fecha_inicio: string;
    fecha_fin?: string;
  }) {
    const response = await api.post('/admin/tarifario/valores', data);
    return response.data;
  },

  // Obtener historial de valores
  async getHistorialValores(servicioId: number, zonaId: number) {
    const response = await api.get(`/admin/tarifario/servicios/${servicioId}/zonas/${zonaId}/historial`);
    return response.data.historial;
  }
};