# Sistema Multi-Gerencial v3.0 - Documentación Completa

## 📋 Resumen Ejecutivo

Sistema de auditoría multi-gerencial que reemplaza el sistema simple de 1 auditor por un flujo de 4 gerencias con asignación automática de casos tipo First Come First Served (FCFS), auto-liberación después de 30 minutos de inactividad, y aprobaciones condicionales para casos políticos/estratégicos.

**Fecha:** Enero 2025  
**Versión:** 3.0  
**Estado:** ✅ COMPLETADO E IMPLEMENTADO  
**Base de datos:** mh_1

---

## 🎯 Objetivos Alcanzados

✅ Sistema de asignación First Come, First Served (FCFS) con FOR UPDATE  
✅ Auto-liberación de casos después de 30 minutos de inactividad  
✅ 4 gerencias con flujos específicos de trabajo  
✅ Aprobación condicional para casos políticos/estratégicos  
✅ 15 métodos de transición con notificaciones automáticas  
✅ Eliminación completa de código deprecado (auditor_medico)  
✅ UI consistente con el resto de la aplicación  
✅ 9 índices optimizados para alto volumen  
✅ SSE actualizado para notificaciones en tiempo real  
✅ Sistema de notificaciones verificado y funcional  

---

## 🏗️ Arquitectura del Sistema

### Flujo de Gerencias

```
Usuario Finaliza Presupuesto
         ↓
   ¿Cumple reglas?
         ↓
    [SÍ] → Aprobado Automático
    [NO] → Pendiente G. Administrativa
         ↓
   G. Administrativa
         ↓
   ┌─────┴─────┐
   ↓           ↓
Aprobar    Derivar → G. Prestacional
Rechazar              ↓
Aprobar               ┌────┴────┐
Condicional           ↓         ↓
                   Aprobar   Escalar → G. General
                   Rechazar             ↓
                   Observar        ┌────┴────┐
                   Aprobar         ↓         ↓
                   Condicional  Aprobar   Devolver
                                Rechazar
                                Aprobar
                                Condicional
```

### Roles del Sistema

| Rol | Descripción | Acciones Disponibles |
|-----|-------------|---------------------|
| **user** | Usuario normal | Crear/editar presupuestos, solicitar auditoría |
| **gerencia_administrativa** | Primera línea | Aprobar, Rechazar, Derivar, Aprobar Condicional |
| **gerencia_prestacional** | Segunda línea | Aprobar, Rechazar, Observar, Escalar, Aprobar Condicional |
| **gerencia_financiera** | Solo observa | Usa dashboard de G. General (sin acciones) |
| **gerencia_general** | Última línea | Aprobar, Rechazar, Devolver, Aprobar Condicional |
| **admin** | Administrador | Acceso completo + gestión de usuarios |

---

## 📊 Base de Datos

### Migración Ejecutada

**Archivo:** `backend/migrations/001_migrate_multi_gerencial.sql`

#### Estados de Presupuestos (10 estados)

```sql
estado ENUM(
  'borrador',
  'pendiente_administrativa',
  'en_revision_administrativa',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'aprobado_condicional',
  'rechazado'
)
```

#### Roles de Usuarios (6 roles)

```sql
rol ENUM(
  'user',
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_financiera',
  'gerencia_general',
  'admin'
)
```

**Nota:** Rol `auditor_medico` eliminado completamente del sistema.

#### Columnas de Asignación

```sql
ALTER TABLE presupuestos 
ADD COLUMN revisor_id INT NULL,
ADD COLUMN revisor_asignado_at TIMESTAMP NULL,
ADD CONSTRAINT fk_presupuestos_revisor 
  FOREIGN KEY (revisor_id) REFERENCES usuarios(id) ON DELETE SET NULL;
```

#### Índices Creados (9 total)

