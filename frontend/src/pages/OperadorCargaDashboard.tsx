import React, { useState, useEffect, useCallback } from 'react';
import { Title, Text, Table, Button, Badge, Group, Paper, Loader, Center, Tabs, ActionIcon, TextInput, Alert, Modal, Stack, Textarea, Select } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/api';
import { ArrowRightStartOnRectangleIcon, UserCircleIcon, BellIcon, ClockIcon, EyeIcon, MagnifyingGlassIcon, XMarkIcon, CheckIcon, ArrowUturnLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ConnectionStatus } from '../components/ConnectionStatus';
import ResponsiveContainer from '../components/ResponsiveContainer';
import Notificaciones from './Notificaciones';
import { ModalDetallePresupuesto } from '../components/ModalDetallePresupuesto';
import ListaPresupuestosCarga from '../components/ListaPresupuestosCarga';

interface CasoPendiente {
  idPresupuestos: number;
  Nombre_Apellido: string;
  DNI: string;
  total_facturar: number;
  sucursal_nombre: string;
  financiador_nombre: string;
  horas_pendiente: number;
}

interface CasoEnProceso {
  idPresupuestos: number;
  Nombre_Apellido: string;
  DNI: string;
  total_facturar: number;
  sucursal_nombre: string;
  financiador_nombre: string;
  minutos_en_proceso: number;
}

