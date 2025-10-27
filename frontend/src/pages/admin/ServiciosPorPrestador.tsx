import React, { useState, useEffect } from 'react';
import { Paper, Select, Table, Group, Stack, Modal, Switch, Badge, ActionIcon, Button, TextInput } from '@mantine/core';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
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
  costo: number | null;
  total_mes: number | null;
  condicion: string | null;
  activo: number | null;
  cant_total: number | null;
}

export default function ServiciosPorPrestador() {
  const [financiadores, setFinanciadores] = useState<Financiador[]>([]);
  const [financiadorSeleccionado, setFinanciadorSeleccionado] = useState<string>('');
  const [servicios, setServicios] = useState<ServicioPrestador[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioPrestador | null>(null);
  const [loading, setLoading] = useState(false);

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const formatNumber = (value: number | null | undefined): number => {
    return Number(value) || 0;
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
        costo: formatNumber(servicio.costo),
        total_mes: formatNumber(servicio.total_mes),
        condicion: servicio.condicion || '',
        activo: nuevoEstado,
        cant_total: formatNumber(servicio.cant_total)
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
      costo: formatNumber(servicio.costo),
      total_mes: formatNumber(servicio.total_mes),
      condicion: servicio.condicion || '',
      cant_total: formatNumber(servicio.cant_total)
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!editingServicio) return;

    setLoading(true);
    try {
      await api.put(`/admin/servicios/prestador/${financiadorSeleccionado}/servicio/${editingServicio.id_servicio}`, {
        costo: formatNumber(editingServicio.costo),
        total_mes: formatNumber(editingServicio.total_mes),
        condicion: editingServicio.condicion || '',
        activo: editingServicio.activo || 0,
        cant_total: formatNumber(editingServicio.cant_total)
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
    <Stack spacing="md">
      <Select
        label="Seleccionar Financiador"
        placeholder="Seleccione un financiador activo"
        value={financiadorSeleccionado}
        onChange={(value) => setFinanciadorSeleccionado(value || '')}
        data={financiadores.map(p => ({
          value: p.idobra_social,
          label: formatName(p.Financiador)
        }))}
        searchable
        clearable
      />

      {financiadorSeleccionado && (
        <Paper p="md" withBorder>
          <Table striped highlightOnHover>
            <thead>
              <tr>
                <th>Servicio</th>
                <th style={{ width: '150px' }}>Estado</th>
                <th style={{ width: '100px' }}>Costo</th>
                <th style={{ width: '100px' }}>Total/Mes</th>
                <th style={{ width: '120px' }}>Condición</th>
                <th style={{ width: '100px' }}>Cant. Total</th>
                <th style={{ width: '100px' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {servicios.map((servicio) => (
                <tr key={servicio.id_servicio}>
                  <td>{formatName(servicio.nombre)}</td>
                  <td>
                    <Group spacing="sm" align="center">
                      <Switch
                        checked={servicio.activo === 1}
                        onChange={() => toggleActivo(servicio)}
                        size="sm"
                      />
                      <Badge 
                        color={servicio.activo === 1 ? 'green' : 'gray'} 
                        variant="light"
                        size="sm"
                      >
                        {servicio.activo === 1 ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Group>
                  </td>
                  <td>${formatNumber(servicio.costo).toFixed(2)}</td>
                  <td>{formatNumber(servicio.total_mes)}</td>
                  <td>{servicio.condicion || '-'}</td>
                  <td>{formatNumber(servicio.cant_total)}</td>
                  <td>
                    <ActionIcon variant="light" onClick={() => handleEdit(servicio)}>
                      <PencilSquareIcon width={16} height={16} />
                    </ActionIcon>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
          
          {servicios.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No se encontraron servicios
            </div>
          )}
        </Paper>
      )}

      {/* Modal Editar */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Editar Servicio: ${editingServicio ? formatName(editingServicio.nombre) : ''}`}
        size="md"
      >
        {editingServicio && (
          <Stack spacing="md">
            <TextInput
              label="Costo"
              type="number"
              value={formatNumber(editingServicio.costo).toString()}
              onChange={(e) => setEditingServicio({
                ...editingServicio,
                costo: parseFloat(e.target.value) || 0
              })}
              min={0}
              step={0.01}
            />
            <TextInput
              label="Total/Mes"
              type="number"
              value={formatNumber(editingServicio.total_mes).toString()}
              onChange={(e) => setEditingServicio({
                ...editingServicio,
                total_mes: parseInt(e.target.value) || 0
              })}
              min={0}
            />
            <TextInput
              label="Condición"
              value={editingServicio.condicion || ''}
              onChange={(e) => setEditingServicio({
                ...editingServicio,
                condicion: e.target.value
              })}
            />
            <TextInput
              label="Cantidad Total"
              type="number"
              value={formatNumber(editingServicio.cant_total).toString()}
              onChange={(e) => setEditingServicio({
                ...editingServicio,
                cant_total: parseInt(e.target.value) || 0
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