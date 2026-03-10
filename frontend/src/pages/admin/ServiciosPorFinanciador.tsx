import React, { useState, useEffect } from 'react';
import { Paper, Select, Table, Group, Stack, Modal, Switch, ActionIcon, Button, TextInput, Tooltip, Text as MantineText, NumberInput, Text, MultiSelect } from '@mantine/core';
import { PencilSquareIcon, MagnifyingGlassIcon,SwatchIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';
import { numberFormat } from '../../utils/numberFormat';
import { CurrencyInput } from '../../components/CurrencyInput';


interface Financiador {
  id: string;
  Financiador: string;
}

interface ServicioFinanciador {
  id: number;
  nombre: string;
  descripcion?: string;
  id_financiador_servicio: number | null;
  valor_facturar: number | null;
  activo: number | null;
  cant_total: number | null;
  valor_sugerido: number | null;
  tipo_unidad?: string;
  count_valores_vigentes?: number;
  precio_facturar_vigente?: number;
  zona_financiador_id_vigente?: number | null;
  unidades_base?: number;
  admite_horas_nocturnas?: boolean;
  codigo_financiador?: string;
}

interface Zona {
  id: number;
  nombre: string;
  activo: number;
}

interface Props {
  financiadorId: string;
}

export default function ServiciosPorFinanciador({ financiadorId }: Props) {
  const [servicios, setServicios] = useState<ServicioFinanciador[]>([]);
  const [filtroServicio, setFiltroServicio] = useState('');
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioFinanciador | null>(null);
  const [loading, setLoading] = useState(false);
  const [valoresHistoricos, setValoresHistoricos] = useState<any[]>([]);
  const [valoresVigentes, setValoresVigentes] = useState<any[]>([]);
  const [modalValoresOpen, setModalValoresOpen] = useState(false);
  const [servicioValores, setServicioValores] = useState<ServicioFinanciador | null>(null);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [nuevosValores, setNuevosValores] = useState<Array<{
    valor_facturar: string;
    fecha_inicio: string;
    zonas_ids: string[];
  }>>([{
    valor_facturar: '',
    fecha_inicio: new Date().toISOString().slice(0, 10),
    zonas_ids: []
  }]);

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const formatNumber = (value: number | null | undefined): number => {
    return Number(value) || 0;
  };

  useEffect(() => {
    cargarZonas();
  }, []);

  useEffect(() => {
    if (financiadorId) {
      cargarServicios();
    } else {
      setServicios([]);
    }
  }, [financiadorId]);

  const cargarZonas = async () => {
    try {
      const response = await api.get('/financiador/zonas');
      setZonas(response.data.filter((z: Zona) => z.activo === 1));
    } catch (error) {
      console.error('Error al cargar zonas:', error);
    }
  };

  const cargarServicios = async () => {
    if (!financiadorId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/admin/servicios/financiador/${financiadorId}/servicios`);
      setServicios(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar servicios',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleActivo = async (activo: number) => {
    if (!editingServicio) return;
    
    try {
      await api.put(`/admin/servicios/financiador/${financiadorId}/servicio/${editingServicio.id}`, {
        valor_facturar: 0,
        activo: activo,
        cant_total: editingServicio.cant_total || 0,
        valor_sugerido: 0
      });
      
      setEditingServicio({
        ...editingServicio,
        activo: activo
      });
      
      notifications.show({
        title: 'Éxito',
        message: `Servicio ${activo === 1 ? 'activado' : 'desactivado'} correctamente`,
        color: 'green'
      });
      
      cargarServicios();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar servicio',
        color: 'red'
      });
    }
  };

  const handleEdit = (servicio: ServicioFinanciador) => {
    setEditingServicio(servicio);
    setModalOpen(true);
  };

  const handleVerValores = async (servicio: ServicioFinanciador) => {
    try {
      const res = await api.get(`/prestaciones/servicio/${servicio.id_financiador_servicio}/valores`);
      const vigentes = res.data.filter((v: any) => !v.fecha_fin);
      setValoresVigentes(vigentes);
      setServicioValores(servicio);
      setModalValoresOpen(true);
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar valores',
        color: 'red'
      });
    }
  };

  const renderValorCell = (servicio: ServicioFinanciador) => {
    const count = servicio.count_valores_vigentes ?? 0;
    
    if (count > 1) {
      return (
        <Tooltip label="Ver valores por zona">
          <ActionIcon color="red" variant="subtle" size="sm" onClick={() => handleVerValores(servicio)}>
            <SwatchIcon />
          </ActionIcon>
        </Tooltip>
      );
    }
    
    if (count === 1) {
      return <Text size="sm">{numberFormat.formatCurrency(formatNumber(servicio.precio_facturar_vigente))}</Text>;
    }
    
    return <Text size="sm" c="dimmed">-</Text>;
  };

  return (
    <Stack gap="md">
      {financiadorId && (
        <Paper p="md" withBorder>
          <Group justify="space-between" mb="md">
            <TextInput
              placeholder="Filtrar por servicio..."
              leftSection={<MagnifyingGlassIcon style={{ width: 16, height: 16 }} />}
              value={filtroServicio}
              onChange={(e) => setFiltroServicio(e.currentTarget.value)}
              rightSection={
                filtroServicio ? (
                  <ActionIcon variant="subtle" onClick={() => setFiltroServicio('')}>
                    <XMarkIcon style={{ width: 16, height: 16 }} />
                  </ActionIcon>
                ) : null
              }
              style={{ flex: 1 }}
            />
            <Switch
              label={<Text size="xs">Inactivos</Text>}
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.currentTarget.checked)}
              size="xs"
            />
          </Group>
          <Table striped="odd" highlightOnHover layout="fixed" stickyHeader>
            <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
              <Table.Tr>
                <Table.Th>Servicio</Table.Th>
                <Table.Th style={{ width: '120px' }}>Código</Table.Th>
                <Table.Th>Descripción</Table.Th>
                <Table.Th style={{ width: '80px' }}>Tipo</Table.Th>
                <Table.Th style={{ width: '80px' }}>Unid. Base</Table.Th>
                <Table.Th style={{ width: '100px' }}>Nocturno</Table.Th>
                <Table.Th style={{ width: '100px' }}>Estado</Table.Th>
                <Table.Th style={{ width: '140px' }}>
                  <Tooltip label="Valor a facturar por unidad de servicio">
                    <span>Valor a Facturar</span>
                  </Tooltip>
                </Table.Th>
                <Table.Th style={{ width: '90px' }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {servicios
                .filter(s => s.nombre.toLowerCase().includes(filtroServicio.toLowerCase()))
                .filter(s => mostrarInactivos ? true : s.activo === 1)
                .map((servicio) => (
                <Table.Tr key={`servicio-${servicio.id}-${servicio.id_financiador_servicio || 'no-financiador'}`}>
                  <Table.Td>{formatName(servicio.nombre)}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{servicio.codigo_financiador || '-'}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">{servicio.descripcion || '-'}</Text>
                  </Table.Td>
                  <Table.Td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{servicio.tipo_unidad || '-'}</Table.Td>
                  <Table.Td>
                    <Text size="sm" ta="center">{servicio.unidades_base || 1}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={servicio.admite_horas_nocturnas ? 'blue' : 'gray'} ta="center">
                      {servicio.admite_horas_nocturnas ? 'Sí' : 'No'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c={servicio.activo === 1 ? 'green' : 'gray'}>
                      {servicio.activo === 1 ? 'Activo' : 'Inactivo'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {renderValorCell(servicio)}
                  </Table.Td>
                  <Table.Td>
                    <Tooltip label="Editar valores">
                      <ActionIcon variant="transparent" onClick={() => handleEdit(servicio)}>
                        <PencilSquareIcon width={20} height={20} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          
          {servicios.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No se encontraron servicios
            </div>
          )}
        </Paper>
      )}

      {/* Modal Editar con Histórico */}
      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingServicio(null);
          setValoresHistoricos([]);
          setNuevosValores([{
            valor_facturar: '',
            fecha_inicio: new Date().toISOString().slice(0, 10),
            zonas_ids: []
          }]);
        }}
        title={`Editar Servicio: ${editingServicio ? formatName(editingServicio.nombre) : ''}`}
        styles={{title:{fontWeight:600,}}} 
        size="xl"
      >
        {editingServicio && (
          <Stack gap="lg">
            {/* Estado del Servicio */}
            <Paper p="md" withBorder>
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Tooltip label="Activa el servicio para que esté disponible en presupuestos">
                    <MantineText size="sm" fw={500}>Estado del Servicio</MantineText>
                  </Tooltip>
                  <Switch
                    checked={editingServicio.activo === 1}
                    onChange={async (e) => {
                    if (e.currentTarget.checked) {
                      // Validar que tenga valores VIGENTES (para todos los servicios)
                      try {
                        const res = await api.get(`/prestaciones/servicio/${editingServicio.id_financiador_servicio || 0}/valores`);
                        const vigentes = res.data.filter((v: any) => !v.fecha_fin);
                        if (vigentes.length === 0) {
                          notifications.show({
                            title: 'Error',
                            message: 'Debes agregar al menos un valor vigente antes de activar el servicio',
                            color: 'red'
                          });
                          return;
                        }
                        toggleActivo(1);
                      } catch (err) {
                        notifications.show({
                          title: 'Error',
                          message: 'Error al verificar valores',
                          color: 'red'
                        });
                      }
                    } else {
                      toggleActivo(0);
                    }
                    }}
                    size="lg"
                    onLabel="Activo"
                    offLabel="Inactivo"
                  />
                </Group>
                
                <Group justify="space-between" align="center">
                  <Tooltip label="Cantidad de unidades del tarifario que componen este servicio">
                    <MantineText size="sm" fw={500}>Unidades Base</MantineText>
                  </Tooltip>
                  <Group gap="xs">
                    <NumberInput
                      value={editingServicio.unidades_base || 1}
                      onChange={(val) => setEditingServicio({
                        ...editingServicio,
                        unidades_base: Number(val) || 1
                      })}
                      min={0.01}
                      step={0.5}
                      decimalScale={2}
                      allowNegative={false}
                      style={{ width: 100 }}
                    />
                    {editingServicio.id_financiador_servicio && (
                      <Button 
                        size="xs"
                        variant="light"
                        onClick={async () => {
                          try {
                            await api.put(`/admin/servicios/financiador/${financiadorId}/servicio/${editingServicio.id}`, {
                              valor_facturar: 0,
                              activo: editingServicio.activo || 0,
                              cant_total: editingServicio.cant_total || 0,
                              valor_sugerido: 0,
                              unidades_base: editingServicio.unidades_base || 1,
                              admite_horas_nocturnas: editingServicio.admite_horas_nocturnas || false
                            });
                            notifications.show({
                              title: 'Éxito',
                              message: 'Configuración actualizada',
                              color: 'green'
                            });
                            cargarServicios();
                          } catch (err) {
                            notifications.show({
                              title: 'Error',
                              message: 'Error al actualizar',
                              color: 'red'
                            });
                          }
                        }}
                      >
                        Guardar
                      </Button>
                    )}
                  </Group>
                </Group>
                
                <Group justify="space-between" align="center">
                  <Tooltip label="Permite aplicar recargo por horas nocturnas a este servicio">
                    <MantineText size="sm" fw={500}>Admite Horas Nocturnas</MantineText>
                  </Tooltip>
                  <Switch
                    checked={editingServicio.admite_horas_nocturnas || false}
                    onChange={(e) => setEditingServicio({
                      ...editingServicio,
                      admite_horas_nocturnas: e.currentTarget.checked
                    })}
                    size="md"
                  />
                </Group>
              </Stack>
            </Paper>

            {/* Histórico de Valores */}
            <Paper p="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
              <Group justify="space-between" mb="sm">
                <MantineText size="sm" fw={500}>Agregar Valores con Fecha de Vigencia</MantineText>
                <ActionIcon 
                  variant="filled" 
                  color="green" 
                  size="sm"
                  onClick={() => setNuevosValores([...nuevosValores, {
                    valor_facturar: '',
                    fecha_inicio: new Date().toISOString().slice(0, 10),
                    zonas_ids: []
                  }])}
                >
                  <PlusIcon style={{ width: 16, height: 16 }} />
                </ActionIcon>
              </Group>
              
              <Stack gap="sm">
                {nuevosValores.map((valor, index) => (
                  <Group key={index} align="flex-end" wrap="nowrap">
                    <MultiSelect
                      label="Zonas"
                      placeholder="Seleccione zonas"
                      value={valor.zonas_ids}
                      onChange={(val) => {
                        const updated = [...nuevosValores];
                        updated[index].zonas_ids = val;
                        setNuevosValores(updated);
                      }}
                      data={zonas.map(z => ({ value: String(z.id), label: z.nombre }))}
                      style={{ flex: 1 }}
                      searchable
                      required
                    />
                    <CurrencyInput
                      label="Valor a Facturar"
                      value={valor.valor_facturar ? Number(valor.valor_facturar) : undefined}
                      onChange={(val) => {
                        const updated = [...nuevosValores];
                        updated[index].valor_facturar = val?.toString() || '';
                        setNuevosValores(updated);
                      }}
                      style={{ flex: 1 }}
                    />
                    <TextInput
                      label="Fecha Inicio"
                      type="date"
                      value={valor.fecha_inicio}
                      onChange={(e) => {
                        const updated = [...nuevosValores];
                        updated[index].fecha_inicio = e.target.value;
                        setNuevosValores(updated);
                      }}
                      style={{ flex: 1 }}
                    />
                    {nuevosValores.length > 1 && (
                      <ActionIcon 
                        variant="subtle" 
                        color="red"
                        onClick={() => setNuevosValores(nuevosValores.filter((_, i) => i !== index))}
                      >
                        <TrashIcon style={{ width: 20, height: 20 }} />
                      </ActionIcon>
                    )}
                  </Group>
                ))}
                
                <Group justify="flex-end">
                  <Button 
                    onClick={async () => {
                      // Validar que todos los campos estén completos
                      const validos = nuevosValores.every(v => v.valor_facturar && v.fecha_inicio && v.zonas_ids.length > 0);
                      if (!validos) {
                        notifications.show({
                          title: 'Error',
                          message: 'Zonas, Valor a Facturar y Fecha son obligatorios',
                          color: 'red'
                        });
                        return;
                      }
                      
                      setLoading(true);
                      try {
                        let idFinanciadorServicio = editingServicio.id_financiador_servicio;
                        
                        // Guardar cada valor con sus zonas (sin duplicar)
                        for (const valor of nuevosValores) {
                          for (const zonaId of valor.zonas_ids) {
                            const response = await api.post(`/prestaciones/servicio/${idFinanciadorServicio || 0}/valores`, {
                              precio_facturar: parseFloat(valor.valor_facturar),
                              fecha_inicio: valor.fecha_inicio,
                              zona_financiador_id: parseInt(zonaId),
                              servicio_id: editingServicio.id,
                              financiador_id: parseInt(financiadorId)
                            });
                            
                            // Actualizar id_financiador_servicio solo la primera vez
                            if (!idFinanciadorServicio && response.data.id_financiador_servicio) {
                              idFinanciadorServicio = response.data.id_financiador_servicio;
                              setEditingServicio({
                                ...editingServicio,
                                id_financiador_servicio: idFinanciadorServicio,
                                activo: 1
                              });
                            }
                          }
                        }
                        
                        const totalZonas = nuevosValores.reduce((sum, v) => sum + v.zonas_ids.length, 0);
                        notifications.show({
                          title: 'Éxito',
                          message: `Valores guardados para ${totalZonas} zona(s)`,
                          color: 'green'
                        });
                        
                        setNuevosValores([{
                          valor_facturar: '',
                          fecha_inicio: new Date().toISOString().slice(0, 10),
                          zonas_ids: []
                        }]);
                        
                        // Recargar histórico solo si existe id_prestador_servicio
                        if (editingServicio.id_financiador_servicio) {
                          const res = await api.get(`/prestaciones/servicio/${editingServicio.id_financiador_servicio}/valores`);
                          setValoresHistoricos(res.data);
                        }
                        cargarServicios();
                      } catch (err: any) {
                        notifications.show({
                          title: 'Error',
                          message: err.response?.data?.message || 'Error al guardar valores',
                          color: 'red'
                        });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    loading={loading}
                  >
                    Guardar {nuevosValores.length > 1 ? `${nuevosValores.length} Valores` : 'Valor'}
                  </Button>
                </Group>
              </Stack>
            </Paper>

            {/* Tabla Histórico */}
            {valoresHistoricos.length > 0 && (
              <Paper withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
                    <Table.Tr>
                      <Table.Th>Zona</Table.Th>
                      <Table.Th>Fecha Inicio</Table.Th>
                      <Table.Th>Fecha Fin</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Valor Facturar</Table.Th>
                      <Table.Th>Estado</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {valoresHistoricos.map((v: any, index) => {
                      const zona = v.zona_financiador_id ? zonas.find(z => z.id === v.zona_financiador_id) : null;
                      return (
                        <Table.Tr key={`historico-${v.id || 'no-id'}-${index}-${v.fecha_inicio || 'no-fecha'}`}>
                          <Table.Td>
                            <Text size="sm">
                              {zona?.nombre || `Zona ${v.zona_financiador_id}`}
                            </Text>
                          </Table.Td>
                          <Table.Td>{new Date(v.fecha_inicio).toLocaleDateString('es-AR')}</Table.Td>
                          <Table.Td>{v.fecha_fin ? new Date(v.fecha_fin).toLocaleDateString('es-AR') : 'Vigente'}</Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>{numberFormat.formatCurrency(Number(v.precio_facturar))}</Table.Td>
                          <Table.Td>
                            <Text size="sm" c={!v.fecha_fin ? 'green' : 'gray'}>
                              {!v.fecha_fin ? 'Vigente' : 'Histórico'}
                            </Text>
                          </Table.Td>
                        </Table.Tr>
                      );
                    })}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}

            <Group justify="space-between">
              <Button 
                variant="subtle" 
                onClick={async () => {
                  if (!editingServicio.id_financiador_servicio) {
                    notifications.show({
                      title: 'Sin valores',
                      message: 'Este servicio aún no tiene valores históricos configurados',
                      color: 'yellow'
                    });
                    return;
                  }
                  try {
                    const res = await api.get(`/prestaciones/servicio/${editingServicio.id_financiador_servicio}/valores`);
                    setValoresHistoricos(res.data);
                    if (res.data.length === 0) {
                      notifications.show({
                        title: 'Sin valores',
                        message: 'Este servicio aún no tiene valores históricos configurados',
                        color: 'yellow'
                      });
                    }
                  } catch (err) {
                    notifications.show({
                      title: 'Error',
                      message: 'Error al cargar histórico',
                      color: 'red'
                    });
                  }
                }}
              >
                {valoresHistoricos.length > 0 ? 'Actualizar' : 'Ver'} Histórico
              </Button>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cerrar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal Ver Valores por Sucursal */}
      <Modal
        opened={modalValoresOpen}
        onClose={() => {
          setModalValoresOpen(false);
          setValoresVigentes([]);
          setServicioValores(null);
        }}
        title={`Valores Vigentes: ${servicioValores ? formatName(servicioValores.nombre) : ''}`}
        size="md"
      >
        {valoresVigentes.length > 0 ? (
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
              <Table.Tr>
                <Table.Th>Zona</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Valor Facturar</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {valoresVigentes.map((v: any, index) => {
                const zona = v.zona_financiador_id ? zonas.find(z => z.id === v.zona_financiador_id) : null;
                return (
                  <Table.Tr key={`modal-${v.id || 'no-id'}-${index}-${v.zona_financiador_id || 'no-zona'}`}>
                    <Table.Td>
                      <Text size="sm">
                        {zona?.nombre || `Zona ${v.zona_financiador_id}`}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{numberFormat.formatCurrency(Number(v.precio_facturar))}</Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        ) : (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No hay valores vigentes configurados
          </Text>
        )}
      </Modal>
    </Stack>
  );
}