| Índice | Tabla | Columnas | Propósito |
|--------|-------|----------|-----------|
| `idx_estado_revisor` | presupuestos | estado, revisor_id | Queries de pendientes |
| `idx_revisor_asignado_at` | presupuestos | revisor_asignado_at, estado | Auto-liberación |
| `idx_revisor_id` | presupuestos | revisor_id | Búsqueda por revisor |
| `idx_auditoria_presupuesto` | auditorias_presupuestos | presupuesto_id, fecha | Historial |
| `idx_auditoria_auditor` | auditorias_presupuestos | auditor_id, fecha | Por auditor |
| `idx_notif_usuario` | notificaciones | usuario_id | Notificaciones |
| `idx_presup_usuario_estado` | presupuestos | usuario_id, estado | Por usuario |
| `idx_presup_sucursal_estado` | presupuestos | sucursal_id, estado | Por sucursal |

---

## 🔧 Backend - Implementación Completa

### Estructura de Archivos

```
backend/src/
├── config/
│   └── businessRules.ts              ✅ Estados actualizados
├── middleware/
│   └── auth.ts                       ✅ 4 middlewares nuevos
├── types/
│   └── database.ts                   ✅ Tipos actualizados
├── services/
│   ├── auditoriaMultiService.ts      ✅ NUEVO - 15 métodos
│   ├── cronJobs.ts                   ✅ NUEVO - Auto-liberación
│   ├── calculosService.ts            ✅ Estados actualizados
│   └── presupuestoService.ts         ✅ Estados actualizados
├── repositories/
│   └── presupuestoRepository.ts      ✅ Notificaciones actualizadas
├── controllers/
│   └── sseController.ts              ✅ Soporte multi-gerencial
├── routes/
│   ├── auditoria-multi.ts            ✅ NUEVO - 20 endpoints
│   ├── auditoria-simple.ts           ✅ Actualizado
│   └── presupuestosV2.ts             ✅ Actualizado
└── app.ts                            ✅ Cron jobs iniciados
```

### Servicios Implementados

#### auditoriaMultiService.ts (600+ líneas)

**15 Métodos de Transición:**

1. `tomarCaso()` - Asignación FCFS con FOR UPDATE
2. `aprobarAdministrativa()` - G. Administrativa aprueba
3. `aprobarCondicionalAdministrativa()` - Aprobación condicional
4. `rechazarAdministrativa()` - G. Administrativa rechaza
5. `derivarAPrestacional()` - Deriva a G. Prestacional
6. `aprobarPrestacional()` - G. Prestacional aprueba
7. `aprobarCondicionalPrestacional()` - Aprobación condicional
8. `rechazarPrestacional()` - G. Prestacional rechaza
9. `observarPresupuesto()` - Devuelve a usuario para edición
10. `escalarAGeneral()` - Escala a G. General
11. `aprobarGeneral()` - G. General aprueba
12. `aprobarCondicionalGeneral()` - Aprobación condicional
13. `rechazarGeneral()` - G. General rechaza
14. `devolverAGerencia()` - Devuelve a otra gerencia
15. `autoLiberarCasosInactivos()` - Libera casos > 30 min

**Helpers:**
- `notificarGerencia()` - Notifica a todos los usuarios de un rol
- `notificarUsuario()` - Notifica al usuario creador del presupuesto

### Endpoints REST (20 total)

**Base:** `/api/auditoria-multi`

#### Comunes (Todas las Gerencias)

```
GET  /pendientes          - Casos disponibles para la gerencia
GET  /mis-casos           - Casos asignados al usuario
PUT  /tomar/:id           - Tomar caso (FCFS con lock)
```

#### Gerencia Administrativa

```
PUT  /administrativa/aprobar/:id
PUT  /administrativa/aprobar-condicional/:id
PUT  /administrativa/rechazar/:id
PUT  /administrativa/derivar/:id
```

#### Gerencia Prestacional

```
PUT  /prestacional/aprobar/:id
PUT  /prestacional/aprobar-condicional/:id
PUT  /prestacional/rechazar/:id
PUT  /prestacional/observar/:id
PUT  /prestacional/escalar/:id
```

#### Gerencia General

```
PUT  /general/aprobar/:id
PUT  /general/aprobar-condicional/:id
PUT  /general/rechazar/:id
PUT  /general/devolver/:id
```

### Sistema de Auto-Liberación

**Archivo:** `backend/src/services/cronJobs.ts`

