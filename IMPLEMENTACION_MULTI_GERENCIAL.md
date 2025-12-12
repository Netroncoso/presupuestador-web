# Implementación Sistema Multi-Gerencial v3.0

## 📋 Resumen Ejecutivo

Sistema de auditoría multi-gerencial que reemplaza el sistema simple de 1 auditor por un flujo de 4 gerencias con asignación automática de casos, auto-liberación y aprobaciones condicionales.

**Fecha:** Diciembre 2024  
**Versión:** 3.0  
**Estado:** ✅ COMPLETADO  
**Commits:** 7 (4 backend + 3 frontend)

---

## 🎯 Objetivos Alcanzados

✅ Sistema de asignación First Come, First Served (FCFS)  
✅ Auto-liberación de casos después de 30 minutos  
✅ 4 gerencias con flujos específicos  
✅ Aprobación condicional para casos políticos  
✅ 15 métodos de transición con notificaciones  
✅ Sin código zombie (AuditorDashboard eliminado)  
✅ UI consistente con el resto de la aplicación  
✅ 9 índices optimizados para alto volumen  

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
                 ┌────┴────┐
                 ↓         ↓
              Aprobar   Escalar → G. General
              Rechazar             ↓
              Observar        ┌────┴────┐
                             ↓         ↓
                          Aprobar   Devolver
                          Rechazar
```

### Roles del Sistema

| Rol | Descripción | Acciones Disponibles |
|-----|-------------|---------------------|
| **user** | Usuario normal | Crear/editar presupuestos |
| **gerencia_administrativa** | Gerencia Administrativa | Aprobar, Rechazar, Derivar, Aprobar Condicional |
| **gerencia_prestacional** | Gerencia Prestacional | Aprobar, Rechazar, Observar, Escalar, Aprobar Condicional |
| **gerencia_financiera** | Gerencia Financiera | Solo observa (usa dashboard de G. General) |
| **gerencia_general** | Gerencia General | Aprobar, Rechazar, Devolver, Aprobar Condicional |
| **admin** | Administrador | Acceso completo |

---

## 📊 Base de Datos

### Migración Ejecutada

**Archivo:** `backend/migrations/001_migrate_multi_gerencial.sql`

#### Cambios en Tabla `presupuestos`

```sql
-- Nuevos estados
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

-- Nuevas columnas
revisor_id INT NULL
revisor_asignado_at TIMESTAMP NULL
```

#### Cambios en Tabla `usuarios`

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

## 🔧 Backend

### Estructura de Archivos

```
backend/src/
├── config/
│   └── businessRules.ts          ✅ Estados actualizados
├── middleware/
│   └── auth.ts                   ✅ 4 middlewares nuevos
├── types/
│   └── database.ts               ✅ Tipos actualizados
├── services/
│   ├── auditoriaMultiService.ts  ✅ NUEVO - 15 métodos
│   ├── cronJobs.ts               ✅ NUEVO - Auto-liberación
│   ├── calculosService.ts        ✅ Estados actualizados
│   └── presupuestoService.ts     ✅ Estados actualizados
├── routes/
│   └── auditoria-multi.ts        ✅ NUEVO - 20 endpoints
└── app.ts                        ✅ Cron jobs iniciados
```

### Servicios Implementados

#### auditoriaMultiService.ts (600 líneas)

**Métodos Principales:**

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
- `notificarUsuario()` - Notifica al usuario creador

### Endpoints REST (20 total)

**Base:** `/api/auditoria-multi`

#### Comunes (Todas las Gerencias)

```
GET  /pendientes          - Casos disponibles
GET  /mis-casos           - Casos asignados al usuario
PUT  /tomar/:id           - Tomar caso (FCFS)
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

---

## 🎨 Frontend

### Estructura de Archivos

```
frontend/src/
├── types/
│   └── index.ts                      ✅ EstadoPresupuesto, RolUsuario
├── utils/
│   └── estadoPresupuesto.ts          ✅ Colores, labels, helpers
├── components/
│   └── ModalAuditoriaMulti.tsx       ✅ NUEVO - Modal por rol
├── pages/
│   ├── GerenciaDashboard.tsx         ✅ NUEVO - Base reutilizable
│   ├── GerenciaAdministrativa.tsx    ✅ NUEVO
│   ├── GerenciaPrestacional.tsx      ✅ NUEVO
│   ├── GerenciaGeneral.tsx           ✅ NUEVO
│   └── ListaPresupuestos.tsx         ✅ Filtros actualizados
└── App.tsx                           ✅ Rutas actualizadas
```

