import React, { useState, useEffect } from 'react';
import { Paper, Table, Button, NumberInput, Group, Stack, Badge, Text, Alert } from '@mantine/core';
import { ExclamationTriangleIcon, TrashIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../api/api';

interface Equipamiento {
  id: number;
  id_equipamiento: number;
  nombre: string;
  tipo: string;
  cantidad: number;
  costo: number;
  precio_facturar: number;
  tiene_acuerdo: boolean;
  genera_alerta?: boolean;
  umbral_alerta?: number;
  mensaje_alerta?: string;
  color_alerta?: string;
}

interface EquipamientoDisponible {
  id: number;
  nombre: string;
  tipo: string;
  valor_asignado: number;
  valor_facturar: number;
  tiene_acuerdo: boolean;
  genera_alerta: boolean;
  umbral_alerta: number | null;
  mensaje_alerta: string | null;
  color_alerta: string;
}

interface Alerta {
  mensaje: string;
  color: string;
  equipamiento: string;
  cantidad: number;
}

interface Props {
  equipamientosSeleccionados: Equipamiento[];
  setEquipamientosSeleccionados: (equipos: Equipamiento[]) => void;
  onTotalChange: (totalCosto: number, totalFacturar: number) => void;
  presupuestoId: number | null;
  financiadorId?: string | null;
  soloLectura?: boolean;
}

export default function Equipamiento({
  equipamientosSeleccionados,
  setEquipamientosSeleccionados,
  onTotalChange,
  presupuestoId,
  financiadorId,
  soloLectura = false
}: Props) {
  const [equipamientosDisponibles, setEquipamientosDisponibles] = useState<EquipamientoDisponible[]>([]);
  const [equipamientoSeleccionado, setEquipamientoSeleccionado] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [alertasActivas, setAlertasActivas] = useState<Alerta[]>([]);

  useEffect(() => {
    if (financiadorId) {
      cargarEquipamientos();
    }
  }, [financiadorId]);

  useEffect(() => {
    calcularTotales();
    verificarAlertas();
  }, [equipamientosSeleccionados]);

  const cargarEquipamientos = async () => {
    try {
      const response = await api.get(`/equipamientos/financiador/${financiadorId}`);
      setEquipamientosDisponibles(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar equipamientos',
        color: 'red'
      });
    }
  };

  const agregarEquipamiento = () => {
    if (!equipamientoSeleccionado || cantidad <= 0) {
      notifications.show({
        title: 'Error',
        message: 'Seleccione un equipamiento y cantidad válida',
        color: 'red'
      });
      return;
    }

    const equipo = equipamientosDisponibles.find(e => e.id === equipamientoSeleccionado);
    if (!equipo) return;

    const nuevo: Equipamiento = {
      id: Date.now(),
      id_equipamiento: equipo.id,
      nombre: equipo.nombre,
      tipo: equipo.tipo,
      cantidad,
      costo: equipo.valor_asignado,
      precio_facturar: equipo.valor_facturar,
      tiene_acuerdo: equipo.tiene_acuerdo,
      genera_alerta: equipo.genera_alerta,
      umbral_alerta: equipo.umbral_alerta || undefined,
      mensaje_alerta: equipo.mensaje_alerta || undefined,
      color_alerta: equipo.color_alerta
    };

    setEquipamientosSeleccionados([...equipamientosSeleccionados, nuevo]);
    setEquipamientoSeleccionado(null);
    setCantidad(1);
  };

  const eliminarEquipamiento = (id: number) => {
    setEquipamientosSeleccionados(equipamientosSeleccionados.filter(e => e.id !== id));
  };

  const actualizarCantidad = (id: number, nuevaCantidad: number | string) => {
    const cantidad = Number(nuevaCantidad) || 0;
    setEquipamientosSeleccionados(
      equipamientosSeleccionados.map(e => e.id === id ? { ...e, cantidad } : e)
    );
  };

  const actualizarCosto = (id: number, nuevoCosto: number | string) => {
    const costo = Number(nuevoCosto) || 0;
    setEquipamientosSeleccionados(
      equipamientosSeleccionados.map(e => e.id === id ? { ...e, costo } : e)
    );
  };

  const actualizarPrecio = (id: number, nuevoPrecio: number | string) => {
    const precio = Number(nuevoPrecio) || 0;
    setEquipamientosSeleccionados(
      equipamientosSeleccionados.map(e => e.id === id ? { ...e, precio_facturar: precio } : e)
    );
  };

  const calcularTotales = () => {
    const totalCosto = equipamientosSeleccionados.reduce(
      (sum, e) => sum + (e.cantidad * e.costo), 0
    );
    const totalFacturar = equipamientosSeleccionados.reduce(
      (sum, e) => sum + (e.cantidad * e.precio_facturar), 0
    );
    onTotalChange(totalCosto, totalFacturar);
  };

  const verificarAlertas = () => {
    const alertas: Alerta[] = [];
    
    equipamientosSeleccionados.forEach(equipo => {
      if (equipo.genera_alerta && equipo.umbral_alerta) {
        if (equipo.cantidad >= equipo.umbral_alerta) {
          alertas.push({
            mensaje: equipo.mensaje_alerta || 'Alerta de equipamiento',
            color: equipo.color_alerta || 'orange',
            equipamiento: equipo.nombre,
            cantidad: equipo.cantidad
          });
        }
      }
    });
    
    setAlertasActivas(alertas);
  };

  const formatPeso = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  if (!financiadorId) {
    return (
      <Alert color="blue" title="Seleccione un financiador">
        Debe seleccionar un financiador antes de agregar equipamiento
      </Alert>
    );
  }

  return (
    <Stack gap="md">
      {/* Alertas Activas */}
      {alertasActivas.length > 0 && (
        <Paper p="md" withBorder style={{ backgroundColor: '#fff3cd' }}>
          <Group gap="xs" mb="xs">
            <ExclamationTriangleIcon style={{ width: 20, height: 20 }} />
            <Text fw={600} c="orange">ALERTAS ACTIVAS</Text>
          </Group>
          <Stack gap="xs">
            {alertasActivas.map((alerta, idx) => (
              <Badge key={idx} color={alerta.color} size="lg">
                {alerta.equipamiento}: {alerta.mensaje} ({alerta.cantidad} unidades)
              </Badge>
            ))}
          </Stack>
        </Paper>
      )}

      {/* Formulario Agregar */}
      {!soloLectura && (
        <Paper p="md" withBorder>
          <Text size="sm" fw={500} mb="sm">Agregar Equipamiento</Text>
          <Group align="flex-end">
            <select
              value={equipamientoSeleccionado || ''}
              onChange={(e) => setEquipamientoSeleccionado(Number(e.target.value) || null)}
              style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
            >
              <option value="">Seleccione un equipamiento...</option>
              {equipamientosDisponibles.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.nombre} - {formatPeso(eq.valor_facturar)} 
                  {eq.tiene_acuerdo ? ' (Con acuerdo)' : ' (Sin acuerdo)'}
                </option>
              ))}
            </select>
            <NumberInput
              label="Cantidad"
              value={cantidad}
              onChange={(val) => setCantidad(Number(val) || 1)}
              min={1}
              style={{ width: 100 }}
            />
            <Button onClick={agregarEquipamiento}>Agregar</Button>
          </Group>
        </Paper>
      )}

      {/* Tabla de Equipamientos Seleccionados */}
      {equipamientosSeleccionados.length > 0 && (
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
              <Table.Tr>
                <Table.Th>Equipo</Table.Th>
                <Table.Th>Tipo</Table.Th>
                <Table.Th style={{ width: 100 }}>Cantidad</Table.Th>
                <Table.Th style={{ width: 140 }}>Costo Unit.</Table.Th>
                <Table.Th style={{ width: 140 }}>Precio Facturar</Table.Th>
                <Table.Th style={{ width: 120 }}>Subtotal Costo</Table.Th>
                <Table.Th style={{ width: 140 }}>Subtotal Facturar</Table.Th>
                {!soloLectura && <Table.Th style={{ width: 80 }}>Acciones</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {equipamientosSeleccionados.map((eq) => (
                <Table.Tr key={eq.id}>
                  <Table.Td>
                    <div>
                      <Text size="sm">{eq.nombre}</Text>
                      {eq.tiene_acuerdo && (
                        <Badge size="xs" color="green">Con acuerdo</Badge>
                      )}
                    </div>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" tt="capitalize">{eq.tipo}</Text>
                  </Table.Td>
                  <Table.Td>
                    {soloLectura ? (
                      <Text size="sm">{eq.cantidad}</Text>
                    ) : (
                      <NumberInput
                        value={eq.cantidad}
                        onChange={(val) => actualizarCantidad(eq.id, val)}
                        min={1}
                        size="xs"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    {soloLectura ? (
                      <Text size="sm">{formatPeso(eq.costo)}</Text>
                    ) : (
                      <NumberInput
                        value={eq.costo}
                        onChange={(val) => actualizarCosto(eq.id, val)}
                        decimalScale={2}
                        fixedDecimalScale
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="$ "
                        size="xs"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    {soloLectura ? (
                      <Text size="sm">{formatPeso(eq.precio_facturar)}</Text>
                    ) : (
                      <NumberInput
                        value={eq.precio_facturar}
                        onChange={(val) => actualizarPrecio(eq.id, val)}
                        decimalScale={2}
                        fixedDecimalScale
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="$ "
                        size="xs"
                      />
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>{formatPeso(eq.cantidad * eq.costo)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>{formatPeso(eq.cantidad * eq.precio_facturar)}</Text>
                  </Table.Td>
                  {!soloLectura && (
                    <Table.Td>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => eliminarEquipamiento(eq.id)}
                      >
                        <TrashIcon style={{ width: 16, height: 16 }} />
                      </Button>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Paper>
      )}

      {equipamientosSeleccionados.length === 0 && (
        <Paper p="xl" withBorder>
          <Text size="sm" c="dimmed" ta="center">
            No hay equipamiento agregado
          </Text>
        </Paper>
      )}
    </Stack>
  );
}