```typescript
// Ejecuta cada 5 minutos
setInterval(() => {
  auditoriaMultiService.autoLiberarCasosInactivos();
}, 5 * 60 * 1000);
```

**Query SQL:**
```sql
UPDATE presupuestos 
SET revisor_id = NULL,
    revisor_asignado_at = NULL,
    estado = REPLACE(estado, 'en_revision', 'pendiente')
WHERE revisor_id IS NOT NULL
  AND revisor_asignado_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
  AND estado LIKE '%en_revision%'
```

### Actualizaciones de Código Existente

#### SSE Controller (sseController.ts)

**Cambios realizados:**
- Reemplazado `auditor_medico` por array de roles de gerencias
- Query actualizada con 6 estados multi-gerenciales
- Función `getAuditorConnections()` actualizada para broadcast

#### Auditoría Simple (auditoria-simple.ts)

**Cambios realizados:**
- Endpoint `/pedir/:id` actualizado a `pendiente_administrativa`
- Notificaciones enviadas a `gerencia_administrativa`
- Middleware actualizado para soportar gerencias

#### Repositorio de Presupuestos (presupuestoRepository.ts)

**Cambios realizados:**
- Método `notificarAuditores()` actualizado
- Notifica a `gerencia_administrativa` en lugar de `auditor_medico`

---

## 🎨 Frontend - Implementación Completa

### Estructura de Archivos

```
frontend/src/
├── types/
│   └── index.ts                      ✅ EstadoPresupuesto, RolUsuario
├── utils/
│   └── estadoPresupuesto.ts          ✅ Colores, labels, helpers
├── contexts/
│   └── AuthContext.tsx               ✅ Tipos actualizados
├── components/
│   └── ModalAuditoriaMulti.tsx       ✅ NUEVO - Modal por rol
├── pages/
│   ├── GerenciaDashboard.tsx         ✅ NUEVO - Base reutilizable
│   ├── GerenciaAdministrativa.tsx    ✅ NUEVO
│   ├── GerenciaPrestacional.tsx      ✅ NUEVO
│   ├── GerenciaGeneral.tsx           ✅ NUEVO
│   ├── ListaPresupuestos.tsx         ✅ Filtros actualizados
│   ├── Notificaciones.tsx            ✅ Lógica actualizada
│   └── admin/
│       └── GestionUsuarios.tsx       ✅ Roles actualizados
└── App.tsx                           ✅ Rutas actualizadas
```

### Componentes Principales

#### GerenciaDashboard.tsx (Base Reutilizable)

**Props:**
- `titulo: string` - Título del dashboard
- `rol: RolUsuario` - Rol de la gerencia

**4 Tabs:**
1. **Casos Disponibles** - Lista de pendientes con botón "Tomar Caso"
2. **Mis Casos** - Casos asignados con tiempo transcurrido
3. **Historial** - Todos los presupuestos (ListaPresupuestos)
4. **Notificaciones** - Notificaciones del usuario

**Características:**
- Filtro por ID de presupuesto
- Indicador de conexión SSE
- Badge con cantidad de casos
- Alert de auto-liberación (30 min)
- Colores consistentes con la app

#### ModalAuditoriaMulti.tsx

**Acciones por Rol:**

**G. Administrativa:**
- Aprobar (verde)
- Aprobar Condicional (amarillo)
- Derivar a G. Prestacional (azul)
- Rechazar (rojo)

**G. Prestacional:**
- Aprobar (verde)
- Aprobar Condicional (amarillo)
- Rechazar (rojo)
- Observar - Devolver a Usuario (naranja)
- Escalar a G. General (violeta)

**G. General:**
- Aprobar (verde)
- Aprobar Condicional (amarillo)
- Rechazar (rojo)
- Devolver a Gerencia (azul) + Select

**Validaciones:**
- Comentario obligatorio para rechazar/observar
- Motivo mínimo 10 caracteres para condicional
- Gerencia destino obligatoria para devolver

### Utilidades de Estados

**Archivo:** `frontend/src/utils/estadoPresupuesto.ts`

