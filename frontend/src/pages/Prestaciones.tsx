import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Paper, Button, Title, Select, TextInput, Grid, Stack, Checkbox, Group, NumberInput, ActionIcon, Table, Badge, Text, Flex, Tooltip, Modal, Tabs } from '@mantine/core'
import { TrashIcon, PlusIcon, PencilSquareIcon, DocumentCheckIcon, DocumentCurrencyDollarIcon } from '@heroicons/react/24/outline'
import { notifications } from '@mantine/notifications'
import { getFinanciadores, getPrestacionesPorFinanciador, getFinanciadorZonas } from '../api/api'
import { api } from '../api/api'
import { numberFormat } from '../utils/numberFormat'
import PrestacionesTarifario from '../components/PrestacionesTarifario'
import SelectorDualServicios from '../components/SelectorDualServicios'
import { useSelectorDual } from '../hooks/useSelectorDual'
import type { ServicioFinanciador, ServicioTarifario, ZonaFinanciador, ServicioConvenio } from '../types'

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
  costo_1?: number
  costo_2?: number
  costo_3?: number
  costo_4?: number
  costo_5?: number
}

interface Financiador {
  id: string
  Financiador: string
  activo: number
}

interface Props {
  prestacionesSeleccionadas: Prestacion[]
  setPrestacionesSeleccionadas: (prestaciones: Prestacion[]) => void
  onTotalChange: (totalCosto: number, totalFacturar: number) => void
  presupuestoId: number | null
  financiadorId?: string | null
  soloLectura?: boolean
  sucursalId?: number | null
  zonaId?: number | null
  // Nuevos props para sistema dual
  zonaTarifarioId?: number | null
  zonaFinanciadorId?: number | null
}

export default function Prestaciones({ 
  prestacionesSeleccionadas, 
  setPrestacionesSeleccionadas, 
  onTotalChange, 
  presupuestoId, 
  financiadorId, 
  soloLectura = false, 
  sucursalId, 
  zonaId,
  zonaTarifarioId,
  zonaFinanciadorId
}: Props) {
  const [totalesTarifario, setTotalesTarifario] = useState({ costo: 0, facturar: 0 })
  const [financiadorInfo, setFinanciadorInfo] = useState<any>(null)

  // Cargar info del financiador
  useEffect(() => {
    if (financiadorId) {
      api.get(`/prestaciones/financiador/${financiadorId}/info`)
        .then(res => setFinanciadorInfo(res.data))
        .catch(err => console.error('Error cargando info financiador:', err));
    }
  }, [financiadorId]);

  // Hook para sistema dual
  const selectorDual = useSelectorDual({
    financiadorId,
    zonaFinanciadorId,
    zonaTarifarioId,
    presupuestoId
  })

  const cargadoRef = useRef(false);

  // Cargar prestaciones existentes al abrir presupuesto
  useEffect(() => {
    if (presupuestoId && !soloLectura && !cargadoRef.current) {
      cargadoRef.current = true;
      api.get(`/presupuestos/${presupuestoId}/prestaciones`)
        .then(res => {
          const prestaciones: ServicioConvenio[] = res.data.map((p: any) => ({
            id_servicio_financiador: p.id_financiador_servicio || p.servicio_id,
            servicio_id: p.servicio_id,
            nombre: p.prestacion,
            cantidad: p.cantidad,
            precio_costo: p.valor_asignado * p.cantidad,
            precio_facturar: p.valor_facturar * p.cantidad,
            utilidad: (p.valor_facturar - p.valor_asignado) * p.cantidad,
            aplicar_horas_nocturnas: p.aplicar_horas_nocturnas || false,
            clave_unica: `${p.id_financiador_servicio || p.servicio_id}_${p.aplicar_horas_nocturnas || false}_${p.id}`
          }));
          selectorDual.setServiciosConvenio(prestaciones);
        })
        .catch(err => console.error('Error cargando prestaciones:', err));
    }
  }, [presupuestoId, soloLectura]);

  // Totales incluyendo sistema dual
  const totalCosto = useMemo(() => 
    totalesTarifario.costo + selectorDual.totales.totalCosto, 
    [totalesTarifario.costo, selectorDual.totales.totalCosto]
  )
  
  const totalFacturar = useMemo(() => 
    totalesTarifario.facturar + selectorDual.totales.totalFacturar, 
    [totalesTarifario.facturar, selectorDual.totales.totalFacturar]
  )

  useEffect(() => {
    onTotalChange(totalCosto, totalFacturar)
  }, [totalCosto, totalFacturar, onTotalChange])

  return (
    <Stack gap="lg" mb={25}>
      {soloLectura && (
        <Paper p="xs" withBorder style={{ backgroundColor: '#e7f5ff' }}>
          <Text size="sm" c="blue" fw={500} ta="center">Modo solo lectura - No se pueden realizar modificaciones</Text>
        </Paper>
      )}

      {!financiadorId && (
        <Paper p="md" withBorder>
          <Text size="sm" c="dimmed" ta="center">
            Debe seleccionar un financiador en Datos del Paciente
          </Text>
        </Paper>
      )}

      <Tabs defaultValue="convenio">
        <Tabs.List grow>
          <Tabs.Tab value="convenio" leftSection={<DocumentCheckIcon style={{ width: 18, height: 18 }} />}>
            Con Convenio
          </Tabs.Tab>
          <Tabs.Tab value="tarifario" leftSection={<DocumentCurrencyDollarIcon style={{ width: 18, height: 18 }} />}>
            Por Presupuesto (Tarifario)
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="convenio" pt="md">
          {selectorDual.isReady ? (
            <SelectorDualServicios
              serviciosFinanciador={selectorDual.serviciosFinanciador}
              serviciosTarifario={selectorDual.serviciosTarifario}
              serviciosSeleccionados={selectorDual.serviciosConvenio}
              onServiciosChange={selectorDual.setServiciosConvenio}
              onAgregarServicio={selectorDual.agregarServicio}
              onEliminarServicio={selectorDual.eliminarServicio}
              soloLectura={soloLectura}
              loading={selectorDual.loading}
              error={selectorDual.error}
              financiadorInfo={financiadorInfo}
            />
          ) : (
            <Paper p="md" withBorder>
              <Text size="sm" c="dimmed" ta="center">
                {selectorDual.loading ? 'Cargando servicios...' :
                 selectorDual.error ? `Error: ${selectorDual.error}` :
                 !financiadorId ? 'Debe seleccionar un financiador' : 
                 !zonaFinanciadorId ? 'Debe seleccionar una zona financiador' :
                 !zonaTarifarioId ? 'Debe seleccionar una zona tarifario' :
                 'Complete los datos del paciente'}
              </Text>
            </Paper>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="tarifario" pt="md">
          {presupuestoId && zonaId ? (
            <PrestacionesTarifario
              presupuestoId={presupuestoId}
              zonaId={zonaId}
              soloLectura={soloLectura}
              onTotalChange={(costo, facturar) => setTotalesTarifario({ costo, facturar })}
            />
          ) : (
            <Paper p="md" withBorder>
              <Text size="sm" c="dimmed" ta="center">
                {!presupuestoId ? 'Debe crear un presupuesto primero' : 'Debe seleccionar una zona en Datos del Paciente'}
              </Text>
            </Paper>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  )
}