import React, { useState, useEffect } from 'react'
import { Paper, TextInput, Select, Checkbox, Button, Group, Stack, Title, Modal, Text, Badge } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { api } from '../api/api'
import { useAuth } from '../contexts/AuthContext'
import { useZonas } from '../hooks/useZonas'
import { useCompletarDatosConvenio } from '../hooks/useCompletarDatosConvenio'

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
  zonaTarifarioId?: number
  zonaFinanciadorId?: number
}

interface Props {
  onPresupuestoCreado: (data: PresupuestoCreadoData) => void
  onNuevoPresupuesto: () => void
  onCargarPresupuesto: (id: number, nombre: string, sucursal: string, financiadorId: string | null) => Promise<void>
  onFinanciadorIdChange?: (id: string | null) => void
  onZonaTarifarioIdChange?: (id: number | null) => void
  onZonaFinanciadorIdChange?: (id: number | null) => void
  esCargaHistorial?: boolean
  setEsCargaHistorial?: (esHistorial: boolean) => void
  datosHistorial?: { 
    nombre: string; 
    dni: string; 
    sucursal: string; 
    sucursal_id?: number; 
    financiador_id?: string; 
    zona_tarifario_id?: number; 
    zona_financiador_id?: number;
    zona_financiador_nombre?: string;
  }
  soloLectura?: boolean
  financiadorInfo?: { porcentaje_dificil_acceso?: number }
}

