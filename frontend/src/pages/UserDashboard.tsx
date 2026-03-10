import { useState, useCallback, useMemo, useEffect } from "react";
import {
  Tabs,
  Title,
  Group,
  Text,
  Button,
  Paper,
  Flex,
  Grid,
  ScrollArea,
  Card,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../contexts/AuthContext";
import { useNotificationCount } from "../hooks/useNotificationCount";
import ResponsiveContainer from "../components/ResponsiveContainer";
import DatosPresupuesto, { PresupuestoCreadoData } from "./DatosPresupuesto";
import Notificaciones from "./Notificaciones";
import { NotificationIndicator } from "../components/NotificationIndicator";
import { ModalAuditoria } from "../components/ModalAuditoria";
import { ModalConfirmarEdicion } from "../components/ModalConfirmarEdicion";
import { ConnectionStatus } from "../components/ConnectionStatus";
import Insumos from "./Insumos";
import Prestaciones from "./Prestaciones";
import Equipamiento from "../components/Equipamiento";
import ListaPresupuestos from "./ListaPresupuestos";
import {
  DocumentArrowDownIcon,
  IdentificationIcon,
  BeakerIcon,
  BriefcaseIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  DocumentTextIcon,
  ArchiveBoxArrowDownIcon,
  ClockIcon,
  BellIcon,
  ShieldCheckIcon,
  LifebuoyIcon,
} from "@heroicons/react/24/outline";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { useAlertaCotizador } from "../hooks/useAlertaCotizador";
import { usePresupuesto } from "../hooks/usePresupuesto";
import { useTotales } from "../hooks/useTotales";
import { useFinanciador } from "../hooks/useFinanciador";
import { useModalState } from "../hooks/useModalState";
import { usePdfGenerator } from "../hooks/usePdfGenerator";
import { api } from "../api/api";

// Declaración global eliminada ya que usamos props ahora

import { numberFormat } from "../utils/numberFormat";

const ICON_SIZE = { width: 20, height: 20 };
const TAB_HOVER_STYLE = { "&:hover": { backgroundColor: "#dff1db" } };

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const { count: notificationCount, isConnected } = useNotificationCount();
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<any[]>([]);
  const [prestacionesSeleccionadas, setPrestacionesSeleccionadas] = useState<
    any[]
  >([]);
  const [equipamientosSeleccionados, setEquipamientosSeleccionados] = useState<any[]>([]);
  const [totalCostoEquipamiento, setTotalCostoEquipamiento] = useState(0);
  const [totalFacturarEquipamiento, setTotalFacturarEquipamiento] = useState(0);

  const [activeTab, setActiveTab] = useState<string | null>("datos");
  const [esCargaHistorial, setEsCargaHistorial] = useState(false);
  const [datosHistorial, setDatosHistorial] = useState<
    { nombre: string; dni: string; sucursal: string; sucursal_id?: number; financiador_id?: string; zonaId?: number; zona_tarifario_id?: number; zona_financiador_id?: number } | undefined
  >();
  const [recargarHistorial, setRecargarHistorial] = useState(0);
  const [enviandoAuditoria, setEnviandoAuditoria] = useState(false);
  const [auditoriaAutomatica, setAuditoriaAutomatica] = useState(false);
  const [presupuestoParaEditar, setPresupuestoParaEditar] = useState<any>(null);
  const [infoEdicion, setInfoEdicion] = useState<any>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [configDefaults, setConfigDefaults] = useState({ tasa: 2, dias: 30 });
  
  // Estados para sincronización en tiempo real de zonas
  const [liveZonaTarifarioId, setLiveZonaTarifarioId] = useState<number | null>(null);
  const [liveZonaFinanciadorId, setLiveZonaFinanciadorId] = useState<number | null>(null);

  const {
    modalAuditoriaAbierto,
    modalEdicionAbierto,
    abrirModalAuditoria,
    cerrarModalAuditoria,
    abrirModalEdicion,
    cerrarModalEdicion,
  } = useModalState();

  const {
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
  } = usePresupuesto();

  const handlePresupuestoCreado = useCallback((data: PresupuestoCreadoData) => {
    crearPresupuesto(data.id, data.nombre, data.sucursal, data.porcentajeInsumos, data.financiadorId);
    
    // Sincronizar estados locales
    if (data.zonaTarifarioId) setLiveZonaTarifarioId(data.zonaTarifarioId);
    if (data.zonaFinanciadorId) setLiveZonaFinanciadorId(data.zonaFinanciadorId);
    
    setDatosHistorial({ 
      nombre: data.nombre, 
      dni: data.dni, 
      sucursal: data.sucursal, 
      sucursal_id: data.sucursalId,
      financiador_id: data.financiadorId,
      zonaId: data.zonaId,
      zona_tarifario_id: data.zonaId,
      zona_financiador_id: data.zonaFinanciadorId
    });
  }, [crearPresupuesto]);

  // Nuevo handler para reemplazar window.cargarPresupuestoCallback
  const handleCargarPresupuesto = useCallback(async (id: number, nombre: string, sucursal: string, financiadorId: string | null) => {
      await cargarPresupuesto(
        id,
        nombre,
        sucursal,
        financiadorId,
        setInsumosSeleccionados,
        setPrestacionesSeleccionadas,
        setEsCargaHistorial,
        false, // modo edición
        setTotalesDesdeBaseDatos,
        setEquipamientosSeleccionados
      );
  }, [cargarPresupuesto]);

  const {
    totalInsumos,
    totalPrestaciones,
    costoTotal,
    totalFacturar,
    rentabilidad,
    rentabilidadConPlazo,
    setTotalInsumos,
    setTotalesPrestaciones,
    resetTotales,
    setTotalesDesdeBaseDatos,
  } = useTotales(
    financiadorInfo,
    prestacionesSeleccionadas,
    porcentajeInsumos,
    soloLectura,
    totalCostoEquipamiento,
    totalFacturarEquipamiento
  );

  useFinanciador(financiadorId, setFinanciadorInfo);

  useEffect(() => {
    api.get('/configuracion?categoria=financiero').then(({ data }) => {
      const tasa = data.find((c: any) => c.clave === 'financiero.tasaMensualDefault')?.valor || 2;
      const dias = data.find((c: any) => c.clave === 'financiero.diasCobranzaDefault')?.valor || 30;
      setConfigDefaults({ tasa, dias });
    }).catch(() => {});
  }, []);

  const rentabilidadFinal = useMemo(
    () =>
      financiadorInfo?.dias_cobranza_real ? rentabilidadConPlazo : rentabilidad,
    [financiadorInfo, rentabilidadConPlazo, rentabilidad]
  );

  const alertas = useAlertaCotizador({
    presupuestoId,
    clienteNombre,
    totalInsumos,
    totalPrestaciones,
    totalFacturar,
    costoTotal,
    rentabilidad: rentabilidad,  // Siempre SIN plazo para alertas
    financiadorId,
    financiadorInfo,
    prestacionesSeleccionadas,
    equipamientosSeleccionados,
  });

  const handleNuevoPresupuesto = useCallback(() => {
    resetPresupuesto();
    resetTotales();
    setInsumosSeleccionados([]);
    setPrestacionesSeleccionadas([]);
    setEquipamientosSeleccionados([]);
    setTotalCostoEquipamiento(0);
    setTotalFacturarEquipamiento(0);
    setEsCargaHistorial(false);
    setDatosHistorial(undefined);
    setSoloLectura(false);
    setActiveTab('datos');
    setLiveZonaTarifarioId(null);
    setLiveZonaFinanciadorId(null);
  }, [resetPresupuesto, resetTotales]);

  const ejecutarFinalizacion = useCallback(async () => {
    try {
      const totales = {
        totalInsumos,
        totalPrestaciones,
        costoTotal,
        totalFacturar,
        rentabilidad,
        rentabilidadConPlazo,
      };

      const resultado = await finalizarPresupuesto(totales);
      setRecargarHistorial((prev) => prev + 1);

      // Si requiere auditoría, abrir modal y marcar como automática
      if (resultado.estadoFinal === 'pendiente_prestacional') {
        // Mostrar notificación con todas las razones
        const razones = resultado.razones || [];
        const totalViolaciones = resultado.totalViolaciones || razones.length;
        
        let mensaje = '';
        if (razones.length > 0) {
          mensaje = `${totalViolaciones} condición${totalViolaciones > 1 ? 'es' : ''} detectada${totalViolaciones > 1 ? 's' : ''}:\n• ${razones.join('\n• ')}`;
        } else {
          mensaje = 'El presupuesto requiere revisión gerencial según las reglas automáticas configuradas.';
        }
        
        notifications.show({
          title: '📋 Auditoría por Reglas de Negocio',
          message: mensaje,
          color: 'blue',
          position: 'top-center',
          autoClose: false,
        });
        
        setAuditoriaAutomatica(true);
        abrirModalAuditoria();
        return; // IMPORTANTE: No limpiar ni ir al historial
      }

      // Si fue aprobado automáticamente
      if (resultado.estadoFinal === 'pendiente_carga' || resultado.estadoFinal === 'aprobado') {
        notifications.show({
          title: '✅ Presupuesto Aprobado',
          message: 'El presupuesto cumple con las reglas de negocio y fue aprobado automáticamente',
          color: 'green',
          position: 'top-center',
          autoClose: 5000,
        });
      }

      // Solo ir al historial y limpiar si NO requiere auditoría
      setActiveTab('historial');
      setTimeout(() => {
        handleNuevoPresupuesto();
      }, 500);
    } catch (error) {
      console.error("Error al finalizar presupuesto:", error);
    }
  }, [
    finalizarPresupuesto,
    totalInsumos,
    totalPrestaciones,
    costoTotal,
    totalFacturar,
    rentabilidad,
    rentabilidadConPlazo,
    handleNuevoPresupuesto,
    abrirModalAuditoria,
  ]);

  const handleFinalizarPresupuesto = useCallback(async () => {
    if (guardandoTotales) return;
    
    if (costoTotal === 0) {
      notifications.show({
        title: '⚠️ Presupuesto Vacío',
        message: 'Debe agregar al menos un insumo, prestación o equipamiento antes de finalizar',
        color: 'orange',
        position: 'top-center',
        autoClose: 5000,
      });
      return;
    }

    await ejecutarFinalizacion();
  }, [
    costoTotal,
    ejecutarFinalizacion,
    guardandoTotales,
  ]);

  const handleEditarPresupuesto = useCallback(
    async (presupuesto: any, soloLecturaParam: boolean = true) => {
      if (soloLecturaParam) {
        // Setear datosHistorial ANTES de cargar para que zonaId esté disponible
        setDatosHistorial({
          nombre: presupuesto.Nombre_Apellido,
          dni: presupuesto.DNI,
          sucursal: presupuesto.Sucursal,
          sucursal_id: presupuesto.sucursal_id,
          financiador_id: presupuesto.financiador_id?.toString(),
          zonaId: presupuesto.zona_tarifario_id,
          zona_tarifario_id: presupuesto.zona_tarifario_id,
          zona_financiador_id: presupuesto.zona_financiador_id
        });
        
        // Sincronizar estados locales
        setLiveZonaTarifarioId(presupuesto.zona_tarifario_id);
        setLiveZonaFinanciadorId(presupuesto.zona_financiador_id);
        
        // Actualizar estado del hook ANTES de cargar items
        const sucursalData = await api.get(`/sucursales`);
        const sucursal = sucursalData.data.find((s: any) => s.ID === presupuesto.sucursal_id);
        const porcentajeInsumos = sucursal?.suc_porcentaje_insumos || 0;
        
        crearPresupuesto(
          presupuesto.idPresupuestos,
          presupuesto.Nombre_Apellido,
          presupuesto.Sucursal,
          porcentajeInsumos,
          presupuesto.financiador_id?.toString()
        );
        
        setSoloLectura(true);
        await cargarPresupuesto(
          presupuesto.idPresupuestos,
          presupuesto.Nombre_Apellido,
          presupuesto.Sucursal,
          presupuesto.financiador_id,
          setInsumosSeleccionados,
          setPrestacionesSeleccionadas,
          setEsCargaHistorial,
          true,
          setTotalesDesdeBaseDatos,
          setEquipamientosSeleccionados
        );
      } else {
        try {
          const response = await crearVersionParaEdicion(
            presupuesto.idPresupuestos,
            false
          );

          if (response.requiereConfirmacion) {
            setPresupuestoParaEditar(presupuesto);
            setInfoEdicion(response);
            abrirModalEdicion();
            return;
          }

          // Setear datosHistorial ANTES de cargar para que zonaId esté disponible
          setDatosHistorial({
            nombre: presupuesto.Nombre_Apellido,
            dni: presupuesto.DNI,
            sucursal: presupuesto.Sucursal,
            sucursal_id: presupuesto.sucursal_id,
            financiador_id: presupuesto.financiador_id?.toString(),
            zonaId: presupuesto.zona_tarifario_id,
            zona_tarifario_id: presupuesto.zona_tarifario_id,
            zona_financiador_id: presupuesto.zona_financiador_id
          });
          
          // Sincronizar estados locales
          setLiveZonaTarifarioId(presupuesto.zona_tarifario_id);
          setLiveZonaFinanciadorId(presupuesto.zona_financiador_id);
          
          // Actualizar estado del hook ANTES de cargar items
          const sucursalData = await api.get(`/sucursales`);
          const sucursal = sucursalData.data.find((s: any) => s.ID === presupuesto.sucursal_id);
          const porcentajeInsumos = sucursal?.suc_porcentaje_insumos || 0;
          
          crearPresupuesto(
            response.id,
            presupuesto.Nombre_Apellido,
            presupuesto.Sucursal,
            porcentajeInsumos,
            presupuesto.financiador_id?.toString()
          );
          
          setSoloLectura(false);
          await cargarPresupuesto(
            response.id,
            presupuesto.Nombre_Apellido,
            presupuesto.Sucursal,
            presupuesto.financiador_id,
            setInsumosSeleccionados,
            setPrestacionesSeleccionadas,
            setEsCargaHistorial,
            false,
            setTotalesDesdeBaseDatos,
            setEquipamientosSeleccionados
          );
        } catch (error) {
          console.error("Error al preparar edición:", error);
        }
      }
      setActiveTab("datos");
    },
    [cargarPresupuesto, crearVersionParaEdicion]
  );

  // Removed window callback effect as it is replaced by handleCargarPresupuesto passed as prop



  const { generarPDF } = usePdfGenerator({
    presupuestoId,
    datosHistorial,
    insumosSeleccionados,
    prestacionesSeleccionadas,
    equipamientosSeleccionados,
    totalInsumos,
    totalPrestaciones,
    totalEquipamientos: totalFacturarEquipamiento,
    costoTotal,
    totalFacturar,
    rentabilidad: rentabilidadFinal,
  });

  const handlePedirAuditoria = useCallback(
    async (mensaje: string) => {
      if (!presupuestoId) return;

      setEnviandoAuditoria(true);
      try {
        let resultado;
        
        // Si NO es auditoría automática, usar endpoint de auditoría manual
        if (!auditoriaAutomatica) {
          resultado = await api.post(`/presupuestos/${presupuestoId}/auditoria-manual`, {});
          
          // Mostrar razones encontradas
          if (resultado.data.razones && resultado.data.razones.length > 0) {
            const totalViolaciones = resultado.data.totalViolaciones || resultado.data.razones.length;
            const razonesTexto = resultado.data.razones.join('\n• ');
            
            notifications.show({
              title: `🔍 Auditoría Manual Solicitada`,
              message: `${totalViolaciones} condición${totalViolaciones > 1 ? 'es' : ''} detectada${totalViolaciones > 1 ? 's' : ''}:\n• ${razonesTexto}`,
              color: "blue",
              position: "top-center",
              autoClose: 8000,
            });
          }
        } else {
          // Si es auditoría automática, solo enviar mensaje adicional
          await api.put(`/auditoria/pedir/${presupuestoId}`, {
            mensaje: mensaje || null,
          });
        }

        notifications.show({
          title: "Auditoría Solicitada",
          message:
            "La Gerencia Prestacional será notificada para revisar el presupuesto",
          color: "green",
          position: "top-center",
          autoClose: 5000,
        });
        
        cerrarModalAuditoria();
        setAuditoriaAutomatica(false); // Reset
        setRecargarHistorial((prev) => prev + 1);
        
        setActiveTab('historial');
        setTimeout(() => {
          handleNuevoPresupuesto();
        }, 500);
        
      } catch (error) {
        console.error("Error:", error);
        notifications.show({
          title: "Error",
          message: "Error al solicitar auditoría",
          color: "red",
          position: "top-center",
          autoClose: false,
        });
      } finally {
        setEnviandoAuditoria(false);
      }
    },
    [presupuestoId, auditoriaAutomatica, cerrarModalAuditoria, handleNuevoPresupuesto]
  );

  const handleConfirmarEdicion = useCallback(async () => {
    if (!presupuestoParaEditar) return;

    try {
      const response = await crearVersionParaEdicion(
        presupuestoParaEditar.idPresupuestos,
        true
      );

      // Setear datosHistorial ANTES de cargar para que zonaId esté disponible
      setDatosHistorial({
        nombre: presupuestoParaEditar.Nombre_Apellido,
        dni: presupuestoParaEditar.DNI,
        sucursal: presupuestoParaEditar.Sucursal,
        sucursal_id: presupuestoParaEditar.sucursal_id,
        financiador_id: presupuestoParaEditar.financiador_id?.toString(),
        zonaId: presupuestoParaEditar.zona_tarifario_id,
        zona_tarifario_id: presupuestoParaEditar.zona_tarifario_id,
        zona_financiador_id: presupuestoParaEditar.zona_financiador_id
      });
      
      // Sincronizar estados locales
      setLiveZonaTarifarioId(presupuestoParaEditar.zona_tarifario_id);
      setLiveZonaFinanciadorId(presupuestoParaEditar.zona_financiador_id);
      
      // Actualizar estado del hook ANTES de cargar items
      const sucursalData = await api.get(`/sucursales`);
      const sucursal = sucursalData.data.find((s: any) => s.ID === presupuestoParaEditar.sucursal_id);
      const porcentajeInsumos = sucursal?.suc_porcentaje_insumos || 0;
      
      crearPresupuesto(
        response.id,
        presupuestoParaEditar.Nombre_Apellido,
        presupuestoParaEditar.Sucursal,
        porcentajeInsumos,
        presupuestoParaEditar.financiador_id?.toString()
      );
      
      setSoloLectura(false);

      await cargarPresupuesto(
        response.id,
        presupuestoParaEditar.Nombre_Apellido,
        presupuestoParaEditar.Sucursal,
        presupuestoParaEditar.financiador_id,
        setInsumosSeleccionados,
        setPrestacionesSeleccionadas,
        setEsCargaHistorial,
        false,
        setTotalesDesdeBaseDatos,
        setEquipamientosSeleccionados
      );

      cerrarModalEdicion();
      setActiveTab("datos");
    } catch (error) {
      console.error("Error al confirmar edición:", error);
    }
  }, [presupuestoParaEditar, crearVersionParaEdicion, cargarPresupuesto]);

  return (
    <ResponsiveContainer px={{ base: 'xs', sm: 'md', lg: 'xl' }} py="md">
      <Group justify="space-between" mb={20}>
        <Title fw={500} order={2} c="blue">
          Cotizador General
        </Title>
        <Group gap="xs">
          <UserCircleIcon style={ICON_SIZE} />
          <Text fw={500} size="sm" tt="capitalize">
            {user?.username}
          </Text>
          <ConnectionStatus isConnected={isConnected} />
          <Button
            ml="md"
            variant="outline"
            color="red"
            size="xs"
            onClick={logout}
            rightSection={<ArrowRightStartOnRectangleIcon style={ICON_SIZE} />}
          >
            Salir
          </Button>
        </Group>
      </Group>

      {presupuestoId && (
        <Group align="stretch" gap="lg">
          <Paper
            p="md"
            radius="md"
            withBorder
            shadow="xs"
            style={{ backgroundColor: "#e1f8d4", flex: 1 }}
            maw={600}
          >
            <Group align="stretch" gap="xs">
              <Card
                shadow="xs"
                padding="md"
                radius="md"
                withBorder
                            >
                <Flex direction="column" gap={2}>
                  <Group gap="xs">
                    <DocumentTextIcon style={ICON_SIZE} />
                    <Text fw={500} size="sm" tt="capitalize">
                      Paciente: {clienteNombre}
                    </Text>
                  </Group>
                  {financiadorInfo?.Financiador && (
                    <>
                      <Text fw={400} size="xs" c="dimmed" pl={24}>
                        Financiador: {financiadorInfo.Financiador}
                      </Text>
                      <Group gap="xs" pl={24} wrap="wrap">
                        <Text size="xs" c={(financiadorInfo.tasa_mensual !== undefined && financiadorInfo.tasa_mensual !== null) ? "blue" : "gray"}>
                          Tasa: {(financiadorInfo.tasa_mensual !== undefined && financiadorInfo.tasa_mensual !== null) ? financiadorInfo.tasa_mensual : configDefaults.tasa}%
                          {(financiadorInfo.tasa_mensual === undefined || financiadorInfo.tasa_mensual === null) && <Text component="span" fs="italic"> (default)</Text>}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Cobranza:
                          {financiadorInfo.dias_cobranza_teorico !== undefined && (
                            <Text component="span" c="orange"> Teórico {financiadorInfo.dias_cobranza_teorico}d</Text>
                          )}
                          {financiadorInfo.dias_cobranza_real !== undefined && (
                            <Text component="span" c="green"> Real {financiadorInfo.dias_cobranza_real}d</Text>
                          )}
                          {!financiadorInfo.dias_cobranza_teorico && !financiadorInfo.dias_cobranza_real && (
                            <Text component="span" c="gray" fs="italic"> {configDefaults.dias}d (default)</Text>
                          )}
                        </Text>
                        {financiadorInfo.acuerdo_nombre ? (
                          <Text size="xs" c="teal">
                            {financiadorInfo.acuerdo_nombre}
                          </Text>
                        ) : (
                          <Text size="xs" c="gray" fs="italic">
                            Sin convenio Firmado
                          </Text>
                        )}
                      </Group>
                    </>
                  )}
                </Flex>

                <Grid mt="xs" grow gutter="xs">
                  {/* Columna izquierda */}
                  <Grid.Col span={6} >
                    <Flex direction="column" mr="lg">
                      <Flex justify="space-between" align="center">
                        <Text fw={500} size="sm">
                          Insumos:
                        </Text>
                        <Text fw={500} size="sm">
                          {numberFormat.formatCurrency(totalInsumos)}
                        </Text>
                      </Flex>

                      <Flex justify="space-between" align="center">
                        <Text fw={500} size="sm">
                          Prestaciones:
                        </Text>
                        <Text fw={500} size="sm">
                          {numberFormat.formatCurrency(totalPrestaciones)}
                        </Text>
                      </Flex>

                      <Flex justify="space-between" align="center">
                        <Text fw={500} size="sm">
                          Equipamiento:
                        </Text>
                        <Text fw={500} size="sm">
                          {numberFormat.formatCurrency(totalFacturarEquipamiento)}
                        </Text>
                      </Flex>
                    </Flex>
                  </Grid.Col>

                  {/* Columna derecha */}
                  <Grid.Col span={6} >
                    <Flex direction="column" ml="lg">
                      <Flex justify="space-between" align="center">
                        <Text fw={500} size="sm">
                          Costo Total:
                        </Text>
                        <Text fw={500} size="sm" c="blue">
                          {numberFormat.formatCurrency(costoTotal)}
                        </Text>
                      </Flex>

                      <Flex justify="space-between" align="center">
                        <Text fw={500} size="sm">
                          A Facturar:
                        </Text>
                        <Text fw={500} size="sm" c="orange">
                          {numberFormat.formatCurrency(totalFacturar)}
                        </Text>
                      </Flex>
                    </Flex>
                  </Grid.Col>

                  {/* Fila completa */}
                  <Grid.Col span={12}>
                    <Flex direction="column">
                      <Flex justify="space-between" align="center">
                        <Text fw={500} size="sm">
                          Utilidad:
                        </Text>
                        <Text
                          fw={500}
                          size="sm"
                          c={totalFacturar - costoTotal >= 0 ? "green" : "red"}
                        >
                          {numberFormat.formatCurrency(totalFacturar - costoTotal)}
                        </Text>
                      </Flex>

                      <Flex justify="space-between" align="center">
                        <Text fw={600} size="sm">
                          Rentabilidad:
                        </Text>
                        <Group gap={4}>
                          <Text
                            fw={600}
                            size="sm"
                            c={rentabilidad >= 0 ? "green" : "red"}
                          >
                            {rentabilidad.toFixed(2)}%
                          </Text>

                          {financiadorInfo?.dias_cobranza_real && (
                            <>
                              <Text fw={400} size="xs" c="dimmed">
                                |
                              </Text>
                              <Text
                                fw={660}
                                size="sm"
                                c={rentabilidadConPlazo >= 0 ? "teal" : "red"}
                              >
                                {rentabilidadConPlazo.toFixed(2)}%
                              </Text>
                              <Text fw={400} size="xs" c="dimmed">
                                (plazo)
                              </Text>
                            </>
                          )}
                        </Group>
                      </Flex>
                    </Flex>
                  </Grid.Col>
                </Grid>
              </Card>


                

            </Group>
            <Group align="baseline"  mt="xs" grow>
                  <Button
                    onClick={handleFinalizarPresupuesto}
                    loading={guardandoTotales}
                    disabled={soloLectura || guardandoTotales}
                    size="xs"
                    color="green"                    
                    justify="center"
                    leftSection={<ArchiveBoxArrowDownIcon style={ICON_SIZE} />}
                  >
                    Finalizar
                  </Button>
                  <Button
                    onClick={abrirModalAuditoria}
                    size="xs"
                    variant="outline"
                    color="orange"
                    disabled={soloLectura}
                    justify="center"
                    leftSection={<ShieldCheckIcon style={ICON_SIZE} />}
                  >
                    Auditoría
                  </Button>
                  <Button
                    onClick={generarPDF}
                    size="xs"
                    variant="outline"
                    color="green"
                    justify="center"
                    leftSection={<DocumentArrowDownIcon style={ICON_SIZE} />}
                  >
                    PDF
                  </Button>
                </Group>
          </Paper>

          {alertas.length > 0 && (
            <Paper
              p="xs"
              radius="md"
              withBorder
              shadow="xs"
              style={{ flex: 1 }}
            >
              <Group gap="xs" mb="sm">
                <ShieldExclamationIcon color="red" style={ICON_SIZE} />
                <Text fw={500} size="sm" c="red">
                  Alertas ({alertas.length})
                </Text>
              </Group>
              <ScrollArea h={200} type="auto">
                <Flex direction="column">{alertas}</Flex>
              </ScrollArea>
            </Paper>
          )}
        </Group>
      )}

      <Tabs
        value={activeTab}
        onChange={setActiveTab}
        color="green"
        mt="lg"
        radius="md"
      >
        <Tabs.List grow>
          <Tabs.Tab value="datos" style={TAB_HOVER_STYLE}>
            <Group gap="xs">
              <IdentificationIcon style={ICON_SIZE} />
              Datos Paciente
            </Group>
          </Tabs.Tab>
          <Tabs.Tab
            value="insumos"
            style={TAB_HOVER_STYLE}
            disabled={!presupuestoId}
          >
            <Group gap="xs">
              <BeakerIcon style={ICON_SIZE} />
              Insumos
            </Group>
          </Tabs.Tab>
          <Tabs.Tab
            value="prestaciones"
            style={TAB_HOVER_STYLE}
            disabled={!presupuestoId}
          >
            <Group gap="xs">
              <BriefcaseIcon style={ICON_SIZE} />
              Prestaciones
            </Group>
          </Tabs.Tab>
          <Tabs.Tab
            value="equipamiento"
            style={TAB_HOVER_STYLE}
            disabled={!presupuestoId || !financiadorId}
          >
            <Group gap="xs">
              <LifebuoyIcon style={ICON_SIZE} />
              Equipamiento
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="historial" style={TAB_HOVER_STYLE}>
            <Group gap="xs">
              <ClockIcon style={ICON_SIZE} />
              Historial
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="notificaciones" style={TAB_HOVER_STYLE}>
            <Group gap="xs">
              <BellIcon style={ICON_SIZE} />
              Notificaciones
              <NotificationIndicator count={notificationCount} />
            </Group>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="datos" pt="md">
          <DatosPresupuesto
            onPresupuestoCreado={handlePresupuestoCreado}
            onNuevoPresupuesto={handleNuevoPresupuesto}
            onCargarPresupuesto={handleCargarPresupuesto}
            onFinanciadorIdChange={setFinanciadorId}
            onZonaTarifarioIdChange={setLiveZonaTarifarioId}
            onZonaFinanciadorIdChange={setLiveZonaFinanciadorId}
            esCargaHistorial={esCargaHistorial}
            setEsCargaHistorial={setEsCargaHistorial}
            datosHistorial={datosHistorial}
            soloLectura={soloLectura}
          />
        </Tabs.Panel>

        <Tabs.Panel value="insumos" pt="md">
          <Insumos
            insumosSeleccionados={insumosSeleccionados}
            setInsumosSeleccionados={setInsumosSeleccionados}
            onTotalChange={setTotalInsumos}
            presupuestoId={presupuestoId}
            porcentajeInsumos={porcentajeInsumos}
            financiador={financiadorInfo ? { porcentaje_insumos: financiadorInfo.porcentaje_insumos } : null}
            soloLectura={soloLectura}
          />
        </Tabs.Panel>

        <Tabs.Panel value="prestaciones" pt="md">
          <Prestaciones
            key={presupuestoId}
            prestacionesSeleccionadas={prestacionesSeleccionadas}
            setPrestacionesSeleccionadas={setPrestacionesSeleccionadas}
            onTotalChange={setTotalesPrestaciones}
            presupuestoId={presupuestoId}
            financiadorId={financiadorId || datosHistorial?.financiador_id || null}
            soloLectura={soloLectura}
            sucursalId={datosHistorial?.sucursal_id || null}
            zonaId={liveZonaTarifarioId || datosHistorial?.zonaId || null}
            zonaTarifarioId={liveZonaTarifarioId || datosHistorial?.zona_tarifario_id || null}
            zonaFinanciadorId={liveZonaFinanciadorId || datosHistorial?.zona_financiador_id || null}
          />
        </Tabs.Panel>

        <Tabs.Panel value="equipamiento" pt="md">
          <Equipamiento
            presupuestoId={presupuestoId}
            financiadorId={financiadorId}
            sucursalId={datosHistorial?.sucursal_id || null}
            equipamientosSeleccionados={equipamientosSeleccionados}
            setEquipamientosSeleccionados={setEquipamientosSeleccionados}
            onTotalChange={(costo, facturar) => {
              setTotalCostoEquipamiento(costo);
              setTotalFacturarEquipamiento(facturar);
            }}
            soloLectura={soloLectura}
          />
        </Tabs.Panel>

        <Tabs.Panel value="historial" pt="md">
          <ListaPresupuestos
            onEditarPresupuesto={handleEditarPresupuesto}
            recargarTrigger={recargarHistorial}
          />
        </Tabs.Panel>

        <Tabs.Panel value="notificaciones" pt="md">
          <Notificaciones />
        </Tabs.Panel>
      </Tabs>

      <ModalAuditoria
        opened={modalAuditoriaAbierto}
        onClose={() => {
          cerrarModalAuditoria();
          setAuditoriaAutomatica(false); // Reset al cerrar
        }}
        tipo="solicitar"
        presupuesto={{
          id: presupuestoId || 0,
          nombre: clienteNombre,
        }}
        onConfirmar={handlePedirAuditoria}
        loading={enviandoAuditoria}
      />

      <ModalConfirmarEdicion
        opened={modalEdicionAbierto}
        onClose={cerrarModalEdicion}
        presupuesto={
          presupuestoParaEditar ? {
            id: presupuestoParaEditar.idPresupuestos,
            nombre: presupuestoParaEditar.Nombre_Apellido,
            version: presupuestoParaEditar.version || 1,
            estado: presupuestoParaEditar.estado || 'borrador'
          } : { id: 0, nombre: "", version: 0, estado: "" }
        }
        requiereNuevaVersion={infoEdicion?.requiereNuevaVersion || false}
        onConfirmar={handleConfirmarEdicion}
      />
    </ResponsiveContainer>
  );
}
