import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Stack, Group, NumberInput, Textarea, Select, Switch, Text, ActionIcon, Paper, Title, TextInput } from '@mantine/core';
import { PencilSquareIcon, PlusIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';
import AdminTable from '../../components/AdminTable';

interface AlertaServicio {
  id: number;
  tipo_unidad: string;
  cantidad_maxima: number;
  mensaje_alerta: string;
  color_alerta: string;
  activo: number;
}

export default function GestionAlertasServicios() {
  const [alertas, setAlertas] = useState<AlertaServicio[]>([]);
  const [tiposUnidad, setTiposUnidad] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAlerta, setEditingAlerta] = useState<AlertaServicio | null>(null);
  const [formData, setFormData] = useState({
    tipo_unidad: '',
    cantidad_maxima: 0,
    mensaje_alerta: '',
    color_alerta: 'orange',
    activo: 1
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarAlertas();
    cargarTiposUnidad();
  }, []);

  const cargarTiposUnidad = async () => {
    try {
      const { data } = await api.get('/tipos-unidad');
      setTiposUnidad(data);
    } catch (error: any) {
      console.error('Error cargando tipos de unidad:', error);
    }
  };

  const cargarAlertas = async () => {
    try {
      const { data } = await api.get('/alertas-servicios');
      setAlertas(data);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al cargar alertas',
        color: 'red'
      });
    }
  };

  const handleEdit = (alerta: AlertaServicio) => {
    setEditingAlerta(alerta);
    setFormData({
      tipo_unidad: alerta.tipo_unidad,
      cantidad_maxima: alerta.cantidad_maxima,
      mensaje_alerta: alerta.mensaje_alerta,
      color_alerta: alerta.color_alerta,
      activo: alerta.activo
    });
    cargarTiposUnidad();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.tipo_unidad || formData.cantidad_maxima <= 0) {
      notifications.show({
        title: 'Error',
        message: 'Complete todos los campos correctamente',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      if (editingAlerta) {
        await api.put(`/alertas-servicios/${editingAlerta.id}`, formData);
        notifications.show({
          title: 'Éxito',
          message: 'Alerta actualizada correctamente',
          color: 'green'
        });
      } else {
        await api.post('/alertas-servicios', formData);
        notifications.show({
          title: 'Éxito',
          message: 'Alerta creada correctamente',
          color: 'green'
        });
      }
      
      setModalOpen(false);
      setEditingAlerta(null);
      setFormData({ tipo_unidad: '', cantidad_maxima: 0, mensaje_alerta: '', color_alerta: 'orange', activo: 1 });
      cargarAlertas();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al guardar alerta',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingAlerta(null);
    setFormData({ tipo_unidad: '', cantidad_maxima: 0, mensaje_alerta: '', color_alerta: 'orange', activo: 1 });
    cargarTiposUnidad();
    setModalOpen(true);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={3}>Alertas por Tipo de Unidad</Title>
          <Text size="sm" c="dimmed">Configuración de alertas estándar por tipo de unidad (horas, sesiones, días, etc.)</Text>
        </div>
        <Button leftSection={<PlusIcon width={16} height={16} />} onClick={openNewModal}>
          Nueva Alerta
        </Button>
      </Group>

      <AdminTable isEmpty={alertas.length === 0} emptyMessage="No hay alertas configuradas" minWidth={900}>
        <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
          <Table.Tr>
            <Table.Th>Tipo de Unidad</Table.Th>
            <Table.Th style={{ width: '150px' }}>Cantidad Máxima</Table.Th>
            <Table.Th>Mensaje</Table.Th>
            <Table.Th style={{ width: '100px' }}>Color</Table.Th>
            <Table.Th style={{ width: '80px' }}>Estado</Table.Th>
            <Table.Th style={{ width: '80px' }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {alertas.map((alerta) => (
            <Table.Tr key={alerta.id}>
              <Table.Td style={{ textTransform: 'capitalize' }}>{alerta.tipo_unidad}</Table.Td>
              <Table.Td>{alerta.cantidad_maxima}</Table.Td>
              <Table.Td style={{ maxWidth: '400px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {alerta.mensaje_alerta}
              </Table.Td>
              <Table.Td  >
                <div style={{
                  marginLeft: '0px', 
                  width: '20px', 
                  height: '20px', 
                  backgroundColor: alerta.color_alerta, 
                  borderRadius: '100px',
                  border: 'none'
                }} />
              </Table.Td>
              <Table.Td>
                <Text size="sm" c={alerta.activo ? 'green' : 'gray'}>
                  {alerta.activo ? 'Activo' : 'Inactivo'}
                </Text>
              </Table.Td>
              <Table.Td>
                <ActionIcon variant="transparent" onClick={() => handleEdit(alerta)}>
                  <PencilSquareIcon width={20} height={20} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </AdminTable>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAlerta ? 'Editar Alerta' : 'Nueva Alerta'}
        size="lg"
      >
        <Stack gap="md">
          <Select
            label="Tipo de Unidad"
            value={formData.tipo_unidad}
            onChange={(value) => setFormData({ ...formData, tipo_unidad: value || '' })}
            data={tiposUnidad.map(t => ({ value: t.nombre, label: t.nombre.charAt(0).toUpperCase() + t.nombre.slice(1) }))}
            required
            disabled={!!editingAlerta}
            searchable
          />
          
          <NumberInput
            label="Cantidad Máxima"
            value={formData.cantidad_maxima}
            onChange={(value) => setFormData({ ...formData, cantidad_maxima: Number(value) || 0 })}
            min={0}
            step={1}
            required
          />

          <Textarea
            label="Mensaje de Alerta"
            value={formData.mensaje_alerta}
            onChange={(e) => setFormData({ ...formData, mensaje_alerta: e.target.value })}
            placeholder="Mensaje que se mostrará cuando se exceda la cantidad"
            minRows={3}
            required
          />

          <Select
            label="Color de Alerta"
            value={formData.color_alerta}
            onChange={(value) => setFormData({ ...formData, color_alerta: value || 'orange' })}
            data={[
              { value: 'orange', label: 'Naranja (Advertencia)' },
              { value: 'red', label: 'Rojo (Crítico)' },
              { value: 'yellow', label: 'Amarillo (Información)' }
            ]}
          />

          <Switch
            label="Alerta Activa"
            checked={formData.activo === 1}
            onChange={(e) => setFormData({ ...formData, activo: e.target.checked ? 1 : 0 })}
          />

          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingAlerta ? 'Actualizar' : 'Crear'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
