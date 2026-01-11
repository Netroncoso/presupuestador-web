# Sistema de Carga Post-Aprobación

## Resumen Ejecutivo

Una vez que un presupuesto es **aprobado** por las gerencias, debe ser cargado en el sistema externo por el equipo de oficinas centrales. Este nuevo módulo agrega una etapa adicional al flujo con notificaciones automáticas y seguimiento completo.

## Cambios en Base de Datos

### Tabla: `presupuestos`

#### Nuevos Estados
```sql
-- Estados agregados al ENUM existente:
'pendiente_carga'  -- Esperando ser tomado por operador
'en_carga'         -- Siendo procesado por operador  
'cargado'          -- Completado en sistema externo
```

#### Nueva Columna
```sql
referencia_externa VARCHAR(255) NULL
-- Almacena ID/código del presupuesto en el sistema externo
-- Ejemplo: "SIST-2025-001234" o "REF-ABC-789"
```

### Tabla: `usuarios`

#### Nuevo Rol
```sql
'operador_carga'   -- Personal de oficinas centrales
```

### Tablas Afectadas Indirectamente
- **`auditorias_presupuestos`**: Registra todas las transiciones de carga
- **`notificaciones`**: Notifica automáticamente a operadores y usuarios

## Flujo de Usuario - Lenguaje Humanizado

### Para Gerencias (Sin Cambios)
El flujo actual **no cambia**. Las gerencias siguen aprobando normalmente:
- Gerencia Administrativa → Aprobar/Rechazar/Derivar
- Gerencia Prestacional → Aprobar/Rechazar/Observar/Escalar  
- Gerencia General → Aprobar/Rechazar/Devolver

### Transición Automática
**Antes**: Presupuesto aprobado → Estado "aprobado" (final)
**Ahora**: Presupuesto aprobado → Estado "pendiente_carga" (automático)

### Para Operadores de Carga (Nuevo)

#### Dashboard "Pendientes de Carga"
Los operadores ven una pantalla similar a las gerencias con:

**Lista de Presupuestos Pendientes:**
```
┌─────────────────────────────────────────────────────────────┐
│ 📋 Pendientes de Carga                                      │
├─────────────────────────────────────────────────────────────┤
│ ID: 1234 | Juan Pérez | DNI: 12345678 | $45,000            │
│ Sucursal: Centro | Aprobado hace 2 horas                   │
│ [Tomar Caso]                                               │
├─────────────────────────────────────────────────────────────┤
│ ID: 1235 | María García | DNI: 87654321 | $32,500          │
│ Sucursal: Norte | Aprobado hace 4 horas                    │
│ [Tomar Caso]                                               │
└─────────────────────────────────────────────────────────────┘
```

#### Proceso de Carga - 3 Opciones
1. **Operador hace clic en "Tomar Caso"**
   - Estado cambia a "en_carga"
   - Se asigna al operador (sistema FCFS)
   - Otros operadores ya no pueden tomarlo

2. **Operador tiene 2 opciones de acción:**

   **Opción A: Marcar como Cargado ✅**
   ```
   ┌─────────────────────────────────────────────┐
   │ ✅ Marcar como Cargado                      │
   ├─────────────────────────────────────────────┤
   │ Referencia en sistema externo: *            │
   │ [SIST-2025-001234            ]              │
   │                                             │
   │ [Cancelar]  [Marcar como Cargado]          │
   └─────────────────────────────────────────────┘
   ```

   **Opción B: Devolver ↩️**
   ```
   ┌─────────────────────────────────────────────┐
   │ ↩️ Devolver Presupuesto                     │
   ├─────────────────────────────────────────────┤
   │ Devolver a: [Seleccionar destino ▼]        │
   │   • Usuario Creador (borrador)              │
   │   • Gerencia Administrativa                 │
   │   • Gerencia Prestacional                  │
   │   • Gerencia General                        │
   │                                             │
   │ Motivo de devolución: *                     │
   │ [Datos del paciente incompletos  ]          │
   │ [                               ]          │
   │                                             │
   │ [Cancelar]  [Devolver]                     │
   └─────────────────────────────────────────────┘
   ```

### Casos de Uso para Devoluciones

#### Devolver a Usuario Creador (→ borrador)
- **Datos básicos incorrectos**: DNI inválido, información personal incompleta
- **Documentación personal**: Falta documentación del paciente
- **Información de contacto**: Datos de contacto faltantes o incorrectos
- **Correcciones fundamentales**: Cambios que requieren re-creación

#### Devolver a Gerencia Administrativa
- **Problemas administrativos**: Documentación institucional faltante
- **Autorizaciones pendientes**: Permisos o autorizaciones requeridas
- **Correcciones de forma**: Aspectos administrativos menores
- **Validaciones internas**: Procesos administrativos pendientes

