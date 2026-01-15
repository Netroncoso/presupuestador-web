import React, { useState, useEffect } from 'react'
import { Paper, TextInput, Select, Checkbox, Button, Group, Stack, Title, Modal, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api/api'
import { useAuth } from '../contexts/AuthContext'

// Interface for the data passed when a budget is created/loaded
export interface PresupuestoCreadoData {
  id: number
  nombre: string
  dni: string
  sucursal: string
  porcentajeInsumos: number
  financiadorId?: string
  sucursalId?: number
}

interface Props {
  onPresupuestoCreado: (data: PresupuestoCreadoData) => void
  onNuevoPresupuesto: () => void
  onCargarPresupuesto: (id: number, nombre: string, sucursal: string, financiadorId: string | null) => Promise<void>
  esCargaHistorial?: boolean
  setEsCargaHistorial?: (esHistorial: boolean) => void
  datosHistorial?: { nombre: string; dni: string; sucursal: string; sucursal_id?: number; financiador_id?: string }
  soloLectura?: boolean
}

export default function DatosPresupuesto({ 
  onPresupuestoCreado, 
  onNuevoPresupuesto, 
  onCargarPresupuesto,
  esCargaHistorial: esCargaHistorialProp, 
  setEsCargaHistorial: setEsCargaHistorialProp, 
  datosHistorial, 
  soloLectura = false 
}: Props) {
  const { user } = useAuth()
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [sucursal, setSucursal] = useState('')
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const [financiadorId, setFinanciadorId] = useState<string | null>(null)
  const [dificilAcceso, setDificilAcceso] = useState(false)
  const [sucursales, setSucursales] = useState<{ID: number, Sucursales_mh: string, suc_porcentaje_insumos: number}[]>([])
  const [financiadores, setFinanciadores] = useState<any[]>([])
  const [presupuestoCreado, setPresupuestoCreado] = useState(false)
  const [modalDNI, setModalDNI] = useState(false)
  const [presupuestoExistente, setPresupuestoExistente] = useState<any>(null)
  
  // Internal state for when props are not provided (controlled vs uncontrolled handling could be better but keeping simple for now)
  const [esCargaHistorialLocal, setEsCargaHistorialLocal] = useState(false)
  const esCargaHistorial = esCargaHistorialProp ?? esCargaHistorialLocal
  const setEsCargaHistorial = setEsCargaHistorialProp ?? setEsCargaHistorialLocal

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sucursalesRes, financiadoresRes] = await Promise.all([
          api.get('/sucursales'),
          api.get('/prestaciones/financiadores')
        ])
        setSucursales(sucursalesRes.data)
        setFinanciadores(financiadoresRes.data)
      } catch (error) {
        console.error('❌ Error fetching data:', error)
        notifications.show({
          title: 'Error',
          message: 'Error al cargar datos',
          color: 'red'
        })
      }
    }
    fetchData()
  }, [])

  // Pre-seleccionar sucursal del usuario
  useEffect(() => {
    if (sucursales.length > 0 && !presupuestoCreado && !datosHistorial && sucursalId === null) {
      const userSucursalId = user?.sucursal_id
      
      if (userSucursalId) {
        const sucursalData = sucursales.find(s => Number(s.ID) === Number(userSucursalId))
        
        if (sucursalData) {
          setSucursalId(sucursalData.ID)
          setSucursal(sucursalData.Sucursales_mh)
        }
      }
    }
  }, [sucursales, user, presupuestoCreado, datosHistorial, sucursalId])

  useEffect(() => {
    if (datosHistorial) {
      setNombre(datosHistorial.nombre)
      setDni(datosHistorial.dni)
      setSucursal(datosHistorial.sucursal)
      setSucursalId(datosHistorial.sucursal_id || null)
      setFinanciadorId(datosHistorial.financiador_id || null)
      setPresupuestoCreado(true)
    } else {
      // Limpiar TODOS los campos cuando no hay datosHistorial
      // Esto solo debe ocurrir si explícitamente se limpia datosHistorial (ej: nuevo presupuesto)
      // Para evitar borrar la sucursal pre-seleccionada al inicio, verificamos si realmente queremos resetear
      if (!datosHistorial && presupuestoCreado) {
         setNombre('')
         setDni('')
         // No reseteamos sucursal aqui para mantener la del usuario si empieza de nuevo
         // setSucursal('') 
         // setSucursalId(null)
         setFinanciadorId(null)
         setDificilAcceso(false)
         setPresupuestoCreado(false)
      }
    }
  }, [datosHistorial]) // Removed presupuestoCreado from dependency to avoid loop, logic handled inside

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
      const sucursalData = sucursales.find(s => s.ID === sucursalId)
      const porcentajeInsumos = sucursalData?.suc_porcentaje_insumos || 0
      
      const res = await api.post('/presupuestos', {
        nombre,
        dni,
        sucursal_id: sucursalId,
        financiador_id: financiadorId,
        dificil_acceso: dificilAcceso ? 'si' : 'no',
        porcentaje_insumos: porcentajeInsumos
      })
      
      setPresupuestoCreado(true)
      onPresupuestoCreado({
        id: res.data.id, 
        nombre, 
        dni, 
        sucursal, 
        porcentajeInsumos, 
        financiadorId: financiadorId || undefined, 
        sucursalId: sucursalId || undefined
      })
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
      const sucursalData = sucursales.find(s => s.Sucursales_mh === sucursalParam)
      const porcentajeInsumos = sucursalData?.suc_porcentaje_insumos || 0
      
      const res = await api.post('/presupuestos', {
        nombre: nombreParam,
        dni,
        sucursal_id: sucursalData?.ID,
        financiador_id: financiadorId,
        dificil_acceso: dificilAcceso ? 'si' : 'no',
        porcentaje_insumos: porcentajeInsumos
      })
      
      setPresupuestoCreado(true)
      onPresupuestoCreado({
        id: res.data.id, 
        nombre: nombreParam, 
        dni, 
        sucursal: sucursalParam, 
        porcentajeInsumos, 
        financiadorId: financiadorId || undefined, 
        sucursalId: sucursalData?.ID
      })
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
        const response = await api.post(`/presupuestos/${presupuestoExistente.idPresupuestos}/version/editar`, {
          confirmar: false
        })

        let presupuestoCompleto
        if (response.data.requiereConfirmacion) {
          const responseConfirmado = await api.post(`/presupuestos/${presupuestoExistente.idPresupuestos}/version/editar`, {
            confirmar: true
          })
          
          const res = await api.get(`/presupuestos/${responseConfirmado.data.id}`)
          presupuestoCompleto = res.data
          
          notifications.show({
            title: 'Nueva Versión Creada',
            message: `Nueva versión del presupuesto creada para edición (ID: ${presupuestoCompleto.idPresupuestos})`,
            color: 'green'
          })
        } else {
          const res = await api.get(`/presupuestos/${response.data.id}`)
          presupuestoCompleto = res.data
          
          notifications.show({
            title: 'Presupuesto Cargado',
            message: `Presupuesto ID: ${presupuestoCompleto.idPresupuestos} cargado para edición`,
            color: 'blue'
          })
        }
        
        // Actualizar formulario
        setNombre(presupuestoCompleto.Nombre_Apellido)
        setDni(presupuestoCompleto.DNI)
        setSucursal(presupuestoCompleto.Sucursal)
        setDificilAcceso(presupuestoCompleto.dificil_acceso === 'si')
        if (presupuestoCompleto.financiador_id) {
          setFinanciadorId(presupuestoCompleto.financiador_id.toString())
        }
        
        const sucursalData = sucursales.find(s => s.Sucursales_mh === presupuestoCompleto.Sucursal)
        const porcentajeInsumos = sucursalData?.suc_porcentaje_insumos || 0
        
        setPresupuestoCreado(true)
        setEsCargaHistorial(true)
        
        // 1. Notificar datos básicos
        onPresupuestoCreado({
            id: presupuestoCompleto.idPresupuestos, 
            nombre: presupuestoCompleto.Nombre_Apellido,
            dni: presupuestoCompleto.DNI,
            sucursal: presupuestoCompleto.Sucursal,
            porcentajeInsumos,
            financiadorId: presupuestoCompleto.financiador_id?.toString(),
            sucursalId: sucursalData?.ID
        })
        
        // 2. Cargar datos adicionales (items) usando prop en lugar de window callback
        await onCargarPresupuesto(
            presupuestoCompleto.idPresupuestos,
            presupuestoCompleto.Nombre_Apellido,
            presupuestoCompleto.Sucursal,
            presupuestoCompleto.financiador_id
        )

        setModalDNI(false)
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
    if (!nombre || !dni || !sucursalId || !financiadorId) {
      notifications.show({
        title: 'Campos vacíos',
        message: 'Complete todos los campos obligatorios (Nombre, DNI, Sucursal y Financiador)',
        color: 'red'
      })
      return
    }

    await verificarDNI()
  }

  const nuevoPresupuesto = () => {
    setNombre('')
    setDni('')
    setFinanciadorId(null)
    setDificilAcceso(false)
    setPresupuestoCreado(false)
    setModalDNI(false)
    setPresupuestoExistente(null)
    setEsCargaHistorial(false)
    
    // Restaurar sucursal del usuario
    const userSucursalId = user?.sucursal_id
    if (userSucursalId) {
      const sucursalData = sucursales.find(s => Number(s.ID) === Number(userSucursalId))
      if (sucursalData) {
        setSucursalId(sucursalData.ID)
        setSucursal(sucursalData.Sucursales_mh)
      }
    } else {
      setSucursalId(null)
      setSucursal('')
    }
    
    onNuevoPresupuesto()
  }

  return (
    <Paper p="xl" withBorder>
      <Title order={3} mb="lg" ta="center" c={soloLectura ? "teal" : esCargaHistorial ? "orange" : "blue"}>
        {soloLectura ? "Visualizando Presupuesto" : esCargaHistorial ? "Presupuesto del Historial" : "Datos del Paciente"}
      </Title>
      {soloLectura && (
        <Paper p="xs" withBorder mb="md" style={{ backgroundColor: '#e7f5ff' }}>
          <Text size="sm" c="blue" fw={500} ta="center">
            Modo solo lectura - No se pueden realizar modificaciones
          </Text>
        </Paper>
      )}
      {esCargaHistorial && !soloLectura && (
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
          disabled={presupuestoCreado || esCargaHistorial || soloLectura}
          variant={(presupuestoCreado || esCargaHistorial || soloLectura) ? "filled" : "default"}
        />
        
        <TextInput
          label="DNI"
          value={dni}
          disabled={presupuestoCreado || esCargaHistorial || soloLectura}
          variant={(presupuestoCreado || esCargaHistorial || soloLectura) ? "filled" : "default"}
          onChange={(e) => setDni(e.target.value)}
          required
        />
        
        <Select
          label="Sucursal"
          data={sucursales.map(s => ({
            value: s.ID.toString(),
            label: s.Sucursales_mh
          }))}
          value={sucursalId !== null ? sucursalId.toString() : null}
          onChange={(value) => {
            const id = value ? parseInt(value) : null
            setSucursalId(id)
            const sucursalData = sucursales.find(s => s.ID === id)
            setSucursal(sucursalData?.Sucursales_mh || '')
          }}
          placeholder="Seleccione una sucursal"
          required
          disabled={presupuestoCreado || esCargaHistorial || soloLectura}
          variant={(presupuestoCreado || esCargaHistorial || soloLectura) ? "filled" : "default"}
          searchable
          checkIconPosition="right"
        />
        
        <Select
          label="Financiador"
          data={financiadores.map(f => ({
            value: f.id.toString(),
            label: f.activo === 1 ? f.Financiador : `${f.Financiador} (Consultar estado con cobranzas)`,
            disabled: f.activo === 0
          }))}
          value={financiadorId}
          onChange={async (value) => {
            // Solo actualizamos el estado local. Si queremos guardar en BD, debería ser con un botón explícito o confirmación
            // pero para mantener la funcionalidad existente de edición "en caliente" (que es peligrosa):
            setFinanciadorId(value)
            
            // Si es carga histórica y hay presupuesto creado, actualizar en BD
            if (esCargaHistorial && presupuestoCreado && value) {
                // TODO: Considerar mover esto a una función auxiliar o requerir confirmación del usuario
               try {
                const presupuestoIdActual = datosHistorial ? await api.get(`/presupuestos/verificar-dni/${dni}`).then(res => res.data.presupuesto?.idPresupuestos) : null
                if (presupuestoIdActual) {
                  await api.put(`/presupuestos/${presupuestoIdActual}/financiador`, {
                    financiador_id: parseInt(value)
                  })
                  notifications.show({
                    title: 'Financiador actualizado',
                    message: 'El financiador se guardó correctamente',
                    color: 'green'
                  })
                  onPresupuestoCreado({
                    id: presupuestoIdActual,
                    nombre,
                    dni,
                    sucursal,
                    porcentajeInsumos: sucursales.find(s => s.ID === sucursalId)?.suc_porcentaje_insumos || 0,
                    financiadorId: value,
                    sucursalId: sucursalId || undefined
                  })
                }
              } catch (error) {
                console.error('Error actualizando financiador:', error)
                notifications.show({
                  title: 'Error',
                  message: 'No se pudo actualizar el financiador',
                  color: 'red'
                })
              }
            }
          }}
          placeholder={!financiadorId && esCargaHistorial ? "Seleccione financiador" : "Seleccione un financiador"}
          required
          disabled={soloLectura || (presupuestoCreado && !esCargaHistorial) || (esCargaHistorial && financiadorId !== null)}
          variant={(presupuestoCreado || (esCargaHistorial && financiadorId !== null) || soloLectura) ? "filled" : "default"}
          searchable
          checkIconPosition="right"
        />
        
        {esCargaHistorial && !financiadorId && !soloLectura && (
          <Paper p="xs" withBorder style={{ backgroundColor: '#fff3cd' }}>
            <Text size="sm" c="orange">
              ⚠️ Este presupuesto no tiene financiador asignado. Seleccione uno para continuar.
            </Text>
          </Paper>
        )}
        
        <Checkbox
          label="Zona Desfavorable"
          checked={dificilAcceso}
          onChange={(e) => setDificilAcceso(e.target.checked)}
          disabled={presupuestoCreado || soloLectura}
        />
        
        {!soloLectura && (
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
        )}
      </Stack>

      <Modal opened={modalDNI} onClose={() => setModalDNI(false)} title={presupuestoExistente?.estado === 'borrador' ? "Presupuesto en Borrador" : "Presupuesto Existente"}>
        <Stack>
          <Text fw={500}>Presupuesto: #{presupuestoExistente?.idPresupuestos} - {presupuestoExistente?.Nombre_Apellido}</Text>
          <Text size="sm">Sucursal: {presupuestoExistente?.Sucursal}</Text>
          <Text size="sm">Estado: {presupuestoExistente?.estado?.toUpperCase() || 'NO DISPONIBLE'}</Text>
          
          <Text mt="md">
            {presupuestoExistente?.estado === 'borrador' 
              ? 'Este presupuesto está en borrador y puede editarse directamente.'
              : `Este presupuesto está ${presupuestoExistente?.estado}. Se creará una nueva versión en estado borrador para que puedas editarlo.`
            }
          </Text>
          
          {presupuestoExistente?.estado !== 'borrador' && (
            <Text size="sm" c="dimmed" fs="italic">
              ⚠️ La versión actual se mantendrá sin cambios en el historial.
            </Text>
          )}
          
          <Group justify="center" mt="md">
            {presupuestoExistente?.estado === 'borrador' ? (
              <>
                <Button onClick={() => setModalDNI(false)} variant="outline">
                  Cancelar
                </Button>
                <Button onClick={cargarPresupuestoExistente} color="blue">
                  Continuar
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => {
                  setModalDNI(false)
                  crearNuevoConDatos(nombre, sucursal)
                }} color="green">
                  Crear Nuevo
                </Button>
                <Button onClick={cargarPresupuestoExistente} color="blue">
                  Nueva Versión
                </Button>
              </>
            )}
          </Group>
        </Stack>
      </Modal>
    </Paper>
  )
}
