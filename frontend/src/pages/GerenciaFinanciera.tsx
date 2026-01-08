import React, { useState, useEffect } from 'react';
import { Container, Title, Text, Table, Group, Paper, Loader, Center, Tabs, Select, Grid, Card, Button, Tooltip, Pagination } from '@mantine/core';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/api';
import { ArrowRightStartOnRectangleIcon, UserCircleIcon, ChartBarIcon, BanknotesIcon, CheckCircleIcon, ClockIcon, ArrowTrendingUpIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { useNotificationCount } from '../hooks/useNotificationCount';
import ListaPresupuestos from './ListaPresupuestos';
import { ModalDetallePresupuesto } from '../components/ModalDetallePresupuesto';

const ICON_SIZE = { width: 20, height: 20 };
const ICON_SIZE_LG = { width: 24, height: 24 };
const ICON_SIZE_SM = { width: 16, height: 16 };

const PERIODOS_DATA = [
  { value: 'mes_actual', label: 'Mes Actual' },
  { value: 'trimestre_actual', label: 'Trimestre Actual' },
  { value: 'anio_actual', label: 'Año Actual' },
  { value: 'ultimos_6_meses', label: 'Últimos 6 Meses' },
  { value: 'todo', label: 'Todo' }
];

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(value);

const formatPercent = (value: number | null | undefined) => 
  value == null ? '0.0%' : `${Number(value).toFixed(1)}%`;

const getRentabilidadColor = (value: number) => 
  value >= 30 ? 'green' : value >= 15 ? 'yellow' : 'red';

export default function GerenciaFinanciera() {
  const { user, logout } = useAuth();
  const { isConnected } = useNotificationCount();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('resumen');
  const [periodo, setPeriodo] = useState('mes_actual');
  
  // KPIs
  const [kpis, setKpis] = useState<any>(null);
  
  // Rankings
  const [rankingFinanciadores, setRankingFinanciadores] = useState<any[]>([]);
  const [rankingSucursales, setRankingSucursales] = useState<any[]>([]);
  
  // Análisis de costos
  const [analisisCostos, setAnalisisCostos] = useState<any[]>([]);
  const [promediosGenerales, setPromediosGenerales] = useState<any[]>([]);
  const [financiadores, setFinanciadores] = useState<any[]>([]);
  const [servicios, setServicios] = useState<any[]>([]);
  const [filtroFinanciador, setFiltroFinanciador] = useState<string>('');
  const [filtroServicio, setFiltroServicio] = useState<string>('');
  
  // Paginación
  const [pageAnalisis, setPageAnalisis] = useState(1);
  const [totalPagesAnalisis, setTotalPagesAnalisis] = useState(1);
  const [pagePromedios, setPagePromedios] = useState(1);
  const [totalPagesPromedios, setTotalPagesPromedios] = useState(1);
  
  // Modal detalle
  const [presupuestoDetalle, setPresupuestoDetalle] = useState<any>(null);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  useEffect(() => {
    if (activeTab === 'resumen') {
      cargarResumen();
    } else if (activeTab === 'analisis') {
      setPageAnalisis(1);
      setPagePromedios(1);
      cargarAnalisisCostos();
    }
  }, [activeTab, periodo, filtroFinanciador, filtroServicio]);

  useEffect(() => {
    if (activeTab === 'analisis') {
      cargarAnalisisCostos();
    }
  }, [pageAnalisis, pagePromedios]);

  useEffect(() => {
    cargarFinanciadores();
  }, []);
  
  useEffect(() => {
    cargarServicios();
  }, [filtroFinanciador, periodo]);

  const cargarResumen = async () => {
    try {
      setLoading(true);
      const [kpisRes, financiadoresRes, sucursalesRes] = await Promise.all([
        api.get(`/reportes/financiero/kpis?periodo=${periodo}`),
        api.get(`/reportes/financiero/ranking-financiadores?periodo=${periodo}`),
        api.get(`/reportes/financiero/ranking-sucursales?periodo=${periodo}`)
      ]);
      setKpis(kpisRes.data);
      setRankingFinanciadores(financiadoresRes.data);
      setRankingSucursales(sucursalesRes.data);
    } catch (error) {
      console.error('Error cargando resumen:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarAnalisisCostos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ periodo, page: pageAnalisis.toString(), limit: '100' });
      if (filtroFinanciador) params.append('financiador_id', filtroFinanciador);
      if (filtroServicio) params.append('servicio_id', filtroServicio);
      
      const paramsPromedios = new URLSearchParams({ periodo, page: pagePromedios.toString(), limit: '100' });
      if (filtroServicio) paramsPromedios.append('servicio_id', filtroServicio);
      
      const [analisisRes, promediosRes] = await Promise.all([
        api.get(`/reportes/financiero/analisis-costos?${params}`),
        api.get(`/reportes/financiero/promedios-generales?${paramsPromedios}`)
      ]);
      
      setAnalisisCostos(analisisRes.data.data);
      setTotalPagesAnalisis(analisisRes.data.totalPages);
      setPromediosGenerales(promediosRes.data.data);
      setTotalPagesPromedios(promediosRes.data.totalPages);
    } catch (error) {
      console.error('Error cargando análisis:', error);
    } finally {
      setLoading(false);
    }
  };

  const cargarFinanciadores = async () => {
    try {
      const response = await api.get('/prestaciones/financiadores');
      setFinanciadores(response.data);
    } catch (error) {
      console.error('Error cargando financiadores:', error);
    }
  };

  const cargarServicios = async () => {
    try {
      if (filtroFinanciador) {
        const response = await api.get(`/reportes/financiero/servicios-por-financiador?financiador_id=${filtroFinanciador}&periodo=${periodo}`);
        setServicios(response.data);
      } else {
        const response = await api.get('/admin/servicios-crud');
        setServicios(response.data);
      }
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  };

  const verDetallePresupuesto = async (presupuesto: any) => {
    try {
      const response = await api.get(`/presupuestos/${presupuesto.idPresupuestos}`);
      setPresupuestoDetalle(response.data);
      setModalDetalleAbierto(true);
    } catch (error) {
      console.error('Error cargando detalle:', error);
    }
  };



  if (loading && activeTab === 'resumen' && !kpis) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Container fluid p="xl">
      <Group justify="space-between" mb={20}>
        <Title fw={500} order={2} c="blue">Gerencia Financiera</Title>
        <Group gap="xs">
          <UserCircleIcon style={ICON_SIZE} />
          <Text fw={500} size="sm" tt="capitalize">{user?.username}</Text>
          <ConnectionStatus isConnected={isConnected} />
          <Button ml="md" variant="outline" color="red" size="xs" onClick={logout} rightSection={<ArrowRightStartOnRectangleIcon style={ICON_SIZE}/>}>
            Salir
          </Button>
        </Group>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab} color="blue" radius="md">
        <Tabs.List>
          <Tabs.Tab value="resumen">
            <Group gap="xs">
              <ChartBarIcon style={ICON_SIZE} />
              Resumen Ejecutivo
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="analisis">
            <Group gap="xs">
              <ArrowTrendingUpIcon style={ICON_SIZE} />
              Análisis de Costos
            </Group>
          </Tabs.Tab>
          <Tabs.Tab value="historial">
            <Group gap="xs">
              <ClockIcon style={ICON_SIZE} />
              Historial
            </Group>
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="resumen" pt="md">
          <Select
            label="Período"
            value={periodo}
            onChange={(value) => setPeriodo(value || 'mes_actual')}
            data={PERIODOS_DATA}
            mb="xl"
            style={{ maxWidth: 250 }}
          />

          {kpis && (
            <>
              <Grid mb="xl">
                <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group gap="xs" mb="xs">
                      <BanknotesIcon style={{ ...ICON_SIZE_LG, color: '#228be6' }} />
                      <Text size="sm" c="dimmed">Facturación</Text>
                    </Group>
                    <Text size="xl" fw={700}>{formatCurrency(kpis.facturacion_total)}</Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group gap="xs" mb="xs">
                      <BanknotesIcon style={{ ...ICON_SIZE_LG, color: '#20c997' }} />
                      <Text size="sm" c="dimmed">Utilidad Total</Text>
                    </Group>
                    <Text size="xl" fw={700}>{formatCurrency(kpis.utilidad_total)}</Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group gap="xs" mb="xs">
                      <ArrowTrendingUpIcon style={{ ...ICON_SIZE_LG, color: '#40c057' }} />
                      <Text size="sm" c="dimmed">Rentabilidad</Text>
                    </Group>
                    <Text size="xl" fw={700}>{formatPercent(kpis.rentabilidad_promedio)}</Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group gap="xs" mb="xs">
                      <CheckCircleIcon style={{ ...ICON_SIZE_LG, color: '#fab005' }} />
                      <Text size="sm" c="dimmed">Tasa Aprobación</Text>
                    </Group>
                    <Text size="xl" fw={700}>{formatPercent(kpis.tasa_aprobacion)}</Text>
                  </Card>
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 6, md: 2.4 }}>
                  <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Group gap="xs" mb="xs">
                      <ClockIcon style={{ ...ICON_SIZE_LG, color: '#fd7e14' }} />
                      <Text size="sm" c="dimmed">Tiempo Auditoría</Text>
                    </Group>
                    <Text size="xl" fw={700}>{kpis.tiempo_auditoria_horas.toFixed(1)}h</Text>
                  </Card>
                </Grid.Col>
              </Grid>

              <Title order={4} mb="md">Ranking por Financiador</Title>
              <Paper withBorder radius="md" shadow="sm" mb="xl">
                <Table.ScrollContainer minWidth={800}>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Financiador</Table.Th>
                        <Table.Th>Presupuestos</Table.Th>
                        <Table.Th>Facturación</Table.Th>
                        <Table.Th>Rent%</Table.Th>
                        <Table.Th>Días Cobranza</Table.Th>
                        <Table.Th>Acuerdo</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {rankingFinanciadores.map((f, idx) => (
                        <Table.Tr key={idx}>
                          <Table.Td>{f.Financiador}</Table.Td>
                          <Table.Td>{f.total_presupuestos}</Table.Td>
                          <Table.Td>{formatCurrency(f.facturacion_total)}</Table.Td>
                          <Table.Td>
                            <Text c={getRentabilidadColor(f.rentabilidad_promedio)}>
                              {formatPercent(f.rentabilidad_promedio)}
                            </Text>
                          </Table.Td>
                          <Table.Td>{f.dias_cobranza} días</Table.Td>
                          <Table.Td>{f.acuerdo || '-'}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Paper>

              <Title order={4} mb="md">Ranking por Sucursal</Title>
              <Paper withBorder radius="md" shadow="sm">
                <Table.ScrollContainer minWidth={800}>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Sucursal</Table.Th>
                        <Table.Th>Presupuestos</Table.Th>
                        <Table.Th>Facturación</Table.Th>
                        <Table.Th>Rent%</Table.Th>
                        <Table.Th>Ticket Prom</Table.Th>
                        <Table.Th>Aprobación%</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {rankingSucursales.map((s, idx) => (
                        <Table.Tr key={idx}>
                          <Table.Td>{s.sucursal}</Table.Td>
                          <Table.Td>{s.total_presupuestos}</Table.Td>
                          <Table.Td>{formatCurrency(s.facturacion_total)}</Table.Td>
                          <Table.Td>
                            <Text c={getRentabilidadColor(s.rentabilidad_promedio)}>
                              {formatPercent(s.rentabilidad_promedio)}
                            </Text>
                          </Table.Td>
                          <Table.Td>{formatCurrency(s.ticket_promedio)}</Table.Td>
                          <Table.Td>{formatPercent(s.tasa_aprobacion)}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Paper>
            </>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="historial" pt="md">
          <ListaPresupuestos 
            onEditarPresupuesto={() => {}} 
            recargarTrigger={0}
            soloConsulta={true}
            onVerDetalle={verDetallePresupuesto}
          />
        </Tabs.Panel>

        <Tabs.Panel value="analisis" pt="md">
          <Group mb="md" grow>
            <Select
              label="Período"
              value={periodo}
              onChange={(value) => setPeriodo(value || 'mes_actual')}
              data={PERIODOS_DATA}
            />
            <Select
              label="Financiador"
              placeholder="Seleccionar financiador"
              value={filtroFinanciador}
              onChange={(value) => setFiltroFinanciador(value || '')}
              data={financiadores.map(f => ({ value: f.id.toString(), label: f.Financiador }))}
              clearable
              searchable
            />
            <Select
              label="Servicio"
              placeholder="Todos"
              value={filtroServicio}
              onChange={(value) => setFiltroServicio(value || '')}
              data={[
                { value: '', label: 'Todos' },
                ...servicios.map(s => ({ value: s.id_servicio.toString(), label: s.nombre }))
              ]}
              clearable
              searchable
            />
          </Group>

          <Group gap="xs" mb="md">
            <Title order={5}>Detalle por Financiador</Title>
            <Tooltip label="Análisis basado en presupuestos finalizados del período seleccionado" position="right">
              <InformationCircleIcon style={{ ...ICON_SIZE_SM, color: '#228be6', cursor: 'help' }} />
            </Tooltip>
          </Group>
          <Paper withBorder radius="md" shadow="sm" mb="xl">
            <Table.ScrollContainer minWidth={1000} mah={600}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Servicio</Table.Th>
                    <Table.Th>Financiador</Table.Th>
                    <Table.Th>Tipo Unidad</Table.Th>
                    <Table.Th>Veces Usado</Table.Th>
                    <Table.Th>Valor Asignado Prom</Table.Th>
                    <Table.Th>Valor Facturar Prom</Table.Th>
                    <Table.Th>Margen%</Table.Th>
                    <Table.Th>Última Vez</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {loading ? (
                    <Table.Tr>
                      <Table.Td colSpan={8}>
                        <Center p="xl">
                          <Loader />
                        </Center>
                      </Table.Td>
                    </Table.Tr>
                  ) : analisisCostos.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={8}>
                        <Text ta="center" c="dimmed">No hay datos para el período seleccionado</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    analisisCostos.map((item, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td>{item.servicio}</Table.Td>
                        <Table.Td>{item.Financiador}</Table.Td>
                        <Table.Td>{item.tipo_unidad}</Table.Td>
                        <Table.Td>{item.veces_usado}</Table.Td>
                        <Table.Td>{formatCurrency(item.valor_asignado_promedio)}</Table.Td>
                        <Table.Td>{formatCurrency(item.valor_facturar_promedio)}</Table.Td>
                        <Table.Td>
                          <Text c={getRentabilidadColor(item.margen_promedio)}>
                            {formatPercent(item.margen_promedio)}
                          </Text>
                        </Table.Td>
                        <Table.Td>{new Date(item.ultima_vez_usado).toLocaleDateString()}</Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {totalPagesAnalisis > 1 && (
              <Group justify="center" p="md">
                <Pagination total={totalPagesAnalisis} value={pageAnalisis} onChange={setPageAnalisis} />
              </Group>
            )}
          </Paper>

          <Group gap="xs" mb="md">
            <Title order={5}>Promedios Generales por Servicio</Title>
            <Tooltip label="Promedios calculados sobre todos los presupuestos finalizados del período seleccionado" position="right">
              <InformationCircleIcon style={{ ...ICON_SIZE_SM, color: '#228be6', cursor: 'help' }} />
            </Tooltip>
          </Group>
          <Paper withBorder radius="md" shadow="sm">
            <Table.ScrollContainer minWidth={800} mah={600}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Servicio</Table.Th>
                    <Table.Th>Tipo Unidad</Table.Th>
                    <Table.Th>Veces Usado</Table.Th>
                    <Table.Th>Valor Asignado Prom</Table.Th>
                    <Table.Th>Valor Facturar Prom</Table.Th>
                    <Table.Th>Margen%</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {loading ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Center p="xl">
                          <Loader />
                        </Center>
                      </Table.Td>
                    </Table.Tr>
                  ) : promediosGenerales.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={6}>
                        <Text ta="center" c="dimmed">No hay datos para el período seleccionado</Text>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    promediosGenerales.map((item, idx) => (
                      <Table.Tr key={idx}>
                        <Table.Td fw={600}>{item.servicio}</Table.Td>
                        <Table.Td>{item.tipo_unidad}</Table.Td>
                        <Table.Td fw={600}>{item.veces_usado}</Table.Td>
                        <Table.Td fw={600}>{formatCurrency(item.valor_asignado_promedio)}</Table.Td>
                        <Table.Td fw={600}>{formatCurrency(item.valor_facturar_promedio)}</Table.Td>
                        <Table.Td>
                          <Text fw={700} c={getRentabilidadColor(item.margen_promedio)}>
                            {formatPercent(item.margen_promedio)}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {totalPagesPromedios > 1 && (
              <Group justify="center" p="md">
                <Pagination total={totalPagesPromedios} value={pagePromedios} onChange={setPagePromedios} />
              </Group>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <ModalDetallePresupuesto
        opened={modalDetalleAbierto}
        onClose={() => {
          setModalDetalleAbierto(false);
          setPresupuestoDetalle(null);
        }}
        presupuesto={presupuestoDetalle}
      />
    </Container>
  );
}
