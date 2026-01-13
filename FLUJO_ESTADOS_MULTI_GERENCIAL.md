# Flujo de Estados - Sistema Multi-Gerencial

## Estados Principales

### Estados de Auditoría
1. **`pendiente_administrativa`** - Presupuesto esperando ser tomado por G. Administrativa
2. **`en_revision_administrativa`** - Presupuesto siendo revisado por G. Administrativa
3. **`pendiente_prestacional`** - Presupuesto esperando ser tomado por G. Prestacional
4. **`en_revision_prestacional`** - Presupuesto siendo revisado por G. Prestacional
5. **`pendiente_general`** - Presupuesto esperando ser tomado por G. General
6. **`en_revision_general`** - Presupuesto siendo revisado por G. General

### Estados de Carga
7. **`pendiente_carga`** - Aprobado, esperando operador de carga
8. **`en_carga`** - Operador de carga procesando
9. **`cargado`** - Cargado en sistema externo (Softwerk)

### Estados Finales
10. **`rechazado`** - Rechazado por gerencia
11. **`borrador`** - En edición por usuario

## Transiciones de Estado

### 1. Tomar Caso (FCFS - First Come First Served)

**Transiciones:**
```
pendiente_administrativa → en_revision_administrativa
pendiente_prestacional → en_revision_prestacional
pendiente_general → en_revision_general
```

**Método:** `tomarCaso(presupuestoId, usuarioId)`

**Comportamiento:**
- Usa `FOR UPDATE` para evitar race conditions
- Asigna `revisor_id` y `revisor_asignado_at = NOW()`
- Si ya está asignado a otro usuario → Error 409
- Si ya es el revisor asignado → Retorna éxito sin cambios

**Código:**
```sql
UPDATE presupuestos 
SET revisor_id = ?, 
    revisor_asignado_at = NOW(),
    estado = REPLACE(estado, 'pendiente', 'en_revision')
WHERE idPresupuestos = ?
```

---

### 2. Auto-Liberación (30 minutos inactivo)

**Transiciones:**
```
en_revision_administrativa → pendiente_administrativa
en_revision_prestacional → pendiente_prestacional
en_revision_general → pendiente_general
```

**Método:** `autoLiberarCasosInactivos()`

**Comportamiento:**
- Ejecuta automáticamente cada X minutos (CRON)
- Libera casos con `revisor_asignado_at < NOW() - 30 min`
- Limpia `revisor_id` y `revisor_asignado_at`

**Código:**
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

### 3. Aprobar (Gerencia Administrativa)

**Transición:**
```
en_revision_administrativa → pendiente_carga
```

**Método:** `aprobarAdministrativa(id, auditorId, comentario?)`

**Comportamiento:**
- Cambia estado a `pendiente_carga` (va directo a carga)
- `resultado_auditoria = 'aprobado'`
- Notifica a operadores de carga (rol: `operador_carga`)
- Notifica al usuario creador
- Notifica a G. Administrativa (seguimiento)
- Limpia `revisor_id` y `revisor_asignado_at`

**Validaciones:**
- Presupuesto debe existir
- `revisor_id` debe coincidir con `auditorId`
- Estado debe ser `en_revision_administrativa`

---

### 4. Derivar a Gerencia Prestacional

**Transición:**
```
en_revision_administrativa → pendiente_prestacional
```

**Método:** `derivarAPrestacional(id, auditorId, comentario?)`

**Comportamiento:**
- Libera el caso (`revisor_id = NULL`)
- Notifica a G. Prestacional (rol: `gerencia_prestacional`)
- Registra en `auditorias_presupuestos`

**Validaciones:**
- `revisor_id` debe coincidir con `auditorId`

---

### 5. Aprobar (Gerencia Prestacional)

**Transición:**
```
en_revision_prestacional → pendiente_carga
```

**Método:** `aprobarPrestacional(id, auditorId, comentario?)`

**Comportamiento:**
- Igual que aprobar administrativa
- Notifica a operadores de carga
- Notifica al usuario creador

---

### 6. Observar (Devolver a Usuario)

**Transición:**
```
en_revision_prestacional → borrador
```

**Método:** `observarPresupuesto(id, auditorId, comentario)`

**Comportamiento:**
- Usuario puede corregir y re-finalizar
- **NO crea nueva versión** (mantiene misma versión)
- Notifica al usuario con comentario
- Limpia `revisor_id` y `revisor_asignado_at`
- Registra en auditorías con `estado_nuevo = 'observado'`

**Validaciones:**
- Solo G. Prestacional puede observar
- Comentario es obligatorio

---

### 7. Escalar a Gerencia General

**Transición:**
```
en_revision_prestacional → pendiente_general
```

**Método:** `escalarAGeneral(id, auditorId, motivo)`

**Comportamiento:**
- Para casos complejos que requieren decisión superior
- Libera el caso (`revisor_id = NULL`)
- Notifica a G. General (rol: `gerencia_general`)
- Motivo es obligatorio

**Validaciones:**
- Solo G. Prestacional puede escalar
- `revisor_id` debe coincidir con `auditorId`

