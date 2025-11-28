# Arquitectura del Sistema - Presupuestador Web v2.0

## 📐 Visión General

Sistema web de gestión de presupuestos médicos con arquitectura cliente-servidor, versionado de datos, valores históricos, auditoría automatizada y notificaciones en tiempo real.

## 🏗️ Stack Tecnológico

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de Datos**: MySQL 8.0
- **Autenticación**: JWT (JSON Web Tokens)
- **Tiempo Real**: SSE (Server-Sent Events)
- **Lenguaje**: TypeScript

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Mantine UI v7
- **State Management**: React Hooks
- **HTTP Client**: Fetch API (custom wrapper)
- **Lenguaje**: TypeScript

## 📊 Arquitectura de Datos

### Modelo de Base de Datos

#### Tablas Principales

**presupuestos**
- Almacena información de presupuestos
- Campos clave: `idPresupuestos`, `version`, `presupuesto_padre`, `es_ultima_version`
- Sistema de versionado: cada edición crea nueva versión
- Estados: `borrador`, `pendiente`, `en_revision`, `aprobado`, `rechazado`

**presupuesto_insumos**
- Insumos asociados a cada presupuesto
- Relación: N insumos por presupuesto
- Campos: `producto`, `costo`, `precio_facturar`, `cantidad`

**presupuesto_prestaciones**
- Prestaciones médicas del presupuesto
- Relación: N prestaciones por presupuesto
- Campos: `id_servicio` (VARCHAR), `prestacion`, `valor_asignado`, `valor_facturar`, `cantidad`
- **Nota**: `id_servicio` es VARCHAR, NO es FK a `prestador_servicio`
- **Nota**: `valor_asignado` es el costo negociado, `valor_facturar` es el precio al financiador

**prestador_servicio**
- Servicios ofrecidos por prestadores/financiadores
- **PK**: `id_prestador_servicio` (INT, auto_increment)
- **FK**: `idobra_social` → `financiador.idobra_social`
- **FK**: `id_servicio` → `servicios.id_servicio`
- Campos: `valor_facturar`, `valor_sugerido`, `cant_total`, `activo`
- Campos no usados: `total_mes`, `condicion`

**prestador_servicio_valores** ⭐ NUEVO
- Valores históricos de servicios por períodos de vigencia
- **PK**: `id` (INT, auto_increment)
- **FK**: `id_prestador_servicio` → `prestador_servicio.id_prestador_servicio`
- Campos: `valor_asignado`, `valor_facturar`, `fecha_inicio`, `fecha_fin`
- `fecha_fin = NULL` indica período vigente actual
- Índice: `(id_prestador_servicio, fecha_inicio, fecha_fin)`

**financiador**
- Información de obras sociales/financiadores
- Campos: `idobra_social`, `Financiador`, `tasa_mensual`, `dias_cobranza_real`, `dias_cobranza_teorico`

**notificaciones**
- Sistema de notificaciones en tiempo real
- Tipos: `pendiente`, `aprobado`, `rechazado`
- Estados: `nuevo`, `leido`

**auditorias_presupuestos**
- Registro de auditorías realizadas
- Trazabilidad completa de cambios de estado
- Campos: `auditor_id`, `estado_anterior`, `estado_nuevo`, `comentario`

### Relación entre Tablas de Servicios

```
servicios (id_servicio INT)
    ↓
prestador_servicio (id_prestador_servicio INT PK, id_servicio INT FK)
    ↓
prestador_servicio_valores (id_prestador_servicio INT FK)

presupuesto_prestaciones (id_servicio VARCHAR)
    ↑
    NO hay FK directa, se relaciona por valor string
```

### Conversión de IDs en Queries

```typescript
// Frontend envía: id_servicio (string)
// Backend necesita: id_prestador_servicio (int) para valores históricos

// Query de conversión:
SELECT id_prestador_servicio 
FROM prestador_servicio 
WHERE id_servicio = ? AND idobra_social = ?
```

### Sistema de Versionado

```
Presupuesto Original (ID: 100, version: 1)
    ↓ (edición)
Nueva Versión (ID: 101, version: 2, presupuesto_padre: 100)
    ↓ (edición)
Nueva Versión (ID: 102, version: 3, presupuesto_padre: 100)
```

