import { useState, useCallback, useMemo } from "react";
import {
  Tabs,
  Container,
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
import DatosPresupuesto from "./DatosPresupuesto";
import Notificaciones from "./Notificaciones";
import { NotificationIndicator } from "../components/NotificationIndicator";
import { ModalAuditoria } from "../components/ModalAuditoria";
import { ModalConfirmarEdicion } from "../components/ModalConfirmarEdicion";
import { ModalValidacionItems } from "../components/ModalValidacionItems";
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
} from "@heroicons/react/24/outline";
import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { useAlertaCotizador } from "../hooks/useAlertaCotizador";
import { usePresupuesto } from "../hooks/usePresupuesto";
import { useTotales } from "../hooks/useTotales";
import { useFinanciador } from "../hooks/useFinanciador";
import { useModalState } from "../hooks/useModalState";
import { useItemValidation } from "../hooks/useItemValidation";
import { pdfClientService } from "../services/pdfClientService";
import { api } from "../api/api";

const ICON_SIZE = { width: 20, height: 20 };
const TAB_HOVER_STYLE = { "&:hover": { backgroundColor: "#dff1db" } };
const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(value);

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
    { nombre: string; dni: string; sucursal: string } | undefined
  >();
  const [recargarHistorial, setRecargarHistorial] = useState(0);
  const [enviandoAuditoria, setEnviandoAuditoria] = useState(false);
  const [presupuestoParaEditar, setPresupuestoParaEditar] = useState<any>(null);
  const [infoEdicion, setInfoEdicion] = useState<any>(null);
  const [soloLectura, setSoloLectura] = useState(false);
  const [itemsFaltantes, setItemsFaltantes] = useState<any[]>([]);
  const [validacionCompletada, setValidacionCompletada] = useState(false);

  const {
    modalAuditoriaAbierto,
    modalEdicionAbierto,
    modalValidacionAbierto,
    abrirModalAuditoria: abrirModalAuditoriaBase,
    cerrarModalAuditoria,
    abrirModalEdicion,
    cerrarModalEdicion,
    abrirModalValidacion,
    cerrarModalValidacion,
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

  const { validarItems, procesarItem } = useItemValidation(presupuestoId);

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
    rentabilidad: rentabilidadFinal,
    financiadorId,
    financiadorInfo,
    prestacionesSeleccionadas,
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

      await finalizarPresupuesto(totales);
      setRecargarHistorial((prev) => prev + 1);
      setValidacionCompletada(false);

      setTimeout(() => {
        handleNuevoPresupuesto();
      }, 2000);
    } catch (error) {
      console.error("Error al finalizar presupuesto:", error);
      setValidacionCompletada(false);
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
  ]);

  const handleFinalizarPresupuesto = useCallback(async () => {
    if (validacionCompletada) {
      await ejecutarFinalizacion();
      return;
    }

    const { valido, faltantes } = await validarItems(
      insumosSeleccionados,
      prestacionesSeleccionadas
    );

    if (!valido && faltantes.length > 0) {
      setItemsFaltantes(faltantes);
      abrirModalValidacion();
    } else {
      await ejecutarFinalizacion();
    }
  }, [
    validacionCompletada,
    validarItems,
    insumosSeleccionados,
    prestacionesSeleccionadas,
    abrirModalValidacion,
    ejecutarFinalizacion,
  ]);

  const handleEditarPresupuesto = useCallback(
    async (presupuesto: any, soloLecturaParam: boolean = true) => {
      if (soloLecturaParam) {
        setSoloLectura(true);
        setDatosHistorial({
          nombre: presupuesto.Nombre_Apellido,
          dni: presupuesto.DNI,
          sucursal: presupuesto.Sucursal,
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

          setSoloLectura(false);
          setDatosHistorial({
            nombre: presupuesto.Nombre_Apellido,
            dni: presupuesto.DNI,
            sucursal: presupuesto.Sucursal,
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
          console.error("Error al preparar edición:", error);
        }
      }
      setActiveTab("datos");
    },
    [cargarPresupuesto, crearVersionParaEdicion]
  );

  const handleFinanciadorChange = useCallback(
    (id: string | null, info: any) => {
      setFinanciadorId(id);
      setFinanciadorInfo(info);
    },
    [setFinanciadorId, setFinanciadorInfo]
  );

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
  }, [
    presupuestoId,
    datosHistorial,
    insumosSeleccionados,
    prestacionesSeleccionadas,
    totalInsumos,
    totalPrestaciones,
    costoTotal,
    totalFacturar,
    rentabilidadFinal,
  ]);

  const abrirModalAuditoria = useCallback(() => {
    if (presupuestoId) abrirModalAuditoriaBase();
  }, [presupuestoId, abrirModalAuditoriaBase]);

  const handlePedirAuditoria = useCallback(
    async (mensaje: string) => {
      if (!presupuestoId) return;

      setEnviandoAuditoria(true);
      try {
        // 1. Finalizar presupuesto (guarda totales)
        const totales = {
          totalInsumos,
          totalPrestaciones,
          costoTotal,
          totalFacturar,
          rentabilidad,
          rentabilidadConPlazo,
        };
        
        await finalizarPresupuesto(totales);
        
        // 2. Forzar estado a "pendiente" con mensaje del modal
        await api.put(`/auditoria/pedir/${presupuestoId}`, {
          mensaje: mensaje || null,
        });

        notifications.show({
          title: "Auditoría Solicitada",
          message:
            "La Gerencia Administrativa será notificada para revisar el presupuesto",
          color: "blue",
          position: "top-center",
          autoClose: false,
        });
        
        cerrarModalAuditoria();
        setRecargarHistorial((prev) => prev + 1);
        
        setTimeout(() => {
          handleNuevoPresupuesto();
        }, 2000);
        
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
    [presupuestoId, cerrarModalAuditoria, finalizarPresupuesto, totalInsumos, totalPrestaciones, costoTotal, totalFacturar, rentabilidad, rentabilidadConPlazo, handleNuevoPresupuesto]
  );

  const handleContinuarValidacion = useCallback((continuar: boolean) => {
    cerrarModalValidacion();
    if (continuar) {
      setValidacionCompletada(true);
      handleFinalizarPresupuesto();
    } else {
      setItemsFaltantes([]);
    }
  }, [cerrarModalValidacion, handleFinalizarPresupuesto]);

  const handleConfirmarEdicion = useCallback(async () => {
    if (!presupuestoParaEditar) return;

    try {
      const response = await crearVersionParaEdicion(
        presupuestoParaEditar.idPresupuestos,
        true
      );

      setSoloLectura(false);
      setDatosHistorial({
        nombre: presupuestoParaEditar.Nombre_Apellido,
        dni: presupuestoParaEditar.DNI,
        sucursal: presupuestoParaEditar.Sucursal,
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

      cerrarModalEdicion();
      setActiveTab("datos");
    } catch (error) {
      console.error("Error al confirmar edición:", error);
    }
  }, [presupuestoParaEditar, crearVersionParaEdicion, cargarPresupuesto]);

  return (
    <Container fluid p="xl">
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
                    <Text fw={400} size="xs" c="dimmed" pl={24}>
                      Financiador: {financiadorInfo.Financiador}
                    </Text>
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
                          {formatCurrency(totalInsumos)}
                        </Text>
                      </Flex>

                      <Flex justify="space-between" align="center">
                        <Text fw={500} size="sm">
                          Prestaciones:
                        </Text>
                        <Text fw={500} size="sm">
                          {formatCurrency(totalPrestaciones)}
                        </Text>
                      </Flex>

                      <Flex justify="space-between" align="center">
                        <Text fw={500} size="sm">
                          Equipamiento:
                        </Text>
                        <Text fw={500} size="sm">
                          {formatCurrency(totalFacturarEquipamiento)}
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
                          {formatCurrency(costoTotal)}
                        </Text>
                      </Flex>

                      <Flex justify="space-between" align="center">
                        <Text fw={500} size="sm">
                          A Facturar:
                        </Text>
                        <Text fw={500} size="sm" c="orange">
                          {formatCurrency(totalFacturar)}
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
                          {formatCurrency(totalFacturar - costoTotal)}
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
                    justify="center"
                    leftSection={<ShieldCheckIcon style={ICON_SIZE} />}
                  >
                    Auditoría
                  </Button>
                  <Button
                    onClick={handleDescargarPDF}
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
              <BeakerIcon style={ICON_SIZE} />
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
            key={presupuestoId}
            prestacionesSeleccionadas={prestacionesSeleccionadas}
            setPrestacionesSeleccionadas={setPrestacionesSeleccionadas}
            onTotalChange={setTotalesPrestaciones}
            presupuestoId={presupuestoId}
            financiadorId={financiadorId}
            onFinanciadorChange={handleFinanciadorChange}
            soloLectura={soloLectura}
          />
        </Tabs.Panel>

        <Tabs.Panel value="equipamiento" pt="md">
          <Equipamiento
            presupuestoId={presupuestoId}
            financiadorId={financiadorId}
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
        onClose={cerrarModalAuditoria}
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
          presupuestoParaEditar || { id: 0, nombre: "", version: 0, estado: "" }
        }
        requiereNuevaVersion={infoEdicion?.requiereNuevaVersion || false}
        onConfirmar={handleConfirmarEdicion}
      />

      <ModalValidacionItems
        opened={modalValidacionAbierto}
        onClose={() => handleContinuarValidacion(false)}
        itemsFaltantes={itemsFaltantes}
        onReintentarItem={procesarItem}
        onContinuarDeTodasFormas={() => handleContinuarValidacion(true)}
        onFinalizarPresupuesto={() => handleContinuarValidacion(true)}
      />
    </Container>
  );
}
