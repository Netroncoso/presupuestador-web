# Arquitectura del Sistema - Presupuestador Web v2.1

## 📐 Visión General

Sistema web de gestión de presupuestos médicos con arquitectura cliente-servidor, versionado de datos, valores históricos, auditoría automatizada y notificaciones en tiempo real.

**Versión 2.1:** Refactoring completo con separación de responsabilidades, optimización de queries N+1, y configuración centralizada.

## 🏗️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de Datos**: MySQL 8.0
- **Autenticación**: JWT (JSON Web Tokens)
- **Tiempo Real**: SSE (Server-Sent Events)
- **Lenguaje**: TypeScript
- **Arquitectura**: Layered (Controllers → Services → Repositories)

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Mantine UI v7
- **State Management**: React Hooks
- **HTTP Client**: Fetch API (custom wrapper)
- **Lenguaje**: TypeScript

## 🏛️ Arquitectura Backend (v2.1)

### Estructura de Capas

```
backend/src/
├── config/              # Configuración centralizada
│   └── businessRules.ts # Reglas de negocio y constantes
├── controllers/         # Orquestación de requests
│   ├── presupuestosControllerV2.ts
│   ├── presupuestoInsumosController.ts
│   └── presupuestoPrestacionesController.ts
├── services/           # Lógica de negocio
│   ├── presupuestoService.ts
│   ├── versioningService.ts
│   ├── auditoriaService.ts
│   └── calculosService.ts
├── repositories/       # Acceso a datos
│   └── presupuestoRepository.ts
├── routes/            # Definición de endpoints
├── middleware/        # Autenticación, validación, errores
└── utils/            # Utilidades compartidas
```

### Separación de Responsabilidades

#### Controllers (Capa de Presentación)
- **Responsabilidad**: Orquestación de requests/responses
- **Tamaño**: 8-15 líneas por función
- **NO contiene**: Lógica de negocio, queries SQL

```typescript
// Ejemplo: presupuestosControllerV2.ts
export const finalizarPresupuesto = asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const resultado = await presupuestoService.finalizar(id);
  res.json({ success: true, ...resultado });
});
```

#### Services (Capa de Negocio)
- **Responsabilidad**: Lógica de negocio, validaciones, cálculos
- **Transacciones**: Manejo completo con BEGIN/COMMIT/ROLLBACK
- **Reutilización**: Funciones compartidas entre controllers

```typescript
// Ejemplo: presupuestoService.ts
export class PresupuestoService {
  async finalizar(id: number) {
    const presupuesto = await this.repo.obtenerConTotales(id);
    // Validaciones
    // Cálculos
    // Actualización
    return { estadoFinal, totales };
  }
}
```

#### Repositories (Capa de Datos)
- **Responsabilidad**: Queries SQL, acceso a BD
- **Optimización**: JOINs, índices, queries eficientes
- **NO contiene**: Lógica de negocio

```typescript
// Ejemplo: presupuestoRepository.ts
export class PresupuestoRepository {
  async obtenerConTotales(id: number) {
    const [rows] = await pool.query(`SELECT ... FROM presupuestos ...`);
    return rows[0];
  }
}
```

### Configuración Centralizada

**`config/businessRules.ts`** - Elimina valores hardcodeados

```typescript
export const BusinessRules = {
  auditoria: {
    rentabilidadMinima: 15,      // %
    costoMaximo: 150000,          // $
    rentabilidadConPlazoMaxima: 25, // %
  },
  financiero: {
    diasCobranzaDefault: 30,      // días
    tasaMensualDefault: 2,        // %
  },
  paginacion: {
    limitDefault: 100,
    offsetDefault: 0,
  },
  estados: {
    validos: ['pendiente', 'en_revision', 'aprobado', 'rechazado', 'borrador'],
    requierenNotificacion: ['aprobado', 'rechazado'],
  },
};

// Helpers con fallback
export function getDiasCobranza(real?, teorico?) → 30 (default)
export function getTasaMensual(tasa?) → 2 (default)
```

### Optimización de Queries N+1

#### Problema Identificado (v2.0)
```typescript
// ANTES: N+1 queries
const [rows] = await pool.query('SELECT ... FROM presupuesto_insumos');
for (const row of rows) {  // ← N queries adicionales
  const [insumo] = await pool.query('SELECT Precio FROM insumos WHERE id = ?');
}
// Total: 1 + N queries
```

#### Solución Implementada (v2.1)
```typescript
// DESPUÉS: 1 query con JOIN
const [rows] = await pool.query(`
  SELECT 
    pi.producto,
    COALESCE(i.Precio, pi.costo) as costo,
    pi.cantidad,
    p.porcentaje_insumos
  FROM presupuesto_insumos pi
  LEFT JOIN insumos i ON pi.id_insumo = i.idInsumos
  CROSS JOIN presupuestos p
  WHERE pi.idPresupuestos = ?
