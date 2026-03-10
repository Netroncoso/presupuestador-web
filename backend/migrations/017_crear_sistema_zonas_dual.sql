-- ============================================================================
-- MIGRACIÓN: SISTEMA DUAL DE ZONAS (TARIFARIO + FINANCIADOR)
-- ============================================================================
-- Fecha: Enero 2025
-- Descripción: Separa zonas de tarifario (costo) de zonas de financiador (precio)
-- ============================================================================

USE mh_1;

-- Iniciar transacción para rollback en caso de error
START TRANSACTION;

-- 1. CREAR TABLA ZONAS FINANCIADOR
-- ============================================================================

CREATE TABLE IF NOT EXISTS financiador_zonas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar zonas genéricas solo si no existen
INSERT IGNORE INTO financiador_zonas (nombre, descripcion) VALUES
('Zona 1', 'Zona 1 - Financiadores'),
('Zona 2', 'Zona 2 - Financiadores'),
('Zona 3', 'Zona 3 - Financiadores'),
('Zona 4', 'Zona 4 - Financiadores'),
('Zona 5', 'Zona 5 - Financiadores');

-- 2. MAPEO FINANCIADOR → ZONAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS financiador_zona_mapeo (
  id INT PRIMARY KEY AUTO_INCREMENT,
  financiador_id INT NOT NULL,
  zona_id INT NOT NULL,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (financiador_id) REFERENCES financiador(id) ON DELETE CASCADE,
  FOREIGN KEY (zona_id) REFERENCES financiador_zonas(id) ON DELETE CASCADE,
  UNIQUE KEY idx_financiador_zona (financiador_id, zona_id),
  KEY idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. MODIFICAR financiador_servicio_valores (NO prestador_servicio_valores)
-- ============================================================================

-- Verificar si zona_financiador_id ya existe
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'financiador_servicio_valores' AND COLUMN_NAME = 'zona_financiador_id' AND TABLE_SCHEMA = 'mh_1');

-- Solo proceder si zona_financiador_id no existe
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE financiador_servicio_valores ADD COLUMN zona_financiador_id INT NOT NULL DEFAULT 1', 
  'SELECT "Column zona_financiador_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrar datos existentes
SET SQL_SAFE_UPDATES = 0;
UPDATE financiador_servicio_valores 
SET zona_financiador_id = 1 
WHERE zona_financiador_id NOT IN (SELECT id FROM financiador_zonas);
SET SQL_SAFE_UPDATES = 1;

-- Agregar constraint si no existe
SET @constraint_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'financiador_servicio_valores' AND CONSTRAINT_NAME = 'fk_financiador_servicio_zona_financiador' AND TABLE_SCHEMA = 'mh_1');

SET @sql = IF(@constraint_exists = 0, 
  'ALTER TABLE financiador_servicio_valores ADD CONSTRAINT fk_financiador_servicio_zona_financiador FOREIGN KEY (zona_financiador_id) REFERENCES financiador_zonas(id) ON DELETE CASCADE', 
  'SELECT "Constraint already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4. CREAR/VERIFICAR TABLA ZONAS TARIFARIO
-- ============================================================================

CREATE TABLE IF NOT EXISTS tarifario_zonas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  activo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar zonas genéricas solo si no existen
INSERT IGNORE INTO tarifario_zonas (nombre, descripcion) VALUES
('Zona 1', 'Zona 1 - Tarifarios'),
('Zona 2', 'Zona 2 - Tarifarios'),
('Zona 3', 'Zona 3 - Tarifarios'),
('Zona 4', 'Zona 4 - Tarifarios'),
('Zona 5', 'Zona 5 - Tarifarios');

-- 5. MODIFICAR tarifario_servicio_valores
-- ============================================================================

-- Verificar si zona_tarifario_id ya existe
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'tarifario_servicio_valores' AND COLUMN_NAME = 'zona_tarifario_id' AND TABLE_SCHEMA = 'mh_1');

-- Solo proceder si zona_tarifario_id no existe
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE tarifario_servicio_valores ADD COLUMN zona_tarifario_id INT NOT NULL DEFAULT 1', 
  'SELECT "Column zona_tarifario_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrar datos existentes
SET SQL_SAFE_UPDATES = 0;
UPDATE tarifario_servicio_valores 
SET zona_tarifario_id = 1 
WHERE zona_tarifario_id NOT IN (SELECT id FROM tarifario_zonas);
SET SQL_SAFE_UPDATES = 1;

