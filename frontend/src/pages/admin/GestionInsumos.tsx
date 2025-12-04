import React, { useState, useEffect } from 'react';
import { TextInput, Button, Table, Checkbox, Group, Stack, Modal, NumberInput, ActionIcon, Text } from '@mantine/core';
import { PencilSquareIcon, TrashIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';
import AdminTable from '../../components/AdminTable';

interface Insumo {
  idInsumos: number;
  producto: string;
  costo: number;
}

export default function GestionInsumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [filtro, setFiltro] = useState('');
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [deletingInsumo, setDeletingInsumo] = useState<Insumo | null>(null);
  const [formData, setFormData] = useState({ producto: '', costo: 0 });
  const [loading, setLoading] = useState(false);

  const formatProductName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const insumosFiltrados = insumos.filter(insumo =>
    insumo.producto.toLowerCase().includes(filtro.toLowerCase())
  );

  useEffect(() => {
    cargarInsumos();
  }, []);

  const cargarInsumos = async () => {
    try {
      const response = await api.get('/admin/insumos');
      setInsumos(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar insumos',
        color: 'red'
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.producto || formData.costo <= 0) {
      notifications.show({
        title: 'Error',
        message: 'Complete todos los campos correctamente',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      if (editingInsumo) {
        await api.put(`/admin/insumos/${editingInsumo.idInsumos}`, formData);
        notifications.show({
          title: 'Éxito',
          message: 'Insumo actualizado correctamente',
          color: 'green'
        });
      } else {
        await api.post('/admin/insumos', formData);
        notifications.show({
          title: 'Éxito',
          message: 'Insumo creado correctamente',
          color: 'green'
        });
      }
      
      setModalOpen(false);
      setEditingInsumo(null);
      setFormData({ producto: '', costo: 0 });
      cargarInsumos();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Error al guardar insumo',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setFormData({ producto: insumo.producto, costo: insumo.costo });
    setModalOpen(true);
  };

  const openDeleteModal = (insumo: Insumo) => {
    setDeletingInsumo(insumo);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingInsumo) return;

    setLoading(true);
    try {
      await api.delete(`/admin/insumos/${deletingInsumo.idInsumos}`);
      notifications.show({
        title: 'Éxito',
        message: 'Insumo eliminado correctamente',
        color: 'green'
      });
      setDeleteModalOpen(false);
      setDeletingInsumo(null);
      cargarInsumos();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar insumo',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingInsumo(null);
    setFormData({ producto: '', costo: 0 });
    setModalOpen(true);
  };

  return (
    <Stack gap="md">
      <Group style={{ justifyContent: 'space-between' }}>
        <TextInput
          placeholder="Buscar insumos..."
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
        <Button leftSection={<PlusIcon width={16} height={16} />} onClick={openNewModal}>
          Nuevo Insumo
        </Button>
      </Group>

      <AdminTable isEmpty={insumosFiltrados.length === 0} emptyMessage="No se encontraron insumos" minWidth={600}>
        <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
          <Table.Tr>
            <Table.Th style={{ width: '50px' }}>Sel.</Table.Th>
            <Table.Th>Producto</Table.Th>
            <Table.Th style={{ width: '120px' }}>Costo</Table.Th>
            <Table.Th style={{ width: '120px' }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {insumosFiltrados.map((insumo) => (
            <Table.Tr key={insumo.idInsumos}>
              <Table.Td>
                <Checkbox
                  checked={selectedInsumo?.idInsumos === insumo.idInsumos}
                  onChange={(e) => setSelectedInsumo(e.target.checked ? insumo : null)}
                />
              </Table.Td>
              <Table.Td>{formatProductName(insumo.producto)}</Table.Td>
              <Table.Td>$ {Number(insumo.costo).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Table.Td>
              <Table.Td>
                <Group gap="xs">
                  <ActionIcon variant="transparent" onClick={() => handleEdit(insumo)}>
                    <PencilSquareIcon width={20} height={20} />
                  </ActionIcon>
                  <ActionIcon variant="transparent" color="red" onClick={() => openDeleteModal(insumo)}>
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
        title={editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}
      >
        <Stack gap="md">
          <TextInput
            label="Producto"
            value={formData.producto}
            onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
            required
          />
          <NumberInput
            label="Costo"
            value={formData.costo}
            onChange={(value) => setFormData({ ...formData, costo: Number(value) || 0 })}
            min={0}
            step={0.01}
            prefix="$ "
            thousandSeparator="."
            decimalSeparator=","
            decimalScale={2}
            required
            hideControls
          />
          <Group style={{ justifyContent: 'flex-end' }}>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {editingInsumo ? 'Actualizar' : 'Crear'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Modal Eliminar */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Eliminar Insumo"
        size="md"
      >
        <Stack gap="md">
          <Text>
            Está seguro que desea eliminar el insumo <br /><strong>"{formatProductName(deletingInsumo?.producto || '')}"</strong>
          </Text>

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
