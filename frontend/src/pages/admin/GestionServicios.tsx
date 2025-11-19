import React, { useState, useEffect } from 'react';
import { TextInput, Button, Table, Group, Stack, Modal, ActionIcon, Select, NumberInput } from '@mantine/core';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';
import AdminTable from '../../components/AdminTable';

interface Servicio {
  id_servicio: string;
  nombre: string;
  tipo_unidad?: string;
}

export default function GestionServicios() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [filtro, setFiltro] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [deletingServicio, setDeletingServicio] = useState<Servicio | null>(null);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    tipo_unidad: 'horas'
  });
  const [loading, setLoading] = useState(false);

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const serviciosFiltrados = servicios.filter(servicio =>
    servicio.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      const response = await api.get('/admin/servicios-crud');
      setServicios(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar servicios',
        color: 'red'
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.nombre) {
      notifications.show({
        title: 'Error',
        message: 'Complete el nombre del servicio',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      if (editingServicio) {
        await api.put(`/admin/servicios-crud/${editingServicio.id_servicio}`, formData);
        notifications.show({
          title: 'Éxito',
          message: 'Servicio actualizado correctamente',
          color: 'green'
        });
      } else {
        await api.post('/admin/servicios-crud', formData);
        notifications.show({
          title: 'Éxito',
          message: 'Servicio creado correctamente',
          color: 'green'
        });
      }
      
      setModalOpen(false);
      setEditingServicio(null);
      setFormData({ nombre: '' });
      cargarServicios();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al guardar servicio',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (servicio: Servicio) => {
    setEditingServicio(servicio);
    setFormData({ 
      nombre: servicio.nombre,
      tipo_unidad: servicio.tipo_unidad || 'horas'
    });
    setModalOpen(true);
  };

  const openDeleteModal = (servicio: Servicio) => {
    setDeletingServicio(servicio);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingServicio) return;

    setLoading(true);
    try {
      await api.delete(`/admin/servicios-crud/${deletingServicio.id_servicio}`);
      notifications.show({
        title: 'Éxito',
        message: 'Servicio eliminado correctamente',
        color: 'green'
      });
      setDeleteModalOpen(false);
      setDeletingServicio(null);
      cargarServicios();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar servicio',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingServicio(null);
    setFormData({ 
      nombre: '', 
      tipo_unidad: 'horas'
    });
    setModalOpen(true);
  };

  return (
    <Stack gap="md">
      <Group style={{ justifyContent: 'space-between' }}>
        <TextInput
          placeholder="Buscar servicios..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button leftSection={<PlusIcon width={16} height={16} />} onClick={openNewModal}>
          Nuevo Servicio
        </Button>
      </Group>

      <AdminTable isEmpty={serviciosFiltrados.length === 0} emptyMessage="No se encontraron servicios">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Servicio</Table.Th>
            <Table.Th style={{ width: '120px' }}>Tipo Unidad</Table.Th>
            <Table.Th style={{ width: '120px' }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {serviciosFiltrados.map((servicio) => (
            <Table.Tr key={servicio.id_servicio}>
              <Table.Td>{formatName(servicio.nombre)}</Table.Td>
              <Table.Td style={{ textTransform: 'capitalize' }}>{servicio.tipo_unidad || 'horas'}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon variant="transparent" onClick={() => handleEdit(servicio)}>
                    <PencilSquareIcon width={20} height={20} />
                  </ActionIcon>
                  <ActionIcon variant="transparent" color="red" onClick={() => openDeleteModal(servicio)}>
                    <TrashIcon width={20} height={20} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </AdminTable>

      {/* Modal Crear/Editar */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
      >
        <Stack gap="md">
          <TextInput
            label="Nombre del Servicio"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          <Select
            label="Tipo de Unidad"
            value={formData.tipo_unidad}
            onChange={(value) => setFormData({ ...formData, tipo_unidad: value || 'horas' })}
            data={[
              { value: 'horas', label: 'Horas' },
              { value: 'sesiones', label: 'Sesiones' },
              { value: 'consultas', label: 'Consultas' },
              { value: 'días', label: 'Días' },
              { value: 'unidades', label: 'Unidades' }
            ]}
            required
          />

          <Group style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingServicio ? 'Actualizar' : 'Crear'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Servicio"
        size="md"
      >
        <Stack gap="md">
          <p>
            ¿Está seguro que desea eliminar el servicio <strong>"{formatName(deletingServicio?.nombre || '')}"</strong>?
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Esta acción no se puede deshacer.
          </p>
          <Group style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button color="red" onClick={confirmDelete} loading={loading}>
              Confirmar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