#### Devolver a Gerencia Prestacional
- **Servicios no disponibles**: Prestaciones no existentes en sistema externo
- **Códigos incorrectos**: Códigos de prestación inválidos
- **Límites técnicos**: Cantidades que exceden límites del sistema
- **Validaciones médicas**: Aspectos técnicos que requieren revisión

#### Devolver a Gerencia General
- **Montos excepcionales**: Importes que requieren re-aprobación
- **Casos especiales**: Situaciones que requieren decisión estratégica
- **Políticas institucionales**: Aspectos de política general
- **Excepciones**: Casos que no siguen el flujo estándar

### Para Usuario Creador
Recibe notificaciones automáticas:

**Notificación 1 - Enviado a Carga:**
> 🔄 **Presupuesto #1234 enviado a carga**  
> Tu presupuesto fue aprobado y enviado al equipo de carga para procesamiento en el sistema externo.

**Notificación 2A - Cargado Exitosamente:**
> ✅ **Presupuesto #1234 cargado exitosamente**  
> Tu presupuesto fue cargado en el sistema externo con referencia: SIST-2025-001234

**Notificación 2B - Devuelto para Corrección:**
> ↩️ **Presupuesto #1234 devuelto para corrección**  
> El operador de carga detectó: "Datos del paciente incompletos". Fue devuelto a Usuario para corrección.

### Historial Humanizado
En el historial del presupuesto aparecen las nuevas entradas según el resultado:

**Caso Exitoso:**
```
📋 Historial del Presupuesto #1234

✅ Cargado por Ana López hace 30 minutos
   Referencia externa: SIST-2025-001234

🔄 Tomado para carga por Ana López hace 45 minutos
   Estado: En proceso de carga

📤 Enviado a carga hace 2 horas
   Aprobado por Gerencia General
```

**Caso Devuelto:**
```
📋 Historial del Presupuesto #1234

↩️ Devuelto a Usuario por Ana López hace 15 minutos
   Motivo: "Datos del paciente incompletos"
   Estado: Borrador (requiere corrección)

🔄 Tomado para carga por Ana López hace 45 minutos
   Estado: En proceso de carga

📤 Enviado a carga hace 2 horas
   Aprobado por Gerencia General
```

## Beneficios del Sistema

### Para Operadores de Carga
- **Vista centralizada** de todos los presupuestos aprobados
- **Asignación automática** evita conflictos entre operadores
- **Información completa** del presupuesto sin buscar en otros sistemas
- **Control de calidad** con opciones de devolución flexible
- **Responsabilidad** sin forzar cargas incorrectas
- **Seguimiento** de su productividad y casos procesados

### Para Gerencias
- **Sin cambios** en su flujo actual
- **Visibilidad** del estado post-aprobación
- **Feedback directo** sobre problemas detectados en carga
- **Segunda oportunidad** para corregir y re-aprobar
- **Aprendizaje** de patrones de problemas recurrentes
- **Métricas** de tiempo total desde creación hasta carga

### Para Usuarios Creadores
- **Transparencia total** del proceso
- **Notificaciones automáticas** de progreso
- **Oportunidad de corrección** si es devuelto
- **Referencia externa** para seguimiento en otro sistema

### Para Administradores
- **Métricas completas** de tiempo de procesamiento
- **Identificación de cuellos de botella** en carga
- **Métricas de calidad** (% de devoluciones por gerencia)
- **Patrones de problemas** para capacitación
- **Auditoría completa** de todo el proceso

## Estados del Presupuesto - Vista Completa Actualizada

```
Borrador → Pendiente Administrativa → En Revisión Administrativa
    ↓
Pendiente Prestacional → En Revisión Prestacional  
    ↓
Pendiente General → En Revisión General
    ↓
Aprobado → Pendiente Carga → En Carga → {
    ✅ Cargado (con referencia)
    ↩️ Devolver → Usuario (borrador)
    ↩️ Devolver → G. Administrativa (pendiente_administrativa)
    ↩️ Devolver → G. Prestacional (pendiente_prestacional)
    ↩️ Devolver → G. General (pendiente_general)
}
```

### Ventajas del Flujo de Devolución
- **Reutiliza estados existentes** (sin complejidad adicional en BD)
- **Flexibilidad total** para devolver al punto correcto
- **Trazabilidad completa** de ida y vuelta en auditorías
- **Control de calidad** en etapa final sin forzar cargas incorrectas

## Implementación Técnica

### Migración Requerida
- **Archivo**: `009_agregar_sistema_carga.sql`
- **Tiempo estimado**: 2 minutos
- **Impacto**: Sin downtime (solo agrega campos)

### Desarrollo Requerido
- **Backend**: 2 nuevos endpoints (cargar, devolver)
- **Frontend**: Dashboard con 2 modales de acción
- **Tiempo estimado**: 1 semana

