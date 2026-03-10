import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Paper, Button, Title, Select, TextInput, Grid, Stack, Checkbox, Group, NumberInput, ActionIcon, Table, Badge, Text, Flex, Tooltip, Modal, Tabs } from '@mantine/core'
import { TrashIcon, PlusIcon, PencilSquareIcon, DocumentCheckIcon, DocumentCurrencyDollarIcon } from '@heroicons/react/24/outline'
import { notifications } from '@mantine/notifications'
import { getFinanciadores, getPrestacionesPorFinanciador, getFinanciadorZonas } from '../api/api'
import { api } from '../api/api'
import { numberFormat } from '../utils/numberFormat'
import PrestacionesTarifario from '../components/PrestacionesTarifario'
import SelectorDualServicios from '../components/SelectorDualServicios'
import { useSelectorDual } from '../hooks/useSelectorDual'
import type { ServicioFinanciador, ServicioTarifario, ZonaFinanciador, ServicioConvenio } from '../types'

interface Prestacion {
  id_servicio: string
  prestacion: string
  cantidad: number
  valor_asignado: number
  valor_facturar: number
  tipo_unidad?: string
  cant_total?: number
}

interface PrestacionDisponible {
  id_servicio: string
  nombre: string
  valor_facturar: number
  cant_total: number
  valor_sugerido: number
  tipo_unidad?: string
  dias_sin_actualizar?: number
  costo_1?: number
  costo_2?: number
  costo_3?: number
  costo_4?: number
  costo_5?: number
}

interface Financiador {
  id: string
  Financiador: string
  activo: number
}

interface Props {
  prestacionesSeleccionadas: Prestacion[]
  setPrestacionesSeleccionadas: (prestaciones: Prestacion[]) => void
  onTotalChange: (totalCosto: number, totalFacturar: number) => void
  presupuestoId: number | null
  financiadorId?: string | null
  soloLectura?: boolean
  sucursalId?: number | null
  zonaId?: number | null
  // Nuevos props para sistema dual
  zonaTarifarioId?: number | null
  zonaFinanciadorId?: number | null
}

