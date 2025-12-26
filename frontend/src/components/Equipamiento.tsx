import React, { useState, useEffect, useMemo } from 'react';
import { Paper, Table, Button, NumberInput, Group, Stack, Badge, Text, Grid, Title, Checkbox, ActionIcon, Tooltip } from '@mantine/core';
import { TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
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
}

interface EquipamientoDisponible {
  id: number;
  nombre: string;
  tipo: string;
  valor_asignado: number;
  valor_facturar: number;
  tiene_acuerdo: boolean;
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
  const [cantidad, setCantidad] = useState(1);
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [nuevaCantidad, setNuevaCantidad] = useState(1);
  const [nuevoCosto, setNuevoCosto] = useState(0);
  const [nuevoPrecio, setNuevoPrecio] = useState(0);

  const totalCosto = useMemo(
    () => equipamientosSeleccionados.reduce((sum, e) => sum + Number(e.cantidad) * Number(e.costo), 0),
    [equipamientosSeleccionados]
  );

  const totalFacturar = useMemo(
    () => equipamientosSeleccionados.reduce((sum, e) => sum + Number(e.cantidad) * Number(e.precio_facturar), 0),
    [equipamientosSeleccionados]
  );

  const equipamientoSeleccionadoData = useMemo(
    () => equipamientoSeleccionado ? equipamientosDisponibles.find(e => e.id === equipamientoSeleccionado) : null,
    [equipamientoSeleccionado, equipamientosDisponibles]
  );

  useEffect(() => {
    onTotalChange(totalCosto, totalFacturar);
  }, [totalCosto, totalFacturar, onTotalChange]);

  useEffect(() => {
    if (financiadorId) {
      cargarEquipamientos();
    }
  }, [financiadorId]);

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

  const handleEquipamientoChange = (id: number) => {
    setEquipamientoSeleccionado(id);
    const equipo = equipamientosDisponibles.find(e => e.id === id);
    if (equipo) {
      setCantidad(1);
      
      // Alerta si el equipamiento está desactualizado
      if ((equipo as any).dias_sin_actualizar > 45) {
        notifications.show({
          id: `equipamiento-desactualizado-${equipo.id}`,
          title: '⚠️ Valor Desactualizado',
          message: `${equipo.nombre}: sin actualizar hace ${(equipo as any).dias_sin_actualizar} días`,
          color: 'yellow',
          autoClose: false,
          withCloseButton: true,
          position: 'top-center'
        });
      }
    }
  };

  const agregarEquipamiento = () => {
    if (!equipamientoSeleccionado || cantidad <= 0) {
      notifications.show({
        title: 'Campos incompletos',
        message: 'Complete todos los campos',
        color: 'orange'
      });
      return;
    }

    const equipo = equipamientosDisponibles.find(e => e.id === equipamientoSeleccionado);
    if (!equipo) return;

    const existeIndex = equipamientosSeleccionados.findIndex(e => e.id_equipamiento === equipamientoSeleccionado);
    const equipamientosAnteriores = [...equipamientosSeleccionados];

    const nuevo: Equipamiento = {
      id: existeIndex >= 0 ? equipamientosSeleccionados[existeIndex].id : Date.now(),
      id_equipamiento: equipo.id,
      nombre: equipo.nombre,
      tipo: equipo.tipo,
      cantidad,
      costo: equipo.valor_asignado,
      precio_facturar: equipo.valor_facturar,
      tiene_acuerdo: equipo.tiene_acuerdo
    };

    if (existeIndex >= 0) {
      const nuevos = [...equipamientosSeleccionados];
      nuevos[existeIndex] = nuevo;
      setEquipamientosSeleccionados(nuevos);
    } else {
      setEquipamientosSeleccionados([...equipamientosSeleccionados, nuevo]);
    }

    if (presupuestoId) {
      api.post(`/presupuestos/${presupuestoId}/equipamientos`, {
        id_equipamiento: equipo.id,
        nombre: equipo.nombre,
        tipo: equipo.tipo,
        cantidad,
        costo: equipo.valor_asignado,
        precio_facturar: equipo.valor_facturar
      }).catch((err: any) => {
        console.error('Error saving equipamiento:', err);
        setEquipamientosSeleccionados(equipamientosAnteriores);
        notifications.show({
          title: 'Error',
          message: 'No se pudo guardar el equipamiento',
          color: 'red'
        });
        return;
      });
    }

    setCantidad(1);
    setEquipamientoSeleccionado(null);

    notifications.show({
      title: 'Equipamiento agregado',
      message: `Se agregó ${equipo.nombre}`,
      color: 'blue'
    });
  };

