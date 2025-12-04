import React, { useState, useEffect } from 'react';
import { TextInput, Table, Group, Stack, Modal, Switch, Text, ActionIcon, Button, Select } from '@mantine/core';
import { PencilSquareIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';
import AdminTable from '../../components/AdminTable';

interface Financiador {
  idobra_social: string;
  Financiador: string;
  activo: number;
  tasa_mensual: number;
  dias_cobranza_teorico: number;
  dias_cobranza_real: number;
  id_acuerdo?: number | null;
  acuerdo_nombre?: string | null;
}

export default function GestionPrestadores() {
  const [financiadores, setFinanciadores] = useState<Financiador[]>([]);
  const [filtro, setFiltro] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFinanciador, setEditingFinanciador] = useState<Financiador | null>(null);
  const [loading, setLoading] = useState(false);
  const [acuerdos, setAcuerdos] = useState<{ id_acuerdo: number; nombre: string }[]>([]);

  const formatFinanciadorName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const financiadoresFiltrados = financiadores.filter(financiador => {
    const matchesName = financiador.Financiador.toLowerCase().includes(filtro.toLowerCase());
    const matchesState = filtroEstado === 'todos' || 
                        (filtroEstado === 'activo' && financiador.activo === 1) ||
                        (filtroEstado === 'inactivo' && financiador.activo === 0);
    return matchesName && matchesState;
  });

  useEffect(() => {
    cargarFinanciadores();
  }, []);

  useEffect(() => {
    // prefetch acuerdos so modal can show them quickly
    (async () => {
      try {
        const data = await api.get('/admin/prestadores/acuerdos');
        setAcuerdos(data.data);
      } catch (err) {
        // not critical
      }
    })();
  }, []);

  const cargarFinanciadores = async () => {
    try {
      const response = await api.get('/admin/prestadores');
      setFinanciadores(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar financiadores',
        color: 'red'
      });
    }
  };

  const toggleActivo = async (financiador: Financiador) => {
    const nuevoEstado = financiador.activo === 1 ? 0 : 1;
    
    try {
      await api.put(`/admin/prestadores/${financiador.idobra_social}`, {
        activo: nuevoEstado,
        tasa_mensual: financiador.tasa_mensual || 0,
        dias_cobranza_teorico: financiador.dias_cobranza_teorico || 0,
        dias_cobranza_real: financiador.dias_cobranza_real || 0,
        id_acuerdo: financiador.id_acuerdo ?? null
      });
      
      notifications.show({
        title: 'Éxito',
        message: `Financiador ${nuevoEstado === 1 ? 'activado' : 'desactivado'} correctamente`,
        color: 'green'
      });
      
      cargarFinanciadores();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar financiador',
        color: 'red'
      });
    }
  };

  const handleEdit = (financiador: Financiador) => {
    setEditingFinanciador({
      ...financiador,
      tasa_mensual: financiador.tasa_mensual || 0,
      dias_cobranza_teorico: financiador.dias_cobranza_teorico || 0,
      dias_cobranza_real: financiador.dias_cobranza_real || 0
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!editingFinanciador) return;

    setLoading(true);
    try {
      await api.put(`/admin/prestadores/${editingFinanciador.idobra_social}`, {
        activo: editingFinanciador.activo,
        tasa_mensual: editingFinanciador.tasa_mensual || 0,
        dias_cobranza_teorico: editingFinanciador.dias_cobranza_teorico || 0,
        dias_cobranza_real: editingFinanciador.dias_cobranza_real || 0,
        id_acuerdo: editingFinanciador.id_acuerdo ?? null
      });
      
      notifications.show({
        title: 'Éxito',
        message: 'Financiador actualizado correctamente',
        color: 'green'
      });
      
      setModalOpen(false);
      setEditingFinanciador(null);
      cargarFinanciadores();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar financiador',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Group>
        <TextInput
          placeholder="Buscar financiadores..."
          leftSection={<MagnifyingGlassIcon style={{ width: 16, height: 16 }} />}
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          rightSection={
            filtro ? (
              <ActionIcon variant="subtle" onClick={() => setFiltro('')}>
                <XMarkIcon style={{ width: 16, height: 16 }} />
              </ActionIcon>
            ) : null
          }
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Filtrar por estado"
          value={filtroEstado}
          onChange={(value) => setFiltroEstado(value || 'todos')}
          data={[
            { value: 'todos', label: 'Todos' },
            { value: 'activo', label: 'Activos' },
            { value: 'inactivo', label: 'Inactivos' }
          ]}
          style={{ width: 200 }}
        />
      </Group>

      <AdminTable isEmpty={financiadoresFiltrados.length === 0} emptyMessage="No se encontraron financiadores" minWidth={1000}>
        <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
          <Table.Tr>
            <Table.Th>Financiador</Table.Th>
            <Table.Th style={{ width: '180px'}}>Estado</Table.Th>
            <Table.Th style={{ width: '120px' }}>Tasa Mensual</Table.Th>
            <Table.Th style={{ width: '140px' }}>Días Teórico</Table.Th>
            <Table.Th style={{ width: '120px' }}>Días Real</Table.Th>
            <Table.Th style={{ width: '240px' }}>Acuerdo</Table.Th>
            <Table.Th style={{ width: '100px' }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {financiadoresFiltrados.map((financiador) => (
            <Table.Tr key={financiador.idobra_social}>
              <Table.Td>{formatFinanciadorName(financiador.Financiador)}</Table.Td>
              <Table.Td>
                <Group gap="sm" align="center">
                  <Switch
                    checked={financiador.activo === 1}
                    onChange={() => toggleActivo(financiador)}
                    size="sm"
                  />
                  <Text size="sm" c={financiador.activo === 1 ? 'green' : 'gray'}>
                    {financiador.activo === 1 ? 'Activo' : 'Inactivo'}
                  </Text>
                </Group>
              </Table.Td>
              <Table.Td>{(financiador.tasa_mensual || 0)}%</Table.Td>
              <Table.Td>{(financiador.dias_cobranza_teorico || 0)} días</Table.Td>
              <Table.Td>{(financiador.dias_cobranza_real || 0)} días</Table.Td>
              <Table.Td>{financiador.acuerdo_nombre || 'SIN CONVENIO'}</Table.Td>
              <Table.Td>
                <ActionIcon variant="transparent" onClick={() => handleEdit(financiador)}>
                  <PencilSquareIcon width={20} height={20} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </AdminTable>

      {/* Modal Editar */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Editar Financiador: ${editingFinanciador ? formatFinanciadorName(editingFinanciador.Financiador) : ''}`}
        size="md"
      >
        {editingFinanciador && (
          <Stack gap="md">
            <TextInput
              label="Tasa Mensual (%)"
              type="number"
              value={editingFinanciador.tasa_mensual.toString()}
              onChange={(e) => setEditingFinanciador({
                ...editingFinanciador,
                tasa_mensual: parseFloat(e.target.value) || 0
              })}
              min={0}
              step={0.1}
            />
            <TextInput
              label="Días Cobranza Teórico"
              type="number"
              value={editingFinanciador.dias_cobranza_teorico.toString()}
              onChange={(e) => setEditingFinanciador({
                ...editingFinanciador,
                dias_cobranza_teorico: parseInt(e.target.value) || 0
              })}
              min={0}
            />
            <TextInput
              label="Días Cobranza Real"
              type="number"
              value={editingFinanciador.dias_cobranza_real.toString()}
              onChange={(e) => setEditingFinanciador({
                ...editingFinanciador,
                dias_cobranza_real: parseInt(e.target.value) || 0
              })}
              min={0}
            />
            <Select
              label="Acuerdo"
              placeholder="Seleccione un acuerdo (opcional)"
              data={acuerdos.map(a => ({ value: String(a.id_acuerdo), label: a.nombre }))}
              value={editingFinanciador.id_acuerdo ? String(editingFinanciador.id_acuerdo) : null}
              onChange={(val) => setEditingFinanciador({
                ...editingFinanciador,
                id_acuerdo: val ? parseInt(val) : null
              })}
            />
            <Group style={{ justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} loading={loading}>
                Guardar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}
