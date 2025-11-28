import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Paper, TextInput, Button, Group, Stack, Title, Grid, NumberInput, Table, ActionIcon, Checkbox, Center, Tooltip, Text } from '@mantine/core'
import { TrashIcon, PencilSquareIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { notifications } from '@mantine/notifications'
import { api } from '../api/api'

interface Insumo {
  producto: string
  costo: number
  cantidad: number
  idInsumos?: number
}

interface Props {
  insumosSeleccionados: Insumo[]
  setInsumosSeleccionados: (insumos: Insumo[]) => void
  onTotalChange: (total: number) => void
  presupuestoId: number | null
  porcentajeInsumos: number
  soloLectura?: boolean
}

export default function Insumos({ insumosSeleccionados, setInsumosSeleccionados, onTotalChange, presupuestoId, porcentajeInsumos, soloLectura = false }: Props) {
  const [insumosDisponibles, setInsumosDisponibles] = useState<any[]>([])
  const [filtro, setFiltro] = useState('')
  const [insumoSeleccionado, setInsumoSeleccionado] = useState<any>(null)
  const [cantidad, setCantidad] = useState(1)
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null)
  const [nuevaCantidad, setNuevaCantidad] = useState(1)

  useEffect(() => {
    api.get('/insumos').then(res => {
      setInsumosDisponibles(res.data)
    })
  }, [])

  useEffect(() => {
    const total = insumosSeleccionados.reduce((sum, insumo) => sum + (Number(insumo.costo) * insumo.cantidad), 0)
    onTotalChange(total)
  }, [insumosSeleccionados, onTotalChange])

  const insumosFiltrados = useMemo(() => 
    insumosDisponibles.filter(insumo =>
      insumo.producto.toLowerCase().includes(filtro.toLowerCase())
    ), [insumosDisponibles, filtro]
  )

  const handleInsumoChange = useCallback((insumo: any) => {
    setInsumoSeleccionado(insumo)
    setCantidad(1)
  }, [])

  const agregarInsumo = () => {
    if (!insumoSeleccionado || cantidad <= 0) {
      notifications.show({
        title: 'Error',
        message: 'Seleccione un insumo y cantidad válida',
        color: 'red'
      })
      return
    }

    // Cost already has percentage applied from insumosFiltrados
    const insumoConPorcentaje = { ...insumoSeleccionado }

    const existeIndex = insumosSeleccionados.findIndex(i => i.producto === insumoSeleccionado.producto)
    
    if (existeIndex >= 0) {
      const nuevosInsumos = [...insumosSeleccionados]
      nuevosInsumos[existeIndex] = { ...insumoConPorcentaje, cantidad }
      setInsumosSeleccionados(nuevosInsumos)
    } else {
      setInsumosSeleccionados([...insumosSeleccionados, { ...insumoConPorcentaje, cantidad }])
    }

    if (presupuestoId) {
      api.post(`/presupuestos/${presupuestoId}/insumos`, {
        producto: insumoSeleccionado.producto,
        costo: insumoSeleccionado.costo,
        cantidad,
        id_insumo: insumoSeleccionado.idInsumos
      }).catch((err: any) => console.error('Error saving insumo:', err))
    }

    setInsumoSeleccionado(null)
    setCantidad(1)
    
    notifications.show({
      title: 'Insumo Agregado',
      message: `${insumoSeleccionado.producto} - Cantidad: ${cantidad}`,
      color: 'green'
    })
  }

  const eliminarInsumo = (index: number) => {
    const insumo = insumosSeleccionados[index]
    const nuevosInsumos = insumosSeleccionados.filter((_, i) => i !== index)
    setInsumosSeleccionados(nuevosInsumos)
    
    if (presupuestoId) {
      api.delete(`/presupuestos/${presupuestoId}/insumos`, {
        data: { producto: insumo.producto }
      }).catch((err: any) => console.error('Error deleting insumo:', err))
    }
    
    notifications.show({
      title: 'Insumo Eliminado',
      message: 'Se eliminó el insumo seleccionado',
      color: 'blue'
    })
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
        id_insumo: nuevosInsumos[index].idInsumos
      }).catch((err: any) => console.error('Error updating insumo:', err))
    }
    
    setEditandoIndex(null)
    notifications.show({
      title: 'Cantidad Actualizada',
      message: 'Cantidad modificada correctamente',
      color: 'green'
    })
  }

  return (
    <Stack gap="md">
      {soloLectura && (
        <Paper p="xs" withBorder style={{ backgroundColor: '#e7f5ff' }}>
          <Text size="sm" c="blue" fw={500} ta="center">Modo solo lectura - No se pueden realizar modificaciones</Text>
        </Paper>
      )}
      <Grid>
        <Grid.Col span={6}>
          <Paper p="md" withBorder style={{ opacity: soloLectura ? 0.6 : 1 }}>
            <Title order={4} mb="md">Insumos Disponibles</Title>
            <TextInput 
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
            <Table.ScrollContainer mt="xs" minWidth={500} maxHeight={300} >
              <Table striped="odd" highlightOnHover stickyHeader>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: '70%', textAlign:"left"  }}>Insumo</Table.Th>
                    <Table.Th style={{ width: '30%', textAlign: 'right' }}>Costo</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {insumosFiltrados.map((insumo, index) => (
                    <Table.Tr key={index}>
                      <Table.Td style={{ width: '70%' }}>
                        <Group gap="xs" wrap="nowrap">
                          <Checkbox
                            size="xs"
                            checked={insumoSeleccionado?.producto === insumo.producto}
                            onChange={(e) => {
                              if (e.target.checked) {
                                handleInsumoChange(insumo)
                              } else {
                                setInsumoSeleccionado(null)
                                setCantidad(1)
                              }
                            }}
                            disabled={soloLectura}
                          />
                          <span>{insumo.producto.charAt(0).toUpperCase() + insumo.producto.slice(1).toLowerCase()}</span>
                        </Group>
                      </Table.Td>
                      <Table.Td style={{ width: '30%', textAlign: 'right' }}>${Number(insumo.costo).toFixed(2)}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={6}>
          <Paper p="md" withBorder style={{ backgroundColor: insumoSeleccionado ? '#f8f9fa' : '#f5f5f5', opacity: (insumoSeleccionado && !soloLectura) ? 1 : 0.6 }}>
            <Title order={4} mb="md">Agregar al Presupuesto</Title>
            <Stack gap="sm">
              <TextInput
                label="Insumo"
                value={insumoSeleccionado ? insumoSeleccionado.producto : ''}
                placeholder={insumoSeleccionado ? '' : 'Seleccione un insumo de la tabla'}
                readOnly
                size="sm"
                disabled={!insumoSeleccionado}
              />
              <NumberInput
                label="Cantidad"
                value={cantidad}
                onChange={(value) => setCantidad(Number(value) || 1)}
                min={1}
                size="sm"
                disabled={!insumoSeleccionado || soloLectura}
                description={insumoSeleccionado ? `Costo base: $${Number(insumoSeleccionado.costo).toFixed(2)}` : 'Seleccione insumo'}
                hideControls
              />
              <Group>
                <Button size="sm" onClick={agregarInsumo} disabled={!insumoSeleccionado || soloLectura}>Agregar</Button>
                <Button size="sm" variant="outline" color="gray" disabled={!insumoSeleccionado || soloLectura} onClick={() => {
                  setInsumoSeleccionado(null)
                  setCantidad(1)
                }}>Cancelar</Button>
              </Group>
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
      
      <Paper p="md" withBorder>
        <Title order={4} mb="md">Insumos Seleccionados</Title>

          <Table striped="odd" highlightOnHover stickyHeader >
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Insumo</Table.Th>
                <Table.Th>Cantidad</Table.Th>
                <Table.Th>
                  <Tooltip label="Costo base del insumo">
                    <span>Costo Unit.</span>
                  </Tooltip>
                </Table.Th>
                <Table.Th>
                  <Tooltip label="Costo base + margen de sucursal (logística y ganancia)">
                    <span>Precio a Facturar</span>
                  </Tooltip>
                </Table.Th>
                <Table.Th>
                  <Tooltip label="Costo base × cantidad">
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
              {insumosSeleccionados.map((insumo, index) => {
                const costoBase = Number(insumo.costo);
                const costoUnitario = costoBase;
                const precioFacturar = costoBase * (1 + porcentajeInsumos / 100);
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
                  <Table.Td>${costoUnitario.toFixed(2)}</Table.Td>
                  <Table.Td>${precioFacturar.toFixed(2)}</Table.Td>
                  <Table.Td>${subtotalCosto.toFixed(2)}</Table.Td>
                  <Table.Td>${subtotalFacturar.toFixed(2)}</Table.Td>
                  <Table.Td>
                    {!soloLectura && (
                      <Group gap="xs" align='baseline'>
                        <ActionIcon
                          variant="transparent"
                          onClick={() => {
                            setEditandoIndex(index)
                            setNuevaCantidad(insumo.cantidad)
                          }}
                        >
                          <PencilSquareIcon width={20} height={20} />
                        </ActionIcon>
                        <ActionIcon
                          variant="transparent"
                          color="red"
                          onClick={() => eliminarInsumo(index)}
                        >
                          <TrashIcon width={20} height={20} />
                        </ActionIcon>
                      </Group>
                    )}
                  </Table.Td>
                </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>

        {insumosSeleccionados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No hay insumos seleccionados
          </div>
        )}
      </Paper>
    </Stack>
  )
}
