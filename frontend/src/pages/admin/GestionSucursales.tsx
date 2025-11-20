import React, { useState, useEffect } from 'react';
import { TextInput, Table, Group, Stack, Modal, ActionIcon, Button, Tooltip } from '@mantine/core';
import { PencilSquareIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';
import AdminTable from '../../components/AdminTable';

interface Sucursal {
  ID: number;
  Sucursales_mh: string;
  suc_porcentaje_dificil_acceso: number;
  suc_porcentaje_insumos: number;
}

export default function GestionSucursales() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [filtro, setFiltro] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [loading, setLoading] = useState(false);

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const formatNumber = (value: number | null | undefined): number => {
    return Number(value) || 0;
  };

  const sucursalesFiltradas = sucursales.filter(sucursal =>
    sucursal.Sucursales_mh.toLowerCase().includes(filtro.toLowerCase())
  );

  useEffect(() => {
    cargarSucursales();
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

  return (
    <Stack gap="md">
      <TextInput
        placeholder="Buscar sucursales..."
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

      <AdminTable isEmpty={sucursalesFiltradas.length === 0} emptyMessage="No se encontraron sucursales">
        <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
          <Table.Tr>
            <Table.Th>Sucursal</Table.Th>
            <Table.Th style={{ width: '180px' }}>% Difícil Acceso</Table.Th>
            <Table.Th style={{ width: '150px' }}>
              <Tooltip label="Incluye logística y ganancia" position="top">
                <span>% Margen Insumos</span>
              </Tooltip>
            </Table.Th>
            <Table.Th style={{ width: '100px' }}>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sucursalesFiltradas.map((sucursal) => (
            <Table.Tr key={sucursal.ID}>
              <Table.Td>{formatName(sucursal.Sucursales_mh)}</Table.Td>
              <Table.Td>{formatNumber(sucursal.suc_porcentaje_dificil_acceso)}%</Table.Td>
              <Table.Td>{formatNumber(sucursal.suc_porcentaje_insumos)}%</Table.Td>
              <Table.Td>
                <ActionIcon variant="transparent" onClick={() => handleEdit(sucursal)}>
                  <PencilSquareIcon width={20} height={20} />
                </ActionIcon>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </AdminTable>

      {/* Modal Editar */}
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
    </Stack>
  );
}
