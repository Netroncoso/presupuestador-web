# Sistema de Alertas Inteligentes con Diferenciación de Unidades

## Resumen de Implementación

Se implementó un sistema de alertas mejorado y refactorizado que:
- Diferencia entre tipos de unidades (horas, sesiones, consultas, días)
- Separa lógica de negocio de componentes visuales
- Centraliza configuración de umbrales
- Proporciona alertas precisas para auditoría

**Versión**: 2.0 (Refactorizada)
**Última actualización**: 2024
**Reducción de código**: 80% en hook principal (300 → 60 líneas)

## Cambios en Base de Datos

### Tabla `servicios`
Se agregaron dos nuevas columnas:

```sql
tipo_unidad ENUM('horas', 'sesiones', 'consultas', 'días', 'unidades') DEFAULT 'horas'
max_unidades_sugerido INT DEFAULT NULL
```

**Migración**: `backend/migrations/add_tipo_unidad_to_servicios.sql`

### Optimizaciones de Base de Datos
- ✅ Connection pooling (10 conexiones máximo)
- ✅ Transacciones para operaciones complejas
- ✅ Queries paralelas con Promise.all
- ✅ Paginación en listados (límite 100 por defecto)

## Cambios en Backend

### Arquitectura Backend

```
Request → Middleware → Controller → Database
            ↓              ↓
         (Auth)      (asyncHandler)
         (CSRF)      (AppError)
         (Logger)
```

### `prestacionesController.ts`
- Query actualizado para incluir `tipo_unidad` y `max_unidades_sugerido` desde tabla `servicios`
- Estos campos se heredan automáticamente en `prestador_servicio` mediante JOIN
- Usa `asyncHandler` para manejo automático de errores

### `adminServiciosCrudController.ts`
- GET: Retorna `tipo_unidad` y `max_unidades_sugerido`
- POST: Crea servicios con tipo_unidad (default: 'horas') y max_unidades_sugerido
- PUT: Actualiza tipo_unidad y max_unidades_sugerido
- Validaciones centralizadas con `AppError`

### Seguridad Implementada
- ✅ Protección CSRF en todas las rutas POST/PUT/DELETE
- ✅ Autenticación JWT
- ✅ Validación de entrada
- ✅ Logging sanitizado
- ✅ Queries parametrizadas (prevención SQL injection)

## Cambios en Frontend

### Arquitectura Refactorizada

```
frontend/src/
├── types/
│   └── index.ts                    # Tipos compartidos (Prestacion, FinanciadorInfo)
├── utils/
│   └── constants.ts                # Umbrales configurables
├── services/
│   └── alertaService.ts            # Lógica pura de evaluación
├── components/alerts/
│   ├── RentabilidadAlert.tsx       # Componente visual
│   ├── MontoAlert.tsx
│   ├── FinanciadorAlerts.tsx
│   └── PrestacionExcedidaAlert.tsx
└── hooks/
    └── useAlertaCotizador.tsx      # Orquestación (60 líneas)
```

### Panel de Administración (`GestionServicios.tsx`)
- ✅ Select "Tipo de Unidad" en modal de crear/editar servicio
- ✅ NumberInput "Máximo Sugerido" (opcional)
- ✅ Gestión completa desde interfaz de administración

### Tipos Compartidos (`types/index.ts`)

```typescript
export interface Prestacion {
  id_servicio: number;
  prestacion: string;
  cantidad: number;
  valor_asignado: number;
  valor_facturar?: number;
  tipo_unidad?: string;      // Tipo de unidad
  cant_total?: number;       // Máximo sugerido
}

export interface FinanciadorInfo {
  tasa_mensual?: number;
  dias_cobranza_teorico?: number;
  dias_cobranza_real?: number;
  acuerdo_nombre?: string | null;
  Financiador?: string;
  idobra_social?: string;
}
```

### Configuración de Umbrales (`utils/constants.ts`)

**Umbrales de Rentabilidad**:
```typescript
export const RENTABILIDAD_THRESHOLDS = {
  DESAPROBADO: 0,        // < 0% → Rojo
  MEJORAR: 1,            // 1-35% → Naranja
  AUTORIZADO_MEJORA: 35, // 35-40% → Amarillo
  AUTORIZADO: 40,        // 40-50% → Azul
  FELICITACIONES: 50,    // 50-60% → Verde
  SUPER_RENTABLE: 60,    // 60-70% → Teal
  EXCEPCIONAL: 70,       // 70%+ → Violeta
} as const;
```

**Umbrales de Monto**:
```typescript
export const MONTO_THRESHOLDS = {
  ELEVADO: 1000000,  // $1M → Naranja
  CRITICO: 5000000,  // $5M → Rojo
} as const;
```

