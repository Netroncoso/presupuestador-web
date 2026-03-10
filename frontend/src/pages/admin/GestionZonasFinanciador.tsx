import React, { useState, useEffect } from 'react';
import { Paper, Table, Button, TextInput, Modal, Stack, Group, ActionIcon, Text, Checkbox } from '@mantine/core';
import { PlusIcon, PencilSquareIcon, TrashIcon, LinkIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';

interface Zona {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: number;
}

interface Props {
  financiadorId: string;
}

export default function GestionZonasFinanciador({ financiadorId }: Props) {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [todasZonas, setTodasZonas] = useState<Zona[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [asociarModalOpen, setAsociarModalOpen] = useState(false);
  const [editingZona, setEditingZona] = useState<Zona | null>(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '' });
  const [zonasSeleccionadas, setZonasSeleccionadas] = useState<number[]>([]);
  const [filtro, setFiltro] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarTodasZonas();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (asociarModalOpen) {
        cargarTodasZonas(1, true);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filtro, asociarModalOpen]);

  useEffect(() => {
    if (financiadorId) {
      cargarZonas();
    } else {
      setZonas([]);
    }
  }, [financiadorId]);

  const cargarTodasZonas = async (pageNum: number = 1, reset: boolean = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await api.get('/admin/financiador-zonas', {
        params: { page: pageNum, limit: 50, search: filtro }
      });
      
      const newData = response.data.data || response.data;
      const pagination = response.data.pagination;

      if (reset) {
        setTodasZonas(Array.isArray(newData) ? newData : []);
        setPage(1);
      } else {
        setTodasZonas(prev => [...prev, ...(Array.isArray(newData) ? newData : [])]);
        setPage(pageNum);
      }
      
      setHasMore(Array.isArray(newData) && newData.length > 0 && pagination && pagination.page < pagination.totalPages);
    } catch (error) {
      console.error('Error al cargar todas las zonas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      cargarTodasZonas(page + 1);
    }
  };

  const cargarZonas = async () => {
    try {
      const response = await api.get(`/financiador/${financiadorId}/zonas`);
      setZonas(response.data);
    } catch (error) {
      console.error('Error al cargar zonas:', error);
    }
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      notifications.show({
        title: 'Error',
        message: 'El nombre es requerido',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      if (editingZona) {
        await api.put(`/admin/financiador-zonas/${editingZona.id}`, formData);
        notifications.show({
          title: 'Éxito',
          message: 'Zona actualizada correctamente',
          color: 'green'
        });
      } else {
        const response = await api.post('/admin/financiador-zonas', formData);
        const nuevaZonaId = response.data.id;
        
        // Asignar la nueva zona al financiador
        await api.post(`/admin/financiadores/${financiadorId}/zonas`, {
          zonaIds: [nuevaZonaId]
        });
        
        notifications.show({
          title: 'Éxito',
          message: 'Zona creada y asignada correctamente',
          color: 'green'
        });
      }
      
      setModalOpen(false);
      setFormData({ nombre: '', descripcion: '' });
      setEditingZona(null);
      cargarZonas();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar zona',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (zona: Zona) => {
    setEditingZona(zona);
    setFormData({ nombre: zona.nombre, descripcion: zona.descripcion || '' });
    setModalOpen(true);
  };

  const handleDelete = async (zona: Zona) => {
    if (!confirm(`¿Eliminar zona "${zona.nombre}"?`)) return;
    
    try {
      await api.delete(`/admin/financiador-zonas/${zona.id}`);
      notifications.show({
        title: 'Éxito',
        message: 'Zona eliminada correctamente',
        color: 'green'
      });
      cargarZonas();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al eliminar zona',
        color: 'red'
      });
    }
  };

  const handleAsociarZonas = async () => {
    if (zonasSeleccionadas.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Seleccione al menos una zona',
        color: 'red'
      });
      return;
    }

    setLoading(true);
    try {
      await api.post(`/admin/financiadores/${financiadorId}/zonas`, {
        zonaIds: zonasSeleccionadas
      });
      
      notifications.show({
        title: 'Éxito',
        message: 'Zonas asociadas correctamente',
        color: 'green'
      });
      
      setAsociarModalOpen(false);
      setZonasSeleccionadas([]);
      setFiltro('');
      cargarZonas();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al asociar zonas',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleZona = (zonaId: number) => {
    setZonasSeleccionadas(prev => 
      prev.includes(zonaId) ? prev.filter(id => id !== zonaId) : [...prev, zonaId]
    );
  };

  if (!financiadorId) {
    return (
      <Text size="sm" c="dimmed" ta="center" py="xl">
        Seleccione un financiador para gestionar sus zonas
      </Text>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="lg" fw={600}>Zonas del Financiador</Text>
        <Group gap="xs">
          <Button
            leftSection={<LinkIcon style={{ width: 16, height: 16 }} />}
            variant="outline"
            onClick={() => setAsociarModalOpen(true)}
          >
            Asociar Zona Existente
          </Button>
          <Button
            leftSection={<PlusIcon style={{ width: 16, height: 16 }} />}
            onClick={() => {
              setEditingZona(null);
              setFormData({ nombre: '', descripcion: '' });
              setModalOpen(true);
            }}
          >
            Nueva Zona
          </Button>
        </Group>
      </Group>

      <Paper p="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Descripción</Table.Th>
              <Table.Th style={{ width: '100px' }}>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {zonas.map((zona) => (
              <Table.Tr key={zona.id}>
                <Table.Td>{zona.nombre}</Table.Td>
                <Table.Td>{zona.descripcion || '-'}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon variant="subtle" onClick={() => handleEdit(zona)}>
                      <PencilSquareIcon style={{ width: 16, height: 16 }} />
                    </ActionIcon>
                    <ActionIcon variant="subtle" color="red" onClick={() => handleDelete(zona)}>
                      <TrashIcon style={{ width: 16, height: 16 }} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        
        {zonas.length === 0 && (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No hay zonas configuradas para este financiador
          </Text>
        )}
      </Paper>

      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingZona ? 'Editar Zona' : 'Nueva Zona'}
      >
        <Stack gap="md">
          <TextInput
            label="Nombre"
            placeholder="Ej: Zona Norte"
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
            required
          />
          <TextInput
            label="Descripción"
            placeholder="Descripción opcional"
            value={formData.descripcion}
            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
          />
          <Group justify="flex-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} loading={loading}>
              {editingZona ? 'Actualizar' : 'Crear'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={asociarModalOpen}
        onClose={() => {
          setAsociarModalOpen(false);
          setZonasSeleccionadas([]);
          setFiltro('');
        }}
        title="Asociar Zonas Existentes"
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            placeholder="Buscar zonas..."
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
          />
          
          <Paper withBorder style={{ maxHeight: 400, overflow: 'auto' }}>
            <Table striped highlightOnHover>
              <Table.Thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                <Table.Tr>
                  <Table.Th style={{ width: 50 }}>Sel.</Table.Th>
                  <Table.Th>Nombre</Table.Th>
                  <Table.Th>Descripción</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {todasZonas
                  .filter(z => !zonas.find(zf => zf.id === z.id))
                  .map((zona, index) => {
                    const isLast = index === todasZonas.length - 1;
                    return (
                      <Table.Tr 
                        key={`${zona.id}-${index}`}
                        ref={isLast ? (node) => {
                          if (node && hasMore && !loading) {
                            const observer = new IntersectionObserver((entries) => {
                              if (entries[0].isIntersecting) {
                                loadMore();
                                observer.disconnect();
                              }
                            });
                            observer.observe(node);
                          }
                        } : null}
                      >
                        <Table.Td>
                          <Checkbox
                            checked={zonasSeleccionadas.includes(zona.id)}
                            onChange={() => toggleZona(zona.id)}
                          />
                        </Table.Td>
                        <Table.Td>{zona.nombre}</Table.Td>
                        <Table.Td>{zona.descripcion || '-'}</Table.Td>
                      </Table.Tr>
                    );
                  })}
                {loading && (
                  <Table.Tr>
                    <Table.Td colSpan={3} style={{ textAlign: 'center', padding: '20px' }}>
                      <Text size="sm" c="dimmed">Cargando más zonas...</Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
          
          <Group justify="space-between">
            <Text size="sm" c="dimmed">{zonasSeleccionadas.length} zona(s) seleccionada(s)</Text>
            <Group>
              <Button variant="outline" onClick={() => {
                setAsociarModalOpen(false);
                setZonasSeleccionadas([]);
                setFiltro('');
              }}>
                Cancelar
              </Button>
              <Button onClick={handleAsociarZonas} loading={loading}>
                Asociar
              </Button>
            </Group>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}