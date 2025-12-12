# Sistema de Transiciones y Notificaciones Multi-Gerencial

## 📋 Resumen

Documento que detalla TODAS las transiciones de estado posibles en el sistema multi-gerencial, incluyendo:
- Limpieza de `revisor_id` en cada transición
- Notificaciones a usuarios/gerencias correspondientes
- Registro en tabla `auditorias_presupuestos`

---

## 🔄 Matriz Completa de Transiciones

| # | Desde | Hacia | Acción | Gerencia | Limpia revisor_id | Notifica a | Mensaje |
|---|-------|-------|--------|----------|-------------------|------------|---------|
| 1 | `borrador` | `pendiente_administrativa` | Finalizar | Usuario | N/A | G. Administrativa | "Presupuesto de [paciente] requiere auditoría" |
| 2 | `borrador` | `aprobado` | Finalizar (auto) | Sistema | N/A | Usuario creador | "Presupuesto aprobado automáticamente" |
| 3 | `pendiente_administrativa` | `en_revision_administrativa` | Tomar caso | G. Admin | ❌ NO (asigna) | - | - |
| 4 | `en_revision_administrativa` | `aprobado` | Aprobar | G. Admin | ✅ SÍ | Usuario creador | "Presupuesto APROBADO por G. Administrativa" |
| 4b | `en_revision_administrativa` | `aprobado_condicional` | Aprobar Condicional | G. Admin | ✅ SÍ | Usuario creador | "Presupuesto APROBADO CONDICIONALMENTE: [motivo]" |
| 5 | `en_revision_administrativa` | `rechazado` | Rechazar | G. Admin | ✅ SÍ | Usuario creador | "Presupuesto RECHAZADO: [comentario]" |
| 6 | `en_revision_administrativa` | `pendiente_prestacional` | Derivar | G. Admin | ✅ SÍ | G. Prestacional | "Presupuesto de [paciente] derivado desde G. Administrativa" |
| 7 | `pendiente_prestacional` | `en_revision_prestacional` | Tomar caso | G. Prest | ❌ NO (asigna) | - | - |
| 8 | `en_revision_prestacional` | `aprobado` | Aprobar | G. Prest | ✅ SÍ | Usuario creador | "Presupuesto APROBADO por G. Prestacional" |
| 8b | `en_revision_prestacional` | `aprobado_condicional` | Aprobar Condicional | G. Prest | ✅ SÍ | Usuario creador | "Presupuesto APROBADO CONDICIONALMENTE: [motivo]" |
| 9 | `en_revision_prestacional` | `rechazado` | Rechazar | G. Prest | ✅ SÍ | Usuario creador | "Presupuesto RECHAZADO: [comentario]" |
| 10 | `en_revision_prestacional` | `borrador` | Observar | G. Prest | ✅ SÍ | Usuario creador | "Presupuesto devuelto para correcciones: [comentario]" |
| 11 | `en_revision_prestacional` | `pendiente_general` | Escalar | G. Prest | ✅ SÍ | G. General | "Presupuesto escalado: [motivo]" |
| 13 | `pendiente_general` | `en_revision_general` | Tomar caso | G. General | ❌ NO (asigna) | - | - |
| 14 | `en_revision_general` | `aprobado` | Aprobar | G. General | ✅ SÍ | Usuario creador | "Presupuesto APROBADO por Gerencia General" |
| 14b | `en_revision_general` | `aprobado_condicional` | Aprobar Condicional | G. General | ✅ SÍ | Usuario creador | "Presupuesto APROBADO CONDICIONALMENTE: [motivo]" |
| 15 | `en_revision_general` | `rechazado` | Rechazar | G. General | ✅ SÍ | Usuario creador | "Presupuesto RECHAZADO por Gerencia General: [comentario]" |
| 16 | `en_revision_general` | `pendiente_administrativa` | Devolver | G. General | ✅ SÍ | G. Administrativa | "Presupuesto devuelto por G. General: [comentario]" |
| 17 | `en_revision_general` | `pendiente_prestacional` | Devolver | G. General | ✅ SÍ | G. Prestacional | "Presupuesto devuelto por G. General: [comentario]" |
| 18 | `en_revision_*` | `pendiente_*` | Auto-liberar | Sistema (30min) | ✅ SÍ | - | - |

---

## 🔍 OBSERVAR vs DEVOLVER: Diferencias Clave

