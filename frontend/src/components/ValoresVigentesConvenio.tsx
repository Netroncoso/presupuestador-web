import React, { useState, useEffect } from 'react';
import { Paper, Title, Table, Badge, Group, Text, TextInput, Button, Stack, Loader, Alert } from '@mantine/core';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { api } from '../api/api';
import { numberFormat } from '../utils/numberFormat';

interface ValorVigente {
  servicio: string;
  zonas: {
    zona: string;
    valor_facturar: number;
    fecha_inicio: string;
    fecha_fin?: string;
  }[];
}

interface Props {
  financiadorId: string | null;
  soloLectura?: boolean;
}

export default function ValoresVigentesConvenio({ financiadorId, soloLectura = false }: Props) {
  const [valoresVigentes, setValoresVigentes] = useState<ValorVigente[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');

  const cargarValoresVigentes = async (servicioNombre?: string) => {
    if (!financiadorId) {
      setValoresVigentes([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/financiador/${financiadorId}/valores-vigentes`, {
        params: servicioNombre ? { servicio_nombre: servicioNombre } : {}
      });
      setValoresVigentes(response.data);
    } catch (err) {
      console.error('Error cargando valores vigentes:', err);
      setError('Error al cargar valores vigentes');
      setValoresVigentes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarValoresVigentes();
  }, [financiadorId]);

  const handleBuscar = () => {
    cargarValoresVigentes(busqueda.trim() || undefined);
  };

  const handleLimpiar = () => {
    setBusqueda('');
    cargarValoresVigentes();
  };

  if (!financiadorId) {
    return (
      <Paper p="md" withBorder>
        <Text size="sm" c="dimmed" ta="center">
          Seleccione un financiador para ver los valores vigentes
        </Text>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        <Title order={4} c="blue">Valores Vigentes por Zona</Title>
        
        {/* Buscador */}
        <Group>
          <TextInput
            placeholder="Buscar servicio (ej: Fonoaudiología)"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            leftSection={<MagnifyingGlassIcon style={{ width: 16, height: 16 }} />}
            style={{ flex: 1 }}
            onKeyPress={(e) => e.key === 'Enter' && handleBuscar()}
          />
          <Button onClick={handleBuscar} disabled={loading}>
            Buscar
          </Button>
          <Button variant="outline" onClick={handleLimpiar} disabled={loading}>
            Limpiar
          </Button>
        </Group>

        {/* Indicador de carga */}
        {loading && (
          <Group justify="center" p="md">
            <Loader size="sm" />
            <Text size="sm" c="dimmed">Cargando valores vigentes...</Text>
          </Group>
        )}

        {/* Mensaje de error */}
        {error && (
          <Alert color="red" title="Error">
            {error}
          </Alert>
        )}

        {/* Tabla de valores */}
        {!loading && !error && valoresVigentes.length > 0 && (
          <Table.ScrollContainer minWidth={600}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Servicio</Table.Th>
                  <Table.Th>Zona</Table.Th>
                  <Table.Th>Valor Facturar</Table.Th>
                  <Table.Th>Vigencia</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {valoresVigentes.map((servicio) =>
                  servicio.zonas.map((zona, index) => (
                    <Table.Tr key={`${servicio.servicio}-${zona.zona}`}>
                      {index === 0 && (
                        <Table.Td rowSpan={servicio.zonas.length}>
                          <Text fw={500}>{servicio.servicio}</Text>
                        </Table.Td>
                      )}
                      <Table.Td>
                        <Badge variant="light" color="blue">
                          {zona.zona}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text fw={500} c="green">
                          {numberFormat.formatCurrency(zona.valor_facturar)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          Desde: {new Date(zona.fecha_inicio).toLocaleDateString()}
                          {zona.fecha_fin && (
                            <><br />Hasta: {new Date(zona.fecha_fin).toLocaleDateString()}</>
                          )}
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}

        {/* Mensaje cuando no hay datos */}
        {!loading && !error && valoresVigentes.length === 0 && (
          <Paper p="xl" style={{ textAlign: 'center', backgroundColor: '#f8f9fa' }}>
            <Text c="dimmed">
              {busqueda 
                ? `No se encontraron servicios que contengan "${busqueda}"`
                : 'No hay valores vigentes configurados para este financiador'
              }
            </Text>
          </Paper>
        )}

        {/* Ejemplo de uso */}
        {!loading && !error && valoresVigentes.length > 0 && (
          <Paper p="sm" style={{ backgroundColor: '#e7f5ff' }}>
            <Text size="xs" c="blue">
              💡 Estos son los valores vigentes por zona para servicios con convenio. 
              Los valores se actualizan automáticamente según las fechas de vigencia.
            </Text>
          </Paper>
        )}
      </Stack>
    </Paper>
  );
}