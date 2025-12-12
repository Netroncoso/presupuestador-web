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

---

### 3. Tabla `presupuestos` - Agregar Sistema de Asignación

**Nuevas columnas:**
```sql
-- Columna para asignación de casos
ALTER TABLE presupuestos 
ADD COLUMN revisor_id INT NULL,
ADD COLUMN revisor_asignado_at TIMESTAMP NULL,
ADD FOREIGN KEY (revisor_id) REFERENCES usuarios(id);

-- Índice para performance
CREATE INDEX idx_revisor ON presupuestos(revisor_id);
CREATE INDEX idx_revisor_asignado ON presupuestos(revisor_asignado_at);
```

**Propósito:**
- `revisor_id`: Usuario que tomó el caso (NULL = disponible)
- `revisor_asignado_at`: Timestamp de asignación (para auto-liberación)

---

### 4. Tabla `auditorias_presupuestos` - Sin cambios estructurales

**Estado:** ✅ Compatible - Solo cambian los valores de `estado_anterior` y `estado_nuevo`

---

### 5. Tabla `notificaciones` - Sin cambios estructurales

**Estado:** ✅ Compatible - Solo cambian los valores de `tipo`

---

## 🎯 Sistema de Asignación de Casos (Multi-Usuario)

### Problema
Con múltiples usuarios por gerencia, necesitamos evitar que 2 personas trabajen el mismo caso simultáneamente.

### Solución: Asignación Automática con FOR UPDATE + Auto-Liberación

**Flujo:**
1. Usuario hace clic en "Auditar" o "Ir a auditoría"
2. Backend ejecuta `tomarCaso()` con transacción atómica
3. Si libre → Asigna `revisor_id` + timestamp + cambia estado
4. Si ocupado → Error: "Ya está siendo revisado por [username]"
5. Auto-liberación después de 30 minutos de inactividad

---

### Implementación Backend

#### Endpoint: Tomar Caso

```typescript
// backend/src/routes/auditoria-multi.ts
router.put('/tomar/:id', auth, requireAnyGerencia, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const usuarioId = req.user.id;
  
  try {
    const resultado = await auditoriaService.tomarCaso(id, usuarioId);
    res.json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

#### Servicio: Lógica Atómica

```typescript
// backend/src/services/auditoriaService.ts
async tomarCaso(presupuestoId: number, usuarioId: number) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Lock row para evitar race conditions
    const [presupuesto] = await connection.query(
      `SELECT p.*, u.username as revisor_nombre
       FROM presupuestos p
       LEFT JOIN usuarios u ON p.revisor_id = u.id
       WHERE p.idPresupuestos = ? 
       FOR UPDATE`,
      [presupuestoId]
    );
    
    if (presupuesto.length === 0) {
      throw new Error('Presupuesto no encontrado');
    }
    
    const caso = presupuesto[0];
    
    // Verificar si ya está asignado
    if (caso.revisor_id !== null && caso.revisor_id !== usuarioId) {
      throw new Error(`Ya está siendo revisado por ${caso.revisor_nombre}`);
    }
    
    // Si ya es el revisor, solo retornar éxito
    if (caso.revisor_id === usuarioId) {
      await connection.commit();
      return { success: true, yaAsignado: true };
    }
    
    // Asignar caso al usuario
    await connection.query(
      `UPDATE presupuestos 
       SET revisor_id = ?, 
           revisor_asignado_at = NOW(),
           estado = REPLACE(estado, 'pendiente', 'en_revision')
       WHERE idPresupuestos = ?`,
      [usuarioId, presupuestoId]
    );
    
    await connection.commit();
    
    // Broadcast SSE a otros usuarios
    broadcastPresupuestoUpdate();
    
    return { success: true, yaAsignado: false };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

#### Cron Job: Auto-Liberación (30 minutos)

```typescript
// backend/src/services/auditoriaService.ts
async autoLiberarCasosInactivos() {
  try {
    const [result] = await pool.query(
      `UPDATE presupuestos 
       SET revisor_id = NULL,
           revisor_asignado_at = NULL,
           estado = REPLACE(estado, 'en_revision', 'pendiente')
       WHERE revisor_id IS NOT NULL
         AND revisor_asignado_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
         AND estado LIKE '%en_revision%'`
    );
    
    if ((result as any).affectedRows > 0) {
      console.log(`Auto-liberados ${(result as any).affectedRows} casos inactivos`);
      broadcastPresupuestoUpdate();
    }
  } catch (error) {
    console.error('Error en auto-liberación:', error);
  }
}

// Ejecutar cada 5 minutos
setInterval(() => {
  auditoriaService.autoLiberarCasosInactivos();
}, 5 * 60 * 1000);
```

#### Validación en Acciones