### **OBSERVAR** (Devolver a Usuario para Edición)

**¿Qué hace?**
- Cambia estado a `borrador`
- Usuario puede **editar directamente** la versión actual
- **NO crea nueva versión** automáticamente
- Usuario corrige y vuelve a finalizar

**Flujo:**
```
en_revision_prestacional → borrador (auditoría registra "observado")
Usuario edita → Finaliza → pendiente_administrativa (misma versión)
```

**Impacto en Versiones:**
- Mantiene `version` actual (ej: v1)
- Al finalizar nuevamente, sigue siendo v1
- Solo crea v2 si el usuario usa "Crear Nueva Versión" manualmente

**Caso de Uso:**
- Errores menores (typo en nombre, DNI incorrecto)
- Falta agregar un insumo
- Correcciones rápidas sin cambiar estructura

**Implementación:**
```typescript
// Estado en BD: 'borrador'
// Registro auditoría: estado_nuevo = 'observado'
// Usuario puede editar sin crear versión
```

---

### **DEVOLVER** (desde G. General a otra Gerencia)

**¿Qué hace?**
- Devuelve el presupuesto a otra gerencia para **re-evaluación**
- **NO permite edición** al usuario
- La gerencia destino debe revisar nuevamente
- **NO crea nueva versión**

**Flujo:**
```
en_revision_general → pendiente_prestacional
G. Prestacional revisa → Aprueba/Rechaza/Escala
```

**Impacto en Versiones:**
- Mantiene `version` actual
- Usuario **NO puede editar**
- Solo cambia flujo de aprobación

**Caso de Uso:**
- G. General no está de acuerdo con decisión de G. Prestacional
- Necesita segunda opinión de otra gerencia
- Escalamiento incorrecto

---

### Matriz de Comportamiento

| Acción | Estado Resultante | ¿Usuario Puede Editar? | ¿Crea Nueva Versión? | Flujo Siguiente |
|--------|-------------------|------------------------|----------------------|-----------------|
| **Observar** | `borrador` | ✅ SÍ | ❌ NO (edita v actual) | Usuario corrige → Finaliza → G. Administrativa |
| **Devolver** | `pendiente_X` | ❌ NO | ❌ NO | Gerencia X revisa → Aprueba/Rechaza/Escala |
| **Editar Aprobado** (actual) | `borrador` | ✅ SÍ | ✅ SÍ (crea v+1) | Usuario edita → Finaliza → G. Administrativa |

---

## 🟡 Estado APROBADO CONDICIONAL

### Propósito
Aprobar presupuestos con márgenes bajos por razones políticas/estratégicas (financiadores con alta demanda).

### Características
- Estado final (como `aprobado` o `rechazado`)
- Requiere comentario obligatorio explicando el motivo
- Visible en reportes con color distintivo (amarillo/naranja)
- Usuario puede ejecutar el presupuesto normalmente
- Queda registrado en auditorías para análisis posterior

### Casos de Uso
- Financiador estratégico con alto volumen
- Relación comercial prioritaria
- Presupuesto con rentabilidad < 15% pero cliente VIP
- Decisión gerencial por política comercial

### Migración BD

```sql
-- Agregar estado aprobado_condicional
ALTER TABLE presupuestos MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente_administrativa',
  'en_revision_administrativa',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'aprobado_condicional',  -- ← NUEVO
  'rechazado'
);
```

### Implementación Backend