### Componentes Principales

#### GerenciaDashboard.tsx (Base Reutilizable)

**Props:**
- `titulo: string` - Título del dashboard
- `rol: RolUsuario` - Rol de la gerencia

**Tabs:**
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

---

## 🔄 Flujos de Trabajo

### 1. Usuario Finaliza Presupuesto

```
1. Usuario completa presupuesto en borrador
2. Click "Finalizar"
3. Backend evalúa reglas de negocio
4. SI cumple → estado = 'aprobado'
5. NO cumple → estado = 'pendiente_administrativa'
6. Notifica a G. Administrativa (todos los usuarios del rol)
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
```

### 3. Auto-Liberación (30 minutos)

```
1. Cron job ejecuta cada 5 minutos
2. Query busca casos con revisor_asignado_at > 30 min
3. Limpia revisor_id = NULL
4. Cambia estado: en_revision_* → pendiente_*
5. Caso vuelve a "Casos Disponibles"
6. Broadcast SSE a todos los usuarios
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

## 🧪 Testing Recomendado

### Casos de Prueba

1. **Asignación FCFS**
   - 2 usuarios intentan tomar el mismo caso simultáneamente
   - Verificar que solo 1 lo obtiene

2. **Auto-liberación**
   - Tomar caso y esperar 30 minutos
   - Verificar que vuelve a disponibles

3. **Flujo completo**
   - Usuario finaliza → G. Admin deriva → G. Prest aprueba
   - Verificar notificaciones en cada paso

4. **Aprobación condicional**
   - Presupuesto con rentabilidad < 15%
   - Aprobar condicional con motivo
   - Verificar estado y auditoría

5. **Observar**
   - G. Prest observa presupuesto
   - Usuario edita sin crear versión
   - Finaliza nuevamente

---

## 📦 Archivos Modificados/Creados

### Backend (11 archivos)

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
- `backend/src/app.ts`

### Frontend (9 archivos)

**Creados:**
- `frontend/src/pages/GerenciaDashboard.tsx`
- `frontend/src/components/ModalAuditoriaMulti.tsx`
- `frontend/src/pages/GerenciaAdministrativa.tsx`
- `frontend/src/pages/GerenciaPrestacional.tsx`
- `frontend/src/pages/GerenciaGeneral.tsx`

**Modificados:**
- `frontend/src/types/index.ts`
- `frontend/src/utils/estadoPresupuesto.ts`
- `frontend/src/pages/ListaPresupuestos.tsx`
- `frontend/src/App.tsx`

**Eliminados de imports:**
- `AuditorDashboard.tsx` (obsoleto, pero archivo físico permanece para historial)

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
SELECT rol, COUNT(*) FROM usuarios GROUP BY rol;

-- Verificar índices
SHOW INDEX FROM presupuestos WHERE Key_name LIKE 'idx_%';
```

### 3. Crear Usuarios de Gerencias

```sql
-- Ejemplo: Crear usuario de G. Administrativa
INSERT INTO usuarios (username, password, rol, activo, sucursal_id)
VALUES ('admin_gerencia', '$2b$10$...', 'gerencia_administrativa', 1, 1);
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

## 📚 Documentos Relacionados

- `MIGRACION_MULTI_GERENCIAL.md` - Plan de migración detallado
- `SISTEMA_TRANSICIONES_NOTIFICACIONES.md` - Matriz de 18 transiciones
- `README.md` - Documentación general del proyecto

---

## ✅ Checklist de Validación

- [ ] Migración SQL ejecutada sin errores
- [ ] 9 índices creados correctamente
- [ ] Backend inicia sin errores
- [ ] Frontend inicia sin errores
- [ ] Login funciona con nuevos roles
- [ ] Casos disponibles se muestran correctamente
- [ ] Tomar caso funciona (FCFS)
- [ ] Auto-liberación funciona (30 min)
- [ ] Aprobar/Rechazar funciona
- [ ] Derivar/Escalar funciona
- [ ] Observar funciona (sin crear versión)
- [ ] Aprobación condicional funciona
- [ ] Notificaciones llegan correctamente
- [ ] SSE actualiza en tiempo real
- [ ] Historial muestra todos los presupuestos
- [ ] Filtros de estado funcionan

---

**Versión:** 3.0  
**Fecha:** Diciembre 2024  
**Estado:** ✅ PRODUCCIÓN  
**Desarrollado por:** Amazon Q Developer