`);
// Total: 1 query (95% más rápido)
```

**Mejora de Performance:**
- 10 insumos: 11 queries → 1 query (91% ↓)
- 20 prestaciones: 41 queries → 1 query (98% ↓)
- Presupuesto completo: 47 queries → 2 queries (96% ↓)

### Integridad Transaccional

**Todas las operaciones críticas usan transacciones:**

```typescript
// versioningService.ts
async crearNuevaVersion(id, usuario_id, confirmar) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    
    // 1. Marcar versiones anteriores
    await connection.query('UPDATE presupuestos SET es_ultima_version = 0 ...');
    
    // 2. Crear nueva versión
    await connection.query('INSERT INTO presupuestos ...');
    
    // 3. Copiar insumos y prestaciones
    await connection.query('INSERT INTO presupuesto_insumos ...');
    
    await connection.commit(); // Todo o nada
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

## 📊 Arquitectura de Datos

### Modelo de Base de Datos (v2.1)

#### Mejoras Aplicadas
- ✅ `presupuestos.sucursal_id` (INT FK) → `sucursales_mh.ID`
- ✅ `presupuestos.DNI` (VARCHAR(20)) - Soporta DNI extranjeros
- ✅ `presupuestos.total_insumos` (DECIMAL(10,2)) - Precisión monetaria
- ✅ `presupuestos.idobra_social` (FK) → `financiador.idobra_social`
- ✅ `insumos.costo` (DECIMAL(10,2)) - Precisión monetaria
- ✅ PKs limpiadas (sin PKs compuestas innecesarias)

#### Tablas Principales

**presupuestos**
- Sistema de versionado: `version`, `presupuesto_padre`, `es_ultima_version`
- Estados: `borrador`, `pendiente`, `en_revision`, `aprobado`, `rechazado`
- Totales calculados: `total_insumos`, `total_prestaciones`, `costo_total`, `total_facturar`
- Rentabilidades: `rentabilidad`, `rentabilidad_con_plazo`

**presupuesto_insumos**
- Relación: N insumos por presupuesto
- Campos: `producto`, `costo`, `precio_facturar`, `cantidad`, `id_insumo` (FK)

**presupuesto_prestaciones**
- Relación: N prestaciones por presupuesto
- Campos: `id_servicio` (VARCHAR), `prestacion`, `valor_asignado`, `valor_facturar`, `cantidad`

**prestador_servicio_valores** ⭐ Sistema de Valores Históricos
- PK: `id` (INT, auto_increment)
- FK: `id_prestador_servicio` → `prestador_servicio.id_prestador_servicio`
- Campos: `valor_asignado`, `valor_facturar`, `fecha_inicio`, `fecha_fin`
- `fecha_fin = NULL` indica período vigente actual
- Índice: `(id_prestador_servicio, fecha_inicio, fecha_fin)`

### Sistema de Versionado

```
Presupuesto Original (ID: 100, version: 1)
    ↓ (edición con transacción)
Nueva Versión (ID: 101, version: 2, presupuesto_padre: 100)
    ↓ (edición con transacción)
