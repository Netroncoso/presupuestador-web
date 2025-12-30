import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Paper, TextInput, Group, ActionIcon, Select, Loader, Text } from '@mantine/core';
import { PencilSquareIcon, MagnifyingGlassIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../api/api';
import { getEstadoBadgeColor, getEstadoLabel } from '../utils/estadoPresupuesto';

const ICON_SIZE = { width: 16, height: 16 };
const ICON_SIZE_LG = { width: 20, height: 20 };

interface Presupuesto {
  idPresupuestos: number;
  Nombre_Apellido: string;
  DNI: string;
  Sucursal: string;
  idobra_social: string | null;
  total_insumos: number;
  total_prestaciones: number;
  costo_total: number;
  total_facturar: number;
  utilidad: number;
  rentabilidad: number;
  rentabilidad_con_plazo: number | null;
  created_at: string;
  estado?: string;
}

interface ListaPresupuestosProps {
  onEditarPresupuesto: (presupuesto: Presupuesto, soloLectura?: boolean) => void;
  recargarTrigger?: number;
  esAuditor?: boolean;
  soloConsulta?: boolean;
  onVerDetalle?: (presupuesto: Presupuesto) => void;
}

export default function ListaPresupuestos({ onEditarPresupuesto, recargarTrigger, esAuditor = false, soloConsulta = false, onVerDetalle }: ListaPresupuestosProps) {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroRentabilidad, setFiltroRentabilidad] = useState('');
  const [filtroMonto, setFiltroMonto] = useState('');
  const [filtroId, setFiltroId] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroAuditor, setFiltroAuditor] = useState('todos');
  const [filtroCreador, setFiltroCreador] = useState('todos');

  const cargarPresupuestos = useCallback(async () => {
    try {
      let endpoint = '/presupuestos';
      if (esAuditor && filtroAuditor === 'mis-auditorias') {
        endpoint = '/auditoria-multi/mis-auditorias';
      } else if (!esAuditor && filtroCreador === 'solo-mios') {
        endpoint = '/presupuestos?scope=solo-mios';
      }
      const response = await api.get(endpoint);
      setPresupuestos(response.data);
    } catch (error) {
      console.error('Error cargando presupuestos:', error);
    } finally {
      setLoading(false);
    }
  }, [esAuditor, filtroAuditor, filtroCreador]);

  useEffect(() => {
    cargarPresupuestos();
  }, [recargarTrigger, cargarPresupuestos, filtroAuditor, filtroCreador]);

  const filtrados = useMemo(() => {
    let resultado = presupuestos;

    if (filtroId) {
      resultado = resultado.filter(p => String(p.idPresupuestos).includes(filtroId));
    }

    if (filtroNombre) {
      const filtroLower = filtroNombre.toLowerCase();
      resultado = resultado.filter(p => 
        p.Nombre_Apellido.toLowerCase().includes(filtroLower) ||
        String(p.DNI).includes(filtroNombre)
      );
    }

    if (filtroRentabilidad) {
      const rentMin = parseFloat(filtroRentabilidad);
      if (!isNaN(rentMin)) {
        resultado = resultado.filter(p => Number(p.rentabilidad) >= rentMin);
      }
    }

    if (filtroMonto) {
      const montoMin = parseFloat(filtroMonto);
      if (!isNaN(montoMin)) {
        resultado = resultado.filter(p => Number(p.total_facturar) >= montoMin);
      }
    }

    if (filtroEstado) {
      resultado = resultado.filter(p => p.estado === filtroEstado);
    }

    return resultado;
  }, [presupuestos, filtroNombre, filtroRentabilidad, filtroMonto, filtroId, filtroEstado]);

  if (loading) {
    return <Loader />;
  }

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Group mb="md" grow>
        <TextInput
          placeholder="Buscar por ID"
          value={filtroId}
          onChange={(e) => setFiltroId(e.currentTarget.value)}
          type="number"
          rightSection={
            filtroId ? (
              <ActionIcon variant="subtle" onClick={() => setFiltroId('')}>
                <XMarkIcon style={ICON_SIZE} />
              </ActionIcon>
            ) : null
          }
        />
        <TextInput
          placeholder="Buscar por nombre o DNI"
          leftSection={<MagnifyingGlassIcon style={ICON_SIZE} />}
          value={filtroNombre}
          onChange={(e) => setFiltroNombre(e.currentTarget.value)}
          rightSection={
            filtroNombre ? (
              <ActionIcon variant="subtle" onClick={() => setFiltroNombre('')}>
                <XMarkIcon style={ICON_SIZE} />
              </ActionIcon>
            ) : null
          }
        />
        {esAuditor && (
          <Select
            placeholder="Auditor"
            value={filtroAuditor}
            onChange={(value) => setFiltroAuditor(value || 'todos')}
            data={[
              { value: 'todos', label: 'Todos' },
              { value: 'mis-auditorias', label: 'Mis auditorías' }
            ]}
          />
        )}
        {!esAuditor && !soloConsulta && (
          <Select
            placeholder="Creador"
            value={filtroCreador}
            onChange={(value) => setFiltroCreador(value || 'todos')}
            data={[
              { value: 'todos', label: 'Todos' },
              { value: 'solo-mios', label: 'Solo míos' }
            ]}
          />
        )}
        <Select
          placeholder="Filtrar por estado"
          value={filtroEstado}
          onChange={(value) => setFiltroEstado(value || '')}
          data={[
            { value: '', label: 'Todos' },
            { value: 'borrador', label: 'Borrador' },
            { value: 'pendiente_administrativa', label: 'Pendiente G. Admin' },
            { value: 'en_revision_administrativa', label: 'En Revisión G. Admin' },
            { value: 'pendiente_prestacional', label: 'Pendiente G. Prestacional' },
            { value: 'en_revision_prestacional', label: 'En Revisión G. Prestacional' },
            { value: 'pendiente_general', label: 'Pendiente G. General' },
            { value: 'en_revision_general', label: 'En Revisión G. General' },
            { value: 'aprobado', label: 'Aprobado' },
            { value: 'aprobado_condicional', label: 'Aprobado Condicional' },
            { value: 'rechazado', label: 'Rechazado' }
          ]}
          clearable
        />
        <TextInput
          placeholder="Rentabilidad mínima (%)"
          value={filtroRentabilidad}
          onChange={(e) => setFiltroRentabilidad(e.currentTarget.value)}
          type="number"
          rightSection={
            filtroRentabilidad ? (
              <ActionIcon variant="subtle" onClick={() => setFiltroRentabilidad('')}>
                <XMarkIcon style={ICON_SIZE} />
              </ActionIcon>
            ) : null
          }
        />
        <TextInput
          placeholder="Monto mínimo a facturar"
          value={filtroMonto}
          onChange={(e) => setFiltroMonto(e.currentTarget.value)}
          type="number"
          rightSection={
            filtroMonto ? (
              <ActionIcon variant="subtle" onClick={() => setFiltroMonto('')}>
                <XMarkIcon style={ICON_SIZE} />
              </ActionIcon>
            ) : null
          }
        />
      </Group>

      <Table.ScrollContainer>
        <Table striped="odd" highlightOnHover stickyHeader fontSize="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>ID</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Paciente</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>DNI</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Sucursal</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Estado</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Costo</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Facturar</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Utilidad</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Rent.</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Fecha</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Acción</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtrados.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={11}>
                <Text ta="center" c="dimmed">No se encontraron presupuestos</Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            filtrados.map((p) => (
              <Table.Tr key={p.idPresupuestos}>
                <Table.Td>{p.idPresupuestos}</Table.Td>
                <Table.Td>{p.Nombre_Apellido}</Table.Td>
                <Table.Td>{p.DNI}</Table.Td>
                <Table.Td>{p.Sucursal}</Table.Td>
                <Table.Td>
                  <Text size="sm" fw={400} c={getEstadoBadgeColor(p.estado)}>
                    {getEstadoLabel(p.estado)}
                  </Text>
                </Table.Td>
                <Table.Td>${Number(p.costo_total || 0).toFixed(2)}</Table.Td>
                <Table.Td>${Number(p.total_facturar || 0).toFixed(2)}</Table.Td>
                <Table.Td>
                  <Text size="sm" c={p.utilidad >= 0 ? 'green' : 'red'} fw={500}>
                    ${Number(p.utilidad || 0).toFixed(2)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" c={Number(p.rentabilidad) >= 40 ? 'green' : Number(p.rentabilidad) >= 35 ? 'yellow' : 'red'} fw={500}>
                    {Number(p.rentabilidad || 0).toFixed(2)}%
                  </Text>
                </Table.Td>
                <Table.Td>{new Date(p.created_at).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  <Group gap={4} wrap="nowrap">
                    {(esAuditor || soloConsulta) ? (
                      <ActionIcon 
                        variant="transparent" 
                        color="blue" 
                        onClick={() => onVerDetalle?.(p)} 
                        title="Ver detalle del presupuesto"
                      >
                        <EyeIcon style={{ width: 16, height: 16 }} />
                      </ActionIcon>
                    ) : (
                      <>
                        <ActionIcon variant="transparent" color="teal" onClick={() => onEditarPresupuesto(p, true)} title="Ver presupuesto">
                          <EyeIcon style={{ width: 16, height: 16 }} />
                        </ActionIcon>
                        <ActionIcon variant="transparent" color="green" onClick={() => onEditarPresupuesto(p, false)} title="Editar (nueva versión)">
                          <PencilSquareIcon style={{ width: 16, height: 16 }} />
                        </ActionIcon>
                      </>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}
