import { api } from '../api/api';
import { Presupuesto, Insumo, Prestacion } from '../types';

export const presupuestoService = {
  listar: async (): Promise<Presupuesto[]> => {
    const res = await api.get('/presupuestos');
    return res.data;
  },

  obtener: async (id: number): Promise<Presupuesto> => {
    const res = await api.get(`/presupuestos/${id}`);
    return res.data;
  },

  crear: async (data: { nombre: string; dni: string; sucursal: string; dificil_acceso?: string }) => {
    const res = await api.post('/presupuestos', data);
    return res.data;
  },

  verificarDNI: async (dni: string) => {
    const res = await api.get(`/presupuestos/verificar-dni/${dni}`);
    return res.data;
  },

  finalizarPresupuesto: async (id: number, totales?: any) => {
    const res = await api.post(`/presupuestos/${id}/finalizar`, { totales });
    return res.data;
  },

  crearVersionParaEdicion: async (id: number, confirmar: boolean = false) => {
    const res = await api.post(`/presupuestos/${id}/version/editar`, { confirmar });
    return res.data;
  },

  obtenerHistorial: async (id: number) => {
    const res = await api.get(`/presupuestos/${id}/versiones`);
    return res.data;
  },

  /**
   * Obtiene insumos de un presupuesto
   * @param soloLectura - Si es true, trae costos históricos guardados.
   *                      Si es false (modo edición), trae costos actuales de tabla insumos
   *                      y recalcula precio_facturar con porcentaje original del presupuesto
   */
  obtenerInsumos: async (id: number, soloLectura: boolean = false): Promise<Insumo[]> => {
    const res = await api.get(`/presupuestos/${id}/insumos?soloLectura=${soloLectura}`);
    return res.data.map((insumo: any) => ({
      ...insumo,
      idInsumos: insumo.id_insumo
    }));
  },

  /**
   * Obtiene prestaciones de un presupuesto
   * @param soloLectura - Si es true, trae valores históricos guardados.
   *                      Si es false (modo edición), mantiene valor_asignado original
   *                      pero actualiza valor_facturar con precios vigentes actuales
   */
  obtenerPrestaciones: async (id: number, soloLectura: boolean = false): Promise<Prestacion[]> => {
    const res = await api.get(`/presupuestos/${id}/prestaciones?soloLectura=${soloLectura}`);
    return res.data;
  },

  /**
   * Obtiene equipamientos de un presupuesto
   */
  obtenerEquipamientos: async (id: number): Promise<any[]> => {
    try {
      const res = await api.get(`/presupuestos/${id}/equipamientos`);
      return res.data;
    } catch (error) {
      console.error('Error loading equipamientos:', error);
      return [];
    }
  }
};
