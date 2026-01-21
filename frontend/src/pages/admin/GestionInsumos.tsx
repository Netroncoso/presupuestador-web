import React, { useState, useEffect } from 'react';
import { TextInput, Button, Table, Checkbox, Group, Stack, Modal, NumberInput, ActionIcon, Text } from '@mantine/core';
import { PencilSquareIcon, TrashIcon, PlusIcon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';
import AdminTable from '../../components/AdminTable';
import { numberFormat } from '../../utils/numberFormat';
import { CurrencyInput } from '../../components/CurrencyInput';

interface Insumo {
  idInsumos: number;
  producto: string;
  costo: number;
  codigo_producto?: string;
  critico?: number;
}

export default function GestionInsumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [filtro, setFiltro] = useState('');
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
  const [deletingInsumo, setDeletingInsumo] = useState<Insumo | null>(null);
  const [formData, setFormData] = useState({ producto: '', costo: 0, codigo_producto: '' });
  const [loading, setLoading] = useState(false);

  const formatProductName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const insumosFiltrados = insumos.filter(insumo =>
    insumo.producto.toLowerCase().includes(filtro.toLowerCase()) ||
    (insumo.codigo_producto && insumo.codigo_producto.toLowerCase().includes(filtro.toLowerCase()))
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
      setFormData({ producto: '', costo: 0, codigo_producto: '' });
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
    setFormData({ producto: insumo.producto, costo: insumo.costo, codigo_producto: insumo.codigo_producto || '' });
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

  const handleToggleCritico = async (id: number, critico: boolean) => {
    try {
      await api.patch(`/admin/insumos/${id}/critico`, { critico });
      
      notifications.show({
        title: 'Actualizado',
        message: `Insumo ${critico ? 'marcado' : 'desmarcado'} como crítico`,
        color: 'green',
        position: 'top-center',
      });

      cargarInsumos();
    } catch (error) {
      console.error('Error al actualizar insumo crítico:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo actualizar el insumo',
        color: 'red',
        position: 'top-center',
      });
    }
  };

  const openNewModal = () => {
    setEditingInsumo(null);
    setFormData({ producto: '', costo: 0, codigo_producto: '' });
    setModalOpen(true);
  };

  return (
    <Stack gap="md">
      <Group style={{ justifyContent: 'space-between' }}>
        <TextInput
          placeholder="Buscar por nombre o código..."
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
            <Table.Th style={{ width: '150px' }}>Código</Table.Th>
            <Table.Th style={{ width: '120px' }}>Costo</Table.Th>
            <Table.Th style={{ width: '80px' }}>Crítico</Table.Th>
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
              <Table.Td>
                <Text size="sm" c={insumo.codigo_producto ? 'dark' : 'dimmed'}>
                  {insumo.codigo_producto || '-'}
                </Text>
              </Table.Td>
              <Table.Td>{numberFormat.formatCurrency(insumo.costo)}</Table.Td>
              <Table.Td>
                <Checkbox
                  checked={insumo.critico === 1}
                  onChange={(e) => handleToggleCritico(insumo.idInsumos, e.currentTarget.checked)}
                  color="red"
                />
              </Table.Td>
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
          <TextInput
            label="Código de Producto (EAN/SKU)"
            value={formData.codigo_producto}
            onChange={(e) => setFormData({ ...formData, codigo_producto: e.target.value })}
            placeholder="Opcional"
          />
          <CurrencyInput
            label="Costo"
            value={formData.costo}
            onChange={(value) => setFormData({ ...formData, costo: Number(value) || 0 })}
            min={0}
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
