import { useState, useEffect, useMemo, useCallback } from 'react';
import { Paper, ActionIcon, Select, Loader, Text, Group } from '@mantine/core';
import { EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { MantineReactTable, useMantineReactTable, type MRT_ColumnDef } from 'mantine-react-table';
import { api } from '../api/api';
import { getEstadoBadgeColor, getEstadoLabel } from '../utils/estadoPresupuesto';
import { pdfClientService } from '../services/pdfClientService';
import { notifications } from '@mantine/notifications';

interface PresupuestoCarga {
  idPresupuestos: number;
  Nombre_Apellido: string;
  DNI: string;
  Sucursal: string;
  Financiador: string;
  estado: string;
  resultado_auditoria?: 'aprobado' | 'aprobado_condicional' | 'rechazado' | null;
  total_facturar: number;
  referencia_externa: string | null;
  created_at: string;
  updated_at: string;
  operador_carga?: string;
  fecha_carga?: string;
}

interface ListaPresupuestosCargaProps {
  onVerDetalle?: (presupuesto: PresupuestoCarga) => void;
}

export default function ListaPresupuestosCarga({ onVerDetalle }: ListaPresupuestosCargaProps) {
  const [presupuestos, setPresupuestos] = useState<PresupuestoCarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');

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
      const response = await api.get('/carga/historial');
      setPresupuestos(response.data);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPresupuestos();
  }, [cargarPresupuestos]);

  const presupuestosFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return presupuestos;
    return presupuestos.filter(p => p.estado === filtroEstado);
  }, [presupuestos, filtroEstado]);

  const columns = useMemo<MRT_ColumnDef<PresupuestoCarga>[]>(
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
        size: 120,
      },
      {
        accessorKey: 'estado',
        header: 'Estado',
        size: 150,
        Cell: ({ cell }) => {
          const estado = cell.getValue<string>();
          return (
            <Text size="sm" fw={400} c={getEstadoBadgeColor(estado)}>
              {getEstadoLabel(estado)}
            </Text>
          );
        },
      },
      {
        accessorKey: 'resultado_auditoria',
        header: 'Resultado',
        size: 140,
        Cell: ({ cell }) => {
          const resultado = cell.getValue<string>();
          if (!resultado) return <Text size="sm" c="dimmed">-</Text>;
          
          const color = resultado === 'aprobado' ? 'green' : 
                       resultado === 'aprobado_condicional' ? 'orange' : 'red';
          const label = resultado === 'aprobado' ? 'Aprobado' :
                       resultado === 'aprobado_condicional' ? 'Condicional' : 'Rechazado';
          
          return (
            <Text size="sm" fw={500} c={color}>
              {label}
            </Text>
          );
        },
      },
      {
        accessorKey: 'referencia_externa',
        header: 'Ref. Softwerk',
        size: 140,
        Cell: ({ cell }) => {
          const ref = cell.getValue<string>();
          return ref ? (
            <Text size="sm" c="blue" fw={500}>{ref}</Text>
          ) : (
            <Text size="sm" c="gray" fs="italic">Sin referencia</Text>
          );
        },
      },
      {
        accessorKey: 'total_facturar',
        header: 'Total',
        size: 120,
        Cell: ({ cell }) => {
          const total = cell.getValue<number>();
          return (
            <Text size="sm" fw={500}>
              ${Number(total || 0).toLocaleString('es-AR')}
            </Text>
          );
        },
      },
      {
        accessorKey: 'updated_at',
        header: 'Última Act.',
        size: 120,
        Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString(),
      },
    ],
    []
  );

  const table = useMantineReactTable({
    columns,
    data: presupuestosFiltrados,
    enableColumnResizing: true,
    enableGlobalFilter: true,
    enableColumnFilters: true,
    enableSorting: true,
    enablePagination: true,
    initialState: {
      pagination: { pageSize: 20, pageIndex: 0 },
      density: 'xs',
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
        <ActionIcon 
          variant="transparent" 
          color="blue" 
          onClick={() => onVerDetalle?.(row.original)} 
          title="Ver detalle"
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
      </Group>
    ),
  });

  if (loading) {
    return <Loader />;
  }

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Group mb="md">
        <Select
          placeholder="Estado"
          value={filtroEstado}
          onChange={(value) => setFiltroEstado(value || 'todos')}
          data={[
            { value: 'todos', label: 'Todos los estados' },
            { value: 'pendiente_carga', label: 'Pendiente de Carga' },
            { value: 'en_carga', label: 'En Carga' },
            { value: 'cargado', label: 'Cargado' },
            { value: 'aprobado', label: 'Aprobado' },
            { value: 'rechazado', label: 'Rechazado' },
          ]}
          style={{ width: 200 }}
        />
      </Group>
      <MantineReactTable table={table} />
    </Paper>
  );
}