```typescript
// backend/src/services/auditoriaService.ts

async aprobarCondicional(
  id: number, 
  auditorId: number, 
  motivo: string,  // OBLIGATORIO
  gerencia: 'administrativa' | 'prestacional' | 'general'
) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [presupuesto] = await connection.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    if (presupuesto[0].revisor_id !== auditorId) {
      throw new Error('No tienes permiso para auditar este caso');
    }
    
    if (!motivo || motivo.trim().length < 10) {
      throw new Error('Debe especificar motivo (mínimo 10 caracteres)');
    }
    
    // Aprobar condicionalmente y LIMPIAR revisor_id
    await connection.query(
      `UPDATE presupuestos 
       SET estado = 'aprobado_condicional',
           revisor_id = NULL,
           revisor_asignado_at = NULL
       WHERE idPresupuestos = ?`,
      [id]
    );
    
    const estadoAnterior = `en_revision_${gerencia}`;
    
    await connection.query(
      `INSERT INTO auditorias_presupuestos 
       (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, ?, ?, 'aprobado_condicional', ?)`,
      [id, presupuesto[0].version, auditorId, estadoAnterior, motivo]
    );
    
    await this.notificarUsuario(
      connection,
      presupuesto[0].usuario_id,
      id,
      presupuesto[0].version,
      'aprobado_condicional',
      `Presupuesto APROBADO CONDICIONALMENTE: ${motivo}`
    );
    
    await connection.commit();
    broadcastPresupuestoUpdate();
    broadcastNotificationUpdate(presupuesto[0].usuario_id);
    
    return { success: true };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

### Frontend: Tipos y Colores

```typescript
// frontend/src/types/index.ts
export type EstadoPresupuesto = 
  | 'borrador'
  | 'pendiente_administrativa'
  | 'en_revision_administrativa'
  | 'pendiente_prestacional'
  | 'en_revision_prestacional'
  | 'pendiente_general'
  | 'en_revision_general'
  | 'aprobado'
  | 'aprobado_condicional'  // ← NUEVO
  | 'rechazado';
```

```typescript
// frontend/src/utils/estadoPresupuesto.ts
export const getEstadoBadgeColor = (estado?: string): string => {
  switch (estado) {
    case 'aprobado':
      return 'green';
    case 'aprobado_condicional':  // ← NUEVO
      return 'yellow';
    case 'rechazado':
      return 'red';
    case 'en_revision_administrativa':
    case 'en_revision_prestacional':
    case 'en_revision_general':
      return 'blue';
    case 'pendiente_administrativa':
    case 'pendiente_prestacional':
    case 'pendiente_general':
      return 'orange';
    default:
      return 'gray';
  }
};

export const getEstadoLabel = (estado?: string): string => {
  const labels: Record<string, string> = {
    borrador: 'BORRADOR',
    pendiente_administrativa: 'PENDIENTE G. ADMIN',
    en_revision_administrativa: 'EN REVISIÓN G. ADMIN',
    pendiente_prestacional: 'PENDIENTE G. PRESTACIONAL',
    en_revision_prestacional: 'EN REVISIÓN G. PRESTACIONAL',
    pendiente_general: 'PENDIENTE G. GENERAL',
    en_revision_general: 'EN REVISIÓN G. GENERAL',
    aprobado: 'APROBADO',
    aprobado_condicional: 'APROBADO CONDICIONAL',  // ← NUEVO
    rechazado: 'RECHAZADO',
  };
  return labels[estado || ''] || estado?.toUpperCase() || 'BORRADOR';
};
```

### Modal de Auditoría: Botón Adicional

```typescript
// ModalAuditoria.tsx
<Group mt="md">
  <Button color="green" onClick={handleAprobar}>
    Aprobar
  </Button>
  <Button color="yellow" onClick={() => setModalCondicional(true)}>
    Aprobar Condicional
  </Button>
  <Button color="red" onClick={handleRechazar}>
    Rechazar
  </Button>
</Group>

{/* Modal para motivo obligatorio */}
<Modal opened={modalCondicional} onClose={() => setModalCondicional(false)}>
  <Textarea
    label="Motivo de Aprobación Condicional"
    placeholder="Ej: Cliente VIP con alto volumen mensual"
    minRows={3}
    required
    value={motivoCondicional}
    onChange={(e) => setMotivoCondicional(e.target.value)}
  />
  <Button 
    mt="md" 
    onClick={handleAprobarCondicional}
    disabled={motivoCondicional.length < 10}
  >
    Confirmar Aprobación Condicional
  </Button>
</Modal>
```

---

## 🔧 Implementación Backend

### 1. Eliminar Triggers SQL (Migración)

```sql
-- backend/migrations/migrate_to_multi_gerencial.sql

-- Eliminar triggers viejos que usan estados deprecados
DROP TRIGGER IF EXISTS notificar_auditoria_requerida;
DROP TRIGGER IF EXISTS notificar_cambio_estado;

-- Las notificaciones ahora se manejan en backend (Opción B)
```

---

### 2. Helper de Notificaciones

```typescript
// backend/src/services/auditoriaService.ts

/**
 * Notifica a todos los usuarios de una gerencia específica
 */