**Umbrales de Cobranza**:
```typescript
export const DIAS_COBRANZA_THRESHOLDS = {
  LENTO: 40,      // > 40 días → Amarillo
  EXTENDIDO: 60,  // > 60 días → Amarillo intenso
} as const;
```

### Servicio de Alertas (`services/alertaService.ts`)

**Funciones Puras de Evaluación**:

```typescript
export const evaluarRentabilidad = (rentabilidad: number): TipoAlertaRentabilidad => {
  if (rentabilidad < RENTABILIDAD_THRESHOLDS.DESAPROBADO) return 'DESAPROBADO';
  if (rentabilidad < RENTABILIDAD_THRESHOLDS.MEJORAR) return 'DESAPROBADO';
  if (rentabilidad < RENTABILIDAD_THRESHOLDS.AUTORIZADO_MEJORA) return 'MEJORAR';
  // ...
};

export const evaluarMonto = (totalFacturar: number): TipoAlertaMonto => {
  if (totalFacturar >= MONTO_THRESHOLDS.CRITICO) return 'CRITICO';
  if (totalFacturar >= MONTO_THRESHOLDS.ELEVADO) return 'ELEVADO';
  return null;
};

export const evaluarPrestacionesExcedidas = (prestaciones: Prestacion[]) => {
  return prestaciones.filter(p => p.cant_total && p.cantidad > p.cant_total);
};

export const evaluarFinanciador = (financiadorInfo?: FinanciadorInfo) => {
  // Retorna objeto con evaluaciones
};
```

### Componentes de Alertas

**RentabilidadAlert** (`components/alerts/RentabilidadAlert.tsx`):
```typescript
export const RentabilidadAlert = ({ tipo, rentabilidad, usandoPlazo }: Props) => {
  const config = CONFIG[tipo];
  return <Alert icon={...} title={...} color={...}>...</Alert>;
};
```

**PrestacionExcedidaAlert** (`components/alerts/PrestacionExcedidaAlert.tsx`):
```typescript
export const PrestacionExcedidaAlert = ({ prestacion }: Props) => {
  return (
    <Alert title="⚠️ CANTIDAD ELEVADA" color="orange">
      <strong>{prestacion.prestacion}: {prestacion.cantidad} {prestacion.tipo_unidad}</strong>
      (sugerido: {prestacion.cant_total})
    </Alert>
  );
};
```

### Hook Refactorizado (`hooks/useAlertaCotizador.tsx`)

**Antes**: 300+ líneas con JSX mezclado
**Después**: 60 líneas de orquestación

```typescript
export const useAlertaCotizador = (props: AlertaProps): React.ReactNode[] => {
  return useMemo(() => {
    const alertas: React.ReactNode[] = [];

    // Alerta de rentabilidad
    const tipoRentabilidad = evaluarRentabilidad(rentabilidad);
    alertas.push(<RentabilidadAlert tipo={tipoRentabilidad} ... />);

    // Alerta de monto
    const tipoMonto = evaluarMonto(totalFacturar);
    if (tipoMonto) alertas.push(<MontoAlert tipo={tipoMonto} ... />);

    // Alertas de financiador
    const evaluacion = evaluarFinanciador(financiadorInfo);
    if (evaluacion) alertas.push(<FinanciadorAlerts {...evaluacion} />);

    // Alertas de prestaciones excedidas
    const excedidas = evaluarPrestacionesExcedidas(prestacionesSeleccionadas);
    excedidas.forEach(p => alertas.push(<PrestacionExcedidaAlert prestacion={p} />));

    return alertas;
  }, [rentabilidad, totalFacturar, financiadorInfo, prestacionesSeleccionadas]);
};
```

## Ventajas del Sistema

### Funcionales
✅ **Precisión**: Diferencia horas de sesiones, consultas y días
✅ **Alertas específicas**: Por servicio individual cuando excede cant_total
✅ **Alertas acumuladas**: Por tipo de unidad para control global
✅ **Mejor auditoría**: Información más clara para toma de decisiones
✅ **Escalable**: Fácil agregar nuevos tipos de unidades al ENUM

### Arquitectura
✅ **Mantenible**: Lógica separada de UI (80% menos código en hook)
✅ **Testeable**: Funciones puras fáciles de testear
✅ **Configurable**: Umbrales centralizados en un solo archivo
✅ **Reutilizable**: Componentes de alertas independientes
✅ **Documentado**: Arquitectura clara y bien estructurada

## Flujo de Datos

