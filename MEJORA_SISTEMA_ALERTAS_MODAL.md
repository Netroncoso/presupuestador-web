# Mejora del Sistema de Alertas - Modal Interactivo

## Resumen Ejecutivo

Propuesta para mejorar la visualización de alertas del cotizador, transformando el sistema actual de componentes `<Alert>` estáticos en un **Modal interactivo** que se muestra al finalizar el presupuesto, con opción de consulta posterior mediante botón.

**Estado**: 📋 Pendiente de implementación  
**Prioridad**: Media  
**Complejidad**: Media-Baja  
**Tiempo estimado**: 4-6 horas

---

## Problema Actual

### Sistema Actual de Alertas

**Ubicación**: `UserDashboard.tsx` líneas 420-435

```tsx
{alertas.length > 0 && (
  <Paper shadow="xs" p="md" radius="md" withBorder mt="xs" 
         onClick={() => setAlertasAbiertas(!alertasAbiertas)} 
         style={{ cursor: 'pointer' }}>
    <Group justify="space-between" mb={alertasAbiertas ? 12 : 0}>
      <Group gap="xs">
        <ShieldExclamationIcon color="red" style={ICON_SIZE} />
        <Text fw={400} size="md" color="red">Alertas Disponibles</Text>
      </Group>
      <ActionIcon variant="subtle">
        {alertasAbiertas ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </ActionIcon>
    </Group>
    <Collapse in={alertasAbiertas}>
      <SimpleGrid cols={2}>
        {alertas}
      </SimpleGrid>
    </Collapse>
  </Paper>
)}
```

### Limitaciones

❌ **Fácil de ignorar**: Usuario puede colapsar y olvidar las alertas  
❌ **Poco visible**: Alertas críticas no destacan suficientemente  
❌ **Sin confirmación**: No hay garantía de que el usuario las leyó  
❌ **Ocupa espacio**: Panel siempre visible consume espacio en pantalla  
❌ **Difícil auditoría**: No hay registro de que el usuario vio las alertas

---

## Solución Propuesta

### Arquitectura de 3 Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                     UserDashboard.tsx                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  1. Modal de Alertas (Auto-apertura al finalizar)     │ │
│  │     - Se abre automáticamente después de finalizar    │ │
│  │     - Muestra todas las alertas en lista scrolleable  │ │
│  │     - Botón "Entendido" para cerrar                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  2. Botón "Ver Alertas" (Siempre visible)             │ │
│  │     - Badge con contador de alertas                   │ │
│  │     - Reabre el modal cuando el usuario quiera        │ │
│  │     - Ubicado en barra superior junto a totales       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  3. Notifications (Opcional - Alertas críticas)       │ │
│  │     - Toast en tiempo real para alertas CRÍTICAS      │ │
│  │     - Solo para: DESAPROBADO, MONTO CRÍTICO           │ │
│  │     - Posición: top-center                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementación Detallada

### Fase 1: Crear Componente ModalAlertas

**Archivo nuevo**: `frontend/src/components/ModalAlertas.tsx`

```tsx
import { Modal, Stack, Button, Text, Badge, Group, ScrollArea } from '@mantine/core';
import { ShieldExclamationIcon } from '@heroicons/react/24/solid';

interface ModalAlertasProps {
  opened: boolean;
  onClose: () => void;
  alertas: React.ReactNode[];
  clienteNombre?: string;
}

export const ModalAlertas = ({ 
  opened, 
  onClose, 
  alertas, 
  clienteNombre 
}: ModalAlertasProps) => {
  
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ShieldExclamationIcon style={{ width: 24, height: 24, color: 'red' }} />
          <Text fw={600} size="lg">Alertas del Presupuesto</Text>
          <Badge color="red" variant="filled">{alertas.length}</Badge>
        </Group>
      }
      size="lg"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="md">
        {clienteNombre && (
          <Text size="sm" c="dimmed">
            Paciente: <strong>{clienteNombre}</strong>
          </Text>
        )}
        
        <Text size="sm" fw={500}>
          Se detectaron {alertas.length} alerta{alertas.length !== 1 ? 's' : ''} 
          que requieren tu atención:
        </Text>

        <ScrollArea h={400} type="auto">
          <Stack gap="sm">
            {alertas}
          </Stack>
        </ScrollArea>

        <Button 
          fullWidth 
          onClick={onClose}
          color="blue"
          size="md"
        >
          Entendido
        </Button>
      </Stack>
    </Modal>
  );
};
```

