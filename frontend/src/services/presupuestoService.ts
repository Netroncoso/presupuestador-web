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

  guardarVersion: async (id: number, data: {
    total_insumos: number;
    total_prestaciones: number;
    costo_total: number;
    total_facturar: number;
    rentabilidad: number;
    rentabilidad_con_plazo?: number;
  }) => {
    const res = await api.post(`/presupuestos/${id}/guardar-version`, data);
    return res.data;
  },

  obtenerInsumos: async (id: number): Promise<Insumo[]> => {
    const res = await api.get(`/presupuesto-insumos/${id}`);
    return res.data;
  },

  obtenerPrestaciones: async (id: number): Promise<Prestacion[]> => {
    const res = await api.get(`/presupuesto-prestaciones/${id}`);
    return res.data;
  },
};
