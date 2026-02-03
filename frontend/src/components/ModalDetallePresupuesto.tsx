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
  if (estadoNuevo === 'pendiente_prestacional') {
    return `${auditor} solicitó auditoría`;
  }
  
  const acciones: Record<string, string> = {
    'en_revision_prestacional_pendiente_comercial': 'derivó a G. Comercial',
    'en_revision_comercial_pendiente_general': 'escaló a G. General',
    'en_revision_prestacional_aprobado': 'aprobó',
    'en_revision_comercial_aprobado': 'aprobó',
    'en_revision_general_aprobado': 'aprobó',
    'en_revision_prestacional_aprobado_condicional': 'aprobó condicionalmente',
    'en_revision_comercial_aprobado_condicional': 'aprobó condicionalmente',
    'en_revision_general_aprobado_condicional': 'aprobó condicionalmente',
    'en_revision_prestacional_rechazado': 'rechazó',
    'en_revision_comercial_rechazado': 'rechazó',
    'en_revision_general_rechazado': 'rechazó',
    'en_revision_comercial_observado': 'devolvió para correcciones',
    'en_revision_comercial_borrador': 'devolvió para correcciones',
    'en_revision_general_pendiente_prestacional': 'devolvió a G. Prestacional',
    'en_revision_general_pendiente_comercial': 'devolvió a G. Comercial',
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
  const [presupuestoActual, setPresupuestoActual] = useState<any>(presupuesto);
  const [prestacionesTarifario, setPrestacionesTarifario] = useState<any[]>([]);

  useEffect(() => {
    if (opened && presupuesto?.idPresupuestos) {
      // Recargar presupuesto completo con totales actualizados
      api.get(`/presupuestos/${presupuesto.idPresupuestos}`)
        .then(res => setPresupuestoActual(res.data))
        .catch(err => console.error('Error recargando presupuesto:', err));
      
      api.get(`/auditoria/historial/${presupuesto.idPresupuestos}`)
        .then(res => setAuditorias(res.data))
        .catch(err => console.error('Error cargando auditorías:', err));
      
      // Cargar prestaciones del tarifario
      api.get(`/presupuestos/${presupuesto.idPresupuestos}/prestaciones-tarifario`)
        .then(res => setPrestacionesTarifario(res.data))
        .catch(err => console.error('Error cargando prestaciones tarifario:', err));
    }
  }, [opened, presupuesto?.idPresupuestos]);

  if (!presupuestoActual) return null;

  return (
    <Modal 
      opened={opened} 
      onClose={onClose} 
      title={`Detalle Presupuesto #${presupuestoActual.idPresupuestos}`}
      size="xl"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="md">
        <Group>
          <Badge variant="light" color="blue">v{presupuestoActual.version}</Badge>
          <Badge variant="light" color={getEstadoBadgeColor(presupuestoActual.estado)} size="md">
            {getEstadoLabel(presupuestoActual.estado)}
          </Badge>
          {presupuestoActual.dificil_acceso === 'SI' && (
            <Badge color="orange">Difícil Acceso</Badge>
          )}
        </Group>

        <Paper p="md" withBorder>
          <Title order={4} mb="sm">Información del Paciente</Title>
          <Table>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={500}>Paciente</Table.Td>
                <Table.Td>{presupuestoActual.Nombre_Apellido}</Table.Td>
                <Table.Td fw={500}>DNI</Table.Td>
                <Table.Td>{presupuestoActual.DNI}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Sucursal</Table.Td>
                <Table.Td>{presupuestoActual.Sucursal || presupuestoActual.sucursal_nombre}</Table.Td>
                <Table.Td fw={500}>Zona</Table.Td>
                <Table.Td>{presupuestoActual.zona_nombre || 'No asignada'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Financiador</Table.Td>
                <Table.Td colSpan={3}>{presupuestoActual.Financiador || presupuestoActual.financiador || 'No asignado'}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Creado por</Table.Td>
                <Table.Td colSpan={3}>{presupuestoActual.creador || presupuestoActual.usuario_creador || 'No disponible'}</Table.Td>
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
                <Table.Td>${Number(presupuestoActual.costo_total || 0).toLocaleString()}</Table.Td>
                <Table.Td fw={500}>Total a Facturar</Table.Td>
                <Table.Td c="blue">${Number(presupuestoActual.total_facturar || 0).toLocaleString()}</Table.Td>
              </Table.Tr>
              <Table.Tr>
                <Table.Td fw={500}>Utilidad</Table.Td>
                <Table.Td c={(Number(presupuestoActual.total_facturar || 0) - Number(presupuestoActual.costo_total || 0)) >= 0 ? 'green' : 'red'}>
                  ${(Number(presupuestoActual.total_facturar || 0) - Number(presupuestoActual.costo_total || 0)).toLocaleString()}
                </Table.Td>
                <Table.Td fw={500}>Rentabilidad</Table.Td>
                <Table.Td c={Number(presupuestoActual.rentabilidad || 0) >= 15 ? 'green' : 'red'}>
                  {Number(presupuestoActual.rentabilidad || 0).toFixed(2)}%
                </Table.Td>
              </Table.Tr>
              {presupuestoActual.rentabilidad_con_plazo && (
                <Table.Tr>
                  <Table.Td fw={500}>Rent. con Plazo</Table.Td>
                  <Table.Td c={Number(presupuestoActual.rentabilidad_con_plazo || 0) >= 15 ? 'green' : 'red'} colSpan={3}>
                    {Number(presupuestoActual.rentabilidad_con_plazo || 0).toFixed(2)}%
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

        {presupuestoActual.prestaciones && presupuestoActual.prestaciones.length > 0 && (
          <Paper p="md" withBorder>
            <Title order={4} mb="sm">Prestaciones con Convenio ({presupuestoActual.prestaciones.length})</Title>
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
                  {presupuestoActual.prestaciones.map((prest: any, idx: number) => (
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

        {prestacionesTarifario.length > 0 && (
          <Paper p="md" withBorder>
            <Title order={4} mb="sm">Prestaciones por Presupuesto (Tarifario) ({prestacionesTarifario.length})</Title>
            <Table.ScrollContainer minWidth={500}>
              <Table striped>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Prestación</Table.Th>
                    <Table.Th>Cantidad</Table.Th>
                    <Table.Th>Valor Asignado</Table.Th>
                    <Table.Th>Valor Facturar</Table.Th>
                    <Table.Th>Estado</Table.Th>
                    <Table.Th>Subtotal</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {prestacionesTarifario.map((prest: any, idx: number) => (
                    <Table.Tr key={idx}>
                      <Table.Td>{prest.prestacion}</Table.Td>
                      <Table.Td>{prest.cantidad}</Table.Td>
                      <Table.Td>${Number(prest.valor_asignado).toFixed(2)}</Table.Td>
                      <Table.Td>${Number(prest.valor_facturar).toFixed(2)}</Table.Td>
                      <Table.Td>
                        {prest.orden_costo === 5 && <Text size="xs" c="orange">Valor Más Alto</Text>}
                        {prest.fuera_tarifario === 1 && <Text size="xs" c="blue">Fuera de Tarifario</Text>}
                        {prest.orden_costo !== 5 && prest.fuera_tarifario !== 1 && <Text size="xs" c="dimmed">-</Text>}
                      </Table.Td>
                      <Table.Td>${(Number(prest.cantidad) * Number(prest.valor_facturar)).toFixed(2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        )}

        {presupuestoActual.insumos && presupuestoActual.insumos.length > 0 && (
          <Paper p="md" withBorder>
            <Title order={4} mb="sm">Insumos ({presupuestoActual.insumos.length})</Title>
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
                  {presupuestoActual.insumos.map((insumo: any, idx: number) => (
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

        {presupuestoActual.equipamientos && presupuestoActual.equipamientos.length > 0 && (
          <Paper p="md" withBorder>
            <Title order={4} mb="sm">Equipamientos ({presupuestoActual.equipamientos.length})</Title>
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
                  {presupuestoActual.equipamientos.map((eq: any, idx: number) => (
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
