import React, { useState, useEffect } from 'react'
import { Tabs, Container, Title, Group, Text, Badge, Button } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useAuth } from '../contexts/AuthContext'
import DatosPresupuesto from './DatosPresupuesto'
import Insumos from './Insumos'
import Prestaciones from './Prestaciones'
import { api } from '../api/api'

export default function UserDashboard() {
  const { user, logout } = useAuth()
  const [presupuestoId, setPresupuestoId] = useState<number | null>(null)
  const [clienteNombre, setClienteNombre] = useState('')
  const [porcentajeInsumos, setPorcentajeInsumos] = useState(0)
  const [totalInsumos, setTotalInsumos] = useState(0)
  const [totalPrestaciones, setTotalPrestaciones] = useState(0)
  const [insumosSeleccionados, setInsumosSeleccionados] = useState<any[]>([])
  const [prestacionesSeleccionadas, setPrestacionesSeleccionadas] = useState<any[]>([])
  const [guardandoTotales, setGuardandoTotales] = useState(false)
  const [financiadorId, setFinanciadorId] = useState<string | null>(null)

  const totalFinal = totalInsumos + totalPrestaciones

  const guardarTotales = async () => {
    if (!presupuestoId) return
    
    setGuardandoTotales(true)
    try {
      await api.put(`/presupuestos/${presupuestoId}/totales`, {
        total_insumos: totalInsumos,
        total_prestaciones: totalPrestaciones
      })
      notifications.show({
        title: 'Totales Guardados',
        message: 'Los totales se guardaron correctamente',
        color: 'green'
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Error al guardar totales',
        color: 'red'
      })
    } finally {
      setGuardandoTotales(false)
    }
  }

  useEffect(() => {
    ;(window as any).__syncPrestacionesHandler = (prestaciones: any[], total: number) => {
      setPrestacionesSeleccionadas(prestaciones)
      setTotalPrestaciones(total)
    }
    return () => { try { delete (window as any).__syncPrestacionesHandler } catch (e) {} }
  }, [])

  return (
    <Container size="xl" p="md">
      <Group style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <Title order={2} c="blue">Presupuestador Médico</Title>
        <Group>
          <Text size="sm">Usuario: {user?.username}</Text>
          <Button variant="outline" size="xs" onClick={logout}>Cerrar Sesión</Button>
        </Group>
      </Group>

      <Group style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <Group>
          {clienteNombre && <Text fw={500}>Cliente: {clienteNombre}</Text>}
        </Group>
        <Group>
          <Badge variant="light">Insumos: ${totalInsumos.toFixed(2)}</Badge>
          <Badge variant="light">Prestaciones: ${totalPrestaciones.toFixed(2)}</Badge>
          <Badge variant="filled" size="lg">TOTAL: ${totalFinal.toFixed(2)}</Badge>
          {presupuestoId && (
            <Button 
              onClick={guardarTotales} 
              loading={guardandoTotales}
              size="sm"
              color="green"
            >
              Guardar Totales
            </Button>
          )}
        </Group>
      </Group>

      <Tabs defaultValue="datos" variant="outline">
        <Tabs.List>
          <Tabs.Tab value="datos">Datos del Presupuesto</Tabs.Tab>
          <Tabs.Tab value="insumos" disabled={!presupuestoId}>Insumos</Tabs.Tab>
          <Tabs.Tab value="prestaciones" disabled={!presupuestoId}>Prestaciones</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="datos" pt="md">
          <DatosPresupuesto 
            onPresupuestoCreado={(id, nombre, sucursal, porcentaje, financiadorIdParam) => {
              setPresupuestoId(id)
              setClienteNombre(nombre)
              setPorcentajeInsumos(porcentaje)
              setFinanciadorId(financiadorIdParam || null)
            }}
            onNuevoPresupuesto={() => {
              setPresupuestoId(null)
              setClienteNombre('')
              setPorcentajeInsumos(0)
              setTotalInsumos(0)
              setTotalPrestaciones(0)
              setInsumosSeleccionados([])
              setPrestacionesSeleccionadas([])
              setFinanciadorId(null)
            }}
          />
        </Tabs.Panel>

        <Tabs.Panel value="insumos" pt="md">
          <Insumos 
            insumosSeleccionados={insumosSeleccionados}
            setInsumosSeleccionados={setInsumosSeleccionados}
            onTotalChange={setTotalInsumos}
            presupuestoId={presupuestoId}
            porcentajeInsumos={porcentajeInsumos}
          />
        </Tabs.Panel>

        <Tabs.Panel value="prestaciones" pt="md">
          <Prestaciones 
            prestacionesSeleccionadas={prestacionesSeleccionadas}
            setPrestacionesSeleccionadas={setPrestacionesSeleccionadas}
            onTotalChange={setTotalPrestaciones}
            presupuestoId={presupuestoId}
            financiadorId={financiadorId}
          />
        </Tabs.Panel>
      </Tabs>
    </Container>
  )
}