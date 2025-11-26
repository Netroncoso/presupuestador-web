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

  obtenerInsumos: async (id: number): Promise<Insumo[]> => {
    const res = await api.get(`/presupuestos/${id}/insumos`);
    return res.data.map((insumo: any) => ({
      ...insumo,
      idInsumos: insumo.id_insumo
    }));
  },

  obtenerPrestaciones: async (id: number): Promise<Prestacion[]> => {
    const res = await api.get(`/presupuestos/${id}/prestaciones`);
    return res.data;
  }
};