```typescript
// backend/src/services/auditoriaService.ts
async aprobarAdministrativa(id: number, auditorId: number, comentario?: string) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Verificar que sea el revisor asignado
    const [presupuesto] = await connection.query(
      'SELECT revisor_id FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    if (presupuesto[0].revisor_id !== auditorId) {
      throw new Error('No tienes permiso para auditar este caso');
    }
    
    // Aprobar y limpiar asignación
    await connection.query(
      `UPDATE presupuestos 
       SET estado = 'aprobado',
           revisor_id = NULL,
           revisor_asignado_at = NULL
       WHERE idPresupuestos = ?`,
      [id]
    );
    
    // Registrar auditoría
    await connection.query(
      `INSERT INTO auditorias_presupuestos 
       (presupuesto_id, auditor_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, 'en_revision_administrativa', 'aprobado', ?)`,
      [id, auditorId, comentario]
    );
    
    await connection.commit();
    return { success: true };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

---

### Implementación Frontend

#### Modificar Query de Pendientes

```typescript
// AuditorDashboard.tsx
const cargarPendientes = async () => {
  try {
    const response = await api.get('/presupuestos/auditor/pendientes');
    // Backend filtra: casos disponibles O asignados a mí
    setPendientes(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### Backend: Query Modificada

```typescript
// backend/src/routes/auditoria-simple.ts (o auditoria-multi.ts)
router.get('/pendientes', auth, requireAuditor, async (req: any, res) => {
  const userId = req.user.id;
  
  const [rows] = await pool.query(`
    SELECT 
      p.*,
      u.username as revisor_nombre,
      TIMESTAMPDIFF(MINUTE, p.revisor_asignado_at, NOW()) as minutos_asignado
    FROM presupuestos p
    LEFT JOIN usuarios u ON p.revisor_id = u.id
    WHERE p.es_ultima_version = 1
      AND (
        (p.estado = 'pendiente_administrativa' AND p.revisor_id IS NULL)
        OR (p.estado = 'en_revision_administrativa' AND p.revisor_id = ?)
      )
    ORDER BY p.created_at ASC
  `, [userId]);
  
  res.json(rows);
});
```

#### Agregar Columna "Revisor" en Tabla

```typescript
// AuditorDashboard.tsx - Tabla de pendientes
<Table.Thead>
  <Table.Tr>
    <Table.Th>Paciente</Table.Th>
    <Table.Th>Versión</Table.Th>
    <Table.Th>Estado</Table.Th>
    <Table.Th>Costo</Table.Th>
    <Table.Th>Rentabilidad</Table.Th>
    <Table.Th>Días Pendiente</Table.Th>
    <Table.Th>Creador</Table.Th>
    <Table.Th>Revisor</Table.Th> {/* NUEVA COLUMNA */}
    <Table.Th>Acciones</Table.Th>
  </Table.Tr>
</Table.Thead>

<Table.Tbody>
  {pendientes.map((presupuesto) => (
    <Table.Tr key={presupuesto.idPresupuestos}>
      {/* ... otras columnas ... */}
      
      <Table.Td>
        {presupuesto.revisor_id === null ? (
          <Text size="sm" c="dimmed">-</Text>
        ) : presupuesto.revisor_id === user.id ? (
          <Badge size="sm" color="blue">Asignado a ti</Badge>
        ) : (
          <Text size="sm" c="dimmed">{presupuesto.revisor_nombre}</Text>
        )}
      </Table.Td>
      
      <Table.Td>
        {presupuesto.revisor_id === null ? (
          <ActionIcon onClick={() => tomarCaso(presupuesto.idPresupuestos)}>
            <ShieldCheckIcon />
          </ActionIcon>
        ) : presupuesto.revisor_id === user.id ? (
          <ActionIcon onClick={() => abrirModal(presupuesto)}>
            <ShieldCheckIcon />
          </ActionIcon>
        ) : (
          <Text size="sm" c="dimmed">Ocupado</Text>
        )}
      </Table.Td>
    </Table.Tr>
  ))}
</Table.Tbody>
```

#### Función tomarCaso

```typescript
// AuditorDashboard.tsx
const tomarCaso = async (presupuestoId: number) => {
  try {
    await api.put(`/auditoria/tomar/${presupuestoId}`);
    
    // Recargar pendientes
    await cargarPendientes();
    
    // Abrir modal de auditoría
    const presupuesto = pendientes.find(p => p.idPresupuestos === presupuestoId);
    setSelectedPresupuesto(presupuesto);
    
    notifications.show({
      title: 'Caso asignado',
      message: 'El caso ha sido asignado a ti',
      color: 'green'
    });
    
  } catch (error) {
    notifications.show({
      title: 'Caso no disponible',
      message: error.response?.data?.error || 'Error al tomar el caso',
      color: 'orange'
    });
    
    // Recargar para actualizar estado
    await cargarPendientes();
  }
};
```

#### Modificar Botón "Ir a auditoría" en Notificaciones

```typescript
// Notificaciones.tsx
const irAAuditoria = async (presupuestoId: number) => {
  try {
    // Intentar tomar el caso
    await api.put(`/auditoria/tomar/${presupuestoId}`);
    
    // Si éxito, ir a tab pendientes y abrir modal
    onIrAuditoria(presupuestoId);
    
  } catch (error) {
    notifications.show({
      title: 'Caso no disponible',
      message: error.response?.data?.error || 'Ya está siendo revisado',
      color: 'orange'
    });
    
    // Ir a tab pendientes para ver estado
    onIrAuditoria(presupuestoId);
  }
};
```

#### SSE: Evento de Caso Tomado

```typescript
// useRealtimeUpdates.tsx
useEffect(() => {
  const eventSource = new EventSource(`${API_URL}/stream/sse`);
  
  eventSource.addEventListener('caso_tomado', (event) => {
    const data = JSON.parse(event.data);
    
    // Actualizar lista de pendientes
    cargarPendientes();
    
    // Notificar si estabas viendo ese caso
    if (casoViendoActualmente === data.presupuestoId) {
      notifications.show({
        title: 'Caso tomado',
        message: `${data.revisorNombre} tomó este caso`,
        color: 'blue'
      });
    }
  });
}, []);
```

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

export const requireAnyGerencia = (req: any, res: any, next: any) => {
  const gerencias = [
    'gerencia_administrativa',
    'gerencia_prestacional',
    'gerencia_financiera',
    'gerencia_general',
    'admin'
  ];
  if (!gerencias.includes(req.user?.rol)) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  next();
};
```

---

### 3. `backend/src/routes/auditoria-multi.ts` - 🔴 CREAR NUEVO

```typescript
// Sistema de asignación
PUT    /api/auditoria/tomar/:id

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
GET    /api/auditoria/historial/:id
```

---

### 4. `backend/src/app.ts` - 🟡 AGREGAR Cron Job

```typescript
import { auditoriaService } from './services/auditoriaService';

// Auto-liberación cada 5 minutos
setInterval(() => {
  auditoriaService.autoLiberarCasosInactivos();
}, 5 * 60 * 1000);
```

---

## 🎨 Cambios en Frontend (REUTILIZACIÓN)

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
  revisor_id?: number | null;
  revisor_nombre?: string;
  minutos_asignado?: number;
}
```

---

### 2. `frontend/src/pages/AuditorDashboard.tsx` - 🟡 MODIFICAR

**Cambios:**
- Agregar columna "Revisor" en tabla
- Modificar botón "Auditar" para llamar `tomarCaso()`
- Agregar función `tomarCaso()`
- Modificar query de pendientes (backend ya filtra)

---

### 3. `frontend/src/pages/Notificaciones.tsx` - 🟡 MODIFICAR

**Cambios:**
- Modificar botón "Ir a auditoría" para llamar `tomarCaso()` primero
- Manejar error si caso ya tomado

---

### 4. Componente Base Reutilizable - 🟢 CREAR

**Archivo:** `frontend/src/components/GerenciaDashboardBase.tsx`

Reutiliza toda la lógica de `AuditorDashboard.tsx` con props configurables.

---

## 📦 Archivos Nuevos

### Backend
```
✅ backend/src/routes/auditoria-multi.ts
✅ backend/migrations/migrate_to_multi_gerencial.sql
```

### Frontend
```
✅ frontend/src/components/GerenciaDashboardBase.tsx
✅ frontend/src/pages/GerenciaAdministrativaDashboard.tsx
✅ frontend/src/pages/GerenciaPrestacionalDashboard.tsx
✅ frontend/src/pages/GerenciaFinancieraDashboard.tsx
✅ frontend/src/pages/GerenciaGeneralDashboard.tsx
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
3. ✅ Agregar columnas `revisor_id` y `revisor_asignado_at`
4. ✅ Crear índices
5. ✅ Crear usuarios de prueba

### Fase 3: Backend (3 horas)
1. ✅ Actualizar `businessRules.ts`
2. ✅ Crear middlewares en `auth.ts`
3. ✅ Implementar `tomarCaso()` con FOR UPDATE
4. ✅ Implementar `autoLiberarCasosInactivos()`
5. ✅ Crear `auditoria-multi.ts`
6. ✅ Agregar cron job en `app.ts`
7. ✅ Testing de endpoints

### Fase 4: Frontend (2 horas)
1. ✅ Actualizar `types/index.ts`
2. ✅ Modificar `AuditorDashboard.tsx` (+ columna, + tomarCaso)
3. ✅ Modificar `Notificaciones.tsx`
4. ✅ Crear `GerenciaDashboardBase.tsx`
5. ✅ Crear 4 dashboards específicos

### Fase 5: Testing (1 hora)
1. ✅ Testing de asignación simultánea
2. ✅ Testing de auto-liberación
3. ✅ Testing de flujo por gerencia

### Fase 6: Deploy (30 min)
1. ✅ Merge a `main`
2. ✅ Deploy
3. ✅ Verificar producción

---

## ⚠️ Ventajas del Sistema de Asignación

- ✅ Sin race conditions (FOR UPDATE)
- ✅ Error claro si caso ocupado
- ✅ Auto-liberación después de 30 min
- ✅ Sin botones extra (asignación automática)
- ✅ SSE notifica cambios en tiempo real
- ✅ Reutiliza vistas existentes (+ 1 columna)

---

**Fecha:** Enero 2025  
**Versión:** 3.0 (con asignación de casos)  
**Estado:** 📝 PLANIFICACIÓN
