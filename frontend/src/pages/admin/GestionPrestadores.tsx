import React, { useState, useEffect } from 'react';
import { Paper, TextInput, Table, Group, Stack, Modal, Switch, Badge, ActionIcon, Button, Select } from '@mantine/core';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';

interface Financiador {
  idobra_social: string;
  Financiador: string;
  activo: number;
  tasa_mensual: number;
  dias_cobranza_teorico: number;
  dias_cobranza_real: number;
}

export default function GestionPrestadores() {
  const [financiadores, setFinanciadores] = useState<Financiador[]>([]);
  const [filtro, setFiltro] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFinanciador, setEditingFinanciador] = useState<Financiador | null>(null);
  const [loading, setLoading] = useState(false);

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
        dias_cobranza_real: financiador.dias_cobranza_real || 0
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
        dias_cobranza_real: editingFinanciador.dias_cobranza_real || 0
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
    <Stack spacing="md">
      <Group>
        <TextInput
          placeholder="Buscar financiadores..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
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

      <Paper p="md" withBorder>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>Financiador</th>
              <th style={{ width: '180px'}}>Estado</th>
              <th style={{ width: '120px' }}>Tasa Mensual</th>
              <th style={{ width: '140px' }}>Días Teórico</th>
              <th style={{ width: '120px' }}>Días Real</th>
              <th style={{ width: '100px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {financiadoresFiltrados.map((financiador) => (
              <tr key={financiador.idobra_social}>
                <td>{formatFinanciadorName(financiador.Financiador)}</td>
                <td>
                  <Group spacing="sm" align="center">
                    <Switch
                      checked={financiador.activo === 1}
                      onChange={() => toggleActivo(financiador)}
                      size="sm"
                    />
                    <Badge 
                      color={financiador.activo === 1 ? 'green' : 'red'} 
                      variant="dot"
                      size="md"
                    >
                      {financiador.activo === 1 ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </Group>
                </td>
                <td>{(financiador.tasa_mensual || 0)}%</td>
                <td>{(financiador.dias_cobranza_teorico || 0)} días</td>
                <td>{(financiador.dias_cobranza_real || 0)} días</td>
                <td>
                  <ActionIcon variant="light" onClick={() => handleEdit(financiador)}>
                    <PencilSquareIcon width={16} height={16} />
                  </ActionIcon>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        
        {financiadoresFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No se encontraron financiadores
          </div>
        )}
      </Paper>

      {/* Modal Editar */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Editar Financiador: ${editingFinanciador ? formatFinanciadorName(editingFinanciador.Financiador) : ''}`}
        size="md"
      >
        {editingFinanciador && (
          <Stack spacing="md">
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