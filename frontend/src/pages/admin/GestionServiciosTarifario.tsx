import React, { useState, useEffect } from 'react';
import { Table, Button, Group, Switch, Modal, TextInput, Select, Text, ActionIcon } from '@mantine/core';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { api } from '../../api/api';
import { notifications } from '@mantine/notifications';

interface TipoUnidad {
  id: number;
  nombre: string;
}

interface ServicioTarifario {
  id: number;
  nombre: string;
  tipo_unidad: string;
  activo: boolean;
}

export default function GestionServiciosTarifario() {
  const [servicios, setServicios] = useState<ServicioTarifario[]>([]);
  const [tiposUnidad, setTiposUnidad] = useState<TipoUnidad[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [editando, setEditando] = useState<ServicioTarifario | null>(null);
  const [nombre, setNombre] = useState('');
  const [tipoUnidad, setTipoUnidad] = useState('');

  useEffect(() => {
    cargarServicios();
    cargarTiposUnidad();
  }, []);

  const cargarServicios = async () => {
    try {
      const response = await api.get('/tarifario/servicios');
      setServicios(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar servicios',
        color: 'red'
      });
    }
  };

  const cargarTiposUnidad = async () => {
    try {
      const response = await api.get('/tipos-unidad');
      setTiposUnidad(response.data);
    } catch (error) {
      console.error('Error al cargar tipos de unidad:', error);
    }
  };

  const abrirModal = (servicio?: ServicioTarifario) => {
    if (servicio) {
      setEditando(servicio);
      setNombre(servicio.nombre);
      setTipoUnidad(servicio.tipo_unidad);
    } else {
      setEditando(null);
      setNombre('');
      setTipoUnidad('');
    }
    setModalOpened(true);
  };

  const cerrarModal = () => {
    setModalOpened(false);
    setEditando(null);
    setNombre('');
    setTipoUnidad('');
  };

  const guardarServicio = async () => {
    try {
      if (editando) {
        await api.put(`/tarifario/servicios/${editando.id}`, {
          nombre,
          tipo_unidad: tipoUnidad
        });
        notifications.show({
          title: 'Éxito',
          message: 'Servicio actualizado',
          color: 'green'
        });
      } else {
        await api.post('/tarifario/servicios', {
          nombre,
          tipo_unidad: tipoUnidad
        });
        notifications.show({
          title: 'Éxito',
          message: 'Servicio creado',
          color: 'green'
        });
      }
      cerrarModal();
      cargarServicios();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar servicio',
        color: 'red'
      });
    }
  };

  const toggleActivo = async (id: number, activo: boolean) => {
    try {
      await api.patch(`/tarifario/servicios/${id}/activo`, { activo });
      cargarServicios();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cambiar estado',
        color: 'red'
      });
    }
  };

  return (
    <>
      <Group justify="space-between" mb="md">
        <Text fw={500}>Servicios del Tarifario</Text>
        <Button onClick={() => abrirModal()} size="sm" color="green">
          Agregar Servicio
        </Button>
      </Group>

      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Tipo de Unidad</Table.Th>
            <Table.Th>Activo</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {servicios.map((servicio) => (
            <Table.Tr key={servicio.id}>
              <Table.Td>{servicio.nombre}</Table.Td>
              <Table.Td>{servicio.tipo_unidad}</Table.Td>
              <Table.Td>
                <Switch
                  checked={servicio.activo}
                  onChange={(e) => toggleActivo(servicio.id, e.currentTarget.checked)}
                  color="green"
                  size="sm"
                />
              </Table.Td>
              <Table.Td>
                <ActionIcon
                  variant="transparent"
                  color="blue"
                  onClick={() => abrirModal(servicio)}
                >
                  <PencilSquareIcon style={{ width: 20, height: 20 }} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Modal
        opened={modalOpened}
        onClose={cerrarModal}
        title={editando ? 'Editar Servicio' : 'Agregar Servicio'}
      >
        <TextInput
          label="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.currentTarget.value)}
          required
          mb="md"
        />
        <Select
          label="Tipo de Unidad"
          value={tipoUnidad}
          onChange={(value) => setTipoUnidad(value || '')}
          data={tiposUnidad.map(t => ({ value: t.nombre, label: t.nombre }))}
          required
          mb="md"
        />
        <Group justify="flex-end">
          <Button variant="outline" onClick={cerrarModal}>
            Cancelar
          </Button>
          <Button onClick={guardarServicio} color="green">
            Guardar
          </Button>
        </Group>
      </Modal>
    </>
  );
}
