-- ============================================================================
-- MIGRACIÓN: LIMPIAR COLUMNAS DE ZONA (CONSOLIDAR SISTEMA DUAL)
-- ============================================================================
-- Fecha: Febrero 2025
-- Descripción: Eliminar columnas duplicadas y consolidar sistema dual de zonas
-- ============================================================================

USE mh_1;

START TRANSACTION;

-- 1. VERIFICAR Y ELIMINAR zona_id DE tarifario_servicio_valores (usar zona_tarifario_id)
-- ============================================================================

-- Migrar datos de zona_id a zona_tarifario_id si existen ambas
SET SQL_SAFE_UPDATES = 0;
UPDATE tarifario_servicio_valores 
SET zona_tarifario_id = zona_id 
WHERE zona_tarifario_id IS NULL AND zona_id IS NOT NULL;
SET SQL_SAFE_UPDATES = 1;

-- Eliminar FK si existe
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'tarifario_servicio_valores' 
  AND CONSTRAINT_NAME = 'tarifario_servicio_valores_ibfk_2' 
  AND TABLE_SCHEMA = 'mh_1');

SET @sql = IF(@fk_exists > 0, 
  'ALTER TABLE tarifario_servicio_valores DROP FOREIGN KEY tarifario_servicio_valores_ibfk_2', 
  'SELECT "FK does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Eliminar columna zona_id si existe
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'tarifario_servicio_valores' AND COLUMN_NAME = 'zona_id' AND TABLE_SCHEMA = 'mh_1');

SET @sql = IF(@column_exists > 0, 
  'ALTER TABLE tarifario_servicio_valores DROP COLUMN zona_id', 
  'SELECT "Column zona_id does not exist in tarifario_servicio_valores"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. VERIFICAR Y ELIMINAR zona_id DE financiador_servicio_valores (usar zona_financiador_id)
-- ============================================================================

-- Migrar datos de zona_id a zona_financiador_id si existen ambas
SET SQL_SAFE_UPDATES = 0;
UPDATE financiador_servicio_valores 
SET zona_financiador_id = zona_id 
WHERE zona_financiador_id IS NULL AND zona_id IS NOT NULL;
SET SQL_SAFE_UPDATES = 1;

-- Eliminar FK si existe
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'financiador_servicio_valores' 
  AND CONSTRAINT_NAME LIKE '%zona_id%' 
  AND TABLE_SCHEMA = 'mh_1');

SET @fk_name = (SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'financiador_servicio_valores' 
  AND COLUMN_NAME = 'zona_id' 
  AND TABLE_SCHEMA = 'mh_1' 
  LIMIT 1);

SET @sql = IF(@fk_exists > 0, 
  CONCAT('ALTER TABLE financiador_servicio_valores DROP FOREIGN KEY ', @fk_name), 
  'SELECT "FK does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Eliminar columna zona_id si existe
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'financiador_servicio_valores' AND COLUMN_NAME = 'zona_id' AND TABLE_SCHEMA = 'mh_1');

SET @sql = IF(@column_exists > 0, 
  'ALTER TABLE financiador_servicio_valores DROP COLUMN zona_id', 
  'SELECT "Column zona_id does not exist in financiador_servicio_valores"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. VERIFICACIÓN FINAL
-- ============================================================================

COMMIT;

SELECT 'Migración completada: Sistema dual de zonas consolidado' as status;

-- Verificar estructura final
DESCRIBE tarifario_servicio_valores;
DESCRIBE financiador_servicio_valores;
