# Análisis Actualizado de Base de Datos (Tablas-full2.csv)

## ✅ MEJORAS YA APLICADAS

### Tipos de Datos Corregidos
- ✅ `presupuestos.total_insumos`: Ahora es DECIMAL(10,2)
- ✅ `presupuestos.total_prestaciones`: Ahora es DECIMAL(10,2)
- ✅ `presupuestos.costo_total`: Ahora es DECIMAL(10,2)
- ✅ `presupuesto_insumos.costo`: Ahora es DECIMAL(10,2)
- ✅ `presupuesto_insumos.precio_facturar`: Ahora es DECIMAL(10,2)

### Foreign Keys Agregadas
- ✅ `presupuesto_insumos.id_insumo` → `insumos.idInsumos` (NUEVA!)
- ✅ `usuarios.sucursal_id` → `sucursales_mh.ID`
- ✅ `presupuestos.usuario_id` → `usuarios.id`
- ✅ `presupuestos.presupuesto_padre` → `presupuestos.idPresupuestos`

### Nuevas Columnas
- ✅ `presupuestos.porcentaje_insumos`: DECIMAL(5,2) - Porcentaje de margen aplicado

## 🔴 PROBLEMAS PENDIENTES

### 1. Tipos de Datos Incorrectos

#### Tabla `insumos`
```sql
-- PROBLEMA: costo sigue siendo INT
insumos.costo: int → Debería ser DECIMAL(10,2)
```

#### Tabla `presupuestos`
```sql
-- PROBLEMA: DNI es INT, no soporta DNI extranjeros con letras
presupuestos.DNI: int → Debería ser VARCHAR(20)
```

### 2. Foreign Keys Faltantes

#### Tabla `presupuestos`
```sql
-- CRÍTICO: No tiene FK a financiador
presupuestos.idobra_social (int) → financiador.idobra_social
-- Sin FK, permite valores huérfanos

-- CRÍTICO: Sucursal es VARCHAR sin FK
presupuestos.Sucursal (varchar) → Debería ser sucursal_id con FK a sucursales_mh.ID
```

#### Tabla `presupuesto_prestaciones`
```sql
-- CRÍTICO: id_servicio es VARCHAR sin FK
presupuesto_prestaciones.id_servicio: varchar(50) → Debería ser INT con FK a servicios.id_servicio
```

### 3. Primary Keys Compuestas Innecesarias

#### Tabla `insumos`
```sql
-- PROBLEMA: Tiene PK compuesta (idInsumos + producto)
-- Solo debería ser idInsumos como PK
-- producto debería ser UNIQUE KEY separado
```

#### Tabla `sucursales_mh`
```sql
-- PROBLEMA: Tiene PK compuesta (ID + Sucursales_mh)
-- Solo debería ser ID como PK
-- Sucursales_mh debería ser UNIQUE KEY separado
```

### 4. Índices Faltantes para Performance

```sql
-- Recomendados para mejorar queries
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX idx_presupuestos_created_at ON presupuestos(created_at);
CREATE INDEX idx_presupuestos_financiador ON presupuestos(idobra_social);
CREATE INDEX idx_notificaciones_estado ON notificaciones(estado);
CREATE INDEX idx_notificaciones_creado_en ON notificaciones(creado_en);
```

### 5. Problemas de Diseño

#### Duplicación de Datos
```sql
-- presupuestos.Sucursal almacena NOMBRE en lugar de ID
-- Debería usar sucursal_id (ya existe pero no se usa)

-- presupuesto_prestaciones.prestacion duplica nombre
-- Debería obtenerlo de servicios.nombre via JOIN

-- presupuesto_insumos.producto duplica nombre
-- Ahora tiene id_insumo (FK) pero producto sigue duplicado
```

## 📊 COMPARACIÓN: ANTES vs AHORA

| Campo | Antes | Ahora | Estado |
|-------|-------|-------|--------|
| presupuestos.total_insumos | INT | DECIMAL(10,2) | ✅ CORREGIDO |
| presupuestos.costo_total | INT | DECIMAL(10,2) | ✅ CORREGIDO |
| insumos.costo | INT | INT | ❌ PENDIENTE |
| presupuestos.DNI | INT | INT | ❌ PENDIENTE |
| presupuestos.idobra_social FK | ❌ No | ❌ No | ❌ PENDIENTE |
| presupuesto_insumos.id_insumo FK | ❌ No | ✅ Sí | ✅ AGREGADO |
| presupuesto_prestaciones.id_servicio FK | ❌ No | ❌ No | ❌ PENDIENTE |

## 🎯 PRIORIDADES DE CORRECCIÓN

### CRÍTICO (Afecta integridad referencial)
1. ⚠️ Agregar FK: `presupuestos.idobra_social` → `financiador.idobra_social`
2. ⚠️ Cambiar `presupuesto_prestaciones.id_servicio` de VARCHAR a INT + FK
3. ⚠️ Migrar `presupuestos.Sucursal` a usar `sucursal_id` existente

### IMPORTANTE (Afecta funcionalidad)
4. 🔧 Cambiar `insumos.costo` de INT a DECIMAL(10,2)
5. 🔧 Cambiar `presupuestos.DNI` de INT a VARCHAR(20)

### RECOMENDADO (Mejora diseño)
6. 📝 Limpiar PKs compuestas en `insumos` y `sucursales_mh`
7. 📝 Agregar índices para performance
8. 📝 Eliminar columnas duplicadas (prestacion, producto)

## 🔧 SCRIPT DE CORRECCIÓN PENDIENTE

Ver: `corregir_problemas_pendientes.sql`

## 📋 ORDEN CORRECTO PARA BACKUP/RESTORE

### Tablas sin FK (Maestras)
1. usuarios
2. sucursales_mh
3. financiador_acuerdo
4. financiador
5. servicios
6. insumos

### Tablas con FK simples
7. prestador_servicio
8. prestador_servicio_valores

### Tabla principal
9. presupuestos

### Tablas dependientes
10. presupuesto_insumos
11. presupuesto_prestaciones
12. auditorias_presupuestos
13. notificaciones

## ✅ VERIFICACIÓN DE INTEGRIDAD

```sql
-- Verificar registros huérfanos en presupuestos.idobra_social
SELECT COUNT(*) 
FROM presupuestos 
WHERE idobra_social IS NOT NULL 
  AND idobra_social NOT IN (SELECT idobra_social FROM financiador);

-- Verificar registros huérfanos en presupuesto_prestaciones.id_servicio
SELECT COUNT(*) 
FROM presupuesto_prestaciones pp
LEFT JOIN servicios s ON CAST(pp.id_servicio AS UNSIGNED) = s.id_servicio
WHERE s.id_servicio IS NULL;

-- Verificar presupuestos sin sucursal_id
SELECT COUNT(*) 
FROM presupuestos 
WHERE sucursal_id IS NULL;
```