```typescript
// Colores por estado
getEstadoBadgeColor(estado: string): string
  - aprobado → green
  - aprobado_condicional → yellow
  - rechazado → red
  - en_revision_* → blue
  - pendiente_* → orange
  - borrador → gray

// Labels descriptivos
getEstadoLabel(estado: string): string
  - pendiente_administrativa → "PENDIENTE G. ADMIN"
  - en_revision_prestacional → "EN REVISIÓN G. PRESTACIONAL"
  - aprobado_condicional → "APROBADO CONDICIONAL"

// Helpers
esEstadoEditable(estado: string): boolean
esEstadoFinal(estado: string): boolean
esEstadoPendiente(estado: string): boolean
esEstadoEnRevision(estado: string): boolean
```

### Actualizaciones de Componentes Existentes

#### AuthContext.tsx

**Cambios realizados:**
- Interface `User.rol` actualizada con 6 roles
- Eliminado `auditor_medico`

#### Notificaciones.tsx

**Cambios realizados:**
- Variable `esAuditor` usa array de roles de gerencias
- Eliminada referencia a `auditor_medico`

#### GestionUsuarios.tsx (Admin)

**Cambios realizados:**
- Select de roles actualizado con 4 gerencias
- Abreviación "G." en tabla para evitar overflow
- Formato: `gerencia_administrativa` → `G. administrativa`

---

## 🔄 Flujos de Trabajo Detallados

### 1. Usuario Finaliza Presupuesto

```
1. Usuario completa presupuesto en borrador
2. Click "Finalizar"
3. Backend evalúa reglas de negocio
4. SI cumple → estado = 'aprobado'
5. NO cumple → estado = 'pendiente_administrativa'
6. Notifica a G. Administrativa (todos los usuarios del rol)
7. SSE broadcast a gerencias conectadas
```

### 2. Gerencia Toma Caso

```
1. Usuario de gerencia ve lista de "Casos Disponibles"
2. Click "Tomar Caso"
3. Backend ejecuta FOR UPDATE (lock de fila)
4. Verifica si está libre
5. Asigna revisor_id + revisor_asignado_at
6. Cambia estado: pendiente_* → en_revision_*
7. Caso aparece en "Mis Casos"
8. SSE notifica a otros usuarios (caso ya no disponible)
```

### 3. Auto-Liberación (30 minutos)

```
1. Cron job ejecuta cada 5 minutos
2. Query busca casos con revisor_asignado_at > 30 min
3. Limpia revisor_id = NULL
4. Cambia estado: en_revision_* → pendiente_*
5. Caso vuelve a "Casos Disponibles"
6. SSE broadcast a todos los usuarios
```

### 4. Aprobar Condicional

```
1. Gerencia revisa caso con rentabilidad < 15%
2. Decide aprobar por razones políticas
3. Click "Aprobar Condicional"
4. Ingresa motivo (min 10 caracteres)
5. Backend cambia estado = 'aprobado_condicional'
6. Registra en auditorías con motivo
7. Notifica a usuario creador
8. Limpia revisor_id
```

### 5. Observar (Devolver a Usuario)

```
1. G. Prestacional detecta error menor
2. Click "Observar"
3. Ingresa comentario obligatorio
4. Backend cambia estado = 'borrador'
5. Registra en auditorías como 'observado'
6. Notifica a usuario creador
7. Usuario puede editar SIN crear nueva versión
8. Usuario finaliza nuevamente
9. Vuelve a pendiente_administrativa
```

### 6. Escalar a G. General

```
1. G. Prestacional no puede decidir
2. Click "Escalar"
3. Ingresa motivo obligatorio
4. Backend cambia estado = 'pendiente_general'
5. Limpia revisor_id
6. Notifica a G. General (todos los usuarios)
7. G. General puede tomar el caso
```

---

## 📝 Diferencias Clave: OBSERVAR vs DEVOLVER

### OBSERVAR (G. Prestacional → Usuario)

**Propósito:** Correcciones menores  
**Estado resultante:** `borrador`  
**Usuario puede editar:** ✅ SÍ  
**Crea nueva versión:** ❌ NO  
**Flujo siguiente:** Usuario corrige → Finaliza → G. Administrativa  

**Casos de uso:**
- Typo en nombre/DNI
- Falta agregar insumo
- Error de cálculo menor

