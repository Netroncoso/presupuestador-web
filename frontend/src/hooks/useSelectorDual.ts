import { useState, useEffect, useCallback } from 'react';
import { getServiciosFinanciador, getServiciosTarifario, api } from '../api/api';
import type { ServicioFinanciador, ServicioTarifario, ServicioConvenio } from '../types';

interface UseSelectorDualOptions {
  financiadorId?: string | null;
  zonaFinanciadorId?: number | null;
  zonaTarifarioId?: number | null;
  presupuestoId?: number | null;
}

export function useSelectorDual({
  financiadorId,
  zonaFinanciadorId,
  zonaTarifarioId,
  presupuestoId
}: UseSelectorDualOptions) {
  const [serviciosFinanciador, setServiciosFinanciador] = useState<ServicioFinanciador[]>([]);
  const [serviciosTarifario, setServiciosTarifario] = useState<ServicioTarifario[]>([]);
  const [serviciosConvenio, setServiciosConvenio] = useState<ServicioConvenio[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState({ financiador: false, tarifario: false });
  const [error, setError] = useState<string | null>(null);

  const cargarServiciosFinanciador = useCallback(async () => {
    if (!financiadorId || !zonaFinanciadorId) {
      setServiciosFinanciador([]);
      setLoaded(prev => ({ ...prev, financiador: false }));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const servicios = await getServiciosFinanciador(financiadorId, zonaFinanciadorId);
      setServiciosFinanciador(Array.isArray(servicios) ? servicios : []);
      setLoaded(prev => ({ ...prev, financiador: true }));
    } catch (err) {
      console.error('Error cargando servicios financiador:', err);
      setError('Error al cargar servicios del financiador');
      setServiciosFinanciador([]);
      setLoaded(prev => ({ ...prev, financiador: false }));
    } finally {
      setLoading(false);
    }
  }, [financiadorId, zonaFinanciadorId]);

  const cargarServiciosTarifario = useCallback(async () => {
    if (!zonaTarifarioId) {
      setServiciosTarifario([]);
      setLoaded(prev => ({ ...prev, tarifario: false }));
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const servicios = await getServiciosTarifario(zonaTarifarioId);
      setServiciosTarifario(Array.isArray(servicios) ? servicios : []);
      setLoaded(prev => ({ ...prev, tarifario: true }));
    } catch (err) {
      console.error('Error cargando servicios tarifario:', err);
      setError('Error al cargar servicios del tarifario');
      setServiciosTarifario([]);
      setLoaded(prev => ({ ...prev, tarifario: false }));
    } finally {
      setLoading(false);
    }
  }, [zonaTarifarioId]);

  // Cargar servicios cuando cambien los parámetros
  useEffect(() => {
    cargarServiciosFinanciador();
  }, [cargarServiciosFinanciador]);

  useEffect(() => {
    cargarServiciosTarifario();
  }, [cargarServiciosTarifario]);

  // Limpiar servicios convenio cuando cambien los contextos
  useEffect(() => {
    if (!financiadorId || !zonaFinanciadorId || !zonaTarifarioId) {
      setServiciosConvenio([]);
    }
  }, [financiadorId, zonaFinanciadorId, zonaTarifarioId]);

  const calcularTotales = useCallback(() => {
    if (!Array.isArray(serviciosConvenio)) {
      return {
        totalFacturar: 0,
        totalCosto: 0,
        utilidadTotal: 0,
        margenUtilidad: 0
      };
    }

    const totalFacturar = serviciosConvenio.reduce((sum, s) => sum + (s?.precio_facturar || 0), 0);
    const totalCosto = serviciosConvenio.reduce((sum, s) => sum + (s?.precio_costo || 0), 0);
    const utilidadTotal = serviciosConvenio.reduce((sum, s) => sum + (s?.utilidad || 0), 0);

    return {
      totalFacturar,
      totalCosto,
      utilidadTotal,
      margenUtilidad: totalFacturar > 0 ? (utilidadTotal / totalFacturar) * 100 : 0
    };
  }, [serviciosConvenio]);

  const agregarServicio = useCallback(async (servicio: ServicioConvenio) => {
    if (!presupuestoId) return;

    try {
      // Guardar en BD - usar servicio_id (de tabla servicios), no id_financiador_servicio
      await api.post(`/presupuestos/${presupuestoId}/prestaciones`, {
        id_servicio: servicio.servicio_id,
        prestacion: servicio.nombre,
        cantidad: servicio.cantidad,
        valor_asignado: servicio.precio_costo / servicio.cantidad,
        valor_facturar: servicio.precio_facturar / servicio.cantidad,
        aplicar_horas_nocturnas: servicio.aplicar_horas_nocturnas || false,
        porcentaje_aplicado: servicio.porcentaje_horas_nocturnas || 0
      });

      // SOLO actualizar estado local si guardó exitosamente
      setServiciosConvenio(prev => [...(Array.isArray(prev) ? prev : []), servicio]);
    } catch (error) {
      console.error('Error guardando servicio:', error);
      throw error;
    }
  }, [presupuestoId]);

  const eliminarServicio = useCallback(async (claveUnica: string) => {
    if (!presupuestoId) return;

    try {
      // Encontrar el servicio por clave_unica
      const servicio = serviciosConvenio.find(s => s.clave_unica === claveUnica);
      if (!servicio) return;

      // Eliminar de BD usando servicio_id + aplicar_horas_nocturnas
      await api.delete(`/presupuestos/${presupuestoId}/prestaciones`, {
        data: { 
          id_servicio: servicio.servicio_id,
          aplicar_horas_nocturnas: servicio.aplicar_horas_nocturnas || false
        }
      });

      // Actualizar estado local - eliminar solo el que coincide con clave_unica
      setServiciosConvenio(prev =>
        Array.isArray(prev) ? prev.filter(s => s.clave_unica !== claveUnica) : []
      );
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      throw error;
    }
  }, [presupuestoId, serviciosConvenio]);

  const actualizarServicio = useCallback((idServicioFinanciador: number, cambios: Partial<ServicioConvenio>) => {
    setServiciosConvenio(prev =>
      Array.isArray(prev) ? prev.map(s =>
        s.id_servicio_financiador === idServicioFinanciador
          ? { ...s, ...cambios }
          : s
      ) : []
    );
  }, []);

  const limpiarServicios = useCallback(() => {
    setServiciosConvenio([]);
  }, []);

  const isReady = Boolean(
    financiadorId &&
    zonaFinanciadorId &&
    zonaTarifarioId &&
    loaded.financiador &&
    loaded.tarifario
  );

  return {
    // Estados
    serviciosFinanciador,
    serviciosTarifario,
    serviciosConvenio,
    loading,
    error,
    isReady,

    // Acciones
    setServiciosConvenio,
    agregarServicio,
    eliminarServicio,
    actualizarServicio,
    limpiarServicios,
    cargarServiciosFinanciador,
    cargarServiciosTarifario,

    // Cálculos
    totales: calcularTotales()
  };
}