-- Agregar constraint si no existe
SET @constraint_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'tarifario_servicio_valores' AND CONSTRAINT_NAME = 'fk_tarifario_servicio_zona_tarifario' AND TABLE_SCHEMA = 'mh_1');

SET @sql = IF(@constraint_exists = 0, 
  'ALTER TABLE tarifario_servicio_valores ADD CONSTRAINT fk_tarifario_servicio_zona_tarifario FOREIGN KEY (zona_tarifario_id) REFERENCES tarifario_zonas(id) ON DELETE CASCADE', 
  'SELECT "Constraint already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6. MODIFICAR TABLA PRESUPUESTOS
-- ============================================================================

-- Verificar si zona_tarifario_id ya existe
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'presupuestos' AND COLUMN_NAME = 'zona_tarifario_id' AND TABLE_SCHEMA = 'mh_1');

-- Solo proceder si zona_tarifario_id no existe
SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE presupuestos ADD COLUMN zona_tarifario_id INT NULL', 
  'SELECT "Column zona_tarifario_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrar datos existentes
SET SQL_SAFE_UPDATES = 0;
UPDATE presupuestos 
SET zona_tarifario_id = 1 
WHERE zona_tarifario_id IS NOT NULL 
AND zona_tarifario_id NOT IN (SELECT id FROM tarifario_zonas);
SET SQL_SAFE_UPDATES = 1;

-- Agregar constraint si no existe
SET @constraint_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'presupuestos' AND CONSTRAINT_NAME = 'fk_presupuestos_zona_tarifario' AND TABLE_SCHEMA = 'mh_1');

SET @sql = IF(@constraint_exists = 0, 
  'ALTER TABLE presupuestos ADD CONSTRAINT fk_presupuestos_zona_tarifario FOREIGN KEY (zona_tarifario_id) REFERENCES tarifario_zonas(id)', 
  'SELECT "Constraint already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar zona_financiador_id si no existe
SET @column_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'presupuestos' AND COLUMN_NAME = 'zona_financiador_id' AND TABLE_SCHEMA = 'mh_1');

SET @sql = IF(@column_exists = 0, 
  'ALTER TABLE presupuestos ADD COLUMN zona_financiador_id INT NULL AFTER zona_tarifario_id', 
  'SELECT "Column zona_financiador_id already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Agregar constraint para zona_financiador_id si no existe
SET @constraint_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
  WHERE TABLE_NAME = 'presupuestos' AND CONSTRAINT_NAME = 'fk_presupuestos_zona_financiador' AND TABLE_SCHEMA = 'mh_1');

SET @sql = IF(@constraint_exists = 0, 
  'ALTER TABLE presupuestos ADD CONSTRAINT fk_presupuestos_zona_financiador FOREIGN KEY (zona_financiador_id) REFERENCES financiador_zonas(id)', 
  'SELECT "Constraint already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Crear índice si no existe
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
  WHERE TABLE_NAME = 'presupuestos' AND INDEX_NAME = 'idx_presupuestos_zona_financiador' AND TABLE_SCHEMA = 'mh_1');

SET @sql = IF(@index_exists = 0, 
  'CREATE INDEX idx_presupuestos_zona_financiador ON presupuestos(zona_financiador_id)', 
  'SELECT "Index already exists"');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. MODIFICAR TABLA presupuesto_prestaciones
-- ============================================================================

-- Agregar columnas para mapeo servicio financiador → tarifario
ALTER TABLE presupuesto_prestaciones 
ADD COLUMN id_servicio_tarifario INT NULL AFTER id_servicio,
ADD COLUMN valor_seleccionado ENUM('1','2','3','4','5') NULL COMMENT 'Cual de los 5 valores del tarifario' AFTER id_servicio_tarifario,
ADD COLUMN precio_costo DECIMAL(10,2) NULL COMMENT 'Costo del servicio tarifario' AFTER valor_seleccionado;

ALTER TABLE presupuesto_prestaciones
ADD CONSTRAINT fk_prestaciones_servicio_tarifario 
FOREIGN KEY (id_servicio_tarifario) REFERENCES servicios(id);

CREATE INDEX idx_prestaciones_servicio_tarifario ON presupuesto_prestaciones(id_servicio_tarifario);

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Confirmar transacción
COMMIT;

SELECT 'Migración completada exitosamente' as status;

-- Verificar estructura
SHOW TABLES LIKE '%zona%';
SHOW TABLES LIKE '%tarifario%';

DESCRIBE financiador_servicio_valores;
DESCRIBE tarifario_servicio_valores;
DESCRIBE presupuestos;
DESCRIBE presupuesto_prestaciones;