```
┌─────────────┐
│  Servicios  │ → tipo_unidad, max_unidades_sugerido
└──────┬──────┘
       │ JOIN
       ↓
┌──────────────────┐
│ Prestador_Servicio│ → Hereda valores
└──────┬───────────┘
       │ API
       ↓
┌──────────────┐
│   Frontend   │ → Almacena en prestacionesSeleccionadas
└──────┬───────┘
       │
       ↓
┌─────────────────────┐
│ alertaService.ts    │ → Evalúa (lógica pura)
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ useAlertaCotizador  │ → Orquesta
└──────┬──────────────┘
       │
       ↓
┌─────────────────────┐
│ Componentes Alertas │ → Renderiza
└──────┬──────────────┘
       │
       ↓
┌─────────────────┐
│ UserDashboard   │ → Muestra al usuario
└─────────────────┘
```

## Gestión de Servicios

### Desde Panel de Administración
1. Ir a **Administración → Gestión de Servicios**
2. Crear/Editar servicio
3. Configurar:
   - **Tipo de Unidad**: horas/sesiones/consultas/días/unidades
   - **Máximo Sugerido**: Límite para alertas (opcional)

### Configuración Automática Inicial
La migración configuró automáticamente:
- Servicios con "sesion" o "terapia" → **sesiones**
- Servicios con "consulta" o "evaluacion" → **consultas**
- Servicios con "dia" o "internacion" → **días**
- Resto → **horas** (default)

## Ejemplos de Alertas Generadas

### Alerta de Rentabilidad
```
✅ AUTORIZADO
Rentabilidad: 45.5% - Presupuesto dentro de parámetros aceptables.
```

### Alerta de Monto
```
⚠️ MONTO ELEVADO - DAR AVISO
Monto a facturar: $1,250,000.00 - Se requiere revisión y aviso a las áreas correspondientes.
```

### Alerta de Prestación Excedida
```
⚠️ CANTIDAD ELEVADA
Kinesiología: 300 horas (sugerido: 200) - Cantidad superior a la recomendada.
```

### Alerta de Financiador
```
⏰ PLAZO DE COBRO EXTENDIDO
65 días de cobranza - Considera el impacto significativo en el flujo de caja.
```

## Configuración y Ajustes

### 1. Ajustar Umbrales de Alertas

**Archivo**: `frontend/src/utils/constants.ts`

```typescript
// Cambiar umbral de rentabilidad "AUTORIZADO" de 40% a 38%
export const RENTABILIDAD_THRESHOLDS = {
  AUTORIZADO_MEJORA: 35,
  AUTORIZADO: 38,  // ← Modificar aquí
  FELICITACIONES: 50,
};

// Cambiar alerta de monto de $1M a $2M
export const MONTO_THRESHOLDS = {
  ELEVADO: 2000000,  // ← Modificar aquí
  CRITICO: 5000000,
};
```

### 2. Gestionar Servicios

**Desde Panel Admin**:
1. Ir a **Administración → Gestión de Servicios**
2. Crear/Editar servicio
3. Configurar:
   - **Tipo de Unidad**: horas/sesiones/consultas/días/unidades
   - **Máximo Sugerido**: Límite para alertas (opcional)

### 3. Agregar Nueva Alerta

**Paso 1**: Agregar constante en `constants.ts`
```typescript
export const NUEVO_UMBRAL = 100000;
```

**Paso 2**: Agregar lógica en `services/alertaService.ts`
```typescript
export const evaluarNuevoUmbral = (valor: number) => {
  return valor > NUEVO_UMBRAL;
};
```

**Paso 3**: Crear componente en `components/alerts/NuevaAlert.tsx`
```typescript
export const NuevaAlert = ({ valor }: Props) => {
  return <Alert>...</Alert>;
};
```

**Paso 4**: Usar en `hooks/useAlertaCotizador.tsx`
```typescript
if (evaluarNuevoUmbral(valor)) {
  alertas.push(<NuevaAlert valor={valor} />);
}
```

### 4. Testing (Recomendado)

**Funciones puras testeables**:
- `utils/calculations.ts`
- `services/alertaService.ts`

```typescript
import { evaluarRentabilidad } from './alertaService';

test('evalúa rentabilidad correctamente', () => {
  expect(evaluarRentabilidad(45)).toBe('AUTORIZADO');
  expect(evaluarRentabilidad(25)).toBe('MEJORAR');
});
```

## Documentación Adicional

Para más detalles sobre arquitectura y configuración, consultar:
- **ARCHITECTURE.md**: Arquitectura completa del sistema
- **SECURITY.md**: Guía de seguridad
- **OPTIMIZATIONS.md**: Optimizaciones implementadas
