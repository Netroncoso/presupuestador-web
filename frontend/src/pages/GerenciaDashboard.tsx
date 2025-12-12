import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Table, Button, Badge, Group, Paper, Loader, Center, Tabs, ActionIcon, TextInput, Alert } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationCount } from '../hooks/useNotificationCount';
import { api } from '../api/api';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { ArrowRightStartOnRectangleIcon, UserCircleIcon, BellIcon, ShieldCheckIcon, ClockIcon, EyeIcon, MagnifyingGlassIcon, XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { NotificationIndicator } from '../components/NotificationIndicator';
import { ModalAuditoriaMulti } from '../components/ModalAuditoriaMulti';
import { ModalDetallePresupuesto } from '../components/ModalDetallePresupuesto';
import Notificaciones from './Notificaciones';
import ListaPresupuestos from './ListaPresupuestos';
import { getEstadoBadgeColor, getEstadoLabel } from '../utils/estadoPresupuesto';
import { Presupuesto, RolUsuario } from '../types';

interface GerenciaDashboardProps {
  titulo: string;
  rol: RolUsuario;
}

const GerenciaDashboard: React.FC<GerenciaDashboardProps> = ({ titulo, rol }) => {
  const { user, logout } = useAuth();
  const { count: notificationCount, isConnected } = useNotificationCount();
  const [pendientes, setPendientes] = useState<Presupuesto[]>([]);
  const [misCasos, setMisCasos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null);
  const [presupuestoDetalle, setPresupuestoDetalle] = useState<any>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('pendientes');
  const [filtroPresupuestoId, setFiltroPresupuestoId] = useState<string>('');
  const { presupuestos } = useRealtimeUpdates();

  useEffect(() => {
    cargarDatos();
  }, []);
  
  useEffect(() => {
    if (presupuestos && presupuestos.length >= 0) {
      cargarDatos();
    }
  }, [presupuestos]);

  const cargarDatos = async () => {
    try {
      const [pendientesRes, misCasosRes] = await Promise.all([
        api.get('/auditoria-multi/pendientes'),
        api.get('/auditoria-multi/mis-casos')
      ]);
      setPendientes(pendientesRes.data);
      setMisCasos(misCasosRes.data);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const tomarCaso = async (presupuesto: Presupuesto) => {
    try {
      await api.put(`/auditoria-multi/tomar/${presupuesto.idPresupuestos}`);
      await cargarDatos();
      setSelectedPresupuesto(presupuesto);
      notifications.show({
        title: 'Caso Asignado',
        message: 'El caso ha sido asignado a ti',
        color: 'green'
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Error al tomar el caso',
        color: 'red'
      });
    }
  };

  const verDetallePresupuesto = async (presupuesto: Presupuesto) => {
    try {
      const response = await api.get(`/presupuestos/${presupuesto.idPresupuestos}`);
      setPresupuestoDetalle(response.data);
      setModalDetalleAbierto(true);
    } catch (error) {
      console.error('Error cargando detalle:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al cargar detalles del presupuesto',
        color: 'red'
      });
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  const pendientesFiltrados = pendientes.filter(p => 
    !filtroPresupuestoId || p.idPresupuestos.toString().includes(filtroPresupuestoId)
  );

  return (
    <Container fluid p="xl">
      <Group justify="space-between" mb={20}>
        <Title fw={500} order={2} c="blue">{titulo}</Title>
        <Group gap="xs">
          <UserCircleIcon style={{ width: 20, height: 20 }} />
          <Text fw={500} size="sm" tt="capitalize">{user?.username}</Text>
          <ConnectionStatus isConnected={isConnected} />
          <Button ml="md" variant="outline" color="red" size="xs" onClick={logout} rightSection={<ArrowRightStartOnRectangleIcon style={{ width: 20, height: 20 }}/>}>
            Salir
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color="blue" radius="md">
        <Tabs.List>
          <Tabs.Tab value="pendientes">
            <Group gap="xs">
              <ShieldCheckIcon style={{ width: 20, height: 20 }} />
              Casos Disponibles
              {pendientes.length > 0 && <Badge size="sm" circle>{pendientes.length}</Badge>}
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="mis-casos">
            <Group gap="xs">
              <ClockIcon style={{ width: 20, height: 20 }} />
              Mis Casos
              {misCasos.length > 0 && <Badge size="sm" circle color="blue">{misCasos.length}</Badge>}
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="historial">
            <Group gap="xs">
              <ClockIcon style={{ width: 20, height: 20 }} />
              Historial
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="notificaciones">
            <Group gap="xs">
              <BellIcon style={{ width: 20, height: 20 }} />
              Notificaciones
              <NotificationIndicator count={notificationCount} />
            </Group>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="pendientes" pt="md">
          <Paper p="md" radius="md" withBorder shadow="xs" mb="lg">
            <Group justify="space-between">
              <Text size="lg" fw={500}>
                {pendientesFiltrados.length} caso{pendientesFiltrados.length !== 1 ? 's' : ''} disponible{pendientesFiltrados.length !== 1 ? 's' : ''}
              </Text>
              <TextInput
                placeholder="Filtrar por ID"
                leftSection={<MagnifyingGlassIcon style={{ width: 16, height: 16 }} />}
                value={filtroPresupuestoId}
                onChange={(e) => setFiltroPresupuestoId(e.currentTarget.value)}
                rightSection={
                  filtroPresupuestoId ? (
                    <ActionIcon variant="subtle" onClick={() => setFiltroPresupuestoId('')}>
                      <XMarkIcon style={{ width: 16, height: 16 }} />
                    </ActionIcon>
                  ) : null
                }
                style={{ width: 250 }}
              />
            </Group>
          </Paper>

          {pendientesFiltrados.length === 0 ? (
            <Paper p="xl" withBorder radius="md">
              <Center>
                <Text size="xl" fw={400} c="green" ta="center">No hay casos disponibles</Text>
              </Center>
            </Paper>
          ) : (
            <Paper withBorder radius="md" shadow="sm">
              <Table.ScrollContainer minWidth={800}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Paciente</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Costo Total</Table.Th>
                      <Table.Th>Rentabilidad</Table.Th>
                      <Table.Th>Días Pendiente</Table.Th>
                      <Table.Th>Creador</Table.Th>
                      <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pendientesFiltrados.map((presupuesto) => (
                      <Table.Tr key={presupuesto.idPresupuestos}>
                        <Table.Td>
                          <div>
                            <Text fw={500}>{presupuesto.Nombre_Apellido}</Text>
                            <Text size="sm" c="dimmed">DNI: {presupuesto.DNI}</Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500} c={getEstadoBadgeColor(presupuesto.estado)}>
                            {getEstadoLabel(presupuesto.estado)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={500}>${Number(presupuesto.costo_total || 0).toLocaleString()}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text fw={500} c={Number(presupuesto.rentabilidad || 0) < 15 ? 'red' : 'green'}>
                            {Number(presupuesto.rentabilidad || 0).toFixed(1)}%
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text c={presupuesto.dias_pendiente && presupuesto.dias_pendiente > 7 ? 'red' : 'dimmed'}>
                            {presupuesto.dias_pendiente || 0} día{presupuesto.dias_pendiente !== 1 ? 's' : ''}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{presupuesto.Sucursal}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="transparent"
                              color="blue"
                              onClick={() => verDetallePresupuesto(presupuesto)}
                              title="Ver detalle"
                            >
                              <EyeIcon style={{ width: 20, height: 20 }} />
                            </ActionIcon>
                            <Button
                              size="xs"
                              onClick={() => tomarCaso(presupuesto)}
                            >
                              Tomar Caso
                            </Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="mis-casos" pt="md">
          {misCasos.length > 0 && (
            <Alert icon={<ExclamationTriangleIcon style={{ width: 20, height: 20 }} />} color="blue" mb="md">
              Los casos se liberan automáticamente después de 30 minutos de inactividad
            </Alert>
          )}

          {misCasos.length === 0 ? (
            <Paper p="xl" withBorder radius="md">
              <Center>
                <Text size="xl" fw={400} c="dimmed" ta="center">No tienes casos asignados</Text>
              </Center>
            </Paper>
          ) : (
            <Paper withBorder radius="md" shadow="sm">
              <Table.ScrollContainer minWidth={800}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Paciente</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Tiempo Asignado</Table.Th>
                      <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {misCasos.map((presupuesto) => (
                      <Table.Tr key={presupuesto.idPresupuestos}>
                        <Table.Td>
                          <div>
                            <Text fw={500}>{presupuesto.Nombre_Apellido}</Text>
                            <Text size="sm" c="dimmed">DNI: {presupuesto.DNI}</Text>
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500} c={getEstadoBadgeColor(presupuesto.estado)}>
                            {getEstadoLabel(presupuesto.estado)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text c={presupuesto.minutos_asignado && presupuesto.minutos_asignado > 20 ? 'orange' : 'dimmed'}>
                            {presupuesto.minutos_asignado || 0} min
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <ActionIcon
                              variant="transparent"
                              color="blue"
                              onClick={() => verDetallePresupuesto(presupuesto)}
                            >
                              <EyeIcon style={{ width: 20, height: 20 }} />
                            </ActionIcon>
                            <Button
                              size="xs"
                              color="green"
                              onClick={() => setSelectedPresupuesto(presupuesto)}
                            >
                              Auditar
                            </Button>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            </Paper>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="historial" pt="md">
          <ListaPresupuestos 
            onEditarPresupuesto={() => {}} 
            recargarTrigger={0} 
            esAuditor={true}
            onVerDetalle={verDetallePresupuesto}
          />
        </Tabs.Panel>

        <Tabs.Panel value="notificaciones" pt="md">
          <Notificaciones onIrAuditoria={(presupuestoId) => {
            setActiveTab('pendientes');
            setFiltroPresupuestoId(presupuestoId.toString());
          }} />
        </Tabs.Panel>
      </Tabs>

      <ModalAuditoriaMulti
        opened={selectedPresupuesto !== null}
        onClose={() => setSelectedPresupuesto(null)}
        presupuesto={selectedPresupuesto}
        rol={rol}
        onSuccess={() => {
          cargarDatos();
          setSelectedPresupuesto(null);
        }}
      />

      <ModalDetallePresupuesto
        opened={modalDetalleAbierto}
        onClose={() => {
          setModalDetalleAbierto(false);
          setPresupuestoDetalle(null);
        }}
        presupuesto={presupuestoDetalle}
      />
    </Container>
  );
};

export default GerenciaDashboard;
