import React from 'react';
import { Modal, Text, Badge, Group, Table, Stack, Paper, Title } from '@mantine/core';

interface ModalDetallePresupuestoProps {
  opened: boolean;
  onClose: () => void;
  presupuesto: any;
}

export const ModalDetallePresupuesto: React.FC<ModalDetallePresupuestoProps> = ({
  opened,
  onClose,
  presupuesto
}) => {
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
          <Badge variant="dot" color={presupuesto.estado === 'aprobado' ? 'green' : presupuesto.estado === 'rechazado' ? 'red' : 'yellow'}>
            {presupuesto.estado?.toUpperCase()}
          </Badge>
          {presupuesto.dificil_acceso === 'SI' && (
            <Badge color="orange">Difícil Acceso</Badge>
          )}
        </Group>

        <Paper p="md" withBorder>
          <Title order={4} mb="sm">Información del Paciente</Title>
          <Group grow>
            <div>
              <Text size="sm" c="dimmed">Paciente</Text>
              <Text fw={500}>{presupuesto.Nombre_Apellido}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">DNI</Text>
              <Text fw={500}>{presupuesto.DNI}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Sucursal</Text>
              <Text fw={500}>{presupuesto.Sucursal || presupuesto.sucursal_nombre}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Financiador</Text>
              <Text fw={500}>{presupuesto.Financiador || presupuesto.financiador || 'No asignado'}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Creado por</Text>
              <Text fw={500}>{presupuesto.creador || presupuesto.usuario_creador || 'No disponible'}</Text>
            </div>
          </Group>
        </Paper>

        <Paper p="md" withBorder>
          <Title order={4} mb="sm">Totales del Presupuesto</Title>
          <Group grow>
            <div>
              <Text size="sm" c="dimmed">Costo Total</Text>
              <Text fw={500} size="lg">${Number(presupuesto.costo_total || 0).toLocaleString()}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Total a Facturar</Text>
              <Text fw={500} size="lg" c="blue">${Number(presupuesto.total_facturar || 0).toLocaleString()}</Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Utilidad</Text>
              <Text fw={500} size="lg" c={(Number(presupuesto.total_facturar || 0) - Number(presupuesto.costo_total || 0)) >= 0 ? 'green' : 'red'}>
                ${(Number(presupuesto.total_facturar || 0) - Number(presupuesto.costo_total || 0)).toLocaleString()}
              </Text>
            </div>
            <div>
              <Text size="sm" c="dimmed">Rentabilidad</Text>
              <Text fw={500} size="lg" c={Number(presupuesto.rentabilidad || 0) >= 15 ? 'green' : 'red'}>
                {Number(presupuesto.rentabilidad || 0).toFixed(2)}%
              </Text>
            </div>
            {presupuesto.rentabilidad_con_plazo && (
              <div>
                <Text size="sm" c="dimmed">Rentabilidad con Plazo</Text>
                <Text fw={500} size="lg" c={Number(presupuesto.rentabilidad_con_plazo || 0) >= 15 ? 'green' : 'red'}>
                  {Number(presupuesto.rentabilidad_con_plazo || 0).toFixed(2)}%
                </Text>
              </div>
            )}
          </Group>
        </Paper>

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
      </Stack>
    </Modal>
  );
};