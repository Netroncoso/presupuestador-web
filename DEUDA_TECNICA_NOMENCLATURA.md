# Deuda Técnica - Nomenclatura de Tablas

## Problema Identificado

### 🔴 PROBLEMA CONCEPTUAL CRÍTICO

**Tabla `tipos_unidad` está mal nombrada:**
- ❌ Nombre actual: `tipos_unidad`
- ✅ Debería ser: `tipo_servicio` o `tipos_servicio`
- **Razón**: La tabla contiene tipos de **servicios** (horas, sesiones, consultas, días), NO tipos de unidades genéricas

**Datos actuales en `tipos_unidad`:**
```
- horas
- sesiones
- consultas
- días
- unidades
- horas nocturnas
```

Estos son **tipos de servicios médicos**, no "unidades de medida".

### Estado Actual
- ❌ `tipos_unidad` → **NOMBRE INCORRECTO** (debería ser `tipo_servicio`)
- ❌ `tipos_equipamiento` → Inconsistente con nomenclatura

### Propuesta de Estandarización (RECOMENDADO)

```sql
tipos_unidad → tipo_servicio
tipos_equipamiento → tipo_equipamiento
```

**Justificación:**
- Singular consistente
- Nombre semánticamente correcto
- Refleja el contenido real de las tablas

## Impacto de la Migración

### Backend (Archivos afectados)
- `backend/src/controllers/tiposUnidadController.ts` → `tipoServicioController.ts`
- `backend/src/controllers/tiposEquipamientoController.ts` → `tipoEquipamientoController.ts`
- `backend/src/routes/tiposUnidad.ts` → `tipoServicio.ts`
- `backend/src/routes/tiposEquipamiento.ts` → `tipoEquipamiento.ts`
- `backend/src/services/prestacionesService.ts` (actualizar queries)
- `backend/src/services/equipamientosService.ts` (actualizar queries)
- `backend/src/types/database.ts` (actualizar interfaces)
- Todas las queries SQL que referencian estas tablas (~30+ referencias)

### Frontend (Archivos afectados)
- `frontend/src/pages/admin/GestionTiposUnidad.tsx` → `GestionTipoServicio.tsx`
- `frontend/src/pages/admin/GestionTiposEquipamiento.tsx` → `GestionTipoEquipamiento.tsx`
- `frontend/src/pages/admin/GestionAlertasServicios.tsx` (actualizar endpoints)
- `frontend/src/pages/admin/GestionAlertasEquipamientos.tsx` (actualizar endpoints)
- `frontend/src/pages/admin/AdminDashboard.tsx` (actualizar tabs)
- Todas las llamadas API que usan estos endpoints

### Base de Datos
- Renombrar tablas con nombres semánticamente correctos
- Actualizar Foreign Keys:
  - `servicios.tipo_unidad` → `servicios.tipo_servicio` (renombrar columna + FK)
  - `equipamientos.tipo_equipamiento_id` → FK a tabla renombrada
  - `alertas_servicios.tipo_unidad` → `alertas_servicios.tipo_servicio` (renombrar columna + FK)

### Migraciones Necesarias

```sql
-- ============================================
-- Migración: Renombrar tipos_unidad → tipo_servicio
-- ============================================

USE mh_1;

-- Paso 1: Renombrar tablas
RENAME TABLE tipos_unidad TO tipo_servicio;
RENAME TABLE tipos_equipamiento TO tipo_equipamiento;

-- Paso 2: Actualizar columnas y Foreign Keys en servicios
ALTER TABLE servicios DROP FOREIGN KEY fk_servicios_tipo_unidad;
ALTER TABLE servicios CHANGE COLUMN tipo_unidad tipo_servicio VARCHAR(50);
ALTER TABLE servicios ADD CONSTRAINT fk_servicios_tipo_servicio 
    FOREIGN KEY (tipo_servicio) REFERENCES tipo_servicio(nombre);

-- Paso 3: Actualizar Foreign Keys en equipamientos
ALTER TABLE equipamientos DROP FOREIGN KEY fk_equipamiento_tipo;
ALTER TABLE equipamientos ADD CONSTRAINT fk_equipamiento_tipo 
    FOREIGN KEY (tipo_equipamiento_id) REFERENCES tipo_equipamiento(id);

-- Paso 4: Actualizar columnas y Foreign Keys en alertas_servicios
ALTER TABLE alertas_servicios DROP FOREIGN KEY fk_alertas_tipo_unidad;
ALTER TABLE alertas_servicios CHANGE COLUMN tipo_unidad tipo_servicio VARCHAR(50);
ALTER TABLE alertas_servicios ADD CONSTRAINT fk_alertas_tipo_servicio 
    FOREIGN KEY (tipo_servicio) REFERENCES tipo_servicio(nombre);

-- Verificar cambios
SHOW TABLES LIKE 'tipo_%';
DESCRIBE servicios;
DESCRIBE alertas_servicios;
```

## Estimación de Esfuerzo

- **Backend**: ~3 horas (renombrar archivos, actualizar queries, tipos, endpoints)
- **Frontend**: ~2 horas (renombrar componentes, actualizar endpoints, tabs)
- **Base de Datos**: ~1 hora (migración + renombrar columnas + testing)
- **Testing**: ~2 horas (verificar todas las funcionalidades afectadas)
- **Total**: ~8 horas

## Prioridad

**MEDIA** - Afecta claridad del código y mantenibilidad futura.
- Nombre actual confunde el propósito de la tabla
- Dificulta onboarding de nuevos desarrolladores
- Puede causar errores conceptuales en futuras features

## Notas

- Realizar en una rama separada
- Hacer backup completo antes de ejecutar
- Probar exhaustivamente en desarrollo antes de producción
- Considerar hacerlo junto con otras refactorizaciones de BD

## Fecha Identificación

Enero 2025

## Impacto en Código

### Búsquedas necesarias para actualizar:
```bash
# Backend
grep -r "tipos_unidad" backend/src/
grep -r "tiposUnidad" backend/src/
grep -r "tipo_unidad" backend/src/

# Frontend
grep -r "tipos-unidad" frontend/src/
grep -r "tiposUnidad" frontend/src/
```

### Endpoints afectados:
- `GET /api/tipos-unidad` → `/api/tipo-servicio`
- `POST /api/tipos-unidad` → `/api/tipo-servicio`
- `PUT /api/tipos-unidad/:id` → `/api/tipo-servicio/:id`
- `DELETE /api/tipos-unidad/:id` → `/api/tipo-servicio/:id`

## Estado

⏳ PENDIENTE - Para próxima refactorización

## Recomendación

**Hacer esta refactorización ANTES de escalar el sistema** para evitar:
- Confusión en el equipo
- Errores conceptuales
- Mayor costo de cambio en el futuro
