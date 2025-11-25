import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {Tabs,Container,Title, Group,Text,Button, Paper, Flex,SimpleGrid,Collapse,ActionIcon,Card,Modal,Textarea,Badge} from "@mantine/core";
import { notifications } from '@mantine/notifications';
import { useAuth } from "../contexts/AuthContext";
import { useNotificationCount } from '../hooks/useNotificationCount';
import DatosPresupuesto from "./DatosPresupuesto";
import Notificaciones from "./Notificaciones";
import Auditoria from "./Auditoria";
import { NotificationIndicator } from '../components/NotificationIndicator';
import { ModalAuditoria } from '../components/ModalAuditoria';
import { ModalConfirmarEdicion } from '../components/ModalConfirmarEdicion';
import { ConnectionStatus } from '../components/ConnectionStatus';
import Insumos from "./Insumos";
import Prestaciones from "./Prestaciones";
import ListaPresupuestos from "./ListaPresupuestos";
import {
  DocumentArrowDownIcon,
  IdentificationIcon,
  BeakerIcon,
  BriefcaseIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArchiveBoxArrowDownIcon,
  ClockIcon,
  BellIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { useAlertaCotizador } from '../hooks/useAlertaCotizador';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { useTotales } from '../hooks/useTotales';
import { useFinanciador } from '../hooks/useFinanciador';
import { pdfClientService } from '../services/pdfClientService';
import { api } from '../api/api';

const ICON_SIZE = { width: 20, height: 20 };
const TAB_HOVER_STYLE = { '&:hover': { backgroundColor: '#dff1db' } };
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const { count: notificationCount, isConnected, refreshData } = useNotificationCount();
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<any[]>([]);
  const [prestacionesSeleccionadas, setPrestacionesSeleccionadas] = useState<any[]>([]);
  const [alertasAbiertas, setAlertasAbiertas] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('datos');
  const [esCargaHistorial, setEsCargaHistorial] = useState(false);
  const [datosHistorial, setDatosHistorial] = useState<{ nombre: string; dni: string; sucursal: string } | undefined>();
  const [recargarHistorial, setRecargarHistorial] = useState(0);
  const [filtroAuditoriaPresupuesto, setFiltroAuditoriaPresupuesto] = useState<number | null>(null);
  const [modalAuditoriaAbierto, setModalAuditoriaAbierto] = useState(false);
  const [enviandoAuditoria, setEnviandoAuditoria] = useState(false);
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [presupuestoParaEditar, setPresupuestoParaEditar] = useState<any>(null);
  const [infoEdicion, setInfoEdicion] = useState<any>(null);
  const [soloLectura, setSoloLectura] = useState(false);

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
  } = useTotales(financiadorInfo, prestacionesSeleccionadas, porcentajeInsumos);

  useFinanciador(financiadorId, setFinanciadorInfo);

  const rentabilidadFinal = useMemo(() => 
    financiadorInfo?.dias_cobranza_real ? rentabilidadConPlazo : rentabilidad,
    [financiadorInfo, rentabilidadConPlazo, rentabilidad]
  );

  const alertas = useAlertaCotizador({
    presupuestoId,
    clienteNombre,
    totalInsumos,
    totalPrestaciones,
    totalFacturar,
    rentabilidad: rentabilidadFinal,
    financiadorId,
    financiadorInfo,
    prestacionesSeleccionadas,
  });

  const handleFinalizarPresupuesto = useCallback(async () => {
    try {
      const totales = {
        totalInsumos,
        totalPrestaciones,
        costoTotal,
        totalFacturar,
        rentabilidad,
        rentabilidadConPlazo
      };
      
      const response = await finalizarPresupuesto(totales);
      setRecargarHistorial(prev => prev + 1);
      
      // Limpiar interfaz después de finalizar
      setTimeout(() => {
        handleNuevoPresupuesto();
      }, 2000);
    } catch (error) {
      console.error('Error al finalizar presupuesto:', error);
    }
  }, [finalizarPresupuesto, totalInsumos, totalPrestaciones, costoTotal, totalFacturar, rentabilidad, rentabilidadConPlazo]);

  const handleNuevoPresupuesto = useCallback(() => {
    resetPresupuesto();
    resetTotales();
    setInsumosSeleccionados([]);
    setPrestacionesSeleccionadas([]);
    setEsCargaHistorial(false);
    setDatosHistorial(undefined);
    setSoloLectura(false);
  }, [resetPresupuesto, resetTotales]);

  const handleEditarPresupuesto = useCallback(async (presupuesto: any, soloLecturaParam: boolean = true) => {
    if (soloLecturaParam) {
      // Modo visualización (historial)
      setSoloLectura(true);
      setDatosHistorial({
        nombre: presupuesto.Nombre_Apellido,
        dni: presupuesto.DNI,
        sucursal: presupuesto.Sucursal
      });
      await cargarPresupuesto(
        presupuesto.idPresupuestos,
        presupuesto.Nombre_Apellido,
        presupuesto.Sucursal,
        presupuesto.idobra_social,
        setInsumosSeleccionados,
        setPrestacionesSeleccionadas,
        setEsCargaHistorial,
        true,
        setTotalesDesdeBaseDatos
      );
    } else {
      // Modo edición - verificar si necesita confirmación
      try {
        const response = await crearVersionParaEdicion(presupuesto.idPresupuestos, false);
        
        if (response.requiereConfirmacion) {
          // Mostrar modal de confirmación
          setPresupuestoParaEditar(presupuesto);
          setInfoEdicion(response);
          setModalEdicionAbierto(true);
          return;
        }
        
        // Si no requiere confirmación, cargar directamente
        setSoloLectura(false);
        setDatosHistorial({
          nombre: presupuesto.Nombre_Apellido,
          dni: presupuesto.DNI,
          sucursal: presupuesto.Sucursal
        });
        
        await cargarPresupuesto(
          response.id,
          presupuesto.Nombre_Apellido,
          presupuesto.Sucursal,
          presupuesto.idobra_social,
          setInsumosSeleccionados,
          setPrestacionesSeleccionadas,
          setEsCargaHistorial,
          false,
          setTotalesDesdeBaseDatos
        );
      } catch (error) {
        console.error('Error al preparar edición:', error);
      }
    }
    setActiveTab('datos');
  }, [cargarPresupuesto, crearVersionParaEdicion]);

  const handleFinanciadorChange = useCallback((id: string | null, info: any) => {
    setFinanciadorId(id);
    setFinanciadorInfo(info);
  }, [setFinanciadorId, setFinanciadorInfo]);

  const handleDescargarPDF = useCallback(() => {
    if (!presupuestoId || !datosHistorial) return;

    pdfClientService.generarYDescargar({
      cliente: datosHistorial.nombre,
      dni: datosHistorial.dni,
      sucursal: datosHistorial.sucursal,
      presupuestoId,
      insumos: insumosSeleccionados,
      prestaciones: prestacionesSeleccionadas,
      totales: {
        totalInsumos,
        totalPrestaciones,
        costoTotal,
        totalFacturar,
        rentabilidad: rentabilidadFinal,
      },
    });
  }, [presupuestoId, datosHistorial, insumosSeleccionados, prestacionesSeleccionadas, totalInsumos, totalPrestaciones, costoTotal, totalFacturar, rentabilidadFinal]);

  const abrirModalAuditoria = useCallback(() => {
    if (!presupuestoId) return;
    setModalAuditoriaAbierto(true);
  }, [presupuestoId]);

  const cerrarModalAuditoria = useCallback(() => {
    setModalAuditoriaAbierto(false);
  }, []);

  const handlePedirAuditoria = useCallback(async (mensaje: string) => {
    if (!presupuestoId) return;
    
    setEnviandoAuditoria(true);
    try {
      await api.put(`/auditoria/pedir/${presupuestoId}`, {
        mensaje: mensaje || null
      });
      
      notifications.show({
        title: 'Auditoría Solicitada',
        message: 'El auditor médico será notificado para revisar el presupuesto',
        color: 'blue',
        position: 'top-center',
        autoClose: false,
      });
      cerrarModalAuditoria();
    } catch (error) {
      console.error('Error:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al solicitar auditoría',
        color: 'red',
        position: 'top-center',
        autoClose: false,
      });
    } finally {
      setEnviandoAuditoria(false);
    }
  }, [presupuestoId, cerrarModalAuditoria]);

  const handleConfirmarEdicion = useCallback(async () => {
    if (!presupuestoParaEditar) return;
    
    try {
      const response = await crearVersionParaEdicion(presupuestoParaEditar.idPresupuestos, true);
      
      setSoloLectura(false);
      setDatosHistorial({
        nombre: presupuestoParaEditar.Nombre_Apellido,
        dni: presupuestoParaEditar.DNI,
        sucursal: presupuestoParaEditar.Sucursal
      });
      
      await cargarPresupuesto(
        response.id,
        presupuestoParaEditar.Nombre_Apellido,
        presupuestoParaEditar.Sucursal,
        presupuestoParaEditar.idobra_social,
        setInsumosSeleccionados,
        setPrestacionesSeleccionadas,
        setEsCargaHistorial,
        false,
        setTotalesDesdeBaseDatos
      );
      
      setModalEdicionAbierto(false);
      setActiveTab('datos');
    } catch (error) {
      console.error('Error al confirmar edición:', error);
    }
  }, [presupuestoParaEditar, crearVersionParaEdicion, cargarPresupuesto]);

  return (
    <Container fluid p="xl">
      <Group justify="space-between" mb={20}>
        <Title fw={500} order={2} c="blue">Cotizador General</Title>
        <Group gap="xs">
          <UserCircleIcon style={ICON_SIZE} />
          <Text fw={500} size="sm" tt="capitalize">{user?.username}</Text>
          <ConnectionStatus 
            isConnected={isConnected}
          />
          <Button ml="md" variant="outline" color="red" size="xs" onClick={logout} rightSection={<ArrowRightStartOnRectangleIcon style={ICON_SIZE}/>}>
            Salir
          </Button>
        </Group>
      </Group>

      <Paper p="md" radius="md" withBorder shadow="xs" style={{ backgroundColor: '#c5e4b6' }}>
        <Group justify="space-between" px="xs" pt="xs">
          {presupuestoId && (
            <Group gap="xs">
              <DocumentTextIcon style={ICON_SIZE} />
              <Text fw={500} tt="capitalize">Paciente: {clienteNombre}</Text>
            </Group>
          )}
          {presupuestoId && (
            <Group gap="xs">
              <Button onClick={handleFinalizarPresupuesto} loading={guardandoTotales} size="xs" color="green" leftSection={<ArchiveBoxArrowDownIcon style={ICON_SIZE} />}>
                Finalizar Presupuesto
              </Button>
              <Button 
                onClick={abrirModalAuditoria} 
                size="xs" 
                variant="outline" 
                color="orange"
                leftSection={<ShieldCheckIcon style={ICON_SIZE} />}
                disabled={!presupuestoId}
              >
                Pedir Auditoría
              </Button>
              <Button 
                onClick={handleDescargarPDF} 
                size="xs" 
                variant="outline" 
                color="Green"
                leftSection={<DocumentArrowDownIcon style={ICON_SIZE} />}
              >
                Descargar PDF
              </Button>
            </Group>
          )}
        </Group>
        

        <Group grow p="xs">
          <Card shadow="xs" padding="md" radius="md" withBorder>
            <Flex direction="column" gap="xs">
              <Flex justify="space-between">
                <Text fw={500}>Insumos:</Text>
                <Text fw={500}>{formatCurrency(totalInsumos)}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text fw={500}>Prestaciones:</Text>
                <Text fw={500}>{formatCurrency(totalPrestaciones)}</Text>
              </Flex>
            </Flex>
          </Card>

          <Card shadow="xs" padding="md" radius="md" withBorder>
            <Flex direction="column" gap="xs">
              <Flex justify="space-between">
                <Text fw={500}>Costo Total:</Text>
                <Text fw={500} c="blue">{formatCurrency(costoTotal)}</Text>
              </Flex>
              <Flex justify="space-between">
                <Text fw={500}>Total a Facturar:</Text>
                <Text fw={500} c="orange">{formatCurrency(totalFacturar)}</Text>
              </Flex>
            </Flex>
          </Card>

          <Card shadow="xs" padding="md" radius="md" withBorder>
            <Flex direction="column" gap="xs">
              <Flex justify="space-between">
                <Text fw={600}>Rentabilidad:</Text>
                <Text fw={600} c={rentabilidad >= 0 ? "green" : "red"}>
                  {rentabilidad.toFixed(2)}%
                </Text>
              </Flex>
              {financiadorInfo?.dias_cobranza_real && (
                <Flex justify="space-between">
                  <Text fw={600}>Con Plazo:</Text>
                  <Text fw={600} c={rentabilidadConPlazo >= 0 ? "teal" : "red"}>
                    {rentabilidadConPlazo.toFixed(2)}%
                  </Text>
                </Flex>
              )}
            </Flex>
          </Card>
        </Group>
      </Paper>

      {alertas.length > 0 && (
        <Paper shadow="xs" p="md" radius="md" withBorder mt="xs" onClick={() => setAlertasAbiertas(!alertasAbiertas)} style={{ cursor: 'pointer' }}>
          <Group justify="space-between" mb={alertasAbiertas ? 12 : 0}>
            <Group gap="xs">
              <ShieldExclamationIcon color="red" style={ICON_SIZE} />
              <Text fw={400} size="md" color="red">Alertas Disponibles</Text>
            </Group>
            <ActionIcon variant="subtle">
              {alertasAbiertas ? <ChevronUpIcon style={{ width: 18, height: 18 }} /> : <ChevronDownIcon style={{ width: 18, height: 18 }} />}
            </ActionIcon>
          </Group>
          <Collapse in={alertasAbiertas}>
            <SimpleGrid cols={2}>
              {alertas}
            </SimpleGrid>
          </Collapse>
        </Paper>
      )}  

      <Tabs value={activeTab} onChange={setActiveTab} color="green" mt="lg" radius="md">
        <Tabs.List grow>
          <Tabs.Tab value="datos" style={TAB_HOVER_STYLE}>
            <Group gap="xs">
              <IdentificationIcon style={ICON_SIZE} />
              Datos Paciente
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="insumos" style={TAB_HOVER_STYLE} disabled={!presupuestoId}>
            <Group gap="xs">
              <BeakerIcon style={ICON_SIZE} />
              Insumos
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="prestaciones" style={TAB_HOVER_STYLE} disabled={!presupuestoId}>
            <Group gap="xs">
              <BriefcaseIcon style={ICON_SIZE} />
              Prestaciones
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
          {user?.rol === 'auditor_medico' && (
            <Tabs.Tab value="auditoria" style={TAB_HOVER_STYLE}>
              <Group gap="xs">
                <ShieldCheckIcon style={ICON_SIZE} />
                Auditoría
              </Group>
            </Tabs.Tab>
          )}
        </Tabs.List>

        <Tabs.Panel value="datos" pt="md">
          <DatosPresupuesto
            onPresupuestoCreado={crearPresupuesto}
            onNuevoPresupuesto={handleNuevoPresupuesto}
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
            soloLectura={soloLectura}
          />
        </Tabs.Panel>

        <Tabs.Panel value="prestaciones" pt="md">
          <Prestaciones
            prestacionesSeleccionadas={prestacionesSeleccionadas}
            setPrestacionesSeleccionadas={setPrestacionesSeleccionadas}
            onTotalChange={setTotalesPrestaciones}
            presupuestoId={presupuestoId}
            financiadorId={financiadorId}
            onFinanciadorChange={handleFinanciadorChange}
            soloLectura={soloLectura}
          />
        </Tabs.Panel>

        <Tabs.Panel value="historial" pt="md">
          <ListaPresupuestos onEditarPresupuesto={handleEditarPresupuesto} recargarTrigger={recargarHistorial} />
        </Tabs.Panel>

        <Tabs.Panel value="notificaciones" pt="md">
          <Notificaciones onIrAuditoria={(presupuestoId) => {
            setFiltroAuditoriaPresupuesto(presupuestoId);
            setActiveTab('auditoria');
          }} />
        </Tabs.Panel>

        {user?.rol === 'auditor_medico' && (
          <Tabs.Panel value="auditoria" pt="md">
            <Auditoria 
              onCargarPresupuesto={handleEditarPresupuesto} 
              filtroPresupuesto={filtroAuditoriaPresupuesto}
              onLimpiarFiltro={() => setFiltroAuditoriaPresupuesto(null)}
            />
          </Tabs.Panel>
        )}
      </Tabs>

      <ModalAuditoria
        opened={modalAuditoriaAbierto}
        onClose={cerrarModalAuditoria}
        tipo="solicitar"
        presupuesto={{
          id: presupuestoId || 0,
          nombre: clienteNombre
        }}
        onConfirmar={handlePedirAuditoria}
        loading={enviandoAuditoria}
      />

      <ModalConfirmarEdicion
        opened={modalEdicionAbierto}
        onClose={() => setModalEdicionAbierto(false)}
        presupuesto={presupuestoParaEditar || { id: 0, nombre: '', version: 0, estado: '' }}
        requiereNuevaVersion={infoEdicion?.requiereNuevaVersion || false}
        onConfirmar={handleConfirmarEdicion}
      />
    </Container>
  );
}
