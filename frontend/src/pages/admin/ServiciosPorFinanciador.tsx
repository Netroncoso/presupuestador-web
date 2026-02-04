import React, { useState, useEffect } from 'react';
import { Paper, Select, Table, Group, Stack, Modal, Switch, ActionIcon, Button, TextInput, Tooltip, Text as MantineText, NumberInput, Text } from '@mantine/core';
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
  id_servicio: string;
  nombre: string;
  id_financiador_servicio: number | null;
  valor_facturar: number | null;
  activo: number | null;
  cant_total: number | null;
  valor_sugerido: number | null;
  tipo_unidad?: string;
  count_valores_vigentes?: number;
  valor_facturar_vigente?: number;
  valor_asignado_vigente?: number;
  sucursal_id_vigente?: number | null;
}

interface Sucursal {
  ID: number;
  Sucursales_mh: string;
  suc_porcentaje_insumos: number;
}

interface Props {
  financiadorId: string;
}

export default function ServiciosPorFinanciador({ financiadorId }: Props) {
  const [servicios, setServicios] = useState<ServicioFinanciador[]>([]);
  const [filtroServicio, setFiltroServicio] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioFinanciador | null>(null);
  const [loading, setLoading] = useState(false);
  const [valoresHistoricos, setValoresHistoricos] = useState<any[]>([]);
  const [valoresVigentes, setValoresVigentes] = useState<any[]>([]);
  const [modalValoresOpen, setModalValoresOpen] = useState(false);
  const [servicioValores, setServicioValores] = useState<ServicioFinanciador | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [nuevosValores, setNuevosValores] = useState<Array<{
    valor_asignado: string;
    valor_facturar: string;
    fecha_inicio: string;
    sucursal_id: string;
  }>>([{
    valor_asignado: '',
    valor_facturar: '',
    fecha_inicio: new Date().toISOString().slice(0, 10),
    sucursal_id: ''
  }]);

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const formatNumber = (value: number | null | undefined): number => {
    return Number(value) || 0;
  };

  useEffect(() => {
    cargarSucursales();
  }, []);

  useEffect(() => {
    if (financiadorId) {
      cargarServicios();
    } else {
      setServicios([]);
    }
  }, [financiadorId]);

  const cargarSucursales = async () => {
    try {
      const response = await api.get('/sucursales');
      setSucursales(response.data);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
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
      await api.put(`/admin/servicios/financiador/${financiadorId}/servicio/${editingServicio.id_servicio}`, {
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

  const renderValorCell = (servicio: ServicioFinanciador, valor: number | null | undefined, tipo: 'facturar' | 'asignado') => {
    const count = servicio.count_valores_vigentes ?? 0;
    
    if (count > 1) {
      return (
        <Tooltip label="Ver valores por sucursal">
          <ActionIcon color="red" variant="subtle" size="sm" onClick={() => handleVerValores(servicio)}>
            <SwatchIcon />
          </ActionIcon>
        </Tooltip>
      );
    }
    
    if (count === 1) {
      return (
        <div>
          <Text size="sm">{numberFormat.formatCurrency(formatNumber(valor))}</Text>
          <Text size="xs" c="dimmed">
            ({servicio.sucursal_id_vigente 
              ? sucursales.find(s => s.ID === servicio.sucursal_id_vigente)?.Sucursales_mh || 'Sucursal'
              : 'Todas'})
          </Text>
        </div>
      );
    }
    
    return <Text size="sm" c="dimmed">-</Text>;
  };

  return (
    <Stack gap="md">
      {financiadorId && (
        <Paper p="md" withBorder>
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
            mb="md"
          />
          <Table striped="odd" highlightOnHover layout="fixed" stickyHeader>
            <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
              <Table.Tr>
                <Table.Th>Servicio</Table.Th>
                <Table.Th style={{ width: '80px' }}>Tipo</Table.Th>
                <Table.Th style={{ width: '140px' }}>Estado</Table.Th>
                <Table.Th style={{ width: '140px' }}>
                  <Tooltip label="Valor a facturar por unidad de servicio">
                    <span>Valor a Facturar</span>
                  </Tooltip>
                </Table.Th>
                <Table.Th style={{ width: '130px' }}>Valor Sugerido</Table.Th>
                <Table.Th style={{ width: '110px' }}>
                  <Tooltip label="Cantidad inicial sugerida y límite para alertas">
                    <span>Cant. Sugerida</span>
                  </Tooltip>
                </Table.Th>
                <Table.Th style={{ width: '90px' }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {servicios
                .filter(s => s.nombre.toLowerCase().includes(filtroServicio.toLowerCase()))
                .map((servicio) => (
                <Table.Tr key={`servicio-${servicio.id_servicio}-${servicio.id_financiador_servicio || 'no-financiador'}`}>
                  <Table.Td>{formatName(servicio.nombre)}</Table.Td>
                  <Table.Td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{servicio.tipo_unidad || '-'}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c={servicio.activo === 1 ? 'green' : 'gray'}>
                      {servicio.activo === 1 ? 'Activo' : 'Inactivo'}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {renderValorCell(servicio, servicio.valor_facturar_vigente, 'facturar')}
                  </Table.Td>
                  <Table.Td>
                    {renderValorCell(servicio, servicio.valor_asignado_vigente, 'asignado')}
                  </Table.Td>
                  <Table.Td>{formatNumber(servicio.cant_total)}</Table.Td>
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
            valor_asignado: '',
            valor_facturar: '',
            fecha_inicio: new Date().toISOString().slice(0, 10),
            sucursal_id: ''
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
                  <Tooltip label="Cantidad inicial al agregar prestación y límite para alertas">
                    <MantineText size="sm" fw={500}>Cantidad Sugerida</MantineText>
                  </Tooltip>
                  <Group gap="xs">
                    <NumberInput
                      value={editingServicio.cant_total || 0}
                      onChange={(val) => setEditingServicio({
                        ...editingServicio,
                        cant_total: Number(val) || 0
                      })}
                      min={0}
                      allowNegative={false}
                      style={{ width: 100 }}
                    />
                    {editingServicio.id_financiador_servicio && (
                      <Button 
                        size="xs"
                        variant="light"
                        onClick={async () => {
                          try {
                            await api.put(`/admin/servicios/financiador/${financiadorId}/servicio/${editingServicio.id_servicio}`, {
                              valor_facturar: 0,
                              activo: editingServicio.activo || 0,
                              cant_total: editingServicio.cant_total || 0,
                              valor_sugerido: 0
                            });
                            notifications.show({
                              title: 'Éxito',
                              message: 'Cantidad actualizada',
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
                    valor_asignado: '',
                    valor_facturar: '',
                    fecha_inicio: new Date().toISOString().slice(0, 10),
                    sucursal_id: ''
                  }])}
                >
                  <PlusIcon style={{ width: 16, height: 16 }} />
                </ActionIcon>
              </Group>
              
              <Stack gap="sm">
                {nuevosValores.map((valor, index) => (
                  <Group key={index} align="flex-end" wrap="nowrap">
                    <Select
                      label="Sucursal"
                      placeholder="Todas"
                      value={valor.sucursal_id}
                      onChange={(val) => {
                        const updated = [...nuevosValores];
                        updated[index].sucursal_id = val || '';
                        setNuevosValores(updated);
                      }}
                      data={[
                        { value: '', label: 'Todas las sucursales' },
                        ...sucursales.filter(s => s.Sucursales_mh).map(s => ({ value: String(s.ID), label: s.Sucursales_mh }))
                      ]}
                      style={{ flex: 1 }}
                      clearable
                    />
                    <CurrencyInput
                      label="Valor Sugerido"
                      value={valor.valor_asignado ? Number(valor.valor_asignado) : undefined}
                      onChange={(val) => {
                        const updated = [...nuevosValores];
                        updated[index].valor_asignado = val?.toString() || '';
                        setNuevosValores(updated);
                      }}
                      style={{ flex: 1 }}
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
                      const validos = nuevosValores.every(v => v.valor_asignado && v.valor_facturar && v.fecha_inicio);
                      if (!validos) {
                        notifications.show({
                          title: 'Error',
                          message: 'Todos los campos son obligatorios',
                          color: 'red'
                        });
                        return;
                      }
                      
                      setLoading(true);
                      try {
                        // Guardar todos los valores
                        for (const valor of nuevosValores) {
                          const response = await api.post(`/prestaciones/servicio/${editingServicio.id_financiador_servicio || 0}/valores`, {
                            valor_asignado: parseFloat(valor.valor_asignado),
                            valor_facturar: parseFloat(valor.valor_facturar),
                            fecha_inicio: valor.fecha_inicio,
                            sucursal_id: valor.sucursal_id ? parseInt(valor.sucursal_id) : null,
                            id_servicio: editingServicio.id_servicio,
                            financiador_id: financiadorId
                          });
                          // Actualizar id_prestador_servicio si se creó nuevo
                          if (!editingServicio.id_financiador_servicio && response.data.id_financiador_servicio) {
                            setEditingServicio({
                              ...editingServicio,
                              id_financiador_servicio: response.data.id_financiador_servicio,
                              activo: 1
                            });
                          }
                        }
                        
                        notifications.show({
                          title: 'Éxito',
                          message: `${nuevosValores.length} valor(es) guardado(s) correctamente`,
                          color: 'green'
                        });
                        
                        setNuevosValores([{
                          valor_asignado: '',
                          valor_facturar: '',
                          fecha_inicio: new Date().toISOString().slice(0, 10),
                          sucursal_id: ''
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
                      <Table.Th>Sucursal</Table.Th>
                      <Table.Th>Fecha Inicio</Table.Th>
                      <Table.Th>Fecha Fin</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Valor Sugerido</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Valor Facturar</Table.Th>
                      <Table.Th>Estado</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {valoresHistoricos.map((v: any, index) => {
                      const sucursal = v.sucursal_id ? sucursales.find(s => s.ID === v.sucursal_id) : null;
                      return (
                        <Table.Tr key={`historico-${v.id || 'no-id'}-${index}-${v.fecha_inicio || 'no-fecha'}`}>
                          <Table.Td>
                            <Text size="sm" fw={!v.sucursal_id ? 500 : 400}>
                              {v.sucursal_id ? (sucursal?.Sucursales_mh || `ID ${v.sucursal_id}`) : 'Todas'}
                            </Text>
                          </Table.Td>
                          <Table.Td>{new Date(v.fecha_inicio).toLocaleDateString('es-AR')}</Table.Td>
                          <Table.Td>{v.fecha_fin ? new Date(v.fecha_fin).toLocaleDateString('es-AR') : 'Vigente'}</Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>{numberFormat.formatCurrency(Number(v.valor_asignado))}</Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>{numberFormat.formatCurrency(Number(v.valor_facturar))}</Table.Td>
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
                <Table.Th>Sucursal</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Valor Sugerido</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Valor Facturar</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {valoresVigentes.map((v: any, index) => {
                const sucursal = v.sucursal_id ? sucursales.find(s => s.ID === v.sucursal_id) : null;
                return (
                  <Table.Tr key={`modal-${v.id || 'no-id'}-${index}-${v.sucursal_id || 'no-sucursal'}`}>
                    <Table.Td>
                      <Text size="sm" fw={!v.sucursal_id ? 500 : 400}>
                        {v.sucursal_id ? (sucursal?.Sucursales_mh || `ID ${v.sucursal_id}`) : 'Todas'}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{numberFormat.formatCurrency(Number(v.valor_asignado))}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{numberFormat.formatCurrency(Number(v.valor_facturar))}</Table.Td>
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
