# Migración a Sistema Multi-Gerencial

## 📋 Resumen Ejecutivo

**Objetivo**: Migrar de sistema de auditoría simple (1 auditor) a sistema multi-gerencial (4 gerencias + admin).

**Impacto**: 🔴 ALTO - Cambios estructurales en BD, backend y frontend

**Tiempo estimado**: 6-8 horas de desarrollo + testing (reducido por reutilización de código)

**Riesgo**: MEDIO - Requiere migración de datos existentes

**Estrategia**: Reutilizar componentes existentes de `AuditorDashboard` y `ModalAuditoria`

---

## 🗄️ Cambios en Base de Datos

### 1. Tabla `usuarios` - Roles

**Estado Actual:**
```sql
rol ENUM('user', 'auditor_medico', 'admin')
```

**Estado Nuevo:**
```sql
rol ENUM('user', 'gerencia_administrativa', 'gerencia_prestacional', 'gerencia_financiera', 'gerencia_general', 'admin')
```

**Migración:**
```sql
-- Paso 1: Agregar nuevos roles
ALTER TABLE usuarios MODIFY COLUMN rol ENUM(
  'user', 
  'auditor_medico',  -- DEPRECADO - mantener temporalmente
  'gerencia_administrativa', 
  'gerencia_prestacional', 
  'gerencia_financiera',
  'gerencia_general',
  'admin'
);

-- Paso 2: Migrar usuarios existentes
UPDATE usuarios 
SET rol = 'gerencia_administrativa' 
WHERE rol = 'auditor_medico';

-- Paso 3: Remover rol deprecado (después de validar)
ALTER TABLE usuarios MODIFY COLUMN rol ENUM(
  'user', 
  'gerencia_administrativa', 
  'gerencia_prestacional', 
  'gerencia_financiera',
  'gerencia_general',
  'admin'
);
```

**Impacto:**
- ✅ Usuarios existentes migrados automáticamente
- ⚠️ Sesiones activas se invalidarán (re-login requerido)

---

### 2. Tabla `presupuestos` - Estados

**Estado Actual:**
```sql
estado ENUM('borrador', 'pendiente', 'en_revision', 'aprobado', 'rechazado')
```

**Estado Nuevo:**
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
  'rechazado',
  'observado'
)
```

**Migración:**
```sql
-- Paso 1: Agregar nuevos estados
ALTER TABLE presupuestos MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente',  -- DEPRECADO
  'en_revision',  -- DEPRECADO
  'pendiente_administrativa',
  'en_revision_administrativa',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'rechazado',
  'observado'
);

-- Paso 2: Migrar estados existentes
UPDATE presupuestos 
SET estado = 'pendiente_administrativa' 
WHERE estado = 'pendiente';

UPDATE presupuestos 
SET estado = 'en_revision_administrativa' 
WHERE estado = 'en_revision';

