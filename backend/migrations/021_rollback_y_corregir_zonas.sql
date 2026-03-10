-- ============================================================================
-- MIGRACIÓN: ROLLBACK Y CORREGIR ZONAS
-- ============================================================================
-- Fecha: Febrero 2025
-- Descripción: Revertir migración 020 y corregir valores de zona
-- ============================================================================

USE mh_1;

START TRANSACTION;

-- 1. RECREAR COLUMNA zona_id EN tarifario_servicio_valores
-- ============================================================================

-- Agregar columna zona_id si no existe
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'tarifario_servicio_valores' AND COLUMN_NAME = 'zona_id' AND TABLE_SCHEMA = 'mh_1');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE tarifario_servicio_valores ADD COLUMN zona_id INT NOT NULL DEFAULT 1 AFTER servicio_id', 
  'SELECT "Column zona_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Copiar zona_tarifario_id a zona_id (para backup)
SET SQL_SAFE_UPDATES = 0;
UPDATE tarifario_servicio_valores 
SET zona_id = zona_tarifario_id;
SET SQL_SAFE_UPDATES = 1;

-- 2. AHORA CORREGIR: Copiar zona_id a zona_tarifario_id SIEMPRE (no solo NULL)
-- ============================================================================

-- Esta vez forzar la copia sin condición de NULL
SET SQL_SAFE_UPDATES = 0;
UPDATE tarifario_servicio_valores 
SET zona_tarifario_id = zona_id;
SET SQL_SAFE_UPDATES = 1;

-- 3. ELIMINAR zona_id NUEVAMENTE
-- ============================================================================

-- Eliminar FK si existe
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'tarifario_servicio_valores' 
  AND COLUMN_NAME = 'zona_id'
  AND TABLE_SCHEMA = 'mh_1');

SET @fk_name = (SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'tarifario_servicio_valores' 
  AND COLUMN_NAME = 'zona_id' 
  AND TABLE_SCHEMA = 'mh_1' 
  LIMIT 1);

SET @sql = IF(@fk_exists > 0, 
  CONCAT('ALTER TABLE tarifario_servicio_valores DROP FOREIGN KEY ', @fk_name), 
  'SELECT "FK does not exist"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Eliminar columna zona_id
ALTER TABLE tarifario_servicio_valores DROP COLUMN zona_id;

-- 4. HACER LO MISMO PARA financiador_servicio_valores
-- ============================================================================

-- Agregar columna zona_id si no existe
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'financiador_servicio_valores' AND COLUMN_NAME = 'zona_id' AND TABLE_SCHEMA = 'mh_1');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE financiador_servicio_valores ADD COLUMN zona_id INT NOT NULL DEFAULT 1 AFTER financiador_servicio_id', 
  'SELECT "Column zona_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Copiar zona_financiador_id a zona_id (para backup)
SET SQL_SAFE_UPDATES = 0;
UPDATE financiador_servicio_valores 
SET zona_id = zona_financiador_id;
SET SQL_SAFE_UPDATES = 1;

-- Copiar zona_id a zona_financiador_id SIEMPRE
SET SQL_SAFE_UPDATES = 0;
UPDATE financiador_servicio_valores 
SET zona_financiador_id = zona_id;
SET SQL_SAFE_UPDATES = 1;

-- Eliminar FK si existe
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'financiador_servicio_valores' 
  AND COLUMN_NAME = 'zona_id'
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

-- Eliminar columna zona_id
ALTER TABLE financiador_servicio_valores DROP COLUMN zona_id;

COMMIT;

SELECT 'Migración completada: Zonas corregidas' as status;

-- Verificar distribución de zonas
SELECT zona_tarifario_id, COUNT(*) as cantidad 
FROM tarifario_servicio_valores 
GROUP BY zona_tarifario_id 
ORDER BY zona_tarifario_id;
