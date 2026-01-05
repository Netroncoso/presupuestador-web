import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Paper, Button, Title, Select, TextInput, Grid, Stack, Checkbox, Group, NumberInput, ActionIcon, Table, Badge, Text, Flex, Tooltip, Modal } from '@mantine/core'
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
  dias_sin_actualizar?: number
}

interface Financiador {
  idobra_social: string
  Financiador: string
  activo: number
}

interface Props {
  prestacionesSeleccionadas: Prestacion[]
  setPrestacionesSeleccionadas: (prestaciones: Prestacion[]) => void
  onTotalChange: (totalCosto: number, totalFacturar: number) => void
  presupuestoId: number | null
  financiadorId?: string | null
  onFinanciadorChange?: (financiadorId: string | null, financiadorInfo: any) => void
  soloLectura?: boolean
  sucursalId?: number | null
}

export default function Prestaciones({ prestacionesSeleccionadas, setPrestacionesSeleccionadas, onTotalChange, presupuestoId, financiadorId, onFinanciadorChange, soloLectura = false, sucursalId }: Props) {
  const [financiadores, setFinanciadores] = useState<Financiador[]>([])
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
  const [modalConfirmacionAbierto, setModalConfirmacionAbierto] = useState(false)
  const [nuevoFinanciadorPendiente, setNuevoFinanciadorPendiente] = useState<string | null>(null)

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
      label: p.activo === 1 ? p.Financiador : `${p.Financiador} (Comunicarse con cobranza)`,
      disabled: p.activo !== 1
    })),
    [financiadores]
  )

  useEffect(() => {
    onTotalChange(totalCosto, totalFacturar)
  }, [totalCosto, totalFacturar, onTotalChange])

  useEffect(() => {
    cargarFinanciadores()
    cargarAlertasConfig()
  }, [])

  const cargarAlertasConfig = async () => {
    try {
      const response = await api.get('/alertas-servicios')
      setAlertasConfig(response.data)
    } catch (error) {
      console.error('Error cargando alertas:', error)
    }
  }

  useEffect(() => {
    if (presupuestoId && financiadorId) {
      const financiadorIdStr = String(financiadorId)
      
      if (soloLectura) {
        api.get(`/presupuestos/${presupuestoId}`).then(presupuestoRes => {
          const fechaPresupuesto = presupuestoRes.data.created_at?.slice(0, 10)
          cargarPrestacionesPorFinanciador(financiadorIdStr, fechaPresupuesto)
        }).catch(err => {
          console.error('Error loading presupuesto:', err)
          cargarPrestacionesPorFinanciador(financiadorIdStr)
        })
      } else {
        cargarPrestacionesPorFinanciador(financiadorIdStr)
      }
      
      api.get(`/prestaciones/prestador/${financiadorIdStr}/info`).then(infoRes => {
        setFinanciadorInfo(infoRes.data)
      }).catch((err: any) => console.error('Error loading financiador info:', err))
    } else if (!presupuestoId) {
      setPrestacionesDisponibles([])
      setPrestacionSeleccionada(null)
      setCantidad('1')
      setValorAsignado('')
      setFinanciadorInfo({})
    }
  }, [presupuestoId, financiadorId, soloLectura])

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

  const cargarPrestacionesPorFinanciador = async (financiadorId: string, fecha?: string) => {
    setLoading(true)
    try {
      const data = await getPrestacionesPorPrestador(financiadorId, fecha, sucursalId || undefined)
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
    // Si hay prestaciones y cambia el financiador, mostrar modal de confirmación
    if (value !== financiadorId && prestacionesSeleccionadas.length > 0) {
      setNuevoFinanciadorPendiente(value)
      setModalConfirmacionAbierto(true)
      return
    }
    
    // Si no hay prestaciones, cambiar directamente
    await aplicarCambioFinanciador(value)
  }

  const aplicarCambioFinanciador = async (value: string | null) => {
    // Limpiar prestaciones si cambia el financiador
    if (value !== financiadorId && prestacionesSeleccionadas.length > 0) {
      // Eliminar prestaciones de BD si hay presupuestoId
      if (presupuestoId) {
        try {
          for (const prestacion of prestacionesSeleccionadas) {
            await api.delete(`/presupuestos/${presupuestoId}/prestaciones`, {
              data: { id_servicio: prestacion.id_servicio }
            })
          }
        } catch (error) {
          console.error('Error eliminando prestaciones:', error)
        }
      }
      setPrestacionesSeleccionadas([])
      notifications.show({
        title: 'Prestaciones Eliminadas',
        message: 'Las prestaciones anteriores fueron eliminadas al cambiar el financiador',
        color: 'orange'
      })
    }
    
    setPrestacionesDisponibles([])
    setPrestacionSeleccionada(null)
    setCantidad('1')
    setValorAsignado('')
    
    if (value) {
      // Guardar automáticamente en BD si hay presupuestoId
      if (presupuestoId) {
        try {
          await api.put(`/presupuestos/${presupuestoId}/prestador`, {
            idobra_social: value
          })
        } catch (error) {
          console.error('Error guardando financiador:', error)
        }
      }
      
      // Cargar prestaciones disponibles
      await cargarPrestacionesPorFinanciador(value)
      
      // Cargar info del financiador
      if (onFinanciadorChange) {
        try {
          const infoRes = await api.get(`/prestaciones/prestador/${value}/info`)
          setFinanciadorInfo(infoRes.data)
          onFinanciadorChange(value, infoRes.data)
        } catch (error) {
          console.error('Error loading financiador info:', error)
          setFinanciadorInfo({})
          onFinanciadorChange(value, {})
        }
      }
    } else if (onFinanciadorChange) {
      setFinanciadorInfo({})
      onFinanciadorChange(null, {})
    }
  }

  const confirmarCambioFinanciador = async () => {
    await aplicarCambioFinanciador(nuevoFinanciadorPendiente)
    setModalConfirmacionAbierto(false)
    setNuevoFinanciadorPendiente(null)
  }

  const cancelarCambioFinanciador = () => {
    setModalConfirmacionAbierto(false)
    setNuevoFinanciadorPendiente(null)
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
  }, [prestacionSeleccionada, cantidad, valorAsignado, prestacionesDisponibles, prestacionesSeleccionadas, setPrestacionesSeleccionadas, alertasConfig])

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

      <Modal
        opened={modalConfirmacionAbierto}
        onClose={cancelarCambioFinanciador}
        title="Confirmar Cambio de Financiador"
        centered
      >
        <Text size="sm" mb="md">
          Al cambiar el financiador se eliminarán todas las prestaciones seleccionadas ({prestacionesSeleccionadas.length}).
        </Text>
        <Text size="sm" fw={500} mb="lg">
          ¿Desea continuar?
        </Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="outline" onClick={cancelarCambioFinanciador}>
            Cancelar
          </Button>
          <Button color="orange" onClick={confirmarCambioFinanciador}>
            Confirmar Cambio
          </Button>
        </Group>
      </Modal>

      <Paper p="md" withBorder style={{ opacity: soloLectura ? 0.8 : 1 }}>
        <Stack gap="xl">
          <Stack gap="xs">
            <Title order={5}>Financiador</Title>
            <Select
              placeholder="Seleccione un financiador"
              data={financiadoresOptions}
              value={financiadorId ? String(financiadorId) : null}
              onChange={handleFinanciadorChange}
              searchable
              disabled={soloLectura}
              checkIconPosition="right"
              clearable
              allowDeselect
            />
            {financiadorInfo && Object.keys(financiadorInfo).length > 0 && (
              <Group gap="xs" wrap="wrap">
                <Badge variant="dot" color="blue" style={{ fontWeight: 500, fontSize: '10px' }}>Tasa: {financiadorInfo.tasa_mensual || 'N/A'}%</Badge>
                <Badge variant="dot" color="orange" style={{ fontWeight: 500, fontSize: '10px' }}>Cobranza Teórico: {financiadorInfo.dias_cobranza_teorico || 'N/A'}d</Badge>
                <Badge variant="dot" color="green" style={{ fontWeight: 500, fontSize: '10px' }}>Cobranza Real: {financiadorInfo.dias_cobranza_real || 'N/A'}d</Badge>
                <Badge variant="dot" color="teal" style={{ fontWeight: 500, fontSize: '10px' }}>{financiadorInfo.acuerdo_nombre || 'Sin Acuerdo'}</Badge>
              </Group>
            )}
          </Stack>

          {financiadorId && prestacionesDisponibles.length > 0 && (
            <>
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Title order={5}>Prestaciones Disponibles</Title>
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
                        <Table.Th style={{ fontWeight: 500, fontSize: '13px' }}>
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
                                disabled={soloLectura}
                              />
                              <span>{p.nombre.charAt(0).toUpperCase() + p.nombre.slice(1).toLowerCase()}</span>
                            </Group>
                          </Table.Td>
                          <Table.Td style={{ textTransform: 'capitalize', fontSize: '12px' }}>{p.tipo_unidad || '-'}</Table.Td>
                          <Table.Td>${Number(p.valor_facturar || 0).toFixed(2)}</Table.Td>
                          <Table.Td>{p.cant_total || 0}</Table.Td>
                        </Table.Tr> 
                      ))}
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
                    description={prestacionSeleccionadaData ? `Total Mensual ${prestacionSeleccionadaData.cant_total || 1}` : 'Seleccione prestación'}
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
    </Stack>
  )
}
