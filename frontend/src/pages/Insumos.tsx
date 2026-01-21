import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Paper, TextInput, Button, Group, Stack, Title, NumberInput, Table, ActionIcon, Checkbox, Text, Modal, Badge } from '@mantine/core'
import { TrashIcon, PencilSquareIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { notifications } from '@mantine/notifications'
import { api } from '../api/api'
import { numberFormat } from '../utils/numberFormat'

interface Insumo {
  id?: number
  producto: string
  costo: number
  precio_facturar?: number
  cantidad: number
  idInsumos?: number
}

interface Props {
  insumosSeleccionados: Insumo[]
  setInsumosSeleccionados: (insumos: Insumo[]) => void
  onTotalChange: (totalCosto: number, totalFacturar: number) => void
  presupuestoId: number | null
  porcentajeInsumos: number
  financiador: { porcentaje_insumos?: number } | null
  soloLectura?: boolean
}

export default function Insumos({ insumosSeleccionados, setInsumosSeleccionados, onTotalChange, presupuestoId, porcentajeInsumos, financiador, soloLectura = false }: Props) {
  const [insumosDisponibles, setInsumosDisponibles] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null)
  const [nuevaCantidad, setNuevaCantidad] = useState(1)
  
  // Estados para selección múltiple
  const [insumosTemporales, setInsumosTemporales] = useState<any[]>([])
  const [modalAbierto, setModalAbierto] = useState(false)
  const [cantidadesTemporales, setCantidadesTemporales] = useState<{[key: string]: number}>({})

  useEffect(() => {
    api.get('/insumos').then(res => {
      const data = res.data.data || res.data;
      setInsumosDisponibles(Array.isArray(data) ? data : []);
    }).catch(err => {
      console.error('Error loading insumos:', err);
      setInsumosDisponibles([]);
    });
  }, [])

  useEffect(() => {
    const totalCosto = insumosSeleccionados.reduce((sum, insumo) => {
      return sum + (Number(insumo.costo) * insumo.cantidad);
    }, 0);
    
    const totalFacturar = insumosSeleccionados.reduce((sum, insumo) => {
      // Usar precio_facturar si existe (viene de BD), sino calcularlo
      const porcentajeFinanciador = financiador?.porcentaje_insumos || 0;
      const porcentajeTotalInsumos = porcentajeInsumos + porcentajeFinanciador;
      const precioFacturar = insumo.precio_facturar ?? (insumo.costo * (1 + porcentajeTotalInsumos / 100));
      return sum + (Number(precioFacturar) * insumo.cantidad);
    }, 0);
    
    onTotalChange(totalCosto, totalFacturar);
  }, [insumosSeleccionados, onTotalChange, porcentajeInsumos, financiador])

  const insumosFiltrados = useMemo(() => 
    insumosDisponibles.filter(insumo =>
      insumo.producto.toLowerCase().includes(filtro.toLowerCase())
    ), [insumosDisponibles, filtro]
  )

  const toggleInsumoTemporal = useCallback((insumo: any) => {
    const existe = insumosTemporales.find(i => i.producto === insumo.producto)
    
    if (existe) {
      setInsumosTemporales(prev => prev.filter(i => i.producto !== insumo.producto))
      setCantidadesTemporales(prev => {
        const nuevo = { ...prev }
        delete nuevo[insumo.producto]
        return nuevo
      })
    } else {
      setInsumosTemporales(prev => [...prev, insumo])
      setCantidadesTemporales(prev => ({ ...prev, [insumo.producto]: 1 }))
      
      // Alerta de insumo crítico
      if (insumo.critico === 1) {
        notifications.show({
          id: `insumo-critico-${insumo.idInsumos}`,
          title: '⚠️ Insumo Crítico',
          message: `${insumo.producto}: Este insumo requiere auditoría obligatoria`,
          color: 'red',
          autoClose: false,
          withCloseButton: true,
          position: 'top-center'
        })
      }
      
      // Alerta de valor desactualizado
      if (insumo.dias_sin_actualizar > 45) {
        notifications.show({
          id: `insumo-desactualizado-${insumo.idInsumos}`,
          title: '⚠️ Valor Desactualizado',
          message: `${insumo.producto}: sin actualizar hace ${insumo.dias_sin_actualizar} días`,
          color: 'yellow',
          autoClose: false,
          withCloseButton: true,
          position: 'top-center'
        })
      }
    }
  }, [insumosTemporales])

  const abrirModal = useCallback(() => {
    if (insumosTemporales.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Seleccione al menos un insumo',
        color: 'red',
        position: 'top-center'
      })
      return
    }
    setModalAbierto(true)
  }, [insumosTemporales])

  const cerrarModal = useCallback(() => {
    setModalAbierto(false)
  }, [])

  const actualizarCantidadTemporal = useCallback((producto: string, cantidad: number) => {
    setCantidadesTemporales(prev => ({ ...prev, [producto]: cantidad }))
  }, [])

  const confirmarAgregarTodos = useCallback(async () => {
    try {
      const insumosParaAgregar = insumosTemporales.map(insumo => ({
        producto: insumo.producto,
        costo: insumo.costo,
        cantidad: cantidadesTemporales[insumo.producto] || 1,
        insumo_id: insumo.idInsumos
      })).filter(i => i.cantidad > 0)

      if (insumosParaAgregar.length === 0) {
        notifications.show({
          title: 'Error',
          message: 'No hay insumos válidos para agregar',
          color: 'red',
          position: 'top-center'
        })
        return
      }

      if (presupuestoId) {
        const response = await api.post(
          `/presupuestos/${presupuestoId}/insumos/bulk`,
          { insumos: insumosParaAgregar }
        )

        notifications.show({
          title: 'Insumos Agregados',
          message: response.data.message,
          color: 'green',
          position: 'top-center'
        })

        // Recargar insumos desde BD para obtener IDs
        const insumosResponse = await api.get(`/presupuesto-insumos/${presupuestoId}`)
        setInsumosSeleccionados(insumosResponse.data)
      } else {
        // Sin presupuestoId, actualizar estado local
        const nuevosInsumos = [...insumosSeleccionados]
        
        for (const insumo of insumosTemporales) {
          const cantidad = cantidadesTemporales[insumo.producto] || 1
          if (cantidad <= 0) continue
          
          const existeIndex = nuevosInsumos.findIndex(i => i.producto === insumo.producto)
          
          if (existeIndex >= 0) {
            nuevosInsumos[existeIndex] = { ...insumo, cantidad }
          } else {
            nuevosInsumos.push({ ...insumo, cantidad })
          }
        }
        
        setInsumosSeleccionados(nuevosInsumos)
      }
      setInsumosTemporales([])
      setCantidadesTemporales({})
      setModalAbierto(false)

    } catch (error: any) {
      console.error('Error:', error)
      notifications.show({
        title: 'Error',
        message: error.response?.data?.error || 'Error al agregar insumos',
        color: 'red',
        position: 'top-center',
        autoClose: false
      })
    }
  }, [insumosTemporales, cantidadesTemporales, insumosSeleccionados, presupuestoId])

  const eliminarInsumo = async (index: number) => {
    const insumo = insumosSeleccionados[index]
    
    if (presupuestoId && insumo.id) {
      try {
        await api.delete(`/presupuestos/${presupuestoId}/insumos`, {
          data: { id: insumo.id }
        })
        
        // Recargar insumos desde BD
        const insumosResponse = await api.get(`/presupuesto-insumos/${presupuestoId}`)
        setInsumosSeleccionados(insumosResponse.data)
        
        notifications.show({
          title: 'Insumo Eliminado',
          message: 'Se eliminó el insumo seleccionado',
          color: 'blue'
        })
      } catch (err: any) {
        console.error('Error deleting insumo:', err)
        notifications.show({
          title: 'Error',
          message: err.message || 'Error al eliminar insumo',
          color: 'red'
        })
      }
    } else {
      // Sin presupuestoId o sin id, solo actualizar estado local
      const nuevosInsumos = insumosSeleccionados.filter((_, i) => i !== index)
      setInsumosSeleccionados(nuevosInsumos)
      
      notifications.show({
        title: 'Insumo Eliminado',
        message: 'Se eliminó el insumo seleccionado',
        color: 'blue'
      })
    }
  }

  const actualizarCantidad = (index: number) => {
    if (nuevaCantidad <= 0) return
    
    const nuevosInsumos = [...insumosSeleccionados]
    nuevosInsumos[index].cantidad = nuevaCantidad
    setInsumosSeleccionados(nuevosInsumos)
    
    if (presupuestoId) {
      api.post(`/presupuestos/${presupuestoId}/insumos`, {
        producto: nuevosInsumos[index].producto,
        costo: nuevosInsumos[index].costo,
        cantidad: nuevaCantidad,
        insumo_id: nuevosInsumos[index].idInsumos || null
      }).catch((err: any) => {
        console.error('Error updating insumo:', err)
        notifications.show({
          title: 'Error',
          message: err.message || 'Error al actualizar insumo',
          color: 'red'
        })
      })
    }
    
    setEditandoIndex(null)
    notifications.show({
      title: 'Cantidad Actualizada',
      message: 'Cantidad modificada correctamente',
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
      {financiador && (financiador.porcentaje_insumos ?? 0) > 0 && (
        <Paper p="xs" withBorder style={{ backgroundColor: '#e3f2fd' }}>
          <Text size="sm" c="blue" fw={500} ta="center">
            Este financiador aplica un <strong>{financiador.porcentaje_insumos}%</strong> adicional sobre insumos
          </Text>
        </Paper>
      )}
      <Paper p="md" withBorder style={{ opacity: soloLectura ? 0.8 : 1 }}>
        <Stack gap="xl">
          <Stack gap="xs">
            <Title order={5}>Insumos Disponibles</Title>
            
            <Group gap="xs" align="center">
              <TextInput 
                style={{ flex: 1 }}
                value={filtro} 
                onChange={(e) => setFiltro(e.target.value)} 
                leftSection={<MagnifyingGlassIcon style={{ width: 16, height: 16 }} />}
                rightSection={
                  filtro ? (
                    <ActionIcon variant="subtle" onClick={() => setFiltro('')}>
                      <XMarkIcon style={{ width: 16, height: 16 }} />
                    </ActionIcon>
                  ) : null
                }
                placeholder="Buscar Insumo..." 
                disabled={soloLectura}
              />
              
              <Button 
                size="sm"
                onClick={abrirModal}
                disabled={soloLectura || insumosTemporales.length === 0}
                rightSection={
                  insumosTemporales.length > 0 ? (
                    <Badge 
                      color="orange" 
                      variant="filled" 
                      size="sm" 
                      circle
                      style={{ 
                        minWidth: '20px', 
                        height: '20px',
                        fontSize: '11px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 0,
                        lineHeight: 1,
                        boxSizing: 'border-box',
                      }}
                    >
                      {insumosTemporales.length}
                    </Badge>
                  ) : null
                }
              >
                Agregar Seleccionados
              </Button>
            </Group>

            <Table.ScrollContainer mt="xs" minWidth={600} maxHeight={300}>
              <Table striped="odd" highlightOnHover stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: '70%', textAlign:"left", fontWeight: 500, fontSize: '13px' }}>Insumo</Table.Th>
                    <Table.Th style={{ width: '30%', textAlign: 'right', fontWeight: 500, fontSize: '13px' }}>Costo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {insumosFiltrados.map((insumo, index) => (
                    <Table.Tr key={index}>
                      <Table.Td style={{ width: '70%' }}>
                        <Group gap="xs" wrap="nowrap">
                          <Checkbox
                            size="xs"
                            checked={insumosTemporales.some(i => i.producto === insumo.producto)}
                            onChange={() => toggleInsumoTemporal(insumo)}
                            disabled={soloLectura}
                          />
                          <span>{insumo.producto.charAt(0).toUpperCase() + insumo.producto.slice(1).toLowerCase()}</span>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ width: '30%', textAlign: 'right' }}>{numberFormat.formatCurrency(insumo.costo)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Stack>

          <Stack gap="xs">
            <Title order={5}>Insumos Seleccionados</Title>

            <Table.ScrollContainer minWidth={600}>
              <Table striped="odd" highlightOnHover stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Insumo</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Cant.</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Costo U.</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Precio Fact.</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Subt. Costo</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Subt. Fact.</Table.Th>
                    <Table.Th style={{ fontWeight: 500, fontSize: '12px' }}>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {insumosSeleccionados.map((insumo, index) => {
                    const costoBase = Number(insumo.costo);
                    const costoUnitario = costoBase;
                    const porcentajeBaseInsumos = porcentajeInsumos;
                    const porcentajeFinanciador = financiador?.porcentaje_insumos || 0;
                    const porcentajeTotalInsumos = porcentajeBaseInsumos + porcentajeFinanciador;
                    const precioFacturar = costoBase * (1 + porcentajeTotalInsumos / 100);
                    const subtotalCosto = costoUnitario * insumo.cantidad;
                    const subtotalFacturar = precioFacturar * insumo.cantidad;
                    
                    return (
                      <Table.Tr key={index}>
                        <Table.Td>{insumo.producto}</Table.Td>
                        <Table.Td>
                          {editandoIndex === index ? (
                            <Group gap="md" align='baseline'>
                              <NumberInput
                                value={nuevaCantidad}
                                onChange={(value) => setNuevaCantidad(Number(value) || 1)}
                                min={1}
                                w={80}
                                hideControls
                              />
                              <Button size="xs" onClick={() => actualizarCantidad(index)}>
                                OK
                              </Button>
                            </Group>
                          ) : (
                            insumo.cantidad
                          )}
                        </Table.Td>
                        <Table.Td>{numberFormat.formatCurrency(costoUnitario)}</Table.Td>
                        <Table.Td>{numberFormat.formatCurrency(precioFacturar)}</Table.Td>
                        <Table.Td>{numberFormat.formatCurrency(subtotalCosto)}</Table.Td>
                        <Table.Td>{numberFormat.formatCurrency(subtotalFacturar)}</Table.Td>
                        <Table.Td>
                          {!soloLectura && (
                            <Group gap={4} align='baseline' wrap="nowrap">
                              <ActionIcon
                                variant="transparent"
                                onClick={() => {
                                  setEditandoIndex(index)
                                  setNuevaCantidad(insumo.cantidad)
                                }}
                              >
                                <PencilSquareIcon width={16} height={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="transparent"
                                color="red"
                                onClick={() => eliminarInsumo(index)}
                              >
                                <TrashIcon width={16} height={16} />
                              </ActionIcon>
                            </Group>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
            {insumosSeleccionados.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                No hay insumos seleccionados
              </div>
            )}
          </Stack>
        </Stack>
      </Paper>

      <Modal
        opened={modalAbierto}
        onClose={cerrarModal}
        title="Agregar Insumos al Presupuesto"
        size="lg"
        centered
      >
        <Stack gap="md">
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Insumo</Table.Th>
                <Table.Th style={{ textAlign: 'right' }}>Costo</Table.Th>
                <Table.Th style={{ textAlign: 'center' }}>Cantidad</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {insumosTemporales.map((insumo) => (
                <Table.Tr key={insumo.producto}>
                  <Table.Td>{insumo.producto}</Table.Td>
                  <Table.Td style={{ textAlign: 'right' }}>
                    {numberFormat.formatCurrency(insumo.costo)}
                  </Table.Td>
                  <Table.Td style={{ textAlign: 'center' }}>
                    <NumberInput
                      value={cantidadesTemporales[insumo.producto] || 1}
                      onChange={(value) => actualizarCantidadTemporal(insumo.producto, Number(value) || 1)}
                      min={1}
                      w={80}
                      hideControls
                    />
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          
          <Group justify="flex-end" gap="xs">
            <Button variant="outline" onClick={cerrarModal}>
              Cancelar
            </Button>
            <Button onClick={confirmarAgregarTodos} color="green">
              Agregar Todos
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