**Características**:
- ✅ Modal centrado con overlay oscuro
- ✅ ScrollArea para muchas alertas (máx 400px altura)
- ✅ Badge con contador de alertas
- ✅ Muestra nombre del paciente
- ✅ Botón grande "Entendido" para cerrar

---

### Fase 2: Modificar UserDashboard.tsx

#### 2.1 Agregar Estado del Modal

```tsx
// Agregar después de línea 60
const [modalAlertasAbierto, setModalAlertasAbierto] = useState(false);
```

#### 2.2 Auto-abrir Modal al Finalizar Presupuesto

**Modificar función `ejecutarFinalizacion`** (línea ~130):

```tsx
const ejecutarFinalizacion = useCallback(async () => {
  try {
    const totales = {
      totalInsumos,
      totalPrestaciones,
      costoTotal,
      totalFacturar,
      rentabilidad,
      rentabilidadConPlazo
    };
    
    await finalizarPresupuesto(totales);
    setRecargarHistorial(prev => prev + 1);
    setValidacionCompletada(false);
    
    // 🆕 NUEVO: Abrir modal de alertas si existen
    if (alertas.length > 0) {
      setModalAlertasAbierto(true);
    }
    
    setTimeout(() => {
      handleNuevoPresupuesto();
    }, 2000);
  } catch (error) {
    console.error('Error al finalizar presupuesto:', error);
    setValidacionCompletada(false);
  }
}, [finalizarPresupuesto, totalInsumos, totalPrestaciones, costoTotal, 
    totalFacturar, rentabilidad, rentabilidadConPlazo, handleNuevoPresupuesto, 
    alertas.length]); // 🆕 Agregar alertas.length a dependencias
```

#### 2.3 Agregar Botón "Ver Alertas"

**Ubicación**: Después del Card de Rentabilidad (línea ~380)

```tsx
{/* Después del tercer Card de totales */}
{alertas.length > 0 && (
  <Card shadow="xs" padding="md" radius="md" withBorder>
    <Flex direction="column" gap="xs" align="center" justify="center">
      <Button
        variant="light"
        color="orange"
        size="sm"
        fullWidth
        onClick={() => setModalAlertasAbierto(true)}
        leftSection={<ShieldExclamationIcon style={{ width: 18, height: 18 }} />}
        rightSection={<Badge color="red" variant="filled">{alertas.length}</Badge>}
      >
        Ver Alertas
      </Button>
    </Flex>
  </Card>
)}
```

#### 2.4 Eliminar Panel Colapsable Actual

**ELIMINAR** líneas 420-435 (el Paper con Collapse actual)

#### 2.5 Agregar Componente Modal al Final

**Agregar antes del cierre de `</Container>`** (línea ~520):

```tsx
<ModalAlertas
  opened={modalAlertasAbierto}
  onClose={() => setModalAlertasAbierto(false)}
  alertas={alertas}
  clienteNombre={clienteNombre}
/>
```

---

### Fase 3: Notifications para Alertas Críticas (Opcional)

#### 3.1 Verificar Instalación de @mantine/notifications

```bash
cd frontend
npm list @mantine/notifications
```

Si no está instalado:
```bash
npm install @mantine/notifications
```

#### 3.2 Configurar NotificationsProvider

**Archivo**: `frontend/src/main.tsx` o `App.tsx`

```tsx
import { Notifications } from '@mantine/notifications';

// Dentro del MantineProvider
<MantineProvider>
  <Notifications position="top-center" zIndex={1000} />
  {/* resto de la app */}
</MantineProvider>
```

#### 3.3 Crear Hook para Alertas Críticas

**Archivo nuevo**: `frontend/src/hooks/useAlertasCriticas.tsx`

