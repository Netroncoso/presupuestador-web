# Arquitectura del Sistema - Presupuestador Web

## 📐 Visión General

Sistema web de gestión de presupuestos médicos con arquitectura cliente-servidor, versionado de datos, auditoría automatizada y notificaciones en tiempo real.

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
- **UI Library**: Mantine UI
- **State Management**: React Hooks
- **HTTP Client**: Axios
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
- Campos: `id_servicio`, `prestacion`, `valor_asignado`, `valor_facturar`, `cantidad`

**financiador**
- Información de obras sociales/financiadores
- Campos: `idobra_social`, `Financiador`, `tasa_mensual`, `dias_cobranza_real`, `dias_cobranza_teorico`

**notificaciones**
- Sistema de notificaciones en tiempo real
- Tipos: `pendiente`, `aprobado`, `rechazado`
- Estados: `no_leida`, `leida`

**auditorias_presupuestos**
- Registro de auditorías realizadas
- Trazabilidad completa de cambios de estado
- Campos: `auditor_id`, `estado_anterior`, `estado_nuevo`, `comentario`

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

## 🔄 Flujo de Datos

### Crear Presupuesto

```
Frontend                Backend                 Database
   |                       |                        |
   |-- POST /presupuestos -|                        |
   |                       |-- INSERT presupuestos -|
   |                       |<-- ID: 100 ------------|
   |<-- { id: 100 } -------|                        |
   |                       |                        |
   |-- POST /insumos ------|                        |
   |                       |-- INSERT insumos ------|
   |                       |-- recalcularTotales ---|
   |                       |-- UPDATE presupuestos -|
   |<-- OK ----------------|                        |
```

### Finalizar Presupuesto

```
Frontend                Backend                 Database
   |                       |                        |
   |-- POST /finalizar ----|                        |
   |                       |-- SELECT con JOINs ----|
   |                       |<-- totales calculados -|
   |                       |-- evaluarReglas -------|
   |                       |-- UPDATE estado -------|
   |                       |-- notificarAuditores --|
   |<-- { estado } --------|                        |
```

### Notificaciones en Tiempo Real (SSE)

```
Frontend                Backend                 Database
   |                       |                        |
   |-- GET /sse/stream ----|                        |
   |<-- Connection open ---|                        |
   |                       |                        |
   |                       |<-- Evento DB ----------|
   |                       |-- Procesar evento -----|
   |<-- SSE: data ---------|                        |
   |-- Actualizar UI       |                        |
```

## 🎯 Componentes Principales

### Backend

#### Controllers
- **presupuestosControllerV2.ts**: CRUD de presupuestos, versionado, finalización
- **presupuestoInsumosController.ts**: Gestión de insumos, recálculo automático
- **presupuestoPrestacionesController.ts**: Gestión de prestaciones, recálculo automático
- **authController.ts**: Autenticación y autorización
- **sseController.ts**: Manejo de conexiones SSE

#### Routes
- **presupuestosV2.ts**: Rutas RESTful de presupuestos
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
- **ListaPresupuestos.tsx**: Historial de presupuestos
- **Notificaciones.tsx**: Centro de notificaciones
- **Auditoria.tsx**: Panel de auditoría

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

## 📈 Optimizaciones

### Backend
- **Queries Optimizadas**: JOINs en lugar de múltiples queries
- **Recálculo Automático**: Triggers en operaciones de insumos/prestaciones
- **Transacciones**: Solo donde es necesario
- **Índices**: En campos de búsqueda frecuente

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

## 🧪 Testing

### Backend
- Unit tests con Jest
- Integration tests de endpoints
- Tests de reglas de auditoría

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
# Servir carpeta dist/ con nginx/apache
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

## 🚀 Escalabilidad

### Horizontal
- Backend stateless (excepto SSE)
- Load balancer con sticky sessions para SSE
- Base de datos con replicación

### Vertical
- Optimización de queries
- Índices en BD
- Caching de datos frecuentes

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

## 🔄 Versionado de API

Actualmente: **v2**
- Rutas: `/api/v2/presupuestos`
- Cambios breaking requieren nueva versión
- Mantener compatibilidad con versión anterior

## 📚 Recursos Adicionales

- [Manual de Usuario](./MANUAL_USUARIO_V2.md)
- [Documentación de API](./backend/RUTAS_API.md)
- [Sistema de Notificaciones](./SISTEMA_NOTIFICACIONES.md)
- [Changelog](./CHANGELOG_LIMPIEZA.md)

---

**Última actualización:** Enero 2025
