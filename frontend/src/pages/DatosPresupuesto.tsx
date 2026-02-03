import React, { useState, useEffect } from 'react'
import { Paper, TextInput, Select, Checkbox, Button, Group, Stack, Title, Modal, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api/api'
import { useAuth } from '../contexts/AuthContext'
import { useZonas } from '../hooks/useZonas'

// Interface for the data passed when a budget is created/loaded
export interface PresupuestoCreadoData {
  id: number
  nombre: string
  dni: string
  sucursal: string
  porcentajeInsumos: number
  financiadorId?: string
  sucursalId?: number
  zonaId?: number
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
  const [zonaId, setZonaId] = useState<number | null>(null)
  const [financiadorId, setFinanciadorId] = useState<string | null>(null)
  const [dificilAcceso, setDificilAcceso] = useState(false)
  const [sucursales, setSucursales] = useState<{ID: number, Sucursales_mh: string, suc_porcentaje_insumos: number}[]>([])
  const [financiadores, setFinanciadores] = useState<any[]>([])
  const [presupuestoCreado, setPresupuestoCreado] = useState(false)
  const [modalDNI, setModalDNI] = useState(false)
  const [presupuestoExistente, setPresupuestoExistente] = useState<any>(null)
  
  // Hook de zonas
  const { zonas, loading: loadingZonas, zonaPrincipal } = useZonas(sucursalId)
  
  // Internal state for when props are not provided (controlled vs uncontrolled handling could be better but keeping simple for now)
  const [esCargaHistorialLocal, setEsCargaHistorialLocal] = useState(false)
  const esCargaHistorial = esCargaHistorialProp ?? esCargaHistorialLocal
  const setEsCargaHistorial = setEsCargaHistorialProp ?? setEsCargaHistorialLocal

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userSucursalId = user?.sucursal_id
        
        const requests = [
          api.get('/sucursales'),
          api.get('/prestaciones/financiadores')
        ]
        
        // Si hay sucursal del usuario, cargar sus zonas en paralelo
        if (userSucursalId) {
          requests.push(api.get(`/sucursales/${userSucursalId}/zonas`))
        }
        
        const responses = await Promise.all(requests)
        
        setSucursales(responses[0].data)
        setFinanciadores(responses[1].data)
        
        // Si se cargaron zonas, actualizar el hook
        if (userSucursalId && responses[2]) {
          const sucursalData = responses[0].data.find((s: any) => Number(s.ID) === Number(userSucursalId))
          if (sucursalData) {
            setSucursalId(sucursalData.ID)
            setSucursal(sucursalData.Sucursales_mh)
          }
        }
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

  // Pre-seleccionar sucursal del usuario (solo si no se hizo en fetchData inicial)
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

  // Preseleccionar zona principal
  useEffect(() => {
    if (sucursalId && !presupuestoCreado) {
      if (zonas.length === 0) {
        setZonaId(null)
      } else if (zonas.length === 1) {
        setZonaId(zonas[0].id)
      } else if (zonaPrincipal) {
        setZonaId(zonaPrincipal.id)
      }
    }
  }, [zonas, zonaPrincipal, sucursalId, presupuestoCreado])

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
        zona_id: zonaId,
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
        sucursalId: sucursalId || undefined,
        zonaId: zonaId || undefined
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
        zona_id: zonaId,
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
        const sucursalData = sucursales.find(s => s.Sucursales_mh === presupuestoCompleto.Sucursal)
        
        setNombre(presupuestoCompleto.Nombre_Apellido)
        setDni(presupuestoCompleto.DNI)
        setSucursal(presupuestoCompleto.Sucursal)
        setSucursalId(sucursalData?.ID || null)
        setZonaId(presupuestoCompleto.zona_id || null)
        setDificilAcceso(presupuestoCompleto.dificil_acceso === 'si')
        if (presupuestoCompleto.financiador_id) {
          setFinanciadorId(presupuestoCompleto.financiador_id.toString())
        }
        
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
            sucursalId: sucursalData?.ID,
            zonaId: presupuestoCompleto.zona_id
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
            setZonaId(null) // Resetear zona al cambiar sucursal
          }}
          placeholder="Seleccione una sucursal"
          required
          disabled={presupuestoCreado || esCargaHistorial || soloLectura}
          variant={(presupuestoCreado || esCargaHistorial || soloLectura) ? "filled" : "default"}
          searchable
          checkIconPosition="right"
        />
        
        {/* Selector de Zona */}
        <Select
          label="Zona"
          data={zonas.map(z => ({
            value: z.id.toString(),
            label: z.nombre + (z.es_zona_principal === 1 ? ' (Principal)' : '')
          }))}
          value={zonaId !== null ? zonaId.toString() : null}
          onChange={(value) => setZonaId(value ? parseInt(value) : null)}
          placeholder={!sucursalId ? "Seleccione primero una sucursal" : loadingZonas ? "Cargando zonas..." : "Seleccione una zona"}
          disabled={!sucursalId || presupuestoCreado || soloLectura || loadingZonas}
          variant={(presupuestoCreado || soloLectura) ? "filled" : "default"}
          description="Zona geográfica para servicios del tarifario"
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