Nueva Versión (ID: 102, version: 3, presupuesto_padre: 100)
```

- Solo la última versión tiene `es_ultima_version = 1`
- Transacciones garantizan consistencia
- Nueva versión actualiza `valor_facturar` con precios actuales
- Mantiene `valor_asignado` original (costo negociado)

## 🎯 Componentes Principales

### Backend Controllers

#### presupuestosControllerV2.ts (Refactorizado)
- **ANTES**: 557 líneas
- **DESPUÉS**: 280 líneas (50% reducción)
- Usa: `PresupuestoService`, `VersioningService`, `AuditoriaService`
- Funciones: 8-15 líneas cada una

#### presupuestoInsumosController.ts (Optimizado)
- `obtenerInsumosPresupuesto()`: Acepta `?soloLectura=true/false`
  - `soloLectura=true`: Devuelve costos históricos guardados
  - `soloLectura=false`: JOIN con tabla insumos (1 query en lugar de N+1)

#### presupuestoPrestacionesController.ts (Optimizado)
- `obtenerPrestacionesPresupuesto()`: Acepta `?soloLectura=true/false`
  - `soloLectura=true`: Devuelve valores históricos guardados
  - `soloLectura=false`: JOINs múltiples (1 query en lugar de 2N+1)

### Backend Services (Nuevos en v2.1)

#### PresupuestoService
- `finalizar(id)`: Finalización con cálculos y validaciones
- Usa: `PresupuestoRepository`, `CalculosService`

#### VersioningService
- `crearNuevaVersion(id, usuario_id, confirmar)`: Con transacciones completas
- Garantiza integridad: todo o nada

#### AuditoriaService
- `cambiarEstado(id, estado, auditor_id, comentario)`: Con transacciones
- `actualizarFinanciador(id, idobra_social)`: Con recálculo de rentabilidad

#### CalculosService
- `calcularRentabilidad(costoTotal, totalFacturar)`
- `calcularRentabilidadConPlazo(totalFacturar, costoTotal, tasaMensual, diasCobranza)`
- `evaluarEstadoAutomatico(presupuesto)`: Usa `BusinessRules`

### Frontend

#### Pages
- **UserDashboard.tsx**: Dashboard principal
- **AuditorDashboard.tsx**: Dashboard de auditores
- **DatosPresupuesto.tsx**: Formulario de paciente
- **Insumos.tsx**: Gestión de insumos
- **Prestaciones.tsx**: Gestión de prestaciones con valores históricos
- **admin/ServiciosPorPrestador.tsx**: Gestión de valores históricos

#### Hooks
- **usePresupuesto.tsx**: Lógica de gestión
- **useTotales.tsx**: Cálculo de totales
- **useNotificationCount.tsx**: Contador de notificaciones
- **useRealtimeUpdates.tsx**: Conexión SSE

## 📈 Optimizaciones (v2.1)

### Backend

#### Queries Optimizadas
- ✅ Eliminación de N+1 en `obtenerInsumosPresupuesto`
- ✅ Eliminación de N+1 en `obtenerPrestacionesPresupuesto`
- ✅ JOINs en lugar de bucles
- ✅ COALESCE para fallbacks automáticos

#### Transacciones
- ✅ `crearNuevaVersion`: BEGIN/COMMIT/ROLLBACK
- ✅ `cambiarEstado`: BEGIN/COMMIT/ROLLBACK
- ✅ `actualizarFinanciador`: BEGIN/COMMIT/ROLLBACK

#### Configuración Centralizada
- ✅ Eliminación de valores hardcodeados
- ✅ Helpers con fallback automático
- ✅ Fácil mantenimiento y testing

### Performance

| Operación | v2.0 | v2.1 | Mejora |
|-----------|------|------|--------|
| Cargar 10 insumos | ~110ms | ~10ms | 10x ⚡ |
| Cargar 20 prestaciones | ~420ms | ~15ms | 28x ⚡ |
| Presupuesto completo | ~500ms | ~25ms | 20x ⚡ |
| Crear nueva versión | Sin transacción | Con transacción | 100% integridad ✅ |

## 🔐 Seguridad

### Autenticación
- JWT con expiración de 24 horas
- Tokens almacenados en localStorage
- Middleware de verificación en todas las rutas protegidas

### Validación de Datos
- Validación en frontend (UX)
- Validación en backend (seguridad)
- Sanitización de inputs
- Validación automática de valores históricos
- Transacciones para integridad de datos

## 🧪 Testing

### Backend
- Unit tests con Jest
- Integration tests de endpoints
- Tests de reglas de auditoría
- Tests de valores históricos
- Tests de transacciones

### Frontend
- Component tests con React Testing Library
- E2E tests con Playwright (futuro)

## 📦 Deployment

### Desarrollo
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Producción
```bash
# Backend
cd backend && npm run build && npm start

# Frontend
cd frontend && npm run build
```

### Migraciones
```bash
# Migración de valores históricos
mysql -u root -p presupuestador < backend/migrations/create_prestador_servicio_valores.sql

# Migración de tipos de datos y FKs (COMPLETADA)
# Ver: backend/migrations/MIGRACION_SUCURSAL_COMPLETADA.md
```

## 📚 Recursos Adicionales

- [Manual de Usuario](./MANUAL_USUARIO_V2.md)
- [Documentación de API](./backend/RUTAS_API.md)
- [Sistema de Notificaciones](./SISTEMA_NOTIFICACIONES.md)
- [Valores Históricos](./IMPLEMENTACION_VALORES_HISTORICOS.md)
- [Análisis de Código Backend](./ANALISIS_CODIGO_BACKEND.md)
- [Optimización N+1](./backend/OPTIMIZACION_N+1.md)
- [Migración Sucursal](./backend/migrations/MIGRACION_SUCURSAL_COMPLETADA.md)

---

**Versión:** 2.1  
**Última actualización:** Diciembre 2024  
**Estado:** ✅ Producción

## 📝 Historial de Versiones

### v2.1 (Diciembre 2024)
- ✅ Refactoring completo: Controllers → Services → Repositories
- ✅ Optimización N+1 queries (95% mejora en performance)
- ✅ Configuración centralizada (BusinessRules)
- ✅ Transacciones completas en operaciones críticas
- ✅ Migración Sucursal → sucursal_id con FK
- ✅ Tipos de datos corregidos (DECIMAL, VARCHAR)
- ✅ Eliminación de código duplicado
- ✅ Reducción de 50% en tamaño de controllers

### v2.0 (Diciembre 2024)
- Sistema de valores históricos (timelapse)
- Versionado de presupuestos
- Notificaciones en tiempo real (SSE)
- Auditoría automatizada