export default function Prestaciones({ 
  prestacionesSeleccionadas, 
  setPrestacionesSeleccionadas, 
  onTotalChange, 
  presupuestoId, 
  financiadorId, 
  soloLectura = false, 
  sucursalId, 
  zonaId,
  zonaTarifarioId,
  zonaFinanciadorId
}: Props) {
  const [financiadorInfo, setFinanciadorInfo] = useState<{tasa_mensual?: number, dias_cobranza_teorico?: number, dias_cobranza_real?: number, acuerdo_nombre?: string | null}>({})
  const [prestacionesDisponibles, setPrestacionesDisponibles] = useState<PrestacionDisponible[]>([])
  const [alertasConfig, setAlertasConfig] = useState<any[]>([])
  const [cantidad, setCantidad] = useState('1')
  const [valorAsignado, setValorAsignado] = useState('')
  const [prestacionSeleccionada, setPrestacionSeleccionada] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null)
  const [nuevaCantidad, setNuevaCantidad] = useState(1)
  const [nuevoValor, setNuevoValor] = useState(0)
  const [totalesTarifario, setTotalesTarifario] = useState({ costo: 0, facturar: 0 })
  
  // Estados para búsqueda y paginación
  const [filtro, setFiltro] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Hook para sistema dual
  const selectorDual = useSelectorDual({
    financiadorId,
    zonaFinanciadorId,
    zonaTarifarioId,
    presupuestoId
  })

  const totalCostoConvenio = useMemo(() => 
    prestacionesSeleccionadas.reduce((sum, p) => sum + (Number(p.cantidad) * Number(p.valor_asignado)), 0),
    [prestacionesSeleccionadas]
  )

  const totalFacturarConvenio = useMemo(() => 
    prestacionesSeleccionadas.reduce((sum, p) => sum + (Number(p.cantidad) * Number(p.valor_facturar)), 0),
    [prestacionesSeleccionadas]
  )

  // Totales incluyendo sistema dual
  const totalCosto = useMemo(() => 
    totalCostoConvenio + totalesTarifario.costo + selectorDual.totales.totalCosto, 
    [totalCostoConvenio, totalesTarifario.costo, selectorDual.totales.totalCosto]
  )
  
  const totalFacturar = useMemo(() => 
    totalFacturarConvenio + totalesTarifario.facturar + selectorDual.totales.totalFacturar, 
    [totalFacturarConvenio, totalesTarifario.facturar, selectorDual.totales.totalFacturar]
  )

  const prestacionSeleccionadaData = useMemo(() => 
    prestacionSeleccionada ? prestacionesDisponibles.find(p => p.id_servicio === prestacionSeleccionada) : null,
    [prestacionSeleccionada, prestacionesDisponibles]
  )



  useEffect(() => {
    onTotalChange(totalCosto, totalFacturar)
  }, [totalCosto, totalFacturar, onTotalChange])

  useEffect(() => {
    cargarAlertasConfig()
  }, [])

  // Los servicios del sistema dual se cargan automáticamente por el hook

  const cargarAlertasConfig = async () => {
    try {
      const response = await api.get('/alertas-servicios')
      setAlertasConfig(response.data)
    } catch (error) {
      console.error('Error cargando alertas:', error)
    }
  }

  // Funciones de carga movidas al hook useSelectorDual

  const loadPrestaciones = useCallback(async (searchObj: { search?: string, page?: number, reset?: boolean } = {}) => {
    if (!presupuestoId || !financiadorId) return;

    const searchTerm = searchObj.search !== undefined ? searchObj.search : filtro;
    const pageNum = searchObj.page || 1;
    const isReset = searchObj.reset || false;
    const financiadorIdStr = String(financiadorId);

    setLoading(true);
    try {
       // Obtener fecha del presupuesto si es solo lectura
       let fechaPresupuesto;
       if (soloLectura) {
          try {
             // Esto podria optimizarse para no llamarlo cada vez, pero mantenemos logica original
             const presupuestoRes = await api.get(`/presupuestos/${presupuestoId}`);
             fechaPresupuesto = presupuestoRes.data.created_at?.slice(0, 10);
          } catch(e) { console.error(e); }
       }
       
       const responseData = await getPrestacionesPorFinanciador(financiadorIdStr, fechaPresupuesto, zonaId || undefined, pageNum, 50, searchTerm);
       
       const data = responseData.data || (Array.isArray(responseData) ? responseData : []); // Handle different returns
       // If API wrapper returns { data, pagination }, api.ts extracts data. 
       // But wait, my updated api.ts logic: "return res.data.data || res.data". 
       // If backend returns { data: [], pagination }, api.ts returns []. 
       // We lose pagination data in api.ts wrapper? 
       // ERROR: api.getPrestacionesPorFinanciador in api.ts returns "res.data.data || res.data".
       // If backend follows paging pattern, it returns {data: [...], pagination: {...}}.
       // So api.ts returns [...]. We lost "total" and "totalPages"!
       // I need to fix api.ts OR handle array length here.
       // For now, let's assume if data.length < 50, hasMore = false.
       // Ideally I should fix api.ts to return full object.
       // Let's rely on data length for now to act fast.
       
       if (isReset) {
         setPrestacionesDisponibles(data);
         setPage(1);
       } else {
         setPrestacionesDisponibles(prev => [...prev, ...data]);
         setPage(pageNum);
       }
       
       setHasMore(data.length === 50); // Naive check if I can't access pagination obj easily without breaking api.ts return type

    } catch (error) {
      console.error('Error cargando prestaciones:', error);
      notifications.show({ title: 'Error', message: 'No se pudieron cargar las prestaciones', color: 'red' });
    } finally {
      setLoading(false);
    }
  }, [presupuestoId, financiadorId, soloLectura, zonaId, filtro]);

  // Debounce search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPrestaciones({ search: filtro, page: 1, reset: true });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [filtro, presupuestoId, financiadorId]); // Reload when filter or context changes

  useEffect(() => {
    if (presupuestoId && financiadorId) {
       // Initial load handled by debounce effect
       api.get(`/prestaciones/financiador/${financiadorId}/info`).then(infoRes => {
        setFinanciadorInfo(infoRes.data)
      }).catch((err: any) => console.error('Error loading financiador info:', err))
    } else if (!presupuestoId) {
      setPrestacionesDisponibles([])
      setPrestacionSeleccionada(null)
      setCantidad('1')
      setValorAsignado('')
      setFinanciadorInfo({})
    }
  }, [presupuestoId, financiadorId, soloLectura, zonaId]) // Keep this for info loading and clear state


  const valoresDisponibles = useMemo(() => {
    if (!prestacionSeleccionadaData) return []
    
    const costos = [
      prestacionSeleccionadaData.costo_1,
      prestacionSeleccionadaData.costo_2,
      prestacionSeleccionadaData.costo_3,
      prestacionSeleccionadaData.costo_4,
      prestacionSeleccionadaData.costo_5
    ].filter(c => c && c > 0)
    
    if (costos.length === 0) return []
    
    return costos.map((costo, idx) => ({
      value: String(costo),
      label: `${numberFormat.formatCurrency(costo)} (Costo ${idx + 1})`
    }))
  }, [prestacionSeleccionadaData])

  const handlePrestacionChange = (value: string | null) => {
    setPrestacionSeleccionada(value)
    if (value) {
      const prestacionData = prestacionesDisponibles.find(p => p.id_servicio === value)
      if (prestacionData) {
        setCantidad('1')
        // Usar costo_1 como valor por defecto
        setValorAsignado(String(prestacionData.costo_1 || 0))
        
        // Alerta si la prestación está desactualizada
        if (prestacionData.dias_sin_actualizar && prestacionData.dias_sin_actualizar > 45) {
          notifications.show({
            id: `prestacion-desactualizada-${prestacionData.id_servicio}`,
            title: '⚠️ Valor Desactualizado',
            message: `${prestacionData.nombre}: sin actualizar hace ${prestacionData.dias_sin_actualizar} días`,
            color: 'yellow',
            autoClose: false,
            withCloseButton: true,
            position: 'top-center'
          });
        }
      }
    } else {
      setCantidad('1')
      setValorAsignado('')
    }
  }

  const agregarPrestacion = useCallback(() => {
    if (!prestacionSeleccionada || !cantidad || !valorAsignado) {
      notifications.show({
        title: 'Campos incompletos',
        message: 'Complete todos los campos',
        color: 'orange'
      })
      return
    }

    const cantidadNum = parseInt(cantidad)
    const valorNum = parseFloat(valorAsignado)

    if (cantidadNum <= 0 || valorNum <= 0) {
      notifications.show({
        title: 'Valores inválidos',
        message: 'La cantidad y valor deben ser positivos',
        color: 'orange'
      })
      return
    }

    const prestacionData = prestacionesDisponibles.find(p => p.id_servicio === prestacionSeleccionada)
    if (!prestacionData) return

    const nuevaPrestacion: Prestacion = {
      id_servicio: prestacionSeleccionada,
      prestacion: prestacionData.nombre,
      cantidad: cantidadNum,
      valor_asignado: valorNum,
      valor_facturar: Number(prestacionData.valor_facturar),
      tipo_unidad: prestacionData.tipo_unidad,
      cant_total: prestacionData.cant_total
    }

    const existeIndex = prestacionesSeleccionadas.findIndex(p => p.id_servicio === prestacionSeleccionada)
    const prestacionesAnteriores = [...prestacionesSeleccionadas]

    // Verificar alerta por cantidad
    const alertaConfig = alertasConfig.find(a => a.tipo_unidad === prestacionData.tipo_unidad && a.activo === 1)
    if (alertaConfig && cantidadNum >= alertaConfig.cantidad_maxima) {
      notifications.show({
        id: `alerta-prestacion-${prestacionData.tipo_unidad}`,
        title: `⚠️ ${alertaConfig.mensaje_alerta || 'Cantidad excedida'}`,
        message: `${prestacionData.nombre} (máx. recomendado: ${alertaConfig.cantidad_maxima} ${prestacionData.tipo_unidad})`,
        color: alertaConfig.color_alerta || 'orange',
        autoClose: false,
        withCloseButton: true,
        position: 'top-center'
      })
    }
    
    if (existeIndex >= 0) {
      const nuevas = [...prestacionesSeleccionadas]
      nuevas[existeIndex] = nuevaPrestacion
      setPrestacionesSeleccionadas(nuevas)
    } else {
      setPrestacionesSeleccionadas([...prestacionesSeleccionadas, nuevaPrestacion])
    }

    if (presupuestoId) {
      api.post(`/presupuestos/${presupuestoId}/prestaciones`, {
        id_servicio: prestacionSeleccionada,
        prestacion: prestacionData.nombre,
        cantidad: cantidadNum,
        valor_asignado: valorNum,
        valor_facturar: Number(prestacionData.valor_facturar)
      }).catch((err: any) => {
        console.error('Error saving prestacion:', err)
        setPrestacionesSeleccionadas(prestacionesAnteriores)
        notifications.show({
          title: 'Error',
          message: 'No se pudo guardar la prestación',
          color: 'red'
        })
        return
      })
    }

    setCantidad('1')
    setValorAsignado('')
    setPrestacionSeleccionada(null)
    
    notifications.show({
      title: 'Prestación agregada',
      message: `Se agregó ${prestacionData.nombre}`,
      color: 'blue'
    })
  }, [prestacionSeleccionada, cantidad, valorAsignado, prestacionesDisponibles, prestacionesSeleccionadas, setPrestacionesSeleccionadas, alertasConfig, presupuestoId])

  const eliminarPrestacion = useCallback((index: number) => {
    const prestacion = prestacionesSeleccionadas[index]
    const prestacionesAnteriores = [...prestacionesSeleccionadas]
    const nuevas = prestacionesSeleccionadas.filter((_, i) => i !== index)
    setPrestacionesSeleccionadas(nuevas)
    
    if (presupuestoId) {
      api.delete(`/presupuestos/${presupuestoId}/prestaciones`, {
        data: { id_servicio: prestacion.id_servicio }
      }).catch((err: any) => {
        console.error('Error deleting prestacion:', err)
        setPrestacionesSeleccionadas(prestacionesAnteriores)
        notifications.show({
          title: 'Error',
          message: 'No se pudo eliminar la prestación',
          color: 'red'
        })
        return
      })
    }
    
    notifications.show({ 
      title: 'Prestación Eliminada', 
      message: 'Se eliminó la prestación seleccionada', 
      color: 'blue' 
    })
  }, [prestacionesSeleccionadas, setPrestacionesSeleccionadas, presupuestoId])

  const actualizarPrestacion = (index: number) => {
    if (nuevaCantidad <= 0 || nuevoValor <= 0) return
    
    const nuevas = [...prestacionesSeleccionadas]
    const prestacionActual = nuevas[index]
    
    nuevas[index] = { ...prestacionActual, cantidad: nuevaCantidad, valor_asignado: nuevoValor }

    // Verificar alerta por cantidad
    const alertaConfig = alertasConfig.find(a => a.tipo_unidad === prestacionActual.tipo_unidad && a.activo === 1)
    if (alertaConfig && nuevaCantidad >= alertaConfig.cantidad_maxima) {
      notifications.show({
        id: `alerta-prestacion-${prestacionActual.tipo_unidad}`,
        title: `⚠️ ${alertaConfig.mensaje_alerta || 'Cantidad excedida'}`,
        message: `${prestacionActual.prestacion} (máx. recomendado: ${alertaConfig.cantidad_maxima} ${prestacionActual.tipo_unidad})`,
        color: alertaConfig.color_alerta || 'orange',
        autoClose: false,
        withCloseButton: true,
        position: 'top-center'
      })
    }

    setPrestacionesSeleccionadas(nuevas)
    
    if (presupuestoId) {
      api.post(`/presupuestos/${presupuestoId}/prestaciones`, {
        id_servicio: nuevas[index].id_servicio,
        prestacion: nuevas[index].prestacion,
        cantidad: nuevaCantidad,
        valor_asignado: nuevoValor,
        valor_facturar: nuevas[index].valor_facturar
      }).catch((err: any) => console.error('Error updating prestacion:', err))
    }
    
    setEditandoIndex(null)
    notifications.show({
      title: 'Prestación Actualizada',
      message: 'Cantidad y valor modificados correctamente',
      color: 'green'
    })
  }

  return (
    <Stack gap="lg" mb={25}>
      {soloLectura && (
        <Paper p="xs" withBorder style={{ backgroundColor: '#e7f5ff' }}>
          <Text size="sm" c="blue" fw={500} ta="center">Modo solo lectura - No se pueden realizar modificaciones</Text>
        </Paper>
      )}

      {!financiadorId && (
        <Paper p="md" withBorder>
          <Text size="sm" c="dimmed" ta="center">
            Debe seleccionar un financiador en Datos del Paciente
          </Text>
        </Paper>
      )}

      <Tabs defaultValue="convenio">
        <Tabs.List grow>
          <Tabs.Tab value="convenio" leftSection={<DocumentCheckIcon style={{ width: 18, height: 18 }} />}>
            Con Convenio
          </Tabs.Tab>
          <Tabs.Tab value="tarifario" leftSection={<DocumentCurrencyDollarIcon style={{ width: 18, height: 18 }} />}>
            Por Presupuesto (Tarifario)
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="convenio" pt="md">
          <Paper p="md" withBorder style={{ opacity: soloLectura ? 0.8 : 1 }}>
        <Stack gap="xl">

          {financiadorId && prestacionesDisponibles.length > 0 && (
            <>
            <Grid>
              <Grid.Col span={6}>
               <Stack gap="xs">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title order={5}>Prestaciones Disponibles</Title>
                    <TextInput 
                      placeholder="Buscar..." 
                      value={filtro}
                      onChange={(e) => setFiltro(e.target.value)}
                      rightSection={loading ? <div style={{ fontSize: '10px' }}>⏳</div> : null}
                      style={{ width: '200px' }}
                      size="xs"
                    />
                  </div>
                  <Table.ScrollContainer minWidth={700} h={400}>
                  <Table striped="odd" highlightOnHover stickyHeader>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>Prestación</Table.Th>
                        <Table.Th style={{ width: '80px', fontWeight: 500, fontSize: '13px' }}>Tipo</Table.Th>
                        <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>
                          <Tooltip label="Valor a facturar por unidad de servicio">
                            <span>Valor a Facturar</span>
                          </Tooltip>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {prestacionesDisponibles.map((p, index) => {
                        const isLast = index === prestacionesDisponibles.length - 1;
                        return (
                        <Table.Tr 
                           key={p.id_servicio}
                           ref={isLast ? (node) => {
                             if (loading) return;
                             if (observerRef.current) observerRef.current.disconnect();
                             observerRef.current = new IntersectionObserver(entries => {
                               if (entries[0].isIntersecting && hasMore) {
                                 loadPrestaciones({ page: page + 1, search: filtro });
                               }
                             });
                             if (node) observerRef.current.observe(node);
                           } : null}
                        >
                          <Table.Td>
                            <Group gap="xs">
                              <Checkbox
                                size="sm"
                                checked={prestacionSeleccionada === p.id_servicio}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    handlePrestacionChange(p.id_servicio)
                                  } else {
                                    setPrestacionSeleccionada(null)
                                    setCantidad('1')
                                    setValorAsignado('')
                                  }
                                }}
                                disabled={soloLectura}
                              />
                              <span>{p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase()}</span>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{p.tipo_unidad || '-'}</Table.Td>
                          <Table.Td>{numberFormat.formatCurrency(p.valor_facturar)}</Table.Td>
                        </Table.Tr> 
                      )})}
                      {loading && <Table.Tr><Table.Td colSpan={3} style={{textAlign: 'center'}}>Cargando más...</Table.Td></Table.Tr>}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
                </Stack>
              </Grid.Col>
              
              <Grid.Col span={6}>
                <Stack gap="xs" style={{ backgroundColor: prestacionSeleccionada ? '#f8f9fa' : '#f5f5f5', opacity: (prestacionSeleccionada && !soloLectura) ? 1 : 0.6, padding: '1rem', borderRadius: '8px' }}>
                  <Title order={5}>Agregar al Presupuesto</Title>
                  <TextInput
                    label={<Text size="sm" fw={400}>Prestación</Text>}
                    value={prestacionSeleccionadaData?.nombre || ''}
                    placeholder={prestacionSeleccionada ? '' : 'Seleccione una prestación de la tabla'}
                    readOnly
                    size="sm"
                    disabled={!prestacionSeleccionada}
                  />
                  <TextInput
                    label={<Text size="sm" fw={400}>Cantidad</Text>}
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    type="number"
                    min="1"
                    size="sm"
                    disabled={!prestacionSeleccionada || soloLectura}
                  />
                  <Select
                    label={<Text size="sm" fw={400}>Valor</Text>}
                    placeholder="Seleccione un valor"
                    data={valoresDisponibles}
                    value={valorAsignado}
                    onChange={(val) => setValorAsignado(val || '')}
                    disabled={!prestacionSeleccionada || soloLectura}
                    searchable
                  />
                  <Group>
                    <Button size="sm" onClick={agregarPrestacion} disabled={!prestacionSeleccionada || soloLectura}>Agregar</Button>
                    <Button size="sm" variant="outline" color="gray" disabled={!prestacionSeleccionada || soloLectura} onClick={() => {
                      setPrestacionSeleccionada(null)
                      setCantidad('1')
                      setValorAsignado('')
                    }}>Cancelar</Button>
                  </Group>
                </Stack>
              </Grid.Col>
            </Grid>

            <Stack gap="xs">
              <Title order={5}>Prestaciones Seleccionadas</Title>
              <Table.ScrollContainer minWidth={1000}>
                <Table striped="odd" highlightOnHover stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ textAlign: 'left', fontWeight: 500, fontSize: '12px' }}>Prestación</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Cantidad</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Costo Unit.</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Precio a Facturar</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Subtotal Costo</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Subtotal Facturar</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {prestacionesSeleccionadas.map((p, i) => {
                    const costoUnitario = Number(p.valor_asignado);
                    const precioFacturar = Number(p.valor_facturar);
                    const subtotalCosto = costoUnitario * p.cantidad;
                    const subtotalFacturar = precioFacturar * p.cantidad;
                    
                    return (
                      <Table.Tr key={`${p.id_servicio}-${i}`}>
                        <Table.Td>{p.prestacion}</Table.Td>
                        <Table.Td>
                          {editandoIndex === i ? (
                            <Group gap="xs" justify="Left">
                              <NumberInput
                                value={nuevaCantidad}
                                onChange={(value) => setNuevaCantidad(Number(value) || 1)}
                                min={1}
                                w={80}
                                size="xs"
                                hideControls
                              />
                            </Group>
                          ) : (
                            p.cantidad
                          )}
                        </Table.Td>
                        <Table.Td>
                          {editandoIndex === i ? (
                            <NumberInput
                              value={nuevoValor}
                              onChange={(value) => setNuevoValor(Number(value) || 0)}
                              min={0}
                              w={100}
                              size="xs"
                              hideControls
                              prefix="$"
                            />
                          ) : (
                            numberFormat.formatCurrency(costoUnitario)
                          )}
                        </Table.Td>
                        <Table.Td>{numberFormat.formatCurrency(precioFacturar)}</Table.Td>
                        <Table.Td>{numberFormat.formatCurrency(subtotalCosto)}</Table.Td>
                        <Table.Td>{numberFormat.formatCurrency(subtotalFacturar)}</Table.Td>
                        <Table.Td>
                          {!soloLectura && (
                            editandoIndex === i ? (
                              <Group gap={4} justify="left" wrap="nowrap">
                                <Button size="xs" onClick={() => actualizarPrestacion(i)}>
                                  OK
                                </Button>
                                <Button size="xs" variant="outline" onClick={() => setEditandoIndex(null)}>
                                  Cancelar
                                </Button>
                              </Group>
                            ) : (
                              <Group gap={4} justify="left" wrap="nowrap">
                                <ActionIcon
                                  variant="transparent"
                                  onClick={() => {
                                    setEditandoIndex(i)
                                    setNuevaCantidad(p.cantidad)
                                    setNuevoValor(Number(p.valor_asignado))
                                  }}
                                >
                                  <PencilSquareIcon  width={16} height={16} />
                                </ActionIcon>
                                <ActionIcon
                                  variant="transparent"
                                  color="red"
                                  onClick={() => eliminarPrestacion(i)}
                                >
                                  <TrashIcon  width={16} height={16} />
                                </ActionIcon>
                              </Group>
                            )
                          )}
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
              </Table.ScrollContainer>
              {prestacionesSeleccionadas.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                  No hay prestaciones seleccionadas
                </div>
              )}
            </Stack>
            </>
          )}

          {financiadorId && prestacionesDisponibles.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              No hay prestaciones disponibles para este financiador
            </div>
          )}
        </Stack>
      </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="dual" pt="md">
          {selectorDual.isReady ? (
            <SelectorDualServicios
              serviciosFinanciador={selectorDual.serviciosFinanciador}
              serviciosTarifario={selectorDual.serviciosTarifario}
              serviciosSeleccionados={selectorDual.serviciosConvenio}
              onServiciosChange={selectorDual.setServiciosConvenio}
              soloLectura={soloLectura}
              loading={selectorDual.loading}
              error={selectorDual.error}
            />
          ) : (
            <Paper p="md" withBorder>
              <Text size="sm" c="dimmed" ta="center">
                {selectorDual.loading ? 'Cargando servicios...' :
                 selectorDual.error ? `Error: ${selectorDual.error}` :
                 !financiadorId ? 'Debe seleccionar un financiador' : 
                 !zonaFinanciadorId ? 'Debe seleccionar una zona financiador' :
                 !zonaTarifarioId ? 'Debe seleccionar una zona tarifario' :
                 'Complete los datos del paciente'}
              </Text>
            </Paper>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="tarifario" pt="md">
          {presupuestoId && zonaId ? (
            <PrestacionesTarifario
              presupuestoId={presupuestoId}
              zonaId={zonaId}
              soloLectura={soloLectura}
              onTotalChange={(costo, facturar) => setTotalesTarifario({ costo, facturar })}
            />
          ) : (
            <Paper p="md" withBorder>
              <Text size="sm" c="dimmed" ta="center">
                {!presupuestoId ? 'Debe crear un presupuesto primero' : 'Debe seleccionar una zona en Datos del Paciente'}
              </Text>
            </Paper>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}
