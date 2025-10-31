import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Paper, Button, Title, Select, TextInput, Grid, Stack, Checkbox, Group, NumberInput, ActionIcon, Table, ScrollArea, Badge } from '@mantine/core'
import { TrashIcon, PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { notifications } from '@mantine/notifications'
import { getPrestadores, getPrestacionesPorPrestador } from '../api/api'
import { api } from '../api/api'

interface Prestacion {
  id_servicio: string
  prestacion: string
  cantidad: number
  valor_asignado: number
}

interface PrestacionDisponible {
  id_servicio: string
  nombre: string
  costo: number
  total_mes: number
  condicion: string
  cant_total: number
}

interface Financiador {
  idobra_social: string
  Financiador: string
}

interface Props {
  prestacionesSeleccionadas: Prestacion[]
  setPrestacionesSeleccionadas: (prestaciones: Prestacion[]) => void
  onTotalChange: (total: number) => void
  presupuestoId: number | null
  financiadorId?: string | null
}

export default function Prestaciones({ prestacionesSeleccionadas, setPrestacionesSeleccionadas, onTotalChange, presupuestoId, financiadorId }: Props) {
  const [financiadores, setFinanciadores] = useState<Financiador[]>([])
  const [financiadorSeleccionado, setFinanciadorSeleccionado] = useState<string | null>(null)
  const [financiadorConfirmado, setFinanciadorConfirmado] = useState(false)
  const [financiadorInfo, setFinanciadorInfo] = useState<{tasa_mensual?: number, dias_cobranza_teorico?: number, dias_cobranza_real?: number}>({})
  const [prestacionesDisponibles, setPrestacionesDisponibles] = useState<PrestacionDisponible[]>([])
  const [cantidad, setCantidad] = useState('1')
  const [valorAsignado, setValorAsignado] = useState('')
  const [prestacionSeleccionada, setPrestacionSeleccionada] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null)
  const [nuevaCantidad, setNuevaCantidad] = useState(1)
  const [nuevoValor, setNuevoValor] = useState(0)

  const total = useMemo(() => 
    prestacionesSeleccionadas.reduce((sum, p) => sum + (Number(p.cantidad) * Number(p.valor_asignado)), 0),
    [prestacionesSeleccionadas]
  )

  const prestacionSeleccionadaData = useMemo(() => 
    prestacionSeleccionada ? prestacionesDisponibles.find(p => p.id_servicio === prestacionSeleccionada) : null,
    [prestacionSeleccionada, prestacionesDisponibles]
  )

  const financiadoresOptions = useMemo(() => 
    financiadores.map(p => ({
      value: p.idobra_social,
      label: p.Financiador
    })),
    [financiadores]
  )

  useEffect(() => {
    onTotalChange(total)
  }, [total, onTotalChange])

  useEffect(() => {
    cargarFinanciadores()
  }, [])

  useEffect(() => {
    if (presupuestoId) {
      api.get(`/presupuestos/${presupuestoId}/prestaciones`).then(res => {
        setPrestacionesSeleccionadas(res.data)
      }).catch((err: any) => console.error('Error loading prestaciones:', err))
      
      // Si hay financiadorId, configurar el financiador
      if (financiadorId) {
        setFinanciadorSeleccionado(financiadorId)
        setFinanciadorConfirmado(true)
        cargarPrestacionesPorFinanciador(financiadorId)
        
        // Cargar info del financiador
        api.get(`/prestaciones/prestador/${financiadorId}/info`).then(infoRes => {
          setFinanciadorInfo(infoRes.data)
        }).catch((err: any) => console.error('Error loading financiador info:', err))
      }
    } else {
      // Reset state when presupuestoId is null (new budget)
      setFinanciadorSeleccionado(null)
      setFinanciadorConfirmado(false)
      setPrestacionesDisponibles([])
      setPrestacionSeleccionada(null)
      setCantidad('1')
      setValorAsignado('')
      setFinanciadorInfo({})
    }
  }, [presupuestoId, financiadorId, setPrestacionesSeleccionadas])

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

  const handleFinanciadorChange = (value: string | null) => {
    setFinanciadorSeleccionado(value)
    setFinanciadorConfirmado(false)
    setPrestacionesDisponibles([])
    setPrestacionSeleccionada(null)
    setCantidad('1')
    setValorAsignado('')
  }

  const confirmarFinanciador = async () => {
    if (!financiadorSeleccionado || !presupuestoId) return
    
    try {
      await api.put(`/presupuestos/${presupuestoId}/prestador`, {
        idobra_social: financiadorSeleccionado
      })
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

  const handlePrestacionChange = (value: string | null) => {
    setPrestacionSeleccionada(value)
    if (value) {
      const prestacionData = prestacionesDisponibles.find(p => p.id_servicio === value)
      if (prestacionData) {
        setCantidad(String(prestacionData.cant_total || 1))
        setValorAsignado(String(Number(prestacionData.costo || 0).toFixed(2)))
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
      valor_asignado: valorNum
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
        valor_asignado: valorNum
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
        valor_asignado: nuevoValor
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
    <Stack spacing="lg">
      <Paper p="md" withBorder shadow="sm">
        <Title order={4} mb="md">Selección de Financiador</Title>
        <Stack spacing="sm">
          <Select
            label="Financiador"
            placeholder="Seleccione un financiador"
            data={financiadoresOptions}
            value={financiadorSeleccionado}
            onChange={handleFinanciadorChange}
            searchable
            clearable
            disabled={financiadorConfirmado}
          />
          <Group>
            <Button 
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
            <Group spacing="md" mt="sm">
              <Badge variant="dot" color="blue">Tasa Mensual: {financiadorInfo.tasa_mensual || 'N/A'}%</Badge>
              <Badge variant="dot" color="orange">Días Cobranza Teórico: {financiadorInfo.dias_cobranza_teorico || 'N/A'}</Badge>
              <Badge variant="dot" color="green">Días Cobranza Real: {financiadorInfo.dias_cobranza_real || 'N/A'}</Badge>
            </Group>
          )}
        </Stack>
      </Paper>

      {financiadorConfirmado && prestacionesDisponibles.length > 0 && (
        <Stack spacing="md">
          <Grid>

            <Grid.Col span={6}>
              <Paper p="md" withBorder>
                <Title order={4} mb="md">Prestaciones Disponibles</Title>
                <ScrollArea h={400} scrollbarSize={8} scrollHideDelay={0}>
                  <Table striped highlightOnHover fontSize="sm">
                    <thead style={{ textAlign: 'center',position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                      <tr>
                        <th style={{ backgroundColor: '#f8f9fa',textAlign: 'left' }}>Prestación</th>
                        <th style={{ backgroundColor: '#f8f9fa',textAlign: 'left' }}>Costo</th>
                        <th style={{ backgroundColor: '#f8f9fa',textAlign: 'left' }}>Total/Mes</th>
                        <th style={{ backgroundColor: '#f8f9fa',textAlign: 'left' }}>Condición</th>
                        <th style={{ backgroundColor: '#f8f9fa',textAlign: 'left' }}>Cant.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prestacionesDisponibles.map((p) => (
                        <tr key={p.id_servicio}>
                          <td>
                            <Group spacing="xs">
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
                          </td>
                          <td>${Number(p.costo || 0).toFixed(2)}</td>
                          <td>{Number(p.total_mes || 0).toFixed(0)}</td>
                          <td>{p.condicion || 'N/A'}</td>
                          <td>{p.cant_total || 0}</td>
                        </tr> 
                      ))}
                    </tbody>
                  </Table>
                </ScrollArea>
              </Paper>
            </Grid.Col>
            
            <Grid.Col span={6}>
              <Paper p="md" withBorder style={{ backgroundColor: prestacionSeleccionada ? '#f8f9fa' : '#f5f5f5', opacity: prestacionSeleccionada ? 1 : 0.6 }}>
                <Title order={4} mb="md">Agregar al Presupuesto</Title>
                <Stack spacing="sm">
                  <TextInput
                    label="Prestación"
                    value={prestacionSeleccionadaData?.nombre || ''}
                    placeholder={prestacionSeleccionada ? '' : 'Seleccione una prestación de la tabla'}
                    readOnly
                    size="sm"
                    disabled={!prestacionSeleccionada}
                  />
                  <Grid>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Cantidad"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        type="number"
                        min="1"
                        size="sm"
                        disabled={!prestacionSeleccionada}
                        description={prestacionSeleccionadaData ? `Rec: ${prestacionSeleccionadaData.cant_total || 1}` : 'Seleccione prestación'}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <TextInput
                        label="Valor"
                        value={valorAsignado}
                        onChange={(e) => setValorAsignado(e.target.value)}
                        type="number"
                        step="0.01"
                        min="0"
                        size="sm"
                        disabled={!prestacionSeleccionada}
                        description={prestacionSeleccionadaData ? `Rec: $${Number(prestacionSeleccionadaData.costo || 0).toFixed(2)}` : 'Seleccione prestación'}
                      />
                    </Grid.Col>
                  </Grid>
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
            <ScrollArea h={300} scrollbarSize={8} scrollHideDelay={0}>
              <Table striped highlightOnHover>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 10 }}>
                  <tr>
                    <th style={{ backgroundColor: '#f8f9fa' }}>Prestación</th>
                    <th style={{ textAlign: 'center', backgroundColor: '#f8f9fa' }}>Cantidad</th>
                    <th style={{ textAlign: 'center', backgroundColor: '#f8f9fa' }}>Valor</th>
                    <th style={{ textAlign: 'center', backgroundColor: '#f8f9fa' }}>Subtotal</th>
                    <th style={{ textAlign: 'center', backgroundColor: '#f8f9fa' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {prestacionesSeleccionadas.map((p, i) => {
                    const subtotal = Number(p.cantidad) * Number(p.valor_asignado)
                    return (
                      <tr key={`${p.id_servicio}-${i}`}>
                        <td>{p.prestacion}</td>
                        <td style={{ textAlign: 'center' }}>
                          {editandoIndex === i ? (
                            <Group spacing="xs" position="center">
                              <NumberInput
                                value={nuevaCantidad}
                                onChange={(value) => setNuevaCantidad(Number(value) || 1)}
                                min={1}
                                w={80}
                                size="xs"
                              />
                            </Group>
                          ) : (
                            p.cantidad
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {editandoIndex === i ? (
                            <Group spacing="xs" position="center">
                              <NumberInput
                                value={nuevoValor}
                                onChange={(value) => setNuevoValor(Number(value) || 0)}
                                min={0}
                                step={0.01}
                                w={100}
                                size="xs"
                              />
                            </Group>
                          ) : (
                            `$${Number(p.valor_asignado).toFixed(2)}`
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>${subtotal.toFixed(2)}</td>
                        <td style={{ textAlign: 'center' }}>
                          {editandoIndex === i ? (
                            <Group spacing="xs" position="center">
                              <Button size="xs" onClick={() => actualizarPrestacion(i)}>
                                OK
                              </Button>
                              <Button size="xs" variant="outline" onClick={() => setEditandoIndex(null)}>
                                Cancelar
                              </Button>
                            </Group>
                          ) : (
                            <Group spacing="xs" position="center">
                              <ActionIcon
                                variant="light"
                                onClick={() => {
                                  setEditandoIndex(i)
                                  setNuevaCantidad(p.cantidad)
                                  setNuevoValor(p.valor_asignado)
                                }}
                              >
                                <PencilSquareIcon width={16} height={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                onClick={() => eliminarPrestacion(i)}
                              >
                                <TrashIcon width={16} height={16} />
                              </ActionIcon>
                            </Group>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </ScrollArea>
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