export default function OperadorCargaDashboard() {
  const { user, logout } = useAuth();
  const [casosPendientes, setCasosPendientes] = useState<CasoPendiente[]>([]);
  const [casosEnProceso, setCasosEnProceso] = useState<CasoEnProceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('carga');
  const [filtroPresupuestoId, setFiltroPresupuestoId] = useState<string>('');
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  
  // Modal states
  const [modalOpened, setModalOpened] = useState(false);
  const [modalType, setModalType] = useState<'cargar' | 'devolver'>('cargar');
  const [modalData, setModalData] = useState<any>(null);
  const [referenciaExterna, setReferenciaExterna] = useState('');
  const [destinoDevolucion, setDestinoDevolucion] = useState<string>('');
  const [motivoDevolucion, setMotivoDevolucion] = useState('');
  const [procesando, setProcesando] = useState(false);

  // Estados para modal de detalle
  const [presupuestoDetalle, setPresupuestoDetalle] = useState<any>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const fetchCasos = useCallback(async () => {
    try {
      setLoading(true);
      const [pendientesRes, procesoRes, notifRes] = await Promise.all([
        api.get('/carga/pendientes'),
        api.get('/carga/en-proceso'),
        api.get('/notificaciones/count')
      ]);
      
      setCasosPendientes(pendientesRes.data.data || []);
      setCasosEnProceso(procesoRes.data.data || []);
      setNotificacionesNoLeidas(notifRes.data.count || 0);
    } catch (error) {
      console.error('Error fetching casos:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al cargar casos de carga',
        color: 'red',
        position: 'top-center'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCasos();
    const interval = setInterval(fetchCasos, 30000);
    
    // Escuchar eventos SSE para actualizar notificaciones
    const backendUrl = (import.meta as any).env?.VITE_API_URL || '';
    const eventSource = new EventSource(`${backendUrl}/api/sse/updates`, {
      withCredentials: true
    });

    eventSource.addEventListener('notificacion-leida', () => {
      // Actualizar contador de notificaciones
      api.get('/notificaciones/count').then(res => {
        setNotificacionesNoLeidas(res.data.count || 0);
      });
    });

    return () => {
      clearInterval(interval);
      eventSource.close();
    };
  }, [fetchCasos]);

  const tomarCaso = async (presupuestoId: number) => {
    try {
      setProcesando(true);
      await api.post(`/carga/${presupuestoId}/tomar`, {});
      
      notifications.show({
        title: 'Caso Tomado',
        message: 'El caso ha sido asignado exitosamente',
        color: 'green',
        position: 'top-center'
      });
      
      await fetchCasos();
      
      // Buscar el caso en los casos en proceso después de recargar
      const casoTomado = casosEnProceso.find(c => c.idPresupuestos === presupuestoId);
      if (casoTomado) {
        await verDetallePresupuesto(casoTomado);
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Error al tomar el caso',
        color: 'red',
        position: 'top-center'
      });
    } finally {
      setProcesando(false);
    }
  };

  const verDetallePresupuesto = async (caso: any) => {
    try {
      const response = await api.get(`/presupuestos/${caso.idPresupuestos}`);
      setPresupuestoDetalle(response.data);
      setModalDetalleAbierto(true);
    } catch (error) {
      console.error('Error cargando detalle:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al cargar detalles del presupuesto',
        color: 'red',
        position: 'top-center'
      });
    }
  };

  const openModal = (type: 'cargar' | 'devolver', caso: any) => {
    setModalType(type);
    setModalData(caso);
    setReferenciaExterna('');
    setDestinoDevolucion('');
    setMotivoDevolucion('');
    setModalOpened(true);
  };

  const closeModal = () => {
    setModalOpened(false);
    setModalData(null);
    setReferenciaExterna('');
    setDestinoDevolucion('');
    setMotivoDevolucion('');
  };

  const marcarComoCargado = async () => {
    if (!referenciaExterna.trim()) {
      notifications.show({
        title: 'Error',
        message: 'La referencia externa es requerida',
        color: 'red',
        position: 'top-center'
      });
      return;
    }

    try {
      setProcesando(true);
      await api.post(`/carga/${modalData.idPresupuestos}/marcar-cargado`, {
        referencia_externa: referenciaExterna.trim()
      });
      
      notifications.show({
        title: 'Presupuesto Cargado',
        message: `Presupuesto cargado exitosamente con referencia: ${referenciaExterna.trim()}`,
        color: 'green',
        position: 'top-center',
        autoClose: 5000
      });
      
      closeModal();
      await fetchCasos();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Error al marcar como cargado',
        color: 'red',
        position: 'top-center'
      });
    } finally {
      setProcesando(false);
    }
  };

  const devolverPresupuesto = async () => {
    if (!destinoDevolucion) {
      notifications.show({
        title: 'Error',
        message: 'Debe seleccionar un destino de devolución',
        color: 'red',
        position: 'top-center'
      });
      return;
    }

    if (!motivoDevolucion.trim() || motivoDevolucion.trim().length < 10) {
      notifications.show({
        title: 'Error',
        message: 'El motivo debe tener al menos 10 caracteres',
        color: 'red',
        position: 'top-center'
      });
      return;
    }

    try {
      setProcesando(true);
      await api.post(`/carga/${modalData.idPresupuestos}/devolver`, {
        destino: destinoDevolucion,
        motivo: motivoDevolucion.trim()
      });
      
      const destinoTexto = {
        usuario: 'Usuario Creador',
        administrativa: 'Gerencia Prestacional',
        prestacional: 'Gerencia Comercial',
        general: 'Gerencia General'
      }[destinoDevolucion];
      
      notifications.show({
        title: 'Presupuesto Devuelto',
        message: `Presupuesto devuelto a ${destinoTexto} exitosamente`,
        color: 'blue',
        position: 'top-center',
        autoClose: 5000
      });
      
      closeModal();
      await fetchCasos();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Error al devolver presupuesto',
        color: 'red',
        position: 'top-center'
      });
    } finally {
      setProcesando(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  const getBadgeColor = (horas: number) => {
    if (horas < 2) return 'green';
    if (horas < 6) return 'yellow';
    return 'red';
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  const pendientesFiltrados = casosPendientes.filter(p => 
    !filtroPresupuestoId || p.idPresupuestos.toString().includes(filtroPresupuestoId)
  );

  return (
    <>
      <ResponsiveContainer style={{ paddingLeft: 'var(--mantine-spacing-xs)', paddingRight: 'var(--mantine-spacing-xs)' }} py="md">
        <Group justify="space-between" mb={20}>
          <Title fw={500} order={2} c="blue">Dashboard Operador de Carga</Title>
          <Group gap="xs">
            <UserCircleIcon style={{ width: 20, height: 20 }} />
            <Text fw={500} size="sm" tt="capitalize">{user?.username}</Text>
            <ConnectionStatus isConnected={true} />
            <Button ml="md" variant="outline" color="red" size="xs" onClick={logout} rightSection={<ArrowRightStartOnRectangleIcon style={{ width: 20, height: 20 }}/>}>
              Salir
            </Button>
          </Group>
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab} color="blue" radius="md">
          <Tabs.List>
            <Tabs.Tab value="notificaciones">
              <Group gap="xs">
                <BellIcon style={{ width: 20, height: 20 }} />
                Notificaciones
                {notificacionesNoLeidas > 0 && <Badge size="sm" circle>{notificacionesNoLeidas}</Badge>}
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="carga">
              <Group gap="xs">
                <ClockIcon style={{ width: 20, height: 20 }} />
                Carga
                {(casosPendientes.length + casosEnProceso.length) > 0 && <Badge size="sm" circle>{casosPendientes.length + casosEnProceso.length}</Badge>}
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="historial">
              <Group gap="xs">
                <ClockIcon style={{ width: 20, height: 20 }} />
                Historial
              </Group>
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="notificaciones" pt="md">
            <Notificaciones onIrAuditoria={(presupuestoId) => {
              setActiveTab('carga');
              setFiltroPresupuestoId(presupuestoId.toString());
            }} />
          </Tabs.Panel>

          <Tabs.Panel value="carga" pt="md">
            {/* Casos Pendientes */}
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
                  <Table striped highlightOnHover fontSize="xs">
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Paciente</Table.Th>
                        <Table.Th>DNI</Table.Th>
                        <Table.Th>Monto</Table.Th>
                        <Table.Th>Sucursal</Table.Th>
                        <Table.Th>Financiador</Table.Th>
                        <Table.Th>Tiempo Pendiente</Table.Th>
                        <Table.Th>Acciones</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {pendientesFiltrados.map((caso) => (
                        <Table.Tr key={caso.idPresupuestos}>
                          <Table.Td>
                            <div>
                              <Text size="sm">{caso.Nombre_Apellido}</Text>
                              <Text size="xs" c="dimmed">ID: {caso.idPresupuestos}</Text>
                            </div>
                          </Table.Td>
                          <Table.Td><Text size="sm">{caso.DNI}</Text></Table.Td>
                          <Table.Td><Text size="sm">{formatCurrency(caso.total_facturar)}</Text></Table.Td>
                          <Table.Td><Text size="sm">{caso.sucursal_nombre}</Text></Table.Td>
                          <Table.Td><Text size="sm">{caso.financiador_nombre}</Text></Table.Td>
                          <Table.Td>
                            <Text size="sm" c={caso.horas_pendiente && caso.horas_pendiente > 7 ? 'red' : 'dimmed'}>
                              {caso.horas_pendiente} hora{caso.horas_pendiente !== 1 ? 's' : ''}
                            </Text>
                          </Table.Td>
                          <Table.Td>
                            <Group gap={4} wrap="nowrap">
                              <ActionIcon
                                variant="transparent"
                                color="blue"
                                onClick={() => verDetallePresupuesto(caso)}
                                title="Ver detalle"
                              >
                                <EyeIcon style={{ width: 16, height: 16 }} />
                              </ActionIcon>
                              <Button
                                size="xs"
                                onClick={() => tomarCaso(caso.idPresupuestos)}
                                loading={procesando}
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

            {/* Mis Casos */}
            {casosEnProceso.length > 0 && (
              <>
                <Alert icon={<ExclamationTriangleIcon style={{ width: 20, height: 20 }} />} color="blue" mt="xl" mb="md">
                  Los casos se liberan automáticamente después de 30 minutos de inactividad
                </Alert>
                <Paper withBorder radius="md" shadow="sm">
                  <Table.ScrollContainer minWidth={800}>
                    <Table striped highlightOnHover fontSize="xs">
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Paciente</Table.Th>
                          <Table.Th>DNI</Table.Th>
                          <Table.Th>Monto</Table.Th>
                          <Table.Th>Tiempo Asignado</Table.Th>
                          <Table.Th>Acciones</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {casosEnProceso.map((caso) => (
                          <Table.Tr key={caso.idPresupuestos}>
                            <Table.Td>
                              <div>
                                <Text size="sm">{caso.Nombre_Apellido}</Text>
                                <Text size="xs" c="dimmed">ID: {caso.idPresupuestos}</Text>
                              </div>
                            </Table.Td>
                            <Table.Td><Text size="sm">{caso.DNI}</Text></Table.Td>
                            <Table.Td><Text size="sm">{formatCurrency(caso.total_facturar)}</Text></Table.Td>
                            <Table.Td>
                              <Text size="sm" c={caso.minutos_en_proceso && caso.minutos_en_proceso > 20 ? 'orange' : 'dimmed'}>
                                {caso.minutos_en_proceso || 0} min
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Group gap={4} wrap="nowrap">
                                <ActionIcon
                                  variant="transparent"
                                  color="blue"
                                  onClick={() => verDetallePresupuesto(caso)}
                                >
                                  <EyeIcon style={{ width: 16, height: 16 }} />
                                </ActionIcon>
                                <Button
                                  size="xs"
                                  color="green"
                                  onClick={() => openModal('cargar', caso)}
                                >
                                  Marcar Cargado
                                </Button>
                                <Button
                                  size="xs"
                                  variant="light"
                                  color="orange"
                                  onClick={() => openModal('devolver', caso)}
                                >
                                  Devolver
                                </Button>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                </Paper>
              </>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="historial" pt="md">
            <ListaPresupuestosCarga onVerDetalle={verDetallePresupuesto} />
          </Tabs.Panel>
        </Tabs>

        {/* Modal para Marcar como Cargado */}
        <Modal
          opened={modalOpened && modalType === 'cargar'}
          onClose={closeModal}
          title="Marcar como Cargado"
          size="md"
        >
          <Stack>
            <Alert color="blue" title="Presupuesto">
              <Text size="sm">
                <strong>ID:</strong> {modalData?.idPresupuestos}<br />
                <strong>Paciente:</strong> {modalData?.Nombre_Apellido}<br />
                <strong>Monto:</strong> {modalData && formatCurrency(modalData.total_facturar)}
              </Text>
            </Alert>
            
            <TextInput
              label="Referencia en Softwerk"
              placeholder="Ej: SIST-2025-001234"
              value={referenciaExterna}
              onChange={(e) => setReferenciaExterna(e.currentTarget.value)}
              required
              description="Ingrese el ID o código de referencia de Softwerk"
            />
            
            <Group justify="flex-end">
              <Button variant="light" onClick={closeModal}>
                Cancelar
              </Button>
              <Button 
                color="green" 
                onClick={marcarComoCargado}
                loading={procesando}
                disabled={!referenciaExterna.trim()}
              >
                Marcar como Cargado
              </Button>
            </Group>
          </Stack>
        </Modal>

        {/* Modal para Devolver */}
        <Modal
          opened={modalOpened && modalType === 'devolver'}
          onClose={closeModal}
          title="Devolver Presupuesto"
          size="md"
        >
          <Stack>
            <Alert color="orange" title="Presupuesto">
              <Text size="sm">
                <strong>ID:</strong> {modalData?.idPresupuestos}<br />
                <strong>Paciente:</strong> {modalData?.Nombre_Apellido}<br />
                <strong>Monto:</strong> {modalData && formatCurrency(modalData.total_facturar)}
              </Text>
            </Alert>
            
            <Select
              label="Devolver a"
              placeholder="Seleccionar destino"
              value={destinoDevolucion}
              onChange={(value) => setDestinoDevolucion(value || '')}
              data={[
                { value: 'usuario', label: 'Usuario Creador (borrador)' },
                { value: 'administrativa', label: 'Gerencia Prestacional' },
                { value: 'prestacional', label: 'Gerencia Comercial' },
                { value: 'general', label: 'Gerencia General' }
              ]}
              required
            />
            
            <Textarea
              label="Motivo de devolución"
              placeholder="Describa el motivo de la devolución..."
              value={motivoDevolucion}
              onChange={(e) => setMotivoDevolucion(e.currentTarget.value)}
              required
              minRows={3}
              description="Mínimo 10 caracteres"
            />
            
            <Group justify="flex-end">
              <Button variant="light" onClick={closeModal}>
                Cancelar
              </Button>
              <Button 
                color="orange" 
                onClick={devolverPresupuesto}
                loading={procesando}
                disabled={!destinoDevolucion || motivoDevolucion.trim().length < 10}
              >
                Devolver
              </Button>
            </Group>
          </Stack>
        </Modal>
      </ResponsiveContainer>

      <ModalDetallePresupuesto
        opened={modalDetalleAbierto}
        onClose={() => {
          setModalDetalleAbierto(false);
          setPresupuestoDetalle(null);
        }}
        presupuesto={presupuestoDetalle}
      />
    </>
  );
}