```tsx
import { useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { ExclamationCircleIcon, ShieldExclamationIcon } from '@heroicons/react/24/solid';
import { TipoAlertaRentabilidad, TipoAlertaMonto } from '../services/alertaService';

interface Props {
  tipoRentabilidad: TipoAlertaRentabilidad | null;
  tipoMonto: TipoAlertaMonto;
  rentabilidad: number;
  totalFacturar: number;
}

export const useAlertasCriticas = ({ 
  tipoRentabilidad, 
  tipoMonto, 
  rentabilidad, 
  totalFacturar 
}: Props) => {
  
  useEffect(() => {
    // Alerta crítica de rentabilidad DESAPROBADO
    if (tipoRentabilidad === 'DESAPROBADO') {
      notifications.show({
        id: 'rentabilidad-critica',
        title: '🚨 PRESUPUESTO DESAPROBADO',
        message: `Rentabilidad: ${rentabilidad.toFixed(2)}% - Este presupuesto no es viable`,
        color: 'red',
        icon: <ExclamationCircleIcon style={{ width: 20, height: 20 }} />,
        autoClose: false,
        withCloseButton: true,
      });
    }

    // Alerta crítica de monto
    if (tipoMonto === 'CRITICO') {
      notifications.show({
        id: 'monto-critico',
        title: '⚠️ MONTO CRÍTICO',
        message: `$${totalFacturar.toLocaleString('es-AR')} - Requiere gestión especial`,
        color: 'red',
        icon: <ShieldExclamationIcon style={{ width: 20, height: 20 }} />,
        autoClose: false,
        withCloseButton: true,
      });
    }

    // Cleanup: cerrar notificaciones al desmontar
    return () => {
      notifications.clean();
    };
  }, [tipoRentabilidad, tipoMonto, rentabilidad, totalFacturar]);
};
```

#### 3.4 Usar Hook en UserDashboard

```tsx
// Importar
import { useAlertasCriticas } from '../hooks/useAlertasCriticas';
import { evaluarRentabilidad, evaluarMonto } from '../services/alertaService';

// Dentro del componente, después de calcular alertas
const tipoRentabilidad = evaluarRentabilidad(rentabilidadFinal);
const tipoMonto = evaluarMonto(totalFacturar);

useAlertasCriticas({
  tipoRentabilidad,
  tipoMonto,
  rentabilidad: rentabilidadFinal,
  totalFacturar,
});
```

---

## Flujo de Usuario

### Escenario 1: Finalizar Presupuesto con Alertas

```
1. Usuario completa presupuesto
2. Click en "Finalizar Presupuesto"
3. Sistema valida items
4. Sistema guarda presupuesto
5. 🆕 Modal de alertas se abre automáticamente (centrado)
6. Usuario lee alertas (scroll si son muchas)
7. Usuario hace click en "Entendido"
8. Modal se cierra
9. Sistema resetea formulario (después de 2 segundos)
```

### Escenario 2: Consultar Alertas Durante Cotización

```
1. Usuario está cotizando
2. Ve botón "Ver Alertas" con badge (ej: "3")
3. Click en botón
4. Modal se abre mostrando alertas actuales
5. Usuario revisa y cierra
6. Continúa cotizando
```

### Escenario 3: Alerta Crítica en Tiempo Real (Opcional)

```
1. Usuario agrega prestación cara
2. Rentabilidad cae a -5% (DESAPROBADO)
3. 🆕 Toast rojo aparece en top-center
4. "🚨 PRESUPUESTO DESAPROBADO - Rentabilidad: -5%"
5. Usuario debe cerrar manualmente (X)
6. Toast desaparece pero alerta sigue en modal
```

---

## Tipos de Alertas y Severidad

### Clasificación por Criticidad