-- Paso 3: Remover estados deprecados (después de validar)
ALTER TABLE presupuestos MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente_administrativa',
  'en_revision_administrativa',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'rechazado',
  'observado'
);
```

**Impacto:**
- ✅ Presupuestos existentes migrados automáticamente
- ⚠️ Historial mantiene integridad
- ⚠️ Filtros en frontend dejarán de funcionar temporalmente

---

### 3. Tabla `auditorias_presupuestos` - Sin cambios estructurales

**Estado:** ✅ Compatible - Solo cambian los valores de `estado_anterior` y `estado_nuevo`

---

### 4. Tabla `notificaciones` - Sin cambios estructurales

**Estado:** ✅ Compatible - Solo cambian los valores de `tipo`

---

## 🔧 Cambios en Backend

### 1. `backend/src/config/businessRules.ts` - 🔴 MODIFICAR

```typescript
estados: {
  validos: [
    'borrador',
    'pendiente_administrativa',
    'en_revision_administrativa',
    'pendiente_prestacional',
    'en_revision_prestacional',
    'pendiente_general',
    'en_revision_general',
    'aprobado',
    'rechazado',
    'observado'
  ],
  iniciales: ['borrador'],
  finales: ['aprobado', 'rechazado'],
  requierenNotificacion: ['aprobado', 'rechazado', 'observado'],
  porGerencia: {
    administrativa: ['pendiente_administrativa', 'en_revision_administrativa'],
    prestacional: ['pendiente_prestacional', 'en_revision_prestacional'],
    general: ['pendiente_general', 'en_revision_general']
  }
}
```

---

### 2. `backend/src/middleware/auth.ts` - 🟡 AGREGAR

```typescript
export const requireGerenciaAdministrativa = (req: any, res: any, next: any) => {
  if (!['gerencia_administrativa', 'gerencia_general', 'admin'].includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};

export const requireGerenciaPrestacional = (req: any, res: any, next: any) => {
  if (!['gerencia_prestacional', 'gerencia_general', 'admin'].includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};

export const requireGerenciaFinanciera = (req: any, res: any, next: any) => {
  if (!['gerencia_financiera', 'gerencia_general', 'admin'].includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};

export const requireGerenciaGeneral = (req: any, res: any, next: any) => {
  if (!['gerencia_general', 'admin'].includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};
```

---

### 3. `backend/src/routes/auditoria-multi.ts` - 🔴 CREAR NUEVO

```typescript
// Gerencia Administrativa
GET    /api/auditoria/administrativa/pendientes
PUT    /api/auditoria/administrativa/aprobar/:id
PUT    /api/auditoria/administrativa/rechazar/:id
PUT    /api/auditoria/administrativa/derivar/:id

// Gerencia Prestacional
GET    /api/auditoria/prestacional/pendientes
PUT    /api/auditoria/prestacional/aprobar/:id
PUT    /api/auditoria/prestacional/rechazar/:id
PUT    /api/auditoria/prestacional/observar/:id
PUT    /api/auditoria/prestacional/escalar/:id

// Gerencia Financiera
GET    /api/auditoria/financiera/dashboard
GET    /api/auditoria/financiera/alertas
PUT    /api/auditoria/financiera/escalar/:id

// Gerencia General
GET    /api/auditoria/general/pendientes
PUT    /api/auditoria/general/aprobar/:id
PUT    /api/auditoria/general/rechazar/:id
PUT    /api/auditoria/general/devolver/:id

// Común
GET    /api/auditoria/historial/:id  (mantener)
```

---

### 4. `backend/src/services/auditoriaService.ts` - 🟡 EXTENDER

Agregar métodos específicos por gerencia manteniendo `cambiarEstado` como fallback.

---

### 5. `backend/src/controllers/presupuestosControllerV2.ts` - 🟡 MODIFICAR

```typescript
// Cambiar estado inicial de auditoría
if (requiereAuditoria) {
  estado = 'pendiente_administrativa';  // Siempre va a G. Admin primero
}
```

---

## 🎨 Cambios en Frontend (ESTRATEGIA DE REUTILIZACIÓN)

### 1. `frontend/src/types/index.ts` - 🔴 MODIFICAR

```typescript
export interface Usuario {
  rol: 'admin' | 'user' | 'gerencia_administrativa' | 'gerencia_prestacional' | 'gerencia_financiera' | 'gerencia_general';
}

export interface Presupuesto {
  estado?: 
    | 'borrador'
    | 'pendiente_administrativa'
    | 'en_revision_administrativa'
    | 'pendiente_prestacional'
    | 'en_revision_prestacional'
    | 'pendiente_general'
    | 'en_revision_general'
    | 'aprobado'
    | 'rechazado'
    | 'observado';
}
```

---

### 2. `frontend/src/utils/estadoPresupuesto.ts` - 🔴 MODIFICAR

```typescript
export const getEstadoLabel = (estado?: string): string => {
  const labels: Record<string, string> = {
    'borrador': 'BORRADOR',
    'pendiente_administrativa': 'PEND. ADMIN',
    'en_revision_administrativa': 'REV. ADMIN',
    'pendiente_prestacional': 'PEND. PRESTACIONAL',
    'en_revision_prestacional': 'REV. PRESTACIONAL',
    'pendiente_general': 'PEND. GENERAL',
    'en_revision_general': 'REV. GENERAL',
    'aprobado': 'APROBADO',
    'rechazado': 'RECHAZADO',
    'observado': 'OBSERVADO'
  };
  return labels[estado || ''] || 'BORRADOR';
};
```

---

### 3. COMPONENTE BASE REUTILIZABLE - 🟢 CREAR

**Archivo:** `frontend/src/components/GerenciaDashboardBase.tsx`

```typescript
interface GerenciaDashboardBaseProps {
  titulo: string;
  rol: string;
  endpointPendientes: string;
  accionesDisponibles: {
    aprobar?: boolean;
    rechazar?: boolean;
    derivar?: boolean;
    observar?: boolean;
    escalar?: boolean;
  };
  onAccion: (accion: string, id: number, comentario?: string) => Promise<void>;
}

export function GerenciaDashboardBase(props: GerenciaDashboardBaseProps) {
  // Reutiliza toda la lógica de AuditorDashboard.tsx
  // - Tabs (Pendientes, Historial, Notificaciones)
  // - Tabla de pendientes
  // - Filtros
  // - SSE para actualizaciones en tiempo real
  // - Botones de acción configurables según props
}
```

**Uso:**
```typescript
// GerenciaAdministrativaDashboard.tsx
<GerenciaDashboardBase
  titulo="Gerencia Administrativa"
  rol="gerencia_administrativa"
  endpointPendientes="/auditoria/administrativa/pendientes"
  accionesDisponibles={{ aprobar: true, rechazar: true, derivar: true }}
  onAccion={handleAccion}
/>

// GerenciaPrestacionalDashboard.tsx
<GerenciaDashboardBase
  titulo="Gerencia Prestacional"
  rol="gerencia_prestacional"
  endpointPendientes="/auditoria/prestacional/pendientes"
  accionesDisponibles={{ aprobar: true, rechazar: true, observar: true, escalar: true }}
  onAccion={handleAccion}
/>
```

---

### 4. MODAL BASE REUTILIZABLE - 🟡 REFACTORIZAR

**Archivo:** `frontend/src/components/ModalAuditoria.tsx` → `ModalAuditoriaBase.tsx`

```typescript
interface ModalAuditoriaBaseProps {
  opened: boolean;
  onClose: () => void;
  presupuesto: any;
  acciones: Array<{
    label: string;
    color: string;
    accion: string;
    requiereComentario?: boolean;
  }>;
  onConfirmar: (accion: string, comentario?: string) => void;
  loading: boolean;
}

export function ModalAuditoriaBase(props: ModalAuditoriaBaseProps) {
  // Reutiliza lógica de ModalAuditoria.tsx
  // - Muestra datos del presupuesto
  // - Botones dinámicos según props.acciones
  // - Validación de comentario si requiereComentario=true
}
```

**Uso:**
```typescript
// En G. Administrativa
<ModalAuditoriaBase
  acciones={[
    { label: 'Aprobar', color: 'green', accion: 'aprobar' },
    { label: 'Rechazar', color: 'red', accion: 'rechazar', requiereComentario: true },
    { label: 'Derivar a Prestacional', color: 'blue', accion: 'derivar' }
  ]}
  {...otherProps}
/>

// En G. Prestacional
<ModalAuditoriaBase
  acciones={[
    { label: 'Aprobar', color: 'green', accion: 'aprobar' },
    { label: 'Rechazar', color: 'red', accion: 'rechazar', requiereComentario: true },
    { label: 'Observar', color: 'orange', accion: 'observar', requiereComentario: true },
    { label: 'Escalar a General', color: 'purple', accion: 'escalar', requiereComentario: true }
  ]}
  {...otherProps}
/>
```

---

### 5. DASHBOARDS ESPECÍFICOS - 🟢 CREAR (4 archivos livianos)

```
✅ frontend/src/pages/GerenciaAdministrativaDashboard.tsx (~50 líneas)
✅ frontend/src/pages/GerenciaPrestacionalDashboard.tsx (~60 líneas)
✅ frontend/src/pages/GerenciaFinancieraDashboard.tsx (~80 líneas - dashboard especial)
✅ frontend/src/pages/GerenciaGeneralDashboard.tsx (~70 líneas - funciones override)
```

Cada uno solo configura el componente base con sus props específicas.

---

### 6. `frontend/src/pages/ListaPresupuestos.tsx` - 🟡 MODIFICAR

Actualizar filtro de estados con los nuevos valores.

---

### 7. Router - 🟡 MODIFICAR

```typescript
{user.rol === 'gerencia_administrativa' && <Route path="/administrativa" element={<GerenciaAdministrativaDashboard />} />}
{user.rol === 'gerencia_prestacional' && <Route path="/prestacional" element={<GerenciaPrestacionalDashboard />} />}
{user.rol === 'gerencia_financiera' && <Route path="/financiera" element={<GerenciaFinancieraDashboard />} />}
{user.rol === 'gerencia_general' && <Route path="/general" element={<GerenciaGeneralDashboard />} />}
```

---

## 🗑️ Archivos a Eliminar

### Backend
```
❌ backend/src/routes/auditoria-simple.ts
```

### Frontend
```
✅ NINGUNO - Todo se refactoriza y reutiliza
```

---

## 📦 Archivos Nuevos

### Backend
```
✅ backend/src/routes/auditoria-multi.ts
✅ backend/migrations/migrate_to_multi_gerencial.sql
```

### Frontend
```
✅ frontend/src/components/GerenciaDashboardBase.tsx (componente base)
✅ frontend/src/pages/GerenciaAdministrativaDashboard.tsx (50 líneas)
✅ frontend/src/pages/GerenciaPrestacionalDashboard.tsx (60 líneas)
✅ frontend/src/pages/GerenciaFinancieraDashboard.tsx (80 líneas)
✅ frontend/src/pages/GerenciaGeneralDashboard.tsx (70 líneas)
```

### Frontend - Refactorizaciones
```
🔄 frontend/src/components/ModalAuditoria.tsx → ModalAuditoriaBase.tsx
🔄 frontend/src/pages/AuditorDashboard.tsx → Mantener como referencia
```

---

## 🔄 Plan de Migración

### Fase 1: Preparación (1 hora)
1. ✅ Backup completo de BD
2. ✅ Crear rama `feature/multi-gerencial`
3. ✅ Crear scripts de migración SQL

### Fase 2: Base de Datos (1 hora)
1. ✅ Ejecutar migración de roles
2. ✅ Ejecutar migración de estados
3. ✅ Verificar integridad
4. ✅ Crear usuarios de prueba

### Fase 3: Backend (2-3 horas)
1. ✅ Actualizar `businessRules.ts`
2. ✅ Crear middlewares en `auth.ts`
3. ✅ Crear `auditoria-multi.ts`
4. ✅ Extender `auditoriaService.ts`
5. ✅ Modificar `presupuestosControllerV2.ts`
6. ✅ Testing de endpoints

### Fase 4: Frontend - Base (1.5 horas)
1. ✅ Actualizar `types/index.ts`
2. ✅ Actualizar `estadoPresupuesto.ts`
3. ✅ Extraer lógica de `AuditorDashboard.tsx`
4. ✅ Crear `GerenciaDashboardBase.tsx`
5. ✅ Refactorizar `ModalAuditoria.tsx` → `ModalAuditoriaBase.tsx`

### Fase 5: Frontend - Dashboards (1.5 horas)
1. ✅ Crear 4 dashboards específicos (usan base)
2. ✅ Actualizar router
3. ✅ Modificar `ListaPresupuestos.tsx`

### Fase 6: Testing (1-2 horas)
1. ✅ Testing de flujo por gerencia
2. ✅ Testing de permisos
3. ✅ Testing de notificaciones

### Fase 7: Documentación (30 min)
1. ✅ Actualizar README.md
2. ✅ Actualizar ARCHITECTURE_V2.md

### Fase 8: Deploy (30 min)
1. ✅ Merge a `main`
2. ✅ Deploy
3. ✅ Verificar producción

---

## ⚠️ Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Pérdida de datos | BAJA | CRÍTICO | Backup completo |
| Sesiones invalidadas | ALTA | BAJO | Comunicar re-login |
| Confusión de usuarios | ALTA | MEDIO | Capacitación |

---

## 📊 Ventajas de la Reutilización

- ✅ Reduce tiempo de 8-12h a 6-8h
- ✅ Mantiene consistencia visual
- ✅ Facilita mantenimiento futuro
- ✅ Menos código duplicado (~70% de reutilización)
- ✅ Testing más simple (1 componente base)

---

**Fecha:** Enero 2025  
**Versión:** 2.0 (con reutilización)  
**Estado:** 📝 PLANIFICACIÓN