- Solo la última versión tiene `es_ultima_version = 1`
- Todas las versiones mantienen `presupuesto_padre` apuntando al original
- Historial completo de cambios
- **Nueva versión actualiza `valor_facturar` con precios actuales**
- **Mantiene `valor_asignado` original (costo negociado)**

### Sistema de Valores Históricos (Timelapse)

```
prestador_servicio_valores
┌────────────────────────────────────────────────────────┐
│ id_prestador_servicio │ fecha_inicio │ fecha_fin      │
├────────────────────────────────────────────────────────┤
│ 123                   │ 2024-01-01   │ 2024-05-31     │ ← Histórico
│ 123                   │ 2024-06-01   │ 2024-11-30     │ ← Histórico
│ 123                   │ 2024-12-01   │ NULL           │ ← Vigente
└────────────────────────────────────────────────────────┘
```

**Características:**
- Períodos de vigencia con `fecha_inicio` y `fecha_fin`
- `fecha_fin = NULL` indica período vigente actual
- Cierre automático de períodos al agregar nuevos valores
- Query con `BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')`
- Fallback a `prestador_servicio` si no hay valores históricos

## 🔄 Flujo de Datos

### Crear Presupuesto con Valores Históricos

```
Frontend                Backend                 Database
   |                       |                        |
   |-- POST /presupuestos -|                        |
   |                       |-- INSERT presupuestos -|
   |                       |<-- ID: 100 ------------| (created_at: HOY)
   |<-- { id: 100 } -------|                        |
   |                       |                        |
   |-- GET /prestaciones --|                        |
   |   prestador/:id       |                        |
   |                       |-- SELECT con subquery -|
   |                       |   usando id_prestador_servicio
   |                       |   valores vigentes HOY |
   |<-- prestaciones ------|                        |
   |   (id_servicio string)|                        |
   |                       |                        |
   |-- POST /prestaciones -|                        |
   |   (id_servicio,       |                        |
   |    valor_asignado)    |                        |
   |                       |-- SELECT created_at ---|
   |                       |-- SELECT id_prestador_servicio
   |                       |   FROM id_servicio     |
   |                       |-- SELECT valor_facturar|
   |                       |   vigente HOY          |
   |                       |-- INSERT prestaciones -|
   |<-- OK ----------------|                        |
```

### Ver Presupuesto Histórico (Solo Lectura)

```
Frontend                Backend                 Database
   |                       |                        |
   |-- GET /presupuestos/100                       |
   |                       |-- SELECT presupuesto -|
   |<-- created_at: 2024-06-15                     |
   |                       |                        |
   |-- GET /prestaciones --|                        |
   |   ?fecha=2024-06-15   |                        |
   |                       |-- SELECT con subquery -|
   |                       |   usando id_prestador_servicio
   |                       |   valores vigentes     |
   |                       |   en 2024-06-15        |
   |<-- prestaciones ------|                        |
   |   (valores de junio)  |                        |
```

### Editar Presupuesto → Nueva Versión

```
Frontend                Backend                 Database
   |                       |                        |
   |-- POST /editar -------|                        |
   |   { confirmar: true } |                        |
   |                       |-- SELECT prestaciones -|
   |                       |   versión anterior     |
   |                       |                        |
   |                       |-- Para cada prestación:|
   |                       |   SELECT id_prestador_servicio
   |                       |   FROM id_servicio     |
   |                       |   SELECT valor_facturar|
   |                       |   vigente HOY          |
   |                       |   (mantiene valor_asignado)|
   |                       |                        |
   |                       |-- INSERT nueva versión |
   |                       |-- INSERT prestaciones -|
   |                       |   (valores actualizados)|
   |<-- { id: 101 } -------|                        |
```

### Gestionar Valores Históricos (Admin)

```
Frontend                Backend                 Database
   |                       |                        |
   |-- GET /servicio/:id/valores                   |
   |   (id = id_prestador_servicio)                |
   |                       |-- SELECT histórico ----|
   |<-- valores históricos-|                        |
   |                       |                        |
   |-- POST /servicio/:id/valores                  |
   |   { fecha_inicio,     |                        |
   |     valor_asignado,   |                        |
   |     valor_facturar }  |                        |
   |                       |-- BEGIN TRANSACTION ---|
   |                       |-- UPDATE fecha_fin -----|
   |                       |   (cierre automático)  |
   |                       |-- INSERT nuevo valor --|
   |                       |-- COMMIT --------------|
   |<-- OK ----------------|                        |
```

