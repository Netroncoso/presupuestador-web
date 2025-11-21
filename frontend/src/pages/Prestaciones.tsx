import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Paper, Button, Title, Select, TextInput, Grid, Stack, Checkbox, Group, NumberInput, ActionIcon, Table, Badge, Text, Flex, Tooltip } from '@mantine/core'
import { TrashIcon, PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { notifications } from '@mantine/notifications'
import { getPrestadores, getPrestacionesPorPrestador } from '../api/api'
import { api } from '../api/api'

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
}

interface Financiador {
  idobra_social: string
  Financiador: string
}

interface Props {
  prestacionesSeleccionadas: Prestacion[]
  setPrestacionesSeleccionadas: (prestaciones: Prestacion[]) => void
  onTotalChange: (totalCosto: number, totalFacturar: number) => void
  presupuestoId: number | null
  financiadorId?: string | null
  onFinanciadorChange?: (financiadorId: string | null, financiadorInfo: any) => void
}

export default function Prestaciones({ prestacionesSeleccionadas, setPrestacionesSeleccionadas, onTotalChange, presupuestoId, financiadorId, onFinanciadorChange }: Props) {
  const [financiadores, setFinanciadores] = useState<Financiador[]>([])
  const [financiadorSeleccionado, setFinanciadorSeleccionado] = useState<string | null>(null)
  const [financiadorConfirmado, setFinanciadorConfirmado] = useState(false)
  const [financiadorInfo, setFinanciadorInfo] = useState<{tasa_mensual?: number, dias_cobranza_teorico?: number, dias_cobranza_real?: number, acuerdo_nombre?: string | null}>({})
  const [prestacionesDisponibles, setPrestacionesDisponibles] = useState<PrestacionDisponible[]>([])
  const [cantidad, setCantidad] = useState('1')
  const [valorAsignado, setValorAsignado] = useState('')
  const [prestacionSeleccionada, setPrestacionSeleccionada] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null)
  const [nuevaCantidad, setNuevaCantidad] = useState(1)
  const [nuevoValor, setNuevoValor] = useState(0)

  const totalCosto = useMemo(() => 
    prestacionesSeleccionadas.reduce((sum, p) => sum + (Number(p.cantidad) * Number(p.valor_asignado)), 0),
    [prestacionesSeleccionadas]
  )

  const totalFacturar = useMemo(() => 
    prestacionesSeleccionadas.reduce((sum, p) => sum + (Number(p.cantidad) * Number(p.valor_facturar)), 0),
    [prestacionesSeleccionadas]
  )

  const prestacionSeleccionadaData = useMemo(() => 
    prestacionSeleccionada ? prestacionesDisponibles.find(p => p.id_servicio === prestacionSeleccionada) : null,
    [prestacionSeleccionada, prestacionesDisponibles]
  )

  const financiadoresOptions = useMemo(() => 
    financiadores.map(p => ({
      value: String(p.idobra_social),
      label: p.Financiador
    })),
    [financiadores]
  )

  useEffect(() => {
    onTotalChange(totalCosto, totalFacturar)
  }, [totalCosto, totalFacturar, onTotalChange])

  useEffect(() => {
    cargarFinanciadores()
  }, [])

  useEffect(() => {
    if (presupuestoId && financiadorId) {
      // Convertir a string para que coincida con el formato del select
      const financiadorIdStr = String(financiadorId)
      setFinanciadorSeleccionado(financiadorIdStr)
      // Marcar como confirmado automáticamente cuando se carga desde historial
      setFinanciadorConfirmado(true)
      cargarPrestacionesPorFinanciador(financiadorIdStr)
      
      api.get(`/prestaciones/prestador/${financiadorIdStr}/info`).then(infoRes => {
        setFinanciadorInfo(infoRes.data)
        // Notificar al componente padre sobre el financiador cargado
        if (onFinanciadorChange) {
          onFinanciadorChange(financiadorIdStr, infoRes.data)
        }
      }).catch((err: any) => console.error('Error loading financiador info:', err))
    } else if (!presupuestoId) {
      setFinanciadorSeleccionado(null)
      setFinanciadorConfirmado(false)
      setPrestacionesDisponibles([])
      setPrestacionSeleccionada(null)
      setCantidad('1')
      setValorAsignado('')
      setFinanciadorInfo({})
    }
  }, [presupuestoId, financiadorId, onFinanciadorChange])

  const cargarFinanciadores = async () => {
    try {
      const data = await getPrestadores()
      setFinanciadores(data)
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar los financiadores',
        color: 'red'
      })
    }
  }

  const cargarPrestacionesPorFinanciador = async (financiadorId: string) => {
    setLoading(true)
    try {
      const data = await getPrestacionesPorPrestador(financiadorId)
      setPrestacionesDisponibles(data)
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'No se pudieron cargar las prestaciones',
        color: 'red'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFinanciadorChange = async (value: string | null) => {
    setFinanciadorSeleccionado(value)
    setFinanciadorConfirmado(false)
    setPrestacionesDisponibles([])
    setPrestacionSeleccionada(null)
    setCantidad('1')
    setValorAsignado('')
    
    if (value && onFinanciadorChange) {
      try {
        const infoRes = await api.get(`/prestaciones/prestador/${value}/info`)
        setFinanciadorInfo(infoRes.data)
        onFinanciadorChange(value, infoRes.data)
      } catch (error) {
        console.error('Error loading financiador info:', error)
        setFinanciadorInfo({})
        onFinanciadorChange(value, {})
      }
    } else if (onFinanciadorChange) {
      setFinanciadorInfo({})
      onFinanciadorChange(null, {})
    }
  }

  const confirmarFinanciador = async () => {
    if (!financiadorSeleccionado || !presupuestoId) return;
    
    try {
      await api.put(`/presupuestos/${presupuestoId}/prestador`, {
        idobra_social: financiadorSeleccionado
      });
      
      setFinanciadorConfirmado(true)
      await cargarPrestacionesPorFinanciador(financiadorSeleccionado)
      
      // Load financiador info
      const infoRes = await api.get(`/prestaciones/prestador/${financiadorSeleccionado}/info`)
      setFinanciadorInfo(infoRes.data)
      
      notifications.show({
        title: 'Financiador Confirmado',
        message: 'Financiador asignado al presupuesto',
        color: 'green'
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al confirmar financiador',
        color: 'red'
      })
    }
  }

  const modificarFinanciador = () => {
    setFinanciadorConfirmado(false)
    setPrestacionesDisponibles([])
    setPrestacionSeleccionada(null)
    setCantidad('1')
    setValorAsignado('')
    setFinanciadorInfo({})
    notifications.show({
      title: 'Financiador Desbloqueado',
      message: 'Puede seleccionar un nuevo financiador',
      color: 'blue'
    })
  }

  const valoresDisponibles = useMemo(() => {
    if (!prestacionSeleccionadaData?.valor_sugerido) return []
    const vs = Number(prestacionSeleccionadaData.valor_sugerido)
    return [
      { value: String(vs * 0.8), label: `$${(vs * 0.8).toFixed(2)}` },
      { value: String(vs * 0.9), label: `$${(vs * 0.9).toFixed(2)}` },
      { value: String(vs), label: `$${vs.toFixed(2)} (Sugerido)` },
      { value: String(vs * 1.1), label: `$${(vs * 1.1).toFixed(2)}` },
      { value: String(vs * 1.2), label: `$${(vs * 1.2).toFixed(2)}` },
      { value: String(vs * 1.5), label: `$${(vs * 1.5).toFixed(2)}` }
    ]
  }, [prestacionSeleccionadaData])

  const handlePrestacionChange = (value: string | null) => {
    setPrestacionSeleccionada(value)
    if (value) {
      const prestacionData = prestacionesDisponibles.find(p => p.id_servicio === value)
      if (prestacionData) {
        setCantidad(String(prestacionData.cant_total || 1))
        setValorAsignado(String(prestacionData.valor_sugerido || 0))
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
      tipo_unidad: prestacionData.tipo_unidad || 'horas',
      cant_total: prestacionData.cant_total
    }

    const existeIndex = prestacionesSeleccionadas.findIndex(p => p.id_servicio === prestacionSeleccionada)
    
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
      }).catch((err: any) => console.error('Error saving prestacion:', err))
    }

    setCantidad('1')
    setValorAsignado('')
    setPrestacionSeleccionada(null)
    
    notifications.show({
      title: 'Prestación agregada',
      message: `Se agregó ${prestacionData.nombre}`,
      color: 'blue'
    })
  }, [prestacionSeleccionada, cantidad, valorAsignado, prestacionesDisponibles, prestacionesSeleccionadas, setPrestacionesSeleccionadas])

  const eliminarPrestacion = useCallback((index: number) => {
    const prestacion = prestacionesSeleccionadas[index]
    const nuevas = prestacionesSeleccionadas.filter((_, i) => i !== index)
    setPrestacionesSeleccionadas(nuevas)
    
    if (presupuestoId) {
      api.delete(`/presupuestos/${presupuestoId}/prestaciones`, {
        data: { id_servicio: prestacion.id_servicio }
      }).catch((err: any) => console.error('Error deleting prestacion:', err))
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
    nuevas[index] = { ...nuevas[index], cantidad: nuevaCantidad, valor_asignado: nuevoValor }
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
      <Paper p="md" withBorder shadow="sm" >
        <Title order={4} mb="md">Selección de Financiador</Title>
        <Flex direction={'column'}>
          <Group  grow align="baseline" mb={20} > 
          <Select
            placeholder="Seleccione un financiador"
            data={financiadoresOptions}
            value={financiadorSeleccionado}
            onChange={handleFinanciadorChange}
            searchable
            disabled={financiadorConfirmado}
            checkIconPosition="right"
          />
            <Button bottom={0}
              onClick={confirmarFinanciador} 
              disabled={!financiadorSeleccionado || financiadorConfirmado}
              color={financiadorConfirmado ? 'green' : 'blue'}
            >
              {financiadorConfirmado ? 'Financiador Confirmado' : 'Confirmar'}
            </Button>
            {financiadorConfirmado && (
              <Button  
                onClick={modificarFinanciador}
                variant="outline"
                color="orange"
                size="sm"
              >
                Modificar
              </Button>
            )}
          </Group>
          {financiadorConfirmado && financiadorInfo && (
            <Group grow mt="md">
              <Badge variant="dot" color="blue">Tasa Mensual: {financiadorInfo.tasa_mensual || 'N/A'}%</Badge>
              <Badge variant="dot" color="orange">Días Cobranza Teórico: {financiadorInfo.dias_cobranza_teorico || 'N/A'}</Badge>
              <Badge variant="dot" color="green">Días Cobranza Real: {financiadorInfo.dias_cobranza_real || 'N/A'}</Badge>
            <Badge variant="dot" color="teal">{financiadorInfo.acuerdo_nombre || 'Sin Acuerdo Asignado'}</Badge>
            </Group>
          )}
        </Flex>
      </Paper>

      {financiadorConfirmado && prestacionesDisponibles.length > 0 && (
        <Stack gap="md">
          <Grid>

            <Grid.Col span={6}>
              <Paper p="md" withBorder>
                <Title order={4} mb="md">Prestaciones Disponibles</Title>
                <Table.ScrollContainer mt="xs" minWidth={500} h={400}>
                  <Table striped="odd" highlightOnHover stickyHeader>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Prestación</Table.Th>
                        <Table.Th style={{ width: '80px' }}>Tipo</Table.Th>
                        <Table.Th>
                          <Tooltip label="Valor a facturar por unidad de servicio">
                            <span>Valor a Facturar</span>
                          </Tooltip>
                        </Table.Th>
                        <Table.Th>
                          <Tooltip label="Cantidad sugerida inicial para el presupuesto">
                            <span>Cant. Sugerida</span>
                          </Tooltip>
                        </Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {prestacionesDisponibles.map((p) => (
                        <Table.Tr key={p.id_servicio}>
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
                              />
                              <span>{p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase()}</span>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{p.tipo_unidad || 'horas'}</Table.Td>
                          <Table.Td>${Number(p.valor_facturar || 0).toFixed(2)}</Table.Td>
                          <Table.Td>{p.cant_total || 0}</Table.Td>
                        </Table.Tr> 
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </Paper>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Paper p="md" withBorder style={{ backgroundColor: prestacionSeleccionada ? '#f8f9fa' : '#f5f5f5', opacity: prestacionSeleccionada ? 1 : 0.6 }}>
                <Title order={4} mb="md">Agregar al Presupuesto</Title>
                <Stack gap="sm">
                  <TextInput
                    label="Prestación"
                    value={prestacionSeleccionadaData?.nombre || ''}
                    placeholder={prestacionSeleccionada ? '' : 'Seleccione una prestación de la tabla'}
                    readOnly
                    size="sm"
                    disabled={!prestacionSeleccionada}
                  />
                  <TextInput
                    label="Cantidad"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    type="number"
                    min="1"
                    size="sm"
                    disabled={!prestacionSeleccionada}
                    description={prestacionSeleccionadaData ? `Total Mensual ${prestacionSeleccionadaData.cant_total || 1}` : 'Seleccione prestación'}
                  />
                  <Select
                    label="Valor"
                    placeholder="Seleccione un valor"
                    data={valoresDisponibles}
                    value={valorAsignado}
                    onChange={(val) => setValorAsignado(val || '')}
                    disabled={!prestacionSeleccionada}
                    searchable
                  />
                  <Group>
                    <Button size="sm" onClick={agregarPrestacion} disabled={!prestacionSeleccionada}>Agregar</Button>
                    <Button size="sm" variant="outline" color="gray" disabled={!prestacionSeleccionada} onClick={() => {
                      setPrestacionSeleccionada(null)
                      setCantidad('1')
                      setValorAsignado('')
                    }}>Cancelar</Button>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>
          
          <Paper p="md" withBorder>
            <Title order={4} mb="md">Prestaciones Seleccionadas</Title>
              <Table striped="odd" highlightOnHover stickyHeader >
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{textAlign: 'left' }}>Prestación</Table.Th>
                    <Table.Th>Cantidad</Table.Th>
                    <Table.Th>
                      <Tooltip label="Valor asignado negociado con el prestador">
                        <span>Costo Unit.</span>
                      </Tooltip>
                    </Table.Th>
                    <Table.Th>
                      <Tooltip label="Valor unitario a facturar al financiador">
                        <span>Precio a Facturar</span>
                      </Tooltip>
                    </Table.Th>
                    <Table.Th>
                      <Tooltip label="Valor asignado × cantidad">
                        <span>Subtotal Costo</span>
                      </Tooltip>
                    </Table.Th>
                    <Table.Th>
                      <Tooltip label="Precio a facturar × cantidad">
                        <span>Subtotal Facturar</span>
                      </Tooltip>
                    </Table.Th>
                    <Table.Th>Acciones</Table.Th>
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
                              step={0.01}
                              decimalScale={2}
                              w={100}
                              size="xs"
                              hideControls
                              prefix="$"
                            />
                          ) : (
                            `$${costoUnitario.toFixed(2)}`
                          )}
                        </Table.Td>
                        <Table.Td>${precioFacturar.toFixed(2)}</Table.Td>
                        <Table.Td>${subtotalCosto.toFixed(2)}</Table.Td>
                        <Table.Td>${subtotalFacturar.toFixed(2)}</Table.Td>
                        <Table.Td>
                          {editandoIndex === i ? (
                            <Group gap="xs" justify="left">
                              <Button size="xs" onClick={() => actualizarPrestacion(i)}>
                                OK
                              </Button>
                              <Button size="xs" variant="outline" onClick={() => setEditandoIndex(null)}>
                                Cancelar
                              </Button>
                            </Group>
                          ) : (
                            <Group gap="xs" justify="left">
                              <ActionIcon
                                variant="transparent"
                                onClick={() => {
                                  setEditandoIndex(i)
                                  setNuevaCantidad(p.cantidad)
                                  setNuevoValor(Number(p.valor_asignado))
                                }}
                              >
                                <PencilSquareIcon  width={20} height={20} />
                              </ActionIcon>
                              <ActionIcon
                                variant="transparent"
                                color="red"
                                onClick={() => eliminarPrestacion(i)}
                              >
                                <TrashIcon  width={20} height={20} />
                              </ActionIcon>
                            </Group>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    )
                  })}
                </Table.Tbody>
              </Table>
            {prestacionesSeleccionadas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No hay prestaciones seleccionadas
              </div>
            )}
          </Paper>
        </Stack>
      )}

      {financiadorSeleccionado && prestacionesDisponibles.length === 0 && !loading && (
        <Paper p="md" withBorder>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No hay prestaciones disponibles para este financiador
          </div>
        </Paper>
      )}
    </Stack>
  )
}