private async notificarGerencia(
  connection: any,
  presupuestoId: number,
  version: number,
  rol: string,
  mensaje: string
) {
  await connection.query(`
    INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
    SELECT u.id, ?, ?, 'pendiente', ?
    FROM usuarios u 
    WHERE u.rol = ? AND u.activo = 1
  `, [presupuestoId, version, mensaje, rol]);
}

/**
 * Notifica al usuario creador del presupuesto
 */
private async notificarUsuario(
  connection: any,
  usuarioId: number,
  presupuestoId: number,
  version: number,
  tipo: string,
  mensaje: string
) {
  await connection.query(`
    INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
    VALUES (?, ?, ?, ?, ?)
  `, [usuarioId, presupuestoId, version, tipo, mensaje]);
}
```

---

### 3. Transición #1: Usuario Finaliza Presupuesto

```typescript
// backend/src/controllers/presupuestosControllerV2.ts

export const finalizarPresupuesto = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const id = parseInt(req.params.id);
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Calcular totales y evaluar reglas
    const resultado = await presupuestoService.finalizar(id);
    
    if (resultado.estadoFinal === 'pendiente_administrativa') {
      // Va a auditoría → Notificar G. Administrativa
      const [presupuesto] = await connection.query(
        'SELECT Nombre_Apellido, version FROM presupuestos WHERE idPresupuestos = ?',
        [id]
      );
      
      await connection.query(`
        INSERT INTO notificaciones (usuario_id, presupuesto_id, version_presupuesto, tipo, mensaje)
        SELECT u.id, ?, ?, 'pendiente', ?
        FROM usuarios u 
        WHERE u.rol = 'gerencia_administrativa' AND u.activo = 1
      `, [
        id, 
        presupuesto[0].version,
        `Presupuesto de ${presupuesto[0].Nombre_Apellido} requiere auditoría`
      ]);
      
      broadcastPresupuestoUpdate();
    }
    
    await connection.commit();
    res.json({ success: true, estado: resultado.estadoFinal });
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});
```

---

### 4. Transición #3: Tomar Caso (NO limpia revisor_id)

```typescript
// backend/src/services/auditoriaService.ts

async tomarCaso(presupuestoId: number, usuarioId: number) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [presupuesto] = await connection.query(
      `SELECT * FROM presupuestos WHERE idPresupuestos = ? FOR UPDATE`,
      [presupuestoId]
    );
    
    if (presupuesto[0].revisor_id !== null && presupuesto[0].revisor_id !== usuarioId) {
      const [revisor] = await connection.query(
        'SELECT username FROM usuarios WHERE id = ?',
        [presupuesto[0].revisor_id]
      );
      throw new Error(`Ya está siendo revisado por ${revisor[0].username}`);
    }
    
    // ASIGNAR revisor_id (NO limpiar)
    await connection.query(
      `UPDATE presupuestos 
       SET revisor_id = ?, 
           revisor_asignado_at = NOW(),
           estado = REPLACE(estado, 'pendiente', 'en_revision')
       WHERE idPresupuestos = ?`,
      [usuarioId, presupuestoId]
    );
    
    await connection.commit();
    broadcastPresupuestoUpdate();
    
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

### 5. Transición #4: G. Administrativa Aprueba