## 🎯 Componentes Principales

### Backend

#### Controllers
- **presupuestosControllerV2.ts**: CRUD de presupuestos, versionado, finalización
  - `crearVersionParaEdicion()`: Actualiza `valor_facturar` con valores actuales
- **presupuestoInsumosController.ts**: Gestión de insumos, recálculo automático
- **presupuestoPrestacionesController.ts**: Gestión de prestaciones
  - `guardarPrestacionPresupuesto()`: Convierte `id_servicio` a `id_prestador_servicio` y valida `valor_facturar` histórico
- **prestacionesController.ts**: Consulta de prestaciones
  - `getPrestacionesPorPrestador()`: Acepta parámetro `?fecha=` opcional, usa `ps.id_prestador_servicio` en subqueries
- **prestadorValoresController.ts** ⭐ NUEVO: Gestión de valores históricos
  - `getValoresPrestadorServicio()`: Obtener histórico completo
  - `guardarValorPrestadorServicio()`: Guardar con cierre automático
  - `obtenerValorVigente()`: Helper para consultar por fecha
- **admin/adminServiciosController.ts**: Gestión de servicios por prestador
  - `createOrUpdateServicioPrestador()`: Crea automáticamente registro en `prestador_servicio_valores` al activar servicio nuevo
- **authController.ts**: Autenticación y autorización
- **sseController.ts**: Manejo de conexiones SSE

#### Routes
- **presupuestosV2.ts**: Rutas RESTful de presupuestos
- **prestaciones.ts**: Rutas de prestaciones y valores históricos
  - `GET /prestaciones/servicio/:id/valores`
  - `POST /prestaciones/servicio/:id/valores`
- **auth.ts**: Rutas de autenticación
- **sse.ts**: Endpoint de streaming

#### Middleware
- **auth.ts**: Verificación de JWT
- **errorHandler.ts**: Manejo centralizado de errores

### Frontend

#### Pages
- **UserDashboard.tsx**: Dashboard principal de usuarios
- **AuditorDashboard.tsx**: Dashboard de auditores médicos
- **DatosPresupuesto.tsx**: Formulario de datos del paciente
- **Insumos.tsx**: Gestión de insumos
- **Prestaciones.tsx**: Gestión de prestaciones
  - Detecta modo `soloLectura` para cargar valores históricos
  - Pasa fecha del presupuesto al cargar prestaciones disponibles
- **ListaPresupuestos.tsx**: Historial de presupuestos
- **Notificaciones.tsx**: Centro de notificaciones
- **Auditoria.tsx**: Panel de auditoría
- **admin/ServiciosPorPrestador.tsx** ⭐ NUEVO: Gestión de valores históricos
  - Modal unificado con edición rápida
  - Formulario para múltiples valores futuros
  - Tabla de histórico con badges
  - Formato monetario argentino
  - Usa `id_prestador_servicio` para cargar valores históricos (corregido)

#### Hooks
- **usePresupuesto.tsx**: Lógica de gestión de presupuestos
- **useTotales.tsx**: Cálculo de totales y rentabilidades
- **useNotificationCount.tsx**: Contador de notificaciones
- **useRealtimeUpdates.tsx**: Conexión SSE y actualizaciones

#### Components
- **ModalAuditoria.tsx**: Modal para solicitar/realizar auditoría
- **ModalConfirmarEdicion.tsx**: Confirmación de creación de versión
- **ModalDetallePresupuesto.tsx**: Vista detallada de presupuesto
- **ConnectionStatus.tsx**: Indicador de conexión SSE
- **NotificationIndicator.tsx**: Badge de notificaciones

#### Global Config
- **App.tsx**: Configuración global de Mantine
  - Modal con ScrollArea.Autosize
  - Títulos con fontWeight 600
  - Radius xl por defecto

## 🔐 Seguridad

### Autenticación
- JWT con expiración de 24 horas
- Tokens almacenados en localStorage
- Refresh automático en cada request

### Autorización
- Middleware de verificación de roles
- Rutas protegidas por rol
- Validación en backend y frontend

