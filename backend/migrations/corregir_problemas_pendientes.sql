-- ============================================================================
-- CORRECCIÓN DE PROBLEMAS PENDIENTES
-- Basado en análisis de Tablas-full2.csv
-- ============================================================================
-- IMPORTANTE: Hacer backup completo antes de ejecutar
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- PASO 1: CORREGIR insumos.costo (INT → DECIMAL)
-- ============================================================================

ALTER TABLE insumos 
  MODIFY COLUMN costo DECIMAL(10,2) DEFAULT 0;

-- ============================================================================
-- PASO 2: CORREGIR presupuestos.DNI (INT → VARCHAR)
-- ============================================================================

ALTER TABLE presupuestos 
  MODIFY COLUMN DNI VARCHAR(20) NOT NULL;

-- ============================================================================
-- PASO 3: LIMPIAR PRIMARY KEYS COMPUESTAS
-- ============================================================================

-- Limpiar PK de insumos (mantener solo idInsumos)
ALTER TABLE insumos DROP PRIMARY KEY;
ALTER TABLE insumos ADD PRIMARY KEY (idInsumos);
ALTER TABLE insumos ADD UNIQUE KEY unique_producto (producto);

-- Limpiar PK de sucursales_mh (mantener solo ID)
ALTER TABLE sucursales_mh DROP PRIMARY KEY;
ALTER TABLE sucursales_mh ADD PRIMARY KEY (ID);
ALTER TABLE sucursales_mh ADD UNIQUE KEY unique_sucursal_nombre (Sucursales_mh);

-- ============================================================================
-- PASO 4: AGREGAR FK presupuestos.idobra_social → financiador
-- ============================================================================

-- Verificar registros huérfanos ANTES de agregar FK
SELECT 
  p.idPresupuestos,
  p.idobra_social,
  'HUÉRFANO' as estado
FROM presupuestos p
WHERE p.idobra_social IS NOT NULL 
  AND p.idobra_social NOT IN (SELECT idobra_social FROM financiador);

-- Si hay huérfanos, corregirlos o ponerlos en NULL
-- UPDATE presupuestos SET idobra_social = NULL WHERE idobra_social NOT IN (SELECT idobra_social FROM financiador);

-- Agregar FK
ALTER TABLE presupuestos 
  ADD CONSTRAINT fk_presupuestos_financiador 
  FOREIGN KEY (idobra_social) 
  REFERENCES financiador(idobra_social)
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- ============================================================================
-- PASO 5: MIGRAR presupuestos.Sucursal a sucursal_id
-- ============================================================================

-- Actualizar sucursal_id basado en nombre de Sucursal
UPDATE presupuestos p
INNER JOIN sucursales_mh s ON p.Sucursal = s.Sucursales_mh
SET p.sucursal_id = s.ID
WHERE p.sucursal_id IS NULL;

-- Verificar que todos tienen sucursal_id
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN sucursal_id IS NULL THEN 1 ELSE 0 END) as sin_sucursal_id
FROM presupuestos;

-- Si todos tienen sucursal_id, hacer NOT NULL
-- ALTER TABLE presupuestos MODIFY COLUMN sucursal_id INT NOT NULL;

-- Opcional: Eliminar columna Sucursal antigua (después de verificar)
-- ALTER TABLE presupuestos DROP COLUMN Sucursal;

-- ============================================================================
-- PASO 6: CORREGIR presupuesto_prestaciones.id_servicio (VARCHAR → INT)
-- ============================================================================

-- Agregar nueva columna temporal
ALTER TABLE presupuesto_prestaciones 
  ADD COLUMN id_servicio_int INT NULL AFTER id_servicio;

-- Migrar datos (convertir VARCHAR a INT)
UPDATE presupuesto_prestaciones 
SET id_servicio_int = CAST(id_servicio AS UNSIGNED)
WHERE id_servicio REGEXP '^[0-9]+$';

-- Verificar registros que no se pudieron convertir
SELECT 
  id,
  id_servicio,
  id_servicio_int,
  'NO CONVERTIDO' as estado
FROM presupuesto_prestaciones 
WHERE id_servicio_int IS NULL;

-- Si todos se convirtieron correctamente:
-- 1. Eliminar columna antigua
-- ALTER TABLE presupuesto_prestaciones DROP COLUMN id_servicio;