```typescript
// backend/src/services/auditoriaService.ts

async aprobarAdministrativa(id: number, auditorId: number, comentario?: string) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Obtener presupuesto
    const [presupuesto] = await connection.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    // Verificar que sea el revisor asignado
    if (presupuesto[0].revisor_id !== auditorId) {
      throw new Error('No tienes permiso para auditar este caso');
    }
    
    // Aprobar y LIMPIAR revisor_id
    await connection.query(
      `UPDATE presupuestos 
       SET estado = 'aprobado',
           revisor_id = NULL,              -- ← LIMPIAR
           revisor_asignado_at = NULL      -- ← LIMPIAR
       WHERE idPresupuestos = ?`,
      [id]
    );
    
    // Registrar auditoría
    await connection.query(
      `INSERT INTO auditorias_presupuestos 
       (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, ?, 'en_revision_administrativa', 'aprobado', ?)`,
      [id, presupuesto[0].version, auditorId, comentario]
    );
    
    // Notificar al usuario creador
    await this.notificarUsuario(
      connection,
      presupuesto[0].usuario_id,
      id,
      presupuesto[0].version,
      'aprobado',
      'Presupuesto APROBADO por G. Administrativa'
    );
    
    await connection.commit();
    broadcastPresupuestoUpdate();
    broadcastNotificationUpdate(presupuesto[0].usuario_id);
    
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

### 6. Transición #5: G. Administrativa Rechaza

```typescript
async rechazarAdministrativa(id: number, auditorId: number, comentario: string) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [presupuesto] = await connection.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    if (presupuesto[0].revisor_id !== auditorId) {
      throw new Error('No tienes permiso para auditar este caso');
    }
    
    // Rechazar y LIMPIAR revisor_id
    await connection.query(
      `UPDATE presupuestos 
       SET estado = 'rechazado',
           revisor_id = NULL,              -- ← LIMPIAR
           revisor_asignado_at = NULL      -- ← LIMPIAR
       WHERE idPresupuestos = ?`,
      [id]
    );
    
    // Registrar auditoría
    await connection.query(
      `INSERT INTO auditorias_presupuestos 
       (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, ?, 'en_revision_administrativa', 'rechazado', ?)`,
      [id, presupuesto[0].version, auditorId, comentario]
    );
    
    // Notificar al usuario creador
    await this.notificarUsuario(
      connection,
      presupuesto[0].usuario_id,
      id,
      presupuesto[0].version,
      'rechazado',
      `Presupuesto RECHAZADO: ${comentario}`
    );
    
    await connection.commit();
    broadcastPresupuestoUpdate();
    broadcastNotificationUpdate(presupuesto[0].usuario_id);
    
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

### 7. Transición #6: G. Administrativa Deriva a G. Prestacional

```typescript
async derivarAPrestacional(id: number, auditorId: number, comentario?: string) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [presupuesto] = await connection.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    if (presupuesto[0].revisor_id !== auditorId) {
      throw new Error('No tienes permiso para derivar este caso');
    }
    
    // Derivar y LIMPIAR revisor_id para que G. Prestacional pueda tomarlo
    await connection.query(
      `UPDATE presupuestos 
       SET estado = 'pendiente_prestacional',
           revisor_id = NULL,              -- ← LIMPIAR
           revisor_asignado_at = NULL      -- ← LIMPIAR
       WHERE idPresupuestos = ?`,
      [id]
    );
    
    // Registrar auditoría
    await connection.query(
      `INSERT INTO auditorias_presupuestos 
       (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, ?, 'en_revision_administrativa', 'pendiente_prestacional', ?)`,
      [id, presupuesto[0].version, auditorId, comentario]
    );
    
    // Notificar a G. Prestacional
    await this.notificarGerencia(
      connection,
      id,
      presupuesto[0].version,
      'gerencia_prestacional',
      `Presupuesto de ${presupuesto[0].Nombre_Apellido} derivado desde G. Administrativa`
    );
    
    await connection.commit();
    broadcastPresupuestoUpdate();
    
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

### 8. Transición #8: G. Prestacional Aprueba

```typescript
async aprobarPrestacional(id: number, auditorId: number, comentario?: string) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [presupuesto] = await connection.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    if (presupuesto[0].revisor_id !== auditorId) {
      throw new Error('No tienes permiso para auditar este caso');
    }
    
    // Aprobar y LIMPIAR revisor_id
    await connection.query(
      `UPDATE presupuestos 
       SET estado = 'aprobado',
           revisor_id = NULL,
           revisor_asignado_at = NULL
       WHERE idPresupuestos = ?`,
      [id]
    );
    
    await connection.query(
      `INSERT INTO auditorias_presupuestos 
       (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, ?, 'en_revision_prestacional', 'aprobado', ?)`,
      [id, presupuesto[0].version, auditorId, comentario]
    );
    
    await this.notificarUsuario(
      connection,
      presupuesto[0].usuario_id,
      id,
      presupuesto[0].version,
      'aprobado',
      'Presupuesto APROBADO por G. Prestacional'
    );
    
    await connection.commit();
    broadcastPresupuestoUpdate();
    broadcastNotificationUpdate(presupuesto[0].usuario_id);
    
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

### 9. Transición #9: G. Prestacional Rechaza

```typescript
async rechazarPrestacional(id: number, auditorId: number, comentario: string) {
  // Mismo patrón que rechazarAdministrativa
  // SET estado = 'rechazado', revisor_id = NULL, revisor_asignado_at = NULL
  // Notificar usuario creador
}
```

---

### 10. Transición #10: G. Prestacional Observa (Devuelve a Usuario)

