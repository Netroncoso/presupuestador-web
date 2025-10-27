import React, { useState, useEffect } from 'react';
import { Paper, TextInput, Table, Group, Stack, Modal, ActionIcon, Button } from '@mantine/core';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';

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
    <Stack spacing="md">
      <TextInput
        placeholder="Buscar sucursales..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      <Paper p="md" withBorder>
        <Table striped highlightOnHover>
          <thead>
            <tr>
              <th>Sucursal</th>
              <th style={{ width: '180px' }}>% Difícil Acceso</th>
              <th style={{ width: '150px' }}>% Insumos</th>
              <th style={{ width: '100px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {sucursalesFiltradas.map((sucursal) => (
              <tr key={sucursal.ID}>
                <td>{formatName(sucursal.Sucursales_mh)}</td>
                <td>{formatNumber(sucursal.suc_porcentaje_dificil_acceso)}%</td>
                <td>{formatNumber(sucursal.suc_porcentaje_insumos)}%</td>
                <td>
                  <ActionIcon variant="light" onClick={() => handleEdit(sucursal)}>
                    <PencilSquareIcon width={16} height={16} />
                  </ActionIcon>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        
        {sucursalesFiltradas.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No se encontraron sucursales
          </div>
        )}
      </Paper>

      {/* Modal Editar */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Editar Sucursal: ${editingSucursal ? formatName(editingSucursal.Sucursales_mh) : ''}`}
        size="md"
      >
        {editingSucursal && (
          <Stack spacing="md">
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
              label="Porcentaje Insumos (%)"
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