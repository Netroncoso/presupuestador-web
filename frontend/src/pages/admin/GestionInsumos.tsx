import React, { useState, useEffect } from 'react';
import { Paper, TextInput, Button, Table, Checkbox, Group, Stack, Modal, NumberInput, ActionIcon, Text } from '@mantine/core';
import { PencilSquareIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';

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
    <Stack spacing="md">
      <Group style={{ justifyContent: 'space-between' }}>
        <TextInput
          placeholder="Buscar insumos..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button leftIcon={<PlusIcon width={16} height={16} />} onClick={openNewModal}>
          Nuevo Insumo
        </Button>
      </Group>

      <Paper p="md" withBorder>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th style={{ width: '50px' }}>Sel.</th>
              <th>Producto</th>
              <th style={{ width: '120px' }}>Costo</th>
              <th style={{ width: '120px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {insumosFiltrados.map((insumo) => (
              <tr key={insumo.idInsumos}>
                <td>
                  <Checkbox
                    checked={selectedInsumo?.idInsumos === insumo.idInsumos}
                    onChange={(e) => setSelectedInsumo(e.target.checked ? insumo : null)}
                  />
                </td>
                <td>{formatProductName(insumo.producto)}</td>
                <td>${insumo.costo.toFixed(2)}</td>
                <td>
                  <Group spacing="xs">
                    <ActionIcon variant="light" onClick={() => handleEdit(insumo)}>
                      <PencilSquareIcon width={16} height={16} />
                    </ActionIcon>
                    <ActionIcon variant="light" color="red" onClick={() => openDeleteModal(insumo)}>
                      <TrashIcon width={16} height={16} />
                    </ActionIcon>
                  </Group>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        
        {insumosFiltrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No se encontraron insumos
          </div>
        )}
      </Paper>

      {/* Modal Crear/Editar */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}
      >
        <Stack spacing="md">
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
            precision={2}
            required
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
        <Stack spacing="md">
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