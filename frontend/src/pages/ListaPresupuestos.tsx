import { useState, useEffect, useMemo, useCallback } from 'react';
import { Paper, Group, ActionIcon, Select, Loader, Text, Box } from '@mantine/core';
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from 'mantine-react-table';
import { PencilSquareIcon, EyeIcon } from '@heroicons/react/24/outline';
import { api } from '../api/api';
import { getEstadoBadgeColor, getEstadoLabel } from '../utils/estadoPresupuesto';

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
  const [filtroAuditor, setFiltroAuditor] = useState('todos');
  const [filtroCreador, setFiltroCreador] = useState('todos');

  const cargarPresupuestos = useCallback(async () => {
    setLoading(true);
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
  }, [cargarPresupuestos, recargarTrigger]);

  const columns = useMemo<MRT_ColumnDef<Presupuesto>[]>(
    () => [
      {
        accessorKey: 'idPresupuestos',
        header: 'ID',
        size: 80,
      },
      {
        accessorKey: 'Nombre_Apellido',
        header: 'Paciente',
        size: 200,
      },
      {
        accessorKey: 'DNI',
        header: 'DNI',
        size: 100,
      },
      {
        accessorKey: 'Sucursal',
        header: 'Sucursal',
        size: 150,
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        size: 150,
        Cell: ({ cell }) => (
          <Text size="sm" fw={400} c={getEstadoBadgeColor(cell.getValue() as string)}>
            {getEstadoLabel(cell.getValue() as string)}
          </Text>
        ),
        filterVariant: 'select',
        mantineFilterSelectProps: {
          data: [
            { value: 'borrador', label: 'Borrador' },
            { value: 'pendiente_administrativa', label: 'Pendiente G. Admin' },
            { value: 'en_revision_administrativa', label: 'En Revisión G. Admin' },
            { value: 'pendiente_prestacional', label: 'Pendiente G. Prestacional' },
            { value: 'en_revision_prestacional', label: 'En Revisión G. Prestacional' },
            { value: 'pendiente_general', label: 'Pendiente G. General' },
            { value: 'en_revision_general', label: 'En Revisión G. General' },
            { value: 'aprobado', label: 'Aprobado' },
            { value: 'aprobado_condicional', label: 'Aprobado Condicional' },
            { value: 'rechazado', label: 'Rechazado' },
          ],
        },
      },
      {
        accessorKey: 'utilidad',
        header: 'Utilidad',
        size: 120,
        Cell: ({ cell }) => {
          const value = Number(cell.getValue() || 0);
          return (
            <Text size="sm" c={value >= 0 ? 'green' : 'red'} fw={500}>
              ${value.toFixed(2)}
            </Text>
          );
        },
        enableColumnFilter: false,
      },
      {
        accessorKey: 'rentabilidad',
        header: 'Rent.',
        size: 100,
        Cell: ({ cell }) => {
          const value = Number(cell.getValue() || 0);
          return (
            <Text size="sm" c={value >= 40 ? 'green' : value >= 35 ? 'yellow' : 'red'} fw={500}>
              {value.toFixed(2)}%
            </Text>
          );
        },
        enableColumnFilter: false,
      },
      {
        accessorKey: 'created_at',
        header: 'Fecha',
        size: 120,
        Cell: ({ cell }) => new Date(cell.getValue() as string).toLocaleDateString(),
        enableColumnFilter: false,
      },
      {
        id: 'actions',
        header: 'Acción',
        size: 100,
        enableColumnFilter: false,
        enableSorting: false,
        Cell: ({ row }) => (
          <Group gap={4} wrap="nowrap">
            {(esAuditor || soloConsulta) ? (
              <ActionIcon
                variant="transparent"
                color="blue"
                onClick={() => onVerDetalle?.(row.original)}
                title="Ver detalle del presupuesto"
              >
                <EyeIcon style={{ width: 16, height: 16 }} />
              </ActionIcon>
            ) : (
              <>
                <ActionIcon
                  variant="transparent"
                  color="teal"
                  onClick={() => onEditarPresupuesto(row.original, true)}
                  title="Ver presupuesto"
                >
                  <EyeIcon style={{ width: 16, height: 16 }} />
                </ActionIcon>
                <ActionIcon
                  variant="transparent"
                  color="green"
                  onClick={() => onEditarPresupuesto(row.original, false)}
                  title="Editar (nueva versión)"
                >
                  <PencilSquareIcon style={{ width: 16, height: 16 }} />
                </ActionIcon>
              </>
            )}
          </Group>
        ),
      },
    ],
    [esAuditor, soloConsulta, onEditarPresupuesto, onVerDetalle]
  );

  const table = useMantineReactTable({
    columns,
    data: presupuestos,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enableSorting: true,
    enablePagination: true,
    enableColumnResizing: true,
    initialState: {
      pagination: { pageSize: 20, pageIndex: 0 },
      density: 'xs',
      showGlobalFilter: true,
    },
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withColumnBorders: false,
      withTableBorder: false,
    },
    state: {
      isLoading: loading,
    },
  });

  if (loading) {
    return <Loader />;
  }

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      {(esAuditor || !soloConsulta) && (
        <Group mb="md" gap="xs">
          {esAuditor && (
            <Select
              placeholder="Auditor"
              value={filtroAuditor}
              onChange={(value) => setFiltroAuditor(value || 'todos')}
              data={[
                { value: 'todos', label: 'Todos' },
                { value: 'mis-auditorias', label: 'Mis auditorías' },
              ]}
              style={{ width: 200 }}
            />
          )}
          {!esAuditor && !soloConsulta && (
            <Select
              placeholder="Creador"
              value={filtroCreador}
              onChange={(value) => setFiltroCreador(value || 'todos')}
              data={[
                { value: 'todos', label: 'Todos' },
                { value: 'solo-mios', label: 'Solo míos' },
              ]}
              style={{ width: 200 }}
            />
          )}
        </Group>
      )}

      <MantineReactTable table={table} />
    </Paper>
  );
}