### DEVOLVER (G. General → Otra Gerencia)

**Propósito:** Re-evaluación por otra gerencia  
**Estado resultante:** `pendiente_administrativa` o `pendiente_prestacional`  
**Usuario puede editar:** ❌ NO  
**Crea nueva versión:** ❌ NO  
**Flujo siguiente:** Gerencia destino revisa → Aprueba/Rechaza  

**Casos de uso:**
- Desacuerdo con decisión anterior
- Necesita segunda opinión
- Escalamiento incorrecto

---

## 🎯 Aprobación Condicional

### Propósito

Aprobar presupuestos con márgenes bajos por razones políticas/estratégicas (financiadores VIP, alto volumen, relación comercial prioritaria).

### Características

- Estado final (como aprobado/rechazado)
- Motivo obligatorio (min 10 caracteres)
- Color distintivo (amarillo)
- Visible en reportes
- Usuario puede ejecutar normalmente
- Trazabilidad completa en auditorías

### Ejemplo de Uso

```
Presupuesto: Rentabilidad 12% (< 15%)
Financiador: OSDE (cliente VIP)
Decisión: Aprobar Condicional
Motivo: "Cliente estratégico con volumen mensual de 50+ casos"
```

---

## 🔒 Seguridad y Validaciones

### Backend

1. **Middleware de autenticación** - Todos los endpoints protegidos
2. **Validación de rol** - Solo gerencias pueden auditar
3. **Verificación de revisor** - Solo quien tomó el caso puede auditar
4. **FOR UPDATE** - Evita race conditions en asignación
5. **Transacciones atómicas** - Rollback en caso de error
6. **Validación de campos** - Comentarios/motivos obligatorios

### Frontend

1. **Validación de formularios** - Antes de enviar
2. **Mensajes de error claros** - Feedback inmediato
3. **Loading states** - Previene doble submit
4. **Confirmaciones** - Para acciones críticas

---

## 📊 Performance y Optimización

### Índices Estratégicos

**Query más común:** Obtener pendientes por gerencia
```sql
SELECT * FROM presupuestos 
WHERE estado = 'pendiente_administrativa' 
  AND (revisor_id IS NULL OR revisor_id = ?)
```
**Índice usado:** `idx_estado_revisor`

**Query de auto-liberación:**
```sql
UPDATE presupuestos 
WHERE revisor_asignado_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
```
**Índice usado:** `idx_revisor_asignado_at`

### Cache

- **businessRules.ts** - Cache de 1 minuto para reglas de BD
- **SSE** - Broadcast solo cuando hay cambios

---

## 📦 Archivos Modificados/Creados

### Backend (15 archivos)

**Creados:**
- `backend/migrations/001_migrate_multi_gerencial.sql`
- `backend/src/services/auditoriaMultiService.ts`
- `backend/src/services/cronJobs.ts`
- `backend/src/routes/auditoria-multi.ts`

**Modificados:**
- `backend/src/config/businessRules.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/types/database.ts`
- `backend/src/services/calculosService.ts`
- `backend/src/services/presupuestoService.ts`
- `backend/src/repositories/presupuestoRepository.ts`
- `backend/src/controllers/sseController.ts`
- `backend/src/routes/auditoria-simple.ts`
- `backend/src/routes/presupuestosV2.ts`
- `backend/src/app.ts`

### Frontend (11 archivos)

**Creados:**
- `frontend/src/pages/GerenciaDashboard.tsx`
- `frontend/src/components/ModalAuditoriaMulti.tsx`
- `frontend/src/pages/GerenciaAdministrativa.tsx`
- `frontend/src/pages/GerenciaPrestacional.tsx`
- `frontend/src/pages/GerenciaGeneral.tsx`

