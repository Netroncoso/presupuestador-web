import React, { useState, useEffect } from 'react';
import { Table, Paper, Badge, Loader, Text, ActionIcon, Group, Button, Modal, TextInput, Select } from '@mantine/core';
import { CheckIcon, ShieldCheckIcon, EyeIcon, ArrowPathIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/api';

const ICON_SIZE = { width: 16, height: 16 };
const ICON_SIZE_LG = { width: 20, height: 20 };

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
  const [filtroEstado, setFiltroEstado] = useState<string>('');
  const [filtroPaciente, setFiltroPaciente] = useState<string>('');
  const [filtroPresupuesto, setFiltroPresupuesto] = useState<string>('');
  
  const rolesGerencia = ['gerencia_administrativa', 'gerencia_prestacional', 'gerencia_general'];
  const esAuditor = user?.rol ? rolesGerencia.includes(user.rol) : false;

  const getOrigenNotificacion = (notif: Notificacion): string => {
    if (notif.tipo === 'pendiente') {
      if (notif.mensaje.includes('derivado') || notif.mensaje.includes('devuelto por')) {
        if (notif.mensaje.includes('G. Administrativa') || notif.mensaje.includes('Gerencia Administrativa')) return 'G. Admin';
        if (notif.mensaje.includes('G. Prestacional') || notif.mensaje.includes('Gerencia Prestacional')) return 'G. Prest';
        if (notif.mensaje.includes('G. General') || notif.mensaje.includes('Gerencia General')) return 'G. Gral';
      }
      return 'Usuario';
    }
    if (notif.mensaje.includes('G. Administrativa') || notif.mensaje.includes('Gerencia Administrativa')) return 'G. Admin';
    if (notif.mensaje.includes('G. Prestacional') || notif.mensaje.includes('Gerencia Prestacional')) return 'G. Prest';
    if (notif.mensaje.includes('G. General') || notif.mensaje.includes('Gerencia General')) return 'G. Gral';
    return 'Sistema';
  };

  useEffect(() => {
    fetchNotifications();
    
    // Auto-refresh every 60 seconds as fallback
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [filtroEstado, filtroPaciente, filtroPresupuesto]);

  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams({ limit: '20' });
      if (filtroEstado) params.append('estado', filtroEstado);
      if (filtroPaciente) params.append('paciente', filtroPaciente);
      if (filtroPresupuesto) params.append('presupuesto_id', filtroPresupuesto);
      
      const response = await api.get(`/notificaciones?${params.toString()}`);
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
        <Group gap="xs">
          <Text size="lg" fw={600}>
            Notificaciones - {nuevas} nueva{nuevas !== 1 ? 's' : ''}
          </Text>
          <ActionIcon 
            variant="transparent" 
            color="blue" 
            size="sm"
            onClick={fetchNotifications}
            title="Actualizar notificaciones"
          >
            <ArrowPathIcon style={{ width: 16, height: 16 }} />
          </ActionIcon>
        </Group>
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

      <Group mb="md" grow>
        <Select
          placeholder="Filtrar por estado"
          value={filtroEstado}
          onChange={(value) => setFiltroEstado(value || '')}
          data={[
            { value: '', label: 'Todas las notificaciones' },
            { value: 'nuevo', label: 'Solo no leídas' },
            { value: 'leido', label: 'Solo leídas' }
          ]}
          clearable
        />
        <TextInput
          placeholder="Buscar por paciente"
          leftSection={<MagnifyingGlassIcon style={ICON_SIZE} color='black'/>}
          value={filtroPaciente}
          onChange={(e) => setFiltroPaciente(e.currentTarget.value)}
          rightSection={
            filtroPaciente ? (
              <ActionIcon variant="subtle" onClick={() => setFiltroPaciente('')}>
                <XMarkIcon style={ICON_SIZE} />
              </ActionIcon>
            ) : null
          }
        />
        <TextInput
          placeholder="Filtrar por presupuesto ID"
          value={filtroPresupuesto}
          onChange={(e) => setFiltroPresupuesto(e.currentTarget.value)}
          type="number"
          rightSection={
            filtroPresupuesto ? (
              <ActionIcon variant="subtle" onClick={() => setFiltroPresupuesto('')}>
                <XMarkIcon style={ICON_SIZE} />
              </ActionIcon>
            ) : null
          }
        />
      </Group>

      {notifications.length === 0 ? (
        <Text ta="center" c="dimmed" py="xl">
          {filtroEstado === 'nuevo' ? 'No hay notificaciones no leídas' : 
           filtroEstado === 'leido' ? 'No hay notificaciones leídas' :
           'No hay notificaciones'}
        </Text>
      ) : (
        <Table.ScrollContainer minWidth={900}>
          <Table striped="odd" highlightOnHover stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Estado</Table.Th>
              {!esAuditor && <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Tipo</Table.Th>}
              <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Presupuesto</Table.Th>
              <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Paciente</Table.Th>
              <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Asunto</Table.Th>
              <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Fecha</Table.Th>
              <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Acción</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {notifications.map((notif: Notificacion, index: number) => (
              <Table.Tr 
                key={`${notif.id}-${index}`}
                style={{ 
                  backgroundColor: notif.estado === 'nuevo' ? '#f0f9ff' : undefined,
                  fontWeight: notif.estado === 'nuevo' ? 500 : 400
                }}
              >
                <Table.Td>
                  <Text size="sm" c={notif.estado === 'nuevo' ? 'blue' : 'gray'} fw={500}>
                    {notif.estado === 'nuevo' ? 'Nuevo' : 'Leído'}
                  </Text>
                </Table.Td>
                {!esAuditor && (
                  <Table.Td>
                    <Text fw={400} fz="xs" c={getColorTipo(notif.tipo)}>
                      {notif.tipo.toUpperCase()}
                    </Text>
                  </Table.Td>
                )}
                <Table.Td>
                  <Text size="sm" span>
                    #{notif.presupuesto_id} <Text size="xs" c="dimmed" span>(v{notif.version_presupuesto})</Text>
                  </Text>
                </Table.Td>
                <Table.Td>
                  <span style={{ fontSize: '14px' }}>{notif.paciente}</span><br/>
                  <span style={{ fontSize: '12px', color: '#868e96' }}>DNI: {notif.dni_paciente}</span>
                </Table.Td>
                <Table.Td>
                  <span style={{ fontSize: '14px' }}>
                    {notif.tipo === 'pendiente' ? 'Auditoría Solicitada' :
                     notif.tipo === 'aprobado_condicional' ? 'Aprobado Condicional' :
                     notif.tipo === 'aprobado' ? 'Aprobado' :
                     notif.tipo === 'rechazado' ? 'Rechazado' :
                     notif.tipo === 'observado' ? 'Observado' :
                     'Notificación'}
                    {' - '}
                    <Text size="xs" c="dimmed" span>
                      {getOrigenNotificacion(notif)}
                    </Text>
                  </span>
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
                      variant="transparent"
                      color="blue" 
                      onClick={() => abrirModal(notif)}
                      title="Ver detalle"
                    >
                      <EyeIcon style={ICON_SIZE_LG} />
                    </ActionIcon>
                    {notif.estado === 'nuevo' && (
                      <ActionIcon 
                        variant="transparent"
                        color="green" 
                        onClick={() => markAsRead(notif.id)}
                        title="Marcar como leída"
                      >
                        <CheckIcon style={ICON_SIZE_LG} />
                      </ActionIcon>
                    )}
                    {notif.tipo === 'pendiente' && onIrAuditoria && (
                      <ActionIcon 
                        variant="transparent" 
                        color="orange" 
                        onClick={() => onIrAuditoria(notif.presupuesto_id)}
                        title="Ir a auditoría"
                        
                      >
                        <ShieldCheckIcon style={ICON_SIZE_LG} />
                      </ActionIcon>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        </Table.ScrollContainer>
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