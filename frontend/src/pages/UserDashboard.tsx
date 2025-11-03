import React, { useState, useEffect } from "react";
import {Tabs,Container,Title, Group,Text,Badge,Button, Paper,} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useAuth } from "../contexts/AuthContext";
import DatosPresupuesto from "./DatosPresupuesto";
import Insumos from "./Insumos";
import Prestaciones from "./Prestaciones";
import { api } from "../api/api";
import {
  DocumentArrowDownIcon,
  IdentificationIcon,
  BeakerIcon,
  BriefcaseIcon,
  UserCircleIcon,
  ArrowRightStartOnRectangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

// RUTA CORREGIDA: Asume que el hook está en src/hooks/
import { useAlertaCotizador } from '../hooks/useAlertaCotizador';

// Interface para la información del financiador
interface FinanciadorInfo {
  tasa_mensual?: number;
  dias_cobranza_teorico?: number;
  dias_cobranza_real?: number;
  acuerdo_nombre?: string | null;
  Financiador?: string;
  idobra_social?: string;
}

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [presupuestoId, setPresupuestoId] = useState<number | null>(null);
  const [clienteNombre, setClienteNombre] = useState("");
  const [porcentajeInsumos, setPorcentajeInsumos] = useState(0);
  const [totalInsumos, setTotalInsumos] = useState(0);
  const [totalPrestaciones, setTotalPrestaciones] = useState(0);
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<any[]>([]);
  const [prestacionesSeleccionadas, setPrestacionesSeleccionadas] = useState<any[]>([]);
  const [guardandoTotales, setGuardandoTotales] = useState(false);
  const [financiadorId, setFinanciadorId] = useState<string | null>(null);
  const [financiadorInfo, setFinanciadorInfo] = useState<FinanciadorInfo>({}); // Nuevo estado

  // Calcular totales
  const costoTotal = totalInsumos + totalPrestaciones;
  const totalFacturar = (totalInsumos + totalPrestaciones) * 1.7;
  const rentabilidad = costoTotal > 0 ? ((totalFacturar - costoTotal) / costoTotal) * 100 : 0;

  // Effect para cargar la información del financiador cuando cambia financiadorId
  useEffect(() => {
    const cargarInfoFinanciador = async () => {
      if (financiadorId) {
        try {
          const response = await api.get(`/prestaciones/prestador/${financiadorId}/info`);
          setFinanciadorInfo(response.data || {});
        } catch (error) {
          console.error('Error cargando información del financiador:', error);
          setFinanciadorInfo({});
        }
      } else {
        setFinanciadorInfo({});
      }
    };

    cargarInfoFinanciador();
  }, [financiadorId]);

  // 2. Llamar al hook con los datos del estado (incluyendo financiadorInfo)
  const AlertaComponente = useAlertaCotizador({
    presupuestoId,
    clienteNombre,
    totalInsumos,
    totalPrestaciones,
    rentabilidad,
    financiadorId,
    financiadorInfo, // ← Agregado
  });

  const guardarTotales = async () => {
    if (!presupuestoId) {
      notifications.show({
        title: "Advertencia",
        message: "Debe crear o seleccionar un presupuesto primero.",
        color: "yellow",
      });
      return;
    }

    setGuardandoTotales(true);
    try {
      await api.put(`/presupuestos/${presupuestoId}/totales`, {
        total_insumos: totalInsumos,
        total_prestaciones: totalPrestaciones,
        costo_total: costoTotal,
        total_facturar: totalFacturar,
        rentabilidad: rentabilidad,
      });
      notifications.show({
        title: "Totales Guardados",
        message: "Los totales se guardaron correctamente",
        color: "green",
      });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: "Error al guardar totales",
        color: "red",
      });
    } finally {
      setGuardandoTotales(false);
    }
  };

  useEffect(() => {
    (window as any).__syncPrestacionesHandler = (
      prestaciones: any[],
      total: number
    ) => {
      setPrestacionesSeleccionadas(prestaciones);
      setTotalPrestaciones(total);
    };
    return () => {
      try {
        delete (window as any).__syncPrestacionesHandler;
      } catch (e) {}
    };
  }, []);

  return (
    <Container size="xl" p="md">
      <Group style={{ justifyContent: "space-between", marginBottom: 20 }}>
        <Title order={2} c="blue">
          Cotizador General
        </Title>
        <Group spacing="0">
          <UserCircleIcon className="w-5 h-5 mr-0"/>
          <Text  fw={500} size="sm" tt="capitalize">
            {user?.username}
          </Text>
          <Button ml="xl" variant="outline" color="red" size="xs" onClick={logout}>
            <ArrowRightStartOnRectangleIcon className="w-5 h-5 mr-1"/>
            Salir 
          </Button>
        </Group>
      </Group>

      {/* PRIMERA TARJETA: Totales y Botón Guardar */}
      <Paper  shadow="sm" p="md" radius="md" withBorder >
        <Group style={{ justifyContent: "space-between", marginBottom: 16 }}>
          {presupuestoId && (
            <Group spacing="0">
              <DocumentTextIcon className="w-5 h-5"/>
              <Text fw={500} tt="capitalize">Paciente:  {clienteNombre}</Text>
            </Group>
          )}
          {presupuestoId && (
            <Button onClick={guardarTotales} loading={guardandoTotales} size="xs" color="green" 
            rightIcon={<DocumentArrowDownIcon className="w-5 h-5 m-0"/>}>
              Guardar
            </Button>
          )}
        </Group>
        
        <Group spacing="xl" style={{ justifyContent: "center" }}>
          <Badge variant="dot">Insumos: ${totalInsumos.toFixed(2)}</Badge>
          <Badge variant="dot">
            Prestaciones: ${totalPrestaciones.toFixed(2)}
          </Badge>
          <Badge variant="dot" color="blue">
            Costo Total: ${costoTotal.toFixed(2)}
          </Badge>
          <Badge variant="dot" color="orange">
            Total a Facturar: ${totalFacturar.toFixed(2)}
          </Badge>
          <Badge
            variant="outline"
            color={rentabilidad >= 0 ? "green" : "red"}
            size="xl"
          >
            Rentabilidad: {rentabilidad.toFixed(2)}%
          </Badge>
        </Group>

      </Paper>
      
      {/* SEGUNDA TARJETA: Contenedor para las Alertas Modulares */}
      <Paper  shadow="sm" p="md" radius="md" withBorder mt="md">
        {/* 3. Inyectamos el componente de alerta aquí */}
        {AlertaComponente}
      </Paper>

      <Tabs defaultValue="datos" color="green" mt="md">
        <Tabs.List>
          <Tabs.Tab value="datos">
            <Group spacing="xs">
              <IdentificationIcon className="w-5 h-5" />
              Datos Paciente
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="insumos" disabled={!presupuestoId}>
            <Group spacing="xs">
              <BeakerIcon className="w-5 h-5" />
              Insumos
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="prestaciones" disabled={!presupuestoId}>
            <Group spacing="xs">
              <BriefcaseIcon className="w-5 h-5" />
              Prestaciones
            </Group>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="datos" pt="md">
          <DatosPresupuesto
            onPresupuestoCreado={(
              id,
              nombre,
              sucursal,
              porcentaje,
              financiadorIdParam
            ) => {
              setPresupuestoId(id);
              setClienteNombre(nombre);
              setPorcentajeInsumos(porcentaje);
              setFinanciadorId(financiadorIdParam || null);
            }}
            onNuevoPresupuesto={() => {
              setPresupuestoId(null);
              setClienteNombre("");
              setPorcentajeInsumos(0);
              setTotalInsumos(0);
              setTotalPrestaciones(0);
              setInsumosSeleccionados([]);
              setPrestacionesSeleccionadas([]);
              setFinanciadorId(null);
              setFinanciadorInfo({}); // Limpiar también financiadorInfo
            }}
          />
        </Tabs.Panel>

        <Tabs.Panel value="insumos" pt="md">
          <Insumos
            insumosSeleccionados={insumosSeleccionados}
            setInsumosSeleccionados={setInsumosSeleccionados}
            onTotalChange={setTotalInsumos}
            presupuestoId={presupuestoId}
            porcentajeInsumos={porcentajeInsumos}
          />
        </Tabs.Panel>

        <Tabs.Panel value="prestaciones" pt="md">
          <Prestaciones
            prestacionesSeleccionadas={prestacionesSeleccionadas}
            setPrestacionesSeleccionadas={setPrestacionesSeleccionadas}
            onTotalChange={setTotalPrestaciones}
            presupuestoId={presupuestoId}
            financiadorId={financiadorId}
          />
        </Tabs.Panel>
      </Tabs>
    </Container>
  );
}