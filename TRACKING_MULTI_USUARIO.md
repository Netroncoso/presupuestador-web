# Sistema de Tracking Multi-Usuario

## 📋 Problema

**Escenario**: Un usuario de AMBA crea un presupuesto, y otro compañero de la misma sucursal lo continúa/modifica.

**Pregunta**: ¿Cómo se marca esto en el historial?

## 🎯 Solución Actual

### Estado Actual del Sistema

#### 1. **Usuario Creador** (Implementado ✅)
- Campo: `presupuestos.usuario_id`
- Muestra: Quién creó el presupuesto originalmente
- Visible en: Columna "Usuario" del historial

#### 2. **Versionado** (Implementado ✅)
- Cada edición crea una nueva versión
- Campo: `presupuestos.version`
- Tracking: `presupuestos.presupuesto_padre`

#### 3. **Auditoría** (Implementado ✅)
- Tabla: `auditorias_presupuestos`
- Campos:
  - `auditor_id`: Quién hizo la acción
  - `estado_anterior` / `estado_nuevo`
  - `comentario`
  - `fecha`

## ⚠️ Limitación Identificada

**Comportamiento actual del sistema:**

### Presupuestos en Borrador
- **NO se crea nueva versión** al editar
- Múltiples usuarios pueden editar el mismo borrador
- `usuario_id` permanece como el creador original
- **Esto es correcto** ✅ - Es colaborativo

### Presupuestos Finalizados
- **SÍ se crea nueva versión** al editar
- Cada versión podría trackear quién la creó
- Actualmente: todas las versiones muestran el creador original
- **Aquí sí sería útil** trackear el editor de cada versión

### Ejemplo del Comportamiento:
```
1. Usuario "juan_amba" crea presupuesto #123 (borrador, versión 1)
2. Usuario "maria_amba" edita el borrador → NO crea versión 2
   - Sigue siendo versión 1, usuario_creador = "juan_amba" ✅
3. Usuario "pedro_amba" finaliza el presupuesto
4. Usuario "maria_amba" edita → SÍ crea versión 2
   - Versión 2 muestra usuario_creador = "juan_amba" ❌
   - Debería mostrar "maria_amba" (quien creó esta versión)
```

## 🔧 Solución Propuesta

### Opción 1: Tracking por Versión (RECOMENDADO)

**Cambio en BD:**
```sql
-- Cada versión guarda su propio usuario_id
-- Ya existe el campo, solo hay que usarlo correctamente
```

**Cambio en Backend:**
```typescript
// En versioningService.crearNuevaVersion()
// Al crear nueva versión, asignar usuario_id del editor actual
await pool.query(`
  INSERT INTO presupuestos (
    Nombre_Apellido, DNI, sucursal_id, financiador_id,
    usuario_id,  -- ← Usuario que está editando (no el creador original)
    presupuesto_padre, version, es_ultima_version, estado
  ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'borrador')
`, [nombre, dni, sucursal_id, financiador_id, 
    usuario_editor_id,  // ← Nuevo: ID del usuario que edita
    idOriginal, nuevaVersion]);
```

**Resultado:**
```
Historial:
- Versión 1: usuario_creador = "juan_amba"
- Versión 2: usuario_creador = "maria_amba" ✅
- Versión 3: usuario_creador = "pedro_amba" ✅
```

### Opción 2: Columna Separada (Más Complejo)

**Cambio en BD:**
```sql
ALTER TABLE presupuestos 
ADD COLUMN usuario_modificador_id INT,
ADD CONSTRAINT fk_presupuestos_modificador 
  FOREIGN KEY (usuario_modificador_id) REFERENCES usuarios(id);
```

**Ventaja:** Mantiene creador original + último modificador
**Desventaja:** Más complejo, solo muestra último modificador

### Opción 3: Auditoría Detallada (Más Robusto)

**Usar tabla `auditorias_presupuestos` para tracking completo:**

```sql
-- Registrar cada modificación
INSERT INTO auditorias_presupuestos (
  presupuesto_id, version_presupuesto, auditor_id,
  estado_anterior, estado_nuevo, comentario
) VALUES (
  123, 2, maria_id,
  'borrador', 'borrador', 'Editó presupuesto: agregó 3 insumos'
);
```

**Ventaja:** Historial completo de cambios
**Desventaja:** Requiere más lógica para mostrar

## 📊 Implementación Recomendada

### Fase 1: Tracking por Versión (Rápido)

**Backend - `versioningService.ts`:**
```typescript
async crearNuevaVersion(idOriginal: number, usuarioEditorId: number, confirmar: boolean) {
  // ...código existente...
  
  // Al insertar nueva versión, usar usuarioEditorId
  const [result] = await connection.query(`
    INSERT INTO presupuestos (
      Nombre_Apellido, DNI, sucursal_id, financiador_id,
      usuario_id,  -- ← Usuario EDITOR, no creador original
      presupuesto_padre, version, es_ultima_version, estado
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'borrador')
  `, [nombre, dni, sucursal_id, financiador_id, 
      usuarioEditorId,  // ← CAMBIO AQUÍ
      idOriginal, nuevaVersion]);
}
```

**Frontend - Sin cambios necesarios:**
- La columna "Usuario" ya existe
- Mostrará automáticamente el usuario de cada versión

### Fase 2: Auditoría Detallada (Opcional)

**Agregar registro de modificaciones:**
```typescript
// Al editar presupuesto
await pool.query(`
  INSERT INTO auditorias_presupuestos (
    presupuesto_id, version_presupuesto, auditor_id,
    estado_anterior, estado_nuevo, comentario
  ) VALUES (?, ?, ?, 'borrador', 'borrador', ?)
`, [presupuestoId, version, usuarioId, 'Usuario editó presupuesto']);
```

**Frontend - Modal de historial detallado:**
```tsx
// Mostrar quién hizo qué en cada versión
<Timeline>
  <Timeline.Item title="Versión 2 - maria_amba">
    Agregó 3 insumos, modificó 2 prestaciones
  </Timeline.Item>
  <Timeline.Item title="Versión 1 - juan_amba">
    Creó presupuesto inicial
  </Timeline.Item>
</Timeline>
```

## 🎨 Visualización Propuesta

### Historial de Presupuestos (Actual + Mejora)

| ID | Paciente | DNI | Sucursal | **Usuario** | Estado | Fecha |
|----|----------|-----|----------|-------------|--------|-------|
| 123 | Juan Pérez | 12345678 | AMBA | **juan_amba** | Aprobado | 15/01/25 |

### Historial de Versiones (Nuevo)

| Versión | **Usuario Editor** | Estado | Cambios | Fecha |
|---------|-------------------|--------|---------|-------|
| 3 | **pedro_amba** | Aprobado | Finalizó presupuesto | 15/01 14:30 |
| 2 | **maria_amba** | Borrador | Agregó 3 insumos | 15/01 10:15 |
| 1 | **juan_amba** | Borrador | Creación inicial | 15/01 09:00 |

## 📝 Archivos a Modificar

### Backend
- ✅ `backend/src/services/versioningService.ts` - Usar usuarioEditorId (SOLO al crear nueva versión)
- ✅ `backend/src/controllers/presupuestosControllerV2.ts` - Ya devuelve usuario_creador
- ⏳ Opcional: Auditoría detallada de ediciones en borrador

### Frontend
- ✅ `frontend/src/pages/ListaPresupuestos.tsx` - Columna "Usuario" agregada
- ⏳ Opcional: Modal de historial detallado por versión

### Nota Importante
**NO modificar tracking en borradores** - El comportamiento actual es correcto.
Solo aplicar cambio cuando se crea nueva versión (presupuesto finalizado).

## 🔍 Testing Necesario

1. ✅ Verificar que columna "Usuario" se muestra
2. ⏳ Crear presupuesto con usuario A
3. ⏳ Editar con usuario B → verificar que versión 2 muestra usuario B
4. ⏳ Ver historial de versiones → cada versión debe mostrar su editor

## 📅 Estado

- ✅ Columna "Usuario" agregada en historial
- ⏳ Tracking por versión pendiente (cambio en versioningService)
- ⏳ Auditoría detallada pendiente (opcional)

## 💡 Recomendación

**Implementar Fase 1 (Tracking por Versión)** - Es simple, efectivo y no requiere cambios en BD.

**Estimación:** ~1 hora
- 30 min: Modificar versioningService
- 30 min: Testing

¿Proceder con la implementación?