export default function DatosPresupuesto({ 
  onPresupuestoCreado, 
  onNuevoPresupuesto, 
  onCargarPresupuesto,
  onFinanciadorIdChange,
  onZonaTarifarioIdChange,
  onZonaFinanciadorIdChange,
  esCargaHistorial: esCargaHistorialProp, 
  setEsCargaHistorial: setEsCargaHistorialProp, 
  datosHistorial, 
  soloLectura = false,
  financiadorInfo
}: Props) {
  const { user } = useAuth()
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [numeroAfiliado, setNumeroAfiliado] = useState('')
  const [contactoNombre, setContactoNombre] = useState('')
  const [contactoTelefono, setContactoTelefono] = useState('')
  const [diagnosticoMedico, setDiagnosticoMedico] = useState('')
  const [domicilio, setDomicilio] = useState('')
  const [localidad, setLocalidad] = useState('')
  const [sucursal, setSucursal] = useState('')
  const [sucursalId, setSucursalId] = useState<number | null>(null)
  const [zonaTarifarioId, setZonaTarifarioId] = useState<number | null>(null)
  const [zonaFinanciadorId, setZonaFinanciadorId] = useState<number | null>(null)
  const [financiadorId, setFinanciadorId] = useState<string | null>(null)
  const [dificilAcceso, setDificilAcceso] = useState(false)
  const [sucursales, setSucursales] = useState<{ID: number, Sucursales_mh: string, suc_porcentaje_insumos: number}[]>([])
  const [financiadores, setFinanciadores] = useState<any[]>([])
  const [zonasFinanciador, setZonasFinanciador] = useState<any[]>([])
  const [loadingZonasFinanciador, setLoadingZonasFinanciador] = useState(false)
  const [presupuestoCreado, setPresupuestoCreado] = useState(false)
  const [presupuestoIdActual, setPresupuestoIdActual] = useState<number | null>(null)
  const [modalDNI, setModalDNI] = useState(false)
  const [presupuestoExistente, setPresupuestoExistente] = useState<any>(null)
  
  // Hook de zonas tarifario
  const { zonas: zonasTarifario, loading: loadingZonasTarifario, zonaPrincipal } = useZonas(sucursalId)
  
  // Hook para completar datos de convenio
  const { completarDatos, loading: loadingCompletarDatos } = useCompletarDatosConvenio()
  
  // Internal state for when props are not provided
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

  // Cargar zonas del financiador cuando se selecciona un financiador O cuando se carga desde historial
  useEffect(() => {
    const cargarZonasFinanciador = async () => {
      if (!financiadorId) {
        setZonasFinanciador([])
        setZonaFinanciadorId(null)
        onZonaFinanciadorIdChange?.(null)
        return
      }

      setLoadingZonasFinanciador(true)
      try {
        const response = await api.get(`/financiador/${financiadorId}/zonas`)
        setZonasFinanciador(response.data)
        
        // Si solo hay una zona, seleccionarla automáticamente (solo si no viene de historial)
        if (response.data.length === 1 && !datosHistorial) {
          setZonaFinanciadorId(response.data[0].id)
          onZonaFinanciadorIdChange?.(response.data[0].id)
        }
      } catch (error) {
        console.error('Error cargando zonas del financiador:', error)
        setZonasFinanciador([])
      } finally {
        setLoadingZonasFinanciador(false)
      }
    }

    cargarZonasFinanciador()
  }, [financiadorId])

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

  // Preseleccionar zona tarifario principal
  useEffect(() => {
    if (sucursalId && !presupuestoCreado) {
      if (zonasTarifario.length === 0) {
        setZonaTarifarioId(null)
      } else if (zonasTarifario.length === 1) {
        setZonaTarifarioId(zonasTarifario[0].id)
      } else if (zonaPrincipal) {
        setZonaTarifarioId(zonaPrincipal.id)
      }
    }
  }, [zonasTarifario, zonaPrincipal, sucursalId, presupuestoCreado])

  useEffect(() => {
    if (datosHistorial) {
      setNombre(datosHistorial.nombre)
      setDni(datosHistorial.dni)
      setSucursal(datosHistorial.sucursal)
      setSucursalId(datosHistorial.sucursal_id || null)
      setZonaTarifarioId(datosHistorial.zona_tarifario_id || null)
      setZonaFinanciadorId(datosHistorial.zona_financiador_id || null)
      setFinanciadorId(datosHistorial.financiador_id || null) // Esto dispara el useEffect que carga zonas
      setPresupuestoCreado(true)
    } else {
      if (!datosHistorial && presupuestoCreado) {
         setNombre('')
         setDni('')
         setFinanciadorId(null)
         setDificilAcceso(false)
         setPresupuestoCreado(false)
      }
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
      const sucursalData = sucursales.find(s => s.ID === sucursalId)
      const porcentajeInsumos = sucursalData?.suc_porcentaje_insumos || 0
      
      const res = await api.post('/presupuestos', {
        nombre,
        dni,
        fecha_nacimiento: fechaNacimiento || null,
        numero_afiliado: numeroAfiliado || null,
        contacto_nombre: contactoNombre || null,
        contacto_telefono: contactoTelefono || null,
        diagnostico_medico: diagnosticoMedico || null,
        domicilio: domicilio || null,
        localidad: localidad || null,
        sucursal_id: sucursalId,
        zona_tarifario_id: zonaTarifarioId,
        zona_financiador_id: zonaFinanciadorId,
        financiador_id: financiadorId,
        dificil_acceso: dificilAcceso ? 'si' : 'no',
        porcentaje_insumos: porcentajeInsumos
      })
      
      setPresupuestoCreado(true)
      setPresupuestoIdActual(res.data.id)
      onPresupuestoCreado({
        id: res.data.id, 
        nombre, 
        dni, 
        sucursal, 
        porcentajeInsumos, 
        financiadorId: financiadorId || undefined, 
        sucursalId: sucursalId || undefined,
        zonaId: zonaTarifarioId || undefined,
        zonaTarifarioId: zonaTarifarioId || undefined,
        zonaFinanciadorId: zonaFinanciadorId || undefined
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
        zona_tarifario_id: zonaTarifarioId,
        zona_financiador_id: zonaFinanciadorId,
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
        sucursalId: sucursalData?.ID,
        zonaId: zonaTarifarioId || undefined,
        zonaTarifarioId: zonaTarifarioId || undefined,
        zonaFinanciadorId: zonaFinanciadorId || undefined
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
        
        setPresupuestoIdActual(presupuestoCompleto.idPresupuestos)
        setNombre(presupuestoCompleto.Nombre_Apellido)
        setDni(presupuestoCompleto.DNI)
        setFechaNacimiento(presupuestoCompleto.fecha_nacimiento || '')
        setNumeroAfiliado(presupuestoCompleto.numero_afiliado || '')
        setContactoNombre(presupuestoCompleto.contacto_nombre || '')
        setContactoTelefono(presupuestoCompleto.contacto_telefono || '')
        setDiagnosticoMedico(presupuestoCompleto.diagnostico_medico || '')
        setDomicilio(presupuestoCompleto.domicilio || '')
        setLocalidad(presupuestoCompleto.localidad || '')
        setSucursal(presupuestoCompleto.Sucursal)
        setSucursalId(sucursalData?.ID || null)
        setZonaTarifarioId(presupuestoCompleto.zona_tarifario_id || null)
        onZonaTarifarioIdChange?.(presupuestoCompleto.zona_tarifario_id || null)
        setZonaFinanciadorId(presupuestoCompleto.zona_financiador_id || null)
        onZonaFinanciadorIdChange?.(presupuestoCompleto.zona_financiador_id || null)
        setDificilAcceso(presupuestoCompleto.dificil_acceso === 'si')
        if (presupuestoCompleto.financiador_id) {
          setFinanciadorId(presupuestoCompleto.financiador_id.toString())
          onFinanciadorIdChange?.(presupuestoCompleto.financiador_id.toString())
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
            zonaId: presupuestoCompleto.zona_tarifario_id,
            zonaTarifarioId: presupuestoCompleto.zona_tarifario_id,
            zonaFinanciadorId: presupuestoCompleto.zona_financiador_id
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

  const guardarDatosPaciente = async () => {
    if (!presupuestoIdActual) return

    try {
      await api.put(`/presupuestos/${presupuestoIdActual}/datos-paciente`, {
        fecha_nacimiento: fechaNacimiento || null,
        numero_afiliado: numeroAfiliado || null,
        contacto_nombre: contactoNombre || null,
        contacto_telefono: contactoTelefono || null,
        diagnostico_medico: diagnosticoMedico || null,
        domicilio: domicilio || null,
        localidad: localidad || null
      })
    } catch (error) {
      console.error('Error guardando datos del paciente:', error)
    }
  }

  const nuevoPresupuesto = () => {
    setNombre('')
    setDni('')
    setFechaNacimiento('')
    setNumeroAfiliado('')
    setContactoNombre('')
    setContactoTelefono('')
    setDiagnosticoMedico('')
    setDomicilio('')
    setLocalidad('')
    setFinanciadorId(null)
    onFinanciadorIdChange?.(null)
    setZonaFinanciadorId(null)
    onZonaFinanciadorIdChange?.(null)
    setZonaTarifarioId(null)
    onZonaTarifarioIdChange?.(null)
    setZonasFinanciador([])
    setDificilAcceso(false)
    setPresupuestoCreado(false)
    setPresupuestoIdActual(null)
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
      
      <Stack gap="md" maw={800} mx="auto">
        
        <Title order={5} c="dimmed">Paciente</Title>
        
        <Group grow>
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
        </Group>
        
        <Group grow>
          <TextInput
            label="Fecha de Nacimiento"
            type="date"
            value={fechaNacimiento}
            onChange={(e) => {
              setFechaNacimiento(e.target.value)
              if (presupuestoCreado) guardarDatosPaciente()
            }}
            onBlur={guardarDatosPaciente}
            disabled={presupuestoCreado || soloLectura}
            variant={(presupuestoCreado || soloLectura) ? "filled" : "default"}
            required
          />
          <TextInput
            label="Número de Afiliado"
            value={numeroAfiliado}
            onChange={(e) => {
              setNumeroAfiliado(e.target.value)
            }}
            onBlur={guardarDatosPaciente}
            disabled={presupuestoCreado || soloLectura}
            variant={(presupuestoCreado || soloLectura) ? "filled" : "default"}
            required
          />
        </Group>
        
        <Group grow>
          <TextInput
            label="Domicilio"
            value={domicilio}
            onChange={(e) => setDomicilio(e.target.value)}
            onBlur={guardarDatosPaciente}
            disabled={presupuestoCreado || soloLectura}
            variant={(presupuestoCreado || soloLectura) ? "filled" : "default"}
          />
          <TextInput
            label="Localidad"
            value={localidad}
            onChange={(e) => setLocalidad(e.target.value)}
            onBlur={guardarDatosPaciente}
            disabled={presupuestoCreado || soloLectura}
            variant={(presupuestoCreado || soloLectura) ? "filled" : "default"}
          />
        </Group>
        
        <Group grow>
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
              setZonaTarifarioId(null)
              setZonaFinanciadorId(null)
            }}
            placeholder="Seleccione una sucursal"
            required
            disabled={presupuestoCreado || esCargaHistorial || soloLectura}
            variant={(presupuestoCreado || esCargaHistorial || soloLectura) ? "filled" : "default"}
            searchable
            checkIconPosition="right"
          />
          <Select
            label="Zona Tarifario"
            data={zonasTarifario.map(z => ({
              value: z.id.toString(),
              label: z.nombre + (z.es_zona_principal === 1 ? ' (Principal)' : '')
            }))}
            value={zonaTarifarioId !== null ? zonaTarifarioId.toString() : null}
            onChange={(value) => {
              const val = value ? parseInt(value) : null
              setZonaTarifarioId(val)
              onZonaTarifarioIdChange?.(val)
            }}
            placeholder={!sucursalId ? "Seleccione primero una sucursal" : loadingZonasTarifario ? "Cargando zonas..." : "Seleccione una zona"}
            disabled={!sucursalId || presupuestoCreado || soloLectura || loadingZonasTarifario}
            variant={(presupuestoCreado || soloLectura) ? "filled" : "default"}
            required
          />
        </Group>
        
        <Group grow>
          <Select
            label="Financiador"
            data={financiadores.map(f => ({
              value: f.id.toString(),
              label: f.activo === 1 ? f.Financiador : `${f.Financiador} (Consultar estado con cobranzas)`,
              disabled: f.activo === 0
            }))}
            value={financiadorId}
            onChange={async (value) => {
              setZonaFinanciadorId(null)
              onZonaFinanciadorIdChange?.(null)
              setFinanciadorId(value)
              onFinanciadorIdChange?.(value)
              
              if (esCargaHistorial && presupuestoCreado && value) {
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
                      sucursalId: sucursalId || undefined,
                      zonaId: zonaTarifarioId || undefined,
                      zonaTarifarioId: zonaTarifarioId || undefined,
                      zonaFinanciadorId: zonaFinanciadorId || undefined
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
          <Select
            label="Zona Financiador"
            data={zonasFinanciador.map(z => ({
              value: z.id.toString(),
              label: z.nombre
            }))}
            value={zonaFinanciadorId !== null ? zonaFinanciadorId.toString() : null}
            onChange={(value) => {
              const val = value ? parseInt(value) : null
              setZonaFinanciadorId(val)
              onZonaFinanciadorIdChange?.(val)
            }}
            placeholder={!financiadorId ? "Seleccione primero un financiador" : loadingZonasFinanciador ? "Cargando zonas..." : "Seleccione una zona"}
            disabled={!financiadorId || presupuestoCreado || soloLectura || loadingZonasFinanciador}
            variant={(presupuestoCreado || soloLectura) ? "filled" : "default"}
            required
          />
        </Group>
        
        {esCargaHistorial && !financiadorId && !soloLectura && (
          <Paper p="xs" withBorder style={{ backgroundColor: '#fff3cd' }}>
            <Text size="sm" c="orange">
              ⚠️ Este presupuesto no tiene financiador asignado. Seleccione uno para continuar.
            </Text>
          </Paper>
        )}
        
        <Checkbox
          label={`Zona Desfavorable${financiadorInfo?.porcentaje_dificil_acceso ? ` (+${financiadorInfo.porcentaje_dificil_acceso}%)` : ''}`}
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
