import React, { useState, useEffect } from 'react';
import { Paper, Select, Table, Group, Stack, Modal, Switch, ActionIcon, Button, TextInput, Text, NumberInput, Tooltip } from '@mantine/core';
import { PencilSquareIcon, MagnifyingGlassIcon, XMarkIcon, PlusIcon, TrashIcon, SwatchIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';

interface Financiador {
  id: string;
  Financiador: string;
}

interface Equipamiento {
  id: number;
  nombre: string;
  tipo: string;
  precio_referencia: number;
  activo: number;
  id_financiador_equipamiento?: number | null;
  valor_asignado_vigente?: number | null;
  valor_facturar_vigente?: number | null;
  count_valores_vigentes?: number;
  sucursal_id_vigente?: number | null;
  activo_financiador?: number | null;
}

interface Sucursal {
  ID: number;
  Sucursales_mh: string;
}

export default function GestionEquipamientos() {
  const [financiadores, setFinanciadores] = useState<Financiador[]>([]);
  const [financiadorSeleccionado, setFinanciadorSeleccionado] = useState<string>('');
  const [equipamientos, setEquipamientos] = useState<Equipamiento[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [filtro, setFiltro] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState<Equipamiento | null>(null);
  const [loading, setLoading] = useState(false);
  const [valoresHistoricos, setValoresHistoricos] = useState<any[]>([]);
  const [modalValoresOpen, setModalValoresOpen] = useState(false);
  const [equipamientoValores, setEquipamientoValores] = useState<Equipamiento | null>(null);
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

  const formatPeso = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  useEffect(() => {
    cargarFinanciadores();
    cargarSucursales();
  }, []);

  useEffect(() => {
    if (financiadorSeleccionado) {
      cargarEquipamientos();
    }
  }, [financiadorSeleccionado]);

  const cargarFinanciadores = async () => {
    try {
      const response = await api.get('/admin/financiadores');
      setFinanciadores(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar financiadores',
        color: 'red'
      });
    }
  };

  const cargarSucursales = async () => {
    try {
      const response = await api.get('/sucursales');
      setSucursales(response.data);
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const cargarEquipamientos = async () => {
    try {
      const response = await api.get(`/equipamientos/admin/financiador/${financiadorSeleccionado}`);
      setEquipamientos(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar equipamientos',
        color: 'red'
      });
    }
  };

  const handleEdit = async (equipo: Equipamiento) => {
    setEditando(equipo);
    setModalOpen(true);
    
    if (equipo.id_financiador_equipamiento) {
      try {
        const res = await api.get(`/equipamientos/acuerdo/${equipo.id_financiador_equipamiento}/valores`);
        setValoresHistoricos(res.data.filter((v: any) => !v.fecha_fin));
      } catch (err) {
        console.error('Error al cargar valores:', err);
      }
    }
  };

  const handleVerValores = async (equipo: Equipamiento) => {
    if (!equipo.id_financiador_equipamiento) return;
    
    try {
      const res = await api.get(`/equipamientos/acuerdo/${equipo.id_financiador_equipamiento}/valores`);
      const vigentes = res.data.filter((v: any) => !v.fecha_fin);
      setValoresHistoricos(vigentes);
      setEquipamientoValores(equipo);
      setModalValoresOpen(true);
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar valores',
        color: 'red'
      });
    }
  };

  const toggleActivo = async (activo: number) => {
    if (!editando || !editando.id_financiador_equipamiento) return;
    
    try {
      await api.put(`/equipamientos/admin/acuerdo/${editando.id_financiador_equipamiento}`, {
        activo
      });
      
      setEditando({ ...editando, activo_financiador: activo });
      
      notifications.show({
        title: 'Éxito',
        message: `Acuerdo ${activo === 1 ? 'activado' : 'desactivado'}`,
        color: 'green'
      });
      
      cargarEquipamientos();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar acuerdo',
        color: 'red'
      });
    }
  };

  const guardarValores = async () => {
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
      for (const valor of nuevosValores) {
        await api.post(`/equipamientos/acuerdo/${editando?.id_financiador_equipamiento || 0}/valores`, {
          valor_asignado: parseFloat(valor.valor_asignado),
          valor_facturar: parseFloat(valor.valor_facturar),
          fecha_inicio: valor.fecha_inicio,
          sucursal_id: valor.sucursal_id ? parseInt(valor.sucursal_id) : null,
          id_equipamiento: editando?.id,
          financiador_id: financiadorSeleccionado
        });
      }
      
      notifications.show({
        title: 'Éxito',
        message: `${nuevosValores.length} valor(es) guardado(s)`,
        color: 'green'
      });
      
      setNuevosValores([{
        valor_asignado: '',
        valor_facturar: '',
        fecha_inicio: new Date().toISOString().slice(0, 10),
        sucursal_id: ''
      }]);
      
      // Recargar datos después de guardar
      await cargarEquipamientos();
      
      // Recargar valores históricos del modal
      if (editando?.id_financiador_equipamiento) {
        const res = await api.get(`/equipamientos/acuerdo/${editando.id_financiador_equipamiento}/valores`);
        setValoresHistoricos(res.data.filter((v: any) => !v.fecha_fin));
      } else {
        // Si era nuevo acuerdo (ID = 0), buscar el equipamiento actualizado
        const response = await api.get(`/equipamientos/admin/financiador/${financiadorSeleccionado}`);
        const equipoActualizado = response.data.find((e: Equipamiento) => e.id === editando?.id);
        if (equipoActualizado?.id_financiador_equipamiento) {
          setEditando(equipoActualizado);
          const res = await api.get(`/equipamientos/acuerdo/${equipoActualizado.id_financiador_equipamiento}/valores`);
          setValoresHistoricos(res.data.filter((v: any) => !v.fecha_fin));
        }
      }
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Error al guardar valores',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderValorCell = (equipo: Equipamiento, tipo: 'costo' | 'precio') => {
    const count = equipo.count_valores_vigentes ?? 0;
    const valor = tipo === 'costo' ? equipo.valor_asignado_vigente : equipo.valor_facturar_vigente;
    
    if (count > 1) {
      return (
        <Tooltip label="Ver valores por sucursal">
          <ActionIcon color="red" variant="subtle" size="sm" onClick={() => handleVerValores(equipo)}>
            <SwatchIcon />
          </ActionIcon>
        </Tooltip>
      );
    }
    
    if (count === 1) {
      return (
        <div>
          <Text size="sm">{formatPeso(valor || 0)}</Text>
          <Text size="xs" c="dimmed">
            ({equipo.sucursal_id_vigente 
              ? sucursales.find(s => s.ID === equipo.sucursal_id_vigente)?.Sucursales_mh || 'Sucursal'
              : 'Todas'})
          </Text>
        </div>
      );
    }
    
    return <Text size="sm" c="dimmed">-</Text>;
  };

  return (
    <Stack gap="md">
      <Select
        label="Seleccionar Financiador"
        placeholder="Seleccione un financiador"
        value={financiadorSeleccionado}
        onChange={(value) => setFinanciadorSeleccionado(value || '')}
        data={financiadores.map(f => ({
          value: String(f.id),
          label: formatName(f.Financiador)
        }))}
        searchable
        clearable
      />

      {financiadorSeleccionado && (
        <Paper p="md" withBorder>
          <TextInput
            placeholder="Filtrar por nombre..."
            leftSection={<MagnifyingGlassIcon style={{ width: 16, height: 16 }} />}
            value={filtro}
            onChange={(e) => setFiltro(e.currentTarget.value)}
            rightSection={
              filtro ? (
                <ActionIcon variant="subtle" onClick={() => setFiltro('')}>
                  <XMarkIcon style={{ width: 16, height: 16 }} />
                </ActionIcon>
              ) : null
            }
            mb="md"
          />
          
          <Table striped="odd" highlightOnHover stickyHeader>
            <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
              <Table.Tr>
                <Table.Th>Equipamiento</Table.Th>
                <Table.Th style={{ width: '100px' }}>Tipo</Table.Th>
                <Table.Th style={{ width: '140px' }}>
                  <Tooltip label="Valores mensuales">
                    <span style={{ cursor: 'help' }}>Precio Referencia</span>
                  </Tooltip>
                </Table.Th>
                <Table.Th style={{ width: '140px' }}>
                  <Tooltip label="Valores mensuales">
                    <span style={{ cursor: 'help' }}>Costo Acuerdo</span>
                  </Tooltip>
                </Table.Th>
                <Table.Th style={{ width: '140px' }}>
                  <Tooltip label="Valores mensuales">
                    <span style={{ cursor: 'help' }}>Precio Acuerdo</span>
                  </Tooltip>
                </Table.Th>
                <Table.Th style={{ width: '100px' }}>Estado</Table.Th>
                <Table.Th style={{ width: '90px' }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {equipamientos
                .filter(e => e.nombre.toLowerCase().includes(filtro.toLowerCase()))
                .map((equipo) => (
                  <Table.Tr key={equipo.id}>
                    <Table.Td>{equipo.nombre}</Table.Td>
                    <Table.Td style={{ textTransform: 'capitalize' }}>{equipo.tipo}</Table.Td>
                    <Table.Td>{formatPeso(equipo.precio_referencia)}</Table.Td>
                    <Table.Td>{renderValorCell(equipo, 'costo')}</Table.Td>
                    <Table.Td>{renderValorCell(equipo, 'precio')}</Table.Td>
                    <Table.Td>
                      <Text size="sm" c={equipo.activo_financiador === 1 ? 'green' : 'gray'}>
                        {equipo.activo_financiador === 1 ? 'Activo' : 'Inactivo'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Tooltip label="Editar valores">
                        <ActionIcon variant="transparent" onClick={() => handleEdit(equipo)}>
                          <PencilSquareIcon width={20} height={20} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                ))}
            </Table.Tbody>
          </Table>
          
          {equipamientos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No se encontraron equipamientos
            </div>
          )}
        </Paper>
      )}

      <Modal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setValoresHistoricos([]);
          setNuevosValores([{
            valor_asignado: '',
            valor_facturar: '',
            fecha_inicio: new Date().toISOString().slice(0, 10),
            sucursal_id: ''
          }]);
        }}
        title={`Editar: ${editando?.nombre || ''}`}
        styles={{ title: { fontWeight: 600 } }}
        size="xl"
      >
        {editando && (
          <Stack gap="lg">
            <Paper p="md" withBorder>
              <Group justify="space-between" align="center">
                <Tooltip label="Activa el acuerdo para que esté disponible en presupuestos">
                  <Text size="sm" fw={500}>Estado del Acuerdo</Text>
                </Tooltip>
                <Switch
                  checked={editando.activo_financiador === 1}
                  onChange={async (e) => {
                    if (e.currentTarget.checked) {
                      // Validar que tenga valores VIGENTES (para todos los equipamientos)
                      try {
                        const res = await api.get(`/equipamientos/acuerdo/${editando.id_financiador_equipamiento || 0}/valores`);
                        const vigentes = res.data.filter((v: any) => !v.fecha_fin);
                        if (vigentes.length === 0) {
                          notifications.show({
                            title: 'Error',
                            message: 'Debes agregar al menos un valor vigente antes de activar',
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
            </Paper>

            <Paper p="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
              <Group justify="space-between" mb="sm">
                <Text size="sm" fw={500}>Agregar Valores con Fecha de Vigencia</Text>
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
                        ...sucursales.map(s => ({ value: String(s.ID), label: s.Sucursales_mh }))
                      ]}
                      style={{ flex: 1 }}
                      clearable
                    />
                    <NumberInput
                      label={
                        <Tooltip label="Valor mensual">
                          <span style={{ cursor: 'help' }}>Costo</span>
                        </Tooltip>
                      }
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
                      label={
                        <Tooltip label="Valor mensual">
                          <span style={{ cursor: 'help' }}>Precio</span>
                        </Tooltip>
                      }
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
                  <Button onClick={guardarValores} loading={loading}>
                    Guardar {nuevosValores.length > 1 ? `${nuevosValores.length} Valores` : 'Valor'}
                  </Button>
                </Group>
              </Stack>
            </Paper>

            {valoresHistoricos.length > 0 && (
              <Paper withBorder>
                <Table striped highlightOnHover>
                  <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
                    <Table.Tr>
                      <Table.Th>Sucursal</Table.Th>
                      <Table.Th>Fecha Inicio</Table.Th>
                      <Table.Th>Fecha Fin</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Costo</Table.Th>
                      <Table.Th style={{ textAlign: 'right' }}>Precio</Table.Th>
                      <Table.Th>Estado</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {valoresHistoricos.map((v: any) => {
                      const sucursal = v.sucursal_id ? sucursales.find(s => s.ID === v.sucursal_id) : null;
                      return (
                        <Table.Tr key={v.id}>
                          <Table.Td>
                            <Text size="sm" fw={!v.sucursal_id ? 500 : 400}>
                              {v.sucursal_id ? (sucursal?.Sucursales_mh || `ID ${v.sucursal_id}`) : 'Todas'}
                            </Text>
                          </Table.Td>
                          <Table.Td>{new Date(v.fecha_inicio).toLocaleDateString('es-AR')}</Table.Td>
                          <Table.Td>{v.fecha_fin ? new Date(v.fecha_fin).toLocaleDateString('es-AR') : 'Vigente'}</Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>{formatPeso(Number(v.valor_asignado))}</Table.Td>
                          <Table.Td style={{ textAlign: 'right' }}>{formatPeso(Number(v.valor_facturar))}</Table.Td>
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

            <Group justify="flex-end">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cerrar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal
        opened={modalValoresOpen}
        onClose={() => {
          setModalValoresOpen(false);
          setValoresHistoricos([]);
          setEquipamientoValores(null);
        }}
        title={`Valores Vigentes: ${equipamientoValores?.nombre || ''}`}
        size="md"
      >
        {valoresHistoricos.length > 0 ? (
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
              <Table.Tr>
                <Table.Th>Sucursal</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Costo</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Precio</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {valoresHistoricos.map((v: any) => {
                const sucursal = v.sucursal_id ? sucursales.find(s => s.ID === v.sucursal_id) : null;
                return (
                  <Table.Tr key={v.id}>
                    <Table.Td>
                      <Text size="sm" fw={!v.sucursal_id ? 500 : 400}>
                        {v.sucursal_id ? (sucursal?.Sucursales_mh || `ID ${v.sucursal_id}`) : 'Todas'}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{formatPeso(Number(v.valor_asignado))}</Table.Td>
                    <Table.Td style={{ textAlign: 'right' }}>{formatPeso(Number(v.valor_facturar))}</Table.Td>
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