**IMPORTANTE**: Estado en BD = `borrador`, pero auditoría registra `observado`

```typescript
async observarPresupuesto(id: number, auditorId: number, comentario: string) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [presupuesto] = await connection.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    if (presupuesto[0].revisor_id !== auditorId) {
      throw new Error('No tienes permiso para observar este caso');
    }
    
    // Devolver a borrador y LIMPIAR revisor_id
    // Usuario puede editar sin crear nueva versión
    await connection.query(
      `UPDATE presupuestos 
       SET estado = 'borrador',  -- ← Usuario puede editar
           revisor_id = NULL,
           revisor_asignado_at = NULL
       WHERE idPresupuestos = ?`,
      [id]
    );
    
    // Auditoría registra "observado" pero BD queda en "borrador"
    await connection.query(
      `INSERT INTO auditorias_presupuestos 
       (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, ?, 'en_revision_prestacional', 'observado', ?)`,
      [id, presupuesto[0].version, auditorId, comentario]
    );
    
    // Notificar al usuario creador
    await this.notificarUsuario(
      connection,
      presupuesto[0].usuario_id,
      id,
      presupuesto[0].version,
      'observado',
      `Presupuesto devuelto para correcciones: ${comentario}`
    );
    
    await connection.commit();
    broadcastPresupuestoUpdate();
    broadcastNotificationUpdate(presupuesto[0].usuario_id);
    
    return { success: true };
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

**Ajuste en Controller de Edición:**

```typescript
// backend/src/controllers/presupuestosControllerV2.ts

async editarPresupuesto(req, res) {
  const { id } = req.params;
  
  const [presupuesto] = await pool.query(
    'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
    [id]
  );
  
  // ✅ NO crear versión si ya es borrador (incluye casos observados)
  const estadosEditablesSinVersion = ['borrador'];
  
  if (!estadosEditablesSinVersion.includes(presupuesto[0].estado)) {
    // Crear nueva versión solo si está finalizado/aprobado/rechazado
    await crearNuevaVersion(id);
  }
  
  return res.json({ 
    mensaje: 'Presupuesto listo para edición',
    version: presupuesto[0].version 
  });
}
```

---

### 11. Transición #11: G. Prestacional Escala a G. General

```typescript
async escalarAGeneral(id: number, auditorId: number, motivo: string) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [presupuesto] = await connection.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    if (presupuesto[0].revisor_id !== auditorId) {
      throw new Error('No tienes permiso para escalar este caso');
    }
    
    // Escalar y LIMPIAR revisor_id para que G. General pueda tomarlo
    await connection.query(
      `UPDATE presupuestos 
       SET estado = 'pendiente_general',
           revisor_id = NULL,
           revisor_asignado_at = NULL
       WHERE idPresupuestos = ?`,
      [id]
    );
    
    await connection.query(
      `INSERT INTO auditorias_presupuestos 
       (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, ?, 'en_revision_prestacional', 'pendiente_general', ?)`,
      [id, presupuesto[0].version, auditorId, motivo]
    );
    
    // Notificar a G. General
    await this.notificarGerencia(
      connection,
      id,
      presupuesto[0].version,
      'gerencia_general',
      `Presupuesto de ${presupuesto[0].Nombre_Apellido} escalado: ${motivo}`
    );
    
    await connection.commit();
    broadcastPresupuestoUpdate();
    
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

### 12. Transición #14: G. General Aprueba

```typescript
async aprobarGeneral(id: number, auditorId: number, comentario?: string) {
  // Mismo patrón que aprobarAdministrativa
  // SET estado = 'aprobado', revisor_id = NULL, revisor_asignado_at = NULL
  // Notificar usuario creador con mensaje "APROBADO por Gerencia General"
}
```

---

### 13. Transición #15: G. General Rechaza

```typescript
async rechazarGeneral(id: number, auditorId: number, comentario: string) {
  // Mismo patrón que rechazarAdministrativa
  // SET estado = 'rechazado', revisor_id = NULL, revisor_asignado_at = NULL
  // Notificar usuario creador
}
```

---

### 14. Transición #16-17: G. General Devuelve a Otra Gerencia

