import React, { useState, useEffect } from 'react';
import { TextInput, Button, Table, Group, Stack, Modal, ActionIcon, Select, NumberInput, Text, Switch, Tooltip } from '@mantine/core';
import { PencilSquareIcon, TrashIcon, PlusIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';
import AdminTable from '../../components/AdminTable';

interface Equipamiento {
  id: number;
  nombre: string;
  tipo: string;
  precio_referencia: number;
  activo: number;
}

interface TipoEquipamiento {
  id: number;
  nombre: string;
  descripcion: string;
  activo: number;
}

export default function GestionEquipamientosBase() {
  const [equipamientos, setEquipamientos] = useState<Equipamiento[]>([]);
  const [tipos, setTipos] = useState<TipoEquipamiento[]>([]);
  const [filtro, setFiltro] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editando, setEditando] = useState<Equipamiento | null>(null);
  const [eliminando, setEliminando] = useState<Equipamiento | null>(null);
  const [formData, setFormData] = useState({ 
    nombre: '', 
    tipo_equipamiento_id: '',
    precio_referencia: 0,
    activo: 1
  });
  const [loading, setLoading] = useState(false);
  const [tiposModalOpen, setTiposModalOpen] = useState(false);
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: '', descripcion: '' });

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const formatPeso = (value: number): string => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  const equipamientosFiltrados = equipamientos.filter(e =>
    e.nombre.toLowerCase().includes(filtro.toLowerCase())
  );

  useEffect(() => {
    cargarEquipamientos();
    cargarTipos();
  }, []);

  const cargarEquipamientos = async () => {
    try {
      const response = await api.get('/equipamientos/admin');
      setEquipamientos(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar equipamientos',
        color: 'red'
      });
    }
  };

  const cargarTipos = async () => {
    try {
      const { data } = await api.get('/equipamientos/tipos');
      setTipos(data);
    } catch (error) {
      console.error('Error cargando tipos:', error);
    }
  };

  const handleSubmit = async () => {
    if (!formData.nombre || !formData.tipo_equipamiento_id || formData.precio_referencia <= 0) {
      notifications.show({
        title: 'Error',
        message: 'Complete todos los campos',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      if (editando) {
        await api.put(`/equipamientos/admin/${editando.id}`, formData);
        notifications.show({
          title: 'Éxito',
          message: 'Equipamiento actualizado',
          color: 'green'
        });
      } else {
        await api.post('/equipamientos/admin', formData);
        notifications.show({
          title: 'Éxito',
          message: 'Equipamiento creado',
          color: 'green'
        });
      }
      
      setModalOpen(false);
      setEditando(null);
      setFormData({ nombre: '', tipo_equipamiento_id: '', precio_referencia: 0, activo: 1 });
      cargarEquipamientos();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al guardar',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (equipo: Equipamiento) => {
    setEditando(equipo);
    setFormData({ 
      nombre: equipo.nombre,
      tipo_equipamiento_id: equipo.tipo,
      precio_referencia: equipo.precio_referencia,
      activo: equipo.activo
    });
    setModalOpen(true);
  };

  const openDeleteModal = (equipo: Equipamiento) => {
    setEliminando(equipo);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!eliminando) return;

    setLoading(true);
    try {
      await api.delete(`/equipamientos/admin/${eliminando.id}`);
      notifications.show({
        title: 'Éxito',
        message: 'Equipamiento eliminado',
        color: 'green'
      });
      setDeleteModalOpen(false);
      setEliminando(null);
      cargarEquipamientos();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditando(null);
    setFormData({ nombre: '', tipo_equipamiento_id: '', precio_referencia: 0, activo: 1 });
    setModalOpen(true);
  };

  return (
    <Stack gap="md">
      <Group style={{ justifyContent: 'space-between' }}>
        <TextInput
          placeholder="Buscar equipamientos..."
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
            Nuevo Equipamiento
          </Button>
        </Group>
      </Group>

      <AdminTable isEmpty={equipamientosFiltrados.length === 0} emptyMessage="No se encontraron equipamientos" minWidth={700}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Equipamiento</Table.Th>
            <Table.Th style={{ width: '120px' }}>Tipo</Table.Th>
            <Table.Th style={{ width: '140px' }}>
              <Tooltip label="Valores mensuales">
                <span style={{ cursor: 'help' }}>Precio Referencia</span>
              </Tooltip>
            </Table.Th>
            <Table.Th style={{ width: '100px' }}>Estado</Table.Th>
            <Table.Th style={{ width: '120px' }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {equipamientosFiltrados.map((equipo) => (
            <Table.Tr key={equipo.id}>
              <Table.Td>{equipo.nombre}</Table.Td>
              <Table.Td style={{ textTransform: 'capitalize' }}>{equipo.tipo}</Table.Td>
              <Table.Td>{formatPeso(equipo.precio_referencia)}</Table.Td>
              <Table.Td>
                <Text size="sm" c={equipo.activo === 1 ? 'green' : 'gray'}>
                  {equipo.activo === 1 ? 'Activo' : 'Inactivo'}
                </Text>
              </Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon variant="transparent" onClick={() => handleEdit(equipo)}>
                    <PencilSquareIcon width={20} height={20} />
                  </ActionIcon>
                  <ActionIcon variant="transparent" color="red" onClick={() => openDeleteModal(equipo)}>
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
        title={editando ? 'Editar Equipamiento' : 'Nuevo Equipamiento'}
      >
        <Stack gap="md">
          <TextInput
            label="Nombre"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          <Select
            label="Tipo"
            value={formData.tipo_equipamiento_id}
            onChange={(value) => setFormData({ ...formData, tipo_equipamiento_id: value || '' })}
            data={tipos.filter(t => t.activo).map(t => ({ 
              value: t.id.toString(), 
              label: t.nombre.charAt(0).toUpperCase() + t.nombre.slice(1) 
            }))}
            required
          />
          <NumberInput
            label={
              <Tooltip label="Valor mensual">
                <span style={{ cursor: 'help' }}>Precio Referencia</span>
              </Tooltip>
            }
            value={formData.precio_referencia}
            onChange={(val) => setFormData({ ...formData, precio_referencia: Number(val) || 0 })}
            decimalScale={2}
            fixedDecimalScale
            thousandSeparator="."
            decimalSeparator=","
            prefix="$ "
            required
          />
          <Group justify="space-between">
            <Text size="sm" fw={500}>Estado</Text>
            <Switch
              checked={formData.activo === 1}
              onChange={(e) => setFormData({ ...formData, activo: e.currentTarget.checked ? 1 : 0 })}
              size="lg"
              onLabel="Activo"
              offLabel="Inactivo"
            />
          </Group>

          <Group style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editando ? 'Actualizar' : 'Crear'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Equipamiento"
        size="md"
      >
        <Stack gap="md">
          <p>
            ¿Está seguro que desea eliminar <strong>"{eliminando?.nombre}"</strong>?
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
          cargarTipos();
        }}
        title="Gestionar Tipos de Equipamiento"
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
              {tipos.map((tipo) => (
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
                placeholder="Nombre (ej: oxigenoterapia)"
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
                    await api.post('/equipamientos/tipos', nuevoTipo);
                    notifications.show({
                      title: 'Éxito',
                      message: 'Tipo creado correctamente',
                      color: 'green'
                    });
                    setNuevoTipo({ nombre: '', descripcion: '' });
                    cargarTipos();
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