  const eliminarEquipamiento = (index: number) => {
    const equipamiento = equipamientosSeleccionados[index];
    const equipamientosAnteriores = [...equipamientosSeleccionados];
    const nuevos = equipamientosSeleccionados.filter((_, i) => i !== index);
    setEquipamientosSeleccionados(nuevos);

    if (presupuestoId) {
      api.delete(`/presupuestos/${presupuestoId}/equipamientos`, {
        data: { id_equipamiento: equipamiento.id_equipamiento }
      }).catch((err: any) => {
        console.error('Error deleting equipamiento:', err);
        setEquipamientosSeleccionados(equipamientosAnteriores);
        notifications.show({
          title: 'Error',
          message: 'No se pudo eliminar el equipamiento',
          color: 'red'
        });
        return;
      });
    }

    notifications.show({
      title: 'Equipamiento Eliminado',
      message: 'Se eliminó el equipamiento seleccionado',
      color: 'blue'
    });
  };

  const actualizarEquipamiento = (index: number) => {
    if (nuevaCantidad <= 0 || nuevoCosto <= 0 || nuevoPrecio <= 0) return;

    const nuevos = [...equipamientosSeleccionados];
    nuevos[index] = {
      ...nuevos[index],
      cantidad: nuevaCantidad,
      costo: nuevoCosto,
      precio_facturar: nuevoPrecio
    };
    setEquipamientosSeleccionados(nuevos);

    if (presupuestoId) {
      api.post(`/presupuestos/${presupuestoId}/equipamientos`, {
        id_equipamiento: nuevos[index].id_equipamiento,
        nombre: nuevos[index].nombre,
        tipo: nuevos[index].tipo,
        cantidad: nuevaCantidad,
        costo: nuevoCosto,
        precio_facturar: nuevoPrecio
      }).catch((err: any) => console.error('Error updating equipamiento:', err));
    }

    setEditandoIndex(null);

    notifications.show({
      title: 'Equipamiento Actualizado',
      message: 'Valores modificados correctamente',
      color: 'green'
    });
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
      <Paper p="md" withBorder>
        <Text size="sm" c="dimmed" ta="center">
          Debe seleccionar un financiador antes de agregar equipamiento
        </Text>
      </Paper>
    );
  }

  return (
    <Stack gap="lg" mb={25}>
      {soloLectura && (
        <Paper p="xs" withBorder style={{ backgroundColor: '#e7f5ff' }}>
          <Text size="sm" c="blue" fw={500} ta="center">
            Modo solo lectura - No se pueden realizar modificaciones
          </Text>
        </Paper>
      )}

      <Paper p="md" withBorder style={{ opacity: soloLectura ? 0.8 : 1 }}>
        <Stack gap="xl">
          {equipamientosDisponibles.length > 0 && (
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Title order={5}>Equipamientos Disponibles</Title>
                  <Table.ScrollContainer minWidth={700} h={400}>
                    <Table striped="odd" highlightOnHover stickyHeader>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Equipamiento</Table.Th>
                          <Table.Th style={{ width: '100px', fontWeight: 500, fontSize: '13px' }}>Tipo</Table.Th>
                          <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Costo</Table.Th>
                          <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Precio</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {equipamientosDisponibles.map((eq) => (
                          <Table.Tr key={eq.id}>
                            <Table.Td>
                              <Group gap="xs">
                                <Checkbox
                                  size="sm"
                                  checked={equipamientoSeleccionado === eq.id}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      handleEquipamientoChange(eq.id);
                                    } else {
                                      setEquipamientoSeleccionado(null);
                                      setCantidad(1);
                                    }
                                  }}
                                  disabled={soloLectura}
                                />
                                <span>{eq.nombre}</span>
                              </Group>
                            </Table.Td>
                            <Table.Td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{eq.tipo}</Table.Td>
                            <Table.Td>{formatPeso(eq.valor_asignado)}</Table.Td>
                            <Table.Td>{formatPeso(eq.valor_facturar)}</Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Stack>
              </Grid.Col>

              <Grid.Col span={6}>
                <Stack gap="xs" style={{ backgroundColor: equipamientoSeleccionado ? '#f8f9fa' : '#f5f5f5', opacity: (equipamientoSeleccionado && !soloLectura) ? 1 : 0.6, padding: '1rem', borderRadius: '8px' }}>
                  <Title order={5}>Agregar al Presupuesto</Title>
                  <Text size="sm" fw={400}>Equipamiento</Text>
                  <Text size="sm" c="dimmed">
                    {equipamientoSeleccionadoData?.nombre || 'Seleccione un equipamiento de la tabla'}
                  </Text>
                  <NumberInput
                    label={<Text size="sm" fw={400}>Cantidad</Text>}
                    value={cantidad}
                    onChange={(val) => setCantidad(Number(val) || 1)}
                    min={1}
                    size="sm"
                    disabled={!equipamientoSeleccionado || soloLectura}
                  />
                  <Group>
                    <Button size="sm" onClick={agregarEquipamiento} disabled={!equipamientoSeleccionado || soloLectura}>
                      Agregar
                    </Button>
                    <Button size="sm" variant="outline" color="gray" disabled={!equipamientoSeleccionado || soloLectura} onClick={() => {
                      setEquipamientoSeleccionado(null);
                      setCantidad(1);
                    }}>
                      Cancelar
                    </Button>
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>
          )}

          <Stack gap="xs">
            <Title order={5}>Equipamientos Seleccionados</Title>
            <Table.ScrollContainer minWidth={1000}>
              <Table striped="odd" highlightOnHover stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ textAlign: 'left', fontWeight: 500, fontSize: '13px' }}>Equipamiento</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Tipo</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Cantidad</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>
                      <Tooltip label="Valores mensuales">
                        <span style={{ cursor: 'help' }}>Costo</span>
                      </Tooltip>
                    </Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>
                      <Tooltip label="Valores mensuales">
                        <span style={{ cursor: 'help' }}>Precio a Facturar</span>
                      </Tooltip>
                    </Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Subtotal Costo</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Subtotal Facturar</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {equipamientosSeleccionados.map((eq, i) => {
                    const subtotalCosto = eq.cantidad * eq.costo;
                    const subtotalFacturar = eq.cantidad * eq.precio_facturar;

                    return (
                      <Table.Tr key={`${eq.id_equipamiento}-${i}`}>
                        <Table.Td>{eq.nombre}</Table.Td>
                        <Table.Td style={{ textTransform: 'capitalize' }}>{eq.tipo}</Table.Td>
                        <Table.Td>
                          {editandoIndex === i ? (
                            <NumberInput
                              value={nuevaCantidad}
                              onChange={(value) => setNuevaCantidad(Number(value) || 1)}
                              min={1}
                              w={80}
                              size="xs"
                              hideControls
                            />
                          ) : (
                            eq.cantidad
                          )}
                        </Table.Td>
                        <Table.Td>
                          {editandoIndex === i ? (
                            <NumberInput
                              value={nuevoCosto}
                              onChange={(value) => setNuevoCosto(Number(value) || 0)}
                              min={0}
                              step={0.01}
                              decimalScale={2}
                              w={100}
                              size="xs"
                              hideControls
                              prefix="$"
                            />
                          ) : (
                            formatPeso(eq.costo)
                          )}
                        </Table.Td>
                        <Table.Td>
                          {editandoIndex === i ? (
                            <NumberInput
                              value={nuevoPrecio}
                              onChange={(value) => setNuevoPrecio(Number(value) || 0)}
                              min={0}
                              step={0.01}
                              decimalScale={2}
                              w={100}
                              size="xs"
                              hideControls
                              prefix="$"
                            />
                          ) : (
                            formatPeso(eq.precio_facturar)
                          )}
                        </Table.Td>
                        <Table.Td>{formatPeso(subtotalCosto)}</Table.Td>
                        <Table.Td>{formatPeso(subtotalFacturar)}</Table.Td>
                        <Table.Td>
                          {!soloLectura && (
                            editandoIndex === i ? (
                              <Group gap="xs" justify="left">
                                <Button size="xs" onClick={() => actualizarEquipamiento(i)}>
                                  OK
                                </Button>
                                <Button size="xs" variant="outline" onClick={() => setEditandoIndex(null)}>
                                  Cancelar
                                </Button>
                              </Group>
                            ) : (
                              <Group gap="xs" justify="left">
                                <ActionIcon
                                  variant="transparent"
                                  onClick={() => {
                                    setEditandoIndex(i);
                                    setNuevaCantidad(eq.cantidad);
                                    setNuevoCosto(eq.costo);
                                    setNuevoPrecio(eq.precio_facturar);
                                  }}
                                >
                                  <PencilSquareIcon width={20} height={20} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="transparent"
                                  color="red"
                                  onClick={() => eliminarEquipamiento(i)}
                                >
                                  <TrashIcon width={20} height={20} />
                                </ActionIcon>
                              </Group>
                            )
                          )}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {equipamientosSeleccionados.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No hay equipamientos seleccionados
              </div>
            )}
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
