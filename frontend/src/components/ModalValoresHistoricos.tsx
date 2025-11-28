import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  TextInput,
  Table,
  Paper,
  Box,
  Group,
  Stack,
  Alert,
  Text,
  Badge
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { api } from '../api/api';

interface Valor {
  id: number;
  valor_asignado: number;
  valor_facturar: number;
  fecha_inicio: string;
  fecha_fin: string | null;
  created_at: string;
}

interface Props {
  opened: boolean;
  onClose: () => void;
  idServicio: number;
  nombreServicio: string;
}

export default function ModalValoresHistoricos({ opened, onClose, idServicio, nombreServicio }: Props) {
  const [valores, setValores] = useState<Valor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nuevoValor, setNuevoValor] = useState({
    valor_asignado: '',
    valor_facturar: '',
    fecha_inicio: new Date().toISOString().slice(0, 10)
  });

  useEffect(() => {
    if (opened) {
      cargarValores();
    }
  }, [opened, idServicio]);

  const cargarValores = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/prestaciones/servicio/${idServicio}/valores`);
      setValores(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar valores');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async () => {
    if (!nuevoValor.valor_asignado || !nuevoValor.valor_facturar || !nuevoValor.fecha_inicio) {
      setError('Todos los campos son obligatorios');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post(`/prestaciones/servicio/${idServicio}/valores`, {
        valor_asignado: parseFloat(nuevoValor.valor_asignado),
        valor_facturar: parseFloat(nuevoValor.valor_facturar),
        fecha_inicio: nuevoValor.fecha_inicio
      });
      
      notifications.show({
        title: 'Éxito',
        message: 'Valor guardado correctamente',
        color: 'green'
      });
      
      setNuevoValor({
        valor_asignado: '',
        valor_facturar: '',
        fecha_inicio: new Date().toISOString().slice(0, 10)
      });
      
      await cargarValores();
    } catch (err: any) {
      notifications.show({
        title: 'Error',
        message: err.response?.data?.message || 'Error al guardar valor',
        color: 'red'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatFecha = (fecha: string | null) => {
    if (!fecha) return 'Vigente';
    return new Date(fecha).toLocaleDateString('es-AR');
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={`Valores Históricos - ${nombreServicio}`}
      size="xl"
    >
      <Stack gap="md">
        {error && <Alert color="red">{error}</Alert>}
        
        {/* Formulario nuevo valor */}
        <Paper p="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
          <Text size="sm" fw={500} mb="sm">Agregar Nuevo Valor</Text>
          <Group align="flex-end">
            <TextInput
              label="Valor Asignado"
              type="number"
              value={nuevoValor.valor_asignado}
              onChange={(e) => setNuevoValor({ ...nuevoValor, valor_asignado: e.target.value })}
              step={0.01}
              style={{ flex: 1 }}
            />
            <TextInput
              label="Valor Facturar"
              type="number"
              value={nuevoValor.valor_facturar}
              onChange={(e) => setNuevoValor({ ...nuevoValor, valor_facturar: e.target.value })}
              step={0.01}
              style={{ flex: 1 }}
            />
            <TextInput
              label="Fecha Inicio"
              type="date"
              value={nuevoValor.fecha_inicio}
              onChange={(e) => setNuevoValor({ ...nuevoValor, fecha_inicio: e.target.value })}
              style={{ flex: 1 }}
            />
            <Button 
              onClick={handleGuardar}
              loading={loading}
            >
              Guardar
            </Button>
          </Group>
        </Paper>

        {/* Tabla histórico */}
        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead style={{ backgroundColor: '#dce4f5' }}>
              <Table.Tr>
                <Table.Th>Fecha Inicio</Table.Th>
                <Table.Th>Fecha Fin</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Valor Asignado</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Valor Facturar</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {valores.map((v) => (
                <Table.Tr key={v.id}>
                  <Table.Td>{formatFecha(v.fecha_inicio)}</Table.Td>
                  <Table.Td>{formatFecha(v.fecha_fin)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>${v.valor_asignado.toFixed(2)}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>${v.valor_facturar.toFixed(2)}</Table.Td>
                  <Table.Td>
                    {!v.fecha_fin ? (
                      <Badge color="green" variant="dot">Vigente</Badge>
                    ) : (
                      <Badge color="gray" variant="dot">Histórico</Badge>
                    )}
                  </Table.Td>
                </Table.Tr>
              ))}
              {valores.length === 0 && (
                <Table.Tr>
                  <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                    <Text c="dimmed" size="sm">
                      No hay valores registrados
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        <Group justify="flex-end">
          <Button variant="outline" onClick={onClose}>Cerrar</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
