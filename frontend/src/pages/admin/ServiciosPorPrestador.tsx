import React, { useState, useEffect } from 'react';
import { Paper, Select, Table, Group, Stack, Modal, Switch, Badge, ActionIcon, Button, TextInput, Tooltip, Text as MantineText, NumberInput } from '@mantine/core';
import { PencilSquareIcon, MagnifyingGlassIcon, XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';


interface Financiador {
  idobra_social: string;
  Financiador: string;
}

interface ServicioPrestador {
  id_servicio: string;
  nombre: string;
  id_prestador_servicio: number | null;
  valor_facturar: number | null;
  activo: number | null;
  cant_total: number | null;
  valor_sugerido: number | null;
  tipo_unidad?: string;
}

export default function ServiciosPorPrestador() {
  const [financiadores, setFinanciadores] = useState<Financiador[]>([]);
  const [financiadorSeleccionado, setFinanciadorSeleccionado] = useState<string>('');
  const [servicios, setServicios] = useState<ServicioPrestador[]>([]);
  const [filtroServicio, setFiltroServicio] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioPrestador | null>(null);
  const [loading, setLoading] = useState(false);
  const [valoresHistoricos, setValoresHistoricos] = useState<any[]>([]);
  const [nuevosValores, setNuevosValores] = useState<Array<{
    valor_asignado: string;
    valor_facturar: string;
    fecha_inicio: string;
  }>>([{
    valor_asignado: '',
    valor_facturar: '',
    fecha_inicio: new Date().toISOString().slice(0, 10)
  }]);

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const formatNumber = (value: number | null | undefined): number => {
    return Number(value) || 0;
  };

  const formatPeso = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  useEffect(() => {
    cargarFinanciadores();
  }, []);

  useEffect(() => {
    if (financiadorSeleccionado) {
      cargarServicios();
    }
  }, [financiadorSeleccionado]);

  const cargarFinanciadores = async () => {
    try {
      const response = await api.get('/admin/servicios/prestadores');
      setFinanciadores(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar financiadores',
        color: 'red'
      });
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await api.get(`/admin/servicios/prestador/${financiadorSeleccionado}/servicios`);
      setServicios(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar servicios',
        color: 'red'
      });
    }
  };

  const toggleActivo = async (servicio: ServicioPrestador) => {
    const nuevoEstado = servicio.activo === 1 ? 0 : 1;
    
    try {
      await api.put(`/admin/servicios/prestador/${financiadorSeleccionado}/servicio/${servicio.id_servicio}`, {
        valor_facturar: formatNumber(servicio.valor_facturar),
        activo: nuevoEstado,
        cant_total: formatNumber(servicio.cant_total),
        valor_sugerido: formatNumber(servicio.valor_sugerido)
      });
      
      notifications.show({
        title: 'Éxito',
        message: `Servicio ${nuevoEstado === 1 ? 'activado' : 'desactivado'} correctamente`,
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

  const handleEdit = (servicio: ServicioPrestador) => {
    setEditingServicio({
      ...servicio,
      valor_facturar: formatNumber(servicio.valor_facturar),
      cant_total: formatNumber(servicio.cant_total),
      valor_sugerido: formatNumber(servicio.valor_sugerido)
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!editingServicio) return;

    setLoading(true);
    try {
      await api.put(`/admin/servicios/prestador/${financiadorSeleccionado}/servicio/${editingServicio.id_servicio}`, {
        valor_facturar: formatNumber(editingServicio.valor_facturar),
        activo: editingServicio.activo || 0,
        cant_total: formatNumber(editingServicio.cant_total),
        valor_sugerido: formatNumber(editingServicio.valor_sugerido)
      });
      
      notifications.show({
        title: 'Éxito',
        message: 'Servicio actualizado correctamente',
        color: 'green'
      });
      
      setModalOpen(false);
      setEditingServicio(null);
      cargarServicios();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar servicio',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Select
        label="Seleccionar Financiador"
        placeholder="Seleccione un financiador activo"
        value={financiadorSeleccionado}
        onChange={(value) => setFinanciadorSeleccionado(value || '')}
        data={financiadores.map(p => ({
          value: String(p.idobra_social),
          label: formatName(p.Financiador)
        }))}
        searchable
        clearable
      />

      {financiadorSeleccionado && (
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
                <Table.Tr key={servicio.id_servicio}>
                  <Table.Td>{formatName(servicio.nombre)}</Table.Td>
                  <Table.Td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{servicio.tipo_unidad || '-'}</Table.Td>
                  <Table.Td>
                    <Group gap="sm" align="center">
                      <Switch
                        checked={servicio.activo === 1}
                        onChange={() => toggleActivo(servicio)}
                        size="sm"
                      />
                      <Badge 
                        color={servicio.activo === 1 ? 'green' : 'gray'} 
                        variant="dot"
                        size="sm"
                      >
                        {servicio.activo === 1 ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td>{formatPeso(formatNumber(servicio.valor_facturar))}</Table.Td>
                  <Table.Td>{formatPeso(formatNumber(servicio.valor_sugerido))}</Table.Td>
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
          setValoresHistoricos([]);
          setNuevosValores([{
            valor_asignado: '',
            valor_facturar: '',
            fecha_inicio: new Date().toISOString().slice(0, 10)
          }]);
        }}
        title={`Editar Servicio: ${editingServicio ? formatName(editingServicio.nombre) : ''}`}
        styles={{title:{fontWeight:600,}}} 
        size="xl"
      >
        {editingServicio && (
          <Stack gap="lg">
            {/* Edición Rápida */}
            <Paper p="md" withBorder>
              <MantineText size="sm" fw={500} mb="sm">Edición Rápida (Valores Actuales)</MantineText>
              <Stack gap="sm">
                <Group grow>
                  <NumberInput
                    label="Valor Sugerido"
                    value={formatNumber(editingServicio.valor_sugerido)}
                    onChange={(val) => setEditingServicio({
                      ...editingServicio,
                      valor_sugerido: Number(val) || 0
                    })}
                    decimalScale={2}
                    fixedDecimalScale
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="$ "
                  />
                  <NumberInput
                    label="Valor a Facturar"
                    value={formatNumber(editingServicio.valor_facturar)}
                    onChange={(val) => setEditingServicio({
                      ...editingServicio,
                      valor_facturar: Number(val) || 0
                    })}
                    decimalScale={2}
                    fixedDecimalScale
                    thousandSeparator="."
                    decimalSeparator=","
                    prefix="$ "
                  />
                  <TextInput
                    label="Cantidad Sugerida"
                    type="number"
                    value={formatNumber(editingServicio.cant_total).toString()}
                    onChange={(e) => setEditingServicio({
                      ...editingServicio,
                      cant_total: parseInt(e.target.value) || 0
                    })}
                  />
                </Group>
                <Group justify="flex-end">
                  <Button onClick={handleSubmit} loading={loading}>
                    Guardar Cambios
                  </Button>
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
                    fecha_inicio: new Date().toISOString().slice(0, 10)
                  }])}
                >
                  <PlusIcon style={{ width: 16, height: 16 }} />
                </ActionIcon>
              </Group>
              
              <Stack gap="sm">
                {nuevosValores.map((valor, index) => (
                  <Group key={index} align="flex-end">
                    <NumberInput
                      label="Valor Sugerido"
                      value={valor.valor_asignado ? Number(valor.valor_asignado) : undefined}
                      onChange={(val) => {
                        const updated = [...nuevosValores];
                        updated[index].valor_asignado = val?.toString() || '';
                        setNuevosValores(updated);
                      }}
                      decimalScale={2}
                      fixedDecimalScale
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="$ "
                      style={{ flex: 1 }}
                    />
                    <NumberInput
                      label="Valor a Facturar"
                      value={valor.valor_facturar ? Number(valor.valor_facturar) : undefined}
                      onChange={(val) => {
                        const updated = [...nuevosValores];
                        updated[index].valor_facturar = val?.toString() || '';
                        setNuevosValores(updated);
                      }}
                      decimalScale={2}
                      fixedDecimalScale
                      thousandSeparator="."
                      decimalSeparator=","
                      prefix="$ "
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
                          await api.post(`/prestaciones/servicio/${editingServicio.id_prestador_servicio}/valores`, {
                            valor_asignado: parseFloat(valor.valor_asignado),
                            valor_facturar: parseFloat(valor.valor_facturar),
                            fecha_inicio: valor.fecha_inicio
                          });
                        }
                        
                        notifications.show({
                          title: 'Éxito',
                          message: `${nuevosValores.length} valor(es) guardado(s) correctamente`,
                          color: 'green'
                        });
                        
                        setNuevosValores([{
                          valor_asignado: '',
                          valor_facturar: '',
                          fecha_inicio: new Date().toISOString().slice(0, 10)
                        }]);
                        
                        // Recargar histórico
                        const res = await api.get(`/prestaciones/servicio/${editingServicio.id_prestador_servicio}/valores`);
                        setValoresHistoricos(res.data);
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
                      <Table.Th>Fecha Inicio</Table.Th>
                      <Table.Th>Fecha Fin</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Valor Sugerido</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Valor Facturar</Table.Th>
                      <Table.Th>Estado</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {valoresHistoricos.map((v: any) => (
                      <Table.Tr key={v.id}>
                        <Table.Td>{new Date(v.fecha_inicio).toLocaleDateString('es-AR')}</Table.Td>
                        <Table.Td>{v.fecha_fin ? new Date(v.fecha_fin).toLocaleDateString('es-AR') : 'Vigente'}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{formatPeso(Number(v.valor_asignado))}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{formatPeso(Number(v.valor_facturar))}</Table.Td>
                        <Table.Td>
                          {!v.fecha_fin ? (
                            <Badge color="green" variant="dot" size="sm">Vigente</Badge>
                          ) : (
                            <Badge color="gray" variant="dot" size="sm">Histórico</Badge>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Paper>
            )}

            <Group justify="space-between">
              <Button 
                variant="subtle" 
                onClick={async () => {
                  try {
                    const res = await api.get(`/prestaciones/servicio/${editingServicio.id_prestador_servicio}/valores`);
                    setValoresHistoricos(res.data);
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
    </Stack>
  );
}
