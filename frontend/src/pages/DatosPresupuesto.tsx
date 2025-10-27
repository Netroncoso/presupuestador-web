import React, { useState, useEffect } from 'react'
import { Paper, TextInput, Select, Checkbox, Button, Group, Stack, Title, Modal, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api/api'

interface Props {
  onPresupuestoCreado: (id: number, nombre: string, sucursal: string, porcentajeInsumos: number, financiadorId?: string) => void
  onNuevoPresupuesto: () => void
}

export default function DatosPresupuesto({ onPresupuestoCreado, onNuevoPresupuesto }: Props) {
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [sucursal, setSucursal] = useState('')
  const [dificilAcceso, setDificilAcceso] = useState(false)
  const [sucursales, setSucursales] = useState<{Sucursales_mh: string, suc_porcentaje_insumos: number}[]>([])
  const [presupuestoCreado, setPresupuestoCreado] = useState(false)
  const [modalDNI, setModalDNI] = useState(false)
  const [presupuestoExistente, setPresupuestoExistente] = useState<any>(null)
  const [esCargaHistorial, setEsCargaHistorial] = useState(false)

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
        setEsCargaHistorial(true) // Marcar como carga de historial
        onPresupuestoCreado(
          presupuestoCompleto.idPresupuestos, 
          presupuestoCompleto.Nombre_Apellido, 
          presupuestoCompleto.Sucursal, 
          porcentajeInsumos,
          presupuestoCompleto.idobra_social // Pasar el financiador
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
        <Text size="sm" c="orange" ta="center" mb="md">
          📋 Presupuesto cargado del historial - Nombre y sucursal no modificables
        </Text>
      )}
      
  <Stack spacing="md" maw={500} mx="auto">
        <TextInput
          label="Nombre y Apellido"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          readOnly={esCargaHistorial}
          style={{ backgroundColor: esCargaHistorial ? '#f5f5f5' : 'white' }}
        />
        
        <TextInput
          label="DNI"
          value={dni}
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
          style={{ backgroundColor: esCargaHistorial ? '#f5f5f5' : 'white' }}
        />
        
        <Checkbox
          label="Difícil Acceso"
          checked={dificilAcceso}
          onChange={(e) => setDificilAcceso(e.target.checked)}
        />
        
  <Group position="center" mt="lg">
          {presupuestoCreado && (
            <Button onClick={nuevoPresupuesto} variant="outline">
              Nuevo Presupuesto
            </Button>
          )}
          <Button onClick={guardarYContinuar} disabled={presupuestoCreado}>
            {presupuestoCreado ? 'Presupuesto Guardado' : 'Guardar y Continuar'}
          </Button>
        </Group>
      </Stack>

      <Modal
        opened={modalDNI}
        onClose={() => setModalDNI(false)}
        title="Paciente Existente"
        size="md"
      >
        <Stack spacing="md">
          <Text>
            Ya existe un presupuesto para el DNI <strong>{dni}</strong>:
          </Text>
          
          {presupuestoExistente && (
            <Paper p="sm" withBorder>
              <Text size="sm"><strong>Nombre:</strong> {presupuestoExistente.Nombre_Apellido}</Text>
              <Text size="sm"><strong>Sucursal:</strong> {presupuestoExistente.Sucursal}</Text>
              <Text size="sm"><strong>ID:</strong> {presupuestoExistente.idPresupuestos}</Text>
              {presupuestoExistente.created_at && (
                <Text size="sm"><strong>Fecha:</strong> {new Date(presupuestoExistente.created_at).toLocaleDateString()}</Text>
              )}
            </Paper>
          )}
          
          <Text size="sm" c="dimmed">
            ¿Desea continuar con el presupuesto existente o crear uno nuevo con los mismos datos?
          </Text>
          
          <Group>
            <Button 
              variant="outline" 
              onClick={() => {
                if (presupuestoExistente) {
                  // Precargar datos del presupuesto existente en los campos
                  setNombre(presupuestoExistente.Nombre_Apellido)
                  setSucursal(presupuestoExistente.Sucursal)
                  setModalDNI(false)
                  
                  // Crear presupuesto directamente con los datos
                  crearNuevoConDatos(presupuestoExistente.Nombre_Apellido, presupuestoExistente.Sucursal)
                }
              }}
            >
              Crear Nuevo para este DNI
            </Button>
            <Button onClick={cargarPresupuestoExistente}>
              Cargar Existente
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Paper>
  )
}