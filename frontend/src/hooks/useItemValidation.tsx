import { useCallback } from 'react';
import { api } from '../api/api';

interface ItemFaltante {
  tipo: 'insumo' | 'prestacion';
  nombre: string;
  cantidad: number;
  datos: any;
  accion: 'guardar' | 'eliminar';
}

export const useItemValidation = (presupuestoId: number | null) => {
  const validarItems = useCallback(async (
    insumosSeleccionados: any[],
    prestacionesSeleccionadas: any[]
  ): Promise<{ valido: boolean; faltantes: ItemFaltante[] }> => {
    if (!presupuestoId) return { valido: false, faltantes: [] };
    
    try {
      const response = await api.get(`/presupuestos/${presupuestoId}`);
      const { insumos, prestaciones } = response.data;
      const faltantes: ItemFaltante[] = [];
      
      // Validar insumos
      insumosSeleccionados.forEach(insumo => {
        if (!insumos.find((i: any) => i.id_insumo === insumo.idInsumos && i.cantidad === insumo.cantidad)) {
          faltantes.push({ tipo: 'insumo', nombre: insumo.producto, cantidad: insumo.cantidad, datos: insumo, accion: 'guardar' });
        }
      });
      
      insumos.forEach((insumo: any) => {
        if (!insumosSeleccionados.find(i => i.idInsumos === insumo.id_insumo)) {
          faltantes.push({ tipo: 'insumo', nombre: insumo.producto, cantidad: insumo.cantidad, datos: insumo, accion: 'eliminar' });
        }
      });
      
      // Validar prestaciones
      prestacionesSeleccionadas.forEach(prestacion => {
        if (!prestaciones.find((p: any) => 
          String(p.id_servicio) === String(prestacion.id_servicio) &&
          p.cantidad === prestacion.cantidad &&
          Math.abs(p.valor_asignado - prestacion.valor_asignado) < 0.01
        )) {
          faltantes.push({ tipo: 'prestacion', nombre: prestacion.prestacion, cantidad: prestacion.cantidad, datos: prestacion, accion: 'guardar' });
        }
      });
      
      prestaciones.forEach((prestacion: any) => {
        if (!prestacionesSeleccionadas.find(p => String(p.id_servicio) === String(prestacion.id_servicio))) {
          faltantes.push({ tipo: 'prestacion', nombre: prestacion.prestacion, cantidad: prestacion.cantidad, datos: prestacion, accion: 'eliminar' });
        }
      });
      
      return { valido: faltantes.length === 0, faltantes };
    } catch (error) {
      console.error('Error validando items:', error);
      return { valido: false, faltantes: [] };
    }
  }, [presupuestoId]);

  const procesarItem = useCallback(async (item: ItemFaltante): Promise<boolean> => {
    if (!presupuestoId) return false;
    
    try {
      if (item.accion === 'eliminar') {
        const endpoint = item.tipo === 'insumo' ? 'insumos' : 'prestaciones';
        const data = item.tipo === 'insumo' ? { producto: item.datos.producto } : { id_servicio: item.datos.id_servicio };
        await api.delete(`/presupuestos/${presupuestoId}/${endpoint}`, { data });
      } else {
        if (item.tipo === 'insumo') {
          await api.post(`/presupuestos/${presupuestoId}/insumos`, {
            producto: item.datos.producto,
            costo: item.datos.costo,
            cantidad: item.datos.cantidad,
            id_insumo: item.datos.idInsumos
          });
        } else {
          await api.post(`/presupuestos/${presupuestoId}/prestaciones`, {
            id_servicio: item.datos.id_servicio,
            prestacion: item.datos.prestacion,
            cantidad: item.datos.cantidad,
            valor_asignado: item.datos.valor_asignado,
            valor_facturar: item.datos.valor_facturar
          });
        }
      }
      return true;
    } catch (error) {
      console.error('Error procesando item:', error);
      return false;
    }
  }, [presupuestoId]);

  return { validarItems, procesarItem };
};
