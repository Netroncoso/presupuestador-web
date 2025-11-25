import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Table, Button, Badge, Group, Paper, Loader, Center, Tabs, ActionIcon, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import { useNotificationCount } from '../hooks/useNotificationCount';
import { api } from '../api/api';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { ArrowRightStartOnRectangleIcon, UserCircleIcon, BellIcon, ShieldCheckIcon, ClockIcon, EyeIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { NotificationIndicator } from '../components/NotificationIndicator';
import { ModalAuditoria } from '../components/ModalAuditoria';
import { ModalDetallePresupuesto } from '../components/ModalDetallePresupuesto';
import Notificaciones from './Notificaciones';
import ListaPresupuestos from './ListaPresupuestos';

interface PresupuestoPendiente {
  idPresupuestos: number;
  version: number;
  estado: string;
  Nombre_Apellido: string;
  DNI: string;
  Sucursal: string;
  costo_total: number;
  rentabilidad: number;
  dificil_acceso: string;
  created_at: string;
  creador: string;
  sucursal_nombre: string;
  dias_pendiente: number;
}

const AuditorDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { count: notificationCount, isConnected } = useNotificationCount();
  const [pendientes, setPendientes] = useState<PresupuestoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<PresupuestoPendiente | null>(null);
  const [presupuestoDetalle, setPresupuestoDetalle] = useState<any>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>('pendientes');
  const [filtroPresupuestoId, setFiltroPresupuestoId] = useState<string>('');
  const { presupuestos } = useRealtimeUpdates();

  useEffect(() => {
    cargarPendientes();
  }, []);
  
  // Update pendientes when SSE data arrives
  useEffect(() => {
    if (presupuestos && presupuestos.length >= 0) {
      setPendientes(presupuestos);
      setLoading(false);
    }
  }, [presupuestos]);

  const cargarPendientes = async () => {
    try {
      const response = await api.get('/presupuestos/auditor/pendientes');
      setPendientes(response.data);
    } catch (error) {
      console.error('Error cargando pendientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuditoria = async (mensaje: string) => {
    if (!selectedPresupuesto) return;
    
    setProcesando(true);
    try {
      const [accion, comentario] = mensaje.includes(':') ? mensaje.split(': ', 2) : ['', mensaje];
      const estado = accion === 'APROBADO' ? 'aprobado' : accion === 'RECHAZADO' ? 'rechazado' : 'en_revision';
      
      await api.put(`/presupuestos/${selectedPresupuesto.idPresupuestos}/estado`, {
        estado,
        comentario: comentario?.trim() || null
      });
      
      await cargarPendientes();
      setSelectedPresupuesto(null);
      
      notifications.show({
        title: 'Estado Actualizado',
        message: `Presupuesto ${estado.toUpperCase()} correctamente`,
        color: estado === 'aprobado' ? 'green' : estado === 'rechazado' ? 'red' : 'blue'
      });
    } catch (error) {
      console.error('Error cambiando estado:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al cambiar estado',
        color: 'red'
      });
    } finally {
      setProcesando(false);
    }
  };

  const verDetallePresupuesto = async (presupuesto: PresupuestoPendiente) => {
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

  return (
    <Container fluid p="xl">
      <Group justify="space-between" mb={20}>
        <Title fw={500} order={2} c="blue">Dashboard Auditor Médico</Title>
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
              Presupuestos Pendientes
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
                {pendientes.filter(p => !filtroPresupuestoId || p.idPresupuestos.toString().includes(filtroPresupuestoId)).length} presupuesto{pendientes.length !== 1 ? 's' : ''} pendiente{pendientes.length !== 1 ? 's' : ''} de revisión
              </Text>
              <TextInput
                placeholder="Filtrar por ID de presupuesto"
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

          {pendientes.length === 0 ? (
            <Paper p="xl" withBorder radius="md" style={{ backgroundColor: '#f0f9ff' }}>
              <Center>
                <div>
                  <Text size="xl" fw={600} c="green" ta="center" mb="sm">✅ ¡Todo al día!</Text>
                  <Text c="dimmed" ta="center">No hay presupuestos pendientes de revisión</Text>
                </div>
              </Center>
            </Paper>
          ) : (
            <Paper withBorder radius="md" shadow="sm">
              <Table.ScrollContainer minWidth={800}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Paciente</Table.Th>
                      <Table.Th>Versión</Table.Th>
                      <Table.Th>Estado</Table.Th>
                      <Table.Th>Costo Total</Table.Th>
                      <Table.Th>Rentabilidad</Table.Th>
                      <Table.Th>Días Pendiente</Table.Th>
                      <Table.Th>Creador</Table.Th>
                      <Table.Th>Acciones</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {pendientes
                      .filter(presupuesto => !filtroPresupuestoId || presupuesto.idPresupuestos.toString().includes(filtroPresupuestoId))
                      .map((presupuesto) => (
                      <Table.Tr key={presupuesto.idPresupuestos}>
                        <Table.Td>
                          <div>
                            <Text fw={500}>{presupuesto.Nombre_Apellido}</Text>
                            <Text size="sm" c="dimmed">DNI: {presupuesto.DNI}</Text>
                            {presupuesto.dificil_acceso === 'SI' && (
                              <Badge size="xs" color="orange" mt={4}>Difícil Acceso</Badge>
                            )}
                          </div>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light">v{presupuesto.version}</Badge>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={presupuesto.estado === 'pendiente' ? 'yellow' : 'blue'}>
                            {presupuesto.estado.replace('_', ' ')}
                          </Badge>
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
                          <Text c={presupuesto.dias_pendiente > 7 ? 'red' : presupuesto.dias_pendiente > 3 ? 'orange' : 'dimmed'}>
                            {presupuesto.dias_pendiente} día{presupuesto.dias_pendiente !== 1 ? 's' : ''}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <div>
                            <Text size="sm">{presupuesto.creador}</Text>
                            <Text size="xs" c="dimmed">{presupuesto.sucursal_nombre}</Text>
                          </div>
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
                            <ActionIcon
                              variant="transparent"
                              color="green"
                              onClick={() => setSelectedPresupuesto(presupuesto)}
                              title="Auditar presupuesto"
                            >
                              <ShieldCheckIcon style={{ width: 20, height: 20 }} />
                            </ActionIcon>
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
            onVerDetalle={async (presupuesto) => {
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
            }}
          />
        </Tabs.Panel>

        <Tabs.Panel value="notificaciones" pt="md">
          <Notificaciones onIrAuditoria={(presupuestoId) => {
            // Cambiar a tab de pendientes
            setActiveTab('pendientes');
            // Filtrar por el ID del presupuesto de la notificación
            setFiltroPresupuestoId(presupuestoId.toString());
          }} />
        </Tabs.Panel>
      </Tabs>

      <ModalAuditoria
        opened={selectedPresupuesto !== null}
        onClose={() => setSelectedPresupuesto(null)}
        tipo="auditar"
        presupuesto={{
          id: selectedPresupuesto?.idPresupuestos || 0,
          nombre: selectedPresupuesto?.Nombre_Apellido || '',
          dni: selectedPresupuesto?.DNI || '',
          costoTotal: selectedPresupuesto?.costo_total,
          rentabilidad: selectedPresupuesto?.rentabilidad,
          version: selectedPresupuesto?.version
        }}
        onConfirmar={handleAuditoria}
        loading={procesando}
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

export default AuditorDashboard;