```typescript
async devolverAGerencia(
  id: number, 
  auditorId: number, 
  gerenciaDestino: 'administrativa' | 'prestacional',
  comentario: string
) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const [presupuesto] = await connection.query(
      'SELECT * FROM presupuestos WHERE idPresupuestos = ?',
      [id]
    );
    
    if (presupuesto[0].revisor_id !== auditorId) {
      throw new Error('No tienes permiso para devolver este caso');
    }
    
    const nuevoEstado = `pendiente_${gerenciaDestino}`;
    const rolDestino = `gerencia_${gerenciaDestino}`;
    
    // Devolver y LIMPIAR revisor_id
    await connection.query(
      `UPDATE presupuestos 
       SET estado = ?,
           revisor_id = NULL,
           revisor_asignado_at = NULL
       WHERE idPresupuestos = ?`,
      [nuevoEstado, id]
    );
    
    await connection.query(
      `INSERT INTO auditorias_presupuestos 
       (presupuesto_id, version_presupuesto, auditor_id, estado_anterior, estado_nuevo, comentario)
       VALUES (?, ?, ?, 'en_revision_general', ?, ?)`,
      [id, presupuesto[0].version, auditorId, nuevoEstado, comentario]
    );
    
    // Notificar a gerencia destino
    await this.notificarGerencia(
      connection,
      id,
      presupuesto[0].version,
      rolDestino,
      `Presupuesto devuelto por G. General: ${comentario}`
    );
    
    await connection.commit();
    broadcastPresupuestoUpdate();
    
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

### 15. Transición #18: Auto-Liberación (Sistema)

```typescript
// backend/src/services/auditoriaService.ts

async autoLiberarCasosInactivos() {
  try {
    const [result] = await pool.query(
      `UPDATE presupuestos 
       SET revisor_id = NULL,              -- ← LIMPIAR
           revisor_asignado_at = NULL,     -- ← LIMPIAR
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
```

---

## 📊 Resumen de Reglas

### Cuándo LIMPIAR `revisor_id`

✅ **SÍ limpiar** en:
- Aprobar (cualquier gerencia)
- Rechazar (cualquier gerencia)
- Derivar a otra gerencia
- Observar (devolver a usuario)
- Escalar a G. General
- Devolver desde G. General
- Auto-liberación (30 min)

❌ **NO limpiar** en:
- Tomar caso (asigna `revisor_id`)

### Cuándo NOTIFICAR

**Notificar a Gerencia:**
- Presupuesto finalizado → G. Administrativa
- Derivado → G. Prestacional
- Escalado → G. General
- Devuelto desde G. General → Gerencia destino

**Notificar a Usuario Creador:**
- Aprobado (cualquier gerencia)
- Rechazado (cualquier gerencia)
- Observado (devuelto para correcciones)

---

## ✅ Checklist de Implementación

### Base de Datos
- [ ] Agregar estado `aprobado_condicional` a ENUM
- [ ] Eliminar triggers SQL viejos
- [ ] Agregar columnas `revisor_id` y `revisor_asignado_at`

### Backend
- [ ] Implementar helpers `notificarGerencia()` y `notificarUsuario()`
- [ ] Implementar 15 métodos de transición con limpieza de `revisor_id`
- [ ] Implementar `aprobarCondicional()` para 3 gerencias
- [ ] Ajustar `editarPresupuesto()` para no crear versión en borrador
- [ ] Agregar notificaciones en cada transición
- [ ] Configurar cron job auto-liberación (30 min)
- [ ] Testing de cada transición

### Frontend
- [ ] Actualizar tipos: agregar `aprobado_condicional`
- [ ] Actualizar `estadoPresupuesto.ts` con color y label
- [ ] Agregar botón "Aprobar Condicional" en modal auditoría
- [ ] Crear modal para motivo obligatorio (min 10 caracteres)
- [ ] Actualizar filtros de estado en tablas
- [ ] Testing de flujo completo

### Validación
- [ ] Verificar que auto-liberación funciona
- [ ] Verificar que SSE notifica cambios
- [ ] Verificar que OBSERVAR no crea versión
- [ ] Verificar que DEVOLVER no permite edición
- [ ] Verificar que aprobación condicional requiere motivo

---

**Fecha:** Enero 2025  
**Versión:** 2.0  
**Estado:** 📝 DOCUMENTACIÓN COMPLETA

**Cambios v2.0:**
- ✅ Agregado estado `aprobado_condicional`
- ✅ Documentado OBSERVAR vs DEVOLVER
- ✅ Aclarado impacto en sistema de versiones
- ✅ Agregadas transiciones #4b, #8b, #14b
