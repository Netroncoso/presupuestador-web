import React, { useState, useEffect } from 'react';
import { Table, Paper, Badge, Loader, Text, ActionIcon, Group, Button, Modal } from '@mantine/core';
import CheckIcon from '@heroicons/react/24/outline/CheckIcon';
import ShieldCheckIcon from '@heroicons/react/24/outline/ShieldCheckIcon';
import EyeIcon from '@heroicons/react/24/outline/EyeIcon';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/api';

const ICON_SIZE = { width: 16, height: 16 };

interface Notificacion {
  id: number;
  tipo: string;
  mensaje: string;
  estado: string;
  creado_en: string;
  presupuesto_id: number;
  version_presupuesto: number;
  paciente: string;
  dni_paciente: string;
  comentario?: string;
}

interface NotificacionesProps {
  onIrAuditoria?: (presupuestoId: number) => void;
}

const Notificaciones: React.FC<NotificacionesProps> = ({ onIrAuditoria }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [notificacionSeleccionada, setNotificacionSeleccionada] = useState<Notificacion | null>(null);
  
  const esAuditor = user?.rol === 'auditor_medico';

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notificaciones?limit=20');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notificaciones/${id}/leer`, {});
      setNotifications((prev: Notificacion[]) => 
        prev.map((notif: Notificacion) => 
          notif.id === id ? { ...notif, estado: 'leido' } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      await fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    setMarkingAllAsRead(true);
    try {
      await api.put('/notificaciones/leer-todas', {});
      setNotifications((prev: Notificacion[]) => 
        prev.map((notif: Notificacion) => ({ ...notif, estado: 'leido' }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      await fetchNotifications();
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const getColorTipo = (tipo: string) => {
    switch (tipo) {
      case 'aprobado': return '#40c057';
      case 'rechazado': return '#fa5252';
      case 'pendiente': return '#fd7e14';
      case 'nueva_version': return '#339af0';
      default: return '#868e96';
    }
  };

  const abrirModal = (notificacion: Notificacion) => {
    setNotificacionSeleccionada(notificacion);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setNotificacionSeleccionada(null);
  };

  if (loading) {
    return <Loader />;
  }

  const nuevas = notifications.filter((n: Notificacion) => n.estado === 'nuevo').length;

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={600}>
          Notificaciones - {nuevas} nueva{nuevas !== 1 ? 's' : ''}
        </Text>
        {nuevas > 0 && (
          <Button 
            size="xs" 
            onClick={markAllAsRead}
            loading={markingAllAsRead}
            disabled={markingAllAsRead}
          >
            Marcar todas como leídas
          </Button>
        )}
      </Group>

      {notifications.length === 0 ? (
        <Text ta="center" c="dimmed" py="xl">
          🔔 No hay notificaciones
        </Text>
      ) : (
        <Table striped="odd" highlightOnHover stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Estado</Table.Th>
              {!esAuditor && <Table.Th>Tipo</Table.Th>}
              <Table.Th>Presupuesto</Table.Th>
              <Table.Th>Paciente</Table.Th>
              <Table.Th>Mensaje</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Acción</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {notifications.map((notif: Notificacion) => (
              <Table.Tr 
                key={notif.id}
                style={{ 
                  backgroundColor: notif.estado === 'nuevo' ? '#f0f9ff' : undefined,
                  fontWeight: notif.estado === 'nuevo' ? 500 : 400
                }}
              >
                <Table.Td>
                  {notif.estado === 'nuevo' ? (
                    <Badge color="blue" variant="filled" size="sm">Nuevo</Badge>
                  ) : (
                    <Badge color="gray" variant="light" size="sm">Leído</Badge>
                  )}
                </Table.Td>
                {!esAuditor && (
                  <Table.Td>
                    <Text fw={400} fz="xs" c={getColorTipo(notif.tipo)}>
                      {notif.tipo.toUpperCase()}
                    </Text>
                  </Table.Td>
                )}
                <Table.Td>
                  <span style={{ fontSize: '14px' }}>#{notif.presupuesto_id}</span>
                  <Badge variant="outline" size="xs" ml="xs">
                    v{notif.version_presupuesto}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <span style={{ fontSize: '14px' }}>{notif.paciente}</span><br/>
                  <span style={{ fontSize: '12px', color: '#868e96' }}>DNI: {notif.dni_paciente}</span>
                </Table.Td>
                <Table.Td>
                  <span style={{ fontSize: '14px' }}>{notif.mensaje}</span>
                </Table.Td>
                <Table.Td>
                  <span style={{ fontSize: '12px', color: '#868e96' }}>
                    {new Date(notif.creado_en).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon 
                      variant="light" 
                      color="gray" 
                      onClick={() => abrirModal(notif)}
                      title="Ver detalle"
                    >
                      <EyeIcon style={ICON_SIZE} />
                    </ActionIcon>
                    {notif.estado === 'nuevo' && (
                      <ActionIcon 
                        variant="light" 
                        color="blue" 
                        onClick={() => markAsRead(notif.id)}
                        title="Marcar como leída"
                      >
                        <CheckIcon style={ICON_SIZE} />
                      </ActionIcon>
                    )}
                    {notif.tipo === 'pendiente' && onIrAuditoria && (
                      <ActionIcon 
                        variant="light" 
                        color="orange" 
                        onClick={() => onIrAuditoria(notif.presupuesto_id)}
                        title="Ir a auditoría"
                      >
                        <ShieldCheckIcon style={ICON_SIZE} />
                      </ActionIcon>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      <Modal 
        opened={modalAbierto} 
        onClose={cerrarModal} 
        title="Detalle de Notificación"
        size="md"
      >
        {notificacionSeleccionada && (
          <div>
            <Text size="sm" mb="md">
              <strong>Tipo:</strong> {notificacionSeleccionada.tipo.toUpperCase()}
            </Text>
            <Text size="sm" mb="md">
              <strong>Presupuesto:</strong> #{notificacionSeleccionada.presupuesto_id} v{notificacionSeleccionada.version_presupuesto}
            </Text>
            <Text size="sm" mb="md">
              <strong>Paciente:</strong> {notificacionSeleccionada.paciente} (DNI: {notificacionSeleccionada.dni_paciente})
            </Text>
            <Text size="sm" mb="md">
              <strong>Fecha:</strong> {new Date(notificacionSeleccionada.creado_en).toLocaleString('es-AR')}
            </Text>
            <Text size="sm" mb="md">
              <strong>Mensaje:</strong>
            </Text>
            <Paper p="md" withBorder style={{ backgroundColor: '#f8f9fa' }}>
              <Text size="sm">{notificacionSeleccionada.mensaje}</Text>
            </Paper>
            {notificacionSeleccionada.comentario && (
              <>
                <Text size="sm" mb="md" mt="md">
                  <strong>Comentario del Auditor:</strong>
                </Text>
                <Paper p="md" withBorder style={{ backgroundColor: '#fff3cd' }}>
                  <Text size="sm">{notificacionSeleccionada.comentario}</Text>
                </Paper>
              </>
            )}
          </div>
        )}
      </Modal>
    </Paper>
  );
};

export default Notificaciones;