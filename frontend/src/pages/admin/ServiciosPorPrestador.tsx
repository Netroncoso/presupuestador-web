import React, { useState, useEffect } from 'react';
import { Paper, Select, Table, Group, Stack, Modal, Switch, Badge, ActionIcon, Button, TextInput, Tooltip } from '@mantine/core';
import { PencilSquareIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { notifications } from '@mantine/notifications';
import { api } from '../../api/api';

interface Financiador {
  idobra_social: string;
  Financiador: string;
}

interface ServicioPrestador {
  id_servicio: string;
  nombre: string;
  id_prestador_servicio: number | null;
  valor_facturar: number | null;
  activo: number | null;
  cant_total: number | null;
  valor_sugerido: number | null;
  tipo_unidad?: string;
}

export default function ServiciosPorPrestador() {
  const [financiadores, setFinanciadores] = useState<Financiador[]>([]);
  const [financiadorSeleccionado, setFinanciadorSeleccionado] = useState<string>('');
  const [servicios, setServicios] = useState<ServicioPrestador[]>([]);
  const [filtroServicio, setFiltroServicio] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState<ServicioPrestador | null>(null);
  const [loading, setLoading] = useState(false);

  const formatName = (name: string) => {
    return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  };

  const formatNumber = (value: number | null | undefined): number => {
    return Number(value) || 0;
  };

  useEffect(() => {
    cargarFinanciadores();
  }, []);

  useEffect(() => {
    if (financiadorSeleccionado) {
      cargarServicios();
    }
  }, [financiadorSeleccionado]);

  const cargarFinanciadores = async () => {
    try {
      const response = await api.get('/admin/servicios/prestadores');
      setFinanciadores(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar financiadores',
        color: 'red'
      });
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await api.get(`/admin/servicios/prestador/${financiadorSeleccionado}/servicios`);
      setServicios(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar servicios',
        color: 'red'
      });
    }
  };

  const toggleActivo = async (servicio: ServicioPrestador) => {
    const nuevoEstado = servicio.activo === 1 ? 0 : 1;
    
    try {
      await api.put(`/admin/servicios/prestador/${financiadorSeleccionado}/servicio/${servicio.id_servicio}`, {
        valor_facturar: formatNumber(servicio.valor_facturar),
        activo: nuevoEstado,
        cant_total: formatNumber(servicio.cant_total),
        valor_sugerido: formatNumber(servicio.valor_sugerido)
      });
      
      notifications.show({
        title: 'Éxito',
        message: `Servicio ${nuevoEstado === 1 ? 'activado' : 'desactivado'} correctamente`,
        color: 'green'
      });
      
      cargarServicios();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar servicio',
        color: 'red'
      });
    }
  };

  const handleEdit = (servicio: ServicioPrestador) => {
    setEditingServicio({
      ...servicio,
      valor_facturar: formatNumber(servicio.valor_facturar),
      cant_total: formatNumber(servicio.cant_total),
      valor_sugerido: formatNumber(servicio.valor_sugerido)
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!editingServicio) return;

    setLoading(true);
    try {
      await api.put(`/admin/servicios/prestador/${financiadorSeleccionado}/servicio/${editingServicio.id_servicio}`, {
        valor_facturar: formatNumber(editingServicio.valor_facturar),
        activo: editingServicio.activo || 0,
        cant_total: formatNumber(editingServicio.cant_total),
        valor_sugerido: formatNumber(editingServicio.valor_sugerido)
      });
      
      notifications.show({
        title: 'Éxito',
        message: 'Servicio actualizado correctamente',
        color: 'green'
      });
      
      setModalOpen(false);
      setEditingServicio(null);
      cargarServicios();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al actualizar servicio',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack gap="md">
      <Select
        label="Seleccionar Financiador"
        placeholder="Seleccione un financiador activo"
        value={financiadorSeleccionado}
        onChange={(value) => setFinanciadorSeleccionado(value || '')}
        data={financiadores.map(p => ({
          value: String(p.idobra_social),
          label: formatName(p.Financiador)
        }))}
        searchable
        clearable
      />

      {financiadorSeleccionado && (
        <Paper p="md" withBorder>
          <TextInput
            placeholder="Filtrar por servicio..."
            leftSection={<MagnifyingGlassIcon style={{ width: 16, height: 16 }} />}
            value={filtroServicio}
            onChange={(e) => setFiltroServicio(e.currentTarget.value)}
            rightSection={
              filtroServicio ? (
                <ActionIcon variant="subtle" onClick={() => setFiltroServicio('')}>
                  <XMarkIcon style={{ width: 16, height: 16 }} />
                </ActionIcon>
              ) : null
            }
            mb="md"
          />
          <Table striped="odd" highlightOnHover layout="fixed" stickyHeader>
            <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
              <Table.Tr>
                <Table.Th>Servicio</Table.Th>
                <Table.Th style={{ width: '80px' }}>Tipo</Table.Th>
                <Table.Th style={{ width: '140px' }}>Estado</Table.Th>
                <Table.Th style={{ width: '140px' }}>
                  <Tooltip label="Valor a facturar por unidad de servicio">
                    <span>Valor a Facturar</span>
                  </Tooltip>
                </Table.Th>
                <Table.Th style={{ width: '130px' }}>Valor Sugerido</Table.Th>
                <Table.Th style={{ width: '110px' }}>
                  <Tooltip label="Cantidad inicial sugerida y límite para alertas">
                    <span>Cant. Sugerida</span>
                  </Tooltip>
                </Table.Th>
                <Table.Th style={{ width: '90px' }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {servicios
                .filter(s => s.nombre.toLowerCase().includes(filtroServicio.toLowerCase()))
                .map((servicio) => (
                <Table.Tr key={servicio.id_servicio}>
                  <Table.Td>{formatName(servicio.nombre)}</Table.Td>
                  <Table.Td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{servicio.tipo_unidad || 'horas'}</Table.Td>
                  <Table.Td>
                    <Group gap="sm" align="center">
                      <Switch
                        checked={servicio.activo === 1}
                        onChange={() => toggleActivo(servicio)}
                        size="sm"
                      />
                      <Badge 
                        color={servicio.activo === 1 ? 'green' : 'gray'} 
                        variant="dot"
                        size="sm"
                      >
                        {servicio.activo === 1 ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </Group>
                  </Table.Td>
                  <Table.Td>${formatNumber(servicio.valor_facturar).toFixed(2)}</Table.Td>
                  <Table.Td>${formatNumber(servicio.valor_sugerido).toFixed(2)}</Table.Td>
                  <Table.Td>{formatNumber(servicio.cant_total)}</Table.Td>
                  <Table.Td>
                    <ActionIcon variant="transparent" onClick={() => handleEdit(servicio)}>
                      <PencilSquareIcon width={20} height={20} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          
          {servicios.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No se encontraron servicios
            </div>
          )}
        </Paper>
      )}

      {/* Modal Editar */}
      <Modal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Editar Servicio: ${editingServicio ? formatName(editingServicio.nombre) : ''}`}
        size="md"
      >
        {editingServicio && (
          <Stack gap="md">
            <TextInput
              label="Valor a Facturar"
              type="number"
              value={formatNumber(editingServicio.valor_facturar).toString()}
              onChange={(e) => setEditingServicio({
                ...editingServicio,
                valor_facturar: parseFloat(e.target.value) || 0
              })}
              min={0}
              step={0.01}
            />
            <TextInput
              label="Valor Sugerido"
              type="number"
              value={formatNumber(editingServicio.valor_sugerido).toString()}
              onChange={(e) => setEditingServicio({
                ...editingServicio,
                valor_sugerido: parseFloat(e.target.value) || 0
              })}
              min={0}
              step={0.01}
            />
            <TextInput
              label="Cantidad Sugerida"
              type="number"
              value={formatNumber(editingServicio.cant_total).toString()}
              onChange={(e) => setEditingServicio({
                ...editingServicio,
                cant_total: parseInt(e.target.value) || 0
              })}
              min={0}
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