| Tipo | Severidad | Color | Notification Toast | Modal |
|------|-----------|-------|-------------------|-------|
| **DESAPROBADO** | 🔴 Crítica | red | ✅ Sí | ✅ Sí |
| **MONTO CRÍTICO** | 🔴 Crítica | red | ✅ Sí | ✅ Sí |
| **MEJORAR** | 🟠 Alta | orange | ❌ No | ✅ Sí |
| **MONTO ELEVADO** | 🟠 Alta | orange | ❌ No | ✅ Sí |
| **Sin Convenio** | 🟠 Alta | orange | ❌ No | ✅ Sí |
| **Cobranza Extendida** | 🟡 Media | yellow | ❌ No | ✅ Sí |
| **Prestación Excedida** | 🟡 Media | orange | ❌ No | ✅ Sí |
| **AUTORIZADO_MEJORA** | 🟡 Media | yellow | ❌ No | ✅ Sí |
| **AUTORIZADO** | 🔵 Info | blue | ❌ No | ✅ Sí |
| **FELICITACIONES** | 🟢 Positiva | green | ❌ No | ✅ Sí |
| **SUPER_RENTABLE** | 🟢 Positiva | teal | ❌ No | ✅ Sí |
| **EXCEPCIONAL** | 🟣 Positiva | violet | ❌ No | ✅ Sí |

---

## Lógica Actual de Alertas

### Hook useAlertaCotizador

**Archivo**: `frontend/src/hooks/useAlertaCotizador.tsx`

**Entrada**:
```typescript
interface AlertaProps {
  presupuestoId: number | null;
  clienteNombre: string;
  totalInsumos: number;
  totalPrestaciones: number;
  totalFacturar: number;
  rentabilidad: number;
  financiadorId: string | null;
  financiadorInfo?: FinanciadorInfo;
  prestacionesSeleccionadas?: Prestacion[];
}
```

**Salida**: `React.ReactNode[]` (array de componentes Alert)

**Proceso**:
1. Evalúa rentabilidad → `evaluarRentabilidad(rentabilidad)`
2. Evalúa monto → `evaluarMonto(totalFacturar)`
3. Evalúa financiador → `evaluarFinanciador(financiadorInfo)`
4. Evalúa prestaciones → `evaluarPrestacionesExcedidas(prestacionesSeleccionadas)`
5. Crea componentes Alert para cada caso
6. Retorna array de componentes

### Servicios de Evaluación

**Archivo**: `frontend/src/services/alertaService.ts`

**Funciones puras**:
- `evaluarRentabilidad(rentabilidad: number): TipoAlertaRentabilidad | null`
- `evaluarMonto(totalFacturar: number): TipoAlertaMonto`
- `evaluarPrestacionesExcedidas(prestaciones: Prestacion[]): Prestacion[]`
- `evaluarFinanciador(financiadorInfo?: FinanciadorInfo): object | null`

**Umbrales** (configurables en `utils/constants.ts`):
```typescript
RENTABILIDAD_THRESHOLDS = {
  DESAPROBADO: 0,
  MEJORAR: 10,
  AUTORIZADO_MEJORA: 35,
  AUTORIZADO: 40,
  FELICITACIONES: 50,
  SUPER_RENTABLE: 60,
  EXCEPCIONAL: 70,
}

MONTO_THRESHOLDS = {
  ELEVADO: 1000000,    // $1M
  CRITICO: 5000000,    // $5M
}

DIAS_COBRANZA_THRESHOLDS = {
  LENTO: 40,
  EXTENDIDO: 60,
}

TASA_MENSUAL_ALTA = 0.08  // 8%
```

---

## Componentes de Alertas Actuales

### 1. RentabilidadAlert
**Archivo**: `frontend/src/components/alerts/RentabilidadAlert.tsx`

**Props**:
```typescript
{
  tipo: TipoAlertaRentabilidad;
  rentabilidad: number;
  usandoPlazo: boolean;
}
```

**Tipos**: DESAPROBADO, MEJORAR, AUTORIZADO_MEJORA, AUTORIZADO, FELICITACIONES, SUPER_RENTABLE, EXCEPCIONAL

### 2. MontoAlert
**Archivo**: `frontend/src/components/alerts/MontoAlert.tsx`

**Props**:
```typescript
{
  tipo: TipoAlertaMonto;
  totalFacturar: number;
}
```

**Tipos**: ELEVADO, CRITICO

### 3. FinanciadorAlerts
**Archivo**: `frontend/src/components/alerts/FinanciadorAlerts.tsx`

