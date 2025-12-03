import React, { useState, useEffect } from 'react';
import { TextInput, Button, Table, Group, Stack, Modal, ActionIcon, Select, NumberInput, Text } from '@mantine/core';
import { PencilSquareIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
  const [tiposUnidad, setTiposUnidad] = useState<any[]>([]);
  const [filtro, setFiltro] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
  const [deletingServicio, setDeletingServicio] = useState<Servicio | null>(null);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    tipo_unidad: ''
  });
  const [loading, setLoading] = useState(false);
  const [tiposModalOpen, setTiposModalOpen] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: '', descripcion: '' });

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const serviciosFiltrados = servicios.filter(servicio =>
    servicio.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  useEffect(() => {
    cargarServicios();
    cargarTiposUnidad();
  }, []);

  const cargarTiposUnidad = async () => {
    try {
      const { data } = await api.get('/tipos-unidad');
      setTiposUnidad(data);
    } catch (error) {
      console.error('Error cargando tipos de unidad:', error);
    }
  };

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
      tipo_unidad: servicio.tipo_unidad || ''
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
      tipo_unidad: ''
    });
    setModalOpen(true);
  };

  return (
    <Stack gap="md">
      <Group style={{ justifyContent: 'space-between' }}>
        <TextInput
          placeholder="Buscar servicios..."
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
        <Group gap="xs">
          <Button variant="outline" onClick={() => setTiposModalOpen(true)}>
            Gestionar Tipos
          </Button>
          <Button leftSection={<PlusIcon width={16} height={16} />} onClick={openNewModal}>
            Nuevo Servicio
          </Button>
        </Group>
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
              <Table.Td style={{ textTransform: 'capitalize' }}>{servicio.tipo_unidad || '-'}</Table.Td>
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
            onChange={(value) => setFormData({ ...formData, tipo_unidad: value || '' })}
            data={tiposUnidad.map(t => ({ 
              value: t.nombre, 
              label: t.nombre.charAt(0).toUpperCase() + t.nombre.slice(1) 
            }))}
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

      {/* Modal Gestionar Tipos */}
      <Modal
        opened={tiposModalOpen}
        onClose={() => {
          setTiposModalOpen(false);
          setNuevoTipo({ nombre: '', descripcion: '' });
          cargarTiposUnidad();
        }}
        title="Gestionar Tipos de Unidad"
        size="lg"
      >
        <Stack gap="md">
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
              <Table.Tr>
                <Table.Th>Tipo</Table.Th>
                <Table.Th>Descripción</Table.Th>
                <Table.Th style={{ width: '80px' }}>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tiposUnidad.map((tipo) => (
                <Table.Tr key={tipo.id}>
                  <Table.Td style={{ textTransform: 'capitalize', fontWeight: 500 }}>{tipo.nombre}</Table.Td>
                  <Table.Td>{tipo.descripcion}</Table.Td>
                  <Table.Td>
                    <Text size="sm" c={tipo.activo ? 'green' : 'gray'}>
                      {tipo.activo ? 'Activo' : 'Inactivo'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Stack gap="sm" style={{ borderTop: '1px solid #dee2e6', paddingTop: '1rem' }}>
            <Text size="sm" fw={500}>Agregar Nuevo Tipo</Text>
            <Group grow>
              <TextInput
                placeholder="Nombre (ej: turnos)"
                value={nuevoTipo.nombre}
                onChange={(e) => setNuevoTipo({ ...nuevoTipo, nombre: e.target.value.toLowerCase() })}
              />
              <TextInput
                placeholder="Descripción"
                value={nuevoTipo.descripcion}
                onChange={(e) => setNuevoTipo({ ...nuevoTipo, descripcion: e.target.value })}
              />
            </Group>
            <Group justify="flex-end">
              <Button
                onClick={async () => {
                  if (!nuevoTipo.nombre) {
                    notifications.show({
                      title: 'Error',
                      message: 'El nombre es requerido',
                      color: 'red'
                    });
                    return;
                  }
                  try {
                    await api.post('/tipos-unidad', nuevoTipo);
                    notifications.show({
                      title: 'Éxito',
                      message: 'Tipo de unidad creado correctamente',
                      color: 'green'
                    });
                    setNuevoTipo({ nombre: '', descripcion: '' });
                    cargarTiposUnidad();
                  } catch (error: any) {
                    notifications.show({
                      title: 'Error',
                      message: error.message || 'Error al crear tipo',
                      color: 'red'
                    });
                  }
                }}
                loading={loading}
              >
                Agregar Tipo
              </Button>
            </Group>
          </Stack>

          <Group justify="flex-end" style={{ borderTop: '1px solid #dee2e6', paddingTop: '1rem' }}>
            <Button variant="outline" onClick={() => setTiposModalOpen(false)}>
              Cerrar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