### Validación de Datos
- Validación en frontend (UX)
- Validación en backend (seguridad)
- Sanitización de inputs
- **Validación automática de valores históricos**
- **Conversión segura de id_servicio a id_prestador_servicio**

## 📈 Optimizaciones

### Backend
- **Queries Optimizadas**: JOINs y subqueries para valores históricos
- **Conversión de IDs**: Query adicional para obtener id_prestador_servicio
- **Recálculo Automático**: Triggers en operaciones de insumos/prestaciones
- **Transacciones**: En operaciones de valores históricos
- **Índices**: En `(id_prestador_servicio, fecha_inicio, fecha_fin)`

### Frontend
- **Code Splitting**: Carga lazy de componentes
- **Memoization**: useMemo y useCallback
- **Debouncing**: En búsquedas y filtros
- **Virtual Scrolling**: En tablas grandes

## 🔄 Sistema de Notificaciones

### Arquitectura SSE

```
Cliente 1 ----\
Cliente 2 ------> SSE Server --> Event Emitter --> Database Events
Cliente 3 ----/
```

### Flujo de Eventos

1. Cliente abre conexión SSE
2. Backend registra cliente en pool
3. Evento ocurre en BD (INSERT/UPDATE)
4. Backend emite evento a clientes relevantes
5. Cliente recibe y procesa evento
6. UI se actualiza automáticamente

### Tipos de Eventos
- `presupuesto-pendiente`: Nuevo presupuesto para auditar
- `presupuesto-aprobado`: Presupuesto aprobado
- `presupuesto-rechazado`: Presupuesto rechazado
- `notificacion-nueva`: Nueva notificación general

## 📊 Cálculos Financieros

### Rentabilidad Simple
```
rentabilidad = ((totalFacturar - costoTotal) / costoTotal) * 100
```

### Rentabilidad con Plazo
```
mesesCobranza = diasCobranza / 30
valorPresente = totalFacturar / (1 + tasaMensual)^mesesCobranza
utilidadConPlazo = valorPresente - costoTotal
rentabilidadConPlazo = (utilidadConPlazo / costoTotal) * 100
```

### Precio de Insumos
```
precioFacturar = costoBase * (1 + porcentajeSucursal / 100)
```

### Valores Históricos
```sql
-- Consultar valor vigente en fecha específica
-- Paso 1: Obtener id_prestador_servicio
SELECT id_prestador_servicio 
FROM prestador_servicio 
WHERE id_servicio = ? AND idobra_social = ?

-- Paso 2: Consultar valor histórico
SELECT valor_asignado, valor_facturar 
FROM prestador_servicio_valores 
WHERE id_prestador_servicio = ? 
  AND ? BETWEEN fecha_inicio AND COALESCE(fecha_fin, '9999-12-31')
LIMIT 1
```

## 💰 Sistema de Valores Históricos

### Arquitectura

```
Tabla: prestador_servicio_valores
┌─────────────────────────────────────────────────────────────┐
│ Período 1: 2024-01-01 → 2024-05-31 (cerrado)              │
│ Período 2: 2024-06-01 → 2024-11-30 (cerrado)              │
│ Período 3: 2024-12-01 → NULL (vigente)                    │
└─────────────────────────────────────────────────────────────┘
```

### Comportamiento por Escenario

| Escenario | `valor_asignado` | `valor_facturar` | Fecha Usada |
|-----------|------------------|------------------|-------------|
| **Crear presupuesto nuevo** | Usuario elige | Tabla histórica | HOY |
| **Ver histórico (solo lectura)** | Guardado en BD | Guardado en BD | N/A |
| **Ver histórico - Lista disponibles** | Tabla prestador_servicio | Tabla histórica | Fecha presupuesto |
| **Editar → Nueva versión** | Usuario elige | Tabla histórica | HOY |
| **Editar → Prestaciones copiadas** | Copiado (original) | Actualizado (HOY) | HOY |

### Cierre Automático de Períodos

```sql
-- Al guardar nuevo valor con fecha_inicio = 2024-12-01
UPDATE prestador_servicio_valores 
SET fecha_fin = DATE_SUB('2024-12-01', INTERVAL 1 DAY)
WHERE id_prestador_servicio = ? 
  AND fecha_inicio < '2024-12-01'
  AND (fecha_fin IS NULL OR fecha_fin >= '2024-12-01')
```

