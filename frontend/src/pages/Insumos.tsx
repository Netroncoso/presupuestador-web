import React, { useState, useEffect } from 'react'
import { Paper, TextInput, Button, Group, Stack, Title, Grid, NumberInput, Table, ActionIcon, ScrollArea, Checkbox, Center } from '@mantine/core'
import { TrashIcon, PencilSquareIcon,MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { notifications } from '@mantine/notifications'
import { api } from '../api/api'

interface Insumo {
  producto: string
  costo: number
  cantidad: number
}

interface Props {
  insumosSeleccionados: Insumo[]
  setInsumosSeleccionados: (insumos: Insumo[]) => void
  onTotalChange: (total: number) => void
  presupuestoId: number | null
  porcentajeInsumos: number
}

export default function Insumos({ insumosSeleccionados, setInsumosSeleccionados, onTotalChange, presupuestoId, porcentajeInsumos }: Props) {
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
    if (presupuestoId) {
      api.get(`/presupuestos/${presupuestoId}/insumos`).then(res => {
        setInsumosSeleccionados(res.data)
      }).catch((err: any) => console.error('Error loading insumos:', err))
    }
  }, [presupuestoId, setInsumosSeleccionados])

  useEffect(() => {
    const total = insumosSeleccionados.reduce((sum, insumo) => sum + (Number(insumo.costo) * insumo.cantidad), 0)
    onTotalChange(total)
  }, [insumosSeleccionados, onTotalChange])

  const insumosFiltrados = insumosDisponibles.filter(insumo =>
    insumo.producto.toLowerCase().includes(filtro.toLowerCase())
  ).map(insumo => ({
    ...insumo,
    costo: Number(insumo.costo) * (1 + porcentajeInsumos / 100)
  }))

  const handleInsumoChange = (insumo: any) => {
    setInsumoSeleccionado(insumo)
    setCantidad(1)
  }

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
        cantidad
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
        cantidad: nuevaCantidad
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
    <Stack spacing="md">
      <Grid>
        <Grid.Col span={6}>
          <Paper p="md" withBorder>
            <Title order={4} mb="md">Insumos Disponibles</Title>
            <TextInput label="Buscar Insumo" value={filtro} onChange={(e) => setFiltro(e.target.value)} rightSection={<MagnifyingGlassIcon className="w-4 h-4" />} placeholder="Escriba para buscar..." />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Table striped highlightOnHover fontSize="sm" style={{ tableLayout: 'fixed' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                  <tr>
                    <th style={{ width: '70%' }}>Insumo</th>
                    <th style={{ width: '30%', textAlign: 'right' }}>Costo</th>
                  </tr>
                </thead>
              </Table>
              <ScrollArea h={350} scrollbarSize={8} scrollHideDelay={0} type='always'>
                <Table striped highlightOnHover fontSize="sm" style={{ tableLayout: 'fixed' }}>
                <tbody>
                  {insumosFiltrados.map((insumo, index) => (
                    <tr key={index}>
                      <td style={{ width: '70%' }}>
                        <Group spacing="xs">
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
                          />
                          <span>{insumo.producto.charAt(0).toUpperCase() + insumo.producto.slice(1).toLowerCase()}</span>
                        </Group>
                      </td>
                      <td style={{ width: '30%', textAlign: 'right' }}>${Number(insumo.costo).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </ScrollArea>
            </div>
          </Paper>
        </Grid.Col>
        
        <Grid.Col span={6}>
          <Paper p="md" withBorder style={{ backgroundColor: insumoSeleccionado ? '#f8f9fa' : '#f5f5f5', opacity: insumoSeleccionado ? 1 : 0.6 }}>
            <Title order={4} mb="md">Agregar al Presupuesto</Title>
            <Stack spacing="sm">
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
                disabled={!insumoSeleccionado}
                description={insumoSeleccionado ? `Costo final: $${Number(insumoSeleccionado.costo).toFixed(2)} (incluye ${porcentajeInsumos}% de Logistica)` : 'Seleccione insumo'}
              />
              <Group>
                <Button size="sm" onClick={agregarInsumo} disabled={!insumoSeleccionado}>Agregar</Button>
                <Button size="sm" variant="outline" color="gray" disabled={!insumoSeleccionado} onClick={() => {
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
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Table striped highlightOnHover style={{ tableLayout: 'fixed' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr>
                <th style={{ width: '30%' }}>Insumo</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Cantidad</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Costo Unit.</th>
                <th style={{ width: '20%', textAlign: 'center' }}>Subtotal</th>
                <th style={{ width: '15%', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
          </Table>
          <ScrollArea h={250} scrollbarSize={8} scrollHideDelay={0}>
            <Table striped highlightOnHover style={{ tableLayout: 'fixed' }}>
            <tbody>
              {insumosSeleccionados.map((insumo, index) => (
                <tr key={index}>
                  <td style={{ width: '30%' }}>{insumo.producto}</td>
                  <td style={{ width: '15%', textAlign: 'center' }}>
                    {editandoIndex === index ? (
                      <Group spacing="xs">
                        <NumberInput
                          value={nuevaCantidad}
                          onChange={(value) => setNuevaCantidad(Number(value) || 1)}
                          min={1}
                          w={80}
                        />
                        <Button size="xs" onClick={() => actualizarCantidad(index)}>
                          OK
                        </Button>
                      </Group>
                    ) : (
                      insumo.cantidad
                    )}
                  </td>
                  <td style={{ width: '20%', textAlign: 'center' }}>${Number(insumo.costo).toFixed(2)}</td>
                  <td style={{ width: '20%', textAlign: 'center' }}>${(Number(insumo.costo) * insumo.cantidad).toFixed(2)}</td>
                  <td style={{ width: '15%', textAlign: 'center' }}>
                    <Group spacing="xs" position="center">
                      <ActionIcon
                        variant="light"
                        onClick={() => {
                          setEditandoIndex(index)
                          setNuevaCantidad(insumo.cantidad)
                        }}
                      >
                        <PencilSquareIcon width={16} height={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="light"
                        color="red"
                        onClick={() => eliminarInsumo(index)}
                      >
                        <TrashIcon width={16} height={16} />
                      </ActionIcon>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </ScrollArea>
        </div>
        {insumosSeleccionados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
            No hay insumos seleccionados
          </div>
        )}
      </Paper>
    </Stack>
  )
}