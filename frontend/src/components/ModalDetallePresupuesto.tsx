import React, { useEffect, useState } from 'react';
import { Modal, Stack, Group, Badge, Paper, Title, Text, Accordion, Timeline, Table } from '@mantine/core';
import { getEstadoBadgeColor, getEstadoLabel } from '../utils/estadoPresupuesto';
import { api } from '../api/api';

interface ModalDetallePresupuestoProps {
  opened: boolean;
  onClose: () => void;
  presupuesto: any;
}

const getAccionDescripcion = (estadoAnterior: string, estadoNuevo: string, auditor: string) => {
  if (estadoNuevo === 'pendiente_administrativa') {
    return `${auditor} solicitó auditoría`;
  }
  
  const acciones: Record<string, string> = {
    'en_revision_administrativa_pendiente_prestacional': 'derivó a G. Prestacional',
    'en_revision_prestacional_pendiente_general': 'escaló a G. General',
    'en_revision_administrativa_aprobado': 'aprobó',
    'en_revision_prestacional_aprobado': 'aprobó',
    'en_revision_general_aprobado': 'aprobó',
    'en_revision_administrativa_aprobado_condicional': 'aprobó condicionalmente',
    'en_revision_prestacional_aprobado_condicional': 'aprobó condicionalmente',
    'en_revision_general_aprobado_condicional': 'aprobó condicionalmente',
    'en_revision_administrativa_rechazado': 'rechazó',
    'en_revision_prestacional_rechazado': 'rechazó',
    'en_revision_general_rechazado': 'rechazó',
    'en_revision_prestacional_observado': 'devolvió para correcciones',
    'en_revision_prestacional_borrador': 'devolvió para correcciones',
    'en_revision_general_pendiente_administrativa': 'devolvió a G. Administrativa',
    'en_revision_general_pendiente_prestacional': 'devolvió a G. Prestacional',
  };
  
  const key = `${estadoAnterior}_${estadoNuevo}`;
  const accion = acciones[key] || 'cambió el estado';
  
  return `${auditor} ${accion}`;
};