-- 2. Renombrar nueva columna
-- ALTER TABLE presupuesto_prestaciones CHANGE id_servicio_int id_servicio INT NOT NULL;

-- 3. Agregar FK
-- ALTER TABLE presupuesto_prestaciones 
--   ADD CONSTRAINT fk_presupuesto_prestaciones_servicio 
--   FOREIGN KEY (id_servicio) 
--   REFERENCES servicios(id_servicio)
--   ON DELETE RESTRICT
--   ON UPDATE CASCADE;

-- ============================================================================
-- PASO 7: AGREGAR ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices en presupuestos
CREATE INDEX IF NOT EXISTS idx_presupuestos_estado ON presupuestos(estado);
CREATE INDEX IF NOT EXISTS idx_presupuestos_created_at ON presupuestos(created_at);
CREATE INDEX IF NOT EXISTS idx_presupuestos_financiador ON presupuestos(idobra_social);
CREATE INDEX IF NOT EXISTS idx_presupuestos_sucursal ON presupuestos(sucursal_id);

-- Índices en notificaciones
CREATE INDEX IF NOT EXISTS idx_notificaciones_estado ON notificaciones(estado);
CREATE INDEX IF NOT EXISTS idx_notificaciones_creado_en ON notificaciones(creado_en);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON notificaciones(tipo);

-- Índices en auditorias
CREATE INDEX IF NOT EXISTS idx_auditorias_fecha ON auditorias_presupuestos(fecha);
CREATE INDEX IF NOT EXISTS idx_auditorias_estado ON auditorias_presupuestos(estado_nuevo);

-- Índices en prestador_servicio_valores
CREATE INDEX IF NOT EXISTS idx_psv_fechas ON prestador_servicio_valores(fecha_inicio, fecha_fin);

-- Índices en presupuesto_insumos
CREATE INDEX IF NOT EXISTS idx_pi_insumo ON presupuesto_insumos(id_insumo);

-- ============================================================================
-- PASO 8: VERIFICACIONES FINALES
-- ============================================================================

-- Ver todas las FKs
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Ver todos los índices
SELECT 
  TABLE_NAME,
  INDEX_NAME,
  GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS,
  INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
GROUP BY TABLE_NAME, INDEX_NAME, INDEX_TYPE
ORDER BY TABLE_NAME, INDEX_NAME;

-- Verificar tipos de datos críticos
SELECT 
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_KEY,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND (
    (TABLE_NAME = 'presupuestos' AND COLUMN_NAME IN ('DNI', 'idobra_social', 'sucursal_id', 'costo_total'))
    OR (TABLE_NAME = 'insumos' AND COLUMN_NAME = 'costo')
    OR (TABLE_NAME = 'presupuesto_prestaciones' AND COLUMN_NAME = 'id_servicio')
  )
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Contar registros por tabla
SELECT 
  'usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'sucursales_mh', COUNT(*) FROM sucursales_mh
UNION ALL
SELECT 'financiador', COUNT(*) FROM financiador
UNION ALL
SELECT 'servicios', COUNT(*) FROM servicios
UNION ALL
SELECT 'insumos', COUNT(*) FROM insumos
UNION ALL
SELECT 'prestador_servicio', COUNT(*) FROM prestador_servicio
UNION ALL
SELECT 'presupuestos', COUNT(*) FROM presupuestos
UNION ALL
SELECT 'presupuesto_insumos', COUNT(*) FROM presupuesto_insumos
UNION ALL
SELECT 'presupuesto_prestaciones', COUNT(*) FROM presupuesto_prestaciones
UNION ALL
SELECT 'notificaciones', COUNT(*) FROM notificaciones;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- RESUMEN DE CAMBIOS
-- ============================================================================
/*
✅ insumos.costo: INT → DECIMAL(10,2)
✅ presupuestos.DNI: INT → VARCHAR(20)
✅ insumos: PK limpiada (solo idInsumos)
✅ sucursales_mh: PK limpiada (solo ID)
✅ FK agregada: presupuestos.idobra_social → financiador
✅ Migración: presupuestos.Sucursal → sucursal_id
⚠️ presupuesto_prestaciones.id_servicio: VARCHAR → INT (requiere verificación manual)
✅ Índices agregados para performance
*/