### Rollback Plan
- Los estados nuevos son opcionales
- Se puede revertir cambiando `pendiente_carga` → `aprobado`
- Sin pérdida de datos

## Métricas de Éxito Expandidas

- **Tiempo promedio de carga**: < 4 horas desde aprobación
- **Tasa de éxito en carga**: > 85% (sin devoluciones)
- **Tiempo de re-procesamiento**: < 2 horas para devueltos
- **Trazabilidad**: 100% de presupuestos con seguimiento completo
- **Satisfacción**: Operadores con herramientas de control de calidad
- **Calidad**: Reducción de errores en sistema externo

## Migración SQL

```sql
-- ============================================================================
-- MIGRACIÓN: Sistema de Carga Post-Aprobación
-- Fecha: Enero 2025
-- Base de datos: mh_1
-- ============================================================================

USE mh_1;

-- Agregar nuevos estados
ALTER TABLE presupuestos MODIFY COLUMN estado ENUM(
  'borrador',
  'pendiente_administrativa',
  'en_revision_administrativa',
  'pendiente_prestacional',
  'en_revision_prestacional',
  'pendiente_general',
  'en_revision_general',
  'aprobado',
  'aprobado_condicional',
  'pendiente_carga',        -- NUEVO
  'en_carga',              -- NUEVO
  'cargado',               -- NUEVO
  'rechazado'
) DEFAULT 'borrador';

-- Agregar nuevo rol
ALTER TABLE usuarios MODIFY COLUMN rol ENUM(
  'user',
  'gerencia_administrativa',
  'gerencia_prestacional',
  'gerencia_financiera',
  'gerencia_general',
  'operador_carga',        -- NUEVO
  'admin'
) DEFAULT 'user';

-- Campo para referencia externa
ALTER TABLE presupuestos 
ADD COLUMN referencia_externa VARCHAR(255) NULL 
COMMENT 'Referencia/ID en sistema externo para búsqueda';

-- Índices para performance
CREATE INDEX idx_estado_carga ON presupuestos(estado) 
WHERE estado IN ('pendiente_carga', 'en_carga');

CREATE INDEX idx_referencia_externa ON presupuestos(referencia_externa);

SELECT 'Migración completada exitosamente' AS resultado;
```

## Plan de Implementación

### Fase 1: Base de Datos (1 día)
- [x] Ejecutar migración SQL
- [x] Verificar nuevos estados y roles
- [x] Crear usuario operador de prueba

### Fase 2: Backend (2 días)
- [x] Actualizar `businessRules.ts` con nuevos estados
- [x] Modificar transición automática `aprobado` → `pendiente_carga`
- [x] Crear endpoint `/marcar-cargado`
- [x] Crear endpoint `/devolver-presupuesto` (con destino flexible)
- [x] Actualizar tipos TypeScript

### Fase 3: Frontend (3 días)
- [x] Crear `OperadorCargaDashboard.tsx`
- [x] Modal para marcar como cargado (referencia externa)
- [x] Modal para devolver (selector destino + motivo)
- [x] Integrar con sistema de notificaciones SSE
- [x] Actualizar historial humanizado con nuevos casos

### Fase 4: Testing (1 día)
- [x] Pruebas de flujo completo (2 escenarios)
- [x] Verificar notificaciones automáticas
- [x] Probar devoluciones a cada destino
- [x] Validar re-procesamiento de devueltos
- [x] Validar métricas y reportes

## Riesgos y Mitigaciones

### Riesgo 1: Sobrecarga de Operadores
**Mitigación**: Sistema FCFS con auto-liberación (30 min) como gerencias

### Riesgo 2: Referencias Duplicadas
**Mitigación**: Validación en frontend + índice único opcional

### Riesgo 3: Pérdida de Trazabilidad
**Mitigación**: Auditoría completa en `auditorias_presupuestos`

### Riesgo 4: Bucles Infinitos de Devolución
**Mitigación**: Límite de 2 devoluciones por presupuesto + escalamiento automático

## Conclusión

Este sistema completa el ciclo de vida del presupuesto agregando visibilidad y control sobre la etapa final de carga en sistema externo, **incluyendo mecanismos de control de calidad** que permiten a los operadores devolver presupuestos problemáticos al punto correcto del flujo para corrección, manteniendo la integridad del proceso y mejorando la calidad general del sistema.

### Características Clave del Sistema de Devolución
- **Flexibilidad total**: Devolver a cualquier punto del flujo (Usuario, G. Administrativa, G. Prestacional, G. General)
- **Reutilización inteligente**: Usa estados existentes sin complejidad adicional
- **Control de calidad**: Evita cargas incorrectas en sistema externo
- **Trazabilidad completa**: Historial detallado de ida y vuelta
- **Notificaciones automáticas**: Todos los involucrados reciben feedback inmediato