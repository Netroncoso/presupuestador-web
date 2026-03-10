import { useState, useMemo, useCallback } from 'react';
import { Select, Button, Table, Group, Stack, Text, Paper, NumberInput, Checkbox, Flex, TextInput, Title, ActionIcon } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconTrash } from '@tabler/icons-react';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { numberFormat } from '../utils/numberFormat';
import type { ServicioFinanciador, ServicioTarifario, ServicioConvenio } from '../types';

interface Props {
  serviciosFinanciador: ServicioFinanciador[];
  serviciosTarifario: ServicioTarifario[];
  serviciosSeleccionados: ServicioConvenio[];
  onServiciosChange: (servicios: ServicioConvenio[]) => void;
  onAgregarServicio?: (servicio: ServicioConvenio) => Promise<void>;
  onEliminarServicio?: (claveUnica: string) => Promise<void>;
  soloLectura?: boolean;
  loading?: boolean;
  error?: string | null;
  financiadorInfo?: { porcentaje_horas_nocturnas?: number };
}

export default function SelectorDualServicios({
  serviciosFinanciador,
  serviciosTarifario,
  serviciosSeleccionados,
  onServiciosChange,
  onAgregarServicio,
  onEliminarServicio,
  soloLectura = false,
  loading = false,
  error = null,
  financiadorInfo
}: Props) {
  const [servicioSeleccionado, setServicioSeleccionado] = useState<number | null>(null);
  const [servicioTarifarioId, setServicioTarifarioId] = useState<number | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [valorSeleccionado, setValorSeleccionado] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [busquedaServicio, setBusquedaServicio] = useState('');
  const [editandoClaveUnica, setEditandoClaveUnica] = useState<string | null>(null);
  const [nuevaCantidad, setNuevaCantidad] = useState(1);
  const [aplicarHorasNocturnas, setAplicarHorasNocturnas] = useState(false);

  const servicioFinanciadorData = useMemo(() => 
    servicioSeleccionado ? serviciosFinanciador.find(s => s.id_financiador_servicio === servicioSeleccionado) : null,
    [servicioSeleccionado, serviciosFinanciador]
  );

  const servicioTarifarioData = useMemo(() => 
    servicioTarifarioId ? serviciosTarifario.find(s => s.id === servicioTarifarioId) : null,
    [servicioTarifarioId, serviciosTarifario]
  );

  const precioCosto = useMemo(() => {
    if (!servicioTarifarioData?.valores) return 0;
    return servicioTarifarioData.valores[valorSeleccionado - 1] || 0;
  }, [servicioTarifarioData, valorSeleccionado]);

  const precioTotal = useMemo(() => {
    if (!servicioFinanciadorData) return 0;
    let precio = servicioFinanciadorData.precio_facturar;
    if (aplicarHorasNocturnas && financiadorInfo?.porcentaje_horas_nocturnas) {
      precio *= (1 + financiadorInfo.porcentaje_horas_nocturnas / 100);
    }
    return precio * cantidad;
  }, [servicioFinanciadorData, cantidad, aplicarHorasNocturnas, financiadorInfo]);

  const costoTotal = useMemo(() => {
    if (!servicioFinanciadorData) return 0;
    const unidadesBase = servicioFinanciadorData.unidades_base || 1;
    return precioCosto * unidadesBase * cantidad;
  }, [precioCosto, cantidad, servicioFinanciadorData]);
  const utilidadTotal = useMemo(() => precioTotal - costoTotal, [precioTotal, costoTotal]);

  const valoresDisponibles = useMemo(() => {
    if (!servicioTarifarioData?.valores) return [];
    return servicioTarifarioData.valores.map((valor, index) => ({
      value: (index + 1).toString(),
      label: `Valor ${index + 1}: ${numberFormat.formatCurrency(valor)}`
    }));
  }, [servicioTarifarioData]);

  const serviciosTarifarioDisponibles = useMemo(() => 
    serviciosTarifario.map(s => ({
      value: s.id.toString(),
      label: `${s.nombre}${s.tipo_unidad ? ` (${s.tipo_unidad})` : ''}`
    })),
    [serviciosTarifario]
  );

  const handleAgregar = useCallback(async () => {
    if (!servicioFinanciadorData || !servicioTarifarioData) {
      notifications.show({
        title: 'Error',
        message: 'Complete todos los campos',
        color: 'red'
      });
      return;
    }

    const claveUnica = `${servicioFinanciadorData.id_financiador_servicio}_${aplicarHorasNocturnas}`;
    
    if (serviciosSeleccionados.some(s => s.clave_unica === claveUnica)) {
      notifications.show({
        title: 'Error',
        message: 'Este servicio con esta configuración ya fue agregado',
        color: 'red'
      });
      return;
    }

    const nuevoServicio: ServicioConvenio = {
      id_servicio_financiador: servicioFinanciadorData.id_financiador_servicio,
      servicio_id: servicioFinanciadorData.servicio_id,
      nombre: servicioFinanciadorData.nombre,
      precio_facturar: precioTotal,
      id_servicio_tarifario: servicioTarifarioData.id,
      valores_disponibles: servicioTarifarioData.valores,
      valor_seleccionado: valorSeleccionado,
      precio_costo: costoTotal,
      utilidad: utilidadTotal,
      cantidad,
      aplicar_horas_nocturnas: aplicarHorasNocturnas,
      porcentaje_horas_nocturnas: aplicarHorasNocturnas ? financiadorInfo?.porcentaje_horas_nocturnas : 0,
      precio_base: servicioFinanciadorData.precio_facturar,
      clave_unica: claveUnica
    };

    try {
      if (onAgregarServicio) {
        await onAgregarServicio(nuevoServicio);
      } else {
        onServiciosChange([...serviciosSeleccionados, nuevoServicio]);
      }

      setServicioSeleccionado(null);
      setServicioTarifarioId(null);
      setCantidad(1);
      setValorSeleccionado(1);
      setAplicarHorasNocturnas(false);
      setBusquedaServicio('');

      notifications.show({
        title: 'Éxito',
        message: 'Servicio agregado',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar servicio',
        color: 'red'
      });
    }
  }, [servicioFinanciadorData, servicioTarifarioData, precioTotal, costoTotal, utilidadTotal, cantidad, valorSeleccionado, serviciosSeleccionados, onServiciosChange, onAgregarServicio, aplicarHorasNocturnas, financiadorInfo]);

  const handleEliminar = useCallback(async (claveUnica: string) => {
    try {
      const servicio = serviciosSeleccionados.find(s => s.clave_unica === claveUnica);
      if (!servicio) return;

      if (onEliminarServicio) {
        await onEliminarServicio(claveUnica);
      } else {
        onServiciosChange(serviciosSeleccionados.filter(s => s.clave_unica !== claveUnica));
      }

      notifications.show({
        title: 'Éxito',
        message: 'Servicio eliminado',
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar servicio',
        color: 'red'
      });
    }
  }, [serviciosSeleccionados, onServiciosChange, onEliminarServicio]);

  const handleActualizarCantidad = useCallback((claveUnica: string) => {
    if (nuevaCantidad <= 0) return;
    
    const servicio = serviciosSeleccionados.find(s => s.clave_unica === claveUnica);
    if (!servicio) return;

    const servicioFinanciador = serviciosFinanciador.find(s => s.id_financiador_servicio === servicio.id_servicio_financiador);
    const servicioTarifario = serviciosTarifario.find(s => s.id === servicio.id_servicio_tarifario);
    
    if (!servicioFinanciador || !servicioTarifario || !servicio.valor_seleccionado) return;
    
    // Calcular precio con recargo nocturno si aplica
    let precioUnit = servicioFinanciador.precio_facturar;
    if (servicio.aplicar_horas_nocturnas && financiadorInfo?.porcentaje_horas_nocturnas) {
      precioUnit *= (1 + financiadorInfo.porcentaje_horas_nocturnas / 100);
    }
    
    // Calcular costo con unidades base
    const precioCosto = servicioTarifario.valores?.[servicio.valor_seleccionado - 1] || 0;
    const unidadesBase = servicioFinanciador.unidades_base || 1;
    const costoUnit = precioCosto * unidadesBase;
    
    const precioTotal = precioUnit * nuevaCantidad;
    const costoTotal = costoUnit * nuevaCantidad;
    
    const serviciosActualizados = serviciosSeleccionados.map(s =>
      s.clave_unica === claveUnica
        ? {
            ...s,
            cantidad: nuevaCantidad,
            precio_facturar: precioTotal,
            precio_costo: costoTotal,
            utilidad: precioTotal - costoTotal
          }
        : s
    );
    
    onServiciosChange(serviciosActualizados);
    setEditandoClaveUnica(null);
    
    notifications.show({
      title: 'Éxito',
      message: 'Cantidad actualizada',
      color: 'green'
    });
  }, [serviciosSeleccionados, serviciosFinanciador, serviciosTarifario, nuevaCantidad, onServiciosChange, financiadorInfo]);

  return (
    <Paper p="md" withBorder>
      <Stack gap="lg">
        <Flex gap="md" align="flex-start">
          {/* Lista de servicios financiador */}
          <Paper p="sm" withBorder style={{ flex: 1 }}>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>Servicios del Financiador</Text>
                <TextInput
                  placeholder="Buscar..."
                  value={busquedaServicio}
                  onChange={(e) => setBusquedaServicio(e.currentTarget.value)}
                  size="xs"
                  style={{ width: 200 }}
                />
              </Group>
              <Table.ScrollContainer minWidth={700} h={400}>
                <Table striped="odd" highlightOnHover stickyHeader>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Servicio</Table.Th>
                      <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Precio</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {serviciosFinanciador
                      .filter(s => s.nombre.toLowerCase().includes(busquedaServicio.toLowerCase()))
                      .map((servicio, idx) => (
                      <Table.Tr key={`financiador_${servicio.id_financiador_servicio}_${idx}`}>
                        <Table.Td>
                          <Group gap="xs">
                            <Checkbox
                              size="sm"
                              checked={servicioSeleccionado === servicio.id_financiador_servicio}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setServicioSeleccionado(servicio.id_financiador_servicio);
                                  setAplicarHorasNocturnas(false);
                                } else {
                                  setServicioSeleccionado(null);
                                  setServicioTarifarioId(null);
                                  setAplicarHorasNocturnas(false);
                                }
                              }}
                              disabled={soloLectura || (
                                // Si NO admite nocturnas: deshabilitar si ya está agregado (cualquier versión)
                                !servicio.admite_horas_nocturnas
                                  ? serviciosSeleccionados.some(s => s.id_servicio_financiador === servicio.id_financiador_servicio)
                                  // Si SÍ admite nocturnas: deshabilitar solo si están AMBAS versiones
                                  : (serviciosSeleccionados.some(s => s.id_servicio_financiador === servicio.id_financiador_servicio && !s.aplicar_horas_nocturnas) &&
                                     serviciosSeleccionados.some(s => s.id_servicio_financiador === servicio.id_financiador_servicio && s.aplicar_horas_nocturnas))
                              )}
                            />
                            <span>{servicio.nombre.charAt(0).toUpperCase() + servicio.nombre.slice(1).toLowerCase()}</span>
                          </Group>
                        </Table.Td>
                        <Table.Td style={{ fontSize: '12px' }}>
                          {numberFormat.formatCurrency(servicio.precio_facturar)}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Stack>
          </Paper>

          {/* Panel de configuración */}
          <Paper p="sm" withBorder style={{ flex: 1 }}>
            <Stack gap="xs" style={{ backgroundColor: servicioSeleccionado ? '#f8f9fa' : '#f5f5f5', opacity: (servicioSeleccionado && !soloLectura) ? 1 : 0.6, padding: '1rem', borderRadius: '8px' }}>
              <Title order={5}>Agregar al Presupuesto</Title>
              
              <Text size="sm" fw={400}>Servicio</Text>
              <Text size="sm" c="dimmed">
                {servicioFinanciadorData?.nombre ? (servicioFinanciadorData.nombre.charAt(0).toUpperCase() + servicioFinanciadorData.nombre.slice(1).toLowerCase()) : 'Seleccione un servicio de la tabla'}
              </Text>
              <Select
                label={<Text size="sm" fw={400}>Servicio del Tarifario</Text>}
                placeholder="Seleccionar"
                data={serviciosTarifarioDisponibles}
                value={servicioTarifarioId?.toString() || null}
                onChange={(val) => setServicioTarifarioId(val ? parseInt(val) : null)}
                disabled={!servicioSeleccionado || soloLectura}
                searchable
                size="sm"
              />

              <NumberInput
                label={<Text size="sm" fw={400}>Cantidad</Text>}
                value={cantidad}
                onChange={(val) => setCantidad(Number(val) || 1)}
                min={1}
                disabled={!servicioSeleccionado || soloLectura}
                size="sm"
              />

              <Select
                label={<Text size="sm" fw={400}>Valor del Tarifario</Text>}
                placeholder="Seleccionar"
                data={valoresDisponibles}
                value={valorSeleccionado.toString()}
                onChange={(val) => setValorSeleccionado((parseInt(val || '1') as 1 | 2 | 3 | 4 | 5))}
                disabled={!servicioTarifarioId || soloLectura}
                size="sm"
              />

              {servicioFinanciadorData?.admite_horas_nocturnas && financiadorInfo?.porcentaje_horas_nocturnas && (
                <Checkbox
                  label={`Horas Nocturnas (+${financiadorInfo.porcentaje_horas_nocturnas}%)`}
                  checked={aplicarHorasNocturnas}
                  onChange={(e) => setAplicarHorasNocturnas(e.target.checked)}
                  disabled={!servicioSeleccionado || soloLectura}
                  size="sm"
                />
              )}

              {servicioFinanciadorData && servicioTarifarioData && (
                <>
                  <Text size="xs" c="dimmed">
                    Precio: {numberFormat.formatCurrency(precioTotal)} | Costo: {numberFormat.formatCurrency(costoTotal)} | <Text span c={utilidadTotal >= 0 ? 'green' : 'red'}>Utilidad: {numberFormat.formatCurrency(utilidadTotal)}</Text>
                  </Text>
                  {servicioFinanciadorData.unidades_base && servicioFinanciadorData.unidades_base > 1 && (
                    <Text size="xs" c="dimmed" fs="italic">
                      {servicioFinanciadorData.unidades_base} unidades × {numberFormat.formatCurrency(precioCosto)} c/u
                    </Text>
                  )}
                </>
              )}

              <Group grow>
                <Button
                  size="sm"
                  onClick={handleAgregar}
                  disabled={!servicioSeleccionado || !servicioTarifarioId || soloLectura}
                >
                  Agregar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  color="gray"
                  disabled={!servicioSeleccionado || soloLectura}
                  onClick={() => {
                    setServicioSeleccionado(null);
                    setServicioTarifarioId(null);
                    setCantidad(1);
                    setValorSeleccionado(1);
                  }}
                >
                  Cancelar
                </Button>
              </Group>
            </Stack>
          </Paper>
        </Flex>

        {/* Tabla de servicios agregados */}
        <Stack gap="xs">
          <Title order={5}>Servicios Agregados</Title>
          <Table.ScrollContainer minWidth={1000}>
            <Table striped="odd" highlightOnHover stickyHeader>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: 'left', fontWeight: 500, fontSize: '12px' }}>Servicio</Table.Th>
                  <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Cantidad</Table.Th>
                  <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Precio Unit.</Table.Th>
                  <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Costo Unit.</Table.Th>
                  <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Subtotal Precio</Table.Th>
                  <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Subtotal Costo</Table.Th>
                  <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Utilidad</Table.Th>
                  {!soloLectura && <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Acciones</Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {serviciosSeleccionados.map((servicio, i) => {
                  const servicioFinanciador = serviciosFinanciador.find(s => s.id_financiador_servicio === servicio.id_servicio_financiador);
                  const servicioTarifario = serviciosTarifario.find(s => s.id === servicio.id_servicio_tarifario);
                  const cantidad = servicio.cantidad || 1;
                  
                  // Calcular precio unitario con recargo nocturno si aplica
                  let precioUnit = servicioFinanciador?.precio_facturar || 0;
                  if (servicio.aplicar_horas_nocturnas && financiadorInfo?.porcentaje_horas_nocturnas) {
                    precioUnit *= (1 + financiadorInfo.porcentaje_horas_nocturnas / 100);
                  }
                  
                  // Usar costo guardado dividido por cantidad
                  const costoUnit = (servicio.precio_costo || 0) / cantidad;
                  
                  return (
                    <Table.Tr key={`${servicio.clave_unica}_${i}`}>
                      <Table.Td>
                        {servicio.nombre}
                        {servicio.aplicar_horas_nocturnas && ' 🌙'}
                      </Table.Td>
                      <Table.Td>
                        {editandoClaveUnica === servicio.clave_unica ? (
                          <NumberInput
                            value={nuevaCantidad}
                            onChange={(value) => setNuevaCantidad(Number(value) || 1)}
                            min={1}
                            w={80}
                            size="xs"
                            hideControls
                          />
                        ) : (
                          cantidad
                        )}
                      </Table.Td>
                      <Table.Td>{numberFormat.formatCurrency(precioUnit)}</Table.Td>
                      <Table.Td>{numberFormat.formatCurrency(costoUnit)}</Table.Td>
                      <Table.Td>{numberFormat.formatCurrency(precioUnit * cantidad)}</Table.Td>
                      <Table.Td>{numberFormat.formatCurrency(costoUnit * cantidad)}</Table.Td>
                      <Table.Td>
                        <Text c={servicio.utilidad && servicio.utilidad >= 0 ? 'green' : 'red'}>
                          {numberFormat.formatCurrency(servicio.utilidad || 0)}
                        </Text>
                      </Table.Td>
                      {!soloLectura && (
                        <Table.Td>
                          {editandoClaveUnica === servicio.clave_unica ? (
                            <Group gap={4} justify="left" wrap="nowrap">
                              <Button size="xs" onClick={() => handleActualizarCantidad(servicio.clave_unica!)}>
                                OK
                              </Button>
                              <Button size="xs" variant="outline" onClick={() => setEditandoClaveUnica(null)}>
                                Cancelar
                              </Button>
                            </Group>
                          ) : (
                            <Group gap={4} justify="left" wrap="nowrap">
                              <ActionIcon
                                variant="transparent"
                                onClick={() => {
                                  setEditandoClaveUnica(servicio.clave_unica!);
                                  setNuevaCantidad(cantidad);
                                }}
                              >
                                <PencilSquareIcon width={16} height={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="transparent"
                                color="red"
                                onClick={() => handleEliminar(servicio.clave_unica!)}
                              >
                                <IconTrash width={16} height={16} />
                              </ActionIcon>
                            </Group>
                          )}
                        </Table.Td>
                      )}
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          {serviciosSeleccionados.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No hay servicios agregados
            </div>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
