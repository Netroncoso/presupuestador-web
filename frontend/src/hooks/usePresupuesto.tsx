import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { FinanciadorInfo } from '../types';
import { presupuestoService } from '../services/presupuestoService';

export const usePresupuesto = () => {
  const [presupuestoId, setPresupuestoId] = useState<number | null>(null);
  const [clienteNombre, setClienteNombre] = useState('');
  const [porcentajeInsumos, setPorcentajeInsumos] = useState(0);
  const [financiadorId, setFinanciadorId] = useState<string | null>(null);
  const [financiadorInfo, setFinanciadorInfo] = useState<FinanciadorInfo>({});
  const [guardandoTotales, setGuardandoTotales] = useState(false);

  const crearPresupuesto = useCallback((
    id: number,
    nombre: string,
    sucursal: string,
    porcentaje: number,
    financiadorIdParam?: string
  ) => {
    setPresupuestoId(id);
    setClienteNombre(nombre);
    setPorcentajeInsumos(porcentaje);
    setFinanciadorId(financiadorIdParam || null);
  }, []);

  const resetPresupuesto = useCallback(() => {
    setPresupuestoId(null);
    setClienteNombre('');
    setPorcentajeInsumos(0);
    setFinanciadorId(null);
    setFinanciadorInfo({});
  }, []);

  const cargarPresupuesto = useCallback(async (
    id: number,
    nombre: string,
    sucursal: string,
    financiadorIdParam: string | null,
    setInsumosSeleccionados: (insumos: any[]) => void,
    setPrestacionesSeleccionadas: (prestaciones: any[]) => void,
    setEsCargaHistorial?: (esHistorial: boolean) => void,
    soloLectura: boolean = true,
    setTotalesDesdeDB?: (totales: any) => void
  ) => {
    try {
      setPresupuestoId(id);
      setClienteNombre(nombre);

      const [presupuestoData, insumos, prestaciones] = await Promise.all([
        presupuestoService.obtener(id),
        presupuestoService.obtenerInsumos(id),
        presupuestoService.obtenerPrestaciones(id)
      ]);

      // Cargar financiador desde el presupuesto (prioridad) o parámetro
      const financiadorFinal = presupuestoData.idobra_social || financiadorIdParam;
      setFinanciadorId(financiadorFinal);

      // Cargar información del financiador si existe
      if (financiadorFinal) {
        try {
          const { api } = await import('../api/api');
          const infoRes = await api.get(`/prestaciones/prestador/${financiadorFinal}/info`);
          setFinanciadorInfo(infoRes.data);
        } catch (error) {
          console.error('Error loading financiador info:', error);
          setFinanciadorInfo({});
        }
      }

      // Cargar porcentaje de insumos desde el presupuesto
      if (presupuestoData.porcentaje_insumos) {
        setPorcentajeInsumos(presupuestoData.porcentaje_insumos);
      }

      // Siempre cargar insumos y prestaciones existentes
      setInsumosSeleccionados(insumos);
      setPrestacionesSeleccionadas(prestaciones);
      
      // Cargar totales desde la base de datos si están disponibles
      if (setTotalesDesdeDB && presupuestoData.total_insumos !== undefined) {
        setTotalesDesdeDB({
          totalInsumos: presupuestoData.total_insumos || 0,
          totalPrestaciones: presupuestoData.total_prestaciones || 0,
          costoTotal: presupuestoData.costo_total || 0,
          totalFacturar: presupuestoData.total_facturar || 0,
          rentabilidad: presupuestoData.rentabilidad || 0,
          rentabilidadConPlazo: presupuestoData.rentabilidad_con_plazo || 0
        });
      }
      
      if (setEsCargaHistorial) {
        setEsCargaHistorial(true);
      }

      notifications.show({
        title: 'Presupuesto Cargado',
        message: soloLectura ? `Visualizando presupuesto #${id}` : `Editando presupuesto #${id}`,
        color: soloLectura ? 'green' : 'blue',
      });
    } catch (error) {
      console.error('Error cargando presupuesto:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al cargar presupuesto',
        color: 'red',
      });
    }
  }, []);

  const finalizarPresupuesto = useCallback(async (totales?: any) => {
    if (!presupuestoId) {
      notifications.show({
        title: 'Advertencia',
        message: 'Debe crear o seleccionar un presupuesto primero.',
        color: 'yellow',
      });
      return;
    }

    setGuardandoTotales(true);
    try {
      const response = await presupuestoService.finalizarPresupuesto(presupuestoId, totales);
      
      notifications.show({
        title: 'Presupuesto Finalizado',
        message: response.mensaje,
        color: response.estado === 'pendiente' ? 'orange' : 'green',
      });
      
      return response;
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al finalizar presupuesto',
        color: 'red',
      });
      throw error;
    } finally {
      setGuardandoTotales(false);
    }
  }, [presupuestoId]);

  const crearVersionParaEdicion = useCallback(async (id: number) => {
    try {
      const response = await presupuestoService.crearVersionParaEdicion(id);
      
      setPresupuestoId(response.id);
      
      notifications.show({
        title: 'Versión Creada',
        message: `Nueva versión ${response.version} lista para edición`,
        color: 'blue',
      });
      
      return response;
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al crear versión para edición',
        color: 'red',
      });
      throw error;
    }
  }, []);

  // Mantener para compatibilidad
  const guardarVersion = finalizarPresupuesto;

  return {
    presupuestoId,
    clienteNombre,
    porcentajeInsumos,
    financiadorId,
    financiadorInfo,
    guardandoTotales,
    setFinanciadorId,
    setFinanciadorInfo,
    crearPresupuesto,
    resetPresupuesto,
    finalizarPresupuesto,
    crearVersionParaEdicion,
    guardarVersion, // Mantener para compatibilidad
    cargarPresupuesto,
  };
};
