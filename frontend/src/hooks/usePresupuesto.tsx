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
    setTotalesDesdeDB?: (totales: any) => void,
    setEquipamientosSeleccionados?: (equipamientos: any[]) => void
  ) => {
    try {
      setPresupuestoId(id);
      setClienteNombre(nombre);

      const [presupuestoData, insumos, prestaciones, equipamientos] = await Promise.all([
        presupuestoService.obtener(id),
        presupuestoService.obtenerInsumos(id, soloLectura),
        presupuestoService.obtenerPrestaciones(id, soloLectura),
        presupuestoService.obtenerEquipamientos(id, soloLectura)
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

      // Siempre cargar insumos, prestaciones y equipamientos existentes
      setInsumosSeleccionados(insumos);
      setPrestacionesSeleccionadas(prestaciones);
      if (setEquipamientosSeleccionados) {
        setEquipamientosSeleccionados(equipamientos);
      }
      
      // Cargar totales desde BD SOLO en modo solo lectura
      // En modo edición, dejar que se recalculen automáticamente desde los items
      if (soloLectura && setTotalesDesdeDB && presupuestoData.costo_total && presupuestoData.costo_total > 0) {
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

  const crearVersionParaEdicion = useCallback(async (id: number, confirmar: boolean = false) => {
    try {
      const response = await presupuestoService.crearVersionParaEdicion(id, confirmar);
      
      // Si requiere confirmación, retornar sin hacer nada más
      if (response.requiereConfirmacion) {
        return response;
      }
      
      setPresupuestoId(response.id);
      
      notifications.show({
        title: response.requiereNuevaVersion ? 'Nueva Versión Creada' : 'Editando Borrador',
        message: response.mensaje,
        color: response.requiereNuevaVersion ? 'orange' : 'blue',
      });
      
      return response;
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al preparar edición',
        color: 'red',
      });
      throw error;
    }
  }, []);

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
    cargarPresupuesto,
  };
};