**Props**:
```typescript
{
  requiereAutorizacion?: boolean;
  cobranzaExtendida?: boolean;
  cobranzaLenta?: boolean;
  tasaAlta?: boolean;
  convenioFirmado?: boolean;
  diasCobranza?: number;
  tasaMensual?: number;
}
```

**Alertas múltiples**: Puede mostrar 1-5 alertas simultáneas

### 4. PrestacionExcedidaAlert
**Archivo**: `frontend/src/components/alerts/PrestacionExcedidaAlert.tsx`

**Props**:
```typescript
{
  prestacion: Prestacion;
}
```

**Múltiples instancias**: Una por cada prestación que exceda `cant_total`

---

## Cambios en Archivos

### Archivos a Crear

1. ✅ `frontend/src/components/ModalAlertas.tsx` (nuevo)
2. ✅ `frontend/src/hooks/useAlertasCriticas.tsx` (nuevo, opcional)

### Archivos a Modificar

1. ✅ `frontend/src/pages/UserDashboard.tsx`
   - Agregar estado `modalAlertasAbierto`
   - Modificar `ejecutarFinalizacion` para abrir modal
   - Agregar botón "Ver Alertas" en Card de totales
   - Eliminar Paper con Collapse (líneas 420-435)
   - Agregar componente `<ModalAlertas>` al final

2. ✅ `frontend/src/main.tsx` o `App.tsx` (opcional, solo si se implementan Notifications)
   - Agregar `<Notifications />` en provider

### Archivos Sin Cambios

❌ `frontend/src/hooks/useAlertaCotizador.tsx` - Mantener igual  
❌ `frontend/src/services/alertaService.ts` - Mantener igual  
❌ `frontend/src/components/alerts/*.tsx` - Mantener igual  
❌ `frontend/src/utils/constants.ts` - Mantener igual

---

## Testing

### Casos de Prueba

#### Test 1: Modal se Abre al Finalizar
```
1. Crear presupuesto con rentabilidad < 10% (MEJORAR)
2. Finalizar presupuesto
3. ✅ Verificar que modal se abre automáticamente
4. ✅ Verificar que muestra alerta de rentabilidad
5. Click en "Entendido"
6. ✅ Verificar que modal se cierra
```

#### Test 2: Botón "Ver Alertas" Funciona
```
1. Crear presupuesto con monto > $1M
2. ✅ Verificar que botón "Ver Alertas" aparece con badge "1"
3. Click en botón
4. ✅ Verificar que modal se abre
5. ✅ Verificar que muestra alerta de monto
```

#### Test 3: Múltiples Alertas
```
1. Crear presupuesto con:
   - Rentabilidad < 10%
   - Monto > $1M
   - Financiador sin convenio
   - Prestación excedida
2. ✅ Verificar badge muestra "4+"
3. Abrir modal
4. ✅ Verificar que muestra las 4 alertas
5. ✅ Verificar scroll funciona si hay muchas
```

#### Test 4: Sin Alertas
```
1. Crear presupuesto con rentabilidad 45% y monto $50K
2. ✅ Verificar que NO aparece botón "Ver Alertas"
3. Finalizar presupuesto
4. ✅ Verificar que modal NO se abre
```

#### Test 5: Notifications Críticas (Opcional)
```
1. Crear presupuesto con rentabilidad -5%
2. ✅ Verificar que toast rojo aparece en top-center
3. ✅ Verificar mensaje "PRESUPUESTO DESAPROBADO"
4. Cerrar toast
5. ✅ Verificar que alerta sigue en modal
```

---

## Ventajas de la Solución

### UX/UI
✅ **Mayor visibilidad**: Modal centrado imposible de ignorar  
✅ **Confirmación explícita**: Usuario debe hacer click en "Entendido"  
✅ **Menos clutter**: No ocupa espacio permanente en pantalla  
✅ **Acceso rápido**: Botón siempre visible para consultar  
✅ **Mejor organización**: Todas las alertas en un solo lugar