### Activar Servicio Nuevo

```sql
-- Al activar servicio nuevo, se crea automáticamente registro inicial
BEGIN TRANSACTION;

-- 1. Insertar en prestador_servicio
INSERT INTO prestador_servicio 
(idobra_social, id_servicio, valor_facturar, activo, cant_total, valor_sugerido) 
VALUES (?, ?, ?, ?, ?, ?);

-- 2. Crear registro inicial en valores históricos
INSERT INTO prestador_servicio_valores 
(id_prestador_servicio, valor_asignado, valor_facturar, fecha_inicio) 
VALUES (LAST_INSERT_ID(), ?, ?, CURDATE());

COMMIT;
```

### Integración con Presupuestos

**Crear Presupuesto:**
- Frontend obtiene valores vigentes HOY
- Usuario elige `valor_asignado` (costo negociado)
- Backend convierte `id_servicio` a `id_prestador_servicio`
- Backend valida `valor_facturar` vigente HOY
- Guarda ambos valores en `presupuesto_prestaciones`

**Ver Presupuesto Histórico:**
- Frontend detecta `soloLectura=true`
- Obtiene `created_at` del presupuesto
- Carga prestaciones con `?fecha=created_at`
- Muestra valores vigentes en esa fecha

**Editar Presupuesto:**
- Backend copia prestaciones de versión anterior
- Convierte `id_servicio` a `id_prestador_servicio`
- Mantiene `valor_asignado` original
- Actualiza `valor_facturar` con valores vigentes HOY
- Usuario puede agregar nuevas prestaciones con valores actuales

## 🧪 Testing

### Backend
- Unit tests con Jest
- Integration tests de endpoints
- Tests de reglas de auditoría
- **Tests de valores históricos**:
  - Cierre automático de períodos
  - Consulta por fecha
  - Conversión de id_servicio a id_prestador_servicio
  - Fallback a valores actuales

### Frontend
- Component tests con React Testing Library
- E2E tests con Playwright (futuro)
- **Tests de modal de valores históricos**

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
# Servir carpeta dist/ con nginx/apache
```

### Migraciones
```bash
# Ejecutar migración de valores históricos
mysql -u root -p presupuestador < backend/migrations/create_prestador_servicio_valores.sql
```

## 🔍 Monitoreo

### Logs
- Winston para logging estructurado
- Niveles: error, warn, info, debug
- Rotación diaria de archivos

### Métricas
- Tiempo de respuesta de endpoints
- Conexiones SSE activas
- Errores por tipo
- **Consultas de valores históricos**
- **Conversiones de IDs**

## 🚀 Escalabilidad

### Horizontal
- Backend stateless (excepto SSE)
- Load balancer con sticky sessions para SSE
- Base de datos con replicación

### Vertical
- Optimización de queries con índices
- Caching de valores históricos vigentes
- Índices compuestos en tabla de valores
- Cache de conversiones id_servicio → id_prestador_servicio

## 📝 Convenciones de Código

### Backend
- Nombres de archivos: camelCase
- Funciones: camelCase
- Constantes: UPPER_SNAKE_CASE
- Async/await para operaciones asíncronas

### Frontend
- Componentes: PascalCase
- Hooks: useCamelCase
- Archivos: PascalCase para componentes, camelCase para utils
- Props: camelCase
- **Formato monetario**: Intl.NumberFormat('es-AR')

## 🔄 Versionado de API

Actualmente: **v2**
- Rutas: `/api/presupuestos`, `/api/prestaciones`
- Cambios breaking requieren nueva versión
- Mantener compatibilidad con versión anterior

## 📚 Recursos Adicionales

- [Manual de Usuario](./MANUAL_USUARIO_V2.md)
- [Documentación de API](./backend/RUTAS_API.md)
- [Sistema de Notificaciones](./SISTEMA_NOTIFICACIONES.md)
- [Valores Históricos](./IMPLEMENTACION_VALORES_HISTORICOS.md)
- [Changelog](./CHANGELOG_LIMPIEZA.md)

---

**Versión:** 2.0  
**Última actualización:** Diciembre 2024  
**Estado:** ✅ Producción
