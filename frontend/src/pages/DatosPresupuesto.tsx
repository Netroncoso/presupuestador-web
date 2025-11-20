import React, { useState, useEffect } from 'react'
import { Paper, TextInput, Select, Checkbox, Button, Group, Stack, Title, Modal, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api/api'

interface Props {
  onPresupuestoCreado: (id: number, nombre: string, sucursal: string, porcentajeInsumos: number, financiadorId?: string) => void
  onNuevoPresupuesto: () => void
  esCargaHistorial?: boolean
  setEsCargaHistorial?: (esHistorial: boolean) => void
  datosHistorial?: { nombre: string; dni: string; sucursal: string }
}

export default function DatosPresupuesto({ onPresupuestoCreado, onNuevoPresupuesto, esCargaHistorial: esCargaHistorialProp, setEsCargaHistorial: setEsCargaHistorialProp, datosHistorial }: Props) {
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [sucursal, setSucursal] = useState('')
  const [dificilAcceso, setDificilAcceso] = useState(false)
  const [sucursales, setSucursales] = useState<{Sucursales_mh: string, suc_porcentaje_insumos: number}[]>([])
  const [presupuestoCreado, setPresupuestoCreado] = useState(false)
  const [modalDNI, setModalDNI] = useState(false)
  const [presupuestoExistente, setPresupuestoExistente] = useState<any>(null)
  const [esCargaHistorialLocal, setEsCargaHistorialLocal] = useState(false)
  const esCargaHistorial = esCargaHistorialProp ?? esCargaHistorialLocal
  const setEsCargaHistorial = setEsCargaHistorialProp ?? setEsCargaHistorialLocal

  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await api.get('/sucursales')
        setSucursales(res.data)
      } catch (error) {
        console.error('Error fetching sucursales:', error)
        notifications.show({
          title: 'Error',
          message: 'Error al cargar sucursales',
          color: 'red'
        })
      }
    }
    fetchSucursales()
  }, [])

  useEffect(() => {
    if (datosHistorial) {
      setNombre(datosHistorial.nombre)
      setDni(datosHistorial.dni)
      setSucursal(datosHistorial.sucursal)
      setPresupuestoCreado(true)
    }
  }, [datosHistorial])

  const verificarDNI = async () => {
    if (!dni || !/^\d{7,8}$/.test(dni)) {
      notifications.show({
        title: 'DNI inválido',
        message: 'El DNI debe tener 7-8 dígitos',
        color: 'red'
      })
      return
    }

    try {
      const res = await api.get(`/presupuestos/verificar-dni/${dni}`)
      
      if (res.data.exists) {
        setPresupuestoExistente(res.data.presupuesto)
        setModalDNI(true)
      } else {
        crearNuevoPresupuesto()
      }
    } catch (error) {
      console.error('Error verificando DNI:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al verificar DNI',
        color: 'red'
      })
    }
  }

  const crearNuevoPresupuesto = async () => {
    try {
      const res = await api.post('/presupuestos', {
        nombre,
        dni,
        sucursal,
        dificil_acceso: dificilAcceso ? 'si' : 'no'
      })
      
      const sucursalData = sucursales.find(s => s.Sucursales_mh === sucursal)
      const porcentajeInsumos = sucursalData?.suc_porcentaje_insumos || 0
      
      setPresupuestoCreado(true)
      onPresupuestoCreado(res.data.id, nombre, sucursal, porcentajeInsumos)
      notifications.show({
        title: 'Guardado',
        message: `Presupuesto creado con ID: ${res.data.id}`,
        color: 'green'
      })
    } catch (error) {
      console.error('Error creating presupuesto:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al guardar datos',
        color: 'red'
      })
    }
  }

  const crearNuevoConDatos = async (nombreParam: string, sucursalParam: string) => {
    try {
      const res = await api.post('/presupuestos', {
        nombre: nombreParam,
        dni,
        sucursal: sucursalParam,
        dificil_acceso: dificilAcceso ? 'si' : 'no'
      })
      
      const sucursalData = sucursales.find(s => s.Sucursales_mh === sucursalParam)
      const porcentajeInsumos = sucursalData?.suc_porcentaje_insumos || 0
      
      setPresupuestoCreado(true)
      onPresupuestoCreado(res.data.id, nombreParam, sucursalParam, porcentajeInsumos)
      notifications.show({
        title: 'Guardado',
        message: `Nuevo presupuesto creado con ID: ${res.data.id}`,
        color: 'green'
      })
    } catch (error) {
      console.error('Error creating presupuesto:', error)
      notifications.show({
        title: 'Error',
        message: 'Error al guardar datos',
        color: 'red'
      })
    }
  }

  const cargarPresupuestoExistente = async () => {
    if (presupuestoExistente) {
      try {
        // Obtener datos completos del presupuesto
        const res = await api.get(`/presupuestos/${presupuestoExistente.idPresupuestos}`)
        const presupuestoCompleto = res.data
        
        // Actualizar los campos del formulario
        setNombre(presupuestoCompleto.Nombre_Apellido)
        setDni(presupuestoCompleto.DNI)
        setSucursal(presupuestoCompleto.Sucursal)
        setDificilAcceso(presupuestoCompleto.dificil_acceso === 'si')
        
        const sucursalData = sucursales.find(s => s.Sucursales_mh === presupuestoCompleto.Sucursal)
        const porcentajeInsumos = sucursalData?.suc_porcentaje_insumos || 0
        
        setPresupuestoCreado(true)
        setEsCargaHistorial(true)
        onPresupuestoCreado(
          presupuestoCompleto.idPresupuestos, 
          presupuestoCompleto.Nombre_Apellido, 
          presupuestoCompleto.Sucursal,
          porcentajeInsumos,
          presupuestoCompleto.idobra_social
        )
        setModalDNI(false)
        notifications.show({
          title: 'Presupuesto Cargado',
          message: `Presupuesto ID: ${presupuestoCompleto.idPresupuestos} cargado`,
          color: 'blue'
        })
      } catch (error) {
        console.error('Error cargando presupuesto:', error)
        notifications.show({
          title: 'Error',
          message: 'Error al cargar el presupuesto',
          color: 'red'
        })
      }
    }
  }

  const guardarYContinuar = async () => {
    if (!nombre || !dni || !sucursal) {
      notifications.show({
        title: 'Campos vacíos',
        message: 'Complete todos los campos',
        color: 'red'
      })
      return
    }

    await verificarDNI()
  }

  const nuevoPresupuesto = () => {
    setNombre('')
    setDni('')
    setSucursal('')
    setDificilAcceso(false)
    setPresupuestoCreado(false)
    setModalDNI(false)
    setPresupuestoExistente(null)
    setEsCargaHistorial(false) // Reset historical load flag
    onNuevoPresupuesto()
    notifications.show({
      title: 'Nuevo Presupuesto',
      message: 'Listo para un nuevo presupuesto',
      color: 'blue'
    })
  }

  return (
    <Paper p="xl" withBorder>
      <Title order={3} mb="lg" ta="center" c={esCargaHistorial ? "orange" : "blue"}>
        {esCargaHistorial ? "Presupuesto del Historial" : "Datos del Paciente"}
      </Title>
      {esCargaHistorial && (
        <Group justify="center" gap="xs" mb="md">
          <Text size="sm" c="orange" ta="center">
            Presupuesto cargado del historial - Nombre y sucursal no modificables
          </Text>
        </Group>
      )}
      
      <Stack gap="md" maw={500} mx="auto">
        <TextInput
          label="Nombre y Apellido"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          disabled={esCargaHistorial}
          variant={esCargaHistorial ? "filled" : "default"}
        />
        
        <TextInput
          label="DNI"
          value={dni}
          disabled={esCargaHistorial}
          variant={esCargaHistorial ? "filled" : "default"}
          onChange={(e) => setDni(e.target.value)}
          required
        />
        
        <Select
          label="Sucursal"
          data={sucursales.map(s => s.Sucursales_mh)}
          value={sucursal}
          onChange={(value) => setSucursal(value || '')}
          placeholder="Seleccione una sucursal"
          required
          disabled={esCargaHistorial}
          variant={esCargaHistorial ? "filled" : "default"}
          searchable
          checkIconPosition="right"
        />
        
        <Checkbox
          label="Difícil Acceso"
          checked={dificilAcceso}
          onChange={(e) => setDificilAcceso(e.target.checked)}
        />
        
        <Group justify="center" mt="lg">
          {presupuestoCreado && (
            <Button onClick={nuevoPresupuesto} variant="outline">
              Nuevo Presupuesto
            </Button>
          )}
          <Button onClick={guardarYContinuar} disabled={presupuestoCreado}>
            {presupuestoCreado ? 'Paciente Guardado' : 'Crear Presupuesto'}
          </Button>
        </Group>
      </Stack>

      <Modal opened={modalDNI} onClose={() => setModalDNI(false)} title="DNI Existente">
        <Stack>
          <Text>Ya existe un presupuesto con este DNI:</Text>
          <Text fw={700}>{presupuestoExistente?.Nombre_Apellido}</Text>
          <Text size="sm">Sucursal: {presupuestoExistente?.Sucursal}</Text>
          <Group justify="center" mt="md">
            <Button onClick={cargarPresupuestoExistente} color="blue">
              Cargar Presupuesto Existente
            </Button>
            <Button onClick={() => {
              setModalDNI(false)
              crearNuevoConDatos(nombre, sucursal)
            }} color="green">
              Crear Nuevo
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  )
}
