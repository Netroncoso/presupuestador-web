import React, { useState, useEffect } from 'react';
import { Table, Button, Group, Switch, Modal, Select, Text, NumberInput, Stack, Divider, ActionIcon, TextInput, Paper } from '@mantine/core';
import { PencilSquareIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { api } from '../../api/api';
import { notifications } from '@mantine/notifications';
import { CurrencyInput } from '../../components/CurrencyInput';

interface Zona {
  id: number;
  nombre: string;
}

interface ServicioConValores {
  id: number;
  nombre: string;
  tipo_unidad: string;
  activo: boolean;
  costo_1: number | null;
  costo_2: number | null;
  costo_3: number | null;
  costo_4: number | null;
  costo_5: number | null;
  tiene_valores: boolean;
}

interface ValorHistorico {
  id: number;
  costo_1: number;
  costo_2: number;
  costo_3: number;
  costo_4: number;
  costo_5: number;
  fecha_inicio: string;
  fecha_fin: string | null;
}

export default function ValoresPorZona() {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [zonaId, setZonaId] = useState<string>('');
  const [servicios, setServicios] = useState<ServicioConValores[]>([]);
  const [modalOpened, setModalOpened] = useState(false);
  const [servicioSeleccionado, setServicioSeleccionado] = useState<ServicioConValores | null>(null);
  const [historico, setHistorico] = useState<ValorHistorico[]>([]);
  const [costo1, setCosto1] = useState<number>(0);
  const [costo2, setCosto2] = useState<number>(0);
  const [costo3, setCosto3] = useState<number>(0);
  const [costo4, setCosto4] = useState<number>(0);
  const [costo5, setCosto5] = useState<number>(0);
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    cargarZonas();
  }, []);

  useEffect(() => {
    if (zonaId) {
      cargarServicios();
    }
  }, [zonaId]);

  const cargarZonas = async () => {
    try {
      const response = await api.get('/zonas');
      setZonas(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar zonas',
        color: 'red'
      });
    }
  };

  const cargarServicios = async () => {
    try {
      const response = await api.get(`/tarifario/valores/zona/${zonaId}`);
      setServicios(response.data);
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al cargar servicios',
        color: 'red'
      });
    }
  };

  const abrirModalValores = async (servicio: ServicioConValores) => {
    setServicioSeleccionado(servicio);
    setCosto1(servicio.costo_1 || 0);
    setCosto2(servicio.costo_2 || 0);
    setCosto3(servicio.costo_3 || 0);
    setCosto4(servicio.costo_4 || 0);
    setCosto5(servicio.costo_5 || 0);

    try {
      const response = await api.get(`/tarifario/valores/historico/${servicio.id}/${zonaId}`);
      setHistorico(response.data);
    } catch (error) {
      setHistorico([]);
    }

    setModalOpened(true);
  };

  const cerrarModal = () => {
    setModalOpened(false);
    setServicioSeleccionado(null);
    setHistorico([]);
    setCosto1(0);
    setCosto2(0);
    setCosto3(0);
    setCosto4(0);
    setCosto5(0);
    setFechaInicio(new Date().toISOString().slice(0, 10));
  };

  const guardarValores = async () => {
    if (!servicioSeleccionado) return;

    try {
      await api.post('/tarifario/valores', {
        tarifario_servicio_id: servicioSeleccionado.id,
        zona_id: zonaId,
        costo_1: costo1,
        costo_2: costo2,
        costo_3: costo3,
        costo_4: costo4,
        costo_5: costo5,
        fecha_inicio: fechaInicio
      });

      notifications.show({
        title: 'Éxito',
        message: 'Valores guardados correctamente',
        color: 'green'
      });

      cerrarModal();
      cargarServicios();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar valores',
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

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Vigente';
    return new Date(date).toLocaleDateString('es-AR');
  };

  return (
    <>
      <Select
        label="Seleccionar Zona"
        placeholder="Seleccione una zona"
        value={zonaId}
        onChange={(value) => setZonaId(value || '')}
        data={zonas.map(z => ({ value: String(z.id), label: z.nombre }))}
        searchable
        clearable
        mb="md"
      />

      {zonaId && (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Servicio</Table.Th>
              <Table.Th>Costo 1</Table.Th>
              <Table.Th>Costo 2</Table.Th>
              <Table.Th>Costo 3</Table.Th>
              <Table.Th>Costo 4</Table.Th>
              <Table.Th>Costo 5</Table.Th>
              <Table.Th>Activo</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {servicios.map((servicio) => (
              <Table.Tr key={servicio.id}>
                <Table.Td>{servicio.nombre}</Table.Td>
                <Table.Td>{formatCurrency(servicio.costo_1)}</Table.Td>
                <Table.Td>{formatCurrency(servicio.costo_2)}</Table.Td>
                <Table.Td>{formatCurrency(servicio.costo_3)}</Table.Td>
                <Table.Td>{formatCurrency(servicio.costo_4)}</Table.Td>
                <Table.Td>{formatCurrency(servicio.costo_5)}</Table.Td>
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
                    onClick={() => abrirModalValores(servicio)}
                  >
                    <PencilSquareIcon style={{ width: 20, height: 20 }} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal
        opened={modalOpened}
        onClose={cerrarModal}
        title={`Valores - ${servicioSeleccionado?.nombre}`}
        size="lg"
      >
        <Stack gap="md">
          <Paper p="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
            <Text fw={500} size="sm" mb="sm">Agregar Nuevos Valores</Text>
            <Group grow mb="sm">
              <CurrencyInput
                label="Costo 1"
                value={costo1}
                onChange={(value) => setCosto1(Number(value) || 0)}
              />
              <CurrencyInput
                label="Costo 2"
                value={costo2}
                onChange={(value) => setCosto2(Number(value) || 0)}
              />
              <CurrencyInput
                label="Costo 3"
                value={costo3}
                onChange={(value) => setCosto3(Number(value) || 0)}
              />
            </Group>
            <Group grow mb="sm">
              <CurrencyInput
                label="Costo 4"
                value={costo4}
                onChange={(value) => setCosto4(Number(value) || 0)}
              />
              <CurrencyInput
                label="Costo 5"
                value={costo5}
                onChange={(value) => setCosto5(Number(value) || 0)}
              />
            </Group>
            <TextInput
              label="Fecha de Inicio de Vigencia"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              mb="sm"
            />
            <Group justify="flex-end">
              <Button onClick={guardarValores} color="green" size="sm">
                Guardar Valores
              </Button>
            </Group>
          </Paper>

          {historico.length > 0 && (
            <>
              <Divider />
              <Text fw={500} size="sm">Histórico de Valores</Text>
              <Table striped size="sm">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Costo 1</Table.Th>
                    <Table.Th>Costo 2</Table.Th>
                    <Table.Th>Costo 3</Table.Th>
                    <Table.Th>Costo 4</Table.Th>
                    <Table.Th>Costo 5</Table.Th>
                    <Table.Th>Desde</Table.Th>
                    <Table.Th>Hasta</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {historico.map((valor) => (
                    <Table.Tr key={valor.id}>
                      <Table.Td>{formatCurrency(valor.costo_1)}</Table.Td>
                      <Table.Td>{formatCurrency(valor.costo_2)}</Table.Td>
                      <Table.Td>{formatCurrency(valor.costo_3)}</Table.Td>
                      <Table.Td>{formatCurrency(valor.costo_4)}</Table.Td>
                      <Table.Td>{formatCurrency(valor.costo_5)}</Table.Td>
                      <Table.Td>{formatDate(valor.fecha_inicio)}</Table.Td>
                      <Table.Td>{formatDate(valor.fecha_fin)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </>
          )}
        </Stack>
      </Modal>
    </>
  );
}
