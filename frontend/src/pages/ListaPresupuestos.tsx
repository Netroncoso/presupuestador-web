import { useState, useEffect, useMemo, useCallback } from 'react';
import { Paper, ActionIcon, Select, Loader, Text, Group } from '@mantine/core';
import { PencilSquareIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from 'mantine-react-table';
import { api } from '../api/api';
import { getEstadoBadgeColor, getEstadoLabel } from '../utils/estadoPresupuesto';
import { pdfClientService } from '../services/pdfClientService';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../contexts/AuthContext';
import { numberFormat } from '../utils/numberFormat';

const ICON_SIZE = { width: 16, height: 16 };
const ICON_SIZE_LG = { width: 20, height: 20 };

interface Presupuesto {
  idPresupuestos: number;
  Nombre_Apellido: string;
  DNI: string;
  Sucursal: string;
  financiador_id: string | null;
  total_insumos: number;
  total_prestaciones: number;
  costo_total: number;
  total_facturar: number;
  utilidad: number;
  rentabilidad: number;
  rentabilidad_con_plazo: number | null;
  created_at: string;
  estado?: string;
  resultado_auditoria?: 'aprobado' | 'aprobado_condicional' | 'rechazado' | null;
  usuario_creador?: string;
}

interface ListaPresupuestosProps {
  onEditarPresupuesto: (presupuesto: Presupuesto, soloLectura?: boolean) => void;
  recargarTrigger?: number;
  esAuditor?: boolean;
  soloConsulta?: boolean;
  onVerDetalle?: (presupuesto: Presupuesto) => void;
}

export default function ListaPresupuestos({ onEditarPresupuesto, recargarTrigger, esAuditor = false, soloConsulta = false, onVerDetalle }: ListaPresupuestosProps) {
  const { user } = useAuth();
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroAuditor, setFiltroAuditor] = useState('todos');
  const [filtroCreador, setFiltroCreador] = useState('todos');

  const handleGenerarPDF = useCallback(async (presupuestoId: number) => {
    try {
      const response = await api.get(`/presupuestos/${presupuestoId}`);
      const presupuesto = response.data;

      pdfClientService.generarYDescargar({
        cliente: presupuesto.Nombre_Apellido,
        dni: presupuesto.DNI,
        sucursal: presupuesto.Sucursal,
        presupuestoId: presupuesto.idPresupuestos,
        insumos: presupuesto.insumos || [],
        prestaciones: presupuesto.prestaciones || [],
        equipamientos: presupuesto.equipamientos || [],
        totales: {
          totalInsumos: Number(presupuesto.total_insumos) || 0,
          totalPrestaciones: Number(presupuesto.total_prestaciones) || 0,
          totalEquipamientos: Number(presupuesto.total_equipamiento) || 0,
          costoTotal: Number(presupuesto.costo_total) || 0,
          totalFacturar: Number(presupuesto.total_facturar) || 0,
          rentabilidad: Number(presupuesto.rentabilidad) || 0,
        },
      });
    } catch (error) {
      console.error('Error generando PDF:', error);
      notifications.show({
        title: 'Error',
        message: 'No se pudo generar el PDF',
        color: 'red',
      });
    }
  }, []);

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

  const columns = useMemo<MRT_ColumnDef<Presupuesto>[]>(
    () => [
      {
        accessorKey: 'idPresupuestos',
        header: 'ID',
        size: 80,
        enableColumnFilter: true,
      },
      {
        accessorKey: 'Nombre_Apellido',
        header: 'Paciente',
        size: 180,
      },
      {
        accessorKey: 'DNI',
        header: 'DNI',
        size: 120,
      },
      {
        accessorKey: 'Sucursal',
        header: 'Sucursal',
        size: 150,
      },
      {
        accessorKey: 'usuario_creador',
        header: 'Usuario',
        size: 120,
        Cell: ({ cell }) => {
          const usuario = cell.getValue<string>();
          return <Text size="sm">{usuario || 'N/A'}</Text>;
        },
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        size: 180,
        Cell: ({ cell }) => {
          const estado = cell.getValue<string>();
          return (
            <Text size="sm" fw={400} c={getEstadoBadgeColor(estado)}>
              {getEstadoLabel(estado)}
            </Text>
          );
        },
        filterVariant: 'select',
        mantineFilterSelectProps: {
          data: [
            { value: 'borrador', label: 'Borrador' },
            { value: 'pendiente_prestacional', label: 'Pendiente G. Admin' },
            { value: 'en_revision_prestacional', label: 'En Revisión G. Admin' },
            { value: 'pendiente_comercial', label: 'Pendiente G. Comercial' },
            { value: 'en_revision_comercial', label: 'En Revisión G. Comercial' },
            { value: 'pendiente_general', label: 'Pendiente G. General' },
            { value: 'en_revision_general', label: 'En Revisión G. General' },
            { value: 'aprobado', label: 'Aprobado' },
            { value: 'aprobado_condicional', label: 'Aprobado Condicional' },
            { value: 'rechazado', label: 'Rechazado' },
          ],
        },
      },
      {
        accessorKey: 'resultado_auditoria',
        header: 'Resultado',
        size: 150,
        Cell: ({ cell }) => {
          const resultado = cell.getValue<string>();
          if (!resultado) return <Text size="sm" c="dimmed">-</Text>;
          
          const color = resultado === 'aprobado' ? 'green' : 
                       resultado === 'aprobado_condicional' ? 'orange' : 'red';
          const label = resultado === 'aprobado' ? 'Aprobado' :
                       resultado === 'aprobado_condicional' ? 'Aprobado Condicional' : 'Rechazado';
          
          return (
            <Text size="sm" fw={500} c={color}>
              {label}
            </Text>
          );
        },
        filterVariant: 'select',
        mantineFilterSelectProps: {
          data: [
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
          const utilidad = cell.getValue<number>();
          return (
            <Text size="sm" c={utilidad >= 0 ? 'green' : 'red'} fw={500}>
              {numberFormat.formatCurrency(utilidad)}
            </Text>
          );
        },
      },
      {
        accessorKey: 'rentabilidad',
        header: 'Rent. %',
        size: 100,
        Cell: ({ cell }) => {
          const rent = cell.getValue<number>();
          return (
            <Text size="sm" c={rent >= 40 ? 'green' : rent >= 35 ? 'yellow' : 'red'} fw={500}>
              {Number(rent || 0).toFixed(2)}%
            </Text>
          );
        },
      },
      {
        accessorKey: 'created_at',
        header: 'Fecha',
        size: 120,
        Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString(),
      },
    ],
    []
  );

  const table = useMantineReactTable({
    columns,
    data: presupuestos,
    enableColumnResizing: true,
    enableGlobalFilter: true,
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: true,
    initialState: {
      pagination: { pageSize: 20, pageIndex: 0 },
      density: 'xs',
      columnVisibility: {
        DNI: user?.rol !== 'user',
        Sucursal: user?.rol !== 'user',
      },
    },
    mantineTableProps: {
      striped: 'odd',
      highlightOnHover: true,
    },
    enableRowActions: true,
    positionActionsColumn: 'last',
    displayColumnDefOptions: {
      'mrt-row-actions': {
        size: 120,
      },
    },
    renderRowActions: ({ row }) => (
      <Group gap={4} wrap="nowrap">
        {(esAuditor || soloConsulta) ? (
          <>
            <ActionIcon 
              variant="transparent" 
              color="blue" 
              onClick={() => onVerDetalle?.(row.original)} 
              title="Ver detalle del presupuesto"
            >
              <EyeIcon style={{ width: 16, height: 16 }} />
            </ActionIcon>
            <ActionIcon
              variant="transparent"
              color="orange"
              onClick={() => handleGenerarPDF(row.original.idPresupuestos)}
              title="Descargar PDF"
            >
              <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
            </ActionIcon>
          </>
        ) : (
          <>
            <ActionIcon variant="transparent" color="teal" onClick={() => onEditarPresupuesto(row.original, true)} title="Ver presupuesto">
              <EyeIcon style={{ width: 16, height: 16 }} />
            </ActionIcon>
            <ActionIcon variant="transparent" color="green" onClick={() => onEditarPresupuesto(row.original, false)} title="Editar (nueva versión)">
              <PencilSquareIcon style={{ width: 16, height: 16 }} />
            </ActionIcon>
            <ActionIcon
              variant="transparent"
              color="orange"
              onClick={() => handleGenerarPDF(row.original.idPresupuestos)}
              title="Descargar PDF"
            >
              <ArrowDownTrayIcon style={{ width: 16, height: 16 }} />
            </ActionIcon>
          </>
        )}
      </Group>
    ),
  });

  if (loading) {
    return <Loader />;
  }

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      {(esAuditor || !soloConsulta) && (
        <Group mb="md">
          {esAuditor && (
            <Select
              placeholder="Auditor"
              value={filtroAuditor}
              onChange={(value) => setFiltroAuditor(value || 'todos')}
              data={[
                { value: 'todos', label: 'Todos' },
                { value: 'mis-auditorias', label: 'Mis auditorías' }
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
                { value: 'solo-mios', label: 'Solo míos' }
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
