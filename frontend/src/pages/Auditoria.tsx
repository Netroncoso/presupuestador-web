import { useState, useEffect } from 'react';
import { Table, Paper, Badge, Loader, Text, ActionIcon, Alert, Group } from '@mantine/core';
import { ModalAuditoria } from '../components/ModalAuditoria';
import { notifications } from '@mantine/notifications';
import { ShieldCheckIcon, EyeIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { api } from '../api/api';

const ICON_SIZE = { width: 16, height: 16 };
const ICON_SIZE_LG = { width: 20, height: 20 };

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
  idobra_social?: string;
}

interface AuditoriaProps {
  onCargarPresupuesto?: (presupuesto: any) => void;
  filtroPresupuesto?: number | null;
  onLimpiarFiltro?: () => void;
}

const Auditoria: React.FC<AuditoriaProps> = ({ onCargarPresupuesto, filtroPresupuesto, onLimpiarFiltro }) => {
  const [pendientes, setPendientes] = useState<PresupuestoPendiente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<PresupuestoPendiente | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    cargarPendientes();
    
    // Auto-refresh every 45 seconds for auditors
    const interval = setInterval(cargarPendientes, 45000);
    return () => clearInterval(interval);
  }, [filtroPresupuesto]);

  const cargarPendientes = async () => {
    try {
      const response = await api.get('/auditoria/pendientes');
      let data = response.data;
      
      if (filtroPresupuesto) {
        data = data.filter((p: PresupuestoPendiente) => p.idPresupuestos === filtroPresupuesto);
      }
      
      setPendientes(data);
    } catch (error) {
      console.error('Error cargando pendientes:', error);
      setPendientes([]);
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (presupuesto: PresupuestoPendiente) => {
    setSelectedPresupuesto(presupuesto);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setSelectedPresupuesto(null);
  };

  const cambiarEstado = async (mensaje: string) => {
    if (!selectedPresupuesto) return;
    
    const [accion, comentario] = mensaje.includes(':') ? mensaje.split(': ', 2) : ['', mensaje];
    const nuevoEstado = accion.toLowerCase() === 'aprobado' ? 'aprobado' : 'rechazado';
    
    setProcesando(true);
    try {
      await api.put(`/auditoria/estado/${selectedPresupuesto.idPresupuestos}`, {
        estado: nuevoEstado,
        comentario: comentario || null
      });
      
      await cargarPendientes();
      cerrarModal();
      
      notifications.show({
        title: 'Auditoría Completada',
        message: `Presupuesto ${nuevoEstado.toUpperCase()} correctamente`,
        color: nuevoEstado === 'aprobado' ? 'green' : 'red',
        position: 'top-center',
        autoClose: false,
      });
      
    } catch (error) {
      console.error('Error cambiando estado:', error);
      notifications.show({
        title: 'Error',
        message: 'Error al cambiar estado del presupuesto',
        color: 'red',
        position: 'top-center',
        autoClose: false,
      });
    } finally {
      setProcesando(false);
    }
  };

  const verDetallePresupuesto = async (presupuesto: PresupuestoPendiente) => {
    if (onCargarPresupuesto) {
      // Cargar el presupuesto completo en el dashboard
      onCargarPresupuesto({
        idPresupuestos: presupuesto.idPresupuestos,
        Nombre_Apellido: presupuesto.Nombre_Apellido,
        DNI: presupuesto.DNI,
        Sucursal: presupuesto.Sucursal,
        idobra_social: presupuesto.idobra_social
      });
    }
  };

  const auditarPresupuesto = (presupuesto: PresupuestoPendiente) => {
    abrirModal(presupuesto);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      {filtroPresupuesto && (
        <Alert mb="md" color="blue" withCloseButton onClose={onLimpiarFiltro}>
          Mostrando solo presupuesto #{filtroPresupuesto}
        </Alert>
      )}
      <Group justify="space-between" mb="md">
        <Text size="lg" fw={600}>
          Auditoría Médica - {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
        </Text>
        <ActionIcon 
          variant="subtle" 
          onClick={cargarPendientes}
          title="Actualizar lista de auditoría"
        >
          <ArrowPathIcon style={ICON_SIZE} />
        </ActionIcon>
      </Group>

      {pendientes.length === 0 ? (
        <Text ta="center" c="dimmed" py="xl">
        No hay presupuestos pendientes de revisión
        </Text>
      ) : (
        <Table striped="odd" highlightOnHover stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>ID</Table.Th>
              <Table.Th>Paciente</Table.Th>
              <Table.Th>Versión</Table.Th>
              <Table.Th>Costo Total</Table.Th>
              <Table.Th>Rentabilidad</Table.Th>
              <Table.Th>Días Pendiente</Table.Th>
              <Table.Th>Creador</Table.Th>
              <Table.Th>Acción</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {pendientes.map((presupuesto) => (
              <Table.Tr key={presupuesto.idPresupuestos}>
                <Table.Td>{presupuesto.idPresupuestos}</Table.Td>
                <Table.Td>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{presupuesto.Nombre_Apellido}</span><br/>
                  <span style={{ fontSize: '12px', color: '#868e96' }}>DNI: {presupuesto.DNI}</span>
                  {presupuesto.dificil_acceso === 'SI' && (
                    <><br/><Badge size="xs" color="orange">Difícil Acceso</Badge></>
                  )}
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" color="blue">v{presupuesto.version}</Badge>
                </Table.Td>
                <Table.Td>${Number(presupuesto.costo_total || 0).toLocaleString()}</Table.Td>
                <Table.Td>
                  <Badge 
                    variant="dot" 
                    color={Number(presupuesto.rentabilidad || 0) >= 15 ? 'green' : 'red'}
                  >
                    {Number(presupuesto.rentabilidad || 0).toFixed(1)}%
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <Badge 
                    variant="light" 
                    color={presupuesto.dias_pendiente > 7 ? 'red' : presupuesto.dias_pendiente > 3 ? 'orange' : 'gray'}
                  >
                    {presupuesto.dias_pendiente} día{presupuesto.dias_pendiente !== 1 ? 's' : ''}
                  </Badge>
                </Table.Td>
                <Table.Td>
                  <span style={{ fontSize: '14px' }}>{presupuesto.creador}</span><br/>
                  <span style={{ fontSize: '12px', color: '#868e96' }}>{presupuesto.sucursal_nombre}</span>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon 
                      variant="transparent" 
                      color="blue"
                      onClick={() => verDetallePresupuesto(presupuesto)}
                      title="Ver detalle del presupuesto"
                    >
                      <EyeIcon style={ICON_SIZE_LG} />
                    </ActionIcon>
                    <ActionIcon 
                      variant="transparent" 
                      color="orange"
                      onClick={() => auditarPresupuesto(presupuesto)}
                      title="Auditar presupuesto"
                    >
                      <ShieldCheckIcon style={ICON_SIZE_LG} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}

      {selectedPresupuesto && (
        <ModalAuditoria
          opened={modalAbierto}
          onClose={cerrarModal}
          tipo="auditar"
          presupuesto={{
            id: selectedPresupuesto.idPresupuestos,
            nombre: selectedPresupuesto.Nombre_Apellido,
            dni: selectedPresupuesto.DNI,
            costoTotal: selectedPresupuesto.costo_total,
            rentabilidad: selectedPresupuesto.rentabilidad,
            version: selectedPresupuesto.version
          }}
          onConfirmar={cambiarEstado}
          loading={procesando}
        />
      )}
    </Paper>
  );
};

export default Auditoria;