---

### 8. Aprobar (Gerencia General)

**Transición:**
```
en_revision_general → pendiente_carga
```

**Método:** `aprobarGeneral(id, auditorId, comentario?)`

**Comportamiento:**
- Igual que aprobar administrativa/prestacional
- Notifica a operadores de carga
- Notifica al usuario creador

---

### 9. Devolver a Otra Gerencia

**Transiciones:**
```
en_revision_general → pendiente_administrativa
en_revision_general → pendiente_prestacional
```

**Método:** `devolverAGerencia(id, auditorId, gerenciaDestino, comentario)`

**Comportamiento:**
- G. General puede devolver a gerencias inferiores para re-evaluación
- Libera el caso (`revisor_id = NULL`)
- Notifica a la gerencia destino
- Comentario es obligatorio

**Parámetros:**
- `gerenciaDestino`: `'administrativa'` | `'prestacional'`

---

### 10. Rechazar

**Transiciones:**
```
en_revision_administrativa → rechazado
en_revision_prestacional → rechazado
en_revision_general → rechazado
```

**Métodos:**
- `rechazarAdministrativa(id, auditorId, comentario)`
- `rechazarPrestacional(id, auditorId, comentario)`
- `rechazarGeneral(id, auditorId, comentario)`

**Comportamiento:**
- Estado final (no se puede modificar después)
- `resultado_auditoria = 'rechazado'`
- Notifica al usuario creador con motivo
- Notifica a G. Administrativa (seguimiento)
- Comentario es obligatorio

---

### 11. Aprobación Condicional

**Transiciones:**
```
en_revision_administrativa → pendiente_carga
en_revision_prestacional → pendiente_carga
en_revision_general → pendiente_carga
```

**Métodos:**
- `aprobarCondicionalAdministrativa(id, auditorId, motivo)`
- `aprobarCondicionalPrestacional(id, auditorId, motivo)`
- `aprobarCondicionalGeneral(id, auditorId, motivo)`

**Comportamiento:**
- Para casos políticos/estratégicos que requieren aprobación especial
- `resultado_auditoria = 'aprobado_condicional'`
- Notifica a operadores de carga
- Notifica al usuario creador con motivo
- Motivo es obligatorio (mínimo 10 caracteres)

**Uso:**
- Casos con rentabilidad fuera de rango pero justificados
- Acuerdos comerciales especiales
- Situaciones excepcionales aprobadas por gerencia

---

### 12. Tomar Caso para Carga

**Transición:**
```
pendiente_carga → en_carga
```

**Método:** `tomarCasoParaCarga(presupuestoId, operadorId)`

**Comportamiento:**
- Operador de carga toma el caso (FCFS)
- Asigna `revisor_id` y `revisor_asignado_at`
- Registra en `auditorias_presupuestos`

**Validaciones:**
- Estado debe ser `pendiente_carga`
- Si ya está asignado a otro operador → Error 409

---

### 13. Marcar como Cargado

**Transición:**
```
en_carga → cargado
```

**Método:** `marcarComoCargado(presupuestoId, operadorId, referenciaExterna)`

**Comportamiento:**
- Presupuesto cargado en sistema externo (Softwerk)
- Guarda `referencia_externa` (ID de Softwerk)
- Notifica al usuario creador
- Limpia `revisor_id` y `revisor_asignado_at`

**Validaciones:**
- `referencia_externa` es obligatoria (mínimo 3 caracteres)
- `referencia_externa` debe ser única (no duplicada)
- `revisor_id` debe coincidir con `operadorId`

---

### 14. Devolver desde Carga

**Transiciones:**
```
en_carga → borrador
en_carga → pendiente_administrativa
en_carga → pendiente_prestacional
en_carga → pendiente_general
```

**Método:** `devolverPresupuesto(presupuestoId, operadorId, destino, motivo)`

**Comportamiento:**
- Operador detecta error y devuelve para corrección
- Libera el caso (`revisor_id = NULL`)
- Notifica según destino

**Parámetros:**
- `destino`: `'usuario'` | `'administrativa'` | `'prestacional'` | `'general'`
- `motivo`: Obligatorio (mínimo 10 caracteres)

---

## Diagrama de Flujo Completo

```
┌─────────────┐
│   borrador  │
└──────┬──────┘
       │ (finalizar)
       ↓
┌──────────────────────────┐
│ pendiente_administrativa │
└──────┬───────────────────┘
       │ (tomar caso)
       ↓
┌──────────────────────────┐
│ en_revision_administrativa│
└──┬────────┬──────────┬───┘
   │        │          │
   │(aprobar)│(derivar) │(rechazar)
   │        │          │
   ↓        ↓          ↓
┌────────┐ ┌──────────────────┐ ┌──────────┐
│pendiente│ │pendiente_prestacional│ │rechazado │
│ carga  │ └──────┬───────────┘ └──────────┘
└────────┘        │ (tomar caso)
                  ↓
           ┌──────────────────────┐
           │en_revision_prestacional│
           └──┬────────┬──────┬───┘
              │        │      │
       (aprobar)│(observar)│(escalar)
              │        │      │
              ↓        ↓      ↓
        ┌────────┐ ┌────────┐ ┌─────────────────┐
        │pendiente│ │borrador│ │pendiente_general│
        │ carga  │ └────────┘ └──────┬──────────┘
        └────────┘              │ (tomar caso)
                                ↓
                         ┌──────────────────┐
                         │en_revision_general│
                         └──┬────────┬──────┘
                            │        │
                     (aprobar)│(rechazar/devolver)
                            │        │
                            ↓        ↓
                      ┌────────┐ ┌──────────┐
                      │pendiente│ │rechazado │
                      │ carga  │ │o pendiente│
                      └───┬────┘ └──────────┘
                          │ (tomar caso)
                          ↓
                      ┌────────┐
                      │en_carga│
                      └───┬────┘
                          │ (marcar cargado)
                          ↓
                      ┌────────┐
                      │cargado │
                      └────────┘
```

## Reglas de Negocio

### Asignación FCFS (First Come First Served)
- Primer gerente/operador que hace clic en "Tomar Caso" se lo lleva
- Usa `FOR UPDATE` para evitar race conditions
- Si otro usuario ya lo tomó → Error 409

### Auto-Liberación (30 minutos)
- Casos inactivos > 30 minutos vuelven a estado `pendiente_*`
- Ejecuta automáticamente (CRON job)
- Permite que otro gerente/operador tome el caso

### Notificaciones
- **Usuario creador**: Recibe notificación en aprobación, rechazo, observación
- **Gerencias**: Reciben notificación cuando hay casos pendientes
- **Operadores de carga**: Reciben notificación cuando presupuesto va a `pendiente_carga`
- **G. Administrativa**: Recibe todas las notificaciones (seguimiento)

### Auditoría
- Todas las transiciones se registran en `auditorias_presupuestos`
- Incluye: `presupuesto_id`, `version`, `auditor_id`, `estado_anterior`, `estado_nuevo`, `comentario`, `fecha`

### Validaciones
- Solo el revisor asignado (`revisor_id`) puede realizar acciones
- Comentarios obligatorios en: rechazar, observar, escalar, devolver
- Motivo obligatorio (≥10 caracteres) en: aprobación condicional, escalar, devolver

## Campos de Base de Datos

### Tabla `presupuestos`
- `estado`: Estado actual del presupuesto
- `resultado_auditoria`: `'aprobado'` | `'aprobado_condicional'` | `'rechazado'` | `NULL`
- `revisor_id`: ID del gerente/operador asignado (NULL si no está asignado)
- `revisor_asignado_at`: Timestamp de asignación (para auto-liberación)
- `referencia_externa`: ID en sistema externo (Softwerk) cuando está cargado

### Tabla `auditorias_presupuestos`
- `presupuesto_id`: ID del presupuesto
- `version_presupuesto`: Versión del presupuesto
- `auditor_id`: ID del usuario que realizó la acción
- `estado_anterior`: Estado antes de la transición
- `estado_nuevo`: Estado después de la transición
- `comentario`: Comentario/motivo de la acción
- `fecha`: Timestamp de la acción

### Tabla `notificaciones`
- `usuario_id`: ID del usuario que recibe la notificación
- `presupuesto_id`: ID del presupuesto
- `version_presupuesto`: Versión del presupuesto
- `tipo`: `'pendiente'` | `'carga'` | `'aprobado'` | `'aprobado_condicional'` | `'rechazado'` | `'observado'` | `'devuelto'`
- `mensaje`: Texto de la notificación
- `estado`: `'nuevo'` | `'leido'`
- `creado_en`: Timestamp de creación

## Roles de Usuario

### `user` (Usuario Normal)
- Crea presupuestos en estado `borrador`
- Recibe notificaciones de aprobación/rechazo/observación
- Puede editar presupuestos en `borrador`

### `gerencia_administrativa`
- Toma casos en `pendiente_administrativa`
- Puede: aprobar, aprobar condicional, rechazar, derivar a prestacional
- Recibe todas las notificaciones (seguimiento)

### `gerencia_prestacional`
- Toma casos en `pendiente_prestacional`
- Puede: aprobar, aprobar condicional, rechazar, observar, escalar a general

### `gerencia_general`
- Toma casos en `pendiente_general`
- Puede: aprobar, aprobar condicional, rechazar, devolver a otras gerencias
- Decisión final en casos complejos

### `gerencia_financiera`
- Dashboard de solo lectura
- Visualización sin capacidad de auditar
- Usa mismo dashboard que G. General pero sin acciones

### `operador_carga`
- Toma casos en `pendiente_carga`
- Puede: marcar como cargado, devolver a usuario/gerencias
- Carga presupuestos en sistema externo (Softwerk)

### `admin`
- Acceso completo al sistema
- Gestión de usuarios, configuración, reglas de negocio

---

**Versión:** 3.2  
**Última actualización:** Enero 2025
