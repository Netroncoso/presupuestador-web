import { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Paper, TextInput, Group, ActionIcon, Badge, Loader, Text } from '@mantine/core';
import { PencilSquareIcon, MagnifyingGlassIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { api } from '../api/api';

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
  rentabilidad: number;
  rentabilidad_con_plazo: number | null;
  created_at: string;
}

interface ListaPresupuestosProps {
  onEditarPresupuesto: (presupuesto: Presupuesto, soloLectura?: boolean) => void;
  recargarTrigger?: number;
  esAuditor?: boolean;
  onVerDetalle?: (presupuesto: Presupuesto) => void;
}

export default function ListaPresupuestos({ onEditarPresupuesto, recargarTrigger, esAuditor = false, onVerDetalle }: ListaPresupuestosProps) {
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroNombre, setFiltroNombre] = useState('');
  const [filtroRentabilidad, setFiltroRentabilidad] = useState('');
  const [filtroMonto, setFiltroMonto] = useState('');

  const cargarPresupuestos = useCallback(async () => {
    try {
      const response = await api.get('/presupuestos');
      setPresupuestos(response.data);
    } catch (error) {
      console.error('Error cargando presupuestos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarPresupuestos();
  }, [recargarTrigger, cargarPresupuestos]);

  const filtrados = useMemo(() => {
    let resultado = presupuestos;

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

    return resultado;
  }, [presupuestos, filtroNombre, filtroRentabilidad, filtroMonto]);

  if (loading) {
    return <Loader />;
  }

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Group mb="md" grow>
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

      <Table.ScrollContainer minWidth={1000}>
        <Table striped="odd" highlightOnHover stickyHeader>
        <Table.Thead>
          <Table.Tr>
            <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>ID</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Paciente</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>DNI</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Sucursal</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Costo Total</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Total Facturar</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Rentabilidad</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Fecha</Table.Th>
            <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Acción</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {filtrados.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={9}>
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
                <Table.Td>${Number(p.costo_total || 0).toFixed(2)}</Table.Td>
                <Table.Td>${Number(p.total_facturar || 0).toFixed(2)}</Table.Td>
                <Table.Td>
                  <Text size="sm" c={Number(p.rentabilidad) >= 40 ? 'green' : Number(p.rentabilidad) >= 35 ? 'yellow' : 'red'} fw={500}>
                    {Number(p.rentabilidad || 0).toFixed(2)}%
                  </Text>
                </Table.Td>
                <Table.Td>{new Date(p.created_at).toLocaleDateString()}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {esAuditor ? (
                      <ActionIcon 
                        variant="transparent" 
                        color="blue" 
                        onClick={() => onVerDetalle?.(p)} 
                        title="Ver detalle del presupuesto"
                      >
                        <EyeIcon style={ICON_SIZE_LG} />
                      </ActionIcon>
                    ) : (
                      <>
                        <ActionIcon variant="transparent" color="teal" onClick={() => onEditarPresupuesto(p, true)} title="Ver presupuesto">
                          <EyeIcon style={ICON_SIZE_LG} />
                        </ActionIcon>
                        <ActionIcon variant="transparent" color="green" onClick={() => onEditarPresupuesto(p, false)} title="Editar (nueva versión)">
                          <PencilSquareIcon style={ICON_SIZE_LG} />
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
