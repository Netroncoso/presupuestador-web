import React, { useState, useEffect } from 'react';
import { TextInput, Table, Group, Stack, Modal, ActionIcon, Button, Tooltip, Tabs, Checkbox, Text, Title } from '@mantine/core';
import { PencilSquareIcon, MagnifyingGlassIcon, XMarkIcon, PlusIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';
import AdminTable from '../../components/AdminTable';

interface Sucursal {
  ID: number;
  Sucursales_mh: string;
  suc_porcentaje_dificil_acceso: number;
  suc_porcentaje_insumos: number;
}

interface Zona {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: number;
  sucursales?: string;
  sucursales_principales?: string;
}

interface ZonaSucursal {
  id: number;
  nombre: string;
  es_zona_principal: number;
}

export default function GestionSucursales() {
  const [activeTab, setActiveTab] = useState<string | null>('sucursales');
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [filtroSucursales, setFiltroSucursales] = useState('');
  const [filtroZonas, setFiltroZonas] = useState('');
  const [filtroZonasModal, setFiltroZonasModal] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalZonaOpen, setModalZonaOpen] = useState(false);
  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [editingZona, setEditingZona] = useState<Zona | null>(null);
  const [selectedSucursal, setSelectedSucursal] = useState<Sucursal | null>(null);
  const [zonasDisponibles, setZonasDisponibles] = useState<Zona[]>([]);
  const [zonasAsignadas, setZonasAsignadas] = useState<ZonaSucursal[]>([]);
  const [loading, setLoading] = useState(false);

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const formatNumber = (value: number | null | undefined): number => {
    return Number(value) || 0;
  };

  const sucursalesFiltradas = sucursales.filter(sucursal =>
    sucursal.Sucursales_mh.toLowerCase().includes(filtroSucursales.toLowerCase())
  );

  const zonasFiltradas = zonas.filter(zona =>
    zona.nombre.toLowerCase().includes(filtroZonas.toLowerCase())
  );

  useEffect(() => {
    cargarSucursales();
    cargarZonas();
  }, []);

  const cargarSucursales = async () => {
    try {
      const response = await api.get('/admin/sucursales');
      setSucursales(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar sucursales',
        color: 'red'
      });
    }
  };

  const cargarZonas = async () => {
    try {
      const response = await api.get('/tarifario-zonas');
      setZonas(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar zonas',
        color: 'red'
      });
    }
  };

  const handleEdit = (sucursal: Sucursal) => {
    setEditingSucursal({
      ...sucursal,
      suc_porcentaje_dificil_acceso: formatNumber(sucursal.suc_porcentaje_dificil_acceso),
      suc_porcentaje_insumos: formatNumber(sucursal.suc_porcentaje_insumos)
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!editingSucursal) return;

    setLoading(true);
    try {
      await api.put(`/admin/sucursales/${editingSucursal.ID}`, {
        suc_porcentaje_dificil_acceso: formatNumber(editingSucursal.suc_porcentaje_dificil_acceso),
        suc_porcentaje_insumos: formatNumber(editingSucursal.suc_porcentaje_insumos)
      });
      
      notifications.show({
        title: 'Éxito',
        message: 'Sucursal actualizada correctamente',
        color: 'green'
      });
      
      setModalOpen(false);
      setEditingSucursal(null);
      cargarSucursales();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar sucursal',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaZona = () => {
    setEditingZona({ id: 0, nombre: '', descripcion: '', activo: 1 });
    setModalZonaOpen(true);
  };

  const handleEditarZona = (zona: Zona) => {
    setEditingZona(zona);
    setModalZonaOpen(true);
  };

  const handleSubmitZona = async () => {
    if (!editingZona) return;

    setLoading(true);
    try {
      if (editingZona.id === 0) {
        await api.post('/tarifario-zonas', editingZona);
        notifications.show({
          title: 'Éxito',
          message: 'Zona creada correctamente',
          color: 'green'
        });
      } else {
        await api.put(`/tarifario-zonas/${editingZona.id}`, editingZona);
        notifications.show({
          title: 'Éxito',
          message: 'Zona actualizada correctamente',
          color: 'green'
        });
      }
      
      setModalZonaOpen(false);
      setEditingZona(null);
      cargarZonas();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Error al guardar zona',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAsignarZonas = async (sucursal: Sucursal) => {
    setSelectedSucursal(sucursal);
    setFiltroZonasModal('');
    setLoading(true);
    try {
      const [zonasResp, asignadasResp] = await Promise.all([
        api.get('/tarifario-zonas'),
        api.get(`/sucursales/${sucursal.ID}/zonas`)
      ]);
      setZonasDisponibles(zonasResp.data.filter((z: Zona) => z.activo));
      setZonasAsignadas(asignadasResp.data);
      setModalAsignarOpen(true);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar zonas',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleZona = async (zonaId: number, asignada: boolean) => {
    if (!selectedSucursal) return;

    try {
      if (asignada) {
        await api.delete(`/sucursales/${selectedSucursal.ID}/zonas/${zonaId}`);
      } else {
        await api.post(`/sucursales/${selectedSucursal.ID}/zonas/${zonaId}`, { es_zona_principal: 0 });
      }
      
      const response = await api.get(`/sucursales/${selectedSucursal.ID}/zonas`);
      setZonasAsignadas(response.data);
      cargarZonas();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar zona',
        color: 'red'
      });
    }
  };

  const handleTogglePrincipal = async (zonaId: number) => {
    if (!selectedSucursal) return;

    try {
      await api.post(`/sucursales/${selectedSucursal.ID}/zonas/${zonaId}`, { es_zona_principal: 1 });
      const response = await api.get(`/sucursales/${selectedSucursal.ID}/zonas`);
      setZonasAsignadas(response.data);
      cargarZonas();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al marcar zona principal',
        color: 'red'
      });
    }
  };

  return (
    <Stack gap="md" >
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List grow>
          <Tabs.Tab value="sucursales">Sucursales</Tabs.Tab>
          <Tabs.Tab value="zonas">Zonas</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="sucursales" pt="md">
          <Stack gap="md">
            <TextInput
              placeholder="Buscar sucursales..."
              leftSection={<MagnifyingGlassIcon style={{ width: 16, height: 16 }} />}
              value={filtroSucursales}
              onChange={(e) => setFiltroSucursales(e.target.value)}
              rightSection={
                filtroSucursales ? (
                  <ActionIcon variant="subtle" onClick={() => setFiltroSucursales('')}>
                    <XMarkIcon style={{ width: 16, height: 16 }} />
                  </ActionIcon>
                ) : null
              }
            />

            <AdminTable isEmpty={sucursalesFiltradas.length === 0} emptyMessage="No se encontraron sucursales" minWidth={800}>
              <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
                <Table.Tr>
                  <Table.Th>Sucursal</Table.Th>
                  <Table.Th style={{ width: '150px' }}>% Difícil Acceso</Table.Th>
                  <Table.Th style={{ width: '150px' }}>
                    <Tooltip label="Incluye logística y ganancia" position="top">
                      <span>% Margen Insumos</span>
                    </Tooltip>
                  </Table.Th>
                  <Table.Th style={{ width: '150px' }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sucursalesFiltradas.map((sucursal) => (
                  <Table.Tr key={sucursal.ID}>
                    <Table.Td>{formatName(sucursal.Sucursales_mh)}</Table.Td>
                    <Table.Td>{formatNumber(sucursal.suc_porcentaje_dificil_acceso)}%</Table.Td>
                    <Table.Td>{formatNumber(sucursal.suc_porcentaje_insumos)}%</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="transparent" onClick={() => handleEdit(sucursal)}>
                          <PencilSquareIcon width={20} height={20} />
                        </ActionIcon>
                        <ActionIcon variant="transparent" color="blue" onClick={() => handleAsignarZonas(sucursal)}>
                          <MapPinIcon width={20} height={20} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </AdminTable>
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="zonas" pt="md">
          <Stack gap="md">
            <Group justify="space-between">
              <TextInput
                placeholder="Buscar zonas..."
                leftSection={<MagnifyingGlassIcon style={{ width: 16, height: 16 }} />}
                value={filtroZonas}
                onChange={(e) => setFiltroZonas(e.target.value)}
                rightSection={
                  filtroZonas ? (
                    <ActionIcon variant="subtle" onClick={() => setFiltroZonas('')}>
                      <XMarkIcon style={{ width: 16, height: 16 }} />
                    </ActionIcon>
                  ) : null
                }
                style={{ flex: 1 }}
              />
              <Button leftSection={<PlusIcon style={{ width: 16, height: 16 }} />} onClick={handleNuevaZona}>
                Nueva Zona
              </Button>
            </Group>

            <AdminTable isEmpty={zonasFiltradas.length === 0} emptyMessage="No se encontraron zonas" minWidth={800}>
              <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
                <Table.Tr>
                  <Table.Th>Zona</Table.Th>
                  <Table.Th>Descripción</Table.Th>
                  <Table.Th style={{ width: '200px' }}>Sucursales</Table.Th>
                  <Table.Th style={{ width: '100px' }}>Estado</Table.Th>
                  <Table.Th style={{ width: '100px' }}>Acciones</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {zonasFiltradas.map((zona) => (
                  <Table.Tr key={zona.id}>
                    <Table.Td>{zona.nombre}</Table.Td>
                    <Table.Td>{zona.descripcion || '-'}</Table.Td>
                    <Table.Td>
                      <Text size="sm">{zona.sucursales || 'Sin asignar'}</Text>
                      {zona.sucursales_principales && (
                        <Text size="xs" c="dimmed">(P: {zona.sucursales_principales})</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c={zona.activo ? 'green' : 'gray'}>
                        {zona.activo ? 'Activo' : 'Inactivo'}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <ActionIcon variant="transparent" onClick={() => handleEditarZona(zona)}>
                        <PencilSquareIcon width={20} height={20} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </AdminTable>
          </Stack>
        </Tabs.Panel>
      </Tabs>

      {/* Modal Editar Sucursal */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Editar Sucursal: ${editingSucursal ? formatName(editingSucursal.Sucursales_mh) : ''}`}
        size="md"
      >
        {editingSucursal && (
          <Stack gap="md">
            <TextInput
              label="Porcentaje Difícil Acceso (%)"
              type="number"
              value={formatNumber(editingSucursal.suc_porcentaje_dificil_acceso).toString()}
              onChange={(e) => setEditingSucursal({
                ...editingSucursal,
                suc_porcentaje_dificil_acceso: parseFloat(e.target.value) || 0
              })}
              min={0}
              step={0.1}
            />
            <TextInput
              label="Margen Total Insumos (%)"
              description="Incluye logística y ganancia. Se aplica sobre el costo base de cada insumo."
              type="number"
              value={formatNumber(editingSucursal.suc_porcentaje_insumos).toString()}
              onChange={(e) => setEditingSucursal({
                ...editingSucursal,
                suc_porcentaje_insumos: parseFloat(e.target.value) || 0
              })}
              min={0}
              step={0.1}
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

      {/* Modal Crear/Editar Zona */}
      <Modal
        opened={modalZonaOpen}
        onClose={() => setModalZonaOpen(false)}
        title={editingZona?.id === 0 ? 'Nueva Zona' : 'Editar Zona'}
        size="md"
      >
        {editingZona && (
          <Stack gap="md">
            <TextInput
              label="Nombre"
              placeholder="Ej: CABA, AMBA, Centro"
              value={editingZona.nombre}
              onChange={(e) => setEditingZona({ ...editingZona, nombre: e.target.value })}
              required
            />
            <TextInput
              label="Descripción"
              placeholder="Descripción de la zona"
              value={editingZona.descripcion || ''}
              onChange={(e) => setEditingZona({ ...editingZona, descripcion: e.target.value })}
            />
            {editingZona.id !== 0 && (
              <Checkbox
                label="Zona activa"
                checked={editingZona.activo === 1}
                onChange={(e) => setEditingZona({ ...editingZona, activo: e.currentTarget.checked ? 1 : 0 })}
              />
            )}
            <Group style={{ justifyContent: 'flex-end' }}>
              <Button variant="outline" onClick={() => setModalZonaOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmitZona} loading={loading}>
                Guardar
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Modal Asignar Zonas a Sucursal */}
      <Modal
        opened={modalAsignarOpen}
        onClose={() => {
          setModalAsignarOpen(false);
          setFiltroZonasModal('');
        }}
        title={`Asignar Zonas: ${selectedSucursal ? formatName(selectedSucursal.Sucursales_mh) : ''}`}
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Seleccione las zonas disponibles para esta sucursal. Marque una como principal para preselección automática.
          </Text>
          
          <TextInput
            placeholder="Buscar zonas..."
            leftSection={<MagnifyingGlassIcon style={{ width: 16, height: 16 }} />}
            value={filtroZonasModal}
            onChange={(e) => setFiltroZonasModal(e.target.value)}
            rightSection={
              filtroZonasModal ? (
                <ActionIcon variant="subtle" onClick={() => setFiltroZonasModal('')}>
                  <XMarkIcon style={{ width: 16, height: 16 }} />
                </ActionIcon>
              ) : null
            }
          />

          <Stack gap="sm">
            {zonasDisponibles
              .filter(zona => zona.nombre.toLowerCase().includes(filtroZonasModal.toLowerCase()))
              .map((zona) => {
                const asignada = zonasAsignadas.find(z => z.id === zona.id);
                return (
                  <div
                    key={zona.id}
                    style={{
                      padding: '12px',
                      border: '1px solid #e9ecef',
                      borderRadius: '6px',
                      backgroundColor: asignada ? '#f8f9fa' : 'white',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="md" style={{ flex: 1 }}>
                        <Checkbox
                          checked={!!asignada}
                          onChange={() => handleToggleZona(zona.id, !!asignada)}
                          styles={{
                            input: { cursor: 'pointer' }
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <Text size="sm" fw={500}>{zona.nombre}</Text>
                          {zona.descripcion && (
                            <Text size="xs" c="dimmed">{zona.descripcion}</Text>
                          )}
                        </div>
                      </Group>
                      {asignada && (
                        <Checkbox
                          label="Principal"
                          checked={asignada.es_zona_principal === 1}
                          onChange={() => handleTogglePrincipal(zona.id)}
                          styles={{
                            input: { cursor: 'pointer' }
                          }}
                        />
                      )}
                    </Group>
                  </div>
                );
              })}
            {zonasDisponibles.filter(zona => zona.nombre.toLowerCase().includes(filtroZonasModal.toLowerCase())).length === 0 && (
              <Text size="sm" c="dimmed" ta="center" py="xl">
                No se encontraron zonas
              </Text>
            )}
          </Stack>

          <Group style={{ justifyContent: 'flex-end' }}>
            <Button onClick={() => {
              setModalAsignarOpen(false);
              setFiltroZonasModal('');
            }}>
              Cerrar
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