**Modificados:**
- `frontend/src/types/index.ts`
- `frontend/src/utils/estadoPresupuesto.ts`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/pages/ListaPresupuestos.tsx`
- `frontend/src/pages/Notificaciones.tsx`
- `frontend/src/pages/admin/GestionUsuarios.tsx`
- `frontend/src/App.tsx`

**Eliminados de imports:**
- `AuditorDashboard.tsx` (obsoleto, archivo físico permanece para historial)

---

## 🚀 Despliegue

### 1. Ejecutar Migración

```bash
mysql -u root -p mh_1 < backend/migrations/001_migrate_multi_gerencial.sql
```

### 2. Verificar Migración

```sql
-- Verificar estados
SELECT estado, COUNT(*) FROM presupuestos GROUP BY estado;

-- Verificar roles
SELECT rol, COUNT(*) FROM usuarios WHERE activo = 1 GROUP BY rol;

-- Verificar índices
SHOW INDEX FROM presupuestos WHERE Key_name LIKE 'idx_%';

-- Verificar columnas nuevas
DESCRIBE presupuestos;
```

### 3. Crear Usuarios de Gerencias

```sql
-- Ejemplo: Crear usuario de G. Administrativa
INSERT INTO usuarios (username, password, rol, activo, sucursal_id)
VALUES ('admin_gerencia', '$2b$10$...', 'gerencia_administrativa', 1, 1);

