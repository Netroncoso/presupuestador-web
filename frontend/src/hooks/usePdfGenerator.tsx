import { useCallback } from 'react';
import { pdfClientService } from '../services/pdfClientService';

interface PresupuestoData {
  presupuestoId: number | null;
  datosHistorial?: {
    nombre: string;
    dni: string;
    sucursal: string;
  };
  insumosSeleccionados: any[];
  prestacionesSeleccionadas: any[];
  equipamientosSeleccionados: any[];
  totalInsumos: number;
  totalPrestaciones: number;
  totalEquipamientos: number;
  costoTotal: number;
  totalFacturar: number;
  rentabilidad: number;
}

export const usePdfGenerator = (data: PresupuestoData) => {
  const generarPDF = useCallback(() => {
    if (!data.presupuestoId || !data.datosHistorial) return;

    pdfClientService.generarYDescargar({
      cliente: data.datosHistorial.nombre,
      dni: data.datosHistorial.dni,
      sucursal: data.datosHistorial.sucursal,
      presupuestoId: data.presupuestoId,
      insumos: data.insumosSeleccionados,
      prestaciones: data.prestacionesSeleccionadas,
      equipamientos: data.equipamientosSeleccionados,
      totales: {
        totalInsumos: data.totalInsumos,
        totalPrestaciones: data.totalPrestaciones,
        totalEquipamientos: data.totalEquipamientos,
        costoTotal: data.costoTotal,
        totalFacturar: data.totalFacturar,
        rentabilidad: data.rentabilidad,
      },
    });
  }, [
    data.presupuestoId,
    data.datosHistorial,
    data.insumosSeleccionados,
    data.prestacionesSeleccionadas,
    data.equipamientosSeleccionados,
    data.totalInsumos,
    data.totalPrestaciones,
    data.totalEquipamientos,
    data.costoTotal,
    data.totalFacturar,
    data.rentabilidad,
  ]);

  return { generarPDF };
};
