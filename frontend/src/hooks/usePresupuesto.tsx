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
    soloLectura: boolean = true
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

      if (soloLectura) {
        // Modo historial: usar valores históricos
        setInsumosSeleccionados(insumos);
        setPrestacionesSeleccionadas(prestaciones);
      } else {
        // Modo edición: cargar valores actuales y limpiar listas
        setInsumosSeleccionados([]);
        setPrestacionesSeleccionadas([]);
      }
      
      if (setEsCargaHistorial) {
        setEsCargaHistorial(true);
      }

      notifications.show({
        title: 'Presupuesto Cargado',
        message: `Editando presupuesto #${id}`,
        color: 'blue',
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

  const guardarVersion = useCallback(async (
    totalInsumos: number,
    totalPrestaciones: number,
    costoTotal: number,
    totalFacturar: number,
    rentabilidad: number,
    rentabilidadConPlazo?: number
  ) => {
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
      const response = await presupuestoService.guardarVersion(presupuestoId, {
        total_insumos: totalInsumos,
        total_prestaciones: totalPrestaciones,
        costo_total: costoTotal,
        total_facturar: totalFacturar,
        rentabilidad: rentabilidad,
        rentabilidad_con_plazo: rentabilidadConPlazo || undefined,
      });
      
      const nuevoId = response.id;
      setPresupuestoId(nuevoId);
      
      notifications.show({
        title: 'Presupuesto Guardado',
        message: `Nueva versión creada con ID: ${nuevoId}`,
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar presupuesto',
        color: 'red',
      });
    } finally {
      setGuardandoTotales(false);
    }
  }, [presupuestoId]);

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
    guardarVersion,
    cargarPresupuesto,
  };
};