const formatearFecha = (fecha: string) => {
  const date = new Date(fecha);
  const hoy = new Date();
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  
  const esHoy = date.toDateString() === hoy.toDateString();
  const esAyer = date.toDateString() === ayer.toDateString();
  
  const hora = date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  
  if (esHoy) return `Hoy a las ${hora}`;
  if (esAyer) return `Ayer a las ${hora}`;
  
  return date.toLocaleString('es-AR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

export const ModalDetallePresupuesto: React.FC<ModalDetallePresupuestoProps> = ({
  opened,
  onClose,
  presupuesto
}) => {
  const [auditorias, setAuditorias] = useState<any[]>([]);

  useEffect(() => {
    if (opened && presupuesto?.idPresupuestos) {
      api.get(`/auditoria/historial/${presupuesto.idPresupuestos}`)
        .then(res => setAuditorias(res.data))
        .catch(err => console.error('Error cargando auditorías:', err));
    }
  }, [opened, presupuesto?.idPresupuestos]);

  if (!presupuesto) return null;

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={`Detalle Presupuesto #${presupuesto.idPresupuestos}`}
      size="xl"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="md">
        <Group>
          <Badge variant="light" color="blue">v{presupuesto.version}</Badge>
          <Badge variant="light" color={getEstadoBadgeColor(presupuesto.estado)} size="md">
            {getEstadoLabel(presupuesto.estado)}
          </Badge>
          {presupuesto.dificil_acceso === 'SI' && (
            <Badge color="orange">Difícil Acceso</Badge>
          )}
        </Group>

        <Paper p="md" withBorder>
          <Title order={4} mb="sm">Información del Paciente</Title>
          <Table>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={500}>Paciente</Table.Td>
                <Table.Td>{presupuesto.Nombre_Apellido}</Table.Td>
                <Table.Td fw={500}>DNI</Table.Td>
                <Table.Td>{presupuesto.DNI}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Sucursal</Table.Td>
                <Table.Td>{presupuesto.Sucursal || presupuesto.sucursal_nombre}</Table.Td>
                <Table.Td fw={500}>Financiador</Table.Td>
                <Table.Td>{presupuesto.Financiador || presupuesto.financiador || 'No asignado'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Creado por</Table.Td>
                <Table.Td colSpan={3}>{presupuesto.creador || presupuesto.usuario_creador || 'No disponible'}</Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </Paper>

        <Paper p="md" withBorder>
          <Title order={4} mb="sm">Totales del Presupuesto</Title>
          <Table>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={500}>Costo Total</Table.Td>
                <Table.Td>${Number(presupuesto.costo_total || 0).toLocaleString()}</Table.Td>
                <Table.Td fw={500}>Total a Facturar</Table.Td>
                <Table.Td c="blue">${Number(presupuesto.total_facturar || 0).toLocaleString()}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Utilidad</Table.Td>
                <Table.Td c={(Number(presupuesto.total_facturar || 0) - Number(presupuesto.costo_total || 0)) >= 0 ? 'green' : 'red'}>
                  ${(Number(presupuesto.total_facturar || 0) - Number(presupuesto.costo_total || 0)).toLocaleString()}
                </Table.Td>
                <Table.Td fw={500}>Rentabilidad</Table.Td>
                <Table.Td c={Number(presupuesto.rentabilidad || 0) >= 15 ? 'green' : 'red'}>
                  {Number(presupuesto.rentabilidad || 0).toFixed(2)}%
                </Table.Td>
              </Table.Tr>
              {presupuesto.rentabilidad_con_plazo && (
                <Table.Tr>
                  <Table.Td fw={500}>Rent. con Plazo</Table.Td>
                  <Table.Td c={Number(presupuesto.rentabilidad_con_plazo || 0) >= 15 ? 'green' : 'red'} colSpan={3}>
                    {Number(presupuesto.rentabilidad_con_plazo || 0).toFixed(2)}%
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </Paper>

        {auditorias.length > 0 && (
          <Accordion variant="contained">
            <Accordion.Item value="auditorias">
              <Accordion.Control>
                <Text fw={500}>Historial de Auditoría ({auditorias.length})</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Timeline active={auditorias.length} bulletSize={24} lineWidth={2}>
                  {auditorias.map((aud) => (
                    <Timeline.Item 
                      key={aud.id} 
                      title={getAccionDescripcion(aud.estado_anterior, aud.estado_nuevo, aud.auditor_nombre || 'Sistema')}
                    >
                      <Text size="xs" c="dimmed">{formatearFecha(aud.fecha)}</Text>
                      {aud.comentario && (
                        <Text size="sm" mt="xs" fs="italic" c="dark">"{aud.comentario}"</Text>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        )}

        {presupuesto.prestaciones && presupuesto.prestaciones.length > 0 && (
          <Paper p="md" withBorder>
            <Title order={4} mb="sm">Prestaciones ({presupuesto.prestaciones.length})</Title>
            <Table.ScrollContainer minWidth={500}>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Prestación</Table.Th>
                    <Table.Th>Cantidad</Table.Th>
                    <Table.Th>Valor Asignado</Table.Th>
                    <Table.Th>Valor Facturar</Table.Th>
                    <Table.Th>Subtotal</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {presupuesto.prestaciones.map((prest: any, idx: number) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{prest.prestacion || prest.nombre}</Table.Td>
                      <Table.Td>{prest.cantidad}</Table.Td>
                      <Table.Td>${Number(prest.valor_asignado || prest.precio_unitario || 0).toFixed(2)}</Table.Td>
                      <Table.Td>${Number(prest.valor_facturar || prest.precio_unitario || 0).toFixed(2)}</Table.Td>
                      <Table.Td>${(Number(prest.cantidad) * Number(prest.valor_facturar || prest.precio_unitario || 0)).toFixed(2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}

        {presupuesto.insumos && presupuesto.insumos.length > 0 && (
          <Paper p="md" withBorder>
            <Title order={4} mb="sm">Insumos ({presupuesto.insumos.length})</Title>
            <Table.ScrollContainer minWidth={500}>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Producto</Table.Th>
                    <Table.Th>Cantidad</Table.Th>
                    <Table.Th>Costo Unitario</Table.Th>
                    <Table.Th>Precio Facturar</Table.Th>
                    <Table.Th>Subtotal</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {presupuesto.insumos.map((insumo: any, idx: number) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{insumo.producto || insumo.nombre}</Table.Td>
                      <Table.Td>{insumo.cantidad}</Table.Td>
                      <Table.Td>${Number(insumo.costo || insumo.precio_unitario || 0).toFixed(2)}</Table.Td>
                      <Table.Td>${Number(insumo.precio_facturar || insumo.precio_unitario || 0).toFixed(2)}</Table.Td>
                      <Table.Td>${(Number(insumo.cantidad) * Number(insumo.precio_facturar || insumo.precio_unitario || 0)).toFixed(2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}

        {presupuesto.equipamientos && presupuesto.equipamientos.length > 0 && (
          <Paper p="md" withBorder>
            <Title order={4} mb="sm">Equipamientos ({presupuesto.equipamientos.length})</Title>
            <Table.ScrollContainer minWidth={500}>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Equipamiento</Table.Th>
                    <Table.Th>Tipo</Table.Th>
                    <Table.Th>Cantidad</Table.Th>
                    <Table.Th>Costo Unitario</Table.Th>
                    <Table.Th>Precio Facturar</Table.Th>
                    <Table.Th>Subtotal</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {presupuesto.equipamientos.map((eq: any, idx: number) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{eq.nombre}</Table.Td>
                      <Table.Td>{eq.tipo}</Table.Td>
                      <Table.Td>{eq.cantidad}</Table.Td>
                      <Table.Td>${Number(eq.costo || 0).toFixed(2)}</Table.Td>
                      <Table.Td>${Number(eq.precio_facturar || 0).toFixed(2)}</Table.Td>
                      <Table.Td>${(Number(eq.cantidad) * Number(eq.precio_facturar || 0)).toFixed(2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}
      </Stack>
    </Modal>
  );
};