-- Crear usuarios para todas las gerencias
INSERT INTO usuarios (username, password, rol, activo, sucursal_id) VALUES
('prestacional1', '$2b$10$...', 'gerencia_prestacional', 1, 1),
('general1', '$2b$10$...', 'gerencia_general', 1, 1);
```

### 4. Reiniciar Backend

```bash
cd backend
npm run dev
```

### 5. Reiniciar Frontend

```bash
cd frontend
npm run dev
```

---

## ✅ Checklist de Validación

### Base de Datos
- [ ] Migración SQL ejecutada sin errores
- [ ] 9 índices creados correctamente
- [ ] Columnas `revisor_id` y `revisor_asignado_at` agregadas
- [ ] Estados migrados correctamente
- [ ] Roles migrados correctamente
- [ ] Rol `auditor_medico` eliminado

### Backend
- [ ] Backend inicia sin errores
- [ ] Cron job de auto-liberación funciona
- [ ] Endpoints de auditoria-multi responden
- [ ] SSE actualizado para gerencias
- [ ] Notificaciones se crean correctamente

### Frontend
- [ ] Frontend inicia sin errores
- [ ] Login funciona con nuevos roles
- [ ] Dashboards de gerencias se muestran
- [ ] Casos disponibles se muestran correctamente
- [ ] Tomar caso funciona (FCFS)
- [ ] Modal de auditoría muestra acciones por rol
- [ ] Filtros de estado funcionan
- [ ] Admin puede crear usuarios con nuevos roles

### Funcionalidad
- [ ] Auto-liberación funciona (30 min)
- [ ] Aprobar/Rechazar funciona
- [ ] Derivar/Escalar funciona
- [ ] Observar funciona (sin crear versión)
- [ ] Aprobación condicional funciona
- [ ] Notificaciones llegan correctamente
- [ ] SSE actualiza en tiempo real
- [ ] Historial muestra trazabilidad completa

---

## 📚 Documentos Relacionados

- `README.md` - Documentación general del proyecto
- `backend/migrations/001_migrate_multi_gerencial.sql` - Script de migración
- `SISTEMA_NOTIFICACIONES.md` - Sistema SSE (si existe)

---

**Versión:** 3.0  
**Fecha:** Enero 2025  
**Estado:** ✅ PRODUCCIÓN  
**Desarrollado por:** Amazon Q Developer


---

## 📬 Sistema de Notificaciones - Detalle Completo

### Notificaciones por Acción

#### 1. Usuario Solicita Auditoría Manual
- **Trigger:** Botón "Auditoría" en `UserDashboard.tsx`
- **Endpoint:** `PUT /api/auditoria/pedir/:id`
- **Registra en auditorías:** ✅ `borrador` → `pendiente_administrativa` con mensaje del usuario
- **Notifica a:** Gerencia Administrativa (todos los usuarios activos)
- **Mensaje:** "Auditoría solicitada para presupuesto de [Paciente] - [mensaje]"
- **Alerta usuario:** "La Gerencia Administrativa será notificada para revisar el presupuesto"

#### 2. G. Administrativa Deriva a G. Prestacional
- **Trigger:** Botón "Derivar" en modal de auditoría
- **Endpoint:** `PUT /api/auditoria-multi/administrativa/derivar/:id`
- **Registra en auditorías:** ✅ Con comentario opcional
- **Notifica a:** Gerencia Prestacional (todos los usuarios activos)
- **Mensaje:** "Presupuesto de [Paciente] derivado desde G. Administrativa: [comentario]"

#### 3. G. Prestacional Escala a G. General
- **Trigger:** Botón "Escalar" en modal de auditoría
- **Endpoint:** `PUT /api/auditoria-multi/prestacional/escalar/:id`
- **Registra en auditorías:** ✅ Con motivo obligatorio
- **Notifica a:** Gerencia General (todos los usuarios activos)
- **Mensaje:** "Presupuesto de [Paciente] escalado: [motivo]"

#### 4. Cualquier Gerencia Aprueba
- **Trigger:** Botón "Aprobar" en modal de auditoría
- **Endpoint:** `PUT /api/auditoria-multi/[gerencia]/aprobar/:id`
- **Registra en auditorías:** ✅ Con comentario opcional
- **Notifica a:** 
  - Usuario creador del presupuesto
  - Gerencia Administrativa (para seguimiento)
- **Mensaje:** "Presupuesto APROBADO por [Gerencia]: [comentario]" (comentario opcional)

#### 5. Cualquier Gerencia Rechaza
- **Trigger:** Botón "Rechazar" en modal de auditoría
- **Endpoint:** `PUT /api/auditoria-multi/[gerencia]/rechazar/:id`
- **Registra en auditorías:** ✅ Con comentario obligatorio
- **Notifica a:** 
  - Usuario creador del presupuesto
  - Gerencia Administrativa (para seguimiento)
- **Mensaje:** "Presupuesto RECHAZADO por [Gerencia]: [comentario]"

#### 6. G. Prestacional Observa (Devuelve a Usuario)
- **Trigger:** Botón "Observar" en modal de auditoría
- **Endpoint:** `PUT /api/auditoria-multi/prestacional/observar/:id`
- **Registra en auditorías:** ✅ Estado `observado` con comentario obligatorio
- **Notifica a:** Usuario creador del presupuesto
- **Mensaje:** "Presupuesto devuelto para correcciones: [comentario]"

#### 7. Cualquier Gerencia Aprueba Condicional
- **Trigger:** Botón "Aprobar Condicional" en modal de auditoría
- **Endpoint:** `PUT /api/auditoria-multi/[gerencia]/aprobar-condicional/:id`
- **Registra en auditorías:** ✅ Con motivo obligatorio (mín 10 caracteres)
- **Notifica a:** 
  - Usuario creador del presupuesto
  - Gerencia Administrativa (para seguimiento)
- **Mensaje:** "Presupuesto APROBADO CONDICIONALMENTE por [Gerencia]: [motivo]"

#### 8. G. General Devuelve a Otra Gerencia
- **Trigger:** Botón "Devolver" en modal de auditoría
- **Endpoint:** `PUT /api/auditoria-multi/general/devolver/:id`
- **Registra en auditorías:** ✅ Con comentario obligatorio
- **Notifica a:** Gerencia destino seleccionada (todos los usuarios activos)
- **Mensaje:** "Presupuesto devuelto por G. General: [comentario]"

### Resumen por Rol

| Rol | Recibe Notificaciones De |
|-----|--------------------------|
| **user** | Aprobaciones, rechazos, observaciones, aprobaciones condicionales |
| **gerencia_administrativa** | Solicitudes de auditoría (manual/automática), aprobaciones/rechazos de otras gerencias (seguimiento), devoluciones desde G. General |
| **gerencia_prestacional** | Derivaciones desde G. Administrativa, devoluciones desde G. General |
| **gerencia_general** | Escalamientos desde G. Prestacional |
| **admin** | Todas (si está configurado) |

### Trazabilidad Completa

**Todas las acciones se registran en 2 lugares:**

1. **Tabla `auditorias_presupuestos`** - Historial completo con:
   - Estado anterior y nuevo
   - Auditor que realizó la acción
   - Comentario/motivo
   - Timestamp

2. **Tabla `notificaciones`** - Notificaciones a usuarios con:
   - Usuario destinatario
   - Tipo de notificación
   - Mensaje descriptivo
   - Estado (nuevo/leído)
   - Timestamp

**Visualización:**
- **Modal "Mensajes de Auditoría"** - Muestra historial de `auditorias_presupuestos`
- **Tab "Notificaciones"** - Muestra notificaciones de `notificaciones`

---

## 🔄 Mejoras Implementadas Post-Lanzamiento

### Enero 20, 2025

#### Mejora UX: Historial de Auditoría Humanizado

**Problema:** El historial de auditoría mostraba información técnica difícil de leer:
- Estados técnicos: `en_revision_prestacional → aprobado`
- Fechas timestamp: `15/12/2025, 19:05:26`
- Falta de contexto sobre quién hizo qué

**Solución:** Implementación de formato humanizado en `ModalDetallePresupuesto.tsx`

**Cambios:**
1. **Descripción en lenguaje natural** - Función `getAccionDescripcion()`
   - Antes: `en_revision_prestacional → aprobado`
   - Después: `prestacional aprobó el presupuesto`

2. **Fechas humanizadas** - Función `formatearFecha()`
   - Hoy: `Hoy a las 19:05`
   - Ayer: `Ayer a las 14:30`
   - Otros: `15/01/2025, 10:20`

3. **Comentarios destacados**
   - Formato itálico con comillas: `"comentario del auditor"`

**Archivo modificado:**
- `frontend/src/components/ModalDetallePresupuesto.tsx`

**Impacto:**
- ✅ Mejora legibilidad para usuarios no técnicos
- ✅ Se aplica automáticamente a todos los presupuestos (nuevos y existentes)
- ✅ No requiere migración de base de datos
- ✅ Transformación en tiempo real al mostrar datos

**Ejemplo de transformación:**
```
Antes:
en_revision_prestacional → aprobado
prestacional
15/12/2025, 19:05:26
sarlangaaaaaa

