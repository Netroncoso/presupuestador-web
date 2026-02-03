// ============================================================================
// COMPONENT: PrestacionesTarifario
// ============================================================================

import { useState, useEffect } from 'react';
import { Select, NumberInput, Button, Table, Badge, Group, Stack, Text, Alert, Grid, Paper, Title, Checkbox, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { useTarifario } from '../hooks/useTarifario';
import api from '../api/api';

interface Props {
  presupuestoId: number;
  zonaId: number | null;
  soloLectura?: boolean;
  onTotalChange?: (totalCosto: number, totalFacturar: number) => void;
}

interface PrestacionTarifario {
  id: number;
  tarifario_servicio_id: number;
  prestacion: string;
  cantidad: number;
  zona_id: number;
  orden_costo: number;
  valor_asignado: number;
  valor_facturar: number;
  fuera_tarifario: number;
  servicio_nombre: string;
  zona_nombre: string;
}

export default function PrestacionesTarifario({ presupuestoId, zonaId, soloLectura = false, onTotalChange }: Props) {
  const { servicios, loading: loadingServicios, markup, calcularValorFacturar } = useTarifario(zonaId);
  const [prestaciones, setPrestaciones] = useState<PrestacionTarifario[]>([]);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState<number>(1);
  const [costoSeleccionado, setCostoSeleccionado] = useState<string | null>(null);
  const [valoresDisponibles, setValoresDisponibles] = useState<any[]>([]);
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [nuevaCantidad, setNuevaCantidad] = useState(1);
  const [nuevoValor, setNuevoValor] = useState(0);
  const [alertasConfig, setAlertasConfig] = useState<any[]>([]);
  const [costoManual, setCostoManual] = useState<string>('');

  useEffect(() => {
    cargarPrestaciones();
    cargarAlertasConfig();
  }, [presupuestoId]);

  const cargarAlertasConfig = async () => {
    try {
      const response = await api.get('/alertas-servicios');
      setAlertasConfig(response.data);
    } catch (error) {
      console.error('Error cargando alertas:', error);
    }
  };

  useEffect(() => {
    if (servicioSeleccionado) {
      const servicio = servicios.find(s => s.id.toString() === servicioSeleccionado);
      if (servicio?.valores) {
        setValoresDisponibles(servicio.valores);
        
        const diasDesactualizacion = servicio.valores[0]?.dias_desactualizacion || 0;
        if (diasDesactualizacion > 45) {
          notifications.show({
            title: 'Valores Desactualizados',
            message: `${servicio.nombre}: ${diasDesactualizacion} días sin actualizar`,
            color: 'orange',
            autoClose: false,
            position: 'top-center'
          });
        }
      } else {
        setValoresDisponibles([]);
      }
    } else {
      setValoresDisponibles([]);
      setCostoSeleccionado(null);
    }
  }, [servicioSeleccionado, servicios]);

  const cargarPrestaciones = async () => {
    try {
      const response = await api.get(`/presupuestos/${presupuestoId}/prestaciones-tarifario`);
      setPrestaciones(response.data);
      
      // Calcular totales
      if (onTotalChange) {
        const totalCosto = response.data.reduce((sum: number, p: PrestacionTarifario) => sum + (p.valor_asignado * p.cantidad), 0);
        const totalFacturar = response.data.reduce((sum: number, p: PrestacionTarifario) => sum + (p.valor_facturar * p.cantidad), 0);
        onTotalChange(totalCosto, totalFacturar);
      }
    } catch (error) {
      console.error('Error al cargar prestaciones:', error);
    }
  };

  const handleAgregar = async () => {
    if (!servicioSeleccionado || !cantidad || (!costoSeleccionado && !costoManual) || !zonaId) {
      notifications.show({
        title: 'Error',
        message: 'Complete todos los campos',
        color: 'red'
      });
      return;
    }

    const orden = costoManual ? 0 : parseInt(costoSeleccionado!);
    const servicio = servicios.find(s => s.id.toString() === servicioSeleccionado);

    // Verificar alerta por cantidad
    if (servicio?.tipo_unidad) {
      const alertaConfig = alertasConfig.find(a => a.tipo_unidad === servicio.tipo_unidad && a.activo === 1);
      if (alertaConfig && cantidad >= alertaConfig.cantidad_maxima) {
        notifications.show({
          id: `alerta-tarifario-${servicio.tipo_unidad}`,
          title: `⚠️ ${alertaConfig.mensaje_alerta || 'Cantidad excedida'}`,
          message: `${servicio.nombre} (máx. recomendado: ${alertaConfig.cantidad_maxima} ${servicio.tipo_unidad})`,
          color: alertaConfig.color_alerta || 'orange',
          autoClose: false,
          withCloseButton: true,
          position: 'top-center'
        });
      }
    }

    // Alerta persistente si selecciona orden 5
    if (orden === 5) {
      notifications.show({
        title: 'Requiere Autorización',
        message: 'Este servicio requiere autorización de Gerencia Prestacional',
        color: 'orange',
        autoClose: false,
        position: 'top-center'
      });
    }

    try {
      const payload: any = {
        tarifario_servicio_id: parseInt(servicioSeleccionado),
        cantidad,
        zona_id: zonaId
      };

      if (costoManual) {
        // Costo manual - fuera de tarifario
        payload.valor_asignado = parseFloat(costoManual);
        payload.fuera_tarifario = true;
      } else {
        // Costo del tarifario
        payload.orden_costo = orden;
      }

      await api.post(`/presupuestos/${presupuestoId}/prestaciones-tarifario`, payload);

      notifications.show({
        title: 'Éxito',
        message: 'Prestación agregada',
        color: 'green'
      });

      // Limpiar formulario
      setServicioSeleccionado(null);
      setCantidad(1);
      setCostoSeleccionado(null);
      setCostoManual('');
      setValoresDisponibles([]);

      // Recargar lista
      cargarPrestaciones();
    } catch (error) {
      console.error('Error al agregar prestación:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al agregar prestación',
        color: 'red'
      });
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await api.delete(`/presupuestos/${presupuestoId}/prestaciones-tarifario/${id}`);
      notifications.show({
        title: 'Éxito',
        message: 'Prestación eliminada',
        color: 'green'
      });
      cargarPrestaciones();
    } catch (error) {
      console.error('Error al eliminar prestación:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar prestación',
        color: 'red'
      });
    }
  };

  const actualizarPrestacion = async (index: number) => {
    if (nuevaCantidad <= 0 || nuevoValor <= 0) return;
    
    const prestacion = prestaciones[index];
    const servicio = servicios.find(s => s.id === prestacion.tarifario_servicio_id);

    // Verificar alerta por cantidad
    if (servicio?.tipo_unidad) {
      const alertaConfig = alertasConfig.find(a => a.tipo_unidad === servicio.tipo_unidad && a.activo === 1);
      if (alertaConfig && nuevaCantidad >= alertaConfig.cantidad_maxima) {
        notifications.show({
          id: `alerta-tarifario-${servicio.tipo_unidad}`,
          title: `⚠️ ${alertaConfig.mensaje_alerta || 'Cantidad excedida'}`,
          message: `${prestacion.prestacion} (máx. recomendado: ${alertaConfig.cantidad_maxima} ${servicio.tipo_unidad})`,
          color: alertaConfig.color_alerta || 'orange',
          autoClose: false,
          withCloseButton: true,
          position: 'top-center'
        });
      }
    }
    
    try {
      await api.put(`/presupuestos/${presupuestoId}/prestaciones-tarifario/${prestacion.id}`, {
        cantidad: nuevaCantidad,
        valor_asignado: nuevoValor
      });
      
      notifications.show({
        title: 'Éxito',
        message: 'Prestación actualizada',
        color: 'green'
      });
      
      setEditandoIndex(null);
      cargarPrestaciones();
    } catch (error) {
      console.error('Error al actualizar prestación:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar prestación',
        color: 'red'
      });
    }
  };

  if (!zonaId && !soloLectura) {
    return (
      <Alert icon={<IconAlertTriangle />} color="yellow">
        Seleccione una zona en "Datos del Presupuesto" para agregar servicios del tarifario
      </Alert>
    );
  }

  return (
    <Paper p="md" withBorder style={{ opacity: soloLectura ? 0.8 : 1 }}>
      <Stack gap="xl">
        {servicios.length > 0 && (
          <>
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Title order={5}>Servicios Disponibles</Title>
                  <Table.ScrollContainer minWidth={700} h={400}>
                    <Table striped="odd" highlightOnHover stickyHeader>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Servicio</Table.Th>
                          <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Tipo</Table.Th>
                          <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Costos Disponibles</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {servicios.map((s) => {
                          const esSeleccionado = servicioSeleccionado === s.id.toString();
                          const valoresServicio = esSeleccionado ? valoresDisponibles : [];
                          
                          return (
                            <Table.Tr key={s.id}>
                              <Table.Td>
                                <Group gap="xs">
                                  <Checkbox
                                    size="sm"
                                    checked={esSeleccionado}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setServicioSeleccionado(s.id.toString());
                                      } else {
                                        setServicioSeleccionado(null);
                                        setCostoSeleccionado(null);
                                        setValoresDisponibles([]);
                                      }
                                    }}
                                    disabled={soloLectura}
                                  />
                                  <span>{s.nombre.charAt(0).toUpperCase() + s.nombre.slice(1).toLowerCase()}</span>
                                </Group>
                              </Table.Td>
                              <Table.Td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{s.tipo_unidad || '-'}</Table.Td>
                              <Table.Td>
                                {s.valores && s.valores.length > 0 ? (
                                  <Text size="xs" c="dimmed">
                                    ${s.valores[0].costo.toLocaleString('es-AR')} - ${s.valores[4].costo.toLocaleString('es-AR')}
                                  </Text>
                                ) : (
                                  <Text size="xs" c="dimmed">-</Text>
                                )}
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Stack>
              </Grid.Col>

              <Grid.Col span={6}>
                <Stack gap="xs" style={{ backgroundColor: servicioSeleccionado ? '#f8f9fa' : '#f5f5f5', opacity: (servicioSeleccionado && !soloLectura) ? 1 : 0.6, padding: '1rem', borderRadius: '8px' }}>
                  <Title order={5}>Agregar al Presupuesto</Title>
                  
                  <Text size="sm" fw={400}>Servicio</Text>
                  <Text size="sm" c="dimmed">{servicios.find(s => s.id.toString() === servicioSeleccionado)?.nombre.charAt(0).toUpperCase() + servicios.find(s => s.id.toString() === servicioSeleccionado)?.nombre.slice(1).toLowerCase() || 'Seleccione un servicio de la tabla'}</Text>

                  <NumberInput
                    label={<Text size="sm" fw={400}>Cantidad</Text>}
                    value={cantidad}
                    onChange={(val) => setCantidad(Number(val))}
                    min={1}
                    size="sm"
                    disabled={!servicioSeleccionado || soloLectura}
                  />

                  <Select
                    label={<Text size="sm" fw={400}>Costo</Text>}
                    placeholder={valoresDisponibles.length > 0 ? "Seleccione un costo" : "Cargando costos..."}
                    data={valoresDisponibles.map(v => ({
                      value: v.orden.toString(),
                      label: `$${v.costo.toLocaleString('es-AR', { minimumFractionDigits: 2 })} ${v.orden === 5 ? '⚠️ (Más Alto)' : ''}`
                    }))}
                    value={costoSeleccionado}
                    onChange={(val) => {
                      setCostoSeleccionado(val);
                      setCostoManual(''); // Limpiar costo manual al seleccionar del tarifario
                    }}
                    disabled={!servicioSeleccionado || soloLectura || valoresDisponibles.length === 0 || costoManual !== ''}
                    searchable
                  />

                  <Text size="xs" c="dimmed" ta="center">- O -</Text>

                  <NumberInput
                    label={<Text size="sm" fw={400}>Costo Manual (Fuera de Tarifario)</Text>}
                    placeholder="Ingrese costo personalizado"
                    value={costoManual}
                    onChange={(val) => {
                      setCostoManual(val?.toString() || '');
                      if (val) setCostoSeleccionado(null); // Limpiar selección del tarifario
                    }}
                    min={0}
                    prefix="$"
                    size="sm"
                    disabled={!servicioSeleccionado || soloLectura || costoSeleccionado !== null}
                    hideControls
                  />

                  {(costoSeleccionado || costoManual) && valoresDisponibles.length > 0 && (
                    <Text size="sm" c="dimmed">
                      Valor a facturar (con {markup}% markup): ${
                        costoManual 
                          ? calcularValorFacturar(parseFloat(costoManual)).toLocaleString('es-AR', { minimumFractionDigits: 2 })
                          : calcularValorFacturar(valoresDisponibles[parseInt(costoSeleccionado!) - 1].costo).toLocaleString('es-AR', { minimumFractionDigits: 2 })
                      }
                      {costoManual && <Text size="xs" c="orange" span> (Fuera de Tarifario)</Text>}
                    </Text>
                  )}

                  <Group>
                    <Button size="sm" onClick={handleAgregar} disabled={!servicioSeleccionado || (!costoSeleccionado && !costoManual) || soloLectura}>Agregar</Button>
                    <Button size="sm" variant="outline" color="gray" disabled={!servicioSeleccionado || soloLectura} onClick={() => {
                      setServicioSeleccionado(null);
                      setCantidad(1);
                      setCostoSeleccionado(null);
                      setCostoManual('');
                      setValoresDisponibles([]);
                    }}>Cancelar</Button>
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>

            <Stack gap="xs">
              <Title order={5}>Prestaciones Seleccionadas</Title>
              <Table.ScrollContainer minWidth={1000}>
                <Table striped="odd" highlightOnHover stickyHeader>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ textAlign: 'left', fontWeight: 500, fontSize: '12px' }}>Servicio</Table.Th>
                      <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Cantidad</Table.Th>
                      <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Costo Unit.</Table.Th>
                      <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Valor Unit.</Table.Th>
                      <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Subtotal Costo</Table.Th>
                      <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Subtotal Facturar</Table.Th>
                      <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Estado</Table.Th>
                      {!soloLectura && <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Acciones</Table.Th>}
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {prestaciones.map((p, i) => (
                      <Table.Tr key={p.id}>
                        <Table.Td>{p.prestacion}</Table.Td>
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
                            p.cantidad
                          )}
                        </Table.Td>
                        <Table.Td>
                          {editandoIndex === i ? (
                            <NumberInput
                              value={nuevoValor}
                              onChange={(value) => setNuevoValor(Number(value) || 0)}
                              min={0}
                              w={100}
                              size="xs"
                              hideControls
                              prefix="$"
                            />
                          ) : (
                            `$${p.valor_asignado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
                          )}
                        </Table.Td>
                        <Table.Td>${p.valor_facturar.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Table.Td>
                        <Table.Td>${(p.valor_asignado * p.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Table.Td>
                        <Table.Td>${(p.valor_facturar * p.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</Table.Td>
                        <Table.Td>
                          {p.orden_costo === 5 && <Text size="xs" c="orange">Valor Más Alto</Text>}
                          {p.fuera_tarifario === 1 && <Text size="xs" c="blue">Fuera de Tarifario</Text>}
                        </Table.Td>
                        {!soloLectura && (
                          <Table.Td>
                            {editandoIndex === i ? (
                              <Group gap={4} justify="left" wrap="nowrap">
                                <Button size="xs" onClick={() => actualizarPrestacion(i)}>
                                  OK
                                </Button>
                                <Button size="xs" variant="outline" onClick={() => setEditandoIndex(null)}>
                                  Cancelar
                                </Button>
                              </Group>
                            ) : (
                              <Group gap={4} justify="left" wrap="nowrap">
                                <ActionIcon
                                  variant="transparent"
                                  onClick={() => {
                                    setEditandoIndex(i);
                                    setNuevaCantidad(p.cantidad);
                                    setNuevoValor(Number(p.valor_asignado));
                                  }}
                                >
                                  <PencilSquareIcon width={16} height={16} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="transparent"
                                  color="red"
                                  onClick={() => handleEliminar(p.id)}
                                >
                                  <IconTrash width={16} height={16} />
                                </ActionIcon>
                              </Group>
                            )}
                          </Table.Td>
                        )}
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
              {prestaciones.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No hay prestaciones seleccionadas
                </div>
              )}
            </Stack>
          </>
        )}

        {servicios.length === 0 && !loadingServicios && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No hay servicios disponibles en el tarifario
          </div>
        )}
      </Stack>
    </Paper>
  );
}