### Técnico
✅ **Mínimos cambios**: Reutiliza componentes Alert actuales  
✅ **No breaking changes**: Lógica de evaluación sin cambios  
✅ **Escalable**: Fácil agregar nuevas alertas  
✅ **Testeable**: Comportamiento predecible

### Auditoría
✅ **Trazabilidad**: Se puede agregar log cuando usuario cierra modal  
✅ **Alertas críticas**: Notifications aseguran que usuario vea casos graves  
✅ **Historial**: Posibilidad futura de guardar qué alertas vio el usuario

---

## Desventajas y Consideraciones

### Posibles Inconvenientes
⚠️ **Más clicks**: Usuario debe cerrar modal (vs colapsar panel)  
⚠️ **Interrupción**: Modal bloquea flujo al finalizar  
⚠️ **Notifications molestas**: Si hay muchas alertas críticas

### Mitigaciones
✅ **Auto-cierre opcional**: Agregar timer de 10 segundos para cerrar automáticamente  
✅ **Configuración**: Permitir al usuario desactivar auto-apertura  
✅ **Filtro de criticidad**: Solo mostrar notifications para alertas CRÍTICAS

---

## Roadmap de Implementación

### Fase 1: MVP (2-3 horas)
- [x] Crear `ModalAlertas.tsx`
- [x] Modificar `UserDashboard.tsx` (estado + auto-apertura)
- [x] Agregar botón "Ver Alertas"
- [x] Eliminar panel colapsable actual
- [x] Testing básico

### Fase 2: Mejoras (1-2 horas)
- [ ] Agregar animaciones de entrada/salida
- [ ] Mejorar diseño visual del modal
- [ ] Agregar contador animado en badge
- [ ] Testing completo

### Fase 3: Notifications (1-2 horas, opcional)
- [ ] Instalar `@mantine/notifications`
- [ ] Configurar provider
- [ ] Crear `useAlertasCriticas.tsx`
- [ ] Integrar en `UserDashboard.tsx`
- [ ] Testing de notifications

### Fase 4: Avanzado (futuro)
- [ ] Guardar en BD cuando usuario cierra modal (auditoría)
- [ ] Configuración de usuario (activar/desactivar auto-apertura)
- [ ] Exportar alertas a PDF junto con presupuesto
- [ ] Dashboard de alertas históricas

---

## Configuración Futura

### Permitir Personalización

**Archivo**: `frontend/src/utils/constants.ts`

```typescript
// Agregar configuración de comportamiento de alertas
export const ALERTAS_CONFIG = {
  AUTO_ABRIR_MODAL: true,           // Abrir modal al finalizar
  MOSTRAR_NOTIFICATIONS: true,       // Mostrar toasts críticos
  AUTO_CERRAR_MODAL_SEGUNDOS: 0,    // 0 = manual, >0 = auto-cerrar
  SOLO_CRITICAS_EN_TOAST: true,     // Solo DESAPROBADO y CRITICO
} as const;
```

---

## Documentación Relacionada

- **ALERTAS_INTELIGENTES.md**: Sistema actual de alertas y umbrales
- **ARCHITECTURE_V2.md**: Arquitectura general del sistema
- **MANUAL_USUARIO_V2.md**: Manual de usuario (actualizar después de implementar)

---

## Notas de Implementación

### Orden de Ejecución
1. Crear `ModalAlertas.tsx` primero (componente independiente)
2. Modificar `UserDashboard.tsx` (integración)
3. Testing manual con diferentes escenarios
4. (Opcional) Implementar Notifications
5. Actualizar documentación de usuario

### Puntos de Atención
⚠️ **Dependencias de alertas**: El array `alertas` se recalcula en cada render, asegurar que `useMemo` funcione correctamente  
⚠️ **Timing de apertura**: Modal debe abrirse DESPUÉS de guardar presupuesto pero ANTES de resetear formulario  
⚠️ **Cleanup de notifications**: Limpiar toasts al desmontar componente para evitar duplicados

---

**Versión**: 1.0  
**Fecha**: Diciembre 2024  
**Autor**: Sistema de Presupuestador Web  
**Estado**: 📋 Documentación completa - Listo para implementar