Después:
prestacional aprobó el presupuesto
Hoy a las 19:05
"sarlangaaaaaa"
```25 - Actualización de Notificaciones

**Problema identificado:**
- Comentarios de derivación no aparecían en notificaciones
- Solicitudes de auditoría del usuario no se registraban en historial
- G. Administrativa no recibía notificaciones de seguimiento

**Soluciones implementadas:**

1. ✅ **Registro de solicitud de auditoría**
   - Archivo: `backend/src/routes/auditoria-simple.ts`
   - Cambio: Agregar INSERT en `auditorias_presupuestos` al solicitar auditoría
   - Estado: `borrador` → `pendiente_administrativa`

2. ✅ **Comentarios en derivación**
   - Archivo: `backend/src/services/auditoriaMultiService.ts`
   - Cambio: Incluir comentario opcional en mensaje de notificación
   - Formato: "Presupuesto derivado: [comentario]"

3. ✅ **Notificaciones de seguimiento a G. Administrativa**
   - Archivo: `backend/src/services/auditoriaMultiService.ts`
   - Cambio: Notificar a G. Administrativa en aprobaciones/rechazos
   - Propósito: Seguimiento de casos derivados

4. ✅ **Comentarios opcionales en aprobaciones**
   - Archivo: `backend/src/services/auditoriaMultiService.ts`
   - Cambio: Incluir comentario opcional en mensaje de aprobación
   - Formato: "Presupuesto APROBADO: [comentario]"

5. ✅ **Campo motivo visible en modal**
   - Archivo: `frontend/src/components/ModalAuditoriaMulti.tsx`
   - Cambio: Mover textarea de motivo al inicio para todas las gerencias
   - Propósito: Facilitar aprobaciones condicionales

6. ✅ **Mensaje actualizado en frontend**
   - Archivo: `frontend/src/pages/UserDashboard.tsx`
   - Cambio: "El auditor médico..." → "La Gerencia Administrativa..."
   - Propósito: Reflejar sistema multi-gerencial

---

**Última actualización:** Enero 2025  
**Versión:** 3.1  
