import { api } from '../api/api';
import { ZonaFinanciador } from '../types';

export const financiadorZonasService = {
  // Obtener todas las zonas de financiador
  async getAll(): Promise<ZonaFinanciador[]> {
    const response = await api.get('/financiador-zonas');
    return response.data;
  },

  // Obtener zonas de un financiador específico
  async getByFinanciador(financiadorId: number): Promise<ZonaFinanciador[]> {
    const response = await api.get(`/financiador/${financiadorId}/zonas`);
    return response.data.zonas;
  },

  // Obtener servicios con convenio por financiador y zona
  async getServiciosConvenio(financiadorId: number, zonaId: number) {
    const response = await api.get(`/financiador/${financiadorId}/servicios?zona_financiador_id=${zonaId}`);
    return response.data.servicios;
  },

  // Crear nueva zona
  async create(zona: Omit<ZonaFinanciador, 'id'>): Promise<ZonaFinanciador> {
    const response = await api.post('/financiador-zonas', zona);
    return response.data;
  },

  // Actualizar zona
  async update(id: string, zona: Partial<ZonaFinanciador>): Promise<ZonaFinanciador> {
    const response = await api.put(`/financiador-zonas/${id}`, zona);
    return response.data;
  },

  // Eliminar zona
  async delete(id: string): Promise<void> {
    await api.delete(`/financiador-zonas/${id}`);
  },

  // Asignar zonas a financiador
  async asignarZonas(financiadorId: number, zonaIds: number[]): Promise<void> {
    await api.post(`/financiador/${financiadorId}/zonas`, { zonaIds });